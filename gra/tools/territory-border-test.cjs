'use strict';
/** MAPA: kontury granic państwa — pętle obwodu z krawędzi heksów. */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.territory-border-entry.ts');
const BUNDLE = path.join(__dirname, '.territory-border-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  collectTerritoryBoundaryEdges,
  traceTerritoryBoundaryLoops,
  computeTerritoryBorderLoops,
  makeAxialHexCenterFn,
} from '../src/map/territory-border';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  loader: { '.ts': 'ts', '.json': 'json' },
  logLevel: 'silent',
});

const M = require(BUNDLE);
const center = M.makeAxialHexCenterFn();

let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log('  OK', msg);
  } else {
    fail++;
    console.error('FAIL', msg);
  }
}

// Pojedynczy heks → 1 pętla, 6 wierzchołków.
{
  const keys = new Set(['0,0']);
  const loops = M.computeTerritoryBorderLoops(keys, center);
  ok(loops.length === 1, 'single hex → 1 loop');
  ok(loops[0].length === 6, 'single hex loop has 6 vertices');
}

// Dwa sąsiednie heksy → 1 pętla obejmująca oba (10 wierzchołków).
{
  const keys = new Set(['0,0', '1,0']);
  const loops = M.computeTerritoryBorderLoops(keys, center);
  ok(loops.length === 1, 'two adjacent hexes → 1 loop');
  ok(loops[0].length === 10, 'two hex loop has 10 vertices');
}

// Wyspa oddzielona → 2 pętle.
{
  const keys = new Set(['0,0', '5,5']);
  const loops = M.computeTerritoryBorderLoops(keys, center);
  ok(loops.length === 2, 'two islands → 2 loops');
  ok(loops.every(l => l.length === 6), 'each island loop has 6 vertices');
}

// Wszystkie krawędzie zużyte w pętlach.
{
  const keys = new Set(['0,0', '1,0', '0,1']);
  const edges = M.collectTerritoryBoundaryEdges(keys, center);
  const loops = M.traceTerritoryBoundaryLoops(edges);
  const usedVerts = loops.reduce((s, l) => s + l.length, 0);
  ok(edges.length >= 6, 'triangle cluster has boundary edges');
  ok(loops.length >= 1, 'triangle cluster has at least 1 loop');
  ok(usedVerts >= 6, 'loop vertices cover boundary');
}

console.log(`\nterritory-border-test: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
