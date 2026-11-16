# Nachweisumfang Referat Thema 1

Was an Belegen im Repo liegt, gezählt statt geschätzt. Die Zahlen sagen, wie
viel Material zum Nachprüfen da ist, nicht, wie gut es ist; Ergebnisse und
Befunde stehen in den Hauptdokumenten der Aufträge.

Stand 16.11.2026, Branch `feature-praesentation-jonas`, Commit `a7346fd7`.
Alle Werte der Tabellen rechnet
[`abgabe/jonas/nachweisumfang.mjs`](abgabe/jonas/nachweisumfang.mjs) auf dem
aktuellen Checkout neu aus; `nachweisumfang.test.mjs` daneben schlägt fehl,
sobald diese Datei und der Checkout auseinanderlaufen:

```sh
node docs/referat-thema-1/abgabe/jonas/nachweisumfang.mjs   # Werte als JSON
cd docs/referat-thema-1/abgabe/jonas && node --test nachweisumfang.test.mjs
```

## Kopfzahlen

Nur Werte, deren Rohdaten und Protokolle beide auf diesem Stand liegen.

| Kennzahl                                   | Wert                             | Quelle                                                         |
| ------------------------------------------ | -------------------------------- | -------------------------------------------------------------- |
| Gewertete Laborzeit                        | **7,7 h** (7 h 42 min, 27.716 s) | Abschnitt [Laborzeit](#laborzeit)                              |
| Automatisierte Tests                       | **254**                          | Abschnitt [Tests](#tests); ohne die Tests des Abgabe-Builds    |
| ADRs                                       | **34** (1B: 12, 1C: 22)          | `ls adr/1[BC]-*.md`; 1A hat statt ADRs einen Experimentvertrag |
| Vorab festgelegte Hypothesen und Kriterien | **44**                           | Abschnitt [Hypothesen](#hypothesen-und-kriterien)              |

## Laborzeit

Dauer je Lauf aus den Zeitstempeln der Rohdaten, nicht aus Protokollangaben.
Gezählt sind nur gewertete Läufe; Vorläufe, gestörte und abgebrochene Versuche,
Entwicklungsläufe, Aufbau und modellfreie Messungen fehlen.

| Kennzahl                     | Wert                                  | Rohdaten und Zeitstempel                                                                                                                           |
| ---------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| davon 1A Ressourcenisolation | 2 h 32 min (25 Läufe, 25 vollständig) | `evidenz/1A/reihe-main-a19ca70f-20261115-122547/V*/block-*/`: `lauf.json` → `warmup.manifest.startAt` bis `report.json` → `timestamp`              |
| davon 1B Schritte 1–2        | 55 min (25 Aufträge)                  | `evidenz/1B/messung/2026-11-13-lauf.json`, `-lauf-b0.json`, `-lauf-kalt*.json`: `treiber.startedAt` bis spätestes `treiber.auftraege[].finishedAt` |
| davon 1C Laborläufe          | 4 h 15 min (3 Läufe)                  | `evidenz/1C/messung/2026-11-05-labor.json.gz`, `-labor-pc.json.gz`, `2026-11-09-labor-nachlauf.json.gz`: `environment.startedAt` bis `endedAt`     |

**1B Schritte 3–4 (Niklas), getrennt ausgewiesen:** Die Rohdaten von fünf
Reihen liegen seit Commit `545efdeb` unverändert auf diesem Branch, die
Protokolle und die Schwellen (`1B-3u4-Planung.md`) nur auf Niklas' Zweig
`feature-1B-private-inference-3-4`; die Prüfung durch den Autor ist dort offen.
Deshalb nicht in den Kopfzahlen.

| Kennzahl                   | Wert                               | Rohdaten                                                                                              |
| -------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1B Schritte 3–4 (Rohdaten) | 4 h 11 min (5 Reihen, 45 Aufträge) | `evidenz/1B/messung/2026-11-1{5,6}-lauf-{normal,f1,f2,l3,busy}-summary.json`, Zeitstempel wie 1B oben |

## Tests

Statisch gezählt, nicht ausgeführt: Zeilen, die mit `test(` oder `it(`
beginnen (node:test, Vitest), bei Pester mit `It '…'`. Tests in Schleifen
zählen einmal. Gezählt werden getrackte und nicht ignorierte Dateien des
Checkouts. „Neu“ und „geändert“ beziehen sich auf den letzten Upstream-Stand im
Fork, `21734265` (`git merge-base upstream/main HEAD`); bei geänderten Dateien
zählt die Differenz der Testzeilen.

| Kennzahl            | Wert                                        | Dateien                                                                   |
| ------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| Messwerkzeuge 1B/1C | 59 (12 Dateien)                             | `docs/referat-thema-1/evidenz/**/*.test.mjs`                              |
| Pester 1B (Windows) | 52 (3 Dateien)                              | `docs/referat-thema-1/evidenz/1B/**/*.Tests.ps1`                          |
| 1A Lastwerkzeuge    | 108 (16 neue Dateien)                       | `scripts/load/**/*.test.mjs`, neu seit `21734265`                         |
| Backend 1C          | 35 (4 neue Dateien, netto +1 in geänderten) | `apps/backend/src/__tests__/*.test.ts`, neu oder geändert seit `21734265` |

Nicht in den Kopfzahlen: die Tests des Abgabe-Builds unter `abgabe/` (Folien,
Handout, Deck). Sie prüfen die Präsentation, nicht die Belege, und ändern sich
mit jeder Folienänderung; das Skript gibt sie als `tests.gruppen.abgabe` und
die Summe mit ihnen als `kopfzahlen().testsMitAbgabe` aus.

## Hypothesen und Kriterien

Gezählt sind Kennungen, die in einem Design oder Vertrag vor dem jeweiligen
Lauf festgelegt wurden, je an ihrer definierenden Stelle (Tabellenzeile oder
fett gesetzter Listenpunkt). E6a und E6b zählen getrennt, weil sie getrennte
Kriterien haben.

| Kennzahl               | Wert | Datei                                                                               |
| ---------------------- | ---- | ----------------------------------------------------------------------------------- |
| 1A (Experimentvertrag) | 2    | `1A-experiment-contract.md` (H1, H2)                                                |
| 1B Schritte 1–2        | 5    | `specs/2026-11-12-1b-zwei-host-design.md` (H_B0–H_B3, H_C0)                         |
| 1C Einzeltests E       | 16   | `specs/2026-10-24-1c-teil2-design.md`, `-teil3-design.md` (E1–E15, E6 als E6a, E6b) |
| 1C Messungen M         | 7    | `specs/2026-10-24-1c-teil2-design.md`, `-teil3-design.md` (M1–M7)                   |
| 1C Labor L             | 6    | `specs/2026-10-25-1c-labor-design.md` (L1–L6)                                       |
| 1C Nachlauf N          | 6    | `specs/2026-11-06-1c-nachlauf-design.md` (N1–N6)                                    |
| 1C Gate-Ablation H_A   | 2    | `evidenz/1C/2026-11-16-gate-ablation.md` (H_A1, H_A2)                               |

Nicht gezählt: die Kriterien für 1B Schritte 3–4 (in `1B-3u4-Planung.md` auf
Niklas' Zweig) und die Testfälle T… des Testdesigns
`specs/2026-10-24-1c-tests-design.md`.

## Darstellung

Auf Folien und im Handout nur Zahl und Pfad, ohne Wertung wie „umfangreich“.
Verworfene und gestörte Läufe stehen mit Grund in den Protokollen unter
`evidenz/`; wer die Laborzeit nennt, nennt sie als gewertete Zeit. Commit- und
Zeilenzahlen sind kein Aufwandsmaß und gehören nicht hierher.
