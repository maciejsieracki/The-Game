// Pomiar granicy maxPasses (Operator-pomiary r1): hill-climb po mapach, dla ktorych wynik
// finalizeCoastAndInlandWater zmienia sie przy KAZDYM przebiegu 1..5 (pool null / 2 / 5).
// Cel: mapy z out(N-1) != out(N) != out(N+1) dla N = 3 (domyslne maxPasses), by pokryc N-1/N/N+1.
// Kod: prawdziwy web (kopia niezmieniona, bez instrumentacji).
// Uzycie: node --experimental-transform-types --no-warnings --import ./m06b1-loader-register.mjs \
//           ./m06b1-boundary-fin-search.mjs <WEB_ROOT> <SEED> <STEPS> <POOL|null>
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const seed0 = Number(process.argv[3] ?? 1);
const steps = Number(process.argv[4] ?? 2000);
const poolArg = process.argv[5] ?? 'null';
const pool = poolArg === 'null' ? undefined : Number(poolArg);
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

function toHexes(W, HH, cells) {
  const o = {};
  for (let q = 0; q < W; q++) {
    for (let r = 0; r < HH; r++) {
      o[`${q},${r}`] = { coords: { q, r }, terenBazowy: cells[q * HH + r], nakladka: 0, rzeka: { obecna: false, krawedzie: [] } };
    }
  }
  return o;
}
function dump(hexes) {
  return JSON.stringify(Object.entries(hexes).map(([k, h]) => [k, h.terenBazowy, h.nakladka, h.rzeka.obecna ? 1 : 0]));
}
// fitness: liczba przejsc out(p-1) != out(p), p = 2..5; plus osobno czy out(3) != out(2) i out(4) != out(3)
function evalCells(W, HH, cells) {
  const outs = [];
  for (const mp of [1, 2, 3, 4, 5]) {
    const hx = toHexes(W, HH, cells);
    G.finalizeCoastAndInlandWater(hx, W, HH, mp, pool == null ? undefined : { maxInlandPoolSize: pool });
    outs.push(dump(hx));
  }
  let fit = 0;
  for (let p = 1; p < 5; p++) if (outs[p] !== outs[p - 1]) fit++;
  const bound3 = outs[2] !== outs[1] && outs[3] !== outs[2];
  return { fit, bound3, outs };
}

let found = [];
let bestFit = -1;
let bestMap = null;
const restarts = Math.max(4, Math.floor(steps / 200));
for (let restart = 0; restart < restarts; restart++) {
  const W = 7 + Math.floor(rnd() * 14);
  const HH = 7 + Math.floor(rnd() * 14);
  let cells = Array.from({ length: W * HH }, () => TYPES[Math.floor(rnd() * TYPES.length)]);
  let cur = evalCells(W, HH, cells);
  for (let s = 0; s < steps; s++) {
    const next = cells.slice();
    const flips = 1 + Math.floor(rnd() * 3);
    for (let f = 0; f < flips; f++) next[Math.floor(rnd() * next.length)] = TYPES[Math.floor(rnd() * TYPES.length)];
    const ev = evalCells(W, HH, next);
    if (ev.fit >= cur.fit) {
      cells = next;
      cur = ev;
    }
    if (ev.bound3) found.push({ W, H: HH, cells: next.map(String) });
    if (ev.fit > bestFit) {
      bestFit = ev.fit;
      bestMap = { W, H: HH, cells: cells.slice() };
    }
  }
}
const finalEval = bestMap ? evalCells(bestMap.W, bestMap.H, bestMap.cells) : null;
console.log(JSON.stringify({
  pool: poolArg,
  best_fit: bestFit,
  best_bound3_maps: found.length,
  best_map: bestMap ? { W: bestMap.W, H: bestMap.H } : null,
  best_map_outputs_identical_per_pass: finalEval ? finalEval.outs.map((o, i, a) => (i === 0 ? null : o !== a[i - 1])).slice(1) : null,
}));
if (found.length > 0) {
  console.log(JSON.stringify({ bound3_map: found[0] }));
} else if (bestMap) {
  console.log(JSON.stringify({ best_map: bestMap }));
}
