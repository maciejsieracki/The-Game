'use strict';
/**
 * load-fail-toast-zindex-test.cjs — N-ZINDEX-TOAST (Maciej, 2026-08-11), naprawa Evaluatora
 * FAIL na temacie P-WCZYTYWANIE-REGENERUJE-MAPE-OD-ZERA / N1 (commit b7f06f08).
 *
 * Kontekst defektu: N1 dodał showHintMessage(...) w gałęzi `if (!ok)` funkcji
 * loadGameFromSlot (regenerateWorldForLoad zawiodło), ale toast (#hintToast, domyślnie
 * z-index 320) był w praktyce NIEWIDOCZNY -- .civ-menu (mainMenu.ts, z-index 500),
 * montowane zaraz potem przez openStartupMainMenu(), całkowicie go zamalowuje w root
 * stacking context (domyślny zoom UI, `body` bez własnego stacking context).
 *
 * Naprawa (dwie części, obie sprawdzane strukturalnie -- main.ts jest jedną wielką
 * funkcją, nie da się jej zbundlować/uruchomić bez ciężkich stubów całej gry, wzorem
 * innych bramek strukturalnych w tym katalogu np. elimination-toast-merge-test.cjs):
 *
 *  (a) showHintMessage() podnosi z-index toastu na '600' gdy isMainMenuOpen() === true
 *      (analogicznie do istniejącego wzorca isPreBattleOpen() ? '9950' : ...). 600 bije
 *      .civ-menu (500), .civ-pause (480) i .cm-toast (560) -- zweryfikowane grepem po
 *      wszystkich z-index w src/ (patrz też sekcja 3 niżej).
 *  (b) W gałęzi `if (!ok)` KOLEJNOŚĆ wywołań jest zamieniona: `openStartupMainMenu()`
 *      MUSI wykonać się PRZED `showHintMessage(...)` -- inaczej isMainMenuOpen() w chwili
 *      budowy toastu zwróci jeszcze `false` (menu nie zamontowane) i formuła z (a) nie
 *      zadziała mimo że menu i tak zaraz się pojawi.
 *
 * Usage (z gra/): node tools/load-fail-toast-zindex-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const MAIN_TS = path.resolve(GRA, 'src', 'main.ts');
const MAIN_MENU_TS = path.resolve(GRA, 'src', 'ui', 'mainMenu.ts');
const GAME_PAUSE_MENU_TS = path.resolve(GRA, 'src', 'ui', 'gamePauseMenu.ts');

const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
const mainMenuSrc = fs.readFileSync(MAIN_MENU_TS, 'utf8');
const gamePauseMenuSrc = fs.readFileSync(GAME_PAUSE_MENU_TS, 'utf8');

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) {
    pass++;
    console.log('  OK: ' + label);
  } else {
    fail++;
    console.log('  FAIL: ' + label);
  }
}

/** Usuwa komentarze `// ...` (do końca linii) -- komentarze PL+EN w main.ts cytują
 *  słownie nazwy wywołań (np. "showHintMessage()", "openStartupMainMenu()") w prozie,
 *  co fałszywie zaliczyłoby się jako obecność/kolejność realnego kodu. */
function stripLineComments(src) {
  return src
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('//');
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// 1. showHintMessage() -- import isMainMenuOpen + formuła z-index go czyta.
// ---------------------------------------------------------------------------
{
  ok(
    /import\s*\{[^}]*\bisMainMenuOpen\b[^}]*\}\s*from\s*'\.\/ui\/mainMenu';/.test(mainSrc),
    'main.ts importuje isMainMenuOpen z ./ui/mainMenu',
  );

  const fnStartMarker = 'function showHintMessage(msg: string, durationMs: number = 3000): void {';
  const fnStart = mainSrc.indexOf(fnStartMarker);
  ok(fnStart >= 0, 'znaleziono function showHintMessage(...)');

  const fnEndMarker = 'hintOverrideTimer = setTimeout(() => {';
  const fnEnd = fnStart >= 0 ? mainSrc.indexOf(fnEndMarker, fnStart) : -1;
  ok(fnEnd > fnStart, 'znaleziono koniec ciała showHintMessage (hintOverrideTimer = setTimeout)');

  const fnBody = fnStart >= 0 && fnEnd > fnStart ? mainSrc.slice(fnStart, fnEnd) : '';
  const fnBodyCode = stripLineComments(fnBody);

  ok(
    /hintToast\.style\.zIndex\s*=\s*isPreBattleOpen\(\)\s*\?\s*'9950'\s*:\s*\(isMainMenuOpen\(\)\s*\?\s*'600'\s*:\s*'320'\)\s*;/
      .test(fnBodyCode),
    "formuła z-index toastu to isPreBattleOpen() ? '9950' : (isMainMenuOpen() ? '600' : '320') "
    + '-- isPreBattleOpen ma pierwszeństwo (bitwa polowa nad menu), isMainMenuOpen podnosi '
    + 'toast nad .civ-menu, domyślne 320 zostaje gdy nic z tego nie jest otwarte',
  );
}

// ---------------------------------------------------------------------------
// 2. Gałąź `if (!ok)` w loadGameFromSlot (regenerateWorldForLoad failed):
//    openStartupMainMenu() PRZED showHintMessage(...) -- pozytywna asercja
//    KOLEJNOŚCI (indexOf), nie tylko obecności obu stringów osobno.
// ---------------------------------------------------------------------------
{
  const branchStartMarker = 'if (!ok) {';
  const branchStart = mainSrc.indexOf(branchStartMarker);
  ok(branchStart >= 0, "znaleziono gałąź `if (!ok) {` w loadGameFromSlot (unikalna w main.ts)");

  // main.ts ma tylko jedno wystąpienie "if (!ok) {" -- jeśli kiedyś przybędzie drugie,
  // ta bramka ma o tym głośno powiedzieć zamiast po cichu sprawdzać złą gałąź.
  const secondOccurrence = branchStart >= 0
    ? mainSrc.indexOf(branchStartMarker, branchStart + branchStartMarker.length)
    : -1;
  ok(secondOccurrence === -1, "`if (!ok) {` występuje w main.ts DOKŁADNIE raz (marker zostaje jednoznaczny)");

  const branchEndMarker = 'return;';
  const branchEnd = branchStart >= 0 ? mainSrc.indexOf(branchEndMarker, branchStart) : -1;
  ok(branchEnd > branchStart, 'znaleziono koniec gałęzi (najbliższy `return;` po `if (!ok) {`)');

  const branchRaw = branchStart >= 0 && branchEnd > branchStart
    ? mainSrc.slice(branchStart, branchEnd + branchEndMarker.length) : '';
  const branchCode = stripLineComments(branchRaw);

  const openMenuIdx = branchCode.indexOf('if (!fromInGamePause) openStartupMainMenu();');
  ok(openMenuIdx >= 0, 'gałąź zawiera `if (!fromInGamePause) openStartupMainMenu();`');

  const showHintIdx = branchCode.indexOf('showHintMessage(');
  ok(showHintIdx >= 0, 'gałąź zawiera wywołanie showHintMessage(...)');

  ok(
    openMenuIdx >= 0 && showHintIdx >= 0 && openMenuIdx < showHintIdx,
    'KOLEJNOŚĆ: `if (!fromInGamePause) openStartupMainMenu();` leży PRZED `showHintMessage(...)` '
    + 'w kodzie źródłowym (indexOf ' + openMenuIdx + ' < ' + showHintIdx + ') -- isMainMenuOpen() '
    + 'musi widzieć menu JUŻ zamontowane w chwili budowy toastu, inaczej formuła z-index '
    + 'z sekcji 1 nie ma efektu (menu domontuje się dopiero PO toastcie)',
  );

  ok(
    branchCode.includes("diagError('load', 'regenerateWorldForLoad failed');"),
    'diagError(...) nadal jest wołane w gałęzi (mechanizm diagnostyczny F10 nie zniknął)',
  );

  const diagErrorIdx = branchCode.indexOf("diagError('load', 'regenerateWorldForLoad failed');");
  ok(
    diagErrorIdx >= 0 && diagErrorIdx < openMenuIdx,
    'diagError(...) zostaje PRZED openStartupMainMenu()/showHintMessage() (pozycja niezmieniona '
    + 'przez tę naprawę -- tylko kolejność menu/toast się odwróciła)',
  );
}

// ---------------------------------------------------------------------------
// 3. Wartości z-index overlay'ów, które toast musi bić przy otwartym menu
//    startowym: .civ-menu, .civ-pause, .cm-toast. Pilnuje, żeby '600' nie
//    przestało być bezpieczne po przyszłej edycji CSS tych komponentów.
// ---------------------------------------------------------------------------
{
  ok(/\.civ-menu\{[^}]*z-index:500;/.test(mainMenuSrc), '.civ-menu ma z-index:500 (mainMenu.ts)');
  ok(
    /\.civ-menu \.cm-toast\{[^}]*z-index:560;/.test(mainMenuSrc),
    '.civ-menu .cm-toast ma z-index:560 (mainMenu.ts) -- 600 > 560',
  );
  ok(
    /\.civ-pause\{[^}]*z-index:480;/.test(gamePauseMenuSrc),
    '.civ-pause (menu pauzy w grze) ma z-index:480 (gamePauseMenu.ts) -- 600 > 480',
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
