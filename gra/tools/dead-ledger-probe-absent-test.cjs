'use strict';
/**
 * dead-ledger-probe-absent-test.cjs -- R-WEB-CLEAN-DEAD-LEDGER-PROBE-Q1.
 *
 * Strażnik: martwa sonda `ledgerAuditE3c*` (deklaracje `let` bez jakiegokolwiek przypisania
 * i odczyt w snapshocie `window.__ledgerTestDebug`) ma nie wracać do gra/src/main.ts.
 * Konsument gra/tools/resource-ledger-live-measure.cjs zapisuje teraz 'n/d' zamiast odczytu sondy.
 *
 * Dowód mutacyjny (na końcu pliku): w pamięci wstrzykujemy deklaracje sondy do źródła i sprawdzamy,
 * że detektor ją łapie (czerwony). Na prawdziwym main.ts asercja musi być zielona.
 *
 * Usage (z gra/): node tools/dead-ledger-probe-absent-test.cjs
 */

const fs = require('fs');
const path = require('path');

const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const MEASURE = path.join(__dirname, 'resource-ledger-live-measure.cjs');
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
const measureSrc = fs.readFileSync(MEASURE, 'utf8');

let passCount = 0;
let failCount = 0;
function check(label, cond, detail) {
  if (cond) {
    passCount++;
    console.log('  PASS: ' + label);
  } else {
    failCount++;
    console.log('  FAIL: ' + label + (detail ? ' -- ' + detail : ''));
  }
}

// Detektor martwej sondy: deklaracja `let ledgerAuditE3c...` albo odczyt `ledgerAuditE3c...` / `e3cLast`/`e3cFires` w snapshocie.
const PROBE_RE = /ledgerAuditE3c|e3cLast\s*:|e3cFires\s*:/;

console.log('========================================================================');
console.log('R-WEB-CLEAN-DEAD-LEDGER-PROBE-Q1 -- strażnik martwej sondy ledgerAuditE3c*');
console.log('========================================================================\n');

check('main.ts: brak deklaracji i odczytu ledgerAuditE3c*', !PROBE_RE.test(mainSrc));
check(
  'main.ts: snapshot __ledgerTestDebug nie zwraca pól e3cLast/e3cFires',
  !/e3cLast|e3cFires/.test(mainSrc),
);
check(
  'resource-ledger-live-measure.cjs: nie czyta sondy (brak s.e3cFires / s.e3cLast)',
  !/e3cFires|e3cLast/.test(measureSrc),
);

console.log('\n--- dowód mutacyjny (w pamięci; plik nie jest zmieniany) ---');
const mutated =
  mainSrc +
  '\n    let ledgerAuditE3cFires = 0;\n';
check('mutacja: przywrócenie deklaracji ledgerAuditE3cFires -> detektor łapie (czerwony)', PROBE_RE.test(mutated));
const mutatedRead = mainSrc.replace(
  'pending };\n        },',
  'pending, e3cFires: 0 };\n        },',
);
check(
  'mutacja: przywrócenie odczytu e3cFires w snapshocie -> detektor łapie (czerwony)',
  mutatedRead !== mainSrc && PROBE_RE.test(mutatedRead),
  'wzorzec snapshotu nie został znaleziony -- test do aktualizacji',
);

console.log('\n========================================================================');
console.log(`WYNIK: ${passCount} PASS / ${failCount} FAIL`);
console.log('========================================================================');
process.exit(failCount === 0 ? 0 : 1);
