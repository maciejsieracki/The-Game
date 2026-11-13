'use strict';
/**
 * R-WEB-PANGEA-LAND-FRACTION-OTHER-Q1: diagnostyka - ile suchego ladu Pangea ma po kazdym etapie
 * (snapPangeaBagelAudit). Uzycie: node tools/pangea-land-other-stages.cjs <rozmiar> <seed> <pct,csv>
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ENTRY = path.resolve(__dirname, `.pangea-land-other-st-entry-${process.pid}.ts`);
const BUNDLE = path.resolve(__dirname, `.pangea-land-other-st-bundle-${process.pid}.cjs`);
fs.writeFileSync(ENTRY, `
import { setRiverGenEnabledOverride } from '../src/map/riverGenSwitch';
setRiverGenEnabledOverride(false);
export { generujSwiat } from '../src/map/generator';
export { countLandSeaHexes, startPangeaBagelAudit, takePangeaBagelAuditSnaps } from '../src/map/gen-helpers';
`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE, logLevel: 'silent' });
const M = require(BUNDLE);
fs.unlinkSync(ENTRY);
const size = process.argv[2] || 'standardowy';
const seed = Number(process.argv[3] || 42);
const pcts = (process.argv[4] || '30,50,60').split(',').map(Number);
const density = { resources: 'medium', rivers: 'medium', desert: 'medium', forest: 'medium', relief: 'medium' };
for (const p of pcts) {
  M.startPangeaBagelAudit();
  const m = M.generujSwiat(seed, size, 'pangea', { worldDensity: density, landFraction: p / 100 });
  const snaps = M.takePangeaBagelAuditSnaps();
  const total = Object.keys(m.hexes).length;
  console.log(`--- ${size} seed=${seed} decl=${p}% total=${total} target=${Math.round(total * p / 100)}`);
  for (const s of snaps) console.log(`  ${s.stage}: dryLand=${s.dryLand} (${(100 * s.dryLand / total).toFixed(2)}%) masses=${s.dryMasses}`);
  const c = M.countLandSeaHexes(m.hexes);
  console.log(`  FINAL countLandSeaHexes.land=${c.land} (${(100 * c.land / total).toFixed(2)}%)`);
}
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
