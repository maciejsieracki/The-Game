'use strict';
/** Focused static contract test for R-PRACA-JEDEN-SUWAK-UI-Q1.
 * No temporary files are created, so the check is safe under EPERM.
 * Run from gra/: node tools/praca-split-ui-test.cjs
 */
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
  path.resolve(__dirname, '..', 'src/ui/empireDetailPanel.ts'),
  'utf8',
);
let pass = 0;
let fail = 0;
function check(name, condition) {
  if (condition) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.error('FAIL: ' + name); }
}

check('dokładna etykieta Budynki (0–100%)', source.includes('Budynki (0–100%)'));
check('dokładna etykieta Pula Pracy (0–50%)', source.includes('Pula Pracy (0–50%)'));
check('jeden renderowany nadrzędny input', (source.match(/data-praca-empire-split \/>/g) || []).length === 1);
check('jeden listener input dla nadrzędnego suwaka', (source.match(/input\.addEventListener\('input'/g) || []).length === 1);
check('brak usuniętego lokalnego renderu/wiringu', !source.includes('renderPracaSplitSection') && !source.includes('data-praca-key'));
check('wartość suwaka ma zakres 0–50', source.includes('min="0" max="50" step="1"'));
check('Budynki są wyliczane jako 100% minus Pula Pracy', source.includes('Budynki zawsze = 100% − Pula Pracy.'));

console.log(`\n[praca-split-ui-test] ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
