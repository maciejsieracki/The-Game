// Runda 3 (NAPRAW 1, poprawka po zarzucie FC 4): wektory z URUCHOMIONEGO weba dla limitu
// `przebiegi_wygladzania` (cap = 12, gen-helpers.ts:4852 `for (let pass = 0; pass < 12; pass++)`)
// w `thickenCoastAndSmoothInlets` (czesc a).
// Wejscie: `cap-picks.json` (`m06b1-r3-cap-pick.mjs`: 10 pierwszych map z LCG 12345, na ktorych cap 11 ORAZ
// cap 13 daja wynik rozny od cap 12) + 3 ogolne mapy tego samego generatora (m=0..2, bez roznicy).
// Dla KAZDEJ mapy zapisany jest PELNY stan wyniku (terenBazowy, nakladka, zloze, rzeka) i zwrot dla
// cap 11, cap 12 (pristine = ORACLE) i cap 13. Test Rust wola funkcje z jawnym limitem (11/12/13) i porownuje
// z weba: to jest test ZACHOWANIA kodu, nie odczyt flag.
// Uzycie: node --experimental-transform-types --no-warnings --import ./m06b1-loader-register.mjs \
//           ./gen-m06b1-cap-vectors.mjs <ROOT_CAP11> <ROOT_CAP12> <ROOT_CAP13> <PICKS.json> <WYJSCIE.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const [r11, r12, r13, picksPath, out] = process.argv.slice(2);
if (!out) {
  console.error('uzycie: gen-m06b1-cap-vectors.mjs <ROOT_CAP11> <ROOT_CAP12> <ROOT_CAP13> <PICKS.json> <WYJSCIE.json>');
  process.exit(2);
}
const G11 = await import(pathToFileURL(`${r11}/gra/src/map/gen-helpers.ts`).href);
const G12 = await import(pathToFileURL(`${r12}/gra/src/map/gen-helpers.ts`).href);
const G13 = await import(pathToFileURL(`${r13}/gra/src/map/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${r12}/gra/src/types/hex.ts`).href);
const { TerenBazowy: TB, Nakladka: NK } = H;

const keyOf = (q, r) => `${q},${r}`;
const f = (x) => (Object.is(x, -0) ? '-0' : String(x));
// rows: [klucz, terenBazowy, nakladka, zloze(0/1), rzekaObecna(0/1), krawedzie[]]
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
const run = (G, rows, W, HH) => {
  const hx = buildObj(rows);
  const ret = G.thickenCoastAndSmoothInlets(hx, W, HH);
  return { ret: f(ret), state: dumpObj(hx) };
};

// Mapy: 10 wybranych (z roznica cap11 i cap13) + 3 ogolne z LCG (m=0..2).
const picks = JSON.parse(readFileSync(picksPath, 'utf8')).picks;
const sources = picks.map((p) => ({ m: p.gen_map_index, W: p.W, H: p.H, cells: p.cells, kind: 'distinguishing' }));
let s = 12345 >>> 0;
const lcg = () => {
  s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
  return s / 4294967296;
};
const LAND = [TB.Laka, TB.Gory, TB.Wzgorza, TB.Laka];
for (let m = 0; m < 3; m++) {
  const W = 20 + Math.floor(lcg() * 30);
  const HH = 20 + Math.floor(lcg() * 30);
  const p = 0.25 + lcg() * 0.3;
  const cells = Array.from({ length: W * HH }, () => (lcg() < p ? TB.Morze : LAND[Math.floor(lcg() * LAND.length)]));
  sources.push({ m, W, H: HH, cells: cells.map(String), kind: 'general' });
}

const maps = [];
const cases = { thicken: [] };
sources.forEach((src, mi) => {
  const rows = rowsFromCells(src.W, src.H, src.cells);
  maps.push(rows);
  const c12 = run(G12, rows, src.W, src.H);
  const c11 = run(G11, rows, src.W, src.H);
  const c13 = run(G13, rows, src.W, src.H);
  const same = (a, b) => a.ret === b.ret && JSON.stringify(a.state) === JSON.stringify(b.state);
  cases.thicken.push({
    id: `cap-thick-m${mi}-${src.kind === 'distinguishing' ? 'roz' : 'ogol'}-g${src.m}`,
    mi,
    W: src.W,
    H: src.H,
    coastWidth: 'default',
    gen_map_index: src.m,
    kind: src.kind,
    output: c12,
    output_cap11: c11,
    output_cap13: c13,
    differs_cap11: !same(c11, c12),
    differs_cap13: !same(c13, c12),
  });
});

const result = {
  meta: {
    temat: 'R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1',
    runda: 3,
    pin_web: 'edb8fb56',
    generator: 'gen-m06b1-cap-vectors.mjs',
    cap_source: 'gen-helpers.ts:4852 `for (let pass = 0; pass < N; pass++)`: N=12 (pristine, oracle), N=11 i N=13 = kopie z jedyna zmiana N',
    search: 'm06b1-r3-cap-pick.mjs (LCG 12345, 1500 map): cap11!=cap12 na 379, cap13!=cap12 na 302, oba na 302; wybrano 10 pierwszych z obiema roznicami',
  },
  maps,
  cases,
};
writeFileSync(out, JSON.stringify(result));
console.log(JSON.stringify({ maps: maps.length, thicken: cases.thicken.map((c) => [c.id, c.differs_cap11, c.differs_cap13]) }));
