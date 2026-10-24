/**
 * Gemeinsame PostgreSQL-Fixture der Q&A-Summary-Suiten (Snapshot-Hash,
 * Ende-zu-Ende, Messung). Alle Fragen und Q&A-Stimmen entstehen über die
 * echten DB-Funktionen `arsnova_create_qa_question` und
 * `arsnova_change_qa_vote`, damit Trigger, Zähler und Revisionen echt laufen.
 *
 * Nur für opt-in Suiten mit `DATABASE_URL` und `REDIS_URL`.
 */
import { createHash, randomUUID } from 'node:crypto';
import {
  MODERATION_PROMPT_REFERENCE_RANKING_FIXTURE_V1,
  MODERATION_PROMPT_REFERENCE_TEXT_FIXTURE_V1,
} from '@arsnova/shared-types';
import { prisma } from '../../db';
import { getRedis } from '../../redis';
import { hashCapability } from '../../lib/capabilityCrypto';

export type ReferenceQuestionKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type FixtureParticipant = { readonly id: string; readonly capability: string };

/** Sammelt alles, was eine Suite anlegt, damit `cleanupFixtures` es wieder entfernt. */
export type FixtureRegistry = {
  readonly sessionIds: string[];
  readonly sessionCodes: string[];
  readonly quizIds: string[];
};

export function createFixtureRegistry(): FixtureRegistry {
  return { sessionIds: [], sessionCodes: [], quizIds: [] };
}

export function keyHash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function uniqueSessionCode(prefix: string): string {
  return `${prefix}${randomUUID().replaceAll('-', '').slice(0, 5)}`.toUpperCase();
}

export async function createQuestion(input: {
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

export async function changeVote(
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

export async function addParticipant(
  sessionId: string,
  nickname: string,
): Promise<FixtureParticipant> {
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

export type SessionOptions = {
  readonly registry: FixtureRegistry;
  readonly codePrefix?: string;
  readonly type?: 'Q_AND_A' | 'QUIZ';
  readonly status?: 'ACTIVE' | 'QUESTION_OPEN';
  readonly quizId?: string;
  readonly currentQuestion?: number;
  readonly questionProgress?: Record<string, unknown>;
};

export async function createSession(
  options: SessionOptions,
): Promise<{ readonly id: string; readonly code: string }> {
  const now = new Date();
  const session = await prisma.session.create({
    data: {
      id: randomUUID(),
      code: uniqueSessionCode(options.codePrefix ?? 'H'),
      type: options.type ?? 'Q_AND_A',
      status: options.status ?? 'ACTIVE',
      quizId: options.quizId,
      currentQuestion: options.currentQuestion,
      questionProgress: options.questionProgress as never,
      qaEnabled: true,
      qaOpen: true,
      qaModerationMode: false,
      qaClosesAt: new Date(now.getTime() + 3_600_000),
      expiresAt: new Date(now.getTime() + 7_200_000),
    },
  });
  options.registry.sessionIds.push(session.id);
  options.registry.sessionCodes.push(session.code);
  return { id: session.id, code: session.code };
}

export type ReleasedQuizQuestion = {
  readonly id: string;
  readonly answers: readonly { readonly id: string }[];
};

/**
 * Quiz mit einer abgeschlossenen (freigegebenen) und einer laufenden Frage.
 * `sessionOptions` setzt die Session auf diese Freigabelage.
 */
export async function createReleasedQuiz(registry: FixtureRegistry): Promise<{
  readonly completed: ReleasedQuizQuestion;
  readonly running: ReleasedQuizQuestion;
  readonly sessionOptions: Omit<SessionOptions, 'registry' | 'codePrefix'>;
}> {
  const quiz = await prisma.quiz.create({
    data: {
      name: `qa-summary-fixture-${randomUUID()}`,
      readingPhaseEnabled: false,
      questions: {
        create: [0, 1].map((order) => ({
          text: order === 0 ? 'Was ist ein Snapshot-Hash?' : 'Wann gilt eine Quelle als veraltet?',
          type: 'SINGLE_CHOICE' as const,
          order,
          answers: {
            create: [
              { text: 'Eine Prüfsumme über den Kontext', isCorrect: true, order: 0 },
              { text: 'Ein Zeitstempel', isCorrect: false, order: 1 },
            ],
          },
        })),
      },
    },
    include: { questions: { include: { answers: true }, orderBy: { order: 'asc' } } },
  });
  registry.quizIds.push(quiz.id);
  const [completed, running] = quiz.questions;
  return {
    completed: completed!,
    running: running!,
    sessionOptions: {
      type: 'QUIZ',
      status: 'ACTIVE',
      quizId: quiz.id,
      currentQuestion: 1,
      questionProgress: {
        [completed!.id]: {
          state: 'COMPLETED',
          openedAt: '2026-01-15T10:00:00.000Z',
          completedAt: '2026-01-15T10:02:00.000Z',
        },
        [running!.id]: { state: 'OPENED', openedAt: '2026-01-15T10:03:00.000Z' },
      },
    },
  };
}

export async function quizVote(input: {
  sessionId: string;
  participantId: string;
  question: ReleasedQuizQuestion;
}): Promise<void> {
  await prisma.vote.create({
    data: {
      sessionId: input.sessionId,
      participantId: input.participantId,
      questionId: input.question.id,
      selectedAnswers: { create: [{ answerOptionId: input.question.answers[0]!.id }] },
    },
  });
}

export type ReferenceScenario = {
  readonly sessionId: string;
  readonly code: string;
  readonly participants: readonly FixtureParticipant[];
  readonly questionIdsByKey: Readonly<Record<ReferenceQuestionKey, string>>;
};

/** Raumbezugsgröße der #456-Referenzfixture. */
export const REFERENCE_SCENARIO_PARTICIPANTS = 200;

/**
 * Sechs-Fragen-Szenario aus #456 Abschnitt 12 als echte Datenbank-Fixture:
 * Texte A–F aus `MODERATION_PROMPT_REFERENCE_TEXT_FIXTURE_V1`, Status sowie
 * positive und negative Stimmen aus `MODERATION_PROMPT_REFERENCE_RANKING_FIXTURE_V1`,
 * N Teilnehmende (Standard 200).
 *
 * Frage X wird von Teilnehmer X (Index 0–5) gestellt; die Stimmen geben die
 * übrigen Teilnehmenden in fester Reihenfolge ab (zuerst positiv, dann negativ).
 * `PENDING` ist in der DB-Funktion nicht abstimmbar. Deshalb entstehen alle
 * Fragen zunächst `ACTIVE`, erhalten ihre Stimmen und bekommen danach ihren
 * Referenzstatus.
 */
export async function createReferenceScenario(options: {
  readonly registry: FixtureRegistry;
  readonly participants?: number;
  readonly session?: Omit<SessionOptions, 'registry'>;
}): Promise<ReferenceScenario> {
  const count = options.participants ?? REFERENCE_SCENARIO_PARTICIPANTS;
  const maxVotes = Math.max(
    ...MODERATION_PROMPT_REFERENCE_RANKING_FIXTURE_V1.map((item) => item.positive + item.negative),
  );
  if (count < maxVotes + 1) {
    throw new Error(`Referenzszenario braucht mindestens ${maxVotes + 1} Teilnehmende`);
  }
  const session = await createSession({
    codePrefix: 'R',
    ...options.session,
    registry: options.registry,
  });
  const participants: FixtureParticipant[] = Array.from({ length: count }, () => ({
    id: randomUUID(),
    capability: `participant-capability-${randomUUID()}`,
  }));
  await prisma.participant.createMany({
    data: participants.map((participant, index) => ({
      id: participant.id,
      sessionId: session.id,
      nickname: `Teilnehmer ${String(index + 1).padStart(3, '0')}`,
      rejoinCapabilityHash: hashCapability(participant.capability),
    })),
  });

  const questionIdsByKey = {} as Record<ReferenceQuestionKey, string>;
  const authorIndexByKey = {} as Record<ReferenceQuestionKey, number>;
  for (const [index, reference] of MODERATION_PROMPT_REFERENCE_TEXT_FIXTURE_V1.entries()) {
    authorIndexByKey[reference.key] = index;
    questionIdsByKey[reference.key] = await createQuestion({
      sessionId: session.id,
      participantId: participants[index]!.id,
      text: reference.text,
    });
  }

  // Streng nacheinander: Die DB-Funktion sperrt die Session ohnehin, Parallelität
  // bringt keinen Zeitgewinn und machte nur die Reihenfolge nichtdeterministisch.
  for (const ranking of MODERATION_PROMPT_REFERENCE_RANKING_FIXTURE_V1) {
    const questionId = questionIdsByKey[ranking.key];
    // Eigene Fragen sind nicht abstimmbar: Autor über den Schlüssel ausschließen.
    const authorIndex = authorIndexByKey[ranking.key];
    const voters = participants.filter((_, voterIndex) => voterIndex !== authorIndex);
    for (let vote = 0; vote < ranking.positive + ranking.negative; vote += 1) {
      await changeVote(questionId, voters[vote]!.id, vote < ranking.positive ? 'UP' : 'DOWN');
    }
  }

  for (const ranking of MODERATION_PROMPT_REFERENCE_RANKING_FIXTURE_V1) {
    if (ranking.status === 'ACTIVE') continue;
    await prisma.qaQuestion.update({
      where: { id: questionIdsByKey[ranking.key] },
      data: { status: ranking.status },
    });
  }

  return { sessionId: session.id, code: session.code, participants, questionIdsByKey };
}

export type PlatformStatisticSnapshot = {
  readonly row: {
    qaQuestionsTotal: bigint;
    maxQaQuestionsSingleSession: number;
    maxQaQuestionsStatisticUpdatedAt: Date | null;
    qaStatisticsTrackingStartedAt: Date | null;
    qaStatisticsProjectedAt: Date | null;
    updatedAt: Date;
  } | null;
};

/** Neue Fragen fortschreiben die Plattformstatistik; die Suiten stellen sie danach wieder her. */
export async function capturePlatformStatistic(): Promise<PlatformStatisticSnapshot> {
  const row = await prisma.platformStatistic.findUnique({
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
  return { row };
}

export async function restorePlatformStatistic(snapshot: PlatformStatisticSnapshot): Promise<void> {
  const before = snapshot.row;
  if (before) {
    await prisma.$executeRaw`
      UPDATE "PlatformStatistic"
      SET
        "qaQuestionsTotal" = ${before.qaQuestionsTotal},
        "maxQaQuestionsSingleSession" = ${before.maxQaQuestionsSingleSession},
        "maxQaQuestionsStatisticUpdatedAt" = ${before.maxQaQuestionsStatisticUpdatedAt},
        "qaStatisticsTrackingStartedAt" = ${before.qaStatisticsTrackingStartedAt},
        "qaStatisticsProjectedAt" = ${before.qaStatisticsProjectedAt},
        "updatedAt" = ${before.updatedAt}
      WHERE "id" = 'default'
    `;
  } else {
    await prisma.platformStatistic.deleteMany({ where: { id: 'default' } });
  }
}

/** Entfernt Redis-Schlüssel der registrierten Sessions (Analyse-Caches, Quick-Feedback). */
export async function deleteFixtureRedisKeys(registry: FixtureRegistry): Promise<void> {
  const redis = getRedis();
  const patterns = [
    ...registry.sessionIds.map((id) => `*${id}*`),
    ...registry.sessionCodes.map((sessionCode) => `qf:*${sessionCode}*`),
  ];
  for (const pattern of patterns) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  }
}

export async function cleanupSessions(ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  await prisma.session.deleteMany({ where: { id: { in: [...ids] } } });
  await prisma.qaSessionStatisticProjection.deleteMany({
    where: { sessionId: { in: [...ids] } },
  });
}

/** Redis-Schlüssel, Sessions (mit Kaskaden) und Quizze der Registry entfernen. */
export async function cleanupFixtures(registry: FixtureRegistry): Promise<void> {
  await deleteFixtureRedisKeys(registry);
  await cleanupSessions(registry.sessionIds);
  if (registry.quizIds.length > 0) {
    await prisma.quiz.deleteMany({ where: { id: { in: [...registry.quizIds] } } });
  }
}
