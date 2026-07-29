'use strict';
/**
 * diplomacy-acceptance-points-test.cjs — PN akceptacji stołu (Maciej 2026-07-29).
 * Run: node tools/diplomacy-acceptance-points-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.DIP_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(SRC, '.dip-accept-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-accept-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  treatyBaseAcceptancePn,
  computePlayerAcceptanceSides,
  isPlayerIncomingGift,
  playerSideHasBasketOffer,
  acceptancePointsCatalog,
} from './game/diplomacy-acceptance-points';
export {
  diplomacyFairGivePn,
  diplomacyPnTech,
  diplomacySumPn,
  basketSidePnDifficultyMultiplier,
  diplomacyPnSurowiecIlosc,
  diplomacyHandelSurowiecCenaJednostkowa,
} from './game/diplomacy-value-catalog';
export {
  effectiveTreatyPnRequired,
  relationSignedFromTotal,
  relationPnModPct,
  resolveProposalPn,
} from './game/diplomacy-pn-engine';
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

const mod = require(BUNDLE);
let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) { pass++; return; }
  fail++;
  console.error('[FAIL]', msg);
}

ok(mod.treatyBaseAcceptancePn('sojusz_pelny') === 500, 'sojusz_pelny = 500 PN');
ok(mod.treatyBaseAcceptancePn('pokoj') === 500, 'pokoj = 500 PN');
ok(mod.treatyBaseAcceptancePn('nap') === 200, 'nap = 200 PN');
ok(mod.treatyBaseAcceptancePn('umowa_szlakow') === 80, 'traktat handlowy = 80 PN');
ok(mod.treatyBaseAcceptancePn('handel') === 0, 'wymiana = 0 PN bazy');
ok(mod.treatyBaseAcceptancePn('sojusz_pelny') > mod.treatyBaseAcceptancePn('nap'), 'sojusz >> NAP');
ok(mod.treatyBaseAcceptancePn('nap') > mod.treatyBaseAcceptancePn('umowa_szlakow'), 'NAP >> traktat handlowy');
ok(mod.treatyBaseAcceptancePn('umowa_szlakow') >= mod.treatyBaseAcceptancePn('handel'), 'traktat handlowy >= wymiana');

ok(mod.relationSignedFromTotal(100) === 0, 'relTotal 100 → signed 0');
ok(mod.relationSignedFromTotal(150) === 50, 'relTotal 150 → signed +50');
ok(mod.relationSignedFromTotal(50) === -50, 'relTotal 50 → signed -50');
ok(mod.relationPnModPct(50) === 50, 'modPct +50');
ok(mod.relationPnModPct(-50) === -50, 'modPct -50');
ok(mod.relationPnModPct(95) === 90, 'modPct clamp +90');
ok(mod.relationPnModPct(-95) === -90, 'modPct clamp -90');
ok(mod.effectiveTreatyPnRequired(500, 150) === 250, 'pokój @ rel +50 → 250 PN');
ok(mod.effectiveTreatyPnRequired(500, 50) === 750, 'pokój @ rel -50 → 750 PN');
ok(mod.effectiveTreatyPnRequired(200, 150) === 100, 'NAP @ rel +50 → 100 PN');
ok(mod.effectiveTreatyPnRequired(200, 50) === 300, 'NAP @ rel -50 → 300 PN');
ok(mod.effectiveTreatyPnRequired(0, 100) === 0, 'handel base 0 → 0 effective');

const giftPayload = {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 50 }],
  receiveItems: [],
};
ok(mod.isPlayerIncomingGift(giftPayload), 'incoming gift: they give, we empty');
ok(!mod.playerSideHasBasketOffer(giftPayload, true), 'gift: player side has no basket offer');

const tradePayload = {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 80 }],
};
ok(mod.playerSideHasBasketOffer(tradePayload, false), 'trade: player gives gold');

const sides = mod.computePlayerAcceptanceSides('handel', tradePayload, 100, false);
ok(sides.my.offerPn === 100, 'player offer 100 PN');
ok(sides.my.demandPn === 80, 'player demand 80 PN');
ok(sides.my.fairMinPn === 80, 'fair min @ rel 100 = 80');
ok(sides.my.balancePn === 20, 'balance +20 PN');
ok(sides.my.accepted, 'fair trade accepted @ rel 100');
ok(sides.my.treatyBasePn === 0, 'handel: no treaty base on player side');

const napSides = mod.computePlayerAcceptanceSides(
  'nap',
  { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 90 }] },
  151,
  false,
);
ok(napSides.my.treatyEffectivePn === 98, 'NAP @ rel +51 effective 98 PN');
ok(!napSides.my.accepted, 'NAP 90 PN koszyk < effective 98');

const giftSides = mod.computePlayerAcceptanceSides('dar', giftPayload, 100, true);
ok(giftSides.isGift, 'dar flagged as gift');
ok(giftSides.my.statusLabel === 'Nic w zamian', 'gift my label');

const catalog = mod.acceptancePointsCatalog();
ok(catalog.traktaty && catalog.traktaty.nap, 'catalog has traktaty');
ok(catalog.koszyk_pn && catalog.koszyk_pn.zloto, 'catalog has koszyk');

ok(mod.diplomacyFairGivePn(80, 50) === 160, 'fair @ rel 50 doubles demand');

// Tech PN baza (bez trudności) = koszt × tempo
ok(mod.diplomacyPnTech('Obróbka drewna', 'szybka') === 5, 'tech baza @ szybka = 5 (bez mnożnika trudności)');

// Globalny mnożnik trudności per strona koszyka (Maciej 2026-07-29)
ok(mod.basketSidePnDifficultyMultiplier('give', 'easy', 0, 0) === 1.5, 'player gives easy ×1.5');
ok(mod.basketSidePnDifficultyMultiplier('give', 'hard', 0, 0) === 0.5, 'player gives hard ×0.5');
ok(mod.basketSidePnDifficultyMultiplier('receive', 'easy', 0, 0) === 0.5, 'player receives easy ×0.5');
ok(mod.basketSidePnDifficultyMultiplier('receive', 'hard', 0, 0) === 1.5, 'player receives hard ×1.5');

const techSellPayload = {
  giveItems: [{ typ: 'tech', id: 'Obróbka drewna' }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 8 }],
};
const techSellPn = mod.resolveProposalPn(techSellPayload, {
  difficulty: 'easy',
  proposerOwnerId: 0,
  playerOwnerId: 0,
  tempoGry: 'szybka',
});
ok(techSellPn.givePn === 8, 'resolveProposalPn: player sells tech easy = 8 PN (5×1.5)');

const techBuyPayload = {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 3 }],
  receiveItems: [{ typ: 'tech', id: 'Obróbka drewna' }],
};
const techBuyPn = mod.resolveProposalPn(techBuyPayload, {
  difficulty: 'easy',
  proposerOwnerId: 0,
  playerOwnerId: 0,
  tempoGry: 'szybka',
});
ok(techBuyPn.receivePn === 3, 'resolveProposalPn: player buys tech easy = 3 PN (5×0.5)');

const goldHardPayload = {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }],
  receiveItems: [],
};
const goldHardPn = mod.resolveProposalPn(goldHardPayload, {
  difficulty: 'hard',
  proposerOwnerId: 0,
  playerOwnerId: 0,
});
ok(goldHardPn.givePn === 50, 'resolveProposalPn: player gives 100¤ hard = 50 PN (×0.5)');

const goldEasyReceive = mod.resolveProposalPn(
  {
    giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }],
    receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 40 }],
  },
  { difficulty: 'easy', proposerOwnerId: 1, playerOwnerId: 0 },
);
ok(goldEasyReceive.givePn === 50, 'AI gives 100¤ easy → player receives ×0.5 = 50 PN');
ok(goldEasyReceive.receivePn === 60, 'player gives 40¤ easy (AI proposal) → ×1.5 = 60 PN');

// Maciej 2026-07-29: surowiec_ilosc PN/szt. w koszyku akceptacji
ok(mod.diplomacyHandelSurowiecCenaJednostkowa('sol') === 2, 'acceptance: sol 2 PN/szt.');
ok(mod.diplomacyPnSurowiecIlosc('braz', 1) === 150, 'acceptance: 1 pakiet braz = 150 PN');
ok(mod.diplomacyHandelSurowiecCenaJednostkowa('zloto') === 50, 'acceptance: zloto-surowiec 50 PN/szt.');
ok(mod.diplomacyHandelSurowiecCenaJednostkowa('wegiel') === 20, 'acceptance: wegiel 20 PN/szt.');
ok(mod.diplomacyPnSurowiecIlosc('zloto', 1) === 500, 'acceptance: 1 pakiet zloto = 500 PN');
const woodTradePn = mod.resolveProposalPn({
  giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 1 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 10 }],
}, { difficulty: 'normal', proposerOwnerId: 0, playerOwnerId: 0 });
ok(woodTradePn.givePn === 10, 'resolveProposalPn: 1 pakiet drewno = 10 PN');

try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }

console.log(`diplomacy-acceptance-points-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
