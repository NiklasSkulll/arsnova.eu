# 1B: Ergebnisbericht – private Inferenz auf einem zweiten Host

Stand: 2026-11-13 (Entwurf, Schritte 1–2 von Jonas) · Prüfung durch den Autor: offen

Auftrag, Leitfrage und Hintergrund: [1B-Dossier](1B-private-inferenz-zweiter-host.md). Design und Plan: [Design](specs/2026-11-12-1b-zwei-host-design.md), [Plan](specs/2026-11-12-1b-zwei-host-plan.md). Diagramme und Code-Belege: [1B-Diagramme](1B-diagrams.md). Entscheidungen: [ADR 1B-001 bis 1B-019](adr/README.md).

## Schritte 1–2 (Jonas)

### Aufgabenabdeckung

| Schritt des Auftrags                                           | Ergebnis                                                                                                                                                                                | Beleg                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1: Zwei-Host-Deployment nach Release 1.3 reproduzieren         | Zwei KVM-VMs auf dem Laptop, aufgebaut mit einem Befehl (`labor.sh up`), alle automatischen Prüfungen bestanden; Abgleich mit ADR-0035 und dem Abnahmeprotokoll des Runbooks            | [Aufbauprotokoll](evidenz/1B/2026-11-12-aufbau.md), [Runbook](evidenz/1B/runbook.md)                                           |
| 2: realer Summary-Auftrag, Netz, Adapter und Inferenz getrennt | n = 10 über die echte App, Netz, Adapter und Inferenz je Auftrag getrennt (Mitschnitt auf beiden Hosts, `timings` der Runtime); dritter Versuch gewertet, zwei Abweichungen offengelegt | [Laufprotokoll](evidenz/1B/2026-11-13-lauf.md)                                                                                 |
| Nachbau auf anderen Rechnern (Auftrag des Autors)              | Linux getestet; Windows mit Pester und teilweise auf echtem Windows 11 getestet; Hyper-V läuft verschachtelt, voller Aufbau unter Windows offen                                         | [Windows-Test](evidenz/1B/2026-11-13-windows-test.md), [ADR 1B-010](adr/1B-010-aufbau-automatisiert-mit-groessenempfehlung.md) |

### Kernaussage B: Wo steckt die Zeit?

**Die Zeit steckt in der Inferenz; die Zwei-Host-Topologie kostet keine relevante Zeit.** Gewerteter Lauf (n = 10, Commit `8e9d1317`, ThinkPad P50, [Laufprotokoll](evidenz/1B/2026-11-13-lauf.md)):

| Hypothese | Messwert                                 | Schwelle                         | Urteil  |
| --------- | ---------------------------------------- | -------------------------------- | ------- |
| H_B1      | Netz Median **0,43 ms**, Maximum 1,36 ms | Median ≤ 50 ms, Maximum ≤ 200 ms | erfüllt |
| H_B2      | Adapter Median **101 ms**                | Median ≤ 2 s                     | erfüllt |
| H_B3      | Inferenzanteil Median **99,92 %**        | ≥ 95 %                           | erfüllt |

Kalt (Auftrag 1) dauert ein Auftrag 213,7 s, warm (Prompt aus dem Cache, Aufträge 2–10) im Median 148,6 s. Hauptwert ist die Netzzeit in Millisekunden; der Prozentanteil fällt auf langsamer Hardware hoch aus. Die Netzmessung hat bei langen Aufträgen eine Auflösung von etwa ±1 ms (zwei VM-Uhren), weit unter der Schwelle.

Die Hypothesen und Schwellen standen vor dem Lauf fest ([Design Abschnitt 6](specs/2026-11-12-1b-zwei-host-design.md#6-hypothesen-messgrößen-regeln-autor-aussagen-b-und-c-schwellen-ki-vorschlag)): H_B1 Netz im Median ≤ 50 ms und höchstens 200 ms, H_B2 Adapter im Median ≤ 2 s, H_B3 Inferenz ≥ 95 % der Auftragszeit im Median. Fehlt bei einem Auftrag eine Komponente, gilt keine Hypothese als bestätigt oder widerlegt ([`zeitzerlegung.mjs`](evidenz/1B/messung/zeitzerlegung.mjs), Regel vom 2026-11-13, vom Autor bestätigt am 2026-11-13).

### Befund C: Im Betrieb sieht niemand, wohin die Zeit geht

Die App nimmt die `timings` der Runtime an, liest sie im Summary-Pfad aber nicht aus; das Log enthält nur `latencyMs`. Netz, Adapter und Inferenz lassen sich deshalb nur mit Mitschnitt und Kontrollanfrage trennen. Belege mit Zeilen: [Aufbauprotokoll, Befund 6](evidenz/1B/2026-11-12-aufbau.md#befunde-für-kernaussage-c) und [Belegtabelle](1B-diagrams.md#belegtabelle). Neu aus dem Lauf: Warum eine Modellantwort verworfen wird, steht in keinem Log ([Laufprotokoll, Befund C](evidenz/1B/2026-11-13-lauf.md#befund-c-was-der-betrieb-sieht)). Weitere Lücken des Nachbaus (nicht öffentliche Image-Digests, Runbook §6 bricht den Produktionswrapper, fehlender Befehl für den Dritthost-Negativtest, App-Start hängt an der Redis-Bestätigung): [Aufbauprotokoll, Befunde 1–5](evidenz/1B/2026-11-12-aufbau.md#befunde-für-kernaussage-c).

**Empfehlung (kein Patch):** Zeiten (`elapsedMs`, `timings`) für Summary und Label ohne Prompttext ins Log schreiben ([Design Abschnitt 6](specs/2026-11-12-1b-zwei-host-design.md#6-hypothesen-messgrößen-regeln-autor-aussagen-b-und-c-schwellen-ki-vorschlag)).

### Befund: Jede Modellantwort wird verworfen

In allen Aufträgen verwirft das Qualitätstor der App die vollständige Antwort von Qwen3-4B (Form „Stichwort: Text“ fehlt, englisch statt deutsch); die Lehrperson sieht die extraktive Ersatzzusammenfassung. Das bestätigt [ADR 1C-018](adr/1C-018-quality-gate-verwirft-echte-antworten.md) im Zwei-Host-Aufbau. Damit gehen 99,9 % der Auftragszeit in ein Ergebnis, das nicht ankommt ([Laufprotokoll](evidenz/1B/2026-11-13-lauf.md#befund-jede-modellantwort-verworfen)).

### Gültigkeitsgrenze D

Ein privates Netz belegt weder Autorisierung noch Datenschutz; der Token läuft zwischen den Hosts im Klartext über HTTP. Weitere Grenzen des Labors (eine physische CPU für beide „Hosts“, weniger CPUs als in Produktion, virtuelles statt physisches Netz): [Design Abschnitt 8](specs/2026-11-12-1b-zwei-host-design.md#8-gültigkeitsgrenzen), [1B-Diagramme, Abweichungen und Grenzen](1B-diagrams.md#abbildung-1-topologie-des-labors).

### Entscheidung

H_B1–H_B3 erfüllt, daher nach der Regel aus [Design Abschnitt 6](specs/2026-11-12-1b-zwei-host-design.md#6-hypothesen-messgrößen-regeln-autor-aussagen-b-und-c-schwellen-ki-vorschlag): **Konfiguration. Der Hebel liegt am Inferenz-Host (Timeout je Host kalibrieren, Limits, Promptgröße); die Zwei-Host-Topologie kostet keine relevante Zeit.** Vorher lohnt es, das Qualitätstor mit dem ausgelieferten Modell abzustimmen (Issue [#13](https://github.com/NiklasSkulll/arsnova.eu/issues/13)), sonst bleibt jede schnellere Inferenz ohne Nutzen.

## Schritte 3–4 (Niklas)

_Gliederung, Inhalt folgt von Niklas._ Übergabe und Befehle: [Runbook, Abschnitt 8](evidenz/1B/runbook.md#8-übergabe-an-niklas-schritte-34).

### Störversuche

### Rückwirkung auf den App-Host

### Betriebsaufwand

## Gemeinsames Kurzfazit

_Platzhalter, nach beiden Hälften gemeinsam._
