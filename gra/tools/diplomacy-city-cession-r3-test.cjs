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
  aiPickMiastoDoOddania,
  aiPickMiastoDoZadania,
  aiMiastoWagaOddawanego,
  AI_MIASTO_CENA_POKOJU_PN,
  AI_MIASTO_PRZEKAZ_MIN_MIAST,
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

// --- Stałe i progi ---
eq(M.AI_MIASTO_CENA_POKOJU_PN, M.treatyBasePnFromConfig('pokoj'), 'cena pokoju = traktaty.pokoj.punkty');
eq(M.AI_MIASTO_PRZEKAZ_MIN_MIAST, 3, 'min miast AI = 3');
eq(M.AI_MIASTO_ZADANIE_RW, 0.7, 'próg rw żądania = 0.7');
eq(M.AI_MIASTO_ZADANIE_TURY_WOJNY, 20, 'tury wojny żądania = 20');
eq(M.aiMiastoPrzekazRwProg(5), 0.15, 'próg oddania agr=5 → 0.15');
eq(M.aiMiastoPrzekazRwProg(10), 0.10, 'próg oddania agr=10 → 0.10');
eq(M.aiMiastoPrzekazRwProg(1), 0.19, 'próg oddania agr=1 → 0.19');
eq(M.aiMiastoPrzekazRwProg(undefined), 0.15, 'brak agresywności → agr 5');
eq(M.aiMiastoWagaOddawanego(3), 1.5, 'waga oddawanego eks=3 → 1.5');
eq(M.aiMiastoWagaOddawanego(5), 1.8, 'waga oddawanego eks=5 → 1.8');

// --- aiPickMiastoDoOddania: ≥3 miasta, zakazy, cena pokrywająca (N-1/N/N+1) ---
// Pozostałe dwa miasta są TANIE (100 PW < cena pokoju po wadze), żeby test ceny dotyczył wyłącznie miasta 'a'.
const c3 = (pn, id = 'a') => [{ cityId: id, cityPn: pn, zakazane: false }, { cityId: 'b', cityPn: 100, zakazane: false }, { cityId: 'c', cityPn: 100, zakazane: false }];
eq(M.aiPickMiastoDoOddania([{ cityId: 'a', cityPn: 400, zakazane: false }, { cityId: 'b', cityPn: 400, zakazane: false }], 3), null, 'AI z 2 miastami nie oddaje (N-1)');
eq(M.aiPickMiastoDoOddania(c3(400), 3)?.cityId, 'a', 'AI z 3 miastami oddaje (N)');
eq(M.aiPickMiastoDoOddania(c3(333), 3), null, 'eks=3: 333*1.5=499.5 < 500 → brak (N-1)');
eq(M.aiPickMiastoDoOddania(c3(334), 3)?.cityId, 'a', 'eks=3: 334*1.5=501 ≥ 500 → oddaje (N)');
eq(M.aiPickMiastoDoOddania(c3(335), 3)?.cityId, 'a', 'eks=3: 335 → oddaje (N+1)');
eq(M.aiPickMiastoDoOddania(c3(277), 5), null, 'eks=5: 277*1.8=498.6 < 500 → brak (N-1)');
eq(M.aiPickMiastoDoOddania(c3(278), 5)?.cityId, 'a', 'eks=5: 278*1.8=500.4 → oddaje (N)');
eq(M.aiPickMiastoDoOddania(c3(279), 5)?.cityId, 'a', 'eks=5: 279 → oddaje (N+1)');
// Zakazy: stolica (tańsza, kwalifikuje się cenowo) pominięta; wybór najtańszego niezakazanego.
const zakazWybor = M.aiPickMiastoDoOddania([
  { cityId: 'cap', cityPn: 340, zakazane: true },
  { cityId: 'x', cityPn: 400, zakazane: false },
  { cityId: 'y', cityPn: 350, zakazane: false },
  { cityId: 'z', cityPn: 900, zakazane: false },
], 3);
eq(zakazWybor?.cityId, 'y', 'najtańsze niezakazane pokrywające cenę (stolica pominięta)');
eq(M.aiPickMiastoDoOddania([
  { cityId: 'cap', cityPn: 900, zakazane: true },
  { cityId: 'x', cityPn: 900, zakazane: true },
  { cityId: 'y', cityPn: 900, zakazane: false },
], 3)?.cityId, 'y', 'tylko jedno niezakazane → wybrane');
eq(M.aiPickMiastoDoOddania([
  { cityId: 'cap', cityPn: 900, zakazane: true },
  { cityId: 'x', cityPn: 900, zakazane: true },
  { cityId: 'y', cityPn: 900, zakazane: true },
], 3), null, 'wszystkie zakazane → brak');

// --- aiPickMiastoDoZadania: cena = 500 raw (strona przyjmująca waga 1) ---
const gracz = (pn) => [{ cityId: 'g', cityPn: pn, zakazane: false }];
eq(M.aiPickMiastoDoZadania(gracz(499)), null, 'miasto gracza 499 < 500 → brak (N-1)');
eq(M.aiPickMiastoDoZadania(gracz(500))?.cityId, 'g', 'miasto gracza 500 → żądane (N)');
eq(M.aiPickMiastoDoZadania(gracz(501))?.cityId, 'g', 'miasto gracza 501 → żądane (N+1)');
eq(M.aiPickMiastoDoZadania([{ cityId: 'k', cityPn: 9999, zakazane: true }]), null, 'stolica gracza nie jest żądana');

// --- decideAIDiplomacy: oddanie i żądanie w wojnie ---
// r4: domyślne 10 tur wojny = powyżej minTurWojny (≤ 8, R5a) — bramka czasu nie gasi testów progów.
function runAI({ rw, agr = 5, eks = 3, miastaAI = [], miastaPartnera = [], turnsAtWar = 10, zdobyte = 0, war = true }) {
  const rel = {
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
const CITIES_OK = [{ cityId: 'a', cityPn: 400, zakazane: false }, { cityId: 'b', cityPn: 900, zakazane: false }, { cityId: 'c', cityPn: 900, zakazane: false }];

// Próg rw (agr=5 → 0.15): N-1 / N / N+1
ok(cession(runAI({ rw: 0.14, miastaAI: CITIES_OK })) !== undefined, 'oddanie: rw 0.14 (N-1) → oddaje');
ok(cession(runAI({ rw: 0.15, miastaAI: CITIES_OK })) !== undefined, 'oddanie: rw 0.15 (N) → oddaje');
ok(cession(runAI({ rw: 0.16, miastaAI: CITIES_OK })) === undefined, 'oddanie: rw 0.16 (N+1) → NIE oddaje');
// Próg rw zależny od agresywności: agr=10 → 0.10
ok(cession(runAI({ rw: 0.10, agr: 10, miastaAI: CITIES_OK })) !== undefined, 'agr=10: rw 0.10 (N) → oddaje');
ok(cession(runAI({ rw: 0.11, agr: 10, miastaAI: CITIES_OK })) === undefined, 'agr=10: rw 0.11 (N+1) → NIE oddaje');
// agr=1 → 0.19
ok(cession(runAI({ rw: 0.19, agr: 1, miastaAI: CITIES_OK })) !== undefined, 'agr=1: rw 0.19 (N) → oddaje');
ok(cession(runAI({ rw: 0.20, agr: 1, miastaAI: CITIES_OK })) === undefined, 'agr=1: rw 0.20 (N+1) → NIE oddaje');
// ≥3 miasta
ok(cession(runAI({ rw: 0.10, miastaAI: CITIES_OK.slice(0, 2) })) === undefined, 'oddanie: 2 miasta → NIE (N-1)');
ok(cession(runAI({ rw: 0.10, miastaAI: CITIES_OK })) !== undefined, 'oddanie: 3 miasta → oddaje (N)');
// Pokój nie w wojnie → brak oddania
ok(cession(runAI({ rw: 0.10, miastaAI: CITIES_OK, war: false })) === undefined, 'poza wojną → brak oddania');
// Cena pokrycia: cena w wadze
ok(cession(runAI({ rw: 0.10, miastaAI: c3(333) })) === undefined, 'oddanie: miasto 333 (499.5 PW) → NIE');
ok(cession(runAI({ rw: 0.10, miastaAI: c3(334) })) !== undefined, 'oddanie: miasto 334 (501 PW) → oddaje');
// Zawartość komendy
const cmdOddaj = cession(runAI({ rw: 0.10, eks: 5, miastaAI: c3(278) }));
eq(cmdOddaj?.cityId, 'a', 'komenda oddania: cityId');
eq(cmdOddaj?.cityPn, 278, 'komenda oddania: cityPn');
eq(cmdOddaj?.cityWeight, 1.8, 'komenda oddania: cityWeight z ekspansywności (eks=5)');
eq(cmdOddaj?.targetId, '0', 'komenda oddania: targetId = gracz');

// Żądanie: rw >= 0.7 AND (turnsAtWar >= 20 OR zdobyte > 0), miasto gracza >= 500
const GRACZ_OK = [{ cityId: 'g1', cityPn: 600, zakazane: false }, { cityId: 'k', cityPn: 9999, zakazane: true }];
ok(demand(runAI({ rw: 0.69, turnsAtWar: 25, miastaPartnera: GRACZ_OK })) === undefined, 'żądanie: rw 0.69 (N-1) → NIE');
ok(demand(runAI({ rw: 0.70, turnsAtWar: 25, miastaPartnera: GRACZ_OK })) !== undefined, 'żądanie: rw 0.70 (N) → żąda');
ok(demand(runAI({ rw: 0.71, turnsAtWar: 25, miastaPartnera: GRACZ_OK })) !== undefined, 'żądanie: rw 0.71 (N+1) → żąda');
ok(demand(runAI({ rw: 0.80, turnsAtWar: 19, zdobyte: 0, miastaPartnera: GRACZ_OK })) === undefined, 'żądanie: tury 19 (N-1), brak zdobyczy → NIE');
ok(demand(runAI({ rw: 0.80, turnsAtWar: 20, zdobyte: 0, miastaPartnera: GRACZ_OK })) !== undefined, 'żądanie: tury 20 (N) → żąda');
ok(demand(runAI({ rw: 0.80, turnsAtWar: 10, zdobyte: 1, miastaPartnera: GRACZ_OK })) !== undefined, 'żądanie: zdobyte miasto gracza (1), 10 tur → żąda');
// r4 (zarzut 4 Evaluatora): bramka czasu wojny R5a obowiązuje także żądanie i oddanie miasta.
ok(demand(runAI({ rw: 0.80, turnsAtWar: 0, zdobyte: 1, miastaPartnera: GRACZ_OK })) === undefined, 'żądanie r4: zdobyte miasto, 0 tur wojny → NIE (R5a)');
ok(cession(runAI({ rw: 0.10, turnsAtWar: 0, miastaAI: CITIES_OK })) === undefined, 'oddanie r4: 0 tur wojny → NIE (R5a)');
ok(cession(runAI({ rw: 0.10, turnsAtWar: 20, miastaAI: CITIES_OK })) !== undefined, 'oddanie r4: 20 tur wojny → oddaje');
ok(demand(runAI({ rw: 0.80, turnsAtWar: 0, zdobyte: 0, miastaPartnera: GRACZ_OK })) === undefined, 'żądanie: 0 tur i 0 zdobyczy → NIE');
ok(demand(runAI({ rw: 0.80, turnsAtWar: 25, miastaPartnera: [{ cityId: 'g1', cityPn: 499, zakazane: false }] })) === undefined, 'żądanie: miasto gracza 499 → NIE (N-1)');
ok(demand(runAI({ rw: 0.80, turnsAtWar: 25, miastaPartnera: [{ cityId: 'g1', cityPn: 500, zakazane: false }] })) !== undefined, 'żądanie: miasto gracza 500 → żąda (N)');
ok(demand(runAI({ rw: 0.80, turnsAtWar: 25, miastaPartnera: [{ cityId: 'g1', cityPn: 501, zakazane: false }] })) !== undefined, 'żądanie: miasto gracza 501 → żąda (N+1)');
ok(demand(runAI({ rw: 0.80, turnsAtWar: 25, miastaPartnera: [{ cityId: 'k', cityPn: 9999, zakazane: true }] })) === undefined, 'żądanie: tylko stolica gracza → NIE');
eq(demand(runAI({ rw: 0.80, turnsAtWar: 25, miastaPartnera: GRACZ_OK }))?.cityId, 'g1', 'komenda żądania: cityId miasta gracza');
ok(demand(runAI({ rw: 0.80, turnsAtWar: 25, miastaPartnera: GRACZ_OK, war: false })) === undefined, 'żądanie poza wojną → NIE');

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
