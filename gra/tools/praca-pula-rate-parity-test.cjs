'use strict';
/**
 * praca-pula-rate-parity-test.cjs -- R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1, Wątek D.
 *
 * PRZYCZYNA (recon Operatora tego tematu): w bloku końca tury ekonomii (main.ts) wyświetlany
 * wskaźnik `_lastPracaRate` ("+N" w PULA IMPERIUM) był liczony WYŁĄCZNIE jako suma
 * poolGain/overflowToPool per-miasto pomniejszona o `playerUpkeep` (utrzymanie ulepszeń
 * surowcowych) -- ale TEJ SAMEJ tury pula (`playerPracaPool`) jest DODATKOWO zużywana przez:
 *   1. `advanceOwnerWonderMapBuilds` (postęp Cudów na mapie, `usedPlayer`),
 *   2. nadrzędny budżet budynków ze splitu imperium (`applyEmpireBuildingBudget`,
 *      `usedPlayerBuildingBudget`, sterowany suwakiem "PODZIAŁ PRACY: BUDYNKI/PULA"),
 *   3. auto-ulepszenia terenu gracza (`pick.kosztPraca` w pętli `picks`).
 * Żadne z tych trzech zużyć nie było odejmowane od `_lastPracaRate`, więc UI pokazywał
 * dodatnie "+N" nawet w turze, w której realny stan puli (`playerPracaPool`) ledwo się ruszył
 * albo stał w miejscu -- dokładnie zgłoszony objaw ("9 +10", stan praktycznie zerowy od
 * kilku tur mimo dodatniego wskaźnika). To NIE jest regres identyczny z
 * `R-PRACA-PULA-NIEAKUMULUJE-Q1` (tamten dotyczył złego %-splitu per-miasto w
 * turn-economy.ts/previewCityEconomy i advanceCityEconomy -- ten leży w main.ts, w kroku PO
 * per-miastowym splicie, i nie jest pokryty przez żaden test na `previewCityEconomy`/
 * `advanceCityEconomy`, bo te funkcje nie obejmują tego etapu).
 *
 * Ten test jest statycznym kontraktem źródła (jak `praca-split-ui-test.cjs`) -- pilnuje, żeby
 * każde z trzech miejsc zużywających `playerPracaPool` w tym bloku miało odpowiadające
 * odjęcie od `_lastPracaRate` NIEDALEKO obok (w oknie kilkuset znaków), i żeby nikt tego po
 * cichu nie cofnął.
 *
 * Run from gra/: node tools/praca-pula-rate-parity-test.cjs
 */
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'src/main.ts'), 'utf8');

let pass = 0;
let fail = 0;
function check(name, condition) {
  if (condition) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.error('FAIL: ' + name); }
}

/** Czy `needle` występuje w oknie `window` znaków PO pierwszym wystąpieniu `anchor`. */
function followsWithin(anchor, needle, window) {
  const i = source.indexOf(anchor);
  if (i === -1) return false;
  const slice = source.slice(i, i + window);
  return slice.includes(needle);
}

check(
  'Cuda-mapa: usedPlayer odjęte od _lastPracaRate (Wątek D)',
  followsWithin(
    'const usedPlayer = advanceOwnerWonderMapBuilds(0, playerPracaPool);',
    '_lastPracaRate -= usedPlayer;',
    700,
  ),
);

check(
  'Budżet budynków (splitEmpirePracaBudget): usedPlayerBuildingBudget odjęte od _lastPracaRate (Wątek D)',
  followsWithin(
    'if (usedPlayerBuildingBudget > 0) {',
    '_lastPracaRate -= usedPlayerBuildingBudget;',
    700,
  ),
);

check(
  'Auto-ulepszenia: pick.kosztPraca odjęte od _lastPracaRate (Wątek D)',
  followsWithin(
    'playerPracaPool -= pick.kosztPraca;',
    '_lastPracaRate -= pick.kosztPraca;',
    500,
  ),
);

console.log(`\n[praca-pula-rate-parity-test] ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
