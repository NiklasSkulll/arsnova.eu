# Rahmen und Prüfung: Referat Thema 1

Stand: 2026-11-13; ursprüngliche Recherche vom 2026-10-16. Quellen: [CLOUD-COMPUTING-REFERAT-PRUEFUNG.md](../didaktik/CLOUD-COMPUTING-REFERAT-PRUEFUNG.md)
(kanonische Repo-Fassung, Abschnitte 2–6 und 4.3) sowie die Kursunterlagen aus
„Woche 1“ (lokal, nicht im Repo): `3. Referatsprufung-Cloud-Computing.pdf` (49
Folien) und `2. Cloud_Architecture_Dossier.pdf` (15 Folien).

## Generalthema

> Wie bewährt sich der produktive Moderationskompass von arsnova.eu Release 1.3
> unter unterschiedlichen Cloud-Betriebsbedingungen, und welche begründeten
> Optimierungen ermöglichen es, dass Lehrende aus vielen Live-Signalen eine
> nachvollziehbare Lageeinschätzung gewinnen, die Kontrolle über ihre
> Lehrentscheidungen behalten und der Livebetrieb zuverlässig bleibt?

Zyklus **Wahrnehmen → Einordnen → Handeln**. Das System misst keinen Lernstand,
es unterstützt die Moderation. Verbindliche fachliche Grundlage ist
[Issue #456](https://github.com/kqc-real/arsnova.eu/issues/456), eingeordnet in
[Roadmap #463](https://github.com/kqc-real/arsnova.eu/issues/463).

Zusätzlich formuliert
[Referatsthemen.md](../didaktik/Modulkonzept%20Cloud%20Computing/Referatsthemen.md)
die Skalierungsfrage: 500 gleichzeitige Nutzer heute, Ziel 5.000 in einer
Session oder 100 parallele Sessions à 50.

## Thema 1

**KI-Inferenz für den Moderationskompass – Systemgrenzen und entkoppelte
Architektur.**

**Leitfrage:** Wie wirksam trennt die Architektur von Release 1.3 Anwendung,
Kontextaufbau und private Inferenz unter realer Last, und welche
Betriebsgrenzen ergeben sich für den Moderationskompass?

Basis: ADR-0035, Stories 1.14b/c und 8.9a–d, #456. Für das Deployment zusätzlich
`docker-compose.prod.yml`, `.env.production.example` und `scripts/deploy.sh` am
festgelegten Commit.

| Auftrag | Kurzfrage                                                                                      | Dossier                                                                      |
| ------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1A      | Welche Ressourcenreserve hat der App-Host für optionale Analyse, ohne Live-Signale zu bremsen? | [1A-ressourcenisolation-app-host.md](./1A-ressourcenisolation-app-host.md)   |
| 1B      | Welchen messbaren Isolationsgewinn und Betriebsaufwand bringt die zweite private Serverrolle?  | [1B-private-inferenz-zweiter-host.md](./1B-private-inferenz-zweiter-host.md) |
| 1C      | Hält der Kontextpfad seine Vertrags-, Konsistenz- und Entkopplungszusagen bis zur Inferenz?    | [1C-kontext-und-adapterpfad.md](./1C-kontext-und-adapterpfad.md)             |

**Gruppensynthese:** A bewertet die Ressourcengrenze des App-Hosts, B die
Isolation der privaten Inferenzrolle, C den realen Kontextübergang. Zusammen
entsteht eine evidenzbasierte Bewertung der 1.3-Architektur. Kapazität und
vollständige Sicherheitsprüfung gehören zu Thema 3 und 5 (Abgrenzungsfolie 39
der Kursunterlagen).

## Leistungsbestandteile und Bewertung

| Bestandteil              | Gewicht | Vorgabe                                                                   |
| ------------------------ | ------- | ------------------------------------------------------------------------- |
| Schriftliche Einreichung | 30 %    | Handout max. 5 DIN-A4-Seiten, 350–1.800 Wörter, oder Poster; zwingend PDF |
| Vortrag                  | 30 %    | Teil der 15 Minuten je Prüfling, visuell gestützt                         |
| Diskussion               | 40 %    | Befragung direkt im Anschluss, innerhalb derselben 15 Minuten             |

Sieben Kriterien (Dossier-Folie 14): Sachkompetenz 25 %, Argumentationslinie
25 %, Eigenständigkeit 15 %, Kommunikation 15 %, Themenverständnis 10 %,
Methodik 5 %, Formalia 5 %.

Jede Person wird einzeln bewertet. Keine Gruppennote, kein Gruppenbonus. Jede
Ausarbeitung muss ohne die anderen lesbar sein.

## Pflicht-Nachweiskette je Person

1.3-Release-Tag/Commit und Referenzmanifest → unveränderter eigener Baselinelauf
→ genau bezeichnete Störung oder Variante → vergleichbare Messdaten → Befund mit
Gültigkeitsgrenze → konkrete Entscheidung (Beibehaltung, Konfiguration, Betrieb
oder Verbesserung) mit Kosten-, Risiko- oder Betriebsfolge.

Vor Beginn festzuhalten (Repo-Fassung 4.1.3): Titel, überprüfbare Hypothese,
ernsthafte Gegenalternative, Commit und Manifest, Zielumgebung, mindestens ein
eigener ausführbarer Test, Messgrößen, Wiederholungen, Entscheidungsschwellen,
eigener Anteil an gemeinsamen Artefakten.

Versuche nur in der isolierten Laborinstanz, nie gegen Produktion. Nur
synthetische oder freigegebene Daten. Ein Produktivpatch wird laut
Repo-Fassung nicht verlangt.

## KI-Nutzung

Agentengestütztes Lernen ist möglich; Art und Umfang der zulässigen Nutzung
für die formale Abgabe müssen nach der kanonischen Prüfungsspezifikation und
dem tatsächlichen Prüfungsauftrag bestätigt werden. Bei erlaubter Nutzung sind
Agenten, Modelle, wesentliche Aufträge und übernommene Beiträge offenzulegen. Jede Mess-, Preis-, Quellen- und Systemaussage muss gegen
Primärquelle oder reproduzierbare Evidenz geprüft sein. Keine Secrets, Tokens
oder personenbezogenen Daten in Prompts. Bei Täuschung (z. B. erfundene
Quellen): 0 Punkte.

Für dieses Projekt heißt das: Die Dossiers in diesem Ordner sind agentengestützt
erstellt (Claude Code mit Serena und codebase-memory). Jede Zeilenangabe vor
Übernahme ins Handout selbst prüfen.

## Widersprüche zwischen den Quellen

| Punkt         | Kursfolien „Woche 1“                       | Repo-Fassung / Dossier-PDF                   | Vorgehen                                     |
| ------------- | ------------------------------------------ | -------------------------------------------- | -------------------------------------------- |
| Anzahl Themen | 5 Themen, 10 Dreiergruppen, jedes Thema 2× | 6 Themen, 6 Dreiergruppen                    | Beim Prüfer bestätigen lassen                |
| Abgabefrist   | 48 Stunden vor der Prüfung                 | Spätestens am Vortag der ersten Prüfung      | Mit 48 Stunden planen                        |
| Gruppengröße  | Dreiergruppen                              | Dreiergruppen; Abweichung nur dokumentiert   | Zweiergruppe mit allen drei Aufträgen klären |
| PR als Abgabe | Nicht erwähnt                              | Nicht erwähnt; Produktivpatch nicht verlangt | Umfang der PR schriftlich geben lassen       |
| Poster-Format | DIN A0                                     | Mindestens DIN A3                            | Handout wählen oder Format klären            |

## Geklärte A1-Baseline und Laborumgebung

Laut [Issue #6, Stand 10.11.2026](https://github.com/NiklasSkulll/arsnova.eu/issues/6)
wurden der **eigene Rechner als Labor** und der **aktuelle Fork-`main` als
Baseline** mit dem Prüfer geklärt; die E-Mail ist dort mit dem 04.11.2026
vermerkt. Die E-Mail selbst liegt hier nicht vor. Die Freigabe wird deshalb
auf das Issue zurückgeführt, nicht auf eine selbst geprüfte E-Mail.

Für die A1-Reihe wurde der Commit
`8f91e0417bc5aace461c3644a0b6b26c9284035b` (Version 1.4.0) eingefroren.
Aufbau, Image-IDs und tatsächliche WSL2-Hardware mit 16 logischen CPUs stehen
in der [Versuchsanleitung](./1A-versuchsreihe.md) und den Laufmanifesten.
Die Messung ist keine Kapazitätsfreigabe für den 8-vCPU-Produktionshost.
Ein Produktivpatch ist laut Issue nicht gefordert. Die Fork-PR soll gegen
`main` gehen und `Closes #6` enthalten; eine Upstream-PR ist davon getrennt.
Die konkrete Zweier-Aufteilung und die übrigen Abgabeformalitäten gelten
hierdurch nicht automatisch als genehmigt.

## Historische Ausgangsfrage: Tag `v1.3.0` oder aktueller `main`?

Im Repo existiert der Tag `v1.3.0` (`87c39334`, 2026-10-08). Der Stand, auf dem
diese Dossiers erstellt wurden (`27966e75`, 2026-10-16), liegt 131 Commits
später und weicht in zentralen Werten ab, zum Beispiel:

| Wert                            | `v1.3.0` | `27966e75` (HEAD) |
| ------------------------------- | -------- | ----------------- |
| `--ctx-size` der LLM-Runtime    | 4096     | 8192              |
| Default `QA_SUMMARY_TIMEOUT_MS` | 8000     | 90000             |
| Lernziel-Timeout                | 120 s    | 300 s             |
| RAM-Limit LLM-Container         | 5g       | 8g / memswap 10g  |
| Runtime-Statusprobe             | fehlt    | vorhanden         |
| Aufrufer des Label-Auftrags     | fehlt    | vorhanden         |

Alle Werte selbst geprüft mit `git show v1.3.0:<pfad>` gegen HEAD
(`docker/open-weight-llm/entrypoint.sh`, `docker-compose.llm.yml`,
`apps/backend/src/lib/qaSummaryConfig.ts`, `openWeightLlmConfig.ts`,
`openWeightLlmRuntimeProbe.ts`, `wordCloudTopicLabels.ts`). Die
Repo-Fassung verlangt, dass die Lehrperson den **produktiv eingesetzten**
Release-Tag und Commit fixiert. Für A1 ist diese Frage inzwischen wie oben beschrieben geklärt. Die folgende
Historie und die Dossier-Zeilen beziehen sich weiterhin auf den damaligen Stand.

<a id="offene-fragen-an-den-prüfer"></a>

## Klärungsstand der Fragen an den Prüfer

1. Wir sind zu zweit und bearbeiten alle drei Aufträge 1A, 1B und 1C. Wie wird
   der dritte Auftrag zugeordnet und bewertet?
2. Was genau gehört in die PR an kqc-real (Tests, Messskripte,
   Instrumentierung, Evidenzordner, Code-Verbesserung)?
3. **Baseline und A1-Labor: geklärt.** Eigener Rechner und aktueller Fork-`main`
   gemäß Issue #6; konkrete Messrevision siehe oben. Für A1 ist hierfür keine
   erneute Freigabeanfrage erforderlich.
4. **Zweiter Host:** In der Vorlesung wurde ein bereitgestellter Server erwähnt,
   vermutlich bei Hetzner oder Hostinger (nicht sicher mitgeschrieben). Was
   genau steht dort bereit (Hardware, Netz, Zugangsweg)? Wie bekommen wir
   Zugang zur Laborinstanz?
5. Gilt die 48-Stunden-Frist der Folien oder der Vortag der Repo-Fassung?
6. Wo ist der geheimnisfreie Evidenzort (Repo-Ordner, Branch, eigener Speicher)?

## Abschlussstand A1

Auswertung, Abgabeentwürfe, nachträgliche Compose-Rekonstruktion und
[Prüf-/Übergabeunterlage](./1A-abschluss-und-uebergabe.md) sind getrennt
nachgewiesen. Die Rekonstruktion ersetzt keine während der Messung gespeicherte
Compose-Ausgabe. Persönliche Abgabefreigabe, Abstimmung mit 1B/1C und der
GitHub-Merge werden nur nach tatsächlicher Durchführung als erledigt markiert.
