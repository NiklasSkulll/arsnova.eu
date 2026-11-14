# A1 – Abschlussnacharbeit vom 13.11.2026

Ausgangspunkt ist der noch nicht committete Schritt 7 bei
`feature-1A-resource-isolation@7ebe05a55f27e43913fe94f8be71dd28bdc55b6e`.
Die ursprünglichen Messwerte und der eingefrorene Versuchsvertrag bleiben
unverändert. Die damaligen Prüfergebnisse stehen in [pruefungen.json](./pruefungen.json).

**Historischer Stand:** Diese Prüfungen liefen vor dem Verwerfen der Compiler-
und Frontend-Testkorrekturen. Für den aktuellen Umfang gilt die
[Bereinigungsprüfung](../bereinigung/README.md); frühere Erfolge werden nicht übertragen.

## Behandelte Punkte

1. [Compose-Rekonstruktion](../compose-rekonstruktion/README.md): fünf heute
   aufgelöste, bereinigte Varianten mit Abgleich gegen 25 Laufmanifeste.
   Die fehlende damalige Aufnahme wird ausdrücklich nicht erfunden.
2. [Rahmendokument](../../../00-rahmen-und-pruefung.md) und
   [Aufteilung](../../../01-aufteilung.md): bestätigte A1-Baseline und eigener
   Rechner gemäß Issue #6 von weiterhin offenen Prüfungs-/Gruppenfragen getrennt.
3. Unabhängige technische Review des ganzen A1-Branches einschließlich
   uncommitteter Änderungen; [Reviewbericht](./review.md) und tatsächliche
   Prüfergebnisse sind getrennt dokumentiert.
4. [Persönliche Prüfung und Übergabe](../../../1A-abschluss-und-uebergabe.md):
   nachvollziehbare Aufgaben, gemeinsame Artefakte und KI-Kennzeichnung
   vorbereitet; persönliche Bestätigung und tatsächliches Gespräch bleiben offen.

## Umfang und Entscheidungen

- Der damals geprüfte Stand enthielt produktiv wirksame Compilerkorrekturen.
  Diese und die sachfremde Frontend-Testkorrektur wurden anschließend verworfen;
  A1-npm-Befehle und der Quick-Feedback-Isolationstest bleiben im aktuellen Umfang.
- Originalwerkzeuge und Rohdaten werden nicht angepasst, um Nachweise oder
  Hypothesen nachträglich passend zu machen.
- Rekonstruktion und fachliche Auswertung sind getrennte Artefakte. H1/H2 und
  die Betriebsentscheidung werden durch diesen Nachtrag nicht verändert.
- Ein Agentenreview, ein erstellter PR und ein Merge sind jeweils getrennte
  Zustände. Persönliche Abgabefreigabe und institutionelle Anerkennung sind
  zusätzliche, nicht automatisch erteilte Bestätigungen.

## Ausgeführte Wiederholungen

Der erste vollständige Nacharbeitslauf bestand alle Werkzeug-, Shared-Types-,
Report- und Backend-Tests, meldete aber einen Fehler im unveränderten
Frontend-Test »zeigt Kompass-Beispiele nach dem Schliessen der Freitext-Wortwolke«.
Der isolierte Test bestand anschließend ohne Änderung. Die Ursache ist damit
nicht zugeordnet; dies wird nicht als nachgewiesener Produktfehler ausgegeben.
Die vollständige Wiederholung bestand anschließend ebenfalls unverändert
(2817 Frontend-Tests und sämtliche vorherigen Stufen); beide Gesamtläufe
bleiben getrennt im Prüfprotokoll erfasst.
