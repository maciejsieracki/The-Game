// Runda 2 (NAPRAW 1): szukanie map, na ktorych limit przebiegow czesci (a) thickenCoastAndSmoothInlets
// (`for (let pass = 0; pass < N; pass++)`, gen-helpers.ts:4852) JEST OBSERWOWALNY na wyjsciu.
// Trzy kopie PRAWDZIWEGO kodu weba (pin edb8fb56), jedyna zmiana: N = 11 / 12 (pristine) / 13.
// Generator map: LCG Numerical Recipes (a=1664525, c=1013904223, m=2^32), ziarno 12345.
// Mapa: W,H in [20..49]; p = P(morze) in [0.25..0.55]; komorka: morze z p, inaczej lad.
// Raport: liczba map, na ktorych cap11!=cap12 / cap13!=cap12, oraz pierwsza mapa z obiema roznicami.
// Uzycie: node --experimental-transform-types --no-warnings --import ./m06b1-loader-register.mjs \
//           ./m06b1-r2-cap-search.mjs <ROOT_CAP11> <ROOT_CAP12> <ROOT_CAP13> <N_MAPS> <OUT_JSON>
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';

const [r11, r12, r13] = process.argv.slice(2, 5);
const nMaps = Number(process.argv[5] ?? 1500);
const outFile = process.argv[6];
const G11 = await import(pathToFileURL(`${r11}/gra/src/map/gen-helpers.ts`).href);
const G12 = await import(pathToFileURL(`${r12}/gra/src/map/gen-helpers.ts`).href);
const G13 = await import(pathToFileURL(`${r13}/gra/src/map/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${r12}/gra/src/types/hex.ts`).href);
const { TerenBazowy: TB, Nakladka: NK } = H;
const LAND = [TB.Laka, TB.Gory, TB.Wzgorza, TB.Laka];

let s = 12345 >>> 0;
const lcg = () => {
  s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
  return s / 4294967296;
};

function toHexes(W, HH, cells) {
  const o = {};
  for (let q = 0; q < W; q++) {
    for (let r = 0; r < HH; r++) {
      o[`${q},${r}`] = { coords: { q, r }, terenBazowy: cells[q * HH + r], nakladka: NK.Brak, rzeka: { obecna: false, krawedzie: [] } };
    }
  }
  return o;
}
const stateOf = (h) => Object.keys(h).sort().map((k) => `${k}:${h[k].terenBazowy}`).join('|');
const diffCount = (a, b) => Object.keys(a).reduce((n, k) => n + (a[k].terenBazowy !== b[k].terenBazowy ? 1 : 0), 0);

let n11 = 0;
let n13 = 0;
let both = 0;
let firstBoth = null;
let firstAny = null;
for (let m = 0; m < nMaps; m++) {
  const W = 20 + Math.floor(lcg() * 30);
  const HH = 20 + Math.floor(lcg() * 30);
  const p = 0.25 + lcg() * 0.3;
  const cells = Array.from({ length: W * HH }, () => (lcg() < p ? TB.Morze : LAND[Math.floor(lcg() * LAND.length)]));
  const h11 = toHexes(W, HH, cells);
  const h12 = toHexes(W, HH, cells);
  const h13 = toHexes(W, HH, cells);
  const r11v = G11.thickenCoastAndSmoothInlets(h11, W, HH);
  const r12v = G12.thickenCoastAndSmoothInlets(h12, W, HH);
  const r13v = G13.thickenCoastAndSmoothInlets(h13, W, HH);
  const d11 = r11v !== r12v || stateOf(h11) !== stateOf(h12);
  const d13 = r13v !== r12v || stateOf(h13) !== stateOf(h12);
  if (d11) n11++;
  if (d13) n13++;
  if (d11 && d13) {
    both++;
    if (!firstBoth) firstBoth = { m, W, H: HH, p, cells: cells.map(String), ret: { c11: r11v, c12: r12v, c13: r13v }, diff11: diffCount(h11, h12), diff13: diffCount(h13, h12) };
  }
  if ((d11 || d13) && !firstAny) firstAny = { m, W, H: HH, p, diff11: diffCount(h11, h12), diff13: diffCount(h13, h12), ret: { c11: r11v, c12: r12v, c13: r13v } };
}
const summary = { nMaps, cap11_ne_cap12: n11, cap13_ne_cap12: n13, both_ne: both, firstAny_meta: firstAny, firstBoth_meta: firstBoth && { ...firstBoth, cells: undefined } };
console.log(JSON.stringify(summary));
if (outFile && firstBoth) writeFileSync(outFile, JSON.stringify({ summary, map: firstBoth }));
