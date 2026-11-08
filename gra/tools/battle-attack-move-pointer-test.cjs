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
 * Run from gra/: node tools/battle-attack-move-pointer-live-test.cjs
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
const out = path.join(os.tmpdir(), `battle-attack-move-pointer-${id}`);
const evidenceDir = path.join(os.tmpdir(), `battle-attack-move-pointer-evidence-${id}`);
const mapBootTimeoutMs = Math.max(10000, Number(process.env.BATTLE_RETURN_MAP_BOOT_MS || 120000));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function mark(phase, data) {
  const extra = data === undefined ? '' : ` ${JSON.stringify(data)}`;
  console.log(`[battle-attack-move-pointer ${new Date().toISOString()}] ${phase}${extra}`);
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
    name: 'temporary-battle-attack-move-pointer-observer',
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
      output = output.replace(battleMarker, `      // Keep the production renderer and pointer path responsive in headless CI.
      bOpts.attacker = bOpts.attacker.slice(0, 1);
      bOpts.defender = bOpts.defender.slice(0, 1);
      const bs = new BattleScene(bOpts);
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
    // Battle playtest can open while the unrelated world-map generation overlay
    // is still visible. Remove that cover so real mouse input reaches the battle.
    await page.evaluate(() => document.querySelector('.civ-map-load-overlay')?.remove());
    mark('battle:open:complete', await samplePage(page, errors));

    const roster = await page.evaluate(() => ({
      attacker: window.__battleLargeReturnProbe.attackerCount,
      defender: window.__battleLargeReturnProbe.defenderCount,
      worldMapCanvasConnected: window.__eraTestDebug.mapCanvasForTest().isConnected,
      battleCanvasConnected: window.__battleLargeReturnProbe.canvas.isConnected,
    }));
    if (roster.attacker !== 1 || roster.defender !== 1) throw new Error(`Expected reduced production 1v1 roster, got ${JSON.stringify(roster)}`);
    if (!roster.worldMapCanvasConnected || !roster.battleCanvasConnected) throw new Error(`Expected both map and battle canvases during battle: ${JSON.stringify(roster)}`);
    await saveEvidence(page, 'battle-open', phase, errors);

    phase = 'active-doctrine-battle';
    const rosterDetails = await page.evaluate(() => {
      const s = window.__battleLargeReturnProbe.scene;
      const atk=s.atk, def=s.def;
      return { attacker:atk.length,defender:def.length,playerSide:s._playerControlSide() };
    });
    mark('active:production-roster', rosterDetails);
    if (rosterDetails.attacker !== 1 || rosterDetails.defender !== 1) throw new Error(`Reduced production roster was not installed: ${JSON.stringify(rosterDetails)}`);
    const startButton = page.locator('#deploy-toolbar-start');
    await startButton.waitFor({ state: 'visible', timeout: 30000 });
    // The visible start control is partly covered by the WebGL canvas hit layer;
    // invoke its production click handler directly, then use real Playwright
    // mouse input for selection and all battle orders below.
    await startButton.evaluate(button => button.click());
    phase = 'real-pointer-attack-move-order';
    const setup = await page.evaluate(() => {
      const s = window.__battleLargeReturnProbe.scene;
      const actor = s._playerRoster().find(u => !u.dead && !u.removed && !u.routed && !u.fadingOut);
      const enemy = s._enemyRoster().find(u => !u.dead && !u.removed && !u.routed && !u.fadingOut);
      if (!actor || !enemy) throw new Error('production battle lacks live player/enemy units');
      s._manualCommanderGate = false;
      if (!s._manualMode) s._toggleManualMode();
      s._clearAllSelection();
      s._battleAwaitingOrders = true;
      s.roundNo = 0;
      s._queuedOrderUnitIds.clear();
      return { actorId: actor.bu.id, actorAt: [actor.q, actor.r], enemyId: enemy.bu.id, enemyAt: [enemy.q, enemy.r], playerSide: s._playerControlSide(), manualMode: s._manualMode };
    });
    const clickUnit = async id => {
      const card = page.locator(`#player-roster-bar [data-unit-id="${id}"]`).last();
      await card.click();
    };
    const clickWorld = async (q, r) => {
      const point = await page.evaluate(({ q, r }) => {
        const s = window.__battleLargeReturnProbe.scene;
        s.camera.updateMatrixWorld(true);
        s.camera.updateProjectionMatrix();
        const p = s._worldAtTile(q, r).project(s.camera);
        const rect = s.canvas.getBoundingClientRect();
        return { x: rect.left + (p.x + 1) * rect.width / 2, y: rect.top + (1 - p.y) * rect.height / 2 };
      }, { q, r });
      await page.mouse.click(point.x, point.y);
    };
    await clickUnit(setup.actorId);
    await page.waitForFunction(id => window.__battleLargeReturnProbe.scene._selectedUnits.has(id), setup.actorId, { timeout: 5000 }).catch(async () => {
      const state = await page.evaluate(id => {
        const s = window.__battleLargeReturnProbe.scene;
        const u = s.atk.find(x => x.bu.id === id);
        const p = u.group.position.clone().project(s.camera);
        const rect = s.canvas.getBoundingClientRect();
        return { manual: s._manualMode, canvas: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }, projected: { x: (p.x+1)*rect.width/2, y: (1-p.y)*rect.height/2, z: p.z }, selected: [...s._selectedUnits], actorAt: [u.q,u.r] };
      }, setup.actorId);
      throw new Error(`pointer did not select actor: ${JSON.stringify({setup,state})}`);
    });
    await page.locator('[data-battle-attack-move-mode]').click();
    const waypoint = await page.evaluate(({ q, r }) => {
      const s = window.__battleLargeReturnProbe.scene;
      for (let dc=2; dc<9; dc++) {
        const c=q+dc;
        if (c>=64 || !s.terrainMap.passable(c,r) || s.occByKey.has(`${c},${r}`)) continue;
        return [c,r];
      }
      throw new Error('no open waypoint ahead of selected actor');
    }, { q: setup.actorAt[0], r: setup.actorAt[1] });
    await clickWorld(waypoint[0], waypoint[1]);
    const attackMoveOrder = await page.evaluate(id => {
      const s = window.__battleLargeReturnProbe.scene;
      const u = s.atk.find(x => x.bu.id === id);
      return { order: u.playerOrder, selected: s._selectedUnits.has(id), mode: s._attackMoveMode };
    }, setup.actorId);
    if (attackMoveOrder.order.type !== 'attackMove' || attackMoveOrder.order.col !== waypoint[0] || attackMoveOrder.order.row !== waypoint[1]) {
      throw new Error(`real pointer failed to issue attack-move waypoint: ${JSON.stringify({ setup, waypoint, attackMoveOrder })}`);
    }
    await page.locator('[data-battle-attack-move-mode]').click();
    const ordinaryWaypoint = [Math.min(63, waypoint[0] + 1), waypoint[1]];
    await clickWorld(ordinaryWaypoint[0], ordinaryWaypoint[1]);
    const plainMoveOrder = await page.evaluate(id => window.__battleLargeReturnProbe.scene.atk.find(x => x.bu.id === id).playerOrder, setup.actorId);
    if (plainMoveOrder.type !== 'move') throw new Error(`plain ground click was converted from Move: ${JSON.stringify(plainMoveOrder)}`);
    await clickWorld(setup.enemyAt[0], setup.enemyAt[1]);
    const exactAttackOrder = await page.evaluate(id => window.__battleLargeReturnProbe.scene.atk.find(x => x.bu.id === id).playerOrder, setup.actorId);
    if (exactAttackOrder.type !== 'attack' || exactAttackOrder.targetId !== setup.enemyId) throw new Error(`enemy pointer click did not preserve exact-target Attack: ${JSON.stringify(exactAttackOrder)}`);
    const checks = [
      ['real pointer selected a production player unit', setup.manualMode && attackMoveOrder.selected],
      ['Atakuj-marszem toolbar mode + ground pointer assigned exact empty waypoint', attackMoveOrder.order.type === 'attackMove'],
      ['ordinary empty-ground pointer retained plain Move', plainMoveOrder.type === 'move'],
      ['enemy pointer click retained exact target Attack', exactAttackOrder.type === 'attack' && exactAttackOrder.targetId === setup.enemyId],
      ['browser page has no errors', errors.length === 0],
    ];
    for (const [label, ok] of checks) console.log(`${ok ? '[PASS]' : '[FAIL]'} ${label}`);
    await saveEvidence(page, 'attack-move-real-pointer', phase, errors);
    fs.writeFileSync(path.join(evidenceDir, 'attack-move-pointer.json'), JSON.stringify({ setup, waypoint, attackMoveOrder, plainMoveOrder, exactAttackOrder, checks, errors }, null, 2) + '\n');
    if (checks.some(([, ok]) => !ok)) process.exitCode = 2;
    phase = 'complete';
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

main().catch(error => { console.error('[battle-attack-move-pointer] FAIL:', error.stack || error); process.exitCode = 1; });
