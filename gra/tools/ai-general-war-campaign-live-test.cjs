'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawn } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const DIST = '/tmp/civ-ai-general-war-campaign-live';
const CHROME = process.env.CHROMIUM_PATH
  || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const TOTAL_TIMEOUT_MS = 6 * 60 * 1000;
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

    await page.evaluate(() => window.__generalRuntime.finishRecruitmentByTurn());
    await page.waitForFunction(ownerId => window.__generalRuntime.campaignState(ownerId).generals.length > 0,
      aiOwner, { timeout: Math.max(120000, TOTAL_TIMEOUT_MS - (Date.now() - startedAt)), polling: 500 });
    const refreshed = await page.evaluate(ownerId => window.__generalRuntime.refreshCampaign(ownerId), aiOwner);
    let state = refreshed.state;
    check('queued AI General spawns into the live world', state.generals.length >= 1, state);
    check('next AI owner-turn preparation binds the spawned General to the live campaign',
      refreshed.campaign?.generalUnitId && state.generals.some(g => g.id === refreshed.campaign.generalUnitId), refreshed);
    if (!refreshed.campaign?.generalUnitId) throw new Error('Live campaign did not bind the spawned General');
    const troop = await page.evaluate(ownerId => window.__generalRuntime.addCampaignTroop(ownerId), aiOwner);
    check('test fixture supplies one mobile AI unit for an attack-order assertion', !troop.error, troop);

    const muster = [];
    while ((state.campaign?.gatherTurnsCompleted ?? 0) < 5 && muster.length < 5) {
      if (Date.now() - startedAt > TOTAL_TIMEOUT_MS) throw new Error('Bounded scenario exceeded six-minute limit');
      const step = await page.evaluate(ownerId => window.__generalRuntime.runCampaignPlannerTurn(ownerId), aiOwner);
      muster.push(step);
      check(`live AI planner gather boundary ${muster.length}: no attack command`,
        step.stageBefore === 'gathering' && step.attackCount === 0 && step.targetId === 0, step);
      state = await page.evaluate(ownerId => window.__generalRuntime.campaignState(ownerId), aiOwner);
      if (step.error) throw new Error('Campaign planner failed: ' + JSON.stringify(step));
    }
    check('exactly five complete campaign muster turns are recorded',
      state.campaign?.gatherTurnsCompleted === 5 && state.campaign?.stage === 'attacking', { state, muster });
    const attackPosition = await page.evaluate(ownerId => window.__generalRuntime.positionCampaignTroopForAttack(ownerId), aiOwner);
    check('attack-order fixture has a passable unit adjacent to the player capital', !attackPosition.error, attackPosition);
    const attack = await page.evaluate(ownerId => window.__generalRuntime.runCampaignPlannerTurn(ownerId), aiOwner);
    check('sixth AI planner turn orders the assembled roster against the selected human capital',
      attack.stageBefore === 'attacking' && attack.attackCount === 0
        && attack.movementCount > 0 && attack.targetId === 0
        && attack.movementTargets.every(x => x.targetCityId === attack.targetCityId), attack);
    const persisted = await page.evaluate(ownerId => window.__generalRuntime.campaignSaveRoundTrip(ownerId), aiOwner);
    check('active attack-stage campaign survives production save metadata roundtrip', persisted.ok === true, persisted);
    check('browser scenario completed without page errors', errors.length === 0, errors);
  } finally {
    server.kill('SIGTERM');
    await browser.close();
  }
  console.log(`\nai-general-war-campaign-live-test: ${pass} pass, ${fail} fail`);
  process.exitCode = fail ? 1 : 0;
}

main().catch(err => { console.error(err); process.exitCode = 1; });
