'use strict';
/** node tools/civ-names-test.cjs — wspólna sekwencja nazw */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.civ-names-entry.ts');
const bundle = path.join(__dirname, '.civ-names-bundle.cjs');

fs.writeFileSync(entry, `
export {
  playerStartCityName,
  foreignCapitalCityName,
  clusterRivalCityName,
  validateNazwyKlastra,
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
const civs = require('../data/civs.json');
const pools = require('../data/city-names-pools.json');

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('civ-names-test (wspólna sekwencja nazw)\n');

assert(M.NAZWY_KLASTRA_LEN === 10, '10 nazw per typ');
assert(M.CITY_NAMES_POOL_COMMON_LEN === 110, 'wspólna lista ma 110 nazw');
assert(M.validateNazwyKlastra(civs).length === 0, 'civs.json: 15 wspólnych list');
// Każda rola bez jawnej puli korzysta z tej samej wspólnej listy nazwMiast.
for (const civ of civs.cywilizacje) {
  const id = civ.ikonaId;
  const common = pools[id]?.miasta_cywilizacji ?? [];
  const expected = common[0];
  assert(
    JSON.stringify(civ.nazwyMiast ?? []) === JSON.stringify(pools[id]?.miasta_cywilizacji ?? []),
    `nazwyMiast/pula regularna pełna lista ${id}`,
  );
  assert(civ.nazwyMiast?.[0] === expected, `nazwyMiast/pula regularna [0] ${id} → ${expected}`);
  assert(M.playerStartCityName(civs, id) === expected, `N-1A bez puli ${id} → ${expected}`);
  assert(M.foreignCapitalCityName(civs, id) === expected, `N-2A bez puli ${id} → ${expected}`);
  assert(M.clusterRivalCityName(civs, id, 1) === common[1], `N-3A wspólna kolejka [1] ${id}`);
  assert(M.clusterRivalCityName(civs, id, 2) === common[2], `N-3A wspólna kolejka [2] ${id}`);
  assert(M.clusterRivalCityName(civs, id, 10) === common[10], `N-3A wspólna kolejka [10] ${id}`);
}

const legacyOnlyCivs = { cywilizacje: [{ ikonaId: 'grecy', nazwyKlastra: ['Sykion'] }] };
assert(M.playerStartCityName(legacyOnlyCivs, 'grecy') === 'Sykion', 'fallback bez nazwy miasta → nazwyKlastra[0]');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
