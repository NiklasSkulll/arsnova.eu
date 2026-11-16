// Zahlen für Niklas' Teil 1B, Schritte 3–4 (Störung und Betriebsaufwand). Liest alle gewerteten
// Ergebnis-JSONs `evidenz/1B/messung/<JJJJ-MM-TT>-lauf-<variante>-<auftrag>.json` (ohne `dev-`), sobald
// Niklas sie in diesen Zweig gemergt hat. Fehlen sie, liefert die Funktion `vorhanden: false`, und die Folien
// zeigen sichtbare Platzhalter ([Niklas]); abgabe-lokal.mjs blockiert dann die Abgabe.
//
// Rechenwege wie Niklas' Auswertung (brief-1b34): Live-p95 je Aktion gepoolt über alle Fenster mit
// fasseLaufzeitenZusammen; Median der Job-Zeit selbst aus experiment.jobs[].jobMs (die Felder f1Fast und
// medianF1JobMs sind in den ersten Dateien wegen eines Parserfehlers null).

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fasseLaufzeitenZusammen } from '../../../../scripts/load/lib/artillery-live-messungen.mjs';

export const MESSUNG_1B = 'evidenz/1B/messung';
const MUSTER = /^(\d{4}-\d{2}-\d{2})-lauf-(?!dev-)([a-z0-9]+)-(summary|label)\.json$/;
const AKTIONEN = ['join', 'vote', 'qaSubmit', 'blitzlicht'];
const MiB = 1048576;

const median = (werte) => {
  const s = [...werte].sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Dateien, die ladeDaten1B34 liest (relativ zu docs/referat-thema-1); für das Bau-Manifest. */
export function eingaben1B34(root) {
  const ordner = join(root, MESSUNG_1B);
  if (!existsSync(ordner)) return [];
  return readdirSync(ordner)
    .filter((n) => MUSTER.test(n))
    .sort()
    .map((n) => `${MESSUNG_1B}/${n}`);
}

/** @param {string} root docs/referat-thema-1 */
export function ladeDaten1B34(root) {
  const laeufe = [];
  for (const pfad of eingaben1B34(root)) {
    const [, datum, variante, auftrag] = pfad.split('/').pop().match(MUSTER);
    const j = JSON.parse(readFileSync(join(root, pfad), 'utf8'));
    if (!j.experiment) continue; // Jonas' Läufe (Schritte 1–2) haben kein experiment-Feld
    const fenster = j.experiment.live?.windows ?? [];
    const live = Object.fromEntries(
      AKTIONEN.map((a) => {
        const proben = fenster.flatMap((w) => w.actions?.[a]?.latency?.durationSamplesMs ?? []);
        return [
          a,
          {
            p95Ms: fasseLaufzeitenZusammen(proben).p95Ms,
            geplant: fenster.reduce((s, w) => s + (w.actions?.[a]?.planned ?? 0), 0),
            fehler: fenster.reduce((s, w) => s + (w.actions?.[a]?.failed ?? 0), 0),
          },
        ];
      }),
    );
    const jobs = (j.experiment.jobs ?? []).map((x) => x.jobMs).filter((x) => Number.isFinite(x));
    const gruende = {};
    for (const x of j.experiment.jobs ?? []) {
      const g = x.fallbackReason ?? x.effectiveMode ?? 'unbekannt';
      gruende[g] = (gruende[g] ?? 0) + 1;
    }
    const res = (j.treiber?.auftraege ?? []).map((x) => x.measurement?.resources).filter(Boolean);
    laeufe.push({
      datei: pfad,
      datum,
      variante,
      auftrag,
      n: j.experiment.config?.n ?? j.n ?? null,
      timeoutMs: Number(j.experiment.config?.timeoutMs ?? j.timeoutMs) || null,
      commit: String(j.commit ?? '').slice(0, 8),
      rechner: j.umgebung?.rechner ?? j.rechner ?? null,
      jobMedianMs: median(jobs),
      jobSpanneMs: jobs.length ? [Math.min(...jobs), Math.max(...jobs)] : null,
      gruende,
      live,
      liveFehler: AKTIONEN.reduce((s, a) => s + live[a].fehler, 0),
      liveGeplant: AKTIONEN.reduce((s, a) => s + live[a].geplant, 0),
      appRssMaxMiB: res.length ? Math.max(...res.map((r) => r.maxRssBytes / MiB)) : null,
      appCpuMax: res.length ? Math.max(...res.map((r) => r.maxCpuPercent)) : null,
    });
  }
  const finde = (v, a = 'summary') => laeufe.find((l) => l.variante === v && l.auftrag === a);
  return { vorhanden: laeufe.length > 0, laeufe, finde };
}
