// Zahlen für den Folienentwurf 1A, gelesen aus Niklas' maschinenlesbarer Auswertung der Reihe vom
// 15.11.2026. Dieselben Felder und Rechenwege wie scripts/load/render-resource-isolation-pdfs.mjs;
// daten-1a.test.mjs gleicht die Befunde ab. Nichts wird hier neu gemessen oder umgedeutet.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const AUSWERTUNG_1A =
  'evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json';

/** Aktionen der Live-Last in Vortragsreihenfolge, mit kurzer deutscher Bezeichnung. */
export const AKTIONEN = [
  ['join', 'Beitritt'],
  ['vote', 'Quiz'],
  ['qaSubmit', 'Q&A'],
  ['blitzlicht', 'Tempo'],
];
export const VARIANTEN = ['V0', 'V1', 'V2', 'V3', 'V4'];

const spanne = (werte) => [Math.min(...werte), Math.max(...werte)];
const summe = (werte) => werte.reduce((a, b) => a + b, 0);

/** @param {string} root docs/referat-thema-1 */
export function ladeDaten1A(root) {
  const roh = readFileSync(join(root, AUSWERTUNG_1A));
  const a = JSON.parse(roh);
  if (a.schemaVersion !== 1 || a.runs.length !== 25 || a.comparisons.length !== 80) {
    throw new Error('daten-1a: vollständige Auswertung (25 Läufe, 80 Vergleiche) erwartet');
  }
  const laeufe = (v) => a.runs.filter((r) => r.variant === v).sort((x, y) => x.block - y.block);
  const spacy = (v) => laeufe(v).map((r) => r.resources.find((c) => c.alias === 'spacy'));
  const ausgang = (v, k) => summe(laeufe(v).map((r) => r.analysis.outcomes[k] ?? 0));

  const vergleiche = a.comparisons.map((c) => ({
    variante: c.variant,
    gegen: c.baselineVariant,
    block: c.block,
    aktion: c.action,
    basisMs: c.baseline.p95Ms,
    kandidatMs: c.candidate.p95Ms,
    deltaMs: c.absoluteChangeMs,
    relativ: c.relativeChange,
    relativBestanden: c.relativePassed,
    absolutBestanden: c.absolutePassed,
    bestanden: c.passed,
  }));
  const v3b5 = vergleiche.filter((x) => x.variante === 'V3' && x.block === 5);

  return {
    schwellen: {
      relativ: a.thresholds.relativeP95,
      absolutMs: a.thresholds.absoluteP95Ms,
      fehler: a.thresholds.errorRate,
      quizZielMs: a.thresholds.voteP95Ms,
      drosselung: a.thresholds.throttledPeriodRatio,
      speicher: a.thresholds.memoryRatio,
      verfuegbarkeit: a.thresholds.analysisUnavailableRate,
    },
    h1: { fehl: a.hypotheses.H1.failedComparisons, gesamt: a.hypotheses.H1.totalComparisons },
    h2: { fehl: a.hypotheses.H2.failedComparisons, gesamt: a.hypotheses.H2.totalComparisons },
    normalbetrieb: a.normalOperation,
    live: {
      geplant: summe(a.runs.map((r) => summe(Object.values(r.live).map((x) => x.planned)))),
      erfolgreich: summe(a.runs.map((r) => summe(Object.values(r.live).map((x) => x.succeeded)))),
      quizMaxMs: Math.max(...a.runs.map((r) => r.live.vote.p95Ms)),
    },
    vergleiche,
    v3Block5MaxDeltaMs: Math.max(...v3b5.map((x) => x.deltaMs)),
    v2: {
      ramMiB: spanne(spacy('V2').map((s) => s.lifetimePeakMemoryBytes / 1048576)),
      cpuProzent: spanne(spacy('V2').map((s) => s.cpuPercent)),
      drosselProzent: spanne(spacy('V2').map((s) => s.throttledPeriodRatio * 100)),
      analyseP95Ms: spanne(laeufe('V2').map((r) => r.analysis.successLatency.p95Ms)),
      erfolg: ausgang('V2', 'SUCCESS'),
      limitMiB: spacy('V2')[0].memoryLimitBytes / 1048576,
    },
    v3: {
      drosselProzent: spanne(spacy('V3').map((s) => s.throttledPeriodRatio * 100)),
      analyseP95Ms: spanne(laeufe('V3').map((r) => r.analysis.successLatency.p95Ms)),
      erfolg: ausgang('V3', 'SUCCESS'),
      ersatz: ausgang('V3', 'FALLBACK'),
      offen: ausgang('V3', 'IN_FLIGHT_AT_END'),
    },
    v4: {
      ersatz: ausgang('V4', 'FALLBACK'),
      offen: ausgang('V4', 'IN_FLIGHT_AT_END'),
      ersatzP95Ms: spanne(laeufe('V4').map((r) => r.analysis.fallbackLatency.p95Ms)),
      weitergeleitet: summe(laeufe('V4').map((r) => r.proxy.forwarded)),
    },
    analyseGeplantJeVariante: summe(laeufe('V2').map((r) => r.analysis.planned)),
    /** Je Variante mit spaCy: Anteil gedrosselter Perioden (%) und Speicherspitze (MiB) je Block 1–5. */
    drosselung: Object.fromEntries(
      ['V2', 'V3', 'V4'].map((v) => [v, spacy(v).map((s) => s.throttledPeriodRatio * 100)]),
    ),
    speicher: Object.fromEntries(
      ['V2', 'V3', 'V4'].map((v) => [v, spacy(v).map((s) => s.lifetimePeakMemoryBytes / 1048576)]),
    ),
    herkunft: {
      commit: a.source.identity.baselineCommit.slice(0, 8),
      auswertungSha: createHash('sha256').update(roh).digest('hex').slice(0, 16),
      cpus: a.source.hardware.cpus,
      kernel: a.source.hardware.kernel,
      datei: AUSWERTUNG_1A,
    },
  };
}
