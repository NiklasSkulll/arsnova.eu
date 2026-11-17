## Verstehen

GT ist die Titelfolie des gemeinsamen Decks. Niklas spricht sie, Redezeit 10 s, kumuliert 0:10; sie gehört zur Kurzfassung. Es gibt keine Aufbaustufen.

**Was zu sehen ist.** Oben steht der Titel „Thema 1: KI-Inferenz im Moderationskompass“, darunter der Untertitel „Release 1.3 im Labor: App-Host, zweiter Host und private Inferenz unter Last“. In der Mitte stehen zwei Namensspalten. Unter jedem Namen zeigen farbige Etiketten, welche Aufträge die Person bearbeitet hat: Niklas Schneider 1A und 1B (Schritte 3–4), Jonas Weirauch 1C und 1B (Schritte 1–2). Die Farben ziehen sich durch das ganze Deck: Blau steht für 1A, Petrol für 1C, Bernstein für 1B. Unter den Namen steht im Repo nur der Vermerk „Matrikelnummer in der Abgabefassung“. Die echten Nummern setzt erst das Skript `abgabe/jonas/abgabe-lokal.mjs` in eine nicht versionierte Kopie ein. Unten folgen Kurs (DSCC0127, Cloud Computing), Hochschule (IU Internationale Hochschule), Prüfer und Datum (24.11.2026). Die Fußzeile trägt den Kurzbeleg „arsnova.eu-Projektteam, 2026b, Abschn. 4.3“. Das ist das Prüfungsdokument `docs/didaktik/CLOUD-COMPUTING-REFERAT-PRUEFUNG.md` auf Commit `a19ca70f`, Abschnitt 4.3 (Thema 1).

**Warum die Folie zählt.** Sie legt den Gegenstand fest: Es geht nicht um KI allgemein, sondern um die Inferenz für eine Funktion von arsnova.eu, den Moderationskompass. Der Untertitel nennt schon die drei Orte, die das ganze Referat verfolgt: den App-Host, den zweiten Host und die private Inferenz. Die gemeinsame Leitfrage (Folie G0) fragt, wie gut die Architektur diese Teile unter Last trennt. Die Etiketten zeigen, dass jede Person eine eigene Teilfrage durch den ganzen Argumentationsgang verfolgt. Das verlangt das Prüfungsdokument; laut `00-rahmen-und-pruefung.md` wird jede Person einzeln bewertet.

**Zahlen auf der Folie.** Es gibt keine Messwerte. „DSCC0127“ ist die Kursnummer, „4.3“ der Abschnitt des Prüfungsdokuments, „24.11.2026“ der Prüfungstermin nach Angabe der Gruppe (Quelle der Folie in `abgabe/jonas/folien.mjs`, Stand 2026-11-16). „1.3“ ist die Release-Nummer aus der Aufgabenstellung.

**Was die Folie nicht behauptet.** „Release 1.3 im Labor“ heißt nicht, dass genau der Tag `v1.3.0` gemessen wurde. Gemessen wurde die Architektur von Release 1.3, aber auf Code nach v1.4.0: 1B auf Fork-`main` `a19ca70f` (v1.4.0-184), 1C im Nachlauf auf `def56700` (v1.4.0-14), 1A ebenfalls auf `a19ca70f`. Grund ist die Bitte des Prüfers, Fork und Clone vor der Untersuchung zu aktualisieren (ADR 1B-001, ADR 1C-001). „Unter Last“ heißt Laborlast, keine Produktion.

## Begriffe

- **arsnova.eu:** Eine Open-Source-Webanwendung für Live-Interaktion in Lehrveranstaltungen, etwa Quiz, Fragen aus dem Publikum (Q&A) und Stimmungsabfragen. Teilnehmende brauchen kein Konto. Das Referat untersucht einen Teil dieser App.
- **Moderationskompass:** Eine Ansicht für die Lehrperson. Sie zeigt Hinweiskarten, die aus den Live-Signalen der Veranstaltung abgeleitet werden. Der Kern arbeitet mit festen Regeln und ist ohne KI nutzbar; KI-Funktionen wie die Q&A-Zusammenfassung sind Zusätze.
- **KI-Inferenz:** Das Ausführen eines fertig trainierten Sprachmodells, um eine Antwort zu erzeugen. Hier rechnet ein kleines Modell (Qwen3-4B) eine Zusammenfassung der Q&A-Fragen. Training kommt im Referat nicht vor.
- **Private Inferenz:** Das Modell läuft auf einem eigenen Server, nicht bei einem Cloud-Anbieter. Die Fragen der Teilnehmenden verlassen so den eigenen Betrieb nicht.
- **Release 1.3:** Eine benannte Version von arsnova.eu, festgehalten als Git-Tag `v1.3.0`. Die Aufgabenstellung nimmt diese Version als Ausgangsbasis. Gemessen wurde später Code nach v1.4.0.
- **App-Host:** Der Server, auf dem die eigentliche Anwendung läuft: Backend, Datenbank PostgreSQL und Zwischenspeicher Redis. Er bedient alle Live-Aktionen der Teilnehmenden.
- **Zweiter Host:** Ein getrennter, privater Server nur für das Sprachmodell. So sieht es die Architekturentscheidung ADR-0035 von arsnova.eu vor.
- **Labor:** Ein nachgebauter, abgeschotteter Aufbau auf eigenen Rechnern. Versuche laufen nur dort, nie gegen die echte Produktion.
- **Auftrag 1A, 1B, 1C:** Die drei Gruppenaufträge zu Thema 1 im Prüfungsdokument. 1A fragt nach der Reserve des App-Hosts, 1B nach dem zweiten Host, 1C nach dem Kontextpfad bis zur Inferenz.
- **Kurzbeleg:** Die kurze Quellenangabe in der Fußzeile, etwa „(arsnova.eu-Projektteam, 2026b, Abschn. 4.3)“. Sie verweist auf einen Eintrag im Literaturverzeichnis (Folien J16 und NL).

## Fragen

### Warum steht „Release 1.3“ im Titel, wenn Sie Code nach v1.4.0 gemessen haben?

Die Aufgabenstellung fragt nach der Architektur von Release 1.3, deshalb steht sie im Titel. Der Prüfer hat verlangt, Fork und Clone vor der Untersuchung zu aktualisieren. Deshalb misst 1B den Fork-`main` `a19ca70f` und 1C im Nachlauf `def56700`, beide nach v1.4.0. Die Topologie mit zweitem Host ist dieselbe. Dass sich zentrale Werte zwischen `v1.3.0` und dem aktuellen Stand unterscheiden, steht in ADR 1C-001 (verworfene Alternative „v1.3.0 als Baseline“); den gemessenen Stand nennen wir als Gültigkeitsgrenze. Davon getrennt sind die Abweichungen des Laboraufbaus vom Release, etwa der kalibrierte Timeout oder 4 statt 8 CPUs für die Runtime; sie stehen in ADR 1B-005.

### Wer hat was gemacht?

Die Aufteilung ist am 2026-10-23 festgelegt und steht in `01-aufteilung.md`. Niklas hat die Rolle „Ressourcen und Isolation“: Auftrag 1A vollständig und 1B Schritte 3–4. Jonas hat die Rolle „Pfad und Verträge“: Auftrag 1C vollständig und 1B Schritte 1–2. Jede Person hat eine eigene Nachweiskette mit Hypothese, Baselinelauf, Störung, Befund und Entscheidung.

### Warum haben Sie nicht in Produktion gemessen?

Das Prüfungsdokument erlaubt Versuche nur in einer isolierten Laborinstanz, nie gegen Produktion, und nur mit synthetischen oder freigegebenen Daten. Wir haben deshalb Labore auf eigenen Rechnern gebaut. Der Preis ist eine Gültigkeitsgrenze: Zeiten gelten nur je Rechner und Commit.

### Was heißt „unter Last“ bei Ihnen?

In 1A ist es eine Beitrittswelle mit 500 geplanten Teilnehmenden über die ersten 90 Sekunden, erzeugt mit einem Lastgenerator. Das belegt keine 500 dauerhaft aktiven Clients. In 1B Schritte 3–4 läuft dieselbe Art Live-Last neben gestörter Inferenz. „Reale Last“ gibt es bei uns nur als Labormodell; das sagt Niklas auf der nächsten Folie selbst.

### Warum KI-Inferenz in einer Lehr-App?

Lehrende sehen in einer großen Veranstaltung viele Fragen auf einmal. Die Q&A-Zusammenfassung soll sie in wenigen Aussagen bündeln. Sie ist ein optionaler Zusatz; der Kompass selbst arbeitet regelbasiert. Genau deshalb fragt das Thema, ob die schwere Inferenz den Live-Betrieb stören darf.

## Übergang

Niklas: „Weiter zum Fahrplan.“ Dann folgt G0 mit der Leitfrage und den vier Teilen des Vortrags.
