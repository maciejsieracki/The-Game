'use strict';
/** node tools/civ-names-test.cjs — D-START nazwy klastra */

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

console.log('civ-names-test (D-START N-1A/N-3A/N-5B)\n');

assert(M.NAZWY_KLASTRA_LEN === 10, '10 nazw per typ');
assert(M.validateNazwyKlastra(civs).length === 0, 'civs.json: 9×10 nazwyKlastra');
assert(M.playerStartCityName(civs, 'grecy') === 'Ateny', 'N-1A Grecy → Ateny');
assert(M.clusterRivalCityName(civs, 'grecy', 1) === 'Sparta', 'N-3A rywal [1] → Sparta');
assert(M.clusterRivalCityName(civs, 'grecy', 2) === 'Korynt', 'N-3A rywal [2] → Korynt');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
