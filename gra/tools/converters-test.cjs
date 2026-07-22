'use strict';
/**
 * converters-test.cjs -- standalone Node test for src/game/converters.ts.
 * Run from gra/:  node tools/converters-test.cjs
 *
 * Kanon 2026-07-23: bez tartak→deski; mielerz 2→1; 7 receptur.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[converters-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.conv-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.conv-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `
export {
  loadThroughput, DEFAULT_CONVERTER_RECIPES, runConverter, runConverters,
} from '../src/game/converters';
`, 'utf8');

try {
  esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent' });
} catch (e) { console.error('[converters-test] esbuild failed:\n', e.message || e); process.exit(1); }

const C = require(BUNDLE_FILE);

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

eq(C.DEFAULT_CONVERTER_RECIPES.length, 7, 'kanon: 7 default converters');
assert(!C.DEFAULT_CONVERTER_RECIPES.some(r => r.id === 'tartak'), 'B-SUROW-BUD-03: brak tartak→deski');

const mielerz = C.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'mielerz');
const cegielnia = C.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'cegielnia');
const huta   = C.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'huta');
const odlewnia = C.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'odlewnia_brazu');
assert(!!odlewnia && odlewnia.output === 'braz', 'odlewnia_brazu -> braz');

// Mielerz: 2 drewno -> 1 paliwo, tput 2
eq(mielerz.inputs.drewno, 2, 'mielerz: 2 drewno/cykl');
let r = C.runConverter(mielerz, { drewno: 5 }, 2, 50);
eq(r.produced, 2, 'mielerz: throughput caps to 2'); eq(r.cykle, 2, 'mielerz: 2 cycles');
eq(r.stores.drewno, 1, 'mielerz: drewno 5-4=1'); eq(r.stores.paliwo, 2, 'mielerz: paliwo +2');

// Cegielnia: 2 glina + 1 paliwo -> 1 cegla
r = C.runConverter(cegielnia, { glina: 4, paliwo: 2 }, 2, 50);
eq(r.produced, 2, 'cegielnia: 2 cegły'); eq(r.stores.glina, 0, 'cegielnia: glina zużyta');

// no input -> brak-wejscia
r = C.runConverter(mielerz, { drewno: 0 }, 2, 50);
eq(r.produced, 0, 'no input -> 0'); eq(r.reason, 'brak-wejscia', 'brak-wejscia');

// Huta: ruda + paliwo -> braz
r = C.runConverter(huta, { ruda: 3, paliwo: 1 }, 5, 50);
eq(r.produced, 1, 'huta limited by paliwo=1'); eq(r.stores.braz, 1, 'huta: braz +1');

const odlewniaZel = C.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'odlewnia_zelaza');
r = C.runConverter(odlewniaZel, { ruda_zelaza: 2, paliwo: 2 }, 2, 50);
eq(r.produced, 2, 'odlewnia_zelaza: 2 zelazo z ruda_zelaza');

// chain: Mielerz feeds Huta
const chain = C.runConverters([mielerz, huta], { drewno: 4, ruda: 5 }, { mielerz: 3, huta: 3 }, () => 50);
eq(chain.perBuilding.mielerz.produced, 2, 'chain: mielerz 2 paliwo (4 drewno)');
eq(chain.perBuilding.huta.produced, 2, 'chain: huta 2 braz');
eq(chain.stores.braz, 2, 'chain: final braz 2');

eq(C.loadThroughput({}, 'budynek_mielerz_przepustowosc', 'normal', 2), 2, 'load: missing -> fallback');

console.log(`\nconverters-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
