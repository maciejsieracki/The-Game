'use strict';
/**
 * auto-battle-loss-audit-test.cjs — bounded proof for R-AUTO-BATTLE-LOSS-Q1.
 * Run from gra/: node tools/auto-battle-loss-audit-test.cjs
 *
 * AUTO_BATTLE_AUDIT_SRC_DIR may point at a clean source tree. The bundle is
 * written to a unique temp dir so the source worktree remains untouched.
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');

const SOURCE_DIR = path.resolve(
  process.env.AUTO_BATTLE_AUDIT_SRC_DIR || path.join(__dirname, '..', 'src'),
);
const GRA_ROOT = path.resolve(
  process.env.AUTO_BATTLE_AUDIT_GRA_ROOT || path.join(SOURCE_DIR, '..'),
);
const SIMULATOR = path.join(GRA_ROOT, 'tools', 'auto-battle-power.py');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-auto-battle-loss-audit-'));
const ENTRY = path.join(tempDir, 'entry.ts');
const BUNDLE = path.join(tempDir, 'bundle.cjs');

const sourceModule = rel => JSON.stringify(path.join(SOURCE_DIR, rel));
fs.writeFileSync(
  ENTRY,
  `
import {
  applyLossPctToRoster,
  resolveAutoBattleByPower,
  isFieldBattleUnit,
} from ${sourceModule('game/auto-battle-power')};
import { applyPostBattleMap } from ${sourceModule('game/post-battle-map')};
import { armyFieldPower, fieldPower } from ${sourceModule('game/unit-power')};
import { applyDifficultyCombatToUnitDef } from ${sourceModule('game/ai-difficulty-bonus')};
export {
  applyLossPctToRoster,
  resolveAutoBattleByPower,
  isFieldBattleUnit,
  applyPostBattleMap,
  armyFieldPower,
  fieldPower,
  applyDifficultyCombatToUnitDef,
};
`,
);

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (error) {
  console.error('bundle failed:', error.message || error);
  fs.rmSync(tempDir, { recursive: true, force: true });
  process.exit(1);
}

const {
  applyLossPctToRoster,
  resolveAutoBattleByPower,
  isFieldBattleUnit,
  applyPostBattleMap,
  armyFieldPower,
  fieldPower,
  applyDifficultyCombatToUnitDef,
} = require(BUNDLE);

let pass = 0;
let fail = 0;

function assert(condition, message) {
  if (condition) pass++;
  else {
    fail++;
    console.error('FAIL:', message);
  }
}

function approx(actual, expected, epsilon = 1e-9) {
  return Math.abs(actual - expected) <= epsilon;
}

// --- fieldPower cache invalidation ------------------------------------------
const baseDef = {
  meleeAttack: 7,
  meleeDefence: 7,
  weaponDamage: 7,
  piercing: 3,
  armor: 9,
  chargeBonus: 7,
  health: 38,
  missileAttack: 4,
  fieldPower: 57.5,
  'Rola (linia)': 'Wręcz',
};
const difficultyDef = applyDifficultyCombatToUnitDef(baseDef, 1.05);
const recalculatedDifficultyM = fieldPower(difficultyDef).total;
assert(
  difficultyDef.fieldPower === undefined,
  'difficulty scaling invalidates the precomputed fieldPower cache',
);
assert(
  approx(armyFieldPower(difficultyDef), recalculatedDifficultyM),
  'armyFieldPower follows difficulty-scaled raw stats',
);
assert(
  recalculatedDifficultyM > baseDef.fieldPower,
  'difficulty bonus increases the recalculated field M',
);
assert(
  applyDifficultyCombatToUnitDef(baseDef, 1) === baseDef,
  'multiplier 1 preserves the original definition and cache',
);

// --- Mixed 21-unit field/non-field allocation -------------------------------
// Twelve field units (four per line) share a battle with nine non-field rows:
// three siege engines, three scouts, and three settlers. All start at 100 HP;
// the real post-battle seam must apply the 5% field loss only to the 12 targets.
const fieldRoles = ['Wręcz', 'Flanka', 'Dystans'];
const fieldDefs = fieldRoles.map(role => ({
  meleeAttack: 10,
  meleeDefence: 10,
  weaponDamage: 10,
  piercing: 0,
  armor: 0,
  chargeBonus: 0,
  health: 100,
  missileAttack: 0,
  'Rola (linia)': role,
}));
const siegeDef = {
  ...fieldDefs[0],
  meleeAttack: 0,
  meleeDefence: 0,
  weaponDamage: 0,
  wallAttack: 10,
  'Rola (linia)': 'Oblężnicza',
};
const scoutDef = { ...fieldDefs[0] };
const settlerDef = { ...fieldDefs[0] };
const mixedUnits = [];
for (let i = 0; i < 12; i++) {
  mixedUnits.push({
    id: `mixed-field-${i}`,
    ownerId: i < 6 ? 1 : 2,
    typeId: `Hastati-${i}`,
    category: 'domyslny',
    q: i < 6 ? 0 : 1,
    r: 0,
    ruchLeft: 1,
    hp: 100,
  });
}
for (let i = 0; i < 3; i++) {
  mixedUnits.push({
    id: `mixed-siege-${i}`,
    ownerId: 1,
    typeId: `Katapulta-${i}`,
    category: 'obleznicza',
    q: 0,
    r: 0,
    ruchLeft: 1,
    hp: 100,
  });
}
for (let i = 0; i < 3; i++) {
  mixedUnits.push({
    id: `mixed-scout-${i}`,
    ownerId: 2,
    typeId: 'Zwiadowca',
    category: 'zwiadowca',
    q: 1,
    r: 0,
    ruchLeft: 1,
    hp: 100,
  });
}
for (let i = 0; i < 3; i++) {
  mixedUnits.push({
    id: `mixed-settler-${i}`,
    ownerId: 2,
    typeId: 'Osadnik',
    category: 'osadnik',
    q: 1,
    r: 0,
    ruchLeft: 1,
    hp: 100,
  });
}
const mixedDefFor = u => {
  if (u.typeId.startsWith('Katapulta-')) return siegeDef;
  if (u.typeId === 'Zwiadowca') return scoutDef;
  if (u.typeId === 'Osadnik') return settlerDef;
  const index = Number(u.id.split('-').pop());
  return fieldDefs[index % fieldDefs.length];
};
const mixedAtk = mixedUnits.filter(u => u.ownerId === 1);
const mixedDef = mixedUnits.filter(u => u.ownerId === 2);
const mixedBefore = mixedUnits.reduce((sum, u) => sum + u.hp, 0);
const mixedResult = applyPostBattleMap({
  units: mixedUnits,
  map: { hexes: {} },
  cities: [],
  battleQ: 1,
  battleR: 0,
  atkAnchor: mixedAtk[0],
  atkRoster: mixedAtk,
  defRoster: mixedDef,
  atkStart: new Map(),
  winner: 'remis',
  lossAtkPct: 0.05,
  lossDefPct: 0.05,
  getDef: mixedDefFor,
  maxHpOf: () => 100,
  isPassableHex: () => true,
  isUnitAt: () => false,
});
const mixedTargetIds = mixedUnits
  .filter(u => isFieldBattleUnit(u.typeId, mixedDefFor(u)))
  .map(u => u.id);
const mixedTargetSet = new Set(mixedTargetIds);
const mixedNonTarget = mixedUnits.filter(u => !mixedTargetSet.has(u.id));
const mixedNonzero = mixedUnits.filter(u => u.hp < 100);
const mixedAfter = mixedUnits.reduce((sum, u) => sum + u.hp, 0);
const mixedLoss = mixedBefore - mixedAfter;
assert(mixedUnits.length === 21, 'mixed fixture contains all 21 roster units');
assert(mixedTargetIds.length === 12, 'mixed fixture has 12 field-loss targets');
assert(mixedNonTarget.length === 9, 'mixed fixture has nine non-field rows');
assert(mixedResult.removedIds.length === 0, 'mixed non-lethal AUTO control removes no unit');
assert(mixedNonzero.length === 12, 'only the 12 field targets receive HP loss');
assert(mixedNonTarget.every(u => u.hp === 100), 'all non-field rows keep full HP');
assert(mixedUnits.find(u => u.id === 'mixed-field-0')?.hp === 95, 'Wręcz target loses 5 HP');
assert(mixedUnits.find(u => u.id === 'mixed-field-1')?.hp === 97, 'Flanka target loses 3 HP after flooring');
assert(mixedUnits.find(u => u.id === 'mixed-field-2')?.hp === 98, 'Dystans target loses 2 HP after flooring');
assert(mixedBefore === 2100 && mixedAfter === 2060, 'mixed HP totals are 2100 -> 2060');
assert(mixedLoss === 40, 'mixed total loss counts field targets only');
assert(
  mixedLoss === mixedUnits
    .filter(u => mixedTargetSet.has(u.id))
    .reduce((sum, u) => sum + (100 - u.hp), 0),
  'mixed total loss conserves target HP differences',
);

// --- Direct weighted allocation contract ------------------------------------
const weightedRows = applyLossPctToRoster(
  [
    { id: 'weighted-front', typeId: 'Hastati', def: fieldDefs[0], hp: 100 },
    { id: 'weighted-flank', typeId: 'Konnica', def: fieldDefs[1], hp: 100 },
    { id: 'weighted-ranged', typeId: 'Lucznik', def: fieldDefs[2], hp: 100 },
  ],
  0.05,
  def => def.health,
);
assert(weightedRows.find(row => row.id === 'weighted-front')?.effLossPct === 5, 'Wręcz weight = 1.0');
assert(weightedRows.find(row => row.id === 'weighted-flank')?.effLossPct === 2.5, 'Flanka weight = 0.5');
assert(weightedRows.find(row => row.id === 'weighted-ranged')?.effLossPct === 1.3, 'Dystans weight = 0.25');
assert(
  weightedRows.reduce((sum, row) => sum + row.hpBefore - row.hpAfter, 0) === 10,
  'weighted loss conserves the per-row HP difference',
);

// --- Explicit outside-roster zero-loss control -------------------------------
const targetDef = {
  meleeAttack: 10,
  meleeDefence: 10,
  weaponDamage: 10,
  piercing: 0,
  armor: 0,
  chargeBonus: 0,
  health: 100,
  missileAttack: 0,
  'Rola (linia)': 'Wręcz',
};
const autoUnits = [
  { id: 'auto-atk-target', ownerId: 1, typeId: 'Hastati', category: 'domyslny', q: 0, r: 0, ruchLeft: 1, hp: 100 },
  { id: 'auto-atk-siege', ownerId: 1, typeId: 'Katapulta', category: 'domyslny', q: 0, r: 0, ruchLeft: 1, hp: 100 },
  { id: 'auto-atk-outside', ownerId: 1, typeId: 'Hastati', category: 'domyslny', q: 2, r: 2, ruchLeft: 1, hp: 100 },
  { id: 'auto-def-target', ownerId: 2, typeId: 'Hastati', category: 'domyslny', q: 1, r: 0, ruchLeft: 1, hp: 100 },
  { id: 'auto-def-scout', ownerId: 2, typeId: 'Zwiadowca', category: 'zwiadowca', q: 1, r: 1, ruchLeft: 1, hp: 100 },
];
const defForAuto = u => u.typeId === 'Katapulta' ? siegeDef : u.typeId === 'Zwiadowca' ? scoutDef : targetDef;
const autoBefore = autoUnits.reduce((sum, u) => sum + u.hp, 0);
const autoResult = applyPostBattleMap({
  units: autoUnits,
  map: { hexes: {} },
  cities: [],
  battleQ: 1,
  battleR: 0,
  atkAnchor: autoUnits[0],
  atkRoster: [autoUnits[0], autoUnits[1]],
  defRoster: [autoUnits[3], autoUnits[4]],
  atkStart: new Map([['auto-atk-target', { q: 0, r: 0 }]]),
  winner: 'remis',
  lossAtkPct: 0.05,
  lossDefPct: 0.05,
  getDef: defForAuto,
  maxHpOf: () => 100,
  isPassableHex: () => true,
  isUnitAt: () => false,
});
const autoAfter = autoUnits.reduce((sum, u) => sum + u.hp, 0);
const unitById = id => autoUnits.find(u => u.id === id);
assert(autoResult.removedIds.length === 0, 'non-lethal target control removes no unit');
assert(unitById('auto-atk-target')?.hp === 95, 'AUTO attacker target loses 5% HP');
assert(unitById('auto-def-target')?.hp === 95, 'AUTO defender target loses 5% HP');
assert(unitById('auto-atk-siege')?.hp === 100, 'non-target siege keeps HP');
assert(unitById('auto-def-scout')?.hp === 100, 'non-target scout keeps HP');
assert(unitById('auto-atk-outside')?.hp === 100, 'unit outside both rosters keeps HP');
assert(autoBefore - autoAfter === 10, 'AUTO total loss counts targets only');

// --- TS/Python resolver parity -----------------------------------------------
const parityPairs = [[0, 0], [100, 100], [200, 100], [100, 200], [1, 100]];
const pythonParity = spawnSync(
  'python3',
  [SIMULATOR, '--resolve-json'],
  { cwd: GRA_ROOT, input: JSON.stringify(parityPairs), encoding: 'utf8' },
);
assert(pythonParity.status === 0, 'Python simulator parity probe exits cleanly');
if (pythonParity.status === 0) {
  try {
    const pythonResults = JSON.parse(pythonParity.stdout).results;
    parityPairs.forEach(([mAtk, mDef], i) => {
      const ts = resolveAutoBattleByPower({ mAtk, mDef, rng: () => 1 });
      const py = pythonResults[i];
      assert(ts.winner === py.winner, `TS/Python winner parity for ${mAtk}/${mDef}`);
      assert(approx(ts.ratio, py.ratio, 1e-3), `TS/Python ratio parity for ${mAtk}/${mDef}`);
      assert(approx(ts.lossAtkPct, py.loss_atk_pct, 1e-4), `TS/Python attacker-loss parity for ${mAtk}/${mDef}`);
      assert(approx(ts.lossDefPct, py.loss_def_pct, 1e-4), `TS/Python defender-loss parity for ${mAtk}/${mDef}`);
    });
  } catch (error) {
    assert(false, `Python simulator output is valid JSON: ${error.message}`);
  }
}

// --- Manual/auto separation --------------------------------------------------
const manualUnits = [
  { id: 'manual-atk', ownerId: 1, typeId: 'Hastati', category: 'domyslny', q: 0, r: 0, ruchLeft: 1, hp: 100 },
  { id: 'manual-def', ownerId: 2, typeId: 'Hastati', category: 'domyslny', q: 1, r: 0, ruchLeft: 1, hp: 100 },
  { id: 'manual-removed', ownerId: 2, typeId: 'Hastati', category: 'domyslny', q: 1, r: 1, ruchLeft: 1, hp: 100 },
  { id: 'manual-outside', ownerId: 1, typeId: 'Hastati', category: 'domyslny', q: 2, r: 2, ruchLeft: 1, hp: 100 },
];
applyPostBattleMap({
  units: manualUnits,
  map: { hexes: {} },
  cities: [],
  battleQ: 1,
  battleR: 0,
  atkAnchor: manualUnits[0],
  atkRoster: [manualUnits[0]],
  defRoster: [manualUnits[1], manualUnits[2]],
  atkStart: new Map([['manual-atk', { q: 0, r: 0 }]]),
  winner: 'remis',
  lossAtkPct: 0.99,
  lossDefPct: 0.99,
  manualSurvivors: [
    { id: 'manual-atk', hp: 73 },
    { id: 'manual-def', hp: 61 },
  ],
  getDef: () => targetDef,
  maxHpOf: () => 100,
  isPassableHex: () => true,
  isUnitAt: () => false,
});
assert(manualUnits.find(u => u.id === 'manual-atk')?.hp === 73, 'manual attacker HP comes from survivors');
assert(manualUnits.find(u => u.id === 'manual-def')?.hp === 61, 'manual defender HP comes from survivors');
assert(!manualUnits.some(u => u.id === 'manual-removed'), 'manual branch removes absent survivors');
assert(manualUnits.find(u => u.id === 'manual-outside')?.hp === 100, 'manual outside unit is untouched');

console.log(JSON.stringify({
  source: SOURCE_DIR,
  mixed: {
    units: mixedUnits.length,
    targets: mixedTargetIds.length,
    nonTarget: mixedNonTarget.length,
    nonzero: mixedNonzero.length,
    dead: mixedUnits.filter(u => u.hp <= 0).length,
    hpBefore: mixedBefore,
    hpAfter: mixedAfter,
    totalLoss: mixedLoss,
  },
  targetControl: {
    autoBefore,
    autoAfter,
    nonTargetHp: {
      siege: unitById('auto-atk-siege')?.hp,
      scout: unitById('auto-def-scout')?.hp,
      outside: unitById('auto-atk-outside')?.hp,
    },
  },
  difficulty: {
    cachedM: baseDef.fieldPower,
    recalculatedM: recalculatedDifficultyM,
  },
}, null, 2));
console.log(`auto-battle-loss-audit-test: ${pass} pass, ${fail} fail`);
fs.rmSync(tempDir, { recursive: true, force: true });
process.exit(fail > 0 ? 1 : 0);
