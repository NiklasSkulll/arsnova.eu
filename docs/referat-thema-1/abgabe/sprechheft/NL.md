## Verstehen

NL ist das Literaturverzeichnis zu Auftrag 1A (Niklas), im Anhang nach J16. Es hat keine Redezeit und wird nicht vorgetragen.

**Was zu sehen ist.** Neun Einträge in zwei Spalten, alphabetisch, nach dem IU-Zitierleitfaden: arsnova.eu-Projektteam 2026a (ADR-0035) und 2026b (Prüfungsdokument), Dean und Barroso 2013, Heo 2024 (Linux-Dokumentation „Control Group v2“, Kernel 6.12), Nosek et al. 2018 (Präregistrierung), Papadopoulos et al. 2021, Schneider 2026 (Niklas’ Ausarbeitung im Fork), Ulrich 2016 und Weirauch 2026. Die Fußzeile: „Kurzbelege auf den Folien nach IU-Zitierleitfaden; Einträge wie im Handout“.

**Wie die Belege funktionieren.** Niklas’ Folien N1 bis N10 und die Reservefolien RN tragen Kurzbelege in der Fußzeile, etwa „Heo, 2024, Abschn. „CPU Interface Files““ auf N2 oder „Nosek et al., 2018, S. 2600“ auf N4. Jeder Kurzbeleg verweist auf einen Eintrag hier. Auch Niklas’ Folien M1–M4 zu 1B Schritte 3–4 zitieren aus dieser Liste (Schneider 2026, Ulrich 2016, ADR-0035); `literatur-1a.mjs` gilt für Niklas’ ganzen Teil. Die Einträge stehen in `abgabe/niklas/literatur-1a.mjs`, mit denselben Schlüsseln wie in Niklas’ `main.bib` des Handouts (PaperLab).

**Was die Folie nicht behauptet.** Die Literatur stützt Methode und Deutung. Die Messwerte stammen aus Niklas’ Reihe vom 15.11.2026 und der Auswertung `1A-auswertung.md`.

## Begriffe

- **Kurzbeleg:** Die Angabe „(Autor, Jahr, Stelle)“ in der Fußzeile einer Folie. Sie verweist auf einen vollständigen Eintrag hier.
- **cgroup v2 (Control Group):** Ein Mechanismus des Linux-Kernels, der die Ressourcen von Prozessgruppen begrenzt, etwa CPU und Speicher. Docker setzt damit die Limits eines Containers durch.
- **Präregistrierung:** Hypothesen, Messgrößen und Auswertung werden vor der Messung festgeschrieben. So kann man die Regel nicht nach dem Ergebnis wählen. Nosek et al. 2018 beschreiben das für die Wissenschaft allgemein.
- **IU-Zitierleitfaden:** Die Vorgabe der IU Internationale Hochschule für Quellenangaben im Autor-Jahr-System.

## Fragen

### Warum zitieren Sie die Kernel-Dokumentation?

Sie ist die maßgebliche Quelle dafür, was ein CPU-Limit im Container bedeutet. Laut Heo 2024 ist `cpu.max` eine Obergrenze je Periode, keine Reservierung. Daraus folgt Niklas’ Befund: Das Limit hindert spaCy daran, mehr zu nehmen, garantiert der App aber nichts.

### Wofür steht Nosek et al.?

Für das Prinzip, Hypothesen vorab festzulegen. Niklas’ Experimentvertrag legt H1 und H2 mit Schwellen vor dem Lauf fest, und eine ungünstige Regel wird danach nicht gelockert. Deshalb bleibt „H1 nicht bestätigt“ stehen, obwohl auch die Kontrolle die Regel verfehlte.

### Warum Papadopoulos et al. und Dean und Barroso auch in 1A?

Papadopoulos et al. 2021 begründen Methode und Grenzen der Messung, etwa gepaarte Blöcke und Streuung. Dean und Barroso 2013 begründen, warum Niklas das 95. Perzentil der Antwortzeiten prüft statt den Mittelwert: Lehrende warten auf die langsamen Anfragen.

### Warum steht Weirauch 2026 im 1A-Verzeichnis?

Folie N10 verweist für den Übergang auf Jonas’ Ergebnis in `1B-ergebnis.md`: Ein Sprachmodell braucht je Auftrag Minuten Rechenzeit. Diese Quelle ist deshalb auch im 1A-Verzeichnis aufgeführt.

## Übergang

NL ist die letzte Folie des Anhangs. Weitere Fragen beantworten die Reservefolien, erreichbar mit `r`; zurück in den Vortrag mit Escape.
