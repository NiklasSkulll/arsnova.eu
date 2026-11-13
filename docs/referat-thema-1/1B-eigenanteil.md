# 1B: Eigenanteil und KI-Offenlegung

- **Datum:** 2026-11-13 (Entwurf)
- **Zweck:** Wer hat in Auftrag 1B was getan, welche Rolle hatte die KI, und was hat der Autor entschieden oder geprüft? Zentrale Aufträge an die KI stehen sinngemäß, nicht als Chat-Auszug.

## Schritte 1–2: Jonas Weirauch (Rolle Y)

### Lesehilfe

- **KI** ist durchgängig Claude Code (Anthropic) mit Serena und codebase-memory-mcp, Modell Claude Opus 5.5; Teilaufgaben liefen in Subagenten (Opus, ein Entwurf mit Sonnet).
- **Reviews** waren KI-Sitzungen, keine unabhängigen menschlichen Gutachten.
- Ein Commit von Jonas Weirauch sagt nichts darüber, ob der Inhalt von der KI stammt; das steht in den Tabellen unten.

### Was der Autor entschieden hat

| Entscheidung                                                                                                        | Beleg                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auftrag: Summary V2 mit der 1C-Referenzfixture, ausgelöst über die echte App per tRPC                               | [Design Abschnitt 4](specs/2026-11-12-1b-zwei-host-design.md#4-der-auftrag-autor)                                                                 |
| Kernaussagen B und C, Gültigkeitsgrenze D; Timeout-Regel nach Kalibrierung                                          | [Design Abschnitte 6 und 7](specs/2026-11-12-1b-zwei-host-design.md#6-hypothesen-messgrößen-regeln-autor-aussagen-b-und-c-schwellen-ki-vorschlag) |
| Aufbau voll automatisiert, unter Linux und Windows gleich, mit Größenempfehlung aus Kernen und RAM                  | [Plan, Nachtrag Task 12](specs/2026-11-12-1b-zwei-host-plan.md), [ADR 1B-010](adr/1B-010-aufbau-automatisiert-mit-groessenempfehlung.md)          |
| Laptop im Energiesparprofil für Aufbau und Entwicklung, Performance nur für Kalibrierung und gewerteten Lauf        | [Runbook, Abschnitt 4](evidenz/1B/runbook.md#4-energieprofil)                                                                                     |
| Reihenfolge in der Nacht 2026-11-13: erst Linux-Labor und gewerteter Lauf, Windows-Volltest danach                  | Absprache mit der KI, [Windows-Test](evidenz/1B/2026-11-13-windows-test.md)                                                                       |
| Gewerteten Lauf wiederholen, nachdem Hintergrund-Updates Versuch 2 gestört hatten                                   | [Laufprotokoll, Ablauf](evidenz/1B/2026-11-13-lauf.md#ablauf-und-abweichungen)                                                                    |
| Prüfschleifen für die Diagramme: je ein neuer fachlicher, danach ein neuer visueller Prüfer, bis nur Banales bleibt | [1B-Diagramme](1B-diagrams.md)                                                                                                                    |

Hypothesenschwellen, Messmethode per Mitschnitt und Zeitzerlegung sind KI-Vorschläge, die der Autor mit dem Design freigegeben hat (im Design als „KI-Vorschlag“ markiert).

### Was die KI gemacht hat

- Skripte für Aufbau, Prüfung und Lauf (`labor.sh`, `labor.ps1`, `vm/`, `llm-start.sh`, `app-start.sh`, `pruefen.sh`, `lauf.sh`, `treiber.mjs`), Auswertung mit Tests (`messung/`), Windows-Testaufbau (`vm/windows-test/`).
- Protokolle, Runbook, Diagramme und dieser Entwurf nach den Vorgaben des Autors.
- Lauf am 2026-11-13: Fehlersuche und Fixes nach den Versuchen 1 (Host-Token) und 2 (Hintergrund-Updates), Analyse der verworfenen Modellantworten aus dem Mitschnitt, Laufprotokoll.
- Reviews: ein Review der ganzen Branch (vier behobene Punkte), fünf fachliche und sechs visuelle Prüfrunden der Diagramme.
- Entscheidungen, die die KI in der Nacht 2026-11-13 im Auftrag des Autors getroffen hat (Arbeitsprotokoll der KI, nicht im Repo), u. a.: Hypothesen gelten als „nicht bewertbar“, wenn einem Auftrag eine Komponente fehlt; Topologie hochkant. _Aktualisiert 2026-11-13:_ vom Autor bestätigt, ebenso der getrennte Bericht von Kalt- und Warmfall (Option a).

### Prüfung durch den Autor

Offen.

## Schritte 3–4: Niklas

_Folgt von Niklas._
