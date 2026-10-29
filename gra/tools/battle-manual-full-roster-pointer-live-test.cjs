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
const out = path.join(os.tmpdir(), `battle-manual-full-roster-pointer-live-${id}`);
const evidenceDir = path.join(os.tmpdir(), `battle-manual-full-roster-pointer-evidence-${id}`);
const mapBootTimeoutMs = Math.max(10000, Number(process.env.BATTLE_RETURN_MAP_BOOT_MS || 120000));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function mark(phase, data) {
  const extra = data === undefined ? '' : ` ${JSON.stringify(data)}`;
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

    // Keep the production 28v28 mixed roster intact. Start manually after the
    // same test-only commander gate override used by the earlier probe.
    await page.evaluate(() => { window.__battleLargeReturnProbe.scene._manualCommanderGate=false; });
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

    // Shift-clicks follow the real canvas pointer handler but queue orders, so
    // the test verifies all 28 production order records without simulating a
    // long 56-unit battle under headless WebGL.
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

    const checks=[
      ['production mixed 28v28 roster remains intact through manual orders',initial.attacker===28&&initial.defender===28&&initial.ranged>0&&initial.mounted>0],
      ['canvas pointer selects the exact friendly unit',selected.includes(initial.friendly.id)],
      ['production All chip selects all 28 player units by pointer',allSelection.selected.length===28&&allSelection.player.every(id=>allSelection.selected.includes(id))],
      ['enemy canvas pointer assigns exact target to every selected unit',attack.orders.length===28&&attack.orders.every(o=>o.type==='attack'&&o.targetId===initial.target.id)],
      ['empty-ground canvas pointer assigns move orders to every selected unit',move.orders.length===28&&move.orders.every(o=>o.type==='move')],
      ['no browser page or console errors',errors.length===0],
    ];
    await saveEvidence(page,'manual-full-roster-pointer-orders','manual-pointer-battle',errors);
    fs.writeFileSync(path.join(evidenceDir,'manual-full-roster-pointer-orders.json'),JSON.stringify({initial,clicks,attack,move,checks,errors},null,2)+'\n');
    for(const [label,ok] of checks)console.log(`${ok?'[PASS]':'[FAIL]'} ${label}`);
    mark('manual:full-roster-final',{initial,attackOrders:attack.orders.length,attackTarget:initial.target.id,moveOrders:move.orders.length,moveTarget:initial.ground.tile,checks});
    phase='complete';
    if(checks.some(([,ok])=>!ok)) process.exitCode=2;
  } finally {
    if(phase!=='complete'&&page&&!page.isClosed())
      await saveEvidence(page,'failure',phase,errors).catch(error=>mark('evidence:failure:error',{message:error.message}));
    mark('cleanup:start',{phase,evidenceDir});
    if(browser) await browser.close();
    if(server) await new Promise(resolve=>server.close(resolve));
    fs.rmSync(out,{recursive:true,force:true});
  }
}

main().catch(error=>{console.error('[battle-manual-pointer-live] FAIL:',error.stack||error);process.exitCode=1;});
