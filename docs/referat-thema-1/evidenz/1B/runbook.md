# 1B-Labor: Nachbau und Lauf

Zwei VMs auf einem Rechner: app-host `192.168.150.10` (App aus `docker-compose.prod.yml`) und llm-host `192.168.150.20` (Runtime aus `docker-compose.llm.yml`). Entscheidungen: [ADR 1B-002](../../adr/1B-002-topologie-zwei-vms-ein-rechner.md) bis [ADR 1B-010](../../adr/1B-010-aufbau-automatisiert-mit-groessenempfehlung.md). Linux ist getestet. Windows ist mit Pester geprüft und auf echtem Windows 11 (PowerShell 5.1) teilweise getestet: Größenwahl, `status`, `pruefen` und die Vorprüfungen von `up`. Ein Aufbau mit echtem Hyper-V steht noch aus ([Windows-Test](2026-11-13-windows-test.md)).

## 1. Voraussetzungen

| Was             | Linux                                                                                                                    | Windows                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Rechner         | mindestens 16 GiB RAM und 2 physische Kerne; empfohlen 24 GiB und 4 Kerne                                                | dasselbe                                                                 |
| Virtualisierung | KVM (`/dev/kvm`), libvirt, `virt-install`, `qemu-img`, `xorriso`, `jq`; `labor.sh` nennt fehlende Pakete je Distribution | Windows 10/11 Pro, Education oder Enterprise mit Hyper-V; WSL mit Ubuntu |
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

## 5. Rückbau

`labor.sh destroy` bzw. `labor.ps1 -Mode destroy`: VMs, Disks und Labornetz. Das Ubuntu-Image bleibt im VM-Verzeichnis liegen.

## 6. Stolperfallen

| Falle                                                                       | Abhilfe                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Aktive Host-ufw: VMs bekommen keine IP, kein ausgehendes NAT                | Freigabe nur auf `virbr-1b` für DHCP, DNS und Weiterleitung; `labor.sh` bietet sie an |
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

_Ergänzt 2026-11-13._ Stand für Störversuche und Betriebsaufwand auf dem eigenen Rechner:

1. Fork und Clone aktualisieren, Branch `feature-1B-two-host` (bis zum Merge).
2. Windows: Hyper-V und WSL mit Ubuntu einrichten ([WINDOWS.md](vm/WINDOWS.md)), SSH-Schlüssel ohne Passphrase anlegen. In Windows PowerShell 5.1 geht das leere Argument nur so: `ssh-keygen -t ed25519 -N '""' -f "$env:USERPROFILE\.ssh\id_ed25519"`.
3. `labor.ps1 -Mode groessen`, dann `-Mode up` in einer Admin-PowerShell. Bitte jede Abweichung notieren: Der Hyper-V-Teil (VMs, NAT, WSL zum internen Switch) ist der ungetestete Rest.
4. `-Mode pruefen` muss nur `OK`-Zeilen liefern; den Bericht aus `%USERPROFILE%\labor-1b\` ins eigene Aufbauprotokoll übernehmen.
5. Eigene Läufe mit `-LabTag` (z. B. `stoerung-…`), damit sie nicht mit den Läufen von Jonas kollidieren; ADR-Nummern 1B-020 bis 1B-039.

Wiederverwendbar für Schritt 3: `lauf.sh` (Mitschnitt auf beiden Hosts, Speicher-CSV, Zeitzerlegung), `pruefen.sh` (Limits, Flags, Bind) und der Treiber `treiber.mjs`. Die Runtime im llm-host lässt sich für Ausfälle mit `docker stop arsnova-open-weight-llm` bzw. `docker compose … up -d` steuern; die Werte aus Schritt 2 stehen unter `messung/`.
