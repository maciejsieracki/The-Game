'use strict';
/** node tools/shared-city-name-queue-test.cjs — wspólna kolejka nazw */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.shared-city-name-queue-entry.ts');
const bundle = path.join(__dirname, '.shared-city-name-queue-bundle.cjs');

fs.writeFileSync(entry, `
export {
  pickNextCityName,
  collectUsedCityNamesFromCities,
} from '../src/game/city-names-pool';
export {
  playerStartCityName,
  foreignCapitalCityName,
  clusterRivalCityName,
  stateCityName,
} from '../src/game/civ-names';
export { buildStartPreview } from '../src/game/start-preview';
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
const common = pools.grecy.miasta_cywilizacji;

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) {
    passed++;
    console.log('PASS:', message);
  } else {
    failed++;
    console.error('FAIL:', message);
  }
}

function allocate(used, civId = 'grecy') {
  const name = M.pickNextCityName(pools, civId, used);
  used.add(name);
  return name;
}

console.log('shared-city-name-queue-test (wspólna kolejka nazw)\n');

// RED: stolica, państwo-miasto, obca stolica i AI muszą korzystać z jednego first-free.
const mixedUsed = new Set();
const mixed = [];
mixed.push(M.playerStartCityName(civs, 'grecy', pools, mixedUsed));
mixedUsed.add(mixed[mixed.length - 1]);
mixed.push(M.stateCityName(civs, 'grecy', 0, 'fallback', pools, mixedUsed));
mixedUsed.add(mixed[mixed.length - 1]);
mixed.push(M.foreignCapitalCityName(civs, 'grecy', pools, mixedUsed));
mixedUsed.add(mixed[mixed.length - 1]);
mixed.push(M.clusterRivalCityName(civs, 'grecy', 1, pools, mixedUsed));
mixedUsed.add(mixed[mixed.length - 1]);
assert(JSON.stringify(mixed) === JSON.stringify(common.slice(0, 4)),
  'mieszana sekwencja capital/state/foreign/AI = common[0..3]');
assert(new Set(mixed).size === mixed.length, 'mieszana sekwencja nie duplikuje nazw');

// RED: dwa typy cywilizacji mają niezależne kolejki.
const grecyUsed = new Set();
const rzymianieUsed = new Set();
assert(allocate(grecyUsed, 'grecy') === pools.grecy.miasta_cywilizacji[0],
  'Grecy zaczynają od common[0]');
assert(allocate(grecyUsed, 'grecy') === pools.grecy.miasta_cywilizacji[1],
  'Grecy przechodzą do common[1]');
assert(allocate(rzymianieUsed, 'rzymianie') === pools.rzymianie.miasta_cywilizacji[0],
  'Rzymianie mają niezależne common[0]');

// RED: po 110 nazw suffix zaczyna się od pierwszej bazy i omija zajęty II.
const exhausted = new Set(common);
exhausted.add(`${common[0]} II`);
assert(M.pickNextCityName(pools, 'grecy', exhausted) === `${common[0]} III`,
  'overflow po 110 omija zajęte II i wybiera III');
const exhaustedWithoutCollision = new Set(common);
assert(M.pickNextCityName(pools, 'grecy', exhaustedWithoutCollision) === `${common[0]} II`,
  'overflow po 110 nie wraca do niesufiksowanej bazy');

// RED: podgląd i runtime konsumują tę samą kolejkę.
const preview = M.buildStartPreview({
  civs,
  cityNamesPools: pools,
  playerCivId: 'grecy',
  cityStatesCount: 3,
  activeTypesCount: 3,
});
const runtimeUsed = new Set();
const runtime = [M.playerStartCityName(civs, 'grecy', pools, runtimeUsed)];
runtimeUsed.add(runtime[0]);
for (let i = 1; i <= 3; i++) {
  const name = M.clusterRivalCityName(civs, 'grecy', i, pools, runtimeUsed);
  runtime.push(name);
  runtimeUsed.add(name);
}
assert(runtime[0] === preview.playerCapitalName, 'preview stolica = runtime');
assert(JSON.stringify(runtime.slice(1)) === JSON.stringify(preview.sameTypeRivalNames),
  'preview rywale = runtime first-free');

// RED: save/load rekonstruuje kolejkę wyłącznie z utrwalonych City.name.
const savedCities = [
  { ownerId: 0, name: common[0] },
  { ownerId: 7, name: common[1] },
];
const restoredCities = JSON.parse(JSON.stringify(savedCities));
const civTypeForOwner = (ownerId) => ownerId === 0 || ownerId === 7 ? 'grecy' : 'rzymianie';
const restoredUsed = M.collectUsedCityNamesFromCities(
  restoredCities,
  civTypeForOwner,
  'grecy',
);
assert(M.pickNextCityName(pools, 'grecy', restoredUsed) === common[2],
  'po odtworzeniu z City.name następna nazwa = common[2]');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
