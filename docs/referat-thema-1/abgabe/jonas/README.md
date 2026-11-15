# Jonas: Deck und Folien bauen, Zahlen fürs Handout erzeugen

Dieser Ordner erzeugt reproduzierbar, was Jonas für Thema 1 vorträgt: das gemeinsame Browser-Deck, die
PDF-Fassungen, die Sprechnotizen und ein Manifest mit Prüfsummen. Das Handout entsteht seit 2026-11-15 in
PaperLab (privates Repo, Typ `referat`, IU-Format nach Gestaltungs- und Zitierleitfaden); dieser Ordner
liefert ihm Zahlen und Abbildungen.

## Bauen

```sh
node docs/referat-thema-1/abgabe/jonas/bau.mjs [--niklas1 <pdf>] [--niklas2 <pdf>] \
  [--niklas1-stand <text>] [--niklas2-stand <text>] [--ausgabe <ordner>]
```

Ohne Argumente landen die Ausgaben in `ausgabe/` neben dieser Datei. Niklas' Teil 1A kommt standardmäßig
aus `abgabe/1A-folien.pdf` (falls vorhanden), sonst steht eine Platzhalterfolie im Deck. Niklas' Teil 1B 3–4
gibt es nur mit `--niklas2`. Die `--niklasN-stand`-Texte landen im Manifest (zum Beispiel Zweig und Commit).

Tests: `node --test docs/referat-thema-1/abgabe/jonas/*.test.mjs`.

## Handout (PaperLab)

```sh
node docs/referat-thema-1/abgabe/jonas/handout-latex.mjs <PaperLab-Arbeitsordner>/generated
```

schreibt `zahlen.tex` (ein `\newcommand` je Wert) und die Abbildungen `abb-weg.pdf`, `abb-zeit.pdf` (Arial,
TrueType über `rsvg-convert`). Bauen, prüfen und die Abgabefassung mit Name und Matrikelnummer erzeugen
PaperLab (`./paperlab check|final`); Name und Matrikelnummer stehen nur dort, nie in diesem Repo.

## Belege und Literatur

Jede Folie trägt in der Fußzeile eine Quellenzeile mit Kurzbelegen nach dem IU-Zitierleitfaden, dahinter
Rechner und Commit. J16 zeigt das vollständige Literaturverzeichnis. Die Einträge stehen in
`literatur.mjs`; sie gleichen denen im Handout (`literatur.test.mjs` prüft das gegen dessen `main.bib`).

## Voraussetzungen

- Node 24 und die Abhängigkeiten des Repos (Playwright mit Chromium, `pdf-parse`, `prettier`).
- `pdftoppm` (Poppler) rastert Niklas' PDF-Seiten für das Deck. Fehlt es, erscheint dort ein Platzhalter.
- Für das Handout: `rsvg-convert` und `pdffonts`.

## Datenherkunft

Jede Zahl stammt aus den eingecheckten Ergebnisdateien in `evidenz/1B/messung/` und
`evidenz/1C/messung/` oder aus den dokumentierten Festwerten in `folien.mjs` (mit Beleg). Die genauen
Eingaben mit SHA-256 stehen in `ausgabe/manifest.json`; dort stehen auch die Ausgaben, die Seitenzahlen und
die Herkunft von Niklas' Teilen.

## Ausgaben (`ausgabe/`)

| Datei                  | Inhalt                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| `jonas-deck.html`      | Gemeinsames Deck zum Vortragen, selbstständig (Schriften, Bilder, Clip)         |
| `gemeinsames-deck.pdf` | Druck des gemeinsamen Decks, eine Seite je Folie                                |
| `jonas-folien.pdf`     | Nur Jonas' Folien (J1–J13, J15, J16) und Reserve, einzeln zuordenbar            |
| `sprechnotizen.md`     | Notizen je Folie mit Sekunden, kumulierter Zeit und Kürzung auf die Kurzfassung |
| `manifest.json`        | SHA-256 aller Ein- und Ausgaben, Seitenzahlen                                   |
