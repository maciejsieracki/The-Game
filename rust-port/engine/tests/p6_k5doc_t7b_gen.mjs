// P6 SIEGE K5DOC-T7b ODWROT (dispatch R-RUSTPORT-P6-K5DOC-T7B-ODWROT, runda 1, Operator):
// generator wektorow dla `best_fall_back_step`, `fall_back_step_decide` i `fall_back_after_move`
// (rust-port/engine/src/domain/siege_tactics_fallback.rs).
//
// Uruchomienie: node rust-port/engine/tests/p6_k5doc_t7b_gen.mjs
// Wynik: tests/p6_k5doc_t7b_vectors/vectors.json
//
// ORAKUL = WYKONANIE TEKSTU PINA. `_bestFallBackStep` (battleScene.ts:7186-7219) i `_fallBackStep` (:7228-7244) sa
// transpilowane przez TypeScript i WYKONYWANE, wiec wartosci oczekiwane pochodza z pina.
// Razem z nimi wykonywane sa wycinki pina: DIR_DELTA/DIRS4 (:326-331, :337), BF_COLS/BF_ROWS (:661-662),
// STEP_GAP_MS (:1011), cellKey (:1797), manhattan (:1917-1919).
// STUBOWANE (zaleznosci spoza wycinkow, wejscia sceny wg dispatchu, przez trait FallBackWorld w Rust):
//   _enemiesOf(ru)          -> lista wejsciowa `enemies` (pin :8291-8293 filtruje dead/fadingOut/routed; tu wejscie)
//   _nearestEnemy(ru)       -> pole wejsciowe `nearest` (pin :8296-; tu wejscie, zgodnie z FC r1 nota (b))
//   occByKey                -> Map z kluczami cellKey z wejscia `occupied`
//   _passableForUnit(ru,c,r)-> negacja wejscia `impassable` (pin :7446-7448 = Number.isFinite(_moveCostForUnit))
//   _doMove(ru,nc,nr,cb)    -> zapis ruchu + ustawienie moveLeft z wejscia `move_left_after` (efekty T4c) + cb() sync
//   _schedule(ms,cb)        -> zapis ms, cb NIE wykonywany (jak w T4b: scheduling zwracany, nie uruchamiany)

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
  dirDelta: { range: [326, 331], head: 'const DIR_DELTA', tail: '];' },
  dirs4: { range: [337, 337], head: 'const DIRS4', tail: ';' },
  bfConsts: { range: [661, 662], head: 'const BF_COLS = 68;', tail: 'const BF_ROWS = 156;' },
  stepGap: { range: [1011, 1011], head: 'const STEP_GAP_MS', tail: '70;' },
  cellKey: { range: [1797, 1797], head: 'function cellKey', tail: '}' },
  manhattan: { range: [1917, 1919], head: 'function manhattan', tail: '}' },
  bestFallBackStep: { range: [7186, 7219], head: 'private _bestFallBackStep(', tail: '  }' },
  fallBackStep: { range: [7228, 7244], head: 'private _fallBackStep(', tail: '  }' },
};
const digests = {};
for (const [name, { range: [a, b], head, tail }] of Object.entries(FRAGMENTS)) {
  const lineA = pinLines[a - 1];
  const lineB = pinLines[b - 1];
  if (!lineA.includes(head) || !lineB.includes(tail)) {
    throw new Error(`straznik wycinka ${name} (${a}-${b}) nie zgadza sie z pinem: "${lineA}" / "${lineB}"`);
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
  pinRange(1797, 1797),
  pinRange(1917, 1919),
  'class P {',
  'constructor() { this.occByKey = new Map(); this.finished = false; this.enemyList = []; this.nearestStub = null; this.impassable = new Set(); this.moveLeftAfter = 0; this.moves = []; this.scheduled = []; }',
  '_enemiesOf(ru) { return this.enemyList; }',
  '_nearestEnemy(ru) { return this.nearestStub; }',
  '_passableForUnit(ru, col, row) { return !this.impassable.has(cellKey(col, row)); }',
  '_doMove(ru, nc, nr, cb) { this.moves.push([nc, nr]); ru.moveLeft = this.moveLeftAfter; cb(); }',
  '_schedule(ms, cb) { this.scheduled.push(ms); }',
  pinRange(7186, 7219),
  pinRange(7228, 7244),
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

// Buduje instancje pina ze stanem sceny z wektora.
const makeInst = (inp) => {
  const inst = new Pin();
  inst.finished = inp.finished;
  inst.enemyList = inp.enemies.map(([q, r]) => ({ q, r }));
  inst.nearestStub = inp.nearest === null ? null : { q: inp.nearest[0], r: inp.nearest[1] };
  inst.occByKey = new Map(inp.occupied.map(([c, r]) => [keyOf(c, r), 'x']));
  inst.impassable = new Set(inp.impassable.map(([c, r]) => keyOf(c, r)));
  inst.moveLeftAfter = inp.move_left_after;
  return inst;
};
const makeUnit = (u) => ({
  id: u.id,
  q: u.q,
  r: u.r,
  side: u.is_atk ? 'atk' : 'def',
  dead: u.dead,
  fadingOut: u.fading_out,
  moveLeft: u.move_left,
});

// `_bestFallBackStep` z pina -> [c, r] albo null.
const runBest = (inp) => {
  const inst = makeInst(inp);
  const res = inst._bestFallBackStep(makeUnit(inp.unit));
  return res === null ? null : res.split(',').map(Number);
};

// `_fallBackStep` z pina -> ruchy, zaplanowane ms i liczba wywolan done (synchronicznie).
const runStep = (inp) => {
  const inst = makeInst(inp);
  let doneCalls = 0;
  inst._fallBackStep(makeUnit(inp.unit), () => { doneCalls += 1; });
  return {
    moves: inst.moves,
    scheduled_ms: inst.scheduled.length > 0 ? inst.scheduled[0] : null,
    done_calls: doneCalls,
  };
};

const U = (q, r, extra = {}) => ({ id: 'u', q, r, is_atk: true, dead: false, fading_out: false, move_left: 6, ...extra });
const base = (over) => ({
  unit: U(10, 10),
  finished: false,
  enemies: [[0, 10]],
  nearest: [0, 10],
  occupied: [],
  impassable: [],
  move_left_after: 0,
  ...over,
});

const cases = [];
const pushCase = (name, input, want) => {
  const best = runBest(input);
  const step = runStep(input);
  const expect = { best, step };
  if (want !== undefined) {
    const same = JSON.stringify(want) === JSON.stringify(expect);
    if (!same) {
      throw new Error(`pin != oczekiwany (nazwany ${name}): pin=${JSON.stringify(expect)} want=${JSON.stringify(want)}`);
    }
  }
  cases.push({ name, pin: '7186-7219,7228-7244', input, expect });
};

// --- Przypadki nazwane (wartosc oczekiwana wg reki wyprowadzona z pina; straznik `want` sprawdza wynik pina). ---
pushCase('brak_wolnego_sasiada', base({
  unit: U(5, 5), enemies: [[5, 0]], nearest: [5, 0],
  occupied: [[5, 4], [6, 5], [5, 6], [4, 5]],
}), { best: null, step: { moves: [], scheduled_ms: null, done_calls: 1 } });

pushCase('zajete_pole_odrzucone', base({
  occupied: [[9, 10]],
}), { best: [10, 9], step: { moves: [[10, 9]], scheduled_ms: null, done_calls: 1 } });

pushCase('nieprzejezdne_odrzucone', base({
  impassable: [[10, 9]],
}), { best: [10, 11], step: { moves: [[10, 11]], scheduled_ms: null, done_calls: 1 } });

pushCase('dmin_le_1_odrzucone', base({
  enemies: [[10, 12]], nearest: [10, 12],
}), { best: [9, 10], step: { moves: [[9, 10]], scheduled_ms: null, done_calls: 1 } });

pushCase('dmin_mniejsze_niz_dnow_odrzucone', base({
  // W (9,10) ma dMin=9 < dNow=10 -> odrzucony; N/S/E zostaja.
}), { best: [10, 9], step: { moves: [[10, 9]], scheduled_ms: null, done_calls: 1 } });

// MUTACJA (a): `dMin < dNow` -> `dMin <= dNow`. Wzorzec: dMin == dNow dla N (drugi wrog na (10,7)), E i W zajete.
pushCase('mutacja_a_dmin_rowne_dnow_przyjety', base({
  enemies: [[10, 12], [10, 7]], nearest: [10, 12],
  occupied: [[9, 10], [11, 10]],
}), { best: [10, 9], step: { moves: [[10, 9]], scheduled_ms: null, done_calls: 1 } });

// MUTACJA (b): `score > bestScore` -> `>=`. Remis N (10,9) i S (10,11), E i W zajete; pierwszy w DIRS4 = N.
pushCase('mutacja_b_remis_pierwszy_w_dirs4', base({
  enemies: [[0, 10]], nearest: [0, 10],
  occupied: [[9, 10], [11, 10]],
}), { best: [10, 9], step: { moves: [[10, 9]], scheduled_ms: null, done_calls: 1 } });

// MUTACJA (c): znak homeBias. atk preferuje niska kolumne: W (9,10) wygrywa z E (11,10) i S (10,11).
pushCase('mutacja_c_home_bias_atk', base({
  enemies: [[10, 0]], nearest: [10, 0],
}), { best: [9, 10], step: { moves: [[9, 10]], scheduled_ms: null, done_calls: 1 } });

// MUTACJA (c) wariant def: def preferuje wysoka kolumne: E (11,10) wygrywa.
pushCase('mutacja_c_home_bias_def', base({
  unit: U(10, 10, { is_atk: false }),
  enemies: [[10, 0]], nearest: [10, 0],
}), { best: [11, 10], step: { moves: [[11, 10]], scheduled_ms: null, done_calls: 1 } });

pushCase('granica_nc_lt_0_i_nr_lt_0', base({
  unit: U(0, 0), enemies: [[5, 5]], nearest: [5, 5],
}), { best: null, step: { moves: [], scheduled_ms: null, done_calls: 1 } });

pushCase('granica_nr_lt_0', base({
  unit: U(5, 0), enemies: [[5, 20]], nearest: [5, 20],
}), { best: [4, 0], step: { moves: [[4, 0]], scheduled_ms: null, done_calls: 1 } });

pushCase('granica_nc_lt_0_skraj_lewy', base({
  unit: U(0, 50), enemies: [[0, 0]], nearest: [0, 0],
}), { best: [0, 51], step: { moves: [[0, 51]], scheduled_ms: null, done_calls: 1 } });

pushCase('granica_nc_ge_BF_COLS', base({
  unit: U(67, 50, { is_atk: false }), enemies: [[0, 50]], nearest: [0, 50],
}), { best: [67, 49], step: { moves: [[67, 49]], scheduled_ms: null, done_calls: 1 } });

pushCase('granica_nr_ge_BF_ROWS', base({
  unit: U(5, 155), enemies: [[5, 140]], nearest: [5, 140],
}), { best: [4, 155], step: { moves: [[4, 155]], scheduled_ms: null, done_calls: 1 } });

pushCase('brak_wrogow', base({
  enemies: [], nearest: null,
}), { best: null, step: { moves: [], scheduled_ms: null, done_calls: 1 } });

pushCase('najblizszy_null_przy_niepustych_wrogach', base({
  nearest: null,
}), { best: null, step: { moves: [], scheduled_ms: null, done_calls: 1 } });

pushCase('zaklinowany_pojedynczy', base({
  unit: U(0, 0), enemies: [[5, 5]], nearest: [5, 5],
}), { best: null, step: { moves: [], scheduled_ms: null, done_calls: 1 } });

pushCase('krok_z_zaplanowaniem', base({
  move_left_after: 5,
}), { best: [10, 9], step: { moves: [[10, 9]], scheduled_ms: 70, done_calls: 0 } });

pushCase('krok_koniec_ruchu', base({
  move_left_after: 0,
}), { best: [10, 9], step: { moves: [[10, 9]], scheduled_ms: null, done_calls: 1 } });

pushCase('guard_finished', base({
  finished: true, move_left_after: 5,
}), { best: [10, 9], step: { moves: [], scheduled_ms: null, done_calls: 1 } });

pushCase('guard_dead', base({
  unit: U(10, 10, { dead: true }), move_left_after: 5,
}), { best: [10, 9], step: { moves: [], scheduled_ms: null, done_calls: 1 } });

pushCase('guard_fading', base({
  unit: U(10, 10, { fading_out: true }), move_left_after: 5,
}), { best: [10, 9], step: { moves: [], scheduled_ms: null, done_calls: 1 } });

pushCase('guard_moveleft_zero', base({
  unit: U(10, 10, { move_left: 0 }), move_left_after: 5,
}), { best: [10, 9], step: { moves: [], scheduled_ms: null, done_calls: 1 } });

pushCase('guard_moveleft_ujemny', base({
  unit: U(10, 10, { move_left: -1 }), move_left_after: 5,
}), { best: [10, 9], step: { moves: [], scheduled_ms: null, done_calls: 1 } });

// --- Przypadki losowe (deterministyczne, ziarno 7b). Oczekiwane = wykonanie pina. ---
let seed = 0x7b7b7b;
const rnd = () => {
  // mulberry32
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const randCell = () => {
  // gestosc przy krawedziach: czesto 0/67/155 jako wspolrzedna
  const pick = (max) => (rnd() < 0.15 ? (rnd() < 0.5 ? 0 : max) : ri(0, max));
  return [pick(67), pick(155)];
};
const NR = 400;
for (let i = 0; i < NR; i++) {
  const q = rnd() < 0.5 ? ri(0, 20) : ri(0, 67);
  const r = rnd() < 0.5 ? ri(0, 20) : ri(0, 155);
  const nEn = ri(0, 3);
  const enemies = [];
  for (let k = 0; k < nEn; k++) {
    const [ec, er] = rnd() < 0.5 ? [ri(0, 20), ri(0, 20)] : randCell();
    enemies.push([ec, er]);
  }
  // nearest: najblizszy wrog (jak _nearestEnemy), czasem null (zaklinowanie/niezgodnosc)
  let nearest = null;
  if (enemies.length > 0) {
    let bd = Infinity;
    for (const [ec, er] of enemies) {
      const dd = Math.abs(q - ec) + Math.abs(r - er);
      if (dd < bd) { bd = dd; nearest = [ec, er]; }
    }
    if (rnd() < 0.03) nearest = null;
  }
  const occupied = [];
  const impassable = [];
  for (const [dc, dr] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
    const c = q + dc, rr = r + dr;
    if (rnd() < 0.25) occupied.push([c, rr]);
    if (rnd() < 0.1) impassable.push([c, rr]);
  }
  if (rnd() < 0.2) occupied.push(randCell());
  const input = {
    unit: U(q, r, {
      is_atk: rnd() < 0.5,
      dead: rnd() < 0.03,
      fading_out: rnd() < 0.03,
      move_left: ri(-1, 6),
    }),
    finished: rnd() < 0.03,
    enemies,
    nearest,
    occupied,
    impassable,
    move_left_after: ri(-1, 6),
  };
  pushCase(`losowy_${i}`, input);
}

const outDir = join(here, 'p6_k5doc_t7b_vectors');
mkdirSync(outDir, { recursive: true });
const out = {
  pin: PIN,
  pin_path: PIN_PATH,
  range: '7186-7219 (_bestFallBackStep), 7228-7244 (_fallBackStep)',
  fragments: digests,
  stubs: ['_enemiesOf', '_nearestEnemy', 'occByKey', '_passableForUnit', '_doMove', '_schedule'],
  cases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(out, null, 1) + '\n');
const nBest = cases.filter((c) => c.expect.best !== null).length;
const nSched = cases.filter((c) => c.expect.step.scheduled_ms !== null).length;
console.log(`OK: ${cases.length} przypadkow (best!=null=${nBest}, schedule=${nSched}) -> ${join(outDir, 'vectors.json')}`);
