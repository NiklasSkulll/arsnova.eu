// Tests für das Bauskript (Task 10): Bau in ein Temp-Verzeichnis, Manifest, Matrikel-Regel, Sprechnotizen.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import fs from 'node:fs';
import { createRequire, syncBuiltinESMExports } from 'node:module';
import process from 'node:process';
import { tmpdir } from 'node:os';
import { clearInterval, setInterval } from 'node:timers';
import { dirname, join, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { baueDeck } from './deck.mjs';
import { folien, ladeFolienDaten } from './folien.mjs';
import { baueHandout, rendereHandout } from './handout.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HIER, '../..');
const REPO = resolve(ROOT, '../..');
const requireRepo = createRequire(resolve(ROOT, '../../package.json'));

const daten0 = ladeFolienDaten(ROOT);
const F = folien(daten0);
const PERSONEN_LISTE = [
  { name: 'Testname Jonas', matrikel: 'TEST-MATRIKEL-1' },
  { name: 'Testname Niklas', matrikel: 'TEST-MATRIKEL-2' },
];
const JONAS_UND_RESERVE = F.filter((f) => f.teil === 'jonas' || f.teil === 'reserve');
const AUSGABEN = [
  'jonas-deck.html',
  'gemeinsames-deck.pdf',
  'jonas-folien.pdf',
  'jonas-handout.pdf',
  'sprechnotizen.md',
];
const MATRIKEL = ['TEST-MATRIKEL-1', 'TEST-MATRIKEL-2'];

let wurzel;
let platzhalter; // Bau ohne --abgabe
let abgabe; // Bau mit --abgabe
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

function dateien(ordner) {
  return readdirSync(ordner, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name));
}

before(() => {
  wurzel = mkdtempSync(join(tmpdir(), 'bau-test-'));
  home = join(wurzel, 'home');
  mkdirSync(join(home, '.config/referat-thema-1'), { recursive: true });
  writeFileSync(
    join(home, '.config/referat-thema-1/personen.json'),
    JSON.stringify([
      { name: 'Testname Jonas', matrikel: MATRIKEL[0] },
      { name: 'Testname Niklas', matrikel: MATRIKEL[1] },
    ]),
  );
  platzhalter = join(wurzel, 'ohne');
  abgabe = join(wurzel, 'mit');
  const a = bau(['--ausgabe', platzhalter], { HOME: home });
  assert.equal(a.status, 0, a.stderr);
  const b = bau(['--abgabe', '--ausgabe', abgabe], { HOME: home });
  assert.equal(b.status, 0, b.stderr);
});

after(() => rmSync(wurzel, { recursive: true, force: true }));

test('alle Ausgaben und das Manifest existieren und sind nicht leer', () => {
  for (const name of [...AUSGABEN, 'manifest.json']) {
    const p = join(platzhalter, name);
    assert.ok(existsSync(p), name);
    assert.ok(statSync(p).size > 500, `${name} zu klein`);
  }
});

test('Manifest: SHA-256 aller Eingaben und Ausgaben, Seitenzahlen und Wortzahl', () => {
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
    const abs = resolve(ROOT, e.pfad.replace(/^docs\/referat-thema-1\//, ''));
    assert.equal(sha(abs), e.sha256, e.pfad);
  }
  assert.deepEqual(m.ausgaben.map((a) => a.datei).sort(), [...AUSGABEN].sort());
  for (const a of m.ausgaben) {
    assert.equal(sha(join(platzhalter, a.datei)), a.sha256, a.datei);
    assert.equal(a.bytes, statSync(join(platzhalter, a.datei)).size);
  }
  const seiten = (n) => m.ausgaben.find((a) => a.datei === n).seiten;
  assert.equal(seiten('jonas-folien.pdf'), JONAS_UND_RESERVE.length);
  assert.equal(seiten('jonas-handout.pdf'), 5);
  assert.ok(m.handoutWoerter >= 350 && m.handoutWoerter <= 1800, String(m.handoutWoerter));
  assert.ok(m.niklas.teil1.quelle && m.niklas.teil2.quelle, 'Herkunft von Niklas im Manifest');
  assert.doesNotMatch(JSON.stringify(m), /TEST-MATRIKEL|personen\.json/);
});

test('jonas-folien.pdf: genau J1–J15 plus Reserve, eine Seite je Folie, 1600 x 900', async () => {
  const { seiten } = await pdfInfo(join(platzhalter, 'jonas-folien.pdf'));
  assert.equal(seiten, JONAS_UND_RESERVE.length);
  const gemeinsam = await pdfInfo(join(platzhalter, 'gemeinsames-deck.pdf'));
  // G0, Niklas-Platzhalter 1 + 1, J1–J15, G9 und Reserve.
  assert.equal(gemeinsam.seiten, F.length + 2);
  const roh = readFileSync(join(platzhalter, 'jonas-folien.pdf'), 'latin1');
  assert.match(roh, /\/MediaBox\s*\[\s*0\s+0\s+1200(\.\d+)?\s+675(\.\d+)?\s*\]/);
});

test('jonas-deck.html ist selbstständig (kein http(s), kein externes Skript)', () => {
  const h = readFileSync(join(platzhalter, 'jonas-deck.html'), 'utf8');
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

test('ohne --abgabe: nur Platzhalter, keine Matrikel und kein Zielordner im Home', async () => {
  const { text } = await pdfInfo(join(platzhalter, 'jonas-handout.pdf'));
  assert.match(text, /lokal eintragen/);
});

test('--abgabe: personalisierte PDFs nur unter ~/referat-abgabe, Matrikel nirgends im Repo oder Bauordner', async () => {
  const ziel = join(home, 'referat-abgabe');
  const pdf = join(ziel, 'jonas-handout.pdf');
  assert.ok(existsSync(pdf));
  const { text, seiten } = await pdfInfo(pdf);
  assert.ok(seiten <= 5);
  for (const m of MATRIKEL) assert.ok(text.includes(m), m);
  assert.ok(existsSync(join(ziel, 'jonas-folien.pdf')));
  // Nirgends sonst: Bauordner (beide), Repo-Ordner abgabe/ und Spiegel in manifest.json.
  for (const ordner of [platzhalter, abgabe, join(HIER, '..')]) {
    for (const datei of dateien(ordner)) {
      if (datei.endsWith('.test.mjs')) continue; // Testquellen nennen die erfundenen Werte
      if (statSync(datei).size > 30e6) continue;
      const inhalt = readFileSync(datei).toString('latin1');
      for (const m of MATRIKEL) assert.ok(!inhalt.includes(m), `${m} in ${datei}`);
    }
  }
  for (const datei of [...dateien(abgabe), ...dateien(join(HIER, '..'))].filter((d) =>
    d.endsWith('.pdf'),
  )) {
    const { text: t } = await pdfInfo(datei);
    for (const m of MATRIKEL) assert.ok(!t.includes(m), `${m} im Text von ${datei}`);
  }
  assert.equal(statSync(ziel).mode & 0o077, 0, 'Zielordner nur für den Besitzer');
});

test('--abgabe ohne personen.json: klarer Fehler, nichts geschrieben', () => {
  const leer = join(wurzel, 'leer-home');
  mkdirSync(leer);
  const r = bau(['--abgabe', '--ausgabe', join(wurzel, 'fehler')], { HOME: leer });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /personen\.json/);
  assert.ok(!existsSync(join(leer, 'referat-abgabe')));
});

test('--abgabe mit unvollständiger personen.json: Fehler', () => {
  const h = join(wurzel, 'schief-home');
  mkdirSync(join(h, '.config/referat-thema-1'), { recursive: true });
  writeFileSync(join(h, '.config/referat-thema-1/personen.json'), '[{"name":"Nur Einer"}]');
  const r = bau(['--abgabe', '--ausgabe', join(wurzel, 'fehler2')], { HOME: h });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /personen\.json/);
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

const PERSONEN_JSON = JSON.stringify([
  { name: 'Testname Jonas', matrikel: MATRIKEL[0] },
  { name: 'Testname Niklas', matrikel: MATRIKEL[1] },
]);

function homeMit(basis) {
  const h = join(basis, 'home');
  mkdirSync(join(h, '.config/referat-thema-1'), { recursive: true });
  writeFileSync(join(h, '.config/referat-thema-1/personen.json'), PERSONEN_JSON);
  return h;
}

test('Repo-Schutz: ~/referat-abgabe als Symlink ins Repo wird abgelehnt', () => {
  const imRepo = mkdtempSync(join(REPO, '.bau-test-'));
  try {
    const h = homeMit(join(wurzel, 'symlink'));
    symlinkSync(imRepo, join(h, 'referat-abgabe'));
    const r = bau(['--abgabe', '--ausgabe', join(wurzel, 'sym-aus')], { HOME: h });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /Repo/);
    assert.deepEqual(readdirSync(imRepo), []);
  } finally {
    rmSync(imRepo, { recursive: true, force: true });
  }
});

test('Repo-Schutz: HOME im Repo und HOME als Symlink ins Repo werden abgelehnt', () => {
  const imRepo = mkdtempSync(join(REPO, '.bau-test-'));
  try {
    // HOME selbst liegt im Repo
    const homeImRepo = homeMit(imRepo);
    const a = bau(['--abgabe', '--ausgabe', join(wurzel, 'repo-aus')], { HOME: homeImRepo });
    assert.notEqual(a.status, 0);
    assert.ok(!existsSync(join(homeImRepo, 'referat-abgabe')));
    // HOME ist ein Symlink ins Repo, personen.json liegt dort
    const link = join(wurzel, 'home-link');
    symlinkSync(homeImRepo, link);
    const b = bau(['--abgabe', '--ausgabe', join(wurzel, 'repo-aus2')], { HOME: link });
    assert.notEqual(b.status, 0);
    assert.match(b.stderr, /Repo/);
    assert.ok(!existsSync(join(homeImRepo, 'referat-abgabe')));
  } finally {
    rmSync(imRepo, { recursive: true, force: true });
  }
});

test('personalisiertes Handout-HTML: Temp-Ordner 0700, Datei 0600, danach entfernt', async () => {
  const tmp = mkdtempSync(join(wurzel, 'tmp-'));
  const alt = process.env.TMPDIR;
  process.env.TMPDIR = tmp;
  const beobachtet = [];
  const takt = setInterval(() => {
    for (const n of readdirSync(tmp).filter((x) => x.startsWith('handout-'))) {
      try {
        const d = join(tmp, n);
        const modus = statSync(d).mode & 0o777;
        const dateien_ = statSync(d).isDirectory() ? readdirSync(d) : [];
        beobachtet.push({
          ordner: statSync(d).isDirectory() ? modus : null,
          datei: dateien_.length ? statSync(join(d, dateien_[0])).mode & 0o777 : null,
          roh: statSync(d).isDirectory() ? null : modus,
        });
      } catch {
        // Eintrag verschwand zwischen readdir und stat
      }
    }
  }, 5);
  try {
    await rendereHandout(baueHandout(daten0, PERSONEN_LISTE), join(tmp, 'aus.pdf'));
  } finally {
    clearInterval(takt);
    if (alt === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = alt;
  }
  assert.ok(beobachtet.length > 0, 'temporäre HTML-Datei nicht beobachtet');
  assert.ok(
    beobachtet.every((b) => b.roh === null),
    'HTML liegt lose im Temp-Ordner',
  );
  assert.ok(
    beobachtet.every((b) => b.ordner === 0o700),
    JSON.stringify(beobachtet),
  );
  assert.ok(beobachtet.filter((b) => b.datei !== null).every((b) => b.datei === 0o600));
  assert.deepEqual(
    readdirSync(tmp).filter((x) => x.startsWith('handout-')),
    [],
  );
});

test('fehlgeschlagener Bau hinterlässt kein altes Manifest', () => {
  const aus = join(wurzel, 'stale');
  mkdirSync(join(aus, 'jonas-handout.pdf'), { recursive: true }); // Schreiben schlägt fehl
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
    baueHandout(d);
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
