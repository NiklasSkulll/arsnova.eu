// Diagramme für den Folienentwurf 1A im Stil von Jonas' Deck (grafik.mjs: viewBox 1380 × 560,
// Schrift mindestens 22 px, Linien mindestens 2 px, keine IDs). Jede Zahl kommt aus daten-1a.mjs.

import { FARBEN, esc, svgHuelle, text } from '../jonas/grafik.mjs';
import { fmt } from '../jonas/zahlen.mjs';
import { AKTIONEN } from './daten-1a.mjs';

/** Aufbaustufe je Zeile (N5 baut auf Tastendruck auf): Kontrolle, dann kleine Treffer, dann V3. */
export const AUFBAU_STUFE = { V1: 1, V2: 2, V4: 2, V3: 3 };

const ZEILEN = [
  ['V1', 'gg. V0', 'Kontrolle'],
  ['V2', 'gg. V1', 'H1'],
  ['V3', 'gg. V1', 'H2'],
  ['V4', 'gg. V1', 'H2'],
];

/**
 * Alle 80 gepaarten Vergleiche als Raster: Zeile = Variante gegen ihre Basis, Spalten = Block 1–5 mit
 * je vier Aktionen. Grau hält; Bernstein verfehlt nur die relative Regel (+10 %); Rot auch die
 * absolute (+50 ms). In verfehlten Zellen steht der p95-Anstieg in ms.
 */
export function vergleichsMatrixSvg(daten) {
  const zelle = { b: 56, h: 64, luecke: 4, block: 14 };
  const x0 = 140;
  const y0 = 70;
  const zeileH = 80;
  const blockB = 4 * zelle.b + 3 * zelle.luecke;
  const teile = [];
  const proStufe = {}; // Staffelung: Zellen einer Stufe erscheinen kurz nacheinander

  for (let b = 1; b <= 5; b++) {
    const bx = x0 + (b - 1) * (blockB + zelle.block);
    teile.push(
      text(bx + blockB / 2, y0 - 22, `Block ${b}`, {
        groesse: 24,
        gewicht: 600,
        anker: 'middle',
        farbe: FARBEN.text2,
      }),
    );
  }
  ZEILEN.forEach(([v, gegen, rolle], zi) => {
    const y = y0 + zi * zeileH;
    teile.push(text(0, y + 30, `${v} ${gegen}`, { groesse: 24, gewicht: 700 }));
    teile.push(text(0, y + 58, rolle, { groesse: 22, farbe: FARBEN.gedaempft }));
    for (let b = 1; b <= 5; b++) {
      const bx = x0 + (b - 1) * (blockB + zelle.block);
      AKTIONEN.forEach(([aktion], ai) => {
        const c = daten.vergleiche.find(
          (x) => x.variante === v && x.block === b && x.aktion === aktion,
        );
        if (!c) throw new Error(`grafik-1a: Vergleich ${v}/${b}/${aktion} fehlt`);
        const x = bx + ai * (zelle.b + zelle.luecke);
        // Grundzelle immer grau; eine verfehlte Zelle färbt sich erst auf ihrer Aufbaustufe.
        teile.push(
          `<rect x="${x}" y="${y}" width="${zelle.b}" height="${zelle.h}" rx="5" fill="${FARBEN.raster}"/>`,
        );
        if (!c.bestanden) {
          const absolut = !c.absolutBestanden;
          const nr = (proStufe[AUFBAU_STUFE[v]] = (proStufe[AUFBAU_STUFE[v]] ?? -1) + 1);
          teile.push(
            `<g data-ab="${AUFBAU_STUFE[v]}" class="aufbau-zelle${absolut ? ' aufbau-gross' : ''}" style="transition-delay:${nr * 90}ms">` +
              `<rect x="${x}" y="${y}" width="${zelle.b}" height="${zelle.h}" rx="5" ` +
              `fill="${absolut ? FARBEN.rot : FARBEN.bernsteinHell}" stroke="${absolut ? FARBEN.rot : FARBEN.bernstein}" stroke-width="2"/>` +
              text(x + zelle.b / 2, y + zelle.h / 2 + 8, `${Math.round(c.deltaMs)}`, {
                groesse: 22,
                gewicht: 600,
                mono: true,
                anker: 'middle',
                farbe: absolut ? FARBEN.weiss : FARBEN.bernsteinText,
              }) +
              '</g>',
          );
        }
      });
    }
  });

  // Legende: Spalten je Block und die drei Zustände
  const ly = y0 + 4 * zeileH + 46;
  teile.push(
    text(
      x0,
      ly,
      `Spalten je Block: ${AKTIONEN.map(([, n]) => esc(n)).join(' · ')}. Zahl = Anstieg des p95 in ms`,
      {
        groesse: 22,
        farbe: FARBEN.text2,
      },
    ),
  );
  const leg = [
    [FARBEN.raster, 'none', 'hält beide Regeln'],
    [
      FARBEN.bernsteinHell,
      FARBEN.bernstein,
      `verfehlt nur +${fmt(daten.schwellen.relativ * 100)} %`,
    ],
    [FARBEN.rot, FARBEN.rot, `verfehlt auch +${fmt(daten.schwellen.absolutMs)} ms`],
  ];
  let lx = x0;
  for (const [f, r, t] of leg) {
    teile.push(
      `<rect x="${lx}" y="${ly + 22}" width="32" height="32" rx="4" fill="${f}"` +
        (r === 'none' ? '' : ` stroke="${r}" stroke-width="2"`) +
        '/>',
    );
    teile.push(text(lx + 44, ly + 47, esc(t), { groesse: 22, farbe: FARBEN.text2 }));
    lx += 44 + t.length * 12 + 48;
  }

  // Eine Zeile Erklärung je Aufbaustufe, an derselben Stelle (die vorige blendet aus).
  const fehlVon = (vs) =>
    daten.vergleiche.filter(
      (x) => vs.includes(x.variante) && !x.bestanden && !(x.variante === 'V3' && x.block === 5),
    );
  const spanne = (l) =>
    `+${fmt(Math.min(...l.map((x) => x.deltaMs)))} bis +${fmt(Math.max(...l.map((x) => x.deltaMs)))} ms`;
  const kontrolle = fehlVon(['V1']);
  const kleine = fehlVon(['V2', 'V3', 'V4']);
  const stufenText = [
    `${daten.vergleiche.length} gepaarte Vergleiche: jede Aktion, jeder Block, gegen die eigene Basis`,
    `Schon ohne spaCy verfehlt die Kontrolle die Regel ${kontrolle.length}-mal: ${spanne(kontrolle)}`,
    `Mit spaCy (V2, V4) ${kleine.length}-mal, ebenso klein: ${spanne(kleine)}`,
    `spaCy gedrosselt (V3), Block 5: bis +${fmt(daten.v3Block5MaxDeltaMs)} ms, auch über der ${fmt(daten.schwellen.absolutMs)}-ms-Grenze`,
  ];
  stufenText.forEach((t, k) => {
    teile.push(
      `<g data-ab="${k}"${k < stufenText.length - 1 ? ` data-bis="${k}"` : ''} class="aufbau-text">` +
        text(x0, ly + 100, esc(t), {
          groesse: 26,
          gewicht: 700,
          farbe: k === 3 ? FARBEN.rot : FARBEN.tinte,
        }) +
        '</g>',
    );
  });

  const fehl = daten.vergleiche.filter((x) => !x.bestanden).length;
  return svgHuelle(
    `Raster der ${daten.vergleiche.length} gepaarten Vergleiche: ${fehl} verfehlen die Regel, deutlich nur V3 in Block 5.`,
    teile.join(''),
  );
}

/**
 * Zwei Punktdiagramme je Block: links Anteil gedrosselter CPU-Perioden von spaCy (Schwelle 5 %),
 * rechts Speicherspitze von spaCy (80 % von 1 GiB als Schwelle, 1 GiB als Limit).
 */
export function ressourcenSvg(daten) {
  const teile = [];
  const zeilen = ['V2', 'V3', 'V4'];
  const panel = (
    x0,
    breite,
    titel,
    max,
    werte,
    schwelle,
    schwelleText,
    limit,
    einheit,
    striche,
  ) => {
    const y0 = 120;
    const zeileH = 110;
    const sx = (w) => x0 + 90 + ((breite - 110) * w) / max;
    teile.push(text(x0, 40, esc(titel), { groesse: 26, gewicht: 700 }));
    // Achse und Striche
    const yAchse = y0 + zeilen.length * zeileH - 30;
    teile.push(
      `<line x1="${sx(0)}" y1="${yAchse}" x2="${sx(max)}" y2="${yAchse}" stroke="${FARBEN.linie}" stroke-width="2"/>`,
    );
    for (const s of striche) {
      teile.push(
        `<line x1="${sx(s)}" y1="${y0 - 40}" x2="${sx(s)}" y2="${yAchse}" stroke="${FARBEN.raster}" stroke-width="2"/>`,
      );
      teile.push(
        text(sx(s), yAchse + 32, `${fmt(s)}${einheit}`, {
          groesse: 22,
          anker: 'middle',
          farbe: FARBEN.gedaempft,
        }),
      );
    }
    // Schwelle (gestrichelt, rot) und Limit (durchgezogen)
    teile.push(
      `<line x1="${sx(schwelle)}" y1="${y0 - 50}" x2="${sx(schwelle)}" y2="${yAchse}" stroke="${FARBEN.rot}" stroke-width="3" stroke-dasharray="8 6"/>`,
    );
    teile.push(
      text(sx(schwelle) + (limit ? -8 : 8), y0 - 56, esc(schwelleText), {
        groesse: 22,
        gewicht: 600,
        farbe: FARBEN.rot,
        // Rechts neben der Schwelle liegt das Limit: Beschriftung dann links der Linie.
        ...(limit ? { anker: 'end' } : {}),
      }),
    );
    if (limit) {
      teile.push(
        `<line x1="${sx(limit)}" y1="${y0 - 50}" x2="${sx(limit)}" y2="${yAchse}" stroke="${FARBEN.tinte}" stroke-width="3"/>`,
      );
    }
    zeilen.forEach((v, zi) => {
      const y = y0 + zi * zeileH + 10;
      teile.push(text(x0, y + 8, v, { groesse: 26, gewicht: 700 }));
      for (const w of werte[v]) {
        const ueber = w > schwelle;
        teile.push(
          `<circle cx="${Math.round(sx(w) * 100) / 100}" cy="${y}" r="11" fill="${ueber ? FARBEN.rot : FARBEN.blau}" fill-opacity="0.75" stroke="${FARBEN.weiss}" stroke-width="2"/>`,
        );
      }
    });
  };
  panel(
    0,
    640,
    'spaCy: gedrosselte CPU-Perioden je Block',
    100,
    daten.drosselung,
    daten.schwellen.drosselung * 100,
    `Schwelle ${fmt(daten.schwellen.drosselung * 100)} %`,
    null,
    ' %',
    [0, 25, 50, 75, 100],
  );
  panel(
    720,
    600,
    'spaCy: Speicherspitze je Block',
    daten.v2.limitMiB,
    daten.speicher,
    daten.v2.limitMiB * daten.schwellen.speicher,
    `Schwelle ${fmt(daten.schwellen.speicher * 100)} % von 1 GiB`,
    daten.v2.limitMiB,
    '',
    [0, 256, 512, 768, 1024],
  );
  teile.push(
    text(720, 520, 'MiB; schwarze Linie: Limit 1 GiB je Container', {
      groesse: 22,
      farbe: FARBEN.gedaempft,
    }),
  );
  teile.push(
    text(0, 520, 'je Punkt ein Block (5 je Variante)', { groesse: 22, farbe: FARBEN.gedaempft }),
  );
  const [v3min, v3max] = daten.v3.drosselProzent.map((p) => fmt(p));
  return svgHuelle(
    `Drosselung und Speicher von spaCy je Block: V2 und V4 kaum gedrosselt, V3 zu ${v3min} bis ${v3max} Prozent; Speicher überall unter der Schwelle.`,
    teile.join(''),
  );
}
