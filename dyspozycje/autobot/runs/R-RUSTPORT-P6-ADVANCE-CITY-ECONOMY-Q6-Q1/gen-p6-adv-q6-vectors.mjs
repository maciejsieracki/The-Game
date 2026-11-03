// Generator wektorow R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q6-Q1: WIAZANIE `advanceCityEconomy` z petla tury (pin weba 4bbef081d).
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
    contents: `export { advanceCityEconomy, buildEconParams, sumEconomyForOwner, sumEconomyForPlayerCities } from './turn-economy';\nexport { deductBuildingStockCostAcrossCities } from './building-stock-cost';\nexport { loadTradeRouteIncomeParams, computeTradeRouteIncomeByCityBreakdown, computeTradeRouteBuildingBonusByCity, computeSeaTradeRouteCountByCity, computeSeaTradeBonusIncomeByCity } from './trade-routes';\nexport { sumWonderCityYieldsForOwner, hasAnyWonderCityYield, sumWonderTradeRouteBonusForOwner } from './wonders-data';\nexport { prepareMennicaZlotoGraceForTick, finalizeMennicaZlotoGraceAfterTick, createMennicaZlotoGraceState } from './mennica-zloto-grace';\nexport { oldestCityOfOwner } from './capital-capture';\nexport { loadGameData } from '../data/loader';\nexport { ownerResourceStockAll } from './building-stock-cost';\nexport { ownerHasZlotoStock } from './zloto-access';`,
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

function mk(name, cls, count, opts = {}) {
  const mapIdx = ri(0, 5);
  const cs = genCities(mapIdx, count, rnd() < 0.6);
  renameCityIds(cs);
  if (opts.barb && cs.length < 7) {
    const m = MAPS[mapIdx]; let q; let r; let t = 0;
    do { q = ri(0, m.w - 1); r = ri(0, m.h - 1); t++; } while (cs.some((c) => c.q === q && c.r === r) && t < 30);
    if (!cs.some((c) => c.q === q && c.r === r)) cs.push({ id: 'barb' + ri(0, 9), owner: -1, q, r, pop: pick([1, 2, 3]) });
    const ids = new Set(); cs.forEach((c) => { while (ids.has(c.id)) c.id += 'x'; ids.add(c.id); });
  }
  const sc = finishScenario(name, cls, mapIdx, cs, { difficulty: pick(['easy', 'normal', 'hard']) });
  return buildQ6(sc, opts.heal);
}
for (let i = 0; i < 90; i++) scenarios.push(mk(`wire-${i}`, 'wire', ri(1, 6)));
for (let i = 0; i < 50; i++) scenarios.push(mk(`wire-route-${i}`, 'wire-route', ri(3, 7)));
for (let i = 0; i < 30; i++) scenarios.push(mk(`wire-heal-${i}`, 'wire-heal', ri(1, 4), { heal: true }));
for (let i = 0; i < 25; i++) scenarios.push(mk(`wire-barb-${i}`, 'wire-barb', ri(1, 4), { barb: true }));
for (let i = 0; i < 60; i++) {
  const sc = mk(`wire-mennica-${i}`, 'wire-mennica', ri(1, 4));
  const seen = new Set();
  for (const c of sc.cities) {
    c.built = [...new Set(Array.from({ length: ri(1, 5) }, () => pick(['cegielnia', 'garncarnia', 'stolarnia', 'kamieniarski', 'spichlerz', 'sad', 'targowisko', 'kuznia', 'magazyn'])))];
    if (rnd() < 0.85 && !seen.has(c.owner)) { c.built.push('mennica'); seen.add(c.owner); }
    c.surowce = rnd() < 0.9 ? Object.fromEntries(['zloto', 'glina', 'drewno', 'ruda', 'kamien'].filter((k) => k === 'zloto' ? rnd() < 0.8 : rnd() < 0.5).map((k) => [k, k === 'zloto' ? pick([0, 1, 1, 1, 2, 0.5, 5]) : pick([0, 3, 50, 120])])) : null;
  }
  scenarios.push(sc);
}
for (let i = 0; i < 40; i++) {
  const sc = mk(`wire-econ-${i}`, 'wire-econ', ri(2, 5));
  const econ = structuredClone(DATA.econParams);
  const d = sc.difficulty;
  const how = i % 8;
  if (how === 0) econ.handel_szlaki.dochody_ladowe[d] = [3, 1, 4, 1, 5, 9, 2, 6];
  else if (how === 1) econ.handel_szlaki.dochody_morskie[d] = [7];
  else if (how === 2) econ.handel_szlaki.dochody_ladowe[d] = [];
  else if (how === 3) econ.handel_szlaki.dochody_morskie[d] = [2, 'x', 4];
  else if (how === 4) econ.handel_szlaki = null;
  else if (how === 5) delete econ.handel_szlaki.dochody_ladowe;
  else if (how === 6) { econ.handel_szlaki.dochody_ladowe[d] = [0.5, 1.5, 2.25, 3.75]; econ.handel_szlaki.dochody_morskie[d] = [1, 2.5, 3]; }
  else econ.handel_szlaki = {};
  sc.econ = econ;
  scenarios.push(sc);
}

// ---- uruchomienie weba ---------------------------------------------------------------------------------------------
const recEnc = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, enc(v)]));
const mapOfRec = (m) => Object.fromEntries([...m].map(([o, r]) => [o, recEnc(r)]));
const mapNum = (m) => Object.fromEntries([...m].map(([k, v]) => [k, enc(v)]));

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
    if (c.obl) o.oblegane = true;
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
  const econUnits = (s.units ?? []).map((u) => ({ ownerId: u.owner, typeId: u.typeId, camping: false }));
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
    })),
    heal: s.heal ? { units: healUnits.map((u) => ({ id: u.id, hp: enc(u.hp), hpMax: enc(u.hpMax) })), calls } : null,
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
  obl: !!c.obl, garn: c.garn === undefined ? null : enc(c.garn), mp: c.mp === undefined ? null : enc(c.mp),
  ph: c.ph ? { n: enc(c.ph.n), p: enc(c.ph.p), l: enc(c.ph.l), over: c.ph.over } : null, pp: c.pp ? { b: enc(c.pp.b), over: c.pp.over } : null,
}));
const outScenarios = scenarios.map((s) => ({
  name: s.name, cls: s.cls, mapIdx: s.mapIdx, difficulty: s.difficulty, playerEra: s.playerEra, cities: jsonCities(s),
  units: s.units ?? [],
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
writeFileSync(join(outDir, 'q6.json'), JSON.stringify({ pin: PIN, matrixPatch: MATRIX_PATCH, maps: mapsOut, scenarios: outScenarios }));
const classes = {};
for (const s of scenarios) classes[s.cls] = (classes[s.cls] ?? 0) + 1;
const stat = {
  scenarios: scenarios.length, classes,
  withRoutes: scenarios.filter((s) => s.q6.routes.some((r) => r.status === 'polaczony')).length,
  withSea: scenarios.filter((s) => s.q6.routes.some((r) => r.status === 'polaczony' && r.medium === 'morze')).length,
  withWonderMap: scenarios.filter((s) => Object.keys(s.out.q6.inputs.wonderMap).length > 0).length,
  withManualTax: scenarios.filter((s) => Object.keys(s.out.q6.inputs.manualTax).length > 0).length,
  withDeficit: scenarios.filter((s) => s.out.q6.banks.some((b) => b.deficyt)).length,
  withResDeduct: scenarios.filter((s) => s.out.q6.banks.some((b) => Object.keys(b.resDeducted).length > 0)).length,
  graceChanged: scenarios.filter((s) => JSON.stringify(s.out.q6.graceAfter.left) !== JSON.stringify(Object.fromEntries(Object.entries(s.q6.grace.left).map(([k, v]) => [k, enc(v)])))).length,
};
console.log(JSON.stringify(stat));
