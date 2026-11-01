// P6.M07B-Q3 r2 - wektory DOMYKAJACE 4 mutanty L z r1 (G06, G24, G25: `visited` w greedy;
// A20: jitter kosztu A* 0.12 -> 0.13), z URUCHOMIONEGO kodu weba (pin 4bbef081d).
//
// Uzycie (katalog tymczasowy poza repo, zakaz buildu w gra/): w $D umiesc `gen-helpers.ts` i
// `hex.ts` z pinu 4bbef081d (pliki gra/src/map/gen-helpers.ts i gra/src/types/hex.ts), po czym:
//   node --experimental-strip-types gen_q3_closure_vectors.mjs $D/gen-helpers.ts $D/hex.ts <wyjscie.json>
//
// Metoda: poza wersja weba generator laduje ZMUTOWANE kopie funkcji (ten sam tekst z pinu, jedna
// podmiana tekstowa = dokladnie ten mutant, co w `mutate_m07b3_q3.py`) i SZUKA (zasiane PRNG)
// wejsc, na ktorych wynik weba rozni sie od wyniku mutanta. Do wektorow trafiaja WYLACZNIE
// wejscia rozrozniajace (wynik = wynik ORYGINALNEGO weba). Format jak `web-rivers-b-q3.json`
// (maps + cases fn=greedy|astar), czytany tym samym runnerem testu.
//
//  - greedy: mapa 25x25, plateau openOceanDist = pierscien promienia 6 (36 heksow; okno skretu
//    6/+-1 wymusza petle >= 36 heksow) + ostroga z jeziorem-celem.
//  - astar: mapy ladowe z losowymi przeszkodami, szukanie prawie-remisu tras (prosta vs zygzak),
//    gdzie jitter 0.12/0.13 zmienia wybor trasy.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SEED = 0x2c10517e;
const [, , srcArg, hexArg, outArg] = process.argv;
if (!srcArg || !hexArg || !outArg) {
  console.error('usage: node --experimental-strip-types gen_q3_closure_vectors.mjs <gen-helpers.ts> <types/hex.ts> <out.json>');
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


// ---- ladowanie weba i jego mutantow (kopie z podmiana tekstowa dokladnie jak w mutate_m07b3_q3.py) ----
function sub(part, from, to) {
  if (!part.includes(from)) throw new Error(`mutant: brak tekstu ${JSON.stringify(from)}`);
  return part.replace(from, to);
}
const MUTANTS = {
  web: (s) => s,
  G06: (s) => (s.startsWith('export function greedyRiverDrainToSea')
    ? sub(s, '      if (visited.has(nk)) continue;\n', '') : s),
  G24: (s) => (s.startsWith('export function greedyRiverDrainToSea')
    ? sub(s, '    visited.add(hexKey(pick.q, pick.r));\n', '') : s),
  G25: (s) => (s.startsWith('export function greedyRiverDrainToSea')
    ? sub(s, 'const visited = new Set<string>([startK]);', 'const visited = new Set<string>();') : s),
  A20: (s) => (s.startsWith('export function aStarRiverToSea')
    ? sub(s, 'rand() * 0.12', 'rand() * 0.13') : s),
};
const mods = {};
for (const [tag, mut] of Object.entries(MUTANTS)) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `m07b3-q3c-${tag}-`));
  fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}\n');
  const ts = path.join(dir, 'web-q3.ts');
  fs.writeFileSync(ts, parts.map(mut).join('\n\n') + '\n');
  mods[tag] = await import(pathToFileURL(ts).href);
}
const web = mods.web;

// ---- PRNG ------------------------------------------------------------------------------------
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
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const outMaps = [];
const cases = [];
const stats = {};
const bump = (k, n = 1) => { stats[k] = (stats[k] ?? 0) + n; };
const hexRec = (q, r, t) => ({ k: keyOf(q, r), q, r, t, n: 'brak', z: false, rz: null });
const hexesObj = (list) => Object.fromEntries(list.map((h) => [h.k, {
  q: h.q, r: h.r, terenBazowy: h.t, nakladka: h.n, zloze: undefined,
  rzeka: h.rz === null ? undefined : { obecna: h.rz.obecna, krawedzie: [...h.rz.krawedzie] },
}]));

// ---- 1. greedy: pierscien-plateau (domkniecie G06 / G24 / G25) -----------------------------------
// Mapa RZADKA: tylko pierscien promienia 6 (36 heksow), ostroga i jezioro-cel (brak innych heksow
// = brak innych kandydatow). seaDist = 5 (>= RIVER_MIN_INLAND_FROM_SEA) na ladzie, 0 na jeziorze;
// openOceanDist = 9 na plateau, 0 na jeziorze; ocean-connected = {jezioro}.
const K_OD = 9;
const CQ = 8, CR = 8, RAD = 6;
function ringCells() {
  const out = [];
  let [q, r] = [CQ + DIRS[4][0] * RAD, CR + DIRS[4][1] * RAD];
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < RAD; j++) {
      out.push([q, r]);
      q += DIRS[i][0];
      r += DIRS[i][1];
    }
  }
  return out;
}
const RING = ringCells();
const RING_KEYS = new Set(RING.map(([q, r]) => keyOf(q, r)));
if (RING.length !== 36 || RING_KEYS.size !== 36) throw new Error('pierscien');

function greedyMap(a, d, len, tail) {
  // ostroga: `len` heksow od RING[a] w kierunku d, potem jezioro (musi byc poza pierscieniem)
  const cells = [];
  let [q, r] = RING[a];
  for (let i = 0; i < len + 1; i++) {
    q += DIRS[d][0];
    r += DIRS[d][1];
    if (RING_KEYS.has(keyOf(q, r)) || q < 0 || r < 0 || q > 16 || r > 16) return null;
    cells.push([q, r]);
  }
  const lake = cells.pop();
  // opcjonalny ogon startowy (lasso): `tail.len` heksow od RING[tail.a] w kierunku tail.d; start = jego koniec
  const tailCells = [];
  if (tail) {
    let [tq, tr] = RING[tail.a];
    for (let i = 0; i < tail.len; i++) {
      tq += DIRS[tail.d][0];
      tr += DIRS[tail.d][1];
      const tk = keyOf(tq, tr);
      if (RING_KEYS.has(tk) || cells.some(([x, y]) => keyOf(x, y) === tk) || keyOf(lake[0], lake[1]) === tk || tq < 0 || tr < 0 || tq > 16 || tr > 16) return null;
      tailCells.push([tq, tr]);
    }
  }
  const list = [...tailCells.map(([x, y]) => hexRec(x, y, 'laka')), ...RING.map(([x, y]) => hexRec(x, y, 'laka')), ...cells.map(([x, y]) => hexRec(x, y, 'laka')), hexRec(lake[0], lake[1], 'plytkie_morze')];
  const sea = {}, open = {};
  for (const h of list) {
    const lakeHex = h.t === 'plytkie_morze';
    sea[h.k] = lakeHex ? 0 : 5;
    open[h.k] = lakeHex ? 0 : K_OD;
  }
  const oc = [keyOf(lake[0], lake[1])];
  const obj = hexesObj(list);
  return {
    start: tailCells.length > 0 ? tailCells[tailCells.length - 1] : null,
    obj, seaMap: new Map(Object.entries(sea)), openMap: new Map(Object.entries(open)), ocSet: new Set(oc),
    json: { w: 17, h: 17, corridor: null, hexes: list, sea, open, oc },
  };
}
function runGreedy(variant, mp, s, maxLen, seed) {
  const rand = mulberry(seed);
  return mods[variant].greedyRiverDrainToSea(mp.obj, s[0], s[1], mp.seaMap, mp.openMap, mp.ocSet, maxLen, rand, keyOf(s[0], s[1]), false);
}
const GREEDY_WANT = { G06: 3, G24: 3, G25: 3 };
const greedyFound = { G06: 0, G24: 0, G25: 0 };
let greedyTrials = 0;
for (let t = 0; t < Number(process.env.GEN_TRIALS ?? 400000) && Object.keys(GREEDY_WANT).some((m) => greedyFound[m] < GREEDY_WANT[m]); t++) {
  const a = ri(0, 35);
  const d = ri(0, 5);
  const len = ri(0, 3);
  const tail = rnd() < 0.5 ? { a: ri(0, 35), d: ri(0, 5), len: ri(1, 3) } : null;
  const mp = greedyMap(a, d, len, tail);
  if (!mp) continue;
  greedyTrials++;
  const startIdx = rnd() < 0.4 ? a : ri(0, 35);
  const s = mp.start ?? RING[startIdx];
  const seed = newSeed();
  const maxLen = pick([60, 100, 140]);
  const base = flat(runGreedy('web', mp, s, maxLen, seed));
  for (const m of ['G06', 'G24', 'G25']) {
    if (greedyFound[m] >= GREEDY_WANT[m]) continue;
    const got = flat(runGreedy(m, mp, s, maxLen, seed));
    if (same(base, got)) continue;
    outMaps.push(mp.json);
    cases.push({ fn: 'greedy', m: outMaps.length - 1, s, ml: maxLen, seed, sk: keyOf(s[0], s[1]), rel: false, pt: null, out: base, kills: m });
    greedyFound[m]++;
    bump(`greedy_${m}`);
    bump(base.length === 0 ? 'greedy_empty' : 'greedy_path');
  }
}
if (process.env.GEN_DEBUG) console.error('greedy found', JSON.stringify(greedyFound), greedyTrials);
for (const m of Object.keys(GREEDY_WANT)) {
  if (greedyFound[m] < GREEDY_WANT[m]) throw new Error(`greedy ${m}: znaleziono ${greedyFound[m]}`);
}
stats.greedy_trials = greedyTrials;
if (process.env.GEN_DEBUG) console.error('greedy ok', JSON.stringify(greedyFound), greedyTrials);
if (process.env.GEN_ONLY === 'greedy') process.exit(0);

// ---- 2. A*: prawie-remis dwoch tras (domkniecie A20) ------------------------------------------------
// Mapa RZADKA z dwoma rozlacznymi trasami od startu S do osobnych jezior-celow:
//  - trasa A: nA heksow PROSTO na wschod (nA-1 krokow prostych: kazdy kosztuje 1 + 0.18 + 0.12*rand());
//  - trasa B: nB krokow zygzakiem W/SW (zero krokow prostych: koszt calkowity = nB).
// Heurystyka (openOceanDist) = pozostala liczba krokow wzdluz trasy. Kosztem trasy A jest
// nA + 0.18*(nA-1) + J*S, gdzie S = suma nA-1 losowan, J = 0.12 (web) albo 0.13 (mutant A20):
// o wyborze trasy decyduje prog S = (nB - nA - 0.18*(nA-1)) / J. Wektor rozrozniajacy to ziarno,
// dla ktorego S lezy miedzy progami dla 0.12 i 0.13 (A*, ktory pierwszy zdejmie z kopca heks
// przyleglego do jeziora, wygrywa).
const SQ = 14, SR = 4;
function astarTwoRoutes(nA, nB) {
  const list = [hexRec(SQ, SR, 'laka')];
  const sea = {}, open = {};
  const put = (q, r, t, od) => {
    const h = hexRec(q, r, t);
    list.push(h);
    sea[h.k] = t === 'plytkie_morze' ? 0 : 5;
    open[h.k] = od;
  };
  sea[keyOf(SQ, SR)] = 5;
  open[keyOf(SQ, SR)] = Math.min(nA, nB) + 1;
  const oc = [];
  for (let i = 1; i <= nA; i++) put(SQ + i, SR, 'laka', nA - i + 1);
  put(SQ + nA + 1, SR, 'plytkie_morze', 0);
  oc.push(keyOf(SQ + nA + 1, SR));
  // B: W, SW, W, SW, ... (kierunki (-1,0), (-1,1)); ostatni krok = lad, nastepny = jezioro
  let [q, r] = [SQ, SR];
  const bDirs = [[-1, 0], [-1, 1]];
  for (let i = 1; i <= nB; i++) {
    q += bDirs[(i - 1) % 2][0];
    r += bDirs[(i - 1) % 2][1];
    put(q, r, 'laka', nB - i + 1);
  }
  q += bDirs[nB % 2][0];
  r += bDirs[nB % 2][1];
  put(q, r, 'plytkie_morze', 0);
  oc.push(keyOf(q, r));
  const obj = hexesObj(list);
  return {
    obj, seaMap: new Map(Object.entries(sea)), openMap: new Map(Object.entries(open)), ocSet: new Set(oc),
    json: { w: 24, h: 16, corridor: null, hexes: list, sea, open, oc },
  };
}
function runAStar(variant, mp, maxLen, seed) {
  return mods[variant].aStarRiverToSea(mp.obj, SQ, SR, mp.seaMap, mp.openMap, mp.ocSet, maxLen, mulberry(seed), false);
}
const ASTAR_WANT = 6;
let astarFound = 0;
let astarTrials = 0;
for (let t = 0; t < 200000 && astarFound < ASTAR_WANT; t++) {
  const nA = ri(6, 14);
  const nB = nA + ri(0, 4);
  const mp = astarTwoRoutes(nA, nB);
  const seed = newSeed();
  const maxLen = 60;
  astarTrials++;
  const base = flat(runAStar('web', mp, maxLen, seed));
  const got = flat(runAStar('A20', mp, maxLen, seed));
  if (same(base, got)) continue;
  outMaps.push(mp.json);
  cases.push({ fn: 'astar', m: outMaps.length - 1, s: [SQ, SR], ml: maxLen, seed, rel: false, pt: null, out: base, kills: 'A20' });
  astarFound++;
  bump('astar_A20');
  bump(base.length / 2 === nA + 1 ? 'astar_A20_wybiera_prosta' : 'astar_A20_wybiera_zygzak');
}
if (process.env.GEN_DEBUG) console.error('astar found', astarFound, astarTrials);
if (astarFound < ASTAR_WANT) throw new Error(`astar A20: znaleziono ${astarFound}`);
stats.astar_trials = astarTrials;

const doc = {
  format: 'p6-m07b3-q3-closure-v1',
  pin: '4bbef081d',
  seed: SEED,
  maps: outMaps,
  stats,
  cases,
};
fs.writeFileSync(outArg, JSON.stringify(doc) + '\n');
console.log(JSON.stringify({ cases: cases.length, maps: outMaps.length, stats, bytes: fs.statSync(outArg).size }, null, 1));
