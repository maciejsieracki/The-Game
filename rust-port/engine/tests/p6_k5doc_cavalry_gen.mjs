// P6 SIEGE K5DOC-T6 JAZDA (dispatch R-RUSTPORT-P6-K5DOC-T6-JAZDA, runda 1, Operator): generator wektorow dla
// rust-port/engine/src/domain/siege_tactics_cavalry.rs (cavalry_action_decide, best_charge_step).
//
// Uruchomienie: node rust-port/engine/tests/p6_k5doc_cavalry_gen.mjs
// Wynik: tests/p6_k5doc_cavalry_vectors/vectors.json
//
// ORAKUL = WYKONANIE TEKSTU PINA. Fragmenty pina (git show 07d2fbd72, bez checkoutu) sa transpilowane przez TypeScript
// i WYKONYWANE: _cavalryAction (6372-6412), _cavDirectedManeuverStep (6426-6446), _cavManeuverStep (6457-6501),
// _cavPriority (6313-6318), _cavalryTarget (6326-6340), _cavAdjacentNonSpear (6351-6370), _firstStepTowardDirectedAttack
// (8509-8550), _bestChargeStepKey (17736-17775), desiredHitForDirection (1956-1960), relativeHit (385-400) wraz z
// facingToward/oppositeDir, _enemiesOf (8291-8294), _firstStepAlongPathToAttack (8565-8622), _stepToward (8413-8427),
// const enum Dir (315-320), DIRS4/DIR_DELTA (326-337), BF_COLS/BF_ROWS (661-662), manhattan (1917-1919),
// FORD_AI_AVOID_PENALTY (998), isFordTile (1897-1899).
//
// STUBY (poza wycinkami pina; kazdy odpowiada jednej metodzie sceny spoza tematu T6, zapisanej w wektorze):
//   _passableForUnit(ru,c,r)       -> zbior `impassable` (w Rust: CavTerrain::passable)
//   tm.at(c,r) dla isFordTile       -> zbior `ford` (w Rust: CavTerrain::is_ford); BTerrain.Ford = 7 (stala stubu)
//   _canStrikeTargetFrom(ru,c,r,t)  -> zbior `strike` [c,r,indeks celu] (w Rust: CavTerrain::can_strike_from)
//   _makeCanAttackFromTest(ru)      -> zbior `attack_from` (w Rust: CavTerrain::can_attack_from)
//   _doAttack(ru,tgt,done)          -> zapis ["attack", indeks w liscie przeciwnikow] + done()
//   _doMove(ru,nc,nr,done)          -> zapis ["move",c,r]; zajetosc: usun stary kafelek, dodaj nowy; moveLeft -= 1; done()
//                                      (pelna semantyka _doMove = T4c; tu minimum zgodne z driverem Rust)
//   _pickTargetByPriority, _forwardCol -> rzucaja blad (nieosiagalne: wywolania zawsze podaja cel)
// occByKey = zbior `occupied` z wektora (zawiera ru i przeciwnikow, jak w pinie).
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

// [poczatek, koniec, fragment nagłówka, fragment końca]; koniec metod klasy = "  }", funkcji najwyzszego poziomu = "}".
const FRAGMENTS = {
  constDir: { range: [315, 320], head: 'const enum Dir', tail: '}' },
  dirDelta: { range: [326, 331], head: 'const DIR_DELTA', tail: '];' },
  dirs4: { range: [337, 337], head: 'const DIRS4', tail: 'DIR_DELTA;' },
  bfDims: { range: [661, 662], head: 'const BF_COLS', tail: 'const BF_ROWS' },
  ford: { range: [998, 998], head: 'const FORD_AI_AVOID_PENALTY', tail: ';' },
  isFordTile: { range: [1897, 1899], head: 'function isFordTile', tail: '}' },
  manhattan: { range: [1917, 1919], head: 'function manhattan', tail: '}' },
  desiredHit: { range: [1956, 1960], head: 'function desiredHitForDirection', tail: '}' },
  facingToward: { range: [347, 353], head: 'export function facingToward', tail: '}' },
  oppositeDir: { range: [370, 372], head: 'export function oppositeDir', tail: '}' },
  relativeHit: { range: [385, 400], head: 'export function relativeHit', tail: '}' },
  stepToward: { range: [8413, 8427], head: 'private _stepToward(', tail: '  }' },
  enemiesOf: { range: [8291, 8294], head: 'private _enemiesOf(', tail: '  }' },
  firstStep: { range: [8565, 8622], head: 'private _firstStepAlongPathToAttack(', tail: '  }' },
  cavPriority: { range: [6313, 6318], head: 'private _cavPriority(', tail: '  }' },
  cavTarget: { range: [6326, 6340], head: 'private _cavalryTarget(', tail: '  }' },
  cavAdjNonSpear: { range: [6351, 6370], head: 'private _cavAdjacentNonSpear(', tail: '  }' },
  cavalryAction: { range: [6372, 6412], head: 'private _cavalryAction(', tail: '  }' },
  cavDirected: { range: [6426, 6446], head: 'private _cavDirectedManeuverStep(', tail: '  }' },
  cavManeuver: { range: [6457, 6501], head: 'private _cavManeuverStep(', tail: '  }' },
  firstStepDirected: { range: [8509, 8550], head: 'private _firstStepTowardDirectedAttack(', tail: '  }' },
  bestCharge: { range: [17736, 17775], head: 'private _bestChargeStepKey(', tail: '  }' },
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
  pinRange(315, 320).replace('export const enum', 'const enum'),
  pinRange(326, 331),
  pinRange(337, 337),
  pinRange(661, 662),
  pinRange(998, 998),
  'const BTerrain = { Ford: 7 };',
  pinRange(1897, 1899),
  pinRange(1917, 1919),
  pinRange(1956, 1960),
  pinRange(347, 353).replace('export function', 'function'),
  pinRange(370, 372).replace('export function', 'function'),
  pinRange(385, 400).replace('export function', 'function'),
  'function cellKey(col, row) { return col + "," + row; }',
  'class P {',
  'constructor() { this.atk = []; this.def = []; this.occByKey = new Set(); this.finished = false;',
  '  this._impass = new Set(); this._ford = new Set(); this._strike = new Set(); this._attackFrom = new Set();',
  '  this._log = []; this.terrainMap = { at: (c, r) => (this._ford.has(c + "," + r) ? BTerrain.Ford : 0) }; }',
  '_canStrikeTargetFrom(ru, c, r, target) { return this._strike.has(c + "," + r + "," + target.id); }',
  '_makeCanAttackFromTest(ru) { return (q, r) => this._attackFrom.has(q + "," + r); }',
  '_passableForUnit(ru, col, row) { return !this._impass.has(col + "," + row); }',
  '_pickTargetByPriority(ru) { throw new Error("nieosiagalne"); }',
  '_forwardCol(side, col, steps) { throw new Error("nieosiagalne"); }',
  '_doAttack(ru, tgt, done) { this._log.push(["attack", this.def.indexOf(tgt)]); done(); }',
  '_doMove(ru, nc, nr, done) { this.occByKey.delete(ru.q + "," + ru.r); this.occByKey.add(nc + "," + nr); ru.q = nc; ru.r = nr; ru.moveLeft -= 1; this._log.push(["move", nc, nr]); done(); }',
  pinRange(6313, 6318),
  pinRange(6326, 6340),
  pinRange(6351, 6370),
  pinRange(6372, 6412),
  pinRange(6426, 6446),
  pinRange(6457, 6501),
  pinRange(8291, 8294),
  pinRange(8413, 8427),
  pinRange(8509, 8550),
  pinRange(8565, 8622),
  pinRange(17736, 17775),
  '}',
  'module.exports.P = P;',
].join('\n');
const execJs = tsLib.transpileModule(classSrc, {
  compilerOptions: {
    module: tsLib.ModuleKind.CommonJS,
    target: tsLib.ScriptTarget.ES2020,
    preserveConstEnums: true,
  },
}).outputText;
const pinMod = { exports: {} };
new Function('module', 'exports', 'require', execJs)(pinMod, pinMod.exports, createRequire(import.meta.url));
const Pin = pinMod.exports.P;

const keyOf = (c, r) => c + ',' + r;
const parseKey = (k) => (k === null || k === undefined ? null : k.split(',').map(Number));

// Jednostka w formie RuntimeBattleUnit (tylko pola czytane przez wycinki pina).
const mkUnit = (u, id, side) => ({
  id,
  side,
  q: u.q,
  r: u.r,
  facing: u.facing,
  mounted: u.mounted,
  primaryRanged: u.primary_ranged,
  antiCavSpear: u.anti_cav_spear,
  attackDirection: u.attack_direction ?? 'front',
  dead: u.dead ?? false,
  fadingOut: u.fading_out ?? false,
  routed: u.routed ?? false,
  moveLeft: u.moves_left ?? 0,
  bu: { hp: u.hp },
});

const buildInst = (c) => {
  const inst = new Pin();
  const me = mkUnit(c.me, 0, 'atk');
  inst.atk = [me];
  inst.def = c.enemies.map((e, i) => mkUnit(e, i, 'def'));
  inst.occByKey = new Set(c.occupied.map(([a, b]) => keyOf(a, b)));
  inst._impass = new Set(c.impassable.map(([a, b]) => keyOf(a, b)));
  inst._ford = new Set(c.ford.map(([a, b]) => keyOf(a, b)));
  inst._strike = new Set(c.strike.map(([a, b, t]) => keyOf(a, b) + ',' + t));
  inst._attackFrom = new Set(c.attack_from.map(([a, b]) => keyOf(a, b)));
  return { inst, me };
};

const runCase = (c) => {
  const { inst, me } = buildInst(c);
  if (c.kind === 'action') {
    inst._cavalryAction(me, () => {});
    return inst._log;
  }
  if (c.kind === 'charge') {
    const tgt = inst.def[c.tgt];
    return parseKey(inst._bestChargeStepKey(me, tgt));
  }
  throw new Error(`nieznany rodzaj ${c.kind}`);
};

// --- Przypadki nazwane (rozumowanie w komentarzu; wartosc oczekiwana = wykonanie pina; straznik `want`/`notWant`). ---
const base = (over) => ({
  kind: 'action',
  me: { q: 5, r: 5, facing: 0, mounted: true, primary_ranged: false, anti_cav_spear: false, attack_direction: 'front', hp: 20, moves_left: 1 },
  enemies: [],
  occupied: [],
  impassable: [],
  ford: [],
  strike: [],
  attack_from: [],
  ...over,
});
const named = [
  {
    // (a) sasiad nie-wlocznik -> natychmiastowy cios (pin 6372, krok 1). Wrog piechota w (5,6).
    name: 'a_sasiad_nie_wlocznik_cios', pin: 'battleScene.ts:6372-6412 (krok 1), 6351',
    input: base({
      enemies: [{ q: 5, r: 6, facing: 0, mounted: false, primary_ranged: false, anti_cav_spear: false, hp: 10 }],
      occupied: [[5, 5], [5, 6]],
    }),
    want: [['attack', 0]],
  },
  {
    // (a2) sasiad-wlocznik nie jest celem ciosu (pin 6357-6358): brak innych sasiadow -> nie ma kroku 1; wlocznik
    // jest sasiadem, wiec krok 3 (forsowany atak) ma prawo go zaatakowac, gdy brak manewru. Zablokowane otoczenie.
    name: 'a2_sasiad_wlocznik_nie_jest_ciosem_krok1', pin: 'battleScene.ts:6351-6370, 6372-6412',
    input: base({
      enemies: [{ q: 5, r: 6, facing: 0, mounted: false, primary_ranged: false, anti_cav_spear: true, hp: 10 }],
      occupied: [[5, 5], [5, 6], [4, 5], [6, 5], [5, 4]],
    }),
    want: [['attack', 0]],
  },
  {
    // (b) manewr omijajacy wlocznie: cel-piechota (7,10); wlocznik (6,4) przylega do (6,5), nie do (5,6).
    // Pin: score(6,5)=6+0 (spearAdj), score(5,6)=6+5 -> krok (5,6). Mutant +5<->+0 wybierze (6,5).
    name: 'b_kara_spearAdj_wybiera_krok_bez_wlocznika', pin: 'battleScene.ts:6457-6501 (spearAdj +0/+5)',
    input: base({
      me: { q: 5, r: 5, facing: 0, mounted: true, primary_ranged: false, anti_cav_spear: false, attack_direction: 'front', hp: 20, moves_left: 1 },
      enemies: [
        { q: 7, r: 10, facing: 0, mounted: false, primary_ranged: false, anti_cav_spear: false, hp: 10 },
        { q: 6, r: 4, facing: 0, mounted: false, primary_ranged: false, anti_cav_spear: true, hp: 10 },
      ],
      occupied: [[5, 5], [7, 10], [6, 4]],
    }),
    want: [['move', 5, 6]],
  },
  {
    // (c) manewr 'bok' (C-FLANK): dwa sasiedzi-piechurzy; A (5,6) trafia flank (facing E), B (6,5) trafia rear
    // (facing E). Pin: desired=flank -> wybor A (mimo wyzszego HP B, ktory bez zadanego luku wygralby po HP).
    name: 'c_bok_preferuje_flank_nad_nizszym_hp', pin: 'battleScene.ts:6351-6370, 1956-1960',
    input: base({
      me: { q: 5, r: 5, facing: 0, mounted: true, primary_ranged: false, anti_cav_spear: false, attack_direction: 'bok', hp: 20, moves_left: 1 },
      enemies: [
        { q: 5, r: 6, facing: 1, mounted: false, primary_ranged: false, anti_cav_spear: false, hp: 10 },
        { q: 6, r: 5, facing: 1, mounted: false, primary_ranged: false, anti_cav_spear: false, hp: 5 },
      ],
      occupied: [[5, 5], [5, 6], [6, 5]],
    }),
    want: [['attack', 0]],
  },
  {
    // (c2) 'tyl' (C-FLANK): ta sama sytuacja, desired=rear -> B (6,5).
    name: 'c2_tyl_preferuje_rear', pin: 'battleScene.ts:6351-6370, 1956-1960',
    input: base({
      me: { q: 5, r: 5, facing: 0, mounted: true, primary_ranged: false, anti_cav_spear: false, attack_direction: 'tyl', hp: 20, moves_left: 1 },
      enemies: [
        { q: 5, r: 6, facing: 1, mounted: false, primary_ranged: false, anti_cav_spear: false, hp: 10 },
        { q: 6, r: 5, facing: 1, mounted: false, primary_ranged: false, anti_cav_spear: false, hp: 5 },
      ],
      occupied: [[5, 5], [5, 6], [6, 5]],
    }),
    want: [['attack', 1]],
  },
  {
    // (d) forsowany atak na wlocznika: sasiad-wlocznik (5,6), otoczenie zajete -> brak manewru -> krok 3.
    name: 'd_forsowany_atak_na_wlocznika', pin: 'battleScene.ts:6372-6412 (krok 3)',
    input: base({
      enemies: [{ q: 5, r: 6, facing: 0, mounted: false, primary_ranged: false, anti_cav_spear: true, hp: 10 }],
      occupied: [[5, 5], [5, 6], [4, 5], [6, 5], [5, 4]],
    }),
    want: [['attack', 0]],
  },
  {
    // (e) szarza (ostatnia szansa, pin 17736): brak sasiadow-kandydatow BFS -> krok greedy/punktacja. Wywolanie
    // bezposrednie _bestChargeStepKey: cel (5,9), zajety (5,6), attack_from (5,8). Dwie sciezki o dlugosci 5
    // (przez (4,5) i przez (6,5)); pin wybiera pierwszy krok (6,5), bo BFS rozwija kierunki w kolejnosci N,E,S,W.
    name: 'e_szarza_bfs_omija_zajety', pin: 'battleScene.ts:17736-17775', kind: 'charge',
    input: base({
      enemies: [{ q: 5, r: 9, facing: 0, mounted: false, primary_ranged: false, anti_cav_spear: false, hp: 10 }],
      occupied: [[5, 5], [5, 6], [5, 9]],
      attack_from: [[5, 8]],
    }),
    tgt: 0,
    want: [6, 5],
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
const ATTACK_DIRS = ['front', 'bok', 'tyl'];
const randomUnit = (cq, cr, span) => ({
  q: cq + ri(-span, span),
  r: cr + ri(-span, span),
  facing: ri(0, 3),
  mounted: rnd() < 0.2,
  primary_ranged: rnd() < 0.15,
  anti_cav_spear: rnd() < 0.3,
  attack_direction: ATTACK_DIRS[ri(0, 2)],
  hp: ri(1, 30),
  dead: rnd() < 0.05,
  fading_out: rnd() < 0.03,
  routed: rnd() < 0.03,
  moves_left: ri(0, 3),
});
const uniq = (list) => {
  const seen = new Set();
  const out = [];
  for (const t of list) {
    const k = keyOf(t[0], t[1]);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
};
const randomScene = (kind) => {
  const me = randomUnit(10, 10, 4);
  me.moves_left = ri(0, 3);
  me.dead = false;
  me.fading_out = false;
  me.routed = false;
  const enemies = Array.from({ length: ri(1, 4) }, () => randomUnit(10, 10, 6));
  if (rnd() < 0.5) {
    // Polowa scen: pierwszy przeciwnik przylega do jednostki (sciezka ciosu i kary spearAdj).
    const [dc, dr] = [[0, -1], [1, 0], [0, 1], [-1, 0]][ri(0, 3)];
    enemies[0].q = me.q + dc;
    enemies[0].r = me.r + dr;
  }
  const occ = uniq([
    [me.q, me.r],
    ...enemies.map((e) => [e.q, e.r]),
    ...Array.from({ length: ri(0, 10) }, () => [10 + ri(-5, 5), 10 + ri(-5, 5)]),
  ]);
  const impassable = uniq(Array.from({ length: ri(0, 5) }, () => [10 + ri(-4, 4), 10 + ri(-4, 4)]));
  const ford = uniq(Array.from({ length: ri(0, 4) }, () => [10 + ri(-4, 4), 10 + ri(-4, 4)]));
  const strike = [];
  enemies.forEach((_, ti) => {
    for (let c = 5; c <= 15; c++) for (let r = 5; r <= 15; r++) if (rnd() < 0.25) strike.push([c, r, ti]);
  });
  const attackFrom = [];
  for (let c = 5; c <= 15; c++) for (let r = 5; r <= 15; r++) if (rnd() < 0.15) attackFrom.push([c, r]);
  return {
    kind,
    me,
    enemies,
    occupied: occ,
    impassable,
    ford,
    strike,
    attack_from: attackFrom,
    tgt: ri(0, enemies.length - 1),
  };
};

const cases = [];
const pushCase = (name, pin, input, want, notWant) => {
  const expect = runCase(input);
  if (want !== undefined && JSON.stringify(expect) !== JSON.stringify(want)) {
    throw new Error(`pin != oczekiwany (nazwany ${name}): pin=${JSON.stringify(expect)} want=${JSON.stringify(want)}`);
  }
  if (notWant !== undefined && JSON.stringify(expect) === JSON.stringify(notWant)) {
    throw new Error(`pin zwrocil zakazany wynik (nazwany ${name}): ${JSON.stringify(expect)}`);
  }
  cases.push({ name, pin, ...input, expect });
  return expect;
};
for (const n of named) {
  const { name, pin, want, input } = n;
  pushCase(name, pin, { kind: 'action', tgt: 0, ...input, ...(n.kind ? { kind: n.kind, tgt: n.tgt } : {}) }, want);
}
const NR_ACTION = 500;
const NR_CHARGE = 200;
for (let i = 0; i < NR_ACTION; i++) {
  pushCase(`losowy_action_${String(i).padStart(3, '0')}`, 'battleScene.ts:6372-6412', randomScene('action'));
}
for (let i = 0; i < NR_CHARGE; i++) {
  pushCase(`losowy_charge_${String(i).padStart(3, '0')}`, 'battleScene.ts:17736-17775', randomScene('charge'));
}

const outDir = join(here, 'p6_k5doc_cavalry_vectors');
mkdirSync(outDir, { recursive: true });
const out = {
  pin: PIN,
  pin_path: PIN_PATH,
  fragments: digests,
  stubs: [
    '_passableForUnit', 'isFordTile (tm.at)', '_canStrikeTargetFrom', '_makeCanAttackFromTest',
    '_doAttack', '_doMove (minimum: zajetosc, pozycja, moveLeft)', '_pickTargetByPriority', '_forwardCol',
  ],
  cases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(out, null, 1) + '\n');
const nAct = cases.filter((c) => c.kind === 'action').length;
const nCh = cases.filter((c) => c.kind === 'charge').length;
const actions = cases.filter((c) => c.kind === 'action');
const nMove = actions.filter((c) => c.expect.some((s) => s[0] === 'move')).length;
const nAtt = actions.filter((c) => c.expect.some((s) => s[0] === 'attack')).length;
console.log(`OK: ${cases.length} przypadkow (action=${nAct}, charge=${nCh}, z ruchem=${nMove}, z atakiem=${nAtt}) -> ${join(outDir, 'vectors.json')}`);
