'use strict';
/** Jednorazowy profil czasu generateMap — Mały + Standard, seed 42. */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.map-gen-profile-entry.ts');
const BUNDLE = path.join(__dirname, '.map-gen-profile-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import { generujSwiat } from '../src/map/generator';
import { resolveRiverMapParams } from '../src/map/newGameMapDefaults';
import { rozmiarToDims } from '../src/map/generator';
export { generujSwiat, resolveRiverMapParams, rozmiarToDims };`,
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
const DENSITY = { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' };

function bench(rozmiar, label) {
  const { w, h } = M.rozmiarToDims(rozmiar);
  const params = M.resolveRiverMapParams('medium', w, h);
  const t0 = Date.now();
  const map = M.generujSwiat(42, rozmiar, 'kontynenty', { worldDensity: DENSITY });
  const ms = Date.now() - t0;
  const mains = (map.riverPathKinds || []).filter((k) => k === 'main').length;
  const tribs = (map.riverPathKinds || []).filter((k) => k === 'tributary').length;
  console.log(`\n=== ${label} (${w}×${h}) ===`);
  console.log(`  total: ${(ms / 1000).toFixed(2)}s`);
  console.log(`  areaScale=${params.areaScale.toFixed(3)} mainCell=${params.mainCell} tribCell=${params.tributaryCell}`);
  console.log(`  feederPasses=${params.feederPasses} topUpPasses=${params.topUpPasses}`);
  console.log(`  rivers: main=${mains} tributary=${tribs} total=${map.riverPaths?.length ?? 0}`);
  return ms;
}

console.log('Map gen profile seed=42 kontynenty rivers=medium');
const tMaly = bench('maly', 'Mały');
const tStd = bench('standardowy', 'Standardowy');
console.log(`\nRatio Standard/Mały: ${(tStd / tMaly).toFixed(2)}×`);
