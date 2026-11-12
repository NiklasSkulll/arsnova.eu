# 1B-Labor unter Windows (WSL-Rechner)

**Status: ungetestet, Niklas prüft** · Stand: 2026-11-12

_Ergänzt 2026-11-12:_ Der Weg mit einem Befehl ist jetzt `..\labor.ps1 -Mode up` (Größenwahl, VMs, Einrichtung beider Hosts, Prüfungen) und `-Mode lauf` für den Lauf; Ablauf im [Runbook](../runbook.md), Entscheidung in [ADR 1B-010](../../../adr/1B-010-aufbau-automatisiert-mit-groessenempfehlung.md). `vm-windows.ps1` bleibt die VM-Schicht darunter.

Ziel: dasselbe Zwei-VM-Labor wie unter Linux (`vm-linux.sh`, libvirt), nur mit anderer Startschicht (Hyper-V). Die cloud-init-Dateien sind identisch: `app-host.user-data.yaml` und `llm-host.user-data.yaml` in diesem Ordner.

|            | app-host       | llm-host       |
| ---------- | -------------- | -------------- |
| IP         | 192.168.150.10 | 192.168.150.20 |
| vCPU / RAM | 2 / 6 GiB      | 4 / 12 GiB     |

vCPU und RAM: Werte des Messrechners; `labor.ps1` empfiehlt sie je Rechner nach der Regel aus ADR 1B-010.
| Disk | 25 GB | 30 GB |
| MAC | 00155D1B0010 | 00155D1B0020 |

Netz `192.168.150.0/24`, Gateway `.1` auf dem Host, ausgehend NAT erlaubt, von außen nicht erreichbar (kein Port-Forwarding, keine Bridge auf die physische Netzkarte, [ADR 1B-003](../../../adr/1B-003-laborregel-virtuelles-netz.md)). SSH-Nutzer: `labor`.

## 1. Automatisch: `vm-windows.ps1`

Das Skript ist das Gegenstück zu `vm-linux.sh`: gleiche VM-Namen, IPs, Größen, gleicher Nutzer `labor`, gleiche Bereitschaftsmarke `/var/lib/labor-basis.done`, gleicher Checkout des Repo-Stands per `git bundle`. Image, Seed-ISOs und Bundle baut es in WSL.

### 1.1 Voraussetzungen

- Windows 10/11 **Pro, Education oder Enterprise** (Hyper-V; auf Home nicht möglich, siehe Abschnitt 3).
- WSL 2 mit einer Debian-/Ubuntu-Distribution, in der das Repo liegt (etwa `~/arsnova.eu`).
- Windows-OpenSSH-Client (`ssh`, `scp`); auf Windows 10/11 meist schon da.
- Etwa 18 GB freier RAM für die VMs (statischer Speicher) und mindestens 40 GB freier Platz auf `C:`; das Skript warnt, wenn weniger frei ist.

### 1.2 Einmalig

1. Hyper-V aktivieren (Admin-PowerShell), danach **neu starten**:

   ```powershell
   Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
   ```

   Alternativ macht das `vm-windows.ps1 -Mode up -EnableHyperV`; auch dann ist ein Neustart nötig.

2. Werkzeuge in WSL:

   ```bash
   sudo apt install -y qemu-utils xorriso git
   ```

   Alternativ installiert `-InstallWslTools` sie (als root in WSL, ohne Passwortabfrage).

3. SSH-Schlüssel unter Windows (normale PowerShell), falls `%USERPROFILE%\.ssh\id_ed25519.pub` fehlt:

   ```powershell
   ssh-keygen -t ed25519 -f "$env:USERPROFILE\.ssh\id_ed25519"
   ```

4. Falls `ssh` fehlt (Admin-PowerShell, [OpenSSH für Windows](https://learn.microsoft.com/windows-server/administration/openssh/openssh_install_firstuse)):

   ```powershell
   Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
   ```

### 1.3 Aufruf

In einer **Admin-PowerShell** in den Ordner dieses Dokuments im WSL-Repo wechseln und starten:

```powershell
cd \\wsl.localhost\Ubuntu\home\<nutzer>\arsnova.eu\docs\referat-thema-1\evidenz\1B\vm
powershell -ExecutionPolicy Bypass -File .\vm-windows.ps1 -Mode up
powershell -ExecutionPolicy Bypass -File .\vm-windows.ps1 -Mode status
powershell -ExecutionPolicy Bypass -File .\vm-windows.ps1 -Mode destroy
```

`-ExecutionPolicy Bypass` gilt nur für diesen Aufruf; die Ausführungsrichtlinie des Rechners bleibt unverändert. Liegt das Skript unter `\\wsl.localhost\<Distro>\…` (oder `\\wsl$\<Distro>\…`), leitet es Distribution und Repo-Pfad daraus ab. Sonst `-RepoPath` (Pfad aus Sicht von WSL) und bei Bedarf `-WslDistro` angeben.

| Parameter                                        | Standard                                  | Bedeutung                                                          |
| ------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------ |
| `-Mode`                                          | –                                         | `up`, `status` oder `destroy`                                      |
| `-SshKey`                                        | `%USERPROFILE%\.ssh\id_ed25519.pub`       | öffentlicher Schlüssel für `labor`; privater Schlüssel ohne `.pub` |
| `-VmDir`                                         | `C:\ProgramData\arsnova-1b`               | Image, Disks, Seeds, `known_hosts`, Bundle; nie einchecken         |
| `-RepoPath`                                      | aus dem Skriptort, `git rev-parse` in WSL | Repo aus Sicht von WSL                                             |
| `-WslDistro`                                     | aus dem Skriptort, sonst Standard-Distro  | WSL-Distribution                                                   |
| `-Commit`                                        | `HEAD`                                    | Repo-Stand für die VMs; muss Vorfahre von `HEAD` sein              |
| `-LlmCpus`, `-LlmRamGB`, `-AppCpus`, `-AppRamGB` | 4, 12, 2, 6                               | Größen wie unter Linux                                             |
| `-EnableHyperV`                                  | aus                                       | Hyper-V aktivieren (danach Neustart)                               |
| `-InstallWslTools`                               | aus                                       | `qemu-utils`, `xorriso`, `git` in WSL installieren                 |
| `-NoSecureBoot`                                  | aus                                       | Secure Boot aus, falls das Image mit dem Template nicht startet    |

### 1.4 Was `up` tut

1. **Vorprüfung** mit deutschen Fehlermeldungen: Admin-Rechte, Hyper-V aktiv, WSL mit Distribution, Werkzeuge in WSL, `ssh`/`scp`, SSH-Schlüssel, freier RAM und Platz (Warnung).
2. **Netz** (idempotent): interner Switch `arsnova-1b`, `192.168.150.1/24` auf `vEthernet (arsnova-1b)`, `New-NetNat -Name arsnova-1b -InternalIPInterfaceAddressPrefix 192.168.150.0/24` ([NAT-Netz](https://learn.microsoft.com/windows-server/virtualization/hyper-v/setup-nat-network)). Bricht ab, wenn ein anderes NAT oder eine Adresse des Rechners (etwa das Heimnetz) `192.168.150.0/24` überschneidet; warnt bei jedem anderen NAT, weil Microsoft nur **ein** NAT-Netz pro Host dokumentiert.
3. **Image**: dasselbe Ubuntu-24.04-Cloud-Image wie `vm-linux.sh`, SHA256 gegen `SHA256SUMS` (`Get-FileHash`), Umwandlung in WSL mit `qemu-img convert -O vhdx -o subformat=dynamic`, je VM eine Kopie, `Resize-VHD` auf 25 bzw. 30 GB.
4. **Seeds**: je VM ein NoCloud-ISO (Volume-Label `cidata`, `xorriso` in WSL) mit `user-data` (Schlüssel eingesetzt), `meta-data` und `network-config` (Format v2, statische Adresse, Treffer über die feste MAC, Gateway `.1`, DNS `1.1.1.1` und `9.9.9.9`), siehe [NoCloud](https://docs.cloud-init.io/en/latest/reference/datasources/nocloud.html) und [Netzwerk v2](https://docs.cloud-init.io/en/latest/reference/network-config-format-v2.html).
5. **VMs**: Generation 2, Secure-Boot-Template `MicrosoftUEFICertificateAuthority` ([Linux-Template](https://learn.microsoft.com/windows-server/virtualization/hyper-v/generation-2-virtual-machine-security-features#secure-boot)), statischer Speicher, keine automatischen Checkpoints, `Set-VMProcessor -Count`, feste MAC, Seed-ISO als DVD, Disk zuerst in der Bootreihenfolge, Start.
6. **Repo**: wartet je VM bis 15 min auf SSH und die Bereitschaftsmarke, kopiert ein `git bundle` von `HEAD` und checkt den Commit aus (wie `vm-linux.sh`). Eigene `known_hosts` in `-VmDir`.
7. Danach `status`: Switch und NAT, Route, je VM Zustand, vCPU (ohne Pinning), RAM, `docker version`, Node-Version, ausgehendes NAT, Repo-Commit.

`destroy` entfernt nur Objekte namens `arsnova-1b…`: VMs, ihre Disks, Seeds, Konfigurationsordner, NAT, Switch, `known_hosts`, Bundle. Image und Basis-VHDX bleiben für den nächsten Lauf liegen.

### 1.5 WSL und die VMs danach

Von Windows aus (PowerShell) erreicht man die VMs direkt, weil der Rechner `192.168.150.1` auf dem internen Switch hat:

```powershell
ssh -o UserKnownHostsFile=C:/ProgramData/arsnova-1b/known_hosts labor@192.168.150.20
```

Ob WSL im Standardmodus (NAT) das Netz eines internen Hyper-V-Switches erreicht, dokumentiert Microsoft nicht; die WSL-Netzwerkdoku beschreibt nur den Zugriff zwischen WSL, Windows und LAN ([WSL-Netzwerk](https://learn.microsoft.com/windows/wsl/networking)). **Nicht verifiziert.** Test in WSL: `ssh labor@192.168.150.10 true`. Dafür braucht WSL denselben Schlüssel: privaten Schlüssel nach `~/.ssh/` in WSL kopieren und `chmod 600` setzen (unter `/mnt/c` lehnt `ssh` ihn wegen der Rechte ab). Scheitert der Test:

- die SSH-Schritte der Laborskripte aus PowerShell ausführen (sicherer Weg), oder
- WSL auf `networkingMode=mirrored` in `%USERPROFILE%\.wslconfig` umstellen (Windows 11 22H2+, [Mirrored Mode](https://learn.microsoft.com/windows/wsl/networking#mirrored-mode-networking)); ob dabei der Switch-Adapter gespiegelt wird, ist ebenfalls **nicht verifiziert**.

### 1.6 Noch nicht verifiziert

- Ein ganzer Lauf des Skripts auf Windows (bisher nur Parser und PSScriptAnalyzer 1.23 in einem Linux-Container mit PowerShell 7.4: 0 Fehler, 0 Warnungen).
- Ob das generische Ubuntu-24.04-Cloud-Image als VHDX unter Hyper-V Gen 2 mit dem Template `MicrosoftUEFICertificateAuthority` bootet. Die Microsoft-Doku listet Ubuntu 24.04 mit UEFI und Secure Boot als unterstützt ([Ubuntu auf Hyper-V](https://learn.microsoft.com/windows-server/virtualization/hyper-v/supported-ubuntu-virtual-machines-on-hyper-v)), aber nicht dieses Image. Falls nicht: `-NoSecureBoot`.
- Ob Hyper-V die von `qemu-img` erzeugte VHDX ohne Weiteres annimmt. Das Skript kopiert die Datei neu (nicht sparse), weil Hyper-V sparse VHDX-Dateien ablehnen soll; diese Einschränkung habe ich in der Microsoft-Doku nicht gefunden.
- Ob `wslpath` und `git` in WSL auf Pfaden unter `\\wsl.localhost\…` und `/mnt/c` wie erwartet arbeiten (das Skript liest UNC-Pfade selbst und nutzt `wslpath` nur für Laufwerkspfade).
- Erreichbarkeit der VMs aus WSL (Abschnitt 1.5).
- Ob cloud-init die Schnittstelle unter Hyper-V als `eth0` umbenennt; der Treffer läuft über die MAC, der Name ist nur kosmetisch.

## 2. Warum nicht zwei WSL-Distributionen

WSL 2 startet **eine** Hilfs-VM; alle Distributionen laufen darin als Container und teilen sich Netz-Namespace, CPU, Kernel und Speicher ([Microsoft: What is WSL](https://learn.microsoft.com/windows/wsl/about#what-is-wsl-2)). Zwei Distributionen sind also kein zweiter Host und haben kein Netz dazwischen. Die Messung (Netzpfad, getrennte CPU-/RAM-Grenzen) wäre ungültig.

Verschachtelt (WSL2 in einer Hyper-V-VM) wäre möglich ([Nested Virtualization](https://learn.microsoft.com/windows-server/virtualization/hyper-v/nested-virtualization#supported-scenarios)), bringt aber eine zusätzliche Hypervisor-Ebene und Messrauschen. Nicht empfohlen.

## 3. Manueller Weg (Rückfallebene und Erklärung)

Das macht das Skript; die Schritte hier helfen bei der Fehlersuche. Warum Hyper-V: Microsoft dokumentiert genau diese Konstruktion (interner Switch + `New-NetNat`, [NAT-Netz](https://learn.microsoft.com/windows-server/virtualization/hyper-v/setup-nat-network)). Das Netz ist per Konstruktion nur ausgehend; feste IPs setzt cloud-init. Auf Windows Home lässt sich die Hyper-V-Rolle nicht installieren ([Install Hyper-V](https://learn.microsoft.com/windows-server/virtualization/hyper-v/get-started/install-hyper-v#check-requirements-for-windows)); WSL 2 läuft dort nur mit dem Teil „Virtual Machine Platform“ ([WSL-FAQ](https://learn.microsoft.com/windows/wsl/faq#is-wsl-2-available-on-windows-10-home-and-windows-11-home)).

### 3.1 Netz anlegen (Admin-PowerShell)

```powershell
New-VMSwitch -SwitchName "arsnova-1b" -SwitchType Internal
$idx = (Get-NetAdapter -Name "vEthernet (arsnova-1b)").ifIndex
New-NetIPAddress -IPAddress 192.168.150.1 -PrefixLength 24 -InterfaceIndex $idx
New-NetNat -Name "arsnova-1b" -InternalIPInterfaceAddressPrefix 192.168.150.0/24
```

### 3.2 Image und Seed vorbereiten (in WSL)

```bash
# Ubuntu-24.04-Cloud-Image laden, SHA256 gegen SHA256SUMS der Quelle prüfen
qemu-img convert -O vhdx -o subformat=dynamic ubuntu-24.04-server-cloudimg-amd64.img app.vhdx
# je VM ein Seed-Verzeichnis: user-data (aus diesem Ordner, SSH-Schlüssel eingesetzt),
# meta-data (instance-id, local-hostname), network-config (siehe unten)
xorriso -as mkisofs -o app-seed.iso -V cidata -J -r user-data meta-data network-config
```

Das Volume-Label muss `cidata` heißen (NoCloud). Unter Windows ohne WSL ginge `oscdimg` (Windows ADK); die Flags dafür sind **nicht verifiziert**.

`network-config` (v2), je VM mit eigener Adresse und MAC (hier app-host):

```yaml
version: 2
ethernets:
  eth0:
    match:
      macaddress: '00:15:5d:1b:00:10'
    set-name: eth0
    addresses: [192.168.150.10/24]
    routes:
      - to: default
        via: 192.168.150.1
    nameservers:
      addresses: [1.1.1.1, 9.9.9.9]
```

Das NAT-Gateway vergibt keine IPs und kein DNS, deshalb statisch und mit eigenen Nameservern ([NAT-Netz](https://learn.microsoft.com/windows-server/virtualization/hyper-v/setup-nat-network#create-a-nat-virtual-network)). MAC in Kleinbuchstaben mit Doppelpunkten; für `set-name` verlangt cloud-init `macaddress` im `match` ([Netzwerk v2](https://docs.cloud-init.io/en/latest/reference/network-config-format-v2.html)).

### 3.3 VMs anlegen (Admin-PowerShell, Beispiel llm-host)

```powershell
Resize-VHD -Path C:\ProgramData\arsnova-1b\arsnova-1b-llm.vhdx -SizeBytes 30GB
New-VM -Name arsnova-1b-llm -Generation 2 -MemoryStartupBytes 12GB -VHDPath C:\ProgramData\arsnova-1b\arsnova-1b-llm.vhdx -SwitchName arsnova-1b
Set-VM -Name arsnova-1b-llm -StaticMemory -AutomaticCheckpointsEnabled $false
Set-VMProcessor -VMName arsnova-1b-llm -Count 4
Set-VMNetworkAdapter -VMName arsnova-1b-llm -StaticMacAddress 00155D1B0020
Add-VMDvdDrive -VMName arsnova-1b-llm -Path C:\ProgramData\arsnova-1b\arsnova-1b-llm-seed.iso
Set-VMFirmware -VMName arsnova-1b-llm -SecureBootTemplate MicrosoftUEFICertificateAuthority -FirstBootDevice (Get-VMHardDiskDrive -VMName arsnova-1b-llm)
Start-VM -Name arsnova-1b-llm
```

app-host: `-MemoryStartupBytes 6GB`, `-Count 2`, MAC `00155D1B0010`, eigene VHDX/ISO. Parameter geprüft gegen die Referenzen zu [`Set-VM`](https://learn.microsoft.com/powershell/module/hyper-v/set-vm?view=windowsserver2025-ps), [`Set-VMProcessor`](https://learn.microsoft.com/powershell/module/hyper-v/set-vmprocessor?view=windowsserver2025-ps), [`Set-VMNetworkAdapter`](https://learn.microsoft.com/powershell/module/hyper-v/set-vmnetworkadapter?view=windowsserver2025-ps) und [`Set-VMFirmware`](https://learn.microsoft.com/powershell/module/hyper-v/set-vmfirmware?view=windowsserver2025-ps).

## 4. CPU-Pinning

Ziel wäre: llm-host auf je einem Thread jedes physischen Kerns. In der Doku zu `Set-VMProcessor` fand ich nur Anzahl, Reserve, Limit und Gewicht, **keine Affinität**; das Skript setzt deshalb die Anzahl und als Näherung (ergänzt 2026-11-12) für den llm-host `-Reserve 100` und `-RelativeWeight 200`, für den app-host `-RelativeWeight 100`. Hyper-V kennt CPU-Gruppen mit Prozessor-Affinität ([Resource Controls](https://learn.microsoft.com/windows-server/virtualization/hyper-v/manage/manage-hyper-v-cpugroups#isolating-vm-groups-to-specific-host-processors)); diese Doku ist für Windows Server geschrieben, ob sie auf Windows 11 Pro nutzbar ist, ist **nicht verifiziert**. Ohne Pinning: `Set-VMProcessor -Maximum`/`-Reserve` als Näherung und im Protokoll als Abweichung zum Linux-Lauf vermerken.

## 5. Alternativen

- **Multipass** (Canonical): kennt `multipass launch --cloud-init <datei>` und `--network name=…,mode=manual,mac=…` für zusätzliche Netze, setzt dafür Netplan im Image voraus ([Custom networking](https://canonical.com/multipass/docs/latest/how-to-guides/manage-instances/set-up-custom-networking/)). Die Doku zu statischen IPs beschreibt eine Linux-Bridge ([Static IPs](https://canonical.com/multipass/docs/latest/how-to-guides/manage-instances/configure-static-ips/)); ein Windows-Pendant, ein CPU-Pinning und das Verhalten der Windows-Treiber sind **nicht verifiziert**. Vorteil wäre Home-Tauglichkeit, falls der Treiber ohne Hyper-V-Rolle läuft (nicht verifiziert). Für unser festes Netz daher nur zweite Wahl.
- **VirtualBox**: auf Windows 11 Home möglich, aber neben WSL 2 nur mit aktueller Version ([WSL-Vergleich](https://learn.microsoft.com/windows/wsl/compare-versions#exceptions-for-using-wsl-1-rather-than-wsl-2)); NAT-Network, cloud-init-ISO und `VBoxManage modifyvm --cpuaffinity` (Pinning) habe ich **nicht gegen die Hersteller-Doku geprüft**.
- **Windows Home ohne Alternative**: Dann ist nur Multipass/VirtualBox (ungeprüft) oder ein Wechsel auf Pro möglich.

## 6. Prüfung nach dem Start

`vm-windows.ps1 -Mode status` deckt die ersten drei Punkte ab. Zusätzlich wie Linux Task 3 Step 4:

```powershell
ssh labor@192.168.150.10 docker version
ssh labor@192.168.150.20 docker version
ssh labor@192.168.150.10 curl -sI https://deb.debian.org   # ausgehendes NAT
ssh labor@192.168.150.10 ping -c1 192.168.150.20           # Netz zwischen den VMs
```

Nicht von außen erreichbar: vom **Handy oder zweiten Rechner im Heimnetz** `curl --max-time 5 http://192.168.150.20:8080/health` muss scheitern; `Get-NetRoute -DestinationPrefix 192.168.150.0/24` zeigt nur `vEthernet (arsnova-1b)`; `Get-VMSwitch` zeigt `arsnova-1b` als `Internal` (nicht `External`).

## 7. Gültigkeitsgrenzen

- Absolute Zeiten (Inferenz, Antwortzeit) sind zwischen Rechnern **nicht vergleichbar**; verglichen werden nur Verhältnisse und die Zerlegung innerhalb eines Rechners.
- Kein CPU-Pinning (Abschnitt 4): Die Isolation ist schwächer als beim Linux-Lauf; das im Protokoll ausweisen.
- Dieses Dokument und das Skript sind ungetestet; jede Abweichung beim Aufbau gehört ins Aufbauprotokoll.
