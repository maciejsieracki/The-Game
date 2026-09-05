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
assert(M.validateNazwyKlastra(civs).length === 0, 'civs.json: 15×10 nazwyKlastra');
// R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1: ŚCIEŻKA LEGACY (wywołania BEZ puli) czyta
// `civs.json:nazwyKlastra`, a ta lista jest lustrem `miasta_panstwa`. Po rozdzieleniu list
// państw-miast od list miast (kryterium K2 tematu) `nazwyKlastra` nie zawiera już nazw
// z `miasta_cywilizacji`, więc zaszyte tu wartości greckie zmieniły się z „Ateny/Sparta/Korynt"
// na „Sykion/Fliunt/Trojzena" — to nie regresja, tylko ta sama pozycja listy po jej wymianie.
// Ścieżka Z PULĄ (gra faktycznie jej używa) dalej daje stolicę „Ateny" — pilnuje tego
// `mapa-etykieta-stolicy-test.cjs` (E5/E7) oraz `city-names-pool-test.cjs`.
assert(M.playerStartCityName(civs, 'grecy') === 'Sykion', 'N-1A legacy (bez puli) Grecy → Sykion');
assert(M.clusterRivalCityName(civs, 'grecy', 1) === 'Fliunt', 'N-3A rywal [1] → Fliunt');
assert(M.clusterRivalCityName(civs, 'grecy', 2) === 'Trojzena', 'N-3A rywal [2] → Trojzena');
assert(M.clusterRivalCityName(civs, 'grecy', 10) === 'Fliunt', 'legacy wrap: rywal [10] → Fliunt (zawijanie nazwyKlastra)');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
