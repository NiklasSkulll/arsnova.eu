# 1B-003: Laborregel für das virtuelle Netz zwischen den VMs

- **Status:** methodisch (2026-11-12)
- **Kategorie:** Methodik

## Kontext

Die Ordnerregel lautete „Laborinstanzen nur auf `127.0.0.1`“ ([`AGENTS.md`](../AGENTS.md)). Ein Zwei-Host-Aufbau braucht eine Runtime, die über ein Netz erreichbar ist; ADR-0035 verlangt dafür eine private IP, Bearer-Credential und eine Firewall, die nur den App-Host zulässt ([Runbook §5](../../operations/OPEN-WEIGHT-LLM-SECOND-HOST-RUNBOOK.md#5-firewall-zuerst-einrichten)).

## Entscheidung

Die Regel lautet ab jetzt: Laborinstanzen nur auf `127.0.0.1` oder in einem privaten virtuellen Netz zwischen Labor-VMs auf demselben Rechner, das von außen nicht erreichbar ist (keine Portweiterleitung, kein Bridging an eine physische Schnittstelle); ausgehendes NAT für die Einrichtung ist erlaubt. Im Inferenz-Host gelten wie im Runbook: Bind an die private VM-IP, `ufw` mit `deny incoming`, TCP 8080 nur von der IP des App-Hosts, eigenes Bearer-Token. Die `AGENTS.md` im Wurzelverzeichnis bleibt unverändert, sie gehört upstream.

## Alternativen

- **Nur `127.0.0.1`:** verworfen; damit gibt es keinen zweiten Host.
- **Netz ohne ausgehenden Zugang:** verworfen; die VMs müssen Pakete und Images laden, und Produktionshosts dürfen ebenfalls ausgehend ins Internet.
- **Bridging ins Heimnetz:** verworfen; die Runtime wäre dann aus dem Heimnetz erreichbar.

## Belege

- [1B-Design, Abschnitt 3.3](../specs/2026-11-12-1b-zwei-host-design.md#33-netz-und-sicherheit-autor-formulierung-ki-vorschlag).
- Negativtests (vom Laptop als drittem Host auf `:8080`, ohne und mit falschem Token) im Aufbauprotokoll unter `evidenz/1B/`.

## Folgen

- Paketmitschnitte enthalten den Bearer-Token im Klartext und werden nie eingecheckt; der Token wird nach dem Lauf verworfen ([ADR 1B-006](1B-006-zeitmessung-per-mitschnitt.md)).
- Gültigkeitsgrenze: Ein privates Netz belegt weder Autorisierung noch Datenschutz; der Token läuft zwischen den Hosts unverschlüsselt über HTTP.
