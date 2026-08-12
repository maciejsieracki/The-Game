'use strict';
/**
 * city-orderstate-restore-clear-test.cjs -- backlog "cityOrderState nieczyszczone w
 * restoreGameFromSave" (odnotowane przez Evaluatora rundy 4 R-ZUZYCIE-SUROWCOW-OBYWATELE N1,
 * dyspozycje/PYTANIA-OTWARTE.md, sekcja "NOWY BACKLOG ... cityOrderState nieczyszczone w
 * restoreGameFromSave").
 *
 * Problem: panel miasta (cityPanel.ts, resolveOrderState) po wczytaniu zapisu gry mógł pokazać
 * OrderState (szczęście/porządek/szPct/bandLabel/...) Z POPRZEDNIEJ GRY tej samej sesji
 * przeglądarki, dopóki pętla Porządku nie przeliczy od nowa (1 tura) -- analogiczny bug do już
 * naprawionego dla citizenUpkeepByOwner (main.ts, restoreGameFromSave, komentarz
 * "R-ZUZYCIE-SUROWCOW-OBYWATELE N1 runda 5"). Naprawa: cityOrderState.clear() dodane w tym
 * samym miejscu co pozostałe 3 istniejące .clear() w restoreGameFromSave.
 * / EN: city panel (cityPanel.ts, resolveOrderState) after loading a save could show a stale
 * OrderState from a PREVIOUS game of the same browser session until the Order loop recomputes
 * (1 turn) -- same bug class as the already-fixed citizenUpkeepByOwner leak. Fix: added
 * cityOrderState.clear() at the same spot as the other 3 existing .clear() calls.
 *
 * main.ts NIE bundluje się samodzielnie przez esbuild (DOM/THREE/canvas w całym module) --
 * ustalona konwencja tego repo dla testów dotykających main.ts (patrz map-snapshot-load-test.cjs
 * nagłówek: "main.ts się nie bundluje"; citizen-resource-upkeep-test.cjs sekcje E/H/I): zamiast
 * wykonania, strukturalne asercje regex/indexOf na źródle main.ts jako tekst, z tekstowym oknem
 * zakotwiczonym na definicji funkcji, żeby nie złapać innego, niepowiązanego wystąpienia gdzie
 * indziej w pliku (main.ts ma DZIŚ 5 miejsc `cityOrderState.clear()` -- to jedno musi być
 * dokładnie wewnątrz restoreGameFromSave, nie gdziekolwiek w pliku).
 * / EN: main.ts cannot be esbuild-bundled standalone (DOM/THREE/canvas throughout) -- established
 * repo convention for main.ts tests: structural regex/indexOf assertions on source text instead
 * of execution, windowed to the specific function so an unrelated occurrence elsewhere in the
 * file cannot make the assertion pass by accident.
 *
 * Dowód mutacyjny: usunięcie linii "cityOrderState.clear();" z wnętrza restoreGameFromSave
 * powoduje FAIL asercji RC1 poniżej -- zweryfikowane ręcznie przy tworzeniu testu (tymczasowe
 * usunięcie linii -> `node tools/city-orderstate-restore-clear-test.cjs` -> czerwono -> linia
 * przywrócona -> zielono). RC4 dowodzi tego samego z drugiej strony: gdyby ktoś w przyszłości
 * WYCIĄŁ okno funkcji za wcześnie (błędna kotwica końcowa), test by się nie kompilował w sensowne
 * dowody -- RC4 pilnuje, że okno jest niepuste i ma sensowną długość.
 *
 * Usage (z gra/): node tools/city-orderstate-restore-clear-test.cjs
 */

const fs = require('fs');
const path = require('path');

const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const mainSrcRaw = fs.readFileSync(MAIN_TS, 'utf8');

/** Usuwa komentarze `// ...` (do końca linii) -- bez tego regex/indexOf "widzi" kod
 *  zakomentowany jako żywy i mutant (np. zakomentowanie cityOrderState.clear();) przeżywa
 *  bramkę bez czerwieni. Ta sama technika co citizen-resource-upkeep-test.cjs /
 *  cs-military-cap-wiring-test.cjs. / EN: same naive line-comment strip used elsewhere in this
 *  repo's main.ts structural tests -- safe here for the same documented reason. */
function stripLineComments(src) {
  return src
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('//');
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join('\n');
}
const mainSrcStripped = stripLineComments(mainSrcRaw);

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('  [OK]', msg); }
  else { failed++; console.error('  [FAIL]', msg); }
}

console.log('\n-- RC. restoreGameFromSave czyści cityOrderState (unika przecieknięcia werdyktu Porządku z poprzedniej gry) --');
{
  const FN_ANCHOR = 'function restoreGameFromSave(saved: SaveGame): void {';
  const fnIdx = mainSrcStripped.indexOf(FN_ANCHOR);
  assert(fnIdx > -1, 'main.ts: kotwica "function restoreGameFromSave(...)" znaleziona');

  // Kotwica końcowa okna -- wystarczająco daleko, żeby objąć cały blok czyszczenia map na
  // starcie funkcji (4 wywołania .clear()), ale wewnątrz tej samej funkcji (przed przebudową
  // cities[]), żeby nie złapać przypadkiem drugiego, niepowiązanego wystąpienia gdzie indziej
  // w main.ts (main.ts ma dziś 5 miejsc "cityOrderState.clear();" łącznie).
  const END_ANCHOR = 'cities.length = 0;';
  const endIdx = fnIdx > -1 ? mainSrcStripped.indexOf(END_ANCHOR, fnIdx) : -1;
  assert(endIdx > fnIdx, 'main.ts: kotwica "cities.length = 0;" znaleziona PO początku restoreGameFromSave -- okno funkcji dobrze uformowane');

  const fnWindow = (fnIdx > -1 && endIdx > fnIdx) ? mainSrcStripped.slice(fnIdx, endIdx) : '';

  // RC4: okno niepuste i ma sensowną minimalną długość (żeby kotwice-pułapki -- np. gdyby
  // END_ANCHOR trafił PRZED FN_ANCHOR gdzieś wcześniej w pliku i indexOf(..., fnIdx) i tak
  // zwrócił coś dodatniego przez przypadek -- nie dały fałszywego zielonego przy pustym/
  // zdegenerowanym oknie).
  assert(fnWindow.length > 200, 'RC4: okno treści restoreGameFromSave ma sensowną długość (>200 znaków) -- kotwice nie zdegenerowały się do pustego/prawie pustego wycinka');

  // RC1 (główna asercja, dowód mutacyjny): cityOrderState.clear() obecne w oknie funkcji.
  // Usunięcie tej jednej linii z main.ts powoduje FAIL tej asercji (zweryfikowane ręcznie:
  // patrz nagłówek pliku).
  assert(
    fnWindow.includes('cityOrderState.clear();'),
    'RC1: restoreGameFromSave czyści cityOrderState.clear() -- stary werdykt Porządku z '
      + 'poprzedniej gry tej samej sesji przeglądarki nie przecieka do panelu miasta po '
      + 'wczytaniu zapisu',
  );

  // RC2 (brak regresji istniejącej naprawy N1 rundy 5 przy okazji tej zmiany): pozostałe 3
  // .clear() które już były w tej funkcji przed tą naprawą nadal obecne.
  assert(fnWindow.includes('citizenUpkeepByOwner.clear();'), 'RC2a: citizenUpkeepByOwner.clear() nadal obecne w restoreGameFromSave (bez regresji istniejącej naprawy N1 rundy 5)');
  assert(fnWindow.includes('buildingResourceUpkeepByOwner.clear();'), 'RC2b: buildingResourceUpkeepByOwner.clear() nadal obecne w restoreGameFromSave');
  assert(fnWindow.includes('unitResourceUpkeepByOwner.clear();'), 'RC2c: unitResourceUpkeepByOwner.clear() nadal obecne w restoreGameFromSave');

  // RC3: cityOrderState.clear() leży PRZED citizenUpkeepByOwner.clear() w tekście -- ten sam
  // porządek co w pozostałych 4 miejscach w main.ts, gdzie ta czwórka .clear() zawsze
  // występuje razem w tej właśnie kolejności (cityOrderState, citizenUpkeepByOwner,
  // buildingResourceUpkeepByOwner, unitResourceUpkeepByOwner) -- dowodzi, że nowa linia jest
  // częścią TEGO SAMEGO bloku reset-na-starcie-funkcji, a nie przypadkowo dorzucona gdzieś
  // dalej w ciele restoreGameFromSave (gdzie formalnie nadal byłaby "w oknie", ale mogłaby
  // wykonać się PO tym, jak coś zdążyłoby już odczytać stary wpis).
  const clearIdx = fnWindow.indexOf('cityOrderState.clear();');
  const citizenIdx = fnWindow.indexOf('citizenUpkeepByOwner.clear();');
  assert(
    clearIdx > -1 && citizenIdx > -1 && clearIdx < citizenIdx,
    'RC3: cityOrderState.clear() leży PRZED citizenUpkeepByOwner.clear() -- ta sama kolejność '
      + 'bloku reset co w pozostałych 4 miejscach main.ts, nowa linia jest częścią tego samego '
      + 'bloku czyszczenia na starcie funkcji, nie dorzucona osobno dalej w ciele',
  );

  // RC5 (parytet liczby wystąpień w CAŁYM pliku, węższy zakres niż osobny temat parytetu
  // .clear() -- ten dowodzi wyłącznie: naprawa dodała DOKŁADNIE jedno nowe wystąpienie
  // "cityOrderState.clear();" globalnie w main.ts, licząc od 4 znanych przed tą naprawą
  // miejsc startu nowej gry). Usunięcie linii cofa liczbę do 4 -> FAIL. Zdublowanie linii
  // (np. wklejenie jej dwa razy przez pomyłkę) -> 6 -> też FAIL.
  const totalOccurrences = (mainSrcStripped.match(/cityOrderState\.clear\(\);/g) || []).length;
  assert(totalOccurrences === 5, `RC5: main.ts ma dokładnie 5 wystąpień "cityOrderState.clear();" w całym pliku (4 istniejące miejsca startu nowej gry + 1 nowe w restoreGameFromSave) (got ${totalOccurrences})`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
