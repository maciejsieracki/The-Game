// Generator wektorow P6.M06A4 (lad/morze/wybrzeze A4, runda 1, partia 2).
// URUCHAMIA prawdziwy kod TS weba (pin edb8fb56, gra/src/map/gen-helpers.ts) - logiki nie przepisujemy.
// Symbol partii 2: purgeDesertEnclaveWater (web :4156). Uzyte symbole sa eksportowane w pinie
// (bez instrumentacji). Zaleznosci: findInlandWaterHexes (:4109), climateBandAt (:193), HEX_DIRECTIONS (:125).
//
// Uzycie (loader: m06a-loader-register.mjs obok tego pliku):
//   node --experimental-transform-types --no-warnings --import ./m06a-loader-register.mjs \
//        ./gen-m06a4-vectors.mjs <WEB_ROOT> <WYJSCIE.json>
// WEB_ROOT = katalog z `git archive edb8fb56 gra/src gra/data` rozpakowany POZA repo.
// Format mapy: [klucz, terrainRust, nakladkaRaw, zloze0/1, rzekaObecna0/1, rzekaKrawedzieN] (jak M06A3).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m06a4-vectors.mjs <WEB_ROOT> <WYJSCIE.json>');
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
const W_MIX = [
  [TerenBazowy.Laka, 3], [TerenBazowy.Rownina, 2], [TerenBazowy.Wzgorza, 1], [TerenBazowy.Gory, 1],
  [TerenBazowy.Pustynia, 4], [TerenBazowy.Polarny, 1], [TerenBazowy.PlytkieMorze, 1], [TerenBazowy.Morze, 2],
];

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

const cases = { purge_desert_enclave_water: [] };
const stats = { cases: 0, neighborhood_cases: 0, random_cases: 0, edge_cases: 0, changed_cases: 0 };
// Pokrycie: klucz "d<dryN>_p<pustN>_<D|N>[_chg]" (D = srodek w pasmie desert, N = poza; _chg = web
// zmienil srodek). Test Rust wymaga wpisow dla kazdej pary (d,p) w obu pasmach.
const coverage = {};
const bump = (k) => {
  coverage[k] = (coverage[k] ?? 0) + 1;
};

function runCase(name, W, H, hexesIn) {
  const hexes = structuredClone(hexesIn);
  const before = dumpMap(hexesIn);
  const n = G.purgeDesertEnclaveWater(hexes, W, H);
  cases.purge_desert_enclave_water.push({ name, w: W, h: H, input: before, out: n, output: dumpMap(hexes) });
  stats.cases++;
  if (n > 0) stats.changed_cases++;
  return n;
}

// 1. Sasiedztwo srodka (q=4, r) na siatce 9 x H: d suchych sasiadow (0..6), z czego p to Pustynia.
//    Pozostali sasiedzi to Morze (woda). Wszystkie wiersze r (takze graniczne: brak czesci sasiadow).
const DIRS = G.HEX_DIRECTIONS;
// Rozmiar (runda 2): kazdy przypadek niesie cala siatke 9 x H, wiec pelne r x H x 28 par dawaloby
// ~50 MB. Wybieramy deterministycznie po 2 wiersze z pasma D i 2 z pasma N dla kazdego H (pierwszy
// i ostatni z kazdego pasma) oraz wiersze brzegowe 0 i H-1. Pokrycie (d,p,pasmo) pozostaje pelne.
const rowsFor = (H) => {
  const D = [];
  const N = [];
  for (let r = 0; r < H; r++) {
    (G.climateBandAt(4, r, H) === 'desert' ? D : N).push(r);
  }
  // Wiersze wewnetrzne (pelne 6 sasiadow) musza byc w obu pasmach: pierwszy, srodkowy i ostatni.
  const pick = (arr) => [...new Set([arr[0], arr[Math.floor(arr.length / 2)], arr[arr.length - 1]].filter((x) => x !== undefined))];
  return [...new Set([0, H - 1, ...pick(D), ...pick(N)])].sort((a, b) => a - b);
};
for (const H of [9, 12, 20, 30]) {
  for (const r of rowsFor(H)) {
    for (let d = 0; d <= 6; d++) {
      for (let p = 0; p <= d; p++) {
        const hexes = {};
        // Srodek pierwszy w kolejnosci wstawiania: web przetwarza go przed sasiadami (stan wejsciowy progu).
        hexes[`4,${r}`] = mkHex(TerenBazowy.Morze, rnd() < 0.5 ? pickNak() : Nakladka.Brak, rnd() < 0.5 ? 1 : 0, rnd() < 0.5 ? 1 : 0);
        for (let rr = 0; rr < H; rr++) {
          for (let q = 0; q < 9; q++) {
            if (q === 4 && rr === r) continue;
            hexes[`${q},${rr}`] = mkHex(TerenBazowy.Laka, Nakladka.Brak, 0, 0);
          }
        }
        const water = 6 - d;
        DIRS.forEach(([dq, dr], i) => {
          const key = `${4 + dq},${r + dr}`;
          let tb;
          if (i < water) tb = TerenBazowy.Morze;
          else if (i - water < p) tb = TerenBazowy.Pustynia;
          else tb = TerenBazowy.Laka;
          if (hexes[key] !== undefined) {
            hexes[key] = mkHex(tb, rnd() < 0.2 ? pickNak() : Nakladka.Brak, rnd() < 0.3 ? 1 : 0, rnd() < 0.2 ? 1 : 0);
          }
        });
        // Liczniki jak w webie: brak klucza = pominiety; woda = Morze/PlytkieMorze.
        let dryN = 0;
        let pustN = 0;
        for (const [dq, dr] of DIRS) {
          const nh = hexes[`${4 + dq},${r + dr}`];
          if (!nh || nh.terenBazowy === TerenBazowy.Morze || nh.terenBazowy === TerenBazowy.PlytkieMorze) continue;
          dryN++;
          if (nh.terenBazowy === TerenBazowy.Pustynia) pustN++;
        }
        const inDesert = G.climateBandAt(4, r, H) === 'desert' ? 'D' : 'N';
        const centerKey = `4,${r}`;
        const n = runCase(`nb_H${H}_r${r}_d${d}_p${p}`, 9, H, hexes);
        stats.neighborhood_cases++;
        const outC = cases.purge_desert_enclave_water.at(-1).output.find(([k]) => k === centerKey)[1];
        bump(`d${dryN}_p${pustN}_${inDesert}_${outC === "Pustynia" ? "des" : n > 0 ? "lak" : "nop"}`);
      }
    }
  }
}

// 2. Losowe mapy z wagami obejmujacymi pustynie i wode (rozne rozmiary, dziury).
for (const [W, H] of [[5, 6], [9, 14], [12, 30], [16, 45], [7, 61]]) {
  for (let i = 0; i < 6; i++) {
    const hexes = gridMap(W, H, W_MIX, i % 2 === 0 ? 0 : 0.15);
    runCase(`rnd_${W}x${H}_${i}`, W, H, hexes);
    stats.random_cases++;
  }
}

// 3. Brzegi i przypadki puste/zdegenerowane.
runCase('edge_empty', 4, 4, {});
runCase('edge_all_sea', 5, 9, gridMap(5, 9, [[TerenBazowy.Morze, 1]]));
runCase('edge_all_desert', 5, 9, gridMap(5, 9, [[TerenBazowy.Pustynia, 1]]));
runCase('edge_height_1', 3, 1, gridMap(3, 1, [[TerenBazowy.Morze, 1]]));
runCase('edge_stray_keys', 3, 10, { ...gridMap(3, 10, W_MIX, 0.2), '-1,4': mkHex(TerenBazowy.Morze), '3,-2': mkHex(TerenBazowy.Pustynia) });
stats.edge_cases = 5;

const doc = {
  meta: {
    generator: 'gen-m06a4-vectors.mjs',
    pin: 'edb8fb56',
    seed: 20261029,
    gen_helpers_sha256: sha(originalSrc),
    symbols: ['purgeDesertEnclaveWater'],
    terrain_map: TB_TO_RUST,
    rust_terrains: RUST_TB,
    climate_is_earth: false,
    coverage_key: "d<dryN>_p<pustN>_<D|N>_<des|lak|nop>: D=srodek w pasmie desert, N=poza; des=srodek -> Pustynia, lak=srodek -> Laka (inland), nop=bez zmiany"
  },
  counts: { purge_desert_enclave_water: cases.purge_desert_enclave_water.length },
  stats,
  coverage,
  cases,
};
writeFileSync(out, JSON.stringify(doc));
console.log(JSON.stringify({ counts: doc.counts, stats, coverage_keys: Object.keys(coverage).length, sha: doc.meta.gen_helpers_sha256 }));
