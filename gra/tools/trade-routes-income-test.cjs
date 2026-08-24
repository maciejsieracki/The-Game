'use strict';
/**
 * trade-routes-income-test.cjs -- standalone Node test for Handel E3 (dochod z tras).
 * Run from gra/:  node tools/trade-routes-income-test.cjs
 *
 * Self-contained: bundles trade-routes.ts / economy.ts / turn-economy.ts / cities.ts
 * with esbuild (no runtime imports). Covers:
 *   A. Trasa gracz<->obcy w pokoju + Umowa Handlowa -> tworzy sie (refreshTradeRoutes).
 *   A2. C-HANDEL-UMOWA=B (2026-07-23): brak Umowy Handlowej -> zero tras mimo pokoju;
 *      zawarcie traktatu -> trasa powstaje; zerwanie traktatu -> trasa znika (bez wojny).
 *   B. Wojna -> trasa znika (nie zostaje z flaga "zawieszona" -- po prostu znika z listy).
 *   C. Wlasne<->wlasne NIGDY nie tworzy trasy (filtr zewnetrzny).
 *   D. T3 (R-HANDEL-SZLAKI-PRZEBUDOWA-Q1, 2026-08-24): limit budynkow handlowych juz
 *      NIE ogranicza ISTNIENIE trasy -- ogranicza wylacznie pole budynekOdblokowany
 *      (priorytet: istniejace trasy po id, potem nowe wg rosnacego dystansu).
 *   E. Stabilnosc: istniejaca trasa (istnienie ORAZ budynekOdblokowany) jest
 *      priorytetowo zachowana mimo pojawienia sie blizszego kandydata.
 *   J. T3: trasa istnieje i daje dochod BEZ zadnego budynku handlowego w miescie
 *      (budynekOdblokowany=false); trasa morska nadal wymaga fizycznego Portu
 *      niezaleznie od budynekOdblokowany.
 *   F. Dochod dystansowy (wzor Q7=A + podloga) + kredytowanie OBU miast (Q8=B).
 *   G. +5% Handlu za kazda aktywna trase, kumulatywnie (economy.ts cityYieldPerTurn).
 *   H. Integracja advanceCityEconomy: pieniadzZTras wchodzi do skarbca CZYSTO (bez Wealth),
 *      liczbaAktywnychTrasHandlowych podnosi Handel, obie strony (wlasciciele) zarabiaja.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[trade-routes-income-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.trade-routes-income-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.trade-routes-income-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  refreshTradeRoutes, tradeRouteId, tradeRouteLimitForCity, TRADE_BUILDING_IDS,
  DEFAULT_TRADE_ROUTE_PARAMS, loadTradeRouteParams,
  tradeRouteDistanceIncome, tradeRouteTotalDistanceIncome, DEFAULT_TRADE_ROUTE_INCOME_PARAMS, loadTradeRouteIncomeParams,
  computeTradeRouteIncomeByCity, computeTradeRouteCountByCity,
} from '../src/game/trade-routes';
export { cityYieldPerTurn } from '../src/game/economy';
export { advanceCityEconomy } from '../src/game/turn-economy';
export { ensureCitySaveDefaults } from '../src/game/cities';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[trade-routes-income-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const TR = require(BUNDLE_FILE);
const econParamsRaw  = require('../data/econ-params.json');
const civs           = require('../data/civs.json');
const societyParams  = require('../data/society-params.json');
const buildings      = require('../data/buildings.json');
const units          = require('../data/units.json');
const tech           = require('../data/tech.json');
const gameData = { civs, econParams: econParamsRaw, societyParams, buildings, units, tech };

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// Fixture map: jeden dlugi placki rzad r=0, cala 'rownina' (ladowa, przechodnia).
// ---------------------------------------------------------------------------
function buildMap() {
  const hexes = {};
  for (let q = 0; q <= 400; q++) hexes[`${q},0`] = { terenBazowy: 'rownina' };
  return { szerokoscQ: 401, wysokoscR: 1, hexes, seed: 1, riverPaths: [] };
}
const map = buildMap();

function city(id, ownerId, q) { return { id, ownerId, q, r: 0 }; }

const NO_WAR = () => false;
// C-HANDEL-UMOWA=B (2026-07-23): refreshTradeRoutes wymaga teraz jawnego predykatu
// Umowy Handlowej (6. argument, miedzy isAtWar a params). HAS_TREATY = wszystkie pary
// maja zawarta umowe -- uzywany we WSZYSTKICH scenariuszach A/B/C/D/E ponizej, ktore
// testuja geometrie/limit/stabilnosc niezaleznie od traktatu (traktat obecny z gory,
// tak jak przed C-HANDEL-UMOWA=B "pokoj" byl domyslnie wystarczajacy). Gating samego
// traktatu ma dedykowana sekcje A2 nizej.
const HAS_TREATY = () => true;
const NO_TREATY  = () => false;

// ---------------------------------------------------------------------------
// A. Trasa gracz<->obcy w pokoju + Umowa Handlowa -> tworzy sie
// ---------------------------------------------------------------------------
console.log('\n-- A. refreshTradeRoutes: gracz<->obcy w pokoju + Umowa Handlowa tworzy trase --');
const p1 = city('p1', 0, 0);
const f1 = city('f1', 1, 5);
const builtA = new Map([['p1', ['targowisko']], ['f1', ['targowisko']]]);

const routesA = TR.refreshTradeRoutes([p1, f1], [], map, builtA, NO_WAR, HAS_TREATY);
eq(routesA.length, 1, 'A: dokladnie jedna trasa p1<->f1');
const routeA = routesA[0];
eq(routeA.id, TR.tradeRouteId('p1', 'f1', 'lad'), 'A: id trasy deterministyczne');
eq(routeA.fromCityId, 'p1', 'A: fromCityId = miasto gracza');
eq(routeA.toCityId, 'f1', 'A: toCityId = miasto obce');
eq(routeA.ownerId, 0, 'A: ownerId = gracz');
eq(routeA.toOwnerId, 1, 'A: toOwnerId = obca cyw');
eq(routeA.medium, 'lad', 'A: medium lad (brak portow, ale ladem polaczone)');
eq(routeA.dystans, 5, 'A: dystans = 5');
eq(routeA.status, 'polaczony', 'A: status polaczony');

// ---------------------------------------------------------------------------
// A2. C-HANDEL-UMOWA=B: brak Umowy Handlowej -> zero tras mimo pokoju + geometrii OK;
//     zawarcie traktatu -> trasa powstaje; zerwanie traktatu (bez wojny) -> trasa znika.
// ---------------------------------------------------------------------------
console.log('\n-- A2. refreshTradeRoutes: Umowa Handlowa wymagana (C-HANDEL-UMOWA=B) --');
const routesA2_noTreaty = TR.refreshTradeRoutes([p1, f1], [], map, builtA, NO_WAR, NO_TREATY);
eq(routesA2_noTreaty.length, 0, 'A2: pokoj + geometria OK, ale BRAK Umowy Handlowej -> zero tras');

const routesA2_signed = TR.refreshTradeRoutes([p1, f1], routesA2_noTreaty, map, builtA, NO_WAR, HAS_TREATY);
eq(routesA2_signed.length, 1, 'A2: zawarcie Umowy Handlowej -> trasa powstaje');
eq(routesA2_signed[0].id, TR.tradeRouteId('p1', 'f1', 'lad'), 'A2: powstala trasa to p1<->f1');

const routesA2_broken = TR.refreshTradeRoutes([p1, f1], routesA2_signed, map, builtA, NO_WAR, NO_TREATY);
eq(routesA2_broken.length, 0, 'A2: zerwanie Umowy Handlowej (nadal pokoj!) -> trasa znika');

// ---------------------------------------------------------------------------
// B. Wojna -> trasa znika
// ---------------------------------------------------------------------------
console.log('\n-- B. refreshTradeRoutes: wojna zrywa trase (znika z listy) --');
const AT_WAR_0_1 = (a, b) => (a === 0 && b === 1) || (a === 1 && b === 0);
const routesB = TR.refreshTradeRoutes([p1, f1], routesA, map, builtA, AT_WAR_0_1, HAS_TREATY);
eq(routesB.length, 0, 'B: wojna -> lista tras pusta (trasa znika, nie zostaje "zawieszona")');

// Powrot do pokoju odtwarza trase (nie jest trwale skasowana z gry -- po prostu
// nie byla persystowana w stanie wojny). Traktat nadal aktywny (wojna go nie kasuje
// tutaj -- to symulacja czystej funkcji; w main.ts wojna realnie zrywa traktat, ale
// to osobna, redundantna bramka -- patrz breakTreatiesOnWar).
const routesBRestored = TR.refreshTradeRoutes([p1, f1], routesB, map, builtA, NO_WAR, HAS_TREATY);
eq(routesBRestored.length, 1, 'B: powrot do pokoju -> trasa odtworzona');

// ---------------------------------------------------------------------------
// C. Wlasne<->wlasne NIGDY nie tworzy trasy (filtr zewnetrzny)
// ---------------------------------------------------------------------------
console.log('\n-- C. refreshTradeRoutes: wlasne<->wlasne nie tworzy trasy --');
const p1c = city('p1c', 0, 30);
const p2c = city('p2c', 0, 35); // rowniez gracz -- brak miasta obcego w tym wywolaniu
const builtC = new Map([['p1c', ['targowisko']], ['p2c', ['targowisko']]]);
const routesC = TR.refreshTradeRoutes([p1c, p2c], [], map, builtC, NO_WAR, HAS_TREATY);
eq(routesC.length, 0, 'C: dwa miasta gracza, brak obcego -> zero tras (own<->own wykluczone)');

// ---------------------------------------------------------------------------
// D. T3: limit budynkow handlowych NIE ogranicza juz ISTNIENIE trasy -- wylacznie
//    pole budynekOdblokowany (ten sam mechanizm priorytetu, co dawniej dla istnienia:
//    najpierw istniejace trasy po id, potem nowe wg rosnacego dystansu).
// ---------------------------------------------------------------------------
console.log('\n-- D. refreshTradeRoutes: T3 -- budynki gatuja budynekOdblokowany, NIE istnienie --');

// D1: pD ma tylko 1 slot budynkowy (Targowisko), dwaj obcy kandydaci -- OBIE trasy
// teraz ISTNIEJA, ale tylko blizsza (fD1) dostaje budynekOdblokowany=true.
const pD  = city('pD', 0, 60);
const fD1 = city('fD1', 1, 63); // dystans 3 -- blizej
const fD2 = city('fD2', 2, 64); // dystans 4 -- dalej
const builtD1 = new Map([
  ['pD',  ['targowisko']],          // 1 slot
  ['fD1', ['targowisko']],
  ['fD2', ['targowisko']],
]);
const routesD1 = TR.refreshTradeRoutes([pD, fD1, fD2], [], map, builtD1, NO_WAR, HAS_TREATY);
eq(routesD1.length, 2, 'D1: T3 -- limit budynkowy=1 po stronie gracza, ALE obie trasy ISTNIEJA');
const routeD1_fD1 = routesD1.find(r => r.toCityId === 'fD1');
const routeD1_fD2 = routesD1.find(r => r.toCityId === 'fD2');
eq(routeD1_fD1.budynekOdblokowany, true, 'D1: blizszy kandydat (dystans 3) dostaje wolny slot -> budynekOdblokowany=true');
eq(routeD1_fD2.budynekOdblokowany, false, 'D1: dalszy kandydat (dystans 4) -- brak wolnego slotu -> budynekOdblokowany=false');
assert(routeD1_fD1.dystans === 3 && routeD1_fD1.status === 'polaczony', 'D1: fD1 ma pelny dochod dystansowy mimo dzielonego slotu');
assert(routeD1_fD2.dystans === 4 && routeD1_fD2.status === 'polaczony', 'D1: fD2 (bez slotu) NADAL ma dochod dystansowy (T3 -- dochod dostepny od poczatku)');

// D1-bis: podniesienie limitu gracza do 2 (Targowisko + Port wielki) -> obie trasy
// dostaja budynekOdblokowany=true (istnienie bez zmian -- juz bylo 2).
const builtD1b = new Map([
  ['pD',  ['targowisko', 'port_wielki']], // 2 sloty
  ['fD1', ['targowisko']],
  ['fD2', ['targowisko']],
]);
const routesD1b = TR.refreshTradeRoutes([pD, fD1, fD2], [], map, builtD1b, NO_WAR, HAS_TREATY);
eq(routesD1b.length, 2, 'D1-bis: 2 sloty po stronie gracza -> nadal obie trasy istnieja');
assert(routesD1b.every(r => r.budynekOdblokowany === true), 'D1-bis: 2 sloty -> OBIE trasy dostaja budynekOdblokowany=true');

// D2: limit po stronie OBCEGO miasta -- fD ma tylko 1 slot, dwaj gracze konkuruja
// o budynekOdblokowany (obie trasy jednak istnieja).
const fD  = city('fD', 1, 90);
const pF1 = city('pF1', 0, 91); // dystans 1 -- blizej
const pF2 = city('pF2', 0, 88); // dystans 2 -- dalej
const builtD2 = new Map([
  ['fD',  ['targowisko']],  // 1 slot (obce miasto)
  ['pF1', ['targowisko']],
  ['pF2', ['targowisko']],
]);
const routesD2 = TR.refreshTradeRoutes([fD, pF1, pF2], [], map, builtD2, NO_WAR, HAS_TREATY);
eq(routesD2.length, 2, 'D2: T3 -- limit budynkowy=1 po stronie obcego, ALE obie trasy ISTNIEJA');
const routeD2_pF1 = routesD2.find(r => r.fromCityId === 'pF1');
const routeD2_pF2 = routesD2.find(r => r.fromCityId === 'pF2');
eq(routeD2_pF1.budynekOdblokowany, true, 'D2: blizszy gracz (dystans 1) dostaje wolny slot obcego -> budynekOdblokowany=true');
eq(routeD2_pF2.budynekOdblokowany, false, 'D2: dalszy gracz (dystans 2) -- brak wolnego slotu -> budynekOdblokowany=false');

// ---------------------------------------------------------------------------
// E. Stabilnosc: DWA POZIOMY (T3) -- (1) istnienie trasy z existingRoutes zawsze
//    zachowane gdy nadal spelnia warunki (nie jest juz ograniczone slotami);
//    (2) budynekOdblokowany: istniejaca trasa ma PIERWSZENSTWO do slotu przed
//    nowym, blizszym kandydatem.
// ---------------------------------------------------------------------------
console.log('\n-- E. refreshTradeRoutes: stabilnosc istnienia ORAZ budynekOdblokowany (T3) --');
const pE = city('pE', 0, 120);
const fEOld = city('fEOld', 1, 125); // dystans 5 -- istniejaca trasa
const fENew = city('fENew', 1, 122); // dystans 2 -- blizszy NOWY kandydat
const builtE = new Map([
  ['pE',    ['targowisko']], // 1 slot
  ['fEOld', ['targowisko']],
  ['fENew', ['targowisko']],
]);
const existingE = TR.refreshTradeRoutes([pE, fEOld], [], map, builtE, NO_WAR, HAS_TREATY);
eq(existingE.length, 1, 'E: (setup) trasa poczatkowa pE<->fEOld istnieje');
eq(existingE[0].budynekOdblokowany, true, 'E: (setup) jedyna trasa -> od razu ma budynekOdblokowany=true (1 slot wolny)');

const routesE = TR.refreshTradeRoutes([pE, fEOld, fENew], existingE, map, builtE, NO_WAR, HAS_TREATY);
eq(routesE.length, 2, 'E: T3 -- OBIE trasy (stara + nowa, blizsza) TERAZ ISTNIEJA (1 slot juz nie ogranicza istnienia)');
const routeE_old = routesE.find(r => r.toCityId === 'fEOld');
const routeE_new = routesE.find(r => r.toCityId === 'fENew');
eq(routeE_old.budynekOdblokowany, true, 'E: istniejaca trasa fEOld PRIORYTETOWO zachowuje budynekOdblokowany=true mimo blizszego fENew');
eq(routeE_new.budynekOdblokowany, false, 'E: nowy, blizszy kandydat fENew NIE dostaje slotu -- zajety przez istniejaca trase');

// ---------------------------------------------------------------------------
// J. T3: dochod dystansowy dostepny BEZ zadnego budynku handlowego; trasa morska
//    nadal wymaga fizycznego Portu (cityHasPort) do samego POLACZENIA, niezaleznie
//    od budynekOdblokowany.
// ---------------------------------------------------------------------------
console.log('\n-- J. refreshTradeRoutes: T3 -- dochod od razu bez budynku; Port nadal wymagany dla morza --');

// J1: LAD, ZERO budynkow handlowych w obu miastach -> trasa mimo to ISTNIEJE,
// ma dochod dystansowy, ale budynekOdblokowany=false.
const pJ = city('pJ', 0, 150);
const fJ = city('fJ', 1, 155);
const builtJEmpty = new Map(); // brak jakichkolwiek budynkow w obu miastach
const routesJ1 = TR.refreshTradeRoutes([pJ, fJ], [], map, builtJEmpty, NO_WAR, HAS_TREATY);
eq(routesJ1.length, 1, 'J1: trasa ISTNIEJE mimo braku jakiegokolwiek budynku handlowego w obu miastach');
eq(routesJ1[0].status, 'polaczony', 'J1: status polaczony');
eq(routesJ1[0].dystans, 5, 'J1: dystans dystansowy liczony normalnie');
eq(routesJ1[0].budynekOdblokowany, false, 'J1: budynekOdblokowany=false -- zero slotow po obu stronach');
assert(TR.tradeRouteDistanceIncome(routesJ1[0].dystans, 'lad', TR.DEFAULT_TRADE_ROUTE_INCOME_PARAMS) > 0,
  'J1: dochod dystansowy > 0 mimo budynekOdblokowany=false (T3 -- dostepny od poczatku)');

// J2: MORZE -- Targowisko (budynek handlowy) w obu miastach, ale BRAK fizycznego
// Portu -- polaczenie morskie NIE powstaje wcale (cityHasPort niezmieniony wymog),
// niezaleznie od tego ze budynek handlowy formalnie jest.
function buildIslandMap() {
  const hexes = {};
  for (let q = 0; q <= 30; q++) {
    const isWater = q >= 10 && q <= 20;
    hexes[`${q},200`] = { terenBazowy: isWater ? 'morze' : 'rownina' };
  }
  return { szerokoscQ: 31, wysokoscR: 201, hexes, seed: 1, riverPaths: [] };
}
const mapJ = buildIslandMap();
const pJ2 = city('pJ2', 0, 9); pJ2.r = 200;  // ladowy heks tuz przy wodzie (q=10..20)
const fJ2 = city('fJ2', 1, 21); fJ2.r = 200; // ladowy heks tuz przy wodzie z drugiej strony
const builtJ2NoPort = new Map([
  ['pJ2', ['targowisko']], // budynek handlowy JEST, ale...
  ['fJ2', ['targowisko']], // ...brak fizycznego Portu w obu miastach
]);
const routesJ2NoPort = TR.refreshTradeRoutes([pJ2, fJ2], [], mapJ, builtJ2NoPort, NO_WAR, HAS_TREATY);
eq(routesJ2NoPort.length, 0, 'J2: BRAK trasy -- brak lądu (wyspy) I brak fizycznego Portu, mimo Targowiska (budynku handlowego)');

// J3: te same miasta, teraz Z fizycznym Portem (zamiast Targowiska) -> polaczenie
// morskie powstaje; budynekOdblokowany=false, bo 'port' liczy sie tez jako budynek
// handlowy (TRADE_BUILDING_IDS zawiera 'port') -- WIEC w tym wypadku faktycznie
// budynekOdblokowany=true (Port jest jednoczesnie budynkiem fizycznym I handlowym).
const builtJ3WithPort = new Map([
  ['pJ2', ['port']],
  ['fJ2', ['port']],
]);
const routesJ3 = TR.refreshTradeRoutes([pJ2, fJ2], [], mapJ, builtJ3WithPort, NO_WAR, HAS_TREATY);
eq(routesJ3.length, 1, 'J3: Port w obu miastach -> polaczenie morskie powstaje');
eq(routesJ3[0].medium, 'morze', 'J3: medium=morze (wyspy, brak ladu)');
eq(routesJ3[0].budynekOdblokowany, true, 'J3: Port liczy sie TAKZE jako budynek handlowy (TRADE_BUILDING_IDS) -> budynekOdblokowany=true');

// J4: kontrola rozroznienia -- Port_wielki (fizyczny port) ale przy limicie
// slotow=0 po drugiej stronie -- druga strona ma TYLKO 'port' jeden budynek,
// wiec slot jest, ale pokazuje ze to WCIAZ dwa niezalezne pojecia (limit i port
// fizyczny), nie jeden mechanizm: usuniecie Portu (fizycznego) z jednej strony
// zrywa polaczenie CALKOWICIE, mimo ze budynekOdblokowany nigdy nie byl liczony
// (trasa nie istnieje -> nie ma budynekOdblokowany do sprawdzenia).
const builtJ4OnlyOnePort = new Map([
  ['pJ2', ['port']],       // fizyczny Port -- OK
  ['fJ2', ['targowisko']], // budynek handlowy, ale BRAK fizycznego Portu
]);
const routesJ4 = TR.refreshTradeRoutes([pJ2, fJ2], [], mapJ, builtJ4OnlyOnePort, NO_WAR, HAS_TREATY);
eq(routesJ4.length, 0, 'J4: fizyczny Port wymagany po OBU stronach dla morza -- jedna strona bez Portu -> brak trasy mimo budynku handlowego istniejacego formalnie u drugiej');

// ---------------------------------------------------------------------------
// F. Dochod dystansowy -- PRZEBUDOWA R-HANDEL-SZLAKI-PRZEBUDOWA-Q1 (ECHO Q1 + p.3,
//    2026-08-21, T1): wzor ODWROCONY (rosnie z dystansem), stawki x5, podloga=5,
//    szczyt=40, osobna stawka wzrostu per medium (lad maxDist=12, morze maxDist=20),
//    tak by NAJDALSZA trasa ladowa i NAJDALSZA trasa morska dawaly IDENTYCZNY
//    szczytowy dochod (40) mimo roznych maxDist. + kredytowanie OBU miast (Q8=B,
//    bez zmian z poprzedniej przebudowy).
// ---------------------------------------------------------------------------
console.log('\n-- F. dochod dystansowy: wzor odwrocony x5, osobny per medium, obie strony zarabiaja --');
const incP = TR.DEFAULT_TRADE_ROUTE_INCOME_PARAMS;
eq(incP.dochodPodloga, 5, 'F: (setup) dochodPodloga=5 (stary floor=1 x5)');
eq(incP.dochodSzczyt, 40, 'F: (setup) dochodSzczyt=40 (stary bazowy=8 x5)');
eq(incP.ladMaxDist, 12, 'F: (setup) ladMaxDist=12 (bez zmian)');
eq(incP.morzeMaxDist, 20, 'F: (setup) morzeMaxDist=20 (bez zmian)');

// LAD: stawkaWzrostu = (40-5)/12 = 2.91666...
eq(TR.tradeRouteDistanceIncome(0, 'lad', incP), 5, 'F: LAD dystans=0 -> podloga=5');
eq(TR.tradeRouteDistanceIncome(6, 'lad', incP), Math.floor(5 + (40 - 5) / 12 * 6), 'F: LAD dystans=6 (polowa maxDist) -> floor(5+stawka*6)');
eq(TR.tradeRouteDistanceIncome(12, 'lad', incP), 40, 'F: LAD dystans=12 (=ladMaxDist) -> szczyt=40');
eq(TR.tradeRouteDistanceIncome(1000, 'lad', incP), 40, 'F: LAD dystans poza zakresem -> clamp do szczytu=40, nigdy wiecej');

// MORZE: stawkaWzrostu = (40-5)/20 = 1.75
eq(TR.tradeRouteDistanceIncome(0, 'morze', incP), 5, 'F: MORZE dystans=0 -> podloga=5 (ta sama co lad)');
eq(TR.tradeRouteDistanceIncome(10, 'morze', incP), Math.floor(5 + (40 - 5) / 20 * 10), 'F: MORZE dystans=10 (polowa maxDist) -> floor(5+stawka*10)');
eq(TR.tradeRouteDistanceIncome(20, 'morze', incP), 40, 'F: MORZE dystans=20 (=morzeMaxDist) -> szczyt=40 (IDENTYCZNY jak lad d=12, ECHO Q1)');
eq(TR.tradeRouteDistanceIncome(1000, 'morze', incP), 40, 'F: MORZE dystans poza zakresem -> clamp do szczytu=40, nigdy wiecej');

const routeF1 = { id: 'r1', fromCityId: 'A', toCityId: 'B', ownerId: 0, toOwnerId: 1, medium: 'lad', dystans: 5, status: 'polaczony' };
const routeF2 = { id: 'r2', fromCityId: 'A', toCityId: 'C', ownerId: 0, toOwnerId: 2, medium: 'morze', dystans: 10, status: 'polaczony' };
const routeF3suspended = { id: 'r3', fromCityId: 'A', toCityId: 'D', ownerId: 0, toOwnerId: 3, medium: 'lad', dystans: 1, status: 'brak_polaczenia' };
const incomeByCity = TR.computeTradeRouteIncomeByCity([routeF1, routeF2, routeF3suspended], incP);
const inc5  = TR.tradeRouteDistanceIncome(5, 'lad', incP);
const inc10 = TR.tradeRouteDistanceIncome(10, 'morze', incP);
// R-HANDEL-SZLAKI-PRZEBUDOWA-Q1 T2 (ECHO Q2): computeTradeRouteIncomeByCity liczy teraz
// dochod FINALNY przez tradeRouteTotalDistanceIncome -- trasa morska dostaje bonus x2
// wobec czystej krzywej dystansowej (tradeRouteDistanceIncome, NIEZMIENIONA), lad bez zmian.
const inc10Total = inc10 * 2;
eq(incomeByCity.get('A'), inc5 + inc10Total, 'F: miasto A uczestniczy w 2 trasach (lad+morze x2) -> suma obu dochodow finalnych');
eq(incomeByCity.get('B'), inc5, 'F: miasto B (druga strona trasy 1, lad) dostaje PELNA kwote (Q8=B, nie polowe)');
eq(incomeByCity.get('C'), inc10Total, 'F: miasto C (druga strona trasy 2, morze) dostaje PELNA kwote FINALNA (x2 morza)');
eq(incomeByCity.has('D'), false, 'F: trasa ze statusem brak_polaczenia NIE liczy sie do dochodu');

// ---------------------------------------------------------------------------
// F2. tradeRouteTotalDistanceIncome -- nowa funkcja opakowujaca (T2, ECHO Q2):
//     LAD bez zmian (== tradeRouteDistanceIncome), MORZE x2 (SUMUJE SIE z
//     osobnym, niezmienionym PORT_SEA_TRADE_BONUS_PIENIADZ -- nietestowanym tu,
//     patrz trade-routes-test.cjs sekcja l4-l6).
// ---------------------------------------------------------------------------
console.log('\n-- F2. tradeRouteTotalDistanceIncome: lad bez zmian, morze x2 --');
for (const d of [0, 6, 12, 1000]) {
  eq(
    TR.tradeRouteTotalDistanceIncome(d, 'lad', incP),
    TR.tradeRouteDistanceIncome(d, 'lad', incP),
    `F2: LAD dystans=${d} -> tradeRouteTotalDistanceIncome === tradeRouteDistanceIncome (bez mnoznika)`,
  );
}
for (const d of [0, 10, 20, 1000]) {
  eq(
    TR.tradeRouteTotalDistanceIncome(d, 'morze', incP),
    TR.tradeRouteDistanceIncome(d, 'morze', incP) * 2,
    `F2: MORZE dystans=${d} -> tradeRouteTotalDistanceIncome === tradeRouteDistanceIncome x2`,
  );
}
eq(TR.tradeRouteTotalDistanceIncome(0, 'morze', incP), 10, 'F2: MORZE dystans=0 -> podloga=5 x2 = 10');
eq(TR.tradeRouteTotalDistanceIncome(20, 'morze', incP), 80, 'F2: MORZE dystans=20 (=morzeMaxDist) -> szczyt=40 x2 = 80');
eq(TR.tradeRouteTotalDistanceIncome(12, 'lad', incP), 40, 'F2: LAD dystans=12 (=ladMaxDist) -> szczyt=40, BEZ mnoznika (tylko morze dostaje x2)');

const countByCity = TR.computeTradeRouteCountByCity([routeF1, routeF2, routeF3suspended]);
eq(countByCity.get('A'), 2, 'F: licznik tras miasta A = 2 (obie aktywne trasy)');
eq(countByCity.get('B'), 1, 'F: licznik tras miasta B = 1');
eq(countByCity.has('D'), false, 'F: trasa nieaktywna nie liczy sie do licznika');

// ---------------------------------------------------------------------------
// G. +5% Handlu za kazda aktywna trase, kumulatywnie (economy.ts)
// ---------------------------------------------------------------------------
console.log('\n-- G. cityYieldPerTurn: +5%/trase na Handel, kumulatywnie, osobny czynnik --');
function makeEconCity() {
  return {
    id: 'gc1', ludnosc: 3, zdrowie: 0, czyStolica: true,
    maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 0,
    specjalisci: [], kolejkaProdukcji: [],
    podziałHandlu: { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 },
    podziałPracy:  { procentBudynki: 70 },
  };
}
function makeCtx(liczbaTras) {
  return {
    wojskoZuzycieZywnosci: 0, strataFraction: 0,
    maMlyn: false, maCegielnia: false, maTargowisko: false, maBiblioteka: false,
    maMennica: false, mennicaMnoznik: 1, walutaOdkryta: false,
    liczbaAktywnychTrasHandlowych: liczbaTras,
  };
}
// 40 pol (nie realistyczne dla jednego miasta, ale cityYieldPerTurn przyjmuje
// dowolna tablice WorkedTile -- tu chcemy baseHandel na tyle duzy, zeby kazdy
// krok +5% byl widoczny osobno mimo floor() (przy malej bazie kolejne floor()
// moga dac te sama wartosc dla n i n+1, co nie znaczy braku efektu -- tylko
// zbyt gruboziarnisty test; 40 pol daje baseHandel=40, krok 5%=2/trase).
const gTiles = Array(40).fill({ terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false });
const pParamsForG = { budynekTargowiskoBonusHandlu: 0.5, budynekBibliotekaBonusNauki: 0.5,
  suwaakHandelNaukaDefault: 60, suwaakHandelPieniadz: 30, suwaakHandelLuksus: 10,
  suwaakPracaBudynki: 70, suwaakPracaTeren: 30, budynekMlynMnoznikPracy: 2, budynekMlynBonusPracy: 2,
  budynekCegielniBonusPracy: 0.25, budynekMennicaMnoznik: 1, mennicaMnoznikPoWalucie: 1.5,
  walutaMnoznik: 2, targowiskoPracaMnoznik: 2, progWzrostuWspolczynnik: 16,
  spichlerzZachowaniePoPrzroscie: 0.5, akweduktProgLudnosci: 5, akweduktMaxLudnosci: 15,
  zywnoscZuzytkaPopulacja: 1, zdrowieModyfikatorWspolczynnik: 0.05, korupcjaWspolczynnikDystansu: 2,
  korupcjaWspolczynnikMiast: 1, korupcjaCap: 0.5 };

const yld0 = TR.cityYieldPerTurn(makeEconCity(), gTiles, [], pParamsForG, makeCtx(0));
const baseHandel = yld0.handelBrutto;
assert(baseHandel > 0, 'G: (setup) baza Handlu > 0 bez tras');

for (const n of [1, 2, 3, 4]) {
  const yldN = TR.cityYieldPerTurn(makeEconCity(), gTiles, [], pParamsForG, makeCtx(n));
  const expected = Math.floor(baseHandel * (1 + 0.05 * n));
  eq(yldN.handelBrutto, expected, `G: n=${n} trasy -> handelBrutto = floor(base*(1+0.05*${n})) = ${expected}`);
  assert(yldN.pieniadz >= yld0.pieniadz, `G: n=${n} trasy -> pieniadz nie maleje wzgledem braku tras`);
}

// Kumulatywnosc: n=2 daje dokladnie posrodku miedzy n=1 a n=3 skali (liniowo w n).
const yld1 = TR.cityYieldPerTurn(makeEconCity(), gTiles, [], pParamsForG, makeCtx(1));
const yld2 = TR.cityYieldPerTurn(makeEconCity(), gTiles, [], pParamsForG, makeCtx(2));
const yld3 = TR.cityYieldPerTurn(makeEconCity(), gTiles, [], pParamsForG, makeCtx(3));
assert(yld2.handelBrutto > yld1.handelBrutto && yld3.handelBrutto > yld2.handelBrutto,
  'G: kumulatywnie rosnie z kazda kolejna trasa (1 < 2 < 3)');

// ---------------------------------------------------------------------------
// H. Integracja advanceCityEconomy: pieniadzZTras CZYSTO do skarbca (bez Wealth),
//    obie strony (gracz + obca cyw) zarabiaja z tej samej trasy.
// ---------------------------------------------------------------------------
console.log('\n-- H. advanceCityEconomy: pieniadzZTras w skarbcu, obie strony, bez Wealth --');
function makeRuntimeCity(id, ownerId, q) {
  const c = { id, ownerId, q, r: 0, name: id, population: 4 };
  TR.ensureCitySaveDefaults(c);
  return c;
}

const pH = makeRuntimeCity('pH', 0, 200);
const fH = makeRuntimeCity('fH', 1, 205);
const builtH = new Map([['pH', ['targowisko']], ['fH', ['targowisko']]]);
const playerZbadaneH = new Set();

function runTickH(tradeIncomeByCity, tradeRouteCountByCity) {
  const cities = [
    { ...pH, wealthState: { ...pH.wealthState } },
    { ...fH, wealthState: { ...fH.wealthState } },
  ];
  const econ = TR.advanceCityEconomy(
    cities, map, gameData, 'normal', [], new Map(), builtH,
    1, playerZbadaneH, new Map(), new Map(), undefined, undefined, 'wysoki',
    tradeRouteCountByCity, tradeIncomeByCity,
  );
  return {
    pH: econ.perCity.find(t => t.cityId === 'pH'),
    fH: econ.perCity.find(t => t.cityId === 'fH'),
  };
}

// H1: baseline bez tras.
const base = runTickH(new Map(), new Map());
eq(base.pH.pieniadzZTras, 0, 'H1: brak tras -> pieniadzZTras=0 (gracz)');
eq(base.fH.pieniadzZTras, 0, 'H1: brak tras -> pieniadzZTras=0 (obca cyw)');

// H2: trasa daje dochod OBU miastom, dodany CZYSTO (nie mnozony przez Wealth).
const TRADE_AMOUNT = 37; // wartosc dowolna, nieokragla wzgledem typowych mnoznikow Wealth
const withTrade = runTickH(
  new Map([['pH', TRADE_AMOUNT], ['fH', TRADE_AMOUNT]]),
  new Map([['pH', 1], ['fH', 1]]),
);
eq(withTrade.pH.pieniadzZTras, TRADE_AMOUNT, 'H2: pieniadzZTras gracza = kwota trasy');
eq(withTrade.fH.pieniadzZTras, TRADE_AMOUNT, 'H2: pieniadzZTras obcej cyw = kwota trasy (obie strony zarabiaja)');
eq(withTrade.pH.pieniadz - base.pH.pieniadz, TRADE_AMOUNT,
  'H2: pieniadz gracza wzrasta DOKLADNIE o kwote trasy (bez mnoznika Wealth, +5% Handlu tu wylaczone -- count=1 ale sprawdzane osobno w H3)');

// H3: liczbaAktywnychTrasHandlowych=1 w tym samym wywolaniu podnosi tez Handel-z-pol
// (osobny kanal) -- pieniadzBrutto (przed dochodem z tras) powinien byc >= baseline.
assert(withTrade.pH.pieniadzBrutto >= base.pH.pieniadzBrutto,
  'H3: +5% Handlu (1 trasa) nie obniza pieniadzBrutto wzgledem braku tras');

// H4: sam count (bez kwoty $) tez podnosi pieniadzBrutto lokalnie, niezaleznie od pieniadzZTras.
const onlyCount = runTickH(new Map(), new Map([['pH', 3], ['fH', 3]]));
assert(onlyCount.pH.pieniadzBrutto > base.pH.pieniadzBrutto,
  'H4: liczbaAktywnychTrasHandlowych=3 (bez dochodu $) podnosi pieniadzBrutto gracza wzgledem 0 tras');
eq(onlyCount.pH.pieniadzZTras, 0, 'H4: (kontrola) pieniadzZTras=0 gdy tradeIncomeByCity puste');

// ---------------------------------------------------------------------------
// I. Priorytet lądu BEZWARUNKOWY w detectBestConnection (T2, ECHO Q5 finalne
//    doprecyzowanie): gdy ląd I morze są OBA geometrycznie połączone (porty w
//    obu miastach), trasa MA BYĆ lądowa -- morze NIE jest brane pod uwagę jako
//    alternatywa, nawet gdyby (po Zmianie A / bonusie x2) dawało wyższy dochód.
//    Fixture: dwa miasta rozdzielone pasem wody (rzad r=100), ALE z dodatkowym
//    ladowym "objazdem" (rzad r=99, w calosci lad), wiec obie sciezki (lad
//    objazdem, morze wprost przez woda z portami) sa geometrycznie mozliwe.
// ---------------------------------------------------------------------------
console.log('\n-- I. refreshTradeRoutes: priorytet ladu bezwarunkowy (ECHO Q5) mimo mozliwego morza --');
function buildLandDetourMap() {
  const hexes = {};
  // rzad r=100: q=0..10, woda na q=4..6 (szlak morski wprost, z portami)
  for (let q = 0; q <= 10; q++) {
    const isWater = q >= 4 && q <= 6;
    hexes[`${q},100`] = { terenBazowy: isWater ? 'morze' : 'rownina' };
  }
  // rzad r=99: q=0..10, caly lad -- objazd ladowy dookola pasa wody
  for (let q = 0; q <= 10; q++) {
    hexes[`${q},99`] = { terenBazowy: 'rownina' };
  }
  return { szerokoscQ: 11, wysokoscR: 101, hexes, seed: 1, riverPaths: [] };
}
const mapI = buildLandDetourMap();
const pI = city('pI', 0, 3); pI.r = 100;
const fI = city('fI', 1, 7); fI.r = 100;
const builtI = new Map([
  ['pI', ['targowisko', 'port']],
  ['fI', ['targowisko', 'port']],
]);

const routesI = TR.refreshTradeRoutes([pI, fI], [], mapI, builtI, NO_WAR, HAS_TREATY);
eq(routesI.length, 1, 'I: (setup) dokladnie jedna trasa pI<->fI powstaje (oba media geometrycznie mozliwe)');
eq(routesI[0].medium, 'lad', 'I: mimo mozliwego szlaku morskiego (porty + woda), wybrany medium = lad (bezwarunkowy priorytet ladu, ECHO Q5)');
eq(routesI[0].dystans, 4, 'I: (kontrola) dystans = hexDistance(3,100 -> 7,100) = 4, taki sam dla obu mediow');

console.log(`\ntrade-routes-income-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
