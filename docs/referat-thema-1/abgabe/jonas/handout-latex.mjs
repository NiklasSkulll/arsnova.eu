// Zahlen und Abbildungen für das LaTeX-Handout in PaperLab (Typ referat).
// Eine Quelle je Zahl: dieselben Werte wie Deck und Folien (handoutWerte über ladeFolienDaten).
// Ausgabe in <zielordner>: zahlen.tex (\newcommand je Wert), abb-weg.pdf, abb-zeit.pdf.
// Abbildungen in Arial wie der Text (Schriftregel RL S. 2); Farbe nur in Abbildungen.
//
// CLI: node handout-latex.mjs <zielordner> [--arial <ordner mit Arial282-*.ttf>]
/* global console, document, process -- Node-Skript, page.evaluate läuft im Browser */
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { ladeFolienDaten } from './folien.mjs';
import { wegSvg, zeitzerlegungSvg } from './grafik.mjs';
import { handoutWerte } from './handout.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HIER, '../..');
const ZIFFERN = [
  'Null',
  'Eins',
  'Zwei',
  'Drei',
  'Vier',
  'Fuenf',
  'Sechs',
  'Sieben',
  'Acht',
  'Neun',
];

/** Makroname aus einem Schlüssel: nur Buchstaben (TeX), Ziffern als Wort. */
export function makroName(schluessel) {
  const s = String(schluessel).replace(/\d/g, (d) => ZIFFERN[Number(d)]);
  if (!/^[A-Za-z]+$/.test(s)) throw new Error(`Schlüssel ${schluessel} ergibt keinen Makronamen`);
  return `z${s[0].toUpperCase()}${s.slice(1)}`;
}

/** Text für TeX maskieren. */
export function texEsc(text) {
  return String(text).replace(/[\\{}$&#%_^~]/g, (c) =>
    c === '\\' ? '\\textbackslash{}' : c === '^' ? '\\^{}' : c === '~' ? '\\~{}' : `\\${c}`,
  );
}

/** Alle Werte des Handouts als flaches Objekt Schlüssel → Text. */
export function handoutMakros(daten) {
  const w = handoutWerte(daten);
  const werte = { ...w.z };
  for (const [k, v] of Object.entries(w.fw)) werte[`fest${k[0].toUpperCase()}${k.slice(1)}`] = v;
  Object.assign(werte, {
    anzahl: w.n,
    nWarm: w.nWarm,
    auNr: w.au.nr,
    gateBeob: w.gateBeob,
    vorGate: w.c.fullContextVorGate.wert,
    rechner: w.P50,
    commitHaupt: w.haupt,
    commitNachtrag: w.nachtrag,
    commitNachlauf: w.nachlauf,
    commitTeilZwei: w.teil2,
    commitAntwort: daten.antwortCommit,
    ersteAussage: w.ersteAussage,
  });
  return werte;
}

/** zahlen.tex: Kopf mit Herkunft, dann je Wert ein \newcommand. */
export function zahlenTex(makros, { commit, datum }) {
  const zeilen = Object.entries(makros)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `\\newcommand{\\${makroName(k)}}{${texEsc(v)}}`);
  return (
    `% Automatisch erzeugt von docs/referat-thema-1/abgabe/jonas/handout-latex.mjs (arsnova.eu, Fork).\n` +
    `% Stand ${commit}, ${datum}. Nicht von Hand ändern; neu erzeugen.\n` +
    `${zeilen.join('\n')}\n`
  );
}

/** SVG mit Arial statt der Deck-Schriften (Inter, IBM Plex Mono). */
export function svgArial(svg) {
  return svg
    .replace(/font-family="[^"]*"/g, 'font-family="Arial"')
    .replace(/font-family:[^;"]*/g, 'font-family:Arial');
}

async function svgZuPdf(svg, pfad, { breiteMm, arial }) {
  const { chromium } = await import('playwright');
  const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const hoeheMm = Math.ceil((breiteMm * Number(vb[2])) / Number(vb[1]));
  const face = (gewicht, datei) =>
    `@font-face{font-family:Arial;font-weight:${gewicht};src:url(${pathToFileURL(join(arial, datei)).href})}`;
  const html =
    `<!doctype html><meta charset="utf-8"><style>${face(400, 'Arial282-Regular.ttf')}${face(700, 'Arial282-Bold.ttf')}` +
    `@page{size:${breiteMm}mm ${hoeheMm}mm;margin:0}html,body{margin:0}svg{display:block;width:${breiteMm}mm;height:${hoeheMm}mm}</style>${svg}`;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: pfad, preferCSSPageSize: true, printBackground: true });
  } finally {
    await browser.close();
  }
  const fonts = execFileSync('pdffonts', [pfad], { encoding: 'utf8' });
  if (/Inter|Plex|DejaVu|Liberation/.test(fonts))
    throw new Error(`${pfad}: fremde Schrift\n${fonts}`);
}

export async function erzeuge(ziel, { arial }) {
  const daten = ladeFolienDaten(ROOT);
  mkdirSync(ziel, { recursive: true });
  const commit = execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
  const datum = new Date().toISOString().slice(0, 10);
  writeFileSync(join(ziel, 'zahlen.tex'), zahlenTex(handoutMakros(daten), { commit, datum }));
  const { b1, c1, auftrag } = daten;
  await svgZuPdf(svgArial(wegSvg({ aktiv: null, b1, c1, auftrag })), join(ziel, 'abb-weg.pdf'), {
    breiteMm: 170,
    arial,
  });
  await svgZuPdf(svgArial(zeitzerlegungSvg(b1)), join(ziel, 'abb-zeit.pdf'), {
    breiteMm: 170,
    arial,
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      arial: {
        type: 'string',
        default: `${process.env.HOME}/Documents/Code/PaperLab/fonts/arial282`,
      },
    },
  });
  if (!positionals[0])
    throw new Error('Aufruf: node handout-latex.mjs <zielordner> [--arial <ordner>]');
  await erzeuge(resolve(positionals[0]), { arial: values.arial });
  console.log(`erzeugt: ${positionals[0]}`);
}
