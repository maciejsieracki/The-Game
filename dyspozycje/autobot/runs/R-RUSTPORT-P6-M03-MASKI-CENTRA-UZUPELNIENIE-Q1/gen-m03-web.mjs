// Generator wektorow P6.M03 (maski centrum): URUCHAMIA kod TS weba (pin edb8fb56), nie literaly.
// Uzycie (po `git archive edb8fb56 gra/src gra/data` do wlasnego katalogu poza repo):
//   node --experimental-transform-types --import ./gen-loader-register.mjs ./gen-m03-web.mjs <KORZEN> <katalog-wyjscia>
// Caly modul gen-helpers.ts jest ladowany BEZ ZMIAN (zadnego stubu logiki); jedyny dopisek to
// instrukcja `export {...}` dla prywatnych funkcji (pangeaLandT, normToIsotropic,
// secondNearestContinentDist, pangeaBlobScore) w kopii pliku w KORZENIU (nie w repo).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const outDir = process.argv[3];
if (!root || !outDir) {
  console.error('uzycie: gen-m03-web.mjs <KORZEN> <katalog-wyjscia>');
  process.exit(2);
}
const sha = (s) => createHash('sha256').update(s).digest('hex');
const mapDir = `${root}/gra/src/map`;
const ghSrc = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
const elmSrc = readFileSync(`${mapDir}/earth-land-mask.ts`, 'utf8');
writeFileSync(
  `${mapDir}/__m03_gen_helpers_full.ts`,
  ghSrc + '\nexport { pangeaLandT, normToIsotropic, secondNearestContinentDist, pangeaBlobScore };\n',
);
const G = await import(pathToFileURL(`${mapDir}/__m03_gen_helpers_full.ts`).href);

// ---------- pomocnicze ----------
const T = (x) => (Object.is(x, -0) ? '-0' : String(x));
let inSeed = 20261023;
const mul = G.mulberry32(inSeed); // deterministyczne WEJSCIA testowe (zapisane jawnie w wyjsciu)
const rnd = () => mul();
const fnvBits = (values) => {
  const dv = new DataView(new ArrayBuffer(8));
  let h = 0xcbf29ce484222325n;
  for (const v of values) {
    dv.setFloat64(0, v, true);
    for (let i = 0; i < 8; i++) {
      h ^= BigInt(dv.getUint8(i));
      h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
    }
  }
  return h.toString(16).padStart(16, '0');
};
const centersOut = (cs) => cs.map((c) => [T(c.nq), T(c.nr), T(c.radius)]);
const out = (name, obj) => writeFileSync(`${outDir}/${name}`, JSON.stringify(obj));

const meta = {
  zrodlo: 'uruchomiony kod TS weba (gen-m03-web.mjs), pin edb8fb56',
  node: process.version,
  sha256: {
    'gen-helpers.ts': sha(ghSrc),
    'earth-land-mask.ts': sha(elmSrc),
    'earth-land-mask.generated.ts': sha(readFileSync(`${mapDir}/earth-land-mask.generated.ts`, 'utf8')),
  },
  wejscia_ziarno: inSeed,
};

// ================= jsmath.json =================
const jsmath = { meta, pow: [], atan2: [], sin: [], hypot: [] };
{
  const specialX = [0, -0, 1, -1, 0.5, 2, 1e-320, 1e308, Infinity, -Infinity, NaN, -8, 8, 4, 0.25, 1e-10, 3, 7.5, -2.5];
  const specialY = [0, -0, 1, -1, 2, 0.5, -0.5, 1.55, 1.88, 2.2, 3, -2, 10, 0.3, Infinity, -Infinity, NaN, 1e10, -1e10, 1075, -1075, 2.5];
  for (const x of specialX) for (const y of specialY) jsmath.pow.push([T(x), T(y), T(Math.pow(x, y))]);
  for (const y of [1.55, 1.88, 2.2, 2.0]) {
    for (let i = 0; i < 2500; i++) { const x = rnd() * 3; jsmath.pow.push([T(x), T(y), T(Math.pow(x, y))]); }
    for (let i = 0; i < 500; i++) { const x = rnd() * 60; jsmath.pow.push([T(x), T(y), T(Math.pow(x, y))]); }
    for (let i = 0; i < 300; i++) { const x = 1 + (rnd() - 0.5) * 1e-3; jsmath.pow.push([T(x), T(y), T(Math.pow(x, y))]); }
  }
  for (let i = 0; i < 1500; i++) { const x = rnd() * 10; const y = (rnd() - 0.5) * 10; jsmath.pow.push([T(x), T(y), T(Math.pow(x, y))]); }
  for (let i = 0; i < 300; i++) { const x = -(rnd() * 10); const y = Math.round((rnd() - 0.5) * 10); jsmath.pow.push([T(x), T(y), T(Math.pow(x, y))]); }

  const sp = [0, -0, 1, -1, Infinity, -Infinity, NaN, 1e-320, -1e-320, 1e300, -1e300, 0.5, -0.5, 3, -3];
  for (const y of sp) for (const x of sp) jsmath.atan2.push([T(y), T(x), T(Math.atan2(y, x))]);
  for (let i = 0; i < 4000; i++) { const y = rnd() * 2 - 1, x = rnd() * 2 - 1; jsmath.atan2.push([T(y), T(x), T(Math.atan2(y, x))]); }
  for (let i = 0; i < 1500; i++) { const y = (rnd() * 2 - 1) * 1e-3, x = rnd() * 2 - 1; jsmath.atan2.push([T(y), T(x), T(Math.atan2(y, x))]); }
  for (let i = 0; i < 1500; i++) { const y = rnd() * 2 - 1, x = (rnd() * 2 - 1) * 1e-3; jsmath.atan2.push([T(y), T(x), T(Math.atan2(y, x))]); }
  for (let i = 0; i < 800; i++) { const y = (rnd() * 2 - 1) * 1e20, x = (rnd() * 2 - 1) * 1e-20; jsmath.atan2.push([T(y), T(x), T(Math.atan2(y, x))]); }
  for (let i = 0; i < 800; i++) { const y = (rnd() * 2 - 1) * 1e-20, x = -(rnd()) ; jsmath.atan2.push([T(y), T(x), T(Math.atan2(y, x))]); }
  for (let i = 0; i < 600; i++) { const r = rnd() * 3; const a = rnd() * 2 * Math.PI - Math.PI; const y = Math.sin(a) * r, x = Math.cos(a) * r; jsmath.atan2.push([T(y), T(x), T(Math.atan2(y, x))]); }

  const sx = [0, -0, 1e-10, -1e-10, 1e-300, Math.PI, -Math.PI, Math.PI / 2, -Math.PI / 2, Math.PI / 4, 2 * Math.PI, 3 * Math.PI / 2, 0.5, 1, -1, 3, 6, 100, -100, 823549, -823549, NaN, Infinity, -Infinity];
  for (const x of sx) jsmath.sin.push([T(x), T(Math.sin(x))]);
  for (let i = 0; i < 4000; i++) { const x = (rnd() * 2 - 1) * Math.PI; jsmath.sin.push([T(x), T(Math.sin(x))]); }
  for (let i = 0; i < 1500; i++) { const x = (rnd() * 2 - 1) * 100; jsmath.sin.push([T(x), T(Math.sin(x))]); }
  for (let i = 0; i < 600; i++) { const x = (rnd() * 2 - 1) * 800000; jsmath.sin.push([T(x), T(Math.sin(x))]); }
  for (let i = 0; i < 600; i++) { const x = (rnd() * 2 - 1) * 0.8; jsmath.sin.push([T(x), T(Math.sin(x))]); }

  const hs = [0, -0, 1, -1, NaN, Infinity, -Infinity, 1e200, -1e200, 1e-200, 5e-324, 3, 4, 1e308, 0.5];
  for (const a of hs) for (const b of hs) jsmath.hypot.push([T(a), T(b), T(Math.hypot(a, b))]);
  for (let i = 0; i < 6000; i++) { const a = rnd() * 2 - 1, b = rnd() * 2 - 1; jsmath.hypot.push([T(a), T(b), T(Math.hypot(a, b))]); }
  for (let i = 0; i < 1500; i++) { const a = rnd() * 1e5, b = rnd() * 1e-5; jsmath.hypot.push([T(a), T(b), T(Math.hypot(a, b))]); }
  for (let i = 0; i < 1000; i++) { const a = rnd(), b = a; jsmath.hypot.push([T(a), T(b), T(Math.hypot(a, b))]); }
}
out('jsmath.json', jsmath);

// ================= core.json =================
const core = { meta };
const seeds = [1, 7, 42, 123, 9999, 2026, 65535, 4294967295];
core.consts = {
  kontynenty_zone_count: G.KONTYNENTY_ZONE_COUNT,
  island_grid_divisions: G.ISLAND_GRID_DIVISIONS,
  map_border_ocean_hexes: G.MAP_BORDER_OCEAN_HEXES,
  map_margin_land_zone_hexes: G.MAP_MARGIN_LAND_ZONE_HEXES,
  ziemia_land_centers: centersOut(G.ZIEMIA_LAND_CENTERS),
};
core.perms = seeds.map((seed) => ({ seed, table: Array.from(G.buildPermTable(G.mulberry32(seed))) }));

core.shape_params = seeds.map((seed) => {
  const f = G.mulberry32(seed);
  const s = G.defaultShapeParams(f);
  return {
    seed,
    values: [s.noiseScale, s.mountainScale, s.forestScale, s.desertScale, s.offMtnX, s.offMtnY, s.offForX, s.offForY, s.offDesX, s.offDesY].map(T),
    after: [T(f()), T(f())],
  };
});

const dimsMasks = [[1, 1], [2, 2], [3, 3], [3, 5], [7, 5], [10, 10], [13, 9], [36, 28], [40, 3], [60, 40], [120, 80], [168, 120], [250, 180], [500, 400]];
core.land_mask_at = [[1, 1], [2, 2], [3, 5], [7, 5], [13, 9], [36, 28], [60, 40]].map(([w, h]) => {
  const vals = [];
  for (let r = -1; r <= h; r++) for (let q = -1; q <= w; q++) vals.push(T(G.landMaskAt(q, r, w, h)));
  return { w, h, values: vals };
});

core.center_count = [];
for (const [w, h] of [[1, 1], [10, 10], [44, 45], [45, 45], [60, 40], [77, 77], [78, 77], [120, 80], [168, 120], [250, 180], [500, 400]]) {
  for (const typ of ['kontynenty', 'pangea', 'wyspy', 'ziemia']) core.center_count.push({ w, h, typ, n: G.continentCenterCount(w, h, typ) });
}

core.build_continent_centers = [];
{
  const cfgs = [
    { n: 5 }, { n: 1 }, { n: 0 }, { n: 2 }, { n: 4, o: { radiusMin: 0.1, radiusMax: 0.2 } },
    { n: 5, o: { minCenterDist: 0.2, width: 168, height: 120 } },
    { n: 3, o: { anchorCenter: false } },
    { n: 6, o: { minCenterDist: 0.9 } },
    { n: 4, o: { ringRadiusMin: 0.05, ringRadiusMax: 0.1, width: 36, height: 28 } },
    { n: 4, o: { anchorCenter: true, minCenterDist: 0.3, width: 10, height: 10 } },
    { n: 3, o: { width: 1, height: 1 } },
  ];
  for (const seed of [1, 42, 123, 9999]) for (const c of cfgs) {
    const f = G.mulberry32(seed);
    const cs = G.buildContinentCenters(f, c.n, c.o);
    core.build_continent_centers.push({ seed, n: c.n, opts: c.o ?? null, centers: centersOut(cs), after: [T(f()), T(f()), T(f())] });
  }
}

core.five_zone = [];
for (const seed of seeds) for (const [w, h] of [[120, 80], [36, 28], [168, 120], [10, 10], [1, 1], [2000, 5]]) for (const [rmin, rmax] of [[0.17, 0.26], [0.3, 0.3]]) {
  const f = G.mulberry32(seed);
  const cs = G.buildFiveZoneContinentCenters(f, w, h, rmin, rmax);
  core.five_zone.push({ seed, w, h, rmin: T(rmin), rmax: T(rmax), centers: centersOut(cs), after: [T(f()), T(f())] });
}

// strefy Voronoi: stale centra (z remisami) i losowe punkty
{
  const sets = {
    tie: [{ nq: 0.2, nr: 0.2, radius: 0.1 }, { nq: 0.8, nr: 0.2, radius: 0.1 }, { nq: 0.5, nr: 0.8, radius: 0.1 }, { nq: 0.5, nr: 0.2, radius: 0.1 }],
    five: G.buildFiveZoneContinentCenters(G.mulberry32(42), 36, 28, 0.17, 0.26),
    two: [{ nq: 0.3, nr: 0.5, radius: 0.2 }, { nq: 0.7, nr: 0.5, radius: 0.2 }],
    one: [{ nq: 0.5, nr: 0.5, radius: 0.2 }],
    none: [],
  };
  core.voronoi = [];
  const pts = [];
  for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) pts.push([i / 40, j / 40]);
  for (let i = 0; i < 2000; i++) pts.push([rnd() * 1.4 - 0.2, rnd() * 1.4 - 0.2]);
  for (const [name, cs] of Object.entries(sets)) {
    core.voronoi.push({
      name,
      centers: centersOut(cs),
      points: pts.map(([nq, nr]) => [T(nq), T(nr), G.nearestContinentZoneIndex(nq, nr, cs), T(G.secondNearestContinentDist(nq, nr, cs))]),
    });
  }
}

core.pangea_land_t = [];
for (let i = -50; i <= 150; i++) { const lf = i / 100; core.pangea_land_t.push([T(lf), T(G.pangeaLandT(lf))]); }
for (const lf of [NaN, Infinity, -Infinity, 0.15, 0.85, 0.5]) core.pangea_land_t.push([T(lf), T(G.pangeaLandT(lf))]);

core.pangea_layout = [];
for (const [w, h] of [[36, 28], [60, 40], [120, 80], [168, 120], [250, 180], [10, 10], [500, 400], [1, 1]]) {
  for (let i = -4; i <= 44; i++) {
    const lf = i / 40;
    const L = G.pangeaLandLayoutParams(lf, w, h);
    core.pangea_layout.push({
      w, h, lf: T(lf),
      values: [L.nBlobs, L.blobRadiusMin, L.blobRadiusMax, L.ringRMin, L.ringRMax, L.clusterRadius, L.threshold, L.mergeSum, L.mergeMax, L.globalWarp, L.valley, L.fillMinScore].map(T),
    });
  }
}

core.pangea_centers = [];
for (const seed of [1, 42, 123, 9999]) for (const [w, h] of [[36, 28], [120, 80], [168, 120], [10, 10], [500, 400]]) for (const lf of [0.15, 0.3, 0.45, 0.6, 0.85]) {
  const f = G.mulberry32(seed);
  const cs = G.buildPangeaBlobCenters(f, w, h, lf);
  core.pangea_centers.push({ seed, w, h, lf: T(lf), centers: centersOut(cs), after: [T(f()), T(f())] });
}

core.island_centers = [];
for (const seed of [1, 42, 123, 9999]) for (const [w, h] of [[36, 28], [120, 80], [168, 120], [10, 10], [500, 400], [1, 1]]) {
  const f = G.mulberry32(seed);
  const cs = G.buildSixteenGridIslandCenters(f, w, h);
  core.island_centers.push({ seed, w, h, centers: centersOut(cs), after: [T(f()), T(f())] });
}

core.island_cell = [];
for (const [w, h] of [[1, 1], [3, 2], [7, 5], [13, 9], [36, 28], [4, 4]]) {
  const idx = [];
  for (let r = -2; r <= h + 1; r++) for (let q = -2; q <= w + 1; q++) idx.push(G.islandGridCellIndex(q, r, w, h));
  core.island_cell.push({ w, h, indices: idx });
}
core.island_assign = [];
for (const [w, h] of [[1, 1], [3, 2], [7, 5], [13, 9], [36, 28], [0, 5]]) {
  const m = G.assignIslandGridIndices(w, h);
  core.island_assign.push({ w, h, entries: Array.from(m.entries()) });
}

core.isotropic = [];
for (const [w, h] of [[1, 1], [36, 28], [168, 120], [10, 200]]) {
  const pts = [];
  for (let i = 0; i < 60; i++) {
    const q = Math.floor(rnd() * (w + 2)) - 1, r = Math.floor(rnd() * (h + 2)) - 1;
    const iso = G.mapIsotropicFromCenter(q, r, w, h);
    const nq = rnd() * 1.2 - 0.1, nr = rnd() * 1.2 - 0.1;
    const ni = G.normToIsotropic(nq, nr, w, h);
    pts.push([q, r, T(iso.x), T(iso.y), T(nq), T(nr), T(ni.x), T(ni.y)]);
  }
  core.isotropic.push({ w, h, points: pts });
}

core.border = { margin_cap: [], fields: [] };
for (let i = -8; i <= 140; i++) {
  const d = i / 8;
  const c = G.marginLandCapForBorderDistance(d);
  core.border.margin_cap.push([T(d), c === null ? null : T(c)]);
}
for (const [w, h] of [[1, 1], [2, 2], [3, 5], [10, 10], [13, 9], [36, 28], [40, 3], [60, 40]]) {
  const rows = [];
  for (let r = -1; r <= h; r++) for (let q = -1; q <= w; q++) {
    rows.push([T(G.hexBorderDistance(q, r, w, h)), T(G.landMaskBorderFade(q, r, w, h)), T(G.mapEdgeRectFade(q, r, w, h))]);
  }
  core.border.fields.push({ w, h, border_width: T(G.mapBorderWidth(w, h)), rows });
}
out('core.json', core);

// ================= masks.json =================
const masks = { meta, cases: [] };
// radii/ziarna lancucha: perm = buildPermTable(rand); shape = defaultShapeParams(rand); centra z tego samego rand.
const chain = (seed, type, w, h, lf) => {
  const f = G.mulberry32(seed);
  const perm = G.buildPermTable(f);
  const shape = G.defaultShapeParams(f);
  let centers = [];
  if (type === 'kontynenty') centers = G.buildFiveZoneContinentCenters(f, w, h, 0.17, 0.26);
  else if (type === 'pangea') centers = G.buildPangeaBlobCenters(f, w, h, lf);
  else if (type === 'wyspy') centers = G.buildSixteenGridIslandCenters(f, w, h);
  return { perm, shape, centers, rest: T(f()) };
};
const seedFor = { 1: 1, 2: 7, 3: 42, 4: 123, 5: 9999 };
let ci = 0;
for (const type of ['kontynenty', 'pangea', 'wyspy', 'ziemia']) {
  for (const [w, h] of dimsMasks) {
    const lfs = type === 'pangea' ? (w * h > 20000 ? [0.45] : [0.15, 0.3, 0.45, 0.6, 0.85]) : [0];
    for (const lf of lfs) {
      const seed = [1, 7, 42, 123, 9999, 2026][ci++ % 6];
      const { perm, shape, centers, rest } = chain(seed, type, w, h, lf);
      const small = w * h <= 3000;
      const q0 = small ? -1 : 0, q1 = small ? w : w - 1, r0 = small ? -1 : 0, r1 = small ? h : h - 1;
      const vals = [];
      for (let r = r0; r <= r1; r++) for (let q = q0; q <= q1; q++) {
        let v;
        if (type === 'kontynenty') v = G.landMaskKontynenty(q, r, w, h, centers, perm, shape.noiseScale);
        else if (type === 'pangea') v = G.landMaskPangea(q, r, w, h, centers, perm, shape.noiseScale, lf);
        else if (type === 'wyspy') v = G.landMaskWyspy(q, r, w, h, centers, perm, shape.noiseScale);
        else v = G.landMaskZiemia(q, r, w, h, perm, shape.noiseScale);
        vals.push(v);
      }
      const c = { type, seed, w, h, lf: T(lf), noise_scale: T(shape.noiseScale), range: [q0, q1, r0, r1], count: vals.length, fnv: fnvBits(vals), rest_after_chain: rest, centers: centersOut(centers) };
      if (small) c.values = vals.map(T);
      else c.sample = vals.map((v, i) => [i, T(v)]).filter(([i]) => i % 97 === 0);
      masks.cases.push(c);
    }
  }
}
// bezposrednie punkty pangeaBlobScore (prywatna) na stalych centrach
{
  const perm = G.buildPermTable(G.mulberry32(42));
  const cs = G.buildPangeaBlobCenters(G.mulberry32(5), 60, 40, 0.5);
  masks.blob_score = [];
  for (let i = 0; i < 400; i++) {
    const q = Math.floor(rnd() * 60), r = Math.floor(rnd() * 40), z = Math.floor(rnd() * cs.length);
    masks.blob_score.push([q, r, z, T(G.pangeaBlobScore(q, r, 60, 40, cs[z], z, perm, 0.13))]);
  }
  masks.blob_score_meta = { seed_perm: 42, seed_centers: 5, w: 60, h: 40, lf: '0.5', noise_scale: '0.13', centers: centersOut(cs) };
}
out('masks.json', masks);
console.log('OK', masks.cases.length, 'przypadkow masek');
