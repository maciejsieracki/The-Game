'use strict';
/**
 * perf-sibling-memo-test.cjs — R-WEB-PERF-LATE-GAME-LAG-T86-Q1
 *
 * Regression for the late-game "everything is slow" report: `computeLostToNearerSiblingByCity`
 * (okolica.ts) is called by the UI once per player city on EVERY `syncUnitsRender`
 * (cityGrowthLive -> computeView -> getExcludeHexKeys -> siblingClaimedHexKeysForCity), i.e. after
 * every unit move / city entry. Un-memoized that is O(player_cities x all_cities x radius^2) per click
 * (measured: ~68% of refreshFog time on a 40+90 city world). The function is pure, so it is now
 * memoized on an input signature.
 *
 * Gates (wide thresholds on purpose, no flaky absolute timing):
 *   1. correctness: memoized result == fresh (cache-miss) result, key-for-key;
 *   2. invalidation: population/radius change, owner change, city order change => new result;
 *   3. budget: 40 UI-style calls (one per player city) cost < 3x ONE cold call (+20 ms slack);
 *      un-memoized they cost ~40x.
 *
 * Run from gra/: node tools/perf-sibling-memo-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA_DIR = path.resolve(__dirname, '..');
let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  PASS: ' + label); }
  else { fail++; console.log('  FAIL: ' + label + (detail ? ' -- ' + detail : '')); }
}

const esbuild = require(path.resolve(GRA_DIR, 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.perf-sibling-memo-entry.ts');
const bundle = path.resolve(__dirname, '.perf-sibling-memo-bundle.cjs');
fs.writeFileSync(entry, "export { computeLostToNearerSiblingByCity } from '../src/game/okolica';\n");
try {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, absWorkingDir: GRA_DIR, logLevel: 'silent',
  });
  const { computeLostToNearerSiblingByCity } = require(bundle);

  // Synthetic world: 90x90 hexes, 40 player cities + 6 AI x 15, spacing 4 (as the stress scenario).
  const W = 90;
  const mkMap = () => {
    const hexes = {};
    for (let q = 0; q < W; q++) for (let r = 0; r < W; r++) hexes[q + ',' + r] = { terenBazowy: 'Rownina' };
    return { szerokoscQ: W, wysokoscR: W, hexes };
  };
  const cities = [];
  let n = 0;
  const owners = [0, 1, 3, 5, 7, 9, 11];
  const want = { 0: 40, 1: 15, 3: 15, 5: 15, 7: 15, 9: 15, 11: 15 };
  const placed = {};
  outer:
  for (let q = 2; q < W - 2; q += 4) {
    for (let r = 2; r < W - 2; r += 4) {
      const owner = owners.find(o => (placed[o] || 0) < want[o]);
      if (owner === undefined) break outer;
      placed[owner] = (placed[owner] || 0) + 1;
      cities.push({ id: 'c' + (n++), q, r, population: 5 + (n % 8), ownerId: owner });
    }
  }
  check('scenario has 130 cities', cities.length === 130, 'got ' + cities.length);
  const toObj = m => {
    const o = {};
    for (const [k, v] of m) o[k] = [...v].sort();
    return o;
  };

  // 1. correctness: a different map object with identical hexes bypasses the WeakMap memo.
  const mapA = mkMap();
  const mapB = mkMap();
  const memoized = computeLostToNearerSiblingByCity(cities, mapA);
  const memoizedAgain = computeLostToNearerSiblingByCity(cities, mapA);
  const fresh = computeLostToNearerSiblingByCity(cities, mapB);
  check('repeat call returns the identical cached instance', memoized === memoizedAgain);
  check('memoized result equals fresh result key-for-key',
    JSON.stringify(toObj(memoized)) === JSON.stringify(toObj(fresh)));
  check('scenario actually has contested hexes (test is not vacuous)', memoized.size > 10, 'size ' + memoized.size);

  // 2. invalidation
  const grown = cities.map((c, i) => i === 3 ? { ...c, population: c.population + 6 } : c);
  const rGrown = computeLostToNearerSiblingByCity(grown, mapA);
  check('population change that changes radius => recomputed (not stale)', rGrown !== memoized);
  const rGrownFresh = computeLostToNearerSiblingByCity(grown, mkMap());
  check('recomputed result equals fresh result', JSON.stringify(toObj(rGrown)) === JSON.stringify(toObj(rGrownFresh)));
  const sameRadius = cities.map((c, i) => i === 3 ? { ...c, population: c.population } : c);
  check('equal inputs (new array, same values) hit the memo', computeLostToNearerSiblingByCity(sameRadius, mapA) === memoized);
  const swapped = cities.slice(); [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
  const rSwapped = computeLostToNearerSiblingByCity(swapped, mapA);
  const rSwappedFresh = computeLostToNearerSiblingByCity(swapped, mkMap());
  check('city order change (tiebreak input) => recomputed and equal to fresh',
    rSwapped !== memoized && JSON.stringify(toObj(rSwapped)) === JSON.stringify(toObj(rSwappedFresh)));
  const flipped = cities.map((c, i) => i === 5 ? { ...c, ownerId: c.ownerId === 0 ? 1 : 0 } : c);
  check('owner change => recomputed', computeLostToNearerSiblingByCity(flipped, mapA) !== memoized);

  // 3. budget: UI path = one call per player city (40) on a state the memo has not seen yet.
  const mapC = mkMap();
  const t0 = process.hrtime.bigint();
  computeLostToNearerSiblingByCity(cities, mapC); // cold
  const coldMs = Number(process.hrtime.bigint() - t0) / 1e6;
  const t1 = process.hrtime.bigint();
  for (let i = 0; i < 40; i++) computeLostToNearerSiblingByCity(cities, mapC);
  const warm40Ms = Number(process.hrtime.bigint() - t1) / 1e6;
  console.log('  info: cold ' + coldMs.toFixed(2) + ' ms; 40 warm calls ' + warm40Ms.toFixed(2) + ' ms (un-memoized would be ~' + (coldMs * 40).toFixed(0) + ' ms)');
  check('40 UI-style calls cost < 3x one cold call + 20 ms', warm40Ms < 3 * coldMs + 20,
    'cold ' + coldMs.toFixed(2) + ' ms, 40 warm ' + warm40Ms.toFixed(2) + ' ms');
} finally {
  try { fs.unlinkSync(entry); } catch {}
  try { fs.unlinkSync(bundle); } catch {}
}
console.log('\nRESULT: ' + pass + ' PASS, ' + fail + ' FAIL');
process.exit(fail === 0 ? 0 : 1);
