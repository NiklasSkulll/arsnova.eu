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
`sprechnotizen-niklas.md`. Reihenfolge im Deck (Design 2026-11-15, Abschnitt 3; ergänzt 2026-11-16): GT (Titel),
G0 (Fahrplan), GK (Systembild „Was ist arsnova?“), Niklas 1A (N1–N10 mit N6b), Jonas J1–J15 (mit J5b, J8b, J10a,
J10b, J11, J13b), Niklas 1B 3–4 (M1–M2), G9 (gemeinsames Fazit) und GD (Dank, Fragen, Nachweisumfang), Literatur
(J16, NL), Reserve (R1, R5–R7, R9–R12, R15–R16 mit Abb. 1 und 2 aus `1C-diagrams.md`; RN2). Alle Rahmenfolien spricht Niklas. `--niklas1`/`--niklas2` ersetzen einen
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
  (Fließtext zum Üben). `[Weiter]` markiert jeden Tastendruck einer Aufbaustufe (GK, J7, J9, J12, J13, J15; bei
  Niklas N6, N7, M1). Auf J13 kommen erst die Stufen, dann der Clip.
- Der Sprungplan steht oben in den Sprechnotizen jeder Person, gezählt nur über die eigene Redezeit ab der
  ersten eigenen Folie: Jonas muss J13 und J15 bis 15:00 min erreichen, Niklas N10, 1B 3–4, G9 und GD (seine
  Uhr steht, während Jonas spricht; Notizen und Sprechkarten markieren die Übergabe nach N10). Überschreitet
  die Langfassung 15:00 min, steht dort ein Budgethinweis (Entscheidung der Autoren 2026-11-16: 15 min Redezeit
  je Person, Fragen kommen hinzu; vorher 10:30 min).
- Ortsmarke ohne Bewegung oben links (`deck.mjs`, `ortsmarke`; Folienfeld `marke`) auf jeder Folie von 1A und
  1B 3–4 und auf J1: eine Wegkarte in derselben Bildsprache wie Jonas' Marker (`wegkarte.mjs`, gleiche Maße,
  Linien und Stationen, Beschriftung nur Ort und Etikett). 1B 3–4 zeigt Jonas' Auftragsweg, die Strecke über den
  zweiten Host in Bernstein, dazu je Stufe ein Störungszeichen auf der Karte (Stopp, Slot belegt, DROP, zu spät); 1A einen eigenen Weg
  (oben Teilnehmende → App → Datenbank → Antwort, unten der Zweig Analyse → spaCy → Ersatz → Wortwolke) mit dem Ort
  der Folie in Blau; J1 (ebenso J2, J3, J4, J13b, J15) Jonas' ganzen Weg ohne Hervorhebung. Welche Folie welche Station zeigt, steht begründet
  an der Folie (`../niklas/folien-1a.mjs`).
- G0 zeigt Leitfrage und Fahrplan der vier Teile in Vortragsreihenfolge (`TEILE` in `folien.mjs`: Niklas 1A,
  Jonas 1C und 1B 1–2, Niklas 1B 3–4, Fazit); dieselben Teile stehen klein oben rechts auf jeder Hauptfolie
  (Teilleiste, `deck.mjs`), der aktuelle Teil unterstrichen. G9 nimmt die Leitfrage von G0 wörtlich wieder
  auf. Übergänge: N10 „Was, wenn wir die schwere Arbeit auslagern?“, J15 „Und wenn der zweite Host langsam
  ist oder ausfällt?“.

## Designregeln (Stand 2026-11-16)

Prüfbar in `layout-pruefung.mjs` (Druckmodus, alle Folien im Endbild) und `deck.test.mjs`:

- **Typografie (T):** Folientext mindestens 28 px (`--s-text`), Sekundärtext 24 px (`--s-sek`, Klasse
  `sekundaer`), Etiketten und Achsen 22 px (`--s-min`), Vermerke 20 px gedämpft (`--s-notiz`: `beleg`,
  `vermerk`, Bildunterschrift, Fußzeile) in genau einer Zeile. Was nicht in eine Zeile passt, gehört in die
  Sprechnotiz (`quelle`) oder in die Reserve.
- **Vertikaler Rhythmus (V):** Der Inhaltsblock steht im optischen Zentrum der Fläche (freier Rest oben 2 :
  unten 3, `.flaeche-inhalt::before/::after`), ein `beleg` sitzt unten an der Fußzeile. Füllt eine Grafik die
  Fläche (`grafik-box`), nimmt sie den Platz. Der Wächter meldet Inhalt, der oben klebt und unten mehr als
  35 % frei lässt.
- **Raster und Abstände:** Ränder 90 px, Titel einzeilig, Abstände eng in der Gruppe (`--abstand-eng`, 12 px)
  und weit zwischen Gruppen (`--abstand-gruppe`, 36 px); Merksätze (`merksatz`) und Übergaben (`uebergabe`)
  als eigene Bausteine, kein `margin:auto` im Fluss.
- **Kopfgrammatik (K, _Ergänzt 2026-11-16_):** Jede Hauptfolie beider Teile (1A, 1C und 1B 1–2, 1B 3–4) hat
  denselben Kopf. Zeile 1: Wegkarte oben links mit dem Ort als Beschriftung (nur der Name, etwa „spaCy“,
  „App-Host“, „Live-Pfad“, „Zweiter Host“, „Nachprüfung“) und dem Etikett; Wirkung und Störung zeigt nur ein
  Zeichen auf der Karte (Ausschlag, Störungszeichen über der Senke), nie ein Zusatz mit „·“. Zeile 2: Titel.
  Zeile 3: Fragezeile (`frage()` in `folien.mjs`), zuerst das Etikett des Auftrags (bei beiden Aufträgen 1C
  und 1B), dann die Frage, danach höchstens ein gedämpfter Status (`frage(…, { status })`, etwa
  „nachträglich ausgewertet“). `deck.mjs` setzt die Fragezeile in den Kopf, 18 px unter den Titel; zentriert
  wird nur der Inhalt darunter. Die Autorzeile (`autorZeile()`) steht nur auf N1 und J1, direkt unter der
  Fragezeile. Rahmenfolien (GT, G0, GK, G9, GD), Anhang (J16, NL) und Reserve haben keine Wegkarte und keine
  Pflicht zur Fragezeile; hat eine Reservefolie eine, steht sie ebenso im Kopf. Prüfung: `kopfBefunde` in
  `layout-pruefung.mjs` (Abstand Titel → Fragezeile auf allen Hauptfolien ±2 px, Etikett zuerst, Status nur
  am Ende der Fragezeile, Ort ohne Zusatz), Tests in `deck.test.mjs` und `../niklas/folien-niklas.test.mjs`.
- **Farbe:** Blau = Titel und 1A, Petrol = 1C, Bernstein = 1B, Rot nur für Ablehnung; Farbe nie allein (immer
  mit Etikett). Kein Text läuft aus seinem Kasten.

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
| `jonas-folien.pdf`                                  | Titel GT, Jonas' Folien (J1–J10, J12, J13, J15, J16) und Reserve                |
| `sprechnotizen.md`                                  | Notizen je Folie mit Sekunden, kumulierter Zeit und Kürzung auf die Kurzfassung |
| `sprechnotizen-niklas.md`                           | dasselbe für Niklas (1A, 1B 3–4, G9), mit eigenem Sprungplan                    |
| `sprechkarten-jonas.pdf`, `sprechkarten-niklas.pdf` | Sprechkarten zum Ausdrucken (A4): je Folie nur die Stichpunkte mit Startzeit    |
| `manifest.json`                                     | SHA-256 aller Ein- und Ausgaben, Seitenzahlen                                   |

## Abgabe mit Matrikelnummern (nur lokal)

Die Prüfung verlangt Name und Matrikelnummer aller Gruppenmitglieder auf jeder Einreichung, das Repo darf keine Matrikelnummer enthalten. Die Titelfolie GT steht deshalb in jedem PDF und trägt unter jedem Namen einen Platz (`data-matrikel="<Name>"`), der im Repo nur „Matrikelnummer in der Abgabefassung“ zeigt. Ein eigener Schritt füllt ihn erst nach dem Bauen:

1. `abgabe-lokal.beispiel.json` nach `abgabe-lokal.json` kopieren und ausfüllen (von Git ignoriert, siehe `.gitignore` hier); die Namen müssen denen auf der Titelfolie gleichen.
2. `node docs/referat-thema-1/abgabe/jonas/bau.mjs` wie oben.
3. `node docs/referat-thema-1/abgabe/jonas/abgabe-lokal.mjs` schreibt nach `abgabe-lokal/` (ebenfalls ignoriert): `jonas-deck.html` mit den Nummern (dieses Deck im Vortrag teilen) und daraus gedruckt `gemeinsames-deck.pdf`, `jonas-folien.pdf`, `niklas-folien.pdf`.

Das Skript bricht ab, wenn Eingabe oder Ausgabe nicht ignoriert sind, ein Name keinen Platz hat oder ein Platz leer bliebe, eine PDF noch Entwurfsmarker oder Platzhalter („Entwurf“, „[Niklas]“, „[Satz …]“, „[Titel]“) trägt oder auf Seite 1 eine Nummer fehlt.
