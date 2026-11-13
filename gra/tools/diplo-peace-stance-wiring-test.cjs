'use strict';
/**
 * diplo-peace-stance-wiring-test.cjs -- R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 (runda 3, M13).
 * Kontrola STRUKTURALNA okablowania pozycji militarnej (main.ts nie jest importowalny w harnessie cjs):
 *  (s1) main.ts NIE liczy pozycji samodzielnie: brak wywołania peaceMilitaryPosition( w main.ts i ai.ts;
 *  (s2) oba miejsca main.ts wołają peaceStanceOf z kolejnością (self, partner):
 *       diploProposalWarState -> self = respondent (responderId), partner = proposer (proposerId);
 *       gateVerdict AI<->AI   -> self = zwycięzca (winner), partner = przegrany (loser);
 *  (s3) ai.ts wywołuje peaceStanceOf z (self = myPlayerId, partner = rel.partnerId);
 *  (s4) peaceStanceOf jest jedynym eksportem liczącym pozycję z id -> napis (String(self.id)).
 * Zachowanie samej funkcji (kolejność stron, remis) sprawdza diplo-peace-weaker-seeks-city-only-test.cjs.
 * Run: node tools/diplo-peace-stance-wiring-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(GRA, rel), 'utf8');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

const main = read('src/main.ts');
const ai = read('src/game/ai.ts');
const mil = read('src/game/diplomacy-military-strength.ts');

// (s1)
check('s1a main.ts nie wywołuje peaceMilitaryPosition (liczy przez peaceStanceOf)',
  !/peaceMilitaryPosition\s*\(/.test(main));
check('s1b ai.ts nie wywołuje peaceMilitaryPosition (liczy przez peaceStanceOf)',
  !/peaceMilitaryPosition\s*\(/.test(ai));

// (s2) main.ts: diploProposalWarState (respondent jako self)
const reMainResp = /const responderPozycjaMilitarna = peaceStanceOf\(\s*\{\s*id:\s*responderId,[^}]*\},\s*\{\s*id:\s*proposerId,/;
check('s2a diploProposalWarState: peaceStanceOf(self=responderId, partner=proposerId)', reMainResp.test(main));

// (s2) main.ts: gateVerdict AI<->AI (zwycięzca jako self)
const reMainGate = /pozycjaMilitarna:\s*peaceStanceOf\(\s*\{\s*id:\s*winner,[^}]*\},\s*\{\s*id:\s*loser,/;
check('s2b gateVerdict AI<->AI: peaceStanceOf(self=winner, partner=loser)', reMainGate.test(main));

// (s3) ai.ts
const reAi = /const peacePosMil: PeaceMilitaryPosition = rel\.silaMilitarnaAI && rel\.silaMilitarnaPartner\s*\?\s*peaceStanceOf\(\s*\/\/[^\n]*\n\s*\{\s*id:\s*inp\.myPlayerId,[^}]*\},\s*\{\s*id:\s*rel\.partnerId,/;
check('s3 ai.ts decideAIDiplomacy: peaceStanceOf(self=myPlayerId, partner=partnerId)', reAi.test(ai));

// (s4) funkcja wiążąca konwertuje id na napis po stronie funkcji
check('s4 peaceStanceOf konwertuje id przez String() (jeden klucz remisu)',
  /export function peaceStanceOf\([\s\S]*?id:\s*String\(self\.id\)[\s\S]*?id:\s*String\(partner\.id\)/.test(mil));

console.log('');
console.log('diplo-peace-stance-wiring-test: ' + pass + ' pass / ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
