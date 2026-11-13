'use strict';
/**
 * diplo-peace-stance-wiring-test.cjs -- R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 (runda 3, M13-M16).
 * Kontrola STRUKTURALNA okablowania pozycji militarnej (main.ts nie jest importowalny w harnessie cjs):
 *  (s1) main.ts i ai.ts NIE liczą pozycji samodzielnie: brak wywołania peaceMilitaryPosition(;
 *  (s2) źródła danych stron: diploProposalWarState -> resp = diploMilitarySideOf(responderId, proposerId),
 *       prop = diploMilitarySideOf(proposerId, responderId); gateVerdict -> wSide = diploMilitarySideOf(winner, loser),
 *       lSide = diploMilitarySideOf(loser, winner);
 *  (s3) DOSŁOWNE wywołania peaceStanceOf (po normalizacji białych znaków i usunięciu komentarzy //):
 *       każde pole sila/armiaPkt każdej strony musi pochodzić z właściwego obiektu (ta sama strona, to samo pole),
 *       kolejność (self, partner) zgodna z (s2). Zamiana sila<->armiaPkt albo stron zaczerwienia ten test;
 *  (s4) peaceStanceOf jest jedynym eksportem liczącym pozycję z id -> napis (String(self.id)).
 * Zachowanie samej funkcji (kolejność stron, remis) sprawdza diplo-peace-weaker-seeks-city-only-test.cjs.
 * Mutacje M13-M16 (diplo-peace-gate-mutation-run.cjs) muszą zaczerwienić ten test.
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

// Zwraca znormalizowaną treść wywołania peaceStanceOf( ... ) zaczynającego się po `anchor`
// (bez komentarzy //, z jedną spacją zamiast białych znaków); null gdy brak.
function callAfter(src, anchor) {
  const a = src.indexOf(anchor);
  if (a < 0) return null;
  const start = src.indexOf('peaceStanceOf(', a);
  if (start < 0) return null;
  let depth = 0;
  for (let j = start + 'peaceStanceOf'.length; j < src.length; j++) {
    const c = src[j];
    if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      if (depth === 0) {
        return src.slice(start, j + 1)
          .split('\n').map(l => l.replace(/\/\/.*$/, '')).join(' ')
          .replace(/\s+/g, ' ')
          .replace(/,\s*\)$/, ')')
          .trim();
      }
    }
  }
  return null;
}

const main = read('src/main.ts');
const ai = read('src/game/ai.ts');
const mil = read('src/game/diplomacy-military-strength.ts');

// (s1)
check('s1a main.ts nie wywołuje peaceMilitaryPosition (liczy przez peaceStanceOf)',
  !/peaceMilitaryPosition\s*\(/.test(main));
check('s1b ai.ts nie wywołuje peaceMilitaryPosition (liczy przez peaceStanceOf)',
  !/peaceMilitaryPosition\s*\(/.test(ai));

// (s2) źródła danych stron
check('s2a diploProposalWarState: resp = diploMilitarySideOf(responderId, proposerId)',
  /const resp = diploMilitarySideOf\(responderId, proposerId\);/.test(main));
check('s2b diploProposalWarState: prop = diploMilitarySideOf(proposerId, responderId)',
  /const prop = diploMilitarySideOf\(proposerId, responderId\);/.test(main));
check('s2c gateVerdict: wSide = diploMilitarySideOf(winner, loser)',
  /const wSide = diploMilitarySideOf\(winner, loser\);/.test(main));
check('s2d gateVerdict: lSide = diploMilitarySideOf(loser, winner)',
  /const lSide = diploMilitarySideOf\(loser, winner\);/.test(main));

// (s3) dosłowne wywołania — pola i kolejność stron
const callResp = callAfter(main, 'const responderPozycjaMilitarna = ');
check('s3a diploProposalWarState: peaceStanceOf( {responderId, resp.sila/armiaPkt}, {proposerId, prop.sila/armiaPkt}, ... )',
  callResp !== null && /^peaceStanceOf\( \{ id: responderId, sila: resp\.sila, armiaPkt: resp\.armiaPkt \}, \{ id: proposerId, sila: prop\.sila, armiaPkt: prop\.armiaPkt \}, PEACE_STRENGTH_GAP_PROC\)$/.test(callResp),
  callResp);

const callGate = callAfter(main, 'pozycjaMilitarna: peaceStanceOf');
check('s3b gateVerdict AI<->AI: peaceStanceOf( {winner, wSide.sila/armiaPkt}, {loser, lSide.sila/armiaPkt}, ... )',
  callGate !== null && /^peaceStanceOf\( \{ id: winner, sila: wSide\.sila, armiaPkt: wSide\.armiaPkt \}, \{ id: loser, sila: lSide\.sila, armiaPkt: lSide\.armiaPkt \}, PEACE_STRENGTH_GAP_PROC\)$/.test(callGate),
  callGate);

const callAi = callAfter(ai, 'const peacePosMil: PeaceMilitaryPosition');
check('s3c ai.ts decideAIDiplomacy: peaceStanceOf( {myPlayerId, silaMilitarnaAI.sila/armiaPkt}, {partnerId, silaMilitarnaPartner.sila/armiaPkt}, ... )',
  callAi !== null && /^peaceStanceOf\( \{ id: inp\.myPlayerId, sila: rel\.silaMilitarnaAI\.sila, armiaPkt: rel\.silaMilitarnaAI\.armiaPkt \}, \{ id: rel\.partnerId, sila: rel\.silaMilitarnaPartner\.sila, armiaPkt: rel\.silaMilitarnaPartner\.armiaPkt \}, PEACE_STRENGTH_GAP_PROC\)$/.test(callAi),
  callAi);

// (s4) funkcja wiążąca konwertuje id na napis po stronie funkcji
check('s4 peaceStanceOf konwertuje id przez String() (jeden klucz remisu)',
  /export function peaceStanceOf\([\s\S]*?id:\s*String\(self\.id\)[\s\S]*?id:\s*String\(partner\.id\)/.test(mil));

console.log('');
console.log('diplo-peace-stance-wiring-test: ' + pass + ' pass / ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
