#!/usr/bin/env bash
# 1B-Lauf im app-host, aus dem Repo-Checkout aufzurufen (ADR 1B-006, 1B-007, 1B-008).
# Vom Rechner aus: labor.sh lauf|kalibrierung (bzw. labor.ps1), die die Ergebnisse zurückholen.
#
#   lauf.sh vorbereiten    Treiber-Abhängigkeiten, SSH-Schlüssel app-host → llm-host prüfen
#   lauf.sh kalibrierung   eine nicht gewertete Anfrage an eine frische Runtime, Timeout nach Regel
#   lauf.sh lauf           Mitschnitt auf beiden Hosts, n Aufträge, Zeitzerlegung, Kontrolle C0
#
# Umgebung (Standard): LAB_N (10, höchstens 10 je frischer Runtime, ADR 1B-007), LAB_TAG,
# LAB_TIMEOUT_MS (90000), LAB_OUTDIR (~/labor-1b), LAB_BODY (Prompt-Body für die Kalibrierung,
# sonst der jüngste body.json), LAB_PROFIL_IST und LAB_RECHNER (vom Rechner gesetzt).
# Mitschnitte enthalten den Runtime-Token im Authorization-Header: sie bleiben in LAB_OUTDIR.
set -euo pipefail
REPO="$(git -C "$(dirname "$(readlink -f "$0")")" rev-parse --show-toplevel)"
cd "$REPO"
EV=docs/referat-thema-1/evidenz/1B
APP_IP=192.168.150.10 LLM_IP=192.168.150.20
OUTBASE="${LAB_OUTDIR:-$HOME/labor-1b}"
KEY="$HOME/.ssh/labor-llm"
LLM=(ssh -i "$KEY" -o StrictHostKeyChecking=accept-new -o BatchMode=yes -o ConnectTimeout=5 "labor@$LLM_IP")
mkdir -p "$OUTBASE"
log() { echo "$(date --iso-8601=seconds) $*" >&2; }

vorbereiten() {
  [[ -f "$KEY" ]] || ssh-keygen -q -t ed25519 -N '' -C labor-app-zu-llm -f "$KEY"
  "${LLM[@]}" true 2>/dev/null || {
    echo "app-host erreicht den llm-host nicht per SSH; Schlüssel $KEY.pub dort eintragen (labor.sh macht das)." >&2
    exit 1
  }
  [[ -d node_modules/@trpc/client ]] || npm ci --ignore-scripts --no-audit --no-fund
  [[ -f libs/shared-types/dist/index.js ]] || npm run build -w @arsnova/shared-types
  log "vorbereitet"
}

runtime_frisch() {
  log "Runtime frisch starten"
  "${LLM[@]}" "cd arsnova.eu && docker compose -f docker-compose.llm.yml -f $EV/llm-vm.override.yml --env-file .env.llm --profile llm down && bash $EV/llm-start.sh" >&2
}

# Eine Anfrage direkt im llm-host (ohne App und Netz zwischen den Hosts); Body von stdin.
direkt() {
  "${LLM[@]}" "T=\$(sed -n 's/^OPEN_WEIGHT_LLM_TOKEN=//p' arsnova.eu/.env.llm); curl -sS -o /tmp/direkt.json -w '%{time_starttransfer} %{time_total} %{http_code}' --max-time 600 -H \"Authorization: Bearer \$T\" -H 'Content-Type: application/json' --data-binary @- http://$LLM_IP:8080/v1/chat/completions; echo; jq -c '{prompt_ms: .timings.prompt_ms, predicted_ms: .timings.predicted_ms, prompt_n: .timings.prompt_n, predicted_n: .timings.predicted_n, cache_n: .timings.cache_n}' /tmp/direkt.json; rm -f /tmp/direkt.json"
}

kalibrierung() {
  vorbereiten
  local body="${LAB_BODY:-$(ls -t "$OUTBASE"/*/body.json 2>/dev/null | head -n 1)}"
  [[ -f "$body" ]] || { echo "Kein Prompt-Body: erst einen Lauf (z. B. LAB_TAG=probe LAB_N=1) ausführen oder LAB_BODY setzen." >&2; exit 1; }
  runtime_frisch
  log "Kalibrierung mit $body"
  local out; out="$(direkt <"$body")"
  local zeit; zeit="$(head -n 1 <<<"$out")"
  local t; t="$(tail -n 1 <<<"$out")"
  local i; i="$(jq -r '(.prompt_ms + .predicted_ms) | floor' <<<"$t")"
  local timeout
  if ((i <= 75000)); then timeout=90000; elif ((i <= 270000)); then timeout=300000; else timeout=abbruch; fi
  local f; f="$OUTBASE/kalibrierung-$(date +%Y%m%dT%H%M%S).json"
  jq -n --argjson t "$t" --arg zeit "$zeit" --argjson i "$i" --arg timeout "$timeout" \
    --arg profil "${LAB_PROFIL_IST:-unbekannt}" --arg rechner "${LAB_RECHNER:-unbekannt}" --arg commit "$(git rev-parse HEAD)" \
    '{commit: $commit, rechner: $rechner, energieprofil: $profil, timings: $t, curl: $zeit, I_ms: $i, timeoutMs: $timeout,
      regel: "I <= 75 s: 90000; 75 s < I <= 270 s: 300000; sonst Abbruch (ADR 1B-005)"}' | tee "$f"
  [[ "$timeout" != abbruch ]] || { echo "I > 270 s: Abbruch, der Autor entscheidet." >&2; exit 3; }
}

mitschnitt_start() { # wo datei
  local filt="host $LLM_IP and tcp port 8080 and host $APP_IP"
  local cmd="IF=\$(ip -o route get $LLM_IP | awk '{for(i=1;i<=NF;i++) if(\$i==\"dev\") print \$(i+1)}'); [ \"\$IF\" = lo ] && IF=\$(ip -o route get $APP_IP | awk '{for(i=1;i<=NF;i++) if(\$i==\"dev\") print \$(i+1)}'); sudo nohup tcpdump -Z labor -i \"\$IF\" -s 0 -U -w $2 '$filt' >/dev/null 2>&1 & sleep 2; pgrep -f 'tcpdump .*-w $2' >/dev/null"
  if [[ "$1" == app ]]; then bash -c "$cmd"; else "${LLM[@]}" "$cmd"; fi
}

mitschnitt_stop() { # wo datei
  local cmd="sudo pkill -INT -f 'tcpdump .*-w $2' || true; sleep 2"
  if [[ "$1" == app ]]; then bash -c "$cmd"; else "${LLM[@]}" "$cmd"; fi
}

felder() { # pcap → tshark-Felder für zeitzerlegung.mjs
  tshark -r "$1" -T fields -E separator=/t -e frame.time_epoch -e tcp.stream -e ip.src -e tcp.len \
    -e http.request.method -e http.request.uri -e http.response.code
}

lauf() {
  local n="${LAB_N:-10}" tag="${LAB_TAG:-}" timeout="${LAB_TIMEOUT_MS:-90000}"
  ((n >= 1 && n <= 10)) || { echo "LAB_N muss 1..10 sein (höchstens 10 Aufträge je frischer Runtime)." >&2; exit 1; }
  local id; id="$(date +%Y%m%dT%H%M%S)${tag:+-$tag}"
  local out="$OUTBASE/$id"
  mkdir -p "$out"
  vorbereiten

  log "Timeouts auf $timeout ms, App neu starten"
  sed -i -e "s/^QA_SUMMARY_TIMEOUT_MS=.*/QA_SUMMARY_TIMEOUT_MS=$timeout/" \
    -e "s/^OPEN_WEIGHT_LLM_SUMMARY_TIMEOUT_MS=.*/OPEN_WEIGHT_LLM_SUMMARY_TIMEOUT_MS=$timeout/" .env.production
  bash "$EV/app-start.sh" </dev/null >"$out/app-start.log" 2>&1
  runtime_frisch

  log "Speicherlog (15 s) und Mitschnitte starten"
  "${LLM[@]}" "c=\$(docker inspect -f '{{.Id}}' arsnova-open-weight-llm); m=/sys/fs/cgroup/system.slice/docker-\$c.scope/memory.current; echo zeit,mem_bytes,restarts,oom_killed > /tmp/1b-mem.csv; nohup bash -c \"while :; do echo \\\$(date +%s),\\\$(cat \$m),\\\$(docker inspect -f '{{.RestartCount}},{{.State.OOMKilled}}' arsnova-open-weight-llm); sleep 15; done >> /tmp/1b-mem.csv\" >/dev/null 2>&1 & echo \$! > /tmp/1b-mem.pid"
  mitschnitt_start app "$out/app.pcap"
  mitschnitt_start llm "/tmp/1b-srv.pcap"
  local start; start="$(date --iso-8601=seconds)"

  log "Treiber: $n Aufträge"
  node "$EV/treiber.mjs" --trpc http://127.0.0.1:3000/trpc --auftraege "$n" --out "$out/treiber.json" 2>"$out/treiber.log"

  sleep 3
  mitschnitt_stop app "$out/app.pcap"
  mitschnitt_stop llm "/tmp/1b-srv.pcap"
  "${LLM[@]}" 'kill $(cat /tmp/1b-mem.pid) 2>/dev/null; cat /tmp/1b-mem.csv' >"$out/speicher.csv"
  "${LLM[@]}" 'cat /tmp/1b-srv.pcap; rm -f /tmp/1b-srv.pcap' >"$out/srv.pcap"
  docker logs --since "$start" arsnova-v3-app >"$out/app.log" 2>&1

  log "Auswertung"
  felder "$out/app.pcap" >"$out/app.tsv"
  felder "$out/srv.pcap" >"$out/srv.tsv"
  tshark -r "$out/app.pcap" -Y 'http.request.method == "POST" || http.response' -T fields -E separator=/t \
    -e frame.number -e http.request.method -e http.response_in -e http.file_data >"$out/http.tsv"
  node "$EV/messung/timings.mjs" timings "$out/http.tsv" >"$out/timings.json"
  node "$EV/messung/timings.mjs" body "$out/http.tsv" >"$out/body.json"
  node "$EV/messung/zeitzerlegung.mjs" --app "$out/app.tsv" --srv "$out/srv.tsv" --log "$out/app.log" \
    --timings "$out/timings.json" --app-ip "$APP_IP" --out "$out/zerlegung.json" >&2

  # Kontrolle C0 (Design 5) an einer frischen Runtime: sonst bekäme sie n + 1 Anfragen (ADR 1B-007).
  runtime_frisch
  log "Kontrolle C0: erster Prompt direkt im llm-host"
  local c0; c0="$(direkt <"$out/body.json")"

  local llm_info app_img
  llm_info="$("${LLM[@]}" "docker inspect -f '{{json .Config.Image}} {{json .Args}}' arsnova-open-weight-llm; nproc; free -g | awk '/^Mem:/ {print \$2}'")"
  app_img="$(docker inspect -f '{{.Config.Image}}' arsnova-v3-app)"
  jq -n \
    --arg id "$id" --arg tag "$tag" --argjson n "$n" --argjson timeout "$timeout" \
    --arg commit "$(git rev-parse HEAD)" --arg profil "${LAB_PROFIL_IST:-unbekannt}" --arg rechner "${LAB_RECHNER:-unbekannt}" \
    --arg appImage "$app_img" --arg llmInfo "$llm_info" --arg appVcpu "$(nproc)" \
    --arg modellSha "$(jq -r .sha256 docker/open-weight-llm/model-manifest.json)" \
    --slurpfile treiber "$out/treiber.json" --slurpfile zerlegung "$out/zerlegung.json" \
    --arg c0curl "$(head -n 1 <<<"$c0")" --argjson c0timings "$(tail -n 1 <<<"$c0")" \
    --rawfile speicher "$out/speicher.csv" \
    '{lauf: $id, tag: $tag, n: $n, timeoutMs: $timeout, commit: $commit, rechner: $rechner, energieprofil: $profil,
      appHost: {vcpu: ($appVcpu | tonumber), image: $appImage},
      llmHost: {info: $llmInfo, modellSha256: $modellSha},
      treiber: $treiber[0], zerlegung: $zerlegung[0],
      kontrolleC0: {curl: $c0curl, hinweis: "time_starttransfer time_total http_code; frische Runtime", timings: $c0timings},
      speicher: ($speicher | split("\n") | map(select(. != "" and (startswith("zeit") | not))) | map(split(",")) |
        {proben: length, maxBytes: (map(.[1] | tonumber) | max), restartsMax: (map(.[2] | tonumber) | max),
         oomKilled: (map(.[3]) | any(. == "true"))})}' >"$out/ergebnis.json"
  log "fertig: $out/ergebnis.json"
  echo "$out"
}

case "${1:-}" in
  vorbereiten) vorbereiten ;;
  kalibrierung) kalibrierung ;;
  lauf) lauf ;;
  *) echo "Aufruf: $0 vorbereiten|kalibrierung|lauf" >&2; exit 2 ;;
esac
