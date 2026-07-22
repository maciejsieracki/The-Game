'use strict';
/** node tools/power-ranking-test.cjs — ranking Mocy: bez miast-państw + mgła wojny */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.power-ranking-entry.ts');
const bundle = path.join(__dirname, '.power-ranking-bundle.cjs');

fs.writeFileSync(entry, `
export { filterOwnersForPowerRanking } from '../src/game/power-ranking';
export { isOwnerClusterCityState } from '../src/game/display-names';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('power-ranking-test (miasta-państwa + odkrycie)\n');

const cityStateOpts = {
  cities: [
    { ownerId: 0, startCityState: false },
    { ownerId: 1, startCityState: false },
    { ownerId: 2, startCityState: true },
    { ownerId: 3, startCityState: true },
  ],
};

const all = [0, 1, 2, 3, 4];
const discovered = new Set([0, 1, 3]);

const prod = M.filterOwnersForPowerRanking(all, {
  cityStateOpts,
  discoveredOwners: discovered,
  debugShowAll: false,
});
assert(JSON.stringify(prod) === JSON.stringify([0, 1]),
  'produkcja: gracz + odkryte pełne cywilizacje, bez miast-państw i nieodkrytych');
assert(!prod.includes(2), 'produkcja: wyklucza miasto-państwo (owner 2)');
assert(!prod.includes(3), 'produkcja: wyklucza odkryte miasto-państwo (owner 3)');
assert(!prod.includes(4), 'produkcja: wyklucza nieodkryte (owner 4)');
assert(prod.includes(0), 'produkcja: gracz zawsze widoczny');

const debug = M.filterOwnersForPowerRanking(all, {
  cityStateOpts,
  discoveredOwners: discovered,
  debugShowAll: true,
});
assert(JSON.stringify(debug) === JSON.stringify([0, 1, 4]),
  'debug: wszystkie pełne cywilizacje, nadal bez miast-państw');
assert(!debug.includes(2), 'debug: miasto-państwo nadal ukryte');
assert(!debug.includes(3), 'debug: odkryte miasto-państwo nadal ukryte');

assert(M.isOwnerClusterCityState(2, cityStateOpts) === true, 'fixture: owner 2 = miasto-państwo');
assert(M.isOwnerClusterCityState(1, cityStateOpts) === false, 'fixture: owner 1 = pełna cywilizacja');

try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (_) {}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
