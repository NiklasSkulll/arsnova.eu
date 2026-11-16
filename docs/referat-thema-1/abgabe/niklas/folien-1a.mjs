// Niklas' Teil 1A im gemeinsamen Deck (Stil und Bausteine aus jonas/folien.mjs). Jede Zahl kommt aus
// daten-1a.mjs, also aus der committeten Reihe vom 15.11.2026; die Folien zeigen gerundete Werte, Notizen
// und Handout die genauen. Titel = Behauptung, eine Aussage je Folie, Kurzbelege nach ZL in der Fußzeile,
// volle Herkunft (Datei, Rechner, Commit) in `quelle`. Sprechnotizen in zwei Fassungen: `notiz`
// (Fließtext) und `stichpunkte` (zum freien Vortrag).
//
// Erzählbogen (Heldenzahlenkette): 40.000 von 40.000 Live-Aktionen erfolgreich → 80 gepaarte Vergleiche →
// 11 verfehlen die Regel → 4 davon schon ohne spaCy → 3 über 50 ms, alle im letzten Lauf in etwa 10 s →
// Freigabe nicht erteilt.

import { etikett, flaeche, frage, grafikBox, mono, zahl, zweiSpalten } from '../jonas/folien.mjs';
import { fmt } from '../jonas/zahlen.mjs';
import {
  analyseSvg,
  ausreisserSvg,
  liveSvg,
  profilSvg,
  ressourcenSvg,
  vergleichsMatrixSvg,
} from './grafik-1a.mjs';
import { AKTIONEN, VARIANTEN } from './daten-1a.mjs';
import { LITERATUR_1A, kurzbeleg1A } from './literatur-1a.mjs';

const S = 'schneider2026';
/**
 * Inferenzdauer eines LLM-Auftrags in Jonas' Labor (1B-ergebnis.md: warm im Median 148,6 s, ThinkPad P50,
 * Commit 8e9d1317), auf Minuten gerundet; nur für die Übergabe an Jonas auf N10. Der Test prüft die Quelle.
 */
export const LLM_MIN_WARM = Math.round(148.6 / 60 / 0.5) * 0.5;

/** Kurzbelege je Folie (ZL Anhang B); die Fußzeile bleibt einzeilig. */
const ZITATE = {
  N1: [
    ['arsnova2026pruefung', 'Abschn. 4.3'],
    [S, 'Reihe 1A'],
  ],
  N2: [
    [S, 'Laufmanifeste'],
    ['heo2024', 'Abschn. „CPU Interface Files“'],
    ['arsnova2026adr0035', 'Abschn. 2.1'],
  ],
  N3: [
    [S, '1A-Versuchsvertrag'],
    ['papadopoulos2021', 'Kap. 2.3'],
  ],
  N4: [
    [S, '1A-Versuchsvertrag'],
    ['nosek2018', 'S. 2600'],
    ['papadopoulos2021', 'Kap. 2.3'],
  ],
  N5: [
    [S, 'auswertung.json'],
    ['papadopoulos2021', 'Kap. 2.3'],
  ],
  N6: [[S, 'live-vergleiche.csv']],
  N6b: [
    [S, 'Laufdateien'],
    ['nosek2018', 'S. 2600'],
  ],
  N7: [
    [S, 'V3/block-05'],
    ['nosek2018', 'S. 2600'],
  ],
  N8: [
    [S, 'auswertung.json'],
    ['heo2024', 'Abschn. „CPU Interface Files“'],
  ],
  N9: [
    [S, 'auswertung.json'],
    ['ulrich2016', 'Abschn. „Test Noncritical Backends“'],
  ],
  N10: [
    [S, '1A-auswertung.md'],
    ['dean2013', 'S. 76'],
    ['weirauch2026c', '1B-ergebnis.md'],
  ],
  RN2: [
    [S, '1A-auswertung.md'],
    ['papadopoulos2021', 'Kap. 2.3'],
  ],
};

const spanne = ([a, b], stellen = 0) =>
  fmt(a, stellen) === fmt(b, stellen) ? fmt(a, stellen) : `${fmt(a, stellen)}–${fmt(b, stellen)}`;

/** Kasten mit Akzentlinie links (wie J15/J4 bei Jonas). */
const kernsatz = (html, linie = 'var(--blau)', groesse = 32) =>
  `<p style="margin:0;font-size:${groesse}px;line-height:1.3;padding-left:22px;border-left:6px solid ${linie}">${html}</p>`;

/** Etikett für nachträgliche Auswertung. */
const explorativ = `<span class="etikett" style="background:var(--raster);color:var(--text-2)">nachträglich ausgewertet</span>`;

/** Folien N1–N10 mit N6b (Hauptteil), NL (Literatur, Anhang) und RN2 (Reserve). */
export function folien1A(d) {
  const H = d.herkunft;
  const sw = d.schwellen;
  const rel = fmt(sw.relativ * 100);
  const abs = fmt(sw.absolutMs);
  const fehlAlle = d.vergleiche.filter((x) => !x.bestanden);
  const kontrolle = fehlAlle.filter((x) => x.variante === 'V1');
  const mitSpacy = fehlAlle.filter((x) => x.variante !== 'V1');
  const v3b5 = d.vergleiche.filter((x) => x.variante === 'V3' && x.block === 5);
  const v3b5Fehl = v3b5.filter((x) => !x.bestanden);
  const v3b5Abs = v3b5.filter((x) => !x.absolutBestanden);
  const e = d.explorativ;
  const k = d.konfig;
  const mitSpacyGesamt = d.h1.gesamt + d.h2.gesamt;
  const mitSpacyFehl = d.h1.fehl + d.h2.fehl;
  const timeoutS = fmt(k.timeoutMs / 1000);
  const proxyS = fmt(d.v4.verzoegerungMs / 1000);
  const datum = (iso) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;
  const umgebung = `Niklas' Rechner, ${H.os} unter WSL2 (Kernel ${H.kernel}), ${H.cpus} logische CPUs, Lastgenerator auf demselben Rechner · App-Commit ${H.commit} (nach v1.4.0) · Auswertung SHA-256 ${H.auswertungSha}…`;
  const q = (was) => `${was} · ${umgebung}`;
  const F = [];
  const neu = (f) =>
    F.push({
      teil: 'niklas',
      auftrag: '1A',
      kurzfassung: false,
      station: null,
      ...f,
    });

  // ------------------------------------------------------------ N1 Antwort zuerst
  neu({
    id: 'N1',
    titel: 'Keine Freigabe für die spaCy-Glättung',
    inhalt: flaeche(
      frage(
        'Welche Reserve hat der App-Host für optionale Analyse, ohne die Live-Signale zu verzögern?',
        '1A',
      ) +
        `<p style="margin:0 0 34px;font-size:28px;font-weight:600">Niklas Schneider</p>` +
        zweiSpalten(
          kernsatz(
            `Die Live-Last läuft fehlerfrei. Mit spaCy hält die vorab festgelegte Regel aber nicht, und der Nutzen ist nicht gemessen.`,
            'var(--blau)',
            36,
          ) +
            `<p style="margin:34px 0 0;font-size:30px;line-height:1.35">Entscheidung: ${mono('NLP_ENABLED=false')} bleibt, die Wortwolke bleibt lexikalisch.</p>`,
          zahl({
            wert: fmt(d.live.erfolgreich),
            einheit: `/ ${fmt(d.live.geplant)}`,
            was: 'Live-Aktionen erfolgreich',
            gruppe: `${d.live.laeufe} Läufe, ${fmt(d.live.fehlgeschlagen)} Fehler`,
            gross: 84,
          }) +
            zahl({
              wert: `${mitSpacyFehl}`,
              einheit: `/ ${mitSpacyGesamt}`,
              was: `Vergleiche mit spaCy verfehlen die Regel, <b>Kontrolle ohne spaCy: ${kontrolle.length} / ${d.h1.gesamt}</b>`,
              gruppe: `H1 ${d.h1.fehl}/${d.h1.gesamt}, H2 ${d.h2.fehl}/${d.h2.gesamt}; ohne spaCy also nicht seltener`,
              linie: 'var(--bernstein)',
              gross: 84,
            }),
          760,
        ) +
        `<p class="beleg">Labor: ein Rechner (WSL2, ${H.cpus} logische CPUs), Code ${mono(H.commit)} (nach v1.4.0), ${d.live.laeufe} Läufe am ${datum(d.vorab.ersterLauf)}2026</p>`,
    ),
    notiz: `Ich beginne auf dem App-Host und frage: Welche Reserve hat er für optionale Analyse, ohne die Live-Signale zu verzögern? Geprüft habe ich das an der spaCy-Glättung der Wortwolke. Die Antwort vorweg: keine Freigabe. Alle ${fmt(d.live.geplant)} Live-Aktionen meiner Reihe kamen an, ohne einen Fehler. Mit spaCy verfehlen ${mitSpacyFehl} von ${mitSpacyGesamt} Vergleichen die vorher festgelegte Regel. Aber auch die Kontrolle ganz ohne spaCy verfehlt sie ${kontrolle.length} von ${d.h1.gesamt} Mal. Ich sage deshalb nicht, spaCy sei schädlich. Ich sage: Die Unschädlichkeit ist nicht belegt, und den Nutzen habe ich nicht gemessen. Oben links zeigt der kleine Weg, wo wir sind: der spaCy-Zweig neben dem Live-Pfad.`,
    stichpunkte: [
      'Start auf dem App-Host (Teil 1 im Fahrplan)',
      'Leitfrage: Reserve für optionale Analyse, ohne Live-Signale zu verzögern?',
      `Antwort vorweg: keine Freigabe für spaCy`,
      `${fmt(d.live.geplant)} von ${fmt(d.live.geplant)} Live-Aktionen ok; mit spaCy ${mitSpacyFehl}/${mitSpacyGesamt} verfehlt, Kontrolle ohne spaCy ${kontrolle.length}/${d.h1.gesamt}`,
      'Nicht „schädlich“: Unschädlichkeit nicht belegt, Nutzen ungemessen',
    ],
    zeitS: 50,
    kurzfassung: true,
    // Wegmarke (jonas/wegkarte.mjs MARKEN): Antwort zuerst zur spaCy-Glättung, also die Station spaCy.
    marke: '1a-spacy',
    quelle: q(
      `${H.datei} (live.*.planned/succeeded, hypotheses.H1/H2); Leitfrage: Prüfungsdokument Abschn. 4.3, Gruppenauftrag 1A`,
    ),
  });

  // ------------------------------------------------------------ N2 Dienste und Limits
  const NAMEN = {
    app: ['App (Backend)', 'Live-Aktionen, Kontextaufbau'],
    postgres: ['PostgreSQL', 'Sitzungsdaten'],
    redis: ['Redis', 'Pub/Sub, Cache'],
    'pdf-worker': ['PDF-Worker', 'Export, hier ohne Last'],
    spacy: ['spaCy-Sidecar', 'Glättung der Wortwolke'],
  };
  const limitText = (s) =>
    s.cpu === null
      ? 'kein Limit'
      : `${fmt(s.cpu)} CPU · ${fmt(s.speicherGiB)} GiB · ${fmt(s.pids)} PIDs`;
  neu({
    id: 'N2',
    titel: 'Fünf Dienste teilen sich den App-Host',
    inhalt: flaeche(
      frage('Was konkurriert mit den Live-Aktionen um CPU und Speicher?', '1A') +
        `<div style="display:grid;grid-template-columns:repeat(5,1fr);column-gap:18px;font-size:28px;line-height:1.3">` +
        k.dienste
          .map((s) => {
            const [n, rolle] = NAMEN[s.alias] ?? [s.alias, ''];
            const hervor = s.alias === 'spacy';
            return (
              `<div style="border:${hervor ? '3px solid var(--blau)' : 'var(--linie-min) solid var(--linie)'};border-radius:10px;padding:18px 16px;${hervor ? 'background:var(--raster)' : ''}">` +
              `<b>${n}</b><p style="margin:8px 0 0;color:var(--text-2)">${rolle}</p>` +
              `<p class="mono" style="margin:12px 0 0;font-size:var(--s-min);white-space:normal;color:${hervor ? 'var(--blau)' : 'var(--gedaempft)'}">${limitText(s)}</p></div>`
            );
          })
          .join('') +
        `</div>` +
        `<div style="margin-top:30px">` +
        kernsatz(
          'Ein Limit ist eine Obergrenze, keine Reservierung: Es hält spaCy klein, schützt aber nichts für die App.',
          'var(--blau)',
          30,
        ) +
        `</div>` +
        `<p class="sekundaer" style="margin-top:24px">${k.optionalAus ? 'In allen Läufen aus: Encoder der semantischen Wortwolke und Q&amp;A-Klassifikation (8.9b). Der Kontextaufbau läuft in der App.' : ''}</p>` +
        `<p class="sekundaer" style="margin-top:12px">Kein LLM hier: Der 16-GB-Host trägt neben Baseline und Sidecars kein ~4-GB-Modell, Live-Pfade dürfen nie auf Inferenz warten. Deshalb ein zweiter Host ${etikett('1B')}.</p>`,
    ),
    notiz: `Auf dem App-Host laufen fünf Dienste. Backend, Datenbank und Redis haben kein Limit; spaCy hat wie in der Produktions-Compose eine CPU, ein Gibibyte und vierundsechzig Prozesse. Ein cgroup-Limit ist eine Obergrenze, keine Reservierung: Es hält spaCy klein, schützt aber nichts für die App. Den Encoder der semantischen Wortwolke und die Q&A-Klassifikation 8.9b habe ich in allen Läufen ausgeschaltet; der Kontextaufbau läuft in der App. Ein Sprachmodell gehört nach ADR-0035 nicht hierher: Der Host mit sechzehn Gigabyte trägt neben Baseline und Sidecars kein Modell mit etwa vier Gigabyte, und Live-Pfade dürfen nie auf Inferenz warten. Deshalb sagt mein spaCy-Befund nichts über ein LLM.`,
    // Wegmarke: Fünf Dienste teilen sich den App-Host: Station App.
    marke: '1a-app',
    stichpunkte: [
      'Fünf Dienste; Backend, DB, Redis ohne Limit; spaCy 1 CPU, 1 GiB, 64 PIDs wie in Produktion',
      'Limit = Obergrenze, keine Reservierung für die App (cgroup v2)',
      'Encoder und 8.9b in allen Läufen aus; Kontextaufbau in der App',
      'Kein LLM hier (ADR-0035): 16-GB-Host trägt kein ~4-GB-Modell, Live-Pfade warten nie',
    ],
    zeitS: 45,
    quelle: q(
      `${H.datei}; Limits aus den Laufmanifesten V2/block-01/lauf.json manifest.services (= docker-compose.prod.yml, aufgelöste Compose je Lauf); Flags QA_NLP_ENABLED, WORD_CLOUD_SEMANTIC_ENABLED, OPEN_WEIGHT_LLM_ENABLED = false und kein Encoder-/LLM-Dienst in allen 25 Manifesten; Kernel-Doku cgroup v2 (Linux 6.12), Abschn. „CPU Interface Files“; ADR-0035 Z. 27–31 und Abschn. 2.1 (Live-Host-RAM ~10–11 GB Baseline plus spaCy 1 GB, Encoder 2 GB, PDF-Worker 1 GB trägt kein ~4-GB-LLM; Same-Host-Sidecar nur Labor)`,
    ),
  });

  // ------------------------------------------------------------ N4 Vorab-Festlegung
  const vr = d.vorab.vorreihe;
  // 12.11.: Vertrag v2 kam zusammen mit einer ersten vollständigen Reihe auf älterem Stand (offengelegt).
  const kette = [
    ...d.vorab.kette.map((x) => [
      datum(x.datum),
      x.commit === vr.commitDaten
        ? `Vertrag v2; erste Reihe auf ${mono(vr.baseline)} verfehlte H1 und H2 ebenso`
        : x.was,
      x.commit,
    ]),
    [datum(d.vorab.ersterLauf), `${d.live.laeufe} gewertete Läufe`, H.commit],
  ];
  neu({
    id: 'N4',
    titel: 'Die Regel stand eine Woche vorher fest',
    inhalt: flaeche(
      frage('Wann ist spaCy für die Live-Aktionen unschädlich?', '1A') +
        `<p style="margin:0 0 22px;font-size:24px;line-height:1.35;color:var(--text-2)"><b style="color:var(--tinte)">Fünf Varianten, je Block gemischt:</b> V0 ohne Analyse · V1 lexikalisch (Basis) · V2 spaCy ${fmt(k.spacy.V2.cpu)}&nbsp;CPU · V3 ${fmt(k.spacy.V3.cpu, 2)}&nbsp;CPU · V4 Proxy +${proxyS}&nbsp;s, Timeout ${timeoutS}&nbsp;s</p>` +
        `<div style="font-size:30px;line-height:1.35;padding:18px 26px;border-left:6px solid var(--blau);background:var(--raster);margin:0 0 30px">Je Aktion und Block steigt der p95 gegenüber V1 um höchstens <b>${rel} %</b> <b>und</b> höchstens <b>${abs} ms</b>. Alle fünf Blöcke müssen bestehen; kein Ausreißer wird entfernt.</div>` +
        // Zeitleiste der Vorab-Festlegung (Git)
        `<div style="display:grid;grid-template-columns:repeat(${kette.length},1fr);column-gap:24px">` +
        kette
          .map(
            ([tag, was, c], i) =>
              `<div style="border-top:6px solid ${i === kette.length - 1 ? 'var(--tinte)' : 'var(--blau)'};padding-top:12px">` +
              `<p class="kennzahl" style="margin:0;font-size:44px">${tag}</p>` +
              `<p style="margin:8px 0 0;font-size:28px;line-height:1.3">${was}</p>` +
              `<p class="mono" style="margin:6px 0 0;font-size:var(--s-min);color:var(--gedaempft)">${c}</p></div>`,
          )
          .join('') +
        `</div>` +
        `<p class="beleg">Dazu vorab: Fehler ≤ ${fmt(sw.fehler * 100, 1)} %, Quiz-p95 ≤ ${fmt(sw.quizZielMs)} ms, spaCy gedrosselt ≤ ${fmt(sw.drosselung * 100)} %, Speicher ≤ ${fmt(sw.speicher * 100)} % von 1 GiB, kein OOM</p>`,
    ),
    notiz: `Fünf Varianten: V0 nur Live-Last, V1 mit lexikalischer Analyse als Basis, V2 spaCy mit einer CPU, V3 gedrosselt auf ein Viertel, V4 hinter einem Proxy, der länger wartet als der Timeout. Fünf Blöcke, je Block zufällig gemischt, verglichen wird nur im selben Block. Die Regel: Je Aktion und Block darf der p95 höchstens zehn Prozent und höchstens fünfzig Millisekunden steigen, und alle fünf Blöcke müssen bestehen. Gemessen wird das p95, weil Nutzer auf die langsamen Anfragen warten. Die Regel steht seit dem siebten November in Git, eine Woche vor den Läufen. Offen gesagt: Eine erste vollständige Reihe auf dem älteren Code-Stand vom zwölften November verfehlte H1 und H2 ebenfalls. Gewertet wird die Wiederholung auf einem Stand nach Version 1.4.0 mit unverändertem Vertrag, weil das Ergebnis für den aktuellen Stand gelten soll.`,
    // Wegmarke: Die vorab festgelegte Regel vergleicht Live-Latenz mit und ohne Analyse: Live-Pfad gegen Zweig.
    marke: '1a-regel',
    stichpunkte: [
      `V0 ohne Analyse, V1 Basis, V2 ${fmt(k.spacy.V2.cpu)} CPU, V3 ${fmt(k.spacy.V3.cpu, 2)} CPU, V4 Proxy hinter Timeout; 5 Blöcke gemischt`,
      `Regel: p95 höchstens +${rel} % und +${abs} ms, je Aktion und Block; alle 5 Blöcke`,
      `In Git seit ${datum(d.vorab.kette[0].datum)}, Läufe am ${datum(d.vorab.ersterLauf)}: eine Woche`,
      `Erste Reihe (${datum(vr.datumDaten)}, ${vr.baseline}): H1 ${vr.h1.fehl}/${vr.h1.gesamt}, H2 ${vr.h2.fehl}/${vr.h2.gesamt}, gleiches Urteil`,
      'Gewertet: Wiederholung nach v1.4.0, Vertrag unverändert',
    ],
    zeitS: 50,
    kurzfassung: true,
    quelle: `1A-Versuchsvertrag (Regeltabelle, „Alle fünf Blöcke“; SHA-256 ${d.vorab.vertragSha}… = contractSha256 aller ${d.live.laeufe} Laufmanifeste); Git: ${d.vorab.kette.map((x) => `${x.commit} ${x.datum}`).join(', ')}; erster Lauf ${d.vorab.ersterLauf} (lauf.json manifest.startAt); erste Reihe: Daten ${vr.commitDaten} (${vr.datumDaten}), Auswertung ${vr.commitAuswertung} (${vr.datumAuswertung}), Baseline ${vr.baseline}, gleicher Vertrag, Seed ${vr.gleicherSeed}, Fixture ${vr.fixtureSha}…, H1 ${vr.h1.fehl}/${vr.h1.gesamt}, H2 ${vr.h2.fehl}/${vr.h2.gesamt}, ${vr.absolutFehl} absolute Verletzungen; aus dem Arbeitsbaum entfernt in ab1619e7 · ${umgebung}`,
  });

  // ------------------------------------------------------------ N5 Live-Aktionen
  neu({
    id: 'N5',
    titel: `Alle ${fmt(d.live.erfolgreich)} Live-Aktionen kamen an`,
    inhalt: flaeche(
      grafikBox(liveSvg(d)) +
        `<p class="beleg">Gemessen am Lastgenerator bis zur Antwort des Backends; Anzeige im Browser und Kompasskarten nicht gemessen</p>`,
    ),
    notiz: `Zuerst, was hält. In allen fünfundzwanzig Läufen kamen alle ${fmt(d.live.erfolgreich)} Live-Aktionen an: Beitritte, Quizstimmen, Tempostimmen und Q&A-Fragen. Jeder Punkt ist der p95 eines Laufs; die lineare Achse reicht bis zum vorab gesetzten Quiz-Ziel von einer Sekunde. Der langsamste Quiz-Lauf liegt bei ${fmt(d.live.quizMaxMs)} Millisekunden, die meisten Punkte unter sechzig. Diese Aktionen sind die Eingänge des Moderationskompasses. Wie schnell eine Karte im Browser der Lehrperson erscheint, habe ich nicht gemessen.`,
    // Wegmarke: Alle Live-Aktionen kamen an: der ganze Live-Pfad (Hauptlinie).
    marke: '1a-live',
    stichpunkte: [
      `${fmt(d.live.erfolgreich)} von ${fmt(d.live.geplant)} ok, ${d.live.laeufe} Läufe, 0 Fehler`,
      'Ein Punkt = p95 eines Laufs, lineare Achse bis 1 s',
      `Höchster Quiz-Lauf ${fmt(d.live.quizMaxMs)} ms, Ziel ≤ ${fmt(sw.quizZielMs)} ms`,
      'Eingänge des Kompasses; Anzeige im Browser nicht gemessen',
    ],
    zeitS: 40,
    kurzfassung: false,
    quelle: q(
      `${H.datei} runs[].live.<aktion>.p95Ms, planned, succeeded, failed; Kompass-Eingänge: docs/GLOSSAR.md (Moderationskompass)`,
    ),
  });

  // ------------------------------------------------------------ N6 Vergleiche (3 Stufen)
  neu({
    id: 'N6',
    titel: 'Deutlich verletzt wird die Regel nur einmal',
    inhalt: flaeche(grafikBox(vergleichsMatrixSvg(d))),
    notiz: `Jetzt die Regel. Das sind alle ${d.vergleiche.length} gepaarten Vergleiche: jede Aktion in jedem Block gegen ihre Basis, noch ohne Ergebnis. [Weiter] Grau heißt: hält. Zuerst die Kontrolle, V1 gegen V0, ganz ohne spaCy. Schon sie verfehlt die Regel ${kontrolle.length}-mal, um höchstens ${fmt(Math.max(...kontrolle.map((x) => x.deltaMs)), 0)} Millisekunden. Bei p95-Werten um zwanzig Millisekunden reichen dafür zwei Millisekunden Schwankung. [Weiter] Mit spaCy kommen ${mitSpacy.length - v3b5Fehl.length} ebenso kleine Treffer dazu, alle unter fünf Millisekunden. Formal reicht das schon: H1 und H2 sind nicht bestätigt. [Weiter] Und hier der eine deutliche Effekt: V3, also spaCy gedrosselt, im letzten Lauf der Reihe. ${v3b5Abs.length} Aktionen über fünfzig Millisekunden, bis zu ${fmt(d.v3Block5MaxDeltaMs)} Millisekunden mehr. Insgesamt verfehlen ${fehlAlle.length} von ${d.vergleiche.length} die Regel. Ich lasse sie trotzdem stehen, weil sie vorher festgelegt war.`,
    // Wegmarke: Gepaarte Vergleiche der Regel: Live-Pfad gegen Zweig.
    marke: '1a-regel',
    stichpunkte: [
      `${d.vergleiche.length} Vergleiche, erst ohne Ergebnis`,
      `[Weiter] Grau = hält; Kontrolle ohne spaCy: ${kontrolle.length} Treffer, je wenige ms`,
      `[Weiter] Mit spaCy ${mitSpacy.length - v3b5Fehl.length} kleine Treffer: H1, H2 formal nicht bestätigt`,
      `[Weiter] V3, letzter Lauf: ${v3b5Abs.length} über ${abs} ms, bis +${fmt(d.v3Block5MaxDeltaMs)} ms`,
      `Summe ${fehlAlle.length} von ${d.vergleiche.length}; Regel bleibt, weil vorher festgelegt`,
    ],
    zeitS: 70,
    kurzfassung: true,
    aufbau: 3,
    quelle: q(
      `${H.datei} comparisons[] (relativePassed, absolutePassed, absoluteChangeMs); evidenz/1A/…/auswertung/live-vergleiche.csv; nachgerechnet aus durationSamplesMs (Nearest Rank), 0 Abweichungen`,
    ),
  });

  // ------------------------------------------------------------ N7 Ausreißer (explorativ, 2 Stufen)
  neu({
    id: 'N7',
    titel: 'Der Ausreißer dauerte rund zehn Sekunden',
    inhalt: flaeche(
      `<p class="folie-frage">${explorativ} Was geschah im letzten Lauf (V3, Block 5)?</p>` +
        grafikBox(ausreisserSvg(d)) +
        `<p class="beleg">Ursache offen: Rückstau der gedrosselten Analyse oder Ereignis auf Host und Datenbank; dagegen: V4 mit ${fmt(d.v4.ersatzTimeout)} Timeouts ohne Live-Effekt</p>`,
    ),
    notiz: `Was geschah im letzten Lauf? Nachträglich ausgewertet, deshalb das Etikett. Alle ${e.langsam.join} Beitritte über hundert Millisekunden liegen in einem Fenster von etwa zehn Sekunden; in den übrigen Läufen gibt es je Aktion höchstens ${e.langsamAndereMax} solchen Wert. [Weiter] Genau dort laufen die einzigen ${e.timeouts} Timeouts der gedrosselten Variante. [Weiter] Zugleich steigt die CPU der App auf ${fmt(e.appCpuMax)} Prozent einer CPU und die der Datenbank auf ${fmt(e.pgMax.max)} Prozent, sonst höchstens ${fmt(e.pgAndere[1])}. Die Ursache ist offen. Ein Rückstau der gedrosselten Analyse passt dazu, aber V4 hatte hunderte Timeouts ohne solchen Effekt; ebenso möglich ist ein Ereignis auf Host oder Datenbank. Zum Maßstab: ${d.live.laeufe} Läufe mit je ${fmt(k.profil.durationMs / 1000)} Sekunden Messfenster sind ${fmt((d.live.laeufe * k.profil.durationMs) / 60000)} Minuten; der Ausreißer betrifft davon etwa zehn Sekunden. Für die Entscheidung ändert das nichts.`,
    // Wegmarke: Ausreißer in V3 (gedrosseltes spaCy): Station spaCy, Wirkung als Ausschlag auf dem Live-Pfad.
    marke: '1a-wirkung',
    stichpunkte: [
      'Nachträglich ausgewertet, nicht vorab festgelegt',
      `${e.langsam.join} langsame Beitritte in ≈ 10 s; sonst je Aktion höchstens ${e.langsamAndereMax}`,
      `[Weiter] Zeitgleich die einzigen ${e.timeouts} Timeouts von V3, dann Gegendruck`,
      `[Weiter] App bis ${fmt(e.appCpuMax)} %, PostgreSQL bis ${fmt(e.pgMax.max)} % einer CPU`,
      'Ursache offen: Rückstau oder Host/DB; V4 spricht gegen Rückstau allein',
    ],
    zeitS: 50,
    kurzfassung: true,
    aufbau: 2,
    quelle: q(
      `${H.datei.replace('auswertung/auswertung.json', 'V3/block-05/lauf.json')} (live.actions.join.latency.durationSamplesMs, live.lifecycle.arrivals[].scheduledAtMs, analysis.analysis.calls[]), V3/block-05/ressourcen.json.gz (snapshots[].containers[].delta.cpuPercent); Vergleich mit allen übrigen Läufen; Zuordnung Stichprobe ↔ Ankunft ist eine Näherung (Abschlussreihenfolge)`,
    ),
  });

  // ------------------------------------------------------------ N9 Analysezeit und Ersatz
  neu({
    id: 'N9',
    titel: `Nach ${timeoutS} s liefert die App den Ersatz`,
    inhalt: flaeche(
      frage('Was sehen Lehrende, wenn spaCy langsam ist?', '1A') +
        grafikBox(analyseSvg(d)) +
        `<p class="beleg">V4: Proxy hat ${fmt(d.v4.weitergeleitet)} Anfragen weitergeleitet, geprüft werden Frist und Ersatz; ${fmt(d.v4.ersatzGegendruck)} Ersatzfälle durch Gegendruck</p>`,
    ),
    notiz: `Was sehen die Lehrenden? Die lexikalische Wortwolke ist in unter einer Zehntelsekunde da, mit spaCy im Normalbetrieb nach etwa einer halben Sekunde, gedrosselt nach zwei bis drei; das passt zur Drosselung von eben. In V4 greift nach rund fünf Sekunden der Timeout, und die App liefert den lexikalischen Ersatz; der Proxy hat keine Anfrage weitergeleitet, V4 prüft also Frist und Ersatz. ${fmt(d.v4.ersatzGegendruck)} Ersatzfälle meldet der Client als nicht erreichbar, je Lauf genau ${fmt(d.v4.gegendruckJeLauf)}: Das passt zur Grenze von zwei offenen Anfragen. Zur Reserve: Im Labor brauchte der ganze Stack weniger als eine halbe CPU von sechzehn, mindestens ${fmt(d.labor.minFreiGiBAb, 1)} Gibibyte blieben frei. Für den Zielhost habe ich das nicht gemessen.`,
    // Wegmarke: Nach 5 s liefert die App den Ersatz: Station Ersatz auf dem Zweig.
    marke: '1a-ersatz',
    stichpunkte: [
      'Lexikalisch < 0,1 s, spaCy ≈ 0,5 s, gedrosselt 2–3 s (passt zur Drosselung)',
      `V4: Ersatz nach ≈ ${timeoutS} s, Proxy hat ${fmt(d.v4.weitergeleitet)} weitergeleitet: prüft Frist und Ersatz`,
      `${fmt(d.v4.ersatzGegendruck)} „nicht erreichbar“, je Lauf ${fmt(d.v4.gegendruckJeLauf)} = Gegendruckgrenze (${k.maxInFlight} offen)`,
      `Reserve im Labor: < 0,5 CPU von ${H.cpus}, ≥ ${fmt(d.labor.minFreiGiBAb, 1)} GiB frei; Zielhost nicht gemessen`,
    ],
    zeitS: 55,
    kurzfassung: true,
    quelle: q(
      `${H.datei} runs[].analysis (successLatency, fallbackLatency, outcomes, fallbackReasons), runs[V4].proxy (delayMs, forwarded, cancelledBeforeForward; scope proxy-lifetime-including-warmup), runs[].resources[alias=spacy], runs[].collectorHost.minAvailableMemoryBytes (abgerundet); SIDECAR_UNAVAILABLE fasst Gegendruck und echte Unerreichbarkeit zusammen (apps/backend/src/lib/wordCloudNormalizer.ts, reasonFromSidecarError), Gegendruck daher erschlossen aus genau ${d.v4.gegendruckJeLauf} je Lauf; NLP_TIMEOUT_MS aus den Laufmanifesten; SPACY_MAX_IN_FLIGHT: apps/backend/src/lib/spacyClient.ts Z. 22, Prüfung Z. 187`,
    ),
  });

  // ------------------------------------------------------------ N10 Entscheidung
  const spalte = (kopf, farbe, punkte) =>
    `<div style="border-top:6px solid ${farbe};padding-top:12px">` +
    `<p style="margin:0 0 10px;font-weight:700;font-size:30px;color:${farbe}">${kopf}</p>` +
    `<ul style="margin:0;padding-left:28px;font-size:28px;line-height:1.36">${punkte.map((p) => `<li style="margin:0 0 12px">${p}</li>`).join('')}</ul></div>`;
  neu({
    id: 'N10',
    titel: 'Entscheidung: lexikalische Wortwolke bleibt',
    inhalt: flaeche(
      `<div style="display:grid;grid-template-columns:repeat(3,1fr);column-gap:44px">` +
        spalte('Entscheidung', 'var(--blau)', [
          `${mono('NLP_ENABLED=false')} bleibt, Standard in ${mono('.env.production.example')}`,
          `Für neue Versuche: Budget ${fmt(k.spacy.V2.cpu)}&nbsp;CPU, ${fmt(k.spacy.V2.speicherGiB)}&nbsp;GiB, ${fmt(k.spacy.V2.pids)}&nbsp;PIDs`,
          `${fmt(k.spacy.V3.cpu, 2)}&nbsp;CPU ist keine gleichwertige Einsparung`,
        ]) +
        spalte('Begründung', 'var(--tinte)', [
          `Regel verfehlt (${mitSpacyFehl} von ${mitSpacyGesamt}), Beweislast bei der Option`,
          'Deutlich schadet spaCy nur bei knapper CPU (V3)',
          'Nutzen nicht gemessen, Betrieb kostet Pflege',
        ]) +
        spalte('Grenzen', 'var(--bernstein-text)', [
          'Ein WSL2-Rechner, Lastgenerator auf demselben Host',
          'Beitrittswelle statt Dauerlast',
          'Kein Rendering, keine Aussage zu einem LLM',
        ]) +
        `</div>` +
        `<p class="merksatz"><b>Zur Diskussion:</b> Wie kalibriert man eine Regel, die schon ohne spaCy ${kontrolle.length}-mal anschlägt?</p>` +
        `<p class="uebergabe">Ein LLM rechnet rund ${fmt(LLM_MIN_WARM, 1)}&nbsp;min je Auftrag. Was, wenn wir die schwere Arbeit auslagern? <span class="uebergabe-ziel">→ Jonas ${etikett('1C')} ${etikett('1B')}</span></p>`,
    ),
    notiz: `Meine Entscheidung ist die Gegenalternative aus dem Vertrag: keine Freigabe, spaCy bleibt aus, wie es die Produktionsvorlage ohnehin vorsieht. Das kostet im Betrieb nichts. Die Begründung: Die vorab festgelegte Regel ist verfehlt, und eine optionale Komponente muss ihre Unschädlichkeit belegen, nicht umgekehrt. Den Nutzen, zusammengeführte Wortformen, habe ich nicht gemessen; dagegen stehen Image, Modell, Limits und Überwachung. Ein Viertel CPU ist keine gleichwertige Einsparung. Die Grenzen: ein WSL2-Rechner mit dem Lastgenerator auf demselben Host und eine Beitrittswelle. Selbstkritisch: Die Regel war für p95-Werte um zwanzig Millisekunden zu empfindlich; für einen neuen Versuch würde ich sie an einem Vergleich ohne Änderung kalibrieren. Und spaCy ist klein: Ein Sprachmodell rechnet in Jonas' Labor rund zweieinhalb Minuten je Auftrag, das trägt der App-Host nicht. Was, wenn wir diese schwere Arbeit auslagern? Das zeigt Jonas.`,
    stichpunkte: [
      'Keine Freigabe, NLP_ENABLED=false bleibt (Standard, kostet nichts)',
      `Regel verfehlt (${mitSpacyFehl}/${mitSpacyGesamt}), Beweislast bei der Option, Nutzen ungemessen`,
      'Budget 1 CPU / 1 GiB für neue Versuche; 0,25 CPU keine Einsparung',
      'Grenzen: ein WSL2-Host mit Generator, Beitrittswelle',
      'Selbstkritik: Regel zu empfindlich, künftig ohne Änderung kalibrieren',
      `„Was, wenn wir die schwere Arbeit auslagern?“ LLM ≈ ${fmt(LLM_MIN_WARM, 1)} min je Auftrag → Jonas`,
    ],
    zeitS: 65,
    kurzfassung: true,
    // Wegmarke: Entscheidung über das Ergebnis des Zweigs (lexikalische Wortwolke bleibt): Ende des Zweigs.
    marke: '1a-wortwolke',
    quelle: q(
      `1A-auswertung.md (Entscheidung, Budget und Rückweg, Grenzen); 1A-Versuchsvertrag (Gegenalternative); ${H.datei} hypotheses; NLP_ENABLED=false: .env.production.example Z. 205 (docker-compose.prod.yml liest es von dort, Default false); LLM-Dauer: 1B-ergebnis.md, warm im Median 148,6 s je Auftrag (ThinkPad P50, Commit 8e9d1317) ≈ 2,5 min`,
    ),
  });

  // ------------------------------------------------------------ N3 Versuchsaufbau (bis 2026-11-16 Reserve RN3)
  const VAR = [
    ['V0', 'Live-Last ohne Analyse', ''],
    ['V1', 'Analyse lexikalisch, spaCy aus', 'Basis'],
    ['V2', `spaCy normal: ${fmt(k.spacy.V2.cpu)} CPU`, 'H1'],
    ['V3', `spaCy gedrosselt: ${fmt(k.spacy.V3.cpu, 2)} CPU`, 'H2'],
    ['V4', `spaCy hinter Proxy: +${proxyS} s, Timeout ${timeoutS} s`, 'H2'],
  ];
  neu({
    id: 'N3',
    titel: 'Fünf Varianten, je Block gemischt',
    // Wegmarke: Fünf Varianten unterscheiden sich nur in spaCy (aus, normal, gedrosselt, hinter Proxy): Station spaCy.
    marke: '1a-spacy',
    zeitS: 45,
    inhalt: flaeche(
      `<table style="border-collapse:collapse;font-size:28px;width:100%;margin:0 0 12px">` +
        VAR.map(
          ([v, t, h]) =>
            `<tr style="border-top:var(--linie-min) solid var(--linie)"><td style="padding:7px 18px 7px 0;font-weight:700;width:80px">${v}</td><td style="padding:7px 0">${t}</td><td style="padding:7px 0 7px 18px;color:${h === 'Basis' ? 'var(--blau)' : 'var(--gedaempft)'};font-size:var(--s-min);font-weight:600;text-align:right">${h}</td></tr>`,
        ).join('') +
        `</table>` +
        grafikBox(profilSvg(d)) +
        `<p class="beleg">${VARIANTEN.length} Varianten × 5 Blöcke = ${d.live.laeufe} Läufe; Reihenfolge je Block per Seed gemischt; Daten und Last in jedem Lauf gleich</p>`,
    ),
    notiz: `Ich vergleiche fünf Varianten. V0 ist nur Live-Last. V1 ruft zusätzlich die Analyse auf, aber mit spaCy aus, also lexikalisch; das ist meine Basis. V2 ist spaCy im Normalbetrieb mit einer CPU, V3 gedrosselt auf ein Viertel CPU, und in V4 sitzt ein Proxy vor spaCy, der sechs Sekunden verzögert, länger als der Timeout von fünf Sekunden. Jeder Lauf hat dasselbe Profil: eine Minute Aufwärmen, dann fünf Minuten Messfenster mit fünfhundert Beitritten in neunzig Sekunden, und fünf Lehrende rufen alle zehn Sekunden die Analyse ab. Jede Variante läuft in fünf Blöcken, innerhalb eines Blocks in zufälliger Reihenfolge. Verglichen wird nur innerhalb desselben Blocks. So wird Laufrauschen sichtbar, statt sich in einem einzigen Lauf zu verstecken.`,
    stichpunkte: [
      'V0 nur Live-Last, V1 Analyse ohne spaCy = Basis',
      `V2 spaCy 1 CPU, V3 0,25 CPU, V4 Proxy +${proxyS} s hinter Timeout ${timeoutS} s`,
      `Profil: 60 s warm, 300 s Fenster, ${fmt(k.profil.participants)} Beitritte in 90 s, Analyse alle 2 s`,
      `5 Blöcke, Reihenfolge gemischt, Vergleich nur im selben Block`,
      'Ziel: Rauschen sichtbar machen, nicht verstecken',
    ],
    quelle: q(
      `1A-Versuchsvertrag (Varianten, Lastprofil); ${H.datei.replace('auswertung/auswertung.json', 'plan.json')} (profile, runs, Seed ${k.seed}); Laufmanifeste (Limits, NLP_TIMEOUT_MS), auswertung.json runs[V4].proxy.delayMs`,
    ),
  });

  // ------------------------------------------------------------ N8 Ressourcen (bis 2026-11-16 Reserve RN4)
  neu({
    id: 'N8',
    titel: 'spaCy bleibt im Budget, bis CPU fehlt',
    // Wegmarke: CPU und Speicher des spaCy-Containers: Station spaCy.
    marke: '1a-spacy',
    zeitS: 45,
    inhalt: flaeche(
      grafikBox(ressourcenSvg(d)) +
        `<p class="beleg">Labor: alle Container zusammen ${spanne(
          d.labor.containerCpuProzent.map((x) => x / 100),
          1,
        )} CPU von ${H.cpus}, mindestens ${fmt(d.labor.minFreiGiBAb, 1)} GiB frei; spaCy V2 ohne OOM</p>`,
    ),
    notiz: `Links gedrosselte CPU-Perioden, rechts die Speicherspitze. Im Normalbetrieb braucht spaCy rund ${fmt(d.v2.cpuProzent[0])} Prozent einer CPU, wird in unter einem Prozent der Perioden gedrosselt und kommt auf etwa ${fmt(d.v2.ramMiB[0])} Mebibyte, weit unter der Schwelle. Gedrosselt auf ein Viertel CPU verbraucht es fast die ganze Quote. Als Bild: Der Kernel teilt die Zeit in Takte von hundert Millisekunden, und spaCy darf in jedem Takt nur ein Viertel davon rechnen. In ${spanne(d.v3.drosselProzent)} Prozent der Takte war dieses Viertel aufgebraucht, bevor die Arbeit fertig war; spaCy wartete fast immer auf den nächsten Takt. Zur Reserve: Alle Container zusammen brauchten weniger als eine halbe CPU von sechzehn, mindestens ${fmt(d.labor.minFreiGiBAb, 1)} Gibibyte blieben frei. Das schützt die Latenz nicht automatisch; den Zielhost habe ich nicht gemessen.`,
    stichpunkte: [
      `V2: ≈ ${fmt(d.v2.cpuProzent[0])} % einer CPU, < 1 % gedrosselt, ≈ ${fmt(d.v2.ramMiB[0])} MiB`,
      `V3: ${fmt(d.v3.cpuProzent[0])}–${fmt(d.v3.cpuProzent[1])} % bei Quote 25 % → ${spanne(d.v3.drosselProzent)} % gedrosselt`,
      'Bild: je 100-ms-Takt nur ein Viertel rechnen; fast immer aufgebraucht',
      `Reserve im Labor: < 0,5 CPU von ${H.cpus}, ≥ ${fmt(d.labor.minFreiGiBAb, 1)} GiB frei`,
      'Reserve groß, schützt Latenz aber nicht; 8-vCPU-Zielhost nicht gemessen',
    ],
    quelle: q(
      `${H.datei} runs[].resources[alias=spacy] (cpuPercent, throttledPeriodRatio aus cpu.stat, lifetimePeakMemoryBytes aus memory.peak, oomKillDelta), runs[].resources[].cpuPercent (Summe je Lauf), runs[].collectorHost.minAvailableMemoryBytes; Takt von cpu.max: Kernel-Doku cgroup v2, Abschn. „CPU Interface Files“ (Standard „max 100000“, also 100 ms)`,
    ),
  });

  // Kurzbelege in die Fußzeile (wie Jonas' Folien), eine Zeile
  for (const f of F) {
    const z = ZITATE[f.id];
    if (!z) throw new Error(`${f.id}: keine Kurzbelege`);
    f.fuss = `Quelle: ${z.map(([sl, st]) => kurzbeleg1A(sl, st).slice(1, -1)).join('; ')}`;
  }

  // ------------------------------------------------------------ Anhang: Literatur 1A
  F.push({
    id: 'NL',
    teil: 'niklas',
    anhang: true,
    auftrag: '1A',
    titel: 'Literaturverzeichnis 1A',
    inhalt: flaeche(
      `<!--quellen--><ul data-literatur style="margin:0;padding:0;list-style:none;columns:2;column-gap:56px;font-size:19px;line-height:1.3">` +
        LITERATUR_1A.map(
          (x) =>
            `<li style="break-inside:avoid;margin:0 0 10px;padding-left:28px;text-indent:-28px;overflow-wrap:anywhere">${x.voll}</li>`,
        ).join('') +
        `</ul><!--/quellen-->`,
    ),
    notiz:
      'Literaturverzeichnis zu 1A nach dem IU-Zitierleitfaden; dieselben Einträge wie im Handout.',
    stichpunkte: [],
    zeitS: 0,
    kurzfassung: false,
    quelle: 'abgabe/niklas/literatur-1a.mjs, Schlüssel wie in Niklas’ main.bib (PaperLab)',
    fuss: 'Kurzbelege auf den Folien nach IU-Zitierleitfaden; Einträge wie im Handout',
    station: null,
  });

  // ------------------------------------------------------------ Reserve
  const reserve = (f) => {
    const z = ZITATE[f.id];
    F.push({
      teil: 'reserve',
      autor: 'niklas',
      auftrag: '1A',
      zeitS: 0,
      kurzfassung: false,
      station: null,
      ...f,
      inhalt: f.inhalt.startsWith('<div class="flaeche-inhalt">') ? f.inhalt : flaeche(f.inhalt),
      fuss: `Quelle: ${z.map(([sl, st]) => kurzbeleg1A(sl, st).slice(1, -1)).join('; ')}`,
    });
  };
  const g = e.gepoolt;
  const aktionZeile = ([key, name]) =>
    `<tr style="border-top:var(--linie-min) solid var(--linie)"><td style="padding:8px 14px 8px 0;font-weight:700">${name}</td>` +
    ['V0', 'V1', 'V2']
      .map(
        (v) =>
          `<td class="mono" style="padding:8px 14px;text-align:right">${fmt(g[v][key].p95, 1)}</td>`,
      )
      .join('') +
    `<td class="mono" style="padding:8px 0 8px 14px;text-align:right;color:var(--gedaempft)">${spanne(e.streuung.V2[key], 1)}</td></tr>`;
  const abweichung = e.abweichungV2V1;
  const abwText = `${fmt(abweichung[0], 1)} bis +${fmt(abweichung[1], 1)}`;
  const zufallsChance = e.zufallsChance;
  neu({
    id: 'N6b',
    titel: 'Die Regel schlägt auch ohne Wirkung an',
    // Wegmarke: Empfindlichkeit der Regel (Kontrolle ohne spaCy schlägt an): Live-Pfad gegen Zweig.
    marke: '1a-regel',
    zeitS: 45,
    fuss: `Quelle: ${ZITATE.N6b.map(([sl, st]) => kurzbeleg1A(sl, st).slice(1, -1)).join('; ')}`,
    inhalt: flaeche(
      `<p class="folie-frage">${explorativ} Wie empfindlich ist die Regel?</p>` +
        zweiSpalten(
          `<table style="border-collapse:collapse;font-size:28px;width:100%">` +
            `<tr style="color:var(--gedaempft);font-size:var(--s-min)"><td></td><td style="text-align:right;padding:0 14px">V0</td><td style="text-align:right;padding:0 14px">V1</td><td style="text-align:right;padding:0 14px">V2</td><td style="text-align:right;padding-left:14px">V2 je Lauf</td></tr>` +
            AKTIONEN.map(aktionZeile).join('') +
            `</table><p class="vermerk">p95 in ms, alle 5 Blöcke gepoolt (n = ${fmt(g.V1.join.n)}, Q&amp;A ${fmt(g.V1.qaSubmit.n)})</p>`,
          zahl({
            wert: `${kontrolle.length}`,
            einheit: `/ ${d.h1.gesamt}`,
            was: 'Treffer der Kontrolle ohne spaCy',
            gruppe: 'nachträglich ausgewertet, grobe Rechnung',
            linie: 'var(--bernstein)',
            gross: 84,
          }) +
            `<p class="sekundaer">Wären die Vergleiche unabhängig, bestünde eine wirkungslose Komponente alle ${d.h1.gesamt} nur mit etwa ${fmt(zufallsChance * 100)} %.</p>`,
          820,
        ) +
        `<p class="beleg">Gepoolt weicht V2 von V1 um ${abwText} ms ab; grobe Rechnung, kein vorab festgelegter Test</p>`,
    ),
    notiz: `Warum schlägt die Regel so oft an? Nachträglich ausgewertet: Gepoolt über alle fünf Blöcke weicht spaCy im Normalbetrieb um ${abwText} Millisekunden von der Basis ab, also praktisch nicht. Die Lauf-p95 streuen innerhalb derselben Variante stärker, beim Beitritt in V2 zwischen ${spanne(e.streuung.V2.join)} Millisekunden. Die Kontrolle ohne spaCy verfehlt die Regel ${kontrolle.length} von ${d.h1.gesamt} Mal. Wären die Vergleiche unabhängig, bestünde selbst eine wirkungslose Komponente alle ${d.h1.gesamt} nur mit etwa ${fmt(zufallsChance * 100)} Prozent. Für einen neuen Versuch würde ich die Regel deshalb an einem Vergleich ohne Änderung kalibrieren, für diesen Versuch gilt sie.`,
    stichpunkte: [
      `Nachträglich: gepoolt V2 − V1 = ${abwText} ms`,
      `Streuung je Variante > Effekt (V2 Beitritt ${spanne(e.streuung.V2.join)} ms)`,
      `Kontrolle ${kontrolle.length}/${d.h1.gesamt}; wirkungslos besteht nur ≈ ${fmt(zufallsChance * 100)} %`,
      'Künftig ohne Änderung kalibrieren; hier gilt die Regel',
    ],
    quelle: q(
      `alle ${d.live.laeufe} lauf.json (live.actions.<aktion>.latency.durationSamplesMs), Nearest Rank gepoolt; Kontrolle: comparisons[variant=V1]; Unabhängigkeit ist eine grobe Annahme`,
    ),
  });
  reserve({
    id: 'RN2',
    titel: 'Reserve: Was die Messung nicht zeigt',
    inhalt: zweiSpalten(
      `<p style="margin:0 0 12px;font-weight:700;font-size:28px">Grenzen des Labors</p>` +
        `<ul style="margin:0;padding-left:28px;font-size:24px;line-height:1.36">` +
        [
          `Ein WSL2-Rechner mit ${H.cpus} logischen CPUs statt Zielhost mit 8 vCPU`,
          'Lastgenerator auf demselben Rechner: Latenz enthält Clientarbeit',
          'Beitrittswelle, keine 500 dauerhaft aktiven Clients',
          'Synthetischer Korpus mit kleinem Wortschatz',
          'Kein Rendering, keine Kompassanzeige, keine Aussage zu einem LLM',
          `Gemessen auf einem Stand nach v1.4.0 (${H.commit}) statt Tag v1.3.0, nach Freigabe des Prüfers`,
        ]
          .map((p) => `<li style="margin:0 0 8px">${p}</li>`)
          .join('') +
        `</ul>`,
      `<p style="margin:0 0 12px;font-weight:700;font-size:28px">Eigenanteil und KI</p>` +
        `<ul style="margin:0;padding-left:28px;font-size:24px;line-height:1.36">` +
        [
          'Niklas: Auftrag, Labor, reale Messung, Freigaben, Deutung',
          'OpenAI Codex: Umsetzung der Werkzeuge, Tests, Auswertung, Entwürfe',
          'Folien im gemeinsamen Deck: mit Claude Code gebaut, Inhalt verantwortet Niklas',
        ]
          .map((p) => `<li style="margin:0 0 8px">${p}</li>`)
          .join('') +
        `</ul>`,
      760,
    ),
    notiz:
      'Falls nach Gültigkeit oder Eigenanteil gefragt wird. Alle Zahlen gelten für dieses Labor: ein WSL2-Rechner mit dem Lastgenerator auf demselben Host, eine Beitrittswelle, ein synthetischer Korpus. Über Rendering, die Kompassanzeige und ein LLM sage ich nichts. Gemessen habe ich einen Stand nach Version 1.4.0, weil der Prüfer das Aktualisieren des Forks freigegeben hat. Werkzeuge, Tests und Auswertung hat Codex umgesetzt; Auftrag, Labor, Messung, Freigaben und die Deutung sind meine.',
    stichpunkte: [
      'Ein WSL2-Host, Generator auf demselben Host',
      'Beitrittswelle, synthetischer Korpus; kein Rendering, kein LLM',
      'Stand nach v1.4.0, Freigabe des Prüfers (E-Mail 04.11.)',
      'KI: Codex für Werkzeuge und Auswertung; Messung und Deutung bei Niklas',
    ],
    quelle: `1A-auswertung.md (Grenzen), 1A-eigenanteil.md, 00-rahmen-und-pruefung.md (Freigabe des aktuellen main) · ${umgebung}`,
  });
  // Vortragsreihenfolge: N3 und N8 (bis 2026-11-16 RN3, RN4) und N6b (bis dahin RN1) an ihrer Stelle.
  const ORDNUNG = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N6b', 'N7', 'N8', 'N9', 'N10'];
  const rang = (f) => (ORDNUNG.includes(f.id) ? ORDNUNG.indexOf(f.id) : ORDNUNG.length);
  return F.map((f, i) => [f, i])
    .sort((a, b) => rang(a[0]) - rang(b[0]) || a[1] - b[1])
    .map(([f]) => f);
}
