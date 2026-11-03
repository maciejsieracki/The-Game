// Generator wektorow R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q3-Q1 (utrzymanie i zdrowie ticku ekonomii).
// PIN weba: 23dd158e9. Uruchamiany jest PRAWDZIWY `advanceCityEconomy` (gra/src/game/turn-economy.ts) na
// prawdziwej mapie (heksy z terenem/nakladka/rzeka/ulepszeniami + riverPaths) i prawdziwym `loadGameData()`.
// Instrumentacja W PAMIECI (plugin esbuild): zapis `upkeepParams`, `storageParams`, `rationParams`, `unitUpkeepTbl`
// (po `buildUnitUpkeepTable`, linia 2329 pinu) i `healthParams` (linia 2421 pinu). Wyniki ticku: `pracaUpkeepByOwner`
// i `perCity[i].zdrowie` z WYNIKU `advanceCityEconomy`. Dodatkowo bezposrednie wolania eksportowanych
// `computePracaUpkeepByOwner` (wezly fort/posterunek), `cityHasWaterAccess`, `computeCityHealthBreakdown`
// (zdrowie z/bez kontekstu mapy, rozne `societyRaw`), `loadUpkeepParams`/`loadStorageParams`/`buildRationParams`
// (uszkodzone/brakujace grupy econ-params) i `buildUnitUpkeepTable` (uszkodzone wiersze units.json).
// Zrodla z czystego `git archive 23dd158e9 gra/src gra/data` do <WORK_DIR> poza repo (zero buildu/dev w gra/).
//
// Uruchomienie: node gen-p6-adv-q3-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>
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

const ANCHOR_UNITS = `  const unitUpkeepTbl = buildUnitUpkeepTable(data.units as unknown as Parameters<typeof buildUnitUpkeepTable>[0]);

  // Pre-compute converter throughputs (from econ-params.json) -- BASE, przed`;
const CAP_UNITS = `  const unitUpkeepTbl = buildUnitUpkeepTable(data.units as unknown as Parameters<typeof buildUnitUpkeepTable>[0]);
  globalThis.__cap = { upkeepParams, storageParams, rationParams, unitUpkeepTbl };

  // Pre-compute converter throughputs (from econ-params.json) -- BASE, przed`;
const ANCHOR_HEALTH = `  // WIRE 1: parametry zdrowia z society-params.json
  const healthParams = loadHealthParams(
    (data as unknown as Record<string, unknown>).societyParams,
    difficulty,
  );
`;
const CAP_HEALTH = `${ANCHOR_HEALTH}  globalThis.__cap.health = {
    rzeka: healthParams.rzeka, akwedukt: healthParams.akwedukt, studnia: healthParams.studnia, targowisko: healthParams.targowisko,
    lazniaPubliczna: healthParams.lazniaPubliczna, ceramika: healthParams.ceramika, karaZagoszczenie: healthParams.karaZagoszczenie,
    progZagoszczenia: healthParams.progZagoszczenia, karaBagno: healthParams.karaBagno, bonusLas: healthParams.bonusLas,
    karaDzungla: healthParams.karaDzungla, karaBrakWody: healthParams.karaBrakWody,
    osiedle: [-1, 0, 0.5, 1, 1.5, 2, 3, 3.9, 4, 4.5, 5, 6, 9, NaN].map((p) => [p, healthParams.osiedlePopBonus(p)]),
  };
`;

const built = await esbuild.build({
  stdin: {
    contents: `export { advanceCityEconomy, computePracaUpkeepByOwner, cityHasWaterAccess, computeCityHealthBreakdown, __computeCityHealth, __loadHealthParams } from './turn-economy';
export { loadUpkeepParams, loadStorageParams, buildUnitUpkeepTable } from './economy-upkeep';
export { buildRationParams } from './population-growth-v85';
export { loadGameData } from '../data/loader';`,
    resolveDir: game, loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', loader: { '.json': 'json', '.png': 'dataurl' },
  plugins: [{ name: 'capture', setup(b) {
    b.onLoad({ filter: /game[\\/]turn-economy\.ts$/ }, (a) => {
      let src = readFileSync(a.path, 'utf8');
      for (const [anchor, cap] of [[ANCHOR_UNITS, CAP_UNITS], [ANCHOR_HEALTH, CAP_HEALTH]]) {
        if (src.split(anchor).length !== 2) throw new Error('anchor: oczekiwano dokladnie 1 wystapienia: ' + anchor.slice(0, 60));
        src = src.replace(anchor, () => cap);
      }
      // eksport nieeksportowanych funkcji (computeCityHealth, loadHealthParams) -- tylko w pamieci, plik na dysku nietkniety
      src += '\nexport { computeCityHealth as __computeCityHealth, loadHealthParams as __loadHealthParams };\n';
      return { contents: src, loader: 'ts' };
    });
  } }],
});
const bundleFile = join(workDir, 'web-bundle.mjs');
writeFileSync(bundleFile, built.outputFiles[0].text);
const W = await import(pathToFileURL(bundleFile).href);
const DATA = W.loadGameData();

const enc = (x) => {
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  if (Object.is(x, -0)) return '-0';
  if (Number.isSafeInteger(x)) return x;
  return '~' + String(x);
};
const encRec = (rec) => (rec == null ? null : Object.fromEntries(Object.keys(rec).sort().map((k) => [k, enc(rec[k])])));

let seed = 0x3c71a9d5;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[ri(0, arr.length - 1)];
const wpick = (arr, w) => { let t = rnd() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < arr.length; i++) { t -= w[i]; if (t < 0) return arr[i]; } return arr[arr.length - 1]; };

// ---- mapy ([q,r,teren,nakladka,rzeka,ulepszenie,ulepszenia,zloze]) + riverPaths -----------------------------------
const TERRAINS = ['laka', 'rownina', 'wzgorza', 'gory', 'plytkie_morze', 'morze', 'pustynia', 'polarny'];
const TER_W = [4, 4, 3, 1, 1, 1, 1, 1];
const OVERLAYS = ['brak', 'las', 'zloze_gliny', 'zloze_rudy', 'zloze_konia', 'zloze_owiec', 'zloze_bydla', 'zloze_lamy'];
const OVL_W = [10, 6, 1, 1, 1, 1, 1, 1];
const IMPS = ['tartak', 'kamieniolom', 'glinianka', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'warzelnia_soli', 'stadnina',
  'kopalnia_zlota', 'farma', 'irygacja', 'droga', 'fort', 'posterunek', 'kopalnia', 'Tartak', ' tartak ', 'nieznane', 'brak', 'bydlo', 'wyrab',
  'droga_brukowana', 'tarasy', 'owce', 'lama', 'oboz_lowiecki', 'lodzie_rybackie', 'tartak', 'kamieniolom', 'kopalnia_zelaza'];
const ZLOZA = ['rudy', 'zelaza', 'zlota', 'miedzi', 'x'];
function randHexRow(q, r, impP, lasP) {
  const ter = wpick(TERRAINS, TER_W);
  const nak = lasP !== undefined ? (rnd() < lasP ? 'las' : 'brak') : wpick(OVERLAYS, OVL_W);
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
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
function randRivers(w, h) {
  const paths = [];
  const n = ri(0, 3);
  for (let i = 0; i < n; i++) {
    let q = ri(-1, w); let r = ri(-1, h);
    const path = [[q, r]];
    const len = ri(2, 8);
    for (let k = 0; k < len; k++) { const [dq, dr] = pick(NB); q += dq; r += dr; path.push([q, r]); }
    paths.push(path);
  }
  return paths;
}
function rectMap(w, h, impP, hole, shuffle, lasP) {
  const rows = [];
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) if (rnd() >= hole) rows.push(randHexRow(q, r, impP, lasP));
  if (shuffle) for (let i = rows.length - 1; i > 0; i--) { const j = ri(0, i); [rows[i], rows[j]] = [rows[j], rows[i]]; }
  return { w, h, hexes: rows, rivers: randRivers(w, h) };
}
function hexMap(cx, cy, radius, impP) {
  const rows = [];
  for (let dq = -radius; dq <= radius; dq++) for (let dr = Math.max(-radius, -dq - radius); dr <= Math.min(radius, -dq + radius); dr++) rows.push(randHexRow(cx + dq, cy + dr, impP));
  return { w: 2 * radius + 1 + cx, h: 2 * radius + 1 + cy, hexes: rows, rivers: [] };
}
const MAPS = [];
for (let i = 0; i < 6; i++) MAPS.push(rectMap(ri(9, 13), ri(9, 13), 0.35, i < 2 ? 0 : 0.06, i % 2 === 1, i === 4 ? 0.04 : undefined));
MAPS.push(rectMap(15, 15, 0.5, 0, false)); // 6: gesta
MAPS.push(hexMap(20, 20, 18, 0.3)); // 7: pierscienie (brzegi promienia)
// 8: mapa "las": dokladnie jeden heks z lasem w zadanym dystansie od (20,20), reszta bez lasu i bez rzek (brzegi zdrowia: promien okolicy)
function lasEdgeMap(distLas) {
  const rows = [];
  const radius = 14;
  for (let dq = -radius; dq <= radius; dq++) for (let dr = Math.max(-radius, -dq - radius); dr <= Math.min(radius, -dq + radius); dr++) {
    rows.push([20 + dq, 20 + dr, 'laka', dq === distLas && dr === 0 ? 'las' : 'brak', 0, null, null, null]);
  }
  return { w: 40, h: 40, hexes: rows, rivers: [] };
}
const LAS_FIRST_IDX = MAPS.length;
for (let d = 0; d <= 9; d++) MAPS.push(lasEdgeMap(d)); // 8..17: las w dystansie 0..9 od (20,20)

const toWebMap = (m) => {
  const hexes = {};
  for (const [q, r, ter, nak, riv, ul, uls, zl] of m.hexes) {
    const h = { coords: { q, r }, terenBazowy: ter, nakladka: nak, rzeka: { obecna: !!riv } };
    if (ul !== null) h.ulepszenie = ul;
    if (uls !== null) h.ulepszenia = uls.slice();
    if (zl !== null) h.zloze = zl;
    hexes[q + ',' + r] = h;
  }
  return { szerokoscQ: m.w, wysokoscR: m.h, hexes, seed: 1, rzeki: [], riverPaths: m.rivers.map((p) => p.map(([q, r]) => ({ q, r }))) };
};

// ---- scenariusze tickowe ---------------------------------------------------------------------------------------
const KEYS = ['drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'sol', 'zloto', 'kon', 'cegla', 'ceramika'];
const BUILT = ['magazyn', 'magazyn', 'stolarnia', 'kamieniarski', 'mennica', 'farma', 'spichlerz', 'spichlerz', 'spichlerz_ii', 'cegielnia', 'garncarnia', 'akwedukt',
  'studnia', 'targowisko', 'laznia_publiczna', 'studnia'];
const POPS = [-1, 0.5, 2.5, 3.7, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 8, 10, 13, 15, 16, 17];
const TRYB = [undefined, 'auto', 'auto', 'reczny', 'reczny'];
const FOCUS = [undefined, 'zrownowazone', 'zywnosc', 'produkcja', 'podatki'];

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

function finishScenario(name, cls, mapIdx, cities, extra = {}) {
  for (const c of cities) {
    c.tryb = c.tryb ?? pick(TRYB); c.focus = c.focus ?? pick(FOCUS);
    if (c.reczne === undefined) c.reczne = undefined; // reczne: brak (adapter okolicy -- poza zakresem -Q3)
    if (c.surowce === undefined) c.surowce = rnd() < 0.85 ? Object.fromEntries(KEYS.filter(() => rnd() < 0.6).map((k) => [k, rnd() < 0.15 ? ri(0, 6) : ri(0, 120)])) : null;
    if (c.built === undefined) c.built = [...new Set(Array.from({ length: ri(0, 6) }, () => pick(BUILT)))];
  }
  const own = [...new Set(cities.map((c) => c.owner))];
  return {
    name, cls, mapIdx, difficulty: pick(['easy', 'normal', 'hard']), playerEra: pick([1, 1, 2, 3]),
    eraByOwner: rnd() < 0.5 ? Object.fromEntries(own.map((o) => [o, pick([1, 1, 2, 3, 4, 1.5, 0])])) : null,
    praca: null, cities, ...extra,
  };
}

const scenarios = [];
for (let i = 0; i < 360; i++) {
  const mapIdx = ri(0, 5);
  scenarios.push(finishScenario(`rand-${i}`, 'rand', mapIdx, genCities(mapIdx, ri(1, 6), rnd() < 0.6)));
}
// brzegi N-1/N/N+1 populacji (zdrowie: osiedle 1..4, zageszczenie > prog 3/4/5; upkeep: promien terytorium) x trudnosc x budynki wodne
const WATER_SETS = [[], ['studnia'], ['akwedukt', 'targowisko', 'laznia_publiczna'], ['studnia', 'targowisko']];
for (const difficulty of ['easy', 'normal', 'hard']) for (let pop = 0; pop <= 9; pop++) for (const [wi, built] of WATER_SETS.entries()) {
  scenarios.push(finishScenario(`hedge-${difficulty}-${pop}-w${wi}`, 'hedge', 7, [{ id: 'k', owner: 0, q: 20, r: 20, pop, tryb: 'auto', built, surowce: null }], { difficulty }));
}
// ulamkowe populacje wokol progow
for (const difficulty of ['easy', 'normal', 'hard']) for (const pop of [0.5, 0.99, 1.5, 3.5, 3.99, 4.01, 4.5, 5.5, 6.25, 9.9]) {
  scenarios.push(finishScenario(`hfrac-${difficulty}-${pop}`, 'hedge', 7, [{ id: 'k', owner: 0, q: 20, r: 20, pop, tryb: 'auto', built: [], surowce: null }], { difficulty }));
}
// las w dystansie 0..9 x populacja 1..9 (promien okolicy = max(baza, min(pop, cap)))
for (let d = 0; d <= 9; d++) for (const pop of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
  scenarios.push(finishScenario(`las-d${d}-p${pop}`, 'las', LAS_FIRST_IDX + d, [{ id: 'k', owner: 0, q: 20, r: 20, pop, tryb: 'auto', built: [], surowce: null }], { difficulty: 'normal' }));
}
// brzegi kosztu Pracy (zaokraglenie JS round, mnozniki epoki 1/2/4): wiersz econ nadpisany identycznie dla easy/normal/hard
const COSTS = [0, 0.24, 0.25, 0.26, 0.49, 0.5, 0.51, 0.75, 1, 1.25, 1.5, 2, 2.5, 3.7, -1, 'x', null];
for (const cost of COSTS) for (const difficulty of ['easy', 'normal', 'hard']) {
  scenarios.push(finishScenario(`upk-${cost}-${difficulty}`, 'upk', 6, [
    { id: 'A', owner: 0, q: 3, r: 7, pop: 5, tryb: 'auto', built: [], surowce: null },
    { id: 'B', owner: 1, q: 10, r: 7, pop: 5, tryb: 'auto', built: [], surowce: null },
    { id: 'C', owner: 0, q: 7, r: 3, pop: 3, tryb: 'auto', built: [], surowce: null },
  ], { difficulty, praca: { easy: cost, normal: cost, hard: cost } }));
}
// koszt tylko dla jednej trudnosci (fallback 1 dla pozostalych), brak wiersza, brak grupy
for (const difficulty of ['easy', 'normal', 'hard']) for (const variant of ['only-this', 'no-row', 'no-group', 'row-string', 'row-array']) {
  scenarios.push(finishScenario(`upkrow-${variant}-${difficulty}`, 'upk', 6, [
    { id: 'A', owner: 0, q: 4, r: 7, pop: 6, tryb: 'auto', built: [], surowce: null },
    { id: 'B', owner: 1, q: 9, r: 7, pop: 4, tryb: 'auto', built: [], surowce: null },
  ], { difficulty, praca: variant === 'only-this' ? { [difficulty]: 2.5 } : variant }));
}

function webData(praca) {
  if (praca === null) return DATA;
  const econ = structuredClone(DATA.econParams);
  if (praca === 'no-row') delete econ.budynki.ulepszenie_surowcowe_upkeep_praca;
  else if (praca === 'no-group') delete econ.budynki;
  else if (praca === 'row-string') econ.budynki.ulepszenie_surowcowe_upkeep_praca = 'x';
  else if (praca === 'row-array') econ.budynki.ulepszenie_surowcowe_upkeep_praca = [3, 4, 5];
  else econ.budynki.ulepszenie_surowcowe_upkeep_praca = { ...praca };
  return { ...DATA, econParams: econ };
}

function runWeb(s) {
  const cities = s.cities.map((c) => {
    const o = { id: c.id, ownerId: c.owner, q: c.q, r: c.r, name: c.id, population: c.pop };
    if (c.surowce !== null) o.surowce = { ...c.surowce };
    if (c.tryb !== undefined) o.okolicaTryb = c.tryb;
    if (c.focus !== undefined) o.okolicaFocus = c.focus;
    return o;
  });
  const builtByCity = new Map(s.cities.map((c) => [c.id, c.built.slice()]));
  const resolveOwnerEra = s.eraByOwner ? (o) => s.eraByOwner[o] : undefined;
  globalThis.__cap = undefined;
  const res = W.advanceCityEconomy(
    cities, toWebMap(MAPS[s.mapIdx]), webData(s.praca), s.difficulty, [], new Map(), builtByCity, s.playerEra, new Set(), new Map(), new Map(),
    resolveOwnerEra, undefined, 'wysoki', new Map(), new Map(), new Map(), new Map(),
  );
  const cap = globalThis.__cap;
  return {
    praca: Object.fromEntries([...res.pracaUpkeepByOwner].map(([k, v]) => [k, enc(v)])),
    zdrowie: res.perCity.map((t) => [t.cityId, enc(t.zdrowie)]),
    params: { upkeep: encRec(cap.upkeepParams), storage: encRec(cap.storageParams), ration: encRec(cap.rationParams), health: { ...encRec({ ...cap.health, osiedle: undefined }), osiedle: cap.health.osiedle.map(([p, v]) => [enc(p), enc(v)]) } },
    unitTable: cap.unitUpkeepTbl,
  };
}
let unitTableRef = null;
for (const s of scenarios) {
  s.out = runWeb(s);
  const t = JSON.stringify(s.out.unitTable);
  if (unitTableRef === null) unitTableRef = t; else if (unitTableRef !== t) throw new Error('unitUpkeepTbl zalezy od scenariusza');
  delete s.out.unitTable;
}
const unitTable = JSON.parse(unitTableRef);

// ---- bezposrednie wolania computePracaUpkeepByOwner z wezlami fort/posterunek -----------------------------------
const directPraca = [];
for (let i = 0; i < 90; i++) {
  const mapIdx = ri(0, 6);
  const m = MAPS[mapIdx];
  const cities = genCities(mapIdx, ri(0, 4), rnd() < 0.6).map((c) => ({ id: c.id, ownerId: c.owner, q: c.q, r: c.r, pop: c.pop }));
  const forts = [];
  const nf = ri(0, 4);
  for (let k = 0; k < nf; k++) {
    const kind = rnd() < 0.5 ? 'fort' : 'outpost';
    const f = { q: ri(0, m.w - 1), r: ri(0, m.h - 1), kind, owner: ri(0, 2) };
    if (rnd() < 0.6) f.order = { turn: ri(1, 5), seq: ri(0, 4) };
    forts.push(f);
  }
  const cityNodes = cities.map((c) => ({ q: c.q, r: c.r, pop: c.pop, level: 1, ownerId: c.ownerId }));
  const fortNodes = forts.map((f) => ({ q: f.q, r: f.r, pop: 0, level: 1, ownerId: f.owner, ...(f.kind === 'fort' ? { isFort: true } : { isOutpost: true }), ...(f.order ? { order: f.order } : {}) }));
  const fortsFirst = rnd() < 0.4;
  const nodes = fortsFirst ? [...fortNodes, ...cityNodes] : [...cityNodes, ...fortNodes];
  const difficulty = pick(['easy', 'normal', 'hard']);
  const cost = pick([null, 0.5, 1.5, 2.5, 3, 0.25]);
  const praca = cost === null ? null : { easy: cost, normal: cost, hard: cost };
  const got = W.computePracaUpkeepByOwner(toWebMap(m), nodes, webData(praca), difficulty);
  directPraca.push({ name: `dp-${i}`, mapIdx, difficulty, praca, cities, forts, fortsFirst, out: Object.fromEntries([...got].map(([k, v]) => [k, enc(v)])) });
}

// ---- zdrowie: bezposrednie wolania (computeCityHealthBreakdown / cityHasWaterAccess) ----------------------------
const REAL_SOC = DATA.societyParams;
const socVariants = [];
{
  socVariants.push({ kind: 'real', value: undefined });
  socVariants.push({ kind: 'undefined', value: undefined, none: true });
  socVariants.push({ kind: 'null', value: null });
  socVariants.push({ kind: 'empty', value: {} });
  socVariants.push({ kind: 'zdrowie-empty', value: { zdrowie: {} } });
  socVariants.push({ kind: 'zdrowie-string', value: { zdrowie: 'abc' } });
  socVariants.push({ kind: 'zdrowie-array', value: { zdrowie: [1, 2, 3] } });
  socVariants.push({ kind: 'zdrowie-zero', value: { zdrowie: 0 } });
  for (let i = 0; i < 24; i++) {
    const z = structuredClone(REAL_SOC.zdrowie);
    for (const k of Object.keys(z)) {
      if (rnd() < 0.2) delete z[k];
      else if (rnd() < 0.1) z[k] = pick(['x', 5, null, [1, 2], true]);
      else if (rnd() < 0.15) { const d = pick(['easy', 'normal', 'hard']); z[k] = { ...z[k], [d]: pick(['x', null, 'NaN', true, [1], 7, -3.5, 0, 100]) }; }
      else if (rnd() < 0.1) delete z[k].normal;
    }
    if (rnd() < 0.3) z.zdrowie_bonus_osiedle_pop = pick([{ easy: [1, 'x', 3, 4], normal: [5, 6], hard: 'x' }, { normal: [9, 8, 7, 6] }, { easy: [2, 2, 2, 2], normal: [1, 1, 1, 1], hard: [0, 0, 0, 0] }, 7, 'x']);
    if (rnd() < 0.3) z['zdrowie_prog_zagęszczenia'] = pick([{ easy: 2, normal: 2, hard: 2 }, { easy: 6, normal: 7, hard: 8 }, { easy: 0, normal: 0, hard: 0 }]);
    socVariants.push({ kind: `mut-${i}`, value: { zdrowie: z } });
  }
}
// do wektora: wariant society bez `opis`/`jednostka` (nieczytane przez loadHealthParams) -- tylko rozmiar fixture
const slimSoc = (v) => {
  if (!v || typeof v !== 'object' || !v.zdrowie || typeof v.zdrowie !== 'object' || Array.isArray(v.zdrowie)) return v;
  const z = Object.fromEntries(Object.entries(v.zdrowie).map(([k, row]) => [k, row && typeof row === 'object' && !Array.isArray(row) ? Object.fromEntries(Object.entries(row).filter(([f]) => f !== 'opis' && f !== 'jednostka')) : row]));
  return { ...v, zdrowie: z };
};
const hdirect = [];
const BUILT_H = ['studnia', 'targowisko', 'akwedukt', 'laznia_publiczna', 'garncarnia', 'spichlerz'];
function randCityXY(mapIdx) {
  const m = MAPS[mapIdx];
  const t = rnd();
  if (t < 0.55) return [ri(0, m.w - 1), ri(0, m.h - 1)];
  if (t < 0.65) return [ri(-3, m.w + 3), ri(-3, m.h + 3)];
  if (t < 0.75) return [pick([0.5, 2.5, 3.25, 1e-9, -0.5]), ri(0, m.h - 1)];
  if (t < 0.8) return [ri(0, m.w - 1), pick([1.5, 4.000000001, 2.5])];
  if (t < 0.83) return [-0, ri(0, m.h - 1)];
  if (t < 0.86) return [pick([NaN, Infinity, -Infinity, 1e21, 3000000000]), ri(0, m.h - 1)];
  if (t < 0.9) return [ri(0, m.w - 1), pick([NaN, 1e21, 4294967297])];
  const rv = m.rivers.length ? pick(m.rivers) : null; // miasto przy riverPaths (sasiad rzeki)
  if (rv) { const [q, r] = pick(rv); const [dq, dr] = pick([[0, 0], ...NB]); return [q + dq, r + dr]; }
  return [ri(0, m.w - 1), ri(0, m.h - 1)];
}
for (let i = 0; i < 900; i++) {
  const mapIdx = ri(0, MAPS.length - 1);
  const [q, r] = randCityXY(mapIdx);
  const soc = pick(socVariants);
  const useCtx = rnd() < 0.8;
  const tiles = Array.from({ length: ri(0, 4) }, () => rnd() < 0.3);
  const ludnosc = pick([...POPS, 4.5, 3.99, 0.5, NaN, Infinity, -2]);
  const ctxPop = rnd() < 0.5 ? ludnosc : pick(POPS);
  const built = [...new Set(Array.from({ length: ri(0, 4) }, () => pick(BUILT_H)))];
  const difficulty = pick(['easy', 'normal', 'hard', 'weird']);
  const webMap = toWebMap(MAPS[mapIdx]);
  const societyRaw = soc.none ? undefined : (soc.kind === 'real' ? REAL_SOC : soc.value);
  const wtiles = tiles.map((b) => ({ terenBazowy: 'laka', nakladka: 'brak', maRzeke: b }));
  const br = W.computeCityHealthBreakdown(ludnosc, wtiles, built, societyRaw, difficulty, useCtx ? { city: { q, r, population: ctxPop }, map: webMap } : undefined);
  const water = W.cityHasWaterAccess({ q, r }, webMap);
  hdirect.push({ mapIdx, q: enc(q), r: enc(r), soc: soc.kind, socValue: soc.kind === 'real' ? null : (soc.none ? { none: true } : { v: slimSoc(soc.value) }),
    useCtx, tiles, ludnosc: enc(ludnosc), ctxPop: enc(ctxPop), built, difficulty, total: enc(br.total), water });
}

// ---- P10: loadHealthParams (pelny obiekt) dla wszystkich wariantow society x trudnosc (+ nieznana) -----------------------
const HP_FIELDS = ['rzeka', 'akwedukt', 'studnia', 'targowisko', 'lazniaPubliczna', 'ceramika', 'karaZagoszczenie', 'progZagoszczenia', 'karaBagno', 'bonusLas', 'karaDzungla', 'karaBrakWody'];
const hparams = [];
for (const soc of socVariants) for (const difficulty of ['easy', 'normal', 'hard', 'weird']) {
  const societyRaw = soc.none ? undefined : (soc.kind === 'real' ? REAL_SOC : soc.value);
  const hp = W.__loadHealthParams(societyRaw, difficulty);
  hparams.push({ soc: soc.kind, socValue: soc.kind === 'real' ? null : (soc.none ? { none: true } : { v: slimSoc(soc.value) }), difficulty,
    out: { ...Object.fromEntries(HP_FIELDS.map((k) => [k, enc(hp[k])])), osiedle: [-1, 0, 0.5, 1, 1.5, 2, 3, 3.9, 4, 4.5, 5, 6, 9, NaN, Infinity].map((p) => [enc(p), enc(hp.osiedlePopBonus(p))]) } });
}
// ---- P16: computeCityHealth bezposrednio (bonus Spichlerza, nadwyzka Garncarni, hasWaterAccess true/false/undefined) --
const hfull = [];
const SPEC = [0, 0, 1, 2, -1, 0.5, -0.4, 3, -0, NaN];
for (let i = 0; i < 700; i++) {
  const mapIdx = ri(0, MAPS.length - 1);
  const [q, r] = randCityXY(mapIdx);
  const soc = pick(socVariants);
  const societyRaw = soc.none ? undefined : (soc.kind === 'real' ? REAL_SOC : soc.value);
  const difficulty = pick(['easy', 'normal', 'hard', 'weird']);
  const hp = W.__loadHealthParams(societyRaw, difficulty);
  const ludnosc = pick([...POPS, 4.5, 3.99, 0.5]);
  const tiles = Array.from({ length: ri(0, 4) }, () => rnd() < 0.3);
  const built = [...new Set(Array.from({ length: ri(0, 4) }, () => pick(BUILT_H)))];
  const hasWater = pick([true, false, undefined]);
  const useCtx = rnd() < 0.7;
  const ctxPop = pick(POPS);
  const spich = pick(SPEC); const garn = pick(SPEC);
  const wtiles = tiles.map((b) => ({ terenBazowy: 'laka', nakladka: 'brak', maRzeke: b }));
  const got = W.__computeCityHealth(ludnosc, wtiles, built, hp, hasWater, useCtx ? { city: { q, r, population: ctxPop }, map: toWebMap(MAPS[mapIdx]) } : undefined, spich, garn);
  hfull.push({ mapIdx, q: enc(q), r: enc(r), soc: soc.kind, socValue: soc.kind === 'real' ? null : (soc.none ? { none: true } : { v: slimSoc(soc.value) }), difficulty,
    ludnosc: enc(ludnosc), tiles, built, hasWater: hasWater === undefined ? null : hasWater, useCtx, ctxPop: enc(ctxPop), spich: enc(spich), garn: enc(garn), out: enc(got) });
}

// ---- P5: loadUpkeepParams / loadStorageParams / buildRationParams z uszkodzonych econ-params --------------------
function mutateEcon() {
  const e = structuredClone(DATA.econParams);
  const groups = ['ekonomia_miasta', 'budynki', 'globalne'];
  if (rnd() < 0.15) delete e[pick(groups)];
  for (const g of groups) {
    if (!e[g]) continue;
    for (const k of Object.keys(e[g])) {
      const row = e[g][k];
      if (row && typeof row === 'object') {
        if (rnd() < 0.08) delete e[g][k];
        else if (rnd() < 0.06) e[g][k] = pick(['x', 5, null, [1, 2], true]);
        else if (rnd() < 0.08) { const d = pick(['easy', 'normal', 'hard']); row[d] = pick(['x', null, true, [1], 7, -3.5, 0, 12345.678]); }
        else if (rnd() < 0.05) delete row[pick(['easy', 'normal', 'hard'])];
      }
    }
  }
  if (rnd() < 0.2 && e.ekonomia_miasta) { const x = e.ekonomia_miasta; delete e.ekonomia_miasta; e.racje_zywnosc_1 = x.racje_zywnosc_1; e.racje_zywnosc_2 = x.racje_zywnosc_2; e.racje_wzrost_proc_3 = x.racje_wzrost_proc_3; }
  return e;
}
const p5direct = [];
for (let i = 0; i < 160; i++) {
  const econ = i === 0 ? structuredClone(DATA.econParams) : mutateEcon();
  const difficulty = pick(['easy', 'normal', 'hard']);
  const raw = econ;
  const up = W.loadUpkeepParams(raw, difficulty);
  const st = W.loadStorageParams(raw, difficulty);
  const ra = W.buildRationParams(raw, difficulty);
  // do wektora tylko pola czytane przez te trzy funkcje (grupy ekonomia_miasta/budynki/globalne + klucze racji na wierzchu; bez opisow)
  const slim = {};
  for (const [g, v] of Object.entries(econ)) {
    if (['ekonomia_miasta', 'budynki', 'globalne'].includes(g) && v && typeof v === 'object') {
      slim[g] = Object.fromEntries(Object.entries(v).map(([k, row]) => [k, row && typeof row === 'object' && !Array.isArray(row) ? Object.fromEntries(['easy', 'normal', 'hard'].filter((d) => d in row).map((d) => [d, row[d]])) : row]));
    } else if (/^racje_/.test(g)) slim[g] = v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(['easy', 'normal', 'hard'].filter((d) => d in v).map((d) => [d, v[d]])) : v;
  }
  p5direct.push({ econ: slim, difficulty, out: { upkeep: { ...encRec({ ...up, budynekUtrzymanieFlat: up.budynekUtrzymanieFlat }) }, storage: encRec(st), ration: encRec(ra) } });
}
const p5keys = { upkeep: Object.keys(W.loadUpkeepParams(DATA.econParams, 'normal')).sort(), storage: Object.keys(W.loadStorageParams(DATA.econParams, 'normal')).sort(), ration: Object.keys(W.buildRationParams(DATA.econParams, 'normal')).sort() };

// ---- P5: buildUnitUpkeepTable z uszkodzonych wierszy units.json ---------------------------------------------------
const unitDirect = [];
for (let i = 0; i < 120; i++) {
  const rows = [];
  const n = ri(0, 8);
  for (let k = 0; k < n; k++) {
    const row = {};
    const keys = [];
    if (rnd() < 0.9) keys.push(['Jednostka', pick(['U' + k, 'U' + k, '', 5, null, 'Wojownik', 'U1'])]);
    if (rnd() < 0.3) keys.push(['Utrzymanie surowiec (ilość)', pick([3, 'x', null])]);
    if (rnd() < 0.2) keys.push(['Utrzymanie (Pienia', pick([2, 'x'])]);
    if (rnd() < 0.6) keys.push(['Utrzymanie (Pieniadz/ture)', pick([1, 2, 0, 3.7, 'x', null, -1, true, [1]])]);
    if (rnd() < 0.5) keys.push(['Utrzymanie (Pieniądz/turę)', pick([4, 5.5, 'x', null])]);
    if (rnd() < 0.2) keys.push(['Utrzymanie zloto', pick([6, 'x'])]);
    if (rnd() < 0.8) keys.push(['Epoka', pick(['Kamień', 'Brąz', 'Żelazo', 'Starożytność', 1, 2, 3, 1.5, 0, null, 'x', true, ''])]);
    for (let j = keys.length - 1; j > 0; j--) { const t = ri(0, j); [keys[j], keys[t]] = [keys[t], keys[j]]; }
    for (const [kk, vv] of keys) row[kk] = vv;
    rows.push(row);
  }
  unitDirect.push({ rowsJson: JSON.stringify(rows), out: Object.fromEntries(Object.entries(W.buildUnitUpkeepTable(rows)).map(([k, v]) => [k, enc(v)])) });
}

// ---- hriver: dostep do wody na malych mapach z JEDNOHEKSOWYMI i krotkimi riverPaths (generowane PO wszystkim innym,
// zeby nie zmieniac strumienia PRNG wczesniejszych klas) -----------------------------------------------------------
const hriver = [];
for (let i = 0; i < 80; i++) {
  const w = 5; const h = 5;
  const rows = [];
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) rows.push([q, r, 'laka', 'brak', rnd() < 0.08 ? 1 : 0, null, null, null]);
  const rivers = [];
  const np = ri(0, 3);
  for (let k = 0; k < np; k++) {
    const len = pick([1, 1, 2, 3]);
    let q = ri(-1, w); let r = ri(-1, h);
    const path = [[q, r]];
    for (let j = 1; j < len; j++) { const [dq, dr] = pick(NB); q += dq; r += dr; path.push([q, r]); }
    rivers.push(path);
  }
  const m = { w, h, hexes: rows, rivers };
  let q = ri(-1, w); let r = ri(-1, h);
  if (rivers.length && rnd() < 0.6) { [q, r] = pick(pick(rivers)); } // miasto dokladnie na heksie z riverPaths
  hriver.push({ map: m, q, r, water: W.cityHasWaterAccess({ q, r }, toWebMap(m)) });
}
const out = {
  pin: PIN,
  maps: MAPS,
  lasFirstIdx: LAS_FIRST_IDX,
  p5keys,
  unitTable: Object.fromEntries(Object.entries(unitTable).map(([k, v]) => [k, enc(v)])),
  scenarios: scenarios.map((s) => ({
    name: s.name, cls: s.cls, mapIdx: s.mapIdx, difficulty: s.difficulty, playerEra: s.playerEra, eraByOwner: s.eraByOwner, praca: s.praca,
    cities: s.cities.map((c) => ({ id: c.id, owner: c.owner, q: c.q, r: c.r, pop: c.pop, tryb: c.tryb ?? null, focus: c.focus ?? null, surowce: c.surowce === null ? null : encRec(c.surowce), built: c.built })),
    out: s.out,
  })),
  directPraca, hdirect, hparams, hfull, p5direct, unitDirect, hriver,
};
mkdirSync(outDir, { recursive: true });
const text = JSON.stringify(out);
writeFileSync(join(outDir, 'q3.json'), text);
const nz = (f) => scenarios.filter(f).length;
console.log('scenarios', scenarios.length, 'directPraca', directPraca.length, 'hdirect', hdirect.length, 'hparams', hparams.length, 'hfull', hfull.length, 'p5direct', p5direct.length, 'unitDirect', unitDirect.length, 'bytes', text.length);
console.log('praca-niepuste', nz((s) => Object.keys(s.out.praca).length > 0), 'zdrowie!=0', nz((s) => s.out.zdrowie.some(([, v]) => v !== 0)),
  'hdirect water', hdirect.filter((h) => h.water).length, 'total-dist', JSON.stringify([...new Set(hdirect.map((h) => h.total))].sort().slice(0, 40)));
