'use strict';
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.ziemia-diag-entry.ts');
const bundle = path.join(__dirname, '.ziemia-diag.cjs');
fs.writeFileSync(entry, `
export { generujSwiat } from '../src/map/generator';
export { findInlandWaterHexes, findInlandSeaHexes } from '../src/map/gen-helpers';
export { earthTemplateLandAt } from '../src/map/earth-land-mask';
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent' });
const M = require(bundle);
const map = M.generujSwiat(4242, 'duzy', 'ziemia', {
  worldDensity: { resources: 'medium', rivers: 'medium', desert: 'medium', forest: 'medium', relief: 'medium' },
});
const W = map.szerokoscQ;
const H = map.wysokoscR;
const inlandW = M.findInlandWaterHexes(map.hexes, W, H);
const inlandM = M.findInlandSeaHexes(map.hexes, W, H);
let morseOnLandMask = 0;
for (const [k, h] of Object.entries(map.hexes)) {
  const [q, r] = k.split(',').map(Number);
  if (M.earthTemplateLandAt(q, r, W, H) <= 0) continue;
  if (h.terenBazowy === 'morze') morseOnLandMask++;
}
let morseInDesertRing = 0;
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
for (const [k, h] of Object.entries(map.hexes)) {
  if (h.terenBazowy !== 'morze' && h.terenBazowy !== 'wybrzeze') continue;
  const [q, r] = k.split(',').map(Number);
  let pustN = 0;
  let landN = 0;
  for (const [dq, dr] of DIRS) {
    const nh = map.hexes[`${q + dq},${r + dr}`];
    if (!nh || nh.terenBazowy === 'morze' || nh.terenBazowy === 'wybrzeze') continue;
    landN++;
    if (nh.terenBazowy === 'pustynia') pustN++;
  }
  if (landN >= 4 && pustN >= 3) morseInDesertRing++;
}
console.log(JSON.stringify({ W, H, inlandWater: inlandW.length, inlandMorse: inlandM.length, morseOnLandMask, morseInDesertRing }, null, 2));
