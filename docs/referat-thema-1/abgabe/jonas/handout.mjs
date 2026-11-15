// Handout von Jonas (1C und 1B Schritte 1–2): A4, höchstens 5 Seiten, Aufbau nach Design Abschnitt 9.
// Jede Zahl kommt aus dem Datenmodul (über ladeFolienDaten) oder aus FESTWERTE; der Test prüft das.
// Namen und Matrikelnummern stehen nur im Abgabe-PDF: personen kommt von außerhalb des Repos,
// ohne personen stehen Platzhalter.
//
// CLI: node handout.mjs <ausgabeordner> [personen.json]
//   personen.json = [{ "name": "…", "matrikel": "…" }, { … }] in der Reihenfolge Jonas, Niklas.
/* global console, document, process -- Node-Skript, page.evaluate läuft im Browser */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { FESTWERTE, ladeFolienDaten } from './folien.mjs';
import { wegSvg, zeitzerlegungSvg } from './grafik.mjs';
import { fmt } from './zahlen.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HIER, '../..');
const TITEL = 'Kontextpfad und zweite Serverrolle';
const PLATZHALTER = 'Name, Matrikelnummer: [lokal eintragen]';
const GRUPPE = [
  { vorname: 'Jonas', teil: '1C, 1B Schritte 1–2 (dieses Handout)' },
  { vorname: 'Niklas', teil: '1A, 1B Schritte 3–4 (eigenes Handout)' },
];

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const w = (s) => `<span class="w">${s}</span>`;
const code = (s) => `<code>${s}</code>`;
const adr = (id) => `<span style="white-space:nowrap">${id}</span>`;
const etikett = (a) => `<span class="etikett etikett-${a.toLowerCase()}">${a}</span>`;

/** Kurzname des Rechners aus der Umgebungsangabe der Ergebnis-JSONs. */
function rechnerKurz(rechner) {
  if (!/i7-6820HQ/.test(rechner)) throw new Error(`unerwarteter Rechner: ${rechner}`);
  return 'ThinkPad P50';
}

/**
 * Handout als HTML-Dokument.
 * @param daten   Ergebnis von ladeFolienDaten(root)
 * @param personen optional [{ name, matrikel }, { name, matrikel }] für Jonas und Niklas
 * @param optionen { basis }: URL des Ordners mit stil.css und schriften/ (für <base>)
 */
export function baueHandout(daten, personen, { basis } = {}) {
  if (personen !== undefined && (!Array.isArray(personen) || personen.length !== GRUPPE.length)) {
    throw new Error(`personen braucht genau ${GRUPPE.length} Einträge (Jonas, Niklas)`);
  }
  const { b1: b, c1: c, antwort: a, nutzlast: nl, auftrag: au } = daten;
  const H = b.herkunft;
  const fw = Object.fromEntries(Object.entries(FESTWERTE).map(([k, v]) => [k, fmt(v.wert)]));
  const z = {
    netz: fmt(b.netzMs, 2),
    netzMax: fmt(b.netzMaxMs, 2),
    transport: fmt(b.transportMs, 1),
    adapter: fmt(b.adapterMs, 0),
    anteil: fmt(b.inferAnteil * 100, 2),
    jobWarm: fmt(b.jobWarmMs / 1000, 1),
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
    // Der verfolgte Auftrag; Titel gerundet wie Folie J1 (folien.mjs, z.auS).
    auS: fmt(Math.round(au.jobMs / 1000)),
    auJob: fmt(au.jobMs / 1000, 1),
  };
  const n = b.anzahl;
  const nWarm = b.nWarm;
  const P50 = rechnerKurz(H.hauptlauf.rechner);
  if (rechnerKurz(H.nachtrag.rechner) !== P50) throw new Error('Nachtrag auf anderem Rechner');
  const haupt = H.hauptlauf.commit.slice(0, 8);
  const nachtrag = H.nachtrag.commit.slice(0, 8);
  const nachlauf = c.requestMs.commit; // "def56700 (Branch f746ffba)"
  const teil2 = c.validierungMs.commit;
  const ersteAussage = a.ausgabe.split('\n')[0];

  // ------------------------------------------------------------ Seite 1
  const personZeile = (g, i) =>
    `<tr><td><b>${g.vorname}</b></td><td>${g.teil}</td><td>${
      personen
        ? `${esc(personen[i].name)}, Matrikelnummer: ${esc(personen[i].matrikel)}`
        : PLATZHALTER
    }</td></tr>`;

  const seite1 =
    `<h1>Ein Klick. ${z.auS} Sekunden. Keine Modellantwort.</h1>` +
    `<p class="unter">${TITEL} im KI-Pfad von arsnova.eu Release 1.3</p>` +
    `<p class="meta" data-frei>Cloud Computing, Referat Thema 1 · Handout · Stand 15.11.2026</p>` +
    `<table class="personen"><tr><th>Gruppe</th><th>Teil im Referat</th><th>Name und Matrikelnummer</th></tr>` +
    GRUPPE.map(personZeile).join('') +
    `</table>` +
    `<p class="quelle">Verfasser aller Abschnitte: Jonas (ad personam).</p>` +
    `<div class="kasten"><p><b>Kurzantwort.</b> Verfolgt wird ein echter Q&amp;A-Auftrag mit synthetischen Daten: Auftrag ${au.nr} des 1B-Laufs braucht vom Klick bis zum Ergebnis ${w(`${z.auJob} s`)}. ` +
    `${etikett('1C')} Der Kontextpfad hält seine Zusagen, mit benannten Ausnahmen. ` +
    `${etikett('1B')} Die zweite Serverrolle kostet keine relevante Zeit: Die Inferenz macht im Median ${w(`${z.anteil} %`)} der Auftragszeit aus, das Netz ${w(`${z.netz} ms`)}. ` +
    `Trotzdem kommt keine Modellzusammenfassung an: Das Quality-Gate verwirft jede Antwort.</p></div>` +
    `<h2>1 Leitfragen und Weg eines Auftrags (Jonas)</h2>` +
    `<p class="zitat">${etikett('1C')} „Wie zuverlässig hält der implementierte 1.3-Kontextpfad seine Vertrags-, Konsistenz- und Entkopplungszusagen vom App-Zustand bis zur privaten Inferenz ein?“ (Prüfungsdokument [1])</p>` +
    `<p class="zitat">${etikett('1B')} „Wie schlüsselt sich die Zeit eines echten Kompass-Auftrags […] über die zweite private Serverrolle auf, und wie groß ist der Transportanteil im Vergleich zur Inferenz?“ (ADR 1B-011 [10])</p>` +
    `<figure>${wegSvg({ aktiv: null, b1: b, c1: c })}` +
    `<figcaption><b>Abb. 1:</b> Weg eines Auftrags über beide Hosts im Labor; Kreis: Inferenz, Median warm (n = ${nWarm}). Eigene Darstellung. ` +
    `Quelle: 1B-Werte [7], ${P50}, ${haupt}; 1C-Werte [8], ${P50}, ${nachlauf}, Validierung [9], ${P50}, ${teil2}.</figcaption></figure>`;

  // ------------------------------------------------------------ Seite 2: 1C
  const zeile = (zusage, pruefung, ergebnis, urteil, klasse = 'ja') =>
    `<tr><td><b>${zusage}</b></td><td>${pruefung}</td><td>${ergebnis}</td><td class="${klasse}">${urteil}</td></tr>`;
  const seite2 =
    `<h2>2 Auftrag 1C: Hält der Kontextpfad seine Zusagen? (Jonas)</h2>` +
    `<p><b>Vorgehen.</b> Pfad am Code rekonstruiert [5], Hypothesen und Schwellen vorab festgelegt, zuerst modellfrei mit gekennzeichneten Negativproben getestet (ADR 1C-003 [10]), dann im Labor mit der ausgelieferten Runtime, zuletzt auf upstream ${code('def56700')} [8]. ` +
    `Vertrag, Entkopplung und Konsistenz halten, zu kleinen Kosten (Tab. 1). Ergebnis: Empfehlung, kein Patch (ADR 1C-004).</p>` +
    `<table><tr><th style="width:17%">Zusage</th><th style="width:27%">Prüfung</th><th style="width:36%">Ergebnis</th><th>Urteil</th></tr>` +
    zeile(
      'Vertrag',
      'Vorschau gegen gesendete Nutzlast; Schemavalidierung',
      `gleicher Hash, byte-gleich; Validierung ${w(`${z.valMs} ms`)} = ${w(`${z.valP} %`)} eines Kontextaufbaus`,
      'hält, bleibt (1C-011, 1C-013)',
    ) +
    zeile(
      'Entkopplung',
      'Host-Aufruf gegen Inferenz',
      `Host-Aufruf ${w(`${z.request} ms`)}, Inferenz ${w(`${z.infer1C} s`)} (Mediane); auf den Kontextaufbau wartet der Host`,
      'hält, bleibt (1C-012)',
    ) +
    zeile(
      'Konsistenz',
      'Hash vor und nach der Inferenz',
      `ohne Datenänderung kein ${code('source_changed')}; Nachprüfung ${w(`${z.nachpr} %`)} des Auftrags (Regel: unter ${w(`${fw.schwelleNachpruefungProzent} %`)})`,
      'hält, bleibt (1C-010)',
    ) +
    zeile(
      'Ausnahme Blitzlicht',
      'laufende Blitzlicht-Runde (T3.1)',
      `Hash hängt von der Uhrzeit ab: ${code('YESNO')} endet ${w(c.yesno.wert)} ${code('source_changed')}`,
      'empfohlen: beheben (1C-016)',
      'empf',
    ) +
    zeile(
      'Kontextbereitstellung',
      'Schätzung (ein Byte = ein Token) gegen echte Tokens',
      `q = ${w(z.q)}: zwei Drittel des Fensters ungenutzt`,
      'empfohlen: Zählung prüfen (1C-014)',
      'empf',
    ) +
    zeile(
      'Ergebnis für Lehrende',
      'Endstatus im Nachlauf',
      `${w(c.fullContextN4.wert)} mit Modellzusammenfassung; ${w(c.gateAntworten.wert)} Antworten bestehen das Gate`,
      'empfohlen: Gate abstimmen (1C-018)',
      'empf',
    ) +
    `</table>` +
    `<p class="quelle"><b>Tab. 1:</b> Zusagen des Kontextpfads (1C). Quelle: Nachlauf [8], ${P50}, ${nachlauf}; Validierung: Teil 2 [9], ${P50}, ${teil2}, Test-Runtime.</p>` +
    `<p>Weitere Ausnahme (modellfrei): Ein Themen-Snapshot fremder Schemaversion gilt still als „keine Daten“ (T2.3, ADR 1C-015).</p>` +
    `<figure><pre class="nutzlast" data-frei>${['{…', ...nl.zeilen, `"limitations":[${nl.budgetZeile}]`, '…}'].map(esc).join('\n')}</pre>` +
    `<figcaption><b>Abb. 2:</b> Echte Nutzlast an die Runtime, Ausschnitt. Vorschau und Nutzlast: Hash ${code(nl.hashVorschau.slice(0, 8))}; eine Frage fehlt aus Budgetgründen. ` +
    `Quelle: ${code(`${nl.datei.replace(/^evidenz\//, 'evidenz/')}`)}, ${code(`runs[${nl.lauf}]`)} [8], ${rechnerKurz(nl.cpu)}, ${nl.commit} (${code('def56700')}).</figcaption></figure>` +
    `<p><b>Grenze aus dem Auftrag.</b> „Hält“ heißt vertrags- und quellengültig; ein formal korrekter Releasepfad belegt keine optimierten Prompts.</p>`;

  // ------------------------------------------------------------ Seite 3: 1B
  const hyp = (h, groesse, schwelle, wert) =>
    `<tr><td><b>${h}</b></td><td>${groesse}</td><td>${schwelle}</td><td>${wert}</td><td class="ja">erfüllt</td></tr>`;
  const seite3 =
    `<h2>3 Auftrag 1B, Schritte 1–2: Wo steckt die Zeit? (Jonas)</h2>` +
    `<p><b>Aufbau (Schritt 1).</b> Release 1.3 nach ADR-0035 [2] und Second-Host-Runbook [3] als zwei KVM-VMs auf einem Laptop: app-host mit App, PostgreSQL und Redis, llm-host mit ${code('llama-server')} und Qwen3-4B Q4_K_M; die Firewall lässt die Runtime nur vom app-host zu, dazu ein Token. ` +
    `Offengelegt: Release-Images selbst gebaut (nicht öffentlich), beide VMs auf einer CPU [7].</p>` +
    `<p><b>Messung (Schritt 2).</b> ${n} echte Summary-Aufträge über die App. Ein Mitschnitt auf beiden Hosts liefert t<sub>0</sub> bis t<sub>3</sub>, das Feld ${code('timings')} der Runtime die Inferenzzeit [4]: ` +
    `Netz = (t<sub>3</sub> − t<sub>0</sub>) − (t<sub>2</sub> − t<sub>1</sub>), jede Differenz von einer Uhr, ohne Änderung am Produktionscode (ADR 1B-006; Begriffe nach [6]). ` +
    `Der erste Auftrag ist kalt, die übrigen warm (Prompt im Cache); beide Gruppen stehen getrennt (ADR 1B-011).</p>` +
    `<figure>${zeitzerlegungSvg(b)}` +
    `<figcaption><b>Abb. 3:</b> Zeitzerlegung mit vorab festgelegten Schwellen (Log-Achse). Netz, Transport, Adapter und Inferenzanteil: Median über alle ${n} Aufträge; Inferenz warm: Median, n = ${nWarm}. Eigene Darstellung. ` +
    `Quelle: Lauf [7], ${P50}, ${haupt}; Kaltläufe: Nachtrag [7], ${P50}, ${nachtrag}.</figcaption></figure>` +
    `<table><tr><th style="width:15%">Hypothese</th><th style="width:33%">Messgröße</th><th style="width:15%">Schwelle, vorab</th><th>Messwert</th><th style="width:10%">Urteil</th></tr>` +
    hyp(
      'H_B1',
      'Netz je Auftrag, Median',
      `≤ ${w(`${fw.schwelleNetzMs} ms`)}`,
      `${w(`${z.netz} ms`)} (Maximum ${w(`${z.netzMax} ms`)})`,
    ) +
    hyp(
      'H_B2',
      'Adapter je Auftrag, Median',
      `≤ ${w(`${fw.schwelleAdapterS} s`)}`,
      w(`${z.adapter} ms`),
    ) +
    hyp(
      'H_B3',
      'Inferenzanteil, Median',
      `≥ ${w(`${fw.schwelleInferenzProzent} %`)}`,
      w(`${z.anteil} %`),
    ) +
    hyp(
      'H_C0 (M2)',
      'Kontrollanfrage Strecke minus lokal (Mediane)',
      `≤ ${w(`${fw.schwelleC0Ms} ms`)}`,
      w(`${z.c0} ms`),
    ) +
    hyp(
      'H_B0 (M3)',
      'Runtime fehlt: Auftragszeit, Median',
      `≤ ${w(`${fw.schwelleB0S} s`)}`,
      `${w(`${z.b0} ms`)}, ${w(`${b.nB0} von ${b.nB0}`)} extraktiv`,
    ) +
    hyp(
      'H_B3 kalt (M4)',
      `Inferenzanteil, ${b.nKaltLaeufe} Läufe mit frischer Runtime`,
      `≥ ${w(`${fw.schwelleInferenzProzent} %`)}`,
      `in allen ${b.nKaltLaeufe}; Median ${w(`${z.kaltMedian} s`)} (${w(`${z.kaltMin}–${z.kaltMax} s`)})`,
    ) +
    `</table>` +
    `<p class="quelle"><b>Tab. 2:</b> Schwellen vorab (ADR 1B-008 [10]). Quelle: H_B1–H_B3 Lauf [7], n = ${n}, ${P50}, ${haupt}; M2–M4 Nachtrag [7], ${P50}, ${nachtrag}.</p>` +
    `<p>Der kalte erste Auftrag dauert ${w(`${z.jobKalt} s`)}. Warme Aufträge dauern im Median ${w(`${z.jobWarm} s`)} (warm, n = ${nWarm}); der verfolgte Auftrag ${au.nr} liegt mit ${w(`${z.auJob} s`)} knapp darüber.</p>`;

  // ------------------------------------------------------------ Seite 4: Befunde, Entscheidung, Grenzen
  const ent = (art, inhalt, beleg, klasse) =>
    `<tr><td class="${klasse}">${art}</td><td>${inhalt}</td><td>${beleg}</td></tr>`;
  const seite4 =
    `<h2>4 Befunde, Entscheidung und Grenzen zu 1C und 1B (Jonas)</h2>` +
    `<h3>Das Gate verwirft jede Modellantwort ${etikett('1C')} ${etikett('1B')}</h3>` +
    `<p>Im 1B-Lauf verwirft das Quality-Gate ${w(`${b.verworfen} von ${n}`)} Antworten, im 1C-Nachlauf bestehen ${w(c.gateAntworten.wert)} [7, 8]. Es prüft nur die Form „Stichwort: Text“. ` +
    `Die Antwort auf Auftrag ${a.auftrag} erfüllt sie in ${w(`${a.mitTrenner} von ${a.aussagen}`)} Aussagen und ist englisch statt deutsch:</p>` +
    `<p class="zitat antwort" lang="en">${esc(ersteAussage)}</p>` +
    `<p class="quelle">Ausschnitt ohne Header und Token [7], Lauf ${haupt}, ${P50}.</p>` +
    `<p>Die Lehrperson sieht ohne Hinweis eine extraktive Ersatzzusammenfassung; ${w(`${z.anteil} %`)} der Auftragszeit (Median) fließen in ein Ergebnis, das nicht ankommt.</p>` +
    `<h3>Betrieb: Timeout und Speicher ${etikett('1C')}</h3>` +
    `<p>Ab Werk bricht die App nach ${w(`${fw.releaseTimeoutS} s`)} ab. Die Inferenz dauerte bei der Kalibrierung am PC (i7-8700, ${code(c.kalibrierungPcS.commit)}) ${w(`${z.kalPc} s`)}, am Laptop im Median ${w(`${z.infer1C} s`)} (${code('def56700')}); ` +
    `das Labor lief offengelegt mit ${w(`${fw.laborTimeoutS} s`)}, der Obergrenze des Produkts. Der Prompt-Cache lässt den Speicher je Auftrag um ${w(`${z.delta} GB`)} wachsen (Median, Laptop, ${code('def56700')}); ` +
    `der Kernel beendet die Runtime im ${w(`${c.oomAuftrag.wert}.`)} Auftrag per OOM-Kill, auf ${code(c.oomAuftrag9f230abc.commit)} beim ${w(`${c.oomAuftrag9f230abc.wert}.`)} mit Aufwärmlauf (Laptop und PC) [8, 10].</p>` +
    `<h3>Was der Betrieb nicht sieht ${etikett('1B')}</h3>` +
    `<p>Das Log nennt nur die Gesamtdauer ${code('latencyMs')} und als Grund nur ${code('invalid_response')}; Inferenz, Netz und Adapter trennt nur ein Mitschnitt [7].</p>` +
    `<h3>Entscheidung</h3>` +
    `<table><tr><th style="width:21%">Entscheidung</th><th>Inhalt</th><th style="width:24%">ADR, Issue im Fork</th></tr>` +
    ent(
      'beibehalten (1C)',
      'Nachprüfung, strikte Validierung, Entkopplung, Vorschau gleich Nutzlast',
      `${adr('1C-010')} bis ${adr('1C-013')}`,
      'ja',
    ) +
    ent(
      'empfohlen, nicht umgesetzt (1C)',
      'Gate mit Instruktion und Grammatik abstimmen; Timeout kalibrieren; Prompt-Cache begrenzen; Token-Zählung prüfen; Snapshot-Zustand unterscheiden; Blitzlicht-Hash stabilisieren',
      `${['1C-018', '1C-023', '1C-024'].map(adr).join(', ')}, ${adr('1C-014')} bis ${adr('1C-016')}; #13 bis #18`,
      'empf',
    ) +
    ent(
      'Konfiguration (1B)',
      'Topologie bleibt; der Hebel liegt am Inferenz-Host (Timeout, Limits, Promptgröße), vorher Gate abstimmen',
      '1B-Ergebnis; #13',
      'ja',
    ) +
    ent(
      'empfohlen, nicht umgesetzt (1B)',
      'Zeiten und Grund eines Fallbacks ohne Prompttext ins Log schreiben',
      '#19, #20',
      'empf',
    ) +
    `</table>` +
    `<p class="quelle">Quelle: Berichte und ADRs [10].</p>` +
    `<h3>Gültigkeitsgrenzen</h3>` +
    `<ul>` +
    `<li>Gemessen wurden spätere Codestände, nicht der Tag v1.3.0 (ADR 1C-001, 1B-001 [10]).</li>` +
    `<li>Labor: CPU-Inferenz, ein Slot, ein Modell; Zeiten gelten nur für den jeweiligen Rechner.</li>` +
    `<li>1B: beide Hosts auf einem Laptop, virtuelles Netz, eine Messreihe; Netzauflösung etwa eine Millisekunde.</li>` +
    `<li>1C: eine synthetische Fixture; Nachlauf nur am Laptop, mit Nebenlast.</li>` +
    `<li>Ein privates Netz ist kein Datenschutz; der Token läuft im Klartext über HTTP.</li>` +
    `</ul>`;

  // ------------------------------------------------------------ Seite 5: Quellen, Evidenz, KI
  const lit = [
    `Referatsprüfung Cloud Computing: verbindliche Umsetzung. ${code('docs/didaktik/CLOUD-COMPUTING-REFERAT-PRUEFUNG.md')}, Abschnitte 3 und 4.3.`,
    `arsnova.eu-Projektteam (2026): ADR-0035, Selbstgehosteter Open-Weight-LLM-Server: llama.cpp (llama-server) statt Ollama. ${code('docs/architecture/decisions/0035-self-hosted-llm-runtime-llama-cpp-over-ollama.md')}.`,
    `arsnova.eu-Projektteam (2026): Betriebshandbuch: private CPU-Inferenz auf einem zweiten Linux-Host (Second-Host-Runbook). ${code('docs/operations/OPEN-WEIGHT-LLM-SECOND-HOST-RUNBOOK.md')}.`,
    `ggml-org: llama.cpp HTTP Server, README, Antwortfeld ${code('timings')}. <a href="https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md">github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md</a>.`,
    `Dossier 1C: Autorisierter Kontext und asynchroner Adapterpfad. ${code('docs/referat-thema-1/1C-kontext-und-adapterpfad.md')}.`,
    `Recherchedossier 1B: Private Inferenz als getrennte Serverrolle, Abschnitte 8.1 und 10. ${code('docs/referat-thema-1/1B-private-inferenz-zweiter-host.md')}.`,
    `Eigene Messung 1B: Aufbau ${code('evidenz/1B/2026-11-12-aufbau.md')}, Lauf mit Nachtrag M1–M4 ${code('evidenz/1B/2026-11-13-lauf.md')}, Rohdaten und Antwortausschnitt ${code('evidenz/1B/messung/')}.`,
    `Eigene Messung 1C: Nachlauf auf upstream ${code('evidenz/1C/2026-11-09-labor-nachlauf.md')}, Rohdaten und Auswertung ${code('evidenz/1C/messung/')}.`,
    `Eigene Messung 1C, Teil 2 (Test-Runtime): ${code('evidenz/1C/2026-10-24-teil2.md')}.`,
    `Eigene ADRs 1C-001 bis 1C-026 und 1B-001 bis 1B-012 (${code('adr/')}); Berichte ${code('1C-ergebnis.md')}, ${code('1B-ergebnis.md')}; Eigenanteil ${code('1C-eigenanteil.md')}, ${code('1B-eigenanteil.md')}.`,
  ];
  const seite5 =
    `<h2>5 Quellen, Evidenz und KI-Offenlegung (Jonas)</h2>` +
    `<h3>Literatur und Quellen</h3>` +
    `<ol class="literatur">${lit.map((t, i) => `<li id="q${i + 1}">${t}</li>`).join('')}</ol>` +
    `<p class="quelle">Pfade [7]–[10] relativ zu ${code('docs/referat-thema-1/')}; Issues #13–#20 im Fork <a href="https://github.com/NiklasSkulll/arsnova.eu/issues">github.com/NiklasSkulll/arsnova.eu/issues</a>.</p>` +
    `<h3>Evidenzort und Rechner</h3>` +
    `<p>Alle eigenen Belege liegen im Fork <a href="https://github.com/NiklasSkulll/arsnova.eu">github.com/NiklasSkulll/arsnova.eu</a> unter ${code('docs/referat-thema-1/')}: 1C in ${code('main')} (PR #12), 1B im PR #23. ` +
    `Die Zahlen hier setzt ein geprüftes Skript aus den Rohdaten ein (${code('abgabe/jonas/zahlen.mjs')}).</p>` +
    `<p class="klein" data-frei><b>Rechner.</b> ThinkPad P50: ${esc(H.hauptlauf.rechner.replace(/\(R\)|\(TM\)| CPU @ [\d.]+GHz/g, ''))}. PC: Intel Core i7-8700.</p>` +
    `<h3>KI-Offenlegung</h3>` +
    `<p>Werkzeug: Claude Code (Anthropic) mit Serena und codebase-memory-mcp, laut Protokollen Modell Claude Opus 5.5 (nicht unabhängig geprüft). ` +
    `Die KI entwarf unter meiner Anleitung Skripte, Tests, Auswertungen, Texte, Diagramme und dieses Handout. ` +
    `Ich habe Leitfragen, Hypothesen und Schwellen vor jeder Messung freigegeben, die Läufe gesteuert, über Abweichungen entschieden und die Ergebnisse geprüft (1C-Kernzahlen stichprobenartig nachgerechnet). ` +
    `Zentrale Aufträge (sinngemäß): Pfad mit Code-Belegen nachverfolgen, 1C verteidigbar testen und messen, das Labor automatisiert nachbauen, einen echten Auftrag zerlegen. ` +
    `Reviews waren KI-Sitzungen, keine menschlichen Gutachten. Details je Artefakt: Eigenanteil-Dateien [10].</p>`;

  // ADR-Kennungen nicht am Bindestrich umbrechen (nur im HTML-Text, nie in den SVG-Grafiken).
  const seiten = [seite1, seite2, seite3, seite4, seite5].map((t) =>
    t
      .split(/(<svg[\s\S]*?<\/svg>)/)
      .map((teil) =>
        teil.startsWith('<svg') ? teil : teil.replace(/(?<![\w-])1[BC]-\d{3}\b/g, (k) => adr(k)),
      )
      .join(''),
  );
  const html = seiten
    .map(
      (s, i) =>
        `<section class="seite"><div class="inhalt">${s}</div>` +
        `<footer data-frei><span>Handout Jonas</span><span>${i + 1} / ${seiten.length}</span></footer></section>`,
    )
    .join('\n');

  return readFileSync(join(HIER, 'handout-vorlage.html'), 'utf8')
    .replace('{{BASIS}}', () => (basis ? `<base href="${esc(basis)}" />` : ''))
    .replace('{{TITEL}}', () => esc(`${TITEL} · Handout Jonas`))
    .replace('{{SEITEN}}', () => html);
}

/**
 * Rendert das Handout mit Chromium (Playwright aus den Repo-Abhängigkeiten) als A4-PDF.
 * Ohne <base> im HTML wird es neben stil.css gelegt, damit Schriften und Stil laden.
 * Liefert Layoutbefunde: Anzahl Seitenabschnitte, Seiten mit Überlauf, geladene Schriften.
 */
export async function rendereHandout(html, pdfPfad) {
  const { chromium } = createRequire(resolve(ROOT, '../../package.json'))('playwright');
  const mitBasis = html.includes('<base ')
    ? html
    : html.replace(
        '<meta charset="utf-8" />',
        (m) => `${m}<base href="${pathToFileURL(`${HIER}/`).href}" />`,
      );
  const tmp = join(tmpdir(), `handout-${process.pid}-${Date.now()}.html`);
  writeFileSync(tmp, mitBasis);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(tmp).href);
    await page.emulateMedia({ media: 'print' });
    const layout = await page.evaluate(async () => {
      await document.fonts.ready;
      const seiten = [...document.querySelectorAll('.seite')];
      const ueberlauf = [];
      const zuBreit = [];
      seiten.forEach((s, i) => {
        const inhalt = s.querySelector('.inhalt');
        if (inhalt.scrollHeight > inhalt.clientHeight + 1) ueberlauf.push(i + 1);
        if (s.scrollWidth > s.clientWidth + 1) zuBreit.push(i + 1);
      });
      const schriften = [...document.fonts]
        .filter((f) => f.status === 'loaded')
        .map((f) => `${f.family.replace(/"/g, '')} ${f.weight}`);
      const frei = seiten.map((s) => {
        const inhalt = s.querySelector('.inhalt');
        const letzte = inhalt.lastElementChild.getBoundingClientRect().bottom;
        return Math.round((inhalt.getBoundingClientRect().bottom - letzte) * 0.2646); // px → mm
      });
      return { seiten: seiten.length, ueberlauf, zuBreit, schriften, freiMm: frei };
    });
    await page.pdf({ path: pdfPfad, preferCSSPageSize: true, printBackground: true });
    return layout;
  } finally {
    await browser.close();
    rmSync(tmp, { force: true });
  }
}

// ------------------------------------------------------------ CLI
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [ziel, personenDatei] = process.argv.slice(2);
  if (!ziel) {
    console.error('Aufruf: node handout.mjs <ausgabeordner> [personen.json]');
    process.exit(2);
  }
  const personen = personenDatei ? JSON.parse(readFileSync(personenDatei, 'utf8')) : undefined;
  mkdirSync(ziel, { recursive: true });
  const html = baueHandout(ladeFolienDaten(ROOT), personen);
  const pdf = join(resolve(ziel), 'jonas-handout.pdf');
  const layout = await rendereHandout(html, pdf);
  console.log(JSON.stringify({ pdf, ...layout }, null, 2));
}
