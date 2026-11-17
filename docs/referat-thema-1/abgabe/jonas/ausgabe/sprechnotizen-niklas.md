# Sprechnotizen Niklas

Gesamt 14:25 min, Kurzfassung 12:15 min (Folien mit der Marke „Kurzfassung“). Erzeugt aus `abgabe/niklas/folien-1a.mjs`, `folien-1b34.mjs` und GT, G0, G9, GD in `folien.mjs` (`notiz` = Fließtext, `stichpunkte`, `zeitS`, `kurzfassung`); nicht von Hand ändern. Vorgetragen wird aus den Stichpunkten; der Fließtext ist die ausformulierte Fassung zum Üben.

## Sprungplan

Geplant: 14:25 min (Grenze 15:00 min), ab der ersten Folie (GT) gezählt. N10 beginnt im Plan bei 8:20 min; N10 bis GD brauchen zusammen 6:05 min. Bis 8:55 min bleiben 0:35 min Puffer. Wer bei 8:55 min noch vor N10 steht, blättert mit Pfeil rechts ohne Kommentar bis N10 und spricht ab dort weiter. Bei Zeitdruck von Anfang an nur die Folien mit der Marke „Kurzfassung“ (12:15 min); sie enthält N10 bis GD. Nach N10 spricht Jonas (J1–J15, etwa 14:30 min); die Uhr für den Sprungplan läuft nur während der eigenen Folien.

## GT Thema 1: KI-Inferenz im Moderationskompass (10 s, kumuliert 0:10, **Kurzfassung** 0:10)

**Stichpunkte**

- „Guten Tag. Wir sind Niklas Schneider und Jonas Weirauch.“
- Thema 1: KI-Inferenz im Moderationskompass
- Weiter zum Fahrplan

**Fließtext**

Guten Tag. Wir sind Niklas Schneider und Jonas Weirauch und stellen Thema 1 vor: die KI-Inferenz im Moderationskompass von arsnova.eu.

_Quelle:_ Prüfungsdokument (Modul DSCC0127, Abschnitt 4.3 Thema 1); Prüfer und Termin nach Angabe der Gruppe (2026-11-16)

## G0 Eine Leitfrage, vier Teile (35 s, kumuliert 0:45, **Kurzfassung** 0:45)

**Stichpunkte**

- Leitfrage (Prüfungsdokument): Trennt Release 1.3 App, Kontextaufbau und private Inferenz unter realer Last?
- Grenze vorweg: reale Last nur als Labormodell
- Fahrplan: Niklas 1A → Jonas 1C und 1B 1–2 → Niklas 1B 3–4 → Fazit
- Teilleiste oben rechts auf jeder Folie
- Übergang: Ich beginne auf dem App-Host

**Fließtext**

Die Leitfrage stammt aus dem Prüfungsdokument: Wie wirksam trennt die Architektur von Release 1.3 Anwendung, Kontextaufbau und private Inferenz unter realer Last? Reale Last gibt es bei uns nur als Labormodell; das ist eine Grenze. Ich beginne mit 1A auf dem App-Host: Wie viel optionale Arbeit verträgt er neben der Live-Last? Danach verfolgt Jonas einen echten Auftrag über beide Hosts. Zum Schluss störe ich den zweiten Host, und wir antworten gemeinsam auf die Leitfrage. Den Fahrplan sehen Sie oben rechts auf jeder Folie.

_Quelle:_ Prüfungsdokument Abschnitt 4.3 (Thema 1, Aufträge 1A–1C); 01-aufteilung.md; Design 2026-11-15, Abschnitt 3 (Reihenfolge)

## GK Live-App für den Hörsaal, KI nur als Zusatz (50 s, kumuliert 1:35, **Kurzfassung** 1:35)

**Stichpunkte**

- arsnova.eu: Open Source (MIT), Quiz, Q&A und Blitzlicht in einer Live-Session
- Ausgelegt auf ≥ 500 Clients zugleich, auch hinter gemeinsamem NAT
- Moderationskompass: Hinweiskarten für Lehrende, regelbasiert, ohne KI nutzbar
- [Weiter] 1A (ich): spaCy-Sidecar glättet die Wortwolke auf dem App-Host
- [Weiter] Jonas: Kontextpfad und Inferenz auf dem zweiten Host
- [Weiter] 1B 3–4 (ich): zweiten Host stören; Weg oben links zeigt den Ort

**Fließtext**

Kurz zum System. arsnova.eu ist eine Open-Source-App für Live-Interaktion in der Lehre: Quiz, Q&A und Blitzlicht in einer Session, ohne Pflichtkonten. Ausgelegt ist sie auf mindestens 500 gleichzeitige Clients im Hörsaal, auch wenn viele hinter einem gemeinsamen NAT sitzen. Die Lehrperson sieht im Moderationskompass Hinweiskarten aus den Live-Signalen, regelbasiert und ohne KI nutzbar. Drei optionale Bausteine haben wir untersucht. [Weiter] Ich beginne mit dem spaCy-Sidecar, der auf dem App-Host die Wortwolke glättet. [Weiter] Jonas verfolgt den Kontextpfad zur Q&A-Zusammenfassung und die Inferenz auf dem zweiten, privaten Host. [Weiter] Zum Schluss störe ich diesen zweiten Host. Der kleine Weg oben links zeigt später, wo wir gerade sind.

_Quelle:_ a19ca70f (v1.4.0-184): README.md (Kurzbeschreibung, Produktumfang, Lizenz MIT, keine Pflichtkonten), AGENTS.md (mindestens 500 gleichzeitige Hörsaal-Clients, gemeinsames NAT), docs/features/moderation-compass.md (regelbasierte, quellenbelegte Karten); Prüfungsdokument Abschn. 4.1.1 (Bausteine 1.14a/b spaCy, 8.9a Kompass, 8.9c Zusammenfassung, 8.9d Runtime; Topologie nach ADR-0035: LLM-Rolle auf zweitem privatem Host)

## N1 Keine Freigabe für die spaCy-Glättung (50 s, kumuliert 2:25, **Kurzfassung** 2:25)

**Stichpunkte**

- Start auf dem App-Host (Teil 1 im Fahrplan)
- Leitfrage: Reserve für optionale Analyse, ohne Live-Signale zu verzögern?
- Antwort vorweg: keine Freigabe für spaCy
- 40.000 von 40.000 Live-Aktionen ok; mit spaCy 7/60 verfehlt, Kontrolle ohne spaCy 4/20
- Nicht „schädlich“: Unschädlichkeit nicht belegt, Nutzen ungemessen

**Fließtext**

Ich beginne auf dem App-Host und frage: Welche Reserve hat er für optionale Analyse, ohne die Live-Signale zu verzögern? Geprüft habe ich das an der spaCy-Glättung der Wortwolke. Die Antwort vorweg: keine Freigabe. Alle 40.000 Live-Aktionen meiner Reihe kamen an, ohne einen Fehler. Mit spaCy verfehlen 7 von 60 Vergleichen die vorher festgelegte Regel. Aber auch die Kontrolle ganz ohne spaCy verfehlt sie 4 von 20 Mal. Ich sage deshalb nicht, spaCy sei schädlich. Ich sage: Die Unschädlichkeit ist nicht belegt, und den Nutzen habe ich nicht gemessen. Oben links zeigt der kleine Weg, wo wir sind: vom App-Host über den Live-Pfad zu spaCy und zurück zur Wortwolke.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json (live.*.planned/succeeded, hypotheses.H1/H2); Leitfrage: Prüfungsdokument Abschn. 4.3, Gruppenauftrag 1A · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (nach v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N2 Fünf Dienste teilen sich den App-Host (45 s, kumuliert 3:10)

**Stichpunkte**

- Fünf Dienste; Backend, DB, Redis ohne Limit; spaCy 1 CPU, 1 GiB, 64 PIDs wie in Produktion
- Limit = Obergrenze, keine Reservierung für die App (cgroup v2)
- Encoder und 8.9b in allen Läufen aus; Kontextaufbau in der App
- Kein LLM hier (ADR-0035): 16-GB-Host trägt kein ~4-GB-Modell, Live-Pfade warten nie

**Fließtext**

Auf dem App-Host laufen fünf Dienste. Backend, Datenbank und Redis haben kein Limit; spaCy hat wie in der Produktions-Compose eine CPU, ein Gibibyte und vierundsechzig Prozesse. Ein cgroup-Limit ist eine Obergrenze, keine Reservierung: Es hält spaCy klein, schützt aber nichts für die App. Den Encoder der semantischen Wortwolke und die Q&A-Klassifikation 8.9b habe ich in allen Läufen ausgeschaltet; der Kontextaufbau läuft in der App. Ein Sprachmodell gehört nach ADR-0035 nicht hierher: Der Host mit sechzehn Gigabyte trägt neben Baseline und Sidecars kein Modell mit etwa vier Gigabyte, und Live-Pfade dürfen nie auf Inferenz warten. Deshalb sagt mein spaCy-Befund nichts über ein LLM.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json; Limits aus den Laufmanifesten V2/block-01/lauf.json manifest.services (= docker-compose.prod.yml, aufgelöste Compose je Lauf); Flags QA_NLP_ENABLED, WORD_CLOUD_SEMANTIC_ENABLED, OPEN_WEIGHT_LLM_ENABLED = false und kein Encoder-/LLM-Dienst in allen 25 Manifesten; Kernel-Doku cgroup v2 (Linux 6.12), Abschn. „CPU Interface Files“; ADR-0035 Z. 27–31 und Abschn. 2.1 (Live-Host-RAM ~10–11 GB Baseline plus spaCy 1 GB, Encoder 2 GB, PDF-Worker 1 GB trägt kein ~4-GB-LLM; Same-Host-Sidecar nur Labor) · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (nach v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N3 Fünf Varianten, je Block gemischt (45 s, kumuliert 3:55)

**Stichpunkte**

- V0 nur Live-Last, V1 Analyse ohne spaCy = Basis
- V2 spaCy 1 CPU, V3 0,25 CPU, V4 Proxy +6 s hinter Timeout 5 s
- Profil: 60 s warm, 300 s Fenster, 500 Beitritte in 90 s, Analyse alle 2 s
- 5 Blöcke, Reihenfolge gemischt, Vergleich nur im selben Block
- Ziel: Rauschen sichtbar machen, nicht verstecken

**Fließtext**

Ich vergleiche fünf Varianten. V0 ist nur Live-Last. V1 ruft zusätzlich die Analyse auf, aber mit spaCy aus, also lexikalisch; das ist meine Basis. V2 ist spaCy im Normalbetrieb mit einer CPU, V3 gedrosselt auf ein Viertel CPU, und in V4 sitzt ein Proxy vor spaCy, der sechs Sekunden verzögert, länger als der Timeout von fünf Sekunden. Jeder Lauf hat dasselbe Profil: eine Minute Aufwärmen, dann fünf Minuten Messfenster mit fünfhundert Beitritten in neunzig Sekunden, und fünf Lehrende rufen alle zehn Sekunden die Analyse ab. Jede Variante läuft in fünf Blöcken, innerhalb eines Blocks in zufälliger Reihenfolge. Verglichen wird nur innerhalb desselben Blocks. So wird Laufrauschen sichtbar, statt sich in einem einzigen Lauf zu verstecken.

_Quelle:_ 1A-Versuchsvertrag (Varianten, Lastprofil); evidenz/1A/reihe-main-a19ca70f-20261115-122547/plan.json (profile, runs, Seed 438314513); Laufmanifeste (Limits, NLP_TIMEOUT_MS), auswertung.json runs[V4].proxy.delayMs · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (nach v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N4 Die Regel stand eine Woche vorher fest (50 s, kumuliert 4:45, **Kurzfassung** 3:15)

**Stichpunkte**

- V0 ohne Analyse, V1 Basis, V2 1 CPU, V3 0,25 CPU, V4 Proxy hinter Timeout; 5 Blöcke gemischt
- Regel: p95 höchstens +10 % und +50 ms, je Aktion und Block; alle 5 Blöcke
- In Git seit 07.11., Läufe am 15.11.: eine Woche
- Erste Reihe (12.11., 8f91e041): H1 4/20, H2 6/40, gleiches Urteil
- Gewertet: Wiederholung nach v1.4.0, Vertrag unverändert

**Fließtext**

Fünf Varianten: V0 nur Live-Last, V1 mit lexikalischer Analyse als Basis, V2 spaCy mit einer CPU, V3 gedrosselt auf ein Viertel, V4 hinter einem Proxy, der länger wartet als der Timeout. Fünf Blöcke, je Block zufällig gemischt, verglichen wird nur im selben Block. Die Regel: Je Aktion und Block darf der p95 höchstens zehn Prozent und höchstens fünfzig Millisekunden steigen, und alle fünf Blöcke müssen bestehen. Gemessen wird das p95, weil Nutzer auf die langsamen Anfragen warten. Die Regel steht seit dem siebten November in Git, eine Woche vor den Läufen. Offen gesagt: Eine erste vollständige Reihe auf dem älteren Code-Stand vom zwölften November verfehlte H1 und H2 ebenfalls. Gewertet wird die Wiederholung auf einem Stand nach Version 1.4.0 mit unverändertem Vertrag, weil das Ergebnis für den aktuellen Stand gelten soll.

_Quelle:_ 1A-Versuchsvertrag (Regeltabelle, „Alle fünf Blöcke“; SHA-256 f7d3eba4… = contractSha256 aller 25 Laufmanifeste); Git: 2372a037 2026-11-07T16:19:22+01:00, 35271586 2026-11-12T18:31:57+01:00, e3b27b32 2026-11-14T15:42:50+01:00; erster Lauf 2026-11-15T11:40:34.030Z (lauf.json manifest.startAt); erste Reihe: Daten 35271586 (2026-11-12T18:31:57+01:00), Auswertung 97bfcfc9 (2026-11-14T12:41:10+01:00), Baseline 8f91e041, gleicher Vertrag, Seed 438314513, Fixture da24eeb3…, H1 4/20, H2 6/40, 0 absolute Verletzungen; aus dem Arbeitsbaum entfernt in ab1619e7 · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (nach v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N5 Alle 40.000 Live-Aktionen kamen an (40 s, kumuliert 5:25)

**Stichpunkte**

- 40.000 von 40.000 ok, 25 Läufe, 0 Fehler
- Ein Punkt = p95 eines Laufs, lineare Achse bis 1 s
- Höchster Quiz-Lauf 167 ms, Ziel ≤ 1.000 ms
- Eingänge des Kompasses; Anzeige im Browser nicht gemessen

**Fließtext**

Zuerst, was hält. In allen fünfundzwanzig Läufen kamen alle 40.000 Live-Aktionen an: Beitritte, Quizstimmen, Tempostimmen und Q&A-Fragen. Jeder Punkt ist der p95 eines Laufs; die lineare Achse reicht bis zum vorab gesetzten Quiz-Ziel von einer Sekunde. Der langsamste Quiz-Lauf liegt bei 167 Millisekunden, die meisten Punkte unter sechzig. Diese Aktionen sind die Eingänge des Moderationskompasses. Wie schnell eine Karte im Browser der Lehrperson erscheint, habe ich nicht gemessen.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json runs[].live.<aktion>.p95Ms, planned, succeeded, failed; Kompass-Eingänge: docs/GLOSSAR.md (Moderationskompass) · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (nach v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N6 Deutlich verletzt wird die Regel nur einmal (70 s, kumuliert 6:35, **Kurzfassung** 4:25)

**Stichpunkte**

- 80 Vergleiche, erst ohne Ergebnis
- [Weiter] Grau = hält; Kontrolle ohne spaCy: 4 Treffer, je wenige ms
- [Weiter] Mit spaCy 3 kleine Treffer: H1, H2 formal nicht bestätigt
- [Weiter] V3, letzter Lauf: 3 über 50 ms, bis +214 ms
- Summe 11 von 80; Regel bleibt, weil vorher festgelegt

**Fließtext**

Jetzt die Regel. Das sind alle 80 gepaarten Vergleiche: jede Aktion in jedem Block gegen ihre Basis, noch ohne Ergebnis. [Weiter] Grau heißt: hält. Zuerst die Kontrolle, V1 gegen V0, ganz ohne spaCy. Schon sie verfehlt die Regel 4-mal, um höchstens 16 Millisekunden. Bei p95-Werten um zwanzig Millisekunden reichen dafür zwei Millisekunden Schwankung. [Weiter] Mit spaCy kommen 3 ebenso kleine Treffer dazu, alle unter fünf Millisekunden. Formal reicht das schon: H1 und H2 sind nicht bestätigt. [Weiter] Und hier der eine deutliche Effekt: V3, also spaCy gedrosselt, im letzten Lauf der Reihe. 3 Aktionen über fünfzig Millisekunden, bis zu 214 Millisekunden mehr. Insgesamt verfehlen 11 von 80 die Regel. Ich lasse sie trotzdem stehen, weil sie vorher festgelegt war.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json comparisons[] (relativePassed, absolutePassed, absoluteChangeMs); evidenz/1A/…/auswertung/live-vergleiche.csv; nachgerechnet aus durationSamplesMs (Nearest Rank), 0 Abweichungen · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (nach v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N7 Der Ausreißer dauerte rund zehn Sekunden (50 s, kumuliert 7:25, **Kurzfassung** 5:15)

**Stichpunkte**

- Nachträglich ausgewertet, nicht vorab festgelegt
- 50 langsame Beitritte in ≈ 10 s; sonst je Aktion höchstens 1
- [Weiter] Zeitgleich die einzigen 3 Timeouts von V3, dann Gegendruck
- [Weiter] App bis 73 %, PostgreSQL bis 37 % einer CPU
- Ursache offen: Rückstau oder Host/DB; V4 spricht gegen Rückstau allein

**Fließtext**

Was geschah im letzten Lauf? Nachträglich ausgewertet, deshalb der Vermerk hinter der Frage. Alle 50 Beitritte über hundert Millisekunden liegen in einem Fenster von etwa zehn Sekunden; in den übrigen Läufen gibt es je Aktion höchstens 1 solchen Wert. [Weiter] Genau dort laufen die einzigen 3 Timeouts der gedrosselten Variante. [Weiter] Zugleich steigt die CPU der App auf 73 Prozent einer CPU und die der Datenbank auf 37 Prozent, sonst höchstens 27. Die Ursache ist offen. Ein Rückstau der gedrosselten Analyse passt dazu, aber V4 hatte hunderte Timeouts ohne solchen Effekt; ebenso möglich ist ein Ereignis auf Host oder Datenbank. Zum Maßstab: 25 Läufe mit je 300 Sekunden Messfenster sind 125 Minuten; der Ausreißer betrifft davon etwa zehn Sekunden. Für die Entscheidung ändert das nichts.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/V3/block-05/lauf.json (live.actions.join.latency.durationSamplesMs, live.lifecycle.arrivals[].scheduledAtMs, analysis.analysis.calls[]), V3/block-05/ressourcen.json.gz (snapshots[].containers[].delta.cpuPercent); Vergleich mit allen übrigen Läufen; Zuordnung Stichprobe ↔ Ankunft ist eine Näherung (Abschlussreihenfolge) · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (nach v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N9 Nach 5 s liefert die App den Ersatz (55 s, kumuliert 8:20, **Kurzfassung** 6:10)

**Stichpunkte**

- Lexikalisch < 0,1 s, spaCy ≈ 0,5 s, gedrosselt 2–3 s (passt zur Drosselung)
- V4: Ersatz nach ≈ 5 s, Proxy hat 0 weitergeleitet: prüft Frist und Ersatz
- 250 „nicht erreichbar“, je Lauf 50 = Gegendruckgrenze (2 offen)
- Reserve im Labor: < 0,5 CPU von 16, ≥ 11,6 GiB frei; Zielhost nicht gemessen

**Fließtext**

Was sehen die Lehrenden? Die lexikalische Wortwolke ist in unter einer Zehntelsekunde da, mit spaCy im Normalbetrieb nach etwa einer halben Sekunde, gedrosselt nach zwei bis drei; das passt zur Drosselung von eben. In V4 greift nach rund fünf Sekunden der Timeout, und die App liefert den lexikalischen Ersatz; der Proxy hat keine Anfrage weitergeleitet, V4 prüft also Frist und Ersatz. 250 Ersatzfälle meldet der Client als nicht erreichbar, je Lauf genau 50: Das passt zur Grenze von zwei offenen Anfragen. Zur Reserve: Im Labor brauchte der ganze Stack weniger als eine halbe CPU von sechzehn, mindestens 11,6 Gibibyte blieben frei. Für den Zielhost habe ich das nicht gemessen.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json runs[].analysis (successLatency, fallbackLatency, outcomes, fallbackReasons), runs[V4].proxy (delayMs, forwarded, cancelledBeforeForward; scope proxy-lifetime-including-warmup), runs[].resources[alias=spacy], runs[].collectorHost.minAvailableMemoryBytes (abgerundet); SIDECAR_UNAVAILABLE fasst Gegendruck und echte Unerreichbarkeit zusammen (apps/backend/src/lib/wordCloudNormalizer.ts, reasonFromSidecarError), Gegendruck daher erschlossen aus genau 50 je Lauf; NLP_TIMEOUT_MS aus den Laufmanifesten; SPACY_MAX_IN_FLIGHT: apps/backend/src/lib/spacyClient.ts Z. 22, Prüfung Z. 187 · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (nach v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## N10 Entscheidung: lexikalische Wortwolke bleibt (65 s, kumuliert 9:25, **Kurzfassung** 7:15)

**Stichpunkte**

- Keine Freigabe, NLP_ENABLED=false bleibt (Standard, kostet nichts)
- Regel verfehlt (7/60), Beweislast bei der Option, Nutzen ungemessen
- Budget 1 CPU / 1 GiB für neue Versuche; 0,25 CPU keine Einsparung
- Grenzen: ein WSL2-Host mit Generator, Beitrittswelle
- Selbstkritik: Regel zu empfindlich, künftig ohne Änderung kalibrieren
- „Was, wenn wir die schwere Arbeit auslagern?“ LLM ≈ 2,5 min je Auftrag → Jonas

**Fließtext**

Meine Entscheidung ist die Gegenalternative aus dem Vertrag: keine Freigabe, spaCy bleibt aus, wie es die Produktionsvorlage ohnehin vorsieht. Das kostet im Betrieb nichts. Die Begründung: Die vorab festgelegte Regel ist verfehlt, und eine optionale Komponente muss ihre Unschädlichkeit belegen, nicht umgekehrt. Den Nutzen, zusammengeführte Wortformen, habe ich nicht gemessen; dagegen stehen Image, Modell, Limits und Überwachung. Ein Viertel CPU ist keine gleichwertige Einsparung. Die Grenzen: ein WSL2-Rechner mit dem Lastgenerator auf demselben Host und eine Beitrittswelle. Selbstkritisch: Die Regel war für p95-Werte um zwanzig Millisekunden zu empfindlich; für einen neuen Versuch würde ich sie an einem Vergleich ohne Änderung kalibrieren. Und spaCy ist klein: Ein Sprachmodell rechnet in Jonas' Labor rund zweieinhalb Minuten je Auftrag, das trägt der App-Host nicht. Was, wenn wir diese schwere Arbeit auslagern? Das zeigt Jonas.

_Quelle:_ 1A-auswertung.md (Entscheidung, Budget und Rückweg, Grenzen); 1A-Versuchsvertrag (Gegenalternative); evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json hypotheses; NLP_ENABLED=false: .env.production.example Z. 205 (docker-compose.prod.yml liest es von dort, Default false); LLM-Dauer: 1B-ergebnis.md, warm im Median 148,6 s je Auftrag (ThinkPad P50, Commit 8e9d1317) ≈ 2,5 min · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (nach v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

_Übergabe:_ Nach N10 spricht Jonas (J1–J15, etwa 14:30 min); die Uhr für den Sprungplan läuft nur während der eigenen Folien.

## M1 Ersatz kommt immer, ein stummer Host bremst (75 s, kumuliert 10:40, **Kurzfassung** 8:30)

**Stichpunkte**

- „Danke, Jonas.“ Seine Frage: Was, wenn der zweite Host langsam ist oder ausfällt?
- Kreis Summary, Raute Label; Fristen 30 s und 300 s; grau normal
- [Weiter] Stopp 48 ms, Slot belegt 93 ms
- [Weiter] Netz langsam: Antwort kommt; DROP Summary 135 s (× 2.800), Label 30 s
- [Weiter] Zu spät: volle Frist (300 s, Label 30 s)
- Kriterien vorab (5e758d0a) erfüllt; gestoppt Millisekunden, stumm Minuten

**Fließtext**

Danke, Jonas. Er hat gefragt: Was, wenn der zweite Host langsam ist oder ausfällt? Ich habe die Runtime im Labor gezielt gestört, unter derselben Beitrittswelle wie in 1A, für zwei Aufträge: die Q&A-Zusammenfassung als Kreis und die Wortwolken-Labels als Raute. Die Achse ist logarithmisch, rot stehen die Fristen, 30 Sekunden für Labels und 300 für Summaries. Grau ist der Normalbetrieb. Labels übernimmt die App nach etwa 3,5 Sekunden, Summaries verwirft das Gate wie bei Jonas. [Weiter] Ist der Container gestoppt, kommt der Ersatz nach 48 Millisekunden, bei belegtem Slot nach 93 Millisekunden. [Weiter] Bremse ich das Netz um fünfhundert Millisekunden, kommt die Antwort trotzdem. Verwirft die Firewall die Pakete, merkt die App das bei Summaries erst nach 135 Sekunden, rund 2.800-mal so spät wie beim Stopp; bei Labels beendet die Frist das Warten nach 30 Sekunden. [Weiter] Antwortet die Runtime zu spät, wartet die App die volle Frist. Ein gestoppter Host kostet Millisekunden, ein stummer Minuten.

_Quelle:_ evidenz/1B/messung/2026-11-15-lauf-normal-summary.json.gz (Commit 5e758d0a, n = 10); evidenz/1B/messung/2026-11-16-lauf-normal-label-01.json.gz + evidenz/1B/messung/2026-11-16-lauf-normal-label-02.json.gz + evidenz/1B/messung/2026-11-16-lauf-normal-label-03.json.gz (Commit 7c64dd6a, n = 30); evidenz/1B/messung/2026-11-15-lauf-f1-summary.json.gz (Commit 5e758d0a, n = 10); evidenz/1B/messung/2026-11-16-lauf-f1-label.json.gz (Commit 7c64dd6a, n = 10); evidenz/1B/messung/2026-11-16-lauf-busy-summary.json.gz (Commit 2b39b9df, n = 10); evidenz/1B/messung/2026-11-16-lauf-l1-label-01.json.gz + evidenz/1B/messung/2026-11-16-lauf-l1-label-02.json.gz (Commit 7c64dd6a, n = 20); evidenz/1B/messung/2026-11-16-lauf-l2-label.json.gz (Commit 7c64dd6a, n = 3); evidenz/1B/messung/2026-11-16-lauf-f2-summary.json.gz (Commit 2b39b9df, n = 5); evidenz/1B/messung/2026-11-16-lauf-f2-label.json.gz (Commit 7c64dd6a, n = 3); evidenz/1B/messung/2026-11-16-lauf-l3-summary.json.gz (Commit 2b39b9df, n = 10); evidenz/1B/messung/2026-11-16-lauf-l3-label.json.gz (Commit 7c64dd6a, n = 3) · i7-10700K, Hyper-V, ohne CPU-Pinning; arsnova-1b-app 2 vCPU/4 GiB, arsnova-1b-llm 8 vCPU/10 GiB · Summary Job-Zeit (experiment.jobs[].jobMs), Label Client-Zeit (clientWaitMs, die Label-API legt keine Job-Zeit offen); Label-Frist OPEN_WEIGHT_LLM_LABEL_TIMEOUT_MS = 30.000 ms laut settings · Faktor DROP/Stopp wie f2-summary.md (134.732 / 48) · Schwellen docs/referat-thema-1/1B-3u4-Planung.md, Commit 5e758d0a (2026-11-15T21:10:37+01:00); Label-Fristkriterium laut Planung nicht bewertbar · Prüfung durch den Autor: 2026-11-16

## M2 Der Breaker dämpft Ausfälle, keine Hänger (50 s, kumuliert 11:30, **Kurzfassung** 9:20)

**Stichpunkte**

- Breaker: nach 3 Fehlern 30 s aus, Ersatz sofort; vier Aufträge ohne Pause
- Stopp: 3 × abgewiesen, Auftrag 4 nach 44 ms ohne Netz
- [Weiter] Zu spät: 4 × 90 s, auch Auftrag 4 erreicht die Runtime
- Code: Queue-Abbruch = aborted, zählt nicht; dämpft Ausfälle, keine Hänger

**Fließtext**

Der Client hat einen Circuit Breaker: Nach drei Fehlern schaltet er dreißig Sekunden lang ab und liefert sofort den Ersatz. Meine Folge prüft mit vier Aufträgen direkt hintereinander, ob er auch Hänger abfängt. Oben ist die Runtime gestoppt: drei Ablehnungen, dann öffnet der Breaker, und Auftrag vier endet nach 44 Millisekunden ohne Netzversuch. [Weiter] Unten antwortet die Runtime zu spät: Jeder Auftrag wartet die Frist von 90 Sekunden, und auch Auftrag vier geht wieder zur Runtime. Der Grund steht im Code: Die Warteschlange bricht den Aufruf selbst ab, das zählt als abgebrochen und nicht als Fehler. Der Breaker dämpft also Ausfälle, aber keine Hänger.

_Quelle:_ evidenz/1B/messung/2026-11-16-lauf-breaker-f1-summary.json, evidenz/1B/messung/2026-11-16-lauf-breaker-l3-summary.json (Commit 7c64dd6a, je 4 Aufträge ohne Pause und ohne Live-Last, Budget 90.000 ms, Fake-Verzögerung 130.000 ms) · i7-10700K, Hyper-V, ohne CPU-Pinning; arsnova-1b-app 2 vCPU/4 GiB, arsnova-1b-llm 8 vCPU/10 GiB · Code am HEAD: apps/backend/src/lib/openWeightLlmClient.ts:183–190 (classifyCaughtError, Z. 188 aborted vor timeout), :476–478 (failureCountsForCircuit), openWeightLlmConfig.ts:9–10 (3 Fehler, 30.000 ms), qaSummaryQueue.ts:259–269 (runWithQueueTimeout, abort QA_SUMMARY_TIMEOUT); interner Status nicht ausgelesen (breaker-l3-summary.md), das Protokoll nennt die Funktion processWithTimeout, gemeint ist runWithQueueTimeout · Prüfung durch den Autor: 2026-11-16

## M3 Kein Live-Fehler, aber nicht latenzneutral (60 s, kumuliert 12:30, **Kurzfassung** 10:20)

**Stichpunkte**

- p95 je Störreihe gegen den Stopp desselben Auftrags, Regel +10 %
- Summary: Slot belegt, DROP, zu spät reißen die Regel
- [Weiter] Label: schon normal; DROP Tempo +128 %; Netz +500 ms, Zu spät halten (n = 3)
- 0 Fehler bei 166.400 Aktionen; seriell, Ursache offen
- Netz bei Labels 8,7 ms = 0,25 % (wie Jonas)

**Fließtext**

Und die Live-Aktionen? Die Tabelle zeigt das p95 jeder Störreihe gegen den Stopp desselben Auftrags, so war es vorab festgelegt. Bei Summaries reißen belegter Slot, DROP und die späte Antwort die Zehn-Prozent-Regel bei mindestens einer Aktion. [Weiter] Bei Labels schon der Normalbetrieb, beim Beitritt um +17 %; am stärksten DROP beim Tempo mit +128 %. Gehalten wird die Regel nur in 2 kleinen Reihen mit je drei Aufträgen. Gescheitert ist keine einzige Aktion: 0 Fehler bei 166.400. Die Reihen liefen nacheinander auf einem Rechner, eine Ursache kann ich nicht belegen. Das Netz selbst kostet bei Labels 8,7 Millisekunden, also 0,25 Prozent; das bestätigt Jonas' Ergebnis für einen zweiten Auftrag.

_Quelle:_ evidenz/1B/messung/2026-11-15-lauf-f1-summary.json.gz (Commit 5e758d0a, n = 10); evidenz/1B/messung/2026-11-16-lauf-busy-summary.json.gz (Commit 2b39b9df, n = 10); evidenz/1B/messung/2026-11-16-lauf-f2-summary.json.gz (Commit 2b39b9df, n = 5); evidenz/1B/messung/2026-11-16-lauf-l3-summary.json.gz (Commit 2b39b9df, n = 10); evidenz/1B/messung/2026-11-16-lauf-f1-label.json.gz (Commit 7c64dd6a, n = 10); evidenz/1B/messung/2026-11-16-lauf-normal-label-01.json.gz + evidenz/1B/messung/2026-11-16-lauf-normal-label-02.json.gz + evidenz/1B/messung/2026-11-16-lauf-normal-label-03.json.gz (Commit 7c64dd6a, n = 30); evidenz/1B/messung/2026-11-16-lauf-l1-label-01.json.gz + evidenz/1B/messung/2026-11-16-lauf-l1-label-02.json.gz (Commit 7c64dd6a, n = 20); evidenz/1B/messung/2026-11-16-lauf-l2-label.json.gz (Commit 7c64dd6a, n = 3); evidenz/1B/messung/2026-11-16-lauf-l3-label.json.gz (Commit 7c64dd6a, n = 3); evidenz/1B/messung/2026-11-16-lauf-f2-label.json.gz (Commit 7c64dd6a, n = 3) · i7-10700K, Hyper-V, ohne CPU-Pinning; arsnova-1b-app 2 vCPU/4 GiB, arsnova-1b-llm 8 vCPU/10 GiB · p95 gepoolt über alle Fenster und Teilreihen (fasseLaufzeitenZusammen), Referenz je Consumer der eigene Stopp (B0/F1); Summary-Störreihen auf 2b39b9df gegen F1 auf 5e758d0a (versionsübergreifend, Produktionscode unverändert, automatischer Vergleich meldet MANIFEST_MISSING_OR_DIFFERENT); Label auf 7c64dd6a; Summary-Normal nicht im Raster (Protokoll rechnet nur F1 gegen Normal) · Transport: evidenz/1B/messung/2026-11-16-transportauswertung.json (Analyse-Commit 7c64dd6a, 30 Label-Normalaufträge) · über der Regel: Slot belegt/summary, DROP/summary, Zu spät/summary, Normal/label, Netz +50 ms/label, DROP/label · Prüfung durch den Autor: 2026-11-16

## M4 Zweiter Host: Betriebsfrage, nicht Tempo (55 s, kumuliert 13:25, **Kurzfassung** 11:15)

**Stichpunkte**

- S1: App-Stack auf der LLM-VM, je 3 Aufträge, gleiche Last
- Label reißt Beitritt und Quiz, Summary hält alle; 0 Fehler
- Kein Tempovorteil belegt; S1 mit anderer Kapazität
- [Weiter] ADR 1B-020: Rolle bleibt, betrieblich begründet
- Kosten qualitativ; Fristen je Host, Ersatzgründe überwachen, Hänger ≠ Breaker

**Fließtext**

Für Schritt 4 habe ich den App-Stack auf die LLM-VM gelegt, alles auf einem Host, je drei Aufträge unter derselben Last. Gegen zwei Hosts reißen Labels die Regel bei Beitritt und Quiz, Summaries halten alle vier Aktionen; Fehler gab es keine. Ein Tempovorteil für einen der beiden Aufbauten folgt daraus nicht, zumal S1 andere Kapazität hatte. [Weiter] Deshalb begründet ADR 1B-020 die zweite Rolle betrieblich: Ressourcen, Wartung und Zuständigkeit getrennt. Die Kosten sind ein zweites System mit eigenem Deployment, Token-Rotation, Überwachung und bei Schutzbedarf TLS; bewertet habe ich sie qualitativ, nicht in Stunden. Daraus folgt: Fristen je Host kalibrieren, Ersatzgründe überwachen und Hänger nicht dem Breaker überlassen.

_Quelle:_ evidenz/1B/messung/2026-11-16-lauf-s1-label.json.gz (Commit 4b135fe8, n = 3); evidenz/1B/messung/2026-11-16-lauf-s1-summary.json.gz (Commit 4b135fe8, n = 3) · i7-10700K, Hyper-V, ohne CPU-Pinning · S1 auf llm-host (8 vCPU, App-CPUs 0,1, Encoder 2 CPUs, http, Treiber auf llm-host) gegen Zwei-Host-Normal (Label evidenz/1B/messung/2026-11-16-lauf-normal-label-01.json.gz + evidenz/1B/messung/2026-11-16-lauf-normal-label-02.json.gz + evidenz/1B/messung/2026-11-16-lauf-normal-label-03.json.gz (Commit 7c64dd6a, n = 30); Summary evidenz/1B/messung/2026-11-15-lauf-normal-summary.json.gz (Commit 5e758d0a, n = 10)), Kriterium nur beschreibend (1B-3u4-Planung.md, Nachtrag S1, Commit 4b135fe8); 0 Fehler bei 9.600 Aktionen · Entscheidung und Aufwand: adr/1B-020-zweite-rolle-betrieblich-begruenden.md (qualitativ, keine Stunden, Preise oder Energie) · Prüfung durch den Autor: 2026-11-16

## G9 Zweiter Host: kaum Zeitkosten, keine Live-Fehler (45 s, kumuliert 14:10, **Kurzfassung** 12:00)

**Stichpunkte**

- Jonas: Kontextpfad hält, zweiter Host kostet keine Zeit, Zeit steckt in der Inferenz; Gate verwirft alle geprüften Antworten
- Niklas: App-Host trägt die Live-Last, spaCy ohne Freigabe
- Niklas 1B: Ersatz immer, kein Live-Fehler; nicht latenzneutral, Breaker hilft nicht bei Hängern; Host betrieblich begründet
- Gemeinsam: Trennung kostet kaum Zeit, Störung wird kein Live-Fehler; Grenzen: Inferenz, Option ohne Nutzen, Aufwand qualitativ

**Fließtext**

Zum Schluss unsere Antwort auf die gemeinsame Leitfrage. Jonas hat gezeigt: Der Kontextpfad hält seine Zusagen, der zweite Host kostet keine relevante Zeit, und die Zeit steckt in der Inferenz; nach Version 1.4.0 besteht aber keine geprüfte Modellantwort das Gate. Mein Teil: Der App-Host trägt die Live-Last fehlerfrei, optionale Analyse bekommt ohne Nutzenbeleg keine Freigabe. Fällt die Inferenz aus oder schweigt sie, kommt der Ersatz, und keine Live-Aktion scheitert; latenzneutral ist das nicht, und Hänger dämpft der Breaker nicht. Den zweiten Host begründen wir deshalb betrieblich, nicht mit Tempo. Gemeinsam heißt das: Im Labor kostet die Trennung kaum Zeit, und Störungen der Inferenz werden nicht zu Live-Fehlern. Die Grenzen liegen in der Inferenz selbst, in optionaler Arbeit ohne Nutzenbeleg und im Betriebsaufwand, den wir nur qualitativ bewertet haben.

_Quelle:_ 1B-ergebnis.md, 1C-ergebnis.md (Kurzantwort, Verlauf 9f230abc); 1A: abgabe/niklas/folien-1a.mjs (N1, N10); 1B Schritte 3–4: abgabe/niklas/folien-1b34.mjs (M1–M4), evidenz/1B/messung/2026-11-1{5,6}-lauf-*.json.gz und Breaker-Folgen (i7-10700K, Hyper-V · 5e758d0a, 2b39b9df, 7c64dd6a, 4b135fe8), adr/1B-020-zweite-rolle-betrieblich-begruenden.md

## GD Danke. Wir freuen uns auf Ihre Fragen. (15 s, kumuliert 14:25, **Kurzfassung** 12:15)

**Stichpunkte**

- „Danke fürs Zuhören.“
- Belege: Repository-Link und QR-Code
- Im Repo: 18,6 h Laborzeit, 326 Tests, 35 ADRs, 50 Hypothesen
- „Wir freuen uns auf Ihre Fragen.“

**Fließtext**

Danke fürs Zuhören. Alle Belege, also Entscheidungen, Protokolle und Messdaten, liegen im Repository hinter diesem Link. Was dort liegt, steht darunter in Zahlen: 18,6 Stunden gewertete Laborzeit, 326 automatisierte Tests, 35 Entscheidungen als ADR und 50 vorab festgelegte Hypothesen. Wir freuen uns auf Ihre Fragen.

_Quelle:_ https://github.com/NiklasSkulll/arsnova.eu/tree/main/docs/referat-thema-1 (Fork, main nach dem Merge); Eintrag weirauch2026c in literatur.mjs; Nachweisumfang: nachweisumfang.md (Kopfzahlen, nachgerechnet von abgabe/jonas/nachweisumfang.mjs)

# Reserve

Nur auf Nachfrage (Taste `r`), keine Zeit im Vortrag.

## RN1 Reserve: Die Regel schlägt auch ohne Wirkung an

**Stichpunkte**

- Nachträglich: gepoolt V2 − V1 = −5,5 bis +0,1 ms
- Streuung je Variante > Effekt (V2 Beitritt 31–58 ms)
- Kontrolle 4/20; wirkungslos besteht nur ≈ 1 %
- Künftig ohne Änderung kalibrieren; hier gilt die Regel

**Fließtext**

Warum schlägt die Regel so oft an? Nachträglich ausgewertet: Gepoolt über alle fünf Blöcke weicht spaCy im Normalbetrieb um −5,5 bis +0,1 Millisekunden von der Basis ab, also praktisch nicht. Die Lauf-p95 streuen innerhalb derselben Variante stärker, beim Beitritt in V2 zwischen 31–58 Millisekunden. Die Kontrolle ohne spaCy verfehlt die Regel 4 von 20 Mal. Wären die Vergleiche unabhängig, bestünde selbst eine wirkungslose Komponente alle 20 nur mit etwa 1 Prozent. Für einen neuen Versuch würde ich die Regel deshalb an einem Vergleich ohne Änderung kalibrieren, für diesen Versuch gilt sie.

_Quelle:_ alle 25 lauf.json (live.actions.<aktion>.latency.durationSamplesMs), Nearest Rank gepoolt; Kontrolle: comparisons[variant=V1]; Unabhängigkeit ist eine grobe Annahme · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (nach v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## RN2 Reserve: Was die Messung nicht zeigt

**Stichpunkte**

- Ein WSL2-Host, Generator auf demselben Host
- Beitrittswelle, synthetischer Korpus; kein Rendering, kein LLM
- Stand nach v1.4.0, Freigabe des Prüfers (E-Mail 04.11.)
- KI: Codex für Werkzeuge und Auswertung; Messung und Deutung bei Niklas

**Fließtext**

Falls nach Gültigkeit oder Eigenanteil gefragt wird. Alle Zahlen gelten für dieses Labor: ein WSL2-Rechner mit dem Lastgenerator auf demselben Host, eine Beitrittswelle, ein synthetischer Korpus. Über Rendering, die Kompassanzeige und ein LLM sage ich nichts. Gemessen habe ich einen Stand nach Version 1.4.0, weil der Prüfer das Aktualisieren des Forks freigegeben hat. Werkzeuge, Tests und Auswertung hat Codex umgesetzt; Auftrag, Labor, Messung, Freigaben und die Deutung sind meine.

_Quelle:_ 1A-auswertung.md (Grenzen), 1A-eigenanteil.md, 00-rahmen-und-pruefung.md (Freigabe des aktuellen main) · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (nach v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…

## RN4 Reserve: spaCy bleibt im Budget, bis CPU fehlt

**Stichpunkte**

- V2: ≈ 18 % einer CPU, < 1 % gedrosselt, ≈ 480 MiB
- V3: 20–24 % bei Quote 25 % → 88–96 % gedrosselt
- Bild: je 100-ms-Takt nur ein Viertel rechnen; fast immer aufgebraucht
- Reserve im Labor: < 0,5 CPU von 16, ≥ 11,6 GiB frei
- Reserve groß, schützt Latenz aber nicht; 8-vCPU-Zielhost nicht gemessen

**Fließtext**

Links gedrosselte CPU-Perioden, rechts die Speicherspitze. Im Normalbetrieb braucht spaCy rund 18 Prozent einer CPU, wird in unter einem Prozent der Perioden gedrosselt und kommt auf etwa 480 Mebibyte, weit unter der Schwelle. Gedrosselt auf ein Viertel CPU verbraucht es fast die ganze Quote. Als Bild: Der Kernel teilt die Zeit in Takte von hundert Millisekunden, und spaCy darf in jedem Takt nur ein Viertel davon rechnen. In 88–96 Prozent der Takte war dieses Viertel aufgebraucht, bevor die Arbeit fertig war; spaCy wartete fast immer auf den nächsten Takt. Zur Reserve: Alle Container zusammen brauchten weniger als eine halbe CPU von sechzehn, mindestens 11,6 Gibibyte blieben frei. Das schützt die Latenz nicht automatisch; den Zielhost habe ich nicht gemessen.

_Quelle:_ evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json runs[].resources[alias=spacy] (cpuPercent, throttledPeriodRatio aus cpu.stat, lifetimePeakMemoryBytes aus memory.peak, oomKillDelta), runs[].resources[].cpuPercent (Summe je Lauf), runs[].collectorHost.minAvailableMemoryBytes; Takt von cpu.max: Kernel-Doku cgroup v2, Abschn. „CPU Interface Files“ (Standard „max 100000“, also 100 ms) · Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2 (Kernel 6.18.58.1-microsoft-standard-WSL2), 16 logische CPUs, Lastgenerator auf demselben Rechner · App-Commit a19ca70f (nach v1.4.0) · Auswertung SHA-256 a3bebdf236cfb3b6…
