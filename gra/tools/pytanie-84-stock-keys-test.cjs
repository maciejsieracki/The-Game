'use strict';
/**
 * PYTANIE-84 — stock keys R4/R6/R9/R10, U-2/U-3 (etykiety, territory yield, Mount +5 kon).
 * Run from gra/: node tools/pytanie-84-stock-keys-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.pytanie-84-stock-entry.ts');
const BUNDLE = path.resolve(__dirname, '.pytanie-84-stock-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  STOCK_RESOURCE_LABEL,
  EMPIRE_STOCK_RESOURCE_KEYS,
  unitStockCost,
  MOUNT_UNIT_HORSE_STOCK_COST,
} from '../src/game/building-stock-cost';
export { territoryResourceYieldForImprovement } from '../src/game/terrain-improvements';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  PASS:', m); } else { fail++; console.error('  FAIL:', m); } }

console.log('-- A. Etykiety stock sol/zloto/kon --');
ok(M.STOCK_RESOURCE_LABEL.sol === 'Sól', 'sol → Sól');
ok(M.STOCK_RESOURCE_LABEL.zloto === 'Złoto (surowiec)', 'zloto → Złoto (surowiec)');
ok(M.STOCK_RESOURCE_LABEL.kon === 'Koń', 'kon → Koń');

console.log('-- B. EMPIRE_STOCK_RESOURCE_KEYS --');
for (const k of ['sol', 'zloto', 'kon', 'ceramika']) {
  ok(M.EMPIRE_STOCK_RESOURCE_KEYS.includes(k), `klucz ${k} w EMPIRE_STOCK_RESOURCE_KEYS`);
}

console.log('-- C. Territory yield (B2/B3/B4) --');
// R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (Maciej 2026-08-13): wszystkie stawki x5 vs
// R-ZUZYCIE-SUROWCOW-OBYWATELE-PROD-Q1 (2026-08-12) -- zloto WYLACZONE (waluta).
const solYield = M.territoryResourceYieldForImprovement('warzelnia_soli');
ok(solYield?.resourceKey === 'sol' && solYield.amount === 50,
  `warzelnia_soli → sol 50/t (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 10; ma: ${JSON.stringify(solYield)})`);

const konYield = M.territoryResourceYieldForImprovement('stadnina');
ok(konYield?.resourceKey === 'kon' && konYield.amount === 25,
  `stadnina → kon 25/t (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 5; ma: ${JSON.stringify(konYield)})`);

const zlotoYield = M.territoryResourceYieldForImprovement('kopalnia_zlota');
ok(zlotoYield?.resourceKey === 'zloto' && zlotoYield.amount === 1,
  `kopalnia_zlota → zloto 1/t (BEZ ZMIAN -- zloto wylaczone z R-EKONOMIA-SUROWCE-SKALA-5X-Q1; ma: ${JSON.stringify(zlotoYield)})`);

// N5 (Maciej 2026-08-12, dispatch po ecbddda8): luka pokrycia -- kopalnia_miedzi
// i kopalnia_zelaza mialy dotad asercje TYLKO na poziomie JSON, NIE na poziomie
// silnika (territoryResourceYieldForImprovement).
// EN: coverage gap -- kopalnia_miedzi and kopalnia_zelaza previously had assertions
// ONLY at the JSON level, NOT at the engine level.
const miedzYield = M.territoryResourceYieldForImprovement('kopalnia_miedzi');
ok(miedzYield?.resourceKey === 'ruda' && miedzYield.amount === 20,
  `kopalnia_miedzi → ruda 20/t (silnik, nie hardkod; R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 4; ma: ${JSON.stringify(miedzYield)})`);

const zelazaYield = M.territoryResourceYieldForImprovement('kopalnia_zelaza');
ok(zelazaYield?.resourceKey === 'ruda_zelaza' && zelazaYield.amount === 20,
  `kopalnia_zelaza → ruda_zelaza 20/t (silnik, nie hardkod; R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 4; ma: ${JSON.stringify(zelazaYield)})`);

console.log('-- D. Mount rekrutacja +25 kon (U-15 stock keys) --');
const mountCost = M.unitStockCost({ Typ: 'Mount', Jednostka: 'Łucznik konny', Surowiec: 'Brąz', 'Surowiec (ilość)': 1 });
ok(mountCost.kon === M.MOUNT_UNIT_HORSE_STOCK_COST,
  `Mount +${M.MOUNT_UNIT_HORSE_STOCK_COST} kon (ma: ${JSON.stringify(mountCost)})`);
const oxCost = M.unitStockCost({ Typ: 'Mount', Jednostka: 'Rydwan (woły)', Surowiec: 'Brąz', 'Surowiec (ilość)': 1 });
ok(!oxCost.kon, 'Rydwan (woły) bez kosztu kon');

console.log(`\npytanie-84-stock-keys-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
