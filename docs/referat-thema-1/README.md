# Referat Cloud Computing – Thema 1 (Arbeitsordner)

Arbeitsordner von Jonas und Niklas für **Thema 1: KI-Inferenz für den
Moderationskompass – Systemgrenzen und entkoppelte Architektur**. Wir
bearbeiten alle drei Aufträge 1A, 1B und 1C.

Der Ordner liegt im Fork-`main` und ist Arbeits- und Evidenzmaterial. Er
gehört **nicht** in die PR an kqc-real.

## Inhalt

| Datei                                                                        | Inhalt                                                                                                                                                                  |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [00-rahmen-und-pruefung.md](./00-rahmen-und-pruefung.md)                     | Generalthema, Bewertung, Nachweiskette, KI-Regeln, Widersprüche, offene Fragen                                                                                          |
| [01-aufteilung.md](./01-aufteilung.md)                                       | Aufteilung: Niklas = X (1A, 1B 3–4), Jonas = Y (1C, 1B 1–2); Optionen, Aufwand                                                                                          |
| [1C-ergebnis.md](./1C-ergebnis.md)                                           | _Aktualisiert 2026-11-05:_ **Einstieg 1C:** Ergebnisbericht mit Kurzantwort, Nachweiskette, Befunden, Ursachenketten, Kosten, offenen Punkten                           |
| [adr/](./adr/)                                                               | _Aktualisiert 2026-11-05:_ Entscheidungsprotokolle (ADRs) 1C-001 bis 1C-024 mit Index                                                                                   |
| [1C-eigenanteil.md](./1C-eigenanteil.md)                                     | _Aktualisiert 2026-11-05:_ Eigenanteil und KI-Offenlegung zu 1C                                                                                                         |
| [1C-praesentation-geruest.md](./1C-praesentation-geruest.md)                 | _Aktualisiert 2026-11-05:_ Gerüst für Folien und Handout zu 1C                                                                                                          |
| [1C-diagrams.md](./1C-diagrams.md)                                           | Diagramme zu 1C (Handout, Arbeitskarte und Vertragsschichten) mit Belegtabelle                                                                                          |
| [specs/](./specs/)                                                           | Vorab festgelegte Designs und Pläne der 1C-Tests und -Messungen (Teil 1 bis 3; _Aktualisiert 2026-11-05:_ dazu Labor-Design und Design/Plan der Abschlussdokumentation) |
| [evidenz/1C/](./evidenz/1C/)                                                 | Testprotokolle, Mutationsproben, Messrohdaten und Auswertung zu 1C                                                                                                      |
| [1A-ressourcenisolation-app-host.md](./1A-ressourcenisolation-app-host.md)   | Code-Landkarte, Messwerkzeuge, Versuchsvorschlag, Lücken für 1A                                                                                                         |
| [1B-private-inferenz-zweiter-host.md](./1B-private-inferenz-zweiter-host.md) | Zwei-Host-Deployment, LLM-Client, Messbarkeit, Lücken für 1B                                                                                                            |
| [1C-kontext-und-adapterpfad.md](./1C-kontext-und-adapterpfad.md)             | #456-Kontext, Verträge, Snapshot/Hash, Async-Pfad, Testlücken für 1C                                                                                                    |

`evidenz/` enthält Rohdaten und Protokolle je Auftrag (ohne Secrets, nur
synthetische Daten). Für 1C:

| Datei                                                                                                                                                                                                             | Inhalt                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [2026-10-24-tests.md](./evidenz/1C/2026-10-24-tests.md)                                                                                                                                                           | Protokoll Teil 1: Tests T1–T5                                                                                                                                                                                        |
| [2026-10-24-teil2.md](./evidenz/1C/2026-10-24-teil2.md)                                                                                                                                                           | Protokoll Teil 2: E1–E9, Messungen M1–M5 und V1                                                                                                                                                                      |
| [2026-10-24-teil3.md](./evidenz/1C/2026-10-24-teil3.md)                                                                                                                                                           | Protokoll Teil 3: E10–E15, Befund T3.1, Messungen M6, M7, M7b, M7c                                                                                                                                                   |
| [e15-widerlegt.patch](./evidenz/1C/e15-widerlegt.patch)                                                                                                                                                           | nicht eingecheckter Test zum widerlegten Fall E15                                                                                                                                                                    |
| [issue-t2-3-entwurf.md](./evidenz/1C/issue-t2-3-entwurf.md)                                                                                                                                                       | Issue-Entwurf zu Befund T2.3 (_aktualisiert 2026-11-09:_ angelegt als [#15](https://github.com/NiklasSkulll/arsnova.eu/issues/15))                                                                                   |
| [issue-t3-1-entwurf.md](./evidenz/1C/issue-t3-1-entwurf.md)                                                                                                                                                       | Issue-Entwurf zu Befund T3.1 (_aktualisiert 2026-11-09:_ angelegt als [#18](https://github.com/NiklasSkulll/arsnova.eu/issues/18))                                                                                   |
| [issue-cache-ram-entwurf.md](./evidenz/1C/issue-cache-ram-entwurf.md)                                                                                                                                             | _Aktualisiert 2026-11-05:_ Issue-Entwurf zum Prompt-Cache `--cache-ram` (_aktualisiert 2026-11-09:_ angelegt als [#14](https://github.com/NiklasSkulll/arsnova.eu/issues/14))                                        |
| [2026-11-05-labor.md](./evidenz/1C/2026-11-05-labor.md)                                                                                                                                                           | _Aktualisiert 2026-11-05:_ Protokoll Laborlauf Laptop (L1–L5)                                                                                                                                                        |
| [2026-11-06-trockenlauf-upstream.md](./evidenz/1C/2026-11-06-trockenlauf-upstream.md)                                                                                                                             | _Aktualisiert 2026-11-06:_ modellfreier Trockenlauf auf upstream `44c0a796` mit Rohdaten                                                                                                                             |
| [2026-11-09-labor-nachlauf.md](./evidenz/1C/2026-11-09-labor-nachlauf.md)                                                                                                                                         | _Aktualisiert 2026-11-09:_ Protokoll des 1C-Nachlaufs mit echter Runtime auf upstream `def56700` (N1–N6): Quality-Gate verwirft alle Modellantworten, OOM-Kill im 19. Auftrag                                        |
| [2026-11-05-labor-pc.md](./evidenz/1C/2026-11-05-labor-pc.md)                                                                                                                                                     | _Aktualisiert 2026-11-05:_ Protokoll Zusatzlauf PC mit Produktionslimits und Ursachenversuch U1                                                                                                                      |
| [labor-lauf.sh](./evidenz/1C/labor-lauf.sh), [labor-produktionslimits.override.yml](./evidenz/1C/labor-produktionslimits.override.yml), [labor-cache-aus.override.yml](./evidenz/1C/labor-cache-aus.override.yml) | _Aktualisiert 2026-11-05:_ Laborskript (Kalibrierung, Lauf, U1) und Compose-Überschreibungen                                                                                                                         |
| [messung/2026-11-05-\*](./evidenz/1C/messung/)                                                                                                                                                                    | _Aktualisiert 2026-11-05:_ Rohdaten der Laborläufe (JSON), U1 und Speicherprotokoll (CSV)                                                                                                                            |
| [labor-runbook.md](./evidenz/1C/labor-runbook.md)                                                                                                                                                                 | Runbook der Laborläufe gegen die private Runtime nach [specs/2026-10-25-1c-labor-design.md](./specs/2026-10-25-1c-labor-design.md) (_aktualisiert 2026-11-05:_ ~~noch offen, nicht freigegeben~~ Läufe durchgeführt) |
| [messung/auswertung.mjs](./evidenz/1C/messung/auswertung.mjs)                                                                                                                                                     | Auswertungsskript aller Messdateien                                                                                                                                                                                  |
| [messung/2026-10-24-messung.json.gz](./evidenz/1C/messung/2026-10-24-messung.json.gz)                                                                                                                             | Rohdaten Teil 2, Primärlauf                                                                                                                                                                                          |
| [messung/2026-10-24-messung-robustheit.json.gz](./evidenz/1C/messung/2026-10-24-messung-robustheit.json.gz)                                                                                                       | Rohdaten Teil 2, Robustheitslauf                                                                                                                                                                                     |
| [messung/2026-10-24-messung-teil3.json.gz](./evidenz/1C/messung/2026-10-24-messung-teil3.json.gz)                                                                                                                 | Rohdaten Teil 3, M6 und M7                                                                                                                                                                                           |
| [messung/2026-10-24-messung-teil3-m7b.json.gz](./evidenz/1C/messung/2026-10-24-messung-teil3-m7b.json.gz)                                                                                                         | Rohdaten Teil 3, M7b (nicht unabhängig von M7, siehe Protokoll)                                                                                                                                                      |
| [messung/2026-10-24-messung-teil3-m7c.json.gz](./evidenz/1C/messung/2026-10-24-messung-teil3-m7c.json.gz)                                                                                                         | Rohdaten Teil 3, M7c (unabhängige Seeds)                                                                                                                                                                             |
| [messung/2026-10-25-probelauf-1.json.gz](./evidenz/1C/messung/2026-10-25-probelauf-1.json.gz) und [-2](./evidenz/1C/messung/2026-10-25-probelauf-2.json.gz)                                                       | Probeläufe vor M6/M7, nur zur Prüfung des Messcodes, nicht ausgewertet                                                                                                                                               |

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

Stand der Recherche: 2026-10-16. Spätere Ergebnisse stehen in `evidenz/`.

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
  - Es gab keinen Fake-Server für Tests (inzwischen: Test-Runtime für 1C, siehe unten).
- **1C, Kontextpfad bis zur Inferenz:**
  - Snapshot und Hash. Vermutung damals: Jede Stimme ändert den Hash; inzwischen
    durch Tests belegt und eingegrenzt ([evidenz/1C](./evidenz/1C/)).
  - Der Async-Pfad.
  - Testlücken: Quelle mitten im Job gelöscht, langsamer Empfänger, volle
    Queue. Inzwischen abgedeckt durch E8, E5 und E6b sowie, für die volle
    Queue, durch E11 (Teil 3).

Alle Dossiers enthalten Code-Stellen (Datei:Zeile), Versuchsideen und Lücken.

## Qualitätsanspruch an PRs

- Die CI von kqc-real läuft auch in Niklas' Fork. Am 2026-10-16 wurde sie dort
  vollständig grün geprüft. Jede PR muss dort grün durchlaufen, bevor sie an
  kqc-real geht.
- Codex-Reviews sollen ebenfalls clean sein. **Noch offen:** Die Einrichtung
  muss Niklas als Repo-Owner machen (ChatGPT Codex Connector, dann
  `chatgpt.com/settings/code-review`).

## Offene Punkte

> **Aktualisiert 2026-11-05:** Die Baseline-Frage und die Laborinstanz sind
> geklärt ([Rahmendokument](./00-rahmen-und-pruefung.md#offene-fragen-an-den-prüfer)),
> die Laborläufe sind durchgeführt. Der aktuelle Stand der offenen Punkte zu 1C
> steht im [Ergebnisbericht, Abschnitt 9](./1C-ergebnis.md#9-offene-punkte-und-fragen-an-den-prüfer). Die beiden Fragen
> unten bleiben als ursprünglicher Stand stehen.

- Fragen an den Prüfer klären (siehe
  [00-rahmen-und-pruefung.md](./00-rahmen-und-pruefung.md#offene-fragen-an-den-prüfer)),
  vor allem diese:
  - Darf der aktuelle `main` die Baseline sein statt `v1.3.0`?
  - Was ist beim zweiten Host bereitgestellt, und wie bekommen wir Zugang?
- **Aufteilung 1A/1B/1C:** Am 2026-10-23 festgelegt (Option 1). Niklas ist X
  (1A und 1B Schritte 3–4), Jonas ist Y (1C und 1B Schritte 1–2). Eine
  Abstimmung mit dem Prüfer ist nicht nötig (mündliche Ansage in der
  Vorlesung, notiert 2026-10-24). Details in
  [01-aufteilung.md](./01-aufteilung.md#entscheidung-2026-10-23).

## Hinweis zur Entstehung

Die Dossiers 1A–1C wurden am 2026-10-16 agentengestützt erstellt (Claude Code,
Modell Claude Opus 5.5, mit Serena und codebase-memory-mcp auf Commit
`27966e75`). Zeilenangaben beziehen sich auf diesen Stand und müssen vor der
Übernahme ins Handout gegen die festgelegte Baseline geprüft werden.
