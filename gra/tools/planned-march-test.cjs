'use strict';
/** node gra/tools/planned-march-test.cjs — A3 marsz redesign */
const esbuild = require('esbuild');
const path = require('path');

const BUNDLE = path.join(__dirname, '.planned-march-bundle.cjs');

esbuild.buildSync({
  entryPoints: [path.join(__dirname, '.planned-march-entry.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const {
  planPathTurns,
  executeMarchStep,
  shouldStopAtObstacle,
  validateAutoMarchFromSave,
  plannedMarchesFromSave,
  plannedMarchesToSave,
  truncatePathToBudget,
  truncatePathAtFogFrontier,
  applyFogToPathPlan,
  pathCost,
  serializeGame,
  deserializeGame,
} = require(BUNDLE);

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}

const map = {
  hexes: {
    '0,0': { terenBazowy: 'Rownina' },
    '1,0': { terenBazowy: 'Rownina' },
    '2,0': { terenBazowy: 'Rownina' },
    '3,0': { terenBazowy: 'Rownina' },
    '1,1': { terenBazowy: 'Gory' },
  },
};

const unit = {
  id: 'u1',
  ownerId: 0,
  q: 0,
  r: 0,
  ruch: 2,
  ruchLeft: 2,
  typeId: 'zwiadowca',
  category: 'zwiadowca',
};

const occ = new Set();

const plan = planPathTurns(unit, 3, 0, map, occ, 2, 2);
assert(plan.fullPath.length === 3, 'path 3 hexes to dest');
assert(plan.turnStops.length >= 2, 'multi-turn markers for long path');
assert(plan.segmentPath.length === 2, 'first segment uses 2 MP');

const truncated = truncatePathToBudget(plan.fullPath, 1, map);
assert(truncated.length === 1, 'truncate to 1 MP');

const step = executeMarchStep(
  unit,
  { destQ: 3, destR: 0 },
  map,
  occ,
  2,
  () => true,
  2,
);
assert(step.ok && step.movePath.length === 2, 'execute one segment');

const blockedOcc = new Set(['1,0']);
const blocked = executeMarchStep(
  unit,
  { destQ: 3, destR: 0 },
  map,
  blockedOcc,
  2,
  () => true,
  2,
);
assert(!blocked.ok || blocked.movePath.length <= 1, 'obstacle limits movement');

const attackOcc = new Set(['2,0']);
const attackStep = executeMarchStep(
  unit,
  { destQ: 2, destR: 0 },
  map,
  attackOcc,
  2,
  () => true,
  2,
);
assert(attackStep.ok && attackStep.arrived, 'occupied enemy dest reachable');

const midSegment = shouldStopAtObstacle(
  unit,
  { destQ: 2, destR: 0 },
  map,
  attackOcc,
  [{ q: 1, r: 0 }],
  1,
);
assert(!midSegment.stop, 'enemy dest hex is not mid-path obstacle');

const midBlocked = shouldStopAtObstacle(
  unit,
  { destQ: 3, destR: 0 },
  map,
  new Set(['1,0']),
  [{ q: 0, r: 0 }],
  1,
);
assert(midBlocked.stop, 'neutral occupied hex still blocks');

const units = [unit];
const saved = validateAutoMarchFromSave({ leaderId: 'u1', destQ: 3, destR: 0 }, units, 0);
assert(saved !== null, 'validate save march');

const marches = new Map([['u1', { destQ: 3, destR: 0 }]]);
const snap = plannedMarchesToSave(marches);
assert(snap.autoMarch?.leaderId === 'u1', 'serialize autoMarch');
assert(snap.plannedMarches?.u1?.destQ === 3, 'serialize plannedMarches map');

const round = plannedMarchesFromSave(snap.autoMarch, snap.plannedMarches, units, 0);
assert(round.get('u1')?.destQ === 3, 'deserialize roundtrip');

const json = serializeGame({
  wersja: 2,
  tura: 5,
  seed: 42,
  units,
  cities: [],
  explored: [],
  autoMarch: snap.autoMarch,
  plannedMarches: snap.plannedMarches,
});
const loaded = deserializeGame(json);
assert(loaded.plannedMarches?.u1?.destQ === 3, 'save JSON roundtrip');

const visible = new Set(['0,0', '1,0', '2,0']);
const fogPath = [{ q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 }];
const fogCut = truncatePathAtFogFrontier(fogPath, visible, (q, r) => q + ',' + r);
assert(fogCut.path.length === 2 && fogCut.fogLimited, 'fog frontier truncates before hidden hex');

const fogPlan = planPathTurns(unit, 3, 0, map, occ, 2, 2);
const fogApplied = applyFogToPathPlan(fogPlan, map, 2, 2, {
  fogActive: true,
  visible: new Set(['0,0', '1,0']),
  attackOnVisibleEnemy: false,
  keyOf: (q, r) => q + ',' + r,
});
// C-RUCH-Q1=B (2026-07-21): applyFogToPathPlan NIE ucina już trasy na mgle (wariant
// „optymalna trasa przez mgłę") — trasa prowadzi przez mgłę/nieodkryty teren do celu;
// egzekucja marszu zatrzymuje jednostkę na realnej blokadzie (shouldStopAtObstacle).
assert(fogApplied.fullPath.length === fogPlan.fullPath.length && !fogApplied.fogLimited,
  'applyFog: wariant B — trasa przez mgłę NIE jest ucinana');

const attackMarch = executeMarchStep(
  unit,
  { destQ: 1, destR: 0, attackUnitId: 'e1' },
  map,
  new Set(['1,0']),
  2,
  () => true,
  2,
  {
    fogActive: true,
    visible: new Set(['0,0', '1,0', '2,0']),
    attackOnVisibleEnemy: true,
    keyOf: (q, r) => q + ',' + r,
  },
);
assert(attackMarch.ok, 'attack march through fog when enemy visible');

const marchesAtk = new Map([['u1', { destQ: 3, destR: 0, attackUnitId: 'e99' }]]);
const snapAtk = plannedMarchesToSave(marchesAtk);
assert(snapAtk.plannedMarches?.u1?.attackUnitId === 'e99', 'serialize attackUnitId');

console.log('planned-march-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
