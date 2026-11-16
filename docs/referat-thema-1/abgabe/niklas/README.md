# Niklas' Folien im gemeinsamen Deck

Niklas' Teil (1A, 1B Schritte 3–4) als native Folien im Stil des gemeinsamen Decks. Das abgestimmte Deck,
Niklas' Folien-PDF und seine Sprechnotizen baut [`jonas/bau.mjs`](../jonas/README.md) nach
`jonas/ausgabe/` (`niklas-folien.pdf`, `sprechnotizen-niklas.md`); der Rückfallweg mit eingebetteten
PDF-Seiten bleibt `--niklas1 <pdf>`.

- **1A (N1–N10, Literatur NL im Anhang, Reserve RN1–RN2):** [`folien-1a.mjs`](folien-1a.mjs). Jede Zahl liest
  [`daten-1a.mjs`](daten-1a.mjs) aus der committeten Reihe vom 15.11.2026 (Auswertung, Laufdateien,
  Ressourcenstichproben, Plan, Vertrag; Datum der Vorab-Festlegung aus Git). Nachträgliche Auswertungen
  stehen unter `explorativ` und tragen auf den Folien das Etikett „nachträglich ausgewertet“. Diagramme in
  [`grafik-1a.mjs`](grafik-1a.mjs), Kurzbelege nach ZL aus [`literatur-1a.mjs`](literatur-1a.mjs).
- **1B 3–4 (M1–M4):** [`folien-1b34.mjs`](folien-1b34.mjs) mit [`daten-1b34.mjs`](daten-1b34.mjs). Sobald
  Niklas' Ergebnis-JSONs (`evidenz/1B/messung/<Datum>-lauf-<variante>-<auftrag>.json`) im Zweig liegen,
  füllen sich die Zahlen; Titel und Deutung trägt Niklas in `TITEL` und `SAETZE` ein. Bis dahin stehen
  sichtbare Platzhalter, die `abgabe-lokal.mjs` vor der Abgabe meldet.
- **Sprechnotizen:** je Folie `notiz` (Fließtext) und `stichpunkte` (zum freien Vortrag); `[Weiter]` markiert
  jeden Tastendruck einer Aufbaustufe (N6: drei, N7: zwei).
- **Handout (PaperLab):** [`handout-latex-1a.mjs`](handout-latex-1a.mjs) schreibt `zahlen.tex` und
  `abb-vergleiche.pdf` aus denselben Daten wie die Folien (`node … <PaperLab-Projekt>/generated`).
- **Befunde zum früheren Entwurf:** [`BEFUNDE-1A.md`](BEFUNDE-1A.md).

## Bauen und prüfen

```sh
node docs/referat-thema-1/abgabe/jonas/bau.mjs            # abgestimmte Ausgaben samt Manifest
node docs/referat-thema-1/abgabe/niklas/bau-entwurf.mjs   # schneller Probebau → niklas/ausgabe/
node --test docs/referat-thema-1/abgabe/niklas/*.test.mjs
```

Die Tests rechnen alle 100 Lauf-p95 und 80 Vergleiche aus den Rohdaten nach, prüfen jede Zahl auf den
Folien gegen die Daten, Kurzbelege, Layout, einzeilige Fußzeilen, den Druckauszug und die Stufen mit und
ohne reduzierte Bewegung.
