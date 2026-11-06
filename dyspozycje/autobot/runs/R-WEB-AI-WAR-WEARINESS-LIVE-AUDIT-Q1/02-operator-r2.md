STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-WAR-WEARINESS-LIVE-AUDIT-Q1
RUNDA: 2/5 (Operator, obrona)

## Odpowiedzi na zarzuty
1. PRZYJMUJE. `PEACE_TREATY_LOCK_TURNS=10` (diplomacy-peace-lock.ts:11) tlumaczy luke 10 tur. Poprawka w allowliscie (war-weariness.ts + tick w main.ts): nowe parametry JSON `karencjaPoPokojuTur=40` (pokoj niechronionego i z wyczerpania) oraz `karencjaChronionegoTur=100` (pokoj chronionego przegrywajacego). `finalize(loser,winner,lockTurns)` -> `finalizePeaceTreatyBetween(...,lockTurns)` (parametr istnial). Testy 7i/7j.
2. PRZYJMUJE (kryterium nadal niespelnione). Oferta z miastem w zywym logu: NIE_ZMIERZONO (tura 1-3 min, swiat ok. 17 min). Dowod zastepczy to realny runWarWearinessTick (7c/7d/7f), ale NIE jest to dowod zywy.
3. PRZYJMUJE. 1 ziarno (4242) nie pozwala twierdzic ani poprawy, ani braku snowballa; nie twierdze. Dopomiar >=2 ziaren: NIE_ZMIERZONO.
4. PRZYJMUJE. Wycofuje teze "pokoj T82 zamiast T128 dzieki poprawce": serie roznej dlugosci, rozne swiaty (2 vs 5 wojen), n=1, brak kontrfaktu; T122 (0,57>=0,5) zadzialalby na starym kodzie. T82/T137 (zmeczenie 0,25/0,26) to obserwacja nowej sciezki, nie dowod efektu.
5. PRZYJMUJE. Test 7j (realne startPeaceTreatyLock/isPeaceTreatyLocked + runWarWearinessTick; agresor wypowiada wojne, gdy tylko wolno; 300 tur; przegrywajacy 12 miast, traci miasto co 6 tur wojny od tury 10): karencja 10 => 6 wojen, 12 utraconych, 0 zostaje (eliminacja). Samo 40 tez nie wystarczalo (odtworzone: eliminacja, bo mustAccept przy <=3 miastach nie oddaje miast, a agresor wraca) - stad karencja chronionego 100. Po poprawce (40/100): 3 wojny, 9 utraconych, 3 zostaja. Sim NIE modeluje istniejacego bezpiecznika main.ts `maybeResolveRegularWarOnCityCapture` (zwykla wojna konczy sie po 2 zdobytych miastach, cooldown 20) - czyli sim jest wariantem gorszym.

## ZMIANY/COMMIT
Pliki: gra/src/game/war-weariness.ts, gra/src/main.ts (1 linia w tickAiAiWarWeariness), gra/data/war-weariness-params.json, gra/tools/ai-war-weariness-peace-test.cjs, gate-r2-*.txt, ten raport.

## TESTY
- ai-war-weariness-peace-test PASS=90 FAIL=0 (bylo 81); tsc --noEmit EXIT=0.
- diplo-war-peace sim/main-guard/gate, diplomacy-peace-lock, ai-war-gate: EXIT=0.
- war-allin-capital-quick EXIT=0; hash ON aiVsPlayer 0b2afc75febaa727 (zgodny z r1).
- forced-war-bronze-main-guard 21 PASS / 1 FAIL (preistniejacy, tekstowa straz diploInp; moj diff main.ts to 1 linia gdzie indziej).
- Mutacje (wszystkie zabite): karencjaChronionegoTur 100->10: 4 FAIL; karencjaPoPokojuTur 40->10: 2 FAIL; main.ts bez lockTurns: 1 FAIL.

## BLOKADY (decyzje produktowe, A/B/C)
- karencjaPoPokojuTur: A) 20 (jak cap miast), B) 40 (wdrozone), C) 60.
- karencjaChronionegoTur: A) 60, B) 100 (wdrozone), C) 150. Sim 7j: 10 => eliminacja w 300 t; 40/100 => 3 miasta zostaja.
- NIE_ZMIERZONO: ziarna 2-3, oferta z miastem w zywej grze, snowball/HHI po zmianie karencji.

NASTEPNY KROK: Evaluator; zywy dopomiar (>=2 ziarna) jako osobny przebieg.
DEPLOY/PUSH: NIE WYKONANO
