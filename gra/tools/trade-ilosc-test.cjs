'use strict';
/**
 * trade-ilosc-test.cjs -- standalone Node test dla R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1
 * (decyzja ABC 2026-11-15, wariant A, #311): aktywny szlak handlowy NIE przenosi zapasów
 * żadnej strony. Zostaje: boolean-grant dostępu do jednostek (computeTradeRouteResourceGrants)
 * oraz kontakt/limity szlaku. Przepływ ilościowy (computeTradeRouteResourceFlow,
 * loadTradeRouteResourceFlowParams, TRADE_ROUTE_STOCK_FLOW_KEYS, DEFAULT_..._FLOW_PARAMS)
 * został usunięty z trade-routes.ts.
 * Run from gra/:  node tools/trade-ilosc-test.cjs
 *
 * Pokrywa:
 *   A. Brak eksportu przepływu ilościowego (regresja = przywrócenie E3c -> test czerwony).
 *   B. Grant boolean dla braz/zelazo/kon (computeTradeRouteResourceGrants) działa BEZ ZMIAN.
 *   C. Parytet AI: ta sama reguła grantu dla pary (0,1) i (5,6).
 *   D. Trasa nie zyskała pól przepływu (stary zapis wczytuje się identycznie).
 *   E. Kod gry (main.ts, trade-routes.ts) nie wywołuje ani nie definiuje przepływu.
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
export * as TRADE_MODULE from '../src/game/trade-routes';
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

const TR = require(BUNDLE_FILE).TRADE_MODULE;

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// Fixture map + miasta
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

// ---------------------------------------------------------------------------
// A. Szlak NIE przenosi zapasów -- przepływ ilościowy NIE istnieje w module.
// ---------------------------------------------------------------------------
console.log('\n-- A. brak przepływu ilościowego szlaku (R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1) --');
eq(TR.computeTradeRouteResourceFlow, undefined, 'A: computeTradeRouteResourceFlow nie jest eksportowana');
eq(TR.loadTradeRouteResourceFlowParams, undefined, 'A: loadTradeRouteResourceFlowParams nie jest eksportowana');
eq(TR.TRADE_ROUTE_STOCK_FLOW_KEYS, undefined, 'A: TRADE_ROUTE_STOCK_FLOW_KEYS nie jest eksportowana');
eq(TR.DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS, undefined, 'A: DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS nie jest eksportowana');

// ---------------------------------------------------------------------------
// B. Grant boolean (dostęp do jednostek) dla braz/zelazo/kon -- BEZ ZMIAN.
// ---------------------------------------------------------------------------
console.log('\n-- B. grant boolean braz/zelazo/kon działa bez zmian --');
const p1 = city('p1', 0, 0);
const f1 = city('f1', 1, 5);
const built = new Map([['p1', ['targowisko']], ['f1', ['targowisko']]]);
const routes = TR.refreshTradeRoutes([p1, f1], [], map, built, NO_WAR, HAS_TREATY);
eq(routes.length, 1, 'B: (setup) trasa p1<->f1 istnieje');

const partnerHasAll = (ownerId) => ownerId === 1; // partner ma braz/zelazo/kon natywnie
const grantsB = TR.computeTradeRouteResourceGrants(routes, (ownerId, key) =>
  ownerId === 1 && (key === 'braz' || key === 'zelazo' || key === 'kon'));
for (const key of ['braz', 'zelazo', 'kon']) {
  assert(TR.hasTradeRouteResourceAccess(grantsB, 0, key) === true,
    `B: gracz (owner 0) ma boolean-grant do ${key} z partnera`);
  assert(TR.hasTradeRouteResourceAccess(grantsB, 1, key) === false,
    `B: partner NIE dostaje grantu na własny surowiec ${key}`);
}
eq(grantsB.length, 3, 'B: dokładnie 3 granty (braz, zelazo, kon) -- boolean, bez ilości');
assert(!('amount' in grantsB[0]), 'B: grant nie niesie ilości (boolean, nie przepływ)');
assert(partnerHasAll(1) && !partnerHasAll(0), 'B: (setup) rola partnera');

// ---------------------------------------------------------------------------
// C. Parytet AI -- ta sama reguła grantu dla pary (5,6).
// ---------------------------------------------------------------------------
console.log('\n-- C. parytet AI: grant dla pary (5,6) identyczny w regule --');
const routeShifted = { ...routes[0], id: 'p9-f9-shift', ownerId: 5, toOwnerId: 6, fromCityId: 'p9', toCityId: 'f9' };
const grantsC = TR.computeTradeRouteResourceGrants([routeShifted], (ownerId, key) =>
  ownerId === 6 && key === 'kon');
eq(grantsC.length, 1, 'C: dokładnie jeden grant dla pary (5,6)');
eq(grantsC[0].ownerId, 5, 'C: odbiorca = owner 5 (nie zaszyte 0)');
assert(TR.hasTradeRouteResourceAccess(grantsC, 5, 'kon') === true, 'C: AI (owner 5) ma boolean-grant do konia');

// ---------------------------------------------------------------------------
// D. Trasa nie zyskała pól przepływu -- stary zapis (bez nowych pól) działa identycznie.
// ---------------------------------------------------------------------------
console.log('\n-- D. brak nowych pól w TradeRoute (zgodność zapisu) --');
const allowedKeys = new Set(Object.keys(routes[0]));
const oldSave = JSON.parse(JSON.stringify(routes[0]));
let threw = false, grantsOld = null;
try {
  grantsOld = TR.computeTradeRouteResourceGrants([oldSave], (ownerId, key) => ownerId === 1 && key === 'braz');
} catch (e) { threw = true; }
eq(threw, false, 'D: computeTradeRouteResourceGrants nie rzuca na zapisanej trasie');
assert(grantsOld && grantsOld.length === 1, 'D: stara trasa daje grant boolean (zgodność zapisu)');
assert(![...allowedKeys].some(k => /flow|stock|przeplyw|amount/i.test(k)),
  `D: TradeRoute nie ma pól przepływu/zapasu (klucze: ${[...allowedKeys].join(', ')})`);

// ---------------------------------------------------------------------------
// E. Kod gry: brak wywołania i definicji przepływu (statyczne sprawdzenie źródła).
// ---------------------------------------------------------------------------
console.log('\n-- E. źródła gry: brak przepływu ilościowego szlaku --');
const mainSrc = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');
const routesSrc = fs.readFileSync(path.join(GRA, 'src/game/trade-routes.ts'), 'utf8');
assert(!/computeTradeRouteResourceFlow\s*\(/.test(mainSrc), 'E: main.ts NIE wywołuje computeTradeRouteResourceFlow(');
assert(!/loadTradeRouteResourceFlowParams\s*\(/.test(mainSrc), 'E: main.ts NIE wywołuje loadTradeRouteResourceFlowParams(');
assert(!/computeTradeRouteResourceFlow|TRADE_ROUTE_STOCK_FLOW_KEYS/.test(routesSrc),
  'E: trade-routes.ts nie definiuje już przepływu ilościowego');

console.log(`\ntrade-ilosc-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
