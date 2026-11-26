'use strict';
/**
 * diplo-human-peace-no-war-test.cjs — R-WEB-DIPLO-HUMAN-PEACE-AND-WAR-TRIBUTE-FIX-Q1 (P21c).
 * Pokój między dwoma fotelami ludzkimi wymaga trwającej wojny (status 'wojna').
 * Test źródłowy: strażnik jest w obu ścieżkach wejścia (propozycja i akceptacja) przed
 * wykonaniem traktatu i zwraca ten sam powód co silnik AI.
 * Użycie (z katalogu gra/): node tools/diplo-human-peace-no-war-test.cjs
 */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

let pass = 0;
let fail = 0;
function check(label, ok) {
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
}
function bodyOf(name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) return '';
  const next = src.indexOf('\n    function ', start + 10);
  return src.slice(start, next < 0 ? start + 4000 : next);
}

const proposeBody = bodyOf('proposeToHuman');
const respondBody = bodyOf('respondToHumanProposal');

check('strażnik humanPeaceRejectReason zdefiniowany',
  /function humanPeaceRejectReason\(/.test(src));
check('strażnik sprawdza status wojna i zwraca powód zgodny z AI',
  /status === 'wojna'\) return null;[\s\S]{0,200}Pokój — brak trwającej wojny/.test(src));
check('proposeToHuman wywołuje strażnika przed dopisaniem do skrzynki',
  proposeBody.indexOf('humanPeaceRejectReason(') >= 0 &&
  proposeBody.indexOf('humanPeaceRejectReason(') < proposeBody.indexOf('interHumanDiplomacyInbox.push'));
check('respondToHumanProposal (accept pokoju) sprawdza strażnika przed finalizePeaceTreatyBetween',
  respondBody.indexOf('humanPeaceRejectReason(p.fromOwnerId') >= 0 &&
  respondBody.indexOf('humanPeaceRejectReason(p.fromOwnerId') <
    respondBody.indexOf('finalizePeaceTreatyBetween(p.fromOwnerId'));
check('brak nowej stałej bramki czasu (10 tur nietknięte)',
  !/PEACE_HUMAN_MIN_TURNS/.test(src));

console.log(`\nWYNIK: PASS=${pass} FAIL=${fail}`);
process.exit(fail ? 1 : 0);
