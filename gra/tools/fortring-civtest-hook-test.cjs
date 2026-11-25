'use strict';
// R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1: test ZRODLOWY haka przelacznika pierscienia fortow.
// Pilnuje, ze przelacznik (`_civTestFortRingOff`) istnieje WYLACZNIE pod ?civTest=1:
//  - flaga jest zmieniana tylko w haku `setFortRingOff` (jedno przypisanie poza deklaracja),
//  - funkcja czytajaca flage wymaga `/[?&]civTest=1/` w location.search,
//  - oba miejsca uzycia (wezly terytorium fortu, blokada budowy w pierscieniu) czytaja flage przez te funkcje.
// Bez parametru ?civTest=1 flaga zawsze zwraca false -> zachowanie gry jak dotad.
// Usage (z gra/): node tools/fortring-civtest-hook-test.cjs [sciezka/do/main.ts]
// Mutacja: usuniecie `/[?&]civTest=1/` z civTestFortRingOffFlag musi czerwienic ten test (exit 1).
const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'src', 'main.ts'));
const src = fs.readFileSync(file, 'utf8');
let pass = 0;
let fail = 0;
const check = (name, ok) => {
  if (ok) { pass++; console.log('PASS: ' + name); } else { fail++; console.log('FAIL: ' + name); }
};

const declCount = (src.match(/^let _civTestFortRingOff = false;$/gm) || []).length;
check('deklaracja _civTestFortRingOff (domyslnie false) wystepuje dokladnie raz', declCount === 1);

const flagLine = (src.match(/^const civTestFortRingOffFlag = .*$/m) || [''])[0];
check('civTestFortRingOffFlag wymaga location.search z civTest=1',
  /\/\[\?&\]civTest=1\//.test(flagLine) && /_civTestFortRingOff\s*&&/.test(flagLine));

const assigns = src.match(/_civTestFortRingOff\s*=[^=][^;]*;/g) || [];
const nonDecl = assigns.filter(a => a !== '_civTestFortRingOff = false;');
check('przypisanie flagi tylko w haku setFortRingOff (poza deklaracja: 1 raz)',
  nonDecl.length === 1 && /setFortRingOff:\s*\(off: boolean\): void => \{ _civTestFortRingOff = off; setCivTestFortRingOff\(civTestFortRingOffFlag\(\)\); \}/.test(src));

const terr = fs.readFileSync(path.join(path.dirname(file), 'map', 'territory.ts'), 'utf8');
check('territory.ts: przełącznik reguły (civTestFortRingOff) ustawiany tylko przez setCivTestFortRingOff',
  (terr.match(/civTestFortRingOff\s*=[^=][^;]*;/g) || []).filter(a => a !== 'civTestFortRingOff = false;').length === 1 && /export function setCivTestFortRingOff\(off: boolean\): void \{ civTestFortRingOff = off; \}/.test(terr));
check('territory.ts: fortRingBuildBlockReason zwraca null przy przełączniku OFF',
  /export function fortRingBuildBlockReason[\s\S]*?if \(civTestFortRingOff\) return null;/.test(terr));

check('haki setFortRingOff / fortRingOff / fortCount sa w bloku __settingsLive',
  (() => {
    const i = src.indexOf('(window as any).__settingsLive = {');
    const j = src.indexOf('setFortRingOff:', i);
    return i > 0 && j > i && j - i < 4000;
  })());

check('wezly terytorium fortu czytaja przelacznik (ring OFF = bez predykatu ochrony)',
  /!civTestFortRingOffFlag\(\) && fortRingHasOwnImprovement\(f, improvementOwnerByHex\)/.test(src));
check('blokada budowy w pierscieniu czyta przelacznik (ring OFF = bez blokady w main.ts)',
  /const fortRingBlock = civTestFortRingOffFlag\(\) \? null : fortRingBuildBlockReason\(/.test(src));

console.log(`\n${pass} PASS, ${fail} FAIL`);
process.exitCode = fail ? 1 : 0;
