# Referat Cloud Computing – Thema 1 (Arbeitsordner)

Arbeitsordner von Jonas und Niklas für **Thema 1: KI-Inferenz für den
Moderationskompass – Systemgrenzen und entkoppelte Architektur**. Wir
bearbeiten alle drei Aufträge 1A, 1B und 1C.

Der Ordner enthält Arbeits- und Evidenzmaterial. Er gehört **nicht** in die PR
an kqc-real.

## Inhalt

| Datei                                                                        | Inhalt                                                                                           |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [00-rahmen-und-pruefung.md](./00-rahmen-und-pruefung.md)                     | Generalthema, Bewertung, Nachweiskette, KI-Regeln, Widersprüche, offene Fragen                   |
| [01-aufteilung.md](./01-aufteilung.md)                                       | Aufteilung: Niklas = X (1A, 1B 3–4), Jonas = Y (1C, 1B 1–2); Optionen, Aufwand                   |
| [1A-ressourcenisolation-app-host.md](./1A-ressourcenisolation-app-host.md)   | Code-Landkarte, Messwerkzeuge, Versuchsvorschlag, Lücken für 1A                                  |
| [1A-experiment-contract.md](./1A-experiment-contract.md)                     | Vorab festgelegte A1-Hypothesen, Lastprofil, Varianten, Grenzwerte und Nachweisanforderungen     |
| [1A-fixture.md](./1A-fixture.md)                                             | Gemeinsame deterministische Fixture mit Referenz- und Gegenfällen, A1-Projektion und Hashprüfung |
| [1A-live-messungen.md](./1A-live-messungen.md)                               | Artillery-Messfelder, Fehlerzählung, Gates, Lastprofil und lokale Prüfung für Schritt 3          |
| [1A-analyse-last.md](./1A-analyse-last.md)                                   | Hostautorisierte Analyse-Last mit festem Korpus, Zeitplan, Ergebniszählung und lokaler Prüfung   |
| [1A-container-metriken-und-proxy.md](./1A-container-metriken-und-proxy.md)   | Lesende Container-Erfassung, cgroup-Auswertung und kontrollierter Unix-Socket-Verzögerungsproxy  |
| [1A-versuchsreihe.md](./1A-versuchsreihe.md)                                 | Isolierter Laboraufbau, randomisierte V0–V4-Blöcke, Vorlauf, Messung und geprüfter Rollback      |
| [1A-auswertung.md](./1A-auswertung.md)                                       | Gepaarte Auswertung, nicht bestätigte Hypothesen, Ressourcenbudget und Betriebsentscheidung      |
| [1A-komplette-Aufgabe-fertig.md](./1A-komplette-Aufgabe-fertig.md)           | Übersicht aller sieben Schritte mit Dateien, Befehlen und aktuellem Abschlussstand               |
| [1A-eigenanteil.md](./1A-eigenanteil.md)                                     | Anforderungsabgleich, Git-Prüfgrundlage und transparente Abgrenzung agentengestützter Beiträge   |
| [1A-abschluss-und-uebergabe.md](./1A-abschluss-und-uebergabe.md)             | Persönliche Prüfaufgaben, gemeinsame Artefakte, KI-Aufträge und tatsächlicher Übergabestand      |
| [abgabe/README.md](./abgabe/README.md)                                       | Vierseitiger Handoutentwurf, neun PDF-Folien, Diagramme und reproduzierbarer Dokumentbau         |
| [1B-private-inferenz-zweiter-host.md](./1B-private-inferenz-zweiter-host.md) | Zwei-Host-Deployment, LLM-Client, Messbarkeit, Lücken für 1B                                     |
| [1C-kontext-und-adapterpfad.md](./1C-kontext-und-adapterpfad.md)             | #456-Kontext, Verträge, Snapshot/Hash, Async-Pfad, Testlücken für 1C                             |

Unter `evidenz/1A/` liegen die A1-Messnachweise mit synthetischen Daten.
Die erste Reihe bleibt nach ihrem angeforderten Abbruch erhalten; der erneute
vollständige Durchlauf liegt getrennt unter `evidenz/1A/reihe-2026-11-12/`.
Ablauf und Zuordnung beschreibt die [Versuchsreihe](./1A-versuchsreihe.md).
Die [Auswertung](./1A-auswertung.md) trifft daraus die begründete Entscheidung;
Der [Compose-Nachtrag](./evidenz/1A/compose-rekonstruktion/README.md) ist ausdrücklich
eine Rekonstruktion. [Abschluss und Übergabe](./1A-abschluss-und-uebergabe.md) sowie
[Nacharbeitsprüfungen](./evidenz/1A/nacharbeit/README.md) weisen persönliche und
formale Freigaben getrennt von technischen Ergebnissen aus.

Der [bereinigte Abschlussstand](./evidenz/1A/bereinigung/README.md) trennt die
wiederhergestellten A1-npm-Befehle und den Quick-Feedback-Isolationstest von
verworfenen Compiler- und Frontend-Testkorrekturen. Frühere Gesamtprüfungen
belegen ausschließlich ihren damaligen Umfang.

## Arbeitsweise im Fork

Wegen des knappen Zeitrahmens gilt:

- **Kein `dev`-Branch:** Entwickelt wird in `feature-<featurename>`-Branches,
  die direkt in `main` gemergt werden.
- **Kein Branch-Schutz auf `main`:** So lässt sich auch vor Abschluss aller
  Checks schnell mergen. Die CI läuft trotzdem auf jeder PR. Vor der PR an
  kqc-real muss sie vollständig grün sein.
- **PR an kqc-real:** Dafür einen Branch von `upstream/main` abzweigen, nicht
  vom Fork-`main`. Sonst landet dieser Ordner mit in der PR.

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
  - Die ursprünglichen Lastskripte belasteten spaCy nicht. Die A1-Werkzeuge
    ergänzen dafür hostautorisierte Analyseanfragen und Ressourcenmessungen.
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
  [00-rahmen-und-pruefung.md](./00-rahmen-und-pruefung.md#klärungsstand-der-fragen-an-den-prüfer)),
  vor allem diese:
  - Für 1A geklärt: aktueller `main` als Baseline und eigener Rechner als Labor
    gemäß [Issue #6, Stand 2026-11-10](https://github.com/NiklasSkulll/arsnova.eu/issues/6).
  - Für 1B offen: Wie wird der zweite Host auf eigener Hardware reproduziert
    (siehe [Issue #8](https://github.com/NiklasSkulll/arsnova.eu/issues/8))?
- **Aufteilung 1A/1B/1C:** Am 2026-10-23 festgelegt (Option 1). Niklas ist X
  (1A und 1B Schritte 3–4), Jonas ist Y (1C und 1B Schritte 1–2). Die
  Abstimmung mit dem Prüfer steht noch aus. Details in
  [01-aufteilung.md](./01-aufteilung.md#entscheidung-2026-10-23).

## Hinweis zur Entstehung

Die Dossiers 1A–1C wurden am 2026-10-16 agentengestützt erstellt (Claude Code,
Modell Claude Opus 5.5, mit Serena und codebase-memory-mcp auf Commit
`27966e75`). Zeilenangaben beziehen sich auf diesen Stand und müssen vor der
Übernahme ins Handout gegen die festgelegte Baseline geprüft werden.
