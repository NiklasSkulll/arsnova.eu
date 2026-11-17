## Verstehen

RN1 ist eine Reservefolie (keine Redezeit; nur auf Nachfrage über Taste `r`). Bis 2026-11-16 war sie die Hauptfolie N6b. Sie beantwortet die Frage „Wie empfindlich ist die Regel?“; hinter der Frage steht „nachträglich ausgewertet“, weil keine dieser Rechnungen vorab festgelegt war. Keine Aufbaustufen.

Links eine Tabelle: p95 in ms, alle fünf Blöcke gepoolt, je Aktion und Variante V0, V1, V2, dazu rechts die Spanne der Lauf-p95 von V2 („V2 je Lauf“):

- Beitritt: V0 55,0 · V1 60,1 · V2 54,6 · V2 je Lauf 31,2–57,9
- Quiz: V0 49,3 · V1 47,7 · V2 44,6 · V2 je Lauf 32,3–48,8
- Q&A: V0 21,4 · V1 20,6 · V2 20,7 · V2 je Lauf 18,6–23,0
- Tempo: V0 13,2 · V1 14,0 · V2 13,0 · V2 je Lauf 11,0–14,9

Vermerk darunter: n = 2.500 je Variante und Aktion, Q&A 500. Rechts eine große Kennzahl „4 / 20 Treffer der Kontrolle ohne spaCy“ (bernsteinfarbene Linie, „nachträglich ausgewertet, grobe Rechnung“) und der Satz: Wären die Vergleiche unabhängig, bestünde eine wirkungslose Komponente alle 20 nur mit etwa 1 %. Unten: Gepoolt weicht V2 von V1 um −5,5 bis +0,1 ms ab; grobe Rechnung, kein vorab festgelegter Test.

Warum das zählt: Die Folie trennt Effekt und Rauschen. Gepoolt liegt V2 höchstens 0,1 ms über V1 (beim Beitritt sogar darunter), aber die einzelnen Lauf-p95 von V2 streuen viel stärker als dieser Unterschied. Eine Regel, die je Block 10 % verlangt, schlägt dann auch ohne Wirkung an. Das stützt Niklas' Selbstkritik auf N10, ändert aber das Urteil nicht.

Herkunft (berechnet in `abgabe/niklas/daten-1a.mjs`, Abschnitt `explorativ`):

- Gepoolte p95: alle Rohwerte `live.actions.<aktion>.latency.durationSamplesMs` aus den fünf `lauf.json` einer Variante zusammengelegt, dann Nearest Rank. 25 Läufe unter `evidenz/1A/reihe-main-a19ca70f-20261115-122547/V*/block-*/lauf.json`.
- „V2 je Lauf“: kleinster und größter Lauf-p95 von V2 aus `auswertung.json`, `runs[].live.<aktion>.p95Ms`.
- −5,5 bis +0,1 ms: kleinste und größte Differenz gepoolter p95 V2 minus V1 über die vier Aktionen.
- 4 / 20: `comparisons[variant=V1]` mit `passed = false`.
- Etwa 1 %: Die Kontrolle verfehlt 4 von 20, eine Fehlalarmrate von etwa 20 % je Vergleich; die Chance, alle 20 zu bestehen, ist dann grob 0,8 hoch 20 (`zufallsChance` in `daten-1a.mjs`; Fragenkatalog F2: „grob 0,8²⁰ ≈ 1 %“). Die Unabhängigkeit der Vergleiche ist eine grobe Annahme.
- Rechner: Niklas' Rechner, Ubuntu 24.04.5 LTS unter WSL2, 16 logische CPUs, Lastgenerator auf demselben Rechner; App-Commit `a19ca70f`; Auswertung SHA-256 `a3bebdf236cfb3b6…`.

Was die Folie nicht behauptet: Sie ist kein Test und ersetzt nicht die vorab festgelegte Regel. Sie belegt nicht, dass spaCy wirkungslos ist; Pooling verwischt auch echte, seltene Effekte wie V3 in Block 5. Die 1 % sind eine Größenordnung unter einer vereinfachenden Annahme, keine belastbare Wahrscheinlichkeit.

## Begriffe

- **Gepoolt:** Die Rohwerte aller fünf Blöcke einer Variante werden zu einer großen Stichprobe zusammengelegt (je Aktion 2.500 Werte, Q&A 500) und daraus ein p95 berechnet. Das glättet Unterschiede zwischen einzelnen Läufen.
- **Streuung / Spanne der Lauf-p95:** Kleinster bis größter p95 der fünf Läufe einer Variante. Beim Beitritt in V2 liegt sie zwischen 31,2 und 57,9 ms, viel breiter als der gepoolte Unterschied zu V1.
- **Effektgröße:** Wie groß ein Unterschied ist, hier die Differenz der gepoolten p95 in ms. Sie sagt mehr als die Frage, ob eine Schwelle gerissen wurde.
- **Fehlalarm (falsch positiv):** Die Regel schlägt an, obwohl es keinen Effekt gibt. Die Kontrolle (beide Seiten ohne spaCy) zeigt eine Rate von etwa 20 % je Vergleich.
- **Unabhängigkeit:** Annahme, dass das Ergebnis eines Vergleichs nicht von einem anderen abhängt. Vergleiche desselben Blocks teilen sich aber die Basis; deshalb ist die Rechnung nur grob.
- **Nearest Rank:** Werte sortieren und den Wert an Rang `ceil(0,95·n)` nehmen; kein Interpolieren.
- **A/A-Vergleich:** Zwei Läufe mit identischer Einstellung. Er zeigt, wie oft eine Regel ohne jeden Effekt anschlägt, und dient zum Kalibrieren der Schwelle.
- **Bootstrap-Konfidenzintervall:** Ein Verfahren, das aus den vorhandenen Messwerten durch wiederholtes Ziehen mit Zurücklegen abschätzt, wie stark eine Kennzahl schwanken kann. Es liefert einen Bereich statt einer einzigen Zahl.
- **Nachträglich ausgewertet:** Nicht vorab festgelegt; kann Hinweise geben, aber kein Ergebnis bestätigen.

## Fragen

### Warum werten Sie dann nicht nach dem gepoolten Wert?

Weil der Vertrag die Regel je Block festlegt und alle fünf Blöcke bestehen müssen. Eine Auswertung, die ich erst nach den Ergebnissen wähle, darf das Urteil nicht ersetzen. Die gepoolten Werte zeige ich nur zur Einordnung.

### Ist der Beitritt mit spaCy schneller als ohne?

Gepoolt liegt V2 beim Beitritt unter V1. Das deute ich nicht als Beschleunigung durch spaCy, sondern als Teil der Streuung: Die Lauf-p95 von V2 reichen allein beim Beitritt von 31,2 bis 57,9 ms.

### Wie kommen Sie auf etwa 1 %?

Die Kontrolle verfehlt 4 von 20 Vergleichen, also etwa 20 % je Vergleich. Wären die Vergleiche unabhängig, bestünde eine wirkungslose Komponente alle 20 nur mit etwa 0,8 hoch 20, also rund 1 %. Die Unabhängigkeit ist eine grobe Annahme; die Zahl zeigt nur die Größenordnung.

### Wie würden Sie es beim nächsten Mal machen?

Für eine neue Reihe würde ich die Regel an einem A/A-Vergleich kalibrieren und eine Mindesteffektgröße, etwa +10 ms, mit Bootstrap-Konfidenzintervall über die Blöcke nutzen (Papadopoulos et al., 2021). Dazu den Lastgenerator auf einen eigenen Rechner. Für diesen Versuch gilt die vorab festgelegte Regel.

## Übergang

Mit `Esc` zurück in den Vortrag, an die Stelle, von der aus die Reserve geöffnet wurde (meist N6 oder N10). Passender Anschlusssatz: „Für diesen Versuch gilt die Regel; deshalb bleibt es bei keiner Freigabe.“
