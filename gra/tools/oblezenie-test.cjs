'use strict';
/**
 * oblezenie-test.cjs -- standalone Node test for WIRE 4: oblezenie w turn-economy.ts
 * Run from gra/:  node tools/oblezenie-test.cjs
 *
 * Testuje:
 *   1. getCityFood: poprawnie odczytuje magazynZywnosci (lub 0 gdy undefined)
 *   2. Oblezenie: magazyn maleje o (populacja + garnizon) na ture
 *   3. Oblezenie: brak dochodu zywnosci z pol (zywnoscNetto = 0)
 *   4. Oblezenie: clamp magazynu do 0 (nie ujemny)
 *   5. Oblezenie: obleganyGlod = true gdy magazyn osiagnal 0
 *   6. Oblezenie: populacja nie zmienia sie podczas oblezenia
 *   7. Brak regresji: miasto NIE oblegane -- zachowanie BEZ ZMIAN
 *   8. Oblezenie bez garnizonu (garnizon=undefined -> 0)
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[oblezenie-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT    = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.oblezenie-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.oblezenie-bundle.cjs');

const ENTRY_TS = `
export { getCityFood, advanceCityEconomy, buildEconParams, toEconomyCity, workedTilesForCity } from '../src/game/turn-economy';
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
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[oblezenie-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);

// --- tiny assertion framework ---
let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  [OK] ' + label); passed++; }
  else { console.error('  [FAIL] ' + label); failed++; }
}
function eq(a, b, label) { ok(a === b, label + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }

// ---------------------------------------------------------------------------
// Helper: minimalny GameData wymagany przez advanceCityEconomy
// data.units musi byc tablica (array) -- buildUnitUpkeepTable iteruje rows
// ---------------------------------------------------------------------------
const MINIMAL_DATA = {
  econParams: {
    ekonomia_miasta: {},
    budynki: {},
  },
  units: [],          // MUSI byc array, nie {}
  societyParams: {},
};

// Helper: minimalny GameMap z jednym heksem
function makeMap(q, r) {
  const key = q + ',' + r;
  return {
    hexes: {
      [key]: {
        terenBazowy: 1, // Nizina
        nakladka: 0,    // Brak
        rzeka: null,
      },
    },
  };
}

// Helper: minimalny runtime City
function makeCity(overrides) {
  return Object.assign({
    id: 'city0',
    ownerId: 0,
    q: 0,
    r: 0,
    name: 'Testowo',
    population: 3,
    magazynZywnosci: 20,
  }, overrides);
}

// ===========================================================================
// 1. getCityFood
// ===========================================================================
console.log('\n1. getCityFood');
{
  const c1 = makeCity({ magazynZywnosci: 15 });
  eq(M.getCityFood(c1), 15, 'getCityFood z magazynem=15 -> 15');

  const c2 = makeCity({ magazynZywnosci: 0 });
  eq(M.getCityFood(c2), 0, 'getCityFood z magazynem=0 -> 0');

  const c3 = makeCity({});
  delete c3.magazynZywnosci;
  eq(M.getCityFood(c3), 0, 'getCityFood bez pola magazynZywnosci -> 0 (undefined)');
}

// ===========================================================================
// 2. Oblezenie: magazyn maleje o (pop + garnizon)
// ===========================================================================
console.log('\n2. Oblezenie: magazyn maleje o (pop + garnizon)');
{
  const city = makeCity({ population: 3, magazynZywnosci: 20, oblegane: true, garnizon: 2 });
  const map  = makeMap(0, 0);
  // Oczekiwane: zuzycie = 3 + 2 = 5; magazyn = 20 - 5 = 15
  const result = M.advanceCityEconomy([city], map, MINIMAL_DATA);
  const tick = result.perCity[0];
  eq(city.magazynZywnosci, 15, 'city.magazynZywnosci po oblezeniu: 20 - (3+2) = 15');
  eq(tick.magazynPoTurze,  15, 'tick.magazynPoTurze = 15');
  eq(tick.oblegany,       true, 'tick.oblegany = true');
  eq(tick.obleganyGlod,  false, 'tick.obleganyGlod = false (magazyn > 0)');
}

// ===========================================================================
// 3. Oblezenie: brak dochodu zywnosci z pol (zywnoscNetto = 0)
// ===========================================================================
console.log('\n3. Oblezenie: zywnoscNetto = 0');
{
  const city = makeCity({ population: 2, magazynZywnosci: 30, oblegane: true, garnizon: 0 });
  const map  = makeMap(0, 0);
  const result = M.advanceCityEconomy([city], map, MINIMAL_DATA);
  const tick = result.perCity[0];
  eq(tick.zywnoscNetto, 0, 'zywnoscNetto = 0 podczas oblezenia (brak dochodu z pol)');
  // totalZywnosc tez = 0 podczas oblezenia
  eq(result.totalZywnosc, 0, 'totalZywnosc = 0 podczas oblezenia');
}

// ===========================================================================
// 4. Oblezenie: clamp magazynu do 0 (nie ujemny)
// ===========================================================================
console.log('\n4. Oblezenie: clamp do 0');
{
  // Pop=5, garnizon=3, zuzycie=8, magazyn=5 -> powinno wyniesc max(0, 5-8)=0
  const city = makeCity({ population: 5, magazynZywnosci: 5, oblegane: true, garnizon: 3 });
  const map  = makeMap(0, 0);
  const result = M.advanceCityEconomy([city], map, MINIMAL_DATA);
  const tick = result.perCity[0];
  eq(city.magazynZywnosci, 0,    'magazyn clamped do 0 (nie ujemny)');
  eq(tick.magazynPoTurze,  0,    'tick.magazynPoTurze = 0');
  eq(tick.obleganyGlod,   true,  'tick.obleganyGlod = true (magazyn = 0)');
}

// ===========================================================================
// 5. Oblezenie: obleganyGlod = true gdy magazyn <=0
// ===========================================================================
console.log('\n5. Oblezenie: obleganyGlod przy pustym magazynie');
{
  // Magazyn juz 0, dowolne zuzycie -> glod
  const city = makeCity({ population: 2, magazynZywnosci: 0, oblegane: true, garnizon: 0 });
  const map  = makeMap(0, 0);
  const result = M.advanceCityEconomy([city], map, MINIMAL_DATA);
  const tick = result.perCity[0];
  eq(tick.obleganyGlod, true, 'obleganyGlod = true gdy magazyn startuje od 0');
  eq(city.magazynZywnosci, 0, 'magazyn pozostaje 0 (nie ujemny)');
}

// ===========================================================================
// 6. Oblezenie: populacja nie zmienia sie podczas oblezenia
// ===========================================================================
console.log('\n6. Oblezenie: populacja nie zmienia sie');
{
  const city = makeCity({ population: 4, magazynZywnosci: 50, oblegane: true, garnizon: 1 });
  const map  = makeMap(0, 0);
  const result = M.advanceCityEconomy([city], map, MINIMAL_DATA);
  const tick = result.perCity[0];
  eq(tick.ludnoscPrzed, 4, 'ludnoscPrzed = 4');
  eq(tick.ludnoscPo,    4, 'ludnoscPo = 4 (brak wzrostu podczas oblezenia)');
  eq(tick.wzrost,     false, 'wzrost = false podczas oblezenia');
  eq(tick.ubytek,     false, 'ubytek = false podczas oblezenia');
}

// ===========================================================================
// 7. Brak regresji: miasto NIE oblegane -- oblegany/obleganyGlod = false
// ===========================================================================
console.log('\n7. Brak regresji: miasto nie oblegane');
{
  // Miasto bez flagi oblegane (false) -- nie powinno wchodzic w logike oblezenia
  const city = makeCity({ population: 2, magazynZywnosci: 10, oblegane: false });
  const map  = makeMap(0, 0);
  const result = M.advanceCityEconomy([city], map, MINIMAL_DATA);
  const tick = result.perCity[0];
  eq(tick.oblegany,    false, 'oblegany = false gdy city.oblegane=false');
  eq(tick.obleganyGlod,false, 'obleganyGlod = false gdy nie oblegane');
  // Normalny tick: ludnosc mogla sie zmienic (wzrost/ubytek) -- to OK
  ok(typeof tick.ludnoscPo === 'number', 'ludnoscPo jest liczba (normalny tick)');
}
{
  // Miasto bez pola oblegane (undefined) -- to samo co false
  const city = makeCity({ population: 2, magazynZywnosci: 10 });
  const map  = makeMap(0, 0);
  const result = M.advanceCityEconomy([city], map, MINIMAL_DATA);
  const tick = result.perCity[0];
  eq(tick.oblegany,    false, 'oblegany = false gdy city.oblegane=undefined');
  eq(tick.obleganyGlod,false, 'obleganyGlod = false gdy oblegane=undefined');
}
{
  // Weryfikacja: bez oblezenia zywnoscNetto NIE jest wymuszone na 0 (nie wchodzi w siege-path)
  // Porownaj miasto oblegane vs nie-oblegane -- zywnoscNetto powinno sie roznic
  const cityNorm = makeCity({ population: 2, magazynZywnosci: 10, oblegane: false });
  const citySiege = makeCity({ id: 'city1', population: 2, magazynZywnosci: 10, oblegane: true });
  const mapN = makeMap(0, 0);
  const mapS = makeMap(0, 0);
  const rNorm  = M.advanceCityEconomy([cityNorm],  mapN, MINIMAL_DATA);
  const rSiege = M.advanceCityEconomy([citySiege], mapS, MINIMAL_DATA);
  // Siege -> zywnoscNetto=0; normal -> wartosc z ekonomii (moze byc rozna od 0)
  eq(rSiege.perCity[0].zywnoscNetto, 0, 'oblezony: zywnoscNetto=0');
  // Normalny: zywnoscNetto != 0 (siege path nie zostal wziety)
  ok(rNorm.perCity[0].zywnoscNetto !== 0,
    'nie-oblezony: zywnoscNetto != 0 (ekonomia dziala normalnie, got=' + rNorm.perCity[0].zywnoscNetto + ')');
}

// ===========================================================================
// 8. Oblezenie bez garnizonu (garnizon=undefined/0 -> tylko populacja)
// ===========================================================================
console.log('\n8. Oblezenie bez garnizonu');
{
  const city = makeCity({ population: 3, magazynZywnosci: 10, oblegane: true });
  // garnizon = undefined -> 0; zuzycie = 3; magazyn = 10 - 3 = 7
  const map  = makeMap(0, 0);
  const result = M.advanceCityEconomy([city], map, MINIMAL_DATA);
  const tick = result.perCity[0];
  eq(city.magazynZywnosci, 7, 'magazyn = 10 - pop(3) = 7 (garnizon undefined -> 0)');
  eq(tick.obleganyGlod, false, 'obleganyGlod = false (magazyn > 0)');
}

// --- podsumowanie ---
console.log('\noblezenie-test: ' + passed + ' passed, ' + failed + ' failed');
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
