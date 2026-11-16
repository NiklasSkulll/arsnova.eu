// Niklas' Teil 1B, Schritte 3–4 (Störung und Betriebsaufwand), im Stil des gemeinsamen Decks: zwei Folien,
// M1 Ersatzzeit je Störung, M2 Rückwirkung auf die Live-Aktionen mit Folgerung für Schritt 4. Jede Zahl kommt
// aus daten-1b34.mjs, also aus Niklas' gewerteten Ergebnis-JSONs (evidenz/1B/messung/<Datum>-lauf-<variante>-
// summary.json, Reihen vom 15. und 16.11.2026). Fehlen sie, steht eine Platzhalterfolie mit [Niklas]; die meldet
// abgabe-lokal.mjs vor der Abgabe.
//
// Grenzen, die Folien und Notizen nennen: ein Rechner (i7-10700K, Hyper-V ohne CPU-Pinning), serielle Reihen
// ohne Randomisierung, F2/L3/Slot belegt auf Commit 2b39b9df gegen die Referenz F1 auf 5e758d0a (Produktions-
// code, Treiber und Ablauf unverändert, Versionsnachtrag in 1B-3u4-Planung.md), Schritt 4 ohne Aufwandsmessung.

import { FARBEN, esc, text } from '../jonas/grafik.mjs';
import { flaeche, frage, grafikBox, mono } from '../jonas/folien.mjs';
import { fmt } from '../jonas/zahlen.mjs';
import { huelle } from './grafik-1a.mjs';
import { kurzbeleg1A } from './literatur-1a.mjs';

const N = '[Niklas]';
const offen = (t) =>
  `<span style="color:var(--gedaempft);border-bottom:2px dashed var(--linie)">${t}</span>`;
const r2 = (n) => Math.round(n * 100) / 100;
const linie = (x1, y1, x2, y2, farbe, breite = 2, extra = '') =>
  `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" stroke="${farbe}" stroke-width="${breite}"${extra}/>`;

/** Störungen in Vortragsreihenfolge: schnelle Fehler zuerst, dann die langsamen. */
const STOERUNGEN = [
  ['f1', 'F1 Stopp', 'Container gestoppt, Verbindung abgewiesen'],
  ['busy', 'Slot belegt', 'Runtime antwortet 503'],
  ['f2', 'F2 DROP', 'Firewall verwirft, keine Antwort'],
  ['l3', 'L3 zu spät', 'Antwort erst nach der Frist'],
];
const AKTIONEN = [
  ['join', 'Beitritt'],
  ['vote', 'Quiz'],
  ['qaSubmit', 'Q&amp;A'],
  ['blitzlicht', 'Tempo'],
];

/** Aufbaustufe je Störung auf M1 (0 = von Anfang an sichtbar). */
export const STUFE_1B34 = { normal: 0, f1: 1, busy: 1, f2: 2, l3: 3 };

const dauer = (ms) => (ms < 1000 ? `${fmt(ms)} ms` : `${fmt(ms / 1000, 1)} s`);

/** Ersatzzeit je Auftrag auf Log-Achse (10 ms bis 1000 s), Frist als Linie; Normalbetrieb grau. */
export function ersatzSvg(d) {
  const H = 520;
  const x0 = 470;
  const x1 = 1330;
  const min = 0.01;
  const max = 1000;
  const sx = (s) =>
    x0 + ((Math.log10(s) - Math.log10(min)) / (Math.log10(max) - Math.log10(min))) * (x1 - x0);
  const y0 = 80;
  const zeileH = 72;
  const t = [];
  const zeilen = [
    ['normal', 'Normal', 'Inferenz, Antwort verworfen', FARBEN.gedaempft],
    ...STOERUNGEN.map(([v, n, w]) => [
      v,
      n,
      w,
      v === 'f1' || v === 'busy' ? FARBEN.blau : FARBEN.bernstein,
    ]),
  ].filter(([v]) => d.finde(v));
  const yAchse = y0 + zeilen.length * zeileH - 20;
  for (const [s, l] of [
    [0.01, '10 ms'],
    [0.1, '0,1 s'],
    [1, '1 s'],
    [10, '10 s'],
    [100, '100 s'],
    [1000, '1000 s'],
  ]) {
    t.push(linie(sx(s), y0 - 40, sx(s), yAchse, FARBEN.raster, 2));
    t.push(
      text(sx(s), yAchse + 34, l, {
        groesse: 22,
        anker: 'middle',
        farbe: FARBEN.gedaempft,
        mono: true,
      }),
    );
  }
  t.push(linie(x0, yAchse, x1, yAchse, FARBEN.linie, 2));
  const fristS = (d.finde('f1')?.timeoutMs ?? 300000) / 1000;
  t.push(linie(sx(fristS), y0 - 50, sx(fristS), yAchse, FARBEN.rot, 3, ' stroke-dasharray="8 6"'));
  t.push(
    text(sx(fristS) - 10, y0 - 56, `Frist ${fmt(fristS)} s`, {
      groesse: 22,
      gewicht: 600,
      anker: 'end',
      farbe: FARBEN.rot,
    }),
  );
  zeilen.forEach(([v, name, was, farbe], zi) => {
    const l = d.finde(v);
    const y = y0 + zi * zeileH;
    // Stufen (data-ab) in der Reihenfolge des Vortrags: schnelle Fehler, DROP, zu spät; Normalbetrieb steht.
    const stufe = STUFE_1B34[v] ?? 0;
    if (stufe) t.push(`<g data-ab="${stufe}" data-stoerung="${v}">`);
    t.push(text(0, y + 2, esc(name), { groesse: 26, gewicht: 700 }));
    t.push(text(0, y + 28, esc(was), { groesse: 22, farbe: FARBEN.gedaempft }));
    for (const ms of l.jobsMs) {
      t.push(
        `<circle cx="${r2(sx(ms / 1000))}" cy="${y - 6}" r="10" fill="${farbe}" fill-opacity="0.7"/>`,
      );
    }
    const median = `Median ${dauer(l.jobMedianMs)}`;
    const rechts = sx(l.jobSpanneMs[1] / 1000) + 18;
    const passtRechts = rechts + median.length * 13 < sx(fristS) - 12;
    t.push(
      text(passtRechts ? rechts : sx(l.jobSpanneMs[0] / 1000) - 18, y + 2, median, {
        groesse: 24,
        gewicht: 600,
        mono: true,
        farbe: farbe === FARBEN.bernstein ? FARBEN.bernsteinText : FARBEN.tinte,
        ...(passtRechts ? {} : { anker: 'end' }),
      }),
    );
    if (stufe) t.push('</g>');
  });
  t.push(
    text(x0, H - 4, 'Zeit bis zum Ersatz je Auftrag (Job-Zeit) · Log-Achse, je Strich × 10', {
      groesse: 22,
      farbe: FARBEN.gedaempft,
    }),
  );
  return huelle(
    `Zeit bis zur extraktiven Ersatzzusammenfassung je Auftrag: gestoppte Runtime und belegter Slot unter 0,2 s, verworfene Pakete etwa ${fmt((d.finde('f2')?.jobMedianMs ?? 0) / 1000)} s, Antwort nach der Frist ${fmt(fristS)} s.`,
    t.join(''),
    H,
  );
}

/** Folien M1–M2 (mit Daten) bzw. eine Platzhalterfolie M1 (ohne Daten); teil 'niklas', direkt nach 1A. */
export function folien1B34(
  d = { vorhanden: false, laeufe: [], finde: () => undefined, schwellen: null },
) {
  const fuss = `Quelle: ${kurzbeleg1A('schneider2026', 'Ordner evidenz/1B').slice(1, -1)}; ${kurzbeleg1A('arsnova2026adr0035', 'Abschn. 2.1').slice(1, -1)}`;
  const basis = { teil: 'niklas', auftrag: '1B', kurzfassung: true, station: null };
  const f1 = d.finde('f1');
  if (!d.vorhanden || !f1) {
    return [
      {
        ...basis,
        id: 'M1',
        titel: `Störung am zweiten Host ${offen('[Titel]')}`,
        inhalt: flaeche(
          frage(
            'Was spüren die Live-Aktionen, wenn der llm-host langsam ist oder ausfällt?',
            '1B',
          ) +
            `<p style="font-size:28px">${offen(`${N}: Ergebnis-JSONs evidenz/1B/messung/&lt;Datum&gt;-lauf-&lt;variante&gt;-summary.json fehlen`)}</p>`,
        ),
        notiz: `${N} Ergebnisse fehlen.`,
        stichpunkte: [`${N} Ergebnisse fehlen`, '[Satz: Störungen]', '[Satz: Entscheidung]'],
        zeitS: 90,
        quelle: `${N}: Ergebnis-JSONs mit Rechner und Commit`,
        fuss: `${fuss} ${N}`,
      },
    ];
  }
  const sw = d.schwellen;
  const swDatum = sw?.datum ? `${sw.datum.slice(8, 10)}.${sw.datum.slice(5, 7)}.` : '';
  const vorhanden = STOERUNGEN.filter(([v]) => d.finde(v));
  const laeufe = [d.finde('normal'), ...vorhanden.map(([v]) => d.finde(v))].filter(Boolean);
  const umgebung = `${f1.rechner}, ohne CPU-Pinning; ${f1.vms.join(', ')}`;
  const quelle = `${laeufe.map((l) => `${l.datei} (Commit ${l.commit}, n = ${l.n})`).join('; ')} · ${umgebung} · Schwellen: ${sw.datei} auf Niklas' Zweig feature-1B-private-inference-3-4, Commit ${sw.commit} (${sw.datum ?? 'Datum aus Git'}), vor der ersten gewerteten Reihe; Protokolle evidenz/1B/2026-11-15-lauf-*-summary.md, 2026-11-16-lauf-*-summary.md (Prüfung durch den Autor: offen)`;
  const f2 = d.finde('f2');
  const l3 = d.finde('l3');
  const busy = d.finde('busy');
  const faktor = f2 ? f2.jobMedianMs / f1.jobMedianMs : null;
  // Maßstab zum Mitnehmen: Dauerte der Stopp eine Sekunde, wie lange wartete DROP? (Verhältnis der Mediane)
  const dropMinuten = faktor ? Math.round(faktor / 60) : null;
  const fristS = f1.timeoutMs / 1000;
  const alleErsatzImBudget = laeufe
    .filter((l) => l.variante !== 'normal')
    .every((l) => l.jobSpanneMs[1] <= f1.timeoutMs + sw.fallbackPufferMs);

  // ------------------------------------------------------------ M1 Ersatzzeit je Störung
  const M1 = {
    ...basis,
    id: 'M1',
    titel: 'Ersatz kommt immer, ein stummer Host kostet Minuten',
    inhalt: flaeche(
      frage('Wie schnell liefert die App den Ersatz, wenn die Inferenz gestört ist?', '1B') +
        grafikBox(ersatzSvg(d)) +
        (dropMinuten
          ? `<p data-ab="2" class="sekundaer" style="margin:6px 0 0">Im Maßstab: Dauerte der Stopp eine Sekunde, wartete DROP rund ${fmt(dropMinuten)} Minuten (Verhältnis der Mediane).</p>`
          : '') +
        `<p class="beleg">Vorab festgelegt (${mono(sw.commit)}${swDatum ? `, ${swDatum}` : ''}): Ersatz ≤ Frist + ${fmt(sw.fallbackPufferMs / 1000)} s, Stopp im Median ≤ ${fmt(sw.f1MedianMaxMs / 1000)} s, DROP > ${fmt(sw.f2ZuF1Min)} × Stopp; alle drei erfüllt</p>`,
    ),
    notiz: `Danke, Jonas. Er hat gefragt: Was passiert, wenn der zweite Host langsam ist oder ausfällt? Oben links ist auf Jonas' Weg jetzt die Strecke über den zweiten Host markiert. Ich habe die Runtime im Labor gezielt gestört, jeweils unter derselben Beitrittswelle wie in 1A. Die Achse zeigt die Zeit bis zum Ersatz je Auftrag, logarithmisch; rechts steht die Frist von ${fmt(fristS)} Sekunden. Grau ist der Normalbetrieb: Die Inferenz läuft, und die Antwort verwirft das Gate, wie bei Jonas. [Weiter] Ist der Container gestoppt, wird die Verbindung sofort abgewiesen, und die App liefert die extraktive Zusammenfassung nach ${fmt(f1.jobMedianMs)} Millisekunden im Median; bei belegtem Slot nach ${fmt(busy?.jobMedianMs ?? 0)} Millisekunden. [Weiter] Verwirft die Firewall die Pakete, merkt die App das erst nach rund ${fmt((f2?.jobMedianMs ?? 0) / 1000)} Sekunden.${dropMinuten ? ` Im Maßstab: Dauerte der Stopp eine Sekunde, wartete DROP rund ${fmt(dropMinuten)} Minuten.` : ''} [Weiter] Antwortet die Runtime erst nach der Frist, wartet die App die vollen ${fmt(fristS)} Sekunden. Alle Kriterien standen vor der ersten Reihe fest und sind erfüllt. Ein stummer Host ist also teurer als ein toter.`,
    stichpunkte: [
      '„Danke, Jonas.“ Seine Frage: Was, wenn der zweite Host langsam ist oder ausfällt?',
      `Achse: Zeit bis zum Ersatz, log; Frist ${fmt(fristS)} s; grau = Normalbetrieb`,
      `[Weiter] Stopp: Ersatz nach ${dauer(f1.jobMedianMs)}, Slot belegt ${dauer(busy?.jobMedianMs ?? 0)} (Median)`,
      `[Weiter] DROP: ${dauer(f2?.jobMedianMs ?? 0)}${dropMinuten ? `; Bild: Stopp 1 s → DROP rund ${fmt(dropMinuten)} min` : ''}`,
      `[Weiter] Antwort nach der Frist: ${dauer(l3?.jobMedianMs ?? 0)}`,
      `Kriterien vorab (${sw.commit}) alle erfüllt${alleErsatzImBudget ? ', jeder Ersatz in der Frist' : ''}; stumm ist teurer als tot`,
    ],
    zeitS: 75,
    aufbau: 3,
    // Wegmarke (jonas/wegkarte.mjs): Jonas' Auftragsweg, Strecke über den zweiten Host in Bernstein; Beschriftung
    // und Störungszeichen folgen den Stufen (STUFE_1B34).
    marke: '1b-stoerung',
    quelle,
    fuss,
  };

  // ------------------------------------------------------------ M2 Live-Aktionen und Folgerung
  const zelle = (l, a) => {
    const p = l.live[a].p95Ms;
    const r = p / f1.live[a].p95Ms;
    const ueber = r > sw.p95Faktor;
    return (
      `<td class="mono" style="padding:6px 12px;text-align:right${ueber ? ';color:var(--bernstein-text);font-weight:700' : ''}">` +
      `${fmt(p, 1)}<span style="font-size:var(--s-min);color:${ueber ? 'var(--bernstein-text)' : 'var(--gedaempft)'}"> ${Math.abs(r - 1) < 0.005 ? '±' : r > 1 ? '+' : '−'}${fmt(Math.abs(r - 1) * 100)}&nbsp;%</span></td>`
    );
  };
  const kandidaten = vorhanden.filter(([v]) => v !== 'f1').map(([v, n]) => [d.finde(v), n]);
  const fehlerGesamt = laeufe.reduce((s, l) => s + l.liveFehler, 0);
  const geplantGesamt = laeufe.reduce((s, l) => s + l.liveGeplant, 0);
  const deltas = kandidaten.flatMap(([l]) =>
    AKTIONEN.map(([a]) => l.live[a].p95Ms - f1.live[a].p95Ms),
  );
  const maxDelta = deltas.length ? Math.max(...deltas) : 0;
  const verfehlt = kandidaten.flatMap(([l, n]) =>
    AKTIONEN.filter(([a]) => l.live[a].p95Ms / f1.live[a].p95Ms > sw.p95Faktor).map(
      ([, an]) => `${n}: ${an}`,
    ),
  );
  const cpuMax = Math.max(...laeufe.map((l) => l.appCpuMax));
  const rssMax = Math.max(...laeufe.map((l) => l.appRssMaxMiB));
  const M2 = {
    ...basis,
    id: 'M2',
    titel: `Kein Live-Fehler unter Störung, p95 bis +${fmt(maxDelta)} ms`,
    inhalt: flaeche(
      frage('Leiden die Live-Aktionen, wenn der zweite Host gestört ist?', '1B') +
        `<table style="border-collapse:collapse;font-size:24px;width:100%">` +
        `<tr style="color:var(--gedaempft);font-size:var(--s-min)"><td>p95 in ms</td><td style="text-align:right;padding:0 12px"><b style="color:var(--tinte)">F1 Stopp</b><br>Referenz</td>${kandidaten.map(([, n]) => `<td style="text-align:right;padding:0 12px"><b style="color:var(--tinte)">${n}</b><br>gg. F1</td>`).join('')}</tr>` +
        AKTIONEN.map(
          ([a, name]) =>
            `<tr style="border-top:var(--linie-min) solid var(--linie)"><td style="padding:6px 12px 6px 0;font-weight:700">${name}</td>` +
            `<td class="mono" style="padding:6px 12px;text-align:right">${fmt(f1.live[a].p95Ms, 1)}</td>` +
            kandidaten.map(([l]) => zelle(l, a)).join('') +
            `</tr>`,
        ).join('') +
        `<tr style="border-top:var(--linie-min) solid var(--linie)"><td style="padding:6px 12px 6px 0;font-weight:700">Fehler</td>${[f1, ...kandidaten.map(([l]) => l)].map((l) => `<td class="mono" style="padding:6px 12px;text-align:right">${fmt(l.liveFehler)} / ${fmt(l.liveGeplant)}</td>`).join('')}</tr>` +
        `</table>` +
        `<p class="vermerk">Bernstein: über ${fmt(sw.p95Faktor * 100)} % der Referenz (vorab festgelegt), absolut höchstens +${fmt(maxDelta, 1)} ms; serielle Reihen, Ursache nicht belegt</p>` +
        `<p class="merksatz"><b>Schritt 4:</b> Die zweite Rolle bleibt, wie ADR-0035 vorsieht. Gewinn: Keine Störung wurde zum Live-Fehler. Kosten: zweiter Host, Token, Firewall, Deployment, Überwachung, nicht in Stunden gemessen. Risiko: Ein stummer Host bindet jeden Auftrag bis zur Frist.</p>` +
        `<p class="beleg">Grenze: ein Rechner, kein Vergleich mit einem LLM auf dem App-Host; ein privates Netz belegt weder Autorisierung noch Datenschutz</p>`,
    ),
    notiz: `Und die Live-Aktionen? In allen Störreihen scheiterte keine einzige: ${fmt(fehlerGesamt)} Fehler bei ${fmt(geplantGesamt)} Aktionen. Die vorab festgelegte Latenzregel, höchstens zehn Prozent über der Referenz, verfehlt aber jede Störreihe bei mindestens einer Aktion, um höchstens ${fmt(maxDelta, 1)} Millisekunden. Die Reihen liefen nacheinander auf einem Rechner; eine Ursache kann ich nicht belegen, und die Regel lasse ich stehen. Der App-Host brauchte dabei höchstens ${fmt(cpuMax)} Prozent einer CPU und ${fmt(rssMax)} Mebibyte. Für Schritt 4 folgt: Die zweite Serverrolle bleibt, wie ADR-0035 sie vorsieht. Ihr Gewinn ist gemessen, keine Störung der Inferenz wurde zum Live-Fehler. Ihre Kosten sind ein zweiter Host mit Token, Firewall, Deployment und Überwachung; in Stunden gemessen habe ich sie nicht. Das Risiko: Ein stummer Host bindet jeden Auftrag bis zur Frist.`,
    stichpunkte: [
      `${fmt(fehlerGesamt)} Live-Fehler bei ${fmt(geplantGesamt)} Aktionen, alle Reihen`,
      `Regel +${fmt(sw.p95Faktor * 100 - 100)} % je Reihe verfehlt (${verfehlt.join(', ')}), höchstens +${fmt(maxDelta, 1)} ms`,
      'Serielle Reihen, ein Rechner: Ursache offen, Regel bleibt',
      'Schritt 4: zweite Rolle bleibt (ADR-0035); Gewinn gemessen, Aufwand nicht in Stunden',
      'Risiko: stummer Host bindet Aufträge bis zur Frist',
    ],
    zeitS: 60,
    // Wegmarke: derselbe Weg, alle vier Störungen, deren Rückwirkung auf die Live-Aktionen die Folie zeigt.
    marke: '1b-alle',
    quelle: `${quelle}; p95 gepoolt über alle Fenster (fasseLaufzeitenZusammen), Referenz B0 = F1; F2, L3 und Slot belegt auf Commit 2b39b9df, F1 auf 5e758d0a (versionsübergreifend, Produktionscode unverändert laut Versionsnachtrag; automatischer Vergleich meldet MANIFEST_MISSING_OR_DIFFERENT); App-CPU/RSS aus treiber.auftraege[].measurement.resources (RSS-Summe zählt geteilte Seiten ggf. mehrfach); Kosten Schritt 4 aus evidenz/1B/runbook.md (Aufbau, Abschnitt 2), nicht gemessen`,
    fuss,
  };
  return [M1, M2];
}
