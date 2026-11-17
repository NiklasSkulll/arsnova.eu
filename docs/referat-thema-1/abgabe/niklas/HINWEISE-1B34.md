# Hinweise für Niklas zu 1B Schritte 3–4 (Stand 2026-11-17)

Beim Einarbeiten von PR #26 in Folien (M1–M4) und Handout aufgefallen. Deine Protokolle sind nicht geändert;
Folien und Fragenkatalog formulieren korrekt und bereiten die Antworten vor
([Fragenkatalog F10–F19](fragenkatalog-1a.md#1b-schritte-34-störung-und-betriebsaufwand)).

| Punkt                                                                                                             | Wo                                                         | Vorschlag                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Funktion heißt `runWithQueueTimeout` (`qaSummaryQueue.ts:259`), nicht `processWithTimeout`                        | `evidenz/1B/2026-11-16-lauf-breaker-l3-summary.md`         | datierter Hinweis „_Korrigiert 2026-11-17:_“ (Protokoll bleibt sonst gleich) |
| Gekürzter Restumfang kam mit `aa0e90c7` (16.11., 20:43) ins Repo, nach den L2-, L3-, F2-Label- und Breaker-Läufen | `1B-3u4-Planung.md`, Nachträge                             | in der Prüfung offen sagen (F17); Schwellen selbst blieben gleich            |
| Summary-Normal ist nur als F1 gegen Normal gerechnet, nicht in der Richtung von H2 (Normal gegen B0)              | `evidenz/1B/2026-11-15-lauf-f1-summary.md`, Live-Vergleich | Nachrechnung: Q&A 1,24, Blitzlicht 1,22 über 1,10 (F15)                      |
| Autorenprüfung im Abbauprotokoll steht auf „offen“                                                                | `evidenz/1B/2026-11-16-laborabbau.md`                      | Datum eintragen (einzige erlaubte spätere Änderung)                          |
| Handout: Modell im KI-Abschnitt eingetragen (GPT-6.1 Sol in Codex, aus deiner PR); eigene Prüfung fehlt noch      | PaperLab, Handout 1A/1B, Abschnitt KI-Offenlegung          | einen Satz in eigenen Worten statt der Marke `[Niklas: …]`                   |
| Gesamt-Pester 106/109 (drei `Get-FileHash`-Fälle) und kein vollständiger Formatcheck                              | `1B-3u4-beitragsabgleich.md`                               | vor dem gemeinsamen Merge nach `main` erneut laufen lassen                   |

Rohdaten: Die 16 großen Ergebnis-JSONs liegen jetzt byte-identisch als `.json.gz` (Prüfsummen im Commit
`3a8408ab`); Leser verwenden `evidenz/1B/json-lesen.mjs`.
