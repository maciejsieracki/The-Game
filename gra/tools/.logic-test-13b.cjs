'use strict';
/**
 * logic-test.cjs — Reusable Node logic test for The Game pure functions.
 * Run: node tools/logic-test.cjs  (from gra/ directory)
 *
 * Uses esbuild to bundle src/ TypeScript to a temp CJS file, then requires
 * it and runs assertions against the pure logic functions.
 *
 * The entry file is written to gra/tools/.logic-entry.ts so that
 * relative imports like '../src/...' resolve relative to gra/tools/.
 */

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// 1. Bundle the source with esbuild
// ---------------------------------------------------------------------------

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[logic-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

// Entry file: tiny TS that re-exports everything we need to test.
// Written into tools/ so ../src/ resolves correctly.
const ENTRY_FILE  = path.resolve(__dirname, '.logic-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.logic-bundle.cjs');

const ENTRY_TS = `
import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
import { placeStartingUnits, computeReachable, computePath, keyOf, hexDistance } from '../src/units/setup';
import { computeVisible, DEFAULT_SIGHT } from '../src/game/visibility';
import { canFoundCity, foundCity, cityName } from '../src/game/cities';
import { loadGameData } from '../src/data/loader';
import { advanceCityEconomy, buildEconParams, workedTilesForCity } from '../src/game/turn-economy';

export {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  placeStartingUnits, computeReachable, computePath, keyOf, hexDistance,
  computeVisible, DEFAULT_SIGHT,
  canFoundCity, foundCity, cityName,
  loadGameData,
  advanceCityEconomy, buildEconParams, workedTilesForCity,
};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf-8');

console.log('[logic-test] Bundling src/ with esbuild...');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle:      true,
    platform:    'node',
    format:      'cjs',
    outfile:     BUNDLE_FILE,
    loader:      { '.json': 'json', '.ts': 'ts' },
    target:      ['node16'],
    logLevel:    'warning',
  });
} catch (e) {
  console.error('[logic-test] esbuild failed:', e.message || e);
  process.exit(1);
}
console.log('[logic-test] Bundle written to', BUNDLE_FILE);

// ---------------------------------------------------------------------------
// 2. Require the bundle
// ---------------------------------------------------------------------------

const {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  placeStartingUnits, computeReachable, computePath, keyOf, hexDistance,
  computeVisible, DEFAULT_SIGHT,
  canFoundCity, foundCity, cityName,
  loadGameData,
  advanceCityEconomy, buildEconParams, workedTilesForCity,
} = require(BUNDLE_FILE);

// ---------------------------------------------------------------------------
// 3. Assertion helpers
// ---------------------------------------------------------------------------

let passed = 0;
let total  = 0;
const failures = [];

function assert(label, cond, extra) {
  total++;
  if (cond) {
    console.log(`PASS  [${total}] ${label}`);
    passed++;
  } else {
    const msg = extra ? `${label} — ${extra}` : label;
    console.log(`FAIL  [${total}] ${msg}`);
    failures.push(msg);
  }
}

// ---------------------------------------------------------------------------
// 4. Tests
// ---------------------------------------------------------------------------

// ── Test 1: generateMap ────────────────────────────────────────────────────
const map = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 12345);
const hexCount = Object.keys(map.hexes).length;
assert('generateMap hexes > 100', hexCount > 100, `hexCount=${hexCount}`);

// ── Test 2: placeStartingUnits ─────────────────────────────────────────────
const data = loadGameData();
const units = placeStartingUnits(map, data);

assert('placeStartingUnits returns >= 4 units', units.length >= 4,
  `units.length=${units.length}`);

const playerUnits = units.filter(u => u.ownerId === 0);
assert('at least one player (ownerId===0) unit', playerUnits.length >= 1,
  `playerUnits.length=${playerUnits.length}`);

const allHaveCategory = units.every(u => typeof u.category === 'string' && u.category.length > 0);
assert('every unit has non-empty string category', allHaveCategory);

const settler = playerUnits[0];
assert('player settler category === "osadnik"', settler.category === 'osadnik',
  `category="${settler.category}"`);

// ── Test 3: computeReachable ───────────────────────────────────────────────
const reach = computeReachable(settler, map, new Set());

assert('computeReachable returns size > 0', reach.size > 0, `reach.size=${reach.size}`);

const settlerKey = keyOf(settler.q, settler.r);
assert('computeReachable does NOT contain settler own hex',
  !reach.has(settlerKey), `settlerKey=${settlerKey}`);

// ── Test 4: computePath ────────────────────────────────────────────────────
const reachArray = [...reach];
const [destQ, destR] = reachArray[0].split(',').map(Number);

const path_ = computePath(settler, map, destQ, destR, new Set());
assert('computePath returns non-empty path', path_.length > 0,
  `path_.length=${path_.length}`);

const lastStep = path_[path_.length - 1];
assert('computePath last step === dest',
  lastStep && lastStep.q === destQ && lastStep.r === destR,
  `last=${JSON.stringify(lastStep)}, dest=(${destQ},${destR})`);

const pathContainsStart = path_.some(p => p.q === settler.q && p.r === settler.r);
assert('computePath does not include start hex', !pathContainsStart);

// ── Test 5: computeVisible ─────────────────────────────────────────────────
const vis = computeVisible([settler], map, DEFAULT_SIGHT);

assert('computeVisible includes settler own hex',
  vis.has(settlerKey), `settlerKey=${settlerKey}`);

const allVisInMap = [...vis].every(k => k in map.hexes);
assert('every key in computeVisible exists in map.hexes', allVisInMap);

// ── Test 6: canFoundCity ───────────────────────────────────────────────────
const cities = [];
const r0 = canFoundCity(settler.q, settler.r, cities, map);
assert('canFoundCity on settler (land) returns ok=true', r0.ok === true,
  `ok=${r0.ok}, reason="${r0.reason}"`);

// Find a Morze (water) hex
let waterQ = null, waterR = null;
for (const [key, hex] of Object.entries(map.hexes)) {
  if (hex.terenBazowy === 'morze') {
    [waterQ, waterR] = key.split(',').map(Number);
    break;
  }
}
if (waterQ !== null) {
  const rWater = canFoundCity(waterQ, waterR, cities, map);
  assert('canFoundCity on water hex returns reason="morze"',
    rWater.reason === 'morze',
    `reason="${rWater.reason}"`);
} else {
  assert('no water hex found on map (skipping water test)', false,
    'Could not find a Morze hex');
}

// ── Test 7: foundCity + distance rules ────────────────────────────────────
const cityNameStr = cityName(0);
const c = foundCity(settler, cities, map, cityNameStr);
assert('foundCity returns non-null', c !== null);
assert('foundCity population === 1', c !== null && c.population === 1,
  `population=${c ? c.population : 'N/A'}`);

if (c !== null) {
  cities.push(c);

  // Find a land hex at hexDistance < 5 from the city
  let nearQ = null, nearR = null;
  let farQ  = null, farR  = null;
  for (const [key, hex] of Object.entries(map.hexes)) {
    if (hex.terenBazowy === 'morze' || hex.terenBazowy === 'wybrzeze' || hex.terenBazowy === 'gory') continue;
    const [hq, hr] = key.split(',').map(Number);
    const d = hexDistance(hq, hr, c.q, c.r);
    if (d > 0 && d < 5 && nearQ === null) {
      nearQ = hq; nearR = hr;
    }
    if (d >= 5 && farQ === null) {
      farQ = hq; farR = hr;
    }
    if (nearQ !== null && farQ !== null) break;
  }

  if (nearQ !== null) {
    const rNear = canFoundCity(nearQ, nearR, cities, map);
    assert('canFoundCity near city returns "za blisko innego miasta"',
      rNear.reason === 'za blisko innego miasta',
      `reason="${rNear.reason}", dist=${hexDistance(nearQ, nearR, c.q, c.r)}`);
  } else {
    assert('could not find land hex < 5 from city (skipping near-city test)', false);
  }

  if (farQ !== null) {
    const rFar = canFoundCity(farQ, farR, cities, map);
    assert('canFoundCity far from city returns ok=true', rFar.ok === true,
      `ok=${rFar.ok}, reason="${rFar.reason}", dist=${hexDistance(farQ, farR, c.q, c.r)}`);
  } else {
    assert('could not find land hex >= 5 from city (skipping far-city test)', false);
  }
}

// ── Test 8: per-turn economy tick (task 13B) ──────────────────────────────
// buildEconParams must read the diacritic JSON key without throwing, and
// produce finite numeric params.
const econParams = buildEconParams(data, 'normal');
assert('buildEconParams returns finite progWzrostuWspolczynnik',
  Number.isFinite(econParams.progWzrostuWspolczynnik) && econParams.progWzrostuWspolczynnik > 0,
  `value=${econParams.progWzrostuWspolczynnik}`);
assert('buildEconParams trade-science slider default === 60',
  econParams.suwaakHandelNaukaDefault === 60,
  `value=${econParams.suwaakHandelNaukaDefault}`);

// Found a fresh city on the settler's land hex for an isolated economy test.
const econMap = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 777);
const econUnits = placeStartingUnits(econMap, data);
const econSettler = econUnits.find(u => u.ownerId === 0 && u.category === 'osadnik');
assert('economy: found a player settler', !!econSettler);

if (econSettler) {
  const econCity = foundCity(econSettler, [], econMap, cityName(0));
  assert('economy: foundCity for tick test non-null', econCity !== null);

  if (econCity) {
    // Worked tiles = centre + up to 6 neighbours, all present on the map.
    const worked = workedTilesForCity(econCity, econMap);
    assert('economy: workedTilesForCity returns 1..7 tiles',
      worked.length >= 1 && worked.length <= 7, `worked=${worked.length}`);
    assert('economy: every worked tile has a terenBazowy',
      worked.every(t => typeof t.terenBazowy === 'string' && t.terenBazowy.length > 0));

    const econCities = [econCity];
    const popBefore  = econCity.population;

    // Run several ticks; the call must never throw and must return an aggregate.
    let res;
    for (let i = 0; i < 5; i++) {
      res = advanceCityEconomy(econCities, econMap, data, 'normal');
    }
    assert('economy: advanceCityEconomy processed 1 city', res && res.cities === 1,
      `cities=${res ? res.cities : 'N/A'}`);
    assert('economy: aggregate yields are finite numbers',
      res && Number.isFinite(res.totalPraca) && Number.isFinite(res.totalNauka) &&
      Number.isFinite(res.totalPieniadz) && Number.isFinite(res.totalZywnosc),
      `praca=${res && res.totalPraca}, nauka=${res && res.totalNauka}`);
    // Granary-less model floors store to 0 each turn, so assert it is a number >= 0.
    assert('economy: city food store is a number >= 0',
      typeof econCity.magazynZywnosci === 'number' && econCity.magazynZywnosci >= 0,
      `store=${econCity.magazynZywnosci}`);
    assert('economy: population never goes below 1',
      econCity.population >= 1, `pop=${econCity.population} (was ${popBefore})`);
    assert('economy: per-city result carries zywnoscNetto',
      res && res.perCity.length === 1 && Number.isFinite(res.perCity[0].zywnoscNetto),
      `perCity=${res ? res.perCity.length : 'N/A'}`);
  }
}

// ---------------------------------------------------------------------------
// 5. Summary
// ---------------------------------------------------------------------------
console.log('');
if (failures.length === 0) {
  console.log(`LOGIC OK (${passed}/${total})`);
  process.exit(0);
} else {
  console.log(`LOGIC FAIL (${passed}/${total})`);
  console.log('Failures:');
  for (const f of failures) {
    console.log(`  x ${f}`);
  }
  process.exit(1);
}
