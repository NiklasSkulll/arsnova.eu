# 1B Schritte 1–2 (Zwei-Host-Deployment, echter Summary-Auftrag) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zwei KVM-VMs auf dem Laptop als App-Host und Inferenz-Host nach Release 1.3 aufbauen, gegen ADR-0035 und Runbook abgleichen und einen echten Summary-Auftrag in Netz-, Adapter- und Inferenzzeit zerlegen.

**Architecture:** cloud-init richtet zwei Ubuntu-VMs nach dem Zweit-Host-Runbook ein; die Release-Compose-Dateien laufen darin, die Runtime mit einer CPU-Override. Ein Node-Treiber löst über die echte App per tRPC einen Summary-Auftrag mit der 1C-Referenzfixture aus. `tcpdump` auf beiden VMs, die `timings` der Runtime und die App-Logzeile `qa_summary:completed` ergeben die Zeitzerlegung; jede Differenz stammt von einem Rechner.

**Tech Stack:** libvirt/QEMU (`virt-install`, cloud-init NoCloud), Ubuntu LTS-Cloud-Image, Docker Compose, `ufw`, `tcpdump`/`tshark`, Node 22 (`node:test`), Bash.

**Spec:** [`2026-11-12-1b-zwei-host-design.md`](2026-11-12-1b-zwei-host-design.md) (freigegeben 2026-11-12, Commit `ea407f04`). Abschnittsnummern wie „Design 3.4“ beziehen sich darauf.

## Global Constraints

- Produktionscode bleibt unverändert (`apps/`, `libs/`, `docker/`, `docker-compose*.yml`, `scripts/open-weight-llm/`). Neue Dateien nur unter `docs/referat-thema-1/`.
- Release-Dateien werden auch im Checkout der VMs nicht editiert; Abweichungen nur über Dateien unter `docs/referat-thema-1/evidenz/1B/`.
- Keine Tokens, Passwörter, `.env`-Inhalte, Paketmitschnitte (`.pcap`) oder Rohbodies mit Bearer-Header im Repo. Rohdaten nach `LAB_OUTDIR` (Standard `~/labor-1b`), nie einchecken.
- Runtime: `mem_limit 8g`, `memswap_limit 10g` unverändert; `cpus: '4.0'`, `OPEN_WEIGHT_LLM_THREADS: '4'` per Override.
- Timeout-Regel (Design 3.4, Muster Labor-Design 1C 14.3): Kalibrierung I = `prompt_ms + predicted_ms`; I ≤ 75 s → 90 000 ms (Release); 75 s < I ≤ 270 s → 300 000 ms für `QA_SUMMARY_TIMEOUT_MS` und `OPEN_WEIGHT_LLM_SUMMARY_TIMEOUT_MS`; I > 270 s → kein gewerteter Lauf, Autor entscheidet.
- Gewerteter Lauf: n = 10 Aufträge, eine Reihe, frisch gestartete Runtime, nach genau einer nicht gewerteten Kalibrierungsanfrage; Speicher des Runtime-Containers im 15-s-Takt.
- Schwellen (Design 6): H_B1 Netz Median ≤ 50 ms und Maximum ≤ 200 ms je Auftrag (beide Anfragen); H_B2 Adapter Median ≤ 2 s; H_B3 T_infer ≥ 95 % von T_job im Median.
- Erwarteter Endstatus: `ready` / `extractive` / `invalid_response`.
- Netz: VMs eingehend nicht von außen erreichbar (kein Bridging, keine Portweiterleitung), ausgehendes NAT erlaubt.
- Läufe und Paketinstallationen am Laptop (sudo) nur nach Rückfrage beim Autor; er führt sudo-Befehle selbst mit `! <befehl>` aus.
- ADR-Nummern `1B-001…019`. Doku Deutsch, kurz; jede Zahl mit Rechner und Commit; Protokolle nach dem Einfrieren unverändert.
- Commits Englisch, Conventional Commits, ohne KI-Attribution, nie `--no-verify`. Markdown: `npx prettier --check <dateien>` und `git diff --check`.

## Review Focus

- **Keep-Alive im Mitschnitt:** Der Client kann `GET /slots` und `POST` über dieselbe TCP-Verbindung schicken; die Zerlegung muss Anfragen innerhalb eines Streams trennen (Test in Task 2).
- **Segmentierter POST-Body (~30 KB):** Anfragebeginn ist das erste Segment mit Nutzdaten, nicht der HTTP-Frame von `tshark` (Test in Task 2).
- **Auftrag ohne Modellantwort** (Timeout, 503, Abbruch): Die Zerlegung darf keine Inferenzzeit erfinden; `tInferMs` ist dann `null`, der Auftrag zählt nicht für H_B3 (Test in Task 2).
- **Abgleich Log ↔ Mitschnitt:** Weichen die Anzahl der `qa_summary:completed`-Zeilen und der POST-Austausche ab, bricht die Auswertung mit Fehler ab statt still zu paaren (Test in Task 2).
- **Docker-NAT:** Am Inferenz-Host erscheint die App als IP des app-hosts; die `ufw`-Regel muss genau diese IP erlauben (Prüfung in Task 4, Beleg per Mitschnitt in Task 5).

---

## Dateistruktur

| Datei                                                   | Verantwortung                                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `evidenz/1B/vm/netz.xml`                                | libvirt-Netz `arsnova-1b`: NAT ausgehend, privates /24, statische IPs                             |
| `evidenz/1B/vm/app-host.user-data.yaml`                 | cloud-init des app-hosts (Docker, Node 22, Repo-Stand, tcpdump/tshark)                            |
| `evidenz/1B/vm/llm-host.user-data.yaml`                 | cloud-init des llm-hosts (Docker, Node 22, `ufw`, Repo-Stand, lokale Registry, tcpdump/tshark)    |
| `evidenz/1B/vm/vm-linux.sh`                             | Startschicht Linux: Netz, Image, Seeds, `virt-install` mit CPU-Pinning, `destroy`                 |
| `evidenz/1B/vm/WINDOWS.md`                              | Startschicht Windows (ungetestet, Niklas prüft)                                                   |
| `evidenz/1B/llm-vm.override.yml`                        | Override: `cpus: '4.0'`, `OPEN_WEIGHT_LLM_THREADS: '4'`                                           |
| `evidenz/1B/llm-start.sh`                               | im llm-host: Wrapper-Prüfungen per Trockenlauf, dann Start mit Override                           |
| `evidenz/1B/treiber.mjs`                                | Referenzszenario über tRPC anlegen, Summary anfordern, Ergebnis abholen                           |
| `evidenz/1B/lauf.sh`                                    | vom Laptop: `kalibrierung` und `lauf` (Mitschnitte, Speicherlog, Treiber, Einsammeln, Auswertung) |
| `evidenz/1B/messung/zeitzerlegung.mjs`                  | Mitschnitt-Felder plus App-Log → Zeitzerlegung je Auftrag und Kennzahlen                          |
| `evidenz/1B/messung/zeitzerlegung.test.mjs`             | `node:test` mit synthetischen Eingaben                                                            |
| `evidenz/1B/runbook.md`                                 | Nachbau Schritt für Schritt (Linux), Verweis auf `WINDOWS.md`                                     |
| `evidenz/1B/<DATUM>-aufbau.md`                          | Protokoll Schritt 1 mit Abgleichtabelle                                                           |
| `evidenz/1B/<DATUM>-lauf.md`                            | Protokoll Schritt 2                                                                               |
| `adr/1B-001…009-*.md`, `adr/README.md`                  | Entscheidungen                                                                                    |
| `1B-ergebnis.md`, `1B-diagrams.md`, `1B-eigenanteil.md` | Hauptdokument, Belegtabelle mit Zeilennummern, Eigenanteil je Person                              |
| `AGENTS.md`, `01-aufteilung.md`, `README.md` (Ordner)   | Netzregel, PR-Reihenfolge, Dateiübersicht                                                         |

Alle Pfade relativ zu `docs/referat-thema-1/`.

---

### Task 1: Vorab-Festlegungen als ADRs und Ordnerregeln

Muss vor jedem Lauf committet sein (Nachweiskette).

**Files:**

- Create: `adr/1B-001-baseline-fork-main-a19ca70f.md`, `adr/1B-002-topologie-zwei-vms-ein-rechner.md`, `adr/1B-003-laborregel-virtuelles-netz.md`, `adr/1B-004-summary-auftrag-referenzfixture.md`, `adr/1B-005-abweichungen-vom-release.md`, `adr/1B-006-zeitmessung-per-mitschnitt.md`, `adr/1B-007-umgang-mit-1c-fallen.md`, `adr/1B-008-kernaussagen-und-schwellen.md`, `adr/1B-009-portabilitaet-linux-windows.md`
- Modify: `adr/README.md`, `AGENTS.md` (Regel „Laborinstanzen“), `01-aufteilung.md`, `README.md`

**Interfaces:**

- Produces: ADR-Dateinamen oben (alle späteren Dokumente verlinken sie).

- [ ] **Step 1:** ADRs im Format von `adr/1C-001-baseline-aktueller-main.md` schreiben (Status, Kategorie, Kontext, Entscheidung, Alternativen, Belege, Folgen). Inhalte aus Design 3.1 (002, mit verworfenen Alternativen), 3.3 (003), 4 (004), 3.4 (005, Tabelle verlinken statt kopieren), 5 (006), 7 (007), 6 (008, Schwellen exakt aus Global Constraints), 3.2 (009). 001 begründet `a19ca70f` nach 1C-001 mit Verweis auf die Prüfer-Mail. Status jeweils „methodisch (2026-11-12)“, Kategorie Methodik.
- [ ] **Step 2:** `AGENTS.md` des Ordners: Zeile „Laborinstanzen nur auf `127.0.0.1`.“ ersetzen durch den Wortlaut aus Design 3.3 mit Link auf ADR 1B-003. Wurzel-`AGENTS.md` nicht anfassen.
- [ ] **Step 3:** `01-aufteilung.md`: datierten Abschnitt „1B: zwei PRs nacheinander (Vorschlag, mit Niklas abzustimmen)“ ergänzen: Jonas Schritte 1–2 zuerst, Niklas zweigt nach dem Merge ab; ADR-Kreise 1B-001…019 / 1B-020…039; Niklas nutzt die Dateien, nicht die Geräte; Windows-Weg in `evidenz/1B/vm/WINDOWS.md`.
- [ ] **Step 4:** `adr/README.md` und Ordner-`README.md` um die neuen Dateien ergänzen.
- [ ] **Step 5:** Prüfen: `npx prettier --check docs/referat-thema-1/adr/1B-*.md docs/referat-thema-1/AGENTS.md docs/referat-thema-1/01-aufteilung.md docs/referat-thema-1/README.md docs/referat-thema-1/adr/README.md && git diff --check` → keine Ausgabe außer „All matched files use Prettier code style!“.
- [ ] **Step 6:** Commit `docs(referat): record the 1B step 1-2 decisions before any run`.

---

### Task 2: Zeitzerlegung (TDD)

**Files:**

- Create: `evidenz/1B/messung/zeitzerlegung.mjs`, `evidenz/1B/messung/zeitzerlegung.test.mjs`

**Interfaces:**

- Consumes: nichts.
- Produces:
  - Eingabe `Frame = { t: number /* Sekunden, frame.time_epoch */, stream: number, fromClient: boolean, payloadBytes: number, method: string|null, uri: string|null, status: number|null }` (eine Zeile der `tshark`-Feldausgabe).
  - `parseTsharkFields(text: string, clientIp: string): Frame[]` — Eingabe ist die tab-getrennte Ausgabe von `tshark -r <pcap> -T fields -E separator=/t -e frame.time_epoch -e tcp.stream -e ip.src -e tcp.len -e http.request.method -e http.request.uri -e http.response.code`.
  - `exchanges(frames: Frame[]): Exchange[]` mit `Exchange = { stream, method, uri, status, tStart, tEnd, wireMs }`; `tStart` = erstes Client-Segment mit `payloadBytes > 0` nach dem Ende des vorigen Austauschs im selben Stream, `tEnd` = Frame mit `status !== null`; `wireMs = (tEnd − tStart) · 1000`.
  - `parseCompletedLog(text: string): { latencyMs: number, status: string, effectiveMode: string, fallbackReason: string|null }[]` — liest Zeilen mit `qa_summary:completed` aus `docker logs` der App (JSON-Felder wie in `processJob`, `qaSummaryQueue.ts`).
  - `zerlegeAuftraege({ appExchanges, srvExchanges, completed, timings }): Auftrag[]` mit `timings: ({ prompt_ms, predicted_ms, cache_n } | null)[]` in POST-Reihenfolge und `Auftrag = { netzMs, adapterMs, inferMs|null, serverOhneInferenzMs|null, jobMs, cacheN|null, status, effectiveMode, fallbackReason }`. Paarung: je Auftrag ein `GET /slots?fail_on_no_slot=1` und ein `POST /v1/chat/completions` in Reihenfolge; `netzMs` = Σ(app.wireMs − srv.wireMs) über beide; `adapterMs` = `jobMs − Σ app.wireMs`; `inferMs` = `prompt_ms + predicted_ms`; `serverOhneInferenzMs` = srv.wireMs(POST) − `inferMs`.
  - `kennzahlen(auftraege: Auftrag[]): { n, netz: {medianMs, maxMs}, adapter: {medianMs}, inferAnteilMedian, hB1: boolean, hB2: boolean, hB3: boolean }` mit den Schwellen aus Global Constraints; `inferAnteilMedian` = Median von `inferMs / jobMs` über Aufträge mit `inferMs !== null`.
  - CLI: `node zeitzerlegung.mjs --app <app.tsv> --srv <srv.tsv> --log <app.log> --timings <timings.json> --app-ip <ip> --out <ergebnis.json>`.

- [ ] **Step 1: Failing tests schreiben** (`node:test`, `assert/strict`), synthetische Eingaben im Test:
  - `exchanges trennt zwei Anfragen in einem Keep-Alive-Stream`: Stream 0 mit GET (1 Segment) → 200, dann POST (3 Segmente) → 200 ergibt zwei Exchanges mit korrektem `tStart` des POST (erstes POST-Segment, nicht der HTTP-Frame).
  - `zerlegeAuftraege rechnet Netz, Adapter und Inferenz`: app GET 2,0 ms / srv 1,5 ms, app POST 200 010 ms / srv 200 000 ms, `timings` 150 000 + 49 000, `jobMs` 200 600 → `netzMs` 10,5, `adapterMs` 588, `inferMs` 199 000, `serverOhneInferenzMs` 1 000.
  - `Auftrag ohne Modellantwort hat inferMs null`: POST-Status 503, `timings` `null` → `inferMs === null`; `kennzahlen` ignoriert ihn für H_B3.
  - `Anzahl Log-Zeilen und POSTs muss übereinstimmen`: 2 Logzeilen, 1 POST → wirft `Error` mit Text, der beide Zahlen nennt.
  - `kennzahlen wendet die Schwellen an`: Netz-Median 50 → `hB1` true, Maximum 201 → `hB1` false; Adapter-Median 2000 → `hB2` true; Anteil 0,95 → `hB3` true.
  - `parseCompletedLog liest nur qa_summary:completed`: Logtext mit einer `qa_summary:failed`- und einer `completed`-Zeile → genau ein Eintrag mit `latencyMs`.
- [ ] **Step 2:** `node --test docs/referat-thema-1/evidenz/1B/messung/` → FAIL (Modul fehlt).
- [ ] **Step 3:** Funktionen und CLI in `zeitzerlegung.mjs` implementieren (nur `node:`-Module, keine Abhängigkeiten). Median: bei gerader Anzahl Mittel der beiden mittleren Werte.
- [ ] **Step 4:** `node --test docs/referat-thema-1/evidenz/1B/messung/` → alle PASS.
- [ ] **Step 5:** Commit `test(referat): add the 1B time decomposition with tests`.

---

### Task 3: VMs unter Linux

**Vorab beim Autor fragen:** Installation von `libvirt`, `qemu-base` (oder `qemu-full`), `virt-install`, `dnsmasq`, `cdrkit` oder `xorriso` per `! sudo pacman -S …`, `! sudo systemctl enable --now libvirtd`, Nutzer in Gruppe `libvirt`. Ohne Freigabe nicht weiter.

**Files:**

- Create: `evidenz/1B/vm/netz.xml`, `evidenz/1B/vm/app-host.user-data.yaml`, `evidenz/1B/vm/llm-host.user-data.yaml`, `evidenz/1B/vm/vm-linux.sh`

**Interfaces:**

- Produces: libvirt-Netz `arsnova-1b` (`192.168.150.0/24`, NAT, Gateway `.1`), VMs `arsnova-1b-app` (`192.168.150.10`, 2 vCPU, 6 GiB) und `arsnova-1b-llm` (`192.168.150.20`, 4 vCPU, 12 GiB, 30 GB Disk), SSH-Zugang als Nutzer `labor` mit dem Schlüssel aus `LAB_SSH_KEY` (Standard `~/.ssh/id_ed25519.pub`). Aufruf: `vm-linux.sh up|status|destroy`.

- [ ] **Step 1:** `netz.xml`: `<forward mode='nat'/>`, DHCP-Hosts mit festen MACs/IPs für beide VMs, kein `<bridge>` an eine physische Schnittstelle.
- [ ] **Step 2:** cloud-init beider VMs: Nutzer `labor` mit SSH-Schlüssel (Platzhalter, den `vm-linux.sh` einsetzt), Pakete `docker.io` oder Docker aus dem offiziellen APT-Repo wie Runbook §4.2, Node 22 wie §4.3, `tcpdump`, `tshark`, `chrony`; Checkout des Repos auf den Commit aus `LAB_COMMIT` (Standard: aktueller `HEAD` des Laptops, über `git bundle` in die VM kopiert, damit kein Netzwerkzugriff auf GitHub nötig ist). llm-host zusätzlich: `ufw` nach Runbook §5 mit `APP_PRIVATE_IP=192.168.150.10`, `LLM_PRIVATE_IP=192.168.150.20`.
- [ ] **Step 3:** `vm-linux.sh up`: Ubuntu-LTS-Cloud-Image laden (SHA256 gegen die `SHA256SUMS` der Quelle prüfen), Disks als qcow2-Overlay, NoCloud-Seed-ISOs bauen, `virt-install --import` mit `--cpuset`/`--cputune`: llm-host vCPU 0–3 → physische CPUs 0–3, app-host vCPU 0–1 → CPUs 4–5 (vor dem Pinning mit `lscpu -e` die Hyperthread-Paare prüfen und im Skript-Kommentar festhalten; zuordnen so, dass llm je einen Thread jedes physischen Kerns hat). `status`: IPs, SSH erreichbar, `docker version`. `destroy`: VMs, Disks, Netz entfernen.
- [ ] **Step 4:** Verifizieren: `vm-linux.sh up && vm-linux.sh status` → beide VMs per SSH erreichbar, `docker version` ohne Fehler; vom Laptop `ip route` zeigt `192.168.150.0/24` nur auf `virbr`-Schnittstelle; in den VMs `curl -sI https://deb.debian.org` erfolgreich (ausgehendes NAT).
- [ ] **Step 5:** Commit `feat(referat): add the 1B lab VMs for Linux`.

---

### Task 4: Inferenz-Host einrichten und Runbook §10 prüfen

**Files:**

- Create: `evidenz/1B/llm-vm.override.yml`, `evidenz/1B/llm-start.sh`

**Interfaces:**

- Consumes: VM `arsnova-1b-llm` aus Task 3.
- Produces: laufender Container `arsnova-open-weight-llm` auf `192.168.150.20:8080`; `llm-start.sh` (im llm-host aus dem Repo-Checkout aufzurufen) mit Ausgabe des verwendeten Image-Digests; Token liegt nur in `/home/labor/arsnova.eu/.env.llm` (Modus 600).

- [ ] **Step 1:** Runtime-Image in der VM nach Runbook Anhang A bauen, in eine lokale Registry (`registry:2`, nur an `127.0.0.1:5000` gebunden) pushen, Digest-Referenz `127.0.0.1:5000/arsnova-open-weight-llm@sha256:…` ablesen. Weg als Befund für C notieren.
- [ ] **Step 2:** GGUF vom Laptop per `scp` nach `/srv/arsnova/models/open-weight-llm/` kopieren (Quelle aus 1C, Pfad beim Autor erfragen), `node scripts/open-weight-llm/verify-model.mjs docker/open-weight-llm/model-manifest.json <gguf>` → Exit 0.
- [ ] **Step 3:** `.env.llm` aus `.env.llm.example` nach Runbook §8.2–8.3 schreiben (Token in der VM erzeugt, `OPEN_WEIGHT_LLM_BIND_ADDRESS=192.168.150.20`).
- [ ] **Step 4:** `llm-vm.override.yml`: nur `services.open-weight-llm.cpus: '4.0'` und `environment.OPEN_WEIGHT_LLM_THREADS: '4'`. `llm-start.sh`: (1) `node scripts/open-weight-llm/prod-compose.mjs --dry-run up -d` — prüft Digest, Bind, Token, GGUF per Wrapper, ohne zu starten (vorher prüfen, dass die installierte Compose-Version `--dry-run` an dieser Stelle annimmt; falls nicht, die Prüfungen über `create --no-start` auslösen und den Abbruch durch `cpus` dokumentieren), (2) `docker compose -f docker-compose.llm.yml -f docs/referat-thema-1/evidenz/1B/llm-vm.override.yml --env-file .env.llm --profile llm up -d`, (3) warten bis `healthy`.
- [ ] **Step 5:** Runbook §10 im llm-host ausführen und Ausgaben für das Aufbauprotokoll sichern (ohne Token): `ss -ltnp` zeigt `192.168.150.20:8080` und kein `0.0.0.0:8080`; `docker inspect` zeigt `Memory` 8589934592, `MemorySwap` 10737418240, `NanoCpus` 4000000000; §10.2 Auth (ohne Token 401, falscher Token 401, `/health` 200); §10.3 Testinferenz → 200 mit `timings`.
- [ ] **Step 6:** Commit `feat(referat): start the 1B inference host with the CPU override`.

---

### Task 5: App-Host einrichten, Verbindung und Negativtests

**Files:**

- Modify: keine Repo-Dateien außer Notizen für das Protokoll (Task 6).

**Interfaces:**

- Consumes: Task 3, Task 4 (IP, Token aus `.env.llm` des llm-hosts per `ssh` direkt in die `.env.production` des app-hosts, nie über den Laptop-Datei-Speicher).
- Produces: App unter `http://192.168.150.10:3000` nur innerhalb der VM bzw. per SSH-Tunnel vom Laptop (`ssh -L 3000:127.0.0.1:3000 labor@192.168.150.10`); `.env.production` mit `OPEN_WEIGHT_LLM_ENABLED=true`, `OPEN_WEIGHT_LLM_URL=http://192.168.150.20:8080`, `QA_SUMMARY_ENABLED=true`, Timeouts noch Release (90 000).

- [ ] **Step 1:** App-Image in der VM bauen, in eine lokale Registry pushen, `ARSNOVA_IMAGE` als Digest setzen (Befund für C).
- [ ] **Step 2:** `.env.production` aus `.env.production.example` mit Laborwerten und den Werten oben; Profile `nlp`, `encoder`, `llm` nicht starten; `docker compose -f docker-compose.prod.yml --env-file .env.production up -d` → `app` healthy (`wget -qO- http://localhost:3000/trpc/health.check` im Container).
- [ ] **Step 3:** Runbook §11 vom app-host: `curl` gegen `/health` und `/slots` mit Token → 200; im llm-host per `tcpdump` belegen, dass die App-Anfrage mit Quell-IP `192.168.150.10` ankommt (Docker-NAT).
- [ ] **Step 4:** Negativtests: vom **Laptop** `curl --max-time 5 http://192.168.150.20:8080/health` → scheitert (Zeitüberschreitung oder abgewiesen durch `ufw`); aus dem Heimnetz ist das Netz nicht geroutet (Begründung: NAT-Netz, kein Bridge; `ip route` des Laptops dokumentieren).
- [ ] **Step 5:** Kein Commit (nur VM-Zustand); Ausgaben ohne Secrets in `LAB_OUTDIR` sichern.

---

### Task 6: Aufbauprotokoll mit Abgleichtabelle (Schritt 1)

**Files:**

- Create: `evidenz/1B/<DATUM>-aufbau.md`

**Interfaces:**

- Consumes: Ausgaben aus Tasks 4–5.

- [ ] **Step 1:** Protokoll mit Kopf wie `evidenz/1C/2026-11-05-labor.md` (Gerät, Commit, Datum, Prüfung durch den Autor). Komponententabelle App-Adapter / Encoder / LLM-Server (Ort, Zweck, Transport, Authentisierung) am Stand des Laufs.
- [ ] **Step 2:** Abgleichtabelle: je Zeile eine Anforderung aus ADR-0035 (§2.1, §2.2, §2.6, §2.7, Umsetzungsleitplanken) und Runbook §17, Status `erfüllt` / `abweichend` / `nicht prüfbar`, Prüfbefehl, Beleg. Ausdrücklich ausweisen, welche Wrapper-Prüfungen gelaufen sind (Design 3.4). Manifest-Tabelle (Dossier 3.8) mit Digests am Stand des Laufs.
- [ ] **Step 3:** Abschnitt „Befunde für Kernaussage C“: Image-Digests nicht im Repo, Weg über lokale Registry, Lücken im Runbook (z. B. fehlendes Kommando für den Dritthost-Negativtest).
- [ ] **Step 4:** Abweichungen, die beim Bauen auftauchten und nicht in Design 3.4 stehen, als datierten Nachtrag ans Design anhängen.
- [ ] **Step 5:** Prettier + `git diff --check`; Commit `docs(referat): record the 1B two-host setup and its ADR-0035 check`.

---

### Task 7: Treiber für den Summary-Auftrag

**Files:**

- Create: `evidenz/1B/treiber.mjs`

**Interfaces:**

- Consumes: `createHttpTrpcSingle` aus `scripts/load/lib/trpc-runtime.mjs`, `configureQaSessionIfNeeded` aus `scripts/load/lib/configure-qa-if-needed.mjs` (Muster: `createQaSession` in `scripts/load/qa-classroom-30.mjs`); Texte, Stimmen und Status aus `MODERATION_PROMPT_REFERENCE_TEXT_FIXTURE_V1` und `MODERATION_PROMPT_REFERENCE_RANKING_FIXTURE_V1` (Fundort per Serena `find_symbol` bestimmen, gebaute `@arsnova/shared-types` importieren oder Werte zur Laufzeit lesen, nicht abschreiben).
- Produces: `node treiber.mjs --trpc <url> --auftraege <n> --out <datei.json>`: legt **eine** Session mit dem Referenzszenario an (Frage X von Teilnehmer X, Stimmen wie `createReferenceScenario` in `qa-summary-pg-fixture.ts`, danach Referenzstatus), löst dann `n`-mal nacheinander `qa.requestSummary` aus und wartet je bis Endstatus über `qa.summaryRuntime`; schreibt je Auftrag `{ index, requestedAt, finishedAt, hostReturnMs, status, effectiveMode, fallbackReason }`. Keine Tokens in der Ausgabe.

- [ ] **Step 1:** Prüfen, wie ein zweiter Auftrag auf derselben Session ohne Inhaltsänderung ausgelöst werden kann (Cooldown, `snapshotHash`, Cache in `qaSummaryQueue.ts`). Wenn ein zweiter Auftrag nur aus dem Cache kommt, je Auftrag eine neue Session anlegen und das im Protokoll begründen.
- [ ] **Step 2:** Teilnehmerzahl wie Standard der Fixture (200). Wenn Rate-Limits des Releases die Anlage über eine IP blockieren, Lauf stoppen und dem Autor melden (keine Limits still ändern).
- [ ] **Step 3:** Trockenlauf gegen den app-host mit `OPEN_WEIGHT_LLM_ENABLED=false`: `node treiber.mjs --trpc http://127.0.0.1:3000/trpc --auftraege 1 --out ~/labor-1b/trockenlauf.json` → ein Auftrag mit Endstatus `ready`, `effectiveMode` `extractive`. Danach Flag zurück auf `true`, App neu starten.
- [ ] **Step 4:** Commit `feat(referat): add the 1B summary driver for the reference scenario`.

---

### Task 8: Laufskript und Kalibrierung

**Files:**

- Create: `evidenz/1B/lauf.sh`

**Interfaces:**

- Consumes: Tasks 2, 4, 5, 7.
- Produces: `lauf.sh kalibrierung` (eine nicht gewertete Anfrage per `curl -w` im llm-host mit einem echten Completion-Body aus einem Mitschnitt des Trockenlaufs; gibt nur `prompt_ms`, `predicted_ms`, I und den gewählten Timeout nach der Regel aus Global Constraints aus) und `lauf.sh lauf` (Ablauf Step 2). Umgebungsvariablen: `LAB_OUTDIR` (`~/labor-1b`), `LAB_TAG`, `LAB_N` (10). Hülle wie `evidenz/1C/labor-lauf.sh`: `systemd-inhibit` und Energieprofil `performance`.

- [ ] **Step 1:** `lauf`: Runtime frisch starten (`llm-start.sh` nach `down`), Timeouts in `.env.production` des app-hosts setzen und App neu starten, `tcpdump -i <if> -w … host 192.168.150.20 and port 8080` auf beiden VMs starten, Speicherlog des Runtime-Containers alle 15 s (CSV `zeit,mem_bytes,restarts,oom_killed`), Treiber mit `LAB_N`, Mitschnitte stoppen, `tshark`-Felder je VM exportieren, `docker logs` der App holen, `timings` aus den POST-Antworten des app-seitigen Mitschnitts extrahieren (nur `prompt_ms`, `predicted_ms`, `cache_n`), `zeitzerlegung.mjs` aufrufen, danach Kontrolle C0 (Design 5): den POST-Body des ersten Auftrags einmal per `curl -w '%{time_starttransfer} %{time_total}'` im llm-host an `192.168.150.20:8080` senden und Gesamtzeit sowie `timings` ins Ergebnis übernehmen (zählt nicht zu n), Ergebnis-JSON nach `evidenz/1B/messung/<DATUM>-lauf[-TAG].json`. Mitschnitte und Logs bleiben in `LAB_OUTDIR`.
- [ ] **Step 2:** **Autor fragen**, dann `lauf.sh kalibrierung` ausführen. Ergebnis (I, Timeout) im späteren Laufprotokoll festhalten. I > 270 s → stoppen, Autor entscheidet.
- [ ] **Step 3:** **Autor fragen**, dann Probelauf `LAB_TAG=probe LAB_N=2 lauf.sh lauf` → Ergebnis-JSON mit 2 Aufträgen, `zeitzerlegung.mjs` ohne Fehler; Probelauf zählt nicht.
- [ ] **Step 4:** Commit `feat(referat): add the 1B run script`.

---

### Task 9: Gewerteter Lauf und Laufprotokoll (Schritt 2)

**Files:**

- Create: `evidenz/1B/<DATUM>-lauf.md`, `evidenz/1B/messung/<DATUM>-lauf.json`, `evidenz/1B/messung/<DATUM>-speicher.csv`

- [ ] **Step 1:** **Autor fragen**, dann `lauf.sh lauf` (n = 10).
- [ ] **Step 2:** Protokoll: Umgebung (Gerät, VM-Größen, Pinning, Commit, Digests), Kalibrierung, Ablauf, Abweichungen vom Ablauf, Tabelle je Auftrag (Netz, Adapter, Inferenz, Server ohne Inferenz, Job, `cache_n`, Endstatus), Kennzahlen, Bewertung H_B1–H_B3 nach Design 6 (Netz in ms als Hauptwert), Kontrolle C0, Speicherverlauf, Gültigkeitsgrenzen (Design 8). Kein OOM erwartet; trat einer auf, als Befund.
- [ ] **Step 3:** Befund C ergänzen: je Zeitkomponente sichtbar im Release-Betrieb ja/nein (nur `latencyMs` im Log; `timings`/`elapsedMs` werden verworfen — Stellen per Serena am Laufstand belegen).
- [ ] **Step 4:** Prettier + `git diff --check`; Commit `docs(referat): record the 1B scored summary run`.

---

### Task 10: Windows-Weg und Nachbau-Runbook

**Files:**

- Create: `evidenz/1B/vm/WINDOWS.md`, `evidenz/1B/runbook.md`

- [ ] **Step 1:** Windows-Weg mit zwei echten VMs gegen die Herstellerdoku prüfen (Microsoft Learn für Hyper-V und WSL; Multipass-Doku für cloud-init und Netz). Ausdrücklich festhalten: zwei WSL-Distributionen sind keine zwei Hosts. Gleiche cloud-init-Dateien, gleiche IPs bzw. Anpassung; CPU-Pinning-Möglichkeit je Werkzeug. Kopfzeile „ungetestet, Niklas prüft“.
- [ ] **Step 2:** `runbook.md`: Nachbau unter Linux von `vm-linux.sh up` bis `lauf.sh lauf`, mit Rückbau (`vm-linux.sh destroy`) und Stolperfallen aus Tasks 3–9.
- [ ] **Step 3:** Prettier + `git diff --check`; Commit `docs(referat): add the 1B rebuild runbook and the Windows path`.

---

### Task 11: Hauptdokument, Belege, Eigenanteil

**Files:**

- Create: `1B-ergebnis.md`, `1B-diagrams.md`, `1B-eigenanteil.md`
- Modify: `README.md` (Ordner), `adr/README.md` falls neue ADRs entstanden

- [ ] **Step 1:** `1B-ergebnis.md`: Abschnitte „Schritte 1–2 (Jonas)“ mit Aufgabenabdeckung, Befunden B und C, Gültigkeitsgrenze D, Entscheidung; „Schritte 3–4 (Niklas)“ als leere Gliederung; „Gemeinsames Kurzfazit“ als Platzhalter. Zahlen nur mit Link auf Protokoll oder ADR.
- [ ] **Step 2:** `1B-diagrams.md`: Topologie (Mermaid, Labor) und Belegtabelle mit Zeilennummern am Laufstand für alle zitierten Codestellen (per Serena/codebase-memory geprüft).
- [ ] **Step 3:** `1B-eigenanteil.md`: Abschnitt Jonas (eigener Anteil, KI-Nutzung mit Agenten und zentralen Prompts, Prüfung durch den Autor), Abschnitt Niklas leer.
- [ ] **Step 4:** Volle Prüfung: `npx prettier --check docs/referat-thema-1/**/*.md`, `git diff --check`, `node --test docs/referat-thema-1/evidenz/1B/messung/`, Links in den neuen Dateien prüfen (Ziele existieren).
- [ ] **Step 5:** Commit `docs(referat): add the 1B result for steps 1-2`.
- [ ] **Step 6:** PR gegen Fork-`main` erst nach Freigabe durch den Autor, mit vollständigem `.github/pull_request_template.md`.
