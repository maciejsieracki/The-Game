'use strict';
const path = require('path');
const esbuild = require('esbuild');
const GRA = path.resolve(__dirname, '..');
const BUNDLE = path.join(__dirname, '_tmp-outlet-smoke-bundle.cjs');
esbuild.buildSync({
  entryPoints: [path.join(__dirname, '_tmp-outlet-smoke-entry.ts')],
  bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, absWorkingDir: GRA,
  loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent',
});
require(BUNDLE);
