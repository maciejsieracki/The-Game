// Generator wektorow P6.M04 (klasyfikacja terenu i granice mapy): URUCHAMIA prawdziwy kod TS weba
// (pin edb8fb56), nie literaly. Uzycie (po `git archive edb8fb56 gra/src gra/data` do wlasnego
// `mktemp -d` poza repo):
//   node --experimental-transform-types --no-warnings --import ./m04-loader-register.mjs \
//        ./gen-m04-vectors.mjs <WEB_ROOT> <WYJSCIE.json>
// `gen-helpers.ts` laduje sie jako KOPIA pliku z dopisanym na KONCU wierszem
// `export { ...prywatne deklaracje... };` (zadna linia oryginalu nie jest zmieniana; generator
// sprawdza, ze kopia bez dopisku jest bajt w bajt rowna oryginalowi). Kopia lezy obok oryginalu
// w scratch (poza repo), wiec importy wzgledne dzialaja bez zmian. Loader tylko dopisuje
// .ts / /index.ts i traktuje .json jako modul - ZERO stubow logiki.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m04-vectors.mjs <WEB_ROOT> <WYJSCIE.json>');
  process.exit(2);
}
const sha = (s) => createHash('sha256').update(s).digest('hex');
const mapDir = `${root}/gra/src/map`;

// ---------- kopia gen-helpers.ts z dopisanymi eksportami prywatnych deklaracji ----------
const PRIVATE = [
  'reliefElevGates', 'hashInt3', 'terrainRownLakaJitter', 'marginScatterScore',
  'countLandNeighborsInSet', 'keysAtBorderDistance', 'isReliefCandidateHex',
  'mapCenterDistanceNorm', 'isWaterTerrainLocal', 'setHexToMorze', 'setHexToLaka', 'parseHexKey',
  'sortLandKeysForErosion', 'isForestEligibleTerrain', 'FOREST_SHARE_OF_DRY_LAND',
  'FOREST_OVERLAY_CAP_FRAC', 'TERRAIN_GLOBAL_MIX_AMP', 'TERRAIN_CELL_JITTER_AMP',
  'REAPPLY_RELIEF_BUDGET_FRAC', 'FALLBACK_RELIEF_FRAC',
];
const original = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
const exportLine = `\nexport { ${PRIVATE.join(', ')} };\n`;
const copyText = original + exportLine;
if (copyText.slice(0, original.length) !== original) throw new Error('kopia != oryginal');
writeFileSync(`${mapDir}/gen-helpers.m04-exports.ts`, copyText);
const lineCount = original.split('\n').length;

const G = await import(pathToFileURL(`${mapDir}/gen-helpers.m04-exports.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy, Nakladka } = H;

// ---------- pomocnicze ----------
const t = (x) => (Object.is(x, -0) ? '-0' : String(x)); // f64 jako tekst (NaN, Infinity, -0)
const tq = (x) => (x === undefined ? null : t(x));
const rng = G.mulberry32(20261023);
const rnd = () => rng();
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1)); // calkowite [a,b]
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const ALL_TB = [TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza, TerenBazowy.Gory,
  TerenBazowy.PlytkieMorze, TerenBazowy.Morze, TerenBazowy.Pustynia, TerenBazowy.Polarny];
const LAND_TB = [TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza, TerenBazowy.Gory,
  TerenBazowy.Pustynia, TerenBazowy.Polarny];
const SEA_TB = [TerenBazowy.Morze, TerenBazowy.PlytkieMorze];
const BANDS = ['polar_north', 'temperate_north', 'plains_north', 'desert', 'plains_south',
  'temperate_south', 'polar_south'];
const TIERS = ['low', 'medium', 'high'];
const TYPS = ['kontynenty', 'pangea', 'wyspy', 'ziemia'];
const NAKS = [Nakladka.Brak, Nakladka.Las, Nakladka.ZlozeGliny, Nakladka.ZlozeRudy,
  Nakladka.ZlozeKonia, Nakladka.ZlozeOwiec, Nakladka.ZlozeBydla, Nakladka.ZlozeLamy];

// kody numeryczne (rozmiar wektorow): indeks w tablicach `enums` zapisanych w wyniku
const TBI = Object.fromEntries(ALL_TB.map((x, i) => [x, i]));
const NKI = Object.fromEntries(NAKS.map((x, i) => [x, i]));
const fnv1a64 = (str) => {
  let h = 0xcbf29ce484222325n;
  for (const b of Buffer.from(str, 'utf8')) { h ^= BigInt(b); h = (h * 0x100000001b3n) & 0xffffffffffffffffn; }
  return h.toString(16).padStart(16, '0');
};

const cases = {};
const stats = {};

const mkHex = (q, r, tb, nak = Nakladka.Brak, riv = false, zl = false) => {
  const h = {
    coords: { q, r },
    terenBazowy: tb,
    nakladka: nak,
    ulepszenie: 'brak',
    wlasciciel: null,
    wioska: { istnieje: false, ludnosc: 0 },
    widocznosc: {},
    rzeka: { obecna: riv, krawedzie: riv ? [0, 3] : [] },
  };
  if (zl) h.zloze = { typ: 'x' };
  return h;
};
// spec heksa w wektorze: [q, r, tb, nak, riv(0/1), zl(0/1)]
const specToHexes = (spec) => {
  const hexes = {};
  for (const [q, r, tb, nak, riv, zl] of spec) hexes[G.hexKey(q, r)] = mkHex(q, r, tb, nak, !!riv, !!zl);
  return hexes;
};
// stan heksa po wykonaniu: [key, q, r, tb, nak, riv, edges, zl]
// (kolejnosc Object.entries; tb/nak jako kody z `enums`; klucz = "q,r" z coords - sprawdzane)
const dumpHexes = (hexes) =>
  Object.entries(hexes).map(([k, h]) => {
    if (k !== `${h.coords.q},${h.coords.r}`) throw new Error('klucz != coords');
    return [h.coords.q, h.coords.r, TBI[h.terenBazowy], NKI[h.nakladka],
      h.rzeka.obecna ? 1 : 0, h.rzeka.krawedzie.length, h.zloze ? 1 : 0];
  });
const dumpSpec = (spec) => spec.map(([q, r, tb, nak, riv, zl]) => [q, r, TBI[tb], NKI[nak], riv, zl]);

// mapa blobow z fbm: land frakcja ~ landFrac
function blobSpec(w, h, seed, landFrac, order = 'row') {
  const perm = G.buildPermTable(G.mulberry32(seed));
  const cells = [];
  for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) {
    cells.push({ q, r, n: G.fbm(perm, q * 0.13 + 7.3, r * 0.13 + 3.1, 3) });
  }
  const sorted = cells.map((c) => c.n).sort((a, b) => a - b);
  const thr = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * (1 - landFrac)))];
  let spec = cells.map((c) => {
    const water = c.n < thr;
    const tb = water ? (rnd() < 0.25 ? TerenBazowy.PlytkieMorze : TerenBazowy.Morze) : pick(LAND_TB);
    const nak = rnd() < 0.08 ? Nakladka.Las : (rnd() < 0.05 ? pick(NAKS) : Nakladka.Brak);
    return [c.q, c.r, tb, nak, !water && rnd() < 0.1 ? 1 : 0, !water && rnd() < 0.1 ? 1 : 0];
  });
  if (order === 'shuffle') spec = shuffle(spec);
  return spec;
}

// ---------- 1. stale ----------
cases.consts = {
  terenCoverageCellSize: t(G.terenCoverageCellSize()),
  MAP_BORDER_OCEAN_HEXES: t(G.MAP_BORDER_OCEAN_HEXES),
  MAP_MARGIN_LAND_ZONE_HEXES: t(G.MAP_MARGIN_LAND_ZONE_HEXES),
  TERRAIN_GLOBAL_MIX_AMP: t(G.TERRAIN_GLOBAL_MIX_AMP),
  TERRAIN_CELL_JITTER_AMP: t(G.TERRAIN_CELL_JITTER_AMP),
  REAPPLY_RELIEF_BUDGET_FRAC: Object.fromEntries(TIERS.map((k) => [k, t(G.REAPPLY_RELIEF_BUDGET_FRAC[k])])),
  FALLBACK_RELIEF_FRAC: Object.fromEntries(TIERS.map((k) => [k, {
    mountain: t(G.FALLBACK_RELIEF_FRAC[k].mountain), highland: t(G.FALLBACK_RELIEF_FRAC[k].highland) }])),
  FOREST_SHARE_OF_DRY_LAND: Object.fromEntries(TIERS.map((k) => [k, t(G.FOREST_SHARE_OF_DRY_LAND[k])])),
  FOREST_OVERLAY_CAP_FRAC: t(G.FOREST_OVERLAY_CAP_FRAC),
  mapBorderWidth: [[10, 10], [0, 0], [1, 1], [200, 100], [-5, 3], [Number.NaN, 4]]
    .map(([w, h]) => [t(w), t(h), t(G.mapBorderWidth(w, h))]),
  reliefLandFractions: TIERS.map((k) => {
    const f = G.reliefLandFractions(k);
    return [k, t(f.mountain), t(f.highland)];
  }),
};

// ---------- 2. isInLatitudinalOceanBuffer: [r, height, isEarth, out] ----------
cases.latBuffer = [];
{
  const heights = [];
  for (let h = 0; h <= 90; h++) heights.push(h);
  heights.push(100, 115, 116, 150, 200, 260, 300, 400, 600);
  for (const h of heights) {
    const rs = new Set();
    if (h <= 90) { for (let r = -3; r <= h + 3; r++) rs.add(r); }
    else {
      for (let r = -3; r <= 8; r++) rs.add(r);
      for (let r = h - 8; r <= h + 3; r++) rs.add(r);
      for (let i = 0; i < 12; i++) rs.add(ri(0, h - 1));
      const b = G.latitudinalOceanBufferRows(h, true);
      for (let r = b - 2; r <= b + 2; r++) rs.add(r);
      for (let r = h - b - 2; r <= h - b + 2; r++) rs.add(r);
    }
    for (const e of [false, true]) for (const r of rs) {
      cases.latBuffer.push([r, h, e ? 1 : 0, G.isInLatitudinalOceanBuffer(r, h, e) ? 1 : 0]);
    }
  }
}

// ---------- 3. hashInt3: [a, b, c, out] ----------
cases.hashInt3 = [];
{
  const special = [0, -0, 1, -1, 2147483647, 2147483648, 4294967295, 4294967296, 4294967297,
    9007199254740991, 1e15, -1e15, 0.5, -0.5, 1e-9, Number.NaN, Infinity, -Infinity, 123456789.123];
  const trip = [];
  for (const a of special) for (const c of [0, 42, 4294967295, Number.NaN]) trip.push([a, 3, c]);
  for (let i = 0; i < 4000; i++) {
    const a = ri(-60, 300);
    const b = ri(-60, 300);
    const c = i % 5 === 0 ? ri(0, 4294967295) : (i % 5 === 1 ? ri(0, 99999) : (i % 5 === 2 ? Math.floor(rnd() * 8e9) : (i % 5 === 3 ? rnd() * 1000 : ri(0, 4294967295))));
    trip.push([a, b, c]);
  }
  for (const [a, b, c] of trip) cases.hashInt3.push([t(a), t(b), t(c), t(G.hashInt3(a, b, c))]);
}

// ---------- 4. terrainCellBias: [q, r, seed, cellSize|null, out] ----------
cases.cellBias = [];
{
  const sizes = [undefined, undefined, undefined, 1, 2, 3, 4, 5, 7, 0.5, 2.5, 10, 0, -4, Number.NaN, Infinity];
  for (let i = 0; i < 5000; i++) {
    const q = i % 7 === 0 ? ri(-40, 400) + (rnd() < 0.3 ? rnd() : 0) : ri(-12, 300);
    const r = i % 11 === 0 ? ri(-40, 400) + (rnd() < 0.3 ? rnd() : 0) : ri(-12, 300);
    const seed = i % 3 === 0 ? ri(0, 4294967295) : ri(0, 99999);
    const cs = pick(sizes);
    const v = cs === undefined ? G.terrainCellBias(q, r, seed) : G.terrainCellBias(q, r, seed, cs);
    cases.cellBias.push([t(q), t(r), t(seed), tq(cs), t(v)]);
  }
  for (const q of [Number.NaN, Infinity, -Infinity, -0]) for (const r of [0, 5, Number.NaN]) {
    cases.cellBias.push([t(q), t(r), '42', null, t(G.terrainCellBias(q, r, 42))]);
  }
}

// ---------- 5. terrainRownLakaJitter: [for, des, bias, out] ----------
cases.jitter = [];
for (let i = 0; i < 3000; i++) {
  const f = i % 40 === 0 ? pick([Number.NaN, Infinity, -Infinity, -0, 0, 1]) : rnd();
  const d = i % 41 === 0 ? pick([Number.NaN, Infinity, -0, 0, 1]) : rnd();
  const b = i % 43 === 0 ? pick([Number.NaN, -Infinity, 0, -0]) : rnd() * 2 - 1;
  cases.jitter.push([t(f), t(d), t(b), t(G.terrainRownLakaJitter(f, d, b))]);
}

// ---------- 6. reliefElevGates: [mtnTh, mountain, highland, landMaskHi, landMaskMtn] ----------
cases.elevGates = [];
{
  const ths = [];
  for (let i = 400; i <= 900; i++) ths.push(i / 1000);
  ths.push(0.55, 0.5500000000000001, 0.5499999999999999, 0.75, 0.7500000000000001, 0.7499999999999999,
    Number.NaN, Infinity, -Infinity, -0, 0, 1, -1);
  for (const th of ths) {
    const g = G.reliefElevGates(th);
    cases.elevGates.push([t(th), t(g.mountain), t(g.highland), t(g.landMaskHi), t(g.landMaskMtn)]);
  }
}

// ---------- 7/8. classifyTerrain / classifyTerrainFlat ----------
const cnt = (arr) => arr.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {});
function genClassify(fn) {
  const res = [];
  const elevPts = [0.14, 0.18, 0.45, 0.35, 0.1, 0.08, 0.11, 0.15, 0.22, 0.3];
  const lmPts = [0.22, 0.12, 0.15, 0.2, 0.3, 0.35, 0.18, 0.4];
  const nPts = [0.5, 0.55, 0.6, 0.63, 0.7, 0.75, 0.8];
  const near = (x) => pick([x, x, x + Number.EPSILON, x - Number.EPSILON, x + 1e-9, x - 1e-9]);
  const thSets = [undefined, {}, { desert: 0.5 }, { mountain: 0.5 }, { mountain: 0.55 }, { mountain: 0.6 },
    { mountain: 0.7 }, { mountain: 0.75 }, { mountain: 0.8 }, { highland: 0.5 }, { highland: 0.6 },
    { desert: 0.55, mountain: 0.5, highland: 0.45 }, { desert: null, mountain: null, highland: null },
    { forest: 0.3, desert: 0.7 }, { desert: 0.4, highland: 0.7, mountain: 0.8 }, { mountain: Number.NaN },
    { desert: Number.NaN }, { highland: Number.NaN }, { mountain: 0.9, highland: 0.2, desert: 0.9 }];
  for (let i = 0; i < 6000; i++) {
    const useB = i % 3 === 0;
    const elev = useB ? near(pick(elevPts)) : (i % 17 === 0 ? pick([Number.NaN, -0.2, 1.4, Infinity]) : rnd() * 0.8 - 0.05);
    const lm = useB ? near(pick(lmPts)) : rnd() * 0.6;
    const mtn = i % 4 === 0 ? near(pick(nPts)) : rnd();
    const fo = rnd();
    const de = i % 5 === 0 ? near(pick([0.63, 0.5, 0.55, 0.4, 0.7, 0.9])) : rnd();
    const th = pick(thSets);
    const band = rnd() < 0.2 ? undefined : pick(BANDS);
    const bias = rnd() < 0.3 ? undefined : (rnd() * 2 - 1);
    const args = [elev, lm, mtn, fo, de, th, band, bias];
    const r = fn(...args);
    const thJson = th === undefined ? null : Object.fromEntries(Object.entries(th).map(([k, v]) => [k, v === null ? null : t(v)]));
    if (r.nakladka !== Nakladka.Brak) throw new Error('nakladka != brak');
    res.push([t(elev), t(lm), t(mtn), t(fo), t(de), thJson, band ?? null,
      bias === undefined ? null : t(bias), TBI[r.terenBazowy]]);
  }
  return res;
}
// Wartosci BEZPOSREDNIO przy progach (sasiednie liczby zmiennoprzecinkowe), z pozostalymi warunkami
// spelnionymi, by kazde porownanie `<`/`<=`/`>`/`>=` zmienialo wynik.
function nextUp(x) {
  const b = new DataView(new ArrayBuffer(8));
  b.setFloat64(0, x);
  b.setBigUint64(0, b.getBigUint64(0) + (x >= 0 ? 1n : -1n));
  return b.getFloat64(0);
}
function nextDown(x) {
  const b = new DataView(new ArrayBuffer(8));
  b.setFloat64(0, x);
  b.setBigUint64(0, b.getBigUint64(0) + (x > 0 ? -1n : 1n));
  return b.getFloat64(0);
}
const around = (x) => [nextDown(x), x, nextUp(x)];
function boundaryInputs() {
  const rows = []; // [elev, lm, mtn, for, des, th, band, bias]
  const T = 'temperate_north';
  const push = (...a) => rows.push(a);
  const ths = [undefined, { mountain: 0.5 }, { mountain: 0.55 }, { mountain: 0.7 }, { mountain: 0.75 }, { mountain: 0.8 },
    { mountain: 0.9, highland: 0.4 }, { mountain: 0.5, highland: 0.4 }];
  // A. rownina: elev + jitter > 0.35 przy jitter == 0 (for + des == 1, bias == 0)
  for (const e of around(0.35)) for (const [f, d] of [[0.5, 0.5], [0.4, 0.6], [0.3, 0.7], [0.25, 0.75]]) {
    for (const bias of [undefined, 0, -0]) push(e, 0.5, 0.1, f, d, undefined, T, bias);
  }
  // B. morze / laka: elev < 0.14, landMask < 0.22
  for (const e of around(0.14)) for (const lm of [0.1, 0.3]) push(e, lm, 0.1, 0.5, 0.5, undefined, T, 0);
  for (const lm of around(0.22)) push(0.1, lm, 0.1, 0.5, 0.5, undefined, T, 0);
  // C/D. gora i wzgorza: progi szumu, bramki landMask i elev (wszystkie trzy wiersze reliefElevGates)
  for (const th of ths) {
    const mtnTh = th?.mountain ?? 0.75;
    for (const m of around(mtnTh)) push(0.5, 0.9, m, 0.5, 0.5, th, T, 0);
    const g = G.reliefElevGates(mtnTh);
    for (const lm of around(g.landMaskMtn)) push(0.5, lm, 0.99, 0.5, 0.5, th, T, 0);
    for (const e of around(g.mountain)) push(e, 0.9, 0.99, 0.5, 0.5, th, T, 0);
    const hiTh = th?.highland ?? 0.6;
    const thH = { ...(th ?? {}), mountain: th?.mountain ?? 0.75 };
    for (const m of around(hiTh)) push(0.5, 0.9, m, 0.5, 0.5, thH, T, 0);
    for (const lm of around(g.landMaskHi)) push(0.5, lm, mtnTh - 1e-3, 0.5, 0.5, thH, T, 0);
    for (const e of around(g.highland)) push(e, 0.9, mtnTh - 1e-3, 0.5, 0.5, thH, T, 0);
  }
  // E. pustynia: des > desTh, 0.18 < elev < 0.45, pas klimatyczny
  for (const th of [undefined, { desert: 0.5 }]) {
    const desTh = th?.desert ?? 0.63;
    for (const de of around(desTh)) for (const band of [undefined, 'desert', T]) push(0.3, 0.5, 0.1, 0.5, de, th, band, 0);
  }
  for (const e of [...around(0.18), ...around(0.45)]) for (const band of [undefined, 'desert']) push(e, 0.5, 0.1, 0.5, 0.99, undefined, band, 0);
  return rows;
}
function genBoundary(fn) {
  return boundaryInputs().map(([elev, lm, mtn, fo, de, th, band, bias]) => {
    const r = fn(elev, lm, mtn, fo, de, th, band, bias);
    const thJson = th === undefined ? null : Object.fromEntries(Object.entries(th).map(([k, v]) => [k, v === null ? null : t(v)]));
    return [t(elev), t(lm), t(mtn), t(fo), t(de), thJson, band ?? null, bias === undefined ? null : t(bias), TBI[r.terenBazowy]];
  });
}
cases.classify = [...genClassify(G.classifyTerrain), ...genBoundary(G.classifyTerrain)];
cases.classifyFlat = [...genClassify(G.classifyTerrainFlat), ...genBoundary(G.classifyTerrainFlat)];
stats.classifyTerrain = cnt(cases.classify.map((c) => ALL_TB[c[8]]));
stats.classifyTerrainFlat = cnt(cases.classifyFlat.map((c) => ALL_TB[c[8]]));

// ---------- 9. reapplyLandTerrain ----------
cases.reapplyLand = [];
{
  const nCases = 45;
  for (let c = 0; c < nCases; c++) {
    const w = ri(6, 26);
    const h = ri(6, 26);
    const seedMap = ri(1, 1e6);
    const spec = blobSpec(w, h, seedMap, 0.3 + rnd() * 0.65, c % 4 === 0 ? 'shuffle' : 'row');
    const scratchArr = [];
    const scratch = new Map();
    const quant = c % 3 === 0; // remisy mtnNoise
    for (const [q, r, tb] of spec) {
      if (rnd() < 0.04) continue; // brak wpisu scratch
      const mk = (x) => (quant ? Math.round(x * 20) / 20 : x);
      const s = {
        elevContinental: rnd() * 0.85,
        landMask: rnd() < 0.2 ? rnd() * 0.3 : 0.3 + rnd() * 0.7,
        mtnNoise: mk(0.4 + rnd() * 0.6),
        forNoise: rnd(),
        desNoise: rnd(),
      };
      scratch.set(G.hexKey(q, r), s);
      scratchArr.push([G.hexKey(q, r), t(s.elevContinental), t(s.landMask), t(s.mtnNoise), t(s.forNoise), t(s.desNoise)]);
    }
    const ths = pick([undefined, { mountain: 0.5 }, { highland: 0.5, mountain: 0.6 }, { desert: 0.5 }, { mountain: 0.8, highland: 0.7 }, {}]);
    const mapHeight = pick([undefined, 0, h, h, h, h + 30, 5]);
    const tier = TIERS[c % 3];
    const seed = c % 2 ? ri(0, 4294967295) : ri(0, 5000);
    const hexes = specToHexes(spec);
    G.reapplyLandTerrain(hexes, scratch, seed, ths, mapHeight, tier);
    cases.reapplyLand.push({
      w, h, seed: t(seed), tier, mapHeight: mapHeight === undefined ? null : mapHeight,
      th: ths === undefined ? null : Object.fromEntries(Object.entries(ths).map(([k, v]) => [k, t(v)])),
      spec: dumpSpec(spec), scratch: scratchArr, out: dumpHexes(hexes),
    });
  }
}

// ---------- 10. reapplyForestOverlay (+ dane zaleznosci zapisane z weba) ----------
cases.reapplyForest = [];
cases.forestEligible = ALL_TB.map((tb) => [tb, G.isForestEligibleTerrain(tb) ? 1 : 0]);
{
  const nCases = 36 + 20 + 8; // 36 blobow + 20 rzadkich + 8 gestych (pelne komorki kwalifikujace sie pod las)
  // mapy z RZADKIM terenem kwalifikujacym sie pod las (1-3 heksy na komorke): target zalezy od minForest
  const sparseSpec = (w, h, pElig) => {
    const sp = [];
    for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) {
      const edge = q === 0 || r === 0 || q === w - 1 || r === h - 1;
      const tb = edge ? TerenBazowy.Morze
        : (rnd() < pElig ? pick([TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza])
          : pick([TerenBazowy.Gory, TerenBazowy.Pustynia, TerenBazowy.Polarny, TerenBazowy.Gory]));
      sp.push([q, r, tb, Nakladka.Brak, 0, 0]);
    }
    return sp;
  };
  for (let c = 0; c < nCases; c++) {
    const sparse = c >= 36 && c < 56;
    const dense = c >= 56;
    const w = sparse || dense ? ri(12, 24) : ri(14, 32);
    const h = sparse || dense ? ri(12, 24) : ri(14, 32);
    const spec = dense
      ? sparseSpec(w, h, [0.97, 1.0][c % 2])
      : sparse
      ? sparseSpec(w, h, [0.01, 0.03, 0.06, 0.1][c % 4])
      : blobSpec(w, h, ri(1, 1e6), 0.35 + rnd() * 0.6, c % 5 === 0 ? 'shuffle' : 'row');
    const typ = TYPS[c % 4];
    const tier = dense ? 'high' : TIERS[Math.floor(c / 4) % 3];
    const nCont = ri(1, 4);
    let continentOf = null;
    if (c % 3 !== 2) {
      continentOf = new Map();
      const centers = Array.from({ length: nCont }, () => [rnd() * w, rnd() * h]);
      for (const [q, r] of spec) {
        let best = 0;
        let bd = Infinity;
        centers.forEach(([cq, cr], i) => { const d = Math.hypot(q - cq, r - cr); if (d < bd) { bd = d; best = i; } });
        if (rnd() < 0.95) continentOf.set(G.hexKey(q, r), best);
      }
    }
    const nContinents = c % 7 === 0 ? 0 : nCont;
    const mapHeight = pick([undefined, 0, h, h, h, h * 2, 17, 100]);
    const scratch = new Map();
    const scratchArr = [];
    for (const [q, r] of spec) {
      if (rnd() < 0.05) continue;
      const fn = c % 6 === 0 ? Math.round(rnd() * 10) / 10 : rnd();
      scratch.set(G.hexKey(q, r), { elevContinental: 0, landMask: 1, mtnNoise: 0, forNoise: fn, desNoise: 0 });
      scratchArr.push([G.hexKey(q, r), t(fn)]);
    }
    const hexes = specToHexes(spec);
    // zaleznosci: wartosci z PRAWDZIWEGO weba policzone na stanie przed wywolaniem
    const cellSize = G.forestCoverageCellSize(tier);
    const seaDist = G.buildSeaDistanceField(hexes);
    const partitions = G.landPartitionKeysForDistribution(hexes, typ, continentOf, nContinents);
    const cellCalls = partitions.map((part) => {
      const massSet = [...new Set(part.filter((k) => { const hx = hexes[k]; return !hx || !G.isWaterTerrainLocal(hx.terenBazowy); }))];
      const cellMap = G.landHexesByCoverageCell(new Set(massSet), cellSize);
      return { massKey: fnv1a64(massSet.join(';')), massLen: massSet.length,
        cells: [...cellMap.entries()].map(([ck, arr]) => [ck, arr.map(([q, r]) => [q, r])]) };
    });
    const assigned = G.reapplyForestOverlay(hexes, scratch, undefined, typ, tier, continentOf, nContinents, mapHeight);
    cases.reapplyForest.push({
      w, h, typ, tier, nContinents, mapHeight: mapHeight === undefined ? null : mapHeight,
      continentOf: continentOf === null ? null : [...continentOf.entries()].map(([k, v]) => [k, v]),
      spec: dumpSpec(spec), scratch: scratchArr,
      deps: {
        share: t(G.FOREST_SHARE_OF_DRY_LAND[tier]),
        capFrac: t(G.FOREST_OVERLAY_CAP_FRAC),
        cellSize: t(cellSize),
        minLand: t(G.minLandHexesForFairPlayCell(cellSize)),
        // odleglosc od wody wg kolejnosci `spec` (null = brak wpisu w Map)
        seaDist: spec.map(([q, r]) => (seaDist.has(G.hexKey(q, r)) ? t(seaDist.get(G.hexKey(q, r))) : null)),
        partitions,
        cellCalls,
      },
      assigned, out: dumpHexes(hexes),
    });
  }
}

// ---------- 11. sortLandKeysForErosion (zaleznosc M06, bezposrednie wektory dla hooka testowego) ----------
cases.erosionSort = [];
{
  for (let c = 0; c < 42; c++) {
    const w = ri(8, 30);
    const h = ri(8, 30);
    const spec = blobSpec(w, h, ri(1, 1e6), 0.2 + rnd() * 0.75);
    const hexes = specToHexes(spec);
    const landScores = new Map();
    const scoresArr = [];
    const quant = c % 3 === 0;
    for (const [q, r] of spec) {
      if (rnd() < 0.1) continue;
      let v = rnd() * 2;
      if (quant) v = Math.round(v * 4) / 4;
      landScores.set(G.hexKey(q, r), v);
      scoresArr.push([G.hexKey(q, r), t(v)]);
    }
    const landKeys = Object.keys(hexes).filter((k) => !G.isWaterTerrainLocal(hexes[k].terenBazowy));
    const mode = c % 3;
    let keys;
    if (mode === 0) {
      const d0 = ri(0, 4);
      keys = landKeys.filter((k) => { const p = G.parseHexKey(k); return G.hexBorderDistance(p.q, p.r, w, h) === d0; });
    }
    else if (mode === 1) keys = shuffle(landKeys).slice(0, ri(0, Math.min(60, landKeys.length)));
    else keys = landKeys.slice(0, Math.min(landKeys.length, 90));
    const sorted = G.sortLandKeysForErosion(keys, hexes, landScores, w, h);
    cases.erosionSort.push({ w, h, spec: dumpSpec(spec), scores: scoresArr, keys, out: sorted });
  }
}

// ---------- 12. applyMarginalLandZoneCaps ----------
cases.marginZone = [];
{
  for (let c = 0; c < 42; c++) {
    const w = ri(8, 34);
    const h = ri(8, 34);
    const landFrac = [0.15, 0.3, 0.5, 0.7, 0.85, 0.95][c % 6];
    const spec = blobSpec(w, h, ri(1, 1e6), landFrac, c % 9 === 0 ? 'shuffle' : 'row');
    // dodatkowo wylacz strefe brzegowa w czesci przypadkow, by uzyc galezi "land < target"
    if (c % 2 === 0) {
      for (const s of spec) {
        const d = G.hexBorderDistance(s[0], s[1], w, h);
        if (d <= 10 && rnd() < 0.85) { s[2] = rnd() < 0.5 ? TerenBazowy.Morze : TerenBazowy.PlytkieMorze; s[4] = 0; s[5] = 0; }
      }
    }
    const hexes = specToHexes(spec);
    const landScores = new Map();
    const scoresArr = [];
    const quant = c % 4 === 0;
    for (const [q, r] of spec) {
      if (rnd() < 0.15) continue;
      let v = rnd() * 1.5;
      if (quant) v = Math.round(v * 8) / 8;
      landScores.set(G.hexKey(q, r), v);
      scoresArr.push([G.hexKey(q, r), t(v)]);
    }
    const adjusted = G.applyMarginalLandZoneCaps(hexes, landScores, w, h);
    cases.marginZone.push({ w, h, spec: dumpSpec(spec), scores: scoresArr, adjusted, out: dumpHexes(hexes) });
  }
}

// ---------- 13. setHexToMorze / setHexToLaka ----------
cases.setHex = [];
for (let c = 0; c < 48; c++) {
  const tb = ALL_TB[c % 8];
  const nak = NAKS[Math.floor(c / 8) % 8];
  const riv = c % 2 === 0;
  const zl = c % 3 === 0;
  const spec = [[c, c + 1, tb, nak, riv ? 1 : 0, zl ? 1 : 0]];
  const hm = specToHexes(spec);
  const hl = specToHexes(spec);
  G.setHexToMorze(hm[G.hexKey(c, c + 1)]);
  G.setHexToLaka(hl[G.hexKey(c, c + 1)]);
  cases.setHex.push({ spec: dumpSpec(spec), morze: dumpHexes(hm), laka: dumpHexes(hl) });
}

// ---------- 14. marginLandCapForBorderDistance: [d, out|null] ----------
cases.marginCap = [];
{
  const ds = [];
  for (let d = -4; d <= 30; d += 0.5) ds.push(d);
  ds.push(Number.NaN, Infinity, -Infinity, -0, 1.9999999999999998, 2.0000000000000004, 10.000000000000002, 9.999999999999998);
  for (const d of ds) {
    const v = G.marginLandCapForBorderDistance(d);
    cases.marginCap.push([t(d), v === null ? null : t(v)]);
  }
}

// ---------- 15. formuly brzegu: [q, r, w, h, lmbf, radial, edge, cdn, hbd, inBorder, inMargin, mapBorderW] ----------
cases.fades = [];
{
  const dims = [[10, 10], [20, 15], [40, 30], [80, 60], [100, 100], [200, 120], [1, 1], [2, 2], [1, 30], [30, 1],
    [0, 0], [3, 50], [15, 15], [64, 48], [500, 300], [11, 11], [12, 12], [25, 7]];
  for (let i = 0; i < 4500; i++) {
    const [w, h] = i % 5 === 0 ? [ri(1, 300) + (rnd() < 0.2 ? 0.5 : 0), ri(1, 300)] : pick(dims);
    const frac = rnd() < 0.15;
    const q = i % 4 === 0 ? ri(-5, w + 5) : ri(0, Math.max(0, Math.floor(w) - 1)) + (frac ? rnd() : 0);
    const r = i % 4 === 1 ? ri(-5, h + 5) : ri(0, Math.max(0, Math.floor(h) - 1)) + (frac ? rnd() : 0);
    cases.fades.push([t(q), t(r), t(w), t(h),
      t(G.landMaskBorderFade(q, r, w, h)), t(G.mapCenterRadialBias(q, r, w, h)),
      t(G.mapEdgeRectFade(q, r, w, h)), t(G.mapCenterDistanceNorm(q, r, w, h)),
      t(G.hexBorderDistance(q, r, w, h)), G.isInMapBorder(q, r, w, h) ? 1 : 0,
      G.isInMapMarginZone(q, r, w, h) ? 1 : 0]);
  }
  for (const q of [Number.NaN, Infinity, -Infinity, -0]) for (const w of [10, Number.NaN, Infinity]) {
    cases.fades.push([t(q), '3', t(w), '10',
      t(G.landMaskBorderFade(q, 3, w, 10)), t(G.mapCenterRadialBias(q, 3, w, 10)),
      t(G.mapEdgeRectFade(q, 3, w, 10)), t(G.mapCenterDistanceNorm(q, 3, w, 10)),
      t(G.hexBorderDistance(q, 3, w, 10)), G.isInMapBorder(q, 3, w, 10) ? 1 : 0,
      G.isInMapMarginZone(q, 3, w, 10) ? 1 : 0]);
  }
}
// isInMapBorder z buforem: [q, r, w, h, buffer, out]
cases.inBorderBuf = [];
for (let i = 0; i < 1500; i++) {
  const w = ri(1, 60);
  const h = ri(1, 60);
  const q = ri(-2, w + 2);
  const r = ri(-2, h + 2);
  const b = pick([0, 1, 2, 3, 5, 0.5, 2.5, -1, 100, Number.NaN, Infinity, -0]);
  cases.inBorderBuf.push([t(q), t(r), t(w), t(h), t(b), G.isInMapBorder(q, r, w, h, b) ? 1 : 0]);
}

// ---------- 16. narzedzia siatki brzegu ----------
cases.borderGrid = [];
{
  for (let c = 0; c < 56; c++) {
    const w = ri(1, 22);
    const h = ri(1, 22);
    const spec = [];
    for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) {
      const tb = rnd() < 0.45 ? pick(SEA_TB) : pick(LAND_TB);
      spec.push([q, r, tb, pick(NAKS), rnd() < 0.2 ? 1 : 0, rnd() < 0.2 ? 1 : 0]);
    }
    const buffers = [undefined, 0, 1, 2, 3, 5, 2.5, -1, Number.NaN, 0.5];
    const counts = buffers.map((b) => (b === undefined ? G.countMapBorderHexes(w, h) : G.countMapBorderHexes(w, h, b)));
    const hexesF = specToHexes(spec);
    const found = G.findLandInMapBorder(hexesF, w, h);
    const bufE = pick(buffers);
    const hexesE = specToHexes(spec);
    const converted = bufE === undefined ? G.enforceMapBorderOcean(hexesE, w, h) : G.enforceMapBorderOcean(hexesE, w, h, bufE);
    const keysAt = [];
    for (let d = 0; d <= 12; d++) keysAt.push(G.keysAtBorderDistance(hexesF, w, h, d));
    keysAt.push(G.keysAtBorderDistance(hexesF, w, h, 0.5));
    // pomocnicze po wszystkich heksach
    const perHex = spec.map(([q, r]) => {
      const hx = hexesF[G.hexKey(q, r)];
      return [G.countLandNeighborsInSet(hexesF, q, r) , G.isReliefCandidateHex(hx, q, r, w, h) ? 1 : 0];
    });
    cases.borderGrid.push({
      w, h, spec: dumpSpec(spec), buffers: buffers.map(tq), counts, found,
      enforceBuffer: tq(bufE), converted, enforceOut: dumpHexes(hexesE), keysAt, perHex,
    });
  }
}
// marginScatterScore: [q, r, key|null (wynik z mapa scores), out]
cases.scatter = [];
{
  for (let i = 0; i < 2500; i++) {
    const q = i % 9 === 0 ? ri(-100000, 100000) : ri(-20, 400);
    const r = i % 10 === 0 ? ri(-100000, 100000) : ri(-20, 400);
    const scores = new Map();
    let sv = null;
    if (rnd() < 0.6) { const v = rnd() * 3 - 1; scores.set(G.hexKey(q, r), v); sv = v; }
    cases.scatter.push([q, r, sv === null ? null : t(sv), t(G.marginScatterScore(q, r, scores))]);
  }
}

// ---------- 17. rzut oka na V8: Math.pow(x, 2) vs x*x (uzasadnienie js_pow) ----------
{
  let diff = 0;
  let total = 0;
  for (let i = 0; i < 200000; i++) {
    const x = rnd() * 1.5;
    total++;
    if (Math.pow(x, 2.0) !== x * x) diff++;
  }
  stats.powSquareDiffs = { total, diff };
}

// ---------- 18. RUNDA 2: parseHexKey - klucze BRZEGOWE (zarzut 4) ----------
// Bezposrednio z uruchomionego weba (`Number(parts[0])`, `Number(parts[1])`): [key, q, r] (f64 jako tekst).
// Osobny generator losowy (`rng2`), zeby NIE zmienic strumienia `rnd()` wczesniejszych kategorii.
const rng2 = G.mulberry32(777001);
const rnd2 = () => rng2();
const ri2 = (a, b) => a + Math.floor(rnd2() * (b - a + 1));
cases.parseHexKey = [];
{
  const fixed = [
    '3,4', '-2,7', '0,0', '12,-9', '5', ',3', '', ',', '3,', 'a,b', '3,b', 'a,4', ' 3 , 4 ', '\t3,\n4',
    '0x10,0b11', '0o7,0O7', '0X1f,0B101', '0x,0b', '0b2,0o8', '0xg,1', '-0x10,+0x10', '1e3,1E-2', '.5,5.',
    '+5,-5', 'Infinity,-Infinity', '+Infinity,2', 'infinity,inf', 'INF,Inf', 'NaN,nan', '1_0,2', '1,2_0',
    '٣,٤', '3,4,5', '3,4,', ',,', '-0,0', '0,-0', ' 3,4 ', ' 3,4 ', '﻿3,4',
    '\u00853,4', '᠎3,4', '​3,4', '　3, 4', '\u000b3,\u000c4', '1e1000,-1e1000', '1e-1000,0e0',
    '00012,007', '1.2.3,4', '..,.', '1e,e1', '- 5,+ 5', '9007199254740993,9007199254740992',
    '0.1e1,5e+3', '.e1,1e+', '5e-3,0.0000001', '123456789012345678901234567890,1', '1e21,1e-7',
    '0x1fffffffffffff,0x20000000000001', '0b1111111111111111111111111111111111111111111111111111111,0o7777',
    'Infinity,Infinity', '-Infinity,Infinity', '+Infinity,+Infinity', '1e309,-1e309', 'Infinity ,\tInfinity\n',
    '0x' + 'f'.repeat(260) + ',1', '0b' + '1'.repeat(1100) + ',0', '0x' + 'f'.repeat(13) + ',0x' + 'f'.repeat(15),
    '0x1' + '0'.repeat(14) + '1,0x1' + '0'.repeat(13) + '8001', '0b' + '1'.repeat(53) + '1,0b' + '1'.repeat(53) + '10',
    '+,-', '+.5,-.5', '.,-.', '1 2,3 4', '3 ,4', '３,４', '0x 10,0 x10', '0xFF,0Xff', '0b,0o', '-Infinity,-',
    '1e+5,1E+5', '0e0,-0e0', '00,-00', '1.,-1.', 'Infinit,Infinityx', 'true,false', 'null,undefined', '[1],{}',
  ];
  const alphabet = '0123456789+-.eExXbBoOaAfF ,_\t ﻿Infity';
  const fuzz = [];
  for (let i = 0; i < 700; i++) {
    const len = ri2(0, 9);
    let s = '';
    for (let j = 0; j < len; j++) s += alphabet[ri2(0, alphabet.length - 1)];
    fuzz.push(s);
  }
  for (const key of [...fixed, ...fuzz]) {
    const p = G.parseHexKey(key);
    cases.parseHexKey.push([key, t(p.q), t(p.r)]);
  }
}

// ---------- 19. RUNDA 2: reapplyForestOverlay - przypadki UKIERUNKOWANE (zarzut 3) ----------
// Mutacja `forest-inland-gt-to-ge` (`maxSeaInPart > 1` -> `>= 1`) uznana w r1 za rownowazna "z reguly":
// bonus 0,14 dostaja wszystkie heksy jednakowo. Rownowaznosc NIE jest dowiedziona dla (a) remisow
// zmiennoprzecinkowych (`forNoise + 0.14` zwija sasiednie wartosci w jedna) i (b) heksow ladu bez wpisu
// w polu odleglosci (`?? 0` - skladowe bez wody). Tu: mapy z `maxSeaInPart == 1` i takie wartosci szumu,
// zeby mutacja ZMIENIALA wynik; generator uruchamia tez WEB z ta mutacja i liczy rozbieznosci
// (`stats.forestTie.mutantDiffers`) - gdy 0, generator konczy sie bledem.
const mutOriginal = original.replace('maxSeaInPart > 1 ?', 'maxSeaInPart >= 1 ?');
if (mutOriginal === original || original.split('maxSeaInPart > 1 ?').length !== 2) {
  throw new Error('mutacja inland: oczekiwano DOKLADNIE jednego wystapienia `maxSeaInPart > 1 ?`');
}
writeFileSync(`${mapDir}/gen-helpers.m04-mut-inland.ts`, mutOriginal);
const GMUT = await import(pathToFileURL(`${mapDir}/gen-helpers.m04-mut-inland.ts`).href);

cases.reapplyForestTie = [];
{
  const nextUpTie = (x) => nextUp(x);
  const TIE_VALUES = [0, 1e-20, 2e-20, 3e-20, 5e-324, 0.9, nextUpTie(0.9), nextUpTie(nextUpTie(0.9)), 0.5,
    nextUpTie(0.5), 0.3];
  // comb: wiersze morza i ladu na przemian => KAZDY heks ladu graniczy z woda (sd == 1, max == 1)
  const combSpec = (w, rows, landRows) => {
    const sp = [];
    for (let r = 0; r < rows; r++) for (let q = 0; q < w; q++) {
      const isLand = landRows.includes(r);
      sp.push([q, r, isLand ? [TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza][(q + r) % 3]
        : TerenBazowy.Morze, Nakladka.Brak, 0, 0]);
    }
    return sp;
  };
  const mkCase = (label, spec, typ, tier, continentOf, nContinents, mapHeight, fnPicker) => {
    const scratch = new Map();
    const scratchArr = [];
    for (const [q, r] of spec) {
      const fn = fnPicker(q, r);
      if (fn === undefined) continue;
      scratch.set(G.hexKey(q, r), { elevContinental: 0, landMask: 1, mtnNoise: 0, forNoise: fn, desNoise: 0 });
      scratchArr.push([G.hexKey(q, r), t(fn)]);
    }
    const hexes = specToHexes(spec);
    const hexesMut = specToHexes(spec);
    const cellSize = G.forestCoverageCellSize(tier);
    const seaDist = G.buildSeaDistanceField(hexes);
    const partitions = G.landPartitionKeysForDistribution(hexes, typ, continentOf, nContinents);
    const cellCalls = partitions.map((part) => {
      const massSet = [...new Set(part.filter((k) => { const hx = hexes[k]; return !hx || !G.isWaterTerrainLocal(hx.terenBazowy); }))];
      const cellMap = G.landHexesByCoverageCell(new Set(massSet), cellSize);
      return { massKey: fnv1a64(massSet.join(';')), massLen: massSet.length,
        cells: [...cellMap.entries()].map(([ck, arr]) => [ck, arr.map(([q, r]) => [q, r])]) };
    });
    // maksimum odleglosci od morza w partycjach (jak w webie: start 1, brak wpisu => 0)
    let maxSea = 1;
    for (const part of partitions) for (const k of part) {
      const hx = hexes[k];
      if (hx && G.isWaterTerrainLocal(hx.terenBazowy)) continue;
      const d = seaDist.get(k) ?? 0;
      if (d > maxSea) maxSea = d;
    }
    const assigned = G.reapplyForestOverlay(hexes, scratch, undefined, typ, tier, continentOf, nContinents, mapHeight);
    const assignedMut = GMUT.reapplyForestOverlay(hexesMut, scratch, undefined, typ, tier, continentOf, nContinents, mapHeight);
    const outA = dumpHexes(hexes);
    const outB = dumpHexes(hexesMut);
    const differs = JSON.stringify(outA) !== JSON.stringify(outB) || assigned !== assignedMut;
    cases.reapplyForestTie.push({
      label, w: Math.max(...spec.map((s) => s[0])) + 1, h: Math.max(...spec.map((s) => s[1])) + 1,
      typ, tier, nContinents, mapHeight: mapHeight === undefined ? null : mapHeight,
      continentOf: continentOf === null ? null : [...continentOf.entries()].map(([k, v]) => [k, v]),
      spec: dumpSpec(spec), scratch: scratchArr,
      deps: {
        share: t(G.FOREST_SHARE_OF_DRY_LAND[tier]),
        capFrac: t(G.FOREST_OVERLAY_CAP_FRAC),
        cellSize: t(cellSize),
        minLand: t(G.minLandHexesForFairPlayCell(cellSize)),
        seaDist: spec.map(([q, r]) => (seaDist.has(G.hexKey(q, r)) ? t(seaDist.get(G.hexKey(q, r))) : null)),
        partitions,
        cellCalls,
      },
      maxSeaInPart: maxSea, assigned, out: outA, mutantDiffers: differs ? 1 : 0,
    });
  };
  // (a) remisy FP: wszystkie heksy ladu graniczą z woda (max == 1), szum z wartosci o zwijajacej sie sumie
  for (const typ of TYPS) for (const tier of TIERS) for (const [w, rows] of [[24, 3], [30, 5], [40, 7]]) {
    const landRows = rows === 3 ? [1] : (rows === 5 ? [1, 3] : [1, 3, 5]);
    const spec = combSpec(w, rows, landRows);
    mkCase(`tie-fp ${typ}/${tier}/${w}x${rows}`, spec, typ, tier, null, 1, undefined,
      () => TIE_VALUES[ri2(0, TIE_VALUES.length - 1)]);
  }
  // (b) skladowe bez wody: czesc ladu BEZ wpisu w polu odleglosci (`?? 0`), reszta sd == 1 (max == 1);
  //     blok ladu oddzielony pustymi wierszami (brak heksow) - jedna partycja przez continentOf
  for (const tier of TIERS) for (const w of [20, 28]) for (const noise of ['random', 'tie']) {
    const spec = [...combSpec(w, 5, [1, 3])];
    for (let r = 8; r < 13; r++) for (let q = 0; q < w; q++) {
      spec.push([q, r, [TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza][(q * 2 + r) % 3], Nakladka.Brak, 0, 0]);
    }
    const continentOf = new Map(spec.map(([q, r]) => [G.hexKey(q, r), 0]));
    mkCase(`disconnected ${tier}/${w}/${noise}`, spec, 'kontynenty', tier, continentOf, 1, undefined,
      noise === 'tie' ? () => TIE_VALUES[ri2(0, TIE_VALUES.length - 1)] : () => rnd2());
  }
  // (c) kontrola: ta sama rodzina map, ale z max > 1 (grube wyspy) - sciezka bonusu aktywna w obu wersjach
  for (const tier of TIERS) {
    const spec = [];
    for (let r = 0; r < 12; r++) for (let q = 0; q < 24; q++) {
      const edge = q === 0 || r === 0 || q === 23 || r === 11;
      spec.push([q, r, edge ? TerenBazowy.Morze : [TerenBazowy.Laka, TerenBazowy.Rownina][(q + r) % 2], Nakladka.Brak, 0, 0]);
    }
    mkCase(`thick ${tier}`, spec, 'pangea', tier, null, 1, undefined, () => rnd2());
  }
}
stats.forestTie = {
  cases: cases.reapplyForestTie.length,
  maxSeaOne: cases.reapplyForestTie.filter((c) => c.maxSeaInPart === 1).length,
  mutantDiffers: cases.reapplyForestTie.filter((c) => c.mutantDiffers === 1).length,
  assignedTotal: cases.reapplyForestTie.reduce((a, c) => a + c.assigned, 0),
  casesWithForest: cases.reapplyForestTie.filter((c) => c.assigned > 0).length,
  differsAmongMaxOne: cases.reapplyForestTie.filter((c) => c.maxSeaInPart === 1 && c.mutantDiffers === 1).length,
  differsWhenMaxGt1: cases.reapplyForestTie.filter((c) => c.maxSeaInPart > 1 && c.mutantDiffers === 1).length,
};
if (stats.forestTie.differsAmongMaxOne < 10) {
  throw new Error('zbior ukierunkowany nie rozroznia mutacji inland: ' + JSON.stringify(stats.forestTie));
}
if (stats.forestTie.differsWhenMaxGt1 !== 0) {
  throw new Error('mutacja inland zmienia wynik przy max > 1 - to nie ten warunek: ' + JSON.stringify(stats.forestTie));
}

const result = {
  zrodlo: 'uruchomiony kod TS weba (gen-m04-vectors.mjs), pin edb8fb56',
  node: process.version,
  sha256: {
    'gen-helpers.ts': sha(original),
    'gen-helpers.ts+export': sha(copyText),
  },
  gen_helpers_lines: lineCount,
  private_exports: PRIVATE,
  enums: { tb: ALL_TB, nak: NAKS },
  stats,
  counts: Object.fromEntries(Object.entries(cases).map(([k, v]) => [k, Array.isArray(v) ? v.length : 1])),
  cases,
};
writeFileSync(out, JSON.stringify(result));
console.log('OK', JSON.stringify({ node: result.node, lines: lineCount, counts: result.counts, stats }));
