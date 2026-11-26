'use strict';
/**
 * diplo-war-tribute-once-test.cjs — R-WEB-DIPLO-HUMAN-PEACE-AND-WAR-TRIBUTE-FIX-Q1 (P17b).
 * W wojnie „zaproponuj trybut” z modala idzie jako jednorazowy (goldOnce), poza wojną bez zmian.
 * Użycie (z katalogu gra/): node tools/diplo-war-tribute-once-test.cjs
 */
const fs = require('fs');
const path = require('path');

const modal = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'diplomacyNegotiationModal.ts'), 'utf8');

let pass = 0;
let fail = 0;
function check(label, ok) {
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
}

const caseStart = modal.indexOf("case '8': {");
const caseEnd = modal.indexOf("case '9': {", caseStart);
const case8 = modal.slice(caseStart, caseEnd);

check('case 8 istnieje', caseStart >= 0 && caseEnd > caseStart);
check('goldOnce ustawiane tylko dla offer && ctx.atWar',
  /\.\.\.\(offer && ctx\.atWar \? \{ goldOnce: gpt \} : \{\}\)/.test(case8));
check('goldPerTurn nadal wysyłane (poza wojną bez zmian)',
  /goldPerTurn: gpt,/.test(case8));
check('tributeMode nadal ustawiane z trybu',
  /tributeMode: offer \? 'offer' : 'demand'/.test(case8));

console.log(`\nWYNIK: PASS=${pass} FAIL=${fail}`);
process.exit(fail ? 1 : 0);
