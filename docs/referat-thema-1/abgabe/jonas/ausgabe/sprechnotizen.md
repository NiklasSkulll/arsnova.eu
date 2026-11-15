# Sprechnotizen Jonas

Gesamt 13:45 min, Kurzfassung 7:25 min (Folien mit der Marke „Kurzfassung“). Erzeugt aus `folien.mjs` (`notiz`, `zeitS`, `kurzfassung`); nicht von Hand ändern.

## G0 Thema 1: KI-Inferenz im Moderationskompass (30 s, kumuliert 0:30)

Entwurf für Niklas und mich. Unser Thema ist die KI-Inferenz für den Moderationskompass. Die Leitfrage: Wie wirksam trennt die Architektur von Release 1.3 Anwendung, Kontextaufbau und private Inferenz unter realer Last? Reale Last haben wir nicht erzeugt, unsere Läufe sind sequenziell; das ist eine Grenze. Niklas beginnt mit dem App-Host, ich verfolge dann einen echten Auftrag über beide Hosts, und Niklas schließt mit Störungen und dem Aufwand der zweiten Serverrolle.

## J1 Ein Klick. 152 Sekunden. Keine Modellantwort. (40 s, kumuliert 1:10, **Kurzfassung** 0:40)

Ein Klick der Lehrperson, 152 Sekunden Warten, und am Ende steht keine Modellantwort auf dem Bildschirm. Dieser Auftrag ist echt, die Nummer 2 aus meinem gewerteten Lauf. Davon rechnet der Server 151,2 Sekunden am Job, der Rest ist der Host-Aufruf und das Nachfragen. Zum Vergleich: Warme Aufträge brauchen im Median 148,6 Sekunden. Die Architektur folgt Release 1.3, gemessen habe ich aber den aktuellen Stand, Version 1.4.0. Das wird beim Gate wichtig. Zwei Fragen: Für 1C, hält der Kontextpfad seine Zusagen? Für 1B, Schritte 1 und 2, wo steckt die Zeit auf einem zweiten Host? Petrol ist 1C, Bernstein ist 1B.

## J2 Zwei Hosts nach Release 1.3, gemessen auf 1.4.0 (70 s, kumuliert 2:20)

Bevor man misst, muss das System stehen. Schritt 1 von 1B verlangt, das Zwei-Host-Deployment nachzubauen, so wie Release 1.3 es mit ADR-0035 beschreibt. Ich habe zwei virtuelle Maschinen auf meinem Laptop aufgebaut. Auf dem app-host laufen die App mit dem Adapter, Datenbank und Redis; der Encoder für die Wortwolke bleibt aus, wie ab Werk. Auf dem llm-host läuft der LLM-Server mit dem gepinnten Modell. Die Firewall lässt die Runtime nur vom app-host zu, dazu kommt ein Token. Gemessen habe ich den aktuellen Code, Version 1.4.0. Die Abweichungen stehen offen im Kasten: 4 statt 8 CPUs, weil der Laptop nicht mehr hat. Der Timeout liegt bei 300 statt 90 Sekunden, weil schon die Kalibrierung 202 Sekunden dauerte; mit dem Release-Wert wäre jeder Auftrag abgebrochen. Die Images habe ich selbst gebaut, gestartet ohne den Wrapper, weil der nach dem Runbook nicht läuft. Und vor dem gewerteten Lauf habe ich Hintergrunddienste von Hand abgeschaltet.

## J3 Der Weg eines Auftrags (40 s, kumuliert 3:00, **Kurzfassung** 1:20)

Hier ist die Karte für den Rest des Vortrags. Oben der app-host, unten der llm-host. Der Auftrag startet links mit dem Klick, der Kontext wird gebaut, geht über das Netz zur Inferenz, kommt zurück, wird nachgeprüft und landet am Gate. An Klick und Inferenz stehen die Werte unseres Auftrags 2: Der Host-Aufruf kehrt nach 67 Millisekunden zurück, die Inferenz dauert 151 Sekunden. Die Werte an Kontext und Nachprüfung stammen aus 1C, gemessen auf einem Rechner ohne zweiten Host; das steht klein unter jedem Wert. Der Punkt wandert jetzt von Station zu Station mit.

## J4 Erst die Hypothese, dann die Messung (60 s, kumuliert 4:00)

Wie komme ich zu belastbaren Aussagen? Mit einer festen Reihenfolge. Erstens standen Hypothesen und Schwellen fest, bevor gemessen wurde. Für 1B: Das Netz darf im Median höchstens 50 Millisekunden kosten, der Adapter höchstens 2 Sekunden, und die Inferenz muss mindestens 95 Prozent ausmachen. Ausnahmen davon nenne ich offen, etwa den Blitzlicht-Befund, den ich explorativ gefunden habe. Zweitens habe ich in 1C zuerst ohne Modell getestet, mit Negativproben: Ein absichtlicher Fehler muss den Test rot machen. Drittens das Labor. Für 1C heißt das: ein Rechner, die Runtime über Loopback, kleinere Limits als im Release und ein Timeout von 300 Sekunden. Einen zweiten Host hatte 1C nicht; den liefert erst 1B.

## J5 Der Host wartet nicht auf das Modell (45 s, kumuliert 4:45, **Kurzfassung** 2:05)

Erste Station, der Klick. Die Frage aus 1C lautet: Blockiert ein langsames Modell die Lehrperson? Der Mechanismus ist eine Queue. Der Host-Aufruf baut den Kontext, legt den Auftrag ab und kehrt sofort mit dem Status pending zurück. Gerechnet wird danach im Hintergrund, mit einem Slot. Gemessen am Laptop dauert der Host-Aufruf im Median 29,4 Millisekunden, die Inferenz dagegen 223,7 Sekunden. Der Host ist also vom Modell entkoppelt. Eine Grenze bleibt: Auf den Kontextaufbau wartet er doch, denn der passiert im Aufruf selbst. Belegt ist das mit dem Test E5 und dem Laborfall N3.

## J6 Was die Vorschau zeigt, kommt an (65 s, kumuliert 5:50, **Kurzfassung** 3:10)

Zweite Station, der Kontext. Die Frage: Bekommt die Runtime genau das, was die Lehrperson in der Vorschau sieht? Der Kontext entsteht aus dem App-Zustand, wird gegen versionierte Schemas geprüft und dann gepackt. Vorschau und Auftrag gibt es nur mit gültigem Host-Token, und jeder Kontextaufbau prüft die Rechte erneut, acht Prüfungen je Aufbau. Unten steht ein echter Ausschnitt der Nutzlast aus dem Nachlauf, mit synthetischen Daten: die Vertragsversion, ein abgeschalteter Bereich mit seinem Grund und eine Frage aus der Fixture. Vorschau und Nutzlast tragen denselben Hash, die Nachricht an die Runtime ist byte-gleich mit der Vorschau. Was kostet die strikte Validierung? 1,2 Millisekunden, 1,6 Prozent eines warmen Kontextaufbaus, gemessen mit der Test-Runtime auf einem älteren Stand. Deshalb bleibt sie. Welcher Bereich woher kommt, zeigt die Reserve.

## J7 Sicher geschätzt, aber Platz verschenkt (45 s, kumuliert 6:35)

Zur Frage nach den Kosten der Kontextbereitstellung. Das Budget schätzt Tokens über Bytes: Jedes Byte zählt als ein Token. Das ist sicher, denn ein Token umfasst mindestens ein Byte, und so läuft das Fenster nie über. Aber es ist teuer. Die echten Tokens sind im Median nur das 0,318-fache der Schätzung. Rund zwei Drittel des geschätzten Budgets bleiben also ungenutzt. Und derselbe Kontext meldet gleichzeitig, dass eine Frage aus Budgetgründen weggelassen wurde. Ich empfehle, eine genauere Zählung zu prüfen. Umgesetzt ist das nicht.

## J8 Gemessen am Draht, auf beiden Hosts (50 s, kumuliert 7:25)

Jetzt geht der Auftrag über die Grenze zum zweiten Host. Die Frage aus 1B: Wie trenne ich Netz und Inferenz, ohne den Produktionscode anzufassen? Ich schneide auf beiden Hosts den Verkehr mit. Am app-host sehe ich t null, die Anfrage geht raus, und t drei, die Antwort ist zurück. Am llm-host sehe ich t eins und t zwei. Jede Differenz stammt von einer einzigen Uhr, deshalb muss ich die Uhren nicht abgleichen. Netz ist die Zeit am app-host minus die Zeit am llm-host. Für unseren Auftrag Nummer 2, geklickt um 08:20:35,594 Weltzeit, sind das 0,45 Millisekunden, also unter der Messauflösung von etwa einer Millisekunde. Über alle 10 Aufträge liegt der Median bei 0,43 Millisekunden. Die Lehrperson wartet 151,8 Sekunden, der Server rechnet 151,2: Dazwischen liegen der Host-Aufruf und das Nachfragen im Sekundentakt.

## J9 Die Zeit steckt in der Inferenz (50 s, kumuliert 8:15, **Kurzfassung** 4:00)

So sieht die ganze Zerlegung aus. Die Achse ist logarithmisch, jeder Strich ist zehnmal mehr. Das Netz kostet im Median 0,43 Millisekunden, die Schwelle lag bei 50. Der Transport mit dem Serveranteil kostet 17,8 Millisekunden, der Adapter in der App 101 Millisekunden, bei einer Schwelle von 2 Sekunden. Und dann die Inferenz: 148,3 Sekunden im warmen Median über 9 Aufträge, ein Anteil von 99,92 Prozent. Der Transport ist damit rund 0,01 Prozent der Auftragszeit. Warm heißt hier: ein identischer Snapshot, der Prompt kam fast ganz aus dem Cache. Ändert sich der Zustand, gilt eher der Kaltwert, im Median 200,5 Sekunden. Alle drei Hypothesen sind erfüllt, auch kalt. Die zweite Serverrolle kostet keine relevante Zeit.

## J10 Wäre der Auftrag ein Fußballfeld … (25 s, kumuliert 8:40, **Kurzfassung** 4:25)

Damit man sich das vorstellen kann: Wäre der Median eines warmen Auftrags so lang wie ein Fußballfeld, dann nähme die Inferenz praktisch das ganze Feld ein. Der Transport wäre gut ein Zentimeter, und darin steckt das Netz mit einem Drittel Millimeter, dünner als die Kreidelinie am Tor. Der Adapter in der App käme mit gut sieben Zentimetern dazu. Am Netz zu optimieren lohnt sich also nicht.

## J11 Betrieb: Timeout zu kurz, Speicher läuft voll (55 s, kumuliert 9:35, **Kurzfassung** 5:20)

Zurück zu 1C, zum Betrieb. Zwei Befunde, mit denen das Release so nicht rechnet. Erstens der Timeout: Ab Werk bricht die App nach 90 Sekunden ab. Am PC dauerte schon die Kalibrierungsanfrage 98,7 Sekunden, am Laptop braucht die Inferenz im Median 223,7 Sekunden, mit Nebenlast und auf einem anderen Stand. Mit dem Release-Timeout wäre der Modellpfad auf beiden nicht nutzbar. Zweitens der Speicher: Bei wechselnden Prompts wächst der Prompt-Cache je Auftrag um 0,419 Gigabyte im Median. Am Laborlimit endet die Runtime im 19. Auftrag, mit Produktionslimits am PC im 21. Im 1B-Lauf blieb der Speicher dagegen bei 4,04 Gigabyte, weil der Prompt jedes Mal gleich war. Ich empfehle, den Timeout am Inferenz-Host zu kalibrieren und den Cache zu begrenzen. Umgesetzt ist beides nicht.

## J12 Die Nachprüfung kostet fast nichts (55 s, kumuliert 10:30)

Nächste Station, nach der Inferenz. Die Frage: Was passiert, wenn sich die Daten ändern, während das Modell rechnet? Der Kontext wird nach der Inferenz noch einmal gebaut und sein Hash mit dem vom Anfang verglichen. Ändert sich eine Stimme oder wird eine Quelle gelöscht, wird die Antwort als source_changed verworfen; das zeigen die Tests E7 und E8. Das kostet am Laptop 0,03 Prozent eines Auftrags. Entscheidend ist aber das Risiko ohne Nachprüfung: Dann gälten veraltete Ergebnisse als gültig. Deshalb bleibt sie. Dazu ein Befund: Läuft gerade eine Blitzlicht-Runde eines anderen Typs als TEMPO, hängt der Hash von der Uhrzeit ab, und jede Modellantwort dieser Runde wird verworfen. Im Labor endete YESNO 5 von 5 als source_changed, ohne Datenänderung; bei TEMPO nicht. Ich empfehle, das zu beheben. Umgesetzt ist es nicht.

## J13 Auf 1.4.0 verwirft das Gate jede Modellantwort (75 s, kumuliert 11:45, **Kurzfassung** 6:35)

Und jetzt das Gate. Hier scheitert unser Auftrag. Links steht die echte Antwort des Modells, gekürzt, im Original. Das Gate prüft vor allem die Form: mindestens zwei Aussagen, jede mit einem Stichwort und Doppelpunkt vorn, verschiedene Stichwörter, vollständige Sätze, keine Metasätze aus einer kurzen Liste. Sprache und Thema prüft es nicht. Diese Antwort scheitert an der Form, keine Aussage hat ein Stichwort. Inhaltlich passt sie aber auch nicht: Sie ist englisch und fasst Moderationszustände zusammen. Im 1B-Lauf wurden 10 von 10 Antworten verworfen, im 1C-Nachlauf bestand keine, 0 von 28. Wichtig: Das Gate kam erst mit Version 1.4.0. Auf dem Stand vor dem Gate, mit älterer Instruktion, endeten in 1C 19 von 20 Aufträgen mit Modellzusammenfassung. Ein Upgrade hat das Ergebnis gekippt. Falls der Clip läuft: Rechts sehen Sie Klick, Warten und die Ersatzzusammenfassung mit dem Hinweiskasten. Sonst: Die Lehrperson sieht nur den allgemeinen Hinweis, eine ausführliche Zusammenfassung sei nicht möglich gewesen, den Grund nicht. Meine Empfehlung: Instruktion, Grammatik und Gate gemeinsam abstimmen. Umgesetzt ist das nicht.

## J14 Was der Betrieb nicht sieht (40 s, kumuliert 12:25)

Was hätte der Betrieb davon bemerkt? Fast nichts. Die App schreibt nur die Gesamtzeit eines Auftrags ins Log. Inferenz, Netz und Adapter sieht man nur mit einem Mitschnitt. Und warum das Gate eine Antwort verwirft, steht nirgends, nur der grobe Grund invalid_response. Damit gehen 99,92 Prozent der Zeit in ein Ergebnis, das nicht ankommt, und niemand sieht es. Ich empfehle, Zeiten und den Grund eines Fallbacks ohne Prompttext zu loggen. Das steht in #19 und #20, umgesetzt ist es nicht.

## J15 Entscheidung und Fragen (50 s, kumuliert 13:15, **Kurzfassung** 7:25)

Meine Entscheidung. Für 1C bleiben Nachprüfung, strikte Validierung, Entkopplung und die Gleichheit von Vorschau und Nutzlast; die Kosten bleiben, ein neues Risiko entsteht nicht. Zu ändern empfehle ich Gate, Timeout, Prompt-Cache, Byte-Schätzung, Themen-Snapshot und Blitzlicht-Hash. Jede Empfehlung hat ihren Preis: Das Gate braucht eine Abnahmemessung, ein längerer Timeout belegt den Slot länger. Umgesetzt ist nichts. Für 1B: Die Topologie kostet keine relevante Zeit, der Hebel liegt am Inferenz-Host. Vorher muss aber das Gate zum Modell passen. Drei Fragen würde ich gern diskutieren, die erste zum Upgrade auf 1.4.0. Und damit an Niklas: Was passiert, wenn der zweite Host ausfällt?

## G9 Kurzfazit Thema 1 (30 s, kumuliert 13:45)

Entwurf für das gemeinsame Kurzfazit, mit Niklas abzustimmen: je Auftrag ein Satz, dann ein gemeinsamer Satz zur Leitfrage.

# Reserve

Nur auf Nachfrage (Taste `r`), keine Zeit im Vortrag.

## R1 Reserve: Kalibrierung des Timeouts

Falls gefragt wird, warum ich nicht mit 90 Sekunden gemessen habe: Am Laptop dauerte die Kalibrierungsanfrage für 1C 196 Sekunden. Deshalb liefen die Laborläufe am Laptop mit 300 Sekunden, der Obergrenze des Produkts, offen als Abweichung markiert. Der PC war mit 98,7 Sekunden schneller, lag aber ebenfalls über 90. In 1B ergab die Kalibrierung 202 Sekunden, also auch dort 300.

## R2 Reserve: Kontrolle C0, Strecke gegen lokal

Die Kontrolle C0 vergleicht dieselbe kurze Anfrage über die Strecke und lokal. Die Differenz der Mediane ist −2,0 Millisekunden, also im Rauschen. Die Strecke zwischen den Hosts kostet praktisch nichts.

## R3 Reserve: Ausfall B0

Fehlt die Runtime, fällt die App ohne Wartezeit auf die extraktive Zusammenfassung zurück, im Median nach 88,5 Millisekunden. Den Ausfall untersucht Niklas genauer.

## R4 Reserve: Kaltläufe, n = 5

Kalt und warm sind getrennte Gruppen. Mit frischer Runtime dauert ein Auftrag im Median 200,5 Sekunden, warm 148,6 Sekunden. Der Inferenzanteil bleibt in beiden Fällen über der Schwelle.

## R5 Reserve: Gültigkeitsgrenzen

Was die Zahlen nicht sagen: Sie gelten für Laborrechner, ein Modell und eine synthetische Fixture, ohne parallele Last. Warm heißt in 1B: derselbe Snapshot, der Prompt kam aus dem Cache; ändert sich der Zustand, gilt eher der Kaltwert von 200,5 Sekunden. Inferenzzeiten sind nicht auf den Produktionshost übertragbar, und ein privates Netz ist noch kein Datenschutz.

## R6 Reserve: Anteil der KI

Zur KI-Nutzung: Die KI hat Skripte, Tests, Auswertungen und Texte entworfen. Fragen, Hypothesen und Schwellen habe ich vor jeder Messung freigegeben, die Läufe gesteuert und die Ergebnisse geprüft. Wer was gemacht hat, steht je Artefakt in den Eigenanteil-Dateien.

## R7 Reserve: ADR-Zählung 1C

Die Zählung der Entscheidungen in 1C nach Status. Keine Empfehlung ist umgesetzt, das verlangt der Auftrag so: Ergebnis ist eine begründete Empfehlung, kein Patch.

## R8 Reserve: 1C Schritt 1, Autorisierung

Falls nach Schritt 1 gefragt wird: Jeder Bereich aus #456 hat eine Datenquelle, eine Funktion, eine Schemafassung und eine Rechteprüfung. Vorschau und Auftrag prüfen zuerst das Host-Token, danach prüft jeder Kontextaufbau die Rechte erneut. Die Tabelle mit Zeilennummern steht in der Diagrammdoku zu 1C.

## R9 Reserve: 1C Schritte 3–4, Konsistenzfälle

Falls nach den Schritten 3 und 4 gefragt wird: Inkompatible Versionen und fehlende Bereiche enden kontrolliert, mit Zustand und Grund. Stiller Feldverlust kommt an zwei Stellen vor: bei einem Themen-Snapshot fremder Version und bei Bereichen, die aus Budgetgründen leer bleiben. Echte Änderungen nach dem Auftrag erkennt die Nachprüfung, eine Stimme während des Aufbaus endet mit CONFLICT.

## R10 Reserve: 1B Schritt 1 und ADR-0035

Falls nach Schritt 1 von 1B gefragt wird: Der Auftrag verlangt, App-Adapter, Encoder und LLM-Server zu unterscheiden. Der Adapter läuft in der App auf dem app-host, der Encoder ist ab Werk aus, der LLM-Server läuft allein auf dem llm-host. Den Aufbau habe ich Punkt für Punkt gegen ADR-0035 und das Runbook abgeglichen. Die auffälligste Lücke: ADR-0035 nennt eine kürzere Ausgabegrenze, als das Release setzt; mit ihr wären die Antworten abgeschnitten.
