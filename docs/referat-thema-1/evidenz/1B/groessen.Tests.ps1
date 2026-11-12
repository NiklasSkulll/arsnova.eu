# Pester 5: prueft die PowerShell-Umsetzung der Groessenregel (groessen.ps1) gegen
# groessen-faelle.json. Hyper-V kennt kein Pinning, daher ohne cpuset.
# Aufruf: Invoke-Pester docs/referat-thema-1/evidenz/1B/groessen.Tests.ps1
BeforeDiscovery {
  $script:faelle = (Get-Content -Raw (Join-Path $PSScriptRoot 'groessen-faelle.json') | ConvertFrom-Json).faelle
}

BeforeAll {
  . (Join-Path $PSScriptRoot 'groessen.ps1')
}

Describe 'Get-LaborGroesse' {
  It 'PowerShell: <_.name>' -ForEach $faelle {
    $eingabe = $_.eingabe
    $erwartet = $_.erwartet
    $ist = Get-LaborGroesse -Kerne $eingabe.kerne -Threads $eingabe.threads -RamGib $eingabe.ramGib
    if ($erwartet.abbruch) {
      $ist.abbruch | Should -Be $erwartet.abbruch
    }
    else {
      $ist.abbruch | Should -BeNullOrEmpty
      $ist.llm.vcpu | Should -Be $erwartet.llm.vcpu
      $ist.llm.ramGib | Should -Be $erwartet.llm.ramGib
      $ist.app.vcpu | Should -Be $erwartet.app.vcpu
      $ist.app.ramGib | Should -Be $erwartet.app.ramGib
      @($ist.warnungen) -join ',' | Should -Be (@($erwartet.warnungen) -join ',')
    }
  }
}
