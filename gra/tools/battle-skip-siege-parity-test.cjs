'use strict';
/**
 * battle-skip-siege-parity-test.cjs -- R-WEB-BATTLE-SKIP-SIEGE-TRUE-RESULT-Q1.
 *
 * Przyczyna (diagnoza w 01-operator-r1.md): oblezenie bez wylomu nie konczy sie silnikiem
 * (_updateStallWatch pomija oblezenie, wiec _stalled nigdy nie jest true, a regula
 * "SZTURM ODPARTY" z _checkEnd nie odpala). AUTO krecil sie bez konca (zmierzone: 150 s
 * wall, tura 23, brak wyniku). Pomin przewijal do sufitu FF_MAX_ROUNDS i tam rozstrzygal
 * PAT po samym morale armii -- atakujacy z wyzszym ulamkiem morale bral miasto bez wylomu.
 *
 * Poprawka: wspolna funkcja _capRoundWinner() (oblezenie bez wylomu -> obronca; poza tym
 * morale, remis -> obronca) uzywana przez przewijanie (_ffRoundCapResult) ORAZ przez AUTO
 * (_checkEnd, gdy roundNo >= FF_MAX_ROUNDS). Test statyczny sprawdza, ze obie sciezki
 * uzywaja tej samej funkcji i ze stara, surowa regula morale nie zostala w sciezce sufitu.
 *
 * CZESC B (zywa scena Chromium, AUTO vs Pomin na ?playtest=oblezenie-duze, N ziaren) NIE
 * jest zaimplementowana w tym przebiegu: AUTO do sufitu 400 tur to ok. 45 min wall przy 1x
 * (zmierzone: tura 23 po 150 s, WSKIP_PT=oblezenie-duze w battle-skip-equals-auto-resolve-test.cjs).
 * Zwraca NIE_ZMIERZONO.
 *
 * Run z gra/: node tools/battle-skip-siege-parity-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const SRC = fs.readFileSync(path.join(GRA, 'src/battle/battleScene.ts'), 'utf8');

let pass = 0; let fail = 0; let nz = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

/** Zwraca tresc metody (od sygnatury do pierwszej linii '  }' na tym samym poziomie). */
function methodBody(sig) {
  const start = SRC.indexOf(sig);
  if (start < 0) return null;
  const end = SRC.indexOf('\n  }\n', start);
  return end < 0 ? null : SRC.slice(start, end + 4);
}

// S1 -- wspolna funkcja rozstrzygania sufitu istnieje i ma regule oblezenia.
const capBody = methodBody('private _capRoundWinner(');
check('S1 _capRoundWinner istnieje', !!capBody);
check(
  'S2 oblezenie bez wylomu -> obronca (siegeWallCol>=0 && !wallEverBreached)',
  !!capBody && /siegeWallCol\s*>=\s*0\s*&&\s*!this\.wallEverBreached[\s\S]*?winner:\s*'obronca'/.test(capBody),
  capBody && capBody.slice(0, 400),
);

// S3 -- przewijanie korzysta z funkcji wspolnej, bez surowego porownania morale.
const ffBody = methodBody('private _ffRoundCapResult(');
check('S3 _ffRoundCapResult wola _capRoundWinner', !!ffBody && ffBody.includes('this._capRoundWinner()'));
check(
  'S4 _ffRoundCapResult nie porownuje morale wprost',
  !!ffBody && !/ratioA\s*<=\s*ratioD/.test(ffBody),
);

// S5 -- AUTO (_checkEnd) stosuje ten sam werdykt na sufitcie tur.
const endBody = methodBody('private _checkEnd(): boolean {');
check('S5 _checkEnd wola _capRoundWinner na sufitcie FF_MAX_ROUNDS',
  !!endBody && /roundNo\s*>=\s*FF_MAX_ROUNDS[\s\S]*?this\._capRoundWinner\(\)/.test(endBody));

// S6 -- skip() w trakcie gry nie wola osobnego rachunku (poza awaryjnym !started).
const skipBody = methodBody('  skip(): void {');
const instantCalls = skipBody ? (skipBody.match(/_skipInstantFallback\(\)/g) || []).length : -1;
check('S6 skip() uzywa FF (jedna sciezka awaryjna !started)', instantCalls === 1, { instantCalls });

// S7 -- regresja: istniejace testy skip (czesc A/C) nadal przechodza.
// (uruchamiane osobno przez operatora; tu tylko kontrola, ze plik istnieje)
check('S7 istniejacy test battle-skip-equals-auto-resolve-test.cjs obecny',
  fs.existsSync(path.join(GRA, 'tools/battle-skip-equals-auto-resolve-test.cjs')));

// CZESC B -- zywa scena (NIE_ZMIERZONO w tym przebiegu, patrz naglowek).
nz++;
console.log('NIE_ZMIERZONO: B (zywa scena AUTO vs Pomin na oblezenie-duze): AUTO do sufitu 400 tur ~45 min wall przy 1x; czesc B nie zaimplementowana w tym przebiegu');

console.log(`RESULT pass=${pass} fail=${fail} nie_zmierzono=${nz}`);
process.exit(fail === 0 ? 0 : 1);
