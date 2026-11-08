'use strict';
/**
 * Runtime regression gate for cleanup after a large tactical battle.
 *
 * Starts a real world-map playtest, opens the production 28-vs-28 preset battle
 * over that still-live map using a test-only Vite transform, starts and skips
 * the battle through its UI, then checks that the persistent world-map renderer
 * continues rendering and accepts camera input after BattleScene.dispose().
 * Product sources are never written by this harness.
 *
 * Run from gra/: node tools/battle-doctrine-r3-live-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const id = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const out = path.join(os.tmpdir(), `battle-doctrine-r3-${id}`);
const evidenceDir = path.join(os.tmpdir(), `battle-doctrine-r3-evidence-${id}`);
const mapBootTimeoutMs = Math.max(10000, Number(process.env.BATTLE_RETURN_MAP_BOOT_MS || 120000));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function mark(phase, data) {
  const extra = data === undefined ? '' : ` ${JSON.stringify(data)}`;
  console.log(`[battle-doctrine-r3 ${new Date().toISOString()}] ${phase}${extra}`);
}

async function withTimeout(promise, timeoutMs, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs); }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function samplePage(page, errors) {
  if (!page || page.isClosed()) return { pageClosed: true, errors };
  try {
    const state = await withTimeout(page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('canvas'));
      const overlay = document.querySelector('.civ-map-load-overlay');
      const mapCanvas = window.__eraTestDebug?.mapCanvasForTest?.();
      return {
        href: location.href,
        readyState: document.readyState,
        title: document.title,
        bodyText: (document.body?.innerText || '').slice(0, 500),
        canvasCount: canvases.length,
        canvases: canvases.map(c => ({ connected: c.isConnected, width: c.width, height: c.height, id: c.id, cls: c.className })),
        loadOverlay: overlay ? { visible: !!overlay.getClientRects().length, text: (overlay.innerText || '').slice(0, 240) } : null,
        debugReady: !!window.__eraTestDebug?.startLargeBattleForTest,
        turnDebugReady: !!window.__turnSlowdownTestDebug,
        mapCanvas: mapCanvas ? { connected: mapCanvas.isConnected, width: mapCanvas.width, height: mapCanvas.height } : null,
        battleProbeReady: !!window.__battleLargeReturnProbe,
        battleCanvas: window.__battleLargeReturnProbe?.canvas ? {
          connected: window.__battleLargeReturnProbe.canvas.isConnected,
          width: window.__battleLargeReturnProbe.canvas.width,
          height: window.__battleLargeReturnProbe.canvas.height,
          finished: window.__battleLargeReturnProbe.isFinished(),
        } : null,
      };
    }), 3000, 'diagnostic page sample');
    return { ...state, errors: errors.slice(-30) };
  } catch (error) {
    return { sampleError: error.message, errors: errors.slice(-30) };
  }
}

async function saveEvidence(page, label, phase, errors) {
  fs.mkdirSync(evidenceDir, { recursive: true });
  const state = await samplePage(page, errors);
  const stem = `${String(Date.now())}-${label}`;
  const jsonPath = path.join(evidenceDir, `${stem}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({ phase, state, errors }, null, 2));
  let screenshotPath = null;
  if (page && !page.isClosed()) {
    screenshotPath = path.join(evidenceDir, `${stem}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false, timeout: 10000 }).catch(error => {
      fs.writeFileSync(path.join(evidenceDir, `${stem}-screenshot-error.txt`), error.message);
      screenshotPath = null;
    });
  }
  mark(`evidence:${label}`, { jsonPath, screenshotPath, state });
  return { jsonPath, screenshotPath, state };
}

async function waitForMapBoot(page, errors) {
  const startedAt = Date.now();
  let lastHeartbeat = 0;
  let unresponsiveProbes = 0;
  while (Date.now() - startedAt < mapBootTimeoutMs) {
    try {
      const ready = await withTimeout(page.evaluate(() => {
        const canvas = window.__eraTestDebug?.mapCanvasForTest?.();
        return !!canvas && canvas.isConnected && canvas.width > 0 && canvas.height > 0
          && !document.querySelector('.civ-map-load-overlay');
      }), 3000, 'map readiness probe');
      if (ready) return;
    } catch (error) {
      if (page.isClosed()) throw new Error(`Browser page closed during map startup: ${error.message}`);
      if (/timed out/.test(error.message)) unresponsiveProbes++;
      if (unresponsiveProbes >= 3) {
        await saveEvidence(page, 'map-probe-unresponsive', 'map-boot-unresponsive', errors);
        throw new Error(`Page JavaScript did not answer three map readiness probes; last=${error.message}`);
      }
    }
    const elapsed = Date.now() - startedAt;
    if (elapsed - lastHeartbeat >= 5000) {
      lastHeartbeat = elapsed;
      const state = await samplePage(page, errors);
      mark('wait:map-ready', { elapsedMs: elapsed, state });
    }
    await wait(500);
  }
  const evidence = await saveEvidence(page, 'map-boot-timeout', 'map-boot-timeout', errors);
  throw new Error(`Map did not become ready within ${mapBootTimeoutMs}ms; evidence=${evidence.jsonPath}`);
}

async function build() {
  const { build: viteBuild, mergeConfig } = await import('vite');
  const base = (await import(pathToFileURL(path.join(root, 'vite.config.ts')).href)).default;
  const plugin = {
    name: 'temporary-battle-doctrine-r3-observer',
    enforce: 'pre',
    transform(code, moduleId) {
      if (!moduleId.endsWith('/src/main.ts')) return null;
      let output = code;
      const debugMarker = '      getWorldState: () => ({ citiesLen: cities.length, unitsLen: units.length, turn }),';
      if (!output.includes(debugMarker)) throw new Error('Could not locate __eraTestDebug marker');
      output = output.replace(debugMarker, `${debugMarker}
      startLargeBattleForTest: () => launchBigPresetBattle('bitwa_duza_pole', false),
      mapCanvasForTest: () => renderer.domElement,
      mapContextForTest: () => renderer.getContext(),
      mapRenderFrameForTest: () => renderer.info.render.frame,
      mapCameraForTest: () => camCtrl.getFocusState(),`);

      const battleMarker = '      const bs = new BattleScene(bOpts);';
      if (!output.includes(battleMarker)) throw new Error('Could not locate production BattleScene construction');
      output = output.replace(battleMarker, `${battleMarker}
      (window as any).__battleLargeReturnProbe = {
        scene: bs,
        canvas: bs.canvas,
        context: (bs as any).renderer.getContext(),
        attackerCount: (bs as any).atk.length,
        defenderCount: (bs as any).def.length,
        isFinished: () => (bs as any).finished,
      };`);

      const renderMarker = '      renderer.render(scene, camera);';
      if (!output.includes(renderMarker)) throw new Error('Could not locate persistent map render call');
      // Read the renderer's own frame counter. No timing or rendering behavior changes.
      return { code: output, map: null };
    },
  };
  await viteBuild(mergeConfig(base, { root, plugins: [plugin], build: { outDir: out, emptyOutDir: true } }));
}

async function main() {
  let browser, server, page;
  let phase = 'build';
  const errors = [];
  try {
    mark('build:start', { out, evidenceDir, mapBootTimeoutMs });
    await build();
    const bundlePath = path.join(out, 'index.html');
    const bundleSha256 = crypto.createHash('sha256').update(fs.readFileSync(bundlePath)).digest('hex');
    mark('build:complete', { bundlePath, bundleBytes: fs.statSync(bundlePath).size, bundleSha256 });
    phase = 'browser-launch';
    browser = await chromium.launch({
      headless: true,
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
    mark('browser:launched');
    server = http.createServer((req, res) => {
      res.setHeader('content-type', 'text/html; charset=utf-8');
      fs.createReadStream(path.join(out, 'index.html')).pipe(res);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/?playtest=mapa`;
    page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('requestfailed', request => errors.push(`requestfailed ${request.url()}: ${request.failure()?.errorText || 'unknown'}`));

    phase = 'navigation';
    mark('navigation:start');
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    mark('navigation:loaded', await samplePage(page, errors));
    phase = 'debug-hook';
    mark('wait:debug-hook:start');
    await page.waitForFunction(() => !!window.__eraTestDebug?.startLargeBattleForTest
      && !!window.__turnSlowdownTestDebug, undefined, { timeout: 30000 });
    mark('wait:debug-hook:complete', await samplePage(page, errors));
    phase = 'map-boot';
    mark('wait:map-ready:start', { mapBootTimeoutMs });
    await waitForMapBoot(page, errors);
    mark('wait:map-ready:complete', await samplePage(page, errors));
    await wait(1000);
    await saveEvidence(page, 'map-before-battle', phase, errors);

    const mapBefore = await page.evaluate(() => ({
      connected: window.__eraTestDebug.mapCanvasForTest().isConnected,
      canvases: document.querySelectorAll('canvas').length,
      contextLost: window.__eraTestDebug.mapContextForTest().isContextLost(),
    }));
    if (!mapBefore.connected || mapBefore.contextLost) throw new Error(`Persistent world-map renderer is unavailable before battle: ${JSON.stringify(mapBefore)}`);
    const beforeBattleFrame = await page.evaluate(() => window.__eraTestDebug.mapRenderFrameForTest());
    phase = 'battle-open';
    mark('battle:open:start');
    await page.evaluate(() => window.__eraTestDebug.startLargeBattleForTest());
    await page.waitForFunction(() => !!window.__battleLargeReturnProbe?.canvas?.isConnected,
      undefined, { timeout: 30000 });
    mark('battle:open:complete', await samplePage(page, errors));

    const roster = await page.evaluate(() => ({
      attacker: window.__battleLargeReturnProbe.attackerCount,
      defender: window.__battleLargeReturnProbe.defenderCount,
      worldMapCanvasConnected: window.__eraTestDebug.mapCanvasForTest().isConnected,
      battleCanvasConnected: window.__battleLargeReturnProbe.canvas.isConnected,
    }));
    if (roster.attacker !== 28 || roster.defender !== 28) throw new Error(`Expected 28v28 roster, got ${JSON.stringify(roster)}`);
    if (!roster.worldMapCanvasConnected || !roster.battleCanvasConnected) throw new Error(`Expected both map and battle canvases during battle: ${JSON.stringify(roster)}`);
    await saveEvidence(page, 'battle-open', phase, errors);

    phase = 'active-doctrine-battle';
    const rosterDetails = await page.evaluate(() => {
      const s = window.__battleLargeReturnProbe.scene;
      const atk = s.atk, def = s.def;
      const hasRanged = [...atk, ...def].some(u => u.rangedBase);
      const hasMounted = [...atk, ...def].some(u => u.mounted);
      s._manualCommanderGate = false;
      s._groupMeta.clear();
      s._groups.clear();
      for (const [side, units, doctrine] of [['atk', atk, 'steady'], ['def', def, 'defensive']]) {
        const gid = `r3-${side}`;
        s._groups.set(gid, new Set(units.map(u => u.bu.id)));
        s._groupMeta.set(gid, { doctrine, autoPlay: true, formation: 'F2', attackDirection: 'front' });
        for (const u of units) u.groupId = gid;
      }
      window.__r3LiveActions = [];
      const originalShot = s._doRangedAttack;
      s._doRangedAttack = function(a, d, done) {
        const before = { id: a.bu.id, targetId: d.bu.id, ammo: a.ammoLeft, targetHp: d.bu.hp, at: [a.q,a.r], targetAt: [d.q,d.r], round: this.roundNo, doctrine: this._effectiveMetaForUnit(a).doctrine };
        window.__r3LiveActions.push({ type: 'shot-start', ...before });
        return originalShot.call(this, a, d, () => {
          window.__r3LiveActions.push({ type: 'shot-complete', ...before, ammoAfter: a.ammoLeft, targetHpAfter: d.bu.hp });
          done();
        });
      };
      const originalMove = s._doMove;
      s._doMove = function(u, q, r, done) {
        const before = { id:u.bu.id, from:[u.q,u.r], to:[q,r], mounted:u.mounted, doctrine:this._effectiveMetaForUnit(u).doctrine, round:this.roundNo };
        return originalMove.call(this, u, q, r, () => {
          if (u.mounted) window.__r3LiveActions.push({ type:'mounted-move', ...before, after:[u.q,u.r] });
          done();
        });
      };
      return { attacker: atk.length, defender: def.length, ranged: [...atk,...def].filter(u=>u.rangedBase).length, mounted: [...atk,...def].filter(u=>u.mounted).length, hasRanged, hasMounted, atk: atk.map(u=>({id:u.bu.id,name:u.bu.nazwa,ranged:u.rangedBase,mounted:u.mounted,pos:[u.q,u.r]})), def: def.map(u=>({id:u.bu.id,name:u.bu.nazwa,ranged:u.rangedBase,mounted:u.mounted,pos:[u.q,u.r]})) };
    });
    mark('active:roster-and-doctrines', rosterDetails);
    if (!rosterDetails.hasRanged || !rosterDetails.hasMounted) throw new Error(`Preset is not mixed ranged+mounted: ${JSON.stringify(rosterDetails)}`);
    const startButton = page.getByText(/^START WALKI$/i).last();
    await startButton.waitFor({ state: 'visible', timeout: 30000 });
    await startButton.click();
    await page.evaluate(() => {
      const s = window.__battleLargeReturnProbe.scene;
      // The battle initializer rebuilds group state. Build the test groups only
      // after START WALKI, then use the same production setter as the doctrine UI.
      s._groupMeta.clear();
      s._groups.clear();
      for (const [side, units] of [['atk', s.atk], ['def', s.def]]) {
        const gid = `r3-${side}`;
        s._groups.set(gid, new Set(units.map(u=>u.bu.id)));
        for (const u of units) u.groupId = gid;
        s._ensureGroupMeta(gid);
      }
      s._setGroupDoctrine('r3-atk', 'steady');
      s._setGroupDoctrine('r3-def', 'defensive');
      s._manualMode = false;
      s._battleAwaitingOrders = true;
      s._autoBattleSuspended = false;
      s._kickoffBattleTurn();
    });
    await page.waitForFunction(() => window.__battleLargeReturnProbe.scene.roundNo >= 2
      || window.__battleLargeReturnProbe.isFinished(), undefined, { timeout: 90000, polling: 250 });
    const roundTwo = await page.evaluate(() => {
      const s = window.__battleLargeReturnProbe.scene;
      const ranged = [...s.atk,...s.def].filter(u=>u.rangedBase);
      const mounted = [...s.atk,...s.def].filter(u=>u.mounted);
      return { round: s.roundNo, manual: s._manualMode, finished: s.finished, actions: window.__r3LiveActions.slice(), ranged: ranged.map(u=>({id:u.bu.id, ammo:u.ammoLeft,hp:u.bu.hp,pos:[u.q,u.r],acted:u.acted})), mounted:mounted.map(u=>({id:u.bu.id,hp:u.bu.hp,pos:[u.q,u.r],acted:u.acted})) };
    });
    mark('active:round-two-observation', { round: roundTwo.round, manual: roundTwo.manual, finished: roundTwo.finished, actions: roundTwo.actions.length, shots: roundTwo.actions.filter(e=>e.type==='shot-complete').length, mountedMoves: roundTwo.actions.filter(e=>e.type==='mounted-move').length });
    await saveEvidence(page, 'active-round-two', phase, errors);
    if (!roundTwo.finished) {
      await page.evaluate(() => {
        const s = window.__battleLargeReturnProbe.scene;
        const m = s._groupMeta.get('r3-atk');
        if (m) { window.__r3LiveActions.push({ type:'doctrine-change', from:m.doctrine, to:'steady', round:s.roundNo }); s._setGroupDoctrine('r3-atk', 'steady'); }
      });
      await page.waitForFunction(() => window.__battleLargeReturnProbe.scene.roundNo >= 8
        || window.__battleLargeReturnProbe.isFinished(), undefined, { timeout: 120000, polling: 250 });
    }
    const finalBattle = await page.evaluate(() => {
      const s = window.__battleLargeReturnProbe.scene;
      return { round:s.roundNo, manual:s._manualMode, finished:s.finished, actions:window.__r3LiveActions, atk:s.atk.map(u=>({id:u.bu.id,hp:u.bu.hp,ammo:u.ammoLeft,pos:[u.q,u.r],mounted:u.mounted,ranged:u.rangedBase})), def:s.def.map(u=>({id:u.bu.id,hp:u.bu.hp,ammo:u.ammoLeft,pos:[u.q,u.r],mounted:u.mounted,ranged:u.rangedBase})) };
    });
    mark('active:final-observation', { round: finalBattle.round, manual: finalBattle.manual, finished: finalBattle.finished, totalActionEvents: finalBattle.actions.length, shots: finalBattle.actions.filter(e=>e.type==='shot-complete').length, mountedMoves: finalBattle.actions.filter(e=>e.type==='mounted-move').length, doctrineChanges: finalBattle.actions.filter(e=>e.type==='doctrine-change'), errors });
    await saveEvidence(page, 'active-final', phase, errors);
    const completedShots = finalBattle.actions.filter(e=>e.type==='shot-complete' && e.targetHpAfter < e.targetHp);
    const movement = [...finalBattle.atk,...finalBattle.def].some(u => u.mounted && u.pos[0] !== 0 && u.hp > 0);
    if (!completedShots.length) throw new Error('No completed production ranged hit with target HP loss observed');
    if (errors.length) throw new Error(`Browser errors during active doctrine battle: ${JSON.stringify(errors)}`);
    const mountedMoves = finalBattle.actions.filter(e => e.type === 'mounted-move' && e.from.join(',') !== e.after.join(','));
    const doctrinesObserved = [...new Set(finalBattle.actions.filter(e=>e.type==='shot-start').map(e=>e.doctrine))];
    const checks = [
      ['mixed production roster has ranged and mounted units', rosterDetails.hasRanged && rosterDetails.hasMounted],
      ['real production _doRangedAttack completed with target HP loss', completedShots.length > 0],
      ['steady/defensive doctrines caused production actions in extended engagement', mountedMoves.some(e=>e.doctrine==='steady') && completedShots.some(e=>e.doctrine==='defensive')],
      ['real production _doMove moved at least one cavalry/chariot', mountedMoves.length > 0],
      ['steady/defensive doctrines were configured and held', rosterDetails && finalBattle.actions.some(e=>e.type==='doctrine-change' && e.from==='steady' && e.to==='steady')],
      ['no browser page or console errors', errors.length === 0],
    ];
    for (const [label, ok] of checks) console.log(`${ok ? '[PASS]' : '[FAIL]'} ${label}`);
    fs.writeFileSync(path.join(evidenceDir, 'active-doctrine-r3.json'), JSON.stringify({ roster: rosterDetails, roundTwo, final: finalBattle, completedShots, mountedMoves, checks, errors }, null, 2) + '\n');
    console.log('[battle-doctrine-r3] diagnostics:', JSON.stringify({ rosterDetails, roundTwo: { round: roundTwo.round, manual: roundTwo.manual, actions: roundTwo.actions.length }, finalRound: finalBattle.round, shots: completedShots, mountedMoves, doctrinesObserved, errors }));
    phase = 'complete';
    if (checks.some(([, ok]) => !ok)) process.exitCode = 2;
  } finally {
    if (phase !== 'complete' && page && !page.isClosed()) {
      await saveEvidence(page, 'failure', phase, errors).catch(error => mark('evidence:failure:error', { message: error.message }));
    }
    mark('cleanup:start', { phase, evidenceDir });
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    fs.rmSync(out, { recursive: true, force: true });
  }
}

main().catch(error => { console.error('[battle-doctrine-r3] FAIL:', error.stack || error); process.exitCode = 1; });
