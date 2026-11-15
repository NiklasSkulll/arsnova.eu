// Prüft den Folienentwurf 1A und die Vorlage 1B 3–4 im gemeinsamen Deck: Layoutwächter wie für
// Jonas' Folien, Kurzbelege nach ZL, Literatur, Druckauszug nur mit Niklas' Folien.
// Aufruf: node --test docs/referat-thema-1/abgabe/niklas/*.test.mjs
/* global document, getComputedStyle */
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { layoutBefunde } from '../jonas/layout-pruefung.mjs';
import { baueEntwurf, notizen1A } from './bau-entwurf.mjs';
import { LITERATUR_1A, kurzbeleg1A } from './literatur-1a.mjs';

const HIER = resolve(fileURLToPath(import.meta.url), '..');
const { chromium } = createRequire(resolve(HIER, '../../../../package.json'))('playwright');
const { html, n1a, n1b } = baueEntwurf();

let ordner;
let browser;
let deck;
before(async () => {
  ordner = mkdtempSync(join(tmpdir(), 'entwurf-test-'));
  deck = join(ordner, 'entwurf.html');
  writeFileSync(deck, html);
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  if (ordner) rmSync(ordner, { recursive: true, force: true });
});

test('1A: neun Folien N1–N9, alle im Teil niklas, Gesamtzeit unter 7 min', () => {
  assert.deepEqual(
    n1a.map((f) => f.id),
    ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9'],
  );
  assert.ok(n1a.every((f) => f.teil === 'niklas' && f.notiz && f.zeitS > 0));
  assert.ok(n1a.reduce((s, f) => s + f.zeitS, 0) < 7 * 60);
  assert.match(notizen1A(n1a), /^# Sprechnotizen Niklas/);
});

test('ZL: jede 1A-Folie außer dem Verzeichnis trägt Kurzbelege, alle stehen im Verzeichnis', () => {
  const kurz = new Set(LITERATUR_1A.map((e) => e.kurz));
  for (const f of n1a.filter((x) => x.id !== 'N9')) {
    assert.ok(f.fuss.startsWith('Quelle: '), f.id);
    const belege = f.fuss.slice('Quelle: '.length).split(' · ')[0].split('; ');
    assert.ok(belege.length > 0, f.id);
    for (const beleg of belege) {
      assert.ok(
        [...kurz].some((k) => beleg === k || beleg.startsWith(`${k}, `)),
        `${f.id}: „${beleg}“ fehlt im Verzeichnis`,
      );
    }
  }
  assert.throws(() => kurzbeleg1A('fehlt2020'), /fehlt2020/);
});

test('Literatur 1A alphabetisch, ohne „o. J.“ und Abrufdatum', () => {
  const voll = LITERATUR_1A.map((e) => e.voll);
  assert.deepEqual(
    voll,
    [...voll].sort((a, b) => a.localeCompare(b, 'de')),
  );
  for (const v of voll) assert.doesNotMatch(v, /o\. J\.|abgerufen|Zugriff am/);
});

test('Vorlage 1B 3–4: Platzhalter M1–M5, deutlich als offen markiert', () => {
  assert.deepEqual(
    n1b.map((f) => f.id),
    ['M1', 'M2', 'M3', 'M4', 'M5'],
  );
  for (const f of n1b) assert.match(f.titel, /\[Titel\]/);
});

test('Layout: Niklas-Folien ohne Überlappung, einzeilige Titel, alles in der Bühne', async () => {
  const befunde = (await layoutBefunde(browser, deck)).filter((b) => /^[NM]\d/.test(b));
  assert.deepEqual(befunde, []);
});

test('Druck ?druck=niklas enthält genau Niklas’ Folien (1A und Vorlage 1B 3–4)', async () => {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${pathToFileURL(deck).href}?druck=niklas`);
  await page.emulateMedia({ media: 'print' });
  const sichtbar = await page.evaluate(() =>
    [...document.querySelectorAll('.folie')]
      .filter((f) => getComputedStyle(f).display !== 'none')
      .map((f) => f.dataset.id),
  );
  await context.close();
  assert.deepEqual(
    sichtbar,
    [...n1a, ...n1b].map((f) => f.id),
  );
});

test('Fußzeilen der Niklas-Folien höchstens zweizeilig und nicht abgeschnitten', async () => {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  await page.goto(pathToFileURL(deck).href);
  await page.emulateMedia({ media: 'print' });
  const befunde = await page.evaluate(() =>
    [...document.querySelectorAll('.folie[data-teil="niklas"] .folie-fuss')].flatMap((el) => {
      const zeile = parseFloat(getComputedStyle(el).lineHeight);
      const fehler = [];
      if (el.scrollWidth > el.clientWidth + 1) fehler.push('abgeschnitten');
      if (el.clientHeight - 12 > zeile * 2 + 2) fehler.push('mehr als zwei Zeilen');
      return fehler.map((f) => `${el.closest('.folie').dataset.id}: ${f}`);
    }),
  );
  await context.close();
  assert.deepEqual(befunde, []);
});
