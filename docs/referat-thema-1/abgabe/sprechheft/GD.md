## Verstehen

GD ist die Dankesfolie. Niklas spricht sie, Redezeit 15 s, kumuliert 14:25 (Kurzfassung 12:15). Sie bleibt während der ganzen Befragung stehen. Es gibt keine Aufbaustufen.

**Was zu sehen ist.** Links oben steht „Alle Belege zum Nachprüfen“: Entscheidungen als ADR, Laufprotokolle, Messdaten und der Bau dieses Decks. Darunter der Link `github.com/NiklasSkulll/arsnova.eu/tree/main/docs/referat-thema-1` und die beiden Namen. Rechts daneben ein QR-Code auf denselben Ordner. Darunter fünf Kennzahlen als Kacheln: 20,3 h gewertete Laborzeit, 29,3 h Aufbau, Tests, weitere Läufe, 326 automatisierte Tests, 35 ADRs, 50 vorab festgelegte Hypothesen. Unten stehen Balken je Auftrag, links die gewertete Zeit („gewertete Läufe 5.–16.11.2026“), rechts mit „+“ die Zeit für Aufbau, Tests und weitere Läufe:

| Auftrag                | gewertet    | zusätzlich  |
| ---------------------- | ----------- | ----------- |
| 1A Ressourcenisolation | 2 h 32 min  | 3 h 26 min  |
| 1B Schritte 1–2        | 55 min      | 23 h 19 min |
| 1B Schritte 3–4        | 12 h 39 min | 1 h 19 min  |
| 1C Laborläufe          | 4 h 15 min  | 1 h 11 min  |

**Herkunft der Zahlen.** Alle Werte stehen in `nachweisumfang.md` (Stand 17.11.2026, Commit `e3986902`). Das Skript `abgabe/jonas/nachweisumfang.mjs` rechnet sie auf dem Checkout neu aus; der Test daneben schlägt fehl, wenn Datei und Checkout auseinanderlaufen. Die Folie liest die Werte aus dieser Datei (`ladeNachweis` in `abgabe/jonas/folien.mjs`).

- **20,3 h** (20 h 21 min, 73.235 s): Summe der vier gewerteten Laufzeiten, gemessen an den Zeitstempeln der Rohdaten, nicht an Protokollangaben. Nur gewertete Läufe; Vorläufe, gestörte und abgebrochene Versuche fehlen.
- **29,3 h** (29 h 15 min, 105.311 s): Rechnerzeit außerhalb der gewerteten Läufe, nie mit der Laborzeit addiert. Für 1B Schritte 1–2 aus dem Systemjournal des Laptops (`evidenz/1B/2026-11-17-vm-laufzeiten.md`: 29 VM-Starts, davon 11 Windows); für die anderen Aufträge aus Uhrzeiten in den Protokollen, je Zeitfenster mit wörtlichem Beleg in `FENSTER` in `nachweisumfang.mjs`. Für 1A zählen der Vorlauf und 43 gelöschte Läufe aus Git.
- **326 Tests:** statisch gezählt, nicht ausgeführt: 108 (1A Lastwerkzeuge), 126 (Messwerkzeuge 1B/1C), 57 (Pester 1B, Windows), 35 (Backend 1C). Ohne die Tests des Decks und der Handouts.
- **35 ADRs:** 1B 13, 1C 22. 1A hat statt ADRs einen Experimentvertrag.
- **50 Hypothesen und Kriterien:** Kennungen, die vor dem jeweiligen Lauf in einem Design oder Vertrag standen (Aufschlüsselung auf R17).

**Warum die Folie zählt.** Sie zeigt, wo jede Aussage nachprüfbar ist. Für die Befragung ist sie der Anker: Jede Antwort kann auf eine Datei in diesem Ordner verweisen.

**Was die Folie nicht behauptet.** Die Stunden sind Rechnerzeit, keine Arbeitszeit. Planung, Code, Auswertung und Dokumentation ohne laufendes Labor sind nirgends gezählt. Die Zahlen sagen, wie viel Material da ist, nicht, wie gut es ist. Für Niklas’ Windows-Rechner gibt es kein Journal im Repo; seine PR nennt für Entwicklungs- und Diagnoseproben rund 1 h 20 min, die nicht in den 29,3 h stecken.

## Begriffe

- **Repository (Repo):** Ein Ordner mit Versionsgeschichte in Git, hier auf GitHub. Jede Änderung ist mit Datum und Commit nachvollziehbar.
- **Fork:** Eine eigene Kopie eines fremden Repositorys. Wir arbeiten im Fork von Niklas; das Original gehört dem Projekt arsnova.eu.
- **Commit:** Ein gespeicherter Stand im Repository mit einer eindeutigen Kennung wie `e3986902`. Zahlen nennen immer den Commit, auf dem sie entstanden.
- **Gewertete Laborzeit:** Die Dauer der Messläufe, die in die Ergebnisse eingehen. Probe-, Entwicklungs- und gestörte Läufe zählen nicht dazu.
- **Rechnerzeit:** Zeit, in der ein Rechner oder eine VM lief. Sie sagt nichts darüber, wie lange Menschen gearbeitet haben.
- **VM (virtuelle Maschine):** Ein simulierter Rechner auf einem echten Rechner. Unsere zwei „Hosts“ waren jeweils zwei VMs auf einem physischen Gerät.
- **Systemjournal:** Das Protokoll des Linux-Systems. Es hält fest, wann jede VM startete und endete.
- **Automatisierter Test:** Ein Programm, das prüft, ob ein anderes Programm sich wie erwartet verhält. Hier prüfen die Tests vor allem Mess- und Laborwerkzeuge.
- **Pester:** Ein Testwerkzeug für PowerShell-Skripte unter Windows. Damit sind die Windows-Laborskripte von 1B getestet.
- **ADR (Architecture Decision Record):** Ein kurzes Dokument zu genau einer Entscheidung mit Kontext, Entscheidung, Alternativen und Belegen. Ein angenommenes ADR wird nicht umgeschrieben, nur annotiert oder abgelöst.
- **Hypothese vorab:** Eine prüfbare Vermutung mit Messgröße und Schwelle, die vor dem Lauf festgeschrieben wird. So kann man die Regel nicht nachträglich an das Ergebnis anpassen.
- **QR-Code:** Ein Bildcode, den ein Smartphone als Link liest. Er führt hier auf den Ordner `docs/referat-thema-1`.

## Fragen

### Wie viel Aufwand steckt in der Arbeit?

Gezählt haben wir nur, was sich aus Daten belegen lässt: 20,3 Stunden gewertete Laborzeit und 29,3 Stunden Rechnerzeit für Aufbau, Tests und weitere Läufe. Das ist keine Arbeitszeit; Planung, Programmierung und Auswertung ohne laufendes Labor sind nicht gezählt. Commit- oder Zeilenzahlen nennen wir bewusst nicht, weil sie kein Aufwandsmaß sind.

### Welche Rolle hatte KI bei der Arbeit?

Eine große, und wir legen sie offen. Jonas arbeitete mit Claude Code von Anthropic, laut Protokollen mit dem Modell Claude Opus 5.5; die KI entwarf Skripte, Tests, Auswertung, Protokolle und Diagramme. Niklas arbeitete mit OpenAI Codex an Werkzeugen, Tests, Auswertung und Entwürfen; seine Folien im gemeinsamen Deck sind mit Claude Code gebaut, den Inhalt verantwortet er. Auftrag, Freigaben, Hypothesen und Deutung liegen bei uns; wer was gemacht hat, steht je Artefakt in den Eigenanteil-Dateien `1A-eigenanteil.md`, `1B-eigenanteil.md` und `1C-eigenanteil.md`, ohne Prozentangabe. Reviews waren KI-Sitzungen, keine menschlichen Gutachten.

### Hat die KI auch ohne Ihre Freigabe gehandelt?

Ja, das ist offengelegt. In 1C liefen M7b und M7c ohne vorherige Freigabe; das bleibt als Abweichung stehen. In der Nacht zum 2026-11-13 traf die KI in Jonas’ Auftrag Entscheidungen, etwa „nicht bewertbar“, wenn einem Auftrag eine Komponente fehlt; Jonas hat sie danach bestätigt.

### Wie reproduzierbar ist das?

Der 1B-Aufbau läuft mit einem Befehl, `labor.sh up`; am 2026-11-13 wurde er zweimal von null gebaut, beide Male mit allen Prüfungen grün. Jedes Ergebnis-JSON hält Rechner, Hypervisor und VMs fest, und die 1C-Kennzahlen lassen sich mit `auswertung.mjs` aus den Rohdaten nachrechnen. Bitgleich sind die Images nicht; deshalb hält jeder Lauf seinen Digest fest. Zeiten gelten nur je Rechner und Commit.

### Warum zwei Hosts, und warum zwei verschiedene Laborrechner?

Zwei Hosts gibt die Architektur vor: ADR-0035 legt das Sprachmodell auf einen zweiten privaten Host, weil der Live-Host mit 8 vCPU und 16 GB es nicht zusätzlich tragen soll. Im Labor waren beide Hosts VMs auf einem physischen Rechner, bei Jonas ein Laptop (ThinkPad P50), bei Niklas ein Windows-PC (i7-10700K, Hyper-V). Die Grenze: Unabhängige Ausfallbereiche sind damit nicht belegt.

### Was würden Sie heute anders machen?

Niklas würde die Latenzregel in 1A an einem Vergleich ohne Änderung kalibrieren und eine Mindesteffektgröße mit Bootstrap-Konfidenzintervall nutzen; die Regel schlug schon ohne spaCy 4 von 20 Mal an. Den Lastgenerator würde er auf einen eigenen Rechner legen. Jonas würde die Rückwirkung auf den App-Host auf getrennter Hardware messen und für die Zeitwerte Intervalle angeben; in 1B war n = 10 in einem Lauf. Instruktion, Grammatik und Gate würden wir gemeinsam mit echter Runtime abnehmen, wie in ADR 1C-018 empfohlen.

### Wurden die 326 Tests ausgeführt?

Gezählt sind sie statisch, also nicht bei der Zählung ausgeführt. Sie prüfen vor allem unsere Mess- und Laborwerkzeuge; nur 35 sind Backend-Tests für 1C. Produktionscode haben wir nicht geändert; das war eine Regel des Referats.

### Waren wirklich alle 50 Hypothesen vorab festgelegt?

Die gezählten Kennungen standen jeweils vor dem Lauf in einem Design oder Vertrag. Es gibt offengelegte Ausnahmen: In 1C war T3.1 exploratorisch, und M7b und M7c wurden erst nach Sichtung von M7 festgelegt. In 1B Schritte 3–4 wurde der Restumfang nach dem Lauf L1 per datiertem Nachtrag gekürzt (`1B-3u4-Planung.md`, Nachtrag 2026-11-16); frühere Hypothesen und Schwellen blieben unverändert.

## Übergang

Nach „Wir freuen uns auf Ihre Fragen“ bleibt GD stehen. Bei Fragen zum Umfang mit `r` die Reserve öffnen und R17 wählen (Escape führt zurück). Bei Fragen zur KI R6 „Anteil der KI“, zu Gültigkeitsgrenzen R5. Das Literaturverzeichnis folgt als Anhang auf J16 und NL.
