// P6.23 (P6.2 + P6.3) - wektory z URUCHOMIONEGO weba (pin edb8fb56) dla:
//   gra/src/game/order.ts                (Porzadek: loadOrderParams, computeOrder, orderTier, orderEffects, ...)
//   gra/src/game/terrain-improvements.ts (katalog ulepszen terenu, skale kosztow, produkcja terytorialna, ...)
//   gra/src/game/city-hex-movement.ts    (zajmowanie heksu miasta)
//   gra/src/game/fort-territory.ts       (rejestr fortow/posterunkow, przejecie, ewakuacja)
//   zaleznosci: gra/src/map/territory.ts (axialDistance, cityTerritoryRadius), game/okolica.ts (cityRangeForPopulation)
// Kod weba jest ladowany BEZ stubow (loader dopisuje tylko .ts i traktuje .json jako modul).
// Wejscia deterministyczne (LCG), wyniki = to, co zwrocil prawdziwy kod weba.
//
// Uzycie:
//   node --experimental-transform-types --no-warnings --import ./p623-loader-register.mjs \
//     ./gen-p623-vectors.mjs <WEB_ROOT> <OUT_DIR>
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
const quiet = (fn) => {
  console.log = () => {};
  console.warn = () => {};
  try {
    return fn();
  } finally {
    console.log = origLog;
    console.warn = origWarn;
  }
};

const order = await import(src('game/order.ts'));
const ti = await import(src('game/terrain-improvements.ts'));
const chm = await import(src('game/city-hex-movement.ts'));
const fort = await import(src('game/fort-territory.ts'));
const territory = await import(src('map/territory.ts'));
const okolica = await import(src('game/okolica.ts'));
const society = JSON.parse(readFileSync(join(webRoot, 'gra/data/society-params.json'), 'utf8'));
const improvementsJson = JSON.parse(readFileSync(join(webRoot, 'gra/data/terrain-improvements.json'), 'utf8'));

// ---------------------------------------------------------------------------
// kodowanie JSON: NaN / +-Infinity / -0 -> {"$n": "..."}; undefined -> pominiete
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
  if (v instanceof Set) return { $set: [...v].map(enc) };
  if (v instanceof Map) return { $map: [...v.entries()].map(([k, x]) => [enc(k), enc(x)]) };
  if (Array.isArray(v)) return v.map((x) => (x === undefined ? { $u: 1 } : enc(x)));
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

// deterministyczny LCG (wejscia testowe, NIE logika gry)
let seedState = 0x1234abcd;
function rnd() {
  seedState = (Math.imul(seedState, 1664525) + 1013904223) >>> 0;
  return seedState / 4294967296;
}
const rint = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const NAN = Number.NaN;
const INF = Number.POSITIVE_INFINITY;

// ===========================================================================
// order.ts
// ===========================================================================
const orderCases = { loadOrderParams: [], computeOrder: [], orderTier: [], orderEffects: [], evaluateOrder: [], orderEffectsToYieldMults: [], pickRevoltMigrationTarget: [], happinessBreakdown: [] };

const societies = {
  real: society,
  nullSociety: null,
  empty: {},
  emptyPorzadek: { porzadek: {} },
  falsyPorzadek: { porzadek: 0 },
  numberPorzadek: { porzadek: 5 },
  arrayPorzadek: { porzadek: [] },
  partialT2: { porzadek: { porzadek_prog_t2: { easy: 3, normal: 9, hard: 12 } } },
  stringValue: { porzadek: { porzadek_waga_prawo: { easy: 'x', normal: 'x', hard: 'x' }, porzadek_prog_t1: { easy: 1 } } },
  rowNotObject: { porzadek: { porzadek_waga_szczescie: 5, porzadek_waga_prawo: 'abc', porzadek_prog_t1: true } },
  capOverride: { szczescie: { szczescie_pct_cap: { easy: 100, normal: 150, hard: 99 } } },
  capNotObject: { szczescie: 5 },
  capRowBad: { szczescie: { szczescie_pct_cap: { normal: 'zz' } } },
  allCustom: {
    porzadek: {
      porzadek_waga_szczescie: { easy: 0.3, normal: 0.7, hard: 1 },
      porzadek_waga_prawo: { easy: 0.7, normal: 0.3, hard: 0 },
      porzadek_prog_t1: { easy: -4, normal: 2, hard: 5 },
      porzadek_prog_t2: { easy: 1, normal: 8, hard: 3 },
      porzadek_kara_produkcja_t1: { easy: -1.5, normal: -0.3, hard: 0.2 },
      porzadek_kara_pieniadz_t1: { easy: -0.05, normal: -2, hard: -0.5 },
      porzadek_kara_nauka_t1: { easy: -0.1, normal: -0.2, hard: -0.3 },
      porzadek_kara_kultura_t1: { easy: 0, normal: -0.4, hard: -1 },
      porzadek_kara_wzrost_t1: { easy: -0.25, normal: -1.0000001, hard: -0.99 },
      porzadek_ryzyko_buntu_t1: { easy: 1.5, normal: -0.2, hard: 0.5 },
      porzadek_bonus_produkcja_t2: { easy: 0.2, normal: 0, hard: -0.1 },
      porzadek_bonus_handel_t2: { easy: 0.15, normal: 0.33, hard: 2 },
    },
    szczescie: { szczescie_pct_cap: { easy: 77, normal: 88, hard: 66 } },
  },
};
const socialNames = Object.keys(societies);
const difficulties = ['easy', 'normal', 'hard'];
const loadedParams = {}; // 'societyName/difficulty' -> OrderParams z weba
for (const sn of socialNames) {
  for (const d of difficulties) {
    const out = order.loadOrderParams(societies[sn], d);
    loadedParams[`${sn}/${d}`] = out;
    orderCases.loadOrderParams.push({ society: sn, difficulty: d, out: enc(out) });
  }
}
// bez argumentu difficulty (domyslnie 'normal') i z undefined society
orderCases.loadOrderParams.push({ society: 'real', difficulty: null, out: enc(order.loadOrderParams(society)) });
orderCases.loadOrderParams.push({ society: 'undefinedSociety', difficulty: 'normal', out: enc(order.loadOrderParams(undefined, 'normal')) });

const paramSets = {
  fallback: order.FALLBACK_ORDER_PARAMS,
  realNormal: loadedParams['real/normal'],
  realEasy: loadedParams['real/easy'],
  realHard: loadedParams['real/hard'],
  weights37: { ...order.FALLBACK_ORDER_PARAMS, wagaSzczescie: 0.3, wagaPrawo: 0.7 },
  weights05: { ...order.FALLBACK_ORDER_PARAMS, wagaSzczescie: 0.5, wagaPrawo: 0.5 },
  degenerate: { ...order.FALLBACK_ORDER_PARAMS, progT1: 5, progT2: 3 },
  extreme: {
    ...order.FALLBACK_ORDER_PARAMS,
    karaProdukcjaT1: -1.5, karaPieniadzT1: -2, karaNaukaT1: -1, karaKulturaT1: -0.0001, karaWzrostT1: -5,
    ryzykoBuntuT1: 1.7, bonusProdukcjaT2: 0.4, bonusHandelT2: -0.2,
  },
  riskNeg: { ...order.FALLBACK_ORDER_PARAMS, ryzykoBuntuT1: -0.3 },
  riskNan: { ...order.FALLBACK_ORDER_PARAMS, ryzykoBuntuT1: NAN },
  riskInf: { ...order.FALLBACK_ORDER_PARAMS, ryzykoBuntuT1: INF },
  noCap: (() => { const p = { ...order.FALLBACK_ORDER_PARAMS }; delete p.porPctCap; return p; })(),
};
const paramNames = Object.keys(paramSets);

const pts = [-30, -12.5, -7.5, -5, -2.5, -1.5, -1, -0.5, -0.1, 0, 0.1, 0.5, 1, 1.5, 2.5, 3, 5.5, 6, 7, 12.3, 100, NAN, INF, -INF];
for (const pn of ['fallback', 'realNormal', 'realEasy', 'realHard', 'weights37', 'weights05']) {
  for (const s of pts) {
    for (const p of pts) {
      orderCases.computeOrder.push({ params: pn, inputs: enc({ szczescie: s, prawo: p }), out: enc(order.computeOrder({ szczescie: s, prawo: p }, paramSets[pn])) });
    }
  }
}
// bez parametrow (domyslne FALLBACK)
for (const [s, p] of [[3, 5], [-5, 0], [1, 1], [NAN, 8]]) {
  orderCases.computeOrder.push({ params: null, inputs: enc({ szczescie: s, prawo: p }), out: enc(order.computeOrder({ szczescie: s, prawo: p })) });
}
// polowki zaokraglenia (Math.round: .5 -> w gore, takze dla ujemnych)
for (let n = -20; n <= 20; n++) {
  const s = n * 0.5;
  orderCases.computeOrder.push({ params: 'weights05', inputs: enc({ szczescie: s, prawo: 0 }), out: enc(order.computeOrder({ szczescie: s, prawo: 0 }, paramSets.weights05)) });
  orderCases.computeOrder.push({ params: 'weights05', inputs: enc({ szczescie: s, prawo: s }), out: enc(order.computeOrder({ szczescie: s, prawo: s }, paramSets.weights05)) });
}
// przypadek brzegowy Math.round(0.49999999999999994)
orderCases.computeOrder.push({
  params: 'edgeHalf', paramsInline: enc({ ...order.FALLBACK_ORDER_PARAMS, wagaSzczescie: 1, wagaPrawo: 0 }),
  inputs: enc({ szczescie: 0.49999999999999994, prawo: 0 }),
  out: enc(order.computeOrder({ szczescie: 0.49999999999999994, prawo: 0 }, { ...order.FALLBACK_ORDER_PARAMS, wagaSzczescie: 1, wagaPrawo: 0 })),
});
orderCases.computeOrder.push({
  params: 'edgeHalf', paramsInline: enc({ ...order.FALLBACK_ORDER_PARAMS, wagaSzczescie: 1, wagaPrawo: 0 }),
  inputs: enc({ szczescie: -0.5000000000000001, prawo: 0 }),
  out: enc(order.computeOrder({ szczescie: -0.5000000000000001, prawo: 0 }, { ...order.FALLBACK_ORDER_PARAMS, wagaSzczescie: 1, wagaPrawo: 0 })),
});

const orderValues = [-100, -3, -1, -0.5, 0, 0.5, 1, 2, 3, 4, 5, 5.5, 6, 7, 20, NAN, INF, -INF];
for (const pn of paramNames) {
  for (const o of orderValues) {
    orderCases.orderTier.push({ params: pn, order: enc(o), out: order.orderTier(o, paramSets[pn]) });
  }
}
orderCases.orderTier.push({ params: null, order: 3, out: order.orderTier(3) });
for (const pn of paramNames) {
  for (const tier of ['unrest', 'neutral', 'order']) {
    orderCases.orderEffects.push({ params: pn, tier, out: enc(order.orderEffects(tier, paramSets[pn])) });
  }
}
orderCases.orderEffects.push({ params: null, tier: 'order', out: enc(order.orderEffects('order')) });
orderCases.orderEffects.push({ params: 'fallback', tier: 'bogus', out: enc(order.orderEffects('bogus', paramSets.fallback)) });
for (const pn of paramNames) {
  for (const s of [-30, -8, -1, 0, 3, 6, 11, 25]) {
    for (const p of [-10, 0, 4, 20]) {
      orderCases.evaluateOrder.push({ params: pn, inputs: enc({ szczescie: s, prawo: p }), out: enc(order.evaluateOrder({ szczescie: s, prawo: p }, paramSets[pn])) });
    }
  }
}
orderCases.evaluateOrder.push({ params: null, inputs: { szczescie: 20, prawo: 20 }, out: enc(order.evaluateOrder({ szczescie: 20, prawo: 20 })) });
for (const pn of paramNames) {
  for (const tier of ['unrest', 'neutral', 'order']) {
    const eff = order.orderEffects(tier, paramSets[pn]);
    orderCases.orderEffectsToYieldMults.push({ tier, effects: enc(eff), out: enc(order.orderEffectsToYieldMults(tier, eff)) });
  }
}
// pickRevoltMigrationTarget
{
  const mkCities = () => {
    const n = rint(0, 7);
    const cs = [];
    for (let i = 0; i < n; i++) cs.push({ id: `c${i}`, ownerId: rint(1, 2), population: pick([0, 1, 2, 5, 9, 0.5]) });
    return cs;
  };
  const mkOrders = (cs) => {
    const m = [];
    for (const c of cs) {
      const roll = rnd();
      if (roll < 0.15) continue; // brak wpisu -> 0
      m.push([c.id, roll < 0.25 ? NAN : pick([-5, -1, 0, 0, 1, 2, 2, 3, 6, 6, 7.5, INF, -INF])]);
    }
    return m;
  };
  for (let i = 0; i < 400; i++) {
    const cs = mkCities();
    const ordArr = mkOrders(cs);
    const sourceId = cs.length > 0 && rnd() < 0.8 ? pick(cs).id : 'c-none';
    const ownerId = rint(1, 2);
    const out = order.pickRevoltMigrationTarget(sourceId, ownerId, cs, new Map(ordArr));
    orderCases.pickRevoltMigrationTarget.push({ sourceId, ownerId, cities: enc(cs), orders: enc(ordArr), out });
  }
}
// happinessBreakdown
{
  const pops = [-3, 0, 0.4, 1, 2, 3, 7, 10, 10.9, 19, 20, 33, 100, 1000, NAN, INF, -INF];
  const hs = [-60, -25, -20, -19.9, -10, -5, -1, -0.1, 0, 0.1, 1, 5, 7.77, 10, 19.99, 20, 21, 60, NAN, INF, -INF];
  for (const pop of pops) for (const h of hs) {
    orderCases.happinessBreakdown.push({ population: enc(pop), szczescie: enc(h), out: enc(order.happinessBreakdown(pop, h)) });
  }
}

const orderOut = {
  meta: { pin_web: 'edb8fb56', plik: 'gra/src/game/order.ts', generator: 'gen-p623-vectors.mjs' },
  societies: Object.fromEntries(Object.entries(societies).filter(([k]) => k !== 'real')),
  society_real_subset: {
    porzadek: society.porzadek,
    szczescie: { szczescie_pct_cap: society.szczescie?.szczescie_pct_cap },
  },
  paramSets: Object.fromEntries(Object.entries(paramSets).map(([k, v]) => [k, enc(v)])),
  fallback_order_params: enc(order.FALLBACK_ORDER_PARAMS),
  cases: orderCases,
};
writeFileSync(join(outDir, 'order.json'), JSON.stringify(orderOut));

// ===========================================================================
// terrain-improvements.ts
// ===========================================================================
const K = [...ti.IMPROVEMENT_KEYS, '_meta', '_miasto_zasieg_ref', 'pastwisko', 'kopalnia', 'brak', '', 'unknown', 'FARMA', 'farma ', 'zloto'];
const KN = [...K, null, undefined];
const NAKL = ['brak', 'las', 'zloze_gliny', 'zloze_rudy', 'zloze_konia', 'zloze_owiec', 'zloze_bydla', 'zloze_lamy', undefined];
const ZLOZE = [undefined, null, '', 'glina', 'miedz', 'ruda', 'zelazo', 'zloto', 'sol', 'wegiel', '  GLINA  ', 'Zelazo', 'inne', 'kon'];
const TEREN = ['laka', 'rownina', 'wzgorza', 'gory', 'plytkie_morze', 'morze', 'pustynia', 'polarny'];
const ERAS = [undefined, null, -3, 0, 0.9, 1, 1.9, 2, 2.5, 3, 4, 5, 6, 7.9, 10, 40, 1100, NAN, INF, -INF];
const tiCases = {};
const tc = (name) => (tiCases[name] ??= []);

for (const k of KN) {
  tc('normalizeImprovementKey').push({ key: enc(k), out: enc(ti.normalizeImprovementKey(k)) });
  if (typeof k === 'string') {
    tc('improvementBonusForKey').push({ key: k, out: enc(ti.improvementBonusForKey(k)) });
    tc('terrainImprovementEraForKey').push({ key: k, out: enc(ti.terrainImprovementEraForKey(k)) });
    tc('improvementDisplayName').push({ key: k, out: enc(ti.improvementDisplayName(k)) });
    tc('isLivestockImprovementKey').push({ key: k, out: ti.isLivestockImprovementKey(k) });
    tc('improvementAllowedCivs').push({ key: k, out: enc(ti.improvementAllowedCivs(k)) });
  } else {
    tc('terrainImprovementEraForKey').push({ key: enc(k), out: enc(ti.terrainImprovementEraForKey(k)) });
  }
}
// prototypowe klucze obiektu: normalizeImprovementKey zwraca je w webie (osobliwosc JS), Rust zwraca None
const protoKeys = ['constructor', 'toString', 'hasOwnProperty', '__proto__'];
const knownDivergence = protoKeys.map((k) => ({
  key: k,
  web_normalize: enc(ti.normalizeImprovementKey(k)),
  web_improvementKeysForHex: enc(ti.improvementKeysForHex({ ulepszenie: k })),
}));

const CIVS = [undefined, null, '', ' ', 'inkowie', 'INKOWIE', ' Inkowie ', 'chinczycy', 'rzymianie'];
for (const k of K) for (const c of CIVS) {
  tc('isImprovementAllowedForCiv').push({ key: k, civ: enc(c), out: ti.isImprovementAllowedForCiv(k, c) });
}

const hexSamples = [];
for (const n of NAKL) for (const z of ZLOZE) {
  if (rnd() < 0.35) hexSamples.push({ nakladka: n, zloze: z });
}
hexSamples.push({}, { nakladka: 'zloze_rudy', zloze: 'wegiel' }, { nakladka: 'zloze_rudy', zloze: 'zelazo' }, { zloze: 'wegiel' });
for (const key of ['kopalnia', 'farma', 'tartak', '', 'KOPALNIA']) {
  tc('migrateLegacyKopalniaKey').push({ key, hex: null, out: enc(ti.migrateLegacyKopalniaKey(key)) });
  for (const h of hexSamples) {
    tc('migrateLegacyKopalniaKey').push({ key, hex: enc(h), out: enc(ti.migrateLegacyKopalniaKey(key, h)) });
  }
}
for (let i = 0; i < 80; i++) {
  const layers = Array.from({ length: rint(0, 5) }, () => pick(['kopalnia', 'kopalnia', 'farma', 'tartak', 'droga', 'kopalnia_zelaza']));
  const h = rnd() < 0.2 ? undefined : pick(hexSamples);
  tc('migrateImprovementLayers').push({ layers, hex: enc(h), out: ti.migrateImprovementLayers(layers, h) });
}

for (const e of ERAS) {
  tc('terrainImprovementEraMultiplier').push({ era: enc(e), out: enc(ti.terrainImprovementEraMultiplier(e)) });
}
const BASES = [-1, 0, 0.2, 0.25, 0.5, 0.75, 1, 1.25, 2.5, 3, 15, 22, 25, 30, 99.5, 1e9, NAN, INF, -INF];
for (const b of BASES) {
  for (const e of ERAS) {
    tc('scaleTerrainImprovementWorkCost').push({ base: enc(b), era: enc(e), out: enc(ti.scaleTerrainImprovementWorkCost(b, e)) });
  }
  tc('scaleTerrainImprovementWorkCost').push({ base: enc(b), era: '$omit', out: enc(ti.scaleTerrainImprovementWorkCost(b)) });
}
for (const k of ['tartak', 'kamieniolom', 'glinianka', 'farma', 'zloto', '']) {
  for (const b of [-5, 0, 1, 2.5, 3.5, 7, 10, 50, 200, 1.3, NAN]) {
    for (const e of ERAS) {
      tc('resourceProductionAmountForEra').push({ key: k, base: enc(b), era: enc(e), out: enc(ti.resourceProductionAmountForEra(k, b, e)) });
    }
  }
}
for (const k of KN) {
  for (const e of ERAS) {
    for (const z of [undefined, 'glina']) {
      tc('territoryResourceYieldForImprovement').push({ key: enc(k), zloze: enc(z), era: enc(e), out: enc(ti.territoryResourceYieldForImprovement(k, z, e)) });
    }
  }
}
for (let i = 0; i < 60; i++) {
  const keys = Array.from({ length: rint(0, 6) }, () => pick(['kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_miedzi', 'farma', 'pastwisko', 'kopalnia', 'xx', 'tartak']));
  tc('oreYieldFromImprovements').push({ keys, zloze: enc(pick(ZLOZE)), out: enc(ti.oreYieldFromImprovements(keys, pick(ZLOZE))) });
}
{
  const yieldStarts = [
    { zywnosc: 0, praca: 0, handel: 0, drewno: 0, kamien: 0, glina: 0, ruda: 0, ruda_zelaza: 0 },
    { zywnosc: 2, praca: 1, handel: 3, drewno: 4, kamien: 5, glina: 6, ruda: 7, ruda_zelaza: 8 },
    { zywnosc: -1.5, praca: 0.25, handel: 10, drewno: 0.5, kamien: -2, glina: 1e3, ruda: 3, ruda_zelaza: 0 },
  ];
  for (const k of KN) {
    for (const y0 of yieldStarts) {
      const y = { ...y0 };
      ti.applyImprovementBonus(y, k);
      tc('applyImprovementBonus').push({ key: enc(k), yield: y0, out: enc(y) });
    }
  }
  for (let i = 0; i < 80; i++) {
    const keys = Array.from({ length: rint(0, 6) }, () => pick(K));
    const y0 = pick(yieldStarts);
    const y = { ...y0 };
    ti.applyImprovementBonuses(y, keys);
    tc('applyImprovementBonuses').push({ keys, yield: y0, out: enc(y) });
  }
}
for (const n of NAKL) {
  tc('foodLayerFromAnimalDeposit').push({ nakladka: enc(n), out: enc(ti.foodLayerFromAnimalDeposit(n)) });
}

const hexLikes = [];
{
  const layerPool = ['farma', 'irygacja', 'droga', 'droga_brukowana', 'pastwisko', 'kopalnia', 'tartak', 'brak', 'xx', 'bydlo', 'owce', 'lama', 'glinianka', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_zlota', 'warzelnia_soli', 'stadnina', 'fort', 'tarasy'];
  for (let i = 0; i < 260; i++) {
    const h = {};
    const mode = rint(0, 4);
    if (mode === 0) h.ulepszenia = Array.from({ length: rint(0, 4) }, () => pick(layerPool));
    else if (mode === 1) h.ulepszenia = null;
    else if (mode === 2) h.ulepszenie = pick(layerPool);
    else if (mode === 3) { h.ulepszenia = []; h.ulepszenie = pick(layerPool); }
    if (rnd() < 0.7) h.nakladka = pick(NAKL);
    if (rnd() < 0.7) h.zloze = pick(ZLOZE);
    hexLikes.push(h);
  }
}
for (const h of hexLikes) {
  tc('improvementKeysForHex').push({ hex: enc(h), out: enc(ti.improvementKeysForHex(h)) });
  tc('hexHasCoveringTerrainImprovement').push({ hex: enc(h), out: ti.hexHasCoveringTerrainImprovement(h) });
  tc('hexSuppressesDepositOverlay').push({ hex: enc(h), extra: '$omit', out: ti.hexSuppressesDepositOverlay(h) });
  const extra = pick([[], ['farma'], ['kopalnia_zelaza', 'xx'], ['glinianka', 'pastwisko'], ['stadnina']]);
  tc('hexSuppressesDepositOverlay').push({ hex: enc(h), extra, out: ti.hexSuppressesDepositOverlay(h, extra) });
}
for (const k of K) {
  for (const n of NAKL) {
    for (const z of ZLOZE) {
      if (rnd() < 0.5) {
        const hex = { nakladka: n, zloze: z };
        tc('improvementHidesDepositOnHex').push({ key: k, hex: enc(hex), out: ti.improvementHidesDepositOnHex(k, hex) });
      }
    }
  }
}
{
  const keyLists = [[], ['farma'], ['irygacja'], ['tarasy'], ['bydlo'], ['owce'], ['lama'], ['oboz_lowiecki'], ['lodzie_rybackie'], ['droga'], ['tartak'], ['pastwisko'], ['kopalnia'], ['xx', 'farma'], ['droga', 'kamieniolom']];
  for (const t of TEREN) for (const n of NAKL.filter((x) => x !== undefined)) for (const keys of keyLists) {
    tc('foodPotentialForHex').push({ teren: t, nakladka: n, keys, out: enc(ti.foodPotentialForHex(t, n, keys)) });
  }
}

const tiOut = {
  meta: { pin_web: 'edb8fb56', plik: 'gra/src/game/terrain-improvements.ts', generator: 'gen-p623-vectors.mjs' },
  constants: enc({
    IMPROVEMENT_KEYS: ti.IMPROVEMENT_KEYS,
    TERRAIN_IMPROVEMENT_ERA_MULTIPLIERS: ti.TERRAIN_IMPROVEMENT_ERA_MULTIPLIERS,
    ORE_YIELD_PER_MINE: ti.ORE_YIELD_PER_MINE,
    TERRITORY_YIELD_DEFAULT_AMOUNT: ti.TERRITORY_YIELD_DEFAULT_AMOUNT,
    ROAD_IMPROVEMENT_KEYS: [...ti.ROAD_IMPROVEMENT_KEYS],
    LIVESTOCK_IMPROVEMENT_KEYS: ti.LIVESTOCK_IMPROVEMENT_KEYS,
    FARMA_POTENTIAL_FOOD_BONUS: ti.FARMA_POTENTIAL_FOOD_BONUS,
    FOREST_FOOD_POTENTIAL_PENALTY: ti.FOREST_FOOD_POTENTIAL_PENALTY,
    RESOURCE_UPKEEP_IMPROVEMENT_KEYS: [...ti.RESOURCE_UPKEEP_IMPROVEMENT_KEYS],
  }),
  json_keys_in_order: Object.keys(improvementsJson),
  known_divergence_prototype_keys: knownDivergence,
  cases: tiCases,
};
writeFileSync(join(outDir, 'improvements.json'), JSON.stringify(tiOut));

// ===========================================================================
// city-hex-movement.ts
// ===========================================================================
const hexCases = { cityAtHex: [], canUnitOccupyCityHex: [], canAiEnterEmptyEnemyCity: [], foreignCityHexKeys: [], addForeignCityBlocks: [] };
{
  const BUILD = ['palisada', 'mury', 'fort', 'baszta', 'koszary', 'spichlerz', 'MURY', 'wieza'];
  const mkCity = () => {
    const c = { q: rint(-3, 3), r: rint(-3, 3), ownerId: rint(1, 3) };
    const m = rnd();
    if (m < 0.25) c.maMur = true;
    else if (m < 0.5) c.maMur = false;
    return c;
  };
  for (let i = 0; i < 120; i++) {
    const cities = Array.from({ length: rint(0, 6) }, mkCity);
    const q = rint(-4, 4);
    const r = rint(-4, 4);
    const owner = rint(1, 3);
    hexCases.cityAtHex.push({ q, r, cities: enc(cities), out: enc(chm.cityAtHex(q, r, cities)) });
    hexCases.canUnitOccupyCityHex.push({ owner, q, r, cities: enc(cities), out: chm.canUnitOccupyCityHex(owner, q, r, cities) });
    const keys = chm.foreignCityHexKeys(owner, cities);
    hexCases.foreignCityHexKeys.push({ owner, cities: enc(cities), out: [...keys] });
    const occupied = new Set(Array.from({ length: rint(0, 4) }, () => `${rint(-4, 4)},${rint(-4, 4)}`));
    hexCases.addForeignCityBlocks.push({ occupied: [...occupied], owner, cities: enc(cities), out: [...chm.addForeignCityBlocks(occupied, owner, cities)] });
  }
  for (let i = 0; i < 700; i++) {
    const city = mkCity();
    const built = Array.from({ length: rint(0, 4) }, () => pick(BUILD));
    const owner = rint(1, 3);
    const uq = city.q + rint(-3, 3);
    const ur = city.r + rint(-3, 3);
    const hasDef = rnd() < 0.3;
    const civ = rnd() < 0.3;
    hexCases.canAiEnterEmptyEnemyCity.push({
      owner, uq, ur, city: enc(city), built, hasDefenders: hasDef, civilian: civ,
      out: chm.canAiEnterEmptyEnemyCity(owner, uq, ur, city, built, hasDef, civ),
    });
  }
  // gwarantowane trafienia pozytywne i po jednym negatywnym na kazdy warunek
  const base = { q: 2, r: -1, ownerId: 2 };
  for (const b of [[], ['koszary'], ['palisada'], ['mury'], ['fort'], ['baszta'], ['wieza', 'baszta']]) {
    for (const n of [[3, -1], [2, -1], [3, -2], [4, -1], [1, 0]]) {
      for (const [hd, civ, mur] of [[false, false, undefined], [true, false, undefined], [false, true, undefined], [false, false, true], [false, false, false]]) {
        const city = mur === undefined ? { ...base } : { ...base, maMur: mur };
        hexCases.canAiEnterEmptyEnemyCity.push({
          owner: 1, uq: n[0], ur: n[1], city: enc(city), built: b, hasDefenders: hd, civilian: civ,
          out: chm.canAiEnterEmptyEnemyCity(1, n[0], n[1], city, b, hd, civ),
        });
      }
    }
  }
  hexCases.canAiEnterEmptyEnemyCity.push({
    owner: 2, uq: 3, ur: -1, city: enc(base), built: [], hasDefenders: false, civilian: false,
    out: chm.canAiEnterEmptyEnemyCity(2, 3, -1, base, [], false, false),
  });
}
writeFileSync(join(outDir, 'hexmove.json'), JSON.stringify({ meta: { pin_web: 'edb8fb56', plik: 'gra/src/game/city-hex-movement.ts', generator: 'gen-p623-vectors.mjs' }, cases: hexCases }));

// ===========================================================================
// fort-territory.ts (+ territory.ts: axialDistance, cityTerritoryRadius; okolica.ts: cityRangeForPopulation)
// ===========================================================================
const fortCases = { cityRangeForPopulation: [], cityTerritoryRadius: [], axialDistance: [], fortNodeAsCityNode: [], isHexReservedByRivalFort: [], foundingNodesForOwner: [], applyFortTakeoverOnCityFounded: [], findEvacuationHexOutsideCity: [] };
{
  for (const p of [-5, -0.5, 0, 0.4, 1, 1.9, 2, 4, 5, 6, 9.99, 10, 14, 15, 16, 20, 1000, NAN, INF, -INF]) {
    fortCases.cityRangeForPopulation.push({ pop: enc(p), out: enc(okolica.cityRangeForPopulation(p)) });
  }
  const mkNode = () => {
    const n = { q: rint(-5, 5), r: rint(-5, 5), pop: pick([0, 1, 3, 5, 8, 12, 15, 25, 2.7, -1]), level: pick([1, 2, 3]) };
    const m = rnd();
    if (m < 0.2) n.isFort = true;
    else if (m < 0.4) n.isOutpost = true;
    else if (m < 0.5) { n.isFort = true; n.isOutpost = true; }
    else if (m < 0.6) { n.isFort = false; n.isOutpost = false; }
    if (rnd() < 0.2) n.civ = 'rzym';
    return n;
  };
  for (let i = 0; i < 80; i++) {
    const n = mkNode();
    fortCases.cityTerritoryRadius.push({ node: enc(n), out: enc(territory.cityTerritoryRadius(n)) });
  }
  for (let i = 0; i < 150; i++) {
    const a = [rint(-9, 9), rint(-9, 9)];
    const b = [rint(-9, 9), rint(-9, 9)];
    fortCases.axialDistance.push({ a, b, out: enc(territory.axialDistance(a[0], a[1], b[0], b[1])) });
  }
  const mkFort = () => {
    const f = { q: rint(-8, 8), r: rint(-8, 8), ownerId: rint(1, 3), type: pick(['fort', 'posterunek']) };
    const m = rnd();
    if (m < 0.25) f.contestedUseless = true;
    else if (m < 0.4) f.contestedUseless = false;
    return f;
  };
  const mkForts = () => Array.from({ length: rint(0, 7) }, mkFort);

  for (const t of ['fort', 'posterunek']) {
    for (const cu of [undefined, true, false]) {
      const f = { q: 1, r: -2, type: t };
      const fullNode = { ...f };
      if (cu !== undefined) fullNode.contestedUseless = cu;
      fortCases.fortNodeAsCityNode.push({ fort: enc(fullNode), out: enc(fort.fortNodeAsCityNode(fullNode)) });
    }
  }
  for (let i = 0; i < 300; i++) {
    const forts = mkForts();
    const q = rint(-10, 10);
    const r = rint(-10, 10);
    const builder = rint(1, 3);
    fortCases.isHexReservedByRivalFort.push({ q, r, builder, forts: enc(forts), out: fort.isHexReservedByRivalFort(q, r, builder, forts) });
  }
  for (let i = 0; i < 150; i++) {
    const forts = mkForts();
    const owner = rint(1, 3);
    const ownCityNodes = Array.from({ length: rint(0, 3) }, mkNode);
    fortCases.foundingNodesForOwner.push({ owner, ownCityNodes: enc(ownCityNodes), forts: enc(forts), out: enc(fort.foundingNodesForOwner(owner, ownCityNodes, forts)) });
  }
  for (let i = 0; i < 400; i++) {
    const forts = mkForts();
    // czesc scenariuszy: fort dokladnie na heksie nowego miasta (wlasny / cudzy)
    const newCity = { q: rint(-6, 6), r: rint(-6, 6), ownerId: rint(1, 3), population: pick([0, 1, 3, 5, 9, 15, 30, 2.5]) };
    if (rnd() < 0.4 && forts.length > 0) {
      const f = pick(forts);
      f.q = newCity.q;
      f.r = newCity.r;
    }
    const before = JSON.parse(JSON.stringify(forts));
    const mutated = JSON.parse(JSON.stringify(forts));
    const events = fort.applyFortTakeoverOnCityFounded(newCity, mutated);
    fortCases.applyFortTakeoverOnCityFounded.push({ newCity: enc(newCity), forts: enc(before), out_events: enc(events), out_forts: enc(mutated) });
  }
  // ewakuacja: mapa = dysk promienia 12 z losowymi dziurami; isFree = brak w zbiorze zablokowanych
  for (let i = 0; i < 160; i++) {
    const mapRadius = pick([4, 8, 12]);
    const holes = new Set();
    const blocked = new Set();
    const hexKeys = [];
    for (let q = -mapRadius; q <= mapRadius; q++) {
      for (let r = Math.max(-mapRadius, -q - mapRadius); r <= Math.min(mapRadius, -q + mapRadius); r++) {
        const key = `${q},${r}`;
        const roll = rnd();
        if (roll < 0.06) { holes.add(key); continue; }
        hexKeys.push(key);
        if (roll < 0.06 + pick([0.1, 0.4, 0.7, 0.95])) blocked.add(key);
      }
    }
    const hexesObj = Object.fromEntries(hexKeys.map((k) => [k, true]));
    const map = { hexes: hexesObj };
    const fortQ = rint(-mapRadius, mapRadius);
    const fortR = rint(-mapRadius, mapRadius);
    const node = { q: fortQ + rint(-2, 2), r: fortR + rint(-2, 2), pop: pick([0, 1, 4, 6, 9, 15]), level: 1 };
    if (rnd() < 0.2) node.isOutpost = true;
    if (rnd() < 0.15) node.isFort = true;
    const maxRingPick = pick([undefined, undefined, 1, 2, 5, 20, 0]);
    const isFree = (q, r) => !blocked.has(`${q},${r}`);
    const out = maxRingPick === undefined
      ? fort.findEvacuationHexOutsideCity(fortQ, fortR, node, map, isFree)
      : fort.findEvacuationHexOutsideCity(fortQ, fortR, node, map, isFree, maxRingPick);
    fortCases.findEvacuationHexOutsideCity.push({
      fortQ, fortR, node: enc(node), hexes: hexKeys, blocked: [...blocked],
      maxRing: maxRingPick === undefined ? '$omit' : maxRingPick,
      out: enc(out),
    });
  }
}
writeFileSync(join(outDir, 'fort.json'), JSON.stringify({ meta: { pin_web: 'edb8fb56', plik: 'gra/src/game/fort-territory.ts', generator: 'gen-p623-vectors.mjs' }, cases: fortCases }));

// podsumowanie
const summary = {};
for (const [n, c] of Object.entries(orderCases)) summary[`order.${n}`] = c.length;
for (const [n, c] of Object.entries(tiCases)) summary[`terrain-improvements.${n}`] = c.length;
for (const [n, c] of Object.entries(hexCases)) summary[`city-hex-movement.${n}`] = c.length;
for (const [n, c] of Object.entries(fortCases)) summary[`fort-territory.${n}`] = c.length;
origLog(JSON.stringify(summary, null, 1));
