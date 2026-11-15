#!/usr/bin/env node
// Bauskript für Jonas' Abgabe: gemeinsames Deck, Folien-PDF, Handout, Sprechnotizen, Manifest.
//
//   node bau.mjs [--abgabe] [--niklas1 <pdf>] [--niklas2 <pdf>] [--niklas1-stand <text>]
//                [--niklas2-stand <text>] [--ausgabe <ordner>]
//
// Ohne --abgabe stehen im Handout Platzhalter für Name und Matrikelnummer. Mit --abgabe liest das
// Skript ~/.config/referat-thema-1/personen.json ([{ name, matrikel }], Jonas zuerst) und schreibt
// die personalisierten PDFs nach ~/referat-abgabe/, nie ins Repo.
/* global console, document */
import { createHash } from 'node:crypto';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';
import { parseArgs } from 'node:util';

import { baueDeck } from './deck.mjs';
import { FESTWERTE, folien, ladeFolienDaten } from './folien.mjs';
import { baueHandout, rendereHandout } from './handout.mjs';
import { niklasSeiten } from './niklas-seiten.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HIER, '../..'); // docs/referat-thema-1
const REPO = resolve(ROOT, '../..');
const requireRepo = createRequire(resolve(REPO, 'package.json'));

const STANDARD_AUSGABE = join(HIER, 'ausgabe');
const NIKLAS_1A_STANDARD = join(ROOT, 'abgabe/1A-folien.pdf');
const PERSONEN = () => join(homedir(), '.config/referat-thema-1/personen.json');
const ZIEL_ABGABE = () => join(homedir(), 'referat-abgabe');

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
];

const sha256 = (daten) => createHash('sha256').update(daten).digest('hex');
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const naechsteRelativ = (pfad) => relative(REPO, pfad).split(sep).join('/');

function fehler(text) {
  console.error(`bau.mjs: ${text}`);
  process.exit(2);
}

/** Liest und prüft personen.json; Fehler vor jedem Bau, damit nichts halb geschrieben wird. */
function lesePersonen() {
  const pfad = PERSONEN();
  if (!existsSync(pfad)) {
    fehler(
      `${pfad} fehlt. --abgabe braucht diese Datei außerhalb des Repos: ` +
        '[{ "name": "…", "matrikel": "…" }, { "name": "…", "matrikel": "…" }] (Jonas zuerst, dann Niklas).',
    );
  }
  let personen;
  try {
    personen = JSON.parse(readFileSync(pfad, 'utf8'));
  } catch (e) {
    fehler(`${pfad} ist kein gültiges JSON (${e.message}).`);
  }
  const gueltig =
    Array.isArray(personen) &&
    personen.length === 2 &&
    personen.every(
      (p) =>
        typeof p?.name === 'string' &&
        p.name.trim() &&
        typeof p?.matrikel === 'string' &&
        p.matrikel.trim(),
    );
  if (!gueltig) {
    fehler(`${pfad} muss genau zwei Einträge { "name", "matrikel" } enthalten (Jonas, Niklas).`);
  }
  const ziel = resolve(ZIEL_ABGABE());
  if (ziel === REPO || ziel.startsWith(REPO + sep)) {
    fehler(`Zielordner ${ziel} liegt im Repo; die Matrikel darf nie ins Repo.`);
  }
  return personen;
}

/** Sprechnotizen aus folien: je Folie Kennung, Titel, Sekunden, kumulierte Zeit, Kurzfassung-Marke, Notiz. */
export function baueSprechnotizen(alle) {
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
    '# Sprechnotizen Jonas',
    '',
    `Gesamt ${mmss(gesamt)} min, Kurzfassung ${mmss(kurz)} min (Folien mit der Marke „Kurzfassung“). ` +
      'Erzeugt aus `folien.mjs` (`notiz`, `zeitS`, `kurzfassung`); nicht von Hand ändern.',
    '',
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
      f.notiz.trim(),
      '',
    );
  }
  zeilen.push('# Reserve', '', 'Nur auf Nachfrage (Taste `r`), keine Zeit im Vortrag.', '');
  for (const f of reserve) {
    zeilen.push(`## ${f.id} ${ohneTags(f.titel)}`, '', f.notiz.trim(), '');
  }
  return zeilen.join('\n');
}

async function drucke(browser, url, pdfPfad) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  try {
    await page.goto(url); // frisch geladen, damit J10 beim Druck im Endzustand startet
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(300); // deck.js setzt J10 beim Wechsel in den Druckmodus auf Zoom 1
    await page.pdf({ path: pdfPfad, preferCSSPageSize: true, printBackground: true });
  } finally {
    await page.close();
  }
}

async function pdfInfo(pfad) {
  const { PDFParse } = requireRepo('pdf-parse');
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
      abgabe: { type: 'boolean', default: false },
      niklas1: { type: 'string' },
      niklas2: { type: 'string' },
      'niklas1-stand': { type: 'string' },
      'niklas2-stand': { type: 'string' },
      ausgabe: { type: 'string' },
    },
  });
  const personen = o.abgabe ? lesePersonen() : undefined;
  const ausgabe = resolve(o.ausgabe ?? STANDARD_AUSGABE);
  mkdirSync(ausgabe, { recursive: true });
  const arbeit = mkdtempSync(join(tmpdir(), 'jonas-bau-'));

  try {
    const daten = ladeFolienDaten(ROOT);
    const alle = folien(daten);

    // Niklas' Teile: Standard für 1A ist die gemergte PDF, sonst Platzhalter; 1B 3–4 nur auf Angabe.
    const niklasQuellen = { teil1: null, teil2: null };
    const eins = o.niklas1 ?? (existsSync(NIKLAS_1A_STANDARD) ? NIKLAS_1A_STANDARD : undefined);
    if (eins) niklasQuellen.teil1 = { pfad: eins, stand: o['niklas1-stand'] };
    if (o.niklas2) niklasQuellen.teil2 = { pfad: o.niklas2, stand: o['niklas2-stand'] };
    const niklas = {
      teil1: niklasQuellen.teil1
        ? await niklasSeiten(niklasQuellen.teil1.pfad, join(arbeit, 'n1'))
        : [],
      teil2: niklasQuellen.teil2
        ? await niklasSeiten(niklasQuellen.teil2.pfad, join(arbeit, 'n2'))
        : [],
    };
    const clip = join(HIER, 'medien/clip.webm');
    const { format, resolveConfig } = requireRepo('prettier');
    const formatierung = (await resolveConfig(join(REPO, 'package.json'))) ?? {};
    const rohHtml = baueDeck(alle, {
      niklas,
      clip: existsSync(clip) ? clip : undefined,
      eingebettet: true,
    });
    // Wie der Pre-commit-Hook formatieren, bevor gehasht wird, damit das Manifest stimmen bleibt.
    const html = await format(rohHtml, { ...formatierung, parser: 'html' });
    const deckPfad = join(ausgabe, 'jonas-deck.html');
    writeFileSync(deckPfad, html);

    const { chromium } = requireRepo('playwright');
    const browser = await chromium.launch();
    try {
      await drucke(browser, pathToFileURL(deckPfad).href, join(ausgabe, 'gemeinsames-deck.pdf'));
      await drucke(
        browser,
        `${pathToFileURL(deckPfad).href}?druck=jonas`,
        join(ausgabe, 'jonas-folien.pdf'),
      );
    } finally {
      await browser.close();
    }

    const handoutPfad = join(ausgabe, 'jonas-handout.pdf');
    await rendereHandout(baueHandout(daten), handoutPfad);

    writeFileSync(
      join(ausgabe, 'sprechnotizen.md'),
      await format(baueSprechnotizen(alle), { ...formatierung, parser: 'markdown' }),
    );

    // Manifest: Eingaben (Daten, Vorlagen, Module, Schriften, Niklas-PDFs) und Ausgaben mit SHA-256.
    const eingaben = [
      ...DATEN.map((p) => join(ROOT, p)),
      ...[...new Set(Object.values(FESTWERTE).map((f) => f.quelle))]
        .map((p) => join(ROOT, p))
        .filter((p) => existsSync(p)),
      ...readdirSync(HIER)
        .filter((n) => /\.(mjs|js|css|html)$/.test(n) && !n.endsWith('.test.mjs'))
        .map((n) => join(HIER, n)),
      ...alleDateien(join(HIER, 'schriften')),
      ...(existsSync(clip) ? [clip] : []),
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
    const seitenVon = {};
    let handoutWoerter = 0;
    const ausgaben = [];
    for (const datei of [
      'jonas-deck.html',
      'gemeinsames-deck.pdf',
      'jonas-folien.pdf',
      'jonas-handout.pdf',
      'sprechnotizen.md',
    ]) {
      const p = join(ausgabe, datei);
      const daten_ = readFileSync(p);
      const e = { datei, bytes: daten_.length, sha256: sha256(daten_) };
      if (datei.endsWith('.pdf')) {
        const info = await pdfInfo(p);
        e.seiten = info.seiten;
        seitenVon[datei] = info.seiten;
        if (datei === 'jonas-handout.pdf') {
          handoutWoerter = info.text.trim().split(/\s+/).filter(Boolean).length;
        }
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
        : { quelle: 'Platzhalter (Teil noch nicht geliefert)', stand: null, sha256: null };
    const manifest = {
      schemaVersion: 1,
      bauskript: 'docs/referat-thema-1/abgabe/jonas/bau.mjs',
      niklas: { teil1: nikEintrag(niklasQuellen.teil1), teil2: nikEintrag(niklasQuellen.teil2) },
      folien: {
        gemeinsamesDeck: alle.filter((f) => f.teil !== 'reserve').length,
        jonasUndReserve: alle.filter((f) => f.teil === 'jonas' || f.teil === 'reserve').length,
      },
      handoutWoerter,
      eingaben: eingaben.map(eingabeEintrag),
      ausgaben,
    };
    writeFileSync(
      join(ausgabe, 'manifest.json'),
      await format(JSON.stringify(manifest), { ...formatierung, parser: 'json' }),
    );

    // Personalisierte PDFs: nur ins Home, nie ins Repo oder in den Bauordner.
    if (personen) {
      const ziel = ZIEL_ABGABE();
      mkdirSync(ziel, { recursive: true, mode: 0o700 });
      chmodSync(ziel, 0o700);
      const personalisiert = join(ziel, 'jonas-handout.pdf');
      await rendereHandout(baueHandout(daten, personen), personalisiert);
      chmodSync(personalisiert, 0o600);
      for (const datei of ['jonas-folien.pdf', 'gemeinsames-deck.pdf']) {
        copyFileSync(join(ausgabe, datei), join(ziel, datei));
        chmodSync(join(ziel, datei), 0o600);
      }
      console.log(`Personalisierte PDFs: ${ziel}`);
    }
    for (const a of ausgaben) {
      console.log(
        `${a.datei}: ${(a.bytes / 1024).toFixed(0)} KiB${a.seiten ? `, ${a.seiten} Seiten` : ''}`,
      );
    }
    console.log(`Handout: ${handoutWoerter} Wörter; Ausgabe: ${ausgabe}`);
  } finally {
    rmSync(arbeit, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
