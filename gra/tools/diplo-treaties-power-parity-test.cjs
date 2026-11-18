'use strict';
/**
 * diplo-treaties-power-parity-test.cjs — R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1 (wersja 1).
 * Parytet siły dla traktatów z `parytet: true` (nap, sojusz_defensywny, sojusz_pelny, granice, wasal):
 * S = round(X·r), W = round(X/r), D = S − W; słabszy gracz płaci D (po rabacie relacji).
 * Run: node tools/diplo-treaties-power-parity-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.DIP_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(SRC, '.dip-parity-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-parity-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { evaluateProposal, treatyBasePnFromConfig } from './game/diplomacy-proposals';
export { peacePwPointsByPowerRatio } from './game/war-weariness';
`);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: SRC,
  logLevel: 'silent',
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

// 1) Wzór S/W/D dla X = 2000 (nowa baza NAP/sojuszu skala ×10) przy r = 1 / 1,5 / ~2,67 / 5 / 10.
const X = 2000;
const cases = [
  { a: 100, b: 100, S: 2000, W: 2000, D: 0, label: 'r = 1' },
  { a: 150, b: 100, S: 3000, W: 1333, D: 1667, label: 'r = 1,5' },
  { a: 6969, b: 2611, S: 5338, W: 749, D: 4589, label: 'r ≈ 2,67 (6969/2611)' },
  { a: 500, b: 100, S: 10000, W: 400, D: 9600, label: 'r = 5' },
  { a: 1000, b: 100, S: 20000, W: 200, D: 19800, label: 'r = 10' },
];
for (const c of cases) {
  const sp = mod.peacePwPointsByPowerRatio(X, c.a, c.b);
  ok(sp.S === c.S, `wzór ${c.label}: S = ${c.S} (jest ${sp.S})`);
  ok(sp.W === c.W, `wzór ${c.label}: W = ${c.W} (jest ${sp.W})`);
  ok(sp.D === c.D, `wzór ${c.label}: D = ${c.D} (jest ${sp.D})`);
}
// Słabsza strona o mocy 0: mianownik chroniony (max(1, …)), r = moc silniejszej.
const zero = mod.peacePwPointsByPowerRatio(X, 5, 0);
ok(zero.r === 5, `moc słabszej 0: r = moc silniejszej (5), jest ${zero.r}`);

// 2) Bramka silnika: gracz proponuje NAP (bez koszyka) — słabszy płaci D, silniejszy nie.
const baseCtx = {
  relation: { zaufanie: 150, respekt: 150, status: 'pokoj' },
  stanWojny: false,
  turn: 1,
  difficulty: 'normal',
  activeDeals: [],
  proposerRespekt: 50,
  responderRespekt: 50,
  proposerWiarygodnosc: 100,
  responderWiarygodnosc: 100,
};
const napProposal = (payload) => ({ actionId: 'nap', proposerOwnerId: 0, responderOwnerId: 1, payload });

// Gracz słabszy: moc 100 vs 400 → r = 4, S = 8000, W = 500, D = 7500 (przy X = 2000, turns brak → ×1).
const weakCtx = { ...baseCtx, treatyPower: { powerPlayer: 100, powerOther: 400 } };
const weakNoPay = mod.evaluateProposal(napProposal({}), weakCtx);
ok(!weakNoPay.accepted, 'słabszy gracz bez oferty D: odrzucony');
ok((weakNoPay.reason ?? '').includes('parytetu'), `słabszy gracz bez oferty D: powód z „parytetu” (jest: ${weakNoPay.reason})`);

// Silniejszy gracz: moc 400 vs 100 → bez blokady parytetu.
const strongCtx = { ...baseCtx, treatyPower: { powerPlayer: 400, powerOther: 100 } };
const strongNoPay = mod.evaluateProposal(napProposal({}), strongCtx);
ok(!(strongNoPay.reason ?? '').includes('parytetu'), `silniejszy gracz: brak blokady parytetu (powód: ${strongNoPay.reason})`);

// Brak danych o mocy → bramka pominięta (zachowanie sprzed rundy).
const noPowerEval = mod.evaluateProposal(napProposal({}), baseCtx);
ok(!(noPowerEval.reason ?? '').includes('parytetu'), 'brak treatyPower: bramka parytetu pominięta');

// Traktat spoza listy parytetu (np. umowa_handlowa) — bez zmian.
const tradeEval = mod.evaluateProposal(
  { actionId: 'umowa_handlowa', proposerOwnerId: 0, responderOwnerId: 1, payload: {} },
  weakCtx,
);
ok(!(tradeEval.reason ?? '').includes('parytetu'), 'umowa_handlowa (spoza parytetu): brak blokady parytetu');

// Baza NAP po ×10 (kontrakt danych).
ok(mod.treatyBasePnFromConfig('nap', {}) === 2000, `baza NAP w konfigu = 2000 (jest ${mod.treatyBasePnFromConfig('nap', {})})`);

// R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1 (obrona r2, zarzut 7a): wzor S/W/D dla X z KONFIGU kazdego z 5 traktatow
// z parytetem (nie tylko X = 2000), przy r = 1 / 1,5 / 2,67 / 5 — S = round(X·r), W = round(X/r), D = S − W.
for (const act of ['nap', 'sojusz_defensywny', 'sojusz_pelny', 'granice', 'wasal']) {
  const Xc = mod.treatyBasePnFromConfig(act, {});
  for (const [a, b] of [[100, 100], [150, 100], [6969, 2611], [500, 100]]) {
    const sp = mod.peacePwPointsByPowerRatio(Xc, a, b);
    const r = a / b;
    ok(sp.S === Math.round(Xc * r) && sp.W === Math.round(Xc / r) && sp.D === sp.S - sp.W,
      `${act} (X=${Xc}) r=${r.toFixed(2)}: S/W/D = wzor (jest S=${sp.S} W=${sp.W} D=${sp.D})`);
  }
}
// (zarzut 4, dla sojuszu/NAP): silniejszy gracz z koszykiem PW nie dostaje „Brakuje … parytetu" z wlasnej wyceny X.
const strongBasket = mod.evaluateProposal(
  napProposal({ giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 50 }] }),
  strongCtx,
);
ok(!(strongBasket.reason ?? '').includes('parytetu'),
  `silniejszy gracz z koszykiem: brak blokady „parytetu" (powód: ${strongBasket.reason})`);

// R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1 (runda 3, zarzut 4): podział PW (treatyPowerSplit) dla sojuszu/NAP
// trafia do panelu stołu — ten sam wzór co peacePwPointsByPowerRatio, bez zmiany accepted/reason.
const alliancePayload = {};
const allianceX = mod.treatyBasePnFromConfig('sojusz_pelny', alliancePayload);
const allianceProposal = { actionId: 'sojusz_pelny', proposerOwnerId: 0, responderOwnerId: 1, payload: alliancePayload };
const weakSplitCtx = { ...baseCtx, treatyPower: { powerPlayer: 100, powerOther: 400 } };
const strongSplitCtx = { ...baseCtx, treatyPower: { powerPlayer: 400, powerOther: 100 } };
const weakAlliance = mod.evaluateProposal(allianceProposal, weakSplitCtx);
const strongAlliance = mod.evaluateProposal(allianceProposal, strongSplitCtx);
const noPowerAlliance = mod.evaluateProposal(allianceProposal, baseCtx);
const tradeSplit = mod.evaluateProposal(
  { actionId: 'umowa_handlowa', proposerOwnerId: 0, responderOwnerId: 1, payload: {} },
  weakSplitCtx,
);
const expSplitWeak = mod.peacePwPointsByPowerRatio(allianceX, 100, 400);
ok(weakAlliance.treatyPowerSplit != null, 'sojusz słabszy gracz: treatyPowerSplit obecny');
ok(weakAlliance.treatyPowerSplit && weakAlliance.treatyPowerSplit.playerStronger === false,
  'sojusz słabszy gracz: playerStronger = false');
ok(weakAlliance.treatyPowerSplit && weakAlliance.treatyPowerSplit.D === expSplitWeak.D
  && weakAlliance.treatyPowerSplit.S === expSplitWeak.S && weakAlliance.treatyPowerSplit.W === expSplitWeak.W,
  `sojusz słabszy gracz: S/W/D = wzór dla X=${allianceX} (jest ${JSON.stringify(weakAlliance.treatyPowerSplit)})`);
ok(weakAlliance.treatyPowerSplit && weakAlliance.treatyPowerSplit.r === 4,
  'sojusz słabszy gracz: r = 400/100 = 4');
ok(strongAlliance.treatyPowerSplit && strongAlliance.treatyPowerSplit.playerStronger === true,
  'sojusz silniejszy gracz: playerStronger = true');
ok(noPowerAlliance.treatyPowerSplit === undefined, 'sojusz bez treatyPower: brak treatyPowerSplit');
ok(tradeSplit.treatyPowerSplit === undefined, 'umowa_handlowa (spoza parytetu): brak treatyPowerSplit');

console.log(`diplo-treaties-power-parity-test: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
