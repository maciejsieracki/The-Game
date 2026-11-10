// Generator wektorow P6.M01 (rdzen mapgen): URUCHAMIA kod TS weba (pin edb8fb56), nie literaly.
// Uzycie (po `git archive edb8fb56 gra/src gra/data` do wlasnego mktemp -d poza repo):
//   node --experimental-transform-types --import ./gen-loader-register.mjs ./gen-m01-web.mjs <KORZEN> <wyjscie.json>
// Funkcje sa wycinane WERBATIM: skrypt kopiuje linie gen-helpers.ts :36-232 i :237-251 oraz caly
// earth-land-mask.ts do plikow-wycinkow w KORZENIU (nie w repo), dopisujac wylacznie instrukcje
// `export {...}` dla funkcji prywatnych. Zadna tresc funkcji nie jest zmieniana (sha256 w wyjsciu).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m01-web.mjs <KORZEN> <wyjscie.json>');
  process.exit(2);
}
const sha = (s) => createHash('sha256').update(s).digest('hex');
const mapDir = `${root}/gra/src/map`;

// ---------- wycinki werbatim ----------
const gh = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8').split('\n');
// numeracja 1-based: [from, to] wlacznie
const cut = (lines, from, to) => lines.slice(from - 1, to).join('\n');
const ghA = cut(gh, 36, 232);
const ghB = cut(gh, 237, 251);
if (!gh[56].startsWith('export function mulberry32') || !gh[237].startsWith('function climateForestThreshold')) {
  throw new Error('niezgodnosc numeracji gen-helpers.ts (pin?)');
}
const ghSlice =
  "import { TerenBazowy } from '../types/hex';\n" +
  "import { earthPolarOceanRows } from './earth-land-mask';\n" +
  ghA + '\n' + ghB + '\n' +
  'export { isWaterTerrainLocal, climateForestThreshold, canAssignClimateDesert };\n';
writeFileSync(`${mapDir}/__m01_gen_helpers_slice.ts`, ghSlice);

const elm = readFileSync(`${mapDir}/earth-land-mask.ts`, 'utf8');
const elmSlice = elm +
  '\nexport { earthPlayableInnerHeight, earthPlayableInnerWidth, earthLandMapRows, bitAt, ' +
  'earthSubsampleGrid, earthLandFractionThreshold, EARTH_PLAYABLE_BORDER };\n';
writeFileSync(`${mapDir}/__m01_earth_slice.ts`, elmSlice);

const gen = await import(pathToFileURL(`${mapDir}/earth-land-mask.generated.ts`).href);
const E = await import(pathToFileURL(`${mapDir}/__m01_earth_slice.ts`).href);
const G = await import(pathToFileURL(`${mapDir}/__m01_gen_helpers_slice.ts`).href);

// ---------- pomocnicze ----------
const t = (x) => (Object.is(x, -0) ? '-0' : String(x));
const rngIn = G.mulberry32(20261022); // deterministyczne WEJSCIA testowe (zapisane jawnie w wyjsciu)
const rnd = () => rngIn();

const result = {
  zrodlo: 'uruchomiony kod TS weba (gen-m01-web.mjs), pin edb8fb56',
  node: process.version,
  sha256: {
    'gen-helpers.ts:36-232': sha(ghA),
    'gen-helpers.ts:237-251': sha(ghB),
    'earth-land-mask.ts': sha(elm),
    'earth-land-mask.generated.ts': sha(readFileSync(`${mapDir}/earth-land-mask.generated.ts`, 'utf8')),
  },
};

// 1. mulberry32: 40 ziaren x 64 wartosci
const seeds = [0, 1, 2, 7, 42, 99, 123, 1000, 12345, 65535, 65536, 2147483647, 2147483648, 3735928559,
  4294967295, 305419896, 20261022, 777, 31337, 8675309];
while (seeds.length < 40) seeds.push(Math.floor(rnd() * 4294967296));
result.mulberry = seeds.map((seed) => {
  const f = G.mulberry32(seed);
  const values = [];
  for (let i = 0; i < 64; i++) values.push(t(f()));
  return { seed, valuesText: values };
});

// 2. perm table z mulberry32(seed): 24 ziaren, pelne 256
const permSeeds = seeds.slice(0, 24);
result.perm = permSeeds.map((seed) => ({ seed, table: Array.from(G.buildPermTable(G.mulberry32(seed))) }));

// 3. cosLerp
result.cos_lerp = [];
const cosIn = [[0, 1, 0], [0, 1, 1], [0, 1, 0.5], [1, 0, 0.25], [-3, 5, 0.75], [0.2, 0.9, 0.333]];
for (let i = 0; i < 400; i++) cosIn.push([rnd() * 2 - 0.5, rnd() * 2 - 0.5, rnd()]);
for (let i = 0; i < 100; i++) cosIn.push([rnd(), rnd(), rnd() * 6 - 3]); // t poza [0,1]
for (let i = 0; i < 4000; i++) cosIn.push([0, 1, i / 3999]); // gesto po t: zrodlo roznic cos()
for (const [a, b, tt] of cosIn) result.cos_lerp.push([t(a), t(b), t(tt), t(G.cosLerp(a, b, tt))]);

// 4. valueNoise2D / fbm
const pts = [[0, 0], [0.25, 0.75], [4.5, 3.25], [255.9, 255.9], [256, 256], [257.5, 1.5], [-0.5, -0.5],
  [-1, -1], [-255.5, 10.25], [1e10, 3.5], [-1e10, 3.5], [2147483648, 1.25], [4294967303.5, -4294967303.5],
  [-2147483649.25, 7.75], [1e15, 1e15], [0.1, 0.2]];
for (let i = 0; i < 500; i++) pts.push([(rnd() - 0.5) * 600, (rnd() - 0.5) * 600]);
const noiseSeeds = [42, 1, 12345, 4294967295];
result.noise = noiseSeeds.map((seed) => {
  const p = G.buildPermTable(G.mulberry32(seed));
  return { seed, pts: pts.map(([x, y]) => [t(x), t(y), t(G.valueNoise2D(p, x, y))]) };
});
result.fbm = [42, 7, 31337, 4294967295].map((seed) => {
  const p = G.buildPermTable(G.mulberry32(seed));
  const rows = [];
  for (const [x, y] of pts.slice(0, 120)) {
    rows.push([t(x), t(y), null, t(G.fbm(p, x, y))]); // domyslne octaves = 4
    for (const o of [0, 1, 2, 3, 5, 8]) rows.push([t(x), t(y), o, t(G.fbm(p, x, y, o))]);
  }
  return { seed, rows };
});

// 5. hex
result.hex_directions = G.HEX_DIRECTIONS.map((d) => [d[0], d[1]]);
const hd = [];
for (let aq = -4; aq <= 4; aq++) for (let ar = -4; ar <= 4; ar++) for (let bq = -4; bq <= 4; bq++)
  for (let br = -4; br <= 4; br++) hd.push(G.hexDistanceAxial(aq, ar, bq, br));
result.hex_distance_grid = { min: -4, max: 4, values: hd };
result.hex_distance_extra = [];
for (let i = 0; i < 2000; i++) {
  const a = Array.from({ length: 4 }, () => Math.floor((rnd() - 0.5) * 20000));
  result.hex_distance_extra.push([...a, G.hexDistanceAxial(...a)]);
}
result.hex_key = [[0, 0], [1, -1], [-5, 7], [167, 119], [-100000, 100000], [2147483647, -2147483648]]
  .map(([q, r]) => [q, r, G.hexKey(q, r)]);

// 6. maska Ziemi: dane
const rows = gen.EARTH_MASK_ROWS;
result.earth_mask = {
  w: gen.EARTH_MASK_W, h: gen.EARTH_MASK_H,
  bbox: [t(gen.EARTH_MASK_BBOX.minX), t(gen.EARTH_MASK_BBOX.minY), t(gen.EARTH_MASK_BBOX.maxX), t(gen.EARTH_MASK_BBOX.maxY)],
  rowCount: rows.length, rowLengths: Array.from(new Set(rows.map((r) => r.length))),
  onlyBits: rows.every((r) => /^[01]+$/.test(r)),
  // pozycje przelaczen 0<->1 (start w 0); pelna informacja o 288000 bitach
  toggles: rows.map((row) => {
    const tg = [];
    let cur = '0';
    for (let i = 0; i < row.length; i++) if (row[i] !== cur) { tg.push(i); cur = row[i]; }
    return tg;
  }),
  ones: rows.reduce((s, r) => s + [...r].filter((c) => c === '1').length, 0),
};
// bitAt (z clampem x,y poza zakresem)
result.bit_at = [];
const bitPts = [[0, 0], [719, 399], [720, 400], [-5, -5], [100000, 3], [3, 100000], [300, 200], [361, 80]];
for (let i = 0; i < 400; i++) bitPts.push([Math.floor(rnd() * 740) - 10, Math.floor(rnd() * 420) - 10]);
for (const [x, y] of bitPts) result.bit_at.push([x, y, E.bitAt(x, y)]);

// 7. wiersze polarne + wewnetrzne wymiary
result.earth_rows = [];
for (let h = 0; h <= 600; h++) {
  result.earth_rows.push([h, E.earthPolarOceanRows(h), E.earthNorthOceanRows(h), E.earthSouthOceanRows(h),
    E.earthPlayableInnerHeight(h), E.earthPlayableInnerWidth(h), E.earthLandMapRows(h),
    G.latitudinalOceanBufferRows(h, false), G.latitudinalOceanBufferRows(h, true)]);
}
result.earth_consts = {
  ref_rows: E.EARTH_POLAR_OCEAN_REF_ROWS, ref_inner_h: E.EARTH_POLAR_OCEAN_REF_INNER_H, border: E.EARTH_PLAYABLE_BORDER,
};

// 8. sampleEarthTemplateLand
const sp = [[0, 0], [1, 1], [0.5, 0.5], [0, 1], [1, 0], [1.0000001, 0.5], [-1e-12, 0.5], [0.5, -1e-12],
  [0.0723, 0.0551], [0.9917, 0.7243], [0.4, 0.3], [0.55, 0.2]];
for (let i = 0; i < 400; i++) sp.push([Math.floor(rnd() * 721) / 719, Math.floor(rnd() * 401) / 399]);
for (let i = 0; i < 4000; i++) sp.push([0.07 + rnd() * 0.93, 0.05 + rnd() * 0.68]);
result.sample_land = sp.map(([a, b]) => [t(a), t(b), E.sampleEarthTemplateLand(a, b)]);

// 9. wymiary map: hexToNorm, templateLandAt, subsample/threshold
const dims = [[36, 28], [4, 4], [5, 6], [6, 5], [7, 200], [200, 7], [10, 10], [20, 12], [40, 30], [60, 45],
  [80, 60], [84, 84], [100, 100], [114, 114], [168, 120], [120, 168], [164, 164], [224, 224], [250, 100],
  [324, 324], [424, 424], [430, 430], [500, 450], [1000, 900]];
const pickAxis = (n, cap) => {
  const s = Math.max(1, Math.ceil(n / cap));
  const set = new Set();
  for (let i = 0; i < n; i += s) set.add(i);
  for (let i = 0; i < Math.min(5, n); i++) set.add(i);
  for (let i = Math.max(0, n - 5); i < n; i++) set.add(i);
  return Array.from(set).sort((a, b) => a - b);
};
result.dims = dims.map(([w, h]) => {
  const qsN = pickAxis(w, 36), rsN = pickAxis(h, 36); // hexToNorm: <= ~1300 komorek
  const qsL = pickAxis(w, 110), rsL = pickAxis(h, 110); // templateLandAt
  const norm = rsN.map((r) => qsN.map((q) => {
    const v = E.earthHexToTemplateNorm(q, r, w, h);
    return v ? [t(v.nq), t(v.nr)] : null;
  }));
  const land = rsL.map((r) => qsL.map((q) => E.earthTemplateLandAt(q, r, w, h)).join(''));
  return {
    w, h, qsN, rsN, norm, qsL, rsL, land,
    subsample: E.earthSubsampleGrid(w, h), threshold: t(E.earthLandFractionThreshold(w, h)),
  };
});
// poza zakresem: ujemne q/r i granice
result.hex_to_norm_edges = [];
for (const [w, h] of [[36, 28], [168, 120]]) {
  for (const [q, r] of [[-1, 5], [5, -1], [1, 14], [2, 14], [w - 3, 14], [w - 2, 14], [w, 14], [10, h - 3], [10, h - 2], [10, h]]) {
    const v = E.earthHexToTemplateNorm(q, r, w, h);
    result.hex_to_norm_edges.push([w, h, q, r, v ? [t(v.nq), t(v.nr)] : null, E.earthTemplateLandAt(q, r, w, h)]);
  }
}

// 10. climateBandAt: h 0..260 + {300,400,600}, r od -3 do h+2, isEarth false/true
const bandIdx = ['polar_north', 'temperate_north', 'plains_north', 'desert', 'plains_south', 'temperate_south', 'polar_south'];
result.climate_bands = bandIdx;
result.climate = [];
const hs = Array.from({ length: 261 }, (_, i) => i).concat([300, 400, 600]);
for (const h of hs) {
  for (const isEarth of [false, true]) {
    let s = '';
    for (let r = -3; r <= h + 2; r++) s += bandIdx.indexOf(G.climateBandAt(0, r, h, isEarth));
    result.climate.push({ h, isEarth, bands: s });
  }
}
// domyslny isEarth (undefined -> false) oraz argument q ignorowany
result.climate_default = [[28, 12, G.climateBandAt(5, 12, 28)], [28, 12, G.climateBandAt(999, 12, 28)]]
  .map(([h, r, b]) => [h, r, bandIdx.indexOf(b)]);

// 11. pasy: polarny, las, pustynia, woda
result.is_polar = bandIdx.map((b) => [b, G.isPolarClimateBand(b)]);
result.forest_threshold = [];
for (const band of [...bandIdx, null]) {
  for (const base of [0, 0.3, 0.5, 0.62, 0.7, 1, 1.1, 2]) {
    result.forest_threshold.push([band, t(base), t(G.climateForestThreshold(band === null ? undefined : band, base))]);
  }
}
result.can_desert = [...bandIdx, null].map((b) => [b, G.canAssignClimateDesert(b === null ? undefined : b)]);
result.is_water = Object.entries(await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href).then((m) => m.TerenBazowy))
  .map(([name, value]) => [name, value, G.isWaterTerrainLocal(value)]);
result.typ_swiata = ['kontynenty', 'pangea', 'wyspy', 'ziemia'];

// 12. Math.cos (silnik JS tego runtime'u): Rust `f64::cos` (glibc) rozni sie od V8 (fdlibm) o 1 ulp,
// wiec `js_cos` portuje fdlibm. Zakres sredni: |x| <= 2^19*pi/2 = 823549.66...; duze argumenty osobno.
const cosArgs = [0, -0, 1e-300, 1e-9, 0.5, 1, Math.PI / 4, Math.PI / 2, Math.PI, 3 * Math.PI / 4, 2 * Math.PI];
for (let k = -40; k <= 40; k++) {
  const base = k * Math.PI / 2;
  cosArgs.push(base, base + 1e-9, base - 1e-9, base + 1e-3, base - 1e-3);
}
for (let i = 0; i < 6000; i++) cosArgs.push((rnd() - 0.5) * 100);
for (let i = 0; i < 2000; i++) cosArgs.push((rnd() - 0.5) * 2e5);
for (let i = 0; i < 1000; i++) cosArgs.push(rnd() * 8.2e5);
for (let i = 0; i < 2000; i++) cosArgs.push((rnd() * 2 - 1) * Math.PI * 1.01); // zakres cosLerp i okolice
result.math_cos = cosArgs.map((x) => [t(x), t(Math.cos(x))]);
const bigArgs = [1e6, -1e6, 1e7, 1e10, -1e15, 1e100, 1e300, Infinity, -Infinity, NaN, 823549.66, 823550, 2 ** 20];
for (let i = 0; i < 300; i++) bigArgs.push((rnd() - 0.5) * 2e9);
result.math_cos_large = bigArgs.map((x) => [t(x), t(Math.cos(x))]);

writeFileSync(out, JSON.stringify(result));
console.error('OK', out, JSON.stringify(result).length, 'B');
