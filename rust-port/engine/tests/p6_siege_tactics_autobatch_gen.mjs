// P6 SIEGE-TAKTYKA K5g: generator wektorow faz AUTO przez WYKONANIE tekstu pinu (gra/src/battle/battleScene.ts + autoBatchPhase.ts, pin 07d2fbd72).
// Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_autobatch_gen.mjs (Node >= 22.13, module.stripTypeScriptTypes).
//
// Wycinane z pinu po numerach linii (asercje tresci poczatku; koniec = pierwsza linia `  }`), wykonywane po usunieciu typow TS:
//   _beginAutoBatchTurnFromCurrentState 5696, _beginAutoBatchPhase 5707, _snapshotAutoBatchIntents 5752,
//   _cloneForAutoBatchPlanning 5822, _disposeAutoBatchPlanningRoster 5847, _launchAutoBatchResolution 5865,
//   _resolveAutoBatchAttack 5907, _resolveAutoBatchMovement 5924, _finishAutoBatchPhase 5961, _haltAutoBattleTurn 17333,
//   _schedule 9595 (pod nazwa _schedulePin, owijany o slad), _drainTimers 9616, _enemiesOf 8291, _findUnitById 12392,
//   _now 9403; stale ACT_GAP_MS 1014, TURN_GAP_MS 1023, BF_COLS 661, cellKey 1797;
//   autoBatchPhase.ts (caly plik, strazowany SHA-256 jak w K5g0).
// Stuby (efekty sceny / wstrzykniete funkcje, nie logika faz): THREE, _updateBattlePhaseBanner, _checkEnd (skrypt),
//   _beginTurn, _activateUnit (planowanie wg skryptu), _doMove, _doAttack (obrazenia wstrzykniete), _fleeStep,
//   _removeUnitFromScene, _shakeAlliesOnLoss, _applyTerrainRange, _passableForUnit, _canStrikeTargetFrom.
// Callbacki asynchroniczne (`done` animacji) sa odkladane do kolejki __pending; wektor decyduje o ich kolejnosci (op `cb`).
//
// Straznik zrodla: SHA-256 wycietych fragmentow (FRAGMENT_SHA256) i pliku autoBatchPhase.ts. Zmiana pinu -> blad generatora.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/battleScene.ts';
const PHASE_PATH = 'gra/src/battle/autoBatchPhase.ts';
const PHASE_SHA256 = 'eb6f7d555c498755bad6f6d523f0fe49907df83cce78f22cef6451ea5e80b0e8';
const FRAGMENT_SHA256 = 'e483d86e0cebf93a3fd3817ab50b9bc226c6d4d7880ecdcbc5ecdb239f31852e';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const show = (path) => execFileSync('git', ['show', `${PIN}:${path}`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const pinLines = show(PIN_PATH).split('\n');
const phaseSource = show(PHASE_PATH);
const phaseDigest = createHash('sha256').update(phaseSource).digest('hex');
if (phaseDigest !== PHASE_SHA256) throw new Error(`autoBatchPhase.ts nie zgadza sie z hashem: ${phaseDigest}`);

const L = (a, b) => pinLines.slice(a - 1, b).join('\n');
const LINE = (n) => pinLines[n - 1];
function expectLine(n, re) {
  if (!re.test(LINE(n))) throw new Error(`pin ${n}: oczekiwano ${re}, jest: ${LINE(n)}`);
}
function methodEnd(start) {
  for (let n = start + 1; n < start + 200; n++) if (/^  \}$/.test(LINE(n))) return n;
  throw new Error(`brak konca metody od ${start}`);
}

expectLine(1014, /^const ACT_GAP_MS\s+= 160;/);
expectLine(1023, /^const TURN_GAP_MS\s+= 240;/);
expectLine(661, /^const BF_COLS = 68;/);
expectLine(1797, /^function cellKey\(col: number, row: number\): string \{ return col \+ ',' \+ row; \}$/);
expectLine(9403, /^  private _now\(\): number \{ return this\.vNow; \}$/);

const METHODS = [
  [5696, /^  private _beginAutoBatchTurnFromCurrentState\(\): void \{$/],
  [5707, /^  private _beginAutoBatchPhase\(side: AutoBatchPhase, units: RuntimeBattleUnit\[\]\): void \{$/],
  [5752, /^  private _snapshotAutoBatchIntents\(side: AutoBatchPhase, units: RuntimeBattleUnit\[\]\): AutoBatchIntent\[\] \{$/],
  [5822, /^  private _cloneForAutoBatchPlanning\(source: RuntimeBattleUnit\): RuntimeBattleUnit \{$/],
  [5847, /^  private _disposeAutoBatchPlanningRoster\(roster: RuntimeBattleUnit\[\]\): void \{$/],
  [5865, /^  private _launchAutoBatchResolution\(resolution: AutoBatchResolution, token: number\): void \{$/],
  [5907, /^  private _resolveAutoBatchAttack\($/],
  [5924, /^  private _resolveAutoBatchMovement\($/],
  [5961, /^  private _finishAutoBatchPhase\(token: number\): void \{$/],
  [17333, /^  private _haltAutoBattleTurn\(suspendInFlight = true\): void \{$/],
  [9595, /^  private _schedule\(ms: number, cb: \(\) => void\): void \{$/],
  [9616, /^  private _drainTimers\(\): void \{$/],
  [8291, /^  private _enemiesOf\(ru: RuntimeBattleUnit\): RuntimeBattleUnit\[\] \{$/],
  [12392, /^  private _findUnitById\(id: string\): RuntimeBattleUnit \| undefined \{$/],
];
const methodTexts = METHODS.map(([start, re]) => {
  expectLine(start, re);
  return L(start, methodEnd(start));
});
const fragments = [L(1014, 1014), L(1023, 1023), L(661, 661), L(1797, 1797), L(9403, 9403), ...methodTexts];
const fragmentDigest = createHash('sha256').update(fragments.join('\n---\n')).digest('hex');
if (FRAGMENT_SHA256 !== 'PLACEHOLDER' && fragmentDigest !== FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu nie zgadzaja sie z hashem: ${fragmentDigest}`);
}
console.error('fragment sha256', fragmentDigest);

const methodSrc = methodTexts
  .join('\n')
  .replace('private _schedule(ms: number, cb: () => void): void {', '_schedulePin(ms: number, cb: () => void): void {');
if (!methodSrc.includes('_schedulePin(')) throw new Error('rename _schedule nie zadzialal');

const phaseJs = phaseSource.replace(/^export /gm, '');

const classSrc = [
  phaseJs,
  L(1014, 1014),
  L(1023, 1023),
  L(661, 661),
  L(1797, 1797),
  'const THREE = {',
  '  Mesh: class { constructor(g, m) { this.geometry = g; this.material = m; } },',
  '  BoxGeometry: class { dispose() {} },',
  '  MeshBasicMaterial: class { dispose() {} },',
  '  Group: class {},',
  '};',
  'class Harness {',
  '  constructor() {',
  '    this.atk = []; this.def = []; this.occByKey = new Map(); this.vTimers = []; this.vNow = 0; this.vTimerSeq = 0;',
  '    this.finished = false; this._manualMode = false; this._autoBattleSuspended = false; this._battleAwaitingOrders = false;',
  '    this.busy = false; this.siegeWallCol = -1; this._autoBatchPhase = null; this._autoBatchResolutions = [];',
  '    this._autoBatchPending = 0; this._autoBatchToken = 0; this._autoBatchPlanning = null;',
  '    this.log = []; this.routedUnits = [];',
  '    this.__trace = []; this.__pending = []; this.__plans = {}; this.__blocked = new Set(); this.__range = {};',
  '    this.__dmg = {}; this.__endScript = []; this.__endIdx = 0; this.__routOnHit = new Set(); this.__bannerFlags = [];',
  '  }',
  '  _updateBattlePhaseBanner(u) {',
  '    this.__trace.push("banner:" + (u ? u.bu.id : "none"));',
  '    for (const f of this.__bannerFlags) {',
  '      const t = this._findUnitById(f.id);',
  '      if (t) { t[f.flag] = true; if (f.flag === "dead") { const k = cellKey(t.q, t.r); if (this.occByKey.get(k) === t) this.occByKey.delete(k); } }',
  '    }',
  '    this.__bannerFlags = [];',
  '  }',
  '  _beginTurn() { this.__trace.push("beginTurn"); }',
  '  _checkEnd() {',
  '    if (this.finished) return true;',
  '    const r = this.__endScript[this.__endIdx++] === true;',
  '    if (r) this.finished = true;',
  '    this.__trace.push("check:" + r);',
  '    return r;',
  '  }',
  '  _schedule(ms, cb) {',
  '    const before = this.vTimers.length;',
  '    this._schedulePin(ms, cb);',
  '    const kind = cb.toString().includes("_beginTurn") ? "begin" : "finish";',
  '    this.__trace.push("sched:" + ms + ":" + kind + ":" + (this.vTimers.length > before));',
  '  }',
  '  _passableForUnit(ru, col, row) { return !this.__blocked.has(cellKey(col, row)); }',
  '  _canStrikeTargetFrom(attacker, col, row, target) {',
  '    const range = this.__range[attacker.bu.id] ?? 1;',
  '    return Math.abs(col - target.q) + Math.abs(row - target.r) <= range;',
  '  }',
  '  _applyTerrainRange(a) { this.__trace.push("terrain:" + a.bu.id); }',
  '  _fleeStep(ru, done) { this.__trace.push("flee:" + ru.bu.id); this.__pending.push(done); }',
  '  _removeUnitFromScene(ru) {',
  '    this.__trace.push("remove:" + ru.bu.id);',
  '    ru.removed = true;',
  '    const k = cellKey(ru.q, ru.r);',
  '    if (this.occByKey.get(k) === ru) this.occByKey.delete(k);',
  '  }',
  '  _shakeAlliesOnLoss(ru) { this.__trace.push("shake:" + ru.bu.id); }',
  '  _doMove(ru, col, row, done) {',
  '    if (this._autoBatchPlanning) {',
  '      const intent = this._autoBatchPlanning.intent;',
  '      this.occByKey.delete(cellKey(ru.q, ru.r));',
  '      this.occByKey.set(cellKey(col, row), ru);',
  '      ru.q = col; ru.r = row;',
  '      if (intent.kind !== "attack") intent.kind = "move";',
  '      intent.steps.push({ col, row });',
  '      done();',
  '      return;',
  '    }',
  '    this.__trace.push("move:" + ru.bu.id + ":" + (col === 0 ? 0 : col) + ":" + (row === 0 ? 0 : row));',
  '    this.occByKey.delete(cellKey(ru.q, ru.r));',
  '    this.occByKey.set(cellKey(col, row), ru);',
  '    ru.q = col; ru.r = row;',
  '    this.__pending.push(done);',
  '  }',
  '  _doAttack(attacker, defender, done) {',
  '    if (this._autoBatchPlanning) {',
  '      const intent = this._autoBatchPlanning.intent;',
  '      intent.kind = "attack";',
  '      intent.targetId = defender.bu.id;',
  '      done();',
  '      return;',
  '    }',
  '    this.__trace.push("attack:" + attacker.bu.id + ":" + defender.bu.id);',
  '    defender.bu.hp = defender.bu.hp - (this.__dmg[attacker.bu.id] ?? 10);',
  '    if (this.__routOnHit.has(defender.bu.id)) defender.routed = true;',
  '    if (defender.bu.hp <= 0) {',
  '      defender.dead = true;',
  '      const k = cellKey(defender.q, defender.r);',
  '      if (this.occByKey.get(k) === defender) this.occByKey.delete(k);',
  '    }',
  '    this.__pending.push(done);',
  '  }',
  '  _activateUnit(clone, cb) {',
  '    const plan = this.__plans[clone.bu.id];',
  '    if (!plan) { cb(); return; }',
  '    if (plan.special) { clone.q = plan.special[0]; clone.r = plan.special[1]; cb(); return; }',
  '    for (const s of plan.steps) this._doMove(clone, s[0], s[1], () => {});',
  '    if (plan.attack !== null && plan.attack !== undefined) {',
  '      const t = this._findUnitById(plan.attack);',
  '      if (t) this._doAttack(clone, t, () => {});',
  '    }',
  '    cb();',
  '  }',
  L(9403, 9403).replace('private _now()', '_now()'),
  methodSrc,
  '}',
  'return Harness;',
].join('\n');

const jsSrc = stripTypeScriptTypes(classSrc.replace(/^return Harness;$/m, 'export const __h = 1;'), { mode: 'strip' })
  .replace('export const __h = 1;', 'return Harness;');
const Harness = new Function(jsSrc)();

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
const cellKey = (col, row) => col + ',' + row; // identyczne z pinem :1797 (strazowane powyzej)

const COORD_ODD = [0, 67, 66, 1, NaN, Infinity, -0];
function coord(max) {
  const roll = rnd();
  if (roll < 0.86) return Math.floor(rnd() * max);
  if (roll < 0.97) return pick([0, 67, 66, 1]);
  return pick(COORD_ODD);
}
const HP_ODD = [0, -1, 0.5, NaN, Infinity];

function mkUnit(side, id) {
  const routed = rnd() < 0.16;
  const unit = {
    id,
    side,
    q: rnd() < 0.86 ? (side === 'atk' ? Math.floor(rnd() * 3) : 2 + Math.floor(rnd() * 4)) : coord(6),
    r: coord(4),
    hp: rnd() < 0.12 ? pick(HP_ODD) : randInt(1, 6) * 10,
    dead: rnd() < 0.07,
    fadingOut: rnd() < 0.05,
    routed,
    removed: rnd() < 0.05,
    acted: rnd() < 0.1,
  };
  // Routed blisko krawedzi domowej: testuje usuniecie przy dotarciu.
  if (routed && rnd() < 0.5) unit.q = side === 'atk' ? pick([0, 1, 0]) : pick([67, 66, 67]);
  return unit;
}

function stepsFrom(unit) {
  const out = [];
  let cur = [unit.q, unit.r];
  const n = randInt(0, 3);
  for (let i = 0; i < n; i++) {
    const roll = rnd();
    let s;
    if (roll < 0.8) {
      const [dc, dr] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
      s = [cur[0] + dc, cur[1] + dr];
    } else if (roll < 0.92) s = [randInt(0, 5), randInt(0, 3)];
    else s = [cur[0], cur[1]];
    out.push(s);
    cur = s;
  }
  return out;
}

function mkPlan(unit, enemies, focused) {
  const roll = focused ? 0.5 : rnd();
  if (roll < 0.12) return null; // brak planu = hold
  if (roll < 0.2) return { steps: [], attack: null, special: [randInt(0, 5), randInt(0, 3)] };
  const plan = { steps: stepsFrom(unit), attack: null, special: null };
  const a = focused ? 0.1 : rnd();
  if (a < 0.6 && enemies.length > 0) {
    const t = pick(enemies);
    plan.attack = t.id;
    if (rnd() < 0.8 && Number.isFinite(t.q) && Number.isFinite(t.r) && Number.isFinite(unit.q) && Number.isFinite(unit.r)) {
      // Kroki ortogonalne w strone celu (najpierw kolumna, potem wiersz), do 3 krokow.
      const steps = [];
      let cur = [unit.q, unit.r];
      for (let i = 0; i < 3; i++) {
        if (cur[0] !== t.q) cur = [cur[0] + Math.sign(t.q - cur[0]), cur[1]];
        else if (cur[1] !== t.r) cur = [cur[0], cur[1] + Math.sign(t.r - cur[1])];
        else break;
        steps.push(cur);
      }
      plan.steps = steps;
    }
  }
  else if (a < 0.5) plan.attack = 'zz';
  else if (a < 0.53) plan.attack = '';
  return plan;
}

const jsonReplacer = (_k, v) => {
  if (typeof v === 'number' && !Number.isFinite(v)) return String(v);
  if (typeof v === 'number' && Object.is(v, -0)) return 0;
  return v;
};

function ruFromInput(u) {
  return {
    bu: { id: u.id, hp: u.hp, stats: { x: 1 } },
    side: u.side,
    q: u.q,
    r: u.r,
    dead: u.dead,
    fadingOut: u.fadingOut,
    routed: u.routed,
    removed: u.removed,
    acted: u.acted,
    moveLeft: 3,
    playerOrder: { type: 'none' },
    formationOffset: null,
    unitTargetPriorities: undefined,
    hpBarFg: null, hpBarBg: null, hpBarGroup: null, moraleBarFg: null, moraleBarBg: null, ammoBarFg: null, ammoBarBg: null,
    mats: [], perTokenGeos: [],
  };
}

function serializeState(h) {
  const units = [...h.atk, ...h.def].map((u) => ({
    id: u.bu.id, q: u.q, r: u.r, hp: u.bu.hp, dead: u.dead, fadingOut: u.fadingOut, routed: u.routed, removed: u.removed, acted: u.acted,
  }));
  const occ = [...h.occByKey.entries()].map(([k, u]) => k + '|' + u.bu.id).sort();
  const timers = h.vTimers
    .map((t) => ({ due: t.due, id: t.id, kind: t.cb.toString().includes('_beginTurn') ? 'begin' : 'finish' }))
    .sort((a, b) => a.id - b.id);
  return {
    units,
    occ,
    timers,
    vNow: h.vNow,
    token: h._autoBatchToken,
    phase: h._autoBatchPhase,
    pendingCount: h._autoBatchPending,
    resolutions: h._autoBatchResolutions.map((r) => ({
      unitId: r.unitId, side: r.side, kind: r.kind, steps: r.steps, targetId: r.targetId ?? null, blocked: r.blocked === true,
    })),
    finished: h.finished,
    manual: h._manualMode,
    suspended: h._autoBattleSuspended,
    awaiting: h._battleAwaitingOrders,
    busy: h.busy,
    deferred: h.__pending.length,
  };
}

const N_SEQ = 420;
// Sekwencje kierowane (nadpisuja pierwsze N_SEQ): rozbita jednostka dochodzi do krawedzi domowej (usuniecie ze sceny).
const U = (id, side, q, r) => ({ id, side, q, r, hp: 30, dead: false, fadingOut: false, routed: false, removed: false, acted: false });
const DIRECTED = [
  {
    units: [U('a0', 'atk', 1, 0), U('d0', 'def', 5, 2)],
    plans: { a0: { steps: [[0, 0]], attack: null, special: null } },
    bannerFlags: [{ id: 'a0', flag: 'routed' }],
    ops: [{ op: 'begin', side: 'atk', units: ['a0'] }, { op: 'drain' }, { op: 'advance', ms: 160 }, { op: 'drain' }],
  },
  {
    units: [U('a0', 'atk', 1, 2), U('d0', 'def', 66, 0)],
    plans: { d0: { steps: [[67, 0]], attack: null, special: null } },
    bannerFlags: [{ id: 'd0', flag: 'routed' }],
    ops: [{ op: 'begin', side: 'def', units: ['d0'] }, { op: 'drain' }, { op: 'advance', ms: 160 }, { op: 'drain' }],
  },
];
const sequences = [];
for (let s = 0; s < N_SEQ; s++) {
  const focused = s % 3 === 0;
  const h = new Harness();
  const nA = randInt(1, 4);
  const nD = randInt(1, 4);
  const inputs = [];
  for (let i = 0; i < nA; i++) inputs.push(mkUnit('atk', 'a' + i));
  for (let i = 0; i < nD; i++) inputs.push(mkUnit('def', 'd' + i));
  for (const u of inputs) (u.side === 'atk' ? h.atk : h.def).push(ruFromInput(u));
  // Zajetosc: wiekszosc jednostek zajmuje wlasny kafelek (pozniejsze nadpisuje, jak Map.set); czesc nie (`occupies:false`),
  // plus wpisy "duchy" wskazujace jednostke na cudzym kafelku.
  const occInput = [];
  for (const u of inputs) {
    if (rnd() < 0.88) occInput.push({ col: u.q, row: u.r, id: u.id });
  }
  if (rnd() < 0.3) {
    const g = pick(inputs);
    occInput.push({ col: randInt(0, 5), row: randInt(0, 3), id: g.id });
  }
  for (const e of occInput) h.occByKey.set(cellKey(e.col, e.row), [...h.atk, ...h.def].find((x) => x.bu.id === e.id));

  const plans = {};
  for (const u of inputs) {
    const enemies = inputs.filter((o) => o.side !== u.side);
    const p = mkPlan(u, enemies, focused);
    if (p) plans[u.id] = p;
  }
  h.__plans = plans;
  const blocked = [];
  const nBlocked = focused ? 0 : randInt(0, 3);
  for (let i = 0; i < nBlocked; i++) blocked.push([randInt(0, 5), randInt(0, 3)]);
  h.__blocked = new Set(blocked.map((b) => cellKey(b[0], b[1])));
  const range = {};
  const dmg = {};
  for (const u of inputs) {
    if (focused) range[u.id] = pick([2, 3, 5]);
    else if (rnd() < 0.8) range[u.id] = pick([1, 2, 3, 3, 5, 0]);
    if (rnd() < 0.6) dmg[u.id] = pick([5, 10, 25, 100]);
  }
  const routOnHit = inputs.filter(() => rnd() < 0.25).map((u) => u.id);
  h.__routOnHit = new Set(routOnHit);
  const bannerFlags = rnd() < 0.3
    ? Array.from({ length: randInt(1, 2) }, () => ({ id: pick(inputs).id, flag: pick(['routed', 'routed', 'dead', 'removed']) }))
    : [];
  h.__bannerFlags = bannerFlags.map((f) => ({ ...f }));
  h.__range = range;
  h.__dmg = dmg;
  const endScript = Array.from({ length: randInt(0, 6) }, () => rnd() < (focused ? 0.08 : 0.18));
  h.__endScript = endScript;
  h._manualMode = !focused && rnd() < 0.04;
  h._autoBattleSuspended = !focused && rnd() < 0.04;
  h.finished = !focused && rnd() < 0.02;
  h._battleAwaitingOrders = !focused && rnd() < 0.03;
  h.siegeWallCol = !focused && rnd() < 0.12 ? 3 : -1;
  h.vNow = rnd() < 0.3 ? randInt(0, 500) : 0;
  h._autoBatchToken = rnd() < 0.3 ? randInt(0, 5) : 0;

  const spec = DIRECTED[s];
  if (spec) {
    h.atk.length = 0; h.def.length = 0; h.occByKey.clear();
    inputs.length = 0; inputs.push(...spec.units);
    for (const u of inputs) (u.side === 'atk' ? h.atk : h.def).push(ruFromInput(u));
    occInput.length = 0;
    for (const u of inputs) { occInput.push({ col: u.q, row: u.r, id: u.id }); h.occByKey.set(cellKey(u.q, u.r), [...h.atk, ...h.def].find((x) => x.bu.id === u.id)); }
    for (const k of Object.keys(plans)) delete plans[k];
    Object.assign(plans, spec.plans);
    h.__plans = plans;
    blocked.length = 0; h.__blocked = new Set();
    for (const k of Object.keys(range)) delete range[k];
    for (const k of Object.keys(dmg)) delete dmg[k];
    h.__range = range; h.__dmg = dmg;
    routOnHit.length = 0; h.__routOnHit = new Set();
    bannerFlags.length = 0; bannerFlags.push(...spec.bannerFlags); h.__bannerFlags = bannerFlags.map((f) => ({ ...f }));
    endScript.length = 0; h.__endScript = endScript;
    h._manualMode = false; h._autoBattleSuspended = false; h.finished = false; h._battleAwaitingOrders = false; h.siegeWallCol = -1;
    h.vNow = 0; h._autoBatchToken = 0;
  }
  const initial = {
    units: inputs,
    occ: occInput,
    plans,
    blocked,
    range,
    dmg,
    routOnHit,
    bannerFlags,
    endScript,
    manual: h._manualMode,
    suspended: h._autoBattleSuspended,
    finished: h.finished,
    awaiting: h._battleAwaitingOrders,
    siegeWallCol: h.siegeWallCol,
    vNow: h.vNow,
    token: h._autoBatchToken,
  };

  const ops = [];
  const nOps = spec ? spec.ops.length : focused ? randInt(10, 26) : randInt(4, 22);
  for (let k = 0; k < nOps; k++) {
    const roll = rnd();
    let op;
    if (spec) op = { ...spec.ops[k] };
    else if (focused && s % 9 === 0 && k === 1) op = { op: 'set', key: 'finished', value: true };
    else if (focused && k % 5 !== 0) op = [{ op: 'drain' }, { op: 'advance', ms: 160 }, { op: 'drain' }, { op: 'advance', ms: 240 }][k % 5 - 1];
    else if (k === 0 || roll < 0.12 || (focused && k % 5 === 0 && roll < 0.5)) {
      const side = rnd() < 0.7 ? 'atk' : 'def';
      const roster = side === 'atk' ? h.atk : h.def;
      const idsAll = roster.map((u) => u.bu.id);
      let ids = idsAll.filter(() => rnd() < 0.85);
      if (rnd() < 0.05) ids.push(rnd() < 0.5 ? (side === 'atk' ? 'd0' : 'a0') : 'ghost');
      if (rnd() < 0.06) ids.push('ghost');
      const unitsResolved = ids.filter((id) => id === 'ghost' || h._findUnitById(id));
      op = { op: 'begin', side, units: unitsResolved };
    } else if (roll < 0.18) op = { op: 'fromState' };
    else if (roll < 0.58) op = { op: 'cb', pick: randInt(0, 7) };
    else if (roll < 0.7) op = { op: 'drain' };
    else if (roll < 0.82) op = { op: 'advance', ms: pick([0, 100, 160, 240, 400, 1000]) };
    else if (roll < 0.87) op = { op: 'halt', suspend: rnd() < 0.5 };
    else if (roll < 0.89) op = { op: 'finishTok', delta: pick([0, 0, -1, 1]) };
    else if (roll < 0.92) op = { op: 'unitFlag', id: pick(inputs).id, flag: pick(['routed', 'dead', 'acted']) };
    else op = { op: 'set', key: pick(['manual', 'suspended', 'finished', 'awaiting']), value: rnd() < 0.5 };

    h.__trace = [];
    if ((op.op === 'begin' || op.op === 'fromState') && h.__bannerFlags.length === 0 && rnd() < 0.25) {
      op.bannerFlags = Array.from({ length: randInt(1, 2) }, () => ({ id: pick(inputs).id, flag: pick(['routed', 'routed', 'dead', 'removed']) }));
      h.__bannerFlags = op.bannerFlags.map((f) => ({ ...f }));
    }
    switch (op.op) {
      case 'begin':
        h._beginAutoBatchPhase(op.side, op.units.map((id) => h._findUnitById(id) ?? { bu: { id } }));
        break;
      case 'fromState':
        h._beginAutoBatchTurnFromCurrentState();
        break;
      case 'cb': {
        if (h.__pending.length > 0) {
          const i = op.pick % h.__pending.length;
          const cb = h.__pending.splice(i, 1)[0];
          op.index = i;
          cb();
        } else op.index = -1;
        break;
      }
      case 'drain': {
        let guard = 0;
        while (h.__pending.length > 0 && guard++ < 300) h.__pending.shift()();
        break;
      }
      case 'advance':
        h.vNow += op.ms;
        h._drainTimers();
        break;
      case 'halt':
        h._haltAutoBattleTurn(op.suspend);
        break;
      case 'finishTok':
        h._finishAutoBatchPhase(h._autoBatchToken + op.delta);
        break;
      case 'unitFlag': {
        const u = h._findUnitById(op.id);
        u[op.flag] = true;
        if (op.flag === 'dead') {
          const k = cellKey(u.q, u.r);
          if (h.occByKey.get(k) === u) h.occByKey.delete(k);
        }
        break;
      }
      case 'set':
        if (op.key === 'manual') h._manualMode = op.value;
        else if (op.key === 'suspended') h._autoBattleSuspended = op.value;
        else if (op.key === 'finished') h.finished = op.value;
        else h._battleAwaitingOrders = op.value;
        break;
      default:
        throw new Error('op');
    }
    ops.push({ ...op, trace: [...h.__trace], state: serializeState(h) });
  }
  sequences.push({ initial, ops });
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'p6_siege_tactics_autobatch_vectors');
mkdirSync(outDir, { recursive: true });
const payload = {
  source: 'gra/src/battle/battleScene.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75: _beginAutoBatchTurnFromCurrentState 5696, _beginAutoBatchPhase 5707, _snapshotAutoBatchIntents 5752, _cloneForAutoBatchPlanning 5822, _disposeAutoBatchPlanningRoster 5847, _launchAutoBatchResolution 5865, _resolveAutoBatchAttack 5907, _resolveAutoBatchMovement 5924, _finishAutoBatchPhase 5961, _haltAutoBattleTurn 17333, _schedule 9595, _drainTimers 9616, _enemiesOf 8291, _findUnitById 12392 + autoBatchPhase.ts (wykonanie tekstu pinu, stuby efektow sceny)',
  generator: 'rust-port/engine/tests/p6_siege_tactics_autobatch_gen.mjs (node ' + process.version + ', seed 217)',
  fragmentSha256: fragmentDigest,
  phaseSha256: phaseDigest,
  sequences,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(payload, jsonReplacer) + '\n');
const opCount = sequences.reduce((n, s) => n + s.ops.length, 0);
console.log('sequences', sequences.length, 'ops', opCount);
