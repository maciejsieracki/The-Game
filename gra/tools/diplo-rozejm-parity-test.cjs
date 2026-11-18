'use strict';
/**
 * diplo-rozejm-parity-test.cjs — R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1 (runda 2, punkt 1 DO ZROBIENIA).
 * Rozejm z parytetem siły: X_rozejm = 2000 × (1 − L) (L = zmęczenie wojną pary), S = round(X·r), W = round(X/r),
 * D = S − W; płaci słabsza strona (autor = gracz). Silniejszy gracz bez „Brakuje"; słabszy < D — blokada z kwotą.
 * Run: node tools/diplo-rozejm-parity-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.DIP_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(SRC, '.dip-rozejm-parity-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-rozejm-parity-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { evaluateProposal, treatyBasePnFromConfig, treatyParityBaseX, treatyWearinessLevelOf, treatyParityEnabled } from './game/diplomacy-proposals';
export { peacePwPointsByPowerRatio } from './game/war-weariness';
`);
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE,
  absWorkingDir: SRC, logLevel: 'silent',
});
fs.unlinkSync(ENTRY);
const mod = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; return; }
  fail++;
  console.error('[FAIL]', msg);
}

// Kontrakt danych: rozejm objęty parytetem, baza 2000; pokój poza parytetem.
ok(mod.treatyParityEnabled('rozejm') === true, 'rozejm: parytet włączony w danych');
ok(mod.treatyParityEnabled('pokoj') === false, 'pokój: parytet NIE dotyczy (osobny model P·r/P/r)');
ok(mod.treatyBasePnFromConfig('rozejm', {}) === 2000, `baza rozejmu = 2000 (jest ${mod.treatyBasePnFromConfig('rozejm', {})})`);

// X rozejmu = 2000 × (1 − L); nap bez redukcji zmęczeniem.
ok(mod.treatyParityBaseX('rozejm', {}, 0) === 2000, 'L = 0 → X = 2000');
ok(mod.treatyParityBaseX('rozejm', {}, 0.5) === 1000, 'L = 0,5 → X = 1000 (zmęczenie 0,5 obniża X o połowę)');
ok(mod.treatyParityBaseX('rozejm', {}, 1) === 0, 'L = 1 → X = 0');
ok(mod.treatyParityBaseX('nap', {}, 0.5) === 2000, 'nap: X nie zależy od L');

// Poziom L z ctx.warState: turnsAtWar/40 + 0,1 × utracone miasta.
const L20 = mod.treatyWearinessLevelOf({ warState: { turnsAtWar: 20, lostCitiesResponder: 0, turnsSinceCityChange: 0 } });
ok(Math.abs(L20 - 0.5) < 1e-9, `L po 20 turach bez miast = 0,5 (jest ${L20})`);
ok(mod.treatyWearinessLevelOf({}) === 0, 'brak warState → L = 0');

// Wojna: rozejm wymaga trwającej wojny i ≥ 10 tur wojny. turnsAtWar = 20 → L = 0,5 → X = 1000.
const warBase = {
  relation: { zaufanie: 0, respekt: 0, status: 'wojna' },
  stanWojny: true,
  turn: 50,
  difficulty: 'normal',
  activeDeals: [],
  proposerRespekt: 50,
  responderRespekt: 50,
  proposerWiarygodnosc: 100,
  responderWiarygodnosc: 100,
  warState: {
    turnsAtWar: 20, lostCitiesResponder: 0, turnsSinceCityChange: 0,
    responderRw: 0.5, responderPozycjaMilitarna: undefined,
  },
};
const truce = () => ({ actionId: 'rozejm', proposerOwnerId: 0, responderOwnerId: 1, payload: { turns: 10 } });

// Gracz słabszy (100 vs 400): r = 4, S = 4000, W = 250, D = 3750 przy X = 1000 (L = 0,5).
const weakCtx = { ...warBase, treatyPower: { powerPlayer: 100, powerOther: 400 }, warState: { ...warBase.warState, powerPlayer: 100, powerOther: 400 } };
const strongCtx = { ...warBase, treatyPower: { powerPlayer: 400, powerOther: 100 }, warState: { ...warBase.warState, powerPlayer: 400, powerOther: 100 } };
const weakNoPay = mod.evaluateProposal(truce(), weakCtx);
ok(!weakNoPay.accepted, 'słabszy gracz bez PW: rozejm odrzucony');
ok((weakNoPay.reason ?? '').includes('D = 3750'), `słabszy: kwota D = 3750 (X = 1000 po zmęczeniu), powód: ${weakNoPay.reason}`);
ok(!(weakNoPay.reason ?? '').includes('D = 7500'), 'słabszy: brak kwoty nieskalowanej (D = 7500)');

// Silniejszy gracz: brak blokady „Brakuje N PW" i „parytetu" z własnej wyceny.
const strongNoPay = mod.evaluateProposal(truce(), strongCtx);
ok(!(strongNoPay.reason ?? '').includes('Brakuje'), `silniejszy gracz: brak „Brakuje N PW" (powód: ${strongNoPay.reason})`);
ok(!(strongNoPay.reason ?? '').includes('parytetu'), `silniejszy gracz: brak blokady parytetu (powód: ${strongNoPay.reason})`);

// Brak mocy (treatyPower undefined) → bramka parytetu pominięta.
const noPower = mod.evaluateProposal(truce(), warBase);
ok(!(noPower.reason ?? '').includes('parytetu'), 'brak treatyPower: bramka parytetu pominięta');

// Zmęczenie: turnsAtWar = 10 → L = 0,25 → X = 1500, r = 4 → D = 5625.
const lowWear = { ...weakCtx, warState: { ...warBase.warState, turnsAtWar: 10 } };
const lowWearNoPay = mod.evaluateProposal(truce(), lowWear);
ok((lowWearNoPay.reason ?? '').includes('D = 5625'), `L = 0,25 → X = 1500, D = 5625 (powód: ${lowWearNoPay.reason})`);

// Wzór S/W/D dla rozejmu przy X = 1000: r = 1 / 1,5 / 2,67 / 5 / 10 oraz moc słabszej 0.
const X = 1000;
const cases = [
  { a: 100, b: 100, D: 0 },
  { a: 150, b: 100, D: 1500 - 667 },
  { a: 500, b: 100, D: 4800 },
  { a: 1000, b: 100, D: 9900 },
];
for (const c of cases) {
  const sp = mod.peacePwPointsByPowerRatio(X, c.a, c.b);
  ok(sp.S === Math.round(X * sp.r) && sp.W === Math.round(X / sp.r) && sp.D === sp.S - sp.W,
    `wzór rozejmu (${c.a}/${c.b}): S/W/D spójne z r = ${sp.r.toFixed(2)}`);
  ok(sp.D === c.D, `wzór rozejmu (${c.a}/${c.b}): D = ${c.D} (jest ${sp.D})`);
}
const zeroWeak = mod.peacePwPointsByPowerRatio(X, 5, 0);
ok(zeroWeak.r === 5, `moc słabszej 0: r = moc silniejszej (5), jest ${zeroWeak.r}`);

console.log(`diplo-rozejm-parity-test: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
