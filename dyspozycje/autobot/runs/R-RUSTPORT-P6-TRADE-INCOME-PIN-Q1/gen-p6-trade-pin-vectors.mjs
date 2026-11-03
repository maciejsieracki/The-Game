// Generator wektorow R-RUSTPORT-P6-TRADE-INCOME-PIN-Q1: PRAWDZIWY `gra/src/game/trade-routes.ts` z pinu weba 4bbef081d
// (+ `map/territory.ts`, `units/setup.ts`), bundlowany esbuildem w katalogu tymczasowym (zero buildu w `gra/`).
// Sklejka `main.ts:34470-34524` (przeplyw surowcow + dochod tras) jest wolana na tych samych funkcjach (nie importowalny `main.ts`).
// Uzycie: node gen-p6-trade-pin-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_JSON>
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoRoot, workDir, esbuildMain, outFile] = process.argv.slice(2);
if (!repoRoot || !workDir || !esbuildMain || !outFile) throw new Error('uzycie: <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_JSON>');
const PIN = execFileSync('git', ['-C', repoRoot, 'rev-parse', '4bbef081d'], { encoding: 'utf8' }).trim();
rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });
execFileSync('git', ['-C', repoRoot, 'archive', '-o', join(workDir, 'pin.tar'), PIN, 'gra/src', 'gra/data']);
execFileSync('tar', ['-xf', join(workDir, 'pin.tar'), '-C', workDir]);
const game = join(workDir, 'gra/src/game');
const esbuild = await import(pathToFileURL(esbuildMain).href);
const built = await esbuild.build({
  stdin: {
    contents: `export * from './trade-routes';\nexport { cityTerritoryRadius, territoryOwnerAt } from '../map/territory';`,
    resolveDir: game, loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', loader: { '.json': 'json', '.png': 'dataurl' },
});
const bundleFile = join(workDir, 'web-bundle.mjs');
writeFileSync(bundleFile, built.outputFiles[0].text);
const W = await import(pathToFileURL(bundleFile).href);
const ECON = JSON.parse(readFileSync(join(workDir, 'gra/data/econ-params.json'), 'utf8'));

// ---- kodowanie liczb (liczby nieupakowane w JSON gubia dokladnosc w serde_json; ulamki jako "~<repr>") ----------------
const enc = (x) => {
  if (x === undefined) return null;
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  if (Object.is(x, -0)) return '-0';
  if (Number.isSafeInteger(x)) return x;
  return '~' + String(x);
};
const encMap = (m) => Object.fromEntries([...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(([k, v]) => [k, enc(v)]));

let seed = 0x7a31c5e9;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[ri(0, arr.length - 1)];
const wpick = (arr, w) => { let t = rnd() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < arr.length; i++) { t -= w[i]; if (t < 0) return arr[i]; } return arr[arr.length - 1]; };
const chance = (p) => rnd() < p;

// ---- 1. dochod dystansowy: tabela funkcji na krzywych -----------------------------------------------------------------
const CURVES = {
  default: W.DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
  econ_normal: W.loadTradeRouteIncomeParams(ECON, 'normal'),
  short: { dochodyLadowe: [3, 7], dochodyMorskie: [4] },
  frac: { dochodyLadowe: [1.5, 2.5, 3.25, 0.5], dochodyMorskie: [2.75, 5, 7.5, 9.25, 0] },
  odd: { dochodyLadowe: [0, 1, 3, 5, 7, 9, 11], dochodyMorskie: [1, 3, 5, 7, 9] },
  neg: { dochodyLadowe: [-2, 4, -1], dochodyMorskie: [-3, 0, 5] },
};
const curveJson = (c) => ({ ladowe: c.dochodyLadowe.map(enc), morskie: c.dochodyMorskie.map(enc) });
const incomeCases = [];
for (const [name, c] of Object.entries(CURVES)) {
  for (const medium of ['lad', 'morze']) {
    for (let d = 0; d <= 45; d++) {
      for (const same of [true, false]) {
        const route = { dystans: d, medium, ownerId: 0, toOwnerId: same ? 0 : 1 };
        incomeCases.push({ curve: name, medium, distance: d, same_owner: same,
          by_distance: enc(W.tradeRouteIncomeByDistance(d, medium, c)), for_route: enc(W.tradeRouteIncomeForRoute(route, c)) });
      }
    }
  }
}

// ---- 2. loadery parametrow ---------------------------------------------------------------------------------------------
const rowFor = (v) => ({ easy: v, normal: v, hard: v, jednostka: 'x' });
const LOADER_RAWS = [
  ['real', ECON],
  ['empty', {}],
  ['null_group', { handel_szlaki: {}, ekonomia_miasta: {} }],
  ['curves_ok', { handel_szlaki: { dochody_ladowe: rowFor([1, 2.5, 4]), dochody_morskie: rowFor([9]), lad_max_dystans: rowFor(7), morze_max_dystans: rowFor(-3) }, ekonomia_miasta: { handel_surowiec_min_stock: rowFor(0.5) } }],
  ['curves_bad', { handel_szlaki: { dochody_ladowe: rowFor([]), dochody_morskie: rowFor([1, 'x']), lad_max_dystans: rowFor('12'), morze_max_dystans: rowFor(null) }, ekonomia_miasta: { handel_surowiec_min_stock: rowFor('2') } }],
  ['diff_split', { handel_szlaki: { dochody_ladowe: { easy: [1], normal: [2, 3], hard: [4, 5, 6], jednostka: 'x' }, dochody_morskie: { easy: [7] }, lad_max_dystans: { easy: 5, normal: 6, hard: 7 }, morze_max_dystans: { hard: 30.5 } }, ekonomia_miasta: { handel_surowiec_min_stock: { easy: -1, normal: 4, hard: 9.75 } } }],
];
const loaderCases = [];
for (const [name, raw] of LOADER_RAWS) {
  for (const diff of ['easy', 'normal', 'hard']) {
    const p = W.loadTradeRouteParams(raw, diff);
    const ip = W.loadTradeRouteIncomeParams(raw, diff);
    const fp = W.loadTradeRouteResourceFlowParams(raw, diff);
    loaderCases.push({ raw_name: name, raw, difficulty: diff,
      params: { lad: enc(p.ladMaxDist), morze: enc(p.morzeMaxDist) }, income: curveJson(ip), flow_reserve: enc(fp.minStockReserve) });
  }
}

// ---- 3. scenariusze map/tras ------------------------------------------------------------------------------------------
const TERRAINS = ['laka', 'rownina', 'wzgorza', 'gory', 'plytkie_morze', 'morze', 'pustynia', 'polarny'];
const TER_W = [5, 5, 3, 2, 3, 3, 1, 2];
const WATER = new Set(['plytkie_morze', 'morze']);
const BUILD_POOL = ['targowisko', 'port', 'port_wielki', 'koszary', 'spichlerz', 'port', 'targowisko'];
const ID_STYLES = [(n) => `city_${n}`, (n) => `c${n}`, (n) => `City-${n}`, (n) => `ateny_${n}`, (n) => `Zeta${n}`, (n) => `a${n}b`, (n) => `m.${n}`, (n) => `${n}x`];
const RES_KEYS = ['braz', 'zelazo', 'kon', 'cegla', 'zloto', 'sol'];

function makeMap(seaish) {
  const w = ri(4, 12), h = ri(4, 11);
  const hexes = {};
  const list = [];
  const landish = chance(0.5);
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    if (chance(0.05)) continue; // dziura (brak heksa)
    let t = seaish ? wpick(TERRAINS, [4, 3, 2, 1, 5, 6, 0, 0]) : wpick(TERRAINS, TER_W);
    if (landish && chance(0.4)) t = pick(['laka', 'rownina']);
    hexes[`${q},${r}`] = { terenBazowy: t };
    list.push([q, r, t]);
  }
  let dims = [w, h];
  const roll = rnd();
  if (roll < 0.1) dims = [0, 0]; else if (roll < 0.2) dims = [ri(1, 2), ri(0, 2)]; else if (roll < 0.28) dims = [ri(2, 4), ri(2, 4)];
  return { map: { szerokoscQ: dims[0], wysokoscR: dims[1], hexes }, list, dims };
}

function makeScenario(idx) {
  const seaish = chance(0.45);
  const { map, list, dims } = makeMap(seaish);
  const nbr = (q, r) => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]].map(([a, b]) => map.hexes[`${q + a},${r + b}`]);
  const coastal = list.filter(([q, r, t]) => !WATER.has(t) && nbr(q, r).some((h) => h && WATER.has(h.terenBazowy)));
  const nCities = ri(2, 7);
  const style = pick(ID_STYLES);
  const mixedStyle = chance(0.25);
  const cities = [];
  const used = new Set();
  for (let i = 0; i < nCities && list.length; i++) {
    let q, r, tries = 0;
    do { const h = seaish && coastal.length ? pick(coastal) : pick(list); q = h[0]; r = h[1]; tries++; } while (used.has(`${q},${r}`) && tries < 20 && !chance(0.03));
    used.add(`${q},${r}`);
    const id = (mixedStyle ? pick(ID_STYLES) : style)(i + ri(0, 3) * 10);
    if (cities.some((c) => c.id === id)) continue;
    cities.push({ id, ownerId: ri(0, 3), q, r });
  }
  const ticks = [];
  let prevRoutes = [];
  const ownerList = [...new Set(cities.map((c) => c.ownerId))].sort((a, b) => a - b);
  const curveName = pick(Object.keys(CURVES));
  const params = { ladMaxDist: ri(0, 20), morzeMaxDist: ri(0, 30) };
  for (let t = 0; t < 3; t++) {
    const builtObj = {};
    for (const c of cities) if (chance(0.7) || seaish) builtObj[c.id] = Array.from({ length: ri(0, 4) }, () => pick(BUILD_POOL)).concat(seaish && chance(0.85) ? [pick(['port', 'port_wielki'])] : []);
    const builtMap = new Map(Object.entries(builtObj));
    const war = [], treatyList = [];
    for (let i = 0; i < ownerList.length; i++) for (let j = i + 1; j < ownerList.length; j++) {
      if (chance(0.2)) war.push([ownerList[i], ownerList[j]]);
      if (chance(0.75)) treatyList.push([ownerList[i], ownerList[j]]);
    }
    const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
    const warSet = new Set(war.map(([a, b]) => key(a, b)));
    const treatySet = new Set(treatyList.map(([a, b]) => key(a, b)));
    const techOwners = chance(0.2) ? null : ownerList.filter(() => chance(0.85));
    const techSet = techOwners === null ? null : new Set(techOwners);
    let territory = null;
    let territoryWeb;
    if (chance(0.6)) {
      territoryWeb = [];
      for (const c of cities) {
        if (chance(0.85)) territoryWeb.push({ q: c.q, r: c.r, pop: ri(1, 20), level: 1, ownerId: c.ownerId });
      }
      const extra = ri(0, 3);
      for (let e = 0; e < extra && list.length; e++) {
        const h = pick(list);
        const isFort = chance(0.5);
        const node = { q: h[0], r: h[1], pop: 0, level: 1, ownerId: ri(0, 3), [isFort ? 'isFort' : 'isOutpost']: true };
        if (chance(0.6)) node.order = { turn: ri(1, 4), seq: ri(0, 3) };
        territoryWeb.push(node);
      }
      if (chance(0.3)) territoryWeb.reverse();
      territory = territoryWeb.map((n) => ({ ownerId: n.ownerId, q: n.q, r: n.r, radius: W.cityTerritoryRadius(n), fort: !!n.isFort, outpost: !!n.isOutpost, order: n.order ? [n.order.turn, n.order.seq] : null }));
    }
    // istniejace trasy: poprzedni wynik + smieci
    let existing = prevRoutes.map((r) => ({ ...r }));
    if (t > 0) {
      if (chance(0.5) && cities.length >= 2) {
        const a = pick(cities), b = pick(cities);
        if (a.id !== b.id) existing.push(W.createTradeRoute(a, b, map, pick(['lad', 'morze']), params, builtMap));
      }
      if (chance(0.3)) existing.push({ id: 'ghost->city_zz:lad', fromCityId: 'ghost', toCityId: cities[0]?.id ?? 'x', ownerId: 9, toOwnerId: 0, medium: 'lad', dystans: 3, status: 'polaczony', budynekOdblokowany: false });
      if (chance(0.4) && existing.length) { const r = { ...pick(existing) }; r.id = `${r.toCityId}->${r.fromCityId}:${r.medium}`; [r.fromCityId, r.toCityId] = [r.toCityId, r.fromCityId]; [r.ownerId, r.toOwnerId] = [r.toOwnerId, r.ownerId]; existing.push(r); }
      if (chance(0.3) && existing.length) { const r = { ...pick(existing) }; r.medium = r.medium === 'lad' ? 'morze' : 'lad'; existing.push(r); }
      if (chance(0.3)) existing.reverse();
    }
    const isAtWar = (a, b) => warSet.has(key(a, b));
    const hasTreaty = (a, b) => treatySet.has(key(a, b));
    const hasTech = techSet === null ? undefined : (o) => techSet.has(o);
    const curve = CURVES[curveName];
    const routes = W.refreshTradeRoutes(cities, existing, map, builtMap, isAtWar, hasTreaty, params, territoryWeb, curve, hasTech);

    // polaczenia dla wszystkich par (obu kierunkow) i mediow
    const conns = [];
    for (const a of cities) for (const b of cities) {
      if (a.id === b.id) continue;
      for (const medium of ['lad', 'morze']) for (const needPath of [true, false]) {
        const r = W.findCityConnection(a, b, map, medium, params, builtMap, territoryWeb, undefined, needPath);
        conns.push(needPath ? { from: a.id, to: b.id, medium, need_path: true, connected: r.connected, distance: r.distance, path: r.pathHexes } : { from: a.id, to: b.id, medium, need_path: false, connected: r.connected, distance: r.distance });
      }
      const cr = W.createTradeRoute(a, b, map, pick(['lad', 'morze']), params, builtMap);
      conns.push({ create: true, from: a.id, to: b.id, route: cr });
    }
    const have = [], diag = [];
    for (const oa of ownerList) for (const ob of ownerList) {
      if (oa === ob) continue;
      const ca = cities.filter((c) => c.ownerId === oa), cb = cities.filter((c) => c.ownerId === ob);
      have.push({ a: oa, b: ob, with_territory: W.citiesHaveTradeConnection(ca, cb, map, builtMap, params, territoryWeb), without: W.citiesHaveTradeConnection(ca, cb, map, builtMap, params, undefined) });
      const label = chance(0.5) ? undefined : `Civ${ob}`;
      diag.push({ a: oa, b: ob, label: label ?? null, msg: W.diagnoseMissingTradeRouteForPartner(oa, ob, cities, map, builtMap, isAtWar, params, label, territoryWeb) ?? null,
        msg_no_territory: W.diagnoseMissingTradeRouteForPartner(oa, ob, cities, map, builtMap, isAtWar, params, label, undefined) ?? null });
    }
    // limity
    const limits = cities.map((c) => ({ id: c.id, limit: W.tradeRouteLimitForCity(c.id, builtMap), existence: W.tradeRouteExistenceLimitForCity(c.id, builtMap) }));
    limits.push({ id: 'nieistniejace', limit: W.tradeRouteLimitForCity('nieistniejace', builtMap), existence: W.tradeRouteExistenceLimitForCity('nieistniejace', builtMap) });

    // dochod / bonusy: tabele wstrzykiwane
    const wonderTab = {}, targTab = {};
    for (const o of [...ownerList, 9]) for (const m of ['lad', 'morze']) wonderTab[`${o}|${m}`] = chance(0.5) ? 0 : pick([0.1, 0.25, 0.5, -0.2, 1]);
    for (const c of cities) targTab[c.id] = chance(0.5) ? 0 : pick([0.05, 0.1, 0.3, -0.1]);
    const wonderFn = (o, m) => wonderTab[`${o}|${m}`] ?? 0;
    const targFn = (id) => targTab[id] ?? 0;
    const all = routes.concat(existing.filter(() => chance(0.4))); // takze trasy niepolaczone/dowolne
    if (chance(0.5) && routes.length) all.push({ ...routes[0], status: 'brak_polaczenia' });
    const br = W.computeTradeRouteIncomeByCityBreakdown(all, curve, wonderFn, targFn);
    const brNoBonus = W.computeTradeRouteIncomeByCityBreakdown(all, curve);
    const seaCounts = W.computeSeaTradeRouteCountByCity(all);
    const bonusRate = pick([1, 2, 0.5]);
    const seaBonus = W.computeSeaTradeBonusIncomeByCity(seaCounts, bonusRate);
    const seaBonusDef = W.computeSeaTradeBonusIncomeByCity(seaCounts);
    const bb = W.computeTradeRouteBuildingBonusByCity(all, curve);
    const perRoute = all.map((r) => ({ income: enc(W.tradeRouteIncomeForRoute(r, curve)), bonus: enc(W.tradeRouteBuildingBonusForRoute(r, curve)) }));

    // grants i flow
    const nativeTab = {}, stockTab = {};
    for (const o of [...ownerList, 9]) for (const k of RES_KEYS) { nativeTab[`${o}|${k}`] = chance(0.4); stockTab[`${o}|${k}`] = chance(0.2) ? pick([0, -3, 7.5, 2.25, 3.9]) : ri(0, 14); }
    const nativeFn = (o, k) => !!nativeTab[`${o}|${k}`];
    const stockFn = (o, k) => stockTab[`${o}|${k}`] ?? 0;
    const grants = W.computeTradeRouteResourceGrants(all, nativeFn);
    const grants3 = W.computeTradeRouteResourceGrants(all, nativeFn, ['braz', 'cegla']);
    const firsts = [];
    for (const o of [...ownerList, 9]) for (const k of RES_KEYS.slice(0, 5)) {
      const f = W.firstTradeRouteResourceGrant(grants, o, k);
      firsts.push({ owner: o, key: k, has: W.hasTradeRouteResourceAccess(grants, o, k), first_route: f ? f.routeId : null, first_via: f ? [f.viaOwnerId, f.viaCityId] : null });
    }
    const reserve = pick([2, 0, 0.5, 5, -1]);
    const flows = W.computeTradeRouteResourceFlow(all, stockFn, { minStockReserve: reserve });
    const flowsDef = W.computeTradeRouteResourceFlow(all, stockFn);
    const flowsKeys = W.computeTradeRouteResourceFlow(all, stockFn, { minStockReserve: 1 }, ['sol', 'zloto']);
    const diff = W.diffTradeRoutes(prevRoutes, routes);

    ticks.push({
      existing, war, treaty: treatyList, tech: techOwners, territory, built: builtObj,
      routes, conns, have, diag, limits,
      income: {
        routes_in: all,
        wonder: wonderTab, targ: targTab, curve: curveName,
        total: encMap(br.totalByCity), maritime: encMap(br.maritimeByCity), total_nobonus: encMap(brNoBonus.totalByCity),
        sea_counts: encMap(seaCounts), sea_bonus_rate: enc(bonusRate), sea_bonus: encMap(seaBonus), sea_bonus_default: encMap(seaBonusDef),
        building_bonus: encMap(bb), per_route: perRoute,
      },
      res: {
        native: nativeTab, stock: stockTab, reserve: enc(reserve),
        grants, grants_keys2: grants3, firsts,
        flows: flows.map((f) => ({ ...f, amount: enc(f.amount) })),
        flows_default: flowsDef.map((f) => ({ ...f, amount: enc(f.amount) })),
        flows_keys: flowsKeys.map((f) => ({ ...f, amount: enc(f.amount) })),
      },
      diff: { added: diff.added.map((r) => r.id), removed: diff.removed.map((r) => r.id) },
    });
    prevRoutes = routes;
  }
  return { idx, dims, params, map_hexes: list, cities, curve: curveName, ticks };
}

const SCENARIOS = [];
const N = Number(process.env.N_SCEN ?? 84);
for (let i = 0; i < N; i++) SCENARIOS.push(makeScenario(i));

// ---- 4. tabela ids: kolejnosc localeCompare dla ASCII (wyprowadzona z uruchomionego silnika ICU) -----------------------
const ASCII = []; for (let c = 32; c < 127; c++) ASCII.push(String.fromCharCode(c));
const idPool = [];
const chars = 'abAB09_-.:>~ xZ';
for (let i = 0; i < 700; i++) { let s = ''; const n = ri(1, 7); for (let k = 0; k < n; k++) s += chars[ri(0, chars.length - 1)]; idPool.push(s); }
const collPairs = [];
for (let i = 0; i < 2500; i++) { const a = pick(idPool), b = pick(idPool); collPairs.push([a, b, Math.sign(a.localeCompare(b))]); }
const asciiOrder = [...ASCII].sort((a, b) => a.localeCompare(b));

const out = { pin: PIN, scenarios: SCENARIOS, income_cases: incomeCases, curves: Object.fromEntries(Object.entries(CURVES).map(([k, v]) => [k, curveJson(v)])),
  loaders: loaderCases, collation_pairs: collPairs, ascii_order: asciiOrder.join('') };
writeFileSync(outFile, JSON.stringify(out));
const stat = {
  scenarios: SCENARIOS.length, ticks: SCENARIOS.length * 3,
  routes: SCENARIOS.reduce((s, c) => s + c.ticks.reduce((x, t) => x + t.routes.length, 0), 0),
  conns: SCENARIOS.reduce((s, c) => s + c.ticks.reduce((x, t) => x + t.conns.length, 0), 0),
  income_cases: incomeCases.length, loaders: loaderCases.length, collation_pairs: collPairs.length,
};
console.log(JSON.stringify(stat));
