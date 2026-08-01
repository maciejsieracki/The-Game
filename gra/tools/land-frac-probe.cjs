'use strict';
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.land-frac-probe-entry.ts');
const bundle = path.join(__dirname, '.land-frac-probe-bundle.cjs');

fs.writeFileSync(
  entry,
  "export { generateMap } from '../src/map/generator';\n" +
    "export { countLandSeaHexes } from '../src/map/gen-helpers';\n",
);

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);

function pct(map) {
  const c = M.countLandSeaHexes(map.hexes);
  return { land: c.land, sea: c.sea, pct: +(100 * c.land / c.total).toFixed(1) };
}

for (const typ of ['kontynenty', 'pangea']) {
  for (const lf of [0.2, 0.3, 0.4, 0.6]) {
    const map = M.generateMap(84, 60, 4242, typ, { landFraction: lf });
    const got = pct(map);
    const target = Math.round(lf * 100);
    const delta = +(got.pct - target).toFixed(1);
    const ok = Math.abs(delta) <= 5 ? 'OK' : 'FAIL';
    console.log(typ, 'target', target + '%', 'got', got.pct + '%', 'delta', delta, ok);
  }
}
