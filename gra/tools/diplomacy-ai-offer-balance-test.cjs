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
  trimResourcePaymentTradeForZeroBalance,
  trimProposalForZeroBalance,
  pickMinimalSweetenerGold,
  trimQuickDealGiveToTolerance,
} from '../src/game/diplomacy-ai-offer-balance.ts';
export { computePlayerAcceptanceSides } from '../src/game/diplomacy-acceptance-points.ts';
export {
  diplomacyPnZloto,
  diplomacySumPn,
  diplomacyFairGivePn,
} from '../src/game/diplomacy-value-catalog.ts';
export { computeQuickDealBasket } from '../src/game/diplomacy-pn-engine.ts';
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

// R-DYP-PAKIET-USUN (2026-08-08, Maciej): koszyk podaje sztuki wprost (cena_drewno=1 PN/szt.)
// — `ilosc: 10` odtwarzało scenariusz „10 PN drewna vs 1 PN złota”, który przed usunięciem
// pakietów dawało `ilosc: 1` (1 pakiet × 10 szt. × 1 PN/szt.).
// NAPRAWA P-DYPLO-PW-BRAK-KROKU-5-EDYCJA-PROPOZYCJI (2026-08-13): PN surowca ilościowego
// liczy się teraz BLOKAMI (krok 5→10 od R-DYPLO-CENNIK-KROK10-Q1, 2026-08-30), nie sztukami
// wprost — za mało, by odtworzyć oryginalny scenariusz „10 PN drewna”. `ilosc: 100` (10
// bloków kroku 10 × 1 PN/blok = 10 PN, jak dawne 10 szt. × 1 PN/szt. przed
// R-DYPLO-CENNIK-SKALA-5X-Q1) zachowuje TĘ SAMĄ wartość PN co oryginalny scenariusz —
// liczba sztuk rośnie ×10 względem oryginału, PN scenariusza bez zmian.
const cyclicRaw = {
  giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 100 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 1 }],
  resourceTradeMode: 'per_turn',
  turns: 10,
};
const cyclicSurplusBefore = M.aiProposalPlayerBenefitSurplus(cyclicRaw, 100);
const cyclicTrimmed = M.trimProposalForZeroBalance(cyclicRaw, 100, 'normal');
const cyclicSurplusAfter = M.aiProposalPlayerBenefitSurplus(cyclicTrimmed, 100);
const cyclicGold = cyclicTrimmed.receiveItems?.find(i => i.typ === 'zloto')?.ilosc ?? 0;
const cyclicWood = cyclicTrimmed.giveItems?.find(i => i.typ === 'surowiec_ilosc')?.ilosc ?? 0;
ok(cyclicSurplusBefore >= 8, `scenariusz zrzutu: 100 szt. drewna/turę (10 bloków kroku 10) + 1¤ → nadwyżka ≥8 (${cyclicSurplusBefore})`);
ok(
  cyclicSurplusAfter <= 5 || (!cyclicTrimmed.giveItems?.length && !cyclicTrimmed.receiveItems?.length),
  `normal: nadwyżka ≤5 lub oferta wycofana (${cyclicSurplusAfter})`,
);

const cyclicFair = {
  giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 10 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 10 }],
  resourceTradeMode: 'per_turn',
  turns: 10,
};
const cyclicFairTrimmed = M.trimProposalForZeroBalance(cyclicFair, 100, 'normal');
ok(
  M.aiProposalPlayerBenefitSurplus(cyclicFairTrimmed, 100) <= 5,
  `fair 10¤ za 10 szt. drewna: nadwyżka ≤5`,
);

const cyclicEasy = M.trimProposalForZeroBalance(cyclicRaw, 100, 'easy');
ok(
  cyclicEasy.giveItems[0].ilosc === 100 && cyclicEasy.receiveItems[0].ilosc === 1,
  'easy: bez trimu cyklicznego',
);

// Nawet 1 szt. (minimum, dalej zejść się nie da) wciąż za droga względem 1¤ — pełne
// wycofanie oferty. zelazo=20 PN/szt. gwarantuje nadwyżkę > tolerancji już przy ilosc=1
// (odtwarza scenariusz sprzed R-DYP-PAKIET-USUN, gdzie 1 pakiet = najmniejsza jednostka).
const cyclicNoRoom = {
  giveItems: [{ typ: 'surowiec_ilosc', id: 'zelazo', ilosc: 1 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 1 }],
  resourceTradeMode: 'per_turn',
  turns: 10,
};
const cyclicClamped = M.trimProposalForZeroBalance(cyclicNoRoom, 100, 'normal');
ok(
  !cyclicClamped.giveItems?.length && !cyclicClamped.receiveItems?.length,
  'po clamp 1¤: oferta wycofana (nie 1 szt. zelaza za 1¤)',
);

// --- computeQuickDealBasket: R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13) ---
// Ewaluator zgłosił: `pnPerUnit` do sortowania/filtrowania liczony przez
// diplomacyPnSurowiecIlosc(id, 1) floruje TERAZ 1 szt. do 0 dla surowców z krokiem 5 —
// bez naprawy WSZYSTKIE takie surowce znikałyby z „Szybkiej umowy" (filter pnPerUnit>0).
{
  const receiveDrewno = M.computeQuickDealBasket({
    relacjaTotal: 60,
    ourGoldAvailable: 500,
    ourResourceOptions: [],
    theirResourceOptions: [],
    theirQuantityResourceOptions: [{ id: 'drewno', label: 'Drewno', maxQty: 200 }],
  });
  ok(receiveDrewno.receiveItems.length === 1 && receiveDrewno.receiveItems[0].id === 'drewno',
    `Szybka umowa: drewno (krok 10) NIE znika z propozycji (got ${JSON.stringify(receiveDrewno.receiveItems)})`);
  ok(receiveDrewno.receiveItems[0].ilosc === 10,
    `Szybka umowa: seedQty drewna = min(10, maxQty) = 10, już wielokrotność kroku (got ${receiveDrewno.receiveItems[0].ilosc})`);

  // R-DYPLO-CENNIK-KROK10-Q1 (2026-08-30): kotwica seedQty (diplomacy-pn-engine.ts,
  // Math.min(10, pick.maxQty)) jest STAŁĄ liczbą 10 — dawniej WIĘKSZĄ niż krok(5), co
  // zostawiało pasmo (5,10) do przetestowania „częściowego floora, ale nie zera" (np.
  // maxQty=7 -> floor do 5). Krok podniesiony do 10 KOLIDUJE z tą samą stałą kotwicą —
  // pasmo (krok,kotwica) staje się puste (każde maxQty<10 floruje teraz od razu do 0,
  // każde maxQty>=10 daje kotwicę 10 bez potrzeby floorowania). Scenariusz „częściowy
  // floor, niezerowy wynik" jest więc dla tego zestawu progów STRUKTURALNIE NIEMOŻLIWY do
  // odtworzenia — usunięty świadomie, nie przeoczony (patrz test poniżej dla wciąż
  // aktualnego przypadku „poniżej kroku -> 0 -> fallback złoto").

  // Partner ma TYLKO 3 szt. (poniżej kroku 10) -> brak oferty surowcowej, fallback do gestu złota.
  const receiveBelowKrok = M.computeQuickDealBasket({
    relacjaTotal: 60,
    ourGoldAvailable: 500,
    ourResourceOptions: [],
    theirResourceOptions: [],
    theirQuantityResourceOptions: [{ id: 'drewno', label: 'Drewno', maxQty: 3 }],
  });
  ok(receiveBelowKrok.receiveItems.length === 0,
    `Szybka umowa: partner ma 3 szt. (< krok 10) -> brak pozycji surowcowej (got ${JSON.stringify(receiveBelowKrok.receiveItems)})`);
  ok(receiveBelowKrok.giveItems.some(i => i.typ === 'zloto'),
    'Szybka umowa: bez wycenialnego surowca partnera -> fallback gest złota');

  // Dopełniacz z NASZYCH surowców (giveItems) — pętla przyrasta o krok, qty zawsze wielokrotnością
  // kroku (10 od R-DYPLO-CENNIK-KROK10-Q1, 2026-08-30 — dawniej 5).
  const giveFiller = M.computeQuickDealBasket({
    relacjaTotal: 100,
    ourGoldAvailable: 0,
    ourResourceOptions: [],
    theirResourceOptions: [],
    ourQuantityResourceOptions: [{ id: 'drewno', label: 'Drewno', maxQty: 200 }],
    theirQuantityResourceOptions: [{ id: 'zelazo', label: 'Żelazo', maxQty: 50 }],
  });
  const drewnoGive = giveFiller.giveItems.find(i => i.id === 'drewno');
  ok(drewnoGive != null && drewnoGive.ilosc % 10 === 0 && drewnoGive.ilosc > 0,
    `Szybka umowa: dopełniacz drewna wielokrotnością 10, >0 (got ${drewnoGive?.ilosc})`);

  // N1 (Evaluator 2026-08-13, domknięcie luki pokrycia P-DYPLO-PW-BRAK-KROKU-5-EDYCJA-PROPOZYCJI):
  // powyższa asercja "wielokrotność 5, >0" NIE łapie błędu WIELKOŚCI — 40 szt. "zepsute" (5×
  // za mało) spełnia ją tak samo dobrze jak 200 szt. "poprawne". Tu przeliczamy PN oddawanego
  // koszyka NIEZALEŻNIE (diplomacySumPn na zwróconych giveItems, ta sama funkcja katalogu co
  // reszta silnika, ale wołana z zewnątrz — nie z wewnętrznej zmiennej giveSum liczonej wewnątrz
  // computeQuickDealBasket) i porównujemy z fairMin wyliczonym z receivePn (diplomacySumPn na
  // receiveItems) przez diplomacyFairGivePn. Margines 10% w dół dopuszcza floor-do-kroku-5
  // (ostatni blok zwykle nie trafia dokładnie w fairMin), ale NIE dopuszcza błędu ×5.
  const giveFillerReceivePn = M.diplomacySumPn(giveFiller.receiveItems);
  const giveFillerGivePn = M.diplomacySumPn(giveFiller.giveItems);
  const giveFillerFairMin = M.diplomacyFairGivePn(giveFillerReceivePn, 100);
  ok(giveFillerGivePn >= giveFillerFairMin * 0.9,
    `Szybka umowa: fairness rzeczywista (nie tylko wielokrotność 5) - givePn=${giveFillerGivePn} ` +
    `>= 0.9*fairMin=${(giveFillerFairMin * 0.9).toFixed(1)} (receivePn=${giveFillerReceivePn}, fairMin=${giveFillerFairMin})`);
}

console.log(`\ndiplomacy-ai-offer-balance-test: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
