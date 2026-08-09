'use strict';
/**
 * diplomacy-negotiation-table-test.cjs — C-DYP-Q1=A (2026-07-26): STÓŁ NEGOCJACYJNY
 * z kontrofertą. Cykl: propozycja → kontroferta → odpowiedź → zawarcie/wygaśnięcie,
 * plus przetrwanie zapisu gry (serializowalność PendingNegotiation).
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.dip-negot-bundle.cjs');
const entryFile = path.resolve(__dirname, '.dip-negot-entry.ts');
fs.writeFileSync(entryFile, `
export {
  evaluateProposal, createNegotiation, applyCounterOffer, canCounterNegotiation, canPlayerCounterNegotiation,
  negotiationStillValid, resolveNegotiationAsResponder, negotiationToLegacyPending,
  resolvePlayerAcceptsAiPending, generateCounterOffer, negotiationAsProposal,
  hasPendingNegotiationForPair, findOwnOutgoingNegotiation,
  NEGOTIATION_MAX_ROUNDS, NEGOTIATION_EXPIRY_TURNS, makeNegotiationId,
} from '../src/game/diplomacy-proposals.ts';
export { getEffectiveDiplomacyParams } from '../src/game/diplomacy.ts';
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
  evaluateProposal, createNegotiation, applyCounterOffer, canCounterNegotiation, canPlayerCounterNegotiation,
  negotiationStillValid, resolveNegotiationAsResponder, negotiationToLegacyPending,
  resolvePlayerAcceptsAiPending, generateCounterOffer, negotiationAsProposal,
  hasPendingNegotiationForPair, findOwnOutgoingNegotiation,
  NEGOTIATION_MAX_ROUNDS, NEGOTIATION_EXPIRY_TURNS, makeNegotiationId,
  getEffectiveDiplomacyParams,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

console.log('diplomacy-negotiation-table-test');

function rel(z = 50, r = 50, status = 'pokoj') { return { zaufanie: z, respekt: r, status }; }
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

// 0 — NEGOTIATION_MAX_ROUNDS jest nazwanym parametrem = 3 (Maciej 2026-07-26, C-DYP-Q1=A pkt 3).
ok(NEGOTIATION_MAX_ROUNDS === 3, 'NEGOTIATION_MAX_ROUNDS = 3');
ok(NEGOTIATION_EXPIRY_TURNS > 0, 'NEGOTIATION_EXPIRY_TURNS > 0');

// 1 — createNegotiation: runda 1, respondent musi odpowiedzieć.
{
  const proposal = { actionId: 'nap', proposerOwnerId: 0, responderOwnerId: 1, payload: { turns: 15 } };
  const entry = createNegotiation(proposal, 10, 'player', 1);
  ok(entry.round === 1, 'createNegotiation: round=1');
  ok(entry.awaitingOwnerId === 1, 'createNegotiation: awaitingOwnerId=responder');
  ok(entry.authorOwnerId === 0, 'createNegotiation: authorOwnerId=proposer');
  ok(entry.expiresTurn === 10 + NEGOTIATION_EXPIRY_TURNS, 'createNegotiation: expiresTurn = createdTurn + limit');
  ok(entry.source === 'player', 'createNegotiation: source=player');
  ok(typeof entry.id === 'string' && entry.id.length > 0, 'createNegotiation: id niepusty');
}

// 2 — Pełny cykl: NAP zbyt słaba Relacja → AI kontruje (słodzik) → gracz przyjmuje kontrofertę.
{
  let entry = createNegotiation(
    { actionId: 'nap', proposerOwnerId: 0, responderOwnerId: 1, payload: { turns: 15 } },
    10, 'player', 2,
  );
  const evalCtx = ctx({ relation: rel(20, 10) }); // score=30 < progNapRelacja(50) -> reject bez słodzika
  const rejectCheck = evaluateProposal(negotiationAsProposal(entry), evalCtx);
  ok(!rejectCheck.accepted, 'NAP bez słodzika: AI odrzuca (relacja za niska)');

  const outcome1 = resolveNegotiationAsResponder(entry, evalCtx, 11);
  ok(outcome1.kind === 'countered', 'runda 1: AI składa kontrofertę (słodzik)');
  if (outcome1.kind === 'countered') {
    entry = outcome1.entry;
    ok(entry.round === 2, 'po kontrze AI: round=2');
    ok(entry.awaitingOwnerId === 0, 'po kontrze AI: czeka gracz (awaitingOwnerId=0)');
    ok((entry.payload.giveItems ?? []).some(i => i.typ === 'zloto'), 'kontroferta AI dokłada słodzik (zloto)');
    // Gracz PRZYJMUJE kontrofertę — bez ponownej oceny progów (jak resolvePlayerAcceptsAiPending).
    const result = resolvePlayerAcceptsAiPending(negotiationToLegacyPending(entry), 11, 'normal');
    ok(result.accepted && result.deal?.rodzaj === 'pakt_nieagresji', 'gracz przyjmuje kontrofertę NAP → traktat');
  }
}

// 3 — Limit rund: impas bez słodzika wystarczającego (relacja EKSTREMALNIE niska) →
// AI w końcu odrzuca definitywnie, canCounterNegotiation=false po osiągnięciu limitu.
{
  let entry = createNegotiation(
    { actionId: 'sojusz_pelny', proposerOwnerId: 0, responderOwnerId: 1, payload: {} },
    10, 'player', 3,
  );
  // Warunki, których słodzik NIE odblokuje (hegemon blokuje sojusz — brak lewaru w generateCounterOffer).
  const evalCtx = ctx({
    relation: rel(5, 5),
    militaryRatio: 0.05,
    proposerRespekt: 5,
    responderRespekt: 95,
  });
  let rounds = 0;
  let finalOutcome = null;
  while (rounds < 5) {
    const outcome = resolveNegotiationAsResponder(entry, evalCtx, 10 + rounds);
    if (outcome.kind === 'countered') { entry = outcome.entry; rounds++; continue; }
    finalOutcome = outcome;
    break;
  }
  ok(finalOutcome !== null && finalOutcome.kind === 'rejected', 'sojusz beznadziejny: kończy się odrzuceniem, nie pętlą');
  ok(rounds <= NEGOTIATION_MAX_ROUNDS, `limit rund respektowany (rounds=${rounds} <= ${NEGOTIATION_MAX_ROUNDS})`);
}

// 4 — canCounterNegotiation: false po osiągnięciu limitu rund.
{
  const base = { id: 'x', proposerOwnerId: 0, responderOwnerId: 1, actionId: 'nap', payload: {}, authorOwnerId: 0, awaitingOwnerId: 1, createdTurn: 1, lastActionTurn: 1, expiresTurn: 99, source: 'player' };
  ok(canCounterNegotiation({ ...base, round: 1 }) === true, 'canCounter round 1 -> true');
  ok(canCounterNegotiation({ ...base, round: 2 }) === true, 'canCounter round 2 -> true');
  ok(canCounterNegotiation({ ...base, round: 3 }) === false, 'canCounter round 3 (limit) -> false');
}

// 5 — umowa_handlowa: evaluateProposal jak umowa_szlakow (R-DYPLO-PRZYJMIJ-TRADE).
{
  const peaceCtx = ctx({ relation: rel(50, 50) });
  const proposalHandlowa = { actionId: 'umowa_handlowa', proposerOwnerId: 0, responderOwnerId: 1, payload: { turns: 10 } };
  const evalHandlowa = evaluateProposal(proposalHandlowa, peaceCtx);
  ok(evalHandlowa.accepted && evalHandlowa.deal?.rodzaj === 'umowa_szlakow', 'umowa_handlowa @ rel 100: accepted + deal szlaków');
  const base = { id: 'y', proposerOwnerId: 1, responderOwnerId: 0, actionId: 'umowa_handlowa', payload: { turns: 10 }, authorOwnerId: 1, awaitingOwnerId: 0, createdTurn: 1, lastActionTurn: 1, expiresTurn: 99, source: 'ai' };
  ok(canPlayerCounterNegotiation({ ...base, round: 1 }) === true, 'umowa_handlowa: gracz canPlayerCounter true');
}

// 6 — trybut_zadanie: "oferuje mniej" — kwota zbyt wysoka (poza limitem AI) -> kontra obniża kwotę.
{
  const dip = getEffectiveDiplomacyParams('normal');
  const maxPerTurn = dip.progTrybutZadanieMaxGoldBase
    + 10 * dip.progTrybutZadanieMaxGoldPerRespekt;
  const tooHigh = Math.round(maxPerTurn * 1.3); // ~30% powyżej limitu — w zasięgu przeszukania kontroferty
  let entry = createNegotiation(
    { actionId: 'trybut_zadanie', proposerOwnerId: 1, responderOwnerId: 0, payload: { goldPerTurn: tooHigh } },
    10, 'ai', 4,
  );
  const evalCtx = ctx({ relation: rel(50, 50), proposerRespekt: dip.progTrybutZadanieMinRespekt + 10 });
  const initial = evaluateProposal(negotiationAsProposal(entry), evalCtx);
  ok(!initial.accepted, 'trybut zbyt wysoki: odrzucone (przekracza limit Respektu)');
  const outcome = resolveNegotiationAsResponder(entry, evalCtx, 10);
  ok(outcome.kind === 'countered', 'trybut zbyt wysoki: respondent kontruje (oferuje mniej)');
  if (outcome.kind === 'countered') {
    ok(outcome.entry.payload.goldPerTurn < tooHigh, 'kontroferta trybutu: kwota obniżona');
    ok(outcome.entry.awaitingOwnerId === 1, 'po kontrze gracza: czeka AI (proponent)');
  }
}

// 7 — negotiationStillValid: RYZYKA ze zlecenia — wojna, eliminacja, upływ terminu.
{
  const entry = createNegotiation(
    { actionId: 'nap', proposerOwnerId: 0, responderOwnerId: 1, payload: {} },
    10, 'player', 5,
  );
  const okBase = negotiationStillValid(entry, { turn: 11, isAtWar: false, proposerEliminated: false, responderEliminated: false });
  ok(okBase.valid, 'ważne warunki bazowe -> valid');

  const warInvalid = negotiationStillValid(entry, { turn: 11, isAtWar: true, proposerEliminated: false, responderEliminated: false });
  ok(!warInvalid.valid && /wojna/i.test(warInvalid.reason ?? ''), 'wybuch wojny unieważnia NAP z czytelnym powodem');

  const elimInvalid = negotiationStillValid(entry, { turn: 11, isAtWar: false, proposerEliminated: false, responderEliminated: true });
  ok(!elimInvalid.valid && /wyeliminowan/i.test(elimInvalid.reason ?? ''), 'eliminacja strony unieważnia propozycję');

  const expiredInvalid = negotiationStillValid(entry, { turn: entry.expiresTurn + 1, isAtWar: false, proposerEliminated: false, responderEliminated: false });
  ok(!expiredInvalid.valid && /wygasł/i.test(expiredInvalid.reason ?? ''), 'upływ terminu -> wygasła z czytelnym powodem');

  // trybut_oferta/ultimatum dotyczą WŁAŚNIE wojny — jej wybuch ich NIE unieważnia.
  const tributeEntry = createNegotiation(
    { actionId: 'trybut_oferta', proposerOwnerId: 0, responderOwnerId: 1, payload: { goldOnce: 50 } },
    10, 'player', 6,
  );
  const tributeDuringWar = negotiationStillValid(tributeEntry, { turn: 11, isAtWar: true, proposerEliminated: false, responderEliminated: false });
  ok(tributeDuringWar.valid, 'trybut_oferta: wojna NIE unieważnia (to jej właśnie dotyczy)');

  const giftEntry = createNegotiation(
    { actionId: 'handel', proposerOwnerId: 1, responderOwnerId: 0, payload: { goldOnce: 50, giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 50 }], isGift: true } },
    10, 'ai', 6,
  );
  const giftDuringWar = negotiationStillValid(giftEntry, { turn: 11, isAtWar: true, proposerEliminated: false, responderEliminated: false });
  ok(!giftDuringWar.valid && /wojna/i.test(giftDuringWar.reason ?? ''), 'handel (dar goldOnce) + wojna: negotiationStillValid invalid');
}

// 8 — Przetrwanie zapisu gry: PendingNegotiation to zwykły JSON-owalny obiekt (round-trip).
{
  const entry = createNegotiation(
    { actionId: 'handel', proposerOwnerId: 0, responderOwnerId: 2, payload: { goldOnce: 40, giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 40 }] } },
    10, 'player', 7,
  );
  const roundTripped = JSON.parse(JSON.stringify(entry));
  ok(JSON.stringify(roundTripped) === JSON.stringify(entry), 'PendingNegotiation przetrwa JSON.stringify/parse bez strat (save/load)');
  ok(roundTripped.payload.giveItems[0].ilosc === 40, 'zagnieżdżony koszyk (giveItems) przetrwa round-trip');
}

// 8b — N4 (Evaluator runda 2, P-HANDEL-TECH-BLOKADA-AKCJA6-ASYMETRIA-Q1): pole
// `techDirection` (akcja '6', R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1=A) przetrwa
// save/load (JSON round-trip) tak samo jak reszta payloadu, a STARY zapis SPRZED tej
// decyzji (brak pola w ogóle) degraduje się bezpiecznie do 'sell' — dokładnie ten sam
// fallback co main.ts::executeTechTradeDeal i ui/diplomacyTradeBasket.ts::defaultTreatyState
// (`payload.techDirection === 'buy' ? 'buy' : 'sell'`), nie np. `undefined`/wyjątek.
{
  const buyEntry = createNegotiation(
    { actionId: 'tech', proposerOwnerId: 0, responderOwnerId: 3, payload: { techId: 'Kolo', techPrice: 60, goldOnce: 60, techDirection: 'buy' } },
    10, 'player', 6,
  );
  const roundTripped = JSON.parse(JSON.stringify(buyEntry));
  ok(JSON.stringify(roundTripped) === JSON.stringify(buyEntry), 'techDirection=\'buy\': PendingNegotiation przetrwa JSON.stringify/parse bez strat');
  ok(roundTripped.payload.techDirection === 'buy', 'techDirection=\'buy\' przetrwa round-trip bez degradacji');

  // Stary zapis (sprzed tej decyzji) — pole techDirection W OGÓLE nie istnieje w payloadzie.
  const legacyEntry = createNegotiation(
    { actionId: 'tech', proposerOwnerId: 0, responderOwnerId: 3, payload: { techId: 'Kolo', techPrice: 60, goldOnce: 60 } },
    10, 'player', 6,
  );
  const legacyRoundTripped = JSON.parse(JSON.stringify(legacyEntry));
  ok(!('techDirection' in legacyRoundTripped.payload), 'stary zapis bez techDirection: pole faktycznie nieobecne po round-tripie (nie np. null wstawione przez silnik)');
  const fallbackDirection = legacyRoundTripped.payload.techDirection === 'buy' ? 'buy' : 'sell';
  ok(fallbackDirection === 'sell', 'stary zapis bez techDirection degraduje się bezpiecznie do \'sell\' (ten sam fallback co main.ts/diplomacyTradeBasket.ts)');
}

// 8c — N4 rozszerzone (runda 2, pełny zakres decyzji — tech-za-tech): `techPaymentMode` +
// `techOfferId` przetrwają save/load tak samo, a stary zapis (sprzed tego rozszerzenia,
// TYLKO techDirection obecne, bez techPaymentMode/techOfferId) degraduje się bezpiecznie do
// 'gold' — ten sam fallback co main.ts::executeTechTradeDeal
// (`payload.techPaymentMode === 'tech' ? 'tech' : 'gold'`).
{
  const techForTechEntry = createNegotiation(
    { actionId: 'tech', proposerOwnerId: 0, responderOwnerId: 3, payload: { techId: 'Kolo', techDirection: 'sell', techPaymentMode: 'tech', techOfferId: 'Zelazo' } },
    10, 'player', 6,
  );
  const roundTripped = JSON.parse(JSON.stringify(techForTechEntry));
  ok(JSON.stringify(roundTripped) === JSON.stringify(techForTechEntry), 'techPaymentMode=\'tech\' + techOfferId: PendingNegotiation przetrwa JSON round-trip bez strat');
  ok(roundTripped.payload.techPaymentMode === 'tech' && roundTripped.payload.techOfferId === 'Zelazo', 'techPaymentMode/techOfferId przetrwają round-trip bez degradacji');

  // Zapis sprzed rozszerzenia tech-za-tech: techDirection JUŻ istnieje (runda 2, część
  // gotówkowa), ale techPaymentMode/techOfferId jeszcze nie.
  const preTechForTechEntry = createNegotiation(
    { actionId: 'tech', proposerOwnerId: 0, responderOwnerId: 3, payload: { techId: 'Kolo', techDirection: 'buy', techPrice: 60, goldOnce: 60 } },
    10, 'player', 6,
  );
  const preRoundTripped = JSON.parse(JSON.stringify(preTechForTechEntry));
  ok(!('techPaymentMode' in preRoundTripped.payload) && !('techOfferId' in preRoundTripped.payload), 'zapis sprzed tech-za-tech: pola faktycznie nieobecne po round-tripie');
  const fallbackPaymentMode = preRoundTripped.payload.techPaymentMode === 'tech' ? 'tech' : 'gold';
  ok(fallbackPaymentMode === 'gold', 'zapis sprzed tech-za-tech degraduje się bezpiecznie do techPaymentMode=\'gold\' (ten sam fallback co main.ts)');
}

// 9 — makeNegotiationId: unikalność przez seq, stabilna para właścicieli (mniejszy first).
{
  const idA = makeNegotiationId('nap', 5, 0, 3, 1);
  const idB = makeNegotiationId('nap', 5, 3, 0, 1);
  ok(idA === idB, 'makeNegotiationId: kolejność ownerId bez znaczenia (para kanoniczna)');
  const idC = makeNegotiationId('nap', 5, 0, 3, 2);
  ok(idA !== idC, 'makeNegotiationId: różny seq -> różne id (unikalność przy tej samej parze/turze)');
}

// 10 — applyCounterOffer: flip awaitingOwnerId/authorOwnerId, round++, termin odświeżony.
{
  const entry = createNegotiation(
    { actionId: 'granice', proposerOwnerId: 0, responderOwnerId: 4, payload: { borderMilitary: true } },
    10, 'player', 8,
  );
  const countered = applyCounterOffer(entry, { borderMilitary: false }, 4, 12);
  ok(countered.round === 2, 'applyCounterOffer: round+1');
  ok(countered.authorOwnerId === 4, 'applyCounterOffer: authorOwnerId = kto kontrował');
  ok(countered.awaitingOwnerId === 0, 'applyCounterOffer: awaitingOwnerId = druga strona');
  ok(countered.expiresTurn === 12 + NEGOTIATION_EXPIRY_TURNS, 'applyCounterOffer: nowy termin ważności');
  ok(countered.payload.borderMilitary === false, 'applyCounterOffer: nowe warunki na stole (ustępstwo)');
}

// 11 — Pokój (Maciej 2026-07-29): tylko w wojnie, PN baza 500, stoł ważny podczas wojny.
{
  const warCtx = ctx({
    stanWojny: true,
    relation: rel(55, 45),
    militaryRatio: 0.25,
    proposerRespekt: 30,
    responderRespekt: 70,
  });
  const peaceNoOffer = evaluateProposal(
    { actionId: 'pokoj', proposerOwnerId: 0, responderOwnerId: 1, payload: {} },
    warCtx,
  );
  ok(peaceNoOffer.accepted, 'pokój bez koszyka: akceptowany (sama propozycja = PN traktatu @ Relacji)');

  const peaceGiftSurplus = evaluateProposal(
    {
      actionId: 'pokoj', proposerOwnerId: 1, responderOwnerId: 0,
      payload: { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 28 }] },
    },
    warCtx,
  );
  ok(peaceGiftSurplus.accepted, 'pokój + dar 28¤ od AI: akceptowany (traktat + słodzik)');

  const peaceNoCounter = generateCounterOffer(
    { actionId: 'pokoj', proposerOwnerId: 0, responderOwnerId: 1, payload: {} },
    warCtx,
  );
  ok(peaceNoCounter == null, 'pokój na progu: brak zbędnej kontroferty ze słodzikiem');

  const peaceOffer = evaluateProposal(
    {
      actionId: 'pokoj', proposerOwnerId: 0, responderOwnerId: 1,
      payload: { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 500 }] },
    },
    warCtx,
  );
  ok(peaceOffer.accepted, 'pokój z 500¤ @ rel 80 w wojnie: akceptowany');

  const peaceNoWar = evaluateProposal(
    { actionId: 'pokoj', proposerOwnerId: 0, responderOwnerId: 1, payload: { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 500 }] } },
    ctx({ stanWojny: false }),
  );
  ok(!peaceNoWar.accepted && /wojny/i.test(peaceNoWar.reason ?? ''), 'pokój bez wojny: odrzucony');

  const peaceEntry = createNegotiation(
    { actionId: 'pokoj', proposerOwnerId: 1, responderOwnerId: 0, payload: {} },
    10, 'ai', 9,
  );
  const peaceDuringWar = negotiationStillValid(peaceEntry, { turn: 11, isAtWar: true, proposerEliminated: false, responderEliminated: false });
  ok(peaceDuringWar.valid, 'pokój: propozycja ważna PODCZAS wojny (nie gasi się jak NAP)');
}

// 8 — BUG-DYPLO-UMOWY-DUPLIKAT: ta sama umowa max raz na stole per para.
{
  const table = [];
  const proposal = { actionId: 'umowa_szlakow', proposerOwnerId: 0, responderOwnerId: 2, payload: { turns: 20 } };
  table.push(createNegotiation(proposal, 10, 'player', 1));
  ok(findOwnOutgoingNegotiation(table, 2, 'umowa_szlakow') != null, 'dedup: wykrywa własną propozycję gracza');
  ok(hasPendingNegotiationForPair(table, 0, 2, 'umowa_szlakow'), 'dedup: para 0↔2 ma umowa_szlakow');
  ok(!hasPendingNegotiationForPair(table, 0, 2, 'nap'), 'dedup: inny typ akcji nie blokuje');
  ok(!findOwnOutgoingNegotiation(table, 3, 'umowa_szlakow'), 'dedup: inny partner nie matchuje');
  const aiProposal = { actionId: 'umowa_szlakow', proposerOwnerId: 2, responderOwnerId: 0, payload: { turns: 20 } };
  table.push(createNegotiation(aiProposal, 11, 'ai', 2));
  ok(hasPendingNegotiationForPair(table, 0, 2, 'umowa_szlakow'), 'dedup: oba kierunki na stole');
}

// 12 — BUG: AI nie przyjmuje oferty nieuczciwej dla partnera (bilans PW −5 @ NAP/handlu).
{
  const napCtx = ctx({
    relation: rel(50, 50),
    proposerWiarygodnosc: 80,
    proposerRespekt: 50,
    responderRespekt: 50,
  });
  const napUnfair = evaluateProposal(
    {
      actionId: 'nap', proposerOwnerId: 0, responderOwnerId: 1,
      payload: {
        turns: 15,
        giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 5 }],
        receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 10 }],
      },
    },
    napCtx,
  );
  ok(!napUnfair.accepted && /nieuczciwa dla partnera/i.test(napUnfair.reason ?? ''), 'NAP + koszyk 5 vs 10: odrzucony (nieuczciwy dla partnera)');

  const handelUnfair = evaluateProposal(
    {
      actionId: 'handel', proposerOwnerId: 0, responderOwnerId: 1,
      payload: {
        giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 105 }],
        receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 110 }],
      },
    },
    ctx({ relation: rel(100, 100) }),
  );
  ok(!handelUnfair.accepted && /nieuczciwa dla partnera/i.test(handelUnfair.reason ?? ''), 'handel 105 vs 110 PW: odrzucony');

  const entry = createNegotiation(
    {
      actionId: 'nap', proposerOwnerId: 0, responderOwnerId: 1,
      payload: {
        turns: 15,
        giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 5 }],
        receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 10 }],
      },
    },
    10, 'player', 1,
  );
  const outcome = resolveNegotiationAsResponder(entry, napCtx, 10);
  ok(outcome.kind !== 'accepted', 'resolveNegotiationAsResponder: NAP nieuczciwy nie akceptuje');
}

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
