'use strict';
/**
 * magazyn-food-cap-bez-magazynu-test.cjs -- R-WEB-MAGAZYN-NO-FOOD-CAP-BONUS-Q1
 * (decyzja wlasciciela 2026-11-05: "Usun zywnosc, dodatkowa pojemnosc wynikajaca
 * z magazynu. Zostawmy tylko to w spichlerzu.").
 *
 * Magazyn NIE zwieksza pojemnosci ZYWNOSCI centralnej panstwa. Cap zywnosci =
 * centralCapBaza (1000) + Spichlerze I/II (wklad jak dotad) -- BEZ skladnika
 * "+ centralCapBonusMagazyn x liczba Magazynow". Pojemnosc SUROWCOW Magazynu
 * (magazyn_bonus_surowce_proc_na_budynek, WAREH) NIE jest objeta tym testem.
 *
 * Pokrywa:
 *   A. Realny econ-params.json: magazyn_centralny_bonus_zywnosc_na_budynek = 0
 *      (easy/normal/hard), baza bez zmian = 1000.
 *   B. Realny silnik (esbuild z src/game/empire-food.ts): cap zywnosci przy
 *      N = 0..3 Magazynach (bez Spichlerza) wynosi 1000 dla kazdego N.
 *   C. Spichlerz I dokladany bez zmian: cap = 1000 + 1000 dla kazdego N.
 *   D. Sanity (test nie jest no-op): jawny bonus=100 daje cap rosnacy o 100
 *      na Magazyn -- czyli mierzony skladnik istnieje i test go widzi.
 *
 * Run from gra/:  node tools/magazyn-food-cap-bez-magazynu-test.cjs
 */

const fs = require('fs');
const path = require('path');
const Module = require('module');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  PASS  ' + label); }
  else { fail++; console.log('  FAIL  ' + label); }
}
function eq(actual, expected, label) {
  ok(actual === expected, `${label} (oczekiwano ${expected}, jest ${actual})`);
}

// --- Zaladuj REALNY silnik z src/ (bundle w pamieci, bez zapisu na dysk) ---
const entry = path.join(GRA, 'src', 'game', 'empire-food.ts');
const built = esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  write: false,
  logLevel: 'silent',
});
const mod = new Module(entry, module);
mod.filename = entry;
mod.paths = Module._nodeModulePaths(path.dirname(entry));
mod._compile(built.outputFiles[0].text, entry);
const EF = mod.exports;

const raw = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'econ-params.json'), 'utf8'));
const UPKEEP = { jednostkaUtrzymanieStd: 1, zywnoscJednostkaRuch: 1, zywnoscJednostkaOboz: 0.5 };

/** Cap zywnosci gracza (owner 0) po jednej turze z N Magazynami i opcjonalnym Spichlerzem I. */
function capFor(params, nMagazyn, maSpichlerz) {
  const perCity = [{
    cityId: 'stolica', ownerId: 0, oblegany: false, maSpichlerz: !!maSpichlerz,
    zywnoscBrutto: 0, kosztRacji: 0, bilansLokalny: 0, zywnoscNetto: 0,
  }];
  const builtByCity = new Map();
  for (let i = 0; i < nMagazyn; i++) {
    const id = 'magazyn' + i;
    perCity.push({
      cityId: id, ownerId: 0, oblegany: false, maSpichlerz: false,
      zywnoscBrutto: 0, kosztRacji: 0, bilansLokalny: 0, zywnoscNetto: 0,
    });
    builtByCity.set(id, ['magazyn']);
  }
  const states = new Map([[0, { zapasyPanstwa: 0, turyUjemnychZapasow: 0 }]]);
  EF.advanceEmpireFood({ perCity }, [], states, UPKEEP, params, {}, builtByCity, () => 1);
  return EF.getEmpireFoodMaxCap(0);
}

console.log('\n-- A. Realny econ-params.json: skladnik Magazynu w capie zywnosci = 0 --');
for (const d of ['easy', 'normal', 'hard']) {
  const p = EF.buildEmpireFoodParams(raw, d);
  eq(p.centralCapBonusMagazyn, 0, `[${d}] centralCapBonusMagazyn`);
  eq(p.centralCapBaza, 1000, `[${d}] centralCapBaza (bez zmian)`);
}

console.log('\n-- B. Cap zywnosci bez Spichlerza nie zalezy od liczby Magazynow --');
{
  const p = EF.buildEmpireFoodParams(raw, 'normal');
  for (let n = 0; n <= 3; n++) {
    eq(capFor(p, n, false), 1000, `N=${n} Magazynow, bez Spichlerza: cap = baza`);
  }
}

console.log('\n-- C. Spichlerz I dokladany bez zmian (baza + 1000), Magazyny nic nie dodaja --');
{
  const p = EF.buildEmpireFoodParams(raw, 'normal');
  for (let n = 0; n <= 3; n++) {
    eq(capFor(p, n, true), 2000, `N=${n} Magazynow, Spichlerz I: cap = 1000 + 1000`);
  }
}

console.log('\n-- D. Sanity: mierzony skladnik istnieje (jawny bonus=100 podnosi cap o 100/Magazyn) --');
{
  const p = Object.assign({}, EF.buildEmpireFoodParams(raw, 'normal'), { centralCapBonusMagazyn: 100 });
  eq(capFor(p, 0, false), 1000, 'bonus=100, N=0: cap = baza');
  eq(capFor(p, 2, false), 1200, 'bonus=100, N=2: cap = baza + 2x100 (test wykrylby by powrot +100)');
}

console.log(`\nWYNIK: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
