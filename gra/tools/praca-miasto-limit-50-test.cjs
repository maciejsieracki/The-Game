'use strict';

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const entry = path.resolve(__dirname, '.praca-miasto-limit-50-entry.ts');
const bundle = path.resolve(__dirname, '.praca-miasto-limit-50-bundle.cjs');
fs.writeFileSync(entry, `
  export { ensureCityPodzialDefaults } from '../src/game/cities';
  export { resolveCityPodzialPracy, migratePodzialPracyOnLoad } from '../src/game/empire-city-defaults';
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(bundle);
let pass = 0;
function ok(condition, message) {
  if (!condition) { console.error('FAIL:', message); process.exitCode = 1; }
  else { pass++; console.log('PASS:', message); }
}

ok(M.resolveCityPodzialPracy({ podzialPracyOverride: true, podzialPracy: { procentBudynki: 0 } }, undefined).procentBudynki === 50, 'lokalny override 0 clampuje do 50% budynków');
const cities = [
  { id: 'a', ownerId: 0, podzialPracy: { procentBudynki: 70 } },
  { id: 'b', ownerId: 0, podzialPracy: { procentBudynki: 0 } },
];
const defaults = new Map();
M.migratePodzialPracyOnLoad(cities, defaults, undefined);
ok(defaults.get(0).procentBudynki === 70, 'migracja defaultu zachowuje legalne 70% budynków');
ok(cities[1].podzialPracy.procentBudynki === 50 && cities[1].podzialPracyOverride === true, 'migracja starego override 0 clampuje do 50% budynków');
const loaded = { podzialPracy: { procentBudynki: 0 } };
M.ensureCityPodzialDefaults(loaded);
ok(loaded.podzialPracy.procentBudynki === 50, 'ensureCityPodzialDefaults migruje stary save 0% do 50% budynków');
console.log(`[praca-miasto-limit-50-test] ${pass} pass`);
