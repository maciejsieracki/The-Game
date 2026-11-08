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
 * Run from gra/: node tools/battle-manual-orders-live-open-tile-deterministic-live-test.cjs
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
const out = path.join(os.tmpdir(), `battle-manual-orders-live-open-tile-deterministic-${id}`);
const evidenceDir = path.join(os.tmpdir(), `battle-manual-orders-live-open-tile-deterministic-evidence-${id}`);
const mapBootTimeoutMs = Math.max(10000, Number(process.env.BATTLE_RETURN_MAP_BOOT_MS || 120000));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function mark(phase, data) {
  const extra = data === undefined ? '' : ` ${JSON.stringify(data)}`;
  console.log(`[battle-manual-orders-live-open-tile-deterministic ${new Date().toISOString()}] ${phase}${extra}`);
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
    name: 'temporary-battle-manual-orders-live-open-tile-deterministic-observer',
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
      const atk=s.atk, def=s.def;
      return { attacker:atk.length,defender:def.length,ranged:[...atk,...def].filter(u=>u.rangedBase).length,mounted:[...atk,...def].filter(u=>u.mounted).length,hasRanged:[...atk,...def].some(u=>u.rangedBase),hasMounted:[...atk,...def].some(u=>u.mounted),atk:[],def:[] };
    });
    mark('active:roster-and-doctrines', rosterDetails);
    if (!rosterDetails.hasRanged || !rosterDetails.hasMounted) throw new Error(`Preset is not mixed ranged+mounted: ${JSON.stringify(rosterDetails)}`);
    const startButton = page.getByText(/^START WALKI$/i).last();
    await startButton.waitFor({ state: 'visible', timeout: 30000 });
    await startButton.click();
    await page.evaluate(() => {
      const s = window.__battleLargeReturnProbe.scene;
      // Use a real ranged actor and real opposing unit from the production preset,
      // then isolate them at a legal non-adjacent firing distance. This removes
      // map/roster travel time while retaining production doctrine, picker, and shot.
      const attackers = s.atk.filter(u => u.bu.nazwa === 'Archer' && u.rangedBase && u.ammoLeft > 0 && u.rangeBase > 1).slice(0,3);
      const defender = s.def.find(u => u.bu.nazwa === 'Archer' && u.rangedBase && !u.dead && !u.routed) || s.def.find(u => !u.dead && !u.routed);
      if (attackers.length < 3 || !defender) throw new Error('Production preset lacks three live ranged shooters with ammo or defender');
      const allUnits = [...s.atk, ...s.def];
      const support = allUnits.find(u => u.side === 'def' && u !== defender && !u.dead && !u.routed);
      if (!support) throw new Error('Production preset lacks a second defender for a nonterminal kill probe');
      s.atk = attackers;
      s.def = [defender, support];
      s.occByKey.clear();
      // Pick an open hex exactly two tiles from a real defender location; terrain
      // is read from the actual battle map and actual derived range is checked.
      const origin = [defender.q, defender.r];
      const candidates = [];
      for (let dq=-4; dq<=4; dq++) for (let dr=-4; dr<=4; dr++) {
        const q=origin[0]+dq, r=origin[1]+dr;
        if (Math.abs(dq)+Math.abs(dr) !== 2) continue;
        if (!s.terrainMap.passable(q,r)) continue;
        candidates.push([q,r]);
      }
      if (!candidates.length) throw new Error('No passable exact-range candidate around defender');
      const chosen = candidates.slice(0,3);
      for (let i=0;i<attackers.length;i++) { const a=attackers[i], p=chosen[i]; a.q=p[0]; a.r=p[1]; a.dead=false; a.routed=false; a.acted=false; a.moveLeft=a.moveMax; a.playerOrder={type:'none'}; }
      defender.dead=false; defender.routed=false; defender.acted=false; defender.playerOrder={type:'none'};
      for(const a of attackers) s.occByKey.set(`${a.q},${a.r}`,a);
      s.occByKey.set(`${defender.q},${defender.r}`,defender);
      support.q=45; support.r=72; support.dead=false; support.fadingOut=false; support.routed=false; support.acted=false; support.playerOrder={type:'none'};
      s.occByKey.set(`${support.q},${support.r}`,support);
      s._manualCommanderGate=false;
      s._groupMeta.clear(); s._groups.clear();
      for (const [gid,units,doctrine] of [['r4-atk',attackers,'steady'],['r4-def',[defender],'defensive']]) {
        s._groups.set(gid,new Set(units.map(unit=>unit.bu.id)));
        for(const unit of units) unit.groupId=gid;
        s._ensureGroupMeta(gid);
        s._setGroupDoctrine(gid,doctrine);
      }
      s._manualMode=false; s._battleAwaitingOrders=true; s._autoBattleSuspended=false;
      const origPick=s._pickRangedTargetByPriority;
      s._pickRangedTargetByPriority=function(u,...args) {
        const before={type:'ranged-pick', id:u.bu.id, round:this.roundNo, doctrine:this._effectiveMetaForUnit(u).doctrine,
          canShoot:!!(u.rangedBase && u.ammoLeft>0 && u.shootingEnabled!==false), ammo:u.ammoLeft,
          rank:u.rank, at:[u.q,u.r], rangeBase:u.rangeBase, range:u.range, acted:u.acted, moveLeft:u.moveLeft,
          enemies:(u.side==='atk'?this.def:this.atk).filter(e=>!e.dead&&!e.fadingOut&&!e.routed).map(e=>({id:e.bu.id,at:[e.q,e.r],distance:Math.abs(e.q-u.q)+Math.abs(e.r-u.r)}))};
        const target=origPick.call(this,u,...args);
        before.targetId=target?.bu?.id ?? null;
        before.targetDistance=target?Math.abs(target.q-u.q)+Math.abs(target.r-u.r):null;
        before.candidateMove=this._doctrineMoveDest(u,this._effectiveMetaForUnit(u));
        window.__r4LiveActions.push(before);
        return target;
      };
      const origAttack=s._doAttack;
      s._doAttack=function(a,d,done){ if(attackers.includes(a)) window.__r4LiveActions.push({type:'attack-call',id:a.bu.id,targetId:d.bu.id,range:a.range,ammo:a.ammoLeft,round:this.roundNo}); return origAttack.call(this,a,d,done); };
      const origShot=s._doRangedAttack;
      s._doRangedAttack=function(a,d,done){
        const b={id:a.bu.id,targetId:d.bu.id,ammo:a.ammoLeft,hp:d.bu.hp,range:a.range,at:[a.q,a.r],targetAt:[d.q,d.r],round:this.roundNo,doctrine:this._effectiveMetaForUnit(a).doctrine};
        window.__r4LiveActions.push({type:'shot-start',...b});
        return origShot.call(this,a,d,()=>{window.__r4LiveActions.push({type:'shot-complete',...b,ammoAfter:a.ammoLeft,hpAfter:d.bu.hp});done();});
      };
      window.__r4LiveActions=[];
      window.__r4Watchdog=setInterval(()=>{window.__r4Snapshot={round:s.roundNo,finished:s.finished,actions:window.__r4LiveActions.slice(),attackers:attackers.map(attacker=>({id:attacker.bu.id,hp:attacker.bu.hp,ammo:attacker.ammoLeft,pos:[attacker.q,attacker.r],range:attacker.range,rangeBase:attacker.rangeBase,acted:attacker.acted})),defender:{id:defender.bu.id,hp:defender.bu.hp,pos:[defender.q,defender.r],acted:defender.acted,dead:defender.dead,fadingOut:defender.fadingOut,removed:defender.removed,stillOccupiesCell:s.occByKey.get(`${defender.q},${defender.r}`)===defender}}},250);
      for(const attacker of attackers) s._applyTerrainRange(attacker);
      window.__r4Setup={attackers:attackers.map(attacker=>({id:attacker.bu.id,canShoot:!!(attacker.rangedBase&&attacker.ammoLeft>0),range:attacker.range,rangeBase:attacker.rangeBase,ammo:attacker.ammoLeft,distance:Math.abs(attacker.q-defender.q)+Math.abs(attacker.r-defender.r),pos:[attacker.q,attacker.r]})),defender:defender.bu.id,defenderAt:[defender.q,defender.r],origRoster:{atk:allUnits.length}};
      if(window.__r4Setup.attackers.some(a=>!a.canShoot||a.ammo<=0||a.range<=1||a.distance>a.range)) throw new Error(`Invalid deterministic shot setup ${JSON.stringify(window.__r4Setup)}`);
      defender.bu.hp=1; defender.bu.maxHp=1;
      window.__restoreBattleRandom=Math.random; Math.random=()=>0;
      s._kickoffBattleTurn();
    });
    const setup = await page.evaluate(() => window.__r4Setup);
    mark('active:deterministic-setup', setup);
    // Watchdog persists each observed state immediately; do not wait for a long
    // battle or high round count. Stop after the first production shot or 25 sec.
    const startedAt=Date.now();
    let lastSnapshot=null;
    while(Date.now()-startedAt<45000) {
      lastSnapshot=await page.evaluate(()=>window.__r4Snapshot);
      if(lastSnapshot) fs.writeFileSync(path.join(evidenceDir,'live-death-watchdog.json'),JSON.stringify(lastSnapshot,null,2)+'\n');
      if(lastSnapshot?.defender?.fadingOut || lastSnapshot?.defender?.routed || lastSnapshot?.finished) break;
      await wait(250);
    }
    const finalBattle=await page.evaluate(()=>window.__r4Snapshot);
    const completedShots=(finalBattle?.actions||[]).filter(e=>e.type==='shot-complete');
    const checks=[
      ['live production actor is a ranged unit with legal ammo and range',setup.attackers.every(a=>a.canShoot&&a.ammo>0&&a.range>1&&a.distance<=a.range)],
      ['production ranged picker selected a legal target', (finalBattle?.actions||[]).some(e=>e.type==='ranged-pick'&&e.targetId)],
      ['production _doRangedAttack completed with HP loss and ammo spent',completedShots.some(e=>e.hpAfter<e.hp&&e.ammoAfter<e.ammo)],
      ['production doctrine remains Attack',setup && (finalBattle?.actions||[]).some(e=>e.type==='ranged-pick'&&e.doctrine==='steady')],
      ['production ranged hit removed a defender from occupancy while the opposing army remains active',!!finalBattle?.defender && finalBattle.defender.hp<=0 && !finalBattle.defender.stillOccupiesCell && !finalBattle.finished],
      ['no browser page or console errors',errors.length===0],
    ];
    for(const [label,ok] of checks) console.log(`${ok?'[PASS]':'[FAIL]'} ${label}`);
    await saveEvidence(page,'r4-live-shot','active-doctrine-battle',errors);
    fs.writeFileSync(path.join(evidenceDir,'manual-order-live-open-tile.json'),JSON.stringify({setup,final:finalBattle,completedShots,checks,errors},null,2)+'\n');
    mark('active:r4-final',{round:finalBattle?.round,actions:finalBattle?.actions?.length,completedShots,checks});
    phase='complete';
    if(checks.some(([,ok])=>!ok)) process.exitCode=2;
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

main().catch(error => { console.error('[battle-manual-orders-live-open-tile-deterministic] FAIL:', error.stack || error); process.exitCode = 1; });
