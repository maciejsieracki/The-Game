'use strict';
/**
 * ekonomia-5x-inwariant-test.cjs — R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (Maciej 2026-08-13).
 *
 * Bramka-inwariant dla mutacji zbiorczej ×5 w `buildings.json`/`units.json` (koszt rekrutacji,
 * koszt budowy, utrzymanie surowcowe jednostek). ZNALEZISKO Evaluatora (Runda 1): 255 zmienionych
 * liczb NIE było łapane przez żadną istniejącą bramkę — `logic-test.cjs`/inne testy nie asercjonują
 * tych konkretnych pól, więc przypadkowe cofnięcie (np. koszt budowy Spichlerza 40→8, koszt
 * rekrutacji Wojownika 50→10) przeszłoby przez WSZYSTKIE dotychczasowe bramki bez czerwonego testu.
 *
 * DWIE WARSTWY OCHRONY (celowo obie, bo same osobno nie wystarczają):
 *   A. Inwariant STRUKTURALNY: KAŻDY niezerowy wpis `koszt_surowce` w buildings.json i
 *      `Surowiec (ilość)` / `Utrzymanie surowiec (ilość)` w units.json musi być wielokrotnością 5
 *      i wynosić ≥5 (minimalna sensowna wartość po skalowaniu ×5). Łapie DOWOLNĄ przyszłą
 *      niewielokrotność (np. literówka 47 zamiast 50, albo zapomniane przeskalowanie nowego pola
 *      dodanego bez uwzględnienia konwencji ×5) w CAŁYM pliku, nie tylko w polach wybranych niżej.
 *      NIE łapie samodzielnie cofnięcia do innej wielokrotności 5 (np. 50→10 -- 10 nadal jest
 *      wielokrotnością 5) -- stąd warstwa B.
 *   B. Inwariant PRZYPIĘTY: konkretne, reprezentatywne wartości (budynek wczesnej epoki, budynek
 *      późnej epoki, tania jednostka koszt+utrzymanie, droga jednostka koszt+utrzymanie) przypięte
 *      jako DOKŁADNE liczby. Cofnięcie do innej wielokrotności 5 (np. 50→10) PRZECHODZI przez
 *      warstwę A, ale ZOSTAJE złapane tutaj.
 *
 * Run from gra/: node tools/ekonomia-5x-inwariant-test.cjs
 */

const buildings = require('../data/buildings.json');
const units = require('../data/units.json');

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); }
}
function eq(a, b, msg) {
  ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

// ---------------------------------------------------------------------------
// A. Inwariant strukturalny: KAŻDY niezerowy koszt_surowce (buildings.json) i
//    Surowiec (ilość) / Utrzymanie surowiec (ilość) (units.json) jest wielokrotnością 5, >= 5.
// ---------------------------------------------------------------------------
console.log('\n-- A. Inwariant strukturalny: wszystkie wartości surowcowe wielokrotnością 5, >=5 --\n');

let checkedBuildingFields = 0;
for (const b of buildings) {
  const ks = b.koszt_surowce || {};
  for (const [resKey, val] of Object.entries(ks)) {
    if (!val) continue; // pomijamy pola zerowe/brakujące -- inwariant dotyczy WPISÓW niezerowych
    checkedBuildingFields++;
    ok(
      Number.isFinite(val) && val >= 5 && val % 5 === 0,
      `buildings.json: ${b.id}.koszt_surowce.${resKey} = ${val} musi być wielokrotnością 5, >=5`,
    );
  }
}
ok(checkedBuildingFields > 0, 'sanity: sprawdzono >0 pól koszt_surowce w buildings.json');
console.log(`   (sprawdzono ${checkedBuildingFields} niezerowych pól koszt_surowce w ${buildings.length} budynkach)`);

let checkedUnitFields = 0;
for (const u of units) {
  const name = u['Jednostka'] || u.id || '(brak nazwy)';
  const surowiec = u['Surowiec (ilość)'];
  const utrzymanie = u['Utrzymanie surowiec (ilość)'];
  if (surowiec) {
    checkedUnitFields++;
    ok(
      Number.isFinite(surowiec) && surowiec >= 5 && surowiec % 5 === 0,
      `units.json: "${name}"."Surowiec (ilość)" = ${surowiec} musi być wielokrotnością 5, >=5`,
    );
  }
  if (utrzymanie) {
    checkedUnitFields++;
    ok(
      Number.isFinite(utrzymanie) && utrzymanie >= 5 && utrzymanie % 5 === 0,
      `units.json: "${name}"."Utrzymanie surowiec (ilość)" = ${utrzymanie} musi być wielokrotnością 5, >=5`,
    );
  }
}
ok(checkedUnitFields > 0, 'sanity: sprawdzono >0 pól Surowiec/Utrzymanie w units.json');
console.log(`   (sprawdzono ${checkedUnitFields} niezerowych pól Surowiec/Utrzymanie w ${units.length} jednostkach)`);

// ---------------------------------------------------------------------------
// B. Inwariant przypięty: konkretne reprezentatywne wartości, ODPORNY na cofnięcie do innej
//    wielokrotności 5 (np. gdyby ktoś przez pomyłkę wrócił 50 -> 10, oba są wielokrotnościami 5,
//    warstwa A tego NIE złapie -- ale to przypięcie tak).
// ---------------------------------------------------------------------------
console.log('\n-- B. Inwariant przypięty: konkretne wartości reprezentatywne --\n');

function findBuilding(id) {
  return buildings.find(b => b.id === id);
}
function findUnit(nazwa) {
  return units.find(u => u['Jednostka'] === nazwa);
}

// B1. Budynek wczesnej epoki (epoka 1): Stolarnia -- koszt budowy w Drewnie.
const stolarnia = findBuilding('stolarnia');
ok(!!stolarnia, 'sanity: budynek "stolarnia" istnieje w buildings.json');
if (stolarnia) {
  eq(stolarnia.koszt_surowce && stolarnia.koszt_surowce.drewno, 25,
    'PRZYPIĘTE: stolarnia (epoka 1) koszt_surowce.drewno === 25 (x5, bylo 5)');
}

// B2. Budynek późnej epoki (epoka 4): Wielka Odlewnia -- koszt budowy w Drewnie + Cegle.
const wielkaOdlewnia = findBuilding('wielka_odlewnia');
ok(!!wielkaOdlewnia, 'sanity: budynek "wielka_odlewnia" istnieje w buildings.json');
if (wielkaOdlewnia) {
  eq(wielkaOdlewnia.koszt_surowce && wielkaOdlewnia.koszt_surowce.drewno, 60,
    'PRZYPIĘTE: wielka_odlewnia (epoka 4) koszt_surowce.drewno === 60 (x5, bylo 12)');
  eq(wielkaOdlewnia.koszt_surowce && wielkaOdlewnia.koszt_surowce.cegla, 70,
    'PRZYPIĘTE: wielka_odlewnia (epoka 4) koszt_surowce.cegla === 70 (x5, bylo 14)');
}

// B3. Budynek epoki 3 z koszt_surowce.kamien (druga waluta budowlana): Fort.
const fort = findBuilding('fort');
ok(!!fort, 'sanity: budynek "fort" istnieje w buildings.json');
if (fort) {
  eq(fort.koszt_surowce && fort.koszt_surowce.kamien, 100,
    'PRZYPIĘTE: fort (epoka 3) koszt_surowce.kamien === 100 (x5, bylo 20)');
}

// B4. Tania jednostka wczesnej epoki: Wojownik -- koszt rekrutacji + utrzymanie.
const wojownik = findUnit('Wojownik');
ok(!!wojownik, 'sanity: jednostka "Wojownik" istnieje w units.json');
if (wojownik) {
  eq(wojownik['Surowiec (ilość)'], 50,
    'PRZYPIĘTE: Wojownik "Surowiec (ilość)" === 50 (x5, bylo 10)');
  eq(wojownik['Utrzymanie surowiec (ilość)'], 10,
    'PRZYPIĘTE: Wojownik "Utrzymanie surowiec (ilość)" === 10 (x5, bylo 2)');
}

// B5. Droższa jednostka elitarna (żeby przypiąć również drugi poziom kosztu 75/15, nie tylko 50/10):
const swietyZastep = findUnit('Hieros Lochos (Święty Zastęp)');
ok(!!swietyZastep, 'sanity: jednostka "Hieros Lochos (Święty Zastęp)" istnieje w units.json');
if (swietyZastep) {
  eq(swietyZastep['Surowiec (ilość)'], 75,
    'PRZYPIĘTE: Hieros Lochos "Surowiec (ilość)" === 75 (x5, bylo 15)');
  eq(swietyZastep['Utrzymanie surowiec (ilość)'], 15,
    'PRZYPIĘTE: Hieros Lochos "Utrzymanie surowiec (ilość)" === 15 (x5, bylo 3)');
}

console.log(`\nekonomia-5x-inwariant-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
