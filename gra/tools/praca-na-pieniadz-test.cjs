'use strict';
/**
 * Work is converted to tax only through the explicit owner action. This test
 * guards the city-yield boundary: ordinary city ticks never monetize the Work
 * pool, while queued manual tax uses the ordinary corruption, Mint and slider
 * stages without receiving route-only Market bonuses.
 * Run from gra/: node tools/praca-na-pieniadz-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.praca-na-pieniadz-entry.ts');
const BUNDLE = path.join(__dirname, '.praca-na-pieniadz-bundle.cjs');
fs.writeFileSync(ENTRY, [
  `export { loadEconParams, cityYieldPerTurn } from '../src/game/economy';`,
  `export { TerenBazowy, Nakladka } from '../src/types/hex';`,
].join('\n'));
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE, logLevel: 'silent' });
const { loadEconParams, cityYieldPerTurn, TerenBazowy, Nakladka } = require(BUNDLE);
const econ = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/econ-params.json'), 'utf8'));
const params = loadEconParams(econ, 'normal');
const tiles = Array.from({ length: 10 }, () => ({ terenBazowy: TerenBazowy.Rownina, nakladka: Nakladka.Brak, maRzeke: false }));
const city = {
  id: 'manual-tax-test', ludnosc: 3, zdrowie: 0, czyStolica: true,
  maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 0,
  specjalisci: [], kolejkaProdukcji: [],
  podziałHandlu: { procentNauka: 0, procentPieniadz: 100, procentLuksus: 0 },
  podziałPracy: { procentBudynki: 0 },
};
function yieldFor({ market = false, tax = 0, mint = false, corruption = 0 } = {}) {
  return cityYieldPerTurn(city, tiles, [], params, {
    wojskoZuzycieZywnosci: 0, strataFraction: corruption,
    maMlyn: false, maCegielnia: false, maTargowisko: market,
    maBiblioteka: false, maAkademia: false, maMennica: mint,
    walutaOdkryta: mint, additionalTax: tax,
  });
}
let passed = 0, failed = 0;
function eq(actual, expected, message) {
  const ok = actual === expected;
  if (ok) passed++; else failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${message} (got ${actual}, want ${expected})`);
}
const ordinary = yieldFor();
const withMarket = yieldFor({ market: true });
eq(ordinary.pieniadzZPracy, 0, 'ordinary tick never auto-converts Work');
eq(withMarket.pieniadzZPracy, 0, 'Market does not auto-convert Work');
eq(withMarket.pieniadz, ordinary.pieniadz, 'route-only Market percentage does not multiply local tax');
const converted = yieldFor({ market: true, tax: 20 });
eq(converted.handelBrutto, ordinary.handelBrutto + 20, 'explicitly queued Work tax joins local tax once');
eq(converted.pieniadz, ordinary.pieniadz + 20, 'manual tax follows the Money slider');
const modified = yieldFor({ market: true, tax: 20, mint: true, corruption: 0.2 });
eq(modified.pieniadz, 36, 'manual tax passes through corruption, then Mint, then sliders');
console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
