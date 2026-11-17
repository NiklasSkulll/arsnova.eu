import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  berechneNachweisumfang,
  dauer,
  kopfzahlen,
  REFERAT,
  tabellenwerte,
} from './nachweisumfang.mjs';

const werte = berechneNachweisumfang();

/** Erste Spalte → zweite Spalte aller Tabellenzeilen der Markdown-Datei. */
function tabellen(markdown) {
  const zeilen = {};
  for (const zeile of markdown.split('\n')) {
    if (!zeile.startsWith('|') || /^\|\s*-/.test(zeile)) continue;
    const [, name, wert] = zeile.split('|').map((z) => z.trim());
    zeilen[name] = wert;
  }
  return zeilen;
}

test('nachweisumfang.md stimmt mit der Neuberechnung auf dem Checkout überein', () => {
  const md = tabellen(readFileSync(join(REFERAT, 'nachweisumfang.md'), 'utf8'));
  for (const [name, erwartet] of Object.entries(tabellenwerte(werte))) {
    assert.equal(
      md[name],
      erwartet,
      `Zeile „${name}“ in nachweisumfang.md veraltet; Werte mit nachweisumfang.mjs neu berechnen`,
    );
  }
});

test('Teilsummen der Laborzeit ergeben die gewertete Laborzeit', () => {
  const { gewertetSek, je } = werte.laborzeit;
  assert.ok(Math.abs(je['1A'] + je['1B'] + je['1B 3–4'] + je['1C'] - gewertetSek) < 1e-6);
  // 1B 3–4: 18 gewertete Läufe (Summary 5, Label 9 mit Teilläufen, Breaker 2, S1 2), keine dev-Läufe
  assert.equal(werte.laborzeit.reihen1B3u4.laeufe, 18);
  assert.equal(werte.laborzeit.laeufe1A, werte.laborzeit.vollstaendig1A);
});

test('Kopfzahlen deutsch formatiert', () => {
  const k = kopfzahlen(werte);
  assert.match(k.laborzeitStunden, /^\d+,\d h$/);
  assert.match(k.laborzeit, /^\d+ h \d+ min$/);
  assert.equal(werte.adrs.gesamt, werte.adrs['1B'] + werte.adrs['1C']);
  assert.ok(werte.tests.gesamt >= werte.tests.ohneAbgabe);
});

test('dauer rundet auf Minuten und lässt 0 h weg', () => {
  assert.equal(dauer(3297), '55 min');
  assert.equal(dauer(27715.6), '7 h 42 min');
  assert.equal(dauer(3599.9), '1 h 0 min');
});

test('1B 3–4: liegen .json und .json.gz nebeneinander, zählt der Lauf einmal (.json hat Vorrang)', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { dateien1B3u4 } = await import('./nachweisumfang.mjs');
  const wurzel = mkdtempSync(join(tmpdir(), 'nachweis-1b-'));
  try {
    const dir = join(wurzel, 'evidenz/1B/messung');
    mkdirSync(dir, { recursive: true });
    for (const n of [
      '2026-11-16-lauf-l3-label.json',
      '2026-11-16-lauf-l3-label.json.gz',
      '2026-11-16-lauf-f1-summary.json.gz',
      '2026-11-16-lauf-dev-f1-summary.json',
      '2026-11-16-lauf-normal-label-02.json.gz',
    ])
      writeFileSync(join(dir, n), '');
    assert.deepEqual(dateien1B3u4(wurzel), [
      '2026-11-16-lauf-f1-summary.json.gz',
      '2026-11-16-lauf-l3-label.json',
      '2026-11-16-lauf-normal-label-02.json.gz',
    ]);
  } finally {
    rmSync(wurzel, { recursive: true, force: true });
  }
});
