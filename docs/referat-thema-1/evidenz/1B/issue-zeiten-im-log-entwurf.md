# Issue-Entwurf: Summary-Log zeigt nicht, wohin die Zeit eines Auftrags geht

> **Status:** Entwurf, nicht angelegt. Angelegt wird erst nach Freigabe durch den Autor; Ort (kqc-real oder Fork) entscheidet er. Grundlage: [Aufbauprotokoll, Befund 6](2026-11-12-aufbau.md#befunde-für-kernaussage-c), [Laufprotokoll, Befund C](2026-11-13-lauf.md#befund-c-was-der-betrieb-sieht). Entworfen mit Claude Code (Modell Claude Opus 5.5).

**Vorgeschlagener Titel:** `Q&A-Zusammenfassung: Inferenz- und Wartezeiten der Runtime im Log ausweisen`

---

## Beobachtung

Mit der Runtime auf einem zweiten Host (Release 1.3) ist im Betrieb nicht erkennbar, ob ein langsamer Auftrag an Netz, Adapter oder Inferenz liegt:

- Der Client nimmt `timings` der Runtime an (`apps/backend/src/lib/openWeightLlmClient.ts` Z. 70, `z.record(...).optional()`), der Summary-Pfad liest sie aber nicht aus (`qaSummaryRuntimeAdapter.ts` Z. 129).
- `qa_summary:completed` enthält nur `status`, `effectiveMode`, `fallbackReason` und `latencyMs` (`qaSummaryQueue.ts` Z. 364–369).

Im Labor ließen sich die Anteile nur mit Mitschnitten auf beiden Hosts trennen ([ADR 1B-006](../../adr/1B-006-zeitmessung-per-mitschnitt.md)). Ergebnis dort: Inferenz 99,9 %, Netz 0,43 ms im Median ([Laufprotokoll](2026-11-13-lauf.md)). Ohne diese Angaben im Log kann der Betrieb einen Netzfehler nicht von einer langsamen CPU unterscheiden.

## Vorschlag

1. Aus der Runtime-Antwort `timings.prompt_ms`, `timings.predicted_ms`, `timings.prompt_n`, `timings.predicted_n` und `timings.cache_n` übernehmen (falls vorhanden, sonst `null`).
2. Die Laufzeit des HTTP-Aufrufs im Client messen (`elapsedMs`).
3. Beides ohne Prompt- oder Antworttext in `qa_summary:completed` schreiben; für Lernziele und Labels analog.

**Kosten:** gering (Felder durchreichen, ein Log-Feld). **Risiko:** gering; kein Inhalt im Log, nur Zahlen. **Rückweg:** Revert.

## Gültigkeitsgrenze

Produktionscode `a19ca70f`; die zitierten Zeilen sind am Branch-Stand `ed9e9a75` unverändert. Gemessen auf einem Laptop mit zwei VMs (ThinkPad P50), nicht auf Produktionshardware.
