#!/usr/bin/env bash
# 1B-Labor unter Linux mit einem Befehl (ADR 1B-010):
#   labor.sh up        Voraussetzungen, Größenwahl, VMs, llm-host, app-host, Prüfungen
#   labor.sh groessen  nur Empfehlung und Größenwahl anzeigen, nichts anlegen
#   labor.sh pruefen   nur die Prüfungen (Runbook §10, §11, Negativtests), Bericht schreiben
#   labor.sh status    VMs, Pinning, Docker, Repo-Stand
#   labor.sh destroy   VMs, Disks und Netz entfernen (fragt nach)
#
# Ohne Rückfragen: LAB_JA=1. Eigene Größen: LAB_LLM_VCPU, LAB_LLM_RAM_GIB, LAB_APP_VCPU,
# LAB_APP_RAM_GIB (Pinning rechnet labor.sh). Bericht und Logs: LAB_OUTDIR (~/labor-1b).
# Weitere Variablen: vm/vm-linux.sh. Windows: labor.ps1.
set -euo pipefail
HERE="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
REPO="$(git -C "$HERE" rev-parse --show-toplevel)"
# shellcheck source=groessen.sh
source "$HERE/groessen.sh"
VMDIR="${LAB_VMDIR:-/var/lib/libvirt/images/arsnova-1b}"
OUT="${LAB_OUTDIR:-$HOME/labor-1b}"
APP=192.168.150.10 LLM=192.168.150.20
EV=docs/referat-thema-1/evidenz/1B
SSH=(ssh -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="$VMDIR/known_hosts" -o ConnectTimeout=5)
mkdir -p "$OUT"

interaktiv() { [[ -t 0 && "${LAB_JA:-}" != 1 ]]; }
# sudo nur, wenn es ohne Rückfrage geht oder ein Terminal das Passwort abfragen kann.
sudo_moeglich() { [[ -t 0 ]] || sudo -n true 2>/dev/null; }
frage() { # text standard(j|n) → 0 bei ja
  local a
  [[ "${LAB_JA:-}" == 1 ]] && return 0
  if ! interaktiv; then [[ "$2" == j ]]; return; fi
  read -r -p "$1 " a
  a="${a:-$2}"
  [[ "${a,,}" == j* || "${a,,}" == y* ]]
}

text() {
  case "$1" in
    llm-unter-4) echo "llm-host unter 4 vCPU: Inferenz deutlich langsamer, Zahlen nicht mit dem Messrechner vergleichbar." ;;
    app-ram-4) echo "app-host nur 4 GiB: der App-Build in der VM wird knapp und langsam." ;;
    llm-ram-10) echo "llm-host nur 10 GiB: Container-Limit 8 GiB bleibt, wenig Puffer für das System der VM." ;;
    host-ram-2) echo "Dem Rechner bleiben etwa 2 GiB: andere Programme während des Laufs schließen." ;;
    ram-zu-klein) echo "Zu wenig RAM: mindestens 16 GiB nötig (llm 10 + app 4 + Rechner 2)." ;;
    kerne-zu-wenig) echo "Zu wenige Kerne: der llm-host braucht mindestens 2 physische Kerne (ohne SMT 4)." ;;
    llm-vcpu) echo "llm-host: 2 bis höchstens min(8, physische Kerne) vCPU." ;;
    app-vcpu) echo "app-host: mindestens 1 vCPU." ;;
    vcpu-summe) echo "Zusammen mehr vCPU als Threads des Rechners." ;;
    llm-ram) echo "llm-host: mindestens 10 GiB (Container-Limit 8 GiB plus System)." ;;
    app-ram) echo "app-host: mindestens 4 GiB." ;;
    ram-summe) echo "Zusammen zu viel RAM: dem Rechner müssen 2 GiB bleiben." ;;
    *) echo "$1" ;;
  esac
}

voraussetzungen() {
  local fehlt=()
  for c in virsh virt-install qemu-img jq ssh scp git curl sha256sum lscpu; do
    command -v "$c" >/dev/null || fehlt+=("$c")
  done
  command -v xorriso >/dev/null || command -v genisoimage >/dev/null || fehlt+=(xorriso)
  if ((${#fehlt[@]})); then
    echo "Fehlt: ${fehlt[*]}" >&2
    echo "  Arch:          sudo pacman -S --needed libvirt qemu-base virt-install dnsmasq libisoburn jq openssh" >&2
    echo "  Debian/Ubuntu: sudo apt install libvirt-daemon-system qemu-system-x86 qemu-utils virtinst xorriso jq" >&2
    echo "  danach:        sudo systemctl enable --now libvirtd.socket; sudo usermod -aG libvirt \"\$USER\"" >&2
    exit 1
  fi
  [[ -e /dev/kvm ]] || { echo "/dev/kvm fehlt: Virtualisierung im BIOS/UEFI einschalten." >&2; exit 1; }
  LIBVIRT_DEFAULT_URI=qemu:///system virsh -q list >/dev/null 2>&1 || {
    echo "libvirt nicht erreichbar: libvirtd.socket starten und Gruppe libvirt (neu anmelden)." >&2
    exit 1
  }
  local key="${LAB_SSH_KEY:-$HOME/.ssh/id_ed25519.pub}"
  if [[ ! -f "$key" ]]; then
    if frage "SSH-Schlüssel $key fehlt. Neu erzeugen (ohne Passphrase, nur fürs Labor)? [J/n]" j; then
      ssh-keygen -q -t ed25519 -N '' -f "${key%.pub}"
    else
      exit 1
    fi
  fi
  if [[ ! -w "$VMDIR" ]]; then
    echo "VM-Verzeichnis $VMDIR fehlt oder ist nicht beschreibbar (libvirt-qemu muss es lesen können)."
    sudo_moeglich && frage "Mit sudo anlegen? [J/n]" j && sudo install -d -o "$USER" -m 755 "$VMDIR"
    [[ -w "$VMDIR" ]] || exit 1
  fi
  if systemctl is-active -q ufw 2>/dev/null; then
    echo "Host-ufw ist aktiv; ohne Freigabe auf virbr-1b bekommen die VMs keine IP."
    if ! sudo_moeglich; then
      echo "  Ohne Terminal kein sudo; falls nötig von Hand (einmalig, bleibt gesetzt):"
      echo "  sudo ufw allow in on virbr-1b to any port 67 proto udp; sudo ufw allow in on virbr-1b to any port 53; sudo ufw route allow in on virbr-1b"
    elif frage "Freigaben nur für die Labor-Bridge setzen (sudo ufw, DHCP/DNS/Weiterleitung)? [J/n]" j; then
      sudo ufw allow in on virbr-1b to any port 67 proto udp
      sudo ufw allow in on virbr-1b to any port 53
      sudo ufw route allow in on virbr-1b
    fi
  fi
}

# Setzt LAB_LLM_VCPU, LAB_LLM_RAM_GIB, LAB_LLM_CPUSET, LAB_APP_VCPU, LAB_APP_RAM_GIB, LAB_APP_CPUSET.
groessen_waehlen() {
  local -a r
  mapfile -t r < <(groessen_rechner)
  local kerne=${r[0]} threads=${r[1]} ram=${r[2]} topo=${r[3]} j w
  echo "Rechner: $(lscpu | sed -n 's/^Model name: *//p'), $kerne Kerne, $threads Threads, $ram GiB RAM"
  j="$(groessen_empfehlung "$kerne" "$threads" "$ram" "$topo")"
  local abbruch; abbruch="$(jq -r '.abbruch // empty' <<<"$j")"
  local lv lr av ar
  if [[ -n "$abbruch" ]]; then
    echo "Keine Empfehlung: $(text "$abbruch")"
    [[ -n "${LAB_LLM_VCPU:-}" ]] || exit 1
  else
    lv=$(jq .llm.vcpu <<<"$j") lr=$(jq .llm.ramGib <<<"$j") av=$(jq .app.vcpu <<<"$j") ar=$(jq .app.ramGib <<<"$j")
    printf 'Empfehlung:  llm-host %d vCPU (CPU %s), %d GiB\n             app-host %d vCPU (CPU %s), %d GiB\n' \
      "$lv" "$(jq -r .llm.cpuset <<<"$j")" "$lr" "$av" "$(jq -r .app.cpuset <<<"$j")" "$ar"
    for w in $(jq -r '.warnungen[]' <<<"$j"); do echo "  Hinweis: $(text "$w")"; done
  fi
  lv="${LAB_LLM_VCPU:-$lv}" lr="${LAB_LLM_RAM_GIB:-$lr}" av="${LAB_APP_VCPU:-$av}" ar="${LAB_APP_RAM_GIB:-$ar}"
  if interaktiv && ! frage "Übernehmen? [J/n]" j; then
    while :; do
      read -r -p "llm-host vCPU [$lv]: " x && lv="${x:-$lv}"
      read -r -p "llm-host RAM GiB [$lr]: " x && lr="${x:-$lr}"
      read -r -p "app-host vCPU [$av]: " x && av="${x:-$av}"
      read -r -p "app-host RAM GiB [$ar]: " x && ar="${x:-$ar}"
      local f; f="$(groessen_pruefen "$kerne" "$threads" "$ram" "$lv" "$lr" "$av" "$ar")"
      [[ -z "$f" ]] && break
      echo "  Ungültig: $(text "$f")"
    done
  fi
  local f; f="$(groessen_pruefen "$kerne" "$threads" "$ram" "$lv" "$lr" "$av" "$ar")"
  [[ -z "$f" ]] || { echo "Ungültige Größen: $(text "$f")" >&2; exit 1; }
  local sets; sets="$(groessen_pinning "$lv" "$av" "$topo")" || exit 1
  export LAB_LLM_VCPU=$lv LAB_LLM_RAM_GIB=$lr LAB_LLM_CPUSET=${sets% *}
  export LAB_APP_VCPU=$av LAB_APP_RAM_GIB=$ar LAB_APP_CPUSET=${sets#* }
  echo "Gewählt: llm-host $lv vCPU (CPU $LAB_LLM_CPUSET), $lr GiB; app-host $av vCPU (CPU $LAB_APP_CPUSET), $ar GiB"
}

modell_kopieren() { # spart den Download in der VM, wenn der Rechner das GGUF schon hat
  local name; name="$(jq -r .filename "$REPO/docker/open-weight-llm/model-manifest.json")"
  local lokal="$REPO/models/open-weight-llm/$name"
  [[ -f "$lokal" ]] || return 0
  "${SSH[@]}" "labor@$LLM" test -f "/srv/arsnova/models/open-weight-llm/$name" && return 0
  echo "== GGUF vom Rechner kopieren"
  scp -q -o UserKnownHostsFile="$VMDIR/known_hosts" "$lokal" "labor@$LLM:/srv/arsnova/models/open-weight-llm/"
}

negativtests() {
  local ok=0 c
  c="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://$LLM:8080/health" || true)"
  if [[ "$c" == 000 ]]; then echo "OK      Rechner → llm-host:8080 gesperrt: keine Antwort"; else echo "FEHLER  Rechner → llm-host:8080 erreichbar: HTTP $c"; ok=1; fi
  local glieder; glieder="$(ip -br link show master virbr-1b | awk '{print $1}' | paste -sd' ')"
  local phys=""
  for i in $glieder; do [[ -e "/sys/class/net/$i/device" ]] && phys+="$i "; done
  if [[ -z "$phys" ]]; then echo "OK      Bridge virbr-1b nur mit VM-Schnittstellen: $glieder"; else echo "FEHLER  physische Schnittstelle in der Bridge: $phys"; ok=1; fi
  local modus; modus="$(LIBVIRT_DEFAULT_URI=qemu:///system virsh net-dumpxml arsnova-1b | sed -n "s/.*<forward mode='\([a-z]*\)'.*/\1/p")"
  if [[ "$modus" == nat ]]; then echo "OK      libvirt-Netz im Modus NAT (keine Portweiterleitung)"; else echo "FEHLER  libvirt-Netz im Modus '$modus'"; ok=1; fi
  local route; route="$(ip route show 192.168.150.0/24)"
  if [[ "$route" == *"dev virbr-1b"* ]]; then echo "OK      Labornetz nur über virbr-1b geroutet"; else echo "FEHLER  Route: $route"; ok=1; fi
  return "$ok"
}

pruefen() {
  local rc bericht; bericht="$OUT/aufbau-$(date +%Y%m%dT%H%M%S).txt"
  {
    echo "# 1B-Aufbaubericht (ohne Secrets) $(date --iso-8601=seconds)"
    echo "Repo: $(git -C "$REPO" rev-parse HEAD)"
    echo "Rechner: $(lscpu | sed -n 's/^Model name: *//p'); $(nproc) Threads; $(free -g | awk '/^Mem:/ {print $2}') GiB"
    local vm
    for vm in arsnova-1b-llm arsnova-1b-app; do
      echo "VM $vm: $(LIBVIRT_DEFAULT_URI=qemu:///system virsh dominfo "$vm" | awk '/^CPU\(s\)/ {c=$2} /^Max memory/ {m=$3/1048576} END {print c " vCPU, " m " GiB"}')"
    done
    bash "$HERE/vm/vm-linux.sh" status
    local f=0
    "${SSH[@]}" "labor@$LLM" "bash arsnova.eu/$EV/pruefen.sh llm" || f=1
    "${SSH[@]}" "labor@$APP" "bash arsnova.eu/$EV/pruefen.sh app" || f=1
    echo "== Negativtests vom Rechner"
    negativtests || f=1
    echo "== Ergebnis: $([[ $f == 0 ]] && echo 'alle Prüfungen OK' || echo 'FEHLER, siehe oben')"
    exit "$f"
  } 2>&1 | tee "$bericht" && rc=0 || rc=$?
  echo "Bericht: $bericht"
  return "$rc"
}

up() {
  voraussetzungen
  groessen_waehlen
  bash "$HERE/vm/vm-linux.sh" up
  modell_kopieren
  echo "== llm-host einrichten"
  "${SSH[@]}" "labor@$LLM" "bash arsnova.eu/$EV/llm-start.sh" 2>&1 | tee "$OUT/llm-start.log"
  echo "== app-host einrichten (Token nur per Pipe von VM zu VM)"
  "${SSH[@]}" "labor@$LLM" "sed -n 's/^OPEN_WEIGHT_LLM_TOKEN=//p' arsnova.eu/.env.llm" |
    "${SSH[@]}" "labor@$APP" "bash arsnova.eu/$EV/app-start.sh" 2>&1 | tee "$OUT/app-start.log"
  pruefen
}

case "${1:-}" in
  up) up ;;
  groessen) groessen_waehlen ;;
  pruefen) pruefen ;;
  status) bash "$HERE/vm/vm-linux.sh" status ;;
  destroy)
    frage "Beide Labor-VMs mit Disks und das Labornetz löschen? [j/N]" n || exit 0
    bash "$HERE/vm/vm-linux.sh" destroy
    ;;
  *) echo "Aufruf: $0 up|groessen|pruefen|status|destroy" >&2; exit 2 ;;
esac
