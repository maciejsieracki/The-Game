// Generator wektorow P6.M06A2 (lad/morze/wybrzeze A2, runda 1 - partia 1).
// URUCHAMIA prawdziwy kod TS weba (pin edb8fb56, gra/src/map/gen-helpers.ts) - zadnej logiki
// nie przepisujemy. Symbole partii 1: removeInlandWaterPools (:4137), fillEnclosedWaterByLandNeighbors
// (:4189), removeSmallInlandWaterPools (:4276), removeInlandSeaPools (:4320).
// Uzycie (z katalogu wektorow, poza repo nie trzeba):
//   node --experimental-transform-types --no-warnings --import ./m06a2-loader-register.mjs \
//        ./gen-m06a2-vectors.mjs <WEB_ROOT> <WYJSCIE.json>
// WEB_ROOT = katalog z `git archive edb8fb56 gra/src gra/data` rozpakowany POZA repo.
// Format mapy: [klucz, terrainRust, nakladkaRaw, zloze0/1, rzekaObecna0/1, rzekaKrawedzieN].
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m06a2-vectors.mjs <WEB_ROOT> <WYJSCIE.json>');
  process.exit(2);
}
const mapDir = `${root}/gra/src/map`;
const gen = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
const G = await import(pathToFileURL(`${mapDir}/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy, Nakladka } = H;
const sha = (s) => createHash('sha256').update(s).digest('hex');

const TB_TO_RUST = {
  [TerenBazowy.Laka]: 'Laka',
  [TerenBazowy.Rownina]: 'Rownina',
  [TerenBazowy.Wzgorza]: 'Wzgorza',
  [TerenBazowy.Gory]: 'Gory',
  [TerenBazowy.PlytkieMorze]: 'PlytkieMorze',
  [TerenBazowy.Morze]: 'Morze',
  [TerenBazowy.Pustynia]: 'Pustynia',
  [TerenBazowy.Polarny]: 'Polarny',
};
const RUST_TB = Object.keys(TB_TO_RUST);

function mkHex(tb, nak = Nakladka.Brak, zloze = 0, rzeka = 0) {
  const hex = { terenBazowy: tb, nakladka: nak, rzeka: { obecna: !!rzeka, krawedzie: rzeka ? [0] : [] } };
  if (zloze) hex.zloze = { typ: 'zloze_rudy' };
  return hex;
}
function buildMap(entries) {
  const hexes = {};
  for (const [q, r, tb, nak, zloze, rzeka] of entries) hexes[`${q},${r}`] = mkHex(tb, nak, zloze, rzeka);
  return hexes;
}
function dumpMap(hexes) {
  return Object.entries(hexes).map(([k, h]) => [
    k,
    TB_TO_RUST[h.terenBazowy] ?? `??${h.terenBazowy}`,
    h.nakladka,
    h.zloze !== undefined ? 1 : 0,
    h.rzeka?.obecna ? 1 : 0,
    h.rzeka?.krawedzie?.length ?? 0,
  ]);
}

// ---------- losowanie (mulberry32 z gen-helpers) ----------
let seed = 20261029;
const rng = G.mulberry32(seed);
const rnd = () => rng();
function weightedPick(weights) {
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let x = rnd() * total;
  for (const [tb, w] of weights) {
    if (x < w) return tb;
    x -= w;
  }
  return weights[weights.length - 1][0];
}
const NAK_VALUES = Object.values(Nakladka);
const pickNak = () => NAK_VALUES[Math.floor(rnd() * NAK_VALUES.length)];
const W_MIXED = [
  [TerenBazowy.Laka, 3], [TerenBazowy.Rownina, 3], [TerenBazowy.Wzgorza, 1], [TerenBazowy.Gory, 1],
  [TerenBazowy.Pustynia, 1], [TerenBazowy.Polarny, 1], [TerenBazowy.PlytkieMorze, 2], [TerenBazowy.Morze, 3],
];
const W_WATER = [[TerenBazowy.Morze, 4], [TerenBazowy.PlytkieMorze, 3], [TerenBazowy.Laka, 1]];
const W_LAND = [[TerenBazowy.Laka, 4], [TerenBazowy.Rownina, 2], [TerenBazowy.Gory, 1], [TerenBazowy.Morze, 1]];

// Losowa mapa prostokatna W x H z dziurami, kluczami poza prostokatem i nakladkami/zlozami/rzekami.
function randomMap(W, H, holeP, strayP, weights) {
  const hexes = {};
  for (let r = 0; r < H; r++) {
    for (let q = 0; q < W; q++) {
      if (rnd() < holeP) continue;
      const tb = weightedPick(weights);
      const nak = rnd() < 0.2 ? pickNak() : Nakladka.Brak;
      hexes[`${q},${r}`] = mkHex(tb, nak, rnd() < 0.15 ? 1 : 0, rnd() < 0.1 ? 1 : 0);
    }
  }
  if (rnd() < strayP) {
    hexes[`${W + 1},-1`] = mkHex(weightedPick(weights));
    hexes[`${-1},${H}`] = mkHex(weightedPick(weights));
  }
  return hexes;
}

// Prosta mapa ze wszystkich Laka + blob wody o zadanym rozmiarze w srodku (dla progow rozmiaru).
// Kolejnosc wstawiania: najpierw ziemia (wiersze), potem woda.
function blobMap(W, H, blob, shallowEvery = 0) {
  const hexes = {};
  const cells = new Set(blob.map(([q, r]) => `${q},${r}`));
  for (let r = 0; r < H; r++) {
    for (let q = 0; q < W; q++) {
      const k = `${q},${r}`;
      if (cells.has(k)) continue;
      hexes[k] = mkHex(TerenBazowy.Laka);
    }
  }
  blob.forEach(([q, r], i) => {
    const tb = shallowEvery > 0 && i % shallowEvery === 0 ? TerenBazowy.PlytkieMorze : TerenBazowy.Morze;
    hexes[`${q},${r}`] = mkHex(tb, Nakladka.Brak, i % 2, 0);
  });
  return hexes;
}

const cases = {
  remove_inland_water_pools: [],
  fill_enclosed_water: [],
  remove_small_inland_water_pools: [],
  remove_inland_sea_pools: [],
};
const stats = { fill_ladder: 0, pool_size_boundary: 0, random: 0 };
const boundary = { fill_rel: {}, pool_rel: {} };
const bumpRel = (table, rel) => {
  const k = String(rel);
  table[k] = (table[k] ?? 0) + 1;
};

// ---------- 1. removeInlandWaterPools (:4137) ----------
function runRemoveInland(name, hexesIn, W, H) {
  const hexes = structuredClone(hexesIn);
  const before = dumpMap(hexesIn);
  const n = G.removeInlandWaterPools(hexes, W, H);
  cases.remove_inland_water_pools.push({ name, w: W, h: H, input: before, out: n, output: dumpMap(hexes) });
}

// ---------- 2. fillEnclosedWaterByLandNeighbors (:4189), prog minLandNeighbors ----------
function runFill(name, hexesIn, minLand, rel) {
  const hexes = structuredClone(hexesIn);
  const before = dumpMap(hexesIn);
  const n = G.fillEnclosedWaterByLandNeighbors(hexes, minLand);
  cases.fill_enclosed_water.push({ name, min_land: minLand, boundary_rel: rel, input: before, out: n, output: dumpMap(hexes) });
}

// ---------- 3. removeSmallInlandWaterPools (:4276), prog maxPoolSize ----------
function runSmall(name, hexesIn, W, H, maxPool, rel) {
  const hexes = structuredClone(hexesIn);
  const before = dumpMap(hexesIn);
  const n = G.removeSmallInlandWaterPools(hexes, W, H, maxPool);
  cases.remove_small_inland_water_pools.push({
    name, w: W, h: H, max_pool: maxPool, boundary_rel: rel, input: before, out: n, output: dumpMap(hexes),
  });
}

// ---------- 4. removeInlandSeaPools (:4320) ----------
function runSeaPools(name, hexesIn, W, H) {
  const hexes = structuredClone(hexesIn);
  const before = dumpMap(hexesIn);
  const n = G.removeInlandSeaPools(hexes, W, H);
  cases.remove_inland_sea_pools.push({ name, w: W, h: H, input: before, out: n, output: dumpMap(hexes) });
}

// ---- Mapy specjalne ----
const W9 = 9;
// Ladder progowa: srodek Morze (0,0) w pelnej mapie 3x3 swiata; k sasiadow ladowych w kolejnosci HEX_DIRECTIONS,
// pozostali sasiedzi NIE istnieja (brak klucza) -> dokladnie k lądu w liczniku.
const DIRS = G.HEX_DIRECTIONS;
for (let k = 0; k <= DIRS.length; k++) {
  const entries = [[0, 0, TerenBazowy.Morze, Nakladka.Brak, 0, 0]];
  for (let i = 0; i < k; i++) {
    const [dq, dr] = DIRS[i];
    entries.push([dq, dr, TerenBazowy.Laka, Nakladka.Brak, 0, 0]);
  }
  const hexes = buildMap(entries);
  for (const min of [0, 1, 2, 3, 4, 5, 6, 7]) {
    stats.fill_ladder++;
    const rel = k - min;
    bumpRel(boundary.fill_rel, Math.max(-2, Math.min(2, rel)));
    runFill(`fill_ladder_k${k}_min${min}`, hexes, min, rel);
  }
}

// Blob wody w srodku lądu: rozmiar s, progi maxPool = s-1, s, s+1 (N-1/N/N+1).
for (let s = 1; s <= 8; s++) {
  const blob = Array.from({ length: s }, (_, i) => [5 + i, 10]);
  const hexes = blobMap(20, 20, blob, 0);
  for (const max of [s - 1, s, s + 1]) {
    stats.pool_size_boundary++;
    bumpRel(boundary.pool_rel, max - s);
    runSmall(`pool_size${s}_max${max}`, hexes, 20, 20, max, max - s);
    runRemoveInland(`pool_size${s}_inland`, hexes, 20, 20);
  }
  runSeaPools(`pool_size${s}_sea`, hexes, 20, 20);
}
// Blob z plytkim wybrzezem (mieszany) i blob przy krawedzi (lacza sie z oceanem - nie sa inlandowe).
{
  const blob = [[5, 10], [6, 10], [7, 10], [6, 9]];
  const hexes = blobMap(20, 20, blob, 2);
  runSmall('mixed_shallow_pool', hexes, 20, 20, 4, 0);
  runRemoveInland('mixed_shallow_pool', hexes, 20, 20);
}
{
  // Morze przy krawedzi mapy (ocean) obok wewnetrznego blobu - ocean nie moze byc usuniety.
  const hexes = blobMap(20, 20, [[0, 5], [1, 5], [5, 10], [6, 10]], 0);
  runSmall('edge_ocean_plus_pool', hexes, 20, 20, 2, 0);
  runRemoveInland('edge_ocean_plus_pool', hexes, 20, 20);
  runSeaPools('edge_ocean_plus_pool', hexes, 20, 20);
}
// Woda rozdzielona przekątna: dwa blob-y stykajace sie tylko po skosie (nie sa jednym komponentem).
{
  const hexes = blobMap(20, 20, [[5, 10], [6, 11]], 0);
  runSmall('diagonal_two_pools', hexes, 20, 20, 1, 0);
  runSmall('diagonal_two_pools_max2', hexes, 20, 20, 2, 0);
  runRemoveInland('diagonal_two_pools', hexes, 20, 20);
}
// Pusta mapa, mapa bez wody, pojedyncza woda w rogu (ocean).
runSmall('empty', {}, 3, 3, 3, 0);
runRemoveInland('empty', {}, 3, 3);
runFill('empty', {}, 5, 0);
runSeaPools('empty', {}, 3, 3);
{
  const hexes = buildMap([[0, 0, TerenBazowy.Morze, Nakladka.Las, 1, 1]]);
  runRemoveInland('single_corner_ocean', hexes, 3, 3);
  runSmall('single_corner_ocean', hexes, 3, 3, 1, 0);
  runSeaPools('single_corner_ocean', hexes, 3, 3);
}

// ---- Mapy losowe ----
const seeds = [];
for (let i = 0; i < 60; i++) {
  const W = 3 + Math.floor(rnd() * 8);
  const H = 3 + Math.floor(rnd() * 8);
  const weights = i % 3 === 0 ? W_MIXED : i % 3 === 1 ? W_WATER : W_LAND;
  const hexes = randomMap(W, H, 0.08, 0.3, weights);
  seeds.push(hexes);
  stats.random++;
  runRemoveInland(`rand${i}`, hexes, W, H);
  runSeaPools(`rand${i}`, hexes, W, H);
  const min = 3 + Math.floor(rnd() * 4);
  runFill(`rand${i}_min${min}`, hexes, min, null);
  const maxPool = 1 + Math.floor(rnd() * 8);
  runSmall(`rand${i}_max${maxPool}`, hexes, W, H, maxPool, null);
}

const webSha = sha(gen);
const doc = {
  meta: {
    generator: 'gen-m06a2-vectors.mjs',
    pin: 'edb8fb56',
    seed: 20261029,
    gen_helpers_sha256: webSha,
    symbols: ['removeInlandWaterPools', 'fillEnclosedWaterByLandNeighbors', 'removeSmallInlandWaterPools', 'removeInlandSeaPools'],
    terrain_map: TB_TO_RUST,
    rust_terrains: RUST_TB,
  },
  counts: Object.fromEntries(Object.entries(cases).map(([k, v]) => [k, v.length])),
  stats,
  boundary_hits: boundary,
  cases,
};
writeFileSync(out, JSON.stringify(doc));
console.log(JSON.stringify({ counts: doc.counts, stats, boundary_hits: boundary, sha: webSha }));
