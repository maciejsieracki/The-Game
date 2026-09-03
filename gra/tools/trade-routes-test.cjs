'use strict';
/**
 * trade-routes-test.cjs -- standalone Node test for src/game/trade-routes.ts (Handel E2).
 * Run from gra/:  node tools/trade-routes-test.cjs
 *
 * Self-contained: bundles trade-routes.ts with esbuild (no runtime imports) and
 * runs assertions covering findCityConnection() lad/morze detection + cache
 * determinism. Fundament only -- no income, no UI, no economy wiring (E3+).
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[trade-routes-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.trade-routes-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.trade-routes-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `
export {
  findCityConnection, DEFAULT_TRADE_ROUTE_PARAMS, createTradeRoute, tradeRouteId,
  loadTradeRouteParams, diffTradeRoutes,
  computeSeaTradeRouteCountByCity, computeSeaTradeBonusIncomeByCity,
  PORT_SEA_TRADE_BONUS_PIENIADZ,
  diagnoseMissingTradeRouteForPartner,
} from '../src/game/trade-routes';
`, 'utf8');

try {
  esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent' });
} catch (e) { console.error('[trade-routes-test] esbuild failed:\n', e.message || e); process.exit(1); }

const TR = require(BUNDLE_FILE);

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// Fixture map: trzy rzedy.
//   r=0  : q=0..30 flat land (rownina)                  -- a/b/e (lad only)
//   r=10 : q=0..10 land | q=4..6 morze | q=7..10 land    -- c/d (lad+morze)
//   r=20 : q=0..10 land | q=4..6 gory  | q=7..10 land    -- b2 (fizyczna blokada
//          GORAMI, nie woda -- KRYTERIUM KONCA #5 dispatchu R-HANDEL-SZLAKI-
//          LIMIT-DYSTANSU-USUN-Q1: fizyczna nieosiagalnosc nadal blokuje trase,
//          niezaleznie od usunietego progu dystansu)
// ---------------------------------------------------------------------------

function buildMap() {
  const hexes = {};
  for (let q = 0; q <= 30; q++) {
    hexes[`${q},0`] = { terenBazowy: 'rownina' };
  }
  for (let q = 0; q <= 10; q++) {
    const isWater = q >= 4 && q <= 6;
    hexes[`${q},10`] = { terenBazowy: isWater ? 'morze' : 'rownina' };
  }
  for (let q = 0; q <= 10; q++) {
    const isMountain = q >= 4 && q <= 6;
    hexes[`${q},20`] = { terenBazowy: isMountain ? 'gory' : 'rownina' };
  }
  return { szerokoscQ: 31, wysokoscR: 21, hexes, seed: 1, riverPaths: [] };
}

const map = buildMap();

const cityNear1 = { id: 'c1', ownerId: 0, q: 0, r: 0 };
const cityNear2 = { id: 'c2', ownerId: 1, q: 5, r: 0 };
const cityFar1  = { id: 'c3', ownerId: 0, q: 0, r: 0 };
const cityFar2  = { id: 'c4', ownerId: 1, q: 20, r: 0 };
const cityWater1 = { id: 'c5', ownerId: 0, q: 3, r: 10 };
const cityWater2 = { id: 'c6', ownerId: 1, q: 7, r: 10 };
const cityMountain1 = { id: 'c7', ownerId: 0, q: 3, r: 20 };
const cityMountain2 = { id: 'c8', ownerId: 1, q: 7, r: 20 };

// (a) dwa miasta blisko na ladzie = connected, distance poprawny
const near = TR.findCityConnection(cityNear1, cityNear2, map, 'lad');
assert(near.connected, 'a: blisko na ladzie -> connected');
eq(near.distance, 5, 'a: dystans = hexDistance(0,0 -> 5,0) = 5');
eq(near.pathHexes.length, 6, 'a: path 6 hexow (0..5 wlacznie)');
eq(near.pathHexes[0], '0,0', 'a: path zaczyna sie w miescie zrodlowym');
eq(near.pathHexes[near.pathHexes.length - 1], '5,0', 'a: path konczy sie w miescie docelowym');

// (b) R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1 (GOAL 1, 2026-09-03): dawny prog
// dystansu USUNIETY -- 20 heksow > dawne lad_max_dystans=12, ale teren jest w
// calosci przechodni (plaska rownina) -> DZIS connected=true (odwrotnie niz przed
// ta zmiana). Zero gornego limitu dystansu w linii prostej, patrz KRYTERIUM
// KONCA #1 dispatchu.
const far = TR.findCityConnection(cityFar1, cityFar2, map, 'lad');
assert(far.connected, 'b: 20 heksow na przechodnim ladzie -> connected mimo przekroczenia dawnego progu 12 (GOAL 1: prog usuniety)');
eq(far.distance, 20, 'b: dystans poprawnie raportowany');
eq(far.pathHexes.length, 21, 'b: path 21 hexow (0..20 wlacznie), zaden limit nie ucina sciezki');
eq(far.pathHexes[0], '0,0', 'b: path zaczyna sie w miescie zrodlowym');
eq(far.pathHexes[far.pathHexes.length - 1], '20,0', 'b: path konczy sie w miescie docelowym');

// (b2) KRYTERIUM KONCA #5 dispatchu: fizyczna nieosiagalnosc NADAL blokuje trase
// -- to nie jest limit dystansu, tylko realna geografia (Gory nieprzechodnie dla
// ladu). Dystans tej pary (4 heksy) jest MNIEJSZY niz dawny prog 12, a mimo to
// not-connected, bo miedzy miastami fizycznie nie ma przechodniej sciezki.
const mountainBlocked = TR.findCityConnection(cityMountain1, cityMountain2, map, 'lad');
assert(!mountainBlocked.connected, 'b2: pas Gor (nieprzechodnich dla ladu) blokuje trase mimo bliskiego dystansu (4) -- fizyczna geografia, nie limit dystansu');
eq(mountainBlocked.distance, 4, 'b2: dystans = hexDistance(3,20 -> 7,20) = 4 (daleko ponizej dawnego progu 12, a mimo to zablokowane)');
eq(mountainBlocked.pathHexes.length, 0, 'b2: brak path gdy not connected');

// (c) rozdzielone woda bez portow = not connected (lad)
const landBlocked = TR.findCityConnection(cityWater1, cityWater2, map, 'lad');
assert(!landBlocked.connected, 'c: pas morza blokuje trase ladowa -> not connected');
eq(landBlocked.distance, 4, 'c: dystans = hexDistance(3,10 -> 7,10) = 4 (fizycznie zablokowane przez teren, nie przez limit dystansu)');

// (c-bis) bez portow trasa morska tez niemozliwa (brak Portu w obu miastach)
const seaNoPort = TR.findCityConnection(cityWater1, cityWater2, map, 'morze', TR.DEFAULT_TRADE_ROUTE_PARAMS, new Map());
assert(!seaNoPort.connected, 'c-bis: brak Portu w obu miastach -> szlak morski niemozliwy');

// (d) z portami przez wode = connected (morze)
const builtByCity = new Map([
  ['c5', ['port']],
  ['c6', ['port_wielki']],
]);
const sea = TR.findCityConnection(cityWater1, cityWater2, map, 'morze', TR.DEFAULT_TRADE_ROUTE_PARAMS, builtByCity);
assert(sea.connected, 'd: oba miasta z Portem + sciezka po wodzie -> connected');
eq(sea.distance, 4, 'd: dystans jak wyzej (4)');
assert(sea.pathHexes.length >= 3, 'd: path obejmuje przynajmniej odcinek wodny + centra miast');
eq(sea.pathHexes[0], '3,10', 'd: path zaczyna sie w miescie zrodlowym');
eq(sea.pathHexes[sea.pathHexes.length - 1], '7,10', 'd: path konczy sie w miescie docelowym');

// tylko jeden Port -> nadal not connected
const builtOnlyOne = new Map([['c5', ['port']]]);
const seaOnePort = TR.findCityConnection(cityWater1, cityWater2, map, 'morze', TR.DEFAULT_TRADE_ROUTE_PARAMS, builtOnlyOne);
assert(!seaOnePort.connected, 'd-bis: Port tylko w jednym miescie -> not connected');

// (e) determinizm -- ten sam wynik dla tego samego wejscia (rowniez z cache'a)
const near2 = TR.findCityConnection(cityNear1, cityNear2, map, 'lad');
eq(near2.connected, near.connected, 'e: determinizm - connected identyczny');
eq(near2.distance, near.distance, 'e: determinizm - distance identyczny');
eq(JSON.stringify(near2.pathHexes), JSON.stringify(near.pathHexes), 'e: determinizm - pathHexes identyczne');
assert(near2 === near, 'e: druga wywolanie trafia w cache (ta sama referencja obiektu)');

const sea2 = TR.findCityConnection(cityWater1, cityWater2, map, 'morze', TR.DEFAULT_TRADE_ROUTE_PARAMS, builtByCity);
assert(sea2 === sea, 'e: cache morza -- ta sama referencja dla identycznego wejscia (w tym stanu Portow)');

// cache musi sie zmienic (nowy wpis, nie stary wynik), gdy zmienia sie stan Portow
const seaAfterPortChange = TR.findCityConnection(cityWater1, cityWater2, map, 'morze', TR.DEFAULT_TRADE_ROUTE_PARAMS, builtOnlyOne);
assert(seaAfterPortChange !== sea, 'e: zmiana stanu Portow -> inny wpis cache, nie stary wynik');
assert(!seaAfterPortChange.connected, 'e: po zmianie stanu Portow wynik poprawnie not-connected');

// createTradeRoute / tradeRouteId -- rekord z E2 (bez wpiecia w stan gry)
const route = TR.createTradeRoute(cityNear1, cityNear2, map, 'lad');
eq(route.id, TR.tradeRouteId('c1', 'c2', 'lad'), 'TradeRoute: id deterministyczny');
eq(route.fromCityId, 'c1', 'TradeRoute: fromCityId'); eq(route.toCityId, 'c2', 'TradeRoute: toCityId');
eq(route.ownerId, 0, 'TradeRoute: ownerId = fromCity.ownerId'); eq(route.toOwnerId, 1, 'TradeRoute: toOwnerId = toCity.ownerId');
eq(route.medium, 'lad', 'TradeRoute: medium'); eq(route.dystans, 5, 'TradeRoute: dystans');
eq(route.status, 'polaczony', 'TradeRoute: status polaczony gdy connected');
// T3 (R-HANDEL-SZLAKI-PRZEBUDOWA-Q1): budynekOdblokowany -- domyslnie builtByCity
// pusty -> zadne miasto nie ma budynku handlowego -> false. createTradeRoute jest
// samodzielnym konstruktorem (poza priorytetem wielu tras z refreshTradeRoutes) --
// liczy pokrycie wprost z obu miast tej jednej trasy.
eq(route.budynekOdblokowany, false, 'TradeRoute: budynekOdblokowany=false gdy builtByCity pusty (domyslny)');

const routeWithBuildings = TR.createTradeRoute(
  cityNear1, cityNear2, map, 'lad', TR.DEFAULT_TRADE_ROUTE_PARAMS,
  new Map([['c1', ['targowisko']], ['c2', ['targowisko']]]),
);
eq(routeWithBuildings.budynekOdblokowany, true, 'TradeRoute: budynekOdblokowany=true gdy oba miasta maja budynek handlowy');

const routeOneSided = TR.createTradeRoute(
  cityNear1, cityNear2, map, 'lad', TR.DEFAULT_TRADE_ROUTE_PARAMS,
  new Map([['c1', ['targowisko']]]),
);
eq(routeOneSided.budynekOdblokowany, false, 'TradeRoute: budynekOdblokowany=false gdy tylko JEDNA strona ma budynek handlowy');

// GOAL 1 (R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1): trasa daleka (20 heksow), ale
// fizycznie przechodnia -- od tej zmiany JEST polaczona (dawniej: brak_polaczenia
// wylacznie z powodu przekroczenia progu dystansu 12).
const routeFar = TR.createTradeRoute(cityFar1, cityFar2, map, 'lad');
eq(routeFar.status, 'polaczony', 'TradeRoute: status polaczony mimo dystansu 20 > dawny prog 12 (GOAL 1: prog usuniety, teren przechodni)');
eq(routeFar.dystans, 20, 'TradeRoute: dystans dalekiej, ale polaczonej trasy raportowany poprawnie');
eq(routeFar.budynekOdblokowany, false, 'TradeRoute: budynekOdblokowany=false (brak builtByCity), niezaleznie od polaczenia');

// KRYTERIUM KONCA #5 dispatchu: trasa fizycznie zablokowana (Gory) pozostaje
// brak_polaczenia -- to NIE jest limit dystansu (dystans=4, daleko ponizej
// dawnego progu 12), tylko realna geografia.
const routeMountainBlocked = TR.createTradeRoute(cityMountain1, cityMountain2, map, 'lad');
eq(routeMountainBlocked.status, 'brak_polaczenia', 'TradeRoute: status brak_polaczenia gdy fizycznie zablokowane (Gory), niezaleznie od GOAL 1');
eq(routeMountainBlocked.budynekOdblokowany, false, 'TradeRoute: budynekOdblokowany=false gdy trasa nawet nie polaczona (brak builtByCity)');

// loadTradeRouteParams -- odporne na braki + czyta z JSON
eq(
  TR.loadTradeRouteParams({ handel_szlaki: { lad_max_dystans: { normal: 9 }, morze_max_dystans: { normal: 18 } } }, 'normal').ladMaxDist,
  9, 'params: czyta lad_max_dystans z JSON',
);
eq(
  TR.loadTradeRouteParams({}, 'normal').morzeMaxDist,
  TR.DEFAULT_TRADE_ROUTE_PARAMS.morzeMaxDist, 'params: fallback na domyslna gdy brak bloku',
);

// --- TEMAT #5: diffTradeRoutes (powiadomienia o powstaniu/zerwaniu szlaku) ---

const rA = { id: 'a->b:lad', fromCityId: 'a', toCityId: 'b', ownerId: 0, toOwnerId: 1, medium: 'lad', dystans: 3, status: 'polaczony' };
const rB = { id: 'a->c:lad', fromCityId: 'a', toCityId: 'c', ownerId: 0, toOwnerId: 2, medium: 'lad', dystans: 5, status: 'polaczony' };
const rC = { id: 'a->d:morze', fromCityId: 'a', toCityId: 'd', ownerId: 0, toOwnerId: 3, medium: 'morze', dystans: 8, status: 'polaczony' };

// f: brak zmian -> puste added/removed
const diffNone = TR.diffTradeRoutes([rA, rB], [rA, rB]);
eq(diffNone.added.length, 0, 'diff f: brak zmian -> added puste');
eq(diffNone.removed.length, 0, 'diff f: brak zmian -> removed puste');

// g: nowa trasa (rB) dochodzi -> added=[rB], removed=[]
const diffAdd = TR.diffTradeRoutes([rA], [rA, rB]);
eq(diffAdd.added.length, 1, 'diff g: jedna nowa trasa wykryta');
eq(diffAdd.added[0].id, rB.id, 'diff g: nowa trasa to rB');
eq(diffAdd.removed.length, 0, 'diff g: nic nie zniknelo');

// h: trasa (rA) znika -> added=[], removed=[rA]
const diffRemove = TR.diffTradeRoutes([rA, rB], [rB]);
eq(diffRemove.added.length, 0, 'diff h: nic nowego');
eq(diffRemove.removed.length, 1, 'diff h: jedna trasa zerwana wykryta');
eq(diffRemove.removed[0].id, rA.id, 'diff h: zerwana trasa to rA');

// i: jednoczesnie nowa + zerwana (rB znika, rC dochodzi)
const diffBoth = TR.diffTradeRoutes([rA, rB], [rA, rC]);
eq(diffBoth.added.length, 1, 'diff i: jedna nowa (rC)');
eq(diffBoth.added[0].id, rC.id, 'diff i: nowa to rC');
eq(diffBoth.removed.length, 1, 'diff i: jedna zerwana (rB)');
eq(diffBoth.removed[0].id, rB.id, 'diff i: zerwana to rB');

// j: puste listy wejsciowe -> puste wyjscie (brak wyjatku)
const diffEmpty = TR.diffTradeRoutes([], []);
eq(diffEmpty.added.length, 0, 'diff j: puste wejscie -> added puste');
eq(diffEmpty.removed.length, 0, 'diff j: puste wejscie -> removed puste');

// k: powtorne wywolanie z tymi samymi listami daje ten sam wynik (determinizm,
// podstawa dla "brak duplikatow przy wielokrotnym przeliczeniu w tej samej turze"
// -- to wywolujacy w main.ts gwarantuje jedno przeliczenie/ture, ale sama funkcja
// musi byc czysta i powtarzalna).
const diffAgain = TR.diffTradeRoutes([rA, rB], [rA, rC]);
eq(JSON.stringify(diffAgain.added.map(r => r.id)), JSON.stringify(diffBoth.added.map(r => r.id)), 'diff k: determinizm - added identyczne');
eq(JSON.stringify(diffAgain.removed.map(r => r.id)), JSON.stringify(diffBoth.removed.map(r => r.id)), 'diff k: determinizm - removed identyczne');

// --- R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE (runda 3, B1): computeSeaTradeRouteCountByCity /
// computeSeaTradeBonusIncomeByCity / PORT_SEA_TRADE_BONUS_PIENIADZ, testowane bezposrednio
// (bez detekcji geometrycznej -- proste fixture'y TradeRoute-ksztaltne). ---

function seaRoute(id, from, to, status) {
  return { id, fromCityId: from, toCityId: to, ownerId: 0, toOwnerId: 1, medium: 'morze', dystans: 3, status: status ?? 'polaczony' };
}
function ladRoute(id, from, to) {
  return { id, fromCityId: from, toCityId: to, ownerId: 0, toOwnerId: 1, medium: 'lad', dystans: 3, status: 'polaczony' };
}

// l1: dwie trasy medium='morze' status='polaczony' na to samo miasto ('a') -> count=2
const seaTwo = [seaRoute('a->b:morze', 'a', 'b'), seaRoute('a->c:morze', 'a', 'c')];
const countTwo = TR.computeSeaTradeRouteCountByCity(seaTwo);
eq(countTwo.get('a'), 2, 'l1: dwie polaczone trasy morskie na to samo miasto -> count=2');

// l2: trasa medium='lad' NIE wchodzi do licznika
const mixedWithLad = [...seaTwo, ladRoute('a->d:lad', 'a', 'd')];
const countWithLad = TR.computeSeaTradeRouteCountByCity(mixedWithLad);
eq(countWithLad.get('a'), 2, 'l2: dolozenie trasy ladowej NIE zmienia licznika morskiego miasta a');
assert(!countWithLad.has('d'), 'l2: partner trasy ladowej (d) nie dostaje wpisu w mapie tras morskich');

// l3: trasa o statusie innym niz 'polaczony' NIE wchodzi do licznika
const mixedWithBroken = [...seaTwo, seaRoute('a->e:morze', 'a', 'e', 'brak_polaczenia')];
const countWithBroken = TR.computeSeaTradeRouteCountByCity(mixedWithBroken);
eq(countWithBroken.get('a'), 2, "l3: trasa morska ze statusem != 'polaczony' NIE dolicza sie do count miasta a");
assert(!countWithBroken.has('e'), "l3: partner niepolaczonej trasy (e) nie dostaje wpisu w mapie");

// l4: count=1 -> bonus NIEOBECNY w mapie wyniku (klucz w ogole nie istnieje)
const bonusSolo = TR.computeSeaTradeBonusIncomeByCity(new Map([['solo', 1]]));
assert(!bonusSolo.has('solo'), 'l4: count=1 (tylko pierwsza trasa "juz oplacona") -> brak klucza w mapie bonusu');

// l5: count=3 -> bonus = 2 x PORT_SEA_TRADE_BONUS_PIENIADZ (2 trasy PONAD pierwsza)
const bonusThree = TR.computeSeaTradeBonusIncomeByCity(new Map([['trzy', 3]]));
eq(bonusThree.get('trzy'), 2 * TR.PORT_SEA_TRADE_BONUS_PIENIADZ, 'l5: count=3 -> bonus = 2 x PORT_SEA_TRADE_BONUS_PIENIADZ');

// l6: PORT_SEA_TRADE_BONUS_PIENIADZ przypiete wprost jako stala = 1
eq(TR.PORT_SEA_TRADE_BONUS_PIENIADZ, 1, 'l6: PORT_SEA_TRADE_BONUS_PIENIADZ === 1 (stala, pkt Pieniadza/ture na trase ponad pierwsza)');

// l7: obie strony trasy (fromCityId i toCityId) dostaja wpis w mapie wyniku computeSeaTradeRouteCountByCity
const singleSea = [seaRoute('x->y:morze', 'x', 'y')];
const countSingle = TR.computeSeaTradeRouteCountByCity(singleSea);
eq(countSingle.get('x'), 1, 'l7: fromCityId (x) dostaje wpis w mapie wyniku');
eq(countSingle.get('y'), 1, 'l7: toCityId (y) dostaje wpis w mapie wyniku');

// ---------------------------------------------------------------------------
// GOAL 5 (R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1): diagnoseMissingTradeRouteForPartner
// -- dawny martwy branch "za daleko (N heks.)" usuniety (dystans juz nie blokuje
// connectivity, patrz GOAL 1), rozroznienie "brak Portu" vs "fizyczna
// nieosiagalnosc" zamiast jednego ogolnego komunikatu.
// ---------------------------------------------------------------------------
const NO_WAR = () => false;
const WAR = () => true;

// (m1) para daleka (20 heksow), ale fizycznie polaczona (GOAL 1) -> diagnoza
// null, nic do zdiagnozowania (trasa geometrycznie istnieje).
const diagFar = TR.diagnoseMissingTradeRouteForPartner(0, 1, [cityFar1, cityFar2], map, new Map(), NO_WAR);
eq(diagFar, null, 'm1: para daleka (20 heksow) ale fizycznie polaczona (GOAL 1) -> diagnoza null');

// (m2) wojna -> zawsze ten komunikat, niezaleznie od geometrii.
const diagWar = TR.diagnoseMissingTradeRouteForPartner(0, 1, [cityNear1, cityNear2], map, new Map(), WAR);
eq(diagWar, 'wojna — szlaki zawieszone', 'm2: wojna blokuje diagnoze niezaleznie od geometrii');

// (m3) brak miast partnera.
eq(TR.diagnoseMissingTradeRouteForPartner(0, 1, [cityNear1], map, new Map(), NO_WAR), 'brak miast do handlu', 'm3: brak miast partnera -> "brak miast do handlu"');

// (m4) para fizycznie zablokowana Gorami (dystans=4, DALEKO PONIZEJ dawnego progu
// 12) i BEZ Portu w zadnym miescie -> komunikat NIE wspomina juz dystansu
// (martwy dawny branch "za daleko" usuniety), wspomina Port jako brakujacy
// warunek szlaku morskiego.
const diagMountainNoPort = TR.diagnoseMissingTradeRouteForPartner(0, 1, [cityMountain1, cityMountain2], map, new Map(), NO_WAR);
assert(diagMountainNoPort !== null, 'm4: para fizycznie zablokowana -> diagnoza NIE jest null');
assert(!diagMountainNoPort.includes('za daleko'), 'm4: GOAL 5 -- komunikat NIE zawiera juz martwego dawnego tekstu "za daleko"');
assert(diagMountainNoPort.includes('Port'), 'm4: brak Portu w zadnym miescie -> komunikat wspomina Port');

// (m5) fizycznie zablokowane Gorami, ale OBA miasta maja Port (wciaz brak wody
// przy ktoryms z miast na tym rzedzie mapy -> szlak morski nadal fizycznie
// niemozliwy) -> komunikat generyczny "rozne kontynenty/wyspy", bez zarzutu
// braku Portu (bo Port jest -- po prostu nie ma dokad nim plynac).
const builtMountainBothPorts = new Map([['c7', ['port']], ['c8', ['port']]]);
const diagMountainWithPort = TR.diagnoseMissingTradeRouteForPartner(0, 1, [cityMountain1, cityMountain2], map, builtMountainBothPorts, NO_WAR);
assert(diagMountainWithPort !== null, 'm5: nadal fizycznie zablokowane (brak wody przy miastach) -> diagnoza NIE jest null mimo Portow');
assert(!diagMountainWithPort.includes('za daleko'), 'm5: GOAL 5 -- brak martwego tekstu "za daleko"');
assert(!diagMountainWithPort.includes('brak Portu'), 'm5: oba miasta MAJA Port -> komunikat nie zarzuca braku Portu (rozroznienie przyczyn z GOAL 5)');

console.log(`\ntrade-routes-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
