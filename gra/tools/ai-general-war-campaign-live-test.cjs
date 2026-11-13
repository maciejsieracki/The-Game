'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawn } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const DIST = '/tmp/civ-ai-general-war-campaign-live';
const CHROME = process.env.CHROMIUM_PATH
  || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const TOTAL_TIMEOUT_MS = 5 * 60 * 1000;
let pass = 0, fail = 0;
function check(label, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + label); }
  else { fail++; console.error('FAIL: ' + label + (detail ? ' — ' + JSON.stringify(detail) : '')); }
}

async function main() {
  const startedAt = Date.now();
  execFileSync('node', ['./node_modules/vite/bin/vite.js', 'build', '--config', 'tools/ai-general-war-campaign-live.vite.config.ts'], {
    cwd: ROOT, stdio: 'inherit', timeout: 120000,
  });
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  const errors = [];
  const server = spawn('python3', ['-m', 'http.server', '18742', '--directory', DIST, '--bind', '127.0.0.1'], { stdio: 'ignore' });
  page.on('pageerror', e => errors.push(String(e)));
  const finishFullEndTurn = async (label, aiOwnerId) => {
    const remaining = TOTAL_TIMEOUT_MS - (Date.now() - startedAt);
    if (remaining <= 0) throw new Error('R5 live scenario exceeded the five-minute budget before ' + label);
    const beforeTurn = await page.evaluate(() => window.__generalRuntime.currentTurn());
    const beforeHistory = await page.evaluate(() => window.__generalRuntime.aiCommandHistory().length);
    console.log(`EOT start ${label}, world turn ${beforeTurn}, remaining budget ${Math.round(remaining / 1000)}s`);
    await page.evaluate(() => window.__generalRuntime.runRealEndTurn());
    await page.waitForFunction(previous => window.__generalRuntime.currentTurn() > previous
      && !window.__generalRuntime.endTurnInProgress(), beforeTurn,
    { timeout: Math.min(100000, remaining), polling: 100 });
    const state = await page.evaluate(ownerId => window.__generalRuntime.campaignState(ownerId), aiOwnerId);
    const history = await page.evaluate(index => window.__generalRuntime.aiCommandHistory().slice(index), beforeHistory);
    const aiTurn = history.filter(entry => entry.ownerId === aiOwnerId).at(-1) ?? null;
    if (!aiTurn) throw new Error(`No real AI command record for owner ${aiOwnerId} after ${label}`);
    console.log(`EOT done ${label}: world turn ${state.turn}, campaign ${state.campaign?.stage ?? 'none'} ${state.campaign?.gatherTurnsCompleted ?? '-'}/5, AI commands ${aiTurn.commands.length}`);
    return { state, aiTurn };
  };
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    await page.goto('http://127.0.0.1:18742/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__generalRuntime?.ready, undefined, { timeout: 20000 });
    await page.evaluate(() => window.__generalRuntime.start(981042));
    await page.waitForFunction(() => window.__generalRuntime && document.querySelector('canvas'), undefined, { timeout: 180000 });
    const founded = await page.evaluate(() => window.__generalRuntime.foundCity());
    check('production game initializes and human capital is founded', founded === 'ok', founded);
    const owners = await page.evaluate(() => [1, 2, 3, 4, 5].map(id => ({ id, cities: window.__generalRuntime.ownerCities(id) })).filter(x => x.cities.length));
    if (!owners.length) throw new Error('No AI owner capital in generated fixture: ' + JSON.stringify(owners));
    const aiOwner = owners[0].id;
    const topology = await page.evaluate(ownerId => window.__generalRuntime.prepareSeaCorridor(ownerId, 0), aiOwner);
    check('live fixture provides a sea-only capital route with an embarkation and landing hex',
      !topology.error && topology.hasSeafaring && topology.water.length >= 2, topology);
    if (topology.error || !topology.hasSeafaring) throw new Error('Could not prepare production sea corridor: ' + JSON.stringify(topology));
    const onset = await page.evaluate(ownerId => window.__generalRuntime.beginWarCampaign(ownerId, 0), aiOwner);
    check('war onset selects player owner 0 as the active enemy target', onset.campaign?.target?.ownerId === 0, onset);
    check('campaign uses the same selected capital for its enabled Seafaring route',
      onset.campaign?.target?.q === topology.goal.q && onset.campaign?.target?.r === topology.goal.r
        && onset.campaign?.seaTravelAllowed === true, { campaign: onset.campaign, topology });
    check('war onset transaction queues one physical General in the AI capital',
      !onset.error && onset.queue?.filter(x => x.isGeneral).length === 1,
      { error: onset.error, queue: onset.queue, capitalId: onset.capitalId, offer: onset.offer });
    if (onset.error || onset.queue?.filter(x => x.isGeneral).length !== 1) throw new Error('AI General not queued after war onset');

    const preSetupStack = await page.evaluate(ownerId => window.__generalRuntime.addMusterStackBeforeSetup(ownerId), aiOwner);
    check('three test units exist before the first complete AI owner EOT', !preSetupStack.error && preSetupStack.ids?.length === 3, preSetupStack);
    if (preSetupStack.ids?.length !== 3) throw new Error('Could not create muster units before first EOT');

    // The first full EOT completes recruitment and already counts as muster turn 1.
    const setupEndTurn = await finishFullEndTurn('General recruitment/spawn setup', aiOwner);
    await page.waitForFunction(ownerId => window.__generalRuntime.campaignState(ownerId).generals.length > 0,
      aiOwner, { timeout: Math.min(90000, TOTAL_TIMEOUT_MS - (Date.now() - startedAt)), polling: 250 });
    const refreshed = await page.evaluate(ownerId => window.__generalRuntime.refreshCampaign(ownerId), aiOwner);
    let state = refreshed.state;
    check('queued AI General spawns into the live world', state.generals.length >= 1, state);
    check('campaign binds the spawned physical General before muster turns begin',
      refreshed.campaign?.generalUnitId && state.generals.some(g => g.id === refreshed.campaign.generalUnitId)
        && refreshed.campaign.stage === 'gathering'
        && (refreshed.campaign.gatherTurnsCompleted === 0 || refreshed.campaign.gatherTurnsCompleted === 1), refreshed);
    if (!refreshed.campaign?.generalUnitId) throw new Error('Live campaign did not bind the spawned General');

    const firstMusterRoster = await page.evaluate(ids => window.__generalRuntime.positions(ids),
      [...preSetupStack.ids, refreshed.campaign.generalUnitId]);
    check('first full muster EOT ends with all three troops and physical General assembled',
      firstMusterRoster.length === 4 && firstMusterRoster.every(unit => unit
        && unit.q === preSetupStack.start.q && unit.r === preSetupStack.start.r),
      { start: preSetupStack.start, roster: firstMusterRoster, commands: setupEndTurn.aiTurn.commands,
        moveResults: setupEndTurn.aiTurn.moveResults });

    const musterResults = [];
    if (setupEndTurn.state.campaign?.stage === 'gathering' && setupEndTurn.state.campaign.gatherTurnsCompleted === 1) {
      const attacks = setupEndTurn.aiTurn.commands.filter(command => command.type === 'attack');
      check('first full EOT with the physical General records muster 1/5 without attacking', attacks.length === 0,
        { campaign: setupEndTurn.state.campaign, attackCommands: attacks.length, aiTurn: setupEndTurn.aiTurn });
      musterResults.push({ turn: setupEndTurn.state.turn, gathered: 1, stage: setupEndTurn.state.campaign.stage, attackCommands: 0 });
    }

    const stack = await page.evaluate(({ ownerId, ids }) => window.__generalRuntime.stackMusterUnitsAtGeneral(ownerId, ids),
      { ownerId: aiOwner, ids: preSetupStack.ids });
    stack.ids = preSetupStack.ids;
    check('three test units join the physical General at one reachable muster hex', !stack.error && stack.ids?.length === 3, stack);
    if (!stack.ids || stack.ids.length !== 3) throw new Error('Could not place three co-located muster units');
    const rosterIds = [...stack.ids, stack.general.id];
    const rosterStart = await page.evaluate(ids => window.__generalRuntime.positions(ids), rosterIds);
    check('live muster fixture starts with all four units co-located',
      rosterStart.length === 4 && rosterStart.every(unit => unit.q === stack.start.q && unit.r === stack.start.r),
      { start: stack.start, units: rosterStart });

    for (let musterTurn = (refreshed.campaign.gatherTurnsCompleted ?? 0) + 1; musterTurn <= 5; musterTurn++) {
      const result = await finishFullEndTurn(`muster ${musterTurn}/5`, aiOwner);
      const attacks = result.aiTurn.commands.filter(command => command.type === 'attack');
      const countOk = result.state.campaign?.gatherTurnsCompleted === musterTurn
        && result.state.campaign?.stage === (musterTurn < 5 ? 'gathering' : 'attacking');
      check(`full EOT muster ${musterTurn}/5 records one turn and issues no attack`,
        countOk && attacks.length === 0 && result.state.campaign?.targetOwnerId === 0,
        { state: result.state, attackCommands: attacks.length, aiTurn: result.aiTurn });
      const positions = await page.evaluate(ids => window.__generalRuntime.positions(ids), rosterIds);
      check(`full EOT muster ${musterTurn}/5 keeps the complete force assembled`,
        positions.length === 4 && positions.every(unit => unit.q === stack.start.q && unit.r === stack.start.r),
        { start: stack.start, positions });
      musterResults.push({ turn: result.state.turn, gathered: result.state.campaign?.gatherTurnsCompleted,
        stage: result.state.campaign?.stage, attackCommands: attacks.length });
    }
    state = await page.evaluate(ownerId => window.__generalRuntime.campaignState(ownerId), aiOwner);
    check('five real AI owner EOTs complete muster before the sixth turn',
      musterResults.length === 5 && musterResults.every((row, index) => row.gathered === index + 1 && row.attackCommands === 0)
        && state.campaign?.gatherTurnsCompleted === 5 && state.campaign.stage === 'attacking', musterResults);

    const sixthTurn = await finishFullEndTurn('attack 6/6', aiOwner);
    const expectedTarget = sixthTurn.state.targetCityId;
    const rosterMoves = sixthTurn.aiTurn.commands.filter(command => command.type === 'move' && rosterIds.includes(command.unitId));
    const targetIds = new Set(rosterMoves.map(command => command.targetCityId));
    check('sixth real AI owner EOT orders all four units to the same selected city',
      rosterMoves.length === 4 && targetIds.size === 1 && targetIds.has(expectedTarget),
      { rosterIds, moves: rosterMoves, targetCityId: expectedTarget, campaign: sixthTurn.state.campaign });
    const executedRosterMoves = sixthTurn.aiTurn.moveResults.filter(result => rosterIds.includes(result.unitId) && result.moved);
    check('sixth real end-turn executor accepts all four movement commands (4/4)',
      executedRosterMoves.length === 4,
      { executed: executedRosterMoves.map(result => result.unitId), allResults: sixthTurn.aiTurn.moveResults });
    const positionsAfterAttack = await page.evaluate(ids => window.__generalRuntime.positions(ids), rosterIds);
    const movedCount = positionsAfterAttack.filter((unit, index) => unit
      && (unit.q !== rosterStart[index].q || unit.r !== rosterStart[index].r)).length;
    check(`sixth full EOT moves the whole roster, including the physical General (${movedCount}/4)`,
      positionsAfterAttack.length === 4 && movedCount === 4,
      { before: rosterStart, after: positionsAfterAttack, targetCityId: expectedTarget });
    const persisted = await page.evaluate(ownerId => window.__generalRuntime.campaignSaveRoundTrip(ownerId), aiOwner);
    check('active attack-stage campaign survives production save metadata roundtrip', persisted.ok === true, persisted);

    const realSetup = await page.evaluate(ownerId => window.__generalRuntime.prepareRealMarchFromCapital(ownerId), aiOwner);
    check('real-execution fixture starts the whole field army stacked on its General city',
      !realSetup.error && realSetup.armyIds.length >= 3
        && realSetup.targetCapital?.id, realSetup);
    if (realSetup.error || realSetup.armyIds.length < 3 || !realSetup.targetCapital?.id) {
      throw new Error('Could not prepare actual march fixture: ' + JSON.stringify(realSetup));
    }
    const expectedArmyIds = [...realSetup.armyIds].sort();
    const actualTurns = [];
    for (let i = 1; i <= 6; i++) {
      if (Date.now() - startedAt > TOTAL_TIMEOUT_MS) throw new Error('Actual six-turn march exceeded six-minute limit');
      const step = await page.evaluate(ownerId => window.__generalRuntime.runRealWorldEndTurn(ownerId), aiOwner);
      actualTurns.push(step);
      if (step.timedOut) throw new Error('Real world end-turn pipeline timed out: ' + JSON.stringify(step));
      const observedArmyIds = step.army.map(unit => unit.id).sort();
      check(`actual world turn ${i}: trace includes every field-army member`,
        JSON.stringify(observedArmyIds) === JSON.stringify(expectedArmyIds),
        { expectedArmyIds, observedArmyIds, army: step.army });
      if (i <= 4) {
        check(`actual world turn ${i}: AI army remains mustered at the city`,
          step.campaign?.stage === 'gathering' && step.campaign.gatherTurnsCompleted === i
            && step.army.every(unit => unit.q === realSetup.capital.q && unit.r === realSetup.capital.r),
          { campaign: step.campaign, perUnit: step.army });
      } else if (i === 5) {
        check('fifth actual world turn completes muster and arms attack for the next AI turn',
          step.campaign?.stage === 'attacking' && step.campaign.gatherTurnsCompleted === 5
            && step.army.every(unit => unit.q === realSetup.capital.q && unit.r === realSetup.capital.r),
          { campaign: step.campaign, perUnit: step.army });
      } else {
        const departed = step.army.filter(unit => unit.q !== realSetup.capital.q || unit.r !== realSetup.capital.r);
        const ordersById = new Map(step.attackOrders.map(order => [order.unitId, order]));
        const allHaveOrders = expectedArmyIds.every(id => ordersById.has(id));
        check('actual sixth world turn: campaign issues attack orders from the city toward enemy capital',
          step.campaign?.stage === 'attacking' && allHaveOrders
            && step.attackOrders.filter(order => expectedArmyIds.includes(order.unitId))
              .every(order => order.targetCityId === realSetup.targetCapital.id),
          { expectedArmyIds, orders: step.attackOrders, campaign: step.campaign, departed: departed.length, armySize: step.army.length,
            aiDecision: step.aiDecision, warPlanDiagnostic: step.warPlanDiagnostic });
        check('actual command executor moves units out of the General city toward the enemy capital',
          departed.length === expectedArmyIds.length, { departed, armySize: step.army.length, capital: step.capital,
            targetCapital: step.targetCapital, orders: step.attackOrders });
      }
    }
    let landingTurn = null;
    for (let i = 0; i < 4; i++) {
      landingTurn = await page.evaluate(ownerId => window.__generalRuntime.runRealWorldEndTurn(ownerId), aiOwner);
      if (landingTurn.timedOut) throw new Error('Sea landing end-turn timed out: ' + JSON.stringify(landingTurn));
      if (landingTurn.army.some(unit => !unit.embarked && !unit.onWater
        && (unit.q !== realSetup.capital.q || unit.r !== realSetup.capital.r))) break;
    }
    const embarkedMembers = landingTurn.army.filter(unit => unit.embarked && unit.onWater);
    const landedMembers = landingTurn.army.filter(unit => !unit.embarked && !unit.onWater
      && (unit.q !== realSetup.capital.q || unit.r !== realSetup.capital.r));
    check('production executor disembarks the campaign army onto land before reaching the enemy city',
      embarkedMembers.length === 0 && landedMembers.length > 0,
      { army: landingTurn.army, capital: realSetup.capital, target: realSetup.targetCapital,
        aiDecision: landingTurn.aiDecision, warPlanDiagnostic: landingTurn.warPlanDiagnostic });
    check('production executor emits no direct attack command from a water-embarked unit',
      landingTurn.attackCommands.length === 0, { attackCommands: landingTurn.attackCommands, army: landingTurn.army });

    // Fresh game: exercise the full owner-turn executor without teleporting units into the
    // rendezvous city. This verifies the two field reports about natural mustering, a full
    // legal movement budget on turn six, and a fresh muster after the physical leader falls.
    await page.reload({ waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__generalRuntime?.ready, undefined, { timeout: 20000 });
    await page.evaluate(() => window.__generalRuntime.start(981043));
    await page.waitForFunction(() => window.__generalRuntime && document.querySelector('canvas'), undefined, { timeout: 180000 });
    check('organic campaign fixture founds the human capital',
      await page.evaluate(() => window.__generalRuntime.foundCity()) === 'ok');
    const organicOwners = await page.evaluate(() => [1, 2, 3, 4, 5]
      .map(id => ({ id, cities: window.__generalRuntime.ownerCities(id) })).filter(x => x.cities.length));
    const organicOwner = organicOwners[0]?.id;
    check('organic campaign fixture has an AI capital', organicOwner !== undefined, organicOwners);
    if (organicOwner === undefined) throw new Error('No AI owner for organic campaign fixture');
    const organicSetup = await page.evaluate(ownerId => window.__generalRuntime.prepareOrganicLandCampaign(ownerId), organicOwner);
    check('organic land fixture has an executable nearest capital route and leaves troops in place',
      !organicSetup.error && organicSetup.noSeafaring && organicSetup.army.length > 0
        && organicSetup.army.every(unit => unit.q !== undefined && unit.r !== undefined), organicSetup);
    if (organicSetup.error) throw new Error('Could not prepare organic land fixture: ' + JSON.stringify(organicSetup));
    const organicWar = await page.evaluate(ownerId => window.__generalRuntime.beginWarCampaign(ownerId, 0), organicOwner);
    check('organic war starts a physical General campaign against the reachable human capital',
      !organicWar.error && organicWar.campaign?.target?.ownerId === 0
        && organicWar.campaign?.seaTravelAllowed === false, organicWar);
    await page.evaluate(() => window.__generalRuntime.finishRecruitmentByTurn());
    await page.waitForFunction(ownerId => window.__generalRuntime.campaignState(ownerId).generals.length > 0,
      organicOwner, { timeout: Math.max(120000, TOTAL_TIMEOUT_MS - (Date.now() - startedAt)), polling: 500 });
    const organicBound = await page.evaluate(ownerId => window.__generalRuntime.refreshCampaign(ownerId), organicOwner);
    const organicInitial = await page.evaluate(ownerId => window.__generalRuntime.organicArmySnapshot(ownerId), organicOwner);
    check('organic live campaign binds the spawned General without repositioning troops',
      !!organicBound.campaign?.generalUnitId
        && organicInitial.some(unit => unit.id === organicBound.campaign.generalUnitId)
        && organicInitial.filter(unit => !unit.general).every(unit => {
          const before = organicSetup.army.find(x => x.id === unit.id);
          return !before || (before.q === unit.q && before.r === unit.r);
        }), { campaign: organicBound.campaign, initial: organicInitial, setup: organicSetup.army });

    let organicTurns = 0;
    let organicCampaign = organicBound.campaign;
    while ((organicCampaign?.gatherTurnsCompleted ?? 0) < 5 && organicTurns < 6) {
      const beforeGather = organicCampaign?.gatherTurnsCompleted ?? 0;
      const step = await page.evaluate(ownerId => window.__generalRuntime.runRealWorldEndTurn(ownerId), organicOwner);
      organicTurns++;
      const observed = await page.evaluate(ownerId => window.__generalRuntime.campaignState(ownerId), organicOwner);
      const expectedStage = beforeGather + 1 >= 5 ? 'attacking' : 'gathering';
      check(`organic production turn ${organicTurns}: real troops muster without attack`,
        !step.timedOut && observed.campaign?.stage === expectedStage
          && observed.campaign.gatherTurnsCompleted === beforeGather + 1
          && step.attackCommands.length === 0,
        { beforeGather, expectedStage, step, observed });
      organicCampaign = observed.campaign;
    }
    check('organic production pipeline completes five full gather turns',
      organicCampaign?.stage === 'attacking' && organicCampaign.gatherTurnsCompleted === 5,
      { organicTurns, campaign: organicCampaign });
    const organicAttack = await page.evaluate(ownerId => window.__generalRuntime.runRealWorldEndTurn(ownerId), organicOwner);
    const organicIds = organicInitial.map(unit => unit.id).sort();
    const organicOrders = organicAttack.attackOrders.filter(order => organicIds.includes(order.unitId));
    const startById = new Map((organicAttack.aiDecision?.units ?? []).map(unit => [unit.id, unit]));
    const endById = new Map(organicAttack.army.map(unit => [unit.id, unit]));
    const fullyMoved = organicOrders.map(order => {
      const start = startById.get(order.unitId), end = endById.get(order.unitId);
      return { id: order.unitId, start, end,
        moved: !!start && !!end && (start.q !== end.q || start.r !== end.r),
        spentAllMovement: !!start && !!end && start.movement > 0 && end.movement === 0 };
    });
    check('sixth organic attack turn completed instead of timing out on a stale snapshot',
      organicAttack.timedOut === false && organicAttack.turn > organicAttack.beforeTurn
        && organicAttack.aiDecision?.stage === 'attacking'
        && organicAttack.aiDecision?.campaign?.gatherTurnsCompleted === 5,
      { beforeTurn: organicAttack.beforeTurn, turn: organicAttack.turn, timedOut: organicAttack.timedOut,
        aiDecision: organicAttack.aiDecision });
    check('sixth organic production turn orders every field unit to the nearest reachable capital',
      organicAttack.campaign?.stage === 'attacking' && organicOrders.length === organicIds.length
        && organicOrders.every(order => order.targetCityId === organicSetup.target.id),
      { expected: organicIds, orders: organicOrders, campaign: organicAttack.campaign, target: organicSetup.target });
    check('sixth organic production turn executes movement and spends each legal full movement budget',
      fullyMoved.length === organicIds.length && fullyMoved.every(unit => unit.moved && unit.spentAllMovement),
      fullyMoved);

    const fallen = await page.evaluate(ownerId => window.__generalRuntime.removeCampaignGeneralAfterBattle(ownerId), organicOwner);
    check('battle-casualty fixture removes the active physical General',
      !fallen.error && fallen.removedId === organicAttack.campaign?.generalUnitId, fallen);
    const afterDeathDiagnostics = await page.evaluate(ownerId => window.__generalRuntime.campaignRecruitDiagnostics(ownerId), organicOwner);
    check('unfunded casualty case begins below the replacement General Manpower cost',
      afterDeathDiagnostics.offer?.id && Number.isFinite(afterDeathDiagnostics.manpowerCost)
        && afterDeathDiagnostics.empireManpower < afterDeathDiagnostics.manpowerCost,
      afterDeathDiagnostics);
    const unaffordableTurn = await page.evaluate(ownerId => window.__generalRuntime.runRealWorldEndTurn(ownerId), organicOwner);
    const unaffordableState = await page.evaluate(ownerId => window.__generalRuntime.campaignState(ownerId), organicOwner);
    check('AI waits in recruiting without issuing attacks while a replacement is unaffordable',
      unaffordableTurn.timedOut === false && unaffordableTurn.turn > unaffordableTurn.beforeTurn
        && unaffordableState.campaign?.stage === 'recruiting'
        && !unaffordableState.queue.some(item => item.isGeneral)
        && !(unaffordableTurn.aiDecision?.commands ?? []).some(command => command.type === 'attack'),
      { unaffordableTurn, unaffordableState,
        diagnostics: await page.evaluate(ownerId => window.__generalRuntime.campaignRecruitDiagnostics(ownerId), organicOwner) });
    const replacementBudget = await page.evaluate(ownerId => window.__generalRuntime.fundCampaignRecruitment(ownerId), organicOwner);
    check('funded casualty case provides ordinary replacement recruitment costs',
      !replacementBudget.error && replacementBudget.offer?.id && replacementBudget.manpower > 0,
      replacementBudget);
    const recoveryTurn = await page.evaluate(ownerId => window.__generalRuntime.runRealWorldEndTurn(ownerId), organicOwner);
    const recovery = await page.evaluate(ownerId => window.__generalRuntime.campaignState(ownerId), organicOwner);
    check('real owner turn after General loss restarts recruitment before another attack',
      recoveryTurn.timedOut === false && recoveryTurn.turn > recoveryTurn.beforeTurn
        && recovery.campaign?.stage === 'recruiting'
        && recovery.campaign.gatherTurnsCompleted === 0
        && recovery.queue.some(item => item.isGeneral)
        && !(recoveryTurn.aiDecision?.commands ?? []).some(command => command.type === 'attack'),
      { recoveryTurn, recovery, fallen, afterDeathDiagnostics,
        postTurnDiagnostics: await page.evaluate(ownerId => window.__generalRuntime.campaignRecruitDiagnostics(ownerId), organicOwner) });
    let replacement = null;
    for (let i = 0; i < 6 && !replacement; i++) {
      await page.evaluate(ownerId => window.__generalRuntime.runRealWorldEndTurn(ownerId), organicOwner);
      const restored = await page.evaluate(ownerId => window.__generalRuntime.campaignState(ownerId), organicOwner);
      replacement = restored.generals.find(unit => unit.id !== fallen.removedId) ?? null;
    }
    const replacementCampaign = await page.evaluate(ownerId => window.__generalRuntime.refreshCampaign(ownerId), organicOwner);
    check('replacement physical General binds to a fresh gathering campaign after the casualty',
      !!replacement && replacementCampaign.campaign?.stage === 'gathering'
        && replacementCampaign.campaign.generalUnitId === replacement.id
        && replacementCampaign.campaign.gatherTurnsCompleted <= 1,
      { replacement, campaign: replacementCampaign.campaign });
    let replacementCampaignState = replacementCampaign.state;
    let replacementGatherTurns = 0;
    while ((replacementCampaignState.campaign?.gatherTurnsCompleted ?? 0) < 5 && replacementGatherTurns < 6) {
      const previousGather = replacementCampaignState.campaign?.gatherTurnsCompleted ?? 0;
      const step = await page.evaluate(ownerId => window.__generalRuntime.runRealWorldEndTurn(ownerId), organicOwner);
      replacementGatherTurns++;
      replacementCampaignState = await page.evaluate(ownerId => window.__generalRuntime.campaignState(ownerId), organicOwner);
      const expectedStage = previousGather + 1 >= 5 ? 'attacking' : 'gathering';
      check(`replacement General real turn ${replacementGatherTurns}: fresh gathering without attack`,
        step.turn > step.beforeTurn && replacementCampaignState.campaign?.stage === expectedStage
          && replacementCampaignState.campaign.gatherTurnsCompleted === previousGather + 1
          && !(step.aiDecision?.commands ?? []).some(command => command.type === 'attack'),
        { previousGather, expectedStage, step, state: replacementCampaignState });
    }
    check('replacement General completes a new five-turn muster',
      replacementCampaignState.campaign?.stage === 'attacking'
        && replacementCampaignState.campaign.gatherTurnsCompleted === 5,
      { replacementGatherTurns, campaign: replacementCampaignState.campaign });
    const replacementAttack = await page.evaluate(ownerId => window.__generalRuntime.runRealWorldEndTurn(ownerId), organicOwner);
    check('replacement attack turn completed on a fresh world turn without timeout',
      replacementAttack.timedOut === false && replacementAttack.turn > replacementAttack.beforeTurn
        && replacementAttack.aiDecision?.stage === 'attacking'
        && replacementAttack.aiDecision?.campaign?.generalUnitId === replacement?.id,
      { beforeTurn: replacementAttack.beforeTurn, turn: replacementAttack.turn,
        timedOut: replacementAttack.timedOut, aiDecision: replacementAttack.aiDecision });
    check('replacement General leads the renewed attack after five fresh muster turns',
      replacementAttack.campaign?.stage === 'attacking'
        && replacementAttack.campaign.generalUnitId === replacement?.id
        && replacementAttack.attackOrders.some(order => order.targetCityId === organicSetup.target.id),
      { replacementAttack: replacementAttack.campaign, orders: replacementAttack.attackOrders, replacement });

    console.log('Actual six-turn execution trace:', JSON.stringify(actualTurns.map((step, index) => ({
      turn: index + 1, campaign: step.campaign, perUnit: step.army, orders: step.attackOrders,
      aiDecision: step.aiDecision, warPlanDiagnostic: step.warPlanDiagnostic,
    }))));
    check('browser scenario completed without page errors', errors.length === 0, errors);
  } finally {
    server.kill('SIGTERM');
    await browser.close();
  }
  console.log(`\nai-general-war-campaign-live-test: ${pass} pass, ${fail} fail`);
  console.log(`EOT campaign evidence: five complete muster turns; sixth complete attack turn; elapsed ${Math.round((Date.now() - startedAt) / 1000)}s`);
  process.exitCode = fail ? 1 : 0;
}

main().catch(err => { console.error(err); process.exitCode = 1; });
