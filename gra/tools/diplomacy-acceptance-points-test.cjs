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
  computeIncomingPlayerAcceptNetPw,
  previewIncomingPlayerAccept,
  isPlayerIncomingGift,
  playerSideHasBasketOffer,
  acceptancePointsCatalog,
  bilateralTreatyDisplayPw,
  sideDisplayOfferPw,
} from './game/diplomacy-acceptance-points';
export { evaluateProposal } from './game/diplomacy-proposals';
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
  formatRelationModLabel,
  resolveProposalPn,
  partnerTreatyPnRequired,
  playerTreatyPnRequired,
  treatyPwForRole,
} from './game/diplomacy-pn-engine';
export {
  renderPnBalancePanelForTreaty,
  renderPnBalancePanelForPeace,
  renderPnBalancePanelHtml,
  balancePanelDataFromRow,
  isIncomingBasketTradePanel,
  incomingTradeNetBalancePw,
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

// R-DYPLO-PW-PRZECINEK: bez śmieci IEEE w modPct / etykietach Relacji (Maciej 2026-08-04)
const modPct896 = mod.relationPnModPct(mod.relationSignedFromTotal(89.6));
ok(modPct896 === -10.4, 'modPct @ rel 89.6 → −10.4 (nie float junk)');
ok(!String(modPct896).includes('000000'), 'modPct string bez 000000');
const relLabel896 = mod.formatRelationModLabel(89.6);
ok(!relLabel896.includes('000000'), 'formatRelationModLabel bez 000000');
ok(relLabel896.includes('−10,4%'), 'formatRelationModLabel polski przecinek −10,4%');

ok(mod.effectiveTreatyPnRequired(500, 150) === 750, 'pokój @ rel +50 → 750 PN (gracz)');
ok(mod.effectiveTreatyPnRequired(500, 50) === 250, 'pokój @ rel -50 → 250 PN (gracz)');
ok(mod.effectiveTreatyPnRequired(200, 150) === 300, 'NAP @ rel +50 → 300 PN (gracz)');
ok(mod.effectiveTreatyPnRequired(200, 50) === 100, 'NAP @ rel -50 → 100 PN (gracz)');
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
ok(napSides.my.treatyEffectivePn === 302, 'NAP @ rel +51 effective 302 PN');
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
ok(mod.sideDisplayOfferPw(napTreatyOnly.their, 200) === 200, 'responder side display 200 PW (baza @ rel 100)');

const napIncoming = mod.computePlayerAcceptanceSides('nap', {}, 100, true);
ok(napIncoming.their.treatyEffectivePn === 200, 'incoming NAP: their side treaty 200 PW (baza)');
ok(mod.sideDisplayOfferPw(napIncoming.my, 200) === 200, 'incoming: my display 200 PW');
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
  ok(mod.sideDisplayOfferPw(pure.their, bil) === base, `${actionId}: responder card/panel ${base} PW (baza @ rel 100)`);
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
ok(mod.sideDisplayOfferPw(napMixed.their, napMixedBil) === 200, 'NAP+gold: their display 200 PW (baza)');

// Asymetria Relacja→PW: partner = baza, gracz @ Relacji (Maciej 2026-08-04)
ok(mod.partnerTreatyPnRequired(80) === 80, 'partner treaty = baza 80');
const tradeTreaty52 = mod.computePlayerAcceptanceSides('umowa_handlowa', {}, 52, false);
ok(tradeTreaty52.my.treatyEffectivePn === 42, 'umowa_handlowa @ rel 52: gracz 42 PW');
ok(tradeTreaty52.their.treatyEffectivePn === 80, 'umowa_handlowa @ rel 52: partner 80 PW');
ok(mod.sideDisplayOfferPw(tradeTreaty52.my, undefined) === 42, 'umowa_handlowa @ rel 52: my display 42');
ok(mod.sideDisplayOfferPw(tradeTreaty52.their, undefined) === 80, 'umowa_handlowa @ rel 52: their display 80');
const tradeTreaty100 = mod.computePlayerAcceptanceSides('umowa_handlowa', {}, 100, false);
ok(tradeTreaty100.my.treatyEffectivePn === 80 && tradeTreaty100.their.treatyEffectivePn === 80, 'umowa_handlowa @ rel 100: obie 80');
const tradeTreaty148 = mod.computePlayerAcceptanceSides('umowa_handlowa', {}, 148, false);
ok(tradeTreaty148.my.treatyEffectivePn === 118, 'umowa_handlowa @ rel 148: gracz 118 PW');
ok(tradeTreaty148.their.treatyEffectivePn === 80, 'umowa_handlowa @ rel 148: partner 80 PW');

// Bilans PW traktatu — akceptacja tylko gdy bilans ≥ 0 (Maciej 2026-08-04, FALA 213)
const trade92 = mod.computePlayerAcceptanceSides('umowa_szlakow', {}, 92, false);
ok(trade92.my.treatyEffectivePn === 74, 'rel 92: gracz 74');
ok(trade92.my.balancePn === -6, 'rel 92: bilans -6');
ok(trade92.my.accepted === false, 'rel 92: NIE accepted przy bilansie < 0');
ok(trade92.their.accepted === false, 'rel 92: their też false');

const trade100 = mod.computePlayerAcceptanceSides('umowa_szlakow', {}, 100, false);
ok(trade100.my.accepted === true && trade100.my.balancePn === 0, 'rel 100: accepted @ 0');

const tradeTopUp = mod.computePlayerAcceptanceSides(
  'umowa_szlakow',
  { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 6 }] },
  92,
  false,
);
ok(tradeTopUp.my.accepted === true, 'rel 92 + 6¤: accepted po dopłacie');

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

// Pokój @ rel 77 — asymetria: gracz 385 PW, partner 500 PW (baza)
ok(mod.effectiveTreatyPnRequired(500, 77) === 385, 'pokój @ rel 77: traktat gracz 385 PW');
ok(mod.partnerTreatyPnRequired(500) === 500, 'pokój @ rel 77: partner 500 PW (baza)');
const peacePure77 = mod.computePlayerAcceptanceSides('pokoj', {}, 77, false);
ok(!peacePure77.their.accepted, 'pokój czysty @ rel 77: nie accepted (bilans −115 PW)');
ok(peacePure77.my.balancePn === -115, 'pokój czysty @ rel 77: asymetria −115 PW (385−500)');
ok(peacePure77.my.treatyEffectivePn === 385, 'pokój @ rel 77: gracz 385 PW');
ok(peacePure77.their.treatyEffectivePn === 500, 'pokój @ rel 77: partner 500 PW');
ok(mod.diplomacyFairGivePn(385, 77) === 500, 'kontrola: fair-min handlu 385→500 (nie dotyczy pokoju)');
const peaceSym77 = mod.computePlayerAcceptanceSides(
  'pokoj',
  {
    giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 10 }],
    receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 10 }],
  },
  77,
  false,
);
ok(!peaceSym77.their.accepted, 'pokój symetryczny 10¤ @ rel 77: nie accepted (gracz słabsza @ rel 77)');
ok(peaceSym77.my.balancePn === -115, 'pokój symetryczny: asymetria strukturalna −115 (nie fair-min)');
ok(peaceSym77.my.balancePn !== -184, 'pokój: bez fałszywego fair-min na traktacie');
const peaceSweet77 = mod.computePlayerAcceptanceSides(
  'pokoj',
  { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 50 }] },
  77,
  false,
);
ok(!peaceSweet77.their.accepted, 'pokój + dar 50¤: nie accepted (brakuje 65 PW)');
ok(peaceSweet77.my.balancePn === -65, 'pokój + dar 50¤: asymetria 385+50−500 = −65 PW');

// NAP @ rel 52 — panel traktatowy NIE fair-min (Maciej 2026-08-02, BUG-DYPLO-NAP-FAIRMIN-FALSE)
ok(mod.effectiveTreatyPnRequired(200, 52) === 104, 'NAP @ rel 52: effective 104 PW');
const napPanel52 = mod.renderPnBalancePanelForTreaty(104, 0, 0, 52, 'Pakt o nieagresji', 50, 'Traktat', 200, 200);
ok(napPanel52.includes('Ty: baza 200 → 104'), 'NAP panel @ rel 52: meta gracz baza→effective');
ok(napPanel52.includes('Oni: 200 PW (baza)'), 'NAP panel @ rel 52: meta partner baza');
ok(!napPanel52.includes('fair min'), 'NAP panel @ rel 52: bez fair min');
ok(!napPanel52.includes('Brakuje 274'), 'NAP panel @ rel 52: bez fałszywego Brakuje 274');
ok(napPanel52.includes('da-pn-balance-bar no'), 'NAP panel @ rel 52: tone no (gracz słabsza @ rel 52)');

const napPanel40 = mod.renderPnBalancePanelForTreaty(80, 0, 0, 40, 'Pakt o nieagresji', 50, 'Traktat', 200, 200);
ok(napPanel40.includes('wym. 50'), 'NAP panel @ rel 40: komunikat Relacji');
ok(!napPanel40.includes('fair min'), 'NAP panel @ rel 40: bez fair-min handlu');
ok(napPanel40.includes('da-pn-balance-bar no'), 'NAP panel @ rel 40: tone no');

// Pokój — panel traktatowy asymetryczny
const peacePanel77 = mod.renderPnBalancePanelForPeace(385, 0, 0, 77, 'Propozycja pokoju', 500);
ok(peacePanel77.includes('Ty: baza 500 → 385'), 'pokój panel: meta gracz');
ok(peacePanel77.includes('Oni: 500 PW (baza)'), 'pokój panel: meta partner');
ok(!peacePanel77.includes('fair min'), 'pokój panel: bez fair min');
ok(peacePanel77.includes('Brakuje 115'), 'pokój panel: Brakuje 115 PW (gracz słabsza)');
ok(peacePanel77.includes('da-pn-balance-bar no'), 'pokój panel: tone no @ rel 77');

// Traktat handlowy incoming: gracz oddaje więcej — net +120, bez „Brakuje" / fair-min (Maciej 2026-08-02)
const incomingTradePayload = {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 8 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 20 }],
  resourceTradeMode: 'per_turn',
  turns: 10,
};
const incomingTrade = mod.computePlayerAcceptanceSides('umowa_szlakow', incomingTradePayload, 100, true);
ok(incomingTrade.my.accepted, 'incoming traktat handlowy: gracz może przyjąć (my.accepted)');
ok(incomingTrade.my.offerPn === 200, 'incoming: my oddaję 200 PW');
ok(incomingTrade.their.offerPn === 80, 'incoming: oni oddają 80 PW');
ok(incomingTrade.their.balancePn === 120, 'incoming: net przewaga u nich +120 PW');
ok(incomingTrade.their.statusLabel.includes('Przewaga u nich'), 'incoming: status przewaga u nich');
ok(!incomingTrade.their.statusLabel.includes('Brakuje'), 'incoming: bez fałszywego Brakuje');

const incomingRow = {
  direction: 'incoming',
  actionLabel: 'Traktat handlowy',
  acceptanceMy: incomingTrade.my,
  acceptanceTheir: incomingTrade.their,
  canAccept: true,
};
const panelData = mod.balancePanelDataFromRow(incomingRow, 0);
ok(panelData != null, 'incoming: panel data');
ok(mod.isIncomingBasketTradePanel(panelData), 'incoming: basket trade panel');
ok(mod.incomingTradeNetBalancePw(panelData) === 120, 'incoming: net helper 120');
const incomingPanel = mod.renderPnBalancePanelHtml(panelData);
ok(incomingPanel.includes('+120'), 'incoming panel: +120 netto');
ok(!incomingPanel.includes('Brakuje'), 'incoming panel: bez Brakuje');
ok(incomingPanel.includes('Bilans (netto)'), 'incoming panel: etykieta netto');
ok(incomingPanel.includes('da-pn-balance-bar ok'), 'incoming panel: tone ok przy canAccept');

// R-PW-ACCEPT-OVERPAY-Q1=A: incoming overpay (160 vs 100) → accept; underpay → block
const overpayPayload = {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 160 }],
};
const overpayPreview = mod.previewIncomingPlayerAccept('handel', overpayPayload, 100);
ok(overpayPreview != null && overpayPreview.accepted, 'incoming overpay handel: preview accepted');
const overpayNet = mod.computeIncomingPlayerAcceptNetPw('handel', overpayPayload, 100);
ok(overpayNet != null && overpayNet.netPw === 60, 'incoming overpay: net +60 PW (160−100)');

const underpayPayload = {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 160 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }],
};
const underpayPreview = mod.previewIncomingPlayerAccept('handel', underpayPayload, 100);
ok(underpayPreview != null && !underpayPreview.accepted, 'incoming underpay handel: preview blocked');
ok(underpayPreview.reason.includes('nieuczciwa'), 'incoming underpay: reason mentions unfair');
const underpayNet = mod.computeIncomingPlayerAcceptNetPw('handel', underpayPayload, 100);
ok(underpayNet != null && underpayNet.netPw === -60, 'incoming underpay: net −60 PW');

// AI evaluating player offer: bilateral net (outgoing)
const playerUnderpaySides = mod.computePlayerAcceptanceSides('handel', overpayPayload, 100, false);
ok(!playerUnderpaySides.their.accepted, 'outgoing underpay handel: their.accepted false (gracz bierze za dużo)');
const playerOverpaySides = mod.computePlayerAcceptanceSides('handel', underpayPayload, 100, false);
ok(playerOverpaySides.their.accepted, 'outgoing overpay handel: their.accepted true (gracz dopłaca)');

const underpayRow = {
  direction: 'incoming',
  actionLabel: 'Wymiana',
  acceptanceMy: mod.computePlayerAcceptanceSides('handel', underpayPayload, 100, true).my,
  acceptanceTheir: mod.computePlayerAcceptanceSides('handel', underpayPayload, 100, true).their,
  canAccept: false,
};
const underpayPanelData = mod.balancePanelDataFromRow(underpayRow, 0);
const underpayPanel = mod.renderPnBalancePanelHtml(underpayPanelData);
ok(underpayPanel.includes('da-pn-balance-bar no'), 'incoming underpay panel: tone no');
ok(underpayPanel.includes('nieuczciwa'), 'incoming underpay panel: unfair message');

// BUG: outgoing handel — their.accepted musi być false gdy partner traci (nie odwrócone pnDealAcceptedByAi)
const woodUnfair = {
  giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 1 }],
  receiveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 3 }],
};
const woodOut = mod.computePlayerAcceptanceSides('handel', woodUnfair, 100, false);
ok(!woodOut.their.accepted, 'outgoing 1v3 drewno: their.accepted false');
ok(woodOut.their.statusLabel.includes('nieuczciwa'), 'outgoing 1v3: status nieuczciwa dla partnera');

// Silnik: bilateral gate odrzuca nawet gdy pnDealAcceptedByAi @ wysokiej Relacji przechodzi
const woodHighRel = {
  giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 1 }],
  receiveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 3 }],
};
const ctx300 = {
  relation: { zaufanie: 150, respekt: 150, status: 'pokoj' },
  stanWojny: false,
  turn: 1,
  difficulty: 'normal',
  activeDeals: [],
  proposerRespekt: 50,
  responderRespekt: 50,
};
const evalHighRel = mod.evaluateProposal(
  { actionId: 'handel', proposerOwnerId: 0, responderOwnerId: 1, payload: woodHighRel },
  ctx300,
);
ok(!evalHighRel.accepted, 'handel 1v3 @ rel 300: evaluate rejects bilateral unfair');
ok(
  (evalHighRel.reason ?? '').includes('nieuczciwa') || (evalHighRel.reason ?? '').includes('niekorzystna'),
  'handel 1v3 @ rel 300: reason mentions unfair',
);

// umowa_szlakow @ rel 92 — bilans −5, silnik odrzuca (treatyPnGate + bilateral)
const treatyUnfair92 = {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 31 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 30 }],
};
const ctx92 = {
  relation: { zaufanie: 46, respekt: 46, status: 'pokoj' },
  stanWojny: false,
  turn: 1,
  difficulty: 'normal',
  activeDeals: [],
  proposerRespekt: 50,
  responderRespekt: 50,
};
const evalTreaty92 = mod.evaluateProposal(
  { actionId: 'umowa_szlakow', proposerOwnerId: 0, responderOwnerId: 1, payload: treatyUnfair92 },
  ctx92,
);
ok(!evalTreaty92.accepted, 'umowa_szlakow @ rel 92 asymetria: evaluate rejects');

// Traktat handlowy @ rel 52 — UI asymetria (Maciej 2026-08-04)
ok(mod.effectiveTreatyPnRequired(80, 52) === 42, 'umowa_handlowa @ rel 52: 80 → 42 PW gracz');
const tradePanel52 = mod.renderPnBalancePanelForTreaty(42, 0, 0, 52, 'Traktat handlowy', 0, 'Traktat', 80, 80);
ok(tradePanel52.includes('Wpływ Relacji na deal'), 'umowa_handlowa panel: wiersz wpływu Relacji');
ok(tradePanel52.includes('−48%'), 'umowa_handlowa panel: badge −48% (słabsza przy niskiej Relacji)');
ok(tradePanel52.includes('Ty: baza 80 → 42'), 'umowa_handlowa panel: meta gracz baza→effective');
ok(tradePanel52.includes('Oni: 80 PW (baza)'), 'umowa_handlowa panel: meta partner baza');
const tradeRow52 = {
  direction: 'own',
  actionLabel: 'Traktat handlowy',
  acceptanceMy: tradeTreaty52.my,
  acceptanceTheir: tradeTreaty52.their,
  awaitingAiResponse: true,
};
const tradePanelData52 = mod.balancePanelDataFromRow(tradeRow52, 0);
const tradeTablePanel52 = mod.renderPnBalancePanelHtml(tradePanelData52);
ok(tradeTablePanel52.includes('da-pn-rel-mod'), 'stół negocjacji umowa_handlowa: rel-mod row');
ok(tradeTablePanel52.includes('42 PW'), 'stół negocjacji umowa_handlowa: gracz 42 PW');
ok(tradeTablePanel52.includes('80 PW'), 'stół negocjacji umowa_handlowa: partner 80 PW');

// R-DYPLO-PW-PRZECINEK: panel traktatu @ rel 89.6 — badge i hint bez IEEE junk
const tradePanel896 = mod.renderPnBalancePanelForTreaty(72, 0, 0, 89.6, 'Traktat handlowy', 0, 'Traktat', 80, 80);
ok(!tradePanel896.includes('000000'), 'umowa_handlowa panel @ rel 89.6: bez IEEE junk');
ok(tradePanel896.includes('−10,4%'), 'umowa_handlowa panel @ rel 89.6: badge −10,4%');
ok(tradePanel896.includes('baza 80, Relacja −10,4% siła'), 'umowa_handlowa panel @ rel 89.6: hint baza z czystym mod%');

try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }

console.log(`diplomacy-acceptance-points-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
