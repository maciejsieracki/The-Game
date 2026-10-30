// Wektory GRANIC (Operator-pomiary r1) dla P6.M06B1: przypadki, ktorych nie dawal generator
// `gen-m06b1-vectors.mjs` (wektory stare zostaja nietkniete; ten plik to osobny zbior):
//  (1) thicken, mapa z NATURALNIE 25 przebiegami czesci (a) (pomiar: evidence-thicken-uncapped-search.out),
//      wynik z prawdziwego weba z capem 12 (`przebiegi_wygladzania`). Pomiar r1: na tej mapie cap 11/12/13
//      i bez limitu daja TEN SAM stan koncowy (przebiegi 11..24 zmieniaja heksy; przyczyna NIE dowiedziona,
//      hipoteza: koncowy removeInlandWaterPools przejmuje te heksy) - granica capu nie jest obserwowalna na wyjsciu.
//  (2) finalize, mapa z roznica out(maxPasses=2) != out(maxPasses=1) przy maxInlandPoolSize=2
//      (evidence-finalize-pool2-search.out), dla maxPasses 1..5 i pool 2 oraz bez puli.
// URUCHAMIA prawdziwy kod TS weba (pin edb8fb56). Mapy wejsciowe: cells z plikow evidence.
// Uzycie: node --experimental-transform-types --no-warnings --import ./m06b1-loader-register.mjs \
//           ./gen-m06b1-boundary-vectors.mjs <WEB_ROOT> <RUN_DIR> <WYJSCIE.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const [root, runDir, out] = process.argv.slice(2);
if (!root || !runDir || !out) {
  console.error('uzycie: gen-m06b1-boundary-vectors.mjs <WEB_ROOT> <RUN_DIR> <WYJSCIE.json>');
  process.exit(2);
}
const G = await import(pathToFileURL(`${root}/gra/src/map/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy: TB, Nakladka: NK } = H;

const f = (x) => (Object.is(x, -0) ? '-0' : String(x));
const keyOf = (q, r) => `${q},${r}`;
function dumpObj(hexes) {
  return Object.entries(hexes).map(([k, h]) => [k, h.terenBazowy, h.nakladka, h.zloze ? 1 : 0, h.rzeka.obecna ? 1 : 0, [...h.rzeka.krawedzie]]);
}
// rows: [klucz, terenBazowy, nakladka, zloze, rzekaObecna, krawedzie]
function buildObj(rows) {
  const o = {};
  for (const [k, terr, nak, z, ro, ed] of rows) {
    const [q, r] = k.split(',').map(Number);
    o[k] = { coords: { q, r }, terenBazowy: terr, nakladka: nak, rzeka: { obecna: ro === 1, krawedzie: [...ed] }, ...(z ? { zloze: 'rudy' } : {}) };
  }
  return o;
}
// mapa z tablicy cells (indeks = q*H + r), jak w search (m06b1-boundary-search.mjs)
function rowsFromCells(W, HH, cells) {
  const rows = [];
  for (let q = 0; q < W; q++) for (let r = 0; r < HH; r++) rows.push([keyOf(q, r), cells[q * HH + r], NK.Brak, 0, 0, []]);
  return rows;
}

const readJsonLine = (file, prefix) => {
  const line = readFileSync(`${runDir}/${file}`, 'utf8').split('\n').find((l) => l.startsWith(`{"${prefix}"`));
  if (!line) throw new Error(`brak linii ${prefix} w ${file}`);
  return JSON.parse(line);
};
const thick = readJsonLine('evidence-thicken-uncapped-search.out', 'cap12_map').cap12_map;
const fin = JSON.parse(readFileSync(`${runDir}/evidence-finalize-pool2-search.out`, 'utf8').split('\n')[1]).best_map;
const thickRows = rowsFromCells(thick.W, thick.H, thick.cells);
const finRows = rowsFromCells(fin.W, fin.H, fin.cells);

const maps = [thickRows, finRows];
const cases = { thicken: [], finalize: [] };

// (1) thicken: domyslne coastWidth (2), natural 25 przebiegow, cap 12 w webie
{
  const hx = buildObj(thickRows);
  const ret = G.thickenCoastAndSmoothInlets(hx, thick.W, thick.H);
  cases.thicken.push({
    id: 'bnd-thick-natural25-default', mi: 0, W: thick.W, H: thick.H, coastWidth: 'default',
    output: { ret: f(ret), state: dumpObj(hx) },
  });
}

// (2) finalize: pool 2 (maxPasses 1..5) oraz bez puli (maxPasses 1..5), ta sama mapa
for (const pool of [2, null]) {
  for (const mp of [1, 2, 3, 4, 5]) {
    const hx = buildObj(finRows);
    G.finalizeCoastAndInlandWater(hx, fin.W, fin.H, mp, pool == null ? undefined : { maxInlandPoolSize: pool });
    cases.finalize.push({
      id: `bnd-fin-pool${pool ?? 'null'}-p${mp}`, mi: 1, W: fin.W, H: fin.H, maxPasses: mp, pool,
      output: { ret: null, state: dumpObj(hx) },
    });
  }
}

const result = {
  meta: {
    temat: 'R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1',
    pin_web: 'edb8fb56',
    generator: 'gen-m06b1-boundary-vectors.mjs',
    source_thicken: 'evidence-thicken-uncapped-search.out (naturalne przebiegi (a) = 25, cap 12)',
    source_finalize: 'evidence-finalize-pool2-search.out (out(2) != out(1) przy pool 2)',
  },
  maps,
  cases,
};
writeFileSync(out, JSON.stringify(result));
console.log(JSON.stringify({ maps: maps.length, counts: Object.fromEntries(Object.entries(cases).map(([k, v]) => [k, v.length])) }));
