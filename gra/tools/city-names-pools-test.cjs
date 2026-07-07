'use strict';
/** node tools/city-names-pools-test.cjs — pule 100+10 per cywilizacja */

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

console.log('city-names-pools-test (D-nazwy-miast-pule)\n');

assert(M.MIASTA_CYWILIZACJI_LEN === 100, '100 nazw founding per civ');
assert(M.NAZWY_KLASTRA_LEN === 10, '10 nazw państw per civ');
assert(M.validateCityNamesPools(pools, civs).length === 0, 'pools + civs.json zsynchronizowane');

const used = new Set(['Ateny', 'Sparta']);
const next = M.pickAiFoundedCityName(pools, 'grecy', used, 2);
assert(next === 'Korynt', 'AI founding Grecy: po Ateny+Sparta → Korynt');

const usedRzym = new Set(['Rzym']);
const nextRzym = M.pickAiFoundedCityName(pools, 'rzymianie', usedRzym, 1);
assert(nextRzym === 'Ostia', 'AI founding Rzymianie: po Rzym → Ostia');

const panChiny = pools.chinczycy.miasta_panstwa;
assert(panChiny[0] === 'Qin' && panChiny.length === 10, 'Chińczycy państwa: Qin + 9 królestw');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
