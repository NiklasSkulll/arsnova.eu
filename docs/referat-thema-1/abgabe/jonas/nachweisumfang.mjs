// Nachweisumfang des Referats (docs/referat-thema-1/nachweisumfang.md) aus dem
// aktuellen Checkout neu berechnen: Laborzeit aus Zeitstempeln der Rohdaten,
// ADRs, vorab festgelegte Hypothesen und statisch gezählte Tests.
//
// Aufruf: node docs/referat-thema-1/abgabe/jonas/nachweisumfang.mjs
// Import: import { berechneNachweisumfang, kopfzahlen } from './nachweisumfang.mjs';

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { liesJson } from '../../evidenz/1B/json-lesen.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
/** docs/referat-thema-1 */
export const REFERAT = resolve(HIER, '../..');
const REPO = resolve(REFERAT, '../..');

/**
 * Letzter Upstream-Stand im Fork (`git merge-base upstream/main HEAD`,
 * Stand 16.11.2026). Fest eingetragen, damit die Zählung ohne Remote
 * `upstream` läuft. Neue bzw. geänderte Tests zählen gegen diesen Stand.
 */
export const BASIS = '21734265a5d2e77976168da0d5a84469320178f0';

/** Zeilen, die mit test( oder it( beginnen (node:test, Vitest). */
const TEST_ZEILE = /^\s*(test|it)\(/;
/** Pester: Zeilen, die mit It '…' oder It "…" beginnen. */
const PESTER_ZEILE = /^\s*It\s+['"]/;

const REIHE_1A = 'evidenz/1A/reihe-main-a19ca70f-20261115-122547';
const MESSUNG_1B = 'evidenz/1B/messung';
const MESSUNG_1C = 'evidenz/1C/messung';

/** Gewertete Läufe (Autorenprüfung abgeschlossen), je Auftrag. */
const GEWERTET_1B = [
  '2026-11-13-lauf.json',
  '2026-11-13-lauf-b0.json',
  '2026-11-13-lauf-kalt.json',
  '2026-11-13-lauf-kalt-2.json',
  '2026-11-13-lauf-kalt-3.json',
  '2026-11-13-lauf-kalt-4.json',
  '2026-11-13-lauf-kalt-5.json',
];
const GEWERTET_1C = [
  '2026-11-05-labor.json.gz',
  '2026-11-05-labor-pc.json.gz',
  '2026-11-09-labor-nachlauf.json.gz',
];
/**
 * Niklas' 1B-Läufe Schritte 3–4 (gewertet, ohne `dev-`): Störreihen Summary und Label samt Teilläufen,
 * gerichtete Breaker-Folgen und S1; Protokolle und Autorenprüfung (16.11.) liegen seit dem Merge von PR #26.
 */
const REIHE_1B_3U4 =
  /^2026-11-1[56]-lauf-(?!dev-)[a-z0-9-]+-(summary|label)(-\d{2})?\.json(\.gz)?$/;

/** Quelle je Hypothesengruppe: Datei und Muster der definierenden Stelle. */
const HYPOTHESEN = [
  { gruppe: '1A', datei: '1A-experiment-contract.md', muster: /^- \*\*(H\d):\*\*/gm },
  {
    gruppe: '1B',
    datei: 'specs/2026-11-12-1b-zwei-host-design.md',
    muster: /\*\*(H_[BC]\d)(?: kalt)?:\*\*/g,
  },
  { gruppe: '1B 3–4', datei: '1B-3u4-Planung.md', muster: /^\| (H[A-Za-z0-9-]*) +\|/gm },
  { gruppe: '1C-E', datei: 'specs/2026-10-24-1c-teil2-design.md', muster: /^\| (E\d+[a-z]?) /gm },
  { gruppe: '1C-E', datei: 'specs/2026-10-24-1c-teil3-design.md', muster: /^\| (E\d+[a-z]?) /gm },
  { gruppe: '1C-M', datei: 'specs/2026-10-24-1c-teil2-design.md', muster: /^\| (M\d) /gm },
  { gruppe: '1C-M', datei: 'specs/2026-10-24-1c-teil3-design.md', muster: /^\| (M\d) /gm },
  { gruppe: '1C-L', datei: 'specs/2026-10-25-1c-labor-design.md', muster: /^\| (L\d) /gm },
  { gruppe: '1C-N', datei: 'specs/2026-11-06-1c-nachlauf-design.md', muster: /^\| (N\d) /gm },
  {
    gruppe: '1C-H_A',
    datei: 'evidenz/1C/2026-11-16-gate-ablation.md',
    muster: /^- \*\*(H_A\d) \(/gm,
  },
];

function git(...args) {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 << 20 });
}

function zeilen(text) {
  return text.split('\n');
}

function zaehle(text, muster) {
  return zeilen(text).filter((z) => muster.test(z)).length;
}

/** Getrackte und nicht ignorierte, ungetrackte Dateien im Checkout. */
function dateienImCheckout(pfad) {
  return zeilen(git('ls-files', '--cached', '--others', '--exclude-standard', '--', pfad)).filter(
    Boolean,
  );
}

function dateienInBasis(pfad) {
  return new Set(zeilen(git('ls-tree', '-r', '--name-only', BASIS, '--', pfad)).filter(Boolean));
}

function lies(pfadImRepo) {
  return readFileSync(join(REPO, pfadImRepo), 'utf8');
}

function sek(von, bis) {
  return (Date.parse(bis) - Date.parse(von)) / 1000;
}

/** 1A: je Lauf warmup.manifest.startAt (lauf.json) bis timestamp (report.json). */
function laufzeit1A(root) {
  const reihe = join(root, REIHE_1A);
  let summe = 0;
  let laeufe = 0;
  let vollstaendig = 0;
  for (const variante of readdirSync(reihe).filter((d) => /^V\d$/.test(d))) {
    for (const block of readdirSync(join(reihe, variante)).filter((d) => d.startsWith('block-'))) {
      const ordner = join(reihe, variante, block);
      const lauf = JSON.parse(readFileSync(join(ordner, 'lauf.json'), 'utf8'));
      const report = JSON.parse(readFileSync(join(ordner, 'report.json'), 'utf8'));
      summe += sek(lauf.warmup.manifest.startAt, report.timestamp);
      laeufe += 1;
      if (lauf.complete === true) vollstaendig += 1;
    }
  }
  return { sek: summe, laeufe, vollstaendig };
}

/** 1B: treiber.startedAt bis spätestes treiber.auftraege[].finishedAt. */
function laufzeit1B(root, datei) {
  const { treiber } = liesJson(join(root, MESSUNG_1B, datei));
  const enden = treiber.auftraege.map((a) => Date.parse(a.finishedAt)).filter(Number.isFinite);
  return {
    sek: (Math.max(...enden) - Date.parse(treiber.startedAt)) / 1000,
    auftraege: treiber.auftraege.length,
  };
}

/** 1C: environment.startedAt bis environment.endedAt. */
function laufzeit1C(root, datei) {
  const { environment } = JSON.parse(gunzipSync(readFileSync(join(root, MESSUNG_1C, datei))));
  return { sek: sek(environment.startedAt, environment.endedAt) };
}

function summe(werte) {
  return werte.reduce((a, b) => a + b, 0);
}

/** Gewertete Läufe 1B 3–4 (Dateinamen); liegen `.json` und `.json.gz` nebeneinander, zählt `.json` einmal. */
export function dateien1B3u4(root = REFERAT) {
  const namen = readdirSync(join(root, MESSUNG_1B)).filter((d) => REIHE_1B_3U4.test(d));
  return [...new Set(namen.map((d) => d.replace(/\.gz$/, '')))]
    .sort()
    .map((d) => (namen.includes(d) ? d : `${d}.gz`));
}

export function laborzeit(root = REFERAT) {
  const a = laufzeit1A(root);
  const b = GEWERTET_1B.map((d) => laufzeit1B(root, d));
  const c = GEWERTET_1C.map((d) => laufzeit1C(root, d));
  const n = dateien1B3u4(root).map((d) => laufzeit1B(root, d));
  const je = {
    '1A': a.sek,
    '1B': summe(b.map((x) => x.sek)),
    '1B 3–4': summe(n.map((x) => x.sek)),
    '1C': summe(c.map((x) => x.sek)),
  };
  return {
    gewertetSek: summe(Object.values(je)),
    je,
    laeufe1A: a.laeufe,
    vollstaendig1A: a.vollstaendig,
    auftraege1B: summe(b.map((x) => x.auftraege)),
    laeufe1C: c.length,
    reihen1B3u4: {
      sek: summe(n.map((x) => x.sek)),
      laeufe: n.length,
      auftraege: summe(n.map((x) => x.auftraege)),
    },
  };
}

export function adrs(root = REFERAT) {
  const dateien = readdirSync(join(root, 'adr')).filter((d) => /^1[BC]-.*\.md$/.test(d));
  return {
    gesamt: dateien.length,
    '1B': dateien.filter((d) => d.startsWith('1B-')).length,
    '1C': dateien.filter((d) => d.startsWith('1C-')).length,
  };
}

export function hypothesen(root = REFERAT) {
  const je = {};
  for (const { gruppe, datei, muster } of HYPOTHESEN) {
    const text = readFileSync(join(root, datei), 'utf8');
    je[gruppe] ??= new Set();
    for (const treffer of text.matchAll(muster)) je[gruppe].add(treffer[1]);
  }
  const anzahl = Object.fromEntries(Object.entries(je).map(([g, s]) => [g, s.size]));
  return { gesamt: summe(Object.values(anzahl)), je: anzahl };
}

/** Statische Testzählung; Tests in Schleifen zählen einmal, nichts wird ausgeführt. */
export function tests() {
  const referat = dateienImCheckout('docs/referat-thema-1');
  const nodeReferat = referat.filter((d) => d.endsWith('.test.mjs'));
  const zaehleDateien = (liste, muster = TEST_ZEILE) =>
    summe(liste.map((d) => zaehle(lies(d), muster)));

  const abgabe = nodeReferat.filter((d) => d.startsWith('docs/referat-thema-1/abgabe/'));
  const evidenz = nodeReferat.filter((d) => !d.startsWith('docs/referat-thema-1/abgabe/'));
  const pester = referat.filter((d) => d.endsWith('.Tests.ps1'));

  const basisLoad = dateienInBasis('scripts/load');
  const load = dateienImCheckout('scripts/load').filter(
    (d) => d.endsWith('.test.mjs') && !basisLoad.has(d),
  );

  const backendPfad = 'apps/backend/src/__tests__';
  const basisBackend = dateienInBasis(backendPfad);
  const backend = dateienImCheckout(backendPfad).filter((d) => /\.test\.ts$/.test(d));
  const backendNeu = backend.filter((d) => !basisBackend.has(d));
  let backendNetto = 0;
  for (const d of backend.filter((x) => basisBackend.has(x))) {
    backendNetto += zaehle(lies(d), TEST_ZEILE) - zaehle(git('show', `${BASIS}:${d}`), TEST_ZEILE);
  }

  const gruppen = {
    evidenz: { tests: zaehleDateien(evidenz), dateien: evidenz.length },
    pester: { tests: zaehleDateien(pester, PESTER_ZEILE), dateien: pester.length },
    load: { tests: zaehleDateien(load), dateien: load.length },
    backend: {
      tests: zaehleDateien(backendNeu) + backendNetto,
      neueDateien: backendNeu.length,
      nettoInGeaenderten: backendNetto,
    },
    abgabe: { tests: zaehleDateien(abgabe), dateien: abgabe.length },
  };
  const ohneAbgabe =
    gruppen.evidenz.tests + gruppen.pester.tests + gruppen.load.tests + gruppen.backend.tests;
  return { ohneAbgabe, gesamt: ohneAbgabe + gruppen.abgabe.tests, gruppen };
}

export function berechneNachweisumfang(root = REFERAT) {
  return {
    commit: git('rev-parse', '--short=8', 'HEAD').trim(),
    laborzeit: laborzeit(root),
    adrs: adrs(root),
    hypothesen: hypothesen(root),
    tests: tests(),
  };
}

export function zahl(wert, stellen = 0) {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: stellen,
    maximumFractionDigits: stellen,
  }).format(wert);
}

/** Sekunden als „7 h 42 min“. */
export function dauer(sekunden) {
  const minuten = Math.round(sekunden / 60);
  const stunden = Math.floor(minuten / 60);
  return stunden ? `${stunden} h ${minuten % 60} min` : `${minuten} min`;
}

/**
 * Deutsch formatierte Kopfzahlen für Folie und Handout, z. B.
 * „Belege im Repo: 7,7 h gewertete Laborzeit, 301 automatisierte Tests, …“.
 */
export function kopfzahlen(werte = berechneNachweisumfang()) {
  return {
    laborzeitStunden: `${zahl(werte.laborzeit.gewertetSek / 3600, 1)} h`,
    laborzeit: dauer(werte.laborzeit.gewertetSek),
    tests: zahl(werte.tests.ohneAbgabe),
    testsMitAbgabe: zahl(werte.tests.gesamt),
    adrs: zahl(werte.adrs.gesamt),
    hypothesen: zahl(werte.hypothesen.gesamt),
  };
}

/**
 * Erwartete Wert-Spalte je Zeile (erste Spalte) der Tabellen in
 * docs/referat-thema-1/nachweisumfang.md; nachweisumfang.test.mjs vergleicht.
 */
export function tabellenwerte(werte = berechneNachweisumfang()) {
  const { laborzeit: l, adrs: a, hypothesen: h, tests: t } = werte;
  const k = kopfzahlen(werte);
  const g = t.gruppen;
  return {
    'Gewertete Laborzeit': `**${k.laborzeitStunden}** (${k.laborzeit}, ${zahl(Math.round(l.gewertetSek))} s)`,
    'davon 1A Ressourcenisolation': `${dauer(l.je['1A'])} (${l.laeufe1A} Läufe, ${l.vollstaendig1A} vollständig)`,
    'davon 1B Schritte 1–2': `${dauer(l.je['1B'])} (${l.auftraege1B} Aufträge)`,
    'davon 1B Schritte 3–4': `${dauer(l.je['1B 3–4'])} (${l.reihen1B3u4.laeufe} Läufe, ${l.reihen1B3u4.auftraege} Aufträge)`,
    'davon 1C Laborläufe': `${dauer(l.je['1C'])} (${l.laeufe1C} Läufe)`,
    'Automatisierte Tests': `**${k.tests}**`,
    ADRs: `**${k.adrs}** (1B: ${a['1B']}, 1C: ${a['1C']})`,
    'Vorab festgelegte Hypothesen und Kriterien': `**${k.hypothesen}**`,
    'Messwerkzeuge 1B/1C': `${g.evidenz.tests} (${g.evidenz.dateien} Dateien)`,
    'Pester 1B (Windows)': `${g.pester.tests} (${g.pester.dateien} Dateien)`,
    '1A Lastwerkzeuge': `${g.load.tests} (${g.load.dateien} neue Dateien)`,
    'Backend 1C': `${g.backend.tests} (${g.backend.neueDateien} neue Dateien, netto ${g.backend.nettoInGeaenderten >= 0 ? '+' : '−'}${Math.abs(g.backend.nettoInGeaenderten)} in geänderten)`,
    '1A (Experimentvertrag)': String(h.je['1A']),
    '1B Schritte 1–2': String(h.je['1B']),
    '1B Schritte 3–4': String(h.je['1B 3–4']),
    '1C Einzeltests E': String(h.je['1C-E']),
    '1C Messungen M': String(h.je['1C-M']),
    '1C Labor L': String(h.je['1C-L']),
    '1C Nachlauf N': String(h.je['1C-N']),
    '1C Gate-Ablation H_A': String(h.je['1C-H_A']),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const werte = berechneNachweisumfang();
  console.log(JSON.stringify({ ...werte, kopfzahlen: kopfzahlen(werte) }, null, 2));
}
