// P6.6A - wektory z URUCHOMIONEGO weba (pin edb8fb56) dla:
//   gra/src/game/city-founding.ts, city-hex-clear.ts, conquest-stability.ts, visibility.ts
// Kod weba ladowany w calosci (bez stubow); zadne funkcje logiki nie sa przepisywane. Zaleznosci spoza
// zakresu (culture-religion.ts, diplomacy-display.ts, turn-economy.ts) rowniez sa PRAWDZIWYM kodem weba;
// ich wyniki sa zapisywane jako dane wstrzykniete do Rust (domkniecia testu sprawdzaja argumenty).
// Liczby specjalne: NaN / +-Infinity / -0 zapisywane jako stringi "NaN" / "Infinity" / "-Infinity" / "-0";
// liczby niecalkowite jako string "~<najkrotszy zapis JS>" (Rust: str::parse::<f64> jest dokladny).
// Wejscia losowe: Mulberry32 z ziarnem stalym (deterministyczne).
//
// Uzycie:
//   node --experimental-transform-types --no-warnings --import ./p66a-loader-register.mjs \
//     ./gen-p66a-vectors.mjs <WEB_ROOT> <OUT_DIR>
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
const dataJson = (p) => JSON.parse(readFileSync(join(webRoot, 'gra/data', p), 'utf8'));

const FC = await import(src('game/city-founding.ts'));
const HC = await import(src('game/city-hex-clear.ts'));
const CS = await import(src('game/conquest-stability.ts'));
const VI = await import(src('game/visibility.ts'));
const CR = await import(src('game/culture-religion.ts'));
const DD = await import(src('game/diplomacy-display.ts'));
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
const rnd = mulberry32(0x66a0c0de);
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;

const replacer = (_k, v) => {
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'NaN';
    if (v === Infinity) return 'Infinity';
    if (v === -Infinity) return '-Infinity';
    if (Object.is(v, -0)) return '-0';
    // serde_json (bez float_roundtrip) nie gwarantuje poprawnego zaokraglenia - ulamki jako napis "~repr"
    if (!Number.isInteger(v)) return '~' + String(v);
  }
  return v;
};
const write = (name, obj) => writeFileSync(join(outDir, name), JSON.stringify(obj, replacer, 0) + '\n');
const nn = (x) => (x === undefined ? null : x);

// ======================================================================
// city-founding.ts
// ======================================================================
const POPS = [0, 1, 2, 3, 4, 5, 6, 9, 2.5, -1, NaN, Infinity];
const RVS = [0, 0.1, 0.34, 0.5, 0.67, 0.99, 0.999999, 1, 1.5, -0.2, -1, NaN, Infinity, -Infinity, -0];
const TREASURY = [0, 5, 19.999, 20, 20.0001, 100, -1, NaN, Infinity, -Infinity];

function affordOut(a) {
  return {
    ok: a.ok,
    reason: nn(a.reason),
    kosztPraca: a.kosztPraca,
    kosztLudnosc: a.kosztLudnosc,
    sourceCityId: nn(a.sourceCityId),
  };
}
function genCities(prefix) {
  const n = ri(0, 6);
  return Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, ownerId: pick([0, 1, 1, 2, 3]), population: pick(POPS) }));
}

const founding = {
  constants: {
    work: FC.foundCityWorkCost(),
    pop: FC.foundCityPopulationCost(),
    aiMinPop: FC.AI_FOUNDING_SOURCE_MIN_POP,
  },
  labels: [
    { arg: 'default', out: FC.foundCityCostLabel() },
    { arg: false, out: FC.foundCityCostLabel(false) },
    { arg: true, out: FC.foundCityCostLabel(true) },
  ],
  subsequent: [],
  pick: [],
  evaluate: [],
  canAfford: [],
};
for (let i = 0; i < 80; i++) {
  const cities = genCities('s');
  const ownerId = pick([0, 1, 2, 3, 4]);
  founding.subsequent.push({
    owners: cities.map((c) => c.ownerId),
    ownerId,
    out: FC.isSubsequentFoundCity(cities, ownerId),
  });
}
for (let i = 0; i < 420; i++) {
  const cities = genCities('p');
  let tieOwner = null;
  // wymus remisy w polowie przypadkow
  if (cities.length >= 2 && chance(0.5)) {
    const ow = pick([0, 1, 2]);
    const pop = pick([3, 4, 5, Infinity]);
    for (const c of cities.slice(0, ri(2, cities.length))) {
      c.ownerId = ow;
      c.population = pop;
    }
    tieOwner = ow;
  }
  const ownerId = tieOwner !== null && chance(0.8) ? tieOwner : pick([0, 1, 2, 3]);
  const rv = pick(RVS);
  let calls = 0;
  const r = FC.pickSourceCityForFounding(cities, ownerId, () => {
    calls += 1;
    return rv;
  });
  founding.pick.push({ cities, ownerId, rand: rv, calls, out: r ? r.id : null });
}
for (let i = 0; i < 420; i++) {
  const cities = genCities('e');
  let tieOwner = null;
  if (cities.length >= 2 && chance(0.4)) {
    const ow = pick([0, 1, 2]);
    const pop = pick([3, 4, 5]);
    for (const c of cities.slice(0, ri(2, cities.length))) {
      c.ownerId = ow;
      c.population = pop;
    }
    tieOwner = ow;
  }
  const ownerId = tieOwner !== null && chance(0.8) ? tieOwner : pick([0, 1, 2, 3]);
  const treasury = pick(TREASURY);
  const rv = pick(RVS);
  let calls = 0;
  const a = FC.evaluateFoundCityAffordance(treasury, cities, ownerId, {
    rand: () => {
      calls += 1;
      return rv;
    },
  });
  founding.evaluate.push({ treasury, cities, ownerId, rand: rv, calls, out: affordOut(a) });
}
for (const treasury of TREASURY) {
  for (const pop of [0, 1, 1.5, 2, 3, 100, -2, NaN, Infinity]) {
    for (const free of [undefined, false, true]) {
      const a = free === undefined ? FC.canAffordFoundCity(treasury, pop) : FC.canAffordFoundCity(treasury, pop, { firstCityFree: free });
      founding.canAfford.push({ treasury, pop, free: nn(free), out: affordOut(a) });
    }
  }
}
// opts.firstCityFree jako falsy undefined przy obecnym obiekcie opts
for (const treasury of [0, 20]) {
  const a = FC.canAffordFoundCity(treasury, 3, {});
  founding.canAfford.push({ treasury, pop: 3, free: null, out: affordOut(a) });
}
write('founding.json', founding);

// ======================================================================
// city-hex-clear.ts
// ======================================================================
const TERENY = Object.values(TH.TerenBazowy);
const NAKLADKI = Object.values(TH.Nakladka);
const ULEPSZENIA = ['brak', 'farma', 'irygacja', 'kopalnia', 'droga', 'droga_brukowana', 'pastwisko', 'tartak'];
const ZLOZA = [undefined, undefined, 'zelazo', 'sol', ''];
const IKEYS = [undefined, undefined, 'farma', 'tartak', 'kopalnia_zelaza', 'las'];
const ULEPSZENIA_LAYERS = [undefined, undefined, [], ['farma'], ['farma', 'irygacja'], ['tartak', 'droga', 'farma']];

function hexCanon(h) {
  return {
    teren: h.terenBazowy,
    nakladka: h.nakladka,
    ulepszenie: h.ulepszenie,
    ulepszenia: h.ulepszenia === undefined ? null : h.ulepszenia,
    zloze: nn(h.zloze),
    improvementKey: nn(h.improvementKey),
    rzeka: !!(h.rzeka && h.rzeka.obecna),
  };
}
function genHex(teren, nakladka) {
  const h = {
    coords: { q: 0, r: 0 },
    terenBazowy: teren ?? pick(TERENY),
    nakladka: nakladka ?? pick(NAKLADKI),
    ulepszenie: pick(ULEPSZENIA),
    wlasciciel: null,
  };
  const z = pick(ZLOZA);
  if (z !== undefined) h.zloze = z;
  const k = pick(IKEYS);
  if (k !== undefined) h.improvementKey = k;
  const l = pick(ULEPSZENIA_LAYERS);
  if (l !== undefined) h.ulepszenia = [...l];
  if (chance(0.3)) h.rzeka = { obecna: chance(0.7) };
  return h;
}

const hexclear = {
  keepKeys: [...HC.CITY_KEEP_IMPROVEMENT_KEYS],
  keeps: [],
  clear: [],
  apply: [],
};
for (const key of [...HC.CITY_KEEP_IMPROVEMENT_KEYS, 'las', 'wyrab', 'oboz_lowiecki', 'tartak', 'irygacja', 'tarasy', 'fort', 'Farma', '', 'constructor', '__proto__', 'toString', 'kopalnia']) {
  hexclear.keeps.push({ key, out: HC.cityKeepsImprovement(key) });
}
for (const teren of TERENY) {
  for (const nakladka of NAKLADKI) {
    for (const arg of [undefined, true, false]) {
      for (let rep = 0; rep < 2; rep++) {
        const hex = genHex(teren, nakladka);
        const before = hexCanon(hex);
        if (arg === undefined) HC.clearHexForCityCenter(hex);
        else HC.clearHexForCityCenter(hex, arg);
        hexclear.clear.push({ arg: nn(arg), before, after: hexCanon(hex) });
      }
    }
  }
}
for (let i = 0; i < 260; i++) {
  const hex = genHex();
  const q = ri(-3, 3);
  const r = ri(-3, 3);
  hex.coords = { q, r };
  const map = { hexes: { [`${q},${r}`]: hex } };
  const missing = chance(0.1);
  const qq = missing ? q + 1 : q;
  const city = {};
  const prefilled = chance(0.3);
  if (prefilled) city.centerWorkedTile = { stary: true };
  const before = hexCanon(hex);
  HC.applyCityFoundingToHex(city, map, qq, r);
  hexclear.apply.push({
    q: qq,
    r,
    hexKey: `${q},${r}`,
    hexBefore: before,
    prefilled,
    centerAfter: city.centerWorkedTile === undefined ? null : city.centerWorkedTile,
    hexAfter: hexCanon(hex),
    missing,
  });
}
write('hexclear.json', hexclear);

// ======================================================================
// conquest-stability.ts
// ======================================================================
const SOCIETY = dataJson('society-params.json');
const DIFFS = ['easy', 'normal', 'hard'];
const SHARES = [-1, -0, 0, 0.25, 0.4999999, 0.5, 0.5000001, 0.75, 1, 2, NaN, Infinity, -Infinity];
const conquest = {
  foreign: SHARES.map((s) => ({ share: s, out: CS.isForeignCultureDominant(s) })),
  unstable: [],
  captured: [],
  buildings: [],
  tick: [],
  revolt: [],
  deprecated: [],
};
for (const s of SHARES) for (const f of [false, true]) conquest.unstable.push({ share: s, foreignReligion: f, out: CS.isConquestUnstable(s, f) });

const CIV_KEYS = ['grecy', 'Grecy', ' grecy ', 'rzymianie', 'Rzymianie', 'inkowie', 'nieznana', '', '   '];
const SHARE_IN = [undefined, 0, 0.3, 0.5, 1, 1.7, -0.4, NaN, Infinity, -0];
for (let i = 0; i < 420; i++) {
  const city = {};
  const a = pick(SHARE_IN);
  const b = pick(SHARE_IN);
  if (a !== undefined) city.ownCultureShare = a;
  if (b !== undefined) city.kulturaOwnShare = b;
  const newOwner = pick([undefined, 0, 1, 2, 3, 3]);
  const prevOwner = pick([undefined, 0, 1, 2, 3, 3]);
  const mode = pick(['none', 'empty', 'keys', 'keys']);
  const keys = {};
  for (let o = 0; o <= 3; o++) keys[o] = pick(CIV_KEYS);
  let opts;
  if (mode === 'empty') opts = {};
  if (mode === 'keys') opts = { civKeyForOwner: (id) => keys[id] ?? '' };
  const before = { own: nn(city.ownCultureShare), kult: nn(city.kulturaOwnShare) };
  let circle = null;
  if (mode === 'keys' && newOwner !== undefined && prevOwner !== undefined && newOwner !== prevOwner) {
    // zrodlo: conquest-stability.ts:50 - sameCultureCircle(civKey(new), civKey(prev)); wynik z PRAWDZIWEGO kodu
    const ka = keys[newOwner] ?? '';
    const kb = keys[prevOwner] ?? '';
    circle = { a: ka, b: kb, out: DD.sameCultureCircle(ka, kb) };
  }
  CS.onCityCapturedCulture(city, newOwner, prevOwner, opts);
  conquest.captured.push({
    before,
    newOwner: nn(newOwner),
    prevOwner: nn(prevOwner),
    mode,
    keys: mode === 'keys' ? keys : null,
    circle,
    after: { own: nn(city.ownCultureShare), kult: nn(city.kulturaOwnShare) },
  });
}

const IDS = ['teatr', 'akademia', 'biblioteka', 'palac', 'palac_ii', 'palac_iii', 'stela', 'sad', 'laznia_publiczna', 'swiatynia', 'kamienne_kregi', 'koszary', 'Teatr', 'swiatynia ', '', 'palac_iv', 'ratusz'];
for (let i = 0; i < 260; i++) {
  const n = ri(0, 8);
  const ids = Array.from({ length: n }, () => pick(IDS));
  conquest.buildings.push({ ids, culture: CS.cultureBuildingsFromIds(ids), religion: CS.religionBuildingsFromIds(ids) });
}
const RELS = ['Chrzescijanstwo', 'Politeizm', 'Islam', 'Kult Slonca', 'x'];
function genReligion() {
  const counts = {};
  const n = ri(0, 4);
  for (let i = 0; i < n; i++) counts[pick(RELS)] = pick([0, 1, 3, 10, 55, 100, 7.5, NaN, -4, Infinity]);
  return { counts };
}
for (let i = 0; i < 420; i++) {
  const share = pick([-0.2, 0, 0.1, 0.49, 0.5, 0.9, 0.999, 1, 1.2, NaN, -0]);
  const rel = genReligion();
  const n = ri(0, 7);
  const ids = Array.from({ length: n }, () => pick(IDS));
  const owner = pick([null, null, '', 'Chrzescijanstwo', 'Politeizm', 'Islam', 'Obca']);
  const foreign = chance(0.6);
  const difficulty = pick(DIFFS);
  const cp = CR.loadCultureParams(SOCIETY, difficulty);
  const rp = CR.loadReligionParams(SOCIETY, difficulty);
  const relIn = structuredClone(rel);
  const out = CS.tickCityCultureReligion(share, rel, ids, owner, foreign, cp, rp);
  // wywolania zaleznosci - te same argumenty, ktore tick przekazuje (bramki: conquest-stability.ts:107, :113)
  let cultureCall = null;
  if (share < 1) {
    const b = CS.cultureBuildingsFromIds(ids);
    const c = CR.convertCulture({ kulturaSkumulowana: 0, ownCultureShare: share }, b, cp);
    cultureCall = { share, buildings: b, difficulty, out: c.ownCultureShare };
  }
  let religionCall = null;
  if (foreign && owner) {
    const b = CS.religionBuildingsFromIds(ids);
    const c = CR.convertViaTemple(relIn, owner, b, rp);
    religionCall = { state: relIn, target: owner, buildings: b, difficulty, outState: c.state, outConverted: c.converted };
  }
  conquest.tick.push({
    share,
    religion: relIn,
    ids,
    owner: nn(owner),
    foreign,
    difficulty,
    cultureCall,
    religionCall,
    out: {
      ownCultureShare: out.ownCultureShare,
      religionState: out.religionState,
      cultureRateApplied: out.cultureRateApplied,
      religionConverted: out.religionConverted,
    },
  });
}
for (const s of SHARES) {
  for (const f of [false, true]) {
    for (const g of [-1, 0, 1, 3, NaN]) {
      conquest.revolt.push({ share: s, foreignReligion: f, garnizon: g, out: CS.conquestRevoltRiskMultiplier(s, f, g) });
      conquest.deprecated.push({
        share: s,
        foreignReligion: f,
        garnizon: g,
        happiness: CS.conquestUnstableHappinessPenalty(s, f, SOCIETY, 'normal'),
        law: CS.conquestNoGarrisonLawPenalty(s, f, g, SOCIETY, 'normal'),
      });
    }
  }
}
write('conquest.json', conquest);

// ======================================================================
// visibility.ts
// ======================================================================
const UNITS_JSON = dataJson('units.json');
const UNIT_NAMES = UNITS_JSON.map((u) => u.Jednostka);
const CUSTOM_DEFS = [
  { Jednostka: 'X1', 'Widok pola': 4, Ruch: 2 },
  { Jednostka: 'X2', 'Widok pola': 'abc', Ruch: 3 },
  { Jednostka: 'X3' },
  { Jednostka: 'X4', 'Widok pola': null, Ruch: '1' },
  { Jednostka: 'X5', 'Widok pola': 1 },
  { Jednostka: 'X5', 'Widok pola': 6 },
  { Jednostka: 'X6', Ruch: 7 },
  { Jednostka: 'X7', 'Widok pola': 2.5, Ruch: 1 },
  { Jednostka: 'X8', 'Widok pola': 0, Ruch: 5 },
];

const keyQR = (k) => k.split(',').map(Number);
const sortKeys = (keys) => [...keys].sort((a, b) => {
  const [aq, ar] = keyQR(a);
  const [bq, br] = keyQR(b);
  return aq - bq || ar - br;
});
function genMap() {
  const rad = ri(2, 7);
  const cq = ri(-3, 3);
  const cr = ri(-3, 3);
  const hexes = {};
  const entries = [];
  for (let q = cq - rad; q <= cq + rad; q++) {
    for (let r = cr - rad; r <= cr + rad; r++) {
      if (Math.max(Math.abs(q - cq), Math.abs(r - cr), Math.abs(-q - r - (-cq - cr))) > rad) continue;
      if (chance(0.1)) continue;
      entries.push([q, r]);
    }
  }
  entries.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  for (const [q, r] of entries) hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: pick(TERENY), nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null };
  return hexes;
}
const mapTerrains = (hexes) => Object.entries(hexes).map(([k, h]) => [k, h.terenBazowy]);
const maps = Array.from({ length: 24 }, () => genMap());
const SIGHTS = [0, 1, 2, 3, 4, 5, 2.5, -1, NaN, 0.5, 1.9999999999999998];
function genUnit(i) {
  const u = {
    id: `u${i}`,
    ownerId: pick([0, 0, 1, 2]),
    typeId: pick([...UNIT_NAMES.slice(0, 12), ...CUSTOM_DEFS.map((d) => d.Jednostka), 'city', 'city', 'Nieznana', undefined]),
    q: ri(-9, 9),
    r: ri(-9, 9),
    category: 'x',
    ruch: 1,
    ruchLeft: 1,
  };
  if (chance(0.25)) u.inGarnizon = pick([true, false]);
  return u;
}
const unitCanon = (u) => ({ id: u.id, ownerId: u.ownerId, typeId: nn(u.typeId), q: u.q, r: u.r, inGarnizon: u.inGarnizon === true });

const visibility = {
  constants: {
    defaultSight: VI.DEFAULT_SIGHT,
    fogBrightness: VI.FOG_EXPLORED_BRIGHTNESS,
  },
  maps: maps.map(mapTerrains),
  at: [],
  path: [],
  fixed: [],
  resolver: [],
  resolverDefs: { custom: CUSTOM_DEFS },
  explored: [],
  keys: [],
  render: [],
  terrainPredicates: TERENY.map((t) => ({ teren: t, reveal: VI.isRevealLandTeren(t), dry: VI.isDryLandTeren(t) })),
  player: [],
  onMap: [],
  border: [],
};
const setOut = (s) => sortKeys(s);
for (let i = 0; i < 260; i++) {
  const mi = ri(0, maps.length - 1);
  const q = ri(-8, 8);
  const r = ri(-8, 8);
  const sight = pick(SIGHTS);
  visibility.at.push({ map: mi, q, r, sight, out: setOut(VI.computeVisibleAt(q, r, { hexes: maps[mi] }, sight)) });
}
for (let i = 0; i < 100; i++) {
  const mi = ri(0, maps.length - 1);
  const n = ri(0, 6);
  const path = Array.from({ length: n }, () => ({ q: ri(-8, 8), r: ri(-8, 8) }));
  const sight = pick(SIGHTS);
  visibility.path.push({ map: mi, path, sight, out: setOut(VI.computeVisibleAlongPath(path, { hexes: maps[mi] }, sight)) });
}
for (let i = 0; i < 120; i++) {
  const mi = ri(0, maps.length - 1);
  const units = Array.from({ length: ri(0, 5) }, (_, j) => genUnit(j));
  const sight = pick(SIGHTS);
  visibility.fixed.push({ map: mi, units: units.map(unitCanon), sight, out: setOut(VI.computeVisible(units, { hexes: maps[mi] }, sight)) });
}
const RES_SETS = [
  { name: 'real', defs: UNITS_JSON },
  { name: 'custom', defs: CUSTOM_DEFS },
  { name: 'mixed', defs: [...UNITS_JSON.slice(0, 10), ...CUSTOM_DEFS] },
  { name: 'empty', defs: [] },
];
visibility.resolverDefs.sets = RES_SETS.map((s) => ({ name: s.name, defs: s.name === 'real' ? 'real-units-json' : s.defs }));
for (let i = 0; i < 260; i++) {
  const mi = ri(0, maps.length - 1);
  const units = Array.from({ length: ri(0, 5) }, (_, j) => genUnit(j));
  const set = pick(RES_SETS);
  const citySight = pick([undefined, undefined, 0, 1, 2.5, 4, -1, NaN]);
  const resolver = citySight === undefined ? VI.buildUnitSightResolver(set.defs) : VI.buildUnitSightResolver(set.defs, citySight);
  visibility.resolver.push({
    map: mi,
    set: set.name,
    citySight: nn(citySight),
    units: units.map(unitCanon),
    sights: units.map((u) => resolver(u)),
    out: setOut(VI.computeVisible(units, { hexes: maps[mi] }, resolver)),
  });
}
for (let i = 0; i < 80; i++) {
  const mi = ri(0, maps.length - 1);
  const mkSet = () => {
    const s = new Set();
    for (const k of Object.keys(maps[mi])) if (chance(0.3)) s.add(k);
    if (chance(0.5)) s.add('99,99');
    return s;
  };
  const explored = mkSet();
  const visible = mkSet();
  const before = setOut(explored);
  VI.addExplored(explored, visible);
  visibility.explored.push({ before, visible: setOut(visible), out: setOut(explored) });
}
for (let mi = 0; mi < maps.length; mi++) {
  const m = { hexes: maps[mi] };
  visibility.keys.push({ map: mi, all: VI.allHexKeys(m), reveal: VI.allRevealLandKeys(m), dry: VI.allDryLandKeys(m) });
}
for (let i = 0; i < 80; i++) {
  const mi = ri(0, maps.length - 1);
  const mkSet = () => {
    const s = new Set();
    for (const k of Object.keys(maps[mi])) if (chance(0.3)) s.add(k);
    return s;
  };
  const explored = mkSet();
  const land = mkSet();
  const reveal = chance(0.5);
  const before = setOut(explored);
  const out = VI.exploredSetForRender(explored, land, reveal);
  visibility.render.push({ explored: before, land: setOut(land), reveal, out: setOut(out), unchanged: setOut(explored).join('|') === before.join('|') });
}
const borderSeen = new Map();
const KULTURY = [undefined, 0, 99, 100, 250, 499, 500, 900, NaN, -5];
const UNITS_RESOLVER = VI.buildUnitSightResolver(UNITS_JSON);
for (let i = 0; i < 220; i++) {
  const mi = ri(0, maps.length - 1);
  const units = Array.from({ length: ri(0, 3) }, (_, j) => genUnit(j));
  const cities = Array.from({ length: ri(0, 3) }, () => {
    const c = { q: ri(-8, 8), r: ri(-8, 8), population: pick([0, 1, 2, 3, 5, 8, 12, 30, NaN, -1, 2.5]) };
    const k = pick(KULTURY);
    if (k !== undefined) c.kultura = k;
    return c;
  });
  const startHex = pick([undefined, null, { q: ri(-6, 6), r: ri(-6, 6) }, { q: ri(-6, 6), r: ri(-6, 6) }]);
  const startRevealRadius = pick([undefined, undefined, 0, 2, 7, 2.5, -1]);
  const opts = { map: { hexes: maps[mi] }, playerUnits: units, playerCities: cities, unitSight: UNITS_RESOLVER };
  if (startHex !== undefined) opts.startHex = startHex;
  if (startRevealRadius !== undefined) opts.startRevealRadius = startRevealRadius;
  for (const c of cities) {
    const k = c.kultura ?? 0;
    if (!borderSeen.has(String(k))) borderSeen.set(String(k), { kultura: k, ring: CR.cityBorderRadius(k) });
  }
  visibility.player.push({
    map: mi,
    units: units.map(unitCanon),
    cities: cities.map((c) => ({ q: c.q, r: c.r, population: c.population, kultura: nn(c.kultura) })),
    startHex: startHex === undefined ? null : startHex,
    startRevealRadius: nn(startRevealRadius),
    out: setOut(VI.computePlayerVisibility(opts)),
  });
}
for (const k of [0, 99, 100, 250, 499, 500, 900]) if (!borderSeen.has(String(k))) borderSeen.set(String(k), { kultura: k, ring: CR.cityBorderRadius(k) });
visibility.border = [...borderSeen.values()];
for (let i = 0; i < 160; i++) {
  const units = Array.from({ length: ri(0, 8) }, (_, j) => genUnit(j));
  const mi = ri(0, maps.length - 1);
  const vis = new Set();
  for (const k of Object.keys(maps[mi])) if (chance(0.3)) vis.add(k);
  const owner = pick([undefined, 0, 1, 2]);
  const out = owner === undefined ? VI.unitsVisibleOnMap(units, vis) : VI.unitsVisibleOnMap(units, vis, owner);
  visibility.onMap.push({ units: units.map(unitCanon), visible: setOut(vis), owner: nn(owner), out: out.map((u) => u.id) });
}
visibility.citySightExport = VI.citySightRadius === undefined ? null : [0, 1, 3, 9, 30].map((p) => ({ pop: p, kultura: 0, out: VI.citySightRadius(p) }));
write('visibility.json', visibility);

console.log(JSON.stringify({
  founding: { pick: founding.pick.length, evaluate: founding.evaluate.length, canAfford: founding.canAfford.length, subsequent: founding.subsequent.length },
  hexclear: { clear: hexclear.clear.length, apply: hexclear.apply.length, keeps: hexclear.keeps.length },
  conquest: { captured: conquest.captured.length, buildings: conquest.buildings.length, tick: conquest.tick.length, revolt: conquest.revolt.length },
  visibility: { at: visibility.at.length, path: visibility.path.length, fixed: visibility.fixed.length, resolver: visibility.resolver.length, player: visibility.player.length, onMap: visibility.onMap.length },
}));
