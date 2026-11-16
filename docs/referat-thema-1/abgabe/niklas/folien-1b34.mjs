// Gerüst für Niklas' Teil 1B, Schritte 3–4 (Störung und Betriebsaufwand), im Stil des gemeinsamen Decks.
// Zahlen kommen aus daten-1b34.mjs, sobald Niklas' Ergebnis-JSONs in evidenz/1B/messung/ liegen; bis dahin
// stehen sichtbare Platzhalter ([Niklas], [Satz …], [Titel]), die abgabe-lokal.mjs vor der Abgabe meldet.
// Gliederung nach brief-1b34 (Abschnitt 5) und Prüfungsdokument, Gruppenauftrag 1B.
//
// Für Niklas: Titel als Behauptung in TITEL eintragen, Sätze in SAETZE; Zahlen nie von Hand tippen.

import { etikett, flaeche, frage, mono, zahl, zweiSpalten } from '../jonas/folien.mjs';
import { fmt } from '../jonas/zahlen.mjs';
import { kurzbeleg1A } from './literatur-1a.mjs';

/** Behauptungstitel, sobald die Ergebnisse stehen (eine Zeile, höchstens etwa 42 Zeichen). */
export const TITEL = { M1: null, M2: null, M3: null, M4: null };
/** Sätze, die nur Niklas schreiben kann (Deutung, Entscheidung). */
export const SAETZE = { M2: null, M3: null, M4: null };

const N = '[Niklas]';
const offen = (text) =>
  `<span style="color:var(--gedaempft);border-bottom:2px dashed var(--linie)">${text}</span>`;
const titel = (id, arbeitstitel) => TITEL[id] ?? `${arbeitstitel} ${offen('[Titel]')}`;
const satz = (id, hinweis) => SAETZE[id] ?? offen(`[Satz: ${hinweis}]`);
const ms = (x) => (x === null || x === undefined ? offen(N) : `${fmt(x)} ms`);

const VARIANTEN = [
  ['normal', 'Normal', 'echte Runtime'],
  ['f1', 'F1 Stopp', 'Runtime gestoppt'],
  ['f2', 'F2 DROP', 'Firewall verwirft'],
  ['l1', 'L1', '+50 ms je Antwort'],
  ['l2', 'L2', '+500 ms je Antwort'],
  ['l3', 'L3', 'Antwort nach Timeout'],
];
const AKTIONEN = [
  ['join', 'Beitritt'],
  ['vote', 'Quiz'],
  ['qaSubmit', 'Q&amp;A'],
  ['blitzlicht', 'Tempo'],
];

/** Folien M1–M4; teil 'niklas', direkt nach 1A. */
export function folien1B34(d = { vorhanden: false, laeufe: [], finde: () => undefined }) {
  const F = [];
  const quelleDaten = d.vorhanden
    ? d.laeufe.map((l) => `${l.datei} (${l.rechner ?? '?'} · ${l.commit})`).join('; ')
    : '[Niklas: Ergebnis-JSONs evidenz/1B/messung/<Datum>-lauf-<variante>-<auftrag>.json mit Rechner und Commit]';
  const fuss = d.vorhanden
    ? `Quelle: ${kurzbeleg1A('schneider2026', 'Ordner evidenz/1B').slice(1, -1)}`
    : `Quelle: ${kurzbeleg1A('schneider2026', 'Ordner evidenz/1B').slice(1, -1)} ${N}`;
  const neu = (f) =>
    F.push({
      teil: 'niklas',
      auftrag: '1B',
      kurzfassung: true,
      station: null,
      zeitS: 45,
      quelle: quelleDaten,
      fuss,
      ...f,
    });

  // ------------------------------------------------------------ M1 Störungen und Kriterien
  const zustand = (kopf, farbe, zeilen) =>
    `<div style="border-top:6px solid ${farbe};padding-top:12px">` +
    `<p style="margin:0 0 8px;font-weight:700;font-size:30px;color:${farbe}">${kopf}</p>` +
    `<ul style="margin:0;padding-left:28px;font-size:26px;line-height:1.36">${zeilen.map((z) => `<li style="margin:0 0 8px">${z}</li>`).join('')}</ul></div>`;
  neu({
    id: 'M1',
    titel: titel('M1', 'Störung am zweiten Host'),
    inhalt: flaeche(
      frage(
        'Was spüren Live-Aktionen und Kompass, wenn der llm-host langsam ist oder ausfällt?',
        '1B',
      ) +
        `<div style="display:grid;grid-template-columns:repeat(3,1fr);column-gap:44px">` +
        zustand('Normal', 'var(--blau)', ['echte Runtime, Summary und Label']) +
        zustand('Langsam', 'var(--bernstein-text)', [
          `L1/L2: Verzögerung per ${mono('tc')} ${offen(N)}`,
          `L3: Antwort nach dem Timeout ${offen(N)}`,
        ]) +
        zustand('Ausfall', 'var(--rot)', [
          'F1: Runtime gestoppt',
          `F2: Firewall verwirft ${offen(N)}`,
        ]) +
        `</div>` +
        `<p style="margin:auto 0 0;padding:16px 24px;border-left:6px solid var(--blau);background:var(--raster);font-size:28px;line-height:1.35">Vorab festgelegt: ${offen('[Niklas: Schwellen aus 1B-3u4-Planung.md, z. B. Live-p95 und Fallback-Zeit]')}</p>`,
    ),
    notiz: `[Vorlage für Niklas] Jonas hat gefragt: Was passiert, wenn der zweite Host langsam ist oder ausfällt? Ich habe die Runtime im Labor gezielt gestört: [Niklas: Störungen nennen]. Vorab festgelegt waren [Niklas: Schwellen].`,
    stichpunkte: ['[Niklas: Übergang von 1A, Störungen, vorab festgelegte Schwellen]'],
  });

  // ------------------------------------------------------------ M2 Ausfall: Fallback-Zeit
  const f1 = d.finde('f1');
  const f2 = d.finde('f2');
  const verhaeltnis =
    f1?.jobMedianMs && f2?.jobMedianMs ? fmt(f2.jobMedianMs / f1.jobMedianMs, 1) : null;
  neu({
    id: 'M2',
    titel: titel('M2', 'Ausfall: Ersatz statt Warten'),
    inhalt: flaeche(
      frage('Wie schnell kommt der Ersatz, wenn die Runtime fehlt?', '1B') +
        zweiSpalten(
          zahl({
            wert: f1 ? fmt(f1.jobMedianMs) : offen(N),
            einheit: 'ms',
            was: 'F1, Runtime gestoppt: Median Job-Zeit',
            gruppe: f1
              ? `n = ${f1.n}, Spanne ${fmt(f1.jobSpanneMs[0])}–${fmt(f1.jobSpanneMs[1])} ms · ${f1.rechner ?? ''}`
              : `n = ${N}`,
            gross: 84,
          }),
          zahl({
            wert: f2 ? fmt(f2.jobMedianMs) : offen(N),
            einheit: 'ms',
            was: 'F2, Firewall verwirft: Median Job-Zeit',
            gruppe: verhaeltnis ? `F2/F1 = ${verhaeltnis}` : `F2/F1 = ${N}`,
            linie: 'var(--rot)',
            gross: 84,
          }),
          640,
        ) +
        `<p style="margin:auto 0 0;font-size:28px;line-height:1.35">${satz('M2', 'Ein gestoppter Dienst kostet Millisekunden, ein stummer das Budget')}</p>`,
    ),
    notiz: `[Vorlage für Niklas] F1: Median ${f1 ? fmt(f1.jobMedianMs) : '[Niklas]'} Millisekunden bis zum Ersatz. F2: [Niklas]. [Satz zur Bedeutung]`,
    stichpunkte: ['[Niklas: F1 Median mit n, F2 Median, Verhältnis, Bedeutung]'],
  });

  // ------------------------------------------------------------ M3 Live-Aktionen je Variante
  const vorhandeneVarianten = VARIANTEN.filter(([v]) => d.finde(v));
  const spalten = vorhandeneVarianten.length ? vorhandeneVarianten : VARIANTEN.slice(0, 3);
  neu({
    id: 'M3',
    titel: titel('M3', 'Live-Aktionen unter Störung'),
    inhalt: flaeche(
      frage('Bleiben die Live-Aktionen auf dem App-Host stabil?', '1B') +
        `<table style="border-collapse:collapse;font-size:26px;width:100%">` +
        `<tr style="color:var(--gedaempft);font-size:var(--s-min)"><td>p95</td>${spalten.map(([, n, t]) => `<td style="text-align:right;padding:0 12px"><b>${n}</b><br>${t}</td>`).join('')}</tr>` +
        AKTIONEN.map(
          ([a, name]) =>
            `<tr style="border-top:var(--linie-min) solid var(--linie)"><td style="padding:8px 12px 8px 0;font-weight:700">${name}</td>` +
            spalten
              .map(
                ([v]) =>
                  `<td class="mono" style="padding:8px 12px;text-align:right">${ms(d.finde(v)?.live[a].p95Ms)}</td>`,
              )
              .join('') +
            `</tr>`,
        ).join('') +
        `<tr style="border-top:var(--linie-min) solid var(--linie)"><td style="padding:8px 12px 8px 0;font-weight:700">Fehler</td>${spalten.map(([v]) => `<td class="mono" style="padding:8px 12px;text-align:right">${d.finde(v) ? `${fmt(d.finde(v).liveFehler)} / ${fmt(d.finde(v).liveGeplant)}` : offen(N)}</td>`).join('')}</tr>` +
        `</table>` +
        `<p style="margin:auto 0 0;font-size:28px;line-height:1.35">${satz('M3', 'Einordnung der Abweichungen, serielle Reihen, keine Ursache belegt')}</p>`,
    ),
    notiz:
      '[Vorlage für Niklas] [Niklas: Live-p95 je Variante, Fehler, App-Host-Ressourcen; Einordnung]',
    stichpunkte: ['[Niklas: p95 je Variante, Fehlerzahl, Einordnung]'],
  });

  // ------------------------------------------------------------ M4 Aufwand gegen Gewinn
  neu({
    id: 'M4',
    titel: titel('M4', 'Lohnt sich der zweite Host?'),
    inhalt: flaeche(
      zweiSpalten(
        `<p style="margin:0 0 12px;font-weight:700;font-size:30px;color:var(--bernstein-text)">Aufwand ${etikett('1B')}</p>` +
          `<ul style="margin:0;padding-left:28px;font-size:26px;line-height:1.36">` +
          ['Zweiter Host und Deployment', 'Updates und Monitoring', 'Token-Rotation, TLS, Firewall']
            .map((p) => `<li style="margin:0 0 8px">${p}: ${offen(N)}</li>`)
            .join('') +
          `</ul>`,
        `<p style="margin:0 0 12px;font-weight:700;font-size:30px;color:var(--petrol)">Gewinn</p>` +
          `<ul style="margin:0;padding-left:28px;font-size:26px;line-height:1.36">` +
          ['Fehlerbereich getrennt (F1, F2)', 'Ressourcenbereich getrennt (App-Host)']
            .map((p) => `<li style="margin:0 0 8px">${p}: ${offen(N)}</li>`)
            .join('') +
          `</ul>`,
        640,
      ) +
        `<p style="margin:auto 0 0;padding:16px 24px;border-left:6px solid var(--blau);background:var(--raster);font-size:28px;line-height:1.35"><b style="color:var(--blau)">Entscheidung:</b> ${satz('M4', 'Architekturentscheidung mit Kosten-, Risiko- und Betriebsfolge, ADR 1B-0xx')}</p>` +
        `<p style="margin:18px 0 0;font-size:var(--s-min);color:var(--gedaempft)">Grenze: Ein privates Netz belegt weder Autorisierung noch Datenschutzkonformität.</p>`,
    ),
    notiz:
      '[Vorlage für Niklas] [Niklas: Aufwand je Punkt gegen den gemessenen Gewinn, Entscheidung mit ADR, Grenze]',
    stichpunkte: ['[Niklas: Aufwand, Gewinn, Entscheidung, Grenze]'],
  });
  return F;
}
