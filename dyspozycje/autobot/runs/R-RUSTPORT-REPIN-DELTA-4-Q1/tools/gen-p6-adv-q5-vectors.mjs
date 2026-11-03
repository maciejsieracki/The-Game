// Generator wektorow R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q5-Q1 (cala funkcja `advanceCityEconomy`: petla miast + P23 utrzymanie
// per owner + P24 leczenie + domkniecie Z-Q4-3 / resolvery zywe-memoizowane). PIN weba: 23dd158e9.
// Uruchamiany jest PRAWDZIWY `advanceCityEconomy` (gra/src/game/turn-economy.ts) na prawdziwej mapie i prawdziwym
// `loadGameData()`. Instrumentacja W PAMIECI (plugin esbuild; pliki na dysku nietkniete):
//   * przed drenazem Mennicy (:2823): zrzut `incomeByOwner`,
//   * znaczniki fazy `globalThis.__ph`: 0 = przed `tickEmpireResourcePipeline` (liczniki :2373-2402), 1 = pipeline + petla miast,
//     2 = po reconcile capow (drenaz i reconcile za nami) - sluza do pomiaru, KIEDY wolane jest pierwszy raz kazdy resolver.
// `civ-matrix.json` jest NADPISANY w pamieci (MATRIX_PATCH; patch zapisany w wektorze, ta sama podmiana w tescie Rust).
// Wyniki: WSZYSTKIE pola `EconomyTickResult` (perCity, sumy, growth, starved, upkeepByOwner, resourceUpkeep*ByOwner,
// pracaUpkeepByOwner), stan miast po ticku, leczenie jednostek (wywolania onUnitHpChanged, hp/hpMax, pule).
// Klasa `live`: resolvery jak w main.ts:5210-5253 (ZYWE: czytaja City.surowce; MEMOIZOWANE per owner) - rejestrowana jest
// faza pierwszego wolania i wartosc, a po ticku wartosc "po drenazu" (kontrfaktyczna).
// Zrodla z czystego `git archive 23dd158e9 gra/src gra/data` do <WORK_DIR> poza repo (zero buildu/dev w gra/).
//
// Uruchomienie: node gen-p6-adv-q5-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>
// Wyjscie deterministyczne (PRNG mulberry32). Kodowanie liczb: jak p6_7b_vectors/common.rs.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoRoot, workDir, esbuildMain, outDir] = process.argv.slice(2);
if (!repoRoot || !workDir || !esbuildMain || !outDir) throw new Error('uzycie: <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>');
const PIN = execFileSync('git', ['-C', repoRoot, 'rev-parse', '23dd158e9'], { encoding: 'utf8' }).trim();
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
    contents: `export { advanceCityEconomy } from './turn-economy';\nexport { loadGameData } from '../data/loader';\nexport { ownerResourceStockAll } from './building-stock-cost';\nexport { ownerHasZlotoStock } from './zloto-access';`,
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


const scenarios = [];
for (let i = 0; i < 80; i++) { const mapIdx = ri(0, 5); scenarios.push(finishScenario(`plain-${i}`, 'plain', mapIdx, genCities(mapIdx, ri(1, 5), rnd() < 0.6))); }
for (let i = 0; i < 100; i++) { const mapIdx = ri(0, 5); scenarios.push(finishScenario(`rich-${i}`, 'rich', mapIdx, genCities(mapIdx, ri(1, 6), rnd() < 0.6))); }
// bramka runtime (statyczne resolvery etykiet / zapasu): budynki zlozowe spia bez surowca w magazynie panstwa
for (let i = 0; i < 50; i++) {
  const mapIdx = ri(0, 5);
  const cs = genCities(mapIdx, ri(1, 4), rnd() < 0.6);
  for (const c of cs) c.built = [...new Set(Array.from({ length: ri(1, 7) }, () => pick(['cegielnia', 'garncarnia', 'stolarnia', 'kamieniarski', 'mennica', 'spichlerz', 'spichlerz_ii', 'sad', 'biblioteka', 'port', 'targowisko', 'kuznia', 'odlewnia_brazu'])))];
  const sc = finishScenario(`gate-${i}`, 'gate', mapIdx, cs);
  const owners = [...new Set(cs.map((c) => c.owner))];
  const SKEYS = ['glina', 'sol', 'drewno', 'kamien', 'ruda', 'zloto', 'ceramika', 'cegla'];
  sc.om.gate = {
    labels: Object.fromEntries(owners.map((o) => [o, ['Glina', 'Drewno', 'Kamień', 'Ruda', 'Sól', 'Złoto'].filter(() => rnd() < 0.5)])),
    stock: Object.fromEntries(owners.map((o) => [o, Object.fromEntries(SKEYS.filter(() => rnd() < 0.6).map((k) => [k, pick([0, 1, 3, 50])]))])),
  };
  scenarios.push(sc);
}

// wariacje econ-params: grupy/wiersze usuniete lub nie-liczbowe (sciezka fallback w load_econ_params / load_wealth_params)
const ECON_VARIANTS = [];
{
  const em = Object.keys(DATA.econParams.ekonomia_miasta); const bu = Object.keys(DATA.econParams.budynki); const gl = Object.keys(DATA.econParams.globalne);
  const wl = Object.keys(DATA.econParams.wealth);
  for (let i = 0; i < 40; i++) {
    const v = { em: [], bu: [], gl: [], wl: [] };
    const addTo = (arr, keys) => { for (const k of keys) if (rnd() < 0.08) arr.push([k, pick(['del', 'str', 'null', 'nan', 'arr', 'num'])]); };
    addTo(v.em, em); addTo(v.bu, bu); addTo(v.gl, gl); addTo(v.wl, wl);
    if (rnd() < 0.1) v.dropGroup = pick(['ekonomia_miasta', 'budynki', 'globalne', 'wealth']);
    ECON_VARIANTS.push(v);
  }
}
function econFor(v) {
  const econ = structuredClone(DATA.econParams);
  const apply = (group, items) => {
    for (const [k, how] of items) {
      if (!econ[group]) continue;
      if (how === 'del') delete econ[group][k];
      else if (how === 'str') econ[group][k] = 'x';
      else if (how === 'null') econ[group][k] = null;
      else if (how === 'arr') econ[group][k] = [1, 2];
      else if (how === 'nan') { const d = pick(['easy', 'normal', 'hard']); if (econ[group][k] && typeof econ[group][k] === 'object') econ[group][k] = { ...econ[group][k], [d]: 'NaN' }; }
      else if (how === 'num') { const d = pick(['easy', 'normal', 'hard']); const x = pick([0, 5, 150, -7.5, 0.3]); if (econ[group][k] && typeof econ[group][k] === 'object') econ[group][k] = { ...econ[group][k], [d]: x }; }
    }
  };
  apply('ekonomia_miasta', v.em); apply('budynki', v.bu); apply('globalne', v.gl); apply('wealth', v.wl);
  if (v.dropGroup) delete econ[v.dropGroup];
  return econ;
}
for (let i = 0; i < ECON_VARIANTS.length; i++) {
  const mapIdx = ri(0, 5);
  const sc = finishScenario(`econ-${i}`, 'econ', mapIdx, genCities(mapIdx, ri(1, 4), rnd() < 0.6));
  sc.econ = econFor(ECON_VARIANTS[i]);
  scenarios.push(sc);
}


// ---- klasy Q5: jednostki (utrzymanie), pelny katalog budynkow (poziomy wg ery/techu), leczenie, resolvery zywe ------------
const UNIT_TYPES = JSON.parse(readFileSync(join(workDir, 'gra/data/units.json'), 'utf8')).map((u) => u.Jednostka);
const genUnits = (owners, n) => Array.from({ length: n }, () => ({ owner: rnd() < 0.1 ? 7 : pick(owners), typeId: rnd() < 0.1 ? pick(['nieznana', '', 'wojownik']) : pick(UNIT_TYPES) }));
// podzbior scenariuszy bazowych dostaje jednostki (klasa plain zostaje bez jednostek)
for (const s of scenarios) {
  if (s.cls === 'plain') { s.units = []; continue; }
  const owners = [...new Set(s.cities.map((c) => c.owner))];
  s.units = rnd() < 0.5 ? genUnits(owners, ri(0, 7)) : [];
}
for (let i = 0; i < 120; i++) {
  const mapIdx = ri(0, 5);
  const cs = genCities(mapIdx, ri(1, 4), rnd() < 0.6);
  const sc = finishScenario(`units-${i}`, 'units', mapIdx, cs);
  const owners = [...new Set(cs.map((c) => c.owner))];
  sc.units = genUnits(owners, ri(1, 12));
  scenarios.push(sc);
}
const ALL_B = [...BUILDING_IDS, 'nieznany_budynek', 'x'];
for (let i = 0; i < 60; i++) {
  const mapIdx = ri(0, 5);
  const cs = genCities(mapIdx, ri(1, 4), rnd() < 0.6);
  for (const c of cs) {
    c.built = Array.from({ length: ri(6, 24) }, () => pick(ALL_B));
    if (rnd() < 0.3) c.built.push(pick(c.built)); // duplikat id
  }
  const sc = finishScenario(`tail-${i}`, 'tail', mapIdx, cs);
  const owners = [...new Set(cs.map((c) => c.owner))];
  sc.units = rnd() < 0.5 ? genUnits(owners, ri(0, 6)) : [];
  scenarios.push(sc);
}
const HEAL_TYPES = ['Legionista', 'Lucznik', 'Rycerz', 'Katapulta', 'Falanga', 'Zwiadowca', 'Osadnik', 'Robotnik'];
const HEAL_CATS = ['piechota', 'lucznik', 'kawaleria', 'machina', 'osadnik', 'robotnik', 'zwiadowca'];
for (let i = 0; i < 80; i++) {
  const mapIdx = ri(0, 5);
  const cs = genCities(mapIdx, ri(1, 4), rnd() < 0.6);
  for (const c of cs) { c.mp = rnd() < 0.85 ? pick([0, 5, 30, 200, 1000, 100000, 7.8]) : undefined; }
  const sc = finishScenario(`heal-${i}`, 'heal', mapIdx, cs, { difficulty: pick(['easy', 'normal', 'hard']) });
  const owners = [...new Set(cs.map((c) => c.owner))];
  const hu = [];
  const nU = ri(0, 8);
  for (let u = 0; u < nU; u++) {
    const typeId = pick(HEAL_TYPES);
    const home = pick(cs);
    const un = { id: 'u' + u + pick(['', 'x', '9']), ownerId: rnd() < 0.8 ? home.owner : pick(owners), typeId, category: rnd() < 0.7 ? pick(HEAL_CATS) : (typeId === 'Zwiadowca' ? 'zwiadowca' : 'piechota') };
    if (rnd() < 0.85) un.hp = rnd() < 0.6 ? ri(1, 70) : pick([ri(0, 120), 0, 1, 0.5, NaN, Infinity, -5, 500]);
    if (rnd() < 0.6) un.hpMax = pick([100, 50, 120, 0, -1, NaN, 80.5]);
    if (rnd() < 0.3) un.parametryBonusProc = ri(0, 30);
    if (rnd() < 0.3) un.battlesSurvived = ri(0, 5);
    if (rnd() < 0.85) { un.q = rnd() < 0.6 ? home.q : ri(0, 6); un.r = rnd() < 0.6 ? home.r : ri(0, 6); }
    if (rnd() < 0.2) un.inGarnizon = rnd() < 0.5;
    hu.push(un);
  }
  sc.heal = { units: hu, maxHpByType: Object.fromEntries(HEAL_TYPES.map((t) => [t, pick([100, 100, 100, 120, 60, 80.5, 100, 0, -5, NaN, Infinity])])) };
  sc.units = rnd() < 0.5 ? genUnits(owners, ri(0, 5)) : [];
  scenarios.push(sc);
}
// resolvery ZYWE + MEMOIZOWANE jak main.ts:5210-5253: Mennica z zapasem zlota dokladnie na granicy drenazu (1 szt.)
for (let i = 0; i < 90; i++) {
  const mapIdx = ri(0, 5);
  const cs = genCities(mapIdx, ri(1, 4), true);
  const owners = [...new Set(cs.map((c) => c.owner))];
  const mennicaOwner = Object.fromEntries(owners.map((o) => [o, rnd() < 0.85]));
  const seen = new Set();
  for (const c of cs) {
    c.built = [...new Set(Array.from({ length: ri(1, 6) }, () => pick(['cegielnia', 'garncarnia', 'stolarnia', 'kamieniarski', 'spichlerz', 'sad', 'targowisko', 'kuznia', 'odlewnia_brazu', 'magazyn'])))];
    if (mennicaOwner[c.owner] && !seen.has(c.owner)) { c.built.push('mennica'); seen.add(c.owner); }
    c.surowce = rnd() < 0.9 ? Object.fromEntries(['zloto', 'glina', 'drewno', 'ruda', 'kamien'].filter((k, j) => k === 'zloto' ? rnd() < 0.8 : rnd() < 0.5).map((k) => [k, k === 'zloto' ? pick([0, 1, 1, 1, 2, 0.5, 5]) : pick([0, 3, 50, 120])])) : null;
  }
  const sc = finishScenario(`live-${i}`, 'live', mapIdx, cs, { ownerMaps: { civ: Object.fromEntries(owners.map((o) => [o, pick(CIVS)])), zloto: {}, tech: null, zbadane: ['Waluta'], era: null, wonder: {}, defH: {}, defP: {} } });
  sc.units = rnd() < 0.4 ? genUnits(owners, ri(0, 4)) : [];
  sc.live = {
    labelsDefined: rnd() < 0.85,
    nat: Object.fromEntries(owners.map((o) => [o, rnd() < 0.15])),
    grace: Object.fromEntries(owners.map((o) => [o, rnd() < 0.1])),
    labels: Object.fromEntries(owners.map((o) => [o, ['Glina', 'Drewno', 'Kamień', 'Ruda', 'Sól'].filter(() => rnd() < 0.6)])),
  };
  scenarios.push(sc);
}

// ---- klasa `altdata`: SYNTETYCZNE tabele `units` i katalog `buildings` (galezie nieosiagalne na danych pinu) -------------
// Tabele jednostek sa ZREDUKOWANE do kolumn czytanych przez tick (Jednostka, Epoka, Utrzymanie*); web uzywa `data.units`
// w ticku tylko przez buildUnitUpkeepTable i find(Jednostka===typeId). Kolejnosc kluczy wiersza jest istotna.
const ALT_NAMES = UNIT_TYPES.slice(0, 30);
function altUnitTable() {
  const rows = [];
  const mk = (nm) => {
    const r = {};
    if (rnd() < 0.15) r['Utrzymanie X'] = pick([3, 'x', null, 0]);
    r.Jednostka = nm;
    const e = rnd();
    if (e < 0.35) r.Epoka = pick([1, 2, 3, 2.5, 0.5, 4, 7, 0]);
    else if (e < 0.85) r.Epoka = pick(['Kamień', 'Brąz', 'Żelazo', 'Zelazo', ' brąz ', 'Epoka 2', '3', '1.5', '2', 'iron', 'STAL', 'x', '']);
    else if (e < 0.92) r.Epoka = null;
    const m = rnd();
    if (m < 0.7) r['Utrzymanie (Pieniądz/turę)'] = pick([0, 1, 2, 3, 5, 2.5, 0.3]);
    else if (m < 0.85) r['Utrzymanie (Pieniądz/turę)'] = pick(['x', null]);
    const sr = rnd();
    if (sr < 0.5) r['Utrzymanie surowiec'] = pick(['Drewno', 'Brąz', 'Żelazo', ' Drewno ', 'Kamień', 'ŻELAZO']);
    else if (sr < 0.65) r['Utrzymanie surowiec'] = pick([5, 12.5, 0]);
    else if (sr < 0.8) r['Utrzymanie surowiec'] = pick([null, '-', '', '   ']);
    const il = rnd();
    if (il < 0.7) r['Utrzymanie surowiec (ilość)'] = pick([1, 2, 3, 5, 4.5, 0, -2, 7]);
    else if (il < 0.8) r['Utrzymanie surowiec (ilość)'] = pick(['x', null]);
    return r;
  };
  for (const nm of ALT_NAMES) rows.push(mk(nm));
  for (let i = 0; i < 4; i++) rows.push(mk(pick(ALT_NAMES))); // duplikaty nazw: find() = pierwszy, tabela = ostatni
  rows.push({ Jednostka: 5, 'Utrzymanie (Pieniądz/turę)': 4 });
  rows.push({ Jednostka: '', 'Utrzymanie (Pieniądz/turę)': 4 });
  return rows;
}
const UNIT_TABLES = Array.from({ length: 6 }, () => altUnitTable());
const RAW_BUILDINGS = JSON.parse(readFileSync(join(workDir, 'gra/data/buildings.json'), 'utf8'));
function altCatalog(kind) {
  const cat = structuredClone(RAW_BUILDINGS);
  const byId = (id) => cat.find((b) => b.id === id);
  if (kind === 0) {
    const bib = byId('biblioteka');
    bib.maksPoziom = 8;
    bib.poziomTechGate = { 6: 'Astronomia', 3: 'Pismo' };
    for (const b of cat) if (rnd() < 0.3) { b.utrzymanie = ri(0, 6); b.przyrostUtrzymania = pick([0, 1, 2, -1]); }
  } else if (kind === 1) {
    const sad = structuredClone(byId('sad')); sad.utrzymanie = 9; sad.przyrostUtrzymania = 3; cat.push(sad);
    const tg = structuredClone(byId('targowisko')); tg.epokaWejscia = 3; tg.utrzymanie = 5; cat.push(tg);
    const bib = byId('biblioteka'); bib.poziomTechGate = { 2: 'Pismo' };
  } else {
    for (const b of cat) {
      if (rnd() < 0.4) b.epokaWejscia = pick([1, 2, 3, 4, 5]);
      if (rnd() < 0.4) b.maksPoziom = pick([1, 2, 3, 4, 6]);
      if (rnd() < 0.5) b.koszt_surowce = { drewno: pick([0, 3, null]), kamien: pick([5, 0, null]), cegla: pick([-1, 2, null]) };
      if (rnd() < 0.3) b.koszt_surowce = null;
    }
  }
  return cat;
}
const BLD_CATS = [altCatalog(0), altCatalog(1), altCatalog(2), altCatalog(2)];
for (let i = 0; i < 60; i++) {
  const mapIdx = ri(0, 5);
  const cs = genCities(mapIdx, ri(1, 4), rnd() < 0.6);
  const useUnits = i % 2 === 0;
  const gateCase = !useUnits && i < 40; // katalogi z bramka techu na poziomie budynku + wysoka epoka + brak techu
  const catIdx = useUnits ? undefined : gateCase ? (i >> 1) % 2 : ri(0, BLD_CATS.length - 1);
  const ids = (catIdx === undefined ? RAW_BUILDINGS : BLD_CATS[catIdx]).map((b) => b.id);
  for (const c of cs) { c.built = Array.from({ length: ri(3, 18) }, () => pick(ids)); if (gateCase && rnd() < 0.8) c.built.push('biblioteka'); }
  const sc = finishScenario(`altdata-${i}`, 'altdata', mapIdx, cs);
  const owners = [...new Set(cs.map((c) => c.owner))];
  if (gateCase) {
    sc.om.era = Object.fromEntries(owners.map((o) => [o, pick([3, 5, 7, 9, 11])]));
    if (((i >> 2) & 1) === 0) { sc.om.tech = null; sc.om.zbadane = TECHS.filter(() => rnd() < 0.5); } // bez resolvera techu: zbior gracza
    else sc.om.tech = Object.fromEntries(owners.map((o) => [o, TECHS.filter(() => rnd() < 0.4)]));
  }
  if (useUnits) {
    sc.unitTable = ri(0, UNIT_TABLES.length - 1);
    sc.units = Array.from({ length: ri(1, 12) }, () => ({ owner: rnd() < 0.1 ? 7 : pick(owners), typeId: rnd() < 0.1 ? pick(['nieznana', '']) : pick([...ALT_NAMES, ...UNIT_TYPES.slice(30, 34)]) }));
  } else {
    sc.bldCat = catIdx;
    sc.units = rnd() < 0.5 ? genUnits(owners, ri(0, 5)) : [];
  }
  scenarios.push(sc);
}

// ---- uruchomienie weba ---------------------------------------------------------------------------------------------
function makeLive(s, citiesWeb) {
  const lv = { val: { zloto: {}, labels: {}, stock: {} }, first: { zloto: {}, labels: {}, stock: {} } };
  const { nat, grace, labels } = s.live;
  const hasNow = (o) => W.ownerHasZlotoStock(W.ownerResourceStockAll(citiesWeb, o)) || !!nat[o];
  const memo = (kind, f) => {
    const c = new Map();
    return (o) => {
      if (!c.has(o)) { const v = f(o); c.set(o, v); lv.first[kind][o] = globalThis.__ph; lv.val[kind][o] = v; }
      return c.get(o);
    };
  };
  return {
    lv, hasNow,
    zloto: memo('zloto', (o) => hasNow(o) || !!grace[o]),
    labels: memo('labels', (o) => { const set = new Set(labels[o] ?? []); if (hasNow(o)) set.add('Złoto'); return [...set]; }),
    stock: memo('stock', (o) => W.ownerResourceStockAll(citiesWeb, o)),
  };
}
const recEnc = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, enc(v)]));
const mapOfRec = (m) => Object.fromEntries([...m].map(([o, r]) => [o, recEnc(r)]));

function runWeb(s) {
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
  const eraMap = om.era;
  const resolveOwnerEra = eraMap ? (o) => eraMap[o] : undefined;
  const techMap = om.tech;
  const resolveOwnerTech = techMap ? (o) => new Set(techMap[o] ?? []) : undefined;
  const ownerCiv = new Map(Object.entries(om.civ).filter(([, v]) => v !== undefined).map(([k, v]) => [Number(k), v]));
  const orderMap = new Map(Object.entries(s.order).map(([id, m]) => [id, { productionMult: m.prod, pieniadzMult: m.pien, naukaMult: m.nauka, kulturaMult: m.kult }]));
  const wonder = new Map(Object.entries(om.wonder).map(([o, b]) => [Number(o), Object.fromEntries(Object.entries(b).filter(([, v]) => v !== undefined))]));
  const defH = new Map(Object.entries(om.defH).map(([o, v]) => [Number(o), { procentNauka: v.n, procentPieniadz: v.p, procentLuksus: v.l }]));
  const defP = new Map(Object.entries(om.defP).map(([o, v]) => [Number(o), { procentBudynki: v }]));
  const data = { ...DATA, ...(s.econ ? { econParams: s.econ } : {}), ...(s.unitTable !== undefined ? { units: UNIT_TABLES[s.unitTable] } : {}), ...(s.bldCat !== undefined ? { buildings: BLD_CATS[s.bldCat] } : {}) };
  let zlotoR = (o) => om.zloto[o] ?? true;
  let labelsR = om.gate ? (o) => om.gate.labels[o] ?? [] : undefined;
  let stockR = om.gate ? (o) => om.gate.stock[o] : undefined;
  let live = null;
  if (s.live) { live = makeLive(s, cities); zlotoR = live.zloto; labelsR = s.live.labelsDefined ? live.labels : undefined; stockR = live.stock; }
  const econUnits = (s.units ?? []).map((u) => ({ ownerId: u.owner, typeId: u.typeId, camping: false }));
  const calls = [];
  const healUnits = s.heal ? s.heal.units.map((u) => ({ ...u })) : null;
  const heal = s.heal ? { units: healUnits, getMaxHp: (t) => s.heal.maxHpByType[t], onUnitHpChanged: (id, hp, hpMax) => calls.push([id, enc(hp), enc(hpMax)]) } : undefined;
  globalThis.__ph = 0; globalThis.__inc = undefined;
  const res = W.advanceCityEconomy(
    cities, toWebMap(MAPS[s.mapIdx]), data, s.difficulty, econUnits, new Map(), builtByCity, s.playerEra, new Set(om.zbadane), ownerCiv, orderMap,
    resolveOwnerEra, resolveOwnerTech, 'wysoki', new Map(Object.entries(s.tbonus)), new Map(Object.entries(s.tinc)), new Map(), wonder,
    zlotoR, labelsR, stockR, defH, heal, defP, new Map(Object.entries(s.marit)), new Map(Object.entries(s.mtax)),
  );
  const num2 = (x) => (typeof x === 'number' ? enc(x) : x === undefined ? null : x);
  const tick = (t) => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, num2(v)]));
  const out = {
    perCity: res.perCity.map(tick),
    totals: { cities: enc(res.cities), praca: enc(res.totalPraca), pieniadz: enc(res.totalPieniadz), nauka: enc(res.totalNauka), luksus: enc(res.totalLuksus), kultura: enc(res.totalKultura), zywnosc: enc(res.totalZywnosc), pracaPula: enc(res.totalPracaPula), growth: enc(res.growth), starved: enc(res.starved) },
    income: Object.fromEntries(Object.entries(globalThis.__inc ?? {}).map(([k, v]) => [k, enc(v)])),
    upkeep: Object.fromEntries([...res.upkeepByOwner].map(([o, b]) => [o, { b: enc(b.utrzymanieBudynki), j: enc(b.utrzymanieJednostki), r: enc(b.utrzymanieRazem), s: enc(b.saldo), d: b.deficyt }])),
    resUp: mapOfRec(res.resourceUpkeepByOwner),
    resUpB: mapOfRec(res.resourceUpkeepBuildingsByOwner),
    resUpU: mapOfRec(res.resourceUpkeepUnitsByOwner),
    praca: Object.fromEntries([...res.pracaUpkeepByOwner].map(([o, v]) => [o, enc(v)])),
    after: cities.map((c) => ({
      id: c.id,
      wealthState: c.wealthState ? { poziom: enc(c.wealthState.poziom), pula: enc(c.wealthState.pula) } : null,
      immun: enc(c.wealthImmunityRemaining),
      food: c.magazynZywnosci === undefined ? null : typeof c.magazynZywnosci === 'number' ? enc(c.magazynZywnosci) : 'obj',
      manpower: enc(c.manpower),
    })),
    heal: s.heal ? { units: healUnits.map((u) => ({ id: u.id, hp: enc(u.hp), hpMax: enc(u.hpMax) })), calls } : null,
  };
  if (live) {
    const owners = [...new Set(cities.map((c) => c.ownerId))];
    out.live = {
      val: { zloto: live.lv.val.zloto, labels: live.lv.val.labels, stock: Object.fromEntries(Object.entries(live.lv.val.stock).map(([o, r]) => [o, recEnc(r)])) },
      first: live.lv.first,
      post: { zloto: Object.fromEntries(owners.map((o) => [o, live.hasNow(o) || !!s.live.grace[o]])) },
    };
  }
  return out;
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
  unitTable: s.unitTable ?? null, bldCat: s.bldCat ?? null,
  heal: s.heal ? { units: s.heal.units.map(encUnit), maxHpByType: Object.fromEntries(Object.entries(s.heal.maxHpByType).map(([k, v]) => [k, enc(v)])) } : null,
  live: s.live ? { labelsDefined: s.live.labelsDefined } : null,
  om: {
    gate: s.om.gate ?? null,
    civ: Object.fromEntries(Object.entries(s.om.civ).map(([k, v]) => [k, v === undefined ? null : v])), zloto: s.om.zloto, tech: s.om.tech, zbadane: s.om.zbadane, era: s.om.era,
    wonder: Object.fromEntries(Object.entries(s.om.wonder).map(([o, b]) => [o, Object.fromEntries(Object.entries(b).filter(([, v]) => v !== undefined).map(([k, v]) => [k, enc(v)]))])),
    defH: Object.fromEntries(Object.entries(s.om.defH).map(([o, v]) => [o, { n: enc(v.n), p: enc(v.p), l: enc(v.l) }])),
    defP: Object.fromEntries(Object.entries(s.om.defP).map(([o, v]) => [o, enc(v)])),
  },
  order: Object.fromEntries(Object.entries(s.order).map(([id, m]) => [id, { prod: enc(m.prod), pien: enc(m.pien), nauka: enc(m.nauka), kult: enc(m.kult) }])),
  tbonus: Object.fromEntries(Object.entries(s.tbonus).map(([k, v]) => [k, enc(v)])), tinc: Object.fromEntries(Object.entries(s.tinc).map(([k, v]) => [k, enc(v)])),
  marit: Object.fromEntries(Object.entries(s.marit).map(([k, v]) => [k, enc(v)])), mtax: Object.fromEntries(Object.entries(s.mtax).map(([k, v]) => [k, enc(v)])),
  econ: s.econ, out: s.out,
}));
const mapsOut = MAPS.map((m) => ({ w: m.w, h: m.h, hexes: m.hexes, rivers: m.rivers }));
mkdirSync(outDir, { recursive: true });
// tabele jednostek jako OSOBNE pliki: kolejnosc kluczy wiersza jest istotna, a serde_json::Value jej nie zachowuje
UNIT_TABLES.forEach((t, i) => writeFileSync(join(outDir, `unit_table_${i}.json`), JSON.stringify(t)));
writeFileSync(join(outDir, 'q5.json'), JSON.stringify({ pin: PIN, matrixPatch: MATRIX_PATCH, maps: mapsOut, unitTableCount: UNIT_TABLES.length, buildingCatalogs: BLD_CATS, scenarios: outScenarios }));
const classes = {};
for (const s of scenarios) classes[s.cls] = (classes[s.cls] ?? 0) + 1;
const liveSc = scenarios.filter((s) => s.live);
const phases = {};
for (const s of liveSc) for (const k of ['zloto', 'labels', 'stock']) for (const [o, ph] of Object.entries(s.out.live.first[k])) { const key = `${k}${s.live.labelsDefined ? '' : '-nolabels'}@${ph}`; phases[key] = (phases[key] ?? 0) + 1; }
const postDiff = liveSc.filter((s) => Object.entries(s.out.live.post.zloto).some(([o, v]) => s.out.live.val.zloto[o] !== undefined && s.out.live.val.zloto[o] !== v)).length;
console.log(JSON.stringify({ scenarios: scenarios.length, classes, ticks: scenarios.reduce((a, s) => a + s.out.perCity.length, 0), units: scenarios.filter((s) => (s.units ?? []).length > 0).length, heal: scenarios.filter((s) => s.out.heal && s.out.heal.calls.length > 0).length, livePhases: phases, livePostDiffersFromMemo: postDiff }));
