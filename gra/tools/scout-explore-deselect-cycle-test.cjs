'use strict';
/**
 * scout-explore-deselect-cycle-test.cjs — R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q2 (Q2=A 2026-08-10,
 * przepisany po Evaluatorze runda PASS-WITH-NOTES tego samego dnia, noty N1/N2).
 *
 * Po włączeniu Zwiedzaj (handler 'scout-explore', gałąź `enabling`) jednostka MA SIĘ ODZNACZYĆ:
 * przejść do kolejnej jednostki gracza z dostępnym ruchem (jak Spacja), a jeśli takiej nie ma —
 * pełne odznaczenie (brak wybranej jednostki). Gdy panel blokujący (np. oblężenia) jest otwarty
 * w chwili włączania Zwiedzaj — jawne odznaczenie zamiast polegania na wewnętrznej bramce
 * `cycleToAdjacentPlayerUnit` (N2).
 *
 * N1 (Evaluator): stara wersja tego pliku sprawdzała WYŁĄCZNIE regexy nad tekstem main.ts —
 * ślepa na mutacje logiki (np. usunięcie `selectPlayerUnit(next.id)` wewnątrz funkcji cyklującej,
 * albo `if (true) return;` na jej wejściu robiące cykl no-opem). Naprawa: rdzeń logiki cyklowania
 * (`isUnitActiveForCycle`, `cyclablePlayerArmyLeadsBase`, `resolveAdjacentPlayerUnitCycle`) został
 * wyniesiony do CZYSTEGO modułu `src/game/army-cycle.ts` (main.ts to dziś cienka warstwa efektów
 * ubocznych nad nim) — SEKCJA 1 niżej testuje ten moduł BEHAWIORALNIE: buduje sztuczne
 * `RuntimeUnit`-y, wywołuje funkcje, sprawdza WYNIK. SEKCJA 2 zostaje jako wąska bramka
 * strukturalna WYŁĄCZNIE nad tym, co w main.ts musi zostać side-effectem (wywołanie
 * `selectPlayerUnit`/`clearPlayerUnitSelection`/`focusCameraOnUnit` na podstawie wyniku modułu) —
 * te linie są dziś krótkie i stabilne, więc regex nad nimi jest dużo mniej kruchy niż poprzednio
 * (400-linijkowa funkcja z wieloma gałęziami).
 *
 * Usage (z gra/): node tools/scout-explore-deselect-cycle-test.cjs
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA_DIR = path.join(__dirname, '..');
const MAIN_TS = path.join(GRA_DIR, 'src', 'main.ts');
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

let passCount = 0;
let failCount = 0;
function check(label, cond, detail) {
  if (cond) {
    passCount++;
    console.log('  PASS: ' + label);
  } else {
    failCount++;
    console.log('  FAIL: ' + label + (detail ? ' -- ' + detail : ''));
  }
}

console.log('========================================================================');
console.log('R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q2 -- army-cycle.ts behawioralnie + main.ts strukturalnie');
console.log('========================================================================\n');

// ===========================================================================
// SEKCJA 1 — testy BEHAWIORALNE nad src/game/army-cycle.ts (bundlowane esbuild,
// wywoływane na sztucznych RuntimeUnit-ach, asercje na WYNIKU).
// ===========================================================================
console.log('1. src/game/army-cycle.ts -- testy behawioralne (esbuild bundle + wywolanie)');

const ENTRY = path.join(__dirname, '.army-cycle-entry.ts');
const BUNDLE = path.join(__dirname, '.army-cycle-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import {
  isUnitActiveForCycle,
  cyclablePlayerArmyLeadsBase,
  resolveAdjacentPlayerUnitCycle,
} from '../src/game/army-cycle';
export { isUnitActiveForCycle, cyclablePlayerArmyLeadsBase, resolveAdjacentPlayerUnitCycle };`,
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const {
  isUnitActiveForCycle,
  cyclablePlayerArmyLeadsBase,
  resolveAdjacentPlayerUnitCycle,
} = require(BUNDLE);

function u(over) {
  return Object.assign({
    id: 'u', ownerId: 0, typeId: 'Zwiadowca', category: 'zwiadowca',
    q: 0, r: 0, ruch: 2, ruchLeft: 2,
  }, over);
}

// --- 1a. isUnitActiveForCycle: każdy z 4 warunków wykluczających z osobna. ---
check(
  '1a. isUnitActiveForCycle: jednostka bez flag jest aktywna',
  isUnitActiveForCycle(u({ id: 'plain' })) === true,
);
check(
  '1a. isUnitActiveForCycle: autoExplore=true WYKLUCZA (sedno Q2 -- jednostka WLASNIE '
    + 'wlaczajaca Zwiedzaj znika z listy cyklowania)',
  isUnitActiveForCycle(u({ id: 'scout', autoExplore: true })) === false,
);
check(
  '1a. isUnitActiveForCycle: sentry=true WYKLUCZA',
  isUnitActiveForCycle(u({ id: 'sentry', sentry: true })) === false,
);
check(
  '1a. isUnitActiveForCycle: inGarnizon=true WYKLUCZA',
  isUnitActiveForCycle(u({ id: 'garnizon', inGarnizon: true })) === false,
);
check(
  '1a. isUnitActiveForCycle: ufortyfikowanyWPolu=true WYKLUCZA',
  isUnitActiveForCycle(u({ id: 'fort', ufortyfikowanyWPolu: true })) === false,
);

// --- 1b. cyclablePlayerArmyLeadsBase: filtr ownerId, requireMoves, kolejnosc przestrzenna. ---
{
  const units = [
    u({ id: 'p1', ownerId: 0, q: 2, r: 0 }),
    u({ id: 'p2', ownerId: 0, q: 0, r: 0 }),
    u({ id: 'p3', ownerId: 0, q: 1, r: 0 }),
    u({ id: 'enemy', ownerId: 1, q: -1, r: 0 }),
    u({ id: 'exploring', ownerId: 0, q: 5, r: 0, autoExplore: true }),
  ];
  const alwaysCanMove = () => true;
  const list = cyclablePlayerArmyLeadsBase(units, false, alwaysCanMove);
  check(
    '1b. cyclablePlayerArmyLeadsBase: wyklucza jednostki innego wlasciciela',
    !list.some(x => x.id === 'enemy'),
  );
  check(
    '1b. cyclablePlayerArmyLeadsBase: wyklucza jednostke z autoExplore=true (post-enable Zwiedzaj)',
    !list.some(x => x.id === 'exploring'),
  );
  check(
    '1b. cyclablePlayerArmyLeadsBase: kolejnosc przestrzenna rosnaco po q+r (p2,p3,p1)',
    list.map(x => x.id).join(',') === 'p2,p3,p1',
    'dostano: ' + list.map(x => x.id).join(','),
  );

  const noMoveLeft = () => false;
  const listNoMoves = cyclablePlayerArmyLeadsBase(units, true, noMoveLeft);
  check(
    '1b. cyclablePlayerArmyLeadsBase: requireMoves=true + canMove zawsze false -> pusta lista',
    listNoMoves.length === 0,
  );
  const listWithMoves = cyclablePlayerArmyLeadsBase(units, true, x => x.id === 'p2');
  check(
    '1b. cyclablePlayerArmyLeadsBase: requireMoves=true respektuje wstrzykniete canMove(u) per-jednostke',
    listWithMoves.length === 1 && listWithMoves[0].id === 'p2',
    'dostano: ' + listWithMoves.map(x => x.id).join(','),
  );
}

// --- 1c. resolveAdjacentPlayerUnitCycle: przypadek pusty, wraparound, fallback po hexie. ---
{
  const empty = resolveAdjacentPlayerUnitCycle([], [], 'anything', 1);
  check(
    '1c. resolveAdjacentPlayerUnitCycle: lista pusta -> null (pelne odznaczenie -- '
      + 'to gałąź main.ts musi zinterpretowac jako clearPlayerUnitSelection())',
    empty === null,
  );

  const list = [u({ id: 'a', q: 0, r: 0 }), u({ id: 'b', q: 1, r: 0 }), u({ id: 'c', q: 2, r: 0 })];
  check(
    '1c. resolveAdjacentPlayerUnitCycle: afterId=null, delta=1 -> pierwszy element listy',
    resolveAdjacentPlayerUnitCycle(list, list, null, 1) === 'a',
  );
  check(
    '1c. resolveAdjacentPlayerUnitCycle: afterId=null, delta=-1 -> ostatni element listy',
    resolveAdjacentPlayerUnitCycle(list, list, null, -1) === 'c',
  );
  check(
    '1c. resolveAdjacentPlayerUnitCycle: afterId="a", delta=1 -> nastepny "b" (postep, NIE no-op -- '
      + 'lapie mutacje typu if(true)return afterId)',
    resolveAdjacentPlayerUnitCycle(list, list, 'a', 1) === 'b',
  );
  check(
    '1c. resolveAdjacentPlayerUnitCycle: afterId="c" (ostatni), delta=1 -> wraparound na "a"',
    resolveAdjacentPlayerUnitCycle(list, list, 'c', 1) === 'a',
  );
  check(
    '1c. resolveAdjacentPlayerUnitCycle: afterId="a" (pierwszy), delta=-1 -> wraparound na "c"',
    resolveAdjacentPlayerUnitCycle(list, list, 'a', -1) === 'c',
  );

  // Scenariusz Q2 doslownie: jednostka WLASNIE wlaczajaca Zwiedzaj (afterId=jej id) NIE
  // wystepuje juz w `list` (autoExplore=true ja wyklucza), ale nadal jest w pelnej tablicy
  // `units` na tym samym heksie co przed chwila -- fallback po stackRenderKey(hex) musi
  // wybrac sasiada z listy, NIE zwrocic afterId ani spanikowac.
  const scout = u({ id: 'scout', q: 1, r: 0, autoExplore: true });
  const allUnits = [u({ id: 'a', q: 0, r: 0 }), u({ id: 'c', q: 2, r: 0 }), scout];
  const listAfterEnable = cyclablePlayerArmyLeadsBase(allUnits, true, () => true); // ['a','c']
  const nextAfterScoutEnable = resolveAdjacentPlayerUnitCycle(allUnits, listAfterEnable, 'scout', 1);
  check(
    '1c. Scenariusz Q2: po wlaczeniu Zwiedzaj (jednostka wykluczona z list, ale nadal w units) '
      + 'cykl wybiera nastepna jednostke z listy, NIE zwraca "scout" ani null',
    nextAfterScoutEnable === 'a' || nextAfterScoutEnable === 'c',
    'dostano: ' + nextAfterScoutEnable,
  );

  // Scenariusz Q2 -- brak innych jednostek: jedyna jednostka gracza wlacza Zwiedzaj -> lista
  // pusta -> resolveAdjacentPlayerUnitCycle zwraca null -> main.ts ma to zinterpretowac jako
  // PELNE odznaczenie (clearPlayerUnitSelection), nie zostawic starego zaznaczenia.
  const onlyScout = u({ id: 'lone', q: 0, r: 0, autoExplore: true });
  const soleUnits = [onlyScout];
  const emptyList = cyclablePlayerArmyLeadsBase(soleUnits, true, () => true);
  check(
    '1c. Scenariusz Q2 (brak kandydatow): jedyna jednostka wlacza Zwiedzaj -> lista pusta',
    emptyList.length === 0,
  );
  check(
    '1c. Scenariusz Q2 (brak kandydatow): resolveAdjacentPlayerUnitCycle na pustej liscie -> null',
    resolveAdjacentPlayerUnitCycle(soleUnits, emptyList, 'lone', 1) === null,
  );
}

console.log('');

// ===========================================================================
// SEKCJA 2 — bramka strukturalna WĄSKA: main.ts musi rzeczywiście UŻYWAĆ modułu
// (nie duplikować logiki lokalnie) i musi poprawnie okablować efekty uboczne wokół
// jego wyniku. Te linie są dziś krótkie i proste (rdzeń logiki jest w module wyżej),
// więc regex nad nimi jest znacznie mniej kruchy niż nad starą, złożoną funkcją.
// ===========================================================================
console.log('2. main.ts -- bramka strukturalna waska (uzycie modulu + okablowanie efektow ubocznych)');

check(
  "main.ts importuje cyclablePlayerArmyLeadsBase i resolveAdjacentPlayerUnitCycle z "
    + "'./game/army-cycle' (chroni przed cichym przywroceniem lokalnego duplikatu logiki, ktory "
    + "omijalby modul przetestowany w Sekcji 1)",
  /import \{\s*cyclablePlayerArmyLeadsBase,\s*resolveAdjacentPlayerUnitCycle\s*\} from '\.\/game\/army-cycle';/.test(mainSrc),
);

const cycleFnMatch = mainSrc.match(
  /function cycleToAdjacentPlayerUnit\(([\s\S]*?)\): void \{([\s\S]*?)\n {4}\}/,
);
check(
  'main.ts: funkcja cycleToAdjacentPlayerUnit znaleziona',
  cycleFnMatch !== null,
);
const cycleFnBody = cycleFnMatch ? cycleFnMatch[2] : '';
check(
  'main.ts: cycleToAdjacentPlayerUnit faktycznie WOLA resolveAdjacentPlayerUnitCycle(units, list, '
    + 'afterId, delta) -- nie liczy indeksu lokalnie (M4/M5 z duplikatu logiki lapane w Sekcji 1, '
    + 'ALE tylko jesli ten import jest realnie uzyty tutaj, nie tylko martwym importem)',
  /const nextId = resolveAdjacentPlayerUnitCycle\(units, list, afterId, delta\);/.test(cycleFnBody),
);
check(
  'main.ts: cycleToAdjacentPlayerUnit -- nextId === null woła clearPlayerUnitSelection() (pelne '
    + 'odznaczenie, brak kandydatow -- M-ekwiwalent starego testu "list.length===0")',
  /if \(nextId === null\) \{\s*\n\s*clearPlayerUnitSelection\(\);\s*\n\s*return;\s*\n\s*\}/.test(cycleFnBody),
);
check(
  'main.ts: cycleToAdjacentPlayerUnit -- nextId niepusty woła selectPlayerUnit(next.id) i '
    + 'focusCameraOnUnit(next) (M4-ekwiwalent: usuniecie tego wywolania złamałoby realne zaznaczenie '
    + 'mimo poprawnego wyniku z modulu -- regex to lapie, bo linia jest dzis krotka i stabilna)',
  /selectPlayerUnit\(next\.id\);\s*\n\s*focusCameraOnUnit\(next\);/.test(cycleFnBody),
);

console.log('');

// ===========================================================================
// SEKCJA 3 — handler 'scout-explore', gałąź `enabling`: kolejność + N2 gating.
// ===========================================================================
console.log("3. Handler 'scout-explore' galaz enabling -- kolejnosc + N2 (gating w miejscu wywolania)");

// Ekstrakcja przez DOPASOWANIE NAWIASÓW KLAMROWYCH, nie regex ze zjadliwym `[\s\S]*?` --
// od N2 blok `enabling` ZAWIERA WŁASNY zagnieżdżony `if (...) { ... } else { ... }`
// (isWorldMapUnitMode), więc nie-zachłanny regex szukający pierwszego "} else {" łapał
// WEWNĘTRZNY else zamiast zewnętrznego -- realny incydent podczas pisania tego pliku
// (Sekcja 4 fałszywie czerwieniła się, widząc ogon bloku enabling w elseBody).
function findMatchingBrace(src, openBraceIdx) {
  let depth = 1;
  let i = openBraceIdx + 1;
  while (depth > 0) {
    if (i >= src.length) throw new Error('findMatchingBrace: brak zamykajacego nawiasu');
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  return i - 1;
}

const handlerMarker = "actionId === 'scout-explore') {";
const handlerMarkerIdx = mainSrc.indexOf(handlerMarker);
let enablingBody = '';
let elseBody = '';
let enablingBlockFound = false;
if (handlerMarkerIdx >= 0) {
  const handlerOpenIdx = handlerMarkerIdx + handlerMarker.length - 1; // index of the '{'
  const handlerCloseIdx = findMatchingBrace(mainSrc, handlerOpenIdx);
  const handlerBody = mainSrc.slice(handlerOpenIdx + 1, handlerCloseIdx);

  const enablingMarker = 'if (enabling) {';
  const enablingMarkerIdx = handlerBody.indexOf(enablingMarker);
  if (enablingMarkerIdx >= 0) {
    const enablingOpenIdx = enablingMarkerIdx + enablingMarker.length - 1;
    const enablingCloseIdx = findMatchingBrace(handlerBody, enablingOpenIdx);
    enablingBody = handlerBody.slice(enablingOpenIdx + 1, enablingCloseIdx);

    const afterEnabling = handlerBody.slice(enablingCloseIdx + 1);
    const elseMarker = 'else {';
    const elseMarkerIdx = afterEnabling.indexOf(elseMarker);
    if (elseMarkerIdx >= 0 && afterEnabling.slice(0, elseMarkerIdx).trim() === '') {
      const elseOpenIdx = elseMarkerIdx + elseMarker.length - 1;
      const elseCloseIdx = findMatchingBrace(afterEnabling, elseOpenIdx);
      elseBody = afterEnabling.slice(elseOpenIdx + 1, elseCloseIdx);
      enablingBlockFound = true;
    }
  }
}
check(
  "blok if (enabling) { ... } else { ... } handlera scout-explore znaleziony w main.ts "
    + "(ekstrakcja przez dopasowanie nawiasow, odporna na zagniezdzony if/else z N2)",
  enablingBlockFound,
);

check(
  "galaz enabling: u.autoExplore = true; wystepuje PRZED blokiem if (isWorldMapUnitMode())",
  /u\.autoExplore = true;[\s\S]*?if \(isWorldMapUnitMode\(\)\) \{/.test(enablingBody),
);

check(
  "galaz enabling: showHintMessage(...) (toast) wystepuje PRZED blokiem if (isWorldMapUnitMode()) "
    + "-- feedback wizualny Q2 NIE zastepuje toastu, tylko zlota ramke zaznaczenia",
  /showHintMessage\(u\.typeId \+ ' zwiedza map[\s\S]*?', 2800\);[\s\S]*?if \(isWorldMapUnitMode\(\)\) \{/.test(enablingBody),
);

check(
  "N2: galaz enabling bramkuje W MIEJSCU WYWOLANIA -- isWorldMapUnitMode() true -> "
    + "cycleToAdjacentPlayerUnit(u.id, 1); false -> clearPlayerUnitSelection() (symetrycznie do "
    + "Spacji/bebna, zamiast polegac WYLACZNIE na wewnetrznej bramce cycleToAdjacentPlayerUnit, "
    + "ktora przy panelu oblezenia otwartym robi cykl no-opem i zostawia stara jednostke "
    + "zaznaczona z aktywnym podswietleniem ruchu -- zgloszony bug Macieja)",
  /if \(isWorldMapUnitMode\(\)\) \{\s*\n\s*cycleToAdjacentPlayerUnit\(u\.id, 1\);\s*\n\s*\} else \{\s*\n\s*clearPlayerUnitSelection\(\);\s*\n\s*\}/.test(enablingBody),
);

// Liczymy wyłącznie w liniach KODU (bez `//` komentarzy) — komentarze PL+EN nad tym blokiem
// (wymóg CLAUDE.md §9) legalnie wspominają obie nazwy funkcji więcej niż raz w prozie, co nie
// jest sygnałem regresji. / EN: count CODE lines only (strip `//` comments) — the PL+EN
// comments above this block (CLAUDE.md §9 requirement) legitimately mention both function
// names more than once in prose, which is not a regression signal.
const enablingCodeOnly = enablingBody
  .split('\n')
  .filter(line => !/^\s*\/\//.test(line))
  .join('\n');
check(
  "galaz enabling: dokladnie JEDNO wywolanie cycleToAdjacentPlayerUnit i dokladnie JEDNO "
    + "wywolanie clearPlayerUnitSelection W KODZIE (bez komentarzy) w tym bloku (N2 dodaje drugi "
    + "call site, ale oba wystepuja raz, w rozlacznych galeziach if/else)",
  (enablingCodeOnly.match(/cycleToAdjacentPlayerUnit\(/g) || []).length === 1
    && (enablingCodeOnly.match(/clearPlayerUnitSelection\(/g) || []).length === 1,
  'cycleToAdjacentPlayerUnit x' + ((enablingCodeOnly.match(/cycleToAdjacentPlayerUnit\(/g) || []).length)
    + ', clearPlayerUnitSelection x' + ((enablingCodeOnly.match(/clearPlayerUnitSelection\(/g) || []).length),
);

check(
  "galaz enabling: clearPlannedMarch(u.id) na poczatku bloku zostaje nietkniete (C-025 zakres)",
  /clearPlannedMarch\(u\.id\);/.test(enablingBody),
);

console.log('');

console.log('4. Galaz WYL (else) -- bez zadnej zmiany zachowania cyklowania (C-025 zakres)');

check(
  "galaz else NIE zawiera cycleToAdjacentPlayerUnit ani clearPlayerUnitSelection "
    + "-- wylaczenie Zwiedzaj nie odznacza jednostki (poza zakresem tego zlecenia)",
  !/cycleToAdjacentPlayerUnit|clearPlayerUnitSelection/.test(elseBody),
);

check(
  "galaz else: u.autoExplore = false; + showHintMessage('Wylaczono zwiedzanie'...) nietkniete",
  /u\.autoExplore = false;[\s\S]*?showHintMessage\('Wy/.test(elseBody),
);

console.log('');

console.log('========================================================================');
console.log('WYNIK: ' + passCount + ' PASS, ' + failCount + ' FAIL');
console.log('========================================================================');

try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch { /* ignore */ }

if (failCount > 0) process.exit(1);
