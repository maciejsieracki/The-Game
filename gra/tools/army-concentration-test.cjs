'use strict';

/* Independent contract + mutation tests for R-ARMIA-KONCENTRACJA-AI-BARB-Q1. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.army-concentration-entry.ts');
const bundle = path.resolve(__dirname, '.army-concentration-bundle.cjs');
fs.writeFileSync(entry, `
export {
  ARMY_CONCENTRATION_MIN_UNITS, ARMY_CONCENTRATION_RADIUS,
  isEligibleForArmyConcentration, planArmyConcentration,
} from '../src/game/army-concentration';
export { decideAITurn } from '../src/game/ai';
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
const C = require(bundle);
let passed = 0;
let failed = 0;
function ok(value, message) { if (value) passed++; else { failed++; console.error('FAIL:', message); } }
function unit(id, q, r, extra = {}) {
  return { id, ownerId: 1, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2, ...extra };
}

ok(C.ARMY_CONCENTRATION_MIN_UNITS === 3, 'contract: minimum is exactly 3');
ok(C.ARMY_CONCENTRATION_RADIUS === 4, 'contract: radius is exactly 4');

// Contract: 3 within radius 4 qualifies; 3 just outside do not.
const near = [unit('a', 0, 0), unit('b', 4, 0), unit('c', 0, 4)];
const nearPlan = C.planArmyConcentration(1, near);
ok(nearPlan !== null, '3 qualifying units within radius 4 start concentration');
ok(nearPlan && nearPlan.unitIds.length === 3, 'plan uses the actual three-unit roster');
const outside = [unit('a', 0, 0), unit('b', 5, 0), unit('c', 0, 5)];
ok(C.planArmyConcentration(1, outside) === null, '3 units outside radius 4 do not qualify');

// Contract exclusions: civilian, garrison, embarked, besieged, naval raider,
// and native naval combat units never count toward the threshold.
for (const [label, extra] of [
  ['scout', { typeId: 'Zwiadowca', category: 'zwiadowca' }],
  ['civilian', { typeId: 'Osadnik', category: 'osadnik' }],
  ['garrison', { inGarnizon: true }],
  ['embarked', { embarked: true }],
  ['besieged', { oblegaCityId: 'city-1' }],
  ['sea raider', { seaRaider: true }],
  ['native naval', { category: 'galera' }],
]) {
  const candidate = unit('x', 0, 0, extra);
  ok(!C.isEligibleForArmyConcentration(candidate, 1), 'exclusion: ' + label);
  ok(C.planArmyConcentration(1, [candidate, unit('b', 1, 0), unit('c', 0, 1)]) === null,
    'exclusion: ' + label + ' cannot satisfy threshold');
}

// Mutation guard: a unit with no movement is not an active rally candidate;
// changing `ruchLeft > 0` to `>= 0` would fail this assertion.
const exhausted = [unit('a', 0, 0, { ruchLeft: 0 }), unit('b', 1, 0), unit('c', 0, 1)];
ok(C.planArmyConcentration(1, exhausted) === null, 'mutation guard: exhausted unit excluded');

// Determinism and actual-stack gate: the winning point is stable, and a
// physically gathered roster emits no rally movement/deferment.
const tie = [unit('z', 0, 0), unit('a', 1, 0), unit('m', 0, 1)];
const tiePlan = C.planArmyConcentration(1, tie);
ok(tiePlan && tiePlan.rallyPoint.q === 0 && tiePlan.rallyPoint.r === 0,
  'deterministic tie-break chooses lowest q/r anchor');
ok(tiePlan && tiePlan.deferredUnitIds.length === 3, 'spread roster is deferred until physical stack');
const gathered = [unit('a', 2, 2), unit('b', 2, 2), unit('c', 2, 2)];
const gatheredPlan = C.planArmyConcentration(1, gathered);
ok(gatheredPlan && gatheredPlan.moveUnitIds.length === 0, 'physical stack needs no rally move');
ok(gatheredPlan && gatheredPlan.deferredUnitIds.length === 0, 'physical stack is allowed to continue');

// Owner isolation: another owner never joins the roster.
const foreign = unit('foreign', 1, 0, { ownerId: 2 });
ok(C.planArmyConcentration(1, [unit('a', 0, 0), unit('b', 1, 0), foreign]) === null,
  'owner-agnostic planner does not mix owners');

// Integration contract: the real AI planner emits only pathfinding moves for
// the dispersed group and does not emit an attack/ordinary march for those
// units in the same decision pass. This catches a mutation that wires the
// pure planner but forgets the AI turn gate.
function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak',
      ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}
const aiUnits = [unit('ai-a', 1, 1), unit('ai-b', 5, 1), unit('ai-c', 1, 5)];
const aiCommands = C.decideAITurn(
  1, aiUnits, [], makeMap(8, 8),
  { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} },
  { civType: 'grecy' },
);
const aiMoveIds = new Set(aiCommands.filter(c => c.type === 'move').map(c => c.unitId));
ok(aiMoveIds.has('ai-b') && aiMoveIds.has('ai-c') && !aiMoveIds.has('ai-a'),
  'integration: dispersed units move toward one deterministic rally point');
ok(aiCommands.filter(c => c.type === 'attack').length === 0,
  'integration: deferred concentration units do not attack before physical stack');

console.log(`army-concentration-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(entry); } catch {}
try { fs.unlinkSync(bundle); } catch {}
process.exit(failed === 0 ? 0 : 1);
