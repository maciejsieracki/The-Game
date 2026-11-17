// P6 SIEGE K5DOC-T4e-0 WIRING RUCHU PIESZEGO (dispatch R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING, runda 4, Operator):
// generator wektorow dla `ProdBody::move_step` (rust-port/engine/src/domain/siege_tactics_loop.rs) i jego adaptera
// `MoveWorld` (koszt per jednostka, zajetosc `occ_by_key`).
//
// Uruchomienie: node rust-port/engine/tests/p6_k5doc_t4e_gen.mjs
// Wynik: tests/p6_k5doc_t4e_vectors/vectors.json
//
// ORAKUL = WYKONANIE TEKSTU PINA. Wycinki pina (git show 07d2fbd72, bez checkoutu) sa transpilowane przez TypeScript
// i WYKONYWANE: BROD (:982-983), cellKey (:1797), isFordTile (:1897-1899), _moveCostForUnit (:7436-7443),
// _doMove (:8685-8776). Wartosci oczekiwane (pozycja, moveLeft, zajetosc, planowanie, done) pochodza z tego wykonania.
//
// STUBY (poza wycinkami pina; jawnie opisane):
//   cavalryTerrainMultiplier(name, terrainData) -> tabela CAV_TABLE (combat.ts:756 nie jest wycinkiem pina).
//       Wartosci wg komentarza pina: Las = 2, Gory = Infinity ("NIEDOSTEPNE dla kawalerii"), reszta = 1.
//   _siegeMoveRefused(ru,c,r)  -> flaga `refused` z wektora (K1, :7963)
//   _updateFacing(ru)          -> licznik wywolan (#107 zablokowany; adapter Rust: no-op, znany dlug)
//   _now / _raf / cellToWorld / tileTopY -> bez efektu (animacja, UI)
//   BTerrain                   -> stala tekstowa (stub enum), uzyta przez isFordTile z pina
//   terrainMap.passable/moveCost/combatTerrainName/at -> metody stubu oparte na tabeli kafelkow z wektora

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
  moveCostForUnit: { range: [7436, 7443], head: 'private _moveCostForUnit(', tail: '}' },
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
  // STUB combat.ts:756 (cavalryTerrainMultiplier): tabela mnoznikow po nazwie terenu.
  'function cavalryTerrainMultiplier(terrain, terrainData) { return terrainData[terrain] ?? 1; }',
  'class P {',
  'constructor() { this.occByKey = new Map(); this.siegeWallCol = 0; this.busy = false; this.finished = false; this._autoBattleSuspended = false; this._autoBatchPlanning = null; this.rafCalls = 0; this.facingCalls = 0; this.refused = false; this.tiles = new Map(); this.defaultTile = null; this.terrainData = {}; this.terrainMap = { passable: (c, r) => this.tile(c, r).passable, moveCost: (c, r) => this.tile(c, r).cost, combatTerrainName: (c, r) => this.tile(c, r).name, at: (c, r) => (this.tile(c, r).ford ? BTerrain.Ford : BTerrain.Plain) }; }',
  'tile(c, r) { return this.tiles.get(c + "," + r) ?? this.defaultTile; }',
  '_siegeMoveRefused(ru, col, row) { return this.refused; }',
  pinRange(7436, 7443),
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

// Tabela mnoznikow kawalerii (STUB wg komentarza pina): Las x2, Gory = Infinity, reszta 1.
const CAV_TABLE = { Rownina: 1, Woda: 1, Las: 2, Gory: Infinity };
const DEFAULT_TILE = { passable: true, cost: 1, ford: false, name: 'Rownina' };

const keyOf = (c, r) => c + ',' + r;

// Uruchamia `_doMove` z pina (z realnym `_moveCostForUnit`) dla jednego wektora wejsciowego.
const runCase = (inp) => {
  const inst = new Pin();
  inst.refused = inp.refused;
  inst.terrainData = CAV_TABLE;
  inst.defaultTile = DEFAULT_TILE;
  inst.tiles = new Map(inp.tiles.map((t) => [keyOf(t.c, t.r), { passable: t.passable, cost: t.cost, ford: t.ford, name: t.name }]));
  const mover = { id: 'u', q: inp.unit.q, r: inp.unit.r, moveLeft: inp.unit.move_left, mounted: inp.unit.mounted,
    group: { position: { set() {} } }, hpBarGroup: { position: { set() {} } } };
  inst.occByKey = new Map(inp.occupancy.map(([c, r, id]) => [keyOf(c, r), id === 'u' ? mover : { id }]));
  inst._autoBatchPlanning = inp.autobatch === null
    ? null
    : { intent: { unit_id: 'u', kind: inp.autobatch.kind, steps: inp.autobatch.steps.map(([c, r]) => ({ col: c, row: r })) } };
  const cost = inst._moveCostForUnit(mover, inp.col, inp.row);
  let doneCalls = 0;
  inst._doMove(mover, inp.col, inp.row, () => { doneCalls += 1; });
  const occupancy = [...inst.occByKey.entries()]
    .map(([k, v]) => { const [c, r] = k.split(',').map(Number); return [c, r, v.id]; })
    .sort((x, y) => x[0] - y[0] || x[1] - y[1] || (x[2] < y[2] ? -1 : x[2] > y[2] ? 1 : 0));
  const intent = inst._autoBatchPlanning === null
    ? null
    : { kind: inst._autoBatchPlanning.intent.kind, steps: inst._autoBatchPlanning.intent.steps.map((s) => [s.col, s.row]) };
  return {
    cost: Number.isFinite(cost) ? cost : null,
    q: mover.q,
    r: mover.r,
    move_left: mover.moveLeft,
    occupancy,
    done: doneCalls > 0,
    intent,
  };
};

// --- Przypadki nazwane (wartosc oczekiwana = wykonanie pina; straznik `want` sprawdza wynik z gory). ---
const U = (q, r, ml, mounted = false) => ({ q, r, move_left: ml, mounted });
const base = (over) => ({ unit: U(5, 5, 6), col: 5, row: 6, refused: false, tiles: [], occupancy: [[5, 5, 'u']],
  autobatch: null, ...over });
const T = (c, r, over) => ({ c, r, passable: true, cost: 1, ford: false, name: 'Rownina', ...over });
const named = [
  { name: 'piechota_krok_zwykly', pin: 'battleScene.ts:8718-8761 + 7436-7443', input: base({}),
    want: { cost: 1, q: 5, r: 6, move_left: 5, occupancy: [[5, 6, 'u']], done: false, intent: null } },
  { name: 'piechota_las_koszt_pelny', pin: 'battleScene.ts:7439 (!mounted)', input: base({ tiles: [T(5, 6, { name: 'Las', cost: 2 })] }),
    want: { cost: 2, q: 5, r: 6, move_left: 4, occupancy: [[5, 6, 'u']], done: false, intent: null } },
  { name: 'kawaleria_las_mnoznik_x2', pin: 'battleScene.ts:7440-7442', input: base({ unit: U(5, 5, 6, true), tiles: [T(5, 6, { name: 'Las', cost: 2 })] }),
    want: { cost: 4, q: 5, r: 6, move_left: 2, occupancy: [[5, 6, 'u']], done: false, intent: null } },
  { name: 'kawaleria_gory_niedostepne', pin: 'battleScene.ts:7441 (Infinity -> clamp 99)', input: base({ unit: U(5, 5, 120, true), tiles: [T(5, 6, { name: 'Gory' })] }),
    want: { cost: null, q: 5, r: 6, move_left: 21, occupancy: [[5, 6, 'u']], done: false, intent: null } },
  { name: 'piechota_gory_ten_sam_kafelek', pin: 'battleScene.ts:7439 (!mounted, Gory dostepne)', input: base({ unit: U(5, 5, 6, false), tiles: [T(5, 6, { name: 'Gory' })] }),
    want: { cost: 1, q: 5, r: 6, move_left: 5, occupancy: [[5, 6, 'u']], done: false, intent: null } },
  { name: 'niedostepny_kafelek_clamp_99', pin: 'battleScene.ts:7437 + 8700', input: base({ unit: U(5, 5, 120), tiles: [T(5, 6, { passable: false })] }),
    want: { cost: null, q: 5, r: 6, move_left: 21, occupancy: [[5, 6, 'u']], done: false, intent: null } },
  { name: 'brod_na_celu_kawaleria_las', pin: 'battleScene.ts:8747-8752 + 7440', input: base({ unit: U(5, 5, 10, true), tiles: [T(5, 6, { name: 'Las', cost: 2, ford: true })] }),
    want: { cost: 4, q: 5, r: 6, move_left: 2, occupancy: [[5, 6, 'u']], done: false, intent: null } },
  { name: 'brod_na_starcie_piechota', pin: 'battleScene.ts:8747-8749', input: base({ unit: U(5, 5, 10), tiles: [T(5, 5, { cost: 3, ford: true })] }),
    want: { cost: 1, q: 5, r: 6, move_left: 8, occupancy: [[5, 6, 'u']], done: false, intent: null } },
  { name: 'koszt_clamp_dolny_1', pin: 'battleScene.ts:8700', input: base({ tiles: [T(5, 6, { cost: 0.4 })] }),
    want: { cost: 0.4, q: 5, r: 6, move_left: 5, occupancy: [[5, 6, 'u']], done: false, intent: null } },
  { name: 'odmowa_nie_rusza_zajetosci', pin: 'battleScene.ts:8689-8692', input: base({ refused: true, occupancy: [[5, 5, 'u'], [5, 6, 'o0']] }),
    want: { cost: 1, q: 5, r: 5, move_left: 0, occupancy: [[5, 5, 'u'], [5, 6, 'o0']], done: true, intent: null } },
  { name: 'sasiad_zachowany', pin: 'battleScene.ts:8694-8697', input: base({ occupancy: [[5, 5, 'u'], [9, 9, 'o0']] }),
    want: { cost: 1, q: 5, r: 6, move_left: 5, occupancy: [[5, 6, 'u'], [9, 9, 'o0']], done: false, intent: null } },
  { name: 'planowanie_hold_staje_sie_move', pin: 'battleScene.ts:8705-8706', input: base({ autobatch: { kind: 'hold', steps: [] } }),
    want: { cost: 1, q: 5, r: 6, move_left: 5, occupancy: [[5, 6, 'u']], done: true, intent: { kind: 'move', steps: [[5, 6]] } } },
  { name: 'planowanie_attack_zostaje', pin: 'battleScene.ts:8705', input: base({ autobatch: { kind: 'attack', steps: [[4, 4]] } }),
    want: { cost: 1, q: 5, r: 6, move_left: 5, occupancy: [[5, 6, 'u']], done: true, intent: { kind: 'attack', steps: [[4, 4], [5, 6]] } } },
];

// --- Losowe przypadki (ziarno deterministyczne; mulberry32). ---
const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = mulberry32(777);
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (xs) => xs[ri(0, xs.length - 1)];
const NAMES = ['Rownina', 'Las', 'Gory', 'Woda'];
const randomCase = (i) => {
  const q = ri(3, 60);
  const r = ri(3, 150);
  const [dc, dr] = pick([[0, -1], [1, 0], [0, 1], [-1, 0]]);
  const col = q + dc;
  const row = r + dr;
  const seen = new Set([keyOf(q, r), keyOf(col, row)]);
  const occupancy = [[q, r, 'u']];
  const tiles = [];
  for (const [c, rr] of [[col, row], [q + 2, r], [q, r + 1]]) {
    if (rnd() < 0.5) continue;
    tiles.push(T(c, rr, {
      passable: rnd() > 0.15,
      cost: pick([0.4, 1, 2, 3, 6, 99]),
      ford: rnd() < 0.3,
      name: pick(NAMES),
    }));
  }
  for (let k = 0; k < ri(0, 3); k++) {
    const oc = q + ri(-2, 2);
    const or = r + ri(-2, 2);
    if (seen.has(keyOf(oc, or))) continue;
    seen.add(keyOf(oc, or));
    occupancy.push([oc, or, `o${k}`]);
  }
  const autobatch = rnd() < 0.5
    ? null
    : { kind: pick(['hold', 'move', 'attack']), steps: Array.from({ length: ri(0, 2) }, () => [ri(3, 60), ri(3, 150)]) };
  return {
    name: `losowy_${String(i).padStart(3, '0')}`,
    pin: 'battleScene.ts:8685-8776 + 7436-7443',
    input: {
      unit: U(q, r, pick([0, 0.5, 1, 2, 3, 6, 10, 120]), rnd() < 0.5),
      col,
      row,
      refused: rnd() < 0.1,
      tiles,
      occupancy,
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

const outDir = join(here, 'p6_k5doc_t4e_vectors');
mkdirSync(outDir, { recursive: true });
const out = {
  pin: PIN,
  pin_path: PIN_PATH,
  range: '8685-8776 (_doMove), 7436-7443 (_moveCostForUnit)',
  fragments: digests,
  stubs: ['cavalryTerrainMultiplier (CAV_TABLE)', '_siegeMoveRefused', '_updateFacing', '_now', '_raf', 'cellToWorld', 'tileTopY', 'BTerrain', 'terrainMap'],
  cases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(out, null, 1) + '\n');
const nRefused = cases.filter((c) => c.input.refused).length;
const nMounted = cases.filter((c) => c.input.unit.mounted).length;
const nPlan = cases.filter((c) => c.input.autobatch !== null).length;
console.log(`OK: ${cases.length} przypadkow (odmowa=${nRefused}, kawaleria=${nMounted}, planowanie=${nPlan}) -> ${join(outDir, 'vectors.json')}`);
