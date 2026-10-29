'use strict';
/** Real Chromium BattleScene probe: mixed 42v42 roster across doctrines and deployments. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');

const root = path.resolve(__dirname, '..');
const evidenceDir = path.resolve(root, '..', 'dyspozycje/autobot/runs/R-BITWA-ATAK-LUCZNICY-POZA-ZASIEGIEM-Q1/evidence');

async function main() {
  fs.mkdirSync(evidenceDir, { recursive: true });
  const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, strictPort: false } });
  let browser;
  const browserErrors = [];
  const httpErrors = [];
  try {
    await server.listen();
    const address = server.httpServer.address();
    browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => browserErrors.push({ kind: 'pageerror', text: e.message }));
    page.on('console', m => { if (m.type() === 'error') browserErrors.push({ kind: 'console', text: m.text(), location: m.location() }); });
    page.on('requestfailed', r => browserErrors.push(`requestfailed:${r.url()}:${r.failure()?.errorText}`));
    page.on('response', r => { if (r.status() >= 400) httpErrors.push({ status: r.status(), url: r.url() }); });
    await page.goto(`http://127.0.0.1:${address.port}/tools/battle-ranged-approach-browser-entry.html`,
      { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__largeMixedReady === true, undefined, { timeout: 60000 });
    const cases = process.env.FOCUSED === '1' ? [
      { doctrine: 'steady', archerLines: 2, terrain: 'Las', focusedRanged: 'in-range' },
    ] : process.env.FOCUSED === 'approach' ? [
      { doctrine: 'steady', archerLines: 2, terrain: 'Las', focusedRanged: 'approach' },
    ] : [
      { doctrine: 'steady', archerLines: 1, terrain: 'Rownina' },
      { doctrine: 'steady', archerLines: 2, terrain: 'Las' },
      { doctrine: 'defensive', archerLines: 1, terrain: 'Wzgórza' },
      { doctrine: 'defensive', archerLines: 2, terrain: 'Rzeka' },
      { doctrine: 'aggressive', archerLines: 1, terrain: 'Rownina' },
      { doctrine: 'aggressive', archerLines: 2, terrain: 'Las' },
    ];
    const results = [];
    for (const testCase of cases) {
      results.push(await page.evaluate(async options => window.__runLargeMixedScenario(options.doctrine,
        options.archerLines, options.terrain, options.focusedRanged || false), testCase));
    }
    const summary = results.map(result => ({
      doctrine: result.doctrine, archerLines: result.archerLines, terrain: result.terrain,
      roster: result.roster,
      deployment: result.formation,
      actions: result.actions,
      activationTrace: result.activationTrace,
      ...(process.env.FOCUSED ? { forcedShotSetup: result.forcedShotSetup, events: result.events } : {}),
    }));
    const report = { title: 'Production BattleScene Chromium mixed-army probe',
      timestamp: new Date().toISOString(), environment: { browser: 'Chromium headless', viewport: '1280x800',
      testRosterPerSide: 42, runnerDoesNotInvokeFullAutoTurn: true }, cases: summary, browserErrors, httpErrors,
      limitation: 'Each case constructs the real BattleScene, production terrain/deployment, and executes one production activation per role per side through actual movement/attack/projectile/HP paths. It does not simulate a complete battle or every unit activation; one/two archer-line preference is captured from actual production deployment.' };
    const reportName = process.env.FOCUSED === 'approach' ? 'chromium-ranged-approach-probe-report.json'
      : 'chromium-ranged-attack-probe-report.json';
    fs.writeFileSync(path.join(evidenceDir, reportName), JSON.stringify(report, null, 2) + '\n');
    await page.screenshot({ path: path.join(evidenceDir, 'chromium-mixed-army-last-scene.png'), timeout: 15000 });
    console.log(JSON.stringify({ cases: summary.map(({ doctrine, archerLines, terrain, actions }) => ({ doctrine, archerLines, terrain, actions })), browserErrors,
      report: path.join(evidenceDir, reportName) }, null, 2));
    const actionableHttpErrors = httpErrors.filter(x => !/\/favicon\.ico(?:\?|$)/.test(x.url));
    const actionableConsoleErrors = browserErrors.filter(e => e.kind !== 'console'
      || !/Failed to load resource: the server responded with a status of 404/.test(e.text)
      || !/\/favicon\.ico(?:\?|$)/.test(String(e.location?.url ?? '')));
    if (actionableConsoleErrors.length || actionableHttpErrors.length)
      throw new Error(`Chromium errors: ${JSON.stringify({ browserErrors, actionableHttpErrors })}`);
    for (const result of results) {
      if (result.roster.atk !== 42 || result.roster.def !== 42 || !result.roster.occupancyValid)
        throw new Error(`Invalid 42v42 production fixture: ${JSON.stringify(result.roster)}`);
      if (process.env.FOCUSED === '1') {
        if (!result.actions.rangedAttacks || !result.actions.rangedAmmoSpent)
          throw new Error(`No actual ranged firing/ammo expenditure in focused probe: ${JSON.stringify(result.actions)}`);
      } else if (process.env.FOCUSED === 'approach') {
        const starts = result.activationTrace.filter(x => x.start);
        const firstEnd = result.activationTrace.find(x => x.end && x.activation === 1);
        const rangedShot = result.events.find(x => x.type === 'attack' && x.ranged);
        if (starts.length < 2 || !result.actions.movement)
          throw new Error(`Out-of-range archer failed to move through >=2 activations: ${JSON.stringify({ starts, actions: result.actions })}`);
        if (starts[0].distance <= starts[0].range || !firstEnd || firstEnd.distance > starts[0].distance)
          throw new Error(`Out-of-range archer moved away instead of closing: ${JSON.stringify({ starts, firstEnd })}`);
        if (!result.actions.rangedAttacks || !result.actions.rangedAmmoSpent
            || !rangedShot || rangedShot.distance > rangedShot.range)
          throw new Error(`Out-of-range archer did not later shoot: ${JSON.stringify({ starts, actions: result.actions })}`);
      } else if (results.every(x => x.roster.atk === 42 && x.roster.def === 42)) {
        const aggregate = results.reduce((a, x) => ({ movement: a.movement + x.actions.movement,
          meleeAttacks: a.meleeAttacks + x.actions.meleeAttacks, hpLossEvents: a.hpLossEvents + x.actions.hpLossEvents,
          mountedActions: a.mountedActions + x.actions.mountedActions }),
          { movement: 0, meleeAttacks: 0, hpLossEvents: 0, mountedActions: 0 });
        if (!aggregate.movement || !aggregate.meleeAttacks || !aggregate.hpLossEvents || !aggregate.mountedActions)
          throw new Error(`No aggregate production movement/melee/HP/mounted evidence: ${JSON.stringify(aggregate)}`);
      }
    }
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
