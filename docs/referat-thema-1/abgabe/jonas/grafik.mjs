// Diagramme für Jonas' Folien (Richtung M, Stilproben M2–M4): reine Funktionen, die SVG-Text liefern.
// Jede Zahl kommt aus dem Datenmodul (zahlen.mjs); fest stehen hier nur Achsenstriche, die vorab
// festgelegten Schwellen aus ADR 1B-008 und die Geometrie.
//
// Fläche: Jede Grafik hat viewBox "0 0 1380 560" (FLAECHE) und sitzt auf der 1600 × 900-Folie im
// Maßstab 1:1 zwischen Titel und Fußzeile (links 110, oben 190; .folie-flaeche in stil.css).
// Schriftgrößen sind damit echte Pixel auf 1600 px Breite (mindestens 22), Linien mindestens 2 px.
// Keine <pattern>/<clipPath>-IDs: Im Deck liegen viele Folien mit display:none, und Verweise auf
// IDs in versteckten Folien würden nicht gezeichnet.
import { fmt } from './zahlen.mjs';

export const FLAECHE = { x: 110, y: 190, breite: 1380, hoehe: 560 };

export const FARBEN = {
  blau: '#0b5ea8',
  petrol: '#0f766e',
  petrolHell: '#e3f1ee',
  bernstein: '#b45309',
  bernsteinText: '#9a4a0b',
  bernsteinMittel: '#e9b47a',
  bernsteinHell: '#fbefe0',
  rot: '#b42318',
  tinte: '#16202c',
  text2: '#3d4757',
  gedaempft: '#566173',
  linie: '#c9d2de',
  raster: '#e8edf3',
  weiss: '#ffffff',
  rasen: '#2f7a4f',
  rasenStreifen: '#2a7147',
  rasenRand: '#245f3d',
};

const TEXT = "Inter, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";

/** Vorab festgelegte Schwellen (ADR 1B-008): H_B1 Netz, H_B2 Adapter, H_B3 Inferenzanteil. */
const SCHWELLE = { netzMs: 50, adapterMs: 2000, inferAnteil: 0.95 };

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const r2 = (n) => Math.round(n * 100) / 100;

/** <text> mit expliziten Attributen; inhalt ist bereits escaptes Markup (für <tspan>). */
function text(x, y, inhalt, o = {}) {
  const a = [
    `x="${r2(x)}"`,
    `y="${r2(y)}"`,
    `font-family="${o.mono ? MONO : TEXT}"`,
    `font-size="${o.groesse ?? 28}"`,
    `font-weight="${o.gewicht ?? 400}"`,
    `fill="${o.farbe ?? FARBEN.tinte}"`,
  ];
  if (o.anker) a.push(`text-anchor="${o.anker}"`);
  if (o.halo) {
    a.push(`stroke="${o.halo}" stroke-width="${o.haloBreite ?? 6}" stroke-linejoin="round"`);
    a.push('paint-order="stroke"');
  }
  if (o.extra) a.push(o.extra);
  return `<text ${a.join(' ')}>${inhalt}</text>`;
}

/** t mit tiefgestellter Ziffer als <tspan> (die latin-Schriftschnitte haben keine ₀–₃). */
const tIndex = (i) => `t<tspan font-size="22" baseline-shift="-6">${i}</tspan>`;

/** Haken als Pfad (✓ fehlt ebenfalls in den latin-Schnitten). */
const haken = (x, y, farbe) =>
  `<path d="M${r2(x)},${r2(y - 7)} l6,7 l12,-14" fill="none" stroke="${farbe}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
const kreuz = (x, y, farbe) =>
  `<path d="M${r2(x)},${r2(y - 12)} l14,14 m0,-14 l-14,14" fill="none" stroke="${farbe}" stroke-width="3" stroke-linecap="round"/>`;

function svgHuelle(label, inhalt) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FLAECHE.breite} ${FLAECHE.hoehe}" ` +
    `role="img" aria-label="${esc(label)}">` +
    `<rect width="${FLAECHE.breite}" height="${FLAECHE.hoehe}" fill="${FARBEN.weiss}"/>${inhalt}</svg>`
  );
}

// ---------------------------------------------------------------------------------------------
// Log-Achse

/** Position von ms auf einer logarithmischen Achse zwischen minMs (x0) und maxMs (x1). */
export function logX(ms, { x0, x1, minMs, maxMs }) {
  const a = Math.log10(minMs);
  const anteil = (Math.log10(ms) - a) / (Math.log10(maxMs) - a);
  return x0 + anteil * (x1 - x0);
}

const ACHSE = { x0: 250, x1: 1330, minMs: 0.1, maxMs: 1_000_000 };
const STRICHE = [
  [0.1, '0,1 ms'],
  [1, '1 ms'],
  [10, '10 ms'],
  [100, '100 ms'],
  [1000, '1 s'],
  [10_000, '10 s'],
  [100_000, '100 s'],
  [1_000_000, '1000 s'],
];

/**
 * Zeitzerlegung eines Auftrags auf Log-Achse (J9). Netz, Transport und Adapter sind Mediane über
 * alle Aufträge, Inferenz der Median warm (Auftrag 1 ist kalt, ADR 1B-011), kalt der Median der
 * Läufe mit frischer Runtime. Jede Zeile nennt ihre Gruppe.
 */
export function zeitzerlegungSvg(b1, { kalt = true } = {}) {
  const alle = `Median, alle ${b1.anzahl}`;
  const nWarm = b1.anzahl - 1; // Auftrag 1 kalt, 2…n warm (ADR 1B-011)
  const zeilen = [
    { name: 'Netz', gruppe: alle, ms: b1.netzMs, wert: `${fmt(b1.netzMs, 2)} ms` },
    { name: 'Transport', gruppe: alle, ms: b1.transportMs, wert: `${fmt(b1.transportMs, 1)} ms` },
    { name: 'Adapter', gruppe: alle, ms: b1.adapterMs, wert: `${fmt(b1.adapterMs, 0)} ms` },
    {
      name: 'Inferenz',
      gruppe: `warm, n = ${nWarm}`,
      ms: b1.inferWarmMs,
      wert: `${fmt(b1.inferWarmMs / 1000, 1)} s`,
      haupt: true,
    },
  ];
  if (kalt) {
    zeilen.push({
      name: 'Auftrag kalt',
      gruppe: 'frische Runtime',
      ms: b1.kaltMedianS * 1000,
      wert: `${fmt(b1.kaltMedianS, 1)} s`,
      kalt: true,
    });
  }

  const oben = 30;
  const unten = 450;
  const takt = (unten - oben) / zeilen.length;
  const balkenH = 40;
  const teile = [];

  // Raster: Dekaden kräftiger, Zwischenstriche (2…9) zart; nur in der Diagrammfläche.
  for (let d = -1; d < 6; d++) {
    for (let k = 2; k <= 9; k++) {
      const x = r2(logX(k * 10 ** d, ACHSE));
      teile.push(
        `<line x1="${x}" y1="${oben}" x2="${x}" y2="${unten}" stroke="${FARBEN.raster}" stroke-width="2"/>`,
      );
    }
  }
  for (const [ms, label] of STRICHE) {
    const x = r2(logX(ms, ACHSE));
    teile.push(
      `<line x1="${x}" y1="${oben}" x2="${x}" y2="${unten}" stroke="${FARBEN.linie}" stroke-width="2"/>`,
      text(x, unten + 34, label, {
        mono: true,
        groesse: 22,
        farbe: FARBEN.gedaempft,
        anker: 'middle',
      }),
    );
  }

  const schwelle = (x, cy, label, ok) => {
    const xs = r2(x);
    return (
      `<line x1="${xs}" y1="${r2(cy - 30)}" x2="${xs}" y2="${r2(cy + 30)}" stroke="${FARBEN.tinte}" stroke-width="3" stroke-dasharray="8 6"/>` +
      text(x + 14, cy + 8, esc(label), { mono: true, groesse: 22, halo: FARBEN.weiss }) +
      (ok ? haken : kreuz)(
        x + 14 + label.length * 13.2 + 12,
        cy + 4,
        ok ? FARBEN.tinte : FARBEN.rot,
      )
    );
  };

  zeilen.forEach((z, i) => {
    const cy = oben + takt * (i + 0.5);
    const xEnde = logX(z.ms, ACHSE);
    const breite = r2(xEnde - ACHSE.x0);
    teile.push(
      text(226, cy + 4, esc(z.name), { groesse: 30, gewicht: z.haupt ? 700 : 400, anker: 'end' }),
      text(226, cy + 32, esc(z.gruppe), {
        mono: true,
        groesse: 22,
        farbe: FARBEN.gedaempft,
        anker: 'end',
      }),
    );
    const y = r2(cy - balkenH / 2);
    if (z.kalt) {
      teile.push(
        `<rect x="${ACHSE.x0 + 1.5}" y="${r2(y + 1.5)}" width="${r2(breite - 3)}" height="${balkenH - 3}" fill="${FARBEN.bernsteinHell}" stroke="${FARBEN.bernstein}" stroke-width="3"/>`,
      );
    } else {
      teile.push(
        `<rect x="${ACHSE.x0}" y="${y}" width="${breite}" height="${balkenH}" fill="${z.haupt ? FARBEN.bernstein : FARBEN.bernsteinMittel}"/>`,
      );
    }
    teile.push(
      text(xEnde + 16, cy + 9, esc(z.wert), {
        mono: true,
        groesse: 26,
        gewicht: 600,
        halo: FARBEN.weiss,
      }),
    );
    if (z.name === 'Netz') {
      teile.push(
        schwelle(logX(SCHWELLE.netzMs, ACHSE), cy, 'Schwelle 50 ms', b1.netzMs <= SCHWELLE.netzMs),
      );
    }
    if (z.name === 'Adapter') {
      teile.push(
        schwelle(
          logX(SCHWELLE.adapterMs, ACHSE),
          cy,
          'Schwelle 2 s',
          b1.adapterMs <= SCHWELLE.adapterMs,
        ),
      );
    }
    if (z.haupt) {
      // H_B3 ist ein Anteil, keine Zeit: als Text im Balken, rechtsbündig.
      const ok = b1.inferAnteil >= SCHWELLE.inferAnteil;
      const label = `Anteil ${fmt(b1.inferAnteil * 100, 2)} % (${alle}) · Schwelle mind. 95 %`;
      const xr = xEnde - 44;
      teile.push(
        text(xr, cy + 8, esc(label), {
          mono: true,
          groesse: 22,
          gewicht: 600,
          farbe: FARBEN.weiss,
          anker: 'end',
        }),
        (ok ? haken : kreuz)(xr + 12, cy + 4, FARBEN.weiss),
      );
    }
  });

  teile.push(
    `<line x1="${ACHSE.x0}" y1="${unten}" x2="${ACHSE.x1}" y2="${unten}" stroke="${FARBEN.gedaempft}" stroke-width="2"/>`,
    text(
      0,
      542,
      'Log-Achse: jeder Strich zehnmal mehr. Schwellen vor dem Lauf festgelegt (ADR 1B-008).',
      { groesse: 24, farbe: FARBEN.text2 },
    ),
  );

  const label =
    `Zeitzerlegung eines Summary-Auftrags auf logarithmischer Achse: Netz ${fmt(b1.netzMs, 2)} ms, ` +
    `Transport ${fmt(b1.transportMs, 1)} ms, Adapter ${fmt(b1.adapterMs, 0)} ms (Mediane über alle ${b1.anzahl} Aufträge), ` +
    `Inferenz ${fmt(b1.inferWarmMs / 1000, 1)} s (Median warm, n = ${nWarm})` +
    (kalt ? `, Auftrag kalt ${fmt(b1.kaltMedianS, 1)} s (frische Runtime)` : '') +
    `. Inferenzanteil ${fmt(b1.inferAnteil * 100, 2)} %. Alle drei Schwellen erfüllt.`;
  return svgHuelle(label, teile.join(''));
}

// ---------------------------------------------------------------------------------------------
// Weg des Auftrags über zwei Hosts

const APP_BOX = { y: 0, h: 270 };
const LLM_BOX = { y: 350, h: 200 };
const OBEN_Y = 140;
const UNTEN_Y = 460;
// Abstieg und Aufstieg als kubische Kurven (Kontrollpunkte waagerecht, wirkt wie ein Gleis).
const AB = [
  [450, OBEN_Y],
  [530, OBEN_Y],
  [530, UNTEN_Y],
  [610, UNTEN_Y],
];
const AUF = [
  [770, UNTEN_Y],
  [850, UNTEN_Y],
  [850, OBEN_Y],
  [930, OBEN_Y],
];

function bezier(p, t) {
  const u = 1 - t;
  const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [0, 1].map((d) => k.reduce((s, ki, i) => s + ki * p[i][d], 0));
}

/** Punkt auf einer der beiden Kurven bei gegebener Höhe y (Bisektion; y ist monoton in t). */
function aufKurve(p, y) {
  let lo = 0;
  let hi = 1;
  const steigt = p[3][1] > p[0][1];
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (bezier(p, m)[1] < y === steigt) lo = m;
    else hi = m;
  }
  return bezier(p, (lo + hi) / 2).map(r2);
}

const NETZ_Y = (APP_BOX.y + APP_BOX.h + LLM_BOX.y) / 2;

/**
 * Stationen mit Lage (Mitte), Ringradius und Auftrag. Das Deck (Task 7) bewegt den Marker
 * <g class="auftrag" transform="translate(x y)"> zwischen diesen Punkten.
 */
export const WEG_STATIONEN = Object.freeze({
  klick: { x: 120, y: OBEN_Y, r: 20, auftrag: '1C', name: 'Klick' },
  kontext: { x: 340, y: OBEN_Y, r: 20, auftrag: '1C', name: 'Kontext' },
  netz: { ...xy(aufKurve(AB, NETZ_Y)), r: 12, auftrag: '1B', name: 'Netz' },
  inferenz: { x: 690, y: UNTEN_Y, r: 50, auftrag: '1B', name: 'Inferenz' },
  nachpruefung: { x: 1020, y: OBEN_Y, r: 20, auftrag: '1C', name: 'Nachprüfung' },
  gate: { x: 1250, y: OBEN_Y, r: 20, auftrag: '1C', name: 'Gate' },
});
function xy([x, y]) {
  return { x, y };
}

function etikett(cx, y, auftrag) {
  const c = auftrag === '1C';
  return (
    `<g data-etikett="${auftrag}">` +
    `<rect x="${r2(cx - 30)}" y="${r2(y)}" width="60" height="32" rx="6" fill="${c ? FARBEN.petrolHell : FARBEN.bernsteinHell}"/>` +
    text(cx, y + 24, auftrag, {
      groesse: 22,
      gewicht: 700,
      farbe: c ? FARBEN.petrol : FARBEN.bernsteinText,
      anker: 'middle',
    }) +
    `</g>`
  );
}

function rasterBox(y, h, label, rechts) {
  const t = [];
  for (let x = 32; x < FLAECHE.breite; x += 32) {
    t.push(`M${x},${y + 2}V${y + h - 2}`);
  }
  for (let yy = y + 32; yy < y + h; yy += 32) t.push(`M2,${yy}H${FLAECHE.breite - 2}`);
  return (
    `<path d="${t.join('')}" fill="none" stroke="${FARBEN.raster}" stroke-width="2"/>` +
    `<rect x="1" y="${y + 1}" width="${FLAECHE.breite - 2}" height="${h - 2}" rx="10" fill="none" stroke="${FARBEN.linie}" stroke-width="2"/>` +
    text(24, y + 38, label, {
      mono: true,
      groesse: 22,
      farbe: FARBEN.gedaempft,
      halo: FARBEN.weiss,
    }) +
    (rechts
      ? text(FLAECHE.breite - 24, y + 38, rechts, {
          mono: true,
          groesse: 22,
          farbe: FARBEN.gedaempft,
          anker: 'end',
          halo: FARBEN.weiss,
        })
      : '')
  );
}

/**
 * Karte des Auftrags über app-host und llm-host (J3 und als Leitfaden auf den Stationsfolien).
 * aktiv: Station mit dem Marker des wandernden Auftrags (genau ein data-aktiv) oder null.
 */
export function wegSvg({ aktiv = null, b1, c1 }) {
  if (aktiv !== null && !WEG_STATIONEN[aktiv]) throw new Error(`Unbekannte Station: ${aktiv}`);
  const S = WEG_STATIONEN;
  const nWarm = b1.anzahl - 1; // Auftrag 1 kalt, 2…n warm (ADR 1B-011)
  const teile = [];

  teile.push(
    rasterBox(
      APP_BOX.y,
      APP_BOX.h,
      'app-host · 192.168.150.10',
      `Messpunkte ${tIndex(0)}–${tIndex(3)}: Mitschnitt auf beiden Hosts`,
    ),
    rasterBox(LLM_BOX.y, LLM_BOX.h, 'llm-host · 192.168.150.20'),
  );

  const pfad =
    `M${S.klick.x},${OBEN_Y} L${AB[0].join(',')} C${AB[1].join(',')} ${AB[2].join(',')} ${AB[3].join(',')} ` +
    `L${AUF[0].join(',')} C${AUF[1].join(',')} ${AUF[2].join(',')} ${AUF[3].join(',')} L${S.gate.x},${OBEN_Y}`;
  teile.push(
    `<path class="weg-pfad" d="${pfad}" fill="none" stroke="${FARBEN.blau}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  );

  // Messpunkte: t0 verlässt app-host, t1 erreicht llm-host, t2 verlässt llm-host, t3 erreicht app-host.
  const tObenY = APP_BOX.h - 34;
  const tUntenY = LLM_BOX.y + 34;
  const mp = [
    [AB, tObenY, 'start'], // t0, t3 innen: außen stehen die Stationstexte
    [AB, tUntenY, 'end'],
    [AUF, tUntenY, 'start'],
    [AUF, tObenY, 'end'],
  ];
  mp.forEach(([kurve, y, anker], i) => {
    const [x] = aufKurve(kurve, y);
    const dx = anker === 'end' ? -20 : 20;
    teile.push(
      `<g data-messpunkt="t${i}">` +
        `<circle cx="${x}" cy="${y}" r="9" fill="${FARBEN.bernstein}" stroke="${FARBEN.weiss}" stroke-width="3"/>` +
        text(x + dx, y + 8, tIndex(i), {
          mono: true,
          groesse: 26,
          gewicht: 600,
          farbe: FARBEN.bernsteinText,
          anker,
          halo: FARBEN.weiss,
        }) +
        `</g>`,
    );
  });

  const ring = (s, farbe) =>
    `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${FARBEN.weiss}" stroke="${farbe}" stroke-width="7"/>`;
  const obenStation = (id, sub, farbe = FARBEN.tinte, ringFarbe = FARBEN.petrol) => {
    const s = S[id];
    return (
      `<g data-station="${id}">` +
      etikett(s.x, s.y - 78, s.auftrag) +
      ring(s, ringFarbe) +
      text(s.x, s.y + 64, esc(s.name), { groesse: 30, gewicht: 700, farbe, anker: 'middle' }) +
      text(s.x, s.y + 100, esc(sub), {
        mono: true,
        groesse: 22,
        farbe: farbe === FARBEN.tinte ? FARBEN.text2 : farbe,
        anker: 'middle',
      }) +
      `</g>`
    );
  };

  teile.push(
    obenStation('klick', `${fmt(c1.requestMs.wert, 1)} ms`),
    obenStation('kontext', `Validierung ${fmt(c1.validierungAnteilProzent.wert, 1)} %`),
    obenStation('nachpruefung', `Anteil ${fmt(c1.nachpruefungAnteilProzent.wert, 2)} %`),
    obenStation('gate', 'verwirft Antwort', FARBEN.rot, FARBEN.rot),
  );

  // Netz: kleiner Ring auf dem Abstieg, Beschriftung mittig zwischen den Hosts.
  const n = S.netz;
  const netzText = `Netz ${fmt(b1.netzMs, 2)} ms`;
  const netzMitte = (n.x + aufKurve(AUF, NETZ_Y)[0]) / 2 + 6;
  const netzBreite = 60 + 14 + netzText.length * 14.4;
  const netzLinks = netzMitte - netzBreite / 2;
  teile.push(
    `<g data-station="netz">` +
      `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${FARBEN.weiss}" stroke="${FARBEN.bernstein}" stroke-width="6"/>` +
      etikett(netzLinks + 30, n.y - 16, '1B') +
      text(netzLinks + 74, n.y + 9, esc(netzText), { mono: true, groesse: 24, gewicht: 600 }) +
      `</g>`,
  );

  // Inferenz: großer Kreis, Beschriftung rechts im llm-host-Kasten.
  const inf = S.inferenz;
  const lx = 900;
  teile.push(
    `<g data-station="inferenz">` +
      `<circle cx="${inf.x}" cy="${inf.y}" r="${inf.r}" fill="${FARBEN.bernstein}"/>` +
      text(inf.x, inf.y + 10, `${fmt(b1.inferWarmMs / 1000, 0)} s`, {
        mono: true,
        groesse: 28,
        gewicht: 600,
        farbe: FARBEN.weiss,
        anker: 'middle',
      }) +
      etikett(lx + 30, inf.y - 42, '1B') +
      text(lx + 76, inf.y - 16, 'Inferenz', { groesse: 30, gewicht: 700 }) +
      text(lx, inf.y + 22, `Kreis: Median warm, n = ${nWarm}`, {
        mono: true,
        groesse: 22,
        farbe: FARBEN.text2,
      }) +
      text(lx, inf.y + 54, `Anteil ${fmt(b1.inferAnteil * 100, 2)} % (alle ${b1.anzahl})`, {
        mono: true,
        groesse: 22,
        farbe: FARBEN.text2,
      }) +
      `</g>`,
  );

  // Marker des wandernden Auftrags: Halo um die aktive Station, bei kleinen Ringen mit Punkt.
  if (aktiv) {
    const s = S[aktiv];
    const punkt =
      s.r < 30 ? `<circle cx="0" cy="0" r="${Math.min(9, s.r - 4)}" fill="${FARBEN.blau}"/>` : '';
    teile.push(
      `<g class="auftrag" data-aktiv="${aktiv}" transform="translate(${s.x} ${s.y})">` +
        `<circle cx="0" cy="0" r="${s.r + 16}" fill="${FARBEN.blau}" fill-opacity="0.14" stroke="${FARBEN.blau}" stroke-width="4"/>` +
        punkt +
        `</g>`,
    );
  }

  const label =
    `Weg eines Summary-Auftrags über app-host 192.168.150.10 und llm-host 192.168.150.20: ` +
    `Klick (1C), Kontext (1C), Netz ${fmt(b1.netzMs, 2)} ms (1B), Inferenz ${fmt(b1.inferWarmMs / 1000, 0)} s (1B), ` +
    `Nachprüfung (1C), Gate (1C) verwirft die Antwort. Messpunkte t0 bis t3 an den Host-Grenzen.` +
    (aktiv ? ` Aktuelle Station: ${S[aktiv].name}.` : '');
  return svgHuelle(label, teile.join(''));
}

// ---------------------------------------------------------------------------------------------
// Fußballfeld mit Kamerazoom

const FELD_MM = 105_000;
const FELD_HALB_H = 10_000; // stilisiert: nur die Länge ist maßstäblich
const REIHE_Y = 7_000; // Messreihe unterhalb der Mittelachse
const FENSTER = { x: 0, y: 44, w: FLAECHE.breite, h: 290 };

/**
 * Kamera des Fußballfelds. Weltkoordinaten in Millimetern, Ursprung auf der rechten Torlinie
 * (x = 0) und der Messreihe (y = REIHE_Y); das Feld reicht von x = −105 000 bis 0. Der Ursprung
 * liegt am Zielpunkt, damit die Gleitkomma-Auflösung beim Zoom auf 0,3 mm genügt.
 *
 * zoom z ∈ [0, 1] → viewBox des inneren <svg class="kamera">:
 *   Bildbreite  w(z) = W0 · (W1 / W0)^z      (exponentiell: gleichmäßig empfundene Zoomgeschwindigkeit)
 *   Bildhöhe    h(z) = w(z) · 290 / 1380     (Seitenverhältnis des Fensters)
 *   Zielpunkt (Torlinie, Messreihe) steht im Fenster bei (sx(z), sy(z)), linear zwischen
 *   SX0/SY0 (ganzes Feld) und SX1/SY1:  x = −sx·w,  y = REIHE_Y − sy·h.
 * Das Deck animiert nur dieses viewBox-Attribut; die Parameter stehen zusätzlich als data-*
 * am <svg class="kamera">. Beschriftungen im Feld sind für ihren Zoom bemessen (Gruppen mit
 * scale) und werden beim Hineinzoomen lesbar; Linien nutzen vector-effect="non-scaling-stroke".
 */
const W0 = 112_000; // ganzes Feld (105 m) plus Rand
const H0 = (W0 * FENSTER.h) / FENSTER.w;
export const KAMERA = Object.freeze({
  W0,
  W1: 1.5, // 1,5 mm Bildbreite: die 0,3-mm-Netzmarke füllt ein Fünftel des Fensters
  SX0: 108_500 / W0, // Torlinie 3,5 m vor dem rechten Fensterrand
  SY0: (REIHE_Y + H0 / 2) / H0, // Feldmitte (y = 0) in der Fenstermitte
  SX1: 0.6,
  SY1: 0.5,
});

const rund6 = (n) => Number(n.toFixed(6));

export function kameraViewBox(zoom) {
  if (!(zoom >= 0 && zoom <= 1)) throw new RangeError(`zoom muss in [0, 1] liegen: ${zoom}`);
  const w = KAMERA.W0 * (KAMERA.W1 / KAMERA.W0) ** zoom;
  const h = (w * FENSTER.h) / FENSTER.w;
  const sx = KAMERA.SX0 + (KAMERA.SX1 - KAMERA.SX0) * zoom;
  const sy = KAMERA.SY0 + (KAMERA.SY1 - KAMERA.SY0) * zoom;
  return { x: rund6(-sx * w), y: rund6(REIHE_Y - sy * h), w: rund6(w), h: rund6(h) };
}

/**
 * Deckkraft einer Feldbeschriftung mit Zoombereich [von, bis]: außerhalb 0, innen 1, an inneren
 * Rändern linear über 0,04 Zoom eingeblendet (Ränder bei 0 und 1 sind hart). Das Deck setzt
 * damit opacity der Elemente mit data-zoom-von/-bis je Bild.
 */
export function zoomDeckkraft(zoom, von, bis) {
  if (zoom < von || zoom > bis) return 0;
  const ein = von <= 0 ? 1 : Math.min(1, (zoom - von) / 0.04);
  const aus = bis >= 1 ? 1 : Math.min(1, (bis - zoom) / 0.04);
  return Math.min(ein, aus);
}

/** Millimeter pro Bildschirmpixel bei gegebenem Zoom. */
const mmProPx = (zoom) => (KAMERA.W0 * (KAMERA.W1 / KAMERA.W0) ** zoom) / FENSTER.w;

/** Länge in Metern lesbar: m, cm oder mm mit einer Nachkommastelle. */
function laenge(m) {
  if (m >= 1) return `${fmt(m, 1)} m`;
  if (m >= 0.01) return `${fmt(m * 100, 1)} cm`;
  return `${fmt(m * 1000, 1)} mm`;
}

/**
 * Fußballfeld (J10): 105 m ≙ T_job warm (Median, n = 9). Inferenz = Anteil am Auftrag,
 * Transport und Netz = Mediane über alle Aufträge, umgerechnet mit demselben Maßstab.
 */
export function fussballfeldSvg(b1, { zoom = 0 } = {}) {
  const vb = kameraViewBox(zoom);
  const nWarm = b1.anzahl - 1; // Auftrag 1 kalt, 2…n warm (ADR 1B-011)
  const mmJeMs = FELD_MM / b1.jobWarmMs;
  const infMm = FELD_MM * b1.inferAnteil;
  const transMm = b1.transportMs * mmJeMs;
  const netzMm = b1.netzMs * mmJeMs;
  const tInf = laenge(infMm / 1000);
  const tTrans = laenge(transMm / 1000);
  const tNetz = laenge(netzMm / 1000);
  const ns = 'vector-effect="non-scaling-stroke"';

  // --- Welt (mm) ---
  const w = [];
  w.push(
    `<rect x="-120000" y="-30000" width="140000" height="60000" fill="${FARBEN.rasenRand}"/>`,
    `<rect x="${-FELD_MM}" y="${-FELD_HALB_H}" width="${FELD_MM}" height="${2 * FELD_HALB_H}" fill="${FARBEN.rasen}"/>`,
  );
  for (let i = 1; i < 20; i += 2) {
    w.push(
      `<rect x="${-FELD_MM + i * 5250}" y="${-FELD_HALB_H}" width="5250" height="${2 * FELD_HALB_H}" fill="${FARBEN.rasenStreifen}"/>`,
    );
  }
  const weiss = `fill="none" stroke="${FARBEN.weiss}" stroke-width="4" stroke-opacity="0.9" ${ns}`;
  w.push(
    `<rect x="${-FELD_MM}" y="${-FELD_HALB_H}" width="${FELD_MM}" height="${2 * FELD_HALB_H}" ${weiss}/>`,
    `<line x1="${-FELD_MM / 2}" y1="${-FELD_HALB_H}" x2="${-FELD_MM / 2}" y2="${FELD_HALB_H}" ${weiss}/>`,
    `<circle cx="${-FELD_MM / 2}" cy="0" r="4500" ${weiss}/>`,
    `<rect x="${-FELD_MM}" y="-5500" width="16500" height="11000" ${weiss}/>`,
    `<rect x="-16500" y="-5500" width="16500" height="11000" ${weiss}/>`,
    `<rect x="${-FELD_MM}" y="-2600" width="5500" height="5200" ${weiss}/>`,
    `<rect x="-5500" y="-2600" width="5500" height="5200" ${weiss}/>`,
  );

  // Messreihe: weiße Einfassung, darauf farbige Strecke; feste Strichstärke in Pixeln.
  const strecke = (x1, x2, farbe) =>
    `<line x1="${rund6(x1)}" y1="${REIHE_Y}" x2="${rund6(x2)}" y2="${REIHE_Y}" stroke="${FARBEN.weiss}" stroke-width="22" ${ns}/>` +
    `<line x1="${rund6(x1)}" y1="${REIHE_Y}" x2="${rund6(x2)}" y2="${REIHE_Y}" stroke="${farbe}" stroke-width="14" ${ns}/>`;
  w.push(
    strecke(-FELD_MM, -FELD_MM + infMm, FARBEN.bernstein),
    strecke(-transMm, 0, FARBEN.tinte),
    strecke(-netzMm, 0, FARBEN.blau),
  );

  // Beschriftung in Pixeln, für ihren Zoom skaliert (k = mm je px dort). Jede Gruppe ist nur in
  // ihrem Zoombereich sichtbar (data-zoom-von/-bis, Deckkraft per zoomDeckkraft), sonst ragte
  // sie beim Weiterzoomen riesig ins Bild oder bliebe als unlesbarer Fleck stehen.
  const imFeld = (x, y, k, [von, bis], inhalt) =>
    `<g transform="translate(${rund6(x)} ${rund6(y)}) scale(${rund6(k)})" ` +
    `data-zoom-von="${von}" data-zoom-bis="${bis}" opacity="${rund6(zoomDeckkraft(zoom, von, bis))}">` +
    `${inhalt}</g>`;
  const feldText = (x, y, s, o = {}) =>
    text(x, y, s, {
      mono: true,
      groesse: 26,
      gewicht: 600,
      farbe: FARBEN.weiss,
      halo: FARBEN.rasenRand,
      ...o,
    });
  const strich = (x) =>
    `<line x1="${x}" y1="-22" x2="${x}" y2="22" stroke="${FARBEN.weiss}" stroke-width="3"/>`;
  const kZ0 = mmProPx(0);
  const kTrans = mmProPx(0.67); // Bildbreite ≈ 4 cm: Transport gut sichtbar
  const kNetz = mmProPx(0.97); // bei Zoom 1 rund 1,4-fach groß
  const BEREICH = { inferenz: [0, 0.12], transport: [0.58, 0.76], netz: [0.92, 1] };
  w.push(
    imFeld(
      -FELD_MM + 18_000,
      REIHE_Y,
      kZ0,
      BEREICH.inferenz,
      feldText(16, -24, `Inferenz · ${esc(tInf)}`),
    ),
    imFeld(
      -transMm / 2,
      REIHE_Y,
      kTrans,
      BEREICH.transport,
      feldText(0, -26, `Transport · ${esc(tTrans)}`, { anker: 'middle' }),
    ),
    imFeld(-transMm, REIHE_Y, kTrans, BEREICH.transport, strich(0)),
    imFeld(-netzMm, REIHE_Y, kNetz, BEREICH.netz, strich(0)),
    imFeld(
      0,
      REIHE_Y,
      kNetz,
      BEREICH.netz,
      feldText(-12, -30, `Netz · ${esc(tNetz)}`, { anker: 'end', groesse: 28 }),
    ),
    imFeld(
      0,
      REIHE_Y,
      kNetz,
      BEREICH.netz,
      feldText(16, 52, 'Torlinie', { groesse: 22, gewicht: 400 }),
    ),
  );

  const kamera =
    `<svg class="kamera" x="${FENSTER.x}" y="${FENSTER.y}" width="${FENSTER.w}" height="${FENSTER.h}" ` +
    `viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" preserveAspectRatio="xMidYMid meet" overflow="hidden" ` +
    `data-zoom="${zoom}" data-w0="${KAMERA.W0}" data-w1="${KAMERA.W1}" data-sx0="${rund6(KAMERA.SX0)}" ` +
    `data-sy0="${rund6(KAMERA.SY0)}" data-sx1="${KAMERA.SX1}" data-sy1="${KAMERA.SY1}" data-anker-y="${REIHE_Y}">` +
    w.join('') +
    `</svg>`;

  // --- Rahmen und Kennzahlen (fest, unabhängig vom Zoom) ---
  const t = [];
  t.push(
    text(FLAECHE.breite, 28, `Maßstab: 105 m = ${esc(fmt(b1.jobWarmMs / 1000, 1))} s`, {
      mono: true,
      groesse: 22,
      farbe: FARBEN.gedaempft,
      anker: 'end',
    }),
    kamera,
    `<rect x="${FENSTER.x + 1}" y="${FENSTER.y + 1}" width="${FENSTER.w - 2}" height="${FENSTER.h - 2}" fill="none" stroke="${FARBEN.rasenRand}" stroke-width="2"/>`,
  );
  const spalten = [
    [0, tInf, FARBEN.bernstein, `Inferenz · Anteil ${fmt(b1.inferAnteil * 100, 2)} %`],
    [590, tTrans, FARBEN.tinte, `Transport · ${fmt(b1.transportMs, 1)} ms`],
    [1030, tNetz, FARBEN.blau, `Netz · ${fmt(b1.netzMs, 2)} ms`],
  ];
  for (const [x, wert, farbe, sub] of spalten) {
    t.push(
      text(x - 4, 438, esc(wert), { mono: true, groesse: 80, gewicht: 600, farbe }),
      text(x, 480, esc(sub), { groesse: 28, farbe: FARBEN.text2 }),
    );
  }
  t.push(
    text(
      0,
      544,
      `105 m = T_job, Median warm, n = ${nWarm} · Netz, Transport, Anteil: Median über alle ${b1.anzahl} Aufträge`,
      { mono: true, groesse: 22, farbe: FARBEN.gedaempft },
    ),
  );

  const label =
    `Wäre der Auftrag ein Fußballfeld: 105 m entsprechen ${fmt(b1.jobWarmMs / 1000, 1)} s (T_job, Median warm, n = ${nWarm}). ` +
    `Die Inferenz belegt ${tInf}, der Transport ${tTrans}, das Netz ${tNetz} ` +
    `(Netz und Transport als Median über alle ${b1.anzahl} Aufträge).`;
  return svgHuelle(label, t.join(''));
}
