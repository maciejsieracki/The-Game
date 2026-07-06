'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.pangea-step-entry.ts');
const BUNDLE = path.resolve(__dirname, '.pangea-step-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generateMap } from '../src/map/generator';
export { countLandSeaHexes } from '../src/map/gen-helpers';
export { resolveWorldGenNumbers, resolveLandFraction } from '../src/map/newGameMapDefaults';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
});

const M = require(BUNDLE);

const genOpts = {
  worldDensity: { resources: 'medium', rivers: 'high', desert: 'medium', forest: 'medium', relief: 'high' },
  mapSizeMenuLabel: 'Standardowy',
  landFraction: 0.2,
};

const map = M.generateMap(168, 120, 42, 'pangea', genOpts);
const c = M.countLandSeaHexes(map.hexes);
console.log('Final pangea 168x120 seed 42:', (100 * c.land / c.total).toFixed(2) + '% land', c.land, '/', c.total);

// masses
const visited = new Set();
let masses = 0;
const HEX = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
for (const key of Object.keys(map.hexes)) {
  if (visited.has(key)) continue;
  const h = map.hexes[key];
  if (h.terenBazowy === 0) continue; // Morse enum value - check at runtime
  masses++;
  const stack = [key];
  visited.add(key);
  while (stack.length) {
    const cur = stack.pop();
    const [q, r] = cur.split(',').map(Number);
    for (const [dq, dr] of HEX) {
      const nk = \`\${q+dq},\${r+dr}\`;
      if (visited.has(nk)) continue;
      const nh = map.hexes[nk];
      if (!nh || nh.terenBazowy === 0) continue;
      visited.add(nk);
      stack.push(nk);
    }
  }
}
console.log('Land masses:', masses);
