// P6.M09 - wektory z URUCHOMIONEGO weba (pin edb8fb56) dla wycinka rywali klastra:
//   gra/src/map/cluster-spawn.ts : buildSameTypeRivalSlots, buildSameTypeRivalCandidateHexes,
//                                  groupForeignTypeClusters (eksportowane - PRAWDZIWY modul),
//                                  landHexesFromMap, mapCenterFromGameMap (prywatne - WYCIETE WERBATIM :71-86)
//   gra/src/map/clusters.ts      : stale :42-58, clusterPackRadius, passesForeignClusterBufferGate,
//                                  computeSameTypeRivalHalfPlaneAxis, isInSameTypeRivalHalfPlane,
//                                  packCityStatesHubChain, packCityStatesAroundCapital,
//                                  packRivalCitiesAroundCore (eksportowane - PRAWDZIWY modul),
//                                  shuffleInPlace :168-175, landPoolNearCore :1771-1800,
//                                  hexesAtDistance :1848-1867, packNearestLegalLand :1975-2030
//                                  (prywatne - WYCIETE WERBATIM z kotwicami pierwszej/ostatniej linii)
// Mapy: PRAWDZIWY generateMap() (te same 5 specyfikacji co P6.1C, odcisk hexow w wektorach).
//
// Uzycie (z dowolnego katalogu):
//   node --experimental-transform-types --no-warnings --import ./m09-loader-register.mjs \
//     ./gen-m09-vectors.mjs <WEB_ROOT> <OUT_JSON> <STUB_DIR>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , webRootArg, outArg, stubDirArg] = process.argv;
if (!webRootArg || !outArg || !stubDirArg) {
  console.error('usage: <WEB_ROOT> <OUT_JSON> <STUB_DIR>');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const stubDir = presolve(stubDirArg);
mkdirSync(stubDir, { recursive: true });
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
// Wycinanie WERBATIM (kotwice: tresc pierwszej i ostatniej linii zakresu)
// ---------------------------------------------------------------------------
function slice(file, from, to, firstStarts, lastEquals) {
  const lines = readFileSync(srcPath(file), 'utf8').split('\n');
  const first = lines[from - 1];
  const last = lines[to - 1];
  if (!first.startsWith(firstStarts)) throw new Error(`anchor drift ${file}:${from}: ${first}`);
  if (last !== lastEquals) throw new Error(`anchor drift ${file}:${to}: ${last}`);
  return lines.slice(from - 1, to).join('\n');
}
const exported = (text) => 'export ' + text;

const clustersUrl = src('map/clusters.ts');
const helpersUrl = src('map/gen-helpers.ts');
const clustersStub = [
  `import { mulberry32, hexDistanceAxial, HEX_DIRECTIONS } from '${helpersUrl}';`,
  `import { clusterPackRadius, passesForeignClusterBufferGate, isInSameTypeRivalHalfPlane } from '${clustersUrl}';`,
  `import type { ForeignClusterBuffer, SameTypeRivalHalfPlaneAxis } from '${clustersUrl}';`,
  exported(slice('map/clusters.ts', 168, 175, 'function shuffleInPlace<T>(', '}')),
  exported(slice('map/clusters.ts', 1771, 1800, 'function landPoolNearCore(', '}')),
  exported(slice('map/clusters.ts', 1848, 1867, 'function hexesAtDistance(', '}')),
  exported(slice('map/clusters.ts', 1975, 2030, 'function packNearestLegalLand(', '}')),
].join('\n\n');
const clustersStubPath = join(stubDir, 'clusters-private.ts');
writeFileSync(clustersStubPath, clustersStub + '\n');

const spawnStub = [
  `import type { GameMap } from '${src('types/map.ts')}';`,
  `import { TerenBazowy } from '${src('types/hex.ts')}';`,
  `import { isWaterTerrain } from '${src('units/setup.ts')}';`,
  exported(slice('map/cluster-spawn.ts', 71, 79, 'function landHexesFromMap(', '}')),
  exported(slice('map/cluster-spawn.ts', 81, 86, 'function mapCenterFromGameMap(', '}')),
].join('\n\n');
const spawnStubPath = join(stubDir, 'cluster-spawn-private.ts');
writeFileSync(spawnStubPath, spawnStub + '\n');

const priv = await import(pathToFileURL(clustersStubPath).href);
const privSpawn = await import(pathToFileURL(spawnStubPath).href);
const C = await import(src('map/clusters.ts'));
const S = await import(src('map/cluster-spawn.ts'));
const { mulberry32 } = await import(src('map/gen-helpers.ts'));
const { generateMap } = await import(src('map/generator.ts'));
const { loadGameData } = await import(src('data/loader.ts'));
const data = loadGameData();

// ---------------------------------------------------------------------------
// Narzedzia serializacji: f64 jako TEKST (serde_json bez float_roundtrip myli ostatni bit)
// ---------------------------------------------------------------------------
const f = (x) => (Object.is(x, -0) ? '-0' : String(x));
const P = (h) => [h.q, h.r];
const H = ([q, r]) => ({ q, r });
const PL = (arr) => arr.map(P);
const fnv1a64 = (s) => {
  let h = 0xcbf29ce484222325n;
  for (const b of Buffer.from(s, 'utf8')) {
    h ^= BigInt(b);
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
};

// ---------------------------------------------------------------------------
// Mapy (prawdziwy generateMap) - te same specyfikacje co P6.1C (maps.json)
// ---------------------------------------------------------------------------
const MAP_SPECS = [
  { id: 'k42', w: 36, h: 28, seed: 42, typ: 'kontynenty' },
  { id: 'k7', w: 36, h: 28, seed: 7, typ: 'kontynenty' },
  { id: 'p123', w: 36, h: 28, seed: 123, typ: 'pangea' },
  { id: 'k3small', w: 24, h: 18, seed: 3, typ: 'kontynenty' },
  { id: 'w5', w: 40, h: 30, seed: 5, typ: 'wyspy' },
];
const webMaps = {};
const mapsOut = {};
for (const spec of MAP_SPECS) {
  const map = quiet(() => generateMap(spec.w, spec.h, spec.seed, spec.typ));
  webMaps[spec.id] = map;
  const canon = Object.values(map.hexes)
    .map((h) => `${h.coords.q},${h.coords.r},${h.terenBazowy}`)
    .join(';');
  mapsOut[spec.id] = {
    w: spec.w,
    h: spec.h,
    seed: spec.seed,
    typ: spec.typ,
    szerokoscQ: map.szerokoscQ,
    wysokoscR: map.wysokoscR,
    hexesFnv: fnv1a64(canon),
    hexCount: Object.keys(map.hexes).length,
  };
}

// ---------------------------------------------------------------------------
// Pule ladu (fixtures) - deterministyczne, jawne listy [q,r]
// ---------------------------------------------------------------------------
const gr = mulberry32(20261022);
const rnd = () => gr();
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

function disk(cq, cr, R) {
  const out = [];
  for (let dq = -R; dq <= R; dq++) {
    for (let dr = Math.max(-R, -dq - R); dr <= Math.min(R, -dq + R); dr++) out.push({ q: cq + dq, r: cr + dr });
  }
  return out;
}
function holes(list, p) {
  return list.filter(() => rnd() >= p);
}
function box(q0, q1, r0, r1, p) {
  const out = [];
  for (let r = r0; r <= r1; r++) for (let q = q0; q <= q1; q++) if (rnd() < p) out.push({ q, r });
  return out;
}
const shuf = (list) => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const FIX = {
  empty: [],
  single: [{ q: 3, r: 3 }],
  tiny5: [{ q: 0, r: 0 }, { q: 5, r: 0 }, { q: 0, r: 5 }, { q: 5, r: -5 }, { q: 9, r: -2 }],
  disk3: disk(10, 10, 3),
  disk6: disk(10, 10, 6),
  disk9: disk(10, 10, 9),
  disk8neg: disk(0, 0, 8),
  disk6holes20: holes(disk(10, 10, 6), 0.2),
  disk9holes45: holes(disk(10, 10, 9), 0.45),
  disk9shuffled: shuf(disk(10, 10, 9)),
  strip: box(0, 30, 0, 2, 1),
  annulus: disk(12, 12, 9).filter((h) => Math.max(Math.abs(h.q - 12), Math.abs(h.r - 12), Math.abs(h.q - 12 + h.r - 12)) >= 5),
  twoBlobs: [...disk(5, 5, 4), ...disk(25, 5, 4)],
  sparse30: box(0, 29, 0, 29, 0.3),
  dense20: box(0, 19, 0, 19, 0.85),
};
const fixOut = {};
for (const [k, v] of Object.entries(FIX)) fixOut[k] = PL(v);
const FIX_IDS = Object.keys(FIX);

// ---------------------------------------------------------------------------
// Przypadki
// ---------------------------------------------------------------------------
const cases = {};

// --- stale (clusters.ts:38-58) ---
cases.consts = {
  CLUSTER_CITY_STATE_MIN_HEX: C.CLUSTER_CITY_STATE_MIN_HEX,
  CLUSTER_CITY_STATE_MAX_HEX: C.CLUSTER_CITY_STATE_MAX_HEX,
  MIN_DIST_START_CITY_STATE: C.MIN_DIST_START_CITY_STATE,
  MIN_DIST_FOREIGN_FROM_PLAYER: C.MIN_DIST_FOREIGN_FROM_PLAYER,
  MIN_DIST_FOREIGN_IN_CLUSTER: C.MIN_DIST_FOREIGN_IN_CLUSTER,
  CLUSTER_GROWTH_RESERVE: C.CLUSTER_GROWTH_RESERVE,
};

// --- clusterPackRadius ---
cases.clusterPackRadius = [];
for (const maxMiast of [-3, 0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 13, 16, 20, 25, 30, 40, 64, 100, 1000]) {
  for (const minDist of [1, 2, 3, 4, 5, 6, 8, 12]) {
    cases.clusterPackRadius.push({ maxMiast, minDist, out: C.clusterPackRadius(maxMiast, minDist) });
  }
}

// --- shuffleInPlace (wycieta werbatim) ---
cases.shuffle = [];
for (let n = 0; n <= 14; n++) {
  for (const seed of [0, 1, 42, 4294967295, 3735928559]) {
    const arr = Array.from({ length: n }, (_, i) => i);
    priv.shuffleInPlace(arr, mulberry32(seed));
    cases.shuffle.push({ n, seed, out: arr });
  }
}

// --- passesForeignClusterBufferGate ---
cases.bufferGate = [];
for (let i = 0; i < 160; i++) {
  const nb = ri(0, 3);
  const buffers = Array.from({ length: nb }, () => ({
    q: ri(-4, 4),
    r: ri(-4, 4),
    radius: pick([0, 1, 2, 3, 4, 5, 6, 2.5, 0.5]),
  }));
  const h = { q: ri(-6, 6), r: ri(-6, 6) };
  cases.bufferGate.push({
    h: P(h),
    buffers: buffers.map((b) => ({ q: b.q, r: b.r, radius: f(b.radius) })),
    out: C.passesForeignClusterBufferGate(h, buffers),
  });
}

// --- hexesAtDistance (wycieta werbatim) ---
cases.hexesAt = [];
for (const [q, r] of [[0, 0], [3, -2], [-5, 7]]) {
  for (let dist = -1; dist <= 9; dist++) {
    cases.hexesAt.push({ q, r, dist, out: PL(priv.hexesAtDistance(q, r, dist)) });
  }
}

// --- computeSameTypeRivalHalfPlaneAxis ---
cases.axis = [];
const centers = [[17.5, 13.5], [0, 0], [0.5, 0.5], [2, 2], [10, 10], [19.5, 14.5], [-3.5, 2]];
for (const [cq, cr] of centers) {
  for (let i = 0; i < 40; i++) {
    const capital = i < 8
      ? { q: Math.floor(cq) + ri(-1, 1), r: Math.floor(cr) + ri(-1, 1) } // blisko srodka (prog 0.25)
      : { q: ri(-6, 36), r: ri(-6, 28) };
    const seed = pick([0, 1, 2, 3, 4, 5, 6, 7, 11, 42, 99, 1000003, 4294967295, 3735928559]);
    const out = C.computeSameTypeRivalHalfPlaneAxis(capital, { q: cq, r: cr }, seed);
    cases.axis.push({ capital: P(capital), center: [f(cq), f(cr)], seed, out: { dq: f(out.dq), dr: f(out.dr) } });
  }
}

// --- isInSameTypeRivalHalfPlane ---
cases.halfPlane = [];
for (let i = 0; i < 260; i++) {
  const capital = { q: ri(-5, 5), r: ri(-5, 5) };
  const hex = { q: capital.q + ri(-8, 8), r: capital.r + ri(-8, 8) };
  const axis = { dq: pick([-3.5, -1, -0.5, 0, 0.5, 1, 2, 7.5, 0.1]), dr: pick([-2.5, -1, 0, 0.5, 1, 3, 6.5, -0.3]) };
  const margin = pick([undefined, undefined, 0, -0.5, 0.5, 1]);
  const out = margin === undefined
    ? C.isInSameTypeRivalHalfPlane(hex, capital, axis)
    : C.isInSameTypeRivalHalfPlane(hex, capital, axis, margin);
  cases.halfPlane.push({
    hex: P(hex),
    capital: P(capital),
    axis: { dq: f(axis.dq), dr: f(axis.dr) },
    margin: margin === undefined ? null : f(margin),
    out,
  });
}

// --- opcje (wspolne): losowanie i serializacja ---
function randOpts(landList, core, { allowGrowth, allowRings }) {
  const o = {};
  const ser = {};
  if (rnd() < 0.35) {
    const ex = rnd() < 0.5 ? core : pick(landList.length ? landList : [core]);
    o.excludeHex = { q: ex.q, r: ex.r };
    ser.exclude = P(ex);
  }
  if (rnd() < 0.3) {
    const a = { q: core.q + ri(-8, 8), r: core.r + ri(-8, 8), minDist: pick([1, 2, 3, 5, 8]) };
    o.anchor = a;
    ser.anchor = { q: a.q, r: a.r, minDist: a.minDist };
  }
  if (rnd() < 0.5) {
    const axis = rnd() < 0.5
      ? C.computeSameTypeRivalHalfPlaneAxis(core, { q: core.q + ri(-12, 12) + pick([0, 0.5]), r: core.r + ri(-12, 12) + pick([0, 0.5]) }, ri(0, 20))
      : { dq: pick([-1, 0, 1, 2.5]), dr: pick([-1, 0, 1, -2.5]) };
    o.halfPlaneAxis = axis;
    ser.axis = { dq: f(axis.dq), dr: f(axis.dr) };
  }
  if (rnd() < 0.3) {
    const bufs = Array.from({ length: ri(1, 3) }, () => ({ q: core.q + ri(-9, 9), r: core.r + ri(-9, 9), radius: pick([1, 2, 3, 4]) }));
    o.foreignBuffers = bufs;
    ser.buffers = bufs.map((b) => ({ q: b.q, r: b.r, radius: f(b.radius) }));
  }
  if (allowGrowth && rnd() < 0.6) {
    const g = pick([0, 1, 2, 3]);
    o.growthReserve = g;
    ser.growthReserve = g;
  }
  if (allowRings && rnd() < 0.5) {
    const rd = pick([[], [5], [4, 5], [3, 4, 5], [2], [6, 5, 4, 3]]);
    o.ringDistances = rd;
    ser.ringDistances = rd;
  }
  return { o, ser };
}
const pickCore = (landList) => {
  if (landList.length && rnd() < 0.85) return pick(landList);
  return { q: ri(-2, 22), r: ri(-2, 22) };
};

// --- landPoolNearCore (wycieta werbatim) ---
cases.landPool = [];
for (const id of FIX_IDS) {
  for (let i = 0; i < 9; i++) {
    const region = FIX[id];
    const centrum = pickCore(region);
    const maxMiast = pick([0, 1, 2, 3, 5, 8, 12, 20, 60, 400]);
    const minDist = pick([1, 2, 3, 5]);
    const maxRadius = pick([undefined, undefined, undefined, 0, 2, 3, 5, 10, 30]);
    const out = maxRadius === undefined
      ? priv.landPoolNearCore(region, centrum, maxMiast, minDist)
      : priv.landPoolNearCore(region, centrum, maxMiast, minDist, maxRadius);
    cases.landPool.push({
      land: id,
      centrum: P(centrum),
      maxMiast,
      minDist,
      maxRadius: maxRadius === undefined ? null : maxRadius,
      out: PL(out),
    });
  }
}

// --- packCityStatesHubChain ---
cases.hubChain = [];
for (const id of FIX_IDS) {
  for (let i = 0; i < 20; i++) {
    const land = FIX[id];
    const core = pickCore(land);
    const { o, ser } = randOpts(land, core, { allowGrowth: false, allowRings: false });
    const count = pick([-1, 0, 1, 2, 3, 5, 7, 10, 14]);
    const minSep = pick([2, 3, 5]);
    const ringDist = pick([1, 2, 3, 4, 5, 5, 5, 6]);
    const seed = pick([0, 1, 42, 123456789, 4294967295, 3735928559]);
    const out = C.packCityStatesHubChain(land, core, count, minSep, ringDist, seed, Object.keys(o).length ? o : undefined);
    cases.hubChain.push({ land: id, core: P(core), count, minSep, ringDist, seed, opts: ser, hasOpts: Object.keys(o).length > 0, out: PL(out) });
  }
}

// --- packNearestLegalLand (wycieta werbatim) ---
cases.nearest = [];
for (const id of FIX_IDS) {
  for (let i = 0; i < 14; i++) {
    const land = FIX[id];
    const core = pickCore(land);
    const { o, ser } = randOpts(land, core, { allowGrowth: false, allowRings: false });
    const exclude = o.excludeHex ?? { q: core.q, r: core.r };
    const opts = { ...o, excludeHex: exclude };
    ser.exclude = P(exclude);
    const count = pick([0, 1, 2, 3, 5, 8, 12]);
    const minSep = pick([2, 3, 5]);
    const seedForInit = pick([0, 1, 42]);
    const initial = rnd() < 0.5
      ? []
      : C.packCityStatesHubChain(land, core, pick([1, 2, 4]), minSep, pick([3, 5]), seedForInit, { excludeHex: exclude });
    const out = priv.packNearestLegalLand(land, core, count, minSep, initial, opts);
    cases.nearest.push({ land: id, core: P(core), count, minSep, initial: PL(initial), opts: ser, out: PL(out) });
  }
}

// --- packCityStatesAroundCapital ---
cases.aroundCapital = [];
for (const id of FIX_IDS) {
  for (let i = 0; i < 24; i++) {
    const allLand = FIX[id];
    const regionMode = pick(['all', 'all', 'half', 'near', 'tiny']);
    const core = pickCore(allLand);
    let region = allLand;
    if (regionMode === 'half') region = allLand.filter((_, k) => k % 2 === 0);
    if (regionMode === 'near') region = allLand.filter((h) => Math.max(Math.abs(h.q - core.q), Math.abs(h.r - core.r)) <= 7);
    if (regionMode === 'tiny') region = allLand.slice(0, 6);
    const { o, ser } = randOpts(allLand, core, { allowGrowth: true, allowRings: true });
    const stateCityCount = pick([-1, 0, 1, 2, 3, 4, 6, 9, 14]);
    const minDist = pick([1, 2, 3, 5, 5, 5, 7]);
    const seed = pick([0, 1, 42, 99, 4294967295, 3735928559]);
    const out = C.packCityStatesAroundCapital(allLand, region, core, stateCityCount, minDist, seed, Object.keys(o).length ? o : undefined);
    cases.aroundCapital.push({
      land: id,
      regionMode,
      region: regionMode === 'all' ? null : PL(region),
      core: P(core),
      stateCityCount,
      minDist,
      seed,
      opts: ser,
      hasOpts: Object.keys(o).length > 0,
      out: { stateCities: PL(out.stateCities), growthSlot: out.growthSlot ? P(out.growthSlot) : null },
    });
  }
}

// --- packRivalCitiesAroundCore ---
cases.rivalCore = [];
for (const id of FIX_IDS) {
  for (let i = 0; i < 12; i++) {
    const land = FIX[id];
    const core = pickCore(land);
    const rivalCount = pick([-1, 0, 1, 2, 3, 6, 9, 14]);
    const minDist = pick([2, 3, 5, 5, 5]);
    const seed = pick([0, 1, 42, 4294967295, 3735928559]);
    const useCenter = rnd() < 0.7;
    const mapCenter = useCenter ? { q: pick([9.5, 10, 11.5, 17.5, core.q + 0.5]), r: pick([9.5, 10, 13.5, core.r]) } : undefined;
    const out = mapCenter
      ? C.packRivalCitiesAroundCore(land, core, rivalCount, minDist, seed, mapCenter)
      : C.packRivalCitiesAroundCore(land, core, rivalCount, minDist, seed);
    cases.rivalCore.push({
      land: id,
      core: P(core),
      rivalCount,
      minDist,
      seed,
      mapCenter: mapCenter ? [f(mapCenter.q), f(mapCenter.r)] : null,
      out: PL(out),
    });
  }
}

// --- landHexesFromMap / mapCenterFromGameMap (wyciete werbatim) + sloty i kandydaci na prawdziwych mapach ---
cases.mapHelpers = [];
cases.slots = [];
cases.candidates = [];
const slotSeeds = (spec) => [spec.seed, 4294967295];
for (const spec of MAP_SPECS) {
  const map = webMaps[spec.id];
  const land = privSpawn.landHexesFromMap(map);
  const center = privSpawn.mapCenterFromGameMap(map);
  cases.mapHelpers.push({ map: spec.id, landCount: land.length, landFnv: fnv1a64(land.map((h) => `${h.q},${h.r}`).join(';')), center: [f(center.q), f(center.r)] });
  const cores = [0.08, 0.3, 0.55, 0.9].map((fr) => land[Math.floor(fr * (land.length - 1))]);
  for (const core of cores) {
    for (const seed of [...slotSeeds(spec), 0]) {
      for (const count of [0, 1, 2, 5, 9, 14, 24]) {
        const out = S.buildSameTypeRivalCandidateHexes(map, core, count, seed);
        cases.candidates.push({ map: spec.id, core: P(core), rivalCount: count, seed, out: PL(out) });
      }
    }
    for (const [typ, withPools] of [['rzymianie', true], ['chinczycy', false], ['grecy', true]]) {
      for (const seed of slotSeeds(spec)) {
        for (const count of [0, 2, 5, 9]) {
          for (const firstOwnerId of [1, 7]) {
            const slots = quiet(() => S.buildSameTypeRivalSlots(map, data.civs, core, typ, count, seed, firstOwnerId, withPools ? data.cityNamesPools : undefined));
            cases.slots.push({
              map: spec.id,
              core: P(core),
              typ,
              pools: withPools,
              rivalCount: count,
              seed,
              firstOwnerId,
              out: slots.map((s) => ({
                ownerId: s.ownerId, q: s.q, r: s.r, nazwaMiasta: s.nazwaMiasta, typ: s.typ,
                isSameTypeRival: s.isSameTypeRival, isPlayerCapital: s.isPlayerCapital,
                hasIsClusterCapital: 'isClusterCapital' in s,
              })),
            });
          }
        }
      }
    }
  }
}

// --- groupForeignTypeClusters ---
cases.group = [];
const TYPS = ['rzymianie', 'chinczycy', 'grecy', 'egipt', 'sumer'];
for (let i = 0; i < 60; i++) {
  const n = ri(0, 14);
  const slots = Array.from({ length: n }, (_, k) => ({
    ownerId: ri(0, 30),
    q: ri(-5, 40),
    r: ri(-5, 30),
    nazwaMiasta: `N${k}`,
    typ: pick(TYPS),
    isSameTypeRival: rnd() < 0.4,
    isPlayerCapital: rnd() < 0.1,
  }));
  const out = S.groupForeignTypeClusters(slots);
  cases.group.push({
    slots: slots.map((s) => ({ ownerId: s.ownerId, q: s.q, r: s.r, typ: s.typ, isSameTypeRival: s.isSameTypeRival })),
    out: out.map((g) => ({ typ: g.typ, ownerIds: g.ownerIds, positions: PL(g.positions) })),
  });
}

// --- niezmienniczosc wzgledem ziarna (packCityStatesHubChain): shuffle poprzedza PELNE sortowanie
// (q, r) kandydatow, wiec `rand` nie wplywa na wynik. Generator POTWIERDZA to na webie i zapisuje
// wspolny wynik; Rust ma dac ten sam wynik dla kazdego z ziaren.
cases.seedIndependence = [];
const SEED_SET = [0, 1, 42, 99, 123456789, 3735928559, 4294967295];
for (const id of ['disk6', 'disk9', 'disk9holes45', 'annulus', 'sparse30', 'dense20', 'twoBlobs']) {
  for (let i = 0; i < 6; i++) {
    const land = FIX[id];
    const core = pickCore(land);
    const count = pick([3, 6, 10]);
    const minSep = pick([3, 5]);
    const ringDist = pick([3, 5]);
    const outs = SEED_SET.map((s) => JSON.stringify(PL(C.packCityStatesHubChain(land, core, count, minSep, ringDist, s))));
    if (new Set(outs).size !== 1) throw new Error(`hubChain zalezy od ziarna: ${id} ${JSON.stringify(P(core))}`);
    cases.seedIndependence.push({ land: id, core: P(core), count, minSep, ringDist, seeds: SEED_SET, out: JSON.parse(outs[0]) });
  }
}

const out = {
  pin: 'edb8fb56',
  generator: 'gen-m09-vectors.mjs',
  node: process.version,
  maps: mapsOut,
  fixtures: fixOut,
  cases,
};
writeFileSync(presolve(outArg), JSON.stringify(out));
const counts = Object.fromEntries(Object.entries(cases).map(([k, v]) => [k, Array.isArray(v) ? v.length : 1]));
origLog('OK', JSON.stringify(counts));
