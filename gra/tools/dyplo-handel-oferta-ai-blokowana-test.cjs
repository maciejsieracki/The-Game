'use strict';
/**
 * dyplo-handel-oferta-ai-blokowana-test.cjs — R-DYPLO-HANDEL-OFERTA-AI-BLOKOWANA-Q1
 * (runda 2, Operator Sonnet 5). Zastępuje wcześniejszą, nieskomitowaną wersję pliku
 * (recon rundy 1, inna hipoteza — INCOMING_NET_PW_ACTIONS/previewIncomingPlayerAccept,
 * odrzucona w 01-operator.md rundy 1 jako NIE-przyczyna) treścią pokrywającą
 * FAKTYCZNĄ przyczynę i poprawkę rundy 2.
 *
 * Pokrywa GENERATOR startowej oferty AI dla `zaproponuj_handel_surowiec`
 * (`targetResourceTradePaymentPn`/`adjustZaplataPerTuraForZeroBalance`,
 * `diplomacy-ai-offer-balance.ts`), skrzyżowany z bramką uczciwości handlu
 * (`handelRequiredPn`/`evaluateProposal`, `diplomacy-proposals.ts`) — TE SAME
 * funkcje produkcyjne, żywo wołane (nie reimplementowane/nie zamockowane).
 *
 * Kryteria dispatchu (runda 2):
 *  1. Kierunek 'zakup' poniżej progu -> canAccept===false (żywy dowód PRZED, ten sam
 *     scenariusz co runda 1: 20 żelazo, relTotal=60, naiwna zapłata parytetowa 40 PN).
 *  2. Przyczyna: `targetResourceTradePaymentPn`/`adjustZaplataPerTuraForZeroBalance`
 *     wołane z 'sprzedaz'-owym (malejącym) wzorem niezależnie od kierunku.
 *  3. Po poprawce (kierunek-świadomy wzór): ta sama sytuacja -> canAccept===true.
 *  4. Brak regresu: kierunek 'sprzedaz' identyczny jak dziś (bit-identyczne wartości).
 *  5. Brak regresu: oferta GRACZA do AI (proposerIsPlayer), celowo zaniżona, nadal
 *     poprawnie zablokowana (bramka nietknięta).
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.dip-handel-blok-bundle.cjs');
const entryFile = path.resolve(__dirname, '.dip-handel-blok-entry.ts');
fs.writeFileSync(entryFile, `
export {
  targetResourceTradePaymentPn,
  adjustZaplataPerTuraForZeroBalance,
} from '../src/game/diplomacy-ai-offer-balance.ts';
export {
  evaluateProposal,
  handelRequiredPn,
} from '../src/game/diplomacy-proposals.ts';
`);

esbuild.buildSync({
  entryPoints: [entryFile],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const {
  targetResourceTradePaymentPn,
  adjustZaplataPerTuraForZeroBalance,
  evaluateProposal,
  handelRequiredPn,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

console.log('dyplo-handel-oferta-ai-blokowana-test (R-DYPLO-HANDEL-OFERTA-AI-BLOKOWANA-Q1, runda 2)');

function rel(z, r, status = 'pokoj') { return { zaufanie: z, respekt: r, status }; }
function ctx(over = {}) {
  return {
    relation: rel(30, 30),
    stanWojny: false,
    turn: 10,
    proposerRespekt: 40,
    responderRespekt: 60,
    militaryRatio: 1,
    ...over,
  };
}
function prop(actionId, a, b, payload) {
  return { actionId, proposerOwnerId: a, responderOwnerId: b, payload };
}

// -- scenariusz WYZWALACZA (identyczny z rundą 1): AI(3) kupuje 20 żelazo OD gracza(0),
// płaci złotem, wartość surowca (resourceGivePn) = 40 PN, relTotal = 60.
const relTotal = 60;
const resourceGivePn = 40; // wartość 20 żelazo

// -- 1+2. PRZED poprawką: generator wołał zawsze wariant 'sprzedaz' (malejący wraz z
// zaufaniem) niezależnie od kierunku — dokładnie ustalenie rundy 1. Odtworzone tu jako
// jawne wywołanie starego (domyślnego, kierunek='sprzedaz') wzoru na sytuacji 'zakup'.
const naiwnaZaplataStarymWzorem = targetResourceTradePaymentPn(resourceGivePn, relTotal, 'normal');
ok(naiwnaZaplataStarymWzorem === 24, `RECON: stary wzór 'sprzedaz' zastosowany do 'zakup' -> 24 PN (${naiwnaZaplataStarymWzorem}, dokładnie jak w rundzie 1)`);
const requiredPnZakup = handelRequiredPn(resourceGivePn, relTotal, 1);
ok(requiredPnZakup === 67, `bramka handelRequiredPn(receivePn=40, rel=60, mult=1) = 67 PN (${requiredPnZakup})`);
ok(naiwnaZaplataStarymWzorem < requiredPnZakup, "PRZED poprawką: stary wzór (24) < wymagane (67) -> niedopłata (przyczyna, kryterium 2)");

const przedPayload = {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: naiwnaZaplataStarymWzorem }],
  receiveItems: [{ typ: 'surowiec_ilosc', id: 'zelazo', ilosc: 20 }],
};
const przedResult = evaluateProposal(prop('handel', 3, 0, przedPayload), ctx());
ok(przedResult.accepted === false, `KRYTERIUM 1: oferta 'zakup' z zaniżoną zapłatą (stary wzór) -> canAccept===false (${JSON.stringify(przedResult)})`);

// -- 3. PO poprawce: kierunek='zakup' -> zapłata >= wymagana, oferta zaakceptowana --
const poprawionaZaplata = targetResourceTradePaymentPn(resourceGivePn, relTotal, 'normal', 'zakup');
ok(poprawionaZaplata === requiredPnZakup, `PO poprawce: targetResourceTradePaymentPn(..., 'zakup') = ${requiredPnZakup} PN (dokładnie próg bramki, undershoot=0 na normal) (got ${poprawionaZaplata})`);

const poPayload = {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: poprawionaZaplata }],
  receiveItems: [{ typ: 'surowiec_ilosc', id: 'zelazo', ilosc: 20 }],
};
const poResult = evaluateProposal(prop('handel', 3, 0, poPayload), ctx());
ok(poResult.accepted === true, `KRYTERIUM 3: PO poprawce, ta sama sytuacja -> canAccept===true (${JSON.stringify(poResult)})`);

// -- 3b. adjustZaplataPerTuraForZeroBalance (funkcja realnie wołana przez
//    main.ts::pickResourceTradeRelOffer) daje ten sam wynik dla 'zakup' --
const adjustedZakup = adjustZaplataPerTuraForZeroBalance(999 /* naiwna baza, ignorowana gdy floor > 0 */, 'zloto', resourceGivePn, relTotal, 'normal', 'zakup');
ok(adjustedZakup === poprawionaZaplata, `adjustZaplataPerTuraForZeroBalance('zakup') = target = ${poprawionaZaplata} PN (got ${adjustedZakup})`);

// -- 3c. Łatwy (aiOfferTargetsZeroBalance=false): floor bramki MUSI działać mimo to
//    (fairness gate jest difficulty-independent, evaluateProposal nie sprawdza difficulty
//    dla handelFairnessGate) --
const zakupEasy = targetResourceTradePaymentPn(resourceGivePn, relTotal, 'easy', 'zakup');
ok(zakupEasy === requiredPnZakup, `Łatwy: floor bramki wymuszony też na 'easy' -> ${requiredPnZakup} PN (got ${zakupEasy}) — inaczej niedopłata na Łatwym`);
const easyPayload = {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: zakupEasy }],
  receiveItems: [{ typ: 'surowiec_ilosc', id: 'zelazo', ilosc: 20 }],
};
const easyResult = evaluateProposal(prop('handel', 3, 0, easyPayload), ctx());
ok(easyResult.accepted === true, `Łatwy: oferta 'zakup' z floor bramki -> canAccept===true (${JSON.stringify(easyResult)})`);

// -- 3d. Trudny: overshoot (symetryczny do undershoot 'sprzedaz') -> zapłata > minimum, nadal akceptowana --
const zakupHard = targetResourceTradePaymentPn(resourceGivePn, relTotal, 'hard', 'zakup');
ok(zakupHard === requiredPnZakup + 3, `Trudny: minimum + overshoot(3) = ${requiredPnZakup + 3} PN (got ${zakupHard})`);
ok(zakupHard > requiredPnZakup, "Trudny: zapłata 'zakup' > minimum bramki (margines bezpieczeństwa, nie floor)");

// -- 4. BRAK REGRESU: kierunek 'sprzedaz' bit-identyczny jak przed rundą 2 (parametr
//    domyślny, dokładnie te same wartości co gra/tools/diplomacy-ai-offer-balance-test.cjs) --
ok(targetResourceTradePaymentPn(100, 100, 'normal') === 100, "regres 'sprzedaz': 100 PW @ rel 100 normal -> 100 PW (bez zmian)");
ok(targetResourceTradePaymentPn(100, 100, 'hard') === 97, "regres 'sprzedaz': 100 PW @ rel 100 hard -> 97 PW (undershoot 3, bez zmian)");
ok(targetResourceTradePaymentPn(resourceGivePn, relTotal, 'normal') === 24, "regres 'sprzedaz' (kierunek domyślny): 40 PW @ rel 60 normal -> 24 PW (bez zmian, identyczne jak RECON rundy 1)");
ok(targetResourceTradePaymentPn(resourceGivePn, relTotal, 'normal', 'sprzedaz') === 24, "regres 'sprzedaz' (kierunek jawny): identyczny wynik (24)");
const adjustedSprzedaz = adjustZaplataPerTuraForZeroBalance(50, 'zloto', 100, 100, 'normal');
ok(adjustedSprzedaz === 100, "regres 'sprzedaz': adjustZaplataPerTuraForZeroBalance(50,...,100,100,normal) -> 100 (bez zmian, jak w diplomacy-ai-offer-balance-test.cjs)");
// scenariusz SPRZEDAZ z rundy 1 (AI sprzedaje 20 żelazo, dostaje złoto, relTotal=60) — dalej na granicy 0.
const sprzedazPayload = {
  giveItems: [{ typ: 'surowiec_ilosc', id: 'zelazo', ilosc: 20 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 24 }],
};
const sprzedazResult = evaluateProposal(prop('handel', 3, 0, sprzedazPayload), ctx());
ok(sprzedazResult.accepted === true, `KRYTERIUM 4: 'sprzedaz' (AI sprzedaje) nadal działa identycznie -> canAccept===true, pwBalance=0 (${JSON.stringify(sprzedazResult)})`);
ok(sprzedazResult.pwBalance === 0, `KRYTERIUM 4: pwBalance nadal dokładnie 0 (na granicy), jak w rundzie 1 (${sprzedazResult.pwBalance})`);

// -- 5. BRAK REGRESU: oferta GRACZA (proposerIsPlayer, ownerId=0 jako proponent) do AI,
//    celowo zaniżona -> nadal poprawnie zablokowana (bramka symetryczna, nietknięta). --
const playerLowballPayload = {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 24 }],
  receiveItems: [{ typ: 'surowiec_ilosc', id: 'zelazo', ilosc: 20 }],
};
const playerLowballResult = evaluateProposal(prop('handel', 0, 3, playerLowballPayload), ctx());
ok(playerLowballResult.accepted === false, `KRYTERIUM 5: oferta GRACZA (proposerIsPlayer) zaniżona 24 PN za 40 PN -> nadal canAccept===false (${JSON.stringify(playerLowballResult)})`);
// Uwaga: pwBalance tu to -41, nie -43 (jak w kierunku 'zakup' AI wyżej) — bo
// handelWillingnessMultiplier różni się rolą proponenta w tym samym ctx (nieistotne dla
// GOAL: liczy się WYŁĄCZNIE, że bramka nadal blokuje, symetria samej bramki niezmieniona
// przez rundę 2 — zero zmian w diplomacy-proposals.ts/handelFairnessGate).
ok(playerLowballResult.pwBalance < 0, `KRYTERIUM 5: bramka nadal daje ujemny pwBalance (symetryczna, nietknięta w rundzie 2) (${playerLowballResult.pwBalance})`);

console.log(`\n${pass} OK, ${fail} FAIL`);
try { fs.unlinkSync(entryFile); } catch {}
try { fs.unlinkSync(BUNDLE); } catch {}
if (fail > 0) process.exit(1);
