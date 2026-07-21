'use strict';
/** node tools/city-names-pool-test.cjs — B-city-names-pools 2026-07-07 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.city-names-pool-entry.ts');
const bundle = path.join(__dirname, '.city-names-pool-bundle.cjs');

fs.writeFileSync(entry, `
export {
  playerStartCityName,
  clusterRivalCityName,
  pickNextRegularCityName,
  suggestPlayerFoundCityName,
  pickAiFoundedCityName,
  validateCityNamesPools,
  validateNazwyKlastra,
  NAZWY_KLASTRA_LEN,
  MIASTA_CYWILIZACJI_LEN,
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
const civs = require('../data/civs.json');
const pools = require('../data/city-names-pools.json');

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('city-names-pool-test (B-city-names-pools)\n');

const civCount = civs.cywilizacje.length;
assert(civCount === 15, `15 cywilizacji w civs.json (jest ${civCount})`);
assert(M.validateNazwyKlastra(civs).length === 0, 'civs.json: 15×10 nazwyKlastra');
assert(M.validateCityNamesPools(pools, civs).length === 0, 'pule: 15×(100+10), bez duplikatów, sync z nazwyKlastra');

assert(M.playerStartCityName(civs, 'grecy', pools) === 'Ateny', 'stolica gracza Grecy → Ateny');
assert(M.clusterRivalCityName(civs, 'grecy', 1, pools) === 'Sparta', 'państwo-miasto [1] → Sparta');
assert(M.clusterRivalCityName(civs, 'grecy', 9, pools) === 'Delfy', 'państwo-miasto [9] → Delfy');
assert(M.clusterRivalCityName(civs, 'grecy', 10, pools) === 'Olimpia', 'państwo-miasto [10] → Olimpia (pula regularna)');
assert(M.clusterRivalCityName(civs, 'grecy', 18, pools) === 'Nafplion', 'państwo-miasto [18] → Nafplion (pula regularna)');
assert(M.clusterRivalCityName(civs, 'chinczycy', 1, pools) === 'Qi', 'Chińczycy państwo [1] → Qi (królestwo)');

const used = new Set(['Ateny', 'Sparta', 'Korynt']);
const next = M.pickNextRegularCityName(pools, 'grecy', used);
assert(next === 'Teby', `następna wolna Grecy → Teby (dostał: ${next})`);

const cities = [
  { ownerId: 0, name: 'Ateny' },
  { ownerId: 0, name: 'Teby' },
];
const civTypeForOwner = (oid) => (oid === 0 ? 'grecy' : 'rzymianie');
const suggested = M.suggestPlayerFoundCityName(pools, 'grecy', cities, civTypeForOwner, 0);
assert(suggested === 'Sparta' || suggested === 'Korynt', `auto-suggest gracza: ${suggested}`);

const aiUsed = new Set(['Rzym', 'Ostia']);
const aiNext = M.pickAiFoundedCityName(pools, 'rzymianie', aiUsed, 2);
assert(aiNext === 'Kapua', `AI Rzymianie founding → Kapua (dostał: ${aiNext})`);

// Wyczerpanie puli → sufiks
const allGrecy = new Set(pools.grecy.miasta_cywilizacji);
const exhausted = M.pickNextRegularCityName(pools, 'grecy', allGrecy);
assert(exhausted.includes('II'), `po wyczerpaniu puli → sufiks (${exhausted})`);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
