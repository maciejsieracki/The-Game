// P6 SIEGE K5DOC-T4c EFEKTY _doMove (dispatch R-RUSTPORT-P6-K5DOC-T4C-DOMOVE, runda 1, Operator):
// generator wektorow dla `do_move_effects` (rust-port/engine/src/domain/siege_tactics_move_effects.rs).
//
// Uruchomienie: node rust-port/engine/tests/p6_k5doc_t4c_gen.mjs
// Wynik: tests/p6_k5doc_t4c_vectors/vectors.json
//
// ORAKUL = WYKONANIE TEKSTU PINA. `_doMove` (battleScene.ts:8685-8776) jest transpilowany przez TypeScript i WYKONYWANY,
// wiec wartosci oczekiwane pochodza z pina, a nie z reimplementacji JS. Razem z nim wykonywane sa (wycinki pina):
//   BROD / BROD_RUCH_MULT        battleScene.ts:982-983
//   cellKey                      battleScene.ts:1797
//   isFordTile                   battleScene.ts:1897-1899
// STUBOWANE (zaleznosci spoza wycinkow, opisane jawnie w wektorze):
//   _siegeMoveRefused(ru,c,r)    (K1, battleScene.ts:7963) -> flaga `refused` z wektora
//   _moveCostForUnit(ru,c,r)     (battleScene.ts:7436, czyta terrainMap) -> koszt `cost` z wektora (null = Infinity)
//   _updateFacing(ru)            (battleScene.ts:8334, #107 zablokowany) -> licznik wywolan
//   _now / _raf / cellToWorld / tileTopY (animacja, UI) -> bez efektu; _raf zapisuje tylko liczbe wywolan
//   BTerrain                     -> stala tekstowa (stub enum), uzyta przez isFordTile z pina
// Zbior brodow z wektora zasila `terrainMap.at`, ktore czyta isFordTile z pina.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/battleScene.ts';
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const pinLines = execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');
const pinRange = (a, b) => pinLines.slice(a - 1, b).join('\n');

// Straznik: pierwsza linia wycinka zawiera oczekiwany naglowek, ostatnia linia oczekiwany koniec.
const FRAGMENTS = {
  brod: { range: [982, 983], head: 'const BROD = ', tail: 'BROD.ruchMult;' },
  cellKey: { range: [1797, 1797], head: 'function cellKey', tail: '}' },
  isFordTile: { range: [1897, 1899], head: 'function isFordTile', tail: '}' },
  doMove: { range: [8685, 8776], head: 'private _doMove(', tail: '  }' },
};
const digests = {};
for (const [name, { range: [a, b], head, tail }] of Object.entries(FRAGMENTS)) {
  const tailOk = tail === '  }' ? pinLines[b - 1] === tail : pinLines[b - 1].includes(tail);
  if (!pinLines[a - 1].includes(head) || !tailOk) {
    throw new Error(`straznik wycinka ${name} (${a}-${b}) nie zgadza sie z pinem`);
  }
  digests[name] = createHash('sha256').update(pinRange(a, b)).digest('hex');
}

// --- Wykonanie pina ---
const TS_JS = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const tsLib = createRequire(import.meta.url)(TS_JS);
const classSrc = [
  'const combatParamsData = { brod: { ruchMult: 0.5 } };',
  pinRange(982, 983),
  pinRange(1797, 1797),
  pinRange(1897, 1899),
  'class P {',
  'constructor() { this.occByKey = new Map(); this.siegeWallCol = 0; this.busy = false; this.finished = false; this._autoBattleSuspended = false; this._autoBatchPlanning = null; this.rafCalls = 0; this.facingCalls = 0; this.refused = false; this.cost = 1; this.terrainMap = { at: (c, r) => (this.fords.has(c + "," + r) ? BTerrain.Ford : BTerrain.Plain) }; this.fords = new Set(); }',
  '_siegeMoveRefused(ru, col, row) { return this.refused; }',
  '_moveCostForUnit(ru, col, row) { return this.cost; }',
  '_updateFacing(ru) { this.facingCalls += 1; }',
  '_now() { return 0; }',
  '_raf(step) { this.rafCalls += 1; }',
  pinRange(8685, 8776),
  '}',
  'module.exports.P = P;',
].join('\n');
const execJs = tsLib.transpileModule(classSrc, {
  compilerOptions: { module: tsLib.ModuleKind.CommonJS, target: tsLib.ScriptTarget.ES2020 },
}).outputText;
const pinMod = { exports: {} };
const BTerrain = { Plain: 'PLAIN', Ford: 'FORD' };
const cellToWorld = (c, r) => ({ x: c, z: r });
const tileTopY = () => 0;
new Function('module', 'exports', 'require', 'BTerrain', 'cellToWorld', 'tileTopY', execJs)(
  pinMod,
  pinMod.exports,
  createRequire(import.meta.url),
  BTerrain,
  cellToWorld,
  tileTopY,
);
const Pin = pinMod.exports.P;

const keyOf = (c, r) => c + ',' + r;

// Uruchamia `_doMove` z pina dla jednego wektora wejsciowego, zwraca wynik w ksztalcie wektora.
const runCase = (inp) => {
  const inst = new Pin();
  inst.refused = inp.refused;
  inst.cost = inp.cost === null ? Infinity : inp.cost;
  inst.fords = new Set(inp.fords.map(([c, r]) => keyOf(c, r)));
  const mover = { id: inp.unit.id, q: inp.unit.q, r: inp.unit.r, moveLeft: inp.unit.move_left,
    group: { position: { set() {} } }, hpBarGroup: { position: { set() {} } } };
  inst.occByKey = new Map(inp.occupancy.map(([c, r, id]) => [keyOf(c, r), id === mover.id ? mover : { id }]));
  inst._autoBatchPlanning = inp.autobatch === null
    ? null
    : { intent: { unit_id: mover.id, kind: inp.autobatch.kind, steps: inp.autobatch.steps.map(([c, r]) => ({ col: c, row: r })) } };
  let doneCalls = 0;
  inst._doMove(mover, inp.col, inp.row, () => { doneCalls += 1; });
  const occupancy = [...inst.occByKey.entries()]
    .map(([k, v]) => { const [c, r] = k.split(',').map(Number); return [c, r, v.id]; })
    .sort((x, y) => x[0] - y[0] || x[1] - y[1] || (x[2] < y[2] ? -1 : x[2] > y[2] ? 1 : 0));
  const intent = inst._autoBatchPlanning === null
    ? null
    : { kind: inst._autoBatchPlanning.intent.kind, steps: inst._autoBatchPlanning.intent.steps.map((s) => [s.col, s.row]) };
  return {
    q: mover.q,
    r: mover.r,
    move_left: mover.moveLeft,
    occupancy,
    facing_calls: inst.facingCalls,
    done: doneCalls > 0,
    intent,
  };
};

// --- Przypadki nazwane (wartosc oczekiwana = wykonanie pina; straznik `want` sprawdza wynik z gory). ---
const U = (q, r, ml) => ({ id: 'u', q, r, move_left: ml });
const base = (over) => ({ unit: U(5, 5, 6), col: 5, row: 6, refused: false, cost: 1, fords: [],
  occupancy: [[5, 5, 'u']], autobatch: null, ...over });
const named = [
  { name: 'zwykly_krok_bezposredni', pin: 'battleScene.ts:8718-8761', input: base({}),
    want: { q: 5, r: 6, move_left: 5, occupancy: [[5, 6, 'u']], facing_calls: 1, done: false, intent: null } },
  { name: 'zajetosc_sasiad_zachowany', pin: 'battleScene.ts:8694-8697', input: base({
      occupancy: [[5, 5, 'u'], [9, 9, 'o1']] }),
    want: { q: 5, r: 6, move_left: 5, occupancy: [[5, 6, 'u'], [9, 9, 'o1']], facing_calls: 1, done: false, intent: null } },
  { name: 'koszt_clamp_dolny_1', pin: 'battleScene.ts:8700', input: base({ cost: 0.4 }),
    want: { q: 5, r: 6, move_left: 5, occupancy: [[5, 6, 'u']], facing_calls: 1, done: false, intent: null } },
  { name: 'koszt_clamp_gorny_99', pin: 'battleScene.ts:8700', input: base({ cost: 150, unit: U(5, 5, 120) }),
    want: { q: 5, r: 6, move_left: 21, occupancy: [[5, 6, 'u']], facing_calls: 1, done: false, intent: null } },
  { name: 'koszt_infinity_daje_99', pin: 'battleScene.ts:8700', input: base({ cost: null, unit: U(5, 5, 120) }),
    want: { q: 5, r: 6, move_left: 21, occupancy: [[5, 6, 'u']], facing_calls: 1, done: false, intent: null } },
  { name: 'brod_na_starcie', pin: 'battleScene.ts:8701-8703', input: base({ cost: 3, fords: [[5, 5]], unit: U(5, 5, 10) }),
    want: { q: 5, r: 6, move_left: 4, occupancy: [[5, 6, 'u']], facing_calls: 1, done: false, intent: null } },
  { name: 'brod_na_celu', pin: 'battleScene.ts:8701-8703', input: base({ cost: 3, fords: [[5, 6]], unit: U(5, 5, 10) }),
    want: { q: 5, r: 6, move_left: 4, occupancy: [[5, 6, 'u']], facing_calls: 1, done: false, intent: null } },
  { name: 'brak_brodu_koszt_pelny', pin: 'battleScene.ts:8701-8703', input: base({ cost: 3, unit: U(5, 5, 10) }),
    want: { q: 5, r: 6, move_left: 7, occupancy: [[5, 6, 'u']], facing_calls: 1, done: false, intent: null } },
  { name: 'moveLeft_nie_ponizej_zera', pin: 'battleScene.ts:8703', input: base({ cost: 3, unit: U(5, 5, 2) }),
    want: { q: 5, r: 6, move_left: 0, occupancy: [[5, 6, 'u']], facing_calls: 1, done: false, intent: null } },
  { name: 'odmowa_moveLeft_zero', pin: 'battleScene.ts:8689-8692', input: base({ refused: true }),
    want: { q: 5, r: 5, move_left: 0, occupancy: [[5, 5, 'u']], facing_calls: 0, done: true, intent: null } },
  { name: 'odmowa_nie_rusza_zajetosci', pin: 'battleScene.ts:8689-8692', input: base({ refused: true, occupancy: [[5, 5, 'u'], [5, 6, 'o1']] }),
    want: { q: 5, r: 5, move_left: 0, occupancy: [[5, 5, 'u'], [5, 6, 'o1']], facing_calls: 0, done: true, intent: null } },
  { name: 'planowanie_hold_staje_sie_move', pin: 'battleScene.ts:8705-8706', input: base({ autobatch: { kind: 'hold', steps: [] } }),
    want: { q: 5, r: 6, move_left: 5, occupancy: [[5, 6, 'u']], facing_calls: 1, done: true,
      intent: { kind: 'move', steps: [[5, 6]] } } },
  { name: 'planowanie_attack_zostaje', pin: 'battleScene.ts:8705', input: base({ autobatch: { kind: 'attack', steps: [[4, 4]] } }),
    want: { q: 5, r: 6, move_left: 5, occupancy: [[5, 6, 'u']], facing_calls: 1, done: true,
      intent: { kind: 'attack', steps: [[4, 4], [5, 6]] } } },
  { name: 'planowanie_brod_i_clamp', pin: 'battleScene.ts:8699-8706', input: base({ cost: 0.2, fords: [[5, 6]], autobatch: { kind: 'move', steps: [] } }),
    want: { q: 5, r: 6, move_left: 4, occupancy: [[5, 6, 'u']], facing_calls: 1, done: true,
      intent: { kind: 'move', steps: [[5, 6]] } } },
];

// --- Losowe przypadki (ziarno deterministyczne; mulberry32). ---
const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = mulberry32(4242);
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (xs) => xs[ri(0, xs.length - 1)];
const COSTS = [0.4, 0.5, 1, 2, 3, 6, 99, 100, 150, null];
const MOVE_LEFT = [0, 0.5, 1, 2, 3, 6, 10, 120];
const randomCase = (i) => {
  const q = ri(3, 60);
  const r = ri(3, 150);
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const [dc, dr] = pick(dirs);
  const col = q + dc;
  const row = r + dr;
  const others = [];
  const seen = new Set([keyOf(q, r), keyOf(col, row)]);
  for (let k = 0; k < ri(0, 4); k++) {
    const oc = q + ri(-2, 2);
    const or = r + ri(-2, 2);
    if (seen.has(keyOf(oc, or))) continue;
    seen.add(keyOf(oc, or));
    others.push([oc, or, `o${k}`]);
  }
  const fords = [];
  for (const cell of [[q, r], [col, row], [q + 2, r]]) {
    if (rnd() < 0.3) fords.push(cell);
  }
  const autobatch = rnd() < 0.5
    ? null
    : { kind: pick(['hold', 'move', 'attack']), steps: Array.from({ length: ri(0, 2) }, () => [ri(3, 60), ri(3, 150)]) };
  const refused = rnd() < 0.15;
  return {
    name: `losowy_${String(i).padStart(3, '0')}`,
    pin: 'battleScene.ts:8685-8776',
    input: {
      unit: U(q, r, pick(MOVE_LEFT)),
      col,
      row,
      refused,
      cost: pick(COSTS),
      fords,
      occupancy: [[q, r, 'u'], ...others],
      autobatch,
    },
  };
};

// --- Zbior wynikowy ---
const cases = [];
const pushCase = (name, pin, input, want) => {
  const expect = runCase(input);
  if (want !== undefined && JSON.stringify(expect) !== JSON.stringify(want)) {
    throw new Error(`pin != oczekiwany (nazwany ${name}): pin=${JSON.stringify(expect)} want=${JSON.stringify(want)}`);
  }
  cases.push({ name, pin, input, expect });
};
for (const n of named) pushCase(n.name, n.pin, n.input, n.want);
const NR = 300;
for (let i = 0; i < NR; i++) {
  const c = randomCase(i);
  pushCase(c.name, c.pin, c.input);
}

const outDir = join(here, 'p6_k5doc_t4c_vectors');
mkdirSync(outDir, { recursive: true });
const out = {
  pin: PIN,
  pin_path: PIN_PATH,
  range: '8685-8776',
  fragments: digests,
  stubs: ['_siegeMoveRefused', '_moveCostForUnit', '_updateFacing', '_now', '_raf', 'cellToWorld', 'tileTopY', 'BTerrain'],
  cases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(out, null, 1) + '\n');
const nRefused = cases.filter((c) => c.input.refused).length;
const nPlan = cases.filter((c) => c.input.autobatch !== null).length;
console.log(`OK: ${cases.length} przypadkow (odmowa=${nRefused}, planowanie=${nPlan}) -> ${join(outDir, 'vectors.json')}`);
