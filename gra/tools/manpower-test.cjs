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

  tickManpowerRegen,

  manpowerRegenGain,

  loadManpowerRegenParams,

  civManpowerRegenMult,

  civManpowerMaxMult,

  civManpowerMults,

  empirePoborTotals,

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

  tickManpowerRegen,

  manpowerRegenGain,

  civManpowerRegenMult,

  civManpowerMaxMult,

  civManpowerMults,

  empirePoborTotals,

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

ok(mp.unitManpowerCost(1) === 1000, 'ep1 koszt jednostki 1000');



const s1 = mp.cityManpowerSnapshot(city10, 1);

ok(s1.ludnoscAbsolutna === 100_000 && s1.manpowerMax === 10_000, 'snapshot ep1');

ok(s1.werbMaxPrzyPelnejPuli === 10, '10 jednostek przy pelnej puli ep1 (1 ludek = 1 jednostka)');



// Epoka 10

ok(mp.cityLudnoscAbsolutna(10, 10) === 48_000_000, 'ep10 ludnosc 48M');

ok(mp.unitManpowerCost(10) === 480_000, 'ep10 koszt jednostki 480k');



// Koszt jednostki = pełny slot manpower (1 ludek = 1 jednostka przy pełnej puli)

ok(mp.unitManpowerCost(3) === 4000, 'ep3 jednostka 4000 (= manpowerNaLudka)');



// spend

const after = mp.spendManpower({ population: 10, manpower: 10_000 }, 1);

ok(after === 9_000, 'spend 1000 z 10k');



const block = mp.tryDeductUnitSpawnCosts({ population: 10, manpower: 50 }, 1);

ok(!block.ok && block.reason === 'brak_manpower', 'blokada przy 50 MP');



const okDed = mp.tryDeductUnitSpawnCosts({ population: 10, manpower: 10_000 }, 1);

ok(okDed.ok && okDed.manpower === 9_000 && okDed.population === 9, 'deduct pop+mp');



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

ok(mp.unitManpowerCost(1, 2) === 2000, 'ep1 roman koszt jednostki 2000');

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

ok(mp.spendManpower(cityRecruit, 1) === 9_000, 'enqueue rekrutacji: spendManpower od razu');

// Zwiadowca (Scout): 0 MP przy rekrutacji
ok(mp.isScoutTypeId('Zwiadowca'), 'scout typeId rozpoznany');
ok(mp.unitManpowerCostForType('Zwiadowca', 1) === 0, 'zwiadowca koszt MP 0 ep1');
ok(mp.unitManpowerCostForType('Zwiadowca', 1, 2) === 0, 'zwiadowca koszt MP 0 ep1 roman');
ok(mp.unitManpowerCostForType('Wojownik', 1) === 1000, 'wojownik koszt MP bez zmian');
const scoutDed = mp.tryDeductUnitSpawnCosts({ population: 10, manpower: 50 }, 1, 0, 1, 'Zwiadowca');
ok(scoutDed.ok && scoutDed.kosztManpower === 0 && scoutDed.manpower === 50, 'zwiadowca: brak MP nawet przy pustej puli');
const scoutDed2 = mp.tryDeductUnitSpawnCosts({ population: 10, manpower: 10_000 }, 1, 0, 1, 'Zwiadowca');
ok(scoutDed2.ok && scoutDed2.manpower === 10_000, 'zwiadowca: pula MP bez zmian po rekrutacji');

console.log(`[manpower-test] ${pass} OK, ${fail} FAIL`);

process.exit(fail > 0 ? 1 : 0);

