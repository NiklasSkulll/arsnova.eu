# Referat Cloud Computing – Thema 1 (Arbeitsordner)

Gemeinsamer Arbeitsordner von Jonas und Niklas für das Referat zu **Thema 1:
KI-Inferenz für den Moderationskompass – Systemgrenzen und entkoppelte
Architektur**. Wir bearbeiten alle drei Aufträge 1A, 1B und 1C.

Dieser Ordner lebt auf dem Branch `referat/thema-1-notes` in
[NiklasSkulll/arsnova.eu](https://github.com/NiklasSkulll/arsnova.eu). Er ist
Arbeits- und Evidenzmaterial und gehört **nicht** in die PR an kqc-real. Feature-
oder Test-PRs zweigen von `main` ab, nicht von diesem Branch.

## Inhalt

| Datei                                                                        | Inhalt                                                                         |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [00-rahmen-und-pruefung.md](./00-rahmen-und-pruefung.md)                     | Generalthema, Bewertung, Nachweiskette, KI-Regeln, Widersprüche, offene Fragen |
| [1A-ressourcenisolation-app-host.md](./1A-ressourcenisolation-app-host.md)   | Code-Landkarte, Messwerkzeuge, Versuchsvorschlag, Lücken für 1A                |
| [1B-private-inferenz-zweiter-host.md](./1B-private-inferenz-zweiter-host.md) | Zwei-Host-Deployment, LLM-Client, Messbarkeit, Lücken für 1B                   |
| [1C-kontext-und-adapterpfad.md](./1C-kontext-und-adapterpfad.md)             | #456-Kontext, Verträge, Snapshot/Hash, Async-Pfad, Testlücken für 1C           |

Geplant: `evidenz/` für Rohdaten, Skripte und Messprotokolle je Auftrag (ohne
Secrets, nur synthetische Daten).

## Git-Workflow

Remotes im lokalen Klon:

| Remote     | Repo                      | Zweck                          |
| ---------- | ------------------------- | ------------------------------ |
| `origin`   | `NiklasSkulll/arsnova.eu` | Gruppenarbeit, Standard        |
| `upstream` | `kqc-real/arsnova.eu`     | Original, nur holen            |
| `jonas`    | `jonasyr/arsnova.eu`      | Jonas' eigener Fork (optional) |

Ablauf:

1. `git fetch origin && git switch --no-track -c <typ>/<thema> origin/main`
2. Arbeiten, committen nach Conventional Commits, `git push`.
3. PR innerhalb des Forks öffnen (`<branch>` → `NiklasSkulll:main`) und das
   PR-Template vollständig ausfüllen. CI, CodeQL und der Template-Check laufen
   dort genauso wie bei kqc-real.
4. Erst wenn alles grün ist: PR an `kqc-real/arsnova.eu`.

Niklas' Fork mit kqc-real abgleichen: auf GitHub „Sync fork“ oder
`git fetch upstream && git push origin upstream/main:main`.

### Stolperfallen

- **Node-Version:** Das Projekt verlangt Node 22 oder 24 (`.nvmrc`: 24.18.0).
  Mit Node 25 oder neuer scheitern die Frontend-Tests im Pre-Commit-Hook an
  `localStorage`. Mit mise: `mise exec node@24.18.0 -- git commit …` oder
  `mise use node@24.18.0` im Repo.
- **Pre-Commit-Hook:** Führt Typecheck und die komplette Testsuite aus. Ein
  einzelner Timeout unter Last (z. B. PDF-Test) ist meist Flakiness; Test
  einzeln wiederholen.
- **CI im Fork:** Am 2026-10-16 mit Test-PR
  [NiklasSkulll/arsnova.eu#1](https://github.com/NiklasSkulll/arsnova.eu/pull/1)
  vollständig grün geprüft. Dafür waren drei Einstellungen nötig:
  1. Actions im Repo einschalten (Actions-Tab bzw. Settings → Actions →
     General).
  2. Workflows mit Zeitplan einzeln aktivieren. GitHub setzt sie in Forks auf
     `disabled_fork` (betroffen: CI und CodeQL):
     `gh workflow enable <id> -R NiklasSkulll/arsnova.eu`. Mit
     `gh workflow list --all` prüfen.
  3. Settings → Code security → **Dependency graph** einschalten, sonst
     scheitert der Job „Dependency Review“.
- **Übersprungene Jobs:** Lasttests (Artillery, k6), Image-Publish und Deploy
  laufen nur nachts, manuell oder bei Push auf `main`. Bei PRs ist „skipped“
  normal.
- **Codex-Review:** Ist eine GitHub-App, kein CI-Job. Im Fork nur aktiv, wenn
  sie dort eigens eingerichtet wird.

## Status

- [x] CI im Fork lauffähig und grün (2026-10-16)
- [ ] Fragen aus [00-rahmen-und-pruefung.md](./00-rahmen-und-pruefung.md) beim
      Prüfer geklärt
- [ ] 1.3-Release-Commit und Referenzmanifest festgehalten
- [ ] Zugang zu Laborinstanz und zweitem Host bestätigt
- [ ] Aufteilung 1A/1B/1C zwischen Jonas und Niklas
- [ ] Je Auftrag: Hypothese, Gegenalternative, Messplan
- [ ] Baselineläufe
- [ ] Stör- und Variantenläufe
- [ ] Gruppensynthese
- [ ] PR(s) im Fork grün, dann an kqc-real
- [ ] Handouts und Folien als PDF, Abgabe per E-Mail (48 h vorher)

## Hinweis zur Entstehung

Die Dossiers 1A–1C wurden am 2026-10-16 agentengestützt erstellt (Claude Code,
Modell Claude Opus 5.5, mit Serena und codebase-memory-mcp auf Commit
`27966e75`). Zeilenangaben beziehen sich auf diesen Stand und müssen vor der
Übernahme ins Handout gegen den festgelegten 1.3-Commit geprüft werden.
