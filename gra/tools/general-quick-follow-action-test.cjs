'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));

async function main() {
  const root = path.resolve(__dirname, '..');
  const built = await esbuild.build({
    stdin: {
      contents: "export { nearestLivingGeneral, generalFollowDestination } from './src/game/generals.ts'; export { buildUnitActionBarHtml } from './src/ui/unitActionBarHtml.ts'; export { armyLeaderTitle } from './src/game/army-leadership.ts'; export { issueGeneralQuickFollow, generalQuickFollowActionLabel, planTrackedGeneralFollowMarch, syncTrackedGeneralFollowMarches } from './src/game/generalQuickFollow.ts'; export { planPathTurns } from './src/game/planned-march.ts';",
      resolveDir: root,
      sourcefile: 'general-quick-follow-entry.ts',
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'es2020',
    write: false,
    logLevel: 'silent',
  });
  const module = { exports: {} };
  new Function('module', 'exports', built.outputFiles[0].text)(module, module.exports);
  const { nearestLivingGeneral, generalFollowDestination, buildUnitActionBarHtml, armyLeaderTitle,
    issueGeneralQuickFollow, generalQuickFollowActionLabel, planTrackedGeneralFollowMarch,
    syncTrackedGeneralFollowMarches, planPathTurns } = module.exports;
  let pass = 0;
  const check = (condition, label) => {
    assert.ok(condition, label);
    pass++;
    console.log(`PASS ${label}`);
  };

  const unit = { id: 'u1', ownerId: 2, q: 0, r: 0, isGeneral: false };
  const roster = [
    { id: 'foreign-close', ownerId: 1, q: 0, r: 1, isGeneral: true },
    { id: 'far', ownerId: 2, q: 5, r: 0, isGeneral: true },
    { id: 'near', ownerId: 2, q: 1, r: 1, isGeneral: true },
    { id: 'dead', ownerId: 2, q: 0, r: 1, isGeneral: true, hp: 0 },
    { id: 'routed', ownerId: 2, q: 0, r: 1, isGeneral: true, routed: true },
  ];
  check(nearestLivingGeneral(unit, roster)?.id === 'near', 'chooses nearest living commander owned by the same civilization');
  check(nearestLivingGeneral({ ...unit, isGeneral: true }, roster) === undefined, 'commander does not receive a self-follow target');
  check(nearestLivingGeneral({ ...unit, ownerId: 9 }, roster) === undefined, 'no commander is returned when the owner has none');
  check(nearestLivingGeneral({ ...unit, dead: true }, roster) === undefined, 'dead units cannot start a commander-follow order');
  const dest = generalFollowDestination(unit, roster.find(candidate => candidate.id === 'near'));
  check(dest?.generalTargetId === 'near' && dest.point.q === 1 && dest.point.r === 1,
    'follow order stores commander identity and current destination for live tracking');

  const liveMap = { hexes: {
    '0,0': { terenBazowy: 'Rownina' }, '1,0': { terenBazowy: 'Rownina' },
    '2,0': { terenBazowy: 'Rownina' }, '3,0': { terenBazowy: 'Rownina' },
    '2,1': { terenBazowy: 'Rownina' },
  } };
  const movingUnit = { id: 'follow-unit', ownerId: 2, q: 0, r: 0, isGeneral: false,
    typeId: 'wojownik', category: 'piechota', ruch: 2, ruchLeft: 2 };
  const movingLeader = { id: 'moving-chief', ownerId: 2, q: 3, r: 0, isGeneral: true, hp: 30 };
  const liveUnits = [movingUnit, movingLeader];
  const trackedMarches = new Map();
  const attackTargets = new Set();
  let movedMarked = false;
  const marchPlanner = {
    playerOwnerId: 2,
    canOccupy: () => true,
    movementContext: unit => ({ mover: unit, occupied: new Set(), perTurn: 2 }),
    pathPlan: (unit, q, r, occupied, perTurn) => planPathTurns(unit, q, r, liveMap, occupied, perTurn),
    clearAutoExplore: () => {},
    markPlayerMoved: () => { movedMarked = true; },
    marches: trackedMarches,
    syncAttackTarget: (unitId, destination) => {
      if (destination.attackUnitId) attackTargets.add(unitId);
      else attackTargets.delete(unitId);
    },
  };
  check(planTrackedGeneralFollowMarch(movingUnit, { q: 3, r: 0 }, movingLeader.id, marchPlanner)
    && trackedMarches.get(movingUnit.id)?.generalTargetId === movingLeader.id
    && movedMarked,
  'production tracked planner calls the real pathfinder and stores a reachable leader march');
  movingLeader.q = 2;
  movingLeader.r = 1;
  syncTrackedGeneralFollowMarches(liveUnits, trackedMarches, unitId => attackTargets.delete(unitId));
  const retargeted = trackedMarches.get(movingUnit.id);
  check(retargeted?.destQ === 2 && retargeted.destR === 1
    && planPathTurns(movingUnit, retargeted.destQ, retargeted.destR, liveMap, new Set(), 2).reachable,
  'tracked march follows the commander position and remains pathfindable');
  movingUnit.q = movingLeader.q;
  movingUnit.r = movingLeader.r;
  syncTrackedGeneralFollowMarches(liveUnits, trackedMarches, unitId => attackTargets.delete(unitId));
  check(!trackedMarches.has(movingUnit.id), 'arrival on the moving commander hex completes and clears the tracked march');
  movingUnit.q = 0;
  movingUnit.r = 0;
  check(planTrackedGeneralFollowMarch(movingUnit, { q: movingLeader.q, r: movingLeader.r }, movingLeader.id, marchPlanner),
    'a follower can start a fresh tracked march after its prior order completes');
  attackTargets.add(movingUnit.id);
  movingLeader.hp = 0;
  syncTrackedGeneralFollowMarches(liveUnits, trackedMarches, unitId => attackTargets.delete(unitId));
  check(!trackedMarches.has(movingUnit.id) && !attackTargets.has(movingUnit.id),
    'zero-HP commander loss removes the tracked march and stale attack-target entry');

  check(generalQuickFollowActionLabel(armyLeaderTitle([])) === 'Idź do najbliższego wodza'
    && generalQuickFollowActionLabel(armyLeaderTitle(['akademia_wojskowa'])) === 'Idź do najbliższego generała'
    && generalQuickFollowActionLabel(armyLeaderTitle(['akademia_wojskowa']), true) === 'Marsz do generała',
  'follow action label tracks the live Wódz/Generał title and active state');

  const actionHtml = buildUnitActionBarHtml([
    { id: 'general-follow', label: generalQuickFollowActionLabel(armyLeaderTitle(['akademia_wojskowa'])) },
  ]);
  check(actionHtml.includes('data-act="general-follow"')
    && actionHtml.includes('Idź do najbliższego generała')
    && actionHtml.includes('aria-label="Idź do najbliższego generała"'),
  'unit action renderer exposes the clickable, accessible follow action');

  const liveUnit = { id: 'u1', ownerId: 2, q: 0, r: 0, isGeneral: false,
    typeId: 'wojownik', category: 'piechota', ruch: 2, ruchLeft: 2 };
  const liveRoster = [liveUnit, { id: 'chief-1', ownerId: 2, q: 3, r: 0, isGeneral: true, hp: 20 }];
  const liveMarches = new Map();
  const uiLiveMap = { hexes: {
    '0,0': { terenBazowy: 'Rownina' }, '1,0': { terenBazowy: 'Rownina' },
    '2,0': { terenBazowy: 'Rownina' }, '3,0': { terenBazowy: 'Rownina' },
  } };
  let queuedUnitIds = [];
  let liveNotices = [];
  let refreshCount = 0;
  let blocked = false;
  const livePlanner = {
    playerOwnerId: 2,
    canOccupy: () => true,
    movementContext: unit => ({ mover: unit, occupied: new Set(), perTurn: 2 }),
    pathPlan: (unit, q, r, occupied, perTurn) => blocked
      ? { reachable: false, fullPath: [] }
      : planPathTurns(unit, q, r, uiLiveMap, occupied, perTurn),
    clearAutoExplore: () => {},
    markPlayerMoved: () => {},
    marches: liveMarches,
    syncAttackTarget: () => {},
  };
  const runProductionAction = () => issueGeneralQuickFollow(
    liveUnit,
    liveRoster,
    armyLeaderTitle(['akademia_wojskowa']),
    {
      planMarch: (marchingUnit, point, targetId) => planTrackedGeneralFollowMarch(
        marchingUnit, point, targetId, livePlanner,
      ),
      movementLeft: () => 2,
      enqueue: ids => { queuedUnitIds = ids; },
      notify: message => { liveNotices.push(message); },
      refresh: () => { refreshCount++; },
    },
  );

  const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium' });
  try {
    const page = await browser.newPage();
    await page.exposeFunction('runProductionQuickFollow', runProductionAction);
    await page.setContent(`<main>${actionHtml}</main><output id="result"></output>`);
    await page.evaluate(() => document.addEventListener('click', async (event) => {
      const action = event.target.closest('[data-act]');
      if (action) document.querySelector('#result').textContent = await window.runProductionQuickFollow();
    }));
    await page.locator('[data-act="general-follow"]').click();
    const clickedAction = await page.locator('#result').evaluate((output) => output.textContent);
    check(clickedAction === 'issued' && liveMarches.get('u1')?.generalTargetId === 'chief-1'
      && liveMarches.get('u1')?.destQ === 3 && liveMarches.get('u1')?.destR === 0
      && queuedUnitIds[0] === 'u1' && refreshCount === 1
      && liveNotices[0].includes('generała'),
    'Chromium click executes production follow logic, stores live target, queues movement, and reports current title');
    blocked = true;
    const unreachableResult = runProductionAction();
    check(unreachableResult === 'unreachable' && queuedUnitIds[0] === 'u1'
      && liveMarches.get('u1')?.generalTargetId === 'chief-1'
      && liveNotices.at(-1).includes('generała'),
    'unreachable route reports failure without queuing a replacement march');
  } finally {
    await browser.close();
  }

  const mainSource = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');
  check(mainSource.includes("id: 'general-follow'")
    && mainSource.includes("actionId === 'general-follow'")
    && mainSource.includes('issueGeneralQuickFollow(u, units, leaderTitle')
    && mainSource.includes('generalQuickFollowActionLabel(leaderTitle, alreadyFollowing)')
    && mainSource.includes('planGeneralFollowMarch(unit, point, targetId)')
    && mainSource.includes('enqueue: unitIds => enqueueMarchSegments(unitIds)'),
  'production HUD handler delegates to the executed follow service and live title resolver');
  console.log(`\n${pass}/15 PASS`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
