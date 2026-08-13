'use strict';
/**
 * diplomacy-resource-cyclic-trade-test.cjs — HANDEL-SUROWCE-CYKL (2026-07-24).
 * Pokrywa: buildHandelSurowiecCykliczny (koszyk -> przepływy), evaluateProposal
 * 'handel' z resourceTradeMode='per_turn' (gracz jako proponent LUB respondent —
 * ownerId-agnostyczne), resolvePlayerAcceptsAiPending dla 'zaproponuj_handel_surowiec'
 * (gracz akceptuje ofertę AI), i decideAIDiplomacy priorytet 5c (AI samo proponuje
 * cykliczny handel surowcem wg nadwyżki — zarówno wobec gracza jak i wobec innego AI,
 * bo decideAIDiplomacy nie rozróżnia typu partnera).
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.dip-res-cyclic-bundle.cjs');
const entryFile = path.resolve(__dirname, '.dip-res-cyclic-entry.ts');
fs.writeFileSync(entryFile, `
export {
  evaluateProposal, resolvePlayerAcceptsAiPending, aiCommandToPendingProposal,
  buildHandelSurowiecCykliczny, clampDealTurns,
} from '../src/game/diplomacy-proposals.ts';
export { canAiProposeResourceTrade, AI_RESOURCE_TRADE_DEFAULT_TURNS } from '../src/game/diplomacy-economy.ts';
export { decideAIDiplomacy } from '../src/game/ai.ts';
export { transferSurowiecIlosc } from '../src/game/diplomacy-basket-transfer.ts';
export { diplomacyHandelSurowcePakietWielkosc } from '../src/game/diplomacy-value-catalog.ts';
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
  evaluateProposal, resolvePlayerAcceptsAiPending, aiCommandToPendingProposal,
  buildHandelSurowiecCykliczny, clampDealTurns,
  canAiProposeResourceTrade, AI_RESOURCE_TRADE_DEFAULT_TURNS,
  decideAIDiplomacy, transferSurowiecIlosc, diplomacyHandelSurowcePakietWielkosc,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

function rel(z = 50, r = 50, status = 'pokoj') {
  return { zaufanie: z, respekt: r, status };
}
function ctx(over = {}) {
  return {
    relation: rel(60, 50),
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

console.log('diplomacy-resource-cyclic-trade-test');

// -- 1. buildHandelSurowiecCykliczny: give surowiec + receive zloto --
// R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): pakietyPerTura floruje do wielokrotności kroku
// handlu (5 szt. dla drewno) TU, przy budowie dealu — zamrożone dla całego cyklu.
let items = buildHandelSurowiecCykliczny(0, 2, [
  { typ: 'surowiec_ilosc', id: 'drewno', ilosc: 5 },
], [
  { typ: 'zloto', id: 'zloto', ilosc: 10 },
]);
ok(items.length === 1, 'buildHandelSurowiecCykliczny: 1 wpis (give)');
ok(items[0].surowiecKey === 'drewno' && items[0].pakietyPerTura === 5, 'wpis: drewno x5 pakiety/ture');
ok(items[0].sellerOwnerId === 0 && items[0].buyerOwnerId === 2, 'wpis: sprzedawca=proposer, kupujacy=responder');
ok(items[0].zaplataTyp === 'zloto' && items[0].zaplataPerTura === 10, 'wpis: zaplata zloto 10/ture (z receiveItems)');

// -- 1b. barter dwustronny (oba kierunki naraz) --
items = buildHandelSurowiecCykliczny(5, 7, [
  { typ: 'surowiec_ilosc', id: 'drewno', ilosc: 10 },
], [
  { typ: 'surowiec_ilosc', id: 'kamien', ilosc: 5 },
]);
ok(items.length === 2, 'buildHandelSurowiecCykliczny: barter -> 2 wpisy');
ok(items.some(i => i.surowiecKey === 'drewno' && i.sellerOwnerId === 5 && i.buyerOwnerId === 7 && i.pakietyPerTura === 10), 'barter: drewno 5->7, 10 szt.');
ok(items.some(i => i.surowiecKey === 'kamien' && i.sellerOwnerId === 7 && i.buyerOwnerId === 5 && i.pakietyPerTura === 5), 'barter: kamien 7->5, 5 szt.');

// -- 1d. ilość niebędąca wielokrotnością kroku floruje w dół do 0 (odrzucona, nie zaokrąglona w górę) --
items = buildHandelSurowiecCykliczny(0, 2, [
  { typ: 'surowiec_ilosc', id: 'drewno', ilosc: 3 },
], []);
ok(items.length === 1 && items[0].pakietyPerTura === 0,
  'buildHandelSurowiecCykliczny: 3 szt. drewno (< krok 5) -> pakietyPerTura 0, nie 3');

// -- 1c. brak surowca w koszyku -> pusta tablica --
ok(buildHandelSurowiecCykliczny(0, 1, [{ typ: 'zloto', id: 'zloto', ilosc: 5 }], []).length === 0,
  'buildHandelSurowiecCykliczny: brak surowiec_ilosc -> []');

// -- 2. evaluateProposal 'handel' + resourceTradeMode='per_turn' -> UmowaHandlowa cykliczna --
// (Uczciwa oferta: drewno warte znacznie wiecej PN niz 1 zloto, wiec pnDealAcceptedByAi przejdzie.)
let r = evaluateProposal(prop('handel', 0, 1, {
  giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 5 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 1 }],
  resourceTradeMode: 'per_turn',
  turns: 12,
}), ctx());
ok(r.accepted, 'handel surowiec_ilosc per_turn: zaakceptowany (gracz proponuje)');
ok(!r.oneShotTrade, 'handel per_turn: NIE oneShotTrade (to deal cykliczny, nie jednorazowy)');
// HANDEL-SPLIT-Q1=B (2026-07-29): buildHandelSurowiecCykliczny buduje deal z
// RodzajTraktatu.UmowaWymiany = 'umowa_wymiany' (koszyk surowcow cykliczny), NIE
// z legacy 'umowa_handlowa' (teraz tylko traktat szlakow bez koszyka). Rename
// zamierzony, potwierdzony w docs/decyzje/HANDEL-SPLIT-Q1.md.
ok(r.deal?.rodzaj === 'umowa_wymiany', 'handel per_turn: deal.rodzaj=umowa_wymiany');
ok(r.deal?.wygasaTura === 22, 'handel per_turn: wygasaTura = turn(10)+turns(12) = 22');
ok(r.deal?.handelSurowiecCykliczny?.length === 1, 'handel per_turn: 1 wpis handelSurowiecCykliczny');
ok(r.deal?.handelSurowiecCykliczny?.[0]?.surowiecKey === 'drewno', 'handel per_turn: surowiecKey=drewno');
ok(r.deal?.handelSurowiecCykliczny?.[0]?.pakietyPerTura === 5, 'handel per_turn: 5 pakietow/ture');
ok(r.deal?.handelSurowiecCykliczny?.[0]?.sellerOwnerId === 0
  && r.deal?.handelSurowiecCykliczny?.[0]?.buyerOwnerId === 1, 'handel per_turn: sprzedawca=0 (gracz), kupujacy=1 (AI)');
ok(r.deal?.handelPayload === undefined, 'handel per_turn: BRAK handelPayload (nie duplikuje jednorazowego transferu)');

// -- 2b. ownerId-agnostyczne: AI (owner=3) proponuje graczowi (owner=0) — ten sam kod --
// R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): ilosc musi być wielokrotnością kroku handlu
// (5 szt. dla drewno) — 4 szt. floruje do 0 PN (diplomacyPnSurowiecIlosc), co unieważniało
// tę ofertę jako niewycenialną. 5 szt. jest najmniejszą poprawną ilością.
r = evaluateProposal(prop('handel', 3, 0, {
  giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 5 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 1 }],
  resourceTradeMode: 'per_turn',
  turns: 8,
}), ctx());
ok(r.accepted && r.deal?.handelSurowiecCykliczny?.[0]?.sellerOwnerId === 3
  && r.deal?.handelSurowiecCykliczny?.[0]?.buyerOwnerId === 0,
  'handel per_turn: AI(3)->gracz(0) dziala identycznie (ownerId-agnostyczne)');

// -- 2c. AI odrzuca ofertę gracza poniżej fair (rule (a): AI ocenia i moze odrzucic) --
// NAPRAWA P-DYPLO-PW-BRAK-KROKU-5-EDYCJA-PROPOZYCJI (2026-08-13): PN surowca ilościowego
// liczy się BLOKAMI (krok 5), nie sztukami wprost — 5 szt. drewna to dziś 1 blok = 1 PN,
// więc żądanie 5 szt. za 1 zloto (1 PN) było już z grubsza fair (1:1), nie „poniżej fair".
// 50 szt. drewna (10 bloków = 10 PN) za 1 zloto (1 PN) zachowuje oryginalny, wyraźnie
// niesprawiedliwy stosunek 1:5 co przed naprawą (5 szt. × stara wadliwa cena 1 PN/szt.).
r = evaluateProposal(prop('handel', 0, 1, {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 1 }],
  receiveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 50 }],
  resourceTradeMode: 'per_turn',
  turns: 10,
}), ctx());
ok(!r.accepted, 'handel per_turn: AI odrzuca oferte ponizej fair (gracz chce za mało dać)');

// -- 3. resolvePlayerAcceptsAiPending: AI proponuje 'zaproponuj_handel_surowiec' -> gracz akceptuje --
const aiCmd = {
  type: 'zaproponuj_handel_surowiec',
  targetId: '0',
  powod: 'test',
  surowiecKey: 'drewno',
  label: 'Drewno',
  pakietyPerTura: 3,
  zaplataTyp: 'zloto',
  zaplataPerTura: 15,
  turns: 10,
};
const pending = aiCommandToPendingProposal(aiCmd, 2, 0, 10);
ok(pending !== null && pending.actionId === 'handel', 'aiCommandToPendingProposal: zaproponuj_handel_surowiec -> actionId=handel');
ok(pending?.payload?.resourceTradeMode === 'per_turn', 'pending payload: resourceTradeMode=per_turn');
ok(pending?.payload?.giveItems?.[0]?.typ === 'surowiec_ilosc' && pending.payload.giveItems[0].ilosc === 3,
  'pending payload: giveItems surowiec_ilosc x3');
ok(pending?.payload?.receiveItems?.[0]?.typ === 'zloto' && pending.payload.receiveItems[0].ilosc === 15,
  'pending payload: receiveItems zloto 15');

const acceptResult = resolvePlayerAcceptsAiPending(pending, 10);
ok(acceptResult.accepted && !acceptResult.oneShotTrade, 'resolvePlayerAcceptsAiPending: zaakceptowana, NIE oneShot (regresja bugu #1)');
ok(acceptResult.deal?.handelSurowiecCykliczny?.length === 1, 'resolvePlayerAcceptsAiPending: deal ma handelSurowiecCykliczny');
ok(acceptResult.deal?.handelSurowiecCykliczny?.[0]?.sellerOwnerId === 2
  && acceptResult.deal?.handelSurowiecCykliczny?.[0]?.buyerOwnerId === 0,
  'resolvePlayerAcceptsAiPending: sprzedawca=AI(2), kupujacy=gracz(0)');
ok(acceptResult.deal?.wygasaTura === 20, 'resolvePlayerAcceptsAiPending: wygasaTura = 10+10=20');

// -- 3b. AI proponuje 0 pakietów -> brak propozycji (guard) --
ok(aiCommandToPendingProposal({ ...aiCmd, pakietyPerTura: 0 }, 2, 0, 10) === null,
  'aiCommandToPendingProposal: pakietyPerTura=0 -> null');

// -- 4. decideAIDiplomacy priorytet 5c: AI proponuje handel surowcem wg nadwyzki --
function diploInpBase(over = {}) {
  return {
    myPlayerId: '7',
    relacje: [{
      partnerId: '0',
      relation: rel(70, 60),
      respektWzgledny: 0.5,
      stanWojny: false,
      hasHandelTreaty: true, // zablokuj priorytet 5b, testujemy tylko 5c
      hasTradeConnection: true,
      resourceTradeOffer: {
        surowiecKey: 'drewno',
        label: 'Drewno',
        pakietyPerTura: 3,
        zaplataTyp: 'zloto',
        zaplataPerTura: 15,
        turns: AI_RESOURCE_TRADE_DEFAULT_TURNS,
      },
      hasActiveResourceTradeDeal: false,
      ...over,
    }],
    agresja: 0.3,
    handlowosc: 0.7,
    currentTurn: 10,
  };
}
let cmds = decideAIDiplomacy(diploInpBase());
let cmdRes = cmds.find(c => c.type === 'zaproponuj_handel_surowiec');
ok(!!cmdRes, `decideAIDiplomacy: 5c zaproponuj_handel_surowiec przy nadwyzce; got: ${JSON.stringify(cmds.map(c => c.type))}`);
ok(cmdRes && cmdRes.surowiecKey === 'drewno' && cmdRes.pakietyPerTura === 3, '5c: surowiecKey/pakietyPerTura z oferty');
ok(cmdRes && cmdRes.zaplataTyp === 'zloto' && cmdRes.zaplataPerTura === 15, '5c: zaplata z oferty');

// -- 4b. brak resourceTradeOffer -> AI NIE proponuje (bezpieczny brak) --
cmds = decideAIDiplomacy(diploInpBase({ resourceTradeOffer: undefined }));
ok(!cmds.some(c => c.type === 'zaproponuj_handel_surowiec'), '5c: brak resourceTradeOffer -> brak propozycji');

// -- 4c. juz aktywny deal surowcowy z ta para -> AI NIE proponuje kolejnego --
cmds = decideAIDiplomacy(diploInpBase({ hasActiveResourceTradeDeal: true }));
ok(!cmds.some(c => c.type === 'zaproponuj_handel_surowiec'), '5c: hasActiveResourceTradeDeal=true -> brak propozycji');

// -- 4d. cooldown blokuje kolejna propozycje tej samej parze --
ok(!canAiProposeResourceTrade(12, 10), 'canAiProposeResourceTrade: cooldown blokuje (10->12, cooldown 8)');
ok(canAiProposeResourceTrade(20, 10), 'canAiProposeResourceTrade: cooldown minal (10->20)');
cmds = decideAIDiplomacy(diploInpBase({ lastResourceTradeProposalTurn: 8 }));
ok(!cmds.some(c => c.type === 'zaproponuj_handel_surowiec'), '5c: cooldown (ostatnia propozycja t.8, teraz t.10) blokuje');

// -- 4e. wojna blokuje propozycje --
cmds = decideAIDiplomacy(diploInpBase({ stanWojny: true }));
ok(!cmds.some(c => c.type === 'zaproponuj_handel_surowiec'), '5c: w trakcie wojny -> brak propozycji');

// -- 4g. deficyt surowca -> AI proponuje ZAKUP (kierunek zakup) --
const inp5g = diploInpBase({
  resourceTradeOffer: {
    surowiecKey: 'glina',
    label: 'Glina',
    pakietyPerTura: 2,
    zaplataTyp: 'zloto',
    zaplataPerTura: 20,
    turns: AI_RESOURCE_TRADE_DEFAULT_TURNS,
    kierunek: 'zakup',
    powod: 'deficyt',
  },
});
inp5g.skarbiecGold = 100;
cmds = decideAIDiplomacy(inp5g);
cmdRes = cmds.find(c => c.type === 'zaproponuj_handel_surowiec');
ok(!!cmdRes, '5g: deficyt -> zaproponuj_handel_surowiec');
ok(cmdRes && cmdRes.kierunek === 'zakup' && cmdRes.surowiecKey === 'glina',
  '5g: kierunek zakup + glina');
ok(cmdRes && (cmdRes.powodHandlu === 'deficyt' || String(cmdRes.powod).includes('deficyt')),
  '5g: powod deficyt');

// -- 4f. AI<->AI: decideAIDiplomacy nie rozroznia typu partnera (ownerId-agnostyczne z zalozenia) --
cmds = decideAIDiplomacy({
  myPlayerId: '3',
  relacje: [{
    partnerId: '9', // inne AI, nie gracz
    relation: rel(70, 60),
    respektWzgledny: 0.5,
    stanWojny: false,
    hasHandelTreaty: true,
    hasTradeConnection: true,
    resourceTradeOffer: {
      surowiecKey: 'kamien', label: 'Kamień', pakietyPerTura: 2,
      zaplataTyp: 'praca', zaplataPerTura: 8, turns: 10,
    },
    hasActiveResourceTradeDeal: false,
  }],
  agresja: 0.3,
  handlowosc: 0.7,
  currentTurn: 5,
});
cmdRes = cmds.find(c => c.type === 'zaproponuj_handel_surowiec');
ok(!!cmdRes && cmdRes.targetId === '9' && cmdRes.zaplataTyp === 'praca',
  'decideAIDiplomacy: AI<->AI (partnerId != gracz) dziala identycznie + zaplata w Pracy');

// -- 5. Transfer surowca reużywa transferSurowiecIlosc (pakiety -> sztuki, spójność z main.ts) --
const pakiet = diplomacyHandelSurowcePakietWielkosc();
ok(pakiet > 0, 'diplomacyHandelSurowcePakietWielkosc > 0');
const cities = [
  { id: 'c1', ownerId: 5, surowce: { drewno: pakiet * 10 } },
  { id: 'c2', ownerId: 8, surowce: {} },
];
const tr = transferSurowiecIlosc('drewno', pakiet * 3, 5, 8, null, cities);
ok(tr.moved === pakiet * 3, 'transferSurowiecIlosc: przenosi pakietyPerTura*pakiet sztuk');
ok(tr.cities.find(c => c.id === 'c2').surowce.drewno === pakiet * 3, 'transferSurowiecIlosc: biorca dostaje sztuki');
ok(tr.cities.find(c => c.id === 'c1').surowce.drewno === pakiet * 7, 'transferSurowiecIlosc: dawca traci sztuki');

console.log(`\ndiplomacy-resource-cyclic-trade-test: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
