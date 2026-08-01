'use strict';
/** Profil faz rzek — Duży kontynenty 240×168 seed 42. Timeout 180s zewnętrzny. */
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '_tmp-river-phase-timing-entry.ts');
const BUNDLE = path.join(__dirname, '_tmp-river-phase-timing-bundle.cjs');

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

require(BUNDLE);
