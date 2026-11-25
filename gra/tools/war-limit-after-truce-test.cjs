'use strict';
/**
 * war-limit-after-truce-test.cjs — R-WEB-WAR-LIMIT-BYPASS-Q1 (wojna po rozejmie omija limit).
 *
 * Bug: ports.declareWarAfterTruce (main.ts, truceEndPorts) wznawiał wojnę po wygaśnięciu rozejmu
 * bez bramki warLimitAllowsDeclaration. Podczas rozejmu para nie jest liczona jako wojna, więc
 * w międzyczasie mogła powstać inna wojna naturalna i limit 1 był łamany.
 *
 * Poprawka: wznowienie sprawdza bramkę (typ z meta pary); odmowa = brak wojny, rozejm dostaje
 * truceUntilTurn = turn + 1 (ponowna próba w kolejnej turze).
 *
 * Test (źródłowy, bez esbuild — main.ts jest zbyt duży na import):
 *  (a) body declareWarAfterTruce zawiera bramkę warLimitAllowsDeclaration z typem z meta pary;
 *  (b) przy odmowie body NIE ustawia wojny (applyDiploEventTracked 'wojna_wypowiedziana' jest
 *      za bramką, przed nią jest return);
 *  (c) negatywna: odmowa ustawia truceUntilTurn = turn + 1 i nie woła wojny;
 *  (d) negatywna: stara, bezwarunkowa forma (wojna bez żadnej bramki przed nią) nie występuje.
 * Mutacja czerwona: usunięcie linii `if (!warLimitAllowsDeclaration(a, b, typWojnyRozejm))` -> FAIL.
 * Run: node tools/war-limit-after-truce-test.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MAIN = path.resolve(ROOT, 'src', 'main.ts');
const src = fs.readFileSync(MAIN, 'utf8');

let pass = 0;
let fail = 0;
function check(name, ok) {
  if (ok) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}

const startIdx = src.indexOf('declareWarAfterTruce: (a, b) => {');
check('(0) funkcja declareWarAfterTruce istnieje w main.ts', startIdx >= 0);
const endIdx = startIdx >= 0 ? src.indexOf('enqueueOffer:', startIdx) : -1;
const body = startIdx >= 0 && endIdx > startIdx ? src.slice(startIdx, endIdx) : '';

const gateIdx = body.indexOf('if (!warLimitAllowsDeclaration(a, b, typWojnyRozejm))');
const warIdx = body.indexOf("applyDiploEventTracked(a, b, cur, 'wojna_wypowiedziana')");
check('(a) bramka limitu z typem wojny z meta pary przed wznowieniem', gateIdx >= 0 && body.includes('getWarTypFromMeta(getDiploPairMeta(a, b))'));
check('(b) wojna nie jest ustawiana przed bramką (return przy odmowie)', gateIdx >= 0 && warIdx > gateIdx && body.slice(gateIdx, warIdx).includes('return;'));
check('(c) odmowa przedłuża rozejm o 1 turę (truceUntilTurn: turn + 1)', body.includes('truceUntilTurn: turn + 1'));
check('(d) brak starej bezwarunkowej formy wznowienia (wojna bez bramki)', warIdx > gateIdx && gateIdx >= 0 && !body.slice(0, gateIdx).includes('wojna_wypowiedziana'));

console.log(`\nWynik: ${pass} PASS / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
