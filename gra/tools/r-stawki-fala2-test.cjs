'use strict';
/**
 * r-stawki-fala2-test.cjs — R-NADMIAR-POOLS FALA2 mnożniki kosztów.
 * Run from gra/: node tools/r-stawki-fala2-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const ENTRY = path.resolve(__dirname, '.r-stawki-fala2-entry.ts');
const BUNDLE = path.resolve(__dirname, '.r-stawki-fala2-bundle.cjs');
const SRC = path.resolve(__dirname, '..', 'src');

fs.writeFileSync(ENTRY, `
export {
  scaledWonderWorkCost,
  scaledWonderFoodCost,
  scaleImprovementWorkCost,
  scaleStockCostRecord,
  isResearchEraFala2Extra,
  normalizeResearchEra,
} from ${JSON.stringify(SRC + '/game/r-stawki-strojenie')};
export { scaledResearchCost } from ${JSON.stringify(SRC + '/game/difficulty-cost')};
export { buildingStockCost } from ${JSON.stringify(SRC + '/game/building-stock-cost')};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const M = require(BUNDLE);
let passed = 0;
let failed = 0;
function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  OK:', msg); }
  else { failed++; console.error('  FAIL:', msg, `(got ${a}, want ${b})`); }
}

console.log('\n[r-stawki-fala2-test] ...\n');

eq(M.scaledWonderWorkCost(100), 200, 'wonder Praca FALA2×2');
eq(M.scaledWonderFoodCost(50), 100, 'wonder food = scaled Praca');
eq(M.scaleImprovementWorkCost(15), 30, 'ulepszenie koszt_praca FALA2×2');
eq(M.scaleStockCostRecord({ drewno: 5, glina: 0 }).drewno, 10, 'scaleStockCostRecord drewno×2');
eq(M.isResearchEraFala2Extra('Brąz'), true, 'Brąz FALA2 extra');
eq(M.isResearchEraFala2Extra('Braz'), true, 'Braz alias');
eq(M.isResearchEraFala2Extra('Żelazo'), true, 'Żelazo FALA2 extra');
eq(M.isResearchEraFala2Extra('Kamień'), false, 'Kamień bez FALA2 extra');
eq(M.scaledResearchCost(10, 'szybka', 0, 'normal', 'Kamień'), 20, 'badania Kamień ×2 FALA1');
eq(M.scaledResearchCost(10, 'szybka', 0, 'normal', 'Brąz'), 40, 'badania Brąz ×4 FALA1+FALA2');

const stolarnia = { koszt_surowce: { drewno: 5 } };
eq(M.buildingStockCost(stolarnia).drewno, 10, 'buildingStockCost FALA2×2');

console.log(`\n[r-stawki-fala2-test] ${passed} OK, ${failed} FAIL`);
process.exit(failed > 0 ? 1 : 0);
