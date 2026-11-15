// Literaturverzeichnis für Niklas' Teil 1A nach dem IU-Zitierleitfaden (ZL), ENTWURF zur Abstimmung.
// Gemeinsame Einträge kommen aus Jonas' geprüfter Liste (literatur.mjs); neu sind Niklas' eigene Arbeit
// und die Kernel-Doku zu cgroup v2 (Kopfzeile geprüft: „Date: October, 2015“, „Author: Tejun Heo“).
// Jahresbuchstaben: Schneider 2026a = Messreihe und Auswertung, 2026b = Versuchsvertrag (Titel alphabetisch).

import { LITERATUR as JONAS } from '../jonas/literatur.mjs';

const GH_FORK = 'https://github.com/NiklasSkulll/arsnova.eu';

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
    schluessel: 'heo2015',
    kurz: 'Heo, 2015',
    voll: 'Heo, T. (2015, Oktober). <i>Control Group v2</i>. The Linux Kernel Documentation. https://docs.kernel.org/admin-guide/cgroup-v2.html',
  },
  geteilt('papadopoulos2021'),
  {
    schluessel: 'schneider2026a',
    kurz: 'Schneider, 2026a',
    voll: `Schneider, N. (2026a). <i>Auftrag 1A: Messreihe und Auswertung zur Ressourcenisolation auf dem Anwendungshost</i> [Eigene Messung mit Rohdaten]. GitHub. ${GH_FORK}/tree/main/docs/referat-thema-1/evidenz/1A`,
  },
  {
    schluessel: 'schneider2026b',
    kurz: 'Schneider, 2026b',
    voll: `Schneider, N. (2026b, 7. November). <i>1A-Versuchsvertrag: Ressourcenisolation auf dem Anwendungshost</i> (Version 2) [Vorab festgelegte Hypothesen und Schwellen]. GitHub. ${GH_FORK}/blob/main/docs/referat-thema-1/1A-experiment-contract.md`,
  },
  geteilt('ulrich2016'),
];

const NACH_SCHLUESSEL = new Map(LITERATUR_1A.map((e) => [e.schluessel, e]));

/** Kurzbeleg „(Autor, Jahr, Stelle)“ wie in Jonas' Teil. */
export function kurzbeleg1A(schluessel, stelle) {
  const e = NACH_SCHLUESSEL.get(schluessel);
  if (!e) throw new Error(`Literatur 1A: ${schluessel} fehlt`);
  return `(${e.kurz}${stelle ? `, ${stelle}` : ''})`;
}
