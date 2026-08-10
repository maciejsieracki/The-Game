'use strict';
/**
 * cs-military-cap-wiring-test.cjs — R-CS-HARD-PASYWNE-KOLIDUJE-Z-DWIEMA-DECYZJAMI-08-04=B
 * (naprawa regresji Evaluatora na commit a6076db7, 2026-08-10).
 *
 * Kontekst: a6076db7 rozdzielił trudność Państw-Miast (PM) na dwie osie -- (AI) jak łatwo
 * INNE cywilizacje AI podbijają PM, i (GRACZ) jak agresywne PM są wobec GRACZA -- i przepiął
 * pod nową zmienną `_menuCityStateDifficultyVsPlayer` większość konsumentów (main.ts:
 * applyCityStateDifficultyTrust, cityStateOffensiveSupport, resolveClusterCityStateWarOnPlayer,
 * _menuCitySupport). Evaluator znalazł, że `cityStateMilitaryProductionCap(opts.menuDifficulty)`
 * (ai.ts, wołane w chooseCityProduction) zostało pominięte -- nadal czytało STARĄ oś gry
 * (_menuDifficulty), więc na Trudnym (gra) cap('hard')=0 blokowało PM przed rekrutacją
 * NAWET pierwszego garnizonu, mimo że ten sam commit włączył cityStateOffensiveSupport=true
 * na Trudnym (PM planuje agresję, buduje Koszary, w których nic nigdy nie rekrutuje).
 *
 * `ai-mp-military-cap-test.cjs` (T1-T8) testuje FUNKCJĘ CZYSTĄ (cityStateMilitaryProductionCap)
 * i chooseCityProduction w izolacji, z ręcznie zbudowanym `opts` -- NIE łapie, gdyby main.ts
 * po cichu wrócił do przekazywania starej osi (_menuDifficulty) zamiast nowej
 * (_menuCityStateDifficultyVsPlayer) w prawdziwym wywołaniu silnika. Ten test zamyka dokładnie
 * tę lukę WIRINGU -- asercje tekstowe (regex) na źródle main.ts + ai.ts, wzorem
 * scout-explore-deselect-cycle-test.cjs / spichlerz-cap-citypanel-wiring-test.cjs.
 *
 * Run from gra/: node tools/cs-military-cap-wiring-test.cjs
 */
const fs = require('fs');
const path = require('path');

const AI_TS = path.join(__dirname, '..', 'src', 'game', 'ai.ts');
const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const CS_DIFF_TS = path.join(__dirname, '..', 'src', 'game', 'city-state-difficulty.ts');

const aiSrc = fs.readFileSync(AI_TS, 'utf8');
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
const csDiffSrc = fs.readFileSync(CS_DIFF_TS, 'utf8');

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) {
    pass++;
    console.log('  PASS: ' + label);
  } else {
    fail++;
    console.error('  FAIL: ' + label + (detail ? ' -- ' + detail : ''));
  }
}

console.log('========================================================================');
console.log('cs-military-cap-wiring-test -- bramka tekstowa ai.ts + main.ts');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// 1. ai.ts: cityStateMilitaryProductionCap wołane z opts.cityStateDifficultyVsPlayer,
//    NIE z opts.menuDifficulty (stara oś gry).
// ---------------------------------------------------------------------------
console.log('1. ai.ts: chooseCityProduction woła cap z NOWEJ osi (cityStateDifficultyVsPlayer)');

check(
  "opts.cityStateDifficultyVsPlayer !== undefined jest strażnikiem WEJŚCIA do bloku capu "
    + "(zastępuje stary opts.menuDifficulty !== undefined)",
  /if \(opts\.defensiveCopy && opts\.cityStateDifficultyVsPlayer !== undefined\) \{/.test(aiSrc),
);

check(
  "cityStateMilitaryProductionCap(...) wołane z opts.cityStateDifficultyVsPlayer",
  /const milCap = cityStateMilitaryProductionCap\(opts\.cityStateDifficultyVsPlayer\);/.test(aiSrc),
);

check(
  "opts.menuDifficulty NIE jest już czytane w bloku capu wojska MP "
    + "(gdyby ktoś po cichu cofnął przepięcie na starą oś, ten regex by to złapał)",
  !/cityStateMilitaryProductionCap\(opts\.menuDifficulty\)/.test(aiSrc),
);

check(
  "AITurnOpts deklaruje pole cityStateDifficultyVsPlayer?: DifficultyLevel",
  /cityStateDifficultyVsPlayer\?: DifficultyLevel;/.test(aiSrc),
);

console.log('');

// ---------------------------------------------------------------------------
// 2. main.ts: opts literal dla AI (w tym PM/defensiveCopy) zasila cityStateDifficultyVsPlayer
//    z `_menuCityStateDifficultyVsPlayer` (NOWA oś), nie z `_menuDifficulty` (STARA oś).
// ---------------------------------------------------------------------------
console.log('2. main.ts: opts literal AI ustawia cityStateDifficultyVsPlayer z NOWEJ zmiennej');

check(
  "main.ts zawiera 'cityStateDifficultyVsPlayer: _menuCityStateDifficultyVsPlayer,' "
    + "w literale opts przekazywanym do chooseCityProduction (przez decideAITurn)",
  /cityStateDifficultyVsPlayer: _menuCityStateDifficultyVsPlayer,/.test(mainSrc),
);

check(
  "main.ts NIE ustawia cityStateDifficultyVsPlayer ze starej zmiennej _menuDifficulty "
    + "(regres byłby: przepięcie pola bez przepięcia źródła)",
  !/cityStateDifficultyVsPlayer:\s*_menuDifficulty,/.test(mainSrc),
);

console.log('');

// ---------------------------------------------------------------------------
// 3. Spójność: cap('hard') w city-state-difficulty.ts faktycznie > 0 (nie tylko przepięcie
//    osi bez podniesienia wartości -- to była DRUGA połowa naprawy z ABC wariant B).
// ---------------------------------------------------------------------------
console.log('3. city-state-difficulty.ts: cap(\'hard\') podniesiony z 0 na >0 (wariant B)');

const capFnMatch = csDiffSrc.match(
  /export function cityStateMilitaryProductionCap\([\s\S]*?\n\}/,
);
check(
  "funkcja cityStateMilitaryProductionCap znaleziona w city-state-difficulty.ts",
  capFnMatch !== null,
);
const capFnBody = capFnMatch ? capFnMatch[0] : '';

check(
  "case 'hard' zwraca 3 (== CS_WAVE_ATTACK_MIN_STACK w ai.ts), NIE 0",
  /case 'hard':\s*\n\s*return 3;/.test(capFnBody),
);

const waveStackMatch = aiSrc.match(/export const CS_WAVE_ATTACK_MIN_STACK = (\d+);/);
check(
  "CS_WAVE_ATTACK_MIN_STACK znaleziony w ai.ts (minimalny stos ataku fali PM-hard, R-MP-HARD-WAVE Q2)",
  waveStackMatch !== null,
);
const waveStackValue = waveStackMatch ? Number(waveStackMatch[1]) : null;
check(
  "cap('hard')=3 === CS_WAVE_ATTACK_MIN_STACK -- PM ofensywne na Trudnym może faktycznie "
    + "zgromadzić własne minimum stosu do fali (bez tego cap sam siebie by dezaktywował)",
  waveStackValue === 3,
  `CS_WAVE_ATTACK_MIN_STACK=${waveStackValue}`,
);

console.log('');

console.log('========================================================================');
console.log('WYNIK: ' + pass + ' PASS, ' + fail + ' FAIL');
console.log('========================================================================');
if (fail > 0) process.exit(1);
