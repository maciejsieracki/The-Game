'use strict';
/** Rzeki: każda para kolejnych hexów w riverPaths musi być sąsiednia (dist=1). */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.river-path-entry.ts');
const BUNDLE = path.resolve(__dirname, '.river-path-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generateMap } from '../src/map/generator';
export { assertRiverPathAdjacent } from '../src/map/gen-helpers';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) pass++; else { fail++; console.error('FAIL:', msg); } }

const seeds = [1, 7, 42, 99, 2026];
const sizes = [
  [84, 60],
  [168, 120],
  [240, 168],
];

for (const [w, h] of sizes) {
  for (const seed of seeds) {
    const map = M.generateMap(w, h, seed);
    for (let pi = 0; pi < map.riverPaths.length; pi++) {
      const path = map.riverPaths[pi];
      ok(path.length >= 2, `${w}x${h} seed ${seed} path ${pi}: za krótka`);
      ok(
        M.assertRiverPathAdjacent(path),
        `${w}x${h} seed ${seed} path ${pi}: niesąsiedni krok w trasie (${path.length} hex)`,
      );
    }
  }
}

console.log(`river-path-adjacency-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
