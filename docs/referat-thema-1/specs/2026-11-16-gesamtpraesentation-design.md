# Gesamtpräsentation Thema 1: Niklas' Teil auf Jonas-Niveau (Design, 2026-11-16)

## Anlass

Niklas' 1A-Folien und das 1A-Handout hat sein Codex ohne Auftrag erzeugt; Niklas hat sie nicht entworfen. Er ist einverstanden, Jonas' Entwurf zu übernehmen, wenn er ihm gefällt (Sprachnachricht an Jonas, 2026-11-16). Jonas' Teil wurde am 2026-11-16 auditiert und überarbeitet (Commits `dccbdfd1` bis heute).

## Vorgaben (Prüfungsdokument, Abschnitt 4.1.2 und 1)

- Präsentation mit **individuellem Handout**: jede Person ein eigenes Handout (höchstens 5 DIN-A4-Seiten, 350–1800 Wörter), ohne das andere lesbar, plus eindeutig zugeordnete Folien als PDF.
- 15 Minuten mündliche Prüfung je Person, Vortrag und Befragung zusammen; Kursvorschlag 9 + 6. Gemeinsame Einleitung oder Synthese nur im eigenen Zeitbudget.
- Name und Matrikelnummer aller Mitglieder auf jeder Einreichung, nie im Repo.
- 1A: eigene Leitfrage, Schritte 1–4, Ergebnis, Gültigkeitsgrenze, Diskussionskern laut Prüfungsdokument, Gruppenauftrag 1A.

## Entscheidungen (Jonas, 2026-11-16)

1. 1A jetzt vollständig; 1B Schritte 3–4 als Gerüst, das sich aus Niklas' Evidenz füllt, sobald sie gepusht ist.
2. Niklas' Handout neu in PaperLab im IU-Format, gleiche Prüfungen wie Jonas' Handout; Zahlen generiert aus seinen Messdaten.
3. Redezeit je Person etwa 10:30 wie bei Jonas.
4. Gemeinsames Designsystem: Niklas' Teil im Stil von Jonas' Deck; Jonas' Deck wird nur gezielt nachgezogen (Animationen, roter Faden, Übergänge, Sprechnotizen).
5. Sprechnotizen für beide in zwei Fassungen: Fließtext (die Vision) und Stichpunkte (zum freien Vortrag).
6. Animationen nur auf Tastendruck und nur, wo sie den Blick führen; reduzierte Bewegung und Druck ohne Übergang.

## Nicht-Ziele

- Keine neuen Laborläufe. Belege nur aus vorhandenen Daten.
- Kein Produktionscode. Keine Matrikelnummer im Repo.
- Kein Merge nach `main` (Jonas und Niklas machen ihn gemeinsam vor dem 22.11.).

## Offen für den Bauenden

Folienfolge, Grafiken und Animationen für 1A; Gliederung von Niklas' Handout innerhalb der IU-Vorgaben; Form der Sprechnotizen-Ausgabe.

## Umsetzung Niklas' Teil (_Ergänzt 2026-11-16_)

- Reihenfolge im Deck: G0 (Jonas eröffnet), J1–J15 (Übergabe auf J15: „Und was verträgt der App-Host selbst neben der Live-Last?“), N1–N10 (1A), M1–M4 (1B 3–4), G9 (gemeinsames Fazit, spricht Niklas), Anhang (J16, NL), Reserve (Jonas R1–R14, Niklas RN1–RN2).
- 1A: zehn Behauptungsfolien, 9:30 min, Heldenzahlenkette 40.000 → 80 → 11 → 4 → 3 in etwa 10 s → keine Freigabe; Stufen nur auf N6 (drei) und N7 (zwei, nachträglich ausgewertet und so markiert). Jede Zahl aus `abgabe/niklas/daten-1a.mjs`, Tests rechnen die Auswertung aus den Rohdaten nach.
- 1B 3–4: Gerüst M1–M4 (je 45 s), füllt sich aus Niklas' Ergebnis-JSONs; bis dahin Platzhalter, die `abgabe-lokal.mjs` meldet.
- Zeitkonflikt, offen für Niklas: 1A 9:30 + 1B 3–4 3:00 + G9 0:40 = 13:10 min gegen etwa 10:30. Die Kurzfassung (Marke in `sprechnotizen-niklas.md`: N1, N3, N5, N6, N8, N9, N10 und M1–M4) dauert 9:45, mit G9 10:25.
- Sprechnotizen beider Personen: Stichpunkte vor dem Fließtext, sobald eine Folie `stichpunkte` hat (`bau.mjs/baueSprechnotizen`).

## Reihenfolge nach Design 3, Rahmenfolien, Designregeln (_Ergänzt 2026-11-16_)

Anlass: Das Deck lief noch in der alten Folge (Jonas eröffnet); abgestimmt ist Design 2026-11-15, Abschnitt 3.
Dazu wünschte der Autor Titel-, Fahrplan- und Dankfolie und einen Designdurchgang über alle Folien.

- **Reihenfolge:** GT (Titel: beide Namen, Kurs DSCC0127, IU Internationale Hochschule, Prüfer, 24.11.2026,
  Platz für die Matrikelnummern), G0 (Leitfrage und Fahrplan), N1–N10 (1A), J1–J15, M1–M2 (1B 3–4), G9, GD
  (Dank, Fragen, Link und offline erzeugter QR-Code zum Belegrepository), Anhang J16 und NL, Reserve. Alle
  Rahmenfolien spricht Niklas. Übergänge: N10 „Was, wenn wir die schwere Arbeit auslagern?“ → J1 „Danke,
  Niklas. Die schwere Arbeit, die Inferenz, ist ausgelagert auf einen zweiten Host.“; J15 „Und wenn der
  zweite Host langsam ist oder ausfällt?“ → M1 „Danke, Jonas.“
- **Zeit:** Budget je Person höchstens etwa 10:30 min samt Rahmenanteil (Absprache 2026-11-16, ersetzt
  9:00 min). Jonas J1–J16 8:30 min, Niklas GT, G0, 1A, 1B 3–4, G9, GD 9:55 min. Sprungpläne zählen nur die
  eigene Redezeit.
- **Matrikelnummern:** Die Titelfolie steht in jedem Einzel-PDF; `abgabe-lokal.mjs` füllt den Platz nur in
  ignorierten Kopien (Deck und PDFs). Der frühere Eckstempel entfällt.
- **Designregeln:** Typografie (Text ≥ 28 px, Sekundärtext 24 px, Vermerke 20 px gedämpft in einer Zeile),
  vertikaler Rhythmus (Inhalt im optischen Zentrum, Beleg unten), Abstandsstufen, Farbbedeutung. Beschrieben
  im [README](../abgabe/jonas/README.md#designregeln-stand-2026-11-16), geprüft vom Layoutwächter.

## Gemeinsames Deck aus einem Guss (_Ergänzt 2026-11-16_)

- Stichpunkte für alle Folien von Jonas (G0, J1–J15, R1–R14); erster Satz (G0) und letzter Satz (J15) wörtlich. Sprechkarten je Person als PDF (nur Stichpunkte, Startzeit, Kurzfassung-Marke).
- Roter Faden: Fahrplan der vier Teile auf G0 (1C und 1B 1–2 · 1A · 1B 3–4 · Fazit), dieselben Teile als Teilleiste oben rechts auf jeder Hauptfolie; G9 nimmt die Leitfrage von G0 wieder auf. G0 endet mit „Ich beginne mit einem einzigen Klick“, J15 übergibt an Niklas mit Etikett 1A.
- Aufbaustufen bei Jonas nur auf J9 (Vorhersage, dann Beleg: Schwellen → Netz, Transport, Adapter → Inferenz) und J15 (Entscheidungen → Diskussionsfrage → Übergabe).
- Farben: Etiketten 1C Petrol, 1B Bernstein, 1A Blau auch auf G0; auf N10 ist „Begründung“ neutral statt Petrol (Petrol steht für 1C).
- Zeit: Jonas 10:05 min mit G0 (G0 jetzt 35 s). Niklas 13:10 min Langfassung bleibt offen; seine Kurzfassung mit G9 dauert 10:25 min und gilt laut Sprechnotizen als Vortragsplan, bis er kürzt. Sprungplan beider Personen ab der ersten eigenen Folie.

## 15 Minuten Redezeit je Person, Kontextfolie, Visualisierungen (_Ergänzt 2026-11-16_)

Anlass: Die Autoren planen mit 15 Minuten **Redezeit** je Person; die Fragen kommen hinzu. Das ersetzt die
Grenze von etwa 10:30 min (Abschnitt oben). Mehr Tiefe statt Füllstoff: starke Reservefolien kommen dorthin
zurück, wo sie das Argument tragen.

- **Reihenfolge:** GT, G0, **GK** (neu, „Was ist arsnova?“, Systembild in drei Stufen, spricht Niklas), N1–N10
  mit **N3** (Varianten, bis dahin RN3), **N6b** (Regelempfindlichkeit, RN1) und **N8** (spaCy-Budget, RN4), J1–J15
  mit **J5b** (Autorisierung, R8), **J8b** (Kontrolle C0, R2), **J10a** (Kaltläufe, R4), **J10b** (Ausfall B0, R3),
  **J11** (Timeout und Speicher, R13) und **J13b** (Einordnung Cloud Computing, R14), M1–M2, G9, GD, Anhang,
  Reserve (Jonas R1, R5–R7, R9–R12, neu R15 und R16 mit Abb. 1 und 2 aus `1C-diagrams.md`; Niklas RN2).
- **Zeit:** Jonas 14:35 min (J1–J16), Niklas 14:10 min (GT, G0, GK, 1A, 1B 3–4, G9, GD). Sprungplan, Budget und
  Sprechkarten zählen gegen 15:00 min (`bau.mjs`, `ABBRUCH_S`); Tests verlangen je Person 14:00–15:00 min.
- **Ortsmarke:** eine feste Miniatur des Systembilds von GK oben links auf jeder Folie von 1A und 1B 3–4 und auf
  J1 (gleiche Geometrie, gleiche Quelle); nur der Ort der Folie trägt die Farbe seines Teils, die Beschriftung
  nennt den Ort. Ein erster Entwurf mit wechselnden Formen (App-Host-Karte) war laut Autor verwirrend und ist
  ersetzt. Jonas' wandernder Punkt bleibt; beide Marken teilen Platz und Beschriftungsstil.
- **Aufbaustufen neu:** GK (drei), J7 (Budget, dann echte Tokens), J12 (Zeitleiste: Stimme, dann Verwurf),
  J13 (Raster der 38 Antworten rot, dann Ablation; der Clip erst danach), M1 (je Störung eine Stufe). Analogien aus
  den Daten: M1 „Stopp 1 s → DROP rund 47 min“, Notizen N7 und N8. Urteile zu allen Ideen:
  Arbeitsnotiz `visualisierung.md` des Teams (nicht im Repo).
- **Nachweisumfang:** [`nachweisumfang.md`](../nachweisumfang.md), auf GD als ein ruhiger Satz.
- **Codeprüfung:** J13 korrigiert (`12f1d8e4` änderte Instruktion und Gate, `a998ada0` nur das Gate); 1A nennt
  `a19ca70f` „nach v1.4.0“ statt v1.4.0.
