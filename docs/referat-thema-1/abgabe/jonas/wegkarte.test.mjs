// Prüft die Wegkarten oben links (wegkarte.mjs): ein Satz Maße für beide Wege, Jonas' Marker und die
// festen Wegmarken aus derselben Zeichenfunktion, Beschriftung mit Etikett, keine Systembild-Miniatur mehr.
// Aufruf: node --test docs/referat-thema-1/abgabe/jonas/wegkarte.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as grafik from './grafik.mjs';
import {
  KARTE,
  MARKEN,
  STOERUNG_ZEICHEN,
  WEG_1A,
  WEG_AUFTRAG,
  karteSvg,
  markeText,
  wegMarke,
  wegMini,
} from './wegkarte.mjs';

const kreise = (svg) => [...svg.matchAll(/<circle data-station="([a-z]+)"[^>]*r="([\d.]+)"/g)];

test('beide Wege: gleiche Maße, Linienstärke und Stationsradien, Höhe wie Jonas’ Karte', () => {
  for (const weg of [WEG_AUFTRAG, WEG_1A]) {
    const svg = karteSvg(weg);
    assert.match(svg, new RegExp(`width="${KARTE.breite}" height="${KARTE.hoehe}"`), weg.id);
    for (const [, w] of svg.matchAll(/stroke-width="([\d.]+)"/g))
      assert.equal(Number(w), KARTE.linie, weg.id);
    for (const [, name, r] of kreise(svg))
      assert.equal(
        Number(r),
        weg.stationen[name].kern ? KARTE.kern : KARTE.ring,
        `${weg.id} ${name}`,
      );
    // Stationen nur auf den beiden Ebenen, innerhalb der Karte
    for (const [name, s] of Object.entries(weg.stationen)) {
      assert.ok(s.x >= KARTE.ring && s.x <= KARTE.breite - KARTE.ring, `${weg.id} ${name} x`);
      assert.ok(s.y >= KARTE.oben - 0.01 && s.y <= KARTE.unten + 0.01, `${weg.id} ${name} y`);
    }
  }
  // genau eine gefüllte Hauptstation je Weg
  assert.deepEqual(
    [WEG_AUFTRAG, WEG_1A].map((w) => Object.keys(w.stationen).filter((n) => w.stationen[n].kern)),
    [['inferenz'], ['spacy']],
  );
});

test('Auftragsweg: Stationen von Klick bis Gate, oben app-host, Netz und Inferenz in der Senke', () => {
  const S = WEG_AUFTRAG.stationen;
  assert.deepEqual(Object.keys(S), [
    'klick',
    'kontext',
    'netz',
    'inferenz',
    'nachpruefung',
    'gate',
  ]);
  for (const n of ['klick', 'kontext', 'nachpruefung', 'gate']) assert.equal(S[n].y, KARTE.oben, n);
  assert.equal(S.inferenz.y, KARTE.unten);
  assert.ok(S.netz.y > KARTE.oben && S.netz.y < KARTE.unten);
  const anteile = Object.values(S).map((s) => s.anteil);
  assert.deepEqual(
    [...anteile].sort((a, b) => a - b),
    anteile,
    'Anteile steigen entlang des Wegs',
  );
  // die gestörte Strecke liegt zwischen Kontext und Nachprüfung
  const xs = [...WEG_AUFTRAG.abschnitte.zweiterHost.matchAll(/[\d.]+/g)]
    .map(Number)
    .filter((_, i) => i % 2 === 0);
  assert.ok(Math.min(...xs) > S.kontext.x && Math.max(...xs) < S.nachpruefung.x);
});

test('Weg 1A: Live-Pfad oben, Zweig mit Ersatz unten, Abzweig an der App', () => {
  const S = WEG_1A.stationen;
  for (const n of ['teilnehmende', 'app', 'datenbank', 'antwort'])
    assert.equal(S[n].y, KARTE.oben, n);
  for (const n of ['analyse', 'spacy', 'ersatz', 'wortwolke']) assert.equal(S[n].y, KARTE.unten, n);
  assert.ok(WEG_1A.abschnitte.zweig.startsWith(`M${S.app.x} ${KARTE.oben}`));
  const x = (n) => S[n].x;
  assert.ok(
    x('teilnehmende') < x('app') && x('app') < x('datenbank') && x('datenbank') < x('antwort'),
  );
  assert.ok(
    x('app') < x('analyse') &&
      x('analyse') < x('spacy') &&
      x('spacy') < x('ersatz') &&
      x('ersatz') < x('wortwolke'),
  );
});

test('Jonas’ Marker und die Wegmarken von 1B 3–4 zeichnen dieselbe Karte', () => {
  const basis = wegMini({ aktiv: 'inferenz' }).match(
    /<svg class="weg-mini-karte"[\s\S]*?<\/svg>/,
  )[0];
  const ohneHervorhebung = (h) =>
    h
      .match(/<svg class="weg-mini-karte"[\s\S]*?<\/svg>/)[0]
      .replace(/<g data-abschnitt[\s\S]*?<\/g>/g, '');
  for (const m of ['1b-stoerung', '1b-alle', 'auftrag'])
    assert.equal(ohneHervorhebung(wegMarke(m)), basis, m);
  const m1 = wegMarke('1b-stoerung');
  assert.match(m1, /<g data-abschnitt="zweiterHost"><path [^>]*stroke="var\(--bernstein\)"/);
  // J1: ganzer Weg ohne Hervorhebung und ohne Marker
  assert.doesNotMatch(wegMarke('auftrag'), /data-abschnitt|weg-punkt/);
});

test('Wegmarken: Hervorhebung nur am Ort der Folie, Beschriftung mit Etikett', () => {
  for (const [name, m] of Object.entries(MARKEN)) {
    const h = wegMarke(name);
    assert.match(h, /<p class="weg-beschriftung" aria-hidden="true">/, name);
    for (const t of m.teil)
      assert.match(h, new RegExp(`class="etikett etikett-${t.toLowerCase()}">${t}<`), name);
    assert.match(
      h,
      new RegExp(`aria-label="Ort auf dem Weg: ${markeText(name).replace(/[()]/g, '\\$&')}`),
      name,
    );
    assert.equal((h.match(/class="weg-punkt"/g) ?? []).length, m.station ? 1 : 0, name);
    assert.equal((h.match(/<g data-abschnitt=/g) ?? []).length, m.abschnitte?.length ?? 0, name);
    assert.equal((h.match(/data-wirkung/g) ?? []).length, m.wirkung ? 1 : 0, name);
    if (m.weg === '1a') {
      // 1A: Hervorhebung in Blau, alles andere neutral
      assert.doesNotMatch(h, /bernstein|petrol|--rot/, name);
    }
  }
  // Marker sitzt genau auf der Station
  const s = WEG_1A.stationen.ersatz;
  assert.match(wegMarke('1a-ersatz'), new RegExp(`left:${s.x}px;top:${s.y}px`));
  assert.throws(() => wegMarke('x'));
});

test('M1: Störungszeichen je Stufe auf der Karte, Beschriftung nur der Ort; M2 alle vier Zeichen', () => {
  const m1 = wegMarke('1b-stoerung');
  const stufen = [...m1.matchAll(/<span class="weg-stufe" data-ab="(\d)"/g)].map((m) =>
    Number(m[1]),
  );
  assert.deepEqual(stufen, [0, 1, 2, 3]);
  // Zeichen stehen auf der Karte (weg-zeichen-ort), die Beschriftung nennt nur den Ort; ihre Bedeutung
  // steht im aria-label
  for (const [z, { text }] of Object.entries(STOERUNG_ZEICHEN)) {
    assert.match(m1, new RegExp(`data-zeichen="${z}"`), z);
    assert.ok(
      MARKEN['1b-stoerung'].stufen.some((st) => st.zeichen.includes(z)),
      z,
    );
    assert.match(m1.match(/aria-label="([^"]*)"/)[1], new RegExp(text), z);
  }
  const ort = m1.match(/<span class="weg-zeichen-ort"[\s\S]*?<p class="weg-beschriftung"/)[0];
  assert.equal((ort.match(/data-zeichen=/g) ?? []).length, 4);
  assert.match(
    m1,
    /<p class="weg-beschriftung" aria-hidden="true"><span class="weg-name">Zweiter Host<\/span><span class="etikett etikett-1b">1B<\/span><\/p>/,
  );
  // nur die letzte Stufe bleibt offen (Druck zeigt das Endbild)
  assert.equal((m1.match(/data-bis=/g) ?? []).length, 3);
  const m2 = wegMarke('1b-alle');
  assert.equal((m2.match(/data-zeichen=/g) ?? []).length, 4);
  assert.match(m2, /<span class="weg-name">Zweiter Host<\/span>/);
  assert.match(
    m2,
    /aria-label="Ort auf dem Weg: Zweiter Host \(1B\); Störungen: Stopp, Slot belegt, DROP, zu spät"/,
  );
});

test('keine Systembild-Miniatur mehr', () => {
  for (const alt of ['systemMini', 'SYSTEM_ORTE', 'MINI_HOEHE'])
    assert.equal(grafik[alt], undefined, alt);
});
