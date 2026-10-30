// Generator wektorow P6.M07A partia 2 (trasowanie: pola/kroki/centroid/audyt; gen-helpers.ts
// :5121-5168, :5580-5611, :5781-5900, :5974-6067, pin edb8fb56). URUCHAMIA prawdziwy kod TS weba.
// Uzycie (WEB_ROOT = katalog z `git archive edb8fb56 gra/src gra/data`):
//   node --experimental-transform-types --no-warnings --import <REJESTR>/m07a-register.mjs \
//        gen-m07a-walk.mjs <WEB_ROOT> <WYJSCIE.json>
// Mapy w tablicy `maps` (indeks w przypadku). Wiersz stanu jak w gen-m07a-vectors.mjs.
// Wspolrzedne zmiennoprzecinkowe (centroid) zapisane jako STRING (String(x)) - pelna precyzja
// (serde_json bez float_roundtrip moze dac 1 ULP).
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m07a-walk.mjs <WEB_ROOT> <WYJSCIE.json>');
  process.exit(2);
}
const G = await import(pathToFileURL(`${root}/gra/src/map/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy: TB, Nakladka: NK } = H;

const rng = G.mulberry32(20261031);
const rnd = () => rng();
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const keyOf = (q, r) => `${q},${r}`;
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const cstr = (c) => (c == null ? null : [String(c.q), String(c.r)]);

// ---------- stan mapy: zapis / odczyt (jak w gen-m07a-vectors.mjs) ----------
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

// Losowa mapa W x H: skupiska, nakladki lasu takze na wodzie, zloza, rzeki z krawedziami.
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

// Wspolny zbior kluczy wszystkich heksow (kolejnosc wstawiania = row-major).
const SIZES = [[10, 10], [12, 9], [14, 12], [16, 16], [18, 14], [20, 24], [24, 20], [11, 17], [30, 22], [36, 28], [9, 5], [6, 6]];

// ---------- kazdy przypadek dostaje SWIEZA kopie mapy ----------
const mkCase = (m) => buildObj(maps[m].rows);

const cases = {
  drainStep: [], drainGoal: [], pathSea: [], dims: [], reliefSource: [], dirs: [], dirDelta: [],
  sameDir: [], reconstruct: [], centroidSeed: [], centroidMouth: [], scoreCentroid: [],
  scoreSquare: [], scoreLandCenter: [], audit: [],
};

// Mapy: 36 losowych.
for (let i = 0; i < 36; i++) {
  const [W, H2] = SIZES[i % SIZES.length];
  addMap(W, H2, randomMap(W, H2));
}
const NMAPS = maps.length;

// ---------- stale/pola: canRiverDrainStep, isRiverDrainageGoal ----------
for (let m = 0; m < NMAPS; m++) {
  const hx = mkCase(m);
  const { w, h } = maps[m];
  const oc = G.oceanConnectedWaterKeys(hx, w, h);
  const od = G.buildOpenOceanDistanceField(mkCase(m), w, h, oc);
  const keys = Object.keys(hx);
  // nk: losowy klucz z mapy (lub spoza mapy), nd 0..6, post phase true/false.
  for (let j = 0; j < 14; j++) {
    const nk = j === 13 ? keyOf(ri(-3, w + 2), ri(-3, h + 2)) : keys[Math.floor(rnd() * keys.length)];
    const nd = ri(0, 6);
    const post = rnd() < 0.5;
    const ret = G.canRiverDrainStep(nk, nd, od, oc, post);
    cases.drainStep.push({ map: m, nk, nd, post, ret });
  }
  // isRiverDrainageGoal: losowa pozycja + klucz zrodla z mapy.
  for (let j = 0; j < 10; j++) {
    const q = ri(-1, w), r = ri(-1, h);
    const src = keys[Math.floor(rnd() * keys.length)];
    const ret = G.isRiverDrainageGoal(q, r, null, mkCase(m), src, oc);
    cases.drainGoal.push({ map: m, q, r, src, ret });
  }
  // pathEndsAtSea: trasa losowa (krotka), z wymiarami albo bez (infer).
  for (let j = 0; j < 8; j++) {
    const len = ri(1, 8);
    const p = [];
    let q = ri(-1, w), r = ri(-1, h);
    for (let i = 0; i < len; i++) {
      p.push([q, r]);
      const [dq, dr] = DIRS[ri(0, 5)];
      q += dq; r += dr;
    }
    const useDims = rnd() < 0.6;
    const ret = useDims
      ? G.pathEndsAtSea(mkCase(m), p.map(([a, b]) => ({ q: a, r: b })), w, h)
      : G.pathEndsAtSea(mkCase(m), p.map(([a, b]) => ({ q: a, r: b })));
    cases.pathSea.push({ map: m, path: p, dims: useDims ? [w, h] : null, ret });
  }
  const dimsRet = G.inferMapDimsFromHexes(mkCase(m));
  cases.dims.push({ map: m, ret: [dimsRet.width, dimsRet.height] });
  // centroidy: seed/mouth z kilkoma capami (w tym granicznymi: 1,2,3,5,6000).
  for (let j = 0; j < 6; j++) {
    const mq = ri(-1, w), mr = ri(-1, h);
    const allowRelief = rnd() < 0.5;
    const cap = [1, 2, 3, 5, 6000, 6000][j];
    const rs = G.estimateLandCentroidFromSeed(mkCase(m), mq, mr, allowRelief, cap);
    cases.centroidSeed.push({ map: m, mq, mr, allowRelief, cap, ret: cstr(rs) });
    const rm = G.estimateLandCentroidFromMouth(mkCase(m), mq, mr, allowRelief, cap);
    cases.centroidMouth.push({ map: m, mq, mr, allowRelief, cap, ret: cstr(rm) });
  }
  // audyt terenu (rozmiar mapy z parametru).
  const au = G.auditMapTerrainData(mkCase(m), w, h);
  cases.audit.push({
    map: m,
    ret: {
      totalHexes: au.totalHexes,
      byTeren: au.byTeren,
      openOceanLandSpecks: au.openOceanLandSpecks,
      enclosedInlandMorzeHexes: au.enclosedInlandMorzeHexes,
      enclosedInlandMorzeComponents: au.enclosedInlandMorzeComponents,
    },
  });
  // kwadrat centrum kontynentu: massKeys = wszystkie klucze mapy (kolejnosc wstawiania).
  const square = G.continentCenterSquare(mkCase(m), keys);
  for (let j = 0; j < 14; j++) {
    const q = ri(-2, w + 1), r = ri(-2, h + 1);
    const nq = q + DIRS[ri(0, 5)][0], nr = r + DIRS[ri(0, 5)][1];
    const useSq = square != null && rnd() < 0.8;
    const ret = G.scoreRiverStepTowardCenterSquare(q, r, nq, nr, useSq ? square : null);
    cases.scoreSquare.push({ map: m, q, r, nq, nr, square: useSq, ret });
  }
  for (let j = 0; j < 8; j++) {
    const q = ri(-2, w + 1), r = ri(-2, h + 1);
    const [dq, dr] = DIRS[ri(0, 5)];
    const nq = q + dq, nr = r + dr;
    const useSq = square != null && rnd() < 0.5;
    const centroid = rnd() < 0.8 ? { q: ri(-1, w) + rnd(), r: ri(-1, h) + rnd() } : null;
    const ret = G.scoreRiverStepTowardLandCenter(q, r, nq, nr, useSq ? square : null, centroid);
    cases.scoreLandCenter.push({
      map: m, q, r, nq, nr, square: useSq, centroid: cstr(centroid), ret,
    });
  }
}

// ---------- isReliefRiverSource (kazdy teren) ----------
for (const t of TERRAINS) {
  cases.reliefSource.push({ terrain: t, ret: G.isReliefRiverSource(t) });
}

// ---------- scoreRiverStepTowardCentroid (czysta funkcja, centroid jako string) ----------
for (let j = 0; j < 200; j++) {
  const q = ri(-3, 8), r = ri(-3, 8);
  const [dq, dr] = DIRS[ri(0, 5)];
  const nq = q + dq, nr = r + dr;
  const centroid = rnd() < 0.15 ? null : { q: ri(-2, 9) + (rnd() < 0.5 ? rnd() : 0), r: ri(-2, 9) + (rnd() < 0.5 ? rnd() : 0) };
  const ret = G.scoreRiverStepTowardCentroid(q, r, nq, nr, centroid);
  cases.scoreCentroid.push({ q, r, nq, nr, centroid: cstr(centroid), ret });
}

// ---------- kierunki i delty (riverStepDir, sameRiverDir, riverHexDirDelta) ----------
for (let a = -2; a <= 2; a++) {
  for (let b = -2; b <= 2; b++) {
    const from = { q: a, r: b };
    const to = { q: a + DIRS[ri(0, 5)][0], r: b + DIRS[ri(0, 5)][1] };
    cases.dirs.push({ from: [from.q, from.r], to: [to.q, to.r], ret: G.riverStepDir(from, to) });
  }
}
for (let l = 0; l < 6; l++) {
  for (let n = 0; n < 6; n++) cases.dirDelta.push({ last: l, next: n, ret: G.riverHexDirDelta(l, n) });
}
// Wartosci spoza 0..5 (wejscie jest przypadkowo zakresu - ujemny modulo JS).
for (const [l, n] of [[0, 6], [5, -1], [-1, 7], [3, -4], [12, 1], [0, -6], [4, 4]]) {
  cases.dirDelta.push({ last: l, next: n, ret: G.riverHexDirDelta(l, n) });
}
for (const a of DIRS) for (const b of DIRS) {
  cases.sameDir.push({ a, b, ret: G.sameRiverDir(a, b) });
}
cases.sameDir.push({ a: [0, 0], b: [0, 0], ret: G.sameRiverDir([0, 0], [0, 0]) });

// ---------- reconstructRiverPath: lancuchy cameFrom ----------
for (let j = 0; j < 40; j++) {
  const len = ri(1, 12);
  const chain = [];
  const seen = new Set();
  let q = ri(-2, 6), r = ri(-2, 6);
  while (chain.length < len) {
    const k = keyOf(q, r);
    if (!seen.has(k)) { seen.add(k); chain.push([q, r]); }
    const [dq, dr] = DIRS[ri(0, 5)];
    q += dq; r += dr;
  }
  // pairs: [child, parent] dla kolejnych elementow; ostatni = koniec.
  const pairs = [];
  for (let i = 1; i < chain.length; i++) pairs.push([keyOf(...chain[i]), keyOf(...chain[i - 1])]);
  // Czasem brak rodzica konca (urwany lancuch): wynik to sama koncowka.
  const cut = rnd() < 0.25;
  const cameFromPairs = cut ? pairs.slice(0, Math.max(0, pairs.length - 1)) : pairs;
  const endK = keyOf(...chain[chain.length - 1]);
  const cameFrom = new Map(cameFromPairs);
  const ret = G.reconstructRiverPath(cameFrom, endK).map((p) => [p.q, p.r]);
  cases.reconstruct.push({ pairs: cameFromPairs, end: endK, ret });
}

const doc = {
  maps,
  cases,
};
writeFileSync(out, JSON.stringify(doc));
const counts = Object.fromEntries(Object.entries(doc.cases).map(([k, v]) => [k, v.length]));
console.log(JSON.stringify({ maps: maps.length, ...counts }));
