# Sprechheft und Referentenansicht

_Stand 2026-11-17, freigegeben von Jonas im Chat._

## Ziel

Ein Dokument je Person, das für den Vortrag und die Befragung genügt: ablesbar, jeder Begriff erklärt, jede
Zahl mit Herkunft, wahrscheinliche Fragen mit Antwort. Wer das Projekt nicht kennt, soll damit jede Folie
vortragen und Fragen dazu beantworten können.

## Entscheidungen

1. **Form:** Referentenansicht im Deck (Taste `n` öffnet ein zweites Fenster, das Folie und Aufbaustufe
   mitführt, offline) und je Person ein Sprechheft als HTML (eine Seite pro Folie, druckbar).
2. **Vortrag und Verstehen getrennt:** Der Ablesetext ist die bestehende `notiz` der Folie (passt in die
   Redezeit, `[Weiter]` je Stufe). Alles Weitere steht darunter und wird nicht vorgelesen.
3. **Umfang:** alle Folien beider Personen, Rahmen, Anhang und Reserve.

## Seite je Folie

- Kopf: Kennung, Titel, Sprecher, Redezeit, kumulierte Zeit, Aufbaustufen
- **Vortrag:** `notiz`, Stufen hervorgehoben
- **Stichpunkte:** wie auf der Sprechkarte
- **Verstehen:** was die Folie zeigt (Achsen, Farben, Stufen), warum es zählt, Herleitung jeder Zahl mit
  Quelle (Datei), Rechner und Commit, was die Folie nicht behauptet
- **Begriffe:** jeder Fachbegriff der Folie, erklärt ohne Vorwissen, in zwei bis vier Sätzen
- **Fragen:** wahrscheinliche Prüferfragen mit ausformulierter Antwort (auch aus den Fragenkatalogen)
- **Übergang:** Satz zur nächsten Folie; wann in die Reserve springen

## Quelle der Inhalte

`abgabe/sprechheft/<Kennung>.md` je Folie mit den Abschnitten `## Verstehen`, `## Begriffe`, `## Fragen`
(je Frage `### …?`, darunter die Antwort), `## Übergang`. Vortrag, Stichpunkte und Kopf kommen aus den
Foliendaten, damit sie nicht auseinanderlaufen.

## Regeln für den Inhalt

- Deutsch, klar, kurze Sätze; „du“ vermeiden, sachlich.
- Jede Zahl steht wörtlich in den Foliendaten, einem Protokoll, ADR, Hauptdokument oder Code des Referats.
  Ein Test prüft das; Herleitungen nennen ihre Quelle.
- Keine neuen Behauptungen über Ergebnisse; Grenzen und Unsicherheiten offen benennen.
- Fragenkatalog-Antworten übernehmen, wo sie passen, sonst neu aus den Belegen.

## Prüfung

Tests: jede Folie hat ihre Datei mit allen Abschnitten; keine Zahl ohne Fundstelle; Referentenansicht folgt
Folie und Stufe im Browser. Danach ein unabhängiger Faktencheck aller Seiten gegen Protokolle und Code.
