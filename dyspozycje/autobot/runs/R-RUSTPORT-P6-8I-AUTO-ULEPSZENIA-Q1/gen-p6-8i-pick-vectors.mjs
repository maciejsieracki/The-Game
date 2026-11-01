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
const buildMapOut = () => MAPS.map(m => ({
  hexes: m.hexes.map(h => [h.q, h.r, h.teren, h.nak, h.zloze, h.rzeka ? 1 : 0, h.ulepszenie, h.ulepszenia]),
  riverPaths: m.riverPaths,
}));

// ---- budowa obiektow weba ----------------------------------------------------------------
const toWebMap = (m) => {
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
};
const webMaps = MAPS.map(toWebMap);
// Mapy DOPISYWANE po scenariuszach losowych (nie zmieniaja ciagu PRNG ani indeksow wczesniejszych map).
const addMap = (m) => { MAPS.push(m); webMaps.push(toWebMap(m)); return MAPS.length - 1; };

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

// ---- runda 4b: scenariusze celowane w gałęzie wykryte przez mutacje (DOPISANE na końcu: ciąg PRNG i
// indeksy wcześniejszych scenariuszy/map bez zmian) ----------------------------------------------------
const cost = (k) => IT.getImprovementMeta(k).kosztPraca;
const COST_FORT = cost('fort');
const COST_POST = cost('posterunek');
const COST_ZEL = cost('kopalnia_zelaza');
const T_NO_WOJ = T_ALL.filter(t => t !== 'Wojskowość');
const dist3 = (q, r) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
const mkSpec = (name, map, o = {}) => {
  const cities = o.cities ?? [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 5 }];
  return {
    name, map, ownerId: 1, cities,
    territoryNodes: o.territoryNodes === undefined ? cities.map(c => ({ q: c.q, r: c.r, pop: typeof c.population === 'number' ? c.population : 5, level: 1, ownerId: c.ownerId })) : o.territoryNodes,
    placed: o.placed ?? {}, praca: o.praca ?? 5000, techs: o.techs ?? T_ALL, opts: o.opts ?? {}, fn: o.fn ?? {},
  };
};
// M_RIVER: rzeka r=0, |q|<=2; las tylko na 5 heksach WEWNATRZ terytorium miasta (pop 6 -> promien 6), zeby prog
// `WYRAB_MIN_FOREST_IN_RADIUS` (>= 3 lasu w promieniu) realnie wiazal (las poza terytorium nie wchodzi do zliczen picka).
const M_FOREST_SPOTS = new Set(['0,3', '1,3', '-1,3', '0,-3', '1,-3']);
const M_RIVER = addMap(pureMap((q, r) => ({ teren: TB.Rownina, nak: M_FOREST_SPOTS.has(`${q},${r}`) ? NK.Las : NK.Brak, rzeka: r === 0 && Math.abs(q) <= 2 }), 8,
  [[[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0]]]));
const M_GORY = addMap(pureMap((q, r) => ({ teren: TB.Gory, zloze: dist3(q, r) >= 3 && ((q * 5 + r * 3) % 7 + 7) % 7 === 0 ? 'zelazo' : null }), 9, []));
const M_GORY2 = addMap(pureMap((q, r) => ({ teren: TB.Gory, zloze: ((q * 5 + r * 3) % 11 + 11) % 11 === 0 ? 'zelazo' : null }), 18, []));
const M_G1 = addMap({ hexes: [...disk(0, 0, 6).map(([q, r]) => ({ q, r, teren: TB.Gory, nak: NK.Brak, zloze: null, rzeka: false, ulepszenie: null, ulepszenia: null })),
  { q: 7, r: 0, teren: TB.Rownina, nak: NK.Brak, zloze: null, rzeka: false, ulepszenie: null, ulepszenia: null }], riverPaths: [] });
const M_SORT = addMap(pureMap(() => ({ teren: TB.Rownina }), 14, [[[-11, 0], [-11, 1]], [[11, 0], [11, -1]], [[0, 11], [1, 11]]]));
const M_PROBE = addMap(pureMap(() => ({ teren: TB.Rownina }), 4, []));
const M_PROBE2 = addMap(pureMap((q, r) => ({ teren: TB.Rownina, zloze: q === 1 && r === 0 ? 'miedz' : null }), 4, []));
const DEV_KEYS = ['farma', 'irygacja', 'bydlo', 'owce', 'lama', 'tarasy'];
const riverDevPlaced = (extra = {}) => {
  const p = { ...extra };
  for (const q of [-2, -1, 0, 1, 2]) p[`${q},0`] = [...DEV_KEYS];
  return p;
};
const forestAids = { '0,4': ['tartak'], '1,4': ['oboz_lowiecki'] };

add(mkSpec('r4b-hill-tartak-layer', SPECIAL_BASE + 2, {
  cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 5, focus: 'surowce' }],
  placed: Object.fromEntries(disk(0, 0, 7).filter(([q, r]) => (q + r) % 2 === 0).map(([q, r]) => [`${q},${r}`, ['tartak']])),
}));
add(mkSpec('r4b-override-wyrab-threshold', M_RIVER, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 6 }], opts: { priorityOverride: ['wyrab'] } }));
add(mkSpec('r4b-civdeny-tartak-wyrab', M_RIVER, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 6, focus: 'surowce' }], opts: { priorityOverride: ['wyrab', 'tartak'] }, fn: { civDeny: ['tartak'] } }));
add(mkSpec('r4b-offriver-surowce', M_RIVER, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 6, focus: 'surowce' }], opts: { offRiverClearing: true, priorityOverride: ['wyrab', 'tartak'] } }));
// populacja NaN -> promien okolicy 0 (+1 w pickerze): las musi lezec przy samym miescie
const M_NAN = addMap(pureMap((q, r) => ({ teren: TB.Rownina, nak: ['1,0', '0,1', '-1,1'].includes(`${q},${r}`) ? NK.Las : NK.Brak }), 4, []));
add(mkSpec('r4b-popnan-lesne', M_NAN, {
  cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 'NaN', focus: 'surowce' }],
  territoryNodes: [{ q: 0, r: 0, pop: 6, level: 1, ownerId: 1 }], placed: { '1,-1': ['tartak'] },
  opts: { priorityOverride: ['wyrab', 'tartak'] },
}));
add(mkSpec('r4b-popnan-defense', M_GORY, {
  cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 'NaN', focus: 'infrastruktura' }],
  territoryNodes: [{ q: 0, r: 0, pop: 6, level: 1, ownerId: 1 }], placed: { '-2,3': ['posterunek'] },
}));
add(mkSpec('r4b-rzeki-scheduled', M_RIVER, {
  cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 6 }],
  placed: (() => { const p = riverDevPlaced(forestAids); delete p['2,0']; return p; })(), opts: { clearingHexKeys: ['2,0'] },
}));
add(mkSpec('r4b-rzeki-devkeys', M_RIVER, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 6 }], placed: riverDevPlaced(forestAids) }));
add(mkSpec('r4b-rzeki-devkeys-nodev', M_RIVER, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 6 }], placed: riverDevPlaced(forestAids), techs: [] }));
add(mkSpec('r4b-probe-dup', M_PROBE, {
  cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 2 }], praca: 10,
  placed: Object.fromEntries([[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]].map(([q, r]) => [`${q},${r}`, ['droga']])),
  opts: { priorityOverride: ['droga'], withSurplusReport: true },
}));
add(mkSpec('r4b-probe-hexallows', M_PROBE2, {
  cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 2, focus: 'surowce' }], praca: 10,
  opts: { priorityOverride: ['droga'], withSurplusReport: true }, fn: { onlyWorkedByCity: { c1: true }, workedKeysByCity: { c1: [] } },
}));
add(mkSpec('r4b-probe-hexallows-worked', M_PROBE2, {
  cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 2, focus: 'surowce' }], praca: 10,
  opts: { priorityOverride: ['droga'], withSurplusReport: true }, fn: { onlyWorkedByCity: { c1: true }, workedKeysByCity: { c1: ['1,0'] } },
}));
add(mkSpec('r4b-cap-nan-pct', SPECIAL_BASE, { praca: 300, opts: { foodImprovementStages: true, pracaBudgetPercent: 20, improvementBudgetCap: 'NaN' } }));
add(mkSpec('r4b-cap-inf-pct', SPECIAL_BASE, { praca: 300, opts: { foodImprovementStages: true, pracaBudgetPercent: 20, improvementBudgetCap: 'Infinity' } }));
add(mkSpec('r4b-pct-nan-cap', SPECIAL_BASE, { praca: 300, opts: { foodImprovementStages: true, pracaBudgetPercent: 'NaN', improvementBudgetCap: 100 } }));
add(mkSpec('r4b-pct-nan-cap-single', SPECIAL_BASE, { praca: 300, opts: { pracaBudgetPercent: 'NaN', improvementBudgetCap: 100 } }));
add(mkSpec('r4b-empty-cities-deficit-report', SPECIAL_BASE, { cities: [], territoryNodes: [], opts: { withSurplusReport: true, demandDriven: true, resourceDeficitKeys: ['kamien'] } }));
add(mkSpec('r4b-id-sort-far', M_SORT, {
  cities: [{ id: 'b', ownerId: 1, q: -12, r: 0, population: 1 }, { id: '\u{1F600}', ownerId: 1, q: 12, r: 0, population: 1 }, { id: 'Ａ', ownerId: 1, q: 0, r: 12, population: 1 }],
  opts: { foodImprovementStages: true },
}));
add(mkSpec('r4b-id-sort-far-single', M_SORT, {
  cities: [{ id: 'b', ownerId: 1, q: -12, r: 0, population: 1 }, { id: '\u{1F600}', ownerId: 1, q: 12, r: 0, population: 1 }, { id: 'Ａ', ownerId: 1, q: 0, r: 12, population: 1 }],
}));
const fortOpts = (extra = {}) => ({ fortClaimPass: true, demandDriven: true, ...extra });
const cityG = { id: 'c1', ownerId: 1, q: 0, r: 0, population: 3 };
add(mkSpec('r4b-fort-pct-cap', M_GORY, { cities: [cityG], praca: 6000, opts: fortOpts({ pracaBudgetPercent: Math.max(0.1, (COST_FORT / 6000) * 50), improvementBudgetCap: 100000 }) }));
add(mkSpec('r4b-fort-city-hex', M_GORY, { cities: [{ id: 'c1', ownerId: 1, q: 2, r: 0, population: 0 }], praca: 6000, opts: fortOpts() }));
add(mkSpec('r4b-fort-gain-one', M_G1, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 6 }], praca: 6000, opts: fortOpts() }));
const twoFar = [{ id: 'c1', ownerId: 1, q: -12, r: 0, population: 3 }, { id: 'c2', ownerId: 1, q: 12, r: 0, population: 3 }];
add(mkSpec('r4b-fort-two-far', M_GORY2, { cities: twoFar, praca: 6000, opts: fortOpts() }));
add(mkSpec('r4b-fort-reserve-two', M_GORY2, { cities: twoFar, praca: 1000, opts: fortOpts({ pracaSurplusThreshold: 1000 - 1.5 * COST_FORT }) }));
add(mkSpec('r4b-fort-cap-two', M_GORY2, { cities: twoFar, praca: 3 * COST_FORT, opts: fortOpts({ pracaBudgetPercent: 50 }) }));
add(mkSpec('r4b-fort-pool-two', M_GORY2, { cities: twoFar, praca: 1.5 * COST_FORT, opts: fortOpts() }));
add(mkSpec('r4b-fort-wait-roads', M_GORY, { cities: [cityG], praca: COST_FORT - 1, opts: { foodImprovementStages: true, demandDriven: true, cityLimitExhausted: true } }));
add(mkSpec('r4b-fort-then-roads', M_GORY, { cities: [cityG], praca: 6000, opts: { foodImprovementStages: true, demandDriven: true, cityLimitExhausted: true } }));
add(mkSpec('r4b-roads-only', M_GORY, { cities: [cityG], praca: 6000, opts: { foodImprovementStages: true, demandDriven: true } }));
if (COST_POST < COST_ZEL) {
  add(mkSpec('r4b-fort-deficit-wait', M_GORY, {
    cities: [cityG], praca: Math.floor((COST_POST + COST_ZEL) / 2), techs: T_NO_WOJ,
    opts: { foodImprovementStages: true, demandDriven: true, cityLimitExhausted: true, resourceDeficitKeys: ['ruda_zelaza'] },
  }));
}
add(mkSpec('r4b-fort-posterunek-control', M_GORY, {
  cities: [cityG], praca: 6000, techs: T_NO_WOJ, opts: { foodImprovementStages: true, demandDriven: true, cityLimitExhausted: true },
}));
add(mkSpec('r4b-fort-posterunek-pool', M_GORY, {
  cities: [cityG], praca: Math.floor((COST_POST + COST_ZEL) / 2), techs: T_NO_WOJ, opts: { foodImprovementStages: true, demandDriven: true, cityLimitExhausted: true },
}));
add(mkSpec('r4b-fort-deficit-pass', M_GORY, {
  cities: [cityG], praca: 6000,
  opts: { foodImprovementStages: true, demandDriven: true, cityLimitExhausted: true, resourceDeficitKeys: ['ruda_zelaza'] },
}));
add(mkSpec('r4b-fallback-record', M_GORY, {
  cities: [{ id: 'A', ownerId: 1, q: 0, r: 0, population: 6 }, { id: 'B', ownerId: 1, q: 3, r: 0, population: 6 }],
  opts: { foodImprovementStages: { cities: ['A'] } },
}));
add(mkSpec('r4b-fallback-record-close', M_GORY, {
  cities: [{ id: 'A', ownerId: 1, q: 0, r: 0, population: 6 }, { id: 'B', ownerId: 1, q: 1, r: 0, population: 6 }],
  opts: { foodImprovementStages: { cities: ['A'] }, maxItemsPerCity: 3 },
}));
add(mkSpec('r4b-fort-record-other', M_GORY, {
  cities: [{ id: 'A', ownerId: 1, q: 0, r: 0, population: 3 }, { id: 'B', ownerId: 1, q: -4, r: 4, population: 0, focus: 'infrastruktura' }],
  praca: 6000, opts: { foodImprovementStages: { cities: ['A'] }, demandDriven: true, cityLimitExhausted: true },
}));
add(mkSpec('r4b-fort-other-city', M_GORY2, {
  cities: [{ id: 'A', ownerId: 1, q: 0, r: 0, population: 3 }, { id: 'B', ownerId: 1, q: 4, r: 0, population: 0, focus: 'infrastruktura' }],
  praca: COST_FORT + COST_POST - 1, opts: { foodImprovementStages: { cities: ['A'] }, demandDriven: true, cityLimitExhausted: true },
}));
add(mkSpec('r4b-fort-other-city-rich', M_GORY2, {
  cities: [{ id: 'A', ownerId: 1, q: 0, r: 0, population: 3 }, { id: 'B', ownerId: 1, q: 4, r: 0, population: 0, focus: 'infrastruktura' }],
  praca: 6000, opts: { foodImprovementStages: { cities: ['A'] }, demandDriven: true, cityLimitExhausted: true },
}));
add(mkSpec('r4b-wyrab-budget-floor', SPECIAL_BASE + 1, { praca: 8, opts: { foodImprovementStages: true, pracaBudgetPercent: 33, demandDriven: true } }));
add(mkSpec('r4b-wyrab-budget-floor-single', SPECIAL_BASE + 1, { praca: 8, opts: { pracaBudgetPercent: 33, demandDriven: true, priorityOverride: ['wyrab'] } }));

// rodzina `fortg-*`: mapy gorskie bez ziemi uprawnej -> etapy zywnosci i sciezka zapasowa puste, osiagalne E-FORT i drogi
for (let i = 0; i < 160; i++) {
  const big = chance(0.4);
  const mapIdx = big ? M_GORY2 : M_GORY;
  const nC = ri(1, 3);
  const spots = big ? [[-12, 0], [12, 0], [0, 12], [0, -12], [-9, 9], [9, -9]] : [[0, 0], [3, 0], [-3, 2], [2, -3], [0, 4], [4, -4]];
  const cities = [];
  const usedSpot = new Set();
  for (let j = 0; j < nC; j++) {
    const sp = pick(spots);
    if (usedSpot.has(sp.join(','))) continue;
    usedSpot.add(sp.join(','));
    const c = { id: pick(['A', 'B', 'c' + j, 'z' + j]) + j, ownerId: 1, q: sp[0], r: sp[1], population: pick([0, 1, 2, 3, 4, 6]) };
    if (chance(0.3)) c.focus = pick(['infrastruktura', 'surowce', 'zywnosc', 'zrownowazone']);
    cities.push(c);
  }
  const o = { foodImprovementStages: chance(0.7) ? true : { cities: subset(cities.map(c => c.id), 0.5) }, demandDriven: chance(0.9) };
  if (chance(0.85)) o.cityLimitExhausted = true;
  if (chance(0.4)) o.resourceDeficitKeys = subset(['ruda_zelaza', 'kamien', 'ruda', 'sol', 'zywnosc'], 0.4);
  if (chance(0.3)) o.pracaBudgetPercent = pick([100, 50, 20, 5]);
  if (chance(0.2)) o.maxItemsPerCity = pick([1, 2]);
  if (chance(0.2)) o.pracaSurplusThreshold = pick([10, 100, 300]);
  const specG = mkSpec(`fortg-${i}`, mapIdx, {
    cities, praca: pick([30, COST_POST + 5, COST_FORT - 1, COST_FORT + 5, 2 * COST_FORT, 600, 3000, 8000]),
    techs: chance(0.7) ? T_ALL : T_NO_WOJ, opts: o,
  });
  add(specG);
}

// morze w promieniu fortu nie liczy sie do zysku; terytorium wlasne w calosci = zysk 0 (mapy dopisane po rodzinie fortg)
const gorySea = (seaTerrain) => addMap({
  hexes: [...disk(0, 0, 6).map(([q, r]) => ({ q, r, teren: TB.Gory, nak: NK.Brak, zloze: null, rzeka: false, ulepszenie: null, ulepszenia: null })),
    { q: 7, r: 0, teren: seaTerrain, nak: NK.Brak, zloze: null, rzeka: false, ulepszenie: null, ulepszenia: null }],
  riverPaths: [],
});
const M_G1M = gorySea(TB.Morze);
const M_G1P = gorySea(TB.PlytkieMorze);
const M_G0 = addMap({ hexes: disk(0, 0, 6).map(([q, r]) => ({ q, r, teren: TB.Gory, nak: NK.Brak, zloze: null, rzeka: false, ulepszenie: null, ulepszenia: null })), riverPaths: [] });
const city6 = { id: 'c1', ownerId: 1, q: 0, r: 0, population: 6 };
add(mkSpec('r4b-fort-sea-morze', M_G1M, { cities: [city6], praca: 6000, opts: fortOpts() }));
add(mkSpec('r4b-fort-sea-plytkie', M_G1P, { cities: [city6], praca: 6000, opts: fortOpts() }));
add(mkSpec('r4b-fort-all-owned', M_G0, { cities: [city6], praca: 6000, opts: fortOpts() }));
add(mkSpec('r4b-fort-gain-one-staged', M_G1, { cities: [city6], praca: 6000, opts: { foodImprovementStages: true, demandDriven: true, cityLimitExhausted: true } }));

// drogi czekaja na niedobor (P43): sciezka zapasowa NIE widzi celu (onlyWorked miasta), przebieg niedoboru widzi (surowce wszedzie)
const M_MIX = addMap(pureMap((q, r) => ({ teren: (q === 0 && r === 0) || (q === 1 && r === 0) ? TB.Pustynia : TB.Gory }), 9, []));
const mixSpec = (name, praca) => mkSpec(name, M_MIX, {
  cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 3 }], praca,
  opts: { foodImprovementStages: true, demandDriven: true, resourceDeficitKeys: ['kamien'] },
  fn: { onlyWorkedByCity: { c1: true }, workedKeysByCity: { c1: ['1,0'] }, resourcePassOnlyWorkedByCity: { c1: false } },
});
add(mixSpec('r4b-roads-wait-deficit', cost('kamieniolom') - 4));
add(mixSpec('r4b-roads-deficit-affordable', 5000));

// wezly fortu/posterunku w territoryNodes na mapie gorskiej (E-FORT osiagalny); `strict` (nazwa `fort-wlasny-`/`fort-obcy-`)
const nodeCity = { q: 0, r: 0, pop: 3, level: 1, ownerId: 1 };
const fortStaged = { foodImprovementStages: true, demandDriven: true, cityLimitExhausted: true };
for (const [nm, nodes] of [
  ['fort-wlasny-gory-posterunek', [{ q: -3, r: 2, pop: 0, level: 1, ownerId: 1, isOutpost: true }]],
  ['fort-wlasny-gory-fort', [{ q: 3, r: -2, pop: 0, level: 1, ownerId: 1, isFort: true }]],
  ['fort-wlasny-gory-oba', [{ q: -3, r: 2, pop: 0, level: 1, ownerId: 1, isOutpost: true }, { q: 2, r: 2, pop: 0, level: 1, ownerId: 1, isFort: true }]],
  ['fort-obcy-gory-fort', [{ q: 6, r: -8, pop: 0, level: 1, ownerId: 2, isFort: true }]],
  ['fort-obcy-gory-posterunek', [{ q: -7, r: 7, pop: 0, level: 1, ownerId: 2, isOutpost: true }]],
]) {
  add(mkSpec(nm, M_GORY, { cities: [cityG], territoryNodes: [nodeCity, ...nodes], praca: 6000, opts: fortStaged }));
  add(mkSpec(nm + '-direct', M_GORY, { cities: [cityG], territoryNodes: [nodeCity, ...nodes], praca: 6000, opts: fortOpts() }));
}
// S3-1: dostep do wody = sasiedztwo heksu rzeki (kierunek (+1,0) tylko ten): las z rzeka obok nie dostaje tartaku
const M_ACCESS = addMap(pureMap((q, r) => ({ teren: TB.Rownina, nak: q === -1 && r === 1 ? NK.Las : NK.Brak }), 5, [[[0, 1]]]));
add(mkSpec('r4b-access-e', M_ACCESS, { cities: [{ id: 'c1', ownerId: 1, q: 0, r: 0, population: 5, focus: 'surowce' }], opts: { priorityOverride: ['tartak'] }, praca: 500 }));
add(mkSpec('r4b-cap-nan-pct-single', SPECIAL_BASE, { praca: 300, opts: { pracaBudgetPercent: 20, improvementBudgetCap: 'NaN' } }));
add(mkSpec('r4b-cap-inf-pct-single', SPECIAL_BASE, { praca: 300, opts: { pracaBudgetPercent: 20, improvementBudgetCap: 'Infinity' } }));

// ---- runda 5 (obrona): wektory celowane na mutanty F40 / P24 / P38 ---------------------------------------------
// P24: `demandDriven` wylaczony przy `cityLimitExhausted` -> brak fortow i drog (road_cities puste).
add(mkSpec('r5-nodemand-limit-staged', M_GORY, { cities: [cityG], praca: 6000, opts: { foodImprovementStages: true, cityLimitExhausted: true } }));
add(mkSpec('r5-nodemand-false-limit-staged', M_GORY, { cities: [cityG], praca: 6000, opts: { foodImprovementStages: true, cityLimitExhausted: true, demandDriven: false } }));
add(mkSpec('r5-nodemand-staged-roads', M_GORY, { cities: [cityG], praca: 6000, opts: { foodImprovementStages: true, demandDriven: false } }));
// Rodziny losowe (wlasny PRNG, nie dotyka `rnd`): F40 = wiele duzych miast, E-FORT stawia >= 2 forty w jednym przebiegu;
// P38 = miasto A (etapy) stawia fort, miasto B (zwykla sciezka) widzi zapisany fort. Do generatora trafiaja wylacznie
// indeksy z KILLERS (znalezione wyszukiwaniem: `SEARCH=1` dopisuje WSZYSTKICH kandydatow `srch-*`; nazwy zabijajace mutanta: `MUT_NAMES=<plik>` w mutate-8i-pick.py).
const r5 = mulberry32(0x5eed0f40);
const r5i = (a, b) => a + Math.floor(r5() * (b - a + 1));
const r5pick = (arr) => arr[Math.floor(r5() * arr.length)];
const KILLERS = { f40: [33, 66, 152], p38: [6, 8, 9] };
const SEARCH = process.env.SEARCH === '1';
const r5spec = (kind, i, build) => {
  const sp = build();
  if (SEARCH || KILLERS[kind].includes(i)) add({ ...sp, name: `${SEARCH ? 'srch' : 'r5'}-${kind}-${i}` });
};
for (let i = 0; i < 400; i++) r5spec('f40', i, () => {
  const n = r5i(2, 3);
  const cs = [];
  for (let k = 0; k < n; k++) cs.push({ id: `c${k + 1}`, ownerId: 1, q: r5i(-9, 9), r: r5i(-9, 9), population: r5pick([3, 8, 10, 12, 15]) });
  return mkSpec('x', r5pick([M_GORY2, M_GORY2, M_GORY]), { cities: cs, praca: 6000, opts: fortOpts() });
});
// P38: miasto B (zwykla sciezka) lezy tuz przy forcie, ktory E-FORT postawil dla A (pozycja fortu z przebiegu weba tylko
// dla A); kwalifikator odrzuca ten sam klucz (`fort`) na heksie z zapisana warstwa, wiec pominiecie `record(&fort_picks)` zmienia picki B.
for (let i = 0; i < (SEARCH ? 200 : 60); i++) r5spec('p38', i, () => {
  const map = r5pick([M_GORY, M_GORY2]);
  const stOpts = { foodImprovementStages: { cities: ['A'] }, demandDriven: true, cityLimitExhausted: true };
  const a = { id: 'A', ownerId: 1, q: 0, r: 0, population: r5pick([3, 3, 6]) };
  // `territoryNodes` tylko z wezlem A: miasto B nie przesuwa wyboru fortu (brak wlasnego wezla), a lezy w terytorium A.
  const nodesA = [{ q: 0, r: 0, pop: a.population, level: 1, ownerId: 1 }];
  const hexDist = (q1, r1, q2, r2) => Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(q1 - q2 + r1 - r2));
  const only = runWeb(mkSpec('x', map, { cities: [a], territoryNodes: nodesA, praca: 6000, opts: stOpts }));
  const f = only.picks.find(p => p[0] === 'A' && (p[3] === 'fort' || p[3] === 'posterunek')) ?? ['A', 3, 0];
  let bq, br;
  do { bq = f[1] + r5i(-2, 2); br = f[2] + r5i(-2, 2); } while (hexDist(bq, br, f[1], f[2]) > 2 || (bq === 0 && br === 0));
  const b = { id: 'B', ownerId: 1, q: bq, r: br, population: r5pick([0, 0, 1, 3]), focus: 'infrastruktura' };
  return mkSpec('x', map, { cities: [a, b], territoryNodes: nodesA, praca: 6000, opts: stOpts });
});
// P24: wszystko poza fort/posterunek zablokowane przez cywilizacje -> zapasowa sciezka pusta, a E-FORT osiagalny tylko
// przy `demandDriven` (kontrola); bez `demandDriven` brak fortow (road_cities puste).
const DENY_NON_FORT = [...new Set([...A.AI_IMPROVEMENT_PRIORITY, ...A.ROAD_KEYS, 'wyrab', 'stadnina', 'tartak', 'oboz_lowiecki'])].filter(k => k !== 'fort' && k !== 'posterunek');
add(mkSpec('r5-nodemand-onlyfort', M_GORY, { cities: [cityG], praca: 6000, fn: { civDeny: DENY_NON_FORT }, opts: { foodImprovementStages: true, cityLimitExhausted: true } }));
add(mkSpec('r5-nodemand-false-onlyfort', M_GORY, { cities: [cityG], praca: 6000, fn: { civDeny: DENY_NON_FORT }, opts: { foodImprovementStages: true, cityLimitExhausted: true, demandDriven: false } }));
add(mkSpec('r5-demand-onlyfort-control', M_GORY, { cities: [cityG], praca: 6000, fn: { civDeny: DENY_NON_FORT }, opts: { foodImprovementStages: true, cityLimitExhausted: true, demandDriven: true } }));
// P36 (probe, NIE zabija mutanta - patrz dokument tematu): niedobor `ruda_zelaza` (kopalnia 88 > posterunek 60) czeka na Prace, a sciezka zapasowa jest pusta, bo miasto liczy
// tylko pracowane heksy (`ulepszeniaOnlyWorked`), podczas gdy przebieg niedoboru ma wlasna flage (resourcePassOnlyWorked=false):
// bez warunku `!deficit_is_pending_now` E-FORT zabralby Prace posterunkiem sprzed kopalni (K2/K3: niedobor ma pierwszenstwo).
// (jak M_MIX z P43: pracowany heks `1,0` = pustynia, wiec zapasowa sciezka nie widzi celu, a przebieg niedoboru tak)
const M_MIXZ = addMap(pureMap((q, r) => ({
  teren: (q === 0 && r === 0) || (q === 1 && r === 0) ? TB.Pustynia : TB.Gory,
  zloze: dist3(q, r) >= 3 && ((q * 5 + r * 3) % 7 + 7) % 7 === 0 ? 'zelazo' : null,
}), 9, []));
const deficitOnlyWorkedFn = { onlyWorkedByCity: { c1: true }, workedKeysByCity: { c1: ['1,0'] }, resourcePassOnlyWorkedByCity: { c1: false } };
add(mkSpec('r5-fort-deficit-onlyworked-wait', M_MIXZ, {
  cities: [cityG], praca: Math.floor((COST_POST + COST_ZEL) / 2), techs: T_NO_WOJ, fn: deficitOnlyWorkedFn,
  opts: { foodImprovementStages: true, demandDriven: true, cityLimitExhausted: true, resourceDeficitKeys: ['ruda_zelaza'] },
}));
add(mkSpec('r5-fort-deficit-onlyworked-rich', M_MIXZ, {
  cities: [cityG], praca: 6000, techs: T_NO_WOJ, fn: deficitOnlyWorkedFn,
  opts: { foodImprovementStages: true, demandDriven: true, cityLimitExhausted: true, resourceDeficitKeys: ['ruda_zelaza'] },
}));
add(mkSpec('r5-fort-nodeficit-onlyworked-control', M_MIXZ, {
  cities: [cityG], praca: Math.floor((COST_POST + COST_ZEL) / 2), techs: T_NO_WOJ, fn: deficitOnlyWorkedFn,
  opts: { foodImprovementStages: true, demandDriven: true, cityLimitExhausted: true },
}));

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
  // `wyrab` nie ma bramki technologicznej (dowod rownowaznosci mutantow "drop tech wyrab" w pickerze).
  wyrabTechUnlockedEmpty: IT.isImprovementTechUnlocked('wyrab', new Set()),
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

writeFileSync(join(outDir, 'pick.json'), JSON.stringify({ pin: PIN, source: 'gra/src/game/auto-improvements.ts', techs: TECHS, maps: buildMapOut(), scenarios }) + '\n');
writeFileSync(join(outDir, 'helpers.json'), JSON.stringify({ pin: PIN, ...helpers }) + '\n');
const nonEmpty = scenarios.filter(s => s.expected.picks.length > 0).length;
const kinds = {};
for (const s of scenarios) for (const p of s.expected.picks) kinds[p[3]] = (kinds[p[3]] ?? 0) + 1;
console.log(`scenarios=${scenarios.length} nonEmpty=${nonEmpty} maps=${MAPS.length}`);
console.log(JSON.stringify(kinds));
