# Eigenanteil Jonas Weirauch: 1C-Diagramme (PR #11)

Ergebnis von [`final-prompt-for-git-diff.md`](../final-prompt-for-git-diff.md), unverändert übernommen.

- **Lauf:** 2026-10-23, Claude Code (Claude Opus 5.5) in einer frischen, nur lesenden Sitzung.
- **Branch und PR:** `feature-1C-diagrams@e595edcb`, Draft-PR [#11](https://github.com/NiklasSkulll/arsnova.eu/pull/11).
- **Nachträglich behoben:** Der unter „Offen“ genannte Satzfehler in Befund 1 ist im Folge-Commit korrigiert. Alle übrigen offenen Punkte gelten weiter.

## Eigenanteil

### Aufgabe und Beitrag

- **Aufgabe:** 1C – Diagramme und Codebelege zum Kontextpfad der Moderationszusammenfassung (Issue #10, Teil Dokumentation). Rolle Y (Jonas Weirauch) nach `docs/referat-thema-1/01-aufteilung.md`, Abschnitt „Entscheidung (2026-10-23)“: Y = 1C vollständig, 1B Schritte 1–2.
- **Änderungen und Zweck:** Der Branch enthält nur Dokumentation. Code, Tests und Konfiguration bleiben unverändert (`git diff origin/main...HEAD -- apps libs prisma docker` ist leer).
  - **Abbildungen:** Neues Dokument `docs/referat-thema-1/1C-diagrams.md` (275 Zeilen) mit fünf Abbildungen zum Kontextpfad der Zusammenfassung V2. Der Pfad reicht vom Host-Aufruf über den Kontextaufbau mit acht Autorisierungsgrenzen, Packing, `snapshotHash` und die versionierten Verträge V1/V2 bis zum privaten llama-server und zurück, einschließlich der Fallbacks.
    - Abb. 1 und 2 sind Handout-Abbildungen auf Deutsch: Struktur und UML-Sequenz.
    - A1 bis A3 sind Anhangsabbildungen auf Englisch: Arbeitskarte, Sequenz und Vertragsschichten.
  - **Belegtabellen im selben Dokument:**
    - Aufgabenabdeckung für 4.3, Punkte 1–4 (Z. 93–100).
    - Tabelle der #456-Bereiche (Z. 102–114).
    - Vorschau gegen gepackte Nutzlast (Z. 116–120).
    - Fehlende Kontextbereiche (Z. 122–126).
    - Belege je Station mit Datei:Zeile auf `248029dc` (Z. 128–184).
    - Fallback-Gründe nach Herkunft (Z. 186–211).
    - Sieben Befunde (Z. 213–240).
    - Unterschiede zu `v1.3.0` (Z. 242–255).
    - Abweichungen vom Dossier (Z. 257–264).
    - Methode und KI-Offenlegung (Z. 266–275).
  - **Diagrammquellen und Rendering:** `docs/referat-thema-1/diagrams/` enthält sieben `.mmd`-Quellen mit je einer hellen und einer dunklen SVG. Dazu kommen Palette und Theme sowie `render.sh`, das mermaid-cli 11.16.0 per Digest gepinnt in Podman ohne Netz rendert und in jede SVG einen Quell-Hash schreibt. `diagrams/README.md` beschreibt die Konventionen und die Prüfschritte. Zweck: Die Abbildungen lassen sich reproduzieren, und veraltete SVGs sind erkennbar.
  - **Verweis:** In `docs/referat-thema-1/README.md` steht eine neue Tabellenzeile für `1C-diagrams.md` (+8/−7).
- **Belege:** Alle drei Commits stammen von Jonas Weirauch (Autorzeit 2026-10-23).
  - `1628bf0a` „docs(referat): add 1C context path diagrams with code evidence“ (29 Dateien, +1134/−7).
  - `ff67c6c3` „docs(referat): add author name to 1C figures“ (nur `1C-diagrams.md`, +6/−6).
  - `e595edcb` „docs(referat): correct 1C diagrams after targeted review“ (13 Dateien, +39/−35).
  - Draft-PR NiklasSkulll/arsnova.eu#11, Autor `jonasyr`.
- **Gemeinschaftliche oder unklare Anteile:**
  - **KI-Unterstützung:** Codeverfolgung, Diagrammentwürfe, Text und beide Reviews entstanden laut `1C-diagrams.md` Z. 272–274 mit Claude Code (Claude Opus 5.5, Serena, codebase-memory-mcp). Den eigenen geistigen Anteil benennt das Dokument noch nicht: Z. 275 ist ein Platzhalter („[fill in before submission …]“).
  - **Übernommenes Rendering:** `render.sh` ist nach eigener Angabe aus `agent-loadout` übernommen und angepasst (Kommentar in Z. 4).
  - **Fremde Grundlage:** Das zugrunde liegende Dossier `1C-kontext-und-adapterpfad.md` und die Rahmendokumente gehören nicht zu diesem Branch. Ihre Autorschaft wurde hier nicht geprüft.

### Prüfgrundlage

- `feature-1C-diagrams@e595edcb8f13a2df57e181499e7d856295bb7ccf` gegenüber `origin/main@248029dcaafc5cb5273b0575fcc4bd5021b1da6a`. Der lokale Ref wurde ohne vorheriges `git fetch` verwendet.
- **Merge-Base:** `248029dcaafc5cb5273b0575fcc4bd5021b1da6a`, identisch mit `origin/main`. Der Branch liegt also drei Commits vor `main` und keinen dahinter. Das ist auch der Codestand, auf den sich alle Zeilenangaben in `1C-diagrams.md` beziehen.
- **Nicht committete Änderungen:** keine (`git status --short` ist leer).
- **Vorgaben und Aufgabendokumentation:**
  - **Gelesen:** `docs/referat-thema-1/00-rahmen-und-pruefung.md` (Pflicht-Nachweiskette, KI-Regeln, offene Baseline-Frage) und `docs/referat-thema-1/01-aufteilung.md` (Rollen X/Y, „Feste Regeln“).
  - **Abweichung 1:** Die Dokumentationsliste des Prompts nennt für 1C nur `1C-kontext-und-adapterpfad.md`. Tatsächlich geändert sind `docs/referat-thema-1/1C-diagrams.md` und `docs/referat-thema-1/diagrams/`. Das Dossier selbst ist auf diesem Branch unverändert. Laut `1C-diagrams.md` Z. 257–264 ist es auf `27966e75` geschrieben und in mehreren Punkten veraltet.
  - **Abweichung 2:** Die Aufgabe ist nicht vollständig abgeschlossen. Issue #10 (Experiment, Tests, Branch `feature-1C-context-path`) umfasst mehr als diesen Branch. Laut PR-Beschreibung folgen Test G1 und die Messreihen separat. Abgedeckt ist nur der Dokumentationsteil.
  - **Abweichung 3:** Die Baseline ist offen. `00-rahmen` verlangt den produktiven Release-Tag, die Diagramme beziehen sich aber auf `main` `248029dc` = `v1.3.0-228`, nicht auf `v1.3.0` (`87c39334`). Das ist offengelegt (`1C-diagrams.md` Z. 5–10, Z. 242–255), aber noch nicht mit dem Prüfer geklärt.
  - **Abweichung 4:** Die Aufteilung ist laut `01-aufteilung.md` noch nicht mit dem Prüfer abgestimmt.
  - **Abschlussdatum:** Die Autorzeiten liegen alle am 2026-10-23 zwischen 20:53 und 22:28 (+0200). Die Committer-Zeit ist bei allen dreien 23:49:25, die Commits wurden also neu geschrieben (Cherry-Pick auf den Doku-Branch). Abgeschlossen ist nur der Dokumentationsteil. Die PR ist ein Draft, und der CI-Lauf auf `e595edcb` lief zum Prüfzeitpunkt noch (siehe Tests).

### Anforderungsabgleich

- **4.3/1C Punkt 1 (Builder, Vorschau, Snapshot/Hash, Adaptervertrag; je #456-Bereich Quelle, Funktion, Schemaversion, Autorisierung): abgedeckt, nur als Dokumentation.** Belegt durch die Bereichstabelle (`1C-diagrams.md` Z. 102–114), A1 Bänder 3–5 und A3.
- **Punkt 2 (realer Job durch die versionierten Verträge, Vorschau gegen tatsächliche Nutzlast, interner Zustand gegen Kontext gegen Modellanfrage): teilweise abgedeckt.**
  - Vorhanden ist die statische Analyse: Vorschau gegen Nutzlast (Z. 116–120) und die Schichten in A3.
  - Es fehlt ein realer Lauf über die Runtime. Z. 271 sagt ausdrücklich: „All runtime statements are static code analysis. No tests were run“.
- **Punkt 3 (Erfolg, inkompatible Schemaversion, fehlender Bereich, langsamer Empfänger; kein stiller Feldverlust; Host wartet nicht): teilweise abgedeckt.**
  - Die Pfade sind im Code belegt: Befund 1 (Z. 215–217), fehlender Bereich (Z. 122–126), Fallback-Tabelle (Z. 186–203).
  - Es gibt keine ausgeführte Negativprobe und keinen Test G1.
- **Punkt 4 (Stimmenänderung oder Quellenlöschung zwischen Anfrage und Ergebnis; Hash-Grenze, erneute Quellenprüfung, Legacy- und Regel-Fallback): teilweise abgedeckt.**
  - Als Hypothese aus dem Code belegt: Befunde 3 und 5 (Z. 219–228) und die Trigger-Belege `MIG15` und `MIG18` (Z. 164–165).
  - Es fehlt ein Versuch, der die Hypothese prüft.
- **Individuelle Nachweiskette (00-rahmen „Pflicht-Nachweiskette“, 01-aufteilung „Feste Regeln“): durch diesen Branch nicht abgedeckt.** Der Branch liefert Grundlagenmaterial für die Argumentation, aber keine Hypothese mit Test, Baseline, Variante und Entscheidung. Details unter „Individuelle Beweiskette“.
- **KI-Offenlegung (00-rahmen „KI-Nutzung“): teilweise abgedeckt.** Agent, Modell, MCP-Server, zentrale Prompts und Datum sind genannt (Z. 272–274). Der Eigenanteil ist ein Platzhalter (Z. 275).
- **Prüfung jeder Systemaussage gegen die Primärquelle (00-rahmen): teilweise abgedeckt.**
  - **Laut Dokument:** Alle Stellen wurden gegen den Code geprüft, dazu kamen zwei KI-Reviews (Z. 269). Das ist dokumentiert, aber nicht von Menschen nachgewiesen.
  - **Von mir stichprobenartig erneut geprüft und passend:** `ST:14` (`qa-summary-model-output-v3`), `CL:446-447` (Referenzprüfung), `MSC:49` („omitted data is unknown“), `Q:524-539` (pending vor dem Modellaufruf), `Q:340-353` (Reihenfolge source_changed → timeout → bind), `FE:13557-13559` und `FE:13525-13527` (die Catch-Handler), `ST:55-57` (Grenzen 4/2/2). Weil der Branch keinen Code ändert, gelten die Zeilen auf HEAD gleich `248029dc`.
- **Repo-Regeln für reine Markdown-Änderungen (AGENTS.md „Validation“): abgedeckt, von mir erneut ausgeführt.**
  - `npx prettier --check` auf `1C-diagrams.md`, `README.md` und `diagrams/README.md`: „All matched files use Prettier code style!“.
  - `git diff --check origin/main...HEAD`: Exit-Code 0.
- **Diagrammprüfung laut `diagrams/README.md` („Render and check“): teilweise erneut geprüft.**
  - `grep -l "Syntax error" docs/referat-thema-1/diagrams/*.svg` liefert keinen Treffer.
  - Bei allen 14 SVGs passt der eingebettete `diagram-source sha256` zu aktueller Quelle, Palette, Theme, `render.sh` und Image. Die SVGs sind also aktuell.
  - Nicht erneut geprüft habe ich das Rendern selbst und die Sichtprüfung im Browser bei hell und dunkel. Die Sichtprüfung ist nur dokumentiert (Z. 270).
- **PR-Template (AGENTS.md „Review Readiness“): offen.** Die Prüfung „PR-Template vollständig“ steht auf `skipping`, vermutlich weil die PR ein Draft ist. Die Beschreibung folgt dem Aufbau des Templates, wurde hier aber nicht vollständig gegen `.github/pull_request_template.md` geprüft.

### Tests

- **Tests:** Dieser Branch enthält keine neuen oder geänderten Tests. `1C-diagrams.md` Z. 271 bestätigt, dass für die Seite keine Tests liefen. Erneut ausgeführt habe ich nur Doku-Prüfungen: Prettier-Check, `git diff --check`, die Suche nach „Syntax error“ in den SVGs und den Abgleich der SVG-Quell-Hashes.
- **Status:** Die Doku-Prüfungen habe ich auf `e595edcb` erneut ausgeführt. Die CI habe ich mit `gh pr checks 11` abgefragt, nicht lokal ausgeführt.
- **Ergebnis:**
  - Alle lokalen Doku-Prüfungen sind bestanden (Commit `e595edcb`).
  - Der CI-Lauf 40029901040 auf `e595edcb` stand zum Prüfzeitpunkt auf `in_progress`.
    - **Bestanden:** u. a. Build & Validate (Node 22/24), Tests, Typecheck (22/24), Chromium Smoke E2E, WebKit MOTD & Tab E2E, Migration Drift, Security Audit, Trivy, Docker Build, Lighthouse CI und Workflow Lint. Die Laufzeiten von 3–24 s deuten darauf hin, dass der Change-Filter reine Doku-Änderungen abkürzt; vollständige Testläufe waren das vermutlich nicht.
    - **Noch `pending`:** Changed Files Format, lint, Playwright Smoke E2E, Classroom Scenario Smokes und CodeQL.
    - **`skipping`:** PR-Template vollständig, k6, Artillery 500 Live Session, Artillery 500 Reconnect Wave und Publish Scanned Image.
  - Ein vollständig grünes CI-Ergebnis ist damit nicht belegt.

### Individuelle Beweiskette

- **Hypothese:**
  - **Lücke im Branch:** Eine formal festgehaltene, überprüfbare Hypothese fehlt.
  - **Kandidaten:** `1C-diagrams.md` Befunde 1–3 (Z. 215–225) und Issue #10 (B1, B2, B6) liefern prüfbare Kandidaten, z. B. „Bei aktivem Voting endet eine Modellantwort meist als `source_changed`.“
- **Gegenhypothese:** Lücke. Eine ernsthafte Gegenalternative ist nicht dokumentiert.
- **Eigener ausführbarer Test:**
  - **Lücke:** Dieser Branch enthält keinen Test.
  - **Laut PR #11:** Test G1 ist auf `feature-1C-context-path` geplant. Diesen Branch, der lokal existiert, habe ich nicht geprüft.
- **Eigener Baseline-Lauf:** Lücke. Es gibt keinen Lauf, und die Baseline (`v1.3.0` gegen `main`) ist noch nicht geklärt (`00-rahmen` „Offene Fragen“ 3).
- **Fehler/Variante:** Lücke. Variante und Störung sind nur aus dem Code abgeleitet (Fallback-Tabelle Z. 186–203, Befund 4). Ein Versuch fehlt.
- **Ergebnis mit Gültigkeitsgrenze:**
  - **Für ein Messergebnis:** Lücke.
  - **Für die statische Analyse vorhanden:** Die Grenzen der Analyse sind angegeben, nämlich Codestand `248029dc` statt `v1.3.0` (Z. 5–10, 242–255), reine statische Codeanalyse (Z. 271) und Deployment-Angaben nur laut ADR-0035 und Runbook.
- **Entscheidung:** Lücke. Es gibt keine Entscheidung zu Beibehaltung, Konfiguration, Betrieb oder Verbesserung mit Kosten-, Risiko- oder Betriebsfolge.

### Offen

- **Technisch:**
  - Der CI-Lauf auf `e595edcb` ist noch nicht abgeschlossen: lint, Changed Files Format, Playwright Smoke E2E, Classroom Scenario Smokes und CodeQL stehen auf `pending`.
  - Die PR ist ein Draft, deshalb lief „PR-Template vollständig“ nicht.
  - Für die Abbildungen selbst ist technisch nichts offen. Die SVGs sind aktuell und frei von Syntaxfehlern. Die Sichtprüfung habe ich nicht erneut gemacht.
- **Dokumentation und Prüfungsnachweise:**
  - **KI-Offenlegung:** Den Platzhalter zum Eigenanteil in `1C-diagrams.md` Z. 275 vor der Abgabe ausfüllen.
  - **Satzfehler in Befund 1:** In Z. 216 ist der Satz „…does not trigger it, and a schema violation with INTERNAL_SERVER_ERROR.“ grammatisch unvollständig. Gemeint ist vermutlich „…ends with INTERNAL_SERVER_ERROR“.
  - **Veraltetes Dossier:** `1C-kontext-und-adapterpfad.md` ist gegenüber `248029dc` veraltet (Z. 257–264). Es verweist nicht auf `1C-diagrams.md`, und die Dokumentationsliste im Prompt nennt die neue Datei nicht.
  - **Baseline:** Mit dem Prüfer klären. Die Diagramme gelten für `main` `248029dc`, nicht für `v1.3.0`.
  - **Nachweiskette:** Die vollständige individuelle Nachweiskette fehlt: Hypothese, Gegenhypothese, eigener Test (G1 u. a.), Baseline-Lauf, Variante, Befund mit Grenze und Entscheidung. Ebenso fehlt der reale Runtime-Lauf (1C Schritt 2 und 1B Schritte 1–2). All das ist auf `feature-1C-context-path` bzw. in Issue #10 geplant.
  - **Evidenzordner:** `docs/referat-thema-1/evidenz/` existiert noch nicht.
  - **Abstimmung mit dem Prüfer:** Die Aufteilung und der Umfang der PR an kqc-real sind noch nicht abgestimmt (`01-aufteilung.md`; `00-rahmen` offene Fragen 1–2).

### Leistungsnachweis

- Ich habe den Kontextpfad der Moderationszusammenfassung V2 vom Host-Aufruf bis zur privaten Inferenz in fünf reproduzierbar gerenderten Abbildungen dargestellt und jede Station mit Datei:Zeile auf `248029dc` belegt. Daraus habe ich sieben überprüfbare Befunde abgeleitet (Commits `1628bf0a`, `ff67c6c3`, `e595edcb`). Code-Tracing und Entwürfe waren KI-gestützt; das ist offengelegt.
- Das Ergebnis ist eine statische Analyse und dient als Grundlage für Hypothesen und Tests in 1C. Eine eigene Nachweiskette mit Test, Baseline-Lauf und Entscheidung ist damit noch nicht erbracht.
