'use strict';
/**
 * building-queue-refund-test.cjs — zwrot koszt_surowce przy anulowaniu kolejki budowy.
 *
 * Run from gra/:  node tools/building-queue-refund-test.cjs
 *
 * Scenariusz: enqueue pobiera surowiec z puli państwa (deductBuildingStockCostAcrossCities),
 * cancelQueueItem (UI) / refundBuildingStockCostAcrossCities przywraca pełną kwotę.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[building-queue-refund-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.building-queue-refund-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.building-queue-refund-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  buildingStockCost,
  ownerResourceStock,
  deductBuildingStockCostAcrossCities,
  refundBuildingStockCostAcrossCities,
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
  console.error('[building-queue-refund-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const buildings = require('../data/buildings.json');

let passed = 0;
let failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function makeCities(spec) {
  return spec.map(s => ({
    id: s.id,
    ownerId: s.ownerId,
    surowce: { ...(s.surowce ?? {}) },
  }));
}

console.log('-- building-queue-refund: enqueue pobór + cancel zwrot --');
{
  const stolarnia = buildings.find(b => b.id === 'stolarnia');
  assert(!!stolarnia, 'buildings.json: stolarnia istnieje');
  const cost = M.buildingStockCost(stolarnia);
  eq(cost.drewno, 10, 'stolarnia koszt_surowce.drewno FALA2×2 = 10');

  const cities = makeCities([
    { id: 'c1', ownerId: 0, surowce: { drewno: 3 } },
    { id: 'c2', ownerId: 0, surowce: { drewno: 12 } },
  ]);
  const before = M.ownerResourceStock(cities, 0, 'drewno');
  eq(before, 15, 'pula państwa przed enqueue: 3+12=15');

  M.deductBuildingStockCostAcrossCities(cities, 0, cost);
  const afterEnqueue = M.ownerResourceStock(cities, 0, 'drewno');
  eq(afterEnqueue, 5, 'po enqueue: 15-10=5 drewna w puli');

  M.refundBuildingStockCostAcrossCities(cities, 0, cost);
  const afterCancel = M.ownerResourceStock(cities, 0, 'drewno');
  eq(afterCancel, before, 'po anulowaniu kolejki: pełny zwrot do stanu sprzed enqueue');
}

console.log(`\nbuilding-queue-refund-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
