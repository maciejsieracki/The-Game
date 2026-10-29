// Generator wektorow P6.M06A4 runda 3 (partia 3): morseDepthFromMapBorder (web :4659),
// trimEnclosedOceanOnly (:4701), purgeInlandWaterForMultiLandTyp (:4215).
// URUCHAMIA prawdziwy kod TS weba (pin edb8fb56, gra/src/map/gen-helpers.ts) - logiki nie przepisujemy.
// Wszystkie trzy symbole sa eksportowane w pinie (bez instrumentacji).
//
// Uzycie (loader: m06a-loader-register.mjs obok tego pliku):
//   node --experimental-transform-types --no-warnings --import ./m06a-loader-register.mjs \
//        ./gen-m06a4-trim-vectors.mjs <WEB_ROOT> <WYJSCIE.json>
// WEB_ROOT = katalog z `git archive edb8fb56 gra/src gra/data` rozpakowany POZA repo.
// Format mapy: [klucz, terrainRust, nakladkaRaw, zloze0/1, rzekaObecna0/1, rzekaKrawedzieN] (jak M06A4 purge).
// Format wyniku BFS: [klucz, odleglosc] w kolejnosci wstawiania Map (web).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m06a4-trim-vectors.mjs <WEB_ROOT> <WYJSCIE.json>');
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
const DIRS = G.HEX_DIRECTIONS;

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

const rng = G.mulberry32(20261030);
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

const cases = { morse_depth_from_map_border: [], trim_enclosed_ocean_only: [], purge_inland_water_for_multi_land_typ: [] };
const stats = { cases: 0, random_cases: 0, boundary_cases: 0, edge_cases: 0, trim_changed: 0, purge_changed: 0, morse_reached: 0 };
// Pokrycie progow (rodzina brzegowa): klucz "fill_d<d>_<pos>_<wynik>".
// wynik: `f5` = srodek zamieniony juz przez fill(5) na kopii wejsciowej, `later` = zamieniony dopiero w dalszych
// krokach purgeInland (fill(4), removeInlandWaterPools), `nop` = pozostal woda.
const coverage = {};
const bump = (k) => {
  coverage[k] = (coverage[k] ?? 0) + 1;
};

function runAll(name, W, H, hexesIn, family = 'random') {
  const input = dumpMap(hexesIn);
  // 1. morseDepthFromMapBorder: sprawdzane na kopii (funkcja nie modyfikuje mapy).
  const dist = G.morseDepthFromMapBorder(structuredClone(hexesIn), W, H);
  cases.morse_depth_from_map_border.push({ name, w: W, h: H, input, dist: [...dist.entries()] });
  stats.morse_reached += dist.size;

  // 2. trimEnclosedOceanOnly.
  const ht = structuredClone(hexesIn);
  const nt = G.trimEnclosedOceanOnly(ht, W, H);
  cases.trim_enclosed_ocean_only.push({ name, w: W, h: H, input, out: nt, output: dumpMap(ht) });
  if (nt > 0) stats.trim_changed++;

  // 3. purgeInlandWaterForMultiLandTyp (bez kluczy niekanonicznych: Z-1 - fill* w webie je przetwarza).
  const hp = structuredClone(hexesIn);
  const np = G.purgeInlandWaterForMultiLandTyp(hp, W, H);
  cases.purge_inland_water_for_multi_land_typ.push({ name, w: W, h: H, input, out: np, output: dumpMap(hp) });
  if (np > 0) stats.purge_changed++;

  stats.cases++;
  if (family === 'random') stats.random_cases++;
  else if (family === 'boundary') stats.boundary_cases++;
  else stats.edge_cases++;
}

// 1. Losowe mapy: wagi mieszane (lad, gory, pustynia, polarny, woda) oraz jeziorne (przewaga morza).
for (const [W, H] of [[5, 6], [9, 14], [12, 30], [16, 25], [7, 61]]) {
  for (let i = 0; i < 4; i++) {
    runAll(`rnd_mix_${W}x${H}_${i}`, W, H, gridMap(W, H, W_MIX, i % 2 === 0 ? 0 : 0.15));
  }
  for (let i = 0; i < 4; i++) {
    runAll(`rnd_lake_${W}x${H}_${i}`, W, H, gridMap(W, H, W_LAKES, i % 2 === 0 ? 0 : 0.1));
  }
}

// 2. Rodzina brzegowa (granice progow 4 i 5 dla `countLandNeighbors < minLand`):
//    srodek = Morze, d sasiadow Laka (suchy ląd), reszta sasiadow Morze (lub Plytkie Morze), tlo Laka.
//    Pozycje srodka: wnetrze (4,4), przy krawedzi (1,4), na krawedzi (0,4). d = 0..6 (N-1/N/N+1 dla 4 i 5).
const posList = [
  ['in', 4, 4],
  ['near', 1, 4],
  ['border', 0, 4],
];
for (const [pos, cq, cr] of posList) {
  for (let d = 0; d <= 6; d++) {
    for (const waterTb of [TerenBazowy.Morze, TerenBazowy.PlytkieMorze]) {
      const hexes = {};
      for (let r = 0; r < 9; r++) for (let q = 0; q < 9; q++) hexes[`${q},${r}`] = mkHex(TerenBazowy.Laka);
      hexes[`${cq},${cr}`] = mkHex(TerenBazowy.Morze);
      DIRS.forEach(([dq, dr], i) => {
        const key = `${cq + dq},${cr + dr}`;
        if (hexes[key] === undefined) return;
        if (i >= d) hexes[key] = mkHex(waterTb, rnd() < 0.2 ? pickNak() : Nakladka.Brak, rnd() < 0.3 ? 1 : 0, 0);
      });
      const name = `brzeg_${pos}_d${d}_${waterTb === TerenBazowy.Morze ? 'M' : 'P'}`;
      runAll(name, 9, 9, hexes, 'boundary');
      // Pokrycie: wynik srodka po obu fazach (wyliczony na kopii, zgodnie z webem).
      const hp = structuredClone(hexes);
      G.purgeInlandWaterForMultiLandTyp(hp, 9, 9);
      const outC = dumpMap(hp).find(([k]) => k === `${cq},${cr}`)[1];
      const after5 = structuredClone(hexes);
      G.fillEnclosedWaterByLandNeighbors(after5, 5);
      const c5 = dumpMap(after5).find(([k]) => k === `${cq},${cr}`)[1];
      const cls = c5 === 'Laka' ? 'f5' : outC === 'Laka' ? 'later' : 'nop';
      bump(`fill_d${d}_${pos}_${cls}`);
    }
  }
}

// 3. Kierunki polaczenia z oceanem (trim): morze przy krawedzi laczone pojedynczym sasiadem z kazdego z 6 kierunkow.
for (let i = 0; i < DIRS.length; i++) {
  for (const linked of [true, false]) {
    const hexes = {};
    for (let r = 0; r < 7; r++) for (let q = 0; q < 7; q++) hexes[`${q},${r}`] = mkHex(TerenBazowy.Laka);
    // Morze przy krawedzi (0,3) i pojedynczy kanal (2,3) przez sasiada w kierunku i od (1,3) lub odlaczony.
    hexes['0,3'] = mkHex(TerenBazowy.Morze);
    const [dq, dr] = DIRS[i];
    const mid = { q: 1 + 0, r: 3 };
    hexes[`${mid.q},${mid.r}`] = mkHex(TerenBazowy.Morze);
    const far = `${3 + dq},${3 + dr}`;
    if (linked) hexes[`${3 + dq},${3 + dr}`] = mkHex(TerenBazowy.Morze);
    hexes[`3,3`] = mkHex(TerenBazowy.Morze);
    if (linked) {
      // Kanal: (1,3) -> (3,3) przez (2,3), a od (3,3) do krawedzi nie ma polaczenia poza kierunkiem i.
      hexes['2,3'] = mkHex(TerenBazowy.Morze);
    }
    if (!linked) delete hexes[far];
    runAll(`kierunek_${i}_${linked ? 'polaczony' : 'odlaczony'}`, 7, 7, hexes, 'boundary');
  }
}

// 4. Brzegi i przypadki zdegenerowane.
runAll('edge_empty', 4, 4, {}, 'edge');
runAll('edge_all_sea', 5, 9, gridMap(5, 9, [[TerenBazowy.Morze, 1]]), 'edge');
runAll('edge_all_land', 5, 9, gridMap(5, 9, [[TerenBazowy.Laka, 1]]), 'edge');
runAll('edge_height_1', 3, 1, gridMap(3, 1, [[TerenBazowy.Morze, 1]]), 'edge');
runAll('edge_width_1', 1, 6, gridMap(1, 6, W_LAKES), 'edge');
// Klucze spoza prostokata (poprawny format "q,r"): morze poza mapa przyleglie do krawedzi.
runAll('edge_stray_keys', 4, 6, { ...gridMap(4, 6, W_LAKES, 0.1), '-1,2': mkHex(TerenBazowy.Morze), '4,-1': mkHex(TerenBazowy.Morze) }, 'edge');
// Klucz niekanoniczny (3 skladowe): tylko trim/morse (purge: Z-1, rozbieznosc swiadoma, nie w wektorach).
{
  const hexes = gridMap(4, 4, [[TerenBazowy.Laka, 1]]);
  hexes['1,2,5'] = mkHex(TerenBazowy.Morze);
  const input = dumpMap(hexes);
  const dist = G.morseDepthFromMapBorder(structuredClone(hexes), 4, 4);
  cases.morse_depth_from_map_border.push({ name: 'edge_noncanonical_key', w: 4, h: 4, input, dist: [...dist.entries()] });
  const ht = structuredClone(hexes);
  const nt = G.trimEnclosedOceanOnly(ht, 4, 4);
  cases.trim_enclosed_ocean_only.push({ name: 'edge_noncanonical_key', w: 4, h: 4, input, out: nt, output: dumpMap(ht) });
  stats.cases++;
  stats.edge_cases++;
}

const doc = {
  meta: {
    generator: 'gen-m06a4-trim-vectors.mjs',
    pin: 'edb8fb56',
    seed: 20261030,
    gen_helpers_sha256: sha(originalSrc),
    symbols: ['morseDepthFromMapBorder', 'trimEnclosedOceanOnly', 'purgeInlandWaterForMultiLandTyp'],
    terrain_map: TB_TO_RUST,
    rust_terrains: RUST_TB,
    coverage_key: 'fill_d<d>_<in|near|border>_<f5|later|nop>: d = liczba sasiadow Laka srodka Morze; f5 = zamieniony przez fill(5), later = zamieniony dalej w purgeInland, nop = pozostal woda',
  },
  counts: {
    morse_depth_from_map_border: cases.morse_depth_from_map_border.length,
    trim_enclosed_ocean_only: cases.trim_enclosed_ocean_only.length,
    purge_inland_water_for_multi_land_typ: cases.purge_inland_water_for_multi_land_typ.length,
  },
  stats,
  coverage,
  cases,
};
writeFileSync(out, JSON.stringify(doc));
console.log(JSON.stringify({ counts: doc.counts, stats, coverage_keys: Object.keys(coverage).length, sha: doc.meta.gen_helpers_sha256 }));
