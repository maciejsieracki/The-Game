'use strict';
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.river-asym-entry.ts');
const bundle = path.join(__dirname, '.river-asym-bundle.cjs');

fs.writeFileSync(
  entry,
  `export { generateMap } from '../src/map/generator';`,
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

const map = M.generateMap(168, 120, 42, 'kontynenty', {
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
});

let asym = 0;
let sym = 0;
let yieldAsym = 0;
const examples = [];

for (const [k, h] of Object.entries(map.hexes)) {
  if (!h.rzeka?.krawedzie?.length) continue;
  const [q, r] = k.split(',').map(Number);
  for (const ei of h.rzeka.krawedzie) {
    const d = HEX_DIRECTIONS[ei];
    const nk = `${q + d[0]},${r + d[1]}`;
    const nh = map.hexes[nk];
    if (!nh) continue;
    const eB = (ei + 3) % 6;
    const bHas = nh.rzeka?.krawedzie?.includes(eB);
    if (bHas) sym++;
    else {
      asym++;
      if (examples.length < 5) {
        examples.push({ k, nk, ei, eB, aObecna: h.rzeka.obecna, bObecna: nh.rzeka?.obecna });
      }
    }
    if (nh.terenBazowy !== 'morze' && !nh.rzeka?.obecna) yieldAsym++;
  }
}

console.log('symmetric:', sym, 'asymmetric:', asym, 'yieldAsym (land neighbor without obecna):', yieldAsym);
console.log('examples:', JSON.stringify(examples, null, 2));

let pathNeighborAsym = 0;
const pathExamples = [];
for (const [k, h] of Object.entries(map.hexes)) {
  if (!h.rzeka?.obecna) continue;
  const [q, r] = k.split(',').map(Number);
  for (let ei = 0; ei < 6; ei++) {
    const d = HEX_DIRECTIONS[ei];
    const nk = `${q + d[0]},${r + d[1]}`;
    const nh = map.hexes[nk];
    if (!nh || nh.terenBazowy === 'morze') continue;
    if (nh.rzeka?.obecna) continue;
    const riverEdge = h.rzeka.krawedzie?.includes(ei);
    pathNeighborAsym++;
    if (pathExamples.length < 8) {
      pathExamples.push({ riverHex: k, dryNeighbor: nk, riverEdgeOnSharedSide: riverEdge });
    }
  }
}
console.log('adjacent: river hex vs dry land neighbor:', pathNeighborAsym);
console.log('pathExamples:', JSON.stringify(pathExamples, null, 2));
