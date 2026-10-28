'use strict';

/**
 * Focused General-follow movement/recruitment gate.
 *
 * The test exercises real movement, city-hex, march save/load modules and checks
 * that the live General is the only Army destination control.
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
  executeMarchStep,
  planPathTurns,
  plannedMarchesFromSave,
  plannedMarchesToSave,
} from '../src/game/planned-march';
export { pathCost, terrainMoveCost } from '../src/units/setup';
export { canUnitOccupyCityHex } from '../src/game/city-hex-movement';
export { deserializeGame, serializeGame } from '../src/game/save';
export { generalLimitForEra, generalSlotsUsed, canRecruitGeneral, attemptGeneralPurchase, generalFollowDestination } from '../src/game/generals';`,
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
    canRecruitGeneral,
    deserializeGame,
    executeMarchStep,
    pathCost,
    planPathTurns,
    plannedMarchesFromSave,
    plannedMarchesToSave,
    generalLimitForEra,
    generalSlotsUsed,
    serializeGame,
    terrainMoveCost,
    attemptGeneralPurchase,
    generalFollowDestination,
  } = require(BUNDLE);

  check('General cap grows by one at each era',
    generalLimitForEra(1) === 1 && generalLimitForEra(2) === 2 && generalLimitForEra(3) === 3);
  check('living and queued Generals both use the era total cap',
    generalSlotsUsed({ alive: 1, queued: 1 }) === 2
      && !canRecruitGeneral(2, { alive: 1, queued: 1 })
      && canRecruitGeneral(3, { alive: 1, queued: 1 }));

  let queuedGeneralPurchases = 0;
  const validGeneralPurchase = {
    cityId: 'capital', capitalCityId: 'capital', era: 2, alive: 0, queued: 0,
    requestedQuantity: 1, requestedItemId: 'phalanx', requestedCost: 40,
    offeredItemId: 'phalanx', offeredCost: 40,
  };
  check('successful capital General purchase runs the production continuation',
    attemptGeneralPurchase(validGeneralPurchase, () => { queuedGeneralPurchases += 1; return true; })
      && queuedGeneralPurchases === 1);
  check('General purchase is rejected outside the capital without queueing',
    !attemptGeneralPurchase({ ...validGeneralPurchase, cityId: 'colony' },
      () => { queuedGeneralPurchases += 1; return true; })
      && queuedGeneralPurchases === 1);
  check('General purchase is rejected at era cap without queueing',
    !attemptGeneralPurchase({ ...validGeneralPurchase, alive: 1, era: 1 },
      () => { queuedGeneralPurchases += 1; return true; })
      && queuedGeneralPurchases === 1);
  check('General purchase rejects an offer whose item/cost no longer matches',
    !attemptGeneralPurchase({ ...validGeneralPurchase, offeredCost: 41 },
      () => { queuedGeneralPurchases += 1; return true; })
      && queuedGeneralPurchases === 1);

  // The General is a live moving destination; its march uses the existing path solver.
  const stackLead = makeUnit('u1', { stackGroupId: 'stack-a' });
  const general = makeUnit('general-1', { q: 3, r: 0, isGeneral: true });
  const units = [stackLead, general];
  const newRecruit = makeUnit('recruit-1', { q: 1, r: 0 });
  const recruitFollow = generalFollowDestination(newRecruit, general);
  check('newly purchased unit resolves destination from the live General at runtime',
    recruitFollow?.point.q === 3 && recruitFollow.point.r === 0
      && recruitFollow.generalTargetId === 'general-1');
  general.q = 2;
  const retargetedRecruitFollow = generalFollowDestination(newRecruit, general);
  check('new recruit destination tracks General movement instead of a stale rally point',
    retargetedRecruitFollow?.point.q === 2 && retargetedRecruitFollow.generalTargetId === 'general-1');
  general.q = 3;

  // Normal pathfinding and road cost use the existing movement functions.
  const plainMap = makeLineMap();
  const roadMap = makeLineMap({ 1: 'droga', 2: 'droga' });
  const plainPlan = planPathTurns(stackLead, 3, 0, plainMap, new Set(), 1, 1, terrainMoveCost);
  const roadPlan = planPathTurns(stackLead, 3, 0, roadMap, new Set(), 1, 1, terrainMoveCost);
  check('General destination has a normal path',
    roadPlan.reachable && roadPlan.fullPath.length === 3);
  check('road movement cost is used by the planned march',
    terrainMoveCost(roadMap.hexes['1,0']) === 1 / 3
      && roadPlan.segmentPath.length > plainPlan.segmentPath.length
      && roadPlan.segmentCost < plainPlan.segmentCost);
  check('path cost reports the road-adjusted route',
    pathCost(roadPlan.segmentPath, roadMap, terrainMoveCost) === roadPlan.segmentCost);

  const ownCity = { q: 3, r: 0, ownerId: 0 };
  const foreignCity = { q: 3, r: 0, ownerId: 1 };
  check('own city hex remains a valid General destination',
    canUnitOccupyCityHex(0, ownCity.q, ownCity.r, [ownCity]));
  check('foreign city hex is rejected as a General destination',
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
  check('General-follow order reuses executable normal march segments',
    step.ok && step.movePath.length === 2 && step.cost === 2 / 3);

  // A General-follow order survives save/load with its live target identity.
  const generalMarches = new Map([['u1', { destQ: 3, destR: 0, generalTargetId: general.id }]]);
  const marchSave = plannedMarchesToSave(generalMarches);
  const roundMarches = plannedMarchesFromSave(
    marchSave.autoMarch,
    marchSave.plannedMarches,
    units,
    0,
  );
  check('General-follow plans serialize to save',
    roundMarches.size === 1 && roundMarches.get('u1')?.destQ === 3
      && roundMarches.get('u1')?.generalTargetId === general.id);
  const json = serializeGame({
    wersja: 3,
    tura: 4,
    seed: 42,
    units,
    cities: [],
    exploredByHuman: [],
    gracze: [],
    humanOwnerIds: [0],
    activeHumanOwnerId: 0,
    plannedMarches: marchSave.plannedMarches,
    autoMarch: marchSave.autoMarch,
  });
  const loaded = deserializeGame(json);
  check('save/load preserves the General-follow order',
    loaded.plannedMarches?.u1?.destQ === 3 && loaded.autoMarch?.leaderId === 'u1'
      && loaded.plannedMarches?.u1?.generalTargetId === 'general-1');
  const followerAtStaleGeneralHex = makeUnit('following-unit', { q: 2, r: 0 });
  const staleGeneralOrder = plannedMarchesFromSave(undefined, {
    'following-unit': { destQ: 2, destR: 0, generalTargetId: 'general-1' },
  }, [followerAtStaleGeneralHex], 0);
  check('save loader preserves a live-General order when saved coordinates match follower',
    staleGeneralOrder.get('following-unit')?.generalTargetId === 'general-1');
  // Verify the production integration exposes the explicit launch path.
  const mainSource = fs.readFileSync(MAIN_TS, 'utf8');
  const mapClickStart = mainSource.indexOf("canvas.addEventListener('mouseup'");
  const planStart = mainSource.indexOf('function planGeneralFollowMarch');
  const mapClickBody = mapClickStart >= 0 ? mainSource.slice(mapClickStart) : '';
  const planEnd = mainSource.indexOf('function syncGeneralMarchTargets', planStart);
  const planBody = planStart >= 0 && planEnd > planStart ? mainSource.slice(planStart, planEnd) : '';
  check('old manual rally controls are absent from map-unit action UI',
    !mainSource.includes("id: 'rally-set'")
      && !mainSource.includes("id: 'rally-launch'")
      && !mainSource.includes("id: 'rally-clear'"));
  const empirePanelSource = fs.readFileSync(path.resolve(__dirname, '../src/ui/empireDetailPanel.ts'), 'utf8');
  const cityPanelSource = fs.readFileSync(path.resolve(__dirname, '../src/ui/cityPanel.ts'), 'utf8');
  check('Army panel no longer exposes manual rally-point controls',
    !empirePanelSource.includes('data-army-rally-set')
      && !empirePanelSource.includes('data-army-rally-launch')
      && !empirePanelSource.includes('data-army-rally-clear')
      && !empirePanelSource.includes('renderRallyPointControls')
      && !empirePanelSource.includes('wireRallyPointControls'));
  check('Army runtime no longer wires manual point picking or launch callbacks',
    !mainSource.includes('getRallyPoint:')
      && !mainSource.includes('onLaunchRallyPoint:')
      && !mainSource.includes('onToggleRallyPointPick:')
      && !mainSource.includes('launchRallyPointForOwner'));
  check('new city recruits automatically receive a live-General march plan',
    mainSource.includes('generalFollowDestination(u, general)')
      && mainSource.includes('planGeneralFollowMarch(\n        u, follow.point, follow.generalTargetId, false,')
      && mainSource.includes('isGeneral: rec.isGeneral === true'));
  check('General-following plans retarget and discard dead/missing Generals',
    mainSource.includes('function syncGeneralMarchTargets()')
      && mainSource.includes('destQ: general.q, destR: general.r')
      && mainSource.includes('general.isGeneral !== true'));
  check('General recruitment runtime uses the capital/era eligibility gate',
    mainSource.includes('return attemptGeneralPurchase({')
      && mainSource.includes('capitalCityId: capitalCityIdForOwner(ownerId)')
      && mainSource.includes('era: empireEpochForOwner(ownerId)')
      && mainSource.includes('sortByUnitPowerDescending')
      && mainSource.includes('item.isGeneral === true'));
  check('General recruitment card displays exactly one owner-building title prefix',
    cityPanelSource.includes("const leaderTitle = offer.title ?? 'Wódz'")
      && cityPanelSource.includes('unitLabel: `${leaderTitle} · ${offer.item.nazwa}`')
      && mainSource.includes('item: best ? { ...best, isGeneral: true } : null')
      && !mainSource.includes('item: best ? { ...best, isGeneral: true, nazwa: `${armyLeaderTitle'));
  check('best-unit form refresh preserves wounded health fraction and unit identity',
    mainSource.includes('syncGeneralFormsForOwner(0)')
      && mainSource.includes('oldHp / oldHpMax')
      && mainSource.includes('general.typeId = best.id'));
  check('work-to-tax conversion retains behavior with themed accessible controls',
    empirePanelSource.includes('civ-emp-work-tax-controls')
      && empirePanelSource.includes('aria-label="Praca do zamiany na podatek"')
      && empirePanelSource.includes('data-work-tax-submit')
      && empirePanelSource.includes('.civ-emp-work-tax button:focus-visible'));
  check('General is the march destination for new recruits; destination follows the live General',
    mainSource.includes('generalFollowDestination(u, general)')
      && mainSource.includes('planGeneralFollowMarch(\n        u, follow.point, follow.generalTargetId, false,')
      && planBody.includes('generalTargetId ? { generalTargetId }')
      && mainSource.includes('plannedMarches.set(unitId, { ...dest, destQ: general.q, destR: general.r })'));
  check('arrival clears the General-following march at the General position',
    mainSource.includes('follower.q === general.q && follower.r === general.r')
      && planBody.includes('plannedMarches.set(u.id, dest)'));
  check('map click has no manual rally picker interception',
    !mainSource.includes('rallyPointMode')
      && !mainSource.includes('setRallyPointFromMap')
      && !mapClickBody.includes('id: \'rally-set\''));

  console.log(`\nrally-point-automarch-test: ${pass} pass, ${fail} fail`);
  process.exitCode = fail > 0 ? 1 : 0;
} finally {
  for (const file of [ENTRY, BUNDLE]) {
    try { fs.rmSync(file, { force: true }); } catch { /* best effort cleanup */ }
  }
}
