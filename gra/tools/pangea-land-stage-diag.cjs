'use strict';
/** R-WEB-PANGEA-LAND-FRACTION-Q1: udzial ladu Pangei per etap (snapPangeaBagelAudit) + final. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ENTRY = path.resolve(__dirname, '.pangea-land-stage-entry.ts');
const BUNDLE = path.resolve(__dirname, '.pangea-land-stage-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { generujSwiat } from '../src/map/generator';
export { countLandSeaHexes, startPangeaBagelAudit, takePangeaBagelAuditSnaps } from '../src/map/gen-helpers';
export { TerenBazowy } from '../src/types/hex';
`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE, logLevel: 'silent' });
const M = require(BUNDLE);
const frac = Number(process.argv[2] || 0.6);
const SEEDS = (process.argv[3] || '1,7,42,99,2026,7777').split(',').map(Number);
const size = process.argv[4] || 'standardowy';
const opts = { worldDensity: { resources: 'medium', rivers: 'medium', desert: 'medium', forest: 'medium', relief: 'medium' }, landFraction: frac };
for (const seed of SEEDS) {
  M.startPangeaBagelAudit();
  const m = M.generujSwiat(seed, size, 'pangea', opts);
  const snaps = M.takePangeaBagelAuditSnaps();
  const c = M.countLandSeaHexes(m.hexes);
  const tot = c.total;
  const rows = snaps.map((s) => `${s.stage}=${(100 * s.dryLand / tot).toFixed(1)}`).join(' ');
  console.log(`seed ${seed} (${tot}hex): ${rows} FINAL=${(100 * c.land / tot).toFixed(2)}`);
}
