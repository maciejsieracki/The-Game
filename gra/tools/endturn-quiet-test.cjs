'use strict';
/**
 * endturn-quiet-test.cjs — R-WEB-ENDTURN-QUIET-CLICK-Q1 (tag ENDQUIET).
 *
 * Regresja po FALI 933: cykl syncEndTurnState (co 500 ms) i render przycisku wołały
 * canPlayerInitiateEndTurn() w wersji głośnej, więc w stanie zablokowanym sypało
 * console.warn('[EndTurn] blocked: …') ~2 razy/s. Poprawka: parametr quiet=true dla
 * odczytów pasywnych (HUD config.canEndTurn), a każdy console.warn w funkcji jest
 * bramkowany przez `!quiet`. Klik gracza (endActiveHumanTurn/advanceSeat) zostaje głośny.
 *
 * Test statyczny na src/main.ts (funkcja jest zamknięta w boot(), nie da się jej
 * wyciągnąć do bundla bez całej gry). Czerwone przed poprawką, zielone po.
 *
 * Usage (z gra/): node tools/endturn-quiet-test.cjs
 */
const fs = require('fs');
const path = require('path');

const MAIN = path.resolve(__dirname, '..', 'src', 'main.ts');
const src = fs.readFileSync(MAIN, 'utf8');
let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  PASS: ' + label); }
  else { fail++; console.error('  FAIL: ' + label); }
}

const fnStart = src.indexOf('function canPlayerInitiateEndTurn(');
const fnEnd = src.indexOf('function hintEndTurnBlocked(', fnStart);
ok(fnStart > 0 && fnEnd > fnStart, 'funkcja canPlayerInitiateEndTurn znaleziona');
const body = src.slice(fnStart, fnEnd);

ok(/function canPlayerInitiateEndTurn\(quiet = false\): boolean/.test(body), 'sygnatura quiet = false');

const warns = body.match(/console\.warn\(/g) || [];
const gated = body.match(/if \(!quiet\) console\.warn\(/g) || [];
ok(warns.length > 0 && warns.length === gated.length,
  `każdy console.warn w funkcji bramkowany przez !quiet (${gated.length}/${warns.length})`);

ok(/canEndTurn: \(\) => canPlayerInitiateEndTurn\(true\),/.test(src),
  'HUD config.canEndTurn (cykl 500 ms + render) używa wersji cichej');

// Klik gracza nadal loguje: endActiveHumanTurn wola wersje domyslna (glosna).
const trig = src.indexOf('function endActiveHumanTurn(');
ok(trig > 0 && /if \(!canPlayerInitiateEndTurn\(\)\) \{\s*console\.warn\(/.test(src.slice(trig, trig + 400)),
  'klik (endActiveHumanTurn) zachowuje głośny log przy blokadzie');

ok(/healStaleEndTurnBlockers\(\);\n\s*if \(playtestWalkaActive\)/.test(body),
  'healStaleEndTurnBlockers() nadal wołane przed bramkami (semantyka bez zmian)');

// Ścieżki KLIKU gracza (advanceSeat ← triggerPlayerEndTurn, endActiveHumanTurn) muszą
// wołać wersję GŁOŚNĄ: bramka advanceSeat() ma console.warn przy odrzuceniu kliku.
const advStart = src.indexOf('function advanceSeat(');
const advEnd = src.indexOf('function triggerPlayerEndTurn(', advStart);
ok(advStart > 0 && advEnd > advStart, 'funkcja advanceSeat znaleziona');
const advBody = src.slice(advStart, advEnd);
ok(/if \(!canPlayerInitiateEndTurn\(\)\) \{/.test(advBody) && !/canPlayerInitiateEndTurn\(true\)/.test(advBody),
  'advanceSeat (klik) woła wersję głośną canPlayerInitiateEndTurn()');
const trigStart = src.indexOf('function triggerPlayerEndTurn(');
const trigEnd = src.indexOf('window.addEventListener', trigStart);
ok(trigStart > 0 && trigEnd > trigStart && !/canPlayerInitiateEndTurn\(/.test(src.slice(trigStart, trigEnd)),
  'triggerPlayerEndTurn (klik) nie woła wersji cichej ani własnej bramki');
// Jedyne wywołanie wersji cichej to HUD config.canEndTurn (cykl 500 ms + render przycisku).
const quietCalls = src.match(/canPlayerInitiateEndTurn\(true\)/g) || [];
ok(quietCalls.length === 1, `dokładnie jedno wywołanie wersji cichej w kodzie (${quietCalls.length})`);

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
