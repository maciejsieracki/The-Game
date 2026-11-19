'use strict';
/**
 * measure-reject-offers-test.cjs -- R-WEB-MEASURE-RUNNERS-REJECT-AI-OFFERS-Q1: test jednostkowy wspolnej funkcji odrzucania.
 * Bez przegladarki: atrapa `page` uruchamia funkcje page.evaluate na globalnym `window` z atrapa haka gry.
 *
 * Asercje:
 *  1) wiszaca oferta AI->gracz (responder 0, proposer!=0) jest odrzucona: attempts=1, confirmed=1, wpis usuniety;
 *  2) propozycja gracza (proposer=0) i oferta do innego wlasciciela NIE sa ruszane;
 *  3) brak ofert: attempts=0, confirmed=0, zero wywolan reject (parytet: zero zmian);
 *  4) PROBA BEZ POTWIERDZENIA: reject nie usuwa wpisu -> attempts=1, confirmed=0 (liczniki rozdzielone);
 *  5) mutacja (czerwona): MEASURE_REJECT_MODULE=<kopia z zepsutym rejectem> musi oblac asercje 1 i 4.
 * Uzycie: node tools/measure-reject-offers-test.cjs   (wyjscie 0 = zielone, 1 = blad)
 */
const path = require('path');

const DEFAULT_MODULE = path.resolve(__dirname, 'measure-reject-offers.cjs');
const MODULE = process.env.MEASURE_REJECT_MODULE ? path.resolve(process.env.MEASURE_REJECT_MODULE) : DEFAULT_MODULE;
const { rejectAwaitingAiOffers } = require(MODULE);

let fails = 0;
let passes = 0;
function check(name, cond, extra) {
  if (cond) passes++;
  else { fails++; console.log('FAIL: ' + name + (extra !== undefined ? ' ' + JSON.stringify(extra) : '')); }
}

/** Atrapa page: evaluate(fn, arg) wykonuje fn na globalnym window (jak w przegladarce). */
function makePage(entries, opts) {
  const rejected = [];
  const o = opts || {};
  global.window = {
    __aiTradeWiringTestDebug: {
      state: () => ({ entries: entries.map(e => Object.assign({}, e)) }),
      reject: id => {
        rejected.push(id);
        if (o.noop) return;
        const i = entries.findIndex(e => e.id === id);
        if (i >= 0) entries.splice(i, 1);
      },
    },
  };
  const page = { evaluate: async (fn, arg) => (arg === undefined ? fn() : fn(arg)) };
  return { page, rejected };
}

(async () => {
  // 1) + 2) mieszany stol
  {
    const entries = [
      { id: 1, responder: 0, proposer: 3 },   // oferta AI->gracz: odrzucana
      { id: 2, responder: 0, proposer: 0 },   // propozycja gracza: NIE ruszana
      { id: 3, responder: 2, proposer: 0 },   // do innego wlasciciela: NIE ruszana
    ];
    const { page, rejected } = makePage(entries);
    const r = await rejectAwaitingAiOffers(page);
    check('1 attempts=1', r.attempts === 1, r);
    check('1 confirmed=1', r.confirmed === 1, r);
    check('1 reject tylko id 1', JSON.stringify(rejected) === '[1]', rejected);
    check('2 wpisy 2 i 3 zostaja', entries.length === 2 && entries.some(e => e.id === 2) && entries.some(e => e.id === 3), entries);
  }
  // 3) brak ofert
  {
    const entries = [{ id: 5, responder: 1, proposer: 0 }];
    const { page, rejected } = makePage(entries);
    const r = await rejectAwaitingAiOffers(page);
    check('3 brak ofert: zera', r.attempts === 0 && r.confirmed === 0, r);
    check('3 brak ofert: zero reject', rejected.length === 0, rejected);
  }
  // 4) proba bez potwierdzenia
  {
    const entries = [{ id: 7, responder: 0, proposer: 4 }];
    const { page } = makePage(entries, { noop: true });
    const r = await rejectAwaitingAiOffers(page);
    check('4 proba bez skutku: attempts=1', r.attempts === 1, r);
    check('4 proba bez skutku: confirmed=0', r.confirmed === 0, r);
  }
  // 5) dwa wywolania w tej samej turze (wspolny seenIds): proba bez skutku liczona RAZ, reject wolany DWA razy
  {
    const entries = [{ id: 9, responder: 0, proposer: 2 }];
    const { page, rejected } = makePage(entries, { noop: true });
    const seen = new Set();
    const r1 = await rejectAwaitingAiOffers(page, seen);
    const r2 = await rejectAwaitingAiOffers(page, seen);
    check('5 dwie proby: attempts liczone raz', r1.attempts + r2.attempts === 1, [r1, r2]);
    check('5 dwie proby: confirmed=0', r1.confirmed + r2.confirmed === 0, [r1, r2]);
    check('5 dwie proby: reject wolany 2x (zachowanie gry)', rejected.length === 2, rejected);
  }
  // 6) kolejnosc w runnerach: wywolanie odrzucania PRZED pierwszym canEnd w playOneTurn (statyczny odczyt zrodla)
  {
    const fs = require('fs');
    for (const f of ['ai-economy-measure-run.cjs', 'diplomacy-harder-measure-run.cjs']) {
      const src = fs.readFileSync(path.resolve(__dirname, f), 'utf8');
      const body = src.slice(src.indexOf('async function playOneTurn'));
      const iRej = body.indexOf('rejectAwaitingAiOffers(page');
      const iEnd = body.indexOf('canEnd()');
      check('6 ' + f + ': odrzucanie przed canEnd', iRej > 0 && iEnd > iRej, { iRej, iEnd });
    }
  }
  // 7) domyslna wartosc flagi i bramka wywolania w ai-economy (mutacja: domyslnie 0 lub wylaczona bramka -> FAIL)
  {
    const fs = require('fs');
    const src = fs.readFileSync(path.resolve(__dirname, 'ai-economy-measure-run.cjs'), 'utf8');
    check('7 ai-economy: domyslnie --reject-offers=1',
      /const REJECT_OFFERS = arg\('reject-offers', '1'\) !== '0';/.test(src), null);
    check('7 ai-economy: wywolanie odrzucania bramkowane flaga',
      src.indexOf('if (REJECT_OFFERS) { countOffers(await rejectAwaitingAiOffers(page, seenOffers))') > 0, null);
  }
  const tag = MODULE !== DEFAULT_MODULE ? ' (modul: ' + MODULE + ')' : '';
  console.log('measure-reject-offers-test: ' + passes + ' OK, ' + fails + ' FAIL' + tag);
  process.exit(fails === 0 ? 0 : 1);
})();
