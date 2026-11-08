'use strict';
/**
 * Production Chromium pointer test for full mixed-roster manual battle orders.
 *
 * Opens the 28-vs-28 mixed preset on a real generated map, enters manual battle
 * via the production UI, then uses Playwright mouse clicks on the actual canvas
 * to select a friendly unit, attack a specifically clicked enemy, and move to
 * clicked empty ground. The full 28-vs-28 roster is retained. Product sources are untouched.
 *
 * Run from gra/: node tools/battle-manual-orders-pointer-live-test.cjs
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
const out = path.join(os.tmpdir(), `battle-manual-queued-order-lifecycle-${id}`);
const evidenceDir = path.join(os.tmpdir(), `battle-manual-queued-order-lifecycle-evidence-${id}`);
const mapBootTimeoutMs = Math.max(10000, Number(process.env.BATTLE_RETURN_MAP_BOOT_MS || 120000));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const runMarks = [];

function mark(phase, data) {
  const extra = data === undefined ? '' : ` ${JSON.stringify(data)}`;
  runMarks.push({ at: new Date().toISOString(), phase, data: data ?? null });
  console.log(`[battle-manual-pointer-live ${new Date().toISOString()}] ${phase}${extra}`);
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
    name: 'temporary-battle-manual-pointer-live-observer',
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
      output = output.replace(battleMarker, `      bOpts.manualControlAllowed = true;
${battleMarker}
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
  // `base` has already been imported above. Disable Vite's second config-file
  // bundle pass so this test remains runnable when the shared /tmp volume is full.
  await viteBuild(mergeConfig(base, { configFile: false, root, plugins: [plugin], build: { outDir: out, emptyOutDir: true } }));
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
    if (process.env.BATTLE_SKIP_MAP_BOOT !== '1') {
      await waitForMapBoot(page, errors);
      mark('wait:map-ready:complete', await samplePage(page, errors));
      await wait(1000);
      await saveEvidence(page, 'map-before-battle', phase, errors);
    } else {
      mark('wait:map-ready:skipped-for-battle-only-fixture', await samplePage(page, errors));
    }

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

    phase = 'manual-pointer-battle';
    const rosterDetails = await page.evaluate(() => {
      const s=window.__battleLargeReturnProbe.scene;
      return { attacker:s.atk.length, defender:s.def.length,
        ranged:[...s.atk,...s.def].filter(u=>u.rangedBase).length,
        mounted:[...s.atk,...s.def].filter(u=>u.mounted).length,
        playerSide:s._deployPlayerSideOpt };
    });
    mark('manual:real-28v28-roster', rosterDetails);
    if (rosterDetails.attacker!==28 || rosterDetails.defender!==28 || rosterDetails.ranged===0 || rosterDetails.mounted===0)
      throw new Error(`Expected real mixed 28v28 roster: ${JSON.stringify(rosterDetails)}`);

    // Exercise the actual BattleScene AUTO -> MANUAL commander guard on a
    // no-commander roster before battle begins; reset only the gate for the
    // separately scoped pointer-input test below.
    const gateProbe=await page.evaluate(() => {
      const s=window.__battleLargeReturnProbe.scene;
      const commanders=s._playerRoster().filter(u=>u.isArmyCommander&&!u.dead&&!u.fadingOut&&!u.routed).map(u=>u.bu.id);
      if(commanders.length!==0)throw new Error(`Expected a no-commander gate fixture: ${JSON.stringify(commanders)}`);
      if(!s._manualCommanderGate)throw new Error('BattleScene was not initialized with manualControlAllowed');
      s._manualMode=false;
      s._toggleManualMode();
      return {gateEnabled:s._manualCommanderGate,commanders,autoToManualBlocked:!s._manualMode,manualModeAfterAttempt:s._manualMode};
    });
    mark('manual:commander-gate-negative',gateProbe);
    if(!gateProbe.gateEnabled||gateProbe.commanders.length!==0||!gateProbe.autoToManualBlocked)
      throw new Error(`Commander gate did not reject AUTO -> MANUAL for the no-commander roster: ${JSON.stringify(gateProbe)}`);
    await page.evaluate(() => {
      const s=window.__battleLargeReturnProbe.scene;
      s._manualCommanderGate=false;
      s._manualMode=true;
    });
    await page.evaluate(() => {
      const start = document.querySelector('#deploy-toolbar-start');
      if (!(start instanceof HTMLButtonElement) || start.disabled) throw new Error('Production START WALKI button unavailable');
      start.click();
    });
    await page.waitForFunction(() => {
      const s=window.__battleLargeReturnProbe?.scene;
      return !!s?.started && !s.deployPhase && s._manualMode && s._battleAwaitingOrders;
    }, undefined, { timeout:30000 });

    const initial=await page.evaluate(() => {
      const s=window.__battleLargeReturnProbe.scene;
      const own=s._playerRoster(), enemy=s._enemyRoster();
      const project=(x,y,z)=>{
        s.camera.updateMatrixWorld(true);
        const v=s.camera.matrixWorldInverse.elements,p=s.camera.projectionMatrix.elements;
        const vx=v[0]*x+v[4]*y+v[8]*z+v[12],vy=v[1]*x+v[5]*y+v[9]*z+v[13],vz=v[2]*x+v[6]*y+v[10]*z+v[14],vw=v[3]*x+v[7]*y+v[11]*z+v[15];
        const cx=p[0]*vx+p[4]*vy+p[8]*vz+p[12]*vw,cy=p[1]*vx+p[5]*vy+p[9]*vz+p[13]*vw,cw=p[3]*vx+p[7]*vy+p[11]*vz+p[15]*vw;
        const rect=s.canvas.getBoundingClientRect(); return {x:rect.left+(cx/cw+1)*rect.width/2,y:rect.top+(1-cy/cw)*rect.height/2};
      };
      const unitPoint=(u)=>{
        const pos=u.group.position,rect=s.canvas.getBoundingClientRect();
        for(const dy of [.25,.5,.8,1.1,1.4,1.8,2.2])for(const dx of [-.15,0,.15]){
          const pt=project(pos.x+dx,pos.y+dy,pos.z);
          if(pt.x<rect.left||pt.x>rect.right||pt.y<rect.top||pt.y>rect.bottom)continue;
          const tile=s._pickGroundTile(pt.x,pt.y),hit=s._pickUnitAtScreen(pt.x,pt.y);
          if(tile?.col===u.q&&tile?.row===u.r&&hit?.bu?.id===u.bu.id&&document.elementFromPoint(pt.x,pt.y)===s.canvas)return {...pt,tile:{col:tile.col,row:tile.row},hitId:hit.bu.id};
        }
        return null;
      };
      const groundPoint=()=>{
        const rect=s.canvas.getBoundingClientRect();
        for(let q=25;q<=40;q++)for(let r=25;r<=43;r++){
          if(!s.terrainMap.passable(q,r)||s.occByKey.has(`${q},${r}`))continue;
          for(const dy of [-.12,0,.12]){
            const pt=project(q+dy,.08,r);
            if(pt.x<rect.left+350||pt.x>rect.right||pt.y<rect.top||pt.y>rect.bottom)continue;
            const tile=s._pickGroundTile(pt.x,pt.y),hit=s._pickUnitAtScreen(pt.x,pt.y);
            if(tile?.col===q&&tile?.row===r&&!hit&&document.elementFromPoint(pt.x,pt.y)===s.canvas)return {...pt,tile:{col:q,row:r}};
          }
        }
        return null;
      };
      const liveOwn=own.filter(u=>!u.dead&&!u.routed&&!u.removed),liveEnemy=enemy.filter(u=>!u.dead&&!u.routed&&!u.removed);
      const friendly=liveOwn.map(u=>({id:u.bu.id,point:unitPoint(u)})).find(x=>x.point);
      const target=liveEnemy.map(u=>({id:u.bu.id,point:unitPoint(u)})).find(x=>x.point);
      const ground=groundPoint();
      return {attacker:s.atk.length,defender:s.def.length,ownCount:liveOwn.length,enemyCount:liveEnemy.length,
        playerSide:s._deployPlayerSideOpt,ranged:liveOwn.filter(u=>u.rangedBase||u.primaryRanged).length,
        mounted:liveOwn.filter(u=>u.mounted).length,friendly,target,ground,
        allChip:!!document.querySelector('button[data-roster-chip="all"]'),manualMode:s._manualMode,awaitingOrders:s._battleAwaitingOrders};
    });
    mark('manual:full-roster-setup',initial);
    if(initial.attacker!==28||initial.defender!==28||initial.ownCount!==28||initial.enemyCount!==28||initial.ranged===0||initial.mounted===0)
      throw new Error(`Expected intact mixed production roster 28v28: ${JSON.stringify(initial)}`);
    if(!initial.friendly?.point||!initial.target?.point||!initial.ground)throw new Error(`Could not project production friendly/enemy/empty tile: ${JSON.stringify(initial)}`);

    // Accelerate only battle pacing through the production KeyV handler. The
    // Tempo button's localized title changes after every step, so targeting an
    // exact title is brittle. Four real keyboard events advance 1x -> 16x;
    // assert each observed multiplier before any queue command is issued.
    mark('manual:tempo-16x-keyv:start',{expected:[2,4,8,16]});
    const speedSteps=[];
    await page.evaluate(()=>window.__battleLargeReturnProbe.scene.canvas.focus());
    for(const expected of [2,4,8,16]){
      await page.keyboard.press('v');
      const actual=await page.evaluate(()=>window.__battleLargeReturnProbe.scene.speedMul);
      speedSteps.push(actual);
      mark('manual:tempo-keyv:step',{expected,actual});
      if(actual!==expected)throw new Error(`Production KeyV tempo step expected ${expected}x, observed ${actual}x`);
    }
    const speedProbe=await page.evaluate(()=>({speedMul:window.__battleLargeReturnProbe.scene.speedMul}));
    mark('manual:tempo-16x-keyv:complete',{speedProbe,speedSteps});

    const clicks=[];
    await page.mouse.click(initial.friendly.point.x,initial.friendly.point.y);
    let selected=await page.evaluate(()=>[...window.__battleLargeReturnProbe.scene._selectedUnits]);
    clicks.push({action:'canvas-select-friendly',id:initial.friendly.id,selected});
    if(!selected.includes(initial.friendly.id))throw new Error(`Canvas click failed to select exact friendly unit: ${JSON.stringify({initial,selected})}`);

    const allRect=await page.evaluate(()=>{
      const b=document.querySelector('button[data-roster-chip="all"]');
      if(!(b instanceof HTMLButtonElement))throw new Error('Production roster All button not found');
      b.scrollIntoView({block:'center',inline:'center'});
      const r=b.getBoundingClientRect();
      if(!r.width||!r.height)throw new Error('Production roster All button is not visible');
      return {x:r.x+r.width/2,y:r.y+r.height/2,label:b.getAttribute('aria-label')||b.textContent};
    });
    await page.mouse.click(allRect.x,allRect.y);
    const allSelection=await page.evaluate(()=>{
      const s=window.__battleLargeReturnProbe.scene;return {selected:[...s._selectedUnits],player:s._playerRoster().filter(u=>!u.dead&&!u.routed&&!u.removed).map(u=>u.bu.id)};
    });
    clicks.push({action:'production-roster-all-pointer',point:allRect,state:allSelection});
    if(allSelection.selected.length!==28||allSelection.player.length!==28||allSelection.player.some(id=>!allSelection.selected.includes(id)))
      throw new Error(`Roster All did not select the full 28-unit player army: ${JSON.stringify(allSelection)}`);

    // Queue through real canvas pointer clicks, then Space starts the production
    // turn/activation queue. Every player unit is first in the manual turn order.
    await page.mouse.click(initial.target.point.x,initial.target.point.y,{modifiers:['Shift']});
    const attack=await page.evaluate((targetId)=>{
      const s=window.__battleLargeReturnProbe.scene,own=s._playerRoster().filter(u=>!u.dead&&!u.routed&&!u.removed);
      return {targetId,selected:[...s._selectedUnits],queued:[...s._queuedOrderUnitIds],orders:own.map(u=>({id:u.bu.id,...u.playerOrder}))};
    },initial.target.id);
    clicks.push({action:'shift-canvas-click-exact-enemy',point:initial.target.point,state:attack});
    if(attack.orders.length!==28||attack.orders.some(o=>o.type!=='attack'||o.targetId!==initial.target.id)||attack.queued.length!==28)
      throw new Error(`Exact enemy pointer order did not queue against the clicked target for every unit: ${JSON.stringify({target:initial.target.id,attack})}`);

    await page.mouse.click(initial.ground.x,initial.ground.y,{modifiers:['Shift']});
    const move=await page.evaluate((ground)=>{
      const s=window.__battleLargeReturnProbe.scene,own=s._playerRoster().filter(u=>!u.dead&&!u.routed&&!u.removed);
      return {ground,selected:[...s._selectedUnits],queued:[...s._queuedOrderUnitIds],orders:own.map(u=>({id:u.bu.id,...u.playerOrder}))};
    },initial.ground.tile);
    clicks.push({action:'shift-canvas-click-empty-ground',point:initial.ground,state:move});
    if(move.orders.length!==28||move.orders.some(o=>o.type!=='move')||move.queued.length!==28)
      throw new Error(`Empty-ground pointer did not queue movement for the full army: ${JSON.stringify(move)}`);

    const beforeExecution=await page.evaluate(()=>{
      const s=window.__battleLargeReturnProbe.scene;
      return Object.fromEntries(s._playerRoster().map(u=>[u.bu.id,{q:u.q,r:u.r}]));
    });
    mark('manual:first-activation:space-before',{round:1,turnIdx:await page.evaluate(()=>window.__battleLargeReturnProbe.scene.turnIdx),queued:move.queued.length});
    await page.keyboard.press('Space');
    mark('manual:first-activation:space-after',{pressed:true});
    mark('manual:first-activation:wait-start',{timeoutMs:180000});
    await page.waitForFunction(()=>{
      const s=window.__battleLargeReturnProbe.scene;
      const own=s._playerRoster().filter(u=>!u.dead&&!u.routed&&!u.removed);
      return s.roundNo===1&&s.turnIdx>=28&&own.every(u=>u.acted);
    },undefined,{timeout:180000}).catch(async error=>{
      const state=await page.evaluate(()=>{
        const s=window.__battleLargeReturnProbe.scene,own=s._playerRoster();
        return {round:s.roundNo,turnIdx:s.turnIdx,awaitingOrders:s._battleAwaitingOrders,finished:s.finished,
          queue:[...s._queuedOrderUnitIds],turnOrder:s.turnOrder.map((u,index)=>({index,id:u?.bu?.id,dead:u?.dead,acted:u?.acted,
            queued:u?.bu?.id?s._queuedOrderUnitIds.has(u.bu.id):false})),live:own.filter(u=>!u.dead&&!u.routed&&!u.removed).length,
          acted:own.filter(u=>!u.dead&&!u.routed&&!u.removed&&u.acted).length};
      }).catch(()=>({stateUnavailable:true}));
      throw new Error(`${error.message}; activation-state=${JSON.stringify(state)}`);
    });
    const execution=await page.evaluate((before)=>{
      const s=window.__battleLargeReturnProbe.scene;
      const own=s._playerRoster().filter(u=>!u.dead&&!u.routed&&!u.removed);
      const moved=own.filter(u=>before[u.bu.id]&&(u.q!==before[u.bu.id].q||u.r!==before[u.bu.id].r));
      return {round:s.roundNo,turnIdx:s.turnIdx,queueRemaining:s._queuedOrderUnitIds.size,live:own.length,
        acted:own.filter(u=>u.acted).length,moved:moved.length,movedIds:moved.map(u=>u.bu.id)};
    },beforeExecution);
    mark('manual:first-activation:wait-complete',execution);
    clicks.push({action:'space-starts-production-activation-queue',state:execution});
    if(execution.round!==1||execution.turnIdx<28||execution.live!==28||execution.acted!==28||execution.moved===0)
      throw new Error(`Full roster move batch did not execute through turn activation: ${JSON.stringify(execution)}`);

    if(execution.queueRemaining!==0)
      throw new Error(`Consumed full-roster order ids remained queued after activation: ${JSON.stringify(execution)}`);

    // A second planning pause is not part of the production manual loop. Let
    // the battle keep its real turn order, but reduce only pacing to 1x with
    // four clicks on the production slowdown control (the V key only speeds up).
    const slowSteps=[];
    const slowButton=page.locator('button[title^="Zwolnij"]');
    const slowButtonCount=await slowButton.count();
    if(slowButtonCount!==1)throw new Error(`Expected one production Zwolnij control, found ${slowButtonCount}`);
    for(const expected of [8,4,2,1]){
      await slowButton.click();
      const actual=await page.evaluate(()=>window.__battleLargeReturnProbe.scene.speedMul);
      slowSteps.push(actual);
      mark('manual:tempo-slowdown-step',{expected,actual});
      if(actual!==expected)throw new Error(`Production Zwolnij step expected ${expected}x, observed ${actual}x`);
    }
    const slowTempo=await page.evaluate(()=>window.__battleLargeReturnProbe.scene.speedMul);
    mark('manual:tempo-1x-before-round-two',{speedMul:slowTempo,slowSteps});
    if(slowTempo!==1)throw new Error(`Expected production slowdown control to reach 1x, got ${slowTempo}x`);

    const activeRoundTrace=[];
    const roundTwoDeadline=Date.now()+240000;
    let activeRound=null,lastRoundTurn='';
    mark('manual:round-two-active-turn:wait-start',{timeoutMs:240000,condition:'roundNo===2 && turnIdx>0'});
    while(Date.now()<roundTwoDeadline){
      activeRound=await page.evaluate(()=>{
        const s=window.__battleLargeReturnProbe.scene;
        const roster=s._playerRoster();
        return {round:s.roundNo,turnIdx:s.turnIdx,awaitingOrders:s._battleAwaitingOrders,finished:s.finished,
          live:roster.filter(u=>!u.dead&&!u.routed&&!u.removed).length,acted:roster.filter(u=>!u.dead&&!u.routed&&!u.removed&&u.acted).length,
          queue:[...s._queuedOrderUnitIds],turnOrder:s.turnOrder.map((u,index)=>({index,id:u?.bu?.id,side:u?.side,dead:u?.dead,acted:u?.acted}))};
      });
      const key=`${activeRound.round}:${activeRound.turnIdx}`;
      if(key!==lastRoundTurn){lastRoundTurn=key;activeRoundTrace.push({at:new Date().toISOString(),round:activeRound.round,turnIdx:activeRound.turnIdx,awaitingOrders:activeRound.awaitingOrders});
        mark('manual:round-two-active-turn:progress',activeRoundTrace[activeRoundTrace.length-1]);}
      if(activeRound.round===2&&activeRound.turnIdx>0&&!activeRound.finished)break;
      if(activeRound.finished)throw new Error(`Battle finished before active round-2 pointer order: ${JSON.stringify(activeRound)}`);
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    if(!activeRound||activeRound.round!==2||activeRound.turnIdx<=0)
      throw new Error(`Timed out waiting for real round 2 turnIdx>0; last-state=${JSON.stringify(activeRound)}`);
    mark('manual:round-two-active-turn:wait-complete',{round:activeRound.round,turnIdx:activeRound.turnIdx,awaitingOrders:activeRound.awaitingOrders});

    const subset=await page.evaluate(()=>{
      const s=window.__battleLargeReturnProbe.scene,rect=s.canvas.getBoundingClientRect();
      const project=(x,y,z)=>{
        s.camera.updateMatrixWorld(true);
        const v=s.camera.matrixWorldInverse.elements,p=s.camera.projectionMatrix.elements;
        const vx=v[0]*x+v[4]*y+v[8]*z+v[12],vy=v[1]*x+v[5]*y+v[9]*z+v[13],vz=v[2]*x+v[6]*y+v[10]*z+v[14],vw=v[3]*x+v[7]*y+v[11]*z+v[15];
        const cx=p[0]*vx+p[4]*vy+p[8]*vz+p[12]*vw,cy=p[1]*vx+p[5]*vy+p[9]*vz+p[13]*vw,cw=p[3]*vx+p[7]*vy+p[11]*vz+p[15]*vw;
        return {x:rect.left+(cx/cw+1)*rect.width/2,y:rect.top+(1-cy/cw)*rect.height/2};
      };
      const candidates=s.turnOrder.slice(s.turnIdx).filter(u=>u&&s._isPlayerSide(u.side)&&!u.dead&&!u.routed&&!u.removed&&!u.acted);
      if(candidates.length===0)throw new Error(`No unacted player unit later in active round turnOrder: ${JSON.stringify({round:s.roundNo,turnIdx:s.turnIdx,tail:s.turnOrder.slice(s.turnIdx).map(u=>({id:u?.bu?.id,side:u?.side,acted:u?.acted}))})}`);
      // Select by the production roster card: crowded 3D models can overlap, but
      // the card's click handler is the same production unit-selection route.
      const candidate=candidates[candidates.length-1];
      const friendly={id:candidate.bu.id,before:{q:candidate.q,r:candidate.r},turnIndex:s.turnOrder.indexOf(candidate)};
      let ground=null;
      for(const [dq,dr] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){
        const q=candidate.q+dq,r=candidate.r+dr;
        if(!s.terrainMap.passable(q,r)||s.occByKey.has(`${q},${r}`))continue;
        const point=project(q,.08,r),tile=s._pickGroundTile(point.x,point.y);
        if(point.x<rect.left||point.x>rect.right||point.y<rect.top||point.y>rect.bottom||tile?.col!==q||tile?.row!==r||s._pickUnitAtScreen(point.x,point.y))continue;
        ground={...point,tile:{col:q,row:r}};break;
      }
      if(!ground)throw new Error(`Could not project active-round unacted unit destination: ${JSON.stringify({friendly,ground,id:candidate.bu.id,round:s.roundNo,turnIdx:s.turnIdx})}`);
      return {friendly,ground,queuedBefore:s._queuedOrderUnitIds.size,queueIds:[...s._queuedOrderUnitIds],round:s.roundNo,turnIdx:s.turnIdx};
    });
    mark('manual:round-two-pointer:selection-point-ready',{id:subset.friendly.id,turnIndex:subset.friendly.turnIndex,round:subset.round,turnIdx:subset.turnIdx,destination:subset.ground.tile,before:subset.friendly.before,queuedBefore:subset.queuedBefore,queueIds:subset.queueIds});
    const unitCard=page.locator(`#battle-roster-cards [data-unit-id="${subset.friendly.id}"]`);
    if(await unitCard.count()!==1)throw new Error(`Expected one production roster card for ${subset.friendly.id}`);
    await unitCard.scrollIntoViewIfNeeded();
    await unitCard.click();
    const secondSelection=await page.evaluate(()=>[...window.__battleLargeReturnProbe.scene._selectedUnits]);
    mark('manual:round-two-pointer:unit-selected',{selection:secondSelection});
    if(secondSelection.length!==1||!secondSelection.includes(subset.friendly.id))
      throw new Error(`Active round canvas click did not select exact unacted player unit: ${JSON.stringify({subset,secondSelection})}`);
    const postScroll=await page.evaluate((info)=>{
      const s=window.__battleLargeReturnProbe.scene,rect=s.canvas.getBoundingClientRect();
      const candidate=s._playerRoster().find(u=>u.bu.id===info.id),turnIndex=s.turnOrder.indexOf(candidate);
      if(!candidate||candidate.dead||candidate.routed||candidate.removed||candidate.acted||turnIndex<s.turnIdx)
        return {eligible:false,id:info.id,round:s.roundNo,turnIdx:s.turnIdx,turnIndex,acted:candidate?.acted,
          q:candidate?.q,r:candidate?.r,reason:'selected unit has already acted or is no longer ahead in turnOrder'};
      const project=(x,y,z)=>{
        s.camera.updateMatrixWorld(true);
        const v=s.camera.matrixWorldInverse.elements,p=s.camera.projectionMatrix.elements;
        const vx=v[0]*x+v[4]*y+v[8]*z+v[12],vy=v[1]*x+v[5]*y+v[9]*z+v[13],vz=v[2]*x+v[6]*y+v[10]*z+v[14],vw=v[3]*x+v[7]*y+v[11]*z+v[15];
        const cx=p[0]*vx+p[4]*vy+p[8]*vz+p[12]*vw,cy=p[1]*vx+p[5]*vy+p[9]*vz+p[13]*vw,cw=p[3]*vx+p[7]*vy+p[11]*vz+p[15]*vw;
        return {x:rect.left+(cx/cw+1)*rect.width/2,y:rect.top+(1-cy/cw)*rect.height/2};
      };
      let ground=null;
      for(const [dq,dr] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){
        const q=candidate.q+dq,r=candidate.r+dr;
        if(!s.terrainMap.passable(q,r)||s.occByKey.has(`${q},${r}`))continue;
        const point=project(q,.08,r),tile=s._pickGroundTile(point.x,point.y);
        if(point.x<rect.left||point.x>rect.right||point.y<rect.top||point.y>rect.bottom||tile?.col!==q||tile?.row!==r||s._pickUnitAtScreen(point.x,point.y))continue;
        ground={...point,tile:{col:q,row:r}};break;
      }
      return {eligible:!!ground,id:info.id,round:s.roundNo,turnIdx:s.turnIdx,turnIndex,acted:candidate.acted,
        before:{q:candidate.q,r:candidate.r},ground,queueIds:[...s._queuedOrderUnitIds],
        canvasRect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}};
    },{id:subset.friendly.id});
    mark('manual:round-two-pointer:post-scroll-revalidation',postScroll);
    if(!postScroll.eligible||postScroll.round!==2||postScroll.acted||postScroll.turnIndex<postScroll.turnIdx)
      throw new Error(`Refusing to issue order because candidate no longer has an upcoming active-round turn: ${JSON.stringify(postScroll)}`);
    // Observe the production distinction between the direct pointer-order path
    // and the unit's ordinary turn activation. This wraps methods only in the
    // test page; it does not change BattleScene's implementation.
    const orderTrace=await page.evaluate((info)=>{
      const s=window.__battleLargeReturnProbe.scene,trace={commands:[],immediateDispatches:[],performCalls:[],activationCalls:[]};
      const pendingImmediate=new Set();
      const originalIssue=s._issueBattleMove;
      s._issueBattleMove=function(col,row,queueOnly){
        const ids=this._collectOrderUnitIds();
        const before=ids.map(id=>{const u=this._findPlayerUnit(id);return u&&{id,groupId:u.groupId,formationOffset:u.formationOffset,
          expected:this._moveTargetForUnit(u,col,row),before:{q:u.q,r:u.r},acted:u.acted};}).filter(Boolean);
        const at=new Date().toISOString(),round=this.roundNo,turnIdx=this.turnIdx;
        const result=originalIssue.call(this,col,row,queueOnly);
        trace.commands.push({at,round,turnIdx,col,row,queueOnly,ids,before,
          after:ids.map(id=>{const u=this._findPlayerUnit(id);return u&&{id,playerOrder:u.playerOrder,acted:u.acted};}).filter(Boolean)});
        return result;
      };
      const originalImmediate=s._executeUnitsImmediate;
      s._executeUnitsImmediate=function(ids){
        const eligible=ids.filter(id=>{const u=this._findPlayerUnit(id);return u&&!u.dead&&!u.removed&&!u.routed&&!u.acted&&!this._queuedOrderUnitIds.has(id);});
        for(const id of eligible)pendingImmediate.add(id);
        trace.immediateDispatches.push({at:new Date().toISOString(),round:this.roundNo,turnIdx:this.turnIdx,
          requested:[...ids],eligible,queue:[...this._queuedOrderUnitIds],busy:this.busy});
        return originalImmediate.call(this,ids);
      };
      const originalActivate=s._activateUnit;
      s._activateUnit=function(u,done){
        trace.activationCalls.push({at:new Date().toISOString(),id:u.bu.id,round:this.roundNo,turnIdx:this.turnIdx,
          turnOrderIndex:this.turnOrder.indexOf(u),acted:u.acted});
        const previous=this.__queueOrderObservedActivation;
        this.__queueOrderObservedActivation=u.bu.id;
        try{return originalActivate.call(this,u,done);}
        finally{this.__queueOrderObservedActivation=previous;}
      };
      const originalPerform=s._performPlayerOrder;
      s._performPlayerOrder=function(u,done){
        const immediate=pendingImmediate.has(u.bu.id)&&this.__queueOrderObservedActivation!==u.bu.id;
        const event={at:new Date().toISOString(),id:u.bu.id,round:this.roundNo,turnIdx:this.turnIdx,
          turnOrderIndex:this.turnOrder.indexOf(u),activationContext:this.__queueOrderObservedActivation??null,
          immediateBatch:immediate,actedBefore:u.acted,orderBefore:{...u.playerOrder},before:{q:u.q,r:u.r}};
        trace.performCalls.push(event);
        return originalPerform.call(this,u,()=>{
          event.completedAt=new Date().toISOString();event.actedAfter=u.acted;event.after={q:u.q,r:u.r};
          if(immediate)pendingImmediate.delete(u.bu.id);
          done();
        });
      };
      window.__queueOrderObservation={trace,pendingImmediate};
      const candidate=s._playerRoster().find(u=>u.bu.id===info.id);
      const expected=s._moveTargetForUnit(candidate,info.destination.col,info.destination.row);
      return {round:s.roundNo,turnIdx:s.turnIdx,id:info.id,turnOrderIndex:s.turnOrder.indexOf(candidate),
        groupId:candidate.groupId,formationOffset:candidate.formationOffset,destination:info.destination,expected};
    },{id:subset.friendly.id,destination:postScroll.ground.tile});
    mark('manual:round-two-pointer:instrumentation-ready',orderTrace);
    await page.mouse.click(postScroll.ground.x,postScroll.ground.y);
    mark('manual:round-two-pointer:immediate-move-issued',{id:subset.friendly.id,destination:postScroll.ground.tile});
    try {
      mark('manual:round-two-pointer:movement-wait-start',{timeoutMs:30000});
      await page.waitForFunction((info)=>{
        const s=window.__battleLargeReturnProbe.scene,u=s._playerRoster().find(x=>x.bu.id===info.id);
        return !!u&&u.acted&&u.playerOrder.type==='move'&&(u.q!==info.q||u.r!==info.r);
      },{id:subset.friendly.id,...postScroll.before},{timeout:30000});
    } catch(error) {
      const latest=await page.evaluate((unitId)=>{
        const s=window.__battleLargeReturnProbe.scene,u=s._playerRoster().find(x=>x.bu.id===unitId);
        return {round:s.roundNo,turnIdx:s.turnIdx,awaiting:s._battleAwaitingOrders,queued:[...s._queuedOrderUnitIds],
          selected:[...s._selectedUnits],unit:u&&{q:u.q,r:u.r,acted:u.acted,order:u.playerOrder}};
    },subset.friendly.id);
      throw new Error(`Active round pointer immediate move did not execute: ${error.message}; state=${JSON.stringify(latest)}`);
    }
    const secondCycle=await page.evaluate((info)=>{
      const s=window.__battleLargeReturnProbe.scene,u=s._playerRoster().find(x=>x.bu.id===info.id);
      return {id:info.id,round:s.roundNo,turnIdx:s.turnIdx,queuedBefore:info.queuedBefore,queuedAfter:s._queuedOrderUnitIds.size,
        queueIdsBefore:info.queueIds,acted:u.acted,order:{...u.playerOrder},before:info.before,after:{q:u.q,r:u.r},destination:info.destination,
        selected:[...s._selectedUnits],observation:window.__queueOrderObservation?.trace??null};
    },{id:subset.friendly.id,queuedBefore:subset.queuedBefore,queueIds:postScroll.queueIds,before:postScroll.before,destination:postScroll.ground.tile});
    mark('manual:round-two-pointer:movement-complete',secondCycle);
    clicks.push({action:'round-two-active-canvas-pointer-subset-immediate-move',state:secondCycle,activeRoundTrace});
    if(!secondCycle.acted||secondCycle.order.type!=='move'||(secondCycle.before.q===secondCycle.after.q&&secondCycle.before.r===secondCycle.after.r))
      throw new Error(`Round-2 pointer immediate move did not change unit position: ${JSON.stringify(secondCycle)}`);

    // Observe ordinary activation separately from the immediate dispatch
    // snapshot. It can legitimately start after the pointer move has begun,
    // so preserve both timing and final position to detect a second move.
    const ordinaryFollowup=await page.evaluate(async(id)=>{
      const s=window.__battleLargeReturnProbe.scene,trace=window.__queueOrderObservation?.trace;
      const until=Date.now()+60000;
      while(Date.now()<until&&!trace?.activationCalls?.some(e=>e.id===id))
        await new Promise(resolve=>setTimeout(resolve,100));
      const activation=trace?.activationCalls?.find(e=>e.id===id)||null;
      const untilCompletion=Date.now()+15000;
      while(Date.now()<untilCompletion&&!trace?.performCalls?.some(e=>e.id===id&&e.activationContext===id&&e.completedAt))
        await new Promise(resolve=>setTimeout(resolve,100));
      const perform=trace?.performCalls?.find(e=>e.id===id&&e.activationContext===id)||null;
      const u=s._playerRoster().find(x=>x.bu.id===id);
      return {activation,perform,position:{q:u.q,r:u.r},round:s.roundNo,turnIdx:s.turnIdx,
        immediate:trace?.performCalls?.filter(e=>e.id===id&&e.immediateBatch)||[]};
    },secondCycle.id);

    // Deterministic production-method regression for a queued unit that dies
    // before its activation. The real _activateNext/_queuedOrderUnitIds and
    // _activateUnit remain untouched; only scheduling is stubbed so the next
    // live candidate completes synchronously instead of starting another loop.
    const skippedDead=await page.evaluate(()=>{
      const s=window.__battleLargeReturnProbe.scene;
      const units=s._playerRoster().filter(u=>!u.dead&&!u.routed&&!u.removed);
      const dead=units[0],live=units[1];
      if(!dead||!live)throw new Error('Need two live player units for skipped-dead activation regression');
      const saved={turnOrder:s.turnOrder,turnIdx:s.turnIdx,awaiting:s._battleAwaitingOrders,
        queue:[...s._queuedOrderUnitIds],schedule:s._schedule,dead:{dead:dead.dead,hp:dead.hp,acted:dead.acted,order:dead.playerOrder},
        live:{acted:live.acted,order:live.playerOrder}};
      dead.dead=true;dead.hp=0;dead.acted=false;dead.playerOrder={type:'move',col:dead.q+1,row:dead.r};
      live.acted=false;live.playerOrder={type:'hold'};
      s.turnOrder=[dead,live];s.turnIdx=0;s._battleAwaitingOrders=false;
      s._queuedOrderUnitIds.clear();s._queuedOrderUnitIds.add(dead.bu.id);s._queuedOrderUnitIds.add(live.bu.id);
      s._schedule=()=>{};
      s._activateNext();
      const result={deadId:dead.bu.id,liveId:live.bu.id,turnIdx:s.turnIdx,queueAfter:[...s._queuedOrderUnitIds],
        deadQueued:s._queuedOrderUnitIds.has(dead.bu.id),deadActivated:!dead.acted&&dead.dead,
        liveActivated:live.acted,liveOrder:live.playerOrder.type};
      s._schedule=saved.schedule;s.turnOrder=saved.turnOrder;s.turnIdx=saved.turnIdx;s._battleAwaitingOrders=saved.awaiting;
      s._queuedOrderUnitIds.clear();for(const id of saved.queue)s._queuedOrderUnitIds.add(id);
      dead.dead=saved.dead.dead;dead.hp=saved.dead.hp;dead.acted=saved.dead.acted;dead.playerOrder=saved.dead.order;
      live.acted=saved.live.acted;live.playerOrder=saved.live.order;
      return result;
    });

    const checks=[
      ['production mixed 28v28 roster remains intact through manual orders',initial.attacker===28&&initial.defender===28&&initial.ranged>0&&initial.mounted>0],
      ['four production KeyV events advance battle tempo 1x→16x',speedProbe.speedMul===16&&JSON.stringify(speedSteps)===JSON.stringify([2,4,8,16])],
      ['four production Zwolnij clicks lower battle tempo 16x→1x',slowTempo===1&&JSON.stringify(slowSteps)===JSON.stringify([8,4,2,1])],
      ['production commander gate rejects manual mode without a commander',gateProbe.gateEnabled&&gateProbe.commanders.length===0&&gateProbe.autoToManualBlocked],
      ['canvas pointer selects the exact friendly unit',selected.includes(initial.friendly.id)],
      ['production All chip selects all 28 player units by pointer',allSelection.selected.length===28&&allSelection.player.every(id=>allSelection.selected.includes(id))],
      ['enemy canvas pointer assigns exact target to every selected unit',attack.orders.length===28&&attack.orders.every(o=>o.type==='attack'&&o.targetId===initial.target.id)],
      ['empty-ground canvas pointer assigns move orders to every selected unit',move.orders.length===28&&move.orders.every(o=>o.type==='move')],
      ['Space executes queued full-roster orders through the production turn activation queue',execution.round===1&&execution.turnIdx>=28&&execution.live===28&&execution.acted===28&&execution.moved>0],
      ['activation clears consumed queued ids after the 28-unit batch',execution.queueRemaining===0],
      ['second-cycle canvas-pointer subset order moves the selected unit',secondCycle.acted&&secondCycle.order.type==='move'&&secondCycle.queuedAfter===0&&(secondCycle.before.q!==secondCycle.after.q||secondCycle.before.r!==secondCycle.after.r)],
      ['second-cycle pointer move dispatches immediately before atk27 ordinary activation begins',
        secondCycle.observation.immediateDispatches.some(d=>d.round===2&&d.requested.includes(secondCycle.id)&&d.eligible.includes(secondCycle.id)&&!d.queue.includes(secondCycle.id))
        &&(()=>{const immediate=secondCycle.observation.performCalls.find(e=>e.id===secondCycle.id&&e.immediateBatch&&e.activationContext===null);
          const ordinary=ordinaryFollowup.activation;
          return !!immediate&&(!ordinary||Date.parse(immediate.at)<Date.parse(ordinary.at));})()],
      ['group move target equals clicked hex plus atk27 formation offset',
        orderTrace.groupId!==null&&orderTrace.formationOffset
        &&orderTrace.expected.col===secondCycle.order.col&&orderTrace.expected.row===secondCycle.order.row
        &&orderTrace.expected.col===secondCycle.destination.col+orderTrace.formationOffset.dc
        &&orderTrace.expected.row===secondCycle.destination.row+orderTrace.formationOffset.dr],
      ['production _activateNext clears dead queued id and activates next live candidate',skippedDead.deadActivated&&!skippedDead.deadQueued&&skippedDead.liveActivated&&skippedDead.liveOrder==='hold'&&skippedDead.queueAfter.length===0&&skippedDead.turnIdx===2],
      ['no browser page or console errors',errors.length===0],
    ];
    await saveEvidence(page,'queued-order-lifecycle-two-cycles','manual-pointer-battle',errors);
    fs.writeFileSync(path.join(evidenceDir,'queued-order-lifecycle-two-cycles.json'),JSON.stringify({initial,speedProbe,gateProbe,clicks,attack,move,beforeExecution,execution,subset,postScroll,orderTrace,secondCycle,ordinaryFollowup,skippedDead,checks,errors},null,2)+'\n');
    fs.writeFileSync(path.join(evidenceDir,'queued-order-skipped-dead-production.json'),JSON.stringify({scenario:'_activateNext skips a dead queued candidate, removes its queue ID, and activates the next live candidate; only _schedule is stubbed',skippedDead},null,2)+'\n');
    for(const [label,ok] of checks)console.log(`${ok?'[PASS]':'[FAIL]'} ${label}`);
    mark('manual:full-roster-final',{initial,speedProbe,gateProbe,attackOrders:attack.orders.length,attackTarget:initial.target.id,moveOrders:move.orders.length,moveTarget:initial.ground.tile,execution,secondCycle,skippedDead,checks});
    phase='complete';
    if(checks.some(([,ok])=>!ok)) process.exitCode=2;
  } finally {
    if(phase!=='complete'&&page&&!page.isClosed())
      await saveEvidence(page,'failure',phase,errors).catch(error=>mark('evidence:failure:error',{message:error.message}));
    mark('cleanup:start',{phase,evidenceDir});
    fs.mkdirSync(evidenceDir,{recursive:true});
    fs.writeFileSync(path.join(evidenceDir,'execution-trace.json'),JSON.stringify({phase,marks:runMarks},null,2)+'\n');
    if(browser) await browser.close();
    if(server) await new Promise(resolve=>server.close(resolve));
    fs.rmSync(out,{recursive:true,force:true});
  }
}

main().catch(error=>{console.error('[battle-manual-pointer-live] FAIL:',error.stack||error);process.exitCode=1;});
