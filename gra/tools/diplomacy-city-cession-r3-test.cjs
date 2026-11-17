'use strict';
/**
 * R-WEB-PEACE-CITY-CESSION-Q1 r3 — N1 (AI oddaje / AI żąda miasta w pokoju) i bramka wyceny pozycji
 * 'miasto' w evaluateProposal. Progi testowane jako N-1 / N / N+1.
 * Uruchom z gra/: node tools/diplomacy-city-cession-r3-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-city-cession-r3-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-city-cession-r3-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  decideAIDiplomacy,
  aiMiastoPrzekazRwProg,
  aiPlanMiastaDoOddania,
  aiPickMiastoDoZadania,
  aiMiastoWagaOddawanego,
  AI_MIASTO_ZADANIE_RW,
  AI_MIASTO_ZADANIE_TURY_WOJNY,
} from '../src/game/ai.ts';
export {
  aiCommandToPendingProposal,
  formatAiDiplomacyPlayerMessage,
  treatyBasePnFromConfig,
  evaluateProposal,
} from '../src/game/diplomacy-proposals.ts';
export { diplomacySumPn } from '../src/game/diplomacy-value-catalog.ts';
export { wearinessPeaceCashPn } from '../src/game/war-weariness.ts';
export * as AIM from '../src/game/ai.ts';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  absWorkingDir: path.resolve(__dirname, '..'),
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0;
let fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('FAIL:', m); } }
function eq(a, b, m) { ok(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
// R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1 (DR-2): JEDNA cena pokoju = wearinessPeaceCashPn(L) = 6000 x (1 - L); stala 615 i prog
// min. 3 miast AI USUNIETE. Domyslna wojna w tescie: 20 tur bez strat => L = 0,5 => cena 3000 PN.
const CENA20 = M.wearinessPeaceCashPn(0.5);
const N3 = Math.ceil(CENA20 / 1.5); // eks=3 (waga 1.5): miasto o cityPn N3 samo pokrywa cene
const N5 = Math.ceil(CENA20 / 1.8); // eks=5 (waga 1.8)

// --- Stałe i progi ---
eq(CENA20, 3000, 'cena pokoju przy zmeczeniu 50% = 3000');
ok(M.AIM.AI_MIASTO_CENA_POKOJU_PN === undefined && M.AIM.AI_MIASTO_PRZEKAZ_MIN_MIAST === undefined, 'stala 615 i prog min. 3 miast AI usuniete z ai.ts');
eq(M.AI_MIASTO_ZADANIE_RW, 0.7, 'próg rw żądania = 0.7');
eq(M.AI_MIASTO_ZADANIE_TURY_WOJNY, 20, 'tury wojny żądania = 20');
eq(M.aiMiastoPrzekazRwProg(5), 0.15, 'próg oddania agr=5 → 0.15');
eq(M.aiMiastoPrzekazRwProg(10), 0.10, 'próg oddania agr=10 → 0.10');
eq(M.aiMiastoPrzekazRwProg(1), 0.19, 'próg oddania agr=1 → 0.19');
eq(M.aiMiastoPrzekazRwProg(undefined), 0.15, 'brak agresywności → agr 5');
eq(M.aiMiastoWagaOddawanego(3), 1.5, 'waga oddawanego eks=3 → 1.5');
eq(M.aiMiastoWagaOddawanego(5), 1.8, 'waga oddawanego eks=5 → 1.8');

// --- aiPlanMiastaDoOddania: minimum miast rownowazace cene, stolica nigdy, cena 0 => pokoj bez miast ---
const c3 = (pn, id = 'a') => [{ cityId: id, cityPn: pn, zakazane: false }, { cityId: 'b', cityPn: 100, zakazane: false }, { cityId: 'c', cityPn: 100, zakazane: false }];
const planOf = (miasta, eks, cena) => M.aiPlanMiastaDoOddania(miasta, eks, cena);
eq(planOf([{ cityId: 'a', cityPn: 400, zakazane: false }, { cityId: 'b', cityPn: 400, zakazane: false }], 3, CENA20).full, false, 'AI z 2 miastami o niskiej wartosci: brak pelnego pokrycia (wojna trwa)');
eq(planOf(c3(N3), 3, CENA20).miasta.map(m => m.cityId).join(), 'a', 'eks=3: miasto N3*1.5 >= cena: JEDNO miasto (minimum)');
ok(planOf(c3(N3), 3, CENA20).full, 'eks=3: plan pokrywa cene');
eq(planOf(c3(N3 - 1), 3, CENA20).miasta.length, 2, 'eks=3: (N3-1)*1.5 < cena => potrzebne DWA miasta (N-1: minimum rosnie)');
ok(planOf(c3(N3 - 1), 3, CENA20).full, 'eks=3: dwa miasta pokrywaja cene');
eq(planOf([{ cityId: 'a', cityPn: N3 - 1, zakazane: false }], 3, CENA20).full, false, 'eks=3: jedno miasto (N3-1)*1.5 < cena => brak pelnego pokrycia');
eq(planOf(c3(N5), 5, CENA20).miasta.map(m => m.cityId).join(), 'a', 'eks=5: N5*1.8 >= cena => jedno miasto (N)');
eq(planOf(c3(N5 + 1), 5, CENA20).miasta.length, 1, 'eks=5: N5+1 => jedno miasto (N+1)');
eq(planOf([{ cityId: 'a', cityPn: N5 - 1, zakazane: false }], 5, CENA20).full, false, 'eks=5: jedno miasto (N5-1)*1.8 < cena => brak pelnego pokrycia (N-1)');
// Stolica (zakazane) nigdy; wybor najtanszego niezakazanego pokrywajacego cene.
const zakazPlan = planOf([
  { cityId: 'cap', cityPn: 3400, zakazane: true },
  { cityId: 'x', cityPn: 2450, zakazane: false },
  { cityId: 'y', cityPn: 2030, zakazane: false },
  { cityId: 'z', cityPn: 2900, zakazane: false },
], 3, CENA20);
eq(zakazPlan.miasta.map(m => m.cityId).join(), 'y', 'najtansze niezakazane pokrywajace cene (stolica pominieta)');
eq(planOf([
  { cityId: 'cap', cityPn: 9000, zakazane: true },
  { cityId: 'x', cityPn: 9000, zakazane: true },
  { cityId: 'y', cityPn: 9000, zakazane: false },
], 3, CENA20).miasta.map(m => m.cityId).join(), 'y', 'tylko jedno niezakazane => wybrane');
const wszystkieZakaz = planOf([{ cityId: 'cap', cityPn: 9000, zakazane: true }, { cityId: 'x', cityPn: 9000, zakazane: true }], 3, CENA20);
ok(wszystkieZakaz.miasta.length === 0 && wszystkieZakaz.full === false, 'wszystkie zakazane (tylko stolica) i cena > 0 => brak planu, wojna trwa');
const cena0 = planOf(c3(500), 3, 0);
ok(cena0.miasta.length === 0 && cena0.full === true, 'cena 0 => pokoj bez miast (plan pusty i pelny)');

// --- aiPickMiastoDoZadania: cena = parametr (strona przyjmujaca waga 1); cena 0 => nie zada ---
const gracz = (pn) => [{ cityId: 'g', cityPn: pn, zakazane: false }];
eq(M.aiPickMiastoDoZadania(gracz(CENA20 - 1), CENA20), null, 'miasto gracza cena-1 => brak (N-1)');
eq(M.aiPickMiastoDoZadania(gracz(CENA20), CENA20)?.cityId, 'g', 'miasto gracza = cena => zadane (N)');
eq(M.aiPickMiastoDoZadania(gracz(CENA20 + 1), CENA20)?.cityId, 'g', 'miasto gracza cena+1 => zadane (N+1)');
eq(M.aiPickMiastoDoZadania([{ cityId: 'k', cityPn: 9999, zakazane: true }], CENA20), null, 'stolica gracza nie jest zadana');
eq(M.aiPickMiastoDoZadania(gracz(9999), 0), null, 'cena 0 => AI nie zada miasta');

// --- decideAIDiplomacy: oddanie i żądanie w wojnie ---
// r4: domyślne 10 tur wojny = powyżej minTurWojny (≤ 8, R5a) — bramka czasu nie gasi testów progów.
// R-TEST-DEBT-BASE-RED-MAIN-Q2 (klasa A): oddanie miasta (N1a) i żądanie (N1b) bramkuje POZYCJA SIŁY MILITARNEJ
// (peacePosMil: 'slabsza' = AI oddaje; brak danych = 'pasmo' = brak oddania), a rw nie bramkuje (ai.ts ~7070, ~7107).
// R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1: skala 40 tur (2,5%/turę). Zmęczenie ≥0,8 (tura 32) NIE
// kończy już wojny bezwarunkowo — AI tylko proponuje pokój z miastami (ai.ts, war-weariness.ts).
const SIŁA = {
  slabsza:    { ai: { sila: 100, armiaPkt: 100 }, partner: { sila: 1000, armiaPkt: 1000 } },
  silniejsza: { ai: { sila: 1000, armiaPkt: 1000 }, partner: { sila: 100, armiaPkt: 100 } },
};
function runAI({ rw, agr = 5, eks = 3, miastaAI = [], miastaPartnera = [], turnsAtWar = 20, zdobyte = 0, war = true, pozycja = 'pasmo' }) {
  const sil = SIŁA[pozycja];
  const rel = {
    ...(sil ? { silaMilitarnaAI: sil.ai, silaMilitarnaPartner: sil.partner } : {}),
    partnerId: '0',
    relation: { zaufanie: 5, respekt: 5, status: war ? 'wojna' : 'pokoj' },
    respektWzgledny: rw,
    stanWojny: war,
    peaceLocked: false,
    hasNapTreaty: false,
    partnerTypCywilizacji: 'rzymianie',
    turnsAtWar: war ? turnsAtWar : 0,
    zdobyteMiastaPartnera: zdobyte,
    miastaPartnera,
  };
  return M.decideAIDiplomacy({
    myPlayerId: '1',
    relacje: [rel],
    agresja: 0.5,
    agresywnoscRaw: agr,
    ekspansywnosc: eks,
    miastaAI,
    myTypCywilizacji: 'grecy',
    currentTurn: 60,
    skarbiecGold: 0,
    sklonnoscDoPodboju: 2,
  });
}
const cession = (cmds) => cmds.find(c => c.type === 'oferuj_miasto_za_pokoj');
const demand = (cmds) => cmds.find(c => c.type === 'zada_miasto_za_pokoj');
const CITIES_OK = [{ cityId: 'a', cityPn: N3, zakazane: false }, { cityId: 'b', cityPn: 900, zakazane: false }, { cityId: 'c', cityPn: 900, zakazane: false }];

// Oddanie (N1a): bramka = słabsza militarnie; rw i agresywność NIE bramkują (klasa A, patrz komentarz runAI).
const SL = 'slabsza';
ok(cession(runAI({ rw: 0.14, pozycja: SL, miastaAI: CITIES_OK })) !== undefined, 'oddanie: słabsza militarnie, rw 0.14 → oddaje (rw nie bramkuje)');
ok(cession(runAI({ rw: 0.90, pozycja: SL, miastaAI: CITIES_OK })) !== undefined, 'oddanie: słabsza militarnie, rw 0.90 → oddaje');
ok(cession(runAI({ rw: 0.10, pozycja: 'silniejsza', miastaAI: CITIES_OK })) === undefined, 'oddanie: silniejsza militarnie → NIE oddaje');
ok(cession(runAI({ rw: 0.10, pozycja: 'pasmo', miastaAI: CITIES_OK })) === undefined, 'oddanie: brak danych siły (pasmo) → NIE oddaje');
ok(cession(runAI({ rw: 0.10, agr: 10, pozycja: SL, miastaAI: CITIES_OK })) !== undefined, 'oddanie: agr=10 nie zmienia bramki (słabsza) → oddaje');
ok(cession(runAI({ rw: 0.10, agr: 1, pozycja: SL, miastaAI: CITIES_OK })) !== undefined, 'oddanie: agr=1 nie zmienia bramki (słabsza) → oddaje');
// Bez progu min. liczby miast (R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1): liczy sie pelne pokrycie ceny 3000 PN (20 tur wojny).
ok(cession(runAI({ rw: 0.10, pozycja: SL, miastaAI: CITIES_OK.slice(0, 2) })) !== undefined, 'oddanie: 2 miasta, jedno pokrywa cene => oddaje (brak progu 3 miast)');
ok(cession(runAI({ rw: 0.10, pozycja: SL, miastaAI: CITIES_OK.slice(0, 1) })) !== undefined, 'oddanie: 1 miasto pokrywajace cene => oddaje (brak progu 3 miast)');
ok(cession(runAI({ rw: 0.10, pozycja: SL, miastaAI: [{ cityId: 'a', cityPn: 400, zakazane: false }] })) === undefined, 'oddanie: 1 miasto za male na cene => NIE (wojna trwa)');
ok(cession(runAI({ rw: 0.10, pozycja: SL, miastaAI: CITIES_OK })) !== undefined, 'oddanie: 3 miasta => oddaje');
ok(cession(runAI({ rw: 0.10, pozycja: SL, miastaAI: [{ cityId: 'cap', cityPn: 99999, zakazane: true }] })) === undefined, 'oddanie: tylko stolica => NIE (stolica nigdy)');
ok(cession(runAI({ rw: 0.10, pozycja: SL, turnsAtWar: 40, miastaAI: CITIES_OK })) === undefined, 'oddanie: 40 tur (cena 0) => brak oferty miasta (pokoj bez miast zapada w tiku wymuszonym)');
// Pokój nie w wojnie → brak oddania
ok(cession(runAI({ rw: 0.10, pozycja: SL, miastaAI: CITIES_OK, war: false })) === undefined, 'poza wojną → brak oddania');
// Cena pokrycia: cena w wadze
ok(cession(runAI({ rw: 0.10, pozycja: SL, miastaAI: [{ cityId: 'a', cityPn: N3 - 1, zakazane: false }] })) === undefined, 'oddanie: jedyne miasto N3-1 (< cena PW) → NIE');
ok(cession(runAI({ rw: 0.10, pozycja: SL, miastaAI: c3(N3) })) !== undefined, 'oddanie: miasto N3 (>= C PW) → oddaje');
// Zawartość komendy
const cmdOddaj = cession(runAI({ rw: 0.10, eks: 5, pozycja: SL, miastaAI: c3(N5) }));
eq(cmdOddaj?.cityId, 'a', 'komenda oddania: cityId');
eq(cmdOddaj?.cityPn, N5, 'komenda oddania: cityPn');
eq(cmdOddaj?.cityWeight, 1.8, 'komenda oddania: cityWeight z ekspansywności (eks=5)');
eq(cmdOddaj?.targetId, '0', 'komenda oddania: targetId = gracz');

// Żądanie (N1b): rw >= 0.7 AND (tury wojny >= 20 LUB zdobyte miasto gracza > 0) i miasto gracza >= C.
// Skala 40 tur: żądanie testujemy przy 10 turach + 1 zdobytym mieście (zmęczenie 0,25 + 0,1 = 0,35 < 0,8, progi rw/C bez zmian).
const GRACZ_OK = [{ cityId: 'g1', cityPn: 5000, zakazane: false }, { cityId: 'k', cityPn: 9999, zakazane: true }];
const DEM = { turnsAtWar: 10, zdobyte: 1 };
// Cena zadania = ta sama jedna cena: 10 tur + 1 zdobyte miasto => L = 0,25 + 0,1 = 0,35 => 3900 PN.
const C = M.wearinessPeaceCashPn(0.35);
eq(C, 3900, 'cena zadania przy L=0,35 = 3900');
ok(demand(runAI({ ...DEM, rw: 0.69, miastaPartnera: GRACZ_OK })) === undefined, 'żądanie: rw 0.69 (N-1) → NIE');
ok(demand(runAI({ ...DEM, rw: 0.70, miastaPartnera: GRACZ_OK })) !== undefined, 'żądanie: rw 0.70 (N) → żąda');
ok(demand(runAI({ ...DEM, rw: 0.71, miastaPartnera: GRACZ_OK })) !== undefined, 'żądanie: rw 0.71 (N+1) → żąda');
ok(demand(runAI({ rw: 0.80, turnsAtWar: 15, zdobyte: 0, miastaPartnera: GRACZ_OK })) === undefined, 'żądanie: tury 15, brak zdobyczy → NIE (poniżej 20)');
// Warunek „tury >= 20” jest żywy na skali 40 tur (20 tur = 0,5 < 0,8, bez bezwarunkowego końca) → żąda.
ok(demand(runAI({ rw: 0.80, turnsAtWar: 20, zdobyte: 0, miastaPartnera: GRACZ_OK })) !== undefined, 'żądanie: tury 20 (zmęczenie 0,5) bez zdobyczy → żąda (warunek 20 tur, skala 40)');
ok(demand(runAI({ rw: 0.80, turnsAtWar: 10, zdobyte: 1, miastaPartnera: GRACZ_OK })) !== undefined, 'żądanie: zdobyte miasto gracza (1), 10 tur → żąda');
// r4 (zarzut 4 Evaluatora): bramka czasu wojny R5a obowiązuje także żądanie i oddanie miasta.
ok(demand(runAI({ rw: 0.80, turnsAtWar: 0, zdobyte: 1, miastaPartnera: GRACZ_OK })) === undefined, 'żądanie r4: zdobyte miasto, 0 tur wojny → NIE (R5a)');
ok(cession(runAI({ rw: 0.10, turnsAtWar: 0, pozycja: SL, miastaAI: CITIES_OK })) === undefined, 'oddanie r4: 0 tur wojny → NIE (R5a)');
ok(demand(runAI({ rw: 0.80, turnsAtWar: 0, zdobyte: 0, miastaPartnera: GRACZ_OK })) === undefined, 'żądanie: 0 tur i 0 zdobyczy → NIE');
ok(demand(runAI({ ...DEM, rw: 0.80, miastaPartnera: [{ cityId: 'g1', cityPn: C - 1, zakazane: false }] })) === undefined, 'żądanie: miasto gracza C-1 → NIE (N-1)');
ok(demand(runAI({ ...DEM, rw: 0.80, miastaPartnera: [{ cityId: 'g1', cityPn: C, zakazane: false }] })) !== undefined, 'żądanie: miasto gracza C → żąda (N)');
ok(demand(runAI({ ...DEM, rw: 0.80, miastaPartnera: [{ cityId: 'g1', cityPn: C + 1, zakazane: false }] })) !== undefined, 'żądanie: miasto gracza C+1 → żąda (N+1)');
ok(demand(runAI({ ...DEM, rw: 0.80, miastaPartnera: [{ cityId: 'k', cityPn: 9999, zakazane: true }] })) === undefined, 'żądanie: tylko stolica gracza → NIE');
eq(demand(runAI({ ...DEM, rw: 0.80, miastaPartnera: GRACZ_OK }))?.cityId, 'g1', 'komenda żądania: cityId miasta gracza');
ok(demand(runAI({ ...DEM, rw: 0.80, miastaPartnera: GRACZ_OK, war: false })) === undefined, 'żądanie poza wojną → NIE');

// --- Mapowanie komend na propozycje (N1 → stół negocjacyjny) ---
const pOff = M.aiCommandToPendingProposal({ type: 'oferuj_miasto_za_pokoj', targetId: '0', powod: 'x', cityId: 'a', cityPn: 400, cityWeight: 1.5 }, 1, 0, 60);
eq(pOff?.actionId, 'pokoj', 'propozycja oddania: actionId pokoj');
eq(pOff?.payload?.giveItems?.[0]?.typ, 'miasto', 'propozycja oddania: giveItems[0].typ = miasto');
eq(pOff?.payload?.giveItems?.[0]?.cityPn, 400, 'propozycja oddania: cityPn w pozycji');
eq(pOff?.payload?.giveItems?.[0]?.cityWeight, 1.5, 'propozycja oddania: cityWeight w pozycji');
const pDem = M.aiCommandToPendingProposal({ type: 'zada_miasto_za_pokoj', targetId: '0', powod: 'x', cityId: 'g1', cityPn: 600 }, 1, 0, 60);
eq(pDem?.actionId, 'pokoj', 'propozycja żądania: actionId pokoj');
eq(pDem?.payload?.receiveItems?.[0]?.id, 'g1', 'propozycja żądania: receiveItems[0].id = miasto gracza');
ok(!pDem?.payload?.giveItems, 'propozycja żądania: AI nic nie daje (brak giveItems)');
ok(M.formatAiDiplomacyPlayerMessage({ type: 'oferuj_miasto_za_pokoj', targetId: '0', powod: '', cityId: 'a', cityPn: 1, cityWeight: 1 }).includes('miast'), 'tekst dla gracza: oddanie miasta');
ok(M.formatAiDiplomacyPlayerMessage({ type: 'zada_miasto_za_pokoj', targetId: '0', powod: '', cityId: 'a', cityPn: 1 }).includes('miast'), 'tekst dla gracza: żądanie miasta');

// --- Wycena pozycji 'miasto' w sumie PN: tylko akcja pokoj/wasal ---
const MI = [{ typ: 'miasto', id: 'a', cityPn: 500 }];
eq(M.diplomacySumPn(MI, { actionId: 'pokoj', side: 'give' }), 750, 'suma miasta (give, pokoj) = 500*1.5');
eq(M.diplomacySumPn(MI, { actionId: 'pokoj', side: 'receive' }), 500, 'suma miasta (receive, pokoj) = 500*1');
eq(M.diplomacySumPn(MI, { actionId: 'wasal', side: 'give' }), 750, 'suma miasta (give, wasal) = 750');
eq(M.diplomacySumPn(MI, { actionId: 'handel', side: 'give' }), null, 'miasto w handlu → null (fail-safe)');
eq(M.diplomacySumPn(MI, { side: 'give' }), null, 'miasto bez actionId → null');

// --- evaluateProposal: pozycja miasta w pokoju wchodzi do bilansu (defekt r2: pnOpts bez actionId) ---
const relWar = { zaufanie: 5, respekt: 5, status: 'wojna' };
const ctxWar = { relation: relWar, stanWojny: true, difficulty: 'normal', warState: undefined };
function evalPokoj(giveItems) {
  return M.evaluateProposal({
    actionId: 'pokoj',
    proposerOwnerId: 1,
    responderOwnerId: 0,
    payload: { giveItems },
  }, ctxWar);
}
const bezMiasta = evalPokoj([]);
const zMiastem = evalPokoj([{ typ: 'miasto', id: 'a', ilosc: 1, cityPn: 900, cityWeight: 1.5 }]);
ok(zMiastem.pwBalance !== bezMiasta.pwBalance, 'evaluateProposal pokoj: pozycja miasta zmienia pwBalance');
ok(typeof zMiastem.pwBalance === 'number' && zMiastem.pwBalance > bezMiasta.pwBalance, 'evaluateProposal pokoj: miasto (1350 PW) po stronie AI poprawia bilans gracza');

console.log(`diplomacy-city-cession-r3-test: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
