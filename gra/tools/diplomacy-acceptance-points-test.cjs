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
  bilateralTreatyDisplayPw,
  sideDisplayOfferPw,
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
export {
  renderPnBalancePanelForTreaty,
  renderPnBalancePanelForPeace,
} from './ui/diplomacyAcceptanceBalance';
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
ok(sides.my.statusLabel === 'Nadwyżka +20 PW', 'UI statusLabel uses PW skrót');
ok(sides.my.treatyBasePn === 0, 'handel: no treaty base on player side');

const napSides = mod.computePlayerAcceptanceSides(
  'nap',
  { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 90 }] },
  151,
  false,
);
ok(napSides.my.treatyEffectivePn === 98, 'NAP @ rel +51 effective 98 PN');
ok(napSides.my.accepted, 'NAP ze słodzikiem 90¤: Rel wystarczy (koszyk nie musi ≥ effective PN)');
ok(napSides.my.offerPn === 90, 'NAP słodzik: offerPn = 90 z koszyka');

const giftSides = mod.computePlayerAcceptanceSides('dar', giftPayload, 100, true);
ok(giftSides.isGift, 'dar flagged as gift');
ok(giftSides.my.statusLabel === 'Nic w zamian', 'gift my label');

const napTreatyOnly = mod.computePlayerAcceptanceSides('nap', {}, 100, false);
ok(napTreatyOnly.my.mode === 'treaty', 'NAP bez koszyka: mode treaty');
ok(napTreatyOnly.my.treatyEffectivePn === 200, 'NAP @ rel 100 effective 200 PW');
ok(mod.bilateralTreatyDisplayPw(napTreatyOnly.my, napTreatyOnly.their) === 200, 'bilateral NAP display 200 PW');
ok(mod.sideDisplayOfferPw(napTreatyOnly.my, 200) === 200, 'proposer side display 200 PW');
ok(mod.sideDisplayOfferPw(napTreatyOnly.their, 200) === 200, 'responder side display 200 PW (bilateral)');

const napIncoming = mod.computePlayerAcceptanceSides('nap', {}, 100, true);
ok(napIncoming.their.treatyEffectivePn === 200, 'incoming NAP: their side treaty 200 PW');
ok(mod.sideDisplayOfferPw(napIncoming.my, 200) === 200, 'incoming: my bilateral display 200 PW');
ok(mod.sideDisplayOfferPw(napIncoming.their, 200) === 200, 'incoming: their display 200 PW');

// Wszystkie traktaty z bazą PW > 0 — wspólna ścieżka bilateralTreatyDisplayPw / sideDisplayOfferPw
const TREATY_PW_BASE = [
  ['pokoj', 500],
  ['sojusz_pelny', 500],
  ['sojusz_defensywny', 420],
  ['nap', 200],
  ['umowa_szlakow', 80],
  ['umowa_handlowa', 80],
  ['granice', 60],
  ['wasal', 350],
  ['trybut_zadanie', 120],
  ['trybut_oferta', 100],
  ['namow_wojne', 150],
  ['ultimatum', 180],
];
for (const [actionId, base] of TREATY_PW_BASE) {
  const pure = mod.computePlayerAcceptanceSides(actionId, {}, 100, false);
  ok(pure.my.mode === 'treaty', `${actionId}: pure mode treaty`);
  ok(pure.my.treatyBasePn === base, `${actionId}: treatyBasePn ${base}`);
  const bil = mod.bilateralTreatyDisplayPw(pure.my, pure.their);
  ok(bil === base, `${actionId}: bilateral display ${base} PW @ rel 100`);
  ok(mod.sideDisplayOfferPw(pure.my, bil) === base, `${actionId}: proposer card/panel ${base} PW`);
  ok(mod.sideDisplayOfferPw(pure.their, bil) === base, `${actionId}: responder card/panel ${base} PW`);
  ok(pure.my.offerPn === 0, `${actionId}: raw offerPn 0 before display helper`);
}

// Mixed: NAP + koszyk — panel/karta musi sumować traktat + koszyk
const napMixed = mod.computePlayerAcceptanceSides(
  'nap',
  { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 50 }] },
  100,
  false,
);
ok(napMixed.my.mode === 'mixed', 'NAP+gold: mode mixed');
const napMixedBil = mod.bilateralTreatyDisplayPw(napMixed.my, napMixed.their);
ok(napMixedBil === 200, 'NAP+gold: bilateral 200');
ok(mod.sideDisplayOfferPw(napMixed.my, napMixedBil) === 250, 'NAP+gold: my display 50+200 PW');
ok(mod.sideDisplayOfferPw(napMixed.their, napMixedBil) === 200, 'NAP+gold: their display 200 PW');

// Baza 0 — tylko koszyk
ok(mod.treatyBaseAcceptancePn('handel') === 0, 'handel base 0');
ok(mod.treatyBaseAcceptancePn('tech') === 0, 'tech base 0');
const handelOnly = mod.computePlayerAcceptanceSides(
  'handel',
  { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 30 }], receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 20 }] },
  100,
  false,
);
ok(handelOnly.my.mode === 'basket', 'handel: mode basket');
ok(mod.bilateralTreatyDisplayPw(handelOnly.my, handelOnly.their) === undefined, 'handel: no bilateral treaty PW');
ok(mod.sideDisplayOfferPw(handelOnly.my, undefined) === 30, 'handel: my 30 PW koszyk only');

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

// Pokój @ rel 77 (Maciej 2026-08-01): symetryczny traktat 615 PW — NIE fair-min −184
ok(mod.effectiveTreatyPnRequired(500, 77) === 615, 'pokój @ rel 77: traktat effective 615 PW');
const peacePure77 = mod.computePlayerAcceptanceSides('pokoj', {}, 77, false);
ok(peacePure77.their.accepted, 'pokój czysty @ rel 77: accepted');
ok(peacePure77.their.balancePn === 0, 'pokój czysty @ rel 77: bilans 0 (nie fair-min)');
ok(mod.diplomacyFairGivePn(615, 77) === 799, 'kontrola: fair-min handlu 615→799 (nie dotyczy pokoju)');
const peaceSym77 = mod.computePlayerAcceptanceSides(
  'pokoj',
  {
    giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 10 }],
    receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 10 }],
  },
  77,
  false,
);
ok(peaceSym77.their.accepted, 'pokój symetryczny 10¤ @ rel 77: accepted (jak silnik)');
ok(peaceSym77.their.balancePn === 0, 'pokój symetryczny: bilans 0 nie −184');
ok(peaceSym77.their.balancePn !== -184, 'pokój: bez fałszywego fair-min na traktacie');
const peaceSweet77 = mod.computePlayerAcceptanceSides(
  'pokoj',
  { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 50 }] },
  77,
  false,
);
ok(peaceSweet77.their.accepted, 'pokój + dar 50¤: accepted');
ok(peaceSweet77.their.balancePn === 50, 'pokój + dar 50¤: nadwyżka +50 PW');

// NAP @ rel 52 — panel traktatowy NIE fair-min (Maciej 2026-08-02, BUG-DYPLO-NAP-FAIRMIN-FALSE)
ok(mod.effectiveTreatyPnRequired(200, 52) === 296, 'NAP @ rel 52: effective 296 PW');
const napPanel52 = mod.renderPnBalancePanelForTreaty(296, 0, 0, 52, 'Pakt o nieagresji', 50);
ok(napPanel52.includes('296 PW @ Rel 52'), 'NAP panel @ rel 52: meta traktatu');
ok(!napPanel52.includes('fair min'), 'NAP panel @ rel 52: bez fair min');
ok(!napPanel52.includes('Brakuje 274'), 'NAP panel @ rel 52: bez fałszywego Brakuje 274');
ok(napPanel52.includes('da-pn-balance-bar ok'), 'NAP panel @ rel 52: tone ok przy Rel ≥50');

const napPanel40 = mod.renderPnBalancePanelForTreaty(300, 0, 0, 40, 'Pakt o nieagresji', 50);
ok(napPanel40.includes('wym. 50'), 'NAP panel @ rel 40: komunikat Relacji');
ok(!napPanel40.includes('fair min'), 'NAP panel @ rel 40: bez fair-min handlu');
ok(napPanel40.includes('da-pn-balance-bar no'), 'NAP panel @ rel 40: tone no');

// Pokój — panel traktatowy (regresja po uogólnieniu)
const peacePanel77 = mod.renderPnBalancePanelForPeace(615, 0, 0, 77, 'Propozycja pokoju');
ok(peacePanel77.includes('Traktat pokoju: 615 PW @ Rel 77'), 'pokój panel: meta traktatu');
ok(!peacePanel77.includes('fair min'), 'pokój panel: bez fair min');
ok(!peacePanel77.includes('Brakuje'), 'pokój panel: bez fałszywego Brakuje');
ok(peacePanel77.includes('da-pn-balance-bar ok'), 'pokój panel: tone ok');

try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }

console.log(`diplomacy-acceptance-points-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
