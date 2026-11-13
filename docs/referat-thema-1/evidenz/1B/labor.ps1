<#
.SYNOPSIS
  1B-Labor unter Windows mit einem Befehl, Gegenstueck zu labor.sh (ADR 1B-010).

.DESCRIPTION
  Ohne WSL (seit 2026-11-13). Getestet: siehe evidenz/1B/2026-11-13-windows-test.md.

    labor.ps1 -Mode vorpruefung  nur pruefen, ob dieser Rechner bereit ist (aendert nichts)
    labor.ps1 -Mode up        Groessenwahl, VMs (vm-windows.ps1), llm-host, app-host, Pruefungen
                              -NurVorbereiten: alles anlegen, aber keine VM starten
    labor.ps1 -Mode groessen  nur Empfehlung und Groessenwahl anzeigen, nichts anlegen
    labor.ps1 -Mode pruefen   nur die Pruefungen (Runbook 10, 11, Negativtests), Bericht schreiben
    labor.ps1 -Mode kalibrierung  eine nicht gewertete Anfrage, Timeout nach Regel (ADR 1B-005)
    labor.ps1 -Mode lauf      gewerteter Lauf (-LabN, -LabTag, -LabTimeoutMs), Ergebnis nach messung\
                              -LabTag mit Praefix dev oder probe: kommt nicht ins Repo; ohne
                              -LabTimeoutMs gilt die juengste Kalibrierung von heute
    labor.ps1 -Mode status    VMs, Reserve, Docker, Repo-Stand
    labor.ps1 -Mode stop      beide VMs herunterfahren (RAM und CPU wieder frei, Disks bleiben)
    labor.ps1 -Mode start     beide VMs starten, auf die Dienste warten, pruefen
    labor.ps1 -Mode destroy   VMs, Disks, NAT und Switch entfernen (fragt nach)

  Aufruf in einer Admin-PowerShell:
    powershell -ExecutionPolicy Bypass -File .\labor.ps1 -Mode up

  Ohne Rueckfragen: -Ja. Eigene Groessen: -LlmCpus, -LlmRamGB, -LlmDiskGB, -AppCpus, -AppRamGB, -AppDiskGB (0 = Empfehlung).
  RAM-Reserve fuer Windows: -RamReserveGB (Standard 4, mindestens 2; kleiner nur auf Testrechnern).
  Hyper-V kann vCPUs nicht an Host-Threads binden; Ersatz: statischer Speicher, Reserve 100 %
  und doppeltes Gewicht fuer den llm-host (vm-windows.ps1). Das GGUF laedt die VM selbst.
  Bericht: $env:USERPROFILE\labor-1b\aufbau-<Zeit>.txt, ohne Tokens. Jeder Aufruf schreibt ein Log
  nach $env:USERPROFILE\labor-1b\log-<Modus>-<Zeit>.txt; bei Fehlern nennt das Skript den Pfad.

  Reines ASCII wegen Windows PowerShell 5.1 (siehe vm-windows.ps1).
#>
[CmdletBinding()]
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidUsingWriteHost', '',
  Justification = 'Interaktives Laborskript: Meldungen gehen bewusst nur an die Konsole.')]
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSReviewUnusedParameter', '',
  Justification = 'Fehlalarm: die Skriptparameter werden in den Funktionen unten gelesen.')]
param(
  [ValidateSet('up', 'vorpruefung', 'groessen', 'pruefen', 'kalibrierung', 'lauf', 'status', 'stop', 'start', 'destroy')]
  [string]$Mode = 'groessen',
  [switch]$Ja,
  [ValidateRange(1, 10)][int]$LabN = 10,
  [ValidatePattern('^[a-z0-9-]*$')][string]$LabTag = '',
  [ValidateSet(0, 90000, 300000)][int]$LabTimeoutMs = 0,
  [ValidateRange(0, 64)][int]$LlmCpus = 0,
  [ValidateRange(0, 512)][int]$LlmRamGB = 0,
  [ValidateRange(0, 64)][int]$AppCpus = 0,
  [ValidateRange(0, 512)][int]$AppRamGB = 0,
  [ValidateRange(0, 2048)][int]$LlmDiskGB = 0,
  [ValidateRange(0, 2048)][int]$AppDiskGB = 0,
  [ValidateRange(2, 64)][int]$RamReserveGB = 4,
  [string]$SshKey = (Join-Path $env:USERPROFILE '.ssh\arsnova-1b_ed25519.pub'),
  [string]$VmDir = 'C:\ProgramData\arsnova-1b',
  [switch]$EnableHyperV,
  [switch]$NurVorbereiten,
  [switch]$NoSecureBoot,
  [string]$OutDir = (Join-Path $env:USERPROFILE 'labor-1b')
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'groessen.ps1')
$VmScript = Join-Path $PSScriptRoot 'vm\vm-windows.ps1'
$AppIp = '192.168.150.10'
$LlmIp = '192.168.150.20'
$Ev = 'docs/referat-thema-1/evidenz/1B'

function Get-LaborText([string]$Code) {
  switch ($Code) {
    'llm-unter-4' { 'llm-host unter 4 vCPU: Inferenz deutlich langsamer, Zahlen nicht mit dem Messrechner vergleichbar.' }
    'app-ram-4' { 'app-host nur 4 GB: der App-Build in der VM wird knapp und langsam.' }
    'llm-ram-10' { 'llm-host nur 10 GB: Container-Limit 8 GB bleibt, wenig Puffer fuer das System der VM.' }
    'host-ram-2' { 'Dem Rechner bleiben etwa 2 GB: andere Programme waehrend des Laufs schliessen.' }
    'ram-zu-klein' { 'Zu wenig RAM: mindestens 16 GB noetig (llm 10 + app 4 + Rechner 2).' }
    'kerne-zu-wenig' { 'Zu wenige Kerne: der llm-host braucht mindestens 2 physische Kerne (ohne SMT 4).' }
    'llm-vcpu' { 'llm-host: 2 bis hoechstens min(8, physische Kerne) vCPU.' }
    'app-vcpu' { 'app-host: mindestens 1 vCPU.' }
    'vcpu-summe' { 'Zusammen mehr vCPU als Threads des Rechners.' }
    'llm-ram' { 'llm-host: mindestens 10 GB (Container-Limit 8 GB plus System).' }
    'app-ram' { 'app-host: mindestens 4 GB.' }
    'ram-summe' { 'Zusammen zu viel RAM: dem Rechner muessen 2 GB bleiben.' }
    'llm-disk' { 'llm-host: Platte mindestens 20 GB (Modell, Runtime-Image, System).' }
    'app-disk' { 'app-host: Platte mindestens 25 GB (der App-Build braucht kurz ~18 GB).' }
    default { $Code }
  }
}

function Read-Zahl([string]$Frage, [int]$Standard) {
  $a = Read-Host "$Frage [$Standard]"
  if ([string]::IsNullOrWhiteSpace($a)) { return $Standard }
  $n = 0
  if ([int]::TryParse($a, [ref]$n)) { return $n }
  return -1
}

function Test-Ja([string]$Frage, [bool]$Standard) {
  if ($Ja) { return $true }
  $a = Read-Host $Frage
  if ([string]::IsNullOrWhiteSpace($a)) { return $Standard }
  return $a -match '^(j|y)'
}

# Gibt @{ LlmCpus; LlmRamGB; LlmDiskGB; AppCpus; AppRamGB; AppDiskGB } zurueck oder wirft bei ungueltigen Werten.
function Select-LaborGroesse {
  $r = Get-LaborRechner
  Write-Host "Rechner: $($r.Kerne) Kerne, $($r.Threads) Threads, $($r.RamGib) GB RAM"
  $e = Get-LaborGroesse -Kerne $r.Kerne -Threads $r.Threads -RamGib $r.RamGib
  $w = @{ LlmCpus = 0; LlmRamGB = 0; AppCpus = 0; AppRamGB = 0; LlmDiskGB = $script:GroessenLlmDisk; AppDiskGB = $script:GroessenAppDisk }
  if ($e.abbruch) {
    Write-Host "Keine Empfehlung: $(Get-LaborText $e.abbruch)"
    if ($LlmCpus -eq 0) { throw 'Rechner zu klein fuer das Labor.' }
  }
  else {
    $w = @{ LlmCpus = $e.llm.vcpu; LlmRamGB = $e.llm.ramGib; AppCpus = $e.app.vcpu; AppRamGB = $e.app.ramGib
      LlmDiskGB = $e.llm.diskGib; AppDiskGB = $e.app.diskGib }
    Write-Host "Empfehlung:  llm-host $($w.LlmCpus) vCPU, $($w.LlmRamGB) GB RAM, Platte bis $($w.LlmDiskGB) GB (Reserve 100 %, Gewicht 200)"
    Write-Host "             app-host $($w.AppCpus) vCPU, $($w.AppRamGB) GB RAM, Platte bis $($w.AppDiskGB) GB"
    foreach ($c in @($e.warnungen)) { Write-Host "  Hinweis: $(Get-LaborText $c)" }
  }
  if ($LlmCpus -gt 0) { $w.LlmCpus = $LlmCpus }
  if ($LlmRamGB -gt 0) { $w.LlmRamGB = $LlmRamGB }
  if ($AppCpus -gt 0) { $w.AppCpus = $AppCpus }
  if ($AppRamGB -gt 0) { $w.AppRamGB = $AppRamGB }
  if ($LlmDiskGB -gt 0) { $w.LlmDiskGB = $LlmDiskGB }
  if ($AppDiskGB -gt 0) { $w.AppDiskGB = $AppDiskGB }
  if (-not (Test-Ja 'Uebernehmen? [J/n]' $true)) {
    while ($true) {
      $w.LlmCpus = Read-Zahl 'llm-host vCPU' $w.LlmCpus
      $w.LlmRamGB = Read-Zahl 'llm-host RAM GB' $w.LlmRamGB
      $w.AppCpus = Read-Zahl 'app-host vCPU' $w.AppCpus
      $w.AppRamGB = Read-Zahl 'app-host RAM GB' $w.AppRamGB
      $w.LlmDiskGB = Read-Zahl 'llm-host Platte GB' $w.LlmDiskGB
      $w.AppDiskGB = Read-Zahl 'app-host Platte GB' $w.AppDiskGB
      $f = Test-LaborGroesse -Kerne $r.Kerne -Threads $r.Threads -RamGib $r.RamGib `
        -LlmVcpu $w.LlmCpus -LlmRamGib $w.LlmRamGB -AppVcpu $w.AppCpus -AppRamGib $w.AppRamGB `
        -LlmDiskGib $w.LlmDiskGB -AppDiskGib $w.AppDiskGB
      if (-not $f) { break }
      Write-Host "  Ungueltig: $(Get-LaborText $f)"
    }
  }
  $f = Test-LaborGroesse -Kerne $r.Kerne -Threads $r.Threads -RamGib $r.RamGib `
    -LlmVcpu $w.LlmCpus -LlmRamGib $w.LlmRamGB -AppVcpu $w.AppCpus -AppRamGib $w.AppRamGB `
    -LlmDiskGib $w.LlmDiskGB -AppDiskGib $w.AppDiskGB
  if ($f) { throw "Ungueltige Groessen: $(Get-LaborText $f)" }
  Write-Host ("Gewaehlt: llm-host $($w.LlmCpus) vCPU, $($w.LlmRamGB) GB, Platte $($w.LlmDiskGB) GB; " +
    "app-host $($w.AppCpus) vCPU, $($w.AppRamGB) GB, Platte $($w.AppDiskGB) GB")
  return $w
}

function Get-SshArg {
  $kh = (Join-Path $VmDir 'known_hosts') -replace '\\', '/'
  $o = @('-o', 'StrictHostKeyChecking=accept-new', '-o', "UserKnownHostsFile=$kh", '-o', 'ConnectTimeout=5',
    '-o', 'BatchMode=yes', '-o', 'LogLevel=ERROR')
  $priv = $SshKey -replace '\.pub$', ''
  if ($priv -ne $SshKey -and (Test-Path $priv)) { $o += @('-i', $priv) }
  return $o
}

function Invoke-Vm([string]$Ip, [string]$Command) {
  $o = Get-SshArg
  & ssh.exe @o "labor@$Ip" $Command | Out-Host
  return $LASTEXITCODE
}

function Invoke-VmScript([hashtable]$Groesse, [string]$VmMode) {
  $a = @{ Mode = $VmMode; SshKey = $SshKey; VmDir = $VmDir }
  if ($EnableHyperV) { $a.EnableHyperV = $true }
  if ($NurVorbereiten -and $VmMode -eq 'up') { $a.NurVorbereiten = $true }
  $a.RamReserveGB = $RamReserveGB
  if ($NoSecureBoot) { $a.NoSecureBoot = $true }
  if ($Groesse) {
    $a.LlmCpus = $Groesse.LlmCpus; $a.LlmRamGB = $Groesse.LlmRamGB
    $a.AppCpus = $Groesse.AppCpus; $a.AppRamGB = $Groesse.AppRamGB
    $a.LlmDiskGB = $Groesse.LlmDiskGB; $a.AppDiskGB = $Groesse.AppDiskGB
  }
  # vm-windows.ps1 meldet Fehler nur per Exit-Code 1 (kein throw), daher hier pruefen.
  $global:LASTEXITCODE = 0
  & $VmScript @a
  if ($LASTEXITCODE -eq 3010) { throw [System.OperationCanceledException]::new('Neustart') }
  if ($LASTEXITCODE -ne 0) { throw "vm-windows.ps1 -Mode $VmMode fehlgeschlagen ($LASTEXITCODE)" }
}

# $true, wenn der Rechner den llm-host auf 8080 erreicht (soll nicht so sein).
function Test-LlmOffen {
  & curl.exe -s -o NUL --max-time 5 "http://${LlmIp}:8080/health"
  return $LASTEXITCODE -eq 0
}

# Negativtests vom Windows-Rechner; gibt die Zahl der Fehler zurueck.
function Test-LaborNetz {
  $fehler = 0
  $sw = Get-VMSwitch -Name 'arsnova-1b' -ErrorAction SilentlyContinue
  if ($sw -and "$($sw.SwitchType)" -eq 'Internal') { Write-Host 'OK      Switch arsnova-1b ist intern (keine physische Netzkarte)' }
  else { Write-Host "FEHLER  Switch arsnova-1b: $(if ($sw) { $sw.SwitchType } else { 'fehlt' })"; $fehler++ }
  $map = @(Get-NetNatStaticMapping -NatName 'arsnova-1b' -ErrorAction SilentlyContinue)
  if ($map.Count -eq 0) { Write-Host 'OK      NAT ohne Portweiterleitung' }
  else { Write-Host "FEHLER  NAT hat $($map.Count) Portweiterleitung(en)"; $fehler++ }
  if (-not (Test-LlmOffen)) { Write-Host 'OK      Rechner -> llm-host:8080 gesperrt: keine Antwort' }
  else { Write-Host 'FEHLER  Rechner -> llm-host:8080 erreichbar'; $fehler++ }
  return $fehler
}

function Invoke-Pruefen {
  New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
  $bericht = Join-Path $OutDir ("aufbau-{0:yyyyMMddTHHmmss}.txt" -f (Get-Date))
  Start-Transcript -Path $bericht | Out-Null
  try {
    Write-Host "# 1B-Aufbaubericht (ohne Secrets) $(Get-Date -Format o)"
    $r = Get-LaborRechner
    Write-Host "Rechner: $((Get-CimInstance Win32_Processor | Select-Object -First 1).Name); $($r.Kerne) Kerne, $($r.Threads) Threads, $($r.RamGib) GB"
    Invoke-VmScript $null 'status'
    $f = 0
    if ((Invoke-Vm $LlmIp "bash arsnova.eu/$Ev/pruefen.sh llm") -ne 0) { $f++ }
    if ((Invoke-Vm $AppIp "bash arsnova.eu/$Ev/pruefen.sh app") -ne 0) { $f++ }
    Write-Host '== Negativtests vom Rechner'
    $f += Test-LaborNetz
    Write-Host "== Ergebnis: $(if ($f -eq 0) { 'alle Pruefungen OK' } else { 'FEHLER, siehe oben' })"
  }
  finally { Stop-Transcript | Out-Null }
  Write-Host "Bericht: $bericht"
  if ($f -ne 0) { throw 'Pruefungen fehlgeschlagen' }
}

function Invoke-LaborUp {
  $g = Select-LaborGroesse
  Invoke-VmScript $g 'up'
  if ($NurVorbereiten) { return }
  $t0 = Get-Date
  Write-Host ''
  Write-Host '[Einrichtung 1/3] llm-host: Runtime-Image bauen, Modell (2,4 GB) laden und pruefen, starten (dauert 5-20 min)' -ForegroundColor Cyan
  if ((Invoke-Vm $LlmIp "bash arsnova.eu/$Ev/llm-start.sh") -ne 0) {
    throw "llm-start.sh im llm-host fehlgeschlagen (Ausgabe oben). Erneut: labor.ps1 -Mode up (setzt fort)."
  }
  Write-Host ''
  Write-Host "[Einrichtung 2/3] app-host: App-Image bauen, Datenbank, Start (dauert 15-30 min) - seit Beginn der Einrichtung $([int]((Get-Date) - $t0).TotalMinutes) min" -ForegroundColor Cyan
  $o = Get-SshArg
  & ssh.exe @o "labor@$LlmIp" "sed -n 's/^OPEN_WEIGHT_LLM_TOKEN=//p' arsnova.eu/.env.llm" |
    & ssh.exe @o "labor@$AppIp" "bash arsnova.eu/$Ev/app-start.sh" | Out-Host
  if ($LASTEXITCODE -ne 0) { throw 'app-start.sh im app-host fehlgeschlagen (Ausgabe oben). Erneut: labor.ps1 -Mode up (setzt fort).' }
  Write-Host ''
  Write-Host "[Einrichtung 3/3] alles pruefen - Einrichtung dauerte $([int]((Get-Date) - $t0).TotalMinutes) min" -ForegroundColor Cyan
  Invoke-Pruefen
  Write-Host ''
  Write-Host 'Fertig. Zwischen den Sitzungen: labor.ps1 -Mode stop; danach -Mode start.' -ForegroundColor Green
}

# Nach dem Start: auf SSH und die Container warten (restart: always), dann pruefen.
function Invoke-LaborStart {
  Invoke-VmScript $null 'start'
  $o = Get-SshArg
  # PowerShell 5.1: umgeleitetes stderr nativer Programme waere unter 'Stop' ein Abbruch.
  $alt = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    foreach ($ip in $LlmIp, $AppIp) {
      for ($i = 0; $i -lt 60; $i++) {
        & ssh.exe @o "labor@$ip" 'true' 2>$null
        if ($LASTEXITCODE -eq 0) { break }
        Start-Sleep -Seconds 5
      }
    }
  }
  finally { $ErrorActionPreference = $alt }
  Write-Host 'VMs laufen; warte 90 s auf die Container.'
  Start-Sleep -Seconds 90
  for ($v = 1; $v -le 3; $v++) {
    try { Invoke-Pruefen; return }
    catch { if ($v -eq 3) { throw } ; Write-Host 'Noch nicht bereit, neuer Versuch in 60 s.'; Start-Sleep -Seconds 60 }
  }
}

function Invoke-ImAppHost([string]$LaufMode) {
  # PowerShell 5.1 gibt eingebettete " ungeschuetzt an ssh.exe weiter; daher -N '' (im String '''').
  Invoke-VmScript $null 'sync'
  $o = Get-SshArg
  $pub = (& ssh.exe @o "labor@$AppIp" 'test -f ~/.ssh/labor-llm || ssh-keygen -q -t ed25519 -N '''' -C labor-app-zu-llm -f ~/.ssh/labor-llm; cat ~/.ssh/labor-llm.pub' | Select-Object -Last 1)
  if ("$pub" -notmatch '^ssh-ed25519 [A-Za-z0-9+/=]+ labor-app-zu-llm$') { throw 'unerwarteter Schluessel im app-host' }
  & ssh.exe @o "labor@$LlmIp" "grep -qxF '$pub' ~/.ssh/authorized_keys || echo '$pub' >> ~/.ssh/authorized_keys" | Out-Host
  # Windows aendert das Energieprofil nicht; das aktive Schema wird nur festgehalten.
  $profil = ((& powercfg.exe /getactivescheme) -join ' ') -replace '[^A-Za-z0-9 ()._:-]', ''
  $r = Get-LaborRechner
  $rechner = "$((Get-CimInstance Win32_Processor | Select-Object -First 1).Name), $($r.Threads) Threads, $($r.RamGib) GB" -replace "'", ''
  $timeout = $LabTimeoutMs
  if ($LaufMode -eq 'lauf' -and $timeout -eq 0) {
    # Timeout aus der juengsten Kalibrierung von heute mit gleichem Energieschema (ADR 1B-005).
    $kal = Get-ChildItem -Path $OutDir -Filter ('kalibrierung-{0:yyyyMMdd}T*.json' -f (Get-Date)) -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $kal) { throw "Keine Kalibrierung von heute in ${OutDir}: zuerst -Mode kalibrierung (oder -LabTimeoutMs setzen)." }
    $k = Get-Content -Raw $kal.FullName | ConvertFrom-Json
    if ($k.energieprofil -ne $profil) { throw "Kalibrierung lief mit '$($k.energieprofil)', dieser Lauf mit '$profil': neu kalibrieren." }
    $timeout = [int]$k.timeoutMs
    Write-Host "Timeout $timeout ms aus $($kal.Name)"
  }
  $envText = "LAB_N=$LabN LAB_TAG='$LabTag' LAB_TIMEOUT_MS=$timeout LAB_PROFIL_IST='$profil' LAB_RECHNER='$rechner'"
  $ausgabe = @(& ssh.exe @o "labor@$AppIp" "$envText bash arsnova.eu/$Ev/lauf.sh $LaufMode")
  $ausgabe | Out-Host
  if ($LASTEXITCODE -ne 0) { throw "lauf.sh $LaufMode fehlgeschlagen ($LASTEXITCODE)" }
  if ($LaufMode -eq 'kalibrierung') {
    New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
    Push-Location $OutDir
    try { & scp.exe -q @o "labor@${AppIp}:$("$($ausgabe[-1])".Trim())" '.' }
    finally { Pop-Location }
  }
  if ($LaufMode -eq 'lauf') {
    $dir = "$($ausgabe[-1])".Trim()
    New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
    Push-Location $OutDir
    try { & scp.exe -q -r @o "labor@${AppIp}:$dir" '.'; if ($LASTEXITCODE -ne 0) { throw 'scp der Ergebnisse fehlgeschlagen' } }
    finally { Pop-Location }
    $lokal = Join-Path $OutDir (Split-Path $dir -Leaf)
    Write-Host "Rohdaten (nie einchecken, Mitschnitte enthalten den Token): $lokal"
    if (-not ($LabTag.StartsWith('dev') -or $LabTag.StartsWith('probe'))) {
      $basis = '{0:yyyy-MM-dd}-lauf{1}' -f (Get-Date), $(if ($LabTag) { "-$LabTag" } else { '' })
      $ziel = Join-Path (Join-Path $PSScriptRoot 'messung') "$basis.json"
      $i = 2
      while (Test-Path $ziel) { $ziel = Join-Path (Join-Path $PSScriptRoot 'messung') "$basis-$i.json"; $i++ }
      Copy-Item (Join-Path $lokal 'ergebnis.json') $ziel
      Write-Host "Ergebnis: $ziel"
    }
  }
}

# Hauptteil nur bei direktem Aufruf, nicht beim Dot-Sourcing (Tests).
if ($MyInvocation.InvocationName -ne '.') {
  New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
  $log = Join-Path $OutDir ("log-$Mode-{0:yyyyMMddTHHmmss}.txt" -f (Get-Date))
  $mitLog = $Mode -notin @('pruefen')   # pruefen schreibt seinen eigenen Bericht
  if ($mitLog) { Start-Transcript -Path $log | Out-Null }
  $code = 0
  try {
  switch ($Mode) {
    'vorpruefung' { Invoke-VmScript $null 'pruefen' }
    'up' { Invoke-LaborUp }
    'groessen' { Select-LaborGroesse | Out-Null }
    'pruefen' { Invoke-Pruefen }
    'kalibrierung' { Invoke-ImAppHost 'kalibrierung' }
    'lauf' { Invoke-ImAppHost 'lauf' }
    'status' { Invoke-VmScript $null 'status' }
    'stop' { Invoke-VmScript $null 'stop' }
    'start' { Invoke-LaborStart }
    'destroy' {
      if (Test-Ja 'Beide Labor-VMs mit Disks, NAT und Switch loeschen? [j/N]' $false) { Invoke-VmScript $null 'destroy' }
    }
  }
  }
  catch [System.OperationCanceledException] {
    Write-Host 'Nach dem Neustart denselben Befehl erneut aufrufen.' -ForegroundColor Green
  }
  catch {
    $code = 1
    Write-Host ''
    Write-Host "FEHLER: $($_.Exception.Message)" -ForegroundColor Red
  }
  finally {
    if ($mitLog) {
      Stop-Transcript | Out-Null
      if ($code -ne 0) { Write-Host "Log mit den Meldungen des Skripts: $log (bei Fragen mitschicken; enthaelt keine Tokens). Meldungen von curl/tar stehen nur im Fenster." }
    }
  }
  exit $code
}
