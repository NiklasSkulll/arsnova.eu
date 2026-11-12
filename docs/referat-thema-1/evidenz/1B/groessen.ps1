# Groessenregel fuer die 1B-Labor-VMs (ADR 1B-010), zum Einbinden per Dot-Sourcing.
# Testfaelle: groessen-faelle.json; Tests: groessen.Tests.ps1. Gleiche Regel in groessen.sh.
# Hyper-V kann vCPUs nicht an Host-Threads binden; daher hier ohne cpuset.

function Get-LaborGroesse {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)][int]$Kerne,
    [Parameter(Mandatory)][int]$Threads,
    [Parameter(Mandatory)][int]$RamGib
  )
  $smt = $Threads -gt $Kerne
  if ($RamGib - 4 -ge 18) { $llmRam = 12; $appRam = 6 }
  elseif ($RamGib - 4 -ge 16) { $llmRam = 12; $appRam = 4 }
  elseif ($RamGib - 2 -ge 14) { $llmRam = 10; $appRam = 4 }
  else { return [pscustomobject]@{ abbruch = 'ram-zu-klein' } }

  $llmCpu = if ($smt) { $Kerne } else { $Kerne - 2 }
  if ($llmCpu -gt 8) { $llmCpu = 8 }
  if ($llmCpu -lt 2) { return [pscustomobject]@{ abbruch = 'kerne-zu-wenig' } }

  $warn = @()
  if ($llmCpu -lt 4) { $warn += 'llm-unter-4' }
  if ($appRam -lt 6) { $warn += 'app-ram-4' }
  if ($llmRam -lt 12) { $warn += 'llm-ram-10' }
  if ($RamGib - $llmRam - $appRam -lt 4) { $warn += 'host-ram-2' }

  [pscustomobject]@{
    abbruch   = $null
    llm       = [pscustomobject]@{ vcpu = $llmCpu; ramGib = $llmRam }
    app       = [pscustomobject]@{ vcpu = 2; ramGib = $appRam }
    warnungen = $warn
  }
}

# Kerne, Threads und RAM (GiB, abgerundet) dieses Windows-Rechners.
function Get-LaborRechner {
  [CmdletBinding()]
  param()
  $cpu = @(Get-CimInstance -ClassName Win32_Processor)
  $ram = (Get-CimInstance -ClassName Win32_ComputerSystem).TotalPhysicalMemory
  [pscustomobject]@{
    Kerne   = [int](($cpu | Measure-Object -Property NumberOfCores -Sum).Sum)
    Threads = [int](($cpu | Measure-Object -Property NumberOfLogicalProcessors -Sum).Sum)
    RamGib  = [int][math]::Floor($ram / 1GB)
  }
}

# Prueft eigene Werte; leer = gueltig, sonst der erste Fehlercode (wie groessen_pruefen).
function Test-LaborGroesse {
  [CmdletBinding()]
  [OutputType([string])]
  param(
    [Parameter(Mandatory)][int]$Kerne,
    [Parameter(Mandatory)][int]$Threads,
    [Parameter(Mandatory)][int]$RamGib,
    [Parameter(Mandatory)][int]$LlmVcpu,
    [Parameter(Mandatory)][int]$LlmRamGib,
    [Parameter(Mandatory)][int]$AppVcpu,
    [Parameter(Mandatory)][int]$AppRamGib
  )
  $max = [math]::Min(8, $Kerne)
  if ($LlmVcpu -lt 2 -or $LlmVcpu -gt $max) { return 'llm-vcpu' }
  if ($AppVcpu -lt 1) { return 'app-vcpu' }
  if ($LlmVcpu + $AppVcpu -gt $Threads) { return 'vcpu-summe' }
  if ($LlmRamGib -lt 10) { return 'llm-ram' }
  if ($AppRamGib -lt 4) { return 'app-ram' }
  if ($LlmRamGib + $AppRamGib -gt $RamGib - 2) { return 'ram-summe' }
  return ''
}
