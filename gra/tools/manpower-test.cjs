'use strict';

/**

 * manpower-test.cjs — testy modelu ludność / Manpower (epoka × ludki).

 * Run: node tools/manpower-test.cjs  (from gra/)

 */



const fs = require('fs');

const path = require('path');

const esbuild = require('esbuild');



const ENTRY = path.join(__dirname, '.manpower-entry.ts');

const BUNDLE = path.join(__dirname, '.manpower-bundle.cjs');



fs.writeFileSync(ENTRY, `

import {

  cityManpowerSnapshot,

  unitManpowerCost,

  unitManpowerCostForType,

  isScoutTypeId,

  SCOUT_TYPE_ID,

  cityLudnoscAbsolutna,

  cityManpowerMax,

  spendManpower,

  formatPopulationAbs,

  tryDeductUnitSpawnCosts,

  canAffordUnitManpower,

  tryDeductUnitSpawnCostsEmpire,

  canAffordUnitManpowerEmpire,

  empireManpowerCurrent,

  tickManpowerRegen,

  manpowerRegenGain,

  loadManpowerRegenParams,

  civManpowerRegenMult,

  civManpowerMaxMult,

  civManpowerMults,

  empirePoborTotals,

  deductManpowerFromEmpire,

  refundManpowerToEmpire,

  tickManpowerUnitReplenishment,

  loadManpowerReplenishParams,

  manpowerHealCapForTurn,

  manpowerCostForHeal,

  maxAffordableManpowerHeal,

  isUnitInBesiegedLocation,

  replenishmentUnitSortKey,

} from '../src/game/manpower';



module.exports = {

  cityManpowerSnapshot,

  unitManpowerCost,

  unitManpowerCostForType,

  isScoutTypeId,

  SCOUT_TYPE_ID,

  cityLudnoscAbsolutna,

  cityManpowerMax,

  spendManpower,

  formatPopulationAbs,

  tryDeductUnitSpawnCosts,

  canAffordUnitManpower,

  tryDeductUnitSpawnCostsEmpire,

  canAffordUnitManpowerEmpire,

  empireManpowerCurrent,

  tickManpowerRegen,

  manpowerRegenGain,

  civManpowerRegenMult,

  civManpowerMaxMult,

  civManpowerMults,

  empirePoborTotals,

  deductManpowerFromEmpire,

  refundManpowerToEmpire,

  tickManpowerUnitReplenishment,

  loadManpowerReplenishParams,

  manpowerHealCapForTurn,

  manpowerCostForHeal,

  maxAffordableManpowerHeal,

  isUnitInBesiegedLocation,

  replenishmentUnitSortKey,

};

`, 'utf8');



esbuild.buildSync({

  entryPoints: [ENTRY],

  bundle: true,

  platform: 'node',

  format: 'cjs',

  outfile: BUNDLE,

  logLevel: 'silent',

});



const mp = require(BUNDLE);



let pass = 0;

let fail = 0;



function ok(cond, msg) {

  if (cond) { pass++; return; }

  fail++;

  console.error('FAIL:', msg);

}



const city10 = { population: 10, manpower: undefined };



// Epoka 1: 10 ludków

ok(mp.cityLudnoscAbsolutna(10, 1) === 100_000, 'ep1 ludnosc 100k');

ok(mp.cityManpowerMax(10, 1) === 10_000, 'ep1 manpower max 10k');

ok(mp.unitManpowerCost(1) === 1000, 'ep1 koszt jednostki 1000 (R-MANPOWER-EPOKA1-500-VS-1000=A, cofniecie testu z 2026-08-03)');



const s1 = mp.cityManpowerSnapshot(city10, 1);

ok(s1.ludnoscAbsolutna === 100_000 && s1.manpowerMax === 10_000, 'snapshot ep1');

ok(s1.werbMaxPrzyPelnejPuli === 10, '10 jednostek przy pelnej puli ep1 (koszt 1000 = 1 jednostka / ludek)');



// Epoka 10

ok(mp.cityLudnoscAbsolutna(10, 10) === 48_000_000, 'ep10 ludnosc 48M');

ok(mp.unitManpowerCost(10) === 480_000, 'ep10 koszt jednostki 480k');



// Koszt jednostki: wszystkie epoki = pełny slot manpower (R-MANPOWER-EPOKA1-500-VS-1000=A)

ok(mp.unitManpowerCost(3) === 4000, 'ep3 jednostka 4000 (= manpowerNaLudka)');



// spend

const after = mp.spendManpower({ population: 10, manpower: 10_000 }, 1);

ok(after === 9_000, 'spend 1000 z 10k');



const block = mp.tryDeductUnitSpawnCosts({ population: 10, manpower: 50 }, 1);

ok(!block.ok && block.reason === 'brak_manpower', 'blokada przy 50 MP');



const okDed = mp.tryDeductUnitSpawnCosts({ population: 10, manpower: 10_000 }, 1, 1);

ok(okDed.ok && okDed.manpower === 9_000 && okDed.population === 9, 'deduct pop+mp gdy popCost=1');



// H-fix (Maciej 2026-07-21): rekrutacja z popCost=0 (miasto-params.json jednostka_koszt_ludnosci=0)

// NIE zabiera populacji miasta — jedynym kosztem werbu jest pula Manpower.

const okDed0 = mp.tryDeductUnitSpawnCosts({ population: 10, manpower: 10_000 }, 1, 0);

ok(okDed0.ok && okDed0.manpower === 9_000 && okDed0.population === 10, 'popCost=0: populacja bez zmian, manpower -1000');



ok(mp.formatPopulationAbs(1_200_000).includes('mln'), 'format mln');



ok(mp.manpowerRegenGain(10, 1, { regenProcMaxPerTurn: 2, blockWhenBesieged: true }) === 200, 'regen 2% max');

const afterRegen = mp.tickManpowerRegen({ population: 10, manpower: 0, oblegane: false }, 1, { regenProcMaxPerTurn: 2, blockWhenBesieged: true });

ok(afterRegen === 200, 'tick 0→200');

const siegeBlock = mp.tickManpowerRegen({ population: 10, manpower: 200, oblegane: true }, 1, { regenProcMaxPerTurn: 2, blockWhenBesieged: true });

ok(siegeBlock === 200, 'oblezenie blokuje regen');



ok(mp.civManpowerRegenMult([]) === 1, 'regen mult domyslny 1');

ok(Math.abs(mp.civManpowerRegenMult([{ typ: 'bonus_pobor_regen', wartosc: 1.0 }]) - 2) < 0.001, 'rzym regen x2');

ok(Math.abs(mp.civManpowerRegenMult([{ typ: 'bonus_pobor_regen', wartosc: -0.15 }]) - 0.85) < 0.001, 'grecy -15%');

ok(mp.civManpowerMaxMult([{ typ: 'mnoznik_manpower_max', wartosc: 2.0 }]) === 2, 'rzym max x2');

ok(mp.cityManpowerMax(10, 1, 2) === 20_000, 'ep1 roman max 20k');

ok(mp.unitManpowerCost(1, 2) === 2000, 'ep1 roman koszt jednostki 2000 (1000×2)');

const romanBonusy = [

  { typ: 'mnoznik_manpower_max', wartosc: 2.0 },

  { typ: 'bonus_pobor_regen', wartosc: 1.0 },

];

const romanMults = mp.civManpowerMults(romanBonusy);

ok(romanMults.regenMult === 2 && romanMults.maxMult === 2, 'roman mults 2x2');

ok(mp.manpowerRegenGain(10, 1, { regenProcMaxPerTurn: 2, blockWhenBesieged: true }, 2, 2) === 800, 'rzym regen 800/ture');

const greekRegen = mp.manpowerRegenGain(10, 1, { regenProcMaxPerTurn: 2, blockWhenBesieged: true }, 1, 1);

ok(greekRegen === 200, 'grecy regen 200/ture');

const romanSnap = mp.cityManpowerSnapshot(city10, 1, romanMults.regenMult, romanMults.maxMult);

ok(romanSnap.manpowerMax === 20_000 && romanSnap.kosztJednostki === 2000 && romanSnap.regenPerTurn === 800, 'roman snapshot ep1 10 ludkow');



const cities = [

  { ownerId: 0, population: 10, manpower: 8000 },

  { ownerId: 0, population: 5, manpower: 4000 },

];

const emp = mp.empirePoborTotals(cities, 0, 1);

ok(emp.ludnoscAbsolutna === 150_000, 'empire ludnosc 150k');

ok(emp.rekruci === 12_000, 'empire rekruci 12k');

ok(emp.poborRaw === 162_000, 'pobor raw sum');



const cityRecruit = { population: 10, manpower: 10_000 };

ok(mp.spendManpower(cityRecruit, 1) === 9_000, 'enqueue rekrutacji: spendManpower od razu (ep1 koszt 1000)');

// Zwiadowca (Scout): 0 MP przy rekrutacji
ok(mp.isScoutTypeId('Zwiadowca'), 'scout typeId rozpoznany');
ok(mp.unitManpowerCostForType('Zwiadowca', 1) === 0, 'zwiadowca koszt MP 0 ep1');
ok(mp.unitManpowerCostForType('Zwiadowca', 1, 2) === 0, 'zwiadowca koszt MP 0 ep1 roman');
ok(mp.unitManpowerCostForType('Wojownik', 1) === 1000, 'wojownik koszt MP ep1 = 1000');
const scoutDed = mp.tryDeductUnitSpawnCosts({ population: 10, manpower: 50 }, 1, 0, 1, 'Zwiadowca');
ok(scoutDed.ok && scoutDed.kosztManpower === 0 && scoutDed.manpower === 50, 'zwiadowca: brak MP nawet przy pustej puli');
const scoutDed2 = mp.tryDeductUnitSpawnCosts({ population: 10, manpower: 10_000 }, 1, 0, 1, 'Zwiadowca');
ok(scoutDed2.ok && scoutDed2.manpower === 10_000, 'zwiadowca: pula MP bez zmian po rekrutacji');

// Werb imperium: suma pul miast, pobór z innego miasta gdy lokalna pula za mała
const empCities = [
  { id: 'a', ownerId: 0, population: 5, manpower: 200 },
  { id: 'b', ownerId: 0, population: 5, manpower: 1200 },
];
ok(mp.empireManpowerCurrent(empCities, 0, 1) === 1400, 'empireManpowerCurrent suma');
const athens = empCities[0];
const sparta = empCities[1];
ok(
  mp.canAffordUnitManpowerEmpire(empCities, 0, athens, 1, 1, 1, 'Wojownik'),
  'empire afford: Ateny z MP Sparty',
);
ok(
  !mp.canAffordUnitManpower(athens, 1, 1, 'Wojownik'),
  'per-city afford: Ateny same nie starcza',
);
const empDed = mp.tryDeductUnitSpawnCostsEmpire(empCities, 'a', 0, 1, 0, 1, 'Wojownik');
ok(empDed.ok && empDed.kosztManpower === 1000, 'empire deduct ok (ep1 koszt 1000)');
ok(athens.population === 5 && sparta.population === 5, 'werb: ludnosc miast bez zmian');
ok(athens.manpower === 200 && sparta.manpower === 200, 'empire deduct: z puli cywilizacji (najpierw wieksza pula, 1200-1000)');
ok(mp.empireManpowerCurrent(empCities, 0, 1) === 400, 'empire po werbie: 400 MP');
const beforeRefund = mp.empireManpowerCurrent(empCities, 0, 1);
mp.refundManpowerToEmpire(empCities, 0, 1, 500, 1);
ok(mp.empireManpowerCurrent(empCities, 0, 1) === beforeRefund + 500, 'zwrot MP do puli imperium');

// Faza 3: uzupełnianie HP z puli Manpower
const healParamsEasy = mp.loadManpowerReplenishParams('easy');
const healParamsHard = mp.loadManpowerReplenishParams('hard');
ok(healParamsEasy.healPctMaxPerTurn === 40, 'uzupelnienie easy 40% (R-MANPOWER-LECZENIE-PROC-TRUDNOSC 2026-08-16)');
ok(healParamsHard.healPctMaxPerTurn === 20, 'uzupelnienie hard 20% (R-MANPOWER-LECZENIE-PROC-TRUDNOSC 2026-08-16)');
ok(mp.manpowerHealCapForTurn(100, 10, healParamsEasy) === 40, 'cap leczenia 40% maxHP');
ok(mp.manpowerCostForHeal(25, 100, 1000) === 250, 'koszt MP proporcjonalny do leczenia');

const healCities = [{ id: 'h1', ownerId: 0, population: 10, manpower: 5000, q: 0, r: 0, oblegane: false }];
const healUnit = { id: 'u1', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', hp: 10, hpMax: 100, q: 3, r: 3 };
const healRes = mp.tickManpowerUnitReplenishment(
  healCities,
  [healUnit],
  'normal',
  () => 1,
  () => [],
  () => 100,
);
ok(healRes.healedCount === 1 && healUnit.hp === 40, 'normal: +30 HP (30% z 100)');
ok(healRes.totalMpSpent === 300, 'normal: koszt 300 MP (30% × 1000)');
ok(healCities[0].manpower === 4700, 'normal: pula -300 MP');

const lowMpCities = [{ id: 'h2', ownerId: 0, population: 10, manpower: 50, q: 0, r: 0, oblegane: false }];
const lowMpUnit = { id: 'u2', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', hp: 10, hpMax: 100, q: 4, r: 4 };
const lowMpRes = mp.tickManpowerUnitReplenishment(
  lowMpCities,
  [lowMpUnit],
  'normal',
  () => 1,
  () => [],
  () => 100,
);
ok(lowMpRes.healedCount === 1 && lowMpUnit.hp === 15, 'czesciowe leczenie przy malo MP (+5 HP)');
ok(lowMpRes.totalMpSpent === 50, 'czesciowe: wydano cala dostepna pule 50 MP');

const multiTurnUnit = { id: 'u3', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', hp: 1, hpMax: 100, q: 6, r: 6 };
const multiCities = [{ id: 'h3', ownerId: 0, population: 10, manpower: 100_000, q: 0, r: 0, oblegane: false }];
for (let t = 0; t < 3; t++) {
  mp.tickManpowerUnitReplenishment(multiCities, [multiTurnUnit], 'easy', () => 1, () => [], () => 100);
}
ok(multiTurnUnit.hp === 100, 'easy: 3 tury z 1 HP do 100 (40/ture: 1+40+40+19 capped na maxHP)');

// B-MP-Q1c: brak leczenia w oblężonym mieście (hex lub garnizon)
const siegeCities = [{ id: 's1', ownerId: 0, population: 10, manpower: 5000, q: 5, r: 5, oblegane: true }];
const siegeGarnUnit = { id: 'sg', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', hp: 10, hpMax: 100, q: 5, r: 5, inGarnizon: true };
ok(mp.isUnitInBesiegedLocation(siegeGarnUnit, siegeCities), 'garnizon w obleganym miescie = blokada');
const siegeRes = mp.tickManpowerUnitReplenishment(siegeCities, [siegeGarnUnit], 'normal', () => 1, () => [], () => 100);
ok(siegeRes.healedCount === 0 && siegeGarnUnit.hp === 10, 'oblezenie: brak leczenia garnizonu');
ok(siegeCities[0].manpower === 5000, 'oblezenie: pula MP bez zmian');

const siegeHexUnit = { id: 'sh', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', hp: 20, hpMax: 100, q: 5, r: 5 };
const siegeHexRes = mp.tickManpowerUnitReplenishment(siegeCities, [siegeHexUnit], 'normal', () => 1, () => [], () => 100);
ok(siegeHexRes.healedCount === 0 && siegeHexUnit.hp === 20, 'oblezenie: brak leczenia na hexie miasta');

// Pole poza oblężeniem leczy się normalnie
const mixCities = [
  { id: 'ok', ownerId: 0, population: 10, manpower: 5000, q: 1, r: 1, oblegane: false },
  { id: 'bad', ownerId: 0, population: 10, manpower: 5000, q: 5, r: 5, oblegane: true },
];
const fieldOk = { id: 'fo', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', hp: 10, hpMax: 100, q: 10, r: 10 };
const mixRes = mp.tickManpowerUnitReplenishment(mixCities, [fieldOk], 'normal', () => 1, () => [], () => 100);
ok(mixRes.healedCount === 1 && fieldOk.hp === 40, 'pole poza oblezeniem: +30 HP');

// Wszystkie jednostki dostają proporcjonalny udział przy ograniczonej puli MP:
// 100 MP = połowa pełnego leczenia obu jednostek, nie leczenie tylko garnizonu.
const orderCities = [{ id: 'oc', ownerId: 0, population: 10, manpower: 100, q: 1, r: 1, oblegane: false }];
const garUnit = { id: 'g1', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', hp: 10, hpMax: 100, q: 1, r: 1, inGarnizon: true };
const fldUnit = { id: 'f1', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', hp: 10, hpMax: 100, q: 8, r: 8 };
mp.tickManpowerUnitReplenishment(orderCities, [fldUnit, garUnit], 'normal', () => 1, () => [], () => 100);
ok(garUnit.hp === 20 && fldUnit.hp === 20, 'niedobor MP: obie jednostki lecza sie proporcjonalnie po 10 HP');
ok(orderCities[0].manpower === 0, 'niedobor MP: wydano cala pule 100 MP bez priorytetu kolejności');

// Przy pełnej puli wszystkie jednostki dostają pełny limit w tej samej turze.
const allAtOnceCities = [{ id: 'aa', ownerId: 0, population: 10, manpower: 200, q: 1, r: 1, oblegane: false }];
const allAtOnceA = { id: 'aa1', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', hp: 10, hpMax: 100, q: 8, r: 8 };
const allAtOnceB = { id: 'aa2', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', hp: 40, hpMax: 100, q: 9, r: 9 };
const allAtOnceRes = mp.tickManpowerUnitReplenishment(
  allAtOnceCities,
  [allAtOnceA, allAtOnceB],
  'normal',
  () => 1,
  () => [],
  () => 100,
);
ok(allAtOnceRes.healedCount === 2 && allAtOnceA.hp === 30 && allAtOnceB.hp === 60,
  'pełna pula: wszystkie uszkodzone jednostki dostają +20% maxHP w jednej turze');
ok(allAtOnceCities[0].manpower === 0, 'pełna pula: koszt obu równych limitów leczenia pobrany z MP');

// Integracja kopia -> żywa jednostka: callback musi zapisać wynik do runtime.
const copiedUnit = { id: 'copy1', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', hp: 10, hpMax: 100, q: 8, r: 8 };
const liveUnit = { id: 'copy1', hp: 10, hpMax: 100 };
mp.tickManpowerUnitReplenishment(
  [{ id: 'cp', ownerId: 0, population: 10, manpower: 100, q: 0, r: 0, oblegane: false }],
  [copiedUnit],
  'normal',
  () => 1,
  () => [],
  () => 100,
  undefined,
  (id, hp, hpMax) => {
    if (id === liveUnit.id) {
      liveUnit.hp = hp;
      liveUnit.hpMax = hpMax;
    }
  },
);
ok(liveUnit.hp === 30 && liveUnit.hpMax === 100, 'callback integracji zapisuje HP do żywej jednostki');

// Zwiadowca pomijany (koszt MP = 0)
const scoutCities = [{ id: 'sc', ownerId: 0, population: 10, manpower: 5000, q: 0, r: 0, oblegane: false }];
const scoutUnit = { id: 'zs', ownerId: 0, typeId: 'Zwiadowca', category: 'zwiadowca', hp: 5, hpMax: 20, q: 2, r: 2 };
const scoutRes = mp.tickManpowerUnitReplenishment(scoutCities, [scoutUnit], 'normal', () => 1, () => [], () => 20);
ok(scoutRes.healedCount === 0 && scoutUnit.hp === 5, 'zwiadowca: brak leczenia z puli MP');

console.log(`[manpower-test] ${pass} OK, ${fail} FAIL`);

process.exit(fail > 0 ? 1 : 0);

