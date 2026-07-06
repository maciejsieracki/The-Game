'use strict';
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const fs = require('fs');
const BUNDLE = path.resolve(__dirname, '.river-count.cjs');
fs.writeFileSync(path.resolve(__dirname, '.river-count-e.ts'), "export { generateMap } from '../src/map/generator'; export { groupLandMassKeys } from '../src/map/gen-helpers';", 'utf8');
esbuild.buildSync({ entryPoints: [path.resolve(__dirname, '.river-count-e.ts')], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE, logLevel: 'silent' });
const M = require(BUNDLE);
const opts = { mapSizeMenuLabel: 'Standardowy', worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' } };
for (const typ of ['kontynenty', 'ziemia']) {
  const m = M.generateMap(168, 120, 42, typ, opts);
  let rzeka = 0;
  for (const h of Object.values(m.hexes)) if (h.rzeka?.obecna) rzeka++;
  const mains = m.riverPathKinds.filter((k) => k === 'main').length;
  console.log(typ, { paths: m.riverPaths.length, mains, rzekaHex: rzeka });
  const masses = M.groupLandMassKeys(m.hexes).filter((mass) => mass.length >= 8).sort((a, b) => b.length - a.length);
  console.log('  masses:', masses.length, 'sizes:', masses.slice(0, 6).map((m) => m.length).join(','));
  const srcQ = new Set();
  for (let i = 0; i < m.riverPaths.length; i++) {
    if (m.riverPathKinds[i] !== 'main') continue;
    const p0 = m.riverPaths[i][0];
    if (p0) srcQ.add(`${p0.q},${p0.r}`);
  }
  console.log('  main sources:', [...srcQ].slice(0, 10).join(' | '));
}
