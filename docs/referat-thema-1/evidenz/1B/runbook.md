# 1B-Labor: Nachbau und Lauf

Zwei VMs auf einem Rechner: app-host `192.168.150.10` (App aus `docker-compose.prod.yml`) und llm-host `192.168.150.20` (Runtime aus `docker-compose.llm.yml`). Entscheidungen: [ADR 1B-002](../../adr/1B-002-topologie-zwei-vms-ein-rechner.md) bis [ADR 1B-010](../../adr/1B-010-aufbau-automatisiert-mit-groessenempfehlung.md). Linux ist getestet. Windows läuft seit 2026-11-13 ohne WSL ([WINDOWS.md](vm/WINDOWS.md)); geprüft mit Pester und auf echtem Windows 11 bis kurz vor dem Start der VMs. Den Start unter Hyper-V selbst prüft erst der erste echte Aufbau, der von Niklas ([Windows-Test](2026-11-13-windows-test.md)).

## 1. Voraussetzungen

| Was             | Linux                                                                                                                    | Windows                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Rechner         | mindestens 16 GiB RAM und 2 physische Kerne; empfohlen 24 GiB und 4 Kerne                                                | dasselbe                                                                 |
| Virtualisierung | KVM (`/dev/kvm`), libvirt, `virt-install`, `qemu-img`, `xorriso`, `jq`; `labor.sh` nennt fehlende Pakete je Distribution | Windows 10/11 Pro, Education oder Enterprise mit Hyper-V; kein WSL nötig |
| Rechte          | Gruppe `libvirt`; sudo nur für ufw-Freigaben und das VM-Verzeichnis (fragt nach)                                         | Admin-PowerShell                                                         |
| Netz            | Internet für Ubuntu-Image, Pakete, Docker-Images und das GGUF (2,4 GiB)                                                  | dasselbe                                                                 |
| Strom           | Netzteil; Energieprofil siehe Abschnitt 4                                                                                | dasselbe                                                                 |

## 2. Aufbau

```bash
bash docs/referat-thema-1/evidenz/1B/labor.sh groessen   # nur Empfehlung ansehen
bash docs/referat-thema-1/evidenz/1B/labor.sh up         # alles aufbauen und prüfen
```

```powershell
powershell -ExecutionPolicy Bypass -File .\docs\referat-thema-1\evidenz\1B\labor.ps1 -Mode groessen
powershell -ExecutionPolicy Bypass -File .\docs\referat-thema-1\evidenz\1B\labor.ps1 -Mode up
```

`up` zeigt die Größenempfehlung für den Rechner und fragt, ob sie übernommen wird. Danach baut es die VMs, richtet den llm-host ein (Runtime-Image in lokaler Registry, GGUF prüfen oder laden, `.env.llm` mit Token nur in der VM, Wrapper-Prüfungen, Start), dann den app-host (App-Image, `.env.production`, Migrationen, Start), und prüft zuletzt alles. Ohne Rückfragen: `LAB_JA=1` bzw. `-Ja`. Dauer am ThinkPad P50 im Energiesparprofil: etwa 45 min, davon rund 20 min App-Build.

**Schutz für den Rechner** (_ergänzt 2026-11-13_): Vor dem Anlegen zeigt `up`, was es belegt und was dem Rechner bleibt, und **bricht ab, ohne etwas anzulegen**, wenn

- nach dem Start der VMs weniger als die RAM-Reserve frei bliebe (Standard 4 GiB; `LAB_RAM_RESERVE_GIB` bzw. `-RamReserveGB`, mindestens 2, kleiner nur auf Testrechnern ohne andere Programme), oder
- der freie Platz kleiner ist als der gemessene Bedarf (etwa 31 GiB) plus 10 GiB Reserve.

Unter Windows zählt der verfügbare RAM wie im Task-Manager (frei plus Cache), geprüft direkt vor dem Start der VMs. Läuft WSL oder Docker Desktop, belegen sie selbst RAM; vor `up` hilft `wsl --shutdown`.

| Belegt (Empfehlung bei 24 GiB RAM und mehr) | llm-host                         | app-host            | Hinweis                        |
| ------------------------------------------- | -------------------------------- | ------------------- | ------------------------------ |
| RAM (fest, solange die VM läuft)            | 12 GiB                           | 6 GiB               | knapp: 10 + 4 GiB              |
| vCPU                                        | physische Kerne, höchstens 8     | 2                   | ohne SMT bleiben 2 Kerne frei  |
| Platte (Obergrenze, dünn belegt)            | 20 GiB (real ~12)                | 25 GiB (real ~12)   | App-Build braucht kurz ~18 GiB |
| Last                                        | volle vCPUs nur während Inferenz | gering, außer Build | Leerlauf fast null             |

Eigene Größen: `LAB_LLM_VCPU`, `LAB_LLM_RAM_GIB`, `LAB_LLM_DISK_GIB`, `LAB_APP_…` bzw. `-LlmCpus`, `-LlmRamGB`, `-LlmDiskGB`, `-App…`; ohne `-Ja` fragt `up` sie einzeln ab und lehnt zu kleine Werte ab. Nach dem Build löschen beide VMs ihren Docker-Build-Cache (im app-host rund 6 GiB).

**Ein und aus:** `labor.sh stop` bzw. `labor.ps1 -Mode stop` fährt beide VMs herunter; dann belegen sie weder RAM noch CPU, Daten und Einrichtung bleiben. `start` fährt sie wieder hoch, wartet auf die Dienste und prüft alles.

Ergebnis: Aufbaubericht `~/labor-1b/aufbau-<Zeit>.txt` mit je einer Zeile `OK` oder `FEHLER` pro Prüfung. Erneut prüfen: `labor.sh pruefen`. `up` ist mehrfach aufrufbar; bestehende VMs mit anderer Größe lehnt es ab (dann `destroy`).

## 3. Lauf

Reihenfolge, jeweils vom Rechner aus:

1. Einen Prompt-Body erzeugen, falls noch keiner da ist: `LAB_TAG=dev-body LAB_N=1 LAB_PROFIL=unveraendert labor.sh lauf`.
2. Kalibrierung: `labor.sh kalibrierung` → I = `prompt_ms + predicted_ms` und Timeout (90 000 oder 300 000 ms; über 270 s Abbruch).
3. Probelauf: `LAB_TAG=probe LAB_N=2 labor.sh lauf`.
4. Gewerteter Lauf: `LAB_N=10 labor.sh lauf`.

Ohne `LAB_TIMEOUT_MS` nimmt `lauf` den Timeout aus der jüngsten Kalibrierung von heute und bricht ab, wenn deren Energieprofil nicht zum Lauf passt. Bricht ein Lauf ab, stoppt ein `trap` Mitschnitte und Speicherprotokoll; die Rohdaten bleiben im app-host unter `~/labor-1b/`.

Windows: `labor.ps1 -Mode kalibrierung`, `labor.ps1 -Mode lauf -LabN 10` usw.

Ein Lauf startet die Runtime frisch (höchstens 10 Aufträge je Runtime, [ADR 1B-007](../../adr/1B-007-umgang-mit-1c-fallen.md)), schneidet auf beiden Hosts mit, legt per Treiber eine Session mit dem 1C-Referenzszenario an (200 Teilnehmende über die API) und löst die Aufträge mit 31 s Abstand aus (Cooldown 30 s, sonst Cache). Danach Zeitzerlegung und Kontrolle C0 an einer frischen Runtime. Rohdaten: `~/labor-1b/<Lauf>/`; Ergebnis: `evidenz/1B/messung/<Datum>-lauf[-Tag].json` (nicht bei Tag `dev…` oder `probe…`; ein zweiter Lauf am selben Tag bekommt die Endung `-2`).

## 4. Energieprofil

`labor.sh lauf` hält unter Linux das Profil `performance` per `powerprofilesctl launch` und stellt es danach zurück, wie 1C. `LAB_PROFIL=unveraendert` lässt es wie es ist (nur Entwicklungsläufe). Das Ergebnis nennt das Profil. Kalibrierung und gewerteter Lauf brauchen dasselbe Profil. Windows ändert nichts und hält das aktive Schema fest.

**Windows, von Hand vor Kalibrierung und Lauf:** Energiemodus „Beste Leistung“ (Einstellungen → System → Netzbetrieb und Akku), Netzteil an, Windows Update für die Dauer pausieren (Einstellungen → Windows Update → Updates aussetzen). `labor.ps1` ändert beides nicht und hält nur das aktive Schema fest.

**Messruhe in den VMs:** Hintergrund-Updates (`apt-daily*`, `unattended-upgrades`, `fwupd-refresh` u. a.) schaltet das `user-data` unter Linux und Windows ab; `pruefen` meldet „Hintergrund-Updates aus“. Anlass: Am 2026-11-13 lief `apt-daily-upgrade` mitten im gewerteten Lauf in beiden VMs.

## 5. Rückbau

`labor.sh destroy` bzw. `labor.ps1 -Mode destroy`: VMs, Disks und Labornetz. Das Ubuntu-Image bleibt im VM-Verzeichnis liegen.

## 6. Stolperfallen

| Falle                                                                       | Abhilfe                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Aktive Host-ufw: VMs bekommen keine IP, kein ausgehendes NAT                | Freigabe nur auf `virbr-1b` für DHCP, DNS und Weiterleitung; `labor.sh` bietet sie an |
| Updates im Hintergrund während eines Laufs (VM oder Host)                   | VMs: `user-data` schaltet sie ab, `pruefen` prüft es; Host: siehe Abschnitt 4         |
| VM-Verzeichnis im Home (Modus 700): libvirt-qemu kann die Disks nicht lesen | `/var/lib/libvirt/images/arsnova-1b` (Standard)                                       |
| Runbook §6 `npm ci --omit=dev`: Produktionswrapper findet `dotenv` nicht    | `llm-start.sh` installiert ohne `--omit=dev` (Befund für das Ergebnis)                |
| Push großer Layer in `registry:2` läuft in einen Timeout                    | Wiederholung (bis 5 Versuche) in `llm-start.sh` und `app-start.sh`                    |
| Neubau des Runtime-Images ergibt einen anderen Digest                       | Digest je Lauf aus dem Ergebnis nehmen, nicht aus einem älteren Bericht               |
| Windows PowerShell 5.1 hängt beim Pipen CRLF an                             | `app-start.sh` entfernt `\r` am Token                                                 |
| Windows PowerShell 5.1 liest Skripte ohne BOM als ANSI                      | `.ps1`-Dateien sind reines ASCII                                                      |
| tcpdump gibt unter Ubuntu Rechte ab und kann nicht ins Home schreiben       | `tcpdump -Z labor`, Dateiendung `.pcap` (AppArmor)                                    |
| sudo ohne Terminal (`LAB_JA=1`) fragt kein Passwort ab                      | ufw-Schritt wird dann nur angezeigt; einmalig von Hand setzen                         |
| Lange Hintergrundjobs eines Agenten werden bei Speicherdruck beendet        | Aufbau und Schlafsperre als `systemd-run --user`-Unit starten                         |

## 7. Datenregeln

Mitschnitte enthalten den Runtime-Token im `Authorization`-Header und bleiben in `~/labor-1b`. Ins Repo kommen nur Ergebnis-JSON, Berichte ohne Secrets und Protokolle. Die Szenariodaten sind synthetisch (1C-Fixture).

## 8. Übergabe an Niklas (Schritte 3–4)

_Ergänzt 2026-11-13, aktualisiert am selben Tag._ Stand für Störversuche und Betriebsaufwand auf dem eigenen Rechner. Das Skript schützt den Rechner (Abschnitt 2): Reicht RAM oder Platz nicht, legt es nichts an und sagt, was zu tun ist.

**Vorbereitung (einmal):**

1. Repo aktualisieren, Branch `feature-1B-two-host` (bis zum Merge). Liegt der Clone in WSL unter `/mnt/d/…`, ist das unter Windows einfach `D:\…`; WSL selbst braucht das Labor nicht.
2. **PowerShell als Administrator** öffnen (Rechtsklick > „Als Administrator ausführen“) und in den Ordner `docs\referat-thema-1\evidenz\1B` des Clones wechseln, etwa `cd D:\<projekte>\arsnova.eu\docs\referat-thema-1\evidenz\1B` (ein Clone nur im WSL-Dateisystem geht auch über `\\wsl.localhost\Ubuntu\…`).
3. `powershell -ExecutionPolicy Bypass -File .\labor.ps1 -Mode vorpruefung`: fragt zuerst, wohin die VM-Disks sollen (zeigt den freien Platz je Laufwerk und empfiehlt das mit dem meisten, etwa `D:\arsnova-1b`; die Wahl gilt für alle späteren Aufrufe, ändern mit `-VmDir`), prüft dann alles, ändert nichts, und sagt zu jedem `FEHLER`, was zu tun ist. Typisch beim ersten Mal: Hyper-V ist aus. Dann denselben Befehl mit `-EnableHyperV` am Ende, Windows **neu starten**, Schritt 3 wiederholen.

**Aufbau:**

4. Vorher `wsl --shutdown` und Docker Desktop beenden: WSL 2 reserviert sich bis zur Hälfte des RAMs (im Task-Manager `VmmemWSL`), dann reicht er für die VMs nicht. Danach `powershell -ExecutionPolicy Bypass -File .\labor.ps1 -Mode up`: zeigt die Empfehlung und was dem Rechner bleibt, fragt einmal, dann läuft es allein (etwa 45–60 min; jeder Schritt mit `[n/11]`, Zeit seit Beginn und geschätzter Restzeit). Solange das Fenster offen ist, geht der Rechner nicht in den Ruhezustand; Netzteil anschließen. Wer erst sehen will, was angelegt wird: zuerst mit `-NurVorbereiten` (startet keine VM).
5. Bricht es ab, steht da, in welchem Schritt, warum und was zu tun ist, dazu der Pfad zum Log. Nach dem Beheben denselben Befehl erneut aufrufen; Fertiges wird übersprungen. Bei Fragen das Log schicken (enthält keine Tokens).
6. Am Ende muss der Bericht nur `OK`-Zeilen enthalten; ihn aus `%USERPROFILE%\labor-1b\` ins eigene Aufbauprotokoll übernehmen. Der Start der VMs unter Hyper-V läuft hier zum ersten Mal auf echter Hardware; jede Abweichung notieren.

**Danach:** zwischen den Sitzungen `.\labor.ps1 -Mode stop`, vorher wieder `-Mode start`. Vor Kalibrierung und Läufen Abschnitt 4 (Energiemodus, Windows Update pausieren). Eigene Läufe mit `-LabTag` (z. B. `stoerung-…`); ADR-Nummern 1B-020 bis 1B-039. Am Ende `-Mode destroy`: entfernt VMs, Disks, Switch und NAT; `C:\ProgramData\arsnova-1b` danach löschen, wenn auch Image und Laborschlüssel-Daten weg sollen. Hyper-V bleibt dabei an. Wer es wieder aus haben will (etwa für VirtualBox oder VMware): Admin-PowerShell `Disable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All`, neu starten. Während das Labor läuft, kein VPN mit „gesamten Verkehr tunneln“ verbinden: Dann erreicht der Rechner die VMs nicht mehr.

Wiederverwendbar für Schritt 3: `lauf.sh` (Mitschnitt auf beiden Hosts, Speicher-CSV, Zeitzerlegung), `pruefen.sh` (Limits, Flags, Bind) und der Treiber `treiber.mjs`. Die Runtime im llm-host lässt sich für Ausfälle mit `docker stop arsnova-open-weight-llm` bzw. `docker compose … up -d` steuern; die Werte aus Schritt 2 stehen unter `messung/`.
