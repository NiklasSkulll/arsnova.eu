## Verstehen

RN4 ist eine Reservefolie (keine Redezeit; nur auf Nachfrage über Taste `r`). Bis 2026-11-16 war sie die Hauptfolie N8. Frage: „Wie viel CPU und Speicher braucht spaCy selbst?“ Keine Aufbaustufen. Die Wegkarte steht auf der Station spaCy.

Zwei Punktdiagramme nebeneinander, je drei Zeilen (V2 · 1 CPU, V3 · 0,25 CPU, V4 · Proxy), ein Punkt je Block, also fünf je Variante:

- **Links „Gedrosselte CPU-Perioden je Block“:** Achse 0 bis 100 % (Marken 0, 25, 50, 75, 100 %). Rote gestrichelte Linie „Schwelle 5 % (nur V2)“ über der V2-Zeile. V2 liegt knapp über null, V3 weit rechts (bernstein, weil über 5 %, aber dort gewollt), V4 bei null.
- **Rechts „Speicherspitze je Block“:** Achse in MiB (Marken 0, 256, 512), rote gestrichelte Linie „Schwelle 80 % (nur V2)“ und eine dunkle Linie „Limit 1 GiB“. Alle Punkte liegen deutlich darunter. Vermerk: „MiB, Spitze inklusive Aufwärmen“.

Blau heißt unter der Schwelle; rot wäre eine Vertragsverletzung in V2 (kommt nicht vor). Unten: Labor: alle Container zusammen 0,2–0,4 CPU von 16, mindestens 11,6 GiB frei; spaCy V2 ohne OOM.

Warum das zählt: Die Folie zeigt den Diskussionskern „Containergrenzen“. Im Normalbetrieb hält spaCy alle Ressourcenregeln. Gedrosselt verbraucht es fast seine ganze Quote und wartet ständig; das verlängert seine eigene Antwortzeit (N9), schützt aber die App nicht automatisch.

Herkunft (`evidenz/1A/reihe-main-a19ca70f-20261115-122547/auswertung/auswertung.json`, `runs[].resources[alias=spacy]`; genaue Werte aus 1A-auswertung.md, Tabelle „Ressourcenbudget“):

- Mittlere CPU in % einer CPU: V2 18,29–18,63; V3 20,03–24,01; V4 0,53–0,55 (`cpuPercent`).
- Gedrosselte Perioden in %: V2 0,53–0,84; V3 88,47–95,88; V4 0 (`throttledPeriodRatio` aus `cpu.stat`).
- Lebenszeit-RAM-Peak in MiB: V2 479,53–480,53; V3 490,04–505,11; V4 463,21–464,27 (`lifetimePeakMemoryBytes` aus `memory.peak`).
- OOM-Zuwachs: überall 0 (`oomKillDelta`).
- Schwellen (Versuchsvertrag): gedrosselt höchstens 5 % der Perioden, Speicher höchstens 80 % von 1 GiB, also 819,20 MiB (1A-auswertung.md); beide nur für V2.
- Takt: Kernel-Doku cgroup v2, Abschnitt „CPU Interface Files“: Standard „max 100000“, also 100 ms je Periode.
- Laborreserve: Summe der Container-CPU je Lauf (`runs[].resources[].cpuPercent`) und `runs[].collectorHost.minAvailableMemoryBytes`, abgerundet auf 11,6 GiB.
- Rechner: Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2, 16 logische CPUs, Lastgenerator auf demselben Rechner; App-Commit `a19ca70f`; Auswertung SHA-256 `a3bebdf236cfb3b6…`.

Was die Folie nicht behauptet: `memory.peak` ist ein Lebenszeitwert einschließlich Aufwärmung und wird nicht subtrahiert. Dienstpeaks werden nicht zu einer gleichzeitigen Hostspitze addiert. Die große Laborreserve heißt nicht, dass die Latenz geschützt ist, und sie sagt nichts über den 8-vCPU-Zielhost. In V4 rechnet spaCy praktisch nicht, weil der Proxy nichts weiterleitet; daher keine Drosselung. Ein kleineres RAM-Limit wurde nicht getestet.

## Begriffe

- **CPU-Quote / `cpu.max`:** Die cgroup-Einstellung, wie viel Rechenzeit ein Container je Periode höchstens bekommt. Standard ist eine Periode von 100 ms. Bei 0,25 CPU darf spaCy in jeder Periode nur ein Viertel davon rechnen (Quote 25 %).
- **Periode (Takt):** Das Zeitfenster, in dem der Kernel die Quote abrechnet, hier 100 ms. Danach beginnt die Zählung neu.
- **Drosselung (Throttling):** Ist die Quote in einer Periode aufgebraucht, hält der Kernel den Container bis zur nächsten Periode an. „Gedrosselte Perioden“ ist der Anteil der Perioden, in denen das passierte: `nr_throttled / nr_periods` aus `cpu.stat`.
- **`cpu.stat`:** Datei der cgroup mit Zählern, u. a. Zahl der Perioden und der gedrosselten Perioden. Gemessen wird die Differenz der Zähler im Messfenster.
- **`memory.peak`:** Höchster Speicherverbrauch der cgroup seit Start des Containers. Deshalb „Spitze inklusive Aufwärmen“.
- **MiB / GiB:** Mebibyte und Gibibyte, Zweierpotenzen: 1 GiB = 1024 MiB. Das Limit von spaCy ist 1 GiB.
- **OOM / OOM-Kill:** Out of Memory. Überschreitet ein Container sein Speicherlimit, beendet der Kernel einen Prozess darin. Gezählt wird der Zuwachs von `oom_kill`; er war überall 0.
- **Limit vs. Reservierung:** Das Limit begrenzt spaCy nach oben. Es reserviert der App keine CPU; das könnten nur `cpu.weight`, `cpuset` oder eine eigene Maschine.
- **% einer CPU:** 100 % entsprechen der vollen Rechenzeit eines Kerns. 18 % heißt: spaCy rechnete im Mittel knapp ein Fünftel eines Kerns.
- **Laborreserve:** Was im Labor frei blieb: Alle Container zusammen nutzten 0,2–0,4 CPU von 16 logischen CPUs, mindestens 11,6 GiB Speicher waren frei.

## Fragen

### Warum schützt das CPU-Limit von spaCy die Live-Aktionen nicht?

`cpu.max` ist eine Obergrenze je Periode, keine Reservierung (Heo, 2024). Es hindert spaCy daran, mehr zu nehmen, gibt der App aber nichts garantiert. Auf 16 CPUs gab es kaum CPU-Konkurrenz; die Drosselung von spaCy in V3 mit 88–96 % der Perioden verlängert vor allem dessen eigene Antwortzeit.

### Was bedeutet „88–96 % gedrosselt“ anschaulich?

Der Kernel teilt die Zeit in Takte von 100 ms, und spaCy darf in jedem Takt nur ein Viertel davon rechnen. In 88–96 % der Takte war dieses Viertel aufgebraucht, bevor die Arbeit fertig war. spaCy wartete also fast immer auf den nächsten Takt; deshalb dauert die Analyse gedrosselt zwei bis drei Sekunden.

### Würde ein kleineres Speicherlimit Geld sparen?

spaCy kam im Normalbetrieb auf etwa 480 MiB, weit unter der Schwelle von 819,20 MiB. Ein kleineres RAM-Limit habe ich aber nicht getestet, also mache ich dazu keine Aussage. Eurokosten wurden nicht gemessen.

### Welche Reserve hat der echte App-Host?

Gemessen habe ich ein Labor, nicht den Zielhost. Dort brauchten alle Container zusammen im Mittel des Fensters 0,2–0,4 CPU von 16, und mindestens 11,6 GiB blieben frei. Für den 8-vCPU-Host mit 16 GB folgt daraus keine Zahl, nur dass die CPU nicht der Engpass dieser Last war.

### Warum ist V4 nicht gedrosselt?

In V4 sitzt ein Proxy vor spaCy, der Anfragen erst nach 6000 ms weiterleitet. Die App bricht nach 5000 ms ab, deshalb hat der Proxy keine einzige Anfrage weitergeleitet. spaCy rechnet in V4 also praktisch nicht: 0,53–0,55 % einer CPU, keine Drosselung.

## Übergang

Mit `Esc` zurück in den Vortrag (meist zu N7, N9 oder N2). Anschlusssatz: „Die Reserve ist groß, schützt die Latenz aber nicht automatisch; den Zielhost habe ich nicht gemessen.“
