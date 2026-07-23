'use strict';
/**
 * converters-test.cjs -- standalone Node test for src/game/converters.ts.
 * Run from gra/:  node tools/converters-test.cjs
 *
 * Kanon 2026-07-23 (CERAMIKA-DOSTEP + PALIWO USUNIETE): bez tartak→deski;
 * garncarnia usunieta (Ceramika = tylko dostep, nie stock); Mielerz usuniety
 * (Paliwo skasowane calkowicie); pozostale receptury biora DREWNO 1:1. 5 receptur.
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

eq(C.DEFAULT_CONVERTER_RECIPES.length, 5, 'kanon 2026-07-23: 5 receptur (garncarnia + mielerz usuniete)');
assert(!C.DEFAULT_CONVERTER_RECIPES.some(r => r.id === 'tartak'), 'B-SUROW-BUD-03: brak tartak→deski');
assert(!C.DEFAULT_CONVERTER_RECIPES.some(r => r.id === 'garncarnia'), 'Maciej 2026-07-23: brak garncarnia→ceramika (dostep, nie stock)');
assert(!C.DEFAULT_CONVERTER_RECIPES.some(r => r.id === 'mielerz'), 'Zadanie 1 (2026-07-23): Mielerz usuniety calkowicie');
assert(
  !C.DEFAULT_CONVERTER_RECIPES.some(r => r.output === 'paliwo' || Object.prototype.hasOwnProperty.call(r.inputs, 'paliwo')),
  'Zadanie 1: ZADNA receptura nie produkuje ani nie konsumuje paliwo',
);

const cegielnia = C.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'cegielnia');
const huta   = C.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'huta');
const odlewnia = C.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'odlewnia_brazu');
assert(!!odlewnia && odlewnia.output === 'braz', 'odlewnia_brazu -> braz');

// Cegielnia: 2 glina + 1 drewno -> 1 cegla (paliwo:1 zastapione drewno:1, 1:1)
eq(cegielnia.inputs.glina, 2, 'cegielnia: 2 glina/cykl');
eq(cegielnia.inputs.drewno, 1, 'cegielnia: 1 drewno/cykl (bylo paliwo:1)');
let r = C.runConverter(cegielnia, { glina: 4, drewno: 2 }, 2, 50);
eq(r.produced, 2, 'cegielnia: 2 cegły'); eq(r.stores.glina, 0, 'cegielnia: glina zużyta'); eq(r.stores.drewno, 0, 'cegielnia: drewno zużyte');

// Garncarnia USUNIETA z katalogu konwerterow (Ceramika = tylko dostep) -- brak asercji receptury.

// no input -> brak-wejscia
r = C.runConverter(cegielnia, { glina: 0, drewno: 0 }, 2, 50);
eq(r.produced, 0, 'no input -> 0'); eq(r.reason, 'brak-wejscia', 'brak-wejscia');

// Huta: ruda + drewno -> braz (bylo ruda + paliwo)
eq(huta.inputs.drewno, 1, 'huta: 1 drewno/cykl (bylo paliwo:1)');
r = C.runConverter(huta, { ruda: 3, drewno: 1 }, 5, 50);
eq(r.produced, 1, 'huta limited by drewno=1'); eq(r.stores.braz, 1, 'huta: braz +1');

const odlewniaZel = C.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'odlewnia_zelaza');
eq(odlewniaZel.inputs.drewno, 1, 'odlewnia_zelaza: 1 drewno/cykl (bylo paliwo:1)');
r = C.runConverter(odlewniaZel, { ruda_zelaza: 2, drewno: 2 }, 2, 50);
eq(r.produced, 2, 'odlewnia_zelaza: 2 zelazo z ruda_zelaza');

const wielkaKuznia = C.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'wielka_kuznia');
eq(wielkaKuznia.inputs.drewno, 1, 'wielka_kuznia: 1 drewno/cykl (bylo paliwo:1)');

// runConverters: cegielnia + huta uruchomione rownolegle na wspolnym magazynie
// drewna (surowiec surowy, NIE produkt innego konwertera -- odmiennie niz dawny
// lancuch Mielerz->Huta, ktory juz nie istnieje).
const parallel = C.runConverters([cegielnia, huta], { glina: 4, ruda: 5, drewno: 6 }, { cegielnia: 3, huta: 3 }, () => 50);
eq(parallel.perBuilding.cegielnia.produced, 2, 'parallel: cegielnia 2 cegla (2 glina/cykl limituje)');
eq(parallel.perBuilding.huta.produced, 3, 'parallel: huta 3 braz (throughput limituje, ruda/drewno starcza)');
eq(parallel.stores.braz, 3, 'parallel: final braz 3');
eq(parallel.stores.drewno, 6 - 2 - 3, 'parallel: drewno zuzyte przez oba konwertery (1/cykl kazdy)');

eq(C.loadThroughput({}, 'budynek_cegielnia_przepustowosc', 'normal', 2), 2, 'load: missing -> fallback');

console.log(`\nconverters-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
