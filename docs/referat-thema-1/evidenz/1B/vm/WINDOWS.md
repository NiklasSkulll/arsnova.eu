# 1B-Labor unter Windows (WSL-Rechner)

**Status: ungetestet, Niklas prüft** · Stand: 2026-11-12

Ziel: dasselbe Zwei-VM-Labor wie unter Linux (libvirt), nur mit anderer Startschicht. Die cloud-init-Dateien sind identisch: `app-host.user-data.yaml` und `llm-host.user-data.yaml` in diesem Ordner.

|            | app-host         | llm-host       |
| ---------- | ---------------- | -------------- |
| IP         | 192.168.150.10   | 192.168.150.20 |
| vCPU / RAM | 2 / 6 GiB        | 4 / 12 GiB     |
| Disk       | wie Linux-Skript | 30 GB          |

Netz `192.168.150.0/24`, Gateway `.1` auf dem Host, ausgehend NAT erlaubt, von außen nicht erreichbar (kein Port-Forwarding, keine Bridge auf die physische Netzkarte). SSH-Nutzer: `labor`.

## 1. Warum nicht zwei WSL-Distributionen

WSL 2 startet **eine** Hilfs-VM; alle Distributionen laufen darin als Container und teilen sich Netz-Namespace, CPU, Kernel und Speicher ([Microsoft: What is WSL](https://learn.microsoft.com/windows/wsl/about#what-is-wsl-2)). Zwei Distributionen sind also kein zweiter Host und haben kein Netz dazwischen. Die Messung (Netzpfad, getrennte CPU-/RAM-Grenzen) wäre ungültig.

Verschachtelt (WSL2 in einer Hyper-V-VM) wäre möglich ([Nested Virtualization](https://learn.microsoft.com/windows-server/virtualization/hyper-v/nested-virtualization#supported-scenarios)), bringt aber eine zusätzliche Hypervisor-Ebene und Messrauschen. Nicht empfohlen.

## 2. Empfohlener Weg: Hyper-V mit internem NAT-Switch

Warum: Microsoft dokumentiert genau diese Konstruktion (interner Switch + `New-NetNat`, [NAT-Netz](https://learn.microsoft.com/windows-server/virtualization/hyper-v/setup-nat-network)). Das Netz ist per Konstruktion nur ausgehend; feste IPs setzt cloud-init. Voraussetzung: **Windows 11 Pro/Enterprise/Education**. Auf Home lässt sich die Hyper-V-Rolle nicht installieren ([Install Hyper-V](https://learn.microsoft.com/windows-server/virtualization/hyper-v/get-started/install-hyper-v#check-requirements-for-windows)); WSL 2 läuft dort nur mit dem Teil „Virtual Machine Platform“ ([WSL-FAQ](https://learn.microsoft.com/windows/wsl/faq#is-wsl-2-available-on-windows-10-home-and-windows-11-home)).

Hinweis: Pro Host ist nur **ein** NAT-Netz möglich (gleiche Quelle wie oben).

### 2.1 Hyper-V aktivieren (Admin-PowerShell, danach Neustart)

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
```

### 2.2 Netz anlegen

```powershell
New-VMSwitch -SwitchName "arsnova-1b" -SwitchType Internal
$idx = (Get-NetAdapter -Name "vEthernet (arsnova-1b)").ifIndex
New-NetIPAddress -IPAddress 192.168.150.1 -PrefixLength 24 -InterfaceIndex $idx
New-NetNat -Name "arsnova-1b" -InternalIPInterfaceAddressPrefix 192.168.150.0/24
```

### 2.3 Image und Seed vorbereiten (in WSL)

```bash
sudo apt install qemu-utils genisoimage
# Ubuntu-LTS-Cloud-Image (.img) laden, SHA256 gegen SHA256SUMS der Quelle prüfen
qemu-img convert -O vhdx noble-server-cloudimg-amd64.img app.vhdx
cp app.vhdx llm.vhdx
# je VM ein Seed-Verzeichnis: user-data (aus diesem Ordner, SSH-Schlüssel eingesetzt),
# meta-data (instance-id, local-hostname), network-config (siehe unten)
genisoimage -output app-seed.iso -volid cidata -joliet -rock app/user-data app/meta-data app/network-config
```

Das Volume-Label muss `cidata` heißen (NoCloud). Unter Windows ohne WSL geht `oscdimg` (Windows ADK); die Flags dafür sind **nicht verifiziert**.

`network-config` (v2), je VM mit eigener Adresse (hier app-host):

```yaml
version: 2
ethernets:
  nic0:
    match: { name: 'e*' }
    addresses: [192.168.150.10/24]
    routes: [{ to: default, via: 192.168.150.1 }]
    nameservers: { addresses: [1.1.1.1, 9.9.9.9] }
```

Das NAT-Gateway vergibt keine IPs und kein DNS, deshalb statisch und mit eigenen Nameservern ([NAT-Netz](https://learn.microsoft.com/windows-server/virtualization/hyper-v/setup-nat-network#create-a-nat-virtual-network)). Ein `network-config` im Seed ist cloud-init-Standard (NoCloud); gegen die cloud-init-Doku der verwendeten Version prüfen.

### 2.4 VMs anlegen (Admin-PowerShell, Beispiel llm-host)

```powershell
Resize-VHD -Path C:\vm\llm.vhdx -SizeBytes 30GB
New-VM -Name arsnova-1b-llm -Generation 2 -MemoryStartupBytes 12GB -VHDPath C:\vm\llm.vhdx -SwitchName arsnova-1b
Set-VM -Name arsnova-1b-llm -StaticMemory
Set-VMProcessor -VMName arsnova-1b-llm -Count 4
Set-VMFirmware -VMName arsnova-1b-llm -SecureBootTemplate MicrosoftUEFICertificateAuthority
Add-VMDvdDrive -VMName arsnova-1b-llm -Path C:\vm\llm-seed.iso
Start-VM -Name arsnova-1b-llm
```

app-host: `-MemoryStartupBytes 6GB`, `-Count 2`, eigene VHDX/ISO. Die Cmdlets sind Standard-Hyper-V (`Set-VMProcessor`: [Referenz](https://learn.microsoft.com/powershell/module/hyper-v/set-vmprocessor?view=windowsserver2025-ps)); das Secure-Boot-Template für Ubuntu und die Zeilenfolge sind **nicht verifiziert**.

## 3. CPU-Pinning

Ziel wäre: llm-host auf je einem Thread jedes physischen Kerns. In der Doku zu `Set-VMProcessor` fand ich nur Anzahl, Reserve, Limit und Gewicht, **keine Affinität**. Hyper-V kennt CPU-Gruppen mit Prozessor-Affinität ([Resource Controls](https://learn.microsoft.com/windows-server/virtualization/hyper-v/manage/manage-hyper-v-cpugroups#isolating-vm-groups-to-specific-host-processors)); diese Doku ist für Windows Server geschrieben, ob sie auf Windows 11 Pro nutzbar ist, ist **nicht verifiziert**. Ohne Pinning: `Set-VMProcessor -Maximum`/`-Reserve` als Näherung und im Protokoll als Abweichung zum Linux-Lauf vermerken.

## 4. Alternativen

- **Multipass** (Canonical): kennt `multipass launch --cloud-init <datei>` und `--network name=…,mode=manual,mac=…` für zusätzliche Netze, setzt dafür Netplan im Image voraus ([Custom networking](https://canonical.com/multipass/docs/latest/how-to-guides/manage-instances/set-up-custom-networking/)). Die Doku zu statischen IPs beschreibt eine Linux-Bridge ([Static IPs](https://canonical.com/multipass/docs/latest/how-to-guides/manage-instances/configure-static-ips/)); ein Windows-Pendant, ein CPU-Pinning und das Verhalten der Windows-Treiber sind **nicht verifiziert**. Vorteil wäre Home-Tauglichkeit, falls der Treiber ohne Hyper-V-Rolle läuft (nicht verifiziert). Für unser festes Netz daher nur zweite Wahl.
- **VirtualBox**: auf Windows 11 Home möglich, aber neben WSL 2 nur mit aktueller Version ([WSL-Vergleich](https://learn.microsoft.com/windows/wsl/compare-versions#exceptions-for-using-wsl-1-rather-than-wsl-2)); NAT-Network, cloud-init-ISO und `VBoxManage modifyvm --cpuaffinity` (Pinning) habe ich **nicht gegen die Hersteller-Doku geprüft**.
- **Windows Home ohne Alternative**: Dann ist nur Multipass/VirtualBox (ungeprüft) oder ein Wechsel auf Pro möglich.

## 5. Prüfung nach dem Start

Wie Linux Task 3 Step 4:

```powershell
ssh labor@192.168.150.10 docker version
ssh labor@192.168.150.20 docker version
ssh labor@192.168.150.10 curl -sI https://deb.debian.org   # ausgehendes NAT
ssh labor@192.168.150.10 ping -c1 192.168.150.20           # Netz zwischen den VMs
```

Nicht von außen erreichbar: vom **Handy oder zweiten Rechner im Heimnetz** `curl --max-time 5 http://192.168.150.20:8080/health` muss scheitern; `Get-NetRoute -DestinationPrefix 192.168.150.0/24` zeigt nur `vEthernet (arsnova-1b)`; `Get-VMSwitch` zeigt `arsnova-1b` als `Internal` (nicht `External`).

## 6. Gültigkeitsgrenzen

- Absolute Zeiten (Inferenz, Antwortzeit) sind zwischen Rechnern **nicht vergleichbar**; verglichen werden nur Verhältnisse und die Zerlegung innerhalb eines Rechners.
- Fehlt CPU-Pinning, ist die Isolation schwächer als beim Linux-Lauf; das im Protokoll ausweisen.
- Dieses Dokument ist ungetestet; jede Abweichung beim Aufbau gehört ins Aufbauprotokoll.
