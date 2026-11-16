// Prüft Niklas' Folien im gemeinsamen Deck: Reihenfolge und Zeiten, Sprechnotizen in zwei Fassungen,
// Kurzbelege nach ZL, Zahlen nur aus den Daten, Layoutwächter, einzeilige Fußzeilen, Druckauszug und
// den Aufbau in Stufen (N6, N7) mit und ohne reduzierte Bewegung.
// Aufruf: node --test docs/referat-thema-1/abgabe/niklas/*.test.mjs
/* global document, getComputedStyle */
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import process from 'node:process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { fmt } from '../jonas/zahlen.mjs';
import { layoutBefunde } from '../jonas/layout-pruefung.mjs';
import { baueEntwurf, notizenNiklas } from './bau-entwurf.mjs';
import { ladeDaten1A } from './daten-1a.mjs';
import { ladeDaten1B34 } from './daten-1b34.mjs';
import { folien1B34 } from './folien-1b34.mjs';
import { LITERATUR_1A, kurzbeleg1A } from './literatur-1a.mjs';

const HIER = resolve(fileURLToPath(import.meta.url), '..');
const ROOT = resolve(HIER, '../..');
const { chromium } = createRequire(resolve(HIER, '../../../../package.json'))('playwright');
const { html, n1a, n1b, alle } = baueEntwurf();
const d = ladeDaten1A(ROOT);

const haupt1A = n1a.filter((f) => f.teil === 'niklas' && !f.anhang);
const reserve1A = n1a.filter((f) => f.teil === 'reserve');
const summe = (l) => l.reduce((s, f) => s + f.zeitS, 0);
const ohneTags = (s) =>
  s
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

let ordner;
let browser;
let deck;
before(async () => {
  ordner = mkdtempSync(join(tmpdir(), 'niklas-test-'));
  deck = join(ordner, 'deck.html');
  writeFileSync(deck, html);
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  if (ordner) rmSync(ordner, { recursive: true, force: true });
});

// ---------------------------------------------------------------- Aufbau und Zeit

test('1A: N1–N10 im Vortrag, Literatur NL im Anhang, RN1–RN2 als Reserve', () => {
  assert.deepEqual(
    haupt1A.map((f) => f.id),
    ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10'],
  );
  assert.deepEqual(
    n1a.filter((f) => f.anhang).map((f) => f.id),
    ['NL'],
  );
  assert.deepEqual(
    reserve1A.map((f) => f.id),
    ['RN1', 'RN2'],
  );
  assert.ok(reserve1A.every((f) => f.autor === 'niklas' && f.zeitS === 0));
  assert.ok(haupt1A.every((f) => f.auftrag === '1A' && f.station === null));
});

test('Zeit: 1A 9:30 bis 10:00 min; Kurzfassung mit N1, N6 und N10', () => {
  const s = summe(haupt1A);
  assert.ok(s >= 570 && s <= 600, `1A ${s} s`);
  const kurz = haupt1A.filter((f) => f.kurzfassung).map((f) => f.id);
  for (const id of ['N1', 'N6', 'N10']) assert.ok(kurz.includes(id), id);
  // G9 spricht Niklas (gemeinsames Fazit); 1B 3–4 als Gerüst mit eigener Zeit
  const g9 = alle.find((f) => f.id === 'G9');
  assert.equal(g9.sprecher, 'niklas');
  assert.ok(summe(n1b) > 0);
});

test('Titel: Behauptung in einer Zeile (höchstens 44 Zeichen), Reserve mit „Reserve:“', () => {
  for (const f of [...haupt1A, ...reserve1A]) {
    const t = ohneTags(f.titel).trim();
    const ohneReserve = t.replace(/^Reserve: /, '');
    assert.ok(ohneReserve.length <= 50, `${f.id}: ${t.length} Zeichen`);
    if (f.teil === 'reserve') assert.match(t, /^Reserve: /);
  }
});

test('Sprechnotizen: Fließtext etwa 130 Wörter je Minute, 3–6 Stichpunkte, [Weiter] je Stufe', () => {
  for (const f of haupt1A) {
    const woerter = f.notiz.trim().split(/\s+/).length;
    const soll = (f.zeitS * 130) / 60;
    assert.ok(
      woerter >= soll * 0.7 && woerter <= soll * 1.3,
      `${f.id}: ${woerter} Wörter, Soll etwa ${Math.round(soll)}`,
    );
    assert.ok(f.stichpunkte.length >= 3 && f.stichpunkte.length <= 6, `${f.id}: Stichpunkte`);
    const stufen = f.aufbau ?? 0;
    assert.equal((f.notiz.match(/\[Weiter\]/g) ?? []).length, stufen, `${f.id}: [Weiter] in notiz`);
    assert.equal(
      f.stichpunkte.filter((p) => p.startsWith('[Weiter]')).length,
      stufen,
      `${f.id}: [Weiter] in Stichpunkten`,
    );
  }
  for (const f of reserve1A) assert.ok(f.notiz && f.stichpunkte.length >= 3, f.id);
  const md = notizenNiklas(alle, n1a, n1b);
  assert.match(md, /^# Sprechnotizen Niklas/);
  assert.match(md, /\*\*Stichpunkte\*\*/);
  assert.match(md, /\*\*Fließtext\*\*/);
  assert.match(md, /## G9 /);
  assert.match(md, /## RN1 /);
  assert.doesNotMatch(md, /## NL /, 'Literatur ohne Redezeit nicht in den Notizen');
});

test('Erzählbogen: N10 schlägt die Brücke zu 1B, N1 nimmt Jonas’ Übergabe auf', () => {
  assert.match(haupt1A[0].notiz, /^Danke, Jonas\./);
  assert.match(ohneTags(haupt1A.at(-1).inhalt), /zweite Host.*ausfällt/);
  const j15 = alle.find((f) => f.id === 'J15');
  assert.match(ohneTags(j15.inhalt), /App-Host selbst.*Niklas/);
});

test('Schreibregeln: kein Geviertstrich, kein „sondern“, keine Hex-Farbe im HTML, keine Nebenlast', () => {
  for (const f of [...n1a, ...n1b]) {
    const text = [f.titel, f.inhalt, f.notiz, ...(f.stichpunkte ?? [])].join(' ');
    assert.doesNotMatch(text, /—/, f.id);
    assert.doesNotMatch(text, /\bsondern\b/, f.id);
    assert.doesNotMatch(text, /Nebenlast|Störprozess/, f.id);
    assert.doesNotMatch(
      f.inhalt.replace(/<svg[\s\S]*?<\/svg>/g, ''),
      /#[0-9a-fA-F]{3,6}\b/,
      `${f.id}: Hex-Farbe`,
    );
  }
  // gefährliche Formulierungen aus dem Brief (Ursache offen, kein Signifikanztest)
  for (const f of n1a) {
    const t = [f.titel, ohneTags(f.inhalt), f.notiz].join(' ');
    assert.doesNotMatch(t, /signifikant|Ursache gefunden|spaCy bremst/, f.id);
  }
});

// ---------------------------------------------------------------- Zahlen nur aus den Daten

/** Alle Zahlen der Daten in den Schreibweisen der Folien (fmt mit 0–2 Stellen, ×100, ÷1000, ×1000). */
function erlaubt() {
  const w = new Set();
  const zahl = (n) => {
    const b = Math.abs(n);
    for (const x of [b, b * 100, b / 1000, b * 1000, b / 1024, b / 100]) {
      if (!Number.isFinite(x)) continue;
      for (const st of [0, 1, 2]) w.add(fmt(x, st));
    }
  };
  const lauf = (o) => {
    if (typeof o === 'number') zahl(o);
    else if (Array.isArray(o)) o.forEach(lauf);
    else if (o && typeof o === 'object') Object.values(o).forEach(lauf);
  };
  lauf(d);
  // abgeleitet: Takt der Analyse (Fenster / Abrufe je Lehrende*r) und Lehrende × Takt
  const takt = d.konfig.profil.durationMs / 1000 / (d.analyseGeplantJeVariante / d.konfig.hosts);
  zahl(takt);
  zahl(takt * d.konfig.hosts);
  for (let i = 0; i <= 5; i++) w.add(String(i)); // Blöcke, Varianten, Stufen
  return w;
}
// Festwerte außerhalb der Messreihe, je mit Beleg: 8 vCPU (ADR-0035, Zielhost), 0,1 s (Achsenmarke).
const FESTWERTE_NIKLAS = { 8: 'ADR-0035 „8 vCPU“', '0,1': 'Achsenmarke 0,1 s' };

test('Keine Zahl auf den 1A-Folien, die nicht aus den Daten kommt', () => {
  const adr = readFileSync(
    resolve(
      ROOT,
      '../architecture/decisions/0035-self-hosted-llm-runtime-llama-cpp-over-ollama.md',
    ),
    'utf8',
  );
  assert.match(adr, /8 vCPU/);
  const w = erlaubt();
  const KENNUNG =
    /\b(?:[VHNMRJG]\d+|1[ABC]|ADR-\d{4}|v\d(?:\.\d)+(?:-\d+)?|[0-9a-f]{8}|cgroup v2|Vertrag v\d|Version \d(?:\.\d)*|20\d\d|p\d\d|Abschn\. [\d.]+|Z\. \d+)\b/g;
  const DATUM = /\d{2}\.\d{2}\.(?:\d{4})?/g;
  for (const f of [...haupt1A, ...reserve1A]) {
    const texte = [f.titel, ohneTags(f.inhalt), f.notiz, ...f.stichpunkte];
    for (const t of texte) {
      for (const z of t
        .replace(DATUM, ' ')
        .replace(KENNUNG, ' ')
        .match(/\d+(?:[.,]\d+)*/g) ?? []) {
        assert.ok(w.has(z) || z in FESTWERTE_NIKLAS, `${f.id}: „${z}“ nicht aus den Daten`);
      }
    }
  }
});

// ---------------------------------------------------------------- Literatur und Fußzeilen

test('ZL: jede Folie trägt Kurzbelege aus dem Verzeichnis, jeder Eintrag wird zitiert', () => {
  const kurz = new Set(LITERATUR_1A.map((e) => e.kurz));
  const zitiert = new Set();
  for (const f of [...haupt1A, ...reserve1A]) {
    assert.ok(f.fuss.startsWith('Quelle: '), f.id);
    for (const beleg of f.fuss.slice('Quelle: '.length).split('; ')) {
      const k = [...kurz].find((x) => beleg === x || beleg.startsWith(`${x}, `));
      assert.ok(k, `${f.id}: „${beleg}“ fehlt im Verzeichnis`);
      zitiert.add(k);
    }
    // Rechner und Commit gehören in die quelle, nicht in die Fußzeile
    assert.doesNotMatch(f.fuss, /\b[0-9a-f]{8}\b|WSL2/, f.id);
    assert.match(f.quelle, /WSL2|1A-auswertung|Laufdateien/, f.id);
  }
  assert.deepEqual(
    [...kurz].filter((k) => !zitiert.has(k)),
    [],
    'unzitierte Einträge',
  );
  assert.throws(() => kurzbeleg1A('fehlt2020'), /fehlt2020/);
  const nl = n1a.find((f) => f.id === 'NL');
  for (const e of LITERATUR_1A) assert.ok(nl.inhalt.includes(e.voll), e.schluessel);
});

test('Literatur 1A alphabetisch, ohne „o. J.“ und Abrufdatum, DOI mit https', () => {
  const voll = LITERATUR_1A.map((e) => e.voll);
  assert.deepEqual(
    voll,
    [...voll].sort((a, b) => a.localeCompare(b, 'de')),
  );
  for (const v of voll) {
    assert.doesNotMatch(v, /o\. J\.|abgerufen|Zugriff am/);
    assert.doesNotMatch(v, /[^/]doi\.org/);
  }
});

const BIB_NIKLAS = `${process.env.HOME}/Documents/Code/PaperLab/scientific-papers/presentation/presentation-semester-7-cloud-computing-1a-1b_niklas/main.bib`;
test(
  'dieselben Schlüssel wie in Niklas’ Handout (PaperLab main.bib)',
  {
    skip: !(() => {
      try {
        readFileSync(BIB_NIKLAS);
        return true;
      } catch {
        return false;
      }
    })(),
  },
  () => {
    const bib = readFileSync(BIB_NIKLAS, 'utf8');
    for (const e of LITERATUR_1A) {
      assert.ok(
        new RegExp(`@\\w+\\{${e.schluessel},`).test(bib),
        `${e.schluessel} fehlt in main.bib`,
      );
    }
  },
);

// ---------------------------------------------------------------- 1B 3–4 Gerüst

test('1B 3–4: Gerüst M1–M4 mit sichtbaren Platzhaltern, solange Niklas’ Ergebnisse fehlen', () => {
  assert.deepEqual(
    n1b.map((f) => f.id),
    ['M1', 'M2', 'M3', 'M4'],
  );
  const leer = folien1B34();
  for (const f of leer) {
    assert.match(f.titel, /\[Titel\]/, f.id);
    assert.match(ohneTags(f.inhalt) + f.fuss, /\[Niklas\]|\[Satz/, f.id);
  }
});

test('1B 3–4 füllt sich aus Ergebnis-JSONs (Median selbst gerechnet, p95 gepoolt)', () => {
  const wurzel = mkdtempSync(join(tmpdir(), 'niklas-1b-'));
  try {
    mkdirSync(join(wurzel, 'evidenz/1B/messung'), { recursive: true });
    const fenster = (ms) => ({
      complete: true,
      actions: Object.fromEntries(
        ['join', 'vote', 'qaSubmit', 'blitzlicht'].map((a) => [
          a,
          {
            planned: 20,
            succeeded: 20,
            failed: 0,
            latency: { durationSamplesMs: Array(20).fill(ms) },
          },
        ]),
      ),
    });
    const datei = (tag, jobs, ms) => ({
      tag,
      commit: '5e758d0a1234',
      umgebung: { rechner: 'i7-10700K' },
      experiment: {
        config: { n: jobs.length, timeoutMs: 300000 },
        jobs: jobs.map((j) => ({ jobMs: j, fallbackReason: 'unavailable' })),
        live: { windows: [fenster(ms), fenster(ms)] },
      },
      treiber: {
        auftraege: [
          { measurement: { resources: { maxRssBytes: 471 * 1048576, maxCpuPercent: 58 } } },
        ],
      },
    });
    writeFileSync(
      join(wurzel, 'evidenz/1B/messung/2026-11-15-lauf-f1-summary.json'),
      JSON.stringify(datei('f1-summary', [57, 128, 48, 43, 117, 47, 47, 46, 48, 212], 30)),
    );
    writeFileSync(
      join(wurzel, 'evidenz/1B/messung/2026-11-15-lauf-dev-f1-summary.json'),
      JSON.stringify(datei('dev-f1-summary', [1], 1)),
    );
    const dd = ladeDaten1B34(wurzel);
    assert.equal(dd.laeufe.length, 1, 'dev-Läufe zählen nicht');
    const f1 = dd.finde('f1');
    assert.equal(f1.jobMedianMs, 48);
    assert.equal(f1.live.join.p95Ms, 30);
    assert.equal(f1.liveGeplant, 160);
    const m2 = folien1B34(dd).find((f) => f.id === 'M2');
    assert.match(ohneTags(m2.inhalt), /\b48\b/);
  } finally {
    rmSync(wurzel, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------- im Browser

test('Layout: Niklas-Folien und G9 ohne Überlappung, einzeilige Titel, alles in der Bühne', async () => {
  const befunde = (await layoutBefunde(browser, deck)).filter((b) => /^(N|M|RN|G9)/.test(b));
  assert.deepEqual(befunde, []);
});

test('Reihenfolge: G0, Jonas, Niklas 1A und 1B 3–4, G9, Anhang, Reserve', async () => {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(pathToFileURL(deck).href);
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll('.folie')].map((f) => [f.dataset.id, f.dataset.teil]),
  );
  await page.close();
  const pos = (id) => ids.findIndex(([x]) => x === id);
  assert.equal(ids[0][0], 'G0');
  assert.ok(pos('J15') < pos('N1') && pos('N10') < pos('M1') && pos('M4') < pos('G9'));
  assert.deepEqual(
    ids.slice(pos('G9') + 1, pos('G9') + 3).map(([x]) => x),
    ['J16', 'NL'],
  );
  assert.ok(pos('RN1') > pos('NL'));
  assert.equal(ids.find(([x]) => x === 'RN1')[1], 'reserve');
});

/** Sichtbare Folien im Druck mit ?druck=… */
async function druckAuszug(art) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(`${pathToFileURL(deck).href}?druck=${art}`);
  await page.emulateMedia({ media: 'print' });
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll('.folie')]
      .filter((f) => getComputedStyle(f).display !== 'none')
      .map((f) => f.dataset.id),
  );
  await page.close();
  return ids;
}

test('Druck ?druck=niklas: genau Niklas’ Folien samt Literatur und Reserve; Jonas ohne RN', async () => {
  assert.deepEqual(await druckAuszug('niklas'), [
    ...haupt1A.map((f) => f.id),
    ...n1b.map((f) => f.id),
    'NL',
    ...reserve1A.map((f) => f.id),
  ]);
  const jonas = await druckAuszug('jonas');
  assert.ok(!jonas.some((id) => /^(N|M|RN)/.test(id)), 'keine Niklas-Folie im Jonas-PDF');
});

test('Fußzeilen der Niklas-Folien einzeilig, nicht abgeschnitten', async () => {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(pathToFileURL(deck).href);
  await page.emulateMedia({ media: 'print' });
  const befunde = await page.evaluate(() =>
    [
      ...document.querySelectorAll(
        '.folie[data-teil="niklas"] .folie-fuss, .folie[data-autor="niklas"] .folie-fuss',
      ),
    ].flatMap((el) => {
      const zeile = parseFloat(getComputedStyle(el).lineHeight);
      const fehler = [];
      if (el.scrollWidth > el.clientWidth + 1) fehler.push('abgeschnitten');
      if (el.clientHeight - 12 > zeile + 2) fehler.push('mehr als eine Zeile');
      return fehler.map((f) => `${el.closest('.folie').dataset.id}: ${f}`);
    }),
  );
  await page.close();
  assert.deepEqual(befunde, []);
});

/** Öffnet das Deck auf der Folie vor `id` und zählt je Tastendruck die eingeblendeten Elemente. */
async function ablauf(id, stufen, reducedMotion) {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    reducedMotion,
  });
  const page = await context.newPage();
  await page.goto(`${pathToFileURL(deck).href}#${id}`);
  const an = () =>
    page.evaluate(() => {
      const f = document.querySelector('.folie[data-aktuell]');
      return `${f.dataset.id}:${f.dataset.aufbauStufe ?? '-'}:${f.querySelectorAll('[data-ab][data-an]').length}`;
    });
  const verlauf = [await an()];
  for (let i = 0; i < stufen + 1; i++) {
    await page.keyboard.press('ArrowRight');
    verlauf.push(await an());
  }
  await page.keyboard.press('ArrowLeft'); // zurück ins Endbild
  verlauf.push(await an());
  const uebergang = await page.evaluate(
    (fid) =>
      getComputedStyle(document.querySelector(`.folie[data-id="${fid}"] [data-ab]`))
        .transitionDuration,
    id,
  );
  await context.close();
  return { verlauf, uebergang };
}

test('N6 baut in drei Stufen auf: 4, dann 7, dann 11 Treffer; rückwärts ins Endbild', async () => {
  const { verlauf, uebergang } = await ablauf('N6', 3, 'no-preference');
  // je Stufe: Treffer-Zellen plus genau eine Erklärzeile
  assert.deepEqual(verlauf, ['N6:0:1', 'N6:1:5', 'N6:2:8', 'N6:3:12', 'N7:0:0', 'N6:3:12']);
  const ms = parseFloat(uebergang.split(',')[0]) * 1000;
  assert.ok(ms >= 150 && ms <= 300, `Übergang ${uebergang}`);
});

test('N7 baut in zwei Stufen auf (Latenz, dann Analyse, dann CPU); reduzierte Bewegung ohne Übergang', async () => {
  const normal = await ablauf('N7', 2, 'no-preference');
  // Stufe 0: nichts mit data-ab; 1: Band und Analyse; 2: zusätzlich CPU
  assert.deepEqual(normal.verlauf, ['N7:0:0', 'N7:1:2', 'N7:2:3', 'N8:-:0', 'N7:2:3']);
  const reduziert = await ablauf('N7', 2, 'reduce');
  assert.deepEqual(reduziert.verlauf, normal.verlauf);
  assert.equal(reduziert.uebergang, '0s');
});

test('Druck: N6 und N7 stehen im Endbild', async () => {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(pathToFileURL(deck).href);
  await page.emulateMedia({ media: 'print' });
  await page.waitForFunction(
    () =>
      document.querySelector('.folie[data-id="N6"]').dataset.aufbauStufe === '3' &&
      document.querySelector('.folie[data-id="N7"]').dataset.aufbauStufe === '2',
  );
  const sichtbar = await page.evaluate(() =>
    ['N6', 'N7'].map(
      (id) =>
        [...document.querySelectorAll(`.folie[data-id="${id}"] [data-ab]`)].filter(
          (el) => el.hasAttribute('data-an') && getComputedStyle(el).opacity === '1',
        ).length,
    ),
  );
  await page.close();
  assert.deepEqual(sichtbar, [12, 3]);
});
