# Sprechnotizen Jonas

Gesamt 12:15 min, Kurzfassung 7:05 min (Folien mit der Marke „Kurzfassung“). Erzeugt aus `folien.mjs` (`notiz`, `zeitS`, `kurzfassung`); nicht von Hand ändern.

## Sprungplan

Ab J1 gezählt beginnt J13 in der Langfassung bei 9:05 min. J13 und J15 brauchen zusammen 2:05 min. Damit beide bis 9:00 min gesprochen sind: Wer bei 6:55 min noch vor J13 steht, blättert mit Pfeil rechts ohne Kommentar bis J13, spricht J13 und danach J15. Bei Zeitdruck von Anfang an nur die Folien mit der Marke „Kurzfassung“; sie enthält J13 und J15.

## G0 Thema 1: KI-Inferenz im Moderationskompass (30 s, kumuliert 0:30)

Entwurf für Niklas und mich. Unser Thema ist die KI-Inferenz für den Moderationskompass. Die Leitfrage: Wie wirksam trennt die Architektur von Release 1.3 Anwendung, Kontextaufbau und private Inferenz unter realer Last? Reale Last haben wir nicht erzeugt, unsere Läufe sind sequenziell; das ist eine Grenze. Niklas beginnt mit dem App-Host, ich verfolge dann einen echten Auftrag über beide Hosts, und Niklas schließt mit Störungen und dem Aufwand der zweiten Serverrolle.

_Quelle:_ Prüfungsdokument Abschnitt 4.3 (Thema 1, Aufträge 1A–1C); 01-aufteilung.md; Design Abschnitt 3

## J1 Ein Klick. 152 Sekunden. Keine Modellantwort. (40 s, kumuliert 1:10, **Kurzfassung** 0:40)

Ein Klick der Lehrperson, 152 Sekunden Warten, und am Ende steht keine Modellantwort auf dem Bildschirm. Dieser Auftrag ist echt, die Nummer 2 aus meinem gewerteten Lauf. Davon rechnet der Server 151,2 Sekunden am Job, der Rest ist der Host-Aufruf und das Nachfragen. Zum Vergleich: Warme Aufträge brauchen im Median 148,6 Sekunden. Die Architektur folgt Release 1.3, gemessen habe ich aber Code nach Version 1.4.0. Das wird beim Gate wichtig. Zwei Fragen: Für 1C, hält der Kontextpfad seine Zusagen? Für 1B, Schritte 1 und 2, wo steckt die Zeit auf einem zweiten Host? Petrol ist 1C, Bernstein ist 1B.

_Quelle:_ evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317 (Auftrag 2: treiber.auftraege clientWaitMs, zerlegung.auftraege jobMs); Version: package.json und git describe (v1.4.0-255); Leitfragen: Prüfungsdokument 4.3, ADR 1B-011

## J2 Zwei Hosts nach Release 1.3, Code nach v1.4.0 (60 s, kumuliert 2:10)

Bevor man misst, muss das System stehen. Schritt 1 von 1B verlangt, das Zwei-Host-Deployment nachzubauen, so wie Release 1.3 es mit ADR-0035 beschreibt. Gemessen habe ich auf Wunsch des Prüfers den aktuellen Stand, nicht den Tag 1.3; der hatte noch 4 CPUs und 5 GiB. Ich habe zwei virtuelle Maschinen auf meinem Laptop aufgebaut. Auf dem app-host laufen die App mit dem Adapter, Datenbank und Redis; der Encoder bleibt aus, wie ab Werk. Auf dem llm-host läuft der LLM-Server mit dem gepinnten Modell, erreichbar nur vom app-host und mit Token. Die Abweichungen zum gemessenen Stand stehen im Kasten: 4 statt 8 CPUs, weil sich zwei VMs den Laptop teilen. Der Timeout liegt bei 300 statt 90 Sekunden, weil schon die Kalibrierung 202 Sekunden dauerte. Die Runtime startet direkt mit dem CPU-Override, weil der Wrapper es nicht durchreicht; seine Prüfungen liefen vorher. Und vor dem gewerteten Lauf habe ich Hintergrunddienste von Hand abgeschaltet.

_Quelle:_ evidenz/1B/messung/2026-11-13-aufbau-von-null.txt · ThinkPad P50 · 82319946; Abweichungen: evidenz/1B/2026-11-12-aufbau.md (Komponenten, Befund 2, Abweichungen), evidenz/1B/2026-11-13-lauf.md (Kalibrierung, Versuch 3), ADR 1B-001, 1B-002, 1B-005, 1B-010

## J3 Der Weg eines Auftrags (40 s, kumuliert 2:50, **Kurzfassung** 1:20)

Hier ist die Karte für den Rest des Vortrags. Oben der app-host, unten der llm-host. Der Auftrag startet links mit dem Klick, der Kontext wird gebaut, geht über das Netz zur Inferenz, kommt zurück, wird nachgeprüft und landet am Gate. An Klick und Inferenz stehen die Werte unseres Auftrags 2: Der Host-Aufruf kehrt nach 67 Millisekunden zurück, die Inferenz dauert 151 Sekunden. Die Werte an Kontext und Nachprüfung stammen aus 1C, gemessen auf einem Rechner ohne zweiten Host; das steht klein unter jedem Wert. Der Punkt wandert jetzt von Station zu Station mit.

_Quelle:_ evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317 (Auftrag 2: hostReturnMs, inferMs); 1C-Werte: Nachlauf, Laptop (ThinkPad P50) · def56700, und Teil 2, Laptop · 248029dc (Test-Runtime)

## J4 Erst die Hypothese, dann die Messung (50 s, kumuliert 3:40)

Belastbare Aussagen brauchen eine feste Reihenfolge. Erstens standen Hypothesen und Schwellen vor den gewerteten Läufen fest. Für 1B: Das Netz darf im Median höchstens 50 Millisekunden kosten, der Adapter höchstens 2 Sekunden, und die Inferenz muss mindestens 95 Prozent ausmachen. Die Ausnahmen nenne ich offen: Den Blitzlicht-Befund habe ich explorativ gefunden, zwei Messungen liefen ohne meine vorherige Freigabe, und die Leitfrage zu 1B habe ich erst nach dem Lauf bestätigt. Zweitens habe ich in 1C zuerst ohne Modell getestet, mit Negativproben: Ein absichtlicher Fehler muss den Test rot machen. Drittens das Labor. Für 1C heißt das: ein Rechner, die Runtime über Loopback, 4 CPUs und 5 GiB wie in Version 1.3.0, und ein Timeout von 300 Sekunden, weil die Kalibrierung am Laptop 196 Sekunden dauerte. Einen zweiten Host hatte 1C nicht.

_Quelle:_ adr/1B-008-kernaussagen-und-schwellen.md; adr/1C-003-teststrategie-modellfrei.md; evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317; Nachlauf 1C (Umgebung, Abweichungen): Laptop (ThinkPad P50) · def56700; ADR 1C-021 (Produktionslimits)

## J5 Der Host wartet nicht auf das Modell (40 s, kumuliert 4:20, **Kurzfassung** 2:00)

Erste Station, der Klick. Die Frage aus 1C lautet: Blockiert ein langsames Modell die Lehrperson? Der Mechanismus ist eine Queue. Der Host-Aufruf baut den Kontext, legt den Auftrag ab und kehrt sofort mit dem Status pending zurück. Gerechnet wird danach im Hintergrund, mit einem Slot. Gemessen am Laptop dauert der Host-Aufruf im Median 29,4 Millisekunden, die Inferenz dagegen 223,7 Sekunden. Der Host ist also vom Modell entkoppelt. Eine Grenze bleibt: Auf den Kontextaufbau wartet er doch, denn der passiert im Aufruf selbst. Belegt ist das mit dem Test E5 und dem Laborfall N3.

_Quelle:_ evidenz/1C/2026-11-09-labor-nachlauf.md · Laptop (ThinkPad P50) · def56700 (Branch f746ffba); 1B: evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317

## J6 Was die Vorschau zeigt, kommt an (60 s, kumuliert 5:20, **Kurzfassung** 3:00)

Zweite Station, der Kontext. Die Frage: Bekommt die Runtime genau das, was die Lehrperson in der Vorschau sieht? Der Kontext entsteht aus dem App-Zustand, wird gegen versionierte Schemas geprüft und dann gepackt. Vorschau und Auftrag gibt es nur mit gültigem Host-Token, und jeder Kontextaufbau prüft die Rechte erneut, acht Prüfungen je Aufbau. Unten steht ein echter Ausschnitt der Nutzlast aus dem Nachlauf, mit synthetischen Daten: die Vertragsversion, ein abgeschalteter Bereich mit seinem Grund und eine Frage aus der Fixture. Vorschau und Nutzlast tragen denselben Hash, die Nachricht an die Runtime ist byte-gleich mit der Vorschau. Was kostet die strikte Validierung? 1,2 Millisekunden, 1,6 Prozent eines warmen Kontextaufbaus; gemessen nur auf dem älteren Stand, mit der Test-Runtime. Deshalb bleibt sie. Welcher Bereich woher kommt, zeigt die Reserve.

_Quelle:_ evidenz/1C/messung/2026-11-09-labor-nachlauf.json.gz, labor.quiet.runs[1] · Laptop (ThinkPad P50) · f746ffba (def56700); evidenz/1C/2026-10-24-teil2.md · Laptop (ThinkPad P50) · 248029dc; Berechtigung: routers/qa.ts, 1C-diagrams.md · def56700

## J7 Sicher geschätzt, aber Platz verschenkt (40 s, kumuliert 6:00)

Zur Frage nach den Kosten der Kontextbereitstellung. Das Budget schätzt Tokens über Bytes: Jedes Byte zählt als ein Token. Das ist eine Obergrenze, denn ein Token umfasst mindestens ein Byte; in keinem Lauf lief das Fenster über. Aber es ist teuer. Die echten Tokens sind im Median nur das 0,318-fache der Schätzung. Rund zwei Drittel des geschätzten Budgets bleiben also ungenutzt. Und derselbe Kontext meldet gleichzeitig, dass eine Frage aus Budgetgründen weggelassen wurde. Ich empfehle, eine genauere Zählung zu prüfen. Umgesetzt ist das nicht.

_Quelle:_ evidenz/1C/2026-11-09-labor-nachlauf.md · Laptop (ThinkPad P50) · def56700 (Branch f746ffba); Meldung: evidenz/1C/messung/2026-11-09-labor-nachlauf.json.gz, labor.quiet.runs[1] · Laptop (ThinkPad P50) · f746ffba (def56700)

## J8 Gemessen am Draht, auf beiden Hosts (45 s, kumuliert 6:45)

Jetzt geht der Auftrag über die Grenze zum zweiten Host. Wie trenne ich Netz und Inferenz, ohne den Produktionscode anzufassen? Ich schneide auf beiden Hosts den Verkehr mit: am app-host t null und t drei, am llm-host t eins und t zwei. Jede Dauer misst eine einzige Uhr; zwei VM-Uhren lassen etwa eine Millisekunde Unschärfe. Netz ist die Zeit am app-host minus die Zeit am llm-host. Für unseren Auftrag liegt das unter einer Millisekunde, über alle 10 Aufträge im Median bei 0,43. Auffällig ist der Server ohne Inferenz: 368 Millisekunden, wie bei Auftrag 3, die Ursache ist offen. Die Lehrperson wartet 151,8 Sekunden, der Server rechnet 151,2; dazu kommen Host-Aufruf und Nachfragen im Sekundentakt.

_Quelle:_ evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317 (Auftrag 2: treiber.auftraege, zerlegung.auftraege)

## J9 Die Zeit steckt in der Inferenz (45 s, kumuliert 7:30, **Kurzfassung** 3:45)

So sieht die ganze Zerlegung aus, auf logarithmischer Achse. Der Hauptwert steht in Millisekunden: Das Netz kostet im Median 0,43, die Schwelle lag bei 50. Der Transport mit Serveranteil kostet 17,8 Millisekunden, der Adapter 101, bei einer Schwelle von 2 Sekunden. Die Inferenz dauert warm im Median 148,3 Sekunden. Ihr Anteil von 99,92 Prozent gilt nur für diese langsame CPU; auf schnellerer Hardware wäre er kleiner. Warm heißt: ein identischer Snapshot, der Prompt kam aus dem Cache. Ändert sich der Zustand, gilt eher der Kaltwert, im Median 200,5 Sekunden. Die drei Hypothesen sind erfüllt, kalt gilt der Inferenzanteil in allen fünf Läufen. Die zweite Serverrolle kostet keine relevante Zeit.

_Quelle:_ evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317; Kalt: evidenz/1B/2026-11-13-lauf.md, Nachtrag · ThinkPad P50 · 9e111d35

## J10 Wäre der Auftrag ein Fußballfeld … (25 s, kumuliert 7:55, **Kurzfassung** 4:10)

Wäre der Median eines warmen Auftrags so lang wie ein Fußballfeld, dann nähme die Inferenz praktisch das ganze Feld ein. Der Transport wäre gut ein Zentimeter, und darin steckt das Netz mit einem Drittel Millimeter, dünner als die Kreidelinie am Tor. Der Adapter in der App käme mit gut sieben Zentimetern dazu. Am Netz zu optimieren lohnt sich nicht, jedenfalls auf dieser langsamen CPU.

_Quelle:_ evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317; Maßstab: T_job warm (n = 9), Netz und Transport Median über alle 10

## J11 Betrieb: Timeout zu kurz, Speicher läuft voll (50 s, kumuliert 8:45, **Kurzfassung** 5:00)

Zurück zu 1C, zum Betrieb. Erstens der Timeout: Ab Werk bricht die App in Version 1.4.0 nach 90 Sekunden ab. Am PC ergab die Kalibrierung eine Inferenzzeit von 98,7 Sekunden, am Laptop dauert die Inferenz im Median 223,7, auf einem anderen Stand. Mit dem Timeout ab Werk von Version 1.4.0 wäre der Modellpfad auf beiden nicht nutzbar. Zweitens der Speicher: Bei wechselnden Prompts wächst die Runtime je Auftrag um 0,419 Gigabyte; die Ursache ist der Prompt-Cache, gezeigt am PC. Beide Laborgrenzen liegen bei 10 Gibibyte. Auf dem älteren Stand starb die Runtime im 21. Auftrag, auf dem neuen schon im 19.; die Ursache habe ich nicht getrennt gemessen. Im 1B-Lauf mit gleichem Prompt blieb er bei 4,04 Gigabyte, Ursache nicht getrennt gemessen. Ich empfehle, Timeout und Cache anzupassen; umgesetzt ist das nicht.

_Quelle:_ ADR 1C-020, 1C-024 · PC (i7-8700) · 9f230abc; Nachlauf N3, N6 · Laptop (ThinkPad P50) · def56700; 1B-Speicher: evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317

## J12 Nachprüfung: wenig Zeit, unter Voting riskant (50 s, kumuliert 9:35)

Nächste Station, nach der Inferenz. Was passiert, wenn sich die Daten ändern, während das Modell rechnet? Der Kontext wird danach noch einmal gebaut und sein Hash verglichen. Ändert sich eine Stimme oder wird eine Quelle gelöscht, wird die Antwort mit source_changed verworfen; das zeigen E7 und E8. Zeitlich kostet das 0,03 Prozent eines Auftrags. Der eigentliche Preis liegt woanders: Unter laufendem Voting verwirft jede Stimme während der Inferenz die Antwort. Wie oft das in einer Vorlesung passiert, weiß ich nicht belastbar; mein Modell dafür hat sein Kriterium verfehlt, deshalb halte ich die Empfehlung zurück. Die Nachprüfung bleibt trotzdem, weil sonst veraltete Ergebnisse als gültig gälten. Dazu ein Befund: Bei laufender Blitzlicht-Runde außer TEMPO hängt der Hash von der Uhrzeit ab; geprüft habe ich YESNO, die anderen Typen folgen aus dem Code. Empfohlen, nicht umgesetzt.

_Quelle:_ Nachlauf N3, N5 · Laptop (ThinkPad P50) · def56700; ADR 1C-017 · Laptop und PC · 9f230abc; E7, E8: evidenz/1C/2026-10-24-teil2.md · Laptop · 248029dc (Test-Runtime)

## J13 38 geprüfte Antworten, keine besteht das Gate (75 s, kumuliert 10:50, **Kurzfassung** 6:15)

Und jetzt das Gate. Hier scheitert unser Auftrag. Links steht die echte Antwort des Modells, gekürzt, im Original. Das Gate prüft vor allem die Form: mindestens zwei Aussagen, jede mit einem Stichwort vorn, getrennt durch Doppelpunkt oder Strich, verschiedene Stichwörter, ganze Sätze, keine Metasätze aus einer kurzen Liste. Ausgaben mit Status failed und unsichere ohne Aussagen lässt es durch, aber jede geprüfte Antwort hatte Aussagen. Sprache und Thema prüft es nicht. Diese Antwort scheitert an der Form; inhaltlich passt sie auch nicht, sie ist englisch und fasst Moderationszustände zusammen. Im 1B-Lauf wurden 10 von 10 Antworten verworfen, im 1C-Nachlauf bestand keine von 28. Das gilt für ein Modell und eine Fixture. Vor Version 1.4.0, mit älterer Instruktion und ohne Gate, endeten in 1C 19 von 20 Aufträgen mit Modellzusammenfassung. Zwei Upstream-Commits haben Instruktion und Gate zugleich geändert; erst der zweite prüft auch unsichere Antworten, und die meisten geprüften Antworten waren unsicher. Welcher Teil wie viel bewirkt, ist nicht getrennt gemessen. Rechts die Lehrenden-Sicht aus dem Labor, gerafft: Klick, Warten, Ersatzzusammenfassung mit Hinweis. Hier war es ein Timeout, nicht das Gate; die Lehrperson sieht dasselbe. Meine Empfehlung: Instruktion, Grammatik und Gate gemeinsam abstimmen. Umgesetzt ist das nicht.

_Quelle:_ evidenz/1B/messung/2026-11-15-abgelehnte-antwort.json (Auftrag 2); Lauf 1B · ThinkPad P50 · 8e9d1317; Nachlauf · Laptop · def56700; ADR 1C-018 · 9f230abc; Clip: evidenz/1B/2026-11-15-clip.md, 2026-11-15, power-saver; Hinweis qaSummaryExtractive.ts

## J15 Entscheidung und Fragen (50 s, kumuliert 11:40, **Kurzfassung** 7:05)

Meine Entscheidung. Für 1C bleiben Nachprüfung, strikte Validierung, Entkopplung und die Gleichheit von Vorschau und Nutzlast. Das kostet wenig Zeit, aber unter laufendem Voting verwirft jede Stimme während der Inferenz die Antwort; wie oft, ist offen. Zu ändern empfehle ich Gate, Timeout, Prompt-Cache, Byte-Schätzung, Themen-Snapshot und Blitzlicht-Hash, jeweils mit einem Preis; die Liste steht in der Reserve R12. Umgesetzt ist nichts. Für 1B: Die Topologie kostet keine relevante Zeit, der Hebel liegt am Inferenz-Host; den Aufwand der zweiten Rolle zeigt Niklas. Drei Fragen würde ich gern diskutieren, die erste zum Upgrade. Und damit an Niklas: Was passiert, wenn der zweite Host ausfällt?

_Quelle:_ 1C-ergebnis.md, Abschnitt 5, ADRs 1C-010 bis 1C-024, Abschnitt Folgen (Laptop und PC · 9f230abc; Laptop · def56700); 1B-ergebnis.md, Entscheidung (ThinkPad P50 · 8e9d1317)

## J16 Literaturverzeichnis (5 s, kumuliert 11:45)

Das vollständige Literaturverzeichnis nach dem IU-Zitierleitfaden; dieselben Einträge wie im Handout.

_Quelle:_ literatur.mjs, abgeglichen mit main.bib des Handouts (PaperLab)

## G9 Kurzfazit Thema 1 (30 s, kumuliert 12:15)

Entwurf für das gemeinsame Kurzfazit, mit Niklas abzustimmen: je Auftrag ein Satz, dann ein gemeinsamer Satz zur Leitfrage.

_Quelle:_ 1B-ergebnis.md, 1C-ergebnis.md (Kurzantwort, Verlauf 9f230abc); 1A von Niklas

# Reserve

Nur auf Nachfrage (Taste `r`), keine Zeit im Vortrag.

## R1 Reserve: Kalibrierung des Timeouts

Falls gefragt wird, warum ich nicht mit 90 Sekunden gemessen habe: Am Laptop dauerte die Kalibrierungsanfrage für 1C 196 Sekunden. Deshalb liefen die Laborläufe am Laptop mit 300 Sekunden, der Obergrenze des Produkts, offen als Abweichung markiert. Der PC war mit 98,7 Sekunden schneller, lag aber ebenfalls über 90. In 1B ergab die Kalibrierung 202 Sekunden, also auch dort 300.

_Quelle:_ adr/1C-020-timeout-300-s-und-kalibrierungsregel.md (Laptop; PC · 9f230abc); evidenz/1B/2026-11-13-lauf.md, Kalibrierung (ThinkPad P50 · 3b2aa5e6)

## R2 Reserve: Kontrolle C0, Strecke gegen lokal

Die Kontrolle C0 vergleicht dieselbe kurze Anfrage über die Strecke und lokal. Die Differenz der Mediane ist −2,0 Millisekunden: kein messbarer Unterschied, denn die Streuung je Seite ist größer als 5 Millisekunden. Die eigentliche Zahl ist die Drahtmessung, 0,43 Millisekunden im Median.

_Quelle:_ evidenz/1B/2026-11-13-lauf.md, Nachtrag · ThinkPad P50 · 9e111d35

## R3 Reserve: Ausfall B0

Fehlt die Runtime, fällt die App ohne Wartezeit auf die extraktive Zusammenfassung zurück, im Median nach 88,5 Millisekunden. Den Ausfall untersucht Niklas genauer.

_Quelle:_ evidenz/1B/2026-11-13-lauf.md, Nachtrag · ThinkPad P50 · 9e111d35

## R4 Reserve: Kaltläufe, n = 5

Kalt und warm sind getrennte Gruppen. Mit frischer Runtime dauert ein Auftrag im Median 200,5 Sekunden, warm 148,6 Sekunden. Der Inferenzanteil bleibt in beiden Fällen über der Schwelle.

_Quelle:_ evidenz/1B/2026-11-13-lauf.md, Nachtrag · ThinkPad P50 · 9e111d35; warm und Auftrag 1: evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317

## R5 Reserve: Gültigkeitsgrenzen

Was die Zahlen nicht sagen: Sie gelten für Laborrechner, ein Modell und eine synthetische Fixture, ohne parallele Last. Warm heißt in 1B: derselbe Snapshot, der Prompt kam aus dem Cache; ändert sich der Zustand, gilt eher der Kaltwert von 200,5 Sekunden. Inferenzzeiten sind nicht auf den Produktionshost übertragbar, und ein privates Netz ist noch kein Datenschutz.

_Quelle:_ evidenz/1C/2026-11-09-labor-nachlauf.md (Laptop · def56700); evidenz/1B/2026-11-13-lauf.md (ThinkPad P50 · 8e9d1317); Kaltwert: evidenz/1B/2026-11-13-lauf.md, Nachtrag · ThinkPad P50 · 9e111d35

## R6 Reserve: Anteil der KI

Zur KI-Nutzung: Die KI hat Skripte, Tests, Auswertungen und Texte entworfen. Hypothesen und Schwellen habe ich vor den gewerteten Läufen freigegeben, mit offengelegten Ausnahmen: Zwei 1C-Messungen liefen ohne meine vorherige Freigabe, und die 1B-Leitfrage habe ich nach dem Lauf bestätigt. Die Läufe habe ich gesteuert und die Ergebnisse geprüft. Wer was gemacht hat, steht je Artefakt in den Eigenanteil-Dateien.

_Quelle:_ 1C-eigenanteil.md (Autorenprüfung); adr/1B-011-zeitbegriffe-und-leitfrage.md; 1B-eigenanteil.md (Stand 2026-11-14) · Arbeit an Laptop (ThinkPad P50) und PC (i7-8700) · Baselines 9f230abc, def56700, a19ca70f

## R7 Reserve: ADR-Zählung 1C

Die Zählung der Entscheidungen in 1C nach Status. Keine Empfehlung ist umgesetzt, das verlangt der Auftrag so: Ergebnis ist eine begründete Empfehlung, kein Patch.

_Quelle:_ adr/README.md, Index · Messstände 9f230abc (Laptop und PC) und def56700 (Laptop)

## R8 Reserve: 1C Schritt 1, Autorisierung

Falls nach Schritt 1 gefragt wird: Jeder Bereich aus #456 hat eine Datenquelle, eine Funktion, eine Schemafassung und eine Rechteprüfung. Vorschau und Auftrag prüfen zuerst das Host-Token, danach prüft jeder Kontextaufbau die Rechte erneut. Die Tabelle mit Zeilennummern steht in der Diagrammdoku zu 1C.

_Quelle:_ 1C-diagrams.md, #456-Bereiche · Code-Stand def56700 (Laptop, ThinkPad P50)

## R9 Reserve: 1C Schritte 3–4, Konsistenzfälle

Falls nach den Schritten 3 und 4 gefragt wird: Inkompatible Versionen und fehlende Bereiche enden kontrolliert, mit Zustand und Grund. Stiller Feldverlust kommt an zwei Stellen vor: bei einem Themen-Snapshot fremder Version und bei Bereichen, die aus Budgetgründen leer bleiben. Echte Änderungen nach dem Auftrag erkennt die Nachprüfung, eine Stimme während des Aufbaus endet mit CONFLICT.

_Quelle:_ 1C-ergebnis.md, Abschnitt 3 · Tests und Teil 2/3 auf 248029dc (Laptop, ThinkPad P50); Labor def56700

## R10 Reserve: 1B Schritt 1 und ADR-0035

Falls nach Schritt 1 von 1B gefragt wird: Der Auftrag verlangt, App-Adapter, Encoder und LLM-Server zu unterscheiden. Der Adapter läuft in der App auf dem app-host, der Encoder ist ab Werk aus, der LLM-Server läuft allein auf dem llm-host. Den Aufbau habe ich Punkt für Punkt gegen ADR-0035 und das Runbook abgeglichen. Die auffälligste Lücke: ADR-0035 nennt eine kürzere Ausgabegrenze, als das Release setzt; mit ihr wären die Antworten abgeschnitten.

_Quelle:_ evidenz/1B/2026-11-12-aufbau.md (Komponenten, Abgleich) · ThinkPad P50 · a19ca70f; Lücke: evidenz/1B/2026-11-13-lauf.md, Manifest · 8e9d1317

## R11 Reserve: Was der Betrieb nicht sieht

Falls nach dem Betrieb gefragt wird: Die App schreibt nur die Gesamtzeit eines Auftrags ins Log. Inferenz, Netz und Adapter sieht man nur mit einem Mitschnitt, und warum das Gate verwirft, steht nirgends, nur der grobe Grund invalid_response. Ich empfehle, Zeiten und den Grund eines Fallbacks ohne Prompttext zu loggen, Issues 19 und 20; umgesetzt ist das nicht.

_Quelle:_ evidenz/1B/2026-11-13-lauf.md, Befund C; evidenz/1B/messung/2026-11-13-lauf.json · ThinkPad P50 · 8e9d1317

## R12 Reserve: Entscheidungen im Detail

Falls nach den Entscheidungen im Einzelnen gefragt wird: Für 1C bleiben Nachprüfung, Validierung, Entkopplung und Vorschau; das kostet wenig Zeit, das Risiko liegt beim Voting. Empfohlen, aber nicht umgesetzt sind Änderungen an Gate, Timeout, Cache, Zählung, Snapshot und Blitzlicht, je mit Kosten und Risiko. Für 1B bleibt die Topologie, der Hebel liegt am Inferenz-Host; die Logs empfehle ich zu erweitern.

_Quelle:_ 1C-ergebnis.md, Abschnitt 5, ADRs 1C-010 bis 1C-024, Abschnitt Folgen (Laptop und PC · 9f230abc; Laptop · def56700); 1B-ergebnis.md, Entscheidung (ThinkPad P50 · 8e9d1317)
