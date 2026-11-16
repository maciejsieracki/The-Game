// P6 SIEGE K5DOC-T4a HELPERY SCIEZKI (dispatch R-RUSTPORT-P6-K5DOC-T4A-HELPERY-SCIEZKI, runda 1, Operator):
// generator wektorow dla `first_step_along_path_to_attack` i `step_toward` (rust-port/engine/src/domain/siege_tactics_pathstep.rs).
//
// Uruchomienie: node rust-port/engine/tests/p6_k5doc_t4a_gen.mjs
// Wynik: tests/p6_k5doc_t4a_vectors/vectors.json
//
// ORAKUL = WYKONANIE TEKSTU PINA. Fragmenty pina (git show 07d2fbd72, bez checkoutu) sa transpilowane przez TypeScript
// i WYKONYWANE, wiec wartosci oczekiwane pochodza z pina, a nie z reimplementacji JS:
//   _firstStepAlongPathToAttack  battleScene.ts:8565-8622
//   _stepToward                  battleScene.ts:8413-8427
//   DIR_DELTA / DIRS4            battleScene.ts:326-331, :337
//   BF_COLS / BF_ROWS            battleScene.ts:661-662
//   cellKey                      battleScene.ts:1797
//   manhattan                    battleScene.ts:1917-1919
// STUBOWANE sa wyłącznie dwie zależności, ktore w pinie czytaja stan sceny poza tym wycinkiem:
//   _makeCanAttackFromTest(ru)   (test celu bez target) -> zbiór `goal` z wektora (w Rust: parametr is_goal)
//   _passableForUnit(ru,c,r)     (teren)                -> zbiór `impassable` z wektora (w Rust: AutoBatchEnv::passable_for_unit)
// occByKey jest zbiorem kluczy "c,r" z wektora (w Rust: BatchBoard::occ). allowFirstStep = predykat z `allow_forbid`.
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
  cellKey: { range: [1797, 1797], head: 'function cellKey', tail: '}' },
  manhattan: { range: [1917, 1919], head: 'function manhattan', tail: '}' },
  stepToward: { range: [8413, 8427], head: 'private _stepToward(', tail: '  }' },
  firstStep: { range: [8565, 8622], head: 'private _firstStepAlongPathToAttack(', tail: '  }' },
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
  pinRange(1797, 1797),
  pinRange(1917, 1919),
  'class P {',
  'constructor() { this.occByKey = new Set(); this._goal = new Set(); this._impass = new Set(); }',
  '_makeCanAttackFromTest(ru) { return (q, r) => this._goal.has(q + "," + r); }',
  '_passableForUnit(ru, col, row) { return !this._impass.has(col + "," + row); }',
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
const parseKey = (k) => (k === null || k === undefined ? null : k.split(',').map(Number));

const runCase = (c) => {
  const inst = new Pin();
  inst.occByKey = new Set(c.occupied.map(([a, b]) => keyOf(a, b)));
  inst._goal = new Set(c.goal.map(([a, b]) => keyOf(a, b)));
  inst._impass = new Set(c.impassable.map(([a, b]) => keyOf(a, b)));
  const ru = { q: c.unit[0], r: c.unit[1] };
  if (c.kind === 'first_step') {
    const forbid = new Set((c.allowForbid ?? []).map(([a, b]) => keyOf(a, b)));
    const allow = c.allowForbid ? (q, r) => !forbid.has(keyOf(q, r)) : undefined;
    return parseKey(inst._firstStepAlongPathToAttack(ru, allow));
  }
  if (c.kind === 'step_toward') {
    return parseKey(inst._stepToward(ru, { q: c.target[0], r: c.target[1] }));
  }
  throw new Error(`nieznany rodzaj ${c.kind}`);
};

// --- Przypadki nazwane (rozumowanie w komentarzu; wartosc oczekiwana = wykonanie pina; straznik `want`/`notWant`). ---
const named = [
  {
    name: 'prosta_sciezka_w_dol', kind: 'first_step', pin: 'battleScene.ts:8565-8622',
    unit: [5, 5], goal: [[5, 8]], want: [5, 6],
  },
  {
    // occByKey: (5,6) zajete -> droga okrezna; pierwszy krok nie moze byc (5,6).
    name: 'zajety_heks_occByKey_omijany', kind: 'first_step', pin: 'battleScene.ts:8594',
    unit: [5, 5], goal: [[5, 7]], occupied: [[5, 6]], notWant: [5, 6],
  },
  {
    // _passableForUnit: (5,6) nieprzejezdny (nie zajety) -> ten sam wynik co wyzej, inny filtr.
    name: 'heks_nieprzejezdny_passable_omijany', kind: 'first_step', pin: 'battleScene.ts:8605',
    unit: [5, 5], goal: [[5, 7]], impassable: [[5, 6]], notWant: [5, 6],
  },
  {
    // Asymetria allowFirstStep: (4,6) zakazany przez allowFirstStep, ale cur != start, wiec filtr NIE dotyczy go.
    // Jedyna droga do celu (4,7) to (5,5)->(4,5)->(4,6)->(4,7); pierwszy krok (4,5) musi przejsc.
    name: 'asymetria_allowFirst_dalszy_krok_dozwolony', kind: 'first_step', pin: 'battleScene.ts:8593',
    unit: [5, 5], goal: [[4, 7]],
    occupied: [[5, 4], [6, 5], [5, 6]],
    impassable: [[3, 6], [3, 7], [5, 7], [4, 8]],
    allowForbid: [[4, 6]], want: [4, 5],
  },
  {
    // Ta sama geometria, allowFirstStep zakazuje jedynego pierwszego kroku (4,5) -> brak kroku.
    name: 'allowFirst_zakazuje_jedynego_pierwszego_kroku', kind: 'first_step', pin: 'battleScene.ts:8593',
    unit: [5, 5], goal: [[4, 7]],
    occupied: [[5, 4], [6, 5], [5, 6]],
    impassable: [[3, 6], [3, 7], [5, 7], [4, 8]],
    allowForbid: [[4, 5]], want: null,
  },
  {
    name: 'brak_sciezki_brak_kroku', kind: 'first_step', pin: 'battleScene.ts:8565-8622',
    unit: [5, 5], goal: [[5, 8]], impassable: [[4, 8], [6, 8], [5, 7], [5, 9]], want: null,
  },
  {
    name: 'start_jest_celem_brak_kroku', kind: 'first_step', pin: 'battleScene.ts:8565-8622',
    unit: [5, 5], goal: [[5, 5], [9, 9]], want: null,
  },
  {
    name: 'greedy_prosty_w_dol', kind: 'step_toward', pin: 'battleScene.ts:8413-8427',
    unit: [5, 5], target: [5, 9], want: [5, 6],
  },
  {
    name: 'greedy_zajety_brak_poprawy', kind: 'step_toward', pin: 'battleScene.ts:8413-8427',
    unit: [5, 5], target: [5, 9], occupied: [[5, 6]], want: null,
  },
  {
    name: 'greedy_nieprzejezdny_brak_poprawy', kind: 'step_toward', pin: 'battleScene.ts:8413-8427',
    unit: [5, 5], target: [9, 5], impassable: [[6, 5]], want: null,
  },
  {
    name: 'greedy_w_prawo_gdy_cel_na_wschod', kind: 'step_toward', pin: 'battleScene.ts:8413-8427',
    unit: [5, 5], target: [9, 5], want: [6, 5],
  },
];

// --- Losowe sceny (ziarno deterministyczne; mulberry32). ---
const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = mulberry32(2026);
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
const randomFirstStep = () => {
  const unit = [ri(3, 60), ri(3, 150)];
  const goal = uniqueTiles(Array.from({ length: ri(1, 3) }, () => randomTile(unit[0], unit[1], 12)), unit);
  const occupied = uniqueTiles(Array.from({ length: ri(0, 25) }, () => randomTile(unit[0], unit[1], 6)), unit);
  const impassable = uniqueTiles(Array.from({ length: ri(0, 10) }, () => randomTile(unit[0], unit[1], 6)), unit);
  const allowForbid = rnd() < 0.5 ? uniqueTiles(Array.from({ length: ri(0, 3) }, () => randomTile(unit[0], unit[1], 3)), unit) : null;
  return { kind: 'first_step', unit, goal, occupied, impassable, allowForbid };
};
const randomStepToward = () => {
  const unit = [ri(3, 60), ri(3, 150)];
  const target = randomTile(unit[0], unit[1], 12);
  const occupied = uniqueTiles(Array.from({ length: ri(0, 6) }, () => randomTile(unit[0], unit[1], 2)), unit);
  const impassable = uniqueTiles(Array.from({ length: ri(0, 4) }, () => randomTile(unit[0], unit[1], 2)), unit);
  return { kind: 'step_toward', unit, target, goal: [], occupied, impassable, allowForbid: null };
};

// --- Zbior wynikowy ---
const cases = [];
const pushCase = (name, pin, input, want, notWant) => {
  const expect = runCase(input);
  if (want !== undefined && JSON.stringify(expect) !== JSON.stringify(want)) {
    throw new Error(`pin != oczekiwany (nazwany ${name}): pin=${JSON.stringify(expect)} want=${JSON.stringify(want)}`);
  }
  if (notWant !== undefined && JSON.stringify(expect) === JSON.stringify(notWant)) {
    throw new Error(`pin zwrocil zakazany wynik (nazwany ${name}): ${JSON.stringify(expect)}`);
  }
  cases.push({
    name,
    kind: input.kind,
    pin,
    unit: input.unit,
    goal: input.goal ?? [],
    target: input.target ?? null,
    occupied: input.occupied ?? [],
    impassable: input.impassable ?? [],
    allow_forbid: input.allowForbid ?? null,
    expect,
  });
  return expect;
};
for (const n of named) {
  const { name, pin, want, notWant, ...rest } = n;
  const input = {
    kind: rest.kind,
    unit: rest.unit,
    goal: rest.goal ?? [],
    target: rest.target ?? null,
    occupied: rest.occupied ?? [],
    impassable: rest.impassable ?? [],
    allowForbid: rest.allowForbid ?? null,
  };
  pushCase(name, pin, input, want, notWant);
}
const NR_FIRST = 300;
const NR_STEP = 150;
for (let i = 0; i < NR_FIRST; i++) {
  const inp = randomFirstStep();
  pushCase(`losowy_first_step_${String(i).padStart(3, '0')}`, 'battleScene.ts:8565-8622', inp);
}
for (let i = 0; i < NR_STEP; i++) {
  const inp = randomStepToward();
  pushCase(`losowy_step_toward_${String(i).padStart(3, '0')}`, 'battleScene.ts:8413-8427', inp);
}

const outDir = join(here, 'p6_k5doc_t4a_vectors');
mkdirSync(outDir, { recursive: true });
const out = {
  pin: PIN,
  pin_path: PIN_PATH,
  fragments: digests,
  stubs: ['_makeCanAttackFromTest', '_passableForUnit'],
  cases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(out, null, 1) + '\n');
const nFirst = cases.filter((c) => c.kind === 'first_step').length;
const nStep = cases.filter((c) => c.kind === 'step_toward').length;
const nFound = cases.filter((c) => c.expect !== null).length;
console.log(`OK: ${cases.length} przypadkow (first_step=${nFirst}, step_toward=${nStep}, z krokiem=${nFound}) -> ${join(outDir, 'vectors.json')}`);
