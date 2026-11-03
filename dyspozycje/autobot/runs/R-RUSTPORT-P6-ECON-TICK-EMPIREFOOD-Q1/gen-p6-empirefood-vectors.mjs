// Generator wektorow R-RUSTPORT-P6-ECON-TICK-EMPIREFOOD-Q1: blok EmpireFood/auto-racje/atrycja MIEDZY tickiem a bankowaniem (pin weba 4bbef081d).
// Baza: generator Q6 (wiazanie advanceCityEconomy + bankowanie); dodane: stany EmpireFood, jednostki zywe (glod/atrycja), oblezenia, fotele czlowieka.
// Uruchamiany jest PRAWDZIWY `advanceCityEconomy` oraz prawdziwe funkcje wejsc (trade-routes.ts, wonders-data.ts,
// mennica-zloto-grace.ts, capital-capture.ts, building-stock-cost.ts, sumEconomyFor*). Sklejka z `main.ts`
// (:34503-34535 trasy/reczny podatek, :3962 mapa cudow, :5180-5253 resolvery memoizowane, :35045-35131 bankowanie)
// jest PRZEPISANA w tym pliku (main.ts nie jest importowalny; zero buildu w gra/) -- oznaczone komentarzami z numerami linii.
// Uzycie: node gen-p6-adv-q6-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoRoot, workDir, esbuildMain, outDir] = process.argv.slice(2);
if (!repoRoot || !workDir || !esbuildMain || !outDir) throw new Error('uzycie: <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>');
const PIN = execFileSync('git', ['-C', repoRoot, 'rev-parse', '4bbef081d'], { encoding: 'utf8' }).trim();
rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });
execFileSync('git', ['-C', repoRoot, 'archive', '-o', join(workDir, 'pin.tar'), PIN, 'gra/src', 'gra/data']);
execFileSync('tar', ['-xf', join(workDir, 'pin.tar'), '-C', workDir]);
const game = join(workDir, 'gra/src/game');
const esbuild = await import(pathToFileURL(esbuildMain).href);

const A_INC = `  // PYTANIE-84-U-13: drain Mennicy po plonach (łaska = efekt bez pobrania Złota).\n`;
const C_INC = `  globalThis.__inc = Object.fromEntries(incomeByOwner);\n${A_INC}`;
const A_PH1 = `  const spichlerzByCity = tickEmpireResourcePipeline(\n    cities,\n`;
const C_PH1 = `  globalThis.__ph = 1;\n${A_PH1}`;
const A_PH2 = `  reconcileOwnerResourceCaps(cities, ownerResourceCapFor);\n\n  // --- Compute upkeep balance per owner`;
const C_PH2 = `  reconcileOwnerResourceCaps(cities, ownerResourceCapFor);\n  globalThis.__ph = 2;\n\n  // --- Compute upkeep balance per owner`;

const MATRIX_PATCH = {
  grecy: { wealth_cap_proc: 0.5, wealth_mnoznik_proc: 0.4, mp_max_proc: 0.3, mp_regen_proc: 0.5, mp_koszt_jednostki_proc: 0.4 },
  rzymianie: { wealth_cap_proc: -0.5, wealth_mnoznik_proc: -0.3, mp_max_proc: -0.4, mp_regen_proc: -1.5, mp_koszt_jednostki_proc: -0.3 },
  egipt: { wealth_cap_proc: 2, wealth_mnoznik_proc: 1, mp_max_proc: 1, eko_korupcja_proc: -0.5, eko_handel_brutto_proc: 0.3, mp_koszt_jednostki_proc: -0.2 },
  sumer: { wealth_cap_proc: -3, wealth_mnoznik_proc: -2, mp_regen_proc: 2, eko_korupcja_proc: 1.5, mp_koszt_jednostki_proc: 0.5 },
};

const built = await esbuild.build({
  stdin: {
    contents: `export { advanceCityEconomy, buildEconParams, sumEconomyForOwner, sumEconomyForPlayerCities } from './turn-economy';\nexport { deductBuildingStockCostAcrossCities } from './building-stock-cost';\nexport { loadTradeRouteIncomeParams, computeTradeRouteIncomeByCityBreakdown, computeTradeRouteBuildingBonusByCity, computeSeaTradeRouteCountByCity, computeSeaTradeBonusIncomeByCity } from './trade-routes';\nexport { sumWonderCityYieldsForOwner, hasAnyWonderCityYield, sumWonderTradeRouteBonusForOwner } from './wonders-data';\nexport { prepareMennicaZlotoGraceForTick, finalizeMennicaZlotoGraceAfterTick, createMennicaZlotoGraceState } from './mennica-zloto-grace';\nexport { oldestCityOfOwner } from './capital-capture';\nexport { loadGameData } from '../data/loader';\nexport { ownerResourceStockAll } from './building-stock-cost';\nexport { ownerHasZlotoStock } from './zloto-access';\nexport { advanceEmpireFood, buildEmpireFoodParams, freshEmpireFoodState, autoBalanceRationsToSolvency, autoRaiseRationsForGrowth, maxSafePoziomRacjiForCity } from './empire-food';\nexport { militaryFoodConsumptionWithSpichlerz, recomputeCityFoodBalancesInEcon, refreshEconomyFoodTotals } from './turn-economy';\nexport { loadUpkeepParams, buildUnitFoodTable } from './economy-upkeep';\nexport { cityHasSpichlerzBuilding } from './building-resource-gate';\nexport { cityPopulationCap, resolvePopulationCapMatrixDelta } from './economy';\nexport { getCityRationLevel } from './population-growth-v85';\nexport { applyArmyStarvationHpLoss } from './army-starvation';\nexport { effectiveMaxHp } from './unit-card-stats';\nexport { unitParametryBonusFrac } from './unit-building-bonuses';\nexport { veteranCombatBonusFrac } from './veteran';`,
    resolveDir: game, loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', loader: { '.json': 'json', '.png': 'dataurl' },
  plugins: [{ name: 'capture', setup(b) {
    b.onLoad({ filter: /game[\\/]turn-economy\.ts$/ }, (a) => {
      let src = readFileSync(a.path, 'utf8');
      for (const [anchor, cap] of [[A_INC, C_INC], [A_PH1, C_PH1], [A_PH2, C_PH2]]) {
        if (src.split(anchor).length !== 2) throw new Error('anchor: oczekiwano dokladnie 1 wystapienia: ' + anchor.slice(0, 70));
        src = src.replace(anchor, () => cap);
      }
      return { contents: src, loader: 'ts' };
    });
    b.onLoad({ filter: /data[\\/]civ-matrix\.json$/ }, (a) => {
      const m = JSON.parse(readFileSync(a.path, 'utf8'));
      for (const row of m.cywilizacje) if (MATRIX_PATCH[row.ikonaId]) Object.assign(row.params, MATRIX_PATCH[row.ikonaId]);
      return { contents: JSON.stringify(m), loader: 'json' };
    });
  } }],
});

const bundleFile = join(workDir, 'web-bundle.mjs');
writeFileSync(bundleFile, built.outputFiles[0].text);
const W = await import(pathToFileURL(bundleFile).href);
const DATA = W.loadGameData();
const CIV_KEYS = JSON.parse(readFileSync(join(workDir, 'gra/data/civ-matrix.json'), 'utf8')).cywilizacje.map((r) => r.ikonaId);
const BUILDING_IDS = JSON.parse(readFileSync(join(workDir, 'gra/data/buildings.json'), 'utf8')).map((b) => b.id);

const enc = (x) => {
  if (x === undefined) return null;
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  if (Object.is(x, -0)) return '-0';
  if (Number.isSafeInteger(x)) return x;
  return '~' + String(x);
};
const encRec = (rec) => (rec == null ? null : Object.fromEntries(Object.keys(rec).sort().map((k) => [k, typeof rec[k] === 'number' ? enc(rec[k]) : rec[k]])));

let seed = 0x51ab7c3d;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[ri(0, arr.length - 1)];
const wpick = (arr, w) => { let t = rnd() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < arr.length; i++) { t -= w[i]; if (t < 0) return arr[i]; } return arr[arr.length - 1]; };

// ---- mapy ([q,r,teren,nakladka,rzeka,ulepszenie,ulepszenia,zloze]) -----------------------------------------------
const TERRAINS = ['laka', 'rownina', 'wzgorza', 'gory', 'plytkie_morze', 'morze', 'pustynia', 'polarny'];
const TER_W = [4, 4, 3, 1, 1, 1, 1, 1];
const OVERLAYS = ['brak', 'las', 'zloze_gliny', 'zloze_rudy', 'zloze_konia', 'zloze_owiec', 'zloze_bydla', 'zloze_lamy'];
const OVL_W = [10, 6, 1, 1, 1, 1, 1, 1];
const IMPS = ['tartak', 'kamieniolom', 'glinianka', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'warzelnia_soli', 'stadnina',
  'kopalnia_zlota', 'farma', 'irygacja', 'droga', 'fort', 'posterunek', 'kopalnia', 'Tartak', 'nieznane', 'brak', 'bydlo', 'wyrab',
  'droga_brukowana', 'tarasy', 'owce', 'lama', 'oboz_lowiecki', 'lodzie_rybackie'];
const ZLOZA = ['rudy', 'zelaza', 'zlota', 'miedzi', 'x'];
function randHexRow(q, r, impP) {
  const ter = wpick(TERRAINS, TER_W);
  const nak = wpick(OVERLAYS, OVL_W);
  const riv = rnd() < 0.12 ? 1 : 0;
  let ul = null; let uls = null;
  if (rnd() < impP) {
    const m = rnd();
    if (m < 0.45) ul = pick(IMPS);
    else if (m < 0.9) { uls = []; const n = ri(0, 3); for (let i = 0; i < n; i++) uls.push(pick(IMPS)); }
    else { ul = pick(IMPS); uls = [pick(IMPS), pick(IMPS)]; }
  }
  return [q, r, ter, nak, riv, ul, uls, rnd() < 0.1 ? pick(ZLOZA) : null];
}
function rectMap(w, h, impP, hole) {
  const rows = [];
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) if (rnd() >= hole) rows.push(randHexRow(q, r, impP));
  return { w, h, hexes: rows, rivers: [] };
}
function hexMap(cx, cy, radius, impP) {
  const rows = [];
  for (let dq = -radius; dq <= radius; dq++) for (let dr = Math.max(-radius, -dq - radius); dr <= Math.min(radius, -dq + radius); dr++) rows.push(randHexRow(cx + dq, cy + dr, impP));
  return { w: 2 * radius + 1 + cx, h: 2 * radius + 1 + cy, hexes: rows, rivers: [] };
}
const MAPS = [];
for (let i = 0; i < 5; i++) MAPS.push(rectMap(ri(9, 13), ri(9, 13), 0.35, i < 2 ? 0 : 0.06));
MAPS.push(rectMap(15, 15, 0.5, 0)); // 5
MAPS.push(hexMap(20, 20, 18, 0.3)); // 6: pierscienie (korupcja: dystans do 18)
const toWebMap = (m) => {
  const hexes = {};
  for (const [q, r, ter, nak, riv, ul, uls, zl] of m.hexes) {
    const h = { coords: { q, r }, terenBazowy: ter, nakladka: nak, rzeka: { obecna: !!riv } };
    if (ul !== null) h.ulepszenie = ul;
    if (uls !== null) h.ulepszenia = uls.slice();
    if (zl !== null) h.zloze = zl;
    hexes[q + ',' + r] = h;
  }
  return { szerokoscQ: m.w, wysokoscR: m.h, hexes, seed: 1, rzeki: [], riverPaths: [] };
};

// ---- scenariusze ------------------------------------------------------------------------------------------------
const KEYS = ['drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'sol', 'zloto', 'kon', 'cegla', 'ceramika'];
const BUILT_ECON = ['mennica', 'cegielnia', 'garncarnia', 'biblioteka', 'akademia', 'port', 'port_wielki', 'spichlerz', 'spichlerz_ii', 'akwedukt', 'studnia',
  'targowisko', 'laznia_publiczna', 'sad', 'pretorium', 'palac', 'swiatynia', 'teatr', 'magazyn', 'stolarnia', 'kamieniarski', 'mlyn', 'nieznany_budynek'];
const POPS = [-1, 0.5, 2.5, 3.7, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 8, 10, 13, 15, 16, 17];
const CIVS = [...CIV_KEYS, 'Grecy', '', 'nieznana', undefined, undefined];
const TECHS = ['Waluta', 'waluta', 'Astronomia', 'Pismo', 'x'];
const FOODS = [undefined, undefined, 0, 3, 17.5, -4, { aktualny: 9 }, { aktualny: -2 }, { aktualny: 'x' }, {}, 'x', null, NaN, Infinity];
const num = (...vals) => pick(vals);

function genCities(mapIdx, count, clustered) {
  const m = MAPS[mapIdx];
  const cities = [];
  const used = new Set();
  const owners = [0, 1, 2].slice(0, ri(1, 3));
  const baseQ = ri(1, Math.max(1, m.w - 2)); const baseR = ri(1, Math.max(1, m.h - 2));
  for (let i = 0; i < count; i++) {
    let q; let r; let tries = 0;
    do {
      if (clustered) { q = baseQ + ri(-4, 4); r = baseR + ri(-4, 4); } else { q = ri(0, m.w - 1); r = ri(0, m.h - 1); }
      tries++;
    } while (used.has(q + ',' + r) && tries < 50);
    if (used.has(q + ',' + r)) continue;
    used.add(q + ',' + r);
    cities.push({ id: pick(['c', 'a', 'Z', 'b', 'Ab']) + i, owner: pick(owners), q, r, pop: pick(POPS) });
  }
  return cities;
}

function decorate(c, mode) {
  const rich = mode !== 'plain';
  if (c.built === undefined) c.built = [...new Set(Array.from({ length: ri(0, 7) }, () => (rnd() < 0.25 ? pick(BUILDING_IDS) : pick(BUILT_ECON))))];
  if (c.surowce === undefined) c.surowce = rnd() < 0.85 ? Object.fromEntries(KEYS.filter(() => rnd() < 0.6).map((k) => [k, rnd() < 0.15 ? ri(0, 6) : ri(0, 120)])) : null;
  if (c.food === undefined) c.food = rich ? pick(FOODS) : undefined;
  if (c.frac === undefined) c.frac = rich && rnd() < 0.6 ? pick([0, 12, 45.5, 99, -3, 0.25]) : undefined;
  if (c.racja === undefined) c.racja = rnd() < 0.6 ? pick([0, 0.5, 1, 2, 3, 3.5, 4, 5, 6, 6.25, 7, -1, 2.2]) : undefined;
  if (c.proc === undefined) c.proc = rnd() < 0.5 ? pick([0, 25, 50, 100, 150, -10]) : undefined;
  if (c.wealth === undefined) c.wealth = rnd() < 0.55 ? { poziom: pick([0, 1, 1, 2, 3, 5, 10, 11, 2.7, -1]), pula: pick([0, 3, 4.5, 9, 13.5, 40, 200, -5, NaN]) } : undefined;
  if (c.immun === undefined) c.immun = rnd() < 0.3 ? pick([0, 1, 2, 3, -1, 5, 0.5, 0.25]) : undefined;
  if (c.obl === undefined) c.obl = rnd() < 0.18;
  if (c.garn === undefined) c.garn = rnd() < 0.6 ? pick([0, 1, 3, 7, -2, NaN]) : undefined;
  if (c.mp === undefined) c.mp = rnd() < 0.5 ? pick([0, 5, 30, 1000, 100000, -3, 7.8]) : undefined;
  if (c.ph === undefined && rnd() < 0.3) c.ph = { n: pick([0, 10, 33, 60]), p: pick([0, 20, 45, 100]), l: pick([0, 10, 25, 40, 100]), over: rnd() < 0.5 };
  if (c.pp === undefined && rnd() < 0.3) c.pp = { b: pick([-5, 0, 1, 30, 50, 70, 99, 100, 101, 33.5, NaN]), over: rnd() < 0.5 };
  if (c.tryb === undefined) c.tryb = pick([undefined, 'auto', 'auto', 'reczny']);
  if (c.focus === undefined) c.focus = pick([undefined, 'zrownowazone', 'zywnosc', 'produkcja', 'podatki']);
  return c;
}

function mkOwnerMaps(cities, mode) {
  const owners = [...new Set(cities.map((c) => c.owner))];
  const per = (f) => Object.fromEntries(owners.map((o) => [o, f(o)]));
  const rich = mode !== 'plain';
  const wonder = () => ({ pieniadz: pick([undefined, 0, 2, 5.5, -3]), zywnosc: pick([undefined, 0, 4, -2]), nauka: pick([undefined, 0, 3, NaN]), kultura: pick([undefined, 0, 1.5]), praca: pick([undefined, 0, 2, -1, 3.5]) });
  return {
    civ: per(() => (rich || rnd() < 0.7 ? pick(CIVS) : 'grecy')),
    zloto: per(() => rnd() < 0.7),
    tech: rnd() < 0.5 ? per(() => TECHS.filter(() => rnd() < 0.5)) : null,
    zbadane: TECHS.filter(() => rnd() < 0.5),
    era: rnd() < 0.5 ? per(() => pick([1, 1, 2, 3, 4, 1.5, 0, 10, 11])) : null,
    wonder: rnd() < 0.4 ? per(wonder) : {},
    defH: rnd() < 0.4 ? per(() => ({ n: pick([0, 20, 60, 100]), p: pick([0, 30, 50, 100]), l: pick([0, 10, 40, 100]) })) : {},
    defP: rnd() < 0.4 ? per(() => pick([-5, 0, 30, 70, 100, 101])) : {},
  };
}

function finishScenario(name, cls, mapIdx, cities, extra = {}) {
  const mode = extra.mode ?? (cls === 'plain' ? 'plain' : 'rich');
  for (const c of cities) decorate(c, mode);
  const om = extra.ownerMaps ?? mkOwnerMaps(cities, mode);
  const ids = cities.map((c) => c.id);
  const perCityMap = (p, f) => Object.fromEntries(ids.filter(() => rnd() < p).map((id) => [id, f()]));
  return {
    name, cls, mapIdx, difficulty: pick(['easy', 'normal', 'hard']), playerEra: pick([1, 1, 2, 3]),
    cities, om,
    order: mode === 'plain' ? {} : perCityMap(0.3, () => ({ prod: pick([1, 1, 0.8, 1.25, 0, NaN]), pien: pick([1, 1, 0.9, 1.5]), nauka: pick([1, 1.1, 0.5]), kult: pick([1, 1, 2]) })),
    tbonus: mode === 'plain' ? {} : perCityMap(0.3, () => pick([0, 1.5, 3, 7.25])),
    tinc: mode === 'plain' ? {} : perCityMap(0.4, () => pick([0, 4, 10, 27, 100.5])),
    marit: mode === 'plain' ? {} : perCityMap(0.3, () => pick([0, 3, 10, 50, -4])),
    mtax: mode === 'plain' ? {} : perCityMap(0.3, () => pick([0, 5, 12, -3, 40.5])),
    econ: extra.econ ?? null,
    ...extra,
  };
}


// ===================== Q6: scenariusze WIAZANIA (trasy, cuda, lask Mennicy, reczny podatek, bankowanie) =====================
const scenarios = [];
const UNIT_TYPES = JSON.parse(readFileSync(join(workDir, 'gra/data/units.json'), 'utf8')).map((u) => u.Jednostka);
const genUnits = (owners, n) => Array.from({ length: n }, () => ({ owner: rnd() < 0.1 ? 7 : pick(owners), typeId: rnd() < 0.1 ? pick(['nieznana', '', 'wojownik']) : pick(UNIT_TYPES) }));
const WONDERS_RAW = JSON.parse(readFileSync(join(workDir, 'gra/data/wonders.json'), 'utf8')).cuda;
const WONDER_IDS = WONDERS_RAW.map((w) => w.id);
const WONDER_TRADE = WONDERS_RAW.filter((w) => (w.bonusy?.specjalne ?? []).some((x) => x.typ === 'handel_procent')).map((w) => w.id);
const WONDER_CITY = WONDERS_RAW.filter((w) => w.bonusy?.miasto && Object.keys(w.bonusy.miasto).length > 0).map((w) => w.id);
const HEAL_TYPES = ['Legionista', 'Lucznik', 'Rycerz', 'Katapulta', 'Falanga', 'Zwiadowca', 'Osadnik', 'Robotnik'];
const HEAL_CATS = ['piechota', 'lucznik', 'kawaleria', 'machina', 'osadnik', 'robotnik', 'zwiadowca'];

function renameCityIds(cs) {
  // czesc id w formacie `city<N>` (oldestCityOfOwner / cityFoundOrder), reszta z wzorca Q5
  const mode = rnd();
  if (mode >= 0.4) {
    const used = new Set();
    cs.forEach((c) => {
      if (mode < 0.8 || rnd() < 0.5) { let n; do { n = ri(0, 30); } while (used.has(n)); used.add(n); c.id = 'city' + n; }
    });
    if (rnd() < 0.15 && cs.length) cs[0].id = pick(['city', 'city01', 'City3', 'city3x', 'city-1']);
  }
  const ids = new Set();
  cs.forEach((c) => { while (ids.has(c.id)) c.id = c.id + 'z'; ids.add(c.id); });
}

function buildQ6(sc, withHeal) {
  const cs = sc.cities;
  const owners = [...new Set(cs.map((c) => c.owner))];
  const allOwners = [...new Set([...owners, 9])];
  const q = {};
  const routes = [];
  const realCities = cs.filter((c) => c.owner >= 0);
  const nR = realCities.length >= 2 ? ri(0, Math.min(7, realCities.length * 2)) : 0;
  for (let k = 0; k < nR; k++) {
    const a = pick(realCities); const b = pick(realCities); if (a === b) continue;
    const medium = pick(['lad', 'morze']);
    routes.push({ id: `${a.id}|${b.id}|${medium}|${k}`, fromCityId: a.id, toCityId: b.id, ownerId: a.owner, toOwnerId: b.owner, medium,
      dystans: pick([0, 1, 2, 5, 11, 12, 13, 20, 21, 30, ri(0, 25), ri(0, 25)]), status: rnd() < 0.85 ? 'polaczony' : 'brak_polaczenia', budynekOdblokowany: rnd() < 0.5 });
  }
  q.routes = routes;
  q.placed = Array.from({ length: ri(0, 7) }, () => ({ owner: pick(allOwners), id: rnd() < 0.08 ? 'nieznany_cud' : rnd() < 0.4 ? pick(WONDER_TRADE) : rnd() < 0.5 ? pick(WONDER_CITY) : pick(WONDER_IDS) }));
  q.era = Object.fromEntries([...allOwners, -1].map((o) => [o, pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 1.5, 0])]));
  q.tech = Object.fromEntries([...allOwners, -1].map((o) => [o, TECHS.filter(() => rnd() < 0.5)]));
  q.native = Object.fromEntries([...allOwners, -1].map((o) => [o, rnd() < 0.25]));
  q.labels = Object.fromEntries([...allOwners, -1].map((o) => [o, ['Glina', 'Drewno', 'Kamień', 'Ruda', 'Sól', 'Złoto', 'Glina'].filter(() => rnd() < 0.45)]));
  q.grace = {
    left: Object.fromEntries([...allOwners, -1].filter(() => rnd() < 0.6).map((o) => [o, pick([0, 1, 2, 0.5])])),
    had: Object.fromEntries([...allOwners, -1].filter(() => rnd() < 0.7).map((o) => [o, rnd() < 0.5])),
  };
  q.tax = Object.fromEntries(allOwners.filter(() => rnd() < 0.6).map((o) => [o, pick([0, -3, 5, 12.5, 40, 100.25, NaN])]));
  q.capital = Object.fromEntries(allOwners.filter(() => rnd() < 0.6).map((o) => {
    const mine = cs.filter((c) => c.owner === o).map((c) => c.id);
    const other = cs.filter((c) => c.owner !== o).map((c) => c.id);
    return [o, pick([...(mine.length ? [mine[0], mine[mine.length - 1]] : []), ...(other.length ? [other[0]] : []), 'nieistnieje', ''])];
  }));
  q.humans = allOwners.filter(() => rnd() < 0.35).sort((a, b) => a - b);
  q.aiBonus = Object.fromEntries(allOwners.map((o) => [o, pick([0, 0, 2, 5.5])]));
  q.before = Object.fromEntries(allOwners.map((o) => [o, { sk: pick([0, 10, -5, 123.45, 1e6 + 0.1]), na: pick([0, 3, 7.7, -1.5]) }]));
  sc.q6 = q;
  const ow2 = [...new Set(cs.map((c) => c.owner))];
  sc.units = rnd() < 0.6 ? genUnits(ow2, ri(0, 8)) : [];
  if (withHeal) {
    for (const c of cs) { c.mp = rnd() < 0.85 ? pick([0, 5, 30, 200, 1000, 100000, 7.8]) : undefined; }
    const hu = [];
    const nU = ri(1, 6);
    for (let u = 0; u < nU; u++) {
      const typeId = pick(HEAL_TYPES); const home = pick(cs);
      const un = { id: 'u' + u, ownerId: home.owner, typeId, category: pick(HEAL_CATS) };
      un.hp = ri(1, 70); if (rnd() < 0.6) un.hpMax = pick([100, 50, 120]);
      un.q = home.q; un.r = home.r;
      hu.push(un);
    }
    sc.heal = { units: hu, maxHpByType: Object.fromEntries(HEAL_TYPES.map((t) => [t, pick([100, 100, 120, 60, 80.5])])) };
  }
  return sc;
}

// ===================== EmpireFood: stan bloku (stany panstwa, jednostki zywe, oblezenia, fotele czlowieka) =====================
const FOOD_TYPES = UNIT_TYPES.filter((t) => typeof t === 'string' && t.length > 0);
const NEIGH = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
function buildEF(sc, kind) {
  const cs = sc.cities;
  const q = sc.q6;
  const owners = [...new Set(cs.map((c) => c.owner))];
  const realOwners = owners.filter((o) => o >= 0);
  // fotele czlowieka: wiele (kolejnosc rosnaca jak w Rust BTreeSet) albo brak
  if (kind === 'human') q.humans = realOwners.filter((o) => o === 0 || rnd() < 0.4).sort((a, b) => a - b);
  else if (kind === 'ai') q.humans = [];
  // stany EmpireFood
  const ZAP = kind === 'army' ? [0, 0, 1, 5, 20] : [0, 3, 40, 150, 600, 1500, 5000, 12345.5];
  const TUR = [0, 0, 1, 2, 2, 3, 4, 7];
  const states = {};
  const allSt = [...new Set([...owners, ...(rnd() < 0.3 ? [pick([5, 8, -1, -99])] : [])])];
  for (const o of allSt) if (rnd() < 0.8) states[o] = { z: pick(ZAP), t: rnd() < 0.85 ? pick(TUR) : undefined };
  if (kind === 'army') for (const o of realOwners) if (!states[o]) states[o] = { z: pick(ZAP), t: pick([2, 2, 3, 5]) };
  // miasta panstwa klastra (bez autoRaise)
  const typCity = realOwners.filter(() => rnd() < 0.2);
  // auto-zarzadzanie wyzywieniem + oblezenia per miasto
  const bySieger = {};
  for (const c of cs) {
    c.auto = rnd() < 0.7 ? pick([true, true, false]) : undefined;
    if (kind === 'human' && rnd() < 0.8) c.auto = true;
    c.obl = kind === 'siege' ? rnd() < 0.6 : c.obl;
    if (c.obl) {
      const others = owners.filter((o) => o !== c.owner);
      c.sOwner = others.length && rnd() < 0.7 ? pick(others) : undefined;
      c.sCap = rnd() < 0.5; c.sMach = rnd() < 0.5;
      if (c.sOwner !== undefined && rnd() < 0.5) bySieger[c.id] = c.sOwner;
      else if (c.sOwner === undefined && rnd() < 0.6) bySieger[c.id] = pick(owners);
    }
  }
  // jednostki zywe
  const nU = kind === 'army' ? ri(8, 40) : kind === 'siege' ? ri(4, 18) : ri(0, 12);
  const live = [];
  const CATS = ['piechota', 'lucznik', 'kawaleria', 'machina', 'osadnik', 'robotnik', 'zwiadowca', 'piechota', 'piechota'];
  for (let i = 0; i < nU; i++) {
    const home = pick(cs);
    const own = rnd() < 0.85 ? pick(owners) : (rnd() < 0.5 ? 7 : -1);
    const typeId = rnd() < 0.08 ? pick(['nieznana', '', 'wojownik']) : pick(FOOD_TYPES);
    const u = { id: 'u' + i, ownerId: own, typeId, category: pick(CATS), q: home.q, r: home.r, inGarnizon: false };
    const place = rnd();
    if (place < 0.3 && own === home.owner) { u.inGarnizon = true; }
    else if (place < 0.6) { const [dq, dr] = pick(NEIGH); u.q = home.q + dq; u.r = home.r + dr; }
    else if (place < 0.8) { u.q = home.q + ri(-6, 6); u.r = home.r + ri(-6, 6); }
    else if (own === home.owner) { u.inGarnizon = true; } // flaga bez realnego garnizonu? zostaje na heksie miasta
    if (rnd() < 0.7) u.hp = pick([1, 2, 3, 5, 8, 20, 40, 90, 150, 0.5, 7.7]);
    if (rnd() < 0.5) u.hpMax = pick([100, 50, 120, 30, 10, 3]);
    if (rnd() < 0.25) u.battlesSurvived = pick([0, 1, 3, 5, 9, 12]);
    u.camping = rnd() < 0.15;
    u.onOwn = rnd() < 0.6;
    live.push(u);
  }
  // jednostki oblegajace (oznaczone oblegaCityId, sasiadujace z miastem)
  for (const c of cs) {
    if (!c.obl || rnd() < 0.2) continue;
    const bo = c.sOwner ?? bySieger[c.id];
    const n = ri(1, 3);
    for (let k = 0; k < n; k++) {
      const [dq, dr] = pick(NEIGH);
      live.push({ id: 'sg' + c.id + k, ownerId: bo ?? c.owner, typeId: pick(FOOD_TYPES), category: pick(['piechota', 'machina', 'kawaleria']), q: c.q + dq, r: c.r + dr, inGarnizon: false,
        hp: pick([1, 1, 2, 3, 40]), hpMax: rnd() < 0.5 ? pick([100, 12]) : undefined, oblegaCityId: rnd() < 0.85 ? c.id : undefined, camping: false, onOwn: rnd() < 0.5 });
    }
  }
  sc.ef = { states, typCity, bySieger, live };
  return sc;
}

function mk(name, cls, count, opts = {}) {
  const mapIdx = ri(0, 5);
  const cs = genCities(mapIdx, count, rnd() < 0.6);
  renameCityIds(cs);
  if (opts.barb && cs.length < 7) {
    const m = MAPS[mapIdx]; let q; let r; let t = 0;
    do { q = ri(0, m.w - 1); r = ri(0, m.h - 1); t++; } while (cs.some((c) => c.q === q && c.r === r) && t < 30);
    if (!cs.some((c) => c.q === q && c.r === r)) cs.push({ id: 'barb' + ri(0, 9), owner: rnd() < 0.3 ? -99 : -1, q, r, pop: pick([1, 2, 3]) });
    const ids = new Set(); cs.forEach((c) => { while (ids.has(c.id)) c.id += 'x'; ids.add(c.id); });
  }
  const sc = finishScenario(name, cls, mapIdx, cs, { difficulty: pick(['easy', 'normal', 'hard']) });
  buildQ6(sc, false);
  sc.units = [];
  buildEF(sc, opts.kind ?? 'mixed');
  return sc;
}
for (let i = 0; i < 70; i++) scenarios.push(mk(`ef-${i}`, 'ef', ri(1, 6)));
for (let i = 0; i < 55; i++) scenarios.push(mk(`ef-army-${i}`, 'ef-army', ri(1, 5), { kind: 'army' }));
for (let i = 0; i < 40; i++) scenarios.push(mk(`ef-siege-${i}`, 'ef-siege', ri(2, 6), { kind: 'siege' }));
for (let i = 0; i < 55; i++) scenarios.push(mk(`ef-human-${i}`, 'ef-human', ri(2, 8), { kind: 'human' }));
for (let i = 0; i < 20; i++) scenarios.push(mk(`ef-ai-${i}`, 'ef-ai', ri(2, 7), { kind: 'ai' }));
for (let i = 0; i < 15; i++) scenarios.push(mk(`ef-barb-${i}`, 'ef-barb', ri(1, 4), { barb: true }));
for (let i = 0; i < 30; i++) {
  const sc = mk(`ef-econ-${i}`, 'ef-econ', ri(2, 6), { kind: i % 2 ? 'human' : 'army' });
  const econ = structuredClone(DATA.econParams);
  const d = sc.difficulty;
  const em = econ.ekonomia_miasta;
  const how = i % 6;
  if (how === 0) { em.glod_wojska_hp_frac[d] = 0.5; em.glod_wojska_karencja_tur[d] = 1; }
  else if (how === 1) { em.glod_wojska_hp_frac[d] = 1.7; em.glod_wojska_karencja_tur[d] = 0; }
  else if (how === 2) { em.glod_wojska_hp_frac[d] = 0; }
  else if (how === 3) { em.akwedukt_prog_ludnosci[d] = 2; em.spichlerz_prog_ludnosci[d] = 3; em.akwedukt_max_ludnosci[d] = 4; }
  else if (how === 4) { if (!econ.globalne) econ.globalne = {}; econ.globalne.magazyn_centralny_baza_zywnosc = { easy: 5, normal: 5, hard: 5 }; econ.globalne.magazyn_centralny_bonus_zywnosc_na_budynek = { easy: 7, normal: 7, hard: 7 }; }
  else { em.zywnosc_jednostka_ruch[d] = 3; em.zywnosc_mnoznik_poza_terytorium[d] = 4; }
  sc.econ = econ;
  scenarios.push(sc);
}

// ---- uruchomienie weba ---------------------------------------------------------------------------------------------
const recEnc = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, enc(v)]));
const mapOfRec = (m) => Object.fromEntries([...m].map(([o, r]) => [o, recEnc(r)]));
const mapNum = (m) => Object.fromEntries([...m].map(([k, v]) => [k, enc(v)]));

// ---- main.ts:34594-34850 (blok EmpireFood), PRZEPISANY 1:1 (main.ts nie jest importowalny); wywoluje PRAWDZIWE funkcje weba ----
function normFieldVal(v, fallback) {
  if (v === null || v === undefined || v === '---' || v === '—' || v === '' ) return fallback;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? fallback : n;
}
function unitHealth(def) { return normFieldVal(def['health'] ?? def['Health'], 30); }
function runEmpireFoodBlock(s, cities, econ, econUnits, units, cityBuilt, ownerCivMap, empireEpochForOwner, data, difficulty, humans) {
  const isHuman = (o) => humans.includes(o);
  const humanOwnerIds = humans;
  const typCityCopyOwners = new Set(s.ef.typCity);
  const empireFoodStates = new Map();
  for (const [o, st] of Object.entries(s.ef.states)) {
    const f = W.freshEmpireFoodState();
    f.zapasyPanstwa = st.z;
    if (st.t === undefined) delete f.turyUjemnychZapasow; else f.turyUjemnychZapasow = st.t;
    empireFoodStates.set(Number(o), f);
  }
  const siegeBesiegerByCity = new Map(Object.entries(s.ef.bySieger));
  const ended = []; const garnSynced = [];
  const upkeepParams = W.loadUpkeepParams(data.econParams, difficulty);
  const efParams = W.buildEmpireFoodParams(data.econParams, difficulty);
  const unitFoodTbl = W.buildUnitFoodTable(data.units);
  const result = { clampedAny: false, playerDamaged: 0, playerDestroyed: 0 };
  // :34603-34612
  const spichlerzByCityForAuto = new Map();
  for (const city of cities) {
    const tick = econ.perCity.find((t) => t.cityId === city.id);
    spichlerzByCityForAuto.set(city.id, {
      ceramikaActive: tick?.spichlerzCeramika ?? false, solActive: tick?.spichlerzSol ?? false,
      maSpichlerzPop: tick?.maSpichlerz ?? false, maSpichlerzIIPop: tick?.maSpichlerzII ?? false,
    });
  }
  // :34646-34657
  const econParamsForPopCap = W.buildEconParams(data, difficulty);
  const popCapByCityId = new Map();
  for (const city of cities) {
    const builtIds = cityBuilt.get(city.id) ?? [];
    const maAkwedukt = builtIds.includes('akwedukt');
    const maSpichlerzBuilding = W.cityHasSpichlerzBuilding(builtIds);
    const civKey = ownerCivMap.get(city.ownerId) ?? null;
    popCapByCityId.set(city.id, W.cityPopulationCap(maAkwedukt, maSpichlerzBuilding, econParamsForPopCap, W.resolvePopulationCapMatrixDelta(civKey)));
  }
  const ownerIdsForAutoRation = new Set();
  for (const city of cities) if (city.ownerId >= 0) ownerIdsForAutoRation.add(city.ownerId);
  for (const oid of empireFoodStates.keys()) if (oid >= 0) ownerIdsForAutoRation.add(oid);
  let autoRationAnyAdjusted = false;
  let pendingAutoRationForNextTurn = null;
  const calls = [];
  for (const ownerId of ownerIdsForAutoRation) {
    const foodSt = empireFoodStates.get(ownerId) ?? W.freshEmpireFoodState();
    const kosztArmiiForOwner = W.militaryFoodConsumptionWithSpichlerz(econUnits, ownerId, upkeepParams, unitFoodTbl);
    const autoRationResult = W.autoBalanceRationsToSolvency({
      ownerId, cities, econ, zapasyPrzed: foodSt.zapasyPanstwa, rationParams: efParams.rationParams,
      spichlerzByCity: spichlerzByCityForAuto, onlyAutoManaged: isHuman(ownerId), requireFlowBalance: isHuman(ownerId),
      kosztArmii: kosztArmiiForOwner, popCapByCityId,
    });
    calls.push({ o: ownerId, koszt: enc(kosztArmiiForOwner), bal: autoRationResult.adjusted });
    if (autoRationResult.adjusted) {
      autoRationAnyAdjusted = true;
      if (isHuman(ownerId)) pendingAutoRationForNextTurn = autoRationResult;
    }
    if (!typCityCopyOwners.has(ownerId)) {
      const raiseResult = W.autoRaiseRationsForGrowth({
        ownerId, cities, econ, zapasyPrzed: foodSt.zapasyPanstwa, rationParams: efParams.rationParams,
        spichlerzByCity: spichlerzByCityForAuto, requireProductionSurplus: isHuman(ownerId), onlyAutoManaged: isHuman(ownerId),
        kosztArmii: kosztArmiiForOwner, popCapByCityId,
      });
      calls.push({ o: ownerId, raise: raiseResult.adjusted });
      if (raiseResult.adjusted) autoRationAnyAdjusted = true;
    }
  }
  if (autoRationAnyAdjusted) W.refreshEconomyFoodTotals(econ);
  // :34707-34733 (clamp)
  {
    let clampedAny = false;
    for (const hOid of humanOwnerIds) {
      const foodSt0 = empireFoodStates.get(hOid) ?? W.freshEmpireFoodState();
      for (const city of cities) {
        if (city.ownerId !== hOid) continue;
        const maxSafe = W.maxSafePoziomRacjiForCity({
          cityId: city.id, ownerId: hOid, cities, econ, zapasyPrzed: foodSt0.zapasyPanstwa, rationParams: efParams.rationParams,
          spichlerzByCity: spichlerzByCityForAuto, popCapByCityId,
        });
        const cur = W.getCityRationLevel(city);
        if (cur > maxSafe) { city.poziomRacji = maxSafe; clampedAny = true; }
      }
    }
    if (clampedAny) {
      W.recomputeCityFoodBalancesInEcon(econ.perCity, cities, efParams.rationParams, spichlerzByCityForAuto);
      W.refreshEconomyFoodTotals(econ);
    }
    result.clampedAny = clampedAny;
  }
  // :34750
  const efTickResult = W.advanceEmpireFood(econ, econUnits, empireFoodStates, upkeepParams, efParams, unitFoodTbl, cityBuilt, empireEpochForOwner);
  // :34776-34850
  const defOf = (typeId) => data.units.find((ud) => ud.Jednostka === typeId) ?? {};
  const runtimeMaxHp = (u) => W.effectiveMaxHp(unitHealth(defOf(u.typeId)), W.unitParametryBonusFrac(u), W.veteranCombatBonusFrac(u));
  for (const u of units) { // syncAllRuntimeUnitHpState (main.ts:29894-29906)
    const maxHp = runtimeMaxHp(u);
    u.hpMax = maxHp;
    if (u.hp !== undefined) u.hp = Number.isFinite(u.hp) ? Math.max(0, Math.min(maxHp, u.hp)) : maxHp;
  }
  const allDestroyedIds = [];
  for (const tick of efTickResult.perOwner) {
    if (!tick.glodWojskaAtrycjaAktywna) continue;
    const starv = W.applyArmyStarvationHpLoss(units, tick.ownerId, efParams.glodWojskaHpFrac, (typeId) => unitHealth(defOf(typeId)));
    if (tick.ownerId === 0) { result.playerDamaged += starv.damagedCount; result.playerDestroyed += starv.destroyedIds.length; }
    if (starv.destroyedIds.length > 0) allDestroyedIds.push(...starv.destroyedIds);
  }
  const hexDistance = (aq, ar, bq, br) => Math.max(Math.abs(aq - bq), Math.abs(ar - br), Math.abs((-aq - ar) - (-bq - br)));
  const endMapSiege = (cityId) => { // main.ts:16076-16091 (czesc silnikowa)
    const city = cities.find((c) => c.id === cityId);
    if (city) { city.oblegane = false; delete city.oblegajacyOwnerId; city.siegeCapitulationPending = false; delete city.siegeMachines; }
    for (const u of units) if (u.oblegaCityId === cityId) delete u.oblegaCityId;
    siegeBesiegerByCity.delete(cityId);
    ended.push(cityId);
  };
  if (allDestroyedIds.length > 0) {
    const destroyedSet = new Set(allDestroyedIds);
    const siegeCityIdsAffected = new Set();
    const garnizonCitiesAffected = new Map();
    for (const u of units) {
      if (!destroyedSet.has(u.id)) continue;
      if (u.oblegaCityId) siegeCityIdsAffected.add(u.oblegaCityId);
      if (u.inGarnizon === true) { const c = cityAtUnit2(cities, u); if (c) garnizonCitiesAffected.set(c.id, c); }
    }
    for (let i = units.length - 1; i >= 0; i--) if (destroyedSet.has(units[i].id)) units.splice(i, 1);
    for (const siegeCityId of siegeCityIdsAffected) {
      const stillMarked = units.some((x) => x.oblegaCityId === siegeCityId);
      if (!stillMarked) {
        const sc = cities.find((c) => c.id === siegeCityId);
        if (sc?.oblegane) {
          const bId = sc.oblegajacyOwnerId ?? siegeBesiegerByCity.get(siegeCityId);
          const adj = bId !== undefined && units.some((x) => x.ownerId === bId && hexDistance(x.q, x.r, sc.q, sc.r) === 1);
          if (!adj) endMapSiege(siegeCityId);
        }
      }
    }
    for (const c of garnizonCitiesAffected.values()) {
      c.garnizon = units.filter((u) => u.ownerId === c.ownerId && u.q === c.q && u.r === c.r && u.inGarnizon === true).length;
      garnSynced.push(c.id);
    }
  }
  const encTick = (t) => ({
    ownerId: t.ownerId, uprawaHodowla: enc(t.uprawaHodowla), wyzwienieLudnosci: enc(t.wyzwienieLudnosci), nadwyzka: enc(t.nadwyzka), pomocMiastom: enc(t.pomocMiastom),
    spichlerzStolicy: enc(t.spichlerzStolicy), wojsko: enc(t.wojsko), przyrostZapasow: enc(t.przyrostZapasow), zapasyPrzed: enc(t.zapasyPrzed), zapasyPo: enc(t.zapasyPo),
    maxCap: enc(t.maxCap), kosztArmii: enc(t.kosztArmii), glodWojska: t.glodWojska, turyUjemnychZapasowPo: enc(t.turyUjemnychZapasowPo),
    atrycja: t.glodWojskaAtrycjaAktywna, zywnoscBrutto: enc(t.zywnoscBrutto), doRozwoju: enc(t.doRozwoju), doPanstwa: enc(t.doPanstwa),
    rows: t.perCityRows.map((r) => ({ cityId: r.cityId, produkcja: enc(r.produkcja), kosztRacji: enc(r.kosztRacji), bilans: enc(r.bilans), wzrostProcent: enc(r.wzrostProcent), nakarmione: r.nakarmione })),
    fed: Object.fromEntries([...t.fedByCityId]),
  });
  return {
    calls,
    efTicks: efTickResult.perOwner.map(encTick),
    states: Object.fromEntries([...empireFoodStates].map(([o, st]) => [o, { z: enc(st.zapasyPanstwa), t: enc(st.turyUjemnychZapasow) }])),
    anyAdjusted: autoRationAnyAdjusted,
    pending: pendingAutoRationForNextTurn ? pendingAutoRationForNextTurn.changes.map((c) => ({ cityId: c.cityId, name: c.name, oldLevel: enc(c.oldLevel), newLevel: enc(c.newLevel) })) : null,
    pendingAdjusted: pendingAutoRationForNextTurn ? pendingAutoRationForNextTurn.adjusted : null,
    clampedAny: result.clampedAny,
    popCap: Object.fromEntries([...popCapByCityId].map(([k, v]) => [k, enc(v)])),
    destroyed: allDestroyedIds, playerDamaged: result.playerDamaged, playerDestroyed: result.playerDestroyed,
    units: units.map((u) => ({ id: u.id, hp: enc(u.hp), hpMax: enc(u.hpMax), oblega: u.oblegaCityId ?? null })),
    siege: cities.map((c) => ({ id: c.id, oblegane: c.oblegane === true, owner: c.oblegajacyOwnerId === undefined ? null : c.oblegajacyOwnerId, cap: c.siegeCapitulationPending === true, mach: c.siegeMachines !== undefined, garn: c.garnizon === undefined ? null : enc(c.garnizon) })),
    besieger: Object.fromEntries([...siegeBesiegerByCity]),
    ended, garnSynced,
    kosztArmiiOwners: Object.fromEntries([...new Set([...cities.map((c) => c.ownerId), ...econUnits.map((u) => u.ownerId)])].map((o) => [o, enc(W.militaryFoodConsumptionWithSpichlerz(econUnits, o, upkeepParams, unitFoodTbl))])),
  };
}
const cityAtUnit2 = (cities, u) => cities.find((c) => c.ownerId === u.ownerId && c.q === u.q && c.r === u.r);

function runWeb(s) {
  const q = s.q6;
  const cities = s.cities.map((c) => {
    const o = { id: c.id, ownerId: c.owner, q: c.q, r: c.r, name: c.id, population: c.pop };
    if (c.surowce !== null) o.surowce = { ...c.surowce };
    if (c.tryb !== undefined) o.okolicaTryb = c.tryb;
    if (c.focus !== undefined) o.okolicaFocus = c.focus;
    if (c.food !== undefined) o.magazynZywnosci = typeof c.food === 'object' && c.food !== null ? { ...c.food } : c.food;
    if (c.frac !== undefined) o.wzrostUlamkowy = c.frac;
    if (c.racja !== undefined) o.poziomRacji = c.racja;
    if (c.proc !== undefined) o.procentRozwoj = c.proc;
    if (c.wealth !== undefined) o.wealthState = { ...c.wealth };
    if (c.immun !== undefined) o.wealthImmunityRemaining = c.immun;
    if (c.obl) { o.oblegane = true; if (c.sOwner !== undefined) o.oblegajacyOwnerId = c.sOwner; o.siegeCapitulationPending = !!c.sCap; if (c.sMach) o.siegeMachines = { queue: ['taran'], ready: [] }; }
    if (c.auto !== undefined) o.autoWyzywienie = c.auto;
    if (c.garn !== undefined) o.garnizon = c.garn;
    if (c.mp !== undefined) o.manpower = c.mp;
    if (c.ph) { o.podzialHandlu = { procentNauka: c.ph.n, procentPieniadz: c.ph.p, procentLuksus: c.ph.l }; o.podzialHandluOverride = c.ph.over; }
    if (c.pp) { o.podzialPracy = { procentBudynki: c.pp.b }; o.podzialPracyOverride = c.pp.over; }
    return o;
  });
  const builtByCity = new Map(s.cities.map((c) => [c.id, c.built.slice()]));
  const om = s.om;
  const eraOf = (o) => q.era[o] ?? 1;
  const techOf = (o) => new Set(q.tech[o] ?? []);
  const ownerCiv = new Map(Object.entries(om.civ).filter(([, v]) => v !== undefined).map(([k, v]) => [Number(k), v]));
  const orderMap = new Map(Object.entries(s.order).map(([id, m]) => [id, { productionMult: m.prod, pieniadzMult: m.pien, naukaMult: m.nauka, kulturaMult: m.kult }]));
  const defH = new Map(Object.entries(om.defH).map(([o, v]) => [Number(o), { procentNauka: v.n, procentPieniadz: v.p, procentLuksus: v.l }]));
  const defP = new Map(Object.entries(om.defP).map(([o, v]) => [Number(o), { procentBudynki: v }]));
  const data = { ...DATA, ...(s.econ ? { econParams: s.econ } : {}) };
  const difficulty = s.difficulty;
  // ---- main.ts:34503-34524 (trasy) ----
  const routes = q.routes.map((r) => ({ ...r }));
  const wonderIdsOwnedBy = (o) => q.placed.filter((p) => p.owner === o).map((p) => p.id);
  const wonderTradeFn = (o, medium) => W.sumWonderTradeRouteBonusForOwner(wonderIdsOwnedBy(o), eraOf(o), medium);
  const targFn = (cid) => (builtByCity.get(cid)?.includes('targowisko') ? W.buildEconParams(data, difficulty).budynekTargowiskoBonusHandlu : 0);
  const tradeIncomeParams = W.loadTradeRouteIncomeParams(data.econParams, difficulty);
  const routeIncome = W.computeTradeRouteIncomeByCityBreakdown(routes, tradeIncomeParams, wonderTradeFn, targFn);
  const tradeIncomeByCity = routeIncome.totalByCity;
  const maritimeTradeIncomeByCity = routeIncome.maritimeByCity;
  const seaBonus = W.computeSeaTradeBonusIncomeByCity(W.computeSeaTradeRouteCountByCity(routes));
  for (const [cityIdSea, bonusSea] of seaBonus) {
    tradeIncomeByCity.set(cityIdSea, (tradeIncomeByCity.get(cityIdSea) ?? 0) + bonusSea);
    maritimeTradeIncomeByCity.set(cityIdSea, (maritimeTradeIncomeByCity.get(cityIdSea) ?? 0) + bonusSea);
  }
  const tradeRouteBuildingBonusByCity = W.computeTradeRouteBuildingBonusByCity(routes);
  // ---- main.ts:31575 + :34525-34535 (reczny podatek) ----
  const capitalById = new Map(Object.entries(q.capital).map(([k, v]) => [Number(k), v]));
  const capitalCityIdForOwner = (ownerId) => {
    const explicit = capitalById.get(ownerId);
    if (explicit && cities.some((c) => c.id === explicit && c.ownerId === ownerId)) return explicit;
    return W.oldestCityOfOwner(ownerId, cities)?.id ?? null;
  };
  const pendingTax = new Map(Object.entries(q.tax).map(([k, v]) => [Number(k), v]));
  const manualWorkTaxByCity = new Map();
  for (const [ownerId, tax] of pendingTax) {
    const ownerCities = cities.filter((city) => city.ownerId === ownerId);
    if (ownerCities.length === 0 || tax <= 0) continue;
    const capitalId = capitalCityIdForOwner(ownerId);
    const target = ownerCities.find((city) => city.id === capitalId) ?? ownerCities[0];
    manualWorkTaxByCity.set(target.id, (manualWorkTaxByCity.get(target.id) ?? 0) + tax);
  }
  // ---- main.ts:3962 (cuda) ----
  const wonderMap = new Map();
  { const seen = new Set();
    for (const oid of cities.map((c) => c.ownerId)) {
      if (seen.has(oid)) continue; seen.add(oid);
      const bonus = W.sumWonderCityYieldsForOwner(wonderIdsOwnedBy(oid), eraOf(oid));
      if (W.hasAnyWonderCityYield(bonus)) wonderMap.set(oid, bonus);
    } }
  // ---- lask Mennicy (main.ts:5180-5253, :34537-34541) ----
  const hasNow = (o) => W.ownerHasZlotoStock(W.ownerResourceStockAll(cities, o)) || !!q.native[o];
  const grace = W.createMennicaZlotoGraceState();
  for (const [k, v] of Object.entries(q.grace.left)) grace.graceTurnsLeft.set(Number(k), v);
  for (const [k, v] of Object.entries(q.grace.had)) grace.hadAccessLastTurn.set(Number(k), v);
  const mapOwnerIds = [...new Set(cities.map((c) => c.ownerId))];
  const accessFn = W.prepareMennicaZlotoGraceForTick(grace, mapOwnerIds, hasNow);
  const memo = (f) => { const c = new Map(); return (o) => { let v = c.get(o); if (v === undefined) { v = f(o); c.set(o, v); } return v; }; };
  const zlotoR = memo(accessFn);
  const labelsR = memo((o) => { const set = new Set(q.labels[o] ?? []); if (hasNow(o)) set.add('Złoto'); return [...set]; });
  const stockR = memo((o) => W.ownerResourceStockAll(cities, o));
  // ---- main.ts:34413-34430: econUnits z zywych jednostek (migawka PRZED atrycja) ----
  const liveUnits = s.ef.live.map((u) => ({ ...u }));
  const cityAtUnit = (u) => cities.find((c) => c.ownerId === u.ownerId && c.q === u.q && c.r === u.r);
  const econUnits = liveUnits.map((u) => ({
    ownerId: u.ownerId, typeId: u.typeId, camping: !!u.camping, onOwnTerritory: !!u.onOwn,
    inGarnizon: u.inGarnizon === true, garrisonCityId: u.inGarnizon ? cityAtUnit(u)?.id : undefined,
  }));
  const calls = [];
  const healUnits = s.heal ? s.heal.units.map((u) => ({ ...u })) : null;
  const heal = s.heal ? { units: healUnits, getMaxHp: (t) => s.heal.maxHpByType[t], onUnitHpChanged: (id, hp, hpMax) => calls.push([id, enc(hp), enc(hpMax)]) } : undefined;
  globalThis.__ph = 0; globalThis.__inc = undefined;
  const res = W.advanceCityEconomy(
    cities, toWebMap(MAPS[s.mapIdx]), data, difficulty, econUnits, new Map(), builtByCity, s.playerEra, new Set(om.zbadane), ownerCiv, orderMap,
    eraOf, techOf, 'wysoki', tradeRouteBuildingBonusByCity, tradeIncomeByCity, new Map(), wonderMap,
    zlotoR, labelsR, stockR, defH, heal, defP, maritimeTradeIncomeByCity, manualWorkTaxByCity,
  );
  W.finalizeMennicaZlotoGraceAfterTick(grace, mapOwnerIds, hasNow);
  const food = runEmpireFoodBlock(s, cities, res, econUnits, liveUnits, builtByCity, ownerCiv, eraOf, data, difficulty, q.humans);
  // ---- bankowanie (main.ts:35045-35131), przepisane 1:1 (main.ts nie jest importowalny) ----
  const humans = q.humans;
  const isHuman = (o) => humans.includes(o);
  const banks = [];
  const sumOut = (e) => ({ pieniadz: enc(e.pieniadz), nauka: enc(e.nauka), doPuli: enc(e.doPuli), praca: enc(e.praca), kultura: enc(e.kultura), pieniadzZTras: enc(e.pieniadzZTras) });
  const bankOne = (oid, human) => {
    const e = human ? W.sumEconomyForPlayerCities(res, cities, oid) : W.sumEconomyForOwner(res, oid);
    const b = res.upkeepByOwner.get(oid);
    let applied = 0; let def = false;
    if (b && b.utrzymanieRazem > 0) { applied = b.utrzymanieRazem; def = !!b.deficyt; }
    const r = res.resourceUpkeepByOwner.get(oid);
    let ded = {};
    if (r && Object.keys(r).length > 0) { W.deductBuildingStockCostAcrossCities(cities, oid, r); ded = recEnc(r); }
    const bf = q.before[oid] ?? { sk: 0, na: 0 };
    let sk = bf.sk + e.pieniadz; if (b && b.utrzymanieRazem > 0) sk -= b.utrzymanieRazem;
    const na = human ? bf.na + e.nauka : bf.na + e.nauka + (q.aiBonus[oid] ?? 0);
    banks.push({ owner: oid, human, sum: sumOut(e), upkeepApplied: enc(applied), deficyt: def, resDeducted: ded, skarbPo: enc(sk), naukaPo: enc(na) });
  };
  for (const h of humans) bankOne(h, true);
  const aiIds = new Set();
  for (const c of cities) if (!isHuman(c.ownerId) && c.ownerId !== -1 && c.ownerId !== -99) aiIds.add(c.ownerId);
  for (const oid of aiIds) bankOne(oid, false);
  const num2 = (x) => (typeof x === 'number' ? enc(x) : x === undefined ? null : x);
  const tick = (t) => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, num2(v)]));
  return {
    perCity: res.perCity.map(tick),
    totals: { cities: enc(res.cities), praca: enc(res.totalPraca), pieniadz: enc(res.totalPieniadz), nauka: enc(res.totalNauka), luksus: enc(res.totalLuksus), kultura: enc(res.totalKultura), zywnosc: enc(res.totalZywnosc), pracaPula: enc(res.totalPracaPula), growth: enc(res.growth), starved: enc(res.starved) },
    income: Object.fromEntries(Object.entries(globalThis.__inc ?? {}).map(([k, v]) => [k, enc(v)])),
    upkeep: Object.fromEntries([...res.upkeepByOwner].map(([o, b]) => [o, { b: enc(b.utrzymanieBudynki), j: enc(b.utrzymanieJednostki), r: enc(b.utrzymanieRazem), s: enc(b.saldo), d: b.deficyt }])),
    resUp: mapOfRec(res.resourceUpkeepByOwner), resUpB: mapOfRec(res.resourceUpkeepBuildingsByOwner), resUpU: mapOfRec(res.resourceUpkeepUnitsByOwner),
    praca: Object.fromEntries([...res.pracaUpkeepByOwner].map(([o, v]) => [o, enc(v)])),
    after: cities.map((c) => ({
      id: c.id,
      wealthState: c.wealthState ? { poziom: enc(c.wealthState.poziom), pula: enc(c.wealthState.pula) } : null,
      immun: enc(c.wealthImmunityRemaining),
      food: c.magazynZywnosci === undefined ? null : typeof c.magazynZywnosci === 'number' ? enc(c.magazynZywnosci) : 'obj',
      manpower: enc(c.manpower),
      surowce: c.surowce === undefined ? null : recEnc(c.surowce),
      racja: enc(c.poziomRacji), migr: c.rationMigratedV114 === undefined ? null : c.rationMigratedV114, proc: enc(c.procentRozwoj),
      frac: enc(c.wzrostUlamkowy), tbd: enc(c.turyBezDoplaty), hunger: enc(c.hungerLossUlamkowy),
    })),
    heal: null,
    food,
    q6: {
      inputs: {
        tradeIncome: mapNum(tradeIncomeByCity), maritime: mapNum(maritimeTradeIncomeByCity), bonus: mapNum(tradeRouteBuildingBonusByCity), manualTax: mapNum(manualWorkTaxByCity),
        wonderMap: Object.fromEntries([...wonderMap].map(([o, b]) => [o, recEnc(b)])),
        wonderTrade: Object.fromEntries([...new Set([...mapOwnerIds, ...routes.flatMap((r) => [r.ownerId, r.toOwnerId])])].map((o) => [o, { lad: enc(wonderTradeFn(o, 'lad')), morze: enc(wonderTradeFn(o, 'morze')) }])),
        capital: Object.fromEntries(mapOwnerIds.map((o) => [o, capitalCityIdForOwner(o)])),
        incomeParams: { lad: tradeIncomeParams.dochodyLadowe.map(enc), morze: tradeIncomeParams.dochodyMorskie.map(enc) },
      },
      banks,
      graceAfter: { left: Object.fromEntries([...grace.graceTurnsLeft].map(([k, v]) => [k, enc(v)])), had: Object.fromEntries([...grace.hadAccessLastTurn].map(([k, v]) => [k, v])) },
    },
  };
}
for (const s of scenarios) s.out = runWeb(s);

const encUnit = (u) => Object.fromEntries(Object.entries(u).map(([k, v]) => [k, typeof v === 'number' ? enc(v) : v]));
const jsonCities = (s) => s.cities.map((c) => ({
  id: c.id, owner: c.owner, q: c.q, r: c.r, pop: enc(c.pop), built: c.built, surowce: c.surowce === null ? null : c.surowce, tryb: c.tryb ?? null, focus: c.focus ?? null,
  food: c.food === undefined ? { none: true } : typeof c.food === 'object' && c.food !== null ? { obj: Object.fromEntries(Object.entries(c.food).map(([k, v]) => [k, typeof v === 'number' ? enc(v) : v])) } : typeof c.food === 'number' ? { num: enc(c.food) } : { other: true },
  frac: c.frac === undefined ? null : enc(c.frac), racja: c.racja === undefined ? null : enc(c.racja), proc: c.proc === undefined ? null : enc(c.proc),
  wealth: c.wealth === undefined ? null : { poziom: enc(c.wealth.poziom), pula: enc(c.wealth.pula) }, immun: c.immun === undefined ? null : enc(c.immun),
  auto: c.auto === undefined ? null : c.auto, sOwner: c.sOwner === undefined ? null : c.sOwner, sCap: !!c.sCap, sMach: !!c.sMach,
  obl: !!c.obl, garn: c.garn === undefined ? null : enc(c.garn), mp: c.mp === undefined ? null : enc(c.mp),
  ph: c.ph ? { n: enc(c.ph.n), p: enc(c.ph.p), l: enc(c.ph.l), over: c.ph.over } : null, pp: c.pp ? { b: enc(c.pp.b), over: c.pp.over } : null,
}));
const outScenarios = scenarios.map((s) => ({
  name: s.name, cls: s.cls, mapIdx: s.mapIdx, difficulty: s.difficulty, playerEra: s.playerEra, cities: jsonCities(s),
  units: [],
  ef: { states: Object.fromEntries(Object.entries(s.ef.states).map(([o, st]) => [o, { z: enc(st.z), t: st.t === undefined ? null : enc(st.t) }])), typCity: s.ef.typCity, bySieger: s.ef.bySieger,
    live: s.ef.live.map((u) => ({ id: u.id, ownerId: u.ownerId, typeId: u.typeId, category: u.category, q: u.q, r: u.r, inGarnizon: u.inGarnizon, hp: u.hp === undefined ? null : enc(u.hp), hpMax: u.hpMax === undefined ? null : enc(u.hpMax), battles: u.battlesSurvived === undefined ? null : enc(u.battlesSurvived), oblega: u.oblegaCityId ?? null, camping: !!u.camping, onOwn: !!u.onOwn })) },
  heal: s.heal ? { units: s.heal.units.map(encUnit), maxHpByType: Object.fromEntries(Object.entries(s.heal.maxHpByType).map(([k, v]) => [k, enc(v)])) } : null,
  om: {
    civ: Object.fromEntries(Object.entries(s.om.civ).map(([k, v]) => [k, v === undefined ? null : v])), zbadane: s.om.zbadane,
    defH: Object.fromEntries(Object.entries(s.om.defH).map(([o, v]) => [o, { n: enc(v.n), p: enc(v.p), l: enc(v.l) }])),
    defP: Object.fromEntries(Object.entries(s.om.defP).map(([o, v]) => [o, enc(v)])),
  },
  order: Object.fromEntries(Object.entries(s.order).map(([id, m]) => [id, { prod: enc(m.prod), pien: enc(m.pien), nauka: enc(m.nauka), kult: enc(m.kult) }])),
  econ: s.econ ?? null,
  q6in: {
    routes: s.q6.routes, placed: s.q6.placed, era: Object.fromEntries(Object.entries(s.q6.era).map(([k, v]) => [k, enc(v)])), tech: s.q6.tech, native: s.q6.native, labels: s.q6.labels,
    grace: { left: Object.fromEntries(Object.entries(s.q6.grace.left).map(([k, v]) => [k, enc(v)])), had: s.q6.grace.had },
    tax: Object.fromEntries(Object.entries(s.q6.tax).map(([k, v]) => [k, enc(v)])), capital: s.q6.capital, humans: s.q6.humans,
    aiBonus: Object.fromEntries(Object.entries(s.q6.aiBonus).map(([k, v]) => [k, enc(v)])),
    before: Object.fromEntries(Object.entries(s.q6.before).map(([k, v]) => [k, { sk: enc(v.sk), na: enc(v.na) }])),
  },
  out: s.out,
}));
const mapsOut = MAPS.map((m) => ({ w: m.w, h: m.h, hexes: m.hexes, rivers: m.rivers }));
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'empirefood.json'), JSON.stringify({ pin: PIN, matrixPatch: MATRIX_PATCH, maps: mapsOut, scenarios: outScenarios }));
const classes = {};
for (const s of scenarios) classes[s.cls] = (classes[s.cls] ?? 0) + 1;
const F = (x) => x.out.food;
const stat = {
  scenarios: scenarios.length, classes,
  withHumans: scenarios.filter((s) => s.q6.humans.length > 0).length,
  withAnyAdjusted: scenarios.filter((s) => F(s).anyAdjusted).length,
  withPending: scenarios.filter((s) => F(s).pending !== null).length,
  withClamp: scenarios.filter((s) => F(s).clampedAny).length,
  withAtrycja: scenarios.filter((s) => F(s).efTicks.some((t) => t.atrycja)).length,
  withDamaged: scenarios.filter((s) => F(s).playerDamaged > 0 || F(s).destroyed.length > 0).length,
  withDestroyed: scenarios.filter((s) => F(s).destroyed.length > 0).length,
  withSiegeEnded: scenarios.filter((s) => F(s).ended.length > 0).length,
  withGarnSynced: scenarios.filter((s) => F(s).garnSynced.length > 0).length,
  withGlod: scenarios.filter((s) => F(s).efTicks.some((t) => t.glodWojska)).length,
  withCappedPop: scenarios.filter((s) => s.cities.some((c) => c.pop >= F(s).popCap[c.id])).length,
  efTicks: scenarios.reduce((a, s) => a + F(s).efTicks.length, 0),
};
console.log(JSON.stringify(stat));
