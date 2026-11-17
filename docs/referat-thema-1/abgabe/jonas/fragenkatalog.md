# Fragenkatalog für die Diskussion (Jonas: 1C und 1B Schritte 1–2)

- **Stand:** 2026-11-15, ergänzt 2026-11-16 (F49–F58), Entwurf der KI · Prüfung durch den Autor: offen
- **Zweck:** nur zum Üben, nicht Teil der Abgabe. Die Diskussion zählt 40 % der Note ([Prüfungsdokument 2](../../../didaktik/CLOUD-COMPUTING-REFERAT-PRUEFUNG.md#2-ziel-und-drei-verpflichtende-leistungsbestandteile)); Fragen dürfen über den Vortrag hinausgehen, aber nicht über das Thema ([Prüfungsdokument 5](../../../didaktik/CLOUD-COMPUTING-REFERAT-PRUEFUNG.md#5-vortrag-diskussion-und-gruppenreferat)).
- **Grundlage:** die Diskussionstabellen im [1B-Gerüst](../../1B-praesentation-geruest.md#diskussion-vorbereitete-antworten) und im [1C-Gerüst](../../1C-praesentation-geruest.md#diskussionskern-konsistenz-verträge-und-entkopplung), dazu neue Fragen aus Ergebnisberichten, ADRs, Protokollen, Eigenanteil und den Bewertungskriterien ([Prüfungsdokument 6](../../../didaktik/CLOUD-COMPUTING-REFERAT-PRUEFUNG.md#6-bewertung), [7](../../../didaktik/CLOUD-COMPUTING-REFERAT-PRUEFUNG.md#ki-agenten-eigenständigkeit-und-offenlegung)).
- **Regeln:** Jede Antwort hat höchstens drei Sätze und einen Beleg. Jede Zahl trägt Rechner und Commit oder verweist auf die Stelle, wo beides steht. Was die Quellen nicht hergeben, sage ich als offen, nicht als Ergebnis.

**Herkunft:** _(1B-Gerüst)_ und _(1C-Gerüst)_ sind übernommen und ins Gesprochene gebracht, _(neu)_ ist ergänzt.

## Die fünf wahrscheinlichsten Fragen

Drei davon stehen als Diskussionsfragen auf Folie J15; die anderen beiden zielen auf die angreifbarsten Stellen (ein Rechner für zwei Hosts, Eigenleistung neben der KI).

1. [F9](#f9-ist-ein-laptop-mit-zwei-vms-aussagekräftig-für-zwei-server): ein Laptop mit zwei VMs statt zwei Servern
2. [F28](#f28-schützt-das-private-netz-die-runtime-ausreichend): reicht das private Netz als Schutz
3. [F32](#f32-prüft-das-gate-das-richtige-wenn-es-nach-der-form-verwirft): prüft das Gate das Richtige
4. [F35](#f35-wer-legt-den-timeout-fest-das-release-oder-der-betreiber): wer legt den Timeout fest
5. [F38](#f38-was-haben-sie-selbst-entschieden-und-was-die-ki): was habe ich entschieden, was die KI

## Methode und Nachweiskette

### F1. Warum messen Sie am Draht statt mit Logging im Code?

_(1B-Gerüst)_ Produktionscode durfte ich nicht ändern, und ein instrumentierter Laborbuild hätte genau den Pfad verändert, den ich messe. Der Mitschnitt auf beiden Hosts misst dieselbe Grenze, die der Betrieb sehen müsste, und die Inferenzzeit kommt aus den `timings` der Runtime. Den Proxy aus 1C habe ich verworfen, weil er als zusätzlicher Hop im Pfad gelegen hätte.
Beleg: [ADR 1B-006](../../adr/1B-006-zeitmessung-per-mitschnitt.md#alternativen)

### F2. Ihre Netzzeit kommt aus zwei VM-Uhren. Wie genau ist das?

_(neu)_ Jede Dauer wird auf einer einzigen Uhr gemessen, und erst die Dauern werden voneinander abgezogen; einen Uhrenabgleich brauche ich dafür nicht. Bei langen Anfragen schwankt die Differenz um etwa ± 1 ms, in Versuch 2 gab es deshalb sogar Werte bis −0,76 ms. Gegen die Schwelle von 50 ms spielt das keine Rolle.
Beleg: [ADR 1B-006](../../adr/1B-006-zeitmessung-per-mitschnitt.md#entscheidung), [Laufprotokoll, Beobachtungen](../../evidenz/1B/2026-11-13-lauf.md#beobachtungen)

### F3. Wann standen Hypothesen und Schwellen fest, und wer hat sie gesetzt?

_(neu)_ Vor jedem gewerteten Lauf: Die Schwellen hat die KI vorgeschlagen, ich habe sie mit dem Design freigegeben, und Änderungen gingen nur als datierter Nachtrag vor dem Lauf, so auch für M1–M4. In 1C gibt es zwei offengelegte Ausnahmen: T3.1 war exploratorisch, und M7b und M7c wurden erst nach Sichtung von M7 festgelegt.
Beleg: [1B-Design 6](../../specs/2026-11-12-1b-zwei-host-design.md#6-hypothesen-messgrößen-regeln-autor-aussagen-b-und-c-schwellen-ki-vorschlag), [ADR 1B-008](../../adr/1B-008-kernaussagen-und-schwellen.md#folgen), [1C-Ergebnis 4](../../1C-ergebnis.md#4-pflicht-nachweiskette)

### F4. Was ist Ihre ernsthafte Gegenalternative?

_(neu)_ In 1B: Netz und Adapter kosten zusammen mehr als 5 % oder mehr als 2 s, etwa durch zwei Anfragen je Auftrag oder einen doppelten Kontextaufbau. In 1C ist es die Gegenvariante V1 ohne Nachprüfung nach der Inferenz. Beide sind vor den Läufen festgelegt und gemessen, nicht nur benannt.
Beleg: [ADR 1B-008](../../adr/1B-008-kernaussagen-und-schwellen.md#entscheidung), [ADR 1C-010](../../adr/1C-010-nachpruefung-nach-inferenz-beibehalten.md#alternativen)

### F5. Sie haben den gewerteten Lauf wiederholt. Ist das nicht Rosinenpicken?

_(neu)_ Versuch 1 brach ab, weil das Host-Token nach 15 Minuten ablief, und Versuch 2 lief in Hintergrund-Updates beider VMs; die Wiederholung habe ich entschieden. Hypothesen, Schwellen, Kalibrierung und Auswertung blieben dabei unverändert. Und auch der gestörte Versuch 2 erfüllt H_B1 bis H_B3, die Rohdaten liegen im Repo.
Beleg: [Laufprotokoll, Ablauf und Abweichungen](../../evidenz/1B/2026-11-13-lauf.md#ablauf-und-abweichungen)

### F6. Warum haben Sie nach dem ersten Lauf etwas geändert?

_(1C-Gerüst)_ Die Abschnitte 1 bis 13 des Labor-Designs und das Laptop-Protokoll sind unverändert. Die Abschnitte 14 und 15 sind Nachträge, jeweils vor der Messung festgelegt. Die Korrektur zu 15.3 steht offen im PC-Protokoll und im ADR.
Beleg: [ADR 1C-021](../../adr/1C-021-zusatzlauf-produktionslimits-zweiter-rechner.md), [ADR 1C-024, Korrektur](../../adr/1C-024-prompt-cache-ram-begrenzen.md#korrektur-am-labor-design-153)

### F7. Warum haben Sie nicht `v1.3.0` gemessen?

_(neu)_ Der Prüfer hat per E-Mail verlangt, Fork und Clone vor der Untersuchung zu aktualisieren. Deshalb misst 1B den Fork-`main` `a19ca70f` und 1C `main@9f230abc` und im Nachlauf upstream `def56700`. Die Aussagen übertragen sich auf den Tag nur, soweit die Abweichungstabelle sie nicht berührt; das ist eine Gültigkeitsgrenze. Am Tag `v1.3.0` hatte die Runtime 4 CPUs und 5 GiB, der Q&A-Timeout lag bei 8 s; 8 CPUs, 8 GiB und 90 s gelten ab v1.4.0 (`git show v1.3.0:docker-compose.llm.yml`, `qaSummaryConfig.ts`).
Beleg: [ADR 1B-001](../../adr/1B-001-baseline-fork-main-a19ca70f.md), [ADR 1C-001](../../adr/1C-001-baseline-aktueller-main.md#folgen)

### F8. Wo weicht Ihr Labor vom Release ab?

_(neu)_ Gewählt ist nur eine Abweichung: der kalibrierte Timeout von 300 s statt 90 s. Erzwungen sind die übrigen, nämlich 4 statt 8 CPUs per Override, selbst gebaute Images per lokalem Digest, der Start ohne Wrapper, weil er das CPU-Override nicht durchreicht (seine Prüfungen liefen vorher im Trockenlauf), und die eingeschalteten Summary-Schalter. Alle stehen mit Grund im ADR und im Aufbauprotokoll, samt Rückweg zur Baseline.
Beleg: [ADR 1B-005](../../adr/1B-005-abweichungen-vom-release.md), [Aufbauprotokoll, Abweichungen](../../evidenz/1B/2026-11-12-aufbau.md#abweichungen-vom-release), [Laufprotokoll, Umgebung](../../evidenz/1B/2026-11-13-lauf.md#umgebung)

## Zahlen und Gültigkeit

### F9. Ist ein Laptop mit zwei VMs aussagekräftig für zwei Server?

**★ Top 5** _(1B-Gerüst, ergänzt)_ Für die Zeitzerlegung ja, für die Rückwirkung auf den App-Host nicht: Beide VMs teilen CPU und Cache, die App-VM liegt sogar auf den Hyperthread-Geschwistern der Runtime-Kerne. Das virtuelle Netz ist schneller als ein echtes, aber der Abstand zur Schwelle ist groß, 0,43 ms gegen 50 ms (ThinkPad P50, `8e9d1317`). Deshalb ist der Hauptwert die Netzzeit in Millisekunden und nicht der Prozentanteil.
Beleg: [ADR 1B-002](../../adr/1B-002-topologie-zwei-vms-ein-rechner.md#folgen), [1B-Design 8](../../specs/2026-11-12-1b-zwei-host-design.md#8-gültigkeitsgrenzen), [1B-Ergebnis](../../1B-ergebnis.md#kernaussage-b-wo-steckt-die-zeit)

### F10. Bremst die geteilte CPU nicht die Inferenz und verfälscht so die Zerlegung?

_(neu)_ Die Inferenz kann dadurch langsamer sein; getrennt gemessen habe ich das nicht, einen Same-Host-Vergleich S1 habe ich begründet weggelassen. Für die Zerlegung ist das nach dem Design unkritisch, weil die App während der Inferenz wartet. _Ergänzt 2026-11-17:_ Niklas hat S1 in Schritt 4 gemessen (Folie M4): Live-Latenz gemischt, kein Tempovorteil für einen Aufbau, die zweite Rolle ist betrieblich begründet ([ADR 1B-020](../../adr/1B-020-zweite-rolle-betrieblich-begruenden.md)). Die Kontrolle C0 nach M2 zeigt keinen messbaren Unterschied zwischen Strecke und lokal (−2,0 ms, ThinkPad P50, `9e111d35`); die Streuung je Seite ist größer als 5 ms, die eigentliche Zahl ist die Drahtmessung (0,43 ms).
Beleg: [1B-Design 8](../../specs/2026-11-12-1b-zwei-host-design.md#8-gültigkeitsgrenzen), [1B-Ergebnis, Nachtrag M1–M4](../../1B-ergebnis.md#nachtrag-m1m4-kontrolle-ausfall-und-netzbelege)

### F11. n = 10 in einer Reihe, ohne Signifikanztest. Wie belastbar ist das?

_(neu)_ Ich vergleiche Mediane mit vorab festgelegten Schwellen, und der Abstand ist groß: Netz im Maximum 1,36 ms gegen 200 ms, im Median 0,43 ms gegen 50 ms (ThinkPad P50, `8e9d1317`). „n = 10 in einer Reihe“ steht ausdrücklich als Gültigkeitsgrenze im Protokoll; den Kaltfall habe ich mit fünf weiteren Läufen auf n = 5 erweitert. In 1C sind es n = 20 je Rechner, und für die Gegenvariante V1 gibt es Bootstrap-Intervalle.
Beleg: [Laufprotokoll, Kennzahlen](../../evidenz/1B/2026-11-13-lauf.md#kennzahlen-und-bewertung), [Laufprotokoll, Gültigkeitsgrenzen](../../evidenz/1B/2026-11-13-lauf.md#gültigkeitsgrenzen), [1C Teil 2, M1–M5 und V1](../../evidenz/1C/2026-10-24-teil2.md#messungen-m1m5-und-gegenvariante-v1)

### F12. Warum ist 99,92 % Inferenzanteil nicht Ihr Hauptargument?

_(neu)_ Weil der Anteil auf langsamer Hardware von selbst hoch ausfällt: Je länger die Inferenz, desto kleiner wirkt das Netz. Deshalb stehen vorn Netz 0,43 ms und Transport 17,8 ms je Auftrag (Median, ThinkPad P50, `8e9d1317`), und den Prozentwert nenne ich auf Folie, Notiz und Handout nur mit diesem Hinweis. Auf schnellerer Hardware wäre die Inferenz kürzer und der Anteil kleiner.
Beleg: [ADR 1B-008](../../adr/1B-008-kernaussagen-und-schwellen.md#entscheidung), [Laufprotokoll, Kennzahlen](../../evidenz/1B/2026-11-13-lauf.md#kennzahlen-und-bewertung)

### F13. Was würde sich auf echter Server-Hardware ändern?

_(neu)_ Die Inferenz wäre kürzer: Schon der PC (i7-8700, Produktionslimits) brauchte im Median 98,8 s statt 163,4 s am Laptop (`9f230abc`), bei 8 statt 4 CPUs, also kein reiner Hardwarevergleich, und upstream meldet 56,9 s am Produktionshost, gemessen mit Instruktion v2 und von mir nicht nachgeprüft. Der Inferenzanteil sänke, und ein physisches Netz wäre langsamer als das virtuelle; gemessen habe ich das nicht, aber der Abstand zur Schwelle ist groß (0,43 ms gegen 50 ms, ThinkPad P50, `8e9d1317`). Die Rückwirkung auf den App-Host lässt sich erst auf getrennter Hardware messen; das ist Niklas' Schritt 3.
Beleg: [ADR 1C-023](../../adr/1C-023-release-timeout-90-s-zu-kurz.md#alternativen), [1B-Design 8](../../specs/2026-11-12-1b-zwei-host-design.md#8-gültigkeitsgrenzen)

### F14. Warum steht im Titel 152 Sekunden, und wie realistisch sind die warmen Zeiten?

_(neu)_ 152 s ist die Wartezeit am Client von Auftrag 2 vom Klick bis zum Endstatus (151,8 s), die Jobdauer am Server T_job war 151,2 s; dazwischen liegen der Host-Aufruf und das Nachfragen des Treibers im Sekundentakt (ThinkPad P50, `8e9d1317`). Warm heißt hier: identischer Snapshot, der Prompt kam fast ganz aus dem KV-Cache (Median warm 148,6 s); ändert sich der Zustand wie im Betrieb, liegt man eher beim Kaltwert, Auftrag 1 mit 213,7 s und fünf Kaltläufe im Median 200,5 s (`9e111d35`). Für H_B3 ändert das nichts, der Inferenzanteil liegt auch kalt über 95 %.
Beleg: [Laufprotokoll, Ergebnis je Auftrag](../../evidenz/1B/2026-11-13-lauf.md#ergebnis-je-auftrag-versuch-3), [ADR 1B-011](../../adr/1B-011-zeitbegriffe-und-leitfrage.md#entscheidung)

### F15. Was ist mit den rund 350 ms „Server ohne Inferenz“ bei Auftrag 2 und 3?

_(neu)_ Das ist echt und trat in Versuch 2 an denselben Aufträgen genauso auf; sonst liegt der Wert bei 16 bis 18 ms. Die Ursache habe ich nicht untersucht. Es liegt unter den Schwellen und ändert kein Urteil.
Beleg: [Laufprotokoll, Beobachtungen](../../evidenz/1B/2026-11-13-lauf.md#beobachtungen)

### F16. Gelten die Zahlen für Produktion?

_(1C-Gerüst)_ Zeiten gelten nur je Rechner und Commit; upstream meldet 56,9 s am Produktionshost, aber mit Instruktion v2, historisch, und den Swap dieses Hosts kenne ich nicht. Die mit PR #643 gemergten Commits ändern Instruktion, Grammatik und Quality-Gate, deshalb sind die Inferenzzeiten von `9f230abc` nicht übertragbar. Auf `def56700` waren es am Laptop 223,7 s, mit mehr Ausgabetokens und bei Nebenlast.
Beleg: [ADR 1C-023](../../adr/1C-023-release-timeout-90-s-zu-kurz.md), [ADR 1C-022](../../adr/1C-022-codestand-eingefroren-9f230abc.md), [Nachlauf N3](../../evidenz/1C/2026-11-09-labor-nachlauf.md#n3-zeiten)

### F17. Woher wissen Sie, dass Ihr Messproxy in 1C nichts beschönigt?

_(neu)_ Von den elf Prüfungen in L1 und N1 ist eine nicht unabhängig: „weitergeleitete Bytes gleich empfangene“ ist durch die Konstruktion des Proxys wahr, und das habe ich im Ergebnisbericht offengelegt. Die übrigen zehn Prüfungen hängen davon nicht ab. Welchen Anteil der Proxy an den Laborzeiten hat, ist nicht geprüft.
Beleg: [1C-Ergebnis 8](../../1C-ergebnis.md#8-gültigkeitsgrenzen-gesamt), [1C-Ergebnis 9](../../1C-ergebnis.md#9-offene-punkte-und-fragen-an-den-prüfer)

### F18. Wie reproduzierbar ist Ihr Aufbau?

_(neu)_ `labor.sh up` baut das Labor von null in einem Durchgang; am 2026-11-13 habe ich das zweimal gemacht, morgens und abends, beide Male mit allen Prüfungen grün. Jedes Ergebnis-JSON hält Rechner, Hypervisor und VMs fest, und die 1C-Kennzahlen lassen sich mit `auswertung.mjs` aus den Rohdaten nachrechnen. Bitgleich sind die Images nicht, ein Neubau ergibt einen anderen Digest, deshalb hält jeder Lauf seinen Digest selbst fest.
Beleg: [Laufprotokoll, Umgebung](../../evidenz/1B/2026-11-13-lauf.md#umgebung), [Laufprotokoll, Nachtrag](../../evidenz/1B/2026-11-13-lauf.md#nachtrag-2026-11-13-abends-ergänzende-messungen-m1m4), [Aufbauprotokoll, Befund 1](../../evidenz/1B/2026-11-12-aufbau.md#befunde-für-kernaussage-c), [1C-Ergebnis 7](../../1C-ergebnis.md#7-kosten-der-validierung-und-kontextbereitstellung)

## Architektur und Betrieb

### F19. Ist der Host wirklich entkoppelt?

_(1C-Gerüst)_ Vom Modell ja, vom Kontextaufbau nicht; das ist die Grenze B1. Der Host-Aufruf kehrt im Median nach 29,4 ms zurück, der kürzeste Austausch mit der Runtime dauerte 195,6 s (Laptop, `def56700`).
Beleg: [ADR 1C-012](../../adr/1C-012-entkopplung-host-aufruf-beibehalten.md#belege)

### F20. Was passiert, wenn die Runtime ausfällt?

_(1C-Gerüst)_ Der Fallback greift mit `unavailable` oder `busy`, und der Host bekommt trotzdem einen Endstatus. Belegt ist das durch die OOM-Kills in beiden Läufen vom 2026-11-05 (`9f230abc`) und ebenso im Nachlauf, dort dreimal `unavailable` (Laptop, `def56700`).
Beleg: [ADR 1C-024](../../adr/1C-024-prompt-cache-ram-begrenzen.md), [ADR 1C-019](../../adr/1C-019-endstatus-echter-pfad-beibehalten.md), [Nachlauf N4](../../evidenz/1C/2026-11-09-labor-nachlauf.md#n4-endstatus)

### F21. Warum verzichten Sie nicht auf die Nachprüfung nach der Inferenz?

_(1C-Gerüst)_ Die Ersparnis wäre gering, die Nachprüfung kostet 0,03 % eines Auftrags am Laptop und 0,04 % am PC (`9f230abc`). Das Hauptargument ist aber das Risiko: Ohne Nachprüfung war der Queue-Zustand in 10 von 10 Änderungsläufen veraltet.
Beleg: [ADR 1C-010](../../adr/1C-010-nachpruefung-nach-inferenz-beibehalten.md)

### F22. Ist `source_changed` bei Stimmen ein Fehler?

_(1C-Gerüst)_ Nein, das ist die gewollte Hashgrenze: Jede Stimme ändert die Daten, also auch den Hash. Wie oft das unter Voting passiert, habe ich mit Test-Runtime gemessen (M7), aber mein Vorhersagemodell verfehlte sein Kriterium; die Laborwerte 0,97–0,99 sind nur Vorhersagen dieses Modells bei angenommenen 0,5 Stimmen/s. Deshalb halte ich eine Änderungsempfehlung zurück.
Beleg: [ADR 1C-017](../../adr/1C-017-m7-empfehlung-zurueckgehalten.md), [Dossier 8.4](../../1C-kontext-und-adapterpfad.md#84-bewertung-der-grenze-material-für-schritt-4)

### F23. Was ist an T3.1 anders?

_(1C-Gerüst)_ Hier ändert sich der Hash ganz ohne Datenänderung, weil das Fensterende einer live Blitzlicht-Runde am Zeitpunkt des Aufbaus hängt. Auf dem echten Pfad bestätigt: YESNO 5 von 5 `source_changed`, TEMPO 0 von 5 (Laptop, `def56700`). Die Empfehlung steht in Issue #18, umgesetzt ist sie nicht.
Beleg: [ADR 1C-016](../../adr/1C-016-zeitabhaengiger-hash-blitzlicht.md), [Nachlauf N5](../../evidenz/1C/2026-11-09-labor-nachlauf.md#n5-t31-auf-dem-echten-pfad)

### F24. Woher wissen Sie, dass nichts still verloren geht?

_(1C-Gerüst)_ Vorschau und Draht sind byte-gleich, 20 von 20 auf Laptop und PC (`9f230abc`). Mutationsproben machen die Tests rot, und die Negativprobe E4 wird erst rot, wenn beide Vertragsschichten wegfallen. Zwei Ausnahmen sind benannt: der Themen-Snapshot fremder Version (T2.3) und Kürzungen aus Budgetgründen.
Beleg: [ADR 1C-013](../../adr/1C-013-vorschau-gleich-nutzlast-beibehalten.md), [ADR 1C-011](../../adr/1C-011-strikte-vertragsvalidierung-beibehalten.md), [1C-Ergebnis 3](../../1C-ergebnis.md#3-auftragsschritte-14)

### F25. Sind die Ausgabegrenzen stimmig?

_(1C-Gerüst)_ Auf `9f230abc` nicht: Instruktion, Grammatik, Schema und Bindung hatten vier verschiedene Grenzen, benannt, aber ohne Empfehlung. Auf `def56700` verlangen Instruktion und Grammatik beide 2 bis 4 Aussagen. Neu ist dort das Quality-Gate mit mindestens zwei Aussagen der Form „Lead: Satz“, und daran scheitern alle 28 aufgezeichneten Antworten im Nachlauf.
Beleg: [Kernbefunde 6](../../1C-diagrams.md#kernbefunde), [ADR 1C-018](../../adr/1C-018-quality-gate-verwirft-echte-antworten.md)

### F26. Warum zählen Sie nicht genauer statt in Bytes?

_(1C-Gerüst)_ Die Byte-Schätzung ist sicher, sie überschätzt nie, verschenkt aber rund zwei Drittel des geschätzten Budgets: q = 0,318 (Laptop, `def56700`). Eine exakte Zählung oder ein Faktor sind beide nur als Prüfkandidaten benannt, gemessen habe ich keinen davon.
Beleg: [ADR 1C-014](../../adr/1C-014-byte-schaetzung-kontextbudget-pruefen.md)

### F27. Warum stirbt die Runtime am Prompt-Cache, und trifft das die App?

_(neu)_ Bei wechselnden Prompts wächst der Speicher der Runtime am Laptop um 0,419 GB je Auftrag im Median; beide Grenzen sind 10 GiB (Labor 5 + 5, Produktion 8 + bis zu 2 GiB Swap; den Swap des Produktionshosts kennt niemand, ohne Swap gelten 8 GiB). Auf `9f230abc` beendete der Kernel die Runtime im 21. Auftrag, am Laptop und am PC; auf `def56700` schon im 19. Dort hat jeder Auftrag mehr Tokens; ob das die Ursache ist, habe ich nicht getrennt gemessen, denn der Zuwachs je Auftrag war auf beiden Ständen ähnlich (0,419 gegen 0,41–0,43 GB, ADR 1C-024). Mit abgeschaltetem Cache war das Wachstum am PC 0,000 GB (U1). Getroffen wurde nur der Runtime-Container, die App beantwortete jeden Auftrag mit dem Fallback. Im 1B-Lauf blieb der Speicher ab dem zweiten Auftrag bei höchstens 4,04 GB (ThinkPad P50, `8e9d1317`); plausibel ist, dass derselbe Prompt jedes Mal aus dem Cache kam (`cache_n` 2344), getrennt gemessen habe ich das nicht.
Beleg: [ADR 1C-024](../../adr/1C-024-prompt-cache-ram-begrenzen.md), [Nachlauf N6](../../evidenz/1C/2026-11-09-labor-nachlauf.md#n6-speicher), [Laufprotokoll 1B, Beobachtungen](../../evidenz/1B/2026-11-13-lauf.md#beobachtungen), [Speicherverlauf 1B](../../evidenz/1B/messung/2026-11-13-speicher.csv)

## Sicherheit und Datenschutz

### F28. Schützt das private Netz die Runtime ausreichend?

**★ Top 5** _(1B-Gerüst)_ Allein nicht: Die Firewall lässt Port 8080 nur vom App-Host zu, dazu kommt ein Bearer-Token, der aber im Klartext über HTTP läuft. Ein privates Netz belegt weder Autorisierung noch Datenschutz, das ist die Gültigkeitsgrenze des Auftrags. Datenschutz hängt am Inhalt der Prompts, nicht am Netz.
Beleg: [ADR 1B-003](../../adr/1B-003-laborregel-virtuelles-netz.md#folgen), [Belege M1](../../evidenz/1B/messung/2026-11-13-belege/), [Auftrag 1B](../../../didaktik/CLOUD-COMPUTING-REFERAT-PRUEFUNG.md#gruppenauftrag-1b-private-inferenz-als-getrennte-serverrolle)

### F29. Haben Sie geprüft, dass ein dritter Host die Runtime nicht erreicht?

_(neu)_ Nur teilweise: Einen dritten Host im Labornetz gab es nicht, vom Laptop aus ist nur geprüft, dass Port 8080 gesperrt ist, und die Tests ohne und mit falschem Token liefen im llm-host selbst. M1 belegt dazu, dass `llama-server` nur auf der privaten Adresse hört und Anfragen nur vom App-Host ankommen. Dass das Runbook keinen Befehl für den Dritthost-Test nennt, ist als Issue #22 angelegt.
Beleg: [ADR 1B-003](../../adr/1B-003-laborregel-virtuelles-netz.md#belege), [Laufprotokoll, Nachtrag M1](../../evidenz/1B/2026-11-13-lauf.md#nachtrag-2026-11-13-abends-ergänzende-messungen-m1m4)

### F30. Liegen Token, Mitschnitte oder personenbezogene Daten im Repo?

_(neu)_ Nein: Mitschnitte enthalten den Token und bleiben auf dem Messrechner, ins Repo kommen nur abgeleitete Zeiten, Größen und Statuscodes; der Antwort-Ausschnitt auf Folie J13 enthält nur Modellausgabe und Torergebnis, mit Prüfsumme der Quelldatei. Name und Matrikelnummer stehen nur im Abgabe-PDF, der Bau liest sie aus einer Datei außerhalb des Repos. Die Daten sind synthetisch, die Referenzfixture aus #456.
Beleg: [Runbook 7](../../evidenz/1B/runbook.md#7-datenregeln), [ADR 1B-006](../../adr/1B-006-zeitmessung-per-mitschnitt.md#folgen), [Antwort-Ausschnitt](../../evidenz/1B/messung/2026-11-15-abgelehnte-antwort.json), [Präsentations-Design 8](../../specs/2026-11-15-praesentation-jonas-design.md#8-vorführung-und-bau)

### F31. Ist der Token aus den Mitschnitten inzwischen ungültig?

_(neu)_ Noch nicht: Die Labor-VMs sind gestoppt, nicht gelöscht, und die Mitschnitte liegen unter `~/labor-1b/` auf dem Messrechner. Verworfen ist er erst mit `labor.sh destroy` und dem Löschen der Mitschnitte. Das Labornetz ist von außen nicht erreichbar, ohne Portweiterleitung und ohne Bridging.
Beleg: [ADR 1B-003](../../adr/1B-003-laborregel-virtuelles-netz.md#folgen)

## Entscheidung

### F32. Prüft das Gate das Richtige, wenn es nach der Form verwirft?

**★ Top 5** _(neu, Folie J15)_ Das Gate prüft mehr als die Form (mindestens zwei Aussagen, verschiedene Stichwörter, ganze Sätze, keine Metamuster), aber weder Sprache noch Thema; die Antworten der ruhigen Läufe verwirft es allein wegen der fehlenden Form „Lead: Text“, inhaltlich verfehlen sie die Instruktion ebenfalls (englisch, Moderationsstatus). Entfernen würde ich es deshalb nicht; solange Instruktion, Grammatik und Gate nicht zum ausgelieferten Modell passen, sieht die Lehrperson immer den Fallback mit dem allgemeinen Hinweis „Eine ausführliche Zusammenfassung war diesmal nicht möglich …“, den Grund erfährt sie nicht. Meine Empfehlung ist, alle drei gemeinsam am Modell abzustimmen und mit echter Runtime abzunehmen; umgesetzt ist das nicht.
Beleg: [ADR 1C-018](../../adr/1C-018-quality-gate-verwirft-echte-antworten.md#alternativen), Issue [#13](https://github.com/NiklasSkulll/arsnova.eu/issues/13), Hinweistext `apps/backend/src/lib/qaSummaryExtractive.ts` (Anzeige unter „Hinweise“ in `moderation-compass-dialog.component.html`)

### F33. Welche Kriterien hat das Gate, und woran scheitert das Modell?

_(neu)_ Verlangt sind mindestens zwei Aussagen der Form „Lead: Text“ mit Trenner in den ersten 48 Zeichen, verschiedene Leads, ein ganzer Satz ab 12 Zeichen und kein Treffer der Metamuster; die Sprache prüft es nicht. Im 1B-Lauf hatte keine der 40 Aussagen einen Lead, alle 10 Antworten wurden verworfen (ThinkPad P50, `8e9d1317`), in 1C bestand keine der 28 Antworten (Laptop, `def56700`). Warum das Modell die Form verfehlt, ist nicht untersucht; die Ansatzpunkte im ADR sind nicht gemessen.
Beleg: [ADR 1C-018](../../adr/1C-018-quality-gate-verwirft-echte-antworten.md#kontext), [Laufprotokoll, Befund](../../evidenz/1B/2026-11-13-lauf.md#befund-jede-modellantwort-verworfen)

### F34. 1C-019 sagt 19 von 20 `full-context`, 1C-018 sagt 0 von 20. Was gilt?

_(neu)_ Beides, aber für verschiedene Codestände: 19 von 20 gilt für `main@9f230abc` (Laptop und PC), mit Instruktion v2 und ohne Quality-Gate. Derselbe Upstream-Commit `12f1d8e4` brachte Instruktion v5 und das Gate, `a998ada0` dehnte das Gate auf `uncertain` aus und fasste die Metamuster enger (PR #643); welcher Teil wie viel bewirkt, ist nicht getrennt gemessen, und auf `def56700` endete kein Auftrag mehr `full-context` (Laptop). Beide Gate-Commits sind nicht in `v1.3.0`, aber in `v1.4.0`, und die Pfaddateien sind zwischen `v1.4.0` und `def56700` byte-gleich; der Befund betrifft also das Release 1.4.0, nicht 1.3. Für die Diskussion: Ein Upgrade hat das Ergebnis gekippt (Instruktion und Gate zugleich), und upstream prüft nicht, ob das ausgelieferte Modell die verlangte Form trifft (ADR 1C-018, Kontext).
Beleg: [1C-Ergebnis 2](../../1C-ergebnis.md#2-kurzantwort), [ADR 1C-019](../../adr/1C-019-endstatus-echter-pfad-beibehalten.md), [ADR 1C-018](../../adr/1C-018-quality-gate-verwirft-echte-antworten.md)

### F35. Wer legt den Timeout fest: das Release oder der Betreiber?

**★ Top 5** _(neu, Folie J15)_ Der Betreiber am Inferenz-Host: eine Anfrage mit echtem Body messen und beide Timeouts auf diese Zeit plus Reserve setzen, höchstens 300 s. Den Default blind auf 300 s anzuheben empfehle ich nicht, weil bei einem Slot und einer Queue dann auch Folgeaufträge länger warten. Auf beiden Laborrechnern reichen 90 s nicht, schon die Kalibrierung am PC dauerte 98,7 s (`9f230abc`); umgesetzt ist die Empfehlung nicht.
Beleg: [ADR 1C-023](../../adr/1C-023-release-timeout-90-s-zu-kurz.md#entscheidung), [ADR 1C-020](../../adr/1C-020-timeout-300-s-und-kalibrierungsregel.md#belege)

### F36. Was würden Sie zuerst ändern?

_(1C-Gerüst)_ `--cache-ram` begrenzen: Die Änderung ist eine Zeile, und der Nutzen ist gemessen. Der Prefill bleibt gleich; die Ausgabe war im Arm ohne Cache in 10 von 10 Paaren langsamer, um 3 % im Median, wegen der festen Reihenfolge aber nicht dem Cache zuzuordnen (PC, `9f230abc`).
Beleg: [ADR 1C-024](../../adr/1C-024-prompt-cache-ram-begrenzen.md)

### F37. Warum liefern Sie eine Empfehlung und keinen Patch?

_(neu)_ Das Prüfungsdokument verlangt keinen Produktivpatch, die Leistung liegt in Analyse, Messung und begründeter Empfehlung. Dazu galt für das Referat die Regel, Produktionscode nicht zu ändern. Deshalb steht jede Änderung als „empfohlen, nicht umgesetzt“ im ADR und als Issue im Fork.
Beleg: [ADR 1C-004](../../adr/1C-004-empfehlung-statt-patch.md), [Prüfungsdokument 4.1.3](../../../didaktik/CLOUD-COMPUTING-REFERAT-PRUEFUNG.md#413-gemeinsamer-untersuchungs--und-evidenzrahmen)

## KI-Anteil und Eigenleistung

### F38. Was haben Sie selbst entschieden, und was die KI?

**★ Top 5** _(neu)_ Entschieden habe ich unter anderem den Auftrag (Summary V2 mit der Referenzfixture), die Kernaussagen B bis D, die Timeout-Regel, die Wiederholung von Versuch 2, den Umfang von M1–M4 und das Weglassen von S1. Die KI hat Skripte, Tests, Auswertung, Protokolle und Diagramme entworfen und Schwellen und Messmethode vorgeschlagen, im Design als „KI-Vorschlag“ markiert und von mir freigegeben. Wer was gemacht hat, steht je Artefakt in den Eigenanteil-Dateien, ohne Prozentangabe.
Beleg: [1B-Eigenanteil](../../1B-eigenanteil.md#was-der-autor-entschieden-hat), [1C-Eigenanteil](../../1C-eigenanteil.md#belegte-entscheidungen-des-autors)

### F39. Wie haben Sie die Ergebnisse der KI geprüft?

_(neu)_ In 1C habe ich am 2026-11-12 den Ergebnisbericht gelesen und die Kernzahlen der drei Laborläufe stichprobenartig mit `auswertung.mjs` aus den Rohdaten nachgerechnet, ohne Abweichung. In 1B habe ich Ergebnisbericht und Protokolle am 2026-11-13 geprüft und die Nachträge am 2026-11-14. Die Reviews dazwischen waren KI-Sitzungen, keine menschlichen Gutachten; das steht so in der Offenlegung.
Beleg: [1C-Eigenanteil, Autorenprüfung](../../1C-eigenanteil.md#stand-der-autorenprüfung), [1B-Eigenanteil, Prüfung](../../1B-eigenanteil.md#prüfung-durch-den-autor)

### F40. Hat die KI auch ohne Ihre Freigabe gehandelt?

_(neu)_ Ja, zweimal offengelegt: In 1C liefen M7b und M7c ohne meine vorherige Freigabe, und das bleibt als Abweichung stehen. In der Nacht zum 2026-11-13 hat die KI in meinem Auftrag Entscheidungen getroffen, etwa „nicht bewertbar“, wenn einem Auftrag eine Komponente fehlt; die habe ich danach bestätigt.
Beleg: [1C-Eigenanteil, Autorenprüfung](../../1C-eigenanteil.md#stand-der-autorenprüfung), [1B-Eigenanteil, KI](../../1B-eigenanteil.md#was-die-ki-gemacht-hat)

### F41. Welche KI, welches Modell, und können Sie das belegen?

_(neu)_ Claude Code von Anthropic mit Serena und codebase-memory-mcp, laut Protokollen mit dem Modell Claude Opus 5.5. Die Modellkennung ist nicht unabhängig geprüft, das steht so in beiden Eigenanteil-Dateien.
Beleg: [1B-Eigenanteil, Lesehilfe](../../1B-eigenanteil.md#lesehilfe), [1C-Eigenanteil, Lesehilfe](../../1C-eigenanteil.md#lesehilfe)

## Fragen an die Grenze zu Niklas' Teil

### F42. Lohnt sich die zweite Serverrolle?

_(1B-Gerüst)_ Das bewertet Niklas in den Schritten 3 und 4: Aufwand gegen Trennung von Fehler- und Ressourcenbereichen. Mein Beitrag dazu ist nur die Zeitseite: Die Topologie kostet keine relevante Zeit, der Transport liegt im Median bei 17,8 ms (ThinkPad P50, `8e9d1317`).
Beleg: [1B-Ergebnis](../../1B-ergebnis.md#entscheidung), [ADR 1B-011](../../adr/1B-011-zeitbegriffe-und-leitfrage.md#entscheidung)

### F43. Wer ist verantwortlich, wenn die Runtime ausfällt?

_(1B-Gerüst)_ Technisch fällt die App auf die extraktive Zusammenfassung zurück, im Labor nach 88,5 ms im Median, ohne Wartezeit (B0, ThinkPad P50, `9e111d35`). Den Betrieb der zweiten Rolle trägt der Operator mit Sofort-Rollback und Regelbetrieb nach dem Runbook. Einen Ablauf für den Tokenwechsel nennt das Runbook nicht.
Beleg: [Laufprotokoll, Nachtrag M3](../../evidenz/1B/2026-11-13-lauf.md#nachtrag-2026-11-13-abends-ergänzende-messungen-m1m4), [Second-Host-Runbook 15](../../../operations/OPEN-WEIGHT-LLM-SECOND-HOST-RUNBOOK.md#15-sofort-rollback), [16](../../../operations/OPEN-WEIGHT-LLM-SECOND-HOST-RUNBOOK.md#16-regelbetrieb)

### F44. Was passiert, wenn der zweite Host langsam ist?

_(neu)_ Das ist Niklas' Schritt 3 und meine Übergabe am Ende von J15. Ich liefere dafür die gemeinsamen Zeitbegriffe, an denen sich zeigen lässt, ob eine Störung T_transport oder T_infer verändert, und in 1C ist der langsame Empfänger mit einer Test-Runtime geprüft (E6b), nicht im Zwei-Host-Aufbau.
Beleg: [ADR 1B-011](../../adr/1B-011-zeitbegriffe-und-leitfrage.md#folgen), [1C-Ergebnis 3](../../1C-ergebnis.md#3-auftragsschritte-14), [Runbook 8](../../evidenz/1B/runbook.md#8-übergabe-an-niklas-schritte-34)

### F45. Wie wirkt die Runtime auf den App-Host zurück?

_(neu)_ Das habe ich nicht gemessen, und mein Labor reicht dafür nicht, weil beide VMs sich CPU und Cache teilen. Die Rückwirkung untersucht Niklas in Schritt 3 auf eigener Hardware, die Ressourcengrenze des App-Hosts in 1A. Aus 1C weiß ich nur, dass der OOM-Kill den Runtime-Container traf und die App mit dem Fallback weiterlief.
Beleg: [ADR 1B-002](../../adr/1B-002-topologie-zwei-vms-ein-rechner.md#folgen), [1C-Ergebnis, Bezug zu 1A und 1B](../../1C-ergebnis.md#bezug-zu-1a-und-1b)

### F46. Welche Artefakte teilen Sie mit Niklas, und wem werden sie zugerechnet?

_(neu)_ Laborinstanz und Inferenz-Host liegen bei mir; Niklas nutzt für die Schritte 3 und 4 die Skripte und das Runbook, nicht meine Geräte, und die Zeitbegriffe gelten für beide. Fixture und Test-Runtime sind in meinem Branch entstanden, sind aber als gemeinsam genutzt gekennzeichnet, nicht als alleinige Leistung. Was für 1B neu ist und was aus 1C übernommen, steht im Eigenanteil.
Beleg: [1B-Eigenanteil, Gemeinsame Artefakte](../../1B-eigenanteil.md#gemeinsame-artefakte), [1C-Eigenanteil, Gemeinsame Artefakte](../../1C-eigenanteil.md#gemeinsame-artefakte), [ADR 1B-009](../../adr/1B-009-portabilitaet-linux-windows.md)

### F47. Warum tragen Sie 1C und 1B 1–2 am Stück vor statt in der Reihenfolge der Aufträge?

_(neu)_ Weil ein echter Auftrag beide Teile durchläuft: vom Klick über den Kontextpfad (1C) über den zweiten Host (1B) bis zur Ersatzzusammenfassung, jede Station mit ihrem Auftrag etikettiert. So gibt es nur zwei Sprecherwechsel: Niklas eröffnet mit Titel, Fahrplan und 1A und übergibt mit „Was, wenn wir die schwere Arbeit auslagern?“; ich übergebe auf J15 mit „Und wenn der zweite Host langsam ist oder ausfällt?“ an seine Schritte 3–4, Fazit und Dank spricht er. _Ergänzt 2026-11-16:_ So steht es jetzt im gemeinsamen Deck.
Beleg: [Präsentations-Design 3](../../specs/2026-11-15-praesentation-jonas-design.md#3-reihenfolge-der-gruppe), [Aufteilung](../../01-aufteilung.md#gemeinsame-präsentation-empfehlung-offen)

### F48. Ist der Clip auf J13 ein Nachweis für das Gate?

_(neu; Korrigiert 2026-11-17: der Clip ist seit dem 15.11. Lauf 4, nicht mehr der Timeout-Lauf)_ Nein, der Clip ist Illustration, kein Nachweis. Er zeigt Lauf 4 vom 15.11. im Profil `performance` wie der gewertete Lauf: Klick bis Ergebnis 148,6 s, laut App-Log `fallbackReason: 'invalid_response'`, `latencyMs: 147748`; das Quality-Gate verwarf die Antwort wie im gewerteten Lauf. Die Wartezeit ist im Clip auf 4 s gerafft. Ein früherer Lauf im Energiesparprofil endete am Labor-Timeout von 300 s (`fallbackReason: 'timeout'`); auch dann sieht die Lehrperson dieselbe Ersatzzusammenfassung mit demselben Hinweis und erfährt den Grund nicht. Die Gate-Zahlen stammen aus dem gewerteten Lauf.
Beleg: [Clip-Protokoll](../../evidenz/1B/2026-11-15-clip.md#ergebnis), [Laufprotokoll 1B](../../evidenz/1B/2026-11-13-lauf.md)

## Kursbezug Cloud Computing _(neu, 2026-11-16)_

Diese Fragen kommen aus einem Prüfer-Kreuzverhör vom 2026-11-16: Der Kursbezug (NIST, Elastizität, SLO, Mandanten) fehlte bisher. Kapazitäten sind aus dem Code gerechnet, nicht gemessen; das sage ich so.

### F49. Ihre Leitfrage sagt „unter realer Last“. Was passiert, wenn 100 Sessions gleichzeitig zusammenfassen?

Der Client lässt nur einen Aufruf zugleich zu, ein zweiter bekommt `busy`; die Queue arbeitet einen Auftrag nach dem anderen ab und nimmt standardmäßig höchstens 8 an, danach `queue_full` mit extraktivem Ersatz. Bei rund 150 s je Auftrag am Laptop schafft ein Slot etwa 24 Zusammenfassungen pro Stunde, von 100 Sessions bekäme die große Mehrheit den Ersatz. Das ist eine Rechnung aus dem Code, gemessen habe ich nur sequentiell (E11 zeigt `queue_full` mit Limit 2 im Test).
Beleg: [`openWeightLlmClient.ts`, `inFlight`](../../../../apps/backend/src/lib/openWeightLlmClient.ts), [`qaSummaryConfig.ts`](../../../../apps/backend/src/lib/qaSummaryConfig.ts), [`qaSummaryQueue.ts`, `queue_full`](../../../../apps/backend/src/lib/qaSummaryQueue.ts), [E11](../../evidenz/1C/2026-10-24-teil3.md#e11--volle-queue-queue_full)

### F50. Wo ist hier Cloud Computing? Ordnen Sie das nach NIST ein.

App und Inferenz laufen auf fest bereitgestellten Maschinen, also IaaS-Betrieb ohne Selbstbedienung zur Laufzeit. Ressourcenbündelung und Netzzugang sind gegeben, schnelle Elastizität fehlt: Die Inferenz skaliert nur vertikal und von Hand, ein Slot bleibt ein Slot. Die zweite Rolle ist ein Bulkhead, ein getrennter Fehler- und Ressourcenbereich, keine elastische Ressource.
Beleg: Mell und Grance 2011 (NIST SP 800-145), S. 2–3, im Handout zitiert, [ADR-0035, 2.1–2.2](../../../architecture/decisions/0035-self-hosted-llm-runtime-llama-cpp-over-ollama.md), Dean und Barroso 2013, S. 74

### F51. Formulieren Sie ein SLO für den Kompass. Ist ein Fallback, der immer greift, ein Erfolg?

Ich würde zwei Ziele trennen: Verfügbarkeit, etwa „95 % der Aufträge haben nach 300 s einen Endstatus“, und Nutzen, etwa „ein festgelegter Anteil endet `full-context`“. Das erste erfüllt der Pfad im Labor dank Fallback, das zweite liegt bei 0 von 20. Graceful Degradation tauscht Qualität gegen Verfügbarkeit; ohne Nutzenziel sieht ein solcher Dienst gesund aus und liefert nichts.
Beleg: [ADR 1C-018](../../adr/1C-018-quality-gate-verwirft-echte-antworten.md), [ADR 1C-019](../../adr/1C-019-endstatus-echter-pfad-beibehalten.md), Ulrich 2016, Abschn. „Load Shedding and Graceful Degradation“

### F52. Alle Lehrenden teilen sich einen Slot und einen Prompt-Cache. Wie steht es um die Isolation zwischen Mandanten?

Es gibt keinen Fair-Share: Eine Session belegt den Slot, die anderen warten in der Queue oder bekommen `queue_full`, und ein OOM durch den Cache trifft alle. Geteilt wird im Cache nur das gemeinsame System-Präfix (135–137 Tokens), Inhalte anderer Sessions sehe ich darin nicht; geprüft habe ich das nicht. Für mehrere Mandanten bräuchte es Kontingente je Session oder mehrere Slots.
Beleg: [ADR 1C-024](../../adr/1C-024-prompt-cache-ram-begrenzen.md), [ADR-0035, 2.2](../../../architecture/decisions/0035-self-hosted-llm-runtime-llama-cpp-over-ollama.md)

### F53. Ihr Laptop ist x86, Produktion ein anderer Host. Was überträgt sich?

Die Zerlegung überträgt sich, die Inferenzzeit nicht: andere CPU, andere Kernzahl, bei Cloud-vCPUs zusätzlich Störungen durch Nachbarn. Upstream meldet für den Produktionshost 56,9 s (v2, historisch), dort hätten 90 s gereicht; für v5 verlangt upstream selbst eine neue Messung. Netz im Rechenzentrum liegt ebenfalls weit unter den 50 ms der Schwelle, gemessen habe ich das nicht.
Beleg: [ADR 1C-023](../../adr/1C-023-release-timeout-90-s-zu-kurz.md), [ADR 1C-022](../../adr/1C-022-codestand-eingefroren-9f230abc.md)

### F54. Wofür private Inferenz, wenn das Netz unverschlüsselt ist?

Der Gewinn ist, dass Fragen der Teilnehmenden, die personenbezogen sein können, den eigenen Betrieb nicht verlassen; das ist ein Datenschutz- und kein Leistungsargument. Ein privates Netz beim Hoster ist aber nicht verschlüsselt, der Token läuft im Klartext. Ich würde WireGuard oder mTLS zwischen den Hosts empfehlen; den Aufwand hat Niklas' Teil.
Beleg: [Laufprotokoll 1B, Grenzen](../../evidenz/1B/2026-11-13-lauf.md), [1B-Ergebnis](../../1B-ergebnis.md)

### F55. H_B3 mit 95 % – konnte die überhaupt scheitern?

Kaum: Bei bekannter Inferenz um 200 s hätten Netz und Adapter über 10 s kosten müssen. Deshalb nenne ich H_B3 eine Konsistenzprüfung; prüfbar sind H_B1 und H_B2 gegen die Alternative doppelter Kontextaufbau oder zwei Anfragen. Die Hauptzahl ist 0,43 ms Netz, nicht der Prozentanteil.
Beleg: [ADR 1B-008](../../adr/1B-008-kernaussagen-und-schwellen.md)

### F56. n = 10, neun davon mit identischem Prompt: Sind das unabhängige Wiederholungen? Wo sind die Konfidenzintervalle?

Nein, es ist ein Lauf mit zehn Aufträgen; die warmen wiederholen denselben Zustand (Spanne 148,1–158,3 s). Deshalb gibt es fünf Kaltläufe mit frischer Runtime. Für das Urteil reicht der Abstand zur Schwelle (Faktor über 100), für die Zahl selbst fehlt ein Intervall; das sage ich im Handout offen.
Beleg: [Laufprotokoll 1B](../../evidenz/1B/2026-11-13-lauf.md), Papadopoulos et al. 2021, Kap. 2.3

### F57. Vorher 19 von 20 Modellzusammenfassungen. Vielleicht verwirft das Gate zu Recht?

Teils ja: Offline auf die aufgezeichneten Antworten angewandt, hätte das Gate auch alle 59 alten Antworten verworfen, und 26 davon nannten interne Status wie „als PINNED markiert“. Die neuen Antworten scheitern nur an der Form, sind aber zu 22 von 28 englisch, was das Gate gar nicht prüft. Instruktion und Gate wirken zusammen, deshalb bleibt die Empfehlung, beides gemeinsam am Modell abzustimmen.
Beleg: [Gate-Ablation](../../evidenz/1C/2026-11-16-gate-ablation.md), [ADR 1C-018](../../adr/1C-018-quality-gate-verwirft-echte-antworten.md)

### F58. Erklären Sie ohne Folie: Warum ist der Blitzlicht-Hash zeitabhängig, und wie rechnen Sie die Netzzeit?

Bei einer laufenden Blitzlicht-Runde (außer `TEMPO`) endet das Zeitfenster der Quelle beim Zeitpunkt des Kontextaufbaus (`observedAt`); die Nachprüfung baut nach der Inferenz neu, das Fensterende und damit der Hash weichen ab, und die Antwort wird als `source_changed` verworfen. Netzzeit: am app-host die Zeit vom Senden bis zur Antwort (t0 bis t3), minus am llm-host die Zeit vom Empfang bis zum Senden (t1 bis t2); jede Dauer misst eine Uhr. Beides übe ich an der Tafel.
Beleg: [ADR 1C-016](../../adr/1C-016-zeitabhaengiger-hash-blitzlicht.md), [Befund T3.1](../../evidenz/1C/2026-10-24-teil3.md#befund-t31--zeitabhängige-sourcerevision-bei-aktiver-blitzlicht-runde), [ADR 1B-011](../../adr/1B-011-zeitbegriffe-und-leitfrage.md)
