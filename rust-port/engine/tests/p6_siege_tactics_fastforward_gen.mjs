// P6 SIEGE-TAKTYKA K5j: generator wektorow `_runFastForward` przez WYKONANIE tekstu pinu
// (gra/src/battle/battleScene.ts, pin 07d2fbd72). Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_fastforward_gen.mjs
// (Node >= 22.13, module.stripTypeScriptTypes).
//
// Wycinane z pinu i wykonywane bez recznej kopii logiki: _raf (9400-), _runFastForward (9415-9437),
// _roundCapVerdict (9449-), _ffRoundCapResult (9485-9497), _scaledWallDelta (9512-9515), _schedule (9595-9606),
// _drainTimers (9616-9634). Stale: BATTLE_FRAME_WALL_MS = 16 (:2552), BATTLE_FRAME_MAX_WALL_DELTA_MS = 100 (:2553),
// FF_MAX_ROUNDS = 400 (:1125).
//
// JEDYNA zmiana tekstu pinu: budzet czasu sciennego `performance.now() - wall0 < 40` zastepowany jawnym limitem
// krokow `__steps++ < __maxSteps` (asercja: dokladnie jedno trafienie). Reszta tekstu pinu bez zmian.
// Stuby (efekty sceny, nie logika gry): _ffEnterAuto, _tickProjectiles, _tickFades, _finishDraw, _showEndScreen,
// _armyMoraleRatio, _battleUnitsForMapExport, callbacki timerow i kolejki (`fire` / `fireq` wg tabeli `spawn`).
//
// Zdarzenia zapisywane w `ev` (kolejnosc wykonania): enter, tp:<vNow>, tf:<vNow>, fire:<tok>, q:<tok>, draw, end:<zwyciezca>.
// Liczba iteracji = liczba zdarzen `tp:`. Powod zakonczenia: `end:`/`draw` -> roundcap; `finished` -> finished; inaczej steplimit.
//
// Straznik zrodla: SHA-256 wycietych fragmentow (FF_FRAGMENT_SHA256).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/battleScene.ts';
const FF_FRAGMENT_SHA256 = '33acbaf434c88db52b5d0cd5b6ae0a183a07e96d89bea53ac16f4c306680f676';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const pinLines = execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');
const LINE = (n) => pinLines[n - 1];

function expectLine(n, re) {
  if (!re.test(LINE(n))) throw new Error(`pin ${n}: oczekiwano ${re}, jest: ${LINE(n)}`);
}
function findLine(a, b, re) {
  const hits = [];
  for (let n = a; n <= b; n++) if (re.test(LINE(n))) hits.push(n);
  if (hits.length !== 1) throw new Error(`pin ${a}-${b}: ${re} trafien ${hits.length}`);
  return hits[0];
}
// Metoda od linii startowej do pierwszej linii `  }` (zamkniecie metody na poziomie klasy).
function methodRange(startLine) {
  let n = startLine;
  while (!/^  \}$/.test(LINE(n))) n++;
  return [startLine, n];
}

expectLine(1125, /^const FF_MAX_ROUNDS = 400;$/);
expectLine(2552, /^  private static readonly BATTLE_FRAME_WALL_MS = 16;$/);
expectLine(2553, /^  private static readonly BATTLE_FRAME_MAX_WALL_DELTA_MS = 100;$/);

const rafLine = findLine(9400, 9410, /^  private _raf\(cb: \(\) => void\): void \{$/);
const ffLine = findLine(9410, 9420, /^  private _runFastForward\(\): void \{$/);
const rcLine = findLine(9440, 9455, /^  private _roundCapVerdict\(\): .* \| null \{$/);
const ffResLine = findLine(9480, 9490, /^  private _ffRoundCapResult\(\): void \{$/);
const scaledLine = findLine(9505, 9520, /^  private _scaledWallDelta\(wallDelta: number\): number \{$/);
const schedLine = findLine(9585, 9600, /^  private _schedule\(ms: number, cb: \(\) => void\): void \{$/);
const drainLine = findLine(9610, 9620, /^  private _drainTimers\(\): void \{$/);

const nowLine = findLine(9380, 9420, /^  private _now\(\): number \{ return this\.vNow; \}$/);

const ranges = {
  raf: methodRange(rafLine),
  ff: methodRange(ffLine),
  rc: methodRange(rcLine),
  ffRes: methodRange(ffResLine),
  scaled: methodRange(scaledLine),
  sched: methodRange(schedLine),
  drain: methodRange(drainLine),
};
for (const [k, [, b]] of Object.entries(ranges)) expectLine(b, /^  \}$/);

const frag = (k) => pinLines.slice(ranges[k][0] - 1, ranges[k][1]);
const fragmentText = ['raf', 'ff', 'rc', 'ffRes', 'scaled', 'sched', 'drain'].map((k) => frag(k).join('\n'));
const fragmentDigest = createHash('sha256').update(fragmentText.join('\n---\n')).digest('hex');
if (FF_FRAGMENT_SHA256 !== 'PLACEHOLDER' && fragmentDigest !== FF_FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu nie zgadzaja sie z hashem: ${fragmentDigest}`);
}
console.error('fragment sha256', fragmentDigest, JSON.stringify(ranges));

// Jedyna podmiana: budzet scienny -> limit krokow (asercja jednokrotnosci).
const ffText = frag('ff').join('\n');
const budgetFrom = '    const wall0 = performance.now();\n    while (!this.finished && performance.now() - wall0 < 40) {';
const budgetTo = '    let __steps = 0;\n    while (!this.finished && __steps++ < this.__maxSteps) {';
if (ffText.split(budgetFrom).length !== 2) throw new Error('wzorzec budzetu nie wystepuje dokladnie raz');
const ffPatched = ffText.replace(budgetFrom, budgetTo);

const harnessSrc = [
  'const BattleScene = { BATTLE_FRAME_WALL_MS: 16, BATTLE_FRAME_MAX_WALL_DELTA_MS: 100 };',
  'const FF_MAX_ROUNDS = 400;',
  'function mk(h, tok, q) { const f = () => (q ? h.fireq(tok) : h.fire(tok)); f.tok = tok; return f; }',
  'class Harness {',
  '  constructor() {',
  '    this.vNow = 0; this.vLastWall = 0; this.vTimers = []; this.vTimerSeq = 0;',
  '    this.finished = false; this.paused = false; this.speedMul = 1; this._autoBatchPlanning = null;',
  '    this._ffActive = true; this._ffQueue = []; this._ffVirtualMs = 0; this._ffPendingAuto = false; this.busy = false;',
  '    this.enterBusy = false; this.roundNo = 1; this.siegeWallCol = -1; this.wallEverBreached = false;',
  '    this.siegeNoBreachMaxRounds = 150; this.ratioA = 1; this.ratioD = 1; this.log = []; this._endWinner = null;',
  '    this.ev = []; this.nativeRaf = []; this.spawn = {}; this.roundInc = {}; this.finishOn = null; this.__maxSteps = 0;',
  '  }',
  '  fire(tok) { this._child(tok, "fire:"); }',
  '  fireq(tok) { this._child(tok, "q:"); }',
  '  _child(tok, tag) {',
  '    this.ev.push(tag + tok);',
  '    if (this.roundInc[String(tok)]) this.roundNo++;',
  '    if (tok === this.finishOn) this.finished = true;',
  '    const kids = this.spawn[String(tok)] || [];',
  '    for (const [kind, ms, c] of kids) {',
  '      if (kind === "s") this._schedule(ms, mk(this, c, false));',
  '      else this._raf(mk(this, c, true));',
  '    }',
  '  }',
  '  _ffEnterAuto() { this.ev.push("enter"); this.busy = this.enterBusy; }',
  '  _tickProjectiles(t) { this.ev.push("tp:" + t); }',
  '  _tickFades(t) { this.ev.push("tf:" + t); }',
  "  _armyMoraleRatio(side) { return side === 'atk' ? this.ratioA : this.ratioD; }",
  '  _battleUnitsForMapExport(_u) { return []; }',
  "  _finishDraw(reason, cap) { this.ev.push('draw'); this.finished = true; this._ffActive = false; this._ffQueue = []; this._endWinner = 'remis'; }",
  '  _showEndScreen(w) { this.ev.push("end:" + w); }',
  LINE(nowLine),
  ...frag('raf'),
  ...ffPatched.split('\n'),
  ...frag('rc'),
  ...frag('ffRes'),
  ...frag('scaled'),
  ...frag('sched'),
  ...frag('drain'),
  '  pending() { return this.vTimers.map((t) => [t.due, t.id, t.cb.tok]); }',
  '  runFF(maxSteps) { this.__maxSteps = maxSteps; this.ev = []; this.nativeRaf = []; this._runFastForward(); }',
  '}',
].join('\n');

const Harness = new Function('requestAnimationFrame', stripTypeScriptTypes(harnessSrc, { mode: 'strip' }) + '\nreturn Harness;')(
  // Natywny rAF (poza FF) tylko zapisuje token; w FF `_raf` kolejkuje.
  (cb) => { nativeRafSink.push(cb.tok); },
);
let nativeRafSink = [];

const mk = (h, tok, q) => { const f = () => (q ? h.fireq(tok) : h.fire(tok)); f.tok = tok; return f; };

// --- PRNG (mulberry32, ziarno 2171) ---
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(2171);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const SPEED_STEPS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, NaN];
const MS_POOL = [0, 0, 1, 16, 32, 33.3, 160, 400, -5, NaN, Infinity, 1e6, 0.1 + 0.2];
const RATIO_POOL = [0, 0.1, 0.25, 0.5, 0.9, 1, 1.5, NaN, Infinity, -Infinity];
const BUDGET_POOL = [0, 0, 1, 2, 3, 5, 17, 60, 200];
const ROUND_POOL = [0, 1, 5, 147, 148, 149, 150, 398, 399, 400, 401];
const NOBREACH_POOL = [1, 2, 150, 400, 401];

const cov = {
  finished_at_entry: 0,
  roundcap_at_entry: 0,
  roundcap_mid_run: 0,
  roundcap_draw: 0,
  roundcap_attacker: 0,
  roundcap_defender: 0,
  steplimit_stop: 0,
  zero_budget_call: 0,
  finished_in_timer: 0,
  pending_auto_enter: 0,
  pending_auto_blocked_by_busy: 0,
  timer_fired_in_step: 0,
  queue_run: 0,
  native_raf_outside_ff: 0,
  steps_total: 0,
  nan_step_ms: 0,
};

function snapshot(h) {
  return {
    vNow: h.vNow,
    finished: h.finished,
    ffVirtualMs: h._ffVirtualMs,
    pendingAuto: h._ffPendingAuto,
    busy: h.busy,
    roundNo: h.roundNo,
    endWinner: h._endWinner,
    queue: h._ffQueue.map((f) => f.tok),
    pending: h.pending(),
    nativeRaf: [...nativeRafSink],
  };
}

function makeCase(k) {
  const h = new Harness();
  h.vNow = rnd() < 0.5 ? 0 : Math.round(rnd() * 5000) / 10;
  h.speedMul = pick(SPEED_STEPS);
  h.finished = rnd() < 0.06;
  h.busy = rnd() < 0.2;
  h.enterBusy = rnd() < 0.3;
  h._ffPendingAuto = rnd() < 0.25;
  h._ffActive = rnd() < 0.8;
  h._ffVirtualMs = rnd() < 0.5 ? 0 : Math.round(rnd() * 1000);
  h.roundNo = pick(ROUND_POOL);
  h.siegeWallCol = rnd() < 0.5 ? -1 : 3;
  h.wallEverBreached = rnd() < 0.3;
  h.siegeNoBreachMaxRounds = pick(NOBREACH_POOL);
  h.ratioA = pick(RATIO_POOL);
  h.ratioD = pick(RATIO_POOL);
  h.finishOn = rnd() < 0.35 ? null : Math.floor(rnd() * 14);
  h.roundInc = {};
  if (rnd() < 0.7) for (let i = 0; i < 3; i++) h.roundInc[String(Math.floor(rnd() * 14))] = true;

  // Tabela potomkow: tokeny < 10000 to operacje (timer/kolejka), 10000+ to dzieci.
  let nextChild = 10000;
  const spawn = {};
  for (let t = 0; t < 14; t++) {
    if (rnd() < 0.5) {
      const kids = [];
      const nk = 1 + Math.floor(rnd() * 2);
      for (let j = 0; j < nk; j++) {
        const kind = rnd() < 0.5 ? 's' : 'r';
        const ms = pick(MS_POOL);
        const c = nextChild++;
        kids.push([kind, ms, c]);
      }
      spawn[String(t)] = kids;
    }
  }
  h.spawn = spawn;

  // Poczatkowe timery i elementy kolejki (stan sprzed wejscia w przewijanie).
  const nInit = Math.floor(rnd() * 5);
  for (let i = 0; i < nInit; i++) h._schedule(pick(MS_POOL), mk(h, Math.floor(rnd() * 14), false));
  const nQ = Math.floor(rnd() * 3);
  for (let i = 0; i < nQ; i++) h._ffQueue.push(mk(h, Math.floor(rnd() * 14), true));

  const init = {
    vNow: h.vNow,
    speedMul: h.speedMul,
    finished: h.finished,
    busy: h.busy,
    enterBusy: h.enterBusy,
    pendingAuto: h._ffPendingAuto,
    ffActive: h._ffActive,
    ffVirtualMs: h._ffVirtualMs,
    roundNo: h.roundNo,
    wallCol: h.siegeWallCol,
    wallEverBreached: h.wallEverBreached,
    noBreachCap: h.siegeNoBreachMaxRounds,
    ratioA: h.ratioA,
    ratioD: h.ratioD,
    finishOn: h.finishOn,
    roundInc: h.roundInc,
    spawn,
    initTimers: h.pending(),
    initQueue: h._ffQueue.map((f) => f.tok),
  };

  const calls = [];
  const nCalls = 1 + Math.floor(rnd() * 4);
  for (let c = 0; c < nCalls; c++) {
    const maxSteps = pick(BUDGET_POOL);
    // Zmiany miedzy wywolaniami (klatki): tryb FF, pauza sceny, zmiana rozkazu busy.
    if (c > 0) {
      if (rnd() < 0.2) h.busy = !h.busy;
      if (rnd() < 0.15) h.speedMul = pick(SPEED_STEPS);
      if (rnd() < 0.1) h._ffPendingAuto = true;
    }
    const before = { finished: h.finished, pendingAuto: h._ffPendingAuto, busy: h.busy, speed: h.speedMul };
    if (h.finished) cov.finished_at_entry++;
    if (maxSteps === 0) cov.zero_budget_call++;
    if (Number.isNaN(h.speedMul)) cov.nan_step_ms++;
    if (before.pendingAuto && before.busy) cov.pending_auto_blocked_by_busy++;
    nativeRafSink = [];
    h.runFF(maxSteps);
    const tp = h.ev.filter((e) => e.startsWith('tp:')).length;
    cov.steps_total += tp;
    if (h.ev.includes('enter')) cov.pending_auto_enter++;
    if (h.ev.some((e) => e.startsWith('fire:'))) cov.timer_fired_in_step++;
    if (h.ev.some((e) => e.startsWith('q:'))) cov.queue_run++;
    if (nativeRafSink.length > 0) cov.native_raf_outside_ff++;
    let stop;
    const last = h.ev[h.ev.length - 1];
    if (last === 'draw' || (last && last.startsWith('end:'))) {
      stop = 'roundcap';
      if (tp === 0) cov.roundcap_at_entry++;
      else cov.roundcap_mid_run++;
      if (last === 'draw') cov.roundcap_draw++;
      else if (last === 'end:atakujacy') cov.roundcap_attacker++;
      else cov.roundcap_defender++;
    } else if (h.finished) {
      stop = 'finished';
      if (tp > 0 && h.ev.some((e) => e.startsWith('fire:'))) cov.finished_in_timer++;
    } else {
      stop = 'steplimit';
      cov.steplimit_stop++;
    }
    calls.push({ maxSteps, stop, steps: tp, events: [...h.ev], expect: snapshot(h), before });
  }
  return { init, calls };
}

const cases = [];
for (let k = 0; k < 400; k++) cases.push(makeCase(k));

// Przypadek jawny: budzet 0 w bitwie aktywnej -> zero krokow, zadnego zdarzenia.
{
  const h = new Harness();
  h.vNow = 0;
  h.spawn = {};
  nativeRafSink = [];
  h.runFF(0);
  cases.push({
    init: { vNow: 0, speedMul: 1, finished: false, busy: false, enterBusy: false, pendingAuto: false, ffActive: true, ffVirtualMs: 0, roundNo: 1, wallCol: -1, wallEverBreached: false, noBreachCap: 150, ratioA: 1, ratioD: 1, finishOn: null, roundInc: {}, spawn: {}, initTimers: [], initQueue: [] },
    calls: [{ maxSteps: 0, stop: 'steplimit', steps: 0, events: [], expect: snapshot(h), before: { finished: false, pendingAuto: false, busy: false, speed: 1 } }],
  });
}

// Przypadek jawny: lancuch timerow o zerowym opoznieniu nie zapetla petli (kazda iteracja = jeden krok).
{
  const h = new Harness();
  h.spawn = { '1': [['s', 0, 1]] };
  h.spawn['1'] = [['s', 0, 2]];
  h.spawn['2'] = [['s', 0, 1]];
  h._schedule(0, mk(h, 1, false));
  nativeRafSink = [];
  h.runFF(3);
  cases.push({
    init: { vNow: 0, speedMul: 1, finished: false, busy: false, enterBusy: false, pendingAuto: false, ffActive: true, ffVirtualMs: 0, roundNo: 1, wallCol: -1, wallEverBreached: false, noBreachCap: 150, ratioA: 1, ratioD: 1, finishOn: null, roundInc: {}, spawn: h.spawn, initTimers: [[0, 0, 1]], initQueue: [] },
    calls: [{ maxSteps: 3, stop: 'steplimit', steps: h.ev.filter((e) => e.startsWith('tp:')).length, events: [...h.ev], expect: snapshot(h), before: { finished: false, pendingAuto: false, busy: false, speed: 1 } }],
  });
}

// Przypadek jawny: sufit bez wylomu osiagany W TRAKCIE przewijania (roundNo rosnie w timerach, werdykt remis).
{
  const h = new Harness();
  h.roundNo = 1; h.siegeWallCol = 3; h.wallEverBreached = false; h.siegeNoBreachMaxRounds = 4;
  h.ratioA = 0.5; h.ratioD = 0.5;
  h.roundInc = { '0': true, '1': true, '2': true, '3': true };
  h.spawn = { '0': [['s', 16, 1]], '1': [['s', 16, 2]], '2': [['r', 0, 3]], '3': [['s', 16, 0]] };
  h._schedule(0, mk(h, 0, false));
  h.runFF(50);
  const tp = h.ev.filter((e) => e.startsWith('tp:')).length;
  cases.push({
    init: { vNow: 0, speedMul: 1, finished: false, busy: false, enterBusy: false, pendingAuto: false, ffActive: true, ffVirtualMs: 0, roundNo: 1, wallCol: 3, wallEverBreached: false, noBreachCap: 4, ratioA: 0.5, ratioD: 0.5, finishOn: null, roundInc: h.roundInc, spawn: h.spawn, initTimers: [[0, 0, 0]], initQueue: [] },
    calls: [{ maxSteps: 50, stop: 'roundcap', steps: tp, events: [...h.ev], expect: snapshot(h), before: { finished: false, pendingAuto: false, busy: false, speed: 1 } }],
  });
}

// Jawne przypadki tego samego wzorca z jawnym zapisem zdarzen (dla czytelnosci testu Rust).
const jsonReplacer = (_k, v) => (typeof v === 'number' && !Number.isInteger(v) ? String(v) : v);

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'p6_siege_tactics_fastforward_vectors');
mkdirSync(outDir, { recursive: true });
const payload = {
  source:
    'gra/src/battle/battleScene.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75: _raf 9400-9409, _runFastForward 9415-9437 (budzet 40 ms -> limit krokow), _roundCapVerdict 9449-9464, _ffRoundCapResult 9485-9497, _scaledWallDelta 9512-9515, _schedule 9595-9606, _drainTimers 9616-9634, BATTLE_FRAME_WALL_MS 2552, BATTLE_FRAME_MAX_WALL_DELTA_MS 2553, FF_MAX_ROUNDS 1125',
  generator: 'rust-port/engine/tests/p6_siege_tactics_fastforward_gen.mjs (node ' + process.version + ', seed 2171)',
  fragmentSha256: fragmentDigest,
  coverageScenarios: cov,
  cases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(payload, jsonReplacer, 1) + '\n');
console.log('cases', cases.length, 'calls', cases.reduce((a, c) => a + c.calls.length, 0), JSON.stringify(cov));
