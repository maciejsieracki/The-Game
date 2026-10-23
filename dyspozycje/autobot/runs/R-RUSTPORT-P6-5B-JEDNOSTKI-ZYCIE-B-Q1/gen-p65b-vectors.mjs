// P6.5B (jednostki - zycie, czesc B) - wektory z URUCHOMIONEGO weba (pin edb8fb56) dla:
//   gra/src/game/manpower.ts, gra/src/game/unit-building-bonuses.ts
// Zaleznosci uruchamiane BEZ stubow: units/setup.ts (isCivilianUnit), data/epoka-ludnosc-manpower.json,
// data/miasto-params.json, data/buildings.json (dane rzeczywiste do wektorow `real`).
// Wejscia deterministyczne (LCG); wyniki = to, co zwrocil prawdziwy kod weba.
// Kodowanie liczb: NaN/+-Infinity/-0 -> {"$n": ...}; niecalkowite i |x| > 2^53 -> {"$f": "<String(x)>"} (serde_json bez float_roundtrip myli sie o 1 ulp).
//
// Uzycie:
//   node --experimental-transform-types --no-warnings --import ./p65b-loader-register.mjs \
//     ./gen-p65b-vectors.mjs <WEB_ROOT> <OUT_DIR>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , webRootArg, outDirArg] = process.argv;
if (!webRootArg || !outDirArg) {
  console.error('usage: <WEB_ROOT> <OUT_DIR>');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const outDir = presolve(outDirArg);
mkdirSync(outDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;

const origLog = console.log;
const origWarn = console.warn;
console.log = () => {};
console.warn = () => {};

const mp = await import(src('game/manpower.ts'));
const ubb = await import(src('game/unit-building-bonuses.ts'));
const setup = await import(src('units/setup.ts'));
const realBuildings = JSON.parse(readFileSync(join(webRoot, 'gra/data/buildings.json'), 'utf8'));

// ---------------------------------------------------------------------------
// kodowanie JSON
// ---------------------------------------------------------------------------
function enc(v) {
  if (v === undefined) return undefined;
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return { $n: 'NaN' };
    if (v === Infinity) return { $n: 'Infinity' };
    if (v === -Infinity) return { $n: '-Infinity' };
    if (Object.is(v, -0)) return { $n: '-0' };
    return v;
  }
  if (Array.isArray(v)) return v.map((x) => (x === undefined ? null : enc(x)));
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) {
      const e = enc(x);
      if (e !== undefined) o[k] = e;
    }
    return o;
  }
  return v;
}

let seedState = 0x65b1b2c3;
function rnd() {
  seedState = (Math.imul(seedState, 1664525) + 1013904223) >>> 0;
  return seedState / 4294967296;
}
const rint = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;
const clone = (x) => structuredClone(x);
const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const V = {
  fmt: {}, collate: {}, scalar: {}, params: {}, city: {}, mut: {}, misc: {}, consts: {},
  replenish: {}, bld: {}, real: {},
};

// ===========================================================================
// stale (zrzut z uruchomionego weba)
// ===========================================================================
V.consts = {
  rows: enc(mp.allEpokaManpowerRows()),
  SCOUT_TYPE_ID: mp.SCOUT_TYPE_ID,
  defaultRegen: enc(mp.loadManpowerRegenParams()),
  defaultReplenish: {
    easy: enc(mp.loadManpowerReplenishParams('easy')),
    normal: enc(mp.loadManpowerReplenishParams('normal')),
    hard: enc(mp.loadManpowerReplenishParams('hard')),
  },
  CIVILIAN_CATEGORIES: [...setup.CIVILIAN_CATEGORIES],
  CIVILIAN_TYPE_IDS: [...setup.CIVILIAN_TYPE_IDS],
  ARMOR_BUILDING_IDS: ubb.ARMOR_BUILDING_IDS,
  SOFT_STAT_BUILDING_IDS: ubb.SOFT_STAT_BUILDING_IDS,
  ARMOR_PATH_MAX_PP: ubb.ARMOR_PATH_MAX_PP,
  SOFT_PATH_MAX_PP: ubb.SOFT_PATH_MAX_PP,
  ARMOR_PATH_LEVEL_MAX_PP: ubb.ARMOR_PATH_LEVEL_MAX_PP,
  SOFT_PATH_LEVEL_MAX_PP: ubb.SOFT_PATH_LEVEL_MAX_PP,
  PATH_A_MAX_PP: ubb.PATH_A_MAX_PP,
  PATH_B_MAX_PP: ubb.PATH_B_MAX_PP,
  ZERO_BUILDING_COMBAT_BONUS: ubb.ZERO_BUILDING_COMBAT_BONUS,
};

// ===========================================================================
// formatowanie liczb (Number#toString) i etykiety
// ===========================================================================
{
  const F = V.fmt;
  F.numberToString = [];
  const samples = [
    0, -0, 1, -1, 0.5, 0.1, 0.2, 0.30000000000000004, 1 / 3, 2 / 3, 100, 1e5, 123456789, 1e15, 1e20,
    1e21, 1.5e21, 123456789012345680000, 1e-5, 1e-6, 1e-7, 1.5e-7, 123e-9, 5e-324, 1.7976931348623157e308,
    4.35, 4.349999999999999, 2.675, 1.005, 999999.5, 1000000, 1234.5678, 0.000001, 0.0000012,
    NaN, Infinity, -Infinity, -12.5, -1e21, -1e-7, 4503599627370496, 9007199254740993, 2 ** 53,
    0.1 + 0.2, 1e300, 12345678901234567890, 0.5e-6, 100000000000000000000, 123456789012345678901,
  ];
  for (const x of samples) F.numberToString.push({ x: enc(x), out: String(x) });
  for (let i = 0; i < 2500; i++) {
    const kind = i % 5;
    let x;
    if (kind === 0) x = rnd() * 10 ** rint(-9, 25);
    else if (kind === 1) x = -rnd() * 10 ** rint(-9, 25);
    else if (kind === 2) x = rint(-2000, 2000000) / 10 ** rint(0, 4);
    else if (kind === 3) x = rint(0, 1000) * 10 ** rint(-8, 24);
    else x = Number(`${rint(1, 9999)}e${rint(-12, 28)}`);
    F.numberToString.push({ x: enc(x), out: String(x) });
  }
  // dokladne remisy najkrotszej reprezentacji (ECMAScript: parzysta ostatnia cyfra): n + 0.25, n + 0.75, n + 0.125...
  for (let i = 0; i < 400; i++) {
    const base = rint(2 ** 46, 2 ** 52) + (i % 4 === 0 ? 0.25 : i % 4 === 1 ? 0.75 : i % 4 === 2 ? 0.125 : 0.375);
    const x = chance(0.3) ? -base : base;
    F.numberToString.push({ x: enc(x), out: String(x) });
  }
  F.formatPopulationAbs = [];
  const popSamples = [
    0, 1, 999, 1000, 1049, 1050, 1051, 1500, 9949, 9950, 9999, 10000, 99499, 99500, 99999, 100000, 100499,
    100500, 999499, 999500, 999999, 1e6, 1049999, 1050000, 1500000, 9949999, 9950000, 9999999, 1e7,
    10499999, 10500000, 123456789, 4.8e6, 2.4e9, 1e21, 1e300, NaN, Infinity, -Infinity, -5, -1500, -2e6,
    -0, 0.5, 999.9999, 1000.0001, 1e6 - 0.001,
  ];
  for (const x of popSamples) {
    F.formatPopulationAbs.push({ x: enc(x), out: mp.formatPopulationAbs(x), mp: mp.formatManpower(x) });
  }
  for (let i = 0; i < 800; i++) {
    const x = pick([1, 1, 3]) * rnd() * 10 ** rint(0, 9) * pick([1, 1, 1, -1]);
    const y = chance(0.5) ? Math.round(x) : x;
    F.formatPopulationAbs.push({ x: enc(y), out: mp.formatPopulationAbs(y), mp: mp.formatManpower(y) });
  }
  F.formatObywateleLabel = [];
  const countSamples = [0, 1, 2, 5, 10, 1.5, 0.99, 1.0000001, -1, -0, NaN, Infinity, -Infinity, 1e21, 2.9999];
  for (const x of countSamples) F.formatObywateleLabel.push({ x: enc(x), out: mp.formatObywateleLabel(x) });
  for (let i = 0; i < 300; i++) {
    const x = pick([rint(-3, 30), rnd() * 20 - 3]);
    F.formatObywateleLabel.push({ x: enc(x), out: mp.formatObywateleLabel(x) });
  }
}

// ===========================================================================
// localeCompare: kolejnosc ASCII (zrzut) + pary napisow
// ===========================================================================
{
  const C = V.collate;
  const printable = [];
  for (let c = 0x20; c < 0x7f; c++) printable.push(String.fromCharCode(c));
  const col = new Intl.Collator(undefined, { sensitivity: 'base' });
  C.primaryOrder = printable.filter((c) => !(c >= 'A' && c <= 'Z')).sort((a, b) => col.compare(a, b)).join('');
  C.locale = new Intl.Collator().resolvedOptions().locale;
  C.pairs = [];
  const idLike = 'abcABC_-0129 .';
  const rndStr = (alphabet, maxLen) => {
    const n = rint(0, maxLen);
    let s = '';
    for (let i = 0; i < n; i++) s += alphabet[Math.floor(rnd() * alphabet.length)];
    return s;
  };
  const addPair = (a, b) => C.pairs.push({ a, b, out: a.localeCompare(b) });
  for (const a of printable) for (const b of printable) addPair(a, b);
  const named = ['', 'a', 'A', 'b', 'B', 'ab', 'aB', 'Ab', 'AB', 'a1', 'a10', 'a2', 'u1', 'U1', 'u_1', 'u-1', 'u 1', 'u.1', 'c1', 'c10', 'c2', 'city_1', 'city-1', 'City_1', 'city0', 'city1', 'city10', 'city11', 'city2', 'city9', 'city20', 'u0', 'u11', 'miasto 2', '1', '10', '2', '~', 'z', 'Z', 'zz', 'ZZ', 'aa', 'Aa', 'aA', 'AA'];
  for (const a of named) for (const b of named) addPair(a, b);
  for (let i = 0; i < 3000; i++) addPair(rndStr(idLike, 6), rndStr(idLike, 6));
  for (let i = 0; i < 3000; i++) addPair(rndStr(printable.join(''), 5), rndStr(printable.join(''), 5));
  for (let i = 0; i < 1500; i++) {
    const base = rndStr(idLike, 5);
    const flipped = [...base].map((c) => (chance(0.4) ? (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase()) : c)).join('');
    addPair(base, flipped);
  }
  // poza zakresem ASCII (NIE_ZMIERZONO w Rust: zapasowo UTF-16) - tylko dokumentacja rozbieznosci
  C.nonAscii = [];
  const na = ['ą', 'Ą', 'ć', 'é', 'e', 'E', 'ż', 'z', 'Z', '😀', '～', '\t', 'a\u0001', 'ä', 'ß', 'ss'];
  for (const a of na) for (const b of na) C.nonAscii.push({ a, b, out: a.localeCompare(b) });
}

// ===========================================================================
// skalary: tabela epok, ludki, koszty, parametry
// ===========================================================================
const EPOKI = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 11, -3, 2.7, 9.99, 0.5, NaN, Infinity, -Infinity, -0, 1e300, 10.0001, 1.0000001];
const MAXMULTS = [1, 1, 1, 2, 0.5, 0.1, 0.05, 1.5, 0.3333, 3, 0, -1, NaN, Infinity, 1.0000001, 0.07];
const LUDKI = [1, 2, 3, 5, 7, 10, 0, 0.5, 1.9, 2.7, -3, NaN, Infinity, -0, 10.0001, 1e9, 4.4];
const TYPEIDS = ['Zwiadowca', 'Wojownik', undefined, 'zwiadowca', 'Osadnik', 'Łucznik', '', 'Zwiadowca '];

{
  const S = V.scalar;
  S.epokaManpowerRow = EPOKI.map((e) => ({ epoka: enc(e), out: enc(mp.epokaManpowerRow(e)) }));
  S.clampLudki = LUDKI.map((l) => ({ ludki: enc(l), out: enc(mp.clampLudki(l)) }));
  S.cityLudnoscAbsolutna = [];
  S.cityManpowerMax = [];
  S.unitManpowerCost = [];
  S.unitManpowerCostForType = [];
  S.rekrutUnitEquivalents = [];
  for (const e of EPOKI) {
    for (const l of LUDKI) {
      S.cityLudnoscAbsolutna.push({ ludki: enc(l), epoka: enc(e), out: enc(mp.cityLudnoscAbsolutna(l, e)) });
    }
    for (const m of MAXMULTS) {
      S.unitManpowerCost.push({ epoka: enc(e), maxMult: enc(m), out: enc(mp.unitManpowerCost(e, m)) });
      for (const t of TYPEIDS) {
        S.unitManpowerCostForType.push({ typeId: t, epoka: enc(e), maxMult: enc(m), out: enc(mp.unitManpowerCostForType(t, e, m)) });
      }
      for (const l of LUDKI) {
        S.cityManpowerMax.push({ ludki: enc(l), epoka: enc(e), maxMult: enc(m), out: enc(mp.cityManpowerMax(l, e, m)) });
      }
      for (const r of [0, 1, 999, 1000, 2500, 33333, -5, NaN, Infinity, 1e7]) {
        S.rekrutUnitEquivalents.push({ rekruci: enc(r), epoka: enc(e), maxMult: enc(m), out: enc(mp.rekrutUnitEquivalents(r, e, m)) });
      }
    }
  }
  // rozmiar plikow: deterministyczne przerzedzenie (co k-ty przypadek), bez zuzycia strumienia losowego
  const thin = (arr, n) => (arr.length <= n ? arr : arr.filter((_, i) => Math.floor((i * n) / arr.length) !== Math.floor(((i - 1) * n) / arr.length) || i === 0));
  S.cityManpowerMax = thin(S.cityManpowerMax, 2000);
  S.unitManpowerCostForType = thin(S.unitManpowerCostForType, 1200);
  S.rekrutUnitEquivalents = thin(S.rekrutUnitEquivalents, 1500);
  S.isScoutTypeId = TYPEIDS.concat(['Zwiadowca']).map((t) => ({ typeId: t, out: mp.isScoutTypeId(t) }));

  const NUMS = [0, -0, 1, 3, 10, 20, 33, 100, 1000, 0.5, 12.5, -1, NaN, Infinity];
  S.manpowerCostForHeal = [];
  S.maxAffordableManpowerHeal = [];
  for (const a of NUMS) for (const b of NUMS) for (const c of [0, 100, 1000, 2000, 33, 0.5, -1, NaN, Infinity]) {
    S.manpowerCostForHeal.push({ healHp: enc(a), maxHp: enc(b), unitCost: enc(c), out: enc(mp.manpowerCostForHeal(a, b, c)) });
  }
  for (const a of NUMS) for (const b of NUMS) for (const c of [0, 100, 1000, 33, -1, NaN]) for (const d of [0, 1, 50, 999, 1000, 4321, 1e6, NaN, -5, Infinity]) {
    S.maxAffordableManpowerHeal.push({ desiredHeal: enc(a), maxHp: enc(b), unitCost: enc(c), availableMp: enc(d), out: enc(mp.maxAffordableManpowerHeal(a, b, c, d)) });
  }
  S.manpowerCostForHeal = thin(S.manpowerCostForHeal, 2500);
  S.maxAffordableManpowerHeal = thin(S.maxAffordableManpowerHeal, 5000);
  S.manpowerHealCapForTurn = [];
  for (const pct of [0, 5, 20, 30, 40, 100, 33.3, 0.1, 150, NaN, Infinity]) {
    for (const mx of [0, 1, 7, 10, 33, 100, 123.5, -4, NaN, Infinity]) {
      for (const cur of [0, -3, 1, 3, 5, 9.9, 33, 100, 123.5, 200, NaN]) {
        const params = { healPctMaxPerTurn: pct };
        S.manpowerHealCapForTurn.push({ maxHp: enc(mx), curHp: enc(cur), pct: enc(pct), out: enc(mp.manpowerHealCapForTurn(mx, cur, params)) });
      }
    }
  }
  S.manpowerRegenGain = [];
  const regenParamsList = [undefined, { regenProcMaxPerTurn: 2, blockWhenBesieged: true }, { regenProcMaxPerTurn: 0, blockWhenBesieged: false }, { regenProcMaxPerTurn: 50, blockWhenBesieged: false }, { regenProcMaxPerTurn: 150, blockWhenBesieged: true }, { regenProcMaxPerTurn: 3.7, blockWhenBesieged: true }, { regenProcMaxPerTurn: -5, blockWhenBesieged: true }, { regenProcMaxPerTurn: NaN, blockWhenBesieged: true }, { regenProcMaxPerTurn: Infinity, blockWhenBesieged: true }];
  for (let i = 0; i < 1500; i++) {
    const l = pick(LUDKI), e = pick(EPOKI), p = pick(regenParamsList), rm = pick([1, 1, 2, 0.5, 0, -1, 0.85, NaN, Infinity, 1.37]), mm = pick(MAXMULTS);
    const out = p === undefined ? mp.manpowerRegenGain(l, e, undefined, rm, mm) : mp.manpowerRegenGain(l, e, p, rm, mm);
    S.manpowerRegenGain.push({ ludki: enc(l), epoka: enc(e), params: enc(p), regenMult: enc(rm), maxMult: enc(mm), out: enc(out) });
  }
  // wywolania z domyslnymi argumentami (undefined)
  S.regenGainDefaults = [];
  for (const l of [1, 5, 10]) for (const e of [1, 3, 10]) {
    S.regenGainDefaults.push({ ludki: l, epoka: e, out: enc(mp.manpowerRegenGain(l, e)) });
  }
}

// ===========================================================================
// parametry z miasto-params (raw) i bonusy cywilizacji
// ===========================================================================
{
  const P = V.params;
  const nums = [0, 1, 20, 30, 40, 99, 100, 101, 250, 12.5, -1, -0.5, NaN, Infinity, -Infinity, '30', null, true, [], {}];
  const rawReplenishRows = [undefined, null, 5, 'x', {}, { normal: 30 }, { easy: 40, normal: 30, hard: 20 }];
  for (let i = 0; i < 400; i++) rawReplenishRows.push({ easy: pick(nums.concat([undefined])), normal: pick(nums.concat([undefined, undefined])), hard: pick(nums.concat([undefined])) });
  P.replenish = [];
  for (const row of rawReplenishRows) {
    for (const d of ['easy', 'normal', 'hard']) {
      const raw = row === undefined ? {} : { manpower_uzupelnienie_hp_proc_max_tura: row };
      P.replenish.push({ difficulty: d, raw: enc(raw), out: enc(mp.loadManpowerReplenishParams(d, raw)) });
    }
  }
  P.regen = [];
  const wart = [undefined, 0, 1, 2, 5, 50, 100, 250, -1, -0.5, NaN, Infinity, '2', null, true];
  const rawRegens = [{}];
  for (const a of wart) for (const b of wart) {
    const raw = {};
    if (a !== undefined) raw.manpower_regen_proc_max_tura = { wartosc: a };
    if (b !== undefined) raw.manpower_regen_blok_oblezenie = { wartosc: b };
    rawRegens.push(raw);
  }
  rawRegens.push({ manpower_regen_proc_max_tura: {}, manpower_regen_blok_oblezenie: {} });
  rawRegens.push({ manpower_regen_proc_max_tura: null, manpower_regen_blok_oblezenie: null });
  for (const raw of rawRegens) P.regen.push({ raw: enc(raw), out: enc(mp.loadManpowerRegenParams(raw)) });

  P.civ = [];
  const typs = ['bonus_pobor_regen', 'mnoznik_pobor_regen', 'bonus_pobor_pula', 'mnoznik_manpower_max', 'inny', undefined, ''];
  const vals = [1, -0.15, 0.5, 2, 0.1, 0, -1, -2, 3.5, 1.0000001, NaN, Infinity, 'x', ['a'], null, undefined];
  const bonusLists = [undefined, [], null];
  for (let i = 0; i < 1500; i++) {
    const n = rint(1, 5);
    const list = [];
    for (let k = 0; k < n; k++) {
      const b = {};
      const t = pick(typs);
      if (t !== undefined) b.typ = t;
      const w = pick(vals);
      if (w !== undefined) b.wartosc = w;
      if (chance(0.2)) b.realizuje = 'x';
      list.push(b);
    }
    bonusLists.push(list);
  }
  for (const list of bonusLists) {
    const mults = list === null ? mp.civManpowerMults(undefined) : mp.civManpowerMults(list);
    const regen = list === null ? mp.civManpowerRegenMult(undefined) : mp.civManpowerRegenMult(list);
    const max = list === null ? mp.civManpowerMaxMult(undefined) : mp.civManpowerMaxMult(list);
    P.civ.push({ bonusy: enc(list), regen: enc(regen), max: enc(max), mults: enc(mults) });
  }
}

// ===========================================================================
// miasta: pula, regen, snapshot, pobor, rekrutacja (czyste)
// ===========================================================================
const CITY_IDS = ['c1', 'c10', 'c2', 'C1', 'c_1', 'c-1', 'miasto 1', 'a', 'B', 'b', 'A', 'Ab', 'aB', 'ab', 'AB', '1', '10', '2', 'z9', '~x', 'x~', 'City.1', 'city_1', 'Rzym', 'rzym', 'Ur', 'u_r', '', ' ', 'c1 ', 'c01'];
const POPS = [1, 2, 3, 4, 5, 6, 8, 10, 1, 2, 3, 0, 0.5, 2.7, -3, 11, 25];
const POPS_RARE = [NaN, Infinity, -0, 1e6];
const MPS = [undefined, undefined, undefined, 0, 1, 99, 500, 1000, 2500.7, 3999, 4000, 10000, 20000, 99999, 1e9, -5, NaN, Infinity, 0.5, 1234.99];

function mkCity(id, o = {}) {
  const c = {
    id,
    ownerId: o.ownerId ?? pick([0, 0, 0, 1, 2]),
    population: o.population ?? (chance(0.05) ? pick(POPS_RARE) : pick(POPS)),
    q: o.q ?? rint(-1, 1),
    r: o.r ?? rint(-1, 1),
  };
  const manpower = o.manpower !== undefined ? o.manpower : pick(MPS);
  if (manpower !== undefined) c.manpower = manpower;
  const ob = o.oblegane !== undefined ? o.oblegane : pick([undefined, undefined, true, false, true]);
  if (ob !== undefined) c.oblegane = ob;
  return c;
}
function mkCities(n, o = {}) {
  const ids = shuffle(CITY_IDS).slice(0, n);
  const list = ids.map((id) => mkCity(id, typeof o === 'function' ? o() : o));
  return list;
}

{
  const C = V.city;
  C.cityManpowerCurrent = [];
  C.tickManpowerRegen = [];
  C.cityManpowerSnapshot = [];
  C.canAffordUnitManpower = [];
  C.refreshManpowerAfterPopChange = [];
  C.spendManpower = [];
  C.refundUnitSpawnToCity = [];
  C.tryDeductUnitSpawnCosts = [];
  C.empireTotals = [];
  C.canAffordEmpire = [];
  const regenParamsList = [undefined, { regenProcMaxPerTurn: 2, blockWhenBesieged: true }, { regenProcMaxPerTurn: 2, blockWhenBesieged: false }, { regenProcMaxPerTurn: 40, blockWhenBesieged: true }, { regenProcMaxPerTurn: 0, blockWhenBesieged: false }, { regenProcMaxPerTurn: 100, blockWhenBesieged: false }];
  for (let i = 0; i < 700; i++) {
    const city = mkCity('c', {});
    const e = pick(EPOKI), mm = pick(MAXMULTS), rm = pick([1, 1, 2, 0.5, 0, NaN, 0.85]);
    C.cityManpowerCurrent.push({ city: enc(city), epoka: enc(e), maxMult: enc(mm), out: enc(mp.cityManpowerCurrent(city, e, mm)) });
    const p = pick(regenParamsList);
    const tout = p === undefined ? mp.tickManpowerRegen(city, e, undefined, rm, mm) : mp.tickManpowerRegen(city, e, p, rm, mm);
    C.tickManpowerRegen.push({ city: enc(city), epoka: enc(e), params: enc(p), regenMult: enc(rm), maxMult: enc(mm), out: enc(tout) });
    C.cityManpowerSnapshot.push({ city: enc(city), epoka: enc(e), regenMult: enc(rm), maxMult: enc(mm), out: enc(mp.cityManpowerSnapshot(city, e, rm, mm)) });
    const t = pick(TYPEIDS);
    C.canAffordUnitManpower.push({ city: enc(city), epoka: enc(e), maxMult: enc(mm), typeId: t, out: mp.canAffordUnitManpower(city, e, mm, t) });
    const prev = pick([undefined, undefined, 1, 2, 3, 5, 10, 0, 2.5, NaN, city.population, city.population - 1, city.population + 2]);
    C.refreshManpowerAfterPopChange.push({ city: enc(city), epoka: enc(e), previousPop: enc(prev), maxMult: enc(mm), out: enc(mp.refreshManpowerAfterPopChange(city, e, prev, mm)) });
    const amount = pick([undefined, undefined, 0, 500, 1000, 5000, -5, NaN, 12.7, Infinity]);
    C.spendManpower.push({ city: enc(city), epoka: enc(e), amount: enc(amount), maxMult: enc(mm), out: enc(mp.spendManpower(city, e, amount, mm)) });
    const popCost = pick([0, 1, 1, 2, 3, -1, 0.5, NaN]);
    const popCap = pick([undefined, undefined, 5, 10, 1, 0, 3.5, NaN]);
    C.refundUnitSpawnToCity.push({ city: enc(city), epoka: enc(e), popCost: enc(popCost), popCap: enc(popCap), maxMult: enc(mm), typeId: t, out: enc(mp.refundUnitSpawnToCity(city, e, popCost, popCap, mm, t)) });
    const popCost2 = pick([0, 0, 1, 2, 5, 11, NaN]);
    C.tryDeductUnitSpawnCosts.push({ city: enc(city), epoka: enc(e), popCost: enc(popCost2), maxMult: enc(mm), typeId: t, out: enc(mp.tryDeductUnitSpawnCosts(city, e, popCost2, mm, t)) });
  }
  // wywolania z domyslnymi popCost/popCap (undefined)
  C.refundDefaults = [];
  for (let i = 0; i < 200; i++) {
    const city = mkCity('c', {});
    const e = pick([1, 2, 3, 10]);
    C.refundDefaults.push({ city: enc(city), epoka: e, out: enc(mp.refundUnitSpawnToCity(city, e)) });
  }
  for (let i = 0; i < 500; i++) {
    const n = rint(0, 6);
    const cities = mkCities(n);
    const owner = pick([0, 1, 2, 3]);
    const e = pick(EPOKI), mm = pick(MAXMULTS);
    C.empireTotals.push({
      cities: enc(cities), ownerId: owner, epoka: enc(e), maxMult: enc(mm),
      suma: enc(mp.empireSumaLudkow(cities, owner)),
      totals: enc(mp.empirePoborTotals(cities, owner, e, mm)),
      current: enc(mp.empireManpowerCurrent(cities, owner, e, mm)),
    });
    const t = pick(TYPEIDS);
    const recruiting = cities.length ? pick(cities) : mkCity('x');
    C.canAffordEmpire.push({ cities: enc(cities), ownerId: owner, recruiting: enc(recruiting), epoka: enc(e), popCost: enc(pick([0, 1])), maxMult: enc(mm), typeId: t, out: mp.canAffordUnitManpowerEmpire(cities, owner, recruiting, e, 0, mm, t) });
  }
}

// ===========================================================================
// mutujace: deduct / refund / tryDeductEmpire
// ===========================================================================
{
  const M = V.mut;
  M.deduct = [];
  M.refund = [];
  M.tryDeductEmpire = [];
  for (let i = 0; i < 900; i++) {
    const n = rint(0, 7);
    const e = pick([1, 1, 2, 3, 10, 0, 2.7, NaN]);
    const mm = pick([1, 1, 1, 2, 0.5, 1.5, 0.1, NaN]);
    // czesto pule kontrolowane, by ukladac remisy
    const cities = mkCities(n, () => ({ ownerId: pick([0, 0, 0, 1]), population: pick([1, 2, 3, 3, 5, 10]), manpower: pick([undefined, 0, 1000, 1000, 1000, 2000, 2000, 500, 3000, 4000, 123, 10000, NaN]) }));
    const owner = pick([0, 0, 1, 2]);
    const total = mp.empireManpowerCurrent(cities, owner, e, mm);
    const amount = pick([0, -5, 1, 500, 1000, 1500, 3000, total, total - 1, total + 1, total / 2, Math.floor(total / 3), NaN, Infinity, 0.5, 2500.5]);
    const before = clone(cities);
    const after = clone(cities);
    const ok = mp.deductManpowerFromEmpire(after, owner, e, amount, mm);
    M.deduct.push({ cities: enc(before), ownerId: owner, epoka: enc(e), amount: enc(amount), maxMult: enc(mm), ok, after: enc(after) });
    const afterR = clone(cities);
    mp.refundManpowerToEmpire(afterR, owner, e, amount, mm);
    M.refund.push({ cities: enc(before), ownerId: owner, epoka: enc(e), amount: enc(amount), maxMult: enc(mm), after: enc(afterR) });
    const rid = cities.length && chance(0.85) ? pick(cities).id : pick(['zz', '', 'c1']);
    const t = pick(TYPEIDS);
    const afterT = clone(cities);
    const out = mp.tryDeductUnitSpawnCostsEmpire(afterT, rid, owner, e, 0, mm, t);
    M.tryDeductEmpire.push({ cities: enc(before), recruitingCityId: rid, ownerId: owner, epoka: enc(e), maxMult: enc(mm), typeId: t, out: enc(out), after: enc(afterT) });
  }
}

// ===========================================================================
// pozostale: lokalizacja oblezona, klucz sortowania, sync hp, isCivilianUnit
// ===========================================================================
{
  const X = V.misc;
  X.isUnitInBesiegedLocation = [];
  X.replenishmentUnitSortKey = [];
  for (let i = 0; i < 800; i++) {
    const cities = mkCities(rint(0, 5), () => ({ q: rint(-1, 1), r: rint(-1, 1) }));
    const u = {
      id: 'u', ownerId: pick([0, 0, 1, 2]), typeId: 'Wojownik', category: 'piechota',
    };
    if (chance(0.9)) u.q = rint(-1, 1);
    if (chance(0.9)) u.r = rint(-1, 1);
    if (chance(0.5)) u.inGarnizon = pick([true, false]);
    X.isUnitInBesiegedLocation.push({ unit: enc(u), cities: enc(cities), out: mp.isUnitInBesiegedLocation(u, cities) });
    X.replenishmentUnitSortKey.push({ unit: enc(u), cities: enc(cities), out: mp.replenishmentUnitSortKey(u, cities) });
  }
  X.syncLiveUnitHp = [];
  for (let i = 0; i < 300; i++) {
    const n = rint(0, 5);
    const ids = ['u1', 'u2', 'u3', 'u1', 'x'];
    const units = Array.from({ length: n }, (_, k) => {
      const u = { id: pick(ids) };
      if (chance(0.6)) u.hp = pick([1, 5, 10]);
      if (chance(0.6)) u.hpMax = pick([10, 20]);
      return u;
    });
    const target = pick(['u1', 'u2', 'nope', 'x']);
    const hp = pick([0, 5, 12.5, NaN, 30]);
    const hpMax = pick([10, 20, 33.3, Infinity]);
    const after = clone(units);
    mp.syncLiveUnitHp(after, target, hp, hpMax);
    X.syncLiveUnitHp.push({ units: enc(units), unitId: target, hp: enc(hp), hpMax: enc(hpMax), after: enc(after) });
  }
  X.isCivilianUnit = [];
  const cats = ['piechota', 'osadnik', 'robotnik', 'zwiadowca', 'Osadnik', 'jazda', '', 'super', 'ZWIADOWCA', 'zwiadowca '];
  const types = ['Zwiadowca', 'Osadnik', 'Robotnik', 'Wojownik', 'zwiadowca', '', 'Hoplita', 'Robotnik '];
  for (const c of cats) for (const t of types) X.isCivilianUnit.push({ category: c, typeId: t, out: setup.isCivilianUnit({ category: c, typeId: t }) });
}

// ===========================================================================
// leczenie jednostek z puli imperium (tickManpowerUnitReplenishment)
// ===========================================================================
{
  const R = (V.replenish.cases = []);
  const UNIT_IDS = ['u1', 'u10', 'u2', 'U1', 'u_1', 'u-1', 'u 1', 'u.1', 'a', 'B', 'b', 'A', 'Ab', 'aB', 'ab', 'AB', '1', '10', '2', 'z', 'ZZ', 'zz', '~', 'x~', 'k1', 'k2', 'k3', 'K1', 'K2', 'm1', 'm2', 'M1'];
  const UTYPES = ['Wojownik', 'Wojownik', 'Łucznik', 'Hoplita', 'Katapulta', 'Jazda', 'Zwiadowca', 'Osadnik', 'Robotnik', 'Wojownik'];
  const CATS = ['piechota', 'piechota', 'jazda', 'lucznik', 'osadnik', 'robotnik', 'zwiadowca', 'super'];
  const HPS = [undefined, undefined, 0, 1, 3, 5, 7, 10, 12, 15, 19, 20, 25, 30, 33, 50, 55, 80, 99, 100, 150, -4, NaN, Infinity, 12.5, 47.3];
  const HPMAXS = [undefined, undefined, 10, 20, 33, 100, 50, 7, NaN, -1, 0, 1e9];
  const MAXHP_VALUES = [10, 20, 30, 33, 40, 50, 60, 100, 120, 7, 12.5, 99.9, 150, 200, NaN, 0, -5, Infinity];
  const mkU = (id, owner, cityPos) => {
    const u = {
      id, ownerId: owner, typeId: pick(UTYPES), category: pick(CATS),
    };
    const hp = pick(HPS); if (hp !== undefined) u.hp = hp;
    const hm = pick(HPMAXS); if (hm !== undefined) u.hpMax = hm;
    if (chance(0.5)) u.parametryBonusProc = pick([0, 10, 20, 50]);
    if (chance(0.5)) u.battlesSurvived = pick([0, 1, 3]);
    if (chance(0.85)) { u.q = chance(0.4) && cityPos ? cityPos.q : rint(-1, 1); u.r = chance(0.4) && cityPos ? cityPos.r : rint(-1, 1); }
    if (chance(0.3)) u.inGarnizon = pick([true, false]);
    return u;
  };
  for (let i = 0; i < 700; i++) {
    const era = new Map(), bon = new Map();
    const owners = [0, 1, 2].slice(0, rint(1, 3));
    for (const o of owners) {
      era.set(o, pick([1, 1, 2, 3, 4, 10, 0, 2.7, NaN]));
      bon.set(o, chance(0.5) ? undefined : [pick([{ typ: 'bonus_pobor_pula', wartosc: 1 }, { typ: 'mnoznik_manpower_max', wartosc: 2 }, { typ: 'mnoznik_manpower_max', wartosc: 0.5 }, { typ: 'bonus_pobor_regen', wartosc: 1 }, { typ: 'bonus_pobor_pula', wartosc: -2 }, { typ: 'mnoznik_manpower_max', wartosc: NaN }])]);
    }
    // miasta: pule kontrolowane wzgledem kosztu jednostki, by czesto wymuszac przydzial proporcjonalny
    const cities = mkCities(rint(1, 5), () => ({ ownerId: pick(owners), population: pick([1, 2, 3, 5, 10]), manpower: undefined }));
    for (const c of cities) {
      const o = c.ownerId;
      const cost = mp.unitManpowerCost(era.get(o), mp.civManpowerMaxMult(bon.get(o)));
      const kind = rint(0, 5);
      if (kind === 0) delete c.manpower;
      else if (kind === 1) c.manpower = 0;
      else if (kind === 2) c.manpower = rint(1, Math.max(1, Math.floor(cost / 2)));
      else if (kind === 3) c.manpower = rint(1, Math.max(1, Math.floor(cost * 2)));
      else if (kind === 4) c.manpower = rint(1, Math.max(1, Math.floor(cost * 8)));
      else c.manpower = Math.floor(cost * 50);
      if (chance(0.25)) c.oblegane = true;
      c.q = rint(-1, 1); c.r = rint(-1, 1);
    }
    const nUnits = rint(0, 14);
    const uids = shuffle(UNIT_IDS).slice(0, nUnits);
    const units = uids.map((id) => mkU(id, pick(owners), pick(cities)));
    const difficulty = pick(['easy', 'normal', 'normal', 'hard']);
    let raw;
    if (chance(0.3)) {
      raw = { manpower_uzupelnienie_hp_proc_max_tura: pick([{ easy: 90, normal: 80, hard: 70 }, { easy: 5, normal: 4, hard: 3 }, { normal: 25 }, {}, { easy: 'x', normal: 50, hard: -1 }, { easy: 100, normal: 100, hard: 100 }, { easy: 0, normal: 0, hard: 0 }, { easy: 33.3, normal: 33.3, hard: 33.3 }]) };
    }
    const maxHpById = new Map(units.map((u) => [u.id, pick(MAXHP_VALUES)]));
    const eraCalls = [], bonCalls = [], hpCalls = [], cbCalls = [];
    const citiesRun = clone(cities);
    const unitsRun = clone(units);
    const withCb = chance(0.7);
    const result = mp.tickManpowerUnitReplenishment(
      citiesRun, unitsRun, difficulty,
      (o) => { eraCalls.push(o); return era.get(o); },
      (o) => { bonCalls.push(o); return bon.get(o); },
      (typeId, unit) => { hpCalls.push({ typeId, id: unit?.id, hp: unit?.hp, hpMax: unit?.hpMax }); return maxHpById.get(unit.id); },
      raw,
      withCb ? (id, hp, hpMax) => { cbCalls.push([id, hp, hpMax]); } : undefined,
    );
    R.push({
      difficulty, raw: enc(raw), cities: enc(cities), units: enc(units),
      era: [...era.entries()].map(([k, v]) => [k, enc(v)]),
      bonusy: [...bon.entries()].map(([k, v]) => [k, enc(v)]),
      maxHp: [...maxHpById.entries()].map(([k, v]) => [k, enc(v)]),
      withCb,
      out: { result: enc(result), cities: enc(citiesRun), units: enc(unitsRun), eraCalls, bonCalls, hpCalls: enc(hpCalls), cbCalls: enc(cbCalls) },
    });
  }
  // przypadki dedykowane: remisy idealnych udzialow (rownolegle jednostki, ten sam koszt) i kolejnosc id (localeCompare)
  for (let i = 0; i < 250; i++) {
    const owner = 0;
    const eraV = pick([1, 2, 3]);
    const cost = mp.unitManpowerCost(eraV, 1);
    const nUnits = rint(2, 10);
    const uids = shuffle(UNIT_IDS).slice(0, nUnits);
    const units = uids.map((id) => ({
      id, ownerId: owner, typeId: 'Wojownik', category: 'piechota',
      hp: pick([5, 5, 10, 10, 7, 3]), hpMax: 20, q: 5 + rint(0, 3), r: 5,
    }));
    const maxHpById = new Map(units.map((u) => [u.id, pick([20, 20, 20, 30, 40])]));
    const cities = [{ id: 'cA', ownerId: owner, population: pick([1, 2, 5]), manpower: rint(1, Math.floor(cost * pick([0.2, 0.5, 1, 1.5]))), q: 0, r: 0 }];
    const eraCalls = [], bonCalls = [], hpCalls = [], cbCalls = [];
    const citiesRun = clone(cities), unitsRun = clone(units);
    const difficulty = pick(['easy', 'normal', 'hard']);
    const result = mp.tickManpowerUnitReplenishment(
      citiesRun, unitsRun, difficulty,
      (o) => { eraCalls.push(o); return eraV; },
      (o) => { bonCalls.push(o); return undefined; },
      (typeId, unit) => { hpCalls.push({ typeId, id: unit?.id, hp: unit?.hp, hpMax: unit?.hpMax }); return maxHpById.get(unit.id); },
      undefined,
      (id, hp, hpMax) => { cbCalls.push([id, hp, hpMax]); },
    );
    R.push({
      difficulty, raw: undefined, cities: enc(cities), units: enc(units),
      era: [[owner, eraV]], bonusy: [[owner, null]], maxHp: [...maxHpById.entries()].map(([k, v]) => [k, enc(v)]), withCb: true,
      out: { result: enc(result), cities: enc(citiesRun), units: enc(unitsRun), eraCalls, bonCalls, hpCalls: enc(hpCalls), cbCalls: enc(cbCalls) },
    });
  }
}

// ===========================================================================
// unit-building-bonuses
// ===========================================================================
const BIDS = ['kuznia', 'kuznia_zelaza', 'wielka_kuznia', 'koszary', 'akademia_wojskowa', 'warsztat_oblezniczy', 'targowisko', 'x', 'y', 'cykl_a', 'cykl_b', 'sam'];
const BAZA = [undefined, null, {}, { mnoznik: 15 }, { mnoznik: 15 }, { mnoznik: 20 }, { mnoznik: 10 }, { mnoznik: 0 }, { mnoznik: -5 }, { mnoznik: NaN }, { mnoznik: '15' }, { mnoznik: Infinity }, { mnoznik: 7.5 }, { mnoznik: 0.1 }, { mnoznik: null }, 5];
const UPG = [undefined, undefined, null, '', ' ', ' kuznia ', '\tkuznia_zelaza\n', 'kuznia', 'kuznia_zelaza', 'wielka_kuznia', 'koszary', 'akademia_wojskowa', 'nieistniejacy', ' kuznia', '﻿kuznia', '\u0085kuznia', ' koszary　', 'kuznia᠎', 5, 'x', 'y', 'cykl_a', 'cykl_b', 'sam'];

const REALISTIC = { kuznia: [15, undefined], kuznia_zelaza: [15, 'kuznia'], wielka_kuznia: [15, 'kuznia_zelaza'], koszary: [20, undefined], akademia_wojskowa: [20, undefined], warsztat_oblezniczy: [10, undefined], targowisko: [0, undefined] };
function mkRealisticBuildings() {
  const ids = Object.keys(REALISTIC).filter(() => chance(0.8));
  return shuffle(ids).map((id) => {
    const [m, up] = REALISTIC[id];
    const b = { id, baza: { mnoznik: chance(0.12) ? pick([0, -1, NaN, 7.5, '15', 25]) : m } };
    const u = chance(0.15) ? pick(UPG) : up;
    if (u !== undefined) b.upgradeFrom = u;
    return b;
  });
}
function mkBuildings(o = {}) {
  if (!o.n && chance(0.6)) return mkRealisticBuildings();
  const n = o.n ?? rint(0, 9);
  const ids = shuffle(BIDS).slice(0, n);
  const list = ids.map((id) => {
    const b = { id };
    const baza = pick(BAZA);
    if (baza !== undefined) b.baza = baza;
    const up = pick(UPG);
    if (up !== undefined) b.upgradeFrom = up;
    return b;
  });
  if (chance(0.1) && list.length) list.push({ ...list[0], baza: pick(BAZA) }); // zdublowane id: pozniejszy wygrywa
  return list;
}
// "realistyczne" budynki: poprawny lancuch z rzeczywistych danych
const REAL_LOOKUP = realBuildings.map((b) => ({ id: b.id, baza: b.baza, upgradeFrom: b.upgradeFrom ?? undefined }));

const realMemo = new WeakSet();
realMemo.add(REAL_LOOKUP);
function isReal(b) { return b && realMemo.has(b) ? '$real' : enc(b); }
function mkBuilt() {
  const kind = rint(0, 11);
  if (kind === 0) return undefined;
  if (kind === 1) return null;
  if (kind === 2) return [];
  if (kind >= 5) return shuffle(Object.keys(REALISTIC)).filter(() => chance(0.55));
  const n = rint(1, 8);
  return Array.from({ length: n }, () => pick(BIDS.concat(['kuznia', 'koszary', 'kuznia_zelaza', 'wielka_kuznia'])));
}
const PROCS = [undefined, null, 0, -0, 5, 7.5, 14.9, 15, 15.0001, 16, 17, 29.99, 30, 30.5, 33, 34, 45, 50, 100, NaN, -3, Infinity, -Infinity, 'x', 1e21, 1e-7, 0.1 + 0.2, 20, 10, 40];
function mkProgress() {
  const kind = rint(0, 9);
  if (kind === 0) return undefined;
  if (kind === 1) return null;
  const u = {};
  const a = pick(PROCS); if (a !== undefined) u.pancerzBonusProc = a;
  const b = pick(PROCS); if (b !== undefined) u.parametryBonusProc = b;
  return u;
}

{
  const B = V.bld;
  B.mnoznikRoleForBuildingId = BIDS.concat(realBuildings.map((b) => b.id), ['', 'Kuznia', 'kuznia ']).map((id) => ({ id, out: ubb.mnoznikRoleForBuildingId(id) }));
  B.cityBonus = [];
  B.cumulative = [];
  for (let i = 0; i < 2000; i++) {
    const buildings = pick([mkBuildings(), mkBuildings(), mkBuildings(), REAL_LOOKUP, undefined, null, []]);
    const built = mkBuilt();
    B.cityBonus.push({ built: enc(built), buildings: isReal(buildings),  armor: enc(ubb.cityArmorBonusPercent(built, buildings)), soft: enc(ubb.citySoftStatBonusPercent(built, buildings)) });
    const id = pick(BIDS.concat(['kuznia', 'koszary', 'wielka_kuznia', 'warsztat_oblezniczy']));
    B.cumulative.push({ id, buildings: isReal(buildings), out: enc(ubb.cumulativeMnoznikForBuildingId(id, buildings)) });
  }
  // glebokosc lancucha: kuznia -> chain_0 -> ... -> chain_k -> kuznia_zelaza
  B.depth = [];
  for (let k = 20; k <= 40; k++) {
    const buildings = [{ id: 'kuznia', baza: { mnoznik: 15 }, upgradeFrom: 'chain_0' }, { id: 'kuznia_zelaza', baza: { mnoznik: 15 } }, { id: 'wielka_kuznia', baza: { mnoznik: 15 }, upgradeFrom: 'kuznia_zelaza' }];
    for (let j = 0; j <= k; j++) buildings.push({ id: `chain_${j}`, baza: { mnoznik: 99 }, upgradeFrom: j === k ? 'kuznia_zelaza' : `chain_${j + 1}` });
    for (const built of [['kuznia'], ['kuznia', 'wielka_kuznia'], ['wielka_kuznia']]) {
      B.depth.push({ k, built, buildings: enc(buildings), armor: enc(ubb.cityArmorBonusPercent(built, buildings)), cumulative: enc(ubb.cumulativeMnoznikForBuildingId('kuznia', buildings)) });
    }
  }
  // rzeczywiste dane gry (gra/data/buildings.json): wszystkie id i podzbiory sciezek
  B.real = [];
  const relevant = [...ubb.ARMOR_BUILDING_IDS, ...ubb.SOFT_STAT_BUILDING_IDS];
  const subsets = [];
  for (let mask = 0; mask < 64; mask++) subsets.push(relevant.filter((_, bit) => mask & (1 << bit)));
  for (const built of subsets) {
    B.real.push({ built, armor: enc(ubb.cityArmorBonusPercent(built, REAL_LOOKUP)), soft: enc(ubb.citySoftStatBonusPercent(built, REAL_LOOKUP)) });
  }
  B.realCumulative = realBuildings.map((b) => ({ id: b.id, role: ubb.mnoznikRoleForBuildingId(b.id), out: enc(ubb.cumulativeMnoznikForBuildingId(b.id, REAL_LOOKUP)) }));

  B.unitProc = [];
  for (const a of PROCS.concat([undefined])) {
    const u = a === undefined ? {} : { pancerzBonusProc: a, parametryBonusProc: a };
    B.unitProc.push({ unit: enc(u), pancerz: enc(ubb.unitPancerzBonusProc(u)), parametry: enc(ubb.unitParametryBonusProc(u)), frac: enc(ubb.unitPancerzBonusFrac(u)), fracP: enc(ubb.unitParametryBonusFrac(u)), armorBadge: ubb.armorPathBadgeLevel(u), softBadge: ubb.softPathBadgeLevel(u), label: ubb.unitBuildingBonusLabel(u), combat: enc(ubb.buildingCombatBonusForUnit(u)) });
  }
  for (const u of [undefined, null]) {
    B.unitProc.push({ unit: u === null ? null : undefined, pancerz: enc(ubb.unitPancerzBonusProc(u)), parametry: enc(ubb.unitParametryBonusProc(u)), frac: enc(ubb.unitPancerzBonusFrac(u)), fracP: enc(ubb.unitParametryBonusFrac(u)), armorBadge: ubb.armorPathBadgeLevel(u), softBadge: ubb.softPathBadgeLevel(u), label: ubb.unitBuildingBonusLabel(u), combat: enc(ubb.buildingCombatBonusForUnit(u)) });
  }
  // siatka progow odznak
  B.badgeGrid = [];
  for (let pp = -2; pp <= 60; pp += 0.5) {
    const u = { pancerzBonusProc: pp, parametryBonusProc: pp };
    B.badgeGrid.push({ pp: enc(pp), armor: ubb.armorPathBadgeLevel(u), soft: ubb.softPathBadgeLevel(u) });
  }
  for (let i = 0; i < 1200; i++) {
    const u = mkProgress();
    const built = mkBuilt();
    const buildings = pick([mkBuildings(), REAL_LOOKUP, undefined]);
    const best = ubb.bestBuildingProgressAfterCityVisit(u, built, buildings);
    const would = ubb.buildingProgressWouldChange(u, built, buildings);
    const uApply = clone(u);
    const gain = uApply === undefined || uApply === null ? ubb.applyCityVisitBonusGain({}, built, buildings) : ubb.applyCityVisitBonusGain(uApply, built, buildings);
    const gainUnit = uApply === undefined || uApply === null ? null : uApply;
    // powtorzone na pustym obiekcie dla wejscia null/undefined (web wymaga obiektu przy mutacji)
    const labelUnit = pick(['Wojownik', 'Łucznik {miasto}', '{jednostka}', '', 'Ż😀']);
    const cityName = pick(['Rzym', '{czesci}', '', 'Kraków', '{jednostka} {miasto}']);
    const hint = ubb.formatBuildingBonusGainHint(labelUnit, cityName, gain);
    B.apply = B.apply || [];
    B.apply.push({
      unit: enc(u), built: enc(built), buildings: isReal(buildings),
      best: enc(best), would, gain: enc(gain), unitAfter: enc(gainUnit), emptyInput: uApply === undefined || uApply === null,
      labelUnit, cityName, hint,
    });
  }
  // formatBuildingBonusGainHint: bezposrednio na zadanych przyrostach
  B.hint = [];
  const gv = [0, 1, 5, 15, 7.5, 0.1 + 0.2, 1e21, 1e-7, 45, -3, NaN];
  for (const ag of gv) for (const sg of gv) for (const at of [0, 15, 45, 33.3]) for (const st of [0, 20, 50, 1e21]) {
    const gain = { armorGained: ag, softGained: sg, armorTotal: at, softTotal: st };
    B.hint.push({ gain: enc(gain), out: ubb.formatBuildingBonusGainHint('Wojownik', 'Rzym', gain) });
  }
  // merge
  B.merge = [];
  const MODV = [0, 0.1, -0.2, 0.5, 1, NaN, Infinity, 0.30000000000000004];
  const BONV = [0, -0, 0.15, 0.45, 0.2, 0.5, -0.1, NaN, Infinity, 1e-9];
  for (let i = 0; i < 600; i++) {
    const mods = { atk: pick(MODV), obrona: pick(MODV), pancerz: pick(MODV), uderzenie: pick(MODV), rangedAtk: pick(MODV), health: pick(MODV) };
    const bonusKind = rint(0, 4);
    const bonus = bonusKind === 0 ? undefined : bonusKind === 1 ? null : { pancerz: pick(BONV), other: pick(BONV) };
    const after = clone(mods);
    const ret = ubb.mergeBuildingBonusIntoStatMultipliers(after, bonus);
    B.merge.push({ mods: enc(mods), bonus: enc(bonus), after: enc(after), same: ret === after });
  }
}

// ===========================================================================
// zapis
// ===========================================================================
function floatSafe(v) {
  if (typeof v === 'number') return Number.isFinite(v) && (!Number.isInteger(v) || Math.abs(v) > 2 ** 53) ? { $f: String(v) } : v;
  if (Array.isArray(v)) return v.map(floatSafe);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) o[k] = floatSafe(x);
    return o;
  }
  return v;
}
const write = (name, obj) => writeFileSync(join(outDir, name), JSON.stringify(floatSafe(obj)));
const meta = { pin: 'edb8fb56', generator: 'gen-p65b-vectors.mjs', note: 'wektory z URUCHOMIONEGO weba; liczby specjalne {"$n"}; undefined = brak klucza; niecalkowite {"$f"}' };
write('format.json', { meta, consts: V.consts, cases: { fmt: V.fmt, collate: V.collate } });
write('manpower.json', { meta, cases: { scalar: V.scalar, params: V.params, city: V.city, mut: V.mut, misc: V.misc } });
write('replenish.json', { meta, cases: V.replenish });
write('buildings.json', { meta, cases: V.bld });

console.log = origLog;
const count = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v === 'object' && v ? Object.fromEntries(Object.entries(v).map(([k2, v2]) => [k2, Array.isArray(v2) ? v2.length : typeof v2])) : typeof v]));
console.log(JSON.stringify({ fmt: count(V.fmt), collate: count(V.collate), scalar: count(V.scalar), params: count(V.params), city: count(V.city), mut: count(V.mut), misc: count(V.misc), replenish: V.replenish.cases.length, bld: count(V.bld) }, null, 1));
console.warn = origWarn;
