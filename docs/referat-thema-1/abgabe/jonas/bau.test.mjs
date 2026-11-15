// Tests für das Bauskript (Task 10): Bau in ein Temp-Verzeichnis, Manifest, Matrikel-Regel, Sprechnotizen.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import fs from 'node:fs';
import { createRequire, syncBuiltinESMExports } from 'node:module';
import process from 'node:process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { baueDeck } from './deck.mjs';
import { folien, ladeFolienDaten } from './folien.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HIER, '../..');
const REPO = resolve(ROOT, '../..');
const requireRepo = createRequire(resolve(ROOT, '../../package.json'));

const daten0 = ladeFolienDaten(ROOT);
const F = folien(daten0);
const JONAS_UND_RESERVE = F.filter((f) => f.teil === 'jonas' || f.teil === 'reserve');
const AUSGABEN = [
  'jonas-deck.html',
  'gemeinsames-deck.pdf',
  'jonas-folien.pdf',
  'sprechnotizen.md',
];

let wurzel;
let platzhalter; // Bau ohne --abgabe
let home;

function bau(args, env = {}) {
  return spawnSync(process.execPath, [join(HIER, 'bau.mjs'), ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
    timeout: 240_000,
  });
}

async function pdfInfo(pfad) {
  const { PDFParse } = requireRepo('pdf-parse');
  const p = new PDFParse({ data: new Uint8Array(readFileSync(pfad)) });
  try {
    return { seiten: (await p.getInfo()).total, text: (await p.getText()).text };
  } finally {
    await p.destroy();
  }
}

before(() => {
  wurzel = mkdtempSync(join(tmpdir(), 'bau-test-'));
  home = join(wurzel, 'home');
  mkdirSync(home, { recursive: true });
  platzhalter = join(wurzel, 'ohne');
  const a = bau(['--ausgabe', platzhalter], { HOME: home });
  assert.equal(a.status, 0, a.stderr);
});

after(() => rmSync(wurzel, { recursive: true, force: true }));

test('alle Ausgaben und das Manifest existieren und sind nicht leer', () => {
  for (const name of [...AUSGABEN, 'manifest.json']) {
    const p = join(platzhalter, name);
    assert.ok(existsSync(p), name);
    assert.ok(statSync(p).size > 500, `${name} zu klein`);
  }
});

test('Manifest: SHA-256 aller Eingaben und Ausgaben, Seitenzahlen', () => {
  const m = JSON.parse(readFileSync(join(platzhalter, 'manifest.json'), 'utf8'));
  const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
  assert.ok(m.eingaben.length > 20);
  const pfade = m.eingaben.map((e) => e.pfad);
  for (const erwartet of [
    'evidenz/1B/messung/2026-11-13-lauf.json',
    'evidenz/1B/messung/2026-11-15-abgelehnte-antwort.json',
    'evidenz/1C/messung/2026-11-09-labor-nachlauf.json.gz',
    'abgabe/jonas/deck-vorlage.html',
    'abgabe/jonas/handout-vorlage.html',
    'abgabe/jonas/folien.mjs',
    'abgabe/jonas/schriften/inter-latin-400-normal.woff2',
  ]) {
    assert.ok(
      pfade.some((p) => p.endsWith(erwartet)),
      erwartet,
    );
  }
  for (const e of m.eingaben) {
    assert.match(e.sha256, /^[0-9a-f]{64}$/);
    // Pfade sind relativ zum Repo (auch der gelesene App-Code für den Nachbau auf J13).
    const abs = resolve(ROOT, '../..', e.pfad);
    assert.equal(sha(abs), e.sha256, e.pfad);
  }
  assert.deepEqual(m.ausgaben.map((a) => a.datei).sort(), [...AUSGABEN].sort());
  for (const a of m.ausgaben) {
    assert.equal(sha(join(platzhalter, a.datei)), a.sha256, a.datei);
    assert.equal(a.bytes, statSync(join(platzhalter, a.datei)).size);
  }
  const seiten = (n) => m.ausgaben.find((a) => a.datei === n).seiten;
  assert.equal(seiten('jonas-folien.pdf'), JONAS_UND_RESERVE.length);
  assert.ok(m.niklas.teil1.quelle && m.niklas.teil2.quelle, 'Herkunft von Niklas im Manifest');
  assert.doesNotMatch(JSON.stringify(m), /TEST-MATRIKEL|personen\.json/);
});

test('jonas-folien.pdf: genau J1–J16 plus Reserve, eine Seite je Folie, 1600 x 900', async () => {
  const { seiten } = await pdfInfo(join(platzhalter, 'jonas-folien.pdf'));
  assert.equal(seiten, JONAS_UND_RESERVE.length);
  const gemeinsam = await pdfInfo(join(platzhalter, 'gemeinsames-deck.pdf'));
  // G0, Niklas 1A (gemergte PDF unter abgabe/ oder eine Platzhalterfolie), Platzhalter 1B 3–4,
  // Jonas, G9 und Reserve.
  const pdf1A = join(ROOT, 'abgabe/1A-folien.pdf');
  const seiten1A = existsSync(pdf1A) ? (await pdfInfo(pdf1A)).seiten : 1;
  assert.equal(gemeinsam.seiten, F.length + seiten1A + 1);
  const roh = readFileSync(join(platzhalter, 'jonas-folien.pdf'), 'latin1');
  assert.match(roh, /\/MediaBox\s*\[\s*0\s+0\s+1200(\.\d+)?\s+675(\.\d+)?\s*\]/);
});

test('jonas-deck.html ist selbstständig (kein http(s), kein externes Skript)', () => {
  // URLs nur als Text im Literaturverzeichnis (J16, zwischen den Quellen-Marken), keine externen Ressourcen.
  const h = readFileSync(join(platzhalter, 'jonas-deck.html'), 'utf8').replace(
    /<!--quellen-->[\s\S]*?<!--\/quellen-->/g,
    '',
  );
  assert.doesNotMatch(h, /https?:\/\//);
  assert.doesNotMatch(h, /<script[^>]+src=/);
});

test('sprechnotizen.md: Summen und Folien stimmen mit folien.mjs überein', () => {
  const md = readFileSync(join(platzhalter, 'sprechnotizen.md'), 'utf8');
  const haupt = F.filter((f) => f.teil !== 'reserve');
  const gesamt = haupt.reduce((s, f) => s + f.zeitS, 0);
  const kurz = haupt.filter((f) => f.kurzfassung).reduce((s, f) => s + f.zeitS, 0);
  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  assert.ok(md.includes(`Gesamt ${mmss(gesamt)}`), `Gesamt ${mmss(gesamt)}`);
  assert.ok(md.includes(`Kurzfassung ${mmss(kurz)}`), `Kurzfassung ${mmss(kurz)}`);
  let kumuliert = 0;
  for (const f of haupt) {
    kumuliert += f.zeitS;
    const zeile = md.split('\n').find((l) => l.startsWith(`## ${f.id} `));
    assert.ok(zeile, f.id);
    assert.ok(zeile.includes(`${f.zeitS} s`), zeile);
    assert.ok(zeile.includes(`kumuliert ${mmss(kumuliert)}`), zeile);
    assert.equal(zeile.includes('Kurzfassung'), f.kurzfassung, zeile);
    assert.ok(md.includes(f.notiz.trim().split('\n')[0].trim().slice(0, 40)), f.id);
  }
  for (const f of F.filter((x) => x.teil === 'reserve')) {
    assert.ok(md.includes(`## ${f.id} `), f.id);
  }
});

test('generierte Textausgaben sind Prettier-formatiert (Pre-commit würde sie sonst ändern)', async () => {
  const { check, resolveConfig } = requireRepo('prettier');
  const konfig = (await resolveConfig(resolve(ROOT, '../../package.json'))) ?? {};
  for (const name of ['jonas-deck.html', 'sprechnotizen.md', 'manifest.json']) {
    const text = readFileSync(join(platzhalter, name), 'utf8');
    assert.ok(
      await check(text, { ...konfig, filepath: join(HIER, name) }),
      `${name} nicht formatiert`,
    );
  }
});

test('--abgabe gibt es nicht mehr: das Handout mit Matrikel entsteht in PaperLab', () => {
  const r = bau(['--abgabe', '--ausgabe', join(wurzel, 'abgabe')], { HOME: home });
  assert.notEqual(r.status, 0);
  assert.ok(!existsSync(join(wurzel, 'abgabe')), 'nichts geschrieben');
});

test('fehlgeschlagener Bau hinterlässt kein altes Manifest', () => {
  const aus = join(wurzel, 'stale');
  mkdirSync(join(aus, 'sprechnotizen.md'), { recursive: true }); // Schreiben schlägt fehl
  writeFileSync(join(aus, 'manifest.json'), '{"alt":true}');
  const r = bau(['--ausgabe', aus], { HOME: home });
  assert.notEqual(r.status, 0);
  assert.ok(!existsSync(join(aus, 'manifest.json')), 'altes Manifest blieb liegen');
});

test('ungültige Niklas-PDFs: klarer Fehler vor dem Bau, nichts geschrieben', () => {
  const aus = join(wurzel, 'niklas-fehler');
  const fehlt = bau(['--niklas1', join(wurzel, 'gibt-es-nicht.pdf'), '--ausgabe', aus], {
    HOME: home,
  });
  assert.notEqual(fehlt.status, 0);
  assert.match(fehlt.stderr, /gibt-es-nicht\.pdf/);
  const keinPdf = join(wurzel, 'kein.pdf');
  writeFileSync(keinPdf, 'kein pdf');
  const kaputt = bau(['--niklas2', keinPdf, '--ausgabe', aus], { HOME: home });
  assert.notEqual(kaputt.status, 0);
  assert.match(kaputt.stderr, /kein\.pdf/);
  assert.ok(!existsSync(join(aus, 'manifest.json')));
  assert.ok(!existsSync(join(aus, 'jonas-deck.html')));
});

test('Manifest führt jede Datei auf, die die Module beim Bau lesen', () => {
  const m = JSON.parse(readFileSync(join(platzhalter, 'manifest.json'), 'utf8'));
  const aufgefuehrt = new Set(m.eingaben.map((e) => resolve(REPO, e.pfad)));
  const gelesen = new Set();
  const original = fs.readFileSync;
  fs.readFileSync = function (pfad, ...rest) {
    if (typeof pfad === 'string') gelesen.add(resolve(pfad));
    return original.call(this, pfad, ...rest);
  };
  syncBuiltinESMExports();
  try {
    const d = ladeFolienDaten(ROOT);
    const alle = folien(d);
    baueDeck(alle, { niklas: { teil1: [], teil2: [] }, eingebettet: true });
  } finally {
    fs.readFileSync = original;
    syncBuiltinESMExports();
  }
  const fehlend = [...gelesen].filter(
    (p) => p.startsWith(REPO + '/') && !p.includes('node_modules') && !aufgefuehrt.has(p),
  );
  assert.ok(gelesen.size > 20, `nur ${gelesen.size} Lesezugriffe beobachtet`);
  assert.deepEqual(fehlend, []);
});

test('eingechecktes ausgabe/manifest.json passt zu den eingecheckten Ausgaben und Eingaben', () => {
  const ausgabe = join(HIER, 'ausgabe');
  const m = JSON.parse(readFileSync(join(ausgabe, 'manifest.json'), 'utf8'));
  const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
  for (const a of m.ausgaben) {
    assert.equal(sha(join(ausgabe, a.datei)), a.sha256, `Ausgabe ${a.datei} veraltet`);
  }
  for (const e of m.eingaben.filter((x) => !x.pfad.startsWith('extern/'))) {
    assert.equal(sha(resolve(REPO, e.pfad)), e.sha256, `Eingabe ${e.pfad} geändert, neu bauen`);
  }
});

test('Sprechnotizen: Sprungplan zu J13 und J15 bei Abbruch (Prüfung 3, I5)', async () => {
  const { baueSprechnotizen } = await import('./bau.mjs');
  const md = baueSprechnotizen(F);
  assert.match(md, /Sprungplan/);
  assert.match(md, /J13/);
  assert.match(md, /J15/);
  assert.match(md, /9:00/);
});
