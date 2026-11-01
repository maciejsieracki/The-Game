// P6.M07B-Q4 - generator wektorow z URUCHOMIONEGO kodu weba (pin 4bbef081d).
//
// Uzycie (katalog tymczasowy poza repo, zakaz buildu w gra/):
//   D=$(mktemp -d); git show 4bbef081d:gra/src/map/gen-helpers.ts > $D/gen-helpers.ts
//   git show 4bbef081d:gra/src/types/hex.ts > $D/hex.ts
//   node --experimental-strip-types gen_q4_vectors.mjs $D/gen-helpers.ts $D/hex.ts <wyjscie.json>
//
// Funkcje Q4: traceRiver, traceRiverForGridFill, collectFoothillRiverSources, collectPlainSpringSources,
// collectRiverSources, capRiverQuotas, pickSpreadRiverSources (isRiverLandTerrain = REUSE, wiersz 18).
// Zaleznosci wyciagane DOSLOWNIE z pinu (po nazwie, do `}` na poziomie zerowym). Profiler rzek
// (`RIVER_PROFILE_ON`, rpNow, rpEnsure) zastapiony atrapami (wylaczony, bez wplywu na wynik).
// Mapy prostokatne [0,W)x[0,H) (krawedz = ocean), z lasem/rzeka/zlozem na wodzie i ladzie
// (lekcja a), jeziorami srodladowymi, brakujacymi heksami i istniejacymi rzekami.
// `rand()` = mulberry32 z ziarna zapisanego w przypadku (ta sama sekwencja po stronie Rust).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SEED = 0x5eed4004;
const N_MAPS = 64;
const N_TRACE = 3000;
const N_GRID = 1500;
const N_SRC = 400;
const N_PICK = 500;
const N_CAP = 600;
const N_SWEEPS = 60;

const [, , srcArg, hexArg, outArg] = process.argv;
if (!srcArg || !hexArg || !outArg) {
  console.error('usage: node --experimental-strip-types gen_q4_vectors.mjs <gen-helpers.ts> <types/hex.ts> <out.json>');
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
  extract('function isReliefRiverSource', 'fn'),
  extract('export function riverPathRespectsSeaBuffer', 'fn'),
  extract('export function riverSegmentUnitVector', 'fn'),
  extract('export function riverPathHasSharpUTurn', 'fn'),
  extract('export function riverPathViolatesTurnWindow', 'fn'),
  extract('function sanitizeRiverTurnWindow', 'fn'),
  extract('function collectInlandDrainGrowCandidates', 'fn'),
  extract('function growRiverInlandBeforeDrainage', 'fn'),
  // --- Q3 (zaleznosci, REUSE) ---
  extract('function traceRiverFromCoast', 'fn'),
  extract('function greedyRiverDrainToSea', 'fn'),
  extract('class RiverAStarOpenHeap', 'fn'),
  extract('function aStarRiverToSea', 'fn'),
  extract('function injectRiverMeanders', 'fn'),
  extract('function extendRiverToMinimumLength', 'fn'),
  extract('function extendRiverToWybrzeze', 'fn'),
  extract('function finishRiverMouthAtSea', 'fn'),
  // --- 7 symboli Q4 ---
  extract('export function traceRiver(', 'fn'),
  extract('function traceRiverForGridFill', 'fn'),
  extract('function collectFoothillRiverSources', 'fn'),
  extract('function collectPlainSpringSources', 'fn'),
  extract('function collectRiverSources', 'fn'),
  extract('function capRiverQuotas', 'fn'),
  extract('function pickSpreadRiverSources', 'fn'),
].map((s) => s.replace(/^function /m, 'export function ').replace(/^class /m, 'export class '));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'm07b4-q4-'));
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}\n');
const tsFile = path.join(tmp, 'web-q4.ts');
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

function randomMap(kind, fw, fh) {
  const W = fw ?? (kind === 'flat' ? ri(11, 18) : ri(8, 15));
  const H = fh ?? (kind === 'flat' ? ri(11, 18) : ri(8, 15));
  const reliefP = kind === 'flat' ? 0 : kind === 'hilly' ? 0.3 : 0.1;
  const lakeP = kind === 'flat' ? 0.01 : kind === 'split' ? 0.14 : 0.06;
  const riverP = kind === 'rivers' ? 0.25 : kind === 'flat' ? 0.01 : 0.06;
  const hexes = [];
  for (let r = 0; r < H; r++) {
    for (let q = 0; q < W; q++) {
      const edge = q === 0 || r === 0 || q === W - 1 || r === H - 1;
      const edge2 = q === 1 || r === 1 || q === W - 2 || r === H - 2;
      if (!edge && rnd() < 0.015) continue; // brakujacy heks
      let t;
      const splitLand = kind === 'split' && edge && (q === 0 && r === 0 ? rnd() < 0.7 : rnd() < 0.5);
      if (splitLand) t = rnd() < 0.15 ? pick(RELIEF) : pick(LAND);
      else if (edge) t = rnd() < 0.85 ? 'morze' : 'plytkie_morze';
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

const mapKinds = ['flat', 'split', 'normal', 'flat', 'split', 'hilly', 'rivers', 'split'];
const maps = [];
for (let i = 0; i < N_MAPS; i++) {
  const m = randomMap(mapKinds[i % mapKinds.length]);
  m.kind = mapKinds[i % mapKinds.length];
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
// mapy duze (wnetrze > 6 od morza: stepCap i budzet drenazu pracuja na dluzszych trasach)
const bigMaps = [];
for (const [kind, w, h] of [['flat', 28, 22], ['normal', 26, 24], ['rivers', 24, 24], ['flat', 32, 20], ['hilly', 26, 22], ['split', 24, 26]]) {
  const m = randomMap(kind, w, h);
  m.kind = kind;
  m.obj = hexesObj(m.list);
  const seaMap = web.buildSeaDistanceField(m.obj);
  const ocSet = web.oceanConnectedWaterKeys(m.obj, m.W, m.H);
  const openMap = web.buildOpenOceanDistanceField(m.obj, m.W, m.H, ocSet);
  m.sea = Object.fromEntries(seaMap);
  m.open = Object.fromEntries(openMap);
  m.oc = [...ocSet];
  m.seaMap = seaMap; m.openMap = openMap; m.ocSet = ocSet;
  bigMaps.push(m);
}
const longCorridors = [];
for (let L = 14; L <= 44; L++) {
  longCorridors.push(corridorMap(L, 'plytkie_morze', 'morze'));
  longCorridors.push(corridorMap(L, 'morze', 'morze'));
}
const allMaps = [...maps, ...corridors, ...bigMaps, ...longCorridors];
const bigBase = maps.length + corridors.length;
const longBase = bigBase + bigMaps.length;

// ---- pomocnicze -----------------------------------------------------------------------------
const stats = {};
const bump = (k, n = 1) => { stats[k] = (stats[k] ?? 0) + n; };
const cases = [];

// Perturbacje pol (gałęzie `?? Infinity` / `?? 999` / `?? 0` / brak w oceanConnected): usuniete klucze.
function perturb(mp) {
  if (rnd() < 0.7) return null;
  const sub = (keys, p) => keys.filter(() => rnd() < p);
  const strong = rnd() < 0.4;
  const pt = {
    orm: [...new Set([
      ...sub(Object.keys(mp.open), strong ? 0.35 : 0.1),
      ...(strong ? sub(mp.oc, 0.5) : []),
    ])],
    srm: sub(Object.keys(mp.sea), strong ? 0.3 : 0.08),
    ocrm: sub(mp.oc, strong ? 0.3 : 0.1),
  };
  return pt.orm.length + pt.srm.length + pt.ocrm.length === 0 ? null : pt;
}
function applyPert(mp, pt) {
  if (!pt) return mp;
  const orm = new Set(pt.orm), srm = new Set(pt.srm), ocrm = new Set(pt.ocrm);
  if (pt.dsea !== undefined) for (const [k, v] of Object.entries(mp.open)) if (v >= pt.dsea) srm.add(k);
  if (pt.csea !== undefined) for (const [k, v] of Object.entries(mp.sea)) if (v <= pt.csea) srm.add(k);
  return {
    ...mp,
    seaMap: new Map([...mp.seaMap].filter(([k]) => !srm.has(k))),
    openMap: new Map([...mp.openMap].filter(([k]) => !orm.has(k))),
    ocSet: new Set([...mp.ocSet].filter((k) => !ocrm.has(k))),
  };
}

function startHex(mp, mode) {
  const land = mp.list.filter((h) => isLandT(h.t));
  const coastal = land.filter((h) => (mp.sea[h.k] ?? 0) <= 2);
  const inland = land.filter((h) => (mp.sea[h.k] ?? 0) >= 2);
  let pool;
  if (mode === 'coastal') pool = coastal.length > 0 ? coastal : land;
  else if (mode === 'any') pool = mp.list;
  else if (mode === 'deep') {
    const deep = land.filter((h) => (mp.open[h.k] ?? 0) >= 6);
    pool = deep.length > 0 ? deep : inland;
  }
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

// sciezka z skokami niesasiednimi i powrotami (guardy sanitize/repair: wejscie nie jest prawidlowym spacerem)
function jumpyPath(mp, len, start) {
  const have = new Set(mp.list.map((h) => h.k));
  const p = [[start.q, start.r]];
  for (let k = 0; k < len; k++) {
    const [cq, cr] = p[p.length - 1];
    const u = rnd();
    if (u < 0.2 && p.length > 2) { p.push(p[ri(0, p.length - 2)]); continue; }
    let q = cq, r = cr;
    if (u < 0.45) { q += ri(-2, 2); r += ri(-2, 2); } else { const d = pick(DIRS); q += d[0]; r += d[1]; }
    if (have.has(keyOf(q, r))) p.push([q, r]);
  }
  return p;
}

// ---- Q4: opcje i uruchomienia -----------------------------------------------------------------
function buildOpts(mp, c) {
  const o = {};
  if (c.mode >= 1) {
    o.seaDist = mp.seaMap;
    o.mapWidth = mp.W; o.mapHeight = mp.H;
  }
  if (c.mode === 1) { o.openOceanDist = mp.openMap; o.oceanConnected = mp.ocSet; }
  if (c.mode === 2) o.oceanConnected = new Set(mp.oc.filter((k) => !c.ocrm.includes(k)));
  if (c.mode === 3) delete o.mapHeight;
  if (c.mode === 4) {
    delete o.seaDist;
    o.mapWidth = mp.W + c.dw; o.mapHeight = mp.H + c.dh;
  }
  if (c.seed !== null) o.rand = mulberry(c.seed);
  if (c.hl !== null) o.hardMeanderLen = c.hl;
  if (c.rel !== null) o.allowReliefTraversal = c.rel;
  if (c.relax !== null) o.relaxSeaBuffer = c.relax;
  if (c.minLen !== null) o.minLen = c.minLen;
  if (c.tail !== null) o.mouthTailLen = c.tail;
  if (c.bl !== null) o.blockRiverKeys = new Set(c.bl);
  if (c.msep !== null) o.minPathSep = c.msep;
  if (c.lc !== null) o.landCentroid = { q: c.lc[0], r: c.lc[1] };
  if (c.sd) {
    const sm = new Map(o.seaDist ?? mp.seaMap);
    if (c.sd.v === null) sm.delete(c.sd.k); else sm.set(c.sd.k, c.sd.v);
    o.seaDist = sm;
  }
  if (c.sqr !== null) o.landCenterSquare = web.continentCenterSquare(mp.obj, mp.list.map((h) => h.k), c.sqr);
  if (c.ix) o.riverSepIndex = web.RiverHexSpatialIndex.fromKeys(c.bl ?? []);
  return o;
}
const BASE = { mode: 0, seed: null, hl: null, rel: null, relax: null, minLen: null, tail: null, bl: null, msep: null, lc: null, sqr: null, ix: false, ocrm: [], dw: 0, dh: 0, sd: null };
function runTrace(mp, c) { return web.traceRiver(mp.obj, c.sq, c.sr, c.ml, buildOpts(mp, c)); }
function runGrid(mp, c) {
  return web.traceRiverForGridFill(mp.obj, c.sq, c.sr, c.ml, c.cat, c.acc, buildOpts(mp, c), c.rb, c.fast);
}
function randOpts(mp, i) {
  const mode = i % 5;
  const bl = rnd() < 0.2 ? Array.from({ length: ri(1, 10) }, () => pick(mp.list).k) : null;
  return {
    mode,
    seed: rnd() < 0.2 ? null : newSeed(),
    hl: rnd() < 0.3 ? ri(0, 12) : null,
    rel: rnd() < 0.4 ? rnd() < 0.5 : null,
    relax: rnd() < 0.3 ? rnd() < 0.6 : null,
    minLen: rnd() < 0.6 ? ri(0, 20) : null,
    tail: rnd() < 0.3 ? ri(0, 9) : null,
    bl,
    msep: rnd() < 0.3 ? ri(0, 4) : null,
    lc: rnd() < 0.25 ? [rnd() * mp.W, rnd() * mp.H] : null,
    sqr: rnd() < 0.25 ? ri(3, 7) : null,
    ix: bl !== null && rnd() < 0.4,
    ocrm: mode === 2 ? mp.oc.filter(() => rnd() < 0.12) : [],
    dw: ri(-2, 2), dh: ri(-2, 2),
    sd: null,
  };
}
function maybeSd(mp, s) {
  const u = rnd();
  const k = keyOf(s.q, s.r);
  if (u < 0.06) return { k, v: null };            // brak seaDist zrodla -> []
  if (u < 0.14) return { k, v: ri(0, 30) };       // inne startDist (stepCap)
  return null;
}

// ---- 1. traceRiver --------------------------------------------------------------------------
const nSmall = maps.length + corridors.length;
const pathLen = (c) => c.out.length / 2;
for (let i = 0; i < N_TRACE; i++) {
  const mi = i < 600 ? bigBase + (i % bigMaps.length) : i % nSmall;
  const mp = allMaps[mi];
  const s = startHex(mp, pick(['inland', 'inland', 'deep', 'any', 'coastal']));
  const c = { fn: 'trace', m: mi, sq: s.q, sr: s.r, ml: pick([0, 1, 2, 3, ri(4, 12), ri(8, 30), ri(8, 40), 60]), ...BASE, ...randOpts(mp, i) };
  c.sd = maybeSd(mp, s);
  c.out = flat(runTrace(mp, c));
  cases.push(c);
  bump(c.out.length === 0 ? 'trace_empty' : 'trace_path');
  if (pathLen(c) >= 6) bump('trace_ge6');
  if (c.relax && c.out.length > 0) bump('trace_relax_path');
  if (c.sqr !== null && c.out.length > 0) bump('trace_square_path');
}

// ---- 2. traceRiverForGridFill -------------------------------------------------------------
for (let i = 0; i < N_GRID; i++) {
  const mi = i < 400 ? bigBase + (i % bigMaps.length) : i % nSmall;
  const mp = allMaps[mi];
  const s = startHex(mp, pick(['inland', 'inland', 'deep', 'any']));
  const cat = ri(0, 30);
  const c = {
    fn: 'grid', m: mi, sq: s.q, sr: s.r, ml: pick([8, 12, ri(10, 40), 60]),
    cat, acc: pick([0, 1, 2, 3, 4, 5, ri(3, 10), cat, Math.floor(cat * 0.6), Math.max(3, Math.floor(cat * 0.75))]),
    rb: rnd() < 0.35, fast: rnd() < 0.4,
    ...BASE, ...randOpts(mp, i), minLen: null,
  };
  c.sd = maybeSd(mp, s);
  c.out = flat(runGrid(mp, c));
  cases.push(c);
  bump(c.out.length === 0 ? 'grid_empty' : 'grid_path');
  if (c.rb && c.out.length > 0) bump('grid_relax_path');
  if (c.fast && c.out.length > 0) bump('grid_fast_path');
}

// ---- 3. zrodla: podnoze / zrodliska / gory i wzgorza ----------------------------------------
function dimsFor(mp) {
  if (rnd() < 0.6) return [mp.W, mp.H];
  return [Math.max(0, mp.W + ri(-3, 3)), Math.max(0, mp.H + ri(-3, 3))];
}
for (let i = 0; i < N_SRC; i++) {
  const mi = i % nSmall;
  const mp = allMaps[mi];
  const [w, h] = dimsFor(mp);
  const margin = pick([0, 0, 1, 1, 2, 3, -1]);
  const pt = perturb(mp);
  const f = applyPert(mp, pt);
  const sea = f.seaMap;
  const tier = pick(['low', 'medium', 'high']);
  const seed = newSeed();
  const outF = web.collectFoothillRiverSources(mp.obj, w, h, margin, sea);
  const outS = web.collectPlainSpringSources(mp.obj, w, h, margin, sea, mulberry(seed), tier);
  const outR = web.collectRiverSources(mp.obj, w, h, margin);
  cases.push({ fn: 'foothill', m: mi, w, h, margin, pt, out: flat(toObjs(outF)) });
  cases.push({ fn: 'spring', m: mi, w, h, margin, pt, tier, seed, out: flat(toObjs(outS)) });
  cases.push({ fn: 'sources', m: mi, w, h, margin, out: flat(toObjs(outR)) });
  bump('foothill'); bump('spring'); bump('sources');
  if (outF.length > 0) bump('foothill_nonempty');
  if (outS.length > 0) bump('spring_nonempty');
  if (outR.length > 0) bump('sources_nonempty');
}

// ---- 4. pickSpreadRiverSources -----------------------------------------------------------------
function pickCase(mi, mp, srcs, count, minSep, used, seed, pt) {
  const f = applyPert(mp, pt);
  const out = web.pickSpreadRiverSources(srcs, count, minSep, f.seaMap, new Set(used), mulberry(seed));
  return { fn: 'pick', m: mi, srcs: flat(toObjs(srcs)), count, ms: minSep, used, seed, pt, out: flat(toObjs(out)) };
}
function sourcePool(mp) {
  const land = mp.list.filter((h) => isLandT(h.t));
  const relief = land.filter((h) => h.t === 'gory' || h.t === 'wzgorza');
  let pool = rnd() < 0.4 && relief.length >= 3 ? relief : land;
  if (rnd() < 0.15) pool = mp.list; // takze woda (brak seaDist -> 0)
  const frac = pick([0.1, 0.3, 0.6, 1]);
  const out = pool.filter(() => rnd() < frac).map((h) => [h.q, h.r]);
  if (rnd() < 0.1 && out.length > 0) out.push(out[0]); // duplikat
  for (let k = out.length - 1; k > 0; k--) { const j = ri(0, k); [out[k], out[j]] = [out[j], out[k]]; }
  return out;
}
for (let i = 0; i < N_PICK; i++) {
  const mi = i % nSmall;
  const mp = allMaps[mi];
  const srcs = sourcePool(mp);
  const used = srcs.filter(() => rnd() < 0.15).map(([q, r]) => keyOf(q, r));
  const c = pickCase(mi, mp, srcs, pick([0, 1, 2, 3, ri(1, 12), ri(1, 40)]), pick([0, 1, 2, 3, 4, 5, ri(1, 8)]), used, newSeed(), perturb(mp));
  cases.push(c);
  bump('pick');
  if (c.out.length >= 3) bump('pick_ge3');
  if (c.out.length === 0) bump('pick_empty');
}

// ---- 5. capRiverQuotas ---------------------------------------------------------------------------
for (let i = 0; i < N_CAP; i++) {
  const n = i % 20 === 0 ? 0 : ri(1, 9);
  const mx = pick([1, 2, 3, 4, 6, 12]);
  const quotas = Array.from({ length: n }, () => (rnd() < 0.1 ? ri(-3, -1) : ri(0, mx)));
  const sum = quotas.reduce((a, b) => a + Math.max(0, b), 0);
  const maxTotal = pick([-1, 0, 1, sum - 2, sum - 1, sum, sum + 1, ri(0, sum + 3)]);
  const out = web.capRiverQuotas([...quotas], maxTotal);
  cases.push({ fn: 'cap', quotas, mt: maxTotal, out });
  bump('cap');
  if (maxTotal < sum) bump('cap_reduced');
  if (n > 0 && out.reduce((a, b) => a + b, 0) > maxTotal && maxTotal >= 0) bump('cap_floor_break');
}

// ---- 6. sweepy N-1/N/N+1 NA TYM SAMYM STARCIE ------------------------------------------------
function transitions(outs) {
  let t = 0;
  for (let i = 1; i < outs.length; i++) if (JSON.stringify(outs[i]) !== JSON.stringify(outs[i - 1])) t++;
  return t;
}
function sweepRecord(kind, base, outs) {
  const t = transitions(outs);
  cases.push({ ...base, fn: 'sweep', kind, outs });
  bump(`sweep_${kind}`);
  bump(`sweep_${kind}_transitions`, t);
  if (t > 0) bump(`sweep_${kind}_with_transition`);
}
// cap: maxTotal -2 .. sum+2 (N-1/N/N+1 wokol sumy i wokol progu 1)
for (let i = 0; i < N_SWEEPS; i++) {
  const n = ri(2, 8);
  const quotas = Array.from({ length: n }, () => ri(0, 6));
  const sum = quotas.reduce((a, b) => a + b, 0);
  const outs = [];
  for (let mt = -2; mt <= sum + 2; mt++) outs.push(web.capRiverQuotas([...quotas], mt));
  sweepRecord('cap', { quotas, lo: -2 }, outs);
}
// pick: count 0..14 oraz minSep 0..8, ten sam zestaw zrodel i ziarno
{
  let got = 0;
  for (let t = 0; t < 6000 && got < N_SWEEPS; t++) {
    const mi = ri(0, maps.length - 1);
    const mp = maps[mi];
    const srcs = sourcePool(mp);
    if (srcs.length < 6) continue;
    const seed = newSeed();
    const pt = perturb(mp);
    const f = applyPert(mp, pt);
    const mk = (count, ms) => flat(toObjs(web.pickSpreadRiverSources(srcs, count, ms, f.seaMap, new Set(), mulberry(seed))));
    const ms0 = ri(1, 4);
    const outsC = [];
    for (let k = 0; k <= 14; k++) outsC.push(mk(k, ms0));
    const cnt0 = ri(3, 8);
    const outsM = [];
    for (let ms = 0; ms <= 8; ms++) outsM.push(mk(cnt0, ms));
    if (transitions(outsC) > 1 && transitions(outsM) > 0) {
      sweepRecord('pick_count', { m: mi, srcs: flat(toObjs(srcs)), ms: ms0, seed, pt, lo: 0 }, outsC);
      sweepRecord('pick_minsep', { m: mi, srcs: flat(toObjs(srcs)), count: cnt0, seed, pt, lo: 0 }, outsM);
      got++;
    }
  }
  if (got < N_SWEEPS) throw new Error(`pick sweeps ${got}`);
}
// trace / grid: maxLen, minLen, mouthTailLen, acceptLen, catalogMinLen
{
  const have = { ml: 0, minlen: 0, tail: 0, acc: 0, cat: 0 };
  for (let t = 0; t < 30000 && Object.values(have).some((v) => v < N_SWEEPS); t++) {
    const mi = t % 3 === 0 ? bigBase + ri(0, bigMaps.length - 1) : ri(0, maps.length - 1);
    const mp = allMaps[mi];
    const s = startHex(mp, pick(['inland', 'deep', 'any']));
    const o0 = { ...BASE, mode: [0, 1, 4][t % 3], seed: rnd() < 0.2 ? null : newSeed(), hl: rnd() < 0.4 ? ri(2, 10) : null, sqr: rnd() < 0.2 ? 5 : null, rel: rnd() < 0.3 ? true : null };
    const bc = { fn: 'trace', m: mi, sq: s.q, sr: s.r, ...o0 };
    const ref = runTrace(mp, { ...bc, ml: 60, minLen: 12 });
    if (ref.length < 6) continue;
    const L = ref.length;
    if (have.ml < N_SWEEPS) {
      const outs = [];
      for (let ml = 0; ml <= L + 3; ml++) outs.push(flat(runTrace(mp, { ...bc, ml, minLen: 12 })));
      if (transitions(outs) > 0) { sweepRecord('trace_maxlen', { ...bc, minLen: 12, lo: 0 }, outs); have.ml++; }
    }
    if (have.minlen < N_SWEEPS) {
      const outs = [];
      for (let mn = 0; mn <= L + 3; mn++) outs.push(flat(runTrace(mp, { ...bc, ml: 60, minLen: mn })));
      if (transitions(outs) > 0) { sweepRecord('trace_minlen', { ...bc, ml: 60, lo: 0 }, outs); have.minlen++; }
    }
    if (have.tail < N_SWEEPS) {
      const outs = [];
      for (let tl = 0; tl <= 10; tl++) outs.push(flat(runTrace(mp, { ...bc, ml: 60, minLen: 12, tail: tl })));
      if (transitions(outs) > 0) { sweepRecord('trace_tail', { ...bc, ml: 60, minLen: 12, lo: 0 }, outs); have.tail++; }
    }
    const gb = { ...bc, ml: 60, cat: 14, acc: 5, rb: false, fast: false };
    if (have.acc < N_SWEEPS) {
      const outs = [];
      for (let ac = 0; ac <= L + 3; ac++) outs.push(flat(runGrid(mp, { ...gb, acc: ac })));
      if (transitions(outs) > 0) { sweepRecord('grid_accept', { ...gb, lo: 0 }, outs); have.acc++; }
    }
    if (have.cat < N_SWEEPS) {
      const outs = [];
      for (let ct = 0; ct <= L + 3; ct++) outs.push(flat(runGrid(mp, { ...gb, cat: ct })));
      if (transitions(outs) > 0) { sweepRecord('grid_catalog', { ...gb, lo: 0 }, outs); have.cat++; }
    }
  }
  if (Object.values(have).some((v) => v < 20)) throw new Error(`trace sweeps ${JSON.stringify(have)}`);
}

// ---- 6b. nadpisania seaDist (`sov`) na losowych heksach (takze wodnych) wartosciami wokol progow zrodel
// (2/3, 65, 120): mutanty progow i filtra lad/woda. DEDYKOWANY generator `rnd2` - strumien glowny
// (przypadki 1-6) nie zmienia sie wzgledem poprzedniej wersji wektorow (nadzbior). ---------------------
{
  const rnd2 = mulberry(0x50faced1);
  const ri2 = (lo, hi) => lo + Math.floor(rnd2() * (hi - lo + 1));
  const pick2 = (arr) => arr[Math.floor(rnd2() * arr.length)];
  const SOV_VALUES = [0, 1, 2, 3, 4, 63, 64, 65, 66, 67, 118, 119, 120, 121, 122, 130];
  const mkSov = (mp) => Array.from({ length: ri2(10, 40) }, () => [pick2(mp.list).k, pick2(SOV_VALUES)]);
  const withSov = (mp, sov) => {
    const m = new Map(mp.seaMap);
    for (const [k, v] of sov) m.set(k, v);
    return m;
  };
  for (let i = 0; i < 400; i++) {
    const mi = i % nSmall;
    const mp = allMaps[mi];
    const margin = pick2([0, 0, 1, 2]);
    const sov = mkSov(mp);
    const sea = withSov(mp, sov);
    const tier = pick2(['low', 'medium', 'high']);
    const seed = Math.floor(rnd2() * 4294967296) >>> 0;
    const base = { m: mi, w: mp.W, h: mp.H, margin, pt: null, sov };
    cases.push({ fn: 'foothill', ...base, out: flat(toObjs(web.collectFoothillRiverSources(mp.obj, mp.W, mp.H, margin, sea))) });
    cases.push({ fn: 'spring', ...base, tier, seed, out: flat(toObjs(web.collectPlainSpringSources(mp.obj, mp.W, mp.H, margin, sea, mulberry(seed), tier))) });
    const srcs = mp.list.filter(() => rnd2() < 0.5).map((h) => [h.q, h.r]);
    const count = pick2([2, 3, 5, 8, 40]);
    const ms = pick2([0, 1, 2, 3]);
    cases.push({
      fn: 'pick', m: mi, srcs: flat(toObjs(srcs)), count, ms, used: [], seed, pt: null, sov,
      out: flat(toObjs(web.pickSpreadRiverSources(srcs, count, ms, sea, new Set(), mulberry(seed)))),
    });
    bump('sov_cases', 3);
  }
}

// ---- 7. dlugie korytarze: traceRiver od konca korytarza, sweep maxLen N-1/N/N+1 (obciecie do stepCap,
// budzet drenazu, A*/zjazd na granicy) ----------------------------------------------------------
{
  let got = 0;
  for (let ci = 0; ci < longCorridors.length; ci++) {
    const mi = longBase + ci;
    const mp = allMaps[mi];
    for (const seed of [null, 4242 + ci]) {
      for (const rel of [null, true]) {
        const bc = { fn: 'trace', m: mi, sq: 0, sr: 1, ...BASE, mode: 1, seed, rel };
        const outs = [];
        for (let ml = 0; ml <= mp.corridor + 28; ml++) outs.push(flat(runTrace(mp, { ...bc, ml })));
        sweepRecord('trace_maxlen', { ...bc, lo: 0 }, outs);
        got++;
      }
    }
  }
  bump('long_corridor_sweeps', got);
}

const doc = {
  format: 'p6-m07b4-q4-v1',
  pin: '4bbef081d',
  seed: SEED,
  maps: allMaps.map((m) => ({ w: m.W, h: m.H, corridor: m.corridor ?? null, hexes: m.list, sea: m.sea, open: m.open, oc: m.oc })),
  n_random_maps: maps.length,
  stats,
  cases,
};
fs.writeFileSync(outArg, JSON.stringify(doc) + '\n');
console.log(JSON.stringify({ cases: cases.length, stats, bytes: fs.statSync(outArg).size }, null, 1));
