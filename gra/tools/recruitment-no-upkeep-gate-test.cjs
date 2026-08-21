'use strict';
/** Contract test: recruitment affordability is stock-only; upkeep is next-turn accounting. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.recruitment-no-upkeep-gate-entry.ts');
const bundle = path.resolve(__dirname, '.recruitment-no-upkeep-gate-bundle.cjs');
fs.writeFileSync(entry, `
export {
  unitStockCost, canAffordBuildingStock,
} from '../src/game/building-stock-cost';
export {
  unitResourceUpkeep, unitRecruitUpkeepReserve, unitRecruitFullStockCost,
  canAffordUnitRecruitUpkeepReserve, canAffordUnitRecruitFull,
  isUnitRecruitStockChipMissing, pickUnitRecruitHint,
  UNIT_RECRUIT_STOCK_ONLY_HINT,
} from '../src/game/economy-upkeep';
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', loader: { '.ts': 'ts' }, outfile: bundle, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent' });
const M = require(bundle);
const unit = { Surowiec: 'Brąz', 'Surowiec (ilość)': 2, 'Utrzymanie surowiec': 'Brąz', 'Utrzymanie surowiec (ilość)': 3 };
const stock = M.unitStockCost(unit);
const poolAtPurchase = { braz: 2 };
let passed = 0, failed = 0;
function assert(ok, msg) { if (ok) passed++; else { failed++; console.error('FAIL:', msg); } }

assert(JSON.stringify(stock) === JSON.stringify({ braz: 2 }), 'stock cost is {braz:2}');
assert(JSON.stringify(M.unitResourceUpkeep(unit)) === JSON.stringify({ braz: 3 }), 'upkeep is {braz:3}');
assert(!M.canAffordUnitRecruitUpkeepReserve(poolAtPurchase, unit), 'pool lacks upkeep reserve — diagnostic only');
assert(M.canAffordUnitRecruitFull(poolAtPurchase, unit), 'purchase passes with exact recruitment stock');
assert(!M.canAffordUnitRecruitFull({ braz: 1 }, unit), 'purchase fails below recruitment stock');
assert(M.pickUnitRecruitHint(poolAtPurchase, unit) === null, 'no hint when only upkeep is short');
assert(M.pickUnitRecruitHint({ braz: 1 }, unit) === M.UNIT_RECRUIT_STOCK_ONLY_HINT, 'stock deficit hint');
assert(!M.isUnitRecruitStockChipMissing(poolAtPurchase, unit, 'braz'), 'stock chip is not red at exact stock');
assert(JSON.stringify(M.unitRecruitFullStockCost(unit)) === JSON.stringify({ braz: 5 }), 'legacy diagnostic full cost remains available');
assert(M.canAffordUnitRecruitFull(poolAtPurchase, unit) === M.canAffordUnitRecruitFull({ braz: 2 }, unit), 'player/AI use same gate');
console.log(`recruitment-no-upkeep-gate-test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
