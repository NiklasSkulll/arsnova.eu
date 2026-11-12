# A1-Versuchsreihe: Labor, Ablauf und Nachweise

Schritt 6 verbindet die Werkzeuge aus den vorherigen Schritten zu einer
ausführbaren Versuchsreihe. Maßgeblich ist der
[Versuchsvertrag, Version 2](./1A-experiment-contract.md); die Grenzwerte wurden
nicht geändert. Ein vollständiger Laufnachweis bedeutet zunächst vollständige
Erfassung und überprüften Rollback. Ob die Hypothesen bestehen, wird erst in
Schritt 7 über die gepaarten Wiederholungen ausgewertet.

## Baseline und tatsächliches Labor

[Issue #6, Stand 2026-11-10](https://github.com/NiklasSkulll/arsnova.eu/issues/6),
bestätigt den eigenen Rechner als Labor und den aktuellen Fork-`main` als
Baseline. Am 2026-11-11 wurde dafür
`8f91e0417bc5aace461c3644a0b6b26c9284035b` abgerufen, Version 1.4.0.
Anwendungs- und spaCy-Images werden aus einem unveränderten Export dieses
Commits gebaut. Der Feature-Branch enthält die Messwerkzeuge; die Anwendung
wird nicht aus diesem Branch gebaut und erhält keinen Messpatch.

Der geprüfte Dockerhost ist Ubuntu unter WSL2 mit cgroup v2, 16 logischen CPUs
und 16.720.453.632 Byte gemeldetem RAM. Lastgenerator, Anwendung und
Hilfsdienste teilen diesen Rechner. Das entspricht weder einem nachgewiesenen
8-vCPU-Produktionshost noch einem externen Lastgenerator; Ergebnisse gelten
zunächst für dieses Labor. Während bestätigender Läufe keine Builds, Tests
oder anderen Lastversuche ausführen. Bereits vorhandene Entwicklungscontainer
werden nicht verändert.

## Ohne Dienste prüfen

Node aus `.nvmrc` verwenden und Shared-Types bauen:

```bash
npm run build -w @arsnova/shared-types
npm run load:resource-isolation:experiment -- --validate
npm run load:resource-isolation:experiment:test
```

`--validate` gibt die 25 Pflichtläufe und das unveränderte Messprofil aus,
ohne Docker, Netzwerk, Zugangsdaten oder Datenbank zu benötigen. Fünf Blöcke
enthalten V0–V4 jeweils einmal. Der Standardseed `438314513` bestimmt die
Reihenfolge reproduzierbar; die Reihenfolge ist kein nachträgliches Ranking
nach gemessener Leistung.

## Images vorbereiten

Baseline außerhalb des Feature-Arbeitsverzeichnisses exportieren. Die folgenden
Befehle verwenden die oben festgehaltene Baseline; einen späteren `main` nicht
innerhalb derselben Reihe einwechseln:

```bash
git fetch origin main
mkdir -p /tmp/arsnova-1a-baseline
git archive 8f91e0417bc5aace461c3644a0b6b26c9284035b \
  | tar -x -C /tmp/arsnova-1a-baseline
docker build \
  --label org.opencontainers.image.revision=8f91e0417bc5aace461c3644a0b6b26c9284035b \
  -t arsnova-1a-app:8f91e041 /tmp/arsnova-1a-baseline
docker build \
  --label org.opencontainers.image.revision=8f91e0417bc5aace461c3644a0b6b26c9284035b \
  -t arsnova-1a-spacy:8f91e041 /tmp/arsnova-1a-baseline/docker/spacy
docker image inspect arsnova-1a-app:8f91e041 --format '{{.Id}}'
docker image inspect arsnova-1a-spacy:8f91e041 --format '{{.Id}}'
```

PostgreSQL und Redis verwenden die Images der Baseline-Compose-Datei. Diese
müssen lokal vorliegen; ihre lokalen Image-IDs werden vor Beginn festgehalten
und für alle Varianten verwendet. Das Skript greift ausschließlich auf den
lokalen Docker-Unix-Socket zu und benötigt lesbaren Zugriff auf dessen echte
`/proc`- und cgroup-v2-Zähler. In einer Sandbox ohne diese Zugriffe ist der
Vorlauf unvollständig. Die Socket-Verzeichnisse müssen für die UID 1000 der
Baseline-Container zugänglich sein; der geprüfte Laborbenutzer hat diese UID.

## Private Laborzuordnung

Eine JSON-Datei außerhalb des Repositories anlegen, beispielsweise
`/tmp/arsnova-1a-labor.json`, mit folgenden Feldern:

| Feld                | Inhalt                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| `labAlias`          | Pseudonym, beispielsweise `eigener-rechner`                            |
| `baselineCommit`    | Vollständiger oben festgehaltener Commit                               |
| `baselineDirectory` | Absoluter Pfad des unveränderten Exports                               |
| `applicationImage`  | Vollständige lokale `sha256:…`-Image-ID der Anwendung                  |
| `spacyImage`        | Vollständige lokale `sha256:…`-Image-ID von spaCy                      |
| `generatorLocation` | `same-host`; dieser Ablauf unterstützt ausschließlich das lokale Labor |
| `orderSeed`         | Optional; Standard `438314513`                                         |
| `evidenceRoot`      | Optional; Standard `docs/referat-thema-1/evidenz/1A`                   |

Das Skript erzeugt eigene zufällige Laborsecrets in einem privaten temporären
Verzeichnis. Es liest weder `.env` noch `.env.production`. Docker-Compose wird
aus der Baseline abgeleitet: eigene Ressourcen im Projekt `arsnova-1a`, keine
festen Produktions-Containernamen, keine Encoder-/LLM-Dienste, eigene Volumes
und nur lokale Ports 15300/15301. Vorhandene A1-Container führen zum Abbruch;
sie werden nicht ungeprüft übernommen oder gelöscht.

Für die reguläre Erstellung getrennter Aufwärm-, Analyse- und Messsessions
verwendet das Labor die Werte aus `.env.production.example`:
`RATE_LIMIT_SESSION_CREATE_PER_HOUR=480` und
`RATE_LIMIT_SESSION_CREATE_GLOBAL_PER_HOUR=2400`. Der niedrigere Code-Fallback
von zehn Sessions pro Stunde reicht für diese Vorbereitung nicht aus. Diese
festen Laborwerte stehen mit den wirksamen Analyseschaltern im Manifest;
Teilnehmerlimits und gemessene Mutationen werden nicht umgangen.

## Vorlauf und bestätigende Reihe

```bash
npm run load:resource-isolation:experiment -- \
  --pilot --config-file /tmp/arsnova-1a-labor.json
npm run load:resource-isolation:experiment -- \
  --run --config-file /tmp/arsnova-1a-labor.json
```

Der Vorlauf umfasst jede Variante einmal mit verkürztem Profil und wird unter
`vorlauf/` getrennt gespeichert. Erst dessen vollständiger Abschluss mit
denselben Anwendungs- und spaCy-Images erlaubt `--run`. Eine neue Reihe darf
keine bestehenden Nachweise überschreiben; für einen Wiederholungsversuch
einen neuen Evidenzordner verwenden und den Zusammenhang dokumentieren.

Je Variante entstehen frische Container und Datenvolumes. Reguläre
tRPC-Prozeduren erstellen Live- und Analysesessions mit gültigen Host-Tokens.
Nur die synthetische Fixture wird direkt in die neue Labordatenbank importiert:
200 Bezugsteilnehmende, 500 zulässige Fragen und drei Ausschlusskontrollen je
Analysesession, einschließlich konsistenter einzelner `QaUpvote`-Datensätze.
Der Import berücksichtigt Datenbanktrigger und stimmt die Zähler abschließend
mit den Einzelbewertungen ab. Er simuliert keine Einreichungsraten und ersetzt
keine API-Messung; gemessene Teilnehmeraktionen verwenden reguläre Capabilities.

Aufwärmung und Messung erhalten getrennte Sessions und Stichproben. Die
Messphase verwendet einen gemeinsamen monotonen Startzeitpunkt, 500 geplante
Beitritte über 90 Sekunden, 300 Sekunden Beobachtung und Ergebnisfreigabe bei
Sekunde 270. Der Lastprozess verwendet die bestehenden Artillery-Funktionen
für die Szenarioaktionen und behält deren Denkzeiten bei. Er vermeidet die
lokale Mehrworker-Verteilung mit gemeinsamer Zustandsdatei. Nicht rechtzeitig
gestartete Szenarien bleiben in der Abdeckung sichtbar; Mutationen werden
nicht automatisch wiederholt.

Fünf getrennte Analysesessions verwenden den Zeitplan aus Schritt 4.
Containermetriken werden alle zwei Sekunden erfasst; ausgewählte numerische
Diagnosen aus `health.stats` und authentifiziertem `health.securityStats`
ergänzen die Messung vor, während und nach dem Fenster. V2–V4 müssen tatsächliche
Sidecar-Aufrufe belegen. V3 setzt 0,25 CPU, V4 den getesteten 6000-ms-Proxy bei
unverändertem 5000-ms-Clienttimeout. Prozess- und Containerwechsel machen einen
Lauf unvollständig; erwartete Fallbacks oder langsame Antworten bleiben Ergebnisse.

## Nachweise und Rückweg

Je Variante und Block enthält `lauf.json` Manifest, Clientstichproben,
Analysezeitplan, Ressourcenverweise, ausgewählte Diagnosen und Rollbackstatus.
Die vollständigen Ressourcenzeitreihen stehen verlustfrei komprimiert in
`ressourcen.json.gz`, Aufwärmdaten in `aufwaermung-ressourcen.json.gz`;
Dateiname und SHA-256 stehen im jeweiligen Verweis. Beispielsweise liest
`gzip -dc ressourcen.json.gz` die unveränderten JSON-Rohwerte. Die Kompression
verhindert, dass wiederkehrende Metrikfeldnamen die Nachweise unnötig aufblähen.
`report.json` und `report.xml` ergänzen einen kompakten maschinenlesbaren
Vollständigkeitsstatus. Unvollständige Läufe stoppen die Reihe und bleiben
erhalten. Der Ablauf erfindet keine Ersatzwerte und wertet Grenzverletzungen
nicht als Grund zum Verwerfen eines Laufs.

`SIGINT` oder `SIGTERM` beendet weitere Arbeit. Noch laufende Arbeit ist
sichtbar und erhält höchstens 60 Sekunden Auslaufzeit; anschließend wird der
Lastprozess beendet. Live-Aktionszähler werden am Fensterende als eigener
Snapshot eingefroren; `afterDrainActions` zeigt spätere Abschlüsse getrennt,
ohne die Erfolgsquote des Messfensters nachträglich zu verbessern.
Der Rollback stoppt den Proxy, stellt direkte Sockets,
1 CPU für spaCy und `NLP_ENABLED=false` wieder her, erzeugt die App neu und
stoppt spaCy. Gesunde Basisdienste und eine reguläre Live-Beitrittsaktion
werden überprüft. Danach werden ausschließlich die eigenen Laborcontainer
und -volumes sowie private temporäre Dateien entfernt.

Die vollständige Pflichtreihe benötigt allein für Aufwärmung und Messfenster
mindestens 150 Minuten, zusätzlich Containerstart, Sessionvorbereitung und
Rollback. Ein bestandener kurzer Vorlauf ersetzt diese Laufzeit nicht.

## Unterbrechung und erneuter Beginn am 2026-11-12

Die erste bestätigende Reihe wurde am 2026-11-11 auf Wunsch des Bearbeiters
abgebrochen. Sechs vollständige Läufe und der während der Aufwärmung
abgebrochene Lauf V1/block-02 bleiben im ursprünglichen Evidenzverzeichnis
erhalten. Der Hintergrundprozess wurde geordnet beendet; anschließend waren
keine Container des Laborprojekts mehr vorhanden. Ein Gesamtabschluss dieser
Reihe liegt nicht vor.

Da das unveränderte Versuchsskript keine Wiederaufnahme unterstützt, wurde die
vollständige Pflichtreihe unter `evidenz/1A/reihe-2026-11-12/` neu begonnen.
Die Entscheidung beruht auf der Unterbrechung, nicht auf Leistungswerten.
Blöcke beider Reihen werden nicht zu einer bestätigenden Reihe vermischt.
Baseline, Image-IDs, Hardware, Lastprofil, Seed, Fixture, Vertrags- und
Werkzeughash bleiben unverändert. Der vollständige Vorlaufnachweis wird nach
Prüfung dieser Identitäten unverändert in den neuen Evidenzordner übernommen;
er bleibt vom bestätigenden Vergleich ausgeschlossen.

## Abschlussnachweis für Schritt 6

Die neue Reihe wurde am 2026-11-12 mit Exitcode 0 abgeschlossen. Die erste
Aufwärmphase begann um 15:29 Uhr, das letzte Messfenster um 18:11 Uhr
(Europe/Berlin). Alle 25 Pflichtläufe sind vollständig aufgezeichnet: fünf
Wiederholungen für jede Variante V0–V4. Die optionale Ausfallvariante V5 wurde
nicht durchgeführt.

Die anschließende Prüfung der gespeicherten Dateien bestätigte:

- Identität von Baseline, Images, Werkzeugen, Vertrag und Fixture über alle
  Mess- und Aufwärmphasen sowie unveränderte Übernahme des Vorlaufs;
- Übereinstimmung der 25 Manifeste und Berichte mit dem randomisierten Plan;
- 50 korrekte SHA-256-Prüfsummen der verlustfrei lesbaren Ressourcenartefakte;
- 3.775 Messstichproben und 775 getrennte Aufwärmstichproben, ohne ausgelassene
  Abtastungen oder Wechsel der Containergeneration innerhalb einer Phase;
- gültige Zählung der geplanten Live-Aktionen, Ergebnisfreigabe und
  unveränderten Analysekorpus, bei V2–V4 positive Sidecar-Aufrufzähler;
- 25 überprüfte Rückwege einschließlich regulärem Live-Beitritt;
- anschließend keine Container, Volumes oder Netzwerke des Laborprojekts mehr.

Der maschinenlesbare Nachweis steht in
[`erfassungspruefung.json`](./evidenz/1A/reihe-2026-11-12/erfassungspruefung.json),
die Zuordnung der Reihen im [Evidenzindex](./evidenz/1A/README.md).
Die Nachweise wurden zusätzlich auf nicht freigegebene Zugangsdatenfelder und
Verbindungsadressen geprüft. Das ist eine Prüfung der erzeugten Artefakte,
keine allgemeine Sicherheitszertifizierung.

Vor Beginn der neuen Reihe bestanden erneut die Fixture-Tests (9),
Live-Metriktests (12), Analyse-Tests (20), Infrastrukturtests (22) und
Ablauftests (14), insgesamt 77 A1-Tests, außerdem fünf Sidecar-Tests und zwei
Compose-Tests. `npm run lint` und die ausdrückliche ESLint-Prüfung aller zehn
geänderten JavaScript-Dateien bestanden. `npm run typecheck` scheiterte erneut
an TS5095 in der unveränderten Backend-Konfiguration. Die vollständige
Testsuite war bereits vor der Unterbrechung ausgeführt worden und scheiterte
an einem Frontend-Test zur `weightingHint`-Formulierung; sie wurde für diesen
erneuten Lauf ohne Werkzeugänderungen nicht wiederholt. Diese offenen
Projektprüfungen sind durch die erfolgreichen Labormessungen nicht erledigt.

Schritt 6 ist damit hinsichtlich Automatisierung, Ausführung und Erfassung
abgeschlossen. Die fünf gepaarten Blöcke, Leistungsgrenzen, Hypothesen und
Betriebsentscheidung werden erst in Schritt 7 ausgewertet; `complete: true`
bezeichnet den vollständigen Messnachweis.
