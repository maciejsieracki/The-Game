'use strict';
/**
 * diplo-peace-price-wiring-test.cjs -- R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1 (DR-1/DR-2, ABC 2026-11-17).
 * Jedna funkcja ceny pokoju (wearinessPeaceCashPn = cenaStartPn x (1 - L)) podpieta pod wszystkie sciezki:
 *   (W1) war-weariness.ts: tick przekazuje poziom pary do price(winner, loser, level) i pokoj wymuszony liczy cene z L;
 *   (W2) wymuszony pokoj: zapada tylko przy pelnym pokryciu miastami albo przy cenie 0 (bez progu min. 3 miast);
 *   (W3) main.ts: cena AI<->AI (prosby i tick wojny) = wearinessPeaceCashPn(poziom pary); rozejm bez zmian;
 *   (W4) diplomacy-proposals.ts: sciezka R5 (gracz -> AI) liczy cene przez wearinessPeaceCashPn, bez odejmowania Z;
 *   (W5) brak progu min. 3 miast (minMiastPoOddaniu) w ofertach i wymuszeniu.
 *
 *   node tools/diplo-peace-price-wiring-test.cjs   # exit 0 = wszystko zielone
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = path.join(GRA_ROOT, 'src');
const read = (p) => fs.readFileSync(path.join(SRC, p), 'utf8');
const WW = read('game/war-weariness.ts');
const MAIN = read('main.ts');
const PROP = read('game/diplomacy-proposals.ts');

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) pass++; else fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}: ${name}`);
}

check('(W1) tick przekazuje poziom pary do price(winner, loser, lvl)', /d\.price\(winner, loser, lvl\)/.test(WW));
check('(W1) typ price przyjmuje poziom (level: number)', /price: \(winner: number, loser: number, level: number\)/.test(WW));
check('(W2) pokoj wymuszony liczy cene wearinessPeaceCashPn(lvl, P)', /const cashPn = wearinessPeaceCashPn\(lvl, P\);/.test(WW));
check('(W2) wymuszony pokoj wstrzymany przy cenie > 0 bez pelnego pokrycia', /if \(cashPn > 0 && !forcedPlan\?\.full\) \{ none\(\); continue; \}/.test(WW));
check('(W5) brak progu min. 3 miast w planie wymuszenia (cityCap = ownCities)', /const cityCap = d\.battlePending \? 0 : Math\.max\(0, ownCities\);/.test(WW));
check('(W5) brak minMiastPoOddaniu w maxCities ofert', !/ownCities - P\.przegrywajacy\.minMiastPoOddaniu/.test(WW));
check('(W5) brak minMiastPoOddaniu w cityCap wymuszenia', !/ownCities - L\.minMiastPoOddaniu/.test(WW));

// W3: AI<->AI w main.ts (prosby + tick zmeczenia). Rozejm zostaje na dotychczasowej wycenie.
check('(W3) main.ts: cena pokoju AI<->AI z wearinessPeaceCashPn (prosby)', /relBasedPn > 0 \? wearinessPeaceCashPn\(aiAiPairWearinessLevel\(winner, loser\)\) : 0/.test(MAIN));
check('(W3) main.ts: cena pokoju AI<->AI z wearinessPeaceCashPn (tick zmeczenia)', /requiredPn: relBasedPn > 0 \? wearinessPeaceCashPn\(level\) : 0,/.test(MAIN));
check('(W3) main.ts: rozejm AI<->AI zachowuje dotychczasowa wycene', /const requiredPn = kind === 'rozejm' \? relBasedPn/.test(MAIN));
check('(W3) main.ts: helper poziomu pary AI<->AI', /function aiAiPairWearinessLevel\(a: number, b: number\): number/.test(MAIN));

// W4: sciezka R5 w diplomacy-proposals.ts
check('(W4) R5: cena = wearinessPeaceCashPn(wearyLevel) przy bramce relacji', /const cenaPokojuPn = basePnCfg \* r5Gate\.priceMultiplier > 0 \? wearinessPeaceCashPn\(wearyLevel\) : 0;/.test(PROP));
check('(W4) R5: wymagana cena = cena pokoju (pokoj) / baza rozejmu, bez odejmowania Z', /basePn = cenaWymaganaPn;/.test(PROP) && !/cenaWymaganaPn - wearyPwItem/.test(PROP));
check('(W4) R5: pozycja Z (wearinessPeaceItemPw) nie jest liczona dla gracza->AI', !/wearinessPeaceItemPw\(cenaPokojuPn/.test(PROP));

console.log(`diplo-peace-price-wiring-test: PASS=${pass} FAIL=${fail}`);
process.exitCode = fail === 0 ? 0 : 1;
