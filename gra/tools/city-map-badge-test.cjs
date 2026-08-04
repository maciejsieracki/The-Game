'use strict';
/** node tools/city-map-badge-test.cjs — pigułka miasta v1: defenseTier + cityMapBadgeKey */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.city-map-badge-entry.ts');
const bundle = path.join(__dirname, '.city-map-badge-bundle.cjs');

fs.writeFileSync(entry, `
export {
  defenseTierFromCity,
  cityMapBadgeKey,
  civInitialForIconId,
} from '../src/render/cityMapStatChip';
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

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('city-map-badge-test (pigułka miasta v1)\n');

assert(M.defenseTierFromCity([]) === 0, 'brak budynków → tier 0');
assert(M.defenseTierFromCity(['koszary']) === 0, 'koszary nie dają tieru obrony');
assert(M.defenseTierFromCity(['palisada']) === 1, 'palisada → tier 1');
assert(M.defenseTierFromCity(['mury']) === 1, 'mury → tier 1');
assert(M.defenseTierFromCity(['mury', 'fort']) === 2, 'mury+fort → tier 2 (cytadela)');
assert(M.defenseTierFromCity([], true) === 1, 'maMur bez listy → tier 1');

const keyBase = M.cityMapBadgeKey({
  cityName: 'Ateny',
  population: 5,
  defenseTier: 1,
  civIconId: 'grecy',
  prodActive: false,
});
assert(keyBase.includes('Ateny|5|d1|cgrecy|p-|w0'), 'klucz cache zawiera defense+civ');

const keyProd = M.cityMapBadgeKey({
  cityName: 'Ateny',
  population: 5,
  defenseTier: 2,
  civIconId: 'rzym',
  prodActive: true,
  prodKind: 'jednostka',
});
assert(keyProd !== keyBase, 'prod zmienia klucz cache');
assert(keyProd.includes('pjednostka'), 'klucz zawiera rodzaj produkcji');

assert(M.civInitialForIconId('grecy') === 'G', 'grecy → G');
assert(M.civInitialForIconId('rzym') === 'R', 'rzym → R');
assert(M.civInitialForIconId('') === '?', 'pusty → ?');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
