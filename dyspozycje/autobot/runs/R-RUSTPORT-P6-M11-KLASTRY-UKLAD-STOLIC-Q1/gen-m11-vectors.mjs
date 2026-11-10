// P6.M11 - wektory z URUCHOMIONEGO weba (pin edb8fb56) dla zakresu klastrow "uklad stolic":
//   gra/src/map/clusters.ts   :1351-1537, 1553-1769, 1801-1846, 2166-3361
//
// Metoda (bez przepisywania logiki; jak P6.M10):
//  - clusters.ts: kopia PLIKU weba z dopisanym slowem `export` przed prywatnymi deklaracjami
//    najwyzszego poziomu (function/const/type/interface). Generator WERYFIKUJE, ze po wycieciu
//    wstawionych `export ` kopia jest bajt w bajt rowna oryginalowi (drift => blad). Kopia lezy
//    obok oryginalu w <WEB_ROOT>/gra/src/map/, wiec importy wzgledne dzialaja bez zmian.
//  - mapy: PRAWDZIWY generateMap (5 specyfikacji jak P6.1C/M09/M10) + mapy syntetyczne z jawnym ziarnem.
//  - klastry (fixtures): budowane PRAWDZIWYMI funkcjami weba (placeClusterCentersAcrossLandmasses,
//    assignVoronoiRegions, buildClusterCities), potem celowo psute (zbyt bliskie stolice, MP przy
//    obcej stolicy, same stolice, wszystkie w jednej cwiartce, brak flagi stolicy), zeby naprawy
//    (enforce*, repack*) faktycznie dzialaly.
//  - rand: mulberry32(ziarno) z licznikiem wywolan (porownujemy zuzycie strumienia).
//
// Uzycie:
//   node --experimental-transform-types --no-warnings --import ./m11-loader-register.mjs \
//     ./gen-m11-vectors.mjs <WEB_ROOT> <OUT_JSON>
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , webRootArg, outArg] = process.argv;
if (!webRootArg || !outArg) {
  console.error('usage: <WEB_ROOT> <OUT_JSON>');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const srcPath = (p) => join(webRoot, 'gra/src', p);
const src = (p) => pathToFileURL(srcPath(p)).href;

const origLog = console.log;
const origWarn = console.warn;
const quiet = (fn) => {
  console.log = () => {};
  console.warn = () => {};
  try {
    return fn();
  } finally {
    console.log = origLog;
    console.warn = origWarn;
  }
};

// ---------------------------------------------------------------------------
// Kopia clusters.ts z `export` przed prywatnymi deklaracjami (weryfikowana)
// ---------------------------------------------------------------------------
const clustersOrig = readFileSync(srcPath('map/clusters.ts'), 'utf8');
const origLines = clustersOrig.split('\n');
let insertedExports = 0;
const exportedLines = origLines.map((line) => {
  if (/^(function |const |type |interface )/.test(line)) {
    insertedExports++;
    return 'export ' + line;
  }
  return line;
});
const stubText = exportedLines.join('\n');
// weryfikacja: po usunieciu wstawek kopia == oryginal
const roundTrip = stubText
  .split('\n')
  .map((l, i) => (l !== origLines[i] && l === 'export ' + origLines[i] ? origLines[i] : l))
  .join('\n');
if (roundTrip !== clustersOrig) throw new Error('kopia clusters.ts rozni sie od oryginalu poza `export `');
const stubPath = srcPath('map/clusters.m11-exports.ts');
writeFileSync(stubPath, stubText);

const C = await import(pathToFileURL(stubPath).href);
const GH = await import(src('map/gen-helpers.ts'));
const { mulberry32, buildSeaDistanceField } = GH;
const { generateMap } = await import(src('map/generator.ts'));

// ---------------------------------------------------------------------------
// Narzedzia
// ---------------------------------------------------------------------------
const f = (x) => (Object.is(x, -0) ? '-0' : String(x)); // f64 jako TEKST (Infinity/-Infinity/NaN tez)
const P = (h) => [h.q, h.r];
const PL = (arr) => arr.map(P);
const H = ([q, r]) => ({ q, r });
const fnv1a64 = (s) => {
  let h = 0xcbf29ce484222325n;
  for (const b of Buffer.from(s, 'utf8')) {
    h ^= BigInt(b);
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
};
const mkRand = (seed) => {
  const g = mulberry32(seed);
  let n = 0;
  const fn = () => {
    n++;
    return g();
  };
  fn.count = () => n;
  return fn;
};
const gr = mulberry32(20261022);
const rnd = () => gr();
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const sampleN = (arr, n) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
};

// ---------------------------------------------------------------------------
// Mapy: teren jako kod 1-znakowy
// ---------------------------------------------------------------------------
const T2C = {
  morze: 'm',
  plytkie_morze: 'p',
  laka: 'l',
  rownina: 'r',
  wzgorza: 'w',
  gory: 'g',
  pustynia: 'u',
  polarny: 'o',
};
const C2T = Object.fromEntries(Object.entries(T2C).map(([k, v]) => [v, k]));

function repFromWebMap(id, source, map) {
  const hexes = Object.values(map.hexes);
  const w = map.szerokoscQ;
  const h = map.wysokoscR;
  if (hexes.length !== w * h) throw new Error(`${id}: liczba hexow`);
  let terrain = '';
  let river = '';
  hexes.forEach((hx, i) => {
    const q = i % w;
    const r = Math.floor(i / w);
    if (hx.coords.q !== q || hx.coords.r !== r) throw new Error(`${id}: kolejnosc hexow nie jest wierszowa`);
    const c = T2C[hx.terenBazowy];
    if (!c) throw new Error(`${id}: teren ${hx.terenBazowy}`);
    terrain += c;
    river += hx.rzeka && hx.rzeka.obecna === true ? '1' : '0';
  });
  const canon = hexes.map((hx) => `${hx.coords.q},${hx.coords.r},${hx.terenBazowy}`).join(';');
  const sd = buildSeaDistanceField(map.hexes);
  const sea = hexes.map((hx) => (sd.has(`${hx.coords.q},${hx.coords.r}`) ? sd.get(`${hx.coords.q},${hx.coords.r}`) : -1));
  return { id, source, w, h, terrain, river, sea, hexesFnv: fnv1a64(canon) };
}

function webMapFromRep(rep) {
  const hexes = {};
  for (let r = 0; r < rep.h; r++) {
    for (let q = 0; q < rep.w; q++) {
      const i = r * rep.w + q;
      hexes[`${q},${r}`] = {
        coords: { q, r },
        terenBazowy: C2T[rep.terrain[i]],
        rzeka: { obecna: rep.river[i] === '1' },
      };
    }
  }
  return { szerokoscQ: rep.w, wysokoscR: rep.h, hexes };
}

const REAL_SPECS = [
  { id: 'k42', w: 36, h: 28, seed: 42, typ: 'kontynenty' },
  { id: 'k7', w: 36, h: 28, seed: 7, typ: 'kontynenty' },
  { id: 'p123', w: 36, h: 28, seed: 123, typ: 'pangea' },
  { id: 'k3small', w: 24, h: 18, seed: 3, typ: 'kontynenty' },
  { id: 'w5', w: 40, h: 30, seed: 5, typ: 'wyspy' },
];

function synthRep(id, w, h, seed, kind) {
  const g = mulberry32(seed);
  const r01 = () => g();
  const terrain = new Array(w * h).fill('m');
  const blobs = [];
  const nb = kind === 'archipelago' ? 14 : kind === 'pangea' ? 2 : 2 + Math.floor(r01() * 4);
  for (let i = 0; i < nb; i++) {
    const rad =
      kind === 'archipelago'
        ? 2 + r01() * 3
        : kind === 'pangea'
          ? Math.min(w, h) * (0.3 + r01() * 0.15)
          : 3 + r01() * (Math.min(w, h) / 3);
    blobs.push({ q: r01() * w, r: r01() * h, rad });
  }
  const weights = [
    ['l', 30],
    ['r', 25],
    ['w', 15],
    ['g', 8],
    ['u', 10],
    ['o', 4],
  ];
  const total = weights.reduce((s, x) => s + x[1], 0);
  const pickTerrain = () => {
    let x = r01() * total;
    for (const [c, wt] of weights) {
      x -= wt;
      if (x < 0) return c;
    }
    return 'l';
  };
  for (let r = 0; r < h; r++) {
    for (let q = 0; q < w; q++) {
      let inside = false;
      for (const b of blobs) {
        const d = Math.hypot(q - b.q, (r - b.r) * 1.1);
        if (d <= b.rad * (0.75 + 0.3 * r01())) inside = true;
      }
      if (inside && kind === 'holes' && r01() < 0.12) inside = false;
      if (inside) terrain[r * w + q] = pickTerrain();
    }
  }
  // plytkie morze przy brzegu
  const copy = terrain.slice();
  for (let r = 0; r < h; r++) {
    for (let q = 0; q < w; q++) {
      if (copy[r * w + q] !== 'm') continue;
      const nbs = [
        [1, 0],
        [1, -1],
        [0, -1],
        [-1, 0],
        [-1, 1],
        [0, 1],
      ];
      const touchesLand = nbs.some(([dq, dr]) => {
        const nq = q + dq;
        const nr = r + dr;
        return nq >= 0 && nq < w && nr >= 0 && nr < h && copy[nr * w + nq] !== 'm' && copy[nr * w + nq] !== 'p';
      });
      if (touchesLand && r01() < 0.5) terrain[r * w + q] = 'p';
    }
  }
  let river = '';
  for (let i = 0; i < w * h; i++) river += terrain[i] !== 'm' && terrain[i] !== 'p' && r01() < 0.1 ? '1' : '0';
  const rep = { id, source: 'synthetic', w, h, terrain: terrain.join(''), river };
  const web = webMapFromRep(rep);
  const sd = buildSeaDistanceField(web.hexes);
  rep.sea = Object.values(web.hexes).map((hx) => (sd.has(`${hx.coords.q},${hx.coords.r}`) ? sd.get(`${hx.coords.q},${hx.coords.r}`) : -1));
  rep.hexesFnv = fnv1a64(
    Object.values(web.hexes)
      .map((hx) => `${hx.coords.q},${hx.coords.r},${hx.terenBazowy}`)
      .join(';'),
  );
  return rep;
}

const SYNTH_SPECS = [
  ['s_tiny', 12, 10, 11, 'continents'],
  ['s_small', 20, 14, 12, 'continents'],
  ['s_c30', 30, 24, 13, 'continents'],
  ['s_arch40', 40, 30, 14, 'archipelago'],
  ['s_pang36', 36, 28, 15, 'pangea'],
  ['s_hole40', 40, 30, 16, 'holes'],
  ['s_c50', 50, 40, 17, 'continents'],
  ['s_pang64', 64, 48, 18, 'pangea'],
  ['s_arch50', 50, 40, 19, 'archipelago'],
  ['s_c80', 80, 60, 20, 'continents'],
  ['s_pang80', 80, 60, 21, 'pangea'],
  ['s_hole64', 64, 48, 22, 'holes'],
];

// Mapa symetryczna wzgledem srodka (inwersja (q,r) -> (w-1-q, h-1-r), w i h nieparzyste => srodek
// calkowity): dwa identyczne bloki ladu daja REMISY punktacji startu i odleglosci od srodka
// (test kolejnosci/remisow w findBestPlayerStartHex i sortowaniach).
function mirrorRep(id, w, h, seed) {
  const g = mulberry32(seed);
  const terrain = new Array(w * h).fill('m');
  const river = new Array(w * h).fill('0');
  const codes = ['l', 'l', 'l', 'r', 'r', 'w', 'u'];
  for (let r = 2; r <= 8; r++) {
    for (let q = 3; q <= 15; q++) {
      const t = codes[Math.floor(g() * codes.length)];
      const rv = g() < 0.08 ? '1' : '0';
      terrain[r * w + q] = t;
      terrain[(h - 1 - r) * w + (w - 1 - q)] = t;
      river[r * w + q] = rv;
      river[(h - 1 - r) * w + (w - 1 - q)] = rv;
    }
  }
  const rep = { id, source: 'synthetic', w, h, terrain: terrain.join(''), river: river.join('') };
  const web = webMapFromRep(rep);
  const sd = buildSeaDistanceField(web.hexes);
  rep.sea = Object.values(web.hexes).map((hx) => (sd.has(`${hx.coords.q},${hx.coords.r}`) ? sd.get(`${hx.coords.q},${hx.coords.r}`) : -1));
  rep.hexesFnv = fnv1a64(
    Object.values(web.hexes)
      .map((hx) => `${hx.coords.q},${hx.coords.r},${hx.terenBazowy}`)
      .join(';'),
  );
  return rep;
}

const mapsOut = {};
const webMaps = {};
for (const s of REAL_SPECS) {
  const m = quiet(() => generateMap(s.w, s.h, s.seed, s.typ));
  webMaps[s.id] = m;
  mapsOut[s.id] = repFromWebMap(s.id, 'generateMap', m);
  mapsOut[s.id].spec = { w: s.w, h: s.h, seed: s.seed, typ: s.typ };
}
for (const [id, w, h, seed, kind] of SYNTH_SPECS) {
  const rep = synthRep(id, w, h, seed, kind);
  mapsOut[id] = rep;
  webMaps[id] = webMapFromRep(rep);
}
{
  const rep = mirrorRep('s_mirror', 41, 21, 77);
  mapsOut[rep.id] = rep;
  webMaps[rep.id] = webMapFromRep(rep);
}
const MAP_IDS = Object.keys(mapsOut);

// pomocnicze per mapa
const seaMapOf = (id) => {
  const rep = mapsOut[id];
  const m = new Map();
  rep.sea.forEach((d, i) => {
    if (d >= 0) m.set(`${i % rep.w},${Math.floor(i / rep.w)}`, d);
  });
  return m;
};
const ladoweOf = (id) =>
  Object.values(webMaps[id].hexes)
    .filter((h) => C.isSpawnHabitableTerrain(h.terenBazowy))
    .map((h) => ({ q: h.coords.q, r: h.coords.r }));
const foundableOf = (id) =>
  Object.values(webMaps[id].hexes)
    .filter((h) => h.terenBazowy !== 'morze' && h.terenBazowy !== 'plytkie_morze' && h.terenBazowy !== 'gory' && h.terenBazowy !== 'polarny')
    .map((h) => ({ q: h.coords.q, r: h.coords.r }));
const massesOf = (id) => C.groupHabitableMasses(ladoweOf(id));
const randHex = (id, margin = 3) => {
  const rep = mapsOut[id];
  return { q: ri(-margin, rep.w - 1 + margin), r: ri(-margin, rep.h - 1 + margin) };
};
const digestHexes = (list) => fnv1a64(list.map((h) => `${h.q},${h.r}`).join(';'));

// ===========================================================================
// P6.M11 - przypadki (clusters.ts:1351-1537, 1553-1769, 1801-1846, 2166-3361)
// ===========================================================================
const cases = {};
const meta = {
  pin: 'edb8fb56',
  node: process.version,
  insertedExports,
  clustersLines: origLines.length,
};

const bboxOf = (list) => ({
  minQ: Math.min(...list.map((h) => h.q)),
  maxQ: Math.max(...list.map((h) => h.q)),
  minR: Math.min(...list.map((h) => h.r)),
  maxR: Math.max(...list.map((h) => h.r)),
});
const centerOf = (id) => ({ q: (mapsOut[id].w - 1) / 2, r: (mapsOut[id].h - 1) / 2 });

const LABELS = ['mala', 'srednia', 'duza', 'ogromna', 'super'];
const ROSTER = C.ROSTER_KLUCZE;

// --- memo per mapa ---
const memo = (fn) => {
  const m = new Map();
  return (id) => {
    if (!m.has(id)) m.set(id, fn(id));
    return m.get(id);
  };
};
const ladM = memo(ladoweOf);
const massesM = memo(massesOf);
const cacheM = memo((id) => C.massLandCacheFromMasses(massesM(id)));
const seaM = memo(seaMapOf);
const bboxM = memo((id) => bboxOf(ladM(id)));
const mapsWithLand = MAP_IDS.filter((id) => ladM(id).length > 0);
const bigMaps = mapsWithLand.filter((id) => ladM(id).length > 120);
const bboxOut = (b) => (b ? { minQ: b.minQ, maxQ: b.maxQ, minR: b.minR, maxR: b.maxR } : null);
const mcOut = (m) => [f(m.q), f(m.r)];
const hexIn = (a) => ({ q: a[0], r: a[1] });

// ---------------------------------------------------------------------------
// 1. Stale i funkcje czysto liczbowe (clusters.ts:1351-1537)
// ---------------------------------------------------------------------------
cases.byLabel = LABELS.map((l) => ({
  label: l,
  minSea: C.capitalMinSeaDist(l),
  maxSea: C.capitalMaxSeaDist(l),
  minSep: C.capitalMinSeparation(l),
  bodySep: C.clusterBodySeparation(l),
  placementSep: C.clusterCenterPlacementSep(l),
}));
cases.radius = { cityStateRadius: C.clusterCityStateRadius() };
cases.hubReach = [];
for (let n = -4; n <= 16; n++) cases.hubReach.push({ n, reach: C.clusterHubChainReachHex(n), cohesion: C.clusterCohesionMaxHex(n) });
cases.forMap = [];
for (const l of LABELS) {
  for (const w of [0, 1, 40, 79, 80, 81, 100, 168, 250]) {
    for (const h of [0, 1, 50, 79, 80, 81, 120, 300]) {
      cases.forMap.push({
        label: l,
        w,
        h,
        minSea: C.capitalMinSeaDistForMap(l, w, h),
        maxSea: C.capitalMaxSeaDistForMap(l, w, h),
        minSep: C.capitalMinSeparationForMap(l, w, h),
        bodySep: C.clusterBodySeparationForMap(l, w, h),
        placementSep: C.clusterCenterPlacementSepForMap(l, w, h),
      });
    }
  }
}
cases.bodyBuffer = [NaN, Infinity, -Infinity, 0, -0, -1, 0.5, 1, 2, 3, 11, 12, 15, 16, 19, 19.5, 30.2, 1e9].map((s) => ({ s: f(s), result: f(C.clusterBodyBufferRadius(s)) }));

// bramki morza
cases.seaGates = [];
for (const id of MAP_IDS) {
  const sd = seaM(id);
  for (let i = 0; i < 24; i++) {
    const h = randHex(id, 4);
    const mn = pick([0, 1, 4, 7, 10, 12.5, -1]);
    const mx = pick([0, 5, 9, 15, 19, -2]);
    cases.seaGates.push({
      map: id,
      q: h.q,
      r: h.r,
      min: f(mn),
      max: f(mx),
      at: f(C.seaDistAt(sd, h.q, h.r)),
      gate: C.passesMinSeaDistGate(sd, h.q, h.r, mn),
      band: C.passesCapitalSeaBandGate(sd, h.q, h.r, mn, mx),
    });
  }
}
cases.bandPenalty = [];
for (const sea of [-1, 0, 1, 3.5, 4, 9, 10, 12, 15, 16, 20, 100, NaN]) {
  for (const mn of [NaN, -1, 0, -0, 0.5, 4, 10, Infinity]) {
    for (const mx of [NaN, -1, 0, 5, 9, 15, Infinity, -Infinity]) {
      cases.bandPenalty.push({ sea: f(sea), min: f(mn), max: f(mx), result: f(C.capitalSeaBandPenalty(sea, mn, mx)) });
    }
  }
}

// cwiartki
cases.quadrant = [];
for (let i = 0; i < 300; i++) {
  const q = ri(-5, 60);
  const r = ri(-5, 50);
  const midQ = pick([0, 17.5, 20, 33.5, 5.25, 40, -3]);
  const midR = pick([0, 13.5, 20, 30, 7.75, 25, -1]);
  cases.quadrant.push({ q, r, midQ: f(midQ), midR: f(midR), result: C.landQuadrantIndex(q, r, midQ, midR) });
}
cases.minQuarters = [];
for (let n = -3; n <= 15; n++) cases.minQuarters.push({ n, result: C.minimumSpreadQuartersRequired(n) });
cases.countPerQuad = [];
cases.spreadQuad = [];
cases.minSepGate = [];
cases.minSepDist = [];
for (let i = 0; i < 160; i++) {
  const centers = Array.from({ length: ri(0, 9) }, () => ({ q: ri(0, 60), r: ri(0, 50) }));
  const midQ = pick([10, 20, 17.5, 30]);
  const midR = pick([10, 15, 14.5, 25]);
  cases.countPerQuad.push({ centers: PL(centers), midQ: f(midQ), midR: f(midR), result: C.countCentersPerQuadrant(centers, midQ, midR) });
  const bbox = { minQ: pick([0, -3, 4]), maxQ: ri(10, 70), minR: pick([0, 2]), maxR: ri(10, 60) };
  const sp = C.clusterCenterQuadrantSpread(centers, bbox);
  cases.spreadQuad.push({ centers: PL(centers), bbox, occupied: sp.occupiedQuadrants, qSpan: f(sp.qSpan), rSpan: f(sp.rSpan) });
  const c = { q: ri(0, 60), r: ri(0, 50) };
  for (const ms of [0, -1, NaN, Infinity, 5, 12, 12.5, 15, 19]) {
    cases.minSepGate.push({ c: P(c), prior: PL(centers), minSep: f(ms), result: C.passesMinCapitalSeparationGate(c, centers, ms) });
  }
  const msd = C.minCapitalSeparationDistance(c, centers);
  cases.minSepDist.push({ c: P(c), others: PL(centers), result: msd === null ? null : f(msd) });
}
cases.preferredQuads = [];
for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c2 = 0; c2 < 4; c2++) for (let d = 0; d < 4; d++) {
  for (const n of [2, 4, 5, 6, 8]) {
    const counts = [a, b, c2, d];
    const res = C.preferredQuadrantsForSpread(counts, n);
    cases.preferredQuads.push({ counts, n, result: res === null ? null : [...res] });
  }
}
cases.ladder = [NaN, Infinity, -Infinity, -1, 0, -0, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 15.5, 20, 100, 1e6].map((m) => ({ min: f(m), result: C.seaDistRescueLadder(m).map(f) }));

// ---------------------------------------------------------------------------
// 2. pickSpawnHexWithCapitalGates (clusters.ts:1697)
// ---------------------------------------------------------------------------
cases.pickSpawn = [];
for (let i = 0; i < 520; i++) {
  const id = pick(bigMaps);
  const map = webMaps[id];
  const lad = ladM(id);
  const cache = cacheM(id);
  const poolFull = rnd() < 0.5;
  const pool = poolFull ? lad : sampleN(lad, ri(0, 250));
  const useSea = rnd() < 0.7;
  const minSea = pick([0, 2, 4, 6, 8, 10]);
  const maxSea = pick([undefined, undefined, 0, 6, 12, 15]);
  const prior = sampleN(lad, pick([0, 0, 1, 2, 3, 5, 6]));
  const minSep = pick([0, 0, 5, 8, 12, 15]);
  const reqPlayer = rnd() < 0.3;
  const reqLocal = rnd() < 0.75;
  const preferred = rnd() < 0.35 ? pick(lad) : undefined;
  const progressive = rnd() < 0.6;
  const useBBox = rnd() < 0.6;
  const spreadN = useBBox ? pick([undefined, 2, 4, 5, 6, 8, 0]) : undefined;
  const seed = ri(1, 1e9);
  const rand = mkRand(seed);
  const opts = { minSeaDist: minSea, priorCapitals: prior, minCapitalSep: minSep, requirePlayerMassGate: reqPlayer, requireLocalLand: reqLocal, progressiveSoftSea: progressive };
  if (useSea) opts.seaDist = seaM(id);
  if (maxSea !== undefined) opts.maxSeaDist = maxSea;
  if (preferred) opts.preferred = preferred;
  if (useBBox) opts.landBBox = bboxM(id);
  if (spreadN !== undefined) opts.spreadN = spreadN;
  const res = quiet(() => C.pickSpawnHexWithCapitalGates(map, pool, cache, centerOf(id), rand, opts));
  cases.pickSpawn.push({
    map: id,
    pool: poolFull ? null : PL(pool),
    useSea,
    minSea,
    maxSea: maxSea === undefined ? null : maxSea,
    prior: PL(prior),
    minSep,
    reqPlayer,
    reqLocal,
    preferred: preferred ? P(preferred) : null,
    progressive,
    bbox: useBBox ? bboxOut(bboxM(id)) : null,
    spreadN: spreadN === undefined ? null : spreadN,
    seed,
    result: res ? P(res) : null,
    randCalls: rand.count(),
  });
}

// ---------------------------------------------------------------------------
// 3. poissonPickCities, centroidOf, isFarEnough (clusters.ts:1802, 2175, 2183)
// ---------------------------------------------------------------------------
cases.poisson = [];
for (let i = 0; i < 180; i++) {
  const id = pick(bigMaps);
  const lad = ladM(id);
  const region = sampleN(lad, ri(0, 260));
  const maxMiast = pick([-1, 0, 1, 2, 3, 5, 9]);
  const minDist = pick([1, 3, 5, 6, 8]);
  const seed = ri(1, 1e9);
  const rand = mkRand(seed);
  const noOpts = rnd() < 0.15;
  const useAnchor = !noOpts && rnd() < 0.4;
  const useExclude = !noOpts && rnd() < 0.4;
  const anchor = pick(lad);
  const exclude = rnd() < 0.5 && region.length ? pick(region) : pick(lad);
  const anchorVal = pick([undefined, 0, 4, 10]);
  const opts = {};
  if (useAnchor) {
    opts.minDistFrom = anchor;
    if (anchorVal !== undefined) opts.minDistFromValue = anchorVal;
  }
  if (useExclude) opts.excludeHex = exclude;
  const res = C.poissonPickCities(region, maxMiast, minDist, rand, noOpts ? undefined : opts);
  cases.poisson.push({
    map: id,
    region: PL(region),
    maxMiast,
    minDist,
    seed,
    anchor: useAnchor ? P(anchor) : null,
    anchorVal: useAnchor && anchorVal !== undefined ? anchorVal : null,
    exclude: useExclude ? P(exclude) : null,
    result: PL(res),
    randCalls: rand.count(),
  });
}
cases.centroid = [];
cases.farEnough = [];
for (let i = 0; i < 100; i++) {
  const id = pick(mapsWithLand);
  const lad = ladM(id);
  const list = sampleN(lad, ri(0, 200));
  const c = C.centroidOf(list);
  cases.centroid.push({ list: PL(list), q: f(c.q), r: f(c.r) });
  const others = sampleN(lad, ri(0, 6));
  const h = pick(lad);
  for (const md of [0, 3, 8.5, 12]) cases.farEnough.push({ c: P(h), others: PL(others), minDist: f(md), result: C.isFarEnough(h, others, md) });
}

// ---------------------------------------------------------------------------
// 4. pickCapitalHexInRegion i planowanie klastra (clusters.ts:2195-2402)
// ---------------------------------------------------------------------------
const regionDigestOf = (r) => ({ n: r.length, fnv: digestHexes(r) });
cases.pickCapital = [];
let aliasChanged = 0;
for (let i = 0; i < 380; i++) {
  const id = pick(bigMaps);
  const map = webMaps[id];
  const lad = ladM(id);
  // region: region Voronoi jednego srodka albo losowa podlista
  let region;
  let regionKind;
  if (rnd() < 0.6) {
    const centers = sampleN(lad, ri(2, 6));
    region = C.assignVoronoiRegions(lad, centers)[0];
    regionKind = 'voronoi';
  } else {
    region = sampleN(lad, ri(1, 260));
    regionKind = 'sample';
  }
  if (rnd() < 0.05) {
    region = [];
    regionKind = 'empty';
  }
  const useMap = rnd() < 0.7;
  const useSea = rnd() < 0.7;
  const minSea = pick([0, 0, 2, 4, 7, 10]);
  const useAnchor = rnd() < 0.35;
  const anchor = useAnchor ? { ...pick(lad), minDist: pick([3, 8, 12, 40]) } : undefined;
  const prior = sampleN(lad, pick([0, 0, 1, 2, 4]));
  const minSep = pick([0, 0, 8, 12, 15]);
  const blob = region.length ? C.centroidOf(region) : { q: 0, r: 0 };
  const seed = ri(1, 1e9);
  const rand = mkRand(seed);
  const regionBefore = region.slice();
  const res = C.pickCapitalHexInRegion(region, blob, rand, useMap ? map : undefined, useSea ? seaM(id) : undefined, minSea, anchor, prior, minSep);
  const changed = region.length !== regionBefore.length || region.some((h, k) => h.q !== regionBefore[k].q || h.r !== regionBefore[k].r);
  if (changed) aliasChanged++;
  cases.pickCapital.push({
    map: id,
    regionKind,
    region: PL(regionBefore),
    blob: [f(blob.q), f(blob.r)],
    useMap,
    useSea,
    minSea,
    anchor: anchor ? [anchor.q, anchor.r, anchor.minDist] : null,
    prior: PL(prior),
    minSep,
    seed,
    result: res ? P(res) : null,
    regionAfter: regionDigestOf(region),
    changed,
    randCalls: rand.count(),
  });
}
meta.pickCapitalRegionChanged = aliasChanged;

const layoutOut = (l) => (l ? { capital: P(l.capital), state: PL(l.stateCities), growth: l.growthSlot ? P(l.growthSlot) : null } : null);
const citiesOut = (c) => ({ cities: c.cities.map((m) => [m.q, m.r, m.isCapital]), pending: PL(c.pendingStateSlots), growth: c.growthSlot ? P(c.growthSlot) : null });
const genRegion = (id, lad) => {
  if (rnd() < 0.7) {
    const centers = sampleN(lad, ri(2, 7));
    const regs = C.assignVoronoiRegions(lad, centers).filter((r) => r.length > 0);
    return { region: pick(regs), kind: 'voronoi' };
  }
  return { region: sampleN(lad, ri(0, 240)), kind: 'sample' };
};
cases.layout = [];
cases.cities = [];
cases.fallback = [];
cases.landGate = [];
for (let i = 0; i < 230; i++) {
  const id = pick(bigMaps);
  const map = webMaps[id];
  const lad = ladM(id);
  const cache = cacheM(id);
  const { region, kind } = genRegion(id, lad);
  const regionBefore = region.slice();
  const centrum = region.length ? pick(region) : pick(lad);
  const count = pick([-1, 0, 1, 3, 5, 7, 9]);
  const minDist = pick([2, 3, 5, 6]);
  const useAnchor = rnd() < 0.35;
  const anchor = useAnchor ? { ...pick(lad), minDist: pick([3, 8, 12]) } : undefined;
  const growthReserve = pick([undefined, 0, 1, 2]);
  const useMap = rnd() < 0.7;
  const useSea = rnd() < 0.6;
  const minSea = pick([0, 2, 4, 8]);
  const prior = sampleN(lad, pick([0, 1, 3]));
  const minSep = pick([0, 0, 8, 12]);
  const seed = ri(1, 1e9);
  const seedArg = rnd() < 0.2 ? undefined : seed;
  const rand = mkRand(seed + 1);
  const res = quiet(() => C.buildClusterLayoutWithEdgeCapital(region, centrum, count, minDist, rand, anchor, growthReserve, useMap ? map : undefined, seedArg, useSea ? seaM(id) : undefined, minSea, prior, minSep));
  const base = {
    map: id,
    regionKind: kind,
    region: PL(regionBefore),
    centrum: P(centrum),
    count,
    minDist,
    anchor: anchor ? [anchor.q, anchor.r, anchor.minDist] : null,
    useMap,
    useSea,
    minSea,
    prior: PL(prior),
    minSep,
    seed: seedArg === undefined ? null : seedArg,
    randSeed: seed + 1,
  };
  cases.layout.push({
    ...base,
    growthReserve: growthReserve === undefined ? null : growthReserve,
    result: layoutOut(res),
    regionAfter: regionDigestOf(region),
    randCalls: rand.count(),
  });
  if (res) cases.layout[cases.layout.length - 1].cities = C.layoutToClusterCities(res).map((m) => [m.q, m.r, m.isCapital]);

  // buildClusterCities (region swieza kopia)
  {
    const reg2 = regionBefore.slice();
    const rand2 = mkRand(seed + 2);
    const r2 = quiet(() => C.buildClusterCities(reg2, centrum, count, minDist, rand2, anchor, seedArg, useMap ? map : undefined, useSea ? seaM(id) : undefined, minSea, prior, minSep));
    cases.cities.push({ ...base, randSeed: seed + 2, result: citiesOut(r2), regionAfter: regionDigestOf(reg2), randCalls: rand2.count() });
  }
  // buildClusterCitiesSimpleFallback
  {
    const reg3 = regionBefore.slice();
    const r3 = quiet(() => C.buildClusterCitiesSimpleFallback(reg3, centrum, count, minDist, anchor, seed, useMap ? map : undefined, useSea ? seaM(id) : undefined, minSea, prior, minSep));
    cases.fallback.push({ ...base, seed, result: citiesOut(r3), regionAfter: regionDigestOf(reg3) });
  }
  // buildClusterCitiesWithLandGate
  if (i % 2 === 0) {
    const reg4 = regionBefore.slice();
    const existing = sampleN(lad, pick([0, 1, 3]));
    const minClusterDist = pick([4, 8, 12]);
    const rand4 = mkRand(seed + 3);
    const r4 = quiet(() => C.buildClusterCitiesWithLandGate(map, reg4, centrum, count, minDist, rand4, anchor, seed, cache, existing, minClusterDist, useSea ? seaM(id) : undefined, minSea, prior, minSep));
    cases.landGate.push({
      ...base,
      seed,
      randSeed: seed + 3,
      existing: PL(existing),
      minClusterDist,
      result: r4 ? { ...citiesOut(r4), centrum: P(r4.centrum) } : null,
      regionAfter: regionDigestOf(reg4),
      randCalls: rand4.count(),
    });
  }
}
cases.capitalPos = [];
for (let i = 0; i < 60; i++) {
  const cities = Array.from({ length: ri(0, 5) }, () => ({ q: ri(0, 30), r: ri(0, 30), isCapital: rnd() < 0.3 }));
  const fb = { q: ri(0, 30), r: ri(0, 30) };
  cases.capitalPos.push({ cities: cities.map((m) => [m.q, m.r, m.isCapital]), fb: P(fb), result: P(C.clusterCapitalPos({ cities }, fb)) });
}

// ---------------------------------------------------------------------------
// 5. assignTypesToClusterCenters, enforceLocalLandDominance (clusters.ts:2408, 2455)
// ---------------------------------------------------------------------------
cases.assignTypes = [];
for (let i = 0; i < 160; i++) {
  const id = pick(bigMaps);
  const lad = ladM(id);
  const masses = massesM(id);
  const nC = pick([0, 1, 2, 4, 6, 8, 10]);
  const centrumy = rnd() < 0.2 ? Array.from({ length: nC }, () => randHex(id, 2)) : sampleN(lad, nC);
  const playerKlucz = pick(ROSTER);
  const roster = ROSTER.filter((k) => k !== playerKlucz);
  const rosterVariant = pick(['full', 'short', 'empty', 'withEmpty']);
  const rosterUsed = rosterVariant === 'full' ? roster : rosterVariant === 'short' ? roster.slice(0, 3) : rosterVariant === 'empty' ? [] : ['', roster[0], '', roster[1], roster[2]];
  const seed = ri(1, 1e9);
  const rand = mkRand(seed);
  const res = quiet(() => C.assignTypesToClusterCenters(centrumy, masses, playerKlucz, rosterUsed, rand));
  cases.assignTypes.push({ map: id, centrumy: PL(centrumy), playerKlucz, roster: rosterUsed, seed, result: res.map((x) => (x === undefined ? null : x)), randCalls: rand.count() });
}

cases.localDominance = [];
let ldRelocated = 0;
for (let i = 0; i < 150; i++) {
  const id = pick(bigMaps);
  const map = webMaps[id];
  const lad = ladM(id);
  const cache = cacheM(id);
  const nC = pick([1, 2, 3, 5, 7]);
  // czesc srodkow na slabym lokalnym ladzie (brzeg), zeby wymusic relokacje
  const weak = lad.filter((h) => !C.passesLocalLandGate(map, h.q, h.r));
  const strong = lad.filter((h) => C.passesLocalLandGate(map, h.q, h.r));
  const centrumy = [];
  for (let k = 0; k < nC; k++) {
    const src = rnd() < 0.45 && weak.length ? weak : strong.length ? strong : lad;
    centrumy.push(pick(src));
  }
  const regiony = C.assignVoronoiRegions(lad, centrumy);
  const keys = ROSTER.slice(0, nC);
  const minDist = pick([4, 8, 12, 15]);
  const useSea = rnd() < 0.5;
  const minSea = pick([0, 2, 4, 8]);
  const seed = ri(1, 1e9);
  const rand = mkRand(seed);
  const cIn = centrumy.map((h) => ({ ...h }));
  const rIn = regiony.map((r) => r.slice());
  let out;
  let threw = false;
  try {
    out = quiet(() => C.enforceLocalLandDominance(map, cIn, rIn, keys.slice(), lad, cache, rand, minDist, centerOf(id), useSea ? seaM(id) : undefined, minSea));
  } catch (e) {
    threw = true;
  }
  if (!threw && cIn.some((h, k) => h.q !== centrumy[k].q || h.r !== centrumy[k].r)) ldRelocated++;
  cases.localDominance.push({
    map: id,
    centrumy: PL(centrumy),
    keys,
    minDist,
    useSea,
    minSea,
    seed,
    threw,
    mutCentrumy: PL(cIn),
    mutRegiony: rIn.map(regionDigestOf),
    result: threw ? null : { centrumy: PL(out.centrumy), regiony: out.regiony.map(regionDigestOf), keys: out.aktywneKlucze },
    randCalls: rand.count(),
  });
}
meta.localDominanceRelocated = ldRelocated;
// srodki puste -> web rzuca TypeError (centrumy[0]!.q)
{
  const id = 's_c30';
  const map = webMaps[id];
  let threw = false;
  try {
    quiet(() => C.enforceLocalLandDominance(map, [], [], [], ladM(id), cacheM(id), mkRand(1), 8, centerOf(id), undefined, 0));
  } catch (e) {
    threw = true;
  }
  cases.localDominanceEmpty = { map: id, threw };
}

// ---------------------------------------------------------------------------
// 6. Klastry: fixtures z prawdziwego weba + naprawy (clusters.ts:2654-3356)
// ---------------------------------------------------------------------------
const kOut = (k) => ({
  typIndex: k.typIndex,
  typ: k.typ,
  centrum: P(k.centrum),
  miasta: k.miasta.map((m) => [m.q, m.r, m.isCapital]),
  pending: k.pendingStateSlots === undefined ? null : PL(k.pendingStateSlots),
  growth: k.growthSlot === undefined ? 'absent' : k.growthSlot === null ? 'null' : P(k.growthSlot),
});
const kIn = (o) => {
  const k = { typIndex: o.typIndex, typ: o.typ, centrum: hexIn(o.centrum), miasta: o.miasta.map((m) => ({ q: m[0], r: m[1], isCapital: m[2] })) };
  if (o.pending !== null) k.pendingStateSlots = o.pending.map(hexIn);
  if (o.growth !== 'absent') k.growthSlot = o.growth === 'null' ? null : hexIn(o.growth);
  return k;
};
const klastryFromOut = (arr) => arr.map(kIn);

function buildFixture(id, mode) {
  const map = webMaps[id];
  const lad = ladM(id);
  const cache = cacheM(id);
  const rep = mapsOut[id];
  const nNeeded = pick([3, 4, 5, 6, 7, 8, 9]);
  const seed = ri(1, 1e9);
  const rand = mkRand(seed);
  const bounds = { minQ: 0, maxQ: rep.w - 1, minR: 0, maxR: rep.h - 1 };
  const useSea = rnd() < 0.5;
  const minSea = useSea ? pick([0, 2, 4]) : 0;
  const seaMap = useSea ? seaM(id) : undefined;
  const centers = quiet(() => C.placeClusterCentersAcrossLandmasses(map, lad, cache, nNeeded, pick([5, 8, 10, 12]), centerOf(id), rand, pick([0, 1, 2]), bounds, seaMap, minSea));
  if (centers.length < 2) return null;
  const regs = C.assignVoronoiRegions(lad, centers);
  const klastry = [];
  const stateCount = pick([3, 5, 7]);
  for (let ci = 0; ci < centers.length; ci++) {
    const prior = klastry.map((k) => ({ q: k.miasta[0].q, r: k.miasta[0].r }));
    const region = regs[ci].slice();
    const res = quiet(() => C.buildClusterCities(region, centers[ci], stateCount, 5, rand, undefined, seed + ci, map, seaMap, minSea, prior, 0));
    const k = { typIndex: ci, typ: ROSTER[ci % ROSTER.length], centrum: centers[ci], miasta: res.cities.map((m) => ({ ...m })) };
    if (ci === 0) k.pendingStateSlots = res.pendingStateSlots.map((h) => ({ ...h }));
    if (ci % 3 !== 2) k.growthSlot = res.growthSlot ? { ...res.growthSlot } : null;
    klastry.push(k);
  }
  // perturbacje
  const caps = () => klastry.map((k) => k.miasta[0]);
  if (mode === 'closeCaps' && klastry.length >= 2) {
    const a = pick(klastry.slice(0, -1).map((_, k) => k));
    const b = ri(a + 1, klastry.length - 1);
    const maxD = pick([6, 9, 11]);
    const near = lad.filter((h) => {
      const dist = Math.max(Math.abs(h.q - caps()[a].q), Math.abs(h.r - caps()[a].r), Math.abs(-h.q - h.r + caps()[a].q + caps()[a].r));
      return dist >= 2 && dist <= maxD;
    });
    if (near.length) {
      const h = pick(near);
      klastry[b].miasta[0] = { q: h.q, r: h.r, isCapital: true };
    }
  } else if (mode === 'mpNearForeignCap' && klastry.length >= 2) {
    const a = 0;
    const b = ri(1, klastry.length - 1);
    const cap = caps()[a];
    const near = lad.filter((h) => Math.max(Math.abs(h.q - cap.q), Math.abs(h.r - cap.r), Math.abs(-h.q - h.r + cap.q + cap.r)) <= 7);
    if (near.length && klastry[b].miasta.length > 1) {
      const h = pick(near);
      klastry[b].miasta[1] = { q: h.q, r: h.r, isCapital: false };
    }
  } else if (mode === 'strip') {
    for (const k of klastry) {
      if (rnd() < 0.7) {
        k.miasta = [k.miasta[0]];
        k.growthSlot = null;
        if (k.pendingStateSlots) k.pendingStateSlots = [];
      }
    }
  } else if (mode === 'sameQuadrant') {
    const bb = bboxOf(lad);
    const midQ = (bb.minQ + bb.maxQ) / 2;
    const midR = (bb.minR + bb.maxR) / 2;
    const quad = ri(0, 3);
    const inQuad = lad.filter((h) => C.landQuadrantIndex(h.q, h.r, midQ, midR) === quad);
    const chosen = [];
    for (const h of sampleN(inQuad, 400)) {
      if (chosen.length >= klastry.length) break;
      if (chosen.every((c) => Math.max(Math.abs(h.q - c.q), Math.abs(h.r - c.r), Math.abs(-h.q - h.r + c.q + c.r)) >= 6)) chosen.push(h);
    }
    chosen.forEach((h, k) => {
      klastry[k].miasta[0] = { q: h.q, r: h.r, isCapital: true };
    });
  } else if (mode === 'noCapitalFlag') {
    for (const k of klastry) if (rnd() < 0.6) k.miasta = k.miasta.map((m) => ({ ...m, isCapital: false }));
  }
  return { id, mode, nNeeded, stateCount, centers, klastry: klastry.map(kOut), seed };
}

const FIX_MODES = ['none', 'closeCaps', 'closeCaps', 'mpNearForeignCap', 'strip', 'sameQuadrant', 'sameQuadrant', 'noCapitalFlag'];
const fixtures = [];
for (let tries = 0; fixtures.length < 190 && tries < 400; tries++) {
  const fx = buildFixture(pick(bigMaps), pick(FIX_MODES));
  if (fx && fx.klastry.length >= 2) fixtures.push(fx);
}
meta.fixtures = fixtures.length;
cases.fixtures = fixtures.map((fx) => ({ map: fx.id, mode: fx.mode, centers: PL(fx.centers), stateCount: fx.stateCount, klastry: fx.klastry }));

// proste funkcje na klastrach
cases.clusterHelpers = [];
for (const fx of fixtures) {
  const ks = klastryFromOut(fx.klastry);
  const rb = pick([0, 3, 6, 8, 10]);
  const row = {
    caps: ks.map((k) => {
      const c = C.clusterCapitalHex(k);
      return c ? P(c) : null;
    }),
    all: ks.map((k) => PL(C.allClusterCities(k))),
    buffers: ks.map((_, ki) => C.foreignBuffersForCluster(ks, ki, rb).map((b) => [b.q, b.r, f(b.radius)])),
    rb,
    anchors: [],
  };
  const playerCap = C.clusterCapitalHex(ks[0]);
  for (let ki = 0; ki < ks.length; ki++) {
    const cap = C.clusterCapitalHex(ks[ki]);
    for (const md of [0, 12, 40]) {
      const a = cap ? C.foreignRepackAnchor(ki, cap, playerCap, md) : undefined;
      row.anchors.push({ ki, md, result: a ? [a.q, a.r, a.minDist] : null });
    }
  }
  cases.clusterHelpers.push(row);
}
// klastry pustych miast / bez stolicy
{
  const mk = (miasta) => ({ typIndex: 0, typ: 'x', centrum: { q: 0, r: 0 }, miasta });
  const list = [mk([]), mk([{ q: 1, r: 1, isCapital: false }, { q: 2, r: 2, isCapital: false }]), mk([{ q: 1, r: 1, isCapital: false }, { q: 3, r: 3, isCapital: true }])];
  cases.clusterHelpersEdge = list.map((k) => {
    const c = C.clusterCapitalHex(k);
    return { miasta: k.miasta.map((m) => [m.q, m.r, m.isCapital]), cap: c ? P(c) : null };
  });
  cases.foreignAnchorEdge = [
    { ki: 0, cap: [5, 5], player: [1, 1], md: 12, result: C.foreignRepackAnchor(0, { q: 5, r: 5 }, { q: 1, r: 1 }, 12) ? 1 : 0 },
    { ki: 2, cap: [5, 5], player: null, md: 12, result: C.foreignRepackAnchor(2, { q: 5, r: 5 }, null, 12) ? 1 : 0 },
  ];
}

const clusterOpts = (id, fx) => {
  const lad = ladM(id);
  const bbox = bboxM(id);
  return { lad, bbox };
};
const kStateOut = (klastry, regions) => ({ klastry: klastry.map(kOut), regions: regions.map(regionDigestOf) });

let REPAIR_BUF = [];
function runRepair(kind, fx, fi) {
  const id = fx.id;
  const map = webMaps[id];
  const cache = cacheM(id);
  const lad = ladM(id);
  const bbox = bboxM(id);
  const klastry = klastryFromOut(fx.klastry);
  const regions = C.assignVoronoiRegions(lad, fx.centers).map((r) => r.slice());
  const useSea = rnd() < 0.5;
  const minSea = pick([0, 2, 4, 8]);
  const seed = ri(1, 1e9);
  const rseed = ri(1, 1e9);
  const rand = mkRand(rseed);
  const minDystObcy = pick([12, 12, 20]);
  const stateCount = fx.stateCount;
  const minMp = 5;
  const useGate = rnd() < 0.5;
  const nNeeded = pick([5, 6, 7, 8, 9]);
  const gate = useGate ? { landBBox: bbox, spreadN: nNeeded } : undefined;
  const common = { fixture: fi, useSea, minSea, seed, randSeed: rseed, minDystObcy, minMp };
  const mc = centerOf(id);
  const sd = useSea ? seaM(id) : undefined;
  if (kind === 'hard') {
    const minSep = pick([12, 15, 16, 19, 25, 0, NaN]);
    quiet(() => C.enforceHardCapitalSeparationOnKlastry(klastry, regions, map, rand, sd, minSea, minSep, minDystObcy, lad, cache, seed, stateCount, mc, minMp, gate));
    return { ...common, minSep: f(minSep), gate: gate ? { spreadN: gate.spreadN } : null, after: kStateOut(klastry, regions), randCalls: rand.count() };
  }
  if (kind === 'body') {
    const sCl = pick([12, 15, 16, 19, 0, NaN, 25]);
    const buf = C.clusterBodyBufferRadius(sCl);
    const minSep = pick([12, 15, 16, 19]);
    quiet(() => C.enforceClusterBodySeparationOnKlastry(klastry, regions, map, rand, sd, minSea, sCl, minSep, minDystObcy, lad, cache, seed, stateCount, mc, minMp, buf, gate));
    return { ...common, sCluster: f(sCl), minSep, buf: f(buf), gate: gate ? { spreadN: gate.spreadN } : null, after: kStateOut(klastry, regions), randCalls: rand.count() };
  }
  if (kind === 'repackOne') {
    const ki = ri(0, klastry.length - 1);
    const buf = REPAIR_BUF.length ? pick(REPAIR_BUF) : pick([0, 6, 8, 10]);
    quiet(() => C.repackClusterStateCitiesIfSparse(klastry, regions, ki, stateCount, minDystObcy, lad, seed, buf, mc, minMp));
    return { ...common, ki, buf, after: kStateOut(klastry, regions) };
  }
  if (kind === 'repackAll') {
    const buf = REPAIR_BUF.length ? pick(REPAIR_BUF) : pick([0, 6, 8, 10]);
    quiet(() => C.repackAllSparseClusterStateCities(klastry, regions, stateCount, minDystObcy, lad, seed, buf, mc, minMp));
    return { ...common, buf, after: kStateOut(klastry, regions) };
  }
  if (kind === 'quarter') {
    const minSep = pick([0, 12, 15, 19]);
    const buf = pick([0, 6, 8, 10]);
    quiet(() => C.enforceQuarterSpreadOnKlastry(klastry, regions, map, cache, lad, bbox, nNeeded, rand, sd, minSea, minSep, minDystObcy, seed, stateCount, mc, minMp, buf));
    return { ...common, nNeeded, minSep, buf, after: kStateOut(klastry, regions), randCalls: rand.count() };
  }
  throw new Error(kind);
}
const wantRepair = { hard: 150, body: 150, repackOne: 80, repackAll: 60, quarter: 110 };
for (const [kind, n] of Object.entries(wantRepair)) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const fx = fixtures[i % fixtures.length];
    out.push(runRepair(kind, fx, i % fixtures.length));
  }
  cases['repair_' + kind] = out;
}
// pokrycie napraw (informacyjnie; testy Rust wymuszaja progi)
{
  const changed = (arr) => arr.filter((c) => JSON.stringify(c.after.klastry) !== JSON.stringify(fixtures[c.fixture].klastry)).length;
  meta.repairChanged = Object.fromEntries(Object.keys(wantRepair).map((k) => [k, changed(cases['repair_' + k])]));
  meta.repairDropped = Object.fromEntries(Object.keys(wantRepair).map((k) => [k, cases['repair_' + k].filter((c) => c.after.klastry.length < fixtures[c.fixture].klastry.length).length]));
}


// ---------------------------------------------------------------------------
// 7. Przypadki CELOWANE (dodane po wszystkich powyzszych - strumien rnd wczesniejszych kategorii
//    bez zmian). Pokrywaja galezie, ktorych nie dotykaly losowe przypadki (wynik mutacji r1).
// ---------------------------------------------------------------------------
// 7a. pickSpawn: preferowany hex na MIEKKIM stopniu drabinki, gdy maxSeaDist < minSeaDist
cases.pickSpawnExtra = [];
for (let i = 0; i < 90; i++) {
  const id = pick(bigMaps);
  const map = webMaps[id];
  const lad = ladM(id);
  const cache = cacheM(id);
  const sd = seaM(id);
  const minSea = pick([6, 8, 10, 12]);
  const maxSea = pick([2, 3, 4]);
  const inland = lad.filter((h) => (sd.get(`${h.q},${h.r}`) ?? 0) >= 3);
  const preferred = inland.length ? pick(inland) : pick(lad);
  const prior = sampleN(lad, pick([0, 0, 2]));
  const seed = ri(1, 1e9);
  const rand = mkRand(seed);
  const opts = { minSeaDist: minSea, maxSeaDist: maxSea, priorCapitals: prior, minCapitalSep: pick([0, 8]), requirePlayerMassGate: false, requireLocalLand: true, progressiveSoftSea: true, seaDist: sd, preferred };
  const res = quiet(() => C.pickSpawnHexWithCapitalGates(map, lad, cache, centerOf(id), rand, opts));
  cases.pickSpawnExtra.push({ map: id, pool: null, useSea: true, minSea, maxSea, prior: PL(prior), minSep: opts.minCapitalSep, reqPlayer: false, reqLocal: true, preferred: P(preferred), progressive: true, bbox: null, spreadN: null, seed, result: res ? P(res) : null, randCalls: rand.count() });
}

// 7b. poisson: male regiony (dysk), minDist > MIN => luzny przebieg
cases.poissonExtra = [];
for (let i = 0; i < 90; i++) {
  const id = pick(bigMaps);
  const lad = ladM(id);
  const c0 = pick(lad);
  const rad = pick([2, 3, 4]);
  const region = lad.filter((h) => Math.max(Math.abs(h.q - c0.q), Math.abs(h.r - c0.r), Math.abs(-h.q - h.r + c0.q + c0.r)) <= rad);
  const maxMiast = pick([3, 5, 9]);
  const minDist = pick([6, 7, 8, 9, 10]);
  const seed = ri(1, 1e9);
  const rand = mkRand(seed);
  const res = C.poissonPickCities(region, maxMiast, minDist, rand, undefined);
  cases.poissonExtra.push({ map: id, region: PL(region), maxMiast, minDist, seed, anchor: null, anchorVal: null, exclude: null, result: PL(res), randCalls: rand.count() });
}

// 7c. pickCapital: duzy minSea => miekkie stopnie drabinki (activeMinSea < minSea)
cases.pickCapitalExtra = [];
for (let i = 0; i < 140; i++) {
  const id = pick(bigMaps);
  const map = webMaps[id];
  const lad = ladM(id);
  let region;
  let regionKind;
  if (rnd() < 0.5) {
    const centers = sampleN(lad, ri(2, 5));
    region = C.assignVoronoiRegions(lad, centers)[0];
    regionKind = 'voronoi';
  } else {
    region = sampleN(lad, ri(5, 260));
    regionKind = 'sample';
  }
  const minSea = pick([10, 12, 14, 18, 25]);
  const blob = region.length ? C.centroidOf(region) : { q: 0, r: 0 };
  const seed = ri(1, 1e9);
  const rand = mkRand(seed);
  const regionBefore = region.slice();
  const res = C.pickCapitalHexInRegion(region, blob, rand, map, seaM(id), minSea, undefined, [], 0);
  const changed = region.length !== regionBefore.length || region.some((h, k) => h.q !== regionBefore[k].q || h.r !== regionBefore[k].r);
  cases.pickCapitalExtra.push({ map: id, regionKind, region: PL(regionBefore), blob: [f(blob.q), f(blob.r)], useMap: true, useSea: true, minSea, anchor: null, prior: [], minSep: 0, seed, result: res ? P(res) : null, regionAfter: regionDigestOf(region), changed, randCalls: rand.count() });
}

// 7d. enforceLocalLandDominance: 4/5/6 srodkow, wiekszosc na slabym lokalnym ladzie
cases.localDominanceExtra = [];
for (let i = 0; i < 100; i++) {
  const id = pick(bigMaps);
  const map = webMaps[id];
  const lad = ladM(id);
  const cache = cacheM(id);
  const nC = pick([4, 4, 5, 6]);
  const weak = lad.filter((h) => !C.passesLocalLandGate(map, h.q, h.r));
  const strong = lad.filter((h) => C.passesLocalLandGate(map, h.q, h.r));
  const centrumy = [];
  for (let k = 0; k < nC; k++) {
    const src = (k === 0 || rnd() < 0.7) && weak.length && k > 0 ? weak : strong.length ? strong : lad;
    centrumy.push(pick(src));
  }
  const regiony = C.assignVoronoiRegions(lad, centrumy);
  const keys = ROSTER.slice(0, nC);
  const minDist = pick([4, 8, 12]);
  const useSea = rnd() < 0.5;
  const minSea = pick([0, 2, 4]);
  const seed = ri(1, 1e9);
  const rand = mkRand(seed);
  const cIn = centrumy.map((h) => ({ ...h }));
  const rIn = regiony.map((r) => r.slice());
  let out;
  let threw = false;
  try {
    out = quiet(() => C.enforceLocalLandDominance(map, cIn, rIn, keys.slice(), lad, cache, rand, minDist, centerOf(id), useSea ? seaM(id) : undefined, minSea));
  } catch (e) {
    threw = true;
  }
  cases.localDominanceExtra.push({ map: id, centrumy: PL(centrumy), keys, minDist, useSea, minSea, seed, threw, mutCentrumy: PL(cIn), mutRegiony: rIn.map(regionDigestOf), result: threw ? null : { centrumy: PL(out.centrumy), regiony: out.regiony.map(regionDigestOf), keys: out.aktywneKlucze }, randCalls: rand.count() });
}

// 7e. repack: nieparzysty i bardzo duzy bufor (luzny przebieg, ostatnia szansa)
REPAIR_BUF = [5, 7, 9, 11, 13, 40, 60];
for (const [kind, n] of [['repackOne', 120], ['repackAll', 40]]) {
  const outc = [];
  for (let i = 0; i < n; i++) {
    const fx = fixtures[(i * 7) % fixtures.length];
    outc.push(runRepair(kind, fx, (i * 7) % fixtures.length));
  }
  cases['repair_' + kind + 'Extra'] = outc;
}
REPAIR_BUF = [];

const out = { pin: 'edb8fb56', meta, maps: mapsOut, cases };
writeFileSync(outArg, JSON.stringify(out));
const counts = Object.fromEntries(Object.entries(cases).map(([k, v]) => [k, Array.isArray(v) ? v.length : Object.keys(v).length]));
origLog('OK ' + JSON.stringify({ insertedExports, maps: MAP_IDS.length, meta, counts }));
