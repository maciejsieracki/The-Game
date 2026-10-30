// Generator wektorow P6.8E-P1 (economy-upkeep.ts, sekcje A/A2 + parametry B): URUCHAMIA kod TS weba (pin 91dc998a).
// Uzycie (z katalogu runu; korzen = git archive 91dc998a gra/src gra/data rozpakowany w katalogu tymczasowym):
//   node --experimental-strip-types --import ./gen-loader-register.mjs ./gen-p6-8e-vectors.mjs <KORZEN> <KATALOG_WYJSCIA>
// Zapisuje economy_upkeep_p1.json. Wartosci sa OBSERWOWANE z uruchomionego kodu (nie z literalow oczekiwan).
// Kodowanie liczb: calkowita skonczona = JSON number; niecalkowita = {"$f": String(x)};
// NaN/Infinity/-Infinity/-0 = {"$n": "..."}. Brak klucza (undefined) = pominiety klucz.
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const outDir = process.argv[3];
if (!root || !outDir) {
  console.error('uzycie: gen-p6-8e-vectors.mjs <KORZEN> <KATALOG_WYJSCIA>');
  process.exit(2);
}
const url = (p) => pathToFileURL(`${root}/${p}`).href;
const U = await import(url('gra/src/game/economy-upkeep.ts'));

function enc(x) {
  if (typeof x !== 'number') throw new Error('enc: nie liczba');
  if (Number.isNaN(x)) return { $n: 'NaN' };
  if (x === Infinity) return { $n: 'Infinity' };
  if (x === -Infinity) return { $n: '-Infinity' };
  if (Object.is(x, -0)) return { $n: '-0' };
  if (Number.isInteger(x)) return x;
  return { $f: String(x) };
}

// Wartosci brzegowe: NaN, +-Inf, -0, ujemne, ulamki, duze.
const VALS = [0, -0, 1, -1, 0.5, 2.5, 3, 7.25, 10, 99.999, 100, 1e6, -7, NaN, Infinity, -Infinity, 1e-300, 49, 50000, 500];

// Deterministyczny PRNG (LCG) - stale ziarno, ten sam zbior przypadkow przy kazdym uruchomieniu.
let seed = 0x5eed8e01;
function rnd() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
function pick(arr) {
  return arr[Math.floor(rnd() * arr.length)];
}

// ---- Surowy econ-params (raw) -------------------------------------------------
const DIFFS = ['easy', 'normal', 'hard'];
const RAW_KEYS = {
  globalne: [
    'magazyn_baza_zywnosc', 'magazyn_baza_surowce', 'magazyn_mnoznik_spichlerz',
    'magazyn_bonus_surowce_na_budynek', 'utrzymanie_jednostka_standard',
  ],
  ekonomia_miasta: [
    'zywnosc_jednostka_ruch', 'zywnosc_jednostka_oboz',
    'zywnosc_mnoznik_terytorium_wlasne', 'zywnosc_mnoznik_poza_terytorium',
  ],
  budynki: ['utrzymanie_budynek'],
};
const CELL_VALS = [7, 0, -2, 0.25, 13, NaN, Infinity, -0, 'abc', null, undefined];

// Buduje raw losowo: grupy, wiersze i komorki (undefined = brak klucza).
function randomRaw() {
  const raw = {};
  for (const group of Object.keys(RAW_KEYS)) {
    const roll = rnd();
    if (roll < 0.15) continue; // grupa nieobecna
    raw[group] = {};
    for (const key of RAW_KEYS[group]) {
      const r2 = rnd();
      if (r2 < 0.2) continue; // wiersz nieobecny
      const row = {};
      for (const d of DIFFS) {
        const v = pick(CELL_VALS);
        if (v !== undefined) row[d] = v;
      }
      raw[group][key] = row;
    }
  }
  return raw;
}

// Koduje raw do JSON: liczby -> enc, reszta (string/null/brak) -> zachowane jako string/null/pominiete.
function encRaw(raw) {
  const out = {};
  for (const [group, rows] of Object.entries(raw)) {
    out[group] = {};
    for (const [key, row] of Object.entries(rows)) {
      const o = {};
      for (const d of DIFFS) {
        if (!(d in row)) continue;
        const v = row[d];
        if (typeof v === 'number') o[d] = enc(v);
        else if (v === null) o[d] = null;
        else o[d] = String(v); // 'abc' -> string (nie-liczba)
      }
      out[group][key] = o;
    }
  }
  return out;
}

const FIXED_RAWS = [
  {},
  { globalne: {} },
  { globalne: { magazyn_baza_zywnosc: { easy: 10, normal: 20, hard: 30 } } },
  {
    globalne: {
      magazyn_baza_surowce: { easy: 1000, normal: 10000, hard: 20000 },
      magazyn_mnoznik_spichlerz: { normal: 4 },
      magazyn_bonus_surowce_na_budynek: { normal: 100, hard: NaN },
      utrzymanie_jednostka_standard: { easy: 2, normal: 1, hard: 3 },
    },
    ekonomia_miasta: {
      zywnosc_jednostka_ruch: { easy: 1, normal: 1, hard: 2 },
      zywnosc_jednostka_oboz: { normal: 0.5 },
      zywnosc_mnoznik_terytorium_wlasne: { normal: 1 },
      zywnosc_mnoznik_poza_terytorium: { normal: NaN },
    },
    budynki: { utrzymanie_budynek: { easy: 1, normal: 1, hard: 2 } },
  },
];

const DIFF_LIST = ['easy', 'normal', 'hard'];
const rawCases = [];
for (const raw of FIXED_RAWS) {
  for (const difficulty of DIFF_LIST) rawCases.push({ raw, difficulty });
}
for (let i = 0; i < 120; i++) {
  rawCases.push({ raw: randomRaw(), difficulty: pick(DIFF_LIST) });
}

// Parametry liczbowe do funkcji pojemnosci.
const PARAM_NUMS = [20, 10, 5, 0, -3, NaN, Infinity, 0.5, 100, 1000, 50000, 500];

// ---- Sekcja A: magazyn zywnosci/surowcow per miasto -------------------------------
const loadStorage = rawCases.map(({ raw, difficulty }) => ({
  raw: encRaw(raw), difficulty,
  out: pack3(U.loadStorageParams(raw, difficulty), 'bazaZywnosc', 'bazaSurowce', 'mnoznikMagazynu'),
}));

function pack3(o, a, b, c) {
  return { [a]: enc(o[a]), [b]: enc(o[b]), [c]: enc(o[c]) };
}

const storageParamSets = [];
for (let i = 0; i < 60; i++) {
  storageParamSets.push({
    bazaZywnosc: pick(PARAM_NUMS), bazaSurowce: pick(PARAM_NUMS), mnoznikMagazynu: pick(PARAM_NUMS),
  });
}

const foodCap = [];
for (const p of storageParamSets) {
  for (const ma of [true, false]) {
    foodCap.push({ ma, p: pack3(p, 'bazaZywnosc', 'bazaSurowce', 'mnoznikMagazynu'),
      out: enc(U.foodStorageCapacity(ma, p)) });
  }
}
const resCap = [];
for (const p of storageParamSets) {
  for (const ma of [true, false]) {
    resCap.push({ ma, p: pack3(p, 'bazaZywnosc', 'bazaSurowce', 'mnoznikMagazynu'),
      out: enc(U.resourceStorageCapacityPerType(ma, p)) });
  }
}

// readCityFoodBuffer: wejscie typu unknown.
const FOOD_BUF_INPUTS = [
  { t: 'num', v: 5 }, { t: 'num', v: -5 }, { t: 'num', v: 2.5 }, { t: 'num', v: NaN },
  { t: 'num', v: Infinity }, { t: 'num', v: -0 },
  { t: 'obj', aktualny: 7 }, { t: 'obj', aktualny: -4 }, { t: 'obj', aktualny: NaN },
  { t: 'obj', aktualny: 'x' }, { t: 'obj' }, { t: 'null' }, { t: 'str' }, { t: 'bool' },
];
function buildFoodBuf(inp) {
  if (inp.t === 'num') return inp.v;
  if (inp.t === 'obj') {
    const o = {};
    if ('aktualny' in inp) o.aktualny = inp.aktualny;
    return o;
  }
  if (inp.t === 'null') return null;
  if (inp.t === 'str') return 'abc';
  return true;
}
const foodBuf = FOOD_BUF_INPUTS.map((inp) => {
  const value = buildFoodBuf(inp);
  return {
    in: { t: inp.t, v: inp.v === undefined ? undefined : enc(inp.v), aktualny: inp.aktualny === undefined ? undefined : (typeof inp.aktualny === 'number' ? enc(inp.aktualny) : inp.aktualny) },
    out: enc(U.readCityFoodBuffer(value)),
  };
});

// clampStore / applyFood
const clamp = [];
for (const a of VALS) for (const c of VALS) {
  const r = U.clampStore(a, c);
  clamp.push({ a: enc(a), c: enc(c), stored: enc(r.stored), overflow: enc(r.overflow) });
}
for (let i = 0; i < 300; i++) {
  const a = pick(VALS) + (rnd() < 0.5 ? 0 : rnd() * 100);
  const c = pick(VALS) + (rnd() < 0.5 ? 0 : rnd() * 100);
  const r = U.clampStore(a, c);
  clamp.push({ a: enc(a), c: enc(c), stored: enc(r.stored), overflow: enc(r.overflow) });
}
const applyFoodCases = [];
for (const cur of VALS) for (const d of VALS) {
  const cap = pick(VALS);
  const r = U.applyFood(cur, d, cap);
  applyFoodCases.push({ cur: enc(cur), delta: enc(d), cap: enc(cap), stored: enc(r.stored), overflow: enc(r.overflow) });
}

// Stores: zywnosc + surowce (klucze jak w resources.json, plus klucz spoza listy).
const RES_KEYS = ['drewno', 'kamien', 'glina', 'zelazo', 'zywnosc_x'];
function randomStores() {
  const surowce = {};
  for (const k of RES_KEYS) {
    if (rnd() < 0.5) surowce[k] = pick(VALS);
  }
  return { zywnosc: pick(VALS), surowce };
}
function encStores(s) {
  const surowce = {};
  for (const [k, v] of Object.entries(s.surowce)) surowce[k] = enc(v);
  return { zywnosc: enc(s.zywnosc), surowce };
}
function decodeOutStores(s) {
  return encStores(s);
}

const intakeCases = [];
for (let i = 0; i < 300; i++) {
  const stores = randomStores();
  const intake = {};
  for (const k of RES_KEYS) if (rnd() < 0.5) intake[k] = pick(VALS);
  const cap = pick(VALS);
  const r = U.applyResourceIntake(
    { zywnosc: stores.zywnosc, surowce: { ...stores.surowce } },
    intake,
    cap,
  );
  const overflow = {};
  for (const [k, v] of Object.entries(r.overflow)) overflow[k] = enc(v);
  intakeCases.push({
    stores: encStores(stores),
    intake: Object.fromEntries(Object.entries(intake).map(([k, v]) => [k, enc(v)])),
    cap: enc(cap),
    outStores: decodeOutStores(r.stores),
    overflow,
  });
}

const globalCases = [];
for (let i = 0; i < 80; i++) {
  const p = pick(storageParamSets);
  const n = Math.floor(rnd() * 5);
  const flags = Array.from({ length: n }, () => rnd() < 0.5);
  globalCases.push({
    flags,
    p: pack3(p, 'bazaZywnosc', 'bazaSurowce', 'mnoznikMagazynu'),
    out: enc(U.globalResourceCapacityPerType(flags, p)),
  });
}

const lostOut = U.onCityLost();
const lost = { out: { zywnosc: enc(lostOut.zywnosc), surowce: {} } };

const conquerCases = [];
for (let i = 0; i < 200; i++) {
  const winner = randomStores();
  const loser = randomStores();
  if (rnd() < 0.2) loser.surowce.zywnosc = pick(VALS); // klucz kolidujacy z nadwyzka zywnosci
  const fcap = pick(VALS);
  const rcap = pick(VALS);
  const r = U.onCityConquered(
    { zywnosc: winner.zywnosc, surowce: { ...winner.surowce } },
    { zywnosc: loser.zywnosc, surowce: { ...loser.surowce } },
    fcap,
    rcap,
  );
  const overflow = {};
  for (const [k, v] of Object.entries(r.overflow)) overflow[k] = enc(v);
  conquerCases.push({
    winner: encStores(winner),
    loser: encStores(loser),
    fcap: enc(fcap),
    rcap: enc(rcap),
    outStores: encStores(r.stores),
    overflow,
  });
}

// ---- Sekcja A2: pula panstwa --------------------------------------------------------
const loadOwner = rawCases.map(({ raw, difficulty }) => ({
  raw: encRaw(raw), difficulty,
  out: pack2(U.loadOwnerStorageParams(raw, difficulty), 'bazaSurowcePanstwo', 'bonusSurowceNaBudynek'),
}));
function pack2(o, a, b) {
  return { [a]: enc(o[a]), [b]: enc(o[b]) };
}

const ownerParamSets = [];
for (let i = 0; i < 40; i++) {
  ownerParamSets.push({ bazaSurowcePanstwo: pick(PARAM_NUMS), bonusSurowceNaBudynek: pick(PARAM_NUMS) });
}
ownerParamSets.push({ bazaSurowcePanstwo: 50000, bonusSurowceNaBudynek: 500 });

const ERA_VALS = [1, 0.5, NaN, 2, 3, 4.5, -1, Infinity, -Infinity, 0, 1.0000001, 7];
const COUNT_VALS = [0, 1, 2, 3.7, -1, NaN, Infinity, 5];

const ownerCap = [];
for (const p of ownerParamSets) {
  for (const cnt of COUNT_VALS) {
    for (const era of ERA_VALS) {
      ownerCap.push({
        count: enc(cnt),
        p: pack2(p, 'bazaSurowcePanstwo', 'bonusSurowceNaBudynek'),
        era: enc(era),
        out: enc(U.ownerResourceCapacityPerType(cnt, p, era)),
      });
    }
  }
  // Domyslne era=1 (argument pominiety w TS -> JS default).
  for (const cnt of COUNT_VALS) {
    ownerCap.push({
      count: enc(cnt),
      p: pack2(p, 'bazaSurowcePanstwo', 'bonusSurowceNaBudynek'),
      era: enc(1),
      out: enc(U.ownerResourceCapacityPerType(cnt, p)),
    });
  }
}

const ownerEra = [];
for (const p of ownerParamSets) {
  for (const era of ERA_VALS) {
    const r = U.ownerStorageParamsForEra(p, era);
    ownerEra.push({
      p: pack2(p, 'bazaSurowcePanstwo', 'bonusSurowceNaBudynek'),
      era: enc(era),
      out: pack2(r, 'bazaSurowcePanstwo', 'bonusSurowceNaBudynek'),
    });
  }
}

const magazynEra = ERA_VALS.map((era) => ({ era: enc(era), out: enc(U.magazynEraMultiplier(era)) }));

const KEY_PROBES = [
  ...U.OWNER_CAPPED_RESOURCE_KEYS, 'zywnosc', 'Drewno', 'drewno ', 'ruda_cyny_x', '', '__proto__', 'constructor', 'toString', 'zloto', 'kon',
];
const keyCases = KEY_PROBES.map((k) => ({ key: k, out: U.isOwnerCappedResourceKey(k) }));

// reconcileOwnerResourceCaps: miasta z surowce (lub bez), cap per owner (brak wpisu = undefined).
const RECON_IDS = ['a', 'b', 'c', 'city-10', 'city-2', 'x', 'B'];
const RECON_KEYS = [...U.OWNER_CAPPED_RESOURCE_KEYS.slice(0, 5), 'zywnosc', 'woda'];
const RECON_AMOUNTS = [0, 1, 2, 3, 5, 10, 50, 0.5, 7.25, -2, NaN, Infinity, -0, 100];
function randomCities() {
  const n = 1 + Math.floor(rnd() * 6);
  const cities = [];
  for (let i = 0; i < n; i++) {
    const c = { id: pick(RECON_IDS) + (rnd() < 0.5 ? '' : String(i)), ownerId: Math.floor(rnd() * 3) - (rnd() < 0.1 ? 1 : 0) };
    if (rnd() < 0.85) {
      c.surowce = {};
      for (const k of RECON_KEYS) if (rnd() < 0.6) c.surowce[k] = pick(RECON_AMOUNTS);
    }
    cities.push(c);
  }
  return cities;
}
const reconCases = [];
for (let i = 0; i < 500; i++) {
  const cities = randomCities();
  const capMap = {};
  for (let o = -1; o <= 3; o++) {
    if (rnd() < 0.8) capMap[o] = pick([0, 5, 10, 25, 100, 3.5, NaN, Infinity, -1, -0]);
  }
  const encCities = cities.map((c) => {
    const o = { id: c.id, ownerId: c.ownerId };
    if (c.surowce) {
      o.surowce = {};
      for (const [k, v] of Object.entries(c.surowce)) o.surowce[k] = enc(v);
    }
    return o;
  });
  const encCap = {};
  for (const [k, v] of Object.entries(capMap)) encCap[k] = enc(v);
  const work = cities.map((c) => ({ id: c.id, ownerId: c.ownerId, surowce: c.surowce ? { ...c.surowce } : undefined }));
  U.reconcileOwnerResourceCaps(work, (ownerId) => capMap[ownerId]);
  reconCases.push({
    cities: encCities,
    cap: encCap,
    out: work.map((c) => {
      const o = { id: c.id, ownerId: c.ownerId };
      if (c.surowce) {
        o.surowce = {};
        for (const [k, v] of Object.entries(c.surowce)) o.surowce[k] = enc(v);
      }
      return o;
    }),
  });
}

// Stale granicy (ręcznie opisane scenariusze, z tym samym kodem weba).
const fixedRecon = [
  // remis ilosci: sort po id rosnaco; nadwyzka 3 z 5+5
  { cities: [{ id: 'b', ownerId: 0, surowce: { drewno: 5 } }, { id: 'a', ownerId: 0, surowce: { drewno: 5 } }], cap: { 0: 7 } },
  // NaN w ilosci: porownanie NaN -> Equal (V8)
  { cities: [{ id: 'a', ownerId: 0, surowce: { drewno: 4 } }, { id: 'b', ownerId: 0, surowce: { drewno: Infinity } }, { id: 'c', ownerId: 0, surowce: { drewno: 2 } }], cap: { 0: 3 } },
  // cap NaN / Infinity / ujemny / brak -> pominiete
  { cities: [{ id: 'a', ownerId: 0, surowce: { drewno: 9 } }], cap: { 0: NaN } },
  { cities: [{ id: 'a', ownerId: 0, surowce: { drewno: 9 } }], cap: { 0: Infinity } },
  { cities: [{ id: 'a', ownerId: 0, surowce: { drewno: 9 } }], cap: { 0: -1 } },
  { cities: [{ id: 'a', ownerId: 0, surowce: { drewno: 9 } }], cap: {} },
  // miasto bez surowce: pomijane w sumie
  { cities: [{ id: 'a', ownerId: 0 }, { id: 'b', ownerId: 0, surowce: { drewno: 9 } }], cap: { 0: 4 } },
  // klucz nie-capowany (zywnosc) nie podlega capowi
  { cities: [{ id: 'a', ownerId: 1, surowce: { zywnosc: 99, drewno: 3 } }], cap: { 1: 1 } },
  // NaN w sumie: Math.min(NaN, ...) -> NaN (zachowanie JS)
  { cities: [{ id: 'a', ownerId: 0, surowce: { drewno: NaN } }, { id: 'b', ownerId: 0, surowce: { drewno: 6 } }], cap: { 0: 2 } },
  // Dwa miasta Infinity: Inf - Inf = NaN -> komparator Equal (stabilnie, bez tie-break po id)
  { cities: [{ id: 'b', ownerId: 0, surowce: { drewno: Infinity } }, { id: 'a', ownerId: 0, surowce: { drewno: Infinity } }], cap: { 0: 5 } },
  { cities: [{ id: 'z', ownerId: 0, surowce: { drewno: 5 } }, { id: 'y', ownerId: 0, surowce: { drewno: Infinity } }, { id: 'x', ownerId: 0, surowce: { drewno: Infinity } }], cap: { 0: 3 } },
  // Remis ilosci przy identycznym id: sort stabilny (kolejnosc tablicy)
  { cities: [{ id: 'q', ownerId: 0, surowce: { kamien: 4 } }, { id: 'q', ownerId: 0, surowce: { kamien: 4 } }], cap: { 0: 5 } },
];
const fixedReconOut = fixedRecon.map((fx) => {
  const work = fx.cities.map((c) => ({ id: c.id, ownerId: c.ownerId, surowce: c.surowce ? { ...c.surowce } : undefined }));
  U.reconcileOwnerResourceCaps(work, (ownerId) => fx.cap[ownerId]);
  const encCities = fx.cities.map((c) => {
    const o = { id: c.id, ownerId: c.ownerId };
    if (c.surowce) { o.surowce = {}; for (const [k, v] of Object.entries(c.surowce)) o.surowce[k] = enc(v); }
    return o;
  });
  const encCap = {};
  for (const [k, v] of Object.entries(fx.cap)) encCap[k] = enc(v);
  return {
    cities: encCities,
    cap: encCap,
    out: work.map((c) => {
      const o = { id: c.id, ownerId: c.ownerId };
      if (c.surowce) { o.surowce = {}; for (const [k, v] of Object.entries(c.surowce)) o.surowce[k] = enc(v); }
      return o;
    }),
  };
});

// ---- Sekcja B (parametry): DEFAULT-y -----------------------------------------------
const defaults = {
  storage: pack3(U.DEFAULT_STORAGE_PARAMS, 'bazaZywnosc', 'bazaSurowce', 'mnoznikMagazynu'),
  ownerStorage: pack2(U.DEFAULT_OWNER_STORAGE_PARAMS, 'bazaSurowcePanstwo', 'bonusSurowceNaBudynek'),
  ownerCappedKeys: [...U.OWNER_CAPPED_RESOURCE_KEYS],
};

const out = {
  zrodlo: 'uruchomiony kod TS weba economy-upkeep.ts (pin 91dc998a, generator gen-p6-8e-vectors.mjs)',
  defaults,
  loadStorage,
  foodCap,
  resCap,
  foodBuf,
  clamp,
  applyFood: applyFoodCases,
  intake: intakeCases,
  globalCap: globalCases,
  lost,
  conquer: conquerCases,
  loadOwner,
  ownerCap,
  ownerEra,
  magazynEra,
  keyCases,
  recon: reconCases.concat(fixedReconOut),
};

writeFileSync(`${outDir}/economy_upkeep_p1.json`, JSON.stringify(out));
const counts = Object.fromEntries(Object.entries(out).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.length]));
console.log('EXIT=0', JSON.stringify(counts));
