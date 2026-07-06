'use strict';
/** Profil czasu generateMap — porównanie rozmiarów. */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.map-gen-profile-entry.ts');
const BUNDLE = path.resolve(__dirname, '.map-gen-profile-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import { generateMap } from '../src/map/generator';
export { generateMap };`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const M = require(BUNDLE);

const cases = [
  { w: 168, h: 120, typ: 'kontynenty', label: 'Standard kontynenty' },
  { w: 336, h: 238, typ: 'ziemia', label: 'Ogromny Ziemia' },
];

for (const { w, h, typ, label } of cases) {
  const t0 = Date.now();
  M.generateMap(w, h, 42, typ, {
    mapSizeMenuLabel: w >= 300 ? 'Ogromny' : 'Standardowy',
    worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
  });
  console.log(`${label}: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
