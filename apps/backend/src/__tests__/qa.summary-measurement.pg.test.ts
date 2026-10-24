/**
 * Opt-in lokale Messreihe zur Q&A-Zusammenfassung (Design Teil 2, Abschnitte 5,
 * 6 und 10): Rückkehrzeit und Gesamtdauer (M1/M2), Kosten der
 * Kontextbereitstellung (M3) und der Validierung (M4), Zahl der Kontextaufbauten
 * und Nutzlastgröße (M5) sowie die Gegenvariante V1 („keine Nachprüfung nach der
 * Inferenz“) gegen die Baseline B.
 *
 * Opt-in über `RUN_QA_SUMMARY_MEASUREMENT=1`; braucht `DATABASE_URL`, `REDIS_URL`
 * und `QA_SUMMARY_MEASUREMENT_OUT` (Zielpfad der JSON-Datei). Läuft nicht in der
 * CI, weil Zeitwerte dort nicht vergleichbar sind. Die Datei enthält **keine**
 * Zeit-Assertions; sie prüft nur, dass jeder Lauf einen Endstatus erreicht, und
 * schreibt alle Rohwerte samt Umgebung.
 *
 * Messinstrumente rufen die echten Funktionen unverändert auf. Gemockt ist nur
 * die Host-Tokenprüfung. Die Test-Runtime ist kein Modell (keine Modellzeit).
 */
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';
import { dirname } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const { hostAuthMocks } = vi.hoisted(() => ({
  hostAuthMocks: {
    extractHostTokenMock: vi.fn(),
    extractHostTokenFromConnectionParamsMock: vi.fn(() => null as string | null),
    isHostSessionTokenValidMock: vi.fn(),
  },
}));

vi.mock('../lib/hostAuth', async () => {
  const { buildHostAuthTestMock } = await import('./lib/hostAuth-vitest-mock');
  return buildHostAuthTestMock({
    extractHostToken: hostAuthMocks.extractHostTokenMock,
    extractHostTokenFromConnectionParams: hostAuthMocks.extractHostTokenFromConnectionParamsMock,
    isHostSessionTokenValid: hostAuthMocks.isHostSessionTokenValidMock,
  });
});

import {
  OpenWeightLlmOutputSchema,
  OpenWeightLlmRequestSchema,
  QaSummaryModelOutputV2Schema,
  type QaSummaryResultV2,
  type QaSummaryRuntimeV2DTO,
} from '@arsnova/shared-types';
import { prisma } from '../db';
import { getRedis } from '../redis';
import {
  assemblePreparedModerationSummaryContext,
  prepareFreshModerationSummaryContext,
  resolveQaSummaryAdapterPlan,
  type PreparedModerationSummaryContext,
} from '../lib/moderationSummaryContext';
import { resetOpenWeightLlmClientForTests } from '../lib/openWeightLlmClient';
import {
  getQaSummaryRuntime,
  resetQaSummaryQueueForTests,
  waitForQaSummaryIdleForTests,
  type QaSummaryContextPreparer,
} from '../lib/qaSummaryQueue';
import { qaRouter } from '../routers/qa';
import {
  TEST_RUNTIME_STATEMENT_TEXT,
  closedLoopbackUrl,
  defaultCompletionBody,
  startTestRuntime,
  useTestRuntimeEnv,
  userMessageOf,
  type TestRuntime,
} from './lib/open-weight-test-runtime';
import {
  REFERENCE_SCENARIO_PARTICIPANTS,
  capturePlatformStatistic,
  changeVote,
  cleanupFixtures,
  createFixtureRegistry,
  createReferenceScenario,
  restorePlatformStatistic,
  type PlatformStatisticSnapshot,
  type ReferenceScenario,
} from './lib/qa-summary-pg-fixture';

const RUN = process.env['RUN_QA_SUMMARY_MEASUREMENT'] === '1';
const HOST_TOKEN = `host-token-${randomUUID()}`;
const ACCESS = { hostToken: HOST_TOKEN } as const;
const hostCaller = qaRouter.createCaller({ req: {} as never });

/** Vorab festgelegt (Design 5 und 6). */
const WARMUP_RUNS = 3;
const MEASURED_RUNS = 20;
const VALIDATION_RUNS = 200;
const V1_RUNS = 10;
const V1_DELAY_MS = 2_000;
const TERMINAL_WAIT_MS = 30_000;
/** Packing-Cache-TTL (`MODERATION_PROMPT_PACKING_CACHE_TTL_MS` = 30 s) plus Abstand. */
const PACKING_CACHE_EXPIRY_STEP_MS = 31_000;
/**
 * `sequential` (Standard, Primärlauf): je Variante und Szenario alle Läufe am
 * Stück, B zuerst. `alternating` (Robustheitslauf): B- und V1-Läufe je Iteration
 * verschränkt, Reihenfolge B/V1 wechselt von Iteration zu Iteration.
 */
const V1_MODE =
  process.env['QA_SUMMARY_MEASUREMENT_V1_MODE'] === 'alternating' ? 'alternating' : 'sequential';
const MEASUREMENT_TESTS = ['m1m2m5', 'm3m4', 'v1'] as const;

type Phase = 'request' | 'job' | 'read' | 'other';

type CountedCall = { readonly phase: Phase; readonly real: boolean };

type RunTrace = {
  calls: CountedCall[];
  phase: Phase;
  /** V1: Ergebnis von prepare (2) dieses Auftrags. */
  secondPrepare: PreparedModerationSummaryContext | null;
};

const now = () => performance.now();

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function asV2Runtime(value: unknown): QaSummaryRuntimeV2DTO {
  const runtime = value as QaSummaryRuntimeV2DTO;
  if (runtime.schemaVersion !== 2) throw new Error('summary runtime is not V2');
  return runtime;
}

function resultSummary(result: QaSummaryResultV2 | null) {
  return {
    status: result?.status ?? null,
    effectiveMode: result?.execution.effectiveMode ?? null,
    fallbackReason: result?.execution.fallback?.reason ?? null,
    snapshotHash: result?.snapshotHash ?? null,
    hasRuntimeStatement:
      result?.statements.some((statement) => statement.text === TEST_RUNTIME_STATEMENT_TEXT) ??
      false,
  };
}

/**
 * Zählender Wrapper um den echten Queue-Hook `prepare`. Ruft
 * `prepareFreshModerationSummaryContext` unverändert auf. Mit `skipThird` (V1)
 * liefert der dritte Aufruf je Auftrag das Ergebnis des zweiten zurück, statt
 * neu aufzubauen.
 */
function countingPrepare(
  trace: RunTrace,
  options: { skipThird: boolean },
): QaSummaryContextPreparer {
  return async (input) => {
    const index = trace.calls.length + 1;
    if (options.skipThird && index === 3 && trace.secondPrepare) {
      trace.calls.push({ phase: trace.phase, real: false });
      return trace.secondPrepare;
    }
    trace.calls.push({ phase: trace.phase, real: true });
    const prepared = await prepareFreshModerationSummaryContext(input);
    if (index === 2) trace.secondPrepare = prepared;
    return prepared;
  };
}

describe.skipIf(!RUN)(
  'Q&A summary local measurement (PostgreSQL + Redis)',
  { timeout: 1_800_000 },
  () => {
    const registry = createFixtureRegistry();
    let platformBefore: PlatformStatisticSnapshot | null = null;
    /** `completed` wird erst gesetzt, wenn alle Messblöcke durchgelaufen sind. */
    const output: Record<string, unknown> = { completed: false };
    const testsCompleted: string[] = [];
    const scenarioQaVotes: number[] = [];

    async function scenario(): Promise<ReferenceScenario> {
      if (!platformBefore) platformBefore = await capturePlatformStatistic();
      const room = await createReferenceScenario({ registry });
      // Tatsächlich gespeicherte Q&A-Stimmen (statt eines festen Werts).
      scenarioQaVotes.push(
        await prisma.qaUpvote.count({ where: { qaQuestion: { sessionId: room.sessionId } } }),
      );
      return room;
    }

    async function deleteSessionRedisKeys(sessionId: string): Promise<number> {
      const redis = getRedis();
      const keys = await redis.keys(`*${sessionId}*`);
      if (keys.length > 0) await redis.del(...keys);
      return keys.length;
    }

    /**
     * Ein Auftrag über den Router. Wartet ohne Kontextaufbau auf das Ende des
     * Jobs (interner Zustand, sekundär), liest dann genau einmal über
     * `qa.summaryRuntime` (primär, was der Host sieht).
     */
    async function runJob(input: { room: ReferenceScenario; trace: RunTrace }) {
      const started = now();
      input.trace.phase = 'request';
      const requested = asV2Runtime(
        await hostCaller.requestSummary({ sessionId: input.room.sessionId, locale: 'de' }),
      );
      const requestMs = now() - started;
      input.trace.phase = 'job';
      let internal = getQaSummaryRuntime(input.room.sessionId);
      while (!internal.result || internal.result.status === 'pending') {
        if (now() - started > TERMINAL_WAIT_MS) throw new Error('Job erreichte keinen Endstatus');
        await new Promise((resolve) => setTimeout(resolve, 5));
        internal = getQaSummaryRuntime(input.room.sessionId);
      }
      const jobDoneMs = now() - started;
      input.trace.phase = 'read';
      const primary = asV2Runtime(
        await hostCaller.summaryRuntime({ sessionId: input.room.sessionId }),
      );
      const totalMs = now() - started;
      input.trace.phase = 'other';
      await waitForQaSummaryIdleForTests(TERMINAL_WAIT_MS);
      expect(primary.result?.status).toBeDefined();
      expect(primary.result?.status).not.toBe('pending');
      return {
        requestMs: round(requestMs),
        jobDoneMs: round(jobDoneMs),
        totalMs: round(totalMs),
        requestStatus: requested.result?.status ?? null,
        internal: resultSummary(internal.result),
        primary: resultSummary(primary.result),
      };
    }

    function resetForRun(trace: RunTrace, skipThird: boolean): void {
      trace.calls = [];
      trace.phase = 'other';
      trace.secondPrepare = null;
      resetQaSummaryQueueForTests({ prepare: countingPrepare(trace, { skipThird }) });
      resetOpenWeightLlmClientForTests();
    }

    beforeAll(async () => {
      hostAuthMocks.extractHostTokenMock.mockReturnValue(HOST_TOKEN);
      hostAuthMocks.extractHostTokenFromConnectionParamsMock.mockReturnValue(null);
      hostAuthMocks.isHostSessionTokenValidMock.mockResolvedValue(true);
      const [pg] = await prisma.$queryRaw<{ version: string }[]>`SELECT version()`;
      const redisInfo = await getRedis().info('server');
      output['environment'] = {
        startedAt: new Date().toISOString(),
        gitSha: process.env['QA_SUMMARY_MEASUREMENT_GIT_SHA'] ?? null,
        // `true`, wenn `git status --porcelain` beim Start nicht leer war.
        gitDirty:
          process.env['QA_SUMMARY_MEASUREMENT_GIT_DIRTY'] === undefined
            ? null
            : process.env['QA_SUMMARY_MEASUREMENT_GIT_DIRTY'] === 'true',
        cpuModel: cpus()[0]?.model ?? null,
        logicalCores: cpus().length,
        totalMemoryBytes: totalmem(),
        node: process.version,
        postgres: pg?.version ?? null,
        redis: /redis_version:(\S+)/.exec(redisInfo)?.[1] ?? null,
        fixture: {
          name: 'MODERATION_PROMPT_REFERENCE_*_FIXTURE_V1 (#456 Abschnitt 12)',
          participants: REFERENCE_SCENARIO_PARTICIPANTS,
          questions: 6,
          qaVotesPerScenario: scenarioQaVotes,
          locale: 'de',
        },
        settings: {
          warmupRuns: WARMUP_RUNS,
          measuredRuns: MEASURED_RUNS,
          validationRuns: VALIDATION_RUNS,
          v1Runs: V1_RUNS,
          v1DelayMs: V1_DELAY_MS,
          timer: 'performance.now()',
          v1Mode: V1_MODE,
        },
      };
    });

    afterAll(async () => {
      try {
        resetQaSummaryQueueForTests();
        resetOpenWeightLlmClientForTests();
        vi.useRealTimers();
        vi.unstubAllEnvs();
        if (platformBefore) {
          await cleanupFixtures(registry);
          await restorePlatformStatistic(platformBefore);
        }
      } finally {
        const target = process.env['QA_SUMMARY_MEASUREMENT_OUT'];
        if (target && output['environment']) {
          (output['environment'] as Record<string, unknown>)['endedAt'] = new Date().toISOString();
          output['testsCompleted'] = testsCompleted;
          output['completed'] = MEASUREMENT_TESTS.every((name) => testsCompleted.includes(name));
          mkdirSync(dirname(target), { recursive: true });
          writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`);
        }
      }
    });

    it('Rückkehrzeit, Gesamtdauer, Kontextaufbauten und Nutzlastgröße je Runtime-Bedingung', async () => {
      const room = await scenario();
      const trace: RunTrace = { calls: [], phase: 'other', secondPrepare: null };
      const conditions = [
        { name: 'D=0', delayMs: 0 },
        { name: 'D=2000', delayMs: 2_000 },
        { name: 'unreachable', delayMs: null },
      ] as const;
      const results: Record<string, unknown> = {};
      for (const condition of conditions) {
        const runs: unknown[] = [];
        for (let index = 0; index < WARMUP_RUNS + MEASURED_RUNS; index += 1) {
          resetForRun(trace, false);
          let runtime: TestRuntime | null = null;
          let runtimeUrl: string;
          if (condition.delayMs === null) {
            runtimeUrl = await closedLoopbackUrl();
          } else {
            runtime = await startTestRuntime({ delayMs: condition.delayMs });
            runtimeUrl = runtime.baseUrl;
          }
          useTestRuntimeEnv({ baseUrl: runtimeUrl });
          try {
            const run = await runJob({ room, trace });
            const completion = runtime?.requests.find(
              (request) => request.path === '/v1/chat/completions',
            );
            runs.push({
              warmup: index < WARMUP_RUNS,
              ...run,
              prepareHookCalls: trace.calls.length,
              prepareCallsByPhase: trace.calls.map((call) => call.phase),
              requestBodyBytes: completion ? Buffer.byteLength(completion.rawBody, 'utf8') : null,
              userMessageBytes: completion
                ? Buffer.byteLength(userMessageOf(completion.rawBody), 'utf8')
                : null,
            });
          } finally {
            await runtime?.close();
            vi.unstubAllEnvs();
          }
        }
        results[condition.name] = runs;
      }
      output['m1m2m5'] = {
        note: 'requestMs = Aufruf qa.requestSummary bis Antwort; totalMs = Aufruf bis Antwort des ersten qa.summaryRuntime nach Jobende (Jobende über getQaSummaryRuntime im 5-ms-Takt, ohne Kontextaufbau). Gleiches Szenario je Bedingung; zwischen den Läufen Queue und Client zurückgesetzt, Packing-Cache warm. prepareHookCalls zählt den Queue-Hook inkl. erstem Lesepfad-Abruf.',
        conditions: results,
      };
      testsCompleted.push('m1m2m5');
    });

    it('Kosten eines Kontextaufbaus (warm und kalt) und der Validierung', async () => {
      const room = await scenario();
      useTestRuntimeEnv({ baseUrl: 'http://127.0.0.1:9' });
      const prepareOnce = () =>
        prepareFreshModerationSummaryContext({
          sessionId: room.sessionId,
          locale: 'de',
          access: ACCESS,
        });

      const warm: unknown[] = [];
      await prepareOnce();
      for (let index = 0; index < WARMUP_RUNS + MEASURED_RUNS; index += 1) {
        const started = now();
        const prepared = await prepareOnce();
        warm.push({
          warmup: index < WARMUP_RUNS,
          ms: round(now() - started),
          cache: prepared.preview.cache,
        });
      }

      // Kalt: Packing-Cache-Eintrag über seine echte TTL ablaufen lassen (nur `Date`
      // wird verschoben; `performance.now()` bleibt echt) und Redis-Schlüssel der
      // Session löschen. Der Packing-Cache ist nicht exportiert; ein Eingriff in den
      // Produktivcode ist ausgeschlossen.
      const cold: unknown[] = [];
      vi.useFakeTimers({ toFake: ['Date'] });
      try {
        for (let index = 0; index < WARMUP_RUNS + MEASURED_RUNS; index += 1) {
          vi.setSystemTime(
            performance.timeOrigin + performance.now() + (index + 1) * PACKING_CACHE_EXPIRY_STEP_MS,
          );
          const deletedRedisKeys = await deleteSessionRedisKeys(room.sessionId);
          const started = now();
          const prepared = await prepareOnce();
          cold.push({
            warmup: index < WARMUP_RUNS,
            ms: round(now() - started),
            cache: prepared.preview.cache,
            deletedRedisKeys,
          });
        }
      } finally {
        vi.useRealTimers();
      }

      // M4: isolierte Validierung auf dem promptContext aus M3.
      const prepared = await prepareOnce();
      const plan = resolveQaSummaryAdapterPlan();
      const promptContext = prepared.request.promptContext;
      const fakeBody = JSON.stringify({
        messages: [{ role: 'user', content: JSON.stringify(promptContext.context) }],
      });
      const completion = JSON.parse(defaultCompletionBody(fakeBody)) as {
        choices: { message: { content: string } }[];
      };
      const wireOutput = JSON.parse(completion.choices[0]!.message.content) as {
        output: unknown;
      };
      const validation: unknown[] = [];
      for (let index = 0; index < WARMUP_RUNS + VALIDATION_RUNS; index += 1) {
        let started = now();
        const assembled = assemblePreparedModerationSummaryContext({
          promptContext,
          cache: 'hit',
          plan,
        });
        const assembleMs = now() - started;
        started = now();
        const requestParse = OpenWeightLlmRequestSchema.safeParse(assembled.request);
        const requestParseMs = now() - started;
        started = now();
        const clientOutputParse = OpenWeightLlmOutputSchema.safeParse(wireOutput);
        const clientOutputParseMs = now() - started;
        started = now();
        const modelOutputParse = QaSummaryModelOutputV2Schema.safeParse(wireOutput.output);
        const modelOutputParseMs = now() - started;
        expect(requestParse.success && clientOutputParse.success && modelOutputParse.success).toBe(
          true,
        );
        validation.push({
          warmup: index < WARMUP_RUNS,
          assembleMs: round(assembleMs),
          requestParseMs: round(requestParseMs),
          clientOutputParseMs: round(clientOutputParseMs),
          modelOutputParseMs: round(modelOutputParseMs),
          totalMs: round(assembleMs + requestParseMs + clientOutputParseMs),
        });
      }
      vi.unstubAllEnvs();

      output['m3'] = {
        note: 'prepareFreshModerationSummaryContext direkt. warm: Packing-Cache gefüllt. kalt: Cache-Eintrag per TTL abgelaufen (Date um je 31 s verschoben) und Redis-Schlüssel der Session gelöscht.',
        warm,
        cold,
      };
      output['m4'] = {
        note: 'assembleMs = assemblePreparedModerationSummaryContext (strikte Parses von Anfrage und Vorschau sowie Legacy-Projektion). requestParseMs = OpenWeightLlmRequestSchema.safeParse. clientOutputParseMs = OpenWeightLlmOutputSchema.safeParse (wie parseCompletion). modelOutputParseMs = QaSummaryModelOutputV2Schema.safeParse (Teilmenge der Client-Prüfung, nur berichtet). totalMs = assemble + request + clientOutput.',
        promptContextBytes: Buffer.byteLength(JSON.stringify(promptContext), 'utf8'),
        runs: validation,
      };
      testsCompleted.push('m3m4');
    });

    it('Gegenvariante ohne Nachprüfung nach der Inferenz gegen Baseline B', async () => {
      const variants = [
        { name: 'B', skipThird: false },
        { name: 'V1', skipThird: true },
      ] as const;
      type Variant = (typeof variants)[number];
      const scenarios = ['change', 'quiet'] as const;
      type Kind = (typeof scenarios)[number];
      type Cell = {
        readonly variant: Variant;
        readonly kind: Kind;
        readonly room: ReferenceScenario;
        readonly trace: RunTrace;
        readonly runs: unknown[];
        voter: number;
      };

      async function createCell(variant: Variant, kind: Kind): Promise<Cell> {
        const room = await scenario();
        // Frage C (PINNED) ist abstimmbar; Stimmen kommen von Teilnehmenden, die
        // C noch nicht bewertet haben (von hinten, je Lauf ein neuer).
        return {
          variant,
          kind,
          room,
          trace: { calls: [], phase: 'other', secondPrepare: null },
          runs: [],
          voter: room.participants.length - 1,
        };
      }

      async function runCell(cell: Cell, index: number, order: number): Promise<void> {
        const { room, trace } = cell;
        resetForRun(trace, cell.variant.skipThird);
        const voterId = room.participants[cell.voter]!.id;
        cell.voter -= 1;
        let voted = false;
        const runtime = await startTestRuntime({
          delayMs: V1_DELAY_MS,
          beforeRespond:
            cell.kind === 'change'
              ? async () => {
                  await changeVote(room.questionIdsByKey.C, voterId, 'UP');
                  voted = true;
                }
              : undefined,
        });
        useTestRuntimeEnv(runtime);
        try {
          const run = await runJob({ room, trace });
          const counted = [...trace.calls];
          const fresh = await hostCaller.summaryContextPreview({
            sessionId: room.sessionId,
            locale: 'de',
          });
          const freshHash = fresh.promptContext.snapshotHash;
          const staleBy = (summary: ReturnType<typeof resultSummary>) => ({
            // Abschnitt 6: ready, dessen Hash nicht dem Stand bei Auslieferung entspricht.
            section6: summary.status === 'ready' && summary.snapshotHash !== freshHash,
            // Abschnitt 10: ready mit Modellaussage, obwohl sich der Stand geändert hat.
            section10: summary.status === 'ready' && summary.hasRuntimeStatement && voted,
          });
          cell.runs.push({
            warmup: index < WARMUP_RUNS,
            iteration: index,
            orderInIteration: order,
            ...run,
            dataChanged: voted,
            freshPreviewHash: freshHash,
            prepareHookCalls: counted.length,
            realPrepares: counted.filter((call) => call.real).length,
            prepareCallsByPhase: counted.map((call) => call.phase),
            stalePrimary: staleBy(run.primary),
            staleSecondary: staleBy(run.internal),
          });
        } finally {
          await runtime.close();
          vi.unstubAllEnvs();
        }
      }

      const results: Record<string, unknown> = {};
      if (V1_MODE === 'sequential') {
        for (const variant of variants) {
          for (const kind of scenarios) {
            const cell = await createCell(variant, kind);
            for (let index = 0; index < WARMUP_RUNS + V1_RUNS; index += 1) {
              await runCell(cell, index, 0);
            }
            results[`${variant.name}/${kind}`] = cell.runs;
          }
        }
      } else {
        for (const kind of scenarios) {
          const cells = [await createCell(variants[0], kind), await createCell(variants[1], kind)];
          for (let index = 0; index < WARMUP_RUNS + V1_RUNS; index += 1) {
            // Gerade Iterationen B zuerst, ungerade V1 zuerst.
            const ordered = index % 2 === 0 ? cells : [cells[1]!, cells[0]!];
            for (const [order, cell] of ordered.entries()) await runCell(cell, index, order);
          }
          for (const cell of cells) results[`${cell.variant.name}/${kind}`] = cell.runs;
        }
      }
      output['v1'] = {
        mode: V1_MODE,
        note: 'D = 2000 ms. change: Stimme in beforeRespond (nach der Verzögerung, vor der Antwort). primary = erster qa.summaryRuntime-Abruf nach Jobende; secondary = interner Queue-Zustand (getQaSummaryRuntime, ohne Kontextaufbau) direkt nach Jobende. freshPreviewHash = qa.summaryContextPreview direkt nach dem primären Abruf (nicht mitgezählt).',
        runs: results,
      };
      testsCompleted.push('v1');
    });
  },
);
