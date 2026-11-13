# 1B: Windows-Test von `labor.ps1` (Teiltest)

Stand: 2026-11-13 · Rechner: ThinkPad P50 (i7-6820HQ, 4 Kerne/8 Threads, 31 GiB), Host-Kernel 7.2.11, libvirt/KVM · Prüfung durch den Autor: offen

Ziel (Plan, Nachtrag Task 12 Step 6): `labor.ps1` auf echtem Windows mit Hyper-V testen, in einer Windows-VM mit verschachtelter Virtualisierung. Skripte: [`vm/windows-test/`](vm/windows-test/).

## Aufbau

- Windows 11 Enterprise Evaluation (de-de, Build 26100), unbeaufsichtigt per `autounattend.xml`
- VM `arsnova-1b-win`: 4 vCPU (`host-passthrough`), 18 GiB RAM, 60 GB Disk, NAT-Netz 192.168.151.0/24
- `setup.ps1` nach dem ersten Login: OpenSSH-Server nur mit Schlüssel, Hyper-V, WSL-Grundlage, Neustart

## Verlauf

| Zeit (2026-11-12/13) | Ereignis                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| 22:29                | VM angelegt, Installation startet                                                               |
| 23:20                | `setup.ps1` startet (Transkript `C:\1b-setup.log`)                                              |
| 01:02                | OpenSSH aus Windows Update installiert (1 h 40 min), `setup.ps1` endet 01:04 und startet neu    |
| 01:04 –              | Windows startet mit aktivem Hyper-V nicht mehr: „Automatische Reparatur“                        |
| 01:25                | Ohne `evmcs` (und `avic`): gleiches Bild                                                        |
| 01:31                | Ohne `vmx` in der VM-CPU startet Windows normal; Ursache ist also der verschachtelte Hypervisor |
| 02:02                | SSH erst nach Freigabe der Firewall-Regel für alle Profile erreichbar (siehe Befunde)           |
| 02:05 – 02:30        | Teiltest von `labor.ps1` ohne laufenden Hypervisor                                              |

Zum Startabbruch passt ein Bericht über eine Regression ab Host-Kernel 7.2 (Windows-11-Gast mit verschachteltem Hyper-V startet nicht, mit 7.1.8 schon): [CachyOS-Forum](https://discuss.cachyos.org/t/windows-11-kvm-guest-with-nested-hyper-v-boot-loops-on-linux-cachyos-7-2-x-works-on-7-1-8/36134). Einzelbericht, nicht bestätigt; auf diesem Rechner ist nur Kernel 7.2 installiert, ein Gegentest mit 7.1 fehlt.

## Ergebnis Teiltest (PowerShell 5.1.26100, Commit `1c6cf6474bae`)

| Modus                   | Ergebnis                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `groessen -Ja`          | OK: 4 Kerne, 4 Threads, 17 GB erkannt; Empfehlung llm 2 vCPU/10 GB, app 2 vCPU/4 GB mit allen vier Hinweisen (knappe Stufe, ohne SMT Kerne−2) |
| `status`                | OK: Switch, NAT und beide VMs als „fehlt“ gemeldet                                                                                            |
| `pruefen`               | OK: Bericht geschrieben, SSH-Prüfungen und Switch scheitern erwartungsgemäß, NAT ohne Weiterleitung und gesperrter Port 8080 als OK           |
| `up -Ja` ohne Schlüssel | **Fehler gefunden:** `vm-windows.ps1` meldet „SSH-Schlüssel fehlt“, `labor.ps1` richtete trotzdem den llm-host ein (Befund W1)                |
| `up -Ja` nach Fix       | OK: bricht nach der Meldung von `vm-windows.ps1` ab                                                                                           |
| `up -Ja` mit Schlüssel  | OK: Speicherwarnung (35,8 GB frei), dann Abbruch „WSL startet keine Distribution“ mit Installationshinweis                                    |

Nicht getestet: VMs anlegen, WSL-Teil, `llm-start.sh`/`app-start.sh` über Windows, Kalibrierung und Lauf. Dafür braucht es einen laufenden Hypervisor in der Windows-VM.

## Befunde

- **W1 (behoben):** `vm-windows.ps1` meldet Fehler nur mit `exit 1`; `labor.ps1` prüfte den Exit-Code nicht. Jetzt wirft `Invoke-VmScript` bei Code ≠ 0, und `vm-windows.ps1` endet bei Erfolg mit `exit 0`. Pester-Test `Invoke-VmScript` (rot vor, grün nach dem Fix), alle 25 Pester-Tests grün.
- **W2 (behoben, nur Testaufbau):** Die Firewall-Regel des OpenSSH-Pakets gilt nur im Profil „Privat“, das NAT-Netz der VM ist „Öffentlich“. `setup.ps1` setzt die Regel jetzt auf alle Profile.
- **W3 (behoben, nur Testaufbau):** `ssh-keygen -N ""` über `cmd /c` scheiterte an der Quotierung; `win-test.sh` nutzt jetzt `-N '""'` (in der VM geprüft). Die Wartezeit auf SSH ist auf 240 min erhöht.
- **W4 (offen, klein):** Die Meldung von `wsl.exe` erscheint als UTF-16 mit Leerzeichen zwischen den Zeichen; nur Kosmetik.
