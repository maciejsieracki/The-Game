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
  loadTradeRouteParams,
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
// Fixture map: two rows.
//   r=0  : q=0..30 flat land (rownina)               -- used for a/b/e (lad only)
//   r=10 : q=0..10 land | q=4..6 morze | q=7..10 land -- used for c/d (lad+morze)
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
  return { szerokoscQ: 31, wysokoscR: 11, hexes, seed: 1, riverPaths: [] };
}

const map = buildMap();

const cityNear1 = { id: 'c1', ownerId: 0, q: 0, r: 0 };
const cityNear2 = { id: 'c2', ownerId: 1, q: 5, r: 0 };
const cityFar1  = { id: 'c3', ownerId: 0, q: 0, r: 0 };
const cityFar2  = { id: 'c4', ownerId: 1, q: 20, r: 0 };
const cityWater1 = { id: 'c5', ownerId: 0, q: 3, r: 10 };
const cityWater2 = { id: 'c6', ownerId: 1, q: 7, r: 10 };

// (a) dwa miasta blisko na ladzie = connected, distance poprawny
const near = TR.findCityConnection(cityNear1, cityNear2, map, 'lad');
assert(near.connected, 'a: blisko na ladzie -> connected');
eq(near.distance, 5, 'a: dystans = hexDistance(0,0 -> 5,0) = 5');
eq(near.pathHexes.length, 6, 'a: path 6 hexow (0..5 wlacznie)');
eq(near.pathHexes[0], '0,0', 'a: path zaczyna sie w miescie zrodlowym');
eq(near.pathHexes[near.pathHexes.length - 1], '5,0', 'a: path konczy sie w miescie docelowym');

// (b) za daleko = not connected
const far = TR.findCityConnection(cityFar1, cityFar2, map, 'lad');
assert(!far.connected, 'b: za daleko (20 heksow > lad_max_dystans=12) -> not connected');
eq(far.distance, 20, 'b: dystans nadal raportowany mimo not-connected');
eq(far.pathHexes.length, 0, 'b: brak path gdy not connected');

// (c) rozdzielone woda bez portow = not connected (lad)
const landBlocked = TR.findCityConnection(cityWater1, cityWater2, map, 'lad');
assert(!landBlocked.connected, 'c: pas morza blokuje trase ladowa -> not connected');
eq(landBlocked.distance, 4, 'c: dystans = hexDistance(3,10 -> 7,10) = 4 (<= prog, ale teren blokuje)');

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

const routeFar = TR.createTradeRoute(cityFar1, cityFar2, map, 'lad');
eq(routeFar.status, 'brak_polaczenia', 'TradeRoute: status brak_polaczenia gdy not connected');

// loadTradeRouteParams -- odporne na braki + czyta z JSON
eq(
  TR.loadTradeRouteParams({ handel_szlaki: { lad_max_dystans: { normal: 9 }, morze_max_dystans: { normal: 18 } } }, 'normal').ladMaxDist,
  9, 'params: czyta lad_max_dystans z JSON',
);
eq(
  TR.loadTradeRouteParams({}, 'normal').morzeMaxDist,
  TR.DEFAULT_TRADE_ROUTE_PARAMS.morzeMaxDist, 'params: fallback na domyslna gdy brak bloku',
);

console.log(`\ntrade-routes-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
