// Generator wektorow R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q2A-Q1 (wejscia terenowe advanceCityEconomy).
// PIN weba: 4bbef081d. Uruchamiany jest PRAWDZIWY `advanceCityEconomy` (gra/src/game/turn-economy.ts) na
// prawdziwej mapie (heksy z terenem/nakladka/rzeka/ulepszeniami/zlozem) i prawdziwym `loadGameData()`, bez zmian kodu
// na dysku. Instrumentacja W PAMIECI (plugin esbuild): tuz przed `tickEmpireResourcePipeline` (linia 2482 pinu)
// zapisywane sa `territoryResourceByCity`, `workedMagazynByCity`, `lostToSiblingByCity` oraz `okolicaReczne` miast
// PO `reconcileAllWorkedTiles`. Dodatkowo bezposrednie wolania eksportowanych `computeTerritoryResourceYieldByCity` /
// `computeWorkedMagazynYieldsByCity` z wezlami fort/posterunek (klasa `direct`).
// Zrodla z czystego `git archive 4bbef081d gra/src gra/data` do <WORK_DIR> poza repo (zero buildu/dev w gra/).
//
// Uruchomienie: node gen-p6-adv-q2a-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>
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

const CALL_HEAD = `  const spichlerzByCity = tickEmpireResourcePipeline(
    cities,
    builtByCity,
    territoryResourceByCity,
    workedMagazynByCity,`;
const CAPTURE = `  globalThis.__cap = {
    terr: [...territoryResourceByCity], worked: [...workedMagazynByCity],
    lost: [...lostToSiblingByCity].map(([k, v]) => [k, [...v]]),
    reczne: cities.map((c) => (c.okolicaReczne ? Object.entries(c.okolicaReczne) : null)),
  };
${CALL_HEAD}`;

const built = await esbuild.build({
  stdin: {
    contents: `export { advanceCityEconomy, computeTerritoryResourceYieldByCity, computeWorkedMagazynYieldsByCity, hexToWorkedTile } from './turn-economy';
export { computeLostToNearerSiblingByCity, foodPotentialOfMapHex } from './okolica';
export { tileYield } from './economy';
export { loadGameData } from '../data/loader';`,
    resolveDir: game, loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', loader: { '.json': 'json', '.png': 'dataurl' },
  plugins: [{ name: 'capture', setup(b) {
    b.onLoad({ filter: /game[\\/]turn-economy\.ts$/ }, (a) => {
      const src = readFileSync(a.path, 'utf8');
      if (src.split(CALL_HEAD).length !== 2) throw new Error('CALL_HEAD: oczekiwano dokladnie 1 wystapienia');
      return { contents: src.replace(CALL_HEAD, CAPTURE), loader: 'ts' };
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

let seed = 0x9a2e4c01;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[ri(0, arr.length - 1)];

// ---- mapy (kompaktowo: [q,r,teren,nakladka,rzeka,ulepszenie,ulepszenia,zloze]) -------------------------------------
const TERRAINS = ['laka', 'rownina', 'wzgorza', 'gory', 'plytkie_morze', 'morze', 'pustynia', 'polarny'];
const TER_W = [4, 4, 3, 1, 1, 1, 1, 1];
const OVERLAYS = ['brak', 'las', 'zloze_gliny', 'zloze_rudy', 'zloze_konia', 'zloze_owiec', 'zloze_bydla', 'zloze_lamy'];
const OVL_W = [10, 6, 1, 1, 1, 1, 1, 1];
const IMPS = ['tartak', 'kamieniolom', 'glinianka', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'warzelnia_soli', 'stadnina',
  'kopalnia_zlota', 'farma', 'irygacja', 'droga', 'fort', 'posterunek', 'kopalnia', 'Tartak', ' tartak ', 'nieznane', 'brak', 'bydlo', 'wyrab'];
const ZLOZA = ['rudy', 'zelaza', 'zlota', 'miedzi', 'x'];
const wpick = (arr, w) => { let t = rnd() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < arr.length; i++) { t -= w[i]; if (t < 0) return arr[i]; } return arr[arr.length - 1]; };
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
function rectMap(w, h, impP, hole, shuffle) {
  const rows = [];
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) if (rnd() >= hole) rows.push(randHexRow(q, r, impP));
  if (shuffle) for (let i = rows.length - 1; i > 0; i--) { const j = ri(0, i); [rows[i], rows[j]] = [rows[j], rows[i]]; }
  return { w, h, hexes: rows };
}
function hexMap(cx, cy, radius, impP) { // heksagonalna mapa o promieniu `radius` wokol (cx,cy)
  const rows = [];
  for (let dq = -radius; dq <= radius; dq++) for (let dr = Math.max(-radius, -dq - radius); dr <= Math.min(radius, -dq + radius); dr++) rows.push(randHexRow(cx + dq, cy + dr, impP));
  return { w: 2 * radius + 1 + cx, h: 2 * radius + 1 + cy, hexes: rows };
}
const MAPS = [];
for (let i = 0; i < 6; i++) MAPS.push(rectMap(ri(9, 13), ri(9, 13), 0.35, i < 2 ? 0 : 0.06, i % 2 === 1));
MAPS.push(rectMap(15, 15, 0.5, 0, false)); // 6: gesta (klasa pair)
MAPS.push(hexMap(20, 20, 18, 0.3)); // 7: pierscienie (klasa edgepop)

const toWebMap = (m) => {
  const hexes = {};
  for (const [q, r, ter, nak, riv, ul, uls, zl] of m.hexes) {
    const h = { coords: { q, r }, terenBazowy: ter, nakladka: nak, rzeka: { obecna: !!riv } };
    if (ul !== null) h.ulepszenie = ul;
    if (uls !== null) h.ulepszenia = uls.slice();
    if (zl !== null) h.zloze = zl;
    hexes[q + ',' + r] = h;
  }
  return { szerokoscQ: m.w, wysokoscR: m.h, hexes, seed: 1, rzeki: [] };
};

// ---- scenariusze -----------------------------------------------------------------------------------------------
const KEYS = ['drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'sol', 'zloto', 'kon', 'cegla', 'ceramika'];
const BUILT = ['magazyn', 'magazyn', 'stolarnia', 'kamieniarski', 'mennica', 'farma', 'spichlerz', 'cegielnia', 'garncarnia', 'akwedukt'];
const SUBSET = new Set(['magazyn', 'farma', 'akwedukt', 'stolarnia', 'kamieniarski']);
const POPS = [-1, 0.5, 2.5, 3.7, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 8, 10, 13, 15, 16, 17];
const TRYB = [undefined, 'auto', 'auto', 'reczny', 'reczny'];
const FOCUS = [undefined, 'zrownowazone', 'zywnosc', 'produkcja', 'podatki'];

function reczneFor(c, cities) {
  if (rnd() < 0.35) return undefined;
  const out = [];
  const n = ri(0, 7);
  for (let i = 0; i < n; i++) {
    let key;
    const m = rnd();
    if (m < 0.1) key = pick(['abc', 'x,y', '1;2', ',', '']);
    else if (m < 0.2) { const o = pick(cities); key = o.q + ',' + o.r; }
    else key = (c.q + ri(-9, 9)) + ',' + (c.r + ri(-9, 9));
    if (out.some(([k]) => k === key)) continue;
    out.push([key, pick([0, 1, 1, 2, -1, 0.5])]);
  }
  return out;
}

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
    c.reczne = c.reczne === undefined ? reczneFor(c, cities) : c.reczne;
    if (c.surowce === undefined) c.surowce = rnd() < 0.85 ? Object.fromEntries(KEYS.filter(() => rnd() < 0.5).map((k) => [k, rnd() < 0.15 ? ri(0, 6) : ri(0, 120)])) : null;
    if (c.built === undefined) { const pool = rnd() < 0.5 ? BUILT.filter((b) => SUBSET.has(b)) : BUILT; c.built = [...new Set(Array.from({ length: ri(0, 5) }, () => pick(pool)))]; }
  }
  const own = [...new Set(cities.map((c) => c.owner))];
  return {
    name, cls, mapIdx, difficulty: pick(['easy', 'normal', 'hard']), playerEra: pick([1, 1, 2, 3]),
    eraByOwner: rnd() < 0.5 ? Object.fromEntries(own.map((o) => [o, pick([1, 1, 2, 3, 4, 1.5, 0])])) : null,
    cities, ...extra,
  };
}

const scenarios = [];
for (let i = 0; i < 320; i++) {
  const mapIdx = ri(0, 5);
  scenarios.push(finishScenario(`rand-${i}`, 'rand', mapIdx, genCities(mapIdx, ri(1, 6), rnd() < 0.6)));
}
// brzegi N-1/N/N+1: jedno miasto o populacji 0..17 na mapie pierscieni (promien terytorium i okolicy vs ulepszenia na kazdym dystansie)
for (let pop = 0; pop <= 17; pop++) {
  const reczne = pop % 3 === 0 ? [] : undefined;
  scenarios.push(finishScenario(`edgepop-${pop}`, 'edgepop', 7, [{ id: 'k' + pop, owner: 0, q: 20, r: 20, pop, tryb: pop % 3 === 0 ? 'reczny' : 'auto', reczne }]));
}
// spor sasiadow: dwa miasta w odleglosci d 1..6 (os q), populacje {1,3,5}, ten sam / rozni wlasciciele; remisy na osi
for (let d = 1; d <= 6; d++) for (const pa of [1, 3, 5]) for (const pb of [1, 3, 5]) for (const same of [true, false]) {
  scenarios.push(finishScenario(`pair-d${d}-${pa}-${pb}-${same ? 'same' : 'diff'}`, 'pair', 6, [
    { id: 'A', owner: 0, q: 3, r: 7, pop: pa, tryb: 'auto' }, { id: 'B', owner: same ? 0 : 1, q: 3 + d, r: 7, pop: pb, tryb: 'auto' },
  ]));
}
// spor z trzecim miastem
for (let i = 0; i < 24; i++) {
  scenarios.push(finishScenario(`triple-${i}`, 'pair', 6, [
    { id: 'A', owner: 0, q: 4, r: 4, pop: pick([2, 3, 5]), tryb: 'auto' },
    { id: 'B', owner: pick([0, 0, 1]), q: 4 + ri(1, 4), r: 4 + ri(-2, 2), pop: pick([2, 3, 5]), tryb: 'auto' },
    { id: 'C', owner: pick([0, 0, 1]), q: 4 + ri(-2, 3), r: 4 + ri(2, 5), pop: pick([2, 3, 5]), tryb: pick(['auto', 'reczny']) },
  ]));
}

// brzegi capu panstwa (N-1/N/N+1 wokol cap-plon): 1 miasto i 2 miasta, 0/1 Magazyn, epoka 1/2; zapas = cap + d
for (const mag of [0, 1]) for (const era of [1, 2]) for (const two of [false, true]) for (const d of [-400, -200, -60, -10, -1, 0, 1]) {
  const cap = (50000 + 500 * mag) * (era === 2 ? 2 : 1);
  const total = cap + d;
  const a = two ? Math.floor(total / 2) : total;
  const mk = (id, q, r, v) => ({ id, owner: 0, q, r, pop: 4, tryb: 'auto', built: mag ? ['magazyn', 'stolarnia'] : ['stolarnia'], surowce: { drewno: v, kamien: v - 3, glina: v, ruda: v } });
  const cs = [mk('A', 4, 4, a)];
  if (two) cs.push(mk('B', 9, 4, total - a));
  const sc = finishScenario(`capedge-m${mag}-e${era}-${two ? 2 : 1}-d${d}`, 'capedge', 6, cs);
  sc.eraByOwner = { 0: era };
  scenarios.push(sc);
}

function runWeb(s) {
  const cities = s.cities.map((c) => {
    const o = { id: c.id, ownerId: c.owner, q: c.q, r: c.r, name: c.id, population: c.pop };
    if (c.surowce !== null) o.surowce = { ...c.surowce };
    if (c.tryb !== undefined) o.okolicaTryb = c.tryb;
    if (c.focus !== undefined) o.okolicaFocus = c.focus;
    if (c.reczne !== undefined) o.okolicaReczne = Object.fromEntries(c.reczne);
    return o;
  });
  const builtByCity = new Map(s.cities.map((c) => [c.id, c.built.slice()]));
  const resolveOwnerEra = s.eraByOwner ? (o) => s.eraByOwner[o] : undefined;
  const res = W.advanceCityEconomy(
    cities, toWebMap(MAPS[s.mapIdx]), DATA, s.difficulty, [], new Map(), builtByCity, s.playerEra, new Set(), new Map(), new Map(),
    resolveOwnerEra, undefined, 'wysoki', new Map(), new Map(), new Map(), new Map(),
  );
  const cap = globalThis.__cap;
  const nested = (m) => Object.fromEntries(m.map(([k, v]) => [k, encRec(v)]));
  return {
    cities: cities.map((c) => ({ id: c.id, surowce: c.surowce === undefined ? null : encRec(c.surowce) })),
    perCity: res.perCity.map((t) => ({ id: t.cityId, maSpichlerz: t.maSpichlerz, maSpichlerzII: t.maSpichlerzII, spichlerzCeramika: t.spichlerzCeramika, spichlerzSol: t.spichlerzSol, garncarnia: enc(t.garncarniaSurplusZadowolenie) })),
    terr: nested(cap.terr), worked: nested(cap.worked),
    lost: Object.fromEntries(cap.lost.map(([k, v]) => [k, v])),
    reczne: cap.reczne,
  };
}
for (const s of scenarios) s.out = runWeb(s);

// ---- bezposrednie wolania z wezlami fort/posterunek -------------------------------------------------------------
const direct = [];
for (let i = 0; i < 90; i++) {
  const mapIdx = ri(0, 5);
  const sc = finishScenario(`direct-${i}`, 'direct', mapIdx, genCities(mapIdx, ri(1, 5), rnd() < 0.6));
  const m = MAPS[mapIdx];
  const forts = [];
  const nf = ri(0, 4);
  for (let k = 0; k < nf; k++) {
    const kind = rnd() < 0.5 ? 'fort' : 'outpost';
    const f = { q: ri(0, m.w - 1), r: ri(0, m.h - 1), kind, owner: ri(0, 2) };
    if (rnd() < 0.6) f.order = { turn: ri(1, 5), seq: ri(0, 4) };
    forts.push(f);
  }
  const cities = sc.cities.map((c) => {
    const o = { id: c.id, ownerId: c.owner, q: c.q, r: c.r, population: c.pop, name: c.id };
    if (c.tryb !== undefined) o.okolicaTryb = c.tryb;
    if (c.focus !== undefined) o.okolicaFocus = c.focus;
    if (c.reczne !== undefined) o.okolicaReczne = Object.fromEntries(c.reczne);
    return o;
  });
  const cityNodes = cities.map((c) => ({ q: c.q, r: c.r, pop: c.population, level: 1, ownerId: c.ownerId }));
  const fortNodes = forts.map((f) => ({ q: f.q, r: f.r, pop: 0, level: 1, ownerId: f.owner, ...(f.kind === 'fort' ? { isFort: true } : { isOutpost: true }), ...(f.order ? { order: f.order } : {}) }));
  const fortsFirst = rnd() < 0.4;
  const nodes = fortsFirst ? [...fortNodes, ...cityNodes] : [...cityNodes, ...fortNodes];
  const eraTbl = { 0: pick([1, 2, 3, 4]), 1: pick([1, 2, 3]), 2: pick([1, 2, 3, 1.5]) };
  const webMap = toWebMap(m);
  const terr = W.computeTerritoryResourceYieldByCity(cities, webMap, nodes, (o) => eraTbl[o]);
  const worked = W.computeWorkedMagazynYieldsByCity(cities, webMap, nodes);
  const lost = W.computeLostToNearerSiblingByCity(cities, webMap);
  direct.push({
    name: sc.name, mapIdx, cities: sc.cities.map((c) => ({ id: c.id, owner: c.owner, q: c.q, r: c.r, pop: c.pop, tryb: c.tryb ?? null, focus: c.focus ?? null, reczne: c.reczne ?? null })),
    forts, fortsFirst, eraTbl,
    out: { terr: Object.fromEntries([...terr].map(([k, v]) => [k, encRec(v)])), worked: Object.fromEntries([...worked].map(([k, v]) => [k, encRec(v)])),
      lost: Object.fromEntries([...lost].map(([k, v]) => [k, [...v]])) },
  });
}

// plony pol i potencjal zywnosci z URUCHOMIONEGO weba, per mapa (wejscie niezaleznego weryfikatora Pythona; Rust ich nie uzywa)
const tileYields = MAPS.map((m) => {
  const wm = toWebMap(m);
  return Object.fromEntries(Object.keys(wm.hexes).map((k) => {
    const y = W.tileYield(W.hexToWorkedTile(wm.hexes[k]));
    return [k, [y.zywnosc, y.praca, y.handel, y.drewno, y.kamien, y.glina].map(enc).concat([enc(W.foodPotentialOfMapHex(wm, wm.hexes[k].coords.q, wm.hexes[k].coords.r))])];
  }));
});

const out = {
  pin: PIN,
  maps: MAPS,
  tileYields,
  scenarios: scenarios.map((s) => ({
    name: s.name, cls: s.cls, mapIdx: s.mapIdx, difficulty: s.difficulty, playerEra: s.playerEra, eraByOwner: s.eraByOwner,
    cities: s.cities.map((c) => ({ id: c.id, owner: c.owner, q: c.q, r: c.r, pop: c.pop, tryb: c.tryb ?? null, focus: c.focus ?? null, reczne: c.reczne ?? null, surowce: c.surowce === null ? null : encRec(c.surowce), built: c.built })),
    out: s.out,
  })),
  direct,
};
mkdirSync(outDir, { recursive: true });
const text = JSON.stringify(out);
writeFileSync(join(outDir, 'q2a.json'), text);
const nonEmpty = scenarios.filter((s) => Object.keys(s.out.terr).length > 0).length;
const nonEmptyW = scenarios.filter((s) => Object.keys(s.out.worked).length > 0).length;
const lostN = scenarios.filter((s) => Object.keys(s.out.lost).length > 0).length;
console.log('scenarios', scenarios.length, 'direct', direct.length, 'terr-niepuste', nonEmpty, 'worked-niepuste', nonEmptyW, 'lost-niepuste', lostN, 'bytes', text.length);
