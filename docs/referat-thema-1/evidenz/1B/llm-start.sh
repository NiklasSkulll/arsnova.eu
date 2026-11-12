#!/usr/bin/env bash
# 1B-Labor, im llm-host aus dem Repo-Checkout aufzurufen (ADR 1B-005):
#   1. Prüfungen von scripts/open-weight-llm/prod-compose.mjs (Digest, private Bind-Adresse,
#      Token, GGUF-Hash) per Compose-Trockenlauf, ohne zu starten;
#   2. Start mit derselben Compose-Datei plus Labor-Override (4 CPUs, 4 Threads);
#   3. warten, bis der Container healthy ist; Digest ausgeben.
# Release-Dateien werden nicht verändert.
set -euo pipefail
REPO="$(git -C "$(dirname "$(readlink -f "$0")")" rev-parse --show-toplevel)"
cd "$REPO"
[[ -f .env.llm ]] || { echo ".env.llm fehlt (Runbook §8.3)" >&2; exit 1; }

echo "== Wrapper-Prüfungen (Trockenlauf)"
node scripts/open-weight-llm/prod-compose.mjs --dry-run up -d

echo "== Start mit Labor-Override"
docker compose -f docker-compose.llm.yml -f docs/referat-thema-1/evidenz/1B/llm-vm.override.yml \
  --env-file .env.llm --profile llm up -d

for _ in $(seq 1 60); do
  state="$(docker inspect -f '{{.State.Health.Status}}' arsnova-open-weight-llm 2>/dev/null || echo fehlt)"
  [[ "$state" == healthy ]] && break
  sleep 5
done
[[ "$state" == healthy ]] || { echo "Runtime nicht healthy: $state" >&2; exit 1; }
echo "healthy; Image: $(docker inspect -f '{{.Config.Image}}' arsnova-open-weight-llm)"
