'use strict';
/** node tools/river-density-test.cjs — liczba rzek vs heksy z rzeką (regresja gęstości). */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.river-density-entry.ts');
const bundle = path.join(__dirname, '.river-density-bundle.cjs');

fs.writeFileSync(
  entry,
  `export { generateMap } from '../src/map/generator';
export { resolveWorldGenNumbers } from '../src/map/newGameMapDefaults';`,
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

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

const wgn = M.resolveWorldGenNumbers({
  mapSizeMenuLabel: 'Standardowy',
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
});

console.log('river-density-test (Standardowy, rzeki=medium)\n');
console.log('configured maxRivers:', wgn.maxRivers);

const map = M.generateMap(168, 120, 4242, 'kontynenty', {
  mapSizeMenuLabel: 'Standardowy',
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
});

const paths = map.riverPaths ?? [];
let edgeHexes = 0;
for (const h of Object.values(map.hexes)) {
  if (h.rzeka?.obecna) edgeHexes++;
}

console.log('riverPaths count:', paths.length);
console.log('hexes with rzeka.obecna:', edgeHexes);
console.log('');

assert(paths.length >= 120, `≥120 tras rzek (${paths.length})`);
assert(edgeHexes >= 600, `≥600 heksów z krawędzią rzeki (${edgeHexes})`);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
