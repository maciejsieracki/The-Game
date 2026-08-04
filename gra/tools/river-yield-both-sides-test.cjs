'use strict';
/** node tools/river-yield-both-sides-test.cjs — bonus rzeki na obu heksach krawędzi (I1). */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.river-yield-both-sides-entry.ts');
const bundle = path.join(__dirname, '.river-yield-both-sides-bundle.cjs');

fs.writeFileSync(
  entry,
  `export { generateMap } from '../src/map/generator';
export { tileYield } from '../src/game/economy';
export { TerenBazowy, Nakladka } from '../src/types/hex';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);
const HEX_DIRECTIONS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

/** Globalna asymetria: krawędź rzeki na lądzie musi mieć obecna po OBU stronach. */
function countLandRiverEdgeAsymmetry(hexes) {
  let asym = 0;
  for (const [k, h] of Object.entries(hexes)) {
    if (!h.rzeka?.krawedzie?.length) continue;
    const [q, r] = k.split(',').map(Number);
    for (const ei of h.rzeka.krawedzie) {
      const d = HEX_DIRECTIONS[ei];
      const nk = `${q + d[0]},${r + d[1]}`;
      const nh = hexes[nk];
      if (!nh || nh.terenBazowy === M.TerenBazowy.Morze) continue;
      const eB = (ei + 3) % 6;
      if (!nh.rzeka?.krawedzie?.includes(eB)) asym++;
      if (!nh.rzeka?.obecna) asym++;
    }
  }
  return asym;
}

/** Maciej: heks A ma krawędź ei do lądowego B → B.obecna musi być true. */
function countEdgeToNeighborMissingObecna(hexes) {
  let n = 0;
  for (const [k, h] of Object.entries(hexes)) {
    if (!h.rzeka?.krawedzie?.length) continue;
    const [q, r] = k.split(',').map(Number);
    for (const ei of h.rzeka.krawedzie) {
      const d = HEX_DIRECTIONS[ei];
      const nk = `${q + d[0]},${r + d[1]}`;
      const nh = hexes[nk];
      if (!nh || nh.terenBazowy === M.TerenBazowy.Morze) continue;
      if (!nh.rzeka?.obecna) n++;
    }
  }
  return n;
}

/** Las+łąka po obu stronach wspólnej krawędzi rzeki — plony 5/6/7. */
function countMaciejForestPairs(hexes) {
  let n = 0;
  for (const [k, h] of Object.entries(hexes)) {
    if (!h.rzeka?.obecna || h.nakladka !== M.Nakladka.Las) continue;
    if (h.terenBazowy !== M.TerenBazowy.Laka) continue;
    const [q, r] = k.split(',').map(Number);
    for (let ei = 0; ei < 6; ei++) {
      if (!h.rzeka.krawedzie?.includes(ei)) continue;
      const d = HEX_DIRECTIONS[ei];
      const nk = `${q + d[0]},${r + d[1]}`;
      const nh = hexes[nk];
      if (!nh || nh.terenBazowy !== M.TerenBazowy.Laka || nh.nakladka !== M.Nakladka.Las) continue;
      const yn = M.tileYield({
        terenBazowy: nh.terenBazowy,
        nakladka: nh.nakladka,
        maRzeke: !!nh.rzeka?.obecna,
      });
      if (!nh.rzeka?.obecna || yn.zywnosc !== 5 || yn.praca !== 6 || yn.handel !== 7) n++;
    }
  }
  return n;
}

/** Ateny-case: czysta łąka przy krawędzi rzeki — 6/3/5 z bonusem, nie 3/1/2. */
function countLakaRiverEdgeYieldGaps(hexes) {
  let n = 0;
  const yRiver = M.tileYield({ terenBazowy: M.TerenBazowy.Laka, nakladka: M.Nakladka.Brak, maRzeke: true });
  const yDry = M.tileYield({ terenBazowy: M.TerenBazowy.Laka, nakladka: M.Nakladka.Brak, maRzeke: false });
  assert(yDry.zywnosc === 3 && yDry.praca === 1 && yDry.handel === 2, 'łąka bez rzeki = 3/1/2 (Ateny baseline)');
  assert(yRiver.zywnosc === 6 && yRiver.praca === 3 && yRiver.handel === 5, 'łąka z rzeką = 6/3/5');

  for (const [k, h] of Object.entries(hexes)) {
    if (h.terenBazowy !== M.TerenBazowy.Laka || h.nakladka !== M.Nakladka.Brak) continue;
    if (!h.rzeka?.krawedzie?.length) continue;
    const y = M.tileYield({
      terenBazowy: h.terenBazowy,
      nakladka: h.nakladka,
      maRzeke: !!h.rzeka?.obecna,
    });
    if (h.rzeka.obecna && (y.zywnosc !== 6 || y.praca !== 3 || y.handel !== 5)) n++;
    if (!h.rzeka.obecna) n++;
  }
  return n;
}

const map = M.generateMap(168, 120, 42, 'kontynenty', {
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
});

const asym = countLandRiverEdgeAsymmetry(map.hexes);
const edgeGap = countEdgeToNeighborMissingObecna(map.hexes);
const forestGap = countMaciejForestPairs(map.hexes);
const lakaGap = countLakaRiverEdgeYieldGaps(map.hexes);

assert(asym === 0, `symetria krawędzi ląd–ląd (asym=${asym})`);
assert(edgeGap === 0, `A ma krawędź ei → B.obecna (naruszenia=${edgeGap})`);
assert(forestGap === 0, `las+łąka po obu stronach krawędzi rzeki (naruszenia=${forestGap})`);
assert(lakaGap === 0, `łąka przy krawędzi rzeki ma bonus 6/3/5 (naruszenia=${lakaGap})`);

let synthOk = false;
for (const path of map.riverPaths ?? []) {
  if (path.length < 3) continue;
  for (let i = 1; i < path.length - 1; i++) {
    const cur = path[i];
    const prev = path[i - 1];
    const next = path[i + 1];
    const dirIn = ((q, r, nq, nr) => {
      const dq = nq - q; const dr = nr - r;
      for (let j = 0; j < 6; j++) {
        if (HEX_DIRECTIONS[j][0] === dq && HEX_DIRECTIONS[j][1] === dr) return j;
      }
      return -1;
    })(cur.q, cur.r, prev.q, prev.r);
    const dirOut = ((q, r, nq, nr) => {
      const dq = nq - q; const dr = nr - r;
      for (let j = 0; j < 6; j++) {
        if (HEX_DIRECTIONS[j][0] === dq && HEX_DIRECTIONS[j][1] === dr) return j;
      }
      return -1;
    })(cur.q, cur.r, next.q, next.r);
    if (dirIn < 0 || dirOut < 0) continue;
    const ck = `${cur.q},${cur.r}`;
    const ch = map.hexes[ck];
    if (!ch?.rzeka?.krawedzie?.length) continue;
    for (const ei of ch.rzeka.krawedzie) {
      if (ei === dirIn || ei === ((dirOut + 3) % 6)) continue;
      const d = HEX_DIRECTIONS[ei];
      const nk = `${cur.q + d[0]},${cur.r + d[1]}`;
      const nh = map.hexes[nk];
      if (nh?.terenBazowy === M.TerenBazowy.Morze) continue;
      if (nh?.rzeka?.obecna) { synthOk = true; break; }
    }
    if (synthOk) break;
  }
  if (synthOk) break;
}
assert(synthOk, 'tranzyt: sąsiad poza ścieżką ma rzeka.obecna przy krawędzi tranzytowej');

console.log(`\nriver-yield-both-sides-test: ${passed} pass, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
