'use strict';
/**
 * playtest-mapa-dirty-forecast-test.cjs — R-WEB-TEST-HOOK-PLAYTEST-MAPA-DIRTY-FORECAST-Q1 (K1).
 * Run: node tools/playtest-mapa-dirty-forecast-test.cjs [sciezka-do-main.ts]  (z katalogu gra/)
 *
 * Statyczny dowod (nie live): w presecie playtest=mapa (doStartPlaytestMiastoEkonomia)
 * miasta presetu są dokładane do `cities` i MUSI po tym nastąpić markCityStateDirty(),
 * inaczej prognoza bramki „Zakończ turę” nie jest przeliczona w t1 (empireEconDirty/powerDirty).
 * Argument opcjonalny pozwala uruchomić test na kopii zmutowanej (dowód mutacyjny).
 */

const fs = require('fs');
const path = require('path');

const srcPath = process.argv[2] || path.resolve(__dirname, '..', 'src', 'main.ts');
const src = fs.readFileSync(srcPath, 'utf8');

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name + (detail ? ' -- ' + detail : '')); }
}

// 1. Wyciągnij ciało doStartPlaytestMiastoEkonomia (od sygnatury do następnej funkcji na tym samym poziomie).
const startIdx = src.indexOf('async function doStartPlaytestMiastoEkonomia(');
check('funkcja presetu istnieje', startIdx >= 0);
let body = '';
if (startIdx >= 0) {
  const nextIdx = src.indexOf('\n    async function doStartPlaytestMapaSwiata(', startIdx);
  body = src.slice(startIdx, nextIdx > startIdx ? nextIdx : startIdx + 60000);
}

// 2. Dołożenie miast presetu (pętla cities.push) — punkt odniesienia.
const pushIdx = body.indexOf('cities.push(c);');
check('preset dokłada miasta (cities.push w ciele presetu)', pushIdx >= 0);

// 3. markCityStateDirty() wołane PO dołożeniu miast i PRZED końcem presetu.
const dirtyIdx = body.indexOf('markCityStateDirty();', pushIdx >= 0 ? pushIdx : 0);
check('markCityStateDirty() po cities.push w presecie playtest=mapa',
  pushIdx >= 0 && dirtyIdx > pushIdx,
  'brak wywołania po dołożeniu miast (K1)');

// 4. Wywołanie musi być w pętli/po pętli miast, nie po startRenderLoop (kolejność dowodowa).
const renderIdx = body.indexOf('startRenderLoop();');
check('markCityStateDirty() przed startRenderLoop()',
  dirtyIdx >= 0 && renderIdx > dirtyIdx,
  renderIdx < 0 ? 'brak startRenderLoop w ciele' : 'wywołanie po starcie pętli');

// 5. Zakres zmiany: markCityStateDirty w funkcji presetu występuje dokładnie raz.
const count = body.split('markCityStateDirty();').length - 1;
check('dokładnie jedno markCityStateDirty() w presecie', count === 1, 'liczba=' + count);

console.log('=== playtest-mapa-dirty-forecast-test: ' + pass + ' pass, ' + fail + ' fail ===');
process.exit(fail === 0 ? 0 : 1);
