## Verstehen

Die Folie beantwortet: Ist die Strecke zwischen den Hosts langsamer als ein Aufruf im selben Host? Sie ist eine Kontrolle für die Drahtmessung aus J8.

**Aufbau der Folie.** Links zwei Sätze zur Methode: Dieselbe kurze Anfrage geht einmal vom app-host über das Netz an den llm-host und einmal vom llm-host an sich selbst; verglichen werden die Mediane beider Seiten. Darunter die vorab festgelegte Schwelle: Differenz ≤ 5 ms, erfüllt, kein Unterschied nachweisbar. Rechts groß die Kennzahl −2,0 ms, „Differenz der Mediane“, mit dem Vermerk „Nachtrag M2, Laptop“. Keine Aufbaustufen.

**Warum das zählt.** J8 rechnet das Netz aus zwei Uhren. Diese Kontrolle prüft dasselbe auf einem zweiten, unabhängigen Weg: Wenn die Strecke spürbar Zeit kostete, müsste die Anfrage vom app-host deutlich länger brauchen als die lokale. Sie prüft also die Gegenalternative „das Netz kostet doch etwas“.

**Herkunft der Zahlen.** Quelle: `evidenz/1B/2026-11-13-lauf.md`, Nachtrag M1–M4, Zeile M2; Rohdaten `evidenz/1B/messung/2026-11-13-kontrolle-c0.json`; ThinkPad P50, Commit `9e111d35`. Das Labor wurde dafür am Abend neu von null aufgebaut.

- Je Seite n = 30 Anfragen, alle HTTP 200.
- Median `time_total` vom app-host 348,7 ms, vom llm-host an sich selbst 350,7 ms.
- Differenz app-host minus llm-host: −2,0 ms. Negativ heißt: Über die Strecke war es im Median sogar etwas schneller; das ist Streuung, kein echter Vorteil.
- Schwelle H_C0: Differenz ≤ 5 ms, vor dem Lauf im Design-Nachtrag vom 2026-11-13 festgelegt.

Die 348,7 ms sind fast nur Serverzeit der kurzen Anfrage, nicht Netz. Die Streuung je Seite ist größer als 5 ms (Laufprotokoll, Deutung).

**Was die Folie nicht behauptet.** „Nicht nachweisbar“ heißt nicht „kostenlos“. Die Kontrolle ist zu grob, um Bruchteile einer Millisekunde zu sehen. Die eigentliche Netzzahl bleibt die Drahtmessung aus J8, 0,43 ms im Median. Die Kontrolle misst auch nicht den ganzen Auftrag auf einem einzigen Host (Vergleich S1): Der hätte zusätzlich die CPU-Teilung von App und Runtime gemessen und wurde in Schritt 1–2 begründet nicht gemacht; Niklas hat S1 später in Schritt 4 gemessen.

Achtung Namensgleichheit: Im Laufprotokoll heißt auch eine zweite Messung „Kontrolle C0“, der Direktprompt (ein ganzer Summary-POST direkt im llm-host, 214,3 s). Diese Folie meint „C0 nach M2“, die kurze Anfrage mit n = 30 je Seite (ADR 1B-011).

## Begriffe

- **Kontrolle:** Eine Zusatzmessung, die prüft, ob die Hauptmessung plausibel ist, auf einem anderen Weg.
- **Strecke:** Der Weg einer Anfrage über das virtuelle Netz vom app-host zum llm-host.
- **Lokal (an sich selbst):** Die Anfrage geht vom llm-host an seine eigene Adresse; es gibt keine Strecke zwischen zwei Hosts.
- **`time_total`:** Gesamtzeit einer Anfrage laut dem Werkzeug `curl`, vom Start bis zur letzten empfangenen Antwort.
- **Median:** Der mittlere Wert einer sortierten Reihe; die Hälfte der Werte liegt darunter, die Hälfte darüber.
- **Schwelle vorab:** Eine Grenze, die vor der Messung schriftlich festgelegt wurde. So kann das Ergebnis die Regel nicht nachträglich beeinflussen.
- **Hypothese H_C0:** Die vorab formulierte Erwartung, dass die Differenz der Mediane höchstens 5 ms beträgt.
- **Streuung:** Wie stark einzelne Messwerte um ihren typischen Wert schwanken. Ist sie größer als der gesuchte Effekt, lässt sich der Effekt nicht nachweisen.
- **Nachtrag M2:** Eine von vier ergänzenden Messungen (M1–M4), die am Abend des 2026-11-13 nach einer Vollständigkeitsprüfung liefen.

## Fragen

### Eine negative Differenz: Ist die Strecke schneller als lokal?

Nein. Die Differenz von −2,0 ms liegt innerhalb der Streuung; die Werte je Seite schwanken stärker als 5 ms. Deshalb lautet das Urteil nur: kein Unterschied nachweisbar.

### Warum dann überhaupt diese Kontrolle, wenn sie so grob ist?

Sie prüft die Drahtmessung auf einem unabhängigen Weg. Hätte die Strecke messbar viel gekostet, hätte die Kontrolle es gezeigt. Für die genaue Zahl gilt weiter die Drahtmessung mit 0,43 ms.

### Bremst die geteilte CPU nicht die Inferenz und verfälscht die Zerlegung?

Die Inferenz kann dadurch langsamer sein; getrennt gemessen habe ich das nicht, einen Same-Host-Vergleich S1 habe ich begründet weggelassen. Für die Zerlegung ist das unkritisch, weil die App während der Inferenz wartet. Niklas hat S1 in Schritt 4 gemessen: S1 liefert unterschiedliche Ergebnisse für Label und Summary und erteilt keine Freigabe für einen Same-Host-Betrieb (ADR 1B-020).

### Warum n = 30 hier, aber nur n = 10 im Hauptlauf?

Eine kurze Anfrage dauert Millisekunden, ein Summary-Auftrag rund zweieinhalb Minuten. Deshalb ließen sich hier mehr Wiederholungen in kurzer Zeit messen. Der Hauptlauf vergleicht Mediane mit großen Abständen zur Schwelle.

### Stand die Schwelle wirklich vorher fest?

Ja. H_C0 mit ≤ 5 ms steht im Design-Nachtrag vom 2026-11-13, freigegeben vor den Läufen M1–M4 (Laufprotokoll, Nachtrag; ADR 1B-008, Folgen).

## Übergang

Weiter zu J9: Jetzt die ganze Zerlegung eines Auftrags auf einer Achse, mit den vorab festgelegten Schwellen. Fragt jemand nach den Gültigkeitsgrenzen des Labors, mit Taste r die Reserve R5 öffnen.
