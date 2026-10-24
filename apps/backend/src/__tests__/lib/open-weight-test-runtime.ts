/**
 * In-Prozess-Test-Runtime für die Ende-zu-Ende-Suiten der Q&A-Zusammenfassung.
 *
 * Ein echter `node:http`-Server auf 127.0.0.1 mit freiem Port bildet die zwei
 * Endpunkte nach, die der Open-Weight-Client von llama-server nutzt:
 * `GET /slots?fail_on_no_slot=1` und `POST /v1/chat/completions`. Er speichert
 * Methode, Pfad, Header und die **rohen Bytes** des Bodys, so wie sie über den
 * Socket ankommen. Die Runtime ist kein Modell; sie antwortet mit einer festen,
 * vertragsgültigen Ausgabe (Fault-Injection und Gegenvarianten nach 4.1.3).
 */
import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  QA_SUMMARY_MODEL_OUTPUT_V2_CONTRACT_VERSION,
  QA_SUMMARY_V2_SCHEMA_VERSION,
} from '@arsnova/shared-types';
import { vi } from 'vitest';

/** Synthetisches Bearer-Token (32+ URL-sichere Zeichen), nur für Tests. */
export const TEST_RUNTIME_TOKEN = 'e2e-test-runtime-token-0123456789abcdef';
/** Erkennungszeichen der Modellaussage der Test-Runtime. */
export const TEST_RUNTIME_STATEMENT_TEXT = 'Aussage der Test-Runtime zur ersten gepackten Frage.';
export const TEST_RUNTIME_MODEL_VERSION = 'e2e-test-runtime';

export type RecordedRuntimeRequest = {
  readonly method: string;
  readonly path: string;
  readonly headers: IncomingHttpHeaders;
  /** Rohe Bytes des empfangenen Bodys, UTF-8-dekodiert, ohne erneute Serialisierung. */
  readonly rawBody: string;
};

export type TestRuntimeOptions = {
  /** Verzögerung vor der Antwort auf `POST /v1/chat/completions`. */
  readonly delayMs?: number;
  /** Latch: die Completion-Antwort wartet, bis dieses Promise erfüllt ist. */
  readonly hold?: Promise<void>;
  /** Aktion nach Empfang und vor der Antwort, z. B. eine DB-Änderung. */
  readonly beforeRespond?: (body: string) => Promise<void>;
  /** Ersetzt die Standardantwort der Completion. */
  readonly respond?: (body: string) => { status: number; body: string };
};

export type TestRuntime = {
  readonly baseUrl: string;
  readonly requests: RecordedRuntimeRequest[];
  /** Erfüllt, sobald der erste `POST /v1/chat/completions` vollständig empfangen ist. */
  readonly received: Promise<void>;
  close(): Promise<void>;
};

type ChatBody = { messages?: { role?: string; content?: string }[] };

/** Die User-Nachricht (fachlicher Kontext) aus einem rohen Completion-Body. */
export function userMessageOf(rawBody: string): string {
  const parsed = JSON.parse(rawBody) as ChatBody;
  const user = parsed.messages?.find((message) => message.role === 'user');
  if (typeof user?.content !== 'string') throw new Error('Body enthält keine User-Nachricht');
  return user.content;
}

/** Erste `qa-question:`-Quelle in der Reihenfolge der gesendeten Quellenliste. */
export function firstQaQuestionSourceId(rawBody: string): string {
  const context = JSON.parse(userMessageOf(rawBody)) as {
    sources?: { id?: string; kind?: string }[];
  };
  const source = context.sources?.find((item) => item.kind === 'qa-question');
  if (!source?.id) throw new Error('Kontext enthält keine qa-question-Quelle');
  return source.id;
}

/** Gültige `QaSummaryModelOutputV2` im Antwortformat des Clients (Status `ready`). */
export function defaultCompletionBody(rawBody: string): string {
  const content = {
    schemaVersion: QA_SUMMARY_V2_SCHEMA_VERSION,
    taskType: 'qa_summary',
    outputContract: QA_SUMMARY_MODEL_OUTPUT_V2_CONTRACT_VERSION,
    output: {
      status: 'ready',
      statements: [
        { text: TEST_RUNTIME_STATEMENT_TEXT, sourceIds: [firstQaQuestionSourceId(rawBody)] },
      ],
      suggestedNextSteps: [],
      limitations: [],
      modelVersion: TEST_RUNTIME_MODEL_VERSION,
    },
  };
  return completionEnvelope(JSON.stringify(content));
}

export function completionEnvelope(content: string): string {
  return JSON.stringify({
    model: TEST_RUNTIME_MODEL_VERSION,
    choices: [{ finish_reason: 'stop', message: { role: 'assistant', content } }],
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function startTestRuntime(options: TestRuntimeOptions = {}): Promise<TestRuntime> {
  const requests: RecordedRuntimeRequest[] = [];
  let markReceived: () => void = () => undefined;
  const received = new Promise<void>((resolve) => {
    markReceived = resolve;
  });

  const server: Server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const rawBody = Buffer.concat(chunks).toString('utf8');
      const path = req.url ?? '';
      requests.push({ method: req.method ?? '', path, headers: req.headers, rawBody });
      void (async () => {
        if (req.method === 'GET' && path === '/slots?fail_on_no_slot=1') {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end('[]');
          return;
        }
        if (req.method !== 'POST' || path !== '/v1/chat/completions') {
          res.writeHead(404).end();
          return;
        }
        markReceived();
        if (options.hold) await options.hold;
        if (options.delayMs) await wait(options.delayMs);
        if (options.beforeRespond) await options.beforeRespond(rawBody);
        const response = options.respond
          ? options.respond(rawBody)
          : { status: 200, body: defaultCompletionBody(rawBody) };
        if (res.destroyed) return;
        res.writeHead(response.status, { 'content-type': 'application/json' });
        res.end(response.body);
      })().catch((error: unknown) => {
        if (!res.destroyed) res.writeHead(500).end(String(error));
      });
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    requests,
    received,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}

/** Freier Port, auf dem garantiert niemand lauscht (Server gestartet und wieder geschlossen). */
export async function closedLoopbackUrl(): Promise<string> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return `http://127.0.0.1:${port}`;
}

/** Env für den echten Full-Context-Pfad gegen die Test-Runtime (per `vi.stubEnv`). */
export function useTestRuntimeEnv(
  runtime: Pick<TestRuntime, 'baseUrl'>,
  overrides: Readonly<Record<string, string>> = {},
): void {
  vi.stubEnv('OPEN_WEIGHT_LLM_ENABLED', 'true');
  vi.stubEnv('OPEN_WEIGHT_LLM_URL', runtime.baseUrl);
  vi.stubEnv('OPEN_WEIGHT_LLM_TOKEN', TEST_RUNTIME_TOKEN);
  vi.stubEnv('QA_SUMMARY_ENABLED', 'true');
  vi.stubEnv('WORD_CLOUD_SEMANTIC_ENABLED', 'false');
  for (const [key, value] of Object.entries(overrides)) vi.stubEnv(key, value);
}
