**A1 ist im Fork als [Issue #6](https://github.com/NiklasSkulll/arsnova.eu/issues/6) erfasst. Ich konnte es über die GitHub CLI vollständig lesen.** Mein Vorschlag ist, die fehlenden Messwerkzeuge zu ergänzen und damit den vorhandenen Releasecode kontrolliert zu untersuchen. Ein Produktivpatch ist für A1 ausdrücklich nicht erforderlich.

Ich habe keine Projektdateien geändert und keine Lastversuche gestartet.

Ich habe die drei genannten Dokumente, die Prüfungsgrundlage, relevante Serena-Memories, Compose-/Deployment-Konfiguration, spaCy-Implementierung, Backend-Aufrufpfade, gemeinsame Schemas und Fixtures sowie Lastwerkzeuge, Tests und PR-Vorgaben geprüft. Serena war zunächst auf ein anderes Projekt eingestellt; für die weitere Untersuchung habe ich `arsnova.eu` aktiviert.

Der geprüfte Stand:

| Bereich | Ergebnis |
|---|---|
| Branch | `feature-1A-resource-isolation`, Arbeitsverzeichnis sauber |
| Aktueller Commit | `93bcf2e9288f66efafe809b617a93e70ba14de27` |
| Release-Tag | `v1.3.0` zeigt lokal auf `87c39334619fbcb0c5782b061da1ba0df0ba3142` |
| Zuständigkeit | Niklas: 1A vollständig; die zusätzlichen 1B-Aufgaben bleiben außerhalb dieses A1-Plans |
| Labor und Baseline | [Issue #8](https://github.com/NiklasSkulll/arsnova.eu/issues/8) nennt deren Festlegung weiterhin als offene Aufgabe; keine Kommentare mit einer konkreten Freigabe |
| Node | Aktive Shell verwendet Node 20; das geforderte Node 24.18.0 ist bereits installiert |

**Diese Befunde bestimmen die Umsetzung:**

- In [docker-compose.prod.yml](/mnt/d/gitProjekte/arsnova.eu/docker-compose.prod.yml:81) hat spaCy **1 CPU, 1 GiB RAM und 64 PIDs**, keinen Netzwerkzugang und einen Unix-Socket. App, PostgreSQL und Redis haben dort keine entsprechenden Ressourcenlimits.
- spaCy serialisiert die Modellverarbeitung durch einen globalen Lock. Der Backend-Client erlaubt höchstens zwei gleichzeitige Sidecar-Anfragen pro Prozess. Zusätzliche Anfragen können deshalb unmittelbar auf den lexikalischen Ersatzpfad fallen.
- `wordCloud.analyzeQa` verlangt einen validierten Host-Token, sperrt parallele Analysen derselben Session und berücksichtigt nur `ACTIVE`/`PINNED`. Mehrere Analyse-Hosts benötigen getrennte Sessions. Neue Q&A-Einreichungen dürfen den festgelegten Analysekorpus nicht unkontrolliert verändern.
- **8.9b ist eine In-Process-Klassifikation**, der Kontextaufbau läuft ebenfalls im Backend. Der Encoder erzeugt Embeddings in einem eigenen Container. Generative Inferenz gehört nach ADR-0035 auf die zweite private Serverrolle.
- Die sechs Referenzfragen **einschließlich Bewertungen existieren bereits** in [moderation-prompt-context-fixtures.ts](/mnt/d/gitProjekte/arsnova.eu/libs/shared-types/src/moderation-prompt-context-fixtures.ts:22). Ich habe sie mit Abschnitt 12 des ursprünglichen [Issues #456](https://github.com/kqc-real/arsnova.eu/issues/456) abgeglichen.
- Die Messlücken **L-01, L-02 und L-14 bestehen weiterhin**: vorhandene Wortwolken-Lastskripte verwenden `normalization: 'NONE'`; Artillery misst bei Vote/Q&A/Blitzlicht bisher nur Zähler; ein Container-Throttling-Collector fehlt.
- Die vorhandene Event-Loop-Messung erfasst den **Lastgenerator**, nicht das Backend.
- Dossier und Memories enthalten veraltete Angaben. Beispielsweise hat der Encoder aktuell im Produktions-Compose **4 CPUs**, im Entwicklungs-Compose weiterhin **1 CPU**.
- `compare-load-report.mjs` nimmt bei zwei Budgetangaben die größere Toleranz. Die vorgeschlagene Bedingung „≤10 % **und** ≤50 ms“ benötigt zwei getrennte Prüfungen.

Tatsächliche Ressourcenreserve, spaCy-Speicherverbrauch und Auswirkungen auf Live-Latenzen sind damit **noch nicht gemessen**.

Mein Umsetzungsplan:

1. **Versuchsvertrag vor den Messungen festhalten.**  
   Hypothesen, Gegenalternative `NLP_ENABLED=false`, Baseline-Commit, Hardware, Flags, Lastprofil, Wiederholungen und Schwellen dokumentieren. Die Dossier-Schwellen würde ich als Vorschlag übernehmen: je Live-Aktion p95-Anstieg gegenüber V1 höchstens 10 % **und** 50 ms, Fehlerquote höchstens 0,5 %. Das sind Versuchsentscheidungen; die vorhandenen SLOs gelten teilweise für andere Lastgrößen und Zeitfenster.

2. **Gemeinsame Fixture reproduzierbar nutzbar machen.**  
   Die vorhandenen Referenzfragen wiederverwenden, Gegenfälle und einen deterministischen Füllkorpus ergänzen. Seed und Hash ins Manifest aufnehmen. Den Referenzzustand für 1C erhalten; für A1 eine ausdrücklich dokumentierte Analyseansicht mit freigegebenen Fragen erzeugen. Live-Einreichungen und statischen Analysekorpus über getrennte Sessions führen. Das Artefakt für #9/#10 als gemeinsam kennzeichnen.

3. **Live-Messungen in Artillery vervollständigen.**  
   [processor.mjs](/mnt/d/gitProjekte/arsnova.eu/scripts/load/artillery/processor.mjs:317) und [run-artillery-500.mjs](/mnt/d/gitProjekte/arsnova.eu/scripts/load/run-artillery-500.mjs:266) um Dauern, Stichprobenzahlen und Fehlerquoten für Join, Vote, `qa.submit` und Blitzlicht ergänzen. Fehler, übersprungene Aktionen und erfolgreiche Antworten getrennt ausweisen. Leere Stichproben dürfen kein bestandenes Gate ergeben. Die bestehende Join-Welle nicht als dauerhaft 500 gleichzeitig aktive Clients ausgeben; das tatsächliche Lastprofil im Report festhalten.

4. **Gezielte Analyse-Last hinzufügen.**  
   Vorgesehen: `scripts/load/host-analyze-loop.mjs`. Bestehenden tRPC-Client und reguläre Host-Autorisierung verwenden. Mit `LEXICAL`, `LEMMA`, `refresh: true` und festem Korpus arbeiten. Pro Aufruf Dauer, angewandte Normalisierung, Fallbackgrund und Fehlercode erfassen. Geplante und tatsächlich ausgeführte Aufrufe getrennt zählen, damit langsamere Varianten nicht unbemerkt weniger Last erzeugen.

5. **Container-Metriken und kontrollierte Störung ergänzen.**  
   Vorgesehen: `scripts/load/lib/container-metrics.mjs` für CPU-/RAM-Zeitreihen sowie `cpu.stat`, `memory.peak` und OOM-Ereignisse. Fehlende Metriken ausdrücklich als nicht verfügbar melden; Containerwechsel und lebenslange Peakwerte berücksichtigen. Docker-Speicheranzeige und cgroup-Werte unterschiedlich kennzeichnen. ([Docker-Dokumentation](https://docs.docker.com/reference/cli/docker/container/stats/), [cgroup-v2-Spezifikation](https://docs.kernel.org/admin-guide/cgroup-v2.html))  
   Für V4 einen ausschließlich im Labor eingesetzten Unix-Socket-Verzögerungsproxy mit eigenem Test vorsehen. Produktions-Defaults bleiben erhalten.

6. **Versuchsreihe automatisieren und ausführen.**

   | Variante | Aufbau |
   |---|---|
   | V0 | Live-Last ohne Analyse, spaCy aus |
   | V1 | Gleiche Live-Last plus Analyse, spaCy aus |
   | V2 | Wie V1, spaCy mit 1 CPU/1 GiB |
   | V3 | Wie V2, spaCy auf 0,25 CPU begrenzt |
   | V4 | Wie V2, gezielte Antwortverzögerung |
   | V5 optional | Sidecar-Ausfall |

   Mindestens fünf Wiederholungen je Pflichtvariante, Reihenfolge reproduzierbar randomisiert. Gleiche Aufwärmphase, Messdauer, Daten und Lastparameter verwenden. Andere Analysefunktionen konstant halten; Encoder, Summary und LLM für den isolierten spaCy-Vergleich ausschalten. Frische Laufzustände und einen überprüften Rückweg zur Baseline vorsehen.

   Je Lauf kommen ausschließlich bereinigte Evidenzdaten nach `docs/referat-thema-1/evidenz/1A/<variant>/<run>/`: Manifest, Messwerte, Analyseergebnisse und ausgewählte Diagnosefelder. Zugangsdaten und interne Adressen werden nicht gespeichert.

7. **Auswertung, Tests und Abgabe abschließen.**  
   V0→V1 bewertet zusätzlichen Analyseaufwand; V1→V2 die zusätzlichen Kosten des spaCy-Pfads; V3/V4 zeigen das Verhalten unter Drosselung beziehungsweise Verzögerung. Daraus Einsatzgrenze, Ressourcenbudget, Betriebsaufwand und Deaktivierungsalternative begründen. Direkte Aussagen über Rendering, didaktischen Nutzen oder LLM-Tragfähigkeit sind daraus nicht ableitbar.

   Neue Werkzeuge erhalten Erfolgs-, Fehler-, Parallelitäts- und Abbruchtests. Den vorhandenen Hotpfad-Isolationstest um `quickFeedback.ts` ergänzen. Geplant sind außerdem die betroffenen Backendtests, `test:spacy-sidecar`, `test:spacy-compose`, Typecheck, vollständige Tests, Lint und die für Labor-/Compose-Änderungen einschlägigen Buildchecks. Dokumentation, CI-Einbindung und vollständige PR-Vorlage werden mitgeführt. Erst mit realen Ergebnissen folgen Handout/Slides als PDF und die dokumentierte Eigenleistung.
