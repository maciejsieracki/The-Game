// Generator wektorow P6.M05B (relief B: pokrycie reliefu, bezpiecznik skupisk, pasma gorskie).
// URUCHAMIA prawdziwy kod TS weba (pin edb8fb56) z kopii gen-helpers.ts z dopisanym na koncu
// wierszem `export {...}` prywatnych deklaracji zakresu 2371-3185. Zadnej logiki nie przepisujemy.
// Uzycie:
//   node --experimental-transform-types --no-warnings --import ./m05a-loader-register.mjs \
//        ./gen-m05b-vectors.mjs <WEB_ROOT> <WYJSCIE.json>
// Wejscie mapy jest ZAPISYWANE w wektorze (nie regenerowane w Rust). Strumien rand = mulberry32(seed),
// seed zapisany w przypadku. Wynik: stan po wywolaniu + zwrot + NASTEPNA wartosc rand (dowod zuzycia).
import { createHash } from 'node:crypto';
import { cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m05b-vectors.mjs <WEB_ROOT> <WYJSCIE.json>');
  process.exit(2);
}
const mapDir = `${root}/gra/src/map`;

// ---------- kopia gen-helpers.ts z eksportami prywatnych deklaracji M05B ----------
const PRIVATE = [
  'MOUNTAIN_RANGE_LAND_SHARE_CAP', 'MAX_MOUNTAIN_RANGE_CLUSTER_SIZE', 'MOUNTAIN_RANGE_REGROW_MIN_GAP',
  'MOUNTAIN_RANGE_REGROW_TARGET_MULT', 'MOUNTAIN_RANGE_REGROW_LEN_MIN', 'MOUNTAIN_RANGE_REGROW_LEN_MAX',
  'findSameTerrainClusters', 'connectedComponentsWithin', 'capMountainRangeClusterSize',
  'mountainRangeSeedCandidates', 'walkMountainRange', 'bfsExpandExclusion', 'isExcludedForRegrow',
  'walkMountainRangeAvoiding', 'regrowLostMountainClusters', 'isDepositProtectedFromOverflowCap',
  'eligibleReliefLandCount', 'cellHasIronPackage', 'cellHasCopperPackage', 'ironCoverageCellSize',
  'copperCoverageCellSize', 'minLandHexesForReliefCell', 'minHighlandsCopperCell', 'minMountainsIronCell',
  'forceIronMountainsInCell', 'forceCopperHighlandsInCell', 'capIronCellReliefSpread',
  'ensureMassIronGridCoverage', 'ensureMassCopperGridCoverage',
  'parseHexKey', 'isReliefCandidateHex',
];
const original = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
const PRIVATE2 = PRIVATE.filter((n) => !new RegExp(`export\\s+(function|const|let|class)\\s+${n}\\b`).test(original));
const copyText = original + `\nexport { ${PRIVATE2.join(', ')} };\n`;
writeFileSync(`${mapDir}/gen-helpers.m05b-exports.ts`, copyText);

const G = await import(pathToFileURL(`${mapDir}/gen-helpers.m05b-exports.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const L = await import(pathToFileURL(`${root}/gra/src/data/map-gen-params-loader.ts`).href);
const { TerenBazowy, Nakladka } = H;

// ---------- pomocnicze ----------
const sha = (s) => createHash('sha256').update(s).digest('hex');
const f = (x) => (Object.is(x, -0) ? '-0' : String(x)); // f64 jako tekst
const TIERS = ['low', 'medium', 'high'];
const TERRAINS = [TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Pustynia, TerenBazowy.Wzgorza,
  TerenBazowy.Gory, TerenBazowy.Morze, TerenBazowy.PlytkieMorze];

let rngState = 20261029;
const rng = G.mulberry32(rngState);
const rnd = () => rng();
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));

// Mapa losowa: prostokat W x H, bloby lądu (losowy spacer), szum gor skwantowany lub ciagly.
function makeMap(W, H, landFrac, noiseMode, mtnShare, depositShare) {
  const keys = [];
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) keys.push(`${q},${r}`);
  const land = new Set();
  const target = Math.round(keys.length * landFrac);
  const seeds = Math.max(1, Math.round(keys.length / 120));
  const frontier = [];
  for (let i = 0; i < seeds; i++) {
    const k = keys[Math.floor(rnd() * keys.length)];
    land.add(k); frontier.push(k);
  }
  const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  let guard = 0;
  while (land.size < target && frontier.length && guard++ < keys.length * 50) {
    const idx = Math.floor(rnd() * frontier.length);
    const [q, r] = frontier[idx].split(',').map(Number);
    const [dq, dr] = DIRS[Math.floor(rnd() * DIRS.length)];
    const nq = q + dq;
    const nr = r + dr;
    if (nq >= 0 && nq < W && nr >= 0 && nr < H) {
      const nk = `${nq},${nr}`;
      if (!land.has(nk)) { land.add(nk); frontier.push(nk); }
    }
    if (rnd() < 0.02) frontier.splice(idx, 1);
  }
  const hexes = [];
  const scratch = [];
  for (const k of keys) {
    const isLand = land.has(k);
    let terr;
    let n;
    if (!isLand) {
      terr = rnd() < 0.85 ? TerenBazowy.Morze : TerenBazowy.PlytkieMorze;
      n = noiseMode === 'quant' ? Math.floor(rnd() * 12) / 12 : rnd();
    } else {
      const x = rnd();
      if (x < mtnShare) terr = TerenBazowy.Gory;
      else if (x < mtnShare * 1.6) terr = TerenBazowy.Wzgorza;
      else if (x < 0.9) terr = [TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Pustynia][ri(0, 2)];
      else terr = TerenBazowy.Morze;
      n = noiseMode === 'quant' ? Math.floor(rnd() * 12) / 12 : rnd();
    }
    const h = { coords: { q: Number(k.split(',')[0]), r: Number(k.split(',')[1]) }, terenBazowy: terr, nakladka: rnd() < 0.1 ? Nakladka.Las : Nakladka.Brak };
    if (isLand && rnd() < depositShare) h.zloze = 'rudy';
    hexes.push([k, h]);
    scratch.push([k, f(n)]);
  }
  return { width: W, height: H, hexes, scratch };
}

// Stan do zapisu / odczytu: lista [key, terenBazowy, nakladka, zlozePresent]
const dumpHexes = (hexes) => [...hexes.entries()].map(([k, h]) => [k, h.terenBazowy, h.nakladka, h.zloze ? 1 : 0]);
const dumpHexesArr = (arr) => arr.map(([k, h]) => [k, h.terenBazowy, h.nakladka, h.zloze ? 1 : 0]);
const buildHexes = (m) => {
  const hexes = {};
  for (const [k, h] of m.hexes) hexes[k] = { coords: { q: h.coords.q, r: h.coords.r }, terenBazowy: h.terenBazowy, nakladka: h.nakladka, ...(h.zloze ? { zloze: h.zloze } : {}) };
  return hexes;
};
const buildScratch = (m) => {
  const s = new Map();
  for (const [k, n] of m.scratch) s.set(k, { mtnNoise: Number(n) });
  return s;
};
const dumpState = (hexes) => Object.entries(hexes).map(([k, h]) => [k, h.terenBazowy, h.nakladka, h.zloze ? 1 : 0]);

const cases = { ensure: [], grow: [], safety: [], regrow: [], helpers: [], params: [] };

// --- przypadki pelnego przebiegu ---
const fullSpecs = [];
for (let i = 0; i < 40; i++) {
  const sizes = [[10, 8], [14, 11], [18, 14], [22, 16], [28, 20], [34, 26]];
  const [W, H] = sizes[i % sizes.length];
  const landFrac = [0.3, 0.45, 0.6, 0.75][i % 4];
  const mtnShare = [0.04, 0.12, 0.25, 0.4][(i >> 2) % 4];
  const noiseMode = i % 3 === 0 ? 'quant' : 'cont';
  const dep = [0, 0.1, 0.3][i % 3];
  const tier = TIERS[i % 3];
  fullSpecs.push({ W, H, landFrac, mtnShare, noiseMode, dep, tier, seed: ri(1, 4294967295) >>> 0 });
}

function runFull(kind, id, spec, m, tier, seed) {
  const hexes = buildHexes(m);
  const scratch = buildScratch(m);
  const rand = G.mulberry32(seed);
  const input = dumpState(hexes);
  let ret = null;
  if (kind === 'ensure') ret = G.ensureReliefGridCoverage(hexes, scratch, tier, m.width, m.height, 'pangea', null, 0, rand);
  else if (kind === 'grow') ret = G.growMountainRanges(hexes, scratch, tier, m.width, m.height, rand);
  else if (kind === 'safety') { G.capReliefClusterSizeSafetyNet(hexes, scratch); ret = 0; }
  const rngNext = f(rand());
  return { id, kind, tier, width: m.width, height: m.height, seed, spec, map: { hexes: dumpHexesArr(m.hexes), scratch: m.scratch }, input, output: { ret: f(ret), state: dumpState(hexes), rngNext } };
}

let idc = 0;
for (const sp of fullSpecs) {
  const m = makeMap(sp.W, sp.H, sp.landFrac, sp.noiseMode, sp.mtnShare, sp.dep);
  cases.ensure.push(runFull('ensure', `ensure-${idc++}`, sp, m, sp.tier, sp.seed));
  cases.grow.push(runFull('grow', `grow-${idc++}`, sp, m, sp.tier, sp.seed ^ 0x9e37));
}
// safety-net: mapy z duzymi skupiskami Gor/Wzgorz (przed i po przycinaniu)
for (let i = 0; i < 16; i++) {
  const sp = { W: [24, 30, 40][i % 3], H: [18, 22, 26][i % 3], landFrac: 0.7, mtnShare: [0.35, 0.5][i % 2], noiseMode: i % 2 ? 'quant' : 'cont', dep: [0, 0.25][i % 2], tier: TIERS[i % 3], seed: ri(1, 4294967295) >>> 0 };
  const m = makeMap(sp.W, sp.H, sp.landFrac, sp.noiseMode, sp.mtnShare, sp.dep);
  cases.safety.push(runFull('safety', `safety-${i}`, sp, m, sp.tier, sp.seed));
}

// --- przypadki pomocnicze (bezposrednio) ---
const massesOf = (hexes) => G.groupLandMassKeys(hexes);
let hid = 0;
for (let i = 0; i < 24; i++) {
  const sp = { W: [16, 22, 30][i % 3], H: [12, 16, 20][i % 3], landFrac: [0.5, 0.7][i % 2], mtnShare: [0.2, 0.35, 0.5][i % 3], noiseMode: i % 2 ? 'quant' : 'cont', dep: 0.1, tier: TIERS[i % 3], seed: ri(1, 4294967295) >>> 0 };
  const m = makeMap(sp.W, sp.H, sp.landFrac, sp.noiseMode, sp.mtnShare, sp.dep);
  const hexes = buildHexes(m);
  const scratch = buildScratch(m);
  const masses = massesOf(hexes).filter((x) => x.length >= 2);
  const mtnTh = L.mapGenMountainThreshold(sp.tier);
  const hiTh = L.mapGenHighlandThreshold(sp.tier);
  const deficit = ri(0, 40);
  const rand = G.mulberry32(sp.seed);
  const ret = G.regrowLostMountainClusters(hexes, scratch, m.width, m.height, rand, masses, mtnTh, hiTh, deficit);
  cases.regrow.push({ id: `regrow-${hid++}`, tier: sp.tier, width: m.width, height: m.height, seed: sp.seed, deficit, map: { hexes: dumpHexesArr(m.hexes), scratch: m.scratch }, masses, mtnTh: f(mtnTh), hiTh: f(hiTh), input: dumpState(buildHexes(m)), output: { ret: f(ret), state: dumpState(hexes), rngNext: f(rand()) } });
}

// helpers: pojedyncze funkcje
const TNAME = { gory: TerenBazowy.Gory, wzgorza: TerenBazowy.Wzgorza, laka: TerenBazowy.Laka, rownina: TerenBazowy.Rownina, pustynia: TerenBazowy.Pustynia, morze: TerenBazowy.Morze, plytkie_morze: TerenBazowy.PlytkieMorze };
for (let i = 0; i < 60; i++) {
  const sp = { W: [12, 18, 24][i % 3], H: [10, 14, 18][i % 3], landFrac: [0.5, 0.65, 0.8][i % 3], mtnShare: [0.15, 0.3, 0.45][i % 3], noiseMode: i % 2 ? 'quant' : 'cont', dep: 0.15, tier: TIERS[i % 3], seed: ri(1, 4294967295) >>> 0 };
  const m = makeMap(sp.W, sp.H, sp.landFrac, sp.noiseMode, sp.mtnShare, sp.dep);
  const hexes = buildHexes(m);
  const scratch = buildScratch(m);
  const keys = [...m.hexes.map(([k]) => k)];
  const mass = massesOf(hexes).sort((a, b) => b.length - a.length)[0] ?? [];
  const start = keys[Math.floor(rnd() * keys.length)];
  const steps = ri(1, 16);
  const rand = G.mulberry32(sp.seed);
  const h = {
    id: `helpers-${i}`, tier: sp.tier, width: m.width, height: m.height, seed: sp.seed,
    map: { hexes: dumpHexesArr(m.hexes), scratch: m.scratch }, input: dumpState(hexes),
  };
  const mtnTh = L.mapGenMountainThreshold(sp.tier);
  const hiTh = L.mapGenHighlandThreshold(sp.tier);
  const kind = i % 6;
  if (kind === 0) {
    const path = G.walkMountainRange(hexes, scratch, m.width, m.height, rand, start, steps);
    h.fn = 'walk'; h.args = { start, steps }; h.output = { path, state: dumpState(hexes), rngNext: f(rand()) };
  } else if (kind === 1) {
    const exG = new Set(); const exW = new Set();
    const ex = keys.filter((_, j) => j % 7 === 0);
    G.bfsExpandExclusion(hexes, exG, ex, 1);
    G.bfsExpandExclusion(hexes, exW, ex.slice(0, 3), 2);
    h.fn = 'bfs'; h.args = { sources: ex, minDist: 1, sourcesW: ex.slice(0, 3), minDistW: 2 };
    h.output = { excludedG: [...exG].sort(), excludedW: [...exW].sort(), state: dumpState(hexes) };
  } else if (kind === 2) {
    const exG = new Set(keys.filter((_, j) => j % 5 === 0));
    const exW = new Set(keys.filter((_, j) => j % 4 === 0));
    const path = G.walkMountainRangeAvoiding(hexes, scratch, m.width, m.height, rand, start, steps, mtnTh, hiTh, exG, exW);
    h.fn = 'walkAvoid'; h.args = { start, steps, mtnTh: f(mtnTh), hiTh: f(hiTh), exG: [...exG], exW: [...exW] };
    h.output = { path, state: dumpState(hexes), rngNext: f(rand()) };
  } else if (kind === 3) {
    const cands = G.mountainRangeSeedCandidates(mass, hexes, scratch, m.width, m.height, rand);
    h.fn = 'seeds'; h.args = { mass };
    h.output = { cands: cands.map((c) => [c.k, f(c.n)]), rngNext: f(rand()) };
  } else if (kind === 4) {
    const ter = [TerenBazowy.Gory, TerenBazowy.Wzgorza][i % 2];
    const clusters = G.findSameTerrainClusters(hexes, ter);
    const comps = clusters.length ? G.connectedComponentsWithin(new Set(clusters[0])) : [];
    h.fn = 'clusters'; h.args = { terrain: ter };
    h.output = { clusters, comps, state: dumpState(hexes) };
  } else {
    const ter = i % 2 ? TerenBazowy.Gory : TerenBazowy.Wzgorza;
    const maxSize = ri(2, 12);
    const rev = G.capMountainRangeClusterSize(hexes, scratch, ter, TerenBazowy.Rownina, maxSize);
    h.fn = 'capCluster'; h.args = { terrain: ter, maxSize };
    h.output = { ret: f(rev), state: dumpState(hexes) };
  }
  cases.helpers.push(h);
}

// --- parametry pasm: prawdziwy JSON + warianty uszkodzone (kopie drzewa gra/ w scratch) ---
for (const tier of TIERS) {
  cases.params.push({ id: `params-real-${tier}`, variant: 'real', tier, row: JSON.parse(readFileSync(`${root}/gra/data/map-gen-params.json`, "utf8")).gestosc.pasma_gorskie[tier], out: L.mapGenMountainRangeParams(tier) });
}
const VARIANTS = [
  { name: 'brak-wiersza', edit: (g) => { delete g.gestosc.pasma_gorskie.medium; } },
  { name: 'dlugosc-max-ponizej-min', edit: (g) => { g.gestosc.pasma_gorskie.medium.dlugosc_max = 3; } },
  { name: 'obrzeze-poza-zakresem', edit: (g) => { g.gestosc.pasma_gorskie.high.obrzeze_szansa = 1.5; g.gestosc.pasma_gorskie.low.obrzeze_szansa = -0.1; } },
  { name: 'zera-i-tekst', edit: (g) => { g.gestosc.pasma_gorskie.low.hexy_na_pasmo = 0; g.gestosc.pasma_gorskie.high.max_pasm_na_mase = 'x'; g.gestosc.pasma_gorskie.medium.min_masa_hexow = -1; } },
  { name: 'brak-sekcji', edit: (g) => { delete g.gestosc.pasma_gorskie; } },
];
const realJson = JSON.parse(readFileSync(`${root}/gra/data/map-gen-params.json`, 'utf8'));
const variantOut = [];
for (let vi = 0; vi < VARIANTS.length; vi++) {
  const v = VARIANTS[vi];
  const vr = `${root}-var-${vi}`;
  rmSync(vr, { recursive: true, force: true });
  cpSync(`${root}/gra`, `${vr}/gra`, { recursive: true });
  const g = JSON.parse(JSON.stringify(realJson));
  v.edit(g);
  writeFileSync(`${vr}/gra/data/map-gen-params.json`, JSON.stringify(g, null, 2));
  const LV = await import(pathToFileURL(`${vr}/gra/src/data/map-gen-params-loader.ts`).href);
  for (const tier of TIERS) {
    cases.params.push({ id: `params-${v.name}-${tier}`, variant: v.name, tier, row: g.gestosc?.pasma_gorskie?.[tier] ?? null, out: LV.mapGenMountainRangeParams(tier) });
  }
  variantOut.push(v.name);
  rmSync(vr, { recursive: true, force: true });
}

const stats = {
  ensure: cases.ensure.length, grow: cases.grow.length, safety: cases.safety.length,
  regrow: cases.regrow.length, helpers: cases.helpers.length, params: cases.params.length,
  growChanged: cases.grow.filter((c) => c.output.ret !== '0').length,
  ensureFixed: cases.ensure.filter((c) => c.output.ret !== '0').length,
  regrowRecovered: cases.regrow.filter((c) => c.output.ret !== '0').length,
  variants: variantOut,
};
const payload = { meta: { pin: 'edb8fb56', generator: 'gen-m05b-vectors.mjs', gen_helpers_lines: original.split('\n').length, gen_helpers_sha256: sha(original) }, stats, cases };
const text = JSON.stringify(payload);
writeFileSync(out, text);
console.log('OK', JSON.stringify(stats), 'bytes', text.length, 'sha256', sha(text));
