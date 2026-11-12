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
