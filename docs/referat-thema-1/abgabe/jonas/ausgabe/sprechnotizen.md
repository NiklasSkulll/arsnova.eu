# Sprechnotizen Jonas

Gesamt 12:10 min, Kurzfassung 7:05 min (Folien mit der Marke „Kurzfassung“). Erzeugt aus `folien.mjs` (`notiz`, `zeitS`, `kurzfassung`); nicht von Hand ändern.

## Sprungplan

Ab J1 gezählt beginnt J13 in der Langfassung bei 9:05 min. J13 und J15 brauchen zusammen 2:05 min. Damit beide bis 9:00 min gesprochen sind: Wer bei 6:55 min noch vor J13 steht, blättert mit Pfeil rechts ohne Kommentar bis J13, spricht J13 und danach J15. Bei Zeitdruck von Anfang an nur die Folien mit der Marke „Kurzfassung“; sie enthält J13 und J15.

## G0 Thema 1: KI-Inferenz im Moderationskompass (30 s, kumuliert 0:30)

Entwurf für Niklas und mich. Unser Thema ist die KI-Inferenz für den Moderationskompass. Die Leitfrage: Wie wirksam trennt die Architektur von Release 1.3 Anwendung, Kontextaufbau und private Inferenz unter realer Last? Reale Last haben wir nicht erzeugt, unsere Läufe sind sequenziell; das ist eine Grenze. Niklas beginnt mit dem App-Host, ich verfolge dann einen echten Auftrag über beide Hosts, und Niklas schließt mit Störungen und dem Aufwand der zweiten Serverrolle.

## J1 Ein Klick. 152 Sekunden. Keine Modellantwort. (40 s, kumuliert 1:10, **Kurzfassung** 0:40)

Ein Klick der Lehrperson, 152 Sekunden Warten, und am Ende steht keine Modellantwort auf dem Bildschirm. Dieser Auftrag ist echt, die Nummer 2 aus meinem gewerteten Lauf. Davon rechnet der Server 151,2 Sekunden am Job, der Rest ist der Host-Aufruf und das Nachfragen. Zum Vergleich: Warme Aufträge brauchen im Median 148,6 Sekunden. Die Architektur folgt Release 1.3, gemessen habe ich aber Code nach Version 1.4.0. Das wird beim Gate wichtig. Zwei Fragen: Für 1C, hält der Kontextpfad seine Zusagen? Für 1B, Schritte 1 und 2, wo steckt die Zeit auf einem zweiten Host? Petrol ist 1C, Bernstein ist 1B.

## J2 Zwei Hosts nach Release 1.3, Code nach v1.4.0 (60 s, kumuliert 2:10)

Bevor man misst, muss das System stehen. Schritt 1 von 1B verlangt, das Zwei-Host-Deployment nachzubauen, so wie Release 1.3 es mit ADR-0035 beschreibt. Gemessen habe ich auf Wunsch des Prüfers den aktuellen Stand, nicht den Tag 1.3; der hatte noch 4 CPUs und 5 GiB. Ich habe zwei virtuelle Maschinen auf meinem Laptop aufgebaut. Auf dem app-host laufen die App mit dem Adapter, Datenbank und Redis; der Encoder bleibt aus, wie ab Werk. Auf dem llm-host läuft der LLM-Server mit dem gepinnten Modell, erreichbar nur vom app-host und mit Token. Die Abweichungen zum gemessenen Stand stehen im Kasten: 4 statt 8 CPUs, weil sich zwei VMs den Laptop teilen. Der Timeout liegt bei 300 statt 90 Sekunden, weil schon die Kalibrierung 202 Sekunden dauerte. Die Runtime startet direkt mit dem CPU-Override, weil der Wrapper es nicht durchreicht; seine Prüfungen liefen vorher. Und vor dem gewerteten Lauf habe ich Hintergrunddienste von Hand abgeschaltet.

## J3 Der Weg eines Auftrags (40 s, kumuliert 2:50, **Kurzfassung** 1:20)

Hier ist die Karte für den Rest des Vortrags. Oben der app-host, unten der llm-host. Der Auftrag startet links mit dem Klick, der Kontext wird gebaut, geht über das Netz zur Inferenz, kommt zurück, wird nachgeprüft und landet am Gate. An Klick und Inferenz stehen die Werte unseres Auftrags 2: Der Host-Aufruf kehrt nach 67 Millisekunden zurück, die Inferenz dauert 151 Sekunden. Die Werte an Kontext und Nachprüfung stammen aus 1C, gemessen auf einem Rechner ohne zweiten Host; das steht klein unter jedem Wert. Der Punkt wandert jetzt von Station zu Station mit.

## J4 Erst die Hypothese, dann die Messung (50 s, kumuliert 3:40)

Wie komme ich zu belastbaren Aussagen? Mit einer festen Reihenfolge. Erstens standen Hypothesen und Schwellen vor den gewerteten Läufen fest. Für 1B: Das Netz darf im Median höchstens 50 Millisekunden kosten, der Adapter höchstens 2 Sekunden, und die Inferenz muss mindestens 95 Prozent ausmachen. Die Ausnahmen nenne ich offen: Den Blitzlicht-Befund habe ich explorativ gefunden, zwei Messungen liefen ohne meine vorherige Freigabe, und die Leitfrage zu 1B habe ich erst nach dem Lauf bestätigt. Zweitens habe ich in 1C zuerst ohne Modell getestet, mit Negativproben: Ein absichtlicher Fehler muss den Test rot machen. Drittens das Labor. Für 1C heißt das: ein Rechner, die Runtime über Loopback, kleinere Limits als ab Werk in Version 1.4.0 und ein Timeout von 300 Sekunden. Einen zweiten Host hatte 1C nicht; den liefert erst 1B.

## J5 Der Host wartet nicht auf das Modell (40 s, kumuliert 4:20, **Kurzfassung** 2:00)

Erste Station, der Klick. Die Frage aus 1C lautet: Blockiert ein langsames Modell die Lehrperson? Der Mechanismus ist eine Queue. Der Host-Aufruf baut den Kontext, legt den Auftrag ab und kehrt sofort mit dem Status pending zurück. Gerechnet wird danach im Hintergrund, mit einem Slot. Gemessen am Laptop dauert der Host-Aufruf im Median 29,4 Millisekunden, die Inferenz dagegen 223,7 Sekunden. Der Host ist also vom Modell entkoppelt. Eine Grenze bleibt: Auf den Kontextaufbau wartet er doch, denn der passiert im Aufruf selbst. Belegt ist das mit dem Test E5 und dem Laborfall N3.

## J6 Was die Vorschau zeigt, kommt an (60 s, kumuliert 5:20, **Kurzfassung** 3:00)

Zweite Station, der Kontext. Die Frage: Bekommt die Runtime genau das, was die Lehrperson in der Vorschau sieht? Der Kontext entsteht aus dem App-Zustand, wird gegen versionierte Schemas geprüft und dann gepackt. Vorschau und Auftrag gibt es nur mit gültigem Host-Token, und jeder Kontextaufbau prüft die Rechte erneut, acht Prüfungen je Aufbau. Unten steht ein echter Ausschnitt der Nutzlast aus dem Nachlauf, mit synthetischen Daten: die Vertragsversion, ein abgeschalteter Bereich mit seinem Grund und eine Frage aus der Fixture. Vorschau und Nutzlast tragen denselben Hash, die Nachricht an die Runtime ist byte-gleich mit der Vorschau. Was kostet die strikte Validierung? 1,2 Millisekunden, 1,6 Prozent eines warmen Kontextaufbaus, gemessen mit der Test-Runtime auf einem älteren Stand. Deshalb bleibt sie. Welcher Bereich woher kommt, zeigt die Reserve.

## J7 Sicher geschätzt, aber Platz verschenkt (40 s, kumuliert 6:00)

Zur Frage nach den Kosten der Kontextbereitstellung. Das Budget schätzt Tokens über Bytes: Jedes Byte zählt als ein Token. Das ist eine Obergrenze, denn ein Token umfasst mindestens ein Byte; in keinem Lauf lief das Fenster über. Aber es ist teuer. Die echten Tokens sind im Median nur das 0,318-fache der Schätzung. Rund zwei Drittel des geschätzten Budgets bleiben also ungenutzt. Und derselbe Kontext meldet gleichzeitig, dass eine Frage aus Budgetgründen weggelassen wurde. Ich empfehle, eine genauere Zählung zu prüfen. Umgesetzt ist das nicht.

## J8 Gemessen am Draht, auf beiden Hosts (45 s, kumuliert 6:45)

Jetzt geht der Auftrag über die Grenze zum zweiten Host. Wie trenne ich Netz und Inferenz, ohne den Produktionscode anzufassen? Ich schneide auf beiden Hosts den Verkehr mit: am app-host t null und t drei, am llm-host t eins und t zwei. Jede Dauer misst eine einzige Uhr; zwei VM-Uhren lassen etwa eine Millisekunde Unschärfe. Netz ist die Zeit am app-host minus die Zeit am llm-host. Für unseren Auftrag liegt das unter einer Millisekunde, über alle 10 Aufträge im Median bei 0,43. Auffällig ist der Server ohne Inferenz: 368 Millisekunden, wie bei Auftrag 3, die Ursache ist offen. Die Lehrperson wartet 151,8 Sekunden, der Server rechnet 151,2.

## J9 Die Zeit steckt in der Inferenz (45 s, kumuliert 7:30, **Kurzfassung** 3:45)

So sieht die ganze Zerlegung aus, auf logarithmischer Achse. Der Hauptwert steht in Millisekunden: Das Netz kostet im Median 0,43, die Schwelle lag bei 50. Der Transport mit Serveranteil kostet 17,8 Millisekunden, der Adapter 101, bei einer Schwelle von 2 Sekunden. Die Inferenz dauert warm im Median 148,3 Sekunden. Ihr Anteil von 99,92 Prozent gilt nur für diese langsame CPU; auf schnellerer Hardware wäre er kleiner. Warm heißt: ein identischer Snapshot, der Prompt kam aus dem Cache. Ändert sich der Zustand, gilt eher der Kaltwert, im Median 200,5 Sekunden. Die drei Hypothesen sind erfüllt, kalt gilt der Inferenzanteil in allen fünf Läufen. Die zweite Serverrolle kostet keine relevante Zeit.

## J10 Wäre der Auftrag ein Fußballfeld … (25 s, kumuliert 7:55, **Kurzfassung** 4:10)

Wäre der Median eines warmen Auftrags so lang wie ein Fußballfeld, dann nähme die Inferenz praktisch das ganze Feld ein. Der Transport wäre gut ein Zentimeter, und darin steckt das Netz mit einem Drittel Millimeter, dünner als die Kreidelinie am Tor. Der Adapter in der App käme mit gut sieben Zentimetern dazu. Am Netz zu optimieren lohnt sich nicht, jedenfalls auf dieser langsamen CPU.

## J11 Betrieb: Timeout zu kurz, Speicher läuft voll (50 s, kumuliert 8:45, **Kurzfassung** 5:00)

Zurück zu 1C, zum Betrieb. Erstens der Timeout: Ab Werk bricht die App in Version 1.4.0 nach 90 Sekunden ab. Am PC ergab die Kalibrierung eine Inferenzzeit von 98,7 Sekunden, am Laptop dauert die Inferenz im Median 223,7, auf einem anderen Stand. Mit dem Timeout ab Werk von Version 1.4.0 wäre der Modellpfad auf beiden nicht nutzbar. Zweitens der Speicher: Bei wechselnden Prompts wächst die Runtime je Auftrag um 0,419 Gigabyte; die Ursache ist der Prompt-Cache, gezeigt am PC. Beide Laborgrenzen liegen bei 10 Gibibyte. Auf dem älteren Stand starb die Runtime im 21. Auftrag, auf dem neuen schon im 19.; die Ursache habe ich nicht getrennt gemessen. Im 1B-Lauf mit gleichem Prompt blieb er bei 4,04 Gigabyte, Ursache nicht getrennt gemessen. Ich empfehle, Timeout und Cache anzupassen; umgesetzt ist das nicht.

## J12 Die Nachprüfung: wenig Zeit, unter Voting ein Risiko (50 s, kumuliert 9:35)

Nächste Station, nach der Inferenz. Was passiert, wenn sich die Daten ändern, während das Modell rechnet? Der Kontext wird danach noch einmal gebaut und sein Hash verglichen. Ändert sich eine Stimme oder wird eine Quelle gelöscht, wird die Antwort verworfen; das zeigen E7 und E8. Zeitlich kostet das 0,03 Prozent eines Auftrags. Der eigentliche Preis liegt woanders: Unter laufendem Voting verwirft jede Stimme während der Inferenz die Antwort. Wie oft das in einer Vorlesung passiert, weiß ich nicht belastbar; mein Modell dafür hat sein Kriterium verfehlt, deshalb halte ich die Empfehlung zurück. Die Nachprüfung bleibt trotzdem, weil sonst veraltete Ergebnisse als gültig gälten. Dazu ein Befund: Bei laufender Blitzlicht-Runde außer TEMPO hängt der Hash von der Uhrzeit ab; geprüft habe ich YESNO. Empfohlen, nicht umgesetzt.

## J13 38 geprüfte Antworten, keine besteht das Gate (75 s, kumuliert 10:50, **Kurzfassung** 6:15)

Und jetzt das Gate. Hier scheitert unser Auftrag. Links steht die echte Antwort des Modells, gekürzt, im Original. Das Gate prüft vor allem die Form: mindestens zwei Aussagen, jede mit einem Stichwort vorn, getrennt durch Doppelpunkt oder Strich, verschiedene Stichwörter, ganze Sätze, keine Metasätze aus einer kurzen Liste. Ausgaben mit Status failed und unsichere ohne Aussagen lässt es durch, aber jede geprüfte Antwort hatte Aussagen. Sprache und Thema prüft es nicht. Diese Antwort scheitert an der Form; inhaltlich passt sie auch nicht, sie ist englisch und fasst Moderationszustände zusammen. Im 1B-Lauf wurden 10 von 10 Antworten verworfen, im 1C-Nachlauf bestand keine von 28. Das gilt für ein Modell und eine Fixture. Vor Version 1.4.0, mit älterer Instruktion und ohne Gate, endeten in 1C 19 von 20 Aufträgen mit Modellzusammenfassung. Derselbe Upstream-Commit hat beides zugleich geändert, Instruktion und Gate; welcher Teil wie viel bewirkt, ist nicht getrennt gemessen. Rechts ein Nachbau der Lehrenden-Sicht: die Fragen im Wortlaut und der allgemeine Hinweis aus dem App-Code, den Grund erfährt die Lehrperson nicht. Meine Empfehlung: Instruktion, Grammatik und Gate gemeinsam abstimmen. Umgesetzt ist das nicht.

## J15 Entscheidung und Fragen (50 s, kumuliert 11:40, **Kurzfassung** 7:05)

Meine Entscheidung. Für 1C bleiben Nachprüfung, strikte Validierung, Entkopplung und die Gleichheit von Vorschau und Nutzlast. Das kostet wenig Zeit, aber unter laufendem Voting verwirft jede Stimme während der Inferenz die Antwort; wie oft, ist offen. Zu ändern empfehle ich Gate, Timeout, Prompt-Cache, Byte-Schätzung, Themen-Snapshot und Blitzlicht-Hash, jeweils mit dem Preis, der auf der Folie steht. Umgesetzt ist nichts. Für 1B: Die Topologie kostet keine relevante Zeit, der Hebel liegt am Inferenz-Host; den Aufwand der zweiten Rolle zeigt Niklas. Drei Fragen würde ich gern diskutieren, die erste zum Upgrade. Und damit an Niklas: Was passiert, wenn der zweite Host ausfällt?

## G9 Kurzfazit Thema 1 (30 s, kumuliert 12:10)

Entwurf für das gemeinsame Kurzfazit, mit Niklas abzustimmen: je Auftrag ein Satz, dann ein gemeinsamer Satz zur Leitfrage.

# Reserve

Nur auf Nachfrage (Taste `r`), keine Zeit im Vortrag.

## R1 Reserve: Kalibrierung des Timeouts

Falls gefragt wird, warum ich nicht mit 90 Sekunden gemessen habe: Am Laptop dauerte die Kalibrierungsanfrage für 1C 196 Sekunden. Deshalb liefen die Laborläufe am Laptop mit 300 Sekunden, der Obergrenze des Produkts, offen als Abweichung markiert. Der PC war mit 98,7 Sekunden schneller, lag aber ebenfalls über 90. In 1B ergab die Kalibrierung 202 Sekunden, also auch dort 300.

## R2 Reserve: Kontrolle C0, Strecke gegen lokal

Die Kontrolle C0 vergleicht dieselbe kurze Anfrage über die Strecke und lokal. Die Differenz der Mediane ist −2,0 Millisekunden: kein messbarer Unterschied, denn die Streuung je Seite ist größer als 5 Millisekunden. Die eigentliche Zahl ist die Drahtmessung, 0,43 Millisekunden im Median.

## R3 Reserve: Ausfall B0

Fehlt die Runtime, fällt die App ohne Wartezeit auf die extraktive Zusammenfassung zurück, im Median nach 88,5 Millisekunden. Den Ausfall untersucht Niklas genauer.

## R4 Reserve: Kaltläufe, n = 5

Kalt und warm sind getrennte Gruppen. Mit frischer Runtime dauert ein Auftrag im Median 200,5 Sekunden, warm 148,6 Sekunden. Der Inferenzanteil bleibt in beiden Fällen über der Schwelle.

## R5 Reserve: Gültigkeitsgrenzen

Was die Zahlen nicht sagen: Sie gelten für Laborrechner, ein Modell und eine synthetische Fixture, ohne parallele Last. Warm heißt in 1B: derselbe Snapshot, der Prompt kam aus dem Cache; ändert sich der Zustand, gilt eher der Kaltwert von 200,5 Sekunden. Inferenzzeiten sind nicht auf den Produktionshost übertragbar, und ein privates Netz ist noch kein Datenschutz.

## R6 Reserve: Anteil der KI

Zur KI-Nutzung: Die KI hat Skripte, Tests, Auswertungen und Texte entworfen. Hypothesen und Schwellen habe ich vor den gewerteten Läufen freigegeben, mit offengelegten Ausnahmen: Zwei 1C-Messungen liefen ohne meine vorherige Freigabe, und die 1B-Leitfrage habe ich nach dem Lauf bestätigt. Die Läufe habe ich gesteuert und die Ergebnisse geprüft. Wer was gemacht hat, steht je Artefakt in den Eigenanteil-Dateien.

## R7 Reserve: ADR-Zählung 1C

Die Zählung der Entscheidungen in 1C nach Status. Keine Empfehlung ist umgesetzt, das verlangt der Auftrag so: Ergebnis ist eine begründete Empfehlung, kein Patch.

## R8 Reserve: 1C Schritt 1, Autorisierung

Falls nach Schritt 1 gefragt wird: Jeder Bereich aus #456 hat eine Datenquelle, eine Funktion, eine Schemafassung und eine Rechteprüfung. Vorschau und Auftrag prüfen zuerst das Host-Token, danach prüft jeder Kontextaufbau die Rechte erneut. Die Tabelle mit Zeilennummern steht in der Diagrammdoku zu 1C.

## R9 Reserve: 1C Schritte 3–4, Konsistenzfälle

Falls nach den Schritten 3 und 4 gefragt wird: Inkompatible Versionen und fehlende Bereiche enden kontrolliert, mit Zustand und Grund. Stiller Feldverlust kommt an zwei Stellen vor: bei einem Themen-Snapshot fremder Version und bei Bereichen, die aus Budgetgründen leer bleiben. Echte Änderungen nach dem Auftrag erkennt die Nachprüfung, eine Stimme während des Aufbaus endet mit CONFLICT.

## R10 Reserve: 1B Schritt 1 und ADR-0035

Falls nach Schritt 1 von 1B gefragt wird: Der Auftrag verlangt, App-Adapter, Encoder und LLM-Server zu unterscheiden. Der Adapter läuft in der App auf dem app-host, der Encoder ist ab Werk aus, der LLM-Server läuft allein auf dem llm-host. Den Aufbau habe ich Punkt für Punkt gegen ADR-0035 und das Runbook abgeglichen. Die auffälligste Lücke: ADR-0035 nennt eine kürzere Ausgabegrenze, als das Release setzt; mit ihr wären die Antworten abgeschnitten.

## R11 Reserve: Was der Betrieb nicht sieht

Falls nach dem Betrieb gefragt wird: Die App schreibt nur die Gesamtzeit eines Auftrags ins Log. Inferenz, Netz und Adapter sieht man nur mit einem Mitschnitt, und warum das Gate verwirft, steht nirgends, nur der grobe Grund invalid_response. Ich empfehle, Zeiten und den Grund eines Fallbacks ohne Prompttext zu loggen, Issues 19 und 20; umgesetzt ist das nicht.
