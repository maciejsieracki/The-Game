'use strict';
/**
 * diplomacy-sensible-deals-test.cjs — R-WEB-DIPLO-DEALS-SENSIBLE-Q1 (Operator R2).
 * Run: node tools/diplomacy-sensible-deals-test.cjs
 * Testy jednostkowe modułu src/game/diplomacy-sensible-deals.ts: filtr bilansu, progi
 * niedobór/nadwyżka po PRZYROSCIE NETTO (B6), warunek nadwyżka<->niedobór partnera (B8),
 * reason (B7), flaga przełączalna w teście (B3: OFF = bez zmian, determinizm).
 * Pomiar w prawdziwej grze (Chromium) NIE jest częścią tego pliku (tools/*-live-test.cjs).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-sensible-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-sensible-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  isDiploSensibleDealsEnabled,
  setDiploSensibleDealsEnabled,
  SENSIBLE_DEALS_THRESHOLDS,
  SENSIBLE_TRADE_ACTION_IDS,
  classifyTradeNeed,
  classifyTradeNeedNet,
  fallbackUsePerTurn,
  isPlayerBalanceAcceptable,
  sensibleBalanceFilterApplies,
  isSensibleTradeActionId,
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

console.log('== flaga przełączalna (B3) ==');
check('flaga domyślnie ON', M.isDiploSensibleDealsEnabled() === true);
M.setDiploSensibleDealsEnabled(false);
check('setter przełącza na OFF', M.isDiploSensibleDealsEnabled() === false);
M.setDiploSensibleDealsEnabled(true);
check('setter przełącza z powrotem na ON', M.isDiploSensibleDealsEnabled() === true);

console.log('== progi (JSON) i klasyfikacja zapasu ==');
const T = M.SENSIBLE_DEALS_THRESHOLDS;
check('progi wczytane z JSON: deficitTurns=10', T.deficitTurns === 10, T);
check('progi wczytane z JSON: surplusMultiple=20', T.surplusMultiple === 20, T);
const U = 1;
check('stary wariant: zapas 9 (<10 tur) -> deficit', M.classifyTradeNeed(9 * U, U) === 'deficit');
check('stary wariant: zapas 21 (>20x) -> surplus', M.classifyTradeNeed(21 * U, U) === 'surplus');
check('zuzycie 0 -> neutral (brak oceny)', M.classifyTradeNeed(0, 0) === 'neutral');
check('fallback zuzycia = pakiet x 1', M.fallbackUsePerTurn(5) === 5, M.fallbackUsePerTurn(5));

console.log('== przyrost netto (B6): niedobór = ujemny przyrost i zapas < 10 tur zużycia ==');
check('netto -2, zapas 19 (<20 = 10 tur) -> deficit', M.classifyTradeNeedNet(19, -2, 1) === 'deficit');
check('netto -2, zapas 20 (granica) -> neutral', M.classifyTradeNeedNet(20, -2, 1) === 'neutral');
check('netto -2, zapas 0 -> deficit', M.classifyTradeNeedNet(0, -2, 1) === 'deficit');
check('netto 0, zapas 0 -> NIE niedobór (nic nie zużywa)', M.classifyTradeNeedNet(0, 0, 1) === 'neutral');
check('netto +3, zapas 0 -> NIE niedobór (przyrost dodatni)', M.classifyTradeNeedNet(0, 3, 1) === 'neutral');
check('netto +3, zapas 0 -> NIE niedobór przy zapasie 5 (brak tautologii pakiet x 1)', M.classifyTradeNeedNet(5, 3, 1) === 'neutral');
check('netto 0, zapas 21 przy pakiecie 1 -> surplus', M.classifyTradeNeedNet(21, 0, 1) === 'surplus');
check('netto -1, zapas 500 -> neutral (zapas wystarczający)', M.classifyTradeNeedNet(500, -1, 1) === 'neutral');
check('NaN zapas -> neutral', M.classifyTradeNeedNet(NaN, -1, 1) === 'neutral');

console.log('== bramki sprzedaży/zakupu (B6, B8) ==');
// Sprzedaż (AI = sprzedawca): zapas > 20x pakiet, netto >= 0, i GRACZ ma niedobór tego surowca.
check('sprzedaż: nadwyżka + partner deficit -> uzasadniona', M.isSellerSurplusJustified(21, 0, 1, 'deficit', true) === true);
check('sprzedaż: nadwyżka, partner NEUTRAL -> NIE uzasadniona (B8)', M.isSellerSurplusJustified(21, 0, 1, 'neutral', true) === false);
check('sprzedaż: nadwyżka, partner SURPLUS -> NIE uzasadniona (B8)', M.isSellerSurplusJustified(21, 0, 1, 'surplus', true) === false);
check('sprzedaż: brak nadwyżki (zapas 20) -> NIE uzasadniona', M.isSellerSurplusJustified(20, 0, 1, 'deficit', true) === false);
check('sprzedaż: nadwyżka, ale netto ujemne -> NIE uzasadniona', M.isSellerSurplusJustified(30, -1, 1, 'deficit', true) === false);
check('sprzedaż: flaga OFF -> bez zmian (true)', M.isSellerSurplusJustified(0, 0, 1, null, false) === true);
// Zakup (AI = kupujący): netto ujemne i zapas < 10 tur zużycia.
check('zakup: niedobór netto -1, zapas 0 -> uzasadniony', M.isBuyerDeficitJustified(0, -1, 1, true) === true);
check('zakup: zapas 50, netto -1 -> NIE uzasadniony', M.isBuyerDeficitJustified(50, -1, 1, true) === false);
check('zakup: zapas 0, netto 0 -> NIE uzasadniony (tautologia usunięta)', M.isBuyerDeficitJustified(0, 0, 1, true) === false);
check('zakup: zapas 2, netto +4 -> NIE uzasadniony', M.isBuyerDeficitJustified(2, 4, 1, true) === false);
check('zakup: flaga OFF -> bez zmian (true)', M.isBuyerDeficitJustified(50, 4, 1, false) === true);

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

console.log('== akcje stołu blokujące koniec tury (B2) ==');
check('handel = oferta handlowa', M.isSensibleTradeActionId('handel') === true);
check('umowa_handlowa = oferta handlowa', M.isSensibleTradeActionId('umowa_handlowa') === true);
check('pokoj/nap/sojusz NIE są ofertą handlową', ['nap', 'sojusz_pelny', 'sojusz_defensywny', 'trybut_oferta'].every(a => M.isSensibleTradeActionId(a) === false));

console.log('== bilans na realnym payloadzie (konwencja aiProposalPlayerBenefitSurplus) ==');
const gift = { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 50 }] };
const demand = { giveItems: [], receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 50 }] };
const sGift = M.aiProposalPlayerBenefitSurplus(gift, 50);
const sDemand = M.aiProposalPlayerBenefitSurplus(demand, 50);
check('dar AI dla gracza (give złoto, brak receive) -> bilans > 0', sGift > 0, sGift);
check('żądanie AI bez oddania (receive złoto) -> bilans < 0 -> odrzucone', sDemand < 0 && !M.isPlayerBalanceAcceptable(sDemand), sDemand);

console.log('== reason (B7) ==');
const rDef = M.tradeOfferReason('deficyt', 3, -2, true);
const rSur = M.tradeOfferReason('nadwyzka', 45, 0, true);
check('reason dla niedoboru zawiera "Brakuje"', typeof rDef === 'string' && rDef.includes('Brakuje'), rDef);
check('reason dla nadwyżki zawiera "nadwyżkę"', typeof rSur === 'string' && rSur.includes('nadwyżkę'), rSur);
check('reason przy flagaOFF = pusty (zachowanie jak baza)', M.tradeOfferReason('deficyt', 3, -2, false) === '');

console.log('== flaga OFF: deterministyczne i identyczne z bazą (B3) ==');
const scenarios = [[0, -1, 1], [50, -1, 1], [21, 0, 1], [0, 0, 5], [7, 3, 2]];
function runAll(enabled) {
  return scenarios.map(([s, n, p]) => [
    M.isBuyerDeficitJustified(s, n, p, enabled),
    M.isSellerSurplusJustified(s, n, p, 'deficit', enabled),
    M.isSellerSurplusJustified(s, n, p, 'neutral', enabled),
  ]);
}
const offA = runAll(false);
const offB = runAll(false);
check('OFF: wynik deterministyczny (dwa przebiegi równe)', JSON.stringify(offA) === JSON.stringify(offB));
check('OFF: wszystkie bramki zwracają true (= baza)', offA.every(row => row.every(v => v === true)), offA);
const onA = runAll(true);
const onB = runAll(true);
check('ON: wynik deterministyczny (dwa przebiegi równe)', JSON.stringify(onA) === JSON.stringify(onB));
check('ON: bramki faktycznie filtrują (nie wszystkie true)', onA.some(row => row.some(v => v === false)));

console.log(`\ndiplomacy-sensible-deals-test: ${pass} passed, ${fail} failed`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
if (fail > 0) process.exit(1);
