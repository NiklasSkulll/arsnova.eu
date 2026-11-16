// Wegkarten oben links (Ortsmarke ohne Bewegung und wandernder Marker): eine Bildsprache für alle Teile.
// Eine dünne Linie mit runden Stationen, oben der App-Host, unten der zweite Host bzw. der Analysezweig;
// hervorgehoben ist nur der Ort der Folie, beschriftet mit Name und Etikett. Beide Wege (Jonas' Auftrag,
// Niklas' 1A) entstehen aus denselben Maßen (KARTE) und derselben Zeichenfunktion (karteSvg), damit ihre
// Geometrie nicht auseinanderläuft. Das frühere verkleinerte Systembild (systemMini) ist ersetzt.
import { WEG_STATIONEN } from './grafik.mjs';

const r2 = (n) => Math.round(n * 100) / 100;
const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Maße jeder Wegkarte in px (deck-vorlage.html .weg-mini, .weg-marke): oben und unten die beiden Ebenen,
 * Linie 3 px, Stationsring r 6,5 mit 3 px Rand, Hauptstation gefüllt r 9, Hervorhebung einer Strecke als
 * Saum (14 px, 16 % Deckkraft) wie der Ring des Markers (.weg-punkt). x aus WEG_STATIONEN mit Faktor 0,36.
 */
export const KARTE = Object.freeze({
  breite: 450,
  hoehe: 52,
  oben: 15,
  unten: 40,
  x0: 20,
  faktor: 0.36,
  linie: 3,
  ring: 6.5,
  ringRand: 3,
  kern: 9,
  saum: 14,
  saumDeckkraft: 0.16,
});

// ------------------------------------------------------------------ gemeinsame Geometrie

const k = (a, b) => (b - a) * 0.5; // Steuerpunkte wie eine weiche S-Kurve
/** S-Kurve von (xa, ya) nach (xb, yb), waagerecht ein- und auslaufend. */
const kurve = ([xa, ya], [xb, yb]) => [
  'C',
  [xa, ya],
  [xa + k(xa, xb), ya],
  [xb - k(xa, xb), yb],
  [xb, yb],
];
const gerade = (a, b) => ['L', a, b];

/** SVG-Pfad aus Segmenten (['L', a, b] oder ['C', p0, p1, p2, p3]). */
function pfadD(segmente) {
  return (
    `M${r2(segmente[0][1][0])} ${r2(segmente[0][1][1])}` +
    segmente
      .map(([typ, , ...p]) =>
        typ === 'L'
          ? `L${r2(p[0][0])} ${r2(p[0][1])}`
          : `C${p.map((q) => q.map(r2).join(' ')).join(' ')}`,
      )
      .join('')
  );
}

/** Punkte entlang der Segmente mit Bogenlänge (für Stationen auf der Linie und offset-path-Anteile). */
function abtasten(segmente) {
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
  /** Nächster Punkt auf der Linie zu (x, y) samt Anteil der Bogenlänge in %. */
  const naechster = ([x, y]) => {
    let best = 0;
    for (let i = 1; i < punkte.length; i++) {
      if (
        Math.hypot(punkte[i][0] - x, punkte[i][1] - y) <
        Math.hypot(punkte[best][0] - x, punkte[best][1] - y)
      )
        best = i;
    }
    return {
      x: r2(punkte[best][0]),
      y: r2(punkte[best][1]),
      anteil: r2((laenge[best] / laenge.at(-1)) * 100),
    };
  };
  return naechster;
}

// ------------------------------------------------------------------ Weg 1: Jonas' Auftrag (J3 verkleinert)

const mx = (x) => Math.round((KARTE.x0 + (x - WEG_STATIONEN.klick.x) * KARTE.faktor) * 10) / 10;

/**
 * Weg des Auftrags aus J3: oben app-host (Klick, Kontext, Nachprüfung, Gate), Senke zum llm-host (Netz,
 * Inferenz). Kurven wie in J3 (Abstieg ab Kontext + 110, Boden bei Inferenz − 80 usw.). Der Abschnitt
 * „zweiterHost“ (Abstieg, Boden, Aufstieg) ist die Strecke, die 1B 3–4 stört.
 */
function wegAuftrag() {
  const S = WEG_STATIONEN;
  const { oben: o, unten: u } = KARTE;
  const ab = [mx(S.kontext.x + 110), mx(S.inferenz.x - 80)];
  const auf = [mx(S.inferenz.x + 80), mx(S.nachpruefung.x - 90)];
  const zweiterHost = [
    kurve([ab[0], o], [ab[1], u]),
    gerade([ab[1], u], [auf[0], u]),
    kurve([auf[0], u], [auf[1], o]),
  ];
  const segmente = [
    gerade([mx(S.klick.x), o], [ab[0], o]),
    ...zweiterHost,
    gerade([auf[1], o], [mx(S.gate.x), o]),
  ];
  const naechster = abtasten(segmente);
  const ziel = {
    klick: [mx(S.klick.x), o],
    kontext: [mx(S.kontext.x), o],
    netz: [(ab[0] + ab[1]) / 2, (o + u) / 2],
    inferenz: [mx(S.inferenz.x), u],
    nachpruefung: [mx(S.nachpruefung.x), o],
    gate: [mx(S.gate.x), o],
  };
  const farbe = (name) =>
    name === 'gate'
      ? 'var(--rot)'
      : S[name].auftrag === '1B'
        ? 'var(--bernstein)'
        : 'var(--petrol)';
  const stationen = {};
  for (const [name, p] of Object.entries(ziel)) {
    stationen[name] = {
      ...naechster(p),
      auftrag: S[name].auftrag,
      name: S[name].name,
      farbe: farbe(name),
      kern: name === 'inferenz',
    };
  }
  return Object.freeze({
    id: 'auftrag',
    linien: [{ d: pfadD(segmente), farbe: 'var(--blau)' }],
    d: pfadD(segmente),
    abschnitte: { zweiterHost: pfadD(zweiterHost) },
    stationen,
  });
}

// ------------------------------------------------------------------ Weg 2: Niklas' 1A

/**
 * Weg 1A in derselben Bildsprache: oben der Live-Pfad (Teilnehmende → App → Datenbank → Antwort), von der
 * App zweigt nach unten rechts die optionale Analyse ab (Analyse → spaCy → Ersatz → Wortwolke). Ersatz steht
 * auf dem Zweig, weil die App nach 5 s ohne spaCy-Antwort die lexikalische Wortwolke liefert. Der Abzweig
 * hat dieselbe S-Kurve wie die Senke im Auftragsweg (Breite 160 · 0,36). Neutral gezeichnet; hervorgehoben
 * wird nur der Ort der Folie in Blau (1A).
 */
function weg1A() {
  const { oben: o, unten: u, faktor } = KARTE;
  const x = { teilnehmende: 20, app: 110, datenbank: 288, antwort: 432.8 };
  const abzweig = [x.app + 22, x.app + 22 + 160 * faktor];
  const zx = { analyse: 216, spacy: 288, ersatz: 360, wortwolke: 432.8 };
  const haupt = [gerade([x.teilnehmende, o], [x.antwort, o])];
  const zweig = [
    gerade([x.app, o], [abzweig[0], o]),
    kurve([abzweig[0], o], [abzweig[1], u]),
    gerade([abzweig[1], u], [zx.wortwolke, u]),
  ];
  const namen = {
    teilnehmende: 'Teilnehmende',
    app: 'App',
    datenbank: 'Datenbank',
    antwort: 'Antwort',
    analyse: 'Analyse',
    spacy: 'spaCy',
    ersatz: 'Ersatz',
    wortwolke: 'Wortwolke',
  };
  const stationen = {};
  for (const [n, xx] of Object.entries(x)) stationen[n] = { x: xx, y: o };
  for (const [n, xx] of Object.entries(zx)) stationen[n] = { x: xx, y: u };
  for (const [n, s] of Object.entries(stationen)) {
    Object.assign(s, {
      name: namen[n],
      auftrag: '1A',
      farbe: 'var(--gedaempft)',
      kern: n === 'spacy',
    });
  }
  return Object.freeze({
    id: '1a',
    linien: [
      { d: pfadD(haupt), farbe: 'var(--linie)' },
      { d: pfadD(zweig), farbe: 'var(--linie)' },
    ],
    abschnitte: { haupt: pfadD(haupt), zweig: pfadD(zweig) },
    // Wirkungszeichen auf dem Live-Pfad zwischen App und Datenbank (N7)
    wirkung: { x: r2((abzweig[1] + x.datenbank) / 2), y: o },
    stationen,
  });
}

export const WEG_AUFTRAG = wegAuftrag();
export const WEG_1A = weg1A();
const WEGE = { auftrag: WEG_AUFTRAG, '1a': WEG_1A };

// ------------------------------------------------------------------ Zeichnen

/** Störungszeichen (1B 3–4), 22 px wie die Etiketten, in Bernstein; Reihenfolge wie STOERUNGEN auf M1. */
export const STOERUNG_ZEICHEN = Object.freeze({
  stopp: {
    text: 'Stopp',
    svg: '<rect x="5" y="5" width="12" height="12" rx="2" fill="currentColor"/>',
  },
  belegt: {
    text: 'Slot belegt',
    svg: '<circle cx="11" cy="11" r="7.5" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M6.5 11h9" stroke="currentColor" stroke-width="3"/>',
  },
  drop: {
    text: 'DROP',
    svg: '<path d="M2.5 11h11M9.5 6.5l4.5 4.5-4.5 4.5M18.5 4v14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  spaet: {
    text: 'zu spät',
    svg: '<circle cx="11" cy="11" r="7.5" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M11 6.5V11l3.2 2.2" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
});
const zeichen = (name) =>
  `<svg class="weg-zeichen" data-zeichen="${name}" viewBox="0 0 22 22" width="22" height="22" aria-hidden="true" focusable="false">${STOERUNG_ZEICHEN[name].svg}</svg>`;

/**
 * Zeichnet eine Wegkarte: Linien, hervorgehobene Abschnitte (Saum und Linie in der Farbe des Teils),
 * Stationen (Ring, Hauptstation gefüllt), optional das Wirkungszeichen. Keine Beschriftung, kein Marker.
 * @param {typeof WEG_AUFTRAG} weg
 * @param {{ abschnitte?: { name: string, gestrichelt?: boolean }[], farbe?: string, wirkung?: boolean }} o
 */
export function karteSvg(weg, { abschnitte = [], farbe = 'var(--blau)', wirkung = false } = {}) {
  const K = KARTE;
  const linien = weg.linien
    .map(
      (l) =>
        `<path d="${l.d}" fill="none" stroke="${l.farbe}" stroke-width="${K.linie}" stroke-linecap="round"/>`,
    )
    .join('');
  const hervor = abschnitte
    .map(({ name, gestrichelt }) => {
      const d = weg.abschnitte[name];
      if (!d) throw new Error(`Unbekannter Abschnitt ${name} auf Weg ${weg.id}`);
      const strich = gestrichelt ? ' stroke-dasharray="7 6"' : '';
      return (
        `<g data-abschnitt="${name}"><path d="${d}" fill="none" stroke="${farbe}" stroke-opacity="${K.saumDeckkraft}" stroke-width="${K.saum}" stroke-linecap="round"/>` +
        `<path d="${d}" fill="none" stroke="${farbe}" stroke-width="${K.linie}" stroke-linecap="round"${strich}/></g>`
      );
    })
    .join('');
  const kreise = Object.entries(weg.stationen)
    .map(([name, s]) =>
      s.kern
        ? `<circle data-station="${name}" cx="${s.x}" cy="${s.y}" r="${K.kern}" fill="${s.farbe}"/>`
        : `<circle data-station="${name}" cx="${s.x}" cy="${s.y}" r="${K.ring}" fill="#fff" stroke="${s.farbe}" stroke-width="${K.ringRand}"/>`,
    )
    .join('');
  // Wirkung: kleiner Ausschlag auf der Linie (Latenzspitze), in der Farbe des Teils
  const w = wirkung && weg.wirkung;
  const ausschlag = w
    ? `<path data-wirkung d="M${w.x - 14} ${w.y}h5l4 -11 5 22 4 -11h5" fill="none" stroke="${farbe}" stroke-width="${K.linie}" stroke-linecap="round" stroke-linejoin="round"/>`
    : '';
  return (
    `<svg class="weg-mini-karte" data-weg="${weg.id}" viewBox="0 0 ${K.breite} ${K.hoehe}" width="${K.breite}" height="${K.hoehe}" aria-hidden="true" focusable="false">` +
    `${linien}${hervor}${ausschlag}${kreise}</svg>`
  );
}

const etikett = (auftrag) =>
  `<span class="etikett etikett-${auftrag.toLowerCase()}">${auftrag}</span>`;

// ------------------------------------------------------------------ Jonas' Stationsfolien (Marker)

/**
 * Kleine Wegkarte auf Jonas' Stationsfolien; mit `aktiv` steht der Marker fest an der Station (Druck/PDF),
 * mit `wandernd` fährt er per offset-path (deck.js).
 */
export function wegMini({ aktiv = null, wandernd = false } = {}) {
  const { d, stationen } = WEG_AUFTRAG;
  const karte = karteSvg(WEG_AUFTRAG);
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

// ------------------------------------------------------------------ Wegmarken (feste Ortsmarke)

/**
 * Wegmarken der Folien ohne Station (Folienfeld `marke`): Weg, Hervorhebung, Beschriftung, Etikett.
 * - station: Marker (.weg-punkt) an dieser Station
 * - abschnitte: hervorgehobene Strecken (Saum und Linie in der Farbe des Teils)
 * - wirkung: Ausschlag auf dem Live-Pfad
 * - stufen: Beschriftung und Störungszeichen je Aufbaustufe (M1; Stufen wie STUFE_1B34 in folien-1b34.mjs)
 * 1A hebt in Blau hervor, 1B 3–4 in Bernstein; J1 zeigt den ganzen Weg ohne Hervorhebung.
 */
export const MARKEN = Object.freeze({
  auftrag: { weg: 'auftrag', teil: ['1C', '1B'], text: 'Weg eines Auftrags' },
  '1a-app': { weg: '1a', teil: ['1A'], station: 'app', text: 'App-Host' },
  '1a-spacy': { weg: '1a', teil: ['1A'], station: 'spacy', text: 'spaCy' },
  '1a-live': { weg: '1a', teil: ['1A'], abschnitte: [{ name: 'haupt' }], text: 'Live-Pfad' },
  '1a-regel': {
    weg: '1a',
    teil: ['1A'],
    abschnitte: [{ name: 'haupt' }, { name: 'zweig', gestrichelt: true }],
    text: 'Live-Pfad gegen Analyse',
  },
  '1a-wirkung': {
    weg: '1a',
    teil: ['1A'],
    station: 'spacy',
    wirkung: true,
    text: 'spaCy · Wirkung auf Live-Pfad',
  },
  '1a-ersatz': { weg: '1a', teil: ['1A'], station: 'ersatz', text: 'Ersatz' },
  '1a-wortwolke': { weg: '1a', teil: ['1A'], station: 'wortwolke', text: 'Wortwolke' },
  '1b-stoerung': {
    weg: 'auftrag',
    teil: ['1B'],
    abschnitte: [{ name: 'zweiterHost' }],
    farbe: 'var(--bernstein)',
    stufen: [
      { ab: 0, bis: 0, text: 'Zweiter Host · Normalbetrieb', zeichen: [] },
      { ab: 1, bis: 1, text: 'Zweiter Host · Stopp, Slot belegt', zeichen: ['stopp', 'belegt'] },
      { ab: 2, bis: 2, text: 'Zweiter Host · DROP', zeichen: ['drop'] },
      { ab: 3, text: 'Zweiter Host · zu spät', zeichen: ['spaet'] },
    ],
  },
  '1b-alle': {
    weg: 'auftrag',
    teil: ['1B'],
    abschnitte: [{ name: 'zweiterHost' }],
    farbe: 'var(--bernstein)',
    zeichen: ['stopp', 'belegt', 'drop', 'spaet'],
    text: 'Zweiter Host · alle Störungen',
  },
});

/** Sichtbarer Text einer Wegmarke (für aria-label und Tests): je Stufe getrennt durch „, dann “. */
export function markeText(name) {
  const m = MARKEN[name];
  if (!m) throw new Error(`Unbekannte Wegmarke: ${name}`);
  return m.stufen ? m.stufen.map((s) => s.text).join(', dann ') : m.text;
}

/** Feste Wegmarke oben links (druckfest, ohne Bewegung) im Platz von Jonas' Wegkarte. */
export function wegMarke(name) {
  const m = MARKEN[name];
  if (!m) throw new Error(`Unbekannte Wegmarke: ${name}`);
  const weg = WEGE[m.weg];
  const karte = karteSvg(weg, { abschnitte: m.abschnitte, farbe: m.farbe, wirkung: m.wirkung });
  const s = m.station ? weg.stationen[m.station] : null;
  if (m.station && !s) throw new Error(`Unbekannte Station ${m.station} auf Weg ${m.weg}`);
  const punkt = s ? `<div class="weg-punkt" style="left:${s.x}px;top:${s.y}px"></div>` : '';
  const zeichenText = (z) => z.map(zeichen).join('');
  const name1 = (text, z = []) =>
    `<span class="weg-name">${esc(text)}</span>${z.length ? `<span class="weg-zeichen-reihe">${zeichenText(z)}</span>` : ''}`;
  const inhalt = m.stufen
    ? `<span class="weg-stufen">${m.stufen
        .map(
          (st) =>
            `<span class="weg-stufe" data-ab="${st.ab}"${st.bis === undefined ? '' : ` data-bis="${st.bis}"`}>${name1(st.text, st.zeichen)}</span>`,
        )
        .join('')}</span>`
    : name1(m.text, m.zeichen ?? []);
  const label = `Ort auf dem Weg: ${markeText(name)} (${m.teil.join(', ')})`;
  return (
    `<div class="weg-mini weg-marke" data-marke="${esc(name)}"${m.station ? ` data-aktiv="${m.station}"` : ''} role="img" aria-label="${esc(label)}">` +
    karte +
    punkt +
    `<p class="weg-beschriftung" aria-hidden="true">${inhalt}${m.teil.map(etikett).join('')}</p></div>`
  );
}
