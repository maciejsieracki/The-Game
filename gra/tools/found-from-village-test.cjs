'use strict';
/**
 * found-from-village-test.cjs -- standalone Node test for foundCityFromVillage in cities.ts
 * Run from gra/:  node tools/found-from-village-test.cjs
 *
 * Bundles cities.ts (+ its deps) via esbuild, then runs assertions.
 * Pure logic only -- no DOM, no THREE.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[found-from-village-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.found-village-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.found-village-bundle.cjs');

const ENTRY_TS = `
export {
  foundCityFromVillage,
  canFoundCity,
  foundCityAt,
  cityName,
  MIN_CITY_DISTANCE,
} from '../src/game/cities';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[found-from-village-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { foundCityFromVillage, canFoundCity, foundCityAt, cityName, MIN_CITY_DISTANCE } = M;

// --- test harness ----------------------------------------------------------
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else       { failed++; console.error('  [FAIL] ' + msg); }
}

function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + ' -- got ' + JSON.stringify(a) + ', expected ' + JSON.stringify(b)); }
}

console.log('\n[found-from-village-test] Running tests...\n');

// --- fixtures ---------------------------------------------------------------
// Mapa 23x23 heksow (teren Lad = 0), bez wody/gor
const hexes = {};
for (let q = -11; q <= 11; q++) {
  for (let r = -11; r <= 11; r++) {
    hexes[q + ',' + r] = { terenBazowy: 'laka' }; // TerenBazowy.Laka = 'laka'
  }
}
const map = { szerokoscQ: 23, wysokoscR: 23, hexes, seed: 42 };

// Brak istniejacych miast
const noCities = [];

// Jedno istniejace miasto w (0,0)
const cityAt00 = [{ id: 'city0', ownerId: 1, q: 0, r: 0, name: 'Akropol', population: 1 }];

// --- Test 1: sukces - puste pole, brak miast --------------------------------
console.log('1. Sukces: wolne pole, brak istniejacych miast');
const r1 = foundCityFromVillage(0, 0, noCities, map);
assert(r1.ok === true, 'ok === true dla wolnego heksu');
assert(r1.ok && typeof r1.id === 'string', 'wynik.id jest stringiem');
assert(r1.ok && r1.q === 0, 'wynik.q === 0');
assert(r1.ok && r1.r === 0, 'wynik.r === 0');
assert(r1.ok && r1.population === 1, 'nowe miasto ma populacje 1');

// --- Test 2: blad - zbyt blisko istniejacego miasta -------------------------
console.log('\n2. Blad: zbyt blisko istniejacego miasta');
// Miasto w (0,0), MIN_CITY_DISTANCE = 4 heksy -> pozycja (1,0) jest za blisko
const r2 = foundCityFromVillage(1, 0, cityAt00, map);
assert(r2.ok === false, 'ok === false gdy za blisko');
assert(!r2.ok && typeof r2.reason === 'string' && r2.reason.length > 0,
       'reason jest niepusty stringiem');

// --- Test 3: blad - poza mapa -----------------------------------------------
console.log('\n3. Blad: heks poza mapa');
const r3 = foundCityFromVillage(999, 999, noCities, map);
assert(r3.ok === false, 'ok === false dla heksu poza mapa');
assert(!r3.ok && r3.reason === 'poza mapa', 'reason === "poza mapa"');

// --- Test 4: sukces - wystarczajacy dystans od istniejacego miasta ----------
console.log('\n4. Sukces: wystarczajacy dystans od istniejacego miasta');
// MIN_CITY_DISTANCE = 4 heksy; (6,0) powinnien byc ok
const r4 = foundCityFromVillage(6, 0, cityAt00, map);
assert(r4.ok === true, 'ok === true dla heksu w odleglosci ' + 6 + ' od (0,0)');

// --- Test 5: withinTerritory callback - odrzucenie --------------------------
console.log('\n5. withinTerritory callback - odrzucenie gdy poza terytorium');
const alwaysFalse = () => false;
const r5 = foundCityFromVillage(0, 0, noCities, map, { withinTerritory: alwaysFalse });
assert(r5.ok === false, 'ok === false gdy withinTerritory zwraca false');
assert(!r5.ok && r5.reason === 'poza terytorium', 'reason === "poza terytorium"');

// --- Test 6: withinTerritory callback - akceptacja --------------------------
console.log('\n6. withinTerritory callback - akceptacja gdy w terytorium');
const alwaysTrue = () => true;
const r6 = foundCityFromVillage(0, 0, noCities, map, { withinTerritory: alwaysTrue });
assert(r6.ok === true, 'ok === true gdy withinTerritory zwraca true');

// --- Test 7: wynik ok:true zawiera wszystkie pola City -----------------------
console.log('\n7. Wynik ok:true ma pola City');
const r7 = foundCityFromVillage(3, 3, noCities, map);
assert(r7.ok === true, 'ok === true');
if (r7.ok) {
  assert(typeof r7.id       === 'string', 'id jest stringiem');
  assert(typeof r7.ownerId  === 'number', 'ownerId jest liczba');
  assert(r7.q               === 3,        'q === 3');
  assert(r7.r               === 3,        'r === 3');
  assert(typeof r7.name     === 'string', 'name jest stringiem');
  assert(r7.population      === 1,        'population === 1');
}

// --- Test 8: PURE -- wejscia nie sa mutowane --------------------------------
console.log('\n8. Pure -- wejscia nie sa mutowane');
const citiesBefore = JSON.stringify(cityAt00);
const hexCountBefore = Object.keys(hexes).length;
foundCityFromVillage(6, 0, cityAt00, map);
eq(JSON.stringify(cityAt00), citiesBefore, 'cities nie zmutowane');
eq(Object.keys(hexes).length, hexCountBefore, 'mapa nie zmutowana');

// --- Test 9: blad - morze (terenBazowy 1 = Morze) ---------------------------
console.log('\n9. Blad: teren morski');
const hexesWithSea = Object.assign({}, hexes, { '5,0': { terenBazowy: 'morze' } }); // TerenBazowy.Morze
const mapWithSea = Object.assign({}, map, { hexes: hexesWithSea });
const r9 = foundCityFromVillage(5, 0, noCities, mapWithSea);
assert(r9.ok === false, 'ok === false dla terenu morskiego');
assert(!r9.ok && r9.reason === 'morze', 'reason === "morze"');

// --- summary ---------------------------------------------------------------
const total = passed + failed;
if (failed === 0) {
  console.log('\nFOUND-FROM-VILLAGE OK (' + passed + '/' + total + ')');
} else {
  console.log('\nFOUND-FROM-VILLAGE FAIL (' + passed + '/' + total + ' passed, ' + failed + ' failed)');
}

// Clean up temp artifacts
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed === 0 ? 0 : 1);
