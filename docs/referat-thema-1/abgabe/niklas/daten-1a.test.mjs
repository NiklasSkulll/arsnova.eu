// Prüft, dass der Folienentwurf 1A seine Zahlen genau so aus Niklas' auswertung.json liest wie dessen
// eigener Renderer (scripts/load/render-resource-isolation-pdfs.mjs) und die Befunde dort.
// Aufruf: node --test docs/referat-thema-1/abgabe/niklas/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ladeDaten1A } from './daten-1a.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const d = ladeDaten1A(ROOT);

test('Live-Aktionen: alle geplanten erfolgreich, höchster Quiz-p95 unter dem 1000-ms-Ziel', () => {
  assert.equal(d.live.geplant, 40_000);
  assert.equal(d.live.erfolgreich, 40_000);
  assert.ok(d.live.quizMaxMs > 167 && d.live.quizMaxMs < 168);
});

test('Vergleiche: 80 insgesamt, H1 1/20, H2 6/40, Kontrolle V1 gegen V0 4/20, absolut 3', () => {
  assert.equal(d.vergleiche.length, 80);
  const fehl = (v) => d.vergleiche.filter((x) => x.variante === v && !x.bestanden).length;
  assert.equal(fehl('V1'), 4);
  assert.equal(fehl('V2'), 1);
  assert.equal(fehl('V3') + fehl('V4'), 6);
  assert.equal(d.h1.fehl, 1);
  assert.equal(d.h2.fehl, 6);
  assert.deepEqual(
    d.vergleiche
      .filter((x) => !x.absolutBestanden)
      .map((x) => `${x.variante}/${x.block}/${x.aktion}`),
    ['V3/5/join', 'V3/5/vote', 'V3/5/qaSubmit'],
  );
});

test('kleine Verletzungen außerhalb von V3 Block 5 bleiben unter 16 ms', () => {
  const klein = d.vergleiche.filter((x) => !x.bestanden && !(x.variante === 'V3' && x.block === 5));
  assert.equal(klein.length, 7);
  assert.ok(Math.max(...klein.map((x) => x.deltaMs)) < 16);
  assert.ok(d.v3Block5MaxDeltaMs > 214 && d.v3Block5MaxDeltaMs < 215);
});

test('Ressourcen und Analyse wie in Niklas’ Renderer', () => {
  assert.equal(d.v3.erfolg, 741);
  assert.equal(d.v3.ersatz, 6);
  assert.equal(d.v3.offen, 3);
  assert.equal(d.v4.weitergeleitet, 0);
  assert.equal(d.v4.ersatz, 745);
  assert.equal(d.v2.erfolg, 750);
  assert.ok(d.v2.ramMiB[1] < 0.8 * 1024);
  assert.ok(d.v2.drosselProzent[1] < 5);
  assert.ok(d.v3.drosselProzent[0] > 85);
  assert.equal(d.drosselung.V2.length, 5);
  assert.equal(d.speicher.V2.length, 5);
});

test('Herkunft: Baseline-Commit und Hash der Auswertung', () => {
  assert.equal(d.herkunft.commit, 'a19ca70f');
  assert.match(d.herkunft.auswertungSha, /^[0-9a-f]{16}$/);
  assert.equal(d.herkunft.cpus, 16);
});
