// Generator wektorow P6.M07A partia 3 (wzrost w glab ladu, okno skretu, indeks sep, profil, cap 6000
// na duzej mapie). URUCHAMIA prawdziwy kod TS weba (pin edb8fb56, gen-helpers.ts :5669-5752,
// :5819-5842, :5903-5974, :6070-6172, :6988-7036, :8975-9056).
// Uzycie (WEB_ROOT = katalog z `git archive edb8fb56 gra/src gra/data`):
//   CIV_RIVER_PROFILE=1 node --experimental-transform-types --no-warnings \
//     --import <REJESTR>/m07a-register.mjs gen-m07a-grow.mjs <WEB_ROOT> <WYJSCIE.json>
// Mapy w tablicy `maps` (ten sam format co walk: {w,h,rows}); ostatnia mapa = 100x80 (cap 6000).
// Wspolrzedne zmiennoprzecinkowe jako STRING (String(x)); wynik score: Infinity -> "inf", -Infinity -> "-inf".
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m07a-grow.mjs <WEB_ROOT> <WYJSCIE.json>');
  process.exit(2);
}
const G = await import(pathToFileURL(`${root}/gra/src/map/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy: TB, Nakladka: NK } = H;

const rng = G.mulberry32(20261101);
const rnd = () => rng();
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const keyOf = (q, r) => `${q},${r}`;
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const cstr = (c) => (c == null ? null : [String(c.q), String(c.r)]);
const numS = (x) => (Number.isFinite(x) ? String(x) : x > 0 ? 'inf' : x < 0 ? '-inf' : 'nan');
const parseKey = (k) => k.split(',').map(Number);

// ---------- mapy (jak w gen-m07a-walk.mjs, inne ziarno) ----------
function dumpObj(hexes) {
  return Object.entries(hexes).map(([k, h]) => [
    k, h.terenBazowy, h.nakladka, h.zloze ? 1 : 0, h.rzeka.obecna ? 1 : 0, [...h.rzeka.krawedzie],
  ]);
}
function buildObj(rows) {
  const o = {};
  for (const [k, terr, nak, z, ro, ed] of rows) {
    const [q, r] = k.split(',').map(Number);
    o[k] = {
      coords: { q, r },
      terenBazowy: terr,
      nakladka: nak,
      rzeka: { obecna: ro === 1, krawedzie: [...ed] },
      ...(z ? { zloze: 'rudy' } : {}),
    };
  }
  return o;
}
const maps = [];
const addMap = (W, H2, hexesObj) => {
  maps.push({ w: W, h: H2, rows: dumpObj(hexesObj) });
  return maps.length - 1;
};
const TERRAINS = [TB.Laka, TB.Rownina, TB.Wzgorza, TB.Gory, TB.PlytkieMorze, TB.Morze, TB.Pustynia, TB.Polarny];
const WEIGHTS = [18, 14, 6, 4, 10, 16, 6, 2];
const WSUM = WEIGHTS.reduce((a, b) => a + b, 0);
function pickTerrain() {
  let x = rnd() * WSUM;
  for (let i = 0; i < TERRAINS.length; i++) {
    x -= WEIGHTS[i];
    if (x < 0) return TERRAINS[i];
  }
  return TERRAINS[0];
}
const isWater = (t) => t === TB.Morze || t === TB.PlytkieMorze;
function randomMap(W, H2) {
  const hexes = {};
  for (let r = 0; r < H2; r++) {
    for (let q = 0; q < W; q++) {
      const left = q > 0 ? hexes[keyOf(q - 1, r)] : null;
      const up = r > 0 ? hexes[keyOf(q, r - 1)] : null;
      let t;
      const x = rnd();
      if (left && x < 0.5) t = left.terenBazowy;
      else if (up && x < 0.75) t = up.terenBazowy;
      else t = pickTerrain();
      const water = isWater(t);
      const nak = rnd() < (water ? 0.05 : 0.14) ? NK.Las : NK.Brak;
      const zloze = rnd() < 0.06;
      let rzeka = { obecna: false, krawedzie: [] };
      if (rnd() < 0.12) {
        const n = ri(1, 3);
        const ed = new Set();
        while (ed.size < n) ed.add(ri(0, 5));
        rzeka = { obecna: true, krawedzie: [...ed].sort((a, b) => a - b) };
      }
      hexes[keyOf(q, r)] = {
        coords: { q, r },
        terenBazowy: t,
        nakladka: nak,
        rzeka,
        ...(zloze ? { zloze: 'rudy' } : {}),
      };
    }
  }
  return hexes;
}
const mkCase = (m) => buildObj(maps[m].rows);

const SIZES = [[10, 10], [12, 9], [14, 12], [16, 16], [18, 14], [20, 24], [24, 20], [11, 17], [30, 22], [36, 28], [9, 5], [6, 6]];
for (let i = 0; i < 24; i++) {
  const [W, H2] = SIZES[i % SIZES.length];
  addMap(W, H2, randomMap(W, H2));
}
const NMAPS = maps.length;

// Pola per mapa (liczone przez web): seaDist, oceanConnected, openOceanDist.
const fields = [];
for (let m = 0; m < NMAPS; m++) {
  const { w, h } = maps[m];
  const oc = G.oceanConnectedWaterKeys(mkCase(m), w, h);
  const sea = G.buildSeaDistanceField(mkCase(m));
  const od = G.buildOpenOceanDistanceField(mkCase(m), w, h, oc);
  fields.push({ oc, sea, od });
}

// ---------- growRiverInlandBeforeDrainage: start x (cel, cap, H) N-1/N/N+1 + losowe warianty ----------
const growCases = [];
let seedCounter = 1000;
for (let m = 0; m < NMAPS; m++) {
  const hx0 = mkCase(m);
  const keys = Object.keys(hx0);
  const { w, h } = maps[m];
  const square = G.continentCenterSquare(mkCase(m), keys);
  for (let s = 0; s < 2; s++) {
    const [sq, sr] = parseKey(keys[Math.floor(rnd() * keys.length)]);
    for (const C of [4, 9, 12]) {
      for (const T of [C - 1, C, C + 1]) {
        for (const H2 of [7, 8, 9]) {
          const allowRelief = rnd() < 0.5;
          const relaxSea = rnd() < 0.25;
          const blockOn = rnd() < 0.5;
          const block = blockOn ? Array.from({ length: ri(0, 25) }, () => keys[Math.floor(rnd() * keys.length)]) : null;
          const minSep = [0, 2, 3, 4][ri(0, 3)];
          const cen = rnd() < 0.3 ? null : { q: ri(0, w) + rnd(), r: ri(0, h) + rnd() };
          const useSq = square != null && rnd() < 0.5;
          const growthMax = rnd() < 0.3 ? C + 2 : null;
          const seed = seedCounter++;
          const rand = G.mulberry32(seed);
          const path = G.growRiverInlandBeforeDrainage(
            mkCase(m), sq, sr, fields[m].sea, fields[m].od, rand, T, C, H2,
            allowRelief, relaxSea, growthMax,
            block ? new Set(block) : undefined, minSep, cen, useSq ? square : null,
          );
          growCases.push({
            map: m, sq, sr, target: T, cap: C, hard: H2, allowRelief, relaxSea, growthMax,
            block, minSep, centroid: cstr(cen), square: useSq, seed,
            ret: path.map((p) => [p.q, p.r]),
          });
        }
      }
    }
  }
}

// ---------- collectInlandDrainGrowCandidates: losowa trasa + warianty flag ----------
const collectCases = [];
for (let j = 0; j < 400; j++) {
  const m = ri(0, NMAPS - 1);
  const hx = mkCase(m);
  const keys = Object.keys(hx);
  const { w, h } = maps[m];
  const [sq, sr] = parseKey(keys[Math.floor(rnd() * keys.length)]);
  const len = ri(1, 6);
  const path = [{ q: sq, r: sr }];
  while (path.length < len) {
    const c = path[path.length - 1];
    const [dq, dr] = DIRS[ri(0, 5)];
    path.push({ q: c.q + dq, r: c.r + dr });
  }
  const cur = path[path.length - 1];
  const srcKey = keys[Math.floor(rnd() * keys.length)];
  const hard = rnd() < 0.6;
  const relaxHard = rnd() < 0.3;
  const relaxSea = rnd() < 0.3;
  const allowRelief = rnd() < 0.5;
  const block = rnd() < 0.5 ? Array.from({ length: ri(0, 20) }, () => keys[Math.floor(rnd() * keys.length)]) : null;
  const minSep = [0, 2, 3][ri(0, 2)];
  const cen = rnd() < 0.3 ? null : { q: ri(0, w) + rnd(), r: ri(0, h) + rnd() };
  const useSq = G.continentCenterSquare(hx, keys) != null && rnd() < 0.5;
  const sqObj = useSq ? G.continentCenterSquare(mkCase(m), keys) : null;
  const seed = seedCounter++;
  const ret = G.collectInlandDrainGrowCandidates({
    hexes: hx, path, cur, srcKey, seaDist: fields[m].sea, openOceanDist: fields[m].od,
    landCentroid: cen, landCenterSquare: sqObj, rand: G.mulberry32(seed),
    blockRiverKeys: block ? new Set(block) : undefined, minPathSep: minSep,
    allowReliefTraversal: allowRelief, hardMeander: hard, relaxHardMeander: relaxHard,
    relaxSeaBuffer: relaxSea,
  });
  collectCases.push({
    map: m, path: path.map((p) => [p.q, p.r]), srcKey, hardMeander: hard, relaxHard, relaxSea,
    allowRelief, block, minSep, centroid: cstr(cen), square: sqObj != null, seed,
    ret: ret.map((c) => [c.q, c.r, numS(c.score)]),
  });
}

// ---------- nearestRiverHexDistance + RiverHexSpatialIndex + riverGrowStepPassesSep ----------
const nearestCases = [];
const sepCases = [];
for (let j = 0; j < 260; j++) {
  const far = j >= 200;
  const n = ri(0, far ? 3 : 40);
  const list = Array.from({ length: n }, () => (far
    ? keyOf(ri(150, 260), ri(-200, 200))
    : keyOf(ri(-5, 35), ri(-5, 35))));
  const set = new Set(list);
  const idx = G.RiverHexSpatialIndex.fromKeys(list);
  const sq = far ? ri(-3, 3) : ri(-10, 40);
  const sr = far ? ri(-3, 3) : ri(-10, 40);
  nearestCases.push({
    keys: list, sq, sr,
    brute: numS(G.nearestRiverHexDistance(sq, sr, set, null)),
    indexed: numS(G.nearestRiverHexDistance(sq, sr, set, idx)),
    indexSize: idx.size,
  });
}
for (let j = 0; j < 200; j++) {
  const n = ri(0, 12);
  const list = Array.from({ length: n }, () => keyOf(ri(-4, 14), ri(-4, 14)));
  const set = new Set(list);
  const idx = G.RiverHexSpatialIndex.fromKeys(list);
  const nq = ri(-4, 14), nr = ri(-4, 14);
  const minSep = ri(-1, 5);
  sepCases.push({
    keys: list, nq, nr, minSep,
    ret: G.riverGrowStepPassesSep(nq, nr, set, minSep, null),
    retIndexed: G.riverGrowStepPassesSep(nq, nr, set, minSep, idx),
  });
}
// Indeks dodawany krok po kroku (add) - rozmiar i dedup.
const addCases = [];
for (let j = 0; j < 40; j++) {
  const idx = new G.RiverHexSpatialIndex();
  const list = Array.from({ length: ri(0, 30) }, () => keyOf(ri(-8, 20), ri(-8, 20)));
  for (const k of list) idx.add(k);
  addCases.push({ keys: list, size: idx.size });
}

// ---------- okno skretu, kierunki, delty ----------
const windowCases = [];
for (let j = 0; j < 320; j++) {
  const m = ri(0, NMAPS - 1);
  const [sq, sr] = [ri(-2, 8), ri(-2, 8)];
  const path = [{ q: sq, r: sr }];
  let dir = ri(0, 5);
  const len = ri(1, 12);
  while (path.length < len) {
    const choice = rnd();
    const turn = choice < 0.4 ? 0 : choice < 0.6 ? 1 : choice < 0.8 ? -1 : choice < 0.9 ? 2 : -2;
    dir = ((dir + turn) % 6 + 6) % 6;
    const c = path[path.length - 1];
    const [dq, dr] = DIRS[dir];
    path.push({ q: c.q + dq, r: c.r + dr });
  }
  // czasem skok (niesasiedni), by sprawdzic pomijanie w pathSegmentDirs
  if (j % 17 === 0) path.push({ q: path[path.length - 1].q + 3, r: path[path.length - 1].r });
  const last = path[path.length - 1];
  const steps = [];
  for (const [dq, dr] of DIRS) steps.push([last.q + dq, last.r + dr]);
  steps.push([last.q + 3, last.r]);
  windowCases.push({
    map: m,
    path: path.map((p) => [p.q, p.r]),
    steps: steps.map(([nq, nr]) => ({ nq, nr, ret: G.isRiverWindowTurnAllowed(path, nq, nr) })),
    segDirs: G.pathSegmentDirs(path),
    turnDeltas: G.pathSignedTurnDeltas(G.pathSegmentDirs(path)),
  });
}
const dirCases = [];
for (let a = -2; a <= 2; a++) {
  for (let b = -2; b <= 2; b++) {
    const ret = G.neighborDirIndex(0, 0, a, b);
    dirCases.push({ kind: 'neighbor', a, b, ret });
  }
}
for (let l = 0; l <= 5; l++) for (let n = 0; n <= 5; n++) dirCases.push({ kind: 'signed', a: l, b: n, ret: G.signedRiverDirDelta(l, n) });
for (const [l, n] of [[6, 0], [-1, 7], [12, 1], [0, -6], [3, -4]]) dirCases.push({ kind: 'signed', a: l, b: n, ret: G.signedRiverDirDelta(l, n) });

// ---------- cap 6000 na duzej mapie (100x80 = 8000 heksow, wszystkie laka) ----------
const BW = 100, BH = 80;
const bigHexes = {};
for (let r = 0; r < BH; r++) for (let q = 0; q < BW; q++) {
  bigHexes[keyOf(q, r)] = { coords: { q, r }, terenBazowy: TB.Laka, nakladka: NK.Brak, rzeka: { obecna: false, krawedzie: [] } };
}
const bigIdx = addMap(BW, BH, bigHexes);
const bigCaps = [];
for (const [sq, sr] of [[50, 40], [0, 0], [99, 79], [10, 70]]) {
  for (const cap of [1, 5999, 6000, 6001, 7000, 8000]) {
    const ret = G.estimateLandCentroidFromSeed(mkCase(bigIdx), sq, sr, false, cap);
    bigCaps.push({ map: bigIdx, sq, sr, cap, ret: cstr(ret) });
  }
}

// ---------- profil: formatowanie (stan z rpEnsure) i toFixed ----------
const profileCases = [];
const cases_fixed = [];
for (const x of [0.5, 1.5, 2.5, 0.25, 0.125, 1.005, 2.675, 12.25, 12.35, 0.05, 99.95, 0, 1e-7, 123456.5, 0.45, 7]) {
  for (const d of [0, 1, 2]) cases_fixed.push({ x: String(x), d, ret: x.toFixed(d) });
}
G.resetRiverProfileStats();
profileCases.push({ stats: null, total: null, ret: G.formatRiverProfileReport(undefined) });
for (let j = 0; j < 6; j++) {
  G.resetRiverProfileStats();
  const s = G.rpEnsure();
  const vals = () => [12.5, 0.25, 999.75, 1234.5, 0.5, 2.5, 7.125, 40.0625, 3.45, 0.05][ri(0, 9)];
  s.fieldCacheMs = vals(); s.fieldCacheCalls = ri(0, 9);
  s.generateRiversMs = vals() * 10; s.genStage1Ms = vals(); s.genStage2Ms = vals(); s.genStage3Ms = vals();
  s.genDecorMs = vals(); s.genDryPatchMs = vals(); s.genStage2Rounds = ri(0, 5);
  s.topUpMs = vals() * 3; s.topUpPassMs = [vals(), vals(), vals()].slice(0, ri(0, 3));
  s.topUpHardStartsMs = vals(); s.topUpDryPatchMs = vals(); s.topUpGridProxMs = vals();
  s.traceRiverCalls = ri(0, 99); s.traceRiverMs = vals(); s.aStarCalls = ri(0, 9); s.aStarMs = vals();
  s.forceFillCalls = ri(0, 9);
  const total = [undefined, 2000.5, 0, 5000][j % 4];
  profileCases.push({
    stats: {
      fieldCacheMs: s.fieldCacheMs, fieldCacheCalls: s.fieldCacheCalls,
      generateRiversMs: s.generateRiversMs, genStage1Ms: s.genStage1Ms, genStage2Ms: s.genStage2Ms,
      genStage3Ms: s.genStage3Ms, genDecorMs: s.genDecorMs, genDryPatchMs: s.genDryPatchMs,
      genStage2Rounds: s.genStage2Rounds, topUpMs: s.topUpMs, topUpPassMs: [...s.topUpPassMs],
      topUpHardStartsMs: s.topUpHardStartsMs, topUpDryPatchMs: s.topUpDryPatchMs,
      topUpGridProxMs: s.topUpGridProxMs, traceRiverCalls: s.traceRiverCalls, traceRiverMs: s.traceRiverMs,
      aStarCalls: s.aStarCalls, aStarMs: s.aStarMs, forceFillCalls: s.forceFillCalls,
    },
    total: total === undefined ? null : total,
    ret: G.formatRiverProfileReport(total),
  });
}
G.resetRiverProfileStats();

const doc = {
  maps,
  cases: {
    grow: growCases,
    collect: collectCases,
    nearest: nearestCases,
    sep: sepCases,
    indexAdd: addCases,
    window: windowCases,
    dirs: dirCases,
    bigCap: bigCaps,
    profile: profileCases,
    toFixed: cases_fixed,
  },
  meta: { bigMapIndex: bigIdx, seedBase: 1000, nMapsRandom: NMAPS },
};
writeFileSync(out, JSON.stringify(doc));
const counts = Object.fromEntries(Object.entries(doc.cases).map(([k, v]) => [k, v.length]));
console.log(JSON.stringify({ maps: maps.length, ...counts }));
