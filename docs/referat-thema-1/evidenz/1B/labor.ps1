<#
.SYNOPSIS
  1B-Labor unter Windows mit einem Befehl, Gegenstueck zu labor.sh (ADR 1B-010).

.DESCRIPTION
  Status: ungetestet, Niklas prueft (Test in verschachtelter VM folgt, Plan Task 12 Step 6).

    labor.ps1 -Mode up        Groessenwahl, VMs (vm-windows.ps1), llm-host, app-host, Pruefungen
    labor.ps1 -Mode groessen  nur Empfehlung und Groessenwahl anzeigen, nichts anlegen
    labor.ps1 -Mode pruefen   nur die Pruefungen (Runbook 10, 11, Negativtests), Bericht schreiben
    labor.ps1 -Mode status    VMs, Reserve, Docker, Repo-Stand
    labor.ps1 -Mode destroy   VMs, Disks, NAT und Switch entfernen (fragt nach)

  Aufruf in einer Admin-PowerShell:
    powershell -ExecutionPolicy Bypass -File .\labor.ps1 -Mode up

  Ohne Rueckfragen: -Ja. Eigene Groessen: -LlmCpus, -LlmRamGB, -AppCpus, -AppRamGB (0 = Empfehlung).
  Hyper-V kann vCPUs nicht an Host-Threads binden; Ersatz: statischer Speicher, Reserve 100 %
  und doppeltes Gewicht fuer den llm-host (vm-windows.ps1). Das GGUF laedt die VM selbst.
  Bericht: $env:USERPROFILE\labor-1b\aufbau-<Zeit>.txt, ohne Tokens.

  Reines ASCII wegen Windows PowerShell 5.1 (siehe vm-windows.ps1).
#>
[CmdletBinding()]
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidUsingWriteHost', '',
  Justification = 'Interaktives Laborskript: Meldungen gehen bewusst nur an die Konsole.')]
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSReviewUnusedParameter', '',
  Justification = 'Fehlalarm: die Skriptparameter werden in den Funktionen unten gelesen.')]
param(
  [ValidateSet('up', 'groessen', 'pruefen', 'status', 'destroy')]
  [string]$Mode = 'groessen',
  [switch]$Ja,
  [ValidateRange(0, 64)][int]$LlmCpus = 0,
  [ValidateRange(0, 512)][int]$LlmRamGB = 0,
  [ValidateRange(0, 64)][int]$AppCpus = 0,
  [ValidateRange(0, 512)][int]$AppRamGB = 0,
  [string]$SshKey = (Join-Path $env:USERPROFILE '.ssh\id_ed25519.pub'),
  [string]$VmDir = 'C:\ProgramData\arsnova-1b',
  [string]$WslDistro = '',
  [switch]$EnableHyperV,
  [switch]$InstallWslTools,
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

# Gibt @{ LlmCpus; LlmRamGB; AppCpus; AppRamGB } zurueck oder wirft bei ungueltigen Werten.
function Select-LaborGroesse {
  $r = Get-LaborRechner
  Write-Host "Rechner: $($r.Kerne) Kerne, $($r.Threads) Threads, $($r.RamGib) GB RAM"
  $e = Get-LaborGroesse -Kerne $r.Kerne -Threads $r.Threads -RamGib $r.RamGib
  $w = @{ LlmCpus = 0; LlmRamGB = 0; AppCpus = 0; AppRamGB = 0 }
  if ($e.abbruch) {
    Write-Host "Keine Empfehlung: $(Get-LaborText $e.abbruch)"
    if ($LlmCpus -eq 0) { throw 'Rechner zu klein fuer das Labor.' }
  }
  else {
    $w = @{ LlmCpus = $e.llm.vcpu; LlmRamGB = $e.llm.ramGib; AppCpus = $e.app.vcpu; AppRamGB = $e.app.ramGib }
    Write-Host "Empfehlung:  llm-host $($w.LlmCpus) vCPU, $($w.LlmRamGB) GB (Reserve 100 %, Gewicht 200)"
    Write-Host "             app-host $($w.AppCpus) vCPU, $($w.AppRamGB) GB"
    foreach ($c in @($e.warnungen)) { Write-Host "  Hinweis: $(Get-LaborText $c)" }
  }
  if ($LlmCpus -gt 0) { $w.LlmCpus = $LlmCpus }
  if ($LlmRamGB -gt 0) { $w.LlmRamGB = $LlmRamGB }
  if ($AppCpus -gt 0) { $w.AppCpus = $AppCpus }
  if ($AppRamGB -gt 0) { $w.AppRamGB = $AppRamGB }
  if (-not (Test-Ja 'Uebernehmen? [J/n]' $true)) {
    while ($true) {
      $w.LlmCpus = Read-Zahl 'llm-host vCPU' $w.LlmCpus
      $w.LlmRamGB = Read-Zahl 'llm-host RAM GB' $w.LlmRamGB
      $w.AppCpus = Read-Zahl 'app-host vCPU' $w.AppCpus
      $w.AppRamGB = Read-Zahl 'app-host RAM GB' $w.AppRamGB
      $f = Test-LaborGroesse -Kerne $r.Kerne -Threads $r.Threads -RamGib $r.RamGib `
        -LlmVcpu $w.LlmCpus -LlmRamGib $w.LlmRamGB -AppVcpu $w.AppCpus -AppRamGib $w.AppRamGB
      if (-not $f) { break }
      Write-Host "  Ungueltig: $(Get-LaborText $f)"
    }
  }
  $f = Test-LaborGroesse -Kerne $r.Kerne -Threads $r.Threads -RamGib $r.RamGib `
    -LlmVcpu $w.LlmCpus -LlmRamGib $w.LlmRamGB -AppVcpu $w.AppCpus -AppRamGib $w.AppRamGB
  if ($f) { throw "Ungueltige Groessen: $(Get-LaborText $f)" }
  Write-Host "Gewaehlt: llm-host $($w.LlmCpus) vCPU, $($w.LlmRamGB) GB; app-host $($w.AppCpus) vCPU, $($w.AppRamGB) GB"
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
  if ($WslDistro) { $a.WslDistro = $WslDistro }
  if ($EnableHyperV) { $a.EnableHyperV = $true }
  if ($InstallWslTools) { $a.InstallWslTools = $true }
  if ($NoSecureBoot) { $a.NoSecureBoot = $true }
  if ($Groesse) {
    $a.LlmCpus = $Groesse.LlmCpus; $a.LlmRamGB = $Groesse.LlmRamGB
    $a.AppCpus = $Groesse.AppCpus; $a.AppRamGB = $Groesse.AppRamGB
  }
  & $VmScript @a
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
  Write-Host '== llm-host einrichten'
  if ((Invoke-Vm $LlmIp "bash arsnova.eu/$Ev/llm-start.sh") -ne 0) { throw 'llm-start.sh fehlgeschlagen' }
  Write-Host '== app-host einrichten (Token nur per Pipe von VM zu VM)'
  $o = Get-SshArg
  & ssh.exe @o "labor@$LlmIp" "sed -n 's/^OPEN_WEIGHT_LLM_TOKEN=//p' arsnova.eu/.env.llm" |
    & ssh.exe @o "labor@$AppIp" "bash arsnova.eu/$Ev/app-start.sh" | Out-Host
  if ($LASTEXITCODE -ne 0) { throw 'app-start.sh fehlgeschlagen' }
  Invoke-Pruefen
}

# Hauptteil nur bei direktem Aufruf, nicht beim Dot-Sourcing (Tests).
if ($MyInvocation.InvocationName -ne '.') {
  switch ($Mode) {
    'up' { Invoke-LaborUp }
    'groessen' { Select-LaborGroesse | Out-Null }
    'pruefen' { Invoke-Pruefen }
    'status' { Invoke-VmScript $null 'status' }
    'destroy' {
      if (Test-Ja 'Beide Labor-VMs mit Disks, NAT und Switch loeschen? [j/N]' $false) { Invoke-VmScript $null 'destroy' }
    }
  }
}
