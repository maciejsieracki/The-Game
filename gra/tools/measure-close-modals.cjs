'use strict';
/**
 * measure-close-modals.cjs -- R-WEB-MEASURE-STALL-T72-T80-Q1: pomocnicze narzedzia POMIARU (nie zmiana gry).
 *
 * 1) attachEndTurnBlockLog(page, log): zapisuje do dziennika biegu powody, dla ktorych gra blokuje „Zakoncz ture”
 *    (console.warn `[EndTurn] blocked: ...` z canPlayerInitiateEndTurn w main.ts). Runner dotad lapal tylko console.error,
 *    wiec przy cannot-end bez widocznego okna powod byl niewidoczny. Duplikaty z rzedu sa pomijane (HUD woła canEnd często).
 *
 * 2) Selektory zamkniecia karty technologii (#civ-tech-discovery-notice-host): aktualna karta (techDiscoveryNotice.ts,
 *    showTechDiscoveryNoticeViaEntityCard) ma przycisk ✕ z klasa `.tdn-entity-close` i NIE ma `data-act="close"`
 *    (ten atrybut ma tylko przestarzala sciezka _legacyShowTechDiscoveryNotice). Dla satelitarnej karty bocznej
 *    (`.tdn-side-card`) zamykana jest najpierw ona, jak gracz. Uzywane w closeModalsInPage (ai-economy-measure-run.cjs).
 */

/** Zamkniecie karty bocznej (satelity) -- najpierw, zeby glowna karta technologii zostala ta sama co u gracza. */
const TECH_SIDE_CLOSE_SEL = '.tdn-side-card .tdn-entity-close';
/** Zamkniecie glownej karty technologii: wariant aktualny (`.tdn-entity-close`) i legacy (`data-act="close"`). */
const TECH_MAIN_CLOSE_SEL = '[data-act="close"], .tdn-entity-close';

/**
 * Podpina nasluch console.warn `[EndTurn] blocked` na stronie. `log(kind, msg)` = zapis do dziennika biegu.
 * Zwraca funkcje odlaczajaca nic nie robi (console listenery w Playwright zyja do zamkniecia strony).
 */
function attachEndTurnBlockLog(page, log) {
  let last = null;
  page.on('console', m => {
    if (m.type() !== 'warning') return;
    const text = m.text();
    if (!/^\[EndTurn\] blocked/.test(text)) return;
    if (text === last) return;
    last = text;
    log('endturn-blocked', text);
  });
}

/**
 * Samotest BEZ przegladarki (node tools/measure-close-modals.cjs --selftest): atrapa `document` z prostym dopasowaniem
 * selektorow (klasa, `[data-act="close"]`, zlozenie „A B” i lista po przecinku). Sprawdza, ze closeModalsInPage
 * (ai-economy-measure-run.cjs) i closeEndTurnModals klikaja karte technologii z WARIANTEM v2 (`.tdn-entity-close`),
 * zamykaja karte boczna przed glowna, licza zamkniecie raz, a mutacja selektora (tylko legacy `data-act`) NIE zamyka v2.
 * To NIE jest dowod na prawdziwym DOM gry (tego nie zastepuje bieg w Chromium); dowodzi tylko poprawnosci wiazania.
 */
function selftest() {
  const { closeModalsInPage, closeEndTurnModals, newCtx } = require('./ai-economy-measure-run.cjs');
  // Wiazanie selektorow z helpera (jedno zrodlo): runner musi uzywac TECH_SIDE/MAIN_CLOSE_SEL, nie kopii.
  const results = [];
  const check = (name, ok, det) => { results.push({ name, ok: !!ok }); console.log((ok ? 'ZIELONE ' : 'CZERWONE ') + name + ' :: ' + (det || '')); };

  const matchCompound = (btn, c) => {
    if (c.startsWith('.')) return btn.classes.includes(c.slice(1));
    const m = /^\[([\w-]+)="([^"]*)"\]$/.exec(c);
    if (m) return btn.attrs[m[1]] === m[2];
    throw new Error('selftest: nieobslugiwany selektor ' + c);
  };
  const matchSel = (btn, sel) => sel.split(',').some(part => {
    const chain = part.trim().split(/\s+/);
    if (!matchCompound(btn, chain[chain.length - 1])) return false;
    return chain.slice(0, -1).every(a => btn.ancestors.includes(a.slice(1)));
  });
  // Atrapa karty: host (#civ-tech-discovery-notice-host) z przyciskami ✕; klik usuwa przycisk, a glowny przycisk usuwa host.
  const makeHost = buttons => {
    const host = { alive: true, buttons: buttons.map(b => ({ alive: true, classes: b.classes, attrs: b.attrs || {}, ancestors: b.ancestors || [], isMain: !!b.isMain, inert: !!b.inert, click() { if (this.inert) return; this.alive = false; if (this.isMain) host.alive = false; } })) };
    host.querySelector = sel => host.buttons.find(b => b.alive && matchSel(b, sel)) || null;
    return host;
  };
  const fakeDocument = host => ({
    querySelector: () => null,
    getElementById: id => (id === 'civ-tech-discovery-notice-host' && host.alive ? host : null),
  });
  const fakePage = host => ({ evaluate: (fn, arg) => { global.document = fakeDocument(host); return fn(arg); } });
  const TECH_SEL = { side: TECH_SIDE_CLOSE_SEL, main: TECH_MAIN_CLOSE_SEL };
  const v2main = () => ({ classes: ['tdn-entity-close'], isMain: true });
  const legacyMain = () => ({ classes: [], attrs: { 'data-act': 'close' }, isMain: true });
  const side = () => ({ classes: ['tdn-entity-close'], ancestors: ['tdn-side-card'] });

  // A) wariant v2: sam przycisk ✕ `.tdn-entity-close` -> zamkniete jednym klikiem.
  let h = makeHost([v2main()]);
  global.document = fakeDocument(h);
  let r = closeModalsInPage(TECH_SEL);
  check('A: v2 (.tdn-entity-close) zamykana przez closeModalsInPage', r.length === 1 && r[0] === 'techNoticeClosed' && !h.alive, 'zwrot=' + JSON.stringify(r) + ' host=' + h.alive);

  // B) wariant legacy (data-act="close") nadal dziala.
  h = makeHost([legacyMain()]);
  global.document = fakeDocument(h);
  r = closeModalsInPage(TECH_SEL);
  check('B: legacy (data-act="close") zamykana', r.length === 1 && !h.alive, 'zwrot=' + JSON.stringify(r));

  // C) mutacja: selektor bez wariantu v2 (tylko legacy) NIE zamyka v2 -> dowod, ze wiazanie selektora ma znaczenie.
  h = makeHost([v2main()]);
  global.document = fakeDocument(h);
  r = closeModalsInPage({ side: '.tdn-side-card .tdn-entity-close', main: '[data-act="close"]' });
  check('C: mutacja (bez .tdn-entity-close) NIE zamyka v2 -- test wykrywa regresje', r.length === 0 && h.alive, 'zwrot=' + JSON.stringify(r));

  // D) karta boczna + glowna: pierwszy klik zamyka TYLKO boczna (host zostaje), drugi glowna (host znika), licznik = 1.
  h = makeHost([v2main(), side()]);
  const ctx = newCtx(null);
  const stuck = closeEndTurnModals(fakePage(h), ctx);
  return stuck.then(st => {
    const sideGone = h.buttons[1].alive === false;
    check('D: karta boczna przed glowna, licznik techNoticeClosed=1, brak niezamknietych', ctx.techNoticeClosed === 1 && !h.alive && sideGone && st.length === 0,
      'licznik=' + ctx.techNoticeClosed + ' host=' + h.alive + ' boczna_usunieta=' + sideGone + ' niezamkniete=' + JSON.stringify(st));
    // E) klik bez skutku (przycisk nie usuwa hosta): licznik NIE rosnie, blokada zgloszona jako niezamknieta.
    const hE = makeHost([{ classes: ['tdn-entity-close'], isMain: true, inert: true }]);
    const ctxE = newCtx(null);
    return closeEndTurnModals(fakePage(hE), ctxE).then(stE => {
      check('E: klik bez skutku nie podbija licznika i jest zgloszony jako niezamkniety', ctxE.techNoticeClosed === 0 && stE.includes('techNoticeClosed') && hE.alive,
        'licznik=' + ctxE.techNoticeClosed + ' niezamkniete=' + JSON.stringify(stE));
      const failed = results.filter(x => !x.ok).length;
      console.log(failed === 0 ? 'SELFTEST ZIELONY (' + results.length + ')' : 'SELFTEST CZERWONY: ' + failed);
      process.exit(failed === 0 ? 0 : 1);
    });
  });
}

module.exports = { attachEndTurnBlockLog, TECH_SIDE_CLOSE_SEL, TECH_MAIN_CLOSE_SEL, selftest };

if (require.main === module && process.argv.includes('--selftest')) selftest();
