// Folieninhalte von Jonas (1C und 1B Schritte 1–2), Reserve und gemeinsamer Rahmen.
// Jede Folie folgt dem Muster Frage → Mechanismus → Zahl → Beleg. Zahlen kommen aus dem Datenmodul
// (zahlen.mjs), aus den committeten Ergebnisdateien (über ladeFolienDaten) oder aus FESTWERTE
// (vorab festgelegte Schwellen und Konfigurationswerte, je mit wörtlichem Beleg; der Test prüft ihn).
//
// Fläche: inhalt füllt die Diagrammfläche der Folie (1380 × 560 px, .folie-flaeche in stil.css).
// Titel, Fußzeile mit Seitenzahl und quelle sowie der wandernde Marker (station) setzt der Bau.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { fussballfeldSvg, wegSvg, zeitzerlegungSvg } from './grafik.mjs';
import { fmt, ladeZahlen } from './zahlen.mjs';

/** Vorab festgelegte Schwellen und Konfigurationswerte; quelle relativ zu docs/referat-thema-1/. */
export const FESTWERTE = {
  releaseTimeoutS: {
    wert: 90,
    text: 'Timeout der Q&A-Zusammenfassung ab Werk, s',
    quelle: 'adr/1C-023-release-timeout-90-s-zu-kurz.md',
    beleg: 'ab Werk ein Timeout von 90 s',
  },
  laborTimeoutS: {
    wert: 300,
    text: 'Timeout im Labor (Obergrenze des Produkts), s',
    quelle: 'adr/1C-020-timeout-300-s-und-kalibrierungsregel.md',
    beleg: 'Timeout 300 s im Laptop-Lauf',
  },
  schwelleNetzMs: {
    wert: 50,
    text: 'H_B1: Netz je Auftrag im Median höchstens, ms',
    quelle: 'adr/1B-008-kernaussagen-und-schwellen.md',
    beleg: 'im Median ≤ 50 ms, Maximum ≤ 200 ms',
  },
  schwelleAdapterS: {
    wert: 2,
    text: 'H_B2: Adapter je Auftrag im Median höchstens, s',
    quelle: 'adr/1B-008-kernaussagen-und-schwellen.md',
    beleg: 'Adapterzeit je Auftrag im Median ≤ 2 s',
  },
  schwelleInferenzProzent: {
    wert: 95,
    text: 'H_B3: Inferenzanteil im Median mindestens, %',
    quelle: 'adr/1B-008-kernaussagen-und-schwellen.md',
    beleg: 'Inferenz ≥ 95 % der Job-Dauer im Median',
  },
  schwelleNachpruefungProzent: {
    wert: 5,
    text: 'Regel 1C-010: Anteil der Nachprüfung unter, %',
    quelle: 'adr/1C-010-nachpruefung-nach-inferenz-beibehalten.md',
    beleg: 'Beide Obergrenzen < 5 %',
  },
  schwelleC0Ms: {
    wert: 5,
    text: 'H_C0: Differenz der Mediane höchstens, ms',
    quelle: 'evidenz/1B/2026-11-13-lauf.md',
    beleg: 'H_C0: Differenz ≤ 5 ms',
  },
  schwelleB0S: {
    wert: 2,
    text: 'H_B0: T_job im Median höchstens, s',
    quelle: 'evidenz/1B/2026-11-13-lauf.md',
    beleg: 'H_B0: alle `unavailable`, Median ≤ 2 s',
  },
  releaseCpus: {
    wert: 8,
    text: 'CPUs und Threads der Runtime im Release',
    quelle: 'adr/1B-005-abweichungen-vom-release.md',
    beleg: 'Runtime mit 4 statt 8 CPUs und Threads per Override',
  },
  laborCpus: {
    wert: 4,
    text: 'CPUs und Threads der Runtime im Labor',
    quelle: 'adr/1B-005-abweichungen-vom-release.md',
    beleg: 'Runtime mit 4 statt 8 CPUs und Threads per Override',
  },
  // Ergänzt nach der fachlichen Prüfung 1 (Offenlegung, Kalibrierung, Abdeckung)
  schwelleNetzMaxMs: {
    wert: 200,
    text: 'H_B1: Netz je Auftrag höchstens (Maximum), ms',
    quelle: 'adr/1B-008-kernaussagen-und-schwellen.md',
    beleg: 'im Median ≤ 50 ms, Maximum ≤ 200 ms',
  },
  laborTimeout1BS: {
    wert: 300,
    text: '1B: Timeout nach der Kalibrierungsregel (75 s < I ≤ 270 s), s',
    quelle: 'adr/1B-005-abweichungen-vom-release.md',
    beleg: '75 s < I ≤ 270 s | 300 000 ms (Code-Grenze)',
  },
  kalibrierung1BS: {
    wert: 202,
    text: '1B: Kalibrierung I vor dem gewerteten Lauf, s (202 162 ms)',
    quelle: 'evidenz/1B/2026-11-13-lauf.md',
    beleg: 'I = 202162 ms (`prompt_ms` 81874, `predicted_ms` 120289',
  },
  kalibrierungLaptopS: {
    wert: 196,
    text: '1C: Kalibrierungsanfrage am Laptop (2026-11-04), Wandzeit in s',
    quelle: 'adr/1C-020-timeout-300-s-und-kalibrierungsregel.md',
    beleg: 'HTTP 200 in 196 s Wandzeit',
  },
  kalibrierungLaptopPrefillS: {
    wert: 95,
    text: '1C: Prefill der Laptop-Kalibrierung, s',
    quelle: 'adr/1C-020-timeout-300-s-und-kalibrierungsregel.md',
    beleg: 'Prefill: 2166 Tokens in 95 s',
  },
  kalibrierungLaptopAusgabeS: {
    wert: 101,
    text: '1C: Ausgabe der Laptop-Kalibrierung, s',
    quelle: 'adr/1C-020-timeout-300-s-und-kalibrierungsregel.md',
    beleg: 'Ausgabe: 354 Tokens in 101 s',
  },
  laborCpus1C: {
    wert: 4,
    text: '1C-Nachlauf: CPUs der Runtime (Laborpfad llm-http)',
    quelle: 'evidenz/1C/2026-11-09-labor-nachlauf.md',
    beleg: '`127.0.0.1:8080`, 4 CPUs, 5 GiB, 4 Threads',
  },
  laborSpeicher1CGiB: {
    wert: 5,
    text: '1C-Nachlauf: Speicherlimit der Runtime, GiB (Swap gleich dem Limit)',
    quelle: 'evidenz/1C/2026-11-09-labor-nachlauf.md',
    beleg: '`127.0.0.1:8080`, 4 CPUs, 5 GiB, 4 Threads',
  },
  prodSpeicherGiB: {
    wert: 8,
    text: 'Produktionslimit der Runtime (Inferenz-Host), GiB',
    quelle: 'adr/1C-021-zusatzlauf-produktionslimits-zweiter-rechner.md',
    beleg: '(8 CPUs, 8 GiB, 10 GiB mit Swap, 8 Threads)',
  },
  prodSwapGiB: {
    wert: 2,
    text: 'Swap über dem Produktionslimit, GiB',
    quelle: 'adr/1C-024-prompt-cache-ram-begrenzen.md',
    beleg: 'Auch mit 8 GiB plus 2 GiB Swap kam der Kill',
  },
  netzAufloesungMs: {
    wert: 1,
    text: 'Auflösung der Netzmessung (zwei VM-Uhren), ms',
    quelle: 'adr/1B-011-zeitbegriffe-und-leitfrage.md',
    beleg: 'zwei Uhren, Auflösung ≈ ± 1 ms',
  },
  nPredictRelease: {
    wert: 768,
    text: '--n-predict im ausgelieferten entrypoint.sh',
    quelle: 'evidenz/1B/2026-11-13-lauf.md',
    beleg:
      'ADR-0035 Z. 184 nennt für `--n-predict` „Richtung 256“, der ausgelieferte `entrypoint.sh` Z. 40 setzt 768',
  },
  nPredictAdr: {
    wert: 256,
    text: '--n-predict laut ADR-0035',
    quelle: 'evidenz/1B/2026-11-13-lauf.md',
    beleg: 'ADR-0035 Z. 184 nennt für `--n-predict` „Richtung 256“',
  },
  antwortTokensMin: {
    wert: 506,
    text: 'Antwortlänge im 1B-Lauf, kleinster Wert (Tokens)',
    quelle: 'evidenz/1B/2026-11-13-lauf.md',
    beleg: 'Die Antworten hatten 506–613 Tokens',
  },
  antwortTokensMax: {
    wert: 613,
    text: 'Antwortlänge im 1B-Lauf, größter Wert (Tokens)',
    quelle: 'evidenz/1B/2026-11-13-lauf.md',
    beleg: 'Die Antworten hatten 506–613 Tokens',
  },
};

const ANTWORT = 'evidenz/1B/messung/2026-11-15-abgelehnte-antwort.json';
const LAUF_1B = 'evidenz/1B/messung/2026-11-13-lauf.json';
const NACHLAUF_1C = 'evidenz/1C/messung/2026-11-09-labor-nachlauf.json.gz';
const AUFBAU_VON_NULL = 'evidenz/1B/messung/2026-11-13-aufbau-von-null.txt';

const json = (pfad) => JSON.parse(readFileSync(pfad, 'utf8'));

/** Nutzlast-Ausschnitt aus dem committeten Nachlauf (synthetische Referenzfixture #456). */
function ladeNutzlast(root) {
  const roh = JSON.parse(gunzipSync(readFileSync(resolve(root, NACHLAUF_1C))));
  const laeufe = roh.labor.quiet.runs;
  const lauf = laeufe.findIndex((r) => !r.warmup && r.completionRequests === 1);
  const r = laeufe[lauf];
  const ex = r.exchanges.find((e) => e.path === '/v1/chat/completions');
  if (!ex.wire.userEqualsPreview || r.preview.snapshotHash !== r.sent.snapshotHash) {
    throw new Error('Nachlauf: Vorschau und Nutzlast weichen im gewählten Lauf ab');
  }
  const body = JSON.parse(ex.rawRequestBody);
  const ctx = JSON.parse(body.messages.find((m) => m.role === 'user').content);
  const frage = ctx.sources
    .filter((s) => s.kind === 'qa-question' && s.content?.state === 'included')
    .sort((a, b) => a.content.text.length - b.content.text.length)[0];
  const budget = ctx.limitations.find((l) => l.code === 'budget-truncated');
  return {
    datei: NACHLAUF_1C,
    lauf,
    zeilen: [
      `"contractVersion":${JSON.stringify(ctx.contractVersion)}`,
      `"feedback":${JSON.stringify(ctx.feedback)}`,
      `"content":${JSON.stringify(frage.content)}`,
    ],
    budgetZeile: JSON.stringify(budget),
    hashVorschau: r.preview.snapshotHash,
    hashGesendet: r.sent.snapshotHash,
    zahlen: { bodyBytes: ex.requestBodyBytes, userBytes: ex.wire.userMessageBytes },
    commit: roh.environment.gitSha.slice(0, 8),
    cpu: roh.environment.cpuModel,
  };
}

/** Daten aller Folien: Datenmodul, abgelehnte Antwort, der verfolgte Auftrag und der Nutzlast-Ausschnitt. */
export function ladeFolienDaten(root) {
  const z = ladeZahlen(root);
  const antwort = json(resolve(root, ANTWORT));
  const lauf = json(resolve(root, LAUF_1B));
  const nr = antwort.auftrag;
  const t = lauf.treiber.auftraege.find((a) => a.index === nr);
  const zer = lauf.zerlegung.auftraege[nr - 1];
  if (
    !t ||
    !zer ||
    t.effectiveMode !== zer.effectiveMode ||
    t.fallbackReason !== zer.fallbackReason
  ) {
    throw new Error(`Auftrag ${nr} passt nicht zwischen Treiber und Zerlegung`);
  }
  const auftrag = {
    nr,
    requestedAt: t.requestedAt,
    finishedAt: t.finishedAt,
    // Wartezeit am Client vom Klick bis zum Endstatus (Treiber fragt im Sekundentakt nach) und
    // Rückkehr des Host-Aufrufs; T_job (jobMs) ist dagegen die Jobdauer am Server (ADR 1B-011).
    clientWaitMs: t.clientWaitMs,
    hostReturnMs: t.hostReturnMs,
    netzMs: zer.netzMs,
    inferMs: zer.inferMs,
    jobMs: zer.jobMs,
  };
  // Commit des Aufbaus von null steht in dessen Bericht (Zeile „Repo: <sha>“).
  const repo = readFileSync(resolve(root, AUFBAU_VON_NULL), 'utf8').match(
    /^Repo: ([0-9a-f]{40})$/m,
  );
  if (!repo) throw new Error(`${AUFBAU_VON_NULL}: Zeile „Repo:“ fehlt`);
  const aufbau = { datei: AUFBAU_VON_NULL, commit: repo[1].slice(0, 8) };
  return { ...z, antwort, auftrag, aufbau, nutzlast: ladeNutzlast(root) };
}

// ---------------------------------------------------------------- Bausteine

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const etikett = (a) => `<span class="etikett etikett-${a.toLowerCase()}">${a}</span>`;

/** Etikett links oben über einer Grafik aus grafik.mjs (die Grafik bleibt direktes Kind der Fläche). */
const etikettOben = (a) =>
  `<span class="etikett etikett-${a.toLowerCase()}" style="position:absolute;left:0;top:0">${a}</span>`;

const flaeche = (inhalt) =>
  `<div style="position:relative;width:1380px;height:560px;box-sizing:border-box">${inhalt}</div>`;

const frage = (text, auftrag) =>
  `<p style="margin:0 0 26px;font-size:30px;font-weight:600;color:var(--text-2)">` +
  `${auftrag ? `${etikett(auftrag)} ` : ''}${text}</p>`;

const liste = (punkte, groesse = 28) =>
  `<ul style="margin:0;padding-left:30px;font-size:${groesse}px;line-height:1.38">` +
  punkte.map((p) => `<li style="margin:0 0 12px">${p}</li>`).join('') +
  '</ul>';

const beleg = (text) =>
  `<p style="position:absolute;left:0;right:0;bottom:0;margin:0;font-size:var(--s-min);color:var(--gedaempft)">` +
  `Beleg: ${text}</p>`;

/** Große Zahl in Plex Mono mit Bezeichnung und Gruppe (Rechner, Stand, n). */
function zahl({
  wert,
  einheit,
  was,
  gruppe,
  farbe = 'var(--tinte)',
  linie = 'var(--blau)',
  gross = 84,
}) {
  return (
    `<div style="border-left:6px solid ${linie};padding:6px 0 6px 24px;margin:0 0 26px">` +
    `<div class="messwert" style="font-size:${gross}px;line-height:1.05;color:${farbe}">${wert}` +
    `<span style="font-size:${Math.round(gross * 0.5)}px">${einheit ? ` ${einheit}` : ''}</span></div>` +
    `<div style="font-size:26px;margin-top:8px">${was}</div>` +
    `<div class="mono" style="font-size:var(--s-min);color:var(--gedaempft)">${gruppe}</div></div>`
  );
}

const zweiSpalten = (links, rechts, breite = 800) =>
  `<div style="display:grid;grid-template-columns:${breite}px 1fr;column-gap:70px">` +
  `<div>${links}</div><div>${rechts}</div></div>`;

const entwurf =
  `<p style="position:absolute;right:0;top:-50px;margin:0;padding:4px 14px;border:var(--linie-min) dashed var(--rot);` +
  `color:var(--rot);font-size:var(--s-min);font-weight:700">Entwurf, mit Niklas abzustimmen</p>`;

const mono = (s) => `<span class="mono">${s}</span>`;
const t = (i) => `t<sub>${i}</sub>`;

/** "2026-11-13T08:20:35.594Z" → "08:20:35,594" (UTC). */
const uhr = (iso) => iso.slice(11, 23).replace('.', ',');

function rechnerKurz(rechner) {
  const cpu = rechner.match(/i7-\w+/)?.[0];
  if (cpu !== 'i7-6820HQ') throw new Error(`unerwarteter Rechner: ${rechner}`);
  return 'ThinkPad P50';
}

// ---------------------------------------------------------------- Folien

/** Alle Folien in Vortragsreihenfolge: G0, J1–J15, G9, dann Reserve R1–R7. */
export function folien(daten) {
  const { b1: b, c1: c, antwort: a, auftrag: au, nutzlast: nl } = daten;
  const H = b.herkunft;
  const z = {
    netz: fmt(b.netzMs, 2),
    netzMax: fmt(b.netzMaxMs, 2),
    transport: fmt(b.transportMs, 1),
    adapter: fmt(b.adapterMs, 0),
    anteil: fmt(b.inferAnteil * 100, 2),
    jobWarm: fmt(b.jobWarmMs / 1000, 1),
    inferWarm: fmt(b.inferWarmMs / 1000, 1),
    jobKalt: fmt(b.jobKaltMs / 1000, 1),
    kaltMedian: fmt(b.kaltMedianS, 1),
    kaltMin: fmt(b.kaltSpanneS[0], 1),
    kaltMax: fmt(b.kaltSpanneS[1], 1),
    c0: fmt(b.c0DiffMs, 1),
    b0: fmt(b.b0JobMs, 1),
    request: fmt(c.requestMs.wert, 1),
    valMs: fmt(c.validierungMs.wert, 1),
    valP: fmt(c.validierungAnteilProzent.wert, 1),
    q: fmt(c.q.wert, 3),
    infer1C: fmt(c.inferenzS.wert, 1),
    kalPc: fmt(c.kalibrierungPcS.wert, 1),
    delta: fmt(c.speicherDeltaGb.wert, 3),
    nachpr: fmt(c.nachpruefungAnteilProzent.wert, 2),
    auNetz: fmt(au.netzMs, 2),
    auInfer: fmt(au.inferMs / 1000, 1),
    auJob: fmt(au.jobMs / 1000, 1),
    // Klick bis Ergebnis = Wartezeit am Client (Treiber), nicht T_job (Jobdauer am Server).
    auWarte: fmt(au.clientWaitMs / 1000, 1),
    auS: fmt(Math.round(au.clientWaitMs / 1000)),
    auHost: fmt(au.hostReturnMs),
    auInferRund: fmt(Math.round(au.inferMs / 1000)),
    kaltAnteilMin: fmt(b.kaltAnteilSpanne[0] * 100, 2),
    kaltAnteilMax: fmt(b.kaltAnteilSpanne[1] * 100, 2),
    transportAnteil: fmt(b.transportAnteil * 100, 2),
    speicher1B: fmt(b.speicherMaxGb, 2),
  };
  const fw = Object.fromEntries(Object.entries(FESTWERTE).map(([k, v]) => [k, fmt(v.wert)]));
  const n = b.anzahl;
  const nWarm = b.nWarm;

  // Quellen mit Rechner und Commit je Gruppe
  const q1B = `${LAUF_1B} · ${rechnerKurz(H.hauptlauf.rechner)} · ${H.hauptlauf.commit.slice(0, 8)}`;
  const q1BN = `evidenz/1B/2026-11-13-lauf.md, Nachtrag · ${rechnerKurz(H.nachtrag.rechner)} · ${H.nachtrag.commit.slice(0, 8)}`;
  const q1C = (...keys) => {
    const gruppen = new Map();
    for (const k of keys) {
      const e = c[k];
      const schluessel = `${e.quelle} · ${e.rechner} · ${e.commit}`;
      gruppen.set(schluessel, true);
    }
    return [...gruppen.keys()].join('; ');
  };
  const qNutzlast = `${nl.datei}, runs[${nl.lauf}] · Laptop (${rechnerKurz(nl.cpu)}) · ${nl.commit} (def56700)`;
  const qAntwort = `${ANTWORT} (Auftrag ${a.auftrag})`;
  // Messstand: Architektur nach Release 1.3 (ADR-0035), gemessen auf Fork-main mit Version 1.4.0.
  const STAND = `Fork-main, Version 1.4.0 (${H.hauptlauf.commit.slice(0, 8)})`;
  const kasten = (titel, punkte, linie) =>
    `<div style="border:var(--linie-min) solid ${linie};border-radius:10px;padding:10px 18px 4px">` +
    `<p style="margin:0 0 4px;font-weight:700;font-size:24px">${titel}</p>` +
    `<ul style="margin:0;padding-left:26px;font-size:22px;line-height:1.3">` +
    punkte.map((p) => `<li style="margin:0 0 4px">${p}</li>`).join('') +
    '</ul></div>';

  const F = [];

  // ------------------------------------------------------------ G0 Rahmen (Entwurf)
  F.push({
    id: 'G0',
    teil: 'rahmen',
    auftrag: null,
    titel: 'Thema 1: KI-Inferenz im Moderationskompass',
    inhalt: flaeche(
      entwurf +
        `<p style="margin:0 0 30px;font-size:30px;color:var(--text-2)">„Wie wirksam trennt die Architektur von Release 1.3 Anwendung, Kontextaufbau und private Inferenz unter realer Last, und welche Betriebsgrenzen ergeben sich für den Moderationskompass?“</p>` +
        // Systembild
        `<div style="display:grid;grid-template-columns:250px 60px 470px 60px 470px;align-items:stretch;font-size:26px;margin-bottom:34px">` +
        `<div style="border:var(--linie-min) solid var(--linie);border-radius:10px;padding:16px">Lehrperson<br><span style="color:var(--gedaempft);font-size:var(--s-min)">Browser</span></div>` +
        `<div style="align-self:center;text-align:center;color:var(--blau);font-weight:800">→</div>` +
        `<div style="border:var(--linie-min) solid var(--blau);border-radius:10px;padding:16px;background:var(--raster)"><b>app-host</b><br>App, Kontextaufbau, Queue, Adapter<br><span style="font-size:var(--s-min)"><span class="etikett" style="background:var(--raster);color:var(--blau)">1A</span> ${etikett('1C')}</span></div>` +
        `<div style="align-self:center;text-align:center;color:var(--blau);font-weight:800">→</div>` +
        `<div style="border:var(--linie-min) solid var(--blau);border-radius:10px;padding:16px;background:var(--raster)"><b>llm-host</b><br>private Runtime mit Modell<br><span style="font-size:var(--s-min)">${etikett('1B')}</span></div>` +
        `</div>` +
        // wer macht was
        `<div style="display:grid;grid-template-columns:repeat(3,1fr);column-gap:40px;font-size:26px">` +
        `<div><b>1A · Niklas</b><br>Ressourcen auf dem App-Host</div>` +
        `<div><b>1B · Jonas, dann Niklas</b><br>Zweiter Host: Aufbau und Zeit (Jonas), Störung und Aufwand (Niklas)</div>` +
        `<div><b>1C · Jonas</b><br>Kontext und Adapterpfad</div>` +
        `</div>`,
    ),
    notiz:
      'Entwurf für Niklas und mich. Unser Thema ist die KI-Inferenz für den Moderationskompass. Die Leitfrage: Wie wirksam trennt die Architektur von Release 1.3 Anwendung, Kontextaufbau und private Inferenz unter realer Last? Reale Last haben wir nicht erzeugt, unsere Läufe sind sequenziell; das ist eine Grenze. Niklas beginnt mit dem App-Host, ich verfolge dann einen echten Auftrag über beide Hosts, und Niklas schließt mit Störungen und dem Aufwand der zweiten Serverrolle.',
    zeitS: 30,
    kurzfassung: false,
    quelle:
      'Prüfungsdokument Abschnitt 4.3 (Thema 1, Aufträge 1A–1C); 01-aufteilung.md; Design Abschnitt 3',
    station: null,
  });

  // ------------------------------------------------------------ J1
  F.push({
    id: 'J1',
    teil: 'jonas',
    auftrag: 'beide',
    titel: `Ein Klick. ${z.auS} Sekunden. Keine Modellantwort.`,
    inhalt: flaeche(
      `<p style="margin:0 0 40px;font-size:30px;color:var(--text-2)">Ein echter Auftrag der Q&amp;A-Zusammenfassung, verfolgt vom Klick der Lehrperson bis zum Ergebnis.</p>` +
        `<div style="display:grid;grid-template-columns:1fr 1fr;column-gap:60px;font-size:32px;line-height:1.35">` +
        `<div style="border-left:6px solid var(--petrol);padding-left:24px">${etikett('1C')}<p style="margin:14px 0 0">Hält der Kontextpfad seine Zusagen zu Vertrag, Konsistenz und Entkopplung ein?</p></div>` +
        `<div style="border-left:6px solid var(--bernstein);padding-left:24px">${etikett('1B')} <span style="font-size:var(--s-min);color:var(--gedaempft)">Schritte 1–2</span><p style="margin:14px 0 0">Wo steckt die Zeit, wenn die Inferenz auf einem zweiten Host läuft?</p></div>` +
        `</div>` +
        `<p class="mono" style="position:absolute;left:0;bottom:84px;margin:0;font-size:var(--s-min);color:var(--gedaempft)">Auftrag Nr. ${au.nr}: Klick bis Ergebnis ${z.auWarte} s, Jobdauer T_job ${z.auJob} s · Median warm, n = ${nWarm}: ${z.jobWarm} s</p>` +
        `<p style="position:absolute;left:0;bottom:44px;margin:0;font-size:var(--s-min);color:var(--gedaempft)">Architektur nach Release 1.3 (ADR-0035, zweiter Host); gemessen auf ${STAND} und in 1C auf ${mono('def56700')}</p>` +
        `<p style="position:absolute;left:0;bottom:0;margin:0;font-size:26px;font-weight:600">Jonas Weirauch</p>`,
    ),
    notiz: `Ein Klick der Lehrperson, ${z.auS} Sekunden Warten, und am Ende steht keine Modellantwort auf dem Bildschirm. Dieser Auftrag ist echt, die Nummer ${au.nr} aus meinem gewerteten Lauf. Davon rechnet der Server ${z.auJob} Sekunden am Job, der Rest ist der Host-Aufruf und das Nachfragen. Zum Vergleich: Warme Aufträge brauchen im Median ${z.jobWarm} Sekunden. Die Architektur folgt Release 1.3, gemessen habe ich aber den aktuellen Stand, Version 1.4.0. Das wird beim Gate wichtig. Zwei Fragen: Für 1C, hält der Kontextpfad seine Zusagen? Für 1B, Schritte 1 und 2, wo steckt die Zeit auf einem zweiten Host? Petrol ist 1C, Bernstein ist 1B.`,
    zeitS: 40,
    kurzfassung: true,
    quelle: `${q1B} (Auftrag ${au.nr}: treiber.auftraege clientWaitMs, zerlegung.auftraege jobMs); Version: package.json und git describe (v1.4.0-255); Leitfragen: Prüfungsdokument 4.3, ADR 1B-011`,
    station: null,
  });

  // ------------------------------------------------------------ J2
  const host = (name, ip, zeilen) =>
    `<div style="border:var(--linie-min) solid var(--bernstein);border-radius:10px;padding:12px 20px;background:var(--bernstein-hell);margin-bottom:12px">` +
    `<div style="font-weight:700;font-size:26px">${name} <span class="mono" style="font-weight:400;font-size:var(--s-min);color:var(--text-2)">${ip}</span></div>` +
    `<div style="font-size:22px;color:var(--text-2);line-height:1.3">${zeilen}</div></div>`;
  F.push({
    id: 'J2',
    teil: 'jonas',
    auftrag: '1B',
    titel: 'Zwei Hosts nach Release 1.3, gemessen auf 1.4.0',
    inhalt: flaeche(
      frage('Lässt sich das Zwei-Host-Release nachbauen, ohne Produktionscode zu ändern?', '1B') +
        zweiSpalten(
          liste(
            [
              `Aufbau von null mit einem Befehl: ${mono('labor.sh up')}, alle automatischen Prüfungen grün`,
              'Privates Netz, Firewall lässt die Runtime nur vom app-host zu, dazu ein Token; Speicherlimits wie im Release, Modell per SHA-256 gepinnt',
            ],
            24,
          ) +
            kasten(
              'Abweichungen und Grenzen',
              [
                `${fw.laborCpus} statt ${fw.releaseCpus} CPUs und Threads; zwei VMs teilen sich einen Laptop`,
                `Timeout ${fw.laborTimeout1BS} s statt ${fw.releaseTimeoutS} s nach Kalibrierung (I = ${fw.kalibrierung1BS} s)`,
                'Images selbst gebaut (Release-Images nicht öffentlich); Start ohne Wrapper, weil Runbook §6 ihn bricht',
                'Summary-Schalter eingeschaltet (ab Werk aus); Hintergrunddienste vor dem gewerteten Lauf von Hand abgeschaltet',
                `Code: ${STAND}`,
              ],
              'var(--bernstein)',
            ),
          host(
            'app-host',
            '192.168.150.10',
            'App mit App-Adapter, PostgreSQL, Redis; Encoder nicht gestartet (ab Werk aus)',
          ) +
            `<div style="text-align:center;font-size:22px;color:var(--bernstein-text);margin:-4px 0 8px">privates Netz, nur app-host → llm-host</div>` +
            host(
              'llm-host',
              '192.168.150.20',
              'LLM-Server llama-server, Qwen3-4B Q4_K_M, ein Slot',
            ),
          800,
        ),
    ),
    notiz: `Bevor man misst, muss das System stehen. Schritt 1 von 1B verlangt, das Zwei-Host-Deployment nachzubauen, so wie Release 1.3 es mit ADR-0035 beschreibt. Ich habe zwei virtuelle Maschinen auf meinem Laptop aufgebaut. Auf dem app-host laufen die App mit dem Adapter, Datenbank und Redis; der Encoder für die Wortwolke bleibt aus, wie ab Werk. Auf dem llm-host läuft der LLM-Server mit dem gepinnten Modell. Die Firewall lässt die Runtime nur vom app-host zu, dazu kommt ein Token. Gemessen habe ich den aktuellen Code, Version 1.4.0. Die Abweichungen stehen offen im Kasten: 4 statt 8 CPUs, weil der Laptop nicht mehr hat. Der Timeout liegt bei ${fw.laborTimeout1BS} statt ${fw.releaseTimeoutS} Sekunden, weil schon die Kalibrierung ${fw.kalibrierung1BS} Sekunden dauerte; mit dem Release-Wert wäre jeder Auftrag abgebrochen. Die Images habe ich selbst gebaut, gestartet ohne den Wrapper, weil der nach dem Runbook nicht läuft. Und vor dem gewerteten Lauf habe ich Hintergrunddienste von Hand abgeschaltet.`,
    zeitS: 70,
    kurzfassung: false,
    quelle: `${daten.aufbau.datei} · ${rechnerKurz(H.hauptlauf.rechner)} · ${daten.aufbau.commit}; Abweichungen: evidenz/1B/2026-11-12-aufbau.md (Komponenten, Befund 2, Abweichungen), evidenz/1B/2026-11-13-lauf.md (Kalibrierung, Versuch 3), ADR 1B-001, 1B-002, 1B-005, 1B-010`,
    station: null,
  });

  // ------------------------------------------------------------ J3
  F.push({
    id: 'J3',
    teil: 'jonas',
    auftrag: 'beide',
    titel: 'Der Weg eines Auftrags',
    inhalt: wegSvg({ aktiv: 'klick', b1: b, c1: c, auftrag: au }),
    notiz: `Hier ist die Karte für den Rest des Vortrags. Oben der app-host, unten der llm-host. Der Auftrag startet links mit dem Klick, der Kontext wird gebaut, geht über das Netz zur Inferenz, kommt zurück, wird nachgeprüft und landet am Gate. An Klick und Inferenz stehen die Werte unseres Auftrags ${au.nr}: Der Host-Aufruf kehrt nach ${z.auHost} Millisekunden zurück, die Inferenz dauert ${z.auInferRund} Sekunden. Die Werte an Kontext und Nachprüfung stammen aus 1C, gemessen auf einem Rechner ohne zweiten Host; das steht klein unter jedem Wert. Der Punkt wandert jetzt von Station zu Station mit.`,
    zeitS: 40,
    kurzfassung: true,
    quelle: `${q1B} (Auftrag ${au.nr}: hostReturnMs, inferMs); 1C-Werte: Nachlauf, Laptop (ThinkPad P50) · def56700, und Teil 2, Laptop · 248029dc (Test-Runtime)`,
    station: 'klick',
  });

  // ------------------------------------------------------------ J4
  const schritt = (nr, titel, text, farbe) =>
    `<div style="border-top:6px solid ${farbe};padding-top:10px">` +
    `<div style="font-weight:700;font-size:26px;margin:0 0 6px"><span class="messwert" style="color:${farbe}">${nr}</span> ${titel}</div>` +
    `<div style="font-size:22px;color:var(--text-2);line-height:1.3">${text}</div></div>`;
  const hzeile = (h, was, schwelle) =>
    `<tr style="border-top:var(--linie-min) solid var(--linie)"><td style="padding:6px 10px 6px 0">${h}</td><td>${was}</td><td class="mono">${schwelle}</td></tr>`;
  F.push({
    id: 'J4',
    teil: 'jonas',
    auftrag: 'beide',
    titel: 'Erst die Hypothese, dann die Messung',
    inhalt: flaeche(
      `<div style="display:grid;grid-template-columns:repeat(3,1fr);column-gap:36px;margin-bottom:22px">` +
        schritt(
          'A',
          'Vorab festgelegt',
          'Hypothesen, Schwellen und Regeln vor jedem Lauf, vom Autor freigegeben. Offengelegte Ausnahmen: T3.1 exploratorisch, M7b/c nach Sichtung, Timeout-Empfehlung (nicht umgesetzt) erst nach dem Lauf.',
          'var(--blau)',
        ) +
        schritt(
          'B',
          'Ohne Modell geprüft',
          `${etikett('1C')} Tests mit Test-Runtime und Negativproben: Ein absichtlich eingebauter Fehler muss den Test rot machen.`,
          'var(--petrol)',
        ) +
        schritt(
          'C',
          'Im Labor gemessen',
          `${etikett('1C')} Nachlauf mit echter Runtime. ${etikett('1B')} gewerteter Lauf über zwei Hosts, n = ${n}.`,
          'var(--bernstein)',
        ) +
        `</div>` +
        `<div style="display:grid;grid-template-columns:1fr 1fr;column-gap:36px">` +
        kasten(
          `${etikett('1C')} Abweichungen und Grenzen im Labor`,
          [
            'ein Rechner, Runtime über Loopback, kein zweiter Host; Image lokal gebaut, Messproxy davor',
            `Laborlimits ${fw.laborCpus1C} CPUs, ${fw.laborSpeicher1CGiB} GiB (Release: ${fw.releaseCpus} CPUs, ${fw.prodSpeicherGiB} GiB)`,
            `Timeout ${fw.laborTimeoutS} s statt ${fw.releaseTimeoutS} s (Kalibrierung am Laptop ${fw.kalibrierungLaptopS} s); Nebenlast im Nachlauf`,
          ],
          'var(--petrol)',
        ) +
        `<table style="border-collapse:collapse;font-size:22px;width:100%;align-self:start">` +
        `<tr style="color:var(--gedaempft);text-align:left"><th style="padding:4px 10px 4px 0">${etikett('1B')} Hypothese</th><th>Messgröße</th><th>Schwelle vorab</th></tr>` +
        hzeile(
          'H_B1',
          'Netz je Auftrag',
          `Median ≤ ${fw.schwelleNetzMs} ms, Max. ≤ ${fw.schwelleNetzMaxMs} ms`,
        ) +
        hzeile('H_B2', 'Adapter je Auftrag', `Median ≤ ${fw.schwelleAdapterS} s`) +
        hzeile('H_B3', 'Inferenzanteil', `Median ≥ ${fw.schwelleInferenzProzent} %`) +
        `</table></div>` +
        beleg('ADR 1C-002, 1C-003, 1C-020, 1C-021, 1B-008; Nachlauf, Umgebung und Abweichungen'),
    ),
    notiz: `Wie komme ich zu belastbaren Aussagen? Mit einer festen Reihenfolge. Erstens standen Hypothesen und Schwellen fest, bevor gemessen wurde. Für 1B: Das Netz darf im Median höchstens ${fw.schwelleNetzMs} Millisekunden kosten, der Adapter höchstens ${fw.schwelleAdapterS} Sekunden, und die Inferenz muss mindestens ${fw.schwelleInferenzProzent} Prozent ausmachen. Ausnahmen davon nenne ich offen, etwa den Blitzlicht-Befund, den ich explorativ gefunden habe. Zweitens habe ich in 1C zuerst ohne Modell getestet, mit Negativproben: Ein absichtlicher Fehler muss den Test rot machen. Drittens das Labor. Für 1C heißt das: ein Rechner, die Runtime über Loopback, kleinere Limits als im Release und ein Timeout von ${fw.laborTimeoutS} Sekunden. Einen zweiten Host hatte 1C nicht; den liefert erst 1B.`,
    zeitS: 60,
    kurzfassung: false,
    quelle: `adr/1B-008-kernaussagen-und-schwellen.md; adr/1C-003-teststrategie-modellfrei.md; ${q1B}; Nachlauf 1C (Umgebung, Abweichungen): Laptop (ThinkPad P50) · def56700; ADR 1C-021 (Produktionslimits)`,
    station: null,
  });

  // ------------------------------------------------------------ J5
  F.push({
    id: 'J5',
    teil: 'jonas',
    auftrag: '1C',
    titel: 'Der Host wartet nicht auf das Modell',
    inhalt: flaeche(
      frage('Blockiert ein langsames Modell die Lehrperson?', '1C') +
        zweiSpalten(
          liste([
            `${mono('requestSummary')} baut den Kontext, legt den Auftrag in die Queue und kehrt mit ${mono('pending')} zurück`,
            'Die Queue rechnet danach im Hintergrund, ein Slot, ein Auftrag nach dem anderen',
            '<b>Grenze:</b> Auf den Kontextaufbau wartet der Host doch, er läuft im Aufruf selbst',
          ]),
          zahl({
            wert: z.request,
            einheit: 'ms',
            was: 'Host-Aufruf, Median',
            gruppe: 'Laptop · def56700',
            linie: 'var(--petrol)',
          }) +
            zahl({
              wert: z.infer1C,
              einheit: 's',
              was: 'Inferenz, Median',
              gruppe: 'Laptop · def56700',
              linie: 'var(--petrol)',
            }),
          760,
        ) +
        beleg('ADR 1C-012, Test E5, Nachlauf N3'),
    ),
    notiz: `Erste Station, der Klick. Die Frage aus 1C lautet: Blockiert ein langsames Modell die Lehrperson? Der Mechanismus ist eine Queue. Der Host-Aufruf baut den Kontext, legt den Auftrag ab und kehrt sofort mit dem Status pending zurück. Gerechnet wird danach im Hintergrund, mit einem Slot. Gemessen am Laptop dauert der Host-Aufruf im Median ${z.request} Millisekunden, die Inferenz dagegen ${z.infer1C} Sekunden. Der Host ist also vom Modell entkoppelt. Eine Grenze bleibt: Auf den Kontextaufbau wartet er doch, denn der passiert im Aufruf selbst. Belegt ist das mit dem Test E5 und dem Laborfall N3.`,
    zeitS: 45,
    kurzfassung: true,
    quelle: q1C('requestMs', 'inferenzS'),
    station: 'klick',
  });

  // ------------------------------------------------------------ J6
  const artefakt = (name, zeilen, linie) =>
    `<pre data-artefakt="${name}" class="mono" style="margin:0;padding:14px 20px;background:var(--raster);border-left:6px solid ${linie};font-size:var(--s-min);line-height:1.35;white-space:pre-wrap;overflow-wrap:anywhere">${zeilen.map(esc).join('\n')}</pre>`;
  F.push({
    id: 'J6',
    teil: 'jonas',
    auftrag: '1C',
    titel: 'Was die Vorschau zeigt, kommt an',
    inhalt: flaeche(
      frage('Bekommt die Runtime genau das, was die Lehrperson in der Vorschau sieht?', '1C') +
        zweiSpalten(
          liste(
            [
              'Kontext aus dem App-Zustand, gegen Schemas geprüft, gepackt',
              `Vorschau = Nutzlast: Hash ${mono(nl.hashVorschau.slice(0, 8))}, Nachricht byte-gleich`,
              'Nur mit gültigem Host-Token; Token und Budget bleiben auf dem Server',
            ],
            24,
          ),
          zahl({
            wert: z.valMs,
            einheit: 'ms',
            was: `Validierung = ${z.valP} % eines warmen Aufbaus`,
            gruppe: 'Laptop · 248029dc · Test-Runtime, älterer Stand',
            linie: 'var(--petrol)',
            gross: 64,
          }),
          800,
        ) +
        `<div style="position:absolute;left:0;right:0;top:292px">` +
        `<p style="margin:0 0 6px;font-size:var(--s-min);color:var(--gedaempft)">Echte Nutzlast an die Runtime, Ausschnitt (synthetische Referenzfixture, erster Messlauf des Nachlaufs)</p>` +
        artefakt('nutzlast', ['{…', ...nl.zeilen, '…}'], 'var(--petrol)') +
        `</div>` +
        beleg('ADR 1C-013 (Nachlauf N1), ADR 1C-011 (Validierung), 1C-diagrams (#456-Bereiche)'),
    ),
    notiz: `Zweite Station, der Kontext. Die Frage: Bekommt die Runtime genau das, was die Lehrperson in der Vorschau sieht? Der Kontext entsteht aus dem App-Zustand, wird gegen versionierte Schemas geprüft und dann gepackt. Vorschau und Auftrag gibt es nur mit gültigem Host-Token, und jeder Kontextaufbau prüft die Rechte erneut, acht Prüfungen je Aufbau. Unten steht ein echter Ausschnitt der Nutzlast aus dem Nachlauf, mit synthetischen Daten: die Vertragsversion, ein abgeschalteter Bereich mit seinem Grund und eine Frage aus der Fixture. Vorschau und Nutzlast tragen denselben Hash, die Nachricht an die Runtime ist byte-gleich mit der Vorschau. Was kostet die strikte Validierung? ${z.valMs} Millisekunden, ${z.valP} Prozent eines warmen Kontextaufbaus, gemessen mit der Test-Runtime auf einem älteren Stand. Deshalb bleibt sie. Welcher Bereich woher kommt, zeigt die Reserve.`,
    zeitS: 65,
    kurzfassung: true,
    quelle: `${qNutzlast}; ${q1C('validierungMs')}; Berechtigung: routers/qa.ts, 1C-diagrams.md · def56700`,
    station: 'kontext',
  });

  // ------------------------------------------------------------ J7
  const qBreite = Math.round(c.q.wert * 1000) / 10;
  F.push({
    id: 'J7',
    teil: 'jonas',
    auftrag: '1C',
    titel: 'Sicher geschätzt, aber Platz verschenkt',
    inhalt: flaeche(
      frage('Wie viel vom Kontextfenster nutzt der Kontext wirklich?', '1C') +
        liste(
          [
            'Das Budget zählt jedes UTF-8-Byte als ein Token. Das Fenster läuft so nie über.',
            'Echte Tokens laut Runtime sind nur ein Bruchteil davon: Rund zwei Drittel des geschätzten Budgets bleiben ungenutzt.',
          ],
          26,
        ) +
        `<div style="margin:26px 0 8px;display:flex;align-items:baseline;gap:24px">` +
        `<span class="messwert" style="font-size:72px">q = ${z.q}</span>` +
        `<span style="font-size:26px">echte / geschätzte Tokens, Median</span>` +
        `<span class="mono" style="font-size:var(--s-min);color:var(--gedaempft)">Laptop · def56700</span></div>` +
        `<div role="img" aria-label="Balken: echte Tokens als Anteil der Schätzung" style="position:relative;height:40px;border:var(--linie-min) solid var(--petrol);border-radius:6px;background:var(--grund)">` +
        `<div style="position:absolute;left:0;top:0;bottom:0;width:${qBreite}%;background:var(--petrol)"></div>` +
        `<span style="position:absolute;right:14px;top:4px;font-size:var(--s-min);color:var(--text-2)">geschätzt = ganzes Budget</span></div>` +
        `<p style="margin:22px 0 6px;font-size:var(--s-min);color:var(--gedaempft)">Dieselbe Nutzlast meldet zugleich, wörtlich:</p>` +
        artefakt('budget', [nl.budgetZeile], 'var(--petrol)') +
        beleg(
          'ADR 1C-014 (empfohlen: genauere Zählung prüfen, nicht umgesetzt), Nachlauf N2, Issue #17',
        ),
    ),
    notiz: `Zur Frage nach den Kosten der Kontextbereitstellung. Das Budget schätzt Tokens über Bytes: Jedes Byte zählt als ein Token. Das ist sicher, denn ein Token umfasst mindestens ein Byte, und so läuft das Fenster nie über. Aber es ist teuer. Die echten Tokens sind im Median nur das ${z.q}-fache der Schätzung. Rund zwei Drittel des geschätzten Budgets bleiben also ungenutzt. Und derselbe Kontext meldet gleichzeitig, dass eine Frage aus Budgetgründen weggelassen wurde. Ich empfehle, eine genauere Zählung zu prüfen. Umgesetzt ist das nicht.`,
    zeitS: 45,
    kurzfassung: false,
    quelle: `${q1C('q')}; Meldung: ${qNutzlast}`,
    station: 'kontext',
  });

  // ------------------------------------------------------------ J8
  const draht =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 380" width="640" height="380" role="img" aria-label="Messpunkte t0 bis t3 am app-host und am llm-host">` +
    `<line x1="110" y1="50" x2="110" y2="370" style="stroke:var(--blau);stroke-width:4"/>` +
    `<line x1="520" y1="50" x2="520" y2="370" style="stroke:var(--bernstein);stroke-width:4"/>` +
    `<text x="110" y="34" text-anchor="middle" style="font:700 26px var(--f-text);fill:var(--tinte)">app-host</text>` +
    `<text x="520" y="34" text-anchor="middle" style="font:700 26px var(--f-text);fill:var(--tinte)">llm-host</text>` +
    `<line x1="110" y1="80" x2="510" y2="120" style="stroke:var(--tinte);stroke-width:3"/>` +
    `<path d="M510,120 l-16,-9 l2,16 z" style="fill:var(--tinte)"/>` +
    `<rect x="508" y="130" width="24" height="170" rx="4" style="fill:var(--bernstein)"/>` +
    `<text x="548" y="222" style="font:600 24px var(--f-text);fill:var(--bernstein-text)">Inferenz</text>` +
    `<line x1="520" y1="310" x2="120" y2="350" style="stroke:var(--tinte);stroke-width:3"/>` +
    `<path d="M120,350 l16,-11 l1,16 z" style="fill:var(--tinte)"/>` +
    [
      [110, 80, 0, 'end'],
      [520, 120, 1, 'start'],
      [520, 310, 2, 'start'],
      [110, 350, 3, 'end'],
    ]
      .map(
        ([x, y, i, anker]) =>
          `<circle cx="${x}" cy="${y}" r="9" style="fill:var(--bernstein)"/>` +
          `<text x="${anker === 'end' ? x - 20 : x + 20}" y="${y + 9}" text-anchor="${anker}" style="font:600 28px var(--f-mono);fill:var(--bernstein-text)">t<tspan font-size="22" baseline-shift="-6">${i}</tspan></text>`,
      )
      .join('') +
    `</svg>`;
  F.push({
    id: 'J8',
    teil: 'jonas',
    auftrag: '1B',
    titel: 'Gemessen am Draht, auf beiden Hosts',
    inhalt: flaeche(
      frage('Wie trennt man Netz und Inferenz, ohne Produktionscode zu ändern?', '1B') +
        `<div style="display:grid;grid-template-columns:640px 1fr;column-gap:60px">` +
        `<div>${draht}</div><div>` +
        `<p style="margin:0 0 10px;font-size:24px">Mitschnitt auf beiden Hosts, dazu die ${mono('timings')} der Runtime. Jede Differenz kommt von einer Uhr, ein Uhrenabgleich ist nicht nötig.</p>` +
        `<p class="mono" style="margin:0 0 12px;font-size:28px;font-weight:600">Netz = (${t(3)} − ${t(0)}) − (${t(2)} − ${t(1)})</p>` +
        `<div style="border-left:6px solid var(--bernstein);padding-left:20px;font-size:24px;line-height:1.45">` +
        `<div style="font-weight:700">Unser Auftrag (Nr. ${au.nr})</div>` +
        `<div class="mono">Klick&nbsp;&nbsp;&nbsp;${uhr(au.requestedAt)} UTC</div>` +
        `<div class="mono">Fertig&nbsp;&nbsp;${uhr(au.finishedAt)} UTC</div>` +
        `<div class="mono">Netz ${z.auNetz} ms · Inferenz ${z.auInfer} s</div>` +
        `<div style="font-size:22px;line-height:1.3;margin-top:4px">Wartezeit am Client ${z.auWarte} s, T_job ${z.auJob} s: dazu Host-Aufruf und Nachfragen im Sekundentakt</div></div>` +
        `<p class="mono" style="margin:8px 0 0;font-size:var(--s-min);color:var(--gedaempft)">Alle ${n}, Median: Netz ${z.netz} ms, Transport ${z.transport} ms; Auflösung ≈ ${fw.netzAufloesungMs} ms</p>` +
        `</div></div>` +
        beleg('ADR 1B-006 (Methode), ADR 1B-011 (Zeitbegriffe), Laufprotokoll 1B'),
    ),
    notiz: `Jetzt geht der Auftrag über die Grenze zum zweiten Host. Die Frage aus 1B: Wie trenne ich Netz und Inferenz, ohne den Produktionscode anzufassen? Ich schneide auf beiden Hosts den Verkehr mit. Am app-host sehe ich t null, die Anfrage geht raus, und t drei, die Antwort ist zurück. Am llm-host sehe ich t eins und t zwei. Jede Differenz stammt von einer einzigen Uhr, deshalb muss ich die Uhren nicht abgleichen. Netz ist die Zeit am app-host minus die Zeit am llm-host. Für unseren Auftrag Nummer ${au.nr}, geklickt um ${uhr(au.requestedAt)} Weltzeit, sind das ${z.auNetz} Millisekunden, also unter der Messauflösung von etwa einer Millisekunde. Über alle ${n} Aufträge liegt der Median bei ${z.netz} Millisekunden. Die Lehrperson wartet ${z.auWarte} Sekunden, der Server rechnet ${z.auJob}: Dazwischen liegen der Host-Aufruf und das Nachfragen im Sekundentakt.`,
    zeitS: 50,
    kurzfassung: false,
    quelle: `${q1B} (Auftrag ${au.nr}: treiber.auftraege, zerlegung.auftraege)`,
    station: 'netz',
  });

  // ------------------------------------------------------------ J9
  F.push({
    id: 'J9',
    teil: 'jonas',
    auftrag: '1B',
    titel: 'Die Zeit steckt in der Inferenz',
    inhalt: zeitzerlegungSvg(b) + etikettOben('1B'),
    notiz: `So sieht die ganze Zerlegung aus. Die Achse ist logarithmisch, jeder Strich ist zehnmal mehr. Das Netz kostet im Median ${z.netz} Millisekunden, die Schwelle lag bei ${fw.schwelleNetzMs}. Der Transport mit dem Serveranteil kostet ${z.transport} Millisekunden, der Adapter in der App ${z.adapter} Millisekunden, bei einer Schwelle von ${fw.schwelleAdapterS} Sekunden. Und dann die Inferenz: ${z.inferWarm} Sekunden im warmen Median über ${nWarm} Aufträge, ein Anteil von ${z.anteil} Prozent. Der Transport ist damit rund ${z.transportAnteil} Prozent der Auftragszeit. Warm heißt hier: ein identischer Snapshot, der Prompt kam fast ganz aus dem Cache. Ändert sich der Zustand, gilt eher der Kaltwert, im Median ${z.kaltMedian} Sekunden. Alle drei Hypothesen sind erfüllt, auch kalt. Die zweite Serverrolle kostet keine relevante Zeit.`,
    zeitS: 50,
    kurzfassung: true,
    quelle: `${q1B}; Kalt: ${q1BN}`,
    station: 'inferenz',
  });

  // ------------------------------------------------------------ J10
  F.push({
    id: 'J10',
    teil: 'jonas',
    auftrag: '1B',
    titel: 'Wäre der Auftrag ein Fußballfeld …',
    inhalt: fussballfeldSvg(b, { zoom: 1 }) + etikettOben('1B'),
    notiz:
      'Damit man sich das vorstellen kann: Wäre der Median eines warmen Auftrags so lang wie ein Fußballfeld, dann nähme die Inferenz praktisch das ganze Feld ein. Der Transport wäre gut ein Zentimeter, und darin steckt das Netz mit einem Drittel Millimeter, dünner als die Kreidelinie am Tor. Der Adapter in der App käme mit gut sieben Zentimetern dazu. Am Netz zu optimieren lohnt sich also nicht.',
    zeitS: 25,
    kurzfassung: true,
    quelle: `${q1B}; Maßstab: T_job warm (n = ${nWarm}), Netz und Transport Median über alle ${n}`,
    station: 'inferenz',
  });

  // ------------------------------------------------------------ J11
  const maxS = Math.max(c.kalibrierungPcS.wert, c.inferenzS.wert, FESTWERTE.releaseTimeoutS.wert);
  const xS = (s) => Math.round((s / maxS) * 520 * 10) / 10;
  const xT = xS(FESTWERTE.releaseTimeoutS.wert);
  const balken = (y, s, label, gruppe) =>
    `<text x="0" y="${y - 14}" style="font:400 24px var(--f-text);fill:var(--tinte)">${label} <tspan style="font:400 22px var(--f-mono);fill:var(--gedaempft)">${gruppe}</tspan></text>` +
    `<rect x="0" y="${y}" width="${xS(s)}" height="44" rx="4" style="fill:var(--petrol)"/>` +
    `<text x="${xS(s) + 12}" y="${y + 31}" style="font:600 26px var(--f-mono);fill:var(--tinte)">${fmt(s, 1)} s</text>` +
    `<line x1="${xT}" y1="${y - 6}" x2="${xT}" y2="${y + 50}" style="stroke:var(--rot);stroke-width:4"/>`;
  const timeoutSvg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 250" width="680" height="250" role="img" aria-label="Inferenzzeiten gegen den Release-Timeout">` +
    balken(44, c.kalibrierungPcS.wert, 'Kalibrierung', 'PC · 9f230abc') +
    balken(154, c.inferenzS.wert, 'Inferenz, Median', 'Laptop · def56700, Nebenlast') +
    `<line x1="${xT}" y1="204" x2="${xT}" y2="222" style="stroke:var(--rot);stroke-width:4"/>` +
    `<text x="${xT}" y="246" text-anchor="middle" style="font:700 24px var(--f-text);fill:var(--rot)">Release-Timeout ${fw.releaseTimeoutS} s</text>` +
    `</svg>`;
  F.push({
    id: 'J11',
    teil: 'jonas',
    auftrag: '1C',
    titel: 'Betrieb: Timeout zu kurz, Speicher läuft voll',
    inhalt: flaeche(
      frage('Reicht die Konfiguration ab Werk für Inferenz auf der CPU?', '1C') +
        `<div style="display:grid;grid-template-columns:680px 1fr;column-gap:60px">` +
        `<div>${timeoutSvg}<p style="margin:10px 0 0;font-size:24px">Mit ${fw.releaseTimeoutS} s wäre der Modellpfad auf beiden Laborrechnern nicht nutzbar. Verschiedene Stände und Lasten: kein reiner Rechnervergleich.</p></div>` +
        `<div>` +
        zahl({
          wert: `+${z.delta}`,
          einheit: 'GB',
          was: 'Prompt-Cache je Auftrag bei wechselnden Prompts, Median',
          gruppe: 'Laptop · def56700',
          linie: 'var(--petrol)',
          gross: 64,
        }) +
        `<p style="margin:0 0 10px;font-size:24px;line-height:1.3">OOM-Kill im <b class="messwert">${c.oomAuftrag.wert}.</b> Auftrag am Laborlimit ${fw.laborSpeicher1CGiB} GiB + ${fw.laborSpeicher1CGiB} GiB Swap (Laptop · def56700).</p>` +
        `<p style="margin:0;font-size:24px;line-height:1.3">Mit Produktionslimits ${fw.prodSpeicherGiB} GiB + ${fw.prodSwapGiB} GiB Swap: Kill im ${c.oomAuftrag9f230abc.wert}. Auftrag (PC · 9f230abc).</p>` +
        `</div></div>` +
        beleg(
          'ADR 1C-021, 1C-023 und 1C-024: empfohlen (Timeout am Inferenz-Host kalibrieren, Cache begrenzen), nicht umgesetzt; Issues #16, #14',
        ),
    ),
    notiz: `Zurück zu 1C, zum Betrieb. Zwei Befunde, mit denen das Release so nicht rechnet. Erstens der Timeout: Ab Werk bricht die App nach ${fw.releaseTimeoutS} Sekunden ab. Am PC dauerte schon die Kalibrierungsanfrage ${z.kalPc} Sekunden, am Laptop braucht die Inferenz im Median ${z.infer1C} Sekunden, mit Nebenlast und auf einem anderen Stand. Mit dem Release-Timeout wäre der Modellpfad auf beiden nicht nutzbar. Zweitens der Speicher: Bei wechselnden Prompts wächst der Prompt-Cache je Auftrag um ${z.delta} Gigabyte im Median. Am Laborlimit endet die Runtime im ${c.oomAuftrag.wert}. Auftrag, mit Produktionslimits am PC im ${c.oomAuftrag9f230abc.wert}. Im 1B-Lauf blieb der Speicher dagegen bei ${z.speicher1B} Gigabyte, weil der Prompt jedes Mal gleich war. Ich empfehle, den Timeout am Inferenz-Host zu kalibrieren und den Cache zu begrenzen. Umgesetzt ist beides nicht.`,
    zeitS: 55,
    kurzfassung: true,
    quelle: `ADR 1C-020, 1C-024 · PC (i7-8700) · 9f230abc; Nachlauf N3, N6 · Laptop (ThinkPad P50) · def56700; 1B-Speicher: ${q1B}`,
    station: 'inferenz',
  });

  // ------------------------------------------------------------ J12
  F.push({
    id: 'J12',
    teil: 'jonas',
    auftrag: '1C',
    titel: 'Die Nachprüfung kostet fast nichts',
    inhalt: flaeche(
      frage('Was, wenn sich die Daten ändern, während das Modell rechnet?', '1C') +
        zweiSpalten(
          liste(
            [
              `Nach der Inferenz wird der Kontext noch einmal gebaut und sein Hash verglichen. Stimme oder gelöschte Quelle: Antwort verworfen, ${mono('source_changed')} (E7, E8)`,
              `<b>Befund:</b> Läuft eine Blitzlicht-Runde eines anderen Typs als ${mono('TEMPO')}, hängt der Hash von der Uhrzeit ab. Im Labor endete ${mono('YESNO')} ${c.yesno.wert} als ${mono('source_changed')} ohne Datenänderung, ${mono('TEMPO')} nicht.`,
            ],
            24,
          ),
          zahl({
            wert: z.nachpr,
            einheit: '%',
            was: 'Anteil der Nachprüfung am Auftrag',
            gruppe: 'Laptop · def56700',
            linie: 'var(--petrol)',
          }) +
            `<p style="margin:0;font-size:24px;color:var(--text-2);line-height:1.3">Regel vorab: unter ${fw.schwelleNachpruefungProzent} % bleibt sie. Hauptgrund ist aber das Risiko ohne sie: Veraltete Ergebnisse gälten als gültig (V1, E8).</p>`,
          760,
        ) +
        beleg(
          'ADR 1C-010 (Nachprüfung bleibt), ADR 1C-016 (Blitzlicht: empfohlen, nicht umgesetzt; Issue #18), Nachlauf N3, N5; Teil 2 E7, E8',
        ),
    ),
    notiz: `Nächste Station, nach der Inferenz. Die Frage: Was passiert, wenn sich die Daten ändern, während das Modell rechnet? Der Kontext wird nach der Inferenz noch einmal gebaut und sein Hash mit dem vom Anfang verglichen. Ändert sich eine Stimme oder wird eine Quelle gelöscht, wird die Antwort als source_changed verworfen; das zeigen die Tests E7 und E8. Das kostet am Laptop ${z.nachpr} Prozent eines Auftrags. Entscheidend ist aber das Risiko ohne Nachprüfung: Dann gälten veraltete Ergebnisse als gültig. Deshalb bleibt sie. Dazu ein Befund: Läuft gerade eine Blitzlicht-Runde eines anderen Typs als TEMPO, hängt der Hash von der Uhrzeit ab, und jede Modellantwort dieser Runde wird verworfen. Im Labor endete YESNO ${c.yesno.wert} als source_changed, ohne Datenänderung; bei TEMPO nicht. Ich empfehle, das zu beheben. Umgesetzt ist es nicht.`,
    zeitS: 55,
    kurzfassung: false,
    quelle: `${q1C('nachpruefungAnteilProzent', 'yesno')}; E7, E8: evidenz/1C/2026-10-24-teil2.md · Laptop · 248029dc (Test-Runtime)`,
    station: 'nachpruefung',
  });

  // ------------------------------------------------------------ J13
  const aussagen = a.ausgabe.split('\n');
  const gekuerzt = [...aussagen.slice(0, 2), '[…]'];
  F.push({
    id: 'J13',
    teil: 'jonas',
    auftrag: 'beide',
    titel: 'Auf 1.4.0 verwirft das Gate jede Modellantwort',
    inhalt: flaeche(
      `<div style="display:grid;grid-template-columns:820px 1fr;column-gap:50px">` +
        `<div>` +
        `<p style="margin:0 0 8px;font-size:var(--s-min);color:var(--gedaempft)">Echte Antwort des Modells auf Auftrag ${a.auftrag}, gekürzt, im Original</p>` +
        `<blockquote data-artefakt="antwort" lang="en" style="margin:0 0 14px;padding:12px 20px;border-left:6px solid var(--bernstein);background:var(--bernstein-hell);font-size:24px;line-height:1.3">` +
        gekuerzt.map((s) => `<p style="margin:0 0 6px">${esc(s)}</p>`).join('') +
        `</blockquote>` +
        `<div style="border:var(--linie-min) solid var(--rot);border-radius:8px;padding:10px 18px;margin-bottom:14px">` +
        `<span class="ablehnung" style="font-weight:800;font-size:28px">Verworfen.</span> ` +
        `<span style="font-size:24px">${esc(a.grund)}</span></div>` +
        `<div style="display:grid;grid-template-columns:1fr 1fr;column-gap:30px;font-size:22px;line-height:1.3">` +
        `<div>${etikett('1B')} <span class="messwert" style="font-size:34px">${b.verworfen} von ${n}</span><br>verworfen (Version 1.4.0)</div>` +
        `<div>${etikett('1C')} <span class="messwert" style="font-size:34px">${c.gateAntworten.wert}</span><br>bestehen (${mono('def56700')}, Version 1.4.0)</div>` +
        `</div>` +
        `</div>` +
        `<figure data-clip="jonas-gate-clip.webm" style="margin:0;display:flex;flex-direction:column">` +
        `<div style="flex:none;height:210px;border:var(--linie-min) dashed var(--linie);border-radius:8px;background:var(--raster);display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;font-size:24px;color:var(--gedaempft)">Platz für den Clip:<br>Lehrenden-Sicht, Klick, Warten, Ersatzzusammenfassung</div>` +
        `<figcaption style="margin-top:12px;font-size:22px;line-height:1.3">Die Lehrperson sieht eine extraktive Ersatzzusammenfassung mit dem allgemeinen Hinweis „Eine ausführliche Zusammenfassung war diesmal nicht möglich …“. Den Grund erfährt sie nicht.</figcaption>` +
        `<p style="margin:12px 0 0;padding:8px 14px;background:var(--raster);font-size:22px;line-height:1.3"><b>Vor dem Gate</b> (${mono('9f230abc')}): ${c.fullContextVorGate.wert} Aufträge mit Modellzusammenfassung (1C).</p>` +
        `</figure></div>` +
        beleg(
          'ADR 1C-018 (empfohlen: Instruktion, Grammatik und Gate abstimmen, nicht umgesetzt; Issue #13), ADR 1C-019, Laufprotokoll 1B, Befund',
        ),
    ),
    notiz: `Und jetzt das Gate. Hier scheitert unser Auftrag. Links steht die echte Antwort des Modells, gekürzt, im Original. Das Gate prüft vor allem die Form: mindestens zwei Aussagen, jede mit einem Stichwort und Doppelpunkt vorn, verschiedene Stichwörter, vollständige Sätze, keine Metasätze aus einer kurzen Liste. Sprache und Thema prüft es nicht. Diese Antwort scheitert an der Form, keine Aussage hat ein Stichwort. Inhaltlich passt sie aber auch nicht: Sie ist englisch und fasst Moderationszustände zusammen. Im 1B-Lauf wurden ${b.verworfen} von ${n} Antworten verworfen, im 1C-Nachlauf bestand keine, ${c.gateAntworten.wert}. Wichtig: Das Gate kam erst mit Version 1.4.0. Auf dem Stand vor dem Gate, mit älterer Instruktion, endeten in 1C ${c.fullContextVorGate.wert} Aufträgen mit Modellzusammenfassung. Ein Upgrade hat das Ergebnis gekippt. Falls der Clip läuft: Rechts sehen Sie Klick, Warten und die Ersatzzusammenfassung mit dem Hinweiskasten. Sonst: Die Lehrperson sieht nur den allgemeinen Hinweis, eine ausführliche Zusammenfassung sei nicht möglich gewesen, den Grund nicht. Meine Empfehlung: Instruktion, Grammatik und Gate gemeinsam abstimmen. Umgesetzt ist das nicht.`,
    zeitS: 75,
    kurzfassung: true,
    quelle: `${qAntwort}; ${q1B}; Nachlauf · Laptop · def56700; ADR 1C-018 · Laptop · 9f230abc; Hinweis: qaSummaryExtractive.ts; Gate seit v1.4.0 (12f1d8e4)`,
    station: 'gate',
  });

  // ------------------------------------------------------------ J14
  const zeile = (was, sichtbar, ok) =>
    `<tr style="border-top:var(--linie-min) solid var(--linie)"><td style="padding:10px 16px 10px 0">${was}</td>` +
    `<td style="padding:10px 0;${ok ? '' : 'color:var(--rot);font-weight:600'}">${sichtbar}</td></tr>`;
  F.push({
    id: 'J14',
    teil: 'jonas',
    auftrag: '1B',
    titel: 'Was der Betrieb nicht sieht',
    inhalt: flaeche(
      frage('Was davon steht im Log der App?', '1B') +
        zweiSpalten(
          `<table style="border-collapse:collapse;font-size:26px;width:100%">` +
            zeile('Auftrag gesamt', `ja, ${mono('latencyMs')}`, true) +
            zeile('Inferenz', 'nein, die App liest die Zeiten nicht aus', false) +
            zeile('Netz und Adapter', 'nein, nur mit Mitschnitt', false) +
            zeile('Warum das Gate ablehnt', `nein, nur grob ${mono('invalid_response')}`, false) +
            `</table>`,
          zahl({
            wert: z.anteil,
            einheit: '%',
            was: 'der Zeit für eine Antwort, die verworfen wird',
            gruppe: `Inferenzanteil, Median, alle ${n}`,
            linie: 'var(--bernstein)',
            gross: 72,
          }),
          820,
        ) +
        beleg(
          'Laufprotokoll 1B, Befund C; empfohlen: Zeiten und Grund des Fallbacks ohne Prompttext loggen, nicht umgesetzt; Issues #19, #20',
        ),
    ),
    notiz: `Was hätte der Betrieb davon bemerkt? Fast nichts. Die App schreibt nur die Gesamtzeit eines Auftrags ins Log. Inferenz, Netz und Adapter sieht man nur mit einem Mitschnitt. Und warum das Gate eine Antwort verwirft, steht nirgends, nur der grobe Grund invalid_response. Damit gehen ${z.anteil} Prozent der Zeit in ein Ergebnis, das nicht ankommt, und niemand sieht es. Ich empfehle, Zeiten und den Grund eines Fallbacks ohne Prompttext zu loggen. Das steht in #19 und #20, umgesetzt ist es nicht.`,
    zeitS: 40,
    kurzfassung: false,
    quelle: `evidenz/1B/2026-11-13-lauf.md, Befund C; ${q1B}`,
    station: null,
  });

  // ------------------------------------------------------------ J15
  const folge = (was, text) =>
    `<li style="margin:0 0 4px"><b>${was}</b> <span style="color:var(--text-2)">${text}</span></li>`;
  F.push({
    id: 'J15',
    teil: 'jonas',
    auftrag: 'beide',
    titel: 'Entscheidung und Fragen',
    inhalt: flaeche(
      `<div style="display:grid;grid-template-columns:880px 1fr;column-gap:36px;font-size:22px;line-height:1.28">` +
        `<div style="border-left:6px solid var(--petrol);padding-left:16px">${etikett('1C')} <span style="color:var(--gedaempft)">Kosten, Risiko, Betrieb; Änderungen empfohlen, nicht umgesetzt</span>` +
        `<ul style="margin:6px 0 0;padding-left:22px">` +
        folge('Bleibt (1C-010 bis 1C-013):', 'Kosten unverändert, kein neues Risiko') +
        folge(
          'Gate (1C-018):',
          'Abnahmemessung nötig; Risiko: lockere Schwelle zeigt Metaaussagen',
        ) +
        folge('Timeout (1C-023):', 'eine Kalibrierung je Host; Slot länger belegt') +
        folge('Cache (1C-024):', 'eine Zeile im Entry-Point; sonst Betrieb mit OOM-Neustarts') +
        folge('Zählung (1C-014):', 'Änderung am Packer; Risiko: Fenster läuft über') +
        folge('Snapshot, Blitzlicht (1C-015, 1C-016):', 'kleine Änderung; Rückweg Revert') +
        `</ul></div>` +
        `<div style="border-left:6px solid var(--bernstein);padding-left:16px">${etikett('1B')}` +
        `<ul style="margin:6px 0 0;padding-left:22px">` +
        folge('Topologie bleibt:', 'Hebel am Inferenz-Host') +
        folge('Logs (#19, #20):', 'Kosten: Logzeilen; empfohlen, nicht umgesetzt') +
        folge('Vorher:', 'Gate passend zum Modell (#13)') +
        `</ul></div>` +
        `</div>` +
        `<p style="margin:16px 0 4px;font-weight:700;font-size:24px;color:var(--blau)">Zur Diskussion</p>` +
        `<ol style="margin:0;padding-left:34px;font-size:24px;line-height:1.3">` +
        `<li>Seit 1.4.0 keine Modellantwort mehr, vorher ${c.fullContextVorGate.wert}. Das Gate prüft die Form, inhaltlich sind die Antworten auch verfehlt: Prüft es das Richtige?</li>` +
        `<li>Wer legt den Timeout fest: das Release oder der Betreiber am Inferenz-Host?</li>` +
        `<li>Reicht ein privates Netz mit Token über HTTP als Schutz für die zweite Rolle?</li>` +
        `</ol>` +
        `<p style="position:absolute;left:0;right:0;bottom:0;margin:0;font-size:26px;font-weight:700">Und wenn der zweite Host langsam ist oder ausfällt? <span style="color:var(--blau)">→ Niklas</span></p>`,
    ),
    notiz: `Meine Entscheidung. Für 1C bleiben Nachprüfung, strikte Validierung, Entkopplung und die Gleichheit von Vorschau und Nutzlast; die Kosten bleiben, ein neues Risiko entsteht nicht. Zu ändern empfehle ich Gate, Timeout, Prompt-Cache, Byte-Schätzung, Themen-Snapshot und Blitzlicht-Hash. Jede Empfehlung hat ihren Preis: Das Gate braucht eine Abnahmemessung, ein längerer Timeout belegt den Slot länger. Umgesetzt ist nichts. Für 1B: Die Topologie kostet keine relevante Zeit, der Hebel liegt am Inferenz-Host. Vorher muss aber das Gate zum Modell passen. Drei Fragen würde ich gern diskutieren, die erste zum Upgrade auf 1.4.0. Und damit an Niklas: Was passiert, wenn der zweite Host ausfällt?`,
    zeitS: 50,
    kurzfassung: true,
    quelle: `1C-ergebnis.md, Abschnitt 5, ADRs 1C-010 bis 1C-024, Abschnitt Folgen (Laptop und PC · 9f230abc; Laptop · def56700); 1B-ergebnis.md, Entscheidung (${rechnerKurz(H.hauptlauf.rechner)} · ${H.hauptlauf.commit.slice(0, 8)})`,
    station: null,
  });

  // ------------------------------------------------------------ G9 Rahmen (Entwurf)
  F.push({
    id: 'G9',
    teil: 'rahmen',
    auftrag: null,
    titel: 'Kurzfazit Thema 1',
    inhalt: flaeche(
      entwurf +
        `<div style="display:grid;grid-template-columns:repeat(3,1fr);column-gap:40px;font-size:26px;line-height:1.4;padding-top:60px">` +
        `<div style="border-top:6px solid var(--blau);padding-top:14px"><b>1A App-Host</b><p style="margin:8px 0 0;color:var(--gedaempft)">[Niklas]</p></div>` +
        `<div style="border-top:6px solid var(--bernstein);padding-top:14px"><b>1B Zweiter Host</b><p style="margin:8px 0 0">Die Trennung kostet keine relevante Zeit; die Zeit steckt in der Inferenz.</p><p style="margin:8px 0 0;color:var(--gedaempft)">[Niklas: Störung und Aufwand]</p></div>` +
        `<div style="border-top:6px solid var(--petrol);padding-top:14px"><b>1C Kontextpfad</b><p style="margin:8px 0 0">Vertrag, Konsistenz und Entkopplung halten. Auf 1.4.0 verwirft das Gate jede Modellantwort; davor (${mono('9f230abc')}) ${c.fullContextVorGate.wert} mit Modellzusammenfassung.</p></div>` +
        `</div>` +
        `<p style="position:absolute;left:0;right:0;bottom:0;margin:0;font-size:28px;font-weight:600">Gemeinsam: [Satz zur Leitfrage von Thema 1, mit Niklas]</p>`,
    ),
    notiz:
      'Entwurf für das gemeinsame Kurzfazit, mit Niklas abzustimmen: je Auftrag ein Satz, dann ein gemeinsamer Satz zur Leitfrage.',
    zeitS: 30,
    kurzfassung: false,
    quelle: '1B-ergebnis.md, 1C-ergebnis.md (Kurzantwort, Verlauf 9f230abc); 1A von Niklas',
    station: null,
  });

  // ------------------------------------------------------------ Reserve
  const reserve = (id, auftrag, titel, inhalt, notiz, quelle) =>
    F.push({
      id,
      teil: 'reserve',
      auftrag,
      titel,
      inhalt: flaeche(inhalt),
      notiz,
      zeitS: 0,
      kurzfassung: false,
      quelle,
      station: null,
    });

  reserve(
    'R1',
    '1C',
    'Reserve: Kalibrierung des Timeouts',
    frage('Warum liefen die Labore mit 300 s statt 90 s?', '1C') +
      zweiSpalten(
        liste(
          [
            `Je Rechner eine Anfrage mit echtem Body, I = ${mono('prompt_ms')} + ${mono('predicted_ms')}`,
            `${etikett('1C')} Laptop: ${fw.kalibrierungLaptopS} s (Prefill ${fw.kalibrierungLaptopPrefillS} s, Ausgabe ${fw.kalibrierungLaptopAusgabeS} s), daher ${fw.laborTimeoutS} s für die Laborläufe am Laptop`,
            `${etikett('1C')} PC, zweiter Rechner: I = ${z.kalPc} s, ebenfalls über ${fw.releaseTimeoutS} s, also ${fw.laborTimeoutS} s`,
            `${etikett('1B')} I = ${fw.kalibrierung1BS} s, nach der Regel aus ADR 1B-005 ebenfalls ${fw.laborTimeout1BS} s`,
            `Release ab Werk ${fw.releaseTimeoutS} s; ${fw.laborTimeoutS} s ist die Obergrenze des Produkts, offen als Abweichung`,
          ],
          24,
        ),
        zahl({
          wert: fw.kalibrierungLaptopS,
          einheit: 's',
          was: 'Kalibrierung Laptop (1C)',
          gruppe: 'Laptop · Wandzeit, vor dem ersten Laborlauf',
          linie: 'var(--petrol)',
        }),
        820,
      ) +
      beleg('ADR 1C-020 (Laptop und PC), ADR 1C-023, ADR 1B-005; Laufprotokoll 1B, Kalibrierung'),
    `Falls gefragt wird, warum ich nicht mit ${fw.releaseTimeoutS} Sekunden gemessen habe: Am Laptop dauerte die Kalibrierungsanfrage für 1C ${fw.kalibrierungLaptopS} Sekunden. Deshalb liefen die Laborläufe am Laptop mit ${fw.laborTimeoutS} Sekunden, der Obergrenze des Produkts, offen als Abweichung markiert. Der PC war mit ${z.kalPc} Sekunden schneller, lag aber ebenfalls über ${fw.releaseTimeoutS}. In 1B ergab die Kalibrierung ${fw.kalibrierung1BS} Sekunden, also auch dort ${fw.laborTimeout1BS}.`,
    `adr/1C-020-timeout-300-s-und-kalibrierungsregel.md (Laptop; PC · 9f230abc); evidenz/1B/2026-11-13-lauf.md, Kalibrierung (ThinkPad P50 · 3b2aa5e6)`,
  );

  reserve(
    'R2',
    '1B',
    'Reserve: Kontrolle C0, Strecke gegen lokal',
    frage('Ist die Strecke zwischen den Hosts langsamer als ein Aufruf im selben Host?', '1B') +
      zweiSpalten(
        liste([
          'Dieselbe kurze Anfrage einmal vom app-host und einmal vom llm-host an sich selbst',
          'Verglichen werden die Mediane beider Seiten',
          `Schwelle vorab: Differenz ≤ ${fw.schwelleC0Ms} ms, erfüllt`,
        ]),
        zahl({
          wert: z.c0,
          einheit: 'ms',
          was: 'Differenz der Mediane',
          gruppe: `Nachtrag · ${H.nachtrag.commit.slice(0, 8)}`,
          linie: 'var(--bernstein)',
        }),
        760,
      ) +
      beleg('Laufprotokoll 1B, Nachtrag M2; ADR 1B-011 (zwei Kontrollen namens C0)'),
    `Die Kontrolle C0 vergleicht dieselbe kurze Anfrage über die Strecke und lokal. Die Differenz der Mediane ist ${z.c0} Millisekunden, also im Rauschen. Die Strecke zwischen den Hosts kostet praktisch nichts.`,
    q1BN,
  );

  reserve(
    'R3',
    '1B',
    'Reserve: Ausfall B0',
    frage('Was passiert, wenn die zweite Rolle fehlt?', '1B') +
      zweiSpalten(
        liste([
          `Alle ${b.nB0} Aufträge enden extraktiv mit Grund ${mono('unavailable')}`,
          `Schwelle vorab: Median ≤ ${fw.schwelleB0S} s, erfüllt`,
          'Störung und Ausfall vertieft Niklas in den Schritten 3–4',
        ]),
        zahl({
          wert: z.b0,
          einheit: 'ms',
          was: 'T_job, Median',
          gruppe: `Nachtrag · ${H.nachtrag.commit.slice(0, 8)}`,
          linie: 'var(--bernstein)',
        }),
        760,
      ) +
      beleg('Laufprotokoll 1B, Nachtrag M3'),
    `Fehlt die Runtime, fällt die App ohne Wartezeit auf die extraktive Zusammenfassung zurück, im Median nach ${z.b0} Millisekunden. Den Ausfall untersucht Niklas genauer.`,
    q1BN,
  );

  reserve(
    'R4',
    '1B',
    `Reserve: Kaltläufe, n = ${b.nKaltLaeufe}`,
    frage('Gilt die Aussage auch mit frisch gestarteter Runtime?', '1B') +
      zweiSpalten(
        liste([
          `${b.nKaltLaeufe} Läufe mit je frischer Runtime: Median ${z.kaltMedian} s, Spanne ${z.kaltMin}–${z.kaltMax} s`,
          `Kalter erster Auftrag im gewerteten Lauf: ${z.jobKalt} s`,
          `Zum Vergleich warm: ${z.jobWarm} s (Median warm, n = ${nWarm})`,
          `H_B3 gilt auch kalt in allen ${b.nKaltLaeufe} Läufen (≥ ${fw.schwelleInferenzProzent} %)`,
        ]),
        zahl({
          wert: z.kaltMedian,
          einheit: 's',
          was: 'T_job kalt, Median',
          gruppe: `n = ${b.nKaltLaeufe} · ${H.nachtrag.commit.slice(0, 8)}`,
          linie: 'var(--bernstein)',
        }),
        760,
      ) +
      beleg('Laufprotokoll 1B, Nachtrag M4; ADR 1B-011 (Gruppen kalt und warm)'),
    `Kalt und warm sind getrennte Gruppen. Mit frischer Runtime dauert ein Auftrag im Median ${z.kaltMedian} Sekunden, warm ${z.jobWarm} Sekunden. Der Inferenzanteil bleibt in beiden Fällen über der Schwelle.`,
    `${q1BN}; warm und Auftrag 1: ${q1B}`,
  );

  reserve(
    'R5',
    'beide',
    'Reserve: Gültigkeitsgrenzen',
    `<div style="display:grid;grid-template-columns:1fr 1fr;column-gap:50px">` +
      `<div>${etikett('1C')}${liste(
        [
          'Laborrechner mit CPU-Inferenz, ein Slot, Qwen3-4B Q4_K_M; ein Rechner über Loopback',
          'Eine synthetische Fixture, Locale de',
          'Nachlauf auf upstream nur am Laptop, mit Nebenlast',
          'Ein formal korrekter Pfad belegt keine guten Prompts',
          'Keine parallele Last: Aufträge nacheinander, die Leitfrage nennt „reale Last“',
        ],
        22,
      )}</div>` +
      `<div>${etikett('1B')}${liste(
        [
          'Ein Laptop für beide „Hosts“, die Kerne teilen sich',
          'Virtuelles statt physisches Netz, weniger CPUs als in Produktion',
          'Ein Szenario, ein Modell, eine Reihe',
          `Warm heißt: identische Snapshots, der Prompt kommt aus dem KV-Cache. Bei geändertem Zustand gilt eher der Kaltwert (Median ${z.kaltMedian} s)`,
          `Netz unter der Messauflösung (≈ ${fw.netzAufloesungMs} ms)`,
          'Privates Netz belegt weder Autorisierung noch Datenschutz; der Token läuft im Klartext über HTTP',
        ],
        22,
      )}</div></div>` +
      beleg(
        'Labor-Design 1C, Abschnitt 7; Nachlauf, Gültigkeitsgrenzen; Laufprotokoll 1B, Ergebnis je Auftrag und Beobachtungen; ADR 1B-011',
      ),
    `Was die Zahlen nicht sagen: Sie gelten für Laborrechner, ein Modell und eine synthetische Fixture, ohne parallele Last. Warm heißt in 1B: derselbe Snapshot, der Prompt kam aus dem Cache; ändert sich der Zustand, gilt eher der Kaltwert von ${z.kaltMedian} Sekunden. Inferenzzeiten sind nicht auf den Produktionshost übertragbar, und ein privates Netz ist noch kein Datenschutz.`,
    `evidenz/1C/2026-11-09-labor-nachlauf.md (Laptop · def56700); evidenz/1B/2026-11-13-lauf.md (${rechnerKurz(H.hauptlauf.rechner)} · ${H.hauptlauf.commit.slice(0, 8)}); Kaltwert: ${q1BN}`,
  );

  reserve(
    'R6',
    'beide',
    'Reserve: Anteil der KI',
    `<div style="display:grid;grid-template-columns:1fr 1fr;column-gap:50px">` +
      `<div><p style="margin:0 0 12px;font-weight:700;font-size:28px">Entschieden und geprüft vom Autor</p>${liste(
        [
          'Leitfragen, Hypothesen und Schwellen freigegeben, bevor gemessen wurde',
          'Läufe angestoßen, Wiederholung nach Störung entschieden',
          'Ergebnisse und Protokolle geprüft, Kernzahlen stichprobenartig nachgerechnet',
        ],
        26,
      )}</div>` +
      `<div><p style="margin:0 0 12px;font-weight:700;font-size:28px">Entworfen von der KI</p>${liste(
        [
          'Claude Code mit Claude Opus 5.5: Skripte, Tests, Auswertung, Protokolle, Diagramme',
          'Vorschläge für Schwellen und Messmethode, im Design als KI-Vorschlag markiert',
          'Reviews waren KI-Sitzungen, keine menschlichen Gutachten',
        ],
        26,
      )}</div></div>` +
      beleg('1C-eigenanteil.md, 1B-eigenanteil.md'),
    'Zur KI-Nutzung: Die KI hat Skripte, Tests, Auswertungen und Texte entworfen. Fragen, Hypothesen und Schwellen habe ich vor jeder Messung freigegeben, die Läufe gesteuert und die Ergebnisse geprüft. Wer was gemacht hat, steht je Artefakt in den Eigenanteil-Dateien.',
    '1C-eigenanteil.md; 1B-eigenanteil.md (Stand 2026-11-14) · Arbeit an Laptop (ThinkPad P50) und PC (i7-8700) · Baselines 9f230abc, def56700, a19ca70f',
  );

  const adrs = (ids) =>
    ids.map((i) => `<span class="mono" style="white-space:nowrap">${i}</span>`).join(', ');
  reserve(
    'R7',
    '1C',
    'Reserve: ADR-Zählung 1C',
    `<table style="border-collapse:collapse;font-size:26px;width:100%">` +
      `<tr><td style="padding:12px 20px 12px 0;font-weight:700;width:300px">Beibehaltung</td><td>${adrs(['1C-010', '1C-011', '1C-012', '1C-013'])}; dazu ${mono('1C-019')} nur für ${mono('9f230abc')}</td></tr>` +
      `<tr style="border-top:var(--linie-min) solid var(--linie)"><td style="padding:12px 20px 12px 0;font-weight:700">Empfohlen, nicht umgesetzt</td><td>${adrs(['1C-014', '1C-015', '1C-016', '1C-018', '1C-023', '1C-024'])}</td></tr>` +
      `<tr style="border-top:var(--linie-min) solid var(--linie)"><td style="padding:12px 20px 12px 0;font-weight:700">Zurückgehalten</td><td>${adrs(['1C-017'])}</td></tr>` +
      `<tr style="border-top:var(--linie-min) solid var(--linie)"><td style="padding:12px 20px 12px 0;font-weight:700">Methodisch</td><td>${adrs(['1C-001', '1C-002', '1C-003', '1C-004', '1C-005', '1C-020', '1C-021', '1C-022', '1C-025', '1C-026'])}</td></tr>` +
      `</table>` +
      `<p style="margin:24px 0 0;font-size:26px">Das Ergebnis ist eine Empfehlung, kein Patch (ADR 1C-004).</p>` +
      beleg('adr/README.md, Index; 1C-ergebnis.md, Abschnitt 5'),
    'Die Zählung der Entscheidungen in 1C nach Status. Keine Empfehlung ist umgesetzt, das verlangt der Auftrag so: Ergebnis ist eine begründete Empfehlung, kein Patch.',
    'adr/README.md, Index · Messstände 9f230abc (Laptop und PC) und def56700 (Laptop)',
  );

  const bz = (bereich, quelleFn, schema, pruefung) =>
    `<tr style="border-top:var(--linie-min) solid var(--linie)"><td style="padding:6px 12px 6px 0;font-weight:600">${bereich}</td>` +
    `<td style="padding:6px 12px 6px 0">${quelleFn}</td><td style="padding:6px 12px 6px 0">${schema}</td><td style="padding:6px 0">${pruefung}</td></tr>`;
  reserve(
    'R8',
    '1C',
    'Reserve: 1C Schritt 1, Autorisierung',
    `<table style="border-collapse:collapse;font-size:22px;line-height:1.25;width:100%">` +
      `<tr style="color:var(--gedaempft);text-align:left"><th style="padding:0 12px 6px 0">Bereich (#456)</th><th>Quelle, Funktion</th><th>Schemafassung</th><th>Rechteprüfung</th></tr>` +
      bz(
        'Q&amp;A-Fragen, Stimmen',
        `PostgreSQL, ${mono('collectQaContextCandidates')}`,
        mono('qa-ranking-v1'),
        mono('loadAuthorizedModerationState'),
      ) +
      bz(
        'Semantische Themen',
        `Redis-Snapshot, ${mono('collectQaTopicContext')}`,
        mono('qa-semantic-topic-snapshot-v1'),
        'im Q&amp;A-Aufbau',
      ) +
      bz(
        'Quiz, Blitzlicht, Kompass',
        'PostgreSQL, Redis; Lehrsignale',
        `${mono('effective-vote-v1')}, ${mono('feedback-v1')}`,
        'Prüfungen der Lehrsignale',
      ) +
      bz(
        'Lernziele',
        `PostgreSQL, ${mono('projectLearningContext')}`,
        mono('learning-context-v1'),
        mono('assertLearningSnapshotStillCurrent'),
      ) +
      bz(
        'Zusammensetzung',
        mono('buildModerationPromptContext'),
        mono('moderation-analysis-context-v1'),
        'erste Prüfung',
      ) +
      bz(
        'Vorschau, Auftrag',
        `${mono('qa.summaryContextPreview')}, ${mono('qa.requestSummary')}`,
        mono('qa-summary-context-preview-v1'),
        mono('assertHostSessionAccessFromContext'),
      ) +
      `</table>` +
      `<p style="margin:12px 0 0;font-size:22px">Je Kontextaufbau acht Rechteprüfungen; ohne gültiges Host-Token weder Vorschau noch Auftrag; kein Token im Draht-Body (E2).</p>` +
      beleg(
        '1C-diagrams.md, #456-Bereiche (Stand def56700) und Belege je Station; apps/backend/src/routers/qa.ts',
      ),
    'Falls nach Schritt 1 gefragt wird: Jeder Bereich aus #456 hat eine Datenquelle, eine Funktion, eine Schemafassung und eine Rechteprüfung. Vorschau und Auftrag prüfen zuerst das Host-Token, danach prüft jeder Kontextaufbau die Rechte erneut. Die Tabelle mit Zeilennummern steht in der Diagrammdoku zu 1C.',
    '1C-diagrams.md, #456-Bereiche · Code-Stand def56700 (Laptop, ThinkPad P50)',
  );

  reserve(
    'R9',
    '1C',
    'Reserve: 1C Schritte 3–4, Konsistenzfälle',
    `<div style="display:grid;grid-template-columns:1fr 1fr;column-gap:44px">` +
      `<div><p style="margin:0 0 8px;font-weight:700;font-size:26px">Schritt 3</p>${liste(
        [
          'Inkompatible Version: endet an jeder Grenze kontrolliert (T1, E4)',
          `Fehlender Bereich: bleibt mit Zustand und Grund (T2.1 ${mono('disabled')}, T2.2 ${mono('failed')})`,
          'Langsamer oder fehlender Empfänger, belegter Slot, volle Queue: E6a, E6b, E10, E11',
          'Stiller Feldverlust, zwei Ausnahmen: fremde Snapshot-Version gilt als „keine Daten“ (T2.3); Bereich bleibt „available“, aber aus Budgetgründen leer (E15)',
        ],
        22,
      )}</div>` +
      `<div><p style="margin:0 0 8px;font-weight:700;font-size:26px">Schritt 4</p>${liste(
        [
          `Stimme oder gelöschte Quelle nach dem Auftrag: ${mono('source_changed')} (T5, E7, E8); ohne Änderung gültig (E9)`,
          `Stimme während des Kontextaufbaus: ${mono('CONFLICT')} (E12)`,
          `Legacy-Pfad kontrolliert (E13, E14); Runtime fehlt: extraktiv mit ${mono('unavailable')} (E6a)`,
          'Häufigkeit unter Voting nicht belastbar vorhergesagt (M7)',
        ],
        22,
      )}</div></div>` +
      beleg(
        '1C-ergebnis.md, Abschnitt 3; Tests T1–T5, Teil 2 und Teil 3 (Test-Runtime); ADR 1C-005, 1C-010, 1C-011, 1C-015, 1C-017',
      ),
    'Falls nach den Schritten 3 und 4 gefragt wird: Inkompatible Versionen und fehlende Bereiche enden kontrolliert, mit Zustand und Grund. Stiller Feldverlust kommt an zwei Stellen vor: bei einem Themen-Snapshot fremder Version und bei Bereichen, die aus Budgetgründen leer bleiben. Echte Änderungen nach dem Auftrag erkennt die Nachprüfung, eine Stimme während des Aufbaus endet mit CONFLICT.',
    '1C-ergebnis.md, Abschnitt 3 · Tests und Teil 2/3 auf 248029dc (Laptop, ThinkPad P50); Labor def56700',
  );

  const rolle = (name, ort, text) =>
    `<div style="border:var(--linie-min) solid var(--bernstein);border-radius:10px;padding:12px 18px;background:var(--bernstein-hell)">` +
    `<div style="font-weight:700;font-size:26px">${name}</div><div class="mono" style="font-size:22px;color:var(--text-2)">${ort}</div>` +
    `<div style="font-size:22px;margin-top:6px;line-height:1.3">${text}</div></div>`;
  reserve(
    'R10',
    '1B',
    'Reserve: 1B Schritt 1 und ADR-0035',
    `<div style="display:grid;grid-template-columns:repeat(3,1fr);column-gap:28px;margin-bottom:24px">` +
      rolle(
        'App-Adapter',
        'app-host',
        `${mono('openWeightLlmClient.ts')}: Prompt bauen, Runtime aufrufen, Antwort prüfen, sonst extraktiv; Bearer-Token`,
      ) +
      rolle(
        'Encoder',
        'nicht gestartet',
        'Wortwolken-Encoder, Profil ab Werk aus; keine Abweichung',
      ) +
      rolle(
        'LLM-Server',
        'llm-host',
        `${mono('llama-server')}, ein Slot, lauscht nur im privaten Netz, ${mono('--api-key')}`,
      ) +
      `</div>` +
      liste(
        [
          'Abgleich Punkt für Punkt mit ADR-0035: abweichend nur der Aufbau auf einem Rechner und die CPU-Zahl, einige Punkte im Aufbau nicht prüfbar. Abnahmeprotokoll des Runbooks: abweichend Baseline-Commit statt Tag, Token ohne Passwortmanager, Summary eingeschaltet',
          `Lücke: ADR-0035 nennt für ${mono('--n-predict')} „Richtung ${fw.nPredictAdr}“, das Release setzt ${fw.nPredictRelease}. Die Antworten hatten ${fw.antwortTokensMin}–${fw.antwortTokensMax} Tokens, mit ${fw.nPredictAdr} wären sie abgeschnitten`,
        ],
        24,
      ) +
      beleg(
        'Aufbauprotokoll 1B, Komponenten und Abgleich mit ADR-0035; Laufprotokoll 1B, Manifest',
      ),
    'Falls nach Schritt 1 von 1B gefragt wird: Der Auftrag verlangt, App-Adapter, Encoder und LLM-Server zu unterscheiden. Der Adapter läuft in der App auf dem app-host, der Encoder ist ab Werk aus, der LLM-Server läuft allein auf dem llm-host. Den Aufbau habe ich Punkt für Punkt gegen ADR-0035 und das Runbook abgeglichen. Die auffälligste Lücke: ADR-0035 nennt eine kürzere Ausgabegrenze, als das Release setzt; mit ihr wären die Antworten abgeschnitten.',
    `evidenz/1B/2026-11-12-aufbau.md (Komponenten, Abgleich) · ThinkPad P50 · a19ca70f; Lücke: evidenz/1B/2026-11-13-lauf.md, Manifest · ${H.hauptlauf.commit.slice(0, 8)}`,
  );

  return F;
}
