# Jonas: Deck, Folien und Handout bauen

Dieser Ordner erzeugt reproduzierbar alles, was Jonas für Thema 1 vorträgt und abgibt: das gemeinsame
Browser-Deck, die PDF-Fassungen, das Handout, die Sprechnotizen und ein Manifest mit Prüfsummen.

## Bauen

```sh
node docs/referat-thema-1/abgabe/jonas/bau.mjs [--abgabe] [--niklas1 <pdf>] [--niklas2 <pdf>] \
  [--niklas1-stand <text>] [--niklas2-stand <text>] [--ausgabe <ordner>]
```

Ohne Argumente landen die Ausgaben in `ausgabe/` neben dieser Datei. Niklas' Teil 1A kommt standardmäßig
aus `abgabe/1A-folien.pdf` (falls vorhanden), sonst steht eine Platzhalterfolie im Deck. Niklas' Teil 1B 3–4
gibt es nur mit `--niklas2`. Die `--niklasN-stand`-Texte landen im Manifest (zum Beispiel Zweig und Commit).

Tests: `node --test docs/referat-thema-1/abgabe/jonas/*.test.mjs`.

## Voraussetzungen

- Node 24 und die Abhängigkeiten des Repos (Playwright mit Chromium, `pdf-parse`, `prettier`).
- `pdftoppm` (Poppler) rastert Niklas' PDF-Seiten für das Deck. Fehlt es, erscheint dort ein Platzhalter.

## Datenherkunft

Jede Zahl stammt aus den eingecheckten Ergebnisdateien in `evidenz/1B/messung/` und
`evidenz/1C/messung/` oder aus den dokumentierten Festwerten in `folien.mjs` (mit Beleg). Die genauen
Eingaben mit SHA-256 stehen in `ausgabe/manifest.json`; dort stehen auch die Ausgaben, die Seitenzahlen,
die Wortzahl des Handouts und die Herkunft von Niklas' Teilen.

## Matrikelnummern

Matrikelnummern stehen nie im Repo. Im Repo und in `ausgabe/` trägt das Handout den Platzhalter
„Name, Matrikelnummer: [lokal eintragen]“. Für die Abgabe:

1. `~/.config/referat-thema-1/personen.json` anlegen: `[{ "name": "…", "matrikel": "…" }, …]`, erst Jonas,
   dann Niklas.
2. `node docs/referat-thema-1/abgabe/jonas/bau.mjs --abgabe` ausführen.

Die personalisierten PDFs liegen danach in `~/referat-abgabe/` (nur für den Besitzer lesbar). Fehlt die
Datei, bricht das Skript mit einer Fehlermeldung ab.

## Ausgaben (`ausgabe/`)

| Datei                  | Inhalt                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `jonas-deck.html`      | Gemeinsames Deck zum Vortragen, selbstständig (Schriften und Bilder eingebettet)     |
| `gemeinsames-deck.pdf` | Druck des gemeinsamen Decks, eine Seite je Folie                                     |
| `jonas-folien.pdf`     | Nur Jonas' Folien (J1–J13, J15) und Reserve, einzeln zuordenbar für die Abgabe       |
| `jonas-handout.pdf`    | Handout (höchstens 5 Seiten, 350–1.800 Wörter), im Repo mit Platzhalter für Matrikel |
| `sprechnotizen.md`     | Notizen je Folie mit Sekunden, kumulierter Zeit und Kürzung auf die Kurzfassung      |
| `manifest.json`        | SHA-256 aller Ein- und Ausgaben, Seitenzahlen, Wortzahl                              |
