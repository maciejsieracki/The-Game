// P6.7B - wektory z URUCHOMIONEGO weba (pin edb8fb56) dla:
//   gra/src/game/building-cost-tempo.ts, building-stock-cost.ts, building-resource-gate.ts
// Kod weba ladowany w calosci (bez stubow); zadne funkcje logiki nie sa przepisywane. Zaleznosci spoza
// zakresu (r-stawki-strojenie, zloto-access, production.isBuildingSupersededByUpgrade) sa PRAWDZIWYM kodem
// weba; ich wyniki trafiaja do wektorow jako dane wstrzykniete do Rust (domkniecia testu sprawdzaja argumenty).
// Liczby specjalne: NaN / +-Infinity / -0 zapisywane jako stringi "NaN" / "Infinity" / "-Infinity" / "-0";
// liczby niecalkowite jako string "~<najkrotszy zapis JS>" (Rust: str::parse::<f64> jest dokladny).
// Wejscia losowe: Mulberry32 z ziarnem stalym (deterministyczne).
//
// Uzycie:
//   node --experimental-transform-types --no-warnings --import ./p67b-loader-register.mjs \
//     ./gen-p67b-vectors.mjs <WEB_ROOT> <OUT_DIR>
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
const readJson = (p) => JSON.parse(readFileSync(join(webRoot, 'gra/data', p), 'utf8'));

const T = await import(src('game/building-cost-tempo.ts'));
const S = await import(src('game/building-stock-cost.ts'));
const G = await import(src('game/building-resource-gate.ts'));
const Z = await import(src('game/zloto-access.ts'));
const R = await import(src('game/r-stawki-strojenie.ts'));
const P = await import(src('game/production.ts'));

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x67b0c0de);
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;

const replacer = (_k, v) => {
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'NaN';
    if (v === Infinity) return 'Infinity';
    if (v === -Infinity) return '-Infinity';
    if (Object.is(v, -0)) return '-0';
    // serde_json bez float_roundtrip nie jest dokladny dla duzych wykladnikow: wszystko poza bezpiecznymi
    // calkowitymi jako "~<zapis JS>" (Rust: str::parse::<f64> jest dokladny)
    if (!Number.isSafeInteger(v)) return '~' + String(v);
  }
  return v;
};
const write = (name, obj) => writeFileSync(join(outDir, name), JSON.stringify(obj, replacer, 0) + '\n');
const clone = (x) => {
  if (x === undefined) return undefined;
  try {
    return structuredClone(x);
  } catch {
    return x; // funkcje (wejscie "inny typ") nie klonuja sie - sa niemutowalne
  }
};

// kodowanie wejscia "epoka" / "dowolna wartosc": liczba, napis albo inna
const encAny = (x) => {
  if (typeof x === 'number') return { t: 'n', v: x };
  if (typeof x === 'string') return { t: 's', v: x };
  return { t: 'o', d: x === undefined ? 'undefined' : x === null ? 'null' : typeof x };
};

const NUMS = [0, -0, 1, 2, 3, 4, 5, 0.5, 1.5, 2.5, 2.4999, -1, -2.5, 10, 25, 100, 1e6, 1e15, 1e21, NaN, Infinity,
  -Infinity, 0.1, 0.30000000000000004, 123.456, 1e-7, 5e-324, Number.MAX_VALUE, 7, 13, 50, 0.4, 3.5, 1e308];

// ======================================================================
// stale (odczyt z uruchomionego weba)
// ======================================================================
const constants = {
  pace: Object.entries(T.KOSZT_BUDYNKOW_PACE),
  mountCost: S.MOUNT_UNIT_HORSE_STOCK_COST,
  mountKey: S.MOUNT_UNIT_HORSE_STOCK_KEY,
  mountExempt: S.MOUNT_HORSE_EXEMPT_UNIT,
  labels: Object.entries(S.STOCK_RESOURCE_LABEL),
  empireKeys: [...S.EMPIRE_STOCK_RESOURCE_KEYS],
  fala2: R.R_STAWKI_FALA2_MULT,
  zlotoLabel: Z.ZLOTO_LABEL,
  zlotoKey: Z.ZLOTO_STOCK_KEY,
  mennicaDrain: Z.MENNICA_ZLOTO_DRAIN_PER_TURN,
  mennicaDrainReexport: G.MENNICA_ZLOTO_DRAIN_PER_TURN,
  depositIds: [...G.DEPOSIT_RUNTIME_GATED_BUILDING_IDS],
  prereq: Object.entries(G.CITY_BUILDING_PREREQ),
  water: [...G.WATER_ACCESS_BUILDING_IDS],
  accessOnlySize: G.ACCESS_ONLY_RESOURCE_LABELS.size,
  spichlerz: {
    drainCeramika: G.SPICHLERZ_DRAIN_CERAMIKA_PER_TURN,
    drainSol: G.SPICHLERZ_DRAIN_SOL_PER_TURN,
    capI: G.SPICHLERZ_EMPIRE_CAP_I,
    capIIFull: G.SPICHLERZ_EMPIRE_CAP_II_FULL,
  },
};

// ======================================================================
// cost.json: tempo, epoki, koszty budynkow i jednostek, magazyn jednego miasta
// ======================================================================
const cost = { constants };

const PACE_KEYS = ['niski', 'normalny', 'wysoki', '', 'xyz', 'toString', 'constructor', '__proto__', 'Niski'];
const PACE_NUMS = [0, 0.5, 1, 2, 4, -1, NaN, Infinity, 2.5, 1.25, 1e-9, -0, 3, 1e308];
cost.pace = [];
const PACE_BASES = [...NUMS, ...Array.from({ length: 40 }, () => ri(0, 500)), ...Array.from({ length: 12 }, () => ri(0, 5000) / 8)];
for (const base of PACE_BASES) {
  for (const k of PACE_KEYS) cost.pace.push({ base, pace: { k }, out: T.applyBuildingCostPace(base, k) });
  for (const n of PACE_NUMS) cost.pace.push({ base, pace: { n }, out: T.applyBuildingCostPace(base, n) });
}

const EPOCH_STRINGS = ['', ' ', 'Kamień', 'kamien', 'KAMIEŃ', 'Stone', ' stone ', 'Brąz', 'braz', 'BRĄZ', 'Bronze', 'bronze',
  'Żelazo', 'zelazo', 'Zelazo+', 'Żelazo+', 'iron', 'Iron+', 'iron plus', 'Iron  Plus', 'IRON PLUS', 'steel', 'Stal', 'Stal ',
  'stał', 'STAŁ', '1', '2', '3', '4', '0', '01', '0003', '2.5', '3.0', '3.99', '2.99999999999999999', '10', '1.', '.5', '1e3',
  '-1', '+2', ' 3 ', '3.', '2.', '.3', '.2', '3.5.', ' 3. ', '٣', '３', '2.5.1', 'abc', 'unknown', 'Epoka 3', 'kamien\n', '\tbraz', ' braz', '﻿braz',
  '\u0085braz', 'brąz', 'brąz', 'bra̋z', 'zelazo​', 'ŻELAZO+', 'Kamień́', 'İron', '9'.repeat(300),
  '9'.repeat(400), '1' + '0'.repeat(30), '3'.repeat(5) + '.' + '9'.repeat(30), 'Å', 'Ａ', 'ｋａｍｉｅｎ', 'kamien kamien'];
const EPOCH_NUMS = [-5, -1, -0, 0, 0.5, 1, 1.9, 2, 2.5, 2.999, 3, 3.1, 4, 5, 10, 1e9, NaN, Infinity, -Infinity, 1e308];
const EPOCH_OTHER = [null, undefined, true, false, {}, [], () => 1];
const ALL_EPOCHS = [...EPOCH_NUMS, ...EPOCH_STRINGS, ...EPOCH_OTHER];
cost.epochMult = ALL_EPOCHS.map((e) => ({ epoch: encAny(e), out: S.epochCostMultiplier(e) }));

const COSTS = [0, -0, -1, 1, 2, 3, 0.4, 0.5, 1.5, 2.5, 10, 13, 25, 50, 1e6, NaN, Infinity, -Infinity, 1e308, 0.1, 7, 100, 0.49999999999999994, 5e-324];
cost.scaleCost = [];
for (const c of COSTS) {
  for (const e of ALL_EPOCHS) cost.scaleCost.push({ cost: c, epoch: encAny(e), out: S.scaleCostByEpoch(c, e) });
}

const ERA_VALUES = [undefined, null, '3', '2', true, {}, -1, 0, 0.9, 1, 1.5, 2, 2.9, 2.999999, 3, 3.5, 4, 7, NaN, Infinity, -Infinity, -0, 1e9];
cost.eraMult = ERA_VALUES.map((e) => ({ epoka: encAny(e), out: S.buildingEraCostMultiplier(e) }));

// buildingStockCost: budynki z buildings.json + syntetyczne
const realBuildings = readJson('buildings.json');
const encBuilding = (b) => {
  if (b === null || b === undefined) return { absent: b === null ? 'null' : 'undefined' };
  const o = {};
  if (b.epokaWejscia !== undefined) o.epoka = encAny(b.epokaWejscia);
  if (b.koszt_surowce !== undefined) {
    o.koszt = b.koszt_surowce === null ? { t: 'o', d: 'null' } : { t: 'r', v: {} };
    if (b.koszt_surowce !== null && typeof b.koszt_surowce === 'object') {
      for (const [k, v] of Object.entries(b.koszt_surowce)) o.koszt.v[k] = encAny(v);
    }
  }
  return o;
};
cost.buildingStock = [];
for (const b of realBuildings) {
  const input = { epokaWejscia: b.epokaWejscia, koszt_surowce: b.koszt_surowce };
  cost.buildingStock.push({ id: b.id, real: true, building: encBuilding(input), out: S.buildingStockCost(input) });
}
cost.buildingStock.push({ id: 'null', building: encBuilding(null), out: S.buildingStockCost(null) });
cost.buildingStock.push({ id: 'undefined', building: encBuilding(undefined), out: S.buildingStockCost(undefined) });
const KOSZT_VALUES = [1, 2, 3, 5, 7, 12, 25, 0, -1, 0.1, 0.2, 0.4, 0.5, 1.5, 2.5, 0.49999999999999994, NaN, Infinity, -Infinity, 'abc', null, true, 1e6, 4.4999];
const KOSZT_KEYS = ['drewno', 'kamien', 'glina', 'cegla', 'ceramika', 'sol'];
for (let i = 0; i < 700; i++) {
  const input = {};
  if (chance(0.9)) input.epokaWejscia = pick([...ERA_VALUES, 1, 1, 2, 2, 3, 3, 4]);
  if (chance(0.92)) {
    if (chance(0.05)) input.koszt_surowce = null;
    else {
      input.koszt_surowce = {};
      const n = ri(0, 4);
      for (let j = 0; j < n; j++) input.koszt_surowce[pick(KOSZT_KEYS)] = pick(KOSZT_VALUES);
    }
  }
  cost.buildingStock.push({ id: 'syn-' + i, building: encBuilding(input), out: S.buildingStockCost(input) });
}

// missingStockFor / canAffordBuildingStock / deductBuildingStockCost
const REC_VALUES = [0, 1, 2, 3, 5, 10, 12, 25, 50, 100, 0.5, -1, -3.5, NaN, Infinity, -Infinity, 1e15, 0.1];
const randRec = (keys) => {
  const r = {};
  const n = ri(0, keys.length);
  for (let i = 0; i < n; i++) r[pick(keys)] = pick(REC_VALUES);
  return r;
};
cost.stock = [];
for (let i = 0; i < 1500; i++) {
  const have = chance(0.12) ? undefined : randRec(KOSZT_KEYS);
  const c = randRec(KOSZT_KEYS);
  cost.stock.push({
    have: clone(have),
    cost: clone(c),
    missing: S.missingStockFor(clone(have), clone(c)),
    can: S.canAffordBuildingStock(clone(have), clone(c)),
    deduct: S.deductBuildingStockCost(clone(have), clone(c)),
  });
}
// nie mutuje wejsc
{
  const have = { drewno: 5 };
  const c = { drewno: 3 };
  S.deductBuildingStockCost(have, c);
  cost.deductPure = { haveAfter: have, costAfter: c };
}

// etykiety
cost.labels = [...S.EMPIRE_STOCK_RESOURCE_KEYS, ...Object.keys(S.STOCK_RESOURCE_LABEL), '', 'xyz', 'Drewno', 'ZLOTO', ' drewno']
  .map((k) => ({ key: k, out: S.stockResourceLabel(k) }));

// jednostki
const realUnits = readJson('units.json');
const encUnit = (u) => {
  if (u === null || u === undefined) return { absent: u === null ? 'null' : 'undefined' };
  const o = {};
  if (u.Jednostka !== undefined) o.j = u.Jednostka;
  if (u.Typ !== undefined) o.typ = u.Typ;
  if (u.Epoka !== undefined) o.epoka = encAny(u.Epoka);
  if (u.Surowiec !== undefined) o.surowiec = u.Surowiec;
  if (u['Surowiec (ilość)'] !== undefined) o.ilosc = encAny(u['Surowiec (ilość)']);
  return o;
};
cost.units = [];
const addUnit = (id, u, real) => {
  const sourceCopy = clone(u);
  cost.units.push({
    id, real: !!real, unit: encUnit(u),
    mount: S.unitRequiresMountHorseStock(sourceCopy),
    out: S.unitStockCost(clone(u)),
  });
};
for (const u of realUnits) {
  addUnit(u.Jednostka, { Jednostka: u.Jednostka, Typ: u.Typ, Epoka: u.Epoka, Surowiec: u.Surowiec, 'Surowiec (ilość)': u['Surowiec (ilość)'] }, true);
}
addUnit('null', null);
addUnit('undefined', undefined);
const U_TYP = [undefined, null, 'Mount', ' Mount ', 'mount', 'Melee', 'Ranged', ''];
const U_NAME = [undefined, null, 'Rydwan (woły)', ' Rydwan (woły) ', 'Rydwan', 'Konnica', 'Rydwan (woly)', ''];
const U_SUR = [undefined, null, '', '-', ' - ', ' ', 'Drewno', 'Brąz', 'Żelazo', ' Żelazo ', 'ŻELAZO', 'Kamień', 'Ruda żelaza', 'Ruda cyny', 'Koń',
  'Węgiel', 'Sól', 'Ceramika', 'Łupki', 'Kon', 'kon', 'ÅÄÖ', '\u0300', '\u0301\u0302', 'a\u0300'];
const U_ILOSC = [undefined, null, 0, -1, 1, 3, 13, 25, 25.5, 0.4, NaN, Infinity, '5', 1e6, 2.5];
for (let i = 0; i < 2500; i++) {
  addUnit('syn-' + i, {
    Jednostka: pick(U_NAME), Typ: pick(U_TYP), Epoka: pick(ALL_EPOCHS), Surowiec: pick(U_SUR), 'Surowiec (ilość)': pick(U_ILOSC),
  });
}
// Jawnie NIE portowane: wyszukiwania w obiektach JS po kluczu z lancucha prototypow. Sonda zapisuje, co robi web.
const probe = (name, fn) => {
  try {
    const v = fn();
    return { name, web: typeof v === 'function' ? 'function' : Array.isArray(v) ? 'array:' + v.map((x) => typeof x).join(',') : typeof v === 'number' && Number.isNaN(v) ? 'NaN' : typeof v };
  } catch (e) {
    return { name, web: 'throws:' + e.constructor.name };
  }
};
cost.protoQuirk = [
  probe('stockResourceLabel(constructor)', () => S.stockResourceLabel('constructor')),
  probe('stockResourceLabel(__proto__)', () => S.stockResourceLabel('__proto__')),
  probe('stockResourceLabel(toString)', () => S.stockResourceLabel('toString')),
  probe('applyBuildingCostPace(10,constructor)', () => T.applyBuildingCostPace(10, 'constructor')),
  probe('buildingRequiredActiveLabels(wym=constructor)', () => G.buildingRequiredActiveLabels({ id: 'x', epokaWejscia: 1, wymaganySurowiec: 'constructor' })),
  probe('buildingRequiredActiveLabels(id=constructor)', () => G.buildingRequiredActiveLabels({ id: 'constructor', epokaWejscia: 1 })),
  probe('CITY_BUILDING_PREREQ[constructor]', () => G.CITY_BUILDING_PREREQ['constructor']),
  probe('hasDepositRuntimeGate(constructor)', () => G.hasDepositRuntimeGate('constructor')),
];
write('cost.json', cost);

// ======================================================================
// nfd.json: przeglad calego Unicode przez prawdziwe unitStockCost (klucz = stripDiacriticsLower)
// ======================================================================
const nfd = { changed: [] };
let total = 0;
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  total++;
  const ch = String.fromCodePoint(cp);
  const out = S.unitStockCost({ Surowiec: ch, 'Surowiec (ilość)': 1, Epoka: 1 });
  const keys = Object.keys(out);
  const key = keys.length === 0 ? null : keys[0];
  if (keys.length > 1) throw new Error('wiecej niz jeden klucz dla cp ' + cp);
  if (key !== ch) nfd.changed.push([cp, key]);
}
nfd.total = total;
// losowe napisy wielu znakow: znaki laczace o roznych klasach laczenia (kolejnosc kanoniczna), Hangul, litery
const SEQ_POOL = ['a', 'e', 'A', 'ا', 'ب', 'क', 'ก', 'α', 'ᄀ', 'ᅡ', 'ᆨ', '가', '한', 'ł', 'İ', 'Σ', 'ǆ', 'ﬁ', 'Å', 'Ω', 'K',
  '̀', '́', '̣', '̧', 'ͅ', '֑', 'ְ', 'ً', '़', '्', 'ุ', '᪰', '᷀',
  '⃐', '︠', '゙', '〪', 'ཱ', 'ི', 'ུ', '̖', '̛', '̸', ' ', '-', ' ', '﻿', '1', '_'];
nfd.sequences = [];
for (let i = 0; i < 6000; i++) {
  const n = ri(1, 8);
  let s = '';
  for (let j = 0; j < n; j++) s += pick(SEQ_POOL);
  const out = S.unitStockCost({ Surowiec: s, 'Surowiec (ilość)': 1, Epoka: 1 });
  const keys = Object.keys(out);
  nfd.sequences.push([s, keys.length === 0 ? null : keys[0]]);
}
write('nfd.json', nfd);

// ======================================================================
// pool.json: pula panstwa po miastach
// ======================================================================
const pool = { };
const CITY_IDS = ['a', 'b', 'c', 'C', 'A', 'city-1', 'city-10', 'city-2', '', '😀', '～', 'Ł', 'a ', 'aa', 'b2', 'b10'];
const RES_KEYS = ['drewno', 'kamien', 'ceramika', 'sol', 'cegla'];
const POOL_VALUES = [0, 0, 1, 2, 3, 5, 10, 25, 50, 100, 0.5, 7, 1000, 2.5, -3, 0.1];
function randCities(opts = {}) {
  const n = ri(0, opts.max ?? 6);
  const cities = [];
  const ids = [...CITY_IDS];
  for (let i = 0; i < n; i++) {
    const idIdx = ri(0, ids.length - 1);
    const id = opts.dupIds && chance(0.3) ? pick(CITY_IDS) : ids.splice(idIdx, 1)[0];
    const city = { id, ownerId: pick([1, 1, 1, 2, 0, -1]) };
    if (chance(0.88)) {
      city.surowce = {};
      const m = ri(0, RES_KEYS.length);
      for (let j = 0; j < m; j++) {
        let v = pick(POOL_VALUES);
        if (opts.extra && chance(0.07)) v = pick([NaN, Infinity, -Infinity, -0]);
        city.surowce[pick(RES_KEYS)] = v;
      }
    }
    cities.push(city);
  }
  return cities;
}
const view = (cities) => cities.map((c) => (c.surowce === undefined ? { id: c.id, ownerId: c.ownerId } : { id: c.id, ownerId: c.ownerId, surowce: c.surowce }));

pool.ownerAll = [];
pool.ownerOne = [];
for (let i = 0; i < 500; i++) {
  const cities = randCities({ extra: true, dupIds: true });
  const owner = pick([1, 2, 0, -1, 7]);
  pool.ownerAll.push({ cities: clone(cities), owner, out: S.ownerResourceStockAll(clone(cities), owner) });
  const key = pick([...RES_KEYS, 'zloto']);
  pool.ownerOne.push({ cities: clone(cities), owner, key, out: S.ownerResourceStock(clone(cities), owner, key) });
}

const randCost = () => {
  const c = {};
  const n = ri(0, 3);
  for (let i = 0; i < n; i++) c[pick(RES_KEYS)] = pick([0, 1, 2, 3, 5, 8, 10, 25, 60, 150, 0.5, -2, NaN, Infinity, 1000]);
  return c;
};
pool.deduct = [];
pool.refund = [];
pool.credit = [];
pool.assign = [];
for (let i = 0; i < 900; i++) {
  const cities = randCities({ extra: true, dupIds: true });
  const owner = pick([1, 1, 1, 2, 0, 9]);
  const c = randCost();
  const work = clone(cities);
  S.deductBuildingStockCostAcrossCities(work, owner, clone(c));
  pool.deduct.push({ cities: clone(cities), owner, cost: c, after: view(work) });
}
for (let i = 0; i < 700; i++) {
  const cities = randCities({ dupIds: true });
  const owner = pick([1, 1, 1, 2, 0, 9]);
  const c = randCost();
  const work = clone(cities);
  S.refundBuildingStockCostAcrossCities(work, owner, clone(c));
  pool.refund.push({ cities: clone(cities), owner, cost: c, after: view(work) });
}
for (let i = 0; i < 1200; i++) {
  const cities = randCities({ dupIds: true });
  const owner = pick([1, 1, 1, 2, 0, 9]);
  const key = pick(RES_KEYS);
  const amount = pick([0, 1, 2, 5, 10, 25, 0.5, -3, NaN, Infinity, 100, 1000, 7.25]);
  const capKind = pick(['none', 'none', 'num', 'num', 'num', 'nan', 'inf', 'neg']);
  const cap = capKind === 'none' ? undefined : capKind === 'nan' ? NaN : capKind === 'inf' ? Infinity : capKind === 'neg' ? -5
    : pick([0, 1, 5, 10, 30, 100, 1000, 7.5]);
  const work = clone(cities);
  const ret = S.creditOwnerResourceStock(work, owner, key, amount, cap);
  const entry = { cities: clone(cities), owner, key, amount, ret, after: view(work) };
  if (cap !== undefined) entry.cap = cap;
  pool.credit.push(entry);
}
for (let i = 0; i < 600; i++) {
  const cities = randCities({ dupIds: true });
  const owner = pick([1, 1, 2, 0, 9]);
  const p = {};
  const n = ri(0, 4);
  for (let j = 0; j < n; j++) p[pick(RES_KEYS)] = pick([0, 1, 5, 10, 25, 100, 0.5, -3, Infinity, 1000, NaN]);
  const work = clone(cities);
  S.assignOwnerResourceStockFromPool(work, owner, clone(p));
  pool.assign.push({ cities: clone(cities), owner, pool: p, after: view(work) });
}
// przypadki jawne
pool.explicit = [];
{
  // remis po id: porownanie UTF-16 (BMP U+FF5E > astralny U+1F600 w UTF-16, odwrotnie w punktach kodowych)
  const cities = [
    { id: '～', ownerId: 1, surowce: { drewno: 5 } },
    { id: '😀', ownerId: 1, surowce: { drewno: 5 } },
  ];
  const w1 = clone(cities);
  S.deductBuildingStockCostAcrossCities(w1, 1, { drewno: 3 });
  pool.explicit.push({ name: 'deduct-utf16-tie', op: 'deduct', cities, owner: 1, cost: { drewno: 3 }, after: view(w1) });
  const w2 = clone(cities);
  const ret2 = S.creditOwnerResourceStock(w2, 1, 'drewno', 4);
  pool.explicit.push({ name: 'credit-utf16-tie', op: 'credit', cities, owner: 1, key: 'drewno', amount: 4, ret: ret2, after: view(w2) });
}
write('pool.json', pool);

// ======================================================================
// gate.json: bramki, prerekwizyty, Spichlerz, status nieaktywnego budynku
// ======================================================================
const gate = { constants };
const BUILDING_IDS = [...new Set([...realBuildings.map((b) => b.id), ...G.DEPOSIT_RUNTIME_GATED_BUILDING_IDS, 'mennica', 'spichlerz', 'spichlerz_ii',
  'unknown', '', 'port', 'port_wielki'])];
const WYM = [undefined, null, '', ' ', 'drewno', ' Drewno ', 'KAMIEN', 'kamień', 'glina', 'ruda', 'zelazo', 'stal', 'braz', 'sol', 'cegla',
  'ceramika', 'zloto', 'kon', 'wegiel', 'ruda_zelaza', 'xyz', '﻿sol', '\u0085sol', 'ZLOTO', 'Złoto'];
const encGB = (b) => {
  const o = { id: b.id };
  if (b.epokaWejscia !== undefined) o.epoka = b.epokaWejscia;
  if (b.wymaganySurowiec !== undefined) o.wym = b.wymaganySurowiec;
  return o;
};
const randGB = (idPool = BUILDING_IDS) => {
  const b = { id: pick(idPool), epokaWejscia: pick([1, 2, 3, undefined]) };
  const w = pick(WYM);
  if (w !== undefined) b.wymaganySurowiec = w;
  return b;
};
gate.required = [];
for (const id of BUILDING_IDS) {
  for (const w of WYM) {
    const b = { id, epokaWejscia: 1 };
    if (w !== undefined) b.wymaganySurowiec = w;
    gate.required.push({ b: encGB(b), out: G.buildingRequiredActiveLabels(b) });
  }
}

const BUILT_SETS = [undefined, [], ['cegielnia'], ['garncarnia'], ['cegielnia', 'garncarnia'], ['x'], ['stolarnia', 'kuznia'], ['mennica']];
const STOCK_SETS = [undefined, {}, { glina: 1 }, { glina: 0 }, { drewno: 5 }, { zloto: 1 }, { sol: 2, ruda: 1, kamien: 3 }, { glina: -1 },
  { glina: NaN }, { ceramika: 4, cegla: 4 }, { zloto: 0.5 }, { zloto: Infinity }, { zloto: NaN }, { drewno: 1, kamien: 1, glina: 1, ruda: 1 },
  { sol: 1 }, { ruda: 1 }, { kamien: 1 }, { cegla: 1 }, { ceramika: 1 }, { kon: 1 }, { braz: 1, zelazo: 1, stal: 1 }];
const LABELS = ['Drewno', 'Kamień', 'Glina', 'Ruda', 'Żelazo', 'Stal', 'Brąz', 'Sól', 'Cegła', 'Ceramika', 'Złoto', 'Koń', 'Węgiel', 'xyz', '',
  'drewno', 'Złoto (surowiec)', 'Ruda żelaza'];
gate.labelSatisfied = [];
for (const label of LABELS) {
  for (const built of BUILT_SETS) {
    for (const stock of STOCK_SETS) {
      const active = chance(0.3) ? ['Drewno'] : undefined;
      const bid = chance(0.3) ? 'garncarnia' : undefined;
      const entry = { label, built: clone(built), stock: clone(stock), out: G.empireResourceLabelSatisfied(label, active, clone(built), clone(stock), bid) };
      if (active) entry.active = active;
      if (bid) entry.bid = bid;
      gate.labelSatisfied.push(entry);
    }
  }
}
gate.accessOnly = LABELS.map((l) => ({ label: l, out: G.isAccessOnlyResourceLabel(l) }));
gate.resourceGate = [];
for (let i = 0; i < 2000; i++) {
  const b = randGB();
  const built = pick(BUILT_SETS);
  const stock = pick(STOCK_SETS);
  const active = chance(0.2) ? ['Drewno'] : undefined;
  const entry = { b: encGB(b), built: clone(built), stock: clone(stock), out: G.buildingResourceGateMet(b, active, clone(built), clone(stock)) };
  if (active) entry.active = active;
  gate.resourceGate.push(entry);
}
gate.hasRuntimeGate = BUILDING_IDS.map((id) => ({ id, out: G.hasDepositRuntimeGate(id) }));

// opcje runtime: resolver wstrzykniety (prawdziwa funkcja weba nie istnieje - jest domknieciem wolajacego)
function makeOptions(kind) {
  const calls = [];
  const resolver = (ownerId) => {
    calls.push(ownerId);
    return ownerId % 3 !== 1;
  };
  switch (kind) {
    case 'none': return { options: undefined, calls };
    case 'empty': return { options: {}, calls };
    case 'owner': return { options: { ownerId: 1 }, calls };
    case 'resolver-only': return { options: { resolveOwnerZlotoAccess: resolver }, calls };
    case 'resolver-owner0': return { options: { ownerId: 0, resolveOwnerZlotoAccess: resolver }, calls };
    case 'resolver-owner1': return { options: { ownerId: 1, resolveOwnerZlotoAccess: resolver }, calls };
    case 'resolver-owner2': return { options: { ownerId: 2, resolveOwnerZlotoAccess: resolver }, calls };
    case 'resolver-owner4': return { options: { ownerId: 4, resolveOwnerZlotoAccess: resolver }, calls };
    default: throw new Error(kind);
  }
}
const OPT_KINDS = ['none', 'empty', 'owner', 'resolver-only', 'resolver-owner0', 'resolver-owner1', 'resolver-owner2', 'resolver-owner4'];
const optionsOut = (kind, calls) => ({ kind, calls });
// wyniki resolvera jako tabela (Rust: domkniecie odczytuje z tabeli i zapisuje wywolania)
gate.resolverTable = { 0: true, 1: false, 2: true, 4: false };

gate.runtimeGate = [];
for (let i = 0; i < 1800; i++) {
  const b = chance(0.35) ? { id: 'mennica', epokaWejscia: 1 } : randGB();
  const active = chance(0.2) ? ['Drewno'] : undefined;
  const rtBuilt = pick(BUILT_SETS) ?? [];
  const stock = pick(STOCK_SETS);
  const kind = pick(OPT_KINDS);
  const { options, calls } = makeOptions(kind);
  const out = G.buildingRuntimeGateMet(b, active, clone(rtBuilt), clone(stock), options);
  const entry = { b: encGB(b), rtBuilt, stock: clone(stock), opt: optionsOut(kind, calls), out };
  if (active) entry.active = active;
  gate.runtimeGate.push(entry);
}
gate.missingLabels = [];
for (let i = 0; i < 1200; i++) {
  const b = chance(0.35) ? { id: 'mennica', epokaWejscia: 1 } : randGB();
  const rtBuilt = pick(BUILT_SETS) ?? [];
  const stock = pick(STOCK_SETS);
  const kind = pick(OPT_KINDS);
  const { options, calls } = makeOptions(kind);
  const out = G.missingRuntimeResourceLabels(b, clone(rtBuilt), clone(stock), options);
  gate.missingLabels.push({ b: encGB(b), rtBuilt, stock: clone(stock), opt: optionsOut(kind, calls), out });
}
const FILTER_POOL = ['garncarnia', 'cegielnia', 'stolarnia', 'kamieniarski', 'kuznia', 'odlewnia_brazu', 'mennica', 'spichlerz', 'spichlerz_ii',
  'x', 'port', 'swiatynia'];
gate.filter = [];
for (let i = 0; i < 900; i++) {
  const n = ri(0, 8);
  const built = Array.from({ length: n }, () => pick(FILTER_POOL));
  const stock = pick(STOCK_SETS);
  const kind = pick(OPT_KINDS);
  const { options, calls } = makeOptions(kind);
  const out = G.filterRuntimeActiveBuiltIds(clone(built), ['Drewno'], clone(stock), options);
  gate.filter.push({ built, stock: clone(stock), opt: optionsOut(kind, calls), out });
}

// prerekwizyty miasta: domkniecie = prawdziwe production.isBuildingSupersededByUpgrade z logiem wywolan
gate.prereq = [];
const PREREQS = [undefined, '', 'koszary', 'studnia', ['koszary', 'akademia_wojskowa'], [], ['x'], ['biblioteka', ''], 'mury', ['a', 'b', 'c']];
const PB_IDS = ['koszary', 'akademia_wojskowa', 'studnia', 'biblioteka', 'mury', 'a', 'b', 'c', 'x', 'cytadela', 'laznia_publiczna'];
for (let i = 0; i < 1500; i++) {
  const prereq = pick(PREREQS);
  const built = Array.from({ length: ri(0, 4) }, () => pick(PB_IDS));
  const buildings = Array.from({ length: ri(0, 5) }, () => {
    const b = { id: pick(PB_IDS) };
    if (chance(0.6)) b.upgradeFrom = pick(PB_IDS);
    return b;
  });
  const calls = [];
  const isSup = (id, bl, bs) => {
    const result = P.isBuildingSupersededByUpgrade(id, bl, bs);
    calls.push({ id, built: [...bl], buildings: bs.map((x) => ({ ...x })), out: result });
    return result;
  };
  const out = G.cityBuildingPrereqMet(clone(prereq), built, buildings, isSup);
  gate.prereq.push({ prereq: clone(prereq), built, buildings, calls, out });
}
// z prawdziwymi danymi (buildings.json upgradeFrom) dla kazdego wpisu CITY_BUILDING_PREREQ
for (const [bid, prereq] of Object.entries(G.CITY_BUILDING_PREREQ)) {
  for (let i = 0; i < 12; i++) {
    const built = realBuildings.map((b) => b.id).filter(() => chance(0.15));
    const buildings = realBuildings.map((b) => (b.upgradeFrom ? { id: b.id, upgradeFrom: b.upgradeFrom } : { id: b.id }));
    const calls = [];
    const isSup = (id, bl, bs) => {
      const result = P.isBuildingSupersededByUpgrade(id, bl, bs);
      calls.push({ id, built: [...bl], buildings: bs.map((x) => ({ ...x })), out: result });
      return result;
    };
    const out = G.cityBuildingPrereqMet(G.CITY_BUILDING_PREREQ[bid], built, buildings, isSup);
    gate.prereq.push({ real: bid, prereq: clone(prereq), built, buildings, calls, out });
  }
}

// zloto-access (prawdziwy kod weba) - wejscia Rust
gate.mennica = [];
for (const stock of [undefined, null, {}, { zloto: 0 }, { zloto: 0.5 }, { zloto: 1 }, { zloto: 2 }, { zloto: -1 }, { zloto: NaN }, { zloto: Infinity },
  { zloto: 'x' }, { sol: 5 }]) {
  for (const grace of [undefined, true, false]) {
    gate.mennica.push({ stock: clone(stock), grace, out: Z.ownerCanFeedMennica(clone(stock), grace) });
  }
}

// Spichlerz
const SP_IDS = ['spichlerz', 'spichlerz_ii', 'x', 'stolarnia'];
const randSpBuilt = () => SP_IDS.filter(() => chance(0.5));
gate.spDrain = [];
for (let i = 0; i < 1200; i++) {
  const cities = randCities({ extra: false, dupIds: true });
  const owner = pick([1, 1, 2, 0]);
  const built = randSpBuilt();
  const dry = pick([undefined, false, true]);
  const work = clone(cities);
  const out = G.paySpichlerzDrainForCity(work, owner, built, dry);
  const entry = { cities: clone(cities), owner, built, out, after: view(work) };
  if (dry !== undefined) entry.dry = dry;
  gate.spDrain.push(entry);
}
// rozszerzenie: miasta z duzymi zapasami Ceramiki/Soli (drain faktycznie schodzi)
for (let i = 0; i < 600; i++) {
  const cities = randCities({ dupIds: true }).map((c) => {
    if (c.surowce) {
      c.surowce.ceramika = pick([0, 10, 15, 25, 30, 60]);
      c.surowce.sol = pick([0, 10, 15, 25, 30, 60]);
    }
    return c;
  });
  const owner = pick([1, 1, 2]);
  const built = randSpBuilt();
  const dry = pick([undefined, false, true]);
  const work = clone(cities);
  const out = G.paySpichlerzDrainForCity(work, owner, built, dry);
  const entry = { cities: clone(cities), owner, built, out, after: view(work) };
  if (dry !== undefined) entry.dry = dry;
  gate.spDrain.push(entry);
}
gate.spState = [];
for (let mask = 0; mask < 8; mask++) {
  const built = SP_IDS.slice(0, 3).filter((_, i) => mask & (1 << i));
  for (const ceramikaPaid of [false, true]) {
    for (const solPaid of [false, true]) {
      const drain = { ceramikaPaid, solPaid };
      gate.spState.push({ built, drain, out: G.resolveSpichlerzCityBonusState(built, drain) });
    }
  }
}
gate.spBonus = [];
for (let mask = 0; mask < 16; mask++) {
  const st = { ceramikaActive: !!(mask & 1), solActive: !!(mask & 2), maSpichlerzPop: !!(mask & 4), maSpichlerzIIPop: !!(mask & 8) };
  const entry = {
    state: st,
    health: G.spichlerzHealthBonus(st),
    growth: G.spichlerzGrowthBonusPercent(st),
    ration: G.spichlerzRationFoodCostMultiplier(st),
    happiness: [],
    yields: [],
  };
  for (const jb of [undefined, 2, 0, 5, -1, 0.5, NaN, Infinity]) {
    const e = { out: G.spichlerzHappinessBonusFromJson(st, jb) };
    if (jb !== undefined) e.json = jb;
    entry.happiness.push(e);
  }
  for (let i = 0; i < 25; i++) {
    const built = Array.from({ length: ri(0, 5) }, () => pick(SP_IDS));
    entry.yields.push({ built, out: G.builtIdsForSpichlerzYields(built, st) });
  }
  gate.spBonus.push(entry);
}
gate.spArmy = [];
for (const sol of [false, true]) {
  for (const own of [false, true]) {
    for (const garrison of [false, true]) {
      gate.spArmy.push({ sol, own, garrison, out: G.spichlerzArmyFoodCostMultiplier({ solArmyBonusActive: sol, onOwnTerritory: own, isGarrisonInSolCity: garrison }) });
    }
  }
}
gate.spHas = [];
for (let i = 0; i < 40; i++) {
  const built = Array.from({ length: ri(0, 4) }, () => pick(SP_IDS));
  gate.spHas.push({ built, out: G.cityHasSpichlerzBuilding(built) });
}

// resolveOwnedBuildingInactiveStatus
gate.inactive = [];
const INACTIVE_IDS = ['spichlerz', 'spichlerz_ii', ...G.DEPOSIT_RUNTIME_GATED_BUILDING_IDS, 'swiatynia', 'x', 'port'];
for (let i = 0; i < 1800; i++) {
  const buildingId = pick(INACTIVE_IDS);
  const cities = randCities({ dupIds: true }).map((c) => {
    if (c.surowce && chance(0.7)) {
      c.surowce.ceramika = pick([0, 10, 25, 30, 60]);
      c.surowce.sol = pick([0, 10, 25, 30, 60]);
      c.surowce.zloto = pick([0, 0, 1, 2]);
    }
    return c;
  });
  const owner = pick([1, 1, 2, 0]);
  const builtIds = chance(0.6) ? [...new Set([...randSpBuilt(), buildingId])] : randSpBuilt();
  const rtBuilt = pick(BUILT_SETS) ?? [];
  const stock = pick(STOCK_SETS);
  const kind = pick(['none', 'resolver-owner0', 'resolver-owner1', 'resolver-owner2', 'resolver-owner4', 'resolver-only']);
  const { options, calls } = makeOptions(kind);
  const opts = { builtIds, allCities: clone(cities), ownerId: owner, runtimeActiveBuiltIds: rtBuilt };
  if (stock !== undefined) opts.empireStock = clone(stock);
  let bld;
  if (chance(0.5)) {
    bld = { id: buildingId, epokaWejscia: 1 };
    const w = pick(WYM);
    if (w !== undefined) bld.wymaganySurowiec = w;
    opts.building = bld;
  }
  if (options && options.resolveOwnerZlotoAccess) opts.resolveOwnerZlotoAccess = options.resolveOwnerZlotoAccess;
  const out = G.resolveOwnedBuildingInactiveStatus(buildingId, opts);
  const entry = { buildingId, cities, owner, builtIds, rtBuilt, stock: clone(stock), opt: optionsOut(kind, calls), out };
  if (bld) entry.building = encGB(bld);
  gate.inactive.push(entry);
}
// filter z ROZNYMI activeLabels (drugi parametr): osobny generator liczb losowych, zeby nie przesunac
// strumienia wczesniejszych blokow (wektory poprzednie pozostaja bajt w bajt)
{
  const rnd2 = mulberry32(0x67b0face);
  const pick2 = (arr) => arr[Math.floor(rnd2() * arr.length)];
  const LABEL_POOL = ['Drewno', 'Glina', 'Sol', 'Sól', 'Kamień', 'Ruda', 'Złoto', 'Ceramika', 'Cegła', 'x', ''];
  gate.filterLabels = [];
  for (let i = 0; i < 600; i++) {
    const n = Math.floor(rnd2() * 9);
    const built = Array.from({ length: n }, () => pick2(FILTER_POOL));
    const nl = Math.floor(rnd2() * 5);
    const labels = Array.from({ length: nl }, () => pick2(LABEL_POOL));
    const stock = pick2(STOCK_SETS);
    const kind = pick2(OPT_KINDS);
    const { options, calls } = makeOptions(kind);
    const out = G.filterRuntimeActiveBuiltIds(clone(built), clone(labels), clone(stock), options);
    gate.filterLabels.push({ built, labels, stock: clone(stock), opt: optionsOut(kind, calls), out });
  }
}
write('gate.json', gate);

console.log('wektory: cost.json nfd.json pool.json gate.json -> ' + outDir);
