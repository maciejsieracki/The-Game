// P6.8I (R-RUSTPORT-P6-8I-AUTO-ULEPSZENIA-Q1, runda 4): wektory z URUCHOMIONEGO weba, PIN 4bbef081d.
// Prawdziwy kod TS z `git archive` (bez builda `gra/`), loader `repin-b-loader-*.mjs` (jedyny wyjatek od
// "zero stubow": render/improvements.ts -> wycinek typ+tablica IMPROVEMENTS, patrz hooks).
// Pokrycie: pickAutoImprovements (sciezka jednoprzebiegowa i etapowa E1-E6, krok niedoboru, E-FORT, drogi,
// sciezka zapasowa), helpery P1 (priorytety, niedobory, isCityLimitExhausted), stale.
// Uruchomienie (Node 22, katalog tego runu; WEB_ROOT = wynik `git archive 4bbef081d gra/src gra/data`):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-p6-8i-pick-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIA>
// Kodowanie liczb: skonczona -> number; NaN/Infinity/-Infinity -> napis; undefined -> brak klucza.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
mkdirSync(outDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;
const PIN = '4bbef081d';

const A = await import(src('game/auto-improvements.ts'));
const IT = await import(src('game/improvement-tech.ts'));
const HX = await import(src('types/hex.ts'));
const TB = HX.TerenBazowy;
const NK = HX.Nakladka;

// ---- PRNG (deterministyczny) -----------------------------------------------------------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x8a11c0de);
const chance = (p) => rnd() < p;
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const subset = (arr, p) => arr.filter(() => chance(p));

const enc = (x) => (typeof x === 'number' && !Number.isFinite(x) ? String(x) : x);

// ---- pula map ---------------------------------------------------------------------------
const TERRAIN_W = [
  [TB.Laka, 5], [TB.Rownina, 5], [TB.Wzgorza, 3], [TB.Gory, 2], [TB.PlytkieMorze, 1],
  [TB.Morze, 1], [TB.Pustynia, 1], [TB.Polarny, 0.3],
];
const pickWeighted = (tbl) => {
  const tot = tbl.reduce((s, [, w]) => s + w, 0);
  let x = rnd() * tot;
  for (const [v, w] of tbl) { x -= w; if (x <= 0) return v; }
  return tbl[0][0];
};
const OVERLAYS = [NK.ZlozeGliny, NK.ZlozeRudy, NK.ZlozeKonia, NK.ZlozeOwiec, NK.ZlozeBydla, NK.ZlozeLamy];
const ZLOZE = ['sol', 'zelazo', 'miedz', 'ruda', 'zloto', 'cyna', 'glina'];
const NEIGH = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
const disk = (cq, cr, rad) => {
  const out = [];
  for (let dq = -rad; dq <= rad; dq++) for (let dr = -rad; dr <= rad; dr++) {
    if (Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)) <= rad) out.push([cq + dq, cr + dr]);
  }
  return out;
};

function genMap(radius, forestP, depositP, holeP, riverCount) {
  const cells = disk(0, 0, radius).filter(() => !chance(holeP));
  const hexes = [];
  const idx = new Map();
  for (const [q, r] of cells) {
    const teren = pickWeighted(TERRAIN_W);
    let nak = NK.Brak;
    const land = ![TB.Morze, TB.PlytkieMorze].includes(teren);
    if (land && chance(forestP)) nak = NK.Las;
    else if (land && chance(depositP)) nak = pick(OVERLAYS);
    const zloze = land && chance(depositP) ? pick(ZLOZE) : null;
    idx.set(`${q},${r}`, hexes.length);
    hexes.push({ q, r, teren, nak, zloze, rzeka: false, ulepszenie: null, ulepszenia: null });
  }
  const riverPaths = [];
  for (let i = 0; i < riverCount; i++) {
    let [q, r] = pick(cells);
    const path = [];
    const len = ri(4, 10);
    let dir = ri(0, 5);
    for (let s = 0; s < len; s++) {
      if (idx.has(`${q},${r}`)) path.push([q, r]);
      if (chance(0.35)) dir = (dir + pick([1, 5])) % 6;
      q += NEIGH[dir][0]; r += NEIGH[dir][1];
    }
    if (path.length >= 2) riverPaths.push(path);
  }
  // rzeka.obecna na czesci heksow sciezek + pojedyncze poza sciezkami
  for (const p of riverPaths) for (const [q, r] of p) if (chance(0.7)) hexes[idx.get(`${q},${r}`)].rzeka = true;
  for (const h of hexes) if (chance(0.02)) h.rzeka = true;
  for (const h of hexes) {
    if (chance(0.04)) h.ulepszenie = pick(['farma', 'droga', 'tartak', 'brak', 'xyz']);
    if (chance(0.04)) h.ulepszenia = subset(['farma', 'irygacja', 'bydlo', 'droga', 'oboz_lowiecki'], 0.4);
  }
  return { hexes, riverPaths };
}

const MAPS = [];
for (let i = 0; i < 28; i++) {
  MAPS.push(genMap(ri(4, 8), pick([0.1, 0.25, 0.45]), pick([0.05, 0.12]), pick([0, 0.03, 0.1]), ri(0, 3)));
}
// mapy specjalne (czyste): rownina z rzeka, las wszedzie, wzgorza+las, gory ze zlozem
function pureMap(fn, radius, rivers) {
  const hexes = disk(0, 0, radius).map(([q, r]) => {
    const o = fn(q, r);
    return { q, r, teren: o.teren, nak: o.nak ?? NK.Brak, zloze: o.zloze ?? null, rzeka: !!o.rzeka, ulepszenie: null, ulepszenia: null };
  });
  return { hexes, riverPaths: rivers };
}
const RIVER_A = [[-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0]].map(([q, r]) => [q, r]);
const SPECIAL_BASE = MAPS.length;
MAPS.push(pureMap(() => ({ teren: TB.Laka }), 6, [RIVER_A]));                                      // +0 lake + rzeka
MAPS.push(pureMap(() => ({ teren: TB.Rownina, nak: NK.Las }), 6, [RIVER_A]));                    // +1 las wszedzie + rzeka
MAPS.push(pureMap((q, r) => ({ teren: (q + r) % 2 === 0 ? TB.Wzgorza : TB.Laka, nak: NK.Las }), 6, []));  // +2 wzgorza+las bez rzeki
MAPS.push(pureMap((q, r) => ({ teren: Math.abs(q) + Math.abs(r) > 4 ? TB.Gory : TB.Rownina, zloze: Math.abs(q) + Math.abs(r) > 5 ? 'zelazo' : null }), 9, [])); // +3 gory ze zlozem na obrzezu
MAPS.push(pureMap((q, r) => ({ teren: TB.Rownina, nak: (q * 7 + r * 3) % 5 === 0 ? NK.Las : NK.Brak, rzeka: q === 1 && r === 1 }), 6, [[[1, 1], [1, 2], [0, 3]]])); // +4 rzeka krotka
const mapOut = MAPS.map(m => ({
  hexes: m.hexes.map(h => [h.q, h.r, h.teren, h.nak, h.zloze, h.rzeka ? 1 : 0, h.ulepszenie, h.ulepszenia]),
  riverPaths: m.riverPaths,
}));

// ---- budowa obiektow weba ----------------------------------------------------------------
const webMaps = MAPS.map(m => {
  const hexes = {};
  for (const h of m.hexes) {
    const hex = {
      coords: { q: h.q, r: h.r }, terenBazowy: h.teren, nakladka: h.nak,
      ulepszenie: h.ulepszenie ?? 'brak', rzeka: { obecna: h.rzeka, krawedzie: [] },
    };
    if (h.zloze) hex.zloze = h.zloze;
    if (h.ulepszenia) hex.ulepszenia = h.ulepszenia;
    hexes[`${h.q},${h.r}`] = hex;
  }
  return { hexes, riverPaths: m.riverPaths.map(p => p.map(([q, r]) => ({ q, r }))) };
});

// ---- puli technologii ---------------------------------------------------------------------
const techPool = new Set();
for (const k of IT.improvementMetaKeys()) {
  const m = IT.getImprovementMeta(k);
  if (m?.techId) techPool.add(m.techId);
}
for (const arr of Object.values(IT.IMPROVEMENT_MULTI_TECH_REQ)) for (const t of arr) techPool.add(t);
const TECHS = [...techPool].sort();

// ---- scenariusze --------------------------------------------------------------------------
const KEYS_ALL = [...A.AI_IMPROVEMENT_PRIORITY];
const FOCI = ['zywnosc', 'surowce', 'infrastruktura', 'zrownowazone'];
const DEFICITS = ['drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'sol', 'kon', 'zywnosc', 'zloto', 'stal'];
const CIVS = [undefined, undefined, 'Inkowie', 'Rzymianie', 'Egipt', 'xyz', ''];

function landHexes(mapIdx) {
  return MAPS[mapIdx].hexes.filter(h => ![TB.Morze, TB.PlytkieMorze].includes(h.teren));
}

function genScenario(name, o = {}) {
  const mapIdx = o.map ?? ri(0, MAPS.length - 1);
  const land = landHexes(mapIdx);
  const nCities = o.nCities ?? pick([1, 1, 2, 2, 3]);
  const cities = [];
  const used = new Set();
  for (let i = 0; i < nCities; i++) {
    const h = o.cityAt?.[i] ? { q: o.cityAt[i][0], r: o.cityAt[i][1] } : pick(land);
    const k = `${h.q},${h.r}`;
    if (used.has(k)) continue;
    used.add(k);
    const c = {
      id: o.ids?.[i] ?? pick([`c${i + 1}`, `c${i + 1}`, `a${10 - i}`, `Z${i}`]),
      ownerId: chance(0.08) ? 9 : 1,
      q: h.q, r: h.r,
      population: o.pop?.[i] ?? pick([0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20]),
    };
    if (chance(0.5)) c.focus = o.focus ?? pick(FOCI);
    else if (o.focus) c.focus = o.focus;
    if (chance(0.3)) c.onlyWorked = chance(0.7);
    if (chance(0.15)) c.kon = pick([0, 10, 50, 60, 200]);
    cities.push(c);
  }
  const ownerId = 1;
  const territoryNodes = cities.map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1, ownerId: c.ownerId }));
  if (chance(0.3)) {
    const h = pick(land);
    if (!used.has(`${h.q},${h.r}`)) territoryNodes.push({ q: h.q, r: h.r, pop: ri(1, 8), level: 1, ownerId: 2 });
  }
  const placed = {};
  for (const h of land) {
    if (chance(0.07)) {
      const layers = subset(['farma', 'bydlo', 'owce', 'lama', 'tartak', 'oboz_lowiecki', 'irygacja', 'droga', 'posterunek', 'fort', 'kopalnia_miedzi', 'glinianka', 'wyrab'], 0.2);
      if (layers.length) placed[`${h.q},${h.r}`] = layers.length === 1 && chance(0.4) ? layers[0] : layers;
    }
  }
  const techs = o.techs ?? (chance(0.6) ? TECHS : chance(0.8) ? subset(TECHS, 0.6) : []);
  const staged = o.staged ?? chance(0.5);
  const spec = {
    name, map: mapIdx, ownerId, cities, territoryNodes: o.noTerritory ? null : territoryNodes, placed,
    praca: o.praca ?? pick([0, 5, 30, 60, 120, 400, 1500, 8000]),
    techs,
    opts: {},
    fn: {},
  };
  const so = spec.opts;
  if (chance(0.4)) so.pracaBudgetPercent = pick([100, 50, 33, 20, 5, 0, 150, -10]);
  if (chance(0.15)) so.improvementBudgetCap = pick([0, 25, 90, 300, 100000]);
  if (chance(0.3)) so.maxItemsPerCity = pick([1, 1, 2, 3, 0]);
  if (chance(0.3)) so.pracaSurplusThreshold = pick([0, 10, 30, 200]);
  if (chance(0.15)) so.skipWyrab = true;
  if (chance(0.55)) so.demandDriven = true;
  if (chance(0.5)) so.resourceDeficitKeys = subset(DEFICITS, 0.3);
  const civ = pick(CIVS);
  if (civ !== undefined) so.civArchetype = civ;
  if (chance(0.4)) so.playerEra = pick([1, 2, 3]);
  if (chance(0.1)) so.priorityOverride = subset(KEYS_ALL, 0.35);
  if (staged) so.foodImprovementStages = chance(0.7) ? true : { cities: subset(cities.map(c => c.id), 0.6) };
  if (chance(0.12)) so.riverForestClearingOnly = true;
  if (chance(0.1)) so.clearingHexKeys = subset(land.map(h => `${h.q},${h.r}`), 0.05);
  if (chance(0.08)) so.roadsPass = true;
  if (chance(0.35)) so.cityLimitExhausted = true;
  if (chance(0.05)) so.fortClaimPass = true;
  if (chance(0.06)) so.riverHexesOnly = true;
  if (chance(0.06)) so.offRiverClearing = true;
  if (chance(0.08)) so.irrigationNeedsFarm = true;
  if (chance(0.3)) so.withSurplusReport = true;
  const fn = spec.fn;
  if (chance(0.15)) { fn.focusByCity = {}; for (const c of cities) if (chance(0.7)) fn.focusByCity[c.id] = pick(FOCI); }
  if (chance(0.25)) { fn.onlyWorkedByCity = {}; for (const c of cities) fn.onlyWorkedByCity[c.id] = chance(0.6); }
  if (chance(0.35) || cities.some(c => (fn.onlyWorkedByCity?.[c.id] ?? c.onlyWorked) === true)) {
    fn.workedKeysByCity = {};
    for (const c of cities) {
      const near = land.filter(h => Math.abs(h.q - c.q) + Math.abs(h.r - c.r) <= 6);
      fn.workedKeysByCity[c.id] = subset(near, 0.35).map(h => `${h.q},${h.r}`);
    }
  }
  if (chance(0.15)) { fn.pracaPercentByCity = {}; for (const c of cities) if (chance(0.6)) fn.pracaPercentByCity[c.id] = pick([100, 50, 10, 0, 200, -5]); }
  if (chance(0.1)) { fn.skipWyrabByCity = {}; for (const c of cities) fn.skipWyrabByCity[c.id] = chance(0.5); }
  if (chance(0.15)) { fn.resourcePassOnlyWorkedByCity = {}; for (const c of cities) fn.resourcePassOnlyWorkedByCity[c.id] = chance(0.5); }
  if (chance(0.1)) fn.civDeny = subset(KEYS_ALL, 0.15);
  return spec;
}

// ---- wykonanie w webie ---------------------------------------------------------------------
function runWeb(spec) {
  const map = webMaps[spec.map];
  const byId = (m, c, d) => (m && Object.prototype.hasOwnProperty.call(m, c.id) ? m[c.id] : d);
  const dec = (x) => (typeof x === 'string' && ['NaN', 'Infinity', '-Infinity'].includes(x) ? Number(x) : x);
  const cities = spec.cities.map(c => {
    const o = { id: c.id, ownerId: c.ownerId, q: c.q, r: c.r, population: dec(c.population) };
    if (c.focus !== undefined) o.ulepszeniaFocus = c.focus;
    if (c.onlyWorked !== undefined) o.ulepszeniaOnlyWorked = c.onlyWorked;
    if (c.kon !== undefined) o.surowce = { kon: c.kon };
    return o;
  });
  const placed = new Map(Object.entries(spec.placed).map(([k, v]) => [k, Array.isArray(v) ? [...v] : v]));
  const so = spec.opts;
  const fn = spec.fn;
  const report = so.withSurplusReport ? A.freshSurplusReport() : undefined;
  const opts = {
    cities, ownerId: spec.ownerId, map,
    territoryNodes: spec.territoryNodes ? spec.territoryNodes.map(n => ({ ...n })) : undefined,
    placedImprovements: placed,
    pracaAvailable: dec(spec.praca),
    unlockedTechs: new Set(spec.techs),
  };
  for (const k of ['pracaBudgetPercent', 'improvementBudgetCap', 'maxItemsPerCity', 'pracaSurplusThreshold', 'skipWyrab',
    'demandDriven', 'civArchetype', 'playerEra', 'riverForestClearingOnly', 'roadsPass', 'cityLimitExhausted',
    'fortClaimPass', 'riverHexesOnly', 'offRiverClearing', 'irrigationNeedsFarm']) {
    if (so[k] !== undefined) opts[k] = dec(so[k]);
  }
  if (so.resourceDeficitKeys) opts.resourceDeficitKeys = [...so.resourceDeficitKeys];
  if (so.priorityOverride) opts.priorityOverride = [...so.priorityOverride];
  if (so.clearingHexKeys) opts.clearingHexKeys = new Set(so.clearingHexKeys);
  if (so.foodImprovementStages !== undefined) {
    opts.foodImprovementStages = so.foodImprovementStages === true ? true : (c => so.foodImprovementStages.cities.includes(c.id));
  }
  if (report) opts.surplusReport = report;
  if (fn.focusByCity) opts.getFocus = c => byId(fn.focusByCity, c, c.ulepszeniaFocus ?? 'zrownowazone');
  if (fn.onlyWorkedByCity) opts.getOnlyWorked = c => byId(fn.onlyWorkedByCity, c, c.ulepszeniaOnlyWorked ?? false);
  if (fn.workedKeysByCity) opts.getWorkedHexKeys = c => new Set(byId(fn.workedKeysByCity, c, []));
  if (fn.pracaPercentByCity) opts.getPracaBudgetPercent = c => dec(byId(fn.pracaPercentByCity, c, so.pracaBudgetPercent ?? 100));
  if (fn.skipWyrabByCity) opts.getSkipWyrab = c => byId(fn.skipWyrabByCity, c, false);
  if (fn.resourcePassOnlyWorkedByCity) opts.getResourcePassOnlyWorked = c => byId(fn.resourcePassOnlyWorkedByCity, c, false);
  if (fn.civDeny) opts.isImprovementAllowedForCiv = (key) => !fn.civDeny.includes(key);
  const picks = A.pickAutoImprovements(opts);
  return {
    picks: picks.map(p => [p.cityId, p.q, p.r, p.key, p.kosztPraca, p.ownerId]),
    report: report ? { ...report } : null,
  };
}

const scenarios = [];
// `fortNodes`: territoryNodes zawieraja wezel fortu/posterunku -> kwalifikator Rust (territory.rs, stare promienie 10/5
// z data/terrain-improvements.json, stara semantyka wlasciciela) rozni sie od pinu 4bbef081d (5/3, miasto przed fortem).
// To dryf ZALEZNOSCI poza allowlista tematu (repin terytorium) - parytet takich scenariuszy sprawdzany ostro dopiero po repinie;
// `strict`: scenariusze reczne z wezlami fortu, ktore dzis zgadzaja sie 1:1 i musza zgadzac sie zawsze.
const add = (spec) => {
  const res = runWeb(spec);
  const fortNodes = !!spec.territoryNodes?.some(n => n.isFort || n.isOutpost);
  const strict = fortNodes && /^fort-(wlasny|obcy)-/.test(spec.name);
  scenarios.push({ ...spec, fortNodes, strict, expected: res });
};

// --- reczne scenariusze celowane (pelne wersje parametrow, deterministyczne) ---
const T_ALL = TECHS;
const base = (name, extra) => ({
  name, map: SPECIAL_BASE, ownerId: 1,
  cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 5 }],
  territoryNodes: [{ q: 0, r: 0, pop: 5, level: 1, ownerId: 1 }],
  placed: {}, praca: 5000, techs: T_ALL, opts: {}, fn: {}, ...extra,
});
const withOpts = (name, mapOff, optsX, extra = {}) =>
  base(name, { map: SPECIAL_BASE + mapOff, opts: { ...optsX }, ...extra });

add(base('rzeka-farma-zrownowazone-single', {}));
add(withOpts('rzeka-staged-E1', 0, { foodImprovementStages: true }));
add(withOpts('las-rzeka-staged-E2-wycinka', 1, { foodImprovementStages: true }));
add(withOpts('las-rzeka-single-demand', 1, { demandDriven: true }));
add(withOpts('las-bez-rzeki-wzgorza-tartak-deficit', 2, { demandDriven: true, resourceDeficitKeys: ['drewno'], foodImprovementStages: true }));
add(withOpts('las-bez-rzeki-wzgorza-tartak-single-surowce', 2, {}, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 5, focus: 'surowce' }] }));
add(withOpts('zywnosc-profil-staged', 4, { foodImprovementStages: true }, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 6, focus: 'zywnosc' }] }));
add(withOpts('infrastruktura-defense', 0, {}, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 12, focus: 'infrastruktura' }] }));
add(withOpts('surplus-report-demand-brak-niedoboru', 0, { demandDriven: true, withSurplusReport: true }));
add(withOpts('surplus-report-deficit', 3, { demandDriven: true, withSurplusReport: true, resourceDeficitKeys: ['ruda_zelaza'] }));
add(withOpts('fort-claim-gory-zloze', 3, { demandDriven: true, cityLimitExhausted: true, foodImprovementStages: true }, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 3 }], territoryNodes: [{ q: 0, r: 0, pop: 3, level: 1, ownerId: 1 }] }));
add(withOpts('fort-claim-pass-direct', 3, { fortClaimPass: true, demandDriven: true }, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 3 }, { id: 'c2', ownerId: 1, q: 2, r: -1, population: 2 }], territoryNodes: [{ q: 0, r: 0, pop: 3, level: 1, ownerId: 1 }, { q: 2, r: -1, pop: 2, level: 1, ownerId: 1 }] }));
add(withOpts('drogi-demand-staged', 4, { demandDriven: true, foodImprovementStages: true }, { techs: T_ALL, placed: {} }));
add(withOpts('budzet-sztywny-33', 0, { foodImprovementStages: true, pracaBudgetPercent: 33 }, { praca: 300 }));
add(withOpts('budzet-poza-kosztem-0', 0, { foodImprovementStages: true, pracaBudgetPercent: 0 }, { praca: 300 }));
add(withOpts('ai-max1', 0, { foodImprovementStages: true, maxItemsPerCity: 1, demandDriven: true }, {}));
add(withOpts('pracaNaN', 0, { foodImprovementStages: true }, { praca: 'NaN' }));
add(withOpts('pracaInfinity', 0, {}, { praca: 'Infinity' }));
add(withOpts('pracaMinusInf', 0, {}, { praca: '-Infinity' }));
add(withOpts('popNaN', 0, {}, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 'NaN' }], territoryNodes: [{ q: 0, r: 0, pop: 5, level: 1, ownerId: 1 }] }));
add(withOpts('popInfinity-defense', 0, {}, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 'Infinity', focus: 'infrastruktura' }] }));
add(withOpts('popNegative', 0, {}, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: -3 }] }));
add(withOpts('budzetCapNaN', 0, { improvementBudgetCap: 'NaN' }, {}));
add(withOpts('percentNaN', 0, { pracaBudgetPercent: 'NaN' }, {}));
add(withOpts('rezerwa-granica', 0, { pracaSurplusThreshold: 30 }, { praca: 31 }));
add(withOpts('rezerwa-rowna-pula', 0, { pracaSurplusThreshold: 30 }, { praca: 30 }));
add(withOpts('brak-territoryNodes', 0, {}, { territoryNodes: null }));
add(withOpts('brak-miast', 0, {}, { cities: [], territoryNodes: [] }));
add(withOpts('id-sort-utf16', 0, { foodImprovementStages: true }, {
  cities: [{ id: 'b', ownerId: 1, q: 0, r: 0, population: 4 }, { id: '\u{1F600}', ownerId: 1, q: 3, r: 0, population: 4 }, { id: 'Ａ', ownerId: 1, q: -3, r: 0, population: 4 }, { id: 'a10', ownerId: 1, q: 0, r: 3, population: 3 }, { id: 'a9', ownerId: 1, q: 0, r: -3, population: 3 }],
  territoryNodes: [{ q: 0, r: 0, pop: 4, level: 1, ownerId: 1 }, { q: 3, r: 0, pop: 4, level: 1, ownerId: 1 }, { q: -3, r: 0, pop: 4, level: 1, ownerId: 1 }, { q: 0, r: 3, pop: 3, level: 1, ownerId: 1 }, { q: 0, r: -3, pop: 3, level: 1, ownerId: 1 }],
}));
add(withOpts('brak-miast-raport', 0, { withSurplusReport: true, demandDriven: true }, { cities: [], territoryNodes: [] }));
add(withOpts('brak-territory-raport', 0, { withSurplusReport: true, demandDriven: true, resourceDeficitKeys: ['kamien'] }, { territoryNodes: null }));
add(withOpts('praca-0-raport', 0, { withSurplusReport: true, demandDriven: true, resourceDeficitKeys: ['kamien'] }, { praca: 0 }));
add(withOpts('fort-wlasny-posterunek-wezel', 3, { demandDriven: true, cityLimitExhausted: true, foodImprovementStages: true }, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 3 }], territoryNodes: [{ q: 0, r: 0, pop: 3, level: 1, ownerId: 1 }, { q: -3, r: 2, pop: 0, level: 1, ownerId: 1, isOutpost: true }] }));
add(withOpts('fort-obcy-fort-wezel', 3, { demandDriven: true, cityLimitExhausted: true, foodImprovementStages: true }, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 3 }], territoryNodes: [{ q: 0, r: 0, pop: 3, level: 1, ownerId: 1 }, { q: 4, r: -5, pop: 0, level: 1, ownerId: 2, isFort: true }] }));
add(withOpts('fort-warstwa-fort-na-heksie', 3, { fortClaimPass: true, demandDriven: true }, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 3 }], placed: { '-3,-3': ['fort'], '3,-6': 'posterunek' }, territoryNodes: [{ q: 0, r: 0, pop: 3, level: 1, ownerId: 1 }] }));
add(withOpts('fort-budzet-za-maly', 3, { fortClaimPass: true, demandDriven: true }, { praca: 1 }));
add(withOpts('fort-budzet-percent-0', 3, { fortClaimPass: true, demandDriven: true, pracaBudgetPercent: 0 }, {}));
add(withOpts('fort-rezerwa', 3, { fortClaimPass: true, demandDriven: true, pracaSurplusThreshold: 4000 }, { praca: 4100 }));
add(withOpts('fort-per-miasto-percent', 3, { fortClaimPass: true, demandDriven: true, pracaBudgetPercent: 50 }, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 3 }, { id: 'c2', ownerId: 1, q: 2, r: -1, population: 2 }], territoryNodes: [{ q: 0, r: 0, pop: 3, level: 1, ownerId: 1 }, { q: 2, r: -1, pop: 2, level: 1, ownerId: 1 }], fn: { pracaPercentByCity: { c1: 0, c2: 80 } } }));
add(withOpts('fort-civ-deny-fort', 3, { fortClaimPass: true, demandDriven: true }, { fn: { civDeny: ['fort'] } }));
add(withOpts('fort-civ-deny-oba', 3, { fortClaimPass: true, demandDriven: true }, { fn: { civDeny: ['fort', 'posterunek'] } }));
add(withOpts('fort-bez-techow', 3, { fortClaimPass: true, demandDriven: true }, { techs: [] }));
add(withOpts('stadnina-kon-magazyn', 1, { priorityOverride: ['stadnina'] }, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 5, kon: 60 }, { id: 'c2', ownerId: 9, q: 2, r: 0, population: 5, kon: 500 }], territoryNodes: [{ q: 0, r: 0, pop: 5, level: 1, ownerId: 1 }, { q: 2, r: 0, pop: 5, level: 1, ownerId: 9 }] }));

// --- scenariusze losowe ---
const N_RANDOM = 1500;
for (let i = 0; i < N_RANDOM; i++) add(genScenario(`rnd-${i}`));
// scenariusze ukierunkowane na etapy (staged) i fort
for (let i = 0; i < 300; i++) add(genScenario(`stg-${i}`, { staged: true, map: chance(0.5) ? SPECIAL_BASE + ri(0, 4) : undefined, praca: pick([60, 400, 3000, 9000]), techs: chance(0.8) ? T_ALL : undefined }));
for (let i = 0; i < 150; i++) {
  const s = genScenario(`fort-${i}`, { staged: true, map: SPECIAL_BASE + 3, praca: 6000, techs: T_ALL, nCities: ri(1, 3) });
  s.opts.demandDriven = true; s.opts.cityLimitExhausted = true; s.opts.foodImprovementStages = true;
  for (const c of s.cities) { c.ownerId = 1; delete c.focus; }
  s.territoryNodes = s.territoryNodes?.filter(n => n.ownerId === 1) ?? null;
  if (s.territoryNodes && chance(0.6)) {
    const lh = landHexes(SPECIAL_BASE + 3);
    for (let j = ri(1, 3); j > 0; j--) {
      const h = pick(lh);
      const isFort = chance(0.5);
      s.territoryNodes.push({ q: h.q, r: h.r, pop: 0, level: 1, ownerId: chance(0.6) ? 1 : 2, ...(isFort ? { isFort: true } : { isOutpost: true }) });
    }
  }
  add(s);
}

// ---- helpery (P1) --------------------------------------------------------------------------
const helpers = {
  constants: {
    AI_IMPROVEMENT_PRIORITY: [...A.AI_IMPROVEMENT_PRIORITY],
    ULEPSZENIA_FOCUS_ZYWNOSC: [...A.ULEPSZENIA_FOCUS_ZYWNOSC],
    ULEPSZENIA_ZYWNOSCIOWE: [...A.ULEPSZENIA_ZYWNOSCIOWE],
    ZERO_YIELD_IMPROVEMENTS: [...A.ZERO_YIELD_IMPROVEMENTS],
    JEDEN_NA_ILU_OBYWATELI: A.JEDEN_NA_ILU_OBYWATELI,
    WYRAB_MIN_FOREST_IN_RADIUS: A.WYRAB_MIN_FOREST_IN_RADIUS,
    AUTO_ULEPSZENIA_PRACA_RESERVE: A.AUTO_ULEPSZENIA_PRACA_RESERVE,
    FOOD_STAGE_MAX_ITEMS_PER_CITY: enc(A.FOOD_STAGE_MAX_ITEMS_PER_CITY),
    IMPROVEMENT_FOR_DEFICIT: Object.entries(A.IMPROVEMENT_FOR_DEFICIT).map(([k, v]) => [k, [...v]]),
    ROAD_KEYS: [...A.ROAD_KEYS],
    FORT_CLAIM_MIN_NEW_HEXES: A.FORT_CLAIM_MIN_NEW_HEXES,
  },
  priorities: ['zywnosc', 'surowce', 'infrastruktura', 'zrownowazone', 'xyz', '', 'ZYWNOSC'].flatMap(f =>
    [false, true].map(skip => ({ focus: f, skipWyrab: skip, out: [...A.prioritiesForUlepszeniaFocus(f, skip)] }))),
  hasNonFood: [undefined, [], ['zywnosc'], ['zywnosc', 'zywnosc'], ['drewno'], ['zywnosc', 'drewno'], [''], ['Zywnosc']].map(d => ({
    in: d === undefined ? null : d, out: A.hasNonFoodResourceDeficit(d),
  })),
  deficitKeys: [
    undefined, [], ['drewno'], ['kamien', 'glina'], ['ruda', 'ruda_zelaza', 'ruda_cyny'], ['sol', 'kon'], ['zywnosc'],
    ['zloto', 'stal'], ['drewno', 'drewno'], ['drewno', 'kamien', 'drewno', 'kon'], ['xyz', 'sol'], [''], ['Drewno'],
  ].map(d => ({ in: d === undefined ? null : d, deficit: A.deficitImprovementKeys(d), actionable: A.actionableDeficitKeys(d) })),
  cityLimit: (() => {
    const out = [];
    const bases = [undefined, 0, 1, 2, 3, 5, 'NaN', 'Infinity', '-Infinity', 2.5];
    const eras = [undefined, 0, 1, 2, 3, 'NaN', -1, 1.5];
    const cityLists = [[], [{}], [{ foundedByOwner: false }], [{ foundedByOwner: true }, {}], [{}, {}, {}], [{ foundedByOwner: false }, { foundedByOwner: false }, {}, {}, {}, {}, {}, {}]];
    const dec = (x) => (typeof x === 'string' ? Number(x) : x);
    for (const b of bases) for (const e of eras) for (const cl of cityLists) {
      out.push({
        base: b ?? null, era: e ?? null,
        cities: cl.map(c => (c.foundedByOwner === undefined ? null : c.foundedByOwner)),
        out: A.isCityLimitExhausted(cl, b === undefined ? undefined : dec(b), e === undefined ? undefined : dec(e)),
      });
    }
    return out;
  })(),
};

writeFileSync(join(outDir, 'pick.json'), JSON.stringify({ pin: PIN, source: 'gra/src/game/auto-improvements.ts', techs: TECHS, maps: mapOut, scenarios }) + '\n');
writeFileSync(join(outDir, 'helpers.json'), JSON.stringify({ pin: PIN, ...helpers }) + '\n');
const nonEmpty = scenarios.filter(s => s.expected.picks.length > 0).length;
const kinds = {};
for (const s of scenarios) for (const p of s.expected.picks) kinds[p[3]] = (kinds[p[3]] ?? 0) + 1;
console.log(`scenarios=${scenarios.length} nonEmpty=${nonEmpty} maps=${MAPS.length}`);
console.log(JSON.stringify(kinds));
