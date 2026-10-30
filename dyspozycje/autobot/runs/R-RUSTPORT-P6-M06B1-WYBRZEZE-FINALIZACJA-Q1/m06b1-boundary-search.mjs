// Pomiar granic (Operator-pomiary r1): szuka map, w ktorych (a) thickenCoastAndSmoothInlets
// wykonuje wiele przebiegow wygladzania (cap 12) oraz finalizeCoastAndInlandWater zalezy od maxPasses.
// URUCHAMIA prawdziwy kod TS weba z KOPII instrumentowanej (jedyna zmiana: licznik
// globalThis.__wygPasses w czesci (a), bez zmiany logiki). Wynik: JSON na stdout.
// Uzycie: node --experimental-transform-types --no-warnings --import ./m06b1-loader-register.mjs \
//           ./m06b1-boundary-search.mjs <INSTR_WEB_ROOT> <SEED> <SEARCH_STEPS>
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const seed0 = Number(process.argv[3] ?? 1);
const steps = Number(process.argv[4] ?? 2000);
const G = await import(pathToFileURL(`${root}/gra/src/map/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy: TB } = H;
const TYPES = [TB.Morze, TB.PlytkieMorze, TB.Laka, TB.Gory, TB.Wzgorza];

function mulberry(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry(seed0);

// mapa: tablica typow terenu (indeks = q*H + r)
function toHexes(W, HH, cells) {
  const o = {};
  for (let q = 0; q < W; q++) {
    for (let r = 0; r < HH; r++) {
      o[`${q},${r}`] = {
        coords: { q, r },
        terenBazowy: cells[q * HH + r],
        nakladka: 0,
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return o;
}
function dump(hexes) {
  return JSON.stringify(Object.entries(hexes).map(([k, h]) => [k, h.terenBazowy, h.nakladka, h.rzeka.obecna ? 1 : 0]));
}

function passesThicken(W, HH, cells) {
  globalThis.__wygPasses = 0;
  const hx = toHexes(W, HH, cells);
  G.thickenCoastAndSmoothInlets(hx, W, HH, 2);
  return globalThis.__wygPasses;
}

// --- 1. hill-climb na liczbe przebiegow (a) ---
let best = { passes: -1 };
const hist = {};
const restarts = Math.max(4, Math.floor(steps / 200));
for (let restart = 0; restart < restarts; restart++) {
  const W = 7 + Math.floor(rnd() * 20);
  const HH = 7 + Math.floor(rnd() * 20);
  let cells = Array.from({ length: W * HH }, () => TYPES[Math.floor(rnd() * TYPES.length)]);
  let cur = passesThicken(W, HH, cells);
  for (let s = 0; s < steps; s++) {
    const next = cells.slice();
    const flips = 1 + Math.floor(rnd() * 3);
    for (let f = 0; f < flips; f++) next[Math.floor(rnd() * next.length)] = TYPES[Math.floor(rnd() * TYPES.length)];
    const p = passesThicken(W, HH, next);
    if (p >= cur) {
      cells = next;
      cur = p;
    }
    hist[p] = (hist[p] ?? 0) + 1;
    if (p > best.passes) best = { passes: p, W, H: HH, cells: cells.slice() };
  }
}

// --- 2. finalize: wrazliwosc na maxPasses (N-1 vs N) ---
const sens = { pool_null: {}, pool2: {}, pool5: {} };
let finMaps = 0;
for (let i = 0; i < steps; i++) {
  const W = 7 + Math.floor(rnd() * 12);
  const HH = 7 + Math.floor(rnd() * 10);
  const cells = Array.from({ length: W * HH }, () => TYPES[Math.floor(rnd() * TYPES.length)]);
  finMaps++;
  for (const [name, pool] of [['pool_null', undefined], ['pool2', 2], ['pool5', 5]]) {
    const outs = [];
    for (const mp of [1, 2, 3, 4, 5]) {
      const hx = toHexes(W, HH, cells);
      G.finalizeCoastAndInlandWater(hx, W, HH, mp, pool == null ? undefined : { maxInlandPoolSize: pool });
      outs.push(dump(hx));
    }
    for (const mp of [2, 3, 4, 5]) {
      if (outs[mp - 1] !== outs[mp - 2]) sens[name][mp] = (sens[name][mp] ?? 0) + 1;
    }
  }
}
console.log(JSON.stringify({
  thicken_a_passes_hist: hist,
  thicken_a_best_passes: best.passes,
  thicken_a_best_map: { W: best.W, H: best.H },
  finalize_maps: finMaps,
  finalize_out_differs_when_maxPasses_raised_to: sens,
}));
if (best.passes >= 12) console.log(JSON.stringify({ cap12_map: best }));
