# A1 – Abschlussprüfung und Übergabe

Stand: 14.11.2026. Diese Unterlage trennt ausgeführte technische Prüfungen von
persönlicher Freigabe und tatsächlicher Abstimmung. Offene Felder sind keine
Behauptung einer bereits erfolgten Bestätigung.

## Technischer Nachweis und verbleibende Grenze

- Messreihe: [25 unveränderte Läufe](./evidenz/1A/reihe-2026-11-12/),
  fünf Blöcke mit V0–V4, eigene unveränderte Baseline.
- Ergebnis: [Auswertung und Entscheidung](./1A-auswertung.md), 80 Vergleiche,
  H1/H2 nicht bestätigt; `NLP_ENABLED=false` beibehalten.
- Prüfungen: [ursprünglicher Abschlussstand](./evidenz/1A/auswertung/pruefungen.json)
  und [Nacharbeit](./evidenz/1A/nacharbeit/README.md) sind historisch;
  der aktuelle Umfang nach dem Verwerfen sachfremder Korrekturen steht in der
  [Bereinigungsprüfung](./evidenz/1A/bereinigung/README.md).
- Compose: [gekennzeichnete Rekonstruktion](./evidenz/1A/compose-rekonstruktion/README.md)
  aus Baseline, unverändertem Aufbauhelfer und Image-IDs, mit Abgleich der
  aufgezeichneten Manifestfelder. **Die damals nicht gespeicherte aufgelöste
  Compose-Ausgabe bleibt als zeitgenössischer Nachweis fehlend.** Die
  Rekonstruktion ist eine transparente Ergänzung; eine ausdrückliche Forderung
  nach damaliger Aufnahme kann nur durch Anerkennung dieser Ergänzung oder
  eine neue, gesonderte Messreihe erfüllt werden. Rohmessungen und Vertrag
  werden dafür nicht nachträglich umgeschrieben.

## Persönliche fachliche Gegenprüfung

Niklas prüft die folgenden Punkte selbst und dokumentiert anschließend die
tatsächliche Bestätigung. Die vorhandenen automatisierten Tests ersetzen
diese persönliche Prüfung nicht.

- [ ] Einen Vergleich in `live-vergleiche.csv` anhand der Rohstichproben
      nachvollzogen: aufsteigend sortieren, Rang `ceil(0.95 × n)`, anschließend
      relative **und** absolute Grenze vor Rundung prüfen.
- [ ] Erklärt, warum 4/20 H1- und 6/40 H2-Verletzungen trotz niedriger absoluter
      Latenzen keine Freigabe nach dem vorab festgelegten Vertrag ergeben.
- [ ] Erklärt, warum V4 mit `forwarded: 0` Timeout/Rückstau/Fallback untersucht
      und keine langsam rechnende spaCy-Inferenz nachweist.
- [ ] CPU-Limit als Obergrenze, nicht als Reservierung erklärt; RAM-Lebenszeitpeak
      einschließlich Aufwärmung und CPU-Drosselungsquote auseinandergehalten.
- [ ] Gültigkeitsgrenzen geprüft: WSL2, gemeinsamer Lastgenerator-/Dockerhost,
      Beitrittswelle, synthetischer Wortschatz, kein Rendering-/LLM-Nachweis.
- [ ] Kosten-/Betriebsfolge und lexikalische Gegenalternative fachlich vertreten.
- [ ] [Handout und Folien](./abgabe/README.md) vollständig gelesen und anhand
      der Messdaten, Quellen und tatsächlichen Prüfungsanforderungen freigegeben.

**Persönlich geprüft von / Datum / Anmerkungen:** noch offen.

## Gemeinsame Artefakte für 1B und 1C

| Artefakt           | Version und Vertrag                                                                                                                                       | Übergabezweck                                                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Gemeinsame Fixture | `scripts/load/fixtures/resource-isolation-v1.manifest.json`; Seed `438314513`, SHA-256 `da24eeb3db1f7e08399583f527bf5f889ccb98cddd67fd0be84ec0e4dea17ded` | Sechs Referenzfragen plus Gegenfälle; Originalzustand und A1-Analyseprojektion gemäß [Fixture-Dokumentation](./1A-fixture.md) unterscheiden.   |
| Live-Messung       | `scripts/load/artillery/processor.mjs`, `scripts/load/lib/artillery-live-messungen.mjs`; [Messvertrag](./1A-live-messungen.md)                            | Roh-Laufzeiten, p50/p95/p99, Fehler und geplante Arbeit für Beitritt, Quiz, Q&A und Tempo; keine dauerhafte 500-Client-Parallelität behaupten. |
| Analyse-Last       | `scripts/load/host-analyze-loop.mjs`; [Anleitung](./1A-analyse-last.md)                                                                                   | Reguläre Host-Autorisierung, getrennte Sessions und konstanter Korpus; keine Tokens in Übergabeunterlagen.                                     |
| A1-Ergebnisse      | Baseline `8f91e0417bc5aace461c3644a0b6b26c9284035b`, [Auswertung](./1A-auswertung.md)                                                                     | Als A1-Nachweis zitieren; keine Messung der privaten LLM-Rolle oder des vollständigen 1C-Kontextpfads.                                         |

- [ ] Jonas hat die benötigten Artefakte erhalten und die tatsächlich verwendete
      Version beziehungsweise den Commit festgehalten.
- [ ] Unterschiede zur eigenen 1C-Fixture
      `apps/backend/src/__tests__/lib/qa-summary-pg-fixture.ts` aus Issue #10/PR #12
      gemeinsam abgeglichen: Statusprojektion, Raumgröße, Bewertungen und Hash.
- [ ] Übernommene Tabellen, Skripte und Daten in beiden Arbeiten als gemeinsam
      beziehungsweise übernommen gekennzeichnet.
- [ ] Gruppensynthese abgestimmt; Niklas' 1B-Schritte 3–4 gesondert nachgewiesen.

**Tatsächliche Abstimmung mit / Datum / verwendete Revisionen:** noch offen.
Diese Datei wurde nicht an andere Personen versendet.

## KI- und Quellenkennzeichnung

OpenAI Codex hat Implementierung, Tests, Messausführung, Berechnung und
Dokumententwürfe agentengestützt erstellt. Die Modellbezeichnung wurde in den
Entwürfen als »GPT-6 laut Agentenumgebung« offengelegt; ein externes
Modellprotokoll wird damit nicht behauptet. Frühere Recherchedossiers sind
bereits als mit Claude Code erstellt gekennzeichnet.

Wesentliche Aufträge aus diesem Chat, **sinngemäß zusammengefasst**:

1. Projekt, Serena-Memories und GitHub-Issue für A1 prüfen, keine vorhandenen
   Funktionen oder Messwerte annehmen und zunächst einen Plan vorlegen.
2. Sieben Schritte einzeln umsetzen, Änderungen erklären, Nachprüfbarkeit und
   deutsche Conventional-Commit-Nachrichten liefern.
3. Vollständige reale Messreihe nach Unterbrechung sauber neu beginnen und
   bestehende abgebrochene Nachweise getrennt erhalten.
4. Ergebnisse nach unveränderten Kriterien auswerten, Gesamtübersicht,
   Abgabeentwürfe und Eigenanteil dokumentieren.
5. Produktionsbezug und offene Anforderungen erneut auditieren sowie Compose-
   Nachweis, Dokumentation, Review und Übergabe vervollständigen.

Substanziell übernommene Beiträge und Git-Prüfgrundlage stehen im
[Eigenanteilsnachweis](./1A-eigenanteil.md). Keine ausschließlich manuelle
Erstellung durch Niklas wird behauptet.

- [ ] Erlaubten KI-Umfang, Zitierweise und erforderliche Erklärung anhand des
      tatsächlichen Prüfungsauftrags/myCampus bestätigt.
- [ ] Literatur-/Systemaussagen und alle übernommenen Messwerte persönlich geprüft.
- [ ] Prüfungsdatum, Empfänger, Dateinamen und Abgabefrist geprüft; final freigegebene
      PDFs tatsächlich eingereicht.

## GitHub-Abschluss

Die [vorbereitete PR-Beschreibung](./1A-pr-beschreibung.md) folgt dem vollständigen
Repositorytemplate. Der unabhängige Reviewstand wird im Nacharbeitsnachweis
festgehalten; für den bereinigten Diff steht eine erneute unabhängige Prüfung
noch aus. Die lokale PR-Vorlage lässt diese Freigabe bewusst offen. Ein Review
durch einen Agenten ist keine persönliche
Abgabefreigabe und kein institutioneller Prüfbescheid.

- [ ] Abschlussänderungen von Niklas geprüft und committet/gepusht.
- [ ] PR gegen Fork-`main` erstellt, Vorlagengate und erforderliche Checks geprüft.
- [ ] Verbleibende Nachweisgrenze der Compose-Rekonstruktion ausdrücklich bewertet.
- [ ] PR tatsächlich gemergt; erst dann Merge-Akzeptanzkriterium als erfüllt ausweisen.

**PR / Abschlusscommit / Merge:** noch offen.

Am 13.11.2026 im Chat bestätigt: Niklas übernimmt Commit und Push selbst;
die PR wird hier ausschließlich lokal vorbereitet. Persönliche Gegenprüfung,
KI-/Abgabevorgaben und Abstimmung mit Jonas sind noch nicht erfolgt.

Nach eigenem Commit und Push kann Niklas die vorbereitete Datei direkt verwenden:

```bash
gh pr create --repo NiklasSkulll/arsnova.eu \
  --base main --head feature-1A-resource-isolation \
  --title "feat(load): A1-Ressourcenisolation auswerten und dokumentieren" \
  --body-file docs/referat-thema-1/1A-pr-beschreibung.md
```

Diesen Befehl hat der Agent nicht ausgeführt. `Closes #6` ist bereits im Text
enthalten. Vor einem Merge sind CI-Status, verbleibende Nachweisgrenze und die
persönlichen beziehungsweise institutionellen Freigaben ausdrücklich zu prüfen.
