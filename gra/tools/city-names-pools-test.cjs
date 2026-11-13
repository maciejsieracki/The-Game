'use strict';
/** node tools/city-names-pools-test.cjs — wspólna sekwencja nazw per cywilizacja */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.city-names-pools-entry.ts');
const bundle = path.join(__dirname, '.city-names-pools-bundle.cjs');

fs.writeFileSync(entry, `
export {
  pickAiFoundedCityName,
  validateCityNamesPools,
  MIASTA_CYWILIZACJI_LEN,
  NAZWY_KLASTRA_LEN,
  CITY_NAMES_POOL_COMMON_LEN,
} from '../src/game/civ-names';
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
const pools = require('../data/city-names-pools.json');
const civs = require('../data/civs.json');

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('city-names-pools-test (wspólna sekwencja nazw)\n');

assert(M.MIASTA_CYWILIZACJI_LEN === 100, '100 nazw founding per civ');
assert(M.NAZWY_KLASTRA_LEN === 10, '10 nazw państw per civ');
assert(M.CITY_NAMES_POOL_COMMON_LEN === 110, 'wspólna lista ma 110 nazw per civ');
assert(M.validateCityNamesPools(pools, civs).length === 0, 'pools + civs.json: wspólny kontrakt zsynchronizowany');

const used = new Set(['Ateny', 'Sparta']);
const next = M.pickAiFoundedCityName(pools, 'grecy', used, 2);
assert(next === 'Korynt', 'AI founding Grecy: po Ateny+Sparta → Korynt');

const usedRzym = new Set(['Rzym']);
const nextRzym = M.pickAiFoundedCityName(pools, 'rzymianie', usedRzym, 1);
assert(nextRzym === 'Ostia', 'AI founding Rzymianie: po Rzym → Ostia');

const commonChiny = pools.chinczycy.miasta_cywilizacji;
assert(commonChiny[0] === "Xi'an" && commonChiny.length === 110, 'Chińczycy: stolica + 99 miast + 10 państw-miast');
assert(commonChiny.slice(100)[0] === 'Qin', 'Chińczycy państwa-miasta są na końcu wspólnej listy');
assert(!Object.prototype.hasOwnProperty.call(pools.chinczycy, 'miasta_panstwa'), 'brak niezależnego pola miasta_panstwa');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
