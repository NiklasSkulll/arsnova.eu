# Pester 5: Groessenwahl und Negativtests von labor.ps1 ohne Hyper-V (Cmdlets gemockt).
# Aufruf: Invoke-Pester docs/referat-thema-1/evidenz/1B/labor.Tests.ps1
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSReviewUnusedParameter', '',
  Justification = 'Platzhalter-Cmdlets fuer Mock; Parameter nur fuer die Signatur.')]
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseDeclaredVarsMoreThanAssignments', '',
  Justification = 'Ja und LlmCpus liest labor.ps1 per dynamischem Scope.')]
param()
BeforeAll {
  if (-not $env:USERPROFILE) { $env:USERPROFILE = [IO.Path]::GetTempPath() }
  # Platzhalter fuer Windows-Cmdlets, die es im Linux-Container nicht gibt; Mock ersetzt sie.
  function Get-VMSwitch { param($Name, $ErrorAction) }
  function Get-NetNatStaticMapping { param($NatName, $ErrorAction) }
  . (Join-Path $PSScriptRoot 'labor.ps1')
  Mock Write-Host {}
  Mock Get-LaborRechner { [pscustomobject]@{ Kerne = 4; Threads = 8; RamGib = 31 } }
}

Describe 'Select-LaborGroesse' {
  It 'uebernimmt die Empfehlung am Messrechner' {
    Mock Read-Host { '' }
    $g = Select-LaborGroesse
    "$($g.LlmCpus)/$($g.LlmRamGB)/$($g.AppCpus)/$($g.AppRamGB)" | Should -Be '4/12/2/6'
  }

  It 'fragt nach ungueltigen eigenen Werten erneut' {
    $script:antworten = [Collections.Queue]@('n', '3', '9', '2', '6', '3', '10', '2', '4')
    Mock Read-Host { $script:antworten.Dequeue() }
    $g = Select-LaborGroesse
    "$($g.LlmCpus)/$($g.LlmRamGB)/$($g.AppCpus)/$($g.AppRamGB)" | Should -Be '3/10/2/4'
    $script:antworten.Count | Should -Be 0
    Should -Invoke Write-Host -ParameterFilter { "$Object" -like '*Ungueltig*mindestens 10 GB*' } -Times 1
  }

  It 'lehnt ungueltige Parameter ohne Rueckfrage ab' {
    $Ja = $true
    $LlmCpus = 6
    { Select-LaborGroesse } | Should -Throw '*Ungueltige Groessen*'
  }

  It 'bricht auf einem zu kleinen Rechner ab' {
    Mock Get-LaborRechner { [pscustomobject]@{ Kerne = 2; Threads = 4; RamGib = 8 } }
    { Select-LaborGroesse } | Should -Throw '*zu klein*'
  }
}

Describe 'Test-LaborNetz' {
  It 'meldet keinen Fehler bei internem Switch, ohne Weiterleitung, llm-host gesperrt' {
    Mock Get-VMSwitch { [pscustomobject]@{ Name = 'arsnova-1b'; SwitchType = 'Internal' } }
    Mock Get-NetNatStaticMapping { }
    Mock Test-LlmOffen { $false }
    Test-LaborNetz | Should -Be 0
  }

  It 'zaehlt externen Switch, Portweiterleitung und offenen Port' {
    Mock Get-VMSwitch { [pscustomobject]@{ Name = 'arsnova-1b'; SwitchType = 'External' } }
    Mock Get-NetNatStaticMapping { [pscustomobject]@{ ExternalPort = 8080 } }
    Mock Test-LlmOffen { $true }
    Test-LaborNetz | Should -Be 3
  }
}
