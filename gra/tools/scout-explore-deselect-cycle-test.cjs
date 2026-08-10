'use strict';
/**
 * scout-explore-deselect-cycle-test.cjs — R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q2=A (2026-08-10).
 *
 * Po włączeniu Zwiedzaj (handler 'scout-explore', gałąź `enabling`) jednostka MA SIĘ ODZNACZYĆ:
 * przejść do kolejnej jednostki gracza z dostępnym ruchem (jak Spacja), a jeśli takiej nie ma —
 * pełne odznaczenie (brak wybranej jednostki). To CELOWO cofa Q1 (2026-08-04), które trzymało
 * zaznaczenie dla natychmiastowego feedbacku (złota ramka) — dziś ten feedback daje toast
 * (showHintMessage), którego w sierpniu brakowało.
 *
 * `cycleToAdjacentPlayerUnit`/`clearPlayerUnitSelection` żyją w domknięciu boot() (main.ts) —
 * nietestowalne standardowym importem. Wzorzec jak forced-war-bronze-main-guard-test.cjs:
 * asercje źródłowe (regex) na main.ts, żeby ciche cofnięcie/usunięcie wywołania było łapane
 * przez bramkę, nie tylko przez przegląd ręczny.
 *
 * Usage (z gra/): node tools/scout-explore-deselect-cycle-test.cjs
 */

const fs = require('fs');
const path = require('path');

const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
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
console.log('R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q2 -- bramka tekstowa main.ts');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// 1. Handler 'scout-explore', gałąź `enabling`: kolejność wywołań.
// ---------------------------------------------------------------------------
console.log("1. Handler 'scout-explore' galaz enabling -- kolejnosc autoExplore -> hint -> cycle");

const enablingBlockMatch = mainSrc.match(
  /actionId === 'scout-explore'\) \{\s*\n\s*if \(!isScoutUnit\(u\)\) return;\s*\n\s*const enabling = u\.autoExplore !== true;\s*\n\s*if \(enabling\) \{([\s\S]*?)\} else \{([\s\S]*?)\}\s*\n\s*\}/,
);
check(
  "blok if (enabling) { ... } else { ... } handlera scout-explore znaleziony w main.ts",
  enablingBlockMatch !== null,
);
const enablingBody = enablingBlockMatch ? enablingBlockMatch[1] : '';
const elseBody = enablingBlockMatch ? enablingBlockMatch[2] : '';

check(
  "galaz enabling: u.autoExplore = true; wystepuje PRZED cycleToAdjacentPlayerUnit(u.id, 1);",
  /u\.autoExplore = true;[\s\S]*?cycleToAdjacentPlayerUnit\(u\.id, 1\);/.test(enablingBody),
);

check(
  "galaz enabling: showHintMessage(...) (toast) wystepuje PRZED cycleToAdjacentPlayerUnit(u.id, 1) "
    + "-- feedback wizualny Q2 NIE zastepuje toastu, tylko zlota ramke zaznaczenia",
  /showHintMessage\(u\.typeId \+ ' zwiedza map[\s\S]*?', 2800\);[\s\S]*?cycleToAdjacentPlayerUnit\(u\.id, 1\);/.test(enablingBody),
);

check(
  "galaz enabling: dokladnie JEDNO wywolanie cycleToAdjacentPlayerUnit w tym bloku "
    + "(minimalna kombinacja -- clearPlayerUnitSelection() NIE jest wolane osobno, bo "
    + "u.autoExplore=true juz wyklucza te jednostke z listy cyklowania -- patrz sekcja 2)",
  (enablingBody.match(/cycleToAdjacentPlayerUnit\(/g) || []).length === 1,
  'liczba wystapien: ' + ((enablingBody.match(/cycleToAdjacentPlayerUnit\(/g) || []).length),
);

check(
  "galaz enabling: clearPlannedMarch(u.id) na poczatku bloku zostaje nietkniete (C-025 zakres)",
  /clearPlannedMarch\(u\.id\);/.test(enablingBody),
);

console.log('');

// ---------------------------------------------------------------------------
// 2. Gałąź WYŁ (else) -- BEZ ZMIAN, C-025 zakres = tylko enabling.
// ---------------------------------------------------------------------------
console.log('2. Galaz WYL (else) -- bez zadnej zmiany zachowania cyklowania (C-025 zakres)');

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

// ---------------------------------------------------------------------------
// 3. Dowod poprawnosci minimalnej kombinacji: isUnitActiveForCycle wyklucza autoExplore===true,
//    a cycleToAdjacentPlayerUnit przy pustej liscie SAM wola clearPlayerUnitSelection() -- to
//    dwa fakty, ktore razem czynia osobne wywolanie clearPlayerUnitSelection() przed cyklem
//    zbedne (jednostka i tak nie moze trafic z powrotem na siebie, a pelne odznaczenie przy
//    braku kandydatow jest juz obsluzone WEWNATRZ funkcji cyklujacej).
// ---------------------------------------------------------------------------
console.log('3. Dowod: isUnitActiveForCycle + cycleToAdjacentPlayerUnit pokrywaja oba wymagane przypadki');

check(
  "isUnitActiveForCycle(u) odrzuca jednostki z autoExplore === true "
    + "-- jednostka WLASNIE wlaczajaca Zwiedzaj nie moze trafic z powrotem na liste cyklowania",
  /function isUnitActiveForCycle\(u: RuntimeUnit\): boolean \{\s*\n\s*return u\.sentry !== true\s*\n\s*&& u\.autoExplore !== true/.test(mainSrc),
);

check(
  "cycleToAdjacentPlayerUnit: gdy list.length === 0, SAMO wola clearPlayerUnitSelection() "
    + "i wraca -- pokrywa przypadek 'brak innej jednostki z ruchem = pelne odznaczenie' bez "
    + "potrzeby osobnego wywolania w handlerze scout-explore",
  /function cycleToAdjacentPlayerUnit\([\s\S]{0,400}?if \(list\.length === 0\) \{\s*\n\s*clearPlayerUnitSelection\(\);\s*\n\s*return;\s*\n\s*\}/.test(mainSrc),
);

check(
  "cycleToAdjacentPlayerUnit: domyslna lista to cyclablePlayerArmyLeads() (TYLKO z dostepnym "
    + "ruchem w tej turze), bo opts jest opcjonalne i handler scout-explore woli je bez opts.all "
    + "-- zgodnie z zadaniem ('domyslne opts = tylko jednostki z ruchem, zgodnie z zachowaniem Spacji')",
  /const list = opts\?\.all === true \? cyclablePlayerArmyLeadsAll\(\) : cyclablePlayerArmyLeads\(\);/.test(mainSrc),
);

console.log('');

console.log('========================================================================');
console.log('WYNIK: ' + passCount + ' PASS, ' + failCount + ' FAIL');
console.log('========================================================================');
if (failCount > 0) process.exit(1);
