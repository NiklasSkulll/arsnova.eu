# Design: 1C Laborlauf – Kontextpfad bis zur ausgelieferten privaten Runtime

> **Entwurf – nicht freigegeben; Freigabe durch den Autor vor dem Lauf.** Hypothesen,
> Kriterien, Wiederholungen und Entscheidungsregeln gelten erst nach dieser Freigabe als vorab
> festgelegt. Bis dahin ist nichts gemessen; ein Trockenlauf gegen die Test-Runtime (Abschnitt 10)
> prüft nur das Messwerkzeug.

- **Stand:** 2026-10-25
- **Autor:** Jonas Weirauch (Rolle Y)
- **Issue:** [#10](https://github.com/NiklasSkulll/arsnova.eu/issues/10), Schritt 2
- **Branch:** `feature-1C-context-path`
- **Codebasis:** offen (Abschnitt 11, Frage P1). Werkzeug geschrieben auf `main` `248029dc` plus diesem Branch.
- **Vorgänger:** [Teil 2](2026-10-24-1c-teil2-design.md) (E1–E9, M1–M5, V1), [Teil 3](2026-10-24-1c-teil3-design.md) (E10–E15, M6, M7). Fixture, Auswertung und Rollenlogik der Kontextaufbauten werden wiederverwendet.
- **KI-Nutzung:** Entwurf mit Claude Code (Abschnitt 12).

## 1. Zweck

Auftrag 1C, Punkt 2 (Prüfungsdokument 4.3) verlangt, einen realen Auftrag durch die versionierten Verträge **bis zur privaten Runtime** zu verfolgen und für denselben Revisionsstand Host-Vorschau und gepackte Nutzlast zu vergleichen. Issue #10, Schritt 2, ergänzt: Baseline nach Dossier §11.2, `messages[2]` gegen den kanonischen Kontext der Vorschau, `max_tokens`, und `usage.prompt_tokens` gegen `budget.packedInputTokens`.

Teil 2 und 3 haben das nur bis zu einer **Test-Runtime** auf 127.0.0.1 gezeigt (E1, E3, E15). Offen ist laut [`1C-diagrams.md`](../1C-diagrams.md#task-coverage-exam-document-43-1c) allein der Lauf gegen die ausgelieferte Runtime. Dieser Laborlauf ist die **unveränderte eigene Baseline** auf dem echten Releasepfad (4.1.3). Er liefert zugleich die reale Inferenzzeit, die Teil 2 nur durch D = 2000 ms ersetzt hat.

## 2. Ziele, Nicht-Ziele, Anti-Ziele

**Ziele**

- L1–L4 (Abschnitt 5) auf der Laborinstanz gegen die gepinnte Runtime, mit Rohdaten im Evidenzordner.
- Optional L5: Befund T3.1 (zeitabhängiger Hash bei live Blitzlicht-Runde) auf dem echten Pfad.
- Eine Einordnung der Entscheidungen aus Teil 2 und 3 mit realen Zeiten, nach vorab festgelegten Regeln.

**Nicht-Ziele**

- Keine Änderung am Produktivcode und keine Änderung am Vertrag; auch keine Negativprobe auf der echten Runtime (E4, E6, E10 bleiben bei der Test-Runtime).
- Keine Aussage über Prompt- oder Antwortqualität (Gültigkeitsgrenze 1C, Thema 2).
- Keine Last- oder Kapazitätsmessung (Thema 3) und keine Rückwirkung auf Liveaktionen (1A, 1B Schritte 3–4).
- Kein Modelllauf lokal oder gegen Produktion.

**Anti-Ziele**

- Den Trockenlauf gegen die Test-Runtime als Evidenz ausgeben.
- Ein Secret (Runtime-Token, `.env.llm`) in Rohdaten, Commits, Protokoll oder Prompts.
- Kriterien nach Sicht der Labordaten ändern, ohne das als nachträglich zu kennzeichnen.

## 3. Aufbau

### 3.1 Topologie

```text
Labor-App-Host (Firewall-Freigabe zu TCP 8080)          Labor-Inferenz-Host
┌───────────────────────────────────────────────┐        ┌──────────────────────────────┐
│ vitest: qa.summary-labor.pg.test.ts           │        │ open-weight-llm (Compose,    │
│  tRPC-Router → Queue → Kontextaufbau          │        │ docker-compose.llm.yml)      │
│  → Open-Weight-Client                         │        │ llama-server b10524,         │
│  → http://127.0.0.1:<p>  Aufzeichnungs-Proxy ─┼─ HTTP ─┼→ <privat>:8080, --api-key,   │
│ Postgres + Redis nur für den Lauf             │        │ Qwen3-4B Q4_K_M (SHA geprüft)│
└───────────────────────────────────────────────┘        └──────────────────────────────┘
```

- **Inferenz-Host:** die ausgelieferte Runtime unverändert, gestartet über `scripts/open-weight-llm/prod-compose.mjs` (`npm run llm:prod`) nach [OPEN-WEIGHT-LLM-SECOND-HOST-RUNBOOK.md](../../operations/OPEN-WEIGHT-LLM-SECOND-HOST-RUNBOOK.md): Digest-Image, `--parallel 1`, `--ctx-size 8192`, `--n-predict 768`, `--slots`, `--api-key` (`docker/open-weight-llm/entrypoint.sh`). Der Entry-Point prüft vor dem Start die SHA-256 der GGUF-Datei.
- **App-Host:** der Laufprozess (Vitest) mit dem Backend-Code des Referenzstands, echter tRPC-Router über `createCaller`, echte Queue, echter Kontextaufbau, echter Client, echtes HTTP. Gemockt ist nur die Host-Tokenprüfung, wie in allen E-Tests. Eigene PostgreSQL- und Redis-Instanz nur für den Lauf, nicht die Daten einer laufenden Laborinstanz.
- **Warum vom App-Host:** Laut Runbook §5/§11 darf nur der App-Host Port 8080 erreichen. Ein Lauf vom Laptop bräuchte eine Firewall-Ausnahme; das ändert die Topologie.
- **Beobachtung des rohen Bodys ohne Produktionseingriff:** Der Client wird per Env auf einen Proxy in `apps/backend/src/__tests__/lib/recording-proxy.ts` gerichtet. Loopback gilt im Client als privat (`isPrivateOpenWeightLlmAddress`). Der Proxy puffert Anfrage und Antwort, leitet **dieselben Bytes** weiter, setzt nur `host` auf die Runtime und entfernt hop-by-hop-Header. Er zeichnet beide Bodys, Zeitpunkte und SHA-256-Summen auf, vom `authorization`-Header nur „vorhanden“ und „entspricht dem erwarteten Token“. Weil der Client die Privatheitsprüfung jetzt gegen den Proxy macht, prüft die Harness die Runtime-URL selbst mit derselben Regel (nur private Adressen) und bricht sonst vor dem Lauf ab.
- **Gegenprobe ohne Proxy:** 5 Läufe direkt gegen die Runtime (nur Zeiten und Status), um den Zeitanteil des Proxys abzuschätzen.

**Alternative (nicht gewählt, Frage P3):** die laufende Labor-App selbst per `OPEN_WEIGHT_LLM_URL` auf einen Proxy richten und über die UI auslösen. Das prüft zusätzlich den gebauten Container und HTTP-tRPC, braucht aber einen Host-Token, eine Konfigurationsänderung der Laborinstanz und einen separaten Proxyprozess. Die Harness prüft denselben Code mit derselben Fixture wie Teil 2 und 3 und ist dadurch direkt vergleichbar.

### 3.2 Umgebungsvariablen

Nur Namen; Werte kommen aus der Laborumgebung, das Token aus dem Passwortmanager ([Runbook](../evidenz/1C/labor-runbook.md)).

| Variable                                                          | Pflicht         | Bedeutung                                                                                       |
| ----------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| `RUN_QA_SUMMARY_LABOR`                                            | ja (`1`)        | Opt-in; ohne Flag wird die Datei übersprungen                                                   |
| `DATABASE_URL`, `REDIS_URL`                                       | ja              | Lauf-eigene Datenbank (migriert auf den Referenzstand) und Redis                                |
| `QA_SUMMARY_LABOR_OUT`                                            | ja              | Zielpfad der JSON-Datei                                                                         |
| `QA_SUMMARY_LABOR_RUNTIME_URL`                                    | ja              | Basis-URL der Runtime, z. B. `http://<private-ip>:8080`; muss privat auflösen                   |
| `QA_SUMMARY_LABOR_RUNTIME_TOKEN`                                  | ja              | Bearer-Token der Runtime (32–512 URL-sichere Zeichen); wird nicht aufgezeichnet                 |
| `QA_SUMMARY_LABOR_BASELINE`                                       | empfohlen       | Bezeichnung des Referenzstands, z. B. `v1.3.0` oder `main@<sha>`                                |
| `QA_SUMMARY_LABOR_GIT_SHA`, `…_GIT_DIRTY`                         | empfohlen       | Commit des Laufprozesses und ob der Checkout sauber war                                         |
| `QA_SUMMARY_LABOR_RUNTIME_IMAGE`                                  | empfohlen       | Digest-Referenz des laufenden Runtime-Images (vom Inferenz-Host abgelesen)                      |
| `QA_SUMMARY_LABOR_MODEL_SHA256`                                   | empfohlen       | `sha256sum` der GGUF-Datei auf dem Inferenz-Host; wird gegen `OPEN_WEIGHT_LLM_MODEL_ID` geprüft |
| `QA_SUMMARY_LABOR_RUNS`, `…_WARMUP`, `…_DIRECT_RUNS`, `…_L5_RUNS` | nein            | Standard 20, 1, 5, 0; Abweichungen nur für Trockenläufe, im JSON vermerkt                       |
| `QA_SUMMARY_LABOR_FAKE_RUNTIME`                                   | nur Trockenlauf | `1` startet die In-Prozess-Test-Runtime statt der echten; JSON `dryRun: true`                   |

Die Harness setzt für den Prozess selbst: `OPEN_WEIGHT_LLM_ENABLED=true`, `OPEN_WEIGHT_LLM_URL` = Proxy, `OPEN_WEIGHT_LLM_TOKEN` = Runtime-Token, `QA_SUMMARY_ENABLED=true`, `WORD_CLOUD_SEMANTIC_ENABLED=false` (L5: `true`), `QA_SUMMARY_TIMEOUT_MS` und `OPEN_WEIGHT_LLM_SUMMARY_TIMEOUT_MS` = 90 000 ms (Release-Standard am Werkzeugstand). Fehlt eine Pflichtvariable, bricht der Lauf vor jedem Auftrag mit einer Liste ab.

### 3.3 Referenzstand und Manifest

Aufgezeichnet wird, was den Stand eindeutig macht:

| Was                                              | Quelle                                                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Commit und Bezeichnung des Laufprozesses         | `QA_SUMMARY_LABOR_GIT_SHA`, `…_BASELINE`, `…_GIT_DIRTY`                                                                   |
| Gepinnte Erwartung im Code                       | `OPEN_WEIGHT_LLM_MODEL_ID` (GGUF-SHA), `OPEN_WEIGHT_LLM_MODEL_VERSION` (`llama:server-b10524`)                            |
| Runtime-Image und GGUF-Prüfsumme                 | vom Betreiber auf dem Inferenz-Host abgelesen (`docker inspect`, `sha256sum`) und per Env übergeben                       |
| Build, Modellpfad, Kontextgröße, Slots, Template | `GET /props`: `build_info`, `model_path`, `default_generation_settings.n_ctx`, `total_slots`, SHA-256 von `chat_template` |
| Modellkennung                                    | `GET /v1/models`: `data[].id` (Alias) und `meta`; je Antwort `model` und `system_fingerprint`                             |
| Unverändertheit während des Laufs                | dieselben Abrufe vor und nach dem Lauf; die Auswertung vergleicht sie                                                     |

Geprüft: Feldnamen von `/props`, `/v1/models`, `usage` und `timings` laut llama.cpp-Server-README (Context7, Stand `master`). Für b10524 belegt die protokollierte Modellprüfung vom 2026-10-05 in [`open-weight-llm-runtime.md`](../../features/open-weight-llm-runtime.md#vollständig-protokollierte-lokale-modellprüfung-vom-2026-10-05) `usage`, `timings` und `system_fingerprint` (`b10524-9ee9fc04c`) und dass `usage.prompt_tokens` den Cache einschließt (143 = 142 aus dem Cache + 1). Die Felder von `/props` und `/v1/models` sind für b10524 **nicht** geprüft; fehlende Felder werden als `null` aufgezeichnet. Keine API liefert die GGUF-Prüfsumme; deshalb die Betreiberangabe plus die SHA-Prüfung des Entry-Points.

**v1.3.0 oder `main`:** offen (Frage P1). Die Harness läuft am Werkzeugstand (`main` + Branch). Für `v1.3.0` (`87c39334`) müsste sie zurückportiert werden: Dort fehlen `resolveEffectiveQaSummaryTimeoutMs` und das Trimmen, `--ctx-size` ist 4096, der Standard-Timeout 8000 ms ([Unterschiede](../1C-diagrams.md#differences-to-v130)). Das Ergebnis gilt nur für den Stand, der im JSON steht.

## 4. Ablauf

Je Lauf, nacheinander:

1. Neue Referenzfixture (#456 Abschnitt 12: sechs Fragen, N = 200, 282 Stimmen), wie in Teil 2. **Neu je Lauf**, weil llama-server den Prompt-Präfix cacht (Modellprüfung 2026-10-05: 142 von 143 Tokens aus dem Cache). Mit neuen Quellen-IDs ist nur der gemeinsame System-Präfix cachebar, wie im Betrieb.
2. Queue und Client zurücksetzen (Zähl- und Zeit-Wrapper um den echten Kontextaufbau; Circuit-Breaker je Lauf isoliert).
3. `qa.summaryContextPreview`, dann sofort `qa.requestSummary` (Zeit `requestMs`), Jobende ohne Kontextaufbau im 5-ms-Takt (`jobDoneMs`), dann genau ein `qa.summaryRuntime` (`totalMs`).
4. Proxy-Aufzeichnung des Laufs übernehmen.

**Wiederholungen:** 1 verworfener Aufwärmlauf, n = 20 Messläufe (L1–L4), danach 5 Läufe ohne Proxy, optional L5 mit 5 Läufen je Arm (abwechselnd, Reihenfolge je Iteration getauscht). Begründung n = 20: wie M1/M2; bei 0 von 20 Ereignissen reicht das Wilson-Intervall bis 16,1 %, das genügt für „kein systematisches Auftreten“, nicht für seltene Ereignisse.

**Ruhebedingung:** Während des Laufs nutzt niemand die Runtime (ein Slot; schon die Statusprobe der App belegt ihn bis zu 20 + 90 + 20 s, Dossier 1B). Die Labor-App bleibt ohne Nutzer oder mit `OPEN_WEIGHT_LLM_ENABLED=false`; vor dem Start meldet `/slots` den Slot frei.

**Erwartete Dauer** (Schätzung, keine Hypothese): Die Modellprüfung vom 2026-10-05 lief mit etwa 56 Prompt-Tokens/s und 28–31 Ausgabe-Tokens/s (Hardware dort nicht angegeben). Bei geschätzt 2000–2800 Prompt-Tokens (6855 Byte gepackt, 2,5–3,5 Byte je Token) und 100–250 Ausgabe-Tokens wären das 40–60 s je Auftrag, also 30–45 min für alle Läufe ohne L5 und 10–15 min für L5. Liegt die Inferenz über 90 s, enden Läufe mit `timeout` (L4).

## 5. Fälle

Alle Kriterien beziehen sich auf die Messläufe ohne Aufwärmlauf, ausgewertet mit [`messung/auswertung.mjs`](../evidenz/1C/messung/auswertung.mjs) (Schlüssel `labor`).

| Nr. | Frage                                                                                          | H                                                                                                                                                                                                                                                            | G                                                                                            | K                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| L1  | Ist die Nutzlast, die die Runtime erhält, für denselben Revisionsstand die Vorschau? (G8)      | E1 gilt auch auf dem echten Pfad.                                                                                                                                                                                                                            | Ein Feld fehlt, ist zusätzlich oder anders; ein anderer Hash; der Proxy verändert Bytes.     | In **jedem** Lauf: (1) Hash Vorschau = Hash prepare (2) = Hash des gespeicherten Ergebnisses; (2) `messages[2]` bytegleich `canonicalModerationPromptJson(preview.promptContext.context)`; (3) Rollen `system, system, user` mit Instruktions- und Definitionstext; (4) `max_tokens` = `budget.reservedOutputTokens` (640); (5) die acht obersten Schlüssel wie E2; (6) weitergeleitete Bytes = empfangene, Token wie erwartet.                        |
| L2  | Wie stark überschätzt die Byte-Schätzung die echten Prompt-Tokens?                             | Die Schätzung ist konservativ: q = `usage.prompt_tokens` / `budget.packedInputTokens` ≤ 1 in jedem Lauf. Erwartet (keine Schwelle): Median q etwa 0,3–0,4.                                                                                                   | q > 1 in mindestens einem Lauf.                                                              | max q ≤ 1. Keine Toleranz: Die Schätzung zählt UTF-8-Bytes (`estimateModerationPromptUtf8Tokens`), und ein Byte-BPE-Token deckt mindestens ein Byte ab. Nicht mitgezählt sind die Template-Tokens der drei Nachrichten (Rollenmarker, Assistent-Präfix, Größenordnung 10–30), die gegen Tausende Bytes Spielraum vernachlässigbar sein sollten. Berichtet: Median q mit Bootstrap-Intervall, Bytes je Token, `prompt_tokens` = `prompt_n` + `cache_n`. |
| L3  | Wartet der Host auf dem echten Pfad nicht auf das Modell, und wie lang ist die reale Inferenz? | (a) Rückkehrzeit wie M1: Median und p95 von `requestMs` < 1000 ms, und die längste Rückkehr ist kürzer als der kürzeste Runtime-Austausch. (b) Erwartet (keine Schwelle): reale Inferenzzeit (`timings.prompt_ms + predicted_ms`) deutlich über D = 2000 ms. | `requestMs` wächst mit der Inferenz oder überschreitet 1000 ms.                              | K_L3a wie H (a). Berichtet: Median, p95, Bootstrap-Intervall für `requestMs`, `jobDoneMs`, `totalMs`, Proxy→Runtime-Zeit, Inferenzzeit, Netz- und Serveranteil (Proxy-Zeit − Inferenzzeit), Dauer jedes Kontextaufbaus nach Rolle, Fenster zwischen prepare (2) und (3).                                                                                                                                                                               |
| L4  | Welche Endstatus liefert der echte Pfad ohne Datenänderung?                                    | Kein `source_changed` ohne Datenänderung; der Anteil mit `full-context` ist hoch.                                                                                                                                                                            | `source_changed` ohne Datenänderung (wie T3.1), oder Modellantworten scheitern systematisch. | k(`source_changed`) = 0 von n. Berichtet: Verteilung gespeichert und Host-Sicht (`status/effectiveMode/fallbackReason`), Anteil `full-context` mit Wilson-Intervall, je Antwort die nachvollzogene Prüfstufe wie `parseCompletion` (`ok`, `invalid_model_json`, `output_schema`, `question_references`), `finish_reason`.                                                                                                                              |
| L5  | Optional: Tritt Befund T3.1 auf dem echten Pfad auf?                                           | Mit live `YESNO`-Runde endet jeder Auftrag `source_changed`, mit `TEMPO`-Runde keiner.                                                                                                                                                                       | Mit `YESNO` endet mindestens ein Auftrag ohne `source_changed`, oder `TEMPO` liefert eines.  | k(YESNO) = n und k(TEMPO) = 0 bei n = 5 je Arm. Berichtet zusätzlich L2 für den vollen Kontext und die Bereiche (`available` je Bereich, Kürzungen).                                                                                                                                                                                                                                                                                                   |

L1 ist die Kontrolle für L4: Ohne gleichen Hash in L1 wäre ein `ready` in L4 nicht an den Stand der Vorschau gebunden. Mutationsproben entfallen: Prüfgegenstand und Kriterien sind dieselben wie E1/E2 (Teil 2), deren Mutationsproben bestehen; neu ist nur die Runtime.

## 6. Entscheidungsregeln

| Ergebnis                                          | Entscheidung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K_L1 erfüllt                                      | **Beibehaltung** von Vorschau und Packing (`getQaSummaryContextPreview`, `buildChatCompletionBody`): Teil-2-Befund E1 gilt auf dem Releasepfad. Akzeptanzkriterium „Vorschau gegen gepackte Nutzlast für denselben Revisionsstand“ erfüllt.                                                                                                                                                                                                                                                                                                          |
| K_L1 verfehlt                                     | Befund mit erster Abweichung (Byte-Index, Prüfung). Keine Empfehlung, bevor die Ursache geklärt ist (Code, Proxy oder Runtime).                                                                                                                                                                                                                                                                                                                                                                                                                      |
| K_L2 erfüllt, Median q ≤ 0,5                      | Befund: Die Schätzung ist sicher, verschenkt aber mindestens die Hälfte des Fensters. Bezug E15: Dort fielen Blitzlicht, freigegebene Ergebnisse und Kompass beim Packen aus Budgetgründen heraus. **Verbesserung prüfen** (nicht umsetzen): exakte Tokenzählung über die Runtime oder kalibrierter Faktor mit Marge; Kosten und Risiko benennen. Ob die verworfenen Bereiche tatsächlich passen würden, zeigt dieser Lauf nicht.                                                                                                                    |
| K_L2 erfüllt, Median q > 0,5                      | **Beibehaltung** der Byte-Schätzung mit dokumentiertem Faktor.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| K_L2 verfehlt                                     | Befund: Die Schätzung ist nicht konservativ. Empfehlung prüfen: größere Sicherheitsmarge oder exakte Zählung; Kopffreiheit `prompt_tokens + max_tokens` gegen `n_ctx` angeben.                                                                                                                                                                                                                                                                                                                                                                       |
| K_L3a erfüllt                                     | **Beibehaltung** der Entkopplung (Entscheidung 3, Teil 2) auf dem echten Pfad bestätigt; Grenze Befund 1 (Host wartet auf den Kontextaufbau) bleibt.                                                                                                                                                                                                                                                                                                                                                                                                 |
| K_L3a verfehlt                                    | Befund; Entscheidung 3 aus Teil 2 neu prüfen.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Neubewertung Entscheidung 1 (Teil 2, prepare (3)) | Ersparnis von V1 auf der Laborhardware = Median der Dauer von prepare (3); Anteil s = Median(prepare (3)) / Median(`totalMs`) mit Bootstrap-Intervall. Obergrenze < 5 % → Entscheidung 1 auf der Kostenseite bestätigt. Punktschätzung ≥ 5 % → Entscheidung 1 nach Zeile 3 der Teil-2-Regel neu prüfen. Dazwischen: nicht trennbar; Entscheidung 1 bleibt, weil sie sich vor allem auf Risiken stützt. Die Schwelle 1,5–2,1 s aus Teil 2 wird nur berichtet; sie beruht auf lokalen Kontextkosten, maßgeblich ist die Messung auf der Laborhardware. |
| L4: k(`source_changed`) > 0                       | Befund „Hash ändert sich ohne Datenänderung“ wie T3.1; Prepare-Hashes je Lauf auswerten.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| L4: Anteil `full-context` < 80 % (Punktschätzung) | Den häufigsten Grund als Befund mit Verbesserungskandidat benennen: `invalid_response` mit Prüfstufe `output_schema` → Abgleich der vier Ausgabegrenzen (Befund 6); `timeout` → Timeout-Grenze; nichts umsetzen. Sonst **Beibehaltung**.                                                                                                                                                                                                                                                                                                             |
| L5 erfüllt                                        | Befund T3.1 auf dem echten Pfad bestätigt; Issue-Entwurf bleibt Kandidat, Anlegen nur mit Freigabe des Autors.                                                                                                                                                                                                                                                                                                                                                                                                                                       |

**M7 (Teil 3) bleibt unverändert.** Die Auswertung berichtet die Vorhersage 1 − e^(−0,5·T) mit dem gemessenen Fenster T zwischen prepare (2) und (3) nur informativ. Das Urteil „Zeile 3, Empfehlung zurückgestellt“ bleibt; eine neue Empfehlung bräuchte eine eigene, vorab festgelegte Messung (z. B. M7 mit D = gemessene Inferenzzeit).

## 7. Gültigkeitsgrenzen

- **Ein Laufprozess, nicht der ausgelieferte App-Container:** gleicher Backend-Code, aber über `createCaller` ohne HTTP-tRPC und mit gemockter Host-Tokenprüfung; eigene PostgreSQL/Redis-Instanz.
- **Proxy auf dem Pfad:** ein zusätzlicher Loopback-Hop mit Pufferung; die Gegenprobe ohne Proxy schätzt seinen Anteil, die Reihenfolge (Proxy-Läufe zuerst) ist nicht randomisiert.
- **Eine Fixture, eine Sprache (`de`), ruhige Session:** keine Aussage zu Last, Voting oder anderen Kontextgrößen; L5 deckt den vollen #456-Kontext nur exemplarisch ab.
- **Eine Runtime-Instanz:** Hardware der Laborinstanz; Werte nicht auf Produktion übertragbar. Prompt-Cache des System-Präfixes wirkt wie im Betrieb.
- **Kein Qualitätsurteil:** `ready` heißt vertrags- und quellengültig, nicht inhaltlich gut.
- **n = 20 bzw. 5:** Median und grobe Spannweiten; seltene Ausfälle bleiben unentdeckt.
- **Referenzstand:** gilt nur für den im JSON genannten Commit und die abgelesenen Artefakte.

## 8. Aufzeichnung

Eine JSON-Datei `evidenz/1C/messung/<datum>-labor.json` mit `completed`, `testsCompleted`, `environment` (Commit, Referenzstand, Hardware des Laufprozesses, Node, PostgreSQL, Redis, Runtime-Art, Schema und Port der Runtime-URL ohne Adresse, gemeldete Image- und Modellprüfsumme mit Abgleich, Client- und Packing-Profil, Einstellungen) und `labor` (`metadataBefore`/`metadataAfter`, `quiet`, `direct`, `l5`). Je Lauf: Zeiten, Vorschau-Hash und Budget, gesendeter Hash, Budget und Bereichszustände, Ergebnis gespeichert und Host-Sicht, alle Kontextaufbauten mit Rolle und Dauer, je Proxy-Austausch Zeiten, Größen, SHA-256, Draht-Prüfungen und **rohe Anfrage- und Antwort-Bodys** der Completion.

Nicht aufgezeichnet: Token-Wert, Runtime-Adresse, Hostname des Laufrechners, `chat_template` im Klartext (nur SHA-256).

## 9. Datenschutz

Nur synthetische Daten: die Referenzfixture aus #456 Abschnitt 12 und ihre Erweiterung für den vollen Kontext; Teilnehmende sind generierte Datensätze. Keine Produktionsdaten, kein Zugriff auf den Produktions-Inferenzhost `arsnova-privat`. Das Token kommt aus dem Passwortmanager nur in die Shell-Umgebung des Laufs und steht in keiner Datei.

## 10. Trockenlauf des Werkzeugs (2026-10-25)

Gegen die In-Prozess-Test-Runtime mit künstlichen `usage`/`timings` (`QA_SUMMARY_LABOR_FAKE_RUNTIME=1`, n = 3, 1 Aufwärmlauf, 2 direkte Läufe, L5 mit 2 je Arm), lokale Podman-Datenbank. Ergebnis: Harness, Proxy und Auswertung laufen durch, K_L1 erfüllt, der Proxy leitet bytegleich weiter, kein Token in der JSON-Datei, die Datenbank ist danach im Ausgangszustand; L5 reproduziert T3.1 auch mit dem Werkzeug (YESNO `source_changed`, TEMPO `full-context`, Themen `available`). **Alle Zahlen dieses Laufs sind künstlich und keine Evidenz;** die Datei ist nicht eingecheckt.

## 11. Offene Fragen

An den Prüfer:

- **P1 Referenzstand:** `v1.3.0` (`87c39334`) oder `main` (siehe [00-rahmen](../00-rahmen-und-pruefung.md#offene-fragen-an-den-prüfer), Frage 3)? Bei `v1.3.0` muss die Harness zurückportiert werden (Abschnitt 3.3).
- **P2 Laborinstanz:** Zugang, zwei VMs im privaten Netz, Hardware (ARM/x86, Kerne, RAM), liegt Image und GGUF bereit, darf der Laufprozess auf dem App-Host laufen und dort eine eigene PostgreSQL/Redis-Instanz starten?
- **P3 Releasepfad:** Genügt der Laufprozess mit dem Backend-Code des Referenzstands, oder wird der Lauf über die gebaute Labor-App (Alternative in 3.1) erwartet?

An den Autor:

- **A1** Freigabe dieses Entwurfs mit den Schwellen (q ≤ 1, Median q 0,5, 1000 ms, 80 %, 5 %) und n (20, 5, 5).
- **A2** L5 ausführen (verlängert den Lauf um etwa 10–15 min)?
- **A3** Rohe Anfrage- und Antwort-Bodys im eingecheckten JSON behalten (synthetisch, etwa 15 KB je Lauf) oder nur Prüfsummen?

## 12. KI-Nutzung

Entwurf, Harness, Proxy, Auswertung und Runbook hat Claude Code (Anthropic, Modell Claude Opus 5.5) erstellt, einschließlich aller Schwellen und Wiederholungszahlen. Gegen den Code geprüft mit codebase-memory und Serena, llama-server-Felder mit Context7 (README `master`) und dem b10524-Protokoll im Repository. Der Autor hat den Umfang vorgegeben (kein Modelllauf, nur Vorbereitung, keine Produktionsänderung). Freigegeben ist nichts; siehe Kopf.
