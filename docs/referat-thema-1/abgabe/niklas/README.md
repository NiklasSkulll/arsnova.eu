# Niklas' Folien im gemeinsamen Deck

Niklas' Teil (1A, 1B Schritte 3–4) als native Folien im Stil des gemeinsamen Decks. Das abgestimmte Deck,
Niklas' Folien-PDF und seine Sprechnotizen baut [`jonas/bau.mjs`](../jonas/README.md) nach
`jonas/ausgabe/` (`niklas-folien.pdf`, `sprechnotizen-niklas.md`); der Rückfallweg mit eingebetteten
PDF-Seiten bleibt `--niklas1 <pdf>`.

- **1A (N1–N10 ohne N8; Literatur NL im Anhang; Reserve RN1 Regelempfindlichkeit, RN2 Grenzen, RN4 Ressourcen):**
  [`folien-1a.mjs`](folien-1a.mjs). _Aktualisiert 2026-11-17:_ N6b und N8 sind wieder Reserve (RN1, RN4), damit
  1B Schritte 3–4 Zeit bekommen. Jede Zahl liest [`daten-1a.mjs`](daten-1a.mjs) aus der committeten Reihe vom
  15.11.2026 (Auswertung, Laufdateien, Ressourcenstichproben, Plan, Vertrag; Datum der Vorab-Festlegung aus Git).
  Nachträgliche Auswertungen stehen unter `explorativ` und tragen auf den Folien das Etikett „nachträglich
  ausgewertet“. Diagramme in [`grafik-1a.mjs`](grafik-1a.mjs), Kurzbelege nach ZL aus
  [`literatur-1a.mjs`](literatur-1a.mjs).
- **1B 3–4 (M1 Ersatz je Störung, M2 Breaker gegen Queue, M3 Live-Aktionen, M4 S1 und Entscheidung nach
  ADR 1B-020; _Aktualisiert 2026-11-17_ nach PR #26):** [`folien-1b34.mjs`](folien-1b34.mjs) mit
  [`daten-1b34.mjs`](daten-1b34.mjs). Quelle sind alle gewerteten Reihen unter `evidenz/1B/messung/`
  (Summary und Label samt Teilläufen, Breaker-Folgen, S1, Transportauswertung); Gegenprobe gegen die Protokolle in
  [`daten-1b34.test.mjs`](daten-1b34.test.mjs), zitierte Codezeilen prüft `folien-niklas.test.mjs`. Fehlen Daten,
  steht eine Platzhalterfolie, die `abgabe-lokal.mjs` vor der Abgabe meldet. Offene Punkte für Niklas:
  [`HINWEISE-1B34.md`](HINWEISE-1B34.md).
- **Reihenfolge und Zeit (_Ergänzt 2026-11-16_, _aktualisiert 2026-11-17_):** Niklas eröffnet (GT Titel, G0
  Fahrplan, GK Systembild, N1–N10), übergibt auf N10 an Jonas („Was, wenn wir die schwere Arbeit auslagern?“),
  übernimmt nach J15 mit M1–M4 und spricht G9 und GD. 15 min Redezeit je Person samt Rahmen, Fragen kommen hinzu;
  Niklas plant 14:25 min.
- **Diskussion:** [`fragenkatalog-1a.md`](fragenkatalog-1a.md) (Übung, nicht Teil der Abgabe).
- **Sprechnotizen:** je Folie `notiz` (Fließtext) und `stichpunkte` (zum freien Vortrag); `[Weiter]` markiert
  jeden Tastendruck einer Aufbaustufe (GK: drei; N6: drei, Stufe 0 zeigt nur Umrisse; N7: zwei; N9: zwei wie M1, je Variante; N10: Diskussion, dann Übergabe; G9: „Gemeinsam“ zuletzt; M1: drei, je
  Störung eine Stufe; M2: Stopp, dann Zu spät; M3: Summary, dann
  Label; M4: Entscheidung).
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
