'use strict';
/**
 * playtest-mapa-dirty-forecast-test.cjs — R-WEB-TEST-HOOK-PLAYTEST-MAPA-DIRTY-FORECAST-Q1 (K1).
 * Run: node tools/playtest-mapa-dirty-forecast-test.cjs [sciezka-do-main.ts]  (z katalogu gra/)
 *
 * Statyczny dowod (nie live): w obu presetach miast (playtest=mapa -> doStartPlaytestMapaSwiata,
 * playtest=miasto -> doStartPlaytestMiastoEkonomia) miasta presetu są dokładane do `cities`
 * i MUSI po tym nastąpić markCityStateDirty() w ciele TEJ funkcji, inaczej prognoza bramki
 * „Zakończ turę” nie jest przeliczona w t1 (empireEconDirty/powerDirty).
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

// Wyciąga ciało funkcji od sygnatury do następnej funkcji na poziomie 4 spacji.
function functionBody(fnName) {
  const startIdx = src.indexOf('async function ' + fnName + '(');
  if (startIdx < 0) return null;
  const re = /\n    (?:async )?function /g;
  re.lastIndex = startIdx + 1;
  const m = re.exec(src);
  const endIdx = m ? m.index : startIdx + 60000;
  return src.slice(startIdx, endIdx);
}

const PRESETS = ['doStartPlaytestMapaSwiata', 'doStartPlaytestMiastoEkonomia'];

for (const fnName of PRESETS) {
  const tag = '[' + fnName + ']';
  const body = functionBody(fnName);
  check(tag + ' funkcja presetu istnieje', body !== null);
  const b = body || '';

  // 1. Dołożenie miast presetu (pętla cities.push) — punkt odniesienia.
  const pushIdx = b.indexOf('cities.push(c);');
  check(tag + ' preset dokłada miasta (cities.push w ciele)', pushIdx >= 0);

  // 2. markCityStateDirty() wołane PO dołożeniu miast w ciele tej funkcji.
  const dirtyIdx = b.indexOf('markCityStateDirty();', pushIdx >= 0 ? pushIdx : 0);
  check(tag + ' markCityStateDirty() po cities.push',
    pushIdx >= 0 && dirtyIdx > pushIdx,
    'brak wywołania po dołożeniu miast (K1)');

  // 3. Jeśli ciało uruchamia pętlę renderu, markCityStateDirty() musi być przed nią.
  const renderIdx = b.indexOf('startRenderLoop();');
  if (renderIdx >= 0) {
    check(tag + ' markCityStateDirty() przed startRenderLoop()',
      dirtyIdx >= 0 && renderIdx > dirtyIdx,
      'wywołanie po starcie pętli');
  }

  // 4. Zakres zmiany: w ciele presetu markCityStateDirty() występuje dokładnie raz.
  const count = b.split('markCityStateDirty();').length - 1;
  check(tag + ' dokładnie jedno markCityStateDirty() w presecie', count === 1, 'liczba=' + count);
}

console.log('=== playtest-mapa-dirty-forecast-test: ' + pass + ' pass, ' + fail + ' fail ===');
process.exit(fail === 0 ? 0 : 1);
