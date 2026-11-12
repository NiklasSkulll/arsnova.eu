#!/usr/bin/env bash
# 1B: echter Test von labor.ps1 in einer Windows-11-VM mit verschachtelter Virtualisierung
# (Plan, Nachtrag Task 12 Step 6). Läuft auf einem Linux-Rechner mit KVM und libvirt.
#
#   win-test.sh vm      Netz, Wegwerf-Passwort, Unattend-ISO, Windows-VM installieren, auf SSH warten
#   win-test.sh wsl     WSL mit Ubuntu (wsl --import aus dem offiziellen Archiv), Repo per git bundle
#   win-test.sh labor   labor.ps1 -Mode up, pruefen, Entwicklungslauf (LAB_N=1), Logs nach WIN_OUT
#   win-test.sh destroy Windows-VM, Disk und Netz entfernen (ISO bleibt)
#
# Voraussetzungen: Labor-VMs abgebaut (labor.sh destroy; das Netz nutzt dieselbe Bridge virbr-1b,
# damit gelten die ufw-Freigaben), ISO unter WIN_DIR, kvm_intel nested=Y, OVMF, xorriso.
# Netz 192.168.151.0/24, damit es sich nicht mit dem Labornetz 192.168.150.0/24 in Windows überschneidet.
set -euo pipefail
HERE="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
REPO="$(git -C "$HERE" rev-parse --show-toplevel)"
export LIBVIRT_DEFAULT_URI=qemu:///system
WIN_DIR="${WIN_DIR:-/var/lib/libvirt/images/arsnova-1b/win}"
WIN_OUT="${WIN_OUT:-$HOME/labor-1b/windows-test}"
ISO="${WIN_ISO:-$WIN_DIR/win11-eval-de.iso}"
NAME=arsnova-1b-win NET=arsnova-1b-win IP=192.168.151.10 MAC=52:54:00:1b:01:10
KEY="${LAB_SSH_KEY:-$HOME/.ssh/id_ed25519.pub}"
SSH=(ssh -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="$WIN_DIR/known_hosts" -o ConnectTimeout=5 -o BatchMode=yes "labor@$IP")
WSL_URL=https://cloud-images.ubuntu.com/wsl/releases/24.04/current
WSL_TAR=ubuntu-noble-wsl-amd64-24.04lts.rootfs.tar.gz
mkdir -p "$WIN_OUT"
log() { echo "$(date --iso-8601=seconds) $*"; }
win() { "${SSH[@]}" "$@"; }

warte_ssh() { # max. Minuten
  for _ in $(seq 1 $(($1 * 6))); do win 'exit 0' 2>/dev/null && return 0; sleep 10; done
  echo "Windows nach $1 min nicht per SSH erreichbar (Konsole: virt-viewer $NAME)" >&2
  exit 1
}

vm() {
  [[ -f "$ISO" ]] || { echo "ISO fehlt: $ISO" >&2; exit 1; }
  if virsh net-info arsnova-1b >/dev/null 2>&1; then
    echo "Labornetz arsnova-1b existiert (gleiche Bridge): zuerst labor.sh destroy" >&2
    exit 1
  fi
  if ! virsh net-info "$NET" >/dev/null 2>&1; then
    virsh net-define /dev/stdin <<EOF
<network>
  <name>$NET</name>
  <forward mode='nat'/>
  <bridge name='virbr-1b' stp='on' delay='0'/>
  <ip address='192.168.151.1' netmask='255.255.255.0'>
    <dhcp>
      <range start='192.168.151.100' end='192.168.151.199'/>
      <host mac='$MAC' name='$NAME' ip='$IP'/>
    </dhcp>
  </ip>
</network>
EOF
  fi
  virsh net-start "$NET" 2>/dev/null || true
  if virsh dominfo "$NAME" >/dev/null 2>&1; then echo "$NAME existiert schon"; warte_ssh 120; return; fi

  local t; t="$(mktemp -d)"
  umask 077
  [[ -f "$WIN_DIR/passwort" ]] || openssl rand -base64 18 | tr -d '/+=' >"$WIN_DIR/passwort"
  sed "s|__PASSWORT__|$(cat "$WIN_DIR/passwort")|g" "$HERE/autounattend.xml" >"$t/autounattend.xml"
  cp "$HERE/setup.ps1" "$t/"
  cp "$KEY" "$t/authorized_keys"
  xorriso -as mkisofs -quiet -o "$WIN_DIR/unattend.iso" -V UNATTEND -J -joliet-long -r "$t"
  rm -rf "$t"

  log "Windows-VM anlegen und installieren"
  virt-install --name "$NAME" --memory 22528 --vcpus 4,sockets=1,cores=4,threads=1 \
    --cpu host-passthrough --osinfo win11 --boot uefi \
    --disk "path=$WIN_DIR/$NAME.qcow2,size=110,format=qcow2,bus=sata" \
    --disk "path=$ISO,device=cdrom,bus=sata" --disk "path=$WIN_DIR/unattend.iso,device=cdrom,bus=sata" \
    --network "network=$NET,mac=$MAC,model=e1000e" \
    --graphics vnc,listen=127.0.0.1 --noautoconsole --wait 0
  # Das UEFI-Bootmenü des ISO wartet auf „Taste drücken“; Enter senden, bis Setup läuft.
  for _ in $(seq 1 20); do virsh send-key "$NAME" KEY_ENTER >/dev/null 2>&1 || true; sleep 1; done
  log "warte auf Installation, ersten Login, setup.ps1 und Neustart (bis 120 min)"
  warte_ssh 120
  until win 'Test-Path C:\1b-setup.done' 2>/dev/null | grep -q True; do sleep 20; done
  sleep 120
  warte_ssh 30
 win '(Get-CimInstance Win32_OperatingSystem).Caption; (Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V).State' |
    tee "$WIN_OUT/windows.txt"
}

wsl_einrichten() {
  log "WSL installieren (ohne Distribution)"
 win 'wsl.exe --install --no-distribution; exit 0' | tr -d '\0' || true
 win 'Restart-Computer -Force' || true
  sleep 90
  warte_ssh 30
 win 'wsl.exe --update; wsl.exe --version' | tr -d '\0' | tee -a "$WIN_OUT/windows.txt" || true
  log "Ubuntu 24.04 aus $WSL_URL importieren"
  curl -fsSL -o "$WIN_DIR/SHA256SUMS.wsl" "$WSL_URL/SHA256SUMS"
  [[ -f "$WIN_DIR/$WSL_TAR" ]] || curl -fL -o "$WIN_DIR/$WSL_TAR" "$WSL_URL/$WSL_TAR"
  (cd "$WIN_DIR" && grep " \*\?$WSL_TAR\$" SHA256SUMS.wsl | sha256sum -c -)
 win 'New-Item -ItemType Directory -Force C:\1b, C:\wsl | Out-Null'
  scp -q -o UserKnownHostsFile="$WIN_DIR/known_hosts" "$WIN_DIR/$WSL_TAR" "labor@$IP:C:/1b/ubuntu.tar.gz"
 win "if (-not ((wsl.exe -l -q) -replace \"\`0\", '' | Select-String -Quiet '^Ubuntu$')) { wsl.exe --import Ubuntu C:\\wsl\\Ubuntu C:\\1b\\ubuntu.tar.gz }; wsl.exe --set-default Ubuntu; wsl.exe -d Ubuntu -u root -e uname -a" | tr -d '\0'
  log "Repo-Stand per git bundle in WSL"
  git -C "$REPO" bundle create "$WIN_DIR/repo.bundle" HEAD 2>/dev/null
  scp -q -o UserKnownHostsFile="$WIN_DIR/known_hosts" "$WIN_DIR/repo.bundle" "labor@$IP:C:/1b/repo.bundle"
  local sha; sha="$(git -C "$REPO" rev-parse HEAD)"
 win "wsl.exe -d Ubuntu -u root -e bash -c 'command -v git >/dev/null || (apt-get update -q && DEBIAN_FRONTEND=noninteractive apt-get install -y -q git); test -d /root/arsnova.eu || git clone -q /mnt/c/1b/repo.bundle /root/arsnova.eu; cd /root/arsnova.eu && git fetch -q /mnt/c/1b/repo.bundle && git checkout -q --detach $sha && git log --oneline -1'" | tr -d '\0'
  # SSH-Schluessel fuer labor.ps1 (PowerShell 5.1 verliert leere Argumente, daher cmd).
 win 'if (-not (Test-Path $env:USERPROFILE\.ssh\id_ed25519)) { New-Item -ItemType Directory -Force $env:USERPROFILE\.ssh | Out-Null; cmd /c "ssh-keygen -q -t ed25519 -N \"\" -f %USERPROFILE%\.ssh\id_ed25519" }; Test-Path $env:USERPROFILE\.ssh\id_ed25519.pub'
}

labor() {
  local p='\\wsl.localhost\Ubuntu\root\arsnova.eu\docs\referat-thema-1\evidenz\1B\labor.ps1'
  log "labor.ps1 -Mode groessen"
 win "powershell -NoProfile -ExecutionPolicy Bypass -File $p -Mode groessen -Ja" | tee "$WIN_OUT/groessen.txt"
  log "labor.ps1 -Mode up (dauert lange: verschachtelt, App-Build)"
 win "powershell -NoProfile -ExecutionPolicy Bypass -File $p -Mode up -Ja -EnableHyperV -InstallWslTools" 2>&1 | tee "$WIN_OUT/up.txt"
  log "labor.ps1 -Mode pruefen"
 win "powershell -NoProfile -ExecutionPolicy Bypass -File $p -Mode pruefen" 2>&1 | tee "$WIN_OUT/pruefen.txt" || true
  log "Entwicklungslauf mit einem Auftrag"
 win "powershell -NoProfile -ExecutionPolicy Bypass -File $p -Mode lauf -LabN 1 -LabTag dev-win -LabTimeoutMs 300000" 2>&1 |
    tee "$WIN_OUT/lauf.txt" || true
  scp -q -r -o UserKnownHostsFile="$WIN_DIR/known_hosts" "labor@$IP:C:/Users/labor/labor-1b" "$WIN_OUT/von-windows" || true
}

destroy() {
  virsh destroy "$NAME" 2>/dev/null || true
  virsh undefine "$NAME" --nvram 2>/dev/null || virsh undefine "$NAME" 2>/dev/null || true
  rm -f "$WIN_DIR/$NAME.qcow2" "$WIN_DIR/unattend.iso" "$WIN_DIR/known_hosts" "$WIN_DIR/passwort" "$WIN_DIR/repo.bundle"
  virsh net-destroy "$NET" 2>/dev/null || true
  virsh net-undefine "$NET" 2>/dev/null || true
}

case "${1:-}" in
  vm) vm ;;
  wsl) wsl_einrichten ;;
  labor) labor ;;
  destroy) destroy ;;
  *) echo "Aufruf: $0 vm|wsl|labor|destroy" >&2; exit 2 ;;
esac
