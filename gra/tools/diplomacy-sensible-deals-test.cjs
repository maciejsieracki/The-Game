'use strict';
/**
 * diplomacy-sensible-deals-test.cjs — R-WEB-DIPLO-DEALS-SENSIBLE-Q1 (Operator R1).
 * Run: node tools/diplomacy-sensible-deals-test.cjs
 * Testy jednostkowe modułu src/game/diplomacy-sensible-deals.ts (filtr bilansu + progi
 * niedobór/nadwyżka + reason). Pomiar w przeglądarce (live) NIE jest częścią tego pliku.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-sensible-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-sensible-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  DIPLO_SENSIBLE_DEALS_ENABLED,
  SENSIBLE_DEALS_THRESHOLDS,
  classifyTradeNeed,
  fallbackUsePerTurn,
  isPlayerBalanceAcceptable,
  sensibleBalanceFilterApplies,
  isSellerSurplusJustified,
  isBuyerDeficitJustified,
  tradeOfferReason,
} from '../src/game/diplomacy-sensible-deals.ts';
export { aiProposalPlayerBenefitSurplus } from '../src/game/diplomacy-ai-offer-balance.ts';
`);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const M = require(BUNDLE);
let pass = 0;
let fail = 0;
function check(name, cond, extra) {
  if (cond) {
    pass++;
    console.log(`  OK: ${name}`);
  } else {
    fail++;
    console.log(`  FAIL: ${name}${extra !== undefined ? ` (got ${JSON.stringify(extra)})` : ''}`);
  }
}

console.log('== progi niedobór / nadwyżka (JSON) ==');
const T = M.SENSIBLE_DEALS_THRESHOLDS;
check('progi wczytane z JSON: deficitTurns=10', T.deficitTurns === 10, T);
check('progi wczytane z JSON: surplusMultiple=20', T.surplusMultiple === 20, T);
const U = 1;
check('zapas 0 -> deficit', M.classifyTradeNeed(0, U) === 'deficit');
check('zapas 9 (<10 tur) -> deficit', M.classifyTradeNeed(9 * U, U) === 'deficit');
check('zapas 10 (granica) -> neutral', M.classifyTradeNeed(10 * U, U) === 'neutral');
check('zapas 20 (granica) -> neutral', M.classifyTradeNeed(20 * U, U) === 'neutral');
check('zapas 21 (>20x) -> surplus', M.classifyTradeNeed(21 * U, U) === 'surplus');
check('zuzycie 0 -> neutral (brak oceny)', M.classifyTradeNeed(0, 0) === 'neutral');
check('NaN zapas -> neutral', M.classifyTradeNeed(NaN, U) === 'neutral');
check('fallback zuzycia = pakiet x 1', M.fallbackUsePerTurn(5) === 5, M.fallbackUsePerTurn(5));

console.log('== bramki sprzedaży/zakupu ==');
check('sprzedaż: zapas 21 przy pakiecie 1 -> uzasadniona', M.isSellerSurplusJustified(21, 1, true) === true);
check('sprzedaż: zapas 20 -> NIE uzasadniona', M.isSellerSurplusJustified(20, 1, true) === false);
check('sprzedaż: zapas 0 -> NIE uzasadniona', M.isSellerSurplusJustified(0, 1, true) === false);
check('sprzedaż: flaga OFF -> bez zmian (true)', M.isSellerSurplusJustified(0, 1, false) === true);
check('zakup: zapas 0 -> uzasadniony', M.isBuyerDeficitJustified(0, 1, true) === true);
check('zakup: zapas 50 -> NIE uzasadniony', M.isBuyerDeficitJustified(50, 1, true) === false);
check('zakup: flaga OFF -> bez zmian (true)', M.isBuyerDeficitJustified(50, 1, false) === true);

console.log('== filtr bilansu PW gracza ==');
check('bilans -0.1 -> odrzucony', M.isPlayerBalanceAcceptable(-0.1) === false);
check('bilans 0 -> akceptowany (granica)', M.isPlayerBalanceAcceptable(0) === true);
check('bilans +7 -> akceptowany', M.isPlayerBalanceAcceptable(7) === true);
check('bilans NaN -> odrzucony', M.isPlayerBalanceAcceptable(NaN) === false);
check('filtr dla handlu ON', M.sensibleBalanceFilterApplies(true, 'zaproponuj_handel_surowiec') === true);
check('filtr dla umowy handlowej ON', M.sensibleBalanceFilterApplies(true, 'zaproponuj_umowe_handlowa') === true);
check('filtr NIE dotyczy pokoju', M.sensibleBalanceFilterApplies(true, 'zaproponuj_pokoj') === false);
check('filtr NIE dotyczy trybutu', M.sensibleBalanceFilterApplies(true, 'zadaj_trybut') === false);
check('flaga OFF -> filtr wyłączony', M.sensibleBalanceFilterApplies(false, 'zaproponuj_handel_surowiec') === false);

console.log('== bilans na realnym payloadzie (konwencja aiProposalPlayerBenefitSurplus) ==');
const gift = { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 50 }] };
const demand = { giveItems: [], receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 50 }] };
const sGift = M.aiProposalPlayerBenefitSurplus(gift, 50);
const sDemand = M.aiProposalPlayerBenefitSurplus(demand, 50);
check('dar AI dla gracza (give złoto, brak receive) -> bilans > 0', sGift > 0, sGift);
check('żądanie AI bez oddania (receive złoto) -> bilans < 0 -> odrzucone', sDemand < 0 && !M.isPlayerBalanceAcceptable(sDemand), sDemand);

console.log('== reason ==');
const rOne = M.tradeOfferReason('deficyt', 'deficit');
const rTwo = M.tradeOfferReason('nadwyzka', 'surplus');
check('reason dla niedoboru niepusty i zawiera "niedobor"', typeof rOne === 'string' && rOne.includes('niedobor'), rOne);
check('reason dla nadwyżki niepusty i zawiera "nadwyzka"', typeof rTwo === 'string' && rTwo.includes('nadwyzka'), rTwo);

console.log(`\ndiplomacy-sensible-deals-test: ${pass} passed, ${fail} failed`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
if (fail > 0) process.exit(1);
