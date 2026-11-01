// P6.M07B-Q3 - generator wektorow z URUCHOMIONEGO kodu weba (pin 4bbef081d).
//
// Uzycie (katalog tymczasowy poza repo, zakaz buildu w gra/):
//   D=$(mktemp -d); git show 4bbef081d:gra/src/map/gen-helpers.ts > $D/gen-helpers.ts
//   git show 4bbef081d:gra/src/types/hex.ts > $D/hex.ts
//   node --experimental-strip-types gen_q3_vectors.mjs $D/gen-helpers.ts $D/hex.ts <wyjscie.json>
//
// Funkcje: traceRiverFromCoast, greedyRiverDrainToSea, RiverAStarOpenHeap, aStarRiverToSea,
// injectRiverMeanders, extendRiverToMinimumLength, extendRiverToWybrzeze, finishRiverMouthAtSea.
// Zaleznosci wyciagane DOSLOWNIE z pinu (po nazwie, do `}` na poziomie zerowym). Profiler rzek
// (`RIVER_PROFILE_ON`, rpNow, rpEnsure) zastapiony atrapami (wylaczony, bez wplywu na wynik).
// Mapy prostokatne [0,W)x[0,H) (krawedz = ocean), z lasem/rzeka/zlozem na wodzie i ladzie
// (lekcja a), jeziorami srodladowymi, brakujacymi heksami i istniejacymi rzekami.
// `rand()` = mulberry32 z ziarna zapisanego w przypadku (ta sama sekwencja po stronie Rust).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SEED = 0x5eed2029;
const N_MAPS = 66;
const N_HEAP = 700;
const N_ASTAR = 2600;
const N_GREEDY = 2600;
const N_TRACE = 2600;
const N_INJECT = 2600;
const N_EXTMIN = 2200;
const N_WYB = 2200;
const N_FIN = 2200;
const N_SWEEPS = 70;

const [, , srcArg, hexArg, outArg] = process.argv;
if (!srcArg || !hexArg || !outArg) {
  console.error('usage: node --experimental-strip-types gen_q3_vectors.mjs <gen-helpers.ts> <types/hex.ts> <out.json>');
  process.exit(2);
}

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

const parts = [
  'export type RiverCoord = { q: number; r: number };',
  tbStub,
  'const RIVER_PROFILE_ON = false; function rpNow(): number { return 0; } function rpEnsure(): any { return { aStarCalls: 0, aStarMs: 0 }; }',
  extract('export const HEX_DIRECTIONS', 'const'),
  extract('export const RIVER_TURN_WINDOW_HEX', 'const'),
  extract('export const RIVER_TURN_WINDOW_MAX_SUM', 'const'),
  extract('export const RIVER_MIN_INLAND_FROM_SEA', 'const'),
  extract('export const RIVER_HARD_MEANDER_LEN', 'const'),
  extract('export const RIVER_MOUTH_TAIL_LEN', 'const'),
  extract('export const MAIN_RIVER_MIN_PATH_SEP', 'const'),
  extract('const RIVER_SPATIAL_CELL', 'const'),
  extract('export const CONTINENT_CENTER_SQUARE_SIZE', 'const'),
  extract('function hexAxialDistance', 'fn'),
  extract('export function hexKey', 'fn'),
  extract('function parseHexKey', 'fn'),
  extract('function isWaterTerrainLocal', 'fn'),
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
  extract('function reconstructRiverPath', 'fn'),
  extract('function canRiverDrainStep', 'fn'),
  extract('function isRiverDrainageGoal', 'fn'),
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
  extract('export function oceanConnectedWaterKeys', 'fn'),
  extract('export function buildSeaDistanceField', 'fn'),
  extract('export function buildOpenOceanDistanceField', 'fn'),
  extract('function inferMapDimsFromHexes', 'fn'),
  extract('export function pathEndsAtSea', 'fn'),
  extract('export function sanitizeRiverPath', 'fn'),
  extract('export function repairRiverPathAdjacency', 'fn'),
  extract('function collectCoastInlandGrowCandidates', 'fn'),
  extract('function growRiverFromCoastInland', 'fn'),
  extract('function findRiverMeanderStep', 'fn'),
  // --- 8 symboli Q3 ---
  extract('function traceRiverFromCoast', 'fn'),
  extract('function greedyRiverDrainToSea', 'fn'),
  extract('class RiverAStarOpenHeap', 'fn'),
  extract('function aStarRiverToSea', 'fn'),
  extract('function injectRiverMeanders', 'fn'),
  extract('function extendRiverToMinimumLength', 'fn'),
  extract('function extendRiverToWybrzeze', 'fn'),
  extract('function finishRiverMouthAtSea', 'fn'),
].map((s) => s.replace(/^function /m, 'export function ').replace(/^class /m, 'export class '));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'm07b3-q3-'));
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}\n');
const tsFile = path.join(tmp, 'web-q3.ts');
fs.writeFileSync(tsFile, parts.join('\n\n') + '\n');
const web = await import(pathToFileURL(tsFile).href);

// ---- PRNG -------------------------------------------------------------------------------
function mulberry(seed) {
  let st = seed >>> 0;
  return () => {
    st = (st + 0x6d2b79f5) >>> 0;
    let t = st;
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
const flat = (p) => p.flatMap((c) => [c.q, c.r]);
const toObjs = (arr) => arr.map(([q, r]) => ({ q, r }));
const cl = (p) => p.map((c) => ({ q: c.q, r: c.r }));

// ---- mapy ---------------------------------------------------------------------------------
const OVERLAYS = ['brak', 'brak', 'las', 'las', 'zloze_rudy', 'zloze_gliny'];
const LAND = ['laka', 'laka', 'laka', 'rownina', 'rownina', 'rownina', 'pustynia', 'polarny'];
const RELIEF = ['wzgorza', 'gory'];
const isWaterT = (t) => t === 'morze' || t === 'plytkie_morze';
const isLandT = (t) => !isWaterT(t);

function randomMap(kind) {
  const W = kind === 'flat' ? ri(11, 20) : ri(8, 16);
  const H = kind === 'flat' ? ri(11, 20) : ri(8, 16);
  const reliefP = kind === 'flat' ? 0 : kind === 'hilly' ? 0.3 : 0.1;
  const lakeP = kind === 'flat' ? 0.01 : 0.06;
  const riverP = kind === 'rivers' ? 0.25 : kind === 'flat' ? 0.01 : 0.06;
  const hexes = [];
  for (let r = 0; r < H; r++) {
    for (let q = 0; q < W; q++) {
      const edge = q === 0 || r === 0 || q === W - 1 || r === H - 1;
      const edge2 = q === 1 || r === 1 || q === W - 2 || r === H - 2;
      if (!edge && rnd() < 0.015) continue; // brakujacy heks
      let t;
      if (edge) t = rnd() < 0.85 ? 'morze' : 'plytkie_morze';
      else if (edge2 && rnd() < 0.35) t = rnd() < 0.5 ? 'plytkie_morze' : 'morze';
      else if (rnd() < lakeP) t = rnd() < 0.5 ? 'plytkie_morze' : 'morze';
      else if (rnd() < reliefP) t = pick(RELIEF);
      else t = pick(LAND);
      const n = pick(OVERLAYS);
      const z = rnd() < 0.1;
      let rz = null;
      const u = rnd();
      if (u < riverP && !isWaterT(t)) {
        const edges = [];
        const k = ri(1, 3);
        while (edges.length < k) {
          const e = ri(0, 5);
          if (!edges.includes(e)) edges.push(e);
        }
        rz = { obecna: true, krawedzie: edges };
      } else if (u < riverP + 0.03) {
        rz = { obecna: false, krawedzie: [] };
      }
      hexes.push({ k: keyOf(q, r), q, r, t, n, z, rz });
    }
  }
  return { W, H, list: hexes };
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

const mapKinds = ['flat', 'flat', 'normal', 'flat', 'hilly', 'rivers'];
const maps = [];
for (let i = 0; i < N_MAPS; i++) {
  const m = randomMap(mapKinds[i % mapKinds.length]);
  m.obj = hexesObj(m.list);
  const seaMap = web.buildSeaDistanceField(m.obj);
  const ocSet = web.oceanConnectedWaterKeys(m.obj, m.W, m.H);
  const openMap = web.buildOpenOceanDistanceField(m.obj, m.W, m.H, ocSet);
  m.sea = Object.fromEntries(seaMap);
  m.open = Object.fromEntries(openMap);
  m.oc = [...ocSet];
  m.seaMap = seaMap; m.openMap = openMap; m.ocSet = ocSet;
  maps.push(m);
}

// ---- mapy korytarzowe (wybrzeze / ujscie; sweep N-1/N/N+1 nad capem ogona) -----------------
// Korytarz r=1: lad q=0..L, woda od q=L+1; rzedy r=0 i r=2 = gory (relief nie jest kandydatem).
function corridorMap(L, waterT, ocean) {
  const W = L + 5;
  const H = 3;
  const list = [];
  for (let r = 0; r < H; r++) {
    for (let q = 0; q < W; q++) {
      let t;
      if (r !== 1) t = 'gory';
      else if (q <= L) t = 'laka';
      else if (q === L + 1) t = waterT;
      else t = ocean;
      list.push({ k: keyOf(q, r), q, r, t, n: q % 2 ? 'las' : 'brak', z: q % 3 === 0, rz: null });
    }
  }
  const m = { W, H, list, corridor: L };
  m.obj = hexesObj(list);
  const seaMap = web.buildSeaDistanceField(m.obj);
  const ocSet = web.oceanConnectedWaterKeys(m.obj, W, H);
  const openMap = web.buildOpenOceanDistanceField(m.obj, W, H, ocSet);
  m.sea = Object.fromEntries(seaMap);
  m.open = Object.fromEntries(openMap);
  m.oc = [...ocSet];
  m.seaMap = seaMap; m.openMap = openMap; m.ocSet = ocSet;
  return m;
}
const corridors = [];
for (let L = 1; L <= 12; L++) {
  corridors.push(corridorMap(L, 'plytkie_morze', 'morze'));
  corridors.push(corridorMap(L, 'morze', 'morze'));
}
const allMaps = [...maps, ...corridors];

// ---- pomocnicze -----------------------------------------------------------------------------
const stats = {};
const bump = (k, n = 1) => { stats[k] = (stats[k] ?? 0) + n; };
const cases = [];

function startHex(mp, mode) {
  const land = mp.list.filter((h) => isLandT(h.t));
  const coastal = land.filter((h) => (mp.sea[h.k] ?? 0) <= 2);
  const inland = land.filter((h) => (mp.sea[h.k] ?? 0) >= 2);
  let pool;
  if (mode === 'coastal') pool = coastal.length > 0 ? coastal : land;
  else if (mode === 'any') pool = mp.list;
  else pool = inland.length > 0 ? inland : land;
  if (pool.length === 0) pool = mp.list;
  return pick(pool);
}

// sciezka sasiadow po heksach nie-wodnych (bias prosty)
function walkPath(mp, len, straightBias, start) {
  const have = new Set(mp.list.map((h) => h.k));
  const okT = (k) => {
    const h = mp.obj[k];
    return h && !isWaterT(h.terenBazowy);
  };
  const p = [[start.q, start.r]];
  const seen = new Set([keyOf(start.q, start.r)]);
  let dir = pick(DIRS);
  for (let k = 0; k < len; k++) {
    const [cq, cr] = p[p.length - 1];
    let moved = false;
    const cand = [];
    if (rnd() < straightBias) cand.push(dir);
    for (let t = 0; t < 6; t++) cand.push(pick(DIRS));
    for (const d of cand) {
      const nk = keyOf(cq + d[0], cr + d[1]);
      if (!have.has(nk) || seen.has(nk) || !okT(nk)) continue;
      p.push([cq + d[0], cr + d[1]]);
      seen.add(nk);
      dir = d;
      moved = true;
      break;
    }
    if (!moved) break;
  }
  return p;
}

// ---- 1. kopiec ------------------------------------------------------------------------------
const F_CHOICES = [0, 1, 1, 2, 2, 2, 3, 3.5, 4, 4, 5, 6, 7.5, 'inf'];
for (let i = 0; i < N_HEAP; i++) {
  const heap = new web.RiverAStarOpenHeap();
  const n = ri(2, 70);
  const ops = [];
  const outs = [];
  let seq = 0;
  const tieHeavy = i % 3 === 0;
  for (let j = 0; j < n; j++) {
    if (heap.size > 0 && rnd() < 0.38) {
      const e = heap.pop();
      ops.push(['pop']);
      outs.push([e[0] === Infinity ? 'inf' : e[0], e[1], e[2]]);
    } else {
      const fc = tieHeavy ? pick([1, 2, 2, 3]) : pick(F_CHOICES);
      const f = fc === 'inf' ? Infinity : fc;
      const key = `${ri(0, 9)},${ri(0, 9)}`;
      ops.push(['push', fc, seq, key]);
      heap.push(f, seq, key);
      seq++;
    }
  }
  while (heap.size > 0 && rnd() < 0.7) {
    const e = heap.pop();
    ops.push(['pop']);
    outs.push([e[0] === Infinity ? 'inf' : e[0], e[1], e[2]]);
  }
  const snap = heap.data.map((e) => [e[0] === Infinity ? 'inf' : e[0], e[1], e[2]]);
  cases.push({ fn: 'heap', ops, outs, snap });
  bump('heap');
  if (tieHeavy) bump('heap_tie');
  if (outs.length >= 3) bump('heap_pops_ge3');
}

// ---- 2. A* ----------------------------------------------------------------------------------
function runAStar(mp, s, maxLen, seedOrZero, rel) {
  const rand = seedOrZero === null ? () => 0 : mulberry(seedOrZero);
  return web.aStarRiverToSea(mp.obj, s.q, s.r, mp.seaMap, mp.openMap, mp.ocSet, maxLen, rand, rel);
}
function astarCase(mp, mi, s, maxLen, seedOrZero, rel) {
  const out = runAStar(mp, s, maxLen, seedOrZero, rel);
  return { fn: 'astar', m: mi, s: [s.q, s.r], ml: maxLen, seed: seedOrZero, rel, out: flat(out) };
}
for (let i = 0; i < N_ASTAR; i++) {
  const mi = i % maps.length;
  const mp = maps[mi];
  const s = startHex(mp, pick(['any', 'inland', 'inland', 'coastal']));
  const maxLen = pick([0, 1, 2, 3, ri(4, 12), ri(8, 40), ri(8, 40), 60]);
  const seed = i % 3 === 0 ? null : newSeed();
  const c = astarCase(mp, mi, s, maxLen, seed, rnd() < 0.3);
  cases.push(c);
  const L = c.out.length / 2;
  bump(L === 1 ? 'astar_single' : 'astar_path');
  if (L >= 6) bump('astar_ge6');
}

// ---- 3. greedy ------------------------------------------------------------------------------
function runGreedy(mp, s, maxLen, seedOrZero, srcKey, rel) {
  const rand = seedOrZero === null ? () => 0 : mulberry(seedOrZero);
  return web.greedyRiverDrainToSea(mp.obj, s.q, s.r, mp.seaMap, mp.openMap, mp.ocSet, maxLen, rand, srcKey, rel);
}
function greedyCase(mp, mi, s, maxLen, seedOrZero, srcKey, rel) {
  const out = runGreedy(mp, s, maxLen, seedOrZero, srcKey, rel);
  return { fn: 'greedy', m: mi, s: [s.q, s.r], ml: maxLen, seed: seedOrZero, sk: srcKey, rel, out: flat(out) };
}
for (let i = 0; i < N_GREEDY; i++) {
  const mi = i % maps.length;
  const mp = maps[mi];
  const s = startHex(mp, pick(['any', 'inland', 'inland', 'coastal']));
  const maxLen = pick([0, 1, 2, 3, ri(4, 12), ri(8, 40), 60]);
  const seed = i % 3 === 0 ? null : newSeed();
  const srcKey = rnd() < 0.8 ? keyOf(s.q, s.r) : keyOf(ri(0, 5), ri(0, 5));
  const c = greedyCase(mp, mi, s, maxLen, seed, srcKey, rnd() < 0.3);
  cases.push(c);
  bump(c.out.length === 0 ? 'greedy_empty' : 'greedy_path');
  if (c.out.length >= 8) bump('greedy_ge4');
}

// ---- 4. trace_coast -------------------------------------------------------------------------
function squareFor(mp, size) {
  const keys = mp.list.map((h) => h.k);
  return web.continentCenterSquare(mp.obj, keys, size);
}
function runTrace(mp, c) {
  const o = {};
  if (c.mode >= 1) {
    o.seaDist = mp.seaMap;
    o.mapWidth = mp.W; o.mapHeight = mp.H;
  }
  if (c.mode === 1) { o.openOceanDist = mp.openMap; o.oceanConnected = mp.ocSet; }
  if (c.mode === 2) {
    const oc = new Set(mp.oc.filter((k) => !c.ocrm.includes(k)));
    o.oceanConnected = oc;
  }
  if (c.mode === 3) { delete o.mapHeight; }
  if (c.seed !== null) o.rand = mulberry(c.seed);
  if (c.hl !== null) o.hardMeanderLen = c.hl;
  if (c.rel !== null) o.allowReliefTraversal = c.rel;
  if (c.bl !== null) o.blockRiverKeys = new Set(c.bl);
  if (c.msep !== null) o.minPathSep = c.msep;
  if (c.lc !== null) o.landCentroid = { q: c.lc[0], r: c.lc[1] };
  if (c.sq !== null) o.landCenterSquare = squareFor(mp, c.sq);
  if (c.ix) o.riverSepIndex = web.RiverHexSpatialIndex.fromKeys(c.bl ?? []);
  return web.traceRiverFromCoast(mp.obj, c.mq, c.mr, c.ml, o);
}
function traceCase(mi, mp, base) {
  const c = { fn: 'trace', m: mi, mode: 0, seed: null, hl: null, rel: null, bl: null, msep: null, lc: null, sq: null, ix: false, ocrm: [], ...base };
  const out = runTrace(mp, c);
  c.out = flat(out);
  return c;
}
for (let i = 0; i < N_TRACE; i++) {
  const mi = i % maps.length;
  const mp = maps[mi];
  const s = startHex(mp, pick(['coastal', 'coastal', 'any', 'inland']));
  const mode = i % 4;
  const bl = rnd() < 0.2 ? Array.from({ length: ri(1, 10) }, () => pick(mp.list).k) : null;
  const base = {
    mq: s.q, mr: s.r, ml: pick([0, 1, 2, 3, ri(4, 12), ri(8, 30), ri(8, 30)]), mode,
    seed: rnd() < 0.25 ? null : newSeed(),
    hl: rnd() < 0.4 ? ri(0, 12) : null,
    rel: rnd() < 0.4 ? rnd() < 0.5 : null,
    bl,
    msep: rnd() < 0.4 ? ri(0, 4) : null,
    lc: rnd() < 0.3 ? [rnd() * W_OF(mp), rnd() * H_OF(mp)] : null,
    sq: rnd() < 0.3 ? ri(3, 7) : null,
    ix: bl !== null && rnd() < 0.4,
    ocrm: mode === 2 ? mp.oc.filter(() => rnd() < 0.15) : [],
  };
  const c = traceCase(mi, mp, base);
  cases.push(c);
  const L = c.out.length / 2;
  bump(L === 0 ? 'trace_empty' : 'trace_path');
  if (L >= 5) bump('trace_ge5');
  if (c.sq !== null && L > 0) bump('trace_square_path');
  if (c.mode === 2 && L > 0) bump('trace_pert_path');
}
function W_OF(mp) { return mp.W; }
function H_OF(mp) { return mp.H; }

// ---- 5. inject ------------------------------------------------------------------------------
function injectCase(mi, mp, p, seed, maxExtra) {
  const out = web.injectRiverMeanders(toObjs(p), mp.obj, mp.seaMap, mulberry(seed), maxExtra);
  return { fn: 'inject', m: mi, p: flat(toObjs(p)), seed, mx: maxExtra, out: flat(out) };
}
for (let i = 0; i < N_INJECT; i++) {
  const mi = i % maps.length;
  const mp = maps[mi];
  const s = startHex(mp, pick(['inland', 'inland', 'any', 'coastal']));
  const p = walkPath(mp, ri(3, 20), pick([0.5, 0.8, 0.9, 0.95]), s);
  const c = injectCase(mi, mp, p, newSeed(), pick([-1, 0, 1, 2, 3, ri(1, 8)]));
  cases.push(c);
  const grew = c.out.length > c.p.length;
  bump(grew ? 'inject_grew' : 'inject_same');
}

// ---- 6. extendMin ---------------------------------------------------------------------------
function extCase(mi, mp, p, seed, minLen, stepCap) {
  const out = web.extendRiverToMinimumLength(toObjs(p), mp.obj, mp.seaMap, mulberry(seed), minLen, stepCap);
  return { fn: 'extmin', m: mi, p: flat(toObjs(p)), seed, min: minLen, cap: stepCap, out: flat(out) };
}
for (let i = 0; i < N_EXTMIN; i++) {
  const mi = i % maps.length;
  const mp = maps[mi];
  const s = startHex(mp, pick(['inland', 'inland', 'any']));
  const p = walkPath(mp, ri(2, 16), pick([0.6, 0.85, 0.95]), s);
  const c = extCase(mi, mp, p, newSeed(), pick([0, 2, 3, ri(3, 12), ri(8, 30)]), pick([0, 3, ri(3, 12), ri(8, 30), 40]));
  cases.push(c);
  bump(c.out.length > c.p.length ? 'extmin_grew' : 'extmin_same');
}

// ---- 7. wybrzeze i ujscie ------------------------------------------------------------------
function wybCase(mi, mp, p) {
  const arr = toObjs(p);
  const out = web.extendRiverToWybrzeze(mp.obj, arr, mp.seaMap);
  if (out !== arr) throw new Error('web nie zwrocil tej samej sciezki');
  return { fn: 'wyb', m: mi, p: flat(toObjs(p)), out: flat(out) };
}
function finCase(mi, mp, p, srcKey) {
  const arr = toObjs(p);
  const out = web.finishRiverMouthAtSea(mp.obj, arr, mp.seaMap, mp.openMap, mp.ocSet, srcKey);
  if (out !== arr) throw new Error('web nie zwrocil tej samej sciezki');
  return { fn: 'fin', m: mi, p: flat(toObjs(p)), sk: srcKey, out: flat(out) };
}
for (let i = 0; i < N_WYB; i++) {
  const mi = i % maps.length;
  const mp = maps[mi];
  const s = startHex(mp, pick(['coastal', 'inland', 'any']));
  const p = walkPath(mp, ri(0, 8), 0.7, s);
  const c = wybCase(mi, mp, p);
  cases.push(c);
  bump(c.out.length > c.p.length ? 'wyb_grew' : 'wyb_same');
}
for (let i = 0; i < N_FIN; i++) {
  const mi = i % maps.length;
  const mp = maps[mi];
  const s = startHex(mp, pick(['coastal', 'inland', 'any']));
  const p = walkPath(mp, ri(0, 8), 0.7, s);
  const sk = rnd() < 0.8 ? keyOf(p[0][0], p[0][1]) : keyOf(ri(0, 5), ri(0, 5));
  const c = finCase(mi, mp, p, sk);
  cases.push(c);
  bump(c.out.length > c.p.length ? 'fin_grew' : 'fin_same');
}
// korytarze: N-1/N/N+1 wokol capow ogona (RIVER_MOUTH_TAIL_LEN = 5 oraz +2 = 7)
for (let ci = 0; ci < corridors.length; ci++) {
  const mi = maps.length + ci;
  const mp = corridors[ci];
  const start = [[0, 1], [1, 1]];
  cases.push(wybCase(mi, mp, start));
  cases.push(finCase(mi, mp, start, '0,1'));
  cases.push(finCase(mi, mp, [[0, 1]], '0,1'));
  bump('corridor_cases', 3);
}

// ---- 8. sweepy N-1/N/N+1 NA TYM SAMYM STARCIE ------------------------------------------------
function transitions(outs) {
  let t = 0;
  for (let i = 1; i < outs.length; i++) if (JSON.stringify(outs[i]) !== JSON.stringify(outs[i - 1])) t++;
  return t;
}
function sweepRecord(kind, base, outs) {
  const t = transitions(outs);
  cases.push({ fn: 'sweep', kind, ...base, outs });
  bump(`sweep_${kind}`);
  bump(`sweep_${kind}_transitions`, t);
  if (t > 0) bump(`sweep_${kind}_with_transition`);
}
let tries = 0;
const have = { astar: 0, astar0: 0, greedy: 0, trace: 0, inject: 0, extmin: 0, extcap: 0 };
while (tries++ < 20000 && Object.values(have).some((v) => v < N_SWEEPS)) {
  const mi = ri(0, maps.length - 1);
  const mp = maps[mi];
  // A*: maxLen 0..L+3 (seed albo zero)
  if (have.astar < N_SWEEPS || have.astar0 < N_SWEEPS) {
    const s = startHex(mp, 'inland');
    const useZero = have.astar0 < N_SWEEPS && (have.astar >= N_SWEEPS || rnd() < 0.5);
    const seed = useZero ? null : newSeed();
    const big = runAStar(mp, s, 80, seed, false);
    if (big.length >= 4) {
      const outs = [];
      for (let ml = 0; ml <= big.length + 3; ml++) outs.push(flat(runAStar(mp, s, ml, seed, false)));
      sweepRecord('astar', { m: mi, s: [s.q, s.r], seed, rel: false, lo: 0 }, outs);
      if (useZero) have.astar0++; else have.astar++;
    }
  }
  if (have.greedy < N_SWEEPS) {
    const s = startHex(mp, 'inland');
    const seed = rnd() < 0.5 ? null : newSeed();
    const sk = keyOf(s.q, s.r);
    const big = runGreedy(mp, s, 80, seed, sk, false);
    if (big.length >= 4) {
      const outs = [];
      for (let ml = 0; ml <= big.length + 3; ml++) outs.push(flat(runGreedy(mp, s, ml, seed, sk, false)));
      sweepRecord('greedy', { m: mi, s: [s.q, s.r], seed, sk, rel: false, lo: 0 }, outs);
      have.greedy++;
    }
  }
  if (have.trace < N_SWEEPS) {
    const s = startHex(mp, 'coastal');
    const base = { mq: s.q, mr: s.r, mode: tries % 3 === 0 ? 1 : 0, seed: newSeed(), hl: rnd() < 0.5 ? ri(2, 10) : null, rel: null, bl: null, msep: null, lc: null, sq: rnd() < 0.3 ? 5 : null, ix: false, ocrm: [] };
    const big = runTrace(mp, { ...base, ml: 60 });
    if (big.length >= 4) {
      const outs = [];
      for (let ml = 0; ml <= big.length + 3; ml++) outs.push(flat(runTrace(mp, { ...base, ml })));
      sweepRecord('trace', { m: mi, ...base, lo: 0 }, outs);
      have.trace++;
    }
  }
  if (have.inject < N_SWEEPS) {
    const s = startHex(mp, 'inland');
    const p = walkPath(mp, ri(8, 20), 0.95, s);
    const seed = newSeed();
    const outs = [];
    for (let mx = 0; mx <= 7; mx++) outs.push(flat(web.injectRiverMeanders(toObjs(p), mp.obj, mp.seaMap, mulberry(seed), mx)));
    if (transitions(outs) > 0) {
      sweepRecord('inject', { m: mi, p: flat(toObjs(p)), seed, lo: 0 }, outs);
      have.inject++;
    }
  }
  if (have.extmin < N_SWEEPS || have.extcap < N_SWEEPS) {
    const s = startHex(mp, 'inland');
    const p = walkPath(mp, ri(5, 12), 0.9, s);
    const seed = newSeed();
    if (have.extmin < N_SWEEPS) {
      // minLen: len-1 .. len+14 przy duzym stepCap
      const outs = [];
      for (let ml = 0; ml <= p.length + 14; ml++) outs.push(flat(web.extendRiverToMinimumLength(toObjs(p), mp.obj, mp.seaMap, mulberry(seed), ml, 60)));
      if (transitions(outs) > 0) {
        sweepRecord('extmin', { m: mi, p: flat(toObjs(p)), seed, cap: 60, lo: 0 }, outs);
        have.extmin++;
      }
    }
    if (have.extcap < N_SWEEPS) {
      // stepCap: 0 .. len+14 przy minLen = len+10
      const minLen = p.length + 10;
      const outs = [];
      for (let cp = 0; cp <= p.length + 14; cp++) outs.push(flat(web.extendRiverToMinimumLength(toObjs(p), mp.obj, mp.seaMap, mulberry(seed), minLen, cp)));
      if (transitions(outs) > 0) {
        sweepRecord('extcap', { m: mi, p: flat(toObjs(p)), seed, min: minLen, lo: 0 }, outs);
        have.extcap++;
      }
    }
  }
}
if (Object.values(have).some((v) => v < N_SWEEPS)) throw new Error(`za malo sweepow: ${JSON.stringify(have)}`);

const doc = {
  format: 'p6-m07b3-q3-v1',
  pin: '4bbef081d',
  seed: SEED,
  maps: allMaps.map((m) => ({ w: m.W, h: m.H, corridor: m.corridor ?? null, hexes: m.list, sea: m.sea, open: m.open, oc: m.oc })),
  n_random_maps: maps.length,
  stats,
  cases,
};
fs.writeFileSync(outArg, JSON.stringify(doc) + '\n');
console.log(JSON.stringify({ cases: cases.length, stats, bytes: fs.statSync(outArg).size }, null, 1));
