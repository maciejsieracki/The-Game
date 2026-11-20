STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dokumentacja i model; zero zmian w gra/src i gra/data)
TEMAT: R-WEB-ECONOMY-TREASURY-MODEL-REFRESH-Q1
GOAL: usunac niepodparte wnioski z KOSZTY-JEDNOSTEK-STAN-2026-11-20.md i naprawic model Spichlerza wzgledem zarzutow Evaluatora.
ZMIANY/COMMIT: kandydat ace3351d1; merge-base --is-ancestor 13e869f519 ace3351d1 = TAK. diff --stat: 7 plikow (doc KOSZTY-JEDNOSTEK +113, 2 nagłówki NIEAKTUALNE po +2, 2 raporty runu, food-granary-model.cjs, treasury-unit-cost-model.cjs); wszystko w allowliscie, zero gra/src i gra/data. git diff --check czysto.
OCENA ZARZUTOW: 1 (rekomendacja A niepodparta) - usuniete: rekomendacja A to teraz "najpierw pomiar", ujawnia netto +524 vs -740. 2 (312 vs 320 rozne armie) - usuniete: porownanie tej samej armii 26 x Wlocznik = 832/t. 3 (racje 1046 / m=1,5) - usuniete: 1395/t, cap w 16 lub 22 tury (surowe wyjscie f.out: 1395, 832, 1648, 1136, 16, 22). 4 (kurs 0,2) - usuniete: ZMIERZONO z econ-params.json.
TESTY: npm ci --ignore-scripts w gra/ exit 0; node gra/tools/treasury-unit-cost-model.cjs exit 0 (netto 1550-786-240=524; wrazliwosc +12/-740/-2244; tabele jednostek zgodne z doc); node gra/tools/food-granary-model.cjs exit 0; npx tsc --noEmit exit 0; diff --check czysto. 5 bramek referencyjnych: NIE URUCHOMIONO - zero zmian w gra/src i gra/data (zmiana wylacznie dokumentacja i narzedzia .cjs poza bundlem).
BLOKADY: brak
UWAGI-DLA-ORKIESTRATORA: (a) food-granary-model.cjs nadal drukuje linie "tury do capu (netto zrzutu, stare wzory): 13" - jest oznaczona jako stare wzory, a poprawne 16/22 jest nizej; kosmetyka. (b) Rozbieznosc 1550-786-376=388 vs panel 345 NIE_ZMIERZONO (opisana w doc). (c) Sklad armii zrzutu NIE_ZMIERZONO; pytanie ABC A -> pomiar VERIFY-LIVE (#38).
RUNDY: 2/5
NASTEPNY KROK: integracja orkiestratora (merge-tree, FF), rejestry.
DEPLOY/PUSH: NIE WYKONANO
