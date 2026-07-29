'use strict';
/**
 * diplomacy-ai-offer-balance-test.cjs — D-DYPLO-AI-OFERTA-ZERO (Maciej 2026-07-29).
 * Run: node tools/diplomacy-ai-offer-balance-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-ai-offer-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-ai-offer-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  AI_OFFER_PW_BALANCE_TOLERANCE_PN,
  aiOfferTargetsZeroBalance,
  aiAllowsOneSidedGoldGift,
  aiAllowsTradeAgreementSweetener,
  aiProposalPlayerBenefitSurplus,
  responderPwSurplus,
  targetResourceTradePaymentPn,
  adjustZaplataPerTuraForZeroBalance,
  trimProposalGoldForZeroBalance,
  pickMinimalSweetenerGold,
  trimQuickDealGiveToTolerance,
} from '../src/game/diplomacy-ai-offer-balance.ts';
export { diplomacyPnZloto } from '../src/game/diplomacy-value-catalog.ts';
`);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const M = require(BUNDLE);
let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

console.log('diplomacy-ai-offer-balance-test');

ok(M.AI_OFFER_PW_BALANCE_TOLERANCE_PN.easy === Infinity, 'easy: brak limitu nadwyżki');
ok(M.AI_OFFER_PW_BALANCE_TOLERANCE_PN.normal === 5, 'normal: tolerancja 5 PW');
ok(M.AI_OFFER_PW_BALANCE_TOLERANCE_PN.hard === 2, 'hard: tolerancja 2 PW');

ok(!M.aiOfferTargetsZeroBalance('easy'), 'easy: nie celuje w zero');
ok(M.aiOfferTargetsZeroBalance('normal'), 'normal: celuje w zero');
ok(M.aiOfferTargetsZeroBalance('hard'), 'hard: celuje w zero');

ok(M.aiAllowsOneSidedGoldGift('easy'), 'easy: dar złota OK');
ok(!M.aiAllowsOneSidedGoldGift('normal'), 'normal: brak daru złota');
ok(M.aiAllowsTradeAgreementSweetener('easy'), 'easy: osłodzik umowy OK');
ok(!M.aiAllowsTradeAgreementSweetener('normal'), 'normal: brak osłodzika');

const giftPayload = { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }], receiveItems: [] };
ok(M.aiProposalPlayerBenefitSurplus(giftPayload, 100) === 100, 'dar 100 PW: benefit surplus 100');
const trimmed = M.trimProposalGoldForZeroBalance(giftPayload, 100, 'normal');
const trimmedGold = trimmed.giveItems?.[0]?.ilosc ?? 0;
ok(trimmedGold <= 5, `normal: trim daru 100¤ → ≤5 PW (${trimmedGold})`);
ok(M.trimProposalGoldForZeroBalance(giftPayload, 100, 'easy').giveItems[0].ilosc === 100, 'easy: dar bez trimu');

ok(M.targetResourceTradePaymentPn(100, 100, 'normal') === 100, 'sprzedaż 100 PW @ rel 100 normal → zapłata 100 PW');
ok(M.targetResourceTradePaymentPn(100, 100, 'hard') === 97, 'sprzedaż 100 PW @ rel 100 hard → 97 PW (undershoot 3)');

const adjusted = M.adjustZaplataPerTuraForZeroBalance(50, 'zloto', 100, 100, 'normal');
ok(adjusted === 100, `normal: korekta zapłaty 50→100¤ (PW≈100)`);

const quickTrimmed = M.trimQuickDealGiveToTolerance(
  [{ typ: 'zloto', id: 'zloto', ilosc: 200 }],
  50,
  100,
  'normal',
);
const quickGold = quickTrimmed[0]?.ilosc ?? 0;
ok(quickGold <= 55, `quick-deal trim: fair 50 + tol 5 → gold ≤55 (${quickGold})`);

let acceptedAt = null;
const minGold = M.pickMinimalSweetenerGold(
  { giveItems: [] },
  50,
  'normal',
  25,
  10,
  (p) => {
    const g = p.giveItems?.find(i => i.typ === 'zloto')?.ilosc ?? 0;
    if (g >= 50) { acceptedAt = g; return true; }
    return false;
  },
);
ok(minGold === 50, `minimal sweetener: 50¤ nie 500¤ (${minGold})`);

console.log(`\ndiplomacy-ai-offer-balance-test: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
