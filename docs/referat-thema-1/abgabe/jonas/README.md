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

Ohne Argumente landen die Ausgaben in `ausgabe/` neben dieser Datei. Niklas' Teile (1A, 1B 3–4) kommen
standardmäßig nativ aus [`../niklas/`](../niklas/README.md); dazu entstehen `niklas-folien.pdf` und
`sprechnotizen-niklas.md`. Reihenfolge im Deck: G0 (Jonas eröffnet), J1–J15, Niklas 1A und 1B 3–4, G9
(gemeinsames Fazit, spricht Niklas), Literatur (J16, NL), Reserve. `--niklas1`/`--niklas2` ersetzen einen
Teil durch die Seiten eines PDFs (Rückfallweg); die `--niklasN-stand`-Texte landen dann im Manifest.

Tests: `node --test docs/referat-thema-1/abgabe/jonas/*.test.mjs`.

## Handout (PaperLab)

```sh
node docs/referat-thema-1/abgabe/jonas/handout-latex.mjs <PaperLab-Arbeitsordner>/generated
```

schreibt `zahlen.tex` (ein `\newcommand` je Wert) und die Abbildungen `abb-weg.pdf`, `abb-zeit.pdf` (Arial,
TrueType über `rsvg-convert`). Bauen, prüfen und die Abgabefassung mit Name und Matrikelnummer erzeugen
PaperLab (`./paperlab check|final`); Name und Matrikelnummer stehen nur dort, nie in diesem Repo.

## Belege und Literatur

Jede Folie trägt in der Fußzeile eine Quellenzeile mit Kurzbelegen nach dem IU-Zitierleitfaden, in einer
Zeile; Rechner und Commit stehen in `quelle` (Sprechnotizen) und im Manifest. J16 zeigt das vollständige
Literaturverzeichnis als Anhang nach G9. Die Einträge stehen in
`literatur.mjs`; sie gleichen denen im Handout (`literatur.test.mjs` prüft das gegen dessen `main.bib`).

## Clip für J13 (`medien/`)

`medien/clip.webm` ist die Laboraufnahme aus [`evidenz/1B/2026-11-15-clip.md`](../../evidenz/1B/2026-11-15-clip.md)
(Lauf 4, auf den Dialog zugeschnitten, 848 × 800). Die letzte knappe Sekunde der Aufnahme (ab Bild 448) zeigte das
Schließen des Browserfensters: Der Dialog schrumpfte in einen grauen Rand, und das Endbild, auf das der Vortragende
per Taste springt, war abgeschnitten. Neu geschnitten am 2026-11-16 aus der bisherigen Datei, nur am Ende gekürzt
(erste 448 Bilder bei 25 fps, 17,92 s), sonst unverändert:

```sh
ffmpeg -i clip-vorher.webm -frames:v 448 -an -c:v libvpx-vp9 -b:v 0 -crf 30 -row-mt 1 \
  -deadline good -cpu-used 2 clip.webm
```

Das letzte Bild entspricht `clip-standbild.png` (Druckfassung). Der Clip startet nur auf Tastendruck; ein Druck während
er läuft springt auf das letzte Bild (`deck.js`, `clipSchritt`).

## Voraussetzungen

- Node 24 und die Abhängigkeiten des Repos (Playwright mit Chromium, `pdf-parse`, `prettier`).
- `pdftoppm` (Poppler) rastert Niklas' PDF-Seiten für das Deck. Fehlt es, erscheint dort ein Platzhalter.
- Für das Handout: `rsvg-convert` und `pdffonts`.

## Sprechnotizen, Sprungplan, roter Faden

- Jede Folie hat zwei Fassungen: `stichpunkte` (3–6, zum freien Vortrag, Zahlen mit Einheit) und `notiz`
  (Fließtext zum Üben). `[Weiter]` markiert jeden Tastendruck einer Aufbaustufe (J9, J15; bei Niklas N6, N7).
- Der Sprungplan steht oben in den Sprechnotizen jeder Person, gezählt ab ihrer ersten Folie: Jonas muss J13
  und J15 bis 9:00 min erreichen, Niklas N10, 1B 3–4 und G9. Überschreitet die Langfassung etwa 10:30 min,
  steht dort ein Budgethinweis.
- G0 zeigt den Fahrplan der vier Teile (`TEILE` in `folien.mjs`); dieselben Teile stehen klein oben rechts
  auf jeder Hauptfolie (Teilleiste, `deck.mjs`), der aktuelle Teil unterstrichen. G9 nimmt die Leitfrage von
  G0 wörtlich wieder auf.

## Datenherkunft

Jede Zahl stammt aus den eingecheckten Ergebnisdateien in `evidenz/1B/messung/` und
`evidenz/1C/messung/` oder aus den dokumentierten Festwerten in `folien.mjs` (mit Beleg). Die genauen
Eingaben mit SHA-256 stehen in `ausgabe/manifest.json`; dort stehen auch die Ausgaben, die Seitenzahlen und
die Herkunft von Niklas' Teilen.

## Ausgaben (`ausgabe/`)

| Datei                                               | Inhalt                                                                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `jonas-deck.html`                                   | Gemeinsames Deck zum Vortragen, selbstständig (Schriften, Bilder, Clip)         |
| `gemeinsames-deck.pdf`                              | Druck des gemeinsamen Decks, eine Seite je Folie                                |
| `jonas-folien.pdf`                                  | Nur Jonas' Folien (J1–J10, J12, J13, J15, J16) und Reserve, einzeln zuordenbar  |
| `sprechnotizen.md`                                  | Notizen je Folie mit Sekunden, kumulierter Zeit und Kürzung auf die Kurzfassung |
| `sprechnotizen-niklas.md`                           | dasselbe für Niklas (1A, 1B 3–4, G9), mit eigenem Sprungplan                    |
| `sprechkarten-jonas.pdf`, `sprechkarten-niklas.pdf` | Sprechkarten zum Ausdrucken (A4): je Folie nur die Stichpunkte mit Startzeit    |
| `manifest.json`                                     | SHA-256 aller Ein- und Ausgaben, Seitenzahlen                                   |

## Abgabe mit Matrikelnummern (nur lokal)

Die Prüfung verlangt Name und Matrikelnummer aller Gruppenmitglieder auf jeder Einreichung, das Repo darf keine Matrikelnummer enthalten. Deshalb setzt ein eigener Schritt die Nummern erst nach dem Bauen auf Seite 1 der Folien-PDFs:

1. `abgabe-lokal.beispiel.json` nach `abgabe-lokal.json` kopieren und ausfüllen (von Git ignoriert, siehe `.gitignore` hier).
2. `node docs/referat-thema-1/abgabe/jonas/bau.mjs …` wie oben.
3. `node docs/referat-thema-1/abgabe/jonas/abgabe-lokal.mjs` schreibt `abgabe-lokal/jonas-folien.pdf` und `abgabe-lokal/gemeinsames-deck.pdf` (ebenfalls ignoriert).

Das Skript bricht ab, wenn Eingabe oder Ausgabe nicht ignoriert sind oder eine PDF noch Entwurfsmarker oder Platzhalter („Entwurf“, „[Niklas]“, „[Satz …]“, „[Titel]“) trägt.
