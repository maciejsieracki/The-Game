STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-CONVERTERS-MENNICA-CLAY-ORDER-Q1
GOAL: Mennica (delta 0) i proporcjonalny podział gliny Cegielnia/Garncarnia; obrona rundy 1 (zarzuty Evaluatora 1-5).
ZMIANY-COMMIT: baza 62ba27a3f. Pliki: gra/src/game/converters.ts (+converterAllocatedConsumedRatesForBuildings, wyciągnięty converterThroughputForRecipe, poprawiony komentarz), gra/tools/converters-shared-input-test.cjs (+sekcja E), gra/tools/mennica-magazyn-test.cjs (bramka złota w runTick, reguły i/ii/iii, sekcja C2). SHA: pole sha odpowiedzi.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Asercja rozbita na reguły: (i) BEZ złota delta = 0 -> PASS (got 0); (ii) ZE złotem delta > 0 -> FAIL (got 0); (iii) Mennica+Waluta > Waluta -> PASS (4 > 2). Reguła (iii) sprawdza tylko nierówność, nie pełny mnożnik (przy delta 0 mnożnika nie da się zmierzyć).
2. PRZYJMUJĘ. runTick podaje resolveOwnerActiveLabels i resolveOwnerZlotoAccess (zloto > 0). Bez złota bramka zamyka Mennicę (delta 0 DOWODZI bramki); ze złotem delta nadal 0 z powodu zaokrąglenia (pkt 1).
3. PRZYJMUJĘ CZĘŚCIOWO. Dodano converterAllocatedConsumedRatesForBuildings (ten sam rachunek przez runConverters). Test E: glina 40 -> HUD 39 = Δstanu silnika 39; nominał 130. Bez konkurencji HUD = nominał (130). Komentarz „Ten sam wzór czyta HUD" poprawiony. NIE podpięte: main.ts:4013 i resource-gross-net.ts są poza allowlistą -> BLOKADA.
4. PRZYJMUJĘ jako NIE ZMIERZONO. Bieg dymny 45 tur seed 4242 w przeglądarce nie został wykonany: brak gotowego runnera, wolne 3,7 GB < 4 GB (próg dispatchu). Brak liczb z przeglądarki.
5. PRZYJMUJĘ. Dodano sekcję C2 (advanceCityEconomy, glina 40, Cegielnia+Garncarnia): cegla 38 > 0, ceramika 11 > 0, glina 1 (zużycie 39 <= 40). Semantyka drenażu Spichlerza: turn-economy.ts NIE zmieniony (git diff 1bc8ec66d..62ba27a3f -- turn-economy.ts pusty); brak asercji runtime drenażu.

TESTY (surowe liczby z uruchomienia):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213); tech-tree 20/0; research 33/0; unit-replace 21/21; ai-unit-replace 45/0; combat: All sanity checks passed
- ekonomia-5x 280/0; grupa-b-lane 49/0; hex-plony 14/0; zloto 45/0; tarasy 18/0; resource-gross-net-converter-inputs 18/0
- converters-shared-input-test: 22 passed, 0 failed (było 18)
- mennica-magazyn-test: 44 passed, 1 FAILED (reguła ii: delta 0 ze złotem)

BLOKADY:
- (a) Reguła ii Mennicy CZERWONA: ze złotem delta 0. Przyczyna: DEFAULT_PODZIAL_HANDLU 60/30/10 i floor(2 x 0,30) = 0. Zmiana zaokrąglenia to decyzja właściciela (ABC), nie naprawiona tutaj.
- (b) HUD (main.ts:4013, resource-gross-net.ts) nadal nominalny: wymaga rozszerzenia allowlisty.
- (c) Bieg dymny 45 tur NIE ZMIERZONO.

RUNDY: 2/5 (obrona)
NASTĘPNY KROK: orkiestrator: (1) ABC do właściciela: zaokrąglenie podziału małej puli Mennicy; (2) decyzja o rozszerzeniu allowlisty na main.ts i resource-gross-net.ts; (3) pomiar 45 tur po zwolnieniu dysku. Potem ponowny Evaluator.
DEPLOY/PUSH: NIE WYKONANO
