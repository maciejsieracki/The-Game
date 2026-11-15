'use strict';
/**
 * ai-trade-qty-cap-test.cjs — R-WEB-AI-TRADE-OFFER-QTY-CAP-3X-NEED-Q1.
 * Ilość odbioru AI w ofercie cyklicznej gracz->AI <= mnożnik x potrzeba AI na turę
 * (min z nadwyżką gracza), a pętla wyszukiwania ilości ma stały sufit kandydatów.
 * Run from gra/: node tools/ai-trade-qty-cap-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const BUNDLE = path.resolve(__dirname, '.ai-trade-qty-cap-bundle.cjs');
const entry = path.resolve(__dirname, '.ai-trade-qty-cap-entry.ts');
fs.writeFileSync(entry, `
export { selectAiTradeBarter, boundedQtyCandidates, AI_TRADE_RECEIVE_NEED_MULTIPLIER, AI_TRADE_QTY_SEARCH_MAX_CANDIDATES } from '../src/game/ai-trade-proposal.ts';
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent' });
const mod = require(BUNDLE);
let pass = 0;
let fail = 0;
function assert(c, m) {
  if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); }
}

// Scenariusz: gracz ma deficyt drewna (AI ma jego nadwyzke), AI ma deficyt zelaza (gracz ma nadwyzke).
function scenario({ need, playerSurplus, aiGiveStock = 1e6, gate = () => true }) {
  return mod.selectAiTradeBarter({
    aiResources: [
      { key: 'drewno', stock: aiGiveStock, netRate: 0, deficit: false, surplus: true, reserve: 0 },
      { key: 'wegiel', stock: 0, netRate: -need, deficit: true, surplus: false, reserve: 0 },
    ],
    playerResources: [
      { key: 'drewno', stock: 0, netRate: -1, deficit: true, surplus: false, reserve: 0 },
      { key: 'wegiel', stock: playerSurplus, netRate: 0, deficit: false, surplus: true, reserve: 0 },
    ],
    turns: 1,
    fairnessGate: (g, r) => gate(g, r),
    resolvePayloadPn: p => ({ givePn: p.giveItems[0].ilosc, receivePn: p.receiveItems[0].ilosc }),
    evaluateExactPayload: () => true,
  });
}

console.log('--- A: potrzeba 40, nadwyzka gracza 5000 -> oferta <= 120 (3 x 40) ---');
{
  const r = scenario({ need: 40, playerSurplus: 5000 });
  assert(r !== null, 'A0: oferta znaleziona');
  assert(r && r.receiveQty <= 120, 'A1: receiveQty <= 120 (bylo ' + (r && r.receiveQty) + ')');
  assert(r && r.receiveQty === 120, 'A2: receiveQty = 120 dokladnie (sufit 3x, pierwszy kandydat)');
}
console.log('--- B: potrzeba 40, nadwyzka gracza 50 -> oferta = 50 (min z nadwyzka) ---');
{
  const r = scenario({ need: 40, playerSurplus: 50 });
  assert(r && r.receiveQty === 50, 'B1: receiveQty = 50 (bylo ' + (r && r.receiveQty) + ')');
}
console.log('--- C: nadwyzka mniejsza niz potrzeba (20 < 40) -> oferta = 20 ---');
{
  const r = scenario({ need: 40, playerSurplus: 20 });
  assert(r && r.receiveQty === 20, 'C1: receiveQty = 20');
}
console.log('--- D: uczciwosc (bramka) nadal decyduje; bramka odrzuca wszystko -> brak oferty ---');
assert(scenario({ need: 40, playerSurplus: 5000, gate: () => false }) === null, 'D1: gate=false -> null');

console.log('--- E: staly sufit kandydatow ---');
{
  const c = mod.boundedQtyCandidates(100000, 1, 64);
  assert(c.length <= 64 && c[0] === 100000, 'E1: 100000 krok 1, sufit 64 -> <=64 kandydatow, pierwszy = max (' + c.length + ')');
  const c10 = mod.boundedQtyCandidates(300, 10, 64);
  assert(c10[0] === 300 && c10.every(v => v % 10 === 0 && v >= 10), 'E2: krok 10 -> wielokrotnosci kroku, pierwszy = max');
  assert(mod.boundedQtyCandidates(7, 10, 64).length === 0, 'E3: max < krok -> brak kandydatow');
  assert(mod.boundedQtyCandidates(40, 1, 64).length === 40, 'E4: zakres <= sufit -> pelna lista');
  assert(mod.AI_TRADE_RECEIVE_NEED_MULTIPLIER === 3, 'E5: mnoznik z ai-params.json = 3');
  assert(mod.AI_TRADE_QTY_SEARCH_MAX_CANDIDATES === 64, 'E6: sufit z ai-params.json = 64');
}

console.log('--- F: sufit ogranicza liczbe wywolan bramki przy ogromnym zapasie ---');
{
  let calls = 0;
  scenario({ need: 100000, playerSurplus: 100000, aiGiveStock: 100000, gate: (g, r) => { calls++; return r <= 5; } });
  assert(calls <= 64 * 64, 'F1: wywolan bramki <= 64*64 (bylo ' + calls + ')');
  const small = mod.boundedQtyCandidates(100000, 1, 64);
  assert(small.includes(1) && small.includes(100000) && small.length <= 64, 'F2: sufit zachowuje max i drobne wartosci od dolu');
  const r = scenario({ need: 100000, playerSurplus: 100000, aiGiveStock: 100000, gate: (g, rq) => rq <= 5 });
  assert(r !== null && r.receiveQty <= 5, 'F3: maly uczciwy odbior nadal znajdowany przy duzym zapotrzebowaniu (' + (r && r.receiveQty) + ')');
}

fs.rmSync(BUNDLE, { force: true });
fs.rmSync(entry, { force: true });
console.log('ai-trade-qty-cap-test: ' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
