# Niklas' Folien im gemeinsamen Deck

Niklas' Teil (1A, 1B Schritte 3–4) als native Folien im Stil des gemeinsamen Decks. Das abgestimmte Deck,
Niklas' Folien-PDF und seine Sprechnotizen baut [`jonas/bau.mjs`](../jonas/README.md) nach
`jonas/ausgabe/` (`niklas-folien.pdf`, `sprechnotizen-niklas.md`); der Rückfallweg mit eingebetteten
PDF-Seiten bleibt `--niklas1 <pdf>`.

- **1A (N1, N2, N4–N7, N9, N10; Literatur NL im Anhang; Reserve RN1–RN4, darin Versuchsaufbau RN3 und
  Ressourcen RN4):** [`folien-1a.mjs`](folien-1a.mjs). Jede Zahl liest
  [`daten-1a.mjs`](daten-1a.mjs) aus der committeten Reihe vom 15.11.2026 (Auswertung, Laufdateien,
  Ressourcenstichproben, Plan, Vertrag; Datum der Vorab-Festlegung aus Git). Nachträgliche Auswertungen
  stehen unter `explorativ` und tragen auf den Folien das Etikett „nachträglich ausgewertet“. Diagramme in
  [`grafik-1a.mjs`](grafik-1a.mjs), Kurzbelege nach ZL aus [`literatur-1a.mjs`](literatur-1a.mjs).
- **1B 3–4 (M1 Ersatzzeit je Störung, M2 Live-Aktionen und Folgerung für Schritt 4):**
  [`folien-1b34.mjs`](folien-1b34.mjs) mit [`daten-1b34.mjs`](daten-1b34.mjs). Quelle sind Niklas' gewertete
  Summary-Reihen (`evidenz/1B/messung/2026-11-15-lauf-{normal,f1}-summary.json`,
  `2026-11-16-lauf-{f2,l3,busy}-summary.json`), unverändert aus seinem Zweig
  `feature-1B-private-inference-3-4` übernommen; die Protokolle dazu liegen dort. Fehlen die Dateien, steht
  eine Platzhalterfolie, die `abgabe-lokal.mjs` vor der Abgabe meldet.
- **Reihenfolge und Zeit (_Ergänzt 2026-11-16_):** Niklas eröffnet (GT Titel, G0 Fahrplan, N1–N10),
  übergibt auf N10 an Jonas („Was, wenn wir die schwere Arbeit auslagern?“), übernimmt nach J15 mit M1–M2
  und spricht G9 und GD. Budget je Person höchstens etwa 10:30 min samt Rahmen; Niklas plant 9:55 min.
- **Diskussion:** [`fragenkatalog-1a.md`](fragenkatalog-1a.md) (Übung, nicht Teil der Abgabe).
- **Sprechnotizen:** je Folie `notiz` (Fließtext) und `stichpunkte` (zum freien Vortrag); `[Weiter]` markiert
  jeden Tastendruck einer Aufbaustufe (N6: drei, Stufe 0 zeigt nur Umrisse; N7: zwei).
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
