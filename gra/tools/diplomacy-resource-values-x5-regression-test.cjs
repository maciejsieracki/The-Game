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
  ruda_zelaza: 10,
  stal: 25,
};
for (const [resource, pricePerBlock] of Object.entries(blockPrices)) {
  eq(D.diplomacyHandelSurowiecKrok(resource), 5, `${resource}: krok 5`);
  for (const quantity of [5, 20, 105, 205]) {
    eq(
      D.diplomacyPnSurowiecIlosc(resource, quantity),
      (quantity / 5) * pricePerBlock,
      `${resource}: ${quantity} szt. = bloki × cena`,
    );
  }
}

// Boundary/negative cases: never round a short or partial request upward.
eq(D.diplomacyPnSurowiecIlosc('drewno', 4), 0, '4 drewna: poniżej bloku');
eq(D.diplomacyPnSurowiecIlosc('drewno', 9), 1, '9 drewna: floor do jednego bloku');
eq(D.diplomacyPnSurowiecIlosc('drewno', 0), 0, '0 drewna: brak wartości');
eq(D.diplomacyPnSurowiecIlosc('drewno', -5), 0, '-5 drewna: brak wartości');

// Explicit exclusions from the 5x rule remain one-unit priced.
eq(D.diplomacyHandelSurowiecKrok('zloto'), 1, 'złoto: krok 1');
eq(D.diplomacyHandelSurowiecKrok('wegiel'), 1, 'węgiel: krok 1');
eq(D.diplomacyPnSurowiecIlosc('zloto', 3), 150, '3 złota: bez ×5');
eq(D.diplomacyPnSurowiecIlosc('wegiel', 3), 60, '3 węgla: bez ×5');

// Exact owner-reported repro: old PR-style arithmetic yielded 515, canonical = 103.
const mixed = D.diplomacySumPn([
  { typ: 'surowiec_ilosc', id: 'glina', ilosc: 205 },
  { typ: 'surowiec_ilosc', id: 'drewno', ilosc: 105 },
]);
eq(mixed, 103, '205 gliny + 105 drewna = 103 PW, nie 515');
eq(D.diplomacySumPn([
  { typ: 'surowiec_ilosc', id: 'glina', ilosc: 205 },
  { typ: 'surowiec_ilosc', id: 'drewno', ilosc: 105 },
], { proposerOwnerId: 0, playerOwnerId: 7 }), 103, 'parytet owner 0/7');

try { fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`diplomacy-resource-values-x5-regression-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
