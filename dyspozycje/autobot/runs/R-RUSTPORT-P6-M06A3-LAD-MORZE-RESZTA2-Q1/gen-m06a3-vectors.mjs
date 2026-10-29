// Generator wektorow P6.M06A3 (lad/morze/wybrzeze A3, runda 1 - partia 1).
// URUCHAMIA prawdziwy kod TS weba (pin edb8fb56, gra/src/map/gen-helpers.ts) - logiki nie przepisujemy.
// Symbole partii 1: enforceLatitudinalOceanBuffer (:3339), climateBandBaseTerrain (:3360, prywatna),
// applyClimateBandsToHexes (:3380), enforceEarthTemplateOnHexes (:3418).
//
// Prywatne symbol (climateBandBaseTerrain, hashInt3, setHexToMorze) NIE sa eksportowane w pinie.
// Generator tworzy OBOK oryginalu kopie `gen-helpers-m06a3-instr.ts` = oryginal + JEDNA linia
// `export { ... }` na koncu. Logika nie jest zmieniana; sha256 oryginalu jest zapisane w meta,
// a kopia jest tworzona tylko w drzewie `git archive edb8fb56` POZA repo.
//
// Uzycie (loader: m06a-loader-register.mjs obok tego pliku):
//   node --experimental-transform-types --no-warnings --import ./m06a-loader-register.mjs \
//        ./gen-m06a3-vectors.mjs <WEB_ROOT> <WYJSCIE.json>
// WEB_ROOT = katalog z `git archive edb8fb56 gra/src gra/data` rozpakowany POZA repo.
// Format mapy: [klucz, terrainRust, nakladkaRaw, zloze0/1, rzekaObecna0/1, rzekaKrawedzieN].
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m06a3-vectors.mjs <WEB_ROOT> <WYJSCIE.json>');
  process.exit(2);
}
const mapDir = `${root}/gra/src/map`;
const originalSrc = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const instrPath = `${mapDir}/gen-helpers-m06a3-instr.ts`;
const instrSrc = `${originalSrc}\nexport { climateBandBaseTerrain, setHexToMorze, hashInt3 };\n`;
writeFileSync(instrPath, instrSrc);
const G = await import(pathToFileURL(instrPath).href);
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

// ---------- losowanie (mulberry32 z gen-helpers, seed stalego) ----------
const rng = G.mulberry32(20261029);
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
const W_ALL = [
  [TerenBazowy.Laka, 3], [TerenBazowy.Rownina, 3], [TerenBazowy.Wzgorza, 1], [TerenBazowy.Gory, 1],
  [TerenBazowy.Pustynia, 2], [TerenBazowy.Polarny, 1], [TerenBazowy.PlytkieMorze, 1], [TerenBazowy.Morze, 1],
];
const W_LAND_ONLY = [
  [TerenBazowy.Laka, 3], [TerenBazowy.Rownina, 3], [TerenBazowy.Wzgorza, 1], [TerenBazowy.Gory, 1],
  [TerenBazowy.Pustynia, 2], [TerenBazowy.Polarny, 1],
];

// Pelny prostokat W x H, bez dziur, z losowym terenem, nakladkami, zlozami i rzekami.
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

const cases = {
  enforce_latitudinal_ocean_buffer: [],
  climate_band_base_terrain: [],
  apply_climate_bands_to_hexes: [],
  enforce_earth_template_on_hexes: [],
};
const stats = { buffer_cases: 0, climate_map_cases: 0, climate_point_cases: 0, earth_cases: 0 };
// Trafienia wzgledem granic: buffer (r - buf dla rzedow buf-1..buf i H-buf-1..H-buf), pasma (r wzgledem krawedzi pasma),
// progi hashInt3 (|hash - prog| < 0.01 dla 0.5/0.7/0.85).
const boundary = { buffer_rel: {}, band_edge_rel: {}, hash_near_threshold: {} };
const bump = (table, key) => {
  const k = String(key);
  table[k] = (table[k] ?? 0) + 1;
};

// ---------- 1. enforceLatitudinalOceanBuffer (:3339) ----------
function runBuffer(name, W, H, isEarth, hexesIn) {
  const hexes = structuredClone(hexesIn);
  const before = dumpMap(hexesIn);
  const buf = G.latitudinalOceanBufferRows(H, isEarth);
  for (const d of [buf - 1, buf, H - buf - 1, H - buf]) {
    // rzad d (relatywny do granicy bufora): rel = d - buf lub d - (H - buf)
    bump(boundary.buffer_rel, d < buf ? d - buf : d - (H - buf));
  }
  const n = G.enforceLatitudinalOceanBuffer(hexes, W, H, isEarth);
  cases.enforce_latitudinal_ocean_buffer.push({
    name, w: W, h: H, is_earth: isEarth, buf, input: before, out: n, output: dumpMap(hexes),
  });
  stats.buffer_cases++;
}
for (const H of [1, 2, 3, 4, 5, 6, 7, 8, 10, 13, 20, 33, 40]) {
  for (const W of [1, 3, 7]) {
    for (const isEarth of [false, true]) {
      // Pelny prostokat i wersja z dziurami (klucze poza mapa nie pojawiaja sie w wyniku).
      runBuffer(`buf_H${H}_W${W}_e${isEarth ? 1 : 0}`, W, H, isEarth, gridMap(W, H, W_ALL, 0));
      runBuffer(`buf_H${H}_W${W}_holes_e${isEarth ? 1 : 0}`, W, H, isEarth, gridMap(W, H, W_ALL, 0.2));
    }
  }
}
// Mapa bez kluczy (pusta) i mapa tylko z morzem (brak zmian).
runBuffer('buf_empty', 5, 9, false, {});
runBuffer('buf_all_sea', 5, 9, false, gridMap(5, 9, [[TerenBazowy.Morze, 1]]));

// ---------- 2. climateBandBaseTerrain (:3360, prywatna) - punkty (band, q, r, seed) ----------
const BANDS = ['polar_north', 'temperate_north', 'plains_north', 'desert', 'plains_south', 'temperate_south', 'polar_south'];
for (const band of BANDS) {
  for (let i = 0; i < 120; i++) {
    const q = Math.floor(rnd() * 200) - 20;
    const r = Math.floor(rnd() * 200) - 20;
    const seed = [0, 1, 42, 20261029, 987654, -7][i % 6];
    const hash = G.hashInt3(q, r, seed);
    const out = G.climateBandBaseTerrain(band, q, r, seed);
    stats.climate_point_cases++;
    for (const t of [0.5, 0.7, 0.85]) if (Math.abs(hash - t) < 0.01) bump(boundary.hash_near_threshold, t);
    cases.climate_band_base_terrain.push({ band, q, r, seed, hash, out: TB_TO_RUST[out] ?? `??${out}` });
  }
}
// Wartosci hash dla kilku punktow bazowych (dowod zgodnosci hashInt3 z web).
for (const [q, r, seed] of [[0, 0, 0], [1, 0, 0], [0, 1, 0], [3, 7, 42], [-1, -1, 5], [100, 50, 20261029]]) {
  cases.climate_band_base_terrain.push({
    band: 'hash_only', q, r, seed, hash: G.hashInt3(q, r, seed), out: '-',
  });
}

// ---------- 3. applyClimateBandsToHexes (:3380) ----------
function runClimate(name, W, H, seed, isEarth, hexesIn) {
  const hexes = structuredClone(hexesIn);
  const before = dumpMap(hexesIn);
  const n = G.applyClimateBandsToHexes(hexes, H, seed, isEarth);
  cases.apply_climate_bands_to_hexes.push({
    name, w: W, h: H, seed, is_earth: isEarth, input: before, out: n, output: dumpMap(hexes),
  });
  stats.climate_map_cases++;
}
for (const H of [8, 12, 20, 33, 40, 61]) {
  for (const isEarth of [false, true]) {
    for (const seed of [0, 1, 42, 20261029]) {
      // Bez dziur, pelna mapa mieszana; oraz mapa z lagodniejszym rozkladem (tylko ladowe).
      runClimate(`clim_H${H}_e${isEarth ? 1 : 0}_s${seed}`, 6, H, seed, isEarth, gridMap(6, H, W_ALL, 0));
      runClimate(`clim_land_H${H}_e${isEarth ? 1 : 0}_s${seed}`, 6, H, seed, isEarth, gridMap(6, H, W_LAND_ONLY, 0.1));
    }
  }
}
// Stan wejsciowy: Polarny z nakladka i zlozem; Pustynia z nakladka/zlozem (czyszczenie); Gory/Wzgorza nietkniete.
{
  const hexes = {};
  let k = 0;
  for (let r = 0; r < 30; r++) {
    for (let q = 0; q < 4; q++) {
      const tb = [TerenBazowy.Polarny, TerenBazowy.Pustynia, TerenBazowy.Gory, TerenBazowy.Wzgorza][k % 4];
      hexes[`${q},${r}`] = mkHex(tb, NAK_VALUES[k % NAK_VALUES.length], 1, k % 2);
      k++;
    }
  }
  runClimate('clim_overlay_clear', 4, 30, 20261029, false, hexes);
  runClimate('clim_overlay_clear_earth', 4, 30, 20261029, true, hexes);
}
// Mapy z dziurami i kluczami poza prostokatem (web nie waliduje zakresu).
runClimate('clim_stray_keys', 3, 10, 9, false, { ...gridMap(3, 10, W_LAND_ONLY, 0.3), '-1,4': mkHex(TerenBazowy.Laka), '3,-2': mkHex(TerenBazowy.Pustynia) });
runClimate('clim_empty', 3, 10, 9, false, {});

// Trafienia na granicach pasm: r w odleglosci 0/1 od krawedzi pasma (zmiana klimatu miedzy sasiednimi rzedami).
for (const H of [8, 12, 20, 33, 40, 61]) {
  for (const isEarth of [false, true]) {
    let prev = null;
    for (let r = 0; r < H; r++) {
      const band = G.climateBandAt(0, r, H, isEarth);
      if (prev !== null && band !== prev) {
        bump(boundary.band_edge_rel, -1);
        bump(boundary.band_edge_rel, 0);
      }
      prev = band;
    }
  }
}

// ---------- 4. enforceEarthTemplateOnHexes (:3418) ----------
function runEarth(name, W, H, hexesIn) {
  const hexes = structuredClone(hexesIn);
  const before = dumpMap(hexesIn);
  const n = G.enforceEarthTemplateOnHexes(hexes, W, H);
  cases.enforce_earth_template_on_hexes.push({ name, w: W, h: H, input: before, out: n, output: dumpMap(hexes) });
  stats.earth_cases++;
}
for (const [W, H] of [[10, 10], [20, 12], [30, 20], [40, 40], [5, 3]]) {
  runEarth(`earth_${W}x${H}`, W, H, gridMap(W, H, W_ALL, 0));
  runEarth(`earth_${W}x${H}_holes`, W, H, gridMap(W, H, W_ALL, 0.25));
}
runEarth('earth_empty', 8, 8, {});

const doc = {
  meta: {
    generator: 'gen-m06a3-vectors.mjs',
    pin: 'edb8fb56',
    seed: 20261029,
    gen_helpers_sha256_original: sha(originalSrc),
    gen_helpers_sha256_instrumented: sha(instrSrc),
    instrumentation: 'dopisany jeden wiersz export { climateBandBaseTerrain, setHexToMorze, hashInt3 } na koncu kopii',
    symbols: [
      'enforceLatitudinalOceanBuffer',
      'climateBandBaseTerrain',
      'applyClimateBandsToHexes',
      'enforceEarthTemplateOnHexes',
    ],
    terrain_map: TB_TO_RUST,
    rust_terrains: RUST_TB,
  },
  counts: Object.fromEntries(Object.entries(cases).map(([k, v]) => [k, v.length])),
  stats,
  boundary_hits: boundary,
  cases,
};
writeFileSync(out, JSON.stringify(doc));
console.log(JSON.stringify({ counts: doc.counts, stats, boundary_hits: boundary, sha: doc.meta.gen_helpers_sha256_original }));
