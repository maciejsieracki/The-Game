'use strict';
/**
 * war-limit-after-truce-test.cjs — R-WEB-WAR-LIMIT-BYPASS-Q1 (wojna po rozejmie omija limit).
 *
 * Bug: ports.declareWarAfterTruce (main.ts, truceEndPorts) wznawiał wojnę po wygaśnięciu rozejmu
 * bez bramki warLimitAllowsDeclaration. Podczas rozejmu para nie jest liczona jako wojna, więc
 * w międzyczasie mogła powstać inna wojna naturalna i limit 1 był łamany.
 *
 * Poprawka: wznowienie sprawdza bramkę (typ z meta pary) — chyba że deklarujący wznowienia jest
 * graczem (adresat propozycji = strona niebędąca inicjatorem). Odmowa = brak wojny, rozejm dostaje
 * truceUntilTurn = turn + 1 (ponowna próba w kolejnej turze).
 *
 * Test źródłowy (main.ts jest zbyt duży na import). Przed sprawdzeniem usuwane są komentarze //,
 * więc zakomentowana linia nie liczy się jako kod (mutacja „// return;” daje FAIL).
 *  (0) funkcja declareWarAfterTruce istnieje w main.ts;
 *  (a) bramka limitu z typem wojny z meta pary i wyjątkiem gracza-deklarującego;
 *  (b) blok bramki kończy się `return;` (przy odmowie nie dochodzi do wojny);
 *  (c) odmowa przedłuża rozejm o 1 turę (truceUntilTurn: turn + 1) wewnątrz bloku odmowy;
 *  (d) wojna (applyDiploEventTracked 'wojna_wypowiedziana') dopiero PO bramce;
 *  (e) brak starej, bezwarunkowej formy wznowienia (wojna przed bramką).
 * Mutacje czerwone: usunięcie bramki (`if (false)`) lub `// return;` → FAIL.
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
const rawBody = startIdx >= 0 && endIdx > startIdx ? src.slice(startIdx, endIdx) : '';
// Usunięcie komentarzy liniowych: zakomentowany kod nie jest wykonywany.
const body = rawBody.replace(/\/\/[^\n]*/g, '');

const gateRe = /if \(!graczDeklaruje && !warLimitAllowsDeclaration\(a, b, typWojnyRozejm\)\) \{([\s\S]*?)\n\s*\}/;
const gateMatch = gateRe.exec(body);
const gateBlock = gateMatch ? gateMatch[1] : '';
const gateEnd = gateMatch ? gateMatch.index + gateMatch[0].length : -1;
const warIdx = body.indexOf("applyDiploEventTracked(a, b, cur, 'wojna_wypowiedziana')");

check(
  '(a) bramka limitu z typem wojny z meta pary i wyjątkiem gracza-deklarującego',
  gateMatch !== null &&
    body.includes('getWarTypFromMeta(metaWznow)') &&
    body.includes('truceEndOfferTarget(metaWznow.truceInitiatorId, a, b)') &&
    body.includes('const graczDeklaruje = deklarujacyWznowienia != null && isMe(deklarujacyWznowienia);'),
);
check('(b) blok odmowy kończy się return; (wojna nie wybucha przy odmowie)', /\breturn;\s*$/.test(gateBlock.trimEnd()) || /\breturn;/.test(gateBlock));
check('(c) odmowa przedłuża rozejm o 1 turę (truceUntilTurn: turn + 1) w bloku odmowy', gateBlock.includes('truceUntilTurn: turn + 1'));
check('(d) wojna ustawiana dopiero po bramce', warIdx >= 0 && gateEnd >= 0 && warIdx > gateEnd);
check('(e) brak starej bezwarunkowej formy wznowienia (wojna przed bramką)', gateEnd >= 0 && !body.slice(0, gateMatch.index).includes('wojna_wypowiedziana'));

console.log(`\nWynik: ${pass} PASS / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
