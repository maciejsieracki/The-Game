STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-UNIT-UPKEEP-COST-PACE-MULT-Q1
GOAL: Ustawienie "Koszty jednostek" (Niski x1 / Normalny x2 / Wysoki x4) mnozy tez utrzymanie jednostek (Pieniadz, surowce, zywnosc); karty = silnik.
ZMIANY/COMMIT: kandydat 6ba999ceea5f64a588c0e5ff0237bcfcc6e78178 na bazie 48b94c5ca6f8d852ac35e5a52895d6a7e4d630a6. `git merge-base --is-ancestor` = OK. diff --stat: 13 plikow (+454/-41): ai.ts, economy-upkeep.ts, empire-food.ts, no-negative-stocks.ts, turn-economy.ts, unit-cost-tempo.ts, main.ts, cityPanel.ts, unitAdapter.ts, unitInfoCard.ts, tools/unit-upkeep-cost-pace-test.cjs, 2 raporty runu. Poza allowlista: empire-food.ts, no-negative-stocks.ts (uzasadnione: zywnosc armii) - nota. Brak zmian w gra-robocza/, gra-kanon/, WERSJE.md, rust-port/.
TESTY (wlasne, surowe wyjscie, worktree na 6ba999ce): tsc --noEmit rc=0 (0 bledow); unit-upkeep-cost-pace 81 ok/0 FAIL; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-unit-replace-same-rules 45/0; ekonomia-5x-inwariant 280/0; unit-upkeep-era-scale 24/0; econ-era-rebalance 38/0; upkeep 91/0; glod-wojska-karencja 40/0; unit-resource-upkeep 7/0; unit-epoch-cost 57/0; entity-card-contract 75/0. Nie powtarzalem: building-upkeep-resources, empire-food-b5 (obrona: czerwone tak samo na bazie).
OCENA ZARZUTOW:
1. Karty niespojne - NAPRAWIONE: diff potwierdza, ze unitInfoCard, unitAdapter, cityPanel uzywaja unitPieniadzUpkeepCardValue / unitResourceUpkeepCardAmount / unitFoodCardValue z biezacyKosztJednostekPace(). Zarzut zamkniety.
2. Brak pomiaru biegu dymnego AI - NIE ZMIERZONO (harness przekracza limit, ma na sztywno 'niski'). Dispatch dopuszcza NIE ZMIERZONO; nie blokuje werdyktu, ale ryzyko skutku destrukcyjnego (utrzymanie x2 w domyslnej grze: glod/rozpad armii AI) pozostaje niezweryfikowane -> VERIFY-LIVE, z naprawa harnessu (tempo 'normalny').
3. Piny na Normalny - obrona slusznie: istniejace testy wolaja bez parametru (= Niski, stare zapisy) i sa zielone; Normalny pokryty nowym testem (81, w tym skan okablowania 23 wywolan). Nota: brak testu E2E okablowania main.ts na realnym stanie gry.
4. Poza allowlista - nota, bez zmiany.
5. Globalny resolver - ryzyko niskie; wywolania bez tempa (forecastNextTurnProduction) dotycza tylko prognozy produkcji. Nota.
BLOKADY: brak blokad merytorycznych.
RUNDY: FC po rundzie 2/5.
NASTEPNY KROK: integracja orkiestratora (merge 6ba999ce do main, bramki), potem VERIFY-LIVE: bieg dymny AI 90 tur seed 4242 z tempem Normalnym (netto Skarbca/Zywnosci, liczba jednostek AI t30/t60/t90) i poprawka sztywnego 'niski' w harnessie pomiarowym.
UWAGI-DLA-ORKIESTRATORA: (a) domyslny Normalny x2 podwaja utrzymanie wszystkich jednostek (Falanga Pieniadz 32->64, zywnosc po x4/epoke 64->128) - skutek na AI niezmierzony; (b) harness pomiaru main.ts ok. l.32327/34331/34525 ma kosztJednostekPace 'niski'.
DEPLOY/PUSH: NIE WYKONANO
