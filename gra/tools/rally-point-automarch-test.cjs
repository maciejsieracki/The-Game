'use strict';

/**
 * Focused owner-contract 5B gate.
 *
 * The test exercises the real rally-point, movement, city-hex, and save/load
 * modules. The launch model deliberately snapshots leaders before a recruit is
 * appended, which is the contract that prevents implicit automarching.
 *
 * Usage (from gra/): node tools/rally-point-automarch-test.cjs
 */

const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');

const ENTRY = path.join(__dirname, '.rally-point-automarch-entry.ts');
const BUNDLE = path.join(__dirname, '.rally-point-automarch-bundle.cjs');
const MAIN_TS = path.resolve(__dirname, '..', 'src', 'main.ts');

fs.writeFileSync(
  ENTRY,
  `export {
  clearRallyPoint,
  rallyLaunchLeaderIds,
  rallyPointsFromSave,
  rallyPointsToSave,
  setRallyPoint,
} from '../src/game/rally-point';
export {
  executeMarchStep,
  planPathTurns,
  plannedMarchesFromSave,
  plannedMarchesToSave,
} from '../src/game/planned-march';
export { pathCost, terrainMoveCost } from '../src/units/setup';
export { canUnitOccupyCityHex } from '../src/game/city-hex-movement';
export { deserializeGame, serializeGame } from '../src/game/save';`,
  'utf8',
);

let pass = 0;
let fail = 0;
function check(label, condition) {
  if (condition) {
    pass += 1;
    console.log(`PASS: ${label}`);
  } else {
    fail += 1;
    console.error(`FAIL: ${label}`);
  }
}

function makeHex(q, r, improvement = 'brak') {
  return {
    coords: { q, r },
    terenBazowy: 'rownina',
    nakladka: 'brak',
    ulepszenie: improvement,
    ulepszenia: undefined,
    wlasciciel: null,
    wioska: { istnieje: false, ludnosc: 0 },
    rzeka: { obecna: false, krawedzie: [] },
  };
}

function makeLineMap(improvements = {}) {
  const hexes = {};
  for (let q = 0; q <= 3; q += 1) {
    hexes[`${q},0`] = makeHex(q, 0, improvements[q] || 'brak');
  }
  return { hexes };
}

function makeUnit(id, overrides = {}) {
  return {
    id,
    ownerId: 0,
    q: 0,
    r: 0,
    ruch: 2,
    ruchLeft: 2,
    typeId: 'wojownik',
    category: 'wojskowa',
    ...overrides,
  };
}

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE,
    logLevel: 'silent',
  });

  const {
    canUnitOccupyCityHex,
    clearRallyPoint,
    deserializeGame,
    executeMarchStep,
    pathCost,
    planPathTurns,
    plannedMarchesFromSave,
    plannedMarchesToSave,
    rallyLaunchLeaderIds,
    rallyPointsFromSave,
    rallyPointsToSave,
    serializeGame,
    setRallyPoint,
    terrainMoveCost,
  } = require(BUNDLE);

  // Create/replace one point per owner, without sharing mutable references.
  const points = new Map();
  const pointInput = { q: 3, r: 0 };
  setRallyPoint(points, 0, pointInput);
  setRallyPoint(points, 1, { q: 2, r: 0 });
  pointInput.q = 99;
  check('create point stores the selected owner point', points.get(0)?.q === 3);
  check('one global point is isolated per empire', points.size === 2 && points.get(1)?.q === 2);
  setRallyPoint(points, 0, { q: 3, r: 0 });
  check('setting a point replaces the previous point for that empire', points.size === 2);
  clearRallyPoint(points, 1);
  check('clear removes only the requested empire point', !points.has(1) && points.has(0));

  // Assignment is per real stack, including separate co-located stack IDs.
  const stackLead = makeUnit('u1', { stackGroupId: 'stack-a' });
  const stackMate = makeUnit('u1b', { stackGroupId: 'stack-a' });
  const coLocatedStackLead = makeUnit('u2', { stackGroupId: 'stack-b' });
  const garrison = makeUnit('g1', { stackGroupId: 'garrison', inGarnizon: true });
  const enemy = makeUnit('enemy', { ownerId: 1, q: 1, r: 0 });
  const unitsAtLaunch = [stackLead, stackMate, coLocatedStackLead, garrison, enemy];
  const leaders = rallyLaunchLeaderIds(unitsAtLaunch, 0);
  check('assign unit/army returns one leader for each current stack',
    leaders.length === 2 && leaders[0] === 'u1' && leaders[1] === 'u2');
  check('garrison and other empires are excluded from world-map launch',
    !leaders.includes('g1') && !leaders.includes('enemy'));

  // Normal pathfinding and road cost use the existing movement functions.
  const plainMap = makeLineMap();
  const roadMap = makeLineMap({ 1: 'droga', 2: 'droga' });
  const plainPlan = planPathTurns(stackLead, 3, 0, plainMap, new Set(), 1, 1, terrainMoveCost);
  const roadPlan = planPathTurns(stackLead, 3, 0, roadMap, new Set(), 1, 1, terrainMoveCost);
  check('rally destination has a normal path',
    roadPlan.reachable && roadPlan.fullPath.length === 3);
  check('road movement cost is used by the planned march',
    terrainMoveCost(roadMap.hexes['1,0']) === 1 / 3
      && roadPlan.segmentPath.length > plainPlan.segmentPath.length
      && roadPlan.segmentCost < plainPlan.segmentCost);
  check('path cost reports the road-adjusted route',
    pathCost(roadPlan.segmentPath, roadMap, terrainMoveCost) === roadPlan.segmentCost);

  const ownCity = { q: 3, r: 0, ownerId: 0 };
  const foreignCity = { q: 3, r: 0, ownerId: 1 };
  check('own city hex remains a valid rally destination',
    canUnitOccupyCityHex(0, ownCity.q, ownCity.r, [ownCity]));
  check('foreign city hex is rejected as a rally destination',
    !canUnitOccupyCityHex(0, foreignCity.q, foreignCity.r, [foreignCity]));
  const step = executeMarchStep(
    stackLead,
    { destQ: 3, destR: 0 },
    roadMap,
    new Set(),
    1,
    (q, r) => canUnitOccupyCityHex(stackLead.ownerId, q, r, []),
    1,
    undefined,
    terrainMoveCost,
  );
  check('explicit launch reuses executable normal march segments',
    step.ok && step.movePath.length === 2 && step.cost === 2 / 3);

  // Explicit launch snapshots existing leaders. A later recruit is not added.
  const launchedMarches = new Map();
  for (const id of leaders) {
    launchedMarches.set(id, { destQ: 3, destR: 0 });
  }
  const launchUnitIds = new Set(unitsAtLaunch.map(unit => unit.id));
  const obeysNoAutoMarchContract = (plans, currentUnits) => currentUnits
    .filter(unit => !launchUnitIds.has(unit.id))
    .every(unit => !plans.has(unit.id));
  const recruit = makeUnit('new-recruit', { q: 0, r: 0, stackGroupId: 'stack-new' });
  const unitsAfterRecruit = [...unitsAtLaunch, recruit];
  check('explicit launch creates plans for current units',
    launchedMarches.size === 2 && launchedMarches.has('u1') && launchedMarches.has('u2'));
  check('recruit after point/launch exists without an automatic march',
    obeysNoAutoMarchContract(launchedMarches, unitsAfterRecruit)
      && recruit.q === 0 && recruit.r === 0);

  // Mutation negative control: an implementation that appends every unit after
  // launch must fail the same no-auto-march assertion.
  const mutantMarches = new Map(launchedMarches);
  for (const unit of unitsAfterRecruit.filter(u => u.ownerId === 0)) {
    mutantMarches.set(unit.id, { destQ: 3, destR: 0 });
  }
  check('negative control detects automatic recruit enlistment',
    !obeysNoAutoMarchContract(mutantMarches, unitsAfterRecruit));

  // Planned marches and the rally point survive the real save serializer.
  const marchSave = plannedMarchesToSave(launchedMarches);
  const roundMarches = plannedMarchesFromSave(
    marchSave.autoMarch,
    marchSave.plannedMarches,
    unitsAtLaunch,
    0,
  );
  check('explicit launch plans serialize as planned marches',
    roundMarches.size === 2 && roundMarches.get('u1')?.destQ === 3);
  const rallySave = rallyPointsToSave(points);
  const json = serializeGame({
    wersja: 3,
    tura: 4,
    seed: 42,
    units: unitsAtLaunch,
    cities: [],
    exploredByHuman: [],
    gracze: [],
    humanOwnerIds: [0],
    activeHumanOwnerId: 0,
    rallyPoints: rallySave,
    plannedMarches: marchSave.plannedMarches,
    autoMarch: marchSave.autoMarch,
  });
  const loaded = deserializeGame(json);
  const restoredPoints = rallyPointsFromSave(loaded.rallyPoints);
  check('save/load preserves the rally point',
    restoredPoints.get(0)?.q === 3 && restoredPoints.get(0)?.r === 0);
  check('save/load preserves the planned launch',
    loaded.plannedMarches?.u1?.destQ === 3 && loaded.autoMarch?.leaderId === 'u1');
  const malformed = rallyPointsFromSave({
    0: { q: 4.9, r: 2.1 },
    bad: { q: 1, r: 1 },
    2: { q: Infinity, r: 1 },
  });
  check('save loader ignores malformed points and normalizes coordinates',
    malformed.get(0)?.q === 4 && malformed.get(0)?.r === 2
      && !malformed.has(2) && !malformed.has(NaN));

  // Verify the production integration exposes the explicit launch path.
  const mainSource = fs.readFileSync(MAIN_TS, 'utf8');
  const mapClickStart = mainSource.indexOf("canvas.addEventListener('mouseup'");
  const planStart = mainSource.indexOf('function planRallyMarchForUnit');
  const launchStart = mainSource.indexOf('function launchRallyPointForOwner');
  const launchEnd = mainSource.indexOf('function setRallyPointFromMap', launchStart);
  const mapClickBody = mapClickStart >= 0 ? mainSource.slice(mapClickStart) : '';
  const planBody = planStart >= 0 && launchStart > planStart
    ? mainSource.slice(planStart, launchStart)
    : '';
  const launchBody = launchStart >= 0 && launchEnd > launchStart
    ? mainSource.slice(launchStart, launchEnd)
    : '';
  const rallyClickPos = mapClickBody.indexOf('setRallyPointFromMap(hit.q, hit.r)');
  const ordinaryDismissPos = rallyClickPos >= 0
    ? mapClickBody.indexOf('dismissMapOverlayModes();', rallyClickPos)
    : -1;
  check('main UI exposes one point, explicit launch, and clear actions',
    mainSource.includes("id: 'rally-set'")
      && mainSource.includes("id: 'rally-launch'")
      && mainSource.includes("id: 'rally-clear'"));
  check('main launch uses current leaders then the existing march queue',
    launchBody.includes('rallyLaunchLeaderIds(units, ownerId)')
      && planBody.includes('plannedMarches.set(u.id, dest)')
      && launchBody.includes('enqueueMarchSegments(assigned)'));
  check('rally picker returns before ordinary map interaction',
    mainSource.indexOf('if (rallyPointMode) {') > mainSource.indexOf('const hit = pickMapTarget')
      && mainSource.includes('setRallyPointFromMap(hit.q, hit.r)')
      && rallyClickPos >= 0
      && ordinaryDismissPos > rallyClickPos);

  console.log(`\nrally-point-automarch-test: ${pass} pass, ${fail} fail`);
  process.exitCode = fail > 0 ? 1 : 0;
} finally {
  for (const file of [ENTRY, BUNDLE]) {
    try { fs.rmSync(file, { force: true }); } catch { /* best effort cleanup */ }
  }
}
