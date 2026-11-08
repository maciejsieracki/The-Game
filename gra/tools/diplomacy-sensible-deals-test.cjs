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
export {
  aiProposalPlayerBenefitSurplus,
  adjustZaplataPerTuraForZeroBalance,
  targetResourceTradePaymentPn,
  withZeroPwUndershoot,
  pnToPaymentAmount,
} from '../src/game/diplomacy-ai-offer-balance.ts';
export { diplomacyPnSurowiecIlosc } from '../src/game/diplomacy-value-catalog.ts';
export { pickResourceDeficitForOwnerPair, pickResourceSurplusForOwnerPair } from '../src/game/diplomacy-resource-trade-pick.ts';
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

// R3 (zarzut 3): bramka potrzeby przy SELEKCJI kandydata - odrzucony pierwszy surowiec
// nie blokuje kolejnych (picker wybiera pierwszy, który przechodzi predykat).
{
  const P = M.pickResourceDeficitForOwnerPair;
  const S = M.pickResourceSurplusForOwnerPair;
  const goods = [{ key: 'drewno', ilosc: 0 }, { key: 'kamien', ilosc: 0 }];
  const opts = [{ id: 'drewno', label: 'Drewno', maxQty: 50 }, { id: 'kamien', label: 'Kamień', maxQty: 50 }];
  const base = {
    buyerOwnerId: 1, sellerOwnerId: 2, goodsBuyer: goods, goodsSeller: goods, sellerOptions: opts,
    pricedKeys: ['drewno', 'kamien'], pakietWielkosc: 10, maxPakietyPerTura: 10,
    pricePerPakiet: (k, n) => n * 10,
  };
  const noFilter = P({ ...base });
  check('R3 deficyt: bez predykatu wybiera pierwszy kandydat', noFilter && noFilter.surowiecKey === 'drewno', noFilter);
  const skipFirst = P({ ...base, acceptKey: k => k !== 'drewno' });
  check('R3 deficyt: odrzucony pierwszy kandydat -> wybór kolejnego', skipFirst && skipFirst.surowiecKey === 'kamien', skipFirst);
  const none = P({ ...base, acceptKey: () => false });
  check('R3 deficyt: wszyscy odrzuceni -> null', none === null, none);
  const sBase = { ...base, sellerOwnerId: 1, buyerOwnerId: 2, goodsSeller: goods, goodsBuyer: goods, sellerOptions: opts };
  const sSkip = S({ ...sBase, acceptKey: k => k === 'kamien' });
  check('R3 nadwyzka: predykat wybiera jedyny przechodzący surowiec', sSkip && sSkip.surowiecKey === 'kamien', sSkip);
  const sNone = S({ ...sBase, acceptKey: () => false });
  check('R3 nadwyzka: wszyscy odrzuceni -> null', sNone === null, sNone);
}

// R4 (pkt 7): deterministyczne porównanie wyboru oferty ON vs OFF na zestawie scenariuszy.
// Baza = picker BEZ predykatu potrzeby (kod sprzed zmiany). OFF = predykat z flagą false.
// Wymóg: OFF daje ten sam wynik co baza na każdym scenariuszu; ON daje różnicę (filtr działa).
{
  const P = M.pickResourceDeficitForOwnerPair;
  const S = M.pickResourceSurplusForOwnerPair;
  const keys = ['drewno', 'kamien', 'zelazo'];
  let seed = 20261025;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const pakiet = 10;
  const scenarios = [];
  for (let i = 0; i < 200; i++) {
    const row = keys.map(k => ({
      key: k,
      ilosc: Math.floor(rnd() * 400),
      rate: Math.round((rnd() * 40 - 20) * 10) / 10,
    }));
    scenarios.push(row);
  }
  const opts = keys.map(k => ({ id: k, label: k, maxQty: 50 }));
  const mk = (row) => ({
    pricedKeys: keys, pakietWielkosc: pakiet, maxPakietyPerTura: 10,
    pricePerPakiet: (k, n) => n * 10, sellerOptions: opts,
    goodsBuyer: row.map(r => ({ key: r.key, ilosc: r.ilosc })),
    goodsSeller: row.map(r => ({ key: r.key, ilosc: r.ilosc })),
    buyerOwnerId: 1, sellerOwnerId: 2,
  });
  const rateOf = (row, key) => row.find(r => r.key === key).rate;
  let offDiff = 0;
  let onDiff = 0;
  let pickedNonNull = 0;
  for (const row of scenarios) {
    const base = mk(row);
    const baseDef = JSON.stringify(P({ ...base }));
    const offDef = JSON.stringify(P({
      ...base,
      acceptKey: k => M.isBuyerDeficitJustified(
        row.find(r => r.key === k).ilosc, rateOf(row, k), pakiet, false),
    }));
    const onDef = JSON.stringify(P({
      ...base,
      acceptKey: k => M.isBuyerDeficitJustified(
        row.find(r => r.key === k).ilosc, rateOf(row, k), pakiet, true),
    }));
    if (baseDef !== offDef) offDiff++;
    if (baseDef !== onDef) onDiff++;
    const baseSur = JSON.stringify(S({ ...base, sellerOwnerId: 1, buyerOwnerId: 2 }));
    const offSur = JSON.stringify(S({
      ...base, sellerOwnerId: 1, buyerOwnerId: 2,
      acceptKey: k => M.isSellerSurplusJustified(
        row.find(r => r.key === k).ilosc, rateOf(row, k), pakiet, 'deficit', false),
    }));
    if (baseSur !== offSur) offDiff++;
    if (baseDef !== 'null') pickedNonNull++;
  }
  check('OFF (deficyt + nadwyżka): wybór identyczny z bazą na 200 scenariuszach', offDiff === 0, offDiff);
  check('ON: predykat potrzeby zmienia wybór w części scenariuszy (filtr działa)', onDiff > 0, onDiff);
  check('zestaw scenariuszy nie jest pusty (są wybory bazowe)', pickedNonNull > 0, pickedNonNull);
}

// R4 (pkt 4): zerowy undershoot na Trudnym. Oferta sprzedaży surowca (AI daje surowiec, bierze złoto):
// bez zakresu cel = maxAccepted - 3 PN (bilans gracza < 0 możliwy); w zakresie ON cel = maxAccepted.
{
  const rel = 50;
  const give = 100; // PN surowca (AI daje)
  const baseTarget = M.targetResourceTradePaymentPn(give, rel, 'hard', 'sprzedaz');
  const zeroTarget = M.withZeroPwUndershoot(() => M.targetResourceTradePaymentPn(give, rel, 'hard', 'sprzedaz'));
  check('pkt4: Trudny bez zakresu: cel = maxAccepted - 3 PN', baseTarget === Math.floor(give * rel / 100) - 3, baseTarget);
  check('pkt4: w zakresie ON cel = maxAccepted (zerowy undershoot)', zeroTarget === Math.floor(give * rel / 100), zeroTarget);
  check('pkt4: poza zakresem wartość wraca do bazowej', M.targetResourceTradePaymentPn(give, rel, 'hard', 'sprzedaz') === baseTarget);
  // Skutek mierzony na bilansie PW gracza (ta sama funkcja, którą używa filtr w main.ts).
  const pnOpts = { difficulty: 'hard', proposerOwnerId: 1, playerOwnerId: 0 };
  // Realne PN surowca z katalogu (drewno, różne ilości), zapłata w ¤ przeliczona przez pnToPaymentAmount.
  let negBase = 0;
  let negZero = 0;
  let n = 0;
  for (let sztuki = 5; sztuki <= 100; sztuki += 5) {
    const gv = M.diplomacyPnSurowiecIlosc('drewno', sztuki);
    if (gv == null || gv <= 0) continue;
    for (let r = 10; r <= 90; r += 20) {
      n++;
      const payBase = M.pnToPaymentAmount('zloto', M.targetResourceTradePaymentPn(gv, r, 'hard', 'sprzedaz'));
      const payZero = M.pnToPaymentAmount('zloto', M.withZeroPwUndershoot(
        () => M.targetResourceTradePaymentPn(gv, r, 'hard', 'sprzedaz')));
      const mkP = (pay) => ({
        giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: sztuki }],
        receiveItems: pay > 0 ? [{ typ: 'zloto', id: 'zloto', ilosc: pay }] : undefined,
      });
      if (M.aiProposalPlayerBenefitSurplus(mkP(payBase), r, { ...pnOpts }) < 0) negBase++;
      if (M.aiProposalPlayerBenefitSurplus(mkP(payZero), r, { ...pnOpts }) < 0) negZero++;
    }
  }
  check(`pkt4: zmierzono skutek na ${n} scenariuszach (bazowo ujemnych=${negBase}, z zerowym undershoot=${negZero})`, n > 0);
  check('pkt4: zerowy undershoot nie zwiększa liczby ofert z bilansem PW gracza < 0', negZero <= negBase, { negBase, negZero });
}

console.log(`\ndiplomacy-sensible-deals-test: ${pass} passed, ${fail} failed`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
if (fail > 0) process.exit(1);
