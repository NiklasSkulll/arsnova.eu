# 1B-Labor, Windows-Weg: Hilfsfunktionen ohne WSL (zum Dot-Sourcen aus vm-windows.ps1).
# Reines ASCII wegen Windows PowerShell 5.1. Tests: windows-lib.Tests.ps1 (laufen auch unter Linux-pwsh).
#
# Quellen:
# - VHD-Format (Fusszeile, CHS-Geometrie, Pruefsumme): Microsoft "Virtual Hard Disk Image Format
#   Specification" (VHD), Abschnitte "Hard Disk Footer Format" und "CHS Calculation".
# - Ubuntu-Rohimage im tar.gz (noble-server-cloudimg-amd64.img, raw, Vielfaches von 1 MiB):
#   https://cloud-images.ubuntu.com/releases/noble/release/ (geprueft 2026-11-13)
# - cloud-init NoCloud akzeptiert iso9660 oder vfat mit Label cidata/CIDATA:
#   https://docs.cloud-init.io/en/latest/reference/datasources/nocloud.html
# - ISO ohne Zusatzwerkzeuge: IMAPI2 (IMAPI2FS.MsftFileSystemImage), wie im Projekt
#   github.com/schtritoff/hyperv-vm-provisioning (New-ISOFile.ps1); Joliet noetig fuer user-data.


function Get-VhdGeometry {
  # CHS nach der VHD-Spezifikation (ganzzahlig, abgerundet).
  param([Parameter(Mandatory)][uint64]$Bytes)
  [uint64]$ts = [Math]::Floor($Bytes / 512)
  [uint64]$max = 65535 * 16 * 255
  if ($ts -gt $max) { $ts = $max }
  if ($ts -ge 65535 * 16 * 63) {
    $spt = 255; $heads = 16
    [uint64]$cth = [Math]::Floor($ts / $spt)
  }
  else {
    $spt = 17
    [uint64]$cth = [Math]::Floor($ts / $spt)
    $heads = [uint64][Math]::Floor(($cth + 1023) / 1024)
    if ($heads -lt 4) { $heads = 4 }
    if ($cth -ge ($heads * 1024) -or $heads -gt 16) {
      $spt = 31; $heads = 16
      $cth = [Math]::Floor($ts / $spt)
    }
    if ($cth -ge ($heads * 1024)) {
      $spt = 63; $heads = 16
      $cth = [Math]::Floor($ts / $spt)
    }
  }
  [pscustomobject]@{ Zylinder = [uint64][Math]::Floor($cth / $heads); Koepfe = [uint64]$heads; Sektoren = [uint64]$spt }
}

function Write-BeZahl([byte[]]$Buffer, [int]$Offset, [int]$Length, [uint64]$Value) {
  for ($i = $Length - 1; $i -ge 0; $i--) {
    $Buffer[$Offset + $i] = [byte]($Value -band 0xFF)
    $Value = $Value -shr 8
  }
}

function Get-VhdFooter {
  # 512-Byte-Fusszeile einer festen VHD (Disk Type 2) fuer eine Rohdatei der Groesse $Bytes.
  param(
    [Parameter(Mandatory)][uint64]$Bytes,
    [Parameter(Mandatory)][uint32]$Zeitstempel,
    [Parameter(Mandatory)][byte[]]$UniqueId
  )
  if ($Bytes % 512 -ne 0) { throw "Rohgroesse $Bytes ist kein Vielfaches von 512 Bytes." }
  if ($UniqueId.Length -ne 16) { throw 'UniqueId braucht 16 Bytes.' }
  $f = [byte[]]::new(512)
  [Text.Encoding]::ASCII.GetBytes('conectix').CopyTo($f, 0)
  Write-BeZahl $f 8 4 2                       # Features: reserviert, immer gesetzt
  Write-BeZahl $f 12 4 0x00010000             # Formatversion 1.0
  Write-BeZahl $f 16 8 ([uint64]::MaxValue)   # Data Offset: feste Platte
  Write-BeZahl $f 24 4 $Zeitstempel           # Sekunden seit 2000-01-01 UTC
  [Text.Encoding]::ASCII.GetBytes('win ').CopyTo($f, 28)
  Write-BeZahl $f 32 4 0x000A0000             # Creator Version
  [Text.Encoding]::ASCII.GetBytes('Wi2k').CopyTo($f, 36)
  Write-BeZahl $f 40 8 $Bytes                 # Original Size
  Write-BeZahl $f 48 8 $Bytes                 # Current Size
  $g = Get-VhdGeometry -Bytes $Bytes
  Write-BeZahl $f 56 2 $g.Zylinder
  $f[58] = [byte]$g.Koepfe
  $f[59] = [byte]$g.Sektoren
  Write-BeZahl $f 60 4 2                      # Disk Type: fest
  $UniqueId.CopyTo($f, 68)
  [uint64]$sum = 0
  foreach ($b in $f) { $sum += $b }     # Pruefsummenfeld ist hier noch 0
  Write-BeZahl $f 64 4 ((-bnot [uint32]($sum -band 0xFFFFFFFF)) -band 0xFFFFFFFF)
  return , $f
}

function Add-VhdFooter {
  # Macht aus einer Rohdatei in place eine feste VHD (Fusszeile anhaengen).
  param([Parameter(Mandatory)][string]$Path)
  $len = (Get-Item -LiteralPath $Path).Length
  if ($len -ge 512) {
    $s = [IO.File]::OpenRead($Path)
    try {
      [void]$s.Seek(-512, 'End')
      $tail = [byte[]]::new(8)
      [void]$s.Read($tail, 0, 8)
    }
    finally { $s.Dispose() }
    if ([Text.Encoding]::ASCII.GetString($tail) -eq 'conectix') { throw "$Path hat schon eine VHD-Fusszeile." }
  }
  $ts = [uint32][Math]::Floor(([DateTime]::UtcNow - [DateTime]::new(2000, 1, 1, 0, 0, 0, [DateTimeKind]::Utc)).TotalSeconds)
  $footer = Get-VhdFooter -Bytes ([uint64]$len) -Zeitstempel $ts -UniqueId ([Guid]::NewGuid().ToByteArray())
  $s = [IO.File]::Open($Path, 'Append', 'Write')
  try { $s.Write($footer, 0, 512) } finally { $s.Dispose() }
}

function Get-RepoStand {
  # Repo-Wurzel und Commit von HEAD aus dem .git-Ordner lesen, ohne git.exe (lose Ref, packed-refs, detached).
  param([Parameter(Mandatory)][string]$Start)
  $d = (Resolve-Path -LiteralPath $Start).Path
  while ($d -and -not (Test-Path -LiteralPath (Join-Path $d '.git'))) {
    $p = Split-Path -Parent $d
    if ($p -eq $d) { $d = $null } else { $d = $p }
  }
  if (-not $d) { throw "Unter $Start liegt kein Git-Repo (Ordner .git nicht gefunden). Das Skript muss im Clone des Repos liegen." }
  $git = Join-Path $d '.git'
  if (-not (Test-Path -LiteralPath $git -PathType Container)) {
    throw "$git ist eine Datei (Git-Worktree). Bitte das Skript aus dem Haupt-Clone starten, nicht aus einem Worktree."
  }
  $head = ([IO.File]::ReadAllText((Join-Path $git 'HEAD'))).Trim()
  if ($head -match '^[0-9a-f]{40}$') { return [pscustomobject]@{ Wurzel = $d; Commit = $head } }
  if ($head -notmatch '^ref: (.+)$') { throw "Unerwarteter Inhalt in .git/HEAD: $head" }
  $ref = $Matches[1]
  $lose = Join-Path $git ($ref -replace '/', [IO.Path]::DirectorySeparatorChar)
  if (Test-Path -LiteralPath $lose) {
    return [pscustomobject]@{ Wurzel = $d; Commit = ([IO.File]::ReadAllText($lose)).Trim() }
  }
  $packed = Join-Path $git 'packed-refs'
  if (Test-Path -LiteralPath $packed) {
    foreach ($z in [IO.File]::ReadAllLines($packed)) {
      if ($z -match "^([0-9a-f]{40}) $([regex]::Escape($ref))$") { return [pscustomobject]@{ Wurzel = $d; Commit = $Matches[1] } }
    }
  }
  throw "Commit fuer $ref nicht gefunden (weder lose Referenz noch packed-refs)."
}

function ConvertTo-IpRange([string]$Prefix) {
  # "a.b.c.d/n" -> Start und Ende als Zahl fuer den Ueberlappungstest.
  $addr, $len = $Prefix.Split('/')
  $b = ([Net.IPAddress]::Parse($addr)).GetAddressBytes()
  [Array]::Reverse($b)
  $ip = [BitConverter]::ToUInt32($b, 0)
  $size = [Math]::Pow(2, 32 - [int]$len)
  $start = [Math]::Floor($ip / $size) * $size
  return @{ Start = [double]$start; End = [double]$start + $size - 1 }
}

function Test-Overlap([string]$A, [string]$B) {
  $x = ConvertTo-IpRange $A
  $y = ConvertTo-IpRange $B
  return ($x.Start -le $y.End -and $y.Start -le $x.End)
}

function Get-VorpruefungUrteil {
  # Bewertet gesammelte Fakten des Rechners. Ergebnis: je Pruefung Status OK, HINWEIS oder FEHLER,
  # bei FEHLER mit konkreter Abhilfe. Reine Funktion, damit sie ohne Windows testbar ist.
  param([Parameter(Mandatory)][hashtable]$Fakten)
  $netz = '192.168.150.0/24'
  $e = [Collections.Generic.List[object]]::new()
  function Add([string]$P, [string]$S, [string]$T, [string]$A = '') {
    $e.Add([pscustomobject]@{ Pruefung = $P; Status = $S; Text = $T; Abhilfe = $A })
  }
  $f = $Fakten

  if ($f.Admin) { Add 'Admin' 'OK' 'Administratorrechte' }
  else { Add 'Admin' 'FEHLER' 'Keine Administratorrechte' 'PowerShell mit Rechtsklick > "Als Administrator ausfuehren" starten.' }

  if ($f.Edition -eq 'Core' -or $f.HyperV -eq 'Missing') {
    Add 'Edition' 'FEHLER' "Windows-Edition '$($f.Edition)' ohne Hyper-V" 'Hyper-V gibt es nur in Windows 10/11 Pro, Education oder Enterprise (nicht Home).'
  }
  else {
    Add 'Edition' 'OK' "Windows-Edition $($f.Edition)"
    if ($f.HyperV -ne 'Enabled') {
      if ($f.VirtualisierungFirmware -eq $false) {
        Add 'Virtualisierung' 'FEHLER' 'Virtualisierung ist im BIOS/UEFI ausgeschaltet' 'Im BIOS/UEFI Intel VT-x bzw. AMD-V (SVM) einschalten, danach neu starten.'
      }
      Add 'Hyper-V' 'FEHLER' 'Hyper-V ist nicht aktiviert' 'Skript mit -EnableHyperV aufrufen (aktiviert Hyper-V), danach Windows neu starten und erneut aufrufen.'
    }
    elseif (-not $f.HypervisorLaeuft) {
      Add 'Virtualisierung' 'FEHLER' 'Hyper-V ist aktiviert, aber der Hypervisor laeuft nicht' ('Nach dem Aktivieren neu starten; sonst im BIOS/UEFI Intel VT-x bzw. AMD-V einschalten ' +
        'und pruefen: bcdedit /enum | findstr hypervisorlaunchtype (muss Auto sein).')
    }
    else {
      Add 'Hyper-V' 'OK' 'Hyper-V aktiv, Hypervisor laeuft'
      if ($f.HyperVModul) { Add 'Hyper-V-Modul' 'OK' 'PowerShell-Modul Hyper-V vorhanden' }
      else { Add 'Hyper-V-Modul' 'FEHLER' 'PowerShell-Modul Hyper-V fehlt' 'Admin-PowerShell: Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-Management-PowerShell, danach neu starten.' }
    }
  }

  if ($f.Ssh) { Add 'OpenSSH' 'OK' 'ssh.exe und scp.exe vorhanden' }
  else { Add 'OpenSSH' 'FEHLER' 'ssh.exe/scp.exe fehlen' 'Admin-PowerShell: Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0' }

  if ($f.Tar) { Add 'tar' 'OK' 'tar.exe vorhanden' }
  else { Add 'tar' 'FEHLER' 'tar.exe fehlt' 'tar.exe ist ab Windows 10 1803 eingebaut; Windows aktualisieren.' }

  if ($f.Adresskonflikt) {
    Add 'Labornetz' 'FEHLER' "Adresse im Labornetz schon vergeben: $($f.Adresskonflikt)" "Das Labor braucht $netz exklusiv. VPN trennen oder das andere Netz umstellen."
  }
  else { Add 'Labornetz' 'OK' "$netz ist frei" }

  foreach ($n in @($f.AndereNat)) {
    if (Test-Overlap $n.Prefix $netz) {
      Add 'NAT' 'FEHLER' "NAT '$($n.Name)' ($($n.Prefix)) ueberschneidet $netz" "Wenn nicht mehr gebraucht: Remove-NetNat -Name '$($n.Name)'; sonst das andere NAT umstellen."
    }
    else {
      Add 'NAT' 'HINWEIS' "Es gibt schon ein NAT '$($n.Name)' ($($n.Prefix))" 'Windows unterstuetzt offiziell nur ein NAT-Netz; schlaegt das Anlegen fehl, das andere NAT entfernen.'
    }
  }

  if ($f.PlatteFreiGib -lt $f.PlatteNoetigGib) {
    Add 'Platte' 'FEHLER' "Nur $($f.PlatteFreiGib) GB frei" "Mindestens $($f.PlatteNoetigGib) GB frei machen (erwarteter Bedarf plus Reserve)."
  }
  else { Add 'Platte' 'OK' "$($f.PlatteFreiGib) GB frei (noetig $($f.PlatteNoetigGib) GB)" }

  foreach ($h in @($f.Internet.Keys | Sort-Object)) {
    if ($f.Internet[$h]) { Add 'Internet' 'OK' "$h erreichbar" }
    else { Add 'Internet' 'FEHLER' "$h nicht erreichbar" "Internetverbindung pruefen; Proxy oder Firewall muss $h (HTTPS) erlauben." }
  }
  return $e.ToArray()
}

function Format-Dauer([TimeSpan]$Dauer) {
  if ($Dauer.TotalHours -ge 1) { return '{0}:{1:00}:{2:00}' -f [int][Math]::Floor($Dauer.TotalHours), $Dauer.Minutes, $Dauer.Seconds }
  return '{0}:{1:00}' -f [int][Math]::Floor($Dauer.TotalMinutes), $Dauer.Seconds
}

function New-SeedIso {
  # NoCloud-Seed als ISO (iso9660 + Joliet, Label cidata) mit IMAPI2, ohne Zusatzwerkzeuge. Nur Windows.
  [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
    Justification = 'Laborskript: schreibt nur eine Datei im Laborordner; -WhatIf ist hier nicht vorgesehen.')]
  param([Parameter(Mandatory)][string]$Ordner, [Parameter(Mandatory)][string]$Ziel)
  if (-not ('LaborIsoSchreiber' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Runtime.InteropServices.ComTypes;
public static class LaborIsoSchreiber {
  public static void Schreibe(string pfad, object strom, int blockGroesse, int bloecke) {
    IStream s = (IStream)strom;
    byte[] puffer = new byte[blockGroesse];
    using (FileStream f = File.Create(pfad)) {
      for (int i = 0; i < bloecke; i++) {
        s.Read(puffer, blockGroesse, IntPtr.Zero);
        f.Write(puffer, 0, blockGroesse);
      }
    }
  }
}
'@
  }
  $fs = New-Object -ComObject IMAPI2FS.MsftFileSystemImage
  $fs.FileSystemsToCreate = 3   # ISO9660 + Joliet (Joliet erhaelt Kleinbuchstaben und Bindestriche)
  $fs.VolumeName = 'cidata'
  $fs.Root.AddTree($Ordner, $false)
  $img = $fs.CreateResultImage()
  if (Test-Path -LiteralPath $Ziel) { Remove-Item -Force -LiteralPath $Ziel }
  [LaborIsoSchreiber]::Schreibe($Ziel, $img.ImageStream, $img.BlockSize, $img.TotalBlocks)
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($fs)
}
