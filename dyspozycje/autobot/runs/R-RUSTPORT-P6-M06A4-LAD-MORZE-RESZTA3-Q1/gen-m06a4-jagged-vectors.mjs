// Generator wektorow P6.M06A4 runda 3 (partia 3b): applyJaggedCoastNoise (web gen-helpers.ts :4232).
// URUCHAMIA prawdziwy kod TS weba (pin edb8fb56, gra/src/map/gen-helpers.ts) - logiki nie przepisujemy.
// Permutacja szumu: G.buildPermTable(G.mulberry32(seed)) (funkcja z weba, eksportowana w pinie).
// Pomiar graniczny (stats.near_threshold): liczba heksow, dla ktorych |coast - prog| < 0.01, liczona
// wzorem szumu z weba (G.fbm) tylko do raportu; nie wplywa na wektory ani na port.
//
// Uzycie (loader: m06a-loader-register.mjs obok tego pliku):
//   node --experimental-transform-types --no-warnings --import ./m06a-loader-register.mjs \
//        ./gen-m06a4-jagged-vectors.mjs <WEB_ROOT> <WYJSCIE.json>
// WEB_ROOT = katalog z `git archive edb8fb56 gra/src gra/data` rozpakowany POZA repo.
// Format mapy: [klucz, terrainRust, nakladkaRaw, zloze0/1, rzekaObecna0/1, rzekaKrawedzieN] (jak M06A4).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m06a4-jagged-vectors.mjs <WEB_ROOT> <WYJSCIE.json>');
  process.exit(2);
}
const mapDir = `${root}/gra/src/map`;
const originalSrc = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const G = await import(pathToFileURL(`${mapDir}/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy, Nakladka } = H;

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
const NAK_VALUES = Object.values(Nakladka);

function mkHex(tb, nak = Nakladka.Brak, zloze = 0, rzeka = 0) {
  const hex = { terenBazowy: tb, nakladka: nak, rzeka: { obecna: !!rzeka, krawedzie: rzeka ? [0] : [] } };
  if (zloze) hex.zloze = { typ: 'zloze_rudy' };
  return hex;
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

const rng = G.mulberry32(20261031);
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
const pickNak = () => NAK_VALUES[Math.floor(rnd() * NAK_VALUES.length)];
const W_MIX = [
  [TerenBazowy.Laka, 3], [TerenBazowy.Rownina, 2], [TerenBazowy.Wzgorza, 1], [TerenBazowy.Gory, 1],
  [TerenBazowy.Pustynia, 2], [TerenBazowy.Polarny, 1], [TerenBazowy.PlytkieMorze, 1], [TerenBazowy.Morze, 2],
];
const W_LAKES = [[TerenBazowy.Morze, 6], [TerenBazowy.PlytkieMorze, 1], [TerenBazowy.Laka, 2], [TerenBazowy.Gory, 1]];

function gridMap(W, H, weights, holeP = 0) {
  const hexes = {};
  for (let r = 0; r < H; r++) {
    for (let q = 0; q < W; q++) {
      if (holeP > 0 && rnd() < holeP) continue;
      const tb = weightedPick(weights);
      const nak = rnd() < 0.3 ? pickNak() : Nakladka.Brak;
      hexes[`${q},${r}`] = mkHex(tb, nak, rnd() < 0.3 ? 1 : 0, rnd() < 0.1 ? 1 : 0);
    }
  }
  return hexes;
}

// Parametry szumu (tylko raport granic; wartosci z webu, nie z JSON portu).
const NS = 0.28;
const stats = { cases: 0, changed_cases: 0, changed_hexes: 0, near_threshold: 0, hexes_evaluated: 0 };
const cases = { apply_jagged_coast_noise: [] };
const permSeeds = [20261031, 20261032, 20261033];

function runCase(name, W, H, hexesIn, perm, passes) {
  const input = dumpMap(hexesIn);
  const hexes = structuredClone(hexesIn);
  const n = G.applyJaggedCoastNoise(hexes, perm, W, H, passes);
  cases.apply_jagged_coast_noise.push({
    name,
    w: W,
    h: H,
    passes,
    perm: Array.from(perm),
    input,
    out: n,
    output: dumpMap(hexes),
  });
  stats.cases++;
  if (n > 0) {
    stats.changed_cases++;
    stats.changed_hexes += n;
  }
  // Raport: liczba ocen heksow (poza buforem) z wartoscia szumu blisko progow (|coast - prog| < 0.01).
  for (let pass = 0; pass < passes; pass++) {
    for (let r = 0; r < H; r++) {
      for (let q = 0; q < W; q++) {
        if (!hexesIn[`${q},${r}`]) continue;
        if (G.isInMapBorder(q, r, W, H)) continue;
        const coarse = G.fbm(perm, q * NS + pass * 17, r * NS + pass * 31, 4);
        const fine = G.fbm(perm, q * NS * 2.1 + 200, r * NS * 2.1 + 200, 3) * 0.35;
        const coast = coarse + fine;
        stats.hexes_evaluated++;
        if (Math.abs(coast - 0.68) < 0.01 || Math.abs(coast - 0.32) < 0.01) stats.near_threshold++;
      }
    }
  }
}

// 1. Mapy losowe (mieszane i jeziorne) x 3 perm; passes = 2. Dodatkowo perm 0 z passes 1 i 5.
const sizes = [[9, 9], [12, 14], [16, 25], [20, 30], [7, 5]];
for (const [W, H] of sizes) {
  for (const [kind, weights] of [['mix', W_MIX], ['lake', W_LAKES]]) {
    const map = gridMap(W, H, weights, kind === 'lake' ? 0.1 : 0);
    for (const seed of permSeeds) {
      const perm = G.buildPermTable(G.mulberry32(seed));
      runCase(`${kind}_${W}x${H}_s${seed}_p2`, W, H, map, perm, 2);
    }
    const perm0 = G.buildPermTable(G.mulberry32(permSeeds[0]));
    runCase(`${kind}_${W}x${H}_s${permSeeds[0]}_p1`, W, H, map, perm0, 1);
    runCase(`${kind}_${W}x${H}_s${permSeeds[0]}_p5`, W, H, map, perm0, 5);
  }
}

// 2. Brzegi: wszystkie krawedzie (bufor), mapa jednolita, dziury w siatce, 1 wiersz.
const permE = G.buildPermTable(G.mulberry32(permSeeds[1]));
runCase('edge_all_sea_6x6', 6, 6, gridMap(6, 6, [[TerenBazowy.Morze, 1]]), permE, 2);
runCase('edge_all_land_6x6', 6, 6, gridMap(6, 6, [[TerenBazowy.Laka, 1]]), permE, 2);
runCase('edge_holes_12x12', 12, 12, gridMap(12, 12, W_LAKES, 0.25), permE, 2);
runCase('edge_height_1', 8, 1, gridMap(8, 1, W_LAKES), permE, 2);
runCase('edge_empty', 4, 4, {}, permE, 2);

const doc = {
  meta: {
    generator: 'gen-m06a4-jagged-vectors.mjs',
    pin: 'edb8fb56',
    seed: 20261031,
    perm_seeds: permSeeds,
    gen_helpers_sha256: sha(originalSrc),
    symbols: ['applyJaggedCoastNoise'],
    terrain_map: TB_TO_RUST,
    rust_terrains: RUST_TB,
    perm_builder: 'G.buildPermTable(G.mulberry32(seed)) (web gen-helpers.ts)',
    thresholds: { erode_gt: 0.68, fill_lt: 0.32, noise_scale: NS },
  },
  counts: { apply_jagged_coast_noise: cases.apply_jagged_coast_noise.length },
  stats,
  cases,
};
writeFileSync(out, JSON.stringify(doc));
console.log(JSON.stringify({ counts: doc.counts, stats, sha: doc.meta.gen_helpers_sha256 }));
