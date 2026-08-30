/**
 * Independent regression for R-DYPLO-SUROWCE-WARTOSC-5X-Q1.
 *
 * The oracle is deliberately written here instead of calling the production
 * normalizer: prices are PN per 5-unit block for the 5x resources, while gold
 * and coal remain PN per single unit. This catches a regression that merely
 * changes the shared helper and its own tests together.
 */
const path = require('path');
const fs = require('fs');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const BUNDLE = path.resolve(__dirname, '.dip-resource-values-x5-bundle.cjs');

esbuild.buildSync({
  absWorkingDir: path.resolve(__dirname, '..'),
  stdin: {
    contents: `
export {
  diplomacyPnSurowiecIlosc,
  diplomacySumPn,
  diplomacyHandelSurowiecKrok,
} from './src/game/diplomacy-value-catalog';
`,
    resolveDir: path.resolve(__dirname, '..'),
    sourcefile: 'diplomacy-resource-values-x5-regression-entry.ts',
  },
  bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const D = require(BUNDLE);
let pass = 0;
let fail = 0;
function ok(condition, message) {
  if (condition) pass++;
  else { fail++; console.error('FAIL:', message); }
}
function eq(actual, expected, message) {
  ok(actual === expected, `${message} (got ${actual}, want ${expected})`);
}

// Canonical block oracle: 5x resources use old price per 5 units.
const blockPrices = {
  drewno: 1,
  glina: 2,
  kamien: 3,
  ruda: 5,
  ruda_zelaza: 10,
  ruda_cyny: 10,
  cegla: 5,
  sol: 2,
  kon: 5,
  ceramika: 5,
  braz: 15,
  zelazo: 20,
  stal: 25,
};
// R-DYPLO-CENNIK-KROK10-Q1 (Maciej 2026-08-30): krok podniesiony 5→10 dla tych samych
// surowców, cena_* liczbowo bez zmian — oracle floor-uje do najbliższej wielokrotności 10
// (nie dzieli już wprost przez 5, bo nie każda testowana ilość jest wielokrotnością 10).
for (const [resource, pricePerBlock] of Object.entries(blockPrices)) {
  eq(D.diplomacyHandelSurowiecKrok(resource), 10, `${resource}: krok 10`);
  for (const quantity of [5, 20, 105, 205]) {
    eq(
      D.diplomacyPnSurowiecIlosc(resource, quantity),
      Math.floor(quantity / 10) * pricePerBlock,
      `${resource}: ${quantity} szt. = bloki × cena (krok 10)`,
    );
  }
}

// Boundary/negative cases: never round a short or partial request upward.
eq(D.diplomacyPnSurowiecIlosc('drewno', 4), 0, '4 drewna: poniżej bloku');
eq(D.diplomacyPnSurowiecIlosc('drewno', 9), 0, '9 drewna: nadal poniżej bloku (krok 10)');
eq(D.diplomacyPnSurowiecIlosc('drewno', 19), 1, '19 drewna: floor do jednego bloku (krok 10)');
eq(D.diplomacyPnSurowiecIlosc('drewno', 0), 0, '0 drewna: brak wartości');
eq(D.diplomacyPnSurowiecIlosc('drewno', -5), 0, '-5 drewna: brak wartości');

// Explicit exclusions from the 5x rule remain one-unit priced.
eq(D.diplomacyHandelSurowiecKrok('zloto'), 1, 'złoto: krok 1');
eq(D.diplomacyHandelSurowiecKrok('wegiel'), 1, 'węgiel: krok 1');
eq(D.diplomacyPnSurowiecIlosc('zloto', 3), 150, '3 złota: bez ×5');
eq(D.diplomacyPnSurowiecIlosc('wegiel', 3), 60, '3 węgla: bez ×5');

// Exact owner-reported repro: old PR-style arithmetic yielded 515; canonical przy kroku 5
// było 103, przy dzisiejszym kroku 10 (R-DYPLO-CENNIK-KROK10-Q1) jest 50.
const mixed = D.diplomacySumPn([
  { typ: 'surowiec_ilosc', id: 'glina', ilosc: 205 },
  { typ: 'surowiec_ilosc', id: 'drewno', ilosc: 105 },
]);
eq(mixed, 50, '205 gliny + 105 drewna = 50 PW (krok 10), nie 515');
eq(D.diplomacySumPn([
  { typ: 'surowiec_ilosc', id: 'glina', ilosc: 205 },
  { typ: 'surowiec_ilosc', id: 'drewno', ilosc: 105 },
], { proposerOwnerId: 0, playerOwnerId: 7 }), 50, 'parytet owner 0/7');

try { fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`diplomacy-resource-values-x5-regression-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
