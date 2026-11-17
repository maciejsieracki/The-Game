'use strict';
/**
 * diplo-weariness-forced-peace-wiring-test.cjs — R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1 (runda 3, pkt 3 FC).
 * Test WIRINGU pokoju wymuszonego przy 100% zmęczenia na REALNYM silniku (runWarWearinessTick z war-weariness.ts,
 * planEscalatedPeacePayment z diplomacy-ai-forced-peace.ts). Para: gracz (id 0) ↔ AI (id 1); scenariusz z wyraźnie
 * przegrywającym graczem (udział 0,3) i 6 miastami. Sprawdza:
 *  (a) 100% (40 tur, bez strat) → pokój wymuszony, przegrywający oddaje miasta do zrównoważenia ceny;
 *  (b) nigdy stolica (c0 zakazana), zostaje ≥ minMiastPoOddaniu (3) miast;
 *  (c) battlePending → pokój ODROCZONY (brak pay/finalize), decyzja 'none';
 *  (d) cena 0 (remis / brak ceny) → pokój BEZ miast;
 *  (e) 80% (32 tury) → NIE pokój wymuszony (tylko propozycja/eskalacja);
 *  (f) gracz jako wygrywający (przegrywa AI) — ta sama reguła, przegrywający = AI, miasta płaci AI.
 * Okno natywne (showForcedPeaceModal) i wpis „Ważne” są DOM/UI — NIE ZMIERZONO w Node (patrz raport).
 * Run: node tools/diplo-weariness-forced-peace-wiring-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(GRA, 'src', '.dip-forced-wiring-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-forced-wiring-bundle.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const ENTRY_SRC = [
  "export { runWarWearinessTick, WAR_WEARINESS_PARAMS } from './game/war-weariness';",
  '',
].join('\n');

function cleanup() {
  for (const p of [ENTRY, BUNDLE]) {
    try { fs.unlinkSync(p); } catch (_) { /* ok */ }
  }
}

async function main() {
  fs.writeFileSync(ENTRY, ENTRY_SRC);
  try {
    await esbuild.build({
      entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: BUNDLE, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent',
    });
    const { runWarWearinessTick, WAR_WEARINESS_PARAMS: P } = require(BUNDLE);

    const PLAYER = 0;
    const AI = 1;
    const CAPITAL = 'c0';

    // Scenariusz: `loser` przegrywa (udział 0,3), `cities` miast u przegrywającego, cena `price` PW, miasto = 100 PW.
    function scenario({ turns, loser, cities = 6, price = 300, battlePending = false }) {
      const store = new Map();
      const calls = { pay: [], finalize: [], log: [] };
      const winner = loser === PLAYER ? AI : PLAYER;
      const cityIds = Array.from({ length: cities }, (_, i) => 'c' + i);
      const outcomes = runWarWearinessTick({
        store,
        turn: turns,
        pairs: [{ a: Math.min(PLAYER, AI), b: Math.max(PLAYER, AI) }],
        pairKey: (a, b) => a + '-' + b,
        warInfo: () => ({ warStart: 1, turnsAtWar: turns, lostA: 0, lostB: 0, turnsSinceCityChange: turns }),
        shareOf: (x) => (x === loser ? 0.3 : 0.7),
        weakerOf: (x, y) => (x === loser || y === loser ? loser : x),
        cityCountOf: (owner) => (owner === loser ? cities : 4),
        price: () => ({ requiredPn: price, balanceFor: () => 0, tolerancePn: 0 }),
        assets: (l) => (l === loser
          ? cityIds.map((id) => ({ kind: 'miasto', id, amount: 1, pn: 100, forbidden: id === CAPITAL }))
          : []),
        cityCessionOk: (cityId) => cityId !== CAPITAL,
        battlePending,
        pay: (l, w, plan) => { calls.pay.push({ l, w, plan }); },
        finalize: (l, w, lock) => { calls.finalize.push({ l, w, lock }); },
        log: (m) => calls.log.push(m),
        params: P,
      });
      return { outcomes, calls, winner };
    }

    // (a) 100% → pokój wymuszony; gracz przegrywa i oddaje miasta do zrównoważenia 300 PW (3 × 100 PW).
    const a = scenario({ turns: 40, loser: PLAYER });
    const fa = a.outcomes.find((o) => o.action === 'forced_peace');
    check('a1 100% (40 tur) → pokój wymuszony gracz↔AI', fa !== undefined && a.calls.finalize.length === 1, a.outcomes);
    check('a2 przegrywający = gracz (strona słabsza)', fa && fa.loser === PLAYER && fa.winner === AI, fa);
    const givenA = fa?.plan?.items.filter((i) => i.kind === 'miasto').length ?? 0;
    // R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1 (2026-11-17): cena pokoju wymuszonego = cenaPokoju(L=1) = 0,
    // niezaleznie od requiredPn z fixture => brak miast do oddania, brak zaplaty.
    check('a3 cena 0 przy 100% -> 0 miast oddanych (dispatch: „cena 0 -> pokoj bez miast”)', givenA === 0, givenA);
    check('a4 cena 0 -> brak zaplaty (pay nie wywolany)', a.calls.pay.length === 0, a.calls.pay.length);

    // (b) nigdy stolica; po oddaniu zostaje ≥ minMiastPoOddaniu (3) miast.
    const itemsA = fa?.plan?.items.map((i) => i.id) ?? [];
    check('b1 stolica (c0) nigdy nie oddawana', !itemsA.includes(CAPITAL), itemsA);
    check('b2 po oddaniu zostaje ≥ minMiastPoOddaniu (3) miast gracza', 6 - givenA >= P.przegrywajacy.minMiastPoOddaniu, { left: 6 - givenA, min: P.przegrywajacy.minMiastPoOddaniu });
    check('b3 zakres: lockEnd = karencja po pokoju (40 tur, bez ochrony)', a.calls.finalize[0]?.lock === P.przegrywajacy.karencjaPoPokojuTur, a.calls.finalize[0]);

    // (c) bitwa w toku → odroczenie na następną turę, bez zapłaty i bez pokoju.
    const c = scenario({ turns: 40, loser: PLAYER, battlePending: true });
    const fc = c.outcomes.find((o) => o.action === 'forced_peace');
    check('c1 battlePending → pokój wymuszony ODROCZONY (brak forced_peace)', fc === undefined && c.calls.finalize.length === 0, c.outcomes);
    check('c2 battlePending → brak zapłaty miastami', c.calls.pay.length === 0, c.calls.pay.length);

    // (d) cena 0 (remis / brak ceny) → pokój BEZ miast.
    const d0 = scenario({ turns: 40, loser: PLAYER, price: 0 });
    const fd = d0.outcomes.find((o) => o.action === 'forced_peace');
    check('d1 cena 0 → pokój wymuszony bez miast', fd !== undefined && (fd.plan === undefined || fd.plan.items.length === 0) && d0.calls.pay.length === 0, d0.outcomes);

    // (e) 80% (32 tury) → nie pokój wymuszony (AI tylko proponuje).
    const e = scenario({ turns: 32, loser: PLAYER });
    // Przy 80% wynik to istniejąca eskalacja oferty (offer_accepted z miastem wg planu), NIE pokój wymuszony:
    // brak akcji 'forced_peace', brak miasta stolicy w planie. Pokój bezwarunkowy przy 80% nie istnieje.
    const eOffer = e.outcomes.find((o) => o.action === 'offer_accepted');
    const eItems = eOffer?.plan?.items.map((i) => i.id) ?? [];
    check('e1 80% (32 tury) → NIE pokój wymuszony (tylko oferta eskalacji)', e.outcomes.every((o) => o.action !== 'forced_peace') && !eItems.includes(CAPITAL), e.outcomes);

    // (f) AI przegrywa z graczem (gracz wygrywa): ta sama reguła, miasta płaci AI.
    const f = scenario({ turns: 40, loser: AI });
    const ff = f.outcomes.find((o) => o.action === 'forced_peace');
    check('f1 gracz wygrywa → pokój wymuszony, przegrywający AI', ff !== undefined && ff.loser === AI && ff.winner === PLAYER, f.outcomes);
    const givenF = ff?.plan?.items.filter((i) => i.kind === 'miasto').length ?? 0;
    check('f2 AI oddaje 0 miast (cena 0 przy 100%, R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1)', givenF === 0, givenF);

    console.log('');
    console.log('diplo-weariness-forced-peace-wiring-test: ' + pass + ' pass / ' + fail + ' fail');
  } finally {
    cleanup();
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { cleanup(); console.error(e); process.exit(1); });
