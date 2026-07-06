'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.pangea-land-entry.ts');
const BUNDLE = path.resolve(__dirname, '.pangea-land-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generujSwiat } from '../src/map/generator';
export { countLandSeaHexes } from '../src/map/gen-helpers';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
});

const M = require(BUNDLE);

function landPct(map) {
  const { land, total } = M.countLandSeaHexes(map.hexes);
  return (100 * land / total).toFixed(1);
}

const opts = {
  worldDensity: { resources: 'medium', rivers: 'high', desert: 'medium', forest: 'medium', relief: 'high' },
  mapSizeMenuLabel: 'Standardowy',
  landFraction: 0.2,
};

console.log('=== Pangea standard 20% ===');
for (const seed of [1, 7, 42, 99, 2026, 7777]) {
  const m = M.generujSwiat(seed, 'standardowy', 'pangea', opts);
  console.log(`seed ${seed}: ${landPct(m)}% land (${m.szerokoscQ}x${m.wysokoscR})`);
}

console.log('=== Kontynenty standard 20% (porownanie) ===');
for (const seed of [42]) {
  const m = M.generujSwiat(seed, 'standardowy', 'kontynenty', opts);
  console.log(`seed ${seed}: ${landPct(m)}% land`);
}

console.log('=== Pangea bez landFraction (default) ===');
const def = { ...opts };
delete def.landFraction;
const m = M.generujSwiat(42, 'standardowy', 'pangea', def);
console.log(`seed 42 default: ${landPct(m)}% land`);
