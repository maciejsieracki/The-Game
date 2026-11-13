STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CITY-NAME-UNIQUE-FOREVER-Q1
RUNDY: 2/5 (obrona)

Zarzut 1 PRZYJMUJE: stolica gracza zasila globalny zbior nazw w cluster-spawn.ts (usedNamesGlobal startuje z playerCapitalName) i cluster-start.ts (acceptedNamesGlobal startuje z spawnPlan.playerStartCityName).
Zarzut 2 PRZYJMUJE: nowy test gra/tools/city-name-start-overlap-test.cjs (prawdziwe buildClusterStartPlan i buildClusterSpawnPlan, 5 cywilizacji x 3 ziarna, pule z wymuszonym nakladaniem). PRZED poprawka 30 FAIL, PO PASS 15/15. cluster-start-test.cjs: NIE_ZMIERZONO (>580 s w tym srodowisku).
Zarzut 3 PRZYJMUJE (odnotowanie): cluster-plan-name-test 2 passed/4 failed PRZED i PO identycznie (dlug wczesniejszy, ta sama lista FAIL); poza zakresem.
Zarzut 4 ODRZUCAM jako brak mozliwosci pelnego pomiaru (NIE_ZMIERZONO pozostaje: pelny przebieg AI i Chromium); symulacja funkcji wyboru 41 -> 0 nadal wazna.
Zarzut 5: odnotowane, bez zmian (brak usuwania miast; przy przyszlym usuwaniu dodac extraReserved). Nazwa stolicy drugiego czlowieka (hotseat) nie jest tu nazywana - NIE_ZMIERZONO.

Regresje PO: unique-forever 14 ok, city-names-pool 123/0, pools 9/0, rozlaczne-pule 9/0, shared-queue 10/0, capital-capture 107/107, pop-loss 29/0, elimination 114/0, save-load-sort 4/4, allocation 5/5, difficulty 7/0; tsc EXIT=0.
DEPLOY/PUSH: NIE WYKONANO
