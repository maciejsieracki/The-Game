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
    const onset = await page.evaluate(ownerId => window.__generalRuntime.beginWarCampaign(ownerId, 0), aiOwner);
    check('war onset selects player owner 0 as the active enemy target', onset.campaign?.target?.ownerId === 0, onset);
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
