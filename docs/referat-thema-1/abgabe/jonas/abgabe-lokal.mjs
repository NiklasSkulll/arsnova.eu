// Lokaler Abgabeschritt: setzt Namen und Matrikelnummern der Gruppe auf Seite 1 der gebauten Folien-PDFs.
// Die Nummern stehen nur in abgabe-lokal.json, die Ergebnisse nur in abgabe-lokal/ (beides per .gitignore
// ausgeschlossen); das Repo und ausgabe/ bleiben ohne Matrikelnummer (Prüfungsdokument 3: Name und Matrikelnummer
// je Einreichung; Regel des Referats: keine Matrikelnummer im Repo).
//
// CLI: node abgabe-lokal.mjs   (vorher bau.mjs; abgabe-lokal.json nach abgabe-lokal.beispiel.json anlegen)
/* global console, process -- Node-Skript */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

/** „Name (Matrikelnummer n) · …“ für alle Gruppenmitglieder. */
export function gruppenZeile(gruppe) {
  return gruppe
    .map((p) => {
      if (!p.name || !/^\d+$/.test(String(p.matrikel ?? ''))) {
        throw new Error(`Matrikelnummer fehlt oder ist ungültig für ${p.name ?? '?'}`);
      }
      return `${p.name} (Matrikelnummer ${p.matrikel})`;
    })
    .join(' · ');
}

/** Zeile rechts oben auf Seite 1 setzen (dort ist auf G0, J1 und N1 Platz); übrige Seiten unverändert. */
export async function stempele(pdfBytes, zeile) {
  const doc = await PDFDocument.load(pdfBytes);
  const seite = doc.getPage(0);
  const { width, height } = seite.getSize();
  const schrift = await doc.embedFont(StandardFonts.Helvetica);
  const groesse = Math.round(width / 80); // 20 bei 1600 breit, entspricht --s-min (22 px) etwa
  const breite = schrift.widthOfTextAtSize(zeile, groesse);
  const rand = width * (90 / 1600);
  seite.drawText(zeile, {
    x: width - rand - breite,
    y: height - rand * 0.6 - groesse,
    size: groesse,
    font: schrift,
    color: rgb(0x56 / 255, 0x61 / 255, 0x73 / 255),
  });
  return doc.save();
}

/** Seiten (1-basiert), deren Text noch einen Entwurfsmarker oder Platzhalter trägt. */
export async function entwurfsSeiten(pdfBytes) {
  const { PDFParse } = require('pdf-parse');
  const p = new PDFParse({ data: new Uint8Array(pdfBytes) });
  try {
    const { pages } = await p.getText();
    return pages
      .filter((s) => /Entwurf|\[Niklas\]|\[Satz|\[Titel\]/.test(s.text))
      .map((s) => s.num);
  } finally {
    await p.destroy?.();
  }
}

function istIgnoriert(pfad) {
  try {
    execFileSync('git', ['check-ignore', '-q', pfad], { cwd: HIER });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const eingabe = join(HIER, 'abgabe-lokal.json');
  const ziel = join(HIER, 'abgabe-lokal');
  if (!existsSync(eingabe)) {
    throw new Error('abgabe-lokal.json fehlt (Vorlage: abgabe-lokal.beispiel.json)');
  }
  for (const p of [eingabe, join(ziel, 'x.pdf')]) {
    if (!istIgnoriert(p)) throw new Error(`${p} ist nicht von Git ignoriert, Abbruch`);
  }
  const { gruppe } = JSON.parse(readFileSync(eingabe, 'utf8'));
  const zeile = gruppenZeile(gruppe);
  mkdirSync(ziel, { recursive: true });
  for (const name of ['jonas-folien.pdf', 'niklas-folien.pdf', 'gemeinsames-deck.pdf']) {
    const quelle = join(HIER, 'ausgabe', name);
    if (!existsSync(quelle)) throw new Error(`${quelle} fehlt, erst bau.mjs ausführen`);
    const entwurf = await entwurfsSeiten(readFileSync(quelle));
    if (entwurf.length) {
      throw new Error(`${name}: Entwurfsmarker auf Seite ${entwurf.join(', ')}, so nicht abgeben`);
    }
    writeFileSync(join(ziel, name), await stempele(readFileSync(quelle), zeile));
    console.log(`erzeugt: ${join(ziel, name)}`);
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
