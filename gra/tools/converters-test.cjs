'use strict';
/**
 * converters-test.cjs -- standalone Node test for src/game/converters.ts.
 * Run from gra/:  node tools/converters-test.cjs
 *
 * Kanon 2026-07-27: lancuch odlewni multi-receptura; Wielka Kuźnia bez produkcji stali.
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
  computeGarncarniaSurplusBonus,
} from '../src/game/converters';
`, 'utf8');

try {
  esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent' });
} catch (e) { console.error('[converters-test] esbuild failed:\n', e.message || e); process.exit(1); }

const C = require(BUNDLE_FILE);

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

eq(C.DEFAULT_CONVERTER_RECIPES.length, 9, 'PYTANIE-84: 9 receptur (garncarnia→ceramika przywrócona)');
assert(!C.DEFAULT_CONVERTER_RECIPES.some(r => r.id === 'tartak'), 'B-SUROW-BUD-03: brak tartak→deski');
const garncarnia = C.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'garncarnia');
assert(!!garncarnia, 'PYTANIE-84 U-14: garncarnia→ceramika w katalogu');
assert(!Object.prototype.hasOwnProperty.call(garncarnia.inputs, 'ceramika'),
  'U-14: Garncarnia NIE zużywa Ceramiki (tylko glina+drewno)');
eq(garncarnia.throughputFallback, 6, 'PYTANIE-84-B5: przepustowość Garncarnia fallback 6/t');
assert(!C.DEFAULT_CONVERTER_RECIPES.some(r => r.id === 'mielerz'), 'Zadanie 1 (2026-07-23): Mielerz usuniety calkowicie');
assert(!C.DEFAULT_CONVERTER_RECIPES.some(r => r.id === 'wielka_kuznia'), 'Maciej 2026-07-27: brak wielka_kuznia→stal (tylko pancerz)');
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

// no input -> brak-wejscia
r = C.runConverter(cegielnia, { glina: 0, drewno: 0 }, 2, 50);
eq(r.produced, 0, 'no input -> 0'); eq(r.reason, 'brak-wejscia', 'brak-wejscia');

// Huta: ruda + drewno -> braz (bylo ruda + paliwo)
eq(huta.inputs.drewno, 1, 'huta: 1 drewno/cykl (bylo paliwo:1)');
r = C.runConverter(huta, { ruda: 3, drewno: 1 }, 5, 50);
eq(r.produced, 1, 'huta limited by drewno=1'); eq(r.stores.braz, 1, 'huta: braz +1');

const odlewniaZelBraz = C.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'odlewnia_zelaza__braz');
const odlewniaZelZelazo = C.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'odlewnia_zelaza__zelazo');
eq(odlewniaZelBraz.buildingId, 'odlewnia_zelaza', 'odlewnia_zelaza__braz: buildingId odlewnia_zelaza');
eq(odlewniaZelZelazo.buildingId, 'odlewnia_zelaza', 'odlewnia_zelaza__zelazo: buildingId odlewnia_zelaza');
eq(odlewniaZelZelazo.inputs.drewno, 1, 'odlewnia_zelaza__zelazo: 1 drewno/cykl');
r = C.runConverter(odlewniaZelZelazo, { ruda_zelaza: 2, drewno: 2 }, 2, 50);
eq(r.produced, 2, 'odlewnia_zelaza__zelazo: 2 zelazo z ruda_zelaza');

// Odlewnia zelaza: dual output (braz + zelazo rownolegle)
const dualRecipes = [odlewniaZelBraz, odlewniaZelZelazo];
const dual = C.runConverters(
  dualRecipes,
  { ruda: 3, ruda_zelaza: 3, drewno: 6 },
  { odlewnia_zelaza__braz: 2, odlewnia_zelaza__zelazo: 2 },
  () => 50,
);
eq(dual.perBuilding.odlewnia_zelaza__braz.produced, 2, 'dual: 2 braz');
eq(dual.perBuilding.odlewnia_zelaza__zelazo.produced, 2, 'dual: 2 zelazo');
eq(dual.stores.braz, 2, 'dual: stores braz=2');
eq(dual.stores.zelazo, 2, 'dual: stores zelazo=2');

const wielkaOdlewniaStal = C.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'wielka_odlewnia__stal');
eq(wielkaOdlewniaStal.buildingId, 'wielka_odlewnia', 'wielka_odlewnia__stal: buildingId wielka_odlewnia');
eq(wielkaOdlewniaStal.inputs.drewno, 1, 'wielka_odlewnia__stal: 1 drewno/cykl');
r = C.runConverter(wielkaOdlewniaStal, { zelazo: 2, drewno: 2 }, 2, 50);
eq(r.produced, 2, 'wielka_odlewnia__stal: 2 stal z zelazo');

// runConverters: cegielnia + huta uruchomione rownolegle na wspolnym magazynie
// drewna (surowiec surowy, NIE produkt innego konwertera -- odmiennie niz dawny
// lancuch Mielerz->Huta, ktory juz nie istnieje).
const parallel = C.runConverters([cegielnia, huta], { glina: 4, ruda: 5, drewno: 6 }, { cegielnia: 3, huta: 3 }, () => 50);
eq(parallel.perBuilding.cegielnia.produced, 2, 'parallel: cegielnia 2 cegla (2 glina/cykl limituje)');
eq(parallel.perBuilding.huta.produced, 3, 'parallel: huta 3 braz (throughput limituje, ruda/drewno starcza)');
eq(parallel.stores.braz, 3, 'parallel: final braz 3');
eq(parallel.stores.drewno, 6 - 2 - 3, 'parallel: drewno zuzyte przez oba konwertery (1/cykl kazdy)');

// Garncarnia: 1 glina + 1 drewno -> 1 ceramika, 6/t (PYTANIE-84-B5)
r = C.runConverter(garncarnia, { glina: 10, drewno: 10 }, 6, 50);
eq(r.produced, 6, 'garncarnia: 6 ceramika (throughput limit)');
eq(r.stores.ceramika, 6, 'garncarnia: ceramika +6');
eq(r.stores.glina, 4, 'garncarnia: glina 10-6=4');
assert(!Object.prototype.hasOwnProperty.call(r.consumed, 'ceramika'),
  'garncarnia: ceramika NIE w consumed');

// U-14bA: nadwyżka po drain Spichlerza -> +Zdrowie (domyślnie)
const u14b = C.computeGarncarniaSurplusBonus({ ceramikaPoDrainSpichlerza: 3, maGarncarnie: true });
eq(u14b.zdrowieBonus, 3, 'U-14bA: 3 nadwyżki -> +3 Zdrowia');
eq(u14b.zadowolenieBonus, 0, 'U-14bA domyślnie: brak Zadowolenia');
eq(u14b.nadwyzkaSztuk, 3, 'U-14bA: nadwyzkaSztuk=3');

const u14bZero = C.computeGarncarniaSurplusBonus({ ceramikaPoDrainSpichlerza: 0, maGarncarnie: true });
eq(u14bZero.zdrowieBonus, 0, 'U-14bA: brak nadwyżki -> 0 Zdrowia');

const u14bNoGarnc = C.computeGarncarniaSurplusBonus({ ceramikaPoDrainSpichlerza: 5, maGarncarnie: false });
eq(u14bNoGarnc.zdrowieBonus, 0, 'U-14bA: bez Garncarni -> 0 (nawet przy stocku)');

// Zapas: efekt zadowolenie (U-14b — przyszły suwak)
const u14bZad = C.computeGarncarniaSurplusBonus({
  ceramikaPoDrainSpichlerza: 2, maGarncarnie: true, efekt: 'zadowolenie', zadowolenieNaSztuke: 1,
});
eq(u14bZad.zadowolenieBonus, 2, 'U-14b zapas: efekt zadowolenie -> +2');
eq(u14bZad.zdrowieBonus, 0, 'U-14b zapas: efekt zadowolenie -> 0 zdrowia');

eq(C.loadThroughput({}, 'budynek_cegielnia_przepustowosc', 'normal', 2), 2, 'load: missing -> fallback');

console.log(`\nconverters-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
