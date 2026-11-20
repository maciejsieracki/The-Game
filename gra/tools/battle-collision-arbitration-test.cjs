'use strict';
/**
 * R-WEB-BATTLE-COLLISION-ARBITRATION-INFANTRY-FIRST-Q1: arbitraz kolizji o pole w ruchu bitewnym (AUTO/SKIP):
 * PIECHOTA ma pierwszenstwo, LUCZNIK/PROCARZ ustepuje; ten sam typ => mniejsze ID; konnica/rydwany/machiny bez zmian;
 * bez zamiany miejscami i bez ping-ponga; determinizm.
 *
 * Czesc P (czysty arbitraz fali: autoBatchPhase.ts): scenariusze kolizji o to samo wolne pole.
 * Czesc L (prawdziwa bitwa 3D w Chromium, tryb Pomin, sonda battle-pursuit-pace-browser-entry.ts): zdarzenia arbitrazu realnego ticka
 *   -- piechota nigdy nie ustepuje lucznikowi, ten sam typ => mniejsze ID, brak swapow, ping-pong, determinizm x3 (skrot zdarzen).
 * Mutacja (MUSI zaczerwienic): mutRev = odwrocony priorytet (lucznik przed piechota) w znaczniku ARB_PRIORITY.
 *
 * Uruchom z gra/: node tools/battle-collision-arbitration-test.cjs
 *   BCA_PART=pure|live|mutRev|det (domyslnie: wszystkie)  BCA_SEEDS=1,2,3  BCA_MAX_MS=400000  BCA_ATK=Lucznik:8,Hastati:6  BCA_DEF=Hastati:6,Lucznik:6
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const SEEDS = (process.env.BCA_SEEDS || '1,2,3').split(',').map(Number);
const MAX_MS = Number(process.env.BCA_MAX_MS || 400000);
const ATK = process.env.BCA_ATK || 'Lucznik:8,Hastati:6';
const DEF = process.env.BCA_DEF || 'Hastati:6,Lucznik:6';
const PART = process.env.BCA_PART || 'all';
const MODE = process.env.BCA_MODE || 'watch'; // AUTO (ffEnterAuto); 'skip' = tryb Pomin (nie dowod AUTO)
const MARK = "const ca = a.arbClass === 'infantry' ? 0 : 1; // /*ARB_PRIORITY*/";
const MARK_B = "const cb = b.arbClass === 'infantry' ? 0 : 1;";
const BASE = [['const ARB_ENABLED = true;', 'const ARB_ENABLED = false;']];
const REV = [[MARK, "const ca = a.arbClass === 'infantry' ? 1 : 0; // /*ARB_PRIORITY*/"], [MARK_B, "const cb = b.arbClass === 'infantry' ? 1 : 0;"]];

let pass = 0, fail = 0;
let quiet = false;
function check(cond, msg) { if (quiet) return; if (cond) { pass++; console.log('  ok   ' + msg); } else { fail++; console.log('  FAIL ' + msg); } }

function loadHelper(mutate) {
  let src = fs.readFileSync(path.join(root, 'src/battle/autoBatchPhase.ts'), 'utf8');
  if (mutate) for (const [from, to] of REV) { assert.ok(src.includes(from), 'marker mutacji nie znaleziony: ' + from); src = src.replace(from, to); }
  const ts = require(path.join(root, 'node_modules', 'typescript'));
  const out = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, strict: true } });
  const m = { exports: {} };
  vm.runInNewContext(out.outputText, { module: m, exports: m.exports, require, console }, { filename: 'autoBatchPhase.ts' });
  return m.exports;
}

/** Czesc P: kolizja o to samo wolne pole, rozne konfiguracje rosteru. Zwraca liczbe naruszen (0 = regula spelniona). */
function pureScenarios(mutate) {
  const h = loadHelper(mutate);
  const mv = (id, side, steps) => ({ unitId: id, side, kind: 'move', steps });
  const claim = (res, id) => res.find(r => r.unitId === id);
  let bad = 0;
  const expectWinner = (label, units, intents, winner, loser) => {
    const res = h.resolveAutoBatchPhase('atk', units, intents);
    const w = claim(res, winner), l = claim(res, loser);
    const ok = w.blocked === false && w.steps.length === 1 && l.blocked === true && l.steps.length === 0;
    check(ok, `${label}: wchodzi ${winner}, ustepuje ${loser} (wchodzacy ${w.steps.length} krok, ustepujacy ${l.steps.length} krokow, blocked=${l.blocked})`);
    if (!ok) bad++;
    check(res.map(r => r.unitId).join(',') === units.filter(u => u.side === 'atk').map(u => u.id).join(','), `${label}: kolejnosc wyniku = kolejnosc rosteru (${res.map(r => r.unitId).join(',')})`);
  };
  const cell = [{ col: 1, row: 1 }];
  expectWinner('A lucznik(roster 1.) vs piechota',
    [{ id: 'atk-1', side: 'atk', q: 0, r: 1, arbClass: 'ranged' }, { id: 'atk-2', side: 'atk', q: 1, r: 0, arbClass: 'infantry' }, { id: 'def-1', side: 'def', q: 5, r: 0, arbClass: 'infantry' }],
    [mv('atk-1', 'atk', cell), mv('atk-2', 'atk', cell)], 'atk-2', 'atk-1');
  expectWinner('B piechota(roster 1.) vs lucznik',
    [{ id: 'atk-1', side: 'atk', q: 0, r: 1, arbClass: 'infantry' }, { id: 'atk-2', side: 'atk', q: 1, r: 0, arbClass: 'ranged' }, { id: 'def-1', side: 'def', q: 5, r: 0, arbClass: 'infantry' }],
    [mv('atk-1', 'atk', cell), mv('atk-2', 'atk', cell)], 'atk-1', 'atk-2');
  expectWinner('C piechota=piechota, mniejsze ID (atk-2 < atk-10)',
    [{ id: 'atk-10', side: 'atk', q: 0, r: 1, arbClass: 'infantry' }, { id: 'atk-2', side: 'atk', q: 1, r: 0, arbClass: 'infantry' }, { id: 'def-1', side: 'def', q: 5, r: 0, arbClass: 'infantry' }],
    [mv('atk-10', 'atk', cell), mv('atk-2', 'atk', cell)], 'atk-2', 'atk-10');
  expectWinner('D lucznik=lucznik, mniejsze ID (atk-3 < atk-7)',
    [{ id: 'atk-7', side: 'atk', q: 0, r: 1, arbClass: 'ranged' }, { id: 'atk-3', side: 'atk', q: 1, r: 0, arbClass: 'ranged' }, { id: 'def-1', side: 'def', q: 5, r: 0, arbClass: 'infantry' }],
    [mv('atk-7', 'atk', cell), mv('atk-3', 'atk', cell)], 'atk-3', 'atk-7');
  expectWinner('E konnica(roster 1.) vs piechota -- regula konnicy bez zmian',
    [{ id: 'atk-1', side: 'atk', q: 0, r: 1, arbClass: 'other' }, { id: 'atk-2', side: 'atk', q: 1, r: 0, arbClass: 'infantry' }, { id: 'def-1', side: 'def', q: 5, r: 0, arbClass: 'infantry' }],
    [mv('atk-1', 'atk', cell), mv('atk-2', 'atk', cell)], 'atk-1', 'atk-2');
  // brak zamiany miejscami: pola zajete na starcie fazy sa twardymi barierami
  const swapRes = h.resolveAutoBatchPhase('atk',
    [{ id: 'atk-1', side: 'atk', q: 0, r: 0, arbClass: 'infantry' }, { id: 'atk-2', side: 'atk', q: 1, r: 0, arbClass: 'ranged' }, { id: 'def-1', side: 'def', q: 5, r: 0, arbClass: 'infantry' }],
    [mv('atk-1', 'atk', [{ col: 1, row: 0 }]), mv('atk-2', 'atk', [{ col: 0, row: 0 }])]);
  const swapped = swapRes.every(r => r.steps.length === 0 && r.blocked === true);
  check(swapped, 'F zamiana miejscami (A<->B) odrzucona: obie jednostki zablokowane');
  if (!swapped) bad++;
  const sig = () => JSON.stringify(h.resolveAutoBatchPhase('atk',
    [{ id: 'atk-1', side: 'atk', q: 0, r: 1, arbClass: 'ranged' }, { id: 'atk-2', side: 'atk', q: 1, r: 0, arbClass: 'infantry' }, { id: 'atk-3', side: 'atk', q: 2, r: 1, arbClass: 'infantry' }],
    [mv('atk-1', 'atk', cell), mv('atk-2', 'atk', cell), mv('atk-3', 'atk', cell)]));
  const s1 = sig(), s2 = sig(), s3 = sig();
  check(s1 === s2 && s2 === s3, 'G determinizm czystego arbitrazu x3');
  const winner = JSON.parse(s1).find(r => !r.blocked && r.steps.length === 1);
  const okH = winner && winner.unitId === 'atk-2';
  check(okH, `H trzech chetnych (lucznik atk-1, piechota atk-2, atk-3): wchodzi piechota o mniejszym ID (${winner && winner.unitId})`);
  if (!okH) bad++;
  return bad;
}

async function liveRun(seed, mutate, pairs) {
  const MUT = pairs || REV;
  const { chromium } = require('playwright');
  const { createServer } = require('vite');
  const exe = [process.env.CHROMIUM_PATH, (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium')].find(p => p && fs.existsSync(p));
  const plugins = mutate ? [{ name: 'bca-mut', enforce: 'pre', transform(code, id) {
    if (!id.endsWith('autoBatchPhase.ts')) return null;
    let out = code;
    for (const [from, to] of MUT) { assert.ok(out.includes(from), 'marker mutacji nie znaleziony: ' + from); out = out.replace(from, to); }
    return { code: out, map: null };
  } }] : [];
  const server = await createServer({ root, plugins, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/battle-pursuit-pace-browser-entry.html?mode=${MODE}&seed=${seed}&atk=${ATK}&def=${DEF}`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 60000 });
    await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 });
    const r = await page.evaluate(() => ({ result: window.__e2e.result, arb: window.__e2e.arb || [], pos: window.__e2e.pos || [], contest: window.__e2e.contest || [] }));
    assert.deepEqual(errors, [], 'bledy strony: ' + errors.join('; '));
    return r;
  } finally { await browser.close(); await server.close(); }
}

const idNum = id => { const m = String(id).match(/(\d+)$/); return m ? Number(m[1]) : 0; };
function liveMetrics(r) {
  const ct = r.contest;
  const infVsRng = ct.filter(e => e.loserCls === 'infantry' && e.winnerCls === 'ranged');   // NARUSZENIE: piechota ustapila lucznikowi
  const rngVsInf = ct.filter(e => e.loserCls === 'ranged' && e.winnerCls === 'infantry');   // zgodne z regula
  const same = ct.filter(e => e.loserCls === e.winnerCls && (e.loserCls === 'infantry' || e.loserCls === 'ranged'));
  const sameBad = same.filter(e => idNum(e.loser) < idNum(e.winner));
  const pathEv = ct;
  const snaps = r.pos.filter(p => p.round <= 30);
  let swaps = 0, pingpong = 0;
  for (let i = 1; i < snaps.length; i++) {
    const a = snaps[i - 1].snap, b = snaps[i].snap;
    const moved = Object.keys(b).filter(id => a[id] && a[id] !== b[id]);
    const byOld = new Map(moved.map(id => [a[id], id]));
    for (const id of moved) { const other = byOld.get(b[id]); if (other && other !== id && b[other] === a[id] && id < other) swaps++; }
  }
  const ids = new Set(); snaps.forEach(s => Object.keys(s.snap).forEach(i => ids.add(i)));
  const yielders = new Set(ct.map(e => e.loser));
  let pingpongAll = 0;
  for (const id of ids) {
    let prev2 = null, prev1 = null;
    for (const s of snaps) {
      const p = s.snap[id]; if (!p) { prev2 = prev1 = null; continue; }
      if (prev1 !== null && prev2 !== null && p === prev2 && prev1 !== p) { pingpongAll++; if (yielders.has(id)) pingpong++; (r.__pp ??= []).push(`${id}@r${s.round}${s.side} ${prev2}->${prev1}->${p}`); }
      if (prev1 !== p) { prev2 = prev1; prev1 = p; }
    }
  }
  const digest = crypto.createHash('md5').update(JSON.stringify([r.contest, r.pos, r.result && r.result.winner, r.result && r.result.round])).digest('hex');
  return { path: pathEv.length, infVsRng: infVsRng.length, rngVsInf: rngVsInf.length, same: same.length, sameBad: sameBad.length, swaps, pingpong, pingpongAll, yielders: yielders.size, digest, rounds: r.result && r.result.round, winner: r.result && r.result.winner, snaps: snaps.length, ppDetail: r.__pp || [] };
}

(async () => {
  const run = p => PART === 'all' || PART === p;
  if (run('pure')) {
    console.log('== Czesc P: czysty arbitraz fali ==');
    check(pureScenarios(false) === 0, 'P: wszystkie scenariusze czystego arbitrazu zgodne z regula');
  }
  if (run('live')) {
    console.log('== Czesc L: prawdziwa bitwa AUTO/SKIP (Chromium) ==');
    let totalRngVsInf = 0;
    for (const seed of SEEDS) {
      const m = liveMetrics(await liveRun(seed, false));
      console.log('  seed', seed, JSON.stringify(m));
      check(m.infVsRng === 0, `seed ${seed}: piechota nigdy nie ustepuje lucznikowi o pole (naruszen ${m.infVsRng})`);
      console.log(`  info seed ${seed}: kolizje lucznik->piechota ZMIERZONO ${m.rngVsInf}, ten sam typ ${m.same}`);
      totalRngVsInf += m.rngVsInf;
      check(m.sameBad === 0, `seed ${seed}: ten sam typ => mniejsze ID wygrywa (naruszen ${m.sameBad})`);
      check(m.swaps === 0, `seed ${seed}: brak zamiany miejscami (swapow ${m.swaps})`);
      // Ping-pong A->B->A: arbitraz NIE moze go zwiekszyc wzgledem bazy (ta sama bitwa bez arbitrazu). Zjawisko jostle linii styku istnieje na bazie (ZMIERZONO).
      if (process.env.BCA_NOBASE) { totalRngVsInf += 0; continue; }
      const mb = liveMetrics(await liveRun(seed, true, BASE));
      console.log(`  info seed ${seed}: BASE (bez arbitrazu) pingpong jednostek ustepujacych ${mb.pingpong}, wszystkich ${mb.pingpongAll}; z arbitrazem ${m.pingpong}/${m.pingpongAll}`);
      check(m.pingpong <= mb.pingpong && m.pingpongAll <= mb.pingpongAll, `seed ${seed}: arbitraz nie zwieksza ping-ponga A->B->A w 30 rundach (z arbitrazem ${m.pingpong}/${m.pingpongAll} <= baza ${mb.pingpong}/${mb.pingpongAll})`);
    }
    check(totalRngVsInf > 0, `scenariusz generuje realne kolizje lucznik->piechota (ZMIERZONO lacznie ${totalRngVsInf} > 0 na ziarnach ${SEEDS.join(',')})`);
  }
  if (run('det')) {
    console.log('== Determinizm: to samo ziarno x3 ==');
    const sigs = [];
    for (let i = 0; i < 3; i++) { const mm = liveMetrics(process.env.BCA_DET_BASE ? await liveRun(SEEDS[0], true, BASE) : await liveRun(SEEDS[0], false)); console.log('  run', i + 1, JSON.stringify({ ...mm, ppDetail: undefined })); sigs.push(mm.digest); }
    check(sigs[0] === sigs[1] && sigs[1] === sigs[2], `skrot zdarzen identyczny x3 (${sigs.join(' ')})`);
  }
  if (PART === 'base') {
    const m = liveMetrics(await liveRun(SEEDS[0], true, BASE));
    console.log('  BASE (bez arbitrazu piechota-pierwsza)', JSON.stringify(m));
  }
  if (run('mutRev')) {
    console.log('== Mutacja: odwrocony priorytet (musi byc CZERWONO) ==');
    quiet = true; const bad = pureScenarios(true); quiet = false;
    check(bad > 0, `czysty arbitraz z odwroconym priorytetem czerwienieje (naruszen ${bad})`);
    const m = liveMetrics(await liveRun(SEEDS[0], true));
    console.log('  mutRev live', JSON.stringify(m));
    check(m.infVsRng > 0, `live z odwroconym priorytetem: piechota ustepuje lucznikowi (${m.infVsRng} > 0)`);
  }
  console.log(`\nWYNIK: ${pass} ok, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
