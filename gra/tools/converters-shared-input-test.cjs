'use strict';
/**
 * converters-shared-input-test.cjs -- R-WEB-ECONOMY-CONVERTERS-MENNICA-CLAY-ORDER-Q1 (ZADANIE B).
 * Rozdział WSPÓLNEGO wejścia między konwertery: proporcjonalnie do zapotrzebowania
 * (perCykl × przepustowość), NIE „kto pierwszy na liście".
 *
 *   A. glina 40: Cegielnia (2 gliny, tput 50) + Garncarnia (1 glina, tput 30) -> obie > 0,
 *      udziały gliny w proporcji zapotrzebowań 100 : 30.
 *   B. trzy konwertery o jednym surowcu (drewno): Cegielnia + Garncarnia + Huta -> każdy > 0.
 *   C. brak konkurencji (zapas >= Σ zapotrzebowań) -> wynik identyczny jak sekwencyjnie (bez zmian).
 *   D. MUTACJA: kopia starego sekwencyjnego rozdziału (pierwszy na liście zjada wszystko) MUSI dać
 *      Garncarnię = 0 przy glinie 40 -- asercja A na mutancie jest czerwona.
 *
 * Run from gra/:  node tools/converters-shared-input-test.cjs
 * Self-contained: bundles converters.ts with esbuild (no runtime imports).
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[converters-shared-input-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.converters-shared-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.converters-shared-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { runConverters, runConverter, DEFAULT_CONVERTER_RECIPES, converterAllocatedConsumedRatesForBuildings, converterConsumedRatesForBuildings, converterBuildingIdForRecipe } from '../src/game/converters';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[converters-shared-input-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const RECIPES = M.DEFAULT_CONVERTER_RECIPES;
const recipe = (id) => RECIPES.find(r => r.id === id);
const CAP = 1e9;

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; console.log('PASS:', msg); } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// Stare zachowanie (mutant): sekwencyjnie, pierwszy na liście bierze cały zapas.
function runSequentialMutant(recipes, stores, throughputs) {
  let cur = { ...stores };
  const perBuilding = {};
  for (const r of recipes) {
    const tput = throughputs[r.id] ?? r.throughputFallback;
    const res = M.runConverter(r, cur, tput, CAP, 1);
    cur = res.stores;
    perBuilding[r.id] = res;
  }
  return { stores: cur, perBuilding };
}

function fallbackThroughputs(list) {
  const t = {};
  for (const r of list) t[r.id] = r.throughputFallback;
  return t;
}

// ---------------------------------------------------------------------------
console.log('\n-- A. glina 40: Cegielnia + Garncarnia (proporcjonalnie) --');
{
  const list = [recipe('cegielnia'), recipe('garncarnia')];
  const tp = fallbackThroughputs(list);
  const out = M.runConverters(list, { glina: 40, drewno: 1000 }, tp, () => CAP);
  const cegla = out.stores.cegla ?? 0;
  const cer   = out.stores.ceramika ?? 0;
  assert(cegla > 0, `Cegielnia: cegla > 0 przy glinie 40 (got ${cegla})`);
  assert(cer > 0, `Garncarnia: ceramika > 0 przy glinie 40 (got ${cer})`);
  const gCeg = out.perBuilding.cegielnia.consumed.glina ?? 0;
  const gGar = out.perBuilding.garncarnia.consumed.glina ?? 0;
  assert(gCeg + gGar <= 40 + 1e-9, `suma zużytej gliny <= zapasu 40 (got ${gCeg + gGar})`);
  // Zapotrzebowanie: Cegielnia 2×50 = 100, Garncarnia 1×30 = 30 -> udziały 40×100/130 : 40×30/130.
  const oczekCeg = 40 * 100 / 130;
  const oczekGar = 40 * 30 / 130;
  // Cykle są całkowite (floor udziału / wejście na cykl), więc zużycie <= udział i w granicy 1 cyklu.
  assert(gCeg <= oczekCeg + 1e-9 && gCeg > oczekCeg - 2, `udział gliny Cegielni <= ${oczekCeg.toFixed(4)}, w granicy 1 cyklu (got ${gCeg})`);
  assert(gGar <= oczekGar + 1e-9 && gGar > oczekGar - 1, `udział gliny Garncarni <= ${oczekGar.toFixed(4)}, w granicy 1 cyklu (got ${gGar})`);
  eq(cegla, 30, 'Cegielnia: cegla = 2 × floor(30,77/2) = 30 (ograniczona udziałem, nie zapasem)');
  eq(cer, 9, 'Garncarnia: ceramika = floor(9,23/1) = 9');
}

// ---------------------------------------------------------------------------
console.log('\n-- B. trzy konwertery o jednym surowcu (drewno 30) --');
{
  const list = [recipe('cegielnia'), recipe('garncarnia'), recipe('huta')];
  const tp = fallbackThroughputs(list);
  const out = M.runConverters(list, { glina: 1000, drewno: 30, ruda: 1000 }, tp, () => CAP);
  assert((out.stores.cegla ?? 0) > 0, `trzy konwertery: cegla > 0 (got ${out.stores.cegla})`);
  assert((out.stores.ceramika ?? 0) > 0, `trzy konwertery: ceramika > 0 (got ${out.stores.ceramika})`);
  assert((out.stores.braz ?? 0) > 0, `trzy konwertery: braz > 0 (got ${out.stores.braz})`);
  const sumDrewno = ['cegielnia', 'garncarnia', 'huta']
    .reduce((s, id) => s + (out.perBuilding[id].consumed.drewno ?? 0), 0);
  assert(sumDrewno <= 30 + 1e-9, `suma zużytego drewna <= zapasu 30 (got ${sumDrewno})`);
}

// ---------------------------------------------------------------------------
console.log('\n-- C. brak konkurencji = bez zmian --');
{
  const list = [recipe('cegielnia'), recipe('garncarnia')];
  const tp = fallbackThroughputs(list);
  const big = { glina: 1000, drewno: 1000 };
  const out = M.runConverters(list, big, tp, () => CAP);
  const seq = runSequentialMutant(list, big, tp);
  eq(out.stores.cegla, seq.stores.cegla, 'bez konkurencji: cegla identyczna z sekwencyjnym rozdziałem');
  eq(out.stores.ceramika, seq.stores.ceramika, 'bez konkurencji: ceramika identyczna z sekwencyjnym rozdziałem');
  eq(out.stores.glina, seq.stores.glina, 'bez konkurencji: glina po ticku identyczna');
  eq(out.stores.drewno, seq.stores.drewno, 'bez konkurencji: drewno po ticku identyczne');
  eq(out.stores.cegla, 100, 'bez konkurencji: Cegielnia = 50 cykli × 2 = 100 cegieł (pełna przepustowość)');
  eq(out.stores.ceramika, 30, 'bez konkurencji: Garncarnia = 30 cykli × 1 = 30 ceramiki (pełna przepustowość)');
}

// ---------------------------------------------------------------------------
console.log('\n-- D. MUTACJA: stary sekwencyjny rozdział musi być czerwony --');
{
  const list = [recipe('cegielnia'), recipe('garncarnia')];
  const tp = fallbackThroughputs(list);
  const mut = runSequentialMutant(list, { glina: 40, drewno: 1000 }, tp);
  assert(!((mut.stores.ceramika ?? 0) > 0),
    `MUTANT (sekwencyjnie): Garncarnia ceramika = ${mut.stores.ceramika ?? 0} -- asercja A (ceramika > 0) byłaby czerwona`);
}

// ---------------------------------------------------------------------------
// E. HUD z podziałem = silnik (runda 2, zarzut Evaluatora 3 i 5). Rachunek HUD
//    (converterAllocatedConsumedRatesForBuildings) ma dać to samo zużycie co silnik
//    (runConverters: Δstanu wejść), a nie nominał. Dla glina 40 nominał Cegielni+Garncarni
//    = 130 gliny, silnik zjada 39. Asercje na realnym torze: budynki -> receptury -> runConverters.
// ---------------------------------------------------------------------------
console.log('\n-- E. HUD z podziałem wejścia = zużycie silnika (Δstanu) --');
{
  const B = ['cegielnia', 'garncarnia'];
  const stores = { glina: 40, drewno: 1000 };
  const hud = M.converterAllocatedConsumedRatesForBuildings(B, {}, 'normal', 1, stores);
  const nominal = M.converterConsumedRatesForBuildings(B, {}, 'normal', 1);
  const engine = M.runConverters(
    RECIPES.filter(r => B.includes(M.converterBuildingIdForRecipe(r))),
    stores,
    Object.fromEntries(RECIPES.map(r => [r.id, r.throughputFallback])),
    () => CAP,
  );
  const engineGlina = stores.glina - engine.stores.glina;
  assert(hud.glina > 0 && hud.glina <= 40,
    `HUD z podziałem: zużycie gliny w [0, 40] (got ${hud.glina})`);
  assert(nominal.glina > 40,
    `nominał (bez magazynu) > zapas 40 -- dowód, że nominał kłamie przy konkurencji (got ${nominal.glina})`);
  assert(Math.abs(hud.glina - engineGlina) < 1e-9,
    `HUD z podziałem = Δstanu silnika dla gliny (HUD ${hud.glina} vs silnik ${engineGlina})`);
  const rozne = M.converterAllocatedConsumedRatesForBuildings(B, {}, 'normal', 1, { glina: 1000, drewno: 1000 });
  assert(Math.abs(rozne.glina - nominal.glina) < 1e-9,
    `bez konkurencji (glina 1000): HUD z podziałem = nominał (${rozne.glina} vs ${nominal.glina})`);
}

// --- summary ---------------------------------------------------------------
console.log(`\nconverters-shared-input-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
