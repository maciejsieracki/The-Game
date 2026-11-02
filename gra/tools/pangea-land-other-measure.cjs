'use strict';
/**
 * R-WEB-PANGEA-LAND-FRACTION-OTHER-Q1: pomiar faktycznego udzialu ladu Pangei
 * dla deklarowanych 20..70% (3 ziarna x rozmiar). Rzeki off (nie zmieniaja ladu).
 * Uzycie: node tools/pangea-land-other-measure.cjs <maly|standardowy> [plik] [ulamki% csv] [ziarna csv]
 * ASERCJE: 30-70% w +-2 pp, 20% w +-3 pp. Naruszenie => exit 1.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ENTRY = path.resolve(__dirname, `.pangea-land-other-entry-${process.pid}.ts`);
const BUNDLE = path.resolve(__dirname, `.pangea-land-other-bundle-${process.pid}.cjs`);
fs.writeFileSync(ENTRY, `
import { setRiverGenEnabledOverride } from '../src/map/riverGenSwitch';
setRiverGenEnabledOverride(false);
export { generujSwiat } from '../src/map/generator';
export { countLandSeaHexes } from '../src/map/gen-helpers';
`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE, logLevel: 'silent' });
const M = require(BUNDLE);
fs.unlinkSync(ENTRY);
const size = process.argv[2] || 'maly';
const fracs = (process.argv[4] || '20,30,40,50,60,70').split(',').map(Number);
const seeds = (process.argv[5] || '1,42,99').split(',').map(Number);
const density = { resources: 'medium', rivers: 'medium', desert: 'medium', forest: 'medium', relief: 'medium' };
const lines = [];
const fails = [];
for (const f of fracs) {
  for (const seed of seeds) {
    const t0 = Date.now();
    const m = M.generujSwiat(seed, size, 'pangea', { worldDensity: density, landFraction: f / 100 });
    const c = M.countLandSeaHexes(m.hexes);
    const pct = 100 * c.land / c.total;
    const tol = f === 20 ? 3 : 2;
    const ok = Math.abs(pct - f) <= tol;
    if (!ok) fails.push(`${size} ${f}% seed=${seed}: ${pct.toFixed(2)}%`);
    lines.push(`${size} decl=${f}% seed=${seed} actual=${pct.toFixed(2)}% delta=${(pct - f).toFixed(2)} ${ok ? 'OK' : 'OUT'} t=${((Date.now() - t0) / 1000).toFixed(1)}s`);
    console.log(lines[lines.length - 1]);
  }
}
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
if (process.argv[3]) fs.writeFileSync(process.argv[3], lines.join('\n') + '\n');
if (fails.length) { console.error('FAIL:\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('PASS');
