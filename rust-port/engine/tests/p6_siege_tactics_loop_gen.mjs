// P6 SIEGE-TAKTYKA K5-LOOP: generator wektorow end-to-end pętli taktycznej oblężenia przez WYKONANIE tekstu pinu
// (gra/src/battle/battleScene.ts, pin 07d2fbd72).
// Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_loop_gen.mjs (Node >= 22.13, module.stripTypeScriptTypes).
//
// Wycinane z pinu (po nazwie metody, zakres do pierwszej linii '  }' o wcieciu 2 spacje):
//   stale: ACT_GAP_MS, TURN_GAP_MS, FF_MAX_ROUNDS, STALL_TURN_LIMIT, ARMY_MORALE_LOSS_THRESHOLD,
//          BattleScene.BATTLE_FRAME_WALL_MS / BATTLE_FRAME_MAX_WALL_DELTA_MS (przepisane jako statyki Harness),
//   _updateStallWatch, _beginTurn, _activateNext, _roundCapVerdict, _finishDraw, _ffRoundCapResult,
//   _scaledWallDelta, _runFastForward, _now, _schedule, _drainTimers, _checkEnd (zmieniona nazwa na _checkEndPin).
//
// Stuby (efekty zewnetrzne, nie logika petli):
//   _activateUnit: ciało jednostki = timer o zadanym czasie trwania (animacja) + zadany efekt (nop / kill / hurt), po
//     ktorym wywolywany jest callback z pinu. Efekty sa jawnym wejsciem sekwencji, nie logika boju (RNG/cios: K5I).
//   _fireSiegeTowers: wiezyczka zabija jedna zadana jednostke (efekt R4, jawny w sekwencji).
//   _armyMoraleRatio: WYCINANE Z PINU (metoda wola armyMoraleRatioWithoutCommander z game/army-leadership.ts, to
//     tez wycinane z pinu po SHA) — bez stubu formuly.
//   _startRout / commandersToWithdrawAfterArmyBreak: pusta lista dowodcow (wycofanie dowodcow poza zakresem).
//   _battleUnitsForMapExport, _showEndScreen, _tickProjectiles, _tickFades, _counterBudget, hint, banner, refresh kolejki.
//   _beginAutoBatchPhase: rzuca wyjatek (sekwencje sa wylacznie oblezeniem, wiec sciezka AUTO nie wystepuje).
// Zakres: tylko oblezenie (siegeWallCol >= 0), tryb AUTO (_manualMode = false), bez planowania AUTO, bez stall
// (_updateStallWatch wychodzi wczesnie dla oblezenia w pinie).
//
// Straznik zrodla: SHA-256 wyciętych fragmentow (LOOP_FRAGMENT_SHA256). Zmiana pinu -> blad generatora.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/battleScene.ts';
const SEED = 2217;
const SEQUENCE_COUNT = 360;
const LOOP_FRAGMENT_SHA256 = 'b48108ea742e51fd647ad14e7542f9db83854a42255c5aa68761fb248a3de88c';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const pinLines = execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');
const LINE = (n) => pinLines[n - 1];

function expectLine(n, re) {
  if (!re.test(LINE(n))) throw new Error(`pin ${n}: oczekiwano ${re}, jest: ${LINE(n)}`);
}
function uniqueLine(re) {
  const hits = [];
  for (let n = 1; n <= pinLines.length; n++) if (re.test(LINE(n))) hits.push(n);
  if (hits.length !== 1) throw new Error(`pin: ${re} trafien ${hits.length}`);
  return hits[0];
}
// Zakres metody: od linii startu do pierwszej linii dokladnie '  }' (lub jednolinijkowa metoda).
function methodRange(re) {
  const start = uniqueLine(re);
  if (/\{.*\}\s*$/.test(LINE(start))) return [start, start];
  for (let n = start + 1; n <= pinLines.length; n++) if (LINE(n) === '  }') return [start, n];
  throw new Error(`brak konca metody od linii ${start}`);
}
const textOf = ([a, b]) => pinLines.slice(a - 1, b).join('\n');

// Stale z gornej czesci pliku (asercje tresci).
expectLine(1014, /^const ACT_GAP_MS\s+= 160;/);
expectLine(1023, /^const TURN_GAP_MS\s+= 240;/);
expectLine(1119, /^const STALL_TURN_LIMIT = 6;/);
expectLine(1125, /^const FF_MAX_ROUNDS = 400;/);
expectLine(1157, /^const ARMY_MORALE_LOSS_THRESHOLD = 0.25;/);
expectLine(2552, /private static readonly BATTLE_FRAME_WALL_MS = 16;/);
expectLine(2553, /private static readonly BATTLE_FRAME_MAX_WALL_DELTA_MS = 100;/);

const ranges = {
  stall: methodRange(/^  private _updateStallWatch\(\): void \{$/),
  beginTurn: methodRange(/^  private _beginTurn\(\): void \{$/),
  activateNext: methodRange(/^  private _activateNext\(\): void \{$/),
  roundCap: methodRange(/^  private _roundCapVerdict\(\)/),
  finishDraw: methodRange(/^  private _finishDraw\(/),
  ffRoundCapResult: methodRange(/^  private _ffRoundCapResult\(\): void \{$/),
  scaledWallDelta: methodRange(/^  private _scaledWallDelta\(wallDelta: number\): number \{$/),
  runFastForward: methodRange(/^  private _runFastForward\(\): void \{$/),
  now: methodRange(/^  private _now\(\): number \{/),
  schedule: methodRange(/^  private _schedule\(ms: number, cb: \(\) => void\): void \{$/),
  drainTimers: methodRange(/^  private _drainTimers\(\): void \{$/),
  checkEnd: methodRange(/^  private _checkEnd\(\): boolean \{$/),
  armyMorale: methodRange(/^  private _armyMoraleRatio\(side: 'atk' \| 'def'\): number \{$/),
};
console.error('zakresy pinu', JSON.stringify(ranges));

const fragments = [
  LINE(1014), LINE(1023), LINE(1119), LINE(1125), LINE(1157),
  LINE(2552), LINE(2553),
  ...Object.values(ranges).map(textOf),
];
const fragmentDigest = createHash('sha256').update(fragments.join('\n---\n')).digest('hex');
if (LOOP_FRAGMENT_SHA256 !== 'PLACEHOLDER' && fragmentDigest !== LOOP_FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu nie zgadzaja sie z hashem: ${fragmentDigest}`);
}
console.error('fragment sha256', fragmentDigest);

const checkEndText = textOf(ranges.checkEnd).replace('private _checkEnd(): boolean {', '_checkEndPin() {');
if (!checkEndText.includes('_checkEndPin() {')) throw new Error('rename _checkEnd nie zadzialal');

// Czysta funkcja morale z game/army-leadership.ts (wycinek po nazwie, do pierwszej linii '}' o zerowym wcieciu).
const ARMY_LEADERSHIP_PATH = 'gra/src/game/army-leadership.ts';
const alLines = execFileSync('git', ['show', `${PIN}:${ARMY_LEADERSHIP_PATH}`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');
const alStart = alLines.findIndex((l) => l.startsWith('export function armyMoraleRatioWithoutCommander('));
if (alStart < 0) throw new Error('brak armyMoraleRatioWithoutCommander w army-leadership.ts');
const alEnd = alLines.findIndex((l, i) => i > alStart && l === '}');
if (alEnd < 0) throw new Error('brak konca armyMoraleRatioWithoutCommander');
const armyMoraleFnText = alLines.slice(alStart, alEnd + 1).join('\n').replace('export function', 'function');

const pinMethods = [
  textOf(ranges.stall),
  textOf(ranges.beginTurn),
  textOf(ranges.activateNext),
  textOf(ranges.roundCap),
  textOf(ranges.finishDraw),
  textOf(ranges.ffRoundCapResult),
  textOf(ranges.scaledWallDelta),
  textOf(ranges.runFastForward),
  textOf(ranges.now),
  textOf(ranges.schedule),
  textOf(ranges.drainTimers),
  checkEndText,
  textOf(ranges.armyMorale),
]
  .join('\n')
  .replaceAll('BattleScene.', 'Harness.');

const classSrc = [
  LINE(1014), LINE(1023), LINE(1119), LINE(1125), LINE(1157),
  'function commandersToWithdrawAfterArmyBreak(arr) { return []; }',
  armyMoraleFnText,
  mkUnit.toString(),
  'class Harness {',
  '  static BATTLE_FRAME_WALL_MS = 16;',
  '  static BATTLE_FRAME_MAX_WALL_DELTA_MS = 100;',
  '  constructor(spec) {',
  '    const self = this;',
  '    this.atk = spec.atk.map((u, i) => mkUnit("atk", i, u));',
  '    this.def = spec.def.map((u, i) => mkUnit("def", i, u));',
  '    this.siegeWallCol = spec.wallCol; this.wallEverBreached = spec.wallBreached;',
  '    this.siegeNoBreachMaxRounds = spec.noBreachCap; this.roundNo = 0; this.finished = false;',
  '    this.log = []; this.vNow = 0; this.vTimers = []; this.vTimerSeq = 0; this.speedMul = spec.speed;',
  '    this._ffActive = false; this._ffQueue = []; this._ffVirtualMs = 0; this._ffPendingAuto = false;',
  '    this._stallSig = ""; this._stallTurns = 0; this._stalled = false;',
  '    this._endWinner = null; this._endSurvivors = null; this.turnOrder = []; this.turnIdx = 0;',
  '    this.busy = false; this._battleAwaitingOrders = false; this._autoBattleSuspended = false;',
  '    this._manualMode = false; this._autoBatchPlanning = false; this._queuedOrderUnitIds = new Set();',
  '    this.__trace = []; this.__draw = null; this.__shown = null; this.__tower = spec.tower;',
  '    this._counterBudget = { beginTurn() {} };',
  '    this.hint = { textContent: "" };',
  '    this.__self = self;',
  '  }',
  '  _startRout() { throw new Error("nie powinno sie wykonac: pusta lista dowodcow"); }',
  '  _battleUnitsForMapExport() { return []; }',
  '  _showEndScreen(w) { this.__shown = w; }',
  '  _fireSiegeTowers() {',
  '    this.__trace.push("turn:" + this.roundNo);',
  '    const t = this.__tower;',
  '    if (t) { const u = (t.side === "atk" ? this.atk : this.def)[t.idx]; if (u && !u.dead) u.dead = true; }',
  '  }',
  '  _movementPointsFor(bu) { return bu.mp; }',
  '  _updateBattlePhaseBanner() {}',
  '  _refreshQueuedOrderVisuals() {}',
  '  _isUnitDoctrineAuto() { return false; }',
  '  _beginAutoBatchPhase() { throw new Error("poza zakresem K5-LOOP: sciezka AUTO bez oblezenia"); }',
  '  _ffEnterAuto() { throw new Error("poza zakresem K5-LOOP: wejscie w AUTO z FF"); }',
  '  _tickProjectiles() {}',
  '  _tickFades() {}',
  '  _activateUnit(u, cb) {',
  '    this.__trace.push("act:" + u.__tag + "@" + this.vNow);',
  '    this._schedule(u.__dur, () => {',
  '      if (u.__eff === "kill") { u.dead = true; u.bu.hp = 0; }',
  '      else if (u.__eff === "hurt") { u.bu.hp = Math.max(0, u.bu.hp - 30); u.morale = Math.max(0, u.morale - 40); }',
  '      cb();',
  '    });',
  '  }',
  '  _checkEnd() {',
  '    const caller = (new Error().stack.split("\\n")[2] || "");',
  '    const site = caller.includes("_beginTurn") ? "begin" : "activate";',
  '    const ret = this._checkEndPin();',
  '    const outcome = !ret ? "continue"',
  '      : (this._endWinner === "remis" ? "draw" : "ended:" + (this._endWinner === "atakujacy" ? "atk" : "def"));',
  '    this.__trace.push("check:" + site + ":" + outcome);',
  '    return ret;',
  '  }',
  pinMethods,
  '}',
].join('\n');

function mkUnit(side, idx, u) {
  return {
    bu: { id: `${side}${idx}`, hp: u.hp, maxHp: u.hp, mp: u.mp },
    side,
    q: 0,
    r: 0,
    morale: u.morale,
    moraleMax: u.moraleMax,
    dead: false,
    fadingOut: false,
    removed: false,
    routed: false,
    acted: false,
    moveLeft: 0,
    playerOrder: { type: 'none' },
    __tag: `${side}${idx}`,
    __dur: u.dur,
    __eff: u.eff,
  };
}

const jsSrc = stripTypeScriptTypes(classSrc, { mode: 'strip' });
const HarnessFactory = new Function('performance', jsSrc + '\nreturn Harness;');

// Zegar scianowy: kazde odczytanie przesuwa czas o 10 ms, wiec budzet 40 ms w _runFastForward daje 3-4 iteracje na wywolanie.
function runSpec(spec) {
  const perf = { t: 0, now() { this.t += 10; return this.t; } };
  const Harness = HarnessFactory(perf);
  const h = new Harness(spec);
  h._beginTurn();
  let calls = 0;
  while (!h.finished) {
    h._runFastForward();
    if (++calls > 200000) throw new Error('petla bez zakonczenia');
  }
  const winner = h._endWinner === 'atakujacy' ? 'atk' : h._endWinner === 'obronca' ? 'def' : h._endWinner;
  const unitOut = (side, arr) => arr.map((u, idx) => ({
    side, idx, dead: u.dead, acted: u.acted, hp: u.bu.hp, morale: u.morale,
  }));
  return {
    finished: h.finished,
    winner,
    roundNo: h.roundNo,
    vNow: h.vNow,
    trace: h.__trace,
    units: [...unitOut('atk', h.atk), ...unitOut('def', h.def)],
  };
}

// --- PRNG (mulberry32) ---
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
const rnd = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const randInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const DUR_POOL = [0, 40, 100, 160, 200, 320];
const EFF_POOL = ['nop', 'nop', 'nop', 'hurt', 'kill'];
const NO_BREACH_POOL = [1, 2, 3, 4, 6, 10, 25, 150];
const SPEED_POOL = [1, 2, 4];

function genUnit(i, side) {
  return {
    hp: pick([10, 20, 40, 60, 100]),
    morale: randInt(20, 100),
    moraleMax: 100,
    mp: randInt(0, 4),
    dur: pick(DUR_POOL),
    eff: pick(EFF_POOL),
  };
}

function genSpec(k) {
  const nA = randInt(1, 5);
  const nD = randInt(1, 5);
  const atk = Array.from({ length: nA }, (_, i) => genUnit(i, 'atk'));
  const def = Array.from({ length: nD }, (_, i) => genUnit(i, 'def'));
  const wallBreached = rnd() < 0.35;
  const tower = rnd() < 0.3
    ? (rnd() < 0.5 ? { side: 'atk', idx: randInt(0, nA - 1) } : { side: 'def', idx: randInt(0, nD - 1) })
    : null;
  return {
    id: `loop-${String(k).padStart(3, '0')}`,
    atk,
    def,
    wallCol: 3,
    wallBreached,
    noBreachCap: pick(NO_BREACH_POOL),
    speed: pick(SPEED_POOL),
    tower,
  };
}

const sequences = [];
for (let k = 0; k < SEQUENCE_COUNT; k++) {
  const spec = genSpec(k);
  const expect = runSpec(spec);
  sequences.push({ id: spec.id, spec, expect });
}

const stats = {
  count: sequences.length,
  withBreach: sequences.filter((s) => s.spec.wallBreached).length,
  withTower: sequences.filter((s) => s.spec.tower).length,
  capDraw: sequences.filter((s) => s.expect.winner === 'remis').length,
  capRounds400: sequences.filter((s) => s.expect.roundNo >= 400).length,
  winnersAtk: sequences.filter((s) => s.expect.winner === 'atk').length,
  winnersDef: sequences.filter((s) => s.expect.winner === 'def').length,
  maxRound: Math.max(...sequences.map((s) => s.expect.roundNo)),
  activations: sequences.reduce((n, s) => n + s.expect.trace.filter((t) => t.startsWith('act:')).length, 0),
};
console.error('statystyki', JSON.stringify(stats));

const outDir = join(here, 'p6_siege_tactics_loop_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, 'vectors.json'),
  JSON.stringify({
    source: { pin: PIN, path: PIN_PATH, fragmentSha256: fragmentDigest },
    generator: 'p6_siege_tactics_loop_gen.mjs',
    seed: SEED,
    stats,
    sequences,
  }) + '\n',
);
console.error(`zapisano ${sequences.length} sekwencji do ${join(outDir, 'vectors.json')}`);
