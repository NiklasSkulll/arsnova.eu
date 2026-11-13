# 1B: Ergebnisbericht – private Inferenz auf einem zweiten Host

Stand: 2026-11-13 (Entwurf, Schritte 1–2 von Jonas; Schritt 2 wird nach dem gewerteten Lauf ergänzt) · Prüfung durch den Autor: offen

Auftrag, Leitfrage und Hintergrund: [1B-Dossier](1B-private-inferenz-zweiter-host.md). Design und Plan: [Design](specs/2026-11-12-1b-zwei-host-design.md), [Plan](specs/2026-11-12-1b-zwei-host-plan.md). Diagramme und Code-Belege: [1B-Diagramme](1B-diagrams.md). Entscheidungen: [ADR 1B-001 bis 1B-019](adr/README.md).

## Schritte 1–2 (Jonas)

### Aufgabenabdeckung

| Schritt des Auftrags                                           | Ergebnis                                                                                                                                                                     | Beleg                                                                                                                          |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1: Zwei-Host-Deployment nach Release 1.3 reproduzieren         | Zwei KVM-VMs auf dem Laptop, aufgebaut mit einem Befehl (`labor.sh up`), alle automatischen Prüfungen bestanden; Abgleich mit ADR-0035 und dem Abnahmeprotokoll des Runbooks | [Aufbauprotokoll](evidenz/1B/2026-11-12-aufbau.md), [Runbook](evidenz/1B/runbook.md)                                           |
| 2: realer Summary-Auftrag, Netz, Adapter und Inferenz getrennt | _ausstehend: gewerteter Lauf am 2026-11-13_                                                                                                                                  | _Laufprotokoll folgt_                                                                                                          |
| Nachbau auf anderen Rechnern (Auftrag des Autors)              | Linux getestet; Windows mit Pester und teilweise auf echtem Windows 11 getestet, Aufbau mit Hyper-V offen                                                                    | [Windows-Test](evidenz/1B/2026-11-13-windows-test.md), [ADR 1B-010](adr/1B-010-aufbau-automatisiert-mit-groessenempfehlung.md) |

### Kernaussage B: Wo steckt die Zeit?

_Ausstehend._ Hypothesen und Schwellen stehen vor dem Lauf fest ([Design Abschnitt 6](specs/2026-11-12-1b-zwei-host-design.md#6-hypothesen-messgrößen-regeln-autor-aussagen-b-und-c-schwellen-ki-vorschlag)): H_B1 Netz im Median ≤ 50 ms und höchstens 200 ms, H_B2 Adapter im Median ≤ 2 s, H_B3 Inferenz ≥ 95 % der Auftragszeit im Median. Fehlt bei einem Auftrag eine Komponente, gilt keine Hypothese als bestätigt oder widerlegt ([`zeitzerlegung.mjs`](evidenz/1B/messung/zeitzerlegung.mjs), Regel vom 2026-11-13, vom Autor bestätigt am 2026-11-13).

### Befund C: Im Betrieb sieht niemand, wohin die Zeit geht

Die App nimmt die `timings` der Runtime an, liest sie im Summary-Pfad aber nicht aus; das Log enthält nur `latencyMs`. Netz, Adapter und Inferenz lassen sich deshalb nur mit Mitschnitt und Kontrollanfrage trennen. Belege mit Zeilen: [Aufbauprotokoll, Befund 6](evidenz/1B/2026-11-12-aufbau.md#befunde-für-kernaussage-c) und [Belegtabelle](1B-diagrams.md#belegtabelle). Weitere Lücken des Nachbaus (nicht öffentliche Image-Digests, Runbook §6 bricht den Produktionswrapper, fehlender Befehl für den Dritthost-Negativtest, App-Start hängt an der Redis-Bestätigung): [Aufbauprotokoll, Befunde 1–5](evidenz/1B/2026-11-12-aufbau.md#befunde-für-kernaussage-c).

**Empfehlung (kein Patch):** Zeiten (`elapsedMs`, `timings`) für Summary und Label ohne Prompttext ins Log schreiben ([Design Abschnitt 6](specs/2026-11-12-1b-zwei-host-design.md#6-hypothesen-messgrößen-regeln-autor-aussagen-b-und-c-schwellen-ki-vorschlag)).

### Gültigkeitsgrenze D

Ein privates Netz belegt weder Autorisierung noch Datenschutz; der Token läuft zwischen den Hosts im Klartext über HTTP. Weitere Grenzen des Labors (eine physische CPU für beide „Hosts“, weniger CPUs als in Produktion, virtuelles statt physisches Netz): [Design Abschnitt 8](specs/2026-11-12-1b-zwei-host-design.md#8-gültigkeitsgrenzen), [1B-Diagramme, Abweichungen und Grenzen](1B-diagrams.md#abbildung-1-topologie-des-labors).

### Entscheidung

_Ausstehend, nach der Regel aus [Design Abschnitt 6](specs/2026-11-12-1b-zwei-host-design.md#6-hypothesen-messgrößen-regeln-autor-aussagen-b-und-c-schwellen-ki-vorschlag): H_B1–H_B3 erfüllt → Hebel am Inferenz-Host; eine verfehlt → Topologie bzw. Adapter genauer prüfen, keine Beibehaltungsaussage._

## Schritte 3–4 (Niklas)

_Gliederung, Inhalt folgt von Niklas._ Übergabe und Befehle: [Runbook, Abschnitt 8](evidenz/1B/runbook.md#8-übergabe-an-niklas-schritte-34).

### Störversuche

### Rückwirkung auf den App-Host

### Betriebsaufwand

## Gemeinsames Kurzfazit

_Platzhalter, nach beiden Hälften gemeinsam._
