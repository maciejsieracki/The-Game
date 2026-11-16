// P6 SIEGE K5DOC-T4b DECYZJA _advanceStep (dispatch R-RUSTPORT-P6-K5DOC-T4B-ADVANCE-DECIDE, runda 1, Operator):
// generator wektorow dla `advance_step_decide` i `advance_after_move` (rust-port/engine/src/domain/siege_tactics_advance.rs).
//
// Uruchomienie: node rust-port/engine/tests/p6_k5doc_t4b_gen.mjs
// Wynik: tests/p6_k5doc_t4b_vectors/vectors.json
//
// ORAKUL = WYKONANIE TEKSTU PINA. Fragmenty pina (git show 07d2fbd72, bez checkoutu) sa transpilowane przez TypeScript
// i WYKONYWANE, wiec wartosci oczekiwane pochodza z pina:
//   _advanceStep            battleScene.ts:8198-8285   (kroki 1, 3-10; krok 2 = C-FLANK pominiety przez attackDirection 'front')
//   _firstStepAlongPathToAttack battleScene.ts:8565-8622
//   _stepToward             battleScene.ts:8413-8427
//   desiredHitForDirection  battleScene.ts:1956-1960   (dla 'front' zwraca null -> blok C-FLANK nieosiagalny)
//   STEP_GAP_MS             battleScene.ts:1011
//   DIR_DELTA / DIRS4, BF_COLS / BF_ROWS, cellKey, manhattan (jak w K5DOC-T4a)
// STUBOWANE sa wyłącznie zależności, które w pinie czytają stan sceny poza wycinkiem (wartości z wektora):
//   _canAttackFrom / _makeCanAttackFromTest  -> zbiór `goal` (w Rust: AdvanceWorld::can_attack_from)
//   _pickAdjacentTargetByPriority            -> `adjacent` (w Rust: AdvanceWorld::pick_adjacent_target)
//   _nearestEnemy                            -> `target`   (w Rust: AdvanceWorld::nearest_enemy)
//   _shouldAvoidAutoBacktrack                -> `unit.avoid` (w Rust: AdvanceWorld::avoid_auto_backtrack)
//   _compactAttackAllowsStep                 -> `compact_forbidden_cols` (w Rust: AdvanceWorld::compact_attack_allows_step)
//   _passableForUnit                         -> `impassable`
//   occByKey                                 -> `occupied`
//   _doMove / _doAttack / _schedule          -> przechwycenie wywolan (efekty po stronie wolajacego)
// Callback `_doMove` jest wykonywany PO przesunieciu jednostki w harnessie (stan `after`), aby odczytac zapis
// `lastAutoMoveFrom` (= `then`) i wynik kontynuacji (`after`: 'done' | 'schedule').
//
// Straznik: pierwsza i ostatnia linia kazdego wycinka musza zawierac oczekiwany tekst (inaczej przesuniecie linii pina).

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

const FRAGMENTS = {
  dirDelta: { range: [326, 331], head: 'const DIR_DELTA', tail: '];' },
  dirs4: { range: [337, 337], head: 'const DIRS4', tail: 'DIR_DELTA;' },
  bfDims: { range: [661, 662], head: 'const BF_COLS', tail: 'const BF_ROWS' },
  stepGap: { range: [1011, 1011], head: 'const STEP_GAP_MS', tail: '70;' },
  cellKey: { range: [1797, 1797], head: 'function cellKey', tail: '}' },
  manhattan: { range: [1917, 1919], head: 'function manhattan', tail: '}' },
  desiredHit: { range: [1956, 1960], head: 'function desiredHitForDirection', tail: '}' },
  stepToward: { range: [8413, 8427], head: 'private _stepToward(', tail: '  }' },
  firstStep: { range: [8565, 8622], head: 'private _firstStepAlongPathToAttack(', tail: '  }' },
  advanceStep: { range: [8198, 8285], head: 'private _advanceStep(', tail: '  }' },
};
const digests = {};
for (const [name, { range: [a, b], head, tail }] of Object.entries(FRAGMENTS)) {
  const tailOk = tail.startsWith('  ') ? pinLines[b - 1] === tail : pinLines[b - 1].includes(tail);
  if (!pinLines[a - 1].includes(head) || !tailOk) {
    throw new Error(`straznik wycinka ${name} (${a}-${b}) nie zgadza sie z pinem`);
  }
  digests[name] = createHash('sha256').update(pinRange(a, b)).digest('hex');
}

// --- Wykonanie pina ---
const TS_JS = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const tsLib = createRequire(import.meta.url)(TS_JS);
const classSrc = [
  pinRange(326, 331),
  pinRange(337, 337),
  pinRange(661, 662),
  pinRange(1011, 1011),
  pinRange(1956, 1960),
  pinRange(1797, 1797),
  pinRange(1917, 1919),
  'class P {',
  'constructor() { this.occByKey = new Set(); this._goal = new Set(); this._impass = new Set(); this._compactForbid = new Set(); this._adj = null; this._target = null; this._avoid = false; this._rec = null; this._afterRec = null; this._phase = "decide"; this._cb = null; this.finished = false; }',
  '_makeCanAttackFromTest(ru) { return (q, r) => this._goal.has(q + "," + r); }',
  '_canAttackFrom(ru, col, row) { return this._goal.has(col + "," + row); }',
  '_passableForUnit(ru, col, row) { return !this._impass.has(col + "," + row); }',
  '_nearestEnemy(ru) { return this._target; }',
  '_pickAdjacentTargetByPriority(ru) { return this._adj; }',
  '_shouldAvoidAutoBacktrack(ru) { return this._avoid; }',
  '_compactAttackAllowsStep(ru, col) { return !this._compactForbid.has(col); }',
  '_doAttack(ru, target, done) { this._rec = { kind: "attack", target: target.id }; }',
  '_doMove(ru, nc, nr, cb) { this._rec = { kind: "move", col: nc, row: nr }; this._cb = cb; }',
  '_schedule(ms, fn) { this._afterRec = "schedule"; }',
  // Galezi C-FLANK sa nieosiagalne dla attackDirection = front; stuby tylko domykaja skladnie wycinka.
  '_pickTargetByPriority(ru) { throw new Error("C-FLANK poza zakresem T4b"); }',
  '_canStrikeTargetFrom(ru, c, r, t) { throw new Error("C-FLANK poza zakresem T4b"); }',
  '_firstStepTowardDirectedAttack(ru, t, d) { throw new Error("C-FLANK poza zakresem T4b"); }',
  pinRange(8198, 8285),
  pinRange(8413, 8427),
  pinRange(8565, 8622),
  '}',
  'module.exports.P = P;',
].join('\n');
const execJs = tsLib.transpileModule(classSrc, {
  compilerOptions: { module: tsLib.ModuleKind.CommonJS, target: tsLib.ScriptTarget.ES2020 },
}).outputText;
const pinMod = { exports: {} };
new Function('module', 'exports', 'require', execJs)(pinMod, pinMod.exports, createRequire(import.meta.url));
const Pin = pinMod.exports.P;

const keyOf = (c, r) => c + ',' + r;

// Wykonuje `_advanceStep` z pinu dla jednego wektora i zwraca {decision, after}.
const runAdvance = (c) => {
  const inst = new Pin();
  inst.finished = c.finished;
  inst.occByKey = new Set(c.occupied.map(([a, b]) => keyOf(a, b)));
  inst._goal = new Set(c.goal.map(([a, b]) => keyOf(a, b)));
  inst._impass = new Set(c.impassable.map(([a, b]) => keyOf(a, b)));
  inst._compactForbid = new Set(c.compact_forbidden_cols);
  inst._adj = c.adjacent === null ? null : { id: c.adjacent };
  inst._target = c.target === null ? null : { id: c.target.id, q: c.target.q, r: c.target.r };
  inst._avoid = c.unit.avoid;
  inst._phase = 'decide';
  const ru = {
    q: c.unit.q,
    r: c.unit.r,
    dead: c.unit.dead,
    fadingOut: c.unit.fading_out,
    moveLeft: c.unit.move_left,
    lastAutoMoveFrom: c.unit.last_auto_move_from === null
      ? undefined
      : { q: c.unit.last_auto_move_from[0], r: c.unit.last_auto_move_from[1] },
    attackDirection: 'front',
  };
  const done = () => {
    if (inst._phase === 'decide') inst._rec = { kind: 'done' };
    else inst._afterRec = 'done';
  };
  inst._advanceStep(ru, done);
  const rec = inst._rec;
  if (rec === null) throw new Error('pin nie wywolal zadnej galezi _advanceStep');
  if (rec.kind !== 'move') return { decision: rec, after: null };

  // Callback _doMove po przesunieciu: stan PO przesunieciu z wektora `after`.
  const prev = [ru.q, ru.r];
  ru.q = rec.col;
  ru.r = rec.row;
  ru.moveLeft = c.after.move_left;
  inst.finished = c.after.finished;
  ru.lastAutoMoveFrom = undefined;
  inst._phase = 'after';
  inst._afterRec = null;
  inst._cb();
  const then = ru.lastAutoMoveFrom ? [prev[0], prev[1]] : null;
  return { decision: { kind: 'move', col: rec.col, row: rec.row, then }, after: inst._afterRec };
};

// --- Przypadki nazwane (rozumowanie w komentarzu; wartosc oczekiwana = wykonanie pina; straznik `want`/`notWant`). ---
const U = (over = {}) => ({
  id: 'u1', q: 5, r: 5, dead: false, fading_out: false, move_left: 2,
  last_auto_move_from: null, avoid: false, ...over,
});
const base = (over = {}) => ({
  finished: false,
  unit: U(),
  goal: [],
  adjacent: null,
  target: null,
  occupied: [],
  impassable: [],
  compact_forbidden_cols: [],
  after: { finished: false, move_left: 1 },
  ...over,
});
// Ring nieprzejezdny wokol (5,9): cel (5,9) nieosiagalny dla BFS.
const RING59 = [[4, 9], [6, 9], [5, 8], [5, 10]];
const ENEMY_59 = { id: 'e1', q: 5, r: 9 };

const named = [
  { name: 'prelude_finished', pin: 'battleScene.ts:8199', input: base({ finished: true, goal: [[5, 5]], adjacent: 'e2', target: ENEMY_59 }), want: { kind: 'done' } },
  { name: 'prelude_dead', pin: 'battleScene.ts:8200', input: base({ unit: U({ dead: true }), goal: [[5, 5]], adjacent: 'e2' }), want: { kind: 'done' } },
  { name: 'prelude_fading_out', pin: 'battleScene.ts:8200', input: base({ unit: U({ fading_out: true }), goal: [[5, 5]], adjacent: 'e2' }), want: { kind: 'done' } },
  { name: 'prelude_move_left_zero_przed_atakiem', pin: 'battleScene.ts:8203', input: base({ unit: U({ move_left: 0 }), goal: [[5, 5]], adjacent: 'e2' }), want: { kind: 'done' }, notWant: { kind: 'attack', target: 'e2' } },
  { name: 'attack_sasiad', pin: 'battleScene.ts:8229-8236', input: base({ goal: [[5, 5]], adjacent: 'e2', target: { id: 'e2', q: 5, r: 6 } }), want: { kind: 'attack', target: 'e2' } },
  { name: 'attack_brak_sasiada_done', pin: 'battleScene.ts:8235', input: base({ goal: [[5, 5]], adjacent: null, target: { id: 'e2', q: 5, r: 6 } }), want: { kind: 'done' } },
  { name: 'brak_wroga_done', pin: 'battleScene.ts:8238-8239', input: base({ goal: [[5, 9]], target: null }), want: { kind: 'done' } },
  { name: 'marsz_bfs_pierwszy_krok', pin: 'battleScene.ts:8241-8253', input: base({ goal: [[5, 7]], target: ENEMY_59 }), want: { kind: 'move', col: 5, row: 6, then: null }, notWant: { kind: 'attack', target: 'e1' } },
  { name: 'marsz_avoid_zapisuje_then', pin: 'battleScene.ts:8252', input: base({ unit: U({ avoid: true }), goal: [[5, 7]], target: ENEMY_59 }), want: { kind: 'move', col: 5, row: 6, then: [5, 5] } },
  { name: 'marsz_avoid_omija_lastAutoMoveFrom', pin: 'battleScene.ts:8243-8244', input: base({ unit: U({ avoid: true, last_auto_move_from: [5, 6] }), goal: [[5, 7]], target: ENEMY_59 }), notWant: { kind: 'move', col: 5, row: 6, then: [5, 5] } },
  { name: 'marsz_bez_avoid_ignoruje_lastAutoMoveFrom', pin: 'battleScene.ts:8243-8244', input: base({ unit: U({ avoid: false, last_auto_move_from: [5, 6] }), goal: [[5, 7]], target: ENEMY_59 }), want: { kind: 'move', col: 5, row: 6, then: null } },
  { name: 'bfs_bramka_kompaktu_pierwszy_krok_kolumna5', pin: 'battleScene.ts:8243', input: base({ goal: [[5, 7]], compact_forbidden_cols: [5], target: ENEMY_59 }), notWant: { kind: 'move', col: 5, row: 6, then: null } },
  { name: 'asymetria_allowFirst_dalszy_krok_dozwolony', pin: 'battleScene.ts:8593', input: base({ goal: [[4, 7]], occupied: [[5, 4], [6, 5], [4, 5]], impassable: [[5, 7]], compact_forbidden_cols: [4], target: { id: 'e1', q: 4, r: 7 } }), want: { kind: 'move', col: 5, row: 6, then: null } },
  { name: 'greedy_bramka_8270_zabija_krok', pin: 'battleScene.ts:8270', input: base({ goal: [[5, 9]], impassable: RING59, compact_forbidden_cols: [5], target: ENEMY_59 }), want: { kind: 'done' } },
  { name: 'greedy_krok_dozwolony', pin: 'battleScene.ts:8266-8273', input: base({ goal: [[5, 9]], impassable: RING59, target: ENEMY_59 }), want: { kind: 'move', col: 5, row: 6, then: null } },
  { name: 'brak_kroku_bfs_i_greedy_done', pin: 'battleScene.ts:8260', input: base({ goal: [[5, 9]], impassable: RING59, occupied: [[5, 6], [4, 5], [6, 5], [5, 4]], target: ENEMY_59 }), want: { kind: 'done' } },
  { name: 'po_ruchu_schedule_gdy_zostal_ruch', pin: 'battleScene.ts:8280-8283', input: base({ goal: [[5, 7]], target: ENEMY_59, after: { finished: false, move_left: 1 } }), want: { kind: 'move', col: 5, row: 6, after: 'schedule' } },
  { name: 'po_ruchu_done_pozycja_ataku', pin: 'battleScene.ts:8275', input: base({ goal: [[5, 6], [5, 7]], target: ENEMY_59, after: { finished: false, move_left: 1 } }), want: { kind: 'move', col: 5, row: 6, after: 'done' } },
  { name: 'po_ruchu_done_brak_ruchu', pin: 'battleScene.ts:8283', input: base({ goal: [[5, 7]], target: ENEMY_59, after: { finished: false, move_left: 0 } }), want: { kind: 'move', col: 5, row: 6, after: 'done' } },
  { name: 'po_ruchu_done_finished', pin: 'battleScene.ts:8274', input: base({ goal: [[5, 7]], target: ENEMY_59, after: { finished: true, move_left: 2 } }), want: { kind: 'move', col: 5, row: 6, after: 'done' } },
];

// --- Losowe sceny (ziarno deterministyczne; mulberry32). ---
const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = mulberry32(2027);
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const randomTile = (cq, cr, span) => [cq + ri(-span, span), cr + ri(-span, span)];
const uniqueTiles = (list, avoid) => {
  const seen = new Set([keyOf(...avoid)]);
  const out = [];
  for (const t of list) {
    const k = keyOf(...t);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
};
const pick = (list) => list[ri(0, list.length - 1)];
const randomAdvance = () => {
  const unit = [ri(3, 60), ri(3, 150)];
  const goal = uniqueTiles(Array.from({ length: ri(0, 4) }, () => randomTile(unit[0], unit[1], 5)), unit);
  if (rnd() < 0.12) goal.push(unit);
  const occupied = uniqueTiles(Array.from({ length: ri(0, 18) }, () => randomTile(unit[0], unit[1], 4)), unit);
  const impassable = uniqueTiles(Array.from({ length: ri(0, 12) }, () => randomTile(unit[0], unit[1], 4)), unit);
  const compact = rnd() < 0.4 ? [...new Set(Array.from({ length: ri(1, 2) }, () => unit[0] + ri(-2, 2)))] : [];
  const target = rnd() < 0.9
    ? { id: 'e1', q: unit[0] + ri(-8, 8), r: unit[1] + ri(-8, 8) }
    : null;
  return base({
    finished: rnd() < 0.05,
    unit: U({
      q: unit[0],
      r: unit[1],
      dead: rnd() < 0.05,
      fading_out: rnd() < 0.05,
      move_left: pick([-1, 0, 0.5, 1, 2, 3]),
      last_auto_move_from: rnd() < 0.4 ? randomTile(unit[0], unit[1], 2) : null,
      avoid: rnd() < 0.5,
    }),
    goal,
    adjacent: rnd() < 0.3 ? 'e2' : null,
    target,
    occupied,
    impassable,
    compact_forbidden_cols: compact,
    after: { finished: rnd() < 0.1, move_left: pick([-1, 0, 0.5, 1, 2]) },
  });
};

// --- Zbior wynikowy ---
const cases = [];
const toCase = (name, pinRef, input, expect) => ({
  name,
  kind: 'advance',
  pin: pinRef,
  finished: input.finished,
  unit: input.unit,
  goal: input.goal,
  adjacent: input.adjacent,
  target: input.target,
  occupied: input.occupied,
  impassable: input.impassable,
  compact_forbidden_cols: input.compact_forbidden_cols,
  after: input.after,
  expect,
});
const matches = (got, want) =>
  Object.entries(want).every(([k, v]) => JSON.stringify(got[k] ?? null) === JSON.stringify(v ?? null));

for (const n of named) {
  const { decision, after } = runAdvance(n.input);
  const full = decision.kind === 'move' ? { ...decision, after } : decision;
  if (n.want && !matches(full, n.want)) {
    throw new Error(`pin != oczekiwany (nazwany ${n.name}): pin=${JSON.stringify(full)} want=${JSON.stringify(n.want)}`);
  }
  if (n.notWant && matches(full, n.notWant)) {
    throw new Error(`pin zwrocil zakazany wynik (nazwany ${n.name}): ${JSON.stringify(full)}`);
  }
  cases.push(toCase(n.name, n.pin, n.input, full));
}

const NR_RANDOM = 500;
for (let i = 0; i < NR_RANDOM; i++) {
  const inp = randomAdvance();
  const { decision, after } = runAdvance(inp);
  const expect = decision.kind === 'move' ? { ...decision, after } : decision;
  cases.push(toCase(`losowy_advance_${String(i).padStart(3, '0')}`, 'battleScene.ts:8198-8285', inp, expect));
}

// Pokrycie galezi: wymagamy, by kazdy rodzaj wyniku i kazdy wynik `after` wystapil.
const kinds = new Set(cases.map((c) => c.expect.kind));
for (const k of ['done', 'attack', 'move']) {
  if (!kinds.has(k)) throw new Error(`brak przypadku z wynikiem ${k}`);
}
const afters = new Set(cases.filter((c) => c.expect.kind === 'move').map((c) => c.expect.after));
for (const a of ['done', 'schedule']) {
  if (!afters.has(a)) throw new Error(`brak przypadku po ruchu: ${a}`);
}
if (!cases.some((c) => c.expect.kind === 'move' && c.expect.then !== null)) {
  throw new Error('brak przypadku z zapisem then');
}

const outDir = join(here, 'p6_k5doc_t4b_vectors');
mkdirSync(outDir, { recursive: true });
const out = {
  pin: PIN,
  pin_path: PIN_PATH,
  fragments: digests,
  attack_direction: 'front',
  stubs: [
    '_canAttackFrom', '_makeCanAttackFromTest', '_passableForUnit', '_nearestEnemy',
    '_pickAdjacentTargetByPriority', '_shouldAvoidAutoBacktrack', '_compactAttackAllowsStep',
    '_doMove', '_doAttack', '_schedule',
  ],
  cases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(out, null, 1) + '\n');
const nNamed = named.length;
const counts = {};
for (const c of cases) counts[c.expect.kind] = (counts[c.expect.kind] ?? 0) + 1;
console.log(`OK: ${cases.length} przypadkow (nazwane=${nNamed}, losowe=${NR_RANDOM}), wyniki=${JSON.stringify(counts)} -> ${join(outDir, 'vectors.json')}`);
