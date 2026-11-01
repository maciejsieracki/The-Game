// P6.M07B-Q2 runda 4 - generator wektorow DODATKOWYCH z URUCHOMIONEGO kodu weba (pin edb8fb56).
//
// Cel: zabic mutanty K/L z FC r2 (G05, G06, G11, G12, G14, M11, W06, E28) i dodac pokrycie
// `landCenterSquare != null` (G13/G17). Wektory `web-rivers-b-q2r4.json` uzupelniaja
// `web-rivers-b-coast-grow.json` i `web-rivers-b-edges.json`.
//
// Uzycie (katalog tymczasowy poza repo):
//   git archive -o <DIR>/pin.tar edb8fb56 gra/src gra/data ; tar -x -f <DIR>/pin.tar -C <DIR>
//   node --experimental-strip-types gen_q2_r4_vectors.mjs <DIR>/gra/src/map/gen-helpers.ts \
//        <DIR>/gra/src/types/hex.ts <wyjscie.json>
//
// Zaleznosci i funkcje docelowe wyciagane DOSLOWNIE z pinu. WARIANTY `V*` (kopie funkcji weba
// z jedna zmiana tekstowa, odpowiadajaca mutantowi Rust) sluza WYLACZNIE do wyszukiwania
// przypadkow rozrozniajacych mutanta; `out` w wektorze pochodzi zawsze z NIEZMIENIONEJ funkcji.
// Pole `kills` w przypadku = ktore warianty daly INNE wyjscie niz oryginal (dowod zabijalnosci).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SEED = 0x5eed2029;
const [, , srcArg, hexArg, outArg] = process.argv;
if (!srcArg || !hexArg || !outArg) {
  console.error('usage: node --experimental-strip-types gen_q2_r4_vectors.mjs <gen-helpers.ts> <types/hex.ts> <out.json>');
  process.exit(2);
}

// ---- 1. ekstrakcja z pinu --------------------------------------------------------------
const lines = fs.readFileSync(srcArg, 'utf8').split('\n');
const hexSrc = fs.readFileSync(hexArg, 'utf8');

function extract(prefix, kind) {
  const i = lines.findIndex((l) => l.startsWith(prefix));
  if (i < 0) throw new Error(`brak w pinie: ${prefix}`);
  const out = [];
  for (let j = i; j < lines.length; j++) {
    out.push(lines[j]);
    if (kind === 'fn' && lines[j] === '}') break;
    if (kind === 'const' && lines[j].trimEnd().endsWith(';')) break;
  }
  return out.join('\n');
}

const enumStart = hexSrc.indexOf('export enum TerenBazowy {');
if (enumStart < 0) throw new Error('brak enum TerenBazowy w pinie');
const enumBody = hexSrc.slice(enumStart, hexSrc.indexOf('}', enumStart));
const tbEntries = {};
for (const m of enumBody.matchAll(/(\w+)\s*=\s*'([^']+)'/g)) tbEntries[m[1]] = m[2];
const tbStub = `const TerenBazowy = ${JSON.stringify(tbEntries)};`;

const growSrc = extract('function growRiverFromCoastInland', 'fn');
const sanSrc = extract('function sanitizeRiverTurnWindow', 'fn');

// wariant = kopia funkcji z jedna podmiana (asercja: podmiana musi zadzialac)
function variant(src, name, orig, from, to) {
  if (!src.includes(from)) throw new Error(`wariant ${name}: brak fragmentu ${from}`);
  return src.replace(`function ${orig}`, `export function ${name}`).replace(from, to);
}
const FILTER1 = 'collectCoastInlandGrowCandidates(growBase)\n      .filter((c) => !visited.has(hexKey(c.q, c.r)));';
const FILTER2 = 'relaxHardMeander: true })\n        .filter((c) => !visited.has(hexKey(c.q, c.r)));';
const growVariants = [
  variant(growSrc, 'growV05', 'growRiverFromCoastInland', FILTER1, 'collectCoastInlandGrowCandidates(growBase);'),
  variant(growSrc, 'growV06', 'growRiverFromCoastInland', FILTER2, 'relaxHardMeander: true });'),
  variant(growSrc, 'growV11', 'growRiverFromCoastInland', '    visited.add(hexKey(pick.q, pick.r));\n', ''),
  variant(growSrc, 'growV12', 'growRiverFromCoastInland', 'const visited = new Set<string>([mouthKey]);', 'const visited = new Set<string>();'),
  // G17: kwadrat centrum nie przekazany do opcji (Rust: land_center_square: None w bazie)
  variant(growSrc, 'growV17', 'growRiverFromCoastInland', 'landCentroid: centroid, landCenterSquare, rand,', 'landCentroid: centroid, landCenterSquare: null, rand,'),
];
const sanVariants = [46, 47, 49, 50, 51].map((cap) =>
  variant(sanSrc, `sanV${cap}`, 'sanitizeRiverTurnWindow', 'guard < 48 &&', `guard < ${cap} &&`));

const parts = [
  'export type RiverCoord = { q: number; r: number };',
  tbStub,
  extract('export const HEX_DIRECTIONS', 'const'),
  extract('export const RIVER_TURN_WINDOW_HEX', 'const'),
  extract('export const RIVER_TURN_WINDOW_MAX_SUM', 'const'),
  extract('export const RIVER_MIN_INLAND_FROM_SEA', 'const'),
  extract('export const RIVER_HARD_MEANDER_LEN', 'const'),
  extract('export const MAIN_RIVER_MIN_PATH_SEP', 'const'),
  extract('const RIVER_SPATIAL_CELL', 'const'),
  extract('export const CONTINENT_CENTER_SQUARE_SIZE', 'const'),
  extract('function hexAxialDistance', 'fn'),
  extract('export function hexKey', 'fn'),
  extract('function parseHexKey', 'fn'),
  extract('function isWaterTerrainLocal', 'fn'),
  extract('export function isDryLandTerrain', 'fn'),
  extract('function isReliefTerrain', 'fn'),
  extract('function canRiverFlowThrough', 'fn'),
  extract('function isRiverLandTerrain', 'fn'),
  extract('function neighborDirIndex', 'fn'),
  extract('function riverHexDirDelta', 'fn'),
  extract('function signedRiverDirDelta', 'fn'),
  extract('function pathSegmentDirs', 'fn'),
  extract('function pathSignedTurnDeltas', 'fn'),
  extract('function isRiverWindowTurnAllowed', 'fn'),
  extract('function riverStepDir', 'fn'),
  extract('function sameRiverDir', 'fn'),
  extract('export function riverSegmentUnitVector', 'fn'),
  extract('export function riverPathHasSharpUTurn', 'fn'),
  extract('export function riverPathViolatesTurnWindow', 'fn'),
  extract('export function sanitizeRiverPath', 'fn'),
  extract('export function repairRiverPathAdjacency', 'fn'),
  extract('export function computeLandMassCentroid', 'fn'),
  extract('export function continentCenterSquare', 'fn'),
  extract('export function hexDistanceToCenterSquare', 'fn'),
  extract('function scoreRiverStepTowardCentroid', 'fn'),
  extract('function scoreRiverStepTowardCenterSquare', 'fn'),
  extract('function scoreRiverStepTowardLandCenter', 'fn'),
  extract('export function riverGrowStepPassesSep', 'fn'),
  extract('export function nearestRiverHexDistance', 'fn'),
  extract('export class RiverHexSpatialIndex', 'fn'),
  extract('function estimateLandCentroidFromSeed', 'fn'),
  extract('function estimateLandCentroidFromMouth', 'fn'),
  extract('function collectCoastInlandGrowCandidates', 'fn'),
  extract('function findRiverMeanderStep', 'fn'),
  extract('function simplifyRiverRenderPath', 'fn'),
  extract('function riverHexCornerStep', 'fn'),
  extract('function walkRiverHexPerimeter', 'fn'),
  extract('function riverCornersAlongHexEdges', 'fn'),
]
  .map((s) => s.replace(/^function /m, 'export function '))
  .concat([growSrc.replace(/^function /m, 'export function '), sanSrc.replace(/^function /m, 'export function ')])
  .concat(growVariants, sanVariants);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'm07b2-q2r4-'));
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}\n');
const tsFile = path.join(tmp, 'web-q2r4.ts');
fs.writeFileSync(tsFile, parts.join('\n\n') + '\n');
const web = await import(pathToFileURL(tsFile).href);

// ---- 2. PRNG, mapy ------------------------------------------------------------------------
function mulberry(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry(SEED);
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const newSeed = () => Math.floor(rnd() * 4294967296) >>> 0;
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const keyOf = (q, r) => `${q},${r}`;
const hexDist = (q, r) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
const flat = (p) => p.flatMap(([q, r]) => [q, r]);
const toObjs = (p) => p.map(([q, r]) => ({ q, r }));
const WATER = (h) => h.t === 'morze' || h.t === 'plytkie_morze';

const LAND_KEYS = ['laka', 'laka', 'laka', 'laka', 'rownina', 'rownina', 'rownina', 'pustynia', 'wzgorza', 'gory', 'polarny'];
const OVERLAYS = ['brak', 'brak', 'brak', 'las', 'zloze_rudy', 'zloze_gliny'];

// Mapa kolista o promieniu R: pierscien morza, jeziora, relief, nakladki takze na wodzie (lekcja a).
function roundMap(R, { lake = 0.03, relief = 1, ringW = 2, riverP = 0.02, missing = 0.005 } = {}) {
  const list = [];
  for (let q = -R; q <= R; q++) {
    for (let r = -R; r <= R; r++) {
      if (hexDist(q, r) > R) continue;
      if (rnd() < missing) continue;
      const d = hexDist(q, r);
      let t;
      if (d >= R - ringW + (rnd() < 0.4 ? 1 : 0)) t = rnd() < 0.5 ? 'morze' : 'plytkie_morze';
      else if (d < R - 3 && rnd() < lake) t = rnd() < 0.5 ? 'morze' : 'plytkie_morze';
      else {
        t = pick(LAND_KEYS);
        if (relief === 0 && (t === 'wzgorza' || t === 'gory')) t = 'laka';
      }
      const n = pick(OVERLAYS);
      const z = rnd() < 0.08;
      let rz = null;
      const u = rnd();
      if (u < riverP) {
        const edges = [];
        const k = ri(1, 3);
        while (edges.length < k) {
          const e = ri(0, 5);
          if (!edges.includes(e)) edges.push(e);
        }
        rz = { obecna: true, krawedzie: edges };
      } else if (u < riverP + 0.01) rz = { obecna: false, krawedzie: [] };
      list.push({ k: keyOf(q, r), q, r, t, n, z, rz });
    }
  }
  return list;
}
function hexesObj(list) {
  const o = {};
  for (const h of list) {
    o[h.k] = {
      q: h.q, r: h.r, terenBazowy: h.t, nakladka: h.n,
      zloze: h.z ? { typ: 'test' } : undefined,
      rzeka: h.rz === null ? undefined : { obecna: h.rz.obecna, krawedzie: [...h.rz.krawedzie] },
    };
  }
  return o;
}
function bfs(list, sourcePred) {
  const byKey = new Map(list.map((h) => [h.k, h]));
  const dist = {};
  const queue = [];
  for (const h of list) if (sourcePred(h)) { dist[h.k] = 0; queue.push(h); }
  let qi = 0;
  while (qi < queue.length) {
    const cur = queue[qi++];
    for (const [dq, dr] of DIRS) {
      const nk = keyOf(cur.q + dq, cur.r + dr);
      if (!byKey.has(nk) || nk in dist) continue;
      dist[nk] = dist[cur.k] + 1;
      queue.push(byKey.get(nk));
    }
  }
  return dist;
}
function makeMap(list) {
  return {
    list,
    obj: hexesObj(list),
    sea: bfs(list, WATER),
    ocean: bfs(list, (h) => h.t === 'morze'),
    keys: list.map((h) => h.k),
  };
}
function startFrom(mp, kind) {
  const land = mp.list.filter((h) => !WATER(h));
  const inland = land.filter((h) => (mp.sea[h.k] ?? 0) >= 2);
  const coastal = land.filter((h) => (mp.sea[h.k] ?? 0) === 1);
  const pool = kind === 'coastal' ? (coastal.length ? coastal : land) : inland.length ? inland : land;
  const h = pick(pool);
  return [h.q, h.r];
}
const blockSubset = (list) => {
  const n = ri(1, 12);
  const keys = [];
  for (let i = 0; i < n; i++) {
    const k = pick(list).k;
    if (!keys.includes(k)) keys.push(k);
  }
  return keys;
};

const maps = []; // wspolna lista map (indeks `m` w przypadkach)
const cases = [];
const stats = {};
const bump = (k, n = 1) => { stats[k] = (stats[k] ?? 0) + n; };
const t0 = Date.now();
const log = (s) => console.error(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${s}`);

// ---- 3. grow: petle (visited) i kwadrat centrum -------------------------------------------
const N_LONG = 16;
const longIdx = [];
for (let i = 0; i < N_LONG; i++) {
  const R = [14, 18, 22, 26][i % 4];
  const mp = makeMap(roundMap(R, { lake: i % 3 === 0 ? 0.0 : 0.01, relief: i % 4 === 1 ? 1 : 0, riverP: i % 5 === 0 ? 0.01 : 0 }));
  maps.push({ hexes: mp.list, sea: mp.sea, ocean: mp.ocean, mp });
  longIdx.push(maps.length - 1);
}

const KILL_TARGET = { G05: 40, G06: 25, G11: 40, G12: 25, G17: 40 };
const killCount = { G05: 0, G06: 0, G11: 0, G12: 0, G17: 0 };
const growFns = { G05: web.growV05, G06: web.growV06, G11: web.growV11, G12: web.growV12, G17: web.growV17 };
const need = () => Object.keys(KILL_TARGET).some((k) => killCount[k] < KILL_TARGET[k]);
let trials = 0;
const MAX_TRIALS = Number(process.env.GROW_TRIALS ?? 30000);
let plain = 0;
while ((need() && trials < MAX_TRIALS) || plain < 150) {
  trials++;
  if (trials > MAX_TRIALS && plain >= 150) break;
  const m = pick(longIdx);
  const mp = maps[m].mp;
  const [mq, mr] = startFrom(mp, rnd() < 0.3 ? 'coastal' : 'inland');
  const useSq = rnd() < 0.4;
  const lc = !useSq && rnd() < 0.3 ? [rnd() * 6 - 3, rnd() * 6 - 3] : null;
  const bl = rnd() < 0.1 ? blockSubset(mp.list) : null;
  const useIdx = bl !== null && rnd() < 0.5;
  const sc = ri(60, 200);
  const hl = ri(0, 14);
  const rel = rnd() < 0.3;
  const msep = ri(0, 3);
  const seed = newSeed();
  const sq = useSq ? web.continentCenterSquare(mp.obj, mp.keys) : null;
  const run = (fn) => fn(
    mp.obj, mq, mr, new Map(Object.entries(mp.sea)), new Map(Object.entries(mp.ocean)), mulberry(seed),
    sc, hl, rel, bl === null ? undefined : new Set(bl), msep,
    lc === null ? null : { q: lc[0], r: lc[1] }, sq,
    useIdx ? web.RiverHexSpatialIndex.fromKeys(bl) : null);
  const real = run(web.growRiverFromCoastInland);
  const realS = JSON.stringify(real);
  const kills = [];
  for (const [id, fn] of Object.entries(growFns)) {
    if (id === 'G17' && !useSq) continue;
    if (JSON.stringify(run(fn)) !== realS) kills.push(id);
  }
  const useful = kills.some((k) => killCount[k] < KILL_TARGET[k]);
  if (!useful && !(kills.length === 0 && plain < 150 && real.length > 10)) continue;
  if (kills.length === 0) plain++;
  for (const k of kills) killCount[k]++;
  cases.push({
    fn: 'grow', m, mq, mr, sc, hl, rel, bl, msep, lc, ix: useIdx, sq: useSq, seed, kills,
    out: flat(real.map((h) => [h.q, h.r])),
  });
  bump(kills.length ? 'grow_kill' : 'grow_plain');
  if (useSq) bump('grow_square');
  if (trials % 5000 === 0) log(`grow trials=${trials} kills=${JSON.stringify(killCount)} plain=${plain}`);
}
log(`grow gotowe: trials=${trials} kills=${JSON.stringify(killCount)} plain=${plain}`);
for (const k of Object.keys(killCount)) stats[`kill_${k}`] = killCount[k];

// ---- 4. grow: duze mapy (G14: visitCap 6000 vs 3000 / 5999 / 6001) ---------------------------
// Warianty: `landCentroid` podane jawnie jako estimateLandCentroidFromMouth(..., cap) dla cap =
// 3000/5999/6001 - rownowazne zmianie stalej w growRiverFromCoastInland (centroid liczony tylko
// gdy landCentroid i kwadrat sa null). Wektor zapisuje wejscie z landCentroid = null.
const BIG_R = 46;
const bigIdx = [];
for (let i = 0; i < 2; i++) {
  const mp = makeMap(roundMap(BIG_R, { lake: 0.004, relief: 0, ringW: 1, riverP: 0, missing: 0 }));
  maps.push({ hexes: mp.list, sea: mp.sea, ocean: mp.ocean, mp });
  bigIdx.push(maps.length - 1);
}
const CAP_VARIANTS = [3000, 5999, 6001];
const capKills = { 3000: 0, 5999: 0, 6001: 0 };
const CAP_TARGET = { 3000: 12, 5999: 6, 6001: 6 };
let bigTrials = 0;
const BIG_MAX = Number(process.env.BIG_TRIALS ?? 400);
let bigPlain = 0;
for (const m of bigIdx) {
  const mp = maps[m].mp;
  const coastal = mp.list.filter((h) => !WATER(h) && (mp.sea[h.k] ?? 0) === 1);
  const land = mp.list.filter((h) => !WATER(h));
  log(`big map ${m}: hexes=${mp.list.length} land=${land.length} coastal=${coastal.length}`);
}
const capNeed = () => Object.keys(CAP_TARGET).some((k) => capKills[k] < CAP_TARGET[k]);
const centroidCache = new Map();
function centroidFor(m, mq, mr, rel, cap) {
  const id = `${m}|${mq},${mr}|${rel}|${cap}`;
  if (!centroidCache.has(id)) {
    centroidCache.set(id, web.estimateLandCentroidFromMouth(maps[m].mp.obj, mq, mr, rel, cap));
  }
  return centroidCache.get(id);
}
while ((capNeed() && bigTrials < BIG_MAX) || bigPlain < 10) {
  bigTrials++;
  if (bigTrials > BIG_MAX && bigPlain >= 10) break;
  const m = pick(bigIdx);
  const mp = maps[m].mp;
  const [mq, mr] = startFrom(mp, 'coastal');
  const rel = false;
  const cReal = centroidFor(m, mq, mr, rel, 6000);
  if (!cReal) continue;
  const cVar = Object.fromEntries(CAP_VARIANTS.map((c) => [c, centroidFor(m, mq, mr, rel, c)]));
  // kilka ziaren na ten sam start; ten sam start = N-1/N/N+1 na tym samym wejsciu
  for (let s = 0; s < 12; s++) {
    const sc = ri(20, 120);
    const hl = ri(0, 12);
    const msep = ri(0, 3);
    const seed = newSeed();
    const run = (c) => web.growRiverFromCoastInland(
      mp.obj, mq, mr, new Map(Object.entries(mp.sea)), new Map(Object.entries(mp.ocean)), mulberry(seed),
      sc, hl, rel, undefined, msep, c === null ? null : { q: c.q, r: c.r }, null, null);
    const real = web.growRiverFromCoastInland(
      mp.obj, mq, mr, new Map(Object.entries(mp.sea)), new Map(Object.entries(mp.ocean)), mulberry(seed),
      sc, hl, rel, undefined, msep, null, null, null);
    const realS = JSON.stringify(real);
    // kontrola: jawny centroid(6000) = to samo co domyslny
    if (JSON.stringify(run(cReal)) !== realS) throw new Error('centroid(6000) != domyslny');
    const kills = [];
    for (const c of CAP_VARIANTS) if (JSON.stringify(run(cVar[c])) !== realS) kills.push(c);
    const useful = kills.some((c) => capKills[c] < CAP_TARGET[c]);
    if (!useful && !(kills.length === 0 && bigPlain < 10)) continue;
    if (kills.length === 0) bigPlain++;
    for (const c of kills) capKills[c]++;
    cases.push({
      fn: 'grow', m, mq, mr, sc, hl, rel, bl: null, msep, lc: null, ix: false, sq: false, seed,
      kills: kills.map((c) => `CAP${c}`), out: flat(real.map((h) => [h.q, h.r])),
    });
    bump('grow_big');
  }
  if (bigTrials % 20 === 0) log(`big trials=${bigTrials} capKills=${JSON.stringify(capKills)} plain=${bigPlain}`);
}
log(`big gotowe: trials=${bigTrials} capKills=${JSON.stringify(capKills)}`);
for (const c of CAP_VARIANTS) stats[`kill_CAP${c}`] = capKills[c];

// ---- 5. meander: `cur` poza seaDist (M11: domyslne 999) i brakujace klucze sasiadow ---------
for (let i = 0; i < 1200; i++) {
  const m = pick(longIdx);
  const mp = maps[m].mp;
  const [cq, cr] = startFrom(mp, 'inland');
  const [dq, dr] = pick(DIRS);
  const dist = rnd() < 0.7 ? 2 : 3;
  const tq = cq + dist * dq + (dist === 3 ? ri(-1, 1) : 0);
  const tr = cr + dist * dr;
  const sea = new Map(Object.entries(mp.sea));
  const drop = [];
  if (i % 3 !== 2) { sea.delete(keyOf(cq, cr)); drop.push(keyOf(cq, cr)); }
  if (rnd() < 0.3) {
    const [nq, nr] = [cq + pick(DIRS)[0], cr + pick(DIRS)[1]];
    if (sea.delete(keyOf(nq, nr))) drop.push(keyOf(nq, nr));
  }
  const usedKeys = [];
  if (rnd() < 0.3) for (let j = 0; j < ri(1, 4); j++) usedKeys.push(pick(mp.list).k);
  const seed = newSeed();
  const out = web.findRiverMeanderStep(mp.obj, { q: cq, r: cr }, { q: tq, r: tr }, sea, new Set(usedKeys), mulberry(seed));
  cases.push({
    fn: 'meander', m, c: [cq, cr], t: [tq, tr], used: usedKeys, drop, seed,
    out: out === null ? null : [out.q, out.r],
  });
  bump(out === null ? 'meander_null' : 'meander_some');
  if (drop.includes(keyOf(cq, cr))) bump(out === null ? 'meander_nocur_null' : 'meander_nocur_some');
}

// ---- 6. sanitizeRiverTurnWindow: cap 48 (W06), N-1/N/N+1 na tym samym starcie ----------------
// Sciezki o ciaglym skrecie: kazde ciecie wierzcholka + naprawa daje kolejne naruszenie.
function curvyPath(len, bias, start) {
  const p = [start];
  let dir = ri(0, 5);
  for (let k = 0; k < len; k++) {
    const u = rnd();
    if (u < bias) dir = (dir + 1) % 6;
    else if (u < bias + 0.1) dir = (dir + 5) % 6;
    const [cq, cr] = p[p.length - 1];
    p.push([cq + DIRS[dir][0], cr + DIRS[dir][1]]);
  }
  return p;
}
// Zygzak: naprzemiennie kierunki d0 i d0+off (off = +-2 -> skret 120 st.): kazdy "zab" lamie okno
// skretu, a jedno ciecie naprawia dokladnie jeden zab -> liczba obrotow ~ liczba zebow.
function zigPath(teeth, start) {
  const d0 = ri(0, 5);
  const off = rnd() < 0.5 ? 2 : 4;
  const p = [start];
  for (let i = 0; i < teeth * 2; i++) {
    const dir = i % 2 === 0 ? d0 : (d0 + off) % 6;
    const [cq, cr] = p[p.length - 1];
    p.push([cq + DIRS[dir][0], cr + DIRS[dir][1]]);
    if (rnd() < 0.08) {
      const [aq, ar] = p[p.length - 1];
      p.push([aq + DIRS[dir][0], ar + DIRS[dir][1]]);
    }
  }
  return p;
}
const SAN_TARGET = { 47: 8, 49: 8 };
const sanKills = { 46: 0, 47: 0, 49: 0, 50: 0, 51: 0 };
const sanFns = { 46: web.sanV46, 47: web.sanV47, 49: web.sanV49, 50: web.sanV50, 51: web.sanV51 };
let sanTrials = 0;
const SAN_MAX = Number(process.env.SAN_TRIALS ?? 40000);
let sanPlain = 0;
while ((sanKills[47] < SAN_TARGET[47] || sanKills[49] < SAN_TARGET[49]) && sanTrials < SAN_MAX) {
  sanTrials++;
  const m = pick(longIdx);
  const mp = maps[m].mp;
  const land = mp.list.filter((h) => !WATER(h));
  const h0 = pick(land);
  const p = zigPath(ri(44, 66), [h0.q, h0.r]);
  const src = pick(land).k;
  const real = web.sanitizeRiverTurnWindow(toObjs(p), mp.obj, src);
  const realS = JSON.stringify(real);
  const kills = [];
  for (const [cap, fn] of Object.entries(sanFns)) {
    if (JSON.stringify(fn(toObjs(p), mp.obj, src)) !== realS) kills.push(Number(cap));
  }
  const useful = (kills.includes(47) && sanKills[47] < SAN_TARGET[47]) || (kills.includes(49) && sanKills[49] < SAN_TARGET[49]);
  if (!useful) continue;
  for (const c of kills) sanKills[c]++;
  cases.push({ fn: 'sanitize_window', m, p: flat(p), src, kills: kills.map((c) => `CAP${c}`), out: flat(real.map((h) => [h.q, h.r])) });
  bump('sanitize_cap');
  if (sanTrials % 2000 === 0) log(`san trials=${sanTrials} kills=${JSON.stringify(sanKills)}`);
}
log(`san gotowe: trials=${sanTrials} kills=${JSON.stringify(sanKills)}`);
for (const c of Object.keys(sanKills)) stats[`kill_SANCAP${c}`] = sanKills[c];
// zwykle przypadki okna (bez cap): kontrola ogolna
for (let i = 0; i < 300; i++) {
  const m = pick(longIdx);
  const mp = maps[m].mp;
  const land = mp.list.filter((h) => !WATER(h));
  const h0 = pick(land);
  const p = curvyPath(ri(8, 60), 0.2 + rnd() * 0.5, [h0.q, h0.r]);
  const src = i % 7 === 0 ? '99,99' : pick(land).k;
  const out = web.sanitizeRiverTurnWindow(toObjs(p), mp.obj, src);
  cases.push({ fn: 'sanitize_window', m, p: flat(p), src, kills: [], out: flat(out.map((h) => [h.q, h.r])) });
  bump('sanitize_plain');
}

// ---- 7. simplifyRiverRenderPath: cap 4000 (E28) - dlugie sciezki A,B,A,B,... ------------------
// Kazdy przebieg zewnetrznej petli usuwa 2 wpisy (a == c), wiec L=8002 wymaga dokladnie 4000
// przebiegow (N), L=8004 - wiecej niz 4000 (rozroznia 4000 od 4001), L=8000/7998 - mniej niz N.
function altPath(L, a, b) {
  const p = [];
  for (let i = 0; i < L; i++) p.push(i % 2 === 0 ? a : b);
  return p;
}
for (const L of [7998, 8000, 8001, 8002, 8003, 8004, 8006]) {
  for (const [a, b] of [[[0, 0], [1, 0]], [[3, -2], [3, -3]]]) {
    const p = altPath(L, a, b);
    const out = web.simplifyRiverRenderPath(toObjs(p));
    cases.push({ fn: 'simplify', p: flat(p), out: flat(out.map((h) => [h.q, h.r])) });
    bump('simplify_long');
  }
}

// ---- 8. corners/transit: pelna dziedzina parzystosci (-3..3) ----------------------------------
for (let i = 0; i < 6; i++) {
  for (let o = 0; o < 6; o++) {
    for (let par = -3; par <= 3; par++) {
      cases.push({ fn: 'corners', i, o, par, out: web.riverCornersAlongHexEdges(i, o, par) });
      bump('corners_full');
    }
  }
}

const doc = {
  format: 'p6-m07b2-q2r4-v1',
  pin: 'edb8fb56',
  seed: SEED,
  maps: maps.map((m) => ({ hexes: m.hexes, sea: m.sea, ocean: m.ocean })),
  stats,
  cases,
};
fs.writeFileSync(outArg, JSON.stringify(doc) + '\n');
console.log(JSON.stringify({ cases: cases.length, stats, bytes: fs.statSync(outArg).size }));
