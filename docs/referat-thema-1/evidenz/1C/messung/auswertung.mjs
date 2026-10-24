// Auswertung der 1C-Messreihen (Design Teil 2, Abschnitte 5, 6 und 10).
//
// Aufruf aus dem Repository-Wurzelverzeichnis:
//   node docs/referat-thema-1/evidenz/1C/messung/auswertung.mjs <messung.json> [...]
//
// Kennzahlen ohne Aufwärmläufe. Median: bei geradem n Mittel der beiden
// mittleren Werte. p95: Nearest-Rank, b[ceil(0,95 · n) − 1] (bei n = 10 also
// das Maximum). Bootstrap: Perzentil-Intervall 95 % für Median(B) − Median(V1),
// beide Gruppen unabhängig mit Zurücklegen gezogen, 10 000 Wiederholungen,
// fester Seed 20261024 (mulberry32), damit das Ergebnis reproduzierbar ist.
import { readFileSync } from 'node:fs';

const SEED = 20261024;
const RESAMPLES = 10_000;

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sorted = (values) => [...values].sort((a, b) => a - b);
function median(values) {
  const b = sorted(values);
  const mid = b.length / 2;
  return b.length % 2 ? b[(b.length - 1) / 2] : (b[mid - 1] + b[mid]) / 2;
}
function stats(values) {
  const b = sorted(values);
  return {
    n: b.length,
    median: +median(b).toFixed(1),
    p95: b[Math.ceil(0.95 * b.length) - 1],
    max: b[b.length - 1],
  };
}
function bootstrapMedianDiff(a, b, random) {
  const draw = (values) => values.map(() => values[Math.floor(random() * values.length)]);
  const diffs = [];
  for (let i = 0; i < RESAMPLES; i += 1) diffs.push(median(draw(a)) - median(draw(b)));
  const s = sorted(diffs);
  return {
    pointEstimate: +(median(a) - median(b)).toFixed(1),
    ci95: [
      +s[Math.floor(0.025 * RESAMPLES)].toFixed(1),
      +s[Math.ceil(0.975 * RESAMPLES) - 1].toFixed(1),
    ],
    resamples: RESAMPLES,
    seed: SEED,
  };
}
const measured = (runs) => runs.filter((run) => run.warmup === false);
const distinct = (values) => [...new Set(values)];
const outcome = (summary) => `${summary.status}/${summary.effectiveMode}/${summary.fallbackReason}`;

function evaluate(data) {
  const out = { completed: data.completed ?? null, mode: data.v1?.mode ?? 'sequential' };
  if (data.m1m2m5) {
    for (const [condition, runs] of Object.entries(data.m1m2m5.conditions)) {
      const r = measured(runs);
      out[`M1 requestMs ${condition}`] = stats(r.map((x) => x.requestMs));
      out[`M2 totalMs ${condition}`] = stats(r.map((x) => x.totalMs));
      out[`M5 prepares ${condition}`] = distinct(r.map((x) => x.prepareHookCalls));
      out[`M5 bodyBytes ${condition}`] = distinct(r.map((x) => x.requestBodyBytes));
      out[`status ${condition}`] = distinct(r.map((x) => outcome(x.primary)));
    }
  }
  if (data.m3) {
    out['M3 warm'] = stats(measured(data.m3.warm).map((x) => x.ms));
    out['M3 cold'] = stats(measured(data.m3.cold).map((x) => x.ms));
    out['M3 cache'] = {
      warm: distinct(measured(data.m3.warm).map((x) => x.cache)),
      cold: distinct(measured(data.m3.cold).map((x) => x.cache)),
      coldDeletedRedisKeys: distinct(data.m3.cold.map((x) => x.deletedRedisKeys)),
    };
  }
  if (data.m4) {
    for (const field of [
      'assembleMs',
      'requestParseMs',
      'clientOutputParseMs',
      'modelOutputParseMs',
      'totalMs',
    ]) {
      out[`M4 ${field}`] = stats(measured(data.m4.runs).map((x) => x[field]));
    }
    if (out['M3 warm']) {
      out['M4 share'] = +(out['M4 totalMs'].median / out['M3 warm'].median).toFixed(3);
    }
  }
  if (data.v1) {
    for (const [cell, runs] of Object.entries(data.v1.runs)) {
      const r = measured(runs);
      out[`V1 ${cell}`] = {
        totalMs: stats(r.map((x) => x.totalMs)),
        jobDoneMs: stats(r.map((x) => x.jobDoneMs)),
        hookCalls: distinct(r.map((x) => x.prepareHookCalls)),
        realPrepares: distinct(r.map((x) => x.realPrepares)),
        primary: distinct(r.map((x) => outcome(x.primary))),
        secondary: distinct(r.map((x) => outcome(x.internal))),
        stalePrimary6: r.filter((x) => x.stalePrimary.section6).length,
        stalePrimary10: r.filter((x) => x.stalePrimary.section10).length,
        staleSecondary6: r.filter((x) => x.staleSecondary.section6).length,
        staleSecondary10: r.filter((x) => x.staleSecondary.section10).length,
      };
    }
    const random = mulberry32(SEED);
    for (const kind of ['quiet', 'change']) {
      const b = measured(data.v1.runs[`B/${kind}`]);
      const v = measured(data.v1.runs[`V1/${kind}`]);
      for (const field of ['totalMs', 'jobDoneMs']) {
        out[`Bootstrap B−V1 ${kind} ${field}`] = bootstrapMedianDiff(
          b.map((x) => x[field]),
          v.map((x) => x[field]),
          random,
        );
      }
    }
    const quietB = out['V1 B/quiet'].totalMs.median;
    out['V1 saving quiet totalMs (share of B)'] = +(
      (quietB - out['V1 V1/quiet'].totalMs.median) /
      quietB
    ).toFixed(4);
  }
  return out;
}

for (const path of process.argv.slice(2)) {
  console.log(`# ${path}`);
  console.log(JSON.stringify(evaluate(JSON.parse(readFileSync(path, 'utf8'))), null, 1));
}
