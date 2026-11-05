# Entscheidungsprotokolle (ADRs) zu Auftrag 1C

Diese ADRs halten jede Entscheidung aus Auftrag 1C (Kontext- und Adapterpfad der
Q&A-Zusammenfassung) fest: fachliche Ergebnisse, Labor-Befunde und methodische
Festlegungen. Jede ADR fasst zusammen und verlinkt auf die Quelle (Dossier,
Design, Protokoll, Rohdaten); Zahlen stehen nur mit Beleg. Einstieg in das
Gesamtergebnis: `1C-ergebnis.md` (folgt).

Grundlage der Form: [Dokumentationsdesign](../specs/2026-11-05-1c-doku-design.md).

## Statuswerte

| Status           | Bedeutung                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `angenommen`     | Der bestehende Zustand wird mit Beleg beibehalten (Beibehaltungsempfehlung).                        |
| `empfohlen`      | Eine Änderung (Konfiguration, Betrieb, Verbesserung) wird empfohlen, ist aber **nicht umgesetzt**.  |
| `zurückgehalten` | Der Beleg reicht für eine Empfehlung nicht; Kandidaten sind benannt, die Entscheidung bleibt offen. |
| `methodisch`     | Festlegung zum Vorgehen (Baseline, Testumgebung, Laborparameter), keine Aussage über das Produkt.   |

Kein ADR beschreibt einen Produktivpatch: Auftrag 1C verlangt eine Empfehlung,
keinen Patch (siehe ADR 1C-004).

## Nummernplan

| Bereich           | Inhalt                                   | Verantwortlich |
| ----------------- | ---------------------------------------- | -------------- |
| `1C-001`–`1C-009` | Methodik (Baseline, Laborinstanz, Tests) | Laptop-Sitzung |
| `1C-010`–`1C-019` | Fachliche Befunde aus Teil 1–3 und Labor | Laptop-Sitzung |
| `1C-020`–`1C-029` | Labor (Läufe, Limits, Laufzeitbefunde)   | PC-Sitzung     |

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

| Nr. | Titel | Status | Kategorie |
| --- | ----- | ------ | --------- |
