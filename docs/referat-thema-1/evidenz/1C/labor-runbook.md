# Runbook: 1C-Laborlauf gegen die private Runtime

Ablauf für den Laborlauf aus dem [Design-Entwurf](../../specs/2026-10-25-1c-labor-design.md). **Erst ausführen, wenn der Autor den Entwurf freigegeben hat** und die Fragen P1–P3 an den Prüfer beantwortet sind. Alle Platzhalter in `<…>` sind Werte der Laborinstanz; Secrets stehen nie in einer Datei, einem Commit oder der Shell-Historie.

Stand: 2026-10-25. Werkzeug: `apps/backend/src/__tests__/qa.summary-labor.pg.test.ts` mit `lib/recording-proxy.ts`; Auswertung: [`messung/auswertung.mjs`](messung/auswertung.mjs).

## 1. Voraussetzungen

| Was                    | Anforderung                                                                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inferenz-Host          | Runtime nach [OPEN-WEIGHT-LLM-SECOND-HOST-RUNBOOK.md](../../../operations/OPEN-WEIGHT-LLM-SECOND-HOST-RUNBOOK.md) Abschnitte 6–11 eingerichtet und `healthy`; Digest-Image, geprüfte GGUF-Datei |
| App-Host (Laufrechner) | darf TCP 8080 des Inferenz-Hosts erreichen (Firewall §5); Git, Docker oder Podman, [mise](https://mise.jdx.dev/) mit Node 24.18.0; etwa 3 GB frei für `node_modules`                            |
| Referenzstand          | Commit laut Antwort auf Frage P1. Die Harness existiert ab diesem Branch; für `v1.3.0` muss sie zurückportiert werden (Design 3.3)                                                              |
| Ruhe                   | Niemand nutzt die Runtime während des Laufs (ein Slot). Die Labor-App hat keine Nutzer oder `OPEN_WEIGHT_LLM_ENABLED=false`                                                                     |
| Zeit                   | etwa 45–60 min ohne L5, plus 10–15 min mit L5 (Schätzung aus Design 4; bei Timeouts bis etwa 90 s je Lauf)                                                                                      |

## 2. Inferenz-Host: Stand ablesen

Auf dem Inferenz-Host (SSH). Nur Prüfsummen und Kennungen notieren, keine Secrets:

```bash
cd /opt/arsnova-llm/repository
npm run llm:prod -- ps
docker inspect --format 'Status={{.State.Status}} Health={{.State.Health.Status}} Neustarts={{.RestartCount}}' arsnova-open-weight-llm
docker inspect --format '{{.Config.Image}}' arsnova-open-weight-llm      # → RUNTIME_IMAGE (muss @sha256:… enthalten)
sha256sum "$(sed -n 's/^OPEN_WEIGHT_LLM_MODEL_DIR=//p' .env.llm)/Qwen3-4B-Instruct-2507-Q4_K_M.gguf"   # → MODEL_SHA256
```

Erwartet: `Status=running Health=healthy`, ein Digest-Image und die SHA-256 `3605803b…c67e597` aus `docker/open-weight-llm/model-manifest.json`. Liegt `OPEN_WEIGHT_LLM_MODEL_DIR` nicht in `.env.llm`, den Pfad aus der Compose-Umgebung des Betreibers nehmen.

## 3. App-Host: Laufumgebung vorbereiten

```bash
git clone https://github.com/NiklasSkulll/arsnova.eu.git ~/arsnova-labor && cd ~/arsnova-labor
git checkout <REFERENZ-COMMIT>
git status --porcelain            # muss leer sein
mise exec node@24.18.0 -- npm ci
mise exec node@24.18.0 -- npm run prisma:generate
```

Eigene PostgreSQL- und Redis-Instanz nur für den Lauf, an Loopback gebunden. Das Datenbank-Passwort ist ein Wegwerfwert und wird nicht eingecheckt:

```bash
LABOR_PG_PASSWORD="$(openssl rand -hex 16)"
docker run -d --name labor-1c-pg -p 127.0.0.1:55432:5432 \
  -e POSTGRES_USER=labor -e POSTGRES_PASSWORD="$LABOR_PG_PASSWORD" -e POSTGRES_DB=labor_1c postgres:16-alpine
docker run -d --name labor-1c-redis -p 127.0.0.1:56379:6379 redis:7.4-alpine
export DATABASE_URL="postgresql://labor:${LABOR_PG_PASSWORD}@127.0.0.1:55432/labor_1c?schema=public"
export REDIS_URL=redis://127.0.0.1:56379
mise exec node@24.18.0 -- npm run prisma:migrate
```

(Mit Podman statt Docker dieselben Befehle mit `podman`.)

## 4. Prüfungen vor dem Lauf

Token verdeckt aus dem Passwortmanager in die Umgebung, nicht in die Historie:

```bash
read -r -s -p 'Runtime-Token: ' QA_SUMMARY_LABOR_RUNTIME_TOKEN; echo
export QA_SUMMARY_LABOR_RUNTIME_TOKEN
export QA_SUMMARY_LABOR_RUNTIME_URL='http://<PRIVATE-IP-DES-INFERENZ-HOSTS>:8080'
```

Erreichbarkeit, Authentisierung und freier Slot (wie Runbook §11):

```bash
curl --fail --silent --show-error --max-time 5 "$QA_SUMMARY_LABOR_RUNTIME_URL/health"; echo
curl --silent --output /dev/null --write-out '%{http_code}\n' --max-time 5 "$QA_SUMMARY_LABOR_RUNTIME_URL/slots?fail_on_no_slot=1"   # ohne Token: 401
curl --fail --silent --show-error --max-time 5 --header "Authorization: Bearer $QA_SUMMARY_LABOR_RUNTIME_TOKEN" \
  "$QA_SUMMARY_LABOR_RUNTIME_URL/slots" | jq '[.[] | {id, is_processing}]'
```

Erwartet: Health 200, ohne Token 401, genau ein Slot mit `"is_processing": false`. Sonst nicht starten.

Optional ein Trockenlauf des Werkzeugs auf dem App-Host (ohne Runtime, prüft nur DB, Redis und Node):

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

Aus `apps/backend`. `QA_SUMMARY_LABOR_L5_RUNS=5` nur, wenn der Autor L5 freigegeben hat (Design, Frage A2):

```bash
cd apps/backend
LABOR_OUT="$PWD/../../docs/referat-thema-1/evidenz/1C/messung/$(date +%F)-labor.json"
RUN_QA_SUMMARY_LABOR=1 \
QA_SUMMARY_LABOR_BASELINE='<v1.3.0 oder main@KURZ-SHA>' \
QA_SUMMARY_LABOR_GIT_SHA="$(git rev-parse HEAD)" \
QA_SUMMARY_LABOR_GIT_DIRTY="$([ -z "$(git status --porcelain)" ] && echo false || echo true)" \
QA_SUMMARY_LABOR_RUNTIME_IMAGE='<RUNTIME_IMAGE aus Abschnitt 2>' \
QA_SUMMARY_LABOR_MODEL_SHA256='<MODEL_SHA256 aus Abschnitt 2>' \
QA_SUMMARY_LABOR_L5_RUNS=5 \
QA_SUMMARY_LABOR_OUT="$LABOR_OUT" \
  mise exec node@24.18.0 -- npx vitest run src/__tests__/qa.summary-labor.pg.test.ts --reporter=verbose \
  2>&1 | tee ~/labor-1c-vitest.log
cd ../..
```

Fehlt eine Variable oder zeigt die URL nicht auf eine private Adresse, bricht der Lauf sofort mit einer Liste ab, bevor ein Auftrag läuft. Während des Laufs den Rechner nicht anderweitig belasten.

## 6. Prüfungen nach dem Lauf

```bash
jq '{completed, testsCompleted, dryRun: .labor.dryRun, kind: .labor.runtimeKind}' "$LABOR_OUT"
mise exec node@24.18.0 -- node docs/referat-thema-1/evidenz/1C/messung/auswertung.mjs "$LABOR_OUT" | tee ~/labor-1c-auswertung.txt
grep -c -F "$QA_SUMMARY_LABOR_RUNTIME_TOKEN" "$LABOR_OUT" ~/labor-1c-vitest.log   # muss je 0 sein
grep -c -i 'bearer' "$LABOR_OUT"                                                  # muss 0 sein
```

Erwartet: `completed: true`, `dryRun: false`, `kind: "labor-runtime"`, in der Auswertung `"L Runtime"."unchangedAfterRun": true`. Wenn `completed` `false` ist: Datei trotzdem behalten, Abbruchgrund aus dem Log ins Protokoll; die Kriterien gelten nur für vollständige Läufe. Danach Token aus der Umgebung entfernen und die Laufinstanzen löschen:

```bash
unset QA_SUMMARY_LABOR_RUNTIME_TOKEN
docker rm -f labor-1c-pg labor-1c-redis
```

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

Anschließend die Ergebnisse nach den Regeln des Designs (Abschnitt 6) in einem eigenen Protokoll `evidenz/1C/<DATUM>-labor.md` festhalten: Umgebung, Abweichungen vom Ablauf, je Fall H/G/K mit Wert, Entscheidung, Gültigkeitsgrenzen. Die Statuszeile „Open“ in [`1C-diagrams.md`](../../1C-diagrams.md#task-coverage-exam-document-43-1c) danach aktualisieren. Die JSON-Datei wird nach dem Commit nicht mehr verändert.

## 8. Was an den Prüfer geht

- Link auf die JSON-Datei und das Protokoll im Evidenzordner (geheimnisfrei).
- Referenzstand: Commit, Runtime-Image-Digest, GGUF-SHA-256, `build_info` aus `/props`.
- Die Auswertung der Fälle L1–L4 (und L5) mit Entscheidung und Gültigkeitsgrenze, wie im Design festgelegt.
- Hinweis, dass Design und Schwellen vor dem Lauf freigegeben wurden (Datum der Freigabe), und die KI-Nutzung.

Nicht senden: Token, `.env.llm`, `.env.production`, Logs des Inferenz-Hosts (mit `--log-verbosity 2` können sie Prompts enthalten).
