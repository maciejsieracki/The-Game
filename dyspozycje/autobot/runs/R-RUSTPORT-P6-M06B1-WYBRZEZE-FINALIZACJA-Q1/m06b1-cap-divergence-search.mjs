// Szukanie mapy, w ktorej limit przebiegow czesci (a) thickenCoastAndSmoothInlets (cap 12) ZMIENIA
// wynik koncowy (Operator-pomiary r1). Porownanie dwoch modulow webu w jednym procesie:
//   GC  = pristine web (pin edb8fb56, cap 12)
//   GU  = kopia z capem 200 (jedyna zmiana: `pass < 200`), czyli "bez limitu"
// Fitness = liczba roznic w stanie koncowym miedzy GC i GU (hill-climb, akceptacja >=).
// Uzycie: node --experimental-transform-types --no-warnings --import ./m06b1-loader-register.mjs \
//           ./m06b1-cap-divergence-search.mjs <WEB_ROOT_CAP12> <WEB_ROOT_UNCAPPED> <SEED> <STEPS>
import { pathToFileURL } from 'node:url';

const [rootC, rootU] = process.argv.slice(2, 4);
const seed0 = Number(process.argv[4] ?? 1);
const steps = Number(process.argv[5] ?? 2000);
const GC = await import(pathToFileURL(`${rootC}/gra/src/map/gen-helpers.ts`).href);
const GU = await import(pathToFileURL(`${rootU}/gra/src/map/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${rootC}/gra/src/types/hex.ts`).href);
const { TerenBazowy: TB, Nakladka: NK } = H;
const TYPES = [TB.Morze, TB.PlytkieMorze, TB.Laka, TB.Gory, TB.Wzgorza, TB.Morze, TB.PlytkieMorze];

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
      o[`${q},${r}`] = { coords: { q, r }, terenBazowy: cells[q * HH + r], nakladka: NK.Brak, rzeka: { obecna: false, krawedzie: [] } };
    }
  }
  return o;
}
function diffCount(a, b) {
  let n = 0;
  for (const k of Object.keys(a)) if (a[k].terenBazowy !== b[k].terenBazowy) n++;
  return n;
}
function evalCells(W, HH, cells) {
  const hc = toHexes(W, HH, cells);
  const retC = GC.thickenCoastAndSmoothInlets(hc, W, HH);
  const hu = toHexes(W, HH, cells);
  const retU = GU.thickenCoastAndSmoothInlets(hu, W, HH);
  return { fit: diffCount(hc, hu), retC, retU, cells };
}

let best = null;
let found = null;
const restarts = Math.max(4, Math.floor(steps / 200));
for (let restart = 0; restart < restarts && !found; restart++) {
  const W = 9 + Math.floor(rnd() * 16);
  const HH = 9 + Math.floor(rnd() * 16);
  let cells = Array.from({ length: W * HH }, () => TYPES[Math.floor(rnd() * TYPES.length)]);
  let cur = evalCells(W, HH, cells);
  for (let s = 0; s < steps && !found; s++) {
    const next = cells.slice();
    const flips = 1 + Math.floor(rnd() * 3);
    for (let f = 0; f < flips; f++) next[Math.floor(rnd() * next.length)] = TYPES[Math.floor(rnd() * TYPES.length)];
    const ev = evalCells(W, HH, next);
    if (ev.fit >= cur.fit) {
      cells = next;
      cur = ev;
    }
    if (ev.fit > 0) found = { W, H: HH, cells: next.map(String), fit: ev.fit, retC: ev.retC, retU: ev.retU };
    if (!best || ev.fit > best.fit) best = { fit: ev.fit, W, H: HH };
  }
}
console.log(JSON.stringify({ found: found ? { W: found.W, H: found.H, fit: found.fit, retC: found.retC, retU: found.retU } : null, best }));
if (found) console.log(JSON.stringify({ divergence_map: found }));
