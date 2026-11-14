## Eigenanteil

### Aufgabe und Beitrag

- **Aufgabe:** 1A – Ressourcenisolation auf dem Anwendungshost, Rolle X,
  gemäß [Issue #6](https://github.com/NiklasSkulll/arsnova.eu/issues/6).
- **Änderungen und Zweck:** Vorabvertrag, gemeinsame Fixture,
  Live-Instrumentierung, hostautorisierte Analyse-Last, Ressourcen-Collector,
  Verzögerungsproxy und automatisierter Laborablauf wurden im A1-Branch
  ergänzt. Schritt 7 fügt die reproduzierbare Auswertung, Hotpfadprüfung,
  Abgabeentwürfe und Abschlussdokumentation hinzu.
- **Belege:** Schritte 1–6 in den Commits `2372a037`, `e48bae72`,
  `4db4c379`, `2efc08b5`, `58c95246`, `35271586`; ergänzende Dokumentation
  in `9c709597` und `7ebe05a5`. Pfade und Zwecke stehen in der
  [Gesamtübersicht](./1A-komplette-Aufgabe-fertig.md); Messungen und Rechnung
  in der [Auswertung](./1A-auswertung.md).
- **Gemeinschaftliche oder unklare Anteile:** Die sechs Referenzfragen aus
  `libs/shared-types/src/moderation-prompt-context-fixtures.ts` und der
  Anwendungs-/Sidecar-Code sind übernommenes Projektmaterial. Die A1-Fixture
  ist als gemeinsames Artefakt für 1A/1B/1C gekennzeichnet; laut Issue #6 hat
  1C zusätzlich eine eigene PostgreSQL-Fixture, deren Abstimmung noch offen
  ist. Implementierung, Test- und Messausführung, Auswertung und Texte wurden
  agentengestützt mit OpenAI Codex erstellt; Git-Autorenschaft allein beweist
  keine manuelle Code-Erstellung durch Niklas.

### Prüfgrundlage

- `feature-1A-resource-isolation@7ebe05a55f27e43913fe94f8be71dd28bdc55b6e`
  gegenüber dem verfügbaren
  `origin/main@8f91e0417bc5aace461c3644a0b6b26c9284035b`.
- **Merge-Base:** `93bcf2e9288f66efafe809b617a93e70ba14de27`.
  Die Branchänderungen wurden gegen diese gemeinsame Basis eingeordnet,
  nicht pauschal alle Unterschiede zwischen zwei auseinanderliegenden Spitzen.
- **Nicht committete Änderungen:** Schritt 7: Auswertungs- und PDF-Werkzeuge
  mit Tests, Ergebnisse unter `evidenz/1A/auswertung/`, Abgabequellen und
  PDFs unter `abgabe/`, Hotpfadtest sowie begleitende Dokumentation und
  npm-Befehle. Compilerkorrekturen und die sachfremde Frontend-Testkorrektur
  wurden verworfen und gehören nicht zum aktuellen Umfang. Dieser Nachweis wird vor dem durch Niklas auszuführenden
  Schritt-7-Commit erstellt; er behauptet keinen bereits existierenden
  Abschlusscommit.
- **Vorgaben und Aufgabendokumentation:**
  [Rahmen](./00-rahmen-und-pruefung.md), [Aufteilung](./01-aufteilung.md),
  [Prüfungsspezifikation](../didaktik/CLOUD-COMPUTING-REFERAT-PRUEFUNG.md),
  [Versuchsvertrag](./1A-experiment-contract.md),
  [Recherchedossier](./1A-ressourcenisolation-app-host.md) und das am
  12.11.2026 erneut per GitHub CLI gelesene Issue #6. Ältere Dossierangaben
  zum 1.3-Tag und offenen Labor sind historisch; gemessen wurde die ausdrücklich
  dokumentierte aktuelle-main-Baseline auf dem eigenen Rechner.

### Nacharbeit und verbleibende Nachweisgrenze

Die [Compose-Rekonstruktion](./evidenz/1A/compose-rekonstruktion/README.md)
ergänzt nachträglich fünf aufgelöste Positivlisten-Auszüge mit Manifestabgleich;
eine während der Messung gespeicherte Compose-Ausgabe fehlt weiterhin.
Die [Abschluss-/Übergabeunterlage](./1A-abschluss-und-uebergabe.md) dokumentiert
wesentliche KI-Aufträge, persönliche Gegenprüfungen und die zur Abstimmung
bereitgestellten gemeinsamen Artefakte. Ihre offenen Checkboxen sind keine
behauptete Freigabe. Technische Review und Nachprüfungen stehen gesondert im
[Nacharbeitsprotokoll](./evidenz/1A/nacharbeit/README.md).

### Anforderungsabgleich

- **Abgedeckt – Dienste und Systemgrenzen:** App, PostgreSQL, Redis,
  PDF-Worker, spaCy, 8.9b, Kontextaufbau und Encoder sind in der
  [Auswertung](./1A-auswertung.md#systemgrenzen-und-labor) eingeordnet;
  generative Inferenz bleibt gemäß ADR-0035 außerhalb des Vergleichs.
- **Abgedeckt – vorab festgelegter Versuch:** Vertrag Version 2, fester
  Korpus und fünf randomisierte Pflichtvarianten mit fünf Wiederholungen;
  Vertrags- und Fixture-Hash in allen Laufmanifesten.
- **Teilweise abgedeckt – ausführbare Messung und Nachweise:** 25 vollständige Läufe
  mit Live-, Analyse- und Ressourcenrohwerten sowie überprüftem Rückweg;
  Nachweiskette in `evidenz/1A/reihe-2026-11-12/` und Dateiübersicht im
  [Evidenzindex](./evidenz/1A/README.md). Die fehlende damalige Compose-Aufnahme
  und der gekennzeichnete Rekonstruktionsnachtrag begrenzen die Vollständigkeit.
- **Abgedeckt – nachvollziehbare Entscheidung:** H1 und H2 nicht bestätigt;
  Aktivierung nach dem vereinbarten Kriterium nicht gedeckt, lexikalische
  Gegenalternative beibehalten. Alle Einzelvergleiche einschließlich
  Grenzverletzungen bleiben erhalten.
- **Teilweise abgedeckt – Ursachen trennen:** V0/V1/V2 unterscheiden die
  zugeschalteten Pfade kontrolliert. Die Daten belegen aber nicht die
  einzelne Ursache einer Latenzdifferenz; Host-/Generator-Konkurrenz und
  die niedrige V1-Baseline in Block 1 bleiben begrenzende Faktoren.
- **Teilweise abgedeckt – gemeinsame Artefakte:** Fixture und Live-Werkzeuge
  sind als gemeinsam gekennzeichnet und ausführbar. Eine tatsächlich
  erfolgte Übernahme oder Abstimmung mit 1B/1C wird nicht behauptet.
- **Teilweise abgedeckt – schriftliche/visuelle Abgabe:** Vierseitiger
  PDF-Handoutentwurf und neun PDF-Folien mit offengelegter KI-Unterstützung
  liegen vor. Persönliche fachliche Gegenprüfung, formale Zitation,
  zugelassener KI-Umfang und tatsächliche Einreichung sind noch zu bestätigen.
- **Nicht abgedeckt – PR gemergt:** Eine vollständige PR-Beschreibung wird
  vorbereitet. Commit, Push, Freigabe und Merge wurden durch den Agenten
  nicht ausgeführt; das Issue wird nicht als bereits geschlossen ausgewiesen.
- **Nicht anwendbar – generative Qualität und 8-vCPU-Freigabe:** Kein
  LLM-Versuch, kein didaktischer Wirksamkeitsnachweis und kein Lauf auf
  einer dedizierten 8-vCPU-Zielmaschine.

### Tests

- **Tests:** Fixture, Live-Metriken, Analysezeitplan/-Korpus,
  Container-Metriken, Verzögerungsproxy, Laborablauf und neue
  Auswertungs-/Vorlagentests. Zusätzlich schützt
  `wordCloud.hotpath-isolation.test.ts` jetzt auch Quick Feedback mit einer
  tatsächlich fehlschlagenden Negativprobe für einen direkten Inferenzimport.
- **Status:** Mess- und Werkzeugnachweise aus Schritt 6 sind dokumentiert;
  die Abschlussprüfungen wurden in Schritt 7 erneut ausgeführt. Negative
  Auswertungstests wurden vor ihrer Implementierung fehlschlagen gesehen.
- **Ergebnis:** Die ursprünglichen Gesamtläufe stehen im historischen
  [Prüfprotokoll](./evidenz/1A/auswertung/pruefungen.json) und im
  [Nacharbeitsprotokoll](./evidenz/1A/nacharbeit/pruefungen.json). Sie enthalten
  inzwischen verworfene Compiler- und Frontend-Testkorrekturen und sind
  historische Nachweise. Für den bereinigten Umfang gilt ausschließlich die
  [Bereinigungsprüfung](./evidenz/1A/bereinigung/README.md).

### Individuelle Beweiskette

- **Hypothese:** H1/H2 vorab im Vertrag; SHA-256
  `f7d3eba4b82a3f3a47c914665ac8a7be4988b9061deff6b857a79d2fcf766ab7`.
- **Gegenhypothese:** Analyse ohne spaCy beziehungsweise
  `NLP_ENABLED=false` mit lexikalischer Wortwolke als ernsthafte Alternative.
- **Eigener ausführbarer Test:** A1-Messwerkzeuge und automatisierte
  Fehler-/Variantenprüfungen im Branch; Entwicklung und Ausführung
  transparent agentengestützt, unter dem von Niklas erteilten Auftrag.
- **Eigener Baseline-Lauf:** V0/V1 der vollständigen lokalen Reihe vom
  12.11.2026; gleicher unveränderter Anwendungscommit und identische
  synthetische Daten über die Vergleiche.
- **Fehler/Variante:** V2 normal, V3 auf 0,25 CPU begrenzt, V4 mit
  6000-ms-Weiterleitungsverzögerung; V5 war optional und wurde nicht ausgeführt.
- **Ergebnis mit Gültigkeitsgrenze:** H1 verfehlt 4/20 und H2 6/40
  Aktionsvergleiche an der relativen Grenze; absolute Ziele und reguläres
  Ressourcenbudget bestehen. Beitrittswelle, gemeinsamer WSL2-Host,
  kleiner synthetischer Wortschatz und fehlende kausale Einzelzuordnung
  begrenzen die Aussage.
- **Entscheidung:** Lexikalische Alternative beibehalten; untersuchtes
  1-CPU-/1-GiB-Budget als Ausgangspunkt weiterer Laborversuche, keine
  Freigabe eines kleineren Limits oder zusätzlicher LLM-Last.

### Offen

- **Technisch:** Status der tatsächlichen Abschlussprüfungen im
  Prüfprotokoll; keine über dessen Ergebnisse hinausgehende CI-/Mergefreigabe.
  Die ursprünglichen Compilerkonfigurationen bleiben unverändert; vorhandene
  Konfigurationsfehler und eine mögliche Migration sind separate Arbeit. Die Fehler-/Lastgrenzen gelten nur für diesen Versuch.
- **Dokumentation und Prüfungsnachweise:** Persönliche Gegenprüfung und
  fachliche Entscheidung durch Niklas, Abstimmung gemeinsamer Artefakte,
  institutionelle Zitier- und KI-Vorgaben, tatsächliche PDF-Einreichung
  sowie Commit, PR und Merge stehen außerhalb einer automatischen Freigabe.

### Leistungsnachweis

- Im Niklas zugeordneten A1-Branch sind ein reproduzierbarer Vergleich mit
  25 vollständigen Läufen, die gemeinsame Messinfrastruktur und eine auf
  unveränderten Kriterien beruhende Betriebsentscheidung dokumentiert.
- Die technische Ausarbeitung wurde agentengestützt erstellt; die
  individuelle Leistung liegt in Auftrag, Freigabe, persönlicher
  Gegenprüfung und fachlicher Vertretung, nicht in einer unbelegten
  Behauptung ausschließlich manueller Implementierung.
