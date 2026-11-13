# 1B-Labor unter Windows

**Stand: 2026-11-13, ohne WSL.** Schrittfolge für Niklas: [Runbook, Abschnitt 8](../runbook.md#8-übergabe-an-niklas-schritte-34). Testergebnisse: [Windows-Test](../2026-11-13-windows-test.md).

_Aktualisiert 2026-11-13:_ Bis Commit `673d7d57` baute WSL Image, Seed-ISO und `git bundle`. Das war die größte Fehlerquelle (ungetestet, WSL-Erreichbarkeit des internen Switches offen) und ist ersetzt durch Windows-Bordmittel. Begründung und Recherche: [ADR 1B-010, Nachtrag](../../../adr/1B-010-aufbau-automatisiert-mit-groessenempfehlung.md).

Ziel: dasselbe Zwei-VM-Labor wie unter Linux (`vm-linux.sh`), mit Hyper-V als Startschicht. Die cloud-init-Dateien sind identisch: `app-host.user-data.yaml` und `llm-host.user-data.yaml`.

|                  | app-host       | llm-host       |
| ---------------- | -------------- | -------------- |
| IP               | 192.168.150.10 | 192.168.150.20 |
| vCPU / RAM       | 2 / 6 GiB      | 4 / 12 GiB     |
| Platte (maximal) | 25 GB          | 20 GB          |
| MAC              | 00155D1B0010   | 00155D1B0020   |

Größen: Werte des Messrechners; `labor.ps1` empfiehlt sie je Rechner (ADR 1B-010). Netz `192.168.150.0/24`, Gateway `.1` auf dem Rechner, ausgehend NAT, von außen nicht erreichbar (kein Port-Forwarding, keine Bridge, [ADR 1B-003](../../../adr/1B-003-laborregel-virtuelles-netz.md)). SSH-Nutzer: `labor`.

## 1. Was `labor.ps1 -Mode up` tut

Die VM-Schicht ist `vm-windows.ps1`, die Hilfsfunktionen stehen in `windows-lib.ps1` (getestet mit Pester, auch unter Linux-pwsh). Jeder Schritt zeigt `[n/11]`, die Zeit seit Beginn, die geschätzte Restzeit und das voraussichtliche Ende (gleiche Zeile wie `labor.sh`, `Format-SchrittZeile`); ein erneuter Aufruf überspringt, was fertig ist. Speicherort: Beim ersten `vorpruefung` oder `up` zeigt das Skript den freien Platz je Laufwerk, empfiehlt das lokale NTFS/ReFS-Laufwerk mit dem meisten Platz und merkt sich die Wahl in `%USERPROFILE%\labor-1b\einstellungen.json`. Solange es läuft, sperrt es den Ruhezustand (`SetThreadExecutionState`) und weist im Akkubetrieb darauf hin.

1. **Vorprüfung** (ändert nichts, einzeln: `-Mode vorpruefung`): Admin-Rechte, Windows-Edition (Home hat kein Hyper-V), Hyper-V aktiv und Hypervisor läuft (sonst Hinweis auf BIOS/UEFI), Hyper-V-Modul, `ssh.exe`/`scp.exe`, `tar.exe`, Labornetz frei (VPN, Heimnetz), andere NAT-Netze, freier Platz, Erreichbarkeit aller Downloadquellen (Ubuntu, Docker, NodeSource, Hugging Face, GitHub Container Registry). Jede Zeile `OK`, `HINWEIS` oder `FEHLER` mit Abhilfe; bei `FEHLER` bricht es ab, ohne etwas zu ändern. Es nutzt einen eigenen Laborschlüssel `%USERPROFILE%\.ssh\arsnova-1b_ed25519` und legt ihn bei Bedarf an (ein vorhandener Schlüssel mit Passphrase würde still scheitern). Die Downloadprüfung geht ohne Proxy, wie die VMs, und prüft externes DNS (1.1.1.1), das Uni- oder Firmennetze oft sperren. Mit `-EnableHyperV` aktiviert es Hyper-V und bittet um einen Neustart.
2. **Netz**: interner Switch `arsnova-1b`, `192.168.150.1/24`, `New-NetNat` ([NAT-Netz](https://learn.microsoft.com/windows-server/virtualization/hyper-v/setup-nat-network); nur ein NAT pro Rechner).
3. **Image**: `ubuntu-24.04-server-cloudimg-amd64.img` (qcow2 v3, zlib) von `cloud-images.ubuntu.com/releases/noble/release`, SHA-256 gegen `SHA256SUMS`. Ein eigener qcow2-Leser in `windows-lib.ps1` entpackt es zur Rohdisk, eine VHD-Fußzeile (Microsoft-VHD-Spezifikation) macht daraus eine feste VHD, `Test-VHD` prüft sie, `Convert-VHD` erzeugt die dynamische VHDX (erst unter Zwischennamen, dann umbenannt). Belegt am 2026-11-13: Ergebnis bitgleich mit `qemu-img convert` (8 s), die VHD bootet in KVM mit erzwungenem Secure Boot (Microsoft-Schlüssel), cloud-init findet den Seed und setzt `eth0` über die MAC. Das `tar.gz` daneben enthält nur die Root-Partition und bootet nicht.
4. **Je VM**: Kopie der Basis-VHDX, `Resize-VHD`, NoCloud-Seed als ISO (Label `cidata`, ISO9660 und Joliet über die Windows-Schnittstelle IMAPI2, wie im Projekt [hyperv-vm-provisioning](https://github.com/schtritoff/hyperv-vm-provisioning)), Generation 2, Secure-Boot-Template `MicrosoftUEFICertificateAuthority`, statischer Speicher, keine automatischen Checkpoints, feste MAC. Mit `-NurVorbereiten` endet `up` hier, ohne eine VM zu starten.
5. **Start**: erst jetzt die RAM-Prüfung (statischer Speicher wird beim Start belegt); bliebe Windows weniger als die Reserve, bricht es ab, die VMs bleiben angelegt.
6. **Repo-Stand**: `.git` des Clones per `tar.exe` packen, in jede VM kopieren, dort klonen und den Commit von `HEAD` auschecken (Commit aus `.git` gelesen, kein `git.exe` nötig). Wartet je VM bis 20 min auf cloud-init und meldet alle 60 s den Stand.
7. **Einrichtung** (`labor.ps1`): llm-host (Runtime-Image, Modell 2,4 GB, Start), app-host (App-Build, Datenbank, Start), dann alle Prüfungen mit Bericht.

Jeder Aufruf schreibt ein Log nach `%USERPROFILE%\labor-1b\log-<Modus>-<Zeit>.txt` (ohne Tokens); bei einem Fehler nennt das Skript Schritt, Ursache, Abhilfe und den Logpfad.

| Parameter                                        | Standard                                    | Bedeutung                                                       |
| ------------------------------------------------ | ------------------------------------------- | --------------------------------------------------------------- |
| `-Mode`                                          | `groessen`                                  | `vorpruefung`, `up`, `pruefen`, `status`, `stop`, `start`, ...  |
| `-Ja`                                            | aus                                         | ohne Rückfragen, Empfehlung übernehmen                          |
| `-NurVorbereiten`                                | aus                                         | alles anlegen, keine VM starten                                 |
| `-LlmCpus`, `-LlmRamGB`, `-AppCpus`, `-AppRamGB` | Empfehlung                                  | eigene Größen                                                   |
| `-LlmDiskGB`, `-AppDiskGB`                       | 20, 25                                      | Obergrenze der Platten (mindestens 20 bzw. 25)                  |
| `-RamReserveGB`                                  | 4                                           | RAM, der Windows bleiben muss (mindestens 2)                    |
| `-EnableHyperV`                                  | aus                                         | Hyper-V aktivieren (danach Neustart)                            |
| `-NoSecureBoot`                                  | aus                                         | Secure Boot aus, falls das Image mit dem Template nicht startet |
| `-SshKey`                                        | `%USERPROFILE%\.ssh\arsnova-1b_ed25519.pub` | eigener Laborschlüssel für `labor`                              |
| `-VmDir`                                         | beim ersten Aufruf gefragt                  | Image, Disks, Seeds, `known_hosts`; nie einchecken              |

`destroy` entfernt nur Objekte namens `arsnova-1b…`; Basis-Image und Download bleiben in `-VmDir` (ganz weg: Ordner löschen).

## 2. Noch nicht auf echter Hardware verifiziert

- Start der VMs unter Hyper-V und cloud-init darin. In einer KVM-VM auf dem Laptop nicht testbar: Mit Host-Kernel 7.2 hängt jede VM, die Hyper-V in der Windows-VM startet ([Windows-Test](../2026-11-13-windows-test.md)). Der Rest bis kurz vor dem Start ist dort getestet (siehe Windows-Test, Versuch 4).
- Ob das generische Ubuntu-Image mit dem Secure-Boot-Template startet. Microsoft listet Ubuntu 24.04 mit UEFI und Secure Boot als unterstützt ([Ubuntu auf Hyper-V](https://learn.microsoft.com/windows-server/virtualization/hyper-v/supported-ubuntu-virtual-machines-on-hyper-v)); falls nicht: `-NoSecureBoot`.
- Ob cloud-init die Schnittstelle als `eth0` umbenennt; der Treffer läuft über die MAC, der Name ist nur kosmetisch.

## 3. Warum nicht zwei WSL-Distributionen

WSL 2 startet **eine** Hilfs-VM; alle Distributionen laufen darin als Container und teilen sich Netz, CPU, Kernel und Speicher ([Microsoft: What is WSL](https://learn.microsoft.com/windows/wsl/about#what-is-wsl-2)). Zwei Distributionen sind also kein zweiter Host; die Messung wäre ungültig.

## 4. CPU-Pinning

`Set-VMProcessor` kennt Anzahl, Reserve, Limit und Gewicht, **keine Affinität**. Das Skript setzt für den llm-host `-Reserve 100` und `-RelativeWeight 200`, für den app-host `-RelativeWeight 100`. CPU-Gruppen mit Affinität ([Resource Controls](https://learn.microsoft.com/windows-server/virtualization/hyper-v/manage/manage-hyper-v-cpugroups#isolating-vm-groups-to-specific-host-processors)) sind für Windows Server beschrieben; auf Windows 11 Pro **nicht verifiziert**. Im Protokoll als Abweichung zum Linux-Lauf vermerken.

## 5. Alternativen

- **Multipass** (Canonical, seit 1.17 mit neuem Windows-Treiber): feste IPs nur über ein manuelles Zusatznetz mit eigenem Netplan, unter Windows nicht dokumentiert; für unser festes Netz zweite Wahl (Recherche 2026-11-13).
- **VirtualBox**: auf Windows Home möglich; NAT-Network, Seed-ISO und Pinning **nicht geprüft**.
- **Windows Home**: kein Hyper-V; dann nur VirtualBox (ungeprüft) oder Pro.

## 6. Prüfung nach dem Start

`labor.ps1 -Mode pruefen` deckt Runbook §10 und §11 und die Negativtests ab. Von Hand zusätzlich: Vom **Handy oder zweiten Rechner im Heimnetz** muss `curl --max-time 5 http://192.168.150.20:8080/health` scheitern; `Get-NetRoute -DestinationPrefix 192.168.150.0/24` zeigt nur `vEthernet (arsnova-1b)`; `Get-VMSwitch` zeigt `arsnova-1b` als `Internal`.

## 7. Gültigkeitsgrenzen

- Absolute Zeiten sind zwischen Rechnern **nicht vergleichbar**; verglichen werden Verhältnisse und die Zerlegung innerhalb eines Rechners.
- Kein CPU-Pinning (Abschnitt 4): schwächere Isolation als unter Linux; im Protokoll ausweisen.
