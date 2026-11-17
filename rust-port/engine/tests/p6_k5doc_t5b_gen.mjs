// P6 SIEGE K5DOC-T5b STRZELEC-MARSZ (dispatch R-RUSTPORT-P6-K5DOC-T5B-MARSZ, runda 1, Operator):
// generator wektorow dla podejscia strzelca (rust-port/engine/src/domain/siege_tactics_ranged_forward.rs).
//
// Uruchomienie: node rust-port/engine/tests/p6_k5doc_t5b_gen.mjs
// Wynik: tests/p6_k5doc_t5b_vectors/vectors.json
//
// ORAKUL = WYKONANIE TEKSTU PINA. Fragmenty pina (git show 07d2fbd72, bez checkoutu) sa transpilowane przez TypeScript
// i WYKONYWANE, wiec wartosci oczekiwane pochodza z pina, a nie z reimplementacji JS:
//   DIR_DELTA / DIRS4            battleScene.ts:326-331, :337
//   BF_COLS / BF_ROWS            battleScene.ts:661-662
//   cellKey                      battleScene.ts:1797
//   manhattan                    battleScene.ts:1917-1919
//   _advanceDir                  battleScene.ts:6743-6745
//   _rangedForwardStep (czesc decyzyjna, 6777-6787) battleScene.ts:6776-6787 -> wrapper _rangedKey
//   _bestForwardStep             battleScene.ts:6822-6893
//   _enemiesOf                   battleScene.ts:8291-8294
//   _nearestEnemy                battleScene.ts:8296-8304
// STUBOWANE sa wyłącznie:
//   occByKey      -> zbior kluczy "c,r" (unia `occupied` z wektora i kafelkow wszystkich jednostek, jak w grze)
//   _passableForUnit -> zbior `impassable` z wektora
//   isSiegeUnit(bu)  -> pole `bu.siege` (definicja klas jednostek jest poza zakresem T5b)
//   this.finished    -> pole `finished` z wektora
// Jedyna zmiana tekstu pina: w wrapperze `_rangedKey` `done(); return;` -> `return null;` (zamiast wywolania done()),
// oraz dopisane `return stepKey;`. Cala reszta wycinka jest niezmieniona.
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
  advanceDir: { range: [6743, 6745], head: 'private _advanceDir(', tail: '  }' },
  rangedHead: { range: [6777, 6787], head: 'if (this.finished)', tail: 'walled in: hold for this turn' },
  bestForward: { range: [6822, 6893], head: 'private _bestForwardStep(', tail: '  }' },
  enemiesOf: { range: [8291, 8294], head: 'private _enemiesOf(', tail: '  }' },
  nearestEnemy: { range: [8296, 8304], head: 'private _nearestEnemy(', tail: '  }' },
};
const digests = {};
for (const [name, { range: [a, b], head, tail }] of Object.entries(FRAGMENTS)) {
  const tailOk = tail.startsWith('  ') ? pinLines[b - 1] === tail : pinLines[b - 1].includes(tail);
  if (!pinLines[a - 1].includes(head) || !tailOk) {
    throw new Error(`straznik wycinka ${name} (${a}-${b}) nie zgadza sie z pinem`);
  }
  digests[name] = createHash('sha256').update(pinRange(a, b)).digest('hex');
}

// Wrapper decyzji _rangedForwardStep: linie 6777-6787 pina, z `done(); return;` zamienionym na `return null;`.
const rangedDecision = pinRange(6777, 6787).split('done(); return;').join('return null;');

// --- Wykonanie pina ---
const TS_JS = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const tsLib = createRequire(import.meta.url)(TS_JS);
const classSrc = [
  pinRange(326, 331),
  pinRange(337, 337),
  pinRange(661, 662),
  pinRange(1797, 1797),
  pinRange(1917, 1919),
  'function isSiegeUnit(bu) { return bu.siege === true; }',
  'class P {',
  'constructor() { this.occByKey = new Set(); this._impass = new Set(); this.atk = []; this.def = []; this.finished = false; }',
  '_passableForUnit(ru, col, row) { return !this._impass.has(col + "," + row); }',
  pinRange(6743, 6745),
  pinRange(8291, 8294),
  pinRange(8296, 8304),
  pinRange(6822, 6893),
  '_rangedKey(ru) {',
  rangedDecision,
  'return stepKey; }',
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
  moveLeft: o.moveLeft ?? 2,
  primaryRanged: o.primaryRanged ?? false,
  dead: o.dead ?? false,
  fadingOut: o.fadingOut ?? false,
  routed: o.routed ?? false,
  removed: o.removed ?? false,
  mounted: o.mounted ?? false,
  siege: o.siege ?? false,
  bu: { siege: o.siege ?? false },
});

// Zbior zajetosci = unia jawnych `occupied` i kafelkow wszystkich jednostek (ru tez), jak occByKey w grze.
const finalOccupied = (c) => {
  const set = new Map();
  for (const [a, b] of c.occupied) set.set(keyOf(a, b), [a, b]);
  for (const u of [c.unit, ...c.others]) set.set(keyOf(u.q, u.r), [u.q, u.r]);
  return [...set.values()];
};

const buildInst = (c) => {
  const inst = new Pin();
  const occ = finalOccupied(c);
  inst.occByKey = new Set(occ.map(([a, b]) => keyOf(a, b)));
  inst._impass = new Set(c.impassable.map(([a, b]) => keyOf(a, b)));
  // ru jest w swojej liscie stron (jak w grze); pozostali wedlug strony.
  const all = [c.unit, ...c.others];
  inst.atk = all.filter((u) => u.side === 'atk');
  inst.def = all.filter((u) => u.side === 'def');
  inst.finished = c.finished ?? false;
  return inst;
};

const runCase = (c) => {
  const inst = buildInst(c);
  const ru = c.unit;
  if (c.kind === 'best_forward') {
    return parseKey(inst._bestForwardStep(ru, { q: c.nearest[0], r: c.nearest[1] }));
  }
  if (c.kind === 'ranged_key') {
    return parseKey(inst._rangedKey(ru));
  }
  throw new Error(`nieznany rodzaj ${c.kind}`);
};

// --- Przypadki nazwane (rozumowanie w komentarzu; wartosc oczekiwana = wykonanie pina; straznik want/notWant). ---
// Uwaga: pozycje wrogow poza plansza (ujemne lub >= BF_COLS/BF_ROWS) uzyte sa WYLACZNIE do uruchomienia galezi granic
// w pierwszej petli `_bestForwardStep`; przy wrogach na planszy te galezie sa nieosiagalne (zob. raport).
const named = [
  {
    name: 'forward_pierwszy_wybor_E', kind: 'best_forward', pin: 'battleScene.ts:6823-6866',
    unit: U(2, 5, 'atk'), others: [], nearest: [6, 5], want: [3, 5],
  },
  {
    name: 'brak_wroga_w_ranged_null', kind: 'ranged_key', pin: 'battleScene.ts:6781-6782',
    unit: U(2, 5, 'atk'), others: [], want: null,
  },
  {
    name: 'zakonczone_finished_null', kind: 'ranged_key', pin: 'battleScene.ts:6777',
    unit: U(2, 5, 'atk'), others: [U(6, 5, 'def')], finished: true, want: null,
  },
  {
    name: 'martwy_ru_null', kind: 'ranged_key', pin: 'battleScene.ts:6778',
    unit: U(2, 5, 'atk', { dead: true }), others: [U(6, 5, 'def')], want: null,
  },
  {
    name: 'fadingOut_ru_null', kind: 'ranged_key', pin: 'battleScene.ts:6778',
    unit: U(2, 5, 'atk', { fadingOut: true }), others: [U(6, 5, 'def')], want: null,
  },
  {
    name: 'moveLeft_zero_null', kind: 'ranged_key', pin: 'battleScene.ts:6779',
    unit: U(2, 5, 'atk', { moveLeft: 0 }), others: [U(6, 5, 'def')], want: null,
  },
  {
    name: 'w_zasiegu_null_bez_kroku', kind: 'ranged_key', pin: 'battleScene.ts:6784',
    unit: U(2, 5, 'atk', { range: 4 }), others: [U(6, 5, 'def')], want: null,
  },
  {
    name: 'poza_zasiegiem_krok_E', kind: 'ranged_key', pin: 'battleScene.ts:6786',
    unit: U(0, 5, 'atk', { range: 2 }), others: [U(6, 5, 'def')], want: [1, 5],
  },
  {
    name: 'martwy_wrog_pominiety_w_nearest', kind: 'ranged_key', pin: 'battleScene.ts:8291-8294',
    unit: U(0, 5, 'atk', { range: 2 }), others: [U(0, 3, 'def', { dead: true }), U(6, 5, 'def')],
    want: [1, 5], notWant: [0, 4],
  },
  {
    // Zajety kafelek forward (3,5) i brak pola postepu w pionie: N/S odpadaja (gain 0, rowGap>=0), BFS bez sojusznika
    // w wierszu 4 nie ma dokad isc -> null (pin: hold for this turn).
    name: 'zajety_forward_bez_objazdu_null', kind: 'best_forward', pin: 'battleScene.ts:6832-6834',
    unit: U(2, 5, 'atk'), others: [U(3, 5, 'atk'), U(6, 5, 'def')], nearest: [6, 5], want: null,
  },
  {
    // Objazd BFS: forward (3,5) zajety, sojusznik w wierszu 4 (9,4) rozszerza zakres wierszy na 4..5;
    // pierwszy krok w gore (2,4) ma kolejny kafelek (3,4) blizej celu.
    name: 'bfs_objazd_pierwszy_krok_w_gore', kind: 'best_forward', pin: 'battleScene.ts:6876-6888',
    unit: U(2, 5, 'atk'), others: [U(3, 5, 'atk'), U(9, 4, 'atk'), U(6, 5, 'def')], nearest: [6, 5],
    want: [2, 4],
  },
  {
    // Remis w BFS: oba wiersze 4 i 6 otwarte; pin bierze pierwszy z kolejnosci [row-1,row+1] -> wiersz 4.
    // Mutant odwracajacy kolejnosc BFS (row+1 przed row-1) daje (2,6) -> FAIL.
    name: 'bfs_kolejnosc_row_minus_1_przed_plus_1', kind: 'best_forward', pin: 'battleScene.ts:6875-6876',
    unit: U(2, 5, 'atk'), others: [U(3, 5, 'atk'), U(9, 4, 'atk'), U(9, 6, 'atk'), U(6, 5, 'def')], nearest: [6, 5],
    want: [2, 4], notWant: [2, 6],
  },
  {
    // Ten sam scenariusz, ale sojusznik na wierszu 6 jest jedynym: BFS wybiera wiersz 6.
    name: 'bfs_tylko_wiersz_plus_1_otwarty', kind: 'best_forward', pin: 'battleScene.ts:6875-6876',
    unit: U(2, 5, 'atk'), others: [U(3, 5, 'atk'), U(9, 6, 'atk'), U(6, 5, 'def')], nearest: [6, 5],
    want: [2, 6],
  },
  {
    // Postep ostro: forwardGain = 0 (krok pionowy), rowGap = +1 (nie zbliza do wiersza wroga) -> odrzut.
    // Gdy forward zablokowany i brak sojusznikow w innym wierszu, pin zwraca null.
    // Mutant (a) `forwardGain <= 0` -> `forwardGain < 0` dalby (5,4) -> FAIL (nie jest to zachowanie rownowazne).
    name: 'postep_ostry_pionowy_zero_gain_odrzut', kind: 'best_forward', pin: 'battleScene.ts:6847-6852',
    unit: U(5, 5, 'atk'), others: [U(6, 5, 'atk'), U(9, 5, 'def')], nearest: [9, 5],
    occupied: [], want: null,
  },
  {
    // Granica planszy nc < 0: obrona w kolumnie 0, wrog atak w kolumnie -1 (poza plansza, wejscie graniczne).
    // Jedyny kandydat poza plansza to W (-1,5), ktory bez sprawdzenia granicy dalby [-1,5].
    name: 'granica_nc_ujemne_jedyny_kandydat_null', kind: 'best_forward', pin: 'battleScene.ts:6832',
    unit: U(0, 5, 'def'), others: [U(-1, 5, 'atk')], nearest: [-1, 5], want: null, notWant: [-1, 5],
  },
  {
    // Granica planszy nc >= BF_COLS (68): atak w kolumnie 67, wrog w kolumnie 68 (poza plansza).
    // Jedyny kandydat E (68,5) bez sprawdzenia granicy dalby [68,5] (mutant (b) `nc >= BF_COLS` -> `nc > BF_COLS`).
    name: 'granica_nc_ge_bf_cols_jedyny_kandydat_null', kind: 'best_forward', pin: 'battleScene.ts:6832',
    unit: U(67, 5, 'atk'), others: [U(69, 5, 'def')], nearest: [69, 5], want: null, notWant: [68, 5],
  },
  {
    // Granica planszy nr >= BF_ROWS (156): sojusznicy zajmuja E/W, wrog (31,157) poza plansza. S (30,156) ma
    // rowGap -1 i bylby przyjety bez sprawdzenia granicy; pin zwraca null.
    name: 'granica_nr_ge_bf_rows_jedyny_kandydat_null', kind: 'best_forward', pin: 'battleScene.ts:6832',
    unit: U(30, 155, 'atk'), others: [U(31, 155, 'atk'), U(29, 155, 'atk'), U(31, 157, 'def')], nearest: [31, 157],
    want: null, notWant: [30, 156],
  },
  {
    // Granica planszy nr < 0: sojusznicy na E/W, wrog (31,-1) poza plansza. N (30,-1) ma rowGap -1 i bylby przyjety
    // bez sprawdzenia granicy; pin zwraca null.
    name: 'granica_nr_ujemne_jedyny_kandydat_null', kind: 'best_forward', pin: 'battleScene.ts:6832',
    unit: U(30, 0, 'atk'), others: [U(31, 0, 'atk'), U(29, 0, 'atk'), U(31, -1, 'def')], nearest: [31, -1],
    want: null, notWant: [30, -1],
  },
  {
    // Zajetosc: N/S nie przechodza (gain 0, rowGap 1), E zajety -> brak kroku z pierwszej petli, BFS bez objazdu.
    name: 'zajety_kafelek_odrzucony', kind: 'best_forward', pin: 'battleScene.ts:6834-6835',
    unit: U(0, 5, 'atk'), others: [U(4, 5, 'def')], nearest: [4, 5], occupied: [[1, 5]], want: null, notWant: [1, 5],
  },
  {
    // Przejezdnosc: E nieprzejezdny, BFS przez wiersz 4 (sojusznik (9,4)) prowadzi do (0,4).
    name: 'nieprzejezdny_bfs_objazd', kind: 'best_forward', pin: 'battleScene.ts:6835,6877',
    unit: U(0, 5, 'atk'), others: [U(9, 4, 'atk'), U(4, 5, 'def')], nearest: [4, 5], impassable: [[1, 5]],
    want: [0, 4],
  },
  {
    // Krok pionowy z forwardGain 0 i rowGap < 0 jest przyjety: wrog w wierszu 2 zbliza N (5,4) do wiersza wroga.
    name: 'pion_zamyka_wiersz_przyjety', kind: 'best_forward', pin: 'battleScene.ts:6847-6852',
    unit: U(5, 5, 'atk'), others: [U(9, 2, 'def')], nearest: [9, 2], occupied: [[6, 5]], want: [5, 4],
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
    moveLeft: ri(0, 2),
    primaryRanged: rnd() < 0.85,
  });
  const others = Array.from({ length: ri(0, 7) }, () =>
    U(cq + ri(-4, 4), cr + ri(-4, 4), rnd() < 0.5 ? 'atk' : 'def', {
      range: ri(1, 4),
      dead: rnd() < 0.1,
      fadingOut: rnd() < 0.05,
      routed: rnd() < 0.05,
      removed: rnd() < 0.05,
      mounted: rnd() < 0.1,
      siege: rnd() < 0.1,
    }),
  );
  const occupied = uniqueTiles(Array.from({ length: ri(0, 6) }, () => [cq + ri(-3, 3), cr + ri(-3, 3)]), [cq, cr]);
  const impassable = uniqueTiles(Array.from({ length: ri(0, 4) }, () => [cq + ri(-3, 3), cr + ri(-3, 3)]), [cq, cr]);
  const enemies = others.filter((u) => u.side !== side);
  const nearest = enemies.length && rnd() < 0.7
    ? [enemies[ri(0, enemies.length - 1)].q, enemies[ri(0, enemies.length - 1)].r]
    : [cq + ri(-4, 4), cr + ri(-4, 4)];
  return { unit, others, occupied, impassable, nearest, finished: rnd() < 0.05 };
};

// --- Zbior wynikowy ---
const cases = [];
const pushCase = (name, pin, kind, raw, want, notWant) => {
  const input = {
    unit: raw.unit,
    others: raw.others ?? [],
    nearest: raw.nearest ?? null,
    finished: raw.finished ?? false,
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
    nearest: input.nearest,
    finished: input.finished,
    occupied: finalOccupied({ unit: input.unit, others: input.others, occupied: input.occupied }),
    impassable: input.impassable,
    expect,
  });
  return expect;
};

for (const n of named) {
  const { name, kind, pin, want, notWant, ...rest } = n;
  pushCase(name, pin, kind, {
    unit: rest.unit,
    others: rest.others,
    nearest: rest.nearest,
    finished: rest.finished,
    occupied: rest.occupied,
    impassable: rest.impassable,
  }, want, notWant);
}

const NR_BEST = 400;
const NR_RANGED = 200;
for (let i = 0; i < NR_BEST; i++) {
  const s = randomScene();
  pushCase(`losowy_best_forward_${String(i).padStart(3, '0')}`, 'battleScene.ts:6822-6893', 'best_forward', { ...s, finished: false });
}
for (let i = 0; i < NR_RANGED; i++) {
  const s = randomScene();
  const ru = s.unit;
  // ranged_key: nearest wyliczany przez pin (_nearestEnemy); pole nearest nieuzywane.
  pushCase(`losowy_ranged_key_${String(i).padStart(3, '0')}`, 'battleScene.ts:6776-6787', 'ranged_key', { ...s, unit: ru, nearest: null });
}

const outDir = join(here, 'p6_k5doc_t5b_vectors');
mkdirSync(outDir, { recursive: true });
const out = {
  pin: PIN,
  pin_path: PIN_PATH,
  fragments: digests,
  stubs: ['occByKey', '_passableForUnit', 'isSiegeUnit', 'finished'],
  cases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(out, null, 1) + '\n');
const count = (k) => cases.filter((c) => c.kind === k).length;
const nFound = cases.filter((c) => c.kind === 'best_forward' && c.expect !== null).length;
console.log(
  `OK: ${cases.length} przypadkow (best_forward=${count('best_forward')}, z krokiem=${nFound}, ` +
  `ranged_key=${count('ranged_key')}) -> ${join(outDir, 'vectors.json')}`,
);
