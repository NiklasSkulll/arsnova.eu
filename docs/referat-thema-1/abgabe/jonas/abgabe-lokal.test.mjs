// Prüft den lokalen Abgabeschritt: Matrikelnummern nur in ignorierten Dateien, Stempel auf Seite 1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { entwurfsSeiten, gruppenZeile, stempele } from './abgabe-lokal.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { PDFDocument } = require('pdf-lib');
const { PDFParse } = require('pdf-parse');

const GRUPPE = [
  { name: 'Erika Muster', matrikel: '00000001' },
  { name: 'Max Beispiel', matrikel: '00000002' },
];

test('gruppenZeile nennt jede Person mit Matrikelnummer', () => {
  assert.equal(
    gruppenZeile(GRUPPE),
    'Erika Muster (Matrikelnummer 00000001) · Max Beispiel (Matrikelnummer 00000002)',
  );
  assert.throws(() => gruppenZeile([{ name: 'A' }]), /Matrikelnummer/);
});

test('stempele schreibt die Zeile nur auf Seite 1 und lässt die Seitenzahl gleich', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([1600, 900]);
  doc.addPage([1600, 900]);
  const aus = await stempele(await doc.save(), gruppenZeile(GRUPPE));
  const neu = await PDFDocument.load(aus);
  assert.equal(neu.getPageCount(), 2);
  const p = new PDFParse({ data: new Uint8Array(aus) });
  const text = (await p.getText()).text;
  await p.destroy?.();
  assert.equal(text.split('Matrikelnummer 00000001').length - 1, 1);
});

test('entwurfsSeiten findet Entwurfsmarker und Platzhalter', async () => {
  const { StandardFonts } = require('pdf-lib');
  const doc = await PDFDocument.create();
  const f = await doc.embedFont(StandardFonts.Helvetica);
  for (const t of [
    'Fertige Folie',
    'Entwurf, mit Niklas abzustimmen',
    'Gemeinsam: [Satz zur Leitfrage]',
  ]) {
    doc.addPage([1600, 900]).drawText(t, { x: 50, y: 450, size: 30, font: f });
  }
  assert.deepEqual(await entwurfsSeiten(await doc.save()), [2, 3]);
});

test('Eingabedatei und Ausgabeordner sind von Git ignoriert', () => {
  for (const pfad of ['abgabe-lokal.json', 'abgabe-lokal/folien.pdf']) {
    // check-ignore endet mit 0, wenn der Pfad ignoriert ist; sonst wirft execFileSync.
    execFileSync('git', ['check-ignore', '-q', join(HIER, pfad)], { cwd: HIER });
  }
});
