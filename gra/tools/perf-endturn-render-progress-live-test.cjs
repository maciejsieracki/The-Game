'use strict';
/**
 * R-WEB-PERF-ENDTURN-RENDER-HUD-Q1: kopia harnessu R-WEB-PERF-ENDTURN-AI-PHASE-Q1 + liczniki syncUnitsRender/currentVisible/ownPlayerVisibleHexes.

 * R-WEB-PERF-ENDTURN-AI-PHASE-Q1: kopia harnessu Q2 (zapis profili CDP PERF_SAVE_PROF, PERF_SECTIONS=eot). Dawniej R-WEB-PERF-LATE-GAME-LAG-HUD-Q2 (R1 obrona): rozszerzona kopia harnessu Q1. Sekcje (PERF_SECTIONS=micro,clicks,scale,eot,equiv):
 * micro = 7 pojedynczych wywołań updateHud/buildHudState/collectTurnEvents/border/refreshFog; clicks = klik po kliku, osobny profil CDP
 * (JS vs native, liczniki wywołań); scale = ten sam pomiar przy zasianej "historii" (explored + dismissed); eot = endTurn;
 * equiv = równoważność memo (tylko kandydat) + świeżość HUD. Poprzednio: R-WEB-PERF-LATE-GAME-LAG-T86-Q1: late-game interaction latency harness (CDP profiler + real canvas clicks).
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
      perfSceneDigest: () => {
        // R-WEB-PERF-ENDTURN-RENDER-HUD-Q1: deterministyczny skrót grafu sceny (widoczność, transformacje, kolor materiału,
        // wymiar tekstury sprite'ów) per dziecko korzenia -- porównanie stanu renderu PRZED i PO wymuszonej pełnej synchronizacji.
        const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
        const fnv = (str: string) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
        const out: Record<string, string> = {}; let total = 0;
        scene.children.forEach((ch: any, i: number) => {
          const parts: string[] = [];
          ch.traverse((o: any) => {
            total++;
            const m = o.material && !Array.isArray(o.material) ? o.material : null;
            const img = m && m.map && m.map.image ? (m.map.image.width + 'x' + m.map.image.height) : '';
            parts.push([o.type, o.name, o.visible ? 1 : 0, r4(o.position.x), r4(o.position.y), r4(o.position.z), r4(o.scale.x), r4(o.scale.y), r4(o.scale.z), r4(o.quaternion.x), r4(o.quaternion.y), r4(o.quaternion.z), r4(o.quaternion.w), m && m.color ? m.color.getHexString() : '', m && m.opacity !== undefined ? r4(m.opacity) : '', img, o.userData && (o.userData.cityId || o.userData.unitId || ''), o.children.length].join('|'));
          });
          out[(ch.name || ch.type) + '#' + i] = parts.length + ':' + fnv(parts.join('\\n'));
        });
        return { total, children: out };
      },
      perfForceFullSync: () => { syncUnitsRender(); cityRenderer.sync(cities, _cityRenderOpts()); },
      perfSceneByClass: () => {
        // R2: agregacja korzeni sceny po nazwie/typie: liczba, obiekty, autoUpdate, czas ch.updateMatrixWorld(true) (ms, suma).
        const agg: Record<string, any> = {};
        for (const ch of scene.children as any[]) {
          const key = (ch.name || ch.type) + (ch.isInstancedMesh ? '/inst' : '') + '|' + Object.keys(ch.userData || {}).sort().join(',') + '|c' + Math.min(ch.children.length, 50);
          const a = (agg[key] ??= { roots: 0, n: 0, auto: 0, ms: 0 });
          let n = 0, au = 0; ch.traverse((o: any) => { n++; if (o.matrixAutoUpdate) au++; });
          const t0 = performance.now(); ch.updateMatrixWorld(true); const t1 = performance.now();
          a.roots++; a.n += n; a.auto += au; a.ms += t1 - t0;
        }
        for (const v of Object.values(agg)) v.ms = +v.ms.toFixed(2);
        return Object.entries(agg).sort((x: any, y: any) => y[1].n - x[1].n).slice(0, 25);
      },
      perfMatrixBench: () => {
        // R2: ile kosztuje scene.updateMatrixWorld (stan domyslny / zamrozone dzieci korzeni / dodatkowo zamrozony korzen sceny). Zamraza NA STALE -- wolac ostatnie.
        const bench = (n: number) => { const t0 = performance.now(); for (let i = 0; i < n; i++) scene.updateMatrixWorld(); return +((performance.now() - t0) / n).toFixed(2); };
        const out: Record<string, number> = {};
        out.default = bench(20);
        for (const ch of scene.children as any[]) ch.traverse((o: any) => { if (o !== ch && o.matrixAutoUpdate) { o.updateMatrix(); o.matrixAutoUpdate = false; } });
        out.descendantsFrozen = bench(20);
        for (const ch of scene.children as any[]) if (ch.matrixAutoUpdate) { ch.updateMatrix(); ch.matrixAutoUpdate = false; }
        out.rootsFrozenToo = bench(20);
        const sa = scene.matrixAutoUpdate; scene.updateMatrix(); scene.matrixAutoUpdate = false; scene.matrixWorldNeedsUpdate = false;
        out.sceneFrozenToo = bench(20); void sa;
        return out;
      },
      perfSceneStats: () => {
        const top: Record<string, any> = {}; let total = 0, visible = 0, autoUpd = 0, meshes = 0, inst = 0;
        scene.children.forEach((ch: any, i: number) => {
          let n = 0, v = 0, a = 0, m = 0;
          ch.traverse((o: any) => { n++; if (o.visible) v++; if (o.matrixAutoUpdate) a++; if (o.isMesh) m++; });
          const key = (ch.name || ch.type) + '#' + i; top[key] = { n, v, a, m };
          total += n; autoUpd += a; meshes += m;
        });
        scene.traverse((o: any) => { if (o.visible) visible++; if (o.isInstancedMesh) inst++; });
        const big = Object.entries(top).sort((x: any, y: any) => y[1].n - x[1].n).slice(0, 12);
        return { total, visible, autoUpd, meshes, inst, topChildren: scene.children.length, big };
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
      perfSelected: () => selectedId,
      perfPlayerCityPositions: () => cities.filter(c => isMe(c.ownerId)).map(c => ({ id: c.id, q: c.q, r: c.r })),
      perfUnitsOf: (owner: number) => units.filter(u => u.ownerId === owner).map(u => ({ id: u.id, q: u.q, r: u.r, ruchLeft: u.ruchLeft, civ: isCivilianUnit(u) })),
      perfCityPanelOpen: () => isCityPanelOpen(),
      perfCloseCityPanel: () => { if (isCityPanelOpen()) hideCityPanelFull(); },
      perfPlanned: (id: string) => plannedMarches.has(id),
      perfAnimating: () => isAnimating,
      perfCounts: () => ({ units: units.length, cities: cities.length, planned: plannedMarches.size }),
      perfHudParts: (reps: number, only?: string) => {
        const one = (fn: () => unknown) => { const o: number[] = []; for (let i = 0; i < reps; i++) { const a = performance.now(); fn(); o.push(+(performance.now() - a).toFixed(2)); } return o; };
        const all: Record<string, () => number[]> = {
          updateHud: () => one(() => refreshD1bHud()),
          buildHudState: () => one(() => buildHudState()),
          collectTurnEvents: () => one(() => collectTurnEvents()),
          territoryBorder: () => one(() => refreshTerritoryBorderOverlay()),
          refreshFog: () => one(() => refreshFog()),
        };
        const out: Record<string, number[]> = {};
        for (const k of Object.keys(all)) if (!only || only === k) out[k] = all[k]!();
        return out;
      },
      perfHudScopeEquiv: () => {
        // R6: buildHudState (z zakresem czystego odczytu) vs buildHudStateRaw (bez zakresu) na zywym stanie - JSON identyczny
        const norm = (v: unknown) => JSON.stringify(v, (_k, x) => (typeof x === 'function' ? '[fn]' : x instanceof Map ? [...x.entries()] : x instanceof Set ? [...x] : x));
        const out: any = { runs: [] as boolean[] };
        for (let i = 0; i < 3; i++) { const a = norm(buildHudState()); const b = norm(buildHudStateRaw()); out.runs.push(a === b); out.len = a.length; }
        out.equal = out.runs.every(Boolean);
        return out;
      },
      perfCountEquiv: () => {
        // R6: nowe countTerritoryHexes/countImprovementsForNodes (unia dyskow) vs DAWNA implementacja (dyski r+1 + isInTerritory), per wlasciciel
        const owners = Array.from(new Set(cities.map(c => c.ownerId)));
        const mism: string[] = []; const rows: any[] = [];
        for (const o of owners) {
          const nodes = statsTerritoryNodesForOwner(o);
          const seenA = new Set<string>(); let nA = 0;
          for (const node of nodes) {
            for (const key of hexKeysWithinRadius(node.q, node.r, cityTerritoryRadius(node) + 1, map)) {
              if (seenA.has(key) || !map.hexes[key]) continue;
              const [qs, rs] = key.split(',');
              if (!isInTerritory(Number(qs), Number(rs), nodes)) continue;
              seenA.add(key); nA += improvementKeysForHex(map.hexes[key]!).length;
            }
          }
          const tB = countTerritoryHexes(nodes); const iB = countImprovementsForNodes(nodes);
          rows.push([o, nodes.length, seenA.size, tB, nA, iB]);
          if (seenA.size !== tB || nA !== iB) mism.push('owner' + o);
        }
        // R6: stawki terytorium/miksu per wlasciciel: z zakresem czystego odczytu (jedno przejscie dla wszystkich miast) vs bez zakresu
        const outScope = owners.map(o => JSON.stringify([empireTerritoryResourceRatesForOwner(o), mergedResourceRatesForOwnerRaw(o)]));
        const inScope = hudPureScope.run(() => owners.map(o => JSON.stringify([empireTerritoryResourceRatesForOwner(o), mergedResourceRatesForOwner(o)])));
        owners.forEach((o, i) => { if (outScope[i] !== inScope[i]) mism.push('rates-owner' + o); });
        return { mismatches: mism, rows, ratesSample: outScope.slice(0, 3) };
      },
      perfCnt: () => ({ ...((window as any).__cnt || {}) }),
      perfCntReset: () => { (window as any).__cnt = {}; },
      perfSeedHistory: (frac: number, dismissedN: number) => {
        const ex = exploredByHuman.get(ME())!;
        const keys = Object.keys(map.hexes);
        const n = Math.floor(keys.length * frac);
        for (let i = 0; i < n; i++) ex.add(keys[i]!);
        for (let i = 0; i < dismissedN; i++) dismissedSidePanelEventIds.add('perfHist-' + i);
        refreshFog();
        return { explored: ex.size, hexes: keys.length, dismissed: dismissedSidePanelEventIds.size };
      },
      perfEquiv: () => {
        const res: any = { mismatches: [] as string[] };
        const owners = Array.from(new Set(cities.map(c => c.ownerId)));
        const ser = (v: any) => JSON.stringify(v instanceof Map ? [...v.entries()].map(e => JSON.stringify(e)).sort() : v instanceof Set ? [...v].sort() : Array.isArray(v) ? [...v].sort() : v);
        const pairs: Array<[string, (o: number) => any, (o: number) => any]> = [
          ['built', empireBuiltIdsForOwner, empireBuiltIdsForOwnerRaw],
          ['labels', empireActiveResourceLabelsForOwner, empireActiveResourceLabelsForOwnerRaw],
        ];
        const check = (tag: string) => {
          withOwnerScopeMemo(() => {
            for (const o of owners) for (const [name, memo, raw] of pairs) {
              const r = ser(raw(o)); const a = memo(o); const sa = ser(a);
              if (a instanceof Map) a.set('__pollute', [] as any); else if (a instanceof Set) a.add('__pollute'); else a.push('__pollute');
              const b = ser(memo(o));
              if (sa !== r || b !== r) res.mismatches.push(tag + ':' + name + ':' + o);
            }
          });
          const u = JSON.stringify(collectTurnEventsUncached()); const m = JSON.stringify(collectTurnEvents());
          if (u !== m) res.mismatches.push(tag + ':events');
          res['events_' + tag] = JSON.parse(u).length;
        };
        res.owners = owners.length;
        check('baseline');
        const pc = cities.find(c => isMe(c.ownerId))!;
        const prevB = cityBuilt.get(pc.id) ? [...cityBuilt.get(pc.id)!] : null;
        cityBuilt.set(pc.id, []);
        check('city-buildings-cleared');
        if (prevB) cityBuilt.set(pc.id, prevB); else cityBuilt.delete(pc.id);
        const hk = Array.from(placedImprovements.keys())[0];
        const prevL = hk ? placedImprovements.get(hk) : undefined;
        if (hk) placedImprovements.delete(hk);
        check('improvement-removed');
        if (hk && prevL) placedImprovements.set(hk, prevL);
        const q = cityProd.get(pc.id); const prevQ = q ? [...q.kolejka] : null;
        if (q) q.kolejka.length = 0;
        check('queue-emptied');
        if (q && prevQ) q.kolejka.push(...prevQ);
        check('restored');
        return res;
      },
      perfHudFresh: () => {
        const out: any = {}; const old = player.skarbiec;
        const txt = () => document.body.innerText;
        player.skarbiec = 111; refreshD1bHud(); out.has111 = txt().includes('111');
        player.skarbiec = 222; refreshD1bHud(); const t2 = txt(); out.has222 = t2.includes('222'); out.stale111 = t2.includes('111');
        player.skarbiec = 333; updateHud(); const t3 = txt(); out.has333viaMainUpdateHud = t3.includes('333');
        player.skarbiec = old; refreshD1bHud();
        return out;
      },
`;
      if (!output.includes(perfMarker)) throw new Error('perf hook anchor missing');
      output = output.replace(perfMarker, perfHooks + perfMarker);


      // Harness-only call counters (product source untouched on disk).
      const bump = (fnHeader, key) => {
        if (!output.includes(fnHeader)) throw new Error('counter anchor missing: ' + fnHeader);
        output = output.replace(fnHeader, fnHeader + ' ((window as any).__cnt ??= {}); (window as any).__cnt.' + key + ' = ((window as any).__cnt.' + key + ' || 0) + 1;');
      };
      bump('function buildHudState(ownerId: number = ME()): HudState {', 'buildHudState');
      bump('function refreshFog(opts?: { skipVeteranEducation?: boolean }): void {', 'refreshFog');
      bump('function refreshTerritoryBorderOverlay(): void {', 'border');
      bump('function collectTurnEvents(): SidePanelEvent[] {', 'collectTurnEvents');
      bump('function syncUnitsRender(list?: RuntimeUnit[]): void {', 'syncUnitsRender');
      bump('function currentVisible(): Set<string> {', 'currentVisible');
      bump('function renderLoop() {', 'renderLoop');
      bump('function ownPlayerVisibleHexes(): Set<string> {', 'ownVisible');
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


// ---------------------------------------------------------------- MAIN (R2 measurement)
const OUT_JSON = process.env.PERF_OUT || path.join(os.tmpdir(), `late-game-interaction-r2-${id}.json`);
const REPEAT = Math.max(7, Number(process.env.PERF_REPEAT) || 7);
const SECTIONS = new Set((process.env.PERF_SECTIONS || 'micro,clicks').split(','));
const EOT_N = Math.max(1, Number(process.env.PERF_EOT_N) || 2);

function classify(profile) {
  const nodes = new Map(profile.nodes.map(n => [n.id, n]));
  const acc = { js: 0, program: 0, gc: 0, idle: 0, gl: 0 };
  const dt = profile.timeDeltas;
  for (let i = 0; i < profile.samples.length; i++) {
    const fn = nodes.get(profile.samples[i]).callFrame.functionName;
    const d = (dt[i] || 0) / 1000;
    const ln = nodes.get(profile.samples[i]).callFrame.lineNumber;
    if (fn === '(idle)') acc.idle += d; else if (fn === '(program)') acc.program += d; else if (fn === '(garbage collector)') acc.gc += d; else if (ln === -1) acc.gl += d; else acc.js += d;
  }
  // inclusive time (once per sample along the stack) of the functions this topic targets
  const parent = new Map();
  for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const WATCH = new Set(['refreshFog', 'updateHud', 'refreshD1bHud', 'refreshD1bHudRaw', 'buildHudState', 'collectTurnEvents', 'collectTurnEventsUncached', 'refreshTerritoryBorderOverlay', 'render', 'animate', 'tick', 'syncUnitsRender', 'refreshMinimap']);
  const incl = {};
  for (let i = 0; i < profile.samples.length; i++) {
    const seen = new Set();
    for (let nid = profile.samples[i]; nid !== undefined; nid = parent.get(nid)) {
      const fn = nodes.get(nid).callFrame.functionName;
      if (WATCH.has(fn) && !seen.has(fn)) { seen.add(fn); incl[fn] = (incl[fn] || 0) + (dt[i] || 0) / 1000; }
    }
  }
  const selfBy = {};
  for (let i = 0; i < profile.samples.length; i++) { const cf = nodes.get(profile.samples[i]).callFrame; const key = (cf.functionName || '(anon)') + ':' + cf.lineNumber; selfBy[key] = (selfBy[key] || 0) + (dt[i] || 0) / 1000; }
  if (process.env.PERF_DEEP === '1') {
    const inclAll = {};
    for (let i = 0; i < profile.samples.length; i++) {
      const seen = new Set();
      for (let nid = profile.samples[i]; nid !== undefined; nid = parent.get(nid)) {
        const cf = nodes.get(nid).callFrame; const k = (cf.functionName || '(anon)') + ':' + cf.lineNumber;
        if (!seen.has(k)) { seen.add(k); inclAll[k] = (inclAll[k] || 0) + (dt[i] || 0) / 1000; }
      }
    }
    const top = (o, n) => Object.entries(o).sort((x, y) => y[1] - x[1]).slice(0, n).map(([k, v]) => k + ' ' + v.toFixed(0));
    incl.__deepIncl = top(inclAll, 60); incl.__deepSelf = top(selfBy, 40);
  }
  incl.__top = Object.entries(selfBy).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => k + '=' + v.toFixed(0));
  for (const k of Object.keys(incl)) if (!k.startsWith('__')) incl[k] = +incl[k].toFixed(1);
  return { jsMs: +acc.js.toFixed(1), nativeMs: +acc.program.toFixed(1), gcMs: +acc.gc.toFixed(1), glNativeMs: +acc.gl.toFixed(1), incl };
}
function stats(a) {
  const s = [...a].sort((x, y) => x - y);
  return { n: s.length, min: s[0], med: s[Math.floor((s.length - 1) / 2)], max: s[s.length - 1] };
}

async function main() {
  await build();
  if (process.env.PERF_BUILD_ONLY === '1') { console.log('[perf] build-only done:', out); process.exit(0); }
  console.log('[perf] build identity:', JSON.stringify(build.identity));
  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const server = http.createServer((req, res) => { res.setHeader('content-type', 'text/html; charset=utf-8'); fs.createReadStream(path.join(out, 'index.html')).pipe(res); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/?playtest=stress`;
  const errors = [];
  const result = { build: build.identity, sections: [...SECTIONS], loadavgStart: os.loadavg().map(x => +x.toFixed(2)) };
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    boundPageEvaluations(page, 120000);
    page.setDefaultTimeout(120000);
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(url, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__aiBuildingsTestDebug && !!window.__turnSlowdownTestDebug, undefined, { timeout: 180000 });
    await page.evaluate(() => window.__aiBuildingsTestDebug.startNewGame({ rivals: '6', cityStates: 0, civTypes: 7, seed: 1412026 }));
    await page.waitForFunction(() => {
      const d = window.__cityStateStartUnitsTestDebug?.dumpState?.();
      return !!d && !document.querySelector('.civ-map-load-overlay') && d.awaitingFirstPlayerCity === true && d.playerStartHex !== null;
    }, undefined, { timeout: 2700000, polling: 1000 });
    if (!await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity())) throw new Error('no start city');
    await page.waitForFunction(() => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen >= 1, undefined, { timeout: 60000 });
    await page.evaluate(() => window.__rebelProtectionTestDebug?.disableVictoryCheckForTest?.());
    result.seeded = await page.evaluate(() => window.__turnSlowdownTestDebug.seedLargeEmpireForStress({ player: 40, rivals: 6, improvements: 180 }));
    await wait(3000);
    const su = await page.evaluate(() => window.__turnSlowdownTestDebug.perfSeedUnits(3, 2));
    result.seededUnits = { seeded: su.seeded, total: su.total };
    await wait(2000);
    result.renderInfo = await page.evaluate(() => window.__turnSlowdownTestDebug.renderInfo());
    await page.evaluate(() => { window.__perfLong = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__perfLong.push(+e.duration.toFixed(1)); }).observe({ entryTypes: ['longtask'] }); } catch {} });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
    async function clickHex(q, r) {
      let p = null;
      for (let a = 0; a < 4; a++) {
        p = await page.evaluate(([q, r]) => window.__turnSlowdownTestDebug.perfHexClient(q, r), [q, r]);
        if (p.ok) break;
        await page.evaluate(([q, r]) => window.__turnSlowdownTestDebug.perfFocus(q, r, 25), [q, r]); await wait(700);
      }
      lastClickOk = !!p.ok;
      if (!p.ok) return { ok: false };
      await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.up();
      return { ok: true };
    }
    let lastClickOk = null;
    // HARNESS FIX (R2): Q1 harness clicked THROUGH a full-screen 'Audiencja dyplomatyczna' modal (div.da-table-area), so no click ever reached the canvas.
    async function dismiss() {
      for (let k = 0; k < 8; k++) {
        const ok = await page.evaluate(() => {
          if (!document.querySelector('.da-table-area')) return false;
          const b = [...document.querySelectorAll('button')].find(x => /^\s*Wróć\s*$/.test(x.textContent || '') && x.offsetParent);
          if (b) { b.click(); return true; }
          return false;
        });
        if (!ok) break;
        await wait(500);
      }
      result.modalLeft = await page.evaluate(() => !!document.querySelector('.da-table-area'));
    }
    const focus = async (q, r, d = 40) => { await dismiss(); await page.keyboard.press('Escape'); await page.evaluate(() => new Promise(r => requestAnimationFrame(r))); await page.evaluate(([q, r, d]) => window.__turnSlowdownTestDebug.perfFocus(q, r, d), [q, r, d]); };

    async function microBlock(tag) {
      const m = await page.evaluate(() => window.__turnSlowdownTestDebug.perfHudParts(7));
      const o = {};
      for (const [k, v] of Object.entries(m)) o[k] = { samples: v, ...stats(v) };
      result['micro_' + tag] = o;
      console.log('[perf] micro', tag, JSON.stringify(Object.fromEntries(Object.entries(o).map(([k, v]) => [k, `${v.min}/${v.med}/${v.max}`]))));
    }

    async function iter(fn) {
      await page.evaluate(() => { window.__perfLong = []; window.__turnSlowdownTestDebug.perfCntReset(); });
      await cdp.send('Profiler.start');
      const t = Date.now();
      await fn();
      // SwiftShader frames take seconds: wait for TWO full rAF cycles so the queued click is processed inside the profile window.
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      const wall = Date.now() - t;
      const prof = (await cdp.send('Profiler.stop')).profile;
      if (process.env.PERF_SAVE_PROF) { iter.n = (iter.n || 0) + 1; fs.writeFileSync(process.env.PERF_SAVE_PROF + '.' + iter.n + '.json', JSON.stringify(prof)); }
      const cls = classify(prof);
      const cnt = await page.evaluate(() => window.__turnSlowdownTestDebug.perfCnt());
      const long = await page.evaluate(() => window.__perfLong.slice());
      const sel = await page.evaluate(() => window.__turnSlowdownTestDebug.perfSelected());
      return { wall, sel, clickOk: lastClickOk, ...cls, cnt, longMax: long.length ? Math.max(...long) : 0 };
    }
    function summarize(label, rows) {
      const o = { rows };
      for (const k of ['jsMs', 'glNativeMs', 'nativeMs', 'gcMs', 'wall', 'longMax']) o[k] = stats(rows.map(r => r[k]));
      const okRows = rows.filter(r => (r.incl.updateHud || 0) > 0 || (r.incl.refreshFog || 0) > 0);
      o.effective = okRows.length;
      if (okRows.length) { o.effJsMs = stats(okRows.map(r => r.jsMs)); o.effUpdateHud = stats(okRows.map(r => r.incl.updateHud || 0)); o.effRefreshFog = stats(okRows.map(r => r.incl.refreshFog || 0)); o.effBuildHudState = stats(okRows.map(r => r.incl.buildHudState || 0)); }
      console.log('[perf] eff', label, o.effective, '/', rows.length, JSON.stringify({ js: o.effJsMs, updateHud: o.effUpdateHud, refreshFog: o.effRefreshFog, bhs: o.effBuildHudState }));
      o.cntLast = rows[rows.length - 1].cnt;
      o.inclLast = rows[rows.length - 1].incl;
      console.log('[perf] incl', label, JSON.stringify(rows.map(r => { const { __top, ...rest } = r.incl; return rest; })));
      result.clicks = result.clicks || {};
      result.clicks[label] = o;
      console.log('[perf] click', label, 'pureJS min/med/max', JSON.stringify(o.jsMs), 'glNative', JSON.stringify(o.glNativeMs), 'cnt', JSON.stringify(o.cntLast), 'sel', JSON.stringify(rows.map(r => r.sel + (r.clickOk ? '' : '!noclick'))));
    }
    const ONLY = new Set((process.env.PERF_ONLY || 'select,move,enter,panel').split(','));
    async function clickBlock() {
      const mine = su.mine;
      let rows = [];
      if (ONLY.has('select')) {
      for (let i = 0; i < REPEAT; i++) {
        const m = mine[i % mine.length];
        await focus(m.q, m.r); await wait(500);
        rows.push(await iter(async () => { await clickHex(m.q, m.r); }));
      }
      summarize('select-unit', rows);
      }
      rows = [];
      if (ONLY.has('move')) {
      for (let i = 0; i < REPEAT; i++) {
        const m = mine[(i + 10) % mine.length];
        await page.evaluate(id => window.__turnSlowdownTestDebug.perfRefill(id), m.id);
        await focus(m.q, m.r); await wait(500); await clickHex(m.q, m.r); await wait(300);
        const d = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]][i % 6];
        rows.push(await iter(async () => {
          await clickHex(m.q + d[0], m.r + d[1]);
          for (let k = 0; k < 150; k++) { if (!await page.evaluate(() => window.__turnSlowdownTestDebug.perfAnimating())) break; await wait(100); }
        }));
      }
      summarize('unit-move', rows);
      }
      rows = [];
      if (ONLY.has('enter')) {
      for (let i = 0; i < REPEAT; i++) {
        const m = mine[(i + 20) % mine.length];
        await page.evaluate(id => window.__turnSlowdownTestDebug.perfRefill(id), m.id);
        await focus(m.cq, m.cr); await wait(500);
        const cur = (await page.evaluate(() => window.__turnSlowdownTestDebug.perfUnitsOf(0))).find(u => u.id === m.id);
        await clickHex(cur.q, cur.r); await wait(300);
        rows.push(await iter(async () => {
          await clickHex(m.cq, m.cr);
          for (let k = 0; k < 150; k++) { if (!await page.evaluate(() => window.__turnSlowdownTestDebug.perfAnimating())) break; await wait(100); }
        }));
        await page.evaluate(() => window.__turnSlowdownTestDebug.perfCloseCityPanel());
      }
      summarize('unit-enter-city', rows);
      }
      rows = [];
      if (ONLY.has('panel')) {
      const pc = await page.evaluate(() => window.__turnSlowdownTestDebug.perfPlayerCityPositions());
      for (let i = 0; i < REPEAT; i++) {
        const c0 = pc[(i * 5) % pc.length];
        await page.evaluate(() => window.__turnSlowdownTestDebug.perfCloseCityPanel());
        await focus(c0.q, c0.r); await wait(500);
        rows.push(await iter(async () => { await clickHex(c0.q, c0.r); await wait(300); }));
        await page.evaluate(() => window.__turnSlowdownTestDebug.perfCloseCityPanel());
      }
      summarize('open-city-panel', rows);
      }
    }

    if (SECTIONS.has('diag')) {
      const m = su.mine[0];
      await focus(m.q, m.r); await wait(1500);
      const p = await page.evaluate(([q, r]) => window.__turnSlowdownTestDebug.perfHexClient(q, r), [m.q, m.r]);
      const el = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? (e.tagName + '#' + e.id + '.' + e.className) : null; }, [p.x, p.y]);
      await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.up(); await wait(800);
      const selAfter = await page.evaluate(() => window.__turnSlowdownTestDebug.perfSelected());
      await page.screenshot({ path: process.env.PERF_SHOT || path.join(os.tmpdir(), 'diag.png') });
      result.diag = { m, p, el, selAfter, units: await page.evaluate(() => window.__turnSlowdownTestDebug.perfUnitsOf(0).slice(0, 2)) };
      console.log('[perf] diag', JSON.stringify(result.diag));
    }
    if (SECTIONS.has('countequiv')) {
      result.countEquiv = await page.evaluate(() => window.__turnSlowdownTestDebug.perfCountEquiv());
      console.log('[perf] countEquiv', JSON.stringify(result.countEquiv));
    }
    if (SECTIONS.has('scopeequiv')) {
      result.scopeEquiv = await page.evaluate(() => window.__turnSlowdownTestDebug.perfHudScopeEquiv());
      console.log('[perf] scopeEquiv', JSON.stringify(result.scopeEquiv));
    }
    if (SECTIONS.has('equiv')) {
      try { result.equiv = await page.evaluate(() => window.__turnSlowdownTestDebug.perfEquiv()); } catch (e) { result.equiv = { error: String(e).slice(0, 200) }; }
      result.hudFresh = await page.evaluate(() => window.__turnSlowdownTestDebug.perfHudFresh());
      console.log('[perf] equiv', JSON.stringify(result.equiv), 'hudFresh', JSON.stringify(result.hudFresh));
    }
    if (SECTIONS.has('micro')) await microBlock('t1');
    if (SECTIONS.has('prof')) {
      const part = process.env.PERF_PROF || 'buildHudState';
      await cdp.send('Profiler.start');
      await page.evaluate(([p, n]) => window.__turnSlowdownTestDebug.perfHudParts(n, p), [part, Number(process.env.PERF_PROF_N) || 15]);
      const prof = (await cdp.send('Profiler.stop')).profile;
      const nodes = new Map(prof.nodes.map(n => [n.id, n])); const parent = new Map();
      for (const n of prof.nodes) for (const c of n.children || []) parent.set(c, n.id);
      const incl = {}; const self = {};
      for (let i = 0; i < prof.samples.length; i++) {
        const d = (prof.timeDeltas[i] || 0) / 1000; const seen = new Set();
        const cf0 = nodes.get(prof.samples[i]).callFrame; const k0 = cf0.functionName + ':' + cf0.lineNumber; self[k0] = (self[k0] || 0) + d;
        for (let nid = prof.samples[i]; nid !== undefined; nid = parent.get(nid)) {
          const cf = nodes.get(nid).callFrame; const k = cf.functionName + ':' + cf.lineNumber;
          if (!seen.has(k)) { seen.add(k); incl[k] = (incl[k] || 0) + d; }
        }
      }
      const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, v]) => k + ' ' + v.toFixed(0));
      result.prof = { part, incl: top(incl), self: top(self) };
      console.log('[perf] PROF', part, 'INCL', JSON.stringify(result.prof.incl)); console.log('[perf] PROF', part, 'SELF', JSON.stringify(result.prof.self));
    }
    if (SECTIONS.has('clicks')) await clickBlock();
    if (SECTIONS.has('scale')) {
      const levels = [[0, 0], [0.5, 5000], [1.0, 20000]];
      result.scale = [];
      for (const [frac, dis] of levels) {
        const info = await page.evaluate(([f, d]) => window.__turnSlowdownTestDebug.perfSeedHistory(f, d), [frac, dis]);
        await wait(1500);
        await microBlock(`hist${frac}`);
        if (process.env.PERF_SCALE_CLICKS !== '0') {
        const mine = su.mine; const rows = [];
        for (let i = 0; i < REPEAT; i++) { const m = mine[i % mine.length]; await focus(m.q, m.r); await wait(400); rows.push(await iter(async () => { await clickHex(m.q, m.r); })); }
        summarize(`hist${frac}:select-unit`, rows);
        }
        result.scale.push({ frac, dis, info });
      }
    }
    if (SECTIONS.has('eot')) {
      result.scene = await page.evaluate(() => window.__turnSlowdownTestDebug.perfSceneStats()); console.log('[perf] scene', JSON.stringify(result.scene));
      if (process.env.PERF_MATRIX_BENCH === '1') { result.matrixBench = await page.evaluate(() => window.__turnSlowdownTestDebug.perfMatrixBench()); console.log('[perf] MATRIXBENCH', JSON.stringify(result.matrixBench)); }
      if (process.env.PERF_SCENE_CLASS === '1') { result.sceneClass = await page.evaluate(() => window.__turnSlowdownTestDebug.perfSceneByClass()); console.log('[perf] SCENECLASS', JSON.stringify(result.sceneClass)); }
      result.eot = [];
      for (let k = 0; k < EOT_N; k++) {
        const r = await iter(async () => {
          const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
          await page.evaluate(() => window.__eraTestDebug.endTurn());
          await page.waitForFunction(prev => window.__eraTestDebug.getWorldState().turn > prev && !window.__eraTestDebug.isEndTurnInProgress(), before, { timeout: 400000, polling: 250 });
        });
        result.eot.push(r); console.log('[perf] eot', JSON.stringify({ wall: r.wall, jsMs: r.jsMs, nativeMs: r.nativeMs, gcMs: r.gcMs, glNativeMs: r.glNativeMs, cnt: r.cnt })); if (r.incl.__deepIncl) { console.log('[perf] EOTINCL', JSON.stringify(r.incl.__deepIncl)); console.log('[perf] EOTSELF', JSON.stringify(r.incl.__deepSelf)); }
      }
    }
    if (SECTIONS.has('progress')) {
      // R4: stan WIDOCZNY w trakcie fazy AI. Podczas końca tury (isEndTurnInProgress) co ~chwilę (między yieldami
      // przeglądarki) mierzymy digest sceny PRZED i PO wymuszonej pełnej synchronizacji. Różnica = żetony/miasta,
      // które w tym momencie na ekranie były nieaktualne względem stanu logicznego (np. odroczone flushe).
      result.progress = [];
      let sampleCount = 0;
      for (let k = 0; k < EOT_N; k++) {
        const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
        await page.evaluate(() => window.__eraTestDebug.endTurn());
        const samples = [];
        const t0 = Date.now();
        for (;;) {
          const st = await page.evaluate(() => {
            const inProg = !!window.__eraTestDebug.isEndTurnInProgress();
            const turnNow = window.__eraTestDebug.getWorldState().turn;
            const phaseEl = document.getElementById('civ-turn-trans-phase');
            const phase = phaseEl ? phaseEl.textContent : null;
            const overlayOn = !!document.querySelector('.civ-turn-transition');
            let mismatched = null;
            if (inProg && overlayOn) {
              const d1 = window.__turnSlowdownTestDebug.perfSceneDigest();
              window.__turnSlowdownTestDebug.perfForceFullSync();
              const d2 = window.__turnSlowdownTestDebug.perfSceneDigest();
              mismatched = Object.keys(d1.children).filter(key => d1.children[key] !== d2.children[key]);
            }
            return { inProg, turnNow, phase, overlayOn, mismatched };
          });
          if (st.inProg && st.overlayOn) {
            sampleCount++;
            samples.push({ t: Date.now() - t0, phase: st.phase, nMismatch: st.mismatched.length, mismatched: st.mismatched.slice(0, 6) });
          }
          if (!st.inProg && st.turnNow > before) break;
          if (Date.now() - t0 > 400000) throw new Error('progress section: end turn timeout');
          await wait(30);
        }
        const withMismatch = samples.filter(s => s.nMismatch > 0);
        result.progress.push({ eot: k + 1, samples: samples.length, samplesWithStaleScene: withMismatch.length, staleSamples: withMismatch.slice(0, 20) });
        console.log('[perf] progress', JSON.stringify({ eot: k + 1, samples: samples.length, stale: withMismatch.length, phases: [...new Set(samples.map(s => s.phase))].slice(0, 12) }));
      }
      result.progressSampleCount = sampleCount;
    }
    if (SECTIONS.has('pixel')) {
      // R-WEB-PERF-ENDTURN-RENDER-HUD-Q1: parytet po koncu tury -- stan sceny i pelna klatka PRZED vs PO wymuszonej pelnej synchronizacji
      // (gdyby odroczenie zostawilo nieaktualne zetony/plakietki, wymuszona synchronizacja zmieni digest/piksele).
      const rafs = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      for (let k = 0; k < EOT_N; k++) {
        const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
        await page.evaluate(() => window.__eraTestDebug.endTurn());
        await page.waitForFunction(prev => window.__eraTestDebug.getWorldState().turn > prev && !window.__eraTestDebug.isEndTurnInProgress(), before, { timeout: 400000, polling: 250 });
      }
      await dismiss(); await rafs();
      const d1 = await page.evaluate(() => window.__turnSlowdownTestDebug.perfSceneDigest());
      const shotA = await page.screenshot({ clip: { x: 0, y: 0, width: 1600, height: 1000 } });
      await page.evaluate(() => window.__turnSlowdownTestDebug.perfForceFullSync()); await rafs(); await rafs();
      const d2 = await page.evaluate(() => window.__turnSlowdownTestDebug.perfSceneDigest());
      const shotB = await page.screenshot({ clip: { x: 0, y: 0, width: 1600, height: 1000 } });
      const mismatched = Object.keys(d1.children).filter(k => d1.children[k] !== d2.children[k]);
      await page.evaluate(() => window.__turnSlowdownTestDebug.perfForceFullSync()); await rafs(); await rafs();
      const shotC = await page.screenshot({ clip: { x: 0, y: 0, width: 1600, height: 1000 } });
      const cmp = (x, y) => page.evaluate(async ([a64, b64]) => {
        const load = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = src; });
        const [ia, ib] = await Promise.all([load('data:image/png;base64,' + a64), load('data:image/png;base64,' + b64)]);
        const cv = document.createElement('canvas'); cv.width = ia.width; cv.height = ia.height; const cx = cv.getContext('2d');
        cx.drawImage(ia, 0, 0); const da = cx.getImageData(0, 0, cv.width, cv.height).data;
        cx.clearRect(0, 0, cv.width, cv.height); cx.drawImage(ib, 0, 0); const db = cx.getImageData(0, 0, cv.width, cv.height).data;
        let diff = 0, maxd = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
        for (let i = 0; i < da.length; i += 4) {
          const m = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
          if (m > 0) { diff++; if (m > maxd) maxd = m; const p = i / 4, X = p % cv.width, Y = (p / cv.width) | 0; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; }
        }
        return { pixels: da.length / 4, diff, maxChannelDelta: maxd, bbox: diff ? [x0, y0, x1, y1] : null };
      }, [x.toString('base64'), y.toString('base64')]);
      const px = await cmp(shotA, shotB);
      const pxNoise = await cmp(shotB, shotC);
      result.pixel = { digestObjects: d1.total, mismatchedChildren: mismatched, afterEotVsForcedSync: px, forcedSyncVsForcedSyncAgain: pxNoise };
      if (process.env.PERF_SHOT_PREFIX) { fs.writeFileSync(process.env.PERF_SHOT_PREFIX + '-A.png', shotA); fs.writeFileSync(process.env.PERF_SHOT_PREFIX + '-B.png', shotB); }
      console.log('[perf] PIXEL', JSON.stringify(result.pixel));
    }
    result.loadavgEnd = os.loadavg().map(x => +x.toFixed(2));
    result.errors = errors.slice(0, 10);
    fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2));
    console.log('[perf] result written:', OUT_JSON);
  } finally {
    try { await deadline(browser.close(), 10000, 'browser close'); } catch { browser.process()?.kill('SIGKILL'); }
    try { server.close(); } catch {}
    if (!process.env.PERF_BUILD_DIR) fs.rmSync(out, { recursive: true, force: true });
  }
}
main().catch(e => { console.error('[perf] FAIL:', e.stack || e); process.exitCode = 1; });
