# AGENTS.md – docs/referat-thema-1

Referat Cloud Computing, Thema 1 (Aufträge 1A–1C) im Fork. Gilt für alle
Dateien in diesem Ordner, zusätzlich zur `AGENTS.md` im Wurzelverzeichnis.

## Karte

- Rahmen, Prüfung, Baseline: [`00-rahmen-und-pruefung.md`](00-rahmen-und-pruefung.md)
- Aufteilung und gemeinsame Artefakte: [`01-aufteilung.md`](01-aufteilung.md)
- Alle Dateien des Ordners: [`README.md`](README.md)
- Je Auftrag ein Hauptdokument mit Ergebnis, Befunden und offenen Punkten
  (1C: [`1C-ergebnis.md`](1C-ergebnis.md))
- Entscheidungen: [`adr/`](adr/README.md), ein Nummernkreis je Auftrag
- Protokolle und Rohdaten: `evidenz/<Auftrag>/` · Designs und Pläne: `specs/`
- Diagramme: `diagrams/`, Regeln in [`diagrams/README.md`](diagrams/README.md)

## Ein Fakt, ein Ort

Jeder Fakt steht an genau einer Stelle; andere Dokumente verlinken ihn statt
ihn zu wiederholen.

- Ergebnis, Aufgabenabdeckung und Befunde eines Auftrags: sein Hauptdokument
- Entscheidung mit Begründung, Alternativen und Belegen: ein ADR
- Messwerte und Ablauf eines Laufs: sein Protokoll unter `evidenz/`
- Code-Belege mit Zeilennummern: die Belegtabelle der Diagrammdoku des Auftrags
- Dateiübersicht: `README.md`
- Eigenanteil und KI-Nutzung: die Eigenanteil-Datei des Auftrags
- Folien und Handout: Gliederung; jede Kernzahl nur mit Quelle (ADR oder
  Protokoll), keine eigenen Herleitungen

## Regeln

- Doku auf Deutsch; Commit-Messages Englisch nach Conventional Commits, ohne
  KI-Attribution.
- Protokolle und Rohdaten nach dem Einfrieren nicht ändern (Korrekturen nur am
  Lauftag oder Folgetag, siehe Eigenanteil). Einzige spätere Ausnahme: das Datum
  in der Zeile „Prüfung durch den Autor“. Ein freigegebenes Design wird
  vor einem neuen Lauf nur durch einen neuen, datierten Nachtrag ergänzt.
- Spätere Erkenntnisse kommen als datierter Hinweis („_Aktualisiert_“,
  „_Ergänzt_“ oder „_Korrigiert JJJJ-MM-TT:_“) ins lebende Dokument oder ins
  ADR. Ein angenommenes ADR wird annotiert oder durch ein neues abgelöst; seinen
  Entscheidungstext ändert niemand.
- Jede Zahl mit Rechner und Commit. Kennzahlen eines 1C-Laufs neu berechnen:
  `node docs/referat-thema-1/evidenz/1C/messung/auswertung.mjs <datei.json.gz>`.
- Keine Matrikelnummern, personenbezogenen Daten, Tokens oder `.env`-Inhalte.
- `AGENTS.md` im Wurzelverzeichnis und `.serena/` gehören upstream; für das
  Referat nicht ändern. Produktionscode bleibt unverändert; Tests, Testhelfer, ihre
  CI-Schritte und ihre Doku in `docs/TESTING.md` sind erlaubt.
- Laborinstanzen nur auf `127.0.0.1`.
- Markdown prüfen: `npx prettier --check <dateien>` und `git diff --check`.

## Wiederverwendbar aus 1C

- [`evidenz/1C/labor-runbook.md`](evidenz/1C/labor-runbook.md) mit
  `evidenz/1C/labor-lauf.sh`: unbeaufsichtigte Läufe mit Prüfung von Limits,
  Neustarts und OOM-Kill, Speicherverlauf als CSV
- `evidenz/1C/labor-produktionslimits.override.yml`: Produktionslimits im
  Labor nachstellen
- `apps/backend/src/__tests__/lib/open-weight-test-runtime.ts`: Latenz und
  Ausfall der Runtime in Vitest (im Testprozess, kein eigenständiger Server)
- `apps/backend/src/__tests__/lib/recording-proxy.ts`: aufzeichnender Proxy
  vor der echten Runtime
