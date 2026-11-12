// P6 SIEGE-TAKTYKA K5e: generator wektorow zegara wirtualnego i kolejki timerow przez WYKONANIE tekstu pinu
// (gra/src/battle/battleScene.ts, pin 07d2fbd72). Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_siege_tactics_clock_gen.mjs
// (Node >= 22.13, module.stripTypeScriptTypes).
//
// Wycinane z pinu i wykonywane bez recznej kopii logiki: _now (9403), _advanceVClock (9500-9511),
// _scaledWallDelta (9512-9515), _schedule (9595-), _drainTimers (9616-). Stala BATTLE_FRAME_MAX_WALL_DELTA_MS = 100
// (pin :2553). Stuby dotycza wylacznie callbackow (efekty sceny): `fire(tok)` zapisuje token, ustawia `finished`
// wedlug `finishOn` i planuje dzieci z tabeli `spawn` (to odpowiednik wywolan z pinu, bez logiki gry).
//
// Straznik zrodla: SHA-256 wyciętych fragmentow (CLOCK_FRAGMENT_SHA256). Zmiana pinu -> blad generatora.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/battleScene.ts';
const CLOCK_FRAGMENT_SHA256 = '3256e334214a51280ac5abd1bdfde6e2783d2c2ed0c98c2d7c34a57ad2242505';
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

const nowLine = findLine(9380, 9420, /^  private _now\(\): number \{ return this\.vNow; \}$/);
const advLine = findLine(9490, 9505, /^  private _advanceVClock\(wall: number\): void \{$/);
const scaledLine = findLine(9505, 9520, /^  private _scaledWallDelta\(wallDelta: number\): number \{$/);
const schedLine = findLine(9585, 9600, /^  private _schedule\(ms: number, cb: \(\) => void\): void \{$/);
const drainLine = findLine(9610, 9620, /^  private _drainTimers\(\): void \{$/);
expectLine(2553, /^  private static readonly BATTLE_FRAME_MAX_WALL_DELTA_MS = 100;$/);
expectLine(9508, /this\.vNow \+= this\._scaledWallDelta\(dw\);/);
expectLine(9605, /this\.vTimers\.push\(\{ due: this\._now\(\) \+ Math\.max\(0, ms\), cb, id: this\.vTimerSeq\+\+ \}\);/);

const [advA, advB] = methodRange(advLine);
const [scA, scB] = methodRange(scaledLine);
const [schA, schB] = methodRange(schedLine);
const [drA, drB] = methodRange(drainLine);
expectLine(advB, /^  \}$/);
expectLine(scB, /^  \}$/);
expectLine(schB, /^  \}$/);
expectLine(drB, /^  \}$/);

const fragments = [nowLine, [advA, advB], [scA, scB], [schA, schB], [drA, drB]].map((x) =>
  Array.isArray(x) ? pinLines.slice(x[0] - 1, x[1]).join('\n') : LINE(x),
);
const fragmentDigest = createHash('sha256').update(fragments.join('\n---\n')).digest('hex');
if (CLOCK_FRAGMENT_SHA256 !== 'PLACEHOLDER' && fragmentDigest !== CLOCK_FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu nie zgadzaja sie z hashem: ${fragmentDigest}`);
}
console.error('fragment sha256', fragmentDigest, 'lines', advA, advB, scA, scB, schA, schB, drA, drB);

const harnessSrc = [
  'const BattleScene = { BATTLE_FRAME_MAX_WALL_DELTA_MS: 100 };',
  'function mk(h, tok) { const f = () => h.fire(tok); f.tok = tok; return f; }',
  'class Harness {',
  '  constructor() {',
  '    this.vNow = 0; this.vLastWall = 0; this.vTimers = []; this.vTimerSeq = 0;',
  '    this.finished = false; this.paused = false; this.speedMul = 1; this._autoBatchPlanning = null;',
  '    this.fired = []; this.spawn = {}; this.finishOn = null;',
  '  }',
  '  fire(tok) {',
  '    this.fired.push(tok);',
  '    if (tok === this.finishOn) this.finished = true;',
  '    const kids = this.spawn[String(tok)] || [];',
  '    for (const [ms, c] of kids) this._schedule(ms, mk(this, c));',
  '  }',
  LINE(nowLine),
  ...pinLines.slice(advA - 1, advB),
  ...pinLines.slice(scA - 1, scB),
  ...pinLines.slice(schA - 1, schB),
  ...pinLines.slice(drA - 1, drB),
  '  pending() { return this.vTimers.map((t) => [t.due, t.id, t.cb.tok]); }',
  '}',
].join('\n');

const mk = (h, tok) => { const f = () => h.fire(tok); f.tok = tok; return f; };
const Harness = new Function(stripTypeScriptTypes(harnessSrc, { mode: 'strip' }) + '\nreturn Harness;')();

// --- PRNG (mulberry32, ziarno 217) ---
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
const rnd = mulberry32(217);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const SPEED_STEPS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512];
const MS_POOL = [0, 0, 0, 1, 16, 33.3, 160, 240, 400, -5, -0, NaN, Infinity, -Infinity, 1e9, 0.1 + 0.2];
const WALL_JUMP = [0, 5, 16, 50, 99.9, 100, 100.5, 101, 250, 1000, -30];
const WALL_POOL = [0, -0, NaN, Infinity, -Infinity, -50, 1e15, 0.5];

// Liczniki pokrycia scenariuszy (z wykonania wzorca w generatorze, nie z instrumentacji linii).
const cov = {
  advance_first_call: 0,
  advance_paused: 0,
  advance_dw_negative_clamped: 0,
  advance_dw_over_max_clamped: 0,
  advance_dw_nan: 0,
  advance_speed_scaled_gt1: 0,
  scaled_nan_wall: 0,
  schedule_queued: 0,
  schedule_dropped_finished: 0,
  schedule_planning_sync: 0,
  schedule_ms_negative_clamped: 0,
  schedule_ms_nan: 0,
  schedule_ms_infinite: 0,
  drain_fired: 0,
  drain_finished_clear: 0,
  drain_same_due_tie_by_id: 0,
  drain_nan_due_selected: 0,
  drain_guard_limit_hit: 0,
};

// Stan wspolny: h.vTimers i pola wykonuje metody pina; generator tylko sterowanie i oczekiwania.
function snapshot(h, fired) {
  return {
    vNow: h.vNow,
    vLastWall: h.vLastWall,
    finished: h.finished,
    fired,
    pending: h.pending(),
  };
}

function makeCase(k) {
  const h = new Harness();
  const init = {
    vNow: rnd() < 0.5 ? 0 : Math.round(rnd() * 5000) / 10,
    vLastWall: rnd() < 0.3 ? 0 : Math.round(rnd() * 3000) / 10 + 1,
    speedMul: pick(SPEED_STEPS),
    paused: rnd() < 0.15,
    finished: rnd() < 0.05,
    finishOn: rnd() < 0.3 ? null : Math.floor(rnd() * 12),
  };
  h.vNow = init.vNow;
  h.vLastWall = init.vLastWall;
  h.speedMul = init.speedMul;
  h.paused = init.paused;
  h.finished = init.finished;
  h.finishOn = init.finishOn;

  // Tabela potomkow: tokeny 10000+ sa tylko dziecmi (planowane w fire), nie sa operacjami.
  let nextChild = 10000;
  const spawn = {};
  const nTok = 12;
  for (let t = 0; t < nTok; t++) {
    if (rnd() < 0.45) {
      const kids = [];
      const nk = 1 + Math.floor(rnd() * 2);
      for (let j = 0; j < nk; j++) {
        const ms = pick(MS_POOL);
        const c = nextChild++;
        kids.push([ms, c]);
        if (rnd() < 0.3) {
          spawn[String(c)] = [[pick(MS_POOL), nextChild++]];
        }
      }
      spawn[String(t)] = kids;
    }
  }
  h.spawn = spawn;

  const ops = [];
  const expect = [];
  const nOps = 1 + Math.floor(rnd() * 24);
  let wallCur = init.vLastWall;
  let tok = 1;

  for (let s = 0; s < nOps; s++) {
    const kind = rnd();
    if (kind < 0.35) {
      // advance
      const wall = rnd() < 0.12 ? pick(WALL_POOL) : (wallCur += pick(WALL_JUMP));
      const paused = rnd() < 0.15;
      const speedMul = rnd() < 0.3 ? pick(SPEED_STEPS) : h.speedMul;
      const pre = { last: h.vLastWall, paused: h.paused };
      h.paused = paused;
      h.speedMul = speedMul;
      const dw = wall - pre.last;
      if (pre.last === 0) cov.advance_first_call++;
      else if (paused) cov.advance_paused++;
      else {
        if (Number.isNaN(dw)) cov.advance_dw_nan++;
        else if (dw < 0) cov.advance_dw_negative_clamped++;
        else if (dw > 100) cov.advance_dw_over_max_clamped++;
        if (speedMul > 1 && !Number.isNaN(dw)) cov.advance_speed_scaled_gt1++;
        if (Number.isNaN(wall)) cov.scaled_nan_wall++;
      }
      h._advanceVClock(wall);
      ops.push({ op: 'advance', wall, paused, speedMul });
      expect.push(snapshot(h, []));
    } else if (kind < 0.75) {
      // schedule
      const ms = pick(MS_POOL);
      const planning = rnd() < 0.08;
      const myTok = tok++;
      if (planning) cov.schedule_planning_sync++;
      else if (h.finished) cov.schedule_dropped_finished++;
      else cov.schedule_queued++;
      if (!planning && ms < 0) cov.schedule_ms_negative_clamped++;
      if (Number.isNaN(ms)) cov.schedule_ms_nan++;
      if (ms === Infinity || ms === -Infinity) cov.schedule_ms_infinite++;
      h._autoBatchPlanning = planning ? { intent: null } : null;
      const firedBefore = h.fired.length;
      h._schedule(ms, mk(h, myTok));
      h._autoBatchPlanning = null;
      ops.push({ op: 'schedule', ms, tok: myTok, planning });
      expect.push(snapshot(h, h.fired.slice(firedBefore)));
    } else {
      // drain: zliczenie scenariuszy przed wykonaniem
      const target = h.vNow;
      const due = h.vTimers.filter((t) => !(t.due > target));
      if (h.finished && h.vTimers.length > 0) cov.drain_finished_clear++;
      if (due.some((t) => Number.isNaN(t.due))) cov.drain_nan_due_selected++;
      for (let i = 0; i < due.length; i++) {
        for (let j = i + 1; j < due.length; j++) {
          if (due[i].due === due[j].due) {
            cov.drain_same_due_tie_by_id++;
            i = due.length;
            break;
          }
        }
      }
      const firedBefore = h.fired.length;
      h._drainTimers();
      const nFired = h.fired.length - firedBefore;
      cov.drain_fired += nFired;
      if (nFired > 100000) cov.drain_guard_limit_hit++;
      ops.push({ op: 'drain' });
      expect.push(snapshot(h, h.fired.slice(firedBefore)));
    }
  }
  return { init, spawn, ops, expect };
}

const cases = [];
for (let k = 0; k < 420; k++) cases.push(makeCase(k));

// Przypadek jawny: lancuch zerowych opóźnień -> straznik 100000 (sufit wywolan na jeden drain).
{
  const h = new Harness();
  h.spawn = { '1': [[0, 1]] };
  const ops = [{ op: 'schedule', ms: 0, tok: 1, planning: false }, { op: 'drain' }];
  const expect = [];
  h._schedule(0, mk(h, 1));
  expect.push(snapshot(h, []));
  const firedBefore = h.fired.length;
  h._drainTimers();
  cov.drain_guard_limit_hit++;
  expect.push(snapshot(h, h.fired.slice(firedBefore)));
  cases.push({ init: { vNow: 0, vLastWall: 0, speedMul: 1, paused: false, finished: false, finishOn: null }, spawn: h.spawn, ops, expect });
}

// Przypadek jawny: remis due rozstrzygany po id (1,2,4 z due=16); dziecko 3 (ms=0 z tokena 2) planowane w drain.
{
  const init = { vNow: 0, vLastWall: 500, speedMul: 1, paused: false, finished: false, finishOn: null };
  const h = new Harness();
  h.vLastWall = 500;
  h.spawn = { '2': [[0, 3]] };
  const ops = [
    { op: 'schedule', ms: 16, tok: 1, planning: false },
    { op: 'schedule', ms: 16, tok: 2, planning: false },
    { op: 'schedule', ms: 16, tok: 4, planning: false },
    { op: 'advance', wall: 600, paused: false, speedMul: 1 },
    { op: 'drain' },
  ];
  const expect = [];
  const step = (o) => {
    if (o.op === 'schedule') {
      h._schedule(o.ms, mk(h, o.tok));
      expect.push(snapshot(h, []));
    } else if (o.op === 'advance') {
      h._advanceVClock(o.wall);
      expect.push(snapshot(h, []));
    } else {
      const firedBefore = h.fired.length;
      h._drainTimers();
      expect.push(snapshot(h, h.fired.slice(firedBefore)));
    }
  };
  ops.forEach(step);
  cases.push({ init, spawn: h.spawn, ops, expect });
}

// Liczby nie-calkowite (oraz NaN/Infinity) jako napisy String(x): najkrotsza reprezentacja, ktora round-tripuje;
// serde_json bez float_roundtrip nie gwarantuje dokladnego parsowania f64, a Rust parsuje napis przez str::parse.
const jsonReplacer = (_k, v) => (typeof v === 'number' && !Number.isInteger(v) ? String(v) : v);

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'p6_siege_tactics_siege_tactics_clock_vectors');
mkdirSync(outDir, { recursive: true });
const payload = {
  source:
    'gra/src/battle/battleScene.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75: _now 9403, _advanceVClock 9500-9511, _scaledWallDelta 9512-9515, _schedule 9595-9606, _drainTimers 9616-9634, BATTLE_FRAME_MAX_WALL_DELTA_MS 2553 (wykonanie tekstu pinu, stuby callbackow)',
  generator: 'rust-port/engine/tests/p6_siege_tactics_siege_tactics_clock_gen.mjs (node ' + process.version + ', seed 217)',
  fragmentSha256: fragmentDigest,
  coverageScenarios: cov,
  cases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(payload, jsonReplacer, 1) + '\n');
console.log('cases', cases.length, JSON.stringify(cov));
