// Generator wektorow P6.M06A (lad/morze/wybrzeze A) - RUNDA 1 (podzbior symboli zakresu).
// URUCHAMIA prawdziwy kod TS weba (pin edb8fb56) z kopii gen-helpers.ts z dopisanym na koncu
// wierszem `export {...}` prywatnych deklaracji zakresu 3186-4374. Zadnej logiki nie przepisujemy.
// Uzycie:
//   node --experimental-transform-types --no-warnings --import ./m06a-loader-register.mjs \
//        ./gen-m06a-vectors.mjs <WEB_ROOT> <WYJSCIE.json>
// Wejscie mapy jest ZAPISYWANE w wektorze. Strumien losowy = mulberry32(seed) z gen-helpers.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m06a-vectors.mjs <WEB_ROOT> <WYJSCIE.json>');
  process.exit(2);
}
const mapDir = `${root}/gra/src/map`;

// ---------- kopia gen-helpers.ts z eksportami prywatnych deklaracji M06A (runda 1) ----------
const PRIVATE = [
  'erodeTerrainRank', 'countMorseNeighbors', 'countLandNeighbors', 'isCoastalLandHex',
  'isCoastalMorseHex', 'oceanConnectedMorseKeys', 'parseHexKey', 'isWaterTerrainLocal',
  'ERODE_TERRAIN_ORDER', 'setHexToMorze', 'setHexToLaka',
];
const original = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
const PRIVATE2 = PRIVATE.filter((n) => !new RegExp(`export\\s+(function|const|let|class)\\s+${n}\\b`).test(original));
const copyText = original + `\nexport { ${PRIVATE2.join(', ')} };\n`;
writeFileSync(`${mapDir}/gen-helpers.m06a-exports.ts`, copyText);

const G = await import(pathToFileURL(`${mapDir}/gen-helpers.m06a-exports.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy, Nakladka } = H;

const sha = (s) => createHash('sha256').update(s).digest('hex');

// Mapowanie wartosci TS (TerenBazowy/Nakladka) na nazwy serde Rust (Terrain / Nakladka::from_key).
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
const TB_FROM_RUST = Object.fromEntries(Object.entries(TB_TO_RUST).map(([k, v]) => [v, k]));

// ---------- budowa mapy (klucze "q,r" w kolejnosci wstawiania, jak w grze) ----------
function mkHex(tb, nak = Nakladka.Brak, zloze = 0, rzeka = 0) {
  const hex = { terenBazowy: tb, nakladka: nak, rzeka: { obecna: !!rzeka, krawedzie: rzeka ? [0] : [] } };
  if (zloze) hex.zloze = { typ: 'zloze_rudy' };
  return hex;
}
// entries: [[q, r, tb, nak, zloze, rzeka]]
function buildMap(entries) {
  const hexes = {};
  for (const [q, r, tb, nak, zloze, rzeka] of entries) hexes[`${q},${r}`] = mkHex(tb, nak, zloze, rzeka);
  return hexes;
}
// Zrzut mapy do formatu wektora: [klucz, terrainRust, nakladkaKey, zloze0/1, rzeka0/1]
function dumpMap(hexes) {
  return Object.entries(hexes).map(([k, h]) => [
    k,
    TB_TO_RUST[h.terenBazowy] ?? `??${h.terenBazowy}`,
    h.nakladka,
    h.zloze !== undefined ? 1 : 0,
    h.rzeka?.obecna ? 1 : 0,
  ]);
}
function cloneMap(hexes) {
  return structuredClone(hexes);
}

// Losowa mapa z dziurami (brakujace klucze), kluczami poza prostokatem i wagami terenow.
let seed = 20261029;
const rng = G.mulberry32(seed);
const rnd = () => rng();
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
function randomMap(W, H, holeP, strayP, weights) {
  const entries = [];
  for (let r = 0; r < H; r++) {
    for (let q = 0; q < W; q++) {
      if (rnd() < holeP) continue;
      entries.push([q, r, weightedPick(weights)]);
    }
  }
  if (rnd() < strayP) {
    entries.push([W + 1, -1, weightedPick(weights)]);
    entries.push([-1, H, weightedPick(weights)]);
  }
  return buildMap(entries.map(([q, r, tb]) => [q, r, tb, Nakladka.Brak, 0, 0]));
}
function weightedPick(weights) {
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let x = rnd() * total;
  for (const [tb, w] of weights) {
    if (x < w) return tb;
    x -= w;
  }
  return weights[weights.length - 1][0];
}
const W_MIXED = [
  [TerenBazowy.Laka, 3], [TerenBazowy.Rownina, 3], [TerenBazowy.Wzgorza, 1], [TerenBazowy.Gory, 1],
  [TerenBazowy.Pustynia, 1], [TerenBazowy.Polarny, 1], [TerenBazowy.PlytkieMorze, 2], [TerenBazowy.Morze, 3],
];
const W_WATER = [[TerenBazowy.Morze, 4], [TerenBazowy.PlytkieMorze, 3], [TerenBazowy.Laka, 1]];
const W_LAND = [[TerenBazowy.Laka, 3], [TerenBazowy.Rownina, 2], [TerenBazowy.Gory, 1], [TerenBazowy.Morze, 1]];
const W_COAST = [[TerenBazowy.PlytkieMorze, 3], [TerenBazowy.Morze, 3], [TerenBazowy.Laka, 2], [TerenBazowy.Rownina, 1]];

// ---------- mapy specjalne (brzeg, progi, dziury, pojedyncze heksy) ----------
const SPECIAL = {
  empty: () => ({}),
  single_sea: () => buildMap([[0, 0, TerenBazowy.Morze, Nakladka.Brak, 0, 0]]),
  single_shallow: () => buildMap([[0, 0, TerenBazowy.PlytkieMorze, Nakladka.Brak, 0, 0]]),
  single_land: () => buildMap([[0, 0, TerenBazowy.Laka, Nakladka.Las, 1, 1]]),
  single_mountain: () => buildMap([[0, 0, TerenBazowy.Gory, Nakladka.Brak, 0, 0]]),
  pair_land_sea: () => buildMap([[0, 0, TerenBazowy.Laka, Nakladka.Brak, 0, 0], [1, 0, TerenBazowy.Morze, Nakladka.Brak, 0, 0]]),
  // Pierscien ladu wokol morza (morze wewnetrzne - nie ocean):
  inland_lake: () => {
    const e = [];
    for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) {
      const inner = Math.abs(q) <= 1 && Math.abs(r) <= 1 && Math.abs(q + r) <= 1;
      e.push([q, r, inner ? TerenBazowy.Morze : TerenBazowy.Laka, Nakladka.Brak, 0, 0]);
    }
    return buildMap(e);
  },
  // Morze na krawedzi 3x3 - oceaniczne:
  border_sea_3x3: () => {
    const e = [];
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) e.push([q, r, q === 1 && r === 1 ? TerenBazowy.Laka : TerenBazowy.Morze, Nakladka.Brak, 0, 0]);
    return buildMap(e);
  },
  // Wybrzeze (plytkie) zwisajace w glab morza, bez lądu: sierota.
  orphan_shallow_chain: () => buildMap([
    [0, 0, TerenBazowy.PlytkieMorze, Nakladka.Brak, 1, 0], [1, 0, TerenBazowy.PlytkieMorze, Nakladka.Brak, 0, 1],
    [2, 0, TerenBazowy.Morze, Nakladka.Brak, 0, 0], [0, 1, TerenBazowy.Morze, Nakladka.Brak, 0, 0],
  ]),
  // Lad -> wybrzeze -> wybrzeze -> morze (laniec 2-pierscieniowy):
  coast_chain: () => buildMap([
    [0, 0, TerenBazowy.Laka, Nakladka.Las, 0, 0], [1, 0, TerenBazowy.PlytkieMorze, Nakladka.Brak, 1, 0],
    [2, 0, TerenBazowy.PlytkieMorze, Nakladka.Brak, 0, 0], [3, 0, TerenBazowy.Morze, Nakladka.Brak, 0, 1],
    [4, 0, TerenBazowy.Morze, Nakladka.Brak, 0, 0],
  ]),
  // Morze z dziura sasiadujaca z ladem tylko po skosie (nie po sasiedztwie heksowym):
  diagonal_only: () => buildMap([[0, 0, TerenBazowy.Laka, Nakladka.Brak, 0, 0], [1, 1, TerenBazowy.Morze, Nakladka.Brak, 0, 0]]),
  // Wszystkie 8 terenow w jednym rzedzie (progi rang erozji):
  all_terrains_row: () => buildMap(RUST_TB.map((tb, i) => [i, 0, tb, Nakladka.Brak, 0, 0])),
};

// ---------- wektory ----------
const cases = {};
const stats = {};
const bump = (k) => (stats[k] = (stats[k] ?? 0) + 1);

// 1. Predykaty terenu (wszystkie 8 wartosci, granice zbioru).
cases.terrain_predicates = RUST_TB.map((tb) => ({
  terrain: TB_TO_RUST[tb],
  is_land_terrain: G.isLandTerrain(tb),
  is_land_or_coast: G.isLandOrCoast(tb),
  is_dry_land: G.isDryLandTerrain(tb),
  erode_rank: G.erodeTerrainRank(tb),
}));

// 2. Domyslny udzial lądu per typ swiata.
cases.default_land_fraction = ['kontynenty', 'pangea', 'wyspy', 'ziemia'].map((typ) => ({
  typ,
  out: G.defaultLandFractionForTyp(typ),
}));

// Lista wszystkich map testowych: specjalne + losowe.
const mapList = [];
for (const [name, fn] of Object.entries(SPECIAL)) mapList.push({ name, hexes: fn(), W: 3, H: 3 });
// Losowe mapy: rozne rozmiary, dziury, stray keys, wagi.
const SIZES = [[1, 1], [2, 1], [1, 3], [3, 3], [4, 2], [5, 5], [7, 4], [9, 9]];
for (let i = 0; i < 160; i++) {
  const [W, H] = SIZES[i % SIZES.length];
  const weights = [W_MIXED, W_WATER, W_LAND, W_COAST][i % 4];
  const holeP = [0, 0.1, 0.25][i % 3];
  const strayP = i % 5 === 0 ? 1 : 0;
  mapList.push({ name: `rand_${i}`, hexes: randomMap(W, H, holeP, strayP, weights), W, H });
}

// 3. Liczniki i sasiedztwo: dla kazdej mapy - liczniki dla wszystkich klucz + pozycje brzegowe/zewn.
cases.neighborhood = [];
cases.count_land_sea = [];
cases.coast_predicates = [];
for (const m of mapList) {
  const { name, hexes, W, H } = m;
  cases.count_land_sea.push({ name, hexes: dumpMap(hexes), out: G.countLandSeaHexes(hexes) });
  bump('count_land_sea');
  const probe = new Set();
  for (let r = -1; r <= H; r++) for (let q = -1; q <= W; q++) probe.add(`${q},${r}`);
  for (const k of Object.keys(hexes)) probe.add(k);
  for (const key of probe) {
    const [q, r] = key.split(',').map(Number);
    cases.neighborhood.push({
      map: name,
      q,
      r,
      morze_n: G.countMorseNeighbors(hexes, q, r),
      land_n: G.countLandNeighbors(hexes, q, r),
    });
    cases.coast_predicates.push({
      map: name,
      q,
      r,
      coastal_land: G.isCoastalLandHex(hexes, q, r),
      coastal_morse: G.isCoastalMorseHex(hexes, q, r),
    });
    bump('probe');
  }
}

// 4. Mutujace funkcje wybrzeza (pierscien, sanityzacja) - stan przed i po.
const mutCases = (fnName, fn) => {
  const arr = [];
  for (const m of mapList) {
    const before = cloneMap(m.hexes);
    const work = cloneMap(m.hexes);
    const ret = fn(work);
    arr.push({ name: m.name, in: dumpMap(before), ret, out: dumpMap(work) });
  }
  cases[fnName] = arr;
};
mutCases('apply_coast_ring', (h) => G.applyCoastRing(h));
mutCases('apply_double_coast_ring', (h) => G.applyDoubleCoastRing(h));
mutCases('sanitize_coast_hexes', (h) => G.sanitizeCoastHexes(h));

// 5. Funkcje listujace (kolejnosc Object.keys / Object.entries).
cases.find_dry_land_touching_sea = mapList.map((m) => ({ name: m.name, in: dumpMap(m.hexes), out: G.findDryLandTouchingSea(m.hexes) }));
cases.ocean_connected_water = mapList.map((m) => ({
  name: m.name, W: m.W, H: m.H, in: dumpMap(m.hexes),
  out: [...G.oceanConnectedWaterKeys(m.hexes, m.W, m.H)].sort(),
}));
cases.find_inland_water = mapList.map((m) => ({ name: m.name, W: m.W, H: m.H, in: dumpMap(m.hexes), out: G.findInlandWaterHexes(m.hexes, m.W, m.H) }));
cases.find_inland_sea = mapList.map((m) => ({ name: m.name, W: m.W, H: m.H, in: dumpMap(m.hexes), out: G.findInlandSeaHexes(m.hexes, m.W, m.H) }));

// Sanity: sumy liczb wektorow.
const counts = Object.fromEntries(Object.entries(cases).map(([k, v]) => [k, v.length]));
const payload = {
  meta: {
    generator: 'gen-m06a-vectors.mjs',
    pin: 'edb8fb56',
    seed: 20261029,
    maps: mapList.length,
    sha256_of_gen_helpers: sha(original),
  },
  counts,
  stats,
  cases,
};
mkdirSync(out.substring(0, out.lastIndexOf('/')), { recursive: true });
writeFileSync(out, JSON.stringify(payload));
console.log(JSON.stringify({ out, counts, maps: mapList.length }));
