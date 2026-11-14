# A1-Auswertung der vollständigen Versuchsreihe

Baseline: `8f91e0417bc5aace461c3644a0b6b26c9284035b`; fünf gepaarte Blöcke, 25 Läufe.

**H1: nicht bestätigt**; 4 von 20 Aktionsvergleichen verfehlen mindestens eine Regel.
**H2: nicht bestätigt**; 6 von 40 Aktionsvergleichen verfehlen mindestens eine Regel.

Alle fünf Wiederholungen müssen die Regeln einhalten. Nicht bestandene Vergleiche werden weder entfernt noch gemittelt.

## Live-Perzentile je Lauf

| Variante | Block | Beitritt p95 ms | Quiz p95 ms | Q&A p95 ms | Tempo p95 ms | Fehler / geplante Aktionen |
| -------- | ----- | --------------- | ----------- | ---------- | ------------ | -------------------------- |
| V0       | 1     | 51.50           | 44.98       | 18.60      | 11.82        | 0 / 1600                   |
| V0       | 2     | 54.04           | 45.27       | 18.36      | 13.09        | 0 / 1600                   |
| V0       | 3     | 52.06           | 47.01       | 23.42      | 11.01        | 0 / 1600                   |
| V0       | 4     | 53.51           | 46.63       | 23.71      | 11.90        | 0 / 1600                   |
| V0       | 5     | 53.61           | 48.07       | 22.42      | 12.44        | 0 / 1600                   |
| V1       | 1     | 24.57           | 21.52       | 26.04      | 8.93         | 0 / 1600                   |
| V1       | 2     | 54.83           | 45.55       | 25.79      | 12.46        | 0 / 1600                   |
| V1       | 3     | 53.98           | 45.94       | 21.73      | 13.04        | 0 / 1600                   |
| V1       | 4     | 56.33           | 43.91       | 25.89      | 12.94        | 0 / 1600                   |
| V1       | 5     | 53.37           | 43.01       | 21.03      | 12.82        | 0 / 1600                   |
| V2       | 1     | 52.38           | 41.84       | 23.28      | 12.17        | 0 / 1600                   |
| V2       | 2     | 51.95           | 41.72       | 18.53      | 12.47        | 0 / 1600                   |
| V2       | 3     | 50.08           | 44.59       | 18.60      | 12.35        | 0 / 1600                   |
| V2       | 4     | 53.45           | 44.58       | 26.57      | 12.51        | 0 / 1600                   |
| V2       | 5     | 52.74           | 45.50       | 26.53      | 12.12        | 0 / 1600                   |
| V3       | 1     | 51.45           | 40.99       | 20.75      | 12.22        | 0 / 1600                   |
| V3       | 2     | 48.73           | 42.40       | 21.57      | 12.62        | 0 / 1600                   |
| V3       | 3     | 48.60           | 39.66       | 19.58      | 11.85        | 0 / 1600                   |
| V3       | 4     | 47.40           | 37.61       | 19.98      | 11.30        | 0 / 1600                   |
| V3       | 5     | 49.10           | 40.02       | 18.63      | 11.97        | 0 / 1600                   |
| V4       | 1     | 51.89           | 42.98       | 21.88      | 11.75        | 0 / 1600                   |
| V4       | 2     | 50.46           | 45.71       | 25.49      | 13.01        | 0 / 1600                   |
| V4       | 3     | 51.16           | 44.99       | 23.53      | 12.33        | 0 / 1600                   |
| V4       | 4     | 46.18           | 40.49       | 19.53      | 11.92        | 0 / 1600                   |
| V4       | 5     | 53.69           | 47.07       | 20.29      | 13.03        | 0 / 1600                   |

## Gepaarte Aktionsvergleiche

| Block | Vergleich | Aktion     | Basis p95 ms | Kandidat p95 ms | Änderung ms | Änderung relativ | ≤ 10 %        | ≤ 50 ms | Gesamt        |
| ----- | --------- | ---------- | ------------ | --------------- | ----------- | ---------------- | ------------- | ------- | ------------- |
| 1     | V0 → V1   | join       | 51.50        | 24.57           | -26.92      | -52.28 %         | erfüllt       | erfüllt | erfüllt       |
| 1     | V0 → V1   | vote       | 44.98        | 21.52           | -23.47      | -52.17 %         | erfüllt       | erfüllt | erfüllt       |
| 1     | V0 → V1   | qaSubmit   | 18.60        | 26.04           | 7.44        | 39.98 %          | nicht erfüllt | erfüllt | nicht erfüllt |
| 1     | V0 → V1   | blitzlicht | 11.82        | 8.93            | -2.89       | -24.47 %         | erfüllt       | erfüllt | erfüllt       |
| 1     | V1 → V2   | join       | 24.57        | 52.38           | 27.80       | 113.15 %         | nicht erfüllt | erfüllt | nicht erfüllt |
| 1     | V1 → V2   | vote       | 21.52        | 41.84           | 20.32       | 94.44 %          | nicht erfüllt | erfüllt | nicht erfüllt |
| 1     | V1 → V2   | qaSubmit   | 26.04        | 23.28           | -2.75       | -10.57 %         | erfüllt       | erfüllt | erfüllt       |
| 1     | V1 → V2   | blitzlicht | 8.93         | 12.17           | 3.24        | 36.23 %          | nicht erfüllt | erfüllt | nicht erfüllt |
| 1     | V1 → V3   | join       | 24.57        | 51.45           | 26.88       | 109.37 %         | nicht erfüllt | erfüllt | nicht erfüllt |
| 1     | V1 → V3   | vote       | 21.52        | 40.99           | 19.47       | 90.51 %          | nicht erfüllt | erfüllt | nicht erfüllt |
| 1     | V1 → V3   | qaSubmit   | 26.04        | 20.75           | -5.29       | -20.33 %         | erfüllt       | erfüllt | erfüllt       |
| 1     | V1 → V3   | blitzlicht | 8.93         | 12.22           | 3.29        | 36.85 %          | nicht erfüllt | erfüllt | nicht erfüllt |
| 1     | V1 → V4   | join       | 24.57        | 51.89           | 27.32       | 111.16 %         | nicht erfüllt | erfüllt | nicht erfüllt |
| 1     | V1 → V4   | vote       | 21.52        | 42.98           | 21.46       | 99.73 %          | nicht erfüllt | erfüllt | nicht erfüllt |
| 1     | V1 → V4   | qaSubmit   | 26.04        | 21.88           | -4.15       | -15.96 %         | erfüllt       | erfüllt | erfüllt       |
| 1     | V1 → V4   | blitzlicht | 8.93         | 11.75           | 2.82        | 31.59 %          | nicht erfüllt | erfüllt | nicht erfüllt |
| 2     | V0 → V1   | join       | 54.04        | 54.83           | 0.79        | 1.46 %           | erfüllt       | erfüllt | erfüllt       |
| 2     | V0 → V1   | vote       | 45.27        | 45.55           | 0.28        | 0.61 %           | erfüllt       | erfüllt | erfüllt       |
| 2     | V0 → V1   | qaSubmit   | 18.36        | 25.79           | 7.43        | 40.46 %          | nicht erfüllt | erfüllt | nicht erfüllt |
| 2     | V0 → V1   | blitzlicht | 13.09        | 12.46           | -0.63       | -4.82 %          | erfüllt       | erfüllt | erfüllt       |
| 2     | V1 → V2   | join       | 54.83        | 51.95           | -2.88       | -5.26 %          | erfüllt       | erfüllt | erfüllt       |
| 2     | V1 → V2   | vote       | 45.55        | 41.72           | -3.83       | -8.40 %          | erfüllt       | erfüllt | erfüllt       |
| 2     | V1 → V2   | qaSubmit   | 25.79        | 18.53           | -7.26       | -28.15 %         | erfüllt       | erfüllt | erfüllt       |
| 2     | V1 → V2   | blitzlicht | 12.46        | 12.47           | 0.02        | 0.13 %           | erfüllt       | erfüllt | erfüllt       |
| 2     | V1 → V3   | join       | 54.83        | 48.73           | -6.10       | -11.12 %         | erfüllt       | erfüllt | erfüllt       |
| 2     | V1 → V3   | vote       | 45.55        | 42.40           | -3.15       | -6.92 %          | erfüllt       | erfüllt | erfüllt       |
| 2     | V1 → V3   | qaSubmit   | 25.79        | 21.57           | -4.22       | -16.35 %         | erfüllt       | erfüllt | erfüllt       |
| 2     | V1 → V3   | blitzlicht | 12.46        | 12.62           | 0.17        | 1.34 %           | erfüllt       | erfüllt | erfüllt       |
| 2     | V1 → V4   | join       | 54.83        | 50.46           | -4.37       | -7.97 %          | erfüllt       | erfüllt | erfüllt       |
| 2     | V1 → V4   | vote       | 45.55        | 45.71           | 0.16        | 0.36 %           | erfüllt       | erfüllt | erfüllt       |
| 2     | V1 → V4   | qaSubmit   | 25.79        | 25.49           | -0.30       | -1.17 %          | erfüllt       | erfüllt | erfüllt       |
| 2     | V1 → V4   | blitzlicht | 12.46        | 13.01           | 0.55        | 4.42 %           | erfüllt       | erfüllt | erfüllt       |
| 3     | V0 → V1   | join       | 52.06        | 53.98           | 1.93        | 3.70 %           | erfüllt       | erfüllt | erfüllt       |
| 3     | V0 → V1   | vote       | 47.01        | 45.94           | -1.07       | -2.28 %          | erfüllt       | erfüllt | erfüllt       |
| 3     | V0 → V1   | qaSubmit   | 23.42        | 21.73           | -1.70       | -7.24 %          | erfüllt       | erfüllt | erfüllt       |
| 3     | V0 → V1   | blitzlicht | 11.01        | 13.04           | 2.03        | 18.40 %          | nicht erfüllt | erfüllt | nicht erfüllt |
| 3     | V1 → V2   | join       | 53.98        | 50.08           | -3.91       | -7.24 %          | erfüllt       | erfüllt | erfüllt       |
| 3     | V1 → V2   | vote       | 45.94        | 44.59           | -1.35       | -2.93 %          | erfüllt       | erfüllt | erfüllt       |
| 3     | V1 → V2   | qaSubmit   | 21.73        | 18.60           | -3.12       | -14.38 %         | erfüllt       | erfüllt | erfüllt       |
| 3     | V1 → V2   | blitzlicht | 13.04        | 12.35           | -0.69       | -5.30 %          | erfüllt       | erfüllt | erfüllt       |
| 3     | V1 → V3   | join       | 53.98        | 48.60           | -5.38       | -9.97 %          | erfüllt       | erfüllt | erfüllt       |
| 3     | V1 → V3   | vote       | 45.94        | 39.66           | -6.28       | -13.67 %         | erfüllt       | erfüllt | erfüllt       |
| 3     | V1 → V3   | qaSubmit   | 21.73        | 19.58           | -2.15       | -9.88 %          | erfüllt       | erfüllt | erfüllt       |
| 3     | V1 → V3   | blitzlicht | 13.04        | 11.85           | -1.18       | -9.08 %          | erfüllt       | erfüllt | erfüllt       |
| 3     | V1 → V4   | join       | 53.98        | 51.16           | -2.83       | -5.24 %          | erfüllt       | erfüllt | erfüllt       |
| 3     | V1 → V4   | vote       | 45.94        | 44.99           | -0.95       | -2.07 %          | erfüllt       | erfüllt | erfüllt       |
| 3     | V1 → V4   | qaSubmit   | 21.73        | 23.53           | 1.80        | 8.29 %           | erfüllt       | erfüllt | erfüllt       |
| 3     | V1 → V4   | blitzlicht | 13.04        | 12.33           | -0.71       | -5.41 %          | erfüllt       | erfüllt | erfüllt       |
| 4     | V0 → V1   | join       | 53.51        | 56.33           | 2.82        | 5.27 %           | erfüllt       | erfüllt | erfüllt       |
| 4     | V0 → V1   | vote       | 46.63        | 43.91           | -2.72       | -5.82 %          | erfüllt       | erfüllt | erfüllt       |
| 4     | V0 → V1   | qaSubmit   | 23.71        | 25.89           | 2.19        | 9.22 %           | erfüllt       | erfüllt | erfüllt       |
| 4     | V0 → V1   | blitzlicht | 11.90        | 12.94           | 1.04        | 8.73 %           | erfüllt       | erfüllt | erfüllt       |
| 4     | V1 → V2   | join       | 56.33        | 53.45           | -2.88       | -5.12 %          | erfüllt       | erfüllt | erfüllt       |
| 4     | V1 → V2   | vote       | 43.91        | 44.58           | 0.67        | 1.53 %           | erfüllt       | erfüllt | erfüllt       |
| 4     | V1 → V2   | qaSubmit   | 25.89        | 26.57           | 0.68        | 2.63 %           | erfüllt       | erfüllt | erfüllt       |
| 4     | V1 → V2   | blitzlicht | 12.94        | 12.51           | -0.43       | -3.33 %          | erfüllt       | erfüllt | erfüllt       |
| 4     | V1 → V3   | join       | 56.33        | 47.40           | -8.93       | -15.86 %         | erfüllt       | erfüllt | erfüllt       |
| 4     | V1 → V3   | vote       | 43.91        | 37.61           | -6.30       | -14.35 %         | erfüllt       | erfüllt | erfüllt       |
| 4     | V1 → V3   | qaSubmit   | 25.89        | 19.98           | -5.91       | -22.83 %         | erfüllt       | erfüllt | erfüllt       |
| 4     | V1 → V3   | blitzlicht | 12.94        | 11.30           | -1.64       | -12.66 %         | erfüllt       | erfüllt | erfüllt       |
| 4     | V1 → V4   | join       | 56.33        | 46.18           | -10.16      | -18.03 %         | erfüllt       | erfüllt | erfüllt       |
| 4     | V1 → V4   | vote       | 43.91        | 40.49           | -3.43       | -7.80 %          | erfüllt       | erfüllt | erfüllt       |
| 4     | V1 → V4   | qaSubmit   | 25.89        | 19.53           | -6.36       | -24.57 %         | erfüllt       | erfüllt | erfüllt       |
| 4     | V1 → V4   | blitzlicht | 12.94        | 11.92           | -1.02       | -7.88 %          | erfüllt       | erfüllt | erfüllt       |
| 5     | V0 → V1   | join       | 53.61        | 53.37           | -0.25       | -0.46 %          | erfüllt       | erfüllt | erfüllt       |
| 5     | V0 → V1   | vote       | 48.07        | 43.01           | -5.07       | -10.54 %         | erfüllt       | erfüllt | erfüllt       |
| 5     | V0 → V1   | qaSubmit   | 22.42        | 21.03           | -1.40       | -6.23 %          | erfüllt       | erfüllt | erfüllt       |
| 5     | V0 → V1   | blitzlicht | 12.44        | 12.82           | 0.38        | 3.04 %           | erfüllt       | erfüllt | erfüllt       |
| 5     | V1 → V2   | join       | 53.37        | 52.74           | -0.62       | -1.17 %          | erfüllt       | erfüllt | erfüllt       |
| 5     | V1 → V2   | vote       | 43.01        | 45.50           | 2.49        | 5.79 %           | erfüllt       | erfüllt | erfüllt       |
| 5     | V1 → V2   | qaSubmit   | 21.03        | 26.53           | 5.50        | 26.18 %          | nicht erfüllt | erfüllt | nicht erfüllt |
| 5     | V1 → V2   | blitzlicht | 12.82        | 12.12           | -0.70       | -5.44 %          | erfüllt       | erfüllt | erfüllt       |
| 5     | V1 → V3   | join       | 53.37        | 49.10           | -4.27       | -8.00 %          | erfüllt       | erfüllt | erfüllt       |
| 5     | V1 → V3   | vote       | 43.01        | 40.02           | -2.99       | -6.95 %          | erfüllt       | erfüllt | erfüllt       |
| 5     | V1 → V3   | qaSubmit   | 21.03        | 18.63           | -2.39       | -11.38 %         | erfüllt       | erfüllt | erfüllt       |
| 5     | V1 → V3   | blitzlicht | 12.82        | 11.97           | -0.84       | -6.58 %          | erfüllt       | erfüllt | erfüllt       |
| 5     | V1 → V4   | join       | 53.37        | 53.69           | 0.32        | 0.60 %           | erfüllt       | erfüllt | erfüllt       |
| 5     | V1 → V4   | vote       | 43.01        | 47.07           | 4.07        | 9.46 %           | erfüllt       | erfüllt | erfüllt       |
| 5     | V1 → V4   | qaSubmit   | 21.03        | 20.29           | -0.73       | -3.49 %          | erfüllt       | erfüllt | erfüllt       |
| 5     | V1 → V4   | blitzlicht | 12.82        | 13.03           | 0.21        | 1.64 %           | erfüllt       | erfüllt | erfüllt       |

## Analyseverfügbarkeit

| Variante | Block | Geplant | Erfolg | Fallback | Ohne Abschluss im Fenster | Unverfügbar | Erfolg p95 ms   | Fallback p95 ms |
| -------- | ----- | ------- | ------ | -------- | ------------------------- | ----------- | --------------- | --------------- |
| V1       | 1     | 150     | 0      | 150      | 0                         | 100.00 %    | nicht verfügbar | 44.88           |
| V1       | 2     | 150     | 0      | 150      | 0                         | 100.00 %    | nicht verfügbar | 41.89           |
| V1       | 3     | 150     | 0      | 150      | 0                         | 100.00 %    | nicht verfügbar | 42.57           |
| V1       | 4     | 150     | 0      | 150      | 0                         | 100.00 %    | nicht verfügbar | 39.32           |
| V1       | 5     | 150     | 0      | 150      | 0                         | 100.00 %    | nicht verfügbar | 41.11           |
| V2       | 1     | 150     | 150    | 0        | 0                         | 0.00 %      | 489.09          | nicht verfügbar |
| V2       | 2     | 150     | 150    | 0        | 0                         | 0.00 %      | 510.51          | nicht verfügbar |
| V2       | 3     | 150     | 150    | 0        | 0                         | 0.00 %      | 507.83          | nicht verfügbar |
| V2       | 4     | 150     | 150    | 0        | 0                         | 0.00 %      | 489.84          | nicht verfügbar |
| V2       | 5     | 150     | 150    | 0        | 0                         | 0.00 %      | 500.60          | nicht verfügbar |
| V3       | 1     | 150     | 150    | 0        | 0                         | 0.00 %      | 2773.94         | nicht verfügbar |
| V3       | 2     | 150     | 150    | 0        | 0                         | 0.00 %      | 2382.32         | nicht verfügbar |
| V3       | 3     | 150     | 149    | 0        | 1                         | 0.67 %      | 3123.02         | nicht verfügbar |
| V3       | 4     | 150     | 150    | 0        | 0                         | 0.00 %      | 2664.78         | nicht verfügbar |
| V3       | 5     | 150     | 150    | 0        | 0                         | 0.00 %      | 3185.24         | nicht verfügbar |
| V4       | 1     | 150     | 0      | 149      | 1                         | 100.00 %    | nicht verfügbar | 5052.59         |
| V4       | 2     | 150     | 0      | 149      | 1                         | 100.00 %    | nicht verfügbar | 5048.95         |
| V4       | 3     | 150     | 0      | 149      | 1                         | 100.00 %    | nicht verfügbar | 5054.82         |
| V4       | 4     | 150     | 0      | 149      | 1                         | 100.00 %    | nicht verfügbar | 5057.69         |
| V4       | 5     | 150     | 0      | 149      | 1                         | 100.00 %    | nicht verfügbar | 5058.46         |

## spaCy-Ressourcen im Messfenster

| Variante | Block | CPU % einer CPU | Gedrosselte Perioden | Anteil  | Abgetastetes RAM-Maximum MiB | Lebenszeit-Peak MiB | OOM-Zuwachs |
| -------- | ----- | --------------- | -------------------- | ------- | ---------------------------- | ------------------- | ----------- |
| V2       | 1     | 18.67           | 7 / 978              | 0.72 %  | 471.21                       | 480.25              | 0           |
| V2       | 2     | 19.11           | 9 / 1009             | 0.89 %  | 468.13                       | 480.89              | 0           |
| V2       | 3     | 19.01           | 7 / 1023             | 0.68 %  | 480.44                       | 480.75              | 0           |
| V2       | 4     | 18.89           | 8 / 1008             | 0.79 %  | 470.44                       | 479.87              | 0           |
| V2       | 5     | 18.98           | 9 / 1024             | 0.88 %  | 469.95                       | 480.82              | 0           |
| V3       | 1     | 23.43           | 2739 / 2930          | 93.48 % | 488.90                       | 491.94              | 0           |
| V3       | 2     | 23.27           | 2670 / 2923          | 91.34 % | 491.75                       | 493.21              | 0           |
| V3       | 3     | 23.58           | 2785 / 2931          | 95.02 % | 489.69                       | 491.14              | 0           |
| V3       | 4     | 23.37           | 2732 / 2928          | 93.31 % | 490.75                       | 491.55              | 0           |
| V3       | 5     | 24.06           | 2845 / 2953          | 96.34 % | 491.25                       | 491.69              | 0           |
| V4       | 1     | 0.52            | 0 / 143              | 0.00 %  | 780.27                       | 784.80              | 0           |
| V4       | 2     | 0.52            | 0 / 152              | 0.00 %  | 457.07                       | 463.59              | 0           |
| V4       | 3     | 0.51            | 0 / 149              | 0.00 %  | 452.34                       | 464.05              | 0           |
| V4       | 4     | 0.55            | 0 / 141              | 0.00 %  | 450.77                       | 463.76              | 0           |
| V4       | 5     | 0.52            | 0 / 151              | 0.00 %  | 450.84                       | 463.64              | 0           |

## Regeln für den Normalbetrieb

- `analysisAvailabilityPassed`: erfüllt.
- `throttlingPassed`: erfüllt.
- `memoryPassed`: erfüllt.
- `oomPassed`: erfüllt.
- `voteTargetPassed`: erfüllt.

**Aktivierung durch alle vorab festgelegten Regeln gedeckt: nein.**

Die inhaltliche Betriebsentscheidung und Grenzen stehen in der begleitenden Auswertungsdokumentation.

## Berechnung und Grenzen

Perzentile werden aus erfolgreichen Rohstichproben je Lauf neu berechnet (Nearest Rank). Relative und absolute Grenze gelten gleichzeitig und einschließlich Gleichheit; geprüft wird vor der Anzeige-Rundung. Die Abdeckung verwendet alle geplanten Aktionen.

CPU- und Drosselungswerte sind Zählerdifferenzen derselben Generation im Messfenster. Der RAM-Lebenszeit-Peak umfasst auch die Aufwärmung; er wird nicht von einem früheren Peak subtrahiert. Sämtliche Containerressourcen stehen zusätzlich in auswertung.json.

IN_FLIGHT_AT_END bleibt trotz späterem cleanup-Erfolg unverfügbar. V4-Proxyzähler umfassen die Proxy-Lebenszeit einschließlich Aufwärmung; Backend-Aufrufzähler sind kein Nachweis tatsächlich an spaCy weitergeleiteter Berechnungen.

Lastgenerator und Dienste teilen denselben WSL2-Rechner mit 16 logischen CPUs. Die Beitrittswelle belegt keine dauerhafte Parallelität, keine Browser-Renderingzeit und keine Tragfähigkeit zusätzlicher LLM-Inferenz.
