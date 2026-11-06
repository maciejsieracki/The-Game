'use strict';
/**
 * R-WEB-PERF-ENDTURN-AI-PHASE-Q1: test STATYCZNY okablowania main.ts (okno stawek AI-dyplomacji).
 *  NOTA: main.ts nie jest uruchamialny headless, wiec test jest STATYCZNY (okablowanie okna). Rownowaznosc zywa (okno vs bez okna)
 *  NIE_ZMIERZONO w tej rundzie. Uwaga: getResourceAccessForCity w resource-access.ts wola getCityResourceAccessForCity (liczy potential) --
 *  zamiana w main.ts nic by nie dala; wlasciwa naprawa wymaga edycji resource-access.ts (poza allowlista R1).
 *  W2: main.ts: okno aiDiploRatesCache/aiDiploTyAll otwierane PRZED budowa relacjeDip, zamykane przed `if (relacjeDip.length > 0)`
 *      i w finally dyplomacji; mergedResourceRatesForOwner korzysta z okna tylko gdy !== null.
 * Bramka: node tools/perf-endturn-ai-phase-equiv-test.cjs
 */
const path = require('node:path');
const assert = require('node:assert/strict');
const fs = require('node:fs');

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('PASS:', name); };

const main = fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8');

t('W2: okno aiDiploRatesCache/aiDiploTyAll -- otwarcie, zamkniecia, uzycie', () => {
  const open = main.indexOf("const relacjeDip: DiplomacjaInputs['relacje'] = [];");
  const openMark = main.indexOf('aiDiploRatesCache = new Map();', open);
  assert.ok(open > 0 && openMark > open && openMark - open < 200, 'otwarcie okna tuz po deklaracji relacjeDip');
  const close = main.indexOf('if (relacjeDip.length > 0) {', open);
  const closeMark = main.lastIndexOf('aiDiploRatesCache = null;', close);
  assert.ok(closeMark > openMark && close - closeMark < 120, 'zamkniecie okna tuz przed uzyciem relacjeDip');
  const block = main.slice(openMark, closeMark);
  assert.ok(!/\bawait\b/.test(block.replace(/\/\/.*$/gm, '')), 'w oknie nie moze byc await (stan swiata mogl by sie zmienic)');
  assert.ok(!/\bdecideAITurn\(|\bapplyAiAiHandelSurowiecCmd\(|\bsetCityOwner|\bcities\.push\(|\bcityBuilt\.set\(/.test(block), 'w oknie nie moze byc komend mutujacych swiat');
  const fin = main.indexOf('aiDiploQtyOptionsCache = null;\n              aiDiploRatesCache = null;', closeMark);
  assert.ok(fin > 0, 'zamkniecie w finally dyplomacji');
  assert.ok(main.includes('if (aiDiploRatesCache !== null) {'), 'mergedResourceRatesForOwner sprawdza okno');
});

console.log('OK', pass, 'testow');
