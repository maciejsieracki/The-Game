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
  defenseTierFromWallKind,
  wallKindFromBuilt,
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
assert(M.defenseTierFromCity(['palisada']) === 1, 'palisada → tier 1 (szara)');
assert(M.defenseTierFromCity(['mury']) === 2, 'mury → tier 2 (złota)');
assert(M.defenseTierFromCity(['fort']) === 2, 'fort/cytadela → tier 2');
assert(M.defenseTierFromCity(['mury', 'fort']) === 2, 'mury+fort → tier 2');
assert(M.defenseTierFromCity([], true) === 0, 'maMur ignorowane (Q1=A) → tier 0');

assert(M.defenseTierFromWallKind('none') === 0, 'wallKind none → tier 0');
assert(M.defenseTierFromWallKind('palisada') === 1, 'wallKind palisada → tier 1');
assert(M.defenseTierFromWallKind('stone') === 2, 'wallKind stone → tier 2');
assert(M.wallKindFromBuilt(['palisada']) === 'palisada', 'built palisada → palisada');
assert(M.wallKindFromBuilt(['mury']) === 'stone', 'built mury → stone');
assert(M.wallKindFromBuilt([]) === 'none', 'built pusta → none');

const keyBase = M.cityMapBadgeKey({
  cityName: 'Ateny',
  population: 5,
  defenseTier: 1,
  civIconId: 'grecy',
  prodActive: false,
});
assert(keyBase.includes('Ateny|5|d1|cgrecy|p-|g-|w0'), 'klucz cache zawiera defense+civ+growth');
assert(keyBase.includes('cs0|e-'), 'klucz domyślny: major bez epoki');

const keyMajorPortrait = M.cityMapBadgeKey({
  cityName: 'Rzym',
  population: 8,
  defenseTier: 2,
  civIconId: 'rzym',
  isCityState: false,
  era: 2,
});
assert(keyMajorPortrait.includes('cs0|e2'), 'major AI: cs0 + epoka w kluczu');
assert(keyMajorPortrait.includes('crzym'), 'major: civ w kluczu');

const keyCityState = M.cityMapBadgeKey({
  cityName: 'Sparta',
  population: 3,
  defenseTier: 0,
  civIconId: 'grecy',
  isCityState: true,
  era: 1,
});
assert(keyCityState.includes('cs1|e1'), 'miasto-państwo: cs1 w kluczu');
assert(keyCityState !== keyMajorPortrait, 'MP vs major — różne klucze cache');

const keyProd = M.cityMapBadgeKey({
  cityName: 'Ateny',
  population: 5,
  defenseTier: 2,
  civIconId: 'rzym',
  prodActive: true,
  prodKind: 'jednostka',
  prodId: 'Wojownik',
});
assert(keyProd !== keyBase, 'prod zmienia klucz cache');
assert(keyProd.includes('pjednostka:Wojownik'), 'klucz zawiera rodzaj+id produkcji');

const keyProdBld = M.cityMapBadgeKey({
  cityName: 'Ateny',
  population: 5,
  defenseTier: 2,
  civIconId: 'rzym',
  prodActive: true,
  prodKind: 'budynek',
  prodId: 'koszary',
});
assert(keyProdBld.includes('pbudynek:koszary'), 'klucz budynku zawiera id');

const keyGrowth = M.cityMapBadgeKey({
  cityName: 'Ateny',
  population: 5,
  defenseTier: 0,
  civIconId: 'grecy',
  prodActive: false,
  growthLevel: 3,
});
assert(keyGrowth.includes('g3'), 'klucz zawiera poziom Wyżywienia');
assert(keyGrowth !== keyBase, 'growth zmienia klucz cache');

// --- MAP-UX-MARKER-Q1 = C — marker stolicy w kluczu cache -------------------
// Bez tego segmentu przejście stolica↔nie-stolica trafiłoby w starą teksturę i marker
// (złota obwódka + korona) nie przerysowałby się na mapie.
const keyNieStolica = M.cityMapBadgeKey({
  cityName: 'Ateny',
  population: 5,
  defenseTier: 1,
  civIconId: 'grecy',
  prodActive: false,
  isCapital: false,
});
const keyStolica = M.cityMapBadgeKey({
  cityName: 'Ateny',
  population: 5,
  defenseTier: 1,
  civIconId: 'grecy',
  prodActive: false,
  isCapital: true,
});
assert(keyStolica.endsWith('|k1'), 'stolica → segment k1 na końcu klucza cache');
assert(keyNieStolica.endsWith('|k0'), 'nie-stolica → segment k0 na końcu klucza cache');
assert(keyStolica !== keyNieStolica, 'stolica vs nie-stolica — różne klucze cache');
assert(keyNieStolica === keyBase, 'brak isCapital === isCapital:false (ten sam klucz)');

assert(M.civInitialForIconId('grecy') === 'G', 'grecy → G');
assert(M.civInitialForIconId('rzym') === 'R', 'rzym → R');
assert(M.civInitialForIconId('') === '?', 'pusty → ?');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
