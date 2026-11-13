# Issue-Entwurf: Runbook §11 verlangt einen Negativtest von einem Dritthost, nennt aber keinen Befehl

> **Status:** Entwurf, nicht angelegt. Angelegt wird erst nach Freigabe durch den Autor; Ort (kqc-real oder Fork) entscheidet er. Grundlage: [Aufbauprotokoll, Befund 3](2026-11-12-aufbau.md#befunde-für-kernaussage-c). Entworfen mit Claude Code (Modell Claude Opus 5.5).

**Vorgeschlagener Titel:** `Second-Host-Runbook: prüfbaren Befehl für „anderer Host erreicht Port 8080 nicht“ ergänzen`

---

## Beobachtung

`docs/operations/OPEN-WEIGHT-LLM-SECOND-HOST-RUNBOOK.md` Abschnitt 11 endet mit: „Zusätzlich muss ein Zugriff von einem beliebigen anderen Host auf Port 8080 scheitern.“ Ein Befehl und eine erwartete Ausgabe fehlen, anders als bei allen anderen Prüfungen des Runbooks. Damit ist die wichtigste Sicherheitsannahme der zweiten Rolle (nur der App-Host erreicht die Runtime) im Abnahmeprotokoll nicht nachvollziehbar belegt.

## Vorschlag

Einen Befehl mit erwarteter Ausgabe ergänzen, etwa von einem dritten Host im selben Segment:

```bash
curl --silent --show-error --max-time 5 "http://<PRIVATE-IP-DES-INFERENZ-HOSTS>:8080/health" \
  && echo 'FEHLER: Port 8080 von diesem Host erreichbar' || echo 'OK: nicht erreichbar'
```

Erwartet: `OK: nicht erreichbar` (Timeout oder abgelehnte Verbindung). Dazu ein Hinweis, dass ohne dritten Host im Segment die Firewall-Regel (`ufw status verbose`, Quelle nur App-Host) als Ersatzbeleg dient.

**Kosten:** gering (nur Doku). **Risiko:** keins. **Rückweg:** Revert.

## Gültigkeitsgrenze

Runbook am Branch-Stand `ed9e9a75`. Das Labor prüfte vom Rechner aus und über die Firewall-Regeln ([Aufbauprotokoll](2026-11-12-aufbau.md)); einen echten dritten Host im Labornetz gab es nicht.
