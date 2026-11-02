// Generator wektorow R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q4-Q1 (petla miast ticku ekonomii: P12, P17, P18, P19, P20).
// PIN weba: 4bbef081d. Uruchamiany jest PRAWDZIWY `advanceCityEconomy` (gra/src/game/turn-economy.ts) na prawdziwej
// mapie i prawdziwym `loadGameData()`. Instrumentacja W PAMIECI (plugin esbuild; pliki na dysku nietkniete):
//   * po `strataFraction` (:2602): zrzut korupcji per miasto (isCapital, dystans, liczba miast, strata),
//   * po `cityYieldPerTurn` (:2615): zrzut surowych plonow (przed mnoznikami Porzadku i cudami),
//   * po `applyWonderCityYields` (:2621): zrzut plonow koncowych (w tym `yld.zywnosc`, ktorego tick nie niesie),
//   * przed drenazem Mennicy (:2823): zrzut `incomeByOwner`.
// Dodatkowo `civ-matrix.json` jest NADPISANY w pamieci (MATRIX_PATCH: wealth_cap_proc, wealth_mnoznik_proc,
// mp_max_proc, mp_regen_proc, eko_*) - w prawdziwych danych wiekszosc tych pol = 0 (patch zapisany w wektorze,
// ta sama podmiana w tescie Rust). Wyniki: `res.perCity`, sumy, stan miast po ticku (wealthState, immunitet,
// magazynZywnosci, manpower), `incomeByOwner`.
// Zrodla z czystego `git archive 4bbef081d gra/src gra/data` do <WORK_DIR> poza repo (zero buildu/dev w gra/).
//
// Uruchomienie: node gen-p6-adv-q4-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>
// Wyjscie deterministyczne (PRNG mulberry32). Kodowanie liczb: jak p6_7b_vectors/common.rs.
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

const A_STRATA = `    const strataFraction = strataBazowa * (1 - redukcjaBudynkowKorupcji);\n    const ctx: CityYieldContext = {\n      wojskoZuzycieZywnosci: 0,   // B5`;
const C_STRATA = `    const strataFraction = strataBazowa * (1 - redukcjaBudynkowKorupcji);\n    (globalThis.__lc ||= {})[city.id] = { isCapital, dystans: dystansOdStolicy, liczbaMiast: liczbaWszystkichMiast, strataBazowa, redukcja: redukcjaBudynkowKorupcji, strataFraction, nWorked: worked.length, mennica: maMennicaEmpireWide, waluta: walutaOdkryta, ownerEra, zdrowie };\n    const ctx: CityYieldContext = {\n      wojskoZuzycieZywnosci: 0,   // B5`;
const A_YLD = `    const yld = cityYieldPerTurn(econCity, worked, cityBuildings, params, ctx);\n\n    const orderMult`;
const C_YLD = `    const yld = cityYieldPerTurn(econCity, worked, cityBuildings, params, ctx);\n    globalThis.__lc[city.id].y0 = { ...yld };\n    globalThis.__lc[city.id].podzialHandlu = { ...econCity.podziałHandlu };\n    globalThis.__lc[city.id].podzialPracy = { ...econCity.podziałPracy };\n    globalThis.__lc[city.id].nBuildings = cityBuildings.length;\n\n    const orderMult`;
const A_WON = `    // ekonomii/Pracy (nie dotyka economy.ts ani formul terenu/ulepszen powyzej).\n    applyWonderCityYields(yld, wonderCityYieldsByOwner.get(city.ownerId));\n`;
const C_WON = `${A_WON}    globalThis.__lc[city.id].y1 = { ...yld };\n`;
const A_INC = `  // PYTANIE-84-U-13: drain Mennicy po plonach (łaska = efekt bez pobrania Złota).\n`;
const C_INC = `  globalThis.__inc = Object.fromEntries(incomeByOwner);\n${A_INC}`;

const MATRIX_PATCH = {
  grecy: { wealth_cap_proc: 0.5, wealth_mnoznik_proc: 0.4, mp_max_proc: 0.3, mp_regen_proc: 0.5 },
  rzymianie: { wealth_cap_proc: -0.5, wealth_mnoznik_proc: -0.3, mp_max_proc: -0.4, mp_regen_proc: -1.5 },
  egipt: { wealth_cap_proc: 2, wealth_mnoznik_proc: 1, mp_max_proc: 1, eko_korupcja_proc: -0.5, eko_handel_brutto_proc: 0.3 },
  sumer: { wealth_cap_proc: -3, wealth_mnoznik_proc: -2, mp_regen_proc: 2, eko_korupcja_proc: 1.5 },
};

const built = await esbuild.build({
  stdin: {
    contents: `export { advanceCityEconomy } from './turn-economy';\nexport { loadGameData } from '../data/loader';`,
    resolveDir: game, loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', loader: { '.json': 'json', '.png': 'dataurl' },
  plugins: [{ name: 'capture', setup(b) {
    b.onLoad({ filter: /game[\\/]turn-economy\.ts$/ }, (a) => {
      let src = readFileSync(a.path, 'utf8');
      for (const [anchor, cap] of [[A_STRATA, C_STRATA], [A_YLD, C_YLD], [A_WON, C_WON], [A_INC, C_INC]]) {
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
for (let i = 0; i < 100; i++) { const mapIdx = ri(0, 5); scenarios.push(finishScenario(`plain-${i}`, 'plain', mapIdx, genCities(mapIdx, ri(1, 5), rnd() < 0.6))); }
for (let i = 0; i < 120; i++) { const mapIdx = ri(0, 5); scenarios.push(finishScenario(`rich-${i}`, 'rich', mapIdx, genCities(mapIdx, ri(1, 6), rnd() < 0.6))); }
// bramka runtime (resolveOwnerActiveLabels + resolveOwnerEmpireStock): budynki zlozowe (cegielnia, garncarnia, stolarnia, kamieniarski, mennica...)
// spia bez surowca w magazynie panstwa -> zmienia zbior `runtimeBuiltIds` (ma* flagi, plony budynkow, liczniki Stolarni)
for (let i = 0; i < 70; i++) {
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
// korupcja: stolica (20,20), drugie miasto w dystansie 0..30 od stolicy, 1..6 miast (brzeg capu: strata% = d*2 + n*1 vs cap 50)
for (const difficulty of ['easy', 'normal', 'hard']) for (let d = 0; d <= 30; d += (d < 24 ? 2 : 3)) for (const extraN of (d % 3 === 0 ? [0, 3] : [0])) {
  const cities = [{ id: 'cap', owner: 0, q: 20, r: 20, pop: 4, built: [], surowce: null }, { id: 'far', owner: 0, q: 20 + Math.min(d, 18), r: 20 - Math.max(0, d - 18), pop: 4, built: d % 2 === 0 ? ['sad'] : d % 3 === 0 ? ['sad', 'pretorium', 'palac'] : [], surowce: null }];
  for (let k = 0; k < extraN; k++) cities.push({ id: 'x' + k, owner: 0, q: 22 + k, r: 21, pop: 2, built: [], surowce: null });
  scenarios.push(finishScenario(`corr-${difficulty}-${d}-${extraN}`, 'corr', 6, cities, { difficulty, ownerMaps: { civ: { 0: undefined }, zloto: { 0: true }, tech: null, zbadane: ['Waluta'], era: null, wonder: {}, defH: {}, defP: {} } }));
}
// brzeg capu korupcji N-1/N/N+1: wspolczynniki dystansu i miast = 1 (wszystkie trudnosci), cap C%, 2 miasta => strata% = d + 2
for (const difficulty of ['easy', 'normal', 'hard']) for (const C of [0, 10, 38]) for (const dd of [-1, 0, 1]) {
  const d = Math.max(0, C - 2 + dd);
  const econ = structuredClone(DATA.econParams);
  econ.ekonomia_miasta.korupcja_cap = { easy: C, normal: C, hard: C };
  econ.ekonomia_miasta.korupcja_wspolczynnik_dystansu = { easy: 1, normal: 1, hard: 1 };
  econ.ekonomia_miasta.korupcja_wspolczynnik_miast = { easy: 1, normal: 1, hard: 1 };
  const cities = [{ id: 'cap', owner: 0, q: 10, r: 20, pop: 3, built: ['mennica'], surowce: null }, { id: 'far', owner: 0, q: 10 + d, r: 20, pop: 3, built: dd === 0 ? ['sad'] : [], surowce: null }];
  scenarios.push(finishScenario(`capedge-${difficulty}-${C}-${dd}`, 'capedge', 6, cities, { difficulty, econ, ownerMaps: { civ: { 0: undefined }, zloto: { 0: true }, tech: null, zbadane: ['Waluta'], era: null, wonder: {}, defH: {}, defP: {} } }));
}
// oblezenie: magazyn vs zuzycie (pop + garnizon) N-1/N/N+1
for (const pop of [1, 3, 5]) for (const garn of [0, 2, undefined, -1]) for (const delta of [-1, 0, 1, 100]) {
  const cities = [{ id: 'o', owner: 0, q: 5, r: 5, pop, garn, obl: true, food: Math.max(0, pop + (garn > 0 ? garn : 0) + delta), built: [], surowce: null }];
  scenarios.push(finishScenario(`siege-${pop}-${garn}-${delta}`, 'siege', 5, cities));
}
// immunitet Wealth 0/1/2 oraz brzegi puli/poziomu
for (const immun of [undefined, 0, 1, 2, -1]) for (const pula of [0, 20, 500]) for (const poziom of [0, 1, 3]) {
  const cities = [{ id: 'w', owner: 0, q: 5, r: 5, pop: 4, immun, wealth: { poziom, pula }, obl: false, built: ['mennica', 'port', 'swiatynia'], surowce: null }];
  scenarios.push(finishScenario(`wealth-${immun}-${pula}-${poziom}`, 'wealth', 5, cities));
}
// manpower: pula wokol max (N-1/N/N+1) - max liczone w tescie z wyniku; tu pula = {undefined, 0, max-1 .. }
for (const pop of [1, 4, 9]) for (const era of [1, 3, 5]) for (const mp of [undefined, 0, 4, 50, 400, 100000]) for (const obl of [false, true]) {
  const cities = [{ id: 'm', owner: 0, q: 5, r: 5, pop, mp, obl, built: [], surowce: null }];
  scenarios.push(finishScenario(`mp-${pop}-${era}-${mp}-${obl}`, 'mp', 5, cities, { ownerMaps: { civ: { 0: pick(['grecy', 'rzymianie', 'egipt', undefined]) }, zloto: { 0: true }, tech: null, zbadane: [], era: { 0: era }, wonder: {}, defH: {}, defP: {} } }));
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

// korupcja + macierz cywilizacji (sumer: eko_korupcja_proc +1.5): strata po mnozniku macierzy przekracza cap ogona cityYieldPerTurn (korupcjaCap=0.5)
for (const difficulty of ['easy', 'normal', 'hard']) for (const d of [8, 12, 16, 20, 24, 30]) {
  const cities = [{ id: 'cap', owner: 0, q: 10, r: 20, pop: 3, built: [], surowce: null }, { id: 'far', owner: 0, q: 10 + d, r: 20, pop: 3, built: [], surowce: null }];
  scenarios.push(finishScenario(`corrmat-${difficulty}-${d}`, 'corrmat', 6, cities, { difficulty, ownerMaps: { civ: { 0: 'sumer' }, zloto: { 0: true }, tech: null, zbadane: ['Waluta'], era: null, wonder: {}, defH: {}, defP: {} } }));
}

// ---- uruchomienie weba ---------------------------------------------------------------------------------------------
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
  const data = s.econ ? { ...DATA, econParams: s.econ } : DATA;
  globalThis.__lc = {}; globalThis.__inc = undefined;
  const res = W.advanceCityEconomy(
    cities, toWebMap(MAPS[s.mapIdx]), data, s.difficulty, [], new Map(), builtByCity, s.playerEra, new Set(om.zbadane), ownerCiv, orderMap,
    resolveOwnerEra, resolveOwnerTech, 'wysoki', new Map(Object.entries(s.tbonus)), new Map(Object.entries(s.tinc)), new Map(), wonder,
    (o) => om.zloto[o] ?? true, om.gate ? (o) => om.gate.labels[o] ?? [] : undefined, om.gate ? (o) => om.gate.stock[o] : undefined, defH, undefined, defP, new Map(Object.entries(s.marit)), new Map(Object.entries(s.mtax)),
  );
  const num2 = (x) => (typeof x === 'number' ? enc(x) : x === undefined ? null : x);
  const tick = (t) => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, num2(v)]));
  return {
    perCity: res.perCity.map(tick),
    totals: { cities: enc(res.cities), praca: enc(res.totalPraca), pieniadz: enc(res.totalPieniadz), nauka: enc(res.totalNauka), luksus: enc(res.totalLuksus), kultura: enc(res.totalKultura), zywnosc: enc(res.totalZywnosc), pracaPula: enc(res.totalPracaPula) },
    income: Object.fromEntries(Object.entries(globalThis.__inc ?? {}).map(([k, v]) => [k, enc(v)])),
    lc: Object.fromEntries(Object.entries(globalThis.__lc).map(([id, v]) => [id, { ...encRec(v), y0: encRec(v.y0), y1: encRec(v.y1), podzialHandlu: encRec(v.podzialHandlu), podzialPracy: encRec(v.podzialPracy) }])),
    after: cities.map((c) => ({
      id: c.id,
      wealthState: c.wealthState ? { poziom: enc(c.wealthState.poziom), pula: enc(c.wealthState.pula) } : null,
      immun: enc(c.wealthImmunityRemaining),
      food: c.magazynZywnosci === undefined ? null : typeof c.magazynZywnosci === 'number' ? enc(c.magazynZywnosci) : 'obj',
      manpower: enc(c.manpower),
    })),
  };
}
for (const s of scenarios) s.out = runWeb(s);

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
writeFileSync(join(outDir, 'q4.json'), JSON.stringify({ pin: PIN, matrixPatch: MATRIX_PATCH, maps: mapsOut, scenarios: outScenarios }));
const classes = {};
for (const s of scenarios) classes[s.cls] = (classes[s.cls] ?? 0) + 1;
console.log(JSON.stringify({ scenarios: scenarios.length, classes, ticks: scenarios.reduce((a, s) => a + s.out.perCity.length, 0), besieged: scenarios.reduce((a, s) => a + s.out.perCity.filter((t) => t.oblegany).length, 0) }));
