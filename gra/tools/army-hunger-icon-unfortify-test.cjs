'use strict';

/**
 * Bramka regresyjna R-ARMIA-IKONA-GLOD-FALSZYWA-Q1.
 *
 * Odfortyfikowanie zmienia stan jednostki niezależnie od głodu. Po zmianie
 * stanu renderer musi zostać zsynchronizowany natychmiast, inaczej poprzedni
 * sprite czaszki pozostaje na żetonie do następnego pełnego odświeżenia.
 * Run: node tools/army-hunger-icon-unfortify-test.cjs
 */

const fs = require('fs');
const path = require('path');

const mainSource = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
let passed = 0;
let failed = 0;

function ok(condition, label) {
  if (condition) passed++;
  else {
    failed++;
    console.error('FAIL:', label);
  }
}

function hasImmediateRenderSync(stackName, label) {
  const block = new RegExp(
    `if \\(u\\.ufortyfikowanyWPolu === true\\) \\{[\\s\\S]*?` +
      `for \\(const su of ${stackName}\\) exitFieldFortify\\(su\\);\\s*` +
      `syncUnitsRender\\(\\);`,
  );
  ok(block.test(mainSource), label);
}

hasImmediateRenderSync('siegeStack',
  'odfortyfikowanie polowe podczas oblężenia odświeża renderer bezpośrednio po exitFieldFortify');
hasImmediateRenderSync('fieldStack',
  'zwykłe odfortyfikowanie polowe odświeża renderer bezpośrednio po exitFieldFortify');

// Dowód mutacyjny: usunięcie obu synchronizacji musi ponownie otworzyć lukę.
const withoutFix = mainSource.replace(
  /for \(const su of (?:siegeStack|fieldStack)\) exitFieldFortify\(su\);\s*syncUnitsRender\(\);/g,
  (match) => match.replace(/\s*syncUnitsRender\(\);/, ''),
);
ok(!/for \(const su of siegeStack\) exitFieldFortify\(su\);\s*syncUnitsRender\(\);/.test(withoutFix),
  'mutacja bez poprawki usuwa synchronizację w ścieżce oblężenia');
ok(!/for \(const su of fieldStack\) exitFieldFortify\(su\);\s*syncUnitsRender\(\);/.test(withoutFix),
  'mutacja bez poprawki usuwa synchronizację w zwykłej ścieżce');

console.log(`army-hunger-icon-unfortify-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
