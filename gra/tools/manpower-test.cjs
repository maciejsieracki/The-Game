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
  cityLudnoscAbsolutna,
  cityManpowerMax,
  spendManpower,
  formatPopulationAbs,
  tryDeductUnitSpawnCosts,
  tickManpowerRegen,
  manpowerRegenGain,
  loadManpowerRegenParams,
  civManpowerRegenMult,
  empirePoborTotals,
} from '../src/game/manpower';

module.exports = {
  cityManpowerSnapshot,
  unitManpowerCost,
  cityLudnoscAbsolutna,
  cityManpowerMax,
  spendManpower,
  formatPopulationAbs,
  tryDeductUnitSpawnCosts,
  tickManpowerRegen,
  manpowerRegenGain,
  civManpowerRegenMult,
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
ok(mp.unitManpowerCost(1) === 100, 'ep1 koszt jednostki 100');

const s1 = mp.cityManpowerSnapshot(city10, 1);
ok(s1.ludnoscAbsolutna === 100_000 && s1.manpowerMax === 10_000, 'snapshot ep1');
ok(s1.werbMaxPrzyPelnejPuli === 100, '100 jednostek przy pelnej puli ep1');

// Epoka 10
ok(mp.cityLudnoscAbsolutna(10, 10) === 48_000_000, 'ep10 ludnosc 48M');
ok(mp.unitManpowerCost(10) === 48_000, 'ep10 koszt jednostki 48k');

// 10% łańcuch: jednostka = 10% manpower slotu
ok(mp.unitManpowerCost(3) === 400, 'ep3 jednostka 400 (=10% of 4000)');

// spend
const after = mp.spendManpower({ population: 10, manpower: 10_000 }, 1);
ok(after === 9_900, 'spend 100 z 10k');

const block = mp.tryDeductUnitSpawnCosts({ population: 10, manpower: 50 }, 1);
ok(!block.ok && block.reason === 'brak_manpower', 'blokada przy 50 MP');

const okDed = mp.tryDeductUnitSpawnCosts({ population: 10, manpower: 10_000 }, 1);
ok(okDed.ok && okDed.manpower === 9_900 && okDed.population === 9, 'deduct pop+mp');

ok(mp.formatPopulationAbs(1_200_000).includes('mln'), 'format mln');

ok(mp.manpowerRegenGain(10, 1, { regenProcMaxPerTurn: 10, blockWhenBesieged: true }) === 1000, 'regen 10% max');
const afterRegen = mp.tickManpowerRegen({ population: 10, manpower: 0, oblegane: false }, 1, { regenProcMaxPerTurn: 10, blockWhenBesieged: true });
ok(afterRegen === 1000, 'tick 0→1000');
const siegeBlock = mp.tickManpowerRegen({ population: 10, manpower: 500, oblegane: true }, 1, { regenProcMaxPerTurn: 10, blockWhenBesieged: true });
ok(siegeBlock === 500, 'oblezenie blokuje regen');

ok(mp.civManpowerRegenMult([]) === 1, 'regen mult domyslny 1');
ok(Math.abs(mp.civManpowerRegenMult([{ typ: 'bonus_pobor_regen', wartosc: 0.35 }]) - 1.35) < 0.001, 'rzym +35%');
ok(Math.abs(mp.civManpowerRegenMult([{ typ: 'bonus_pobor_regen', wartosc: -0.15 }]) - 0.85) < 0.001, 'grecy -15%');
ok(mp.manpowerRegenGain(10, 1, { regenProcMaxPerTurn: 10, blockWhenBesieged: true }, 1.35) === 1350, 'regen rzym 13.5%');

const cities = [
  { ownerId: 0, population: 10, manpower: 8000 },
  { ownerId: 0, population: 5, manpower: 4000 },
];
const emp = mp.empirePoborTotals(cities, 0, 1);
ok(emp.ludnoscAbsolutna === 150_000, 'empire ludnosc 150k');
ok(emp.rekruci === 12_000, 'empire rekruci 12k');
ok(emp.poborRaw === 162_000, 'pobor raw sum');

console.log(`[manpower-test] ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
