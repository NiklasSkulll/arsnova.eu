## Verstehen

GK erklärt in einem Bild, was arsnova.eu ist und wo die drei untersuchten Bausteine liegen. Niklas spricht sie, Redezeit 50 s, kumuliert 1:35; sie gehört zur Kurzfassung. Die Grafik baut sich in drei Stufen auf (`[Weiter]` im Sprechtext).

**Was zu sehen ist.** Oben steht ein Satz: arsnova.eu ist eine Open-Source-App (MIT) für Live-Interaktion in der Lehre, ohne Pflichtkonten; Lehrende sehen im Moderationskompass Hinweiskarten aus den Live-Signalen. Darunter steht ein Systembild von links nach rechts. Links der Hörsaal mit „≥ 500 Clients zugleich, auch hinter einem gemeinsamen NAT“ und die Lehrperson. In der Mitte der App-Host mit dem Merksatz „Live-Pfad wartet nie auf Analyse“. Er enthält die Live-App (Quiz, Q&A, Blitzlicht; Backend, PostgreSQL, Redis), den Moderationskompass (Hinweiskarten, regelbasiert), den spaCy-Sidecar (glättet die Wortwolke, optional, mit Ersatz) und den Kontextpfad (baut den Q&A-Kontext für die Zusammenfassung). Rechts der zweite Host mit der Inferenz (llama-server, privat, Modell auf der CPU), verbunden über „privates Netz, Token“.

**Aufbaustufen.** Stufe 1 markiert den spaCy-Sidecar mit dem Etikett 1A (Niklas). Stufe 2 markiert Kontextpfad und zweiten Host mit 1C und 1B 1–2 (Jonas). Stufe 3 markiert den zweiten Host mit 1B 3–4 und den Störungen „gestoppt, stumm, zu spät“ (Niklas). Oben links zeigt ab den nächsten Folien eine kleine Wegkarte, an welcher Stelle dieses Bildes der Vortrag gerade ist.

**Warum die Folie zählt.** Die Leitfrage fragt nach der Trennung von Anwendung, Kontextaufbau und Inferenz. Das Bild zeigt diese drei Teile an ihren Orten. Der Kern, der Kompass, braucht keine KI. Alles, was das Referat untersucht, ist optionaler Zusatz. Deshalb ist die Regel klar: Der Zusatz darf die Live-Aktionen nicht bremsen.

**Herkunft der Zahl.** „≥ 500“ kommt aus der `AGENTS.md` im Wurzelverzeichnis des Repos auf Commit `a19ca70f` (v1.4.0-184): Produktion muss mindestens 500 gleichzeitige Hörsaal-Clients tragen, auch hinter gemeinsamem NAT. Im Folien-Code steht der Wert als `FESTWERTE.liveClients` in `abgabe/jonas/folien.mjs`. Es ist eine Anforderung, kein Messwert. Lizenz MIT und „keine Pflichtkonten“ stehen in der `README.md` desselben Commits; „regelbasiert, ohne KI nutzbar“ in `docs/features/moderation-compass.md` und im Prüfungsdokument, Abschnitt 4.1.1 (Baustein 8.9a). Die Lage der LLM-Rolle auf einem zweiten privaten Host stammt aus ADR-0035, Abschnitt 2.1 (Kurzbeleg „arsnova.eu-Projektteam, 2026a“).

**Was die Folie nicht behauptet.** Sie zeigt die Soll-Architektur, kein Messergebnis. Dass der Live-Pfad nie auf Analyse wartet, ist eine Leitplanke aus dem Prüfungsdokument; ob sie hält, prüfen die folgenden Teile. Wir haben nicht 500 dauerhaft verbundene Clients gemessen (1A-Experimentvertrag). Weitere optionale Dienste wie Encoder und Q&A-Klassifikation (8.9b) zeigt das Bild nicht; sie waren in 1A ausgeschaltet.

## Begriffe

- **Open Source (MIT):** Der Quellcode ist öffentlich. Die MIT-Lizenz erlaubt fast jede Nutzung und Änderung, solange der Lizenzhinweis erhalten bleibt.
- **Quiz, Q&A, Blitzlicht:** Die Live-Funktionen von arsnova.eu. Im Quiz stimmen Teilnehmende über Fragen ab. In Q&A reichen sie eigene Fragen ein. Das Blitzlicht ist eine schnelle Stimmungs- oder Tempoabfrage.
- **Client:** Ein Endgerät, etwa ein Smartphone, das mit dem Server verbunden ist. Jede teilnehmende Person ist mindestens ein Client.
- **NAT (Network Address Translation):** Viele Geräte teilen sich nach außen eine öffentliche IP-Adresse, etwa im WLAN der Hochschule. Der Server sieht dann viele Nutzer unter einer Adresse. Deshalb darf eine Ratenbegrenzung nicht pro IP sperren.
- **Moderationskompass:** Eine Ansicht nur für die Lehrperson. Sie zeigt Hinweiskarten aus den Live-Signalen, etwa „viele offene Fragen“. Die Karten folgen festen Regeln und brauchen keine KI.
- **Sidecar:** Ein kleiner Zusatzdienst in einem eigenen Container neben der Hauptanwendung. Fällt er aus, läuft die App weiter.
- **spaCy:** Eine Programmbibliothek für Sprachverarbeitung. Hier führt sie Wörter der Wortwolke auf ihre Grundform zurück, etwa „Fragen“ und „Frage“. Das untersucht Auftrag 1A.
- **Ersatz (Fallback):** Was die App liefert, wenn ein optionaler Dienst nicht rechtzeitig antwortet. Bei spaCy ist es die einfache Wortwolke, bei der Zusammenfassung eine extraktive Zusammenfassung ohne Modell.
- **Kontextpfad:** Der Code, der aus den Daten einer Session den Text für das Sprachmodell zusammenstellt, prüft und übergibt. Ihn untersucht Auftrag 1C.
- **llama-server:** Das Serverprogramm aus dem Projekt llama.cpp. Es lädt ein Sprachmodell und beantwortet Anfragen über HTTP. arsnova.eu nutzt es laut ADR-0035 als private Runtime.
- **Token (hier):** Ein geheimer Schlüssel, den die App bei jeder Anfrage an den zweiten Host mitschickt. Ohne passenden Token lehnt die Runtime ab.
- **PostgreSQL, Redis:** PostgreSQL ist die Datenbank der App. Redis ist ein schneller Zwischenspeicher, etwa für Live-Zustände.

## Fragen

### Haben Sie 500 gleichzeitige Clients getestet?

Nicht als dauerhaft verbundene Clients. In 1A gab es eine Beitrittswelle mit 500 geplanten Teilnehmenden über die ersten 90 Sekunden, dazu Quizstimmen, Tempostimmen und 100 Q&A-Einreichungen. Der Experimentvertrag sagt ausdrücklich, dass das keine 500 durchgehend aktiven Clients belegt. Die Zahl 500 auf der Folie ist die Anforderung aus dem Projekt.

### Warum ist die KI nur ein Zusatz?

So ist es im Projekt angelegt: Der Kompass arbeitet regelbasiert und quellenbelegt, ohne Inferenz. KI-Funktionen wie die Q&A-Zusammenfassung ergänzen ihn. Das Prüfungsdokument verlangt, dass Beitritt, Abstimmung und Q&A weder auf Modelle noch auf einen aufwendigen Kontextaufbau warten.

### Warum läuft das Sprachmodell auf einem zweiten Host?

Das legt ADR-0035 fest. Der Live-Host bleibt bei 8 vCPU und 16 GB RAM mit App, PostgreSQL und Redis. Ein zusätzliches Sprachmodell daneben ist laut Prüfungsdokument keine zulässige Produktionsvariante. Ob sich der zweite Host lohnt, prüft Niklas in 1B, Schritte 3–4.

### Warum gerade diese drei Bausteine?

Sie decken die drei Teile der Leitfrage ab. spaCy ist die optionale Analyse auf dem App-Host (1A). Der Kontextpfad ist der Kontextaufbau (1C). Die Inferenz auf dem zweiten Host ist die private Inferenz (1B). Das Prüfungsdokument nennt dafür die Bausteine 1.14a/b, 8.9c und 8.9d.

### Warum ist das „Cloud Computing“, wenn alles auf eigenen Servern läuft?

Die Frage ist berechtigt. Wir ordnen das auf Folie J13b nach der NIST-Definition ein: fest bereitgestellte Maschinen, Ressourcenbündelung ja, schnelle Elastizität nein. Die zweite Rolle ist ein getrennter Fehler- und Ressourcenbereich, ein Bulkhead, keine elastische Ressource (Fragenkatalog Jonas, F50).

## Übergang

Niklas: „Der kleine Weg oben links zeigt später, wo wir gerade sind.“ Dann folgt N1, der Einstieg in 1A auf dem App-Host.
