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
  aiGeneralCampaignToSave, restoreAiGeneralCampaigns } from '../src/game/ai-general-war-campaign';
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
check('General offer keeps existing capital availability gates for era and barracks',
  /purchasableUnits\(\s*capital,\s*data,\s*unlockedTechsForOwner\(ownerId\),\s*\{ \.\.\.productionAvailabilityCtxForCity\(capital\)/s.test(main));
check('campaign state is written to and restored from save metadata',
  main.includes('aiGeneralWarCampaignByOwner: aiGeneralCampaignToSave(aiGeneralWarCampaignByOwner)')
    && main.includes('restoreAiGeneralCampaigns(saved.meta?.aiGeneralWarCampaignByOwner)'));

console.log(`\nai-general-war-campaign-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(entry); } catch {}
try { fs.unlinkSync(bundle); } catch {}
process.exitCode = failed ? 1 : 0;
