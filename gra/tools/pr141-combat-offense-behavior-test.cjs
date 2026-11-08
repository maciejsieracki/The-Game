'use strict';
/**
 * Bounded behavioral receipt for the ten offensive F02/F03 combat parameters.
 * Run from gra/: node tools/pr141-combat-offense-behavior-test.cjs
 * The final effect is resolveCombat HP/log output, not helper/AST inspection.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const gra = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `pr141-combat-offense-${process.pid}-`));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(entry, `
  export { resolveCombat } from ${JSON.stringify(path.join(gra, 'src/game/combat'))};
  export { civMatrixBonusyForCivKey } from ${JSON.stringify(path.join(gra, 'src/game/civ-bonuses'))};
`, 'utf8');
try {
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
} catch (error) {
  console.error('esbuild failed:', error.message || error);
  process.exitCode = 1;
} 
if (process.exitCode) {
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(process.exitCode);
}
const { resolveCombat, civMatrixBonusyForCivKey } = require(bundle);
const matrix = JSON.parse(fs.readFileSync(path.join(gra, 'data/civ-matrix.json'), 'utf8'));
const specs = [
  { id: 'walka_atak_kawaleria', civ: 'inkowie', unit: ['Konnica', 'Konnica', 'Flanka'] },
  { id: 'walka_atak_rydwany', civ: 'hetyci', unit: ['Rydwan', 'Rydwan', 'Flanka'] },
  { id: 'walka_atak_obleczenie', civ: 'asyria', unit: ['Taran', 'Siege', 'Obleznicza'] },
  { id: 'walka_atak_morska', civ: 'grecy', unit: ['Galera', 'Naval', 'Morska'] },
  { id: 'walka_uderzenie_piechota', civ: 'celtowie', unit: ['Miecznik', 'Miecznik', 'Wrecz'], impact: true },
  { id: 'walka_uderzenie_kawaleria', civ: 'asyria', unit: ['Konnica', 'Konnica', 'Flanka'], impact: true },
  { id: 'walka_dystans_rydwany', civ: 'egipt', unit: ['Rydwan', 'Rydwan', 'Dystans'], ranged: true },
  { id: 'walka_atak_piechota_teren_las', civ: 'germanie', unit: ['Miecznik', 'Miecznik', 'Wrecz'], terrain: 'las' },
  { id: 'walka_atak_piechota_runda_szarzy', civ: 'germanie', unit: ['Miecznik', 'Miecznik', 'Wrecz'], charge: true },
  { id: 'walka_atak_piechota_teren_plytkie_morze', civ: 'grecy', unit: ['Miecznik', 'Miecznik', 'Wrecz'], shallowSea: true },
];
const FIXED_SEEDS = {
  walka_atak_kawaleria: 0.571,
  walka_atak_rydwany: 0.6,
  walka_atak_obleczenie: 0.6,
  walka_atak_morska: 0.6,
  walka_uderzenie_piechota: 0,
  walka_uderzenie_kawaleria: 0,
  walka_dystans_rydwany: 0,
  walka_atak_piechota_teren_las: 0.6,
  walka_atak_piechota_runda_szarzy: 0.6,
  walka_atak_piechota_teren_plytkie_morze: 0.6,
};

let passed = 0;
let failed = 0;
function assert(ok, message) {
  if (ok) passed++;
  else { failed++; console.error('FAIL:', message); }
}
function near(a, b) { return Math.abs(a - b) < 1e-10; }
function unit([typNazwa, counterTyp, rola], missileAttack = 0) {
  return {
    typNazwa, counterTyp, rola,
    meleeAttack: 20, meleeDefence: 8, weaponDamage: 10, armor: 0,
    piercing: 2, chargeBonus: 8, health: 1000,
    'Prog dezercji (% health)': null,
    missileAttack, 'Zasieg ataku (hex)': missileAttack > 0 ? 3 : null, 'Ilosc pociskow': missileAttack > 0 ? 1 : null,
    'Ruch w bitwie (heksy)': 2,
    'Kara obrony z flanki (%)': 50, 'Kara obrony z tylu (%)': 80,
  };
}
function opponent() {
  return {
    typNazwa: 'Pikinier', counterTyp: 'Pikinier', rola: 'Wrecz',
    meleeAttack: 4, meleeDefence: 8, weaponDamage: 2, armor: 0,
    piercing: 0, chargeBonus: 0, health: 1000,
    'Prog dezercji (% health)': null,
    missileAttack: 0, 'Zasieg ataku (hex)': null, 'Ilosc pociskow': null,
    'Ruch w bitwie (heksy)': 2,
    'Kara obrony z flanki (%)': 50, 'Kara obrony z tylu (%)': 80,
  };
}
function bonusesFor(spec) {
  const row = matrix.cywilizacje.find(c => c.ikonaId === spec.civ);
  const expected = row?.params?.[spec.id];
  const adapted = civMatrixBonusyForCivKey(spec.civ);
  const actual = adapted.find(b => b.matrixParamId === spec.id);
  assert(typeof expected === 'number' && expected !== 0, `${spec.id}: fixture owner has nonzero matrix cell`);
  assert(actual && near(actual.wartosc, expected), `${spec.id}: F02/F03 adapter produces the owner matrix value`);
  return actual ? [actual] : [];
}
function combat(spec, bonusy, seed, targetUnit = spec.unit, context = {}) {
  const attacker = unit(targetUnit, spec.ranged ? 18 : 0);
  const defender = opponent();
  // Fixed terrain, side, owner, and RNG for paired runs; a one-round cap makes
  // the first observable final-HP delta attributable to this one field.
  const opts = {
    attackerCivBonusy: bonusy,
    attackerMoved: true,
    maxRounds: 1,
    defenderTerrain: context.terrain ?? spec.terrain ?? '',
    shallowSea: context.shallowSea ?? spec.shallowSea ?? false,
    attackerAmmo: spec.ranged ? 1 : 0,
    defenderAmmo: 0,
    rng: () => seed,
  };
  return resolveCombat(attacker, defender, opts);
}

console.log('--- adapter → resolveCombat final HP, paired one-field control ---');
for (const spec of specs) {
  const [bonus] = bonusesFor(spec);
  if (!bonus) continue;
  const seed = FIXED_SEEDS[spec.id];
  const base = combat(spec, [], seed);
  const changed = combat(spec, [bonus], seed);
  const effect = changed.defenderHpLeft !== base.defenderHpLeft
    || changed.attackerHpLeft !== base.attackerHpLeft;
  assert(effect, `${spec.id}: native owner adapter changes final resolveCombat HP (seed=${seed})`);

  const wrongUnit = spec.unit[2] === 'Flanka' || spec.unit[2] === 'Dystans'
    ? ['Miecznik', 'Miecznik', 'Wrecz']
    : ['Konnica', 'Konnica', 'Flanka'];
  const wrong = combat(spec, [bonus], seed, wrongUnit);
  const wrongBase = combat(spec, [], seed, wrongUnit);
  assert(wrong.defenderHpLeft === wrongBase.defenderHpLeft && wrong.attackerHpLeft === wrongBase.attackerHpLeft,
    `${spec.id}: wrong combat category/context has no final HP effect`);

  const wrongTerrain = spec.terrain ? combat(spec, [bonus], seed, spec.unit, { terrain: 'row' }) : null;
  if (spec.terrain) {
    const wrongTerrainBase = combat(spec, [], seed, spec.unit, { terrain: 'row' });
    assert(wrongTerrain.defenderHpLeft === wrongTerrainBase.defenderHpLeft,
      `${spec.id}: non-forest context suppresses the matrix effect`);
  }
  const wrongShallow = spec.shallowSea ? combat(spec, [bonus], seed, spec.unit, { shallowSea: false }) : null;
  if (spec.shallowSea) {
    const wrongShallowBase = combat(spec, [], seed, spec.unit, { shallowSea: false });
    assert(wrongShallow.defenderHpLeft === wrongShallowBase.defenderHpLeft,
      `${spec.id}: non-shallow-sea context suppresses the matrix effect`);
  }
  // resolveCombat derives the charge round from melee round 1; it has no test
  // override. A bracing spear is used as the true negative control below.
  if (spec.charge || spec.impact) {
    const bracer = { ...opponent(), counterTyp: 'Spearman', typNazwa: 'Wlocznik' };
    const withBrace = resolveCombat(unit(spec.unit), bracer, {
      attackerCivBonusy: [bonus], attackerMoved: true, maxRounds: 1, rng: () => seed,
    });
    const braceBase = resolveCombat(unit(spec.unit), bracer, {
      attackerCivBonusy: [], attackerMoved: true, maxRounds: 1, rng: () => seed,
    });
    assert(withBrace.defenderHpLeft === braceBase.defenderHpLeft,
      `${spec.id}: bracing defender negates first-round charge and its matrix bonus`);
  }
  // A bonus supplied to the other owner must not change this attacker's damage.
  const foreign = civMatrixBonusyForCivKey('rzymianie').filter(b => b.matrixParamId === spec.id);
  assert(foreign.length === 0, `${spec.id}: Roman adapter has no foreign-owner value`);
  const foreignRun = combat(spec, foreign, seed);
  assert(foreignRun.defenderHpLeft === base.defenderHpLeft,
    `${spec.id}: wrong-owner adapter leaves attacker's final damage unchanged`);
  const sideRun = resolveCombat(unit(spec.unit, spec.ranged ? 18 : 0), opponent(), {
    defenderCivBonusy: [bonus], attackerMoved: true, maxRounds: 1,
    defenderTerrain: spec.terrain ?? '', shallowSea: spec.shallowSea ?? false,
    attackerAmmo: spec.ranged ? 1 : 0, defenderAmmo: 0, rng: () => seed,
  });
  assert(sideRun.defenderHpLeft === base.defenderHpLeft,
    `${spec.id}: defender-side ownership does not alter damage dealt by the attacker`);
  console.log(`${spec.id}: native=${bonus.wartosc}; baselineDefHP=${base.defenderHpLeft}; adaptedDefHP=${changed.defenderHpLeft}; wrongTypeDefHP=${wrong.defenderHpLeft}; seed=${seed}`);
}

console.log(`ASSERTIONS: ${passed} passed, ${failed} failed`);
fs.rmSync(tmp, { recursive: true, force: true });
if (failed > 0) process.exit(1);
