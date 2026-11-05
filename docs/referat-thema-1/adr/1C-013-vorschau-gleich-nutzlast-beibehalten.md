# 1C-013: Host-Vorschau gleich gesendeter Nutzlast, Packing beibehalten

- **Status:** angenommen (2026-11-05)
- **Kategorie:** Beibehaltung

## Kontext

Auftragsschritte 1 und 2 verlangen den Nachweis, dass die Vorschau der Lehrperson für denselben Revisionsstand genau das zeigt, was die Runtime erhält. Vorschau und Auftrag nutzen denselben `hooks.prepare`, und Anfrage und Vorschau erhalten dasselbe `promptContext`-Objekt ([Dossier 7.1](../1C-kontext-und-adapterpfad.md#71-erzeugung)). Teil 2 hat das mit Test-Runtime gezeigt ([E1](../evidenz/1C/2026-10-24-teil2.md#e1--vorschau--nutzlast)); offen war der Pfad bis zur ausgelieferten Runtime (Fall L1, [Labor-Design 5](../specs/2026-10-25-1c-labor-design.md#5-fälle)).

## Entscheidung

Vorschau und Packing bleiben unverändert (`getQaSummaryContextPreview`, `buildChatCompletionBody`). Das Akzeptanzkriterium „Vorschau gegen gepackte Nutzlast für denselben Revisionsstand“ gilt auf dem Releasepfad.

## Alternativen

- **Eigene Auswahl für die Vorschau** (zweiter Auswahl- oder Serialisierungscode): verworfen, weil es heute keine zweite Auswahllogik gibt und damit keine Quelle für Abweichungen ([Dossier 7.1](../1C-kontext-und-adapterpfad.md#71-erzeugung)).
- **Vorschau aus dem letzten Job statt frisch aufbauen:** nicht untersucht; spart einen Kontextaufbau je Vorschau ([Dossier 12.1](../1C-kontext-und-adapterpfad.md#121-wo-zeit-und-cpu-anfallen-code-analyse)), zeigt aber nicht mehr den aktuellen Stand.

## Belege

- **Regel:** K_L1 erfüllt → Beibehaltung ([Labor-Design 6](../specs/2026-10-25-1c-labor-design.md#6-entscheidungsregeln)).
- **Laptop:** 20 von 20 Läufen, 0 Abweichungen in allen elf Prüfungen ([L1 Laptop](../evidenz/1C/2026-11-05-labor.md#l1-vorschau--draht)).
- **PC:** ebenso 20 von 20, 0 Abweichungen ([L1 PC](../evidenz/1C/2026-11-05-labor-pc.md#l1-vorschau--draht)).
- **Vorlauf:** E1 mit Test-Runtime bestätigt, Mutationsprobe (Feld `feedback` entfernt) rot ([E1](../evidenz/1C/2026-10-24-teil2.md#e1--vorschau--nutzlast)).

## Folgen

- **Kosten:** unverändert; jede Vorschau kostet einen vollständigen Kontextaufbau ([Dossier 12.1](../1C-kontext-und-adapterpfad.md#121-wo-zeit-und-cpu-anfallen-code-analyse)).
- **Risiko:** keines neu. **Rückweg:** entfällt.
- **Gültigkeitsgrenze:** gilt für denselben Revisionsstand; über getrennte Aufrufe unterscheiden sich `packedAt` und `cache` (Befund B5, [Dossier 14](../1C-kontext-und-adapterpfad.md#14-befundliste-kurzfassung-für-handout)). Eine Fixture, eine Sprache, lokal gebautes Image, Proxy als zusätzlicher Loopback-Hop ([Labor-Design 7](../specs/2026-10-25-1c-labor-design.md#7-gültigkeitsgrenzen)). Was die Vorschau zeigt, ist gleich dem Gesendeten; dass Bereiche aus Budgetgründen fehlen, steht in 1C-014 und 1C-005.
