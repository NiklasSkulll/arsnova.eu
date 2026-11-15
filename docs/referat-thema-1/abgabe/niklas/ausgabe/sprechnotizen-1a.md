# Sprechnotizen Niklas, Teil 1A (Entwurf von Jonas)

Gesamt 6:35 min. Erzeugt aus `abgabe/niklas/folien-1a.mjs` (`notiz`, `zeitS`); Entwurf zur Besprechung.

## N1 Wie viel optionale Analyse verträgt der App-Host? (40 s, kumuliert 0:40)

Ich bin Niklas Schneider und habe untersucht, ob der App-Host von arsnova.eu die optionale spaCy-Glättung der Wortwolke neben den Live-Aktionen tragen kann. Kurz: nein, noch nicht. Im Normalbetrieb bleibt spaCy in seinem Budget, aber die Regel, die ich vor der Messung festgelegt habe, hält nicht in allen Blöcken. Deshalb bleibt spaCy aus.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json

## N2 Was auf dem App-Host konkurriert (45 s, kumuliert 1:25)

Auf dem App-Host laufen Backend, PostgreSQL, Redis und der PDF-Worker ohne eigene Limits. Dazu kommt der spaCy-Sidecar, der Flexionsformen in der Wortwolke zusammenführt; er hat wie in der Produktions-Compose eine CPU, ein Gibibyte und 64 Prozesse und kein Netz. Rechenintensive Nebenarbeit kann die Latenz interaktiver Dienste stören, genau das prüfe ich. Die generative Inferenz liegt nach ADR-0035 auf einem eigenen Host, das ist Jonas’ und mein Teil 1B.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json

## N3 Fünf Varianten, fünf gepaarte Blöcke (50 s, kumuliert 2:15)

Ich vergleiche fünf Varianten. V0 ist Live-Last ohne Analyse, V1 ruft die Analyse auf, aber ohne spaCy; das ist meine Basis. V2 ist spaCy im Normalbetrieb, V3 gedrosselt auf ein Viertel CPU, V4 hängt hinter einem Proxy, der sechs Sekunden verzögert, länger als der Timeout von fünf Sekunden. Jede Variante läuft in fünf Blöcken, die Reihenfolge ist zufällig gemischt, und ich vergleiche immer innerhalb desselben Blocks. Wiederholung und gepaarter Vergleich sollen Laufschwankungen sichtbar machen statt sie zu verstecken.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json

## N4 Die Regel stand vor der Messung fest (45 s, kumuliert 3:00)

Die Regel habe ich vor den bestätigenden Läufen im Versuchsvertrag festgehalten. Je Aktion und Block darf der p95 gegenüber V1 höchstens zehn Prozent und höchstens fünfzig Millisekunden steigen, beides muss gelten. Ich schaue auf den p95, weil gerade die langsamen Anfragen die Nutzer treffen. Dazu kommen Fehlergrenzen und eigene Grenzen für spaCy: Drosselung, Speicher, kein OOM. Alle fünf Blöcke müssen bestehen, und ich entferne keine Ausreißer.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json

## N5 Deutlich verletzt nur V3 in Block 5 (60 s, kumuliert 4:00)

Hier sind alle 80 gepaarten Vergleiche. Grau hält, Bernstein verfehlt nur die Zehn-Prozent-Regel, Rot auch die fünfzig Millisekunden. Mit spaCy verfehlen 7 von 60 Vergleichen die Regel, also sind H1 und H2 nicht bestätigt. Deutlich ist nur V3 in Block 5, mit bis zu 214 Millisekunden mehr. Die übrigen 7 Verletzungen liegen unter 16 Millisekunden, und 4 davon stehen in der Kontrollzeile ganz ohne spaCy. Bei p95-Werten um zwanzig Millisekunden reißt die relative Regel also schon durch kleine Schwankungen. Ich lasse die Regel trotzdem so stehen, weil sie vorher festgelegt war.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json

## N6 spaCy bleibt im Budget, gedrosselt nicht (50 s, kumuliert 4:50)

Links die Drosselung, rechts der Speicher von spaCy, ein Punkt je Block. Im Normalbetrieb V2 ist spaCy unter einem Prozent der Perioden gedrosselt und braucht rund 480 Mebibyte, weit unter der Schwelle von achtzig Prozent. Gedrosselt auf ein Viertel CPU, V3, sind es 88–96 Prozent; genau dort steigt in Block 5 auch die Live-Latenz. In V4 rechnet spaCy gar nicht, dazu gleich mehr. Gemessen über die cgroup-v2-Zähler des Containers.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json

## N7 Langsame Analyse, Ersatz statt Ausfall (50 s, kumuliert 5:40)

Für die Lehrenden heißt das: Gedrosselt dauert die Analyse im p95 zwei bis drei Sekunden statt einer halben, fast alle kommen noch an. Mit Timeout in V4 greift nach rund fünf Sekunden der lexikalische Ersatz, 745 von 750 Mal. Wichtig: Der Proxy hat keine einzige Anfrage weitergeleitet, weil der Client vorher abbricht. V4 testet also den Timeout- und Ersatzpfad der App, nicht spaCy unter Last. Eine Frist unterhalb der Verzögerung ist genau dafür gedacht, dass Arbeit nicht endlos wartet.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json

## N8 Entscheidung: lexikalische Wortwolke beibehalten (50 s, kumuliert 6:30)

Meine Entscheidung ist die Gegenalternative aus dem Vertrag: spaCy bleibt aus, die lexikalische Wortwolke reicht. Ich weiche die Kriterien nachträglich nicht auf. Für weitere Versuche bleibt das Budget von einer CPU und einem Gibibyte. Die Grenzen: Alles lief auf einem WSL2-Host zusammen mit dem Lastgenerator, das Profil ist eine Beitrittswelle, und über Rendering oder das LLM sage ich nichts. Drei Fragen würde ich gern diskutieren.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json

## N9 Literaturverzeichnis 1A (5 s, kumuliert 6:35)

Literaturverzeichnis zu 1A nach dem IU-Zitierleitfaden.

_Quelle:_ abgabe/niklas/literatur-1a.mjs
