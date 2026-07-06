'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.relief-diag-entry.ts');
const BUNDLE = path.resolve(__dirname, '.relief-diag.cjs');

fs.writeFileSync(ENTRY, `
export { generujSwiat } from '../src/map/generator';
export { resolveWorldGenNumbers } from '../src/map/newGameMapDefaults';
export { TerenBazowy } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
const TB = M.TerenBazowy;

function stats(map) {
  let g = 0, w = 0, rivHex = 0, land = 0;
  for (const h of Object.values(map.hexes)) {
    if (h.terenBazowy !== TB.Morze) land++;
    if (h.terenBazowy === TB.Gory) g++;
    if (h.terenBazowy === TB.Wzgorza) w++;
    if (h.rzeka?.obecna) rivHex++;
  }
  const riv = map.riverPaths?.length ?? 0;
  return {
    land, g, w, relief: g + w,
    reliefPct: land ? ((g + w) / land * 100).toFixed(1) : '0',
    riv, rivHex,
    total: Object.keys(map.hexes).length,
  };
}

const highOpts = {
  worldDensity: { resources: 'medium', rivers: 'high', desert: 'medium', forest: 'medium', relief: 'high' },
  mapSizeMenuLabel: 'Super Huge',
  landFraction: 0.5,
};
const wgn = M.resolveWorldGenNumbers(highOpts);
console.log('config maxRivers=', wgn.maxRivers, 'mtn=', wgn.mountainThreshold, 'hi=', wgn.highlandThreshold, 'trace=', wgn.riverTrace);

for (const seed of [1, 42, 777]) {
  const m = M.generujSwiat(seed, 'superogromny', 'kontynenty', highOpts);
  console.log('super high seed', seed, stats(m));
}

const stdHigh = { ...highOpts, mapSizeMenuLabel: 'Standardowy' };
console.log('standard high seed 42', stats(M.generujSwiat(42, 'standardowy', 'kontynenty', stdHigh)));

const stdMed = {
  worldDensity: { resources: 'medium', rivers: 'medium', desert: 'medium', forest: 'medium', relief: 'medium' },
  mapSizeMenuLabel: 'Standardowy',
};
console.log('standard med seed 42', stats(M.generujSwiat(42, 'standardowy', 'kontynenty', stdMed)));
