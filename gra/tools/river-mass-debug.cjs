'use strict';
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const fs = require('fs');
const BUNDLE = path.resolve(__dirname, '.river-mass-debug.cjs');
fs.writeFileSync(path.resolve(__dirname, '.river-mass-debug-e.ts'), `export { generateMap } from '../src/map/generator';
export { groupLandMassKeys, buildSeaDistanceField, traceRiver, pathEndsAtSea, riverPathRespectsSeaBuffer, landMassHasMainRiver, hexKey, parseHexKey } from '../src/map/gen-helpers';`, 'utf8');
esbuild.buildSync({ entryPoints: [path.resolve(__dirname, '.river-mass-debug-e.ts')], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE, logLevel: 'silent' });
const M = require(BUNDLE);
const map = M.generateMap(168, 120, 42, 'ziemia', { mapSizeMenuLabel: 'Standardowy', worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' } });
const seaDist = M.buildSeaDistanceField(map.hexes);
const masses = M.groupLandMassKeys(map.hexes).filter((m) => m.length >= 80).sort((a, b) => b.length - a.length);
const kinds = map.riverPathKinds;
for (const mass of masses) {
  const has = M.landMassHasMainRiver(mass, map.riverPaths, kinds);
  console.log('\nmass', mass.length, 'hasMain', has);
  if (has) continue;
  let best = null;
  for (const key of mass) {
    const d = seaDist.get(key) ?? 0;
    if (d < 2) continue;
    if (!best || d > best.d) {
      const [q, r] = key.split(',').map(Number);
      best = { key, d, q, r };
    }
  }
  if (!best) { console.log('  no inland hex'); continue; }
  const path = M.traceRiver(map.hexes, best.q, best.r, 120, { seaDist, rand: () => 0.5, minLen: 4 });
  console.log('  best', best.key, 'd=', best.d, 'pathLen', path.length);
  console.log('  endsSea', M.pathEndsAtSea(map.hexes, path));
  console.log('  seaBuffer', M.riverPathRespectsSeaBuffer(map.hexes, path, seaDist));
  if (path.length >= 2) {
    const last = path[path.length - 1];
    const h = map.hexes[M.hexKey(last.q, last.r)];
    console.log('  last teren', h?.terenBazowy, 'coords', last.q, last.r);
  }
}
