'use strict';

// RED/GREEN contract for forced-war wave assignment. The first run is expected
// to fail before forced-war-waves.ts exists; the implementation must then make
// the same scenario choose a distinct approach sector for wave 2.
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.forced-war-waves-entry.ts');
const bundle = path.resolve(__dirname, '.forced-war-waves-bundle.cjs');
fs.writeFileSync(entry, `
export { decideAITurn } from '../src/game/ai';
export { planForcedWarWave, approachSectorForHex, pruneForcedWarWaves, serializeForcedWarWaves, restoreForcedWarWaves } from '../src/game/forced-war-waves';
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
const C = require(bundle);
let passed = 0;
let failed = 0;
function ok(value, message) {
  if (value) passed++;
  else { failed++; console.error('FAIL:', message); }
}
const unit = (id, q, r, ownerId = 1) => ({ id, ownerId, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2 });
const target = { id: 'city-1', ownerId: 2, q: 20, r: 20 };
const firstWave = {
  id: 'wave-1', targetCityId: target.id, unitIds: ['a1', 'a2', 'a3'],
  originHex: { q: 2, r: 20 }, rallyPoint: { q: 3, r: 20 }, createdTurn: 1,
  approachSector: C.approachSectorForHex(target, { q: 3, r: 20 }),
};
const plan = C.planForcedWarWave(
  [unit('b1', 2, 2), unit('b2', 3, 2), unit('b3', 2, 3)],
  [target],
  [firstWave],
  new Set(),
  (a, b) => Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r)),
);
ok(plan !== null, 'wave 2 forms from a fresh local group');
ok(plan && plan.targetCityId === target.id, 'single-target war keeps the same city');
ok(plan && plan.approachSector !== firstWave.approachSector, 'wave 2 uses a different approach sector');
ok(plan && plan.rallyPoint.q !== firstWave.rallyPoint.q || plan && plan.rallyPoint.r !== firstWave.rallyPoint.r,
  'wave 2 rally point differs from wave 1');
const resolvedHistory = [{
  targetCityId: firstWave.targetCityId,
  originHex: { ...firstWave.originHex },
  rallyPoint: { ...firstWave.rallyPoint },
  approachSector: firstWave.approachSector,
  createdTurn: firstWave.createdTurn,
}];
const nextAfterResolution = C.planForcedWarWave(
  [unit('c1', 17, 17), unit('c2', 18, 17), unit('c3', 17, 18)],
  [target],
  [],
  new Set(),
  (a, b) => Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r)),
  5,
  resolvedHistory,
);
ok(nextAfterResolution !== null && nextAfterResolution.approachSector !== firstWave.approachSector,
  'a later wave keeps a different sector after wave 1 resolves');

const historicalCityA = { id: 'city-A', ownerId: 2, q: 20, r: 20 };
const historicalCityB = { id: 'city-B', ownerId: 2, q: 30, r: 30 };
const historicalTarget = [{
  targetCityId: historicalCityA.id,
  originHex: { q: 2, r: 2 },
  rallyPoint: { q: 3, r: 2 },
  approachSector: C.approachSectorForHex(historicalCityA, { q: 3, r: 2 }),
  createdTurn: 1,
}];
const historicalTargetPlan = C.planForcedWarWave(
  [unit('h1', 17, 17), unit('h2', 18, 17), unit('h3', 17, 18)],
  [historicalCityA, historicalCityB],
  [],
  new Set(),
  (a, b) => Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r)),
  6,
  historicalTarget,
);
ok(historicalTargetPlan !== null && historicalTargetPlan.targetCityId === historicalCityB.id,
  'a resolved historical target is avoided when another city is available');
const singleHistoricalTargetPlan = C.planForcedWarWave(
  [unit('s1', 17, 17), unit('s2', 18, 17), unit('s3', 17, 18)],
  [historicalCityA],
  [],
  new Set(),
  (a, b) => Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r)),
  7,
  historicalTarget,
);
ok(singleHistoricalTargetPlan !== null && singleHistoricalTargetPlan.targetCityId === historicalCityA.id,
  'a single historical target remains available through the fallback');

const map = { szerokoscQ: 40, wysokoscR: 40, seed: 1, riverPaths: [], hexes: {} };
for (let q = 0; q < 40; q++) for (let r = 0; r < 40; r++) {
  map.hexes[`${q},${r}`] = {
    coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
    wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
  };
}
const aiData = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
const activeOpts = {
  civType: 'grecy', currentTurn: 4, canEngageOwner: ownerId => ownerId === 2,
  forcedWar: {
    targetOwnerId: 2, role: 'attacker', era: 'bronze', capturedByAttacker: 0, capturedByDefender: 0,
    activeWaves: [firstWave],
  },
};
const allWaveUnits = [
  unit('a1', 2, 20), unit('a2', 3, 20), unit('a3', 2, 21),
  unit('b1', 2, 2), unit('b2', 3, 2), unit('b3', 2, 3),
  unit('b4', 10, 10), unit('enemy-1', 11, 10, 2),
];
const aiCommands = C.decideAITurn(1, allWaveUnits, [target], map, aiData, activeOpts);
ok(activeOpts.forcedWar.wavePlan && activeOpts.forcedWar.wavePlan.unitIds.every(id => id.startsWith('b')),
  'AI assigns only the newly available group to wave 2');
ok(!aiCommands.some(c => c.type === 'move' && ['b1', 'b2', 'b3'].includes(c.unitId) && c.targetCityId === target.id),
  'wave 2 units do not receive the previous wave target while they gather');
ok(aiCommands.some(c => c.type === 'attack' && c.unitId === 'b4' && c.targetUnitId === 'enemy-1'),
  'a free unit still performs a higher-priority adjacent attack while wave 1 is active');

const firstWaveOpts = {
  civType: 'grecy', currentTurn: 1, canEngageOwner: ownerId => ownerId === 2,
  forcedWar: {
    targetOwnerId: 2, role: 'attacker', era: 'bronze', capturedByAttacker: 0, capturedByDefender: 0,
    activeWaves: [],
  },
};
const firstWaveCommands = C.decideAITurn(1, [
  unit('f1', 2, 2), unit('f2', 3, 2), unit('f3', 2, 3),
  unit('f4', 15, 15), unit('f5', 16, 15), unit('f6', 15, 16),
], [target], map, aiData, firstWaveOpts);
ok(firstWaveOpts.forcedWar.wavePlan
  && new Set(firstWaveOpts.forcedWar.wavePlan.unitIds).size === 6,
  'first wave records both local concentration and front-merge assignments');
ok(firstWaveCommands.some(c => c.type === 'move' && c.unitId === 'f4'),
  'front-merge assignment still emits its existing move order');

const state = { nextWaveId: 2, waves: [firstWave], history: [] };
const roundTrip = C.restoreForcedWarWaves(C.serializeForcedWarWaves(new Map([['1_2', state]])));
ok(roundTrip.get('1_2').waves[0].targetCityId === 'city-1', 'wave state survives serialize/restore');
const kept = C.pruneForcedWarWaves(state, 1, 2, [unit('a1', 2, 20), unit('a2', 3, 20)], [target]);
ok(kept !== undefined && kept.waves[0].unitIds.length === 2, 'wave remains active while live units are still marching');
const resolved = C.pruneForcedWarWaves(state, 1, 2, [unit('a1', 19, 20), unit('a2', 20, 19), unit('a3', 20, 21)], [target]);
ok(resolved !== undefined && resolved.waves.length === 0, 'wave resolves when all surviving units are engaged at the target');
ok(resolved !== undefined && resolved.history.length === 1
  && resolved.history[0].approachSector === firstWave.approachSector,
  'resolved wave keeps its approach history for the next cycle');
const historicalRoundTrip = C.restoreForcedWarWaves(C.serializeForcedWarWaves(new Map([['1_2', resolved]])));
ok(historicalRoundTrip.get('1_2').history.length === 1, 'resolved approach history survives serialize/restore');
console.log(`forced-war-waves-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(entry); } catch {}
try { fs.unlinkSync(bundle); } catch {}
process.exit(failed === 0 ? 0 : 1);
