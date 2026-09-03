'use strict';
/** Brak samotnego lądu (pustynia/łąka) w otwartym oceanie po finalnym wybrzeżu. */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.stranded-land-entry.ts');
const BUNDLE = path.resolve(__dirname, '.stranded-land-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generateMap } from '../src/map/generator';
export { countOpenOceanLandSpecks } from '../src/map/gen-helpers';
export { TerenBazowy } from '../src/types/hex';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
const { TerenBazowy } = M;

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log('PASS:', msg);
  } else {
    fail++;
    console.error('FAIL:', msg);
  }
}

function countPustyniaInOcean(hexes) {
  let n = 0;
  for (const hex of Object.values(hexes)) {
    if (hex.terenBazowy !== TerenBazowy.Pustynia) continue;
    const { q, r } = hex.coords;
    let dry = 0;
    for (const [dq, dr] of [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]]) {
      const nh = hexes[`${q + dq},${r + dr}`];
      if (nh && nh.terenBazowy !== TerenBazowy.Morze && nh.terenBazowy !== TerenBazowy.PlytkieMorze) {
        dry++;
      }
    }
    if (dry === 0) n++;
  }
  return n;
}

const cases = [
  { w: 168, h: 120, typ: 'kontynenty', seeds: [42, 7, 99, 12345], label: 'Standard kontynenty' },
  { w: 168, h: 120, typ: 'pangea', seeds: [42, 11], label: 'Standard pangea' },
  { w: 108, h: 74, typ: 'wyspy', seeds: [42], label: 'Mały wyspy' },
  { w: 168, h: 120, typ: 'ziemia', seeds: [7, 42], label: 'Standard Ziemia' },
];

for (const { w, h, typ, seeds, label } of cases) {
  for (const seed of seeds) {
    const map = M.generateMap(w, h, seed, typ, {
      mapSizeMenuLabel: w >= 168 ? 'Standardowy' : 'Mały',
      worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
    });
    const specks = M.countOpenOceanLandSpecks(map.hexes);
    const pustOcean = countPustyniaInOcean(map.hexes);
    ok(specks === 0, `${label} seed=${seed}: brak lądu w otwartym oceanie (specks=${specks})`);
    ok(pustOcean === 0, `${label} seed=${seed}: brak pustyni w oceanie (n=${pustOcean})`);
  }
}

console.log(`\nstranded-land-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
