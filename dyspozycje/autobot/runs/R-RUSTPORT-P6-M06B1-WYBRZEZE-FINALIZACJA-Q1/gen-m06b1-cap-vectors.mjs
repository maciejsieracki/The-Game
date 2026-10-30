// Runda 2 (NAPRAW 1): wektory z URUCHOMIONEGO weba dla limitu `przebiegi_wygladzania` (cap = 12,
// gen-helpers.ts:4852) w `thickenCoastAndSmoothInlets` (część a).
// Wejscie: mapy z `m06b1-r2-cap-search.mjs` (plik `m06b1-cap-both.json`, pierwsza mapa z roznica
// cap11 != cap12 ORAZ cap13 != cap12) oraz kilka kolejnych map z tego samego generatora (LCG 12345),
// na ktorych oba warianty (cap11, cap13) tez daja roznice.
// Wyjscie (cap12 = pristine pin edb8fb56) to ORACLE dla testu Rust. Wyniki cap11/cap13 zapisane jako
// dane referencyjne (ref_cap11 / ref_cap13: ret + sha256 pelnego stanu), zeby test Rust mogl wykryc mutanty.
// Uzycie: node --experimental-transform-types --no-warnings --import ./m06b1-loader-register.mjs \
//           ./gen-m06b1-cap-vectors.mjs <ROOT_CAP11> <ROOT_CAP12> <ROOT_CAP13> <RUN_DIR> <WYJSCIE.json>
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const [r11, r12, r13, runDir, out] = process.argv.slice(2);
if (!out) {
  console.error('uzycie: gen-m06b1-cap-vectors.mjs <ROOT_CAP11> <ROOT_CAP12> <ROOT_CAP13> <RUN_DIR> <WYJSCIE.json>');
  process.exit(2);
}
const G11 = await import(pathToFileURL(`${r11}/gra/src/map/gen-helpers.ts`).href);
const G12 = await import(pathToFileURL(`${r12}/gra/src/map/gen-helpers.ts`).href);
const G13 = await import(pathToFileURL(`${r13}/gra/src/map/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${r12}/gra/src/types/hex.ts`).href);
const { TerenBazowy: TB, Nakladka: NK } = H;

const keyOf = (q, r) => `${q},${r}`;
const f = (x) => (Object.is(x, -0) ? '-0' : String(x));
// rows: [klucz, terenBazowy, nakladka, zloze, rzekaObecna, krawedzie] (ten sam format co gen-m06b1-boundary-vectors.mjs)
function dumpObj(hexes) {
  return Object.entries(hexes).map(([k, h]) => [k, h.terenBazowy, h.nakladka, h.zloze ? 1 : 0, h.rzeka.obecna ? 1 : 0, [...h.rzeka.krawedzie]]);
}
function buildObj(rows) {
  const o = {};
  for (const [k, terr, nak, z, ro, ed] of rows) {
    const [q, r] = k.split(',').map(Number);
    o[k] = { coords: { q, r }, terenBazowy: terr, nakladka: nak, rzeka: { obecna: ro === 1, krawedzie: [...ed] }, ...(z ? { zloze: 'rudy' } : {}) };
  }
  return o;
}
function rowsFromCells(W, HH, cells) {
  const rows = [];
  for (let q = 0; q < W; q++) for (let r = 0; r < HH; r++) rows.push([keyOf(q, r), cells[q * HH + r], NK.Brak, 0, 0, []]);
  return rows;
}
const sha = (x) => createHash('sha256').update(JSON.stringify(x)).digest('hex');

// Mapy: pierwsza mapa z obiema roznicami (z wyszukiwania) + kolejne mapy z tego samego generatora.
const both = JSON.parse(readFileSync(`${runDir}/evidence-r2-cap-both.json`, 'utf8')).map;
const cellsOf = (m) => m.cells;
// Odtworzenie kolejnych map generatora LCG (ta sama sekwencja co m06b1-r2-cap-search.mjs):
let s = 12345 >>> 0;
const lcg = () => {
  s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
  return s / 4294967296;
};
const LAND = [TB.Laka, TB.Gory, TB.Wzgorza, TB.Laka];
const gridMaps = [];
for (let m = 0; m < 40 && gridMaps.length < 3; m++) {
  const W = 20 + Math.floor(lcg() * 30);
  const HH = 20 + Math.floor(lcg() * 30);
  const p = 0.25 + lcg() * 0.3;
  const cells = Array.from({ length: W * HH }, () => (lcg() < p ? TB.Morze : LAND[Math.floor(lcg() * LAND.length)]));
  if (m === both.m) continue; // mapa `both` juz jest w zbiorze
  gridMaps.push({ m, W, H: HH, cells: cells.map(String) });
}
// Mapy: [both, grid...] - zrodla do testu. Sprawdzamy, ze `both` odtwarza sie z generatora.
const sources = [{ m: both.m, W: both.W, H: both.H, cells: cellsOf(both) }, ...gridMaps];

const maps = [];
const cases = { thicken: [] };
sources.forEach((src, mi) => {
  const rows = rowsFromCells(src.W, src.H, src.cells);
  maps.push(rows);
  const web = (G, label) => {
    const hx = buildObj(rows);
    const ret = G.thickenCoastAndSmoothInlets(hx, src.W, src.H);
    return { label, ret: f(ret), state: dumpObj(hx) };
  };
  const c12 = web(G12, 'cap12');
  const c11 = web(G11, 'cap11');
  const c13 = web(G13, 'cap13');
  cases.thicken.push({
    id: `cap-thick-m${mi}-cap12`,
    mi,
    W: src.W,
    H: src.H,
    coastWidth: 'default',
    gen_map_index: src.m,
    output: { ret: c12.ret, state: c12.state },
    ref_cap11: { ret: c11.ret, state_sha256: sha(c11.state), differs_from_cap12: sha(c11.state) !== sha(c12.state) || c11.ret !== c12.ret },
    ref_cap13: { ret: c13.ret, state_sha256: sha(c13.state), differs_from_cap12: sha(c13.state) !== sha(c12.state) || c13.ret !== c12.ret },
    state_sha256_cap12: sha(c12.state),
  });
});

const result = {
  meta: {
    temat: 'R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1',
    runda: 2,
    pin_web: 'edb8fb56',
    generator: 'gen-m06b1-cap-vectors.mjs',
    cap_source: 'gen-helpers.ts:4852 `for (let pass = 0; pass < 12; pass++)` (cap12 = pristine; cap11/cap13 = kopie z jedyna zmiana N)',
    search: 'm06b1-r2-cap-search.mjs (LCG 12345, 1500 map): cap11!=cap12 na 379, cap13!=cap12 na 302, oba na 302',
    first_both_map: { gen_map_index: both.m, W: both.W, H: both.H, p: both.p, diff_cap11_hexes: both.diff11, diff_cap13_hexes: both.diff13 },
  },
  maps,
  cases,
};
writeFileSync(out, JSON.stringify(result));
console.log(JSON.stringify({ maps: maps.length, thicken: cases.thicken.length, refs: cases.thicken.map((c) => [c.ref_cap11.differs_from_cap12, c.ref_cap13.differs_from_cap12]) }));
