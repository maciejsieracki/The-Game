'use strict';
/**
 * ai-resource-needs-test.cjs — deficyt surowców (magazyn + kolejka budowy).
 * Run from gra/: node tools/ai-resource-needs-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.DIP_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.ai-resource-needs-entry.ts');
const BUNDLE = path.resolve(__dirname, '.ai-resource-needs-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  detectOwnerResourceNeeds,
  resourceKeysNeededForBuildingQueue,
} from ${JSON.stringify(SRC + '/game/ai-resource-needs')};
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

const {
  detectOwnerResourceNeeds,
  resourceKeysNeededForBuildingQueue,
} = require(BUNDLE);

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; return; }
  failed++;
  console.error('  FAIL:', msg);
}

const goods = [
  { key: 'drewno', label: 'Drewno', ilosc: 0 },
  { key: 'kamien', label: 'Kamień', ilosc: 50 },
];
const priced = ['drewno', 'kamien'];

const stockOnly = detectOwnerResourceNeeds({
  goods,
  pricedKeys: priced,
  pakietWielkosc: 10,
});
ok(stockOnly.needsResource.drewno === true, 'magazyn < pakiet → needsResource.drewno');
ok(stockOnly.deficitKeys[0] === 'drewno', 'deficyt magazynu pierwszy');

const queueKeys = resourceKeysNeededForBuildingQueue({
  queuedBuildingIds: ['test_budynek'],
  goods,
  lookupBuildingStockCost: () => ({ drewno: 5, kamien: 1 }),
});
ok(queueKeys.includes('drewno'), 'kolejka budowy wymaga drewna');

const foodLow = detectOwnerResourceNeeds({
  goods: [{ key: 'drewno', label: 'D', ilosc: 100 }],
  pricedKeys: ['drewno'],
  pakietWielkosc: 10,
  foodReserve: 3,
});
ok(foodLow.needsResource.zywnosc === true, 'niski spichlerz → needsResource.zywnosc');

console.log(`ai-resource-needs-test: ${passed} pass, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
