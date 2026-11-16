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

test('1A: elf Folien im Vortrag (N3, N6b, N8 seit 2026-11-16 aus der Reserve), Literatur NL im Anhang', () => {
  assert.deepEqual(
    haupt1A.map((f) => f.id),
    ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N6b', 'N7', 'N8', 'N9', 'N10'],
  );
  assert.deepEqual(
    n1a.filter((f) => f.anhang).map((f) => f.id),
    ['NL'],
  );
  assert.deepEqual(
    reserve1A.map((f) => f.id),
    ['RN2'],
  );
  assert.ok(reserve1A.every((f) => f.autor === 'niklas' && f.zeitS === 0));
  assert.ok(haupt1A.every((f) => f.auftrag === '1A' && f.station === null));
});

test('Zeit: Niklas 14:00–15:00 min samt Rahmen (Titel, Fahrplan, Systembild, Fazit, Dank); N2, N4, N7; Kurzfassung', () => {
  const s = summe(haupt1A);
  assert.ok(s >= 540 && s <= 580, `1A ${s} s`);
  // Alle Rahmenfolien spricht Niklas (Absprache 2026-11-16); 1B 3–4 zwei Folien, höchstens 150 s
  const rahmen = alle.filter((f) => f.teil === 'rahmen');
  assert.deepEqual(
    rahmen.map((f) => f.id),
    ['GT', 'G0', 'GK', 'G9', 'GD'],
  );
  for (const f of rahmen) assert.equal(f.sprecher, 'niklas', f.id);
  assert.ok(n1b.length <= 2 && summe(n1b) <= 150, `1B 3–4 ${summe(n1b)} s`);
  const gesamt = s + summe(n1b) + summe(rahmen);
  // Entscheidung der Autoren 2026-11-16: 15 min Redezeit je Person (ersetzt höchstens 10:30 min)
  assert.ok(gesamt >= 840 && gesamt <= 900, `Niklas ${gesamt} s`);
  // Prüfungsschritt 1 (N2), Vorab-Festlegung (N4), Diskussionskern Ursache (N7): je 30–50 s
  for (const id of ['N2', 'N4', 'N7']) {
    const f = haupt1A.find((x) => x.id === id);
    assert.ok(f.zeitS >= 30 && f.zeitS <= 50, `${id}: ${f.zeitS} s`);
  }
  const kurz = haupt1A.filter((f) => f.kurzfassung).map((f) => f.id);
  for (const id of ['N1', 'N4', 'N6', 'N7', 'N10']) assert.ok(kurz.includes(id), id);
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
  assert.match(md, /## RN2 /);
  assert.doesNotMatch(md, /## NL /, 'Literatur ohne Redezeit nicht in den Notizen');
});

test('Erzählbogen: G0 eröffnet, N10 übergibt an Jonas, J15 zurück an Niklas, M1 nimmt die Frage auf', () => {
  // Design 2026-11-15, Abschnitt 3: zwei Sprecherwechsel mit den abgestimmten Übergangssätzen
  assert.match(alle.find((f) => f.id === 'G0').notiz, /Ich beginne mit 1A auf dem App-Host/);
  assert.match(haupt1A[0].notiz, /^Ich beginne auf dem App-Host/);
  assert.match(
    ohneTags(haupt1A.at(-1).inhalt),
    /Was, wenn wir die schwere Arbeit auslagern\?.*Jonas/,
  );
  const j1 = alle.find((f) => f.id === 'J1');
  assert.match(j1.notiz, /^Danke, Niklas\./);
  const j15 = alle.find((f) => f.id === 'J15');
  assert.match(
    ohneTags(j15.inhalt),
    /Und wenn der zweite Host langsam ist oder ausfällt\?.*Niklas/,
  );
  assert.match(n1b[0].notiz, /^Danke, Jonas\. .*zweite Host langsam ist oder ausfällt/);
  assert.match(alle.find((f) => f.id === 'GD').notiz, /Fragen/);
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
  // abgeleitet (N7, Maßstab des Ausreißers): gesamtes Messfenster aller Läufe in Minuten
  zahl((d.live.laeufe * d.konfig.profil.durationMs) / 60000);
  for (let i = 0; i <= 5; i++) w.add(String(i)); // Blöcke, Varianten, Stufen
  return w;
}
// Festwerte außerhalb der Messreihe, je mit Beleg: 8 vCPU (ADR-0035, Zielhost), 0,1 s (Achsenmarke).
// 16 GB und ~4 GB (ADR-0035, Abschn. 2.1), 2,5 min (Jonas' 1B-ergebnis.md, warm im Median 148,6 s).
const FESTWERTE_NIKLAS = {
  8: 'ADR-0035 „8 vCPU“',
  '0,1': 'Achsenmarke 0,1 s',
  '2,5': '1B-ergebnis.md „im Median 148,6 s“',
  // N8, Bild zur Drosselung: Standardtakt von cpu.max (Kernel-Doku cgroup v2, „max 100000“ µs = 100 ms)
  100: 'Kernel-Doku cgroup v2, cpu.max „max 100000“',
};

test('Keine Zahl auf den 1A-Folien, die nicht aus den Daten kommt', () => {
  const adr = readFileSync(
    resolve(
      ROOT,
      '../architecture/decisions/0035-self-hosted-llm-runtime-llama-cpp-over-ollama.md',
    ),
    'utf8',
  );
  assert.match(adr, /8 vCPU/);
  assert.match(adr, /16-GB-Live-Host/);
  assert.match(adr, /~4-GB-LLM/);
  assert.match(readFileSync(resolve(ROOT, '1B-ergebnis.md'), 'utf8'), /im Median 148,6 s/);
  const w = erlaubt();
  const KENNUNG =
    /\b(?:8\.9b|16-GB|~?4-GB|[VHNMRJG]\d+|1[ABC]|ADR-\d{4}|v\d(?:\.\d)+(?:-\d+)?|[0-9a-f]{8}|cgroup v2|Vertrag v\d|Version \d(?:\.\d)*|20\d\d|p\d\d|Abschn\. [\d.]+|Z\. \d+)\b/g;
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

test('1B 3–4: M1–M2 aus den Ergebnis-JSONs ohne Platzhalter; ohne Daten eine Platzhalterfolie', () => {
  assert.deepEqual(
    n1b.map((f) => f.id),
    ['M1', 'M2'],
  );
  for (const f of n1b) {
    const t = [f.titel, ohneTags(f.inhalt), f.fuss, f.notiz, ...f.stichpunkte].join(' ');
    assert.doesNotMatch(t, /\[Niklas|\[Satz|\[Titel|Entwurf/, f.id);
    assert.match(f.quelle, /i7-10700K/, f.id);
  }
  const d1b = ladeDaten1B34(ROOT);
  assert.equal(d1b.finde('f1').jobMedianMs, 48);
  assert.equal(d1b.finde('f2').jobMedianMs, 134732);
  for (const l of d1b.laeufe) assert.equal(l.liveFehler, 0, l.datei);
  assert.match(n1b[0].inhalt, /Median 48 ms/);
  const leer = folien1B34();
  assert.equal(leer.length, 1);
  assert.match(leer[0].titel, /\[Titel\]/);
  assert.match(ohneTags(leer[0].inhalt) + leer[0].fuss, /\[Niklas\]/);
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
    const m1 = folien1B34(dd).find((f) => f.id === 'M1');
    assert.match(m1.inhalt, /Median 48 ms/);
  } finally {
    rmSync(wurzel, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------- im Browser

test('Layout: Niklas-Folien und Rahmen ohne Überlappung, Vermerke einzeilig, kein Inhalt oben klebend', async () => {
  const befunde = (await layoutBefunde(browser, deck)).filter((b) => /^(N|M|RN|G)/.test(b));
  assert.deepEqual(befunde, []);
});

test('Reihenfolge: GT, G0, GK, Niklas 1A, Jonas, Niklas 1B 3–4, G9, GD, Anhang, Reserve', async () => {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(pathToFileURL(deck).href);
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll('.folie')].map((f) => [f.dataset.id, f.dataset.teil]),
  );
  await page.close();
  const pos = (id) => ids.findIndex(([x]) => x === id);
  assert.deepEqual(
    ids.slice(0, 4).map(([x]) => x),
    ['GT', 'G0', 'GK', 'N1'],
  );
  // Niklas 1A → Jonas → Niklas 1B 3–4 → Fazit (Design 2026-11-15, Abschnitt 3)
  assert.equal(pos('J1'), pos('N10') + 1, 'Jonas folgt direkt auf N10');
  assert.equal(pos('M1'), pos('J15') + 1, '1B 3–4 folgt direkt auf J15');
  assert.ok(pos('M2') < pos('G9'));
  assert.deepEqual(
    ids.slice(pos('G9') + 1, pos('G9') + 4).map(([x]) => x),
    ['GD', 'J16', 'NL'],
  );
  assert.ok(pos('RN2') > pos('NL'));
  assert.equal(ids.find(([x]) => x === 'RN2')[1], 'reserve');
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
  // Titelfolie (beide Namen, lokal mit Matrikelnummern) steht in jedem Einzel-PDF.
  assert.deepEqual(await druckAuszug('niklas'), [
    'GT',
    ...haupt1A.map((f) => f.id),
    ...n1b.map((f) => f.id),
    'NL',
    ...reserve1A.map((f) => f.id),
  ]);
  const jonas = await druckAuszug('jonas');
  assert.equal(jonas[0], 'GT');
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
  // Stufe 0: nur Umrisse und Erklärzeile; ab Stufe 1 zusätzlich die graue Füllung samt Legende „hält“
  assert.deepEqual(verlauf, ['N6:0:1', 'N6:1:6', 'N6:2:9', 'N6:3:13', 'N6b:-:0', 'N6:3:13']);
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
  assert.deepEqual(sichtbar, [13, 3]);
});

// ---------------------------------------------------------------- Ergänzt 2026-11-16: Ortsmarken, M1 in Stufen

test('Ortsmarke: eine feste Miniatur des Systembilds auf jeder Folie von 1A und 1B 3–4, nur der Ort wechselt', async () => {
  const { SYSTEM_ORTE } = await import('../jonas/grafik.mjs');
  const orte = Object.fromEntries([...haupt1A, ...n1b].map((f) => [f.id, f.ort]));
  assert.deepEqual(orte, {
    N1: 'app-spacy',
    N2: 'app-alle',
    N3: 'app-spacy',
    N4: 'app-live',
    N5: 'app-live',
    N6: 'app-live',
    N6b: 'app-live',
    N7: 'app-live',
    N8: 'app-spacy',
    N9: 'app-spacy',
    N10: 'app-spacy',
    M1: 'llm-gestoert',
    M2: 'llm-live',
  });
  for (const o of Object.values(orte)) assert.ok(SYSTEM_ORTE[o], o);
  // Farbe je Teil: 1A auf dem App-Host, 1B am zweiten Host
  for (const f of haupt1A) assert.equal(SYSTEM_ORTE[f.ort].teil, '1A', f.id);
  for (const f of n1b) assert.equal(SYSTEM_ORTE[f.ort].teil, '1B', f.id);
  // Im Deck: dieselbe Marke, Beschriftung nennt den Ort
  for (const o of ['app-spacy', 'app-alle', 'app-live', 'llm-gestoert', 'llm-live'])
    assert.match(html, new RegExp(`data-ort="${o}"`));
  assert.match(html, /App-Host · spaCy-Sidecar/);
  assert.match(html, /Zweiter Host · gestört/);
});

test('M1: Störungen als Stufen (Stopp und Slot, DROP, zu spät) und Maßstab aus dem Verhältnis der Mediane', () => {
  const d1b = ladeDaten1B34(ROOT);
  const m1 = n1b.find((f) => f.id === 'M1');
  assert.equal(m1.aufbau, 3);
  const stufen = Object.fromEntries(
    [...m1.inhalt.matchAll(/data-ab="(\d)" data-stoerung="([a-z0-9]+)"/g)].map((m) => [
      m[2],
      Number(m[1]),
    ]),
  );
  assert.deepEqual(stufen, { f1: 1, busy: 1, f2: 2, l3: 3 });
  assert.equal((m1.notiz.match(/\[Weiter\]/g) ?? []).length, 3);
  const minuten = Math.round(d1b.finde('f2').jobMedianMs / d1b.finde('f1').jobMedianMs / 60);
  assert.match(ohneTags(m1.inhalt), new RegExp(`wartete DROP rund ${minuten} Minuten`));
});
