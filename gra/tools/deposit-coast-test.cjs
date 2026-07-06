'use strict';
/** Złoża (krowy, konie, …) nigdy na Morzu / Wybrzeżu po generateMap. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.deposit-coast-entry.ts');
const BUNDLE = path.resolve(__dirname, '.deposit-coast-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generateMap, generujSwiat } from '../src/map/generator';
export { countDepositsOnWater } from '../src/map/gen-helpers';
export { TerenBazowy, Nakladka } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) pass++; else { fail++; console.error('FAIL:', msg); } }

const typs = ['kontynenty', 'wyspy', 'pangea', 'ziemia'];
const seeds = [1, 7, 42, 99, 2026];

for (const typ of typs) {
  for (const seed of seeds) {
    const map = M.generujSwiat(seed, 'standardowy', typ);
    const bad = M.countDepositsOnWater(map.hexes);
    ok(bad === 0, `${typ} seed ${seed}: ${bad} złoż na morzu/wybrzeżu`);
  }
}

console.log(`deposit-coast-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
