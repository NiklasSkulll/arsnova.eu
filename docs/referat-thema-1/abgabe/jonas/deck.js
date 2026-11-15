// Laufzeit des Browser-Decks (wird von deck.mjs in deck-vorlage.html eingesetzt).
// Steuerung: → / Leertaste / Bild ab vor, ← / Bild auf zurück, Pos1 / Ende, f Vollbild,
// r Reserve-Übersicht, Esc zurück in den Vortrag. Bewegung nur für den wandernden Marker
// (600 ms) und den Zoom in J10; mit prefers-reduced-motion springt beides in den Endzustand.
/* global document, window, location, history, URLSearchParams, getComputedStyle, performance,
   requestAnimationFrame, cancelAnimationFrame, setTimeout, clearTimeout */
(() => {
  'use strict';

  const konfig = JSON.parse(document.getElementById('deck-konfig').textContent);
  const wurzel = document.documentElement;
  const buehne = document.querySelector('.buehne');
  const alle = [...buehne.querySelectorAll(':scope > .folie')];
  const haupt = alle.filter((s) => s.dataset.teil !== 'reserve');
  const reserve = alle.filter((s) => s.dataset.teil === 'reserve');
  const weg = buehne.querySelector('.weg-wandernd');
  const punkt = weg.querySelector('.weg-punkt');
  const wegName = weg.querySelector('.weg-name');
  const wegEtikett = weg.querySelector('.etikett');
  const uebersicht = buehne.querySelector('.reserve-uebersicht');
  const knoepfe = [...uebersicht.querySelectorAll('button[data-ziel]')];
  const live = document.querySelector('.live');
  const ruhig = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let liste = haupt;
  let index = 0;
  let hauptIndex = 0;
  let aktuell = null;

  const druck = new URLSearchParams(location.search).get('druck');
  if (druck) wurzel.dataset.druck = druck;

  // ---------------------------------------------------------------- Bühne skalieren
  function passe() {
    const s = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    wurzel.style.setProperty('--massstab', String(s));
  }
  window.addEventListener('resize', passe);
  passe();

  // ---------------------------------------------------------------- Zoom J10
  // Gleiche Abbildung wie kameraViewBox() und zoomDeckkraft() in grafik.mjs (Vertrag aus Task 4,
  // Parameter als data-* am <svg class="kamera">); deck.test.mjs vergleicht beide.
  const r6 = (n) => Number(n.toFixed(6));
  function kameraViewBox(kamera, z) {
    const d = kamera.dataset;
    const [w0, w1] = [Number(d.w0), Number(d.w1)];
    const w = w0 * (w1 / w0) ** z;
    const h = (w * Number(kamera.getAttribute('height'))) / Number(kamera.getAttribute('width'));
    const sx = Number(d.sx0) + (Number(d.sx1) - Number(d.sx0)) * z;
    const sy = Number(d.sy0) + (Number(d.sy1) - Number(d.sy0)) * z;
    return { x: r6(-sx * w), y: r6(Number(d.ankerY) - sy * h), w: r6(w), h: r6(h) };
  }
  function zoomDeckkraft(zoom, von, bis) {
    if (zoom < von || zoom > bis) return 0;
    const ein = von <= 0 ? 1 : Math.min(1, (zoom - von) / 0.04);
    const aus = bis >= 1 ? 1 : Math.min(1, (bis - zoom) / 0.04);
    return Math.min(ein, aus);
  }
  function setzeZoom(folie, z) {
    const kamera = folie.querySelector('svg.kamera');
    const vb = kameraViewBox(kamera, z);
    kamera.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    // Feldbeschriftungen in der Kamera und die Kennzahlen unter dem Feld (data-spalte)
    for (const g of folie.querySelectorAll('[data-zoom-von]')) {
      const o = zoomDeckkraft(z, Number(g.dataset.zoomVon), Number(g.dataset.zoomBis));
      g.setAttribute('opacity', String(r6(o)));
    }
    // Übersichtskarte: Lupenrahmen wie lupeRahmen() in grafik.mjs (mindestens 4 % der Kartenbreite)
    const lupe = folie.querySelector('[data-lupe]');
    if (lupe) {
      const ganz = kameraViewBox(kamera, 0);
      const lw = Math.max(vb.w, ganz.w * 0.04);
      const lh = (lw * ganz.h) / ganz.w;
      lupe.setAttribute('x', String(r6(vb.x + vb.w / 2 - lw / 2)));
      lupe.setAttribute('y', String(r6(vb.y + vb.h / 2 - lh / 2)));
      lupe.setAttribute('width', String(r6(lw)));
      lupe.setAttribute('height', String(r6(lh)));
    }
    folie.dataset.zoomIst = String(z);
  }
  const stufenVon = (folie) => JSON.parse(folie.dataset.zoomStufen);

  let fahrt = 0;
  function stoppeZoom() {
    if (fahrt) cancelAnimationFrame(fahrt);
    fahrt = 0;
  }
  /** Setzt die Stufe sofort (ohne Fahrt). */
  function zoomStufe(folie, stufe) {
    stoppeZoom();
    setzeZoom(folie, stufenVon(folie)[stufe]);
    folie.dataset.zoomStufe = String(stufe);
    folie.dataset.zoomFertig = String(stufe);
  }
  /** Kamerafahrt zur Stufe: z läuft mit ease-in-out; w(z) ist exponentiell, der Zoom wirkt gleichmäßig. */
  function zoomeZu(folie, stufe) {
    if (ruhig()) return zoomStufe(folie, stufe);
    stoppeZoom();
    const von = Number(folie.dataset.zoomIst);
    const nach = stufenVon(folie)[stufe];
    folie.dataset.zoomStufe = String(stufe);
    delete folie.dataset.zoomFertig;
    const dauer = 1500;
    const start = performance.now();
    const schritt = (jetzt) => {
      const t = Math.min(1, (jetzt - start) / dauer);
      const e = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
      setzeZoom(folie, von + (nach - von) * e);
      if (t < 1) {
        fahrt = requestAnimationFrame(schritt);
      } else {
        fahrt = 0;
        folie.dataset.zoomFertig = String(stufe);
      }
    };
    fahrt = requestAnimationFrame(schritt);
  }
  /** Ein Zoomschritt innerhalb der Folie; false, wenn die Folie keinen weiteren hat. */
  function zoomSchritt(richtung) {
    if (!aktuell || !aktuell.dataset.zoomStufen) return false;
    const ziel = Number(aktuell.dataset.zoomStufe) + richtung;
    if (ziel < 0 || ziel >= stufenVon(aktuell).length) return false;
    zoomeZu(aktuell, ziel);
    return true;
  }
  const endStufe = (folie) => zoomStufe(folie, stufenVon(folie).length - 1);

  // ---------------------------------------------------------------- wandernder Marker
  function setzeMarker(folie) {
    const name = folie.dataset.station || '';
    const station = konfig.stationen[name];
    const zeigen = Boolean(station) && !('eigenerWeg' in folie.dataset);
    const warSichtbar = !weg.hidden;
    weg.dataset.aktiv = name;
    weg.hidden = !zeigen;
    if (!station) return;
    weg.setAttribute('aria-label', `Station des Auftrags: ${station.name} (${station.auftrag})`);
    wegName.textContent = station.name;
    wegEtikett.textContent = station.auftrag;
    wegEtikett.className = `etikett etikett-${station.auftrag.toLowerCase()}`;
    if (zeigen && warSichtbar) {
      // fährt per CSS-Übergang (600 ms ease) entlang offset-path
      punkt.style.offsetDistance = `${station.anteil}%`;
    } else {
      // erscheint ohne Fahrt an der Station
      punkt.style.transition = 'none';
      punkt.style.offsetDistance = `${station.anteil}%`;
      void getComputedStyle(punkt).offsetDistance;
      punkt.style.transition = '';
    }
  }

  // ---------------------------------------------------------------- Folienwechsel
  function zeige(folie, richtung) {
    if (folie === aktuell) return;
    const alt = aktuell;
    if (alt) {
      delete alt.dataset.aktuell;
      if (alt.dataset.zoomStufen) endStufe(alt);
      for (const v of alt.querySelectorAll('video')) v.pause();
    }
    aktuell = folie;
    folie.dataset.aktuell = '';
    if (folie.dataset.zoomStufen) {
      zoomStufe(folie, richtung < 0 ? stufenVon(folie).length - 1 : 0);
    }
    // Clips starten nie von selbst: der nächste Tastendruck (vor) spielt sie ab.
    for (const v of folie.querySelectorAll('video')) {
      v.pause();
      v.currentTime = 0;
      delete v.dataset.gestartet;
      if (ruhig()) v.controls = true;
    }
    setzeMarker(folie);
    live.textContent = folie.getAttribute('aria-label') || '';
    history.replaceState(null, '', `#${folie.dataset.id}`);
  }
  function gehe(i, richtung) {
    index = Math.max(0, Math.min(liste.length - 1, i));
    if (liste === haupt) hauptIndex = index;
    zeige(liste[index], richtung);
  }
  /**
   * Clip der aktuellen Folie in Schritten: erster Druck startet ihn, ein Druck während er läuft
   * springt ans letzte Bild (Ergebnis), erst danach geht es zur nächsten Folie. true = Schritt verbraucht.
   */
  function clipSchritt() {
    const v = aktuell && aktuell.querySelector('video');
    if (!v) return false;
    if (v.dataset.gestartet === undefined) {
      v.dataset.gestartet = '';
      v.play().catch(() => {});
      return true;
    }
    if (!v.paused && !v.ended) {
      v.pause();
      if (Number.isFinite(v.duration)) v.currentTime = v.duration;
      return true;
    }
    return false;
  }
  function vor() {
    if (clipSchritt() || zoomSchritt(+1)) return;
    if (index < liste.length - 1) gehe(index + 1, +1);
  }
  function zurueck() {
    if (!zoomSchritt(-1) && index > 0) gehe(index - 1, -1);
  }
  function zeigeReserve(i) {
    liste = reserve;
    gehe(i, +1);
  }
  function zurueckInDenVortrag() {
    liste = haupt;
    gehe(hauptIndex, +1);
  }

  // ---------------------------------------------------------------- Reserve-Übersicht
  function oeffneUebersicht() {
    uebersicht.hidden = false;
    const i = liste === reserve ? index : 0;
    knoepfe[i].focus();
  }
  function schliesseUebersicht() {
    uebersicht.hidden = true;
    buehne.focus({ preventScroll: true });
  }
  for (const [i, knopf] of knoepfe.entries()) {
    knopf.addEventListener('click', () => {
      schliesseUebersicht();
      zeigeReserve(i);
    });
  }
  function tasteInUebersicht(e) {
    const i = knoepfe.indexOf(document.activeElement);
    if (e.key === 'Escape' || e.key === 'r') {
      schliesseUebersicht();
    } else if (/^[1-9]$/.test(e.key) && Number(e.key) <= knoepfe.length) {
      schliesseUebersicht();
      zeigeReserve(Number(e.key) - 1);
    } else if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) {
      const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
      knoepfe[(Math.max(i, 0) + d + knoepfe.length) % knoepfe.length].focus();
    } else if (e.key === 'Tab') {
      // Fokus bleibt im Dialog
      const d = e.shiftKey ? -1 : 1;
      knoepfe[(Math.max(i, 0) + d + knoepfe.length) % knoepfe.length].focus();
    } else {
      return;
    }
    e.preventDefault();
  }

  // ---------------------------------------------------------------- Tasten
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!uebersicht.hidden) return tasteInUebersicht(e);
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
      case 'PageDown':
        vor();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        zurueck();
        break;
      case 'Home':
        gehe(0, +1);
        break;
      case 'End':
        gehe(liste.length - 1, -1);
        break;
      case 'f':
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else wurzel.requestFullscreen().catch(() => {});
        break;
      case 'r':
        oeffneUebersicht();
        break;
      case 'Escape':
        if (liste === reserve) zurueckInDenVortrag();
        else return;
        break;
      default:
        return;
    }
    e.preventDefault();
  });

  // Mauszeiger nach kurzer Ruhe ausblenden (Bildschirmfreigabe)
  let mausTimer = 0;
  document.addEventListener('mousemove', () => {
    document.body.classList.remove('maus-ruhig');
    clearTimeout(mausTimer);
    mausTimer = setTimeout(() => document.body.classList.add('maus-ruhig'), 2500);
  });

  // ---------------------------------------------------------------- Druck
  // Im Druck steht J10 im Endzustand (0,3 mm); danach geht es auf der gezeigten Stufe weiter.
  const zoomFolien = alle.filter((s) => s.dataset.zoomStufen);
  let vorDruck = null;
  function druckBeginn() {
    if (vorDruck) return;
    vorDruck = zoomFolien.map((s) => [s, s.dataset.zoomStufe]);
    for (const s of zoomFolien) endStufe(s);
  }
  function druckEnde() {
    if (!vorDruck) return;
    for (const [s, stufe] of vorDruck) if (stufe !== undefined) zoomStufe(s, Number(stufe));
    vorDruck = null;
  }
  window.addEventListener('beforeprint', druckBeginn);
  window.addEventListener('afterprint', druckEnde);
  window
    .matchMedia('print')
    .addEventListener('change', (m) => (m.matches ? druckBeginn() : druckEnde()));

  // ---------------------------------------------------------------- Start
  // Alle Schnitte vorab laden, damit kein Folienwechsel auf eine Schrift wartet.
  for (const f of ['400 24px Inter', '600 24px Inter', '700 24px Inter', '800 24px Inter']) {
    document.fonts.load(f);
  }
  document.fonts.load('400 24px "IBM Plex Mono"');
  document.fonts.load('600 24px "IBM Plex Mono"');

  // Für Tests und Bau (Task 10)
  window.deck = { kameraViewBox, zoomDeckkraft, gehe: (id) => springeZu(id) };

  function springeZu(id) {
    const ziel = alle.find((s) => s.dataset.id === id);
    if (!ziel) return false;
    liste = ziel.dataset.teil === 'reserve' ? reserve : haupt;
    gehe(liste.indexOf(ziel), +1);
    return true;
  }
  if (!springeZu(decodeURIComponent(location.hash.slice(1)))) gehe(0, +1);
  buehne.focus({ preventScroll: true });
})();
