// Prüft das Literaturverzeichnis der Folien (literatur.mjs) gegen den Zitierleitfaden (ZL) und gegen das
// Handout in PaperLab: dieselben Einträge, dieselben Jahresbuchstaben.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

import { LITERATUR, kurzbeleg } from './literatur.mjs';

const BIB = `${process.env.HOME}/Documents/Code/PaperLab/scientific-papers/presentation/presentation-semester-7-cloud-computing-1b-1c_jonas/main.bib`;

test('kurzbeleg: Autor, Jahr und Stelle in Klammern (ZL S. 3)', () => {
  assert.equal(kurzbeleg('kwon2023', 'Kap. 3'), '(Kwon et al., 2023, Kap. 3)');
  assert.equal(kurzbeleg('dean2013', 'S. 74'), '(Dean & Barroso, 2013, S. 74)');
  assert.equal(kurzbeleg('weirauch2026c', 'ADR 1C-024'), '(Weirauch, 2026, ADR 1C-024)');
  assert.throws(() => kurzbeleg('fehlt2020'), /fehlt2020/);
});

test('Einträge nach ZL: kein „o. J.“, kein Abrufdatum, DOI mit https, alphabetisch', () => {
  const voll = LITERATUR.map((e) => e.voll);
  for (const v of voll) {
    assert.doesNotMatch(v, /o\. J\.|abgerufen|Zugriff am/);
    assert.doesNotMatch(v, /[^/]doi\.org/);
  }
  const sortiert = [...voll].sort((a, b) => a.localeCompare(b, 'de'));
  assert.deepEqual(voll, sortiert);
});

test(
  'dieselben Schlüssel wie im Handout (PaperLab main.bib), gleiche Jahresbuchstaben',
  { skip: !existsSync(BIB) },
  () => {
    const bib = readFileSync(BIB, 'utf8');
    for (const e of LITERATUR)
      assert.match(bib, new RegExp(`@\\w+\\{${e.schluessel},`), e.schluessel);
    // Eigene Arbeit: ein Eintrag ohne Jahresbuchstaben, Fundstelle im Kurzbeleg (wie im Handout).
    assert.equal(kurzbeleg('weirauch2026c'), '(Weirauch, 2026)');
    assert.ok(
      !/weirauch2026[abd]\b/.test(bib.replace(/^%.*$/gm, '')),
      'Handout hat nur weirauch2026c',
    );
    assert.ok(!LITERATUR.some((e) => /^weirauch2026[abd]$/.test(e.schluessel)));
    assert.equal(kurzbeleg('arsnova2026pruefung'), '(arsnova.eu-Projektteam, 2026b)');
    // Projektdokumente als Permalink auf denselben Stand wie im Handout
    for (const k of ['arsnova2026adr0035', 'arsnova2026pruefung']) {
      const url = LITERATUR.find((e) => e.schluessel === k).voll.match(/https:\S+/)[0];
      assert.ok(bib.includes(url), `${k}: URL wie im Handout`);
    }
  },
);
