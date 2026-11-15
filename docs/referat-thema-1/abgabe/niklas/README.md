# Entwurf: Niklas' Folien im Deck-Stil

Jonas' Vorschlag für das Treffen am 2026-11-16, **nicht abgestimmt**. Niklas' eigene Abgabe bleibt
`abgabe/1A-folien.pdf`; das abgestimmte Deck baut weiter [`jonas/bau.mjs`](../jonas/README.md).

- **1A (N1–N9):** Niklas' Inhalte und Befunde als native Folien im gemeinsamen Deck. Jede Zahl liest
  [`daten-1a.mjs`](daten-1a.mjs) aus seiner
  [`auswertung.json`](../../evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json), auf
  denselben Wegen wie sein Renderer `scripts/load/render-resource-isolation-pdfs.mjs`. Kurzbelege nach ZL aus
  [`literatur-1a.mjs`](literatur-1a.mjs), Sprechnotizen in Niklas' Stimme.
- **1B 3–4 (M1–M5):** Vorlage mit Platzhaltern in eckigen Klammern ([`folien-1b34.mjs`](folien-1b34.mjs)).
- **Befunde:** [`BEFUNDE-1A.md`](BEFUNDE-1A.md), je Punkt mit Vorschlag und ob der Entwurf ihn umsetzt.

## Bauen und prüfen

```sh
node docs/referat-thema-1/abgabe/niklas/bau-entwurf.mjs     # → ausgabe/
node --test docs/referat-thema-1/abgabe/niklas/*.test.mjs
```

Ausgaben in `ausgabe/`: `entwurf-deck.html` (ganzes Deck mit Niklas' Teilen nativ), `entwurf-1a.pdf` (nur
Niklas' Folien), `sprechnotizen-1a.md`. Die Tests gleichen die Zahlen mit Niklas' Befunden ab und prüfen
Layout, Kurzbelege, Literatur und den Druckauszug.

## Übernehmen

Will Niklas den Entwurf nutzen, gehören die Dateien ihm: Texte in `folien-1a.mjs` ändern, neu bauen. Für das
gemeinsame Deck bekäme `jonas/bau.mjs` dann eine Option, diese Folien statt der PDF-Seiten einzubinden
(`baueDeck` nimmt beides an).
