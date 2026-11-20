'use strict';
/**
 * R-WEB-BATTLE-FULL-MOVE-THEN-STRIKE-AT-END-Q1 (runda 4): TEST REALNEJ BITWY AUTO (3D, Chromium, tryb Pomin) regul wlasciciela
 * z 2026-11-15 (DODATEK 4 + 5 + 5a + 5b):
 *   - do PIERWSZEGO zderzenia wrecz (zatrzask _meleeLatched) obowiazuje rowny tryb wejscia szeregu -- jednostka, ktora doszla do
 *     pozycji ciosu, NIE uderza na dojsciu (cios w nastepnej turze);
 *   - po zderzeniu: pelny ruch, cios przy dojsciu, reszta ruchu ku NASTEPNEJ jednostce wroga, JEDEN cios na jednostke na ture;
 *   - brak dokad isc po ciosie = reszta ruchu przepada (bez kompensacji).
 * Asercje na zdarzeniach realnego silnika (kolejnosc ruch/cios z licznika seq w sondzie battle-pursuit-pace-browser-entry.ts):
 *   (a) ruch => cios => ruch dalej istnieje dla piechoty i dla konnicy po zderzeniu,
 *   (b) max JEDEN cios na aktywacje (cala bitwa; piechota, konnica, strzelcy -- osobne liczniki),
 *   (c) przed pierwszym zderzeniem wrecz nie ma sekwencji ruch => cios (rowny tryb wejscia), po zderzeniu sa,
 *   (d) determinizm: to samo ziarno x3 => identyczny skrot zdarzen.
 * Mutacje (MUSZA zaczerwienic): M1 limit "jeden cios" usuniety (>1 cios na aktywacje), M2 regula wlaczona przed zderzeniem
 * (ruch=>cios przed zderzeniem), M3 brak ruchu po ciosie (stary blad r1: cios konczy aktywacje).
 *
 * Uruchom z gra/: node tools/battle-full-move-strike-test.cjs
 *   BFM_PART=code|mutA|mutB|mutC|det  (jeden przebieg)   BFM_SEEDS=1,2,3   BFM_MAX_MS=400000
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const exe = [process.env.CHROMIUM_PATH, (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium')].find(p => p && fs.existsSync(p));
const SEEDS = (process.env.BFM_SEEDS || '1,2,3').split(',').map(Number);
const MAX_MS = Number(process.env.BFM_MAX_MS || 400000);
const ATK = process.env.BFM_ATK || 'Hastati:8,Lucznik:6,Konnica:4';
const DEF = process.env.BFM_DEF || 'Hastati:14';

const MUTATIONS = {
  // M1: bez limitu "jeden cios na ture" (guard w _doAttack) + kontynuacja uderza ponownie przy nastepnym wrogu.
  mutA: [
    ['attacker.struckRound === this.roundNo) { done(); return; } // /*ONE_STRIKE*/', 'false) { done(); return; }'],
    ['/*CONT_REATTACK*/', 'this._doAttack(ru, c.e, done); return;'],
  ],
  // M2: regula "cios przy dojsciu" wlaczona takze PRZED pierwszym zderzeniem wrecz.
  mutB: [['!this._meleeLatched /*FULLMOVE_LATCH*/ ||', 'false ||']],
  // M3: cios konczy aktywacje (brak ruchu po ciosie).
  mutC: [['/*CONT_MOVE*/', 'done(); return;']],
};

function mutPlugin(pairs) {
  return { name: 'bfm-mut', enforce: 'pre', transform(code, id) {
    if (!id.includes('battleScene.ts')) return null;
    let out = code;
    for (const [from, to] of pairs) {
      assert.ok(out.includes(from), 'marker mutacji nie znaleziony: ' + from);
      out = out.replace(from, to);
    }
    return { code: out, map: null };
  } };
}

async function run(part, seed) {
  const plugins = MUTATIONS[part] ? [mutPlugin(MUTATIONS[part])] : [];
  const server = await createServer({ root, plugins, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/battle-pursuit-pace-browser-entry.html?mode=skip&seed=${seed}&atk=${ATK}&def=${DEF}`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 60000 });
    await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 });
    const r = await page.evaluate(() => ({ result: window.__e2e.result, rounds: window.__e2e.rounds, callers: window.__e2e.callers || [], attackLog: window.__e2e.attackLog || [], rows: window.__e2e.rows || [], ends: window.__e2e.ends || [] }));
    assert.deepEqual(errors, [], 'bledy strony: ' + errors.join('; '));
    return r;
  } finally { await browser.close(); await server.close(); }
}

/** Metryki zdarzen: aktywacja = (runda, id); zdarzenia uporzadkowane licznikiem seq. */
function metrics(r) {
  const firstContact = (r.rounds.find(x => x.contact0) || {}).round ?? Infinity;
  const acts = new Map();
  const push = (k, ev) => { if (!acts.has(k)) acts.set(k, []); acts.get(k).push(ev); };
  for (const c of r.callers) push(c.round + '|' + c.id, { t: 'move', seq: c.seq, round: c.round, mounted: c.mounted });
  for (const a of r.attackLog) push(a.round + '|' + a.id, { t: 'hit', seq: a.seq, round: a.round, mounted: a.mounted, ranged: a.ranged, nazwa: a.nazwa });
  const m = {
    firstContact, maxStrikesInf: 0, maxStrikesCav: 0, maxStrikesRanged: 0,
    msmInf: 0, msmCav: 0, preMoveThenHit: 0, preHitThenMove: 0, postMoveThenHit: 0, postHitThenMoveRanged: 0, doubleStrike: 0,
  };
  for (const [, evs] of acts) {
    evs.sort((x, y) => x.seq - y.seq);
    const hits = evs.filter(e => e.t === 'hit');
    const round = evs[0].round;
    const kind = hits[0] ? (hits[0].ranged ? 'Ranged' : hits[0].mounted ? 'Cav' : 'Inf') : '';
    if (hits.length > 1) m.doubleStrike++;
    if (kind) m['maxStrikes' + kind] = Math.max(m['maxStrikes' + kind], hits.length);
    const firstHit = evs.findIndex(e => e.t === 'hit');
    if (firstHit < 0) continue;
    const moveBefore = evs.slice(0, firstHit).some(e => e.t === 'move');
    const moveAfter = evs.slice(firstHit + 1).some(e => e.t === 'move');
    // Przed pierwszym zderzeniem wrecz ZADNA klasa nie rusza sie po ciosie (rowny tryb wejscia).
    if (moveAfter && round < firstContact) m.preHitThenMove++;
    if (hits[0].ranged) { if (moveAfter && round >= firstContact) m.postHitThenMoveRanged++; continue; }
    if (moveBefore) { if (round < firstContact) m.preMoveThenHit++; else m.postMoveThenHit++; }
    if (round >= firstContact && moveBefore && moveAfter) { if (hits[0].mounted) m.msmCav++; else m.msmInf++; }
  }
  // (a2) pelna pula ruchu (dane realne, sonda `rows`/`ends`): aktywacja po zderzeniu, w ktorej po ciosie byl ruch, konczy
  // z pula wykorzystana (moveLeft==0) albo fizyczna blokada stanu sceny (brak wolnego pola / brak sciezki / stoi przy wrogu).
  const endBy = new Map((r.ends || []).map(e => [e.round + '|' + e.id, e]));
  const mpBy = new Map((r.rows || []).filter(x => x.side === 'atk' || x.side === 'def').map(x => [x.round + '|' + x.id, x]));
  m.mpUsed = 0; m.mpPool = 0; m.mpUnexplained = 0; m.mpChecked = 0; m.unexplainedList = [];
  const cellsBy = new Map(); for (const c of r.callers) { const k = c.round + '|' + c.id; if (!cellsBy.has(k)) cellsBy.set(k, new Set()); cellsBy.get(k).add(c.col + ',' + c.row); }
  for (const [k, evs] of acts) {
    const e = endBy.get(k); const row = mpBy.get(k);
    const firstHit = evs.findIndex(x => x.t === 'hit');
    if (!e || !row || firstHit < 0 || evs[0].round < firstContact) continue;
    if (evs[firstHit].ranged || !evs.slice(firstHit + 1).some(x => x.t === 'move')) continue;
    m.mpChecked++; m.mpPool += row.mp; m.mpUsed += row.mp - e.moveLeft;
    // wolne pola liczone bez pol juz odwiedzonych w tej aktywacji (zawracanie = ping-pong, nie droga), jak classifyEnd w tescie T3
    const visited = new Set([row.q0 + ',' + row.r0, ...(cellsBy.get(k) || [])]);
    const freeNew = (e.freeCells || []).filter(c => !visited.has(c)).length;
    // postStrikeBlocked: silnik stwierdzil brak dokad isc po ciosie (brak wolnej sciezki do nastepnego wroga albo brak wrogow)
    const physBlock = freeNew === 0 || !e.pathExists || e.canStrike || e.postStrikeBlocked;
    if (e.moveLeft > 0 && !physBlock) { m.mpUnexplained++; m.unexplainedList.push({ k, ml: e.moveLeft, freeNew, pathExists: e.pathExists, canStrike: e.canStrike, psb: e.postStrikeBlocked, enemiesAlive: e.enemiesAlive, mp: row.mp, mounted: row.mounted, q: e.q, r: e.r, visited: [...visited] }); }
  }
  const hash = crypto.createHash('md5').update(JSON.stringify([
    r.callers.map(c => [c.round, c.id, c.col, c.row, c.seq]), r.attackLog.map(a => [a.round, a.id, a.target, a.seq]),
  ])).digest('hex');
  return { ...m, hash, winner: r.result && r.result.winner, rounds: r.result && r.result.round };
}

(async () => {
  const parts = process.env.BFM_PART ? [process.env.BFM_PART] : ['code', 'mutA', 'mutB', 'mutC', 'det'];
  const out = {};
  const sum = (o, p) => Object.keys(p).forEach(k => { if (typeof p[k] === "number") o[k] = k.startsWith('max') ? Math.max(o[k] ?? 0, p[k]) : (o[k] ?? 0) + p[k]; });
  for (const p of parts) {
    if (p === 'det') {
      const hashes = [];
      for (let i = 0; i < 3; i++) { const m = metrics(await run('code', SEEDS[0])); hashes.push(m.hash); console.log('det run', i, m.hash); }
      out.det = hashes;
      continue;
    }
    const agg = {};
    const seeds = p === 'code' ? SEEDS : [SEEDS[0]];
    for (const seed of seeds) {
      const m = metrics(await run(p, seed));
      console.log(p, 'seed', seed, JSON.stringify(m));
      sum(agg, m);
    }
    out[p] = agg;
    console.log(p, 'SUMA', JSON.stringify(agg));
  }
  const results = [];
  const check = (name, fn) => { try { fn(); results.push([name, true]); } catch (e) { results.push([name, false, e.message.split('\n')[0]]); } };
  if (out.code) {
    const c = out.code;
    check('(a) piechota: ruch => cios => ruch dalej po zderzeniu', () => assert.ok(c.msmInf > 0, 'msmInf=' + c.msmInf));
    check('(a) konnica: ruch => cios => ruch dalej po zderzeniu', () => assert.ok(c.msmCav > 0, 'msmCav=' + c.msmCav));
    check('(b) max JEDEN cios na aktywacje (piechota/konnica/strzelcy)', () => {
      assert.equal(c.doubleStrike, 0, 'aktywacje z >1 ciosem: ' + c.doubleStrike);
      assert.ok(c.maxStrikesInf <= 1 && c.maxStrikesCav <= 1 && c.maxStrikesRanged <= 1);
    });
    check('(a) strzelcy: ruch po strzale po zderzeniu (kontynuacja, nie koniec aktywacji)', () => assert.ok(c.postHitThenMoveRanged > 0, 'postHitThenMoveRanged=' + c.postHitThenMoveRanged));
    check('(a2) pelna pula ruchu po ciosie: kazda aktywacja z ruchem po ciosie zuzywa pule albo ma fizyczna blokade (dane realne)', () => assert.equal(c.mpUnexplained, 0, `mpUnexplained=${c.mpUnexplained} (zuzyto ${c.mpUsed}/${c.mpPool} MP, aktywacji ${c.mpChecked})`));
    check('(c) przed pierwszym zderzeniem brak sekwencji ruch => cios (wrecz) i cios => ruch (kazda klasa)', () => assert.equal(c.preMoveThenHit + c.preHitThenMove, 0, 'pre=' + (c.preMoveThenHit + c.preHitThenMove)));
    check('(c) po zderzeniu jest cios na dojsciu (ruch => cios)', () => assert.ok(c.postMoveThenHit > 0, 'postMoveThenHit=' + c.postMoveThenHit));
  }
  const mutResults = [];
  if (out.mutA) mutResults.push(['MUTACJA M1 (bez limitu "jeden cios") wykryta: >1 cios na aktywacje', out.mutA.doubleStrike > 0]);
  if (out.mutB) mutResults.push(['MUTACJA M2 (regula przed zderzeniem) wykryta: ruch => cios przed zderzeniem', out.mutB.preMoveThenHit + out.mutB.preHitThenMove > 0]);
  if (out.mutC) mutResults.push(['MUTACJA M3 (cios konczy aktywacje) wykryta: brak ruch => cios => ruch', out.mutC.msmInf + out.mutC.msmCav === 0]);
  if (out.mutC) mutResults.push(['MUTACJA M3 wykryta takze dla strzelcow: brak ruchu po strzale', out.mutC.postHitThenMoveRanged === 0]);
  if (out.det) check('(d) determinizm: to samo ziarno x3 => identyczny skrot zdarzen', () => { assert.equal(out.det[0], out.det[1]); assert.equal(out.det[1], out.det[2]); });
  for (const [name, ok, msg] of results) console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ' -- ' + msg}`);
  for (const [name, ok] of mutResults) console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  const fail = results.filter(r => !r[1]).length + mutResults.filter(r => !r[1]).length;
  console.log(`=== battle-full-move-strike-test: ${results.length - results.filter(r => !r[1]).length}/${results.length} pass, mutacje wykryte ${mutResults.filter(r => r[1]).length}/${mutResults.length} ===`);
  if (fail > 0) process.exitCode = 1;
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
