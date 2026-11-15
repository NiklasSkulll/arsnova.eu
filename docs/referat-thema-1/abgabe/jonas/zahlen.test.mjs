import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fmt, ladeZahlen, ZAHLEN_1C, zahlen1B } from './zahlen.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('1B-Zahlen aus den committeten Ergebnis-JSONs', () => {
  const { b1, quellen } = ladeZahlen(ROOT);
  assert.equal(fmt(b1.netzMs, 2), '0,43');
  assert.equal(fmt(b1.netzMaxMs, 2), '1,36');
  assert.equal(fmt(b1.transportMs, 1), '17,8');
  assert.equal(Math.round(b1.adapterMs), 101);
  assert.equal(fmt(b1.inferAnteil * 100, 2), '99,92');
  assert.equal(fmt(b1.jobWarmMs / 1000, 1), '148,6');
  assert.equal(fmt(b1.jobKaltMs / 1000, 1), '213,7');
  assert.equal(fmt(b1.kaltMedianS, 1), '200,5');
  assert.deepEqual(
    b1.kaltSpanneS.map((s) => fmt(s, 1)),
    ['187,1', '210,1'],
  );
  assert.equal(fmt(b1.c0DiffMs, 1), '−2,0');
  assert.equal(fmt(b1.b0JobMs, 1), '88,5');
  assert.equal(b1.anzahl, 10);
  assert.ok(b1.commit.startsWith('8e9d1317'));
  assert.match(b1.rechner, /i7-6820HQ/);
  assert.match(quellen.lauf, /^[0-9a-f]{64}$/);
});

test('Herkunft je Wertegruppe: Hauptlauf 8e9d1317, Nachtrag 9e111d35', () => {
  const { b1 } = ladeZahlen(ROOT);
  assert.ok(b1.herkunft.hauptlauf.commit.startsWith('8e9d1317'));
  assert.equal(b1.herkunft.hauptlauf.anzahl, 10);
  assert.match(b1.herkunft.hauptlauf.rechner, /i7-6820HQ/);
  assert.ok(b1.herkunft.nachtrag.commit.startsWith('9e111d35'));
  assert.match(b1.herkunft.nachtrag.rechner, /i7-6820HQ/);
  assert.equal(b1.commit, b1.herkunft.hauptlauf.commit);
});

test('inferAnteil ist der Median ueber alle 10, nicht der warme', () => {
  const lauf = JSON.parse(
    readFileSync(resolve(ROOT, 'evidenz/1B/messung/2026-11-13-lauf.json'), 'utf8'),
  );
  const k = lauf.zerlegung.kennzahlen;
  const { b1 } = ladeZahlen(ROOT);
  assert.equal(b1.inferAnteil, k.inferAnteilMedian);
  assert.notEqual(b1.inferAnteil, k.warm.inferAnteilMedian);
  assert.equal(fmt(b1.inferAnteil * 100, 4), '99,9190');
  assert.equal(fmt(k.warm.inferAnteilMedian * 100, 4), '99,9178');
});

test('zahlen1B ist eine reine Funktion der Eingaben', () => {
  assert.throws(() => zahlen1B(null, [], null, null));
});

test('fmt: de-DE, Komma, Minuszeichen U+2212', () => {
  assert.equal(fmt(1.25, 1), '1,3');
  assert.equal(fmt(-2.03, 1), '−2,0');
});

test('jede 1C-Zahl hat Felder und ihren Beleg wörtlich in der Quelle', () => {
  const keys = Object.keys(ZAHLEN_1C);
  assert.ok(keys.length >= 12);
  for (const k of keys) {
    const z = ZAHLEN_1C[k];
    for (const f of ['wert', 'text', 'quelle', 'beleg', 'rechner', 'commit']) {
      assert.ok(z[f] !== undefined && z[f] !== '', `${k}.${f}`);
    }
    assert.match(z.rechner, /^(Laptop|PC)/, k);
    const pfad = resolve(ROOT, z.quelle);
    assert.ok(existsSync(pfad), `${k}: ${z.quelle} fehlt`);
    assert.ok(
      readFileSync(pfad, 'utf8').includes(z.beleg),
      `${k}: Beleg nicht wörtlich in ${z.quelle}`,
    );
  }
});

test('Gruppengrößen und verworfene Antworten für Beschriftungen', () => {
  const { b1 } = ladeZahlen(ROOT);
  assert.equal(b1.nWarm, 9);
  assert.equal(b1.nKaltLaeufe, 5);
  assert.equal(b1.verworfen, 10);
  assert.equal(b1.nB0, 10);
});
