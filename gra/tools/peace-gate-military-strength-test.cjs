'use strict';
/**
 * peace-gate-military-strength-test.cjs -- R-WEB-AUDIT-PEACE-GATE-MILITARY-STRENGTH-Q1.
 * Kontrola STRUKTURALNA (main.ts nie jest importowalny w harnessie cjs):
 *  (p1) ścieżka prośby przegrywającej AI↔AI (registerAiAiPeaceRequest) i jej odsłona requesterShareOf
 *       (runAiAiPeaceTick) liczą udział przez aiAiMilitaryRequesterShare (siła militarna z diploMilitarySideOf),
 *       NIE przez objectivePowerForOwner (Power);
 *  (p2) helper aiAiMilitaryRequesterShare woła requesterShare wyłącznie na .sila z diploMilitarySideOf (obie strony);
 *  (p3) w main.ts nie ma żadnego requesterShare(objectivePowerForOwner(...)).
 * Mutacja: powrót do Power w którymkolwiek z tych miejsc musi zaczerwienić test.
 * Run: node tools/peace-gate-military-strength-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

function bodyOf(anchor, len) {
  const a = src.indexOf(anchor);
  return a < 0 ? null : src.slice(a, a + len);
}

const helper = bodyOf('function aiAiMilitaryRequesterShare(', 400);
check('p2 helper aiAiMilitaryRequesterShare istnieje', helper !== null);
check('p2 helper liczy requesterShare na .sila z diploMilitarySideOf (obie strony)',
  helper !== null
  && /requesterShare\(\s*diploMilitarySideOf\(requesterId,\s*otherId,\s*true\)\.sila\s*,\s*diploMilitarySideOf\(otherId,\s*requesterId,\s*true\)\.sila,?\s*\)/.test(helper),
  helper);
check('p2 helper nie czyta Power (objectivePowerForOwner)', helper !== null && !/objectivePowerForOwner/.test(helper));

const reg = bodyOf('function registerAiAiPeaceRequest(', 900);
check('p1 registerAiAiPeaceRequest liczy udział przez aiAiMilitaryRequesterShare',
  reg !== null && /const share = aiAiMilitaryRequesterShare\(requesterId, otherId\);/.test(reg), reg && reg.slice(0, 400));
check('p1 registerAiAiPeaceRequest nie używa objectivePowerForOwner', reg !== null && !/objectivePowerForOwner/.test(reg));

check('p1 runAiAiPeaceTick requesterShareOf używa aiAiMilitaryRequesterShare',
  /requesterShareOf:\s*\(rq,\s*ot\)\s*=>\s*aiAiMilitaryRequesterShare\(rq,\s*ot\)/.test(src));

check('p3 brak requesterShare(objectivePowerForOwner(...)) w całym main.ts',
  !/requesterShare\(\s*objectivePowerForOwner\(/.test(src));

console.log(`\nWynik: ${pass} PASS / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
