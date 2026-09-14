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
  foreignCapitalCityName,
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
const pools = require('../data/city-names-pools.json');

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('civ-names-test (D-START N-1A/N-3A/N-5B)\n');

assert(M.NAZWY_KLASTRA_LEN === 10, '10 nazw per typ');
assert(M.validateNazwyKlastra(civs).length === 0, 'civs.json: 15×10 nazwyKlastra');
// N-1A/N-2A: ścieżka bez puli również musi rozdzielać stolicę (nazwyMiast)
// od państw-miast (nazwyKlastra). Sprawdzenie obejmuje wszystkie cywilizacje,
// bo poprzedni błąd był maskowany tam, gdzie obie pule miały ten sam [0].
for (const civ of civs.cywilizacje) {
  const id = civ.ikonaId;
  const expected = pools[id]?.miasta_cywilizacji?.[0];
  assert(
    JSON.stringify(civ.nazwyMiast ?? []) === JSON.stringify(pools[id]?.miasta_cywilizacji ?? []),
    `nazwyMiast/pula regularna pełna lista ${id}`,
  );
  assert(civ.nazwyMiast?.[0] === expected, `nazwyMiast/pula regularna [0] ${id} → ${expected}`);
  assert(M.playerStartCityName(civs, id) === expected, `N-1A legacy (bez puli) ${id} → ${expected}`);
  assert(M.foreignCapitalCityName(civs, id) === expected, `N-2A legacy (bez puli) ${id} → ${expected}`);
}

const legacyOnlyCivs = { cywilizacje: [{ ikonaId: 'grecy', nazwyKlastra: ['Sykion'] }] };
assert(M.playerStartCityName(legacyOnlyCivs, 'grecy') === 'Sykion', 'fallback bez nazwy miasta → nazwyKlastra[0]');
assert(M.clusterRivalCityName(civs, 'grecy', 1) === 'Fliunt', 'N-3A rywal [1] → Fliunt');
assert(M.clusterRivalCityName(civs, 'grecy', 2) === 'Trojzena', 'N-3A rywal [2] → Trojzena');
assert(M.clusterRivalCityName(civs, 'grecy', 10) === 'Fliunt', 'legacy wrap: rywal [10] → Fliunt (zawijanie nazwyKlastra)');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
