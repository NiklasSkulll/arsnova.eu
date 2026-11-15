import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  FLAECHE,
  fussballfeldSvg,
  kameraViewBox,
  logX,
  wegSvg,
  WEG_STATIONEN,
  zeitzerlegungSvg,
  zoomDeckkraft,
} from './grafik.mjs';
import { ladeZahlen } from './zahlen.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HIER, '../..');
const { b1, c1 } = ladeZahlen(ROOT);
const ACHSE = { x0: 250, x1: 1330, minMs: 0.1, maxMs: 1_000_000 };

const anzahl = (text, muster) => (text.match(muster) || []).length;

/** Gemeinsame Regeln für jede Grafik: Barrierefreiheit, Größen, explizite Farben. */
function pruefeSvg(svg) {
  assert.match(svg, /^<svg [^>]*role="img"/);
  assert.match(svg, /aria-label="[^"]{20,}"/);
  assert.match(svg, new RegExp(`viewBox="0 0 ${FLAECHE.breite} ${FLAECHE.hoehe}"`));
  for (const [, px] of svg.matchAll(/font-size="([\d.]+)"/g)) {
    assert.ok(Number(px) >= 22, `Schrift ${px} px < 22 px`);
  }
  for (const [, px] of svg.matchAll(/stroke-width="([\d.]+)"/g)) {
    assert.ok(Number(px) >= 2, `Linie ${px} px < 2 px`);
  }
  assert.doesNotMatch(svg, /NaN|undefined|Infinity/);
  assert.doesNotMatch(svg, /currentColor/);
}

test('logX: 0,1 ms links, 1000 s rechts, eine Dekade = ein Siebtel', () => {
  assert.equal(logX(0.1, ACHSE), ACHSE.x0);
  assert.equal(logX(1_000_000, ACHSE), ACHSE.x1);
  const dekade = (ACHSE.x1 - ACHSE.x0) / 7;
  assert.ok(Math.abs(logX(1, ACHSE) - (ACHSE.x0 + dekade)) < 1e-9);
  assert.ok(Math.abs(logX(1000, ACHSE) - (ACHSE.x0 + 4 * dekade)) < 1e-9);
});

test('zeitzerlegungSvg: Werte, Schwellen und Gruppen der Mediane', () => {
  const svg = zeitzerlegungSvg(b1);
  pruefeSvg(svg);
  for (const t of ['0,43 ms', '17,8 ms', '101 ms', '148,3 s', 'Schwelle 50 ms', 'Schwelle 2 s']) {
    assert.ok(svg.includes(t), `fehlt: ${t}`);
  }
  assert.ok(svg.includes('99,92 %'));
  // Review Focus 1: Gruppen getrennt benannt (alle 10 vs. warm n = 9 vs. Kaltläufe).
  assert.ok(svg.includes('alle 10'));
  assert.ok(svg.includes('warm, n = 9'));
  assert.ok(svg.includes('200,5 s'));
  assert.ok(!zeitzerlegungSvg(b1, { kalt: false }).includes('200,5 s'));
});

test('wegSvg: genau ein aktiver Marker, Stationen, Etiketten, Hosts, Messpunkte', () => {
  const svg = wegSvg({ aktiv: 'inferenz', b1, c1 });
  pruefeSvg(svg);
  assert.equal(anzahl(svg, /data-aktiv="/g), 1);
  assert.equal(anzahl(svg, /data-aktiv="inferenz"/g), 1);
  for (const s of ['klick', 'kontext', 'netz', 'inferenz', 'nachpruefung', 'gate']) {
    assert.equal(anzahl(svg, new RegExp(`data-station="${s}"`, 'g')), 1, s);
    assert.ok(WEG_STATIONEN[s], s);
  }
  assert.ok(svg.includes('192.168.150.10') && svg.includes('192.168.150.20'));
  assert.equal(anzahl(svg, /data-etikett="1C"/g), 4);
  assert.equal(anzahl(svg, /data-etikett="1B"/g), 2);
  assert.equal(anzahl(svg, /data-messpunkt="t[0-3]"/g), 4);
  assert.ok(svg.includes('0,43 ms') && svg.includes('99,92 %'));

  for (const s of Object.keys(WEG_STATIONEN)) {
    const andere = wegSvg({ aktiv: s, b1, c1 });
    assert.equal(anzahl(andere, /data-aktiv="/g), 1, s);
    assert.ok(andere.includes(`data-aktiv="${s}"`));
  }
  assert.equal(anzahl(wegSvg({ aktiv: null, b1, c1 }), /data-aktiv="/g), 0);
  assert.throws(() => wegSvg({ aktiv: 'unbekannt', b1, c1 }));
});

test('fussballfeldSvg: Maßstab aus T_job warm, Gruppen in der Bildunterschrift', () => {
  const svg = fussballfeldSvg(b1, { zoom: 0 });
  pruefeSvg(svg);
  for (const t of ['0,3 mm', '1,3 cm', '104,9 m', '148,6 s', 'alle 10']) {
    assert.ok(svg.includes(t), `fehlt: ${t}`);
  }
  assert.ok(svg.includes('warm, n = 9'));
});

test('fussballfeldSvg: Zoom 0 zeigt das ganze Feld, Zoom 1 die 0,3-mm-Marke', () => {
  const ganz = kameraViewBox(0);
  assert.ok(ganz.x <= -105_000 && ganz.x + ganz.w >= 0, 'ganzes Feld sichtbar');
  const nah = kameraViewBox(1);
  const netzMm = (b1.netzMs / b1.jobWarmMs) * 105_000;
  assert.ok(nah.x < -netzMm && nah.x + nah.w > 0, 'Netzmarke vollständig sichtbar');
  assert.ok(netzMm / nah.w > 0.15, 'Netzmarke deutlich sichtbar (> 15 % der Bildbreite)');
  // Monoton: die Bildbreite schrumpft mit dem Zoom.
  let vorher = Infinity;
  for (let z = 0; z <= 1.0001; z += 0.1) {
    const v = kameraViewBox(z);
    assert.ok(v.w < vorher);
    vorher = v.w;
  }
  const s1 = fussballfeldSvg(b1, { zoom: 1 });
  const vb = kameraViewBox(1);
  assert.ok(s1.includes(`viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}"`));
  assert.throws(() => fussballfeldSvg(b1, { zoom: 1.5 }));
});

test('stil.css: Schriften laden wirklich (keine stille Ersatzschrift)', async () => {
  const css = readFileSync(join(HIER, 'stil.css'), 'utf8');
  const urls = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]);
  assert.equal(urls.length, 6);
  for (const u of urls) {
    assert.ok(!/^https?:/.test(u), `extern: ${u}`);
    assert.ok(existsSync(join(HIER, u)), `fehlt: ${u}`);
  }
  for (const t of ['#0b5ea8', '#0f766e', '#b45309', '#b42318']) assert.ok(css.includes(t), t);

  const require = createRequire(resolve(ROOT, '../../package.json'));
  const { chromium } = require('playwright');
  const tmp = mkdtempSync(join(tmpdir(), 'grafik-'));
  const browser = await chromium.launch();
  try {
    const seite = (kopf) =>
      `<!doctype html><html><head><meta charset="utf-8">${kopf}</head>` +
      `<body><p style="font:600 24px Inter">Aa</p><p style="font:400 24px 'IBM Plex Mono'">0,43</p></body></html>`;
    const pruefe = async (datei) => {
      const page = await browser.newPage();
      await page.goto(pathToFileURL(datei).href);
      const r = await page.evaluate(async () => {
        await Promise.allSettled([
          document.fonts.load('600 24px Inter'),
          document.fonts.load('400 24px "IBM Plex Mono"'),
        ]);
        await document.fonts.ready;
        const geladen = [...document.fonts]
          .filter((f) => f.status === 'loaded')
          .map((f) => `${f.family.replace(/"/g, '')} ${f.weight}`);
        return {
          inter: document.fonts.check('600 24px Inter'),
          mono: document.fonts.check('400 24px "IBM Plex Mono"'),
          geladen,
        };
      });
      await page.close();
      return r;
    };

    const gut = join(tmp, 'gut.html');
    writeFileSync(
      gut,
      seite(`<link rel="stylesheet" href="${pathToFileURL(join(HIER, 'stil.css'))}">`),
    );
    const r = await pruefe(gut);
    assert.equal(r.inter, true);
    assert.equal(r.mono, true);
    // check() ist auch wahr, wenn keine Schrift passt; deshalb die geladenen Faces prüfen.
    assert.ok(r.geladen.includes('Inter 600'), r.geladen.join());
    assert.ok(r.geladen.includes('IBM Plex Mono 400'), r.geladen.join());

    // Gegenprobe: dieselbe CSS ohne erreichbare Dateien muss auffallen.
    const kaputt = join(tmp, 'kaputt.html');
    writeFileSync(kaputt, seite(`<style>${css}</style>`));
    const k = await pruefe(kaputt);
    assert.equal(k.inter, false);
    assert.ok(!k.geladen.includes('Inter 600'));
  } finally {
    await browser.close();
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('fussballfeldSvg: Feldbeschriftungen nur in ihrem Zoombereich sichtbar', () => {
  assert.equal(zoomDeckkraft(0, 0, 0.12), 1);
  assert.equal(zoomDeckkraft(0.5, 0, 0.12), 0);
  assert.equal(zoomDeckkraft(1, 0.92, 1), 1);
  assert.equal(zoomDeckkraft(0.85, 0.92, 1), 0);
  assert.ok(zoomDeckkraft(0.93, 0.92, 1) > 0 && zoomDeckkraft(0.93, 0.92, 1) < 1);
  const deckkraft = (svg, inhalt) => {
    const g = svg.split('<g ').find((t) => t.includes(inhalt) && t.includes('data-zoom-von'));
    return Number(g.match(/opacity="([\d.]+)"/)[1]);
  };
  const s085 = fussballfeldSvg(b1, { zoom: 0.85 });
  assert.equal(deckkraft(s085, 'Transport · 1,3 cm'), 0);
  assert.equal(deckkraft(s085, 'Netz · 0,3 mm'), 0);
  assert.equal(deckkraft(fussballfeldSvg(b1, { zoom: 1 }), 'Netz · 0,3 mm'), 1);
  assert.equal(deckkraft(fussballfeldSvg(b1, { zoom: 0 }), 'Inferenz · 104,9 m'), 1);
});
