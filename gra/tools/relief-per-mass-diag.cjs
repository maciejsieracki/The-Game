'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.relief-mass-entry.ts');
const BUNDLE = path.resolve(__dirname, '.relief-mass.cjs');

fs.writeFileSync(ENTRY, `
export { generujSwiat } from '../src/map/generator';
export { groupLandMassKeys } from '../src/map/gen-helpers';
export { TerenBazowy } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
const TB = M.TerenBazowy;
const opts = {
  worldDensity: { resources: 'medium', rivers: 'high', desert: 'medium', forest: 'medium', relief: 'high' },
  mapSizeMenuLabel: 'Standardowy',
  landFraction: 0.5,
};

const map = M.generujSwiat(42, 'standardowy', 'kontynenty', opts);
const masses = M.groupLandMassKeys(map.hexes).filter(m => m.length >= 30).sort((a, b) => b.length - a.length);

let inlandSea = 0;
for (const h of Object.values(map.hexes)) {
  if (h.terenBazowy === TB.Morze) {
    // count inland morse via BFS from border would be heavy — skip
  }
}

console.log('Large land masses (>=30 hex), seed 42 standard high relief:');
for (const mass of masses.slice(0, 8)) {
  let g = 0, w = 0, wy = 0;
  for (const k of mass) {
    const h = map.hexes[k];
    if (h.terenBazowy === TB.Gory) g++;
    if (h.terenBazowy === TB.Wzgorza) w++;
    if (h.terenBazowy === TB.Wybrzeze) wy++;
  }
  console.log({ size: mass.length, gory: g, wzgorza: w, wybrzeze: wy });
}

const wyTotal = Object.values(map.hexes).filter(h => h.terenBazowy === TB.Wybrzeze).length;
console.log('Total wybrzeze hexes:', wyTotal);
