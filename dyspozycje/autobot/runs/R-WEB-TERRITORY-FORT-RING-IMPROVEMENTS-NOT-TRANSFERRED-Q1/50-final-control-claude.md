STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-TERRITORY-FORT-RING-IMPROVEMENTS-NOT-TRANSFERRED-Q1
GOAL: heks z ulepszeniem wlasciciela fortu w pierscieniu nie przechodzi pod nowe miasto innej cywilizacji (decyzja ABC C, 2026-11-19).
ZMIANY/COMMIT: kandydat 495682128; baza 3e978f882 jest jego przodkiem (merge-base --is-ancestor: tak). git diff --stat: 5 plikow (territory.ts, fort-territory.ts, city-founding-no-fort-takeover-test.cjs, 10-operator, 30-obrona), wszystko w allowliscie; main.ts i pin fort-outpost nietkniete wzgledem bazy.
TESTY (wlasne, surowe, na 495682128): tsc exit 0; logic 213/213; tech-tree 20/0; research 33/0 ALL GREEN; unit-replace 21/21; combat 6/6; city-founding-no-fort-takeover 48/0; fort-outpost-hard-territory 92/0; fort-strazniaca-zasieg-zakladania 82/0; ai-territory-race 29 OK/0 FAIL. Mutacji i Chromium nie powtarzalem (NIE ZMIERZONO przeze mnie; mutacje wg raportow obrony i evaluatora: 4-5 FAIL).
OCENA ZARZUTOW:
1 (regresja wlasciciela ulepszenia): ODDALONY po obronie. Predykat jest wlascicielski (q,r,fortOwnerId), RF-14 pokrywa przypadek.
2 (brak blokady budowy, improvement-build.ts poza allowlista): PRAWDA, wymaganie dispatchu pkt 2 niespelnione; wymaga decyzji o rozszerzeniu allowlisty.
3 (mutacja): NAPRAWIONY przez obrone (mutacja daje FAIL).
4 (Chromium): PRAWDA, NIE ZMIERZONO; produkcja niepodpieta, wiec przed/po identyczne.
5 (wydajnosc): dzis bez skutku, bo main.ts nie podpina predykatu (grep: shieldsHex poza territory.ts i fort-territory.ts nie wystepuje; main.ts:5962 wola fortTerritoryNodes(fortNodes) bez predykatu). Przy podpieciu wylacza cache/indeks rejestru: ryzyko do pomiaru PRZED wdrozeniem.
6 (wiele fortow, bestFortShields tylko od najlepszego): PRAWDA, brak testu; przy podpieciu do domkniecia.
WERDYKT: kod jest martwy w grze. Regula ABC C NIE dziala w produkcji (brak podpiecia, brak rejestru wlasciciela ulepszen placedImprovements=string[], brak blokady budowy). Zmiana jest bezpieczna (zero regresji), ale cel tematu niespelniony.
BLOKADY: (1) rejestr wlasciciela ulepszen (~13 miejsc zapisu + save) poza allowlista; (2) blokada budowy w improvement-build.ts poza allowlista; (3) Chromium NIE ZMIERZONO; (4) wydajnosc i wiele fortow do domkniecia.
RUNDY: 2/5 (FC po rundzie 2)
NASTEPNY KROK: decyzja orkiestratora/wlasciciela: (a) rozszerzyc allowliste o rejestr wlasciciela ulepszen, improvement-build.ts i podpiecie w main.ts, nowa runda Operatora; albo (b) zintegrowac 495682128 jako niepodpiety predykat z testami (bez zmiany zachowania gry) i zamknac temat jako czesciowy.
UWAGI-DLA-ORKIESTRATORA: integracja 495682128 sama nie dostarcza zmiany w grze; nie deployowac jako "FORTRING wdrozone".
DEPLOY/PUSH: NIE WYKONANO
