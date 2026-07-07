'use strict';
/**
 * okolica-test.cjs -- standalone Node test for src/game/okolica.ts.
 * Run from gra/:  node tools/okolica-test.cjs
 *
 * Self-contained: bundles okolica.ts (+ its deps) with esbuild to a
 * temp CJS file, then requires it and runs assertions. Pure logic only -- no DOM, no THREE.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[okolica-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.okolica-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.okolica-bundle.cjs');

const ENTRY_TS = `
export {
  OKOLICA_RADIUS,
  okolicaTiles,
  tileScore,
  assignWorkedTiles,
  cityRangeForPopulation,
  adjustTileWorker,
  seedReczneFromAuto,
  toggleTileWorker,
  rebalanceWorkersAfterPopulationChange,
} from '../src/game/okolica';
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
  console.error('[okolica-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { OKOLICA_RADIUS, okolicaTiles, tileScore, assignWorkedTiles, cityRangeForPopulation, adjustTileWorker, seedReczneFromAuto, toggleTileWorker, rebalanceWorkersAfterPopulationChange } = M;

// --- test harness ----------------------------------------------------------
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log('  [OK] ' + msg);
  } else {
    failed++;
    console.error('  [FAIL] ' + msg);
  }
}

function eq(a, b, msg) {
  if (a === b) {
    passed++;
    console.log('  [OK] ' + msg);
  } else {
    failed++;
    console.error('  [FAIL] ' + msg + ' -- got ' + JSON.stringify(a) + ', expected ' + JSON.stringify(b));
  }
}

// --- build fake map --------------------------------------------------------
// hexes for q,r in [-11..11], key "q,r", value { terenBazowy: 0 }
const hexes = {};
for (let q = -11; q <= 11; q++) {
  for (let r = -11; r <= 11; r++) {
    hexes[q + ',' + r] = { terenBazowy: 0 };
  }
}
const map = { szerokoscQ: 23, wysokoscR: 23, hexes, seed: 42 };

// --- tests -----------------------------------------------------------------
console.log('\n[okolica-test] Running tests...\n');

// Test 1: OKOLICA_RADIUS should be 10 (from miasto-params.json)
console.log('1. OKOLICA_RADIUS');
eq(OKOLICA_RADIUS, 10, 'OKOLICA_RADIUS === 10');

// Test 2: okolicaTiles basic
console.log('\n2. okolicaTiles(0,0,10,map)');
const tiles = okolicaTiles(0, 0, 10, map);
assert(tiles.length > 0, 'tiles.length > 0');
assert(tiles.every(function(t) { return t.dist <= 10; }), 'every tile has dist <= 10');
assert(!tiles.some(function(t) { return t.q === 0 && t.r === 0; }), 'center (0,0) excluded');

// Test 3: assignWorkedTiles -- best tile selected first
// Explicit radius:10 -- testuje wybor najlepszego pola niezaleznie od modelu
// dynamicznego zasięgu (pop=2 daje radius=2 w nowym modelu, ale (3,0) jest w d=3).
console.log('\n3. assignWorkedTiles best-tile-first');
function yieldOf(q, r) {
  if (q === 3 && r === 0) return { zywnosc: 99 };
  return { zywnosc: 1 };
}
const worked = assignWorkedTiles(0, 0, 2, map, yieldOf, { radius: 10 });
eq(worked.length, 2, 'worked.length === 2');
eq(worked[0].q, 3, 'best tile q === 3');
eq(worked[0].r, 0, 'best tile r === 0');

// Test 4: clamp -- population larger than available tiles -> clamp
console.log('\n4. clamp to tile count');
const allTiles = okolicaTiles(0, 0, 10, map);
const bigPop = allTiles.length + 100;
// pass explicit radius:10 to test clamping independent of dynamic-radius logic
const clamped = assignWorkedTiles(0, 0, bigPop, map, yieldOf, { radius: 10 });
eq(clamped.length, allTiles.length, 'clamped to available tile count (radius:10)');

// Test 5: population 0 -> []
console.log('\n5. population 0');
const zeroPop = assignWorkedTiles(0, 0, 0, map, yieldOf);
eq(zeroPop.length, 0, 'population 0 -> empty array');

// Test 6: determinism
console.log('\n6. determinism');
const run1 = assignWorkedTiles(0, 0, 10, map, yieldOf);
const run2 = assignWorkedTiles(0, 0, 10, map, yieldOf);
const same = run1.length === run2.length && run1.every(function(t, i) { return t.key === run2[i].key; });
assert(same, 'two identical calls produce identical results');

// Test 7: cityRangeForPopulation -- max(5, pop), cap 15 (Maciej 2026-06-27)
console.log('\n7. cityRangeForPopulation (min 5, rosnie z pop, cap 15)');
eq(cityRangeForPopulation(0),  0,  'pop 0  -> 0');
eq(cityRangeForPopulation(1),  5,  'pop 1  -> 5 (min start)');
eq(cityRangeForPopulation(4),  5,  'pop 4  -> 5 (min start)');
eq(cityRangeForPopulation(5),  5,  'pop 5  -> 5');
eq(cityRangeForPopulation(9),  9,  'pop 9  -> 9');
eq(cityRangeForPopulation(10), 10, 'pop 10 -> 10');
eq(cityRangeForPopulation(15), 15, 'pop 15 -> 15 (cap)');
eq(cityRangeForPopulation(20), 15, 'pop 20 -> 15 (capped at max)');

// Test 8: adjustTileWorker — przypisz / odznacz / toggle
console.log('\n8. adjustTileWorker (reczny)');
const cityManual = { q: 0, r: 0, population: 3, okolicaReczne: {}, okolicaTryb: 'reczny' };
const a1 = adjustTileWorker(cityManual, map, 1, 0, 1);
assert(a1.ok && a1.reczne['1,0'] === 1, 'assign worker to 1,0');
const a2 = adjustTileWorker({ ...cityManual, okolicaReczne: a1.reczne }, map, 1, 0, -1);
assert(a2.ok && a2.reczne['1,0'] === undefined, 'unassign worker from 1,0');
const a3 = adjustTileWorker({ ...cityManual, okolicaTryb: 'reczny', okolicaReczne: { '1,0': 1 } }, map, 1, 0, 1);
assert(a3.ok && a3.reczne['1,0'] === undefined, 'toggle off via delta +1 on occupied hex');

// Test 9: auto → reczny seed (nie reset do 1 pola)
console.log('\n9. seedReczneFromAuto');
const cityAuto = { q: 0, r: 0, population: 3, okolicaFocus: 'zrownowazone', okolicaTryb: 'auto' };
const seeded = seedReczneFromAuto(cityAuto, map);
assert(Object.keys(seeded).length === 3, 'seed copies 3 auto tiles for pop 3');
const firstKey = Object.keys(seeded)[0];
const parts = firstKey.split(',');
const tq = Number(parts[0]), tr = Number(parts[1]);
const unassign = adjustTileWorker(cityAuto, map, tq, tr, -1);
assert(unassign.ok && unassign.reczne[firstKey] === undefined, 'unassign from auto-seeded state');
assert(Object.keys(unassign.reczne).length === 2, '2 tiles remain after unassign one');

// Test 10: toggleTileWorker — klik wolne z auto (pop=1) przypisuje na wybrane pole
console.log('\n10. toggleTileWorker empty click from auto assigns chosen tile');
const cityPop1 = { q: 0, r: 0, population: 1, okolicaFocus: 'zrownowazone', okolicaTryb: 'auto' };
const seeded1 = seedReczneFromAuto(cityPop1, map);
assert(Object.keys(seeded1).length === 1, 'auto seeds 1 tile for pop 1');
const oldKey = Object.keys(seeded1)[0];
const alt = okolicaTiles(0, 0, 5, map).find(function(t) { return t.key !== oldKey; });
assert(!!alt, 'find alternate tile in range');
const tPick = toggleTileWorker(cityPop1, map, alt.q, alt.r);
assert(tPick.ok && tPick.reczne[alt.key] === 1 && tPick.reczne[oldKey] === undefined,
  'empty click from auto assigns worker on chosen tile (not blocked by auto elsewhere)');
const tBlocked = toggleTileWorker(
  { ...cityPop1, okolicaTryb: 'reczny', okolicaReczne: tPick.reczne },
  map, Number(oldKey.split(',')[0]), Number(oldKey.split(',')[1]),
);
assert(!tBlocked.ok && tBlocked.reason === 'limit_populacji', 'full pool + empty click = no assign');
const tOff = toggleTileWorker(
  { ...cityPop1, okolicaTryb: 'reczny', okolicaReczne: tPick.reczne },
  map, alt.q, alt.r,
);
assert(tOff.ok && tOff.reczne[alt.key] === undefined, 'toggle off occupied tile');
const tCenter = toggleTileWorker(cityPop1, map, 0, 0);
assert(!tCenter.ok && tCenter.reason === 'centrum_miasta', 'city center rejected');

// Test 11: reczny z pustą pulą — można dodawać od zera (bez powrotu do auto)
console.log('\n11. reczny empty pool — assign from scratch');
const tEmpty = toggleTileWorker(
  { q: 0, r: 0, population: 2, okolicaTryb: 'reczny', okolicaReczne: {} },
  map, 1, 0,
);
assert(tEmpty.ok && tEmpty.reczne['1,0'] === 1, 'assign first worker from empty manual pool');
const tRemove = toggleTileWorker(
  { q: 0, r: 0, population: 2, okolicaTryb: 'reczny', okolicaReczne: tEmpty.reczne },
  map, 1, 0,
);
assert(tRemove.ok && Object.keys(tRemove.reczne).length === 0, 'remove last worker leaves empty manual pool');

// Test 12: wzrost populacji w trybie recznym — auto-przydział brakującego 👤
console.log('\n12. rebalanceWorkersAfterPopulationChange (reczny growth)');
const cityGrow = {
  id: 'c0', ownerId: 0, q: 0, r: 0, name: 'T', population: 3,
  okolicaTryb: 'reczny',
  okolicaReczne: { '1,0': 1, '0,1': 1 },
};
rebalanceWorkersAfterPopulationChange(cityGrow, map, 2, 3);
const assignedAfterGrow = Object.values(cityGrow.okolicaReczne ?? {}).filter(n => n > 0).length;
eq(assignedAfterGrow, 3, 'reczny +1 pop → trzeci 👤 na wolnym polu');

// Test 13: auto tryb — rebalance nie dotyka reczne
console.log('\n13. rebalanceWorkersAfterPopulationChange (auto noop)');
const cityAutoGrow = {
  id: 'c1', ownerId: 0, q: 0, r: 0, name: 'A', population: 4,
  okolicaTryb: 'auto',
  okolicaReczne: undefined,
};
rebalanceWorkersAfterPopulationChange(cityAutoGrow, map, 3, 4);
eq(cityAutoGrow.okolicaReczne, undefined, 'auto mode: no manual reczne written');

// --- summary ---------------------------------------------------------------
const total = passed + failed;
if (failed === 0) {
  console.log('\nOKOLICA OK (' + passed + '/' + total + ')');
} else {
  console.log('\nOKOLICA FAIL (' + passed + '/' + total + ' passed, ' + failed + ' failed)');
}

// Clean up temp artifacts.
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed === 0 ? 0 : 1);
