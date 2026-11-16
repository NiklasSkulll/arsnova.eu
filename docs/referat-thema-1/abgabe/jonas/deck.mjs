// Browser-Deck (Task 7): setzt Rahmen, Jonas' Folien, Niklas' Folien und Reserve zu einer
// selbstständigen HTML-Datei zusammen. Schriften, Bilder und Clip stehen als data:-URI darin;
// die Datei braucht kein Netz. Laufzeit (Tasten, Marker, Zoom) steht in deck.js, Gerüst und
// Bühnenstil in deck-vorlage.html.
import { readFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TEILE, teilVon } from './folien.mjs';
import { KAMERA } from './grafik.mjs';
import { WEG_AUFTRAG, wegMarke, wegMini } from './wegkarte.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const ohneTags = (s) => String(s).replace(/<[^>]*>/g, '');
const zwei = (n) => String(n).padStart(2, '0');

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
};
function dataUri(pfad) {
  const mime = MIME[extname(pfad).toLowerCase()];
  if (!mime) throw new Error(`Unbekannter Dateityp: ${pfad}`);
  return `data:${mime};base64,${readFileSync(pfad).toString('base64')}`;
}

// ------------------------------------------------------------------ Zoom J10

/** Zoom, bei dem die Kamera genau `mm` Millimeter breit ist (Umkehrung von kameraViewBox). */
const zoomFuerBreite = (mm) => Math.log(mm / KAMERA.W0) / Math.log(KAMERA.W1 / KAMERA.W0);
/**
 * Stufen der Kamerafahrt: Feld → 1 m Bildbreite (Ende der Inferenz, davor Lücke bis zum Transport)
 * → Transport lesbar (Zoombereich der Beschriftung 0,58–0,76, Mitte wie in grafik.mjs) → 0,3 mm.
 */
export const ZOOM_STUFEN = Object.freeze([
  0,
  Math.round(zoomFuerBreite(1000) * 1000) / 1000,
  0.67,
  1,
]);

// ------------------------------------------------------------------ Folien

/**
 * Kennungen (ADR-Nummern, Dateinamen, git describe) nicht am Bindestrich umbrechen: im sichtbaren
 * Text außerhalb von Tags und SVG-Grafiken in nowrap-Spannen setzen.
 */
const KENNUNG =
  /(?<![\w./-])(?:ADR-\d{4}|1[ABC]-\d{3}|v\d\.\d\.\d-\d+|[\w-]+(?:\/[\w.-]+)*\.(?:md|ts|json|html|sh))(?![\w-])/g;
function ohneUmbruchInKennungen(html) {
  return html
    .split(/(<svg[\s\S]*?<\/svg>|<pre[\s\S]*?<\/pre>|<[^>]+>)/)
    .map((teil) =>
      teil.startsWith('<')
        ? teil
        : teil.replace(KENNUNG, (k) => `<span class="nowrap">${k}</span>`),
    )
    .join('');
}

/** Breite des J13-Clips in px (Höhe aus dem Zuschnitt 848 × 800); vorher 380 px, im Audit zu klein. */
const CLIP_BREITE = 480;

/**
 * Teilleiste oben rechts (Leitfaden E24, roter Faden): die Teile des Vortrags wie im Fahrplan auf G0,
 * der aktuelle Teil hervorgehoben. Nur auf Hauptfolien (nicht G0, Anhang, Reserve).
 */
function teilleiste(f) {
  const aktiv = teilVon(f);
  if (!aktiv) return '';
  const name = TEILE.find((t) => t.id === aktiv);
  return (
    `<ol class="teilleiste" aria-label="Teil des Vortrags: ${esc(`${name.kurz}, ${name.wer}`)}">` +
    TEILE.map(
      (t) => `<li${t.id === aktiv ? ' data-aktiv aria-current="step"' : ''}>${esc(t.kurz)}</li>`,
    ).join('') +
    '</ol>'
  );
}

/**
 * Ortsmarke oben links ohne Bewegung (druckfest) auf jeder Folie von 1A und 1B 3–4 und auf J1: eine Wegkarte
 * in derselben Bildsprache wie Jonas' Stationsmarker (wegkarte.mjs, f.marke ist ein Schlüssel aus MARKEN).
 * Folien mit Station tragen stattdessen Jonas' Marker.
 */
function ortsmarke(f) {
  return f.marke ? wegMarke(f.marke) : '';
}

function jonasFolie(f, nr, gesamt, clipDaten) {
  let inhalt = f.inhalt.replaceAll(' xmlns="http://www.w3.org/2000/svg"', '');
  if (clipDaten) {
    const { uri, standbild, info } = clipDaten;
    const vorher = inhalt;
    inhalt = inhalt.replace(
      // Der Clip ersetzt den gezeichneten Nachbau samt seinem Vermerk (data-nachbau … <!--/nachbau-->)
      // und bringt eine eigene Bildunterschrift mit (Schlussprüfung I1).
      /(<figure data-clip="[^"]*"[^>]*>)<div data-nachbau[\s\S]*?<!--\/nachbau-->/,
      (_, figure) =>
        `${figure}<video class="clip" src="${uri}" muted playsinline preload="auto" ` +
        `aria-label="Clip: Lehrenden-Sicht, Klick, Warten, Ersatzzusammenfassung" ` +
        `style="display:block;width:${CLIP_BREITE}px;aspect-ratio:848/800;object-fit:cover;border-radius:10px;background:var(--tinte);box-shadow:0 2px 6px rgb(22 32 44 / 0.14), 0 12px 32px rgb(22 32 44 / 0.12)"></video>` +
        // Im PDF (Druck-CSS der Vorlage) steht das Standbild an der Stelle des Videos.
        `<img class="clip-standbild" src="${standbild}" alt="Standbild: Ergebnis mit Hinweis" ` +
        `style="width:${CLIP_BREITE}px;aspect-ratio:848/800;object-fit:cover;border-radius:10px">` +
        // Zwei Vermerke mit je einer Zeile (Designregel T); das Energieprofil steht nur im Protokoll.
        `<figcaption style="width:${CLIP_BREITE}px">` +
        `<p class="vermerk">Laboraufnahme ${esc(info.datum)}, ${Math.round(info.wartezeitS)} s auf ${info.raffungS} s gerafft</p>` +
        `<p class="vermerk" style="margin-top:2px">` +
        (info.grund === 'timeout'
          ? `Abbruch nach ${Math.round(info.timeoutMs / 1000)} s (Timeout), nicht das Gate`
          : 'Illustration, kein Nachweis') +
        `</p></figcaption>`,
    );
    if (inhalt === vorher && f.inhalt.includes('data-clip')) {
      throw new Error(`${f.id}: Nachbau für den Clip nicht gefunden`);
    }
  }
  inhalt = ohneUmbruchInKennungen(inhalt)
    // Prettier (bau.mjs) bricht sonst zwischen <tspan>-Elementen um; der Umbruch wird in SVG-Text zu
    // einem Leerzeichen („t 0“ statt t mit tiefgestellter 0).
    .replace(/<svg\b/g, '<!-- prettier-ignore --><svg');
  const eigenerWeg = inhalt.includes('class="auftrag"');
  const fussNr = f.teil === 'reserve' ? `Reserve ${f.id}` : `${nr} / ${gesamt}`;
  const attrs = [
    `class="folie"`,
    `data-id="${esc(f.id)}"`,
    `data-teil="${esc(f.teil)}"`,
    f.station ? `data-station="${esc(f.station)}"` : '',
    eigenerWeg ? 'data-eigener-weg' : '',
    f.id === 'J10' ? `data-zoom-stufen="${esc(JSON.stringify(ZOOM_STUFEN))}"` : '',
    f.aufbau ? `data-aufbau="${Number(f.aufbau)}"` : '',
    f.autor ? `data-autor="${esc(f.autor)}"` : '',
    // Titelfolie mit beiden Namen (und lokal den Matrikelnummern) steht auch in jedem Einzel-PDF.
    f.id === 'GT' ? 'data-titelfolie' : '',
    `aria-label="${esc(`${fussNr.replace(' / ', ' von ')}: ${ohneTags(f.titel)}`)}"`,
  ]
    .filter(Boolean)
    .join(' ');
  const html =
    `<section ${attrs}>` +
    (f.station && !eigenerWeg ? wegMini({ aktiv: f.station }) : '') +
    (f.station ? '' : ortsmarke(f)) +
    teilleiste(f) +
    (f.exkurs ? `<p class="weg-exkurs">${esc(f.exkurs)}</p>` : '') +
    `<h1 class="folie-titel">${f.titel}</h1>` +
    `<div class="folie-flaeche">${inhalt}</div>` +
    `<div class="folie-fuss"><span class="fuss-nr">${fussNr}</span> · ${esc(f.fuss ?? f.quelle ?? '')}</div>` +
    `</section>`;
  return f.quellenverzeichnis ? `<!--quellen-->${html}<!--/quellen-->` : html;
}

function niklasFolien(pngs, teil, kennung, titel) {
  if (pngs.length === 0) {
    return [
      {
        nr: true,
        html: (nr, gesamt) =>
          `<section class="folie" data-id="${kennung}" data-teil="niklas" aria-label="Folie ${nr} von ${gesamt}: Teil Niklas, ${esc(titel)}">` +
          `<h1 class="folie-titel">Teil Niklas</h1>` +
          `<div class="folie-flaeche"><div class="flaeche-inhalt"><p class="niklas-platzhalter">${esc(titel)}<br>` +
          `<span>Seiten aus Niklas' Folien-PDF folgen hier.</span></p></div></div>` +
          `<div class="folie-fuss">${nr} / ${gesamt} · Niklas, ${esc(teil)}</div></section>`,
      },
    ];
  }
  return pngs.map((pfad, i) => ({
    nr: true,
    html: (nr, gesamt) =>
      `<section class="folie folie-bild" data-id="${kennung}-${zwei(i + 1)}" data-teil="niklas" aria-label="Folie ${nr} von ${gesamt}: Niklas, ${esc(titel)}, Seite ${i + 1}">` +
      `<img src="${dataUri(pfad)}" alt="Niklas, ${esc(titel)}, Seite ${i + 1} von ${pngs.length}"></section>`,
  }));
}

/**
 * Baut das gemeinsame Deck: GT (Titel) und G0 (Fahrplan), Niklas 1A (Übergabe auf N10), Jonas J1–J15
 * (Übergabe auf J15), Niklas 1B 3–4, G9 (gemeinsames Fazit) und GD (Dank, Fragen), alle Rahmenfolien
 * spricht Niklas; Anhang (J16, Literatur 1A); Reservefolien danach
 * (nur über `r` erreichbar). Native Niklas-Folien mit `anhang` kommen in den Anhang, mit
 * `teil: 'reserve'` in die Reserve (data-autor="niklas" für den Druckauszug).
 * @param {ReturnType<import('./folien.mjs').folien>} folien
 * @param {{ niklas: { teil1: string[], teil2: string[] }, clip?: string, standbild?: string,
 *   clipInfo?: { datum: string, profil: string, wartezeitS: number, raffungS: number, grund: string,
 *     timeoutMs: number, hinweis: string },
 *   eingebettet: true }} optionen
 * @returns {string} eine selbstständige HTML-Datei
 */
export function baueDeck(
  folien,
  { niklas = { teil1: [], teil2: [] }, clip, clipInfo, standbild, eingebettet } = {},
) {
  if (eingebettet !== true) {
    throw new Error('baueDeck erzeugt nur eingebettete Decks (eingebettet: true).');
  }
  const nach = (pred) => folien.filter(pred);
  const rahmen = (id) => nach((f) => f.id === id);
  const [gt, g0, gk, g9, gd] = ['GT', 'G0', 'GK', 'G9', 'GD'].map(rahmen);
  // Anhang (J16, Literaturverzeichnis) steht nach dem Dank, damit er keine Übergabe unterbricht.
  const jonas = nach((f) => f.teil === 'jonas' && !f.anhang);
  const anhang = nach((f) => f.teil === 'jonas' && f.anhang);
  const reserve = nach((f) => f.teil === 'reserve');
  if ([gt, g0, gk, g9, gd].some((r) => r.length !== 1)) {
    throw new Error('Rahmenfolien GT, G0, GK, G9 und GD fehlen');
  }
  if (clip && !(clipInfo && standbild)) {
    throw new Error('Clip braucht clipInfo (Datum, Profil, Zeiten) und ein Standbild für das PDF.');
  }
  const clipDaten = clip
    ? { uri: dataUri(clip), standbild: dataUri(standbild), info: clipInfo }
    : null;

  // Niklas' Teile: native Folien im Deck-Stil (Objekte wie folien(), abgabe/niklas/) oder gerasterte
  // PDF-Seiten (Pfade, Rückfallweg --niklas1/--niklas2).
  const nativ = (teil) => (teil?.length && typeof teil[0] === 'object' ? teil : null);
  const niklasNativ = [...(nativ(niklas.teil1) ?? []), ...(nativ(niklas.teil2) ?? [])];
  const teilVonNiklas = (teil, ...rest) =>
    nativ(teil)
      ? teil.filter((f) => f.teil !== 'reserve' && !f.anhang).map((f) => ({ folie: f }))
      : niklasFolien(teil ?? [], ...rest);
  // Vortragsreihenfolge (Design 2026-11-15, Abschnitt 3): Niklas eröffnet mit 1A, Jonas erzählt 1C und
  // 1B 1–2 am Stück, Niklas schließt mit 1B 3–4 und dem gemeinsamen Fazit.
  const haupt = [
    ...gt.map((f) => ({ folie: f })),
    ...g0.map((f) => ({ folie: f })),
    ...gk.map((f) => ({ folie: f })),
    ...teilVonNiklas(niklas.teil1, '1A', 'N1', '1A: Ressourcen auf dem App-Host'),
    ...jonas.map((f) => ({ folie: f })),
    ...teilVonNiklas(niklas.teil2, '1B Schritte 3–4', 'N2', '1B Schritte 3–4: Störung und Aufwand'),
    ...g9.map((f) => ({ folie: f })),
    ...gd.map((f) => ({ folie: f })),
    ...anhang.map((f) => ({ folie: f })),
    ...niklasNativ.filter((f) => f.anhang && f.teil !== 'reserve').map((f) => ({ folie: f })),
  ];
  reserve.push(...niklasNativ.filter((f) => f.teil === 'reserve'));
  const gesamt = haupt.length;
  const abschnitte = haupt.map((h, i) =>
    h.folie ? jonasFolie(h.folie, i + 1, gesamt, clipDaten) : h.html(i + 1, gesamt),
  );
  abschnitte.push(...reserve.map((f) => jonasFolie(f, 0, gesamt, null)));

  const uebersicht =
    `<div class="reserve-uebersicht" role="dialog" aria-modal="true" aria-labelledby="reserve-titel" hidden>` +
    `<h2 id="reserve-titel">Reservefolien</h2><ol>` +
    reserve
      .map(
        (f, i) =>
          `<li><button type="button" data-ziel="${esc(f.id)}"><span class="mono">${i + 1}</span> ${esc(ohneTags(f.titel).replace(/^Reserve:\s*/, ''))}</button></li>`,
      )
      .join('') +
    `</ol><p class="reserve-hilfe">Ziffer oder Klick öffnet · Esc zurück zum Vortrag</p></div>`;

  const stil = readFileSync(join(HIER, 'stil.css'), 'utf8').replace(
    /url\('(schriften\/[^']+\.woff2)'\)/g,
    (_, pfad) => `url('${dataUri(join(HIER, pfad))}')`,
  );
  const konfig = { stationen: WEG_AUFTRAG.stationen };
  const vorlage = readFileSync(join(HIER, 'deck-vorlage.html'), 'utf8');
  // Platzhalter stehen als HTML-Kommentare in der Vorlage, damit Prettier sie nicht umformt.
  const fuellung = {
    STIL: `<style>\n${stil}</style>`,
    FOLIEN: abschnitte.join('\n'),
    WEG: wegMini({ wandernd: true }),
    UEBERSICHT: uebersicht,
    KONFIG:
      `<script type="application/json" id="deck-konfig">` +
      `${JSON.stringify(konfig).replace(/</g, '\\u003c')}</script>`,
    SKRIPT: `<script>\n${readFileSync(join(HIER, 'deck.js'), 'utf8')}</script>`,
  };
  return vorlage.replace(/<!--\{\{([A-Z]+)\}\}-->/g, (ganz, name) => {
    if (!(name in fuellung)) throw new Error(`Unbekannter Platzhalter ${ganz}`);
    return fuellung[name];
  });
}
