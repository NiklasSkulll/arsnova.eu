# Runbook: 1C-Laborlauf gegen die private Runtime

Ablauf für den Laborlauf aus dem [Design-Entwurf](../../specs/2026-10-25-1c-labor-design.md). Der Autor hat den Entwurf am 2026-11-04 freigegeben (A1–A4: Schwellen wie vorgeschlagen, L5 ja, rohe Bodys ja, Timeout 300 s). Laborinstanz ist laut Prüfer der eigene Rechner, Referenzstand der aktuelle `main` (Design, Abschnitt 11). Platzhalter in `<…>` sind lokale Werte; Secrets stehen nie in einer Datei, einem Commit oder der Shell-Historie.

Stand: 2026-10-25, auf den eigenen Rechner umgestellt am 2026-11-04. Werkzeug: `apps/backend/src/__tests__/qa.summary-labor.pg.test.ts` mit `lib/recording-proxy.ts`; Auswertung: [`messung/auswertung.mjs`](messung/auswertung.mjs). Runtime: lokaler Laborpfad `llm-http` ([Onboarding](../../../onboarding.md#optional-lokale-text-ki-qwen3-4b), [Vertrag](../../../features/open-weight-llm-runtime.md#same-host-labor)).

## 1. Voraussetzungen

| Was      | Anforderung                                                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Rechner  | Linux mit rootless Podman und Compose-Provider (`podman compose`) oder Docker Engine mit Compose, [mise](https://mise.jdx.dev/) mit Node 24.18.0, `jq`, `openssl`              |
| Speicher | etwa 2,5 GB für die GGUF-Datei, etwa 3 GB für `node_modules`; der Runtime-Container ist auf 5 GiB RAM begrenzt                                                                 |
| Referenz | Fork-`main` und `feature-1C-context-path` enthalten den aktuellen upstream-`main` (Abschnitt 3)                                                                                |
| Ruhe     | kein `npm run dev` und kein App-Container mit `OPEN_WEIGHT_LLM_ENABLED=true`; keine andere rechenintensive Last; Netzteil angeschlossen, Energieprofil auf Leistung (Design 4) |
| Zeit     | etwa 2 h: 36 Aufträge zu etwa 200 s (Kalibrierung, Design 10.1), höchstens 300 s je Auftrag; der Rechner ist in der Zeit nicht nutzbar                                         |

## 2. Runtime lokal starten und Stand ablesen

Modell einmalig laden und gegen das Manifest prüfen (aus dem Repository-Wurzelverzeichnis; `*.gguf` ist per `.gitignore` ausgeschlossen):

```bash
mkdir -p models/open-weight-llm
curl --fail --location \
  --output models/open-weight-llm/Qwen3-4B-Instruct-2507-Q4_K_M.gguf \
  https://huggingface.co/unsloth/Qwen3-4B-Instruct-2507-GGUF/resolve/a06e946bb6b655725eafa393f4a9745d460374c9/Qwen3-4B-Instruct-2507-Q4_K_M.gguf
mise exec node@24.18.0 -- node scripts/open-weight-llm/verify-model.mjs   # erwartet: verified
```

Wegwerf-Token erzeugen (64 Hex-Zeichen, URL-sicher) und die Runtime starten. Der Befehl entspricht `npm run docker:up:llm:http`, läuft hier aber mit rootless Podman (geprüft am 2026-11-04: Podman 6.1.4, cgroup v2 mit delegierten Controllern `cpu memory pids`, also greifen die Limits 4 CPUs / 5 GiB):

```bash
QA_SUMMARY_LABOR_RUNTIME_TOKEN="$(openssl rand -hex 32)"
export QA_SUMMARY_LABOR_RUNTIME_TOKEN
export OPEN_WEIGHT_LLM_TOKEN="$QA_SUMMARY_LABOR_RUNTIME_TOKEN"
export OPEN_WEIGHT_LLM_MODEL_DIR="$PWD/models/open-weight-llm"
podman compose --profile llm-http up -d --build open-weight-llm-http
podman inspect --format '{{.State.Health.Status}}' arsnova-v3-open-weight-llm-http   # warten bis healthy (Startzeit bis 180 s)
```

Mit Docker statt Podman: `sudo --preserve-env=OPEN_WEIGHT_LLM_TOKEN,OPEN_WEIGHT_LLM_MODEL_DIR docker compose …` und in den folgenden Befehlen `sudo docker` statt `podman`.

Stand ablesen, nur Kennungen und Prüfsummen:

```bash
podman inspect --format 'Status={{.State.Status}} Health={{.State.Health.Status}} Neustarts={{.RestartCount}}' arsnova-v3-open-weight-llm-http
RUNTIME_IMAGE_ID="$(podman image inspect --format '{{.Id}}' arsnova-open-weight-llm:llama-b10524)"
echo "arsnova-open-weight-llm:llama-b10524@sha256:${RUNTIME_IMAGE_ID#sha256:}"   # → RUNTIME_IMAGE (Image-ID, kein Registry-Digest)
sha256sum models/open-weight-llm/Qwen3-4B-Instruct-2507-Q4_K_M.gguf   # → MODEL_SHA256
grep '^FROM' docker/open-weight-llm/Dockerfile   # Basisimage-Digest fürs Protokoll
lscpu | grep -E 'Model name|^CPU\(s\)'; free -g | head -2   # Hardware fürs Protokoll
```

Erwartet: `Status=running Health=healthy` und die SHA-256 `3605803b…c67e597` aus `docker/open-weight-llm/model-manifest.json`. **Hinweis zu `RUNTIME_IMAGE`:** Die Harness verlangt die Form `<name>@sha256:<64 hex>`. Ein lokal gebautes Image hat keine Registry-Digest-Referenz. Übergeben wird deshalb die lokale Image-ID; im Protokoll ist sie als solche zu bezeichnen, nicht als Registry-Digest.

## 3. Laufumgebung vorbereiten

Fork und Clone auf den aktuellen upstream-`main` bringen (Vorgabe des Prüfers). Nur per Merge, kein Rebase, kein Force-Push; Pushes nur nach Freigabe des Autors:

```bash
git fetch --all --prune
git switch feature-1C-context-path
git status --porcelain                         # muss leer sein
git rev-list --count HEAD..upstream/main       # 0 = aktuell; sonst zuerst Fork-main, dann den Branch per Merge aktualisieren
mise exec node@24.18.0 -- npm ci
mise exec node@24.18.0 -- npm run prisma:generate
```

Hat sich upstream seit `70c74002` (upstream `9f230abc`) geändert, die Tabelle in Design 3.4 vor dem Lauf für den neuen Stand prüfen und ergänzen.

Eigene PostgreSQL- und Redis-Instanz nur für den Lauf, an Loopback gebunden, getrennt von der Entwicklungsdatenbank. Das Datenbank-Passwort ist ein Wegwerfwert:

```bash
LABOR_PG_PASSWORD="$(openssl rand -hex 16)"
podman run -d --name labor-1c-pg -p 127.0.0.1:55432:5432 \
  -e POSTGRES_USER=labor -e POSTGRES_PASSWORD="$LABOR_PG_PASSWORD" -e POSTGRES_DB=labor_1c docker.io/library/postgres:16-alpine
podman run -d --name labor-1c-redis -p 127.0.0.1:56379:6379 docker.io/library/redis:7.4-alpine
export DATABASE_URL="postgresql://labor:${LABOR_PG_PASSWORD}@127.0.0.1:55432/labor_1c?schema=public"
export REDIS_URL=redis://127.0.0.1:56379
mise exec node@24.18.0 -- npm run prisma:migrate
```

## 4. Prüfungen vor dem Lauf

```bash
export QA_SUMMARY_LABOR_RUNTIME_URL='http://127.0.0.1:8080'
curl --fail --silent --show-error --max-time 5 "$QA_SUMMARY_LABOR_RUNTIME_URL/health"; echo
curl --silent --output /dev/null --write-out '%{http_code}\n' --max-time 5 "$QA_SUMMARY_LABOR_RUNTIME_URL/slots?fail_on_no_slot=1"   # ohne Token: 401
curl --fail --silent --show-error --max-time 5 --header "Authorization: Bearer $QA_SUMMARY_LABOR_RUNTIME_TOKEN" \
  "$QA_SUMMARY_LABOR_RUNTIME_URL/slots" | jq '[.[] | {id, is_processing}]'
```

Erwartet: Health 200, ohne Token 401, genau ein Slot mit `"is_processing": false`. Sonst nicht starten.

Optional ein Trockenlauf des Werkzeugs (ohne Runtime, prüft nur DB, Redis und Node):

```bash
cd apps/backend
env -u QA_SUMMARY_LABOR_RUNTIME_URL -u QA_SUMMARY_LABOR_RUNTIME_TOKEN \
  RUN_QA_SUMMARY_LABOR=1 QA_SUMMARY_LABOR_FAKE_RUNTIME=1 QA_SUMMARY_LABOR_RUNS=2 QA_SUMMARY_LABOR_DIRECT_RUNS=1 \
  QA_SUMMARY_LABOR_OUT=/tmp/labor-dry.json \
  mise exec node@24.18.0 -- npx vitest run src/__tests__/qa.summary-labor.pg.test.ts
cd ../..
```

Die Datei `/tmp/labor-dry.json` ist **keine Evidenz** (`dryRun: true`) und wird nicht eingecheckt.

## 5. Lauf

Aus `apps/backend`. L5 ist freigegeben (A2), der Timeout von 300 s ebenfalls (A4, gekennzeichnete Abweichung vom Release-Wert 90 s). Während des Laufs den Rechner nicht anderweitig belasten und nicht in den Ruhezustand gehen lassen:

```bash
cd apps/backend
LABOR_OUT="$PWD/../../docs/referat-thema-1/evidenz/1C/messung/$(date +%F)-labor.json"
RUN_QA_SUMMARY_LABOR=1 \
QA_SUMMARY_LABOR_BASELINE="main@$(git rev-parse --short upstream/main)" \
QA_SUMMARY_LABOR_GIT_SHA="$(git rev-parse HEAD)" \
QA_SUMMARY_LABOR_GIT_DIRTY="$([ -z "$(git status --porcelain)" ] && echo false || echo true)" \
QA_SUMMARY_LABOR_RUNTIME_IMAGE='<RUNTIME_IMAGE aus Abschnitt 2>' \
QA_SUMMARY_LABOR_MODEL_SHA256='<MODEL_SHA256 aus Abschnitt 2>' \
QA_SUMMARY_LABOR_L5_RUNS=5 \
QA_SUMMARY_LABOR_TIMEOUT_MS=300000 \
QA_SUMMARY_LABOR_OUT="$LABOR_OUT" \
  mise exec node@24.18.0 -- npx vitest run src/__tests__/qa.summary-labor.pg.test.ts --reporter=verbose \
  2>&1 | tee ~/labor-1c-vitest.log
cd ../..
```

Fehlt eine Variable oder zeigt die URL nicht auf eine private Adresse, bricht der Lauf sofort mit einer Liste ab, bevor ein Auftrag läuft. Endet trotz 300 s ein Lauf mit `timeout`, zählt er für L4 als Befund (Design, Fall L4).

## 6. Prüfungen nach dem Lauf

```bash
jq '{completed, testsCompleted, dryRun: .labor.dryRun, kind: .labor.runtimeKind}' "$LABOR_OUT"
mise exec node@24.18.0 -- node docs/referat-thema-1/evidenz/1C/messung/auswertung.mjs "$LABOR_OUT" | tee ~/labor-1c-auswertung.txt
grep -c -F "$QA_SUMMARY_LABOR_RUNTIME_TOKEN" "$LABOR_OUT" ~/labor-1c-vitest.log   # muss je 0 sein
grep -c -i 'bearer' "$LABOR_OUT"                                                  # muss 0 sein
```

Erwartet: `completed: true`, `dryRun: false`, `kind: "labor-runtime"`, in der Auswertung `"L Runtime"."unchangedAfterRun": true`. Wenn `completed` `false` ist: Datei trotzdem behalten, Abbruchgrund aus dem Log ins Protokoll; die Kriterien gelten nur für vollständige Läufe. Danach Token aus der Umgebung entfernen, die Runtime stoppen und die Laufinstanzen löschen:

```bash
unset QA_SUMMARY_LABOR_RUNTIME_TOKEN OPEN_WEIGHT_LLM_TOKEN
podman compose --profile llm-http rm --stop --force open-weight-llm-http   # nur die Runtime, nicht das ganze Projekt
podman rm -f labor-1c-pg labor-1c-redis
```

Die GGUF-Datei unter `models/open-weight-llm/` darf liegen bleiben; sie wird nie eingecheckt.

## 7. Einchecken

Nur die Rohdaten und das Protokoll, keine Logs mit Umgebungsdaten. Rohdaten liegen wie alle Messdaten gzip-komprimiert im Repository (`gzip -9n`, deterministisch; `auswertung.mjs` liest `.json.gz` direkt). SHA-256 der unkomprimierten Datei vorher im Protokoll festhalten. Vorher den Diff lesen:

```bash
git switch feature-1C-context-path
sha256sum docs/referat-thema-1/evidenz/1C/messung/<DATUM>-labor.json
gzip -9n docs/referat-thema-1/evidenz/1C/messung/<DATUM>-labor.json
git add docs/referat-thema-1/evidenz/1C/messung/<DATUM>-labor.json.gz
git diff --cached --stat
git commit -m 'docs(referat): record the 1C lab run against the private runtime'
```

Anschließend die Ergebnisse nach den Regeln des Designs (Abschnitt 6) in einem eigenen Protokoll `evidenz/1C/<DATUM>-labor.md` festhalten: Umgebung (Hardware, Commit, Image-ID, Basisimage-Digest, GGUF-SHA, `build_info`), Abweichungen vom Ablauf, je Fall H/G/K mit Wert, Entscheidung, Gültigkeitsgrenzen. Die Statuszeile „Open“ in [`1C-diagrams.md`](../../1C-diagrams.md#task-coverage-exam-document-43-1c) danach aktualisieren. Die JSON-Datei wird nach dem Commit nicht mehr verändert.

## 8. Was an den Prüfer geht

- Link auf die JSON-Datei und das Protokoll im Evidenzordner (geheimnisfrei).
- Referenzstand: Commit, lokale Image-ID mit Basisimage-Digest, GGUF-SHA-256, `build_info` aus `/props`, Hardware des eigenen Rechners.
- Die Auswertung der Fälle L1–L4 (und L5) mit Entscheidung und Gültigkeitsgrenze, wie im Design festgelegt.
- Hinweis, dass Design und Schwellen vor dem Lauf freigegeben wurden (Datum der Freigabe), und die KI-Nutzung.

Nicht senden: Token, `.env`, `.env.llm`, Logs der Runtime (mit `--log-verbosity 2` können sie Prompts enthalten).

## 9. Zusatzlauf auf einem zweiten Rechner mit Produktionslimits (Design 14)

Für den Zusatzlauf nach [Design Abschnitt 14](../../specs/2026-10-25-1c-labor-design.md#14-nachtrag-zusatzlauf-mit-produktionslimits-und-release-timeout-vor-dem-lauf-festgelegt). Das Skript [`labor-lauf.sh`](labor-lauf.sh) fasst die Abschnitte 2–6 zusammen; es setzt die Runtime per [`labor-produktionslimits.override.yml`](labor-produktionslimits.override.yml) auf 8 CPUs, 8 GiB, 10 GiB mit Swap und 8 Threads, hält das Energieprofil `performance` (falls `powerprofilesctl` vorhanden), sperrt den Ruhezustand (falls `systemd-inhibit` vorhanden) und räumt Runtime, Lauf-DB und Token am Ende ab. Voraussetzung: rootless Podman oder Docker ohne `sudo` (Benutzer in der Gruppe `docker`), dazu `mise`, `jq`, `openssl`, `curl`.

Vorbereitung auf dem Rechner (einmalig; Abschnitt 2 für das Modell, Abschnitt 3 für den Clone):

```bash
git clone https://github.com/NiklasSkulll/arsnova.eu.git && cd arsnova.eu
git remote add upstream https://github.com/kqc-real/arsnova.eu.git && git fetch --all
git switch feature-1C-context-path
mise exec node@24.18.0 -- npm ci
mise exec node@24.18.0 -- npm run prisma:generate
# Modell laden und prüfen wie Abschnitt 2 (curl …, verify-model.mjs)
```

**Schritt 1, Kalibrierung** (etwa 2–5 min, nicht gewertet). Druckt `prompt_ms`, `predicted_ms`, Durchsätze und die Inferenzzeit I; der Antworttext wird verworfen:

```bash
LABOR_TAG=pc docs/referat-thema-1/evidenz/1C/labor-lauf.sh kalibrierung
```

**Schritt 2, Timeout nach Design 14.3 wählen:** I ≤ 90 s → Release-Timeout (Standard des Skripts, 90 000 ms); I > 90 s → `LABOR_TIMEOUT_MS=300000`. Die Kalibrierungswerte gehören ins Protokoll.

**Schritt 3, Lauf** (je nach Kalibrierung etwa 1–2 h). Ergebnis unter `docs/referat-thema-1/evidenz/1C/messung/<DATUM>-labor-pc.json`, Logs, Auswertung und Speicherprotokoll `speicher-pc-<DATUM>.csv` unter `~/labor-1c/`:

```bash
LABOR_TAG=pc docs/referat-thema-1/evidenz/1C/labor-lauf.sh lauf                          # I ≤ 90 s
LABOR_TAG=pc LABOR_TIMEOUT_MS=300000 docs/referat-thema-1/evidenz/1C/labor-lauf.sh lauf  # I > 90 s
```

Zeitgesteuert, ohne offene Sitzung (Beispiel 06:45 am nächsten Tag; der Rechner darf bis dahin nicht schlafen):

```bash
systemd-run --user --unit=labor-1c-run --on-calendar='<DATUM> 06:45:00' --timer-property=AccuracySec=1s \
  --setenv=LABOR_TAG=pc "$PWD/docs/referat-thema-1/evidenz/1C/labor-lauf.sh" lauf
```

Danach Einchecken und Protokoll wie Abschnitt 7, mit eigener Datei `evidenz/1C/<DATUM>-labor-pc.md`; die Hardware-Tabelle als zweite Spalte neben dem Laptop ([Laptop-Protokoll](2026-11-05-labor.md#laufrechner-laptop)), L6 aus dem Speicherprotokoll und `OOMKilled`.
