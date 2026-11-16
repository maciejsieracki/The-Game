STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-END-TURN-HINT-DIPLO-AUDIENCE-TEXT-Q1
GOAL: podpowiedź blokady "Zakończ turę" pokazuje komunikat otwartego modala (audiencja / panel łączenia armii / karta techu) przed "Zakończ ekran bitwy…"; bez zmiany logiki blokady; endturn-battle-deadlock-exec-test wraca do bazy 42/7.
ZMIANY-COMMIT: kandydat 6f27b5f28 (kod = 95a2dd22c; 6f27b5f28 dodaje tylko raport obrony). Potomek bazy 2bd8bb6fe (merge-base --is-ancestor: tak). Diff vs 2bd8bb6fe: tylko endturn-battle-deadlock-exec-test.cjs (+stub isTechDiscoveryNoticeOpen) i raporty. Całość vs main: gra/src/main.ts +13 (3 gałęzie modali przed gałęzią bitwy), end-turn-hint-diplo-audience-test.cjs (nowy), exec-test, raporty; w allowliście. Kod NIE jest potomkiem aktualnego main 7526eebc5 (main poszedł naprzód): git merge-tree 7526eebc5 6f27b5f28 = czysty merge (drzewo e271261dd).
TESTY (zmierzone tu, surowe): tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; end-turn-hint-diplo-audience 16/0; end-turn-block-event 35/0; endturn-battle-deadlock 38/0; koniec-tury-f1-f4-runda3 39/0; diplomacy-sensible-deals 63/0; endturn-battle-deadlock-exec 42 pass/7 fail na kandydacie ORAZ 42/7 na bazie 8f6381fc5 (dług bazowy, identyczny). git diff --check czysty. Chromium/Vite: NIE_ZMIERZONO (zmiana wyłącznie tekstowa; test wykonuje ciało funkcji ze źródła).
ZARZUTY: 1 ODDAL (modal pierwszy zgodnie z dispatchem; nota). 2 ODDAL (opis w DODATKU 1 błędny, kod obejmuje 3 modale; nie wada kodu). 3 ODDAL (brak Chromium dopuszczony dla zmiany tekstowej; nota). Brak NAPRAW.
BLOKADY: brak
RUNDY: FC 2/5
NASTĘPNY KROK: integracja orkiestratora (merge z main 7526eebc5, bramki po merge), potem READY_FOR_DEPLOY.
UWAGI-DLA-ORKIESTRATORA: przy otwartym modalu i innej realnej przyczynie blokady (NNS/oferta AI) podpowiedź mówi o modalu - akceptowane. Opis isOtherEndTurnModalOpen w dokumentacji skorygować (3 modale).
DEPLOY/PUSH: NIE WYKONANO
