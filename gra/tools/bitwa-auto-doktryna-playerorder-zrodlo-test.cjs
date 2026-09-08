'use strict';
/**
 * bitwa-auto-doktryna-playerorder-zrodlo-test.cjs
 * P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1 -- straznik zrodlowy przeciw regresji.
 *
 * DLACZEGO STATYCZNY TEST ZRODLOWY (a nie zywy Chromium): _activateUnit zyje w
 * battleScene.ts, klasie zaleznej od THREE.js/WebGL -- odpalenie PRAWDZIWEJ
 * instancji BattleScene w Chromium poza pelna gra jest poza budzetem jednej
 * rundy (patrz r-bitwa-etykieta-tozsamosc-strony-zrodlo-test.cjs w tym samym
 * katalogu dla precedensu tego samego wzorca na tym samym pliku). Ten test
 * pilnuje ZRODLA dokladnie tej bramki.
 *
 * BUG (naprawiony ta runda): bramka wejscia do doktryny AUTO w _activateUnit
 * wymagala `ru.playerOrder.type === 'none'`, ale to samo pole jest wewnetrzna
 * ksiegowoscia "ruch w toku" samej doktryny (_executeGroupDoctrineStep /
 * _executeSkirmishDoctrineStep) -- gdy krok doktryny nie ladowal jednostki
 * dokladnie na wyliczonym `dest` (kolizja, formacja ciasna), `playerOrder`
 * zostawal `'move'` NA ZAWSZE i jednostka trwale wypadala z systemu doktryny.
 * Zobacz dyspozycje/autobot/runs/P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1/
 * 01-operator-runda1.md dla pelnego dowodu z zywej symulacji.
 *
 * Ten test pilnuje DWOCH rzeczy w zrodle _activateUnit:
 *   1. Zla bramka (`_isUnitDoctrineAuto(ru) && ru.playerOrder.type === 'none'`)
 *      NIE wystepuje juz w pliku -- gdyby ktos ja przywrocil (np. przy scalaniu
 *      z rownolegle rozwijanym tematem dotykajacym tej samej funkcji), test
 *      czerwienieje natychmiast.
 *   2. Reset ksiegowosci (`ru.playerOrder = { type: 'none' }` wewnatrz galezi
 *      `!this._manualMode`) jest obecny -- to jest sedno naprawy, nie tylko
 *      usuniecie warunku.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src', 'battle', 'battleScene.ts');
const src = fs.readFileSync(SRC, 'utf8');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  [OK] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name}`); }
}

// 1. Stara, buggy bramka nie moze wystapic nigdzie w pliku.
const oldGatePattern = /_isUnitDoctrineAuto\(ru\)\s*&&\s*ru\.playerOrder\.type\s*===\s*'none'/;
check(
  "stara bramka '_isUnitDoctrineAuto(ru) && ru.playerOrder.type === \\'none\\'' NIE wystepuje w zrodle",
  !oldGatePattern.test(src)
);

// 2. _activateUnit musi zawierac reset playerOrder na 'none' w galezi AUTO,
//    w bezposrednim sasiedztwie `if (!this._manualMode) {` i wywolania
//    _isUnitDoctrineAuto(ru) (okno 400 znakow wystarcza na ten blok, patrz
//    linie ok. 5411-5419).
// Kotwica na funkcje _activateUnit (definicja, nie komentarz/wywolanie) --
// w pliku istnieje kilka innych bloków 'if (!this._manualMode) {' w innych
// funkcjach (np. linia ok. 3471, 15964), wiec szukamy DOKLADNIE tej wewnatrz
// _activateUnit.
const activateUnitDefIdx = src.indexOf('private _activateUnit(ru: RuntimeBattleUnit, done: () => void): void {');
check("definicja '_activateUnit' istnieje w zrodle", activateUnitDefIdx !== -1);

// RUNDA 2 (P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1): po scaleniu z rownoleglym
// tematem P-BITWA-OBRONCY-PRZED-MUREM-Q1 warunek tej bramki zyskuje dodatkowy
// czlon (`&& !siegeDefenderNeverDoctrine`), wiec literalny string
// 'if (!this._manualMode) {' juz nie wystepuje w tym miejscu -- indexOf
// przeskakiwal wtedy do INNEGO, niepowiazanego 'if (!this._manualMode) {' dalej
// w pliku (inna funkcja), co dawalo falszywy FAIL (test slepy na stanie
// scalonym, patrz 08-final-control-runda1.md). Regex ponizej toleruje
// dowolne dodatkowe warunki w tym samym `if (...)` po `!this._manualMode`,
// wiec trafia poprawnie w OBU stanach (przed i po scaleniu z obroncy-mur).
const manualGateRegex = /if\s*\(\s*!this\._manualMode\b[^)]*\)\s*\{/;
let manualGateIdx = -1;
if (activateUnitDefIdx !== -1) {
  const rest = src.slice(activateUnitDefIdx);
  const m = manualGateRegex.exec(rest);
  if (m) manualGateIdx = activateUnitDefIdx + m.index;
}
check("blok 'if (!this._manualMode ...) {' wewnatrz _activateUnit istnieje w zrodle (toleruje dodatkowe warunki, np. siegeDefenderNeverDoctrine)", manualGateIdx !== -1);

if (manualGateIdx !== -1) {
  const window = src.slice(manualGateIdx, manualGateIdx + 500);
  check(
    "okno po bramce AUTO zawiera '_isUnitDoctrineAuto(ru)'",
    /_isUnitDoctrineAuto\(ru\)/.test(window)
  );
  check(
    "okno po bramce AUTO zawiera reset ksiegowosci playerOrder do 'none'",
    /ru\.playerOrder\s*=\s*\{\s*type:\s*'none'\s*\}/.test(window)
  );
  check(
    "reset NIE jest warunkowany przez 'ru.playerOrder.type === \\'none\\'' (bo to bylby powrot buga)",
    !/if\s*\(\s*this\._isUnitDoctrineAuto\(ru\)\s*&&\s*ru\.playerOrder\.type\s*===\s*'none'/.test(window)
  );
}

console.log(`\nbitwa-auto-doktryna-playerorder-zrodlo-test: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
