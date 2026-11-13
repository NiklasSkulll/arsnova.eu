# Issue-Entwurf: Ablehnung durch das Qualitätstor der Zusammenfassung schreibt keine Logzeile

> **Status:** Entwurf, nicht angelegt. Angelegt wird erst nach Freigabe durch den Autor; Ort (kqc-real oder Fork) entscheidet er. Ergänzt [#13](https://github.com/NiklasSkulll/arsnova.eu/issues/13) (Qualitätstor verwirft echte Antworten, [ADR 1C-018](../../adr/1C-018-quality-gate-verwirft-echte-antworten.md)) um die Beobachtbarkeit. Grundlage: [Laufprotokoll, Befund](2026-11-13-lauf.md#befund-jede-modellantwort-verworfen). Entworfen mit Claude Code (Modell Claude Opus 5.5).

**Vorgeschlagener Titel:** `Q&A-Zusammenfassung: Grund einer Ablehnung durch das Qualitätstor protokollieren`

---

## Beobachtung

Im Zwei-Host-Lauf endeten alle Aufträge mit `effectiveMode: extractive` und `fallbackReason: invalid_response`, obwohl die Runtime vollständig antwortete (`finish_reason: stop`). Den Grund fand erst die Auswertung des Mitschnitts: Keine Aussage hatte die Form „Stichwort: Text“ (`qaSummaryQuality.ts` Z. 20, Trenner in den ersten 48 Zeichen).

- `qaSummaryRuntimeAdapter.ts` Z. 133: `hasAcceptableQaSummaryQuality(...)` gibt nur `false` zurück; der Fallback in Z. 147–150 meldet `invalid_response`, ohne zu loggen.
- Die Warnung `qa_summary:invalid_model_response` gibt es nur für Parse-Fehler im Client (`openWeightLlmClient.ts` Z. 431–433).

`invalid_response` bedeutet damit zwei verschiedene Dinge (Antwort nicht parsebar oder Antwort vom Qualitätstor abgelehnt), und der zweite Fall ist im Log nicht zu sehen.

## Vorschlag

1. `hasAcceptableQaSummaryQuality` liefert einen Grund (etwa `missing_label_form`, `locale_mismatch`) statt nur `boolean`.
2. Der Adapter schreibt bei Ablehnung eine Warnung mit Grund und Zahl der betroffenen Aussagen, ohne Text.
3. Optional ein eigener `fallbackReason` (etwa `quality_rejected`) im Schema in `libs/shared-types`.

**Kosten:** gering. **Risiko:** gering; ein neuer `fallbackReason` müsste in Vorschau-UI und allen fünf Locales ergänzt werden. **Rückweg:** Revert.

## Gültigkeitsgrenze

Produktionscode `a19ca70f`, Zeilen am Branch-Stand `ed9e9a75` geprüft. Modell Qwen3-4B nach ADR-0035; mit anderen Modellen nicht geprüft.
