// P6 SIEGE K5DOC-T5a STRZELEC-KITE (dispatch R-RUSTPORT-P6-K5DOC-T5A-KITE, runda 1, Operator):
// generator wektorow dla galezi KITE strzelca (rust-port/engine/src/domain/siege_tactics_kite.rs).
//
// Uruchomienie: node rust-port/engine/tests/p6_k5doc_t5a_gen.mjs
// Wynik: tests/p6_k5doc_t5a_vectors/vectors.json
//
// ORAKUL = WYKONANIE TEKSTU PINA. Fragmenty pina (git show 07d2fbd72, bez checkoutu) sa transpilowane przez TypeScript
// i WYKONYWANE, wiec wartosci oczekiwane pochodza z pina, a nie z reimplementacji JS:
//   DIR_DELTA / DIRS4            battleScene.ts:326-331, :337
//   BF_COLS / BF_ROWS            battleScene.ts:661-662
//   MELEE_SAFE_GAP               battleScene.ts:968
//   cellKey                      battleScene.ts:1797
//   manhattan                    battleScene.ts:1917-1919
//   warunek galezi 1 KITE        battleScene.ts:6689-6691 (wrapper _kiteGate: tylko ten if, bez ciala galezi)
//   _advanceDir                  battleScene.ts:6743-6745
//   _bestKiteShotStep            battleScene.ts:6959-7002
//   _enemiesOf                   battleScene.ts:8291-8294
//   _nearestEnemyMelee           battleScene.ts:8315-8324
// STUBOWANE sa wyłącznie: occByKey (zbior kluczy "c,r" z wektora; w Rust predykat `occupied`) i _passableForUnit
// (zbior `impassable` z wektora; w Rust predykat `passable`). Pozostala logika sceny nie jest uzywana.
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
  meleeSafeGap: { range: [968, 968], head: 'const MELEE_SAFE_GAP', tail: '2;' },
  cellKey: { range: [1797, 1797], head: 'function cellKey', tail: '}' },
  manhattan: { range: [1917, 1919], head: 'function manhattan', tail: '}' },
  gate: { range: [6689, 6691], head: 'if (ru.primaryRanged && ru.rangedKite !== false) {', tail: 'MELEE_SAFE_GAP) {' },
  advanceDir: { range: [6743, 6745], head: 'private _advanceDir(', tail: '  }' },
  bestKite: { range: [6959, 7002], head: 'private _bestKiteShotStep(', tail: '  }' },
  enemiesOf: { range: [8291, 8294], head: 'private _enemiesOf(', tail: '  }' },
  nearestMelee: { range: [8315, 8324], head: 'private _nearestEnemyMelee(', tail: '  }' },
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
  pinRange(968, 968),
  pinRange(1797, 1797),
  pinRange(1917, 1919),
  'class P {',
  'constructor() { this.occByKey = new Set(); this._impass = new Set(); this.atk = []; this.def = []; }',
  '_passableForUnit(ru, col, row) { return !this._impass.has(col + "," + row); }',
  pinRange(6743, 6745),
  pinRange(8291, 8294),
  pinRange(8315, 8324),
  pinRange(6959, 7002),
  // Wrapper: tylko warunek galezi 1 (6689-6691) + zamkniecie blokow; zwraca, czy galaz KITE by sie uruchomila.
  '_kiteGate(ru) { let taken = false;',
  pinRange(6689, 6691),
  'taken = true; } }',
  'return taken; }',
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

// Jednostka w formie, jakiej oczekuje pin (pola RuntimeBattleUnit uzywane przez wycinki).
const U = (q, r, side, o = {}) => ({
  q, r, side,
  range: o.range ?? 2,
  primaryRanged: o.primaryRanged ?? false,
  rangedKite: o.rangedKite ?? true,
  dead: o.dead ?? false,
  fadingOut: o.fadingOut ?? false,
  routed: o.routed ?? false,
});

const buildInst = (c) => {
  const inst = new Pin();
  inst.occByKey = new Set(c.occupied.map(([a, b]) => keyOf(a, b)));
  inst._impass = new Set(c.impassable.map(([a, b]) => keyOf(a, b)));
  inst.atk = c.others.filter((u) => u.side === 'atk');
  inst.def = c.others.filter((u) => u.side === 'def');
  return inst;
};

const runCase = (c) => {
  const inst = buildInst(c);
  const ru = c.unit;
  if (c.kind === 'best_kite') {
    return parseKey(inst._bestKiteShotStep(ru, { q: c.threat[0], r: c.threat[1] }));
  }
  if (c.kind === 'nearest_melee') {
    const t = inst._nearestEnemyMelee(ru);
    return t ? [t.q, t.r] : null;
  }
  if (c.kind === 'kite_gate') {
    return inst._kiteGate(ru);
  }
  throw new Error(`nieznany rodzaj ${c.kind}`);
};

// --- Przypadki nazwane (rozumowanie w komentarzu; wartosc oczekiwana = wykonanie pina; straznik want/notWant). ---
const named = [
  {
    name: 'brak_wroga_zwraca_null', kind: 'best_kite', pin: 'battleScene.ts:6962',
    unit: U(0, 5, 'atk', { range: 3 }), others: [], threat: [4, 5], want: null,
  },
  {
    // Granica planszy: W (-1,5) poza plansza; N/S maja gap 5 i movedBack=false; pierwszy w DIRS4 (N) wygrywa remis.
    name: 'granica_planszy_nc_ujemne_odrzucone', kind: 'best_kite', pin: 'battleScene.ts:6971',
    unit: U(0, 5, 'atk', { range: 5 }), others: [U(4, 5, 'def')], threat: [4, 5],
    want: [0, 4], notWant: [-1, 5],
  },
  {
    // occByKey: N zajety, wiec wybor pada na S (ten sam wynik gap/lateral).
    name: 'zajety_kafelek_occByKey_odrzucony', kind: 'best_kite', pin: 'battleScene.ts:6973',
    unit: U(0, 5, 'atk', { range: 5 }), others: [U(4, 5, 'def')], threat: [4, 5],
    occupied: [[0, 4]], want: [0, 6], notWant: [0, 4],
  },
  {
    // _passableForUnit: N i S nieprzejezdne; E (1,5) odpada na gap (3 <= 4); brak kroku.
    name: 'nieprzejezdny_passable_odrzucony', kind: 'best_kite', pin: 'battleScene.ts:6974',
    unit: U(0, 5, 'atk', { range: 5 }), others: [U(4, 5, 'def')], threat: [4, 5],
    impassable: [[0, 4], [0, 6]], want: null,
  },
  {
    // dMinAny <= 1: N (0,4) sasiaduje z wrogiem (0,3) -> odrzut; S (0,6) ma dMinAny 3 -> wygrywa.
    name: 'dMinAny_le_1_odrzuca_kandydata', kind: 'best_kite', pin: 'battleScene.ts:6985',
    unit: U(0, 5, 'atk', { range: 5 }), others: [U(4, 5, 'def'), U(0, 3, 'def')], threat: [4, 5],
    want: [0, 6], notWant: [0, 4],
  },
  {
    // Brak celu w [1..range] z kandydata: zasieg 1, wrog w odleglosci 5 od kazdego kandydata.
    name: 'brak_celu_w_zasiegu_odrzuca', kind: 'best_kite', pin: 'battleScene.ts:6987',
    unit: U(0, 5, 'atk', { range: 1 }), others: [U(4, 5, 'def')], threat: [4, 5], want: null,
  },
  {
    // gap <= dNow: jedyny kandydat to E (3,5) blizej zagrozenia (5,5) niz start (dNow=3); pozostale zajete.
    name: 'gap_nie_wiekszy_od_dNow_odrzuca', kind: 'best_kite', pin: 'battleScene.ts:6990',
    unit: U(2, 5, 'atk', { range: 3 }), others: [U(5, 5, 'def')], threat: [5, 5],
    occupied: [[1, 5], [2, 4], [2, 6]], want: null,
  },
  {
    // movedBackAxis +50: W (1,5) wygrywa 350 nad N/S (300) mimo tej samej luki.
    name: 'movedBackAxis_bonus_wybiera_krok_wstecz', kind: 'best_kite', pin: 'battleScene.ts:6992',
    unit: U(2, 5, 'atk', { range: 3 }), others: [U(4, 5, 'def')], threat: [4, 5],
    want: [1, 5], notWant: [2, 4],
  },
  {
    // Strona obrony: kierunek wsteczny to +1 (E). E (8,5) ma gap 5 i movedBack -> wygrywa.
    name: 'strona_obrony_kierunek_wsteczny_E', kind: 'best_kite', pin: 'battleScene.ts:6743-6745',
    unit: U(7, 5, 'def', { range: 5 }), others: [U(3, 5, 'atk')], threat: [3, 5], want: [8, 5],
  },
  {
    name: 'gate_rangedKite_false_wylacza', kind: 'kite_gate', pin: 'battleScene.ts:6689',
    unit: U(5, 5, 'atk', { primaryRanged: true, rangedKite: false }), others: [U(7, 5, 'def')], want: false,
  },
  {
    name: 'gate_brak_primaryRanged_wylacza', kind: 'kite_gate', pin: 'battleScene.ts:6689',
    unit: U(5, 5, 'atk', { primaryRanged: false }), others: [U(7, 5, 'def')], want: false,
  },
  {
    // Prog graniczny: dokladnie MELEE_SAFE_GAP = 2 -> galaz KITE aktywna.
    name: 'gate_prog_dokladnie_2_aktywny', kind: 'kite_gate', pin: 'battleScene.ts:6691',
    unit: U(5, 5, 'atk', { primaryRanged: true }), others: [U(7, 5, 'def')], want: true,
  },
  {
    // Prog graniczny: dystans 3 > 2 -> galaz KITE nieaktywna.
    name: 'gate_prog_3_nieaktywny', kind: 'kite_gate', pin: 'battleScene.ts:6691',
    unit: U(5, 5, 'atk', { primaryRanged: true }), others: [U(8, 5, 'def')], want: false,
  },
  {
    // _nearestEnemyMelee pomija ranged (dd 1): najblizszy melee ma dd 3 -> gate nieaktywny.
    name: 'gate_pomija_ranged_wroga', kind: 'kite_gate', pin: 'battleScene.ts:8317',
    unit: U(5, 5, 'atk', { primaryRanged: true }),
    others: [U(6, 5, 'def', { primaryRanged: true }), U(8, 5, 'def')], want: false,
  },
  {
    name: 'nearest_melee_pomija_primaryRanged', kind: 'nearest_melee', pin: 'battleScene.ts:8317',
    unit: U(5, 5, 'atk'),
    others: [U(6, 5, 'def', { primaryRanged: true }), U(8, 5, 'def')], want: [8, 5],
  },
  {
    // Remis dystansu: pierwszy z kolejnosci _enemiesOf (ostre <) wygrywa.
    name: 'nearest_melee_remis_pierwszy_z_listy', kind: 'nearest_melee', pin: 'battleScene.ts:8319-8322',
    unit: U(5, 5, 'atk'), others: [U(5, 8, 'def'), U(8, 5, 'def')], want: [5, 8],
  },
  {
    name: 'nearest_melee_pomija_martwych', kind: 'nearest_melee', pin: 'battleScene.ts:8293',
    unit: U(5, 5, 'atk'), others: [U(6, 5, 'def', { dead: true }), U(7, 5, 'def')], want: [7, 5],
  },
  {
    name: 'nearest_melee_brak_melee_null', kind: 'nearest_melee', pin: 'battleScene.ts:8315-8324',
    unit: U(5, 5, 'atk'), others: [U(6, 5, 'def', { primaryRanged: true })], want: null,
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
const randomScene = () => {
  const cq = ri(3, 60);
  const cr = ri(3, 150);
  const side = rnd() < 0.5 ? 'atk' : 'def';
  const unit = U(cq, cr, side, {
    range: ri(1, 5),
    primaryRanged: rnd() < 0.85,
    rangedKite: rnd() < 0.8,
  });
  const others = Array.from({ length: ri(0, 6) }, () =>
    U(cq + ri(-4, 4), cr + ri(-4, 4), rnd() < 0.5 ? 'atk' : 'def', {
      range: ri(1, 4),
      primaryRanged: rnd() < 0.3,
      dead: rnd() < 0.1,
      fadingOut: rnd() < 0.05,
      routed: rnd() < 0.05,
    }),
  );
  const occupied = uniqueTiles(Array.from({ length: ri(0, 8) }, () => [cq + ri(-3, 3), cr + ri(-3, 3)]), [cq, cr]);
  const impassable = uniqueTiles(Array.from({ length: ri(0, 4) }, () => [cq + ri(-3, 3), cr + ri(-3, 3)]), [cq, cr]);
  const enemies = others.filter((u) => u.side !== side);
  const threat = enemies.length && rnd() < 0.7
    ? (({ q, r }) => [q, r])(enemies[ri(0, enemies.length - 1)])
    : [cq + ri(-4, 4), cr + ri(-4, 4)];
  return { unit, others, occupied, impassable, threat };
};

// --- Zbior wynikowy ---
const cases = [];
const pushCase = (name, pin, kind, raw, want, notWant) => {
  const input = {
    unit: raw.unit,
    others: raw.others ?? [],
    threat: raw.threat ?? null,
    occupied: raw.occupied ?? [],
    impassable: raw.impassable ?? [],
  };
  const expect = runCase({ kind, ...input });
  if (want !== undefined && JSON.stringify(expect) !== JSON.stringify(want)) {
    throw new Error(`pin != oczekiwany (nazwany ${name}): pin=${JSON.stringify(expect)} want=${JSON.stringify(want)}`);
  }
  if (notWant !== undefined && JSON.stringify(expect) === JSON.stringify(notWant)) {
    throw new Error(`pin zwrocil zakazany wynik (nazwany ${name}): ${JSON.stringify(expect)}`);
  }
  cases.push({
    name,
    kind,
    pin,
    unit: input.unit,
    others: input.others,
    threat: input.threat ?? null,
    occupied: input.occupied ?? [],
    impassable: input.impassable ?? [],
    expect,
  });
  return expect;
};

for (const n of named) {
  const { name, kind, pin, want, notWant, ...rest } = n;
  pushCase(name, pin, kind, {
    unit: rest.unit,
    others: rest.others,
    threat: rest.threat,
    occupied: rest.occupied,
    impassable: rest.impassable,
  }, want, notWant);
}

const NR_KITE = 400;
const NR_NEAREST = 150;
const NR_GATE = 150;
for (let i = 0; i < NR_KITE; i++) {
  const s = randomScene();
  pushCase(`losowy_best_kite_${String(i).padStart(3, '0')}`, 'battleScene.ts:6959-7002', 'best_kite', s);
}
for (let i = 0; i < NR_NEAREST; i++) {
  const s = randomScene();
  pushCase(`losowy_nearest_melee_${String(i).padStart(3, '0')}`, 'battleScene.ts:8315-8324', 'nearest_melee', s);
}
for (let i = 0; i < NR_GATE; i++) {
  const s = randomScene();
  pushCase(`losowy_kite_gate_${String(i).padStart(3, '0')}`, 'battleScene.ts:6689-6691', 'kite_gate', s);
}

const outDir = join(here, 'p6_k5doc_t5a_vectors');
mkdirSync(outDir, { recursive: true });
const out = {
  pin: PIN,
  pin_path: PIN_PATH,
  fragments: digests,
  stubs: ['occByKey', '_passableForUnit'],
  cases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(out, null, 1) + '\n');
const count = (k) => cases.filter((c) => c.kind === k).length;
const nFound = cases.filter((c) => c.kind === 'best_kite' && c.expect !== null).length;
console.log(
  `OK: ${cases.length} przypadkow (best_kite=${count('best_kite')}, z krokiem=${nFound}, ` +
  `nearest_melee=${count('nearest_melee')}, kite_gate=${count('kite_gate')}) -> ${join(outDir, 'vectors.json')}`,
);
