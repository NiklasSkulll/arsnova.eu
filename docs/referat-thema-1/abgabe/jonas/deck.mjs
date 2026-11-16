// Browser-Deck (Task 7): setzt Rahmen, Jonas' Folien, Niklas' Folien und Reserve zu einer
// selbstständigen HTML-Datei zusammen. Schriften, Bilder und Clip stehen als data:-URI darin;
// die Datei braucht kein Netz. Laufzeit (Tasten, Marker, Zoom) steht in deck.js, Gerüst und
// Bühnenstil in deck-vorlage.html.
import { readFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { KAMERA, WEG_STATIONEN } from './grafik.mjs';

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

// ------------------------------------------------------------------ kleine Wegkarte

/**
 * Verkleinerte Karte des Wegs aus J3 (gleiche Stationen, gleiche Form: oben app-host, Senke zum
 * llm-host). x aus WEG_STATIONEN mit Faktor 0,36; Kurven wie in J3 (Abstieg ab Kontext + 110,
 * Boden bei Inferenz − 80 usw.). Der Marker fährt per offset-path diese Linie entlang.
 */
const MINI = { faktor: 0.36, x0: 20, oben: 15, unten: 40, breite: 450, hoehe: 52 };
const mx = (x) => Math.round((MINI.x0 + (x - WEG_STATIONEN.klick.x) * MINI.faktor) * 10) / 10;

function miniGeometrie() {
  const S = WEG_STATIONEN;
  const { oben: o, unten: u } = MINI;
  const ab = [mx(S.kontext.x + 110), mx(S.inferenz.x - 80)];
  const auf = [mx(S.inferenz.x + 80), mx(S.nachpruefung.x - 90)];
  const k = (a, b) => (b - a) * 0.5; // Steuerpunkte wie eine weiche S-Kurve
  const segmente = [
    ['L', [mx(S.klick.x), o], [ab[0], o]],
    ['C', [ab[0], o], [ab[0] + k(ab[0], ab[1]), o], [ab[1] - k(ab[0], ab[1]), u], [ab[1], u]],
    ['L', [ab[1], u], [auf[0], u]],
    [
      'C',
      [auf[0], u],
      [auf[0] + k(auf[0], auf[1]), u],
      [auf[1] - k(auf[0], auf[1]), o],
      [auf[1], o],
    ],
    ['L', [auf[1], o], [mx(S.gate.x), o]],
  ];
  const r = (n) => Math.round(n * 100) / 100;
  const d =
    `M${r(segmente[0][1][0])} ${r(segmente[0][1][1])}` +
    segmente
      .map(([typ, , ...p]) =>
        typ === 'L'
          ? `L${r(p[0][0])} ${r(p[0][1])}`
          : `C${p.map((q) => q.map(r).join(' ')).join(' ')}`,
      )
      .join('');

  // Bogenlänge abtasten; Netz liegt auf halber Höhe des Abstiegs.
  const punkte = [];
  for (const [typ, ...p] of segmente) {
    for (let i = 0; i <= 400; i++) {
      const t = i / 400;
      if (typ === 'L') {
        punkte.push([p[0][0] + (p[1][0] - p[0][0]) * t, p[0][1] + (p[1][1] - p[0][1]) * t]);
      } else {
        const m = 1 - t;
        const f = [m ** 3, 3 * m * m * t, 3 * m * t * t, t ** 3];
        punkte.push([0, 1].map((a) => f.reduce((s, w, j) => s + w * p[j][a], 0)));
      }
    }
  }
  const laenge = [0];
  for (let i = 1; i < punkte.length; i++) {
    laenge.push(
      laenge[i - 1] + Math.hypot(punkte[i][0] - punkte[i - 1][0], punkte[i][1] - punkte[i - 1][1]),
    );
  }
  const gesamt = laenge.at(-1);
  const ziel = {
    klick: [mx(S.klick.x), o],
    kontext: [mx(S.kontext.x), o],
    netz: [(ab[0] + ab[1]) / 2, (o + u) / 2],
    inferenz: [mx(S.inferenz.x), u],
    nachpruefung: [mx(S.nachpruefung.x), o],
    gate: [mx(S.gate.x), o],
  };
  const stationen = {};
  for (const [name, [x, y]] of Object.entries(ziel)) {
    let best = 0;
    for (let i = 1; i < punkte.length; i++) {
      if (
        Math.hypot(punkte[i][0] - x, punkte[i][1] - y) <
        Math.hypot(punkte[best][0] - x, punkte[best][1] - y)
      )
        best = i;
    }
    stationen[name] = {
      x: r(punkte[best][0]),
      y: r(punkte[best][1]),
      anteil: r((laenge[best] / gesamt) * 100),
      auftrag: S[name].auftrag,
      name: S[name].name,
    };
  }
  return { d, stationen };
}

const MINI_GEO = miniGeometrie();

/** Kleine Wegkarte; mit `aktiv` steht der Marker fest an der Station (Druck/PDF). */
function wegMini({ aktiv = null, wandernd = false } = {}) {
  const { d, stationen } = MINI_GEO;
  const kreise = Object.entries(stationen)
    .map(([name, s]) => {
      const farbe =
        name === 'gate' ? 'var(--rot)' : s.auftrag === '1B' ? 'var(--bernstein)' : 'var(--petrol)';
      return name === 'inferenz'
        ? `<circle cx="${s.x}" cy="${s.y}" r="9" fill="${farbe}"/>`
        : `<circle cx="${s.x}" cy="${s.y}" r="6.5" fill="#fff" stroke="${farbe}" stroke-width="3"/>`;
    })
    .join('');
  const karte =
    `<svg class="weg-mini-karte" viewBox="0 0 ${MINI.breite} ${MINI.hoehe}" width="${MINI.breite}" height="${MINI.hoehe}" aria-hidden="true" focusable="false">` +
    `<path d="${d}" fill="none" stroke="var(--blau)" stroke-width="3" stroke-linecap="round"/>${kreise}</svg>`;
  const s = aktiv ? stationen[aktiv] : null;
  const punkt = wandernd
    ? `<div class="weg-punkt" style="offset-path:path('${d}')"></div>`
    : `<div class="weg-punkt" style="left:${s.x}px;top:${s.y}px"></div>`;
  const name = (st) =>
    `<span class="weg-name">${st ? esc(st.name) : ''}</span>` +
    `<span class="etikett etikett-${st ? st.auftrag.toLowerCase() : '1c'}">${st ? st.auftrag : ''}</span>`;
  if (wandernd) {
    return (
      `<div class="weg-mini weg-wandernd" role="img" aria-label="Station des Auftrags" hidden>` +
      karte +
      punkt +
      `<p class="weg-beschriftung">${name(null)}</p></div>`
    );
  }
  return (
    `<div class="weg-mini weg-mini-statisch" data-aktiv="${aktiv}" role="img" aria-label="Station des Auftrags: ${esc(s.name)} (${s.auftrag})">` +
    karte +
    punkt +
    `<p class="weg-beschriftung" aria-hidden="true">${name(s)}</p></div>`
  );
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
        `<figcaption style="width:${CLIP_BREITE}px;margin-top:10px;font-size:var(--s-min);line-height:1.35;color:var(--gedaempft)">` +
        `Laboraufnahme ${esc(info.datum)}: ${Math.round(info.wartezeitS)} s Wartezeit, auf ${info.raffungS} s gerafft. ` +
        (info.grund === 'timeout'
          ? `Hier Abbruch nach ${Math.round(info.timeoutMs / 1000)} s (Timeout), nicht das Gate, gleicher Hinweis. `
          : '') +
        `Illustration, kein Nachweis.</figcaption>`,
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
    `aria-label="${esc(`${fussNr.replace(' / ', ' von ')}: ${ohneTags(f.titel)}`)}"`,
  ]
    .filter(Boolean)
    .join(' ');
  const html =
    `<section ${attrs}>` +
    (f.station && !eigenerWeg ? wegMini({ aktiv: f.station }) : '') +
    (f.exkurs ? `<p class="weg-exkurs">${esc(f.exkurs)}</p>` : '') +
    `<h1 class="folie-titel">${f.titel}</h1>` +
    `<div class="folie-flaeche">${inhalt}</div>` +
    `<div class="folie-fuss">${fussNr} · ${esc(f.fuss ?? f.quelle ?? '')}</div>` +
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
          `<div class="folie-flaeche"><p class="niklas-platzhalter">${esc(titel)}<br>` +
          `<span>Seiten aus Niklas' Folien-PDF folgen hier.</span></p></div>` +
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
 * Baut das gemeinsame Deck: G0 (Jonas eröffnet), Jonas J1–J15 (Übergabe auf J15), Niklas 1A und
 * 1B 3–4, G9 (gemeinsames Fazit, spricht Niklas), Anhang (J16, Literatur 1A); Reservefolien danach
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
  const g0 = nach((f) => f.id === 'G0');
  const g9 = nach((f) => f.id === 'G9');
  // Anhang (J16, Literaturverzeichnis) steht nach G9, damit er die Übergabe an Niklas nicht unterbricht.
  const jonas = nach((f) => f.teil === 'jonas' && !f.anhang);
  const anhang = nach((f) => f.teil === 'jonas' && f.anhang);
  const reserve = nach((f) => f.teil === 'reserve');
  if (g0.length !== 1 || g9.length !== 1) throw new Error('Rahmenfolien G0 und G9 fehlen');
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
  const haupt = [
    ...g0.map((f) => ({ folie: f })),
    ...jonas.map((f) => ({ folie: f })),
    ...teilVonNiklas(niklas.teil1, '1A', 'N1', '1A: Ressourcen auf dem App-Host'),
    ...teilVonNiklas(niklas.teil2, '1B Schritte 3–4', 'N2', '1B Schritte 3–4: Störung und Aufwand'),
    ...g9.map((f) => ({ folie: f })),
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
  const konfig = { stationen: MINI_GEO.stationen };
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
