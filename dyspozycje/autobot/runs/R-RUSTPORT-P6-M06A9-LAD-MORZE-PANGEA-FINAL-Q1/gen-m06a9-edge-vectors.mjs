// Generator wektorow BRZEGOWYCH P6.M06A9 (runda 2, odpowiedz na zarzuty Evaluatora):
//   rodzina `prog-eps`      - fillPangeaAnnularSeaCorridors: centroid dokladnie 1/n (n = 99/100/101),
//                             heks (0,0) w odleglosci dokladnie 0.01 (n=100) / ponizej / powyzej progu
//                             `distSelf < 0.01` (gen-helpers.ts :4496). Zabija M17 (`<` -> `<=`).
//   rodzina `warstwy`       - rebalanceLandSeaRatio: pasek 100x1, ziarno ladu w srodku, cel 0.2/0.3/0.5/0.15.
//                             Liczba warstw = ceil(sqrt(100)) = 10 (gen-helpers.ts :3791 ff). Zabija M21.
// Uruchamiane z ORYGINALNEGO pinu edb8fb56 (bez instrumentacji), jak gen-m06a9-vectors.mjs.
//
// Uzycie (z katalogu tego pliku):
//   node --experimental-transform-types --no-warnings --import ./m06a-loader-register.mjs \
//        ./gen-m06a9-edge-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIOWY>
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const outDir = process.argv[3];
if (!root || !outDir) {
  console.error('uzycie: gen-m06a9-edge-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIOWY>');
  process.exit(2);
}
const mapDir = `${root}/gra/src/map`;
const GI = await import(pathToFileURL(`${mapDir}/gen-helpers.ts`).href);
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
const RUST_TO_TB = Object.fromEntries(Object.entries(TB_TO_RUST).map(([tb, n]) => [n, tb]));

const buildHexes = (order) => {
  const hexes = {};
  for (const [key, tbName] of order) {
    const [q, r] = key.split(',').map(Number);
    hexes[key] = {
      coords: { q, r },
      terenBazowy: RUST_TO_TB[tbName],
      nakladka: Nakladka.Brak,
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return hexes;
};
const hexesToOrder = (hexes) => Object.keys(hexes).map((k) => [k, TB_TO_RUST[hexes[k].terenBazowy]]);

const cases = [];
const idOf = (fam) => `${fam}-${String(cases.length).padStart(5, '0')}`;

// ---------------------------------------------------------------------------------------------
// RODZINA prog-eps: centroid = (1/n, 0). Heks (0,0) = Morze (bridge water), reszta = Laka.
// Kolumna q=0 z r in {+-1..+-m} (suma r = 0), plus heksy E z suma q = 1 i suma r = 0.
// n=101: m=50, E={(1,0)}         -> dist(0,0) = 1/101 < 0.01 (granica N-1).
// n=99 : m=49, E={(1,0)}         -> dist(0,0) = 1/99  > 0.01 (granica N+1).
// n=100 (dist == 0.01 dokladnie) -> soloCase ponizej (inny uklad, zob. komentarz tam).
// ---------------------------------------------------------------------------------------------
const epsCase = (n, m, extra, maxW) => {
  const order = [['0,0', 'Morze']];
  for (let i = 1; i <= m; i++) {
    order.push([`0,${i}`, 'Laka']);
    order.push([`0,${-i}`, 'Laka']);
  }
  for (const [q, r] of extra) order.push([`${q},${r}`, 'Laka']);
  if (order.length - 1 !== n) throw new Error(`zla liczba lądu ${order.length - 1} != ${n}`);
  // Promien do wewnatrz z (0,0) przechodzi przez (1,0): musi istniec (inaczej `nh` = undefined -> null).
  if (!extra.some(([q, r]) => q === 1 && r === 0)) order.push(['1,0', 'Morze']);
  const w = 12;
  const h = 12;
  const hexes = buildHexes(order);
  const converted = GI.fillPangeaAnnularSeaCorridors(hexes, w, h, maxW);
  return {
    id: idOf('prog-eps'),
    family: 'prog-eps',
    n,
    w,
    h,
    maxW,
    order,
    converted,
    after: hexesToOrder(hexes),
  };
};
// Przypadek KILL (n=100, dist == 0.01 dokladnie): jedyna woda to (0,0); sasiedzi (1,0) i (-1,0) sa lądem,
// wiec promien w obu kierunkach trafia lad w kroku 1; reszta lądu ma sume q = 1 (kolumna q=0 symetryczna,
// + (1,0),(-1,0),(2,1),(-1,-1)), sume r = 0 i n = 100. Dzieki temu zaden inny heks nie zmienia centroidu
// w kolejnych przebiegach: web zamienia (0,0) w przebiegu 1, mutant `<=` nie zamienia go wcale.
const soloCase = (maxW) => {
  const order = [['0,0', 'Morze']];
  for (let i = 1; i <= 48; i++) {
    order.push([`0,${i}`, 'Laka']);
    order.push([`0,${-i}`, 'Laka']);
  }
  for (const [q, r] of [[1, 0], [-1, 0], [2, 1], [-1, -1]]) order.push([`${q},${r}`, 'Laka']);
  if (order.length - 1 !== 100) throw new Error('solo: n != 100');
  const w = 12;
  const h = 12;
  const hexes = buildHexes(order);
  const converted = GI.fillPangeaAnnularSeaCorridors(hexes, w, h, maxW);
  return { id: idOf('prog-eps'), family: 'prog-eps', n: 100, w, h, maxW, order, converted, after: hexesToOrder(hexes) };
};
cases.push(epsCase(99, 49, [[1, 0]], 4));
cases.push(soloCase(4));
cases.push(epsCase(101, 50, [[1, 0]], 4));
// Ten sam przypadek KILL z maxW = 2 i 6.
cases.push(soloCase(2));
cases.push(soloCase(6));

// ---------------------------------------------------------------------------------------------
// RODZINA warstwy: pasek 100x1, ziarno Laka w (50,0), reszta Morze. total = 100, max_layers = 10.
// ---------------------------------------------------------------------------------------------
const ratioCase = (w, h, target, order) => {
  const hexes = buildHexes(order);
  const adjusted = GI.rebalanceLandSeaRatio(hexes, w, h, target);
  return { id: idOf('warstwy'), family: 'warstwy', w, h, target, order, adjusted, after: hexesToOrder(hexes) };
};
const stripOrder = () => {
  const order = [];
  for (let q = 0; q < 100; q++) order.push([`${q},0`, q === 50 ? 'Laka' : 'Morze']);
  return order;
};
for (const target of [0.15, 0.2, 0.3, 0.5]) {
  cases.push(ratioCase(100, 1, target, stripOrder()));
}

const meta = (rodziny) => ({
  generator: 'gen-m06a9-edge-vectors.mjs',
  run: 'R-RUSTPORT-P6-M06A9-LAD-MORZE-PANGEA-FINAL-Q1',
  pin: 'edb8fb56',
  rodziny,
});
const famCounts = (xs) => xs.reduce((acc, c) => ((acc[c.family] = (acc[c.family] ?? 0) + 1), acc), {});

writeFileSync(`${outDir}/edge-vectors.json`, JSON.stringify({
  meta: meta(famCounts(cases)),
  cases,
}, null, 1));
console.log('OK', { cases: cases.length, rodziny: famCounts(cases) });
console.log('sha256 edge-vectors.json (informacja)');
