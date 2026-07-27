'use strict';
/**
 * army-hunger-combat-test.cjs — regresja osłabienia statów bojowych przy głodzie wojska (PYTANIE-85).
 * Głodna armia: 75% meleeAttack, meleeDefence, weaponDamage, piercing, chargeBonus, health,
 * missileAttack; armor bez zmian; Prog dezercji × (2 − mult) = wcześniejsza dezercja.
 * Run: node tools/army-hunger-combat-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.army-hunger-combat-entry.ts');
const BUNDLE = path.resolve(__dirname, '.army-hunger-combat-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { applyArmyHungerStatMultToCombatUnit } from '../src/game/army-starvation';
export { buildEmpireFoodParams, isArmyHungry, isArmyStarving, advanceEmpireFood, freshEmpireFoodState, bindEmpireFoodRuntime, clearLastEmpireFoodTicks } from '../src/game/empire-food';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});

const M = require(BUNDLE);
let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}
function near(a, b, eps = 0.001) { return Math.abs(a - b) < eps; }

const baseCu = {
  meleeAttack: 40,
  meleeDefence: 30,
  weaponDamage: 20,
  piercing: 5,
  chargeBonus: 10,
  health: 100,
  missileAttack: 0,
  armor: 15,
  'Prog dezercji (% health)': 0.4,
  rola: 'piechota',
  counterTyp: 'piechota',
};

const mult = 0.75;
const out = M.applyArmyHungerStatMultToCombatUnit(baseCu, mult);

ok(near(out.meleeAttack, 30), 'meleeAttack × 0.75');
ok(near(out.meleeDefence, 22.5), 'meleeDefence × 0.75');
ok(near(out.weaponDamage, 15), 'weaponDamage × 0.75');
ok(near(out.piercing, 3.75), 'piercing × 0.75');
ok(near(out.chargeBonus, 7.5), 'chargeBonus × 0.75');
ok(near(out.health, 75), 'health × 0.75');
ok(near(out.missileAttack, 0), 'missileAttack × 0.75');
ok(out.armor === 15, 'armor unchanged');
ok(near(out['Prog dezercji (% health)'], 0.5), 'Prog dezercji × (2−0.75)=1.25 → 0.5');

const noop = M.applyArmyHungerStatMultToCombatUnit(baseCu, 1);
ok(noop.meleeAttack === baseCu.meleeAttack, 'mult=1 → no change');

const params = M.buildEmpireFoodParams({
  ekonomia_miasta: { glod_wojska_stat_mult: { normal: 0.75 } },
});
ok(params.glodWojskaStatMult === 0.75, 'buildEmpireFoodParams: glodWojskaStatMult');

M.clearLastEmpireFoodTicks();
const states = new Map([[0, M.freshEmpireFoodState()]]);
states.get(0).zapasyPanstwa = -10;
M.bindEmpireFoodRuntime(states);
const econ = {
  perCity: [{
    ownerId: 0, cityId: 'c0', oblegany: false,
    zywnoscBrutto: 0, kosztRacji: 50, bilansLokalny: -50,
    zywnoscNetto: -50,
  }],
};
const upkeep = { jednostkaUtrzymanieStd: 1, jednostkaUtrzymanieSpec: 2, zywnoscJednostkaRuch: 1, zywnoscJednostkaOboz: 1 };
const efParams = M.buildEmpireFoodParams({ ekonomia_miasta: { glod_wojska_karencja_tur: { normal: 3 } } });
M.advanceEmpireFood(econ, [{ ownerId: 0, typeId: 'woj', category: 'wojskowa' }], states, upkeep, efParams);
ok(M.isArmyHungry(0) === true, 'isArmyHungry true when zapasyPo < 0');
ok(M.isArmyStarving(0) === false, 'isArmyHungry ≠ isArmyStarving (karencja)');

console.log(`army-hunger-combat-test: ${passed} pass, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
