// Generator wektorow R-RUSTPORT-P6-ECON-TICK-STATE-SOURCES-Q1: ZRODLA STANU ticku ekonomii (pin weba 4bbef081d).
// Uruchamiane sa PRAWDZIWE funkcje weba: territoryOwnerAt (map/territory.ts), empireHasKopalniaMiedzi / cityHasPiecHutniczy
// (braz-access.ts), empireHasKopalniaNaZlozuZelaza / hasZelazoAccess (zelazo-access.ts), empireHasKopalniaZlota
// (zloto-access.ts), computeEmpireLivestockUnlocks (livestock-unlock.ts), normalizeImprovementKey,
// computeTradeRouteResourceGrants / hasTradeRouteResourceAccess (trade-routes.ts), getCityResourceAccessForCity
// (resource-access.ts), cityBorderRadius (culture-religion.ts), DEFAULT_PODZIAL_HANDLU / AI_FIXED_* (cities.ts),
// freshOwnerDefaultPodzialPracy (empire-city-defaults.ts), freshOwnerDefaultPodzialHandlu (empire-handel-split.ts).
// Sklejka z `main.ts` (zamkniecia, nieimportowalne; zero buildu w gra/) jest PRZEPISANA ponizej, z numerami linii:
//   :5030-5050 placedImprovementsForOwner, :5071-5080 empireHasGlinianka, :5088-5121 ownerHasNativeResourceAccess,
//   :5125 recomputeTradeRouteResourceGrants, :5180-5184 ownerHasZlotoAccessNow, :3217-3258 empireBuiltIdsForOwner /
//   empireActiveResourceLabelsForOwner, :34435-34440 ownerCivMap, :5516-5540 / :5548-5590 / :5655-5680 podzial.
// Uzycie: node gen-p6-state-src-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_JSON>
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
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

const THREE_NAMES = ['ACESFilmicToneMapping', 'AmbientLight', 'Box3', 'BoxGeometry', 'BufferAttribute', 'BufferGeometry', 'Camera', 'CanvasTexture', 'CatmullRomCurve3', 'CircleGeometry', 'Color', 'ConeGeometry', 'CylinderGeometry', 'DirectionalLight', 'DodecahedronGeometry', 'DoubleSide', 'Euler', 'ExtrudeGeometry', 'Float32BufferAttribute', 'Fog', 'FogExp2', 'Group', 'HemisphereLight', 'IcosahedronGeometry', 'InstancedBufferAttribute', 'InstancedMesh', 'Intersection', 'Line', 'LineBasicMaterial', 'LineDashedMaterial', 'LineLoop', 'LineSegments', 'LinearFilter', 'LinearMipmapLinearFilter', 'Material', 'MathUtils', 'Matrix4', 'Mesh', 'MeshBasicMaterial', 'MeshLambertMaterial', 'MeshPhongMaterial', 'MeshStandardMaterial', 'Object3D', 'OctahedronGeometry', 'OrthographicCamera', 'PCFSoftShadowMap', 'Path', 'PerspectiveCamera', 'Plane', 'PlaneGeometry', 'QuadraticBezierCurve3', 'Quaternion', 'Raycaster', 'RingGeometry', 'SRGBColorSpace', 'Scene', 'Shape', 'ShapeGeometry', 'SphereGeometry', 'Sprite', 'SpriteMaterial', 'Texture', 'TorusGeometry', 'TubeGeometry', 'Vector2', 'Vector3', 'WebGLRenderer'];
const THREE_STUB = 'class S { constructor() { return new Proxy(this, { get: (t, k) => (k in t ? t[k] : () => {}) }); } }\n' + THREE_NAMES.map((n) => 'export const ' + n + ' = S;').join('\n');

const built = await esbuild.build({
  stdin: {
    contents: [
      "export { territoryOwnerAt } from '../map/territory';",
      "export { empireHasKopalniaMiedzi, cityHasPiecHutniczy, PIEC_HUTNICZY_BUILDING_ID } from './braz-access';",
      "export { empireHasKopalniaNaZlozuZelaza, hasZelazoAccess } from './zelazo-access';",
      "export { empireHasKopalniaZlota } from './zloto-access';",
      "export { computeEmpireLivestockUnlocks } from './livestock-unlock';",
      "export { normalizeImprovementKey } from './terrain-improvements';",
      "export { computeTradeRouteResourceGrants, hasTradeRouteResourceAccess } from './trade-routes';",
      "export { getCityResourceAccessForCity } from './resource-access';",
      "export { cityBorderRadius } from './culture-religion';",
      "export { DEFAULT_PODZIAL_HANDLU, AI_FIXED_PROCENT_BUDYNKI, AI_FIXED_PROCENT_NAUKA } from './cities';",
      "export { freshOwnerDefaultPodzialPracy } from './empire-city-defaults';",
      "export { freshOwnerDefaultPodzialHandlu } from './empire-handel-split';",
    ].join('\n'),
    resolveDir: game, loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', loader: { '.json': 'json', '.png': 'dataurl' },
  // `three` jest importowane tylko przez moduly renderu (laczone tranzytywnie); logika gry go nie wywoluje -> zaslepka.
  plugins: [{ name: 'three-stub', setup(b) {
    b.onResolve({ filter: /^three(\/.*)?$/ }, (a) => ({ path: a.path, namespace: 'three-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'three-stub' }, () => ({ contents: THREE_STUB, loader: 'js' }));
  } }],
});
const bundleFile = join(workDir, 'web-bundle.mjs');
writeFileSync(bundleFile, built.outputFiles[0].text);
const W = await import(pathToFileURL(bundleFile).href);

// ---- deterministyczny PRNG (mulberry32) ----
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rng = mulberry32(0x5EED0A11);
const ri = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = (a) => a[Math.floor(rng() * a.length)];
const chance = (p) => rng() < p;

const OVERLAYS = [null, 'brak', 'las', 'zloze_gliny', 'zloze_rudy', 'zloze_konia', 'zloze_konia', 'zloze_konia', 'zloze_owiec', 'zloze_bydla'];
const ZLOZA = [null, null, 'zelazo', 'zelazo', 'cyna', 'miedz', 'zloto', ' Zelazo ', 'ZELAZO'];
const TERRAINS = ['rownina', 'rownina', 'plytkie_morze'];
const LAYER_POOL = ['kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_zlota', 'glinianka', 'stadnina', 'stadnina', 'stadnina', 'kopalnia', 'kopalnia_cyny', 'farma', 'droga', 'brak', 'nieistniejace_x', 'tartak', 'zagroda'];
const BUILT_POOL = [W.PIEC_HUTNICZY_BUILDING_ID, 'mennica', 'mennica', 'odlewnia_zelaza', 'wielka_odlewnia', 'cegielnia', 'garncarnia', 'targowisko', 'spichlerz', 'kuznia'];
const KEYS = ['braz', 'zelazo', 'cegla', 'zloto', 'kon'];

const enc = (x) => (x === undefined ? null : x);

function genScenario(idx) {
  const owners = [0, 1, 2, 3].slice(0, ri(2, 4));
  if (chance(0.15)) owners.push(-1);
  const R = ri(5, 9);
  const hexes = [];
  for (let q = -R; q <= R; q++) for (let r = -R; r <= R; r++) {
    if (Math.abs(q + r) > R) continue;
    const h = { q, r, teren: pick(TERRAINS), nakladka: pick(OVERLAYS), zloze: pick(ZLOZA), wlasciciel: chance(0.7) ? String(pick(owners)) : null };
    hexes.push(h);
  }
  const cities = [];
  const nc = ri(2, 7);
  for (let i = 0; i < nc; i++) {
    const h = pick(hexes);
    cities.push({ id: `c${idx}_${i}`, ownerId: pick(owners), q: h.q, r: h.r, population: ri(1, 12), kultura: chance(0.5) ? pick([0, 50, 100, 150, 250, 400, 500, 900]) : null });
  }
  const builtByCity = {};
  for (const c of cities) builtByCity[c.id] = BUILT_POOL.filter(() => chance(0.35));
  const placed = [];
  const used = new Set();
  const np = ri(0, 14);
  for (let i = 0; i < np; i++) {
    const h = pick(hexes);
    const key = `${h.q},${h.r}`;
    if (used.has(key)) continue;
    used.add(key);
    const layers = Array.from({ length: ri(1, 3) }, () => pick(LAYER_POOL));
    placed.push([key, layers]);
  }
  // wpis o kluczu spoza mapy (web: pomijany przez map.hexes[hexKey] ?? parse) i niepoprawny klucz
  if (chance(0.3)) placed.push(['99,99', ['kopalnia_zlota']]);
  const forts = [];
  for (let i = 0; i < ri(0, 2); i++) {
    const h = pick(hexes);
    const f = { q: h.q, r: h.r, pop: 1, level: 1, isFort: chance(0.5) ? true : undefined, isOutpost: chance(0.5) ? true : undefined, ownerId: pick(owners) };
    if (!f.isFort && !f.isOutpost) f.isFort = true;
    if (chance(0.5)) f.order = { turn: ri(1, 5), seq: ri(0, 3) };
    forts.push(f);
  }
  const routes = [];
  for (let i = 0; i < ri(0, 5); i++) {
    const a = pick(cities), b = pick(cities);
    if (a.id === b.id) continue;
    routes.push({ id: `r${idx}_${i}`, fromCityId: a.id, toCityId: b.id, ownerId: Math.max(0, a.ownerId), toOwnerId: Math.max(0, b.ownerId), medium: pick(['lad', 'morze']), dystans: ri(1, 12), status: chance(0.8) ? 'polaczony' : 'brak_polaczenia', budynekOdblokowany: chance(0.5) });
  }
  const eraByOwner = {};
  for (const o of [...owners, 7]) eraByOwner[o] = ri(1, 10);
  return { name: `s${idx}`, owners, hexes, cities, builtByCity, placed, forts, routes, eraByOwner };
}

// ---- sklejka main.ts (przepisana) ----
function evalScenario(s) {
  const map = { hexes: {} };
  for (const h of s.hexes) {
    const o = { coords: { q: h.q, r: h.r }, terenBazowy: h.teren };
    if (h.nakladka !== null) o.nakladka = h.nakladka;
    if (h.zloze !== null) o.zloze = h.zloze;
    if (h.wlasciciel !== null) o.wlasciciel = h.wlasciciel;
    map.hexes[`${h.q},${h.r}`] = o;
  }
  const cities = s.cities;
  const cityBuilt = new Map(Object.entries(s.builtByCity));
  const placedImprovements = new Map(s.placed);
  const fortNodes = s.forts.map((f) => { const n = { q: f.q, r: f.r, pop: f.pop, level: f.level, ownerId: f.ownerId }; if (f.isFort) n.isFort = true; if (f.isOutpost) n.isOutpost = true; if (f.order) n.order = f.order; return n; });
  // main.ts:4991-5003
  const buildAllTerritoryNodes = () => {
    const cityNodes = cities.map((c) => ({ q: c.q, r: c.r, pop: c.population, level: 1, ownerId: c.ownerId }));
    return fortNodes.length > 0 ? cityNodes.concat(fortNodes) : cityNodes;
  };
  // main.ts:5030-5050
  const placedImprovementsForOwner = (ownerId) => {
    const nodes = buildAllTerritoryNodes();
    const out = new Map();
    for (const [hexKey, layers] of placedImprovements) {
      const [qStr, rStr] = hexKey.split(',');
      if (W.territoryOwnerAt(Number(qStr), Number(rStr), nodes) === ownerId) out.set(hexKey, layers);
    }
    return out;
  };
  // main.ts:5071-5080
  const empireHasGlinianka = (pi) => { for (const layers of pi.values()) for (const raw of layers) if (W.normalizeImprovementKey(raw) === 'glinianka') return true; return false; };
  // main.ts:5088-5121
  const ownerHasNativeResourceAccess = (ownerId, key) => {
    const own = placedImprovementsForOwner(ownerId);
    if (key === 'braz') {
      if (!W.empireHasKopalniaMiedzi(own)) return false;
      for (const c of cities) if (c.ownerId === ownerId && W.cityHasPiecHutniczy(cityBuilt.get(c.id) ?? [])) return true;
      return false;
    }
    if (key === 'zelazo') {
      const hasKopalniaZelazo = W.empireHasKopalniaNaZlozuZelaza(own, map);
      if (!hasKopalniaZelazo) return false;
      for (const c of cities) if (c.ownerId === ownerId && W.hasZelazoAccess(hasKopalniaZelazo, cityBuilt.get(c.id) ?? [])) return true;
      return false;
    }
    if (key === 'cegla') {
      if (!empireHasGlinianka(own)) return false;
      for (const c of cities) if (c.ownerId === ownerId && (cityBuilt.get(c.id) ?? []).includes('cegielnia')) return true;
      return false;
    }
    if (key === 'zloto') return W.empireHasKopalniaZlota(own);
    return W.computeEmpireLivestockUnlocks(own, map, String(ownerId)).has('kon');
  };
  const grants = W.computeTradeRouteResourceGrants(s.routes, ownerHasNativeResourceAccess); // :5125
  const nativeOrTradeZloto = (o) => ownerHasNativeResourceAccess(o, 'zloto') || W.hasTradeRouteResourceAccess(grants, o, 'zloto'); // :5180-5184 bez zapasu
  const empireBuiltIdsForOwner = (ownerId) => { const ids = new Set(); for (const [cid, blt] of cityBuilt.entries()) { const c = cities.find((ct) => ct.id === cid && ct.ownerId === ownerId); if (!c) continue; for (const b of blt) ids.add(b); } return ids; };
  // main.ts:3234-3258
  const labelsFor = (ownerId) => {
    const labels = new Set();
    const builtEmpire = empireBuiltIdsForOwner(ownerId);
    const ownerImprovements = placedImprovementsForOwner(ownerId);
    for (const c of cities) {
      if (c.ownerId !== ownerId) continue;
      const builtIds = cityBuilt.get(c.id) ?? [];
      const access = W.getCityResourceAccessForCity({ id: c.id, q: c.q, r: c.r, population: c.population, kulturaSkumulowana: c.kultura ?? 0 }, map, ownerImprovements, s.eraByOwner[ownerId] ?? 1, { builtIds, ownerId: String(ownerId) });
      for (const l of access.active) labels.add(l);
    }
    if (builtEmpire.has('cegielnia')) labels.add('Cegła');
    if (builtEmpire.has('garncarnia')) labels.add('Ceramika');
    return [...labels];
  };
  const queryOwners = [...new Set([...s.owners, 7])];
  const out = { placedForOwner: {}, native: {}, zlotoNT: {}, labels: {}, grants, border: {} };
  for (const o of queryOwners) {
    out.placedForOwner[o] = [...placedImprovementsForOwner(o).entries()];
    out.native[o] = Object.fromEntries(KEYS.map((k) => [k, ownerHasNativeResourceAccess(o, k)]));
    out.zlotoNT[o] = nativeOrTradeZloto(o);
    out.labels[o] = labelsFor(o);
  }
  for (const c of cities) { const k = c.kultura ?? 0; out.border[String(k)] = W.cityBorderRadius(k); }
  return out;
}

const scenarios = [];
for (let i = 0; i < 260; i++) {
  const s = genScenario(i);
  scenarios.push({ in: s, out: evalScenario(s) });
}

// ---- ownerCivMap (main.ts:34435-34440) ----
function civMap(menu, playerCiv, ai) {
  const m = new Map();
  for (const [o, c] of menu) m.set(o, c);
  if (!m.has(0)) m.set(0, playerCiv || 'grecy');
  for (const [o, c] of ai) m.set(o, c);
  return [...m.entries()];
}
const CIVS = ['grecy', 'rzymianie', 'egipt', 'sumer', 'inkowie', 'persja'];
const civCases = [];
for (let i = 0; i < 120; i++) {
  const menu = [], ai = [];
  for (let k = 0; k < ri(0, 3); k++) menu.push([pick([0, 1, 2, 5]), pick(CIVS)]);
  for (let k = 0; k < ri(0, 4); k++) ai.push([pick([0, 1, 2, 3, 4, -1]), pick(CIVS)]);
  const dedup = (a) => [...new Map(a).entries()];
  const menuD = dedup(menu), aiD = dedup(ai);
  const pc = pick([undefined, '', 'rzymianie', 'egipt']);
  civCases.push({ menu: menuD, playerCiv: pc === undefined ? null : pc, ai: aiD, out: civMap(menuD, pc, aiD) });
}

// ---- podzial (main.ts:5516-5540, :5548-5590, :5655-5680) ----
const podzialCases = [];
for (let i = 0; i < 80; i++) {
  const humans = pick([[0], [0, 1], []]);
  const aiStart = Array.from({ length: ri(0, 4) }, () => pick([0, 1, 2, 3, 4]));
  const handlu = new Map(), pracy = new Map();
  for (const o of humans) { handlu.set(o, W.freshOwnerDefaultPodzialHandlu()); pracy.set(o, W.freshOwnerDefaultPodzialPracy()); }
  for (const o of aiStart) {
    if (!handlu.has(o)) handlu.set(o, o === 0 ? W.freshOwnerDefaultPodzialHandlu() : { ...W.DEFAULT_PODZIAL_HANDLU, procentNauka: W.AI_FIXED_PROCENT_NAUKA });
    if (!pracy.has(o)) pracy.set(o, o === 0 ? W.freshOwnerDefaultPodzialPracy() : { procentBudynki: W.AI_FIXED_PROCENT_BUDYNKI });
  }
  const initH = [...handlu.entries()], initP = [...pracy.entries()];
  const humanSet = new Set(pick([[0], [0, 1], [2]]));
  const seedOwners = Array.from({ length: ri(0, 4) }, () => pick([0, 1, 2, 3, -1, -99]));
  for (const c of seedOwners) {
    if (!pracy.has(c)) pracy.set(c, humanSet.has(c) ? W.freshOwnerDefaultPodzialPracy() : { procentBudynki: W.AI_FIXED_PROCENT_BUDYNKI });
    if (!handlu.has(c)) handlu.set(c, humanSet.has(c) ? W.freshOwnerDefaultPodzialHandlu() : { ...W.DEFAULT_PODZIAL_HANDLU, procentNauka: W.AI_FIXED_PROCENT_NAUKA });
  }
  podzialCases.push({ humans, aiStart, humanSet: [...humanSet], seedOwners, init: { handlu: initH, pracy: initP }, seeded: { handlu: [...handlu.entries()], pracy: [...pracy.entries()] } });
}

writeFileSync(outFile, JSON.stringify({ pin: PIN, scenarios, civCases, podzialCases }));
console.log(`scenariusze=${scenarios.length} civ=${civCases.length} podzial=${podzialCases.length} -> ${outFile}`);
