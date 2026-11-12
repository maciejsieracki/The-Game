// P6 SIEGE-TAKTYKA K5F: generator wektorow sekwencji tury przez WYKONANIE tekstu pinu (gra/src/battle/battleScene.ts, pin 07d2fbd72).
// Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_turnseq_gen.mjs (Node >= 22.13, module.stripTypeScriptTypes).
//
// Wycinane z pinu po numerach linii (z asercja tresci granic) i wykonywane po usunieciu typow TS:
//   _beginTurn 5631-5689, _activateNext 5979-6030 (cialo i callback),
//   _checkEnd 10153-10240 (zmieniona nazwa na _checkEndPin, owijana przez harness), _roundCapVerdict 9449-9464,
//   _updateStallWatch 5568-5581, _isPlayerSide 12420-12422, _playerRoster 12424-12426, _enemyRoster 12428-12430.
// Stuby (efekty sceny, nie logika sekwencji): _counterBudget, _fireSiegeTowers, _movementPointsFor, hint,
//   _updateBattlePhaseBanner, _beginAutoBatchPhase, _activateUnit (zapamietuje callback), _refreshQueuedOrderVisuals,
//   _isUnitDoctrineAuto, _schedule (planowanie AUTO wykonuje cb od razu, jak w pinie; inaczej tylko zapis),
//   _playerControlSide, _startRout / _finishDraw / _showEndScreen, _armyMoraleRatio.
// Wejscia _checkEnd sa zapisywane w momencie wywolania (wrapper), wynik _checkEnd to wynik wykonania pinu.
//
// Straznik zrodla: SHA-256 wyciętych fragmentow (TURNSEQ_FRAGMENT_SHA256). Zmiana pinu -> blad generatora.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/battleScene.ts';
const TURNSEQ_FRAGMENT_SHA256 = 'ec5fbdf9953ad48a6a1760611391de9991a838105fd9f5add34767c8e0c3569b';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const pinLines = execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');
const L = (a, b) => pinLines.slice(a - 1, b).join('\n');
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

// Granice wycietych fragmentow (asercje tresci).
expectLine(1014, /^const ACT_GAP_MS\s+= 160;/);
expectLine(1023, /^const TURN_GAP_MS\s+= 240;/);
expectLine(5568, /private _updateStallWatch\(\): void \{/);
expectLine(5581, /^  \}$/);
expectLine(5631, /^  private _beginTurn\(\): void \{$/);
expectLine(5689, /^  \}$/);
expectLine(5979, /^  private _activateNext\(\): void \{$/);
expectLine(6030, /^  \}$/);
expectLine(9449, /private _roundCapVerdict\(\)/);
expectLine(9464, /^  \}$/);
expectLine(10153, /private _checkEnd\(\): boolean \{/);
expectLine(10240, /^  \}$/);
expectLine(12420, /^  private _isPlayerSide\(side: 'atk' \| 'def'\): boolean \{$/);
expectLine(12422, /^  \}$/);
expectLine(12424, /^  private _playerRoster\(\): RuntimeBattleUnit\[\] \{$/);
expectLine(12426, /^  \}$/);
expectLine(12428, /^  private _enemyRoster\(\): RuntimeBattleUnit\[\] \{$/);
expectLine(12430, /^  \}$/);

const aliveALine = findLine(10153, 10180, /^\s*let aliveA = this\.atk\.some\(/);
const aliveDLine = findLine(10153, 10180, /^\s*let aliveD = this\.def\.some\(/);
const isSiegeLine = findLine(10153, 10200, /^\s*const isSiege = this\.siegeWallCol >= 0;/);
const totalDeadLine = findLine(10153, 10200, /^\s*const totalDead = /);

const fragments = [
  L(1014, 1014), L(1023, 1023),
  L(5568, 5581), L(5631, 5689), L(5979, 6030), L(9449, 9464), L(10153, 10240),
  L(12420, 12422), L(12424, 12426), L(12428, 12430),
];
const fragmentDigest = createHash('sha256').update(fragments.join('\n---\n')).digest('hex');
if (TURNSEQ_FRAGMENT_SHA256 !== 'PLACEHOLDER' && fragmentDigest !== TURNSEQ_FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu nie zgadzaja sie z hashem: ${fragmentDigest}`);
}
console.error('fragment sha256', fragmentDigest);

// _checkEnd z pinu zostaje wykonany pod nazwa _checkEndPin; wrapper w harnessie zapisuje wejscia.
const checkEndText = L(10153, 10240).replace('private _checkEnd(): boolean {', '_checkEndPin() {');
if (!checkEndText.includes('_checkEndPin() {')) throw new Error('rename _checkEnd nie zadzialal');

const methodSrc = [
  L(5568, 5581),
  L(5631, 5689),
  L(5979, 6030),
  L(9449, 9464),
  checkEndText,
  L(12420, 12422),
  L(12424, 12426),
  L(12428, 12430),
].join('\n');

const derivedSrc = [
  '  _aliveFlags() {',
  LINE(aliveALine),
  LINE(aliveDLine),
  '    return [aliveA, aliveD];',
  '  }',
  '  _isSiegeFlag() {',
  LINE(isSiegeLine),
  '    return isSiege;',
  '  }',
  '  _totalDeadCount() {',
  LINE(totalDeadLine),
  '    return totalDead;',
  '  }',
].join('\n');

const classSrc = [
  L(1014, 1014),
  L(1023, 1023),
  L(1119, 1119),
  L(1125, 1125),
  L(1157, 1157),
  'function commandersToWithdrawAfterArmyBreak(arr) { return arr.filter(u => u.__withdraw); }',
  'class Harness {',
  '  constructor() {',
  '    const self = this;',
  '    this.atk = []; this.def = []; this.siegeWallCol = -1; this.wallEverBreached = false;',
  '    this.roundNo = 1; this.siegeNoBreachMaxRounds = 150; this.finished = false; this.log = [];',
  '    this._stallSig = ""; this._stallTurns = 0; this._stalled = false;',
  '    this._endWinner = null; this._endSurvivors = null; this.__ratio = { atk: 1, def: 1 };',
  '    this.__ratioAfterRout = { atk: 1, def: 1 }; this.__draw = null; this.__shown = null;',
  '    this.turnOrder = []; this.turnIdx = 0; this.busy = false; this._battleAwaitingOrders = false;',
  '    this._autoBattleSuspended = false; this._manualMode = false; this._autoBatchPlanning = false;',
  '    this._queuedOrderUnitIds = new Set(); this.__player = "atk"; this.__planning = false;',
  '    this.__trace = []; this.__checks = []; this.__towerKill = null; this.__cb = null;',
  '    this._counterBudget = { beginTurn: () => { self.__trace.push("counter"); } };',
  '    this.hint = { set textContent(v) { self.__trace.push("hint:" + self.roundNo); } };',
  '  }',
  '  _armyMoraleRatio(side) { return this.__ratio[side]; }',
  '  _startRout(ru) { this.__ratio = { ...this.__ratioAfterRout }; }',
  '  _finishDraw(reason, cap) { this.__draw = { reason, cap }; this.finished = true; }',
  '  _showEndScreen(w) { this.__shown = w; }',
  '  _battleUnitsForMapExport() { return []; }',
  '  _playerControlSide() { return this.__player; }',
  '  _fireSiegeTowers() { this.__trace.push("towers"); if (this.__towerKill) this.__towerKill.dead = true; }',
  '  _movementPointsFor(bu) { return bu.__mp; }',
  '  _updateBattlePhaseBanner(u) { this.__trace.push("banner:" + (u ? u.__tag : "none")); }',
  '  _beginAutoBatchPhase(side, a) { this.__trace.push("auto:" + side + ":" + a.map(u => u.__tag).join(",")); }',
  '  _refreshQueuedOrderVisuals() { this.__trace.push("refreshQ"); }',
  '  _activateUnit(u, cb) { this.__trace.push("activate:" + u.__tag); this.__cb = cb; }',
  '  _isUnitDoctrineAuto(u) { return u.__doctrine; }',
  '  _schedule(ms, cb) {',
  '    const step = cb.toString().includes("_beginTurn") ? "begin" : "act";',
  '    this.__trace.push("sched:" + ms + ":" + step + ":" + (this.__planning ? "plan" : "q"));',
  '    if (this.__planning) cb();',
  '  }',
  '  _checkEnd() {',
  '    const caller = (new Error().stack.split("\\n")[2] || "");',
  '    const site = caller.includes("_beginTurn") ? "begin" : "activate";',
  '    const aliveFlags = this._aliveFlags();',
  '    const pre = {',
  '      stalled: this._stalled, aliveA: aliveFlags[0], aliveD: aliveFlags[1], isSiege: this._isSiegeFlag(),',
  '      wallEverBreached: this.wallEverBreached, totalDead: this._totalDeadCount(),',
  '      ratioA: this.__ratio.atk, ratioD: this.__ratio.def, roundNo: this.roundNo,',
  '      noBreachCap: this.siegeNoBreachMaxRounds,',
  '      hpA: this.atk.map(u => u.bu.hp), hpD: this.def.map(u => u.bu.hp),',
  '    };',
  '    const ret = this._checkEndPin();',
  '    const w = this._endWinner === "atakujacy" ? "atk" : "def";',
  '    const outcome = !ret ? "continue" : (this.__draw ? "draw" : "ended:" + w);',
  '    this.__checks.push({ site, ...pre, ratioAAtCap: this.__ratio.atk, ratioDAtCap: this.__ratio.def, outcome });',
  '    this.__trace.push("check:" + (site === "begin" ? "begin" : "activate") + ":" + outcome);',
  '    return ret;',
  '  }',
  methodSrc,
  derivedSrc,
  '}',
].join('\n');

const jsSrc = stripTypeScriptTypes(classSrc, { mode: 'strip' });
const Harness = new Function(jsSrc + '\nreturn Harness;')();

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
const randInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const HP_POOL = [0, 0, 1, 5, 12.5, 40, 100, -3, 0.5, NaN, Infinity];
const MP_POOL = [0, 1, 2, 3, 4.5, 6, NaN, Infinity];
const hpVal = () => (rnd() < 0.3 ? pick(HP_POOL) : Math.round(rnd() * 200) / 2);
const mpVal = () => (rnd() < 0.2 ? pick(MP_POOL) : Math.round(rnd() * 80) / 10);
const RATIO_POOL = [0, 0.1, 0.25, 0.3, 0.5, 1, NaN];
const ratioVal = () => (rnd() < 0.4 ? pick(RATIO_POOL) : Math.round(rnd() * 1000) / 1000);
const CAP_POOL = [1, 2, 150, 400];

function mkUnit(side, idx, id) {
  const tag = `${side}#${idx}`;
  const mp = mpVal();
  return {
    id,
    side,
    __tag: tag,
    __mp: mp,
    __doctrine: rnd() < 0.2,
    bu: { id, hp: hpVal(), __mp: mp },
    morale: Math.round(rnd() * 100),
    fleeMorale: pick([0, 20, 35, 50]),
    moveLeft: Math.round(rnd() * 30) / 10,
    neverRout: rnd() < 0.1,
    dead: rnd() < 0.2,
    fadingOut: rnd() < 0.1,
    routed: rnd() < 0.1,
    removed: rnd() < 0.05,
    acted: rnd() < 0.3,
    playerOrder: { type: rnd() < 0.5 ? 'none' : 'move' },
    __withdraw: false,
  };
}

const tagOf = (u) => u.__tag;
const refOf = (h, tag) => {
  const [side, idx] = tag.split('#');
  return h[side][Number(idx)];
};

function snapshotUnits(h, arr) {
  return arr.map((u) => ({
    id: u.id,
    morale: u.morale,
    fleeMorale: u.fleeMorale,
    moveLeft: u.moveLeft,
    neverRout: u.neverRout,
    dead: u.dead,
    fadingOut: u.fadingOut,
    routed: u.routed,
    removed: u.removed,
    acted: u.acted,
    hp: u.bu.hp,
  }));
}

function serializeState(h) {
  return {
    atk: snapshotUnits(h, h.atk),
    def: snapshotUnits(h, h.def),
    turnOrder: h.turnOrder.map(tagOf),
    turnIdx: h.turnIdx,
    roundNo: h.roundNo,
    finished: h.finished,
    busy: h.busy,
    queued: [...h._queuedOrderUnitIds].sort((x, y) => x - y),
  };
}

// --- Generowanie sekwencji ---
const N_SEQ = 400;
const sequences = [];
let idBase = 1000;
for (let s = 0; s < N_SEQ; s++) {
  const h = new Harness();
  h.__planning = rnd() < 0.1;
  h.__player = rnd() < 0.5 ? 'atk' : 'def';
  h._manualMode = rnd() < 0.4;
  h.siegeWallCol = rnd() < 0.4 ? 3 : -1;
  h.roundNo = rnd() < 0.5 ? 0 : randInt(0, 400);
  h.siegeNoBreachMaxRounds = pick(CAP_POOL);
  h.wallEverBreached = rnd() < 0.4;
  h.finished = rnd() < 0.03;
  h._battleAwaitingOrders = rnd() < 0.04;
  h._autoBattleSuspended = rnd() < 0.1;
  h.busy = rnd() < 0.5;
  h._stalled = rnd() < 0.5;
  h.__ratio = { atk: ratioVal(), def: ratioVal() };
  h.__ratioAfterRout = { atk: ratioVal(), def: ratioVal() };

  const nA = randInt(0, 4);
  const nD = randInt(0, 4);
  const base = idBase;
  idBase += 100;
  for (let i = 0; i < nA; i++) h.atk.push(mkUnit('atk', i, base + i));
  for (let i = 0; i < nD; i++) h.def.push(mkUnit('def', i, base + 50 + i));
  // Kolejka wyjsciowa z poprzedniej tury (czesc sekwencji zaczyna od _activateNext z niepusta kolejka).
  const all = [...h.atk.map((u, i) => ({ side: 'atk', i })), ...h.def.map((u, i) => ({ side: 'def', i }))];
  if (rnd() < 0.5 && all.length > 0) {
    const shuffled = all.sort(() => rnd() - 0.5);
    const take = randInt(1, shuffled.length);
    h.turnOrder = shuffled.slice(0, take).map((r) => refOf(h, `${r.side}#${r.i}`));
    h.turnIdx = randInt(0, take);
  }
  // Zestaw kluczy kolejki recznych rozkazow.
  for (const u of [...h.atk, ...h.def]) if (rnd() < 0.3) h._queuedOrderUnitIds.add(u.id);

  const initial = {
    player: h.__player,
    manual: h._manualMode,
    siegeWallCol: h.siegeWallCol,
    roundNo: h.roundNo,
    noBreachCap: h.siegeNoBreachMaxRounds,
    wallEverBreached: h.wallEverBreached,
    finished: h.finished,
    awaiting: h._battleAwaitingOrders,
    suspended: h._autoBattleSuspended,
    busy: h.busy,
    planning: h.__planning,
    queued: [...h._queuedOrderUnitIds].sort((x, y) => x - y),
    atk: h.atk.map(unitInput),
    def: h.def.map(unitInput),
    turnOrder: h.turnOrder.map(tagOf),
    turnIdx: h.turnIdx,
  };

  const ops = [];
  const nOps = randInt(2, 14);
  let pending = false;
  for (let k = 0; k < nOps; k++) {
    let op;
    if (pending) op = 'done';
    else if (k === 0) op = rnd() < 0.5 ? 'begin' : 'activate';
    else op = rnd() < 0.1 ? 'begin' : 'activate';

    // Tylko w trybie oblezenia wieze moga zabic jednostke przed budowa kolejki.
    const towerTarget = h.siegeWallCol >= 0 && rnd() < 0.15 ? pick([...h.atk, ...h.def]) : null;
    h.__towerKill = towerTarget && !towerTarget.dead ? towerTarget : null;
    h.__trace = [];
    h.__checks = [];
    h.__cb = null;

    if (op === 'begin') h._beginTurn();
    else if (op === 'activate') h._activateNext();
    else {
      // 'done': callback _activateUnit z poprzedniej operacji (zapamietany w __pendingCb).
      const cb = h.__pendingCb;
      h.__pendingCb = null;
      cb();
    }
    // Callback _activateUnit po tej operacji (oczekuje na 'done').
    h.__pendingCb = h.__cb;
    pending = h.__pendingCb !== null;
    ops.push({
      op,
      towerKill: h.__towerKill ? h.__towerKill.__tag : null,
      trace: [...h.__trace],
      checks: h.__checks,
      state: serializeState(h),
    });
  }
  sequences.push({ initial, ops });
}

function unitInput(u) {
  return {
    id: u.id,
    tag: u.__tag,
    hp: u.bu.hp,
    morale: u.morale,
    fleeMorale: u.fleeMorale,
    moveLeft: u.moveLeft,
    neverRout: u.neverRout,
    dead: u.dead,
    fadingOut: u.fadingOut,
    routed: u.routed,
    removed: u.removed,
    acted: u.acted,
    mp: u.__mp,
    playerNone: u.playerOrder.type === 'none',
    doctrine: u.__doctrine,
  };
}

// JSON bez NaN/Infinity: wartosci nieskonczone jako napisy.
const jsonReplacer = (_k, v) => (typeof v === 'number' && !Number.isFinite(v) ? String(v) : v);

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'p6_siege_tactics_turnseq_vectors');
mkdirSync(outDir, { recursive: true });
const payload = {
  source: 'gra/src/battle/battleScene.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75: _beginTurn 5631-5689, _activateNext 5979-6030, _checkEnd 10153-10240, _roundCapVerdict 9449-9464, _updateStallWatch 5568-5581, _isPlayerSide/_playerRoster/_enemyRoster 12420-12430 (wykonanie tekstu pinu, stuby efektow sceny)',
  generator: 'rust-port/engine/tests/p6_siege_tactics_turnseq_gen.mjs (node ' + process.version + ', seed 217)',
  fragmentSha256: fragmentDigest,
  sequences,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(payload, jsonReplacer, 1) + '\n');
const opCount = sequences.reduce((n, s) => n + s.ops.length, 0);
console.log('sequences', sequences.length, 'ops', opCount);
