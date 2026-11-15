'use strict';
/**
 * ai-trade-need-from-surplus-test.cjs — R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1 (test behawioralny).
 * Ilosc odbioru AI od gracza wynika z NADWYZKI GRACZA (stock - rezerwa) / tury, a nie ze sztywnego kroku 10.
 * r4 (odpowiedz na zarzut 3 Evaluatora r3): wycena i bramki sa REALNE (diplomacyPnSurowiecIlosc,
 * handelFairnessGate z AI_PROPOSER_FAIRNESS_REL_TOTAL, evaluateProposal) -- bez atrapy resolvePayloadPn.
 * Uwaga (ZMIERZONO r4): przy ograniczonej nadwyzce AI (drewno 5030 / rezerwa 2000) to ona wiaze ilosc
 * (give 200), wiec sekcja A uzywa duzej nadwyzki AI, zeby izolowac nadwyzke GRACZA jako ograniczenie.
 * Run from gra/: node tools/ai-trade-need-from-surplus-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const bundle = path.resolve(__dirname, '.ai-trade-need-surplus-bundle.cjs');
const entry = path.resolve(__dirname, '.ai-trade-need-surplus-entry.ts');
fs.writeFileSync(entry, `
export { selectAiTradeBarter } from '../src/game/ai-trade-proposal.ts';
export { evaluateProposal, handelFairnessGate, AI_PROPOSER_FAIRNESS_REL_TOTAL } from '../src/game/diplomacy-proposals.ts';
export { diplomacyPnSurowiecIlosc } from '../src/game/diplomacy-value-catalog.ts';
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent' });
const { selectAiTradeBarter, evaluateProposal, handelFairnessGate, AI_PROPOSER_FAIRNESS_REL_TOTAL, diplomacyPnSurowiecIlosc } = require(bundle);
let pass = 0;
let fail = 0;
function assert(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

const evalCtx = { relation: { zaufanie: 60, respekt: 50, status: 'pokoj' }, stanWojny: false, turn: 20, proposerRespekt: 50, responderRespekt: 50, militaryRatio: 1 };
// Realna wycena: PW z katalogu wartosci surowcow (jak w ai-trade-proposal-to-player-test).
function pricePayload(payload) {
  const g = payload.giveItems[0];
  const r = payload.receiveItems[0];
  const givePn = diplomacyPnSurowiecIlosc(g.id, g.ilosc);
  const receivePn = diplomacyPnSurowiecIlosc(r.id, r.ilosc);
  if (givePn == null || receivePn == null) throw new Error(`brak wyceny PW: ${g.id}/${r.id}`);
  return { givePn, receivePn };
}
// Bramka wyceny: ta sama co w main.ts (bramka AI rel 100 + givePn <= receivePn).
function realGate(givePn, receivePn) {
  return handelFairnessGate(givePn, receivePn, AI_PROPOSER_FAIRNESS_REL_TOTAL, 1) == null && givePn <= receivePn;
}
function realEvaluate(payload) {
  return evaluateProposal({ actionId: 'handel', proposerOwnerId: 2, responderOwnerId: 0, payload }, evalCtx).accepted;
}
const RESERVE = 30; // rezerwa zapasu gracza (surplusMultiple x pakiet)
// aiStock: duza nadwyzka AI (1 000 000) izoluje nadwyzke GRACZA jako ograniczenie ilosci odbioru.
function run(playerSpare, playerSurplus = true, aiNetRate = -10, aiStock = 1000000) {
  return selectAiTradeBarter({
    aiResources: [
      { key: 'drewno', stock: aiStock, netRate: 0, deficit: false, surplus: true, reserve: 2000 },
      { key: 'zelazo', stock: 0, netRate: aiNetRate, deficit: true, surplus: false, reserve: 0 },
    ],
    playerResources: [
      { key: 'drewno', stock: 0, netRate: -20, deficit: true, surplus: false, reserve: 0 },
      { key: 'zelazo', stock: RESERVE + playerSpare, netRate: 0, deficit: false, surplus: playerSurplus, reserve: RESERVE },
    ],
    turns: 10,
    resolvePayloadPn: pricePayload,
    fairnessGate: realGate,
    evaluateExactPayload: realEvaluate,
  });
}

console.log('--- A: ilosc odbioru zalezy od nadwyzki gracza (nie stala 10), realna wycena ---');
const a1000 = run(1000);
const a400 = run(400);
const a100 = run(100);
console.log(`  [dane] nadwyzka gracza 1000 -> odbior ${a1000 && a1000.receiveQty}; 400 -> ${a400 && a400.receiveQty}; 100 -> ${a100 && a100.receiveQty}`);
assert(a1000 && a1000.receiveQty > 10, `A1: nadwyzka 1000 => odbior > krok 10 (bylo ${a1000 && a1000.receiveQty})`);
// R-WEB-AI-TRADE-OFFER-QTY-CAP-3X-NEED-Q1: odbior = min(nadwyzka gracza, 3 x potrzeba) => od progu
// sufitu (3 x 10 = 30) wartosc sie nie zwieksza; test sprawdza niemalejacosc i sufit 3x potrzeby.
assert(a1000 && a400 && a100 && a1000.receiveQty >= a400.receiveQty && a400.receiveQty >= a100.receiveQty && a1000.receiveQty <= 30, 'A2: odbior niemalejacy wzgledem nadwyzki gracza i <= 3 x potrzeba (30)');
assert(a100 && a100.receiveQty >= 10, `A3: nadwyzka 100 => oferta istnieje (odbior ${a100 && a100.receiveQty})`);
for (const [label, off] of [['1000', a1000], ['400', a400], ['100', a100]]) {
  assert(!!off && realGate(off.givePn, off.receivePn) && realEvaluate(off.payload),
    `A4(${label}): wybrana oferta przechodzi realna bramke wyceny (PW ${off && off.givePn}/${off && off.receivePn}) i evaluateProposal`);
}

console.log('--- A5: ograniczona nadwyzka AI tez wiaze ilosc, oferta nadal uczciwa (realna wycena) ---');
const a5 = run(1000, true, -10, 5030);
assert(!!a5 && realGate(a5.givePn, a5.receivePn) && realEvaluate(a5.payload), `A5: AI drewno 5030 => oferta uczciwa (give ${a5 && a5.giveQty}, recv ${a5 && a5.receiveQty})`);

console.log('--- B: brak nadwyzki gracza => brak oferty ---');
assert(run(0) === null, 'B1: nadwyzka 0 (stock rowny rezerwie) => brak oferty');
assert(run(1000, false) === null, 'B2: gracz bez flagi surplus => brak oferty');

console.log('--- C: deficyt AI pozostaje warunkiem wejscia ---');
const cNoDeficit = selectAiTradeBarter({
  aiResources: [
    { key: 'drewno', stock: 1000000, netRate: 0, deficit: false, surplus: true, reserve: 2000 },
    { key: 'zelazo', stock: 0, netRate: 5, deficit: false, surplus: false, reserve: 0 },
  ],
  playerResources: [
    { key: 'drewno', stock: 0, netRate: -20, deficit: true, surplus: false, reserve: 0 },
    { key: 'zelazo', stock: 1030, netRate: 0, deficit: false, surplus: true, reserve: 30 },
  ],
  turns: 10,
  resolvePayloadPn: pricePayload,
  fairnessGate: realGate,
  evaluateExactPayload: realEvaluate,
});
assert(cNoDeficit === null, 'C1: AI bez deficytu => brak oferty mimo nadwyzki gracza');

console.log('--- D: bramka wyceny nadal odrzuca niesprawiedliwa pozycje (realne PW) ---');
assert(handelFairnessGate(10, 1000, AI_PROPOSER_FAIRNESS_REL_TOTAL, 1) != null, 'D1: AI daje 10 PW, dostaje 1000 PW => bramka odrzuca');
assert(realGate(1000, 10) === false, 'D2: realGate odrzuca givePn > receivePn');

console.log(`ai-trade-need-from-surplus-test: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
