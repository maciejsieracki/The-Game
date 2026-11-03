// Generator wektorow R-RUSTPORT-P6-ECON-TICK-ORDER-LANE-Q1: PETLA PORZADKU (lane "Porzadku", pin weba 4bbef081d).
// Uruchamiane sa PRAWDZIWE funkcje weba z pinu: order.ts (loadOrderParams, orderEffectsWithCivMatrix, orderEffectsToYieldMults,
// pickRevoltMigrationTarget), culture-religion.ts (cale), conquest-stability.ts, society-breakdown.ts, society-inputs.ts,
// post-capture-law.ts, citizen-resource-upkeep.ts, building-stock-cost.ts, economy.ts (sumBuildingHappinessFromBuiltIds),
// building-upgrades.ts, population-growth-v85.ts, production.ts, civ-matrix.ts, armyMerge.ts, diplomacy.ts, okolica.ts.
// Sklejka z `main.ts` (zamkniecia, nieimportowalne; zero buildu w gra/) jest PRZEPISANA ponizej w `runLane` z numerami linii
// `main.ts:35358-35789` (+ `:4862-4872`, `:5246-5256`, `:15730-15747`, `:31575-31579`).
// Uzycie: node gen-p6-order-lane-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_JSON>
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
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
const dataDir = join(workDir, 'gra/data');
const esbuild = await import(pathToFileURL(esbuildMain).href);

const THREE_NAMES = ['ACESFilmicToneMapping', 'AmbientLight', 'Box3', 'BoxGeometry', 'BufferAttribute', 'BufferGeometry', 'Camera', 'CanvasTexture', 'CatmullRomCurve3', 'CircleGeometry', 'Color', 'ConeGeometry', 'CylinderGeometry', 'DirectionalLight', 'DodecahedronGeometry', 'DoubleSide', 'Euler', 'ExtrudeGeometry', 'Float32BufferAttribute', 'Fog', 'FogExp2', 'Group', 'HemisphereLight', 'IcosahedronGeometry', 'InstancedBufferAttribute', 'InstancedMesh', 'Intersection', 'Line', 'LineBasicMaterial', 'LineDashedMaterial', 'LineLoop', 'LineSegments', 'LinearFilter', 'LinearMipmapLinearFilter', 'Material', 'MathUtils', 'Matrix4', 'Mesh', 'MeshBasicMaterial', 'MeshLambertMaterial', 'MeshPhongMaterial', 'MeshStandardMaterial', 'Object3D', 'OctahedronGeometry', 'OrthographicCamera', 'PCFSoftShadowMap', 'Path', 'PerspectiveCamera', 'Plane', 'PlaneGeometry', 'QuadraticBezierCurve3', 'Quaternion', 'Raycaster', 'RingGeometry', 'SRGBColorSpace', 'Scene', 'Shape', 'ShapeGeometry', 'SphereGeometry', 'Sprite', 'SpriteMaterial', 'Texture', 'TorusGeometry', 'TubeGeometry', 'Vector2', 'Vector3', 'WebGLRenderer'];
const THREE_STUB = 'class S { constructor() { return new Proxy(this, { get: (t, k) => (k in t ? t[k] : () => {}) }); } }\n' + THREE_NAMES.map((n) => 'export const ' + n + ' = S;').join('\n');

const built = await esbuild.build({
  stdin: {
    contents: [
      "export { loadOrderParams, orderEffectsWithCivMatrix, orderEffectsToYieldMults, pickRevoltMigrationTarget } from './order';",
      "export * as CR from './culture-religion';",
      "export { tickCityCultureReligion, conquestRevoltRiskMultiplier } from './conquest-stability';",
      "export { evaluateOrderFromBreakdown, applyCivMatrixHappinessModifier, updateRevoltGrace, loadRevoltParams, isOsiedleRevoltImmune } from './society-breakdown';",
      "export { isForeignReligionDominant, resolveOwnCultureShare, cityCultureMixActive, stolicaEasyBonusActive } from './society-inputs';",
      "export { markCityRebellionStarted, tickPostCaptureLawEndOfTurn, tickRebelProtectionEndOfTurn, applyPostCaptureLawOverride, shouldSuppressRevoltDuringPostCaptureLaw, isPostCaptureLawActive } from './post-capture-law';",
      "export { computeCitizenResourceDrain } from './citizen-resource-upkeep';",
      "export { ownerResourceStockAll, deductBuildingStockCostAcrossCities } from './building-stock-cost';",
      "export { sumBuildingHappinessFromBuiltIds } from './economy';",
      "export { cityPalacTier } from './building-upgrades';",
      "export { resolvePopulationMatrixForCiv } from './population-growth-v85';",
      "export { buildingLevelForEpoch } from './production';",
      "export { civMatrixParam } from './civ-matrix';",
      "export { countLawGarrisonOnCityHex } from './armyMerge';",
      "export { isOwnerAtWarInRelations } from './diplomacy';",
      "export { cityRangeForPopulation } from './okolica';",
      "export { hexDistance } from '../units/setup';",
      "export { cityFoundOrder } from './capital-capture';",
    ].join('\n'),
    resolveDir: game, loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', loader: { '.json': 'json', '.png': 'dataurl' },
  plugins: [{ name: 'three-stub', setup(b) {
    b.onResolve({ filter: /^three(\/.*)?$/ }, (a) => ({ path: a.path, namespace: 'three-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'three-stub' }, () => ({ contents: THREE_STUB, loader: 'js' }));
  } }],
});
const bundleFile = join(workDir, 'web-bundle.mjs');
writeFileSync(bundleFile, built.outputFiles[0].text);
const W = await import(pathToFileURL(bundleFile).href);
const CR = W.CR;

const SOCIETY = JSON.parse(readFileSync(join(dataDir, 'society-params.json'), 'utf8'));
const CIVS = JSON.parse(readFileSync(join(dataDir, 'civs.json'), 'utf8'));
const BUILDINGS = JSON.parse(readFileSync(join(dataDir, 'buildings.json'), 'utf8'));
const UPKEEP = JSON.parse(readFileSync(join(dataDir, 'citizen-resource-upkeep.json'), 'utf8'));

// ---- deterministyczny PRNG (mulberry32), tylko do generowania scenariuszy ----
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rng = mulberry32(0x0DE41A5E);
const ri = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = (a) => a[Math.floor(rng() * a.length)];
const chance = (p) => rng() < p;
const rf = (lo, hi) => lo + rng() * (hi - lo);

const CIV_KEYS = CIVS.cywilizacje.map((c) => c.ikonaId);
const RELIGIONS = SOCIETY.religie_cywilizacji.map((r) => r['Religia / wyznanie']);
const DIFFS = ['easy', 'normal', 'hard'];
const BUILT_SPECIAL = ['swiatynia', 'kamienne_kregi', 'dom_starszyzny', 'dwor_zarzadcy', 'pretorium', 'trybunal', 'sad', 'garnizon', 'palac', 'palac_ii', 'palac_iii', 'teatr', 'akademia', 'biblioteka', 'stela', 'laznia_publiczna', 'pomnik'];
const BUILT_ALL = BUILDINGS.map((b) => b.id);
const REQUIRED_KEYS = [...new Set(UPKEEP.epoki.flatMap((e) => e.surowce ?? e.wymagane ?? []))];

// ---- sklejka main.ts: petla porzadku ----
function cloneCity(c) { return JSON.parse(JSON.stringify(c)); }

function runLane(sc) {
  const difficulty = sc.difficulty;
  const turn = sc.turn;
  const cities = sc.cities.map(cloneCity);
  const cityBuilt = new Map(Object.entries(sc.built));
  const cityRelig = new Map(sc.cityRelig.map(([k, v]) => [k, cloneCity(v)]));
  const orderValueMap = new Map(sc.orderValueMap);
  const growthMultMap = new Map();
  const orderMultMap = new Map();
  const ownerCivMap = new Map(sc.ownerCivMap.map(([k, v]) => [k, v]));
  const econ = new Map(sc.econ);
  const units = sc.units;
  const relations = new Map(sc.relations.map(([k, v]) => [k, { status: v ? 'wojna' : 'pokoj' }]));
  const humans = new Set(sc.humans);
  const capitalByOwner = new Map(sc.capitalByOwner);
  const religionCiv = new Map(sc.religionCiv);
  const eraOf = (o) => sc.era[String(o)] ?? 1;
  const techOf = (o) => new Set(sc.tech[String(o)] ?? []);
  const wonderZad = (o) => sc.wonderZad[String(o)] ?? 0;
  const luksusOf = (id) => sc.luksus[id];
  const rebelled = [];
  let rngDraws = 0;

  // main.ts:4854-4872
  const ownerReligionForOwnerId = (ownerId) => CR.civReligionForKey(religionCiv.get(ownerId) ?? null, SOCIETY, CIVS);
  const resolvedCityReligion = (city) => CR.resolveCityReligionState(cityRelig.get(city.id), city.population, ownerReligionForOwnerId(city.ownerId));
  // main.ts:31575
  const capitalCityIdForOwner = (ownerId) => {
    const explicit = capitalByOwner.get(ownerId);
    if (explicit && cities.some((c) => c.id === explicit && c.ownerId === ownerId)) return explicit;
    let best = null; let bo = Infinity;
    for (const c of cities) { if (c.ownerId !== ownerId) continue; const o = W.cityFoundOrder(c.id); if (o < bo) { best = c; bo = o; } }
    return best ? best.id : null;
  };
  const isOwnerAtWar = (o) => W.isOwnerAtWarInRelations(o, relations);
  const lawGarrisonCountForCity = (city) => W.countLawGarrisonOnCityHex(units, city.q, city.r, city.ownerId);
  const isHuman = (o) => humans.has(o);

  // main.ts:35359-35365
  const op = W.loadOrderParams(SOCIETY, difficulty);
  const cp = CR.loadCultureParams(SOCIETY, difficulty);
  const rp = CR.loadReligionParams(SOCIETY, difficulty);
  const rngf = CR.makeRng(turn);
  // main.ts:35370 / :5246
  const stockCache = new Map();
  const citizenUpkeepEmpireStock = (ownerId) => { let v = stockCache.get(ownerId); if (v === undefined) { v = W.ownerResourceStockAll(cities, ownerId); stockCache.set(ownerId, v); } return v; };
  const drainCache = new Map();
  const drainOrder = [];
  const citizenUpkeepDrainForOwner = (ownerId) => {
    let v = drainCache.get(ownerId);
    if (v === undefined) {
      const ownerPopulation = cities.reduce((sum, c) => c.ownerId === ownerId ? sum + c.population : sum, 0);
      v = W.computeCitizenResourceDrain(eraOf(ownerId), ownerPopulation, citizenUpkeepEmpireStock(ownerId));
      if (Object.keys(v.deductions).length > 0) W.deductBuildingStockCostAcrossCities(cities, ownerId, v.deductions);
      drainCache.set(ownerId, v);
      drainOrder.push(ownerId);
    }
    return v;
  };

  const reports = [];
  for (const city of cities) {
    const cid = city.id;
    const econTick = econ.get(cid);
    const kulturaTick = econTick ? econTick.kultura : 0;
    let ownCultureShare = W.resolveOwnCultureShare(city);
    const cultureMixActive = W.cityCultureMixActive(city);
    const builtIds = cityBuilt.get(cid) ?? [];
    const ownRel = ownerReligionForOwnerId(city.ownerId);
    let curRel = resolvedCityReligion(city);
    let foreignReligionDominant = W.isForeignReligionDominant(curRel, ownRel, rp);
    const convTick = W.tickCityCultureReligion(ownCultureShare, curRel, builtIds, ownRel, foreignReligionDominant, cp, rp);
    ownCultureShare = convTick.ownCultureShare;
    if (cultureMixActive || ownCultureShare < 1) city.ownCultureShare = ownCultureShare;
    curRel = convTick.religionState;
    cityRelig.set(cid, curRel);
    foreignReligionDominant = W.isForeignReligionDominant(curRel, ownRel, rp);
    const ccIn = { kulturaSkumulowana: city.kultura ?? 0, ownCultureShare };
    const cultureCivKey = ownerCivMap.get(city.ownerId);
    const cultureModifier = cultureCivKey ? W.civMatrixParam(cultureCivKey, 'kultura_naplyw_proc') : 0;
    const cultureGain = CR.cultureAccrualWithModifier(kulturaTick, cultureModifier);
    const acc = CR.accumulateCulture(ccIn, cultureGain, cp);
    city.kultura = acc.kulturaSkumulowana;
    const ccOut = { kulturaSkumulowana: acc.kulturaSkumulowana, ownCultureShare };
    const haKult = CR.cultureHappiness(ccOut, cp);
    const haRel = CR.religionHappiness(curRel, ownRel, rp, builtIds.includes('swiatynia'));
    {
      const relNeighbors = [];
      for (const oc of cities) {
        if (oc.id === cid) continue;
        const dist = W.hexDistance(oc.q, oc.r, city.q, city.r);
        if (dist <= (rp.szerzenieMaxDystans ?? 3)) relNeighbors.push({ id: oc.id, distance: dist, state: resolvedCityReligion(oc), population: oc.population });
      }
      if (relNeighbors.length > 0) {
        const hasSwiatynia = (cityBuilt.get(cid) ?? []).includes('swiatynia');
        const religionCivKey = ownerCivMap.get(city.ownerId);
        const sourceReligionParams = religionCivKey ? CR.religionParamsWithSpreadModifier(rp, W.civMatrixParam(religionCivKey, 'religia_spread_proc')) : rp;
        const spreadRes = CR.spreadReligion(curRel, relNeighbors, sourceReligionParams, { hasSwiatynia, pressure: 1, seed: (turn * 997 + city.q * 31 + city.r) >>> 0 });
        for (const ev of spreadRes.events) cityRelig.set(ev.id, ev.state);
      }
    }
    {
      const cpPresja = { presjaProcTura: CR.loadCulturePressureParams(SOCIETY, difficulty).presjaProcTura };
      const pressureRange = W.cityRangeForPopulation(city.population);
      const stateRelMap = new Map();
      for (const oid of new Set(cities.map((cc) => cc.ownerId))) stateRelMap.set(oid, ownerReligionForOwnerId(oid));
      const pressureCities = cities.map((cc) => ({ id: cc.id, ownerId: cc.ownerId, q: cc.q, r: cc.r, population: cc.population, kulturaSkumulowana: cc.kultura ?? 0, ownCultureShare: W.resolveOwnCultureShare(cc), religionState: resolvedCityReligion(cc), religionPressurePct: cc.religionPressurePct }));
      const sources = cities.filter((oc) => oc.id !== cid && W.hexDistance(oc.q, oc.r, city.q, city.r) <= pressureRange).map((oc) => ({ id: oc.id, ownerId: oc.ownerId, q: oc.q, r: oc.r, population: oc.population, kulturaSkumulowana: oc.kultura ?? 0, ownCultureShare: W.resolveOwnCultureShare(oc) }));
      const pres = CR.applyCultureReligionPressureToTarget(
        { id: city.id, ownerId: city.ownerId, q: city.q, r: city.r, population: city.population, ownCultureShare: cultureMixActive ? ownCultureShare : undefined, kulturaOwnShare: cultureMixActive ? city.kulturaOwnShare : undefined, religionState: curRel, religionPressurePct: city.religionPressurePct },
        sources, pressureCities, cpPresja.presjaProcTura, stateRelMap);
      if (cultureMixActive) { ownCultureShare = pres.ownCultureShare; city.ownCultureShare = ownCultureShare; }
      city.religionPressurePct = pres.religionPressurePct;
    }
    const populationMatrix = W.resolvePopulationMatrixForCiv(ownerCivMap.get(city.ownerId));
    const haBuildings = W.sumBuildingHappinessFromBuiltIds(builtIds, BUILDINGS, (bdef) => W.buildingLevelForEpoch(bdef.epokaWejscia, eraOf(city.ownerId), bdef.maksPoziom, bdef.poziomTechGate ?? null, techOf(city.ownerId))) + populationMatrix.happinessBase;
    const haWealth = econTick ? econTick.wealthZadowolenie : 0;
    const haCuda = wonderZad(city.ownerId);
    const podzial = luksusOf(cid) === undefined ? undefined : { procentLuksus: luksusOf(cid) };
    const gCountLaw = lawGarrisonCountForCity(city);
    const ownerAtWar = isOwnerAtWar(city.ownerId);
    const stolicaBonus = W.stolicaEasyBonusActive(difficulty, turn, city, cities, 10, capitalCityIdForOwner(city.ownerId));
    const revoltParams = W.loadRevoltParams(SOCIETY, difficulty);
    const ownerEraForUpkeep = eraOf(city.ownerId);
    const citizenUpkeep = citizenUpkeepDrainForOwner(city.ownerId);
    const ordPctEvaluated = W.evaluateOrderFromBreakdown(
      { difficulty, era: ownerEraForUpkeep, population: city.population, buildingZadowolenie: haBuildings, ceramikaZadowolenie: econTick?.garncarniaSurplusZadowolenie ?? 0, spichlerzZadowolenie: (econTick?.maSpichlerz || econTick?.maSpichlerzII) ? 1 : 0, haKult, haRel, haWealth, haCuda, podzialHandlu: podzial, atWar: ownerAtWar, hasSwiatynia: builtIds.includes('swiatynia'), hasAmfiteatr: builtIds.includes('teatr') || builtIds.includes('akademia'), ownCultureShare: cultureMixActive ? ownCultureShare : undefined, foreignReligionDominant, conquestUnstablePenalty: 0, stolicaEasyBonus: stolicaBonus, citizenResourceHappinessDelta: citizenUpkeep.happinessDelta },
      { difficulty, era: eraOf(city.ownerId), population: city.population, garnizonCount: gCountLaw, hasDomStarszyzny: builtIds.includes('dom_starszyzny'), hasDworZarzadcy: builtIds.includes('dwor_zarzadcy'), hasPretorium: builtIds.includes('pretorium'), hasTrybunal: builtIds.includes('trybunal'), hasSad: builtIds.includes('sad'), hasGarnizonBudynek: builtIds.includes('garnizon'), palacTier: W.cityPalacTier(builtIds), brakGarnizonuKara: city.population >= 6 && gCountLaw === 0, conquestNoGarrisonPenalty: 0, stolicaEasyBonus: stolicaBonus },
      SOCIETY, difficulty);
    const happinessCivKey = ownerCivMap.get(city.ownerId);
    const ordPctRaw = happinessCivKey ? W.applyCivMatrixHappinessModifier(ordPctEvaluated, W.civMatrixParam(happinessCivKey, 'eko_zadowolenie_proc'), SOCIETY, difficulty) : ordPctEvaluated;
    W.tickRebelProtectionEndOfTurn(city);
    const postCaptureLawActive = W.shouldSuppressRevoltDuringPostCaptureLaw(city);
    const ordPct = postCaptureLawActive ? W.applyPostCaptureLawOverride(ordPctRaw, city, SOCIETY, difficulty) : ordPctRaw;
    const orderCivKey = ownerCivMap.get(city.ownerId);
    const orderEff = W.orderEffectsWithCivMatrix(ordPct.effects, orderCivKey ? {
      porzadek_produkcja_proc: W.civMatrixParam(orderCivKey, 'porzadek_produkcja_proc'),
      porzadek_pieniadz_proc: W.civMatrixParam(orderCivKey, 'porzadek_pieniadz_proc'),
      porzadek_nauka_proc: W.civMatrixParam(orderCivKey, 'porzadek_nauka_proc'),
      porzadek_kultura_proc: W.civMatrixParam(orderCivKey, 'porzadek_kultura_proc'),
      porzadek_wzrost_proc: W.civMatrixParam(orderCivKey, 'porzadek_wzrost_proc'),
    } : {});
    const tier = ordPct.tier;
    const conquestRevoltMult = W.conquestRevoltRiskMultiplier(ownCultureShare, foreignReligionDominant, gCountLaw);
    const effectiveRevoltRisk = postCaptureLawActive ? 0 : orderEff.revoltRisk * conquestRevoltMult;
    const osiedleImmune = W.isOsiedleRevoltImmune(city.population, SOCIETY, difficulty);
    let graceUpd;
    if (osiedleImmune || postCaptureLawActive) {
      city.revoltGraceRemaining = null;
      graceUpd = { revoltGraceRemaining: null, revoltWarning: false, shouldTriggerRebellion: false, graceTurnsLeft: null };
    } else {
      graceUpd = W.updateRevoltGrace(city.revoltGraceRemaining, ordPct.porPct, revoltParams);
      city.revoltGraceRemaining = graceUpd.revoltGraceRemaining;
      if (graceUpd.shouldTriggerRebellion && isHuman(city.ownerId) && !city.rebelState) {
        W.markCityRebellionStarted(city);
        city.rebelState = true;
        city.ownerId = -99;
        rebelled.push(cid);
      }
    }
    let buntFlag = false;
    if (!osiedleImmune && !postCaptureLawActive && !graceUpd.revoltWarning && !city.rebelState && orderEff.revoltRisk > 0 && (rngDraws++, rngf()) < effectiveRevoltRisk) {
      const targetId = W.pickRevoltMigrationTarget(cid, city.ownerId, cities, orderValueMap);
      if (targetId) {
        const target = cities.find((c) => c.id === targetId);
        if (target && city.population > 1) { city.population -= 1; target.population += 1; buntFlag = true; }
      }
    }
    reports.push({ cityId: cid, porPct: ordPct.porPct, szPct: ordPct.sz.szPct, prawPct: ordPct.prawo.prawPct, tier, haKult, haRel, ownCultureShare, bunt: buntFlag, revoltWarning: graceUpd.revoltWarning, graceTurnsLeft: graceUpd.graceTurnsLeft });
    if (postCaptureLawActive) W.tickPostCaptureLawEndOfTurn(city);
    orderValueMap.set(cid, ordPct.porPct);
    growthMultMap.set(cid, orderEff.growthMult);
    orderMultMap.set(cid, W.orderEffectsToYieldMults(tier, orderEff));
  }
  const mapObj = (m) => Object.fromEntries([...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)));
  return {
    cities, reports, rebelled, rngDraws,
    orderValueMap: mapObj(orderValueMap), growthMultMap: mapObj(growthMultMap), orderMultMap: mapObj(orderMultMap),
    cityRelig: mapObj(cityRelig),
    citizen: drainOrder.map((o) => [o, drainCache.get(o)]),
  };
}

// ---- generator scenariuszy ----
function genRelState(pop) {
  const r = rng();
  if (r < 0.2) return null;
  const n = ri(1, 3);
  const counts = {};
  for (let i = 0; i < n; i++) counts[pick(RELIGIONS)] = ri(1, Math.max(1, Math.floor(pop)));
  return { counts };
}

function genScenario(idx) {
  const difficulty = pick(DIFFS);
  const turn = pick([0, 1, 2, 5, 9, 10, 11, ri(12, 400), ri(12, 400), 4294967296, 4294967297]);
  const nCities = ri(1, 7);
  const owners = pick([[0], [0, 1], [0, 1, 2], [1, 2], [0, 1, 2, 3], [0, -1, 1]]);
  const cities = [];
  const built = {};
  const econ = [];
  const luksus = {};
  const cityRelig = [];
  const orderValueMap = [];
  const surowce = (c) => { if (chance(0.25)) return undefined; const o = {}; for (const k of REQUIRED_KEYS) if (chance(0.7)) o[k] = ri(0, 60); return o; };
  const used = new Set();
  for (let i = 0; i < nCities; i++) {
    let q, r; do { q = ri(0, 6); r = ri(0, 6); } while (used.has(q + ',' + r)); used.add(q + ',' + r);
    const id = chance(0.85) ? 'city' + (i + 1 + (chance(0.1) ? 9 : 0)) : 'miasto_' + String.fromCharCode(97 + i);
    const pop = ri(1, 14);
    const c = { id, name: 'M' + i, ownerId: pick(owners), q, r, population: pop, kultura: pick([undefined, 0, ri(0, 80), ri(80, 700)]) };
    if (c.kultura === undefined) delete c.kultura;
    const mixKind = rng();
    if (mixKind < 0.25) c.ownCultureShare = pick([0, 0.1, 0.24, 0.25, 0.4, 0.5, 0.6, 0.74, 0.75, 0.9, 0.99, 1, rf(0, 1)]);
    else if (mixKind < 0.35) c.kulturaOwnShare = pick([0, 0.3, 0.5, 0.8, 1, rf(0, 1)]);
    if (chance(0.25)) { c.religionPressurePct = {}; for (const o of owners) if (chance(0.5)) c.religionPressurePct[o] = ri(0, 100); }
    if (chance(0.1)) c.rebelState = true;
    if (chance(0.45)) c.revoltGraceRemaining = pick([0, 0, 1, 2, 3]);
    if (chance(0.12)) { c.postCaptureLawTurnsRemaining = pick([1, 2, 5, 10]); if (chance(0.5)) c.wasRebellionReconquest = true; }
    if (chance(0.12)) c.rebelProtectionTurnsRemaining = pick([1, 5, 20]);
    const sur = surowce(c); if (sur) c.surowce = sur;
    cities.push(c);
    const b = []; for (const s of BUILT_SPECIAL) if (chance(0.22)) b.push(s);
    for (let k = 0; k < ri(0, 5); k++) b.push(pick(BUILT_ALL));
    if (chance(0.1)) b.push('nieistniejacy_budynek');
    if (chance(0.85)) built[id] = b;
    if (chance(0.9)) econ.push([id, { kultura: pick([0, rf(0, 40), ri(0, 20)]), wealthZadowolenie: pick([0, rf(-4, 6), ri(-3, 5)]), garncarniaSurplusZadowolenie: pick([0, 1, 2]), maSpichlerz: chance(0.3), maSpichlerzII: chance(0.15) }]);
    if (chance(0.7)) luksus[id] = pick([0, 10, 20, 30, 50, 80, ri(0, 100)]);
    const st = genRelState(pop); if (st) cityRelig.push([id, st]);
    if (chance(0.4)) orderValueMap.push([id, pick([0, 25, 50, 80, rf(0, 120)])]);
  }
  const ownerCivMap = []; const religionCiv = [];
  for (const o of [...new Set([...owners, -99])]) {
    if (chance(0.88)) ownerCivMap.push([o, pick(CIV_KEYS)]);
    if (chance(0.88)) religionCiv.push([o, pick(CIV_KEYS)]);
  }
  const era = {}; const tech = {}; const wonderZad = {};
  for (const o of owners) { era[o] = pick([1, 1, 2, 3, 4, 5, 8, 12]); if (chance(0.5)) tech[o] = ['Waluta', 'Zelazo', 'Brąz'].filter(() => chance(0.5)); if (chance(0.3)) wonderZad[o] = ri(1, 4); }
  era['-99'] = 1;
  const units = [];
  for (const c of cities) for (let k = 0; k < pick([0, 0, 1, 2, 3, 6]); k++) units.push({ ownerId: chance(0.9) ? c.ownerId : pick(owners), q: c.q, r: c.r, oblegaCityId: chance(0.12) ? 'x' : undefined });
  for (let k = 0; k < 3; k++) units.push({ ownerId: pick(owners), q: ri(0, 6), r: ri(0, 6) });
  const relMap = new Map();
  for (let k = 0; k < ri(0, 4); k++) relMap.set(pick(['0_1', '1_0', '1_2', '2_1', '0_2', '0_-1', '-1_1', '1_2_3', '0_3', 'x_1']), chance(0.7));
  const relations = [...relMap.entries()];
  const humans = pick([[0], [0, 1], [], [0]]);
  const capitalByOwner = owners.filter(() => chance(0.4)).map((o) => [o, pick(cities.map((c) => c.id).concat(['brak']))]);
  return { idx, difficulty, turn, cities, built, econ, luksus: luksus, cityRelig, orderValueMap, ownerCivMap, religionCiv, era, tech, wonderZad, units, relations, humans, capitalByOwner };
}

const scenarios = [];
const cov = { bunt: 0, rebelled: 0, postCapture: 0, immune: 0, warning: 0, unrest: 0, orderTier: 0, drained: 0, rngDraws: 0, mixPressureChanged: 0, spreadChanged: 0 };
for (let i = 0; i < 700; i++) {
  const sc = genScenario(i);
  const out = runLane(sc);
  for (const r of out.reports) { if (r.bunt) cov.bunt++; if (r.revoltWarning) cov.warning++; if (r.tier === 'unrest') cov.unrest++; if (r.tier === 'order') cov.orderTier++; }
  cov.rebelled += out.rebelled.length; cov.rngDraws += out.rngDraws;
  if (sc.cities.some((c) => c.postCaptureLawTurnsRemaining > 0)) cov.postCapture++;
  if (out.citizen.some(([, v]) => Object.keys(v.deductions).length > 0)) cov.drained++;
  if (out.cities.some((c, k) => c.ownCultureShare !== sc.cities[k].ownCultureShare && sc.cities[k].ownCultureShare !== undefined)) cov.mixPressureChanged++;
  scenarios.push({ in: sc, out });
}

// ---- wektory funkcji czystych ----
const NUMS = [-1, -0.5, -0.1, 0, 0.05, 0.1, 0.25, 0.5, 1, 1.5, 2, 3, -1.5, -2];
const effectsCases = [];
for (let i = 0; i < 300; i++) {
  const eff = { productionMult: pick([0, 0.5, 0.85, 1, 1.1, 1.25, 2]), pieniadzMult: pick([0, 0.8, 1, 1.2, rf(0, 2)]), naukaMult: pick([0, 0.9, 1, 1.5]), kulturaMult: pick([0, 0.9, 1, 1.5]), growthMult: pick([0, 0.7, 1, 1.3]), tradeMult: pick([0, 1, 1.1, 1.2, rf(0, 2)]), revoltRisk: pick([0, 0.05, 0.1, 0.5, 1]) };
  const mods = {};
  for (const k of ['porzadek_produkcja_proc', 'porzadek_pieniadz_proc', 'porzadek_nauka_proc', 'porzadek_kultura_proc', 'porzadek_wzrost_proc']) if (chance(0.7)) mods[k] = pick(NUMS.concat([rf(-1.2, 1.2)]));
  effectsCases.push({ eff, mods, out: W.orderEffectsWithCivMatrix(eff, mods) });
}
const postCases = [];
for (let i = 0; i < 200; i++) {
  const difficulty = pick(DIFFS);
  const h = { difficulty, era: pick([1, 2, 3, 5]), population: ri(1, 14), buildingZadowolenie: rf(-3, 12), haRel: pick([undefined, rf(-1, 1)]), haWealth: pick([undefined, rf(-3, 5)]), haCuda: pick([undefined, ri(0, 3)]), podzialHandlu: chance(0.7) ? { procentLuksus: ri(0, 80) } : undefined, atWar: chance(0.3), ownCultureShare: pick([undefined, rf(0, 1)]), stolicaEasyBonus: chance(0.2), citizenResourceHappinessDelta: pick([undefined, -2, -1, 0, 1, 2]) };
  const l = { difficulty, era: h.era, population: h.population, garnizonCount: ri(0, 6), hasDomStarszyzny: chance(0.3), hasDworZarzadcy: chance(0.3), hasPretorium: chance(0.3), hasTrybunal: chance(0.3), hasSad: chance(0.3), hasGarnizonBudynek: chance(0.3), palacTier: pick([null, 1, 2, 3]), stolicaEasyBonus: h.stolicaEasyBonus };
  const ord = W.evaluateOrderFromBreakdown(h, l, SOCIETY, difficulty);
  const city = {};
  if (chance(0.7)) city.postCaptureLawTurnsRemaining = pick([-1, 0, 1, 2, 5, 10]);
  if (chance(0.4)) city.wasRebellionReconquest = true;
  const ov = W.applyPostCaptureLawOverride(ord, city, SOCIETY, difficulty);
  const c2 = { ...city }; W.tickPostCaptureLawEndOfTurn(c2);
  const c3 = { ...city, rebelProtectionTurnsRemaining: pick([undefined, 0, 1, 2, 20]) }; const before3 = { ...c3 }; W.tickRebelProtectionEndOfTurn(c3);
  const c4 = { ownerId: pick([0, 1, 2]) }; W.markCityRebellionStarted(c4);
  postCases.push({ difficulty, h, l, city, ord: { porPct: ord.porPct, tier: ord.tier, szPct: ord.sz.szPct, prawPct: ord.prawo.prawPct, prawNetto: ord.prawo.netto, effects: ord.effects }, ov: { porPct: ov.porPct, tier: ov.tier, band: ov.band, bandLabel: ov.bandLabel, prawPct: ov.prawo.prawPct, prawNetto: ov.prawo.netto, firstLine: ov.prawo.lines[0], nLines: ov.prawo.lines.length, effects: ov.effects }, tickPost: c2, tickRebel: { before: before3, after: c3 }, mark: c4, active: W.isPostCaptureLawActive(city) });
}
const rngCases = [];
for (const seed of [0, 1, 2, 3, -1, -2, 4294967295, 4294967296, 4294967297, 8589934592, 3.7, -3.7, 1e10, 123456789, 0x5eed, 400, 401]) {
  const g = CR.makeRng(seed); rngCases.push({ seed, seq: Array.from({ length: 12 }, () => g()) });
}
const garrCases = [];
for (let i = 0; i < 120; i++) {
  const us = Array.from({ length: ri(0, 8) }, () => ({ ownerId: pick([0, 1, 2]), q: ri(0, 2), r: ri(0, 2), oblegaCityId: chance(0.25) ? 'c' : pick([undefined, '']) }));
  const q = ri(0, 2), r = ri(0, 2), o = pick([0, 1, 2]);
  garrCases.push({ units: us, q, r, o, out: W.countLawGarrisonOnCityHex(us, q, r, o) });
}
const warCases = [];
for (let i = 0; i < 150; i++) {
  const rel = Array.from({ length: ri(0, 5) }, () => [pick(['0_1', '1_2', '2_0', '-1_0', '0_-1', '1_-1', '-1_-1', '1_2_3', 'a_b', '_1', '3_', '0_-99', '-99_1']), chance(0.6)]);
  const o = pick([0, 1, 2, 3, -1, -99]);
  const relMap = new Map(rel.map(([k, v]) => [k, v]));
  warCases.push({ rel: [...relMap.entries()], o, out: W.isOwnerAtWarInRelations(o, new Map([...relMap.entries()].map(([k, v]) => [k, { status: v ? 'wojna' : 'pokoj' }]))) });
}
const cultCases = [];
for (let i = 0; i < 250; i++) {
  const difficulty = pick(DIFFS);
  const cpar = CR.loadCultureParams(SOCIETY, difficulty);
  const share = pick([undefined, 0, 0.1, 0.24, 0.25, 0.49, 0.5, 0.74, 0.75, 0.99, 1, rf(0, 1)]);
  const has = { hasAmfiteatr: chance(0.5), hasBiblioteka: chance(0.5), hasPalac: chance(0.4), hasStela: chance(0.4), hasSad: chance(0.4), hasLaznia: chance(0.4) };
  const kum = pick([0, 50, 99.9, 100, 249.9, 250, 499, 500, 1000, rf(0, 800)]);
  const perTurn = pick([0, 0.4, 3, 12.5, -2, rf(0, 40)]);
  const modifier = pick([0, 0.1, -0.5, -1, -1.5, 0.5, 2]);
  cultCases.push({ difficulty, cpar: Object.entries(cpar), share: share ?? null, has, kum, perTurn, modifier,
    conv: CR.convertCulture({ kulturaSkumulowana: 0, ownCultureShare: share }, has, cpar).ownCultureShare,
    hap: CR.cultureHappiness({ kulturaSkumulowana: 0, ownCultureShare: share }, cpar),
    acc: CR.accumulateCulture({ kulturaSkumulowana: kum }, perTurn, cpar),
    accr: CR.cultureAccrualWithModifier(perTurn, modifier),
    radius: CR.cityBorderRadius(kum, cpar) });
}
const relCases = [];
for (let i = 0; i < 300; i++) {
  const difficulty = pick(DIFFS);
  const rpar = CR.loadReligionParams(SOCIETY, difficulty);
  const st = () => { const counts = {}; for (let k = 0; k < ri(0, 4); k++) counts[pick(RELIGIONS)] = ri(0, 12); return { counts }; };
  const state = st();
  const target = pick([null, '', ...RELIGIONS]);
  const b = { hasSwiatynia: chance(0.5), hasKamienneKregi: chance(0.5) };
  const conv = CR.convertViaTemple(state, target, b, rpar);
  const neighbors = Array.from({ length: ri(0, 6) }, (_, k) => ({ id: pick(['a', 'b', 'c', 'city1', 'city10', 'city2', 'zeta', 'Ala']) + k, distance: pick([0, 1, 1, 2, 3, 4, 5]), state: st(), population: pick([undefined, ri(0, 14)]) }));
  const mod = pick([0, 0.5, -0.5, 1, -1, 0.25]);
  const sp = CR.religionParamsWithSpreadModifier(rpar, mod);
  const hasSw = chance(0.5); const pressure = pick([undefined, 1, 2, 0.5, 0, -1]); const seed = pick([0, 1, 7, 12345, 4294967295, ri(0, 1e9)]);
  const sres = CR.spreadReligion(state, neighbors, sp, { hasSwiatynia: hasSw, pressure, seed });
  relCases.push({ difficulty, rpar: Object.entries(rpar), mod, state, target, b, conv: { state: conv.state, converted: conv.converted }, neighbors, hasSw, pressure: pressure ?? null, seed, spread: sres.events.map((e) => ({ id: e.id, religion: e.religion, added: e.added, state: e.state })),
    sp: Object.entries(sp), own: CR.religionOwnShare(state, pick([null, ...RELIGIONS])), dom: CR.dominantReligion(state, rpar).religion, isEmpty: CR.isEmptyReligionState(state) });
  const last = relCases[relCases.length - 1];
  const own = pick([null, ...RELIGIONS]);
  last.ownR = own; last.ownShare = CR.religionOwnShare(state, own); last.hap = CR.religionHappiness(state, own, rpar, false);
  last.resolve = CR.resolveCityReligionState(chance(0.5) ? state : null, ri(0, 9), own);
}
const pressCases = [];
for (let i = 0; i < 250; i++) {
  const owners = [0, 1, 2, 3];
  const cs = Array.from({ length: ri(1, 7) }, (_, k) => ({ id: 'c' + k, ownerId: pick(owners), kulturaSkumulowana: pick([undefined, 0, ri(0, 500), -5]), religionState: pick([undefined, ...[0, 1, 2].map(() => ({ counts: { [pick(RELIGIONS)]: ri(0, 9) } }))]) }));
  const srm = new Map(owners.map((o) => [o, pick([null, ...RELIGIONS])]));
  const tOwner = pick(owners);
  const hasMix = chance(0.7);
  const tshare = hasMix ? pick([0, 0.3, 0.5, 0.9, 1, rf(0, 1)]) : undefined;
  const useK = hasMix && chance(0.3);
  const relPct = pick([undefined, { [tOwner]: 80 }, { 0: 10, 1: 95 }]);
  const srcs = Array.from({ length: ri(0, 5) }, () => ({ id: 's', ownerId: pick(owners) }));
  const rate = pick([3, 5, 7, 0, -2, 12.5]);
  const target = { id: 't', ownerId: tOwner, ...(useK ? { kulturaOwnShare: tshare } : hasMix ? { ownCultureShare: tshare } : {}), religionPressurePct: relPct };
  const res = CR.applyCultureReligionPressureToTarget(target, srcs, cs, rate, srm);
  pressCases.push({ tOwner, tshare: hasMix ? tshare : null, relPct: relPct ?? null, srcOwners: srcs.map((s) => s.ownerId), cs, srm: [...srm.entries()], rate, out: res,
    ect: CR.empireCultureTotal(cs, tOwner), ert: CR.empireReligionTotal(cs, tOwner, srm.get(tOwner)) });
}
const civRelCases = [];
for (const key of [...CIV_KEYS, ...CIV_KEYS.map((k) => k.toUpperCase()), 'Grecy', 'GRECY', 'nieznany', '', null, undefined, 'Słowianie', 'sumerowie']) {
  civRelCases.push({ key: key === undefined ? null : key, out: CR.civReligionForKey(key, SOCIETY, CIVS) ?? null, noCivs: CR.civReligionForKey(key, SOCIETY, undefined) ?? null });
}
const probeBits = [];
for (let i = 0; i < 400; i++) { const v = rf(-3, 3) * pick([1, 1e-9, 1e9, 0.1]); const b = new DataView(new ArrayBuffer(8)); b.setFloat64(0, v); probeBits.push([v, b.getBigUint64(0).toString(16).padStart(16, '0')]); }

const json = JSON.stringify({ pin: PIN, cov, scenarios, effectsCases, postCases, rngCases, garrCases, warCases, cultCases, relCases, pressCases, civRelCases, probeBits });
writeFileSync(outFile, json);
console.log(`scenariusze=${scenarios.length} bytes=${json.length} cov=${JSON.stringify(cov)} -> ${outFile}`);
