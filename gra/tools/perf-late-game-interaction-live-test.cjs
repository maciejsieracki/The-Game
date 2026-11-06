'use strict';
/**
 * R-WEB-PERF-LATE-GAME-LAG-T86-Q1: late-game interaction latency harness (CDP profiler + real canvas clicks).
 * Derived from perf-large-empire-stress-live-test.cjs (same temporary Vite transform seeding).
 * It uses a temporary Vite transform to expose a synthetic world seeder inside
 * main.ts's closure. Product sources are never edited. Cities are valid game
 * City objects placed on real land hexes; economic turns and rendering remain real.
 * Usage: node tools/perf-large-empire-stress-live-test.cjs [turns=100]
 */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const id = `${process.pid}-${Math.random().toString(36).slice(2,8)}`;
const root = path.resolve(__dirname, '..');
const out = process.env.PERF_BUILD_DIR || path.join(os.tmpdir(), `large-empire-stress-${id}`);
const abSequence = ['all', 'coalesced', 'coalesced', 'all', 'all', 'coalesced', 'coalesced', 'all'];
const abMode = process.env.STRESS_AB === '1';
const compactMode = process.env.STRESS_COMPACT === '1';
const turns = 0;
const checkpointEvery = 10;
const wait = ms => new Promise(r => setTimeout(r, ms));
// A prior, five-turn SwiftShader sample on the same seeded 137-city/180-improvement
// workload measured ~20.6s average EOT before coalescing owner-progress paints. This
// is a rough historical reference, not a controlled A/B; map/world state can vary.
const PRIOR_SWIFTSHADER_REFERENCE_AVG_MS = 20560;
const PAGE_EVALUATE_TIMEOUT_MS = Math.max(1000, Number(process.env.STRESS_EVALUATE_TIMEOUT_MS) || 60000);
const PAGE_SCREENSHOT_TIMEOUT_MS = Math.max(1000, Number(process.env.STRESS_SCREENSHOT_TIMEOUT_MS) || 10000);
const EOT_TIMEOUT_MS = Math.max(1000, Number(process.env.STRESS_EOT_TIMEOUT_MS) || 60000);

function deadline(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

function progress(page, phase, details = {}) {
  page.__largeEmpirePhase = phase;
  page.__largeEmpirePhaseDetails = details;
  (page.__largeEmpirePhaseHistory ??= []).push({ at: new Date().toISOString(), phase, ...details });
  console.log('[large-empire] phase:', JSON.stringify({ at: new Date().toISOString(), phase, ...details }));
}

function boundPageEvaluations(page, evaluateTimeoutMs = PAGE_EVALUATE_TIMEOUT_MS, screenshotTimeoutMs = PAGE_SCREENSHOT_TIMEOUT_MS) {
  const originalEvaluate = page.evaluate.bind(page);
  let sequence = 0;
  page.evaluate = (fn, arg) => {
    const id = ++sequence;
    const phase = page.__largeEmpirePhase ?? 'unspecified';
    const startedAt = Date.now();
    const shouldLog = phase.startsWith('eot-') || phase.startsWith('offer-') || phase.startsWith('self-test-');
    if (shouldLog) console.log('[large-empire] evaluate-start:', JSON.stringify({ at: new Date().toISOString(), id, phase }));
    return deadline(originalEvaluate(fn, arg), evaluateTimeoutMs, `page.evaluate #${id} (${phase})`)
      .then(value => {
        if (shouldLog) console.log('[large-empire] evaluate-done:', JSON.stringify({ at: new Date().toISOString(), id, phase, elapsedMs: Date.now() - startedAt }));
        return value;
      })
      .catch(async error => {
        const info = { at: new Date().toISOString(), id, phase, details: page.__largeEmpirePhaseDetails ?? {}, elapsedMs: Date.now() - startedAt, error: String(error) };
        console.error('[large-empire] page-evaluate failure:', JSON.stringify(info));
        const evidence = { evaluateFailure: info, phaseHistory: page.__largeEmpirePhaseHistory ?? [], errors: page.__largeEmpireCapturedErrors ?? [], warnings: page.__largeEmpireCapturedWarnings ?? [] };
        const screenshotPath = path.join(os.tmpdir(), `large-empire-page-eval-timeout-${id}-${Date.now()}.png`);
        try {
          await deadline(page.screenshot({ path: screenshotPath, timeout: screenshotTimeoutMs }), screenshotTimeoutMs + 500, 'timeout screenshot');
          evidence.screenshot = screenshotPath;
        } catch (shotError) {
          evidence.screenshotError = String(shotError);
        }
        try {
          evidence.state = await deadline(originalEvaluate(() => ({
            world: window.__eraTestDebug?.getWorldState?.() ?? null,
            busy: window.__eraTestDebug?.isEndTurnInProgress?.() ?? null,
            lifecycle: window.__endTurnPhaseProfileTestDebug?.lifecycle?.() ?? null,
            deals: window.__dealsLiveDebug?.snapshot?.() ?? null,
            pendingAutoPreBattle: window.__turnSlowdownTestDebug?.pendingAutoPreBattleSnapshot?.() ?? null,
          })), 5000, 'timeout state snapshot');
        } catch (stateError) {
          evidence.stateError = String(stateError);
        }
        const evidencePath = path.join(os.tmpdir(), `large-empire-page-eval-timeout-${id}-${Date.now()}.json`);
        fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
        page.__largeEmpireLatestEvidencePath = evidencePath;
        console.error('[large-empire] page-evaluate timeout evidence:', evidencePath);
        throw error;
      });
  };
}

async function build() {
  // PERF_BUILD_DIR: reuse (and keep) a prebuilt single-file bundle to skip the ~2 min Vite build.
  if (process.env.PERF_BUILD_DIR && fs.existsSync(path.join(out, 'index.html'))) {
    build.identity = { reused: out, gitHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim() };
    return;
  }
  const { build: viteBuild, mergeConfig } = await import('vite');
  const base = (await import(pathToFileURL(path.join(root, 'vite.config.ts')).href)).default;
  const hashInputs = () => {
    const files = [];
    const walk = target => {
      if (!fs.existsSync(target)) return;
      const stat = fs.statSync(target);
      if (stat.isDirectory()) {
        for (const entry of fs.readdirSync(target).sort()) walk(path.join(target, entry));
      } else if (stat.isFile()) files.push(target);
    };
    for (const relativePath of ['src', 'data', 'index.html', 'vite.config.ts', 'package.json', 'package-lock.json']) {
      walk(path.join(root, relativePath));
    }
    const hash = crypto.createHash('sha256');
    for (const filePath of files.sort()) {
      hash.update(path.relative(root, filePath));
      hash.update('\0');
      hash.update(crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex'));
      hash.update('\n');
    }
    return hash.digest('hex');
  };
  const sourceIdentity = () => ({
    mainTsSha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'src/main.ts'))).digest('hex'),
    productionTsSha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'src/game/production.ts'))).digest('hex'),
    buildInputTreeSha256: hashInputs(),
    harnessSha256: crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),
  });
  const sourceBeforeBuild = sourceIdentity();
  console.log('[large-empire] source identity before build:', JSON.stringify(sourceBeforeBuild));
  const plugin = {
    name: 'temporary-large-empire-stress-seeder',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/main.ts')) return null;
      let output = code;
      // call counters (diagnostics only; the harness bundle is temporary): window.__perfCnt[name]
      for (const [sig, nm] of [
        ['    function refreshFog(opts?: { skipVeteranEducation?: boolean }): void {', 'refreshFog'],
        ['    function syncUnitsRender(list?: RuntimeUnit[]): void {', 'syncUnitsRender'],
        ['    function refreshTerritoryBorderOverlay(): void {', 'refreshTerritoryBorderOverlay'],
        ['    function buildHudState(ownerId: number = ME()): HudState {', 'buildHudState'],
        ['    function updateHud(): void {', 'updateHud'],
      ]) {
        if (!output.includes(sig)) throw new Error('counter anchor missing: ' + nm);
        output = output.replace(sig, sig + " ((window as any).__perfCnt ??= {})['" + nm + "'] = (((window as any).__perfCnt)['" + nm + "'] || 0) + 1;");
      }
      // Only this existing test hook's game setup is widened; normal app code is unchanged.
      const aiHook = output.indexOf('(window as any).__aiBuildingsTestDebug = {');
      if (aiHook < 0) throw new Error('ai buildings test hook not found');
      const hookEnd = output.indexOf('\n    };', aiHook);
      if (hookEnd < 0) throw new Error('ai buildings hook end not found');
      const section = output.slice(aiHook, hookEnd);
      if (!section.includes("mapSize: 'Maly'")) throw new Error('expected small map setup not found');
      output = output.slice(0, aiHook) + section.replace("mapSize: 'Maly'", "mapSize: 'Standardowy'") + output.slice(hookEnd);

      const marker = '      snapshotInfo: (): {';
      if (!output.includes(marker)) throw new Error('turn slowdown hook injection point missing');
      const injected = `      seedLargeEmpireForStress: (targets: { player: number; rivals: number; improvements: number }) => {
        const owners = Array.from(new Set(cities.filter(c => isMajorAiOwner(c.ownerId, isCityStateOwner)).map(c => c.ownerId)));
        const rivalOwners = owners.filter(id => id !== 0).slice(0, targets.rivals);
        if (rivalOwners.length !== targets.rivals) throw new Error('Expected ' + targets.rivals + ' major AI owners, got ' + rivalOwners.length);
        const planned = [{ ownerId: 0, target: targets.player }, ...rivalOwners.map(ownerId => ({ ownerId, target: 15 }))];
        const occupied = new Set(cities.map(c => keyOf(c.q, c.r)));
        const land = Object.entries(map.hexes).filter(([k,h]) => !occupied.has(k) && !isWaterTerrain(h.terenBazowy) && h.terenBazowy !== TerenBazowy.Gory);
        const chosen: Array<{q:number;r:number;ownerId:number}> = [];
        for (const p of planned) {
          let have = cities.filter(c => c.ownerId === p.ownerId).length;
          for (const [k] of land) {
            if (have >= p.target) break;
            if (occupied.has(k)) continue;
            const [q,r] = k.split(',').map(Number);
            if (chosen.some(c => hexDistance(q,r,c.q,c.r) < 4)) continue;
            chosen.push({q,r,ownerId:p.ownerId}); occupied.add(k); have++;
          }
          if (have < p.target) throw new Error('Could only place ' + have + '/' + p.target + ' cities for owner ' + p.ownerId);
        }
        const buildingIds = ['stolarnia','spichlerz','targowisko','koszary','biblioteka'].filter(id => data.buildings.some(b => b.id === id));
        for (const pos of chosen) {
          const city = foundCityAt(pos.q,pos.r,pos.ownerId,cities,map,'Stress '+cities.length,false,true);
          if (!city) throw new Error('foundCityAt rejected stress location ' + pos.q + ',' + pos.r);
          city.population = 8;
          ensureCitySaveDefaults(city);
          cities.push(city);
          seedCityOwnerDefaults(city);
          cityBuilt.set(city.id,[...buildingIds]);
          finalizeCityFounding(city,pos.q,pos.r);
        }
        const free = land.filter(([k]) => !occupied.has(k));
        let placed = 0;
        for (let i=0; i<Math.min(targets.improvements, free.length); i++) {
          const [hk] = free[i]!;
          const layers = (i % 5 === 0 ? ['kopalnia_cyny'] : i % 5 === 1 ? ['kopalnia_miedzi'] : i % 5 === 2 ? ['droga'] : ['farma']) as PlacedLayers;
          placedImprovements.set(hk,layers);
          syncHexUlepszenieFields(hk,layers);
          spawnImprovementMesh(hk);
          placed++;
        }
        cityRenderer.sync(cities,_cityRenderOpts());
        refreshFog(); updateHud(); refreshD1bHud();
        const counts: Record<string,number> = {};
        for (const c of cities) counts[String(c.ownerId)] = (counts[String(c.ownerId)] ?? 0) + 1;
        return { counts, majorAiOwners:rivalOwners, cities:cities.length, improvements:placed, buildingsPerCity:buildingIds };
      },
`;
      output = output.replace(marker, injected + marker);

      const perfMarker = '      snapshotInfo: (): {';
      const perfHooks = `      perfHexClient: (q: number, r: number) => {
        const w = axialToWorld(q, r, HEX_R);
        const v = (camera.position.clone().set(w.x, unitRenderer.topYAt(q, r), w.z)) as any;
        const p = v.clone().project(camera);
        const rect = canvas.getBoundingClientRect();
        return { x: rect.left + (p.x + 1) / 2 * rect.width, y: rect.top + (1 - p.y) / 2 * rect.height, ok: Math.abs(p.x) < 0.9 && Math.abs(p.y) < 0.9 && p.z < 1 };
      },
      perfFocus: (q: number, r: number, dist?: number) => { const w = axialToWorld(q, r, HEX_R); camCtrl.focusAt(w.x, w.z, dist); },
      perfRefill: (id: string) => { const u = units.find(x => x.id === id); if (u) u.ruchLeft = u.ruch; },
      perfSeedUnits: (playerPer: number, aiPer: number) => {
        const tpl = units.find(u => u.ownerId === 0 && !isCivilianUnit(u)) ?? units.find(u => !isCivilianUnit(u));
        if (!tpl) throw new Error('no unit template');
        const dirs = [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]] as const;
        const used = new Set<string>(units.map(u => keyOf(u.q, u.r)));
        const mine: Array<{ id: string; q: number; r: number; cq: number; cr: number }> = [];
        let n = 0;
        for (const c of cities) {
          const per = isMe(c.ownerId) ? playerPer : (isMajorAiOwner(c.ownerId, isCityStateOwner) ? aiPer : 0);
          for (let i = 0; i < per; i++) {
            let spot: { q: number; r: number } | null = null;
            for (let ring = 1; ring <= 2 && !spot; ring++) for (const [dq, dr] of dirs) {
              const q = c.q + dq * ring, r = c.r + dr * ring; const h = map.hexes[keyOf(q, r)];
              if (!h || isWaterTerrain(h.terenBazowy) || h.terenBazowy === TerenBazowy.Gory || used.has(keyOf(q, r)) || cities.some(cc => cc.q === q && cc.r === r)) continue;
              spot = { q, r }; break;
            }
            if (!spot) continue;
            used.add(keyOf(spot.q, spot.r));
            const id = 'perfSeed-' + (n++);
            units.push({ ...tpl, id, ownerId: c.ownerId, q: spot.q, r: spot.r, ruchLeft: tpl.ruch });
            if (isMe(c.ownerId)) mine.push({ id, q: spot.q, r: spot.r, cq: c.q, cr: c.r });
          }
        }
        refreshFog(); updateHud(); refreshD1bHud();
        return { seeded: n, mine, total: units.length };
      },
      perfFogParts: (reps: number) => {
        const t = (label: string, fn: () => unknown) => { const a = performance.now(); for (let i = 0; i < reps; i++) fn(); return [label, +((performance.now() - a) / reps).toFixed(2)] as [string, number]; };
        const vis = currentVisible();
        const exp = fogExploredForRender();
        const rows: Array<[string, number]> = [];
        rows.push(t('refreshFog(total)', () => refreshFog()));
        rows.push(t('currentVisible', () => currentVisible()));
        rows.push(t('fogExploredForRender', () => fogExploredForRender()));
        rows.push(t('updateDiplomaticDiscovery', () => updateDiplomaticDiscovery(vis)));
        rows.push(t('addExplored', () => addExplored(exploredByHuman.get(ME())!, vis)));
        rows.push(t('syncCampMeshes', () => syncCampMeshes()));
        rows.push(t('syncVillageMeshes', () => syncVillageMeshes()));
        rows.push(t('setFog', () => setFog(vis, exp, { landReveal: revealAllLand, riverRevealKeys: startRevealKeysForRiverFog() })));
        rows.push(t('syncResourceOverlayFog', () => syncResourceOverlayFog(vis, exp)));
        rows.push(t('syncImprovementMeshFog', () => syncImprovementMeshFog(vis, exp)));
        rows.push(t('syncSettlementMeshFog', () => syncSettlementMeshFog(vis, exp)));
        rows.push(t('syncWorkerFieldOverlayFog', () => syncWorkerFieldOverlayFog(workerFieldOverlayGroup, vis, exp, true)));
        rows.push(t('visibleUnitsList', () => visibleUnitsList(vis)));
        rows.push(t('syncUnitsRender', () => syncUnitsRender(visibleUnitsList(vis))));
        rows.push(t('cityRenderer.applyFogVisibility', () => cityRenderer.applyFogVisibility(vis, true, ME())));
        rows.push(t('wonderRenderer.applyFogVisibility', () => wonderRenderer.applyFogVisibility(vis, true)));
        rows.push(t('refreshD1bHud', () => refreshD1bHud()));
        rows.push(t('checkNewDiplomaticContacts', () => checkNewDiplomaticContacts()));
        rows.push(t('checkVeteranEnemyFirstEncounter', () => checkVeteranEnemyFirstEncounter(vis)));
        return { visSize: vis.size, exploredSize: (exp as any).size ?? null, rows };
      },
      perfSceneBreakdown: () => {
        scene.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
        const fr = new THREE.Frustum();
        fr.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
        const groups: Record<string, { objs: number; inFrustum: number; calls: number; instances: number; tris: number }> = {};
        let total = 0, vis = 0, hidden = 0;
        const sphere = new THREE.Sphere();
        scene.traverse((o: any) => {
          if (!(o.isMesh || o.isLine || o.isPoints)) return;
          let v = true; for (let a = o; a; a = a.parent) if (!a.visible) { v = false; break; }
          if (!v) { hidden++; return; }
          total++;
          let top: any = o; const chain: string[] = [];
          for (let a = o.parent; a && a !== scene; a = a.parent) { top = a; chain.push(a.name || a.type); }
          const key = (top === o ? '(root)' : (chain[chain.length - 1] + (chain.length > 1 ? '/' + chain[chain.length - 2] : ''))) + '|' + (o.isInstancedMesh ? 'inst' : o.isMesh ? 'mesh' : o.type);
          const g = (groups[key] ??= { objs: 0, inFrustum: 0, calls: 0, instances: 0, tris: 0 });
          g.objs++;
          let inF = true;
          if (o.frustumCulled !== false && o.geometry) {
            if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
            if (o.geometry.boundingSphere) { sphere.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld); inF = fr.intersectsSphere(sphere); }
          }
          if (inF) { g.inFrustum++; vis++; g.calls += (Array.isArray(o.material) ? o.material.length : 1); if (o.isInstancedMesh) g.instances += o.count; const idx = o.geometry?.index; g.tris += Math.round(((idx ? idx.count : o.geometry?.attributes?.position?.count ?? 0) / 3) * (o.isInstancedMesh ? o.count : 1)); }
        });
        const rows = Object.entries(groups).sort((a, b) => b[1].calls - a[1].calls).slice(0, 25).map(([k, g]) => ({ k, ...g }));
        return { total, visible: vis, hiddenSkipped: hidden, cameraDist: camCtrl.getFocusState().dist, rows };
      },
      perfSceneTopGroups: () => {
        const sig: Record<string, { n: number; meshes: number; ex: string }> = {};
        for (const c of scene.children as any[]) {
          if (!c.visible) continue;
          let m = 0; c.traverse((o: any) => { if (o.isMesh || o.isLine || o.isPoints) m++; });
          const ud = Object.keys(c.userData || {}).slice(0, 6).join(',');
          const k = c.type + '|' + (c.name || '-') + '|ud:' + ud + '|ch:' + c.children.length;
          const g = (sig[k] ??= { n: 0, meshes: 0, ex: '' });
          g.n++; g.meshes += m;
          if (!g.ex) g.ex = JSON.stringify(c.userData || {}).slice(0, 160) + ' pos=' + c.position.x.toFixed(0) + ',' + c.position.z.toFixed(0);
        }
        return Object.entries(sig).sort((a, b) => b[1].meshes - a[1].meshes).slice(0, 20).map(([k, g]) => ({ k, ...g }));
      },
      perfRenderProbe: () => {
        const run = (shadow: boolean) => {
          renderer.info.reset();
          renderer.shadowMap.needsUpdate = shadow;
          const t = performance.now();
          renderer.render(scene, camera);
          renderer.getContext().finish();
          return { ms: +(performance.now() - t).toFixed(1), calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
        };
        run(false);
        const noShadow = [run(false), run(false), run(false)];
        const withShadow = [run(true), run(true), run(true)];
        return { shadowsEnabled: renderer.shadowMap.enabled, dist: camCtrl.getFocusState().dist, noShadow, withShadow };
      },
      perfInfoLogStart: () => { (window as any).__perfInfoLog = []; (window as any).__perfInfoTimer = setInterval(() => { (window as any).__perfInfoLog.push({ t: Math.round(performance.now()), calls: renderer.info.render.calls, dist: +camCtrl.getFocusState().dist.toFixed(1), anim: isAnimating }); }, 150); },
      perfInfoLogStop: () => { clearInterval((window as any).__perfInfoTimer); return (window as any).__perfInfoLog; },
      perfSave: async (slot: string) => { const r = await persistSaveToSlot(slot, 'perf-q2'); return { ok: r.ok, cities: cities.length, units: units.length }; },
      perfLoad: async (slot: string) => { await loadGameFromSlot(slot, false); },
      perfSelected: () => selectedId,
      perfPlayerCityPositions: () => cities.filter(c => isMe(c.ownerId)).map(c => ({ id: c.id, q: c.q, r: c.r })),
      perfUnitsOf: (owner: number) => units.filter(u => u.ownerId === owner).map(u => ({ id: u.id, q: u.q, r: u.r, ruchLeft: u.ruchLeft, civ: isCivilianUnit(u) })),
      perfCityPanelOpen: () => isCityPanelOpen(),
      perfCloseCityPanel: () => { if (isCityPanelOpen()) hideCityPanelFull(); },
      perfPlanned: (id: string) => plannedMarches.has(id),
      perfAnimating: () => isAnimating,
      perfCounts: () => ({ units: units.length, cities: cities.length, planned: plannedMarches.size }),
`;
      if (!output.includes(perfMarker)) throw new Error('perf hook anchor missing');
      output = output.replace(perfMarker, perfHooks + perfMarker);

      // Test-harness-only ownership/diplomacy evidence for any city transition.
      const ownershipMarker = '      snapshotInfo: (): {';
      const ownershipHooks = `      cityOwnershipSnapshot: () => cities.map(c => ({ cityId: c.id, cityName: c.name, ownerId: c.ownerId })),
      cityCaptureEventsSnapshot: () => Array.from(cityCaptureEventDetails.entries()).map(([id, v]) => ({ id, cityName: v.cityName, title: v.title, subtitle: v.subtitle })),
      runAutoSiegeScanForStress: () => scanAutoSiegesAfterAiTurn(),
      prepareDirectSiegeFixture: (targetCount: number, attackersPerCity: number) => {
        // Skip the real capital/start city so the first half remains an empty-city capture cohort.
        const targets = cities.filter(c => c.ownerId === 0).slice(1, targetCount + 1);
        const aiOwnerId = cities.find(c => c.ownerId > 0 && isMajorAiOwner(c.ownerId, isCityStateOwner))?.ownerId;
        if (targets.length !== targetCount || aiOwnerId === undefined) throw new Error('could not select siege targets/AI owner');
        const template = units.find(u => u.ownerId === aiOwnerId && !isCivilianUnit(u)) ?? units.find(u => !isCivilianUnit(u));
        const defenderTemplate = units.find(u => u.ownerId === 0 && !isCivilianUnit(u)) ?? template;
        if (!template) throw new Error('no military unit template for direct siege fixture');
        const dirs = [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]] as const;
        const staged: Array<{cityId:string; cityName:string; attackers:number; adjacentHex:{q:number;r:number}}> = [];
        for (let ci=0; ci<targets.length; ci++) {
          const city=targets[ci]!;
          city.maMur=true;
          city.oblegane=false;
          city.oblegajacyOwnerId=undefined;
          const adjacent=dirs.map(([dq,dr])=>({q:city.q+dq,r:city.r+dr})).find(p=>!!map.hexes[keyOf(p.q,p.r)]);
          if (!adjacent) throw new Error('no map hex adjacent to siege target '+city.id);
          for (let ui=0; ui<attackersPerCity; ui++) {
            units.push({...template,id:'largeEmpireDirectSiege-'+ci+'-'+ui,ownerId:aiOwnerId,q:adjacent.q,r:adjacent.r});
          }
          const battlePath=ci>=Math.floor(targetCount/2);
          if (battlePath) units.push({...defenderTemplate,id:'largeEmpireDirectSiegeDef-'+ci,ownerId:0,q:city.q,r:city.r});
          staged.push({cityId:city.id,cityName:city.name,attackers:attackersPerCity,defenders:battlePath?1:0,pathExpected:battlePath?'battle':'empty-capture',adjacentHex:adjacent});
        }
        return {aiOwnerId,playerOwnerId:0,targets:staged,cities:cities.length,units:units.length};
      },
      relationSnapshot: (a: number, b: number) => {
        const rel = getDiploRelation(a, b);
        const meta = getDiploPairMeta(a, b);
        const key = diploPairKey(a, b);
        const eraLock = forcedEraPeaceUntilNextEraByPairKey.get(key) ?? null;
        return { status: rel.status, peaceLocked: isPeaceLockedBetween(a, b), peaceUntilTurn: meta.peaceUntilTurn ?? null,
          eraLock: eraLock ? { ownerId: eraLock.ownerId, era: eraLock.era } : null,
          forcedWar: { stone: stoneForceWarActiveByPairKey.has(key), bronze: bronzeForceWarActiveByPairKey.has(key), iron: ironForceWarActiveByPairKey.has(key) } };
      },
`;
      if (!output.includes(ownershipMarker)) throw new Error('ownership diagnostic hook anchor missing');
      output = output.replace(ownershipMarker, ownershipHooks + ownershipMarker);

      return { code: output, map: null };
    },
  };
  await viteBuild(mergeConfig(base, { root, plugins: [plugin], build: { outDir: out, emptyOutDir: true, minify: false } }));
  const htmlPath = path.join(out, 'index.html');
  const html = await fs.promises.readFile(htmlPath);
  const sourceAfterBuild = sourceIdentity();
  console.log('[large-empire] source identity after build:', JSON.stringify(sourceAfterBuild));
  if (sourceBeforeBuild.buildInputTreeSha256 !== sourceAfterBuild.buildInputTreeSha256) {
    throw new Error('product source changed during Vite build; refusing to start browser workload');
  }
  build.identity = {
    gitHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    indexHtmlBytes: html.byteLength,
    indexHtmlSha256: crypto.createHash('sha256').update(html).digest('hex'),
    sourceBeforeBuild,
    sourceAfterBuild,
  };
}


// ---------------------------------------------------------------- MAIN (interaction probe)
const OUT_JSON = process.env.PERF_OUT || path.join(os.tmpdir(), `late-game-interaction-${id}.json`);
const REPEAT = Math.max(1, Number(process.env.PERF_REPEAT) || 6);
const PROFILE = process.env.PERF_PROFILE !== '0';
const MODE = process.env.PERF_MODE || 'full';
const PROFILE_DIR = process.env.PERF_PROFILE_DIR || path.join(os.tmpdir(), 'perf-q2-profile');
const FIXED_PORT = Number(process.env.PERF_PORT) || 47321;
const SLOT = 'perfq2';

function summarizeProfile(profile, topN = 15) {
  const nodes = new Map(profile.nodes.map(n => [n.id, n]));
  const self = new Map();
  const dt = profile.timeDeltas;
  for (let i = 0; i < profile.samples.length; i++) {
    const n = nodes.get(profile.samples[i]);
    const cf = n.callFrame;
    const key = `${cf.functionName || '(anon)'} ${(cf.url || '').split('/').pop()}:${cf.lineNumber + 1}`;
    self.set(key, (self.get(key) || 0) + (dt[i] || 0));
  }
  const total = [...self.values()].reduce((a, b) => a + b, 0);
  // inclusive time (each function counted once per sample along the root path) + sample counts
  const parent = new Map();
  for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const incl = new Map();
  for (let i = 0; i < profile.samples.length; i++) {
    const seen = new Set();
    for (let id = profile.samples[i]; id !== undefined; id = parent.get(id)) {
      const cf = nodes.get(id).callFrame;
      const key = `${cf.functionName || '(anon)'} ${(cf.url || '').split('/').pop()}:${cf.lineNumber + 1}`;
      if (seen.has(key)) continue;
      seen.add(key);
      incl.set(key, (incl.get(key) || 0) + (dt[i] || 0));
    }
  }
  const skip = k => k.startsWith('(idle)') || k.startsWith('(root)') || k.startsWith('(program)');
  return {
    totalMs: +(total / 1000).toFixed(1),
    top: [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN).map(([k, v]) => ({ fn: k, selfMs: +(v / 1000).toFixed(1), pct: +(100 * v / total).toFixed(1) })),
    inclusive: [...incl.entries()].filter(([k]) => !skip(k)).sort((a, b) => b[1] - a[1]).slice(0, Number(process.env.PERF_INCL_N) || 40).map(([k, v]) => ({ fn: k, inclMs: +(v / 1000).toFixed(1) })),
  };
}

function pct(arr, p) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(1);
}

async function main() {
  await build();
  console.log('[perf] build identity:', JSON.stringify(build.identity));
  if (process.env.PERF_BUILD_ONLY === '1') return;
  const launchArgs = ['--no-sandbox', '--headless=new', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  // PERF_MODE=save|load: persistent profile (IndexedDB slot) + fixed port, so the ~8 min map generation is paid once (save) and later runs load the snapshot.
  const persistent = MODE === 'save' || MODE === 'load';
  let ctx = null;
  const browser = persistent
    ? (ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, executablePath: '/opt/pw-browsers/chromium', args: launchArgs, viewport: { width: 1600, height: 1000 } }))
    : await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium', args: launchArgs });
  const server = http.createServer((req, res) => {
    res.setHeader('content-type', 'text/html; charset=utf-8');
    fs.createReadStream(path.join(out, 'index.html')).pipe(res);
  });
  await new Promise(resolve => server.listen(persistent ? FIXED_PORT : 0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/?playtest=stress`;
  const errors = [];
  const result = { build: build.identity, scenarios: {} };
  try {
    const page = persistent ? (ctx.pages()[0] ?? await ctx.newPage()) : await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    boundPageEvaluations(page, 120000);
    page.setDefaultTimeout(120000);
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    progress(page, 'page-load');
    await page.goto(url, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__aiBuildingsTestDebug && !!window.__turnSlowdownTestDebug, undefined, { timeout: 180000 });
    let loadedMine = null;
    if (MODE === 'load') {
      progress(page, 'load-slot');
      await page.evaluate(slot => { window.__turnSlowdownTestDebug.perfLoad(slot); }, SLOT);
      await page.waitForFunction(() => { const c = window.__turnSlowdownTestDebug.perfCounts(); return c.cities >= 137 && c.units >= 300 && !document.querySelector('.civ-map-load-overlay'); }, undefined, { timeout: 400000, polling: 1000 });
      progress(page, 'loaded');
      const pcs = await page.evaluate(() => window.__turnSlowdownTestDebug.perfPlayerCityPositions());
      const mu = (await page.evaluate(() => window.__turnSlowdownTestDebug.perfUnitsOf(0))).filter(u => u.id.startsWith('perfSeed-'));
      loadedMine = mu.map(u => { let best = pcs[0]; let bd = 1e9; for (const c of pcs) { const d = Math.abs(c.q - u.q) + Math.abs(c.r - u.r); if (d < bd) { bd = d; best = c; } } return { id: u.id, q: u.q, r: u.r, cq: best.q, cr: best.r }; });
      await wait(3000);
    } else {
    progress(page, 'new-game-start');
    await page.evaluate(() => window.__aiBuildingsTestDebug.startNewGame({ rivals: '6', cityStates: 0, civTypes: 7, seed: 1412026 }));
    await page.waitForFunction(() => {
      const d = window.__cityStateStartUnitsTestDebug?.dumpState?.();
      const loading = !!document.querySelector('.civ-map-load-overlay');
      return !!d && !loading && d.awaitingFirstPlayerCity === true && d.playerStartHex !== null;
    }, undefined, { timeout: 2700000, polling: 1000 });
    progress(page, 'player-start-city');
    if (!await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity())) throw new Error('no start city');
    await page.waitForFunction(() => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen >= 1, undefined, { timeout: 60000 });
    await page.evaluate(() => window.__rebelProtectionTestDebug?.disableVictoryCheckForTest?.());
    progress(page, 'fixture-seed');
    const seeded = await page.evaluate(() => window.__turnSlowdownTestDebug.seedLargeEmpireForStress({ player: 40, rivals: 6, improvements: 180 }));
    console.log('[perf] scenario:', JSON.stringify(seeded));
    await wait(3000);
    }

    // in-page recorders: synchronous mouseup handler cost (capture->bubble on window) + long tasks
    await page.evaluate(() => {
      window.__perfHandler = [];
      window.__perfLong = [];
      try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__perfLong.push(+e.duration.toFixed(1)); }).observe({ entryTypes: ['longtask'] }); } catch {}
      let t0 = 0;
      window.addEventListener('mouseup', () => { t0 = performance.now(); }, true);
      window.addEventListener('mouseup', () => { window.__perfHandler.push(+(performance.now() - t0).toFixed(1)); }, false);
    });

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
    const TD = 'window.__turnSlowdownTestDebug';

    async function profiled(label, fn) {
      await page.evaluate(() => { window.__perfHandler = []; window.__perfLong = []; window.__perfCnt = {}; });
      if (PROFILE) await cdp.send('Profiler.start');
      const t = Date.now();
      const extra = await fn();
      await wait(400);
      const wall = Date.now() - t;
      let prof = null;
      if (PROFILE) prof = summarizeProfile((await cdp.send('Profiler.stop')).profile);
      const lat = await page.evaluate(() => ({ h: window.__perfHandler.slice(), long: window.__perfLong.slice(), cnt: { ...(window.__perfCnt || {}) } }));
      const row = { label, wallMs: wall, handlerMs: lat.h, handlerP50: pct(lat.h, .5), handlerP95: pct(lat.h, .95), handlerMax: lat.h.length ? Math.max(...lat.h) : null, longTasks: lat.long, longTasksOver200: lat.long.filter(x => x > 200).length, profile: prof, extra };
      row.callCounts = lat.cnt;
      result.scenarios[label] = row;
      console.log('[perf] callCounts', label, JSON.stringify(lat.cnt));
      console.log('[perf]', label, JSON.stringify({ handlerMs: lat.h, long: lat.long, profTotalMs: prof && prof.totalMs }));
      if (prof) console.log('  top:', prof.top.filter(t => !t.fn.startsWith('(idle)')).slice(0, 12).map(t => `${t.fn} ${t.selfMs}ms`).join(' | '));
      if (prof) console.log('  incl:', prof.inclusive.slice(0, Number(process.env.PERF_INCL_N) || 40).map(t => `${t.fn} ${t.inclMs}ms`).join(' | '));
      return row;
    }

    async function clickHex(q, r) {
      const p = await page.evaluate(([q, r]) => window.__turnSlowdownTestDebug.perfHexClient(q, r), [q, r]);
      if (!p.ok) return { ok: false };
      await page.mouse.move(p.x, p.y);
      await page.mouse.down();
      await page.mouse.up();
      return { ok: true };
    }
    const focus = (q, r, d = 40) => page.evaluate(([q, r, d]) => window.__turnSlowdownTestDebug.perfFocus(q, r, d), [q, r, d]);

    // seed a late-game-sized unit population (player 3/city = ~120, each major AI 2/city = ~180)
    const seededUnits = loadedMine ? { seeded: loadedMine.length, mine: loadedMine, total: (await page.evaluate(() => window.__turnSlowdownTestDebug.perfCounts())).units } : await page.evaluate(() => window.__turnSlowdownTestDebug.perfSeedUnits(3, 2));
    if (MODE === 'save') {
      const sv = await page.evaluate(slot => window.__turnSlowdownTestDebug.perfSave(slot), SLOT);
      console.log('[perf] saved slot:', JSON.stringify(sv));
      if (!sv.ok) throw new Error('save failed');
      return;
    }
    console.log('[perf] seeded units:', seededUnits.seeded, 'total', seededUnits.total);
    result.seededUnits = { seeded: seededUnits.seeded, total: seededUnits.total };
    await wait(2000);

    if (process.env.PERF_SKIP_FOG !== '1') {
    // A. fog pipeline breakdown (pure JS, per call)
    const fog = await page.evaluate(() => window.__turnSlowdownTestDebug.perfFogParts(8));
    result.fogParts = fog;
    console.log('[perf] fog parts (ms/call):', JSON.stringify(fog));
    await profiled('refreshFog-x15', async () => { await page.evaluate(() => { for (let i = 0; i < 15; i++) window.__turnSlowdownTestDebug.perfFogParts(1); }); });

    result.renderInfo = await page.evaluate(() => window.__turnSlowdownTestDebug.renderInfo());
    console.log('[perf] renderInfo:', JSON.stringify(result.renderInfo));
    result.sceneBreakdown = await page.evaluate(() => window.__turnSlowdownTestDebug.perfSceneBreakdown());
    console.log('[perf] sceneBreakdown:', JSON.stringify(result.sceneBreakdown));
    result.sceneTop = await page.evaluate(() => window.__turnSlowdownTestDebug.perfSceneTopGroups());
    console.log('[perf] sceneTop:', JSON.stringify(result.sceneTop));
    if (process.env.PERF_ONLY_SCENE === '1') { fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2)); return; }
    if (process.env.PERF_ONLY_FOG === '1') {
      // pure-JS scenarios without GL-heavy frames: HUD/fog pipeline only
      // best-of-N / median-of-N (shared CI-like machine: wall time is noisy, minimum approximates uncontended cost)
      const N = Number(process.env.PERF_BEST_N) || 10;
      const runs = [];
      for (let k = 0; k < N; k++) runs.push((await page.evaluate(() => window.__turnSlowdownTestDebug.perfFogParts(1))).rows);
      const stat = {};
      for (let i = 0; i < runs[0].length; i++) {
        const v = runs.map(r => r[i][1]).sort((a, b) => a - b);
        stat[runs[0][i][0]] = { min: v[0], median: v[Math.floor(v.length / 2)] };
      }
      result.best = stat;
      console.log('[perf] BEST-OF-' + N + ' (min/median ms):', JSON.stringify(stat));
      result.errors = errors.slice(0, 10);
      fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2));
      console.log('[perf] result written:', OUT_JSON);
      return;
    }
    if (process.env.PERF_ONLY_EOT !== '1') {
    await profiled('idle-3s', async () => { await wait(3000); });
    result.counts = await page.evaluate(() => window.__turnSlowdownTestDebug.perfCounts());

    // B. camera pan
    await profiled('camera-pan-drag', async () => {
      for (let i = 0; i < REPEAT; i++) {
        await page.mouse.move(800, 500);
        await page.mouse.down({ button: 'left' });
        await page.mouse.move(860, 530, { steps: 6 });
        await page.mouse.up();
        await wait(200);
      }
    });

    }

    if (process.env.PERF_PROBE === '1') {
      const u = seededUnits.mine[0];
      for (const d of [40, 120]) {
        await focus(u.q, u.r, d); await wait(1500);
        console.log('[perf] renderProbe d=' + d + ':', JSON.stringify(await page.evaluate(() => window.__turnSlowdownTestDebug.perfRenderProbe())));
      }
      return;
    }
    // C. select unit / move / enter city (real canvas clicks)
    const mine = seededUnits.mine;
    const u0 = mine[0];
    await focus(u0.q, u0.r);
    await wait(1200);
    await profiled('select-unit-click', async () => {
      const res = [];
      for (let i = 0; i < REPEAT; i++) {
        const m = mine[i % mine.length];
        await focus(m.q, m.r); await wait(500);
        await clickHex(m.q, m.r); await wait(300);
        res.push(await page.evaluate(() => window.__turnSlowdownTestDebug.perfSelected()));
      }
      return res;
    });
    if (process.env.PERF_PROBE === '4') {
      // R4: odstep rAF (realny koszt klatki) tuz przed i po zaznaczeniu jednostki, ten sam kadr
      const rafIntervals = ms => page.evaluate(ms => new Promise(res => { const out = []; let last = performance.now(); const t0 = last; const f = t => { out.push(Math.round(t - last)); last = t; if (t - t0 < ms) requestAnimationFrame(f); else res(out); }; requestAnimationFrame(f); }), ms);
      for (const k of [3, 5]) {
        const m = mine[k];
        await focus(m.q, m.r); await wait(2500);
        const idle = await rafIntervals(6000);
        await clickHex(m.q, m.r); await wait(500);
        const sel = await rafIntervals(6000);
        console.log('[perf] rafProbe unit#' + k + ':', JSON.stringify({ idleFrames: idle, selectedFrames: sel, info: await page.evaluate(() => window.__turnSlowdownTestDebug.renderInfo()) }));
        await page.evaluate(() => window.__turnSlowdownTestDebug.perfDeselect?.());
      }
      return;
    }
    if (process.env.PERF_PROBE === '3') {
      const m = mine[3];
      await focus(m.q, m.r); await wait(1500);
      console.log('[perf] before-select:', JSON.stringify(await page.evaluate(() => ({ r: window.__turnSlowdownTestDebug.renderInfo(), b: window.__turnSlowdownTestDebug.perfSceneBreakdown() }))));
      await clickHex(m.q, m.r); await wait(15000);
      console.log('[perf] after-select:', JSON.stringify(await page.evaluate(() => ({ r: window.__turnSlowdownTestDebug.renderInfo(), b: window.__turnSlowdownTestDebug.perfSceneBreakdown(), top: window.__turnSlowdownTestDebug.perfSceneTopGroups() }))));
      return;
    }
    if (process.env.PERF_PROBE === '2') { await page.evaluate(() => window.__turnSlowdownTestDebug.perfInfoLogStart()); }
    await profiled('unit-move-click', async () => {
      const res = [];
      for (let i = 0; i < REPEAT; i++) {
        const m = mine[(i + 10) % mine.length];
        await page.evaluate(id => window.__turnSlowdownTestDebug.perfRefill(id), m.id);
        await focus(m.q, m.r); await wait(500);
        await clickHex(m.q, m.r); await wait(300);
        const d = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]][i % 6];
        const c = await clickHex(m.q + d[0], m.r + d[1]);
        for (let k = 0; k < 150; k++) { if (!await page.evaluate(() => window.__turnSlowdownTestDebug.perfAnimating())) break; await wait(100); }
        await wait(300);
        const after = (await page.evaluate(() => window.__turnSlowdownTestDebug.perfUnitsOf(0))).find(u => u.id === m.id);
        res.push({ c, from: [m.q, m.r], after: after && [after.q, after.r], planned: await page.evaluate(id => window.__turnSlowdownTestDebug.perfPlanned(id), m.id) });
      }
      return res;
    });
    if (process.env.PERF_PROBE === '2') { const lg = await page.evaluate(() => window.__turnSlowdownTestDebug.perfInfoLogStop()); console.log('[perf] infoLog:', JSON.stringify(lg.slice(-400))); return; }
    await profiled('unit-enter-city-click', async () => {
      const res = [];
      for (let i = 0; i < REPEAT; i++) {
        const m = mine[(i + 20) % mine.length];
        await page.evaluate(id => window.__turnSlowdownTestDebug.perfRefill(id), m.id);
        await focus(m.cq, m.cr); await wait(500);
        const cur = (await page.evaluate(() => window.__turnSlowdownTestDebug.perfUnitsOf(0))).find(u => u.id === m.id);
        await clickHex(cur.q, cur.r); await wait(300);
        const c = await clickHex(m.cq, m.cr);
        for (let k = 0; k < 150; k++) { if (!await page.evaluate(() => window.__turnSlowdownTestDebug.perfAnimating())) break; await wait(100); }
        await wait(300);
        const after = (await page.evaluate(() => window.__turnSlowdownTestDebug.perfUnitsOf(0))).find(u => u.id === m.id);
        res.push({ c, city: [m.cq, m.cr], after: after && [after.q, after.r], panelOpen: await page.evaluate(() => window.__turnSlowdownTestDebug.perfCityPanelOpen()) });
        await page.evaluate(() => window.__turnSlowdownTestDebug.perfCloseCityPanel());
      }
      return res;
    });

    // D. open/close city panel by real click
    await profiled('open-city-panel-click', async () => {
      const out2 = [];
      const pc = await page.evaluate(() => window.__turnSlowdownTestDebug.perfPlayerCityPositions());
      for (let i = 0; i < Math.min(REPEAT, pc.length); i++) {
        const c0 = pc[(i * 5) % pc.length];
        await page.evaluate(() => window.__turnSlowdownTestDebug.perfCloseCityPanel());
        await page.evaluate(id => window.__turnSlowdownTestDebug.perfDeselect?.(), 0);
        await focus(c0.q, c0.r); await wait(500);
        const c = await clickHex(c0.q, c0.r);
        await wait(500);
        out2.push({ c, open: await page.evaluate(() => window.__turnSlowdownTestDebug.perfCityPanelOpen()) });
        await page.evaluate(() => window.__turnSlowdownTestDebug.perfCloseCityPanel());
        await wait(300);
      }
      return out2;
    });

    }

    // 5. end-turn once (heavy); optional
    if (process.env.PERF_EOT === '1') {
      await profiled('end-turn', async () => {
        const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
        await page.evaluate(() => window.__eraTestDebug.endTurn());
        await page.waitForFunction(prev => window.__eraTestDebug.getWorldState().turn > prev && !window.__eraTestDebug.isEndTurnInProgress(), before, { timeout: 300000, polling: 250 });
      });
    }
    result.errors = errors.slice(0, 10);
    fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2));
    console.log('[perf] result written:', OUT_JSON);
  } finally {
    try { await deadline(browser.close(), 10000, 'browser close'); } catch { try { browser.process?.()?.kill('SIGKILL'); } catch {} }
    try { server.close(); } catch {}
    if (!process.env.PERF_BUILD_DIR) fs.rmSync(out, { recursive: true, force: true });
  }
}
main().catch(e => { console.error('[perf] FAIL:', e.stack || e); process.exitCode = 1; });
