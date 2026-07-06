'use strict';
/**
 * auto-manage-test.cjs -- standalone Node test for src/game/auto-manage.ts
 * Run from gra/:  node tools/auto-manage-test.cjs
 *
 * Self-contained: bundles auto-manage.ts + its deps with esbuild to a
 * temp CJS file, then requires it and runs assertions.
 * Pure logic only -- no DOM, no THREE, no I/O.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[auto-manage-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.auto-manage-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.auto-manage-bundle.cjs');

const ENTRY_TS = `
export { autoManageCity } from '../src/game/auto-manage';
export { frontItem, enqueue as enqueueItem, buildableProduction, availableProduction } from '../src/game/production';
export { cityRangeForPopulation, assignWorkedTiles } from '../src/game/okolica';
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
  console.error('[auto-manage-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { autoManageCity, frontItem, enqueueItem, buildableProduction, cityRangeForPopulation } = M;

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

// --- fixtures --------------------------------------------------------------

// Mapa: heksy q,r w [-11..11]
const hexes = {};
for (let q = -11; q <= 11; q++) {
  for (let r = -11; r <= 11; r++) {
    hexes[q + ',' + r] = { terenBazowy: 0 };
  }
}
const map = { szerokoscQ: 23, wysokoscR: 23, hexes, seed: 42 };

// Miasto bazowe
const cityBase = {
  id: 'city0',
  ownerId: 1,
  q: 0,
  r: 0,
  name: 'Testowo',
  population: 2,
};

// Prosta funkcja plonow: pole (2,0) -> zywnosc 99, reszta zywnosc 1
// UWAGA: cityRangeForPopulation(2)=max(5,2)=5; (3,0) dist=3 — w zasięgu.
// (2,0) dist=2 też w zasięgu (Maciej 2026-06-27: min start r=5).
function yieldOf(q, r) {
  if (q === 2 && r === 0) return { zywnosc: 99 };
  return { zywnosc: 1 };
}

// Pusta kolejka produkcji
const emptyProd = { kolejka: [], postep: 0 };

// Minimal data: jeden budynek Kamien (bez techUnlock) + jeden budynek Braz
const dataMinimal = {
  buildings: [
    {
      id: 'stolarnia',
      nazwa: 'Stolarnia',
      kategoria: 'Produkcja',
      epokaWejscia: 1,
      maksPoziom: 10,
      kosztBudowy: 20,
      techUnlock: '',
    },
    {
      id: 'koszary',
      nazwa: 'Koszary',
      kategoria: 'Wojsko',
      epokaWejscia: 2,
      maksPoziom: 10,
      kosztBudowy: 30,
      techUnlock: '',
    },
  ],
  units: [],
};

// --- tests -----------------------------------------------------------------
console.log('\n[auto-manage-test] Running tests...\n');

// Test 1: wynik jest obiektem z poprawnymi kluczami
console.log('1. Struktura zwracanego obiektu');
const result1 = autoManageCity(cityBase, map, emptyProd, dataMinimal, { yieldOf });
assert(typeof result1 === 'object' && result1 !== null, 'result is an object');
assert('workedTiles' in result1, 'result has workedTiles');
assert('enqueue' in result1,     'result has enqueue');
assert('pracaSplit' in result1,  'result has pracaSplit');

// Test 2: przydial pol = min(populacja, dostepne)
console.log('\n2. Auto-przydial pol = populacja 2');
eq(result1.workedTiles.length, 2, 'workedTiles.length === populacja(2)');

// Test 3: najlepsze pole wybrane pierwsze (q=2,r=0 ma yield 99)
// Zasieg okolicy: cityRangeForPopulation(2)=max(5,2)=5; (2,0) w zasięgu (dist=2). Maciej 2026-06-27.
console.log('\n3. Najlepsze pole wybrane pierwsze');
assert(
  result1.workedTiles.some(t => t.q === 2 && t.r === 0),
  'najlepsze pole (2,0) jest wsrod workedTiles'
);

// Test 4: pusta kolejka -> sugestia enqueue (budynek dostepny w epoce 1)
console.log('\n4. Pusta kolejka -> enqueue proponuje budynek');
assert(result1.enqueue !== null, 'enqueue nie jest null gdy kolejka pusta i budynki dostepne');
eq(result1.enqueue && result1.enqueue.kind, 'budynek', 'zaproponowany element to budynek');
eq(result1.enqueue && result1.enqueue.id, 'stolarnia', 'zaproponowano stolarnię (epoka 1)');

// Test 5: niepusta kolejka -> enqueue === null (nie podwajamy kolejki)
console.log('\n5. Niepusta kolejka -> brak enqueue');
const prodWithItem = { kolejka: [{ kind: 'budynek', id: 'stolarnia', nazwa: 'Stolarnia', koszt: 20 }], postep: 0 };
const result5 = autoManageCity(cityBase, map, prodWithItem, dataMinimal, { yieldOf });
eq(result5.enqueue, null, 'enqueue === null gdy kolejka niepusta');

// Test 6: pracaSplit = null gdy brak cityPraca
console.log('\n6. pracaSplit = null gdy brak cityPraca w inputcie');
eq(result1.pracaSplit, null, 'pracaSplit jest null gdy cityPraca nie podane');

// Test 7: pracaSplit obliczone poprawnie
console.log('\n7. pracaSplit = splitPraca(10, 0.7)');
const result7 = autoManageCity(cityBase, map, emptyProd, dataMinimal, { yieldOf, cityPraca: 10, udzialBudynki: 0.7 });
assert(result7.pracaSplit !== null, 'pracaSplit nie jest null gdy cityPraca=10');
// 10 * 0.7 = 7 do budynkow, 3 do puli
assert(Math.abs(result7.pracaSplit.doBudynkow - 7) < 1e-9, 'doBudynkow === 7');
assert(Math.abs(result7.pracaSplit.doPuli - 3) < 1e-9, 'doPuli === 3');

// Test 8: PURE -- wejscia nie sa mutowane
console.log('\n8. Pure -- wejscia niezmienione po wywolaniu');
const cityBefore = JSON.stringify(cityBase);
const prodBefore = JSON.stringify(emptyProd);
const mapKeysBefore = Object.keys(hexes).length;
autoManageCity(cityBase, map, emptyProd, dataMinimal, { yieldOf });
eq(JSON.stringify(cityBase), cityBefore, 'city nie zmutowane');
eq(JSON.stringify(emptyProd), prodBefore, 'prod nie zmutowane');
eq(Object.keys(hexes).length, mapKeysBefore, 'mapa nie zmutowana');

// Test 9: determinizm -- dwa identyczne wywolania = identyczny wynik
console.log('\n9. Determinizm');
const r9a = autoManageCity(cityBase, map, emptyProd, dataMinimal, { yieldOf });
const r9b = autoManageCity(cityBase, map, emptyProd, dataMinimal, { yieldOf });
eq(
  JSON.stringify(r9a.workedTiles),
  JSON.stringify(r9b.workedTiles),
  'workedTiles sa identyczne w dwoch wywolaniach'
);
eq(
  r9a.enqueue && r9a.enqueue.id,
  r9b.enqueue && r9b.enqueue.id,
  'enqueue.id identyczne w dwoch wywolaniach'
);

// Test 10: brak dostepnych budynkow (wszystkie zbudowane) -> enqueue null
console.log('\n10. Wszystkie budynki zbudowane -> enqueue === null');
const ctx10 = { epoch: 1, builtBuildingIds: ['stolarnia'] };
const result10 = autoManageCity(cityBase, map, emptyProd, dataMinimal, { yieldOf, ctx: ctx10 });
// W epoce 1 dostepna tylko stolarnia (koszary ep.2 > epoch 1), wiec enqueue null
eq(result10.enqueue, null, 'brak kandydatow -> enqueue null');

// Test 11: populacja 0 -> workedTiles = []
console.log('\n11. Populacja 0 -> workedTiles pusty');
const cityPop0 = { ...cityBase, population: 0 };
const r11 = autoManageCity(cityPop0, map, emptyProd, dataMinimal, { yieldOf });
eq(r11.workedTiles.length, 0, 'populacja 0 -> brak przydzialonych pol');

// Test 12: przydial pol clamp -- populacja > liczba pol w zasiegu
console.log('\n12. Clamp -- populacja wieksza niz dostepne pola');
const cityBigPop = { ...cityBase, population: 99999 };
const r12 = autoManageCity(cityBigPop, map, emptyProd, dataMinimal, { yieldOf });
// Promien dla pop>=10 = 15, ale mapa to tylko [-11..11], wiec dostepne < 99999
assert(r12.workedTiles.length < 99999, 'workedTiles.length < populacja (clamp do dostepnych)');
assert(r12.workedTiles.length > 0, 'jest przynajmniej jedno pole');

// Test 13: domyslny udzial 0.7 stosowany gdy brakuje udzialBudynki
console.log('\n13. Domyslny udzialBudynki = 0.7');
const r13 = autoManageCity(cityBase, map, emptyProd, dataMinimal, { yieldOf, cityPraca: 20 });
assert(r13.pracaSplit !== null, 'pracaSplit nie null');
assert(Math.abs(r13.pracaSplit.doBudynkow - 14) < 1e-9, 'doBudynkow = 20*0.7 = 14');
assert(Math.abs(r13.pracaSplit.doPuli - 6) < 1e-9, 'doPuli = 20*0.3 = 6');

// --- summary ---------------------------------------------------------------
const total = passed + failed;
if (failed === 0) {
  console.log('\nAUTO-MANAGE OK (' + passed + '/' + total + ')');
} else {
  console.log('\nAUTO-MANAGE FAIL (' + passed + '/' + total + ' passed, ' + failed + ' failed)');
}

// Clean up temp artifacts
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed === 0 ? 0 : 1);
