# 1C-018: Quality-Gate verwirft die echten Antworten des ausgelieferten Modells (N4)

- **Status:** empfohlen (2026-11-09), nicht umgesetzt; Issue [#13](https://github.com/NiklasSkulll/arsnova.eu/issues/13) im Fork
- **Kategorie:** Verbesserung

## Kontext

Upstream `96b2e46e` (PR #643) hat für die Q&A-Zusammenfassung die Instruktion v5 und ein Quality-Gate eingeführt ([ADR 1C-022](1C-022-codestand-eingefroren-9f230abc.md), [ADR 1C-025](1C-025-codestand-auf-upstream-aktualisiert.md)). Das Gate `hasAcceptableQaSummaryQuality` (`apps/backend/src/lib/qaSummaryQuality.ts` am Stand `def56700`) verlangt mindestens zwei Aussagen (Z. 65) in der Form „Lead: Text“ mit Trenner nach höchstens 48 Zeichen (Z. 20), verschiedene Leads, einen vollständigen Satz ab 12 Zeichen (Z. 51) und keine technischen Metaangaben (`TECHNICAL_META_PATTERNS`). Besteht eine sonst gültige Antwort nicht, fällt der Adapter mit `invalid_response` auf die extraktive Zusammenfassung zurück (`runPreparedQaSummary` in `qaSummaryRuntimeAdapter.ts`, Aufruf Z. 133). Die Instruktion v5 (`QA_SUMMARY_TECHNICAL_INSTRUCTION_TEXT`, `moderationSummaryContext.ts` Z. 45) schreibt dazu vor: „Write 2 to 4 concise statements exactly as "Specific topic: Complete sentence."“, in `context.locale`, ohne Metaangaben. Ob das ausgelieferte Modell diese Form trifft, prüft upstream nicht; der Code nimmt Prompt-Qualität ausdrücklich aus.

Der Nachlauf hatte dafür eine vorab festgelegte Regel ([Nachlauf-Design 5](../specs/2026-11-06-1c-nachlauf-design.md#5-entscheidungsregeln)): Anteil `full-context` < 80 % und häufigster Grund `invalid_response` → Befund, Verbesserung prüfen, nicht umsetzen, verworfene Antworten qualitativ einordnen.

## Entscheidung

**Befund:** Mit Qwen3-4B-Instruct-2507 (Q4_K_M), Instruktion v5 und dem Gate erreicht die Referenzfixture nie den vollen Modellpfad. Jeder Auftrag mit Modellantwort endet `ready/extractive/invalid_response`; Lehrende sehen immer den Fallback.

**Empfehlung, nicht umgesetzt:** Instruktion, Grammatik und Gate gemeinsam am ausgelieferten Modell abstimmen und mit echten Antworten testen, bevor der Pfad als Modellzusammenfassung gilt. Ansatzpunkte, keiner davon gemessen:

- **Grammatik:** Die Form „Lead: Text“ in der Ausgabegrammatik erzwingen, statt sie nur in der Instruktion zu verlangen. Ob die Grammatik das ausdrücken kann und was es an Inferenzzeit kostet, ist nicht geprüft.
- **Instruktion:** Den Platzhalter „Specific topic“ durch ein Beispiel mit einem echten, sichtbar austauschbaren Lead ersetzen; das 4B-Modell übernimmt den Platzhalter wörtlich.
- **Gate:** Prüfen, ob „verschiedene Leads“ und die Lead-Pflicht für dieses Modell die richtige Schwelle sind, oder ob ein Teil der Antworten mit gekürzter Darstellung angezeigt werden kann.
- **Regressionstest:** Eine Labormessung wie diese (echte Runtime, Anteil `full-context`) als Abnahme für Änderungen an Instruktion, Grammatik oder Gate.

## Alternativen

- **Gate entfernen.** Verworfen: Die Antworten der ruhigen Läufe sprechen über Moderationsstatus und ausgelassene Fragen und sind auf Englisch. Das Gate verhindert, dass so etwas Lehrenden als Zusammenfassung gezeigt wird; es arbeitet wie entworfen.
- **Größeres Modell.** Nicht untersucht; auf CPU-Hardware stiegen damit Inferenzzeit und Speicherbedarf, die schon jetzt an Grenzen stoßen ([1C-023](1C-023-release-timeout-90-s-zu-kurz.md), [1C-024](1C-024-prompt-cache-ram-begrenzen.md)).
- **Beibehaltung wie [1C-019](1C-019-endstatus-echter-pfad-beibehalten.md).** Nach der Regel ausgeschlossen: 0 % statt mindestens 80 % `full-context`.

## Belege

- **N4:** 17 × `ready/extractive/invalid_response`, 3 × `unavailable` (OOM); Anteil `full-context` 0 von 20 (Wilson 0–16,1 %), k(`source_changed`) = 0 ([N4](../evidenz/1C/2026-11-09-labor-nachlauf.md#n4-endstatus)). L5: TEMPO 5 von 5 `invalid_response`, YESNO 5 von 5 `source_changed` ([N5](../evidenz/1C/2026-11-09-labor-nachlauf.md#n5-t31-auf-dem-echten-pfad)).
- **Nachprüfung:** Alle 28 aufgezeichneten Antworten bestehen die Prüfungen des Clients (Schema, Task-Typ, Quellen-IDs) und scheitern alle am Gate (Locale `de`, Stand `def56700`, mit den echten Funktionen nachgerechnet) ([qualitative Einordnung](../evidenz/1C/2026-11-09-labor-nachlauf.md#n4-endstatus); Rohdaten [`2026-11-09-labor-nachlauf.json.gz`](../evidenz/1C/messung/2026-11-09-labor-nachlauf.json.gz), Feld `rawResponseBody`).
  - Ruhige Läufe (18): 72 Aussagen ohne einen Doppelpunkt, alle Englisch, je 2–4 Aussagen über Metaangaben.
  - L5 (10): 5 Antworten mit viermal dem wörtlichen Lead „Specific topic“, 5 ohne Lead.
- **Gegenprobe vom 2026-11-05** auf `9f230abc` (Instruktion v2, ohne Gate): 19 von 20 `full-context`, kein `invalid_response` ([L4 Laptop](../evidenz/1C/2026-11-05-labor.md#l4-endstatus)).
- **Upstream-Kommentar** über `QA_SUMMARY_TECHNICAL_INSTRUCTION_TEXT` in `moderationSummaryContext.ts`: „Prompt quality and didactic efficacy are deliberately not claimed by issue #456 and remain a separate evaluation.“

## Ursachenkette

1. **Beobachtung (Trockenlauf):** Die Test-Runtime mit einer Aussage endet am Gate `invalid_response` ([Trockenlauf](../evidenz/1C/2026-11-06-trockenlauf-upstream.md#ursachen-der-roten-tests)); die Test-Runtime wurde angepasst (1C-025). Offen blieb, ob das echte Modell die Form trifft.
2. **Erwartung im Design:** Anteil `full-context` ≥ 80 %, Gegenregel vorab festgelegt.
3. **Versuch (Nachlauf):** 0 von 20.
4. **Einordnung:** Die Antworten sind gültiges JSON, aber ohne die verlangte Form. Ruhige Läufe ignorieren Sprache, Form und Verbote der Instruktion; L5 übernimmt den Platzhalter wörtlich. Das passt zu einem kleinen Modell, dem die Form nur in Prosa vorgegeben wird.
5. **Entscheidung:** Befund, Empfehlung oben.

## Folgen

- **Kosten:** Abstimmung von Instruktion, Grammatik oder Gate plus eine Abnahmemessung mit echter Runtime. Keine Kosten für den Betrieb, solange nichts geändert wird; Lehrende erhalten dann aber nur den extraktiven Fallback.
- **Risiko einer Änderung:** Eine lockere Schwelle zeigt Antworten wie die der ruhigen Läufe an. Eine erzwungene Grammatik kann die Inferenz verlängern.
- **Gültigkeitsgrenzen:** eine Fixture (sechs Fragen, `de`), ein Modell, ein Rechner, n = 20 bzw. 5; keine Bewertung der inhaltlichen Qualität. Mit realen Daten oder anderen Locales kann der Anteil anders liegen; dass er bei derselben Instruktion über 80 % liegt, ist nach diesem Lauf nicht zu erwarten.
- **Folge für weitere Messungen** auf einem Inferenz-Host (etwa in [1B](../1B-private-inferenz-zweiter-host.md)): Ohne Änderung ist dort mit diesem Modell `invalid_response` zu erwarten; Zeiten und Speicher bleiben aussagekräftig, der Endstatus nicht.
