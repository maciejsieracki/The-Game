'use strict';
/**
 * unit-resource-upkeep-test.cjs — utrzymanie surowcowe jednostek
 * (units.json `Utrzymanie surowiec` / `Utrzymanie surowiec (ilość)`).
 *
 * Run from gra/:  node tools/unit-resource-upkeep-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[unit-resource-upkeep-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.unit-resource-upkeep-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.unit-resource-upkeep-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  unitResourceUpkeep,
  totalUnitResourceUpkeep,
} from '../src/game/economy-upkeep';
export {
  unitStockCost,
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
  console.error('[unit-resource-upkeep-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const units = require('../data/units.json');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function deepEq(a, b, msg) {
  const sa = JSON.stringify(a, Object.keys(a).sort());
  const sb = JSON.stringify(b, Object.keys(b).sort());
  assert(sa === sb, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

function findUnit(name) {
  const u = units.find(x => x.Jednostka === name);
  if (!u) throw new Error(`units.json: brak jednostki "${name}"`);
  return u;
}

console.log('\n-- unitResourceUpkeep: pojedyncze jednostki --');

const wojownik = findUnit('Wojownik');
deepEq(M.unitResourceUpkeep(wojownik), { drewno: 2 }, 'Wojownik -> {drewno:2}');

const wlocznik = findUnit('Włócznik');
deepEq(M.unitResourceUpkeep(wlocznik), { braz: 2 }, 'Włócznik -> {braz:2}');

console.log('\n-- unitStockCost: rekrutacja Włócznik (×5) --');
deepEq(
  M.unitStockCost(wlocznik),
  { braz: 10 },
  'Włócznik unitStockCost -> {braz:10} (stara baza ×5)',
);

console.log('\n-- totalUnitResourceUpkeep: suma po jednostkach --');
const twoSpearmen = [
  { typeId: 'Włócznik' },
  { typeId: 'Włócznik' },
];
deepEq(
  M.totalUnitResourceUpkeep(twoSpearmen, typeId => findUnit(typeId)),
  { braz: 4 },
  '2× Włócznik -> {braz:4}',
);

console.log('\n-- edge cases --');
deepEq(M.unitResourceUpkeep(null), {}, 'null -> {}');
deepEq(
  M.unitResourceUpkeep({ 'Utrzymanie surowiec': '-', 'Utrzymanie surowiec (ilość)': 2 }),
  {},
  "Utrzymanie surowiec='-' -> {}",
);
deepEq(
  M.unitResourceUpkeep({ 'Utrzymanie surowiec': 'Drewno', 'Utrzymanie surowiec (ilość)': 0 }),
  {},
  'ilość 0 -> {}',
);

console.log(`\nunit-resource-upkeep-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
