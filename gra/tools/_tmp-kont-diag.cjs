'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require('path').resolve(__dirname, '..', 'node_modules', 'esbuild');

const esb = require(esbuild);
const ENTRY = path.resolve(__dirname, '._tmp-kont-diag-entry.ts');
const BUNDLE = path.resolve(__dirname, '._tmp-kont-diag-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generateMap } from '../src/map/generator';
export { groupLandMassKeys, maxDryLowlandPatchSize, maxLandHexDistanceToRiver } from '../src/map/gen-helpers';`,
  'utf8',
);

esb.buildSync({
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
const map = M.generateMap(168, 120, 42, 'kontynenty', {
  mapSizeMenuLabel: 'Standardowy',
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
});
const masses = M.groupLandMassKeys(map.hexes).filter((m) => m.length >= 8).sort((a, b) => b.length - a.length);
console.log('mass count:', masses.length);
for (const m of masses) {
  if (m.length < 150) continue;
  const dry = M.maxDryLowlandPatchSize(m, map.hexes);
  const prox = M.maxLandHexDistanceToRiver(m, map.hexes);
  console.log(`mass ${m.length} hex: dry=${dry} prox=${prox} huge=${m.length >= 4800}`);
}
