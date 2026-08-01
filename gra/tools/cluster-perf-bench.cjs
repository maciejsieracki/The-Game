'use strict';
/** node tools/cluster-perf-bench.cjs — FALA 164 cluster start perf */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.cluster-perf-entry.ts');
const bundle = path.join(__dirname, '.cluster-perf-bundle.cjs');

fs.writeFileSync(entry, `
import { generateMap } from '../src/map/generator';
import { buildClusterStartPlan } from '../src/game/cluster-start';
const civs = require('../data/civs.json');
export { generateMap, buildClusterStartPlan, civs };
`, 'utf8');

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
const t0 = performance.now();
const map = M.generateMap(168, 120, 424242, 'pangea');
const tMap = performance.now();
const plan = M.buildClusterStartPlan({
  map,
  civs: M.civs,
  seed: 424242,
  playerCivId: 'grecy',
  rywaleNaKlaster: 6,
  aktywneTypy: 8,
  startEpochId: 'kamien',
});
const tPlan = performance.now();
console.log('mapGen:', Math.round(tMap - t0), 'ms');
console.log('buildClusterStartPlan:', Math.round(tPlan - tMap), 'ms');
console.log('total:', Math.round(tPlan - t0), 'ms');
console.log('typy:', plan.placement.aktywneTypy, 'spawnCities:', plan.spawnCities.length);
