// Tests für die Folieninhalte (Task 5): Zeiten, Pflichtfelder, echte Artefakte und die Regel
// „keine Zahl, die nicht aus den Daten stammt“.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

import { FESTWERTE, TEILE, folien, ladeFolienDaten, teilVon } from './folien.mjs';
import { fussballfeldSvg, wegSvg, zeitzerlegungSvg } from './grafik.mjs';
import { fmt } from './zahlen.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const daten = ladeFolienDaten(ROOT);
const F = folien(daten);
const nach = (id) => F.find((f) => f.id === id);
const jonas = F.filter((f) => f.teil === 'jonas');
const summe = (liste) => liste.reduce((s, f) => s + f.zeitS, 0);

/**
 * Zeiten nach dem zweiten Audit 2026-11-16: G0 bis J16 höchstens 9:00 min (Kursvorschlag 9 + 6, Sprungplan =
 * Plan); J2, J4–J9 und J13 gekürzt. Davor: G0 bis J16 etwa 10:30 min. J11 (Betrieb) ist Reserve R13, J16 steht als
 * Anhang nach G9; J2, J4, J8 und J15 gekürzt. Früher: J14 in die Reserve (R11, fachliche Prüfung 2).
 */
const PLAN = {
  J1: 40,
  J2: 30,
  J3: 40,
  J4: 30,
  J5: 35,
  J6: 50,
  J7: 30,
  J8: 30,
  J9: 40,
  J10: 25,
  J12: 50,
  J13: 60,
  J15: 40,
  J16: 5,
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
    const { b1, c1, auftrag } = daten;
    grafikCache = [
      ...['klick', 'kontext', 'netz', 'inferenz', 'nachpruefung', 'gate', null].map((aktiv) =>
        wegSvg({ aktiv, b1, c1, auftrag }),
      ),
      zeitzerlegungSvg(b1),
      zeitzerlegungSvg(b1, { kalt: false }),
      zeitzerlegungSvg(b1, { stufen: true }),
      ...[0, 1].map((zoom) => fussballfeldSvg(b1, { zoom })),
    ];
  }
  return grafikCache;
}

/** Kennungen, die Ziffern enthalten, aber keine Messwerte sind. */
const KENNUNGEN = [
  /\bv1\.[34]\.0-\d+\b/g, // git describe
  /\b1[BC]-\d{3}\b/g, // ADR-Nummern
  /\bADR-\d{4}\b/g,
  /#\d+/g, // Issues
  /\b(?=[0-9a-f]*[a-f])(?=[0-9a-f]*\d)[0-9a-f]{8,}\b/g, // Commits
  /\bThema 1\b/g,
  /\b(?:Release |Version |v)?1\.[34](?:\.0)?\b/g, // Release- und Versionsnummern
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
  /§\s?\d+/g, // Abschnitte des Runbooks
  /#456\b/g,
  /\bZ\.(?: |&nbsp;)\d+(?:, \d+)*/g, // Zeilennummern im Code (R14)
  /\bet al\. \(\d{4}\)/g, // Jahr eines Kurzbelegs im Text
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
  blaetter(daten.abgeleitet);
  for (const f of daten.nachbau.fragen) ziffern(f);
  for (const f of Object.values(FESTWERTE)) zahl(f.wert);
  return w;
}

test('Jonas-Folien in Reihenfolge mit den geplanten Zeiten, mit Rahmen höchstens 9:00 min', () => {
  assert.deepEqual(
    jonas.map((f) => f.id),
    Object.keys(PLAN),
  );
  for (const f of jonas) assert.equal(f.zeitS, PLAN[f.id], f.id);
  const s = summe(jonas);
  assert.ok(s >= 480 && s <= 520, `Summe ${s}`);
  // G0 eröffnet Jonas; G9 (gemeinsames Fazit) spricht Niklas und zählt zu seiner Zeit.
  const rahmen = summe(F.filter((f) => f.teil === 'rahmen' && f.sprecher !== 'niklas'));
  assert.ok(s + rahmen >= 520 && s + rahmen <= 540, `mit G0 ${s + rahmen} s`);
  assert.equal(F.find((f) => f.id === 'G9').sprecher, 'niklas');
});

test('Stichpunkte: jede Jonas-Folie (außer J16) und Reserve 3–6, [Weiter] je Aufbaustufe', () => {
  for (const f of F.filter((x) => x.sprecher !== 'niklas' && x.id !== 'J16')) {
    assert.ok(f.stichpunkte?.length >= 3 && f.stichpunkte.length <= 6, `${f.id}: Stichpunkte`);
    for (const p of f.stichpunkte) assert.ok(p.length <= 130, `${f.id}: Stichpunkt zu lang: ${p}`);
    const stufen = f.aufbau ?? 0;
    assert.equal((f.notiz.match(/\[Weiter\]/g) ?? []).length, stufen, `${f.id}: [Weiter] in notiz`);
    assert.equal(
      f.stichpunkte.filter((p) => p.startsWith('[Weiter]')).length,
      stufen,
      `${f.id}: [Weiter] in Stichpunkten`,
    );
  }
  // Erster und letzter Satz wörtlich (Leitfaden F27)
  const erster = F.find((f) => f.id === 'G0');
  assert.ok(erster.notiz.startsWith(erster.stichpunkte[0].replace(/^„|“$/g, '')));
  const letzter = F.find((f) => f.id === 'J15');
  assert.ok(
    letzter.notiz.trim().endsWith(letzter.stichpunkte.at(-1).replace(/^\[Weiter\] „|“$/g, '')),
  );
});

test('Aufbau: nur J9 und J15 bei Jonas, je Stufe ein data-ab', () => {
  const mit = F.filter((f) => f.aufbau && f.sprecher !== 'niklas').map((f) => f.id);
  assert.deepEqual(mit, ['J9', 'J15']);
  for (const id of mit) {
    const f = nach(id);
    const ab = [...f.inhalt.matchAll(/data-ab="(\d+)"/g)].map((m) => Number(m[1]));
    assert.deepEqual([...new Set(ab)].sort(), [1, 2], id);
  }
});

test('Teile: Fahrplan auf G0 in Vortragsreihenfolge, teilVon ordnet jede Hauptfolie zu', () => {
  const g0 = nach('G0').inhalt;
  let pos = 0;
  for (const t of TEILE) {
    const i = g0.indexOf(t.was, pos);
    assert.ok(i > pos, `G0 Fahrplan: ${t.id}`);
    pos = i;
  }
  assert.equal(teilVon(nach('G0')), null);
  assert.equal(teilVon(nach('J5')), 'jonas');
  assert.equal(teilVon(nach('G9')), 'fazit');
  assert.equal(teilVon(nach('J16')), null);
  assert.equal(teilVon(nach('R1')), null);
  assert.equal(teilVon({ teil: 'niklas', auftrag: '1A', id: 'N1' }), '1a');
  assert.equal(teilVon({ teil: 'niklas', auftrag: '1B', id: 'M1' }), '1b34');
  // G9 nimmt die Leitfrage von G0 wörtlich auf (Klammer Anfang–Ende)
  const leitfrage = g0.match(/„Wie wirksam[^“]+“/)[0];
  assert.ok(nach('G9').inhalt.includes(leitfrage));
});

test('Kurzfassung: nur Jonas-Folien, Summe 300–400 s; G9 gehört zu Niklas’ Kurzfassung', () => {
  assert.equal(F.find((f) => f.id === 'G9').kurzfassung, true);
  const k = F.filter((f) => f.kurzfassung && f.sprecher !== 'niklas');
  assert.ok(
    k.every((f) => f.teil === 'jonas'),
    'nur Jonas-Folien',
  );
  const s = summe(k);
  assert.ok(s >= 300 && s <= 400, `Summe ${s}`);
});

test('Pflichtfelder: quelle mit Rechner und Commit, notiz, auftrag, station', () => {
  const stationen = new Set(['klick', 'kontext', 'netz', 'inferenz', 'nachpruefung', 'gate', null]);
  for (const f of F) {
    assert.ok(['rahmen', 'jonas', 'reserve'].includes(f.teil), f.id);
    assert.ok(f.titel?.trim(), `${f.id} titel`);
    assert.ok(f.inhalt?.trim(), `${f.id} inhalt`);
    assert.ok(stationen.has(f.station), `${f.id} station ${f.station}`);
    assert.equal(typeof f.kurzfassung, 'boolean', f.id);
    // J16 ist das Literaturverzeichnis ohne eigene Messwerte (literatur.test.mjs prüft die Einträge).
    if (f.teil === 'rahmen' || f.id === 'J16') continue;
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

test('Rahmen: G0 und G9 ohne Entwurfsvermerk und Platzhalter; G9 zitiert Niklas', () => {
  for (const id of ['G0', 'G9']) assert.equal(nach(id)?.teil, 'rahmen', id);
  for (const id of ['G0', 'G9']) {
    assert.doesNotMatch(sichtbar(nach(id).inhalt) + nach(id).notiz, /Entwurf|\[Niklas|\[Satz/, id);
  }
  assert.match(nach('G9').fuss, /Schneider, 2026/);
  assert.equal(F[0].id, 'G0');
  assert.equal(F.at(-1).teil, 'reserve');
  // J16 (Literaturverzeichnis) folgt als Anhang direkt auf G9, nicht zwischen J15 und Niklas.
  const haupt = F.filter((f) => f.teil !== 'reserve').map((f) => f.id);
  assert.deepEqual(haupt.slice(-3), ['J15', 'G9', 'J16']);
  assert.equal(nach('J16').anhang, true);
});

test('Reservefolien R1–R14 (J14 als R11, Entscheidungen R12, J11 als R13, Einordnung R14)', () => {
  const r = F.filter((f) => f.teil === 'reserve');
  assert.deepEqual(
    r.map((f) => f.id),
    ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14'],
  );
  const text = r.map((f) => f.titel).join(' | ');
  for (const wort of [
    'Kalibrierung',
    'C0',
    'B0',
    'Kaltläufe',
    'Gültigkeitsgrenzen',
    'KI',
    'ADR',
    'Autorisierung',
    'Konsistenz',
    'ADR-0035',
    'Betrieb',
    'Entscheidungen',
    'Timeout und Speicher',
    'Cloud Computing',
  ])
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
    // git:<tag>:<pfad> = Datei am Release-Tag (unveränderlich), sonst relativ zu docs/referat-thema-1/
    const text = f.quelle.startsWith('git:')
      ? execFileSync('git', ['show', f.quelle.slice(4)], { cwd: ROOT, encoding: 'utf8' })
      : readFileSync(resolve(ROOT, f.quelle), 'utf8');
    assert.ok(text.includes(f.beleg), `${name}: Beleg fehlt in ${f.quelle}`);
    assert.ok(f.beleg.includes(fmt(f.wert)), `${name}: Wert nicht im Beleg`);
  }
});

test('Keine Zahl auf einer Folie, die nicht aus den Daten stammt', () => {
  const w = whitelist();
  // J16: Jahreszahlen, Seiten und DOIs des Literaturverzeichnisses prüft literatur.test.mjs.
  for (const f of F.filter((x) => x.id !== 'J16')) {
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

// ---------------------------------------------------------------- Nachbesserungen aus dem Review

test('J2 nennt den Commit des Aufbaus von null aus dessen Bericht', () => {
  const bericht = readFileSync(
    resolve(ROOT, 'evidenz/1B/messung/2026-11-13-aufbau-von-null.txt'),
    'utf8',
  );
  const commit = bericht.match(/^Repo: ([0-9a-f]{40})$/m)[1].slice(0, 8);
  const j2 = nach('J2');
  assert.ok(j2.quelle.includes(commit), `J2 quelle ohne ${commit}`);
  assert.ok(!j2.quelle.includes('747c8f7e'), 'J2 quelle nennt den Bericht vom 2026-11-12');
});

test('J2 legt die CPU-Abweichung offen und behauptet keine Limits wie im Release', () => {
  const j2 = nach('J2');
  const s = sichtbar(j2.inhalt);
  assert.ok(!/Limits wie im Release/.test(s), 'Limits wie im Release');
  assert.match(s, /4 statt 8 CPUs/);
  assert.match(s, /Speicherlimits wie ab Werk v1\.4\.0/);
  assert.match(j2.notiz, /4 statt 8/);
});

test('J1 nennt die Wartezeit des verfolgten Auftrags am Client (Klick bis Ergebnis), gerundet', () => {
  const lauf = JSON.parse(
    readFileSync(resolve(ROOT, 'evidenz/1B/messung/2026-11-13-lauf.json'), 'utf8'),
  );
  const nr = daten.antwort.auftrag;
  const t = lauf.treiber.auftraege.find((a) => a.index === nr);
  const sek = fmt(Math.round(t.clientWaitMs / 1000));
  assert.equal(sek, '152');
  const j1 = nach('J1');
  assert.ok(j1.titel.includes(`${sek} Sekunden`), `Titel ohne ${sek} Sekunden: ${j1.titel}`);
  assert.ok(!j1.titel.includes(fmt(daten.b1.jobWarmMs / 1000, 1)), 'Median im Titel');
  assert.match(j1.notiz, /dieser Auftrag/i);
  assert.match(j1.notiz, /Median/);
  assert.match(sichtbar(j1.inhalt), /Median warm, n = 9/);
  // T_job bleibt als serverseitige Jobdauer benannt, nie als Zeit ab dem Klick.
  assert.match(sichtbar(j1.inhalt), /Jobdauer T_job/);
  assert.ok(!/T_job[^.]*vom Klick/.test(j1.notiz + sichtbar(j1.inhalt)));
});

test('Mediane auf J9, J10 tragen die Gruppe warm, n = 9; Notizen trennen Auftrag und Median', () => {
  for (const id of ['J9', 'J10']) {
    assert.match(decode(nach(id).inhalt.replace(/<[^>]+>/g, '')), /warm, n = 9/, id);
    assert.match(nach(id).notiz, /Median/, `${id} notiz`);
  }
});

test('J12 nennt die Bedingung aus ADR 1C-016: nur Runden außer TEMPO', () => {
  const j12 = nach('J12');
  assert.match(sichtbar(j12.inhalt), /TEMPO/);
  assert.match(j12.notiz, /TEMPO/);
  assert.ok(!/Dann endet jeder Auftrag/.test(j12.notiz));
});

test('Jede Jonas-Folie zeigt ihr Auftragsetikett im Inhalt', () => {
  const hat = (html, a) => html.includes(`etikett-${a.toLowerCase()}`) || html.includes(`>${a}<`);
  for (const f of jonas.filter((x) => x.id !== 'J16')) {
    const noetig = f.auftrag === 'beide' ? ['1C', '1B'] : [f.auftrag];
    for (const a of noetig) assert.ok(hat(f.inhalt, a), `${f.id}: Etikett ${a} fehlt`);
  }
});

// ---------------------------------------------------------------- Fachliche Prüfung 1

const alles = (f) => `${f.titel} ${sichtbar(f.inhalt)} ${f.notiz ?? ''}`;
const jonasUndReserve = F.filter((f) => f.teil !== 'rahmen');

test('K1: Der Fallback trägt einen allgemeinen Hinweis; nirgends „ohne Hinweis“', () => {
  for (const f of F) assert.ok(!/ohne (jeden )?Hinweis/.test(alles(f)), `${f.id}: ohne Hinweis`);
  const j13 = nach('J13');
  assert.match(sichtbar(j13.inhalt), /Eine ausführliche Zusammenfassung war diesmal nicht möglich/);
  assert.match(sichtbar(j13.inhalt), /Grund/);
  assert.match(j13.quelle, /qaSummaryExtractive\.ts/);
});

test('K2: Messstand nach v1.4.0 benannt, Stand vor dem Gate mit 19 von 20 full-context', () => {
  for (const id of ['J1', 'J13', 'G9']) {
    assert.match(sichtbar(nach(id).inhalt), /1\.4\.0/, `${id}: Version 1.4.0 fehlt`);
  }
  for (const id of ['J13', 'G9']) {
    assert.match(sichtbar(nach(id).inhalt), /19 von 20/, `${id}: Stand vor dem Gate fehlt`);
  }
  assert.match(nach('J13').notiz, /9f230abc|vor dem Gate|Vor Version 1\.4\.0/);
  // „Release 1.3“ nur für die Architektur, nie als Messstand
  for (const f of F) {
    assert.ok(!/Release 1\.3 nachgebaut/.test(alles(f)), `${f.id}: Release 1.3 nachgebaut`);
    assert.ok(
      !/(gemessen|Messung)[^.]*Release 1\.3/.test(alles(f)),
      `${f.id}: gemessen … Release 1.3`,
    );
  }
  assert.match(sichtbar(nach('J2').inhalt), /1\.4\.0/);
});

test('W1: J8 erklärt den Abstand zwischen Wartezeit am Client und T_job', () => {
  const j8 = nach('J8');
  const s = sichtbar(j8.inhalt);
  assert.match(s, new RegExp(fmt(daten.auftrag.clientWaitMs / 1000, 1)));
  assert.match(s, new RegExp(fmt(daten.auftrag.jobMs / 1000, 1)));
  assert.match(s, /T_job/);
});

test('W2: Das Gate prüft mehr als die Form; Sprache und Inhalt nennt die Folie getrennt', () => {
  for (const f of F) {
    assert.ok(
      !/(prüft|scheitert)[^.]*nur (an )?(die|der) Form/.test(alles(f)),
      `${f.id}: nur die Form`,
    );
  }
  const j13 = nach('J13');
  assert.match(j13.notiz, /Sprache/);
  assert.match(j13.notiz, /mindestens zwei Aussagen|verschiedene Stichwörter/);
  assert.match(sichtbar(nach('J15').inhalt), /inhaltlich/);
});

test('W3: Karte J3 kennzeichnet je Station die Herkunft; Auftrag 2 mit eigenen Werten', () => {
  const j3 = nach('J3');
  const svg = j3.inhalt;
  assert.ok(svg.includes(`${fmt(daten.auftrag.hostReturnMs)} ms`), 'T_host von Auftrag 2');
  assert.ok(svg.includes(`Auftrag ${daten.auftrag.nr}`));
  assert.ok(svg.includes('1C-Test · 248029dc'));
  assert.ok(svg.includes('1C-Labor · def56700'));
  assert.ok(
    !svg.includes(`${fmt(daten.c1.requestMs.wert, 1)} ms`),
    '1C-Klickwert auf dem app-host',
  );
  assert.match(j3.notiz, /1C/);
});

test('W4/W5: Abweichungen und Grenzen je Auftrag offengelegt', () => {
  const j2 = sichtbar(nach('J2').inhalt);
  assert.match(j2, /Abweichungen und Grenzen/);
  for (const re of [
    /4 statt 8 CPUs/,
    /Timeout 300 s statt 90 s/,
    /202\ss/,
    /selbst gebaut/,
    /ohne Wrapper/,
    /Schalter/,
    /von Hand/,
  ])
    assert.match(j2, re, `J2: ${re}`);
  const c = F.filter(
    (f) => f.auftrag !== '1B' && /Abweichungen und Grenzen/.test(sichtbar(f.inhalt)),
  );
  const c1 = c.find((f) => f.id !== 'J2');
  assert.ok(c1, '1C-Block fehlt');
  const s = sichtbar(c1.inhalt);
  for (const re of [/ein Rechner/, /Loopback/, /4 CPUs/, /5 GiB/, /300 s/])
    assert.match(s, re, `${c1.id}: ${re}`);
  const j11 = sichtbar(nach('R13').inhalt);
  assert.match(j11, /5 GiB/);
  assert.match(j11, /21\./);
  assert.match(j11, /9f230abc/);
});

test('W6/W7/W8: Speicher bei wechselnden Prompts, warm = identischer Snapshot, R1 mit den richtigen Kalibrierungen', () => {
  assert.match(sichtbar(nach('R13').inhalt), /wechselnden Prompts/);
  const r5 = sichtbar(nach('R5').inhalt);
  assert.match(r5, /identische/);
  assert.match(nach('J9').notiz, /identisch/);
  const r1 = alles(nach('R1'));
  assert.match(r1, /196/);
  assert.match(r1, /202/);
  assert.match(r1, /Laptop/);
});

test('W12: R12 nennt je Entscheidung Kosten, Risiko oder Betriebsfolge; J15 verweist auf R12', () => {
  const s = sichtbar(nach('R12').inhalt);
  for (const re of [/Kosten/, /Risiko/, /Betrieb/]) assert.match(s, re);
  const j15 = sichtbar(nach('J15').inhalt);
  assert.match(j15, /Details: R12/);
  assert.match(j15, /nicht umgesetzt/);
  assert.match(j15, /1C/);
  assert.match(j15, /1B/);
});

test('W14/I-06: Ohne freigegebenen Clip zeigt J13 den Nachbau; die Notiz nennt ihn so', () => {
  const ohneClip = folien({ ...daten, clip: null }).find((f) => f.id === 'J13');
  assert.match(ohneClip.notiz, /Nachbau/);
});

test('Abdeckung: R8–R10 nennen Berechtigung, Konsistenzfälle und Rollen mit Belegen', () => {
  assert.match(sichtbar(nach('R8').inhalt), /assertHostSessionAccessFromContext/);
  for (const k of ['E7', 'E8', 'E12', 'T2.3', 'E15', 'T1'])
    assert.match(sichtbar(nach('R9').inhalt), new RegExp(`\\b${k.replace('.', '\\.')}\\b`), k);
  const r10 = sichtbar(nach('R10').inhalt);
  for (const w of ['Encoder', 'Adapter', 'llama-server', '768', '256'])
    assert.match(r10, new RegExp(w));
  for (const f of jonasUndReserve) assert.ok(f.quelle, f.id);
});

// ---------------------------------------------------------------- Fachliche Prüfung 2

const sichtbarAlle = () => F.map((f) => `${f.id}: ${alles(f)}`).join('\n');

test('I-01: Netz in ms zuerst; Prozentanteil nur mit Hinweis auf die langsame CPU', () => {
  assert.match(nach('J9').notiz, /langsame/);
  const j9svg = nach('J9').inhalt;
  assert.match(j9svg, /langsame CPU/);
  assert.match(alles(nach('R11')), /langsame/);
  assert.ok(!/Transport ist damit rund/.test(nach('J9').notiz));
});

test('I-02: Start ohne Wrapper mit dem richtigen Grund (Override)', () => {
  const j2 = alles(nach('J2'));
  assert.match(j2, /Override/);
  assert.ok(!/weil Runbook §6 ihn bricht|nach dem Runbook nicht läuft/.test(j2));
  assert.ok(!/Laptop nicht mehr hat/.test(j2), 'B-01');
});

test('I-03: Gate-Befund mit Geltungsbereich (38 beobachtete Antworten, ein Modell, eine Fixture)', () => {
  assert.ok(
    !/verwirft (das Gate )?jede (Modell)?[Aa]ntwort/.test(sichtbarAlle()),
    'unbegrenzt „jede Antwort“',
  );
  const j13 = nach('J13');
  assert.match(j13.titel, new RegExp(`${daten.abgeleitet.gateBeobachtet}`));
  assert.match(sichtbar(j13.inhalt), /ein Modell/);
  assert.match(sichtbar(j13.inhalt), /eine Fixture/);
  assert.match(j13.notiz, /failed|ohne Aussagen/);
  assert.match(sichtbar(nach('G9').inhalt), /geprüft/);
});

test('I-04: KI-Anteil und Methode nennen die Ausnahmen der Vorabfestlegung', () => {
  for (const id of ['J4', 'R6']) {
    const s = sichtbar(nach(id).inhalt);
    assert.ok(!/vor jeder Messung|bevor gemessen wurde|vor jedem Lauf/.test(s), id);
    assert.match(s, /M7b/, id);
    assert.match(s, /ohne vorherige Freigabe/, id);
    assert.match(s, /1B-Leitfrage/, id);
  }
});

test('I-05/R3-I4: Nachprüfung mit belegtem Preis unter Voting, ohne Vorhersage als Tatsache', () => {
  assert.ok(!/kostet fast nichts/.test(nach('J12').titel));
  for (const id of ['J12', 'J15', 'R12']) {
    const t = alles(nach(id));
    assert.match(t, /Voting/, id);
    assert.match(t, /Stimme/, id);
    assert.ok(!/0,97|0,99/.test(t), `${id}: Vorhersage als Zahl`);
  }
  assert.match(sichtbar(nach('J12').inhalt), /M7/);
  assert.match(sichtbar(nach('J12').inhalt), /nicht belastbar|offen/);
  assert.ok(!/kein neues Risiko/.test(sichtbarAlle()));
});

test('I-06: J13 zeigt den Nachbau der Lehrenden-Sicht mit echtem Inhalt und Hinweistext aus dem App-Code', () => {
  const j13 = nach('J13').inhalt;
  assert.ok(!/Platz für den Clip/.test(j13));
  assert.match(j13, /data-nachbau/);
  assert.match(j13, /Nachbau/);
  for (const frage of daten.nachbau.fragen) assert.ok(decode(j13).includes(frage), frage);
  const quelle = readFileSync(
    resolve(ROOT, '../../apps/backend/src/lib/qaSummaryExtractive.ts'),
    'utf8',
  );
  assert.ok(quelle.includes(daten.nachbau.hinweis), 'Hinweis wörtlich aus dem App-Code');
  assert.ok(decode(j13).includes(daten.nachbau.hinweis));
  // Die Notiz nennt den Nachbau nur ohne Clip (mit Clip ersetzt deck.mjs den Nachbau).
  assert.match(folien({ ...daten, clip: null }).find((f) => f.id === 'J13').notiz, /Nachbau/);
});

test('I-10: Messstand mit git describe; kein „Fork-main, Version 1.4.0 (8e9d1317)“', () => {
  const t = sichtbarAlle();
  assert.ok(!/Fork-main, Version 1\.4\.0/.test(t));
  assert.match(sichtbar(nach('J2').inhalt), /a19ca70f/);
  assert.match(sichtbar(nach('J2').inhalt), /v1\.4\.0-184/);
  assert.match(sichtbar(nach('J1').inhalt), /v1\.4\.0-14/);
});

test('Minor: OOM-Vergleich, Speicherursache, Kaltaussage, Blitzlicht-Typen', () => {
  const j11 = sichtbar(nach('R13').inhalt);
  assert.match(j11, /10 GiB/);
  assert.match(j11, /Laptop und PC/);
  assert.match(nach('R13').notiz, /vermutlich|nicht getrennt gemessen/);
  assert.ok(!/Alle drei Hypothesen sind erfüllt, auch kalt/.test(nach('J9').notiz));
  assert.match(sichtbar(nach('J12').inhalt), /geprüft: YESNO/);
  assert.match(sichtbar(nach('J7').inhalt), /keinem Lauf/);
});

// ---------------------------------------------------------------- Fachliche Prüfung 3

test('R3-I1: Werte ab Werk mit Version; v1.3.0 und der Grund für den Messstand genannt', () => {
  const j2 = sichtbar(nach('J2').inhalt);
  assert.match(j2, /v1\.3\.0/);
  assert.match(j2, /Prüfer/);
  assert.match(j2, /4 CPUs/);
  assert.match(j2, /5 GiB/);
  for (const f of F) {
    const t = alles(f);
    assert.ok(
      !/Release-Timeout|\(Release:|Release ab Werk|wie im Release/.test(t),
      `${f.id}: „Release“ ohne Version`,
    );
  }
  assert.match(sichtbar(nach('J4').inhalt), /v1\.4\.0/);
  assert.match(nach('R13').inhalt, /ab Werk v1\.4\.0/);
});

test('R3-I2: 19 von 20 mit Instruktion v2 und ohne Gate; nicht allein dem Gate zugeschrieben', () => {
  for (const id of ['J13', 'J15', 'G9']) {
    const t = alles(nach(id));
    assert.match(t, /Instruktion/, id);
    assert.ok(!/bestand[^.]*vorher/.test(t), `${id}: „bestand … vorher“`);
    assert.ok(!/Vor dem Gate/.test(sichtbar(nach(id).inhalt)), `${id}: „Vor dem Gate“`);
  }
  assert.match(nach('J13').notiz, /zugleich|beides/);
});

test('R3-I5: Kurzfassung enthält J13 und J15', () => {
  for (const id of ['J13', 'J15']) assert.equal(nach(id).kurzfassung, true, id);
});

test('R3-Minor: geprüfte Antworten, App-Überschrift im Nachbau, Ausnahmen in G9, Risiken in J15', () => {
  assert.match(nach('J13').titel, /geprüfte/);
  const html = readFileSync(
    resolve(
      ROOT,
      '../../apps/frontend/src/app/features/session/session-host/moderation-compass-dialog.component.html',
    ),
    'utf8',
  );
  assert.ok(html.includes(daten.nachbau.titel), 'Überschrift aus dem Template');
  assert.ok(decode(nach('J13').inhalt).includes(daten.nachbau.titel));
  assert.match(sichtbar(nach('G9').inhalt), /Ausnahmen/);
  assert.ok((sichtbar(nach('R12').inhalt).match(/Risiko/g) ?? []).length >= 4);
  assert.match(sichtbar(nach('J15').inhalt), /Details: R12/);
  assert.match(nach('J10').notiz, /langsame/);
});

// ---------------------------------------------------------------- Fachliche Prüfung 4

test('R4-I1: Früherer OOM ohne Kausalaussage „weil mehr Tokens“ (ADR 1C-024: nicht getrennt gemessen)', () => {
  const kausal = /weil[^.]*mehr Tokens|\(mehr Tokens/;
  for (const f of F) assert.ok(!kausal.test(alles(f)), f.id);
  const katalog = readFileSync(resolve(ROOT, 'abgabe/jonas/fragenkatalog.md'), 'utf8');
  assert.ok(!kausal.test(katalog), 'Fragenkatalog');
  assert.match(sichtbar(nach('R13').inhalt), /nicht getrennt gemessen/);
});

test('R4-Minor: J4-Notiz ohne „Release“, Swap des Hosts unbekannt, Netz über beide Anfragen', () => {
  assert.ok(!/als im Release/.test(nach('J4').notiz));
  assert.match(sichtbar(nach('R13').inhalt), /Swap des Hosts unbekannt/);
  assert.match(sichtbar(nach('J8').inhalt), /GET \/slots und POST/);
  assert.ok(!/Uhrendrift/.test(alles(nach('J8'))));
  assert.match(nach('R2').notiz, /Streuung/);
});

// ---------------------------------------------------------------- Fachliche Prüfung 5

test('R5: Gate-Wechsel mit a998ada0, Validierung am Stand 248029dc, Nutzlastpfad, Aufteilung der 38', () => {
  const j13 = nach('J13');
  assert.match(sichtbar(j13.inhalt), /a998ada0/);
  assert.match(sichtbar(j13.inhalt), /uncertain/);
  assert.match(j13.notiz, /[Zz]wei Upstream-Commits|a998ada0/);
  assert.match(nach('J6').notiz, /nur auf dem älteren Stand/);
  for (const id of ['J6', 'J7']) assert.match(nach(id).quelle, /labor\.quiet\.runs\[/, id);
  // J13 nennt die Nutzlast nur mit dem Nachbau (ohne Clip).
  const j13OhneClip = folien({ ...daten, clip: null }).find((f) => f.id === 'J13');
  assert.match(j13OhneClip.quelle, /labor\.quiet\.runs\[/);
  assert.match(
    sichtbar(nach('G9').inhalt),
    new RegExp(`1B ${daten.b1.verworfen}, 1C ${daten.c1.gateAntwortenGesamt.wert}`),
  );
  assert.equal(nach('R13').station, null);
});

test('J13: Clip-Angaben stimmen mit dem App-Hinweis überein, die Notiz nennt den Grund des Clip-Laufs', () => {
  assert.ok(daten.clip, 'medien/clip.json fehlt');
  assert.equal(daten.clip.hinweis.startsWith(daten.nachbau.hinweis.replace(/…$/, '').trim()), true);
  const j13 = folien(daten).find((f) => f.id === 'J13');
  assert.equal(/Timeout/.test(j13.notiz), daten.clip.grund === 'timeout');
  assert.doesNotMatch(`${j13.notiz} ${j13.fuss}`, /power-saver|balanced|Energieprofil/);
  assert.doesNotMatch(j13.notiz, /Rechts ein Nachbau/);
  assert.doesNotMatch(`${j13.fuss} ${j13.quelle}`, /Nachbau/);
  assert.match(j13.quelle, /Hinweis qaSummaryExtractive\.ts/);
  assert.match(j13.quelle, /evidenz\/1B\/2026-11-15-clip\.md/);
  const ohne = folien({ ...daten, clip: null }).find((f) => f.id === 'J13');
  assert.match(ohne.notiz, /Rechts ein Nachbau/);
});

// ZL S. 2–3 und Anhang B: Kurzbelege auf jeder Folie, vollständiges Literaturverzeichnis am Ende.
test('ZL: jede Folie von Jonas, Rahmen und Reserve trägt eine Quellenzeile mit Kurzbeleg', async () => {
  const { LITERATUR } = await import('./literatur.mjs');
  const kurz = LITERATUR.map((e) => e.kurz);
  for (const f of F.filter((x) => x.id !== 'J16')) {
    assert.match(f.fuss, /^Quelle: /, `${f.id}: Fußzeile ohne „Quelle:“`);
    assert.ok(
      kurz.some((k) => f.fuss.includes(k)),
      `${f.id}: kein Kurzbeleg aus dem Literaturverzeichnis in „${f.fuss}“`,
    );
  }
});

test('ZL: J16 zeigt das vollständige Literaturverzeichnis, jede Quelle ist auf einer Folie zitiert', async () => {
  const { LITERATUR } = await import('./literatur.mjs');
  const j16 = nach('J16');
  assert.ok(j16, 'J16 fehlt');
  assert.equal(j16.teil, 'jonas');
  assert.equal(
    F.filter((f) => f.teil === 'jonas').at(-1).id,
    'J16',
    'J16 ist die letzte Folie von Jonas',
  );
  const norm = (h) => decode(h.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ');
  const text = norm(j16.inhalt);
  for (const e of LITERATUR) {
    assert.ok(text.includes(norm(e.voll)), `${e.schluessel} fehlt auf J16`);
    assert.ok(
      F.some((f) => f.id !== 'J16' && f.fuss.includes(e.kurz)),
      `${e.schluessel} auf keiner Folie zitiert`,
    );
  }
  assert.match(j16.titel, /Literaturverzeichnis/);
});

// ---------------------------------------------------------------- Audit 2026-11-16

test('Fußzeile: eine Quellenzeile nur mit Kurzbelegen, ohne Commit und Rechner', () => {
  for (const f of F.filter((x) => x.id !== 'J16')) {
    assert.ok(
      !/\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{8}\b/.test(f.fuss),
      `${f.id}: Commit in „${f.fuss}“`,
    );
    assert.ok(!/ThinkPad|i7-|· Laptop|· PC/.test(f.fuss), `${f.id}: Rechner in „${f.fuss}“`);
    assert.ok(!/Weirauch, 2026[abd]/.test(f.fuss), `${f.id}: alter Jahresbuchstabe`);
  }
  // J1 zeigt keine Commits mehr (Versionen nur als git describe, I-10)
  assert.ok(!/\b(a19ca70f|def56700)\b/.test(sichtbar(nach('J1').inhalt)));
});

test('Defensive Formulierungen: Laptop-CPU, Nachlaufwert benannt, Konsistenzprüfung, Transport, Messunsicherheit', () => {
  assert.match(sichtbar(nach('J1').inhalt), /Laptop/);
  assert.match(sichtbar(nach('J1').inhalt), /CPU/);
  // 223,7 s nur als Nachlaufwert benannt; die geringe Nebenlast bleibt im Protokoll (Entscheidung des Autors 2026-11-16)
  const nachlauf = fmt(daten.c1.inferenzS.wert, 1);
  for (const f of F) {
    const t = `${sichtbar(f.inhalt)} ${f.notiz ?? ''}`;
    for (const satz of t.split(/(?<=[.;])\s/)) {
      if (satz.includes(nachlauf))
        assert.match(satz, /Nachlauf|v1\.4\.0/, `${f.id}: ${nachlauf} ohne Nachlauf-Bezug`);
    }
    assert.doesNotMatch(t, /Nebenlast/, `${f.id}: Nebenlast gehört nicht auf Folie oder Notiz`);
  }
  assert.match(alles(nach('R13')), /zu kurz auf beiden Laborrechnern/);
  assert.match(sichtbar(nach('R13').inhalt), new RegExp(fmt(daten.c1.inferenzRuhigS.wert, 1)));
  assert.match(alles(nach('R13')), /nicht dem Cache zu(zu)?ordnen|nicht dem Cache zuordenbar/);
  assert.match(nach('R13').fuss, /Server-specific params/);
  assert.match(sichtbar(nach('R3').inhalt), /gestoppt/);
  assert.match(alles(nach('R2')), /nicht nachweisbar/);
  assert.match(sichtbar(nach('J4').inhalt), /Konsistenzprüfung/);
  assert.match(sichtbar(nach('J4').inhalt), /Orientiert an Papadopoulos/);
  assert.match(sichtbar(nach('J8').inhalt), /Messunsicherheit der Uhren/);
  assert.match(sichtbar(nach('J8').inhalt), /Server ohne Inferenz/);
  for (const f of F)
    assert.ok(!/Auflösung|schnellerer Hardware|nicht langsamer/.test(alles(f)), f.id);
  assert.match(nach('J9').notiz, new RegExp(`über ${daten.abgeleitet.anteilPcMin} Prozent`));
  // Qwen: Variante aus dem Manifest, nicht aus Yang et al.
  assert.match(sichtbar(nach('J2').inhalt), /Instruct-2507 Q4_K_M \(Manifest\)/);
  // Warme Spanne neben dem warmen Median (ein Lauf, keine unabhängigen Wiederholungen)
  const spanne = `${fmt(daten.b1.jobWarmSpanneS[0], 1)}–${fmt(daten.b1.jobWarmSpanneS[1], 1)} s`;
  for (const id of ['J1', 'R4']) assert.ok(sichtbar(nach(id).inhalt).includes(spanne), id);
});

test('J13 nennt die Gate-Ablation in einer Zeile', () => {
  const s = sichtbar(nach('J13').inhalt);
  assert.match(s, /Ablation/);
  assert.ok(s.includes(daten.c1.ablationNeuEnglisch.wert));
  assert.ok(s.includes(daten.c1.ablationAltMeta.wert));
  assert.match(s, /Formregeln/);
});

test('Titel als Aussage: J2, J3, J10, J15; J10 aus den Daten', () => {
  assert.equal(
    nach('J10').titel,
    `Das Netz ist ${fmt(daten.abgeleitet.feldNetzMm, 1)} mm auf ${fmt(daten.abgeleitet.feldM)} m`,
  );
  assert.match(nach('J3').titel, new RegExp(`${fmt(daten.auftrag.hostReturnMs)} ms`));
  assert.match(nach('J15').titel, /Entkopplung bleibt/);
  assert.match(nach('J2').titel, /Produktionscode unverändert/);
  const j15 = sichtbar(nach('J15').inhalt);
  for (const w of ['Bleibt', 'Empfohlen, nicht umgesetzt', 'Offen', 'Zur Diskussion'])
    assert.match(j15, new RegExp(w));
  assert.equal((j15.match(/\?/g) ?? []).length, 2, 'eine Diskussionsfrage plus Übergabe');
});

test('R14: Einordnung Cloud Computing als Rechnung aus dem Code, Zeilen stimmen', () => {
  const r14 = nach('R14');
  const s = sichtbar(r14.inhalt);
  assert.match(s, /Rechnung aus dem Code, keine Messung/);
  for (const w of [
    'Elastizität',
    'Ressourcenbündelung',
    'Netzzugang',
    'Bulkhead',
    'busy',
    'queue_full',
    'SLO',
  ])
    assert.match(s, new RegExp(w), w);
  const code = (datei) =>
    readFileSync(resolve(ROOT, `../../apps/backend/src/lib/${datei}`), 'utf8').split('\n');
  const client = code('openWeightLlmClient.ts');
  assert.match(client[140], /let inFlight = false/);
  assert.match(client[496], /if \(inFlight\) return \{ status: 'busy'/);
  const config = code('qaSummaryConfig.ts');
  assert.match(config[25], /QA_SUMMARY_QUEUE_LIMIT_DEFAULT = 8/);
  assert.match(config[28], /QA_SUMMARY_CONCURRENCY_DEFAULT = 1/);
  assert.match(code('qaSummaryQueue.ts')[509], /queue\.length \+ running >= config\.queueLimit/);
  // NIST steht ohne Literatureintrag (nicht im Handout zitiert)
  assert.ok(!r14.fuss.includes('NIST'));
});
