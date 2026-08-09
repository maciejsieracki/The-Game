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
  tileAssignScore,
  assignWorkedTiles,
  wagiForFocus,
  foodPotentialOfMapHex,
  resolveWorkedTiles,
  cityRangeForPopulation,
  adjustTileWorker,
  seedReczneFromAuto,
  toggleTileWorker,
  rebalanceWorkersAfterPopulationChange,
  buildTerritoryNodesFromCities,
  isTerritoryHexOwnedBy,
  isLandWorkableHex,
} from '../src/game/okolica';
export { territoryOwnerAt } from '../src/map/territory';
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
const { OKOLICA_RADIUS, okolicaTiles, tileScore, tileAssignScore, assignWorkedTiles, wagiForFocus, foodPotentialOfMapHex, resolveWorkedTiles, cityRangeForPopulation, adjustTileWorker, seedReczneFromAuto, toggleTileWorker, rebalanceWorkersAfterPopulationChange, buildTerritoryNodesFromCities, isTerritoryHexOwnedBy, isLandWorkableHex, territoryOwnerAt } = M;

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

// Test 14: overlap terytoriów — gracz nie pracuje na heksie AI
console.log('\n14. foreign territory — no worker assignment');
const territoryNodes = buildTerritoryNodesFromCities([
  { q: 0, r: 0, population: 10, ownerId: 0 },
  { q: 4, r: 0, population: 10, ownerId: 1 },
]);
// Heks (3,0) w zasięgu obu miast; bliżej AI (dist 1 vs 3) → właściciel AI
eq(territoryOwnerAt(3, 0, territoryNodes), 1, 'hex (3,0) owned by AI (closer city)');
eq(isTerritoryHexOwnedBy(3, 0, 0, territoryNodes), false, 'hex (3,0) not player-owned');
function yieldHighAt3(q, r) {
  if (q === 3 && r === 0) return { zywnosc: 99 };
  return { zywnosc: 1 };
}
const workedOwn = assignWorkedTiles(0, 0, 3, map, yieldHighAt3, {
  radius: 10,
  territoryNodes,
  ownerId: 0,
});
assert(!workedOwn.some(function(t) { return t.q === 3 && t.r === 0; }),
  'player city skips foreign hex even if best yield');
const foreignToggle = toggleTileWorker(
  { q: 0, r: 0, population: 3, ownerId: 0, okolicaTryb: 'reczny', okolicaReczne: {} },
  map, 3, 0, undefined, territoryNodes,
);
eq(foreignToggle.ok, false, 'manual assign on foreign hex rejected');
eq(foreignToggle.reason, 'obce_terytorium', 'foreign hex reason code');

// Test 15: fokus żywność — łąka 6Ż/3P bije las 4Ż/7P (R-OKOLICA-ZYWNOSC-SCORE)
console.log('\n15. focus zywnosc — meadow beats forest on food');
const foodMap = {
  szerokoscQ: 23,
  wysokoscR: 23,
  seed: 42,
  hexes: Object.assign({}, hexes, {
    '1,0': { terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak' },
    '2,0': { terenBazowy: 'wzgorza', nakladka: 'las', ulepszenie: 'brak' },
  }),
};
function yieldFoodCompare(q, r) {
  if (q === 1 && r === 0) return { zywnosc: 6, praca: 3, handel: 2 };
  if (q === 2 && r === 0) return { zywnosc: 4, praca: 7, handel: 2 };
  return { zywnosc: 1, praca: 1, handel: 1 };
}
const wagiZywnosc = wagiForFocus('zywnosc');
const foodWorked = assignWorkedTiles(0, 0, 1, foodMap, yieldFoodCompare, {
  radius: 5,
  wagi: wagiZywnosc,
  focus: 'zywnosc',
  potentialOf: function(q, r) { return foodPotentialOfMapHex(foodMap, q, r); },
});
eq(foodWorked.length, 1, 'one tile assigned');
eq(foodWorked[0].q, 1, 'meadow (1,0) wins over forest (2,0)');
eq(foodWorked[0].r, 0, 'meadow r === 0');
assert(tileScore({ zywnosc: 6, praca: 3 }, wagiZywnosc) > tileScore({ zywnosc: 4, praca: 7 }, wagiZywnosc),
  'raw food-weighted score favors meadow');

// Test 16: fokus żywność — przy równej żywności preferuj łąkę bez lasu
console.log('\n16. focus zywnosc — tie food prefers open meadow vs forest');
const tieMap = {
  szerokoscQ: 23,
  wysokoscR: 23,
  seed: 42,
  hexes: Object.assign({}, hexes, {
    '1,0': { terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak' },
    '2,0': { terenBazowy: 'wzgorza', nakladka: 'las', ulepszenie: 'brak' },
  }),
};
function yieldEqualFood(q, r) {
  if ((q === 1 && r === 0) || (q === 2 && r === 0)) return { zywnosc: 4, praca: 3, handel: 1 };
  return { zywnosc: 1, praca: 1, handel: 1 };
}
const tieWorked = assignWorkedTiles(0, 0, 1, tieMap, yieldEqualFood, {
  radius: 5,
  wagi: wagiZywnosc,
  focus: 'zywnosc',
  potentialOf: function(q, r) { return foodPotentialOfMapHex(tieMap, q, r); },
});
eq(tieWorked[0].q, 1, 'open meadow wins tie on equal current food');
assert(foodPotentialOfMapHex(tieMap, 1, 0) > foodPotentialOfMapHex(tieMap, 2, 0),
  'meadow has higher food potential than forest');

// Test 17: zrównoważone — wysoka praca lasu może wygrać przy podobnej żywności
console.log('\n17. focus zrownowazone — forest can win on praca/handel');
const wagiBal = wagiForFocus('zrownowazone');
function yieldBalancedForestWins(q, r) {
  if (q === 1 && r === 0) return { zywnosc: 4, praca: 2, handel: 1 };
  if (q === 2 && r === 0) return { zywnosc: 4, praca: 7, handel: 3 };
  return { zywnosc: 1, praca: 1, handel: 1 };
}
const balWorked = assignWorkedTiles(0, 0, 1, tieMap, yieldBalancedForestWins, {
  radius: 5,
  wagi: wagiBal,
});
eq(balWorked[0].q, 2, 'balanced: forest (2,0) beats meadow on praca when food similar');

// =============================================================================
// P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA -- runda 3 (2026-08-09)
// B2 (Evaluator rundy 2): kanon decyzji R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1 definiuje
// jawne oczekiwane zachowanie dla trybu RĘCZNEGO ze STARYM, nielegalnym wpisem
// (Gory/Morze) -- do rundy 3 ŻADEN test go nie przypinał. Testy 18-21 pokrywają
// dokładnie ten scenariusz, w tym Test 20 -- regresja B1 (bramka terenu blokująca
// ZDEJMOWANIE, nie tylko dodawanie), która przeszła niezauważona przez rundę 2.
// =============================================================================

// Mapa z jednym hexem Gór (1,0) w zasięgu -- do testów izWorkable/stary-zapis.
const goryMap = {
  szerokoscQ: 23,
  wysokoscR: 23,
  seed: 42,
  hexes: Object.assign({}, hexes, {
    '1,0': { terenBazowy: 'gory', nakladka: 'brak', ulepszenie: 'brak' },
    '2,0': { terenBazowy: 'morze', nakladka: 'brak', ulepszenie: 'brak' },
  }),
};

// Test 18: isLandWorkableHex -- predykat terenu, wspólne źródło prawdy
console.log('\n18. isLandWorkableHex (wspolne zrodlo prawdy overlay/silnik/UI)');
eq(isLandWorkableHex(goryMap, 0, 0), true, 'domyslny hex siatki (nie Gory/Morze) -> workable');
eq(isLandWorkableHex(goryMap, 1, 0), false, 'Gory -> NIE workable');
eq(isLandWorkableHex(goryMap, 2, 0), false, 'Morze -> NIE workable');
eq(isLandWorkableHex(goryMap, 999, 999), false, 'brak hexu (poza mapa) -> NIE workable');

// Test 19: proba DODANIA nowego robotnika na Gory/Morze nadal zablokowana
// (regresja pierwotnego bledu rundy 1 -- filtr terenu musi dalej dzialac dla ADD)
console.log('\n19. toggleTileWorker/adjustTileWorker — nowy wpis na Gorach/Morzu odrzucony');
const cityFreshReczny = { q: 0, r: 0, ownerId: 0, population: 3, okolicaTryb: 'reczny', okolicaReczne: {} };
const addGory = toggleTileWorker(cityFreshReczny, goryMap, 1, 0);
assert(!addGory.ok && addGory.reason === 'poza_zasiegiem', 'toggle: nowy robotnik na Gorach (1,0) odrzucony, poza_zasiegiem');
const addMorze = toggleTileWorker(cityFreshReczny, goryMap, 2, 0);
assert(!addMorze.ok && addMorze.reason === 'poza_zasiegiem', 'toggle: nowy robotnik na Morzu (2,0) odrzucony, poza_zasiegiem');
const addGoryAdjust = adjustTileWorker(cityFreshReczny, goryMap, 1, 0, 1);
assert(!addGoryAdjust.ok && addGoryAdjust.reason === 'poza_zasiegiem', 'adjust delta+1: nowy robotnik na Gorach odrzucony');

// Test 20 (B1 -- KRYTYCZNA regresja rundy 2): STARY zapis z robotnikiem JUZ
// stojacym na Gorach/Morzu (legalny przed ta naprawa, bo tryb reczny nigdy
// wczesniej nie mial filtra terenu) -- MUSI dac sie zdjac klikiem. Runda 2
// zblokowala ta operacje filtrem terenu (zakleszczenie) -- ten test lapie
// dokladnie ten regres.
console.log('\n20. toggleTileWorker/adjustTileWorker — STARY nielegalny wpis DA SIE zdjac (B1)');
const staleReczne = { '1,0': 1, '2,0': 1, '-1,0': 1, '0,1': 1 }; // 2 nielegalne (Gory,Morze) + 2 legalne
const cityStaleGory = { q: 0, r: 0, ownerId: 0, population: 4, okolicaTryb: 'reczny', okolicaReczne: staleReczne };
const removeGory = toggleTileWorker(cityStaleGory, goryMap, 1, 0);
assert(removeGory.ok === true, 'toggle: zdjecie robotnika ze STAREGO wpisu na Gorach zwraca ok=true (nie zakleszcza)');
assert(removeGory.reczne['1,0'] === undefined, 'toggle: klucz Gor usuniety z reczne po zdjeciu');
eq(Object.keys(removeGory.reczne).length, 3, 'toggle: pozostale 3 wpisy (w tym Morze) nietkniete');
assert(removeGory.reczne['2,0'] === 1 && removeGory.reczne['-1,0'] === 1 && removeGory.reczne['0,1'] === 1,
  'toggle: legalne wpisy i wpis na Morzu (jeszcze nie kliknięty) przetrwaly bez zmian');

const removeMorze = toggleTileWorker(cityStaleGory, goryMap, 2, 0);
assert(removeMorze.ok === true, 'toggle: zdjecie robotnika ze STAREGO wpisu na Morzu zwraca ok=true');
assert(removeMorze.reczne['2,0'] === undefined, 'toggle: klucz Morza usuniety z reczne po zdjeciu');

const removeGoryAdjust = adjustTileWorker(cityStaleGory, goryMap, 1, 0, -1);
assert(removeGoryAdjust.ok === true, 'adjust delta-1: zdjecie robotnika ze STAREGO wpisu na Gorach zwraca ok=true');
assert(removeGoryAdjust.reczne['1,0'] === undefined, 'adjust delta-1: klucz Gor usuniety z reczne po zdjeciu');
const removeMorzeAdjust1 = adjustTileWorker(cityStaleGory, goryMap, 2, 0, 1); // delta+1 na juz-obsadzonym = toggle off
assert(removeMorzeAdjust1.ok === true && removeMorzeAdjust1.reczne['2,0'] === undefined,
  'adjust delta+1 na juz-obsadzonym STARYM wpisie (Morze) rowniez zdejmuje (toggle-off), nie blokuje');

// Test 21: brak auto-migracji -- samo WYWOLANIE funkcji odczytu/zapisu (bez
// przypisania wyniku z powrotem do city.okolicaReczne, dokladnie jak przy
// wczytaniu zapisu i otwarciu panelu) nie zmienia oryginalnego obiektu miasta.
console.log('\n21. brak logiki auto-migracji/auto-naprawy przy samym odczycie');
const originalReczneRef = { '1,0': 1, '2,0': 1, '-1,0': 1 }; // Gory + Morze + legalne
const cityNoMigration = { q: 0, r: 0, ownerId: 0, population: 3, okolicaTryb: 'reczny', okolicaReczne: originalReczneRef };
const beforeSnapshot = JSON.stringify(cityNoMigration.okolicaReczne);
toggleTileWorker(cityNoMigration, goryMap, 1, 0); // wolanie BEZ przypisania wyniku z powrotem
resolveWorkedTiles(cityNoMigration, goryMap, function (q, r) { return { zywnosc: 1 }; });
eq(cityNoMigration.okolicaReczne, originalReczneRef, 'okolicaReczne wciaz ten sam obiekt (referencja niezmieniona)');
eq(JSON.stringify(cityNoMigration.okolicaReczne), beforeSnapshot,
  'okolicaReczne zawartosc niezmieniona po odczycie (Gory/Morze nadal w danych, bez auto-usuniecia)');

// Test 22 (B3 -- runda 4, Evaluator rundy 3): rebalanceWorkersAfterPopulationChange
// przy SPADKU populacji ze STARYM zapisem (nielegalne wpisy Gory/Morze JUZ obecne w
// okolicaReczne) musi usunac DOKLADNIE `excess` wpisow -- nie wiecej. Buggy wersja
// rundy 3 usuwala KAZDY nielegalny wpis natychmiast w petli for (bez wzgledu na
// budzet excess) I DODATKOWO usuwala jeszcze jeden legalny wpis (worstKey) na koncu
// -- przy excess=1 i 2 nielegalnych wpisach kasowala 3 wpisy zamiast 1, w tym
// legalnego, produkcyjnego robotnika. Scenariusz dokladnie jak w raporcie
// Evaluatora: 5 wpisow (3 legalne + 2 nielegalne), spadek populacji 5->4 (excess=1).
console.log('\n22. rebalanceWorkersAfterPopulationChange (reczny spadek) — B3: dokladnie excess znika');
const cityShrinkStale = {
  id: 'c-shrink', ownerId: 0, q: 0, r: 0, name: 'S', population: 4,
  okolicaFocus: 'zrownowazone', okolicaTryb: 'reczny',
  okolicaReczne: { '1,0': 1, '2,0': 1, '-1,0': 1, '0,1': 1, '0,-1': 1 }, // 2 nielegalne (Gory,Morze) + 3 legalne
};
rebalanceWorkersAfterPopulationChange(cityShrinkStale, goryMap, 5, 4); // spadek 5->4, excess=1
const afterShrink = cityShrinkStale.okolicaReczne;
eq(Object.keys(afterShrink).length, 4,
  'B3: dokladnie 1 wpis zniknal (excess=1 z 5 wpisow), nie 3 jak w buggy rundzie 3');
assert(afterShrink['-1,0'] === 1 && afterShrink['0,1'] === 1 && afterShrink['0,-1'] === 1,
  'B3: WSZYSTKIE 3 legalne, produkcyjne wpisy nietkniete (budzet excess=1 pokryty przez nielegalny wpis)');
const illegalRemainingCount = (afterShrink['1,0'] ? 1 : 0) + (afterShrink['2,0'] ? 1 : 0);
eq(illegalRemainingCount, 1,
  'B3: dokladnie 1 z 2 nielegalnych wpisow zostaje w danych nietkniety (ponad budzet excess=1), zero migracji obu naraz');

// =============================================================================
// B4 (runda 4, Evaluator rundy 3): dowod mutacyjny Evaluatora -- usuniecie filtra
// terenu z SAMEJ seedReczneFromAuto NIE bylo lapane przez zaden istniejacy test
// (Testy 9-10 wolaja ja tylko na mapie bez Gor/Morza; Testy 19-20 wolaja ja
// posrednio przez toggleTileWorker/adjustTileWorker, ale tylko gdy tryb JUZ jest
// 'auto' -- co i tak przechodzi przez ta sama funkcje, jednak zaden test tam nie
// mierzy WYNIKU seedReczneFromAuto wprost). Testy 23-24 przypinaja filtr terenu
// INDYWIDUALNIE w dwoch sciezkach, ktore do tej pory mialy pokrycie WYLACZNIE
// zbiorcze (silnik i toggle/adjust byly juz pokryte indywidualnie -- Test 19 dla
// toggle/adjust, Sekcja 1-2 okolica-isworkable-silnik-test.cjs dla silnika).
// =============================================================================

// Test 23: seedReczneFromAuto — filtr terenu wprost, bez posrednictwa toggle/adjust.
// Gory maja najwyzsza Prace w grze (4, terrain-yields.json) -- gdyby filtr byl
// usuniety z TEJ funkcji, Gory/Morze wygralyby ranking i zostalyby wybrane jako
// pierwsze (baseline siatki = teren nieznany = ZERO_YIELD, wiec kazdy dodatni score
// bije baseline pod dowolnym fokusem).
console.log('\n23. seedReczneFromAuto — filtr terenu bezposrednio (B4, dowod mutacyjny)');
const cityAutoGory = { q: 0, r: 0, ownerId: 0, population: 6, okolicaFocus: 'zrownowazone' };
const seededGory = seedReczneFromAuto(cityAutoGory, goryMap);
assert(seededGory['1,0'] === undefined, 'seedReczneFromAuto: Gory (1,0) NIE wybrane mimo najwyzszej Pracy w grze (4 pkt)');
assert(seededGory['2,0'] === undefined, 'seedReczneFromAuto: Morze (2,0) NIE wybrane mimo dodatniego score (Zywnosc 2 + Podatek 2)');
eq(Object.keys(seededGory).length, 6, 'seedReczneFromAuto: mimo wykluczenia 2 pol znaleziono 6 legalnych zastepczych (siatka ma ich pod dostatkiem)');

// Test 24: rebalanceWorkersAfterPopulationChange, galaz WZROSTU (dodawania) — filtr
// terenu wprost. Mapa celowo "zaglodzona": jedyne WOLNE pola w zasiegu (poza dwoma
// juz obsadzonymi legalnymi) to Gory i Morze -- jesli filtr zostanie usuniety z
// `tiles` w tej funkcji, `free` bedzie zawieral WYLACZNIE te dwa nielegalne
// kandydaty i deterministyczny wybor MUSI wybrac jeden z nich (100% wykrywalne,
// nie zalezne od losowego trafienia w wiekszej puli).
console.log('\n24. rebalanceWorkersAfterPopulationChange (reczny wzrost) — filtr terenu w galezi dodawania (B4)');
const growthFilterMap = {
  szerokoscQ: 5, wysokoscR: 5, seed: 1,
  hexes: {
    '0,0':  { terenBazowy: 0 },
    '-1,0': { terenBazowy: 0 },
    '0,1':  { terenBazowy: 0 },
    '1,0':  { terenBazowy: 'gory', nakladka: 'brak', ulepszenie: 'brak' },
    '2,0':  { terenBazowy: 'morze', nakladka: 'brak', ulepszenie: 'brak' },
  },
};
const cityGrowthFiltered = {
  id: 'c-growth-filter', ownerId: 0, q: 0, r: 0, name: 'GF', population: 3,
  okolicaTryb: 'reczny',
  okolicaReczne: { '-1,0': 1, '0,1': 1 }, // 2 legalne juz obsadzone; jedyne "wolne" pola sa Gory/Morze
};
rebalanceWorkersAfterPopulationChange(cityGrowthFiltered, growthFilterMap, 2, 3); // wzrost 2->3
const afterGrowthFiltered = cityGrowthFiltered.okolicaReczne;
eq(Object.keys(afterGrowthFiltered).length, 2,
  'B4: brak nowego robotnika -- jedyne "wolne" pola (Gory,Morze) sa nielegalne, filtr blokuje dodanie');
assert(afterGrowthFiltered['1,0'] === undefined && afterGrowthFiltered['2,0'] === undefined,
  'B4: nowy robotnik NIE trafil na Gory/Morze mimo ze byly jedynymi "wolnymi" polami w zasiegu');

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
