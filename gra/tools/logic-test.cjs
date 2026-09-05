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
import { computeStartPlacements, placeStartingUnits, computeReachable, computePath, keyOf, hexDistance } from '../src/units/setup';
import { computeVisible, DEFAULT_SIGHT, computePlayerVisibility, buildUnitSightResolver, computeVisibleAt, unitsVisibleOnMap } from '../src/game/visibility';
import { canFoundCity, foundCity, foundCityAt, cityName, MIN_CITY_DISTANCE } from '../src/game/cities';
import { loadGameData } from '../src/data/loader';
import { advanceCityEconomy, buildEconParams, workedTilesForCity } from '../src/game/turn-economy';
import { readCityFoodBuffer } from '../src/game/economy-upkeep';
import {
  createPlayerState, researchStep, cheapestAvailable, availableTechs,
  parsePrereqs, prereqsMet, techCost, isEraAdvanceTech, isMoneyTech, PIENIADZ_MNOZNIK,
  setPlayerResearchTarget, getResearchState,
} from '../src/game/playerState';
import { scaledResearchCost } from '../src/game/difficulty-cost';
import {
  placeDeposits, computeStartPositions, DEPOSIT_RULES, isLandTerrain, hexDistanceAxial,
} from '../src/map/gen-helpers';
import {
  cityDefenseBonus, resolveSiegeAttack, canCaptureCity, captureCity, canEnemyCapture,
  applyCityBonus, terrainDefenseMult, makeMilitia, effectiveGarrison,
  wallParamsFromBuildings, hitChance as siegeHitChance, baseDamage as siegeBaseDamage,
  WALL_BASE_OBRONA, WALL_PER_LEVEL_OBRONA, HILL_DEFENSE_MULT, MILITIA_POP_FRACTION,
} from '../src/game/siege';
import {
  computeOrder, orderTier, orderEffects, loadOrderParams, evaluateOrder,
  orderEffectsToYieldMults, pickRevoltMigrationTarget,
  FALLBACK_ORDER_PARAMS,
} from '../src/game/order';
import { isInTerritory } from '../src/map/territory';
import { cityRangeForPopulation, citySightRadius } from '../src/game/okolica';
import {
  loadCultureParams, FALLBACK_CULTURE_PARAMS, cultureThresholds,
  cityBorderRadius, accumulateCulture, cultureHappiness, convertCulture,
  loadReligionParams, FALLBACK_RELIGION_PARAMS, civReligion, isKnownCiv,
  dominantReligion, religionHappiness, spreadReligion, convertViaTemple, makeRng,
} from '../src/game/culture-religion';
import societyParamsRaw from '../data/society-params.json';
import civsRaw from '../data/civs.json';

export {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  computeStartPlacements, placeStartingUnits, computeReachable, computePath, keyOf, hexDistance,
  computeVisible, DEFAULT_SIGHT, computePlayerVisibility, buildUnitSightResolver, computeVisibleAt, unitsVisibleOnMap,
  canFoundCity, foundCity, foundCityAt, cityName, MIN_CITY_DISTANCE,
  loadGameData,
  advanceCityEconomy, buildEconParams, workedTilesForCity, readCityFoodBuffer,
  createPlayerState, researchStep, cheapestAvailable, availableTechs,
  parsePrereqs, prereqsMet, techCost, isEraAdvanceTech, isMoneyTech, PIENIADZ_MNOZNIK,
  setPlayerResearchTarget, getResearchState, scaledResearchCost,
  placeDeposits, computeStartPositions, DEPOSIT_RULES, isLandTerrain, hexDistanceAxial,
  cityDefenseBonus, resolveSiegeAttack, canCaptureCity, captureCity, canEnemyCapture,
  applyCityBonus, terrainDefenseMult, makeMilitia, effectiveGarrison,
  wallParamsFromBuildings, siegeHitChance, siegeBaseDamage,
  WALL_BASE_OBRONA, WALL_PER_LEVEL_OBRONA, HILL_DEFENSE_MULT, MILITIA_POP_FRACTION,
  computeOrder, orderTier, orderEffects, loadOrderParams, evaluateOrder,
  orderEffectsToYieldMults, pickRevoltMigrationTarget,
  FALLBACK_ORDER_PARAMS, societyParamsRaw,
  isInTerritory, cityRangeForPopulation, citySightRadius,
  loadCultureParams, FALLBACK_CULTURE_PARAMS, cultureThresholds,
  cityBorderRadius, accumulateCulture, cultureHappiness, convertCulture,
  loadReligionParams, FALLBACK_RELIGION_PARAMS, civReligion, isKnownCiv,
  dominantReligion, religionHappiness, spreadReligion, convertViaTemple, makeRng,
  civsRaw,
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
  computeStartPlacements, placeStartingUnits, computeReachable, computePath, keyOf, hexDistance,
  computeVisible, DEFAULT_SIGHT, computePlayerVisibility, buildUnitSightResolver, computeVisibleAt, unitsVisibleOnMap,
  canFoundCity, foundCity, foundCityAt, cityName, MIN_CITY_DISTANCE,
  loadGameData,
  advanceCityEconomy, buildEconParams, workedTilesForCity, readCityFoodBuffer,
  createPlayerState, researchStep, cheapestAvailable, availableTechs,
  parsePrereqs, prereqsMet, techCost, isEraAdvanceTech, isMoneyTech, PIENIADZ_MNOZNIK,
  setPlayerResearchTarget, getResearchState, scaledResearchCost,
  placeDeposits, computeStartPositions, DEPOSIT_RULES, isLandTerrain, hexDistanceAxial,
  cityDefenseBonus, resolveSiegeAttack, canCaptureCity, captureCity, canEnemyCapture,
  applyCityBonus, terrainDefenseMult, makeMilitia, effectiveGarrison,
  wallParamsFromBuildings, siegeHitChance, siegeBaseDamage,
  WALL_BASE_OBRONA, WALL_PER_LEVEL_OBRONA, HILL_DEFENSE_MULT, MILITIA_POP_FRACTION,
  computeOrder, orderTier, orderEffects, loadOrderParams, evaluateOrder,
  orderEffectsToYieldMults, pickRevoltMigrationTarget,
  FALLBACK_ORDER_PARAMS, societyParamsRaw,
  isInTerritory, cityRangeForPopulation, citySightRadius,
  loadCultureParams, FALLBACK_CULTURE_PARAMS, cultureThresholds,
  cityBorderRadius, accumulateCulture, cultureHappiness, convertCulture,
  loadReligionParams, FALLBACK_RELIGION_PARAMS, civReligion, isKnownCiv,
  dominantReligion, religionHappiness, spreadReligion, convertViaTemple,
  makeRng: crMakeRng,
  civsRaw,
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

// ── Test 2: computeStartPlacements ─────────────────────────────────────────
const data = loadGameData();
const startPl = computeStartPlacements(map, data);

assert('computeStartPlacements has playerStart',
  startPl.playerStart && Number.isFinite(startPl.playerStart.q),
  `playerStart=${JSON.stringify(startPl.playerStart)}`);

assert('computeStartPlacements aiStarts >= 3', startPl.aiStarts.length >= 3,
  `aiStarts.length=${startPl.aiStarts.length}`);

assert('placeStartingUnits returns empty (A-START-01)', placeStartingUnits(map, data).length === 0);

const settler = {
  id: 'test_settler',
  ownerId: 0,
  typeId: 'Osadnik',
  category: 'osadnik',
  q: startPl.playerStart.q,
  r: startPl.playerStart.r,
  ruch: 2,
  ruchLeft: 2,
};

assert('synthetic settler category === "osadnik"', settler.category === 'osadnik',
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

// ── Test 5b: citySightRadius + computePlayerVisibility (B-zasieg-miasta-fog) ─
assert('cityRangeForPopulation(4) === 5 (min start)', cityRangeForPopulation(4) === 5,
  `got ${cityRangeForPopulation(4)}`);
assert('cityRangeForPopulation(9) === 9', cityRangeForPopulation(9) === 9,
  `got ${cityRangeForPopulation(9)}`);
assert('cityRangeForPopulation(20) === 15 (cap)', cityRangeForPopulation(20) === 15,
  `got ${cityRangeForPopulation(20)}`);
assert('citySightRadius(9,0) === 9', citySightRadius(9, 0) === 9,
  `got ${citySightRadius(9, 0)}`);
assert('citySightRadius(1,0) === 5', citySightRadius(1, 0) === 5,
  `got ${citySightRadius(1, 0)}`);

const cityVis = computePlayerVisibility({
  map,
  playerUnits: [],
  playerCities: [{ q: settler.q, r: settler.r, population: 9, kultura: 0 }],
  unitSight: buildUnitSightResolver([]),
});
let cityVisDistMax = 0;
for (const k of cityVis) {
  const [cq, cr] = k.split(',').map(Number);
  cityVisDistMax = Math.max(cityVisDistMax, hexDistance(settler.q, settler.r, cq, cr));
}
assert('computePlayerVisibility city pop9 radius <= 9', cityVisDistMax <= 9,
  `maxDist=${cityVisDistMax}`);
assert('computePlayerVisibility city pop9 radius >= 9 at edge',
  cityVisDistMax >= 9, `maxDist=${cityVisDistMax}`);

const startOnlyVis = computePlayerVisibility({
  map,
  playerUnits: [],
  playerCities: [],
  unitSight: buildUnitSightResolver([]),
  startHex: { q: settler.q, r: settler.r },
  startRevealRadius: 5,
});
let startDistMax = 0;
for (const k of startOnlyVis) {
  const [sq, sr] = k.split(',').map(Number);
  startDistMax = Math.max(startDistMax, hexDistance(settler.q, settler.r, sq, sr));
}
assert('computePlayerVisibility start fallback radius <= 5', startDistMax <= 5,
  `maxDist=${startDistMax}`);

// ── Test 5c: unitsVisibleOnMap (FoW — obcy tylko w bieżącym zasięgu) ───────
// Semantyka garnizonu (C-GARN-Q1, FALA 23-25, commit 579dec89 2026-07-26): garnizon
// WŁASNY gracza jest widoczny jako token na heksie miasta (koszary); garnizon PRZECIWNIKA
// pozostaje ukryty niezależnie od zasięgu widzenia (nie ujawnia siły obrony miasta wroga).
const fogPlayer = { id: 'p0', ownerId: 0, q: settler.q, r: settler.r, typeId: 'Osadnik', inGarnizon: false };
const fogEnemyHidden = { id: 'e0', ownerId: 2, q: settler.q + 20, r: settler.r, typeId: 'Wojownik', inGarnizon: false };
const fogEnemyVisible = { id: 'e1', ownerId: 2, q: settler.q + 1, r: settler.r, typeId: 'Wojownik', inGarnizon: false };
const fogGarnizon = { id: 'g0', ownerId: 0, q: settler.q, r: settler.r, typeId: 'Wojownik', inGarnizon: true };
const fogEnemyGarnizon = { id: 'g1', ownerId: 2, q: settler.q + 1, r: settler.r, typeId: 'Wojownik', inGarnizon: true };
const fogVisHexes = new Set([keyOf(settler.q, settler.r), keyOf(settler.q + 1, settler.r)]);
const fogOnMap = unitsVisibleOnMap(
  [fogPlayer, fogEnemyHidden, fogEnemyVisible, fogGarnizon, fogEnemyGarnizon],
  fogVisHexes,
  0,
);
assert('unitsVisibleOnMap always shows player units', fogOnMap.some(u => u.id === 'p0'));
assert('unitsVisibleOnMap hides enemy outside current vision',
  !fogOnMap.some(u => u.id === 'e0'));
assert('unitsVisibleOnMap shows enemy on visible hex',
  fogOnMap.some(u => u.id === 'e1'));
assert('unitsVisibleOnMap shows own garnizon (token na heksie miasta)',
  fogOnMap.some(u => u.id === 'g0'));
assert('unitsVisibleOnMap hides enemy garnizon even on visible hex',
  !fogOnMap.some(u => u.id === 'g1'));

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

  // PRZYPIĘCIE WARTOŚCI (nota N4a Evaluatora, R-BRAMKI-AUDYT-KANONU 2026-08-07).
  // Poniższe asercje używają MIN_CITY_DISTANCE zaimportowanego z testowanego modułu,
  // więc SAME W SOBIE są tautologią — przechodzą dla dowolnej wartości progu, także 1.
  // Bez tego przypięcia żaden test w repo nie pilnuje min_dystans_miast (sprawdzone:
  // trafienia w ai-*-test.cjs dotyczą INNEGO parametru, ekspansja_min_dystans_miast).
  // Wartość 4 heksy = decyzja Macieja, docs/decyzje/R-AI-KOLONIZACJA.md („min dystans 4 hex"),
  // wcześniej 5 heksów. Zmiana tej liczby MA wywalić ten test — to jest jego jedyne zadanie.
  assert('MIN_CITY_DISTANCE = 4 heksy (R-AI-KOLONIZACJA, było 5)',
    MIN_CITY_DISTANCE === 4,
    `MIN_CITY_DISTANCE=${MIN_CITY_DISTANCE} heksów`);

  // Find a land hex at hexDistance < MIN_CITY_DISTANCE from the city (real
  // engine threshold — cities.ts:570, sourced from miasto-params.json
  // min_dystans_miast.wartosc; do NOT hardcode a guessed constant here).
  let nearQ = null, nearR = null;
  let farQ  = null, farR  = null;
  for (const [key, hex] of Object.entries(map.hexes)) {
    if (hex.terenBazowy === 'morze' || hex.terenBazowy === 'plytkie_morze' || hex.terenBazowy === 'gory') continue;
    const [hq, hr] = key.split(',').map(Number);
    const d = hexDistance(hq, hr, c.q, c.r);
    if (d > 0 && d < MIN_CITY_DISTANCE && nearQ === null) {
      nearQ = hq; nearR = hr;
    }
    if (d >= MIN_CITY_DISTANCE && farQ === null) {
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
assert('buildEconParams trade-science slider default === 20',
  econParams.suwaakHandelNaukaDefault === 20, // Maciej 2026-06-25: decyzja 70/20/10 (skarbiec/badania/luksus)
  `value=${econParams.suwaakHandelNaukaDefault}`);

// Found a fresh city on the player start hex for an isolated economy test.
const econMap = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 777);
const econStart = computeStartPlacements(econMap, data);
const econSettler = {
  id: 'econ_settler',
  ownerId: 0,
  typeId: 'Osadnik',
  category: 'osadnik',
  q: econStart.playerStart.q,
  r: econStart.playerStart.r,
  ruch: 2,
  ruchLeft: 2,
};
assert('economy: player start hex resolved', Number.isFinite(econSettler.q));

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
    // city.magazynZywnosci is CELOWO legacy/oblezenie-only (turn-economy.ts:20,
    // comment "magazynZywnosci kept for save compat only"; growth buffer moved to
    // city.wzrostUlamkowy under PYTANIE-85/population-growth-v85). The normal
    // (non-besieged) advanceCityEconomy path never writes city.magazynZywnosci —
    // only the siege branch (turn-economy.ts:2332) does, "zachowanie BEZ ZMIAN
    // (pelna wsteczna kompatybilnosc)" for cities that were never besieged. Every
    // reader goes through getCityFood()/readCityFoodBuffer(), which default
    // undefined -> 0 (economy-upkeep.ts:141-143), so the field being undefined
    // here is the correct, intended state for a city that has never been under
    // siege — assert the real contract (number >= 0 OR undefined), not that a
    // write always happens.
    assert('economy: city food store is a number >= 0 or undefined (oblezenie-only field)',
      econCity.magazynZywnosci === undefined ||
      (typeof econCity.magazynZywnosci === 'number' && econCity.magazynZywnosci >= 0),
      `store=${econCity.magazynZywnosci}`);
    // ODZYSKANIE POKRYCIA (nota N4b Evaluatora, R-BRAMKI-AUDYT-KANONU 2026-08-07).
    // Asercja wyżej została rozszerzona o `=== undefined`, czyli akceptuje dokładnie ten
    // stan, który wcześniej wykrywała — jest bliska pustej. Opis pola jest poprawny
    // (magazynZywnosci to legacy/oblężenie-only), ale przez to zniknęła JAKAKOLWIEK
    // bramka na buforze żywności. Testujemy więc realny kontrakt, na którym stoją
    // wszyscy czytelnicy: readCityFoodBuffer() ZAWSZE zwraca skończoną liczbę >= 0,
    // niezależnie od tego, czy pole jest undefined, liczbą, czy legacy-obiektem
    // { aktualny, pojemnosc } ze starego zapisu (economy-upkeep.ts:141-150).
    // KOREKTA 2026-08-07 (nota N3 Evaluatora): pierwotny komentarz twierdził, że
    // city.wzrostUlamkowy jest „czytane wyłącznie przez `?? 0`". To NIEPRAWDA — pole ma
    // 30 wystąpień w gra/src, a odczyty BEZ domyślnika są m.in. w
    // population-growth-v85.ts:285,364,377,378 oraz w 9 miejscach ui/cityPanel.ts.
    // Wniosek się broni (asercja na wartości tego pola byłaby krucha, bo w ścieżce
    // normalnej nikt go nie zapisuje), ale przesłanka była fałszywa. Ścieżka bez
    // żadnego domyślnika: population-growth-v85.ts:377-378 (tick.wzrostUlamkowyPo)
    // — polega na normalizacji z linii 285.
    {
      const przypadki = [
        [econCity.magazynZywnosci, 'stan po advanceCityEconomy'],
        [undefined, 'undefined (miasto nigdy nieoblegane)'],
        [7, 'liczba dodatnia'],
        [-3, 'liczba ujemna → clamp do 0'],
        [{ aktualny: 5, pojemnosc: 20 }, 'legacy obiekt ze starego zapisu'],
        [NaN, 'NaN'],
        ['12', 'string zamiast liczby'],
      ];
      let bufOk = true, zle = '';
      for (const [wej, opis] of przypadki) {
        const out = readCityFoodBuffer(wej);
        if (!(typeof out === 'number' && Number.isFinite(out) && out >= 0)) {
          bufOk = false; zle = `${opis} → ${out}`; break;
        }
      }
      assert('economy: readCityFoodBuffer zawsze zwraca skończoną liczbę >= 0 (7 przypadków)',
        bufOk, zle);
      assert('economy: readCityFoodBuffer(-3) klampuje do 0 (nie przepuszcza ujemnego bufora)',
        readCityFoodBuffer(-3) === 0, `got=${readCityFoodBuffer(-3)}`);
      assert('economy: readCityFoodBuffer czyta legacy { aktualny } ze starego zapisu',
        readCityFoodBuffer({ aktualny: 5, pojemnosc: 20 }) === 5,
        `got=${readCityFoodBuffer({ aktualny: 5, pojemnosc: 20 })}`);
    }
    assert('economy: population never goes below 1',
      econCity.population >= 1, `pop=${econCity.population} (was ${popBefore})`);
    // Net food should be defined per-city in the result.
    assert('economy: per-city result carries zywnoscNetto',
      res && res.perCity.length === 1 && Number.isFinite(res.perCity[0].zywnoscNetto),
      `perCity=${res ? res.perCity.length : 'N/A'}`);
  }
}

// ---------------------------------------------------------------------------
// 4b. Research / player-state tests (tasks 13B-finish + 7B)
// ---------------------------------------------------------------------------
const techData = data.tech;

// createPlayerState defaults
const ps0 = createPlayerState();
assert('research: fresh state era === 1', ps0.era === 1, `era=${ps0.era}`);
assert('research: fresh state empty treasury+science',
  ps0.skarbiec === 0 && ps0.nauka === 0, `skarbiec=${ps0.skarbiec} nauka=${ps0.nauka}`);
assert('research: fresh state nothing researched + no current tech',
  ps0.zbadane.size === 0 && ps0.badana === null);
assert('research: fresh money multiplier === 1', ps0.pieniadzMnoznik === 1);

// parsePrereqs on a known "A + B" tech ("Jeździectwo" = "Koło + Brązownictwo")
const jezdz = techData.find(t => t.Technologia === 'Jeździectwo');
assert('research: found multi-prereq tech (Jeździectwo)', !!jezdz);
if (jezdz) {
  const pr = parsePrereqs(jezdz);
  assert('research: parsePrereqs splits "A + B" into 2 ids',
    pr.length === 2 && pr.includes('Koło') && pr.includes('Brązownictwo'),
    `pr=${JSON.stringify(pr)}`);
  assert('research: prereqsMet false when prereqs missing',
    prereqsMet(jezdz, new Set()) === false);
  assert('research: prereqsMet true when all prereqs present',
    prereqsMet(jezdz, new Set(['Koło', 'Brązownictwo'])) === true);
}

// availableTechs excludes anything whose prereqs are unmet
const availFresh = availableTechs(techData, new Set());
assert('research: with no research, only prereq-free techs available',
  availFresh.length > 0 && availFresh.every(t => parsePrereqs(t).length === 0),
  `avail=${availFresh.length}`);
assert('research: a tech with prereqs is NOT available initially',
  !availFresh.some(t => t.Technologia === 'Brązownictwo'),
  'Brązownictwo should require Garncarstwo');

// cheapestAvailable respects prereqs and picks min cost (tie -> name order)
const cheap = cheapestAvailable(techData, new Set());
assert('research: cheapestAvailable returns an available prereq-free tech',
  cheap !== null && availFresh.some(t => t.Technologia === cheap),
  `cheap=${cheap}`);
if (cheap !== null) {
  const cheapDef = techData.find(t => t.Technologia === cheap);
  const minCost = Math.min(...availFresh.map(t => techCost(t)));
  assert('research: cheapestAvailable has the minimum available cost',
    techCost(cheapDef) === minCost, `cost=${techCost(cheapDef)} min=${minCost}`);
}

// Helper (mirrors the hard epoch/tier gating duplicated in playerState.ts
// epochGateMet/epochTierGateMet): every tech of the same Epoka with a lower
// Poziom than `t` must be done before `t` can become available/targetable.
// DRZEWKO-TECH-FIX 2026-07: Brązownictwo's own prereq widened to
// "Garncarstwo + Murarstwo + Obróbka drewna" (was just Garncarstwo) AND the
// engine now hard-gates by tier within an epoch, so simply researching
// Garncarstwo is no longer enough — ALL Kamień tier-1/2 techs are required.
function sameEpochLowerTierIds(techId) {
  const def = techData.find(t => t.Technologia === techId);
  return techData
    .filter(t => t.Epoka === def.Epoka && t.Poziom < def.Poziom)
    .map(t => t.Technologia);
}
const kamienBeforeBraz = sameEpochLowerTierIds('Brązownictwo'); // all Kamień tier 1-2

// cheapest selection respects prereqs: Brązownictwo only becomes available
// once its full prereq (Garncarstwo + Murarstwo + Obróbka drewna) AND the
// tier gate (all lower-Poziom Kamień techs) are satisfied.
const afterGarn = availableTechs(techData, new Set(kamienBeforeBraz));
assert('research: after all Kamień tier 1-2 techs, Brązownictwo becomes available',
  afterGarn.some(t => t.Technologia === 'Brązownictwo'));

// Completing a tech: enough science -> moves to zbadane and deducts cost.
// tempoGry='szybka' pins the tempo-kreatora multiplier to x1 so this test exercises
// researchStep's own logic, not the separate tech-tempo x2/x4 multiplier (that has
// its own dedicated bramka: tech-tempo-test.cjs). GLOBAL_RESEARCH_COST_MULT=1 since
// B-RESEARCH-COST-MODEL (2026-07-24) — former x2 absorbed into tech.json.
const psA = createPlayerState();
psA.tempoGry = 'szybka';
const obrobka = techData.find(t => t.Technologia === 'Obróbka drewna'); // raw cost 5 (tech.json), no prereq
assert('research: found Obróbka drewna (cost 5)', !!obrobka && techCost(obrobka) === 5,
  `cost=${obrobka ? techCost(obrobka) : 'N/A'}`);
const obrobkaEffCost = scaledResearchCost(techCost(obrobka), 'szybka', 0, 'normal');
psA.badana = 'Obróbka drewna';
psA.nauka = obrobkaEffCost; // exactly enough for Obróbka drewna at the current effective cost
const resA = researchStep(psA, techData);
assert('research: completing a tech moves it into zbadane',
  psA.zbadane.has('Obróbka drewna'), `zbadane=${[...psA.zbadane].join(',')}`);
assert('research: completing a tech deducts its cost from science',
  psA.nauka === 0, `nauka=${psA.nauka}`); // 5 - 5 = 0
assert('research: researchStep reports the completed tech',
  resA.completed.length >= 1 && resA.completed.some(c => c.id === 'Obróbka drewna'));
assert('research: after spending all science, a new (different) tech is selected',
  psA.badana !== null && psA.badana !== 'Obróbka drewna', `badana=${psA.badana}`);

// Not enough science -> nothing completes, science untouched.
const psB = createPlayerState();
psB.badana = 'Obróbka drewna';
psB.nauka = 4; // < 5 (cost of Obróbka drewna)
const resB = researchStep(psB, techData);
assert('research: insufficient science completes nothing',
  resB.completed.length === 0 && !psB.zbadane.has('Obróbka drewna'));
assert('research: insufficient science leaves the pool untouched', psB.nauka === 4,
  `nauka=${psB.nauka}`);

// Era tech: completing "Brązownictwo" (prereq Garncarstwo + Murarstwo + Obróbka
// drewna, PLUS the Kamień tier-1/2 gate) bumps era.
const psC = createPlayerState();
psC.tempoGry = 'szybka';
psC.zbadane = new Set(kamienBeforeBraz);
psC.badana = 'Brązownictwo';
psC.nauka = scaledResearchCost(
  techCost(techData.find(t => t.Technologia === 'Brązownictwo')), 'szybka', 0, 'normal', 'Brąz',
); // exact effective cost (tempo='szybka', FALA1+FALA2 Brąz)
const eraBefore = psC.era;
const resC = researchStep(psC, techData);
assert('research: era tech (Brązownictwo) marks the era-advance flag',
  resC.completed.some(c => c.id === 'Brązownictwo' && c.awansEpoki === true));
assert('research: era tech bumps player.era by 1',
  psC.era === eraBefore + 1, `era ${eraBefore} -> ${psC.era}`);

// isEraAdvanceTech / isMoneyTech classification on the data rows.
const brazDef = techData.find(t => t.Technologia === 'Brązownictwo');
assert('research: isEraAdvanceTech true for Brązownictwo', isEraAdvanceTech(brazDef) === true);
const walutaDef = techData.find(t => t.Technologia === 'Waluta');
assert('research: found Waluta (money tech)', !!walutaDef);
assert('research: isMoneyTech true for Waluta', isMoneyTech(walutaDef) === true);

// Money tech: completing "Waluta" sets the Pieniądz x10 multiplier.
// Waluta (Epoka=Brąz, Poziom=6) needs its direct prereq (Handel + Matematyka)
// AND the hard epoch/tier gate: ALL of Epoka Kamień done, plus all lower-Poziom
// Brąz techs done (epochGateMet / epochTierGateMet in playerState.ts).
const psD = createPlayerState();
psD.tempoGry = 'szybka';
const allKamien = techData.filter(t => t.Epoka === 'Kamień').map(t => t.Technologia);
const brazBeforeWaluta = sameEpochLowerTierIds('Waluta'); // Brąz tiers 4-5
psD.zbadane = new Set([...allKamien, ...brazBeforeWaluta]);
psD.badana = 'Waluta';
psD.nauka = scaledResearchCost(techCost(walutaDef), 'szybka', 0, 'normal', walutaDef.Epoka);
const resD = researchStep(psD, techData);
assert('research: money tech (Waluta) sets the money flag in completion',
  resD.completed.some(c => c.id === 'Waluta' && c.pieniadz === true));
assert('research: money tech sets pieniadzMnoznik to PIENIADZ_MNOZNIK (x10)',
  psD.pieniadzMnoznik === PIENIADZ_MNOZNIK, `mult=${psD.pieniadzMnoznik}`);

// Cascade + loop guard: huge science budget researches many techs without hanging.
const psE = createPlayerState();
psE.nauka = 100000;
const resE = researchStep(psE, techData);
assert('research: a large science budget completes multiple techs',
  resE.completed.length >= 5, `completed=${resE.completed.length}`);
assert('research: cascade never researches a tech twice',
  psE.zbadane.size === resE.completed.length, `zbadane=${psE.zbadane.size} done=${resE.completed.length}`);
assert('research: cascade leaves no available tech behind when fully funded',
  availableTechs(techData, psE.zbadane).length === 0,
  `still available=${availableTechs(techData, psE.zbadane).length}`);

// ---------------------------------------------------------------------------
// 4b-player. Player research API: setPlayerResearchTarget + getResearchState
// ---------------------------------------------------------------------------
// Note: uses real tech data (data/tech.json) with Polish diacritics.
// Brązownictwo (cost=90 in tech.json after B-RESEARCH-COST-MODEL) requires Garncarstwo + Murarstwo + Obróbka drewna
// (direct prereq), PLUS the hard Kamień tier-1/2 gate (kamienBeforeBraz, above).

// P1: setPlayerResearchTarget validates prereqs and sets target
{
  const ps1 = createPlayerState();
  ps1.zbadane = new Set(kamienBeforeBraz);
  // Brązownictwo's prereq + tier gate are both met.
  const ok = setPlayerResearchTarget(ps1, 'Brązownictwo', techData);
  assert('player-research: setPlayerResearchTarget returns true for valid target',
    ok === true, `got=${ok}`);
  assert('player-research: playerResearchTargetId set to chosen tech',
    ps1.playerResearchTargetId === 'Brązownictwo', `id=${ps1.playerResearchTargetId}`);
}

// P2: setPlayerResearchTarget rejects already-researched tech
{
  const ps2 = createPlayerState();
  ps2.zbadane = new Set(['Garncarstwo']);
  const ok = setPlayerResearchTarget(ps2, 'Garncarstwo', techData);
  assert('player-research: setPlayerResearchTarget rejects completed tech',
    ok === false, `got=${ok}`);
  assert('player-research: playerResearchTargetId unchanged on rejection',
    ps2.playerResearchTargetId === null, `id=${ps2.playerResearchTargetId}`);
}

// P3: setPlayerResearchTarget rejects tech with unmet prereqs
{
  const ps3 = createPlayerState();
  // Brązownictwo requires Garncarstwo, which is NOT in zbadane
  const ok = setPlayerResearchTarget(ps3, 'Brązownictwo', techData);
  assert('player-research: setPlayerResearchTarget rejects unmet prereqs',
    ok === false, `got=${ok}`);
}

// P4: researchStep uses playerResearchTargetId over auto-pick
// Brązownictwo cost in real data: check what the test data says
{
  const ps4 = createPlayerState();
  ps4.tempoGry = 'szybka'; // pin the tempo-kreatora multiplier to x1
  ps4.zbadane = new Set(kamienBeforeBraz);
  const brazDef = techData.find(t => t.Technologia === 'Brązownictwo');
  const brazCost = brazDef ? (typeof brazDef['Koszt nauki'] === 'number' ? brazDef['Koszt nauki'] : 0) : 0;
  ps4.nauka = scaledResearchCost(brazCost, 'szybka', 0, 'normal', brazDef?.Epoka);
  setPlayerResearchTarget(ps4, 'Brązownictwo', techData);
  assert('player-research: target set before researchStep',
    ps4.playerResearchTargetId === 'Brązownictwo', `id=${ps4.playerResearchTargetId}`);
  const res4 = researchStep(ps4, techData);
  assert('player-research: researchStep completes the player-chosen tech',
    res4.completed.some(c => c.id === 'Brązownictwo'), `completed=${JSON.stringify(res4.completed.map(c=>c.id))}`);
  assert('player-research: playerResearchTargetId cleared after completion',
    ps4.playerResearchTargetId === null, `id=${ps4.playerResearchTargetId}`);
  assert('player-research: Brązownictwo added to zbadane',
    ps4.zbadane.has('Brązownictwo'), `zbadane=${[...ps4.zbadane].join(',')}`);
}

// P5: without explicit target, researchStep picks first available (default, not cheapest)
{
  const ps5 = createPlayerState();
  ps5.nauka = 100; // enough for any tech
  // No playerResearchTargetId, no badana -> default = first available
  const res5 = researchStep(ps5, techData);
  assert('player-research: no target -> researchStep picks first available (default)',
    res5.completed.length >= 1, `completed=${res5.completed.length}`);
  assert('player-research: default does not clear playerResearchTargetId (was null)',
    ps5.playerResearchTargetId === null, `id=${ps5.playerResearchTargetId}`);
}

// P6: getResearchState returns correct snapshot
{
  const ps6 = createPlayerState();
  ps6.tempoGry = 'szybka'; // pin the tempo-kreatora multiplier to x1
  ps6.zbadane = new Set(kamienBeforeBraz);
  const brazDef6 = techData.find(t => t.Technologia === 'Brązownictwo');
  const brazCostRaw6 = brazDef6 ? (typeof brazDef6['Koszt nauki'] === 'number' ? brazDef6['Koszt nauki'] : 0) : 0;
  // Effective cost: scaledResearchCost (GLOBAL_MULT=1 since B-RESEARCH-COST-MODEL),
  // same as getResearchState computes internally for kosztCelu.
  const brazCost6 = scaledResearchCost(brazCostRaw6, 'szybka', 0, 'normal', brazDef6?.Epoka);
  ps6.nauka = brazCost6 / 2; // half the effective cost
  setPlayerResearchTarget(ps6, 'Brązownictwo', techData);
  const naukaPerTurn = 4;
  const rsi = getResearchState(ps6, techData, naukaPerTurn);
  assert('player-research: getResearchState pula equals nauka',
    rsi.pula === ps6.nauka, `pula=${rsi.pula} nauka=${ps6.nauka}`);
  assert('player-research: getResearchState targetId equals chosen tech',
    rsi.targetId === 'Brązownictwo', `targetId=${rsi.targetId}`);
  assert('player-research: getResearchState kosztCelu equals tech cost',
    rsi.kosztCelu === brazCost6, `kosztCelu=${rsi.kosztCelu} expected=${brazCost6}`);
  // Progress: half cost / full cost = 0.5
  assert('player-research: getResearchState postepFraction = 0.5',
    Math.abs(rsi.postepFraction - 0.5) < 0.001, `fraction=${rsi.postepFraction}`);
  // turnsLeft: ceil((brazCost6 - brazCost6/2) / naukaPerTurn)
  const expected = Math.ceil((brazCost6 / 2) / naukaPerTurn);
  assert('player-research: getResearchState turnsLeft correct',
    rsi.turnsLeft === expected, `turnsLeft=${rsi.turnsLeft} expected=${expected}`);
}

// P7: getResearchState falls back to badana when no explicit target
{
  const ps7 = createPlayerState();
  ps7.nauka = 5;
  ps7.badana = 'Obróbka drewna';
  const rsi7 = getResearchState(ps7, techData, 0);
  assert('player-research: getResearchState uses badana as fallback target',
    rsi7.targetId === 'Obróbka drewna', `targetId=${rsi7.targetId}`);
}

// ---------------------------------------------------------------------------
// 4c. Map-generation E1 tests: deposits, start positions, land/water balance
// ---------------------------------------------------------------------------
//
// gen-helpers.ts exposes deterministic, seeded helpers wired into generateMap:
//   - mineral deposits per terrain rule (ruda/glina/konie via Nakladka,
//     wegiel via optional hex.zloze marker),
//   - >=5 start positions on land with pairwise hex-distance >= 5.
// generateMap now also returns map.startPositions (additive, non-breaking).

// Nakladka enum string values -> deposit-rule id (must match gen-helpers).
const NAK_TO_DEPOSIT = {
  zloze_rudy:  'ruda',
  zloze_gliny: 'glina',
  zloze_konia: 'konie',
};

// Land + water both present on a generated map (sanity for the continent shaping).
{
  const e1map = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 12345);
  let landCnt = 0, waterCnt = 0;
  for (const k in e1map.hexes) {
    const t = e1map.hexes[k].terenBazowy;
    if (t === 'morze' || t === 'plytkie_morze') waterCnt++; else landCnt++;
  }
  assert('mapgen: generated map has BOTH land and water',
    landCnt > 0 && waterCnt > 0, `land=${landCnt} water=${waterCnt}`);
}

// Deposits obey terrain rules across several seeds (placed in-map by generateMap).
{
  const seeds = [42, 12345, 777, 9999];
  let violations = 0;
  let totalDeposits = 0;
  const detail = [];
  for (const s of seeds) {
    const m = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, s);
    let perSeed = 0;
    for (const k in m.hexes) {
      const hex = m.hexes[k];
      const depId = NAK_TO_DEPOSIT[hex.nakladka];
      if (depId) {
        perSeed++; totalDeposits++;
        const rule = DEPOSIT_RULES.find(r => r.id === depId);
        if (!rule || !rule.allowedOn(hex)) {
          violations++;
          detail.push(`seed ${s} ${k}: ${depId} on ${hex.terenBazowy} (river=${hex.rzeka.obecna})`);
        }
      }
      // wegiel has no Nakladka representation -> stored on optional hex.zloze.
      if (hex.zloze === 'wegiel') {
        perSeed++; totalDeposits++;
        if (hex.terenBazowy !== 'gory') {
          violations++;
          detail.push(`seed ${s} ${k}: wegiel on ${hex.terenBazowy}`);
        }
      }
    }
  }
  assert('mapgen: deposits obey terrain rules (ruda Wzgorza/Gory, glina Laka/coast/river, konie Rownina, wegiel Gory)',
    violations === 0, detail.slice(0, 3).join(' | '));
  assert('mapgen: at least some deposits are placed across seeds',
    totalDeposits > 0, `totalDeposits=${totalDeposits}`);
}

// Deposits are deterministic for a given seed (full nakladka+zloze snapshot).
{
  function depSnapshot(m) {
    const keys = Object.keys(m.hexes).sort();
    return JSON.stringify(keys.map(k => [k, m.hexes[k].nakladka, m.hexes[k].zloze || '']));
  }
  const a = depSnapshot(generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 42));
  const b = depSnapshot(generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 42));
  assert('mapgen: deposits identical for the same seed (deterministic)', a === b);
  const cDiff = depSnapshot(generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 777));
  assert('mapgen: deposits differ for a different seed', a !== cDiff);
}

// placeDeposits helper is idempotent / pure on already-placed overlays:
// re-running it must not overwrite Las nor add a second deposit to a hex.
{
  const m = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 555);
  // Count forest + deposit hexes before re-running placeDeposits.
  let lasBefore = 0, depBefore = 0;
  for (const k in m.hexes) {
    if (m.hexes[k].nakladka === 'las') lasBefore++;
    if (NAK_TO_DEPOSIT[m.hexes[k].nakladka] || m.hexes[k].zloze) depBefore++;
  }
  placeDeposits(m.hexes, 555); // re-run with same seed
  let lasAfter = 0, depAfter = 0, forestWithDeposit = 0;
  for (const k in m.hexes) {
    if (m.hexes[k].nakladka === 'las') lasAfter++;
    if (NAK_TO_DEPOSIT[m.hexes[k].nakladka] || m.hexes[k].zloze) depAfter++;
    if (m.hexes[k].nakladka === 'las' && m.hexes[k].zloze) forestWithDeposit++;
  }
  assert('mapgen: re-running placeDeposits never overwrites forest', lasAfter === lasBefore,
    `las ${lasBefore} -> ${lasAfter}`);
  // Decyzja wlasciciela (2026-07-19): las + zloze na jednym heksie jest
  // DOZWOLONE (wspolistnienie) -- zloze reprezentuje surowiec pod pokrywa
  // lasu, nie wyklucza sie z nakladka='las'. Nie zawezamy silnika
  // (gen-helpers.ts), tylko przestajemy tego zakazywac w tej bramce.
  assert('mapgen: forest+deposit coexistence on the same hex is allowed (decyzja wlasciciela)',
    forestWithDeposit >= 0, `forestWithDeposit=${forestWithDeposit} (dozwolone pod lasem)`);
}

// startPositions: >= 5, all on land, pairwise hex-distance >= absMinDist, deterministic.
//
// generator.ts calls computeStartPositions with { minCount: 5, minDist: 5,
// absMinDist: 2 } (see src/map/generator.ts). computeStartPositions is a
// documented greedy Poisson-disk-like picker that RELAXES its target spacing
// step by step from minDist=5 down to absMinDist=2 whenever the map doesn't
// have enough land to seat minCount positions at the stricter distance — see
// the "4. Jesli nie uzbierano minCount, stopniowo luzuj minDist" comment on
// computeStartPositions in gen-helpers.ts. On the DEFAULT_WIDTH x
// DEFAULT_HEIGHT (36x28) test map this relaxation routinely kicks in (checked
// across many seeds: minPairDist ranges 2-4, never below absMinDist=2), so the
// only invariant computeStartPositions actually guarantees here is
// >= absMinDist, not the aspirational minDist=5.
{
  const seeds = [42, 12345, 777, 9999, 1];
  let allOk = true;
  const notes = [];
  const ABS_MIN_DIST = 2; // matches generator.ts's computeStartPositions absMinDist
  for (const s of seeds) {
    const m = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, s);
    const sp = m.startPositions || [];
    if (sp.length < 5) { allOk = false; notes.push(`seed ${s}: only ${sp.length} starts`); continue; }
    for (const p of sp) {
      const hex = m.hexes[`${p.q},${p.r}`];
      if (!hex || !isLandTerrain(hex.terenBazowy)) {
        allOk = false; notes.push(`seed ${s}: start (${p.q},${p.r}) not land`);
      }
    }
    let minPair = Infinity;
    for (let i = 0; i < sp.length; i++) {
      for (let j = i + 1; j < sp.length; j++) {
        const d = hexDistanceAxial(sp[i].q, sp[i].r, sp[j].q, sp[j].r);
        if (d < minPair) minPair = d;
      }
    }
    if (minPair < ABS_MIN_DIST) { allOk = false; notes.push(`seed ${s}: minPairDist=${minPair}`); }
  }
  assert('mapgen: startPositions has >=5 entries, all on land, pairwise distance >= absMinDist (all seeds)',
    allOk, notes.slice(0, 3).join(' | '));

  // Determinism of startPositions for a fixed seed.
  const spA = JSON.stringify((generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 42).startPositions || []));
  const spB = JSON.stringify((generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 42).startPositions || []));
  assert('mapgen: startPositions identical for the same seed (deterministic)', spA === spB);

  // computeStartPositions helper works directly on a hex map too.
  const m2 = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 2024);
  const direct = computeStartPositions(m2.hexes, 2024, { minCount: 5, minDist: 5, absMinDist: 2 });
  assert('mapgen: computeStartPositions helper returns >=5 land starts', direct.length >= 5,
    `len=${direct.length}`);
}

// ---------------------------------------------------------------------------
// 4d. Siege tests (task B3) — prefix "siege:"
// ---------------------------------------------------------------------------
//
// siege.ts is a pure, deterministic, DOM-free module. It defines its own
// SiegeCity / SiegeUnit input shapes and re-implements the SS5l formula bits
// (combat.ts is NOT imported). Walls (Mury) + terrain + fortification boost the
// garrison's effective Obrona/Pancerz; an undefended city is capturable and
// captureCity() transfers ownership (pure).

// A small deterministic RNG (mulberry32) so siege resolution is reproducible.
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Canonical Stone-age Warrior stats (data/units.json "Wojownik") as a SiegeUnit.
function warrior(hp) {
  return {
    typNazwa: 'Wojownik', rola: 'Wrecz',
    Atak: 4, Obrona: 4, Uderzenie: 2, Pancerz: 2, Przebicie: 1, weaponDamage: 4,
    Health: hp == null ? 17 : hp, progDezercji: 0.4,
  };
}
function makeCity(over) {
  return Object.assign({
    id: 'cityS', ownerId: 0, q: 5, r: 5,
    wallLevel: 0, garrison: [warrior()], terrain: 'Rownina',
  }, over || {});
}

// --- siege: flat wall bonus RETIRED (Maciej 2026-07-25) -- defence is now
// PURELY percentage-based (miasto-params.json bonus_obrona_mur_proc=200% /
// bonus_obrona_cytadela_proc=100%, applied in main.ts structureDefenseBonusFor
// -> combat.ts structureDefBonusPct / battleScene.ts), so buildings.json "mury"
// baza/przyrost.obrona and combat-params.json wall_base_obrona/wall_per_level_obrona
// are now 0 (data-sourced, not deleted, so wallLevel/hasWalls keep working for
// siegeAi.ts strength estimation). These assertions guard that retirement.
{
  const wp = wallParamsFromBuildings(data.buildings);
  assert('siege: wall constants retired to 0 in buildings.json mury (flat bonus removed 2026-07-25)',
    wp.wallBaseObrona === 0 && wp.wallPerLevelObrona === 0,
    `base=${wp.wallBaseObrona} per=${wp.wallPerLevelObrona}`);
  assert('siege: exported WALL_BASE_OBRONA/PER_LEVEL match retired (0) data defaults',
    WALL_BASE_OBRONA === 0 && WALL_PER_LEVEL_OBRONA === 0);
}

// --- siege: walls no longer contribute a FLAT Obrona/Pancerz bonus (retired
// 2026-07-25 -- the wall/Cytadela defence now lives entirely in the % layer,
// outside this pure module). Regression guard: any wallLevel gives 0 here.
{
  const undef = cityDefenseBonus(makeCity({ wallLevel: 0 }));
  const walled = cityDefenseBonus(makeCity({ wallLevel: 1 }));
  const walled3 = cityDefenseBonus(makeCity({ wallLevel: 3 }));
  assert('siege: no walls -> zero Obrona bonus', undef.obronaBonus === 0,
    `bonus=${undef.obronaBonus}`);
  assert('siege: level-1 walls add NO flat Obrona bonus (retired; was 5)',
    walled.obronaBonus === 0, `bonus=${walled.obronaBonus}`);
  assert('siege: wall level no longer changes the flat defence bonus (all 0)',
    walled3.obronaBonus === 0 && walled.obronaBonus === 0 && undef.obronaBonus === 0,
    `L0=${undef.obronaBonus} L1=${walled.obronaBonus} L3=${walled3.obronaBonus}`);
  assert('siege: walls no longer harden Pancerz (retired; flat bonus == 0)',
    walled.pancerzBonus === 0, `pancerz=${walled.pancerzBonus}`);
}

// --- siege: hill terrain multiplies defender Obrona (x1.5), matches terrain-combat.json ---
{
  assert('siege: hill terrain defence multiplier === HILL_DEFENSE_MULT (1.5)',
    terrainDefenseMult('Wzgorza') === HILL_DEFENSE_MULT && HILL_DEFENSE_MULT === 1.5);
  assert('siege: flat terrain has no defence multiplier (1.0)',
    terrainDefenseMult('Rownina') === 1.0);
  const hillBonus = cityDefenseBonus(makeCity({ wallLevel: 1, terrain: 'Wzgorza' }));
  assert('siege: city on a hill carries the terrain multiplier in its bonus',
    hillBonus.terrainMult === 1.5, `mult=${hillBonus.terrainMult}`);
  // applyCityBonus boosts a defender's effective Obrona on a hill.
  const boosted = applyCityBonus(warrior(), hillBonus);
  assert('siege: applyCityBonus raises defender effective Obrona on walled hill',
    boosted.Obrona > warrior().Obrona, `obrona ${warrior().Obrona} -> ${boosted.Obrona}`);
}

// --- siege: wall level no longer changes this module's damage math (retired
// 2026-07-25 -- the real wall/Cytadela defence is applied as a % elsewhere,
// not by this pure module's flat bonus, which is now 0 regardless of level) ---
{
  const atk = warrior();
  // Same seeded RNG for both so only the wall differs.
  const rUnwalled = resolveSiegeAttack(atk, makeCity({ wallLevel: 0 }), { rng: makeRng(123) });
  const rWalled   = resolveSiegeAttack(atk, makeCity({ wallLevel: 5 }), { rng: makeRng(123) });
  assert('siege: wall level no longer changes damage dealt here (flat bonus retired; was less)',
    rWalled.defenderHpLoss === rUnwalled.defenderHpLoss,
    `walled loss=${rWalled.defenderHpLoss} vs unwalled=${rUnwalled.defenderHpLoss}`);
  assert('siege: both engagements produced a defender HP loss (sanity)',
    rUnwalled.defenderHpLoss > 0,
    `unwalled defenderHpLoss=${rUnwalled.defenderHpLoss}`);
}

// --- siege: a strong attacker overcomes a weak undefended-ish garrison; wins flagged ---
{
  const bigAtk = { typNazwa: 'Oblegacz', rola: 'Wrecz', Atak: 30, Obrona: 20,
    Uderzenie: 20, Pancerz: 10, Przebicie: 20, weaponDamage: 30, Health: 200, progDezercji: null, unbreakable: true };
  const res = resolveSiegeAttack(bigAtk, makeCity({ wallLevel: 1, garrison: [warrior(10)] }),
    { rng: makeRng(7), useMilitia: false });
  assert('siege: an overwhelming attacker defeats the garrison defender',
    res.outcome === 'attackerWins' && res.defenderDied,
    `outcome=${res.outcome} defDied=${res.defenderDied}`);
}

// --- siege: undefended city is capturable; captureCity transfers ownership (pure) ---
{
  const empty = makeCity({ ownerId: 1, garrison: [] });
  assert('siege: a city with no garrison is capturable', canCaptureCity(empty) === true);
  const captured = captureCity(empty, 0);
  assert('siege: captureCity transfers ownership to the new owner',
    captured.ownerId === 0, `owner=${captured.ownerId}`);
  assert('siege: captureCity is PURE (does not mutate the input city)',
    empty.ownerId === 1, `input owner mutated to ${empty.ownerId}`);
  assert('siege: captured city has an empty garrison and is no longer fortified',
    captured.garrison.length === 0 && captured.fortified === false);

  // A defended city is NOT capturable; captureCity is a no-op returning the same city.
  const defended = makeCity({ ownerId: 1, garrison: [warrior()] });
  assert('siege: a defended city is NOT capturable', canCaptureCity(defended) === false);
  const noop = captureCity(defended, 0);
  assert('siege: captureCity refuses to flip a defended city',
    noop.ownerId === 1, `owner=${noop.ownerId}`);

  // A garrison of only dead units (HP<=0) counts as undefended.
  const deadGarrison = makeCity({ ownerId: 1, garrison: [warrior(0)] });
  assert('siege: a garrison of only dead units is capturable',
    canCaptureCity(deadGarrison) === true);
}

// --- siege: enemy-adjacency capture rule ---
{
  const city = makeCity({ ownerId: 1, garrison: [], q: 5, r: 5 });
  assert('siege: adjacent enemy may capture an undefended city',
    canEnemyCapture(city, 0, 5, 6) === true);
  assert('siege: a non-adjacent enemy may NOT capture (distance > 1)',
    canEnemyCapture(city, 0, 5, 9) === false);
  assert('siege: the owner cannot "capture" their own city',
    canEnemyCapture(city, 1, 5, 6) === false);
}

// --- siege: militia (SS9c) defends an empty-but-populated city ---
{
  const militia = makeMilitia(10);
  assert('siege: makeMilitia builds a defender from ~20% of population',
    militia !== null && militia.typNazwa === 'Milicja' && militia.Health > 0,
    `militia=${JSON.stringify(militia && { hp: militia.Health, atk: militia.Atak })}`);
  assert('siege: militia is weaker than a Stone-age Warrior (half strength)',
    militia.Atak <= warrior().Atak && militia.Obrona <= warrior().Obrona);
  assert('siege: a city with no population raises no militia',
    makeMilitia(0) === null);
  // effectiveGarrison falls back to militia when the standing garrison is empty.
  const eg = effectiveGarrison(makeCity({ garrison: [], population: 10 }));
  assert('siege: effectiveGarrison falls back to militia for an empty garrison',
    eg.length === 1 && eg[0].typNazwa === 'Milicja');
  // A populated but garrison-less city still resists an attacker (militia fights).
  const resM = resolveSiegeAttack(warrior(), makeCity({ garrison: [], population: 20 }),
    { rng: makeRng(99) });
  assert('siege: a militia-defended city is engaged (not a free walk-in)',
    resM.engagedDefender !== null && resM.rounds > 0,
    `rounds=${resM.rounds} def=${resM.engagedDefender && resM.engagedDefender.typNazwa}`);
}

// --- siege: determinism with a seeded RNG ---
{
  const atk = warrior();
  const cityA = makeCity({ wallLevel: 2, terrain: 'Wzgorza' });
  const r1 = resolveSiegeAttack(atk, cityA, { rng: makeRng(2024) });
  const r2 = resolveSiegeAttack(atk, cityA, { rng: makeRng(2024) });
  assert('siege: same seed => identical outcome, HP losses and round count (deterministic)',
    r1.outcome === r2.outcome &&
    r1.defenderHpLoss === r2.defenderHpLoss &&
    r1.attackerHpLoss === r2.attackerHpLoss &&
    r1.rounds === r2.rounds,
    `r1=(${r1.outcome},${r1.defenderHpLoss},${r1.attackerHpLoss},${r1.rounds}) ` +
    `r2=(${r2.outcome},${r2.defenderHpLoss},${r2.attackerHpLoss},${r2.rounds})`);
  // A different seed should be able to diverge (not a hard guarantee, but expected here).
  const r3 = resolveSiegeAttack(atk, cityA, { rng: makeRng(4096) });
  assert('siege: resolveSiegeAttack never throws and returns finite HP for another seed',
    Number.isFinite(r3.attackerHpLeft) && Number.isFinite(r3.defenderHpLeft) &&
    r3.attackerHpLeft >= 0 && r3.defenderHpLeft >= 0,
    `r3 atk=${r3.attackerHpLeft} def=${r3.defenderHpLeft}`);
}

// --- siege: local SS5l formula bits match the canonical model ---
{
  assert('siege: hitChance clamps to [10,90] and matches 50+(A-D)*5',
    siegeHitChance(6, 6) === 50 && siegeHitChance(100, 0) === 90 && siegeHitChance(0, 100) === 10);
  assert('siege: baseDamage = max(1, A-Panc+Przeb) + Uderzenie only on charge',
    siegeBaseDamage(6, 4, 0, 4, false) === 2 && siegeBaseDamage(6, 4, 0, 4, true) === 6 &&
    siegeBaseDamage(1, 10, 0, 0, false) === 1);
}

// ---------------------------------------------------------------------------
// 4e. Order ("Porządek") tests (task D4) — prefix "order:"
// ---------------------------------------------------------------------------
//
// order.ts is a pure, deterministic, DOM-free module with its own OrderInputs
// shape. Porządek (Order) = round(waga_szczescie*Szczęście + waga_prawo*Prawo);
// thresholds T1/T2 split it into 'unrest' | 'neutral' | 'order' tiers, each with
// distinct production/growth/trade multipliers + revolt risk. Params are loaded
// from data/society-params.json "porzadek" with fallbacks.

// Params loaded from the actual society-params.json object (proves data-driven).
const orderParams = loadOrderParams(societyParamsRaw, 'normal');
assert('order: loadOrderParams reads T1/T2 from society-params.json (normal)',
  orderParams.progT1 === 0 && orderParams.progT2 === 6,
  `T1=${orderParams.progT1} T2=${orderParams.progT2}`);
assert('order: loadOrderParams reads the Szczęście/Prawo weights from the json',
  orderParams.wagaSzczescie === 0.5 && orderParams.wagaPrawo === 0.5,
  `wS=${orderParams.wagaSzczescie} wP=${orderParams.wagaPrawo}`);
assert('order: loadOrderParams scales by difficulty (easy T1=-1, hard T1=1)',
  loadOrderParams(societyParamsRaw, 'easy').progT1 === -1 &&
  loadOrderParams(societyParamsRaw, 'hard').progT1 === 1);
assert('order: loadOrderParams falls back to constants when block absent',
  loadOrderParams({}, 'normal').progT2 === FALLBACK_ORDER_PARAMS.progT2 &&
  loadOrderParams(null, 'normal').progT1 === FALLBACK_ORDER_PARAMS.progT1);
assert('order: loadOrderParams falls back per missing key (partial block)',
  loadOrderParams({ porzadek: { porzadek_prog_t1: { easy: 2, normal: 2, hard: 2 } } }, 'normal')
    .progT2 === FALLBACK_ORDER_PARAMS.progT2);

// Order rises with Szczęście and with Prawo.
const orderBase = computeOrder({ szczescie: 4, prawo: 4 }, orderParams);
assert('order: Order rises with Szczęście',
  computeOrder({ szczescie: 10, prawo: 4 }, orderParams) > orderBase);
assert('order: Order rises with Prawo',
  computeOrder({ szczescie: 4, prawo: 10 }, orderParams) > orderBase);
assert('order: Order is monotonic non-decreasing across an input sweep', (() => {
  let prev = -Infinity;
  for (let s = -4; s <= 12; s++) {
    const o = computeOrder({ szczescie: s, prawo: 5 }, orderParams);
    if (o < prev) return false;
    prev = o;
  }
  return true;
})());
assert('order: default formula is the average of Szczęście and Prawo (0.5/0.5)',
  computeOrder({ szczescie: 6, prawo: 2 }, orderParams) === 4,
  `got ${computeOrder({ szczescie: 6, prawo: 2 }, orderParams)}`);
assert('order: weights tilt the sum (wP=1,wS=0 => Order === Prawo)',
  computeOrder({ szczescie: 100, prawo: 7 },
    { ...orderParams, wagaSzczescie: 0, wagaPrawo: 1 }) === 7);

// orderTier: unrest below T1, order at/above T2, neutral between.
assert('order: orderTier returns unrest below T1',
  orderTier(orderParams.progT1 - 1, orderParams) === 'unrest');
assert('order: orderTier returns order at/above T2',
  orderTier(orderParams.progT2, orderParams) === 'order' &&
  orderTier(orderParams.progT2 + 5, orderParams) === 'order');
assert('order: orderTier returns neutral between T1 and T2',
  orderTier(orderParams.progT1, orderParams) === 'neutral' &&
  orderTier(orderParams.progT2 - 1, orderParams) === 'neutral');

// Effects differ per tier.
const eUnrest  = orderEffects('unrest', orderParams);
const eNeutral = orderEffects('neutral', orderParams);
const eOrder   = orderEffects('order', orderParams);
assert('order: unrest effects penalise production+growth+yields and carry revolt risk',
  eUnrest.productionMult < 1 && eUnrest.growthMult < 1 && eUnrest.revoltRisk > 0 &&
  eUnrest.pieniadzMult < 1 && eUnrest.naukaMult < 1 && eUnrest.kulturaMult < 1,
  JSON.stringify(eUnrest));
assert('order: neutral effects are all-1 with no revolt risk',
  eNeutral.productionMult === 1 && eNeutral.growthMult === 1 &&
  eNeutral.tradeMult === 1 && eNeutral.revoltRisk === 0 &&
  eNeutral.pieniadzMult === 1 && eNeutral.naukaMult === 1 && eNeutral.kulturaMult === 1);
assert('order: orderEffectsToYieldMults maps trade bonus to pieniadz on order tier',
  orderEffectsToYieldMults('order', eOrder).pieniadzMult === eOrder.tradeMult &&
  orderEffectsToYieldMults('unrest', eUnrest).pieniadzMult === eUnrest.pieniadzMult);
assert('order: pickRevoltMigrationTarget picks highest-order city of same owner',
  pickRevoltMigrationTarget('a', 0, [
    { id: 'a', ownerId: 0, population: 5 },
    { id: 'b', ownerId: 0, population: 3 },
    { id: 'c', ownerId: 0, population: 4 },
  ], new Map([['b', 2], ['c', 8]])) === 'c');
assert('order: pickRevoltMigrationTarget returns null when no other city',
  pickRevoltMigrationTarget('a', 0, [{ id: 'a', ownerId: 0, population: 5 }], new Map()) === null);
assert('order: loadOrderParams reads B2 unrest yield penalties from json',
  // Maciej rebalance (society-params.json "porzadek"): normal ryzyko_buntu_t1
  // is now 0.03 (0.05 moved to "hard"); kara_pieniadz/nauka_t1 unchanged.
  orderParams.karaPieniadzT1 === -0.15 && orderParams.karaNaukaT1 === -0.10 &&
  orderParams.ryzykoBuntuT1 === 0.03, `ryzykoBuntuT1=${orderParams.ryzykoBuntuT1}`);
assert('order: order-tier effects give a production+trade bonus and no risk',
  eOrder.productionMult > 1 && eOrder.tradeMult > 1 && eOrder.revoltRisk === 0,
  JSON.stringify(eOrder));
assert('order: the three tiers yield strictly different production multipliers',
  eUnrest.productionMult !== eNeutral.productionMult &&
  eNeutral.productionMult !== eOrder.productionMult &&
  eUnrest.productionMult !== eOrder.productionMult);
assert('order: revoltRisk is clamped to [0,1]',
  orderEffects('unrest', { ...orderParams, ryzykoBuntuT1: 5 }).revoltRisk === 1 &&
  orderEffects('unrest', { ...orderParams, ryzykoBuntuT1: -3 }).revoltRisk === 0);
assert('order: production multiplier floored at 0 for an extreme penalty',
  orderEffects('unrest', { ...orderParams, karaProdukcjaT1: -5 }).productionMult === 0);

// Determinism.
assert('order: computeOrder is deterministic',
  computeOrder({ szczescie: 7, prawo: 3 }, orderParams) ===
  computeOrder({ szczescie: 7, prawo: 3 }, orderParams));
assert('order: evaluateOrder is deterministic (order+tier+effects)',
  JSON.stringify(evaluateOrder({ szczescie: 9, prawo: 9 }, orderParams)) ===
  JSON.stringify(evaluateOrder({ szczescie: 9, prawo: 9 }, orderParams)));
assert('order: non-finite inputs are coerced to 0 (NaN-safe, finite output)',
  computeOrder({ szczescie: NaN, prawo: Infinity }, orderParams) === 0);

// evaluateOrder end-to-end: low society -> unrest; high society -> order bonus.
const orderLow = evaluateOrder({ szczescie: -5, prawo: -5 }, orderParams);
assert('order: evaluateOrder flags unrest for very low Szczęście+Prawo',
  orderLow.tier === 'unrest' && orderLow.effects.revoltRisk > 0,
  JSON.stringify(orderLow));
const orderHigh = evaluateOrder({ szczescie: 10, prawo: 10 }, orderParams);
assert('order: evaluateOrder flags the order bonus for high Szczęście+Prawo',
  orderHigh.tier === 'order' && orderHigh.effects.productionMult > 1,
  JSON.stringify(orderHigh));

// ---------------------------------------------------------------------------
// 4f. Culture ("Kultura") tests (task D3) — prefix "culture:"
// ---------------------------------------------------------------------------
//
// culture-religion.ts is a pure, deterministic, DOM-free module with its own
// CultureCity / ReligionState input shapes (decoupled, like economy.ts/siege.ts).
// Params come from data/society-params.json blocks "kultura"/"religia" (+ the
// civ->religion table) and data/civs.json, with baked-in fallbacks (100/250/500
// border thresholds; 50% religion dominance).

// Params loaded from the real society-params.json (proves data-driven).
const cultureParams = loadCultureParams(societyParamsRaw, 'normal');
assert('culture: loadCultureParams reads border thresholds from society-params.json (normal 100/250/500)',
  cultureParams.progZasieg1 === 100 && cultureParams.progZasieg2 === 250 && cultureParams.progZasieg3 === 500,
  `t=${cultureParams.progZasieg1}/${cultureParams.progZasieg2}/${cultureParams.progZasieg3}`);
assert('culture: cultureThresholds returns the sorted threshold triple',
  JSON.stringify(cultureThresholds(cultureParams)) === JSON.stringify([100, 250, 500]));
assert('culture: loadCultureParams falls back to 100/250/500 when block absent',
  loadCultureParams({}, 'normal').progZasieg1 === FALLBACK_CULTURE_PARAMS.progZasieg1 &&
  loadCultureParams(null, 'normal').progZasieg3 === FALLBACK_CULTURE_PARAMS.progZasieg3);
assert('culture: loadCultureParams scales by difficulty (easy thresholds lower than hard)',
  loadCultureParams(societyParamsRaw, 'easy').progZasieg1 <
  loadCultureParams(societyParamsRaw, 'hard').progZasieg1);

// cityBorderRadius ring levels by accumulated culture.
assert('culture: cityBorderRadius is 0 below the first threshold',
  cityBorderRadius(0, cultureParams) === 0 && cityBorderRadius(99, cultureParams) === 0);
assert('culture: cityBorderRadius is 1 at/above prog1, 2 at prog2, 3 at prog3',
  cityBorderRadius(100, cultureParams) === 1 &&
  cityBorderRadius(250, cultureParams) === 2 &&
  cityBorderRadius(500, cultureParams) === 3 &&
  cityBorderRadius(9999, cultureParams) === 3);
assert('culture: cityBorderRadius is NaN-safe (coerces to 0)',
  cityBorderRadius(NaN, cultureParams) === 0);

// REQUIRED: culture points crossing a threshold expands the border radius.
const cityBelow = { kulturaSkumulowana: 90 };
const accrual = accumulateCulture(cityBelow, 20, cultureParams); // 90 -> 110 crosses 100
assert('culture: accumulateCulture crossing a threshold expands the border radius',
  accrual.granicaRozszerzona === true &&
  accrual.poprzedniZasieg === 0 && accrual.nowyZasieg === 1 &&
  accrual.kulturaSkumulowana === 110,
  JSON.stringify(accrual));
const accrualNoCross = accumulateCulture({ kulturaSkumulowana: 110 }, 20, cultureParams); // 110->130, still ring1
assert('culture: accumulateCulture within a band does NOT expand the border',
  accrualNoCross.granicaRozszerzona === false && accrualNoCross.nowyZasieg === 1);
assert('culture: accumulateCulture is deterministic and treats negative gain as 0',
  accumulateCulture({ kulturaSkumulowana: 50 }, -10, cultureParams).kulturaSkumulowana === 50);

// cultureHappiness contribution by own-culture share.
assert('culture: cultureHappiness gives the full-unity bonus at 100% own culture',
  cultureHappiness({ kulturaSkumulowana: 0, ownCultureShare: 1 }, cultureParams) === cultureParams.zadowolenie100);
assert('culture: cultureHappiness gives a smaller bonus at >=75% and neutral at 50%',
  cultureHappiness({ kulturaSkumulowana: 0, ownCultureShare: 0.8 }, cultureParams) === cultureParams.zadowolenie75 &&
  cultureHappiness({ kulturaSkumulowana: 0, ownCultureShare: 0.5 }, cultureParams) === cultureParams.zadowolenie50);
assert('culture: cultureHappiness penalises foreign-dominated cities (<50% and <25%)',
  cultureHappiness({ kulturaSkumulowana: 0, ownCultureShare: 0.4 }, cultureParams) === cultureParams.karaLt50 &&
  cultureHappiness({ kulturaSkumulowana: 0, ownCultureShare: 0.1 }, cultureParams) === cultureParams.karaLt25 &&
  cultureParams.karaLt25 <= cultureParams.karaLt50);
assert('culture: cultureHappiness defaults missing share to 100% (full bonus)',
  cultureHappiness({ kulturaSkumulowana: 0 }, cultureParams) === cultureParams.zadowolenie100);

// convertCulture: a conquered city converts toward our culture; a Biblioteka is faster.
// B-KULT-REL split (Maciej 2026-07-22/23, commit 80d4287): Świątynia is a RELIGIOUS
// building only from here on — it no longer touches culture conversion (that's now
// convertViaTemple/religion, covered separately below by the "religion:" assertions).
// convertCulture's own accelerators are the culture buildings (Biblioteka, Amfiteatr,
// Pałac, Stela, Sąd, Łaźnia) per CultureBuildings.
const convNoTemple = convertCulture({ kulturaSkumulowana: 0, ownCultureShare: 0 }, {}, cultureParams);
const convBiblioteka = convertCulture({ kulturaSkumulowana: 0, ownCultureShare: 0 }, { hasBiblioteka: true }, cultureParams);
assert('culture: convertCulture raises own-culture share toward 1.0',
  convNoTemple.ownCultureShare > 0 && convNoTemple.ownCultureShare < 1);
assert('culture: a Biblioteka converts culture strictly faster than without',
  convBiblioteka.ownCultureShare > convNoTemple.ownCultureShare,
  `biblioteka=${convBiblioteka.ownCultureShare} vs none=${convNoTemple.ownCultureShare}`);
assert('culture: Swiatynia (religious-only building, B-KULT-REL split) has NO effect on culture conversion',
  convertCulture({ kulturaSkumulowana: 0, ownCultureShare: 0 }, { hasSwiatynia: true }, cultureParams).ownCultureShare
    === convNoTemple.ownCultureShare,
  `swiatynia (ignored key) should equal none=${convNoTemple.ownCultureShare}`);
assert('culture: convertCulture caps the per-turn rate (cap from params)',
  convertCulture({ kulturaSkumulowana: 0, ownCultureShare: 0 },
    { hasSwiatynia: true, hasAmfiteatr: true, hasBiblioteka: true }, cultureParams)
    .appliedRate <= (cultureParams.konwersjaCapTura / 100) + 1e-9);

// ---------------------------------------------------------------------------
// 4g. Religion ("Religia") tests (task D3) — prefix "religion:"
// ---------------------------------------------------------------------------

const religionParams = loadReligionParams(societyParamsRaw, 'normal');
assert('religion: loadReligionParams reads the 50% dominance threshold from society-params.json',
  religionParams.progDominacjiPct === 50, `prog=${religionParams.progDominacjiPct}`);
assert('religion: loadReligionParams falls back (dominance 50%) when block absent',
  loadReligionParams({}, 'normal').progDominacjiPct === FALLBACK_RELIGION_PARAMS.progDominacjiPct &&
  loadReligionParams(null, 'normal').konwersjaBazaPct === FALLBACK_RELIGION_PARAMS.konwersjaBazaPct);

// civ -> religion lookup from the religie_cywilizacji table + civs.json membership.
assert('religion: civReligion maps a civ from society-params.json (Grecy -> Politeizm olimpijski)',
  civReligion('Grecy', societyParamsRaw) === 'Politeizm olimpijski',
  `got ${civReligion('Grecy', societyParamsRaw)}`);
assert('religion: civReligion returns null for an unknown civ',
  civReligion('Atlantyda', societyParamsRaw) === null && civReligion(null, societyParamsRaw) === null);
assert('religion: isKnownCiv validates civ names against civs.json',
  isKnownCiv('Rzymianie', civsRaw) === true && isKnownCiv('Atlantyda', civsRaw) === false);

// REQUIRED: dominantReligion returns the >50% faith, or none when split.
assert('religion: dominantReligion returns the >50% faith',
  dominantReligion({ counts: { A: 7, B: 3 } }, religionParams).religion === 'A' &&
  dominantReligion({ counts: { A: 7, B: 3 } }, religionParams).status === 'dominant');
assert('religion: dominantReligion returns none when no faith exceeds 50% (split)',
  dominantReligion({ counts: { A: 5, B: 5 } }, religionParams).religion === null &&
  dominantReligion({ counts: { A: 5, B: 5 } }, religionParams).status === 'mixed');
assert('religion: dominantReligion returns none for an empty city',
  dominantReligion({ counts: {} }, religionParams).status === 'none');
assert('religion: dominance is exclusive at exactly 50% (must EXCEED the threshold)',
  dominantReligion({ counts: { A: 50, B: 50 } }, religionParams).religion === null);

// religionHappiness: our religion -> bonus; foreign -> penalty; 50/50 -> exactly neutral.
// R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 G4 (owner 2026-09-05) replaced the BINARY jump
// (+zadowolenieDominujaca at 51% own, -karaObca at 49% -- an 8-point cliff on a single
// convert) with a NORMALISED dominance indicator `2 * own_share - 1` in [-1, +1]. The
// happiness POINTS are minted once, in computeHappinessBreakdown, by multiplying this
// indicator by x(era) = szczescie_skala_kultura_religia -- so the engine and the city
// panel cannot drift apart. The property this assertion guards is unchanged: our faith
// in the majority helps, a foreign faith in the majority hurts, and the sign flips at
// the same 50% line as before. What is deliberately GONE is the separate
// `karaBrakReligii` case: on a proportional scale a 50/50 city is EXACTLY neutral, so a
// split city now scores 0 instead of a small fixed penalty (owner's decision, G4 --
// zadowolenieDominujaca / karaObca / karaBrakReligii stay in ReligionParams because the
// empire panel still displays them, they just no longer steer Happiness).
assert('religion: religionHappiness rewards our dominant religion and penalises a foreign one',
  religionHappiness({ counts: { Faith1: 9, Faith2: 1 } }, 'Faith1', religionParams) === 0.8 &&
  religionHappiness({ counts: { Faith1: 9, Faith2: 1 } }, 'Faith2', religionParams) === -0.8 &&
  religionHappiness({ counts: { A: 5, B: 5 } }, 'A', religionParams, true) === 0 &&
  religionHappiness({ counts: { Only: 10 } }, 'Only', religionParams) === 1 &&
  religionHappiness({ counts: { Only: 10 } }, 'Other', religionParams) === -1 &&
  religionHappiness({ counts: { A: 3, B: 1 } }, 'A', religionParams) === 0.5,
  `own90=${religionHappiness({ counts: { Faith1: 9, Faith2: 1 } }, 'Faith1', religionParams)} ` +
  `foreign90=${religionHappiness({ counts: { Faith1: 9, Faith2: 1 } }, 'Faith2', religionParams)} ` +
  `split=${religionHappiness({ counts: { A: 5, B: 5 } }, 'A', religionParams, true)}`);

// REQUIRED: convertViaTemple shifts share toward the owner's religion; temple faster.
const startState = { counts: { Pagan: 90, Owner: 10 } }; // owner religion minority
const noTemple = convertViaTemple(startState, 'Owner', false, religionParams);
const withTemple = convertViaTemple(startState, 'Owner', true, religionParams);
assert('religion: convertViaTemple shifts share toward the owner religion',
  noTemple.targetShare > 0.10 && noTemple.converted > 0,
  `share ${noTemple.targetShare} converted ${noTemple.converted}`);
assert('religion: a temple converts faith strictly faster than without',
  withTemple.converted > noTemple.converted &&
  withTemple.targetShare > noTemple.targetShare,
  `temple converted ${withTemple.converted} vs none ${noTemple.converted}`);
assert('religion: convertViaTemple is deterministic and conserves total adherents',
  (() => {
    const a = convertViaTemple(startState, 'Owner', true, religionParams);
    const b = convertViaTemple(startState, 'Owner', true, religionParams);
    const sum = (s) => Object.values(s.counts).reduce((x, y) => x + y, 0);
    return JSON.stringify(a.state) === JSON.stringify(b.state) && sum(a.state) === sum(startState);
  })());
assert('religion: repeated convertViaTemple eventually fully converts the city',
  (() => {
    let s = { counts: { Pagan: 90, Owner: 10 } };
    for (let i = 0; i < 200 && !(s.counts.Pagan === undefined); i++) {
      s = convertViaTemple(s, 'Owner', true, religionParams).state;
    }
    return s.counts.Owner === 100 && s.counts.Pagan === undefined;
  })());
assert('religion: convertViaTemple does nothing without a target or in an empty city',
  convertViaTemple(startState, null, true, religionParams).converted === 0 &&
  convertViaTemple({ counts: {} }, 'Owner', true, religionParams).converted === 0);

// REQUIRED: spreadReligion increases an adjacent city's share deterministically.
const sourceState = { counts: { Faith: 100 } }; // dominant source faith
const neighborsIn = [
  { id: 'n1', distance: 1, state: { counts: { Other: 10 } } },
  { id: 'n2', distance: 2, state: { counts: {} } },
  { id: 'n3', distance: 5, state: { counts: {} } }, // out of range (max 3)
];
const spread1 = spreadReligion(sourceState, neighborsIn, religionParams, { seed: 42 });
assert('religion: spreadReligion reaches in-range neighbours and adds the source faith',
  spread1.reached >= 1 &&
  spread1.events.every(e => e.religion === 'Faith' && e.added > 0 &&
    e.state.counts.Faith === ((neighborsIn.find(n => n.id === e.id).state.counts.Faith || 0) + e.added)),
  JSON.stringify(spread1.events));
assert('religion: spreadReligion never reaches an out-of-range neighbour (n3 at dist 5 > max 3)',
  spread1.events.every(e => e.id !== 'n3'));
assert('religion: spreadReligion is deterministic for the same seed',
  JSON.stringify(spreadReligion(sourceState, neighborsIn, religionParams, { seed: 42 })) ===
  JSON.stringify(spreadReligion(sourceState, neighborsIn, religionParams, { seed: 42 })));
assert('religion: a Swiatynia lets religion reach at least as many neighbours as without',
  spreadReligion(sourceState, neighborsIn, religionParams, { seed: 1, hasSwiatynia: true }).reached >=
  spreadReligion(sourceState, neighborsIn, religionParams, { seed: 1 }).reached);
assert('religion: a city with no dominant religion does not spread',
  spreadReligion({ counts: { A: 5, B: 5 } }, neighborsIn, religionParams, { seed: 1 }).reached === 0);
assert('religion: makeRng (culture-religion) is a deterministic [0,1) generator for a fixed seed',
  (() => { const f = crMakeRng(7), g = crMakeRng(7); const a = f(); const b = g();
    return a === b && a >= 0 && a < 1; })());

// ---------------------------------------------------------------------------
// ── Tests: city founding + render readiness (cityfix) ────────────────────
// Verify that foundCityAt correctly creates a city that can be rendered,
// and that the B-handler territory logic works for 0 existing player cities.
// ---------------------------------------------------------------------------
{
  const cityMap = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 99999);
  const citiesArr = [];

  // Find a valid (non-water, non-mountain) hex for founding
  let fq = -1, fr = -1;
  for (const [key, hex] of Object.entries(cityMap.hexes)) {
    const t = hex.terenBazowy;
    if (t !== 'morze' && t !== 'plytkie_morze' && t !== 'gory') {
      const [q, r] = key.split(',').map(Number);
      fq = q; fr = r; break;
    }
  }
  assert('cityfix: found a valid founding hex in test map', fq >= 0 && fr >= 0,
    `fq=${fq}, fr=${fr}`);

  // B-handler logic: 0 player cities -> withinTerrFn=undefined -> no territory restriction
  const playerCityNodes0 = citiesArr.filter(c => c.ownerId === 0)
    .map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1 }));
  const withinTerrFn0 = playerCityNodes0.length > 0
    ? (q, r) => isInTerritory(q, r, playerCityNodes0)
    : undefined;
  const res0 = canFoundCity(fq, fr, citiesArr, cityMap,
    withinTerrFn0 ? { withinTerritory: withinTerrFn0 } : undefined);
  assert('cityfix: canFoundCity passes for first city (no territory restriction)',
    res0.ok, res0.reason);

  // foundCityAt creates city
  const newCity = foundCityAt(fq, fr, 0, citiesArr, cityMap, cityName(citiesArr.length));
  assert('cityfix: foundCityAt returns non-null city', newCity !== null);
  if (newCity) {
    citiesArr.push(newCity);
    assert('cityfix: city has correct q,r', newCity.q === fq && newCity.r === fr,
      `got q=${newCity.q},r=${newCity.r} want q=${fq},r=${fr}`);
    assert('cityfix: city has id=city0', newCity.id === 'city0', `id=${newCity.id}`);
    assert('cityfix: city ownerId=0', newCity.ownerId === 0, `ownerId=${newCity.ownerId}`);
    assert('cityfix: city population=1', newCity.population === 1, `pop=${newCity.population}`);
    assert('cityfix: cities array has 1 city after push', citiesArr.length === 1,
      `length=${citiesArr.length}`);
    assert('cityfix: city coords in map.hexes', (`${fq},${fr}` in cityMap.hexes),
      `key=${fq},${fr}`);
  }

  // Second city: territory min radius 5 (B-zasieg, Maciej 2026-06-27).
  if (newCity) {
    const playerCityNodes1 = citiesArr.filter(c => c.ownerId === 0)
      .map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1 }));
    assert('cityfix: after 1st city, playerCityNodes has 1 node', playerCityNodes1.length === 1,
      `length=${playerCityNodes1.length}`);
    assert('cityfix: pop1 territory radius is 5 (B min start)',
      cityRangeForPopulation(1) === 5, `got ${cityRangeForPopulation(1)}`);
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
