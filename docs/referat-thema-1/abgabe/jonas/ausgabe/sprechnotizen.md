# Sprechnotizen Jonas

Gesamt 14:35 min, Kurzfassung 6:25 min (Folien mit der Marke „Kurzfassung“). Erzeugt aus `folien.mjs` (`notiz` = Fließtext, `stichpunkte`, `zeitS`, `kurzfassung`); nicht von Hand ändern. Vorgetragen wird aus den Stichpunkten; der Fließtext ist die ausformulierte Fassung zum Üben.

## Sprungplan

Geplant: 14:35 min (Grenze 15:00 min), ab der ersten Folie (J1) gezählt. J13 beginnt im Plan bei 11:45 min; J13 und J15 brauchen zusammen 1:55 min. Bis 13:05 min bleiben 1:20 min Puffer. Wer bei 13:05 min noch vor J13 steht, blättert mit Pfeil rechts ohne Kommentar bis J13 und spricht ab dort weiter. Bei Zeitdruck von Anfang an nur die Folien mit der Marke „Kurzfassung“ (6:25 min); sie enthält J13 und J15.

## J1 Ein Klick. 152 Sekunden. Keine Modellantwort. (50 s, kumuliert 0:50, **Kurzfassung** 0:50)

**Stichpunkte**

- „Danke, Niklas. Die schwere Arbeit, die Inferenz, ist ausgelagert auf einen zweiten Host.“
- Ein Klick, 152 s Warten, keine Modellantwort
- Echter Auftrag Nr. 2, Laptop-CPU: Job 151,2 s, warm im Median 148,6 s
- Architektur Release 1.3, gemessen Code nach v1.4.0 (wichtig beim Gate)
- 1C (Petrol): Hält der Kontextpfad seine Zusagen?
- 1B Schritte 1–2 (Bernstein): Wo steckt die Zeit auf dem zweiten Host?

**Fließtext**

Danke, Niklas. Die schwere Arbeit, die Inferenz, ist ausgelagert auf einen zweiten Host. Was heißt das für einen einzelnen Auftrag? Ein Klick der Lehrperson, 152 Sekunden Warten, und am Ende steht keine Modellantwort auf dem Bildschirm. Dieser Auftrag ist echt, die Nummer 2 aus meinem gewerteten Lauf, auf der CPU meines Laptops. Davon rechnet der Server 151,2 Sekunden am Job; warme Aufträge brauchen im Median 148,6 Sekunden. Gemessen habe ich Code nach Version 1.4.0; das wird beim Gate wichtig. Zwei Fragen: Für 1C, hält der Kontextpfad seine Zusagen? Für 1B, Schritte 1 und 2, wo steckt die Zeit auf dem zweiten Host? Petrol ist 1C, Bernstein ist 1B; oben links zeigt der kleine Weg meinen Auftrag vom Klick bis zum Gate.

_Quelle:_ evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317 (Auftrag 2: treiber.auftraege clientWaitMs, zerlegung.auftraege jobMs; Spanne warm: zerlegung.auftraege 2–10); Code: 1B a19ca70f (v1.4.0-184), 1C-Nachlauf def56700 (v1.4.0-14), frühere 1C-Messungen v1.3.0-228 und v1.3.0-322; Leitfragen: Prüfungsdokument 4.3, ADR 1B-011

## J2 Zwei Hosts nachgebaut, Produktionscode unverändert (45 s, kumuliert 1:35)

**Stichpunkte**

- 1B Schritt 1: Zwei-Host-Deployment aus ADR-0035 nachgebaut
- Stand nach v1.4.0 statt Tag 1.3, auf Wunsch des Prüfers
- app-host: App, Adapter, DB, Redis · llm-host: LLM-Server, nur vom app-host, mit Token
- Abweichungen: 4 statt 8 CPUs; Timeout 300 statt 90 s (Kalibrierung 202 s)

**Fließtext**

Schritt 1 von 1B verlangt, das Zwei-Host-Deployment aus ADR-0035 nachzubauen. Gemessen habe ich auf Wunsch des Prüfers den aktuellen Stand nach Version 1.4.0, nicht den Tag 1.3. Zwei virtuelle Maschinen auf meinem Laptop: app-host mit App, Adapter, Datenbank und Redis; llm-host mit dem LLM-Server, erreichbar nur vom app-host und mit Token. Die Abweichungen stehen im Kasten: 4 statt 8 CPUs, weil sich beide VMs den Laptop teilen, und 300 statt 90 Sekunden Timeout, weil schon die Kalibrierung 202 Sekunden dauerte. Version 1.3 selbst lief mit 4 CPUs, 5 Gibibyte und 8 Sekunden Timeout. Gebaut habe ich alles von null mit einem Skript, und die Prüfungen danach sind grün: Der llm-host antwortet nur dem app-host und nur mit Token, das Modell ist per Prüfsumme festgelegt.

_Quelle:_ evidenz/1B/messung/2026-11-13-aufbau-von-null.txt · ThinkPad P50 · 82319946; Abweichungen: evidenz/1B/2026-11-12-aufbau.md (Komponenten, Befund 2, Abweichungen), evidenz/1B/2026-11-13-lauf.md (Kalibrierung, Versuch 3; Modell laut Manifest Qwen3-4B-Instruct-2507-Q4_K_M), ADR 1B-001, 1B-002, 1B-005, 1B-010

## J3 Host nach 67 ms frei, Inferenz 151 s (45 s, kumuliert 2:20, **Kurzfassung** 1:35)

**Stichpunkte**

- Karte für den Rest: oben app-host, unten llm-host
- Weg: Klick → Kontext → Netz → Inferenz → Nachprüfung → Gate
- Auftrag 2: Host frei nach 67 ms, Inferenz 151 s
- Kontext und Nachprüfung: Werte aus 1C, ein Rechner (klein vermerkt)
- Der Punkt wandert ab jetzt mit
- Vereinfacht: volle UML-Diagramme (Struktur, Zeitablauf) in der Reserve R15, R16

**Fließtext**

Hier ist die Karte für den Rest des Vortrags, mit den Werten von Auftrag 2. Oben der app-host, unten der llm-host. Der Auftrag startet links mit dem Klick, der Kontext wird gebaut, geht über das Netz zur Inferenz, kommt zurück, wird nachgeprüft und landet am Gate. An Klick und Inferenz stehen die Werte unseres Auftrags 2: Der Host-Aufruf kehrt nach 67 Millisekunden zurück, die Inferenz dauert 151 Sekunden. Die Werte an Kontext und Nachprüfung stammen aus 1C, gemessen auf einem Rechner ohne zweiten Host; das steht klein unter jedem Wert. Der Punkt wandert jetzt von Station zu Station mit, oben links auf jeder Folie. Die Karte ist vereinfacht; die vollständigen UML-Diagramme, Struktur und Zeitablauf, liegen für Fragen in der Reserve.

_Quelle:_ evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317 (Auftrag 2: hostReturnMs, inferMs); 1C-Werte: Nachlauf, Laptop (ThinkPad P50) · def56700, und Teil 2, Laptop · 248029dc (Test-Runtime)

## J4 Erst die Hypothese, dann die Messung (40 s, kumuliert 3:00)

**Stichpunkte**

- Hypothesen und Schwellen vor den gewerteten Läufen, Ausnahmen offengelegt
- 1B prüft: Netz ≤ 50 ms, Adapter ≤ 2 s; Anteil nur Konsistenz
- 1C zuerst ohne Modell getestet, mit Negativproben
- 1C-Labor: ein Rechner, Loopback; nach Papadopoulos, ohne Konfidenzintervalle

**Fließtext**

Erstens standen Hypothesen und Schwellen vor den gewerteten Läufen fest, mit offengelegten Ausnahmen. Für 1B: Netz im Median höchstens 50 Millisekunden, Adapter höchstens 2 Sekunden; das sind die echten Prüfungen. Der Inferenzanteil ist nur eine Konsistenzprüfung. Zweitens habe ich 1C zuerst ohne Modell getestet, mit Negativproben. Drittens das Labor: 1C lief auf einem Rechner über Loopback, ohne zweiten Host. Die Methode orientiert sich an Papadopoulos; Konfidenzintervalle und Wiederholungen über Instanzen fehlen. Wichtig ist die Reihenfolge: Netz und Adapter hätten scheitern können, deshalb standen die Schwellen fest, bevor ich gemessen habe.

_Quelle:_ adr/1B-008-kernaussagen-und-schwellen.md; adr/1C-003-teststrategie-modellfrei.md; evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317; Nachlauf 1C (Umgebung, Abweichungen): Laptop (ThinkPad P50) · def56700; ADR 1C-021 (Produktionslimits)

## J5 Der Host wartet nicht auf das Modell (40 s, kumuliert 3:40, **Kurzfassung** 2:15)

**Stichpunkte**

- Station Klick · 1C: Blockiert ein langsames Modell die Lehrperson?
- Queue: Kontext bauen, Auftrag ablegen, sofort pending
- Host-Aufruf 29,4 ms gegen Inferenz 223,7 s (1C-Nachlauf)
- Grenze: Auf den Kontextaufbau wartet der Host doch (E5, N3)

**Fließtext**

Erste Station, der Klick. Die Frage aus 1C lautet: Blockiert ein langsames Modell die Lehrperson? Der Mechanismus ist eine Queue. Der Host-Aufruf baut den Kontext, legt den Auftrag ab und kehrt sofort mit dem Status pending zurück. Gerechnet wird danach im Hintergrund, mit einem Slot. Im 1C-Nachlauf am Laptop dauert der Host-Aufruf im Median 29,4 Millisekunden, die Inferenz dagegen 223,7 Sekunden. Der Host ist also vom Modell entkoppelt. Eine Grenze bleibt: Auf den Kontextaufbau wartet er doch, denn der passiert im Aufruf selbst. Belegt ist das mit dem Test E5 und dem Laborfall N3.

_Quelle:_ evidenz/1C/2026-11-09-labor-nachlauf.md · Laptop (ThinkPad P50) · def56700 (Branch f746ffba); 1B: evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317

## J5b Jeder Kontextaufbau prüft die Rechte erneut (45 s, kumuliert 4:25)

**Stichpunkte**

- Schritt 1 von 1C: Woher kommt der Kontext, wer darf ihn sehen?
- Jeder Bereich aus #456: Datenquelle, Funktion, Schemafassung, Rechteprüfung
- Erst Host-Token, dann je Kontextaufbau 8 Rechteprüfungen
- Token bleibt auf dem Server (E2); Zeilennummern in der Diagrammdoku

**Fließtext**

Schritt 1 von 1C: Woher kommt der Kontext, und wer darf ihn sehen? Issue #456 nennt die Bereiche. Jeder hat eine Datenquelle, eine Funktion, eine versionierte Schemafassung und eine Rechteprüfung. Q&A-Fragen und Stimmen kommen aus PostgreSQL, die semantischen Themen aus einem Redis-Snapshot, Quiz, Blitzlicht und Kompass aus den Lehrsignalen, die Lernziele wieder aus PostgreSQL. Vorschau und Auftrag prüfen zuerst das Host-Token. Danach prüft jeder Kontextaufbau die Rechte erneut, acht Prüfungen je Aufbau. Das Token selbst bleibt auf dem Server und geht nicht an die Runtime, das zeigt Test E2. Die Tabelle mit Zeilennummern steht in der Diagrammdoku zu 1C.

_Quelle:_ 1C-diagrams.md, #456-Bereiche · Code-Stand def56700 (v1.4.0-14), gelesen am Laptop (ThinkPad P50); E2: evidenz/1C/2026-10-24-teil2.md · Laptop · 248029dc

## J6 Was die Vorschau zeigt, kommt an (55 s, kumuliert 5:20, **Kurzfassung** 3:10)

**Stichpunkte**

- Station Kontext: Kommt an, was die Vorschau zeigt?
- Schemas geprüft, gepackt; nur mit Host-Token
- Echter Ausschnitt der Nutzlast: gleicher Hash, byte-gleich mit der Vorschau
- Validierung 1,2 ms = 1,6 % (älterer Stand, Test-Runtime) → bleibt

**Fließtext**

Zweite Station, der Kontext. Die Frage: Bekommt die Runtime genau das, was die Lehrperson in der Vorschau sieht? Der Kontext entsteht aus dem App-Zustand, wird gegen versionierte Schemas geprüft und dann gepackt. Vorschau und Auftrag gibt es nur mit gültigem Host-Token, wie gerade gezeigt. Unten steht ein echter Ausschnitt der Nutzlast aus dem Nachlauf, mit synthetischen Daten: die Vertragsversion, ein abgeschalteter Bereich mit seinem Grund und eine Frage aus der Fixture. Vorschau und Nutzlast tragen denselben Hash, die Nachricht an die Runtime ist byte-gleich mit der Vorschau. Was kostet die strikte Validierung? 1,2 Millisekunden, 1,6 Prozent eines warmen Kontextaufbaus; gemessen nur auf dem älteren Stand, mit der Test-Runtime. Deshalb bleibt sie.

_Quelle:_ evidenz/1C/messung/2026-11-09-labor-nachlauf.json.gz, labor.quiet.runs[1] · Laptop (ThinkPad P50) · f746ffba (def56700); evidenz/1C/2026-10-24-teil2.md · Laptop (ThinkPad P50) · 248029dc; Berechtigung: routers/qa.ts, 1C-diagrams.md · def56700

## J7 Sicher geschätzt, aber Platz verschenkt (45 s, kumuliert 6:05)

**Stichpunkte**

- Budget zählt 1 Byte = 1 Token: sichere Obergrenze, kein Überlauf
- Rahmen = ganzes geschätztes Budget; Frage: Wie viel nutzt der Kontext?
- [Weiter] Echte Tokens im Median nur das 0,318-fache der Schätzung
- Rund zwei Drittel ungenutzt, trotzdem eine Frage weggelassen
- Empfehlung: genauere Zählung prüfen, nicht umgesetzt

**Fließtext**

Zur Frage nach den Kosten der Kontextbereitstellung. Das Budget schätzt Tokens über Bytes: Jedes Byte zählt als ein Token. Das ist eine Obergrenze, denn ein Token umfasst mindestens ein Byte; in keinem Lauf lief das Fenster über. Der Rahmen hier ist das ganze geschätzte Budget. Was meinen Sie, wie viel davon nutzt der Kontext wirklich? [Weiter] Die echten Tokens sind im Median nur das 0,318-fache der Schätzung. Rund zwei Drittel des geschätzten Budgets bleiben also ungenutzt. Und derselbe Kontext meldet gleichzeitig, dass eine Frage aus Budgetgründen weggelassen wurde. Ich empfehle, eine genauere Zählung zu prüfen. Umgesetzt ist das nicht.

_Quelle:_ evidenz/1C/2026-11-09-labor-nachlauf.md · Laptop (ThinkPad P50) · def56700 (Branch f746ffba); Meldung: evidenz/1C/messung/2026-11-09-labor-nachlauf.json.gz, labor.quiet.runs[1] · Laptop (ThinkPad P50) · f746ffba (def56700)

## J8 Gemessen am Draht, auf beiden Hosts (40 s, kumuliert 6:45)

**Stichpunkte**

- Netz trennen ohne Produktionscode: Mitschnitt auf beiden Hosts
- app-host t0 und t3, llm-host t1 und t2; je Dauer eine Uhr, etwa 1 ms Unsicherheit
- Netz = app-host minus llm-host: Auftrag 2 unter 1 ms, Median 0,43 ms (n = 10)
- Server ohne Inferenz 368 ms, Ursache offen

**Fließtext**

Wie trenne ich Netz und Inferenz, ohne Produktionscode anzufassen? Ich schneide auf beiden Hosts mit: am app-host t null und t drei, am llm-host t eins und t zwei. Jede Dauer misst eine Uhr; die Messunsicherheit der Uhren liegt bei etwa einer Millisekunde. Netz ist die Zeit am app-host minus die am llm-host: für Auftrag 2 unter einer Millisekunde, über alle 10 im Median 0,43. Transport heißt Netz plus Server ohne Inferenz. Auffällig: Server ohne Inferenz 368 Millisekunden, Ursache offen. Den Mitschnitt brauche ich, weil die App selbst nur die Gesamtzeit loggt; das Zusammenspiel zeigt die UML-Sequenz in Reserve R16.

_Quelle:_ evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317 (Auftrag 2: treiber.auftraege, zerlegung.auftraege)

## J8b Strecke und lokal: kein Unterschied messbar (35 s, kumuliert 7:20)

**Stichpunkte**

- Kontrolle C0: dieselbe kurze Anfrage über die Strecke und lokal
- Differenz der Mediane −2,0 ms, Schwelle vorab ≤ 5 ms: nicht nachweisbar
- Heißt nicht „kostenlos“: Drahtmessung 0,43 ms im Median

**Fließtext**

Bevor ich der Drahtmessung traue, eine Kontrolle. Kostet die Strecke zwischen den Hosts mehr als ein Aufruf im selben Host? Kontrolle C0 schickt dieselbe kurze Anfrage einmal vom app-host über das Netz und einmal vom llm-host an sich selbst und vergleicht die Mediane. Die Differenz ist −2,0 Millisekunden, also innerhalb der vorab festgelegten Schwelle von 5 Millisekunden: Ein Unterschied ist nicht nachweisbar, denn die Streuung je Seite ist größer. Das heißt nicht, dass die Strecke nichts kostet. Die eigentliche Zahl bleibt die Drahtmessung, 0,43 Millisekunden im Median.

_Quelle:_ evidenz/1B/2026-11-13-lauf.md, Nachtrag · ThinkPad P50 · 9e111d35

## J9 Die Zeit steckt in der Inferenz (50 s, kumuliert 8:10, **Kurzfassung** 4:00)

**Stichpunkte**

- Punkte auf Log-Achse; vorab: Netz ≤ 50 ms, Adapter ≤ 2 s
- [Weiter] Netz 0,43 ms, Transport 17,8 ms, Adapter 101 ms: beide bestanden
- [Weiter] Inferenz warm 148,3 s, kalt 200,5 s (gestrichelt)
- Anteil 99,92 %, mit PC-Kalibrierung über 99 %
- Netz und Adapter zählten erst bei Inferenz in Sekunden

**Fließtext**

Die ganze Zerlegung als Punkte auf logarithmischer Achse; Balken würden hier das Verhältnis verschleiern. Vorab standen zwei Schwellen fest: Netz im Median höchstens 50 Millisekunden, Adapter höchstens 2 Sekunden. [Weiter] Das Netz kostet im Median 0,43 Millisekunden, der Transport, also Netz plus Server ohne Inferenz, 17,8 Millisekunden, der Adapter 101. Beide Prüfungen sind bestanden. [Weiter] Und die Inferenz: warm im Median 148,3 Sekunden. Warm heißt: identischer Snapshot, Prompt aus dem Cache; die gestrichelte Marke ist der kalte Auftrag, 200,5 Sekunden. Der Anteil von 99,92 Prozent hängt an dieser langsamen CPU, läge aber auch mit der PC-Kalibrierung über 99 Prozent. Netz und Adapter zählten erst, wenn die Inferenz nur Sekunden dauerte.

_Quelle:_ evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317; Kalt: evidenz/1B/2026-11-13-lauf.md, Nachtrag · ThinkPad P50 · 9e111d35

## J10 Das Netz ist 0,3 mm auf 105 m (30 s, kumuliert 8:40, **Kurzfassung** 4:30)

**Stichpunkte**

- Warmer Auftrag = Fußballfeld, 105 m
- Inferenz: praktisch das ganze Feld
- Transport gut 1 cm, Netz 0,3 mm: dünner als die Kreidelinie
- Netz optimieren lohnt nicht, jedenfalls auf dieser CPU

**Fließtext**

Wäre der Median eines warmen Auftrags so lang wie ein Fußballfeld, dann nähme die Inferenz praktisch das ganze Feld ein. Der Transport wäre gut ein Zentimeter, und darin steckt das Netz mit 0,3 Millimetern, dünner als die Kreidelinie am Tor. Am Netz zu optimieren lohnt sich nicht, jedenfalls auf dieser langsamen CPU. Den Hebel gibt es nur bei der Inferenz selbst: schnellere Hardware, kürzere Ausgabe oder ein kleineres Modell.

_Quelle:_ evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317; Maßstab: T_job warm (n = 9), Netz und Transport Median über alle 10

## J10a Frisch gestartet: 200,5 s statt 148,6 s (40 s, kumuliert 9:20)

**Stichpunkte**

- Warm = gleicher Snapshot, Prompt aus dem Cache; gilt das auch frisch gestartet?
- 5 Kaltläufe: Median 200,5 s gegen warm 148,6 s; kalter erster Auftrag 213,7 s
- Vorlesung ändert den Zustand ständig: eher der Kaltwert
- Anteil der Inferenz auch kalt ≥ 95 %: Aussage hält

**Fließtext**

Warm heißt bei mir: derselbe Snapshot, der Prompt kommt aus dem Cache. Gilt das Ergebnis auch, wenn die Runtime frisch startet? Dafür habe ich 5 Läufe mit je frisch gestarteter Runtime gemacht. Kalt dauert ein Auftrag im Median 200,5 Sekunden, warm 148,6 Sekunden; der kalte erste Auftrag im gewerteten Lauf lag bei 213,7. Das sind getrennte Gruppen, keine Wiederholungen über Instanzen. In der Vorlesung ändert sich der Zustand ständig, dann gilt eher der Kaltwert. Der Inferenzanteil bleibt aber in allen 5 Läufen über 95 Prozent. Die Aussage hält also: Die Zeit steckt in der Inferenz.

_Quelle:_ evidenz/1B/2026-11-13-lauf.md, Nachtrag · ThinkPad P50 · 9e111d35; warm und Auftrag 1: evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317

## J10b Runtime gestoppt: Ersatz nach 88,5 ms (30 s, kumuliert 9:50)

**Stichpunkte**

- B0: Runtime-Container gestoppt, alle 10 Aufträge extraktiv (unavailable)
- Ersatz im Median nach 88,5 ms, Schwelle vorab ≤ 2 s
- Toter Host kostet fast nichts; langsamer oder stummer Host: Niklas, Schritte 3–4

**Fließtext**

Und wenn der llm-host gar nicht antwortet? Im Ausfallversuch B0 habe ich den Runtime-Container vor dem Treiber gestoppt. Alle 10 Aufträge endeten mit der extraktiven Zusammenfassung und dem Grund unavailable, im Median nach 88,5 Millisekunden. Die Schwelle von 2 Sekunden stand vorher fest. Ein toter Host kostet also fast nichts. Andere Ausfälle, etwa ein langsamer oder stummer Host, sind damit nicht gemessen; die untersucht Niklas.

_Quelle:_ evidenz/1B/2026-11-13-lauf.md, Nachtrag · ThinkPad P50 · 9e111d35

## J11 90 s Timeout ab Werk sind auf der CPU zu kurz (55 s, kumuliert 10:45)

**Stichpunkte**

- Timeout ab Werk 90 s; PC 98,7 s, Laptop Median 163,4 s → zu kurz
- Speicher: +0,419 GB je Auftrag bei wechselnden Prompts (Prompt-Cache, PC); Grenze 10 GiB
- OOM im 21. (alt) bzw. 19. Auftrag (neu); 1B gleicher Prompt: 4,04 GB
- Empfehlung: Timeout je Host, --cache-ram (Ausgabe 3 % langsamer, nicht zuzuordnen); nicht umgesetzt

**Fließtext**

Die Zeit steckt in der Inferenz; was heißt das für den Betrieb? Erstens der Timeout: Ab Werk bricht die App in Version 1.4.0 nach 90 Sekunden ab. Am PC ergab die Kalibrierung 98,7 Sekunden, am Laptop dauerte die Inferenz im Median 163,4. Der Timeout ist also zu kurz auf beiden Laborrechnern; über andere Hardware sagt das nichts. Zweitens der Speicher: Bei wechselnden Prompts wächst die Runtime je Auftrag um 0,419 Gigabyte; die Ursache ist der Prompt-Cache, gezeigt am PC. Beide Grenzen liegen bei 10 Gibibyte. Auf dem älteren Stand starb die Runtime im 21. Auftrag, auf dem neuen schon im 19.; warum früher, habe ich nicht getrennt gemessen. Im 1B-Lauf mit gleichem Prompt blieb sie bei 4,04 Gigabyte. Ich empfehle, den Timeout je Inferenz-Host zu kalibrieren und den Cache mit --cache-ram zu begrenzen; im Versuch war die Ausgabe dann um 3 Prozent langsamer, wegen fester Reihenfolge nicht dem Cache zuzuordnen. Umgesetzt ist das nicht.

_Quelle:_ ADR 1C-023 (Laptop 9f230abc: evidenz/1C/2026-11-05-labor.md; PC i7-8700 · 9f230abc), ADR 1C-024 (U1, PC · 9f230abc); Nachlauf N3, N6 · Laptop (ThinkPad P50) · def56700; 1B-Speicher: evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317

## J12 Nachprüfung: wenig Zeit, unter Voting riskant (60 s, kumuliert 11:45)

**Stichpunkte**

- Zeitleiste Auftrag 2: Host frei 67 ms, Inferenz 150,8 s, dann Nachprüfung (0,03 %)
- [Weiter] Eine Stimme während der Inferenz (Zeitpunkt gedacht)
- [Weiter] Hash anders → source_changed, Antwort verworfen (E7, E8)
- Preis unter Voting; Häufigkeit offen, Empfehlung zurückgehalten (M7)
- Blitzlicht außer TEMPO: Hash hängt an der Uhrzeit (YESNO); empfohlen, nicht umgesetzt

**Fließtext**

Nächste Station, nach der Inferenz. Was passiert, wenn sich die Daten ändern, während das Modell rechnet? Hier die Zeitleiste unseres Auftrags 2: Der Host ist nach 67 Millisekunden frei, die Inferenz dauert 150,8 Sekunden, danach wird der Kontext noch einmal gebaut und sein Hash verglichen. Zeitlich kostet das 0,03 Prozent eines Auftrags. [Weiter] Jetzt kommt während der Inferenz eine Stimme an; den Zeitpunkt habe ich gewählt, er ist nicht gemessen. [Weiter] Bei der Nachprüfung ist der Hash anders, und die Antwort wird mit source_changed verworfen, nach zweieinhalb Minuten Rechenzeit. Dass das so passiert, zeigen die Tests E7 und E8. Das ist der eigentliche Preis: Unter laufendem Voting verwirft jede Stimme während der Inferenz die Antwort. Wie oft das in einer Vorlesung passiert, weiß ich nicht belastbar, deshalb halte ich die Empfehlung zurück. Die Nachprüfung bleibt trotzdem, weil sonst veraltete Ergebnisse als gültig gälten. Dazu ein Befund: Bei laufender Blitzlicht-Runde außer TEMPO hängt der Hash von der Uhrzeit ab, geprüft an YESNO. Empfohlen, nicht umgesetzt.

_Quelle:_ Nachlauf N3, N5 · Laptop (ThinkPad P50) · def56700; ADR 1C-017 · Laptop und PC · 9f230abc; E7, E8: evidenz/1C/2026-10-24-teil2.md · Laptop · 248029dc (Test-Runtime)

## J13 38 geprüfte Antworten, keine besteht das Gate (70 s, kumuliert 12:55, **Kurzfassung** 5:40)

**Stichpunkte**

- Station Gate: Hier scheitert unser Auftrag (links die echte Antwort)
- Gate prüft die Form: ≥ 2 Aussagen, Stichwort vorn, ganze Sätze, keine Metasätze; Sprache und Thema nicht
- Ein Feld je geprüfter Antwort: 1B 10, 1C 28
- [Weiter] 0 von 38 bestehen; ein Modell, eine Fixture
- [Weiter] Vor v1.4.0 ohne Gate 19 von 20; Ablation: neu nur Form (22 von 28 englisch), alt 26 von 59 mit internen Status
- [Taste: Clip] Lehrperson sieht Ersatz mit allgemeinem Hinweis, keinen Grund; Empfehlung: gemeinsam abstimmen

**Fließtext**

Und jetzt das Gate. Hier scheitert unser Auftrag. Links die echte Antwort des Modells, gekürzt, im Original. Das Gate prüft vor allem die Form: mindestens zwei Aussagen, jede mit einem Stichwort vorn, verschiedene Stichwörter, ganze Sätze, keine Metasätze. Ausgaben mit Status failed und unsichere ohne Aussagen lässt es durch, aber jede geprüfte Antwort hatte Aussagen. Sprache und Thema prüft es nicht. Jedes Feld darunter ist eine geprüfte Antwort, oben die 10 aus 1B, unten die 28 aus dem 1C-Nachlauf. [Weiter] Keine einzige besteht; ein Modell, eine Fixture. [Weiter] Vor Version 1.4.0, mit älterer Instruktion und ohne Gate, endeten 19 von 20 Aufträge mit Modellzusammenfassung. Ein Upstream-Commit änderte Instruktion und Gate zugleich, ein zweiter weitete das Gate auf unsichere Antworten aus. Die Offline-Ablation trennt die Regeln: Die neuen Antworten scheitern nur an der Form, 22 von 28 sind englisch. Die alten hätte das Gate auch verworfen, 26 von 59 nannten interne Status. Rechts die Lehrenden-Sicht aus dem Labor, gerafft: Ersatzzusammenfassung mit allgemeinem Hinweis, den Grund erfährt die Lehrperson nicht. Meine Empfehlung: Instruktion, Grammatik und Gate gemeinsam abstimmen. Umgesetzt ist das nicht.

_Quelle:_ evidenz/1B/messung/2026-11-15-abgelehnte-antwort.json (Auftrag 2); Lauf 1B · ThinkPad P50 · 8e9d1317 (Code a19ca70f); Nachlauf · Laptop · def56700; ADR 1C-018 · 9f230abc; Gate-Ablation: evidenz/1C/2026-11-16-gate-ablation.md · Laptop, offline · def56700 und 9f230abc; Upstream-Commits 12f1d8e4, a998ada0; Clip: evidenz/1B/2026-11-15-clip.md, 2026-11-15; Hinweis qaSummaryExtractive.ts

## J13b Cloud-Sicht: Bulkhead ja, Elastizität nein (50 s, kumuliert 13:45)

**Stichpunkte**

- NIST: IaaS ohne Selbstbedienung zur Laufzeit; keine schnelle Elastizität, nur vertikal von Hand
- Zweiter Host = Bulkhead; Nutzen nicht gemessen
- Kapazität aus dem Code: 1 Aufruf, Queue ≤ 8, rund 24 Zusammenfassungen pro Stunde
- SLO trennen: Verfügbarkeit (Fallback hält) und Nutzen (0 von 10)

**Fließtext**

Was heißt das aus Sicht des Kurses? Nach den NIST-Merkmalen ist das IaaS-Betrieb ohne Selbstbedienung zur Laufzeit: Netzzugang und Ressourcenbündelung sind gegeben, schnelle Elastizität fehlt, die Inferenz skaliert nur vertikal und von Hand. Der zweite Host ist ein Bulkhead, ein getrennter Fehler- und Ressourcenbereich; den Nutzen habe ich nicht gemessen. Kapazität, gerechnet aus dem Code und nicht gemessen: ein Aufruf zugleich, die Queue nimmt höchstens 8 an, danach queue_full mit Ersatz. Bei 148,6 Sekunden je Auftrag sind das rund 24 Zusammenfassungen pro Stunde. Als SLO würde ich Verfügbarkeit und Nutzen trennen: Endstatus nach 300 Sekunden erfüllt der Fallback, der Nutzen lag bei 0 von 10.

_Quelle:_ Code a19ca70f (gleich HEAD): apps/backend/src/lib/openWeightLlmClient.ts Z. 141 (inFlight), Z. 497 (busy); qaSummaryConfig.ts Z. 26 (QUEUE_LIMIT_DEFAULT = 8), Z. 29 (CONCURRENCY_DEFAULT = 1); qaSummaryQueue.ts Z. 510 (queue_full); Durchsatz aus T_job warm: evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317; NIST SP 800-145, S. 2 (Mell & Grance, 2011); ADR-0035 Abschn. 2.1, 2.2; SLO-Vorschlag: fragenkatalog.md F51; full-context: evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317

## J15 Entkopplung bleibt, Gate neu abstimmen (45 s, kumuliert 14:30, **Kurzfassung** 6:25)

**Stichpunkte**

- Bleibt: Queue, Nachprüfung, Validierung, Vorschau = Nutzlast; 1B-Topologie kostet keine Zeit
- Empfohlen, nicht umgesetzt: Instruktion und Gate abstimmen, Timeout je Host, Cache begrenzen
- Offen: Wie oft verwirft eine Stimme unter Voting die Antwort?
- [Weiter] Frage an Sie: Prüft das Gate das Richtige?
- [Weiter] „Und damit an Niklas: Was passiert, wenn der zweite Host langsam ist oder ausfällt?“

**Fließtext**

Was bleibt: die Entkopplung über die Queue, die Nachprüfung, die Validierung und die Gleichheit von Vorschau und Nutzlast; in 1B die Topologie, sie kostet keine relevante Zeit. Empfohlen, nicht umgesetzt: Instruktion und Gate gemeinsam abstimmen, den Timeout je Inferenz-Host kalibrieren, den Cache begrenzen. Offen ist, wie oft eine Stimme unter Voting die Antwort verwirft. Die Gründe für einen Ersatz sieht im Betrieb bisher niemand, deshalb sollten sie geloggt werden. Die Einzelheiten je Entscheidung, mit Kosten und Risiko, stehen in der Reserve. [Weiter] Meine Frage an Sie: Prüft das Gate das Richtige? [Weiter] Und damit an Niklas: Was passiert, wenn der zweite Host langsam ist oder ausfällt?

_Quelle:_ 1C-ergebnis.md, Abschnitt 5, ADRs 1C-010 bis 1C-024, Abschnitt Folgen (Laptop und PC · 9f230abc; Laptop · def56700); 1B-ergebnis.md, Entscheidung (ThinkPad P50 · 8e9d1317)

## J16 Literaturverzeichnis (5 s, kumuliert 14:35)

Das vollständige Literaturverzeichnis nach dem IU-Zitierleitfaden; dieselben Einträge wie im Handout.

_Quelle:_ literatur.mjs, abgeglichen mit main.bib des Handouts (PaperLab)

# Reserve

Nur auf Nachfrage (Taste `r`), keine Zeit im Vortrag.

## R1 Reserve: Kalibrierung des Timeouts

**Stichpunkte**

- Laptop-Kalibrierung 1C 196 s > 90 s → Labor 300 s, offen als Abweichung
- PC 98,7 s: schneller, aber ebenfalls über 90 s
- 1B: Kalibrierung 202 s → ebenfalls 300 s

**Fließtext**

Falls gefragt wird, warum ich nicht mit 90 Sekunden gemessen habe: Am Laptop dauerte die Kalibrierungsanfrage für 1C 196 Sekunden. Deshalb liefen die Laborläufe am Laptop mit 300 Sekunden, der Obergrenze des Produkts, offen als Abweichung markiert. Der PC war mit 98,7 Sekunden schneller, lag aber ebenfalls über 90. In 1B ergab die Kalibrierung 202 Sekunden, also auch dort 300.

_Quelle:_ adr/1C-020-timeout-300-s-und-kalibrierungsregel.md (Laptop; PC · 9f230abc); evidenz/1B/2026-11-13-lauf.md, Kalibrierung (ThinkPad P50 · 3b2aa5e6)

## R5 Reserve: Gültigkeitsgrenzen

**Stichpunkte**

- Laborrechner, ein Modell, synthetische Fixture, keine parallele Last
- Warm = gleicher Snapshot, Prompt aus dem Cache; sonst eher kalt 200,5 s
- Inferenzzeiten nicht auf den Produktionshost übertragbar
- Privates Netz ist noch kein Datenschutz

**Fließtext**

Was die Zahlen nicht sagen: Sie gelten für Laborrechner, ein Modell und eine synthetische Fixture, ohne parallele Last. Warm heißt in 1B: derselbe Snapshot, der Prompt kam aus dem Cache; ändert sich der Zustand, gilt eher der Kaltwert von 200,5 Sekunden. Inferenzzeiten sind nicht auf den Produktionshost übertragbar, und ein privates Netz ist noch kein Datenschutz.

_Quelle:_ evidenz/1C/2026-11-09-labor-nachlauf.md (Laptop · def56700); evidenz/1B/2026-11-13-lauf.md (ThinkPad P50 · 8e9d1317); Kaltwert: evidenz/1B/2026-11-13-lauf.md, Nachtrag · ThinkPad P50 · 9e111d35

## R6 Reserve: Anteil der KI

**Stichpunkte**

- KI entwarf Skripte, Tests, Auswertungen und Texte
- Ich: Hypothesen und Schwellen vorab freigegeben, Läufe gesteuert, Ergebnisse geprüft
- Ausnahmen: zwei 1C-Messungen ohne Freigabe; 1B-Leitfrage nach dem Lauf bestätigt
- Details je Artefakt: Eigenanteil-Dateien

**Fließtext**

Zur KI-Nutzung: Die KI hat Skripte, Tests, Auswertungen und Texte entworfen. Hypothesen und Schwellen habe ich vor den gewerteten Läufen freigegeben, mit offengelegten Ausnahmen: Zwei 1C-Messungen liefen ohne meine vorherige Freigabe, und die 1B-Leitfrage habe ich nach dem Lauf bestätigt. Die Läufe habe ich gesteuert und die Ergebnisse geprüft. Wer was gemacht hat, steht je Artefakt in den Eigenanteil-Dateien.

_Quelle:_ 1C-eigenanteil.md (Autorenprüfung); adr/1B-011-zeitbegriffe-und-leitfrage.md; 1B-eigenanteil.md (Stand 2026-11-14) · Arbeit an Laptop (ThinkPad P50) und PC (i7-8700) · Baselines 9f230abc, def56700, a19ca70f

## R7 Reserve: ADR-Zählung 1C

**Stichpunkte**

- Entscheidungen in 1C nach Status gezählt
- Keine Empfehlung umgesetzt
- Auftrag verlangt eine begründete Empfehlung, keinen Patch

**Fließtext**

Die Zählung der Entscheidungen in 1C nach Status. Keine Empfehlung ist umgesetzt, das verlangt der Auftrag so: Ergebnis ist eine begründete Empfehlung, kein Patch.

_Quelle:_ adr/README.md, Index · Messstände 9f230abc (Laptop und PC) und def56700 (Laptop)

## R9 Reserve: 1C Schritte 3–4, Konsistenzfälle

**Stichpunkte**

- Inkompatible Version, fehlender Bereich: kontrolliertes Ende mit Grund
- Stiller Feldverlust: fremde Snapshot-Version, aus Budgetgründen leere Bereiche
- Änderung nach dem Auftrag: Nachprüfung; Stimme im Aufbau: CONFLICT

**Fließtext**

Falls nach den Schritten 3 und 4 gefragt wird: Inkompatible Versionen und fehlende Bereiche enden kontrolliert, mit Zustand und Grund. Stiller Feldverlust kommt an zwei Stellen vor: bei einem Themen-Snapshot fremder Version und bei Bereichen, die aus Budgetgründen leer bleiben. Echte Änderungen nach dem Auftrag erkennt die Nachprüfung, eine Stimme während des Aufbaus endet mit CONFLICT.

_Quelle:_ 1C-ergebnis.md, Abschnitt 3 · Tests und Teil 2/3 auf 248029dc (Laptop, ThinkPad P50); Labor def56700

## R10 Reserve: 1B Schritt 1 und ADR-0035

**Stichpunkte**

- Adapter in der App (app-host), Encoder ab Werk aus, LLM-Server allein auf dem llm-host
- Aufbau Punkt für Punkt gegen ADR-0035 und Runbook abgeglichen
- Lücke: ADR-0035 nennt kürzere Ausgabegrenze → Antworten abgeschnitten

**Fließtext**

Falls nach Schritt 1 von 1B gefragt wird: Der Auftrag verlangt, App-Adapter, Encoder und LLM-Server zu unterscheiden. Der Adapter läuft in der App auf dem app-host, der Encoder ist ab Werk aus, der LLM-Server läuft allein auf dem llm-host. Den Aufbau habe ich Punkt für Punkt gegen ADR-0035 und das Runbook abgeglichen. Die auffälligste Lücke: ADR-0035 nennt eine kürzere Ausgabegrenze, als das Release setzt; mit ihr wären die Antworten abgeschnitten.

_Quelle:_ evidenz/1B/2026-11-12-aufbau.md (Komponenten, Abgleich) · ThinkPad P50 · a19ca70f; Lücke: evidenz/1B/2026-11-13-lauf.md, Manifest · 8e9d1317

## R11 Reserve: Was der Betrieb nicht sieht

**Stichpunkte**

- Log: nur Gesamtzeit eines Auftrags
- Inferenz, Netz, Adapter nur per Mitschnitt; Gate-Grund nur invalid_response
- Empfehlung: Zeiten und Fallback-Grund ohne Prompt loggen (#19, #20); nicht umgesetzt

**Fließtext**

Falls nach dem Betrieb gefragt wird: Die App schreibt nur die Gesamtzeit eines Auftrags ins Log. Inferenz, Netz und Adapter sieht man nur mit einem Mitschnitt, und warum das Gate verwirft, steht nirgends, nur der grobe Grund invalid_response. Ich empfehle, Zeiten und den Grund eines Fallbacks ohne Prompttext zu loggen, Issues 19 und 20; umgesetzt ist das nicht.

_Quelle:_ evidenz/1B/2026-11-13-lauf.md, Befund C; evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317

## R12 Reserve: Entscheidungen im Detail

**Stichpunkte**

- 1C bleibt: Nachprüfung, Validierung, Entkopplung, Vorschau; Risiko beim Voting
- Empfohlen, nicht umgesetzt: Gate, Timeout, Cache, Zählung, Snapshot, Blitzlicht
- 1B: Topologie bleibt, Hebel am Inferenz-Host; Logs erweitern

**Fließtext**

Falls nach den Entscheidungen im Einzelnen gefragt wird: Für 1C bleiben Nachprüfung, Validierung, Entkopplung und Vorschau; das kostet wenig Zeit, das Risiko liegt beim Voting. Empfohlen, aber nicht umgesetzt sind Änderungen an Gate, Timeout, Cache, Zählung, Snapshot und Blitzlicht, je mit Kosten und Risiko. Für 1B bleibt die Topologie, der Hebel liegt am Inferenz-Host; die Logs empfehle ich zu erweitern.

_Quelle:_ 1C-ergebnis.md, Abschnitt 5, ADRs 1C-010 bis 1C-024, Abschnitt Folgen (Laptop und PC · 9f230abc; Laptop · def56700); 1B-ergebnis.md, Entscheidung (ThinkPad P50 · 8e9d1317)

## R15 Reserve: Der Host-Aufruf wartet nie auf das Modell

**Stichpunkte**

- Abb. 1, Aktivitätsdiagramm (vereinfacht), Stand def56700
- Anfrage baut Kontext, Hash, Vertrag; Job in die Queue; kein Warten aufs Modell
- Gespeichert nur bei gleichem Hash und gültiger Form, sonst Ersatz mit Grund

**Fließtext**

Falls nach dem Aufbau des Kontextpfads gefragt wird: Das ist Abbildung 1 aus der Diagrammdoku, ein vereinfachtes Aktivitätsdiagramm auf dem Code-Stand def56700. Die Anfrage der Lehrperson baut auf dem App-Server den autorisierten Kontext, berechnet Budget, Hash und Vertrag und legt einen Job in die Queue; sie kehrt zurück, ohne auf das Modell zu warten. Der Job baut den Kontext vor und nach dem Modellaufruf neu. Gespeichert wird die Modellzusammenfassung nur bei gleichem Hash und gültiger Form, sonst der Ersatz mit Grund. Die großen Arbeitskarten A1 bis A3 stehen nur in 1C-diagrams.md.

_Quelle:_ 1C-diagrams.md, Abb. 1 (diagrams/1c-context-path-overview.light.svg, Legende diagrams/1c-legende.light.svg) · Code-Stand def56700 (v1.4.0-14, Branch f746ffba), gezeichnet am Laptop (ThinkPad P50)

## R16 Reserve: Kontext dreimal gebaut, Status prüft erneut

**Stichpunkte**

- Abb. 2, UML-Sequenz: gefüllt synchron, offen asynchron, gestrichelt Antwort
- Kontext bei Anfrage, vor und nach der LLM-Anfrage gebaut; Status prüft erneut
- Messpunkte t0–t3 (J8) auf den Pfeilen zur Runtime

**Fließtext**

Falls nach dem zeitlichen Ablauf gefragt wird: Abbildung 2, ein vereinfachtes UML-Sequenzdiagramm. Die API prüft die Rechte und baut den Kontext; ändern sich die Daten dabei, scheitert die Anfrage, sonst reiht sie asynchron einen Job ein und meldet pending. Die Queue baut den Kontext vor und nach der LLM-Anfrage neu und speichert die Modellzusammenfassung nur bei gleichem Hash und gültiger, formgerechter Antwort. Der Statusabruf prüft das fertige Ergebnis noch einmal gegen die aktuellen Daten. Die Messpunkte t0 bis t3 auf J8 liegen auf den Pfeilen zur Runtime und zurück.

_Quelle:_ 1C-diagrams.md, Abb. 2 (diagrams/1c-context-path-overview-sequence.light.svg) · Code-Stand def56700 (v1.4.0-14, Branch f746ffba), gezeichnet am Laptop (ThinkPad P50)
