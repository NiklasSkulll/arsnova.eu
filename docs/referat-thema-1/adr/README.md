# Entscheidungsprotokolle (ADRs) zu Auftrag 1C

Diese ADRs halten jede Entscheidung aus Auftrag 1C (Kontext- und Adapterpfad der
Q&A-Zusammenfassung) fest: fachliche Ergebnisse, Labor-Befunde und methodische
Festlegungen. Jede ADR fasst zusammen und verlinkt auf die Quelle (Dossier,
Design, Protokoll, Rohdaten); Zahlen stehen nur mit Beleg. Einstieg in das
Gesamtergebnis: [`1C-ergebnis.md`](../1C-ergebnis.md).

Grundlage der Form: [Dokumentationsdesign](../specs/2026-11-05-1c-doku-design.md).

## Statuswerte

| Status           | Bedeutung                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `angenommen`     | Der bestehende Zustand wird mit Beleg beibehalten (Beibehaltungsempfehlung).                        |
| `empfohlen`      | Eine Änderung (Konfiguration, Betrieb, Verbesserung) wird empfohlen, ist aber **nicht umgesetzt**.  |
| `zurückgehalten` | Der Beleg reicht für eine Empfehlung nicht; Kandidaten sind benannt, die Entscheidung bleibt offen. |
| `methodisch`     | Festlegung zum Vorgehen (Baseline, Testumgebung, Laborparameter), keine Aussage über das Produkt.   |

Kein ADR beschreibt einen Produktivpatch: Auftrag 1C verlangt eine Empfehlung,
keinen Patch (siehe [ADR 1C-004](1C-004-empfehlung-statt-patch.md)).

## Nummernplan

| Bereich           | Inhalt                                   | Verantwortlich                                                                     |
| ----------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| `1C-001`–`1C-009` | Methodik (Baseline, Laborinstanz, Tests) | Laptop-Sitzung                                                                     |
| `1C-010`–`1C-019` | Fachliche Befunde aus Teil 1–3 und Labor | Laptop-Sitzung                                                                     |
| `1C-020`–`1C-029` | Labor (Läufe, Limits, Laufzeitbefunde)   | PC-Sitzung geplant; erstellt am Laptop (siehe [Eigenanteil](../1C-eigenanteil.md)) |

Dateiname: `1C-NNN-<kurztitel-kebab>.md`.

## Vorlage

```markdown
# 1C-NNN: <Titel>

- **Status:** <angenommen|empfohlen|zurückgehalten|methodisch> (2026-11-05)
- **Kategorie:** <Beibehaltung|Konfiguration|Betrieb|Verbesserung|Methodik>

## Kontext

Was war die Frage, wo im Code bzw. im Vorgehen, warum war sie offen?

## Entscheidung

Ein bis drei Sätze: was gilt bzw. was wird empfohlen.

## Alternativen

Verworfene oder offene Gegenvarianten mit dem Grund.

## Belege

Zahlen und Befunde, jeweils mit Link auf Anker, Commit oder Rohdatei.

## Ursachenkette (optional)

Beobachtung → Hypothese → Versuch → Ergebnis, wenn die Entscheidung aus einer
Fehlersuche folgt.

## Folgen

Kosten, Risiken, Gültigkeitsgrenzen, offene Punkte, zugehörige Issue-Entwürfe.
```

## Index

| Nr.                                                              | Titel                                                                                       | Status         | Kategorie     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------- | ------------- |
| [1C-001](1C-001-baseline-aktueller-main.md)                      | Baseline ist der aktuelle `main`, nicht `v1.3.0`                                            | methodisch     | Methodik      |
| [1C-002](1C-002-laborinstanz-eigener-rechner.md)                 | Laborinstanz ist der eigene Rechner, Pfad `llm-http`                                        | methodisch     | Methodik      |
| [1C-003](1C-003-teststrategie-modellfrei.md)                     | Teststrategie modellfrei mit Test-Runtime, gekennzeichnete Negativproben, Echtpfad im Labor | methodisch     | Methodik      |
| [1C-004](1C-004-empfehlung-statt-patch.md)                       | Ergebnisform ist eine Empfehlung, kein Produktivpatch                                       | methodisch     | Methodik      |
| [1C-005](1C-005-e15-widerlegung-bleibt-stehen.md)                | Widerlegung von E15 bleibt stehen, der Fall wird nicht umformuliert                         | methodisch     | Methodik      |
| [1C-010](1C-010-nachpruefung-nach-inferenz-beibehalten.md)       | Nachprüfung nach der Inferenz (prepare (3)) beibehalten                                     | angenommen     | Beibehaltung  |
| [1C-011](1C-011-strikte-vertragsvalidierung-beibehalten.md)      | Strikte Vertragsvalidierung beibehalten                                                     | angenommen     | Beibehaltung  |
| [1C-012](1C-012-entkopplung-host-aufruf-beibehalten.md)          | Entkopplung von Host-Aufruf und Modellantwort beibehalten                                   | angenommen     | Beibehaltung  |
| [1C-013](1C-013-vorschau-gleich-nutzlast-beibehalten.md)         | Host-Vorschau gleich gesendeter Nutzlast, Packing beibehalten                               | angenommen     | Beibehaltung  |
| [1C-014](1C-014-byte-schaetzung-kontextbudget-pruefen.md)        | Byte-Schätzung des Kontextbudgets: Verbesserung prüfen                                      | empfohlen      | Verbesserung  |
| [1C-015](1C-015-themen-snapshot-unterscheidbarer-zustand.md)     | Unterscheidbarer Zustand für einen unbrauchbaren Themen-Snapshot (T2.3)                     | empfohlen      | Verbesserung  |
| [1C-016](1C-016-zeitabhaengiger-hash-blitzlicht.md)              | Zeitabhängiger Hash bei live Blitzlicht-Runde beheben (T3.1)                                | empfohlen      | Verbesserung  |
| [1C-017](1C-017-m7-empfehlung-zurueckgehalten.md)                | M7-Vorhersagemodell verfehlt, Empfehlung zurückgehalten                                     | zurückgehalten | Verbesserung  |
| [1C-019](1C-019-endstatus-echter-pfad-beibehalten.md)            | Endstatus auf dem echten Pfad ohne Datenänderung beibehalten (L4)                           | angenommen     | Beibehaltung  |
| [1C-020](1C-020-timeout-300-s-und-kalibrierungsregel.md)         | Timeout 300 s im Laptop-Lauf, Kalibrierungsregel für den Zusatzlauf                         | methodisch     | Methodik      |
| [1C-021](1C-021-zusatzlauf-produktionslimits-zweiter-rechner.md) | Zusatzlauf mit Produktionslimits auf einem zweiten Rechner                                  | methodisch     | Methodik      |
| [1C-022](1C-022-codestand-eingefroren-9f230abc.md)               | Codestand beider Laborläufe eingefroren auf `main@9f230abc`                                 | methodisch     | Methodik      |
| [1C-023](1C-023-release-timeout-90-s-zu-kurz.md)                 | Release-Timeout von 90 s reicht für CPU-Inferenz auf beiden Laborrechnern nicht (A4)        | empfohlen      | Betrieb       |
| [1C-024](1C-024-prompt-cache-ram-begrenzen.md)                   | Prompt-Cache `--cache-ram` begrenzen oder abschalten (L6, U1)                               | empfohlen      | Konfiguration |

Nummern ohne Datei (1C-006–009, 1C-018, 1C-025–029) sind frei; die Lücke ist gewollt, damit der Nummernplan der Bereiche erhalten bleibt.
