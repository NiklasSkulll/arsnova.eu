// Literaturverzeichnis für Niklas' Teil (1A, 1B Schritte 3–4) nach dem IU-Zitierleitfaden (ZL). Dieselben
// Schlüssel nutzt Niklas' Handout in PaperLab (main.bib); die Liste der Schlüssel steht in
// literatur-niklas.md des Teams. Geteilte Einträge kommen wörtlich aus Jonas' geprüfter Liste
// (literatur.mjs), damit beide Verzeichnisse übereinstimmen.
//
// Geprüft 2026-11-16:
// - heo2024: Kernel-Doku in der Fassung von Linux 6.12 (2024), geprüft 2026-11-16 auf
//   https://www.kernel.org/doc/html/v6.12/admin-guide/cgroup-v2.html: Titel „Control Group v2“, „Author: Tejun
//   Heo“; Abschnitte „CPU Interface Files“ (cpu.max „The maximum bandwidth limit“, cpu.stat nr_throttled) und
//   „Memory Interface Files“ (memory.peak). Früher heo2015 mit „Date: October, 2015“ aus dem Dokumentkopf: Der
//   CPU-Controller kam erst mit Linux 4.15 (2018) in cgroup v2, die zitierten Stellen fehlen in der Fassung von
//   2015. Deshalb die gelesene, versionierte Fassung.
// - nosek2018: Crossref 10.1073/pnas.1708274114 (4 Autoren, PNAS 115(11), 2600–2606); Volltext PMC5856500,
//   Abstract S. 2600: „Preregistration distinguishes analyses and outcomes that result from predictions from
//   those that result from postdictions.“
// - schneider2026: eigene Arbeit als ein Eintrag (wie weirauch2026c bei Jonas, ZL S. 31 Fn. 11); die
//   Fundstelle (Vertrag, Reihe, Datei) steht im Kurzbeleg. URL gilt nach dem Merge auf main des Forks.

import { LITERATUR as JONAS } from '../jonas/literatur.mjs';

const GH_FORK = 'https://github.com/NiklasSkulll/arsnova.eu/tree';

const geteilt = (schluessel) => {
  const e = JONAS.find((x) => x.schluessel === schluessel);
  if (!e) throw new Error(`literatur-1a: ${schluessel} fehlt in Jonas' Liste`);
  return e;
};

/** Alphabetisch nach ZL; `kurz` ist die Autor-Jahr-Angabe des Kurzbelegs. */
export const LITERATUR_1A = [
  geteilt('arsnova2026adr0035'),
  geteilt('arsnova2026pruefung'),
  geteilt('dean2013'),
  {
    schluessel: 'heo2024',
    kurz: 'Heo, 2024',
    voll: 'Heo, T. (2024). <i>Control Group v2</i> (Linux 6.12). The Linux Kernel Documentation. https://www.kernel.org/doc/html/v6.12/admin-guide/cgroup-v2.html',
  },
  {
    schluessel: 'nosek2018',
    kurz: 'Nosek et al., 2018',
    voll: 'Nosek, B. A., Ebersole, C. R., DeHaven, A. C. & Mellor, D. T. (2018). The preregistration revolution. <i>Proceedings of the National Academy of Sciences, 115</i>(11), 2600–2606. https://doi.org/10.1073/pnas.1708274114',
  },
  geteilt('papadopoulos2021'),
  {
    schluessel: 'schneider2026',
    kurz: 'Schneider, 2026',
    voll: `Schneider, N. (2026). <i>Referat Thema 1, Aufträge 1A und 1B</i> [Referatsausarbeitung: Versuchsvertrag, Messreihen, Auswertung]. GitHub. ${GH_FORK}/main/docs/referat-thema-1`,
  },
  geteilt('ulrich2016'),
  // Jonas' Messung (Inferenzdauer im Labor, N10); geteilt wie die übrigen Einträge.
  geteilt('weirauch2026c'),
];

const NACH_SCHLUESSEL = new Map(LITERATUR_1A.map((e) => [e.schluessel, e]));

/** Kurzbeleg „(Autor, Jahr, Stelle)“ wie in Jonas' Teil. */
export function kurzbeleg1A(schluessel, stelle) {
  const e = NACH_SCHLUESSEL.get(schluessel);
  if (!e) throw new Error(`Literatur 1A: ${schluessel} fehlt`);
  return `(${e.kurz}${stelle ? `, ${stelle}` : ''})`;
}
