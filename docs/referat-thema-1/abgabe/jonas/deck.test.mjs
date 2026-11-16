// Tests für das Browser-Deck (Task 7): Playwright über file://, Chromium aus den Repo-Abhängigkeiten.
// page.evaluate-Rückrufe laufen im Browser:
/* global document, getComputedStyle, location */
import { Buffer } from 'node:buffer';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { baueDeck } from './deck.mjs';
import { folien, ladeFolienDaten } from './folien.mjs';
import { kameraViewBox, lupeRahmen, zoomDeckkraft } from './grafik.mjs';
import { layoutBefunde } from './layout-pruefung.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HIER, '../..');
const requireRepo = createRequire(resolve(HIER, '../../../../package.json'));
const { chromium } = requireRepo('playwright');

const F = folien(ladeFolienDaten(ROOT));
const JONAS = F.filter((f) => f.teil === 'jonas');
const RAHMEN = F.filter((f) => f.teil === 'rahmen');
const RESERVE = F.filter((f) => f.teil === 'reserve');
const STATIONEN = F.filter((f) => f.station);

let ordner;
let browser;
let pngs;
let deckOhneNiklas;
let deckMitNiklas;

before(async () => {
  ordner = mkdtempSync(join(tmpdir(), 'deck-test-'));
  browser = await chromium.launch();
  // Drei kleine 16:9-PNGs als Stellvertreter für Niklas' Seiten.
  const seite = await browser.newPage({ viewport: { width: 320, height: 180 } });
  pngs = [];
  for (const [i, farbe] of ['#dde', '#ded', '#edd'].entries()) {
    await seite.setContent(
      `<body style="margin:0;background:${farbe}"><h1>Niklas ${i}</h1></body>`,
    );
    const pfad = join(ordner, `niklas-${i}.png`);
    await seite.screenshot({ path: pfad });
    pngs.push(pfad);
  }
  await seite.close();
  deckOhneNiklas = join(ordner, 'ohne.html');
  writeFileSync(
    deckOhneNiklas,
    baueDeck(F, { niklas: { teil1: [], teil2: [] }, eingebettet: true }),
  );
  deckMitNiklas = join(ordner, 'mit.html');
  writeFileSync(
    deckMitNiklas,
    baueDeck(F, { niklas: { teil1: pngs.slice(0, 2), teil2: pngs.slice(2) }, eingebettet: true }),
  );
});

after(async () => {
  await browser?.close();
  if (ordner) rmSync(ordner, { recursive: true, force: true });
});

/** Öffnet ein Deck und sammelt Konsolenfehler, Seitenfehler und Anfragen. */
async function oeffne(pfad, { reducedMotion = 'no-preference', hash = '' } = {}) {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    reducedMotion,
  });
  const page = await context.newPage();
  const fehler = [];
  const anfragen = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') fehler.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => fehler.push(`pageerror: ${e.message}`));
  page.on('request', (r) => anfragen.push(r.url()));
  await page.goto(pathToFileURL(pfad).href + hash);
  await page.evaluate(() => document.fonts.ready);
  return { page, context, fehler, anfragen };
}

const aktuelleId = (page) =>
  page.evaluate(() => document.querySelector('.folie[data-aktuell]')?.dataset.id);

async function geheZu(page, id) {
  for (let i = 0; i < 80 && (await aktuelleId(page)) !== id; i++) {
    await page.keyboard.press('ArrowRight');
  }
  assert.equal(await aktuelleId(page), id);
}

test('baueDeck verlangt eingebettete Ausgabe', () => {
  assert.throws(() => baueDeck(F, { niklas: { teil1: [], teil2: [] }, eingebettet: false }));
});

test('Deck lädt ohne Konsolenfehler und ohne Anfragen außer der Datei selbst', async () => {
  for (const pfad of [deckOhneNiklas, deckMitNiklas]) {
    const { page, context, fehler, anfragen } = await oeffne(pfad);
    await page.keyboard.press('End');
    await page.keyboard.press('Home');
    assert.deepEqual(fehler, []);
    const fremd = anfragen.filter((u) => !u.startsWith('data:') && u !== pathToFileURL(pfad).href);
    assert.deepEqual(fremd, [], 'nur die Datei selbst wird geladen');
    await context.close();
  }
});

test('Anzahl Folien = Rahmen + Niklas + Jonas, Reserve getrennt', async () => {
  const faelle = [
    [deckOhneNiklas, 2], // je eine Platzhalterfolie „Teil Niklas“
    [deckMitNiklas, pngs.length],
  ];
  for (const [pfad, niklas] of faelle) {
    const { page, context } = await oeffne(pfad);
    const z = await page.evaluate(() => ({
      haupt: document.querySelectorAll('.folie:not([data-teil="reserve"])').length,
      niklas: document.querySelectorAll('.folie[data-teil="niklas"]').length,
      jonas: [...document.querySelectorAll('.folie[data-teil="jonas"]')].map((s) => s.dataset.id),
      nachG9: document.querySelector('.folie[data-id="G9"]').nextElementSibling?.dataset.id,
      reserve: document.querySelectorAll('.folie[data-teil="reserve"]').length,
      reihenfolge: [...document.querySelectorAll('.folie')].map((s) => s.dataset.teil),
      platzhalter: [...document.querySelectorAll('.folie[data-teil="niklas"] .folie-titel')].map(
        (t) => t.textContent,
      ),
      bilder: document.querySelectorAll('.folie[data-teil="niklas"] img[src^="data:image/png"]')
        .length,
    }));
    assert.equal(z.haupt, RAHMEN.length + niklas + JONAS.length);
    assert.equal(z.niklas, niklas);
    assert.deepEqual(
      z.jonas,
      JONAS.map((f) => f.id),
    );
    assert.equal(z.reserve, RESERVE.length);
    assert.equal(z.nachG9, 'J16', 'Literaturverzeichnis nach G9');
    // Reihenfolge: G0, Niklas 1A, Jonas, Niklas 1B 3–4, G9, Anhang (J16), Reserve
    const block = z.reihenfolge.filter((t, i, a) => i === 0 || a[i - 1] !== t);
    assert.deepEqual(block, ['rahmen', 'niklas', 'jonas', 'niklas', 'rahmen', 'jonas', 'reserve']);
    if (niklas === 2) {
      assert.deepEqual(z.platzhalter, ['Teil Niklas', 'Teil Niklas']);
    } else {
      assert.equal(z.bilder, niklas);
    }
    await context.close();
  }
});

test('Fußzeile zeigt Seitenzahl im Vortrag und Quelle', async () => {
  const { page, context } = await oeffne(deckOhneNiklas);
  const fuss = await page.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll('.folie')].map((s) => [
        s.dataset.id,
        s.querySelector('.folie-fuss')?.textContent ?? null,
      ]),
    ),
  );
  const gesamt = RAHMEN.length + 2 + JONAS.length;
  // ohne führende Null wie bei Niklas („2 / 9“)
  assert.match(fuss.G0, new RegExp(`^1 / ${gesamt} · `));
  assert.match(fuss.J1, new RegExp(`^3 / ${gesamt} · `));
  assert.match(fuss.R1, /^Reserve R1 · /);
  assert.match(fuss.J16, new RegExp(`^${gesamt} / ${gesamt} · `));
  await context.close();
});

test('wandernder Marker steht auf der Station der Folie, sonst ausgeblendet', async () => {
  const { page, context } = await oeffne(deckOhneNiklas);
  const marker = () =>
    page.evaluate(() => {
      const m = document.querySelector('.weg-wandernd');
      return { aktiv: m.dataset.aktiv ?? '', sichtbar: !m.hidden && m.offsetParent !== null };
    });
  await geheZu(page, 'J4');
  assert.deepEqual(await marker(), { aktiv: '', sichtbar: false });
  await geheZu(page, 'J5');
  assert.equal((await marker()).aktiv, 'klick');
  await geheZu(page, 'J6');
  assert.deepEqual(await marker(), { aktiv: 'kontext', sichtbar: true });
  for (const f of STATIONEN) {
    await page.keyboard.press('Home');
    await geheZu(page, f.id);
    const m = await marker();
    assert.equal(m.aktiv, f.station, f.id);
    // J3 zeigt die große Karte mit eigenem Marker; dort bleibt die kleine Karte aus.
    assert.equal(m.sichtbar, !f.inhalt.includes('class="auftrag"'), f.id);
  }
  await context.close();
});

test('Markerfahrt läuft als Übergang, mit reduzierter Bewegung gibt es keine Animation', async () => {
  const normal = await oeffne(deckOhneNiklas);
  await geheZu(normal.page, 'J5');
  await normal.page.keyboard.press('ArrowRight');
  assert.ok(
    (await normal.page.evaluate(() => document.getAnimations().length)) > 0,
    'Gegenprobe: ohne reduzierte Bewegung fährt der Marker',
  );
  await normal.context.close();

  const ruhig = await oeffne(deckOhneNiklas, { reducedMotion: 'reduce' });
  await geheZu(ruhig.page, 'J5');
  for (let i = 0; i < 8; i++) {
    await ruhig.page.keyboard.press('ArrowRight');
    assert.equal(await ruhig.page.evaluate(() => document.getAnimations().length), 0);
  }
  await ruhig.context.close();
});

test('J13: der Clip startet erst auf Tastendruck, der nächste Druck geht weiter', async () => {
  const medien = join(HIER, 'medien');
  const pfad = join(ordner, 'clip-klick.html');
  writeFileSync(
    pfad,
    baueDeck(F, {
      niklas: { teil1: [], teil2: [] },
      clip: join(medien, 'clip.webm'),
      clipInfo: JSON.parse(readFileSync(join(medien, 'clip.json'), 'utf8')),
      standbild: join(medien, 'clip-standbild.png'),
      eingebettet: true,
    }),
  );
  const { page, context } = await oeffne(pfad);
  await geheZu(page, 'J12');
  await page.keyboard.press('ArrowRight');
  assert.equal(await aktuelleId(page), 'J13');
  await page.waitForTimeout(400);
  const laeuft = () =>
    page.evaluate(() => !document.querySelector('.folie[data-id="J13"] video').paused);
  assert.equal(await laeuft(), false, 'kein Autoplay');
  await page.keyboard.press('ArrowRight');
  assert.equal(await aktuelleId(page), 'J13', 'erster Druck startet den Clip');
  await page.waitForFunction(() => !document.querySelector('.folie[data-id="J13"] video').paused);
  // Druck während des Clips: ans Ende springen (Ergebnisbild), auf der Folie bleiben
  await page.keyboard.press('ArrowRight');
  assert.equal(await aktuelleId(page), 'J13', 'Druck während des Clips bleibt auf J13');
  const amEnde = await page.evaluate(() => {
    const v = document.querySelector('.folie[data-id="J13"] video');
    return v.paused && v.currentTime >= v.duration - 0.05;
  });
  assert.equal(amEnde, true, 'Clip steht auf dem letzten Bild');
  await page.keyboard.press('ArrowRight');
  assert.equal(await aktuelleId(page), 'J15');
  // Zurück: Clip wieder am Anfang, wartet auf den Tastendruck
  await page.keyboard.press('ArrowLeft');
  assert.equal(await aktuelleId(page), 'J13');
  const neu = await page.evaluate(() => {
    const v = document.querySelector('.folie[data-id="J13"] video');
    return { paused: v.paused, t: v.currentTime };
  });
  assert.deepEqual(neu, { paused: true, t: 0 });
  await page.keyboard.press('ArrowRight');
  assert.equal(
    await aktuelleId(page),
    'J13',
    'nach dem Zurückgehen startet ein Druck den Clip neu',
  );
  await context.close();
});

test('J10 zoomt in drei Schritten über kameraViewBox, Beschriftungen über zoomDeckkraft', async () => {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const { page, context, fehler } = await oeffne(deckOhneNiklas, { reducedMotion });
    await geheZu(page, 'J9');
    await page.keyboard.press('ArrowRight');
    assert.equal(await aktuelleId(page), 'J10');
    const stufen = await page.evaluate(() =>
      JSON.parse(document.querySelector('.folie[data-id="J10"]').dataset.zoomStufen),
    );
    assert.equal(stufen.length, 4);
    assert.deepEqual([stufen[0], stufen[3]], [0, 1]);
    for (let i = 0; i < stufen.length; i++) {
      if (i > 0) await page.keyboard.press('ArrowRight');
      assert.equal(await aktuelleId(page), 'J10', `Schritt ${i} bleibt auf J10`);
      await page.waitForFunction(
        (s) => document.querySelector('.folie[data-id="J10"]').dataset.zoomFertig === String(s),
        i,
      );
      const ist = await page.evaluate(() => {
        const k = document.querySelector('.folie[data-id="J10"] svg.kamera');
        const [x, y, w, h] = k.getAttribute('viewBox').split(/\s+/).map(Number);
        const deckkraft = [...k.ownerSVGElement.querySelectorAll('[data-zoom-von]')].map((g) => ({
          von: Number(g.dataset.zoomVon),
          bis: Number(g.dataset.zoomBis),
          o: Number(g.getAttribute('opacity')),
        }));
        const spalten = [...document.querySelectorAll('.folie[data-id="J10"] [data-spalte]')].map(
          (g) => g.dataset.spalte,
        );
        return { x, y, w, h, deckkraft, spalten };
      });
      const soll = kameraViewBox(stufen[i]);
      // Übersichtskarte: Lupenrahmen folgt dem Ausschnitt (gleiche Formel wie lupeRahmen)
      const lupe = await page.evaluate(() => {
        const r = document.querySelector('.folie[data-id="J10"] [data-lupe]');
        return ['x', 'y', 'width', 'height'].map((a) => Number(r.getAttribute(a)));
      });
      const lSoll = lupeRahmen(stufen[i]);
      [lSoll.x, lSoll.y, lSoll.w, lSoll.h].forEach((v, j) =>
        assert.ok(
          Math.abs(lupe[j] - v) <= 1e-4 * lSoll.w,
          `Stufe ${i} Lupe ${j}: ${lupe[j]} statt ${v}`,
        ),
      );
      for (const k of ['x', 'y', 'w', 'h']) {
        assert.ok(
          Math.abs(ist[k] - soll[k]) <= 1e-4 * soll.w,
          `Stufe ${i} ${k}: ${ist[k]} statt ${soll[k]}`,
        );
      }
      for (const g of ist.deckkraft) {
        assert.ok(Math.abs(g.o - zoomDeckkraft(stufen[i], g.von, g.bis)) < 1e-3);
      }
      // Kennzahlen unter dem Feld: Transport ab Stufe 2, Netz ab Stufe 3
      assert.deepEqual(ist.spalten, ['inferenz', 'transport', 'netz']);
      const sichtbar = await page.evaluate(() =>
        [...document.querySelectorAll('.folie[data-id="J10"] [data-spalte]')].map((g) =>
          Number(g.getAttribute('opacity') ?? 1),
        ),
      );
      assert.deepEqual(
        sichtbar,
        [
          [1, 0, 0],
          [1, 0, 0],
          [1, 1, 0],
          [1, 1, 1],
        ][i],
        `Stufe ${i}`,
      );
    }
    await page.keyboard.press('ArrowRight');
    assert.equal(await aktuelleId(page), 'J12');
    // zurück: J10 im Endzustand, dann schrittweise heraus
    await page.keyboard.press('ArrowLeft');
    assert.equal(await aktuelleId(page), 'J10');
    assert.equal(
      await page.evaluate(() => document.querySelector('.folie[data-id="J10"]').dataset.zoomStufe),
      '3',
    );
    await page.keyboard.press('ArrowLeft');
    assert.equal(await aktuelleId(page), 'J10');
    if (reducedMotion === 'reduce') {
      assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    }
    assert.deepEqual(fehler, []);
    await context.close();
  }
});

test('Tasten: Home, End, Bild ab/auf, Leertaste; Reserve-Übersicht mit r', async () => {
  const { page, context } = await oeffne(deckOhneNiklas);
  await page.keyboard.press('End');
  assert.equal(await aktuelleId(page), 'J16');
  await page.keyboard.press('Home');
  assert.equal(await aktuelleId(page), 'G0');
  await page.keyboard.press('PageDown');
  await page.keyboard.press('Space');
  assert.equal(await aktuelleId(page), 'J1');
  await page.keyboard.press('PageUp');
  await geheZu(page, 'J7');

  await page.keyboard.press('r');
  const knoepfe = await page.evaluate(() =>
    [...document.querySelectorAll('.reserve-uebersicht button[data-ziel]')].map(
      (b) => b.dataset.ziel,
    ),
  );
  assert.deepEqual(
    knoepfe,
    RESERVE.map((f) => f.id),
  );
  assert.ok(await page.locator('.reserve-uebersicht').isVisible());
  assert.ok(
    await page.evaluate(() => document.activeElement?.closest('.reserve-uebersicht') !== null),
    'Fokus liegt in der Übersicht',
  );
  await page.keyboard.press('2');
  assert.equal(await aktuelleId(page), RESERVE[1].id);
  assert.ok(!(await page.locator('.reserve-uebersicht').isVisible()));
  await page.keyboard.press('ArrowRight');
  assert.equal(await aktuelleId(page), RESERVE[2].id);
  await page.keyboard.press('Escape');
  assert.equal(await aktuelleId(page), 'J7', 'Escape führt zurück in den Vortrag');

  await page.keyboard.press('r');
  await page.keyboard.press('r');
  assert.ok(!(await page.locator('.reserve-uebersicht').isVisible()));
  assert.equal(await aktuelleId(page), 'J7');
  await context.close();
});

test('Sprungmarke im Adressfeld öffnet die Folie', async () => {
  const { page, context } = await oeffne(deckOhneNiklas, { hash: '#J8' });
  assert.equal(await aktuelleId(page), 'J8');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(() => location.hash), '#J9');
  await context.close();
});

test('keine http(s)-Verweise außer im Quellenverzeichnis', async () => {
  for (const pfad of [deckOhneNiklas, deckMitNiklas]) {
    // Ein Quellenverzeichnis (Folie mit quellenverzeichnis: true) steht zwischen diesen Marken.
    const html = readFileSync(pfad, 'utf8').replace(/<!--quellen-->[\s\S]*?<!--\/quellen-->/g, '');
    assert.deepEqual(html.match(/https?:\/\/[^\s"'<)]*/g) ?? [], []);
  }
});

test('Schriften Inter 600 und IBM Plex Mono 400 sind geladen', async () => {
  const { page, context } = await oeffne(deckOhneNiklas);
  const r = await page.evaluate(async () => {
    await document.fonts.ready;
    const geladen = [...document.fonts]
      .filter((f) => f.status === 'loaded')
      .map((f) => `${f.family.replace(/"/g, '')} ${f.weight}`);
    return {
      inter: document.fonts.check('600 24px Inter'),
      plex: document.fonts.check('400 24px "IBM Plex Mono"'),
      geladen,
    };
  });
  assert.ok(r.inter && r.plex);
  assert.ok(r.geladen.includes('Inter 600'), r.geladen.join(', '));
  assert.ok(r.geladen.includes('IBM Plex Mono 400'), r.geladen.join(', '));
  await context.close();
});

test('Druck: jede Folie eine Seite 1600 × 900, J10 im Endzustand, Marker an der Station', async () => {
  const seiten = (pdf) => (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  const { page, context } = await oeffne(deckOhneNiklas);
  await geheZu(page, 'J10'); // Zoom steht auf Stufe 0
  await page.emulateMedia({ media: 'print' });
  // Das change-Ereignis von matchMedia('print') kommt asynchron: auf den Endzustand warten.
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.folie[data-zoom-stufen]')].every(
      (s) => s.dataset.zoomFertig === String(JSON.parse(s.dataset.zoomStufen).length - 1),
    ),
  );
  const statisch = await page.evaluate(() =>
    [...document.querySelectorAll('.folie')]
      .filter((s) => s.dataset.station && !s.querySelector('.folie-flaeche .auftrag'))
      .map((s) => {
        const m = s.querySelector('.weg-mini-statisch');
        return [s.dataset.id, m?.dataset.aktiv, m ? getComputedStyle(m).display : 'fehlt'];
      }),
  );
  for (const [id, aktiv, display] of statisch) {
    assert.equal(aktiv, F.find((f) => f.id === id).station, id);
    assert.notEqual(display, 'none', id);
  }
  const vb = await page.evaluate(() =>
    document.querySelector('.folie[data-id="J10"] svg.kamera').getAttribute('viewBox'),
  );
  const soll = kameraViewBox(1);
  assert.ok(Math.abs(Number(vb.split(/\s+/)[2]) - soll.w) < 1e-3, `J10 druckt Zoom 1: ${vb}`);
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  assert.equal(seiten(pdf), RAHMEN.length + 2 + JONAS.length + RESERVE.length);
  // 1600 × 900 px = 1200 × 675 pt
  for (const [, box] of pdf.toString('latin1').matchAll(/\/MediaBox\s*\[([^\]]+)\]/g)) {
    const [, , b, h] = box.trim().split(/\s+/).map(Number);
    assert.ok(Math.abs(b - 1200) < 0.5 && Math.abs(h - 675) < 0.5, `Seitengröße ${box}`);
  }
  writeFileSync(join(ordner, 'druck.pdf'), pdf);
  assert.ok(readFileSync(join(ordner, 'druck.pdf')).length > 10_000);
  await context.close();

  // Nur Jonas' Folien und Reserve (für jonas-folien.pdf in Task 10)
  const nurJonas = await oeffne(deckOhneNiklas, { hash: '' });
  await nurJonas.page.evaluate(() => (document.documentElement.dataset.druck = 'jonas'));
  await nurJonas.page.emulateMedia({ media: 'print' });
  const pdf2 = await nurJonas.page.pdf({ preferCSSPageSize: true, printBackground: true });
  assert.equal(seiten(pdf2), JONAS.length + RESERVE.length);
  await nurJonas.context.close();
});

test('Layout: je Folie keine Überlappung von Titel, Frage, Fläche und Fußzeile, nichts außerhalb der Bühne', async () => {
  assert.deepEqual(await layoutBefunde(browser, deckOhneNiklas), []);
});

test('ZL: Quellenzeilen in der Fußzeile werden nie abgeschnitten, eine Zeile (Audit 2026-11-16)', async () => {
  const { page, context } = await oeffne(deckOhneNiklas);
  await page.emulateMedia({ media: 'print' });
  const befunde = await page.evaluate(() =>
    [...document.querySelectorAll('.folie-fuss')].flatMap((el) => {
      const zeile = parseFloat(getComputedStyle(el).lineHeight);
      const fehler = [];
      if (el.scrollWidth > el.clientWidth + 1) fehler.push('abgeschnitten');
      if (getComputedStyle(el).textOverflow === 'ellipsis') fehler.push('Ellipse');
      if (el.clientHeight - 12 > zeile + 2) fehler.push('mehr als eine Zeile');
      return fehler.map((f) => `${el.closest('.folie').dataset.id}: ${f}`);
    }),
  );
  await context.close();
  assert.deepEqual(befunde, []);
});

test('Layout mit dem echten Clip (medien/): J13 mit Video, Standbild und Bildunterschrift passt', async () => {
  const medien = join(HIER, 'medien');
  const pfad = join(ordner, 'mit-clip.html');
  writeFileSync(
    pfad,
    baueDeck(F, {
      niklas: { teil1: [], teil2: [] },
      clip: join(medien, 'clip.webm'),
      clipInfo: JSON.parse(readFileSync(join(medien, 'clip.json'), 'utf8')),
      standbild: join(medien, 'clip-standbild.png'),
      eingebettet: true,
    }),
  );
  assert.deepEqual(await layoutBefunde(browser, pfad), []);
});

test('Layout-Gegenprobe: zweizeiliger Titel und überlappender Beleg werden gemeldet', async () => {
  const kaputt = F.map((f) => {
    if (f.id === 'J12') return { ...f, titel: `${f.titel}, ${f.titel}, ${f.titel}` };
    if (f.id === 'J7')
      return {
        ...f,
        inhalt: f.inhalt.replace(
          '<pre data-artefakt="budget" class="mono" style="',
          '<pre data-artefakt="budget" class="mono" style="position:relative;top:120px;',
        ),
      };
    if (f.id === 'R8') return { ...f, inhalt: f.inhalt.replace('width:100%', 'width:1700px') };
    return f;
  });
  const pfad = join(ordner, 'kaputt.html');
  writeFileSync(pfad, baueDeck(kaputt, { niklas: { teil1: [], teil2: [] }, eingebettet: true }));
  const befunde = (await layoutBefunde(browser, pfad)).join('\n');
  assert.match(befunde, /J12: Titel zweizeilig/);
  assert.match(befunde, /J7: pre\.mono.* trifft /);
  assert.match(befunde, /R8: .*(außerhalb der Bühne|ragt aus der Fläche)/);
});

test('Clip wird als data-URI in J13 eingebettet', () => {
  const clip = join(ordner, 'clip.webm');
  writeFileSync(clip, Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3, 4]));
  const standbild = join(ordner, 'standbild.png');
  writeFileSync(standbild, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const clipInfo = {
    datum: '2026-11-15',
    profil: 'balanced',
    wartezeitS: 171.6,
    raffungS: 4,
    grund: 'gate',
    timeoutMs: 300000,
    hinweis: 'Eine ausführliche Zusammenfassung war diesmal nicht möglich.',
  };
  const html = baueDeck(F, {
    niklas: { teil1: [], teil2: [] },
    clip,
    clipInfo,
    standbild,
    eingebettet: true,
  });
  assert.match(html, /<video[^>]+src="data:video\/webm;base64,GkXfowECAwQ="/);
  // Im PDF steht das Standbild statt des Videos (Druck-CSS der Vorlage).
  assert.match(html, /<img class="clip-standbild" src="data:image\/png;base64,iVBORw=="/);
  const nurJ13 = (h) => h.match(/<section[^>]*data-id="J13"[\s\S]*?<\/section>/)[0];
  assert.match(html, /Laboraufnahme 2026-11-15: 172 s Wartezeit, auf 4 s gerafft/);
  // Das Energieprofil gehört ins Protokoll, nicht auf die Folie (Wunsch des Autors).
  assert.doesNotMatch(nurJ13(html), /balanced|power-saver|Energieprofil/);
  // Grund dieses Laufs ehrlich nennen: Timeout, nicht das Gate; Hinweis wörtlich.
  assert.doesNotMatch(nurJ13(html).match(/<figcaption[\s\S]*?<\/figcaption>/)[0], /Timeout/);
  const mitTimeout = baueDeck(F, {
    niklas: { teil1: [], teil2: [] },
    clip,
    clipInfo: { ...clipInfo, grund: 'timeout' },
    standbild,
    eingebettet: true,
  });
  assert.match(mitTimeout, /Abbruch nach 300 s \(Timeout\), nicht das Gate, gleicher Hinweis/);
  assert.throws(
    () => baueDeck(F, { niklas: { teil1: [], teil2: [] }, clip, eingebettet: true }),
    /clipInfo/,
  );
  assert.doesNotMatch(html, /data-nachbau/);
  // Der Vermerk gehört zum ersetzten Block: Mit Clip steht nirgends „keine Bildschirmaufnahme“
  // (Schlussprüfung I1), dafür die Bildunterschrift des Clips; ohne Clip umgekehrt.
  const j13 = (h) => h.match(/<section[^>]*data-id="J13"[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(j13(html), /keine Bildschirmaufnahme/);
  assert.doesNotMatch(j13(html), /Fallback-Regel/);
  assert.match(j13(html), /Laboraufnahme 2026-11-15/);
  const ohne = baueDeck(F, { niklas: { teil1: [], teil2: [] }, eingebettet: true });
  assert.match(j13(ohne), /Nachbau, keine Bildschirmaufnahme/);
  assert.doesNotMatch(j13(ohne), /Laboraufnahme/);
});
