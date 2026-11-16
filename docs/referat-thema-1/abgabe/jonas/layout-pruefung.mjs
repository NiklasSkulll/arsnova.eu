// Layoutwächter für Decks aus baueDeck (genutzt von deck.test.mjs und abgabe/niklas/entwurf.test.mjs).
// Misst im Druckmodus je Folie: alles in der Bühne, Titel einzeilig, keine Überlappungen.
/* global document, getComputedStyle */
import { pathToFileURL } from 'node:url';

/**
 * Layoutbefunde je Folie, gemessen im Druckmodus (alle Folien stehen untereinander, J10 im Endbild).
 * Wächter für Fehler der Art „Code-Block läuft durch die Belegzeile“ (V1) und „zweizeiliger Titel
 * trifft die Frage“ (V2).
 * @param {import('playwright').Browser} browser
 * @param {string} pfad Deck-HTML
 * @returns {Promise<string[]>}
 */
export async function layoutBefunde(browser, pfad) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  await page.goto(pathToFileURL(pfad).href);
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(300);
  const befunde = await page.evaluate(() => {
    const fehler = [];
    const r = (el, s) => {
      const b = el.getBoundingClientRect();
      return { l: b.left - s.left, t: b.top - s.top, r: b.right - s.left, b: b.bottom - s.top };
    };
    const schneiden = (a, b) => a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;
    const name = (el) =>
      `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : ''}` +
      `„${(el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 30)}“`;
    for (const folie of document.querySelectorAll('.folie:not(.folie-bild)')) {
      const id = folie.dataset.id;
      const s = folie.getBoundingClientRect();
      const titel = folie.querySelector('.folie-titel');
      const flaeche = folie.querySelector('.folie-flaeche');
      const fuss = folie.querySelector('.folie-fuss');
      const kopf = [...folie.querySelectorAll('.weg-mini-statisch, .weg-exkurs, .teilleiste')];
      // 1. alles innerhalb der Bühne 1600 × 900 (SVG-Inneres zählt über sein <svg>)
      for (const el of folie.querySelectorAll('*')) {
        if (el.parentElement?.closest('svg')) continue;
        const b = r(el, s);
        if (b.r - b.l === 0 && b.b - b.t === 0) continue;
        if (b.l < -1 || b.t < -1 || b.r > 1601 || b.b > 901)
          fehler.push(`${id}: ${name(el)} außerhalb der Bühne`);
      }
      // 2. Titel einzeilig
      const lh = parseFloat(getComputedStyle(titel).lineHeight);
      if (titel.getBoundingClientRect().height > lh * 1.5) fehler.push(`${id}: Titel zweizeilig`);
      // 3. Kopf (Wegkarte, Exkurs), Titel, Fläche, Fußzeile überlappen nicht
      const bloecke = [...kopf, titel, fuss];
      for (let i = 0; i < bloecke.length; i++) {
        for (let j = i + 1; j < bloecke.length; j++) {
          if (schneiden(r(bloecke[i], s), r(bloecke[j], s)))
            fehler.push(`${id}: ${name(bloecke[i])} trifft ${name(bloecke[j])}`);
        }
      }
      // 4. Jedes Element der Fläche bleibt in der Fläche und trifft weder Titel noch Fußzeile
      //    (außer absolut gesetzten Vermerken über dem Titel, etwa dem Entwurfsvermerk).
      const fl = r(flaeche, s);
      for (const el of flaeche.querySelectorAll('*')) {
        if (el.parentElement?.closest('svg')) continue;
        const b = r(el, s);
        if (b.r - b.l === 0 || b.b - b.t === 0) continue;
        const vermerk = getComputedStyle(el).position === 'absolute' && b.b <= r(titel, s).t;
        for (const k of [titel, fuss, ...kopf]) {
          if (schneiden(b, r(k, s))) fehler.push(`${id}: ${name(el)} trifft ${name(k)}`);
        }
        if (vermerk) continue;
        if (b.l < fl.l - 1 || b.r > fl.r + 1 || b.t < fl.t - 1 || b.b > fl.b + 1)
          fehler.push(`${id}: ${name(el)} ragt aus der Fläche`);
      }
      // 5. Geschwister im Fluss (Frage, Liste, Kasten, Code, Beleg) überlappen sich nicht
      const inhalt = flaeche.querySelector('.flaeche-inhalt') ?? flaeche;
      const kinder = [...inhalt.children].filter(
        (k) => getComputedStyle(k).position !== 'absolute',
      );
      for (let i = 0; i < kinder.length; i++) {
        for (let j = i + 1; j < kinder.length; j++) {
          if (schneiden(r(kinder[i], s), r(kinder[j], s)))
            fehler.push(`${id}: ${name(kinder[i])} trifft ${name(kinder[j])}`);
        }
      }
    }
    return [...new Set(fehler)];
  });
  await context.close();
  return befunde;
}
