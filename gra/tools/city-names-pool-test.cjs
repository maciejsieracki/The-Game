'use strict';
/** node tools/city-names-pool-test.cjs — wspólna sekwencja nazw miast */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.city-names-pool-entry.ts');
const bundle = path.join(__dirname, '.city-names-pool-bundle.cjs');

fs.writeFileSync(entry, `
export {
  playerStartCityName,
  foreignCapitalCityName,
  clusterRivalCityName,
  stateCityName,
  pickNextRegularCityName,
  suggestPlayerFoundCityName,
  pickAiFoundedCityName,
  validateCityNamesPools,
  validateNazwyKlastra,
  NAZWY_KLASTRA_LEN,
  MIASTA_CYWILIZACJI_LEN,
  CITY_NAMES_POOL_COMMON_LEN,
  CITY_NAMES_POOL_REGULAR_LEN,
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

console.log('city-names-pool-test (wspólna sekwencja nazw)\n');

const civCount = civs.cywilizacje.length;
assert(civCount === 15, `15 cywilizacji w civs.json (jest ${civCount})`);
assert(M.MIASTA_CYWILIZACJI_LEN === 100, 'prefix regularny ma 100 nazw');
assert(M.NAZWY_KLASTRA_LEN === 10, 'suffix państw-miast ma 10 nazw');
assert(M.CITY_NAMES_POOL_COMMON_LEN === 110, 'wspólna sekwencja ma 110 nazw');
assert(M.validateNazwyKlastra(civs).length === 0, 'civs.json: 15 wspólnych sekwencji');
assert(M.validateCityNamesPools(pools, civs).length === 0, 'pule + civs.json: wspólny kontrakt i synchronizacja');

for (const civ of civs.cywilizacje) {
  const id = civ.ikonaId;
  const common = pools[id].miasta_cywilizacji;
  const civCommon = civ.nazwyMiast;
  const state = common.slice(M.CITY_NAMES_POOL_REGULAR_LEN);
  assert(common.length === M.CITY_NAMES_POOL_COMMON_LEN, `${id}: 100 + 10 w jednej sekwencji`);
  assert(!Object.prototype.hasOwnProperty.call(pools[id], 'miasta_panstwa'), `${id}: brak drugiej puli w źródle`);
  assert(!Object.prototype.hasOwnProperty.call(civ, 'nazwyKlastra'), `${id}: brak drugiej puli w civs.json`);
  assert(common[0] === civCommon[0], `${id}: stolica jest na indeksie 0`);
  assert(state.length === M.NAZWY_KLASTRA_LEN, `${id}: państwa-miasta są na końcu`);
  assert(new Set(common).size === common.length, `${id}: brak duplikatów w sekwencji`);
  assert(JSON.stringify(common) === JSON.stringify(civCommon), `${id}: civs.json.nazwyMiast = pula`);
}

const grecy = pools.grecy.miasta_cywilizacji;
assert(M.playerStartCityName(civs, 'grecy', pools) === grecy[0], 'stolica gracza → wspólna lista[0]');
assert(M.foreignCapitalCityName(civs, 'grecy', pools) === grecy[0], 'stolica AI → wspólna lista[0]');
assert(M.clusterRivalCityName(civs, 'grecy', 1, pools) === grecy[1], 'państwo-miasto [1] → common[1]');
assert(M.clusterRivalCityName(civs, 'grecy', 9, pools) === grecy[9], 'państwo-miasto [9] → common[9]');
const overflowRival11 = M.clusterRivalCityName(civs, 'grecy', 11, pools);
assert(overflowRival11 === grecy[11], `państwo-miasto [11] → common[11] (${overflowRival11})`);
assert(M.stateCityName(civs, 'grecy', 0, 'fallback', pools) === grecy[0], 'odczyt państwa-miasta [0] → common[0]');
assert(M.clusterRivalCityName(civs, 'chinczycy', 1, pools) === pools.chinczycy.miasta_cywilizacji[1], 'brak cross-talku między cywilizacjami');

const next = M.pickNextRegularCityName(pools, 'grecy', new Set());
assert(next === grecy[0], `wspólna kolejka zaczyna od common[0] (${next})`);
const used = new Set([grecy[0], grecy[1], grecy[2]]);
const nextAfterUsed = M.pickNextRegularCityName(pools, 'grecy', used);
assert(nextAfterUsed === grecy[3], `następna wolna nazwa zachowuje kolejność (${nextAfterUsed})`);

const cities = [
  { ownerId: 0, name: grecy[0] },
  { ownerId: 0, name: grecy[1] },
];
const civTypeForOwner = (oid) => (oid === 0 ? 'grecy' : 'rzymianie');
const suggested = M.suggestPlayerFoundCityName(pools, 'grecy', cities, civTypeForOwner, 0);
assert(suggested === grecy[2], `auto-suggest gracza: ${suggested}`);

const aiUsed = new Set(['Rzym', 'Ostia']);
const aiNext = M.pickAiFoundedCityName(pools, 'rzymianie', aiUsed, 2);
assert(aiNext === pools.rzymianie.miasta_cywilizacji[2], `AI founding korzysta z prefixu (${aiNext})`);

// Wyczerpanie całej wspólnej kolejki uruchamia suffix od pierwszej bazy.
const allGrecy = new Set(grecy);
const exhausted = M.pickNextRegularCityName(pools, 'grecy', allGrecy);
assert(exhausted === grecy[0] + ' II', `po wyczerpaniu 110 → pierwszy suffix (${exhausted})`);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
