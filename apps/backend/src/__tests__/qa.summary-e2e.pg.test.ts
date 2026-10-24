/**
 * Ende-zu-Ende-Nachweis der Q&A-Zusammenfassung: echter tRPC-Router
 * (`qa.summaryContextPreview`, `qa.requestSummary`, `qa.summaryRuntime`,
 * `qa.moderate`) → Queue → Kontextaufbau → Open-Weight-Client → echtes HTTP →
 * In-Prozess-Test-Runtime auf 127.0.0.1. Gegen PostgreSQL und Redis mit der
 * #456-Referenzfixture (sechs Fragen, N = 200 Teilnehmende).
 *
 * Opt-in über `RUN_PG_QA_SUMMARY_E2E_TESTS=1`; braucht `DATABASE_URL` und
 * `REDIS_URL`. Gemockt ist nur die Host-Tokenprüfung (wie in der Hash-Suite).
 * Die Test-Runtime ist kein Modell: Sie antwortet mit einer festen,
 * vertragsgültigen Ausgabe und dient nur der Fault-Injection.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  MODERATION_PROMPT_DEFINITION_SET_VERSION,
  QA_SUMMARY_TECHNICAL_INSTRUCTION_VERSION,
  type QaSummaryContextPreviewDTO,
  type QaSummaryResultV2,
  type QaSummaryRuntimeV2DTO,
} from '@arsnova/shared-types';
import { canonicalModerationPromptJson } from '../lib/moderationPromptContextPacking';
import {
  QA_SUMMARY_TECHNICAL_DEFINITION_TEXT,
  QA_SUMMARY_TECHNICAL_INSTRUCTION_TEXT,
} from '../lib/moderationSummaryContext';
import { resetOpenWeightLlmClientForTests } from '../lib/openWeightLlmClient';
import {
  getQaSummaryQueueMetrics,
  resetQaSummaryQueueForTests,
  waitForQaSummaryIdleForTests,
} from '../lib/qaSummaryQueue';
import { prisma } from '../db';
import { qaRouter } from '../routers/qa';
import {
  TEST_RUNTIME_MODEL_VERSION,
  TEST_RUNTIME_STATEMENT_TEXT,
  TEST_RUNTIME_TOKEN,
  closedLoopbackUrl,
  completionEnvelope,
  firstQaQuestionSourceId,
  startTestRuntime,
  useTestRuntimeEnv,
  userMessageOf,
  type RecordedRuntimeRequest,
  type TestRuntime,
  type TestRuntimeOptions,
} from './lib/open-weight-test-runtime';
import {
  capturePlatformStatistic,
  changeVote,
  cleanupFixtures,
  createFixtureRegistry,
  createReferenceScenario,
  createReleasedQuiz,
  deleteFixtureRedisKeys,
  quizVote,
  restorePlatformStatistic,
  type SessionOptions,
  type PlatformStatisticSnapshot,
  type ReferenceScenario,
} from './lib/qa-summary-pg-fixture';

const RUN_PG = process.env['RUN_PG_QA_SUMMARY_E2E_TESTS'] === '1';
const HOST_TOKEN = `host-token-${randomUUID()}`;
const hostCaller = qaRouter.createCaller({ req: {} as never });
/** Obergrenze für das Warten auf einen Endstatus; der Normalfall liegt weit darunter. */
const TERMINAL_WAIT_MS = 15_000;

/**
 * Oberste Schlüssel des Bodys, wie `buildChatCompletionBody` in
 * `apps/backend/src/lib/openWeightLlmClient.ts` sie für `qa_summary` V2 setzt.
 */
const CHAT_COMPLETION_TOP_LEVEL_KEYS = [
  'chat_template_kwargs',
  'max_tokens',
  'messages',
  'model',
  'reasoning_effort',
  'response_format',
  'stream',
  'temperature',
] as const;

type ChatMessage = { readonly role: string; readonly content: string };

function asV2Runtime(value: unknown): QaSummaryRuntimeV2DTO {
  const runtime = value as QaSummaryRuntimeV2DTO;
  if (runtime.schemaVersion !== 2) throw new Error('summary runtime is not V2');
  return runtime;
}

function completionRequests(runtime: TestRuntime): RecordedRuntimeRequest[] {
  return runtime.requests.filter(
    (request) => request.method === 'POST' && request.path === '/v1/chat/completions',
  );
}

/** Erste abweichende Byteposition (UTF-8) mit kurzem Ausschnitt, sonst `null`. */
function firstByteDifference(actual: string, expected: string): string | null {
  const a = Buffer.from(actual, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.equals(b)) return null;
  let index = 0;
  while (index < a.length && index < b.length && a[index] === b[index]) index += 1;
  const excerpt = (buffer: Buffer) =>
    buffer.subarray(Math.max(0, index - 40), index + 60).toString('utf8');
  return `Byte ${index} (Länge ${a.length} statt ${b.length}): gesendet …${excerpt(a)}… erwartet …${excerpt(b)}…`;
}

/** Bricht mit klarer Meldung ab, statt auf den globalen Test-Timeout zu warten. */
async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Kein Aussagetext und keine Modellversion der Test-Runtime im Ergebnis. */
function expectNoRuntimeStatement(result: QaSummaryResultV2, runtimeTexts: readonly string[]) {
  const texts = [...result.statements, ...result.suggestedNextSteps].map((item) => item.text);
  for (const runtimeText of runtimeTexts) expect(texts).not.toContain(runtimeText);
  expect(result.modelVersion).not.toBe(TEST_RUNTIME_MODEL_VERSION);
}

function messagesOf(rawBody: string): ChatMessage[] {
  return (JSON.parse(rawBody) as { messages: ChatMessage[] }).messages;
}

/**
 * Der Aufbau der Referenzfixture (200 Teilnehmende, 282 Stimmen über
 * `arsnova_change_qa_vote`) dauert lokal einige Sekunden je Test.
 */
const TEST_TIMEOUT_MS = 60_000;

describe.skipIf(!RUN_PG)(
  'Q&A summary end to end through the runtime (PostgreSQL + Redis)',
  { timeout: TEST_TIMEOUT_MS },
  () => {
    const registry = createFixtureRegistry();
    const runtimes: TestRuntime[] = [];
    let platformBefore: PlatformStatisticSnapshot | null = null;

    async function scenario(
      session?: Omit<SessionOptions, 'registry'>,
    ): Promise<ReferenceScenario> {
      if (!platformBefore) platformBefore = await capturePlatformStatistic();
      return createReferenceScenario({ registry, session });
    }

    async function runtimeWith(
      options: TestRuntimeOptions = {},
      env: Readonly<Record<string, string>> = {},
    ): Promise<TestRuntime> {
      const runtime = await startTestRuntime(options);
      runtimes.push(runtime);
      useTestRuntimeEnv(runtime, env);
      return runtime;
    }

    async function preview(sessionId: string): Promise<QaSummaryContextPreviewDTO> {
      return hostCaller.summaryContextPreview({ sessionId, locale: 'de' });
    }

    async function requestSummary(sessionId: string): Promise<QaSummaryRuntimeV2DTO> {
      return asV2Runtime(await hostCaller.requestSummary({ sessionId, locale: 'de' }));
    }

    /** Fragt `qa.summaryRuntime` ab, bis der Status nicht mehr `pending` ist (begrenzt). */
    async function waitForTerminal(sessionId: string): Promise<QaSummaryRuntimeV2DTO> {
      const started = Date.now();
      for (;;) {
        const runtime = asV2Runtime(await hostCaller.summaryRuntime({ sessionId }));
        if (runtime.result && runtime.result.status !== 'pending') return runtime;
        if (Date.now() - started > TERMINAL_WAIT_MS) {
          throw new Error(
            `summaryRuntime blieb ${TERMINAL_WAIT_MS} ms lang ${runtime.result?.status ?? 'leer'}`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }

    beforeEach(async () => {
      vi.clearAllMocks();
      hostAuthMocks.extractHostTokenMock.mockReturnValue(HOST_TOKEN);
      hostAuthMocks.extractHostTokenFromConnectionParamsMock.mockReturnValue(null);
      hostAuthMocks.isHostSessionTokenValidMock.mockResolvedValue(true);
      resetQaSummaryQueueForTests();
      resetOpenWeightLlmClientForTests();
      await deleteFixtureRedisKeys(registry);
    });

    afterEach(async () => {
      try {
        await waitForQaSummaryIdleForTests(TERMINAL_WAIT_MS);
      } finally {
        resetQaSummaryQueueForTests();
        resetOpenWeightLlmClientForTests();
        await Promise.all(runtimes.splice(0).map((runtime) => runtime.close()));
        vi.unstubAllEnvs();
      }
    });

    afterAll(async () => {
      if (!platformBefore) return;
      await cleanupFixtures(registry);
      await restorePlatformStatistic(platformBefore);
    });

    it('sendet genau den fachlichen Kontext der Host-Vorschau an die Runtime und liefert eine gebundene Modellaussage', async () => {
      const room = await scenario();
      const runtime = await runtimeWith();

      const shown = await preview(room.sessionId);
      expect(shown.selectedMode).toBe('full-context');

      const requested = await requestSummary(room.sessionId);
      expect(requested.result?.status).toBe('pending');
      const final = await waitForTerminal(room.sessionId);

      const completions = completionRequests(runtime);
      expect(completions).toHaveLength(1);
      const rawBody = completions[0]!.rawBody;
      expect(completions[0]!.headers['authorization']).toBe(`Bearer ${TEST_RUNTIME_TOKEN}`);

      // (1) Gleicher Revisionsstand.
      expect(final.result!.snapshotHash).toBe(shown.promptContext.snapshotHash);

      // (2) User-Nachricht bytegleich mit dem kanonischen Kontext der Vorschau.
      const expectedUser = canonicalModerationPromptJson(shown.promptContext.context);
      const messages = messagesOf(rawBody);
      expect(messages.map((message) => message.role)).toEqual(['system', 'system', 'user']);
      expect(firstByteDifference(userMessageOf(rawBody), expectedUser)).toBeNull();
      // Auch auf Ebene der rohen Bytes: der JSON-kodierte Kontext steht so im Body.
      expect(rawBody).toContain(JSON.stringify(expectedUser));

      // (3) System-Nachrichten = Instruktion und Definition der von der Vorschau genannten Versionen.
      expect(shown.instructionVersion).toBe(QA_SUMMARY_TECHNICAL_INSTRUCTION_VERSION);
      expect(shown.definitionVersion).toBe(MODERATION_PROMPT_DEFINITION_SET_VERSION);
      expect(messages[0]!.content).toBe(QA_SUMMARY_TECHNICAL_INSTRUCTION_TEXT);
      expect(messages[1]!.content).toBe(QA_SUMMARY_TECHNICAL_DEFINITION_TEXT);
      expect(messages[1]!.content).toContain(shown.definitionVersion);

      // (4) ready, full-context, Aussage an eine gepackte Q&A-Quelle gebunden.
      const result = final.result!;
      expect(result.status).toBe('ready');
      expect(result.execution).toEqual({
        attemptedMode: 'full-context',
        effectiveMode: 'full-context',
        fallback: null,
      });
      expect(result.statements).toHaveLength(1);
      expect(result.statements[0]!.text).toBe(TEST_RUNTIME_STATEMENT_TEXT);
      const [citedId] = result.statements[0]!.sourceIds;
      const packedSource = shown.promptContext.context.sources.find(
        (source) => source.id === citedId,
      );
      expect(packedSource).toMatchObject({ kind: 'qa-question', content: { state: 'included' } });
      expect(result.sources.map((source) => source.id)).toEqual([citedId]);
    });

    it('lässt Host-Token, Sitzungs- und Teilnehmendenkennungen sowie Hüllenfelder nicht in den Runtime-Body', async () => {
      const room = await scenario();
      const runtime = await runtimeWith();

      const shown = await preview(room.sessionId);
      await requestSummary(room.sessionId);
      const final = await waitForTerminal(room.sessionId);
      expect(final.result!.status).toBe('ready');

      const completions = completionRequests(runtime);
      expect(completions).toHaveLength(1);
      const rawBody = completions[0]!.rawBody;

      expect(rawBody).not.toContain(HOST_TOKEN);
      expect(rawBody).not.toContain(room.sessionId);
      expect(rawBody).not.toContain(room.code);
      for (const participant of room.participants) {
        expect(rawBody).not.toContain(participant.id);
      }
      expect(rawBody).not.toContain(shown.promptContext.snapshotHash);
      expect(rawBody).not.toContain(shown.promptContext.packedAt);
      expect(rawBody).not.toContain('"snapshotHash"');
      expect(rawBody).not.toContain('"packedAt"');
      expect(rawBody).not.toContain('"budget"');
      expect(rawBody).not.toContain(JSON.stringify(shown.promptContext.budget));

      expect(rawBody).toContain('moderation-domain-context-v1');
      expect(Object.keys(JSON.parse(rawBody) as Record<string, unknown>).sort()).toEqual([
        ...CHAT_COMPLETION_TOP_LEVEL_KEYS,
      ]);
    });

    it('sendet nach einer Stimme zwischen Vorschau und Auftrag den neuen Stand statt der Vorschau', async () => {
      const room = await scenario();
      const runtime = await runtimeWith();

      const shown = await preview(room.sessionId);
      // Frage C ist PINNED und damit abstimmbar; der letzte Teilnehmende hat noch nicht abgestimmt.
      await changeVote(room.questionIdsByKey.C, room.participants.at(-1)!.id, 'UP');
      await requestSummary(room.sessionId);
      const final = await waitForTerminal(room.sessionId);
      expect(final.result!.status).toBe('ready');

      const completions = completionRequests(runtime);
      expect(completions).toHaveLength(1);
      const sentUser = userMessageOf(completions[0]!.rawBody);

      // (1) Hash der Vorschau ≠ Hash des Ergebnisses.
      expect(final.result!.snapshotHash).not.toBe(shown.promptContext.snapshotHash);
      // (2) User-Nachricht ≠ Kontext der Vorschau.
      expect(sentUser).not.toBe(canonicalModerationPromptJson(shown.promptContext.context));
      // (3) User-Nachricht = Kontext einer frischen Vorschau nach der Stimme.
      const fresh = await preview(room.sessionId);
      expect(sentUser).toBe(canonicalModerationPromptJson(fresh.promptContext.context));
      expect(final.result!.snapshotHash).toBe(fresh.promptContext.snapshotHash);
    });
    it('übernimmt keine Modellantwort mit fremder Ausgabe-Version und fällt mit invalid_response zurück', async () => {
      const room = await scenario();
      const foreignText = 'Aussage einer fremden Ausgabe-Version.';
      const runtime = await runtimeWith({
        // Gekennzeichnete Negativprobe: sonst gültige Ausgabe der Version 1
        // (`result` statt `output`), deren Quelle aus der V2-Anfrage stammt.
        respond: (body) => ({
          status: 200,
          body: completionEnvelope(
            JSON.stringify({
              schemaVersion: 1,
              taskType: 'qa_summary',
              result: {
                status: 'ready',
                statements: [{ text: foreignText, sourceIds: [firstQaQuestionSourceId(body)] }],
                suggestedNextSteps: [],
                limitations: [],
                modelVersion: TEST_RUNTIME_MODEL_VERSION,
              },
            }),
          ),
        }),
      });

      const requested = await requestSummary(room.sessionId);
      expect(requested.result?.status).toBe('pending');
      const final = await waitForTerminal(room.sessionId);

      expect(completionRequests(runtime)).toHaveLength(1);
      const result = final.result!;
      // „Regelbasiert“ heißt im Code: deterministischer extraktiver Fallback ohne Modell.
      expect(result.execution).toMatchObject({
        attemptedMode: 'full-context',
        effectiveMode: 'extractive',
        fallback: { mode: 'extractive', reason: 'invalid_response' },
      });
      expectNoRuntimeStatement(result, [foreignText, TEST_RUNTIME_STATEMENT_TEXT]);
      // Queue danach frei.
      await waitForQaSummaryIdleForTests(TERMINAL_WAIT_MS);
      expect(getQaSummaryQueueMetrics()).toMatchObject({ queueLength: 0, running: 0, failed: 0 });
    });

    it('lässt den Host nicht auf die Runtime warten: requestSummary kehrt pending zurück, solange die Runtime die Antwort hält', async () => {
      const room = await scenario();
      let latchOpen = true;
      let release: () => void = () => undefined;
      const hold = new Promise<void>((resolve) => {
        release = () => {
          latchOpen = false;
          resolve();
        };
      });
      const runtime = await runtimeWith({ hold });

      try {
        // Ein synchroner Job würde hier bis zur Runtime-Antwort blockieren; die kommt
        // erst nach dem Lösen des Latches unten. Deshalb begrenzt warten.
        const requested = await withTimeout(
          requestSummary(room.sessionId),
          5_000,
          'requestSummary kehrte nicht zurück, solange die Runtime die Antwort hielt',
        );
        await withTimeout(
          runtime.received,
          5_000,
          'Runtime hat den Completion-Request nicht empfangen',
        );

        // (1) Mutation aufgelöst und pending, Request empfangen, Latch offen.
        expect(requested.result?.status).toBe('pending');
        expect(completionRequests(runtime)).toHaveLength(1);
        expect(latchOpen).toBe(true);
        // (2) summaryRuntime meldet weiter pending.
        const during = asV2Runtime(await hostCaller.summaryRuntime({ sessionId: room.sessionId }));
        expect(during.result?.status).toBe('pending');
        expect(latchOpen).toBe(true);
      } finally {
        release();
      }

      // (3) Nach dem Lösen wird ready erreicht.
      const final = await waitForTerminal(room.sessionId);
      expect(final.result!.status).toBe('ready');
      expect(final.result!.execution.effectiveMode).toBe('full-context');
    });

    it('meldet bei nicht erreichbarer Runtime erst pending und dann einen Fallback mit Grund unavailable', async () => {
      const room = await scenario();
      useTestRuntimeEnv({ baseUrl: await closedLoopbackUrl() });

      const requested = await requestSummary(room.sessionId);
      expect(requested.result?.status).toBe('pending');
      const final = await waitForTerminal(room.sessionId);

      expect(final.result!.execution).toMatchObject({
        attemptedMode: 'full-context',
        effectiveMode: 'extractive',
        fallback: { mode: 'extractive', reason: 'unavailable' },
      });
      expectNoRuntimeStatement(final.result!, [TEST_RUNTIME_STATEMENT_TEXT]);
    });

    it('bricht eine zu langsame Runtime nach dem Client-Timeout ab und meldet den Grund timeout', async () => {
      const room = await scenario();
      // Client-Timeout 1 s (kleinster erlaubter Wert). Das Queue-Wall-Clock ist laut
      // `resolveEffectiveQaSummaryTimeoutMs` (qaSummaryConfig.ts) max(QA_SUMMARY_TIMEOUT_MS,
      // OPEN_WEIGHT_LLM_SUMMARY_TIMEOUT_MS) = max(90 000, 1 000) = 90 000 ms. Es greift
      // also der Client-Timeout (`classifyCaughtError` → `timeout`), nicht die Queue.
      const timeoutMs = 1_000;
      const runtime = await runtimeWith(
        { delayMs: 2_500 },
        { OPEN_WEIGHT_LLM_SUMMARY_TIMEOUT_MS: String(timeoutMs) },
      );

      const started = performance.now();
      const requested = await requestSummary(room.sessionId);
      expect(requested.result?.status).toBe('pending');
      const final = await waitForTerminal(room.sessionId);
      const totalMs = performance.now() - started;

      expect(completionRequests(runtime)).toHaveLength(1);
      expect(final.result!.execution).toMatchObject({
        attemptedMode: 'full-context',
        effectiveMode: 'extractive',
        fallback: { mode: 'extractive', reason: 'timeout' },
      });
      expectNoRuntimeStatement(final.result!, [TEST_RUNTIME_STATEMENT_TEXT]);
      // Der Queue-Timeout hat nicht gegriffen.
      expect(getQaSummaryQueueMetrics().timeouts).toBe(0);
      expect(totalMs).toBeLessThan(timeoutMs + 2_000);
    });

    it('verwirft die Modellaussage als source_changed, wenn sich während der Inferenz eine Stimme ändert', async () => {
      const room = await scenario();
      const runtime = await runtimeWith({
        // Während des Runtime-Aufrufs, vor der Antwort: echte Stimme über die DB-Funktion.
        beforeRespond: async () => {
          await changeVote(room.questionIdsByKey.C, room.participants.at(-1)!.id, 'UP');
        },
      });

      await requestSummary(room.sessionId);
      const final = await waitForTerminal(room.sessionId);
      const fresh = await preview(room.sessionId);

      const completions = completionRequests(runtime);
      expect(completions).toHaveLength(1);
      // Gesendet wurde der Stand vor der Stimme.
      expect(userMessageOf(completions[0]!.rawBody)).not.toBe(
        canonicalModerationPromptJson(fresh.promptContext.context),
      );

      const result = final.result!;
      expect(result.execution).toMatchObject({
        attemptedMode: 'full-context',
        effectiveMode: 'extractive',
        fallback: { reason: 'source_changed' },
      });
      expectNoRuntimeStatement(result, [TEST_RUNTIME_STATEMENT_TEXT]);
      expect(result.snapshotHash).toBe(fresh.promptContext.snapshotHash);
    });

    it('verwirft die Modellaussage als source_changed und entfernt die Quelle, wenn der Host die zitierte Frage während der Inferenz löscht', async () => {
      const room = await scenario();
      let deleted: { sourceId: string; questionId: string; text: string } | null = null;
      const runtime = await runtimeWith({
        // Löscht genau die Frage, die die Antwort der Runtime zitiert.
        beforeRespond: async (body) => {
          const sourceId = firstQaQuestionSourceId(body);
          const questionId = sourceId.slice('qa-question:'.length);
          const { text } = await prisma.qaQuestion.findUniqueOrThrow({
            where: { id: questionId },
            select: { text: true },
          });
          deleted = { sourceId, questionId, text };
          await hostCaller.moderate({ sessionCode: room.code, questionId, action: 'DELETE' });
        },
      });

      await requestSummary(room.sessionId);
      const final = await waitForTerminal(room.sessionId);

      expect(completionRequests(runtime)).toHaveLength(1);
      expect(deleted).not.toBeNull();
      const { sourceId: deletedId, questionId, text: deletedText } = deleted!;
      // qa.moderate DELETE entfernt die Frage physisch.
      await expect(prisma.qaQuestion.count({ where: { id: questionId } })).resolves.toBe(0);

      const result = final.result!;
      expect(result.execution.fallback?.reason).toBe('source_changed');
      expectNoRuntimeStatement(result, [TEST_RUNTIME_STATEMENT_TEXT]);
      expect(result.sources.map((source) => source.id)).not.toContain(deletedId);
      for (const statement of [...result.statements, ...result.suggestedNextSteps]) {
        expect(statement.sourceIds).not.toContain(deletedId);
        expect(statement.text).not.toContain(deletedText);
      }
      expect(JSON.stringify(result)).not.toContain(deletedId);
      expect(JSON.stringify(result)).not.toContain(deletedText);
    });

    it('Kontrolle: bleibt bei einer Quizstimme auf eine laufende Frage während der Inferenz ready', async () => {
      const quiz = await createReleasedQuiz(registry);
      const room = await scenario(quiz.sessionOptions);
      const runtime = await runtimeWith({
        beforeRespond: async () => {
          await quizVote({
            sessionId: room.sessionId,
            participantId: room.participants[0]!.id,
            question: quiz.running,
          });
        },
      });

      await requestSummary(room.sessionId);
      const final = await waitForTerminal(room.sessionId);

      expect(completionRequests(runtime)).toHaveLength(1);
      // Die Quizstimme ist tatsächlich während der Inferenz gespeichert worden.
      await expect(
        prisma.vote.count({ where: { sessionId: room.sessionId, questionId: quiz.running.id } }),
      ).resolves.toBe(1);
      expect(final.result!.status).toBe('ready');
      expect(final.result!.execution).toEqual({
        attemptedMode: 'full-context',
        effectiveMode: 'full-context',
        fallback: null,
      });
      expect(final.result!.statements.map((statement) => statement.text)).toEqual([
        TEST_RUNTIME_STATEMENT_TEXT,
      ]);
    });
  },
);
