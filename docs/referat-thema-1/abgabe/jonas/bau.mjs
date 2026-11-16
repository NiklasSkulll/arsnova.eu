#!/usr/bin/env node
// Bauskript für Jonas' Abgabe: gemeinsames Deck, Folien-PDF, Sprechnotizen, Manifest.
//
//   node bau.mjs [--niklas1 <pdf>] [--niklas2 <pdf>] [--niklas1-stand <text>]
//                [--niklas2-stand <text>] [--ausgabe <ordner>]
//
// Niklas' Teile kommen standardmäßig nativ aus abgabe/niklas/ (1A aus seiner Messreihe, 1B 3–4 als
// Gerüst). --niklas1/--niklas2 betten stattdessen die Seiten eines PDFs ein (Rückfallweg).
//
// Das Handout entsteht seit 2026-11-15 in PaperLab (Typ referat, IU-Format nach RL und ZL); Zahlen und
// Abbildungen dafür liefert handout-latex.mjs. Name und Matrikelnummer stehen nur dort (author.ini).
/* global console, document */
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';
import { parseArgs } from 'node:util';

import { baueDeck } from './deck.mjs';
import { FESTWERTE, folien, ladeFolienDaten } from './folien.mjs';
import { niklasSeiten } from './niklas-seiten.mjs';
import { eingabenNiklas, niklasTeile } from '../niklas/teile.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HIER, '../..'); // docs/referat-thema-1
const REPO = resolve(ROOT, '../..');
const requireRepo = createRequire(resolve(REPO, 'package.json'));

const STANDARD_AUSGABE = join(HIER, 'ausgabe');

/** Ergebnis-JSONs, Antwort-Ausschnitt und Belege, aus denen folien.mjs/zahlen.mjs lesen (relativ zu ROOT). */
const DATEN = [
  'evidenz/1B/messung/2026-11-13-lauf.json',
  'evidenz/1B/messung/2026-11-13-lauf-kalt.json',
  'evidenz/1B/messung/2026-11-13-lauf-kalt-2.json',
  'evidenz/1B/messung/2026-11-13-lauf-kalt-3.json',
  'evidenz/1B/messung/2026-11-13-lauf-kalt-4.json',
  'evidenz/1B/messung/2026-11-13-lauf-kalt-5.json',
  'evidenz/1B/messung/2026-11-13-kontrolle-c0.json',
  'evidenz/1B/messung/2026-11-13-lauf-b0.json',
  'evidenz/1B/messung/2026-11-15-abgelehnte-antwort.json',
  'evidenz/1B/messung/2026-11-13-aufbau-von-null.txt',
  'evidenz/1C/messung/2026-11-09-labor-nachlauf.json.gz',
  // Hinweistext des extraktiven Fallbacks für den Nachbau auf J13 (App-Code, nur gelesen)
  '../../apps/backend/src/lib/qaSummaryExtractive.ts',
  '../../apps/frontend/src/app/features/session/session-host/moderation-compass-dialog.component.html',
];

const sha256 = (daten) => createHash('sha256').update(daten).digest('hex');
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const naechsteRelativ = (pfad) => relative(REPO, pfad).split(sep).join('/');

class BauFehler extends Error {}

/** Bedienfehler: wird oben gemeldet (Exit 2); finally-Blöcke laufen vorher durch. */
function fehler(text) {
  throw new BauFehler(text);
}

function pruefePdf(pfad, flag) {
  if (!existsSync(pfad) || !statSync(pfad).isFile()) fehler(`${flag}: ${pfad} nicht gefunden.`);
  if (readFileSync(pfad).subarray(0, 5).toString('latin1') !== '%PDF-') {
    fehler(`${flag}: ${pfad} ist kein PDF.`);
  }
}

/** Lädt eine Repo-Abhängigkeit mit klarer Fehlermeldung statt rohem Stacktrace. */
function ladeAbhaengigkeit(name) {
  try {
    return requireRepo(name);
  } catch (e) {
    fehler(
      `Abhängigkeit „${name}“ nicht ladbar (${e.code ?? e.message}). ` +
        'Im Repo „npm ci“ ausführen, für Playwright außerdem „npx playwright install chromium“.',
    );
  }
}

/**
 * Sprungplan für einen Abbruch nach etwa 9 min (Kursvorschlag 9 + 6): J13 (Gate) und J15 (Entscheidung)
 * müssen gesprochen sein. Zeiten ab J1 gezählt; spätester Sprung = 9:00 minus J13 und J15.
 */
function sprungplan(haupt) {
  const jonas = haupt.filter((f) => f.teil === 'jonas');
  const ziel = jonas.filter((f) => f.id === 'J13' || f.id === 'J15');
  if (ziel.length !== 2) throw new Error('Sprungplan: J13 und J15 fehlen');
  const zielS = ziel.reduce((s, f) => s + f.zeitS, 0);
  const startJ13 = jonas
    .slice(
      0,
      jonas.findIndex((f) => f.id === 'J13'),
    )
    .reduce((s, f) => s + f.zeitS, 0);
  const spaetestens = 9 * 60 - zielS;
  return [
    '## Sprungplan',
    '',
    `Ab J1 gezählt beginnt J13 in der Langfassung bei ${mmss(startJ13)} min. J13 und J15 brauchen zusammen ${mmss(zielS)} min. ` +
      `Damit beide bis 9:00 min gesprochen sind: Wer bei ${mmss(spaetestens)} min noch vor J13 steht, blättert mit Pfeil rechts ` +
      'ohne Kommentar bis J13, spricht J13 und danach J15. Bei Zeitdruck von Anfang an nur die Folien mit der Marke „Kurzfassung“; sie enthält J13 und J15.',
    '',
  ];
}

/** Stichpunkte (zum freien Vortrag) als Liste; fehlen sie, bleibt nur der Fließtext. */
function stichpunkteBlock(f) {
  if (!f.stichpunkte?.length) return [];
  return ['**Stichpunkte**', '', ...f.stichpunkte.map((p) => `- ${p}`), '', '**Fließtext**', ''];
}

/**
 * Sprechnotizen: je Folie Kennung, Titel, Sekunden, kumulierte Zeit, Kurzfassung-Marke, Stichpunkte
 * (falls vorhanden) und Fließtext. Ohne Optionen die Fassung für Jonas (mit Sprungplan zu J13/J15).
 * @param {object[]} alle Folien in Vortragsreihenfolge, Reserve beliebig dazwischen
 * @param {{ person?: string, quelle?: string, sprungplan?: boolean }} [o]
 */
export function baueSprechnotizen(
  alle,
  { person = 'Jonas', quelle = '`folien.mjs`', sprungplan: mitSprungplan = true } = {},
) {
  const ohneTags = (s) =>
    s
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const haupt = alle.filter((f) => f.teil !== 'reserve');
  const reserve = alle.filter((f) => f.teil === 'reserve');
  const gesamt = haupt.reduce((s, f) => s + f.zeitS, 0);
  const kurz = haupt.filter((f) => f.kurzfassung).reduce((s, f) => s + f.zeitS, 0);
  const zeilen = [
    `# Sprechnotizen ${person}`,
    '',
    `Gesamt ${mmss(gesamt)} min, Kurzfassung ${mmss(kurz)} min (Folien mit der Marke „Kurzfassung“). ` +
      `Erzeugt aus ${quelle} (\`notiz\` = Fließtext, \`stichpunkte\`, \`zeitS\`, \`kurzfassung\`); nicht von Hand ändern. ` +
      'Vorgetragen wird aus den Stichpunkten; der Fließtext ist die ausformulierte Fassung zum Üben.',
    '',
    ...(mitSprungplan ? sprungplan(haupt) : []),
  ];
  let kumuliert = 0;
  let kumuliertKurz = 0;
  for (const f of haupt) {
    kumuliert += f.zeitS;
    if (f.kurzfassung) kumuliertKurz += f.zeitS;
    zeilen.push(
      `## ${f.id} ${ohneTags(f.titel)} (${f.zeitS} s, kumuliert ${mmss(kumuliert)}` +
        `${f.kurzfassung ? `, **Kurzfassung** ${mmss(kumuliertKurz)}` : ''})`,
      '',
      ...stichpunkteBlock(f),
      f.notiz.trim(),
      '',
      `_Quelle:_ ${f.quelle ?? ''}`,
      '',
    );
  }
  zeilen.push('# Reserve', '', 'Nur auf Nachfrage (Taste `r`), keine Zeit im Vortrag.', '');
  for (const f of reserve) {
    zeilen.push(
      `## ${f.id} ${ohneTags(f.titel)}`,
      '',
      ...stichpunkteBlock(f),
      f.notiz.trim(),
      '',
      `_Quelle:_ ${f.quelle}`,
      '',
    );
  }
  return zeilen.join('\n');
}

/** Folien, die Niklas spricht: G9 (gemeinsames Fazit) und seine Teile samt Reserve, ohne Literatur. */
export function folienNiklas(alle, niklas) {
  const eigene = [...(niklas.teil1 ?? []), ...(niklas.teil2 ?? [])].filter(
    (f) => typeof f === 'object' && !f.anhang,
  );
  const g9 = alle.filter((f) => f.sprecher === 'niklas');
  return [
    ...eigene.filter((f) => f.teil !== 'reserve'),
    ...g9,
    ...eigene.filter((f) => f.teil === 'reserve'),
  ];
}

/** Folien, die Jonas spricht: alles aus folien() außer G9. */
export const folienJonas = (alle) => alle.filter((f) => f.sprecher !== 'niklas');

export async function drucke(browser, url, pdfPfad) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  try {
    await page.goto(url); // frisch geladen, damit J10 beim Druck im Endzustand startet
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print' });
    // deck.js setzt J10 beim Wechsel in den Druckmodus auf die letzte Zoomstufe; das change-Ereignis
    // kommt asynchron, daher auf den Endzustand warten statt auf eine feste Zeit.
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll('.folie[data-zoom-stufen]')].every(
          (s) => s.dataset.zoomFertig === String(JSON.parse(s.dataset.zoomStufen).length - 1),
        ),
      undefined,
      { timeout: 10_000 },
    );
    await page.pdf({ path: pdfPfad, preferCSSPageSize: true, printBackground: true });
  } finally {
    await page.close();
  }
}

async function pdfInfo(pfad) {
  const { PDFParse } = ladeAbhaengigkeit('pdf-parse');
  const p = new PDFParse({ data: new Uint8Array(readFileSync(pfad)) });
  try {
    const seiten = (await p.getInfo()).total;
    const text = (await p.getText()).text;
    return { seiten, text };
  } finally {
    await p.destroy();
  }
}

function alleDateien(ordner) {
  return readdirSync(ordner, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name))
    .sort();
}

async function main() {
  const { values: o } = parseArgs({
    options: {
      niklas1: { type: 'string' },
      niklas2: { type: 'string' },
      'niklas1-stand': { type: 'string' },
      'niklas2-stand': { type: 'string' },
      ausgabe: { type: 'string' },
    },
  });
  const ausgabe = resolve(o.ausgabe ?? STANDARD_AUSGABE);
  const { chromium } = ladeAbhaengigkeit('playwright');
  ladeAbhaengigkeit('pdf-parse');
  const { format, resolveConfig } = ladeAbhaengigkeit('prettier');
  const formatierung = (await resolveConfig(join(REPO, 'package.json'))) ?? {};

  // Niklas' Teile: standardmäßig nativ (abgabe/niklas/); ein angegebenes PDF ersetzt den Teil
  // (Rückfallweg). Ausdrücklich angegebene PDFs müssen existieren und eingebettet werden können.
  const niklasQuellen = { teil1: null, teil2: null };
  if (o.niklas1) pruefePdf(o.niklas1, '--niklas1');
  if (o.niklas2) pruefePdf(o.niklas2, '--niklas2');
  if (o.niklas1) niklasQuellen.teil1 = { pfad: o.niklas1, stand: o['niklas1-stand'] };
  if (o.niklas2) niklasQuellen.teil2 = { pfad: o.niklas2, stand: o['niklas2-stand'] };

  // Clip für J13 mit Angaben (medien/clip.json: Datum, Profil, Zeiten) und Standbild für das PDF.
  const clip = join(HIER, 'medien/clip.webm');
  const clipJson = join(HIER, 'medien/clip.json');
  const standbild = join(HIER, 'medien/clip-standbild.png');
  const mitClip = existsSync(clip);
  const festeEingaben = [
    ...DATEN.map((p) => join(ROOT, p)),
    ...[...new Set(Object.values(FESTWERTE).map((f) => f.quelle))]
      .map((p) => join(ROOT, p))
      .filter((p) => existsSync(p)),
    ...readdirSync(HIER)
      .filter((n) => /\.(mjs|js|css|html)$/.test(n) && !n.endsWith('.test.mjs'))
      .map((n) => join(HIER, n)),
    ...alleDateien(join(HIER, 'schriften')),
    ...(mitClip ? [clip, clipJson, standbild] : []),
    ...eingabenNiklas(ROOT),
  ];
  const fehlend = festeEingaben.filter((p) => !existsSync(p));
  if (fehlend.length) {
    fehler(`Eingaben fehlen: ${fehlend.map((p) => naechsteRelativ(p)).join(', ')}`);
  }

  const arbeit = mkdtempSync(join(tmpdir(), 'jonas-bau-'));
  try {
    const daten = ladeFolienDaten(ROOT);
    const alle = folien(daten);
    const niklas = niklasTeile(ROOT);
    for (const [teil, flag, ziel] of [
      ['teil1', '--niklas1', 'n1'],
      ['teil2', '--niklas2', 'n2'],
    ]) {
      if (!niklasQuellen[teil]) continue;
      niklas[teil] = await niklasSeiten(niklasQuellen[teil].pfad, join(arbeit, ziel));
      if (niklas[teil].length === 0) {
        fehler(`${flag}: Seiten von ${niklasQuellen[teil].pfad} nicht einbettbar (pdftoppm?).`);
      }
    }
    const rohHtml = baueDeck(alle, {
      niklas,
      ...(mitClip ? { clip, clipInfo: JSON.parse(readFileSync(clipJson, 'utf8')), standbild } : {}),
      eingebettet: true,
    });
    // Wie der Pre-commit-Hook formatieren, bevor gehasht wird, damit das Manifest stimmen bleibt.
    const html = await format(rohHtml, { ...formatierung, parser: 'html' });
    // Ab hier wird geschrieben: ein altes Manifest darf nie zu neuen Ausgaben stehen.
    mkdirSync(ausgabe, { recursive: true });
    rmSync(join(ausgabe, 'manifest.json'), { force: true });
    const deckPfad = join(ausgabe, 'jonas-deck.html');
    writeFileSync(deckPfad, html);

    const browser = await chromium.launch();
    try {
      await drucke(browser, pathToFileURL(deckPfad).href, join(ausgabe, 'gemeinsames-deck.pdf'));
      await drucke(
        browser,
        `${pathToFileURL(deckPfad).href}?druck=jonas`,
        join(ausgabe, 'jonas-folien.pdf'),
      );
      await drucke(
        browser,
        `${pathToFileURL(deckPfad).href}?druck=niklas`,
        join(ausgabe, 'niklas-folien.pdf'),
      );
    } finally {
      await browser.close();
    }

    writeFileSync(
      join(ausgabe, 'sprechnotizen.md'),
      await format(baueSprechnotizen(folienJonas(alle)), { ...formatierung, parser: 'markdown' }),
    );
    writeFileSync(
      join(ausgabe, 'sprechnotizen-niklas.md'),
      await format(
        baueSprechnotizen(folienNiklas(alle, niklas), {
          person: 'Niklas',
          quelle: '`abgabe/niklas/folien-1a.mjs`, `folien-1b34.mjs` und G9 in `folien.mjs`',
          sprungplan: false,
        }),
        { ...formatierung, parser: 'markdown' },
      ),
    );

    // Manifest: Eingaben (Daten, Vorlagen, Module, Schriften, Niklas-PDFs) und Ausgaben mit SHA-256.
    const eingaben = [
      ...festeEingaben,
      ...Object.values(niklasQuellen)
        .filter(Boolean)
        .map((q) => q.pfad),
    ];
    const eingabeEintrag = (p) => {
      const inRepo = resolve(p).startsWith(REPO + sep);
      return {
        pfad: inRepo ? naechsteRelativ(p) : `extern/${p.split(sep).pop()}`,
        sha256: sha256(readFileSync(p)),
      };
    };
    const ausgaben = [];
    for (const datei of [
      'jonas-deck.html',
      'gemeinsames-deck.pdf',
      'jonas-folien.pdf',
      'niklas-folien.pdf',
      'sprechnotizen.md',
      'sprechnotizen-niklas.md',
    ]) {
      const p = join(ausgabe, datei);
      const daten_ = readFileSync(p);
      const e = { datei, bytes: daten_.length, sha256: sha256(daten_) };
      if (datei.endsWith('.pdf')) {
        const info = await pdfInfo(p);
        e.seiten = info.seiten;
      }
      ausgaben.push(e);
    }
    const nikEintrag = (q) =>
      q
        ? {
            quelle: `Datei ${q.pfad.split(sep).pop()}`,
            stand: q.stand ?? 'nicht angegeben',
            sha256: sha256(readFileSync(q.pfad)),
          }
        : {
            quelle: 'nativ: abgabe/niklas/ (folien-1a.mjs, folien-1b34.mjs)',
            stand: null,
            sha256: null,
          };
    const manifest = {
      schemaVersion: 1,
      bauskript: 'docs/referat-thema-1/abgabe/jonas/bau.mjs',
      niklas: { teil1: nikEintrag(niklasQuellen.teil1), teil2: nikEintrag(niklasQuellen.teil2) },
      folien: {
        gemeinsamesDeck: ausgaben.find((a) => a.datei === 'gemeinsames-deck.pdf').seiten,
        jonasUndReserve: alle.filter((f) => f.teil === 'jonas' || f.teil === 'reserve').length,
        niklasUndReserve: ausgaben.find((a) => a.datei === 'niklas-folien.pdf').seiten,
      },
      eingaben: eingaben.map(eingabeEintrag),
      ausgaben,
    };
    writeFileSync(
      join(ausgabe, 'manifest.json'),
      await format(JSON.stringify(manifest), { ...formatierung, parser: 'json' }),
    );

    for (const a of ausgaben) {
      console.log(
        `${a.datei}: ${(a.bytes / 1024).toFixed(0)} KiB${a.seiten ? `, ${a.seiten} Seiten` : ''}`,
      );
    }
    console.log(`Ausgabe: ${ausgabe}; Handout: PaperLab (./paperlab check|final)`);
  } finally {
    rmSync(arbeit, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (e) {
    if (!(e instanceof BauFehler)) throw e;
    console.error(`bau.mjs: ${e.message}`);
    process.exit(2);
  }
}
