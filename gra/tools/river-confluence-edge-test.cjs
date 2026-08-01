'use strict';
/** Konfluencja: wspólna krawędź dopływu z siecią + ciągłość krawędzi (I1/I2). */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.river-confluence-edge-entry.ts');
const BUNDLE = path.resolve(__dirname, '.river-confluence-edge-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generujSwiat } from '../src/map/generator';
export { checkRiverEdgeContinuity, checkTributaryJunctions } from '../src/map/gen-helpers';`,
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
let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) pass++;
  else {
    fail++;
    console.error('FAIL:', msg);
  }
}

const seeds = [42];
const types = ['kontynenty'];

for (const seed of seeds) {
  for (const typ of types) {
    const map = M.generujSwiat(seed, 'maly', typ, {
      worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
    });
    const W = map.szerokoscQ;
    const H = map.wysokoscR;
    const paths = map.riverPaths ?? [];
    const kinds = map.riverPathKinds ?? [];
    const edge = M.checkRiverEdgeContinuity(paths, map.hexes);
    const junction = M.checkTributaryJunctions(paths, kinds, map.hexes, W, H);
    ok(edge.ok, `seed ${seed} ${typ} edge continuity: ${edge.firstFail ?? edge.violations}`);
    ok(junction.ok, `seed ${seed} ${typ} junction: ${junction.firstFail ?? junction.violations}`);
  }
}

console.log(`river-confluence-edge-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
