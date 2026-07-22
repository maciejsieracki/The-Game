'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.join(__dirname, '.gate-entry.ts');
const bundle = path.join(__dirname, '.gate-bundle.cjs');
fs.writeFileSync(entry, `export { buildingRequiredActiveLabels } from '../src/game/building-resource-gate';`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, logLevel: 'silent' });
const G = require(bundle);
const buildings = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/buildings.json'), 'utf8'));
for (const x of buildings.filter(b => !b.suppressed)) {
  const ep = x.epokaWejscia || 1;
  const req = G.buildingRequiredActiveLabels({
    id: x.id,
    epokaWejscia: ep,
    wymaganySurowiec: x.wymaganySurowiec || null,
  });
  console.log(`${x.id}\tep${ep}\t${x.kosztBudowy}\t${req.join(' + ')}`);
}
