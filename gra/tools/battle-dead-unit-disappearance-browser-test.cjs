'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const evidence = path.resolve(root, '..', 'dyspozycje/autobot/runs/R-BITWA-DEAD-UNIT-DISAPPEARS-Q2/evidence');
fs.mkdirSync(evidence, { recursive: true });

async function runScene(browser, siege) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', r => errors.push(`requestfailed:${r.url()}:${r.failure()?.errorText}`));
  const url = `http://127.0.0.1:${server.httpServer.address().port}/tools/battle-dead-unit-browser-entry.html${siege ? '?siege=1' : ''}`;
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__deadUnitBrowser?.ready === true, undefined, { timeout: 60000 });
  const kind = siege ? 'siege' : 'field';
  await page.screenshot({ path: path.join(evidence, `${kind}-before.png`), timeout: 20000 });
  const result = await page.evaluate((isSiege) => {
    const s = window.__deadUnitBrowser.scene;
    if (!s.atk.length || !s.def.length) throw new Error(`empty browser armies ${JSON.stringify({atk:s.atk.length,def:s.def.length,siege:isSiege})}`);
    const observations = [];
    const oldRandom = Math.random;
    const verifyDetached = (kind, d, damage) => ({
      kind, damage, hp: d.bu.hp, dead: d.dead, removed: d.removed,
      bodyDetached: d.group.parent === null, hpBarDetached: d.hpBarGroup.parent === null,
      bodyHidden: d.group.visible === false, hpBarHidden: d.hpBarGroup.visible === false,
      tileReleased: !s.occByKey.has(`${d.q},${d.r}`),
    });
    try {
      Math.random = () => 0;
      const melee = s.atk.find(u => !u.dead && !u.rangedBase && !u.mounted);
      const meleeTarget = s.def.find(u => !u.dead && !u.routed && !u.rangedBase && !u.removed);
      if (!melee || !meleeTarget) throw new Error(`missing melee case ${JSON.stringify({atk:s.atk.length,def:s.def.length,atkRoles:s.atk.slice(0,3).map(u=>[u.bu.nazwa,u.rangedBase,u.mounted]),defRoles:s.def.slice(0,3).map(u=>[u.bu.nazwa,u.rangedBase,u.mounted])})}`);
      meleeTarget.bu.hp = 1; meleeTarget.morale = 100; meleeTarget.fleeMorale = -100;
      observations.push(verifyDetached('melee-single-blow', meleeTarget, s._singleBlow(melee, meleeTarget, false)));

      const shooter = s.atk.find(u => !u.dead && u.rangedBase && u.ammoLeft > 0);
      const missileTarget = s.def.find(u => !u.dead && !u.routed && !u.rangedBase && !u.removed);
      missileTarget.bu.hp = 1; missileTarget.morale = 100; missileTarget.fleeMorale = -100;
      observations.push(verifyDetached('missile-single-blow', missileTarget, s._singleBlow(shooter, missileTarget, true)));

      // A volley resolves one production landed-shot per target; all members of the eliminated stack must detach.
      const volleyTargets = s.def.filter(u => !u.dead && !u.routed && !u.rangedBase && !u.removed).slice(0, 3);
      for (const target of volleyTargets) {
        target.bu.hp = 1; target.morale = 100; target.fleeMorale = -100;
        observations.push(verifyDetached('multi-target-volley', target, s._singleBlow(shooter, target, true)));
      }

      // A routed survivor remains rendered, with its surviving HP, until it exits the field.
      const runner = s.atk.find(u => !u.dead && !u.rangedBase && !u.mounted && !u.removed);
      runner.bu.hp = 40; const runnerGroup = runner.group; const runnerBar = runner.hpBarGroup;
      s._startRout(runner);
      observations.push({ kind: 'living-rout-control', routed: runner.routed, hp: runner.bu.hp,
        bodyAttached: runnerGroup.parent !== null, hpBarAttached: runnerBar.parent !== null,
        bodyVisible: runnerGroup.visible, hpBarVisible: runnerBar.visible });

      // Mutation proof: a no-op scene-removal helper makes the lethal-path assertion fail.
      const mutationTarget = s.def.find(u => !u.dead && !u.routed && !u.rangedBase && !u.removed);
      mutationTarget.bu.hp = 1; mutationTarget.morale = 100; mutationTarget.fleeMorale = -100;
      const remove0 = s._removeUnitFromScene;
      s._removeUnitFromScene = function () {};
      Math.random = () => 0;
      s._singleBlow(melee, mutationTarget, false);
      const mutationDetected = mutationTarget.group.parent !== null && mutationTarget.group.visible === true;
      s._removeUnitFromScene = remove0;
      if (mutationTarget.group.parent !== null) remove0.call(s, mutationTarget);
      observations.push({ kind: 'mutation-no-detach', detected: mutationDetected });

      let siegeCollapse = null;
      if (isSiege) {
        const catapult = s.def.find(u => u.bu.id === 'audit-defender-catapult');
        const row = s.siegeGateRow + 2;
        const col = s.siegeWallCol;
        s.occByKey.delete(`${catapult.q},${catapult.r}`);
        catapult.q = col; catapult.r = row; catapult.onWallWalkway = true;
        catapult.group.position.set(col, 0, row); catapult.hpBarGroup.position.set(col, 2.5, row);
        s.occByKey.set(`${col},${row}`, catapult);
        const body = catapult.group; const bar = catapult.hpBarGroup;
        s._breachWallTile(row);
        siegeCollapse = { kind: 'siege-wall-collapse-catapult', dead: catapult.dead, removed: catapult.removed,
          bodyDetached: body.parent === null, hpBarDetached: bar.parent === null,
          tileReleased: !s.occByKey.has(`${col},${row}`) };
        observations.push(siegeCollapse);
      }

      // Replay recreates runtime unit objects from saved BattleUnits; verify a fresh unit can die cleanly.
      const oldId = s.atk.find(u => !u.dead && !u.removed)?.bu.id;
      const oldObject = s.atk.find(u => u.bu.id === oldId);
      s._replayBattle();
      const replayFresh = s.atk.find(u => u.bu.id === oldId);
      let replayObservation = { kind: 'replay-recreation', priorObjectReplaced: !!replayFresh && replayFresh !== oldObject,
        roster: [s.atk.length, s.def.length], live: !!replayFresh && !replayFresh.dead && !replayFresh.removed };
      if (replayFresh) {
        const target = s.def.find(u => !u.dead && !u.routed && !u.removed);
        target.bu.hp = 1; target.morale = 100; target.fleeMorale = -100;
        replayObservation = { ...replayObservation, afterFreshKill: verifyDetached('replay-fresh-unit-kill', target,
          s._singleBlow(replayFresh, target, false)) };
      }
      observations.push(replayObservation);
      return { siege: isSiege, expectedRoster: [28, isSiege ? 29 : 28], roster: [s.atk.length, s.def.length], observations };
    } finally { Math.random = oldRandom; }
  }, siege);
  await page.screenshot({ path: path.join(evidence, `${kind}-after.png`), timeout: 20000 });
  await page.close();
  return { ...result, errors };
}

let server;
let browser;
(async () => {
  server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const results = [await runScene(browser, false), await runScene(browser, true)];
  const report = { generatedAt: new Date().toISOString(), results };
  fs.writeFileSync(path.join(evidence, 'browser-audit.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  const failures = results.flatMap(scene => scene.observations.filter(o => {
    if (o.kind === 'living-rout-control') return !o.routed || o.hp !== 40 || !o.bodyAttached || !o.hpBarAttached || !o.bodyVisible || !o.hpBarVisible;
    if (o.kind === 'mutation-no-detach') return !o.detected;
    if (o.kind === 'siege-wall-collapse-catapult') return !o.dead || !o.removed || !o.bodyDetached || !o.hpBarDetached || !o.tileReleased;
    if (o.kind === 'replay-recreation') return !o.priorObjectReplaced || !o.live || o.roster[0] !== scene.expectedRoster[0] || o.roster[1] !== scene.expectedRoster[1];
    if (o.kind === 'replay-fresh-unit-kill') return o.damage <= 0 || !o.dead || !o.removed || !o.bodyDetached || !o.hpBarDetached || !o.tileReleased;
    return o.damage <= 0 || !o.dead || !o.removed || !o.bodyDetached || !o.hpBarDetached || !o.bodyHidden || !o.hpBarHidden || !o.tileReleased;
  }));
  if (results.some(r => r.errors.length) || failures.length) throw new Error(`browser audit failed: ${JSON.stringify({errors: results.map(r => r.errors), failures})}`);
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (server) await server.close();
});
