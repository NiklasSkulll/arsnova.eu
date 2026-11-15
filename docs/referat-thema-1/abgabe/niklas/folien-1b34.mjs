// VORLAGE für Niklas' Teil 1B, Schritte 3–4 (Störung und Betriebsaufwand), im Stil des gemeinsamen
// Decks. Gliederung nach der Prüfungsvorgabe und der Übergabe im Runbook (evidenz/1B/runbook.md,
// Abschnitt 8). Alles in [eckigen Klammern] füllt Niklas; Zahlen später aus seinem Ergebnis-JSON
// wie in daten-1a.mjs, Kurzbelege über literatur-1a.mjs (oder eine eigene Liste für 1B).

import { flaeche, frage, liste } from '../jonas/folien.mjs';

const offen = (text) =>
  `<span style="color:var(--gedaempft);border-bottom:2px dashed var(--linie)">[${text}]</span>`;

const GLIEDERUNG = [
  [
    'M1',
    'Was, wenn der zweite Host ausfällt?',
    'Frage und Kernaussage',
    ['Frage aus der Übergabe von J15', 'Kernaussage in einem Satz', 'zwei Kennzahlen mit Umgebung'],
  ],
  [
    'M2',
    'Störungen und Hypothesen',
    'Was wird gestört, was erwarte ich vorab?',
    [
      'Störungen: tc netem, Firewall-Sperre, Runtime gestoppt (nur in den Labor-VMs)',
      'Hypothese und Schwelle je Störung, vor dem Lauf festgelegt',
      'Rücknahme und Prüfung nach jedem Lauf',
    ],
  ],
  [
    'M3',
    'Was die Lehrperson sieht',
    'Ergebnis je Störung',
    [
      'Grafik oder Tabelle: Störung → Wartezeit → Ausgang (Modell, Ersatz, Fehler)',
      'Vergleich mit Jonas’ ungestörtem Lauf (J9, J13)',
    ],
  ],
  [
    'M4',
    'Was die zweite Rolle im Betrieb kostet',
    'Betriebsaufwand',
    [
      'Aufbau, Token, Firewall, Updates, Überwachung',
      'Aufwand in Stunden oder Schritten, mit Beleg',
    ],
  ],
  [
    'M5',
    'Entscheidung und Fragen',
    'Entscheidung mit Folge',
    [
      'Entscheidung mit Kosten, Risiko oder Betriebsfolge',
      'Grenzen der Messung',
      'zwei bis drei Fragen zur Diskussion',
    ],
  ],
];

/** Platzhalterfolien M1–M5; teil 'niklas', damit sie im Deck an der Stelle von 1B 3–4 stehen. */
export function folien1B34() {
  return GLIEDERUNG.map(([id, titel, frageText, punkte]) => ({
    id,
    teil: 'niklas',
    auftrag: '1B',
    titel: `${titel} ${offen('Titel')}`,
    inhalt: flaeche(
      frage(frageText, '1B') +
        liste(
          punkte.map((p) => offen(p)),
          28,
        ),
    ),
    notiz: `[Vorlage: Sprechnotiz zu ${id} von Niklas]`,
    zeitS: 50,
    kurzfassung: true,
    quelle: '[Niklas: Protokoll und Ergebnis-JSON von 1B, Schritte 3–4]',
    fuss: 'Quelle: [Kurzbelege nach ZL, z. B. (Schneider, 2026c, Laufprotokoll)] · [Rechner · Commit]',
    station: null,
  }));
}
