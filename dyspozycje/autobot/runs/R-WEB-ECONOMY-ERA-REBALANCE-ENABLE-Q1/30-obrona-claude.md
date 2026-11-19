STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-ERA-REBALANCE-ENABLE-Q1
GOAL: eraRebalansAktywny=true domyslnie na ROBOCZEJ (decyzja wlasciciela 2026-11-19, ABC A); testy zgodne z flaga, econ-era-rebalance-test niezalezny od domyslnej flagi (pkt 4 dispatchu).
ZMIANY-COMMIT: baza d269541eb (kandydat). Zmiana w obronie: gra/tools/econ-era-rebalance-test.cjs (E1 i mutant M1 czytaja domyslna wartosc z pliku danych zamiast jej zakodowac; M1 odwrocony wzgledem danych). Dane gra/data/econ-era-rebalance-params.json bez zmian (true). Brak zmian w gra/src/**. Raport: 30-obrona-claude.md.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJE. E1 zakodowal domyslna flage jako true, co lamalo pkt 4. Poprawka: E1 sprawdza hak ON/OFF jawnie, a null -> isEraRebalanceEnabled() === params.eraRebalansAktywny (wartosc z pliku). Mutant M1 (domyslna odwrocona wzgledem danych) jest wykrywalny niezaleznie od stanu danych. Dowod: przy danych false wynik 37 ok / 0 FAIL, przy danych true 37 ok / 0 FAIL (ponizej). Poprzednia wersja przy danych false dawala 1 FAIL (M1) - naprawione.
2. PRZYJMUJE. Niespojnosc liczb w raporcie operatora (4 vs 6). Poprawione w tym raporcie: zmienione testy legacy sa 6 (citizen-consumption-era-mult, foundry-throughput-x2-era-mult, population-growth-v85-bonus, unit-epoch-cost, kamieniolom-kamien-epoka, improvement-era-scaling), wszystkie zielone po jawnym OFF. Wynik econ-era-rebalance-test: 37/0. Zmiana w tym commicie: econ-era-rebalance-test.cjs (7 plikow testowych w d269541eb to 6 legacy + econ-era).
3. PRZYJMUJE (brak dowodu = przyjecie). Hak status() pokazujacy flage ON NIE jest dowiedziony: w rekordzie smoke pole ecoRebalance = null bez --rebalance (runner zapisuje flage tylko z --rebalance). Dowod ON jest wylacznie z bundla (eraRebalansAktywny:!0). Nie wpisuje tego jako dowod statusu. Bieg dymny w przegladarce nie zostal powtorzony w tej rundzie.
4. PRZYJMUJE jako zanotowane (bez zmiany kodu). 16-18 testow czerwonych w stanie bazy (auto-fort-claim, building-upkeep-resources, citypanel-konwerter-produkcja, ekonomia-5x-inwariant, fishing-boats-666, grupa-b-lane, hex-plony-magazyn, hodowla-las, hud-skarbiec, mennica-magazyn, rekrutacja-koszty-polowa-all, stadnina-early-eras-deposit-only, tarasy-cywilizacje, map-improvement-qualify, zloto-test, a takze timeouty autoimprove-irrigation-after-farms i hotseat-etap5-no-leak) - dlug istniejacy, poza zakresem. Przyczyny NIE ZMIERZONO. Do osobnego tematu.

TESTY (surowe wyjscie, ta runda):
- econ-era-rebalance-test, dane ON (commitowane): exit 0, WYNIK: 37 ok, 0 FAIL
- econ-era-rebalance-test, dane OFF (tymczasowo, plik przywrocony do commita): exit 0, WYNIK: 37 ok, 0 FAIL
- Przed poprawka, dane OFF: exit 1, WYNIK: 36 ok, 1 FAIL (M1)
- npm ci --ignore-scripts w gra/: exit 0 (sprzatac node_modules po integracji)
- NIE ZMIERZONO w tej rundzie: tsc, logic-test, tech-tree, research, unit-replace, combat, pozostale testy HUD/citizen/foundry (zadne nie zmienilo sie od kandydata: diff tej rundy to tylko econ-era-rebalance-test.cjs). Wyniki z raportu Evaluatora (75a31682): tsc 0, logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6, ai-economy-measure-hook 23/23, HUD 17/18/7/36 zielone, citizen-consumption PASS, upkeep 681/0, foundry 159/0.
- Smoke 30 tur (raport operatora): gracz t30 surowce brutto 42 (ref ON 42, OFF 56), bundle eraRebalansAktywny:!0, brak NaN. Nie powtorzony w tej rundzie.

BLOKADY: brak dla celu tematu. Dlug 16-18 testow czerwonych w bazie - osobny temat (patrz UWAGI).
RUNDY: obrona 1/5 (zarzuty 1-4 zamkniete)
NASTEPNY KROK: Final Control - przeglad diffu econ-era-rebalance-test.cjs (poprawka obrony) i decyzja o dlugu testow.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA: (a) temat do zalozenia: naprawa 16-18 testow czerwonych w bazie (ekonomia-5x-inwariant 230/50 itd.), niezwiazanych z flaga. (b) runner ai-economy-measure-run.cjs nie zapisuje flagi bez --rebalance - rozwazyc odczyt z bundla. (c) Smoke w przegladarce wymaga powtorzenia przed deployem.
