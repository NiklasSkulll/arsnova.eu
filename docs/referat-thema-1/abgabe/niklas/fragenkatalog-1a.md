# Fragenkatalog für die Diskussion (Niklas: 1A und 1B Schritte 3–4)

- **Stand:** 2026-11-16, Entwurf der KI (Claude Code) aus dem zweiten Audit · Prüfung durch den Autor: offen
- **Zweck:** nur zum Üben, nicht Teil der Abgabe. Die Diskussion zählt 40 % der Note ([Prüfungsdokument 6](../../../didaktik/CLOUD-COMPUTING-REFERAT-PRUEFUNG.md#6-bewertung)); der Diskussionskern zu 1A ist „Ressourcenisolation, Containergrenzen und Ursache einer gemessenen Live-Verzögerung“ (Gruppenauftrag 1A).
- **Grundlage:** [1A-Auswertung](../../1A-auswertung.md), [Versuchsvertrag](../../1A-experiment-contract.md), [Vorabnachtrag](../../specs/2026-11-14-1a-messreihe-main-a19ca70f.md), die gewertete [Reihe vom 15.11.2026](../../evidenz/1A/reihe-main-a19ca70f-20261115-122547/), Niklas’ Störreihen zu 1B (`evidenz/1B/messung/2026-11-1{5,6}-lauf-*-summary.json`) und die Folien N1–N10, M1–M2 ([`folien-1a.mjs`](folien-1a.mjs), [`folien-1b34.mjs`](folien-1b34.mjs)).
- **Regeln:** Zuerst die **Kurzantwort** (höchstens drei Sätze), Nachlegen nur auf Nachfrage. Jede Zahl gilt für Niklas’ WSL2-Rechner (16 logische CPUs, App-Commit `a19ca70f`, nach v1.4.0) bzw. für 1B für den i7-10700K mit zwei Hyper-V-VMs (Commits `5e758d0a`, `2b39b9df`). Was die Daten nicht hergeben, sage ich als offen, nicht als Ergebnis.

## Die fünf wahrscheinlichsten Fragen

1. [F1](#f1-warum-gibt-es-zwei-messreihen-und-was-hat-die-erste-gezeigt): zwei Messreihen, „so lange gemessen, bis es passt?“
2. [F2](#f2-ihre-kontrolle-ohne-spacy-verfehlt-die-regel-4-von-20-mal-was-ist-h1-nicht-bestätigt-dann-wert): Kontrolle verfehlt 4 von 20, was ist „H1 nicht bestätigt“ wert?
3. [F5](#f5-was-hat-die-verzögerung-in-v3-block-5-verursacht): Ursache der Live-Verzögerung in V3, Block 5 (Diskussionskern)
4. [F6](#f6-warum-schützt-das-cpu-limit-von-spacy-die-live-aktionen-nicht): CPU-Limit, Containergrenzen, Schutz der App
5. [F8](#f8-welche-reserve-hat-der-echte-app-host-und-was-sagt-ihr-ergebnis-über-ein-llm): Reserve des echten Hosts, Schluss auf ein LLM

## Methode und Vorab-Festlegung

### F1. Warum gibt es zwei Messreihen, und was hat die erste gezeigt?

_Variante:_ „Haben Sie so lange gemessen, bis es passt?“

**Kurzantwort:** Die erste vollständige Reihe lief am 12.11. auf dem älteren Stand `8f91e041` und verfehlte H1 und H2 ebenfalls (4 von 20 und 6 von 40), also dasselbe Urteil. Wiederholt habe ich, weil der Fork auf einen Stand nach v1.4.0 (`a19ca70f`) aktualisiert wurde und das Ergebnis für den aktuellen Stand gelten soll. Vertrag, Schwellen, Seed und Fixture blieben gleich, der Vertrags-Hash steht in jedem Laufmanifest, und der Nachtrag ist vor dem Vorlauf committet.

**Nachlegen:** In der ersten Reihe gab es keinen großen V3-Effekt und keine Verletzung über 50 ms; die Ausschläge lagen vor allem in Block 1, über V2 bis V4 zugleich. Das stützt, dass V3/Block 5 der zweiten Reihe ein Einzelereignis ist und die Regel auf Laufrauschen anspricht. Die alte Reihe steht nicht mehr im Arbeitsbaum, ist aber über Git vollständig nachvollziehbar.

Beleg: Daten `35271586` (12.11.), Auswertung `97bfcfc9` (14.11., 12:41; H1 4/20, H2 6/40, 0 absolute Verletzungen), Nachtrag `e3b27b32` (14.11., 15:42), entfernt in `ab1619e7`; [evidenz/1A/README.md](../../evidenz/1A/README.md), Folie N4

### F2. Ihre Kontrolle ohne spaCy verfehlt die Regel 4 von 20 Mal. Was ist „H1 nicht bestätigt“ dann wert?

**Kurzantwort:** Formal ist H1 nach der vorab festgelegten Regel nicht bestätigt, und daran ändere ich nachträglich nichts. Inhaltlich zeigt die Kontrolle eine Fehlalarmrate von etwa 20 % je Vergleich; bei 20 Vergleichen, die alle bestehen müssen, hätte H1 auch ohne jeden Effekt kaum bestehen können (grob 0,8²⁰ ≈ 1 %). Ich sage deshalb nicht, spaCy schade, sondern: Die Unschädlichkeit ist nicht belegt.

**Nachlegen:** Gepoolt über alle fünf Blöcke unterscheidet sich V2 von V1 je Aktion nur um −5,5 bis +0,1 ms, während der Beitritts-p95 von V2 schon von Block zu Block zwischen 31 und 58 ms schwankt (nachträglich ausgewertet). Die Entscheidung stützt sich auf die Beweislast der Option, auf den klaren V3-Effekt bei CPU-Mangel und auf den ungemessenen Nutzen. Für eine neue Reihe würde ich die Regel an einem A/A-Vergleich kalibrieren und eine Mindesteffektgröße (etwa +10 ms) mit Bootstrap-Konfidenzintervall über die Blöcke nutzen (Papadopoulos et al., 2021, Kap. 2.3, P1, P5).

Beleg: `auswertung.json` (`comparisons[variant=V1]`, `hypotheses.H1`), Folie N6b, [1A-Auswertung, Live-Aktionen und Hypothesen](../../1A-auswertung.md#live-aktionen-und-hypothesen)

### F3. Warum p95 und nicht Mittelwert oder p99, und wie stabil ist ein p95 aus nur 100 Q&A-Stichproben?

**Kurzantwort:** Latenzen sind rechtsschief, und Lehrende warten auf die langsamen Anfragen; der Mittelwert versteckt den Schwanz (Papadopoulos et al., 2021, Kap. 2.3, P5; Dean & Barroso, 2013, S. 74). p99 wäre bei 100 Q&A-Werten genau ein einzelner Wert und damit Zufall. Aber auch der p95 ist bei 100 Werten nur der 95. Wert mit fünf Werten darüber, deshalb entstehen Fehlschläge mit +2 bis +4 ms, die unter dem Laufrauschen liegen.

**Nachlegen:** Diese Grenze nenne ich selbst; für eine neue Reihe würde ich Konfidenzintervalle per Bootstrap ausweisen statt eine Einzelschwelle je Block zu prüfen. Beispiele: H1-Fall Q&A Block 4 +3,98 ms, V4 Q&A Block 4 +1,97 ms und Block 5 +2,43 ms.

Beleg: Nearest Rank `sortiert[ceil(0,95·n) − 1]` im [Versuchsvertrag](../../1A-experiment-contract.md); `live-vergleiche.csv` der Reihe

### F4. Warum werten Sie eine Reihe mit dem Lastgenerator auf demselben Rechner?

**Kurzantwort:** Der Vertrag verlangt, das offenzulegen, und ich tue es: Die gemessene Latenz enthält Clientarbeit. Gepaarte Blöcke und die gemischte Reihenfolge verteilen diesen Effekt gleich auf alle Varianten, verglichen wird nur im selben Block. Absolute Werte gelten deshalb nur für dieses Labor.

Beleg: Laufmanifeste `manifest.generatorLocation = same-host`; [1A-Auswertung, Grenzen](../../1A-auswertung.md#gültigkeitsgrenzen-und-abschluss)

## Diskussionskern: Containergrenzen und Ursache

### F5. Was hat die Verzögerung in V3, Block 5 verursacht?

**Kurzantwort:** Belegt ist die Ursache nicht, und das sage ich offen. Fakten: 50 Beitritte über 100 ms innerhalb von etwa 10 s, im selben Fenster die einzigen 3 Timeouts der V3-Analyse, App-CPU bis 73 % und Datenbank bis 37 % einer CPU, in allen anderen Läufen höchstens 27 %. Gegen einen reinen spaCy-Rückstau spricht, dass spaCy auf 0,25 CPU gedeckelt war und von 16 CPUs nicht mehr nehmen kann, und dass V4 mit 495 Timeouts keinen solchen Live-Effekt hatte.

**Nachlegen:** Denkbar ist ein kurzes Ereignis auf Host oder Datenbank, etwa ein PostgreSQL-Checkpoint, eine Garbage Collection im Node-Prozess oder WSL2 selbst, verstärkt durch den Lastgenerator auf demselben Rechner; keine dieser Erklärungen ist gemessen. Prüfen würde ich das mit PostgreSQL-Logs, dem Event-Loop-Lag des Node-Prozesses und mehr V3-Blöcken mit dem Generator auf einem eigenen Rechner. Für die Entscheidung ändert die offene Ursache nichts.

Beleg: Folie N7 (nachträglich ausgewertet), `V3/block-05/lauf.json`, `ressourcen.json.gz`; [1A-Auswertung, Analyseverfügbarkeit und Störungsinterpretation](../../1A-auswertung.md#analyseverfügbarkeit-und-störungsinterpretation)

### F6. Warum schützt das CPU-Limit von spaCy die Live-Aktionen nicht?

_Variante:_ „Wie würden Sie die App schützen?“

**Kurzantwort:** `cpu.max` ist eine Obergrenze je Periode, keine Reservierung: Es hindert spaCy daran, mehr zu nehmen, gibt der App aber nichts garantiert (Heo, 2024, Abschn. „CPU Interface Files“). Geschützt wird ein Dienst erst über Anteile bei Konkurrenz (`cpu.weight`), feste Kerne (`cpuset`) oder eine eigene Maschine. Auf 16 CPUs gab es kaum CPU-Konkurrenz; die Drosselung von spaCy in V3 (88–96 % der Perioden) verlängert vor allem dessen eigene Antwortzeit.

**Nachlegen:** Den Live-Pfad schützen hier Frist und Gegendruckgrenze: Nach 5 s liefert die App den lexikalischen Ersatz, und bei zwei offenen Anfragen lehnt der Client sofort ab. Für ein LLM, das viele Kerne minutenlang auslastet, reicht das nicht; deshalb sieht ADR-0035 dafür einen zweiten Host vor. App, PostgreSQL und Redis laufen in der Produktions-Compose ohne Limits.

Beleg: Folien N2, N8, N9; `docker-compose.prod.yml`; [ADR-0035, Abschn. 2.1](../../../architecture/decisions/0035-self-hosted-llm-runtime-llama-cpp-over-ollama.md)

### F7. `SIDECAR_UNAVAILABLE` heißt doch, spaCy war weg?

**Kurzantwort:** Der Code fasst echte Unerreichbarkeit und Gegendruck unter diesem Grund zusammen, das Protokoll unterscheidet sie also nicht. In V4 sind es je Lauf genau 50 von 149 Ersatzfällen, immer neben zwei offenen Anfragen; das passt nur zur Gegendruckgrenze `SPACY_MAX_IN_FLIGHT = 2`, nicht zu einem Ausfall. Ein Ausfall (V5) ist nicht gemessen.

Beleg: `apps/backend/src/lib/wordCloudNormalizer.ts` (`reasonFromSidecarError`), `apps/backend/src/lib/spacyClient.ts`; `auswertung.json` `runs[V4].analysis.fallbackReasons`

## Gültigkeit und Leitfrage

### F8. Welche Reserve hat der echte App-Host, und was sagt Ihr Ergebnis über ein LLM?

_Variante:_ „Die Leitfrage nennt Release 1.3. Warum messen Sie 1.4.0?“

**Kurzantwort:** Gemessen habe ich ein Labor, nicht den Zielhost: Dort brauchte der ganze Stack unter der Beitrittswelle im Mittel des Fensters höchstens 0,44 von 16 CPUs, und mindestens 11,6 GiB blieben frei. Für den 8-vCPU-Host mit 16 GB folgt daraus keine Zahl, nur dass die CPU nicht der Engpass dieser Last war. Ein gelungener spaCy-Versuch belegt nicht, dass der Host ein LLM trägt: spaCy brauchte 18 % einer CPU und 480 MiB, ein Sprachmodell nach ADR-0035 etwa 4 GB RAM und in Jonas’ Labor rund 150 s Rechenzeit je Auftrag.

**Nachlegen:** Der Stand ist v1.4.0, weil wir den Fork mit Zustimmung des Prüfers aktualisiert haben (E-Mail vom 04.11.); den Unterschied nenne ich als Grenze. ADR-0035 begründet, warum generative Inferenz keine App-Host-Aufgabe ist: Der 16-GB-Live-Host trägt neben etwa 10–11 GB Baseline, spaCy, Encoder und PDF-Worker kein zusätzliches ~4-GB-LLM, und Live-Pfade dürfen nie auf Inferenz warten.

Beleg: `auswertung.json` (`runs[].resources`, `runs[].collectorHost.minAvailableMemoryBytes`); [ADR-0035](../../../architecture/decisions/0035-self-hosted-llm-runtime-llama-cpp-over-ollama.md) (Kontext, Abschn. 2.1); [1B-Ergebnis](../../1B-ergebnis.md); [00-rahmen-und-pruefung.md](../../00-rahmen-und-pruefung.md)

### F9. Wo bleiben Encoder, 8.9b und Kontextaufbau, die der Auftrag nennt?

**Kurzantwort:** Der Encoder der semantischen Wortwolke und die Q&A-Klassifikation 8.9b sind optionale Analysedienste und waren in allen 25 Läufen aus (`WORD_CLOUD_SEMANTIC_ENABLED`, `QA_NLP_ENABLED` = false, kein Encoder-Container). Der Kontextaufbau läuft in der App selbst. Gemessen ist also genau eine Option, spaCy, gegen die lexikalische Basis.

Beleg: Laufmanifeste `manifest.services.app.flags`; [Versuchsvertrag](../../1A-experiment-contract.md) (Schalter); Folie N2

## 1B Schritte 3–4: Störung und Betriebsaufwand

### F10. Warum dauert der Ersatz bei DROP 135 s, wenn die Frist 300 s beträgt?

**Kurzantwort:** Bei DROP scheitert schon der Verbindungsaufbau, bevor das Summary-Budget greift; die App meldet `unavailable`, nicht `timeout`. Die rund 135 s sind deshalb keine eingestellte Frist der Anwendung. Plausibel sind die SYN-Wiederholungen des Linux-Kernels, gemessen habe ich das nicht.

**Nachlegen:** Genau das ist der Befund zu Schritt 3: Ein gestoppter Dienst (F1) kostet 48 ms, ein stummer Host (F2) über zwei Minuten je Auftrag. Fünf F2-Aufträge, alle mit Verbindungsversuch und ohne RST, Störung im Kernel nachgeprüft.

Beleg: Folie M1; `2026-11-16-lauf-f2-summary.json` (`experiment.jobs[].jobMs`, `fallbackReason`), Protokoll `evidenz/1B/2026-11-16-lauf-f2-summary.md` auf Niklas’ Zweig

### F11. Ihre Störreihen laufen auf einem anderen Commit als die Referenz. Ist das vergleichbar?

**Kurzantwort:** F2, L3 und „Slot belegt“ liefen auf `2b39b9df`, die Referenz F1 auf `5e758d0a`; der automatische Vergleich meldet deshalb korrekt „nicht vergleichbar“. Laut Versionsnachtrag sind Produktionscode, Treiber und Ablauf unverändert, geändert haben sich nur Störungsprüfung und Auswertung der TCP-Flags. Ich berichte den Vergleich deshalb ausdrücklich als versionsübergreifend und ziehe keinen kausalen Schluss.

Beleg: Protokolle `2026-11-16-lauf-{f2,l3,busy}-summary.md`, Abschnitt Vergleichbarkeit; `1B-3u4-Planung.md`, Nachtrag 2026-11-16 (Niklas’ Zweig)

### F12. Kein Live-Fehler, aber jede Störreihe verfehlt die Latenzregel. Was gilt?

**Kurzantwort:** Beides: 0 Fehler bei 72.000 Live-Aktionen, und je Störreihe überschreitet mindestens eine Aktion die 110 % der Referenz, absolut um höchstens 8,1 ms. Die Reihen liefen nacheinander auf einem Rechner ohne CPU-Pinning, eine Ursache kann ich nicht belegen, und die Regel lasse ich stehen. Wie in 1A gilt: Die Unschädlichkeit ist nicht belegt, ein Schaden auch nicht.

Beleg: Folie M2; `messung/2026-11-1{5,6}-lauf-*-summary.json` (`experiment.live.windows[]`, p95 gepoolt)

### F13. Lohnt sich der zweite Host?

**Kurzantwort:** Gemessen ist der Gewinn: Keine Störung der Inferenz wurde zum Live-Fehler, und bei Ausfall kommt der Ersatz. Die Kosten, also zweiter Host, Token, Firewall, Deployment und Überwachung, habe ich benannt, aber nicht in Stunden gemessen; einen Same-Host-Vergleich (S1) gibt es nicht. Deshalb bleibe ich bei der Architekturentscheidung aus ADR-0035 und nenne als Betriebsrisiko, dass ein stummer Host jeden Auftrag bis zur Frist bindet.

Beleg: Folie M2; [ADR-0035, Abschn. 2.1](../../../architecture/decisions/0035-self-hosted-llm-runtime-llama-cpp-over-ollama.md); [Runbook, Aufbau](../../evidenz/1B/runbook.md#2-aufbau)

### F14. Schützt das private Netz die Runtime ausreichend?

**Kurzantwort:** Ein privates Netz belegt weder Autorisierung noch Datenschutzkonformität; das ist die Gültigkeitsgrenze aus dem Auftrag. Die Runtime verlangt zusätzlich ein Token, und die Firewall erlaubt Port 8080 nur vom App-Host. Geprüft habe ich die Erreichbarkeit, nicht die Sicherheit.

Beleg: [Prüfungsdokument, Gruppenauftrag 1B](../../../didaktik/CLOUD-COMPUTING-REFERAT-PRUEFUNG.md); Aufbaubelege `evidenz/1B/messung/2026-11-13-belege/` (ufw, ss)

## Eigenanteil

### F15. Was haben Sie selbst gemacht, was die KI?

**Kurzantwort:** Codex hat Werkzeuge, Tests, Auswertung und Dokumententwürfe umgesetzt, Claude Code die Folien und das Handout entworfen. Auftrag, Labor, die realen Messreihen, die Freigaben und die Deutung sind meine. Jede Zahl auf Folien und Handout erzeugt ein Skript aus den committeten Rohdaten; einen Vergleich rechne ich vor der Prüfung von Hand nach (Rang `ceil(0,95·n)`), wie es die Prüfliste in `1A-abschluss-und-uebergabe.md` vorsieht.

Beleg: [1A-Eigenanteil](../../1A-eigenanteil.md); Reservefolie RN2
