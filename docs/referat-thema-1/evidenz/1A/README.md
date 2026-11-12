# A1-Messnachweise

Die vollständige bestätigende Reihe liegt unter
[`reihe-2026-11-12/`](./reihe-2026-11-12/). Sie enthält fünf randomisierte
Blöcke mit je einer Messung der Varianten V0–V4. Für Schritt 7 ausschließlich
diese 25 Läufe gemeinsam vergleichen.

| Nachweis                                                              | Bedeutung                                                                                 |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [plan.json](./reihe-2026-11-12/plan.json)                             | Festgelegte Reihenfolge und identisches Lastprofil                                        |
| [abschluss.json](./reihe-2026-11-12/abschluss.json)                   | Vollständiger Abschluss mit Baseline-, Image-, Werkzeug-, Vertrags- und Fixture-Identität |
| [erfassungspruefung.json](./reihe-2026-11-12/erfassungspruefung.json) | Nachprüfung der 25 Laufnachweise und 50 komprimierten Ressourcenartefakte                 |
| [herkunft.json](./reihe-2026-11-12/herkunft.json)                     | Begründung des erneuten Beginns und Herkunft des übernommenen Vorlaufs                    |
| `reihe-2026-11-12/V*/block-*/lauf.json`                               | Manifest, Live-Stichproben, Analyseergebnisse, Diagnosen und Rückwegprüfung je Lauf       |
| `reihe-2026-11-12/V*/block-*/*.json.gz`                               | Vollständige Ressourcenzeitreihen, getrennt für Messung und Aufwärmung                    |
| `reihe-2026-11-12/V*/block-*/report.json` und `report.xml`            | Maschinenlesbarer Erfassungsstatus                                                        |

Die erste Reihe vom 2026-11-11 bleibt im Wurzelverzeichnis erhalten:
`V0`–`V4/block-01` und `V4/block-02` sind vollständig, `V1/block-02` wurde auf
Wunsch des Bearbeiters während der Aufwärmung abgebrochen. Diese Reihe hat
keinen Gesamtabschluss und wird nicht mit der vollständigen Reihe vermischt.
`vorlauf/` enthält die fünf verkürzten Vorläufe; dieselben Dateien liegen nach
Identitätsprüfung unverändert auch in der neuen Reihe. Der ursprüngliche
fehlgeschlagene Labor-Vorabcheck bleibt unter
`vorlauf-vorpruefung-abgebrochen/` dokumentiert. Diese Vorabdaten sind keine
bestätigenden Wiederholungen.

Die Reihen basieren auf dem unveränderten Anwendungscommit
`8f91e0417bc5aace461c3644a0b6b26c9284035b`. Werkzeuge und Versuchsvertrag
sind durch eigene SHA-256-Werte identifiziert. Die Anwendung und der
Lastgenerator liefen auf demselben WSL2-Rechner mit 16 logischen CPUs.
Ergebnisse gelten zunächst für dieses Labor.

Die Ressourcen lassen sich mit `gzip -dc ressourcen.json.gz` lesen. Zum
Nachvollziehen der Dateiintegrität aus dem Repository-Wurzelverzeichnis:

```bash
python3 - <<'PY'
from pathlib import Path
import gzip, hashlib, json

wurzel = Path('docs/referat-thema-1/evidenz/1A/reihe-2026-11-12')
plan = json.loads((wurzel / 'plan.json').read_text())
assert len(plan['runs']) == 25
for lauf in plan['runs']:
    ordner = wurzel / lauf['variant'] / lauf['run']
    bericht = json.loads((ordner / 'lauf.json').read_text())
    assert bericht['complete'] and bericht['rollback']['verified']
    for phase, anzahl in [(bericht, 151), (bericht['warmup'], 31)]:
        artefakt = phase['resources']['artifact']
        daten = (ordner / artefakt['file']).read_bytes()
        assert hashlib.sha256(daten).hexdigest() == artefakt['sha256']
        ressourcen = json.loads(gzip.decompress(daten))
        assert len(ressourcen['snapshots']) == anzahl
print('25 Laufnachweise und 50 Ressourcenartefakte geprüft.')
PY
```

`complete` bestätigt Erfassung und Rückweg, keine bestandenen
Leistungsgrenzen. Die Bewertung der Hypothesen und die Betriebsentscheidung
gehören zu Schritt 7. Aufbau, Prüfungen und Gültigkeitsgrenzen stehen in der
[Versuchsreihe](../../1A-versuchsreihe.md).
