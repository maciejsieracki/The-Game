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
const exe = [process.env.CHROMIUM_PATH, (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium')].find(p => p && fs.existsSync(p));
const SEEDS = (process.env.BPM_SEEDS || '1,2,3').split(',').map(Number);
const MAX_MS = Number(process.env.BPM_MAX_MS || 400000);
const ATK = 'Hastati:8,Lucznik:6,Konnica:4';
const DEF = 'Hastati:14';

function mutPlugin(from, to = 'false') {
  return { name: 'bpm-mut', enforce: 'pre', transform(code, id) {
    return id.includes('battleScene.ts') ? { code: code.replace(from, to), map: null } : null;
  } };
}

async function run(mutation, seed) {
  const plugins = mutation ? [mutPlugin(mutation, mutation === '/*RESUME_AFTER_PLAN*/' ? 'done(); return;' : mutation === '/*RANGED_BFS_FALLBACK*/' ? '&& false' : 'false')] : [];
  const server = await createServer({ root, plugins, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message)); if (process.env.BPM_DEBUG) page.on('console', m => { const t = m.text(); if (t.startsWith('FMDBG')) console.log(t); });
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/battle-pursuit-pace-browser-entry.html?mode=skip&seed=${seed}&atk=${ATK}&def=${DEF}`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 60000 });
    await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 });
    const r = await page.evaluate(() => ({ result: window.__e2e.result, rows: window.__e2e.rows, moves: window.__e2e.moves, arb: window.__e2e.arb, callers: window.__e2e.callers, planTrace: window.__e2e.planTrace, attackLog: window.__e2e.attackLog, ends: window.__e2e.ends }));
    assert.deepEqual(errors, [], 'bledy strony: ' + errors.join('; '));
    return r;
  } finally { await browser.close(); await server.close(); }
}

/**
 * Klasyfikacja KONCA aktywacji na podstawie stanu sceny (sonda `ends`):
 *  'ok'      -- pula wykorzystana (moveLeft == 0),
 *  'arrived' -- po ciosie jednostka stoi przy nastepnym wrogu (drugiego ciosu nie ma),
 *  'blocked' -- TWARDA blokada fizyczna: zostal ruch, ale kazde pole przyległe jest zajete/nieprzechodnie albo wolne sa tylko pola,
 *               z ktorych jednostka juz przyszla w tej aktywacji (zawracanie = ping-pong), ALBO nie istnieje zadna sciezka do pozycji ciosu,
 *  'wasted'  -- zostal ruch, jest wolna droga, a jednostka stoi (MUSI obnizac miare).
 * `mutated=true` (mutacja miary): kazda niewykorzystana aktywacja liczy sie jako "zablokowana" -- test autentycznosci musi to wylapac.
 */
function classifyEnd(end, visited, mutated = false) {
  if (end.moveLeft <= 0) return 'ok';
  if (mutated) return 'blocked';
  // r6: wyjatki od reguly pelnego ruchu (doktryny Obrona/Ostrzal, uciekajacy) -- poza miara (decyzja ABC A, DODATEK 6).
  if (end.doctrineExempt) return 'exempt';
  if (end.struckRound && end.canStrike) return 'arrived';
  // r6: brak zywego wroga = nie ma dokad isc (DODATEK 5b); nie jest to 'zmarnowany' ruch.
  if (end.enemiesAlive === 0) return 'blocked';
  const freeNew = (end.freeCells || []).filter(c => !visited.has(c));
  if (freeNew.length === 0) return 'blocked';
  // r6: "wolna droga" = sciezka do wroga omijajaca pola tej aktywacji (zakaz ping-ponga, DODATEK 1 pkt 5); sonda: pathFreeVisited.
  if (!(end.pathFreeVisited ?? end.pathExists) && !end.canStrike) return 'blocked';
  return 'wasted';
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
  // wolna droga (miara T3 po decyzji wlasciciela 2026-11-15 "jesli jednostka po ciosie nie ma gdzie sie przemiescic, traci reszte ruchu"):
  // liczymy aktywacje konnicy, w ktorych jednostka MIALA mozliwosc ruchu, ale go nie wykorzystala. Z miary wypada WYLACZNIE
  // aktywacja, w ktorej stan SCENY na koncu aktywacji (sonda `ends`) dowodzi fizycznej blokady (classifyEnd) albo jednostka po
  // ciosie stoi przy nastepnym wrogu (nie ma drugiego ciosu). Pula i wykorzystanie liczone w punktach ruchu (mp - moveLeft).
  const endByAct = new Map();
  for (const e of r.ends || []) endByAct.set(e.round + '|' + e.id, e);
  const cellsByAct = new Map();
  for (const c of r.callers || []) { const k = c.round + '|' + c.id; if (!cellsByAct.has(k)) cellsByAct.set(k, new Set()); cellsByAct.get(k).add(c.col + ',' + c.row); }
  let freeSteps = 0; let freePool = 0; let allSteps = 0; let allPool = 0; let blockedActs = 0; let wastedActs = 0; let mutSensitive = 0;
  // r6 (zarzut 2 Evaluatora): osobny licznik dla piechoty i strzelcow (nie-konnica) atakujacych, tury 9-16 -- ta sama miara autentycznosci.
  let infActs = 0; let wastedInf = 0; let preLatch = 0; let exempt = 0;
  for (const row of r.rows) {
    if (row.side !== 'atk' || row.routed0 || !inWin(row)) continue;
    const isCav = !!row.mounted;
    const k = row.round + '|' + row.id;
    const end = endByAct.get(k);
    if (!end) continue;
    // r6: przed pierwszym zderzeniem wrecz (zatrzask nieaktywny) regula pelnego ruchu NIE obowiazuje (rowny tryb wejscia) -- poza miara.
    if (end.latched === false) { preLatch++; continue; }
    const used = row.mp - end.moveLeft;
    const visited = new Set([row.q0 + ',' + row.r0, ...(cellsByAct.get(k) || [])]);
    const cls = classifyEnd(end, visited);
    if (cls === 'exempt') { exempt++; continue; }
    if (!isCav) {
      if (cls !== 'blocked' && cls !== 'arrived') infActs++;
      if (cls === 'wasted') { wastedInf++; if (process.env.BPM_DEBUG) console.log('WASTED_INF', JSON.stringify({ k, mp: row.mp, end })); }
      continue;
    }
    allSteps += used; allPool += row.mp;
    // A6 (dane realne): mutacja miary (kazda niewykorzystana = zablokowana) zmienia werdykt w tej aktywacji?
    if (classifyEnd(end, visited, true) !== cls) mutSensitive++;
    if (cls === 'blocked') { blockedActs++; continue; }
    if (cls === 'arrived') continue;
    freeSteps += used; freePool += row.mp;
    if (cls === 'wasted') { wastedActs++; if (process.env.BPM_DEBUG) console.log('WASTED', JSON.stringify({ k, mp: row.mp, end, start: [row.q0, row.r0], cells: [...(cellsByAct.get(k) || [])] })); }
  }
  return { arbPathCav, pingpong, uniqueCells, freeSteps, freePool, freeRatio: freePool ? freeSteps / freePool : 1, allSteps, allPool, blockedActs, wastedActs, mutSensitive, infActs, wastedInf, preLatch, exempt, winner: r.result && r.result.winner };
}

/** Twardy test autentycznosci blokady (czysta funkcja, dane syntetyczne w ksztalcie sondy sceny). */
function authenticityChecks() {
  const boxed = { moveLeft: 5, freeCells: [], pathExists: false, canStrike: false, struckRound: true };
  const onlyBack = { moveLeft: 5, freeCells: ['10,10'], pathExists: true, canStrike: false, struckRound: true };
  const freeRoad = { moveLeft: 5, freeCells: ['11,10', '10,11'], pathExists: true, canStrike: false, struckRound: false };
  const noRoute = { moveLeft: 5, freeCells: ['11,10'], pathExists: false, canStrike: false, struckRound: true };
  const visited = new Set(['10,10']);
  const res = [];
  const t = (name, fn) => { try { fn(); res.push([name, true]); } catch (e) { res.push([name, false, e.message.split('\n')[0]]); } };
  t('A1 jednostka calkowicie otoczona = zablokowana', () => assert.equal(classifyEnd(boxed, visited), 'blocked'));
  t('A2 tylko pole, z ktorego przyszla = zablokowana', () => assert.equal(classifyEnd(onlyBack, visited), 'blocked'));
  t('A3 brak sciezki do pozycji ciosu = zablokowana', () => assert.equal(classifyEnd(noRoute, visited), 'blocked'));
  t('A4 jednostka z wolna droga, ktora stoi, NADAL obniza miare', () => assert.equal(classifyEnd(freeRoad, visited), 'wasted'));
  // r6 (zarzut 2 FC / diagnoza T5): wolne pole bez sciezki omijajacej slad aktywacji = blokada (zakaz ping-ponga); brak zywego wroga = brak dokad isc.
  t('A7 r6: wolne pole, ale brak sciezki omijajacej slad aktywacji = zablokowana', () => assert.equal(classifyEnd({ ...freeRoad, pathExists: true, pathFreeVisited: false }, visited), 'blocked'));
  t('A8 r6: brak zywego wroga przy wolnej drodze = zablokowana (nie ma dokad isc)', () => assert.equal(classifyEnd({ ...freeRoad, enemiesAlive: 0 }, visited), 'blocked'));
  t('A5 MUTACJA miary (kazda niewykorzystana = zablokowana) wykryta: A4 czerwony', () => assert.notEqual(classifyEnd(freeRoad, visited, true), 'wasted'));
  return res;
}

(async () => {
  const parts = process.env.BPM_PART ? [process.env.BPM_PART] : ['code', 'mutA', 'mutB', 'mutC', 'mutD'];
  const out = {};
  for (const p of parts) {
    const agg = { arbPathCav: 0, pingpong: 0, uniqueCells: 0, freeSteps: 0, freePool: 0, allSteps: 0, allPool: 0, blockedActs: 0, wastedActs: 0, mutSensitive: 0, infActs: 0, wastedInf: 0, preLatch: 0, exempt: 0 };
    for (const seed of SEEDS) {
      const m = metrics(await run(p === 'mutA' ? '/*PATH_RESERVE*/ true' : p === 'mutB' ? '/*CAV_TRAIL*/ ru.cavTrail?.has(nk)' : p === 'mutC' ? '/*RESUME_AFTER_PLAN*/' : p === 'mutD' ? '/*RANGED_BFS_FALLBACK*/' : null, seed));
      console.log(p, 'seed', seed, JSON.stringify(m));
      for (const k of Object.keys(agg)) agg[k] += m[k];
    }
    agg.freeRatio = agg.freePool ? agg.freeSteps / agg.freePool : 1;
    out[p] = agg;
    console.log(p, 'SUMA', JSON.stringify(agg));
  }
  const results = authenticityChecks().filter(x => x[0] !== 'A5 MUTACJA miary (kazda niewykorzystana = zablokowana) wykryta: A4 czerwony');
  const authMut = authenticityChecks().find(x => x[0].startsWith('A5'));
  const check = (name, fn) => { try { fn(); results.push([name, true]); } catch (e) { results.push([name, false, e.message.split('\n')[0]]); } };
  if (out.code) {
    const c = out.code;
    check('T1 arbitraz nie tnie planow konnicy (kolizja sciezek) w turach 9-16', () => assert.equal(c.arbPathCav, 0));
    check('T2 brak ping-pongu konnicy (unikalne pola == kroki w kazdej aktywacji)', () => assert.equal(c.pingpong, 0));
    check('T3 wolna droga: konnica wykonuje >= 80% puli', () => assert.ok(c.freePool > 0 && c.freeRatio >= 0.8, `freeRatio=${c.freeRatio.toFixed(3)} (${c.freeSteps}/${c.freePool})`));
    check('T4 (r5, zarzut 6 FC) zadna aktywacja konnicy z wolna droga nie konczy sie z niewykorzystana pula (wastedActs == 0 w 3 ziarnach, w tym ziarno 1 runda 12)', () => assert.equal(c.wastedActs, 0, 'wastedActs=' + c.wastedActs));
    check('A6 autentycznosc na DANYCH REALNEJ sceny: mutacja miary zmienia werdykt >= 1 aktywacji', () => assert.ok(c.mutSensitive > 0, 'mutSensitive=' + c.mutSensitive));
    check('T5 (r6, zarzut 2 FC/Evaluatora) piechota i strzelcy atakujacy: zadna aktywacja z wolna droga nie konczy sie z niewykorzystana pula (wastedInf == 0, 3 ziarna, tury 9-16)', () => assert.equal(c.wastedInf, 0, `wastedInf=${c.wastedInf} (aktywacji ocenionych ${c.infActs})`));
    check('T5b (r6) piechota: sa aktywacje ocenione (kontrola nie jest pusta)', () => assert.ok(c.infActs > 0, 'infActs=' + c.infActs));
  }
  const mutResults = [];
  if (authMut) mutResults.push(['MUTACJA miary T3 (kazda niewykorzystana = zablokowana) wykryta przez A4', authMut[1]]);
  if (out.mutA) mutResults.push(['MUTACJA PATH_RESERVE->false wykryta (T1 czerwony)', out.mutA.arbPathCav > 0]);
  if (out.mutB) mutResults.push(['MUTACJA CAV_TRAIL->false wykryta (T2 czerwony)', out.mutB.pingpong > 0]);
  if (out.mutC) mutResults.push(['MUTACJA RESUME_AFTER_PLAN->done() (stary blad r4) wykryta dla konnicy (T4 czerwony)', out.mutC.wastedActs > 0]);
  if (out.mutC) mutResults.push(['MUTACJA RESUME_AFTER_PLAN->done() wykryta dla piechoty/strzelcow (T5 czerwony, r6)', out.mutC.wastedInf > 0]);
  if (out.mutD) mutResults.push(['MUTACJA RANGED_BFS_FALLBACK->wylaczony (strzelec po zderzeniu traci ruch przy wolnej drodze) wykryta (T5 czerwony, Q2)', out.mutD.wastedInf > 0]);
  for (const [name, ok, msg] of results) console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ' -- ' + msg}`);
  for (const [name, ok] of mutResults) console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  const fail = results.filter(r => !r[1]).length + mutResults.filter(r => !r[1]).length;
  console.log(`=== battle-pursuit-move-behavior-test: ${results.length - results.filter(r => !r[1]).length}/${results.length} pass, mutacje wykryte ${mutResults.filter(r => r[1]).length}/${mutResults.length} ===`);
  if (fail > 0) process.exitCode = 1;
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
