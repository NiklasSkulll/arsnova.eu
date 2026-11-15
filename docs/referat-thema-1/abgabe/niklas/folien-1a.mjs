// ENTWURF von Jonas für Niklas' Teil 1A im Stil des gemeinsamen Decks (zur Besprechung, nicht
// abgestimmt). Inhalt und Befunde folgen Niklas' Folien (abgabe/vorlagen/folien.html) und seinem
// Versuchsvertrag; jede Zahl kommt aus daten-1a.mjs, also aus seiner auswertung.json. Neu sind nur
// Anordnung, Grafiken, Kurzbelege nach ZL und die Sprechnotizen.

import {
  entwurf,
  etikett,
  flaeche,
  frage,
  grafikBox,
  liste,
  mono,
  zahl,
  zweiSpalten,
} from '../jonas/folien.mjs';
import { fmt } from '../jonas/zahlen.mjs';
import { ressourcenSvg, vergleichsMatrixSvg } from './grafik-1a.mjs';
import { LITERATUR_1A, kurzbeleg1A } from './literatur-1a.mjs';

const MESS = ['schneider2026a', 'auswertung.json'];
const VERTRAG = (abschn) => ['schneider2026b', abschn];

/** Kurzbelege je Folie (ZL Anhang B). */
const ZITATE = {
  N1: [['arsnova2026pruefung', 'Abschn. 4.3, Gruppenauftrag 1A'], MESS],
  N2: [
    ['arsnova2026adr0035'],
    ['dean2013', 'S. 74'],
    VERTRAG('Abschn. „Konstante Umgebung und Daten“'),
  ],
  N3: [
    VERTRAG('Abschn. „Varianten“, „Lastprofil und Zeitablauf“'),
    ['papadopoulos2021', 'Kap. 2.3'],
  ],
  N4: [VERTRAG('Abschn. „Messgrößen und Entscheidungsregeln“'), ['dean2013', 'S. 74']],
  N5: [MESS, ['schneider2026a', 'live-vergleiche.csv']],
  N6: [MESS, ['heo2015', 'Abschn. „CPU Interface Files“, „Memory Interface Files“']],
  N7: [MESS, VERTRAG('Abschn. „Varianten“'), ['ulrich2016', 'Abschn. „Picking a deadline“']],
  N8: [MESS, VERTRAG('Abschn. „Fragestellung, Hypothesen und Gegenalternative“')],
};

const spanneMs = ([a, b], stellen = 0) => `${fmt(a, stellen)}–${fmt(b, stellen)}`;

/** Folien N1–N9 in Vortragsreihenfolge; Felder wie folien() in jonas/folien.mjs. */
export function folien1A(d) {
  const H = d.herkunft;
  const umgebung = `WSL2, ${H.cpus} logische CPUs · Reihe 15.11.2026 · ${H.commit}`;
  const s = d.schwellen;
  const rel = fmt(s.relativ * 100);
  const abs = fmt(s.absolutMs);
  const fehlAlle = d.vergleiche.filter((x) => !x.bestanden);
  const kontrolle = fehlAlle.filter((x) => x.variante === 'V1');
  const klein = fehlAlle.filter((x) => !(x.variante === 'V3' && x.block === 5));
  const kleinMax = Math.max(...klein.map((x) => x.deltaMs));
  const F = [];
  const neu = (id, titel, inhalt, notiz, zeitS, fuss) =>
    F.push({
      id,
      teil: 'niklas',
      auftrag: '1A',
      titel,
      inhalt,
      notiz,
      zeitS,
      kurzfassung: true,
      quelle: H.datei,
      fuss,
      station: null,
    });

  neu(
    'N1',
    'Wie viel optionale Analyse verträgt der App-Host?',
    flaeche(
      entwurf +
        frage('Darf die spaCy-Glättung der Wortwolke neben den Live-Aktionen laufen?', '1A') +
        zweiSpalten(
          `<p style="margin:0 0 36px;font-size:42px;line-height:1.25;font-weight:700">Nein, noch nicht. Im Normalbetrieb bleibt spaCy im Budget, doch die vorab festgelegte Regel hält nicht in allen Blöcken.</p>` +
            `<p style="margin:0;font-size:32px;line-height:1.35;padding-left:18px;border-left:6px solid var(--blau)">Entscheidung: ${mono('NLP_ENABLED=false')} bleibt, die lexikalische Wortwolke reicht.</p>`,
          zahl({
            wert: `${d.h1.fehl + d.h2.fehl}`,
            einheit: `/ ${d.h1.gesamt + d.h2.gesamt}`,
            was: 'Vergleiche mit spaCy verfehlen die Regel',
            gruppe: `H1 ${d.h1.fehl}/${d.h1.gesamt}, H2 ${d.h2.fehl}/${d.h2.gesamt}; 5 Blöcke je Variante`,
            linie: 'var(--rot)',
            gross: 96,
          }) +
            zahl({
              wert: fmt(d.live.erfolgreich),
              einheit: `/ ${fmt(d.live.geplant)}`,
              was: 'Live-Aktionen erfolgreich',
              gruppe: 'alle 25 Läufe, keine Fehlversuche',
              gross: 96,
            }),
          760,
        ),
    ),
    'Ich bin Niklas Schneider und habe untersucht, ob der App-Host von arsnova.eu die optionale spaCy-Glättung der Wortwolke neben den Live-Aktionen tragen kann. Kurz: nein, noch nicht. Im Normalbetrieb bleibt spaCy in seinem Budget, aber die Regel, die ich vor der Messung festgelegt habe, hält nicht in allen Blöcken. Deshalb bleibt spaCy aus.',
    40,
    `${umgebung}`,
  );

  neu(
    'N2',
    'Was auf dem App-Host konkurriert',
    flaeche(
      frage('Welche Arbeit teilt sich den Host mit den Live-Aktionen?', '1A') +
        `<div style="display:grid;grid-template-columns:repeat(5,1fr);column-gap:18px;font-size:26px;line-height:1.3">` +
        [
          ['App (Backend)', 'Live-Aktionen, Kontextaufbau 8.9b', 'ohne Limit', false],
          ['PostgreSQL', 'Sitzungsdaten', 'ohne Limit', false],
          ['Redis', 'Pub/Sub, Cache', 'ohne Limit', false],
          ['PDF-Worker', 'aktiv', 'ohne Limit', false],
          ['spaCy-Sidecar', 'Glättung der Wortwolke', '1 CPU · 1 GiB · 64 PIDs, kein Netz', true],
        ]
          .map(
            ([n, rolle, limit, hervor]) =>
              `<div style="border:${hervor ? '3px solid var(--blau)' : 'var(--linie-min) solid var(--linie)'};border-radius:10px;padding:18px 16px;${hervor ? 'background:#eef5fc' : ''}">` +
              `<b>${n}</b><p style="margin:8px 0 0;color:var(--text-2)">${rolle}</p>` +
              `<p class="mono" style="margin:12px 0 0;font-size:var(--s-min);white-space:normal;color:${hervor ? 'var(--blau)' : 'var(--gedaempft)'}">${limit}</p></div>`,
          )
          .join('') +
        `</div>` +
        `<p style="margin:28px 0 0;font-size:26px;line-height:1.35">Nicht Teil von 1A: Encoder (aus) und die generative Inferenz, die nach ADR-0035 auf einem eigenen Host läuft ${etikett('1B')}. Ein Ergebnis zu spaCy sagt nichts über die Tragfähigkeit eines LLM.</p>` +
        `<p class="beleg">Limits wie in der geprüften Produktions-Compose; Lastgenerator auf demselben Rechner</p>`,
    ),
    'Auf dem App-Host laufen Backend, PostgreSQL, Redis und der PDF-Worker ohne eigene Limits. Dazu kommt der spaCy-Sidecar, der Flexionsformen in der Wortwolke zusammenführt; er hat wie in der Produktions-Compose eine CPU, ein Gibibyte und 64 Prozesse und kein Netz. Rechenintensive Nebenarbeit kann die Latenz interaktiver Dienste stören, genau das prüfe ich. Die generative Inferenz liegt nach ADR-0035 auf einem eigenen Host, das ist Jonas’ und mein Teil 1B.',
    45,
    `Produktions-Compose · ${umgebung}`,
  );

  neu(
    'N3',
    'Fünf Varianten, fünf gepaarte Blöcke',
    flaeche(
      frage('Wie trenne ich den Effekt von spaCy vom Rauschen?', '1A') +
        zweiSpalten(
          `<table style="border-collapse:collapse;font-size:30px;width:100%">` +
            [
              ['V0', 'Live-Last ohne Analyse'],
              ['V1', 'mit Analyse, spaCy aus (lexikalisch)', 'Basis'],
              ['V2', 'spaCy normal: 1 CPU, 1 GiB', 'H1'],
              ['V3', 'spaCy gedrosselt: 0,25 CPU', 'H2'],
              ['V4', 'spaCy hinter Proxy: 6 s Verzögerung, 5 s Timeout', 'H2'],
            ]
              .map(
                ([v, t, h]) =>
                  `<tr style="border-top:var(--linie-min) solid var(--linie)"><td style="padding:18px 18px 18px 0;font-weight:700">${v}</td><td style="padding:18px 0">${t}</td><td style="padding:12px 0 12px 18px;color:var(--gedaempft);font-size:var(--s-min)">${h ?? ''}</td></tr>`,
              )
              .join('') +
            `</table>`,
          liste(
            [
              '5 Blöcke, darin jede Variante einmal, Reihenfolge per Seed gemischt',
              '60 s Aufwärmen, 300 s Messfenster',
              '500 Beitritte in 90 s, je Person Quiz- und Tempostimme, jede fünfte eine Q&amp;A-Frage',
              '5 Lehrende rufen alle 10 s die Analyse ab',
            ],
            30,
          ),
          700,
        ),
    ),
    'Ich vergleiche fünf Varianten. V0 ist Live-Last ohne Analyse, V1 ruft die Analyse auf, aber ohne spaCy; das ist meine Basis. V2 ist spaCy im Normalbetrieb, V3 gedrosselt auf ein Viertel CPU, V4 hängt hinter einem Proxy, der sechs Sekunden verzögert, länger als der Timeout von fünf Sekunden. Jede Variante läuft in fünf Blöcken, die Reihenfolge ist zufällig gemischt, und ich vergleiche immer innerhalb desselben Blocks. Wiederholung und gepaarter Vergleich sollen Laufschwankungen sichtbar machen statt sie zu verstecken.',
    50,
    `Versuchsvertrag V2 · ${umgebung}`,
  );

  neu(
    'N4',
    'Die Regel stand vor der Messung fest',
    flaeche(
      frage('Wann ist spaCy für die Live-Aktionen unschädlich?', '1A') +
        `<div style="font-size:36px;line-height:1.35;padding:24px 28px;border-left:6px solid var(--blau);background:#eef5fc;margin:0 0 36px">Je Aktion und Block darf der p95 gegenüber V1 um höchstens <b>${rel} %</b> <b>und</b> höchstens <b>${abs} ms</b> steigen.</div>` +
        liste(
          [
            `Fehler und fehlende geplante Aktionen je höchstens ${fmt(s.fehler * 100, 1)} %`,
            `Quizstimme absolut: p95 höchstens ${fmt(s.quizZielMs)} ms`,
            `spaCy: höchstens ${fmt(s.drosselung * 100)} % gedrosselte Perioden, Speicher höchstens ${fmt(s.speicher * 100)} % von 1 GiB, kein OOM`,
            'Alle fünf Blöcke müssen bestehen; kein Ausreißer wird entfernt',
          ],
          32,
        ),
    ),
    'Die Regel habe ich vor den bestätigenden Läufen im Versuchsvertrag festgehalten. Je Aktion und Block darf der p95 gegenüber V1 höchstens zehn Prozent und höchstens fünfzig Millisekunden steigen, beides muss gelten. Ich schaue auf den p95, weil gerade die langsamen Anfragen die Nutzer treffen. Dazu kommen Fehlergrenzen und eigene Grenzen für spaCy: Drosselung, Speicher, kein OOM. Alle fünf Blöcke müssen bestehen, und ich entferne keine Ausreißer.',
    45,
    `Versuchsvertrag V2, Schwellen vor den bestätigenden Läufen eingefroren · ${H.commit}`,
  );

  neu(
    'N5',
    'Deutlich verletzt nur V3 in Block 5',
    flaeche(
      frage(
        `Wo verfehlen ${fehlAlle.length} von ${d.vergleiche.length} gepaarten Vergleichen die Regel?`,
        '1A',
      ) + grafikBox(vergleichsMatrixSvg(d)),
    ),
    `Hier sind alle ${d.vergleiche.length} gepaarten Vergleiche. Grau hält, Bernstein verfehlt nur die Zehn-Prozent-Regel, Rot auch die fünfzig Millisekunden. Mit spaCy verfehlen ${d.h1.fehl + d.h2.fehl} von ${d.h1.gesamt + d.h2.gesamt} Vergleichen die Regel, also sind H1 und H2 nicht bestätigt. Deutlich ist nur V3 in Block 5, mit bis zu ${fmt(d.v3Block5MaxDeltaMs)} Millisekunden mehr. Die übrigen ${klein.length} Verletzungen liegen unter ${fmt(Math.ceil(kleinMax))} Millisekunden, und ${kontrolle.length} davon stehen in der Kontrollzeile ganz ohne spaCy. Bei p95-Werten um zwanzig Millisekunden reißt die relative Regel also schon durch kleine Schwankungen. Ich lasse die Regel trotzdem so stehen, weil sie vorher festgelegt war.`,
    60,
    `${d.vergleiche.length} gepaarte Vergleiche · ${umgebung}`,
  );

  neu(
    'N6',
    'spaCy bleibt im Budget, gedrosselt nicht',
    flaeche(
      grafikBox(ressourcenSvg(d)) +
        `<p class="beleg">V2: ${spanneMs(d.v2.ramMiB)} MiB Spitze, ${spanneMs(d.v2.cpuProzent)} % einer CPU, ${spanneMs(d.v2.drosselProzent, 1)} % gedrosselt, ${d.v2.erfolg}/${d.analyseGeplantJeVariante} Analysen erfolgreich, kein OOM. Speicherspitzen einschließlich Aufwärmen</p>`,
    ),
    `Links die Drosselung, rechts der Speicher von spaCy, ein Punkt je Block. Im Normalbetrieb V2 ist spaCy unter einem Prozent der Perioden gedrosselt und braucht rund 480 Mebibyte, weit unter der Schwelle von achtzig Prozent. Gedrosselt auf ein Viertel CPU, V3, sind es ${spanneMs(d.v3.drosselProzent)} Prozent; genau dort steigt in Block 5 auch die Live-Latenz. In V4 rechnet spaCy gar nicht, dazu gleich mehr. Gemessen über die cgroup-v2-Zähler des Containers.`,
    50,
    `cgroup v2, Spitzen nicht subtrahiert · ${umgebung}`,
  );

  neu(
    'N7',
    'Langsame Analyse, Ersatz statt Ausfall',
    flaeche(
      frage('Was sehen Lehrende, wenn spaCy langsam ist?', '1A') +
        zweiSpalten(
          zahl({
            wert: spanneMs(
              d.v3.analyseP95Ms.map((x) => x / 1000),
              1,
            ),
            einheit: 's',
            was: `V3: Analyse-p95 je Block (V2: ${spanneMs(
              d.v2.analyseP95Ms.map((x) => x / 1000),
              1,
            )} s)`,
            gruppe: `${d.v3.erfolg} von ${d.analyseGeplantJeVariante} erfolgreich, ${d.v3.ersatz} Ersatz, ${d.v3.offen} bei Fensterende offen`,
            linie: 'var(--rot)',
            gross: 72,
          }),
          zahl({
            wert: fmt(d.v4.ersatz),
            einheit: `/ ${d.analyseGeplantJeVariante}`,
            was: 'V4: Analysen mit lexikalischem Ersatz',
            gruppe: `Ersatz nach ${spanneMs(
              d.v4.ersatzP95Ms.map((x) => x / 1000),
              2,
            )} s (p95), ${d.v4.offen} offen; Proxy leitete ${d.v4.weitergeleitet} Anfragen weiter`,
            linie: 'var(--bernstein)',
            gross: 72,
          }),
          640,
        ) +
        `<p style="margin:10px 0 0;font-size:28px;line-height:1.35;padding-left:18px;border-left:6px solid var(--blau)">V4 belegt den Timeout- und Ersatzpfad, nicht ein langsam rechnendes spaCy: Der Client bricht nach 5 s ab, bevor der Proxy nach 6 s weiterleitet.</p>`,
    ),
    `Für die Lehrenden heißt das: Gedrosselt dauert die Analyse im p95 zwei bis drei Sekunden statt einer halben, fast alle kommen noch an. Mit Timeout in V4 greift nach rund fünf Sekunden der lexikalische Ersatz, ${d.v4.ersatz} von ${d.analyseGeplantJeVariante} Mal. Wichtig: Der Proxy hat keine einzige Anfrage weitergeleitet, weil der Client vorher abbricht. V4 testet also den Timeout- und Ersatzpfad der App, nicht spaCy unter Last. Eine Frist unterhalb der Verzögerung ist genau dafür gedacht, dass Arbeit nicht endlos wartet.`,
    50,
    `Analyse-Einzelaufrufe und Proxyzähler · ${umgebung}`,
  );

  neu(
    'N8',
    'Entscheidung: lexikalische Wortwolke beibehalten',
    flaeche(
      `<div style="display:grid;grid-template-columns:1fr;row-gap:14px;font-size:28px;line-height:1.35">` +
        `<p style="margin:0;padding-left:18px;border-left:6px solid var(--blau)">${mono('NLP_ENABLED=false')} bleibt; keine Freigabe durch nachträglich weichere Kriterien</p>` +
        `<p style="margin:0;padding-left:18px;border-left:6px solid var(--blau)">Für neue Versuche: Budget 1 CPU, 1 GiB, 64 PIDs beibehalten</p>` +
        `<p style="margin:0;padding-left:18px;border-left:6px solid var(--linie)">Grenzen: ein gemeinsamer WSL2-Host mit Lastgenerator, Beitrittswelle statt Dauerlast, keine Aussage zu Rendering oder LLM</p>` +
        `</div>` +
        `<p style="margin:30px 0 8px;font-weight:700;font-size:28px;color:var(--blau)">Zur Diskussion</p>` +
        `<ol style="margin:0;padding-left:36px;font-size:26px;line-height:1.35">` +
        `<li style="margin:0 0 8px">Wie prüfe ich, ob V3 in Block 5 ein Zufall war?</li>` +
        `<li style="margin:0 0 8px">Ist eine relative Regel bei p95-Werten um 20 ms sinnvoll, wenn schon die Kontrolle sie ${kontrolle.length}-mal reißt?</li>` +
        `<li>Welchen Nutzen müsste die Glättung bringen, damit sich der zusätzliche Betrieb lohnt?</li>` +
        `</ol>` +
        `<p class="beleg">KI: Umsetzung, Auswertung und Entwurf mit OpenAI Codex; Messung durch Niklas nach Anleitung; Folienentwurf im Deck-Stil von Jonas. Auswertung ${H.auswertungSha}</p>`,
    ),
    'Meine Entscheidung ist die Gegenalternative aus dem Vertrag: spaCy bleibt aus, die lexikalische Wortwolke reicht. Ich weiche die Kriterien nachträglich nicht auf. Für weitere Versuche bleibt das Budget von einer CPU und einem Gibibyte. Die Grenzen: Alles lief auf einem WSL2-Host zusammen mit dem Lastgenerator, das Profil ist eine Beitrittswelle, und über Rendering oder das LLM sage ich nichts. Drei Fragen würde ich gern diskutieren.',
    50,
    `Versuchsvertrag V2, Gegenalternative · ${umgebung}`,
  );

  // Kurzbelege in die Fußzeile (wie Jonas' Folien)
  for (const f of F) {
    const z = ZITATE[f.id];
    if (!z) throw new Error(`${f.id}: keine Kurzbelege`);
    f.fuss = `Quelle: ${z.map(([k, st]) => kurzbeleg1A(k, st).slice(1, -1)).join('; ')} · ${f.fuss}`;
  }

  F.push({
    id: 'N9',
    teil: 'niklas',
    auftrag: '1A',
    titel: 'Literaturverzeichnis 1A',
    inhalt: flaeche(
      `<!--quellen--><ul data-literatur style="margin:0;padding:0;list-style:none;columns:2;column-gap:56px;font-size:19px;line-height:1.3">` +
        LITERATUR_1A.map(
          (e) =>
            `<li style="break-inside:avoid;margin:0 0 10px;padding-left:28px;text-indent:-28px;overflow-wrap:anywhere">${e.voll}</li>`,
        ).join('') +
        `</ul><!--/quellen-->`,
    ),
    notiz: 'Literaturverzeichnis zu 1A nach dem IU-Zitierleitfaden.',
    zeitS: 5,
    kurzfassung: false,
    quelle: 'abgabe/niklas/literatur-1a.mjs',
    fuss: 'Kurzbelege auf den Folien nach IU-Zitierleitfaden',
    station: null,
  });
  return F;
}
