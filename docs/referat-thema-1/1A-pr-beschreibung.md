## Zusammenfassung

**Vorbereiteter Entwurf für den gesamten A1-Branch; unabhängig technisch geprüft. Persönliche Abgabefreigabe und GitHub-Veröffentlichung werden gesondert dokumentiert.**

<!-- Problem und Lösung in wenigen Sätzen beschreiben. -->

- **Problem:** Für Aufgabe 1A fehlte ein reproduzierbarer Nachweis, ob spaCy-Analyse auf dem Anwendungshost die Live-Pfade beeinflusst und welche Ressourcen- und Fehlergrenzen gelten.
- **Lösung:** Vorabvertrag, synthetische Fixture, Last- und Ressourcenwerkzeuge sowie 25 gepaarte Messläufe mit prüfsummengestützter Auswertung bereitstellen. H1/H2 werden nicht bestätigt; die begründete Betriebsentscheidung bleibt `NLP_ENABLED=false`.
- **Bewusste Nicht-Ziele:** Keine Änderung an Anwendungs-APIs, Berechtigungen, Scoring oder UI; keine LLM-Messung, kausale Einzelzuordnung oder Freigabe einer anderen Produktionshardware. Closes #6 nach fachlicher Freigabe und Merge.

## Risiko und Verträge

<!-- Genau eine Risikostufe auswählen. -->

- [ ] Niedrig – Dokumentation, Texte oder isolierte Änderung ohne geändertes Verhalten
- [x] Mittel – Benutzeroberfläche, Anwendungslogik, Schema, Persistenz oder Konfiguration
- [ ] Hoch – Authentifizierung, Autorisierung, Tokens, WebSockets, Yjs, Redis,
      Datenbankmigrationen, Datenschutz, Deployment oder Sicherheitskonfiguration

**Maßgebliche Quelle und relevante Invarianten:**

Verbindlich sind Issue #6, der unveränderte A1-Versuchsvertrag Version 2 und die eingefrorene Fixture. Relative und absolute p95-Grenzen gelten gleichzeitig, einschließlich Gleichheit, je Aktion und Block; alle fünf Wiederholungen bleiben erhalten. Fehlende Aktionen und Analysen werden mitgezählt. Die gemessenen Images stammen aus dem unveränderten Fork-`main` `8f91e0417bc5aace461c3644a0b6b26c9284035b`. Host-Token, minimale Teilnehmerpayloads und effektive Stimmen werden nicht verändert.

**Betroffene externe Verträge:**

Bestehende tRPC-/WebSocket-Verträge werden von Lastwerkzeugen genutzt, nicht erweitert. Docker-Inspect und cgroup v2 liefern Ressourcenwerte; Unix-HTTP dient dem kontrollierten Verzögerungsproxy. Tests prüfen Erfassung, Abbruch, Zähler und Rückweg. Neue lokale Auswertungsausgaben sind JSON, CSV und Markdown; PDF-Entwürfe werden mit vorhandenen Playwright-/Chart.js-/pdf-parse-Abhängigkeiten erzeugt.

## Implementierung

<!-- Die wichtigsten Änderungen knapp und fachlich beschreiben. -->

- Schritte 1–6: deterministische gemeinsame Fixture, Instrumentierung erfolgreicher und fehlgeschlagener Live-Aktionen, getrennte hostautorisierte Analysen, Ressourcen-Collector, Verzögerungsproxy und automatisierter isolierter Laborablauf mit überprüftem Rückweg.
- Schritt 7: Eingabeintegrität und Rohperzentile erneut prüfen, 80 gepaarte Vergleiche und Ressourcenbudget auswerten; 13 relative Grenzverletzungen unverändert dokumentieren.
- Hotpfadtest um Quick Feedback einschließlich Negativprobe erweitern; A1-npm-Befehle und Testintegration ergänzen.
- Zwischenzeitliche Compilerkorrekturen und die sachfremde Frontend-Testkorrektur wurden verworfen; diese Dateien entsprechen HEAD. Keine Anwendungs-Laufzeitlogik geändert.
- Auswertung, PDF-Abgabeentwürfe mit bearbeitbaren Vorlagen, Eigenanteils-/KI-Nachweis, Gesamtübersicht und Prüfprotokoll ergänzen.
- Compose nachträglich mit dem eingefrorenen Aufbauhelfer und den Image-IDs auflösen, per Positivliste bereinigen und gegen 25 Manifeste prüfen; ausdrücklich keine damalige Aufnahme behaupten.
- Freigabestand in Rahmen/Aufteilung synchronisieren sowie persönliche Prüfliste und gemeinsame Übergabeunterlage erstellen.

## Verhaltens- und Abdeckungsprüfung

- [x] Gewünschtes Verhalten und maßgebliche Quelle wurden vor der Implementierung geklärt
- [x] Vergleichbare Implementierungen und betroffene Aufrufpfade wurden geprüft
- [x] Erfolgsfall wurde getestet
- [x] Ablehnungs-, Fehler- oder ungültiger Eingabepfad wurde getestet oder unter
      „Nicht zutreffend“ begründet
- [x] Ein Regressionstest bildet bei einer Fehlerbehebung den ursprünglichen
      Fehler ab
- [x] Relevante Zustandsübergänge wurden geprüft

### Relevante Zustandsübergänge

<!-- Zutreffendes markieren. Nicht markierte, naheliegende Punkte unten begründen. -->

- [ ] Nicht zustandsbehaftete Änderung
- [x] Wiederholung oder doppelte Anfrage
- [ ] Neuladen und Wiederherstellung
- [ ] Reconnect oder Verbindungsersetzung
- [ ] Token- oder Capability-Rotation
- [x] Ablauf und Bereinigung
- [ ] Migration oder Legacy-Daten
- [x] Parallelität oder Race Conditions
- [x] Abhängigkeit vorübergehend nicht verfügbar
- [x] Asynchroner Ablauf: Pending → Erfolg → Ablehnung/Timeout → Retry oder Abbruch
- [ ] DOM-Ersetzung: nach Erfolg und Fehler existiert ein sichtbares,
      nicht verdecktes und fachlich sinnvolles Fokusziel

## Validierung

<!-- Nur tatsächlich im aktuellen Branch ausgeführte Prüfungen markieren. -->

- [ ] `npm run typecheck`
- [ ] `npm test`
- [x] `npm run lint`
- [ ] `npm run build:prod` bei Frontend-, i18n-, Build- oder Produktionsänderungen
- [x] Betroffene Unit-, Integrations- oder Contract-Tests ergänzt beziehungsweise aktualisiert

### Ausgeführte Prüfungen und Ergebnisse

Die älteren Protokolle unter `auswertung/` und `nacharbeit/` sind historische
Nachweise eines größeren Änderungsumfangs einschließlich inzwischen verworfener
Compiler- und Frontend-Testkorrekturen. Deren Erfolge werden nicht auf den
bereinigten Stand übertragen. Aktuelle Befehle, Resultate und Quellenidentitäten
stehen unter `evidenz/1A/bereinigung/`.

| Prüfung/Befehl                                                                          | Ergebnis im bereinigten Stand                                                                                                                                             |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alle sechs A1-Werkzeugtestsuiten                                                        | Exit 0; alle 99 Tests bestanden (9/12/20/22/14/22), durchgehend unter Node 24.18.0.                                                                                       |
| `npm run test -w @arsnova/backend -- src/__tests__/wordCloud.hotpath-isolation.test.ts` | 4 Tests bestanden; Negativprobe zuvor ohne Quick-Feedback-Abdeckung gezielt fehlgeschlagen.                                                                               |
| `npm run typecheck`                                                                     | Exit 2: vorhandene Kombination CommonJS/bundler im unveränderten Backend verursacht TS5095.                                                                               |
| `npm run typecheck -w @arsnova/frontend`                                                | Exit 2: TS2488 bei vorhandener NodeList-Iteration; ursprüngliche Compilerkonfiguration unverändert.                                                                       |
| Gezielter unveränderter Frontend-Korpustest                                             | Exit 1: veraltete Wording-Erwartung »viel Zustimmung«; 1 fehlgeschlagen, 514 nicht ausgewählt. Sachfremde Korrektur nicht Bestandteil von A1.                             |
| `npm test` und `npm run build:prod`                                                     | Nach der Bereinigung nicht vollständig erneut ausgeführt. Der nachgewiesene Backend-Compilerfehler blockiert den Produktionsbuild; vollständiger Gesamttest bleibt offen. |
| `npm run lint`, gezieltes Werkzeug-ESLint, Prettier und `git diff --check`              | Aktuelle Ergebnisse im Bereinigungsprotokoll.                                                                                                                             |
| Messauswertung, Dokumentbau und Compose-Rekonstruktion                                  | Historische Ausführungen dokumentiert; Rohdaten, Auswertung, PDF-Artefakte und eingefrorene Messwerkzeuge bei der Bereinigung unverändert.                                |
| PR-Vorlagenprüfung                                                                      | Aktueller Stand bewusst nicht reviewbereit: erneute unabhängige Diffprüfung und Reviewfreigabe bleiben unbestätigt.                                                       |

<!-- Keine Prüfung als erfolgreich angeben, wenn sie nicht ausgeführt wurde. -->

## Risikobezogene Prüfungen

<!-- Zutreffende Prüfungen markieren und unter „Nachweise“ belegen. -->

- [x] Keine Benutzeroberflächenänderung oder mobile Darstellung geprüft
- [x] Keine relevante Änderung oder Tastatursteuerung und Fokusverhalten geprüft
- [x] Keine relevante Änderung oder Screenreader-Semantik geprüft
- [x] Keine relevante Änderung oder Reflow, Zoom und Kontrast geprüft
- [x] Keine Realtime-Änderung oder WebSocket-/Yjs-Szenarien geprüft
- [x] Keine Migrationsänderung oder Prisma-Migrationskette auf einer frischen
      Datenbank geprüft
- [x] Keine lastrelevante Änderung oder Last-/Performance-Budget geprüft
- [x] Keine Textänderung oder alle Locales (`de`, `en`, `fr`, `es`, `it`)
      synchronisiert
- [x] Keine Änderung externer Verträge oder Vertrag anhand einer maßgeblichen
      Spezifikation beziehungsweise eines Contract-Tests geprüft
- [x] Keine sicherheitsrelevante Änderung oder erlaubte und abgelehnte
      Sicherheitsgrenze getestet

## Betrieb und Rollback

- **Auswirkung auf Produktion:** Keine Aktivierung oder Änderung laufender Produktionsdienste. Messungen betreffen ein eigenes temporäres Labor; produktive Compilerkonfiguration, Anwendung und Deployment werden durch diesen Abschluss nicht geändert. Das Experiment ist keine Produktionskapazitätsfreigabe.
- **Erforderliche Konfigurations- oder Deployment-Schritte:** Keine Migration oder neue Produktionsvariable. Für Wiederholungen ausschließlich neue eigene Laborressourcen und private Konfiguration gemäß Versuchsanleitung verwenden. Generator und Dienste konkurrieren auf demselben WSL2-Host.
- **Beobachtbarkeit beziehungsweise relevante Logs/Metriken:** Versionierte synthetische Laufmanifeste, Roh-Laufzeiten, Analyseergebnisse, gzip-Ressourcenzeitreihen, Rückwegnachweise und abgeleitete Berichte mit Quellenhashes. Keine persönlichen Daten oder betrieblichen Zugangsdaten aufnehmen.
- **Rollback:** Neue Werkzeuge werden nur explizit gestartet. Labor-Rückweg beendet Last und Proxy, stellt Limits/Socket wieder her, deaktiviert NLP, prüft Basisdienste und Live-Beitritt und entfernt ausschließlich eigene Laborressourcen. Für A1-Werkzeuge, npm-Skripte und den Isolationstest den betreffenden Commit zurücknehmen und passende Prüfungen wiederholen; es gibt keine Datenmigration.

- [x] Keine neuen Secrets, Zugangsdaten, `.env`-Inhalte, Dumps oder lokalen
      Artefakte eingecheckt
- [x] `.env.production.example`, Deployment-Dateien und Betriebsdokumentation
      sind aktuell oder nicht betroffen
- [x] Shared-NAT-Betrieb und mindestens 500 gleichzeitige Hörsaal-Clients sind
      nicht betroffen oder wurden berücksichtigt

## Nachweise

<!-- CI-Lauf, Testreport, Screenshots, Messungen oder manuelle Prüfungen verlinken. -->

- [Gesamtübersicht](https://github.com/NiklasSkulll/arsnova.eu/blob/feature-1A-resource-isolation/docs/referat-thema-1/1A-komplette-Aufgabe-fertig.md), [Vertrag](https://github.com/NiklasSkulll/arsnova.eu/blob/feature-1A-resource-isolation/docs/referat-thema-1/1A-experiment-contract.md), [Versuchsanleitung](https://github.com/NiklasSkulll/arsnova.eu/blob/feature-1A-resource-isolation/docs/referat-thema-1/1A-versuchsreihe.md).
- [Vollständige Messreihe](https://github.com/NiklasSkulll/arsnova.eu/tree/feature-1A-resource-isolation/docs/referat-thema-1/evidenz/1A/reihe-2026-11-12/), [Auswertung und Betriebsentscheidung](https://github.com/NiklasSkulll/arsnova.eu/blob/feature-1A-resource-isolation/docs/referat-thema-1/1A-auswertung.md), [JSON](https://github.com/NiklasSkulll/arsnova.eu/blob/feature-1A-resource-isolation/docs/referat-thema-1/evidenz/1A/auswertung/auswertung.json), [80 CSV-Vergleiche](https://github.com/NiklasSkulll/arsnova.eu/blob/feature-1A-resource-isolation/docs/referat-thema-1/evidenz/1A/auswertung/live-vergleiche.csv).
- [Prüfprotokoll](https://github.com/NiklasSkulll/arsnova.eu/blob/feature-1A-resource-isolation/docs/referat-thema-1/evidenz/1A/auswertung/pruefungen.json), [PDFs und Quellenmanifest](https://github.com/NiklasSkulll/arsnova.eu/blob/feature-1A-resource-isolation/docs/referat-thema-1/abgabe/README.md), [Eigenanteil und Anforderungsabgleich](https://github.com/NiklasSkulll/arsnova.eu/blob/feature-1A-resource-isolation/docs/referat-thema-1/1A-eigenanteil.md).
- [Aktuelle Bereinigungsprüfung](https://github.com/NiklasSkulll/arsnova.eu/blob/feature-1A-resource-isolation/docs/referat-thema-1/evidenz/1A/bereinigung/README.md).
- [Historische unabhängige Review und Nacharbeit](https://github.com/NiklasSkulll/arsnova.eu/blob/feature-1A-resource-isolation/docs/referat-thema-1/evidenz/1A/nacharbeit/README.md), [Compose-Rekonstruktion](https://github.com/NiklasSkulll/arsnova.eu/blob/feature-1A-resource-isolation/docs/referat-thema-1/evidenz/1A/compose-rekonstruktion/README.md), [persönliche Prüfung und Übergabe](https://github.com/NiklasSkulll/arsnova.eu/blob/feature-1A-resource-isolation/docs/referat-thema-1/1A-abschluss-und-uebergabe.md).
- Die Repositorylinks beziehen sich auf den A1-Branch und sind nach deinem Commit und Push erreichbar. Diese Datei kann unverändert als `--body-file` für die Fork-PR verwendet werden. Es wird kein neuer CI-Lauf behauptet.

## Nicht zutreffend und verbleibende Risiken

<!-- Jeden nicht ausgeführten, aber naheliegenden Prüfpunkt konkret begründen. -->

- **Nicht zutreffende Prüfungen:** Keine geänderten API-Schemas, UI-Texte, Templates, Styles oder Fokusabläufe; daher keine neuen manuellen UI-/WCAG-Prüfungen oder Übersetzungen. Keine Migration, Tokenrotation oder Wiederherstellungsfunktion der Anwendung geändert. Für die Werkzeuge sind Abbruch, verspäteter Abschluss, Überlappung, temporäre Sidecar-Nichtverfügbarkeit und isolierter Rückweg durch Tests abgedeckt. V5 war optional und wurde nicht ausgeführt. Keine ESM-Migration vorgenommen.
- **Verbleibende Risiken:** H1/H2 verfehlen die vorab gesetzten relativen Grenzen; keine Aktivierungsfreigabe. Gemeinsamer Generator-/Dockerhost mit 16 logischen CPUs, Beitrittswelle und synthetischem Wortschatz begrenzen Übertragbarkeit und Kausalität. V4 leitet tatsächlich keine spaCy-Berechnung weiter. Unabhängige technische Abschlussreview am damaligen Stand durchgeführt; nach der späteren Bereinigung steht die erneute unabhängige Prüfung des aktuellen vollständigen Diffs aus. Vorhandene Compilerfehler werden durch A1 nicht behoben, ein aktueller erfolgreicher Gesamttest oder Produktionsbuild wird nicht behauptet. Die nachträgliche Compose-Rekonstruktion ersetzt keine fehlende damalige Aufnahme; diese Nachweisgrenze bleibt vor vollständiger Aufgabenabnahme zu bewerten. Persönliche fachliche Gegenprüfung, erlaubter KI-Umfang, formale Abgabe, Abstimmung mit 1B/1C sowie Commit, Push, PR und Merge bleiben durch Niklas zu erledigen. Ein Frontend-Dialogtest scheiterte im ersten Gesamtlauf und bestand isoliert unverändert; Ursache nicht zugeordnet, die vollständige Wiederholung bestand ebenfalls unverändert und wird getrennt dokumentiert. Technische Review und PR-Vorlagengate ersetzen weder die persönliche Abgabefreigabe noch die Anerkennung der verbleibenden Nachweisgrenze.

## Selbstreview

- [ ] Der vollständige Diff wurde unabhängig noch einmal geprüft
- [x] Aufgabenstellung und Akzeptanzkriterien wurden erneut mit dem Ergebnis verglichen
- [x] Code, Tests, Schemas, Dokumentation, Konfiguration, Übersetzungen und
      PR-Beschreibung widersprechen sich nicht
- [x] Vergleichbare Pfade enthalten den behobenen Fehler nicht weiterhin
- [x] Temporärer Code, Debug-Ausgaben und überholte Kommentare wurden entfernt
- [x] Sicherheits-, Barrierefreiheits-, Kompatibilitäts- und
      Performanceaussagen sind durch Nachweise gedeckt
- [ ] Der PR ist vollständig und bereit für ein Review
- [x] Keine asynchrone UI-Änderung oder Erfolg, Pending, Fehler und Fokus wurden
      anhand des tatsächlichen DOM-Ablaufs geprüft
