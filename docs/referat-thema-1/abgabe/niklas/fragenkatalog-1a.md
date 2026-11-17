# Fragenkatalog für die Diskussion (Niklas: 1A und 1B Schritte 3–4)

- **Stand:** 2026-11-16, Entwurf der KI (Claude Code) aus dem zweiten Audit; _Aktualisiert 2026-11-17:_ 1B Schritte 3–4 nach PR #26 (F10–F19) · Prüfung durch den Autor: offen
- **Zweck:** nur zum Üben, nicht Teil der Abgabe. Die Diskussion zählt 40 % der Note ([Prüfungsdokument 6](../../../didaktik/CLOUD-COMPUTING-REFERAT-PRUEFUNG.md#6-bewertung)); der Diskussionskern zu 1A ist „Ressourcenisolation, Containergrenzen und Ursache einer gemessenen Live-Verzögerung“ (Gruppenauftrag 1A).
- **Grundlage:** [1A-Auswertung](../../1A-auswertung.md), [Versuchsvertrag](../../1A-experiment-contract.md), [Vorabnachtrag](../../specs/2026-11-14-1a-messreihe-main-a19ca70f.md), die gewertete [Reihe vom 15.11.2026](../../evidenz/1A/reihe-main-a19ca70f-20261115-122547/), Niklas’ Reihen zu 1B (`evidenz/1B/messung/2026-11-1{5,6}-lauf-*.json.gz`, Breaker-Folgen, S1), [1B-Ergebnis](../../1B-ergebnis.md), [ADR 1B-020](../../adr/1B-020-zweite-rolle-betrieblich-begruenden.md) und die Folien N1–N10, M1–M4 ([`folien-1a.mjs`](folien-1a.mjs), [`folien-1b34.mjs`](folien-1b34.mjs)).
- **Regeln:** Zuerst die **Kurzantwort** (höchstens drei Sätze), Nachlegen nur auf Nachfrage. Jede Zahl gilt für Niklas’ WSL2-Rechner (16 logische CPUs, App-Commit `a19ca70f`, nach v1.4.0) bzw. für 1B für den i7-10700K mit zwei Hyper-V-VMs (app-host 2 vCPU/4 GiB, llm-host 8 vCPU/10 GiB, ohne CPU-Pinning; Summary `5e758d0a`/`2b39b9df`, Label und Breaker `7c64dd6a`, S1 `4b135fe8`). Was die Daten nicht hergeben, sage ich als offen, nicht als Ergebnis.

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

Beleg: `auswertung.json` (`comparisons[variant=V1]`, `hypotheses.H1`), Reservefolie RN1, [1A-Auswertung, Live-Aktionen und Hypothesen](../../1A-auswertung.md#live-aktionen-und-hypothesen)

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

Beleg: Folien N2, N9, Reservefolie RN4; `docker-compose.prod.yml`; [ADR-0035, Abschn. 2.1](../../../architecture/decisions/0035-self-hosted-llm-runtime-llama-cpp-over-ollama.md)

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

**Kurzantwort:** Bei DROP scheitert schon der Verbindungsaufbau, bevor das Summary-Budget greift; die App meldet `unavailable`, nicht `timeout`. Die rund 135 s sind keine eingestellte Frist der Anwendung; die Entwicklungsprobe zeigt elf SYN-Pakete derselben Verbindung, die genaue Ursache (Kernel oder Node) ist nicht belegt. Bei Labels endet das Warten schon an deren Frist von 30 s.

**Nachlegen:** Ein gestoppter Dienst (F1) kostet 48 ms, ein stummer Host (F2) rund 2¼ min je Summary-Auftrag, das ist etwa das 2.800-Fache (134.732 / 48 ms). Fünf F2-Aufträge, alle mit Verbindungsversuch und ohne RST, Störung im Kernel nachgeprüft.

Beleg: Folie M1; [F2-Summary](../../evidenz/1B/2026-11-16-lauf-f2-summary.md), [F2-Label](../../evidenz/1B/2026-11-16-lauf-f2-label.md), [zweite F2-Entwicklungsprobe](../../evidenz/1B/2026-11-16-lauf-dev-f2-summary-v2.md)

### F11. Warum zeigen Sie Summary mit Job-Zeit und Labels mit Client-Zeit?

**Kurzantwort:** Die Kriterien für Summary sind auf die Job-Zeit formuliert, und die Label-API legt weder Job-Zeit noch Fallback-Grund offen. Für Labels gibt es deshalb nur die Zeit beim Client; das interne Fristkriterium ist für Labels nicht bewertbar, und ich gebe es nicht als bestanden aus. Die Summary-Clientzeit liegt wegen der Sekundenabfrage bei etwa 1,1 s statt 48 ms.

Beleg: Folie M1 (Legende); [Planung, Label-Nachträge](../../1B-3u4-Planung.md); [Beitragsabgleich](../../1B-3u4-beitragsabgleich.md)

### F12. Warum übernimmt die App Labels, aber keine Summary?

**Kurzantwort:** Alle 30 Label-Antworten wurden übernommen (`labelModelAccepted`), alle Summaries verwirft das Qualitätstor mit `invalid_response`, auch in S1. Das ist Jonas’ Befund aus 1B/1C (ADR 1C-018) und hängt am Gate, nicht am zweiten Host. Mehr Zeit oder ein anderer Host garantiert keine akzeptierte Summary.

Beleg: [Label-Normal, Teil 3](../../evidenz/1B/2026-11-16-lauf-normal-label-03.md); [Normal-Summary](../../evidenz/1B/2026-11-15-lauf-normal-summary.md); [ADR 1B-020, Folgen](../../adr/1B-020-zweite-rolle-betrieblich-begruenden.md#folgen)

### F13. Ihre Summary-Störreihen laufen auf einem anderen Commit als die Referenz. Ist das vergleichbar?

**Kurzantwort:** F2, L3 und „Slot belegt“ liefen auf `2b39b9df`, die Referenz F1 auf `5e758d0a`; der automatische Vergleich meldet deshalb korrekt „nicht vergleichbar“. Laut Versionsnachtrag sind Produktionscode, Treiber und Ablauf unverändert, geändert haben sich nur Störungsprüfung und Auswertung der TCP-Flags. Ich berichte den Vergleich ausdrücklich als versionsübergreifend und ziehe keinen kausalen Schluss.

Beleg: Protokolle `2026-11-16-lauf-{f2,l3,busy}-summary.md`, Abschnitt Vergleichbarkeit; [Planung, Versionsnachtrag](../../1B-3u4-Planung.md)

### F14. Kein Live-Fehler, aber viele Reihen verfehlen die Latenzregel. Was gilt?

**Kurzantwort:** Beides: 0 Fehler bei 166.400 Live-Aktionen, und die meisten Reihen überschreiten bei mindestens einer Aktion 110 % ihrer Referenz, am stärksten DROP bei Labels im Tempo-Signal mit +128 % (17 → 39 ms). Nur L2 und L3 bei Labels halten die Regel, mit je drei Aufträgen. Die Reihen liefen nacheinander auf einem Rechner ohne CPU-Pinning; eine Ursache kann ich nicht belegen, und die Regel lasse ich stehen.

**Nachlegen:** Teilreihen widersprechen sich: L1 Teil 2 hält alle Schwellen, gesamt nicht. Deshalb kein Isolationsgewinn und kein Isolationsschaden als Ergebnis.

Beleg: Folie M3; [F1/B0-Label mit Normalvergleich](../../evidenz/1B/2026-11-16-lauf-f1-label.md); [L1 gesamt](../../evidenz/1B/2026-11-16-lauf-l1-label-02.md)

### F15. Warum vergleichen Sie Summary-Normal nicht mit B0 wie bei Labels?

**Kurzantwort:** Das Summary-Protokoll rechnet F1 gegen Normal, also die umgekehrte Richtung; deshalb steht Summary-Normal nicht im Raster auf M3, Folien zeigen nur Zahlen aus den Protokollen. Nachgerechnet in der Richtung von H2 (Normal gegen B0) lägen Q&A mit 1,24 und Blitzlicht mit 1,22 über 1,10. Das ist eine eigene Nachrechnung aus den Rohdaten, kein Protokollwert, und sie bestätigt das Bild von M3.

Beleg: [Normal-Summary](../../evidenz/1B/2026-11-15-lauf-normal-summary.md), [F1-Summary, Live-Last](../../evidenz/1B/2026-11-15-lauf-f1-summary.md#live-last-und-app-ressourcen)

### F16. Schützt der Circuit Breaker vor einem hängenden Host?

**Kurzantwort:** Nein. Nach drei abgewiesenen Verbindungen öffnet er, und Auftrag vier endet nach 44 ms ohne Netzversuch; nach drei Fristabläufen geht Auftrag vier wieder zur Runtime und wartet erneut 90 s. Im Code gilt ein Abbruch durch die Warteschlange als `aborted` (`openWeightLlmClient.ts:188`), und nur `timeout`, `unavailable` und `invalid_response` zählen für den Breaker (`:476–478`).

**Nachlegen:** Den internen Status habe ich nicht ausgelesen; Queue- und Client-Budget sind gleich lang, die Timer konkurrieren. Das Protokoll nennt die Funktion `processWithTimeout`; im Code heißt sie `runWithQueueTimeout` (`qaSummaryQueue.ts:259`).

Beleg: Folie M2; [Breaker-F1](../../evidenz/1B/2026-11-16-lauf-breaker-f1-summary.md), [Queue-Folge](../../evidenz/1B/2026-11-16-lauf-breaker-l3-summary.md)

### F17. Ihre Planung wurde gekürzt. Waren die Kriterien wirklich vorab festgelegt?

**Kurzantwort:** Hypothesen und Schwellen (H2, H-F1, H-F1F2, H-Queue) stehen in Commit `5e758d0a` vom 15.11., 17 Minuten vor der ersten gewerteten Reihe. Der gekürzte Restumfang (je drei Aufträge für L2, L3 und F2 bei Labels) ist als datierter Nachtrag beschrieben, kam aber erst mit `aa0e90c7` (16.11., 20:43) ins Repo, nach diesen Läufen. Dass er vorher galt, belegt nur der Text; die Schwellen selbst haben sich nicht geändert.

Beleg: [Planung, Hypothesentabelle und Nachträge](../../1B-3u4-Planung.md); `git log -- docs/referat-thema-1/1B-3u4-Planung.md`

### F18. Lohnt sich der zweite Host?

**Kurzantwort:** Nicht wegen Tempo: S1 mit allem auf einem Host hält bei Summary alle Live-Schwellen und reißt bei Labels Beitritt und Quiz um etwa 21–23 %, Fehler gab es keine. ADR 1B-020 empfiehlt deshalb: Die Leitplanke bleibt, S1 ist keine Freigabe, und die zweite Rolle ist nur betrieblich zu begründen (getrennte Ressourcen, Wartung, Zuständigkeit); ob das den Aufwand trägt, belegt das Labor nicht. Die Kosten (zweites System, Deployment mit Digest und Modellhash, Token-Rotation, Überwachung, bei Schutzbedarf TLS) sind qualitativ bewertet, nicht in Stunden.

**Nachlegen:** S1 lief mit 8 vCPU statt 2 + 8 und HTTP auf derselben VM, Treiber und Collector auf demselben Host; daraus folgt keine Freigabe für einen produktiven Same-Host-Betrieb. Beide VMs liefen auf einem PC, unabhängige Ausfallbereiche sind nicht belegt.

Beleg: Folie M4; [S1-Label](../../evidenz/1B/2026-11-16-lauf-s1-label.md), [S1-Summary](../../evidenz/1B/2026-11-16-lauf-s1-summary.md), [ADR 1B-020](../../adr/1B-020-zweite-rolle-betrieblich-begruenden.md)

### F19. Schützt das private Netz die Runtime ausreichend?

**Kurzantwort:** Ein privates Netz belegt weder Autorisierung noch Datenschutzkonformität; das ist die Gültigkeitsgrenze aus dem Auftrag. Die Runtime verlangt zusätzlich ein Token, und die Firewall erlaubt Port 8080 nur vom App-Host. Das Token läuft im Klartext über HTTP; TLS oder ein Tunnel wäre bei Schutzbedarf nötig (ADR 1B-020).

Beleg: [Prüfungsdokument, Gruppenauftrag 1B](../../../didaktik/CLOUD-COMPUTING-REFERAT-PRUEFUNG.md); Aufbaubelege `evidenz/1B/messung/2026-11-13-belege/` (ufw, ss); [ADR 1B-020, Aufwand](../../adr/1B-020-zweite-rolle-betrieblich-begruenden.md#betriebsaufwand-und-gegenwert)

## Eigenanteil

### F20. Was haben Sie selbst gemacht, was die KI?

**Kurzantwort:** Codex (für 1B Schritte 3–4 mit GPT-6.1 Sol) hat Werkzeuge, Tests, Auswertung und Dokumententwürfe umgesetzt, Claude Code die Folien und das Handout entworfen. Auftrag, Labor, die realen Messreihen, die Freigaben und die Deutung sind meine. Jede Zahl auf Folien und Handout erzeugt ein Skript aus den committeten Rohdaten; einen Vergleich rechne ich vor der Prüfung von Hand nach (Rang `ceil(0,95·n)`), wie es die Prüfliste in `1A-abschluss-und-uebergabe.md` vorsieht.

Beleg: [1A-Eigenanteil](../../1A-eigenanteil.md), [1B-Eigenanteil](../../1B-eigenanteil.md#schritte-34-niklas); Reservefolie RN2
