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
  const tag = MODULE !== DEFAULT_MODULE ? ' (modul: ' + MODULE + ')' : '';
  console.log('measure-reject-offers-test: ' + passes + ' OK, ' + fails + ' FAIL' + tag);
  process.exit(fails === 0 ? 0 : 1);
})();
