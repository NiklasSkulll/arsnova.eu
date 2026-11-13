<#
.SYNOPSIS
  1B-Labor: zwei Hyper-V-VMs unter Windows, Gegenstueck zu vm-linux.sh (ADR 1B-002, 1B-003, 1B-009).

.DESCRIPTION
  Status: ungetestet, Niklas prueft. Anleitung und offene Punkte: WINDOWS.md in diesem Ordner.

    vm-windows.ps1 -Mode up        Netz, Image, VMs anlegen und starten; Repo-Stand per git bundle kopieren
    vm-windows.ps1 -Mode sync      nur den Repo-Stand per git bundle in beide VMs bringen
    vm-windows.ps1 -Mode status    Zustand, IPs, SSH, docker version, ausgehendes NAT
    vm-windows.ps1 -Mode destroy   VMs, Disks, Seeds, NAT und Switch entfernen (nur arsnova-1b)

  Aufruf in einer Admin-PowerShell (Windows 10/11 Pro, Education oder Enterprise mit Hyper-V):
    powershell -ExecutionPolicy Bypass -File .\vm-windows.ps1 -Mode up

  Gleiche VM-Namen, IPs, Groessen, SSH-Nutzer (labor), Bereitschaftsmarke
  (/var/lib/labor-basis.done) und git-bundle-Checkout wie vm-linux.sh.
  Image, Seed-ISO und Bundle baut WSL (qemu-img, xorriso, git).

  Die Datei ist bewusst reines ASCII: Windows PowerShell 5.1 liest Skripte ohne BOM als ANSI,
  Umlaute und typografische Anfuehrungszeichen wuerden dort Zeichenketten zerbrechen.

  Quellen (Microsoft Learn, geprueft 2026-11-12):
  - NAT-Netz mit internem Switch, nur ein NAT pro Host:
    https://learn.microsoft.com/windows-server/virtualization/hyper-v/setup-nat-network
  - Secure-Boot-Template fuer Linux (MicrosoftUEFICertificateAuthority):
    https://learn.microsoft.com/windows-server/virtualization/hyper-v/generation-2-virtual-machine-security-features#secure-boot
  - Ubuntu 24.04 auf Hyper-V Gen 2 (UEFI, Secure Boot):
    https://learn.microsoft.com/windows-server/virtualization/hyper-v/supported-ubuntu-virtual-machines-on-hyper-v
  - Cmdlets: New-VM, Set-VM (-StaticMemory, -AutomaticCheckpointsEnabled), Set-VMProcessor (-Count),
    Set-VMNetworkAdapter (-StaticMacAddress), Set-VMFirmware (-SecureBootTemplate, -FirstBootDevice),
    Add-VMDvdDrive, Resize-VHD, New-NetNat/Get-NetNat/Remove-NetNat:
    https://learn.microsoft.com/powershell/module/hyper-v/
    https://learn.microsoft.com/powershell/module/netnat/
  - OpenSSH-Client: https://learn.microsoft.com/windows-server/administration/openssh/openssh_install_firstuse
  - wsl.exe (-d, -u, -e): https://learn.microsoft.com/windows/wsl/basic-commands
  cloud-init (NoCloud-Seed mit network-config, Netzwerk-Format v2, MAC-Match, routes to: default):
    https://docs.cloud-init.io/en/latest/reference/datasources/nocloud.html
    https://docs.cloud-init.io/en/latest/reference/network-config-format-v2.html

  Gueltigkeitsgrenze: Hyper-V bietet ueber Set-VMProcessor keine Pinning-Option (nur Anzahl,
  Reserve, Limit, Gewicht). Die VMs laufen daher ohne CPU-Pinning, anders als unter Linux.

.PARAMETER RepoPath
  Repo-Pfad aus Sicht von WSL. Standard: aus dem Ort dieses Skripts abgeleitet
  (\\wsl.localhost\<Distro>\... oder \\wsl$\<Distro>\... direkt, Laufwerkspfade per wslpath),
  danach git rev-parse --show-toplevel in WSL.
#>
[CmdletBinding()]
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidUsingWriteHost', '',
  Justification = 'Interaktives Laborskript: Meldungen gehen bewusst nur an die Konsole, nicht in die Pipeline.')]
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSReviewUnusedParameter', '',
  Justification = 'Fehlalarm: die Skriptparameter werden in den Funktionen unten gelesen; die Regel prueft nur den Skriptkoerper.')]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('up', 'sync', 'status', 'stop', 'start', 'destroy')]
  [string]$Mode,
  [string]$SshKey = (Join-Path $env:USERPROFILE '.ssh\id_ed25519.pub'),
  [string]$VmDir = 'C:\ProgramData\arsnova-1b',
  [string]$RepoPath = '',
  [string]$WslDistro = '',
  [string]$Commit = 'HEAD',
  [ValidateRange(1, 64)][int]$LlmCpus = 4,
  [ValidateRange(1, 512)][int]$LlmRamGB = 12,
  [ValidateRange(1, 64)][int]$AppCpus = 2,
  [ValidateRange(1, 512)][int]$AppRamGB = 6,
  [ValidateRange(20, 2048)][int]$LlmDiskGB = 20,
  [ValidateRange(25, 2048)][int]$AppDiskGB = 25,
  [switch]$EnableHyperV,
  [switch]$InstallWslTools,
  [switch]$NoSecureBoot
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$Net = 'arsnova-1b'
$NetAdapter = "vEthernet ($Net)"
$NetPrefix = '192.168.150.0/24'
$HostIp = '192.168.150.1'
$ImgUrl = 'https://cloud-images.ubuntu.com/releases/24.04/release'
$Img = 'ubuntu-24.04-server-cloudimg-amd64.img'
$BaseVhdx = 'ubuntu-24.04-base.vhdx'
$KnownHosts = (Join-Path $VmDir 'known_hosts') -replace '\\', '/'

$Vms = @(
  @{ Name = 'arsnova-1b-app'; Ip = '192.168.150.10'; Mac = '00155D1B0010'; Cpus = $AppCpus; RamGB = $AppRamGB; Reserve = 0; Weight = 100; DiskGB = $AppDiskGB; UserData = 'app-host.user-data.yaml' },
  @{ Name = 'arsnova-1b-llm'; Ip = '192.168.150.20'; Mac = '00155D1B0020'; Cpus = $LlmCpus; RamGB = $LlmRamGB; Reserve = 100; Weight = 200; DiskGB = $LlmDiskGB; UserData = 'llm-host.user-data.yaml' }
)

# Hilfsskript fuer WSL. Nur einfache Argumente ohne Anfuehrungszeichen gehen an wsl.exe,
# weil Windows PowerShell 5.1 eingebettete doppelte Anfuehrungszeichen an native Programme verliert.
$WslHelper = @'
#!/usr/bin/env bash
# Von vm-windows.ps1 geschrieben und bei jedem Lauf ueberschrieben. Laeuft in WSL.
set -euo pipefail
cmd="$1"; shift
case "$cmd" in
  check)
    for c in qemu-img xorriso git; do command -v "$c" >/dev/null || echo "$c"; done ;;
  install)
    command -v apt-get >/dev/null || { echo "kein apt-get in dieser WSL-Distribution" >&2; exit 1; }
    apt-get update -q
    DEBIAN_FRONTEND=noninteractive apt-get install -y -q qemu-utils xorriso git ;;
  toplevel)
    git -C "$1" rev-parse --show-toplevel ;;
  convert)
    # Auf ext4 in WSL umwandeln, dann ohne Loecher nach Windows kopieren.
    t="$(mktemp -d)"; trap 'rm -rf "$t"' EXIT
    cp "$1" "$t/in.img"
    qemu-img convert -O vhdx -o subformat=dynamic "$t/in.img" "$t/out.vhdx"
    cp --sparse=never "$t/out.vhdx" "$2" ;;
  seed)
    t="$(mktemp -d)"; trap 'rm -rf "$t"' EXIT
    cp "$1/user-data" "$1/meta-data" "$1/network-config" "$t/"
    (cd "$t" && xorriso -as mkisofs -quiet -o seed.iso -V cidata -J -r user-data meta-data network-config)
    cp "$t/seed.iso" "$2" ;;
  bundle)
    c="$(git -C "$1" rev-parse --verify "$2^{commit}")"
    git -C "$1" merge-base --is-ancestor "$c" HEAD || { echo "Commit $2 ist kein Vorfahre von HEAD" >&2; exit 1; }
    t="$(mktemp -d)"; trap 'rm -rf "$t"' EXIT
    git -C "$1" bundle create "$t/repo.bundle" HEAD 2>/dev/null
    cp "$t/repo.bundle" "$3"
    echo "$c" ;;
  *) echo "unbekannt: $cmd" >&2; exit 2 ;;
esac
'@

function Write-Step([string]$Text) { Write-Host "== $Text" -ForegroundColor Cyan }
function Write-Warn([string]$Text) { Write-Host "WARNUNG: $Text" -ForegroundColor Yellow }

function Write-Utf8Lf([string]$Path, [string]$Text) {
  # LF und UTF-8 ohne BOM: cloud-init und bash vertragen weder CRLF noch BOM.
  $clean = $Text -replace "`r`n", "`n" -replace "`r", "`n"
  [IO.File]::WriteAllText($Path, $clean, (New-Object Text.UTF8Encoding $false))
}

function Get-WslArg {
  if ($script:WslDistro) { return @('-d', $script:WslDistro) }
  return @()
}

function Invoke-Wsl {
  # Programm direkt in WSL starten (-e, ohne Shell); Ausgabe zurueckgeben, Fehler werfen.
  param([string[]]$Command, [switch]$AsRoot)
  $w = Get-WslArg
  if ($AsRoot) { $w += @('-u', 'root') }
  $out = & wsl.exe @w -e @Command
  if ($LASTEXITCODE -ne 0) { throw "WSL-Befehl fehlgeschlagen ($LASTEXITCODE): $($Command -join ' ')" }
  return $out
}

function ConvertTo-WslPath([string]$WinPath) {
  $p = Invoke-Wsl -Command @('wslpath', '-a', $WinPath)
  return ([string]($p | Select-Object -First 1)).Trim()
}

function Invoke-Helper([string[]]$HelperArgs, [switch]$AsRoot) {
  return Invoke-Wsl -Command (@('bash', $script:HelperWsl) + $HelperArgs) -AsRoot:$AsRoot
}

function Test-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  return (New-Object Security.Principal.WindowsPrincipal $id).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function ConvertTo-IpRange([string]$Prefix) {
  # "a.b.c.d/n" -> Start und Ende als UInt32 fuer den Ueberlappungstest.
  $addr, $len = $Prefix.Split('/')
  $b = ([Net.IPAddress]::Parse($addr)).GetAddressBytes()
  [Array]::Reverse($b)
  $ip = [BitConverter]::ToUInt32($b, 0)
  $size = [Math]::Pow(2, 32 - [int]$len)
  $start = [uint32]([Math]::Floor($ip / $size) * $size)
  return @{ Start = [double]$start; End = [double]$start + $size - 1 }
}

function Test-Overlap([string]$A, [string]$B) {
  $x = ConvertTo-IpRange $A
  $y = ConvertTo-IpRange $B
  return ($x.Start -le $y.End -and $y.Start -le $x.End)
}

function Assert-HyperV {
  if (-not (Test-Admin)) {
    throw 'Bitte PowerShell als Administrator starten (Rechtsklick > Als Administrator ausfuehren).'
  }
  $feat = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -ErrorAction SilentlyContinue
  if (-not $feat) {
    throw 'Hyper-V ist auf diesem Windows nicht verfuegbar (Windows Home?). Noetig: Windows 10/11 Pro, Education oder Enterprise.'
  }
  if ($feat.State -ne 'Enabled') {
    if ($EnableHyperV) {
      Write-Step 'Hyper-V wird aktiviert'
      Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All -NoRestart | Out-Null
      Write-Host 'Hyper-V aktiviert. Bitte Windows neu starten und das Skript danach erneut aufrufen.'
      exit 0
    }
    throw ("Hyper-V ist nicht aktiviert. Einmalig in einer Admin-PowerShell ausfuehren und danach neu starten:`n" +
      "  Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All`n" +
      'oder dieses Skript mit -EnableHyperV aufrufen.')
  }
  if (-not (Get-Command New-VM -ErrorAction SilentlyContinue)) {
    throw ("Hyper-V-PowerShell-Modul fehlt. Ausfuehren und neu starten:`n" +
      '  Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All')
  }
}

function Initialize-Wsl {
  if (-not (Get-Command wsl.exe -ErrorAction SilentlyContinue)) {
    throw 'WSL fehlt. Installieren mit: wsl --install (danach Neustart und Ubuntu einrichten).'
  }
  # UNC-Pfad in eine WSL-Distribution: Distro und Repo-Pfad direkt ablesen.
  if ($PSScriptRoot -match '^\\\\wsl(?:\.localhost|\$)\\([^\\]+)(\\.*)$') {
    if (-not $script:WslDistro) { $script:WslDistro = $Matches[1] }
    $scriptWsl = $Matches[2] -replace '\\', '/'
  }
  else {
    $scriptWsl = $null
  }
  & wsl.exe @(Get-WslArg) -e true
  if ($LASTEXITCODE -ne 0) {
    throw 'WSL startet keine Distribution. Pruefen mit: wsl --status ; installieren mit: wsl --install -d Ubuntu'
  }
  $script:VmDirWsl = ConvertTo-WslPath $VmDir
  $script:HelperWsl = "$($script:VmDirWsl)/wsl-helper.sh"
  Write-Utf8Lf (Join-Path $VmDir 'wsl-helper.sh') $WslHelper

  $missing = @(Invoke-Helper @('check') | Where-Object { $_ })
  if ($missing.Count -gt 0) {
    if ($InstallWslTools) {
      Write-Step "WSL-Werkzeuge installieren: $($missing -join ', ')"
      Invoke-Helper @('install') -AsRoot | Out-Host
    }
    else {
      throw ("In WSL fehlen: $($missing -join ', '). Einmalig in WSL ausfuehren:`n" +
        "  sudo apt install -y qemu-utils xorriso git`noder dieses Skript mit -InstallWslTools aufrufen.")
    }
  }

  if (-not $script:RepoPath) {
    if (-not $scriptWsl) { $scriptWsl = ConvertTo-WslPath $PSScriptRoot }
    $script:RepoPath = ([string](Invoke-Helper @('toplevel', $scriptWsl) | Select-Object -First 1)).Trim()
  }
  Write-Host "WSL: $(if ($script:WslDistro) { $script:WslDistro } else { 'Standard-Distribution' }), Repo: $($script:RepoPath)"
}

function Assert-Preflight {
  Assert-HyperV
  foreach ($c in 'ssh.exe', 'scp.exe') {
    if (-not (Get-Command $c -ErrorAction SilentlyContinue)) {
      throw ("$c fehlt (Windows-OpenSSH-Client). Installieren in einer Admin-PowerShell:`n" +
        '  Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0')
    }
  }
  if (-not (Test-Path $SshKey)) {
    throw ("SSH-Schluessel fehlt: $SshKey. Anlegen (normale PowerShell):`n" +
      "  ssh-keygen -t ed25519 -f `"$($SshKey -replace '\.pub$', '')`"")
  }
  New-Item -ItemType Directory -Force -Path $VmDir | Out-Null

  # Ressourcen nur vor dem ersten Anlegen pruefen; laufende VMs belegen ihren RAM schon.
  if (-not (Get-VM -Name 'arsnova-1b-*' -ErrorAction SilentlyContinue)) {
    . (Join-Path (Split-Path $PSScriptRoot -Parent) 'groessen.ps1')
    $needGB = $LlmRamGB + $AppRamGB
    $diskGB = $LlmDiskGB + $AppDiskGB
    $freeGB = [int][Math]::Floor((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1MB)
    $drive = Get-PSDrive -Name $VmDir.Substring(0, 1)
    $freeDisk = [int][Math]::Floor($drive.Free / 1GB)
    Write-Host "Belegt: $needGB GB RAM fest (statischer Speicher), $($LlmCpus + $AppCpus) vCPU, Platte bis $diskGB GB (real etwa 31 GB)."
    Write-Host "Frei jetzt: $freeGB GB RAM, $freeDisk GB auf $($drive.Name):. Windows blieben etwa $($freeGB - $needGB) GB RAM."
    $r = Test-LaborRessourcen -FreiRamGib $freeGB -FreiDiskGib $freeDisk -PlanRamGib $needGB -PlanDiskGib $diskGB
    if ($r.warnungen -contains 'disk-wachstum') {
      Write-Warn "die Platten koennen im schlimmsten Fall bis $diskGB GB wachsen; dann wird der Platz auf $($drive.Name): knapp."
    }
    if ($r.abbruch -eq 'ram-frei') {
      throw "Abbruch, nichts angelegt: nach dem Start blieben Windows weniger als 4 GB RAM. Programme schliessen (auch WSL: wsl --shutdown) oder kleinere Groessen waehlen."
    }
    if ($r.abbruch -eq 'disk-frei') {
      throw "Abbruch, nichts angelegt: auf $($drive.Name): sind $freeDisk GB frei; noetig sind etwa 31 GB plus 10 GB Reserve."
    }
    Write-Host 'Zurueck zum Ausgangszustand jederzeit mit: labor.ps1 -Mode destroy'
  }
  Initialize-Wsl
}

function Initialize-Network {
  Write-Step "Netz $Net ($NetPrefix, Host $HostIp, NAT)"
  foreach ($n in @(Get-NetNat -ErrorAction SilentlyContinue)) {
    if ($n.Name -eq $Net) { continue }
    if (Test-Overlap $n.InternalIPInterfaceAddressPrefix $NetPrefix) {
      throw "Vorhandenes NAT '$($n.Name)' ($($n.InternalIPInterfaceAddressPrefix)) ueberschneidet $NetPrefix. Erst entfernen oder anderes Labornetz waehlen."
    }
    Write-Warn "es gibt schon ein NAT '$($n.Name)' ($($n.InternalIPInterfaceAddressPrefix)). Microsoft dokumentiert nur ein NAT-Netz pro Host; New-NetNat kann daran scheitern."
  }
  $clash = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
      Where-Object { $_.InterfaceAlias -ne $NetAdapter -and (Test-Overlap "$($_.IPAddress)/32" $NetPrefix) })
  if ($clash.Count -gt 0) {
    throw "Adresse $($clash[0].IPAddress) auf '$($clash[0].InterfaceAlias)' liegt schon in $NetPrefix (Heimnetz?). Labornetz waere nicht eindeutig."
  }

  $sw = Get-VMSwitch -Name $Net -ErrorAction SilentlyContinue
  if (-not $sw) {
    New-VMSwitch -Name $Net -SwitchType Internal | Out-Null
  }
  elseif ($sw.SwitchType -ne 'Internal') {
    throw "Switch $Net existiert, ist aber $($sw.SwitchType) statt Internal. Mit -Mode destroy entfernen."
  }
  if (-not (Get-NetIPAddress -InterfaceAlias $NetAdapter -IPAddress $HostIp -ErrorAction SilentlyContinue)) {
    New-NetIPAddress -InterfaceAlias $NetAdapter -IPAddress $HostIp -PrefixLength 24 | Out-Null
  }
  if (-not (Get-NetNat -Name $Net -ErrorAction SilentlyContinue)) {
    try {
      New-NetNat -Name $Net -InternalIPInterfaceAddressPrefix $NetPrefix | Out-Null
    }
    catch {
      throw "New-NetNat fehlgeschlagen: $($_.Exception.Message). Andere NAT-Netze: Get-NetNat (nur eines pro Host)."
    }
  }
}

function Initialize-Image {
  $imgPath = Join-Path $VmDir $Img
  $sumPath = Join-Path $VmDir 'SHA256SUMS'
  if (-not (Test-Path $imgPath)) {
    Write-Step "Image laden: $ImgUrl/$Img"
    $curl = Join-Path $env:SystemRoot 'System32\curl.exe'
    if (Test-Path $curl) {
      & $curl -fL -o $imgPath "$ImgUrl/$Img"
      if ($LASTEXITCODE -ne 0) { Remove-Item -Force -ErrorAction SilentlyContinue $imgPath; throw 'Download des Images fehlgeschlagen.' }
      & $curl -fsSL -o $sumPath "$ImgUrl/SHA256SUMS"
      if ($LASTEXITCODE -ne 0) { throw 'Download von SHA256SUMS fehlgeschlagen.' }
    }
    else {
      [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
      Invoke-WebRequest -UseBasicParsing -Uri "$ImgUrl/$Img" -OutFile $imgPath
      Invoke-WebRequest -UseBasicParsing -Uri "$ImgUrl/SHA256SUMS" -OutFile $sumPath
    }
  }
  $line = Get-Content $sumPath | Where-Object { $_ -match "^([0-9a-f]{64}) \*?$([regex]::Escape($Img))$" } | Select-Object -First 1
  if (-not $line) { throw "$Img nicht in SHA256SUMS gefunden." }
  $expected = ($line -split ' ')[0]
  $actual = (Get-FileHash -Algorithm SHA256 -Path $imgPath).Hash.ToLowerInvariant()
  if ($actual -ne $expected) {
    throw "SHA256 stimmt nicht ($actual statt $expected). $imgPath und SHA256SUMS loeschen und neu laden."
  }
  Write-Host "${Img}: SHA256 OK"

  $base = Join-Path $VmDir $BaseVhdx
  if (-not (Test-Path $base)) {
    Write-Step 'Image nach VHDX umwandeln (WSL, qemu-img)'
    Invoke-Helper @('convert', "$($script:VmDirWsl)/$Img", "$($script:VmDirWsl)/$BaseVhdx") | Out-Host
  }
}

function Copy-Plain([string]$From, [string]$To) {
  # Frische Datei per Stream: nicht sparse (Hyper-V lehnt sparse VHDX ab).
  $in = [IO.File]::OpenRead($From)
  try {
    $out = [IO.File]::Create($To)
    try { $in.CopyTo($out, 4MB) } finally { $out.Dispose() }
  }
  finally { $in.Dispose() }
}

function Build-Seed($Vm) {
  $dir = Join-Path $VmDir "$($Vm.Name)-seed"
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $key = (Get-Content -Raw $SshKey).Trim()
  $ud = (Get-Content -Raw (Join-Path $PSScriptRoot $Vm.UserData)).Replace('__SSH_KEY__', $key)
  Write-Utf8Lf (Join-Path $dir 'user-data') $ud
  $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  Write-Utf8Lf (Join-Path $dir 'meta-data') "instance-id: $($Vm.Name)-$stamp`nlocal-hostname: $($Vm.Name)`n"
  # Netzwerk-Format v2 (cloud-init), Treffer ueber die feste MAC (Kleinbuchstaben, Doppelpunkte).
  # Der NAT-Switch vergibt weder IP noch DNS, deshalb statisch.
  $mac = (($Vm.Mac.ToLowerInvariant() -split '(..)' | Where-Object { $_ }) -join ':')
  $nc = @"
version: 2
ethernets:
  eth0:
    match:
      macaddress: '$mac'
    set-name: eth0
    addresses: [$($Vm.Ip)/24]
    routes:
      - to: default
        via: $HostIp
    nameservers:
      addresses: [1.1.1.1, 9.9.9.9]
"@
  Write-Utf8Lf (Join-Path $dir 'network-config') ($nc + "`n")
  $iso = Join-Path $VmDir "$($Vm.Name)-seed.iso"
  Invoke-Helper @('seed', "$($script:VmDirWsl)/$($Vm.Name)-seed", "$($script:VmDirWsl)/$($Vm.Name)-seed.iso") | Out-Host
  return $iso
}

function Initialize-Vm($Vm) {
  $n = $Vm.Name
  $ist = Get-VM -Name $n -ErrorAction SilentlyContinue
  if ($ist) {
    Write-Host "$n existiert schon"
    if ($ist.ProcessorCount -ne $Vm.Cpus -or $ist.MemoryStartup -ne ([int64]$Vm.RamGB * 1GB)) {
      throw "$n hat $($ist.ProcessorCount) vCPU und $([Math]::Round($ist.MemoryStartup / 1GB)) GB, gewuenscht $($Vm.Cpus) und $($Vm.RamGB); zuerst -Mode destroy"
    }
    if ($ist.State -ne 'Running') { Start-VM -Name $n }
    return
  }
  Write-Step "VM $n ($($Vm.Cpus) vCPU, $($Vm.RamGB) GB RAM, $($Vm.DiskGB) GB Disk, $($Vm.Ip))"
  $vhdx = Join-Path $VmDir "$n.vhdx"
  Copy-Plain (Join-Path $VmDir $BaseVhdx) $vhdx
  Resize-VHD -Path $vhdx -SizeBytes ([int64]$Vm.DiskGB * 1GB)
  $iso = Build-Seed $Vm

  New-VM -Name $n -Generation 2 -MemoryStartupBytes ([int64]$Vm.RamGB * 1GB) -VHDPath $vhdx -SwitchName $Net -Path $VmDir | Out-Null
  # Statischer Speicher und keine automatischen Checkpoints (sonst .avhdx neben der Disk).
  Set-VM -Name $n -StaticMemory -AutomaticCheckpointsEnabled $false
  # Hyper-V kennt kein Pinning (Gueltigkeitsgrenze, siehe WINDOWS.md). Ersatz (ADR 1B-010):
  # llm-host bekommt 100 % Reserve je vCPU und doppeltes Gewicht gegenueber dem app-host.
  Set-VMProcessor -VMName $n -Count $Vm.Cpus -Reserve $Vm.Reserve -RelativeWeight $Vm.Weight
  Set-VMNetworkAdapter -VMName $n -StaticMacAddress $Vm.Mac
  Add-VMDvdDrive -VMName $n -Path $iso
  $disk = Get-VMHardDiskDrive -VMName $n | Select-Object -First 1
  if ($NoSecureBoot) {
    Set-VMFirmware -VMName $n -EnableSecureBoot Off -FirstBootDevice $disk
  }
  else {
    Set-VMFirmware -VMName $n -EnableSecureBoot On -SecureBootTemplate MicrosoftUEFICertificateAuthority -FirstBootDevice $disk
  }
  Start-VM -Name $n
}

function Get-SshOption {
  $o = @('-o', 'StrictHostKeyChecking=accept-new', '-o', "UserKnownHostsFile=$KnownHosts",
    '-o', 'ConnectTimeout=5', '-o', 'BatchMode=yes', '-o', 'LogLevel=ERROR')
  $priv = $SshKey -replace '\.pub$', ''
  if ($priv -ne $SshKey -and (Test-Path $priv)) { $o += @('-i', $priv) }
  return $o
}

function Invoke-Ssh([string]$Ip, [string]$RemoteCommand, [switch]$Quiet) {
  $o = Get-SshOption
  if ($Quiet) {
    # In PowerShell 5.1 wird umgeleitetes stderr bei 'Stop' zum Abbruch; hier nur Exitcode zaehlt.
    $old = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { & ssh.exe @o "labor@$Ip" $RemoteCommand 2>$null | Out-Null } finally { $ErrorActionPreference = $old }
  }
  else {
    # Ausgabe direkt anzeigen; sonst landet sie im Rueckgabewert neben dem Exitcode.
    & ssh.exe @o "labor@$Ip" $RemoteCommand | Out-Host
  }
  return $LASTEXITCODE
}

function Wait-Ready([string]$Ip, [string]$Name) {
  Write-Host "warte auf $Name ($Ip): SSH und /var/lib/labor-basis.done (max. 15 min)"
  for ($i = 0; $i -lt 90; $i++) {
    if ((Invoke-Ssh $Ip 'test -f /var/lib/labor-basis.done' -Quiet) -eq 0) { return }
    Start-Sleep -Seconds 10
  }
  throw "VM $Ip nach 15 min nicht bereit (in der VM: sudo cloud-init status --long; Bootausgabe: vmconnect localhost $Name)"
}

function Invoke-Up {
  Assert-Preflight
  Initialize-Network
  Initialize-Image
  foreach ($vm in $Vms) { Initialize-Vm $vm }

  Invoke-Sync
  Invoke-Status
}

function Invoke-Sync {
  Write-Step "git bundle aus $($script:RepoPath) (HEAD)"
  $sha = [string](Invoke-Helper @('bundle', $script:RepoPath, $Commit, "$($script:VmDirWsl)/repo.bundle") | Select-Object -Last 1)
  $sha = $sha.Trim()
  if ($sha -notmatch '^[0-9a-f]{40,64}$') { throw "Commit nicht aufloesbar: $Commit" }
  Write-Host "Repo-Stand fuer die VMs: $sha"

  $o = Get-SshOption
  foreach ($vm in $Vms) {
    Wait-Ready $vm.Ip $vm.Name
    # Relativer Pfad, damit scp das Laufwerk C: nicht als Hostnamen liest.
    Push-Location $VmDir
    try {
      & scp.exe -q @o 'repo.bundle' "labor@$($vm.Ip):/tmp/repo.bundle"
      if ($LASTEXITCODE -ne 0) { throw "scp nach $($vm.Ip) fehlgeschlagen" }
    }
    finally { Pop-Location }
    $rc = Invoke-Ssh $vm.Ip "test -d arsnova.eu || git clone -q /tmp/repo.bundle arsnova.eu; cd arsnova.eu && git fetch -q /tmp/repo.bundle && git checkout -q --detach $sha && git log --oneline -1"
    if ($rc -ne 0) { throw "Checkout in $($vm.Name) fehlgeschlagen" }
  }
}

function Invoke-Status {
  Assert-HyperV
  $sw = Get-VMSwitch -Name $Net -ErrorAction SilentlyContinue
  $nat = Get-NetNat -Name $Net -ErrorAction SilentlyContinue
  Write-Host "Switch: $(if ($sw) { "$($sw.Name) ($($sw.SwitchType))" } else { 'fehlt' }); NAT: $(if ($nat) { $nat.InternalIPInterfaceAddressPrefix } else { 'fehlt' })"
  Get-NetRoute -DestinationPrefix $NetPrefix -ErrorAction SilentlyContinue |
    ForEach-Object { Write-Host "Route $($_.DestinationPrefix) ueber $($_.InterfaceAlias)" }
  foreach ($vm in $Vms) {
    $v = Get-VM -Name $vm.Name -ErrorAction SilentlyContinue
    if (-not $v) { Write-Host "== $($vm.Name) ($($vm.Ip)): fehlt"; continue }
    $cpu = (Get-VMProcessor -VMName $vm.Name).Count
    $ips = (Get-VMNetworkAdapter -VMName $vm.Name).IPAddresses -join ', '
    $p = Get-VMProcessor -VMName $vm.Name
    Write-Host "== $($vm.Name) ($($vm.Ip)): $($v.State), $cpu vCPU ohne Pinning (Reserve $($p.Reserve) %, Gewicht $($p.RelativeWeight)), $([Math]::Round($v.MemoryStartup / 1GB)) GB RAM, gemeldete IPs: $ips"
    $rc = Invoke-Ssh $vm.Ip 'docker version --format ''docker {{.Server.Version}}''; node --version; curl -fsSI https://deb.debian.org >/dev/null && echo ''ausgehend: ok''; git -C arsnova.eu log --oneline -1 2>/dev/null'
    # ssh meldet Verbindungsfehler mit 255; andere Codes stammen vom letzten Befehl in der VM.
    if ($rc -eq 255) { Write-Host 'SSH nicht erreichbar' }
  }
}

function Invoke-Destroy {
  Assert-HyperV
  foreach ($vm in $Vms) {
    $n = $vm.Name
    if (Get-VM -Name $n -ErrorAction SilentlyContinue) {
      Stop-VM -Name $n -TurnOff -Force -ErrorAction SilentlyContinue
      Remove-VM -Name $n -Force
    }
    foreach ($p in "$n.vhdx", "$n-seed.iso", "$n-seed", $n) {
      $full = Join-Path $VmDir $p
      if (Test-Path $full) { Remove-Item -Recurse -Force $full }
    }
  }
  if (Get-NetNat -Name $Net -ErrorAction SilentlyContinue) { Remove-NetNat -Name $Net -Confirm:$false }
  if (Get-VMSwitch -Name $Net -ErrorAction SilentlyContinue) { Remove-VMSwitch -Name $Net -Force }
  foreach ($p in 'known_hosts', 'repo.bundle') {
    $full = Join-Path $VmDir $p
    if (Test-Path $full) { Remove-Item -Force $full }
  }
  Write-Host "entfernt. Image und Basis-VHDX bleiben in $VmDir (fuer den naechsten Lauf)."
}

# stop/start: zwischen Messungen belegen die VMs keinen RAM; Disks und Einrichtung bleiben.
function Invoke-Stop {
  Assert-HyperV
  foreach ($vm in $Vms) {
    $v = Get-VM -Name $vm.Name -ErrorAction SilentlyContinue
    if ($v -and $v.State -ne 'Off') { Stop-VM -Name $vm.Name -Force }
  }
  Write-Host 'Beide VMs aus; RAM und CPU sind wieder frei.'
}

function Invoke-Start {
  Assert-HyperV
  foreach ($vm in $Vms) {
    if (-not (Get-VM -Name $vm.Name -ErrorAction SilentlyContinue)) { throw "$($vm.Name) fehlt: zuerst labor.ps1 -Mode up" }
  }
  foreach ($vm in ($Vms | Sort-Object { $_.Name } -Descending)) {
    if ((Get-VM -Name $vm.Name).State -ne 'Running') { Start-VM -Name $vm.Name }
  }
  Write-Host 'VMs gestartet.'
}

try {
  switch ($Mode) {
    'up' { Invoke-Up }
    'sync' { Assert-HyperV; Initialize-Wsl; Invoke-Sync }
    'status' { Invoke-Status }
    'stop' { Invoke-Stop }
    'start' { Invoke-Start }
    'destroy' { Invoke-Destroy }
  }
  # Explizit 0, sonst bliebe der Code des letzten ssh-Aufrufs stehen (labor.ps1 prueft ihn).
  exit 0
}
catch {
  Write-Host "FEHLER: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
