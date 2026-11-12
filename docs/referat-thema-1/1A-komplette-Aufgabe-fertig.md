# Aufgabe 1A - Ressourcenisolation auf dem Anwendungshost

## Übersicht

Aufgabe 1A untersucht, wie sich die optionale spaCy-Analyse auf die Ressourcen und Live-Aktionen des Anwendungshosts auswirkt.
Im Mittelpunkt stehen Beitritt, Quizstimme, Q&A-Einreichung und Tempostimme beziehungsweise Blitzlicht.
Dafür vergleichen wir dieselbe Live-Last ohne Analyse, mit lexikalischer Analyse sowie mit normalem, CPU-gedrosseltem und gezielt verzögertem spaCy-Pfad.
Wir ergänzen reproduzierbare Testdaten und Messwerkzeuge und untersuchen damit einen festgehaltenen, unveränderten Anwendungsstand.
Hypothesen, Lastprofil, Wiederholungen und Grenzwerte werden vor den Messungen festgelegt.
Aus den Messungen soll anschließend eine begründete Betriebsentscheidung entstehen: spaCy unter den untersuchten Bedingungen zulassen oder mit `NLP_ENABLED=false` bei der lexikalischen Wortwolke bleiben.

**Stand: 12.11.2026 — Schritte 1–6 abgeschlossen; Schritt 7 noch offen.**
**Grundlage:** [Umsetzungsplan](./1A-umsetzungsplan.md) und [Versuchsvertrag](./1A-experiment-contract.md).
**Dateiangaben:** »Neu« und »bearbeitet« beziehen sich auf den jeweiligen Umsetzungsschritt, nicht auf den aktuellen Git-Status.

Alle folgenden Befehle gelten für das Repository-Wurzelverzeichnis mit installierten Projektabhängigkeiten; vor CLI-Aufrufen die Node-Version auswählen und Shared-Types bauen:

```bash
nvm use
npm run build -w @arsnova/shared-types
```

## 1 Versuchsvertrag festhalten

### 1.1 Übersicht

Vor der Implementierung wurden Fragestellung, Hypothesen, Gegenalternative und Entscheidungsregeln dokumentiert.
Der Vertrag legt fünf Pflichtvarianten, fünf Wiederholungen je Variante und ein gemeinsames Lastprofil fest.
Zu den Regeln gehören je Live-Aktion höchstens 10 % und zugleich höchstens 50 ms p95-Anstieg gegenüber V1 sowie eine Fehlergrenze von 0,5 %.
Die zunächst offene Labor- und Baseline-Auswahl wurde vor den Messungen in Schritt 6 auf den eigenen Rechner und einen konkreten Fork-`main`-Commit festgelegt, ohne die Schwellen zu ändern.

### 1.2 Änderungen am Projekt

- [docs/referat-thema-1/1A-experiment-contract.md](./1A-experiment-contract.md) — **neu, später in Schritt 6 bearbeitet:** Verbindlicher Versuchsvertrag mit Hypothesen, Daten, Lastprofil, Grenzwerten, Nachweisanforderungen und Rückweg zur Baseline.
- [docs/referat-thema-1/1A-umsetzungsplan.md](./1A-umsetzungsplan.md) — **neu:** Hält die Ausgangsanalyse und die sieben vereinbarten Umsetzungsschritte fest; die damaligen offenen Punkte sind als historischer Planstand zu lesen.
- [docs/referat-thema-1/README.md](./README.md) — **bearbeitet:** Verlinkt den Versuchsvertrag im Themenordner.

### 1.3 Durchführung

```bash
npx prettier --check docs/referat-thema-1/1A-experiment-contract.md
```

Prüft die Formatierung des Vertrags; die fachlichen Regeln müssen zusätzlich mit Auftrag und späteren Laufmanifesten abgeglichen werden.
Dieser Dokumentationsschritt führt noch keine Lastmessung durch.

## 2 Gemeinsame Fixture reproduzierbar bereitstellen

### 2.1 Übersicht

Die sechs bestehenden Referenzfragen aus [libs/shared-types/src/moderation-prompt-context-fixtures.ts](../../libs/shared-types/src/moderation-prompt-context-fixtures.ts) wurden wiederverwendet und um Gegenfälle sowie deterministische Füllfragen ergänzt.
Die A1-Projektion enthält 500 analysierbare Fragen und drei zusätzliche Ausschlusskontrollen mit den Status `PENDING`, `ARCHIVED` und `DELETED`.
Die Teilnehmerbezugsgröße der Analysefixture beträgt 200 und ist von den 500 geplanten Live-Beitritten unabhängig.
Seed und SHA-256-Hash machen die Eingaben vergleichbar; die ursprüngliche Referenzfixture für die anderen Teilaufgaben bleibt erhalten.
Die Fixture-Erzeugung arbeitet offline, während der Import in getrennte Laborsessions erst in Schritt 6 erfolgt.

### 2.2 Änderungen am Projekt

- [scripts/load/lib/resource-isolation-fixture.mjs](../../scripts/load/lib/resource-isolation-fixture.mjs) — **neu:** Erzeugt die gemeinsame Fixture und ihre A1-Projektion und berechnet deren kanonischen Inhaltshash.
- [scripts/load/resource-isolation-fixture.mjs](../../scripts/load/resource-isolation-fixture.mjs) — **neu:** CLI zum Validieren und Ausgeben der Fixture ohne Datenbank oder Netzwerk.
- [scripts/load/fixtures/resource-isolation-v1.manifest.json](../../scripts/load/fixtures/resource-isolation-v1.manifest.json) — **neu:** Speichert Version, Standardseed und erwarteten Hash als Referenz für Regressionstests.
- [scripts/load/lib/resource-isolation-fixture.test.mjs](../../scripts/load/lib/resource-isolation-fixture.test.mjs) und [scripts/load/resource-isolation-fixture.test.mjs](../../scripts/load/resource-isolation-fixture.test.mjs) — **jeweils neu:** Prüfen Referenzdaten, Gegenfälle, Projektion, Schema-Verträglichkeit, Reproduzierbarkeit und tatsächliche CLI-Ausgaben.
- [docs/referat-thema-1/1A-fixture.md](./1A-fixture.md) — **neu:** Beschreibt Inhalt, Grenzen, Hashbildung und Nutzung der gemeinsamen Testdaten.
- [package.json](../../package.json) — **bearbeitet:** Ergänzt Fixture- und Testbefehle und bindet die Tests in `npm test` und `test:coverage` ein.
- [docs/TESTING.md](../TESTING.md) und [docs/referat-thema-1/README.md](./README.md) — **jeweils bearbeitet:** Dokumentieren Testaufrufe und verlinken die Fixture-Anleitung.

### 2.3 Durchführung

```bash
npm run load:resource-isolation:fixture -- --validate
npm run load:resource-isolation:fixture:test
node scripts/load/resource-isolation-fixture.mjs --print > /tmp/arsnova-1a-fixture.json
```

Validiert die Standardidentität, führt die Fixture-Tests aus und schreibt bei Bedarf die vollständigen synthetischen Eingaben außerhalb des Repositories.
Dabei werden weder Sessions angelegt noch Lastversuche gestartet.

## 3 Live-Messungen in Artillery vervollständigen

### 3.1 Übersicht

Die vorhandenen Artillery-Aktionen wurden um Laufzeitstichproben und eine vollständige Ergebniszählung ergänzt.
Beitritt, Quizstimme, Q&A-Einreichung und Blitzlicht weisen erfolgreiche, fehlgeschlagene, übersprungene, offene und nicht gestartete Arbeit getrennt aus.
Erfolgs- und Fehlerlaufzeiten werden getrennt ausgewertet, einschließlich p50, p95 und p99.
Leere oder widersprüchliche Messungen können die ergänzten Prüfregeln nicht bestehen.
Das zugrunde liegende Profil bleibt eine Beitrittswelle und wird nicht als Nachweis für dauerhaft 500 gleichzeitig aktive Clients ausgegeben.

### 3.2 Änderungen am Projekt

- [scripts/load/artillery/processor.mjs](../../scripts/load/artillery/processor.mjs) — **bearbeitet:** Misst die Live-Aktionen im Lastgenerator und erfasst Ergebnisse sowie Fehlerklassen.
- [scripts/load/lib/artillery-live-messungen.mjs](../../scripts/load/lib/artillery-live-messungen.mjs) — **neu:** Berechnet Aktionszusammenfassungen, Perzentile, Abdeckung und Prüfregeln aus den Rohstichproben.
- [scripts/load/run-artillery-500.mjs](../../scripts/load/run-artillery-500.mjs) — **bearbeitet:** Übernimmt die neuen Messfelder in Report und Gates und beschreibt das tatsächliche Lastprofil.
- [scripts/load/run-artillery-reconnect-500.mjs](../../scripts/load/run-artillery-reconnect-500.mjs) — **bearbeitet:** Nutzt die ergänzte Beitrittsmessung auch im Reconnect-Pfad.
- [scripts/load/artillery/processor.test.mjs](../../scripts/load/artillery/processor.test.mjs) und [scripts/load/lib/artillery-live-messungen.test.mjs](../../scripts/load/lib/artillery-live-messungen.test.mjs) — **jeweils neu:** Prüfen echte Prozessoraufrufe gegen einen lokalen Testserver sowie Zählung, Fehlerfälle, Grenzwerte und Berichte.
- [docs/referat-thema-1/1A-live-messungen.md](./1A-live-messungen.md) — **neu:** Erklärt Messgrenze, Felder, Lastprofil und lokale Prüfung.
- [package.json](../../package.json) — **bearbeitet:** Registriert den Metriktestbefehl und nimmt ihn in die gemeinsamen Testabläufe auf.
- [docs/TESTING.md](../TESTING.md) und [docs/referat-thema-1/README.md](./README.md) — **jeweils bearbeitet:** Ergänzen die Befehle und die Verlinkung der Live-Messdokumentation.

### 3.3 Durchführung

```bash
npm run load:artillery:metrics:test
```

Prüft Messinstrumentierung und Fehlerbehandlung mit lokalen Testservern und synthetischen Stichproben.
Für den zeitlich festgelegten gemeinsamen A1-Lastversuch ist der Ablauf aus Schritt 6 maßgeblich, nicht allein der eigenständige Artillery-Runner.

## 4 Gezielte Analyse-Last hinzufügen

### 4.1 Übersicht

Ein eigener Lastgenerator ruft `wordCloud.analyzeQa` über den bestehenden tRPC-Client mit gültigen Host-Tokens auf.
Er verwendet fünf getrennte Analysesessions, damit die Sperre gegen parallele Analysen derselben Session den vorgesehenen Vergleich nicht verfälscht.
Über 300 Sekunden werden insgesamt 150 Termine mit `LEXICAL`, `LEMMA`, `refresh: true` und festem Korpus geplant.
Korpusinhalt und Revisionen werden vor und nach der Messung überprüft; Dauer, Normalisierung, Fallbackgrund und Fehler bleiben je Aufruf sichtbar.
Langsame oder ausgefallene Analysen werden nicht durch nachträgliche Aufrufserien ausgeglichen, sondern als offene, übersprungene oder fehlgeschlagene Arbeit erfasst.

### 4.2 Änderungen am Projekt

- [scripts/load/host-analyze-loop.mjs](../../scripts/load/host-analyze-loop.mjs) — **neu:** CLI und tRPC-Anbindung mit privater Sessionzuordnung, Host-Autorisierung, Korpusprüfung und bereinigtem Report.
- [scripts/load/lib/host-analyze-loop.mjs](../../scripts/load/lib/host-analyze-loop.mjs) — **neu:** Implementiert den festen Zeitplan, Ergebniszählung und begrenztes Auslaufen noch laufender Anfragen.
- [scripts/load/host-analyze-loop.test.mjs](../../scripts/load/host-analyze-loop.test.mjs) und [scripts/load/lib/host-analyze-loop.test.mjs](../../scripts/load/lib/host-analyze-loop.test.mjs) — **jeweils neu:** Prüfen unter anderem Autorisierung, Korpusänderungen, langsame Antworten, Fehler und Signalabbrüche.
- [docs/referat-thema-1/1A-analyse-last.md](./1A-analyse-last.md) — **neu:** Dokumentiert Sessionzuordnung, Zeitplan, Analyseparameter und Interpretation der Ausgaben.
- [package.json](../../package.json) — **bearbeitet:** Ergänzt Analyse- und Testbefehle sowie deren Einbindung in die gemeinsamen Testabläufe.
- [docs/TESTING.md](../TESTING.md) und [docs/referat-thema-1/README.md](./README.md) — **jeweils bearbeitet:** Beschreiben die neuen Prüfungen und verlinken die Anleitung.

### 4.3 Durchführung

```bash
npm run load:resource-isolation:analysis -- --validate
npm run load:resource-isolation:analysis:test
```

Zeigt Fixture und Standardzeitplan ohne Anwendungskontakt und prüft den Generator mit kontrollierter Uhr beziehungsweise lokalem tRPC-Testserver.
Für einen eigenständigen Laborlauf müssen zuvor fünf passende Sessions und eine private Zuordnungsdatei gemäß [Analyseanleitung](./1A-analyse-last.md) existieren:

```bash
REPORT_FILE=/tmp/arsnova-1a-analyse.json \
JUNIT_FILE=/tmp/arsnova-1a-analyse.xml \
npm run load:resource-isolation:analysis -- \
  --run --sessions-file /tmp/arsnova-1a-analysesessions.json
```

## 5 Container-Metriken und kontrollierte Störung ergänzen

### 5.1 Übersicht

Ein lesender Collector erfasst Docker-Statistiken, cgroup-v2-Zähler und ausgewählte Hostwerte als Zeitreihe.
Fehlende Daten, ausgelassene Abtastungen und Containerwechsel bleiben ausdrücklich erkennbar.
Docker-Speicheranzeige, cgroup-Speicher und Lebenszeit-Spitzenwerte werden getrennt behandelt.
Ein Laborproxy verzögert bei V4 die Weiterleitung von `/normalize` um 6000 ms und überschreitet damit das unveränderte Client-Timeout von 5000 ms.
Die Werkzeuge ändern keine Produktionskonfiguration; ihre gemeinsame Steuerung erfolgt in Schritt 6.

### 5.2 Änderungen am Projekt

- [scripts/load/lib/container-metrics.mjs](../../scripts/load/lib/container-metrics.mjs) — **neu:** Liest Docker API, cgroup v2 und Hostwerte und berechnet generationstreue Differenzen und Speicherzusammenfassungen.
- [scripts/load/container-metrics.mjs](../../scripts/load/container-metrics.mjs) — **neu:** CLI für eine konfigurierte Zeitreihe mit JSON-/JUnit-Ausgabe und Abbruchbehandlung.
- [scripts/load/lib/container-metrics.test.mjs](../../scripts/load/lib/container-metrics.test.mjs) — **neu:** Prüft unter anderem Metrikverfügbarkeit, Einheiten, Zählerdifferenzen, Containerwechsel und zeitliche Abtastung.
- [scripts/load/spacy-delay-proxy.mjs](../../scripts/load/spacy-delay-proxy.mjs) — **neu:** Implementiert die kontrollierte Weiterleitungsverzögerung über lokale Unix-Sockets und behandelt Clientabbrüche.
- [scripts/load/spacy-delay-proxy.test.mjs](../../scripts/load/spacy-delay-proxy.test.mjs) — **neu:** Prüft Transport, Timeout, Fehler und Beendigung des Proxys einschließlich des tatsächlichen 5000-/6000-ms-Vertrags.
- [docs/referat-thema-1/1A-container-metriken-und-proxy.md](./1A-container-metriken-und-proxy.md) — **neu:** Beschreibt Laborzugriff, Messgrößen, Einschränkungen und Bedienung beider Werkzeuge.
- [package.json](../../package.json) — **bearbeitet:** Registriert Collector, Proxy und Infrastrukturtests und bindet die Tests in die gemeinsamen Testabläufe ein.
- [docs/TESTING.md](../TESTING.md) und [docs/referat-thema-1/README.md](./README.md) — **jeweils bearbeitet:** Dokumentieren Prüfung und Verwendungszweck.

### 5.3 Durchführung

```bash
npm run load:resource-isolation:metrics -- --validate
npm run load:resource-isolation:delay-proxy -- --validate
npm run load:resource-isolation:infrastructure:test
```

Die Validierungen benötigen keine Container; die Tests verwenden synthetische Docker-/cgroup-Daten und lokale Unix-Sockets.
Für reale cgroup-Werte muss der Collector auf dem Linux-Dockerhost dessen `/proc`- und cgroup-v2-Dateisystem lesen können; einen vorbereiteten Laborlauf beschreibt die [Infrastrukturanleitung](./1A-container-metriken-und-proxy.md).

## 6 Versuchsreihe automatisieren und ausführen

### 6.1 Übersicht

Ein Ablaufskript verbindet Laboraufbau, Fixture-Import, Live-Last, Analyse-Last, Ressourcenmessung und Rückwegprüfung.
Jeder Pflichtlauf erhält frische Container und Datenvolumes, 60 Sekunden Aufwärmung und anschließend ein getrenntes Messfenster von 300 Sekunden.
In der Messphase sind 500 Beitritte über 90 Sekunden, 500 Quizstimmen, 100 Q&A-Einreichungen und 500 Tempostimmen geplant; die Ergebnisfreigabe erfolgt nach festem Plan bei Sekunde 270.
Die vollständige Reihe vom 12.11.2026 umfasst fünf randomisierte Blöcke mit je V0–V4, also 25 aufgezeichnete Messungen mit überprüftem Rückweg.
Live-Prozessor, Analyse-Generator und Collector erzeugen die Rohwerte, aus denen das Ablaufskript bereinigte JSON-/JUnit-Berichte und komprimierte Ressourcenartefakte schreibt.

### 6.2 Änderungen am Projekt

- [scripts/load/run-resource-isolation.mjs](../../scripts/load/run-resource-isolation.mjs) — **neu:** Orchestriert den isolierten Laboraufbau, Vorlauf, Messreihe, Diagnoseauswahl, Nachweisablage und Rückweg zur Baseline.
- [scripts/load/lib/resource-isolation-experiment.mjs](../../scripts/load/lib/resource-isolation-experiment.mjs) — **neu:** Enthält reproduzierbare Blockreihenfolge, Labor-Compose-Projektion, geschützten Fixture-SQL-Import, gemeinsame monotone Uhr und Laufsteuerung.
- [scripts/load/resource-isolation-live.mjs](../../scripts/load/resource-isolation-live.mjs) — **neu:** Führt die vorhandenen Artillery-Aktionen je Phase in einem eigenen Prozess aus und steuert Ankünfte und Ergebnisfreigabe nach dem gemeinsamen Zeitplan.
- [scripts/load/run-resource-isolation.test.mjs](../../scripts/load/run-resource-isolation.test.mjs), [scripts/load/lib/resource-isolation-experiment.test.mjs](../../scripts/load/lib/resource-isolation-experiment.test.mjs) und [scripts/load/resource-isolation-live.test.mjs](../../scripts/load/resource-isolation-live.test.mjs) — **jeweils neu:** Prüfen Ablauf, Isolation, Vorlaufzulassung, Nachweisablage, geplante Live-Last und Abbruchpfade.
- [scripts/load/artillery/processor.mjs](../../scripts/load/artillery/processor.mjs) und [scripts/load/artillery/processor.test.mjs](../../scripts/load/artillery/processor.test.mjs) — **jeweils bearbeitet:** Ergänzen und prüfen einen eingefrorenen Messfenster-Snapshot, damit späte Antworten die Ergebnisse nicht nachträglich verbessern.
- [scripts/load/lib/container-metrics.mjs](../../scripts/load/lib/container-metrics.mjs) und [scripts/load/lib/container-metrics.test.mjs](../../scripts/load/lib/container-metrics.test.mjs) — **jeweils bearbeitet:** Richten Ressourcenzeitstempel am gemeinsamen Phasenstart aus und sichern dies mit einem Regressionstest ab.
- [docs/referat-thema-1/1A-versuchsreihe.md](./1A-versuchsreihe.md) — **neu:** Vollständige Laboranleitung mit Aufbau, Befehlen, Unterbrechung, erneutem Beginn und Abschlussnachweis.
- [docs/referat-thema-1/1A-experiment-contract.md](./1A-experiment-contract.md), [docs/referat-thema-1/1A-fixture.md](./1A-fixture.md) und [docs/referat-thema-1/1A-analyse-last.md](./1A-analyse-last.md) — **jeweils bearbeitet:** Gleichen Baseline, tatsächliches Labor, Fixture-Import und Analysebedingungen mit dem ausgeführten Versuch ab.
- [package.json](../../package.json), [docs/TESTING.md](../TESTING.md) und [docs/referat-thema-1/README.md](./README.md) — **jeweils bearbeitet:** Ergänzen Ablauf-/Testbefehle, Testintegration und Verweise.
- [docs/referat-thema-1/evidenz/1A/README.md](./evidenz/1A/README.md) und die Nachweise unter [docs/referat-thema-1/evidenz/1A/](./evidenz/1A/) — **neu:** Ordnen vollständige Reihe, Vorläufe und unterbrochene Reihe ein und bewahren die tatsächlich aufgezeichneten Daten.

### 6.3 Durchführung

```bash
npm run load:resource-isolation:experiment -- --validate
npm run load:resource-isolation:experiment:test
```

Zeigt den Plan mit 25 Pflichtläufen ohne Dockerzugriff und prüft das Ablaufwerkzeug mit lokalen Testmitteln.
Für eine neue reale Reihe zunächst die Images und eine private Labor-Konfiguration gemäß [Versuchsanleitung](./1A-versuchsreihe.md) vorbereiten und darin `evidenceRoot` auf einen neuen, noch nicht belegten Ordner setzen:

```bash
npm run load:resource-isolation:experiment -- \
  --pilot --config-file /tmp/arsnova-1a-labor.json
npm run load:resource-isolation:experiment -- \
  --run --config-file /tmp/arsnova-1a-labor.json
```

Der Vorlauf muss mit denselben Werkzeugen und Bedingungen vollständig abgeschlossen sein, bevor `--run` startet.
Die Pflichtreihe benötigt mindestens 150 Minuten für Aufwärmung und Messung, zusätzlich Aufbau und Rollback; währenddessen keine Builds, Tests oder anderen Lastversuche ausführen.

### 6.4 Docker-Labor und Varianten

Die oben genannten Werkzeugtests benötigen keine realen Anwendungscontainer; sie arbeiten mit Testservern, Testdateien und Test-Sockets.
Die folgende Umgebung beschreibt die tatsächlich aufgezeichneten Lastversuche, nicht eine zugesicherte Produktionskapazität.

| Bereich            | Tatsächlich verwendeter Stand                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Anwendung          | Unveränderter Fork-`main`-Commit `8f91e0417bc5aace461c3644a0b6b26c9284035b`, Version 1.4.0; eigene Images aus diesem Export                            |
| Dockerhost         | Ubuntu 24.04.5 LTS unter WSL2, 16 logische CPUs, 16.720.453.632 Byte RAM, cgroup v2                                                                    |
| Laufzeit           | Docker Engine 29.9.2; Lastgenerator mit Node 24.18.0 außerhalb der Anwendungscontainer auf demselben Rechner                                           |
| Compose            | Aus `docker-compose.prod.yml` der Baseline abgeleitetes, temporäres Projekt `arsnova-1a` mit eigenen Volumes und Netzwerken                            |
| Dienste            | Anwendung, PostgreSQL 16 Alpine, Redis 7.4 Alpine, PDF-Worker und bei V2–V4 spaCy; Image-IDs in den Laufmanifesten festgehalten                        |
| Ressourcenlimits   | App, PostgreSQL und Redis ohne zusätzliche CPU-/RAM-/PID-Limits; PDF-Worker mit 1 CPU, 1 GiB und 128 PIDs; spaCy regulär mit 1 CPU, 1 GiB und 64 PIDs  |
| Erreichbarkeit     | Anwendungsports ausschließlich lokal auf `127.0.0.1:15300` und `127.0.0.1:15301`; spaCy über Unix-Socket ohne eigenes Netzwerk                         |
| Konstante Schalter | `QA_NLP_ENABLED=false`, `QA_SUMMARY_ENABLED=false`, `WORD_CLOUD_SEMANTIC_ENABLED=false`, `OPEN_WEIGHT_LLM_ENABLED=false`; keine Encoder-/LLM-Dienste   |
| Daten              | Rein synthetisch; Live-Session getrennt von fünf Analysesessions mit jeweils 503 gespeicherten und 500 zulässigen Fragen sowie 200 Bezugsteilnehmenden |

| Variante | Live-Last       | Analyse und spaCy                                                    |
| -------- | --------------- | -------------------------------------------------------------------- |
| V0       | Gleiches Profil | Keine Analyse, spaCy aus                                             |
| V1       | Gleiches Profil | Fünf Analyse-Hosts, spaCy aus, lexikalischer Ersatzpfad              |
| V2       | Gleiches Profil | Wie V1, spaCy mit 1 CPU / 1 GiB aktiviert                            |
| V3       | Gleiches Profil | Wie V2, spaCy auf 0,25 CPU begrenzt                                  |
| V4       | Gleiches Profil | Wie V2, 6000 ms Weiterleitungsverzögerung bei 5000 ms Client-Timeout |

Der optionale Sidecar-Ausfall V5 wurde nicht durchgeführt.
Lastgenerator und Dienste teilen den Host; damit sind weder ein externer Generator noch ein 8-vCPU-Produktionshost nachgewiesen.
Nach jedem Lauf wurde unter anderem `NLP_ENABLED=false` wiederhergestellt und ein regulärer Live-Beitritt geprüft; nach der vollständigen Reihe wurden die eigenen Laborcontainer, Volumes und Netzwerke entfernt.

### 6.5 Ergebnisse finden und prüfen

Die vollständige Reihe liegt unter [docs/referat-thema-1/evidenz/1A/reihe-2026-11-12/](./evidenz/1A/reihe-2026-11-12/).
Die folgenden Dateinamen beziehen sich auf dieses Verzeichnis:

| Datei oder Pfadmuster                                                            | Inhalt und Entstehung                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [plan.json](./evidenz/1A/reihe-2026-11-12/plan.json)                             | Vor dem ersten Lauf erzeugte Blockreihenfolge und Lastparameter mit festem Seed `438314513`.                                                                                                                               |
| `V*/block-*/lauf.json`                                                           | Vom Ablaufskript gespeichertes Manifest mit Live-Rohstichproben, Analyseergebnissen, ausgewählten Diagnosen und Rückwegprüfung; zum Beispiel [V2/block-01/lauf.json](./evidenz/1A/reihe-2026-11-12/V2/block-01/lauf.json). |
| `V*/block-*/ressourcen.json.gz`                                                  | Verlustfrei komprimierte Collector-Zeitreihe mit 151 Abtastpunkten je 300-Sekunden-Messfenster.                                                                                                                            |
| `V*/block-*/aufwaermung-ressourcen.json.gz`                                      | Getrennte Collector-Zeitreihe mit 31 Abtastpunkten je 60-Sekunden-Aufwärmphase.                                                                                                                                            |
| `V*/block-*/report.json` und `report.xml`                                        | Maschinenlesbare Zusammenfassung der Erfassungsvollständigkeit und des Rollbacks.                                                                                                                                          |
| [abschluss.json](./evidenz/1A/reihe-2026-11-12/abschluss.json)                   | Nach Abschluss aller Läufe geschriebener Gesamtnachweis mit Baseline-, Image-, Werkzeug-, Vertrags- und Fixture-Identität.                                                                                                 |
| [erfassungspruefung.json](./evidenz/1A/reihe-2026-11-12/erfassungspruefung.json) | Nachträgliche Dateiprüfung: 25 vollständige Messungen, 50 gültige Ressourcen-Prüfsummen, 3.775 Mess- und 775 Aufwärmstichproben sowie stabile Containergenerationen.                                                       |
| [herkunft.json](./evidenz/1A/reihe-2026-11-12/herkunft.json) und `vorlauf/`      | Begründung des Neubeginns und unverändert übernommene, gesondert gekennzeichnete Vorlaufdaten.                                                                                                                             |

Die erste Reihe vom 11.11.2026 wurde auf Wunsch des Bearbeiters abgebrochen und bleibt separat direkt unter `evidenz/1A/` erhalten.
Ihre sechs vollständigen Läufe und der abgebrochene Lauf V1/block-02 werden nicht mit den 25 Läufen der neuen Reihe vermischt.
Der [Evidenzindex](./evidenz/1A/README.md) ordnet außerdem die Vorläufe und den fehlgeschlagenen Vorabcheck ein und enthält eine ausführbare Integritätsprüfung aller 50 Ressourcenartefakte.

```bash
cat docs/referat-thema-1/evidenz/1A/reihe-2026-11-12/abschluss.json
cat docs/referat-thema-1/evidenz/1A/reihe-2026-11-12/erfassungspruefung.json
gzip -dc docs/referat-thema-1/evidenz/1A/reihe-2026-11-12/V2/block-01/ressourcen.json.gz
```

Zeigt den Gesamtabschluss, die dokumentierte Nachprüfung und beispielhaft eine vollständige Ressourcenzeitreihe.
`complete: true` bestätigt die Erfassung und Rückwegprüfung; die Bewertung der Leistungsgrenzen steht noch aus.

## 7 Auswertung, Abschlussprüfungen und Abgabe

### 7.1 Übersicht

**Dieser Schritt ist noch offen; die nachfolgenden Punkte beschreiben den verbleibenden Arbeitsstand.**
Die fünf vollständigen Blöcke müssen entsprechend dem vorab festgelegten Vertrag gepaart ausgewertet werden: V0 gegen V1 sowie V2, V3 und V4 jeweils gegen V1 desselben Blocks.
Dabei sind Live-Latenzen, Fehler und Abdeckung getrennt von Analyseverfügbarkeit, Fallbacks und Ressourcenverbrauch zu bewerten.
Aus den Einzelbefunden mit ihrer Spannweite und Gültigkeitsgrenze folgen erst die Bewertung von H1/H2 und die Betriebsentscheidung.
Zusätzlich stehen die geplante Erweiterung des Hotpfad-Tests, die abschließenden Projektprüfungen und die Aufbereitung für Handout und Folien einschließlich Eigenanteil und KI-Kennzeichnung aus.

### 7.2 Änderungen am Projekt

- **Bisher keine Implementierung oder Auswertungsdateien aus Schritt 7 erstellt.** Die vorhandenen Rohmessungen aus Schritt 6 sind die Grundlage für die noch zu erstellende Auswertung.
- [apps/backend/src/**tests**/wordCloud.hotpath-isolation.test.ts](../../apps/backend/src/__tests__/wordCloud.hotpath-isolation.test.ts) — **Bearbeitung noch geplant:** Der bestehende Test prüft bereits Vote-, Q&A- und Join-Router; die im Plan vorgesehene Aufnahme von `quickFeedback.ts` ist noch nicht umgesetzt.
- [docs/referat-thema-1/evidenz/1A/](./evidenz/1A/) — **Ergänzungen noch geplant:** Nachvollziehbare Auswertung und begründete Entscheidung anhand der vollständigen Reihe; daraus später Handout und Folien als PDF.
- [.github/pull_request_template.md](../../.github/pull_request_template.md) — **vorhandene Vorlage, noch auszufüllen:** Bei einer späteren PR die vollständige Vorlage verwenden und offene Prüfungen sowie begründete Ausnahmen angeben.

### 7.3 Durchführung

Die folgenden Befehle sind für die Abschlussprüfung vorgesehen und führen für sich keine A1-Hypothesenauswertung durch:

```bash
npm run test -w @arsnova/backend -- src/__tests__/wordCloud.hotpath-isolation.test.ts
npm run test:spacy-sidecar
npm run test:spacy-compose
npm run typecheck
npm test
npm run lint
npm run build:prod
```

Die gezielten A1-Testbefehle aus den Schritten 2–6 gehören bereits zu `npm test`; reale Docker-Lastmessungen werden dadurch nicht gestartet.
Die dokumentierten 77 A1-Tests sowie fünf Sidecar- und zwei Compose-Tests bestanden vor der vollständigen Reihe am 12.11.2026, ebenso Lint und Formatierungsprüfungen.
Der Typecheck scheiterte dort weiterhin mit TS5095 an der unveränderten Backend-Konfiguration; der frühere vollständige Testdurchlauf scheiterte an einem Frontend-Test zur `weightingHint`-Formulierung und wurde für den erneuten Messlauf nicht wiederholt.
Die ergänzende unabhängige Abschlussprüfung von Schritt 6 konnte wegen fehlenden Werkzeugzugriffs der Prüfer nicht stattfinden; der Abschlussstand wurde selbst geprüft.
Diese offenen Punkte und die eigentliche Auswertung bleiben vor dem Gesamtabschluss von Aufgabe 1A zu bearbeiten.
