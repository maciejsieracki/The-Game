'use strict';
/**
 * R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1 (r3): TEST BEHAWIORALNY ruchu zwyciezcow na REALNEJ sciezce
 * AUTO (_snapshotAutoBatchIntents -> resolveAutoBatchPhase -> _resolveAutoBatchMovement) w prawdziwej bitwie 3D (Chromium).
 *
 * Scenariusz: mieszana armia (Hastati:8, Lucznik:6, Konnica:4) vs Hastati:14, ziarno 3, Pomin (skip), tury 9-16, strona atakujaca
 * (wygrywa, wrog rozbity i ucieka). Dla KONNICY (7 MP) sprawdza:
 *  (T1) arbitraz NIE ucina planow konnicy przez kolizje sciezek z wlasnymi jednostkami (arb kind=path, tury 9-16) == 0;
 *  (T2) brak ping-pongu: w zadnej aktywacji konnica nie odwiedza dwa razy tego samego pola (unikalne pola == kroki);
 *  (T3) "wolna droga": w aktywacjach, w ktorych konnica NIE zadala ciosu i NIE skonczyla w zasiegu ciosu przy rozbitym wrogu
 *       (plan_end can=true -- osobna decyzja produktowa A/B/C), wykonane kroki / pula >= 80% (suma po ziarnach).
 * Mutacje (MUSZA zaczerwienic): PATH_RESERVE -> false (przywraca ucinanie planow: T1 czerwony), CAV_TRAIL -> false
 * (przywraca ping-pong: T2 czerwony).
 *
 * Uruchom z gra/: node tools/battle-pursuit-move-behavior-test.cjs            (kod + 2 mutacje, ~3 przebiegi Chromium)
 *   BPM_PART=code|mutA|mutB  -- tylko jeden przebieg (przy obciazonej maszynie).  BPM_SEEDS=1,2  BPM_MAX_MS=400000
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const exe = [process.env.CHROMIUM_PATH, '/usr/bin/chromium'].find(p => p && fs.existsSync(p));
const SEEDS = (process.env.BPM_SEEDS || '1,2').split(',').map(Number);
const MAX_MS = Number(process.env.BPM_MAX_MS || 400000);
const ATK = 'Hastati:8,Lucznik:6,Konnica:4';
const DEF = 'Hastati:14';

function mutPlugin(from) {
  return { name: 'bpm-mut', enforce: 'pre', transform(code, id) {
    return id.includes('battleScene.ts') ? { code: code.replace(from, 'false'), map: null } : null;
  } };
}

async function run(mutation, seed) {
  const plugins = mutation ? [mutPlugin(mutation)] : [];
  const server = await createServer({ root, plugins, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/battle-pursuit-pace-browser-entry.html?mode=skip&seed=${seed}&atk=${ATK}&def=${DEF}`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 60000 });
    await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 });
    const r = await page.evaluate(() => ({ result: window.__e2e.result, rows: window.__e2e.rows, moves: window.__e2e.moves, arb: window.__e2e.arb, callers: window.__e2e.callers, planTrace: window.__e2e.planTrace, attackLog: window.__e2e.attackLog }));
    assert.deepEqual(errors, [], 'bledy strony: ' + errors.join('; '));
    return r;
  } finally { await browser.close(); await server.close(); }
}

/** Metryki konnicy atakujacej, tury 9-16. */
function metrics(r) {
  const inWin = x => x.round >= 9 && x.round <= 16;
  const arbPathCav = (r.arb || []).filter(a => a.mounted && inWin(a) && a.finalBlocked && a.kind === 'path').length;
  // ping-pong z faktycznie wykonanych krokow
  const byAct = new Map();
  for (const c of r.callers || []) {
    if (!c.mounted || !inWin(c)) continue;
    const k = c.round + '|' + c.id;
    if (!byAct.has(k)) byAct.set(k, []);
    byAct.get(k).push(c.col + ',' + c.row);
  }
  let pingpong = 0; let uniqueCells = 0;
  for (const cells of byAct.values()) { const u = new Set(cells).size; uniqueCells += u; if (u < cells.length) pingpong++; }
  // wolna droga: aktywacje konnicy, w ktorych (a) jednostka NIE zadala ciosu, (b) NIE skonczyla w zasiegu ciosu przy rozbitym wrogu
  // (plan_end can=true -- osobna decyzja produktowa A/B/C) (aktywacje z cala pula wykorzystana licza sie jako wolna droga). Kroki liczone z faktycznie wykonanych _doMove (callers), bo wiersz rundy przesuwa pierwszy krok do poprzedniej.
  const steps = new Map();
  for (const c of r.callers || []) { const k = c.round + '|' + c.id; steps.set(k, (steps.get(k) || 0) + 1); }
  const attacked = new Set((r.attackLog || []).map(a => a.round + '|' + a.id));
  let freeSteps = 0; let freePool = 0; let allSteps = 0; let allPool = 0;
  for (const row of r.rows) {
    if (row.side !== 'atk' || !row.mounted || row.routed0 || !inWin(row)) continue;
    const k = row.round + '|' + row.id;
    const st = steps.get(k) || 0;
    const ends = r.moves.filter(m => m.round === row.round && m.id === row.id && m.reason === 'plan_end');
    const stopsAtBlow = ends.some(m => /can=true/.test(m.adjInfo));
    allSteps += st; allPool += row.mp;
    if (!stopsAtBlow && !attacked.has(k)) { freeSteps += st; freePool += row.mp; }
  }
  return { arbPathCav, pingpong, uniqueCells, freeSteps, freePool, freeRatio: freePool ? freeSteps / freePool : 1, allSteps, allPool, winner: r.result && r.result.winner };
}

(async () => {
  const parts = process.env.BPM_PART ? [process.env.BPM_PART] : ['code', 'mutA', 'mutB'];
  const out = {};
  for (const p of parts) {
    const agg = { arbPathCav: 0, pingpong: 0, uniqueCells: 0, freeSteps: 0, freePool: 0, allSteps: 0, allPool: 0 };
    for (const seed of SEEDS) {
      const m = metrics(await run(p === 'mutA' ? '/*PATH_RESERVE*/ true' : p === 'mutB' ? '/*CAV_TRAIL*/ ru.cavTrail?.has(nk)' : null, seed));
      console.log(p, 'seed', seed, JSON.stringify(m));
      for (const k of Object.keys(agg)) agg[k] += m[k];
    }
    agg.freeRatio = agg.freePool ? agg.freeSteps / agg.freePool : 1;
    out[p] = agg;
    console.log(p, 'SUMA', JSON.stringify(agg));
  }
  const results = [];
  const check = (name, fn) => { try { fn(); results.push([name, true]); } catch (e) { results.push([name, false, e.message.split('\n')[0]]); } };
  if (out.code) {
    const c = out.code;
    check('T1 arbitraz nie tnie planow konnicy (kolizja sciezek) w turach 9-16', () => assert.equal(c.arbPathCav, 0));
    check('T2 brak ping-pongu konnicy (unikalne pola == kroki w kazdej aktywacji)', () => assert.equal(c.pingpong, 0));
    check('T3 wolna droga: konnica wykonuje >= 80% puli', () => assert.ok(c.freePool > 0 && c.freeRatio >= 0.8, `freeRatio=${c.freeRatio.toFixed(3)} (${c.freeSteps}/${c.freePool})`));
  }
  const mutResults = [];
  if (out.mutA) mutResults.push(['MUTACJA PATH_RESERVE->false wykryta (T1 czerwony)', out.mutA.arbPathCav > 0]);
  if (out.mutB) mutResults.push(['MUTACJA CAV_TRAIL->false wykryta (T2 czerwony)', out.mutB.pingpong > 0]);
  for (const [name, ok, msg] of results) console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ' -- ' + msg}`);
  for (const [name, ok] of mutResults) console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  const fail = results.filter(r => !r[1]).length + mutResults.filter(r => !r[1]).length;
  console.log(`=== battle-pursuit-move-behavior-test: ${results.length - results.filter(r => !r[1]).length}/${results.length} pass, mutacje wykryte ${mutResults.filter(r => r[1]).length}/${mutResults.length} ===`);
  if (fail > 0) process.exitCode = 1;
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
