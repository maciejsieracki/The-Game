// P6 SIEGE K5DOC-T7a FALANGA (dispatch R-RUSTPORT-P6-K5DOC-T7A-FALANGA, runda 1, Operator):
// generator wektorow dla `is_phalanx`, `phalanx_line_front`, `phalanx_action_decide`, `phalanx_step_decide`
// (rust-port/engine/src/domain/siege_tactics_phalanx.rs).
//
// Uruchomienie: node rust-port/engine/tests/p6_k5doc_t7a_gen.mjs
// Wynik: tests/p6_k5doc_t7a_vectors/vectors.json
//
// ORAKUL = WYKONANIE TEKSTU PINA. Fragmenty pina (git show 07d2fbd72, bez checkoutu) sa transpilowane przez TypeScript
// i WYKONYWANE; oczekiwane wartosci pochodza z wykonania, nie z reki.
//   isPhalanx                 battleScene.ts:1538-1544
//   normName                  battleScene.ts:1648-1650
//   PHALANX_LEAD_TOLERANCE    battleScene.ts:1168
//   DIR_DELTA / DIRS4         battleScene.ts:326-331, 337
//   BF_COLS / BF_ROWS         battleScene.ts:661-662
//   cellKey                   battleScene.ts:1797
//   manhattan                 battleScene.ts:1917-1919
//   _phalanxLineFront         battleScene.ts:6519-6528
//   _advanceCoord             battleScene.ts:6537-6539
//   _phalanxAdvanceOf         battleScene.ts:6542-6544
//   _phalanxAction            battleScene.ts:6546-6578
//   _phalanxStep              battleScene.ts:6588-6636
// STUBOWANE (zaleznosci spoza wycinka, wartosci z wektora): _targetInRange (adjacent), _enemiesOf, _passableForUnit,
// occByKey, finished. Zapisy: _doAttack / _doMove / _advanceStep / done() sa przechwytywane.
// Callback _doMove w pinie to `() => { done(); }`: harness NIE wola go, bo kontynuacja po ruchu jest efektem wolajacego.
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

// [poczatek, koniec, tekst poczatku, tekst konca (dokladnie gdy zaczyna sie od spacji, inaczej zawiera)]
const FRAGMENTS = {
  isPhalanx: { range: [1538, 1544], head: 'function isPhalanx', tail: '}' },
  normName: { range: [1648, 1650], head: 'function normName', tail: '}' },
  leadTol: { range: [1168, 1168], head: 'const PHALANX_LEAD_TOLERANCE', tail: ';' },
  dirDelta: { range: [326, 331], head: 'const DIR_DELTA', tail: '];' },
  dirs4: { range: [337, 337], head: 'const DIRS4', tail: 'DIR_DELTA;' },
  bfDims: { range: [661, 662], head: 'const BF_COLS', tail: 'const BF_ROWS' },
  cellKey: { range: [1797, 1797], head: 'function cellKey', tail: '}' },
  manhattan: { range: [1917, 1919], head: 'function manhattan', tail: '}' },
  lineFront: { range: [6519, 6528], head: '_phalanxLineFront', tail: '  }' },
  advanceCoord: { range: [6537, 6539], head: '_advanceCoord', tail: '  }' },
  phalanxAdvanceOf: { range: [6542, 6544], head: '_phalanxAdvanceOf', tail: '  }' },
  phalanxAction: { range: [6546, 6578], head: '_phalanxAction', tail: '  }' },
  phalanxStep: { range: [6588, 6636], head: '_phalanxStep', tail: '  }' },
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
const modSrc = [
  pinRange(1168, 1168),
  pinRange(326, 331),
  pinRange(337, 337),
  pinRange(661, 662),
  pinRange(1797, 1797),
  pinRange(1917, 1919),
  pinRange(1538, 1544),
  pinRange(1648, 1650),
  'class P {',
  'constructor() { this.occByKey = new Set(); this._impass = new Set(); this._enemies = []; this._adj = null; this._rec = null; this.finished = false; this.atk = []; this.def = []; }',
  '_targetInRange(ru) { return this._adj; }',
  '_enemiesOf(ru) { return this._enemies; }',
  '_passableForUnit(ru, col, row) { return !this._impass.has(col + "," + row); }',
  '_doAttack(ru, target, done) { if (this._rec === null) this._rec = { kind: "attack", target: target.id }; }',
  '_doMove(ru, nc, nr, cb) { if (this._rec === null) this._rec = { kind: "move", col: nc, row: nr }; }',
  '_advanceStep(ru, done) { if (this._rec === null) this._rec = { kind: "advance_step" }; }',
  pinRange(6519, 6528),
  pinRange(6537, 6539),
  pinRange(6542, 6544),
  pinRange(6546, 6578),
  pinRange(6588, 6636),
  '}',
  'module.exports.P = P;',
  'module.exports.isPhalanx = isPhalanx;',
  'module.exports.normName = normName;',
  'module.exports.PHALANX_LEAD_TOLERANCE = PHALANX_LEAD_TOLERANCE;',
  'module.exports.DIRS4 = DIRS4;',
  'module.exports.BF_COLS = BF_COLS;',
  'module.exports.BF_ROWS = BF_ROWS;',
].join('\n');
const execJs = tsLib.transpileModule(modSrc, {
  compilerOptions: { module: tsLib.ModuleKind.CommonJS, target: tsLib.ScriptTarget.ES2020 },
}).outputText;
const pinMod = { exports: {} };
new Function('module', 'exports', 'require', execJs)(pinMod, pinMod.exports, createRequire(import.meta.url));
const Pin = pinMod.exports.P;
const { isPhalanx, normName, PHALANX_LEAD_TOLERANCE, DIRS4, BF_COLS, BF_ROWS } = pinMod.exports;

// --- Predykat isPhalanx: wejscie = bu { kategoria, stats: { Jednostka } | undefined, nazwa } ---
const runIsPhalanx = (c) => {
  const bu = { kategoria: c.kategoria ?? undefined, nazwa: c.nazwa ?? undefined };
  if (c.stats !== null) bu.stats = { Jednostka: c.stats.Jednostka };
  return isPhalanx(bu);
};

const isPhalanxCases = [
  { name: 'kategoria_falanga_wprost', pin: 'battleScene.ts:1541', input: { kategoria: 'falanga', stats: null, nazwa: 'Cokolwiek' } },
  { name: 'kategoria_falanga_wielka_litera', pin: 'battleScene.ts:1541 (normName)', input: { kategoria: 'Falanga', stats: null, nazwa: 'x' } },
  { name: 'kategoria_falanga_diakrytyk', pin: 'battleScene.ts:1541 (normName NFD)', input: { kategoria: 'Falangą', stats: null, nazwa: 'x' } },
  { name: 'kategoria_falanga_z_sufiksem_negatyw', pin: 'battleScene.ts:1541 (cat === falanga, nie includes)', input: { kategoria: 'falanga-ciezka', stats: null, nazwa: 'Zolnierz' } },
  { name: 'kategoria_wlocznik_nazwa_falang_fallback', pin: 'battleScene.ts:1543', input: { kategoria: 'Wlocznik', stats: null, nazwa: 'Falangita' } },
  { name: 'nazwa_hoplit_fallback', pin: 'battleScene.ts:1543', input: { kategoria: 'Wlocznik', stats: null, nazwa: 'Hoplita' } },
  { name: 'nazwa_sarissa_wielkie_litery', pin: 'battleScene.ts:1543', input: { kategoria: 'Piechota', stats: null, nazwa: 'SARISSA' } },
  { name: 'nazwa_phalanx_angielska', pin: 'battleScene.ts:1543', input: { kategoria: null, stats: null, nazwa: 'Phalanx' } },
  { name: 'jednostka_phalanx_w_stats', pin: 'battleScene.ts:1543 (stats.Jednostka)', input: { kategoria: 'Piechota', stats: { Jednostka: 'Phalanx' }, nazwa: 'Cokolwiek' } },
  { name: 'jednostka_niepusta_przesloni_nazwe', pin: 'battleScene.ts:1543 (?? nie wpada w nazwe)', input: { kategoria: 'Piechota', stats: { Jednostka: 'Pikinier' }, nazwa: 'Falanga' } },
  { name: 'jednostka_null_wpada_w_nazwe', pin: 'battleScene.ts:1543 (null ?? nazwa)', input: { kategoria: 'Piechota', stats: { Jednostka: null }, nazwa: 'Hoplit' } },
  { name: 'stats_brak_nazwa_falang', pin: 'battleScene.ts:1543 (stats undefined)', input: { kategoria: 'Piechota', stats: null, nazwa: 'falanga' } },
  { name: 'wlocznik_nie_jest_falanga', pin: 'battleScene.ts:1541-1543 (negatyw)', input: { kategoria: 'Wlocznik', stats: null, nazwa: 'Wlocznik' } },
  { name: 'lucznik_nie_jest_falanga', pin: 'battleScene.ts:1541-1543 (negatyw)', input: { kategoria: 'Lucznik', stats: null, nazwa: 'Lucznik' } },
  { name: 'brak_wszystkiego_negatyw', pin: 'battleScene.ts:1541-1543 (negatyw)', input: { kategoria: null, stats: null, nazwa: null } },
];

// --- phalanx_line_front / _phalanxLineFront ---
const toRU = (u) => ({
  id: u.id, q: u.q, r: u.r, side: u.side, dead: u.dead, fadingOut: u.fading_out, routed: u.routed, phalanx: u.phalanx,
});
const P0 = (over) => ({ id: 'p', q: 5, r: 5, side: 'atk', dead: false, fading_out: false, routed: false, phalanx: true, ...over });

const lineFrontCases = [
  { name: 'pusta_lista_null', pin: 'battleScene.ts:6526 (group.length<=1)', unit_id: null, side: 'atk', units: [] },
  { name: 'lone_falanga_null', pin: 'battleScene.ts:6526-6527', unit_id: 'a', side: 'atk', units: [P0({ id: 'a', q: 4 })] },
  { name: 'dwie_falangi_atk_min', pin: 'battleScene.ts:6524-6527', unit_id: 'a', side: 'atk', units: [P0({ id: 'a', q: 5 }), P0({ id: 'b', q: 9 })] },
  { name: 'trzy_falangi_atk_min_srodek', pin: 'battleScene.ts:6526', unit_id: 'b', side: 'atk', units: [P0({ id: 'a', q: 8 }), P0({ id: 'b', q: 3 }), P0({ id: 'c', q: 6 })] },
  { name: 'def_advance_minus_q', pin: 'battleScene.ts:6537-6538 (def: -q)', unit_id: 'a', side: 'def', units: [P0({ id: 'a', q: 4, side: 'def' }), P0({ id: 'b', q: 6, side: 'def' })] },
  { name: 'wykluczenie_dead_routed_fading', pin: 'battleScene.ts:6523 (filter)', unit_id: 'a', side: 'atk', units: [P0({ id: 'a', q: 3 }), P0({ id: 'b', q: 9, dead: true }), P0({ id: 'c', q: 1, routed: true }), P0({ id: 'd', q: 0, fading_out: true })] },
  { name: 'wykluczenie_nie_falanga', pin: 'battleScene.ts:6520 (u.phalanx)', unit_id: 'a', side: 'atk', units: [P0({ id: 'a', q: 3 }), P0({ id: 'x', q: 0, phalanx: false })] },
  { name: 'wykluczenie_zostaje_jeden_null', pin: 'battleScene.ts:6526 (po filtrze <=1)', unit_id: 'a', side: 'atk', units: [P0({ id: 'a', q: 3 }), P0({ id: 'b', q: 9, dead: true })] },
];

// --- _phalanxAction + _phalanxStep ---
// Wejscie: side_units (wszystkie jednostki strony, w tym ru), unit_id, enemies, adjacent, occupied, impassable, finished.
const runAction = (c) => {
  const inst = new Pin();
  inst.finished = c.finished;
  inst.occByKey = new Set(c.occupied.map(([a, b]) => a + ',' + b));
  inst._impass = new Set(c.impassable.map(([a, b]) => a + ',' + b));
  inst._enemies = c.enemies.map((e) => ({ id: e.id, q: e.q, r: e.r, primaryRanged: e.primary_ranged }));
  inst._adj = c.adjacent === null ? null : { id: c.adjacent.id, q: c.adjacent.q, r: c.adjacent.r };
  const objs = new Map();
  for (const u of c.side_units) objs.set(u.id, toRU(u));
  inst.atk = [...objs.values()].filter((u) => u.side === 'atk');
  inst.def = [...objs.values()].filter((u) => u.side === 'def');
  const ru = objs.get(c.unit_id);
  const unitRU = { ...ru, moveLeft: c.move_left };
  // Ta sama referencja w listach stron (pin porownuje u !== ru).
  const list = ru.side === 'atk' ? inst.atk : inst.def;
  const idx = list.indexOf(ru);
  list[idx] = unitRU;
  inst._rec = null;
  inst._advanceStep = function (u, done) { if (this._rec === null) this._rec = { kind: 'advance_step' }; };
  inst._phalanxAction(unitRU, () => { if (inst._rec === null) inst._rec = { kind: 'done' }; });
  if (inst._rec === null) throw new Error(`pin nie wywolal zadnej galezi (${c.name})`);
  return inst._rec;
};

// Jednostki sceny: ru ustawiany w side_units; ruch ma moveLeft z wejscia.
const A = (over = {}) => ({ id: 'ru', q: 7, r: 10, side: 'atk', dead: false, fading_out: false, routed: false, phalanx: true, ...over });
const ALLY_A = (over = {}) => ({ id: 'a', q: 5, r: 10, side: 'atk', dead: false, fading_out: false, routed: false, phalanx: true, ...over });
const E_MAIN = { id: 'e', q: 12, r: 8, primary_ranged: false };
const act = (over) => ({
  name: '', pin: '', finished: false, unit_id: 'ru', move_left: 2,
  side_units: [A(), ALLY_A()], enemies: [E_MAIN], adjacent: null, occupied: [], impassable: [],
  ...over,
});

const actionCases = [
  { name: 'finished_done', pin: 'battleScene.ts:6547', input: act({ finished: true, adjacent: { id: 'x', q: 7, r: 11 } }) },
  { name: 'dead_done', pin: 'battleScene.ts:6548', input: act({ side_units: [A({ dead: true }), ALLY_A()], adjacent: { id: 'x', q: 7, r: 11 } }) },
  { name: 'fading_out_done', pin: 'battleScene.ts:6548', input: act({ side_units: [A({ fading_out: true }), ALLY_A()], adjacent: { id: 'x', q: 7, r: 11 } }) },
  { name: 'atak_sasiad_przed_linia', pin: 'battleScene.ts:6551', input: act({ adjacent: { id: 'x', q: 7, r: 11 } }) },
  { name: 'atak_sasiad_przy_move_left_zero', pin: 'battleScene.ts:6551 (przed moveLeft)', input: act({ move_left: 0, adjacent: { id: 'x', q: 7, r: 11 } }) },
  { name: 'lone_falanga_advance_step', pin: 'battleScene.ts:6555-6556', input: act({ side_units: [A()], enemies: [E_MAIN] }) },
  { name: 'tolerancja_dokladnie_2_wykonuje_krok', pin: 'battleScene.ts:6563 (myAdv > lineFront+TOL, rowne 2 = nie wstrzymuje)', input: act({ side_units: [ALLY_A({ q: 5 }), A({ q: 7 })] }) },
  { name: 'tolerancja_3_wstrzymuje', pin: 'battleScene.ts:6563-6566 (roznica 3 > TOL=2: hold)', input: act({ side_units: [ALLY_A({ q: 5 }), A({ q: 8 })] }) },
  { name: 'tolerancja_1_wykonuje_krok', pin: 'battleScene.ts:6563', input: act({ side_units: [ALLY_A({ q: 6 }), A({ q: 7 })] }) },
  { name: 'krok_granica_stepAdv_rowna_front_plus_2', pin: 'battleScene.ts:6625 (stepAdv > lineFront+TOL, rowne = dozwolone)', input: act({ side_units: [ALLY_A({ q: 5 }), A({ q: 7 })] }) },
  { name: 'krok_zablokowany_tolerancja_3_hold', pin: 'battleScene.ts:6563', input: act({ side_units: [ALLY_A({ q: 5 }), A({ q: 8 })], enemies: [{ id: 'e', q: 12, r: 8, primary_ranged: false }] }) },
  { name: 'primary_ranged_pominiety', pin: 'battleScene.ts:6597-6599', input: act({ side_units: [ALLY_A({ q: 7, r: 0 }), A()], enemies: [{ id: 'r', q: 7, r: 11, primary_ranged: true }, E_MAIN], occupied: [[7, 11]] }) },
  { name: 'tylko_primary_ranged_done', pin: 'battleScene.ts:6599-6600', input: act({ side_units: [ALLY_A({ q: 7, r: 0 }), A()], enemies: [{ id: 'r', q: 7, r: 11, primary_ranged: true }], occupied: [[7, 11]] }) },
  { name: 'brak_wroga_done', pin: 'battleScene.ts:6600-6601', input: act({ enemies: [] }) },
  { name: 'move_left_zero_done', pin: 'battleScene.ts:6588-6590', input: act({ move_left: 0 }) },
  { name: 'move_left_ujemny_done', pin: 'battleScene.ts:6589 (<=0)', input: act({ move_left: -1 }) },
  { name: 'krok_standard_N', pin: 'battleScene.ts:6605-6635', input: act({ side_units: [ALLY_A({ q: 7, r: 0 }), A()] }) },
  { name: 'krok_zajety_occupied_przesuwa_wybor', pin: 'battleScene.ts:6609 (occByKey)', input: act({ side_units: [ALLY_A({ q: 7, r: 0 }), A()], occupied: [[7, 9]] }) },
  { name: 'krok_nieprzejezdny_odrzucony', pin: 'battleScene.ts:6610 (_passableForUnit)', input: act({ side_units: [ALLY_A({ q: 7, r: 0 }), A()], impassable: [[7, 9]] }) },
  { name: 'brak_zgodnego_kroku_hold', pin: 'battleScene.ts:6632', input: act({ side_units: [ALLY_A({ q: 7, r: 0 }), A()], occupied: [[7, 9], [8, 10]] }) },
  { name: 'hold_roznica_4_wyklucza_krok', pin: 'battleScene.ts:6563-6566', input: act({ side_units: [ALLY_A({ q: 4, r: 10 }), A({ q: 7 })] }) },
  { name: 'krok_w_strone_wroga_S_gdy_brak_N', pin: 'battleScene.ts:6615 (dEnemy < dNow, kierunek S)', input: act({ side_units: [ALLY_A({ q: 7, r: 0 }), A()], enemies: [{ id: 'e', q: 7, r: 14, primary_ranged: false }], occupied: [] }) },
  { name: 'remis_wynik_kolejnosc_DIRS4_E_przed_S', pin: 'battleScene.ts:6632-6633 (strict >)', input: act({ side_units: [ALLY_A({ q: 7, r: 9 }), A({ q: 7, r: 10 })], enemies: [{ id: 'e', q: 12, r: 12, primary_ranged: false }], occupied: [[7, 9]] }) },
  { name: 'def_strona_krok_kierunek_lewy', pin: 'battleScene.ts:6625 (def: stepAdv=-nc)', input: act({ side_units: [A({ side: 'def', q: 7 }), ALLY_A({ id: 'a', q: 9, side: 'def' })], enemies: [{ id: 'e', q: 2, r: 8, primary_ranged: false }] }) },
  // Remis dwoch krokow o tym samym zysku (E i N, oba zbliżaja o 1). N jest pierwszy w kolejnosci N,E,S,W i NIE ma
  // sasiada falangi (ally 8,11 nie stoi przy 7,9). E (8,10) stoi przy ally (8,11): +6 => E wygrywa. Mutant bez +6 => N.
  // Wektor rozstrzyga premie sasiada w remisie (battleScene.ts:6627-6633).
  { name: 'remis_E_z_sasiadem_wygrywa_nad_N_bez_sasiada', pin: 'battleScene.ts:6627-6633 (+6 rozstrzyga remis N vs E)', input: act({ side_units: [A({ q: 7, r: 10 }), ALLY_A({ q: 8, r: 11 })], enemies: [{ id: 'e', q: 12, r: 8, primary_ranged: false }] }) },
  // Granice pola (BF_COLS=68, BF_ROWS=156; battleScene.ts:661-662, 6608). Wrog poza polem w kierunku kroku sprawia,
  // ze krok poza pole bylby zblizajacy; pin musi go odrzucic (Done, bo zaden inny krok nie zbliza).
  { name: 'granica_N_row0_krok_poza_pole_odrzucony', pin: 'battleScene.ts:6608 (nr < 0)', input: act({ side_units: [A({ q: 7, r: 0 }), ALLY_A({ q: 5, r: 0 })], enemies: [{ id: 'e', q: 7, r: -2, primary_ranged: false }] }) },
  { name: 'granica_W_col0_krok_poza_pole_odrzucony', pin: 'battleScene.ts:6608 (nc < 0)', input: act({ side_units: [A({ q: 0, r: 7 }), ALLY_A({ q: 0, r: 5 })], enemies: [{ id: 'e', q: -2, r: 7, primary_ranged: false }] }) },
  { name: 'granica_S_rowBF_ROWS-1_krok_poza_pole_odrzucony', pin: 'battleScene.ts:6608 (nr >= BF_ROWS, nr = BF_ROWS)', input: act({ side_units: [A({ q: 7, r: 155 }), ALLY_A({ q: 5, r: 155 })], enemies: [{ id: 'e', q: 7, r: 157, primary_ranged: false }] }) },
  { name: 'granica_E_colBF_COLS-1_krok_poza_pole_odrzucony', pin: 'battleScene.ts:6608 (nc >= BF_COLS, nc = BF_COLS)', input: act({ side_units: [A({ q: 67, r: 7 }), ALLY_A({ q: 67, r: 5 })], enemies: [{ id: 'e', q: 69, r: 7, primary_ranged: false }] }) },
  { name: 'granica_S_row_BF_ROWS-2_krok_w_polu_dozwolony', pin: 'battleScene.ts:6608 (nr = BF_ROWS-1 jest w polu)', input: act({ side_units: [A({ q: 7, r: 154 }), ALLY_A({ q: 5, r: 154 })], enemies: [{ id: 'e', q: 7, r: 157, primary_ranged: false }] }) },
];

// --- Wykonanie predykatu / linii przez pin ---
const runLineFront = (c) => {
  const inst = new Pin();
  const side = c.units.map(toRU);
  inst.atk = side.filter((u) => u.side === 'atk');
  inst.def = side.filter((u) => u.side === 'def');
  const ru = c.unit_id === null ? { id: 'none', q: 0, r: 0, side: c.side, dead: false, fadingOut: false, routed: false, phalanx: false } : side.find((u) => u.id === c.unit_id);
  const v = inst._phalanxLineFront(ru);
  return v === null ? null : v;
};

const isPhalanxVectors = isPhalanxCases.map((c) => ({ ...c, expect: runIsPhalanx(c.input) }));
const lineFrontVectors = lineFrontCases.map((c) => ({ ...c, expect: runLineFront(c) }));
const actionVectors = actionCases.map((c) => ({ name: c.name, pin: c.pin, input: c.input, expect: runAction(c.input) }));

// Stale pinu (dla testu porownania z Rust).
const constants = {
  PHALANX_LEAD_TOLERANCE,
  BF_COLS,
  BF_ROWS,
  DIRS4,
};

const out = {
  generator: 'p6_k5doc_t7a_gen.mjs',
  pin: PIN,
  digests,
  constants,
  normName_probe: ['Falangą', 'Hoplita', 'łódź'].map((s) => ({ in: s, out: normName(s) })),
  is_phalanx: isPhalanxVectors,
  line_front: lineFrontVectors,
  action: actionVectors,
};

const dir = join(here, 'p6_k5doc_t7a_vectors');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'vectors.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`zapisano ${join(dir, 'vectors.json')}: is_phalanx=${isPhalanxVectors.length} line_front=${lineFrontVectors.length} action=${actionVectors.length}`);
for (const v of actionVectors) console.log(v.name.padEnd(44), JSON.stringify(v.expect));
for (const v of isPhalanxVectors) console.log('isPhalanx', v.name.padEnd(44), v.expect);
for (const v of lineFrontVectors) console.log('lineFront', v.name.padEnd(44), v.expect);
