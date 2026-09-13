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
// Ścieżka bez puli musi korzystać z tego samego pola `nazwyMiast`, a państwa-miasta
// są wycinane z jego końcowego suffixu. Nie ma już niezależnego `nazwyKlastra`.
assert(M.playerStartCityName(civs, 'grecy') === civs.cywilizacje.find(c => c.ikonaId === 'grecy').nazwyMiast[0], 'bez puli: stolica = nazwyMiast[0]');
assert(M.clusterRivalCityName(civs, 'grecy', 1) === civs.cywilizacje.find(c => c.ikonaId === 'grecy').nazwyMiast[100], 'bez puli: państwo-miasto = suffix[0]');
assert(M.clusterRivalCityName(civs, 'grecy', 2) === civs.cywilizacje.find(c => c.ikonaId === 'grecy').nazwyMiast[101], 'bez puli: kolejność suffixu zachowana');
assert(M.clusterRivalCityName(civs, 'grecy', 10) === civs.cywilizacje.find(c => c.ikonaId === 'grecy').nazwyMiast[109], 'bez puli: dziesiąty suffix bez indeksu 0');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
