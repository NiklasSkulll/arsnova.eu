## Verstehen

J5b gehört zur Station Kontext (Etikett 1C, Punkt oben links auf „Kontext“). Die Frage der Folie: „Wer darf welchen Teil des Kontexts sehen?“ Sie deckt Schritt 1 von Auftrag 1C ab: den Kontextpfad am Code rekonstruieren, je Bereich aus Issue #456.

Die Folie ist eine Tabelle mit vier Spalten: Bereich (#456), Quelle und Funktion, Schemafassung, Rechteprüfung. Die Zeilen:

- **Q&A-Fragen, Stimmen:** PostgreSQL, Funktion `collectQaContextCandidates`, Schema `qa-ranking-v1`, Rechteprüfung `loadAuthorizedModerationState`.
- **Semantische Themen:** Redis-Snapshot, `collectQaTopicContext`, `qa-semantic-topic-snapshot-v1`, geprüft im Q&A-Aufbau.
- **Quiz, Blitzlicht, Kompass:** PostgreSQL und Redis, gebündelt als Lehrsignale, Fingerprints `effective-vote-v1` und `feedback-v1`, eigene Prüfungen der Lehrsignale.
- **Lernziele:** PostgreSQL, `projectLearningContext`, `learning-context-v1`, `assertLearningSnapshotStillCurrent`.
- **Zusammensetzung:** `buildModerationPromptContext`, `moderation-analysis-context-v1`, erste Prüfung.
- **Vorschau, Auftrag:** `qa.summaryContextPreview` und `qa.requestSummary`, `qa-summary-context-preview-v1`, `assertHostSessionAccessFromContext`.

Der Satz darunter fasst zusammen: Je Kontextaufbau acht Rechteprüfungen; ohne gültiges Host-Token weder Vorschau noch Auftrag; kein Token im Draht-Body (Test E2).

Woher das kommt: Die vollständige Tabelle mit Zeilennummern steht in `1C-diagrams.md`, Abschnitt „`#456`-Bereiche (Stand `def56700`)“, gelesen am Code-Stand `def56700` (v1.4.0-14). Dort steht der Satz „Jedes prepare durchläuft 8 Rechteprüfungen“. Die Zahl 8 ist also aus dem Code gezählt, nicht gemessen. Bei deaktiviertem Q&A ersetzt eine andere Prüfung eine der acht; die Zahl bleibt gleich. Die Folie fasst einige Zeilen der Doku zusammen (Kompass, freigegebene Quizergebnisse und Blitzlicht stehen dort getrennt).

Test E2 steht in `evidenz/1C/2026-10-24-teil2.md` (Laptop, Commit `248029dc`). Er prüft den rohen Body an die Runtime auf Teilstrings: Host-Token, Session-ID, Session-Code, alle 200 Teilnehmenden-IDs, `snapshotHash`, `packedAt` und das Budget-Objekt dürfen nicht vorkommen. Ein Nachtrag prüft zusätzlich die Spitznamen. Eine Mutationsprobe (Hash in die Nachricht schreiben) macht den Test rot.

Warum die Folie zählt: Der Kontext enthält Daten aus der Vorlesung. Wer ihn sehen darf, darf nicht an der URL oder an einer Sitzungsnummer hängen, sondern an einer geprüften Berechtigung. Die Folie zeigt, dass die Rechte nicht nur einmal am Eingang geprüft werden. Jeder der drei Kontextaufbauten eines Auftrags prüft sie neu, auch der im Hintergrund. Das Host-Token bleibt auf dem Server; die Runtime sieht nur den fachlichen Kontext.

Was die Folie nicht behauptet: Sie ist eine Code-Lektüre, kein Sicherheitstest gegen Angriffe. In den Tests war die Host-Tokenprüfung gemockt, und die Aufrufe liefen über `createCaller` ohne HTTP. Die Folie sagt nichts über die Absicherung der Strecke zur Runtime; dort läuft ein eigenes Bearer-Token im Klartext über HTTP im privaten Netz (1B). Datenschutz des Inhalts ist damit nicht belegt.

## Begriffe

- **Issue #456:** Ein Eintrag im Projekt-Tracker von arsnova.eu, der beschreibt, welche Bereiche der Kontext für die Moderationszusammenfassung enthalten soll. Er liefert auch die synthetische Referenzfixture.
- **Rechteprüfung:** Eine Prüfung im Code, ob die anfragende Person die Daten sehen darf, hier ob sie Host der Sitzung ist. Sie stützt sich auf ein geprüftes Token, nicht auf Angaben aus der Oberfläche.
- **Host-Token:** Ein geheimer Schlüssel, den die Lehrperson als Host einer Sitzung erhält. Der Server prüft ihn bei Vorschau und Auftrag. Ohne gültiges Token gibt es weder Vorschau noch Auftrag.
- **Schemafassung (Vertrag):** Eine benannte, versionierte Beschreibung, wie Daten aussehen müssen, zum Beispiel `qa-ranking-v1`. Ändert sich das Format, ändert sich die Version, und eine falsche Version wird abgewiesen.
- **PostgreSQL:** Eine relationale Datenbank. Hier liegen Fragen, Stimmen, Quizdaten und Lernziele.
- **Redis, Snapshot:** Redis ist ein schneller Speicher im Arbeitsspeicher. Ein Snapshot ist eine dort abgelegte Momentaufnahme, hier der berechneten Themen der Fragen.
- **Lehrsignale:** Sammelbegriff für Quizergebnisse, Blitzlicht und Kompass-Signale, die der Lehrperson zeigen, wie die Vorlesung läuft.
- **Fingerprint:** Ein kurzer Prüfwert über einen Datenstand. Ändern sich die Daten, ändert sich der Fingerprint.
- **Draht-Body:** Der tatsächliche Inhalt der Netzanfrage an die Runtime, so wie er über die Leitung geht.
- **Vorschau:** Ansicht für die Lehrperson, die zeigt, welcher Kontext an das Modell ginge. Sie wird mit derselben Funktion gebaut wie der Auftrag.
- **Mock:** Ein Testersatz für einen echten Teil, etwa die Tokenprüfung. Er macht Tests unabhängig, prüft diesen Teil aber nicht mit.

## Fragen

### Warum acht Prüfungen je Aufbau? Ist das nicht doppelt?

Die Prüfungen sitzen an verschiedenen Datenquellen: Q&A, Themen, Lehrsignale, Lernziele und die Zusammensetzung. Jede Quelle prüft selbst, ob sie gelesen werden darf. Die Zahl 8 ist aus dem Code gezählt (`1C-diagrams.md`, Stand `def56700`); ihre Kosten sind nicht getrennt gemessen, sie stecken im ganzen Kontextaufbau.

### Warum werden die Rechte im Hintergrund noch einmal geprüft?

Zwischen Klick und Inferenz vergehen Minuten, und jeder Kontextaufbau läuft durch dieselben Funktionen mit ihren Prüfungen (`1C-diagrams.md`). Ein Fall steht dort ausdrücklich: Schaltet der Host Q&A nach der Anfrage ab, ersetzt eine andere Prüfung die Q&A-Prüfung, `processJob` bricht nicht ab, und prepare (2) liefert das regelbasierte Ergebnis „zu wenige Fragen“. Ob der Hintergrund-Aufbau jede Rechteänderung abfängt, ist nicht getrennt getestet.

### Woher wissen Sie, dass das Token nicht an die Runtime geht?

Test E2 durchsucht den rohen Body an die Runtime nach Token, Sitzungskennungen, allen 200 Teilnehmenden-IDs, Hash, Zeitstempel und Budget. Keines davon kommt vor. Eine Mutationsprobe, die den Hash in die Nachricht schreibt, macht den Test rot.

### Ist das ein Sicherheitsnachweis?

Nein. Es ist eine Rekonstruktion am Code mit Tests der Schichtentrennung. In den Tests war die Host-Tokenprüfung gemockt; einen Angriffstest gab es nicht. Die Strecke zur Runtime schützt ein eigenes Token im Klartext, das ein privates Netz allein nicht absichert.

### Gab es auf dem Weg einen stillen Verlust von Daten?

Zwei Ausnahmen sind benannt: Ein Themen-Snapshot fremder Version wird still wie „keine Daten“ behandelt (T2.3), und Bereiche können aus Budgetgründen leer bleiben, obwohl sie als verfügbar gelten. Beides steht in Reserve R9.

### Warum gilt die Tabelle für `def56700` und nicht für v1.3.0?

Gemessen und gelesen wurde der aktuelle Stand, weil der Prüfer das verlangt hat. Zwischen v1.4.0 und `def56700` sind die Pfaddateien byte-gleich. Ein früheres Dossier auf älterem Stand ist als überholt markiert.

## Übergang

Weiter zu J6: Kommt bei der Runtime genau das an, was die Vorschau zeigt? Bei Fragen zu Versionskonflikten und fehlenden Bereichen in Reserve R9 springen (Taste `r`).
