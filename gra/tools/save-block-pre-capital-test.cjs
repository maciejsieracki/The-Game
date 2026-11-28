'use strict';
/**
 * save-block-pre-capital-test.cjs
 *
 * TEMAT: R-WEB-SAVE-BLOCK-PRE-CAPITAL-Q43B (decyzja właściciela B, ECHO 14:16 UTC).
 * Przed założeniem pierwszego miasta (stolicy) zapis gry jest niedostępny; komunikat:
 * „Zapis niedostępny przed założeniem pierwszego miasta”. Po założeniu stolicy zapis działa
 * jak dotąd. Wczytywanie zapisu NIE jest blokowane.
 *
 * Warstwa STRUKTURALNA (bez przeglądarki): w src/main.ts każda ścieżka zapisu zawiera
 * bramkę `isSaveBlockedByFirstCity()` PRZED operacją zapisu; predykat opiera się o
 * `isAwaitingFirstPlayerCity(oid)` dla każdego fotela ludzkiego; wczytywanie
 * (restoreGameFromSave / loadGameFromSlot) nie wywołuje bramki. Mutacje semantyczne w
 * kopii źródła MUSZĄ czerwienić test.
 *
 * Uruchomienie (z gra/): node tools/save-block-pre-capital-test.cjs
 * Wyjście: kod 0 = wszystkie asercje OK; != 0 = co najmniej jedna porażka.
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const MAIN = path.join(GRA, 'src', 'main.ts');
const SRC = fs.readFileSync(MAIN, 'utf8');

const GUARD = 'isSaveBlockedByFirstCity()';
const MSG = 'Zapis niedostępny przed założeniem pierwszego miasta';

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name + (detail ? ' -- ' + detail : '')); }
}

/** Tekst funkcji od sygnatury do domknięcia na tym samym wcięciu. */
function functionBody(text, signature) {
  const start = text.indexOf(signature);
  if (start < 0) return null;
  const rest = text.slice(start);
  const end = rest.indexOf('\n    }\n');
  return end < 0 ? rest : rest.slice(0, end + 6);
}

/** Pozycja pierwszego wystąpienia bramki w funkcji (-1 = brak). */
function guardIndexIn(body) {
  return body ? body.indexOf(GUARD) : -1;
}

/** Asercje strukturalne dla danego tekstu źródła; zwraca liczbę porażek. */
function assertStructure(text, label) {
  let bad = 0;
  const bad0 = fail;

  // 1. Predykat: per fotel ludzki, oparty o isAwaitingFirstPlayerCity.
  const pred = functionBody(text, 'function isSaveBlockedByFirstCity(): boolean {');
  check(label + ': predykat isSaveBlockedByFirstCity istnieje', !!pred);
  if (pred) {
    const perSeat = pred.includes('return humanSeats.humanOwnerIds.some(oid => isAwaitingFirstPlayerCity(oid));');
    check(label + ': predykat sprawdza każdy fotel ludzki przez isAwaitingFirstPlayerCity', perSeat);
  }

  // 2. Komunikat dokładny.
  check(label + ': komunikat dokładny obecny', text.includes("'" + MSG + "'"));

  // 3. Bramka w każdej ścieżce zapisu, PRZED operacją zapisu.
  const paths = [
    { sig: 'async function persistSaveToSlot(slotId: string, label: string): Promise<SaveToLocalResult> {', writeOp: 'saveToLocal(' },
    { sig: 'async function doQuickSave(showHintOnSuccess = true): Promise<boolean> {', writeOp: 'persistSaveToSlot(' },
    { sig: 'function openSaveGameDialog(): void {', writeOp: 'showSaveGameDialog(' },
    { sig: 'async function doRotatingAutosave(): Promise<void> {', writeOp: 'fsaRotatingAutosaveWrite(' },
  ];
  for (const p of paths) {
    const body = functionBody(text, p.sig);
    const label2 = label + ': ' + p.sig.split('(')[0].replace(/^(async )?function /, '');
    check(label2 + ' istnieje', !!body);
    if (!body) { bad++; continue; }
    const g = guardIndexIn(body);
    const w = body.indexOf(p.writeOp);
    const ok = g >= 0 && (w < 0 || g < w);
    check(label2 + ': bramka zapisu przed stolicą przed operacją zapisu', ok, 'guard=' + g + ' write=' + w);
    if (!ok) bad++;
  }

  // 4. Wczytywanie NIE jest blokowane: w ciele loadGameFromSlot i restoreGameFromSave brak bramki.
  for (const sig of ['async function loadGameFromSlot(slotId: string, fromInGamePause = false): Promise<void> {', 'function restoreGameFromSave(saved: SaveGame): void {']) {
    const body = functionBody(text, sig);
    const present = !!body;
    check(label + ': ' + sig.split('(')[0].replace(/^(async )?function /, '') + ' istnieje', present);
    if (!present) { bad++; continue; }
    const noGuard = !body.includes(GUARD);
    check(label + ': ' + sig.split('(')[0].replace(/^(async )?function /, '') + ' bez bramki zapisu', noGuard);
    if (!noGuard) bad++;
  }

  // 5. Po założeniu stolicy predykat zwraca false (jedna gałąź przez isAwaitingFirstPlayerCity).
  const awaitingDef = functionBody(text, 'function isAwaitingFirstPlayerCity(ownerId: number = ME()): boolean {');
  check(label + ': isAwaitingFirstPlayerCity zachowany (computeAwaitingFirstPlayerCity)', !!awaitingDef && awaitingDef.includes('computeAwaitingFirstPlayerCity('));
  if (!awaitingDef || !awaitingDef.includes('computeAwaitingFirstPlayerCity(')) bad++;

  // 6. Komunikat bitwy nietknięty (regresja sąsiedniej blokady).
  check(label + ': bramka bitwy nadal obecna w persistSaveToSlot', functionBody(text, 'async function persistSaveToSlot(slotId: string, label: string): Promise<SaveToLocalResult> {').includes('isSaveBlockedByBattle()'));

  bad = fail - bad0;
  return bad;
}

// Asercje na prawdziwym źródle.
const realBad = assertStructure(SRC, 'REAL');
console.log(realBad === 0 ? 'REAL: strukturalne OK' : 'REAL: porażki=' + realBad);

// MUTACJE semantyczne: każda MUSI czerwienić test (assertStructure zwraca > 0).
function mutantFails(label, mutate) {
  const mutated = mutate(SRC);
  if (mutated === SRC) {
    check('MUTANT ' + label + ': mutacja nie zmieniła źródła (błąd testu)', false);
    return;
  }
  // Wyłączamy wypisywanie wewnętrznych PASS/FAIL dla mutanta, liczymy tylko porażki.
  const savedLog = console.log;
  const savedPass = pass;
  const savedFail = fail;
  let mutBad = 0;
  console.log = () => {};
  try {
    mutBad = assertStructure(mutated, 'MUT');
  } finally {
    console.log = savedLog;
    pass = savedPass;
    fail = savedFail;
  }
  check('MUTANT ' + label + ': test czerwieni (porażki=' + mutBad + ')', mutBad > 0);
}

mutantFails('brak bramki w persistSaveToSlot', (s) => s.replace(
  "      if (isSaveBlockedByFirstCity()) {\n        notifySaveBlockedByFirstCity();\n        return { ok: false, reason: 'other' };\n      }\n",
  '',
));
mutantFails('brak bramki w doQuickSave (Ctrl+S)', (s) => s.replace(
  "      if (isSaveBlockedByFirstCity()) {\n        notifySaveBlockedByFirstCity();\n        return false;\n      }\n",
  '',
));
mutantFails('brak bramki w openSaveGameDialog (menu)', (s) => s.replace(
  "      if (isSaveBlockedByFirstCity()) {\n        notifySaveBlockedByFirstCity();\n        return;\n      }\n      void showSaveGameDialog({",
  '      void showSaveGameDialog({',
));
mutantFails('brak bramki w autozapisie rotacyjnym', (s) => s.replace(
  "      if (isSaveBlockedByFirstCity()) {\n        console.warn('[Autosave] pomijam -- przed założeniem pierwszego miasta, tura=' + turn);\n        return;\n      }\n",
  '',
));
mutantFails('predykat bez fotela (tylko primary)', (s) => s.replace(
  'return humanSeats.humanOwnerIds.some(oid => isAwaitingFirstPlayerCity(oid));',
  'return isAwaitingFirstPlayerCity(HUMAN_OWNER_PRIMARY);',
));
mutantFails('predykat odwrócony (blokada po stolicy)', (s) => s.replace(
  'return humanSeats.humanOwnerIds.some(oid => isAwaitingFirstPlayerCity(oid));',
  'return humanSeats.humanOwnerIds.some(oid => !isAwaitingFirstPlayerCity(oid));',
));
mutantFails('zły komunikat', (s) => s.replace(MSG, 'Zapis niedostepny'));
mutantFails('bramka po operacji zapisu w persistSaveToSlot', (s) => {
  const gate = "      if (isSaveBlockedByFirstCity()) {\n        notifySaveBlockedByFirstCity();\n        return { ok: false, reason: 'other' };\n      }\n";
  const write = '        const result = await saveToLocal(slotId, buildSaveGameSnapshot(label));\n';
  return s.replace(gate, '').replace(write, write + gate);
});
mutantFails('blokada także wczytywania (bramka w loadGameFromSlot)', (s) => s.replace(
  'async function loadGameFromSlot(slotId: string, fromInGamePause = false): Promise<void> {',
  'async function loadGameFromSlot(slotId: string, fromInGamePause = false): Promise<void> {\n      if (isSaveBlockedByFirstCity()) return;',
));

console.log('---');
console.log('save-block-pre-capital: PASS=' + pass + ' FAIL=' + fail);
process.exit(fail === 0 ? 0 : 1);
