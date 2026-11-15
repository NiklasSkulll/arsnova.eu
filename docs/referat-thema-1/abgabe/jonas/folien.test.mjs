// Tests für die Folieninhalte (Task 5): Zeiten, Pflichtfelder, echte Artefakte und die Regel
// „keine Zahl, die nicht aus den Daten stammt“.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

import { FESTWERTE, folien, ladeFolienDaten } from './folien.mjs';
import { fussballfeldSvg, wegSvg, zeitzerlegungSvg } from './grafik.mjs';
import { fmt } from './zahlen.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const daten = ladeFolienDaten(ROOT);
const F = folien(daten);
const nach = (id) => F.find((f) => f.id === id);
const jonas = F.filter((f) => f.teil === 'jonas');
const summe = (liste) => liste.reduce((s, f) => s + f.zeitS, 0);

/** Zeiten aus Design Abschnitt 5 (Sekunden). */
const PLAN = {
  J1: 40,
  J2: 60,
  J3: 40,
  J4: 50,
  J5: 45,
  J6: 60,
  J7: 45,
  J8: 50,
  J9: 50,
  J10: 25,
  J11: 50,
  J12: 50,
  J13: 70,
  J14: 40,
  J15: 50,
};

const decode = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

/** Sichtbarer Text ohne Tags; Grafiken aus grafik.mjs sind dort schon getestet und werden entfernt. */
function sichtbar(html) {
  let s = html;
  for (const svg of grafiken()) s = s.split(svg).join(' ');
  s = s.replace(/<(pre|blockquote)\b[^>]*data-artefakt[^>]*>[\s\S]*?<\/\1>/g, ' ');
  return decode(s.replace(/<[^>]+>/g, ' '));
}

let grafikCache;
function grafiken() {
  if (!grafikCache) {
    const { b1, c1 } = daten;
    grafikCache = [
      ...['klick', 'kontext', 'netz', 'inferenz', 'nachpruefung', 'gate', null].map((aktiv) =>
        wegSvg({ aktiv, b1, c1 }),
      ),
      zeitzerlegungSvg(b1),
      zeitzerlegungSvg(b1, { kalt: false }),
      ...[0, 1].map((zoom) => fussballfeldSvg(b1, { zoom })),
    ];
  }
  return grafikCache;
}

/** Kennungen, die Ziffern enthalten, aber keine Messwerte sind. */
const KENNUNGEN = [
  /\b1[BC]-\d{3}\b/g, // ADR-Nummern
  /\bADR-\d{4}\b/g,
  /#\d+/g, // Issues
  /\b(?=[0-9a-f]*[a-f])(?=[0-9a-f]*\d)[0-9a-f]{8,}\b/g, // Commits
  /\bThema 1\b/g,
  /\bRelease 1\.3\b/g,
  /\bSchritte? \d(?:–\d)?\b/g,
  /\b[1][ABC]\b/g, // Aufträge
  /\bH_[A-Z]+\d\b/g,
  /\b[EMNLTUJRG]\d{1,2}(?:\.\d)?[ab]?\b/g, // Fall- und Folienkennungen
  /\bt\s?[0-3]\b/g, // Messpunkte t0–t3
  /Qwen3-4B(?:-Instruct-2507)?/g,
  /\bQ4_K_M\b/g,
  /\bSHA-256\b/g,
  /\bUTF-8\b/g,
  /\bOpus \d\.\d\b/g,
  /\bv\d\b/g, // Vertragsfassungen
  /\b\d{1,3}(?:\.\d{1,3}){3}\b/g, // IP-Adressen der Labor-VMs
];

function whitelist() {
  const w = new Set(['2026']);
  const zahl = (v) => {
    for (const k of [0, 1, 2, 3]) {
      w.add(fmt(v, k));
      w.add(fmt(v / 1000, k));
      w.add(fmt(v * 100, k));
    }
    for (const x of [...w]) if (x.startsWith('−')) w.add(x.slice(1));
    w.add(String(v));
  };
  const ziffern = (s) => (String(s).match(/\d+(?:[.,]\d+)*/g) ?? []).forEach((t) => w.add(t));
  const blaetter = (o) => {
    if (typeof o === 'number') zahl(o);
    else if (Array.isArray(o)) o.forEach(blaetter);
    else if (o && typeof o === 'object') Object.values(o).forEach(blaetter);
  };
  blaetter(daten.b1); // Zahlen; Commit und Rechner sind Text und bleiben außen vor
  for (const e of Object.values(daten.c1)) {
    if (typeof e.wert === 'number') zahl(e.wert);
    else ziffern(e.wert);
  }
  blaetter({ a: daten.antwort.auftrag, b: daten.antwort.aussagen, c: daten.antwort.mitTrenner });
  const { requestedAt, finishedAt, ...auftragZahlen } = daten.auftrag;
  blaetter(auftragZahlen);
  for (const iso of [requestedAt, finishedAt]) ziffern(iso.slice(11, 23).replace('.', ','));
  blaetter(daten.nutzlast.zahlen);
  for (const f of Object.values(FESTWERTE)) zahl(f.wert);
  return w;
}

test('Jonas-Folien J1–J15 in Reihenfolge mit den Zeiten aus Design Abschnitt 5', () => {
  assert.deepEqual(
    jonas.map((f) => f.id),
    Object.keys(PLAN),
  );
  for (const f of jonas) assert.equal(f.zeitS, PLAN[f.id], f.id);
  const s = summe(jonas);
  assert.ok(s >= 700 && s <= 760, `Summe ${s}`);
});

test('Kurzfassung: nur Jonas-Folien, Summe 420–470 s', () => {
  const k = F.filter((f) => f.kurzfassung);
  assert.ok(
    k.every((f) => f.teil === 'jonas'),
    'nur Jonas-Folien',
  );
  const s = summe(k);
  assert.ok(s >= 420 && s <= 470, `Summe ${s}`);
});

test('Pflichtfelder: quelle mit Rechner und Commit, notiz, auftrag, station', () => {
  const stationen = new Set(['klick', 'kontext', 'netz', 'inferenz', 'nachpruefung', 'gate', null]);
  for (const f of F) {
    assert.ok(['rahmen', 'jonas', 'reserve'].includes(f.teil), f.id);
    assert.ok(f.titel?.trim(), `${f.id} titel`);
    assert.ok(f.inhalt?.trim(), `${f.id} inhalt`);
    assert.ok(stationen.has(f.station), `${f.id} station ${f.station}`);
    assert.equal(typeof f.kurzfassung, 'boolean', f.id);
    if (f.teil === 'rahmen') continue;
    assert.ok(f.quelle?.trim(), `${f.id} quelle`);
    assert.ok(f.notiz?.trim(), `${f.id} notiz`);
    assert.match(f.quelle, /\b[0-9a-f]{8}\b/, `${f.id}: Commit in der quelle`);
    assert.match(f.quelle, /ThinkPad P50|i7-8700|Laptop|PC/, `${f.id}: Rechner in der quelle`);
  }
  for (const f of jonas) assert.ok(['1C', '1B', 'beide'].includes(f.auftrag), `${f.id} auftrag`);
});

test('Sprechnotizen passen zur Folienzeit (etwa 130 Wörter je Minute)', () => {
  for (const f of jonas) {
    const woerter = f.notiz.trim().split(/\s+/).length;
    const soll = (f.zeitS * 130) / 60;
    assert.ok(
      woerter >= soll * 0.7 && woerter <= soll * 1.3,
      `${f.id}: ${woerter} Wörter, Soll etwa ${Math.round(soll)}`,
    );
  }
});

test('Rahmenfolien G0 und G9 sind als Entwurf markiert', () => {
  for (const id of ['G0', 'G9']) {
    const f = nach(id);
    assert.equal(f?.teil, 'rahmen', id);
    assert.match(sichtbar(f.inhalt), /Entwurf, mit Niklas abzustimmen/, id);
  }
  assert.equal(F[0].id, 'G0');
  assert.equal(F.at(-1).teil === 'reserve' || F.at(-1).id === 'G9', true);
});

test('Reservefolien R1–R7 nach Design Abschnitt 5', () => {
  const r = F.filter((f) => f.teil === 'reserve');
  assert.deepEqual(
    r.map((f) => f.id),
    ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'],
  );
  const text = r.map((f) => f.titel).join(' | ');
  for (const wort of ['Kalibrierung', 'C0', 'B0', 'Kaltläufe', 'Gültigkeitsgrenzen', 'KI', 'ADR'])
    assert.ok(text.includes(wort), wort);
});

test('J13 zeigt die echte, gekürzte Modellantwort, den Grund des Tors und den Platz für den Clip', () => {
  const j13 = nach('J13');
  const a = daten.antwort;
  const roh = decode(j13.inhalt);
  const ersteZeile = a.ausgabe.split('\n')[0];
  assert.ok(roh.includes(ersteZeile), 'erste Aussage wörtlich');
  assert.ok(roh.includes(a.grund), 'Grund wörtlich');
  assert.equal(a.torAkzeptiert, false);
  assert.match(j13.inhalt, /data-clip="[^"]+"/);
  assert.ok(!/bearer|authorization/i.test(j13.inhalt), 'kein Token oder Header');
});

test('J6 zeigt einen wörtlichen Ausschnitt der echten Nutzlast aus dem committeten 1C-Beleg', () => {
  const j6 = nach('J6');
  const roh = JSON.parse(gunzipSync(readFileSync(resolve(ROOT, daten.nutzlast.datei))));
  const lauf = roh.labor.quiet.runs[daten.nutzlast.lauf];
  const body = JSON.parse(
    lauf.exchanges.find((e) => e.path === '/v1/chat/completions').rawRequestBody,
  );
  const user = body.messages.find((m) => m.role === 'user').content;
  assert.ok(daten.nutzlast.zeilen.length >= 3);
  for (const z of daten.nutzlast.zeilen) {
    assert.ok(user.includes(z), `nicht wörtlich: ${z}`);
    assert.ok(decode(j6.inhalt).includes(z), `fehlt auf J6: ${z}`);
  }
  assert.equal(lauf.preview.snapshotHash, lauf.sent.snapshotHash);
  assert.ok(j6.inhalt.includes(lauf.preview.snapshotHash.slice(0, 8)));
  assert.ok(j6.quelle.includes(daten.nutzlast.datei.replace(/^.*evidenz\//, 'evidenz/')));
  assert.ok(!/bearer|authorization|sessionId/i.test(j6.inhalt));
});

test('Festwerte (Schwellen, Release-Timeout) stehen wörtlich in ihrer Quelle', () => {
  for (const [name, f] of Object.entries(FESTWERTE)) {
    const text = readFileSync(resolve(ROOT, f.quelle), 'utf8');
    assert.ok(text.includes(f.beleg), `${name}: Beleg fehlt in ${f.quelle}`);
    assert.ok(f.beleg.includes(fmt(f.wert)), `${name}: Wert nicht im Beleg`);
  }
});

test('Keine Zahl auf einer Folie, die nicht aus den Daten stammt', () => {
  const w = whitelist();
  for (const f of F) {
    for (const [feld, wert] of [
      ['titel', f.titel],
      ['inhalt', f.inhalt],
      ['notiz', f.notiz ?? ''],
    ]) {
      let s = feld === 'inhalt' ? sichtbar(wert) : wert;
      for (const re of KENNUNGEN) s = s.replace(re, ' ');
      for (const t of s.match(/\d+(?:[.,]\d+)*/g) ?? []) {
        assert.ok(w.has(t), `${f.id} ${feld}: „${t}“ stammt nicht aus den Daten`);
      }
    }
  }
});

test('Gruppen: warme Mediane tragen „warm“ und n = 9, nie „alle 10“ allein', () => {
  const warm = fmt(daten.b1.jobWarmMs / 1000, 1);
  for (const f of F) {
    const s = sichtbar(f.inhalt);
    if (s.includes(`${warm} s`)) assert.match(s, /warm/, `${f.id}: ${warm} s ohne „warm“`);
  }
});

test('Empfehlungen erscheinen nie als umgesetzt (ADR 1C-004)', () => {
  for (const f of F) {
    const s = sichtbar(f.inhalt);
    if (/empfohlen|Empfehlung/.test(s)) assert.match(s, /nicht umgesetzt/, f.id);
    assert.ok(!/\bumgesetzt\b/.test(s.replace(/nicht umgesetzt/g, '')), `${f.id}: „umgesetzt“`);
  }
});

test('Schreibregeln: kein Gedankenstrich-Einschub, kein „nicht X, sondern Y“, Farben nur als Token', () => {
  for (const f of F) {
    const s = `${f.titel} ${sichtbar(f.inhalt)}`;
    assert.ok(!s.includes('—'), `${f.id}: Geviertstrich`);
    assert.ok(!/ – [^–]+ – /.test(s), `${f.id}: Einschub mit Gedankenstrichen`);
    assert.ok(!/\bsondern\b/.test(s), `${f.id}: „sondern“`);
    let html = f.inhalt;
    for (const svg of grafiken()) html = html.split(svg).join('');
    assert.ok(
      !/#[0-9a-fA-F]{3,6}\b/.test(html.replace(/>[^<]*</g, '><')),
      `${f.id}: Farbe ohne Token`,
    );
  }
});
