'use strict';
/**
 * Production Chromium A/B for the melee dead-end in Attack vs Charge.
 *
 * Starts a real world-map playtest, opens the production 28-vs-28 preset battle
 * over that still-live map, starts through its UI, then drives the production
 * BattleScene activation/action path in Chromium with the same unit IDs and
 * positions in paired Attack/Charge runs.
 * Product sources are never written by this harness.
 *
 * Run from gra/: node tools/battle-manual-melee-live-test.cjs
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
const out = path.join(os.tmpdir(), `battle-manual-melee-${id}`);
const evidenceDir = path.resolve(root, '..', 'dyspozycje/autobot/runs/R-BITWA-MANUAL-MELEE-ATTACK-STUCK-Q1/evidence-chromium');
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
    const startButton = page.locator('#deploy-toolbar-start');
    await startButton.waitFor({ state: 'visible', timeout: 30000 });
    await startButton.evaluate(button => button.click());
    const paired = await page.evaluate(async () => {
      const s = window.__battleLargeReturnProbe.scene;
      const all = [...s.atk, ...s.def];
      const original = new Map(all.map(u => [u.bu.id, {
        hp: u.bu.hp, maxHp: u.bu.maxHp, ammoLeft: u.ammoLeft, dead: u.dead,
        fadingOut: u.fadingOut, removed: u.removed, routed: u.routed,
      }]));
      const hasRanged = all.some(u => u.rangedBase);
      const hasMounted = all.some(u => u.mounted);
      if (s.atk.length !== 28 || s.def.length !== 28 || !hasRanged || !hasMounted) {
        throw new Error(`Expected a mixed 28v28 production roster: atk=${s.atk.length}, def=${s.def.length}, ranged=${hasRanged}, mounted=${hasMounted}`);
      }
      s._manualMode = false;
      s._manualCommanderGate = false;
      s._groupMeta.clear();
      s._groups.clear();
      for (const [side, units] of [['atk', s.atk], ['def', s.def]]) {
        const gid = `melee-${side}`;
        s._groups.set(gid, new Set(units.map(u => u.bu.id)));
        s._groupMeta.set(gid, { doctrine: 'steady', autoPlay: true, formation: 'F1', attackDirection: 'front' });
        for (const u of units) { u.groupId = gid; u.playerOrder = { type: 'none' }; }
      }

      const events = [];
      const baseAttack = s._doAttack;
      s._doAttack = function (a, d, done) {
        const before = { attackerId: a.bu.id, attackerName: a.bu.nazwa, targetId: d.bu.id,
          targetHpBefore: d.bu.hp, distance: Math.abs(a.q - d.q) + Math.abs(a.r - d.r),
          ranged: a.rangedBase && a.ammoLeft > 0, doctrine: this._effectiveMetaForUnit(a).doctrine };
        events.push({ type: 'attack-start', ...before });
        return baseAttack.call(this, a, d, () => {
          events.push({ type: 'attack-complete', ...before, targetHpAfter: d.bu.hp });
          done();
        });
      };
      const baseMove = s._doMove;
      s._doMove = function (u, q, r, done) {
        const before = { unitId: u.bu.id, name: u.bu.nazwa, from: [u.q, u.r], to: [q, r], mounted: u.mounted,
          doctrine: this._effectiveMetaForUnit(u).doctrine, moveLeft: u.moveLeft };
        events.push({ type: 'move-start', ...before });
        return baseMove.call(this, u, q, r, () => { events.push({ type: 'move-complete', ...before, after: [u.q, u.r] }); done(); });
      };
      const baseLineGate = s._compactAttackAllowsStep;
      s._compactAttackAllowsStep = function (u, col) {
        const allowed = baseLineGate.call(this, u, col);
        if (u.bu.id === s.atk[0].bu.id || u.bu.id === s.atk[1].bu.id) {
          events.push({ type: 'attack-line-candidate', unitId: u.bu.id, from: [u.q, u.r], candidateCol: col, allowed, rank: u.formationRank });
        }
        return allowed;
      };
      const runDoctrine = async doctrine => {
        let rngState = 20261029;
        Math.random = () => {
          rngState = (rngState * 1664525 + 1013904223) >>> 0;
          return rngState / 0x100000000;
        };
        s.finished = false;
        s.roundNo = 0;
        s.engaged = new Set();
        s._groupMeta.get('melee-atk').doctrine = doctrine;
        s._groupMeta.get('melee-def').doctrine = doctrine;
        s.occByKey.clear();
        for (const [side, units] of [['atk', s.atk], ['def', s.def]]) {
          units.forEach((u, index) => {
            const start = original.get(u.bu.id);
            u.bu.hp = start.hp; u.ammoLeft = start.ammoLeft;
            u.dead = start.dead; u.fadingOut = start.fadingOut; u.removed = start.removed; u.routed = start.routed;
            u.acted = false; u.moveLeft = s._movementPointsFor(u.bu);
            u.q = side === 'atk' ? 10 : 13; u.r = 6 + index;
            u.group.position.set(u.q, 0, u.r);
            u.hpBarGroup.position.set(u.q, 2.5, u.r);
            s.occByKey.set(`${u.q},${u.r}`, u);
          });
        }
        const startEvent = events.length;
        for (let turn = 1; turn <= 2; turn++) {
          s.roundNo = turn;
          for (const u of [...s.atk, ...s.def]) {
            u.moveLeft = s._movementPointsFor(u.bu);
            const nearest = s._nearestEnemy(u);
            events.push({ type: 'activation-start', doctrine, turn, unitId: u.bu.id,
              name: u.bu.nazwa, position: [u.q, u.r], targetId: nearest?.bu.id ?? null,
              distance: nearest ? Math.abs(u.q - nearest.q) + Math.abs(u.r - nearest.r) : null,
              canAttack: s._canAttackFrom(u, u.q, u.r) });
            await new Promise(resolve => s._activateUnit(u, resolve));
            events.push({ type: 'activation-end', doctrine, turn, unitId: u.bu.id, position: [u.q, u.r] });
          }
        }
        return {
          doctrine, startEvent,
          units: all.map(u => ({ id: u.bu.id, name: u.bu.nazwa, side: u.side, melee: !u.rangedBase && !u.mounted,
            ranged: u.rangedBase, mounted: u.mounted, position: [u.q, u.r], hp: u.bu.hp })),
        };
      };
      const attack = await runDoctrine('steady');
      const charge = await runDoctrine('aggressive');
      return { roster: { attacker: s.atk.length, defender: s.def.length, ranged: all.filter(u => u.rangedBase).length,
        mounted: all.filter(u => u.mounted).length, melee: all.filter(u => !u.rangedBase && !u.mounted).length }, attack, charge, events };
    });
    const attackHits = paired.events.filter(e => e.type === 'attack-complete' && e.doctrine === 'steady');
    const chargeHits = paired.events.filter(e => e.type === 'attack-complete' && e.doctrine === 'aggressive');
    const attackMeleeHits = attackHits.filter(e => !e.ranged);
    const chargeMeleeHits = chargeHits.filter(e => !e.ranged);
    const attackDeltas = attackMeleeHits.filter(e => e.targetHpAfter < e.targetHpBefore);
    const chargeDeltas = chargeMeleeHits.filter(e => e.targetHpAfter < e.targetHpBefore);
    const infantryIds = new Set(paired.attack.units.filter(u => u.melee).map(u => u.id));
    const attackInfantryHits = attackMeleeHits.filter(e => infantryIds.has(e.attackerId));
    const chargeInfantryHits = chargeMeleeHits.filter(e => infantryIds.has(e.attackerId));
    const trace = paired.events.filter(e => e.type === 'activation-start' && (e.unitId === paired.attack.units.find(u => u.side === 'atk' && u.melee)?.id)
      || e.type === 'attack-line-candidate' && e.unitId === paired.attack.units.find(u => u.side === 'atk' && u.melee)?.id);
    const report = { roster: paired.roster, attack: paired.attack, charge: paired.charge, events: paired.events,
      metrics: { attackMeleeAttacks: attackMeleeHits.length, attackMeleeHpChanges: attackDeltas.length,
        attackInfantryAttacks: attackInfantryHits.length, chargeMeleeAttacks: chargeMeleeHits.length,
        chargeMeleeHpChanges: chargeDeltas.length, chargeInfantryAttacks: chargeInfantryHits.length, trace } };
    fs.mkdirSync(evidenceDir, { recursive: true });
    fs.writeFileSync(path.join(evidenceDir, 'paired-attack-charge-trace.json'), JSON.stringify(report, null, 2) + '\n');
    mark('active:paired-attack-charge', { roster: paired.roster, metrics: report.metrics, errors });
    await saveEvidence(page, 'paired-attack-charge', phase, errors);
    if (errors.length) throw new Error(`Browser errors during active doctrine battle: ${JSON.stringify(errors)}`);
    if (paired.roster.melee < 10 || paired.roster.ranged < 1 || paired.roster.mounted < 1) throw new Error(`Mixed roster requirement not met: ${JSON.stringify(paired.roster)}`);
    if (attackInfantryHits.length === 0 || attackDeltas.length === 0) throw new Error('Atak produced no infantry melee hit with target HP decrease');
    if (chargeInfantryHits.length === 0 || chargeDeltas.length === 0) throw new Error('Szturm control produced no infantry melee hit with target HP decrease');
    if (paired.events.some(e => e.type === 'attack-start' && e.distance !== 1 && !e.ranged)) throw new Error('Illegal non-ranged attack was observed');
    const checks = [
      ['28v28 mixed production roster includes melee, ranged and mounted controls', paired.roster.attacker === 28 && paired.roster.defender === 28 && paired.roster.melee >= 10 && paired.roster.ranged >= 1 && paired.roster.mounted >= 1],
      ['Attack infantry advances and resolves melee with HP decrease', attackInfantryHits.length > 0 && attackDeltas.length > 0],
      ['Charge infantry remains active with HP decrease', chargeInfantryHits.length > 0 && chargeDeltas.length > 0],
      ['no browser page or console errors', errors.length === 0],
    ];
    for (const [label, ok] of checks) console.log(`${ok ? '[PASS]' : '[FAIL]'} ${label}`);
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
