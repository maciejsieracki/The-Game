STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-CITY-MILITIA-NO-POPULATION-LOSS-Q1
GOAL: Straty Milicji nie zmieniaja ludnosci; zdobycie obcego miasta = -1 obywatel (min. 1).
ZMIANY/COMMIT: SHA koncowy do integracji kodu: 2a67f081e1bce657a3913097b1e706dec52e1cf3 (d4ca8b748 + 2a67f081e, baza c1581619f, ktora jest w origin/main). Poza allowlista dispatchu: post-battle-map.ts, cities.ts, miasto-params.json (dozwolone doprecyzowaniem: modul zdobywania + klucz danych). Zero zmian w gra-robocza, WERSJE.md, rust-port. git diff --check czysty.
TESTY (zweryfikowane samodzielnie): city-capture-pop-loss 29 PASS/0 FAIL (5 mutacji zlapanych); city-militia-no-population-loss PASS; no-defenders 110 OK/0 FAIL; regen-cooldown 53 PASS/0 FAIL; tsc --noEmit bez bledow. Regresja PRZED vs PO identyczna (te same padajace: ai-wojny-zwykle-cap-dwa-miasta, ai-zdobycie-miasta-adiacencja, mgla-sciezka-inwariant, okolica-ownership-change-reconcile, weterani, wydarzenia-eliminacja-podboj-karta, budynek-garnizon); spot-check ai-zdobycie-miasta-adiacencja i weterani na c1581619f vs 2a67f081e: ten sam wynik. Przegladem kodu: wszystkie zmiany city.ownerId przy zdobyciu (post-battle-map:546, main.ts:16023 kapitulacja) maja -1; pozostale (cesja 33089, aneksja 32122, bunt, helpery testowe) celowo wyłączone.
ZARZUTY: 1 ODDAL - zrealizowane w r2 (capture_pop_loss w danych, wspolny punkt applyCityCaptureAfterBattle + kapitulacja, wylaczenia, wiersz UI, zdanie w PROJEKT-GRY-master.md). 2 ODDAL - mechanizm nie istnial, dodany. 3 ODDAL - wall-defenders-bonus-range-test wymaga vite build (zakazane); budynek-garnizon padal przed i po. 4 ODDAL - pomiar w Chromium wymaga bundla vite (zakazane); test uruchamia prawdziwe funkcje + kontrola statyczna lancucha main.ts. Wiersz UI niezobaczony wizualnie (NIE_ZMIERZONO) - do sprawdzenia po wdrozeniu na robocza.
BLOKADY: brak
RUNDY: 2/5
NASTEPNY KROK: integracja orkiestratora. Zmiany dotycza wylacznie gra/ (web), rust-port nietkniety, wiec brak zaleznosci od origin/rust-port/parity-v2 - dowolna kolejnosc. origin/main jest nowszy (60621493a) - merge/rebase i ponowny tsc przed deployem.
DEPLOY/PUSH: NIE WYKONANO
