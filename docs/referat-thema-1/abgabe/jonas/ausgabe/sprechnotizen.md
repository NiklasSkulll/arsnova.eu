# Sprechnotizen Jonas

Gesamt 13:05 min, Kurzfassung 7:10 min (Folien mit der Marke „Kurzfassung“). Erzeugt aus `folien.mjs` (`notiz`, `zeitS`, `kurzfassung`); nicht von Hand ändern.

## G0 Thema 1: KI-Inferenz im Moderationskompass (30 s, kumuliert 0:30)

Entwurf für Niklas und mich. Unser Thema ist die KI-Inferenz für den Moderationskompass. Die Leitfrage: Wie gut trennt Release 1.3 die Anwendung, den Kontextaufbau und die private Inferenz? Niklas beginnt mit dem App-Host, ich verfolge dann einen echten Auftrag über beide Hosts, und Niklas schließt mit Störungen und dem Aufwand der zweiten Serverrolle.

## J1 Ein Klick. 151 Sekunden. Keine Modellantwort. (40 s, kumuliert 1:10, **Kurzfassung** 0:40)

Ein Klick der Lehrperson, 151 Sekunden Arbeit im Hintergrund, und am Ende steht keine Modellantwort auf dem Bildschirm. Dieser Auftrag ist echt, die Nummer 2 aus meinem gewerteten Lauf, und ich verfolge ihn heute vom Klick bis zum Ergebnis. Zum Vergleich: Im Median brauchen warme Aufträge 148,6 Sekunden. Dabei beantworte ich zwei Fragen. Für Auftrag 1C: Hält der Kontextpfad seine Zusagen zu Vertrag, Konsistenz und Entkopplung ein? Für Auftrag 1B, die ersten beiden Schritte: Wo steckt die Zeit, wenn die Inferenz auf einem zweiten Host läuft? Die Farbe zeigt immer, welcher Auftrag gerade spricht: Petrol ist 1C, Bernstein ist 1B.

## J2 Release 1.3 nachgebaut, mit einem Befehl (60 s, kumuliert 2:10)

Bevor man misst, muss das System stehen. Der erste Schritt von 1B verlangt, das Zwei-Host-Deployment von Release 1.3 nachzubauen. Ich habe das als zwei virtuelle Maschinen auf meinem Laptop aufgebaut: der app-host mit App, Datenbank und Redis, der llm-host mit der Runtime und dem gepinnten Modell. Dazwischen liegt ein privates Netz; die Firewall lässt die Runtime nur vom app-host aus zu, dazu kommt ein Token. Der ganze Aufbau läuft mit einem Befehl, von null bis zu den automatischen Prüfungen. Wichtig sind mir die Abweichungen, und die stehen offen im Protokoll. Die Speicherlimits sind wie im Release, aber die Runtime läuft mit 4 statt 8 CPUs und Threads, weil der Laptop nicht mehr hat. Die Release-Images sind nicht öffentlich, also habe ich sie selbst gebaut und per lokalem Digest gestartet. Und zwei VMs auf einem Rechner sind kein Rechenzentrum. Das begrenzt, was die Zahlen später aussagen.

## J3 Der Weg eines Auftrags (40 s, kumuliert 2:50, **Kurzfassung** 1:20)

Hier ist die Karte für den Rest des Vortrags. Oben der app-host, unten der llm-host. Der Auftrag startet links mit dem Klick. Der Kontext wird gebaut, geht über das Netz zur Inferenz, kommt zurück, wird nachgeprüft und landet am Gate. Die petrolfarbenen Stationen gehören zu 1C, die bernsteinfarbenen zu 1B. Der große Kreis unten ist die Inferenz, 148,3 Sekunden im warmen Median. Alles andere ist dagegen winzig. Der Punkt wandert jetzt von Station zu Station mit.

## J4 Erst die Hypothese, dann die Messung (50 s, kumuliert 3:40)

Wie komme ich zu belastbaren Aussagen? Mit einer festen Reihenfolge. Erstens standen Hypothesen und Schwellen fest, bevor gemessen wurde. Für 1B heißt das: Das Netz darf im Median höchstens 50 Millisekunden kosten, der Adapter höchstens 2 Sekunden, und die Inferenz muss mindestens 95 Prozent der Zeit ausmachen. Zweitens habe ich in 1C zuerst ohne Modell getestet, mit Negativproben. Ich baue absichtlich einen Fehler ein und prüfe, ob der Test rot wird. Nur dann bedeutet ein grüner Test etwas. Erst danach kam drittens das Labor mit der echten Runtime: in 1C der Nachlauf am Laptop, in 1B ein gewerteter Lauf mit 10 Aufträgen.

## J5 Der Host wartet nicht auf das Modell (45 s, kumuliert 4:25, **Kurzfassung** 2:05)

Erste Station, der Klick. Die Frage aus 1C lautet: Blockiert ein langsames Modell die Lehrperson? Der Mechanismus ist eine Queue. Der Host-Aufruf baut den Kontext, legt den Auftrag ab und kehrt sofort mit dem Status pending zurück. Gerechnet wird danach im Hintergrund, mit einem Slot. Gemessen am Laptop dauert der Host-Aufruf im Median 29,4 Millisekunden, die Inferenz dagegen 223,7 Sekunden. Der Host ist also vom Modell entkoppelt. Eine Grenze bleibt: Auf den Kontextaufbau wartet er doch, denn der passiert im Aufruf selbst. Belegt ist das mit dem Test E5 und dem Laborfall N3.

## J6 Was die Vorschau zeigt, kommt an (60 s, kumuliert 5:25, **Kurzfassung** 3:05)

Zweite Station, der Kontext. Die Frage: Bekommt die Runtime genau das, was die Lehrperson in der Vorschau sieht? Der Kontext entsteht aus dem App-Zustand, wird gegen versionierte Schemas geprüft und dann gepackt. Unten steht ein echter Ausschnitt der Nutzlast aus dem Nachlauf, mit synthetischen Daten. Man sieht die Vertragsversion, einen abgeschalteten Bereich mit seinem Grund und eine echte Frage aus der Fixture. Vorschau und Nutzlast tragen denselben Hash, und die Nachricht an die Runtime ist byte-gleich mit der Vorschau. Tokens, Sitzungskennungen und das Budget bleiben auf dem Server. Was kostet die strikte Validierung? 1,2 Millisekunden, das sind 1,6 Prozent eines Kontextaufbaus. Deshalb bleibt sie.

## J7 Sicher geschätzt, aber Platz verschenkt (45 s, kumuliert 6:10)

Zur Frage nach den Kosten der Kontextbereitstellung. Das Budget schätzt Tokens über Bytes: Jedes Byte zählt als ein Token. Das ist sicher, denn ein Token umfasst mindestens ein Byte, und so läuft das Fenster nie über. Aber es ist teuer. Die echten Tokens sind im Median nur das 0,318-fache der Schätzung. Rund zwei Drittel des Fensters bleiben also frei. Und derselbe Kontext meldet gleichzeitig, dass eine Frage aus Budgetgründen weggelassen wurde. Ich empfehle, eine genauere Zählung zu prüfen. Umgesetzt ist das nicht.

## J8 Gemessen am Draht, auf beiden Hosts (50 s, kumuliert 7:00)

Jetzt geht der Auftrag über die Grenze zum zweiten Host. Die Frage aus 1B: Wie trenne ich Netz und Inferenz, ohne den Produktionscode anzufassen? Ich schneide auf beiden Hosts den Verkehr mit. Am app-host sehe ich t null, die Anfrage geht raus, und t drei, die Antwort ist zurück. Am llm-host sehe ich t eins und t zwei. Jede Differenz stammt von einer einzigen Uhr, deshalb muss ich die Uhren nicht abgleichen. Netz ist die Zeit am app-host minus die Zeit am llm-host. Für unseren Auftrag Nummer 2, geklickt um 08:20:35,594 Weltzeit, sind das 0,45 Millisekunden. Über alle 10 Aufträge liegt der Median bei 0,43 Millisekunden.

## J9 Die Zeit steckt in der Inferenz (50 s, kumuliert 7:50, **Kurzfassung** 3:55)

So sieht die ganze Zerlegung aus. Die Achse ist logarithmisch, jeder Strich ist zehnmal mehr. Das Netz kostet im Median 0,43 Millisekunden, die Schwelle lag bei 50. Der Transport mit dem Serveranteil kostet 17,8 Millisekunden, der Adapter in der App 101 Millisekunden, bei einer Schwelle von 2 Sekunden. Und dann die Inferenz: 148,3 Sekunden im warmen Median über 9 Aufträge, ein Anteil von 99,92 Prozent. Kalt, mit frisch gestarteter Runtime, dauert ein Auftrag im Median 200,5 Sekunden. Alle drei Hypothesen sind erfüllt. Die zweite Serverrolle kostet also keine relevante Zeit.

## J10 Wäre der Auftrag ein Fußballfeld … (25 s, kumuliert 8:15, **Kurzfassung** 4:20)

Damit man sich das vorstellen kann: Wäre der Median eines warmen Auftrags so lang wie ein Fußballfeld, dann nähme die Inferenz praktisch das ganze Feld ein. Der Transport wäre gut ein Zentimeter. Und das Netz wäre ein Drittel Millimeter, dünner als die Kreidelinie am Tor. Am Netz zu optimieren lohnt sich also nicht.

## J11 Betrieb: Timeout zu kurz, Speicher läuft voll (50 s, kumuliert 9:05, **Kurzfassung** 5:10)

Zurück zu 1C, zum Betrieb. Zwei Befunde, mit denen das Release so nicht rechnet. Erstens der Timeout: Ab Werk bricht die App nach 90 Sekunden ab. Am PC dauerte schon die Kalibrierungsanfrage 98,7 Sekunden, am Laptop braucht die Inferenz im Median 223,7 Sekunden. Mit dem Release-Timeout wäre der Modellpfad dort nicht nutzbar. Zweitens der Speicher: Der Prompt-Cache der Runtime wächst je Auftrag um 0,419 Gigabyte im Median. Am Laptop wird die Runtime deshalb schon im 19. Auftrag beendet. Ich empfehle, den Timeout am Inferenz-Host zu kalibrieren und den Cache zu begrenzen. Umgesetzt ist beides nicht.

## J12 Die Nachprüfung kostet fast nichts (50 s, kumuliert 9:55)

Nächste Station, nach der Inferenz. Die Frage: Was passiert, wenn sich die Daten ändern, während das Modell rechnet? Der Kontext wird nach der Inferenz noch einmal gebaut und sein Hash mit dem vom Anfang verglichen. Weicht er ab, wird die Antwort als source_changed verworfen. Das kostet am Laptop 0,03 Prozent eines Auftrags, also fast nichts. Deshalb bleibt die Nachprüfung. Dazu ein Befund: Läuft gerade eine Blitzlicht-Runde, und zwar eines anderen Typs als TEMPO, hängt der Hash von der Uhrzeit ab. Dann wird jede Modellantwort während dieser Runde verworfen. Im Labor endete der Typ YESNO 5 von 5 als source_changed, ohne dass sich Daten geändert haben; bei TEMPO passierte das nicht. Ich empfehle, das zu beheben. Umgesetzt ist es nicht.

## J13 Das Gate verwirft jede Modellantwort (70 s, kumuliert 11:05, **Kurzfassung** 6:20)

Und jetzt das Gate. Hier scheitert unser Auftrag. Links steht die echte Antwort des Modells auf Auftrag 2, gekürzt, im Original. Sie ist englisch, obwohl die Sitzung deutsch ist, und sie fasst Moderationszustände zusammen statt Inhalte. Das Gate prüft aber nur die Form: Jede Aussage braucht vorne ein Stichwort mit Doppelpunkt. Das hat keine der 4 Aussagen. Also wird die Antwort verworfen, und die Lehrperson sieht eine extraktive Ersatzzusammenfassung, ohne jeden Hinweis. Das ist kein Einzelfall. Im 1B-Lauf wurden 10 von 10 Antworten verworfen, im 1C-Nachlauf bestand keine der aufgezeichneten Antworten, 0 von 28. Rechts sehen Sie, wie das für die Lehrperson aussieht: Klick, Warten, dann die Ersatzzusammenfassung. Meine Empfehlung aus ADR 1C-018: Instruktion, Grammatik und Gate gemeinsam am ausgelieferten Modell abstimmen. Umgesetzt ist das nicht.

## J14 Was der Betrieb nicht sieht (40 s, kumuliert 11:45)

Was hätte der Betrieb davon bemerkt? Fast nichts. Die App schreibt nur die Gesamtzeit eines Auftrags ins Log. Inferenz, Netz und Adapter sieht man nur mit einem Mitschnitt. Und warum das Gate eine Antwort verwirft, steht nirgends, nur der grobe Grund invalid_response. Damit gehen 99,92 Prozent der Zeit in ein Ergebnis, das nicht ankommt, und niemand sieht es. Ich empfehle, Zeiten und den Grund eines Fallbacks ohne Prompttext zu loggen. Das steht in #19 und #20, umgesetzt ist es nicht.

## J15 Entscheidung und Fragen (50 s, kumuliert 12:35, **Kurzfassung** 7:10)

Meine Entscheidung. Für 1C bleiben Nachprüfung, strikte Validierung, Entkopplung und die Gleichheit von Vorschau und Nutzlast, wie sie sind. Gate, Timeout, Prompt-Cache, Byte-Schätzung, Themen-Snapshot und Blitzlicht-Hash empfehle ich zu ändern; umgesetzt ist davon nichts. Für 1B gilt: Die Topologie kostet keine relevante Zeit, der Hebel liegt am Inferenz-Host. Vorher muss aber das Gate zum Modell passen, sonst bringt schnellere Inferenz nichts. Drei Fragen würde ich gern mit Ihnen diskutieren, sie stehen unten. Und damit gebe ich an Niklas ab: Was passiert, wenn der zweite Host langsam ist oder ausfällt?

## G9 Kurzfazit Thema 1 (30 s, kumuliert 13:05)

Entwurf für das gemeinsame Kurzfazit, mit Niklas abzustimmen: je Auftrag ein Satz, dann ein gemeinsamer Satz zur Leitfrage.

# Reserve

Nur auf Nachfrage (Taste `r`), keine Zeit im Vortrag.

## R1 Reserve: Kalibrierung des Timeouts

Falls gefragt wird, warum ich nicht mit 90 Sekunden gemessen habe: Eine Kalibrierungsanfrage am PC brauchte schon 98,7 Sekunden. Deshalb lief das Labor mit 300 Sekunden, der Obergrenze des Produkts, offen als Abweichung markiert.

## R2 Reserve: Kontrolle C0, Strecke gegen lokal

Die Kontrolle C0 vergleicht dieselbe kurze Anfrage über die Strecke und lokal. Die Differenz der Mediane ist −2,0 Millisekunden, also im Rauschen. Die Strecke zwischen den Hosts kostet praktisch nichts.

## R3 Reserve: Ausfall B0

Fehlt die Runtime, fällt die App ohne Wartezeit auf die extraktive Zusammenfassung zurück, im Median nach 88,5 Millisekunden. Den Ausfall untersucht Niklas genauer.

## R4 Reserve: Kaltläufe, n = 5

Kalt und warm sind getrennte Gruppen. Mit frischer Runtime dauert ein Auftrag im Median 200,5 Sekunden, warm 148,6 Sekunden. Der Inferenzanteil bleibt in beiden Fällen über der Schwelle.

## R5 Reserve: Gültigkeitsgrenzen

Was die Zahlen nicht sagen: Sie gelten für Laborrechner, ein Modell und eine synthetische Fixture. Inferenzzeiten sind nicht auf den Produktionshost übertragbar, und ein privates Netz ist noch kein Datenschutz.

## R6 Reserve: Anteil der KI

Zur KI-Nutzung: Die KI hat Skripte, Tests, Auswertungen und Texte entworfen. Fragen, Hypothesen und Schwellen habe ich vor jeder Messung freigegeben, die Läufe gesteuert und die Ergebnisse geprüft. Wer was gemacht hat, steht je Artefakt in den Eigenanteil-Dateien.

## R7 Reserve: ADR-Zählung 1C

Die Zählung der Entscheidungen in 1C nach Status. Keine Empfehlung ist umgesetzt, das verlangt der Auftrag so: Ergebnis ist eine begründete Empfehlung, kein Patch.
