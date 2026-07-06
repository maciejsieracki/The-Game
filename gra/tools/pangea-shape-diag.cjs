'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.pangea-shape-entry.ts');
const BUNDLE = path.resolve(__dirname, '.pangea-shape-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generujSwiat } from '../src/map/generator';
export { countLandSeaHexes } from '../src/map/gen-helpers';
export { TerenBazowy } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
});

const M = require(BUNDLE);
const TB = M.TerenBazowy;
const opts = {
  worldDensity: { resources: 'medium', rivers: 'high', desert: 'medium', forest: 'medium', relief: 'high' },
  mapSizeMenuLabel: 'Standardowy',
  landFraction: 0.2,
};

function analyze(map, label) {
  const { land, total } = M.countLandSeaHexes(map.hexes);
  let morse = 0, wybrzeze = 0, inlandMorse = 0;
  const w = map.szerokoscQ, h = map.wysokoscR;
  const hexes = map.hexes;

  const dist = new Map();
  const q = [];
  for (let r = 0; r < h; r++) {
    for (let x = 0; x < w; x++) {
      if (x === 0 || r === 0 || x === w - 1 || r === h - 1) {
        const k = x + ',' + r;
        if (hexes[k]?.terenBazowy === TB.Morze) { dist.set(k, 0); q.push(k); }
      }
    }
  }
  const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
  let qi = 0;
  while (qi < q.length) {
    const k = q[qi++];
    const d = dist.get(k);
    const [x, r] = k.split(',').map(Number);
    for (const [dq, dr] of dirs) {
      const nk = (x + dq) + ',' + (r + dr);
      if (dist.has(nk)) continue;
      if (hexes[nk]?.terenBazowy !== TB.Morze) continue;
      dist.set(nk, d + 1);
      q.push(nk);
    }
  }

  for (const hex of Object.values(hexes)) {
    if (hex.terenBazowy === TB.Morze) {
      morse++;
      const k = hex.coords.q + ',' + hex.coords.r;
      if (!dist.has(k)) inlandMorse++;
    } else if (hex.terenBazowy === TB.Wybrzeze) wybrzeze++;
  }

  console.log(label);
  console.log('  ląd:', (100 * land / total).toFixed(1) + '%', '(' + land + ' hex)');
  console.log('  morze:', morse, '| wybrzeże:', wybrzeze, '| odcięte morse w lądzie:', inlandMorse);
  console.log('  woda wizualna (morze+plaża):', (100 * (morse + wybrzeze) / total).toFixed(1) + '%');
}

analyze(M.generujSwiat(42, 'standardowy', 'pangea', opts), 'Pangea standard 20% seed 42');
analyze(M.generujSwiat(42, 'standardowy', 'kontynenty', opts), 'Kontynenty standard 20% seed 42');
