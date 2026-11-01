'use strict';
/**
 * R-WEB-PANGEA-LAND-FRACTION-Q1: hash `hexes` dla Kontynenty/Wyspy/Ziemia (musza byc IDENTYCZNE
 * przed/po poprawce Pangei) + Pangea (zmienia sie celowo) + udzial ladu Pangei.
 * Uzycie: node tools/pangea-land-determinism-test.cjs [plik-wyjsciowy]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ENTRY = path.resolve(__dirname, '.pangea-land-det-entry.ts');
const BUNDLE = path.resolve(__dirname, '.pangea-land-det-bundle.cjs');
fs.writeFileSync(ENTRY, `
import { setRiverGenEnabledOverride } from '../src/map/riverGenSwitch';
setRiverGenEnabledOverride(false);
export { generujSwiat } from '../src/map/generator';
export { countLandSeaHexes } from '../src/map/gen-helpers';
`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE, logLevel: 'silent' });
const M = require(BUNDLE);
const opts = { worldDensity: { resources: 'medium', rivers: 'medium', desert: 'medium', forest: 'medium', relief: 'medium' } };
const SEEDS = [1, 42, 99, 7777];
const lines = [];
for (const typ of ['kontynenty', 'wyspy', 'ziemia', 'pangea']) {
  for (const seed of SEEDS) {
    const m = M.generujSwiat(seed, 'standardowy', typ, opts);
    const h = crypto.createHash('sha256').update(JSON.stringify(m.hexes)).digest('hex').slice(0, 16);
    const c = M.countLandSeaHexes(m.hexes);
    lines.push(`${typ} seed=${seed} hash=${h} land=${(100 * c.land / c.total).toFixed(2)}%`);
  }
}
const out = lines.join('\n');
console.log(out);
if (process.argv[2]) fs.writeFileSync(process.argv[2], out + '\n');
