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

## Gemeinsames Deck aus einem Guss (_Ergänzt 2026-11-16_)

- Stichpunkte für alle Folien von Jonas (G0, J1–J15, R1–R14); erster Satz (G0) und letzter Satz (J15) wörtlich. Sprechkarten je Person als PDF (nur Stichpunkte, Startzeit, Kurzfassung-Marke).
- Roter Faden: Fahrplan der vier Teile auf G0 (1C und 1B 1–2 · 1A · 1B 3–4 · Fazit), dieselben Teile als Teilleiste oben rechts auf jeder Hauptfolie; G9 nimmt die Leitfrage von G0 wieder auf. G0 endet mit „Ich beginne mit einem einzigen Klick“, J15 übergibt an Niklas mit Etikett 1A.
- Aufbaustufen bei Jonas nur auf J9 (Vorhersage, dann Beleg: Schwellen → Netz, Transport, Adapter → Inferenz) und J15 (Entscheidungen → Diskussionsfrage → Übergabe).
- Farben: Etiketten 1C Petrol, 1B Bernstein, 1A Blau auch auf G0; auf N10 ist „Begründung“ neutral statt Petrol (Petrol steht für 1C).
- Zeit: Jonas 10:05 min mit G0 (G0 jetzt 35 s). Niklas 13:10 min Langfassung bleibt offen; seine Kurzfassung mit G9 dauert 10:25 min und gilt laut Sprechnotizen als Vortragsplan, bis er kürzt. Sprungplan beider Personen ab der ersten eigenen Folie.
