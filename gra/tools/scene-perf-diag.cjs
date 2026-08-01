'use strict';
/** Diag: liczba ścieżek rzek + czas pre-passów buildScene (bez WebGL). */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.scene-perf-diag-entry.ts');
const BUNDLE = path.join(__dirname, '.scene-perf-diag-bundle.cjs');

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
const DENSITY = { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' };

function msSince(t0) {
  return (performance.now() - t0).toFixed(0);
}

function analyzeMap(map, label) {
  const paths = map.riverPaths ?? [];
  const kinds = map.riverPathKinds ?? [];
  let main = 0, med = 0, trib = 0, short = 0;
  let maxLen = 0, sumLen = 0, over512 = 0, over480land = 0;
  for (let i = 0; i < paths.length; i++) {
    const p = paths[i] ?? [];
    const k = kinds[i] ?? 'main';
    if (k === 'main') main++;
    else if (k === 'medium') med++;
    else if (k === 'tributary') trib++;
    else short++;
    const len = p.length;
    sumLen += len;
    if (len > maxLen) maxLen = len;
    if (len > 512) over512++;
    const land = M.landRiverRenderPath(map.hexes, p);
    if (land.length > 480) over480land++;
  }
  const hexCount = Object.keys(map.hexes).length;

  let t0 = performance.now();
  M.computeRiverMouthEdgeKeys(map);
  const mouthMs = msSince(t0);

  t0 = performance.now();
  M.computeRiverDeltaHexKeys(map);
  const deltaMs = msSince(t0);

  console.log(`\n=== ${label} ===`);
  console.log(`  hexy: ${hexCount}  ścieżki: ${paths.length} (main=${main} med=${med} trib=${trib} short=${short})`);
  console.log(`  długość: avg=${(sumLen / Math.max(1, paths.length)).toFixed(1)} max=${maxLen} >512=${over512} land>480=${over480land}`);
  console.log(`  computeRiverMouthEdgeKeys: ${mouthMs}ms`);
  console.log(`  computeRiverDeltaHexKeys: ${deltaMs}ms`);
}

const cases = [
  ['duzy', 'pangea', 42],
  ['duzy', 'ziemia', 42],
  ['duzy', 'pangea', 7],
  ['standardowy', 'pangea', 42],
];

console.log('Scene pre-pass diag (mapgen + mouth/delta cache)');
for (const [roz, typ, seed] of cases) {
  const t0 = performance.now();
  const map = M.generujSwiat(seed, roz, typ, { worldDensity: DENSITY });
  const genMs = msSince(t0);
  analyzeMap(map, `${roz}/${typ} seed=${seed} (gen ${genMs}ms)`);
}
