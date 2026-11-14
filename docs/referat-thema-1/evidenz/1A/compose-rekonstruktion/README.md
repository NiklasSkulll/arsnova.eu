# A1 – Nachträglich aufgelöste Labor-Konfiguration

**Rekonstruktion vom 13.11.2026, keine damalige Aufnahme.** Die Originalreihe
vom 12.11.2026 wurde nicht verändert oder erneut gemessen.

Die damaligen Laufmanifeste enthalten Images, wirksame ausgewählte Flags,
Ressourcenlimits und den SHA-256 der ursprünglichen Baseline-Compose-Datei.
Die vollständige aufgelöste Compose-Konfiguration wurde während der Messung
nicht gespeichert. Dieser Nachtrag schließt die Reproduzierbarkeitslücke
teilweise durch eine überprüfbare Rekonstruktion; er ersetzt keine fehlende
zeitgenössische Aufnahme und belegt keine damals nicht erfassten Einstellungen.

## Quellen und Abgleich

- Unveränderter Anwendungscommit
  `8f91e0417bc5aace461c3644a0b6b26c9284035b:docker-compose.prod.yml`.
- Unveränderter Aufbauhelfer `scripts/load/lib/resource-isolation-experiment.mjs`.
- Unveränderliche Image-IDs aus den 25 Laufmanifesten.
- Auflösung mit `docker compose --profile nlp config --format json` und
  ausschließlich synthetischen temporären Platzhaltern für die private Umgebung.
  Es werden keine Container gestartet und keine Images bezogen.
- Gegen jeden Lauf geprüft: Baseline-Compose-Hash, Images der gestarteten
  Dienste, CPU-/RAM-/PID-Limits und sämtliche aufgezeichneten App-Flags.

Das [Indexmanifest](./index.json) nennt die heute verwendete Compose-Version,
Quellhashes, 25 Laufzuordnungen und die Prüfsummen der fünf Ausgaben:
[V0](./V0.json), [V1](./V1.json), [V2](./V2.json), [V3](./V3.json), [V4](./V4.json).
Der zusätzlich deklarierte spaCy-Dienst gehört bei V0/V1 zum Profil und wurde
damals nicht gestartet; die Liste gestarteter Dienste bleibt im Originalmanifest.
Die Auflösung mit der heutigen Compose-Version ist kein Nachweis, welche
Normalisierungsdetails die damalige Version erzeugt hätte.

## Bereinigung und Wiederholung

Die Ausgaben sind Positivlisten-Auszüge der aufgelösten Konfiguration. Exportiert
werden nur ausgewählte Dienst-/Härtungsfelder, Limits, Abhängigkeiten, bekannte
Flags, Mount-Ziele und lokale Portbindungen. Secrets, Datenbank-/Redis-URLs,
IP-Adressen, lokale Hostpfade, private Umgebungsfelder, Labels und freie
Kommando-/Healthcheck-Texte werden nicht exportiert. Bind-Quellen sind durch
symbolische Platzhalter ersetzt; die JSON-Dateien sind keine Deploymentdateien.

```bash
npm run load:resource-isolation:compose:reconstruct -- \
  --output-dir /tmp/arsnova-1a-compose-rekonstruktion-neu
npm run load:resource-isolation:evaluation:test
```

Der Ausgabeordner muss neu sein. Docker Compose muss installiert sein; ein
laufender Docker-Daemon ist für die Konfigurationsauflösung nicht erforderlich.
Die Tests der Bereinigung und des Manifestabgleichs benötigen Docker nicht.
Zeitstempel ändern sich bei Wiederholung, die fachlichen Konfigurationswerte
sollen bei unveränderten Quellen gleich bleiben.

Für künftige Messreihen sollte diese Positivlisten-Aufnahme bereits während
des jeweiligen Laufs gespeichert werden. Die eingefrorenen Messwerkzeuge
dieser Reihe werden dafür nicht rückwirkend verändert. Falls der Prüfer auf
der damaligen Aufnahme besteht, bleibt eine explizite Anerkennung dieses
Nachtrags oder eine neue, getrennt gekennzeichnete Messreihe erforderlich.
