/**
 * PostgreSQL-Nachweis, dass echte Datenbankänderungen den Snapshot-Hash der
 * Q&A-Zusammenfassung ändern (Stimme, neue Frage, Beitritt, Löschung durch Host
 * und durch Teilnehmende) und eine Quizstimme ihn nicht ändert.
 *
 * Opt-in über `RUN_PG_QA_SUMMARY_HASH_TESTS=1`; braucht `DATABASE_URL` und
 * `REDIS_URL`. Gemockt ist nur die Host-Tokenprüfung; Fragen, Stimmen,
 * Teilnehmer-Capabilities, Trigger und Kontextaufbau laufen echt.
 * Testdesign: docs/referat-thema-1/specs/2026-10-24-1c-tests-design.md (T5).
 */
import { createHash, randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

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

import { prisma } from '../db';
import { getRedis } from '../redis';
import { hashCapability } from '../lib/capabilityCrypto';
import { buildModerationPromptContext } from '../lib/moderationPromptContext';
import {
  packSummaryModerationPromptContext,
  prepareFreshModerationSummaryContext,
} from '../lib/moderationSummaryContext';
import { qaRouter } from '../routers/qa';

const RUN_PG = process.env['RUN_PG_QA_SUMMARY_HASH_TESTS'] === '1';
const ACCESS = { hostToken: 'host-token' } as const;
const PACKED_AT = new Date('2026-01-15T10:06:00.000Z');
const hostCaller = qaRouter.createCaller({ req: {} as never });

type Corpus = {
  readonly sessionId: string;
  readonly code: string;
  readonly participants: readonly { readonly id: string; readonly capability: string }[];
  readonly questionIds: readonly string[];
};

function keyHash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function code(prefix: string): string {
  return `${prefix}${randomUUID().replaceAll('-', '').slice(0, 5)}`.toUpperCase();
}

async function createQuestion(input: {
  sessionId: string;
  participantId: string;
  text: string;
}): Promise<string> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id
    FROM arsnova_create_qa_question(
      ${input.sessionId},
      ${input.participantId},
      ${input.text},
      ${keyHash(randomUUID())}::CHAR(64),
      'DISABLED'::"QaNlpStatus"
    )
  `;
  return rows[0]!.id;
}

async function changeVote(
  questionId: string,
  participantId: string,
  direction: 'UP' | 'DOWN',
): Promise<void> {
  await prisma.$queryRaw`
    SELECT *
    FROM arsnova_change_qa_vote(
      ${questionId},
      ${participantId},
      ${direction}::"QaVoteDirection"
    )
  `;
}

async function prepared(sessionId: string) {
  const result = await prepareFreshModerationSummaryContext({
    sessionId,
    locale: 'de',
    access: ACCESS,
    packedAt: PACKED_AT,
  });
  return result.request.promptContext;
}

async function snapshotHash(sessionId: string): Promise<string> {
  return (await prepared(sessionId)).snapshotHash;
}

async function questionVotesRevision(sessionId: string): Promise<string> {
  const revision = (await prepared(sessionId)).context.meta.revisions.questionVotes;
  if (revision.state !== 'available') throw new Error(`questionVotes revision ${revision.state}`);
  return revision.value;
}

async function sourceIds(sessionId: string): Promise<string[]> {
  return (await prepared(sessionId)).context.sources.map((source) => source.id);
}

describe.skipIf(!RUN_PG)('Q&A summary snapshot hash (PostgreSQL)', () => {
  const sessionIds: string[] = [];
  const sessionCodes: string[] = [];
  const quizIds: string[] = [];
  let platformBefore: {
    qaQuestionsTotal: bigint;
    maxQaQuestionsSingleSession: number;
    maxQaQuestionsStatisticUpdatedAt: Date | null;
    qaStatisticsTrackingStartedAt: Date | null;
    qaStatisticsProjectedAt: Date | null;
    updatedAt: Date;
  } | null = null;
  let platformCaptured = false;

  async function participantCount(sessionId: string): Promise<number> {
    return prisma.participant.count({ where: { sessionId } });
  }

  async function addParticipant(
    sessionId: string,
    nickname: string,
  ): Promise<{ id: string; capability: string }> {
    const capability = `participant-capability-${randomUUID()}`;
    const participant = await prisma.participant.create({
      data: {
        id: randomUUID(),
        sessionId,
        nickname,
        rejoinCapabilityHash: hashCapability(capability),
      },
    });
    return { id: participant.id, capability };
  }

  async function createCorpus(
    options: {
      readonly type?: 'Q_AND_A' | 'QUIZ';
      readonly status?: 'ACTIVE' | 'QUESTION_OPEN';
      readonly quizId?: string;
      readonly currentQuestion?: number;
    } = {},
  ): Promise<Corpus> {
    if (!platformCaptured) {
      platformBefore = await prisma.platformStatistic.findUnique({
        where: { id: 'default' },
        select: {
          qaQuestionsTotal: true,
          maxQaQuestionsSingleSession: true,
          maxQaQuestionsStatisticUpdatedAt: true,
          qaStatisticsTrackingStartedAt: true,
          qaStatisticsProjectedAt: true,
          updatedAt: true,
        },
      });
      platformCaptured = true;
    }
    const now = new Date();
    const session = await prisma.session.create({
      data: {
        id: randomUUID(),
        code: code('H'),
        type: options.type ?? 'Q_AND_A',
        status: options.status ?? 'ACTIVE',
        quizId: options.quizId,
        currentQuestion: options.currentQuestion,
        qaEnabled: true,
        qaOpen: true,
        qaModerationMode: false,
        qaClosesAt: new Date(now.getTime() + 3_600_000),
        expiresAt: new Date(now.getTime() + 7_200_000),
      },
    });
    sessionIds.push(session.id);
    sessionCodes.push(session.code);
    const participants = [
      await addParticipant(session.id, 'Ada'),
      await addParticipant(session.id, 'Grace'),
      await addParticipant(session.id, 'Linus'),
    ];
    const texts = [
      'Wie wird der Kontext für die Zusammenfassung begrenzt?',
      'Warum wartet der Host nicht auf das Modell?',
      'Was passiert, wenn sich die Quellen während der Inferenz ändern?',
    ];
    const questionIds: string[] = [];
    for (const [index, text] of texts.entries()) {
      questionIds.push(
        await createQuestion({
          sessionId: session.id,
          participantId: participants[index]!.id,
          text,
        }),
      );
    }
    return { sessionId: session.id, code: session.code, participants, questionIds };
  }

  async function deleteRedisKeys(): Promise<void> {
    const redis = getRedis();
    const patterns = [
      ...sessionIds.map((id) => `*${id}*`),
      ...sessionCodes.map((sessionCode) => `qf:*${sessionCode}*`),
    ];
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await redis.del(...keys);
    }
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    hostAuthMocks.extractHostTokenMock.mockReturnValue('host-token');
    hostAuthMocks.extractHostTokenFromConnectionParamsMock.mockReturnValue(null);
    hostAuthMocks.isHostSessionTokenValidMock.mockResolvedValue(true);
    await deleteRedisKeys();
  });

  afterAll(async () => {
    if (!platformCaptured) return;
    await deleteRedisKeys();
    if (sessionIds.length > 0) {
      await prisma.session.deleteMany({ where: { id: { in: sessionIds } } });
      await prisma.qaSessionStatisticProjection.deleteMany({
        where: { sessionId: { in: sessionIds } },
      });
    }
    if (quizIds.length > 0) {
      await prisma.quiz.deleteMany({ where: { id: { in: quizIds } } });
    }
    if (platformBefore) {
      await prisma.$executeRaw`
        UPDATE "PlatformStatistic"
        SET
          "qaQuestionsTotal" = ${platformBefore.qaQuestionsTotal},
          "maxQaQuestionsSingleSession" = ${platformBefore.maxQaQuestionsSingleSession},
          "maxQaQuestionsStatisticUpdatedAt" =
            ${platformBefore.maxQaQuestionsStatisticUpdatedAt},
          "qaStatisticsTrackingStartedAt" = ${platformBefore.qaStatisticsTrackingStartedAt},
          "qaStatisticsProjectedAt" = ${platformBefore.qaStatisticsProjectedAt},
          "updatedAt" = ${platformBefore.updatedAt}
        WHERE "id" = 'default'
      `;
    } else {
      await prisma.platformStatistic.deleteMany({ where: { id: 'default' } });
    }
  });

  it('T5.0: liefert ohne Änderung denselben Hash, auch beim direkten Packen am Cache vorbei', async () => {
    const corpus = await createCorpus();

    const first = await prepared(corpus.sessionId);
    const second = await prepared(corpus.sessionId);
    expect(second.snapshotHash).toBe(first.snapshotHash);
    // Themen und Blitzlicht sind in dieser Umgebung serverseitig bzw. je Session
    // deaktiviert; der Hash hängt damit nicht von Redis-Zustand ab.
    expect(first.context.topics).toMatchObject({ state: 'disabled' });
    expect(first.context.feedback).toMatchObject({ state: 'disabled' });

    const analysis = await buildModerationPromptContext({
      sessionId: corpus.sessionId,
      locale: 'de',
      access: ACCESS,
    });
    const directA = packSummaryModerationPromptContext({ analysis, packedAt: PACKED_AT });
    const directB = packSummaryModerationPromptContext({
      analysis: structuredClone(analysis),
      packedAt: new Date(PACKED_AT.getTime() + 60_000),
    });
    expect(directB.snapshotHash).toBe(directA.snapshotHash);
    expect(directA.snapshotHash).toBe(first.snapshotHash);
  });

  it('T5.1: ändert den Hash nach einer Q&A-Stimme und führt die neue Ranking-Revision', async () => {
    const corpus = await createCorpus();
    const before = await snapshotHash(corpus.sessionId);

    await changeVote(corpus.questionIds[0]!, corpus.participants[1]!.id, 'UP');

    const session = await prisma.session.findUniqueOrThrow({
      where: { id: corpus.sessionId },
      select: { qaRankingRevision: true },
    });
    expect(await snapshotHash(corpus.sessionId)).not.toBe(before);
    expect(await questionVotesRevision(corpus.sessionId)).toContain(
      `qa-ranking-v1:${session.qaRankingRevision}:`,
    );
  });

  it('T5.2: ändert den Hash nach einer neuen Frage und führt sie als Quelle', async () => {
    const corpus = await createCorpus();
    const before = await snapshotHash(corpus.sessionId);

    const newQuestionId = await createQuestion({
      sessionId: corpus.sessionId,
      participantId: corpus.participants[0]!.id,
      text: 'Welche Rolle spielt die Snapshot-Revision?',
    });

    expect(await snapshotHash(corpus.sessionId)).not.toBe(before);
    expect(await sourceIds(corpus.sessionId)).toContain(`qa-question:${newQuestionId}`);
  });

  it('T5.3: ändert den Hash nach einem Beitritt und führt Teilnehmer-Revision und -Anzahl', async () => {
    const corpus = await createCorpus();
    const before = await snapshotHash(corpus.sessionId);

    await addParticipant(corpus.sessionId, 'Margaret');

    const session = await prisma.session.findUniqueOrThrow({
      where: { id: corpus.sessionId },
      select: { participantRevision: true },
    });
    const count = await participantCount(corpus.sessionId);
    expect(count).toBe(4);
    expect(await snapshotHash(corpus.sessionId)).not.toBe(before);
    expect(await questionVotesRevision(corpus.sessionId)).toMatch(
      new RegExp(`:participants:${session.participantRevision}:${count}$`),
    );
  });

  it('T5.4a: ändert den Hash, wenn der Host eine Frage über qa.moderate löscht', async () => {
    const corpus = await createCorpus();
    const target = corpus.questionIds[0]!;
    const before = await prepared(corpus.sessionId);
    expect(before.context.sources.map((source) => source.id)).toContain(`qa-question:${target}`);

    await hostCaller.moderate({ sessionCode: corpus.code, questionId: target, action: 'DELETE' });

    expect(await snapshotHash(corpus.sessionId)).not.toBe(before.snapshotHash);
    expect(await sourceIds(corpus.sessionId)).not.toContain(`qa-question:${target}`);
  });

  it('T5.4b: ändert den Hash, wenn Teilnehmende ihre eigene Frage über qa.deleteOwn löschen', async () => {
    const corpus = await createCorpus();
    const target = corpus.questionIds[1]!;
    const author = corpus.participants[1]!;
    const before = await prepared(corpus.sessionId);
    expect(before.context.sources.map((source) => source.id)).toContain(`qa-question:${target}`);

    const participantCaller = qaRouter.createCaller({
      req: { headers: { 'x-participant-capability': author.capability } } as never,
    });
    await expect(
      participantCaller.deleteOwn({ questionId: target, participantId: author.id }),
    ).resolves.toEqual({ deleted: true });

    expect(await snapshotHash(corpus.sessionId)).not.toBe(before.snapshotHash);
    expect(await sourceIds(corpus.sessionId)).not.toContain(`qa-question:${target}`);
  });

  it('T5.5: Gegenprobe: lässt den Hash bei einer Quizstimme auf eine laufende Frage unverändert', async () => {
    const quiz = await prisma.quiz.create({
      data: {
        name: `qa-summary-hash-${randomUUID()}`,
        readingPhaseEnabled: false,
        questions: {
          create: [{ text: 'Was ist ein Snapshot-Hash?', type: 'FREETEXT', order: 0 }],
        },
      },
      include: { questions: true },
    });
    quizIds.push(quiz.id);
    const corpus = await createCorpus({
      type: 'QUIZ',
      status: 'ACTIVE',
      quizId: quiz.id,
      currentQuestion: 0,
    });
    const before = await prepared(corpus.sessionId);
    const rankingBefore = await prisma.session.findUniqueOrThrow({
      where: { id: corpus.sessionId },
      select: { qaRankingRevision: true },
    });

    await prisma.vote.create({
      data: {
        sessionId: corpus.sessionId,
        participantId: corpus.participants[0]!.id,
        questionId: quiz.questions[0]!.id,
        freeText: 'Eine Prüfsumme über den Kontext',
      },
    });

    const rankingAfter = await prisma.session.findUniqueOrThrow({
      where: { id: corpus.sessionId },
      select: { qaRankingRevision: true },
    });
    expect(rankingAfter.qaRankingRevision).toBe(rankingBefore.qaRankingRevision);
    expect(await snapshotHash(corpus.sessionId)).toBe(before.snapshotHash);
  });
});
