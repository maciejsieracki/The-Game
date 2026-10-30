// Runda 3 (odpowiedz na zarzut FC 4: cienkie pokrycie capu 12): wybor map z LCG 12345 (ta sama sekwencja
// co m06b1-r2-cap-search.mjs), na ktorych cap 11 ORAZ cap 13 daja wynik rozny od cap 12 (pelny stan:
// terenBazowy, nakladka, zloze, rzeka). Trzy kopie PRAWDZIWEGO kodu weba (pin edb8fb56), jedyna zmiana:
// `pass < N` w thickenCoastAndSmoothInlets (gen-helpers.ts:4852), N = 11 / 12 (pristine) / 13.
// Wyjscie: JSON z lista pierwszych K map (cells + metadane), sluzy jako wejscie gen-m06b1-cap-vectors.mjs.
// Uzycie: node --experimental-transform-types --no-warnings --import ./m06b1-loader-register.mjs \
//           ./m06b1-r3-cap-pick.mjs <ROOT_CAP11> <ROOT_CAP12> <ROOT_CAP13> <N_MAPS> <K_PICK> <OUT_JSON>
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';

const [r11, r12, r13] = process.argv.slice(2, 5);
const nMaps = Number(process.argv[5] ?? 1500);
const kPick = Number(process.argv[6] ?? 10);
const outFile = process.argv[7];
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
// pelny stan (kolejnosc wstawiania = Object.entries), nie tylko terrain
const fullState = (h) => JSON.stringify(Object.entries(h).map(([k, x]) => [k, x.terenBazowy, x.nakladka, x.zloze ? 1 : 0, x.rzeka.obecna ? 1 : 0, [...x.rzeka.krawedzie]]));

const picks = [];
let scanned = 0;
let n11 = 0;
let n13 = 0;
let both = 0;
for (let m = 0; m < nMaps; m++) {
  const W = 20 + Math.floor(lcg() * 30);
  const HH = 20 + Math.floor(lcg() * 30);
  const p = 0.25 + lcg() * 0.3;
  const cells = Array.from({ length: W * HH }, () => (lcg() < p ? TB.Morze : LAND[Math.floor(lcg() * LAND.length)]));
  scanned++;
  const h11 = toHexes(W, HH, cells);
  const h12 = toHexes(W, HH, cells);
  const h13 = toHexes(W, HH, cells);
  const r11v = G11.thickenCoastAndSmoothInlets(h11, W, HH);
  const r12v = G12.thickenCoastAndSmoothInlets(h12, W, HH);
  const r13v = G13.thickenCoastAndSmoothInlets(h13, W, HH);
  const d11 = r11v !== r12v || fullState(h11) !== fullState(h12);
  const d13 = r13v !== r12v || fullState(h13) !== fullState(h12);
  if (d11) n11++;
  if (d13) n13++;
  if (d11 && d13) {
    both++;
    if (picks.length < kPick) picks.push({ gen_map_index: m, W, H: HH, p, cells: cells.map(String), ret: { cap11: r11v, cap12: r12v, cap13: r13v } });
  }
}
const summary = { scanned, cap11_ne_cap12: n11, cap13_ne_cap12: n13, both_ne_cap12: both, picked: picks.map((x) => x.gen_map_index) };
console.log(JSON.stringify(summary));
if (outFile) writeFileSync(outFile, JSON.stringify({ summary, picks }));
