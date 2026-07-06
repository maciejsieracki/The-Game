'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.pangea-dist-entry.ts');
const BUNDLE = path.resolve(__dirname, '.pangea-dist-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generujSwiat } from '../src/map/generator';
export { TerenBazowy } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
});

const M = require(BUNDLE);
const TB = M.TerenBazowy;
const map = M.generujSwiat(42, 'standardowy', 'pangea', {
  worldDensity: { resources: 'medium', rivers: 'high', desert: 'medium', forest: 'medium', relief: 'high' },
  mapSizeMenuLabel: 'Standardowy',
  landFraction: 0.2,
});

const cx = (map.szerokoscQ - 1) / 2;
const cy = (map.wysokoscR - 1) / 2;
const buckets = [0, 0, 0, 0, 0]; // 0-0.2, 0.2-0.4, ...
let land = 0;
for (const h of Object.values(map.hexes)) {
  if (h.terenBazowy === TB.Morze) continue;
  land++;
  const dx = (h.coords.q - cx) / (cx + 0.5);
  const dy = (h.coords.r - cy) / (cy + 0.5);
  const d = Math.sqrt(dx * dx + dy * dy);
  const bi = Math.min(4, Math.floor(d * 5));
  buckets[bi]++;
}
console.log('Land hex dist from center (0=center, 4=edge):', buckets.map((n,i)=>`ring${i}:${n}(${(100*n/land).toFixed(0)}%)`).join(' '));
