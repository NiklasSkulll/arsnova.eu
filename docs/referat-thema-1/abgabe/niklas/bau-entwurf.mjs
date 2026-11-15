#!/usr/bin/env node
// Baut den ENTWURF des gemeinsamen Decks mit Niklas' Teil 1A als nativen Folien (folien-1a.mjs) und
// der Vorlage für 1B 3–4 (folien-1b34.mjs) statt gerasterter PDF-Seiten. Zur Besprechung; das
// abgestimmte Deck baut weiter jonas/bau.mjs.
//
// Aufruf: node docs/referat-thema-1/abgabe/niklas/bau-entwurf.mjs [--ausgabe <ordner>]
// Ausgaben: entwurf-deck.html, entwurf-1a.pdf (nur Niklas' Folien), sprechnotizen-1a.md
/* global console */

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';
import { parseArgs } from 'node:util';

import { drucke } from '../jonas/bau.mjs';
import { baueDeck } from '../jonas/deck.mjs';
import { folien, ladeFolienDaten } from '../jonas/folien.mjs';
import { ladeDaten1A } from './daten-1a.mjs';
import { folien1A } from './folien-1a.mjs';
import { folien1B34 } from './folien-1b34.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HIER, '../..');
const REPO = resolve(ROOT, '../..');
const JONAS = join(HIER, '../jonas');
const requireRepo = createRequire(join(REPO, 'package.json'));

/** Deck-HTML (ohne Formatierung) mit nativen Niklas-Folien; für Bau und Tests. */
export function baueEntwurf() {
  const n1a = folien1A(ladeDaten1A(ROOT));
  const n1b = folien1B34();
  const clip = join(JONAS, 'medien/clip.webm');
  const mitClip = existsSync(clip);
  const html = baueDeck(folien(ladeFolienDaten(ROOT)), {
    niklas: { teil1: n1a, teil2: n1b },
    ...(mitClip
      ? {
          clip,
          clipInfo: JSON.parse(readFileSync(join(JONAS, 'medien/clip.json'), 'utf8')),
          standbild: join(JONAS, 'medien/clip-standbild.png'),
        }
      : {}),
    eingebettet: true,
  });
  return { html, n1a, n1b };
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Sprechnotizen zu Niklas' Folien: je Folie Sekunden, kumulierte Zeit, Notiz und Quelle. */
export function notizen1A(liste) {
  const ohneTags = (s) =>
    s
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const gesamt = liste.reduce((s, f) => s + f.zeitS, 0);
  const zeilen = [
    '# Sprechnotizen Niklas, Teil 1A (Entwurf von Jonas)',
    '',
    `Gesamt ${mmss(gesamt)} min. Erzeugt aus \`abgabe/niklas/folien-1a.mjs\` (\`notiz\`, \`zeitS\`); Entwurf zur Besprechung.`,
    '',
  ];
  let kumuliert = 0;
  for (const f of liste) {
    kumuliert += f.zeitS;
    zeilen.push(
      `## ${f.id} ${ohneTags(f.titel)} (${f.zeitS} s, kumuliert ${mmss(kumuliert)})`,
      '',
      f.notiz.trim(),
      '',
      `_Quelle:_ ${f.quelle}`,
      '',
    );
  }
  return zeilen.join('\n');
}

async function main() {
  const { values: o } = parseArgs({ options: { ausgabe: { type: 'string' } } });
  const ausgabe = resolve(o.ausgabe ?? join(HIER, 'ausgabe'));
  const { chromium } = requireRepo('playwright');
  const { format, resolveConfig } = requireRepo('prettier');
  const formatierung = (await resolveConfig(join(REPO, 'package.json'))) ?? {};

  const { html: roh, n1a } = baueEntwurf();
  mkdirSync(ausgabe, { recursive: true });
  const deck = join(ausgabe, 'entwurf-deck.html');
  writeFileSync(deck, await format(roh, { ...formatierung, parser: 'html' }));
  const browser = await chromium.launch();
  try {
    await drucke(
      browser,
      `${pathToFileURL(deck).href}?druck=niklas`,
      join(ausgabe, 'entwurf-1a.pdf'),
    );
  } finally {
    await browser.close();
  }
  const notizen = notizen1A(n1a);
  writeFileSync(
    join(ausgabe, 'sprechnotizen-1a.md'),
    await format(notizen, { ...formatierung, parser: 'markdown' }),
  );
  console.log(`Entwurf: ${ausgabe}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
