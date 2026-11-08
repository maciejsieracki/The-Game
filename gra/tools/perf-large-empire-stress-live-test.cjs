'use strict';
/**
 * Browser stress harness for the requested 6–7-civilization / 40-city workload.
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
const out = path.join(os.tmpdir(), `large-empire-stress-${id}`);
const abSequence = ['all', 'coalesced', 'coalesced', 'all', 'all', 'coalesced', 'coalesced', 'all'];
const abMode = process.env.STRESS_AB === '1';
const compactMode = process.env.STRESS_COMPACT === '1';
const turns = abMode ? abSequence.length : Math.max(1, Number(process.argv[2]) || 100);
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

/** Resolve each real AI offer through the game's Diplomacy Audience and its Reject button. */
async function rejectPendingAiOffers(page, turn) {
  const decisions = [];
  for (let n = 0; n < 16; n++) {
    progress(page, 'offer-read-pending', { attempt: n + 1, turn });
    const state = await page.evaluate(() => window.__dealsLiveDebug?.snapshot?.() ?? null);
    if (!state) throw new Error('missing __dealsLiveDebug.snapshot; cannot safely handle AI offers');
    if (!state.pending.length) break;
    const offer = state.pending[0];
    progress(page, 'offer-read-contacts', { attempt: n + 1, turn, pending: state.pending.length, offerId: offer.id });
    const contacts = await page.evaluate(() => window.__audienceRelTestDebug?.getContacts?.() ?? null);
    if (!contacts) throw new Error('missing public Diplomacy Audience opener/contact list');
    let decision = null;
    for (const ownerId of contacts.filter(id => id > 0)) {
      progress(page, 'offer-open-and-click', { turn, ownerId, offerId: offer.id });
      decision = await page.evaluate(({ ownerId, offerId }) => {
        // This test-only callback enters the same real audience UI opened from diplomacy cards.
        window.__audienceRelTestDebug.openAudience(ownerId);
        const root = document.querySelector('.civ-diplo-aud');
        if (!root) return null;
        const card = Array.from(root.querySelectorAll('.da-negot[data-negot-id]'))
          .find(el => el.getAttribute('data-negot-id') === offerId);
        if (!card) return null;
        // Click the actual UI action. Package rejection follows the same event handler as a
        // player click; use the card-level reject only if no package action is rendered.
        const button = root.querySelector('button[data-negot-act="reject-package"]')
          || card.querySelector('button[data-negot-act="reject"]');
        if (!button) return { found: true, ok: false, ownerId, offerId, reason: 'no reject action in rendered offer card' };
        if (button.disabled) return { found: true, ok: false, ownerId, offerId, reason: 'reject action disabled' };
        const action = button.getAttribute('data-negot-act');
        const offerText = (card.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300);
        button.click();
        return { found: true, ok: true, ownerId, offerId, action, offerText };
      }, { ownerId, offerId: offer.id });
      if (decision) break;
    }
    if (!decision?.ok) {
      await page.evaluate(() => window.__audienceRelTestDebug?.closeAudience?.());
      throw new Error('Could not reject AI offer through the UI: ' + JSON.stringify(decision ?? { offerId: offer.id, ownerSearch: contacts }));
    }
    const pendingBefore = state.pending.map(item => item.id);
    progress(page, 'offer-wait-removal', { turn, offerId: offer.id });
    await page.waitForFunction(id => !window.__dealsLiveDebug.snapshot().pending.some(item => item.id === id), offer.id,
      { timeout: 10000, polling: 100 });
    progress(page, 'offer-read-after-removal', { turn, offerId: offer.id });
    const pendingAfter = await page.evaluate(() => window.__dealsLiveDebug.snapshot().pending.map(item => item.id));
    progress(page, 'offer-close-audience', { turn, offerId: offer.id });
    await page.evaluate(() => window.__audienceRelTestDebug.closeAudience());
    const record = { turn, decision: 'reject', source: 'Diplomacy Audience button', ...decision,
      actionId: offer.actionId, balancePn: offer.balancePn, reason: offer.reason,
      removedOfferIds: pendingBefore.filter(id => !pendingAfter.includes(id)) };
    decisions.push(record);
    console.log('[large-empire] AI trade offer decision:', JSON.stringify(record));
  }
  progress(page, 'offer-final-pending-check', { turn });
  const remaining = await page.evaluate(() => window.__dealsLiveDebug.snapshot().pending);
  if (remaining.length) throw new Error('AI offer decision cap reached; still pending: ' + JSON.stringify(remaining));
  return decisions;
}

async function runHarnessSelfTest() {
  let calls = 0;
  const page = {
    evaluate: () => ++calls === 1 ? new Promise(() => {}) : Promise.resolve({ world: { turn: 2 }, busy: true }),
    screenshot: async ({ path: filePath }) => fs.writeFileSync(filePath, 'mock screenshot'),
  };
  boundPageEvaluations(page, 25, 100);
  progress(page, 'self-test-stalled-page-evaluation');
  await assert.rejects(page.evaluate(() => null), /page\.evaluate #1 \(self-test-stalled-page-evaluation\) timed out after 25ms/);
  const evidenceFile = page.__largeEmpireLatestEvidencePath;
  assert.ok(evidenceFile, 'timeout evidence JSON is written');
  const evidence = JSON.parse(fs.readFileSync(evidenceFile, 'utf8'));
  assert.equal(evidence.evaluateFailure.phase, 'self-test-stalled-page-evaluation');
  assert.deepEqual(evidence.state, { world: { turn: 2 }, busy: true });
  assert.ok(evidence.screenshot && fs.existsSync(evidence.screenshot), 'screenshot is attempted before the state read');
  fs.rmSync(evidenceFile, { force: true });
  fs.rmSync(evidence.screenshot, { force: true });
  const captureRefreshAnchor = (source) => {
    const oldAnchor = '      syncUnitsRender();\n      cityRenderer.sync(cities, _cityRenderOpts());\n      refreshFog();\n      updateHud();\n      refreshD1bHud();\n      refreshSiegeMarkers();';
    const newAnchor = '      if (galleryOn) syncUnitsRender();\n      cityRenderer.sync(cities, _cityRenderOpts());\n      refreshFog();\n      updateHud();\n      refreshD1bHud();\n      refreshSiegeMarkers();';
    const matches = [oldAnchor, newAnchor].filter(anchor => source.split(anchor).length === 2);
    assert.equal(matches.length, 1, 'exactly one supported capture-refresh anchor');
    return matches[0];
  };
  const oldCaptureRefresh = '      syncUnitsRender();\n      cityRenderer.sync(cities, _cityRenderOpts());\n      refreshFog();\n      updateHud();\n      refreshD1bHud();\n      refreshSiegeMarkers();';
  const guardedCaptureRefresh = oldCaptureRefresh.replace('      syncUnitsRender();', '      if (galleryOn) syncUnitsRender();');
  assert.equal(captureRefreshAnchor(oldCaptureRefresh), oldCaptureRefresh, 'legacy capture-refresh source remains supported');
  assert.equal(captureRefreshAnchor(guardedCaptureRefresh), guardedCaptureRefresh, 'gallery-guarded capture-refresh source is supported');
  console.log('[large-empire] bounded-evaluate self-test PASS');
}

async function runStartupOnlyProbe(page, capMs = 180000) {
  const started = Date.now();
  const rows = [];
  const evidencePath = path.join(os.tmpdir(), `large-empire-startup-probe-${id}.json`);
  const screenshot = async label => {
    const file = path.join(os.tmpdir(), `large-empire-startup-${id}-${label}-${Date.now()}.png`);
    try {
      await deadline(page.screenshot({ path: file, timeout: PAGE_SCREENSHOT_TIMEOUT_MS }), PAGE_SCREENSHOT_TIMEOUT_MS + 500, `startup screenshot ${label}`);
      return file;
    } catch (e) { return { error: String(e) }; }
  };
  let ready = false;
  while (Date.now() - started < capMs && !ready) {
    const elapsedMs = Date.now() - started;
    progress(page, 'startup-probe-poll', { elapsedMs });
    const row = { at: new Date().toISOString(), elapsedMs };
    try {
      row.snapshot = await deadline(page.evaluate(() => {
        const overlay = document.querySelector('.civ-map-load-overlay');
        const progressNodes = Array.from(document.querySelectorAll('progress,[role="progressbar"],.progress,.loading-progress'));
        const debug = window.__cityStateStartUnitsTestDebug?.dumpState?.() ?? null;
        return {
          pageResponsive: true,
          readyState: document.readyState,
          overlayPresent: !!overlay,
          overlayText: overlay?.innerText?.slice(0, 1000) ?? null,
          overlayHtml: overlay?.innerHTML?.slice(0, 2000) ?? null,
          progress: progressNodes.slice(0, 12).map(node => ({ tag: node.tagName, text: node.textContent?.trim().slice(0, 300) ?? '', value: node.value ?? null, max: node.max ?? null, ariaValue: node.getAttribute('aria-valuenow'), ariaText: node.getAttribute('aria-valuetext'), className: typeof node.className === 'string' ? node.className : '' })),
          startState: debug,
          gameHooksReady: !!window.__aiBuildingsTestDebug && !!window.__turnSlowdownTestDebug,
        };
      }), 7000, 'startup responsiveness/state probe');
      ready = !!row.snapshot.startState && !row.snapshot.overlayPresent && row.snapshot.startState.awaitingFirstPlayerCity === true && row.snapshot.startState.playerStartHex !== null;
    } catch (e) {
      row.probeError = String(e);
    }
    if (elapsedMs === 0 || elapsedMs >= 30000 && Math.floor(elapsedMs / 30000) > Math.floor((elapsedMs - 5000) / 30000)) row.screenshot = await screenshot(`t${elapsedMs}`);
    rows.push(row);
    fs.writeFileSync(evidencePath, JSON.stringify({ startedAt: new Date(started - elapsedMs).toISOString(), capMs, ready, elapsedMs: Date.now() - started, rows }, null, 2));
    console.log('[large-empire] startup probe:', JSON.stringify(row));
    if (!ready) await wait(Math.min(5000, Math.max(0, capMs - (Date.now() - started))));
  }
  const result = { ready, elapsedMs: Date.now() - started, capMs, rows, evidencePath };
  fs.writeFileSync(evidencePath, JSON.stringify(result, null, 2));
  console.log('[large-empire] startup probe result:', JSON.stringify(result));
  return result;
}

async function build() {
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
      if (id.endsWith('/src/game/ai.ts')) {
        let ai = code;
        const importPath = "import { hexDistance, computePath, computeReachable, keyOf, isCivilianUnit } from '../units/setup';";
        if (!ai.includes(importPath)) throw new Error('AI path instrumentation import anchor missing');
        ai = ai.replace(importPath, "import { hexDistance, computePath as __profiledComputePath, computeReachable, keyOf, isCivilianUnit } from '../units/setup';\nconst __aiPerfGlobal = globalThis as any;\nconst __aiPerfState = __aiPerfGlobal.__aiPlannerPerfTestState ??= { ownerId: null as number | null, counts: {} as Record<string, { computePath: number; firstStep: number }> };\nconst computePath: typeof __profiledComputePath = (...args: Parameters<typeof __profiledComputePath>) => {\n  const ownerId = __aiPerfState.ownerId;\n  if (ownerId !== null) (__aiPerfState.counts[String(ownerId)] ??= { computePath: 0, firstStep: 0 }).computePath++;\n  return __profiledComputePath(...args);\n};\nconst __recordAiFirstStep = (): void => {\n  const ownerId = __aiPerfState.ownerId;\n  if (ownerId !== null) (__aiPerfState.counts[String(ownerId)] ??= { computePath: 0, firstStep: 0 }).firstStep++;\n};");
        const firstStepBody = "): { q: number; r: number } | null {\n  const occ = occupiedExcluding(units, unit.id);";
        if (!ai.includes(firstStepBody)) throw new Error('AI firstStep body instrumentation anchor missing');
        ai = ai.replace(firstStepBody, "): { q: number; r: number } | null {\n  __recordAiFirstStep();\n  const occ = occupiedExcluding(units, unit.id);");
        return { code: ai, map: null };
      }
      if (id.endsWith('/src/game/save.ts')) {
        let save = code;
        const serializeDecl = 'export function serializeGame(s: SaveGame): string {\n  const stamped: SaveGame = { ...s, wersja: SAVE_VERSION };\n  return JSON.stringify(stamped, setAwareReplacer);\n}';
        if (!save.includes(serializeDecl)) throw new Error('serializeGame timing anchor missing');
        save = save.replace(serializeDecl, `export function serializeGame(s: SaveGame): string {
  const __serializeStarted = performance.now();
  const stamped: SaveGame = { ...s, wersja: SAVE_VERSION };
  const json = JSON.stringify(stamped, setAwareReplacer);
  const __serializeMs = performance.now() - __serializeStarted;
  (globalThis as any).__largeEmpireAutosavePerfTestDebug?.recordSerialize(__serializeMs);
  return json;
}`);
        return { code: save, map: null };
      }
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

      const replaceOnce = (needle, replacement, label) => {
        const first = output.indexOf(needle);
        if (first < 0 || output.indexOf(needle, first + needle.length) >= 0) {
          throw new Error(`expected exactly one ${label} transform anchor`);
        }
        output = output.slice(0, first) + replacement + output.slice(first + needle.length);
      };
      const replaceOneOf = (needles, replacements, label) => {
        const found = needles.map((needle, i) => ({needle, replacement: replacements[i]}))
          .filter(({needle}) => output.indexOf(needle) >= 0);
        if (found.length !== 1 || output.indexOf(found[0].needle, output.indexOf(found[0].needle) + found[0].needle.length) >= 0) {
          throw new Error(`expected exactly one supported ${label} transform anchor`);
        }
        output = output.replace(found[0].needle, found[0].replacement);
      };

      const eotDecl = '    async function runWorldEndTurn(humanOwnerId: number): Promise<void> {';
      const profileDecl = `    const __largeEmpireEotProfileRows: Array<{turn:number;phase:string;ms:number;ownerId?:number;units?:number;commands?:number;computePath?:number;firstStep?:number}> = [];
    let __largeEmpireEotStarted = 0;
    let __largeEmpireEotCompleted = 0;
    let __largeEmpireOwnerPaintMode: 'all' | 'coalesced' = 'coalesced';
    (window as any).__endTurnPhaseProfileTestDebug = {
      drain: () => __largeEmpireEotProfileRows.splice(0),
      lifecycle: () => ({ started: __largeEmpireEotStarted, completed: __largeEmpireEotCompleted }),
      setOwnerPaintMode: (mode: 'all' | 'coalesced') => { __largeEmpireOwnerPaintMode = mode; },
    };
    (window as any).__largeEmpireAutosavePerfTestDebug = {
      recordSerialize: (ms: number) => __largeEmpireEotProfileRows.push({
        turn: Number((window as any).__largeEmpireAutosaveTurn ?? turn),
        phase: 'autosave_serializeGame_sync', ms: +ms.toFixed(2),
      }),
    };
    const __recordLargeEmpireEotPhase = (turnId: number, phase: string, startedAt: number, details: Record<string,number> = {}): void => {
      __largeEmpireEotProfileRows.push({ turn: turnId, phase, ms: +(performance.now() - startedAt).toFixed(2), ...details });
    };
    const __measureLargeEmpireAi = <T>(turnId: number, ownerId: number, phase: string, fn: () => T): T => {
      const startedAt = performance.now();
      try { return fn(); } finally { __recordLargeEmpireEotPhase(turnId, phase, startedAt, { ownerId }); }
    };
    (window as any).__aiPlannerPerfTestDebug = {
      setOwner: (ownerId: number | null) => { (globalThis as any).__aiPlannerPerfTestState.ownerId = ownerId; },
      counts: (ownerId: number) => (globalThis as any).__aiPlannerPerfTestState.counts[String(ownerId)] ?? { computePath: 0, firstStep: 0 },
      reset: (ownerId: number) => { (globalThis as any).__aiPlannerPerfTestState.counts[String(ownerId)] = { computePath: 0, firstStep: 0 }; },
    };
    async function runWorldEndTurn(humanOwnerId: number): Promise<void> {
      const __profileTurnId = turn + 1;
      const __profileTotalStart = performance.now();
      __largeEmpireEotStarted++;`;
      replaceOnce(eotDecl, profileDecl, 'runWorldEndTurn entry');

      const econTry = '        // Advance every city\'s economy: terrain yields -> net food ->\n        // population growth/starvation, persisting the food store on the city.\n        // Wrapped defensively so a data anomaly can never break the turn loop.\n        try {';
      replaceOnce(econTry, econTry.replace(
        '        try {',
        '        let __profilePostFoodStart = 0;\n        const __profileEconomyStart = performance.now();\n        try {',
      ), 'economy phase entry');
      const econEnd = "        } catch (err) {\n          console.error('[Ekonomia] Błąd w turze ekonomii:', err);\n        }\n\n        // ===================================================================\n        // AI TURN LOOP";
      replaceOnce(econEnd, econEnd.replace('        // ===================================================================\n        // AI TURN LOOP', "        __recordLargeEmpireEotPhase(__profileTurnId, 'city_economy_phase', __profileEconomyStart);\n\n        // ===================================================================\n        // AI TURN LOOP"), 'economy phase exit');

      const econCallStart = '          const econ = advanceCityEconomy(';
      replaceOnce(econCallStart, '          const __profileAdvanceCityEconomyStart = performance.now();\n' + econCallStart, 'advanceCityEconomy entry');
      const econCallEnd = '            manualWorkTaxByCity,\n          );\n          pendingManualWorkTaxByOwner.clear();';
      replaceOnce(econCallEnd, '            manualWorkTaxByCity,\n          );\n          __recordLargeEmpireEotPhase(__profileTurnId, \'advanceCityEconomy\', __profileAdvanceCityEconomyStart);\n          pendingManualWorkTaxByOwner.clear();', 'advanceCityEconomy exit');

      replaceOnce('          recomputeTradeRoutesNow(true);',
        "          const __profileTradeRoutesStart = performance.now();\n          recomputeTradeRoutesNow(true);\n          __recordLargeEmpireEotPhase(__profileTurnId, 'recomputeTradeRoutesNow', __profileTradeRoutesStart);",
        'trade route recomputation timing');
      replaceOnce('          try {\n            const tradeFlowParams = loadTradeRouteResourceFlowParams(',
        '          const __profileTradeStockFlowStart = performance.now();\n          try {\n            const tradeFlowParams = loadTradeRouteResourceFlowParams(',
        'trade route stock flow timing entry');
      replaceOnce("          } catch (eTradeFlow) {\n            console.error('[Handel] Blad przeplywu ilosciowego surowca przez trase:', eTradeFlow);\n          }\n          const tradeIncomeParams",
        "          } catch (eTradeFlow) {\n            console.error('[Handel] Blad przeplywu ilosciowego surowca przez trase:', eTradeFlow);\n          }\n          __recordLargeEmpireEotPhase(__profileTurnId, 'trade_route_stock_flow', __profileTradeStockFlowStart);\n          const __profileTradeIncomeStart = performance.now();\n          const tradeIncomeParams",
        'trade route stock flow timing exit');
      replaceOnce('          const manualWorkTaxByCity = new Map<string, number>();',
        "          __recordLargeEmpireEotPhase(__profileTurnId, 'trade_route_income_aggregation', __profileTradeIncomeStart);\n          const manualWorkTaxByCity = new Map<string, number>();",
        'trade route income aggregation timing exit');
      replaceOnce('            const upkeepParams = loadUpkeepParams(data.econParams, _menuDifficulty);',
        '            const __profileAutoRationStart = performance.now();\n            const upkeepParams = loadUpkeepParams(data.econParams, _menuDifficulty);',
        'auto ration phase entry');
      replaceOnce('              empireEpochForOwner,\n            );\n            // P-WZROSTPROCENT-PLAKIETKA-ROZJAZD',
        "              empireEpochForOwner,\n            );\n            __recordLargeEmpireEotPhase(__profileTurnId, 'auto_ration_advanceEmpireFood', __profileAutoRationStart);\n            // P-WZROSTPROCENT-PLAKIETKA-ROZJAZD",
        'auto ration phase exit');
      replaceOnce('            const allDestroyedIds: string[] = [];',
        '            __profilePostFoodStart = performance.now();\n            const allDestroyedIds: string[] = [];',
        'post-food HP/resource/siege timing entry');
      replaceOnce("          } catch (errSiege) {\n            console.error('[Oblezenie] Blad atrycji:', errSiege);\n          }\n\n          // --- Bank treasury",
        "          } catch (errSiege) {\n            console.error('[Oblezenie] Blad atrycji:', errSiege);\n          }\n          __recordLargeEmpireEotPhase(__profileTurnId, 'postFood_hp_resource_siege_loops', __profilePostFoodStart);\n\n          // --- Bank treasury",
        'post-food HP/resource/siege timing exit');
      replaceOnce('          refreshTradeRoutesOverlay();\n          for (const [hexKey, st] of hexClearingStates) {',
        "          const __profileTradeOverlayStarted = performance.now();\n          refreshTradeRoutesOverlay();\n          __recordLargeEmpireEotPhase(__profileTurnId, 'refreshTradeRoutesOverlay', __profileTradeOverlayStarted);\n          for (const [hexKey, st] of hexClearingStates) {",
        'trade overlay timing');
      replaceOnce('            // Cities may have changed population -> refresh their labels.\n            cityRenderer.sync(cities, _cityRenderOpts());',
        "            // Cities may have changed population -> refresh their labels.\n            const __profileEconomyCitySyncStart = performance.now();\n            cityRenderer.sync(cities, _cityRenderOpts());\n            __recordLargeEmpireEotPhase(__profileTurnId, 'economy_cityRenderer_sync', __profileEconomyCitySyncStart);",
        'economy city renderer timing');

      replaceOnce('        snapshot = buildSaveGameSnapshot(currentSaveLabel(\'autosave\'));',
        "        (window as any).__largeEmpireAutosaveTurn = turn;\n        const __profileSnapshotStarted = performance.now();\n        snapshot = buildSaveGameSnapshot(currentSaveLabel('autosave'));\n        __recordLargeEmpireEotPhase(turn, 'autosave_buildSaveGameSnapshot_sync', __profileSnapshotStarted);",
        'autosave snapshot build timing');

      const autosaveCall = '          void doRotatingAutosave().catch((eAutosave) => {';
      replaceOnce(autosaveCall, '          const __profileAutosaveStarted = performance.now();\n          const __profileAutosaveTurn = turn;\n          void doRotatingAutosave().then(() => {\n            __recordLargeEmpireEotPhase(__profileAutosaveTurn, \'autosave_async\', __profileAutosaveStarted);\n          }).catch((eAutosave) => {', 'rotating autosave observer');

      const aiCall = '          await runAiPhase();';
      replaceOnce(aiCall, '          const __profileAiStart = performance.now();\n          try { await runAiPhase(); } finally { __recordLargeEmpireEotPhase(__profileTurnId, \'runAiPhase\', __profileAiStart); }', 'runAiPhase timing');

      const aiPhaseStart = '          const runAiPhase = async (): Promise<void> => {\n            aiTurnAwaitingBattle = false;';
      replaceOnce(aiPhaseStart,
        aiPhaseStart.replace('            aiTurnAwaitingBattle = false;', '            const __profileAiPreOwnerStarted = performance.now();\n            aiTurnAwaitingBattle = false;'),
        'AI pre-owner setup entry');
      const ownerLoopLabel = '            ownerLoop: for (let oi = startOi; oi < ownerLoopList.length; oi++) {';
      replaceOnce(ownerLoopLabel,
        "            __recordLargeEmpireEotPhase(__profileTurnId, 'ai_phase_pre_owner_setup', __profileAiPreOwnerStarted);\n" + ownerLoopLabel,
        'AI pre-owner setup exit');

      const forcedPairingStart = '            const forcedWarPairingResult = assignForcedWarPairings(';
      replaceOnce(forcedPairingStart, '            const __profileForcedWarPairingStarted = performance.now();\n' + forcedPairingStart, 'forced-war pairing entry');
      const forcedPairingEnd = '              },\n            );\n            if (forcedWarPairingResult.unresolvedOwnerIds.length > 0) {';
      replaceOnce(forcedPairingEnd,
        "              },\n            );\n            __recordLargeEmpireEotPhase(__profileTurnId, 'forced_war_pairing', __profileForcedWarPairingStarted);\n            if (forcedWarPairingResult.unresolvedOwnerIds.length > 0) {",
        'forced-war pairing exit');

      const sisterAllianceCall = '            try {\n              formSisterAlliancesIfThreatened();\n            } catch (eSisterAlly) {\n              console.error(\'[Dyplomacja] Blad sojuszy siostrzanych:\', eSisterAlly);\n            }';
      replaceOnce(sisterAllianceCall,
        '            const __profileSisterAlliancesStarted = performance.now();\n' + sisterAllianceCall + "\n            __recordLargeEmpireEotPhase(__profileTurnId, 'formSisterAlliancesIfThreatened', __profileSisterAlliancesStarted);",
        'sister alliance formation timing');
      const aiTradeCall = '            try {\n              formAiAiTradeAgreementsIfEligible();\n            } catch (eAiAiTrade) {\n              console.error(\'[Dyplomacja] Blad Umow Handlowych AI-AI:\', eAiAiTrade);\n            }';
      replaceOnce(aiTradeCall,
        '            const __profileAiTradeStarted = performance.now();\n' + aiTradeCall + "\n            __recordLargeEmpireEotPhase(__profileTurnId, 'formAiAiTradeAgreementsIfEligible', __profileAiTradeStarted);",
        'AI trade agreement formation timing');
      const autoSiegeCall = '            if (!aiTurnAwaitingBattle) {\n              scanAutoSiegesAfterAiTurn();\n            }';
      replaceOnce(autoSiegeCall,
        "            if (!aiTurnAwaitingBattle) {\n              const __profileAutoSiegesStarted = performance.now();\n              try { scanAutoSiegesAfterAiTurn(); } finally { __recordLargeEmpireEotPhase(__profileTurnId, 'scanAutoSiegesAfterAiTurn', __profileAutoSiegesStarted); }\n            }",
        'auto-siege scan timing');

      const siegeScanDecl = '    function scanAutoSiegesAfterAiTurn(): void {';
      replaceOnce(siegeScanDecl, `    function scanAutoSiegesAfterAiTurn(): void {
      const __siegeScanStartedAt = performance.now();
      const __siegeScanProfile = { turn: turn + 1, eligibleCities: 0, detected: 0, stanceRetreat: 0, stanceAssault: 0, stanceBuild: 0, stanceContinue: 0, validateMs: 0, detectMs: 0, decisionMs: 0, silentStormMs: 0, silentStormCalls: 0, startSiegeMs: 0, startSiegeCalls: 0 };
      const __validateSiegesStartedAt = performance.now();
      validateActiveSieges();
      __siegeScanProfile.validateMs = +(performance.now() - __validateSiegesStartedAt).toFixed(2);
      for (const city of cities) {
        if (city.oblegane || city.ownerId !== 0 || !city.maMur) continue;
        __siegeScanProfile.eligibleCities++;
        const __detectStartedAt = performance.now();
        const auto = detectAutoSiegeOnCity(city, units);
        __siegeScanProfile.detectMs += performance.now() - __detectStartedAt;
        if (!auto) continue;
        __siegeScanProfile.detected++;

        const atkUnits = collectSiegeAtkRoster(city, auto.atakujacy);
        const siegeArmy = atkUnits.map(runtimeUnitToSiegeUnit);
        const siegeCity = buildSiegeCityFromRuntime(city);
        const aiKey = siegeAiKey(auto.oblegajacyOwnerId, city.id);
        const persisted = siegeAiStateByKey.get(aiKey) ?? { ...EMPTY_SIEGE_AI_STATE };
        const __decisionStartedAt = performance.now();
        const decision = decideAISiegeStance(siegeArmy, siegeCity, persisted);
        __siegeScanProfile.decisionMs += performance.now() - __decisionStartedAt;

        console.log('[Oblezenie AI]', city.name, decision.stance, decision.powod);

        if (decision.stance === 'retreat') { __siegeScanProfile.stanceRetreat++; continue; }

        if (decision.stance === 'assault') {
          __siegeScanProfile.stanceAssault++;
          const __silentStormStartedAt = performance.now();
          try { executeSilentSiegeStorm(auto); }
          finally {
            __siegeScanProfile.silentStormMs += performance.now() - __silentStormStartedAt;
            __siegeScanProfile.silentStormCalls++;
          }
          continue;
        }

        if (decision.stance === 'siege_build' && !city.siegeMachines?.queue.length) {
          __siegeScanProfile.stanceBuild++;
          queueSiegeMachine(city, 'taran');
        } else if (decision.stance === 'siege_continue') {
          __siegeScanProfile.stanceContinue++;
        }

        const __startSiegeStartedAt = performance.now();
        try { startMapSiege(auto); }
        finally {
          __siegeScanProfile.startSiegeMs += performance.now() - __startSiegeStartedAt;
          __siegeScanProfile.startSiegeCalls++;
        }
        siegeAiStateByKey.set(aiKey, {
          siegeTurn: 1,
          machinesReady: city.siegeMachines?.ready.length ?? 0,
        });
        console.log('[Oblezenie] Auto AI →', city.name, decision.stance);
      }
      __siegeScanProfile.detectMs = +__siegeScanProfile.detectMs.toFixed(2);
      __siegeScanProfile.decisionMs = +__siegeScanProfile.decisionMs.toFixed(2);
      __siegeScanProfile.silentStormMs = +__siegeScanProfile.silentStormMs.toFixed(2);
      __siegeScanProfile.startSiegeMs = +__siegeScanProfile.startSiegeMs.toFixed(2);
      const __siegeProfileTarget = window as any;
      (__siegeProfileTarget.__largeEmpireSiegeScanRows ??= []).push({ ...__siegeScanProfile, totalMs: +(performance.now() - __siegeScanStartedAt).toFixed(2) });
    }`, 'auto-siege branch profiling');

      // The injected declaration replaces the original signature; remove the original
      // body up to the next function so the transformed module contains one implementation.
      const siegeProfileEnd = output.indexOf('__largeEmpireSiegeScanRows ??=', output.indexOf(siegeScanDecl));
      const originalSiegeBodyStart = output.indexOf(
        '      validateActiveSieges();\n      for (const city of cities) {', siegeProfileEnd,
      );
      const originalSiegeBodyEnd = output.indexOf('\n    function maybeAiAssaultAfterMachines', originalSiegeBodyStart);
      if (siegeProfileEnd < 0 || originalSiegeBodyStart < 0 || originalSiegeBodyEnd < 0) {
        throw new Error('auto-siege original body removal anchors missing');
      }
      output = output.slice(0, originalSiegeBodyStart) + output.slice(originalSiegeBodyEnd);

      const stormDecl = '    function executeSilentSiegeStorm(ctx: MapSiegeContext): void {';
      replaceOnce(stormDecl, `${stormDecl}
      const __stormProfile: Record<string, unknown> = { cityId: ctx.city.id, cityName: ctx.city.name };
      const __stormStartedAt = performance.now();
      const __recordStorm = (): void => { (__stormProfile as any).totalMs = +(performance.now()-__stormStartedAt).toFixed(2); ((window as any).__largeEmpireSiegeStormRows ??= []).push({...__stormProfile}); };
`, 'silent storm profile entry');
      replaceOnce('      if (!city || !anchor || !city.maMur) return;\n\n      let atkRoster = collectSiegeAtkRoster(city, anchor);\n      atkRoster = appendReadyMachinesToRoster(atkRoster, city, anchor.ownerId);',
        `      if (!city || !anchor || !city.maMur) { __stormProfile.earlyExit='missing city/anchor/wall'; __recordStorm(); return; }

      const __rosterStarted=performance.now();
      let atkRoster = collectSiegeAtkRoster(city, anchor);
      atkRoster = appendReadyMachinesToRoster(atkRoster, city, anchor.ownerId);
      __stormProfile.rosterMs=+(performance.now()-__rosterStarted).toFixed(2); __stormProfile.attackers=atkRoster.length;
      const __defenderCheckStarted=performance.now();
      const __hasDefenders=cityHasDefenders(city);
      __stormProfile.hasDefenders=__hasDefenders;
      __stormProfile.defenderCheckMs=+(performance.now()-__defenderCheckStarted).toFixed(2);`, 'silent storm roster and defender profiling');
      replaceOnce('      if (!cityHasDefenders(city)) {\n        captureCityWithoutBattle(city, anchor, atkRoster);\n        return;\n      }\n      const defRoster = collectSiegeDefRoster(city);',
        `      if (!__hasDefenders) {
        const __captureStarted=performance.now();
        captureCityWithoutBattle(city, anchor, atkRoster);
        __stormProfile.emptyCaptureMs=+(performance.now()-__captureStarted).toFixed(2); __stormProfile.path='captureCityWithoutBattle'; __recordStorm();
        return;
      }
      const __defRosterStarted=performance.now();
      const defRoster = collectSiegeDefRoster(city);
      __stormProfile.defRosterMs=+(performance.now()-__defRosterStarted).toFixed(2); __stormProfile.defenders=defRoster.length;`,'silent storm capture/defender roster profiling');
      replaceOnce('      if (defRoster.length === 0) {\n        captureCityWithoutBattle(city, anchor, atkRoster);\n        return;\n      }',
        `      if (defRoster.length === 0) {
        const __captureStarted=performance.now(); captureCityWithoutBattle(city, anchor, atkRoster);
        __stormProfile.emptyCaptureMs=+(performance.now()-__captureStarted).toFixed(2); __stormProfile.path='emptyDefRosterCapture'; __recordStorm();
        return;
      }`, 'silent storm empty def roster profiling');
      replaceOnce('      try {\n        const atkStartSnap = snapshotRosterPositions(atkRoster);',
        '      try {\n        const __powerStarted=performance.now();\n        const atkStartSnap = snapshotRosterPositions(atkRoster);', 'silent storm power timing entry');
      replaceOnce('        const powerRes = resolveAutoBattleByPower({ mAtk, mDef });\n        if (powerRes.winner === \'none\') return;',
        `        const powerRes = resolveAutoBattleByPower({ mAtk, mDef });
        __stormProfile.powerMs=+(performance.now()-__powerStarted).toFixed(2); __stormProfile.powerWinner=powerRes.winner;
        if (powerRes.winner === 'none') { __stormProfile.earlyExit='no winner'; __recordStorm(); return; }`, 'silent storm power timing exit');
      replaceOnce('        finishSiegeStormBattle(\n          city,',
        '        const __finishStarted=performance.now();\n        finishSiegeStormBattle(\n          city,', 'silent storm finish timing entry');
      replaceOnce("        console.log('[Oblezenie AI] szturm auto', city.name, winner);",
        "        __stormProfile.finishSiegeStormBattleMs=+(performance.now()-__finishStarted).toFixed(2); __stormProfile.path='finishSiegeStormBattle'; __recordStorm();\n        console.log('[Oblezenie AI] szturm auto', city.name, winner);", 'silent storm finish timing exit');
      replaceOnce("        console.error('[Oblezenie AI] szturm auto fail:', e);\n        startMapSiege(ctx);",
        "        console.error('[Oblezenie AI] szturm auto fail:', e);\n        const __fallbackStarted=performance.now(); startMapSiege(ctx); __stormProfile.fallbackStartSiegeMs=+(performance.now()-__fallbackStarted).toFixed(2); __stormProfile.path='fallbackStartMapSiege'; __recordStorm();", 'silent storm fallback timing');

      const finishApply = '        applyMapBattleOutcome(atkRoster, defRoster, res.winner, res.survivors, battleOpts);\n        afterSiegeUi();';
      replaceOnce(finishApply,
        `        const __applyOutcomeStarted=performance.now();
        try { applyMapBattleOutcome(atkRoster, defRoster, res.winner, res.survivors, battleOpts); }
        finally { ((window as any).__largeEmpireSiegeOutcomeRows ??= []).push({cityId:city.id,cityName:city.name,phase:'applyMapBattleOutcome',ms:+(performance.now()-__applyOutcomeStarted).toFixed(2)}); }
        const __afterSiegeUiStarted=performance.now(); afterSiegeUi();
        ((window as any).__largeEmpireSiegeOutcomeRows ??= []).push({cityId:city.id,cityName:city.name,phase:'afterSiegeUi',ms:+(performance.now()-__afterSiegeUiStarted).toFixed(2)});`,
        'siege finish apply and UI timing');
      const applyPostBattle = '      applyPostBattleMap({';
      replaceOnce(applyPostBattle, '      const __applyPostBattleStarted=performance.now();\n' + applyPostBattle, 'applyPostBattleMap timing entry');
      replaceOnce('        cityOnBattleHex: cityOnHex,\n      });',
        `        cityOnBattleHex: cityOnHex,
      });
      ((window as any).__largeEmpireSiegeOutcomeRows ??= []).push({phase:'applyPostBattleMap',ms:+(performance.now()-__applyPostBattleStarted).toFixed(2)});`, 'applyPostBattleMap timing exit');
      replaceOnce('        const captureResult = applyCityCaptureToMap(cityOnHex, atkRoster, atkOwner, atkRoster[0] ?? null);',
        `        const __captureStart=performance.now();
        const captureResult = applyCityCaptureToMap(cityOnHex, atkRoster, atkOwner, atkRoster[0] ?? null);
        ((window as any).__largeEmpireSiegeOutcomeRows ??= []).push({cityId:cityOnHex.id,cityName:cityOnHex.name,phase:'applyCityCaptureToMap',ms:+(performance.now()-__captureStart).toFixed(2)});`, 'applyCityCaptureToMap timing');
      const outcomeSync = `      if (!(opts?.deferUnitRenderSyncAfterSiegeCapture && siegeCaptureSucceeded)) {
        syncUnitsRender();
      }
      // P-OBLEZENIE-IKONA-NIE-ZNIKA-PO-WYGRANEJ`;
      replaceOnce(outcomeSync,
        `      if (!(opts?.deferUnitRenderSyncAfterSiegeCapture && siegeCaptureSucceeded)) {
        const __syncUnitsStarted=performance.now(); syncUnitsRender();
        ((window as any).__largeEmpireSiegeOutcomeRows ??= []).push({phase:'applyMapBattleOutcome.syncUnitsRender',ms:+(performance.now()-__syncUnitsStarted).toFixed(2)});
      } else {
        ((window as any).__largeEmpireSiegeOutcomeRows ??= []).push({phase:'applyMapBattleOutcome.syncUnitsRenderSkipped',ms:0});
      }
      // P-OBLEZENIE-IKONA-NIE-ZNIKA-PO-WYGRANEJ`, 'battle outcome unit render sync timing');
      const oldCaptureRefreshAnchor = '      syncUnitsRender();\n      cityRenderer.sync(cities, _cityRenderOpts());\n      refreshFog();\n      updateHud();\n      refreshD1bHud();\n      refreshSiegeMarkers();';
      const guardedCaptureRefreshAnchor = oldCaptureRefreshAnchor.replace('      syncUnitsRender();', '      if (galleryOn) syncUnitsRender();');
      const oldCaptureRefreshReplacement = `      let __renderStarted=performance.now(); syncUnitsRender(); ((window as any).__largeEmpireSiegeOutcomeRows ??= []).push({phase:'refreshMapAfterCityCapture.syncUnitsRender',ms:+(performance.now()-__renderStarted).toFixed(2)});
      __renderStarted=performance.now(); cityRenderer.sync(cities, _cityRenderOpts()); ((window as any).__largeEmpireSiegeOutcomeRows ??= []).push({phase:'refreshMapAfterCityCapture.cityRendererSync',ms:+(performance.now()-__renderStarted).toFixed(2)});
      __renderStarted=performance.now(); refreshFog(); ((window as any).__largeEmpireSiegeOutcomeRows ??= []).push({phase:'refreshMapAfterCityCapture.refreshFog',ms:+(performance.now()-__renderStarted).toFixed(2)});
      updateHud(); refreshD1bHud(); refreshSiegeMarkers();`;
      const guardedCaptureRefreshReplacement = `      let __renderStarted=performance.now(); if (galleryOn) { syncUnitsRender(); ((window as any).__largeEmpireSiegeOutcomeRows ??= []).push({phase:'refreshMapAfterCityCapture.syncUnitsRender',ms:+(performance.now()-__renderStarted).toFixed(2)}); }
      __renderStarted=performance.now(); cityRenderer.sync(cities, _cityRenderOpts()); ((window as any).__largeEmpireSiegeOutcomeRows ??= []).push({phase:'refreshMapAfterCityCapture.cityRendererSync',ms:+(performance.now()-__renderStarted).toFixed(2)});
      __renderStarted=performance.now(); refreshFog(); ((window as any).__largeEmpireSiegeOutcomeRows ??= []).push({phase:'refreshMapAfterCityCapture.refreshFog',ms:+(performance.now()-__renderStarted).toFixed(2)});
      updateHud(); refreshD1bHud(); refreshSiegeMarkers();`;
      replaceOneOf([oldCaptureRefreshAnchor, guardedCaptureRefreshAnchor], [oldCaptureRefreshReplacement, guardedCaptureRefreshReplacement], 'capture refresh render/fog timing');

      const captureCallback = '          onOwnerChanged: (c: City): void => {\n            seedCityOwnerDefaults(c);';
      replaceOnce(captureCallback,
        `          onOwnerChanged: (c: City): void => {
            ((window as any).__largeEmpireCaptureTransitions ??= []).push({ channel: 'applyCityCaptureToMap.onOwnerChanged', turn, cityId: c.id, cityName: c.name, oldOwnerId: oldOwner, newOwnerId: atkOwner, relation: (window as any).__turnSlowdownTestDebug?.relationSnapshot(oldOwner, atkOwner) ?? null });
            seedCityOwnerDefaults(c);`,
        'capture callback transition diagnostic');
      const surrenderMutation = '        city.ownerId = newOwner;\n        // R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE';
      replaceOnce(surrenderMutation,
        `        city.ownerId = newOwner;
        ((window as any).__largeEmpireCaptureTransitions ??= []).push({ channel: 'resolveSiegeSurrender.ownerId', turn, cityId: city.id, cityName: city.name, oldOwnerId: oldOwner, newOwnerId: newOwner, relation: (window as any).__turnSlowdownTestDebug?.relationSnapshot(oldOwner, newOwner) ?? null });
        // R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE`,
        'siege surrender transition diagnostic');

      const ownerLoopStart = '              const ownerId = ownerLoopList[oi]!;\n              // Bezpiecznik: gdyby lista pochodziła z aiCmdResume sprzed eliminacji\n              // (skasowanie w trakcie tej samej fazy AI) — pomiń bez przetwarzania.\n              if (eliminatedOwners.has(ownerId)) continue;';
      replaceOnce(ownerLoopStart, ownerLoopStart + '\n              const __aiOwnerProfileStarted = performance.now();', 'AI owner phase entry');
      const ownerPaintGate = `              if (shouldYieldAiOwnerProgressFrame(oi, ownerLoopList.length, startOi)) {\n                flushAiCityRenderBatch();\n                await yieldTurnTransitionUi();\n              }\n              const isCommandResume = oi === startOi`;
      replaceOnce(ownerPaintGate, `              const __aiOwnerShouldPaint = __largeEmpireOwnerPaintMode === 'all'\n                || shouldYieldAiOwnerProgressFrame(oi, ownerLoopList.length, startOi);\n              if (__aiOwnerShouldPaint) {\n                const __aiOwnerYieldStarted = performance.now();\n                await yieldTurnTransitionUi();\n                __recordLargeEmpireEotPhase(__profileTurnId, 'ai_owner_ui_yield', __aiOwnerYieldStarted, { ownerId, ownerIndex: oi, ownerCount: ownerLoopList.length, startIndex: startOi, modeAll: __largeEmpireOwnerPaintMode === 'all' ? 1 : 0 });\n              }\n              const isCommandResume = oi === startOi`, 'A/B owner transition yield');
      replaceOnce('              if (!isCommandResume) upgradeAiUnitsForEra(ownerId);', '              if (!isCommandResume) __measureLargeEmpireAi(__profileTurnId, ownerId, \'ai_owner_upgradeAiUnitsForEra\', () => upgradeAiUnitsForEra(ownerId));', 'AI era upgrade timing');

      replaceOnce('                const upkeepSlider = previewOwnerUpkeep(', '                const upkeepSlider = __measureLargeEmpireAi(__profileTurnId, ownerId, \'ai_owner_previewOwnerUpkeep\', () => previewOwnerUpkeep(', 'AI upkeep preview timing entry');
      replaceOnce('                  unlockedTechSetForOwner,\n                );\n                const sliderDecision = decideAIEconomySliders(', '                  unlockedTechSetForOwner,\n                ));\n                const __profileSliderStarted = performance.now();\n                const sliderDecision = decideAIEconomySliders(', 'AI upkeep preview timing exit');
      replaceOnce('                  aiSliderParams,\n                );\n                const profileChanged = allocationProfile !== undefined', '                  aiSliderParams,\n                );\n                __recordLargeEmpireEotPhase(__profileTurnId, \'ai_owner_decideAIEconomySliders\', __profileSliderStarted, { ownerId });\n                const profileChanged = allocationProfile !== undefined', 'AI slider decision timing');
      replaceOnce('            const aiVisibleHexes = fogOn ? currentVisibleForOwner(ownerId) : undefined;', '            const aiVisibleHexes = fogOn ? __measureLargeEmpireAi(__profileTurnId, ownerId, \'ai_owner_currentVisibleForOwner\', () => currentVisibleForOwner(ownerId)) : undefined;', 'AI visibility timing');
      replaceOnce('            const powerRankInfo = computeAbsolutePowerRank(', '            const powerRankInfo = __measureLargeEmpireAi(__profileTurnId, ownerId, \'ai_owner_computeAbsolutePowerRank\', () => computeAbsolutePowerRank(', 'AI power rank timing entry');
      replaceOnce('              { cityStateOpts: ownerCityStateOpts() },\n            );\n            // R-AI-WOJNA-EPOKI', '              { cityStateOpts: ownerCityStateOpts() },\n            ));\n            // R-AI-WOJNA-EPOKI', 'AI power rank timing exit');

      const aiDiploStart = '            // --- C-AI-WOJNA-Q1=A: dyplomacja PRZED ruchem (wojna w tej turze, atak od następnej) ---\n            try {';
      replaceOnce(aiDiploStart, aiDiploStart.replace('            try {', '            const __aiDiplomacyStarted = performance.now();\n            try {'), 'AI diplomacy timing entry');
      const aiDiploEnd = '            } finally {\n              aiDiploTradeGoodsCache = null;\n              aiDiploQtyOptionsCache = null;\n            }\n\n            try {\n              // R-WEB-TURN-SLOWDOWN-Q2';
      replaceOnce(aiDiploEnd, aiDiploEnd.replace('            }\n\n            try {\n              // R-WEB-TURN-SLOWDOWN-Q2', "            }\n            __recordLargeEmpireEotPhase(__profileTurnId, 'ai_owner_diplomacy', __aiDiplomacyStarted, { ownerId });\n\n            try {\n              // R-WEB-TURN-SLOWDOWN-Q2"), 'AI diplomacy timing exit');

      const decideCall = '                commands = decideAITurn(ownerId, units, cities, map, data, opts);';
      replaceOnce(decideCall, '                const __plannerUnits = units.filter((u) => u.ownerId === ownerId).length;\n                const __plannerStarted = performance.now();\n                __recordLargeEmpireEotPhase(__profileTurnId, \'ai_owner_preplanner\', __aiOwnerProfileStarted, { ownerId, units: __plannerUnits });\n                (window as any).__aiPlannerPerfTestDebug.reset(ownerId);\n                (window as any).__aiPlannerPerfTestDebug.setOwner(ownerId);\n                try { commands = decideAITurn(ownerId, units, cities, map, data, opts); } finally { (window as any).__aiPlannerPerfTestDebug.setOwner(null); }\n                const __plannerPathCounts = (window as any).__aiPlannerPerfTestDebug.counts(ownerId);\n                __recordLargeEmpireEotPhase(__profileTurnId, \'ai_owner_planner\', __plannerStarted, { ownerId, units: __plannerUnits, commands: commands.length, computePath: __plannerPathCounts.computePath, firstStep: __plannerPathCounts.firstStep });', 'per-owner decideAITurn profiling');
      const cmdLoopStart = '            for (let ci = cmdStart; ci < commands.length; ci++) {';
      replaceOnce(cmdLoopStart, '            const __aiCommandExecStart = performance.now();\n            const __aiCommandTypeStats = new Map<string, { count: number; ms: number }>();\n' + cmdLoopStart, 'AI command executor entry');
      const cmdBodyStart = '              const cmd = commands[ci]!;\n              try {';
      replaceOnce(cmdBodyStart, '              const cmd = commands[ci]!;\n              const __cmdType = String(cmd.type);\n              const __cmdStarted = performance.now();\n              try {', 'AI command type timing entry');
      const cmdCatchEnd = '              } catch (eCMD) {\n                console.error(`[AI ${ownerId}] Blad wykonania komendy ${(cmd as { type?: string }).type}:`, eCMD);\n              }\n            }';
      replaceOnce(cmdCatchEnd, '              } catch (eCMD) {\n                console.error(`[AI ${ownerId}] Blad wykonania komendy ${(cmd as { type?: string }).type}:`, eCMD);\n              } finally {\n                const __elapsed = performance.now() - __cmdStarted;\n                const __stat = __aiCommandTypeStats.get(__cmdType) ?? { count: 0, ms: 0 };\n                __stat.count++; __stat.ms += __elapsed; __aiCommandTypeStats.set(__cmdType, __stat);\n              }\n            }', 'AI command type timing exit');
      const cmdLoopEnd = '            }\n            // Follow-up „przenieś stolicę"';
      replaceOnce(cmdLoopEnd, '            }\n            __recordLargeEmpireEotPhase(__profileTurnId, \'ai_owner_command_execution\', __aiCommandExecStart, { ownerId, units: units.filter((u) => u.ownerId === ownerId).length, commands: Math.max(0, commands.length - cmdStart) });\n            for (const [cmdType, stat] of __aiCommandTypeStats) {\n              __recordLargeEmpireEotPhase(__profileTurnId, \'ai_cmd_\' + cmdType, performance.now(), { ownerId, commands: stat.count, ms: +stat.ms.toFixed(2) });\n            }\n            const __aiOwnerPostCommandsStarted = performance.now();\n            // Follow-up „przenieś stolicę"', 'AI command executor exit');
      const ownerLoopEnd = '            maybeRelocateThreatenedAiCapital(ownerId);\n          }';
      replaceOnce(ownerLoopEnd, '            maybeRelocateThreatenedAiCapital(ownerId);\n            __recordLargeEmpireEotPhase(__profileTurnId, \'ai_owner_postcommands\', __aiOwnerPostCommandsStarted, { ownerId, units: units.filter((u) => u.ownerId === ownerId).length, commands: Math.max(0, commands.length - cmdStart) });\n          }', 'AI owner post-command segment');

      const barbPhase = '        setTurnTransition(94, \'Barbarzyńcy…\', \'Barbarzyńcy\', nextTurnNum);\n        await yieldTurnTransitionUi();\n        try {';
      replaceOnce(barbPhase, barbPhase.replace('        try {', '        const __profileBarbarianStart = performance.now();\n        try {'), 'barbarian phase entry');
      const barbEnd = "        } catch (eBarb) {\n          console.error('[Barbarzyncy] Blad ticku:', eBarb);\n        }\n\n        // ===================================================================\n        // VICTORY CHECK";
      replaceOnce(barbEnd, barbEnd.replace('        // ===================================================================\n        // VICTORY CHECK', "        __recordLargeEmpireEotPhase(__profileTurnId, 'barbarian_tick', __profileBarbarianStart);\n\n        // ===================================================================\n        // VICTORY CHECK"), 'barbarian phase exit');

      replaceOnce('        markCityStateDirty(); // D10: koniec tury — siatka bezpieczeństwa (wzrost/tech/zdobycie/AI)\n        updateHud();',
        "        markCityStateDirty(); // D10: koniec tury — siatka bezpieczeństwa (wzrost/tech/zdobycie/AI)\n        const __profileHudStart = performance.now();\n        updateHud();\n        __recordLargeEmpireEotPhase(__profileTurnId, 'final_updateHud', __profileHudStart);",
        'final updateHud');
      replaceOnce('        cityRenderer.sync(cities, _cityRenderOpts());\n        refreshWorkerFieldOverlay();',
        "        const __profileFinalCitySyncStart = performance.now();\n        cityRenderer.sync(cities, _cityRenderOpts());\n        __recordLargeEmpireEotPhase(__profileTurnId, 'final_cityRenderer_sync', __profileFinalCitySyncStart);\n        refreshWorkerFieldOverlay();",
        'final cityRenderer.sync');
      replaceOnce('        // Refresh fog after end-turn so new unit positions update visibility.\n        refreshFog();',
        "        // Refresh fog after end-turn so new unit positions update visibility.\n        const __profileFinalFogStart = performance.now();\n        refreshFog();\n        __recordLargeEmpireEotPhase(__profileTurnId, 'final_refreshFog', __profileFinalFogStart);",
        'final refreshFog');
      const eotEnd = '        setTurnTransition(100, `Tura ${turn} — twoja kolej`, \'Gracz\', turn);\n        await yieldTurnTransitionUi();\n    }\n\n    // R-HOTSEAT-ETAP4B-SPLIT-Q1';
      replaceOnce(eotEnd, eotEnd.replace('        await yieldTurnTransitionUi();\n    }', "        await yieldTurnTransitionUi();\n        __recordLargeEmpireEotPhase(__profileTurnId, 'runWorldEndTurn_total', __profileTotalStart);\n        __largeEmpireEotCompleted++;\n    }"), 'runWorldEndTurn total');

      const postFoodScope = [
        'let __profilePostFoodStart = 0;',
        '__profilePostFoodStart = performance.now();',
        "__recordLargeEmpireEotPhase(__profileTurnId, 'postFood_hp_resource_siege_loops', __profilePostFoodStart);",
      ];
      const postFoodPositions = postFoodScope.map(anchor => output.indexOf(anchor));
      if (postFoodPositions.some((position, index) => position < 0
        || output.indexOf(postFoodScope[index], position + postFoodScope[index].length) >= 0)
        || !(postFoodPositions[0] < postFoodPositions[1]
          && postFoodPositions[1] < postFoodPositions[2])) {
        throw new Error('post-food timer instrumentation must declare once in the economy scope, assign once after food advance, and consume once after siege processing');
      }

      return { code: output, map: null };
    },
  };
  await viteBuild(mergeConfig(base, { root, plugins: [plugin], build: { outDir: out, emptyOutDir: true } }));
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

async function main() {
  const runStartedAt = new Date();
  await build();
  console.log('[large-empire] build identity:', JSON.stringify(build.identity));
  if (process.env.STRESS_BUILD_ONLY === '1') {
    console.log('[large-empire] build-only validation PASS; browser workload not started');
    fs.rmSync(out, { recursive: true, force: true });
    return;
  }
  const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
  const server = http.createServer((req,res) => {
    res.setHeader('content-type','text/html; charset=utf-8');
    fs.createReadStream(path.join(out,'index.html')).pipe(res);
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  // The non-mutating deal snapshot is exposed only in DEV or when the URL has a
  // playtest query key. `stress` enables that existing hook without selecting any
  // recognized auto-start playtest route.
  const url = `http://127.0.0.1:${server.address().port}/?playtest=stress`;
  const errors = [];
  const offerDecisions = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    boundPageEvaluations(page, process.env.STRESS_STARTUP_PROBE === '1' ? 7000 : PAGE_EVALUATE_TIMEOUT_MS);
    page.setDefaultTimeout(PAGE_EVALUATE_TIMEOUT_MS);
    page.__largeEmpireCapturedErrors = errors;
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const warnings=[];
    page.__largeEmpireCapturedWarnings = warnings;
    page.on('console', m => { if (m.type() === 'warning') warnings.push(m.text()); });
    progress(page, 'page-load');
    await page.goto(url, { waitUntil:'load', timeout:180000 });
    progress(page, 'test-hooks-ready');
    await page.waitForFunction(() => !!window.__aiBuildingsTestDebug && !!window.__turnSlowdownTestDebug, undefined, { timeout:180000 });
    progress(page, 'new-game-start');
    await page.evaluate(() => window.__aiBuildingsTestDebug.startNewGame({ rivals:'6', cityStates:0, civTypes:7, seed:1412026 }));
    progress(page, 'world-generation-wait');
    if (process.env.STRESS_STARTUP_PROBE === '1') {
      const probe = await runStartupOnlyProbe(page, Math.min(180000, Math.max(1000, Number(process.env.STRESS_STARTUP_CAP_MS) || 180000)));
      if (!probe.ready) process.exitCode = 2;
      try { await deadline(browser.close(), 10000, 'browser close'); } catch { browser.process()?.kill('SIGKILL'); }
      try { await deadline(new Promise(resolve => server.close(resolve)), 5000, 'server close'); } catch {}
      fs.rmSync(out, { recursive: true, force: true });
      return;
    }
    await page.waitForFunction(() => {
      const d=window.__cityStateStartUnitsTestDebug?.dumpState?.();
      const loading=!!document.querySelector('.civ-map-load-overlay');
      return !!d && !loading && d.awaitingFirstPlayerCity===true && d.playerStartHex!==null;
    }, undefined, { timeout:900000, polling:500 });
    progress(page, 'player-start-city');
    const founded=await page.evaluate(()=>window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
    if (!founded) throw new Error('could not found player start city after world generation');
    await page.waitForFunction(() => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen >= 1, undefined, { timeout:60000 });
    progress(page, 'fixture-seed');
    await page.evaluate(() => window.__rebelProtectionTestDebug?.disableVictoryCheckForTest?.());
    const seeded = await page.evaluate(() => window.__turnSlowdownTestDebug.seedLargeEmpireForStress({ player:40, rivals:6, improvements:180 }));
    console.log('[large-empire] scenario:', JSON.stringify(seeded));
    console.log('[large-empire] preturn metrics:', JSON.stringify(await page.evaluate(() => ({ world:window.__eraTestDebug.getWorldState(), render:window.__turnSlowdownTestDebug.renderInfo(), heap:performance.memory?.usedJSHeapSize ?? null }))));
    if (process.env.STRESS_DIRECT_SIEGE_SCAN === '1') {
      const fixture=await page.evaluate(() => window.__turnSlowdownTestDebug.prepareDirectSiegeFixture(8, 4));
      await page.evaluate(ownerId => window.__aiWojnyZwykleCapTestDebug.declareRegularWarBetween(0,ownerId), fixture.aiOwnerId);
      const before=await page.evaluate(ownerId=>({owners:window.__turnSlowdownTestDebug.cityOwnershipSnapshot(),relation:window.__turnSlowdownTestDebug.relationSnapshot(0,ownerId),world:window.__eraTestDebug.getWorldState()}),fixture.aiOwnerId);
      console.log('[large-empire] direct siege fixture:',JSON.stringify({fixture,before}));
      const started=Date.now();
      await page.evaluate(()=>window.__turnSlowdownTestDebug.runAutoSiegeScanForStress());
      const after=await page.evaluate(ownerId=>({owners:window.__turnSlowdownTestDebug.cityOwnershipSnapshot(),relation:window.__turnSlowdownTestDebug.relationSnapshot(0,ownerId),captureEvents:window.__turnSlowdownTestDebug.cityCaptureEventsSnapshot(),captureCallbacks:(window.__largeEmpireCaptureTransitions??[]).splice(0),siegeScans:(window.__largeEmpireSiegeScanRows??[]).splice(0),stormRows:(window.__largeEmpireSiegeStormRows??[]).splice(0),outcomeRows:(window.__largeEmpireSiegeOutcomeRows??[]).splice(0),world:window.__eraTestDebug.getWorldState()}),fixture.aiOwnerId);
      const oldOwners=new Map(before.owners.map(c=>[c.cityId,c]));
      const transitions=after.owners.filter(c=>oldOwners.has(c.cityId)&&oldOwners.get(c.cityId).ownerId!==c.ownerId).map(c=>({cityId:c.cityId,cityName:c.cityName,oldOwnerId:oldOwners.get(c.cityId).ownerId,newOwnerId:c.ownerId}));
      const directResult={bundleSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'index.html'))).digest('hex'),fixture,before,wallMs:Date.now()-started,transitions,relationAfter:after.relation,captureCallbacks:after.captureCallbacks,captureEvents:after.captureEvents,siegeScans:after.siegeScans,stormRows:after.stormRows,outcomeRows:after.outcomeRows,worldBefore:before.world,worldAfter:after.world,errors};
      const resultPath=path.join(os.tmpdir(),`large-empire-direct-siege-${id}.json`); fs.writeFileSync(resultPath,JSON.stringify(directResult,null,2));
      console.log('[large-empire] direct siege scan result:',JSON.stringify({...directResult,resultPath}));
      try { await deadline(browser.close(), 10000, 'browser close'); } catch { browser.process()?.kill('SIGKILL'); }
      server.close(); fs.rmSync(out,{recursive:true,force:true});
      return;
    }
    const samples=[];
    const checkpoints=[];
    const phaseProfiles=[];
    let checkpointStart=Date.now();
    for (let i=0;i<turns;i++) {
      progress(page, 'eot-read-world-before', { iteration: i + 1 });
      const before=await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
      progress(page, 'eot-read-ownership-before', { iteration: i + 1, turnBefore: before });
      const ownershipBefore=await page.evaluate(() => ({ cities:window.__turnSlowdownTestDebug.cityOwnershipSnapshot(), captureEventIds:window.__turnSlowdownTestDebug.cityCaptureEventsSnapshot().map(e=>e.id) }));
      const eotMode = abMode ? abSequence[i] : 'coalesced';
      progress(page, 'eot-configure', { iteration: i + 1, turnBefore: before, mode: eotMode });
      await page.evaluate(mode => window.__endTurnPhaseProfileTestDebug.setOwnerPaintMode(mode), eotMode);
      progress(page, 'eot-prepare-player-units', { iteration: i + 1, turnBefore: before });
      await page.evaluate(() => window.__rebelProtectionTestDebug?.pullPlayerUnitsHome?.());
      const start=Date.now();
      let settled=false;
      let failState=null;
      // Resolve offers in the real UI before attempting EOT. If an offer races in
      // after this check and blocks the trigger, inspect the same gate and retry after
      // the actual UI rejection callback has removed it.
      for (let attempt=0; attempt<8 && !settled; attempt++) {
        progress(page, 'eot-offer-resolution', { iteration: i + 1, turnBefore: before, attempt: attempt + 1 });
        offerDecisions.push(...await rejectPendingAiOffers(page, before));
        progress(page, 'eot-read-lifecycle-before-trigger', { iteration: i + 1, turnBefore: before, attempt: attempt + 1 });
        const profileStartedBefore = await page.evaluate(() => window.__endTurnPhaseProfileTestDebug?.lifecycle?.().started ?? 0);
        // Same advanceSeat()/turn pipeline used by the `data-end` handler, through the
        // existing test hook. Browser click actionability is unreliable at this render load.
        progress(page, 'eot-trigger-call', { iteration: i + 1, turnBefore: before, attempt: attempt + 1, lifecycleStarted: profileStartedBefore });
        await page.evaluate(() => window.__eraTestDebug.endTurn());
        progress(page, 'eot-immediate-state-read', { iteration: i + 1, turnBefore: before, attempt: attempt + 1 });
        const immediate=await page.evaluate(() => ({world:window.__eraTestDebug.getWorldState(),busy:window.__eraTestDebug.isEndTurnInProgress(),deals:window.__dealsLiveDebug.snapshot()}));
        if (immediate.world.turn===before && !immediate.busy && immediate.deals.pending.length) {
          console.log('[large-empire] EOT blocked by pending UI offer; resolving/retrying:', JSON.stringify({turn:before,pending:immediate.deals.pending.map(p=>p.id)}));
          continue;
        }
        try {
          progress(page, 'eot-wait-world-turn-and-busy-clear', { iteration: i + 1, turnBefore: before, timeoutMs: EOT_TIMEOUT_MS });
          await page.waitForFunction(prev => window.__eraTestDebug.getWorldState().turn > prev && !window.__eraTestDebug.isEndTurnInProgress(), before, { timeout:EOT_TIMEOUT_MS, polling:250 });
          progress(page, 'eot-wait-lifecycle-completion', { iteration: i + 1, turnBefore: before, timeoutMs: EOT_TIMEOUT_MS });
          await page.waitForFunction(started => (window.__endTurnPhaseProfileTestDebug?.lifecycle?.().completed ?? 0) > started, profileStartedBefore, { timeout:EOT_TIMEOUT_MS, polling:100 });
          progress(page, 'eot-completed', { iteration: i + 1, turnBefore: before, turnAfter: before + 1, wallMs: Date.now() - start });
          settled=true;
        } catch {
          progress(page, 'eot-timeout-state-read', { iteration: i + 1, turnBefore: before });
          const state=await page.evaluate(() => ({world:window.__eraTestDebug.getWorldState(),busy:window.__eraTestDebug.isEndTurnInProgress(),deals:window.__dealsLiveDebug.snapshot()}));
          if (state.world.turn===before && !state.busy && state.deals.pending.length) {
            console.log('[large-empire] EOT settled without advancing because an AI offer needs a UI decision; resolving/retrying:', JSON.stringify({turn:before,pending:state.deals.pending.map(p=>p.id)}));
            continue;
          }
          failState=state;
          break;
        }
      }
      if (!settled) {
        const shot=path.join(os.tmpdir(),`large-empire-stress-timeout-${id}.png`);
        let screenshotError=null;
        try { await deadline(page.screenshot({path:shot,timeout:PAGE_SCREENSHOT_TIMEOUT_MS}), PAGE_SCREENSHOT_TIMEOUT_MS + 500, 'EOT timeout screenshot'); } catch (e) { screenshotError=String(e); }
        let state=failState;
        let stateReadError=null;
        if (!state) try { state=await page.evaluate(() => ({world:window.__eraTestDebug.getWorldState(),busy:window.__eraTestDebug.isEndTurnInProgress(),deals:window.__dealsLiveDebug.snapshot()})); } catch (e) { stateReadError=String(e); }
        let modals=[];
        let modalReadError=null;
        try { modals=await page.evaluate(() => Array.from(document.querySelectorAll('[role="dialog"],.civ-ux-frame,[class*="battle" i]')).filter(e=>e.offsetParent!==null).slice(0,8).map(e=>(e.textContent||'').trim().slice(0,180))); } catch (e) { modalReadError=String(e); }
        let visibleText='';
        let visibleTextError=null;
        try { visibleText=(await deadline(page.locator('body').innerText({timeout:PAGE_EVALUATE_TIMEOUT_MS}), PAGE_EVALUATE_TIMEOUT_MS + 500, 'timeout body text')).slice(-500); } catch (e) { visibleTextError=String(e); }
        samples.push({turnBefore:before,advanced:false,wallMs:Date.now()-start,...(state ?? {}),modals,visibleText,warnings:warnings.slice(-12),screenshot: screenshotError ? null : shot,screenshotError,stateReadError,modalReadError,visibleTextError,lastPhase:page.__largeEmpirePhase,lastPhaseDetails:page.__largeEmpirePhaseDetails});
        console.log('[large-empire] turn timeout:', compactMode
          ? JSON.stringify({ turnBefore:before, wallMs:samples.at(-1).wallMs, world:state.world, busy:state.busy, pendingOffers:state.deals.pending.length, screenshot:shot })
          : JSON.stringify(samples.at(-1)));
        break;
      }
      const x=await page.evaluate(() => ({ turn:window.__eraTestDebug.getWorldState().turn, world:window.__eraTestDebug.getWorldState(), render:window.__turnSlowdownTestDebug.renderInfo(), heap:performance.memory?.usedJSHeapSize ?? null, perOwner:window.__turnSlowdownTestDebug.citiesPerOwner(), siegeScans:(window.__largeEmpireSiegeScanRows ?? []).splice(0), ownershipAfter:window.__turnSlowdownTestDebug.cityOwnershipSnapshot(), captureEventsAfter:window.__turnSlowdownTestDebug.cityCaptureEventsSnapshot() }));
      const previousOwners=new Map(ownershipBefore.cities.map(c=>[c.cityId,c]));
      const currentOwners=new Map(x.ownershipAfter.map(c=>[c.cityId,c]));
      const ownershipChanges=[];
      for (const [cityId, oldCity] of previousOwners) {
        const newCity=currentOwners.get(cityId);
        if (newCity && newCity.ownerId!==oldCity.ownerId) ownershipChanges.push({cityId,cityName:newCity.cityName,oldOwnerId:oldCity.ownerId,newOwnerId:newCity.ownerId});
      }
      const ownershipAdded=x.ownershipAfter.filter(c=>!previousOwners.has(c.cityId));
      const ownershipRemoved=ownershipBefore.cities.filter(c=>!currentOwners.has(c.cityId));
      const priorCaptureIds=new Set(ownershipBefore.captureEventIds);
      const captureEventsAdded=x.captureEventsAfter.filter(e=>!priorCaptureIds.has(e.id));
      const relationPairs=[...new Set(ownershipChanges.map(c=>[c.oldOwnerId,c.newOwnerId].sort((a,b)=>a-b).join(':')))];
      const ownerTransitionRelations=await page.evaluate(pairs=>pairs.map(pair=>{const [a,b]=pair.split(':').map(Number);return {oldOwnerId:a,newOwnerId:b,...window.__turnSlowdownTestDebug.relationSnapshot(a,b)}}), relationPairs);
      x.ownershipChanges=ownershipChanges;
      x.ownershipAdded=ownershipAdded;
      x.ownershipRemoved=ownershipRemoved;
      x.captureEventsAdded=captureEventsAdded;
      x.ownerTransitionRelations=ownerTransitionRelations;
      const phaseRows=await page.evaluate(() => window.__endTurnPhaseProfileTestDebug?.drain?.() ?? []);
      phaseProfiles.push(...phaseRows);
      if (!abMode && !compactMode) console.log('[large-empire] phase profile rows:',JSON.stringify(phaseRows));
      samples.push({ turnBefore:before, advanced:true, wallMs:Date.now()-start, mode:eotMode, ...x });
      const completed=i+1;
      if (completed % checkpointEvery === 0 || completed === turns) {
        const recent=samples.slice(-checkpointEvery);
        const times=recent.map(s=>s.wallMs);
        const checkpoint={iteration:completed,turn:x.turn,cities:x.world.citiesLen,units:x.world.unitsLen,heapMB:x.heap==null?null:+(x.heap/1048576).toFixed(1),render:x.render,turnAvgMs:Math.round(times.reduce((a,b)=>a+b,0)/times.length),turnMaxMs:Math.max(...times),batchWallMs:Date.now()-checkpointStart};
        checkpoints.push(checkpoint); checkpointStart=Date.now();
        console.log('[large-empire] checkpoint:',JSON.stringify(checkpoint));
      }
      if (samples.at(-1).wallMs > 60000) {
        samples.at(-1).stopReason = 'completed EOT exceeded 60000ms';
        console.log('[large-empire] stop after slow completed EOT:', JSON.stringify({ turn:x.turn, wallMs:samples.at(-1).wallMs }));
        break;
      }
    }
    await wait(1500);
    const asyncProfileRows=await page.evaluate(() => window.__endTurnPhaseProfileTestDebug?.drain?.() ?? []);
    phaseProfiles.push(...asyncProfileRows);
    if (asyncProfileRows.length && !abMode && !compactMode) console.log('[large-empire] late async phase rows:',JSON.stringify(asyncProfileRows));
    const byPhase=new Map();
    for (const row of phaseProfiles) {
      const a=byPhase.get(row.phase) ?? [];
      a.push(row.ms); byPhase.set(row.phase,a);
    }
    const ownerPhaseMap=new Map();
    for (const row of phaseProfiles.filter(r=>r.ownerId!==undefined)) {
      const key=`${row.turn}:${row.ownerId}`;
      const ownerRow=ownerPhaseMap.get(key) ?? {turn:row.turn,ownerId:row.ownerId,phases:{}};
      ownerRow.phases[row.phase]=row.ms;
      if (row.commands!==undefined) ownerRow.phases[row.phase+'_commands']=row.commands;
      if (row.computePath!==undefined) ownerRow.phases.computePath=row.computePath;
      if (row.firstStep!==undefined) ownerRow.phases.firstStep=row.firstStep;
      ownerPhaseMap.set(key,ownerRow);
    }
    const totalsByTurn=new Map(phaseProfiles.filter(r=>r.phase==='runWorldEndTurn_total').map(r=>[r.turn,r.ms]));
    const topLevelPhases=new Set(['city_economy_phase','runAiPhase','barbarian_tick','final_updateHud','final_cityRenderer_sync','final_refreshFog']);
    const remainingByTurn=[];
    for (const [turn,total] of totalsByTurn) {
      const attributed=phaseProfiles.filter(r=>r.turn===turn && topLevelPhases.has(r.phase)).reduce((s,r)=>s+r.ms,0);
      remainingByTurn.push({turn,totalMs:total,measuredMs:+attributed.toFixed(2),remainingMs:+(total-attributed).toFixed(2)});
    }
    const phaseSummary=Array.from(byPhase.entries()).map(([phase,times])=>({phase,count:times.length,totalMs:+times.reduce((a,b)=>a+b,0).toFixed(2),avgMs:+(times.reduce((a,b)=>a+b,0)/times.length).toFixed(2),maxMs:+Math.max(...times).toFixed(2)}));
    const totalTurnsMeasured = totalsByTurn.size;
    const currentAvgMs = totalTurnsMeasured
      ? Array.from(totalsByTurn.values()).reduce((sum, ms) => sum + ms, 0) / totalTurnsMeasured
      : null;
    const yieldCountByTurn = new Map();
    const yieldBudgetFailures = [];
    for (const row of phaseProfiles.filter(r => r.phase === 'ai_owner_ui_yield')) {
      yieldCountByTurn.set(row.turn, (yieldCountByTurn.get(row.turn) ?? 0) + 1);
    }
    for (const [turn, count] of yieldCountByTurn) {
      const rows = phaseProfiles.filter(r => r.turn === turn && r.phase === 'ai_owner_ui_yield');
      const ownerCount = rows[0]?.ownerCount;
      const startIndex = rows[0]?.startIndex ?? 0;
      if (ownerCount === undefined) continue;
      const lastIndex = ownerCount - 1;
      const expectedMax = rows[0]?.modeAll === 1
        ? Math.max(0, ownerCount - startIndex)
        : (lastIndex < startIndex ? 0 : Math.floor((lastIndex - startIndex) / 3) + 1)
          + (lastIndex >= startIndex && (lastIndex - startIndex) % 3 !== 0 ? 1 : 0);
      if (count > expectedMax) yieldBudgetFailures.push({ turn, count, expectedMax, ownerCount, startIndex });
    }
    const baselineComparison = currentAvgMs === null ? null : {
      reference: 'prior five-turn SwiftShader sample; rough historical comparison, not controlled A/B',
      priorAverageMs: PRIOR_SWIFTSHADER_REFERENCE_AVG_MS,
      currentAverageMs: +currentAvgMs.toFixed(2),
      deltaPercent: +(((currentAvgMs - PRIOR_SWIFTSHADER_REFERENCE_AVG_MS) / PRIOR_SWIFTSHADER_REFERENCE_AVG_MS) * 100).toFixed(1),
      measuredTurns: totalTurnsMeasured,
    };
    const totalsRows = phaseProfiles.filter(r=>r.phase==='runWorldEndTurn_total');
    const abRows = samples.filter(s=>s.advanced).map(s=>({
      turn:s.turn, mode:s.mode, totalMs:totalsByTurn.get(s.turn) ?? null,
      yields:yieldCountByTurn.get(s.turn) ?? 0,
      heapMB:s.heap==null?null:+(s.heap/1048576).toFixed(1), render:s.render,
    }));
    const allRows = abRows.filter(r=>r.mode==='all' && r.totalMs!==null);
    const coalescedRows = abRows.filter(r=>r.mode==='coalesced' && r.totalMs!==null);
    const pairs = [[0,1],[3,2],[4,5],[7,6]].map(([a,b])=>({
      all:abRows[a], coalesced:abRows[b],
      deltaMs:abRows[a]?.totalMs!=null && abRows[b]?.totalMs!=null ? +(abRows[a].totalMs-abRows[b].totalMs).toFixed(2) : null,
    }));
    const mean = rows => rows.length ? rows.reduce((sum,row)=>sum+row.totalMs,0)/rows.length : null;
    const allMean=mean(allRows), coalescedMean=mean(coalescedRows);
    const abComparison=abMode ? {
      sequence:abSequence, allEotCount:allRows.length, coalescedEotCount:coalescedRows.length,
      allMeanMs:allMean==null?null:+allMean.toFixed(2),
      coalescedMeanMs:coalescedMean==null?null:+coalescedMean.toFixed(2),
      coalescedDeltaPercent:allMean==null||!allMean||coalescedMean==null?null:+(((coalescedMean-allMean)/allMean)*100).toFixed(1),
      pairs, turns:abRows,
      valid:allRows.length===4 && coalescedRows.length===4 && totalsRows.length===8 && abRows.every(r=>r.totalMs!==null),
    } : null;
    if (!compactMode) console.log('[large-empire] phase summary:',JSON.stringify({phaseSummary,remainingByTurn,baselineComparison,abComparison,yieldCountByTurn:Array.from(yieldCountByTurn.entries()),yieldBudgetFailures}));
    if (!abMode && !compactMode) console.log('[large-empire] per-owner profile:',JSON.stringify(Array.from(ownerPhaseMap.values())));
    if (abMode) {
      const summaryPath = path.join(os.tmpdir(), `large-empire-ab-summary-${id}.json`);
      const compactSummary = {
        scenario: seeded,
        sequence: abSequence,
        abComparison,
        yieldCountByTurn: Array.from(yieldCountByTurn.entries()),
        yieldBudgetFailures,
        errors,
        checkpoints,
      };
      fs.writeFileSync(summaryPath, JSON.stringify(compactSummary, null, 2));
      console.log('[large-empire] A/B compact summary:', JSON.stringify(compactSummary));
      console.log('[large-empire] A/B summary file:', summaryPath);
    }
    const completedTurns = samples.filter(s=>s.advanced).length;
    const slowest = samples.filter(s=>s.advanced).reduce((max,s)=>Math.max(max,s.wallMs),0);
    const stopReason = samples.at(-1)?.stopReason ?? (samples.some(s=>s.advanced===false) ? 'EOT timeout or blocker' : completedTurns === turns ? 'requested turns completed' : 'stopped early');
    if (compactMode && !abMode) {
      const summaryPath = path.join(os.tmpdir(), `large-empire-stress-summary-${id}.json`);
      const compactSummary = {
        startedAt: runStartedAt.toISOString(),
        completedAt: new Date().toISOString(),
        build: build.identity,
        scenario: seeded,
        requestedTurns: turns,
        completedTurns,
        stopReason,
        samples,
        phaseRows: phaseProfiles,
        phaseSummary,
        remainingByTurn,
        yieldCountByTurn: Array.from(yieldCountByTurn.entries()),
        yieldBudgetFailures,
        offerDecisions,
        errors,
        warnings,
        checkpoints,
      };
      fs.writeFileSync(summaryPath, JSON.stringify(compactSummary, null, 2));
      console.log('[large-empire] final summary:', JSON.stringify({ build: build.identity, requestedTurns:turns, completedTurns, stopReason, slowestEotMs:slowest, errors:errors.length, offers:offerDecisions.length, yieldBudgetFailures:yieldBudgetFailures.length, summaryPath }));
    } else {
      console.log('[large-empire] errors:', JSON.stringify(errors));
      console.log('[large-empire] checkpoints:',JSON.stringify(checkpoints));
      console.log('[large-empire] completed turns:',completedTurns+'/'+turns);
    }
    if (samples.some(s=>s.advanced===false) || errors.length || yieldBudgetFailures.length || (abMode && !abComparison?.valid)) process.exitCode=2;
  } finally {
    try { await deadline(browser.close(), 10000, 'browser close'); }
    catch (e) { console.error('[large-empire] browser close timed out:', String(e)); browser.process()?.kill('SIGKILL'); }
    try { await deadline(new Promise(resolve=>server.close(resolve)), 5000, 'server close'); }
    catch (e) { console.error('[large-empire] server close timed out:', String(e)); }
    fs.rmSync(out,{recursive:true,force:true});
  }
}
if (process.env.STRESS_HARNESS_SELF_TEST === '1') {
  runHarnessSelfTest().catch(e=>{ console.error('[large-empire] SELF-TEST FAIL:',e.stack||e); process.exitCode=1; });
} else {
  main().catch(e=>{ console.error('[large-empire] FAIL:',e.stack||e); process.exitCode=1; });
}
