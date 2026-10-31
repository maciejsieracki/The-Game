// P6.M07B-Q2 partia 2 - generator wektorow z URUCHOMIONEGO kodu weba (pin edb8fb56).
//
// Uzycie (katalog tymczasowy poza repo):
//   git archive -o <DIR>/pin.tar edb8fb56 gra/src gra/data ; tar -x -f <DIR>/pin.tar -C <DIR>
//   node --experimental-strip-types gen_coast_grow_vectors.mjs <DIR>/gra/src/map/gen-helpers.ts \
//        <DIR>/gra/src/types/hex.ts <wyjscie.json>
//
// Funkcje: collectCoastInlandGrowCandidates (:6098), growRiverFromCoastInland (:6181),
// findRiverMeanderStep (:6485). Zaleznosci wyciagane DOSLOWNIE z pinu (po nazwie, do `}` na
// poziomie zerowym). `rand()` jest generowany z ziarna mulberry32 - ta sama sekwencja po stronie
// Rust (tests/p6_m07b2_coast.rs). Mapy: woda (Morze, PlytkieMorze), lad, gory/wzgorza, nakladki
// (las, zloza) takze na wodzie (lekcja a), istniejace krawedzie rzeki, brakujace heksy.
// Ograniczenie: `ContinentCenterSquare` (kwadrat centrum) NIE jest generowany - pole `square`
// zawsze null (ZAŁOŻENIE w dossier: galąz kwadratu pokryta testami M07A score_river_step_*).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SEED = 0x5eed2028;
const MAP_R = 6;
const N_MAPS = 120;
const N_COLLECT = 3000;
const N_GROW = 1500;
const N_MEANDER = 2000;

const [, , srcArg, hexArg, outArg] = process.argv;
if (!srcArg || !hexArg || !outArg) {
  console.error('usage: node --experimental-strip-types gen_coast_grow_vectors.mjs <gen-helpers.ts> <types/hex.ts> <out.json>');
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
  extract('function hexAxialDistance', 'fn'),
  extract('export function hexKey', 'fn'),
  extract('function parseHexKey', 'fn'),
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
  extract('function growRiverFromCoastInland', 'fn'),
  extract('function findRiverMeanderStep', 'fn'),
].map((s) => s.replace(/^function /m, 'export function '));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'm07b2-coast-'));
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}\n');
const tsFile = path.join(tmp, 'web-coast.ts');
fs.writeFileSync(tsFile, parts.join('\n\n') + '\n');
const web = await import(pathToFileURL(tsFile).href);

// ---- 2. PRNG (mulberry32, identyczny jak w web-rand po stronie Rust) ---------------------
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
let st = SEED >>> 0;
const rnd = mulberry(SEED);
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const newSeed = () => Math.floor(rnd() * 4294967296) >>> 0;
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const inDom = (q, r) => Math.abs(q) <= MAP_R && Math.abs(r) <= MAP_R && Math.abs(q + r) <= MAP_R;
const keyOf = (q, r) => `${q},${r}`;

const TERRAIN_KEYS = [
  'morze', 'morze', 'plytkie_morze', 'plytkie_morze', 'laka', 'laka', 'laka', 'laka',
  'rownina', 'rownina', 'pustynia', 'wzgorza', 'gory', 'polarny',
];
const OVERLAYS = ['brak', 'brak', 'las', 'las', 'zloze_rudy', 'zloze_gliny'];

function randomMap() {
  const hexes = [];
  for (let q = -MAP_R; q <= MAP_R; q++) {
    for (let r = -MAP_R; r <= MAP_R; r++) {
      if (!inDom(q, r)) continue;
      if (rnd() < 0.05) continue;
      const t = pick(TERRAIN_KEYS);
      const n = pick(OVERLAYS);
      const z = rnd() < 0.12;
      let rz = null;
      const u = rnd();
      if (u < 0.12) {
        const edges = [];
        const k = ri(1, 3);
        while (edges.length < k) {
          const e = ri(0, 5);
          if (!edges.includes(e)) edges.push(e);
        }
        rz = { obecna: true, krawedzie: edges };
      } else if (u < 0.15) {
        rz = { obecna: false, krawedzie: [] };
      }
      hexes.push({ k: keyOf(q, r), q, r, t, n, z, rz });
    }
  }
  return hexes;
}

function hexesObj(list) {
  const o = {};
  for (const h of list) {
    o[h.k] = {
      q: h.q,
      r: h.r,
      terenBazowy: h.t,
      nakladka: h.n,
      zloze: h.z ? { typ: 'test' } : undefined,
      rzeka: h.rz === null ? undefined : { obecna: h.rz.obecna, krawedzie: [...h.rz.krawedzie] },
    };
  }
  return o;
}

// BFS odleglosci od zrodel (heksy obecne na mapie; klucze nieosiagalne pominiete)
function bfs(list, sourcePred) {
  const present = new Set(list.map((h) => h.k));
  const dist = {};
  const queue = [];
  for (const h of list) {
    if (sourcePred(h)) { dist[h.k] = 0; queue.push(h); }
  }
  let qi = 0;
  while (qi < queue.length) {
    const cur = queue[qi++];
    for (const [dq, dr] of DIRS) {
      const nk = keyOf(cur.q + dq, cur.r + dr);
      if (!present.has(nk) || nk in dist) continue;
      dist[nk] = dist[keyOf(cur.q, cur.r)] + 1;
      queue.push(list.find((x) => x.k === nk));
    }
  }
  return dist;
}

// sciezka: tryby walk/jump (skoki), loop (powrot)
function randomPath(len, mode, start) {
  const p = [start];
  let dir = pick(DIRS);
  for (let k = 0; k < len; k++) {
    const [cq, cr] = p[p.length - 1];
    if (mode === 'jump' && rnd() < 0.2) {
      const nq = cq + ri(-2, 2);
      const nr = cr + ri(-2, 2);
      if (inDom(nq, nr)) { p.push([nq, nr]); continue; }
    }
    if (mode === 'loop' && p.length > 3 && rnd() < 0.15) {
      p.push(p[ri(0, p.length - 2)]);
      continue;
    }
    let ok = false;
    // tryb straight: utrzymuje kierunek (~70%), wiec okno skretu jest czesto dopuszczalne
    if (mode === "straight" && rnd() < 0.7 && inDom(cq + dir[0], cr + dir[1])) {
      p.push([cq + dir[0], cr + dir[1]]);
      continue;
    }
    for (let t = 0; t < 10 && !ok; t++) {
      dir = pick(DIRS);
      const [dq, dr] = dir;
      if (inDom(cq + dq, cr + dr)) { p.push([cq + dq, cr + dr]); ok = true; }
    }
    if (!ok) break;
  }
  return p;
}
const flat = (p) => p.flatMap(([q, r]) => [q, r]);
const toObjs = (p) => p.map(([q, r]) => ({ q, r }));
// wybor heksu startowego: lad w glebi (sea >= 2) z wiekszym prawdopodobienstwem; czasem wybrzeze
const WATER = (h) => h.t === 'morze' || h.t === 'plytkie_morze';
function randomKeyStart(mp, mode = 'inland') {
  const land = mp.list.filter((h) => !WATER(h));
  const inland = land.filter((h) => (mp.sea[h.k] ?? 0) >= 2);
  const coastal = land.filter((h) => (mp.sea[h.k] ?? 0) === 1);
  let pool = mode === 'coastal' && coastal.length > 0 ? coastal : inland.length > 0 ? inland : land;
  if (pool.length === 0) pool = mp.list;
  const h = pick(pool);
  return [h.q, h.r];
}

// ---- 3. mapy ----------------------------------------------------------------------------
const maps = [];
for (let i = 0; i < N_MAPS; i++) {
  const list = randomMap();
  maps.push({
    list,
    sea: bfs(list, (h) => h.t === 'morze' || h.t === 'plytkie_morze'),
    ocean: bfs(list, (h) => h.t === 'morze'),
  });
}
const hexObjs = maps.map((m) => hexesObj(m.list));

const cases = [];
const stats = {};
const bump = (k) => { stats[k] = (stats[k] ?? 0) + 1; };
const blockSubset = (list) => {
  const n = ri(1, 12);
  const keys = [];
  for (let i = 0; i < n; i++) {
    const k = pick(list).k;
    if (!keys.includes(k)) keys.push(k);
  }
  return keys;
};

// collectCoastInlandGrowCandidates
for (let i = 0; i < N_COLLECT; i++) {
  const m = i % N_MAPS;
  const mp = maps[m];
  const start = randomKeyStart(mp, i % 3 === 0 ? "coastal" : "inland");
  const mode = ['straight', 'straight', 'walk', 'jump'][i % 4];
  const p = randomPath(ri(0, 4), mode, start);
  const cur = p[p.length - 1];
  const mouthK = keyOf(p[0][0], p[0][1]);
  const lc = rnd() < 0.5 ? null : [rnd() * 8 - 4, rnd() * 8 - 4];
  const bl = rnd() < 0.2 ? blockSubset(mp.list) : null;
  const o = {
    hexes: hexObjs[m],
    path: toObjs(p),
    cur: { q: cur[0], r: cur[1] },
    mouthKey: mouthK,
    seaDist: new Map(Object.entries(mp.sea)),
    landCentroid: lc === null ? null : { q: lc[0], r: lc[1] },
    landCenterSquare: null,
    rand: mulberry(0),
    blockRiverKeys: bl === null ? undefined : new Set(bl),
    sepIndex: null,
    minPathSep: ri(0, 4),
    allowReliefTraversal: rnd() < 0.3,
    hardMeander: rnd() < 0.5,
    relaxHardMeander: rnd() < 0.3,
  };
  const seed = newSeed();
  o.rand = mulberry(seed);
  const out = web.collectCoastInlandGrowCandidates(o);
  cases.push({
    fn: 'collect', m, p: flat(p), lc, bl, mk: mouthK, msep: o.minPathSep,
    rel: o.allowReliefTraversal, hard: o.hardMeander, rlx: o.relaxHardMeander, seed,
    out: out.map((c) => [c.q, c.r, c.score]),
  });
  bump(out.length === 0 ? 'collect_empty' : 'collect');
}

// growRiverFromCoastInland
for (let i = 0; i < N_GROW; i++) {
  const m = i % N_MAPS;
  const mp = maps[m];
  const [mq, mr] = randomKeyStart(mp, i % 2 === 0 ? "coastal" : "inland");
  const lc = rnd() < 0.5 ? null : [rnd() * 8 - 4, rnd() * 8 - 4];
  const bl = rnd() < 0.2 ? blockSubset(mp.list) : null;
  const useIdx = bl !== null && rnd() < 0.5;
  const sc = ri(0, 30);
  const hl = ri(0, 10);
  const rel = rnd() < 0.3;
  const msep = ri(0, 4);
  const seed = newSeed();
  const sepIndex = useIdx ? web.RiverHexSpatialIndex.fromKeys(bl) : null;
  const out = web.growRiverFromCoastInland(
    hexObjs[m],
    mq,
    mr,
    new Map(Object.entries(mp.sea)),
    new Map(Object.entries(mp.ocean)),
    mulberry(seed),
    sc,
    hl,
    rel,
    bl === null ? undefined : new Set(bl),
    msep,
    lc === null ? null : { q: lc[0], r: lc[1] },
    null,
    sepIndex,
  );
  cases.push({
    fn: 'grow', m, mq, mr, sc, hl, rel, bl, msep, lc, ix: useIdx, seed,
    out: flat(out.map((h) => [h.q, h.r])),
  });
  bump(out.length >= 3 ? 'grow_ge3' : 'grow_lt3');
  if (useIdx) bump('grow_index');
}

// findRiverMeanderStep
for (let i = 0; i < N_MEANDER; i++) {
  const m = i % N_MAPS;
  const mp = maps[m];
  const [cq, cr] = randomKeyStart(mp, "inland");
  let tq = cq + ri(-2, 2);
  let tr = cr + ri(-2, 2);
  if (!inDom(tq, tr) || (tq === cq && tr === cr)) {
    const [dq, dr] = pick(DIRS);
    tq = cq + 2 * dq;
    tr = cr + 2 * dr;
  }
  const usedKeys = [];
  if (rnd() < 0.4) {
    for (let j = 0; j < ri(1, 6); j++) usedKeys.push(pick(mp.list).k);
  }
  const seed = newSeed();
  const out = web.findRiverMeanderStep(
    hexObjs[m],
    { q: cq, r: cr },
    { q: tq, r: tr },
    new Map(Object.entries(mp.sea)),
    new Set(usedKeys),
    mulberry(seed),
  );
  cases.push({
    fn: 'meander', m, c: [cq, cr], t: [tq, tr], used: usedKeys, seed,
    out: out === null ? null : [out.q, out.r],
  });
  bump(out === null ? 'meander_null' : 'meander');
}

const doc = {
  format: 'p6-m07b2-coast-v1',
  pin: 'edb8fb56',
  seed: SEED,
  domain_r: MAP_R,
  maps: maps.map((m) => ({ hexes: m.list, sea: m.sea, ocean: m.ocean })),
  stats,
  cases,
};
fs.writeFileSync(outArg, JSON.stringify(doc) + '\n');
console.log(JSON.stringify({ cases: cases.length, stats, bytes: fs.statSync(outArg).size }));
