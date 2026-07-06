'use strict';
/** MAPA — udział lądu/morze per typ + suwak landFraction. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.land-sea-entry.ts');
const BUNDLE = path.resolve(__dirname, '.land-sea-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generujSwiat } from '../src/map/generator';
export { countLandSeaHexes, defaultLandFractionForTyp } from '../src/map/gen-helpers';
export { resolveLandFraction } from '../src/map/newGameMapDefaults';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

function landPct(map) {
  const { land, total } = M.countLandSeaHexes(map.hexes);
  return land / total;
}

const gen = (seed, typ, landFraction) => M.generujSwiat(seed, 'maly', typ, {
  worldDensity: { resources: 'medium', rivers: 'medium', desert: 'medium', forest: 'medium', relief: 'medium' },
  mapSizeMenuLabel: 'Mały',
  landFraction,
});

ok(Math.abs(M.defaultLandFractionForTyp('kontynenty') - 0.30) < 0.001, 'kontynenty default 30%');
ok(Math.abs(M.defaultLandFractionForTyp('pangea') - 0.60) < 0.001, 'pangea default 60%');
ok(Math.abs(M.defaultLandFractionForTyp('wyspy') - 0.50) < 0.001, 'wyspy default 50%');
ok(Math.abs(M.defaultLandFractionForTyp('ziemia') - 0.21) < 0.001, 'ziemia default ~21% (szablon)');

for (const typ of ['kontynenty', 'pangea', 'wyspy']) {
  const target = M.defaultLandFractionForTyp(typ);
  const map = gen(424242, typ, target);
  const pct = landPct(map);
  ok(Math.abs(pct - target) <= 0.04, `${typ}: ląd ${(pct * 100).toFixed(1)}% ~ ${(target * 100).toFixed(0)}%`);
}

// Standardowa mapa + bufor brzegu ogranicza max ląd (~51%) — suwak 70% na Super Huge.
const customHigh = M.generujSwiat(42, 'superogromny', 'kontynenty', {
  worldDensity: { resources: 'medium', rivers: 'medium', desert: 'medium', forest: 'medium', relief: 'medium' },
  mapSizeMenuLabel: 'Super Huge',
  landFraction: 0.70,
});
ok(Math.abs(landPct(customHigh) - 0.70) <= 0.04, 'suwak 70% lądu (superogromny)');

const huge = M.generujSwiat(42, 'superogromny', 'kontynenty', {
  worldDensity: { resources: 'medium', rivers: 'high', desert: 'medium', forest: 'medium', relief: 'high' },
  mapSizeMenuLabel: 'Super Huge',
  landFraction: 0.50,
});
ok(huge.szerokoscQ === 336 && huge.wysokoscR === 238, 'Super Huge 336×238');
ok(M.countLandSeaHexes(huge.hexes).total >= 79000, 'Super Huge ~80k hex');

console.log(`land-sea-ratio-test: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
