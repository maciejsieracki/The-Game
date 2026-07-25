'use strict';
/**
 * trade-ilosc-test.cjs -- standalone Node test dla PYTANIA 53 = B (Maciej 2026-07-25):
 * przepływ ILOŚCIOWY surowca przez trasę handlową (trade-routes.ts
 * computeTradeRouteResourceFlow / loadTradeRouteResourceFlowParams), UZUPEŁNIAJĄCY
 * (nie zastępujący) boolean-grant dostępu (temat #4, trade-grant-test.cjs).
 * Run from gra/:  node tools/trade-ilosc-test.cjs
 *
 * Kontekst: Cegielnia potrzebuje Gliny (zloze wylacznie na ladzie z rzeka) -- gdy
 * cala cywilizacja jest odcieta od takiego terenu, boolean-grant "ma dostep do cegly"
 * (temat #4) nie wystarcza, bo koszt_surowce budynkow pobiera CEGLE ILOSCIOWO z puli
 * panstwa (building-stock-cost.ts ownerResourceStockAll), a grant niczego nie dokada
 * do tej puli. Ta funkcja to naprawia -- surowiec REALNIE PLYNIE.
 *
 * Pokrywa:
 *   A. Miasto bez wlasnej cegly + trasa z partnerem majacym nadwyzke -> realnie
 *      dostaje cegle do puli PANSTWA i MOZE zbudowac budynek, ktorego wczesniej
 *      nie moglo (canAffordBuildingStock z building-stock-cost.ts).
 *   B. Przeplyw nie przekracza limitu na ture (capacityPerRoutePerTurn).
 *   C. Surowiec REALNIE ubywa nadawcy (odjety z jego puli panstwa, nie "z powietrza").
 *   D. Rezerwa (minStockReserve) -- nadawca nigdy nie eksportuje ponizej progu.
 *   E. Regresja: boolean-grant dla braz/zelazo/kon (computeTradeRouteResourceGrants)
 *      dziala BEZ ZMIAN -- kon (bez magazynu ilosciowego) NIE wchodzi do przeplywu.
 *   F. Parytet AI: identyczny wynik dla dwoch roznych par ownerId (0,1) vs (5,6).
 *   G. Zapis gry bez nowych pol -- TradeRoute nie zyskal ZADNEGO nowego pola,
 *      wiec stary zapis (JSON.parse) wczytuje sie i dziala identycznie.
 *   H. Wiele tras/surowcow jednego nadawcy w jednej turze -- ledger wewnetrzny nie
 *      pozwala wyeksportowac wiecej niz realna nadwyzka (nie "podwojne liczenie").
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[trade-ilosc-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.trade-ilosc-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.trade-ilosc-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  refreshTradeRoutes, tradeRouteId,
  computeTradeRouteResourceGrants, hasTradeRouteResourceAccess,
  computeTradeRouteResourceFlow, loadTradeRouteResourceFlowParams,
  TRADE_ROUTE_RESOURCE_KEYS, TRADE_ROUTE_STOCK_FLOW_KEYS,
  DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS,
} from '../src/game/trade-routes';
export {
  ownerResourceStockAll, ownerResourceStock, canAffordBuildingStock,
  deductBuildingStockCostAcrossCities, creditOwnerResourceStock,
} from '../src/game/building-stock-cost';
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
  console.error('[trade-ilosc-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const TR = require(BUNDLE_FILE);

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// Fixture map + miasta (jak w trade-grant-test.cjs / trade-routes-income-test.cjs)
// ---------------------------------------------------------------------------
function buildMap() {
  const hexes = {};
  for (let q = 0; q <= 400; q++) hexes[`${q},0`] = { terenBazowy: 'rownina' };
  return { szerokoscQ: 401, wysokoscR: 1, hexes, seed: 1, riverPaths: [] };
}
const map = buildMap();
function city(id, ownerId, q) { return { id, ownerId, q, r: 0 }; }
const NO_WAR = () => false;
const HAS_TREATY = () => true;

/** Buduje pule "miast" (StockCitySource) do ownerResourceStockAll -- jedna na ownera. */
function stockCities(entries) {
  // entries: [{id, ownerId, surowce}]
  return entries.map(e => ({ id: e.id, ownerId: e.ownerId, surowce: { ...e.surowce } }));
}

// ---------------------------------------------------------------------------
// A + C. Miasto bez cegly + trasa z partnerem majacym nadwyzke -> realnie dostaje
// cegle do puli PANSTWA (i MOZE zbudowac budynek), a nadawcy REALNIE ubywa.
// ---------------------------------------------------------------------------
console.log('\n-- A/C. przeplyw ilosciowy cegly: odbiorca dostaje, nadawca traci --');
const p1 = city('p1', 0, 0);
const f1 = city('f1', 1, 5);
const built = new Map([['p1', ['targowisko']], ['f1', ['targowisko']]]);
const routes = TR.refreshTradeRoutes([p1, f1], [], map, built, NO_WAR, HAS_TREATY);
eq(routes.length, 1, 'A: (setup) trasa p1<->f1 istnieje');

// Gracz (owner 0): 0 cegly. Partner (owner 1): 20 cegly (duza nadwyzka).
let cities = stockCities([
  { id: 'p1', ownerId: 0, surowce: { cegla: 0 } },
  { id: 'f1', ownerId: 1, surowce: { cegla: 20 } },
]);
const ownerStockFor = (citiesArr) => (ownerId, key) => TR.ownerResourceStockAll(citiesArr, ownerId)[key] ?? 0;

const flowsA = TR.computeTradeRouteResourceFlow(routes, ownerStockFor(cities));
eq(flowsA.length, 1, 'A: dokladnie jeden przyznany transfer (cegla; braz/zelazo obie strony maja 0 -> brak nadwyzki)');
eq(flowsA[0].resourceKey, 'cegla', 'A: surowiec = cegla');
eq(flowsA[0].fromOwnerId, 1, 'A: nadawca = partner (owner 1, ma nadwyzke)');
eq(flowsA[0].toOwnerId, 0, 'A: odbiorca = gracz (owner 0, mial 0)');
assert(flowsA[0].amount > 0, 'A: ilosc transferu > 0');

// Zanim koszt budynku pobrany -- gracz NIE moze sobie pozwolic na budynek kosztujacy 10 cegly.
const cost10Cegly = { cegla: 10 };
assert(!TR.canAffordBuildingStock(TR.ownerResourceStockAll(cities, 0), cost10Cegly),
  'A: PRZED transferem gracz nie stac na budynek za 10 cegly (ma 0)');

// Aplikacja transferu (main.ts robi to samo: deduct nadawcy + credit odbiorcy).
for (const flow of flowsA) {
  TR.deductBuildingStockCostAcrossCities(cities, flow.fromOwnerId, { [flow.resourceKey]: flow.amount });
  TR.creditOwnerResourceStock(cities, flow.toOwnerId, flow.resourceKey, flow.amount);
}
const playerCeglaAfter = TR.ownerResourceStockAll(cities, 0).cegla ?? 0;
const partnerCeglaAfter = TR.ownerResourceStockAll(cities, 1).cegla ?? 0;
eq(playerCeglaAfter, flowsA[0].amount, 'C: gracz REALNIE otrzymal dokladnie tyle cegly, ile przyznal transfer');
eq(partnerCeglaAfter, 20 - flowsA[0].amount, 'C: partnerowi REALNIE ubylo dokladnie tyle cegly (nie "z powietrza")');
eq(playerCeglaAfter + partnerCeglaAfter, 20, 'C: suma cegly w obu pulach zachowana (transfer, nie kreacja surowca)');

// Budynek za 10 cegly: jesli transfer >= 10, teraz stac (test progu zalezny od capacityPerRoutePerTurn,
// wiec sprawdzamy zgodnie z realnym stanem, nie zakladamy konkretnej liczby na sztywno).
if (playerCeglaAfter >= 10) {
  assert(TR.canAffordBuildingStock(TR.ownerResourceStockAll(cities, 0), cost10Cegly),
    'A: PO transferze gracz STAC na budynek za 10 cegly, gdy transfer >= 10');
} else {
  assert(!TR.canAffordBuildingStock(TR.ownerResourceStockAll(cities, 0), cost10Cegly),
    'A: PO transferze (< 10) gracz nadal nie stac na 10 cegly -- spojne z faktycznym stanem puli');
}

// Budynek tani (mniejszy niz jednorazowy limit) -- zawsze powinien teraz przejsc
// (przyjmujemy, ze DEFAULT capacityPerRoutePerTurn >= 1, dokladna wartosc sprawdzona w B).
const cheapCost = { cegla: 1 };
assert(TR.canAffordBuildingStock(TR.ownerResourceStockAll(cities, 0), cheapCost),
  'A: PO transferze gracz stac na tani budynek (1 cegla) -- ktorego PRZEDTEM (0 cegly) nie mogl zbudowac');

// ---------------------------------------------------------------------------
// B. Przeplyw nie przekracza limitu na ture (capacityPerRoutePerTurn)
// ---------------------------------------------------------------------------
console.log('\n-- B. limit na ture (capacityPerRoutePerTurn) nie jest przekraczany --');
const cap = TR.DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS.capacityPerRoutePerTurn;
assert(Number.isFinite(cap) && cap > 0, 'B: (kontrola) capacityPerRoutePerTurn jest dodatnia liczba skonczona');
eq(flowsA[0].amount <= cap, true, 'B: transfer A nie przekracza limitu na ture');

// Ekstremalna nadwyzka (1000 cegly u partnera) -- transfer wciaz ograniczony limitem.
const citiesHuge = stockCities([
  { id: 'p1', ownerId: 0, surowce: { cegla: 0 } },
  { id: 'f1', ownerId: 1, surowce: { cegla: 1000 } },
]);
const flowsB = TR.computeTradeRouteResourceFlow(routes, ownerStockFor(citiesHuge));
const ceglaFlowB = flowsB.find(f => f.resourceKey === 'cegla');
assert(ceglaFlowB !== undefined, 'B: (kontrola) transfer cegly istnieje przy ekstremalnej nadwyzce');
eq(ceglaFlowB.amount, cap, 'B: przy ogromnej nadwyzce transfer = DOKLADNIE limit na ture, nie wiecej');

// ---------------------------------------------------------------------------
// D. Rezerwa (minStockReserve) -- nadawca nigdy nie eksportuje ponizej progu
// ---------------------------------------------------------------------------
console.log('\n-- D. minStockReserve: nadawca zachowuje rezerwe, nie oddaje wszystkiego --');
const reserve = TR.DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS.minStockReserve;
const citiesSmallSurplus = stockCities([
  { id: 'p1', ownerId: 0, surowce: { cegla: 0 } },
  { id: 'f1', ownerId: 1, surowce: { cegla: reserve + 1 } }, // dokladnie 1 szt. nadwyzki ponad rezerwe
]);
const flowsD = TR.computeTradeRouteResourceFlow(routes, ownerStockFor(citiesSmallSurplus));
const ceglaFlowD = flowsD.find(f => f.resourceKey === 'cegla');
assert(ceglaFlowD !== undefined, 'D: (kontrola) nadwyzka 1 szt. wciaz generuje transfer');
eq(ceglaFlowD.amount, 1, 'D: transfer ograniczony do realnej nadwyzki ponad rezerwe (1 szt.), nie limitu na ture');

const citiesAtReserve = stockCities([
  { id: 'p1', ownerId: 0, surowce: { cegla: 0 } },
  { id: 'f1', ownerId: 1, surowce: { cegla: reserve } }, // dokladnie na progu -- zero nadwyzki
]);
const flowsNone = TR.computeTradeRouteResourceFlow(routes, ownerStockFor(citiesAtReserve));
eq(flowsNone.find(f => f.resourceKey === 'cegla'), undefined,
  'D: brak nadwyzki ponad rezerwe -> brak transferu (nadawca nie schodzi ponizej progu)');

// loadTradeRouteResourceFlowParams czyta ISTNIEJACY (dotad niekonsumowany) klucz
// econ-params.json ekonomia_miasta.handel_surowiec_min_stock.
const rawEcon = { ekonomia_miasta: { handel_surowiec_min_stock: { easy: 2, normal: 2, hard: 2 } } };
const loaded = TR.loadTradeRouteResourceFlowParams(rawEcon, 'normal');
eq(loaded.minStockReserve, 2, 'D: loadTradeRouteResourceFlowParams czyta minStockReserve z ekonomia_miasta.handel_surowiec_min_stock');
const loadedFallback = TR.loadTradeRouteResourceFlowParams({}, 'normal');
eq(loadedFallback.minStockReserve, TR.DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS.minStockReserve,
  'D: brak bloku w econ-params.json -> fallback na wartosc domyslna (odporne na braki)');

// ---------------------------------------------------------------------------
// E. Regresja: boolean-grant (braz/zelazo/kon) dziala BEZ ZMIAN; 'kon' NIE wchodzi
//    do przeplywu ilosciowego (brak magazynu ilosciowego -- czysty odblokownik).
// ---------------------------------------------------------------------------
console.log('\n-- E. regresja: boolean-grant braz/zelazo/kon niezmieniony; kon poza przeplywem --');
function nativeAccess_partnerAllThree(ownerId, key) {
  return ownerId === 1 && (key === 'braz' || key === 'zelazo' || key === 'kon');
}
const grantsE = TR.computeTradeRouteResourceGrants(routes, nativeAccess_partnerAllThree);
eq(grantsE.length, 3, 'E: trzy grantow boolean (braz/zelazo/kon) -- mechanizm dostepu niezmieniony');
for (const key of ['braz', 'zelazo', 'kon']) {
  eq(TR.hasTradeRouteResourceAccess(grantsE, 0, key), true, `E: gracz ma boolean-grant na ${key} (regresja OK)`);
}
eq(TR.TRADE_ROUTE_STOCK_FLOW_KEYS.includes('kon'), false, 'E: kon NIE jest w TRADE_ROUTE_STOCK_FLOW_KEYS (brak magazynu ilosciowego)');
eq(TR.TRADE_ROUTE_STOCK_FLOW_KEYS.length, 3, 'E: dokladnie trzy klucze przeplywu ilosciowego (braz/zelazo/cegla)');
for (const key of ['braz', 'zelazo', 'cegla']) {
  assert(TR.TRADE_ROUTE_STOCK_FLOW_KEYS.includes(key), `E: TRADE_ROUTE_STOCK_FLOW_KEYS zawiera ${key}`);
}

// 'kon' przekazany jawnie do computeTradeRouteResourceFlow (gdyby ktos probowal) --
// funkcja i tak nie generuje transferu, bo domyslny zestaw kluczy go pomija; a jesli
// ktos jawnie przekaze 'kon' jako resourceKeys, to i tak nie ma tam zadnego "kon"
// magazynu w ownerStock (typowany na TradeRouteStockFlowResourceKey), wiec pozostaje
// wylacznie boolean-dostepem -- regresja niemozliwa przez konstrukcje typu.
const flowsKonCheck = TR.computeTradeRouteResourceFlow(routes, ownerStockFor(cities));
assert(flowsKonCheck.every(f => f.resourceKey !== 'kon'), 'E: zaden transfer nie dotyczy "kon" (domyslne resourceKeys)');

// ---------------------------------------------------------------------------
// F. Parytet AI: identyczny wynik dla pary (0,1) vs (5,6) -- zero galezi po ownerId.
// ---------------------------------------------------------------------------
console.log('\n-- F. parytet AI: (0,1) vs (5,6) daja identyczny ksztalt wyniku --');
const routeShifted = { ...routes[0], ownerId: 5, toOwnerId: 6, fromCityId: 'p9', toCityId: 'f9' };
const citiesShifted = stockCities([
  { id: 'p9', ownerId: 5, surowce: { cegla: 0 } },
  { id: 'f9', ownerId: 6, surowce: { cegla: 20 } },
]);
const flowsShifted = TR.computeTradeRouteResourceFlow([routeShifted], ownerStockFor(citiesShifted));
eq(flowsShifted.length, flowsA.length, 'F: parytet -- taka sama liczba transferow dla pary (5,6) jak dla (0,1)');
eq(flowsShifted[0].amount, flowsA[0].amount, 'F: parytet -- identyczna ilosc transferu niezaleznie od tozsamosci ownerId');
eq(flowsShifted[0].fromOwnerId, 6, 'F: parytet -- nadawca poprawnie = owner 6 (partner z nadwyzka), nie hardkodowane 1');
eq(flowsShifted[0].toOwnerId, 5, 'F: parytet -- odbiorca poprawnie = owner 5 (gracz w tym teście), nie hardkodowane 0');

// ---------------------------------------------------------------------------
// G. Zapis gry bez nowych pol -- TradeRoute nie zyskal zadnego nowego pola,
//    wiec "stary" zapis (bez modyfikacji) dziala identycznie po JSON roundtrip.
// ---------------------------------------------------------------------------
console.log('\n-- G. kompatybilnosc starych zapisow: TradeRoute bez nowych pol --');
const oldSaveRouteJson = JSON.stringify(routes[0]); // symuluje odczyt z pliku zapisu
const oldSaveRoute = JSON.parse(oldSaveRouteJson);
assert(!('flowState' in oldSaveRoute), 'G: TradeRoute NIE ma zadnego nowego pola stanu przeplywu (nic do serializacji)');
let threwOnOldSave = false;
let flowsFromOldSave = [];
try {
  flowsFromOldSave = TR.computeTradeRouteResourceFlow([oldSaveRoute], ownerStockFor(cities));
} catch (e) {
  threwOnOldSave = true;
}
eq(threwOnOldSave, false, 'G: computeTradeRouteResourceFlow nie rzuca wyjatkiem na "starej" (bez nowych pol) trasie');
assert(Array.isArray(flowsFromOldSave), 'G: zwraca tablice tak samo jak dla trasy stworzonej "na swiezo"');

// ---------------------------------------------------------------------------
// H. Wiele tras jednego nadawcy w jednej turze -- ledger wewnetrzny pilnuje,
//    zeby suma transferow nie przekroczyla realnej nadwyzki (brak "podwojnego liczenia").
// ---------------------------------------------------------------------------
console.log('\n-- H. wiele tras jednego nadawcy: suma transferow nie przekracza realnej nadwyzki --');
const f2 = city('f2', 2, 8);
const p2 = city('p2', 3, 3);
const builtMulti = new Map([['p1', ['targowisko']], ['f1', ['targowisko']], ['f2', ['targowisko']], ['p2', ['targowisko']]]);
// Dwie ODDZIELNE trasy: partner (owner 1) -> gracz (owner 0), ORAZ partner (owner 1) -> inny gracz (owner 3),
// zeby ten sam nadawca (owner 1) mial DWIE trasy jednoczesnie w jednej turze.
const routesMulti = [
  { id: 'p1->f1:lad', fromCityId: 'p1', toCityId: 'f1', ownerId: 0, toOwnerId: 1, medium: 'lad', dystans: 5, status: 'polaczony' },
  { id: 'p2->f1:lad', fromCityId: 'p2', toCityId: 'f1', ownerId: 3, toOwnerId: 1, medium: 'lad', dystans: 5, status: 'polaczony' },
];
// Nadawca (owner 1) ma TYLKO reserve+3 cegly -- niewystarczajaco na dwa pelne transfery limitu,
// jesli limit > 3 (przy DEFAULT cap=4 to dokladnie test "ledger nie pozwala przekroczyc").
const smallSurplusTotal = reserve + 3;
const citiesMulti = stockCities([
  { id: 'p1', ownerId: 0, surowce: { cegla: 0 } },
  { id: 'p2', ownerId: 3, surowce: { cegla: 0 } },
  { id: 'f1', ownerId: 1, surowce: { cegla: smallSurplusTotal } },
]);
const flowsMulti = TR.computeTradeRouteResourceFlow(routesMulti, ownerStockFor(citiesMulti));
const totalFromOwner1 = flowsMulti.filter(f => f.fromOwnerId === 1 && f.resourceKey === 'cegla').reduce((s, f) => s + f.amount, 0);
assert(totalFromOwner1 <= smallSurplusTotal - reserve,
  `H: suma wyeksportowanej cegly przez ownera 1 (${totalFromOwner1}) nie przekracza realnej nadwyzki (${smallSurplusTotal - reserve})`);
assert(totalFromOwner1 > 0, 'H: (kontrola) przynajmniej jeden transfer faktycznie zaszedl');

console.log(`\ntrade-ilosc-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
