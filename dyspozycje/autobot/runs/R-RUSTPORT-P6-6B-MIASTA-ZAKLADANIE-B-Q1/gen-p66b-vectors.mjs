// P6.6B - wektory z URUCHOMIONEGO weba (pin edb8fb56) dla:
//   gra/src/game/display-names.ts, empire-city-defaults.ts, cities.ts
// Kod weba ladowany w calosci (bez stubow); zadne funkcje logiki nie sa przepisywane. Zaleznosci spoza
// zakresu (economy-upkeep.readCityFoodBuffer, population-growth-v85.ensureCityRationDefaults,
// wealth.freshWealthState, units/setup) sa PRAWDZIWYM kodem weba; ich wyniki sa zapisywane jako dane
// wstrzykniete do Rust (domkniecia testu sprawdzaja argumenty). Jedyna ingerencja w srodowisko:
// Date.now() zwraca ustalone wartosci (deterministyczne identyfikatory szablonow list budowy).
// Liczby specjalne: NaN / +-Infinity / -0 zapisywane jako stringi "NaN" / "Infinity" / "-Infinity" / "-0";
// liczby niecalkowite jako string "~<najkrotszy zapis JS>" (Rust: str::parse::<f64> jest dokladny).
// Wejscia losowe: Mulberry32 z ziarnem stalym (deterministyczne).
//
// Uzycie:
//   node --experimental-transform-types --no-warnings --import ./p66b-loader-register.mjs \
//     ./gen-p66b-vectors.mjs <WEB_ROOT> <OUT_DIR>
import { mkdirSync, writeFileSync } from 'node:fs';
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

const C = await import(src('game/cities.ts'));
const E = await import(src('game/empire-city-defaults.ts'));
const D = await import(src('game/display-names.ts'));
const EU = await import(src('game/economy-upkeep.ts'));
const PG = await import(src('game/population-growth-v85.ts'));
const WE = await import(src('game/wealth.ts'));
const TH = await import(src('types/hex.ts'));

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x66b0c0de);
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;

const replacer = (_k, v) => {
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'NaN';
    if (v === Infinity) return 'Infinity';
    if (v === -Infinity) return '-Infinity';
    if (Object.is(v, -0)) return '-0';
    if (!Number.isInteger(v)) return '~' + String(v);
  }
  return v;
};
const write = (name, obj) => writeFileSync(join(outDir, name), JSON.stringify(obj, replacer, 0) + '\n');
const nn = (x) => (x === undefined ? null : x);
const clone = (x) => (x === undefined ? undefined : structuredClone(x));
// obiekt bez pol undefined (JSON i tak je pomija, ale jawnie dla czytelnosci)
const defined = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

// ======================================================================
// Kanoniczna postac City (tylko pola, ktore port Rust modeluje)
// ======================================================================
const CITY_KEYS = [
  'id', 'ownerId', 'q', 'r', 'name', 'population', 'magazynZywnosci', 'surowce', 'podzialHandluOverride',
  'podzialHandlu', 'podzialPracyOverride', 'podzialPracy', 'poziomRacji', 'poziomRacjiOverride', 'autoWyzywienie',
  'rationMigratedV114', 'wzrostUlamkowy', 'turyBezDoplaty', 'procentRozwoj', 'okolicaFocus', 'okolicaFocusOverride',
  'okolicaTryb', 'budowaFocus', 'budowaTryb', 'budowaFocusOverride', 'budowaPriorytetTypow', 'budowaLista',
  'ulepszeniaOverride', 'ulepszeniaFocus', 'ulepszeniaTryb', 'ulepszeniaOnlyWorked', 'ulepszeniaWolnoWycinacLas',
  'ulepszeniaPracaPercent', 'ulepszeniaPerTurn', 'wealthState', 'wealthImmunityRemaining', 'foundedByOwner',
  'startCityState', 'postepBudynkowUsuniete',
];
// pola typowane liczba, ktore w wejsciu moga byc nie-liczba: port modeluje je jako Option<f64> (None = nie-liczba)
const NUMBER_ONLY = new Set(['ulepszeniaPracaPercent', 'ulepszeniaPerTurn']);
function cityOut(c) {
  const out = {};
  for (const k of CITY_KEYS) {
    const v = c[k];
    if (v === undefined) continue;
    if (NUMBER_ONLY.has(k) && typeof v !== 'number') continue;
    out[k] = structuredClone(v);
  }
  return out;
}
// wejscie City dla wektora: te same pola (nie-liczby dla NUMBER_ONLY zostaja - Rust mapuje je na None)
function cityIn(c) {
  const out = {};
  for (const k of CITY_KEYS) {
    if (c[k] !== undefined) out[k] = structuredClone(c[k]);
  }
  return out;
}

const OKOLICA = ['zrownowazone', 'zywnosc', 'produkcja', 'podatki'];
const BUDOWA_FOCUS = ['zrownowazone', 'wzrost', 'wojsko', 'kultura', 'prawo', 'produkcja'];
const BUDOWA_TRYB = ['reczny', 'priorytet', 'lista', 'zrownowazone'];
const ULEPSZ_FOCUS = ['zywnosc', 'surowce', 'infrastruktura', 'zrownowazone'];
const TRYB2 = ['auto', 'reczny'];
const PCT_NUMS = [0, 1, 20, 33, 49, 49.5, 50, 50.4, 50.5, 51, 66, 70, 99, 100, 101, 150, -5, 75.5, NaN, Infinity, -Infinity, -0, 0.5, 2.5];

// ======================================================================
// display-names.ts
// ======================================================================
const NAMES = [
  undefined, '', ' ', 'Ateny', '  Ateny  ', ' Rzym ', '﻿X﻿', '\u0085Y\u0085', '\t\nZ\r', 'a\tb',
  'Sparta · miasto-państwo', ' · miasto-państwo', 'x · miasto-państwo · miasto-państwo', 'Sparta · miasto-państwo ',
  'miasto-państwo', 'Grecja', 'Hetyci', 'Hattusa', "Xi'an", 'Rywal 3', 'rywal 12', 'RYWAL 7', 'Rywal  1', 'Rywal ', 'Rywal',
  'Rywal 1a', 'AI 5', 'ai 007', 'Ai 9', 'AI  4', 'AI', 'oid-3', 'OID-77', 'Oid-5', 'oid-', 'oid-x', 'oid- 3', 'Rywal ١',
  'AI ５', 'Aı 5', 'Rywal 1\n', 'Łódź', 'ŁÓDŹ', 'ΑΣ', 'İstanbul', 'Rywal 12345678901234567890', '😀', 'A😀',
];
const display = { constants: { label: D.CITY_STATE_LABEL, separator: D.CITY_STATE_SEPARATOR } };

display.format = [];
for (const base of NAMES) {
  for (const isCs of [undefined, true, false]) {
    const ctx = { baseName: base };
    if (isCs !== undefined) ctx.isCityState = isCs;
    display.format.push({ base: nn(base), isCs: nn(isCs), out: D.formatEntityDisplayName(ctx) });
  }
}
display.strip = NAMES.filter((n) => n !== undefined).map((n) => ({ name: n, out: D.stripCityStateSuffix(n) }));
display.technical = NAMES.map((n) => ({ name: nn(n), out: D.isTechnicalOwnerLabel(n) }));

display.slot = [];
for (const rival of [undefined, true, false]) {
  for (const cap of [undefined, true, false]) {
    for (const player of [undefined, true, false]) {
      const slot = defined({ isSameTypeRival: rival, isClusterCapital: cap, isPlayerCapital: player });
      display.slot.push({ rival: nn(rival), cap: nn(cap), player: nn(player), out: D.isClusterCityStateSlot(slot) });
    }
  }
}

function genOwnerOpts() {
  if (chance(0.15)) return null;
  const o = {};
  if (chance(0.6)) o.simplified = Array.from({ length: ri(0, 3) }, () => ri(-1, 5));
  if (chance(0.6)) o.typCopy = Array.from({ length: ri(0, 3) }, () => ri(-1, 5));
  if (chance(0.7)) {
    o.cities = Array.from({ length: ri(0, 4) }, () => defined({ ownerId: ri(-1, 5), startCityState: pick([undefined, true, false]) }));
  }
  return o;
}
function toWebOwnerOpts(o) {
  if (o === null) return undefined;
  const w = {};
  if (o.simplified) w.simplifiedOwners = new Set(o.simplified);
  if (o.typCopy) w.typCopyOwners = new Set(o.typCopy);
  if (o.cities) w.cities = o.cities.map((c) => ({ ...c }));
  return w;
}
display.ownerCs = [];
for (let i = 0; i < 700; i++) {
  const ownerId = ri(-2, 6);
  const opts = genOwnerOpts();
  display.ownerCs.push({ ownerId, opts, out: D.isOwnerClusterCityState(ownerId, toWebOwnerOpts(opts)) });
}
// puste kolekcje i brak opts jawnie
display.ownerCs.push({ ownerId: 1, opts: {}, out: D.isOwnerClusterCityState(1, {}) });
display.ownerCs.push({ ownerId: 1, opts: null, out: D.isOwnerClusterCityState(1) });

display.clear = [];
for (const before of [undefined, true, false]) {
  const city = {};
  if (before !== undefined) city.startCityState = before;
  const ret = D.clearCityStateFlagOnCapture(city);
  display.clear.push({ before: nn(before), after: nn(city.startCityState), ret });
}

const KEYS = [undefined, '', '  ', 'Greek', ' Greek ', 'greek', 'Rzym', ' Rzym', 'Hetyci', '﻿Greek'];
display.force = [];
for (let i = 0; i < 800; i++) {
  const ownerId = ri(-2, 6);
  const base = genOwnerOpts();
  let opts = null;
  if (chance(0.85)) {
    opts = { base: base ?? {}, playerCivKey: pick(KEYS), ownerCivKey: pick(KEYS) };
    if (chance(0.6)) opts.clusterCapitalOwnerIds = Array.from({ length: ri(0, 3) }, () => ri(-1, 6));
  }
  let web;
  if (opts !== null) {
    web = toWebOwnerOpts(opts.base) ?? {};
    web.playerCivKey = opts.playerCivKey;
    web.ownerCivKey = opts.ownerCivKey;
    if (opts.clusterCapitalOwnerIds) web.clusterCapitalOwnerIds = new Set(opts.clusterCapitalOwnerIds);
  }
  display.force.push({ ownerId, opts, out: D.shouldForceCultureIconForOwner(ownerId, web) });
}

display.mapLabel = [];
for (let i = 0; i < 900; i++) {
  const city = defined({ name: pick(NAMES.filter((n) => n !== undefined)), ownerId: ri(-1, 4), startCityState: pick([undefined, true, false]) });
  let opts = null;
  if (chance(0.85)) {
    opts = defined({
      playerOwnerId: pick([undefined, 0, 1, 2]),
      isCapital: pick([undefined, true, false]),
      civDisplayName: pick(NAMES),
      isCityStateOwner: pick([undefined, true, false]),
    });
  }
  display.mapLabel.push({ city, opts, out: D.formatCityMapLabel(city, opts === null ? undefined : opts) });
}

display.diplo = [];
for (let i = 0; i < 300; i++) {
  const base = pick(NAMES.filter((n) => n !== undefined));
  const ownerId = ri(-1, 5);
  const opts = genOwnerOpts();
  display.diplo.push({ base, ownerId, opts, out: D.formatOwnerDiploLabel(base, ownerId, toWebOwnerOpts(opts)) });
}

display.resolve = [];
for (let i = 0; i < 900; i++) {
  const input = defined({
    ownerId: ri(-1, 5),
    cached: pick(NAMES),
    cityName: pick(NAMES),
    civDisplayName: pick(NAMES),
    isCityState: chance(0.5),
    isClusterCapital: pick([undefined, true, false]),
  });
  display.resolve.push({ input, out: D.resolveOwnerBaseName({ ...input }) });
}
// przypadki stale (bez losowania): wszystkie kombinacje pustych / technicznych / zwyklych czesci nazwy
for (const cached of [undefined, ' ', 'Rywal 3', 'Hattusa']) {
  for (const cityName of [undefined, ' ', 'AI 4', 'Sparta']) {
    for (const civDisplayName of [undefined, ' ', 'oid-1', 'Grecja']) {
      for (const isCityState of [true, false]) {
        const input = defined({ ownerId: 3, cached, cityName, civDisplayName, isCityState });
        display.resolve.push({ input, out: D.resolveOwnerBaseName({ ...input }) });
      }
    }
  }
}
display.sanitize = [];
for (let i = 0; i < 400; i++) {
  const base = pick(NAMES);
  const civ = pick(NAMES);
  display.sanitize.push({ base: nn(base), civ: nn(civ), out: D.sanitizeOwnerDisplayBase(base, civ) });
}
display.foreign = [];
for (let i = 0; i < 400; i++) {
  const city = pick(NAMES);
  const civ = pick(NAMES);
  display.foreign.push({ city: nn(city), civ: nn(civ), out: D.foreignCapitalMapName(city, civ) });
}
write('display.json', display);

// ======================================================================
// stale i funkcje procentowe (cities.ts)
// ======================================================================
const percent = {
  constants: {
    okolicaFocus: C.DEFAULT_OKOLICA_FOCUS,
    okolicaTryb: C.DEFAULT_OKOLICA_TRYB,
    budowaFocus: C.DEFAULT_BUDOWA_FOCUS,
    budowaTryb: C.DEFAULT_BUDOWA_TRYB,
    ulepszeniaFocus: C.DEFAULT_ULEPSZENIA_FOCUS,
    ulepszeniaTryb: C.DEFAULT_ULEPSZENIA_TRYB,
    ulepszeniaOnlyWorked: C.DEFAULT_ULEPSZENIA_ONLY_WORKED,
    ulepszeniaWolnoWycinacLas: C.DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS,
    ulepszeniaPracaPercent: C.DEFAULT_ULEPSZENIA_PRACA_PERCENT,
    aiMajorUlepszeniaPracaPercent: C.AI_MAJOR_ULEPSZENIA_PRACA_PERCENT,
    maxUlepszeniaPracaAutoPercent: C.MAX_ULEPSZENIA_PRACA_AUTO_PERCENT,
    budowaPriorytetTypow: [...C.DEFAULT_BUDOWA_PRIORYTET_TYPOW],
    budowaTypFocus: [...C.BUDOWA_TYP_FOCUS],
    podzialHandlu: { ...C.DEFAULT_PODZIAL_HANDLU },
    podzialPracy: { ...C.DEFAULT_PODZIAL_PRACY },
    minPodzialPracyBudynki: C.MIN_PODZIAL_PRACY_BUDYNKI_PERCENT,
    maxPodzialPracyBudynki: C.MAX_PODZIAL_PRACY_BUDYNKI_PERCENT,
    aiFixedProcentBudynki: C.AI_FIXED_PROCENT_BUDYNKI,
    maxProcentPuliImperium: C.MAX_PROCENT_PULI_IMPERIUM,
    minProcentPuliZasada3: C.MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA,
    lblPula: C.PODZIAL_PRACY_PULA_LBL,
    lblPulaPelna: C.PODZIAL_PRACY_PULA_LBL_PELNA,
    tipPula: C.PODZIAL_PRACY_PULA_TIP,
    minProcentPuliImperium: C.MIN_PROCENT_PULI_IMPERIUM,
    procentRozwoj: C.DEFAULT_PROCENT_ROZWOJ,
    procentRozwojWyzywienie: C.DEFAULT_PROCENT_ROZWOJ_WYZYWIENIE,
    handelPctStep: C.HANDEL_PCT_STEP,
    maxProcentNauka: C.MAX_PROCENT_NAUKA,
    aiFixedProcentNauka: C.AI_FIXED_PROCENT_NAUKA,
    minCityDistance: C.MIN_CITY_DISTANCE,
    minCityDistanceStartCityState: C.MIN_CITY_DISTANCE_START_CITY_STATE,
    emptyBiblioteka: [...C.EMPTY_BUDOWA_LISTA_BIBLIOTEKA],
    // wejscia z innych modulow weba (kopie w cities-params.json)
    defaultPoziomRacji: PG.DEFAULT_POZIOM_RACJI,
    wyzywienieMax: PG.WYZYWIENIE_MAX,
    freshWealth: WE.freshWealthState(),
  },
};

const RAW_NUMS = [undefined, null, 'x', '50', true, NaN, Infinity, -Infinity, ...PCT_NUMS];
const num01 = (v) => (typeof v === 'number' ? v : undefined);
percent.clampUlepszenia = RAW_NUMS.map((v) => ({ n: nn(v), out: C.clampUlepszeniaPracaPercent(v) }));
percent.clampPodzial = RAW_NUMS.map((v) => ({ n: nn(v), out: C.clampPodzialPracyBudynkiPercent(v) }));
percent.pulaZBudynkow = RAW_NUMS.map((v) => ({ n: nn(v), out: C.procentPuliImperiumZBudynkow(v) }));
percent.podzialZPuli = RAW_NUMS.map((v) => ({ n: nn(v), out: C.podzialPracyZProcentuPuli(v) }));
percent.snap = [...PCT_NUMS, 4, 5, 14.9, 15, 25, 35, 95, 104, 105, -4, -5, -6, 0.04, -0.04].map((v) => ({ n: v, out: C.snapHandelPct(v) }));
percent.migratePerTurn = [1, 2, 3, 4, 0, -1, 2.5].map((v) => ({ n: v, out: C.migrateUlepszeniaPerTurnToPercent(v) }));
percent.resolveRaw = [];
for (const nv of [undefined, null, 'x', 0, 33, 50, 100, 150, -5, NaN, Infinity, 49.5, 75.5]) {
  for (const lv of [undefined, null, 1, 2, 3, 4, 0, '2', NaN, 1.5, -1, true]) {
    percent.resolveRaw.push({ newVal: nn(nv), legacy: nn(lv), out: C.resolveUlepszeniaPracaPercentFromRaw(nv, lv) });
  }
}

// polityka i cap AI
percent.policy = {
  fresh: C.freshUlepszeniaEmpirePolicy(),
  forOwner: [],
  cap: [],
  capForOwner: [],
};
for (const ai of [[], [1], [1, 2, 3], [0], [0, 1]]) {
  for (const ownerId of [-1, 0, 1, 2, 3, 4]) {
    const pred = (id) => ai.includes(id);
    percent.policy.forOwner.push({ ai, ownerId, out: C.freshUlepszeniaEmpirePolicyForOwner(ownerId, pred) });
  }
}
for (const pool of [0, 1, 10, 99, 100, 101, 333, 1000.5, -10, NaN, Infinity, 1e9, -0]) {
  for (const p of [0, 1, 33, 50, 99.5, 100, 101, 250, -5, NaN, Infinity, -Infinity]) {
    percent.policy.cap.push({ pool, percent: p, out: C.computeAiImprovementBudgetCap(pool, p) });
  }
}
for (const ai of [[], [1, 2], [0, 1, 2]]) {
  for (const ownerId of [-1, 0, 1, 2, 5]) {
    for (const pool of [0, 10, 77, 1000.9, NaN]) {
      const pred = (id) => ai.includes(id);
      percent.policy.capForOwner.push({ ai, ownerId, pool, out: C.computeAiImprovementBudgetCapForOwner(ownerId, pool, pred) });
    }
  }
}

function genUlepszCity() {
  const c = {};
  if (chance(0.7)) c.ulepszeniaOverride = pick([true, false]);
  if (chance(0.5)) c.ulepszeniaFocus = pick(ULEPSZ_FOCUS);
  if (chance(0.5)) c.ulepszeniaTryb = pick(TRYB2);
  if (chance(0.5)) c.ulepszeniaOnlyWorked = pick([true, false]);
  if (chance(0.5)) c.ulepszeniaWolnoWycinacLas = pick([true, false]);
  if (chance(0.6)) c.ulepszeniaPracaPercent = pick(PCT_NUMS);
  return c;
}
percent.effective = [];
for (let i = 0; i < 500; i++) {
  const city = genUlepszCity();
  const empire = {
    focus: pick(ULEPSZ_FOCUS),
    tryb: pick(TRYB2),
    onlyWorked: pick([true, false]),
    pracaAutoPercent: pick(PCT_NUMS),
  };
  const w = pick([undefined, true, false]);
  if (w !== undefined) empire.wolnoWycinacLas = w;
  percent.effective.push({ city, empire, out: C.resolveEffectiveUlepszenia(city, empire) });
}

// budowa: priorytety
percent.budowa = { isTyp: BUDOWA_FOCUS.map((f) => ({ f, out: C.isBudowaTypFocus(f) })), sanitize: [], isAuto: [] };
percent.budowa.sanitize.push({ list: null, out: C.sanitizeBudowaPriorytetTypow(null) });
percent.budowa.sanitize.push({ list: null, out: C.sanitizeBudowaPriorytetTypow(undefined), undef: true });
for (let i = 0; i < 120; i++) {
  const list = Array.from({ length: ri(0, 7) }, () => pick(BUDOWA_FOCUS));
  percent.budowa.sanitize.push({ list, out: C.sanitizeBudowaPriorytetTypow(list) });
}
for (const t of [undefined, ...BUDOWA_TRYB]) {
  percent.budowa.isAuto.push({ t: nn(t), out: C.isAutoBudowaTryb(t) });
}

// podzial Handlu
const SPLITS = [];
for (let p = 0; p <= 100; p += 10) for (let n = 0; n <= 100 - p; n += 10) SPLITS.push({ procentPieniadz: p, procentNauka: n, procentLuksus: 100 - p - n });
const ODD = [
  { procentPieniadz: 33, procentNauka: 33, procentLuksus: 34 }, { procentPieniadz: 5, procentNauka: 95, procentLuksus: 0 },
  { procentPieniadz: 0, procentNauka: 0, procentLuksus: 0 }, { procentPieniadz: 100, procentNauka: 100, procentLuksus: 100 },
  { procentPieniadz: NaN, procentNauka: 50, procentLuksus: 50 }, { procentPieniadz: 50, procentNauka: NaN, procentLuksus: 50 },
  { procentPieniadz: 50, procentNauka: 50, procentLuksus: NaN }, { procentPieniadz: Infinity, procentNauka: 0, procentLuksus: 0 },
  { procentPieniadz: -20, procentNauka: 70, procentLuksus: 50 }, { procentPieniadz: 14, procentNauka: 26, procentLuksus: 60 },
  { procentPieniadz: 15, procentNauka: 25, procentLuksus: 35 }, { procentPieniadz: 0, procentNauka: 80, procentLuksus: 20 },
  { procentPieniadz: 20, procentNauka: 80, procentLuksus: 0 }, { procentPieniadz: 20, procentNauka: 70, procentLuksus: 10 },
];
for (let i = 0; i < 150; i++) ODD.push({ procentPieniadz: ri(-20, 130) / pick([1, 3, 7]), procentNauka: ri(-20, 130) / pick([1, 3, 7]), procentLuksus: ri(-20, 130) / pick([1, 3, 7]) });
percent.normalize = [...SPLITS, ...ODD].map((s) => ({ split: s, out: C.normalizePodzialHandlu({ ...s }) }));
percent.adjust = [];
const KEYS3 = ['procentPieniadz', 'procentNauka', 'procentLuksus'];
const NEWV = [0, 10, 20, 30, 40, 50, 60, 70, 100, 5, 15, 33, 61, 95, 101, -10, NaN, Infinity, -Infinity, 14.9, 0.4, -0];
for (const split of [...SPLITS, ...ODD]) {
  for (const key of KEYS3) {
    const vals = chance(0.35) ? NEWV : [pick(NEWV), pick(NEWV), pick(NEWV)];
    for (const nv of vals) {
      percent.adjust.push({ split, key, newVal: nv, out: C.adjustHandelSplit({ ...split }, key, nv) });
    }
  }
}
write('percent.json', percent);

// ======================================================================
// biblioteka list budowy (jedna sekwencja: licznik id jest stanem modulu weba)
// ======================================================================
let nowSeq = [];
let nowIdx = 0;
const realNow = Date.now;
Date.now = () => {
  if (nowIdx >= nowSeq.length) throw new Error('Date.now: brak zaplanowanej wartosci');
  return nowSeq[nowIdx++];
};
function withNow(values, fn) {
  nowSeq = values;
  nowIdx = 0;
  const r = fn();
  if (nowIdx !== values.length) throw new Error(`Date.now: wolane ${nowIdx} razy, oczekiwano ${values.length}`);
  return r;
}
const NOWS = [1700000000000, 1700000000001, 0, 1, 1.5, 253402300799999, 1e21];
const lists = { sequence: [] };
const szab = (id, nazwa, budynki) => ({ id, nazwa, budynki });
const BUDS = [[], ['dom'], ['dom', 'dom', '', 'mur'], ['a', 1, null, 'b'], ['x']];
function genMeta() {
  const kind = ri(0, 12);
  switch (kind) {
    case 0: return undefined;
    case 1: return null;
    case 2: return {};
    case 3: return { budowaListaBiblioteka: [szab('a', 'Lista 1', ['x', 'y']), szab('b', ' lista 2 ', [])] };
    case 4: return { budowaListaBiblioteka: [] };
    case 5: return { budowaListaBiblioteka: [szab('a', 'n', ['x']), { id: 'b', nazwa: 'n' }] };
    case 6: return { budowaListaSzablony: { A: pick(BUDS), B: pick(BUDS), C: pick(BUDS) } };
    case 7: return { budowaListaSzablony: { B: ['q'], Z: ['z'] } };
    case 8: return { budowaListaSzablony: { Z: ['q'] } };
    case 9: return { budowaListaSzablony: [szab('s1', 'Moja', ['k']), szab('s2', 'Druga', [])] };
    case 10: return { budowaListaSzablony: [] };
    case 11: return { budowaListaBiblioteka: [szab('a', 'ok', ['x'])], budowaListaSzablony: { A: ['zz'] } };
    default: return pick([5, 'str', [], [1], { budowaListaBiblioteka: 5 }, { budowaListaBiblioteka: [null] }, { budowaListaBiblioteka: [[]] }, { budowaListaSzablony: 'x' }, { budowaListaSzablony: { A: 'notarray', B: {} } }]);
  }
}
for (let i = 0; i < 220; i++) {
  const meta = genMeta();
  // ile razy web zawola Date.now: tyle ile niepustych slotow legacy (sprawdzimy po fakcie)
  let need = 0;
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const rawNew = meta.budowaListaBiblioteka;
    const okNew = Array.isArray(rawNew) && rawNew.every((x) => x && typeof x === 'object' && typeof x.id === 'string' && typeof x.nazwa === 'string' && Array.isArray(x.budynki));
    const rl = meta.budowaListaSzablony;
    if (!okNew && rl && typeof rl === 'object' && !Array.isArray(rl) && ('A' in rl || 'B' in rl || 'C' in rl)) {
      for (const s of ['A', 'B', 'C']) if (Array.isArray(rl[s]) && rl[s].length > 0) need += 1;
    }
  }
  const nows = Array.from({ length: need }, () => pick(NOWS));
  const metaIn = clone(meta);
  const out = withNow(nows, () => C.loadBudowaListaBiblioteka(meta));
  lists.sequence.push({ kind: 'load', meta: nn(metaIn), nows, out });
}
for (let i = 0; i < 12; i++) {
  const now = pick(NOWS);
  const out = withNow([now], () => C.newBudowaListaSzablonId());
  lists.sequence.push({ kind: 'newId', nows: [now], out });
}
// przypadki stale (bez losowania): pusta nowa biblioteka ma pierwszenstwo przed legacy; stale Date.now
for (const meta of [
  { budowaListaBiblioteka: [], budowaListaSzablony: { A: ['zz'] } },
  { budowaListaBiblioteka: [], budowaListaSzablony: [szab('s1', 'Moja', ['k'])] },
]) {
  const metaIn = clone(meta);
  const out = withNow([], () => C.loadBudowaListaBiblioteka(meta));
  lists.sequence.push({ kind: 'load', meta: metaIn, nows: [], out });
}
lists.defaultNazwa = [];
const NAZWY = ['Lista 1', 'lista 2', ' Lista 3 ', 'LISTA 4', 'Lista 5', 'x', 'Lista 01', ' Lista 6 ', 'ŁÓDŹ', 'ΑΣ'];
for (let i = 0; i < 80; i++) {
  const n = ri(0, 8);
  const bib = Array.from({ length: n }, () => szab('i', chance(0.7) ? pick(NAZWY) : `Lista ${ri(1, 9)}`, []));
  lists.defaultNazwa.push({ bib, out: C.defaultBudowaListaNazwa(bib) });
}
// biblioteka 1..998 + obcy wpis: web zwraca "Lista 999" (granica petli i < 1000), nie zapas
{
  const bib = Array.from({ length: 998 }, (_, i) => szab('i', `Lista ${i + 1}`, []));
  bib.push(szab('i', 'x', []));
  lists.defaultNazwa.push({ fullRange: 998, extra: ['x'], bibCount: bib.length, out: C.defaultBudowaListaNazwa(bib) });
}
// pelna biblioteka 1..999 -> zapas
{
  const bib = Array.from({ length: 999 }, (_, i) => szab('i', `Lista ${i + 1}`, []));
  lists.defaultNazwa.push({ fullRange: 999, bibCount: bib.length, out: C.defaultBudowaListaNazwa(bib) });
}
// przypadki stale (bez losowania): toLowerCase() Unicode (I z kropka, sigma koncowa), niełamliwa spacja, BOM, NEL
for (const names of [['LİSTA 1'], ['LISTA 1', 'lİsta 2'], ['ΛΙΣΤΑ 1'], ['Lista 1', 'Lista 2', 'LİSTA 3'], ['\u00a0LISTA 1\u00a0'], ['\ufeffLista 1'], ['\u0085Lista 1'], ['LıSTA 1', 'lista 1 ']]) {
  const bib = names.map((n) => szab('i', n, []));
  lists.defaultNazwa.push({ bib, out: C.defaultBudowaListaNazwa(bib) });
}
lists.dedupe = [];
for (let i = 0; i < 80; i++) {
  const arr = Array.from({ length: ri(0, 8) }, () => pick(['a', 'b', 'c', '', 'a', 'dom', 'mur']));
  lists.dedupe.push({ arr, out: C.dedupeBudowaLista(arr) });
}
Date.now = realNow;
write('lists.json', lists);

// ======================================================================
// empire-city-defaults.ts
// ======================================================================
function genEmpireCity(i, ownerPool) {
  const c = { id: `c${i}`, ownerId: pick(ownerPool), q: ri(-3, 3), r: ri(-3, 3), name: `N${i}`, population: ri(1, 6) };
  if (chance(0.6)) c.podzialPracy = { procentBudynki: pick(PCT_NUMS) };
  if (chance(0.4)) c.podzialPracyOverride = pick([true, false]);
  if (chance(0.7)) c.okolicaFocus = pick(OKOLICA);
  if (chance(0.4)) c.okolicaFocusOverride = pick([true, false]);
  if (chance(0.7)) c.budowaFocus = pick(BUDOWA_FOCUS);
  if (chance(0.7)) c.budowaTryb = pick(BUDOWA_TRYB);
  if (chance(0.4)) c.budowaFocusOverride = pick([true, false]);
  if (chance(0.7)) c.poziomRacji = pick([0, 0.5, 2, 4, 4, 6, 3.5, NaN]);
  if (chance(0.4)) c.poziomRacjiOverride = pick([true, false]);
  if (chance(0.3)) c.autoWyzywienie = pick([true, false]);
  return c;
}
const OWNERS = [-99, -1, 0, 1, 2, 3, 7];
function genCities() {
  const n = ri(0, 7);
  return Array.from({ length: n }, (_, i) => genEmpireCity(i, OWNERS));
}
const empire = {
  podzial: { equal: [], resolve: [], local: [], migrate: [], fresh: E.freshOwnerDefaultPodzialPracy() },
  okolica: { resolve: [], broadcast: [], migrate: [], fresh: E.freshOwnerDefaultOkolicaFocus() },
  budowa: { equal: [], resolve: [], broadcast: [], migrate: [], forOwner: [], upgrade: [], fresh: E.freshOwnerDefaultBudowaProfil(), aiTryb: E.AI_DEFAULT_BUDOWA_TRYB },
  racji: { resolve: [], broadcast: [], broadcastAuto: [], migrate: [], fresh: E.freshOwnerDefaultPoziomRacji() },
};
const podzialIn = () => (chance(0.2) ? undefined : { procentBudynki: pick(PCT_NUMS) });
const mapEntries = (m) => [...m.entries()];

// 1. Podzial Pracy
for (let i = 0; i < 80; i++) {
  const a = { procentBudynki: pick(PCT_NUMS) };
  const b = { procentBudynki: pick(PCT_NUMS) };
  empire.podzial.equal.push({ a, b, out: E.podzialPracyEqual(a, b) });
}
for (let i = 0; i < 400; i++) {
  const city = defined({ ownerId: ri(0, 2), podzialPracy: chance(0.6) ? { procentBudynki: pick(PCT_NUMS) } : undefined, podzialPracyOverride: pick([undefined, true, false]) });
  const od = podzialIn();
  const fb = podzialIn();
  empire.podzial.resolve.push({ city, ownerDefault: nn(od), fallback: nn(fb), out: E.resolveCityPodzialPracy(city, od, fb) });
}
for (let i = 0; i < 200; i++) {
  const raw = pick([undefined, null, ...PCT_NUMS, 'x']);
  const od = podzialIn();
  empire.podzial.local.push({ raw: nn(raw), ownerDefault: nn(od), out: E.applyPodzialPracyLocalChange(raw, od) });
}
function runMigratePodzial() {
  const cities = genCities();
  const defaultsIn = chance(0.3) ? [] : OWNERS.filter(() => chance(0.4)).map((o) => [o, { procentBudynki: pick(PCT_NUMS) }]);
  const saved = pick([undefined, [], defaultsIn, defaultsIn]);
  const ownerDefaults = new Map(chance(0.3) ? [[pick(OWNERS), { procentBudynki: pick(PCT_NUMS) }]] : []);
  const before = { cities: cities.map(cityIn), ownerDefaults: mapEntries(ownerDefaults).map(([k, v]) => [k, { ...v }]), saved: nn(saved) };
  E.migratePodzialPracyOnLoad(cities, ownerDefaults, saved);
  return { ...before, citiesOut: cities.map(cityOut), ownerDefaultsOut: mapEntries(ownerDefaults) };
}
for (let i = 0; i < 150; i++) empire.podzial.migrate.push(runMigratePodzial());

// 2. okolica
for (let i = 0; i < 300; i++) {
  const city = defined({ okolicaFocus: pick([undefined, ...OKOLICA]), okolicaFocusOverride: pick([undefined, true, false]) });
  const od = pick([undefined, ...OKOLICA]);
  empire.okolica.resolve.push({ city, ownerDefault: nn(od), out: E.resolveCityOkolicaFocus(city, od) });
}
for (let i = 0; i < 200; i++) {
  const cities = genCities();
  const ownerId = pick(OWNERS);
  const focus = pick(OKOLICA);
  const before = cities.map(cityIn);
  E.broadcastOkolicaFocusToOwnerCities(cities, ownerId, focus);
  empire.okolica.broadcast.push({ cities: before, ownerId, focus, out: cities.map(cityOut) });
}
function runMigrateOkolica() {
  const cities = genCities();
  const defaultsIn = OWNERS.filter(() => chance(0.4)).map((o) => [o, pick(OKOLICA)]);
  const saved = pick([undefined, [], defaultsIn, defaultsIn]);
  const ownerDefaults = new Map(chance(0.3) ? [[pick(OWNERS), pick(OKOLICA)]] : []);
  const before = { cities: cities.map(cityIn), ownerDefaults: mapEntries(ownerDefaults), saved: nn(saved) };
  E.migrateOkolicaFocusOnLoad(cities, ownerDefaults, saved);
  return { ...before, citiesOut: cities.map(cityOut), ownerDefaultsOut: mapEntries(ownerDefaults) };
}
for (let i = 0; i < 150; i++) empire.okolica.migrate.push(runMigrateOkolica());

// 3. budowa
const profilIn = () => ({ budowaFocus: pick(BUDOWA_FOCUS), budowaTryb: pick(BUDOWA_TRYB) });
for (let i = 0; i < 100; i++) {
  const a = profilIn();
  const b = chance(0.3) ? { ...a } : profilIn();
  empire.budowa.equal.push({ a, b, out: E.budowaProfilEqual(a, b) });
}
for (let i = 0; i < 400; i++) {
  const city = defined({ budowaFocus: pick([undefined, ...BUDOWA_FOCUS]), budowaTryb: pick([undefined, ...BUDOWA_TRYB]), budowaFocusOverride: pick([undefined, true, false]) });
  const od = chance(0.5) ? profilIn() : undefined;
  empire.budowa.resolve.push({ city, ownerDefault: nn(od), out: E.resolveCityBudowaProfil(city, od) });
}
for (let i = 0; i < 200; i++) {
  const cities = genCities();
  const ownerId = pick(OWNERS);
  const profil = profilIn();
  const before = cities.map(cityIn);
  E.broadcastBudowaProfilToOwnerCities(cities, ownerId, profil);
  empire.budowa.broadcast.push({ cities: before, ownerId, profil, out: cities.map(cityOut) });
}
function runMigrateBudowa() {
  const cities = genCities();
  const defaultsIn = OWNERS.filter(() => chance(0.4)).map((o) => [o, profilIn()]);
  const saved = pick([undefined, [], defaultsIn, defaultsIn]);
  const ownerDefaults = new Map(chance(0.3) ? [[pick(OWNERS), profilIn()]] : []);
  const before = { cities: cities.map(cityIn), ownerDefaults: mapEntries(ownerDefaults).map(([k, v]) => [k, { ...v }]), saved: nn(saved) };
  E.migrateBudowaProfilOnLoad(cities, ownerDefaults, saved);
  return { ...before, citiesOut: cities.map(cityOut), ownerDefaultsOut: mapEntries(ownerDefaults) };
}
for (let i = 0; i < 150; i++) empire.budowa.migrate.push(runMigrateBudowa());
for (const barb of [[], [-1], [-99], [-1, -99], [5], [0], [1, 2]]) {
  for (const ownerId of [-99, -1, 0, 1, 2, 5]) {
    const pred = (id) => barb.includes(id);
    empire.budowa.forOwner.push({ barb, ownerId, out: E.freshOwnerDefaultBudowaProfilForOwner(ownerId, pred) });
  }
}
function runUpgrade() {
  const cities = genCities();
  const defaultsIn = OWNERS.filter(() => chance(0.5)).map((o) => [o, { budowaFocus: pick(BUDOWA_FOCUS), budowaTryb: pick(['reczny', 'reczny', 'priorytet', 'lista', 'zrownowazone']) }]);
  const ownerDefaults = new Map(defaultsIn);
  const barb = pick([[], [-1], [-99], [-1, -99], [3], [1]]);
  const before = { cities: cities.map(cityIn), ownerDefaults: mapEntries(ownerDefaults).map(([k, v]) => [k, { ...v }]), barb };
  const upgraded = E.upgradeBudowaProfilAutoDefaultsOnLoad(cities, ownerDefaults, (id) => barb.includes(id));
  return { ...before, upgraded, citiesOut: cities.map(cityOut), ownerDefaultsOut: mapEntries(ownerDefaults) };
}
for (let i = 0; i < 200; i++) empire.budowa.upgrade.push(runUpgrade());

// 4. racje
for (let i = 0; i < 300; i++) {
  const city = defined({ poziomRacji: pick([undefined, 0, 2, 4, 6, 3.5, NaN]), poziomRacjiOverride: pick([undefined, true, false]) });
  const od = pick([undefined, 0, 2, 4, 6, 3.5]);
  empire.racji.resolve.push({ city, ownerDefault: nn(od), out: E.resolveCityPoziomRacji(city, od) });
}
for (let i = 0; i < 200; i++) {
  const cities = genCities();
  const ownerId = pick(OWNERS);
  const poziom = pick([0, 2, 4, 6, 3.5, NaN]);
  const before = cities.map(cityIn);
  E.broadcastPoziomRacjiToOwnerCities(cities, ownerId, poziom);
  empire.racji.broadcast.push({ cities: before, ownerId, poziom, out: cities.map(cityOut) });
}
for (let i = 0; i < 200; i++) {
  const cities = genCities();
  const ownerId = pick(OWNERS);
  const before = cities.map(cityIn);
  E.broadcastAutoWyzywienieToOwnerCities(cities, ownerId);
  empire.racji.broadcastAuto.push({ cities: before, ownerId, out: cities.map(cityOut) });
}
function runMigrateRacji() {
  const cities = genCities();
  const defaultsIn = OWNERS.filter(() => chance(0.4)).map((o) => [o, pick([0, 2, 4, 6, 3.5])]);
  const saved = pick([undefined, [], defaultsIn, defaultsIn]);
  const ownerDefaults = new Map(chance(0.3) ? [[pick(OWNERS), pick([0, 2, 4, 6])]] : []);
  const before = { cities: cities.map(cityIn), ownerDefaults: mapEntries(ownerDefaults), saved: nn(saved) };
  E.migratePoziomRacjiOnLoad(cities, ownerDefaults, saved);
  return { ...before, citiesOut: cities.map(cityOut), ownerDefaultsOut: mapEntries(ownerDefaults) };
}
for (let i = 0; i < 150; i++) empire.racji.migrate.push(runMigrateRacji());
write('empire.json', empire);

// ======================================================================
// ensureCityPodzialDefaults / ensureCitySaveDefaults / zakladanie miasta
// ======================================================================
const FOOD = [
  undefined, 0, 5, -3, 2.5, NaN, Infinity, -Infinity, -0, { aktualny: 7 }, { aktualny: -2 }, { aktualny: 'x' }, {}, '12', null, true, [1], { aktualny: NaN },
  { aktualny: Infinity }, { aktualny: -0 },
];
function genSaveCity(i) {
  const c = { id: `s${i}`, ownerId: ri(0, 3), q: ri(-3, 3), r: ri(-3, 3), name: `M${i}`, population: ri(1, 8) };
  if (chance(0.5)) c.podzialHandluOverride = pick([true, false]);
  if (chance(0.5)) c.podzialHandlu = pick([...ODD, ...SPLITS.slice(0, 20)]);
  if (chance(0.7)) c.podzialPracy = { procentBudynki: pick(PCT_NUMS) };
  if (chance(0.3)) c.wealthState = { poziom: ri(1, 5), pula: ri(0, 9) };
  if (chance(0.6)) c.okolicaFocus = pick(OKOLICA);
  if (chance(0.5)) c.okolicaTryb = pick(TRYB2);
  if (chance(0.6)) c.budowaFocus = pick(BUDOWA_FOCUS);
  if (chance(0.8)) c.budowaTryb = pick([...BUDOWA_TRYB, 'auto', 'auto']);
  if (chance(0.7)) c.budowaPriorytetTypow = pick([[], ['zrownowazone'], ['zrownowazone', 'zrownowazone'], ['wzrost', 'zrownowazone'], ['wojsko'], ['kultura', 'prawo', 'produkcja'], ['zrownowazone', 'wzrost', 'zrownowazone'], ['prawo', 'wzrost']]);
  if (chance(0.5)) c.budowaLista = pick([[], ['dom'], ['a', 'b']]);
  if (chance(0.7)) c.ulepszeniaOverride = pick([true, true, false]);
  if (chance(0.4)) c.ulepszeniaFocus = pick(ULEPSZ_FOCUS);
  if (chance(0.4)) c.ulepszeniaTryb = pick(TRYB2);
  if (chance(0.4)) c.ulepszeniaOnlyWorked = pick([true, false]);
  if (chance(0.4)) c.ulepszeniaWolnoWycinacLas = pick([true, false]);
  if (chance(0.5)) c.ulepszeniaPracaPercent = pick([...PCT_NUMS, 'str']);
  if (chance(0.5)) c.ulepszeniaPerTurn = pick([1, 2, 3, 4, 0, '2', NaN, 1.5]);
  const f = pick(FOOD);
  if (f !== undefined) c.magazynZywnosci = f;
  if (chance(0.3)) c.surowce = { drewno: ri(0, 5) };
  if (chance(0.3)) c.postepBudynkowUsuniete = { mur: ri(1, 9) };
  if (chance(0.5)) c.poziomRacji = pick([undefined, 1, 2, 3, 4, 6, 0.5, 7, -1, 2.5, NaN]);
  if (chance(0.4)) c.procentRozwoj = pick([0, 50, 67, 100, 150]);
  if (chance(0.3)) c.rationMigratedV114 = pick([true, false]);
  if (chance(0.3)) c.wzrostUlamkowy = pick([0, 0.25]);
  if (chance(0.3)) c.turyBezDoplaty = pick([0, 2]);
  return c;
}
const RATION_KEYS = ['poziomRacji', 'rationMigratedV114', 'wzrostUlamkowy', 'turyBezDoplaty'];
const cities = { podzial: [], save: [], found: {} };
for (let i = 0; i < 400; i++) {
  const c = genSaveCity(i);
  const inp = cityIn(c);
  C.ensureCityPodzialDefaults(c);
  cities.podzial.push({ city: inp, out: cityOut(c) });
}
for (let i = 0; i < 800; i++) {
  const c = genSaveCity(i);
  const inp = cityIn(c);
  const foodBuf = EU.readCityFoodBuffer(c.magazynZywnosci);
  // delta wstrzyknietego ensureCityRationDefaults: wynik PRAWDZIWEJ funkcji na kopii wejscia
  const probe = structuredClone(c);
  PG.ensureCityRationDefaults(probe);
  const ration = {};
  for (const k of RATION_KEYS) ration[k] = nn(probe[k]);
  C.ensureCitySaveDefaults(c);
  cities.save.push({ city: inp, foodBuf, ration, out: cityOut(c) });
}

// --- zakladanie ---
const TER = Object.values(TH.TerenBazowy);
function genMap() {
  const hexes = {};
  for (let q = -6; q <= 6; q++) {
    for (let r = -6; r <= 6; r++) {
      if (chance(0.05)) continue;
      hexes[`${q},${r}`] = { terenBazowy: chance(0.6) ? pick(['laka', 'rownina', 'wzgorza']) : pick(TER) };
    }
  }
  return hexes;
}
const FMAPS = Array.from({ length: 4 }, genMap);
function genFoundCities(n) {
  return Array.from({ length: n }, (_, i) => defined({
    id: `city${i}`, ownerId: ri(0, 3), q: ri(-6, 6), r: ri(-6, 6),
    startCityState: pick([undefined, undefined, true, false]), foundedByOwner: pick([undefined, undefined, true, false]),
  }));
}
cities.found.can = [];
for (let i = 0; i < 1500; i++) {
  const mapIdx = ri(0, FMAPS.length - 1);
  const map = { hexes: FMAPS[mapIdx] };
  const cs = genFoundCities(ri(0, 7));
  const q = pick([ri(-7, 7), ri(-7, 7), 1.5, NaN, -0, 0, Infinity]);
  const r = pick([ri(-7, 7), ri(-7, 7), 2.5, -0, 0]);
  let opts = null;
  let territory = null;
  if (chance(0.85)) {
    opts = {};
    if (chance(0.3)) {
      territory = Array.from({ length: ri(0, 14) }, () => `${ri(-7, 7)},${ri(-7, 7)}`);
      opts.territory = territory;
    }
    if (chance(0.4)) opts.foundingCityState = pick([true, false]);
    if (chance(0.3)) opts.clusterStartSlot = pick([true, false]);
    if (chance(0.5)) opts.ownerId = ri(0, 3);
    if (chance(0.5)) opts.ownerEra = pick([0, 1, 2, 3, 5, 0.5, 2.5, -1, NaN, Infinity]);
    if (chance(0.6)) opts.gameConfig = chance(0.7) ? { cityLimitBase: pick([1, 2, 3, 5, 10, 0, -1, NaN]) } : {};
  }
  let territoryCalls = [];
  let webOpts;
  if (opts !== null) {
    webOpts = {};
    if (opts.territory) {
      const allowed = new Set(opts.territory);
      webOpts.withinTerritory = (qq, rr) => { territoryCalls.push([qq, rr]); return allowed.has(`${qq},${rr}`); };
    }
    for (const k of ['foundingCityState', 'clusterStartSlot', 'ownerId', 'ownerEra', 'gameConfig']) if (opts[k] !== undefined) webOpts[k] = opts[k];
  }
  const out = C.canFoundCity(q, r, cs.map((c) => ({ ...c })), map, webOpts);
  cities.found.can.push({ mapIdx, q, r, cities: cs, opts, territoryCalls, out });
}
// przypadki stale (bez losowania): limit miast per epoka na granicy (liczba miast = limit-1 / limit / limit+1),
// z miastami nie zalozonymi przez wlasciciela (foundedByOwner=false) i bez nich; mapa w calosci ladowa
{
  const flat = {};
  for (let q = -6; q <= 6; q++) for (let r = -6; r <= 6; r++) flat[`${q},${r}`] = { terenBazowy: 'laka' };
  FMAPS.push(flat);
  const mapIdx = FMAPS.length - 1;
  const place = (count, notFounded) => Array.from({ length: count }, (_, i) => defined({
    id: `city${i}`, ownerId: 1, q: -6 + Math.floor(i / 7), r: -6 + (i % 7), foundedByOwner: i < notFounded ? false : undefined,
  }));
  for (const base of [1, 2, 3, undefined]) {
    for (const era of [1, 2, 3]) {
      const limit = (base ?? 10) + (era - 1) * 5;
      for (const count of [limit - 1, limit, limit + 1]) {
        for (const notFounded of [0, 1]) {
          const cs = place(count, notFounded);
          const opts = { ownerId: 1, ownerEra: era, gameConfig: base === undefined ? {} : { cityLimitBase: base } };
          const out = C.canFoundCity(6, -3, cs.map((c) => ({ ...c })), { hexes: flat }, { ...opts });
          cities.found.can.push({ mapIdx, q: 6, r: -3, cities: cs, opts, territoryCalls: [], out });
        }
      }
    }
  }
  // ownerId i gameConfig bez ownerEra: limit nie obowiazuje
  const cs = place(12, 0);
  const opts = { ownerId: 1, gameConfig: { cityLimitBase: 1 } };
  cities.found.can.push({ mapIdx, q: 6, r: -3, cities: cs, opts, territoryCalls: [], out: C.canFoundCity(6, -3, cs.map((c) => ({ ...c })), { hexes: flat }, { ...opts }) });
}
cities.found.maps = FMAPS.map((hexes) => Object.entries(hexes).map(([k, v]) => [k, v.terenBazowy]));

const settlerOut = (c) => (c === null ? null : cityOut(c));
cities.found.foundCity = [];
cities.found.foundCityAt = [];
cities.found.fromVillage = [];
for (let i = 0; i < 450; i++) {
  const mapIdx = ri(0, FMAPS.length - 1);
  const map = { hexes: FMAPS[mapIdx] };
  const cs = genFoundCities(ri(0, 6));
  const q = pick([ri(-7, 7), ri(-7, 7), ri(-7, 7), 1.5]);
  const r = ri(-7, 7);
  const territory = chance(0.3) ? Array.from({ length: ri(0, 20) }, () => `${ri(-7, 7)},${ri(-7, 7)}`) : null;
  const calls = [];
  const wt = territory ? (qq, rr) => { calls.push([qq, rr]); return new Set(territory).has(`${qq},${rr}`); } : undefined;
  const ownerId = ri(0, 4);
  const name = pick(['Alfa', 'Beta', 'Ž', '']);
  const fc = C.foundCity({ ownerId, q, r }, cs.map((c) => ({ ...c })), map, name, wt ? { withinTerritory: wt } : undefined);
  cities.found.foundCity.push({ mapIdx, settler: { ownerId, q, r }, cities: cs, name, territory, calls: calls.length, territoryCalls: [...calls], out: settlerOut(fc) });

  const cs2 = genFoundCities(ri(0, 6));
  const fcs = chance(0.4);
  const slot = chance(0.3);
  const fa = C.foundCityAt(q, r, ownerId, cs2.map((c) => ({ ...c })), map, name, fcs, slot);
  cities.found.foundCityAt.push({ mapIdx, q, r, ownerId, cities: cs2, name, foundingCityState: fcs, clusterStartSlot: slot, out: settlerOut(fa) });

  const cs3 = genFoundCities(ri(0, 14));
  const calls3 = [];
  const wt3 = territory ? (qq, rr) => { calls3.push([qq, rr]); return new Set(territory).has(`${qq},${rr}`); } : undefined;
  const v = C.foundCityFromVillage(q, r, cs3.map((c) => ({ ...c })), map, wt3 ? { withinTerritory: wt3 } : undefined);
  const vOut = v.ok === true ? (({ ok, ...rest }) => ({ ok: true, city: cityOut(rest) }))(v) : { ok: false, reason: v.reason };
  cities.found.fromVillage.push({ mapIdx, q, r, cities: cs3, territory, territoryCalls: [...calls3], out: vOut });
}
cities.found.cityName = [0, 1, 5, 11, 12, 13, 100, -1, 1.5, 11.5, 12.5, -0, NaN, Infinity, -Infinity, 0.5, 2, 2.0].map((i) => ({ index: i, out: nn(C.cityName(i)) }));
cities.found.counts = [undefined, true, false].map((f) => ({ f: nn(f), out: C.countsTowardCityFoundingLimit(f === undefined ? {} : { foundedByOwner: f }) }));
cities.found.independent = [undefined, true, false].map((f) => ({ f: nn(f), out: C.wasIndependentCityStateBeforeCapture(f === undefined ? {} : { startCityState: f }) }));
write('cities.json', cities);
console.log('OK', {
  display: Object.keys(display).length, percent: Object.keys(percent).length, lists: lists.sequence.length,
  empire: Object.keys(empire).length, save: cities.save.length, can: cities.found.can.length,
});
