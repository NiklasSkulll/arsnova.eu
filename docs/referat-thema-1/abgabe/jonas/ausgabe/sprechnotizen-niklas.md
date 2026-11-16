# Sprechnotizen Niklas

Gesamt 13:10 min, Kurzfassung 10:25 min (Folien mit der Marke „Kurzfassung“). Erzeugt aus `abgabe/niklas/folien-1a.mjs`, `folien-1b34.mjs` und G9 in `folien.mjs` (`notiz` = Fließtext, `stichpunkte`, `zeitS`, `kurzfassung`); nicht von Hand ändern. Vorgetragen wird aus den Stichpunkten; der Fließtext ist die ausformulierte Fassung zum Üben.

## Sprungplan

Ab der ersten Folie (N1) gezählt beginnt N10 in der Langfassung bei 8:10 min. N10 bis G9 brauchen zusammen 5:00 min. Damit sie bis 9:00 min gesprochen sind: Wer bei 4:00 min noch vor N10 steht, blättert mit Pfeil rechts ohne Kommentar bis N10 und spricht ab dort weiter. Bei Zeitdruck von Anfang an nur die Folien mit der Marke „Kurzfassung“ (10:25 min); sie enthält N10 bis G9.

**Zeitbudget:** Die Langfassung dauert 13:10 min und liegt über dem Budget von etwa 10:30 min. Bis gekürzt ist, gilt die Kurzfassung (10:25 min) als Vortragsplan.

## N1 Keine Freigabe für die spaCy-Glättung (45 s, kumuliert 0:45, **Kurzfassung** 0:45)

**Stichpunkte**

- Danke, Jonas: Ich bleibe auf dem App-Host
- Frage: Wie viel optionale Analyse verträgt er neben dem Live-Betrieb?
- Antwort vorweg: keine Freigabe für spaCy
- 40.000 von 40.000 Live-Aktionen ok, aber 7 von 60 Vergleichen verfehlen die Regel
- Nutzen ungemessen, deshalb bleibt spaCy aus; „schädlich“ sage ich nicht

**Fließtext**

Danke, Jonas. Ich bleibe auf dem App-Host und frage: Wie viel optionale Analyse verträgt er neben dem Live-Betrieb? Konkret geht es um die spaCy-Glättung der Wortwolke. Die Antwort vorweg: keine Freigabe. Alle 40.000 Live-Aktionen meiner Reihe kamen an, ohne einen Fehler. Aber mit spaCy verfehlen 7 von 60 Vergleichen die Regel, die ich vorher festgelegt habe, und den Nutzen von spaCy habe ich nicht gemessen. Deshalb bleibt spaCy aus. Warum ich trotzdem nicht sage, spaCy sei schädlich, zeige ich jetzt.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json (live.*.planned/succeeded, hypotheses.H1/H2); Leitfrage: Prüfungsdokument Abschn. 4.3, Gruppenauftrag 1A · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N2 Fünf Dienste teilen sich den App-Host (55 s, kumuliert 1:40)

**Stichpunkte**

- Fünf Dienste: Backend, PostgreSQL, Redis, PDF-Worker, spaCy
- Backend, DB, Redis ohne Limit; spaCy 1 CPU, 1 GiB, 64 PIDs wie in Produktion
- Limit = Obergrenze, keine Reservierung für die App (cgroup v2)
- LLM nicht hier: ADR-0035, zweiter Host (1B); spaCy-Befund gilt nicht für ein LLM

**Fließtext**

Auf dem App-Host laufen fünf Dienste: das Backend mit den Live-Aktionen, PostgreSQL, Redis, der PDF-Worker und der spaCy-Sidecar. Backend, Datenbank und Redis haben kein Limit. spaCy hat wie in der Produktions-Compose eine CPU, ein Gibibyte und vierundsechzig Prozesse. Wichtig für alles Weitere: Ein cgroup-Limit ist eine Obergrenze. spaCy darf höchstens so viel nehmen, aber für die App wird damit nichts reserviert. Eine Hintergrundaufgabe kann die interaktiven Anfragen also trotzdem bremsen. Ein großes Sprachmodell gehört nach ADR-0035 gar nicht auf diesen Host, das ist der zweite Host aus 1B. Deshalb sagt mein Ergebnis zu spaCy nichts über ein LLM.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json; Limits aus den Laufmanifesten V2/block-01/lauf.json manifest.services (= docker-compose.prod.yml, aufgelöste Compose je Lauf); Kernel-Doku cgroup v2, Abschn. „Resource Distribution Models“ (Limits); ADR-0035 Z. 27–31 · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N3 Fünf Varianten, je Block zufällig gemischt (55 s, kumuliert 2:35, **Kurzfassung** 1:40)

**Stichpunkte**

- V0 nur Live-Last, V1 Analyse ohne spaCy = Basis
- V2 spaCy 1 CPU, V3 0,25 CPU, V4 Proxy +6 s hinter Timeout 5 s
- Profil: 60 s warm, 300 s Fenster, 500 Beitritte in 90 s, Analyse alle 2 s
- 5 Blöcke, Reihenfolge gemischt, Vergleich nur im selben Block
- Ziel: Rauschen sichtbar machen, nicht verstecken

**Fließtext**

Ich vergleiche fünf Varianten. V0 ist nur Live-Last. V1 ruft zusätzlich die Analyse auf, aber mit spaCy aus, also lexikalisch; das ist meine Basis. V2 ist spaCy im Normalbetrieb mit einer CPU, V3 gedrosselt auf ein Viertel CPU, und in V4 sitzt ein Proxy vor spaCy, der sechs Sekunden verzögert, länger als der Timeout von fünf Sekunden. Jeder Lauf hat dasselbe Profil: eine Minute Aufwärmen, dann fünf Minuten Messfenster mit fünfhundert Beitritten in neunzig Sekunden, und fünf Lehrende rufen alle zehn Sekunden die Analyse ab. Jede Variante läuft in fünf Blöcken, innerhalb eines Blocks in zufälliger Reihenfolge. Verglichen wird nur innerhalb desselben Blocks. So wird Laufrauschen sichtbar, statt sich in einem einzigen Lauf zu verstecken.

_Quelle:_ 1A-Versuchsvertrag (Varianten, Lastprofil); evidenz/1A/reihe-main-a19ca70f-20261115-122547/plan.json (profile, runs, Seed 438314513); Laufmanifeste (Limits, NLP_TIMEOUT_MS), auswertung.json runs[V4].proxy.delayMs · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N4 Die Regel stand eine Woche vorher fest (50 s, kumuliert 3:25)

**Stichpunkte**

- Regel: p95 höchstens +10 % und +50 ms, je Aktion und Block
- p95: Nutzer warten auf die langsamen Anfragen
- Alle 5 Blöcke müssen bestehen, kein Ausreißer entfernt
- In Git seit 07.11., Läufe am 15.11.: gut eine Woche
- Vertragshash in jedem Lauf; vorhergesagt ≠ hinterher gesucht

**Fließtext**

Wann ist spaCy unschädlich? Die Regel: Je Aktion und Block darf der p95 gegenüber V1 höchstens zehn Prozent und höchstens fünfzig Millisekunden steigen, beides zugleich. Ich schaue auf den p95, weil die Nutzer gerade auf die langsamen Anfragen warten. Alle fünf Blöcke müssen bestehen, und Ausreißer entferne ich nicht. Entscheidend ist der Zeitpunkt: Die Regel steht seit dem siebten November in Git, also gut eine Woche vor den gewerteten Läufen am fünfzehnten. Die zweite Vertragsfassung und der Nachtrag für den neuen Code-Stand haben die Schwellen nicht verändert, und jeder Lauf trägt den Hash des Vertrags. Damit unterscheide ich sauber zwischen dem, was ich vorhergesagt habe, und dem, was ich erst hinterher in den Daten gesucht habe.

_Quelle:_ 1A-Versuchsvertrag (Regeltabelle, „Alle fünf Blöcke“; SHA-256 f7d3eba4… = contractSha256 aller 25 Laufmanifeste); Git: 2372a037 2026-11-07T16:19:22+01:00, 35271586 2026-11-12T18:31:57+01:00, e3b27b32 2026-11-14T15:42:50+01:00; erster Lauf 2026-11-15T11:40:34.030Z (lauf.json manifest.startAt) · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N5 Alle 40.000 Live-Aktionen kamen an (50 s, kumuliert 4:15, **Kurzfassung** 2:30)

**Stichpunkte**

- 40.000 von 40.000 ok, 25 Läufe, 0 Fehler
- Ein Punkt = p95 eines Laufs, lineare Achse bis 1 s
- Höchster Quiz-Lauf 167 ms, Ziel ≤ 1.000 ms
- Eingänge des Kompasses; Anzeige im Browser nicht gemessen

**Fließtext**

Zuerst das, was hält. In allen fünfundzwanzig Läufen kamen alle 40.000 Live-Aktionen an: Beitritte, Quizstimmen, Tempostimmen und Q&A-Fragen. Jeder Punkt ist der p95 eines Laufs. Die Achse ist linear und reicht bis zum Ziel von einer Sekunde, das ich für die Quizstimme vorab gesetzt hatte. Der langsamste Lauf liegt beim Quiz bei 167 Millisekunden, also weit darunter. Die meisten Punkte liegen unter sechzig Millisekunden. Diese Aktionen sind die Eingänge, aus denen der Moderationskompass seine Signale bildet. Wie schnell eine Karte dann im Browser der Lehrperson erscheint, habe ich nicht gemessen.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json runs[].live.<aktion>.p95Ms, planned, succeeded, failed; Kompass-Eingänge: docs/GLOSSAR.md (Moderationskompass) · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N6 Deutlich verletzt wird die Regel nur einmal (75 s, kumuliert 5:30, **Kurzfassung** 3:45)

**Stichpunkte**

- 80 Vergleiche, grau = hält
- [Weiter] Kontrolle ohne spaCy: 4 Treffer, je wenige ms
- [Weiter] Mit spaCy 3 kleine Treffer: H1, H2 formal nicht bestätigt
- [Weiter] V3, letzter Lauf: 3 über 50 ms, bis +214 ms
- Summe 11 von 80; Regel bleibt, weil vorher festgelegt

**Fließtext**

Jetzt die Regel. Das sind alle 80 gepaarten Vergleiche: jede Aktion in jedem Block gegen ihre Basis. Grau heißt: hält. [Weiter] Zuerst die Kontrolle, V1 gegen V0, ganz ohne spaCy. Schon sie verfehlt die Regel 4-mal, um höchstens 16 Millisekunden. Bei p95-Werten um zwanzig Millisekunden reichen dafür zwei Millisekunden Schwankung. [Weiter] Mit spaCy kommen 3 ebenso kleine Treffer dazu, alle unter fünf Millisekunden. Formal reicht das schon: H1 und H2 sind nicht bestätigt. [Weiter] Und hier der eine deutliche Effekt: V3, also spaCy gedrosselt, im letzten Lauf der Reihe. 3 Aktionen über fünfzig Millisekunden, bis zu 214 Millisekunden mehr. Insgesamt verfehlen 11 von 80 die Regel. Ich lasse sie trotzdem stehen, weil sie vorher festgelegt war.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json comparisons[] (relativePassed, absolutePassed, absoluteChangeMs); evidenz/1A/…/auswertung/live-vergleiche.csv; nachgerechnet aus durationSamplesMs (Nearest Rank), 0 Abweichungen · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N7 Der Ausreißer dauerte rund zehn Sekunden (60 s, kumuliert 6:30)

**Stichpunkte**

- Nachträglich ausgewertet, nicht vorab festgelegt
- 50 langsame Beitritte in ≈ 10 s; sonst je Aktion höchstens 1
- [Weiter] Zeitgleich die einzigen 3 Timeouts von V3, dann Gegendruck
- [Weiter] App bis 73 %, PostgreSQL bis 37 % einer CPU
- Ursache offen: Rückstau oder Host/DB; V4 spricht gegen Rückstau allein

**Fließtext**

Was ist im letzten Lauf passiert? Das ist eine nachträgliche Auswertung, nicht vorab festgelegt, deshalb das Etikett. Oben jeder Beitritt dieses Laufs. Alle 50 Beitritte über hundert Millisekunden liegen in einem Fenster von etwa zehn Sekunden; in den übrigen vierundzwanzig Läufen gibt es je Aktion höchstens 1 solchen Wert. [Weiter] Genau in diesem Fenster laufen die einzigen 3 Timeouts der ganzen gedrosselten Variante; danach lehnt der Client sofort ab, weil zwei Anfragen offen sind. [Weiter] Und zugleich steigt die CPU der App auf 73 Prozent einer CPU und die der Datenbank auf 37 Prozent; in allen anderen Läufen lag die Datenbank höchstens bei 27 Prozent. Die Ursache kann ich nicht eindeutig zuordnen. Ein Rückstau der gedrosselten Analyse passt dazu, aber in V4 gab es hunderte Timeouts ohne solchen Effekt. Ebenso möglich ist ein kurzes Ereignis auf Host oder Datenbank. Für die Entscheidung ändert das nichts.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/V3/block-05/lauf.json (live.actions.join.latency.durationSamplesMs, live.lifecycle.arrivals[].scheduledAtMs, analysis.analysis.calls[]), V3/block-05/ressourcen.json.gz (snapshots[].containers[].delta.cpuPercent); Vergleich mit allen übrigen Läufen; Zuordnung Stichprobe ↔ Ankunft ist eine Näherung (Abschlussreihenfolge) · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N8 spaCy bleibt im Budget, bis CPU fehlt (50 s, kumuliert 7:20, **Kurzfassung** 4:35)

**Stichpunkte**

- V2: ≈ 18 % einer CPU, < 1 % gedrosselt, ≈ 480 MiB
- V3: 20–24 % bei Quote 25 % → 88–96 % gedrosselt
- Reserve im Labor: < 0,5 CPU von 16, ≥ 11,7 GiB frei
- Reserve groß, schützt Latenz aber nicht; 8-vCPU-Zielhost nicht gemessen

**Fließtext**

Wo stand spaCy selbst? Links der Anteil gedrosselter CPU-Perioden, rechts die Speicherspitze, ein Punkt je Block. Im Normalbetrieb braucht spaCy rund 18 Prozent einer CPU, wird in unter einem Prozent der Perioden gedrosselt und kommt auf etwa 480 Mebibyte, weit unter der Schwelle. Gedrosselt auf ein Viertel CPU verbraucht es 20 bis 24 Prozent, also fast die ganze Quote, und wird in 88–96 Prozent der Perioden gedrosselt. Genau dort lag der Ausreißer. Zur Reserve, nach der die Leitfrage fragt: Im Labor brauchten alle Container zusammen weniger als eine halbe CPU von sechzehn, und mindestens 11,7 Gibibyte blieben frei. Die Reserve ist also groß, schützt die Latenz aber nicht automatisch. Und für den Zielhost mit acht vCPU habe ich das nicht gemessen.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json runs[].resources[alias=spacy] (cpuPercent, throttledPeriodRatio aus cpu.stat, lifetimePeakMemoryBytes aus memory.peak, oomKillDelta), runs[].resources[].cpuPercent (Summe je Lauf), runs[].collectorHost.minAvailableMemoryBytes · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N9 Nach 5 s liefert die App den Ersatz (50 s, kumuliert 8:10, **Kurzfassung** 5:25)

**Stichpunkte**

- Lexikalisch < 0,1 s, spaCy ≈ 0,5 s, gedrosselt 2–3 s
- V4: Ersatz nach ≈ 5 s, Proxy hat 0 Anfragen weitergeleitet
- V4 prüft Timeout und Ersatz, nicht langsames spaCy
- 250 Ersatzfälle = Gegendruck bei 2 offenen Anfragen

**Fließtext**

Was sehen die Lehrenden? Die lexikalische Wortwolke ist in unter einer Zehntelsekunde da. Mit spaCy im Normalbetrieb dauert es etwa eine halbe Sekunde, gedrosselt zwei bis drei Sekunden; 741 von 750 Analysen kamen dort noch an. In V4 greift nach rund fünf Sekunden der Timeout, und die App liefert die einfache lexikalische Wolke als Ersatz. Wichtig: Der Proxy hat keine einzige Anfrage weitergeleitet, weil der Client vorher abbricht. V4 prüft also den Timeout- und Ersatzpfad, nicht ein langsam rechnendes spaCy. Und 250 Ersatzfälle kommen gar nicht vom Timeout: Sind zwei Anfragen offen, lehnt der Client sofort ab. Das ist Gegendruck, kein Ausfall. Eine Frist unter der Verzögerung sorgt dafür, dass nichts endlos wartet.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json runs[].analysis (successLatency, fallbackLatency, outcomes, fallbackReasons), runs[V4].proxy (delayMs, forwarded, cancelledBeforeForward); NLP_TIMEOUT_MS aus den Laufmanifesten; SPACY_MAX_IN_FLIGHT: apps/backend/src/lib/spacyClient.ts Z. 22, Prüfung Z. 187 · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N10 Entscheidung: lexikalische Wortwolke bleibt (80 s, kumuliert 9:30, **Kurzfassung** 6:45)

**Stichpunkte**

- Keine Freigabe, NLP_ENABLED=false bleibt (kostet nichts)
- Regel verfehlt (7/60), Beweislast bei der Option, Nutzen ungemessen
- Budget 1 CPU / 1 GiB für neue Versuche; 0,25 CPU keine Einsparung
- Grenzen: ein WSL2-Host mit Generator, Beitrittswelle
- Selbstkritik: Regel zu empfindlich, künftig ohne Änderung kalibrieren
- Brücke: LLM rechnet Minuten → zweiter Host → Ausfall?

**Fließtext**

Meine Entscheidung ist die Gegenalternative aus dem Vertrag: keine Freigabe, spaCy bleibt aus, wie es in Produktion ohnehin eingestellt ist. Das kostet also nichts im Betrieb. Die Begründung: Die vorab festgelegte Regel ist verfehlt, und eine optionale Komponente muss ihre Unschädlichkeit belegen, nicht umgekehrt. Den Nutzen, also zusammengeführte Wortformen in der Wolke, habe ich nicht gemessen; dagegen stehen Image, Modell, Limits und Überwachung. Für neue Versuche bleibt das Budget von einer CPU und einem Gibibyte; ein Viertel CPU ist keine gleichwertige Einsparung. Die Grenzen: ein WSL2-Rechner mit dem Lastgenerator auf demselben Host und eine Beitrittswelle statt Dauerlast. Selbstkritisch: Die Regel war für p95-Werte um zwanzig Millisekunden zu empfindlich. Für einen neuen Versuch würde ich sie an einem Vergleich ohne Änderung kalibrieren. Das ist meine Frage an Sie. Und noch etwas: spaCy ist klein. Ein Sprachmodell rechnet Minuten je Auftrag, das hat Jonas gezeigt; deshalb steht es auf einem zweiten Host. Was passiert, wenn dieser Host ausfällt?

_Quelle:_ 1A-auswertung.md (Entscheidung, Budget und Rückweg, Grenzen); 1A-Versuchsvertrag (Gegenalternative); evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json hypotheses; NLP_ENABLED=false in docker-compose.prod.yml; LLM-Dauer: Jonas, J9 (1B) · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## M1 Störung am zweiten Host [Titel] (45 s, kumuliert 10:15, **Kurzfassung** 7:30)

**Stichpunkte**

- [Niklas: Übergang von 1A, Störungen, vorab festgelegte Schwellen]

**Fließtext**

[Vorlage für Niklas] Jonas hat gefragt: Was passiert, wenn der zweite Host langsam ist oder ausfällt? Ich habe die Runtime im Labor gezielt gestört: [Niklas: Störungen nennen]. Vorab festgelegt waren [Niklas: Schwellen].

_Quelle:_ [Niklas: Ergebnis-JSONs evidenz/1B/messung/<Datum>-lauf-<variante>-<auftrag>.json mit Rechner und Commit]

## M2 Ausfall: Ersatz statt Warten [Titel] (45 s, kumuliert 11:00, **Kurzfassung** 8:15)

**Stichpunkte**

- [Niklas: F1 Median mit n, F2 Median, Verhältnis, Bedeutung]

**Fließtext**

[Vorlage für Niklas] F1: Median [Niklas] Millisekunden bis zum Ersatz. F2: [Niklas]. [Satz zur Bedeutung]

_Quelle:_ [Niklas: Ergebnis-JSONs evidenz/1B/messung/<Datum>-lauf-<variante>-<auftrag>.json mit Rechner und Commit]

## M3 Live-Aktionen unter Störung [Titel] (45 s, kumuliert 11:45, **Kurzfassung** 9:00)

**Stichpunkte**

- [Niklas: p95 je Variante, Fehlerzahl, Einordnung]

**Fließtext**

[Vorlage für Niklas] [Niklas: Live-p95 je Variante, Fehler, App-Host-Ressourcen; Einordnung]

_Quelle:_ [Niklas: Ergebnis-JSONs evidenz/1B/messung/<Datum>-lauf-<variante>-<auftrag>.json mit Rechner und Commit]

## M4 Lohnt sich der zweite Host? [Titel] (45 s, kumuliert 12:30, **Kurzfassung** 9:45)

**Stichpunkte**

- [Niklas: Aufwand, Gewinn, Entscheidung, Grenze]

**Fließtext**

[Vorlage für Niklas] [Niklas: Aufwand je Punkt gegen den gemessenen Gewinn, Entscheidung mit ADR, Grenze]

_Quelle:_ [Niklas: Ergebnis-JSONs evidenz/1B/messung/<Datum>-lauf-<variante>-<auftrag>.json mit Rechner und Commit]

## G9 Trennung wirkt, Grenze ist die Inferenz (40 s, kumuliert 13:10, **Kurzfassung** 10:25)

**Stichpunkte**

- Jonas: Kontextpfad hält, zweiter Host kostet keine Zeit, Zeit steckt in der Inferenz; Gate verwirft alle geprüften Antworten
- Niklas: App-Host trägt die Live-Last, spaCy ohne Freigabe
- [Niklas: Störung und Aufwand]
- Gemeinsam: Trennung wirkt im Labor; Grenze = Inferenz und Option ohne Nutzenbeleg
- Wir freuen uns auf Ihre Fragen

**Fließtext**

Zum Schluss unsere Antwort auf die gemeinsame Leitfrage. Jonas hat gezeigt: Der Kontextpfad hält seine Zusagen, der zweite Host kostet keine relevante Zeit, und die Zeit steckt in der Inferenz; nach Version 1.4.0 besteht aber keine geprüfte Modellantwort das Gate. Mein Teil: Der App-Host trägt die Live-Last fehlerfrei, optionale Analyse bekommt ohne Nutzenbeleg keine Freigabe. [Niklas: Satz zu Störung und Aufwand.] Gemeinsam heißt das: Im Labor trennt die Architektur Live-Pfad und Inferenz wirksam; die Grenzen liegen in der Inferenz selbst und in optionaler Arbeit, deren Nutzen niemand gemessen hat. Wir freuen uns auf Ihre Fragen.

_Quelle:_ 1B-ergebnis.md, 1C-ergebnis.md (Kurzantwort, Verlauf 9f230abc); 1A: abgabe/niklas/folien-1a.mjs (N1, N10); 1B Schritte 3–4: offen

# Reserve

Nur auf Nachfrage (Taste `r`), keine Zeit im Vortrag.

## RN1 Reserve: Die Regel schlägt auch ohne Wirkung an

**Stichpunkte**

- Nachträglich: gepoolt V2 − V1 = −5,5 bis +0,1 ms
- Streuung je Variante > Effekt (V2 Beitritt 31–58 ms)
- Kontrolle 4/20; wirkungslos besteht nur ≈ 1 %
- Künftig ohne Änderung kalibrieren; hier gilt die Regel

**Fließtext**

Falls nach der Regel gefragt wird. Nachträglich ausgewertet: Gepoolt über alle fünf Blöcke weicht spaCy im Normalbetrieb um −5,5 bis +0,1 Millisekunden von der Basis ab, also praktisch nicht. Die Lauf-p95 streuen innerhalb derselben Variante stärker, beim Beitritt in V2 zwischen 31–58 Millisekunden. Die Kontrolle ohne spaCy verfehlt die Regel 4 von 20 Mal. Wären die Vergleiche unabhängig, bestünde selbst eine wirkungslose Komponente alle 20 nur mit etwa 1 Prozent. Für einen neuen Versuch würde ich die Regel deshalb an einem Vergleich ohne Änderung kalibrieren, für diesen Versuch gilt sie.

_Quelle:_ alle 25 lauf.json (live.actions.<aktion>.latency.durationSamplesMs), Nearest Rank gepoolt; Kontrolle: comparisons[variant=V1]; Unabhängigkeit ist eine grobe Annahme · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## RN2 Reserve: Was die Messung nicht zeigt

**Stichpunkte**

- Ein WSL2-Host, Generator auf demselben Host
- Beitrittswelle, synthetischer Korpus; kein Rendering, kein LLM
- v1.4.0 nach Freigabe des Prüfers (E-Mail 04.11.)
- KI: Codex für Werkzeuge und Auswertung; Messung und Deutung bei Niklas

**Fließtext**

Falls nach Gültigkeit oder Eigenanteil gefragt wird. Alle Zahlen gelten für dieses Labor: ein WSL2-Rechner mit dem Lastgenerator auf demselben Host, eine Beitrittswelle, ein synthetischer Korpus. Über Rendering, die Kompassanzeige und ein LLM sage ich nichts. Gemessen habe ich Version 1.4.0, weil der Prüfer das Aktualisieren des Forks freigegeben hat. Werkzeuge, Tests und Auswertung hat Codex umgesetzt; Auftrag, Labor, Messung, Freigaben und die Deutung sind meine.

_Quelle:_ 1A-auswertung.md (Grenzen), 1A-eigenanteil.md, 00-rahmen-und-pruefung.md (Freigabe des aktuellen main) · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…
