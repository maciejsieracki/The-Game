'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ENTRY = path.resolve(__dirname, '.inland-diag-entry.ts');
const BUNDLE = path.resolve(__dirname, '.inland-diag.cjs');
fs.writeFileSync(ENTRY, `
export { findInlandSeaHexes, findInlandWaterHexes, findDryLandTouchingSea } from '../src/map/gen-helpers';
export { generujSwiat } from '../src/map/generator';
export { TerenBazowy } from '../src/types/hex';
`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'] });
const M = require(BUNDLE);
const TB = M.TerenBazowy;
const opts = { mapSizeMenuLabel: 'Super Huge', landFraction: 0.5, worldDensity: { resources: 'medium', rivers: 'high', desert: 'medium', forest: 'medium', relief: 'high' } };
for (const seed of [1, 42, 777]) {
  const map = M.generujSwiat(seed, 'superogromny', 'kontynenty', opts);
  const W = map.szerokoscQ, H = map.wysokoscR;
  const inlandM = M.findInlandSeaHexes(map.hexes, W, H);
  const inlandW = M.findInlandWaterHexes(map.hexes, W, H);
  const bad = M.findDryLandTouchingSea(map.hexes);
  let morse = 0, wy = 0;
  for (const h of Object.values(map.hexes)) {
    if (h.terenBazowy === TB.Morze) morse++;
    if (h.terenBazowy === TB.Wybrzeze) wy++;
  }
  console.log({ seed, inlandMorse: inlandM.length, inlandWater: inlandW.length, dryTouchSea: bad.length, morse, wy });
  if (inlandW.length > 0) console.log('  sample inland water:', inlandW.slice(0, 5));
}
