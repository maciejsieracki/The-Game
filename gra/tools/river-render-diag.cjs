'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.river-render-entry.ts');
const BUNDLE = path.resolve(__dirname, '.river-render.cjs');

fs.writeFileSync(ENTRY, `
export { generujSwiat } from '../src/map/generator';
export { TerenBazowy } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
const TB = M.TerenBazowy;

function simBuildRiverPoints(map, path) {
  let validPts = 0;
  let nullY = 0;
  for (let i = 0; i < path.length; i++) {
    const ph = path[i];
    const h = map.hexes[\`\${ph.q},\${ph.r}\`];
    if (!h || h.terenBazowy === TB.Morze) { nullY++; continue; }
    validPts++;
  }
  return { len: path.length, validPts, nullY, wouldRender: validPts >= 2 };
}

const opts = {
  worldDensity: { resources: 'medium', rivers: 'high', desert: 'medium', forest: 'medium', relief: 'high' },
  mapSizeMenuLabel: 'Standardowy',
};
const map = M.generujSwiat(42, 'standardowy', 'kontynenty', opts);
const paths = map.riverPaths ?? [];
let renderOk = 0, renderFail = 0;
let rzekaHex = 0;
for (const h of Object.values(map.hexes)) {
  if (h.rzeka?.obecna) rzekaHex++;
}
for (const p of paths) {
  const s = simBuildRiverPoints(map, p);
  if (s.wouldRender && p.length >= 2) renderOk++;
  else renderFail++;
}
console.log('standard high:', { paths: paths.length, rzekaHex, renderOk, renderFail, avgLen: paths.length ? (paths.reduce((a,p)=>a+p.length,0)/paths.length).toFixed(1) : 0 });
if (paths[0]) console.log('  sample path[0] len', paths[0].length, simBuildRiverPoints(map, paths[0]));

const superOpts = { ...opts, mapSizeMenuLabel: 'Super Huge' };
const smap = M.generujSwiat(42, 'superogromny', 'kontynenty', superOpts);
const spaths = smap.riverPaths ?? [];
let sOk = 0, sFail = 0;
for (const p of spaths) {
  const s = simBuildRiverPoints(smap, p);
  if (s.wouldRender && p.length >= 2) sOk++; else sFail++;
}
console.log('super high:', { paths: spaths.length, renderOk: sOk, renderFail: sFail });
