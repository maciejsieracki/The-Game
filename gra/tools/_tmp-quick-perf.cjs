'use strict';
const path = require('path');
const esbuild = require('esbuild');
const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '_tmp-quick-perf-entry.ts');
const BUNDLE = path.join(__dirname, '_tmp-quick-perf-bundle.cjs');
process.env.CIV_RIVER_PROFILE = '1';
esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  loader: { '.ts': 'ts', '.json': 'json' },
  logLevel: 'silent',
});
for (const typ of ['pangea', 'ziemia', 'kontynenty']) {
  console.log('\n--- ' + typ + ' ---');
  process.env.CIV_WORLD_TYP = typ;
  delete require.cache[require.resolve(BUNDLE)];
  require(BUNDLE);
}
