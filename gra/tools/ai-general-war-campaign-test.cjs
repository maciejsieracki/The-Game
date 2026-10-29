'use strict';
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');
const entry = path.resolve(__dirname, '.ai-general-war-campaign-entry.ts');
const bundle = path.resolve(__dirname, '.ai-general-war-campaign-bundle.cjs');
fs.writeFileSync(entry, `
export { decideAITurn } from '../src/game/ai';
export { chooseAiGeneralWarTarget, reconcileAiGeneralWarCampaign, recordAiGeneralGatherTurn,
  aiGeneralCampaignToSave, restoreAiGeneralCampaigns,
  findAiWarLandReachability, aiWarTargetHasReachableLandNeighbor } from '../src/game/ai-general-war-campaign';
export { planWarAllInCapital, classifyWarTargetRoutes, preferSeaReachableWarTargets } from '../src/game/warAllInCapital';
`, 'utf8');
try {
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
} catch (error) { console.error(error.message || error); process.exit(1); }
const M = require(bundle);
const main = fs.readFileSync(path.resolve(ROOT, 'src/main.ts'), 'utf8');
let passed = 0, failed = 0;
function check(label, ok, detail) {
  if (ok) { passed++; console.log('PASS:', label); }
  else { failed++; console.error('FAIL:', label, detail ?? ''); }
}
function unit(id, q, r, extra = {}) {
  return { id, ownerId: 1, typeId: 'Wojownik', category: 'miecznik', q, r,
    ruch: 2, ruchLeft: 2, hp: 30, isGeneral: false, ...extra };
}
function makeMap(w = 22, h = 10) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) hexes[`${q},${r}`] = {
    coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
    wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
  };
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}
const data = { units: [{ Jednostka: 'Wojownik', Typ: 'Melee', Health: 30, Ruch: 2 }], buildings: [],
  terrainYields: { terrain_types: [] }, aiParams: {} };
const cities = [{ id: 'home', ownerId: 1, q: 3, r: 4, population: 5 },
  { id: 'enemy-near', ownerId: 2, q: 18, r: 4, population: 5 },
  { id: 'enemy-far', ownerId: 3, q: 20, r: 8, population: 5 }];

// New war onset starts recruiting; a queued General holds recruitment until the unit physically spawns.
const initial = M.reconcileAiGeneralWarCampaign(undefined, 2, undefined, false);
check('war onset creates a recruiting campaign for one target', initial?.stage === 'recruiting' && initial.targetOwnerId === 2);
const queued = M.reconcileAiGeneralWarCampaign(initial, 2, undefined, true);
check('queued General keeps the campaign in recruiting stage', queued?.stage === 'recruiting');
const leader = unit('general-1', 3, 4, { isGeneral: true });
const mustering = M.reconcileAiGeneralWarCampaign(queued, 2, leader, false);
check('a spawned physical General starts gathering with a fresh five-turn counter',
  mustering?.stage === 'gathering' && mustering.generalUnitId === leader.id && mustering.gatherTurnsCompleted === 0);

// Keep the five complete turn boundary exact, then verify the actual AI branch orders the leader into attack.
let campaign = { ...mustering, rallyQ: leader.q, rallyR: leader.r,
  target: { ownerId: 2, cityId: 'enemy-near', q: 18, r: 4 }, turn: 1 };
const troops = [leader, unit('infantry-1', 3, 4), unit('infantry-2', 3, 4), unit('infantry-3', 3, 4)];
const map = makeMap();
const remoteTroops = [...troops, unit('infantry-remote', 8, 4)];
const musterOpts = { currentTurn: 1, aiGeneralWarCampaign: { ...campaign, turn: 1 } };
const musterCommands = M.decideAITurn(1, remoteTroops, cities, map, data, musterOpts);
check('gathering explicitly moves a distant eligible unit toward the physical General',
  musterCommands.some(command => command.type === 'move' && command.unitId === 'infantry-remote'));
check('gathering suppresses ordinary attacks while units muster',
  !musterCommands.some(command => command.type === 'attack'));
let lastCommands = [];
for (let turn = 1; turn <= 5; turn++) {
  // decideAITurn updates the nested campaign in its options object; mirror the real main.ts handoff.
  const opts = { currentTurn: turn, aiGeneralWarCampaign: { ...campaign, turn } };
  for (const u of troops) u.ruchLeft = u.ruch;
  lastCommands = M.decideAITurn(1, troops, cities, map, data, opts);
  campaign = opts.aiGeneralWarCampaign;
  check(`turn ${turn}: campaign remains a muster and does not issue attacks`,
    campaign.stage === (turn < 5 ? 'gathering' : 'attacking')
      && !lastCommands.some(command => command.type === 'attack'));
}
// The timer is a hard boundary: a path-blocked unit does not extend the five-turn muster.
const blockedBoundaryOpts = { currentTurn: 5, aiGeneralWarCampaign: {
  ...campaign, stage: 'gathering', gatherTurnsCompleted: 4, lastGatherTurn: 4, turn: 5,
} };
const blockedBoundaryCommands = M.decideAITurn(1, remoteTroops, cities, map, data, blockedBoundaryOpts);
check('fifth complete gather turn starts attack stage even while a unit remains unassembled',
  blockedBoundaryOpts.aiGeneralWarCampaign.stage === 'attacking'
    && blockedBoundaryCommands.some(command => command.type === 'move' && command.unitId === 'infantry-remote'));
for (const u of troops) u.ruchLeft = u.ruch;
const attackOpts = { currentTurn: 6, aiGeneralWarCampaign: { ...campaign, turn: 6 } };
const attackCommands = M.decideAITurn(1, troops, cities, map, data, attackOpts);
check('sixth owner turn starts the offensive after five complete gather turns',
  attackCommands.some(command => command.type === 'move' && command.unitId === leader.id));
check('attack-stage target is exactly the selected enemy even with another war city present',
  attackCommands.filter(command => command.type === 'move').length > 0
    && attackCommands.filter(command => command.type === 'move').every(command => command.targetCityId === 'enemy-near'));
const expectedAttackRoster = troops.map(u => u.id);
const attackMovesByUnit = new Map(attackCommands.filter(command => command.type === 'move')
  .map(command => [command.unitId, command]));
check(`attack stage issues same-target movement for every stacked eligible unit (${expectedAttackRoster.length}/${expectedAttackRoster.length})`,
  expectedAttackRoster.every(id => attackMovesByUnit.get(id)?.targetCityId === 'enemy-near'),
  `ordered ${[...attackMovesByUnit.keys()].join(',')}`);
const gatheredIds = troops.map(t => t.id);
const gatheredMoves = attackCommands.filter(command => command.type === 'move' && gatheredIds.includes(command.unitId));
check('all four units gathered on one hex receive the same attack-march step',
  gatheredMoves.length === gatheredIds.length
    && new Set(gatheredMoves.map(command => `${command.toQ},${command.toR},${command.targetCityId}`)).size === 1,
  { expected: gatheredIds, actual: gatheredMoves });
check('shared first step explicitly permits friendly stacking in the production executor',
  gatheredMoves.length === gatheredIds.length && gatheredMoves.every(command => command.allowFriendlyStack === true),
  gatheredMoves);

// No-path regression: disconnect both enemy capitals from the field army with a full missing
// column. The production planner must preserve an explicit noPath diagnostic for every unit,
// and the AI command adapter must not leave behind ordinary movement orders that mask it.
const noPathMap = makeMap();
for (let r = 0; r < noPathMap.wysokoscR; r++) delete noPathMap.hexes[`10,${r}`];
const noPathUnits = [leader, unit('infantry-no-path-1', 3, 4), unit('infantry-no-path-2', 3, 4)];
const noPathTargets = [
  { ownerId: 2, cityId: 'enemy-near', q: 18, r: 4 },
  { ownerId: 3, cityId: 'enemy-far', q: 20, r: 8 },
];
const noPathIds = noPathUnits.map(u => u.id).sort();
const noPathPlan = M.planWarAllInCapital(noPathUnits, noPathTargets, {
  map: noPathMap,
  blocked: new Set(noPathTargets.map(t => `${t.q},${t.r}`)),
  occupied: new Set(noPathUnits.map(u => `${u.q},${u.r}`)),
});
check('production war planner reports every disconnected unit in noPath and emits no march orders',
  JSON.stringify([...noPathPlan.noPath].sort()) === JSON.stringify(noPathIds)
    && noPathPlan.orders.length === 0,
  { expectedNoPath: noPathIds, actualNoPath: noPathPlan.noPath, orders: noPathPlan.orders });
const noPathAiCommands = M.decideAITurn(1, noPathUnits, cities, noPathMap, data, {
  currentTurn: 6,
  warAllIn: { targets: noPathTargets },
});
const noPathAiMoves = noPathAiCommands.filter(command =>
  command.type === 'move' && noPathIds.includes(command.unitId));
check('AI command adapter does not mask noPath with a false movement order', noPathAiMoves.length === 0,
  { noPathIds, moves: noPathAiMoves });

const deadRestart = M.reconcileAiGeneralWarCampaign(campaign, 2, undefined, false, ['general-survivor']);
check('leader death restarts recruiting and resets the muster counter',
  deadRestart?.stage === 'recruiting' && deadRestart.generalUnitId === leader.id && deadRestart.gatherTurnsCompleted === 0);
check('a surviving unused General is not reused after leader death',
  M.reconcileAiGeneralWarCampaign(deadRestart, 2, unit('general-survivor', 3, 4, { isGeneral: true }), false, ['general-survivor'])?.stage === 'recruiting');
check('a newly spawned replacement leader starts a fresh muster after death',
  M.reconcileAiGeneralWarCampaign(deadRestart, 2, unit('general-2', 3, 4, { isGeneral: true }), false, ['general-survivor', 'general-2'])?.stage === 'gathering');
check('peace removes the campaign and therefore cancels its AI-specific orders',
  M.reconcileAiGeneralWarCampaign(campaign, null, undefined, false) === undefined);
const chosen = M.chooseAiGeneralWarTarget(undefined, [
  { ownerId: 3, distance: 5 }, { ownerId: 2, distance: 5 }, { ownerId: 4, distance: 8 },
]);
check('simultaneous wars choose one deterministic nearest target with owner-id tie break', chosen === 2);
check('current target stays selected while it remains an active war',
  M.chooseAiGeneralWarTarget({ ...campaign, targetOwnerId: 4 }, [
    { ownerId: 2, distance: 1 }, { ownerId: 4, distance: 8 },
  ]) === 4);
const routeMap = makeMap();
for (let r = 0; r < routeMap.wysokoscR; r++) routeMap.hexes[`6,${r}`].terenBazowy = 'morze';
const routeProbe = unit('route-probe', 3, 4);
const routeBlocked = new Set(['7,4', '3,9']);
const reachability = M.findAiWarLandReachability(routeProbe, routeMap, routeBlocked);
const nearBlockedReachable = M.aiWarTargetHasReachableLandNeighbor(reachability, { q: 7, r: 4 });
const farLandReachable = M.aiWarTargetHasReachableLandNeighbor(reachability, { q: 3, r: 9 });
check('one connected-component search covers the campaign target set', reachability.searchCount === 1 && reachability.visitedHexCount > 0);
check('route search rejects the closer enemy capital behind a full-width sea barrier', !nearBlockedReachable);
check('route search accepts the farther enemy capital on the same landmass', farLandReachable);
check('campaign picks the nearest reachable land target when the closer enemy is noPath',
  M.chooseAiGeneralWarTarget(undefined, [
    { ownerId: 2, distance: 4, reachable: nearBlockedReachable },
    { ownerId: 3, distance: 5, reachable: farLandReachable },
  ]) === 3);

const persistentCampaign = { targetOwnerId: campaign.targetOwnerId, stage: campaign.stage,
  generalUnitId: campaign.generalUnitId, gatherTurnsCompleted: campaign.gatherTurnsCompleted,
  ...(campaign.blockedGeneralIds ? { blockedGeneralIds: campaign.blockedGeneralIds } : {}),
  ...(campaign.lastGatherTurn !== undefined ? { lastGatherTurn: campaign.lastGatherTurn } : {}) };
const toSave = new Map([[1, persistentCampaign]]);
const roundTrip = M.restoreAiGeneralCampaigns(JSON.parse(JSON.stringify(M.aiGeneralCampaignToSave(toSave))));
check('save/load preserves stage, target, General identity, and gather turn count',
  JSON.stringify(roundTrip.get(1)) === JSON.stringify(persistentCampaign));
const playerTargetCampaign = { ...persistentCampaign, targetOwnerId: 0 };
const playerTargetRoundTrip = M.restoreAiGeneralCampaigns(JSON.parse(JSON.stringify(
  M.aiGeneralCampaignToSave(new Map([[1, playerTargetCampaign]])),
)));
check('save/load preserves an AI campaign targeting human owner 0',
  JSON.stringify(playerTargetRoundTrip.get(1)) === JSON.stringify(playerTargetCampaign));
check('restore rejects malformed campaign records', M.restoreAiGeneralCampaigns([[0, campaign], [1, { ...campaign, stage: 'bad' }]]).size === 0);

// Protect the real game wiring, existing availability/resource gates, and serialization path.
check('AI owner turn prepares the campaign and calls the shared General purchase transaction',
  main.includes('prepareAiGeneralWarCampaign(ownerId)')
    && main.includes('purchaseRecruitmentUnit(capital.id, offer.id, offer.koszt, ownerId, 1, { isGeneral: true })'));
check('main filters campaign war targets by one land reachability component rooted at the AI capital',
  main.includes('findAiWarLandReachability(routeProbe, map, blockedRouteKeys)')
    && main.includes('aiWarTargetHasReachableLandNeighbor(routeReachability, target)'));
check('General offer uses capital production availability, including era, barracks, tech, and stock gates',
  main.includes('const availability = { ...productionAvailabilityCtxForCity(capital), showStockGatedUnits: true };')
    && /purchasableUnits\(\s*capital,\s*data,\s*techs,\s*availability,\s*\)/s.test(main)
    && main.includes('attemptGeneralPurchase({'),
  `availability=${main.includes('const availability = { ...productionAvailabilityCtxForCity(capital), showStockGatedUnits: true };')}; offerCall=${/purchasableUnits\(\s*capital,\s*data,\s*techs,\s*availability,\s*\)/s.test(main)}; transaction=${main.includes('attemptGeneralPurchase({')}`);
check('General offer keeps existing capital availability gates for era and barracks',
  /const techs = unlockedTechsForOwner\(ownerId\)/.test(main)
    && /const availability = \{ \.\.\.productionAvailabilityCtxForCity\(capital\), showStockGatedUnits: true \}/.test(main)
    && /purchasableUnits\(\s*capital,\s*data,\s*techs,\s*availability\s*,?\s*\)/s.test(main)
    && /unitEra > epoch \|\| unitEra < epoch - 1/.test(main)
    && /requiredTech && requiredTech !== '-' && requiredTech !== '—' && !techs\.includes\(requiredTech\)/.test(main)
    && /unitEra >= 2 && !builtIds\.includes\('koszary'\)/.test(main));
check('campaign state is written to and restored from save metadata',
  main.includes('aiGeneralWarCampaignByOwner: aiGeneralCampaignToSave(aiGeneralWarCampaignByOwner)')
    && main.includes('restoreAiGeneralCampaigns(saved.meta?.aiGeneralWarCampaignByOwner)'));

// A closer land target must not eclipse a wartime target separated by a sea barrier when
// existing Seafaring/embarkation makes that sea corridor feasible.
const seaRouteMap = makeMap(6, 5);
for (let r = 0; r < seaRouteMap.wysokoscR; r++) seaRouteMap.hexes[`2,${r}`].terenBazowy = 'plytkie_morze';
const seaRouteTargets = [
  { ownerId: 2, cityId: 'near-land', q: 1, r: 2, distance: 1 },
  { ownerId: 3, cityId: 'far-sea', q: 4, r: 2, distance: 4 },
];
const seaRouteBlocked = new Set(seaRouteTargets.map(target => `${target.q},${target.r}`));
const noSeaRoutes = M.classifyWarTargetRoutes(seaRouteMap, { q: 0, r: 2 }, seaRouteTargets, seaRouteBlocked, false);
const withSeaRoutes = M.classifyWarTargetRoutes(seaRouteMap, { q: 0, r: 2 }, seaRouteTargets, seaRouteBlocked, true);
check('without Seafaring the near land capital is reachable and far sea target is not',
  noSeaRoutes.get('near-land')?.land === true && noSeaRoutes.get('far-sea')?.land === false);
check('existing embarkation identifies the far capital as sea-reachable only across the barrier',
  withSeaRoutes.get('far-sea')?.sea === true && withSeaRoutes.get('far-sea')?.land === false);
const seaFirst = M.preferSeaReachableWarTargets(seaRouteTargets.map(target => ({
  ...target,
  landReachable: withSeaRoutes.get(target.cityId)?.land === true,
  seaReachable: withSeaRoutes.get(target.cityId)?.sea === true,
})));
check('sea-only wartime target is preferred over the closer land target',
  M.chooseAiGeneralWarTarget(undefined, seaFirst) === 3);
check('existing land target cannot be retained ahead of a feasible sea-only target',
  M.chooseAiGeneralWarTarget({ targetOwnerId: 2 }, seaFirst) === 3);

// A distant target may have both an overland route (through the gap at row 0) and a
// maritime corridor. The accepted sea-first rule prioritizes any executable sea route,
// not only a destination whose land route is impossible.
const dualRouteMap = makeMap(6, 5);
for (let r = 0; r < dualRouteMap.wysokoscR; r++) {
  if (r !== 0) dualRouteMap.hexes[`2,${r}`].terenBazowy = 'plytkie_morze';
}
const dualRouteTargets = [
  { ownerId: 2, cityId: 'near-land-dual', q: 1, r: 2, distance: 1 },
  { ownerId: 3, cityId: 'far-dual', q: 4, r: 2, distance: 4 },
];
const dualBlocked = new Set(dualRouteTargets.map(target => `${target.q},${target.r}`));
const dualWithSeaRoutes = M.classifyWarTargetRoutes(
  dualRouteMap, { q: 0, r: 2 }, dualRouteTargets, dualBlocked, true,
);
const dualCandidates = dualRouteTargets.map(target => ({
  ...target,
  landReachable: dualWithSeaRoutes.get(target.cityId)?.land === true,
  seaReachable: dualWithSeaRoutes.get(target.cityId)?.sea === true,
}));
check('route classifier reports both land and sea routes to the distant target',
  dualCandidates.find(target => target.ownerId === 3)?.landReachable === true
    && dualCandidates.find(target => target.ownerId === 3)?.seaReachable === true);
const dualSeaFirst = M.preferSeaReachableWarTargets(dualCandidates);
check('a distant target with both routes outranks a nearer land-only target',
  dualSeaFirst.length === 1 && dualSeaFirst[0]?.ownerId === 3
    && M.chooseAiGeneralWarTarget(undefined, dualSeaFirst) === 3,
  JSON.stringify({ dualCandidates, dualSeaFirst, selected: M.chooseAiGeneralWarTarget(undefined, dualSeaFirst) }));
const dualNoSeaRoutes = M.classifyWarTargetRoutes(
  dualRouteMap, { q: 0, r: 2 }, dualRouteTargets, dualBlocked, false,
);
const dualLandOnly = dualRouteTargets.map(target => ({
  ...target,
  landReachable: dualNoSeaRoutes.get(target.cityId)?.land === true,
  seaReachable: dualNoSeaRoutes.get(target.cityId)?.sea === true,
}));
check('without Seafaring the distant sea route loses priority and nearest land target wins',
  dualLandOnly.find(target => target.ownerId === 3)?.seaReachable === false
    && M.chooseAiGeneralWarTarget(undefined, M.preferSeaReachableWarTargets(dualLandOnly)) === 2);

// The classifier must agree with the production planner when route length in hexes differs
// from weighted movement cost: the direct land corridor is hills, while the longer corridor
// is shallow water. The shortest weighted route goes by sea, so the production planner's first
// movement order must enter water and the classifier must mark the target sea-preferred.
const weightedRouteMap = makeMap(7, 4);
for (const hex of Object.values(weightedRouteMap.hexes)) hex.terenBazowy = 'gory';
for (let q = 2; q <= 5; q++) weightedRouteMap.hexes[`${q},2`].terenBazowy = 'wzgorza';
for (let q = 1; q <= 5; q++) weightedRouteMap.hexes[`${q},1`].terenBazowy = 'plytkie_morze';
weightedRouteMap.hexes['1,2'].terenBazowy = 'laka';
weightedRouteMap.hexes['6,2'].terenBazowy = 'laka';
const weightedTarget = { ownerId: 4, cityId: 'weighted-dual', q: 6, r: 2 };
const weightedBlocked = new Set(['6,2']);
const weightedRoutes = M.classifyWarTargetRoutes(
  weightedRouteMap, { q: 1, r: 2 }, [weightedTarget], weightedBlocked, true,
);
const weightedPlan = M.planWarAllInCapital([unit('weighted-marcher', 1, 2)], [weightedTarget], {
  map: weightedRouteMap, allowSea: true, blocked: weightedBlocked, occupied: new Set(['1,2']),
});
const weightedStep = weightedPlan.orders[0]?.step;
check('weighted classifier identifies the same sea route chosen by the production planner',
  weightedRoutes.get('weighted-dual')?.land === true
    && weightedRoutes.get('weighted-dual')?.sea === true
    && weightedStep !== undefined
    && ['plytkie_morze', 'morze'].includes(weightedRouteMap.hexes[`${weightedStep.q},${weightedStep.r}`]?.terenBazowy),
  JSON.stringify({ route: weightedRoutes.get('weighted-dual'), step: weightedStep }));

// Exact equal-cost tie from independent evaluator R7. Both land and sea paths cost seven
// movement points before the shared goal entry; chooseStep's coordinate tie-break picks water.
const tiedRouteMap = makeMap(9, 8);
for (const hex of Object.values(tiedRouteMap.hexes)) hex.terenBazowy = 'gory';
for (const [key, terrain] of [
  [1, 3, 'laka'], [2, 3, 'laka'], [3, 3, 'wzgorza'], [4, 3, 'laka'],
  [5, 3, 'laka'], [6, 3, 'wzgorza'], [7, 3, 'laka'],
  [1, 4, 'plytkie_morze'], [2, 4, 'plytkie_morze'], [3, 4, 'laka'],
].map(([q, r, terrain]) => [`${q},${r}`, terrain])) {
  tiedRouteMap.hexes[key].terenBazowy = terrain;
}
const tiedTarget = { ownerId: 5, cityId: 'equal-cost-dual', q: 7, r: 3 };
const tiedBlocked = new Set(['7,3']);
const tiedWithSea = M.classifyWarTargetRoutes(
  tiedRouteMap, { q: 1, r: 3 }, [tiedTarget], tiedBlocked, true,
).get('equal-cost-dual');
const tiedPlan = M.planWarAllInCapital([unit('tie-marcher', 1, 3)], [tiedTarget], {
  map: tiedRouteMap, allowSea: true, blocked: tiedBlocked, occupied: new Set(['1,3']),
});
check('equal-cost route classifier follows the planner coordinate tie-break onto water',
  tiedWithSea?.land === true && tiedWithSea.sea === true
    && tiedPlan.orders[0]?.step.q === 2 && tiedPlan.orders[0]?.step.r === 4,
  JSON.stringify({ route: tiedWithSea, step: tiedPlan.orders[0]?.step }));
const tiedWithoutSea = M.classifyWarTargetRoutes(
  tiedRouteMap, { q: 1, r: 3 }, [tiedTarget], tiedBlocked, false,
).get('equal-cost-dual');
const tiedLandPlan = M.planWarAllInCapital([unit('tie-land-marcher', 1, 3)], [tiedTarget], {
  map: tiedRouteMap, allowSea: false, blocked: tiedBlocked, occupied: new Set(['1,3']),
});
check('without Seafaring the equal-cost sea tie is unavailable and the planner uses land',
  tiedWithoutSea?.land === true && tiedWithoutSea.sea === false
    && tiedLandPlan.orders[0]?.step.q === 2 && tiedLandPlan.orders[0]?.step.r === 3,
  JSON.stringify({ route: tiedWithoutSea, step: tiedLandPlan.orders[0]?.step }));
const seaMarch = M.planWarAllInCapital([unit('sea-marcher', 0, 2)], [seaRouteTargets[1]], {
  map: seaRouteMap, allowSea: true, blocked: seaRouteBlocked, occupied: new Set(['0,2']),
});
check('production planner marches toward the same selected sea capital',
  seaMarch.orders.length === 1 && seaMarch.orders[0]?.targetCityId === 'far-sea');
const deniedSeaMarch = M.planWarAllInCapital([unit('land-only-marcher', 0, 2)], [seaRouteTargets[1]], {
  map: seaRouteMap, allowSea: false, blocked: seaRouteBlocked, occupied: new Set(['0,2']),
});
check('without Seafaring production planner reports noPath rather than a false water move',
  deniedSeaMarch.orders.length === 0 && deniedSeaMarch.noPath.includes('land-only-marcher'));
check('main campaign wiring filters unreachable targets and gates sea movement on owner technology',
  main.includes('classifyWarTargetRoutes(')
    && main.includes('preferSeaReachableWarTargets(reachable)')
    && main.includes('const seaTravelAllowed = ownerHasSeafaring(ownerId)')
    && fs.readFileSync(path.resolve(ROOT, 'src/game/ai.ts'), 'utf8')
      .includes('allowSea: campaign.seaTravelAllowed === true'));

console.log(`\nai-general-war-campaign-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(entry); } catch {}
try { fs.unlinkSync(bundle); } catch {}
process.exitCode = failed ? 1 : 0;
