'use strict';
/**
 * battle-save-disabled-test.cjs
 *
 * TEMAT: R-WEB-BATTLE-SAVE-DISABLED-DURING-BATTLE-Q1.
 * Zapis gry (Ctrl+S, dialog zapisu z menu pauzy, autozapis rotacyjny, zapis szybki z
 * przycisków przed bitwą w scenie) jest niedostępny, gdy na ekranie jest scena bitwy
 * (ręczna, oblężenie, bitwa taktyczna) albo podsumowanie bitwy. Komunikat po polsku:
 * „Zapis niedostępny w trakcie bitwy".
 *
 * Warstwa STRUKTURALNA (bez przeglądarki): w src/main.ts każda ścieżka zapisu zawiera
 * bramkę `isSaveBlockedByBattle()` PRZED pierwszą operacją zapisu, a bramka opiera się na
 * `isBattleSceneOpen()` i `isPostBattleSummaryOpen()`. Dodatkowo MUTACJA: usunięcie bramki
 * z `persistSaveToSlot` w kopii źródła MUSI czerwienić test.
 *
 * Żywy test w Chromium (wejście do bitwy, próba zapisu, mutant zachowania) jest w
 * tools/battle-save-disabled-live-test.cjs; ten plik pozostaje warstwą strukturalną.
 *
 * Uruchomienie (z gra/): node tools/battle-save-disabled-test.cjs
 * Wyjście: kod 0 = wszystkie asercje OK; != 0 = co najmniej jedna porażka.
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const MAIN = path.join(GRA, 'src', 'main.ts');
const src = fs.readFileSync(MAIN, 'utf8');

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name + (detail ? ' -- ' + detail : '')); }
}

/** Zwraca tekst od sygnatury funkcji do następnej linii o tym samym wcięciu „}" (4 spacje). */
function functionBody(text, signature) {
  const start = text.indexOf(signature);
  if (start < 0) return null;
  const rest = text.slice(start);
  const end = rest.indexOf('\n    }\n');
  return end < 0 ? rest : rest.slice(0, end + 6);
}

const GUARD = 'isSaveBlockedByBattle()';
const MSG = 'Zapis niedostępny w trakcie bitwy';

/** Asercje strukturalne dla danego tekstu źródła; zwraca liczbę porażek. */
function assertStructure(text, label) {
  let bad = 0;
  const helper = functionBody(text, 'function isSaveBlockedByBattle(): boolean {');
  check(label + ': helper isSaveBlockedByBattle istnieje', !!helper);
  if (helper) {
    const usesBoth = helper.includes('isBattleSceneOpen()') && helper.includes('isPostBattleSummaryOpen()');
    if (!usesBoth) bad++;
    check(label + ': helper opiera się o isBattleSceneOpen i isPostBattleSummaryOpen', usesBoth);
  } else bad++;
  check(label + ': komunikat po polsku obecny', text.includes("'" + MSG + "'"));
  const entries = [
    'async function persistSaveToSlot(slotId: string, label: string): Promise<SaveToLocalResult> {',
    'async function doQuickSave(showHintOnSuccess = true): Promise<boolean> {',
    'async function doRotatingAutosave(): Promise<void> {',
    'function openSaveGameDialog(): void {',
  ];
  for (const sig of entries) {
    const short = sig.split('(')[0].replace(/^(async )?function /, '');
    const body = functionBody(text, sig);
    if (!body) { bad++; check(label + ': ' + short + ' znaleziona', false); continue; }
    const g = body.indexOf(GUARD);
    // Bramka musi wystąpić przed jakąkolwiek operacją zapisu w ciele funkcji.
    // Szukamy operacji zapisu w CIELE (po pierwszym „{" sygnatury), nie w samej sygnaturze.
    const bodyStart = body.indexOf('{') + 1;
    const writeIdx = Math.min(
      ...['saveToLocal(', 'fsaRotatingAutosaveWrite(', 'persistSaveToSlot(', 'showSaveGameDialog(']
        .map(k => { const i = body.indexOf(k, bodyStart); return i < 0 ? Infinity : i; }),
    );
    const ok = g >= 0 && g < writeIdx;
    if (!ok) bad++;
    check(label + ': ' + short + ' bramka przed zapisem', ok, 'guard@' + g + ' write@' + writeIdx);
  }
  return bad;
}

// 1) Struktura w rzeczywistym źródle.
assertStructure(src, 'src');

// 2) MUTACJA: usunięcie bramki z persistSaveToSlot musi czerwienić asercje.
{
  const sig = 'async function persistSaveToSlot(slotId: string, label: string): Promise<SaveToLocalResult> {';
  const i = src.indexOf(sig);
  const body = functionBody(src, sig) || '';
  const mutatedBody = body.replace(/if \(isSaveBlockedByBattle\(\)\) \{[\s\S]*?\n      \}\n/, '');
  const mutated = i < 0 ? src : src.slice(0, i) + mutatedBody + src.slice(i + body.length);
  const mutatedFails = assertStructureSilent(mutated);
  check('MUTACJA persistSaveToSlot bez bramki -> czerwień', mutatedFails > 0, 'bramka nie zniknęła z kopii' );
}

/** Jak assertStructure, ale bez wypisywania (do mutacji). */
function assertStructureSilent(text) {
  const saved = [pass, fail];
  const origLog = console.log;
  console.log = () => {};
  let bad;
  try { bad = assertStructure(text, 'mut'); }
  finally { console.log = origLog; pass = saved[0]; fail = saved[1]; }
  return bad;
}

console.log('\nWynik: ' + pass + ' PASS / ' + fail + ' FAIL');
process.exit(fail === 0 ? 0 : 1);
