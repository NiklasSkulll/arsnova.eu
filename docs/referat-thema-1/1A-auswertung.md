# A1-Auswertung und Betriebsentscheidung

**Stand:** 12.11.2026. **Auftrag:** [Issue #6](https://github.com/NiklasSkulll/arsnova.eu/issues/6).
Maßgeblich sind der unveränderte [Versuchsvertrag, Version 2](./1A-experiment-contract.md)
und die [vollständige Reihe vom 12.11.2026](./evidenz/1A/reihe-2026-11-12/).

## Entscheidung

**Für die untersuchte Freigabe bleibt `NLP_ENABLED=false` die begründete Gegenalternative.**
Der normale spaCy-Pfad erfüllt Analyse-, Drosselungs-, Speicher- und OOM-Regeln,
aber die relativen Live-Grenzen werden nicht in allen fünf Wiederholungen
eingehalten. Deshalb sind H1 und H2 nach dem vorab vereinbarten Vertrag nicht
bestätigt. Niedrige absolute Latenzen rechtfertigen keine nachträgliche Änderung
der Regeln.

Das ist eine Entscheidung für dieses Lastprofil und Labor, kein Nachweis einer
generellen spaCy-Unverträglichkeit. Insbesondere ist die Ursache der sehr
niedrigen V1-Baseline in Block 1 nicht zugeordnet.

## Nachweiskette und Reproduktion

1. **Anwendung:** unveränderter Fork-`main`-Commit
   `8f91e0417bc5aace461c3644a0b6b26c9284035b`, Version 1.4.0; Freigabe des
   eigenen Rechners und des aktuellen `main` gemäß Issue #6, Stand 10.11.2026.
2. **Vorabentscheidung:** Hypothesen und Schwellen im Versuchsvertrag; dessen
   SHA-256 steht unverändert in allen Laufmanifesten.
3. **Eingaben:** gemeinsame Fixture mit Seed `438314513`, Hash
   `da24eeb3db1f7e08399583f527bf5f889ccb98cddd67fd0be84ec0e4dea17ded`;
   fünf getrennte Analysesessions mit je 500 zulässigen Fragen, drei
   Ausschlusskontrollen und 200 Bezugsteilnehmenden.
4. **Ausführung:** fünf randomisierte Blöcke mit jeweils V0–V4; 25 vollständige
   Läufe, je 60 Sekunden Aufwärmung und 300 Sekunden Messfenster. Die vorher
   abgebrochene Reihe und die Vorläufe werden nicht eingemischt.
5. **Messwerte:** je Aktion erfolgreiche und fehlgeschlagene Roh-Laufzeiten,
   geplante Arbeit, Analyse-Einzelaufrufe und 50 komprimierte Ressourcenartefakte.
6. **Auswertung:** [JSON](./evidenz/1A/auswertung/auswertung.json),
   [vollständige Tabellen](./evidenz/1A/auswertung/auswertung.md) und
   [80 Aktionsvergleiche als CSV](./evidenz/1A/auswertung/live-vergleiche.csv).
   Eingabeprüfsummen und Auswertungscode-Hash sind im JSON enthalten.

Mit Node aus `.nvmrc` und installierten Projektabhängigkeiten:

```bash
nvm use
npm run load:resource-isolation:evaluate -- --validate
npm run load:resource-isolation:evaluation:test
npm run load:resource-isolation:evaluate -- \
  --run \
  --evidence-root docs/referat-thema-1/evidenz/1A/reihe-2026-11-12 \
  --output-dir /tmp/arsnova-1a-auswertung-neu
```

Der Ausgabeordner muss neu sein. Der Evaluator liest ausschließlich Nachweise,
prüft beide Phasen jedes Laufs einschließlich gzip-Prüfsummen, Identitäten,
Schaltern, Lastprofil, Containergenerationen und Korpusnachweisen und startet
weder Docker noch Last. Ungültige oder unvollständige Eingaben führen zu
Exitcode 1; gültig erfasste Grenzverletzungen bleiben dagegen ein reguläres
Auswertungsergebnis mit Exitcode 0. Die Ausgabedateien werden mit der
Projektformatierung geschrieben.

## Nachtrag zur Compose-Nachweiskette

Bei der Abschlussreview wurde festgestellt, dass die ursprünglichen Manifeste
nur ausgewählte wirksame Einstellungen und den Hash der Baseline-Compose-Datei
enthalten. Eine während der Messung gespeicherte aufgelöste Compose-Ausgabe
fehlt. Der [Nachtrag vom 13.11.2026](./evidenz/1A/compose-rekonstruktion/README.md)
rekonstruiert fünf Varianten aus eingefrorener Baseline, Aufbauhelfer und
Image-IDs, löst sie mit der heute verfügbaren Compose-Version auf und gleicht
aufgezeichnete Einstellungen gegen alle 25 Laufmanifeste ab.

Die Rekonstruktion ist keine damalige Aufnahme; nicht aufgezeichnete
Einstellungen werden dadurch nicht rückwirkend bestätigt. Dieser verbleibende
Nachweisunterschied ist vor einer vollständigen Abnahme ausdrücklich zu
bewerten. Die Messdaten und die folgenden Ergebnisse bleiben unverändert.

## Systemgrenzen und Labor

| Bestandteil             | Einordnung im untersuchten Aufbau                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Anwendung               | Backend und ausgelieferte SPA; unter anderem Datenzugriff, Wortwolkenaggregation und Kontextaufbau im Backend-Prozess |
| PostgreSQL und Redis    | Datenhaltung beziehungsweise Cache-/Koordinationsdienst; eigene Container ohne zusätzliche CPU-/RAM-/PID-Limits       |
| PDF-Worker              | Separater Dienst, im Labor aktiv; 1 CPU, 1 GiB, 128 PIDs; keine PDF-Last während der Messungen                        |
| spaCy                   | Eigener Unix-Socket-Sidecar zur Lemmatisierung; regulär 1 CPU, 1 GiB, 64 PIDs, kein eigenes Netzwerk                  |
| Q&A-Klassifikation 8.9b | In-Process-Klassifikationspfad im Backend, hier mit `QA_NLP_ENABLED=false` abgeschaltet                               |
| Encoder                 | Eigener Embedding-Sidecar; im Vergleich nicht gestartet                                                               |
| Generative Inferenz     | Nach ADR-0035 eigene private Serverrolle; nicht Gegenstand dieses spaCy-Versuchs                                      |

Der Dockerhost meldete Ubuntu 24.04.5 LTS unter WSL2, 16 logische CPUs,
16.720.453.632 Byte RAM, Docker 29.9.2 und cgroup v2. Der Node-24.18.0-Generator
lief auf demselben Rechner außerhalb der Container. Ressourcen wurden unter
dem eigenen Compose-Projekt `arsnova-1a` mit eigenen Volumes und Netzwerken
angelegt; Anwendungsports waren nur lokal erreichbar. Der
[Laboraufbau](./1A-versuchsreihe.md) beschreibt Images, konstante Schalter,
Vorbereitung und überprüften Rückweg.

Ein CPU-Limit ist eine Obergrenze des Sidecars und reserviert keine CPU-Zeit
für die unbegrenzte App. Ebenso ist ein RAM-Limit keine zugesicherte freie
Hostreserve. Die Messung kann Rückwirkungen zeigen, aber eine Latenzänderung
nicht allein einem einzelnen Prozess zuordnen.

## Live-Aktionen und Hypothesen

Alle 40.000 geplanten Live-Aktionen wurden im Messfenster erfolgreich erfasst:
je 12.500 Beitritte, Quiz- und Tempostimmen sowie 2.500 Q&A-Einreichungen.
Es gab keine fehlgeschlagenen Versuche oder fehlenden geplanten Aktionen.
Der größte Quiz-p95 eines einzelnen Laufs beträgt rund 48,07 ms und liegt
unter dem absoluten Versuchsziel von 1000 ms.

| Vergleich               | Aktionsvergleiche | Verfehlungen | Betroffene Fälle                                    |
| ----------------------- | ----------------- | ------------ | --------------------------------------------------- |
| V0 → V1                 | 20                | 3            | Q&A in Block 1 und 2, Tempo in Block 3              |
| V1 → V2, H1             | 20                | 4            | Beitritt, Quiz und Tempo in Block 1; Q&A in Block 5 |
| V1 → V3 und V1 → V4, H2 | 40                | 6            | Je Beitritt, Quiz und Tempo in Block 1              |

Alle 13 Verfehlungen betreffen die relative 10-%-Grenze; sämtliche absoluten
50-ms-Grenzen bestehen. Die jeweiligen Fehler- und Abdeckungsregeln bestehen
ebenfalls. Die Prüfung erfolgt vor Rundung für Tabellen und PDFs.

Beispiel Beitritt in Block 1: V1 hat p95 rund 24,57 ms, V2 rund 52,38 ms.
Die Differenz von rund 27,80 ms entspricht rund 113,15 % und verfehlt somit
die relative Regel. In Block 5 beträgt der zusätzliche V2-Q&A-p95 rund
5,50 ms beziehungsweise 26,18 %. Der H1-Befund hängt daher nicht ausschließlich
an Block 1.

Die besonders niedrigen V1-Werte im ersten Block werden nicht als Ausreißer
entfernt. Auch die V0→V1-Ergebnisse liefern keinen Beleg für einen konstanten
kausalen Aufschlag durch Analysearbeit. Die fünf Einzelwiederholungen und
ihre Spannweite bleiben maßgeblich; weder Mittelwerte von p95-Werten noch
ein einzelner gepoolter p95 ersetzen die gepaarten Regeln.

## Analyseverfügbarkeit und Störungsinterpretation

Verfügbarkeit meint hier einen erfolgreichen **LEMMA-Abschluss innerhalb des
Messfensters**. Eine korrekte lexikalische Fallbackantwort ist keine
Lemmatisierung, kann aber weiterhin eine nutzbare Wortwolke liefern.

| Variante | Geplant | LEMMA-Erfolg | Fallback | Am Fensterende offen | p95-Spannweite abgeschlossener Antworten |
| -------- | ------- | ------------ | -------- | -------------------- | ---------------------------------------- |
| V1       | 750     | 0            | 750      | 0                    | Lexikalisch: 39,32–44,88 ms              |
| V2       | 750     | 750          | 0        | 0                    | LEMMA: 489,09–510,51 ms                  |
| V3       | 750     | 749          | 0        | 1                    | LEMMA: 2382,32–3185,24 ms                |
| V4       | 750     | 0            | 745      | 5                    | Fallback: 5048,95–5058,46 ms             |

V2 erfüllt die höchstens 1 % unverfügbaren geplanten Analysen in allen fünf
Wiederholungen. Offene Aufrufe bleiben auch bei einem späteren Erfolg im
Auslauf unverfügbar. V3/V4 werden als Störungen gesondert interpretiert;
eine unbrauchbar gewordene Analyse wird nicht mit guter Live-Isolation
gleichgesetzt.

V4 verzögert die **Weiterleitung**, nicht eine schon laufende Berechnung.
Alle fünf Proxy-Lebenszeitzähler zeigen `forwarded: 0`; ankommende
Normalisierungsanfragen wurden vor Ablauf der 6000 ms abgebrochen. Die
Zähler umfassen jeweils auch die Aufwärmung und sind keine ausschließlich
auf das Messfenster beschränkten Mengen.

Die 745 V4-Fallbacks zerfallen in 495 `TIMEOUT` und 250
`SIDECAR_UNAVAILABLE`. Der geprüfte Client begrenzt gleichzeitig laufende
Sidecar-Anfragen auf zwei; sein Fehler `BACKPRESSURE` wird im Normalisierer
ebenfalls auf `SIDECAR_UNAVAILABLE` abgebildet. Der Fallbackgrund allein
belegt daher keinen Sidecar-Ausfall. Der Backend-Zähler `sidecarCalls`
belegt auch keine entsprechende Zahl tatsächlich weitergeleiteter Inferenzaufträge.
V4 untersucht Timeout, Rückstau und Ersatzpfad, nicht eine ressourcenintensive
langsame spaCy-Berechnung.

## Ressourcenbudget

| spaCy-Messwert                                     | V2, normal    | V3, 0,25 CPU  | V4, Verzögerung |
| -------------------------------------------------- | ------------- | ------------- | --------------- |
| Mittlere CPU-Nutzung im Fenster, % einer CPU       | 18,67–19,11   | 23,27–24,06   | 0,52–0,55       |
| Gedrosselte Perioden, Anteil in %                  | 0,68–0,89     | 91,35–96,34   | 0               |
| Lebenszeit-RAM-Peak, MiB einschließlich Aufwärmung | 479,87–480,89 | 491,14–493,21 | 463,59–784,80   |
| OOM-Zuwachs                                        | 0             | 0             | 0               |

CPU-Werte sind zeitbezogene Zählerdifferenzen über das Fenster; sie sind keine
Spitzenwerte einzelner Abtastpunkte. Drosselungsanteile verwenden den Zuwachs
von `nr_throttled` geteilt durch den positiven Zuwachs von `nr_periods`.
Speicherpeaks werden nicht subtrahiert; das abgetastete Fenstermaximum und der
Lebenszeit-Peak bleiben im JSON getrennt.

Das V2-Budget von höchstens 819,20 MiB beziehungsweise 80 % des wirksamen
1-GiB-Limits besteht in allen fünf Läufen; ebenso die höchstens 5 % gedrosselten
Perioden. Kein gemessener Dienst weist einen OOM-Kill-Zuwachs auf.

Die übrigen Container wurden ebenfalls erfasst; beispielhaft die V0/V1/V2-Spannweiten:

| Dienst     | Mittlere CPU V0 / V1 / V2, % einer CPU | Lebenszeit-RAM-Peak V0 / V1 / V2, MiB         |
| ---------- | -------------------------------------- | --------------------------------------------- |
| App        | 10,81–11,42 / 9,76–11,52 / 11,98–12,58 | 329,40–427,36 / 479,00–561,54 / 372,25–476,07 |
| PostgreSQL | 4,75–4,98 / 4,71–5,81 / 5,40–5,60      | 184,02–184,88 / 222,11–250,41 / 222,16–223,43 |
| Redis      | 1,55–1,64 / 1,37–1,66 / 1,52–1,57      | 11,10–11,88 / 11,49–11,90 / 11,60–11,91       |
| PDF-Worker | 1,30–1,33 / 1,29–1,32 / 1,26–1,30      | 142,38–143,97 / 142,24–287,22 / 142,00–144,27 |

Weitere Werte für V3/V4 stehen vollständig im JSON. Lebenszeit-Peaks
verschiedener Dienste müssen nicht gleichzeitig auftreten und werden nicht
als gemessene gemeinsame Hostspitze addiert. Das kleinste abgetastete
`MemAvailable` des Collector-Hosts lag bei rund 9,75 GiB; auch dies ist ein
beobachteter Zustand, keine garantierte Kapazität für zusätzliche Dienste.

## Einsatzgrenze, Aufwand und Rückweg

- **Aktivierung:** Für diese Freigaberegel bleibt die Lemmatisierung aus.
  Die lexikalische Wortwolke vermeidet den Sidecar-Betrieb und bleibt die
  ernsthafte Alternative; sie führt Flexionsformen nicht im selben Umfang zusammen.
- **Budget weiterer Laborversuche:** 1 CPU, 1 GiB und 64 PIDs sind die
  untersuchte reguläre Konfiguration. Die 0,25-CPU-Variante ist wegen hoher
  Drosselung und längerer Analysezeiten keine belegte gleichwertige Einsparung.
  Ein kleineres RAM-Limit wurde nicht getestet und wird nicht freigegeben.
- **Betriebsaufwand:** Images und Modelle pflegen, Modellstart und Healthcheck
  berücksichtigen, Unix-Sockets zuordnen, Limits, Timeouts, Fallbacks und
  Ressourcen beobachten. Preisbeträge und Nutzen je Euro wurden nicht gemessen.
- **Rückweg im Labor:** Last beenden, Proxy schließen, direkten Socket und
  spaCy-CPU-Limit wiederherstellen, `NLP_ENABLED=false` setzen und App neu
  erzeugen, spaCy stoppen, Basisdienste, lexikalischen Pfad und Live-Beitritt
  prüfen; anschließend ausschließlich eigene Laborressourcen entfernen.

## Gültigkeitsgrenzen und sinnvolle Gegenprüfung

- Ein Generator auf demselben WSL2-Rechner konkurriert mit den Diensten.
  Die Ergebnisse sind kein Nachweis für einen 8-vCPU-Produktionshost.
- Die Last ist eine Beitrittswelle mit später ruhiger Phase, kein durchgehend
  gleichbleibender Live-Verkehr. Gemessene WebSocket-Verläufe bleiben im Laufnachweis.
- API-Antwortzeiten und Signalzustellung messen weder Browser-Rendering noch
  die vollständige Zeit bis zur sichtbaren Moderationskarte oder didaktischen Nutzen.
- Die Fixture enthält 500 unterschiedliche Rohtexte, aber einen bewusst
  kleinen, wiederholten deutschen Wortschatz; keine allgemeine Modellgüte ist geprüft.
- Limits verhindern nicht jede Konkurrenz um Hostressourcen oder Arbeit im
  Backend. Der Versuch isoliert keine einzelne Ursache einer Latenzdifferenz.
- Eine zusätzliche LLM-Rolle, generative Qualität, breite Sprachvielfalt und
  Produktions-SLOs bei anderer Last oder längeren Fehlerfenstern sind nicht belegt.

Ein zusätzlicher Versuch mit externer Lasterzeugung und dokumentierter
Zielhardware könnte insbesondere die niedrige V1-Baseline gegenprüfen.
Das wäre eine neue, gesondert gekennzeichnete Reihe, keine nachträgliche
Entfernung oder Ersetzung der vorliegenden Ergebnisse.

## Abschlussunterlagen

- [Handout und Folien als PDF sowie Quellen](./abgabe/README.md).
- [Eigenanteil und Anforderungsabgleich](./1A-eigenanteil.md).
- [Historisches Prüfprotokoll](./evidenz/1A/auswertung/pruefungen.json) und
  [historischer Nacharbeitsstand](./evidenz/1A/nacharbeit/pruefungen.json);
  nach dem Verwerfen sachfremder Korrekturen gilt die
  [Bereinigungsprüfung](./evidenz/1A/bereinigung/README.md).
- [Vorbereitete vollständige PR-Beschreibung](./1A-pr-beschreibung.md).
- [Persönliche Gegenprüfung, KI-Aufträge und Übergabe](./1A-abschluss-und-uebergabe.md).
- [Technische Abschlussnacharbeit](./evidenz/1A/nacharbeit/README.md).

Die PDFs sind ausdrücklich Abgabeentwürfe. Persönliche Gegenprüfung,
fachliche Freigabe, institutionelle Zitierregeln, erlaubter KI-Umfang und
Abgabeformalitäten müssen durch Niklas bestätigt werden. Commit, Push und
PR-Merge werden durch diesen Schritt nicht ausgeführt.
