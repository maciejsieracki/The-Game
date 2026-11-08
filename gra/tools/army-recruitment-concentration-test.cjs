'use strict';

/* Focused AI-only recruitment/army-stack contract test. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.army-recruitment-concentration-entry.ts');
const bundle = path.resolve(__dirname, '.army-recruitment-concentration-bundle.cjs');
const mainSourcePath = process.env.ARMY_RECRUITMENT_MAIN_SOURCE
  || path.resolve(__dirname, '..', 'src', 'main.ts');

let cleaned = false;
function cleanup() {
  if (cleaned) return;
  cleaned = true;
  try { fs.unlinkSync(entry); } catch {}
  try { fs.unlinkSync(bundle); } catch {}
}
process.on('exit', cleanup);

let passed = 0;
let failed = 0;
function ok(value, message) {
  if (value) passed++;
  else {
    failed++;
    console.error('FAIL:', message);
  }
}
function unit(id, q, r, extra = {}) {
  return {
    id,
    ownerId: 7,
    typeId: 'Wojownik',
    category: 'miecznik',
    q,
    r,
    ruch: 2,
    ruchLeft: 2,
    ...extra,
  };
}
function stableRuntimeState(u) {
  return JSON.stringify({
    id: u.id,
    ownerId: u.ownerId,
    typeId: u.typeId,
    category: u.category,
    q: u.q,
    r: u.r,
    ruch: u.ruch,
    ruchLeft: u.ruchLeft,
    power: u.power,
    cost: u.cost,
  });
}

fs.writeFileSync(entry, `
export {
  findAiRecruitmentMergeStack,
  mergeCompletedAiRecruitment,
  isEligibleForArmyConcentration,
} from '../src/game/army-concentration';
export { stackGroupIdOf } from '../src/game/armyMerge';
export { HUMAN_OWNER_PRIMARY, isAiOwner } from '../src/game/human-owners';
`);
esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: bundle,
  logLevel: 'silent',
});
const C = require(bundle);

// The completion hook sits after the real units.push() and uses the canonical
// human-seat classifier at the one advanceRecruitmentGated completion site.
const mainSource = fs.readFileSync(mainSourcePath, 'utf8');
const completionStart = mainSource.indexOf('const recResult = advanceRecruitmentGated(');
const completionEnd = completionStart >= 0
  ? mainSource.indexOf('maybeHintArmyFoodOnFirstPlayerUnit', completionStart)
  : -1;
const completionBlock = completionStart >= 0 && completionEnd > completionStart
  ? mainSource.slice(completionStart, completionEnd)
  : '';
ok(mainSource.includes("import { mergeCompletedAiRecruitment } from './game/army-concentration';"),
  'call-site contract: main.ts imports the recruitment completion hook');
ok(completionBlock.includes('for (const rec of recResult.completed)'),
  'call-site contract: hook is inside the completed recruitment loop');
const hookCall = /mergeCompletedAiRecruitment\(\s*city\.ownerId[\s\S]*?ownerId => ownerId > 0 && isAiOwner\(humanSeats, ownerId\)/;
ok(hookCall.test(completionBlock),
  'call-site contract: completed recruit uses canonical AI owner classification');
ok(completionBlock.indexOf('units.push({') < completionBlock.search(/mergeCompletedAiRecruitment\(/),
  'call-site contract: merge runs after the completed unit is inserted into live units');
ok(!completionBlock.includes('city.ownerId !== 0'),
  'call-site contract: no nonzero-owner gate can merge a hot-seat human');

const humanSeats = {
  humanOwnerIds: [C.HUMAN_OWNER_PRIMARY, 9],
  activeHumanOwnerId: C.HUMAN_OWNER_PRIMARY,
};
const classifyAi = ownerId => ownerId > 0 && C.isAiOwner(humanSeats, ownerId);
ok(C.isAiOwner(humanSeats, 7) === true, 'canonical classifier accepts a non-human positive owner');
ok(C.isAiOwner(humanSeats, 9) === false, 'canonical classifier rejects the second human seat');

// A completed AI recruit is colocated with two active AI field units. Human
// seats, another AI owner, civilians, a garrison and a naval unit share the
// hex but are not compatible candidates; one same-owner unit is off-hex.
const aiA = unit('ai-a', 4, 4, { power: 22, cost: 15, stackGroupId: 'old-a' });
const aiB = unit('ai-b', 4, 4, { power: 31, cost: 19, stackGroupId: 'old-b' });
const recruited = unit('rec-ai', 4, 4, { typeId: 'Hoplita', power: 44, cost: 27 });
const remoteAi = unit('ai-remote', 4, 5, { power: 12, cost: 8, stackGroupId: 'remote-old' });
const humanPrimary = unit('human-primary', 4, 4, { ownerId: 0, power: 99, cost: 5, stackGroupId: 'human-old' });
const humanSeat = unit('human-seat', 4, 4, { ownerId: 9, power: 88, cost: 6, stackGroupId: 'seat-old' });
const humanSeatCompanion = unit('human-seat-2', 4, 4, { ownerId: 9, power: 87, cost: 7, stackGroupId: 'seat-companion-old' });
const foreignAi = unit('foreign-ai', 4, 4, { ownerId: 8, power: 77, cost: 33, stackGroupId: 'foreign-old' });
const civilian = unit('ai-civilian', 4, 4, { typeId: 'Osadnik', category: 'osadnik', power: 4, cost: 11, stackGroupId: 'civilian-old' });
const garrison = unit('ai-garrison', 4, 4, { inGarnizon: true, power: 12, cost: 8, stackGroupId: 'garrison-old' });
const naval = unit('ai-naval', 4, 4, { category: 'galera', power: 18, cost: 12, stackGroupId: 'naval-old' });
const liveUnits = [
  aiA, aiB, recruited, remoteAi, humanPrimary, humanSeat,
  humanSeatCompanion, foreignAi, civilian, garrison, naval,
];
const beforeRuntime = new Map(liveUnits.map(u => [u.id, stableRuntimeState(u)]));
const beforeGroups = new Map(liveUnits.map(u => [u.id, C.stackGroupIdOf(u)]));

const roster = C.findAiRecruitmentMergeStack(7, recruited.id, liveUnits);
const rosterIds = roster.map(u => u.id);
ok(
  JSON.stringify(rosterIds) === JSON.stringify(['ai-a', 'ai-b', 'rec-ai']),
  'AI completion selects only active same-owner field units on the birth hex',
);
ok(!roster.some(u => u.ownerId === 0), 'player units never enter the AI recruitment merge');
ok(!roster.some(u => u.ownerId === 9), 'the second human seat never enters the AI recruitment merge');
ok(!roster.some(u => u.ownerId !== 7), 'a different AI owner never enters the roster');
ok(!roster.some(u => u.inGarnizon === true), 'garrisoned units stay outside the field roster');
ok(!roster.some(u => u.category === 'galera'), 'native naval units stay outside the land roster');
ok(!roster.some(u => u.category === 'osadnik'), 'civilian units stay outside the combat roster');
ok(!roster.some(u => u.id === remoteAi.id), 'same-owner units off the birth hex stay outside the roster');

const merged = C.mergeCompletedAiRecruitment(7, recruited.id, liveUnits, classifyAi);
ok(merged === true, 'completed AI recruitment merges when compatible field units are present');
const mergedGroupId = C.stackGroupIdOf(recruited);
ok(
  mergedGroupId !== undefined
    && mergedGroupId !== beforeGroups.get(recruited.id)
    && [aiA, aiB, recruited].every(u => C.stackGroupIdOf(u) === mergedGroupId),
  'the compatible AI roster receives one shared stack identity',
);
for (const untouched of [
  remoteAi, humanPrimary, humanSeat, humanSeatCompanion, foreignAi,
  civilian, garrison, naval,
]) {
  ok(
    C.stackGroupIdOf(untouched) === beforeGroups.get(untouched.id),
    `excluded unit keeps its stack identity: ${untouched.id}`,
  );
}
ok(
  liveUnits.every(u => stableRuntimeState(u) === beforeRuntime.get(u.id)),
  'stack assignment changes no power, cost, owner, position or movement field',
);

// A nonzero owner can still be human in hot-seat. This must remain a no-op
// even when two compatible units for that seat occupy the birth hex.
const hotSeatGroupsBefore = new Map(liveUnits.map(u => [u.id, C.stackGroupIdOf(u)]));
const hotSeatMerged = C.mergeCompletedAiRecruitment(9, humanSeat.id, liveUnits, classifyAi);
ok(hotSeatMerged === false, 'hot-seat human recruitment is a bounded no-op');
ok(
  liveUnits.every(u => C.stackGroupIdOf(u) === hotSeatGroupsBefore.get(u.id)),
  'hot-seat no-op leaves every stack identity untouched',
);
const primaryMerged = C.mergeCompletedAiRecruitment(0, humanPrimary.id, liveUnits, classifyAi);
ok(primaryMerged === false, 'primary human recruitment is a bounded no-op');

console.log(`army-recruitment-concentration-test: ${passed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
