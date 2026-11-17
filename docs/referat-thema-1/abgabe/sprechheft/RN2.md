## Verstehen

RN2 ist eine Reservefolie (keine Redezeit; nur auf Nachfrage über Taste `r`). Titel: „Reserve: Was die Messung nicht zeigt“. Zwei Spalten mit Listen, keine Grafik, keine Aufbaustufen.

Linke Spalte „Grenzen des Labors“:

- Ein WSL2-Rechner mit 16 logischen CPUs statt Zielhost mit 8 vCPU
- Lastgenerator auf demselben Rechner: Latenz enthält Clientarbeit
- Beitrittswelle, keine 500 dauerhaft aktiven Clients
- Synthetischer Korpus mit kleinem Wortschatz
- Kein Rendering, keine Kompassanzeige, keine Aussage zu einem LLM
- Gemessen auf einem Stand nach v1.4.0 (`a19ca70f`) statt Tag v1.3.0, nach Freigabe des Prüfers

Rechte Spalte „Eigenanteil und KI“:

- Niklas: Auftrag, Labor, reale Messung, Freigaben, Deutung
- OpenAI Codex: Umsetzung der Werkzeuge, Tests, Auswertung, Entwürfe
- Folien im gemeinsamen Deck: mit Claude Code gebaut, Inhalt verantwortet Niklas

Warum das zählt: Die Prüfung fragt nach Gültigkeit und Eigenanteil. Die Folie bündelt beides, damit Niklas auf Nachfrage sofort die Grenzen nennen kann, statt sie zu verteidigen. Jede Zahl aus 1A gilt nur für dieses Labor.

Herkunft:

- Grenzen: `1A-auswertung.md`, Abschnitte „Systemgrenzen und Labor“ und „Gültigkeitsgrenzen und Abschluss“. Hardware laut Manifest: Ubuntu 24.04.5 LTS unter WSL2, Kernel 6.18.58.1-microsoft-standard-WSL2, 16 logische CPUs, 16.720.453.632 Byte RAM, Docker 29.9.3, cgroup v2, Node 24.18.0. Laufmanifeste: `manifest.generatorLocation = same-host`.
- Zielhost mit 8 vCPU und 16 GB: ADR-0035, im Versuchsvertrag als „Vorgesehener Anwendungshost“.
- Korpus: Die Fixture enthält unterschiedliche Rohtexte mit bewusst kleinem wiederholtem Wortschatz (1A-auswertung.md); fünf Analysesessions mit je 500 zulässigen Fragen.
- Stand nach v1.4.0: Versuchsvertrag (Prüfer-E-Mail, im Issue auf 2026-11-04 datiert; „Der Stand ist Version 1.4.0; die ursprüngliche Releasebezeichnung 1.3 bezeichnet den Aufgabenkontext“); `00-rahmen-und-pruefung.md` (Freigabe des aktuellen main).
- Eigenanteil: `1A-eigenanteil.md`; zu 1B Schritte 3–4 zusätzlich `1B-eigenanteil.md`.
- Commit `a19ca70f`; Auswertung SHA-256 `a3bebdf236cfb3b6…`.

Was die Folie nicht behauptet: Sie behauptet keine Produktionskapazität, keine Kompassaktualität, keine allgemeine Modellgüte und keine LLM-Tragfähigkeit. Sie behauptet auch keine ausschließlich manuelle Erstellung; Git-Autorenschaft ist laut Eigenanteil kein Beweis dafür.

## Begriffe

- **WSL2:** Windows Subsystem for Linux 2. Ein echter Linux-Kernel läuft in einer leichten virtuellen Maschine unter Windows. Docker und cgroup v2 funktionieren darin, aber Windows teilt sich die Hardware mit.
- **Zielhost:** Der vorgesehene Produktionsrechner für die App nach ADR-0035: 8 vCPU, 16 GB RAM. Er wurde nicht gemessen.
- **vCPU / logische CPU:** Eine virtuelle bzw. logische Recheneinheit, wie sie das Betriebssystem sieht (bei Hyperthreading zwei je physischem Kern). 16 logische CPUs im Labor sind nicht dasselbe wie 8 vCPU auf einem Server.
- **Lastgenerator auf demselben Host:** Das Programm, das die Teilnehmenden simuliert, lief auf demselben Rechner wie die App. Es konkurriert um CPU, und seine eigene Arbeit steckt in der gemessenen Latenz.
- **Synthetischer Korpus / Fixture:** Künstlich erzeugte, feste Testdaten (Fragen für die Wortwolke), mit festem Seed reproduzierbar. Keine echten Nutzerdaten.
- **Rendering:** Das Zeichnen der Oberfläche im Browser. Die Messung endet bei der Antwort des Backends.
- **Baseline / Tag v1.3.0:** Die Baseline ist der gemessene Anwendungsstand (`a19ca70f`, Version 1.4.0). Ein Tag ist eine benannte Version in Git; v1.3.0 ist der Stand, den die Aufgabe ursprünglich nennt.
- **OpenAI Codex, Claude Code:** KI-Werkzeuge, die Code und Texte nach Anweisung schreiben. Codex hat Werkzeuge, Tests, Auswertung und Entwürfe für 1A umgesetzt; Claude Code hat die Folien im gemeinsamen Deck gebaut.
- **Eigenanteil:** Was die prüfungspflichtige Person selbst geleistet und zu verantworten hat. Bei Niklas: Auftrag, Labor, reale Messung, Freigaben und Deutung.

## Fragen

### Warum werten Sie eine Reihe mit dem Lastgenerator auf demselben Rechner?

Der Vertrag verlangt, das offenzulegen, und ich tue es: Die gemessene Latenz enthält Clientarbeit. Gepaarte Blöcke und die gemischte Reihenfolge verteilen diesen Effekt gleich auf alle Varianten; verglichen wird nur im selben Block. Absolute Werte gelten deshalb nur für dieses Labor.

### Was ist an WSL2 problematisch?

WSL2 ist eine virtuelle Maschine unter Windows; Windows und andere Prozesse teilen sich die Hardware, und ich kann Störungen von dort nicht ausschließen. Für den Ausreißer in V3, Block 5 nenne ich WSL2 deshalb als eine mögliche, nicht gemessene Ursache. Für den Zielhost mit 8 vCPU folgt aus diesem Labor keine Kapazitätszahl.

### Die Leitfrage nennt Release 1.3. Warum messen Sie 1.4.0?

Wir haben den Fork mit Zustimmung des Prüfers aktualisiert (E-Mail vom 04.11.). Der Versuchsvertrag hält fest, dass 1.3 den Aufgabenkontext bezeichnet, nicht das gemessene Image. Den Unterschied nenne ich als Grenze.

### Was haben Sie selbst gemacht, was die KI?

Codex hat Werkzeuge, Tests, Auswertung und Dokumententwürfe umgesetzt, Claude Code die Folien und das Handout entworfen. Auftrag, Labor, die realen Messreihen, die Freigaben und die Deutung sind meine. Jede Zahl auf Folien und Handout erzeugt ein Skript aus den committeten Rohdaten; einen Vergleich rechne ich vor der Prüfung von Hand nach (Rang `ceil(0,95·n)`), wie es die Prüfliste in `1A-abschluss-und-uebergabe.md` vorsieht.

### Ist der Korpus aussagekräftig für echte Fragen?

Nur eingeschränkt. Der Korpus ist synthetisch, mit unterschiedlichen Rohtexten und bewusst kleinem, wiederholtem Wortschatz. Er sorgt für gleiche Daten in jedem Lauf, sagt aber nichts über die Qualität der Wortwolke bei echten Fragen.

## Übergang

Mit `Esc` zurück in den Vortrag. Anschlusssatz: „Innerhalb dieser Grenzen gilt: keine Freigabe für spaCy, die lexikalische Wortwolke bleibt.“
