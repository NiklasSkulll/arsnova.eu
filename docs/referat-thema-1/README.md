# Referat Cloud Computing – Thema 1 (Arbeitsordner)

Arbeitsordner von Jonas und Niklas für **Thema 1: KI-Inferenz für den
Moderationskompass – Systemgrenzen und entkoppelte Architektur**. Wir
bearbeiten alle drei Aufträge 1A, 1B und 1C.

Der Ordner liegt auf dem Branch `referat/thema-1-notes` und ist Arbeits- und
Evidenzmaterial. Er gehört **nicht** in die PR an kqc-real.

## Inhalt

| Datei                                                                        | Inhalt                                                                         |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [00-rahmen-und-pruefung.md](./00-rahmen-und-pruefung.md)                     | Generalthema, Bewertung, Nachweiskette, KI-Regeln, Widersprüche, offene Fragen |
| [1A-ressourcenisolation-app-host.md](./1A-ressourcenisolation-app-host.md)   | Code-Landkarte, Messwerkzeuge, Versuchsvorschlag, Lücken für 1A                |
| [1B-private-inferenz-zweiter-host.md](./1B-private-inferenz-zweiter-host.md) | Zwei-Host-Deployment, LLM-Client, Messbarkeit, Lücken für 1B                   |
| [1C-kontext-und-adapterpfad.md](./1C-kontext-und-adapterpfad.md)             | #456-Kontext, Verträge, Snapshot/Hash, Async-Pfad, Testlücken für 1C           |

Geplant: `evidenz/` für Rohdaten, Skripte und Messprotokolle je Auftrag (ohne
Secrets, nur synthetische Daten).

## Was recherchiert wurde

- **Rahmen:**
  - Bewertung: 30 % Handout, 30 % Vortrag, 40 % Diskussion. Jede Person wird
    einzeln bewertet.
  - Pflicht-Nachweiskette: Commit/Manifest → Baseline → Störung → Messung →
    Befund mit Gültigkeitsgrenze → Entscheidung.
  - KI-Regeln.
  - Widersprüche zwischen den Kursfolien und der Repo-Fassung.
- **1A, Ressourcen auf dem App-Host:**
  - Nur die Sidecars haben Limits. App, Postgres und Redis haben keine.
  - spaCy bearbeitet immer nur eine Anfrage gleichzeitig.
  - Kein vorhandenes Lastskript belastet spaCy.
- **1B, zweiter Host für die private Inferenz:**
  - Wie das Zwei-Host-Deployment und der LLM-Client aufgebaut sind.
  - Gemessen wird bisher nur die Gesamtzeit. Die Detailzeiten von llama.cpp
    werden zwar ausgelesen, aber nicht verwendet.
  - Es gibt keinen Fake-Server für Tests.
- **1C, Kontextpfad bis zur Inferenz:**
  - Snapshot und Hash. Wahrscheinlich ändert jede Stimme den Hash.
  - Der Async-Pfad.
  - Testlücken: Quelle mitten im Job gelöscht, langsamer Empfänger, volle
    Queue.

Alle Dossiers enthalten Code-Stellen (Datei:Zeile), Versuchsideen und Lücken.

## Qualitätsanspruch an PRs

- Die CI von kqc-real läuft auch in Niklas' Fork. Am 2026-10-16 wurde sie dort
  vollständig grün geprüft. Jede PR muss dort grün durchlaufen, bevor sie an
  kqc-real geht.
- Codex-Reviews sollen ebenfalls clean sein. **Noch offen:** Die Einrichtung
  muss Niklas als Repo-Owner machen (ChatGPT Codex Connector, dann
  `chatgpt.com/settings/code-review`).

## Offene Punkte

- Fragen an den Prüfer klären (siehe
  [00-rahmen-und-pruefung.md](./00-rahmen-und-pruefung.md#offene-fragen-an-den-prüfer)),
  vor allem diese:
  - Darf der aktuelle `main` die Baseline sein statt `v1.3.0`?
  - Was ist beim zweiten Host bereitgestellt, und wie bekommen wir Zugang?
- **Aufteilung 1A/1B/1C:** Jeder braucht eine klar erkennbare Eigenleistung,
  und der Aufwand sollte trotzdem gleichmäßig verteilt sein.

## Hinweis zur Entstehung

Die Dossiers 1A–1C wurden am 2026-10-16 agentengestützt erstellt (Claude Code,
Modell Claude Opus 5.5, mit Serena und codebase-memory-mcp auf Commit
`27966e75`). Zeilenangaben beziehen sich auf diesen Stand und müssen vor der
Übernahme ins Handout gegen die festgelegte Baseline geprüft werden.
