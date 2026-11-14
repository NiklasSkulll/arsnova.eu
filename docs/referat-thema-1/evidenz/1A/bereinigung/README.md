# A1 – Bereinigungsprüfung vom 14.11.2026

Dieser Nachtrag dokumentiert den Umfang nach dem vom Bearbeiter vorgenommenen
Verwerfen sachfremder Änderungen. Die älteren JSON-Prüfprotokolle unter
`auswertung/` und `nacharbeit/` bleiben unverändert; ihre Quellenhashes und
Ergebnisse beziehen sich auf den damaligen Stand einschließlich inzwischen
verworfener Korrekturen. Sie sind keine aktuellen erfolgreichen Gesamtprüfungen.

## Verbleibender Umfang

- `package.json`: vier A1-Befehle für Auswertung, Auswertungstests, Dokumentbau
  und Compose-Rekonstruktion wiederhergestellt; Auswertungstests in `test` und
  `test:coverage` integriert. Keine Änderung an Abhängigkeiten, Build oder Start.
- `wordCloud.hotpath-isolation.test.ts`: Quick Feedback und kontrollierte
  Negativprobe wiederhergestellt. Keine Änderung an produktiven Routern.
- Backend-/Frontend-Compilerkonfiguration und der sachfremde Frontend-Korpustest
  entsprechen HEAD. Die ursprünglichen Korrekturen werden nicht zurückgebracht.
- Dokumentation und PR-Entwurf unterscheiden aktuellen Umfang und historische
  Nachweise. Der Entwurf lässt erneute unabhängige Diffprüfung und
  Reviewbereitschaft ausdrücklich unbestätigt.

## Aktuelle Prüfungen

Die Befehle und Ergebnisse stehen in [pruefungen.json](./pruefungen.json).
Werkzeug- und Vitest-Prüfungen liefen lokal mit Node 24.18.0 außerhalb der
Sandbox, damit erforderliche Unterprozesse und lokale Testserver funktionieren.
Es wurde keine neue Docker-Messreihe gestartet; dies sind Entwicklungsprüfungen.

- Alle sechs A1-Werkzeugtestsuiten: **99 Tests bestanden**
  (9 Fixture, 12 Live-Messung, 20 Analyse, 22 Infrastruktur, 14 Experiment,
  22 Auswertung/Dokumentvorlagen/Rekonstruktion).
- Hotpfadtest: **4 Tests bestanden**. Zuvor scheiterte die Negativprobe bei
  absichtlich fehlender Quick-Feedback-Abdeckung; anschließend wurde genau
  diese Abdeckung wiederhergestellt.
- Gesamt-Typecheck: **Exit 2**, unverändertes Backend mit TS5095
  (`CommonJS` zusammen mit `moduleResolution: bundler`).
- Separater Frontend-Typecheck: **Exit 2**, unveränderte Konfiguration mit
  TS2488 bei der vorhandenen NodeList-Iteration in `session-host.component.ts`.
- Unveränderter Frontend-Korpustest: **1 fehlgeschlagen, 514 nicht ausgewählt**.
  Erwartet »viel Zustimmung«, erhält den vorhandenen Hinweis zur Differenz
  von Dafür- und Dagegen-Stimmen. Kein neues A1-Verhalten betroffen.

`npm test`, Coverage, Produktionsbuild, PDF-Bau und Compose-Rekonstruktion wurden
nach der Bereinigung nicht vollständig erneut ausgeführt. Der nachgewiesene
Backend-Compilerfehler blockiert den Produktionsbuild; der gezielt reproduzierte
Frontend-Testfehler verhindert einen erfolgreichen Gesamttest im aktuellen Stand.
Die A1-spezifischen Tests ersetzen diese offenen Projektprüfungen nicht.

Lint-, Format-, Integritäts- und PR-Vorlagenresultate sind im JSON-Protokoll
aufgeführt. Der Vorlagenvalidator meldet die zwei bewusst offenen
Selbstreview-Punkte; eine bestandene Reviewfreigabe wird nicht behauptet.

## Unveränderte Nachweise und weitere Schritte

Die eingefrorenen Messwerkzeuge, der Versuchsvertrag und die vollständige
Originalreihe werden gegen HEAD geprüft. Abgeleitete Messauswertung,
Compose-Rekonstruktion und PDF-Artefakte werden gegen den bereits bereitgestellten
Index geprüft. Ihre Inhalte werden durch diesen Nachtrag nicht neu erzeugt.
Quellenhashes im aktuellen Protokoll identifizieren die verbleibenden Werkzeuge,
Tests, ursprünglichen Konfigurationen und synchronisierten Dokumente; das Protokoll
selbst ist von seiner eigenen Hashliste ausgenommen.

Der historische unabhängige [Reviewbericht](../nacharbeit/review.md) gilt für
seinen damaligen Umfang. Erneute unabhängige Review des bereinigten Diffs,
Klärung der vorhandenen Projektfehler sowie vollständige Projektprüfungen stehen
vor einer Reviewfreigabe aus. Persönliche fachliche Prüfung, KI-/Abgabevorgaben,
Abstimmung mit Jonas und Commit/Push/PR/Merge bleiben offen und werden nicht
automatisch bestätigt.
