STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-POLAR-FALLBACK-Q1
GOAL: AI w ekspansji nie zaklada miasta na heksie polarnym jako ostatni fallback.

Obrona R2 (odpowiedz na 4 zarzuty Evaluatora). Zmiana kodu `ai.ts` bez zmian wzgledem R1.

1. PRZYJMUJE (czesciowo). Zmierzono nowe pomiary, patrz `gate-live-measure-r2.txt`.
   - Sim silnikowy 100 tur (PRE `ai.ts` z 57cc8aded vs POST z 81a8e76a7, Kontynenty+Pangea 4242 i Pangea 1001): T50 i T100 identyczne PRE=POST (0%).
   - Zywa gra, bieg bazowy bez poprawki: Pangea 4242 T51 = 83 (POST 83), Kontynenty 4242 T51 = 87 (POST 78).
   - Rozjazd 87 vs 78 (-10,3%) nie pochodzi z poprawki: gałąź `null` nie odpalila w zadnym z tych biegow (0 logow polar-null). To szum zywej gry.
   - NIE_ZMIERZONO: T100 w zywej grze (ok. 35+ min na bieg T50). Zastapiony sim silnikowym T100. Sim ma atrapy ekonomii i nie wchodzi w sciezke polar-null, wiec dowodzi tylko braku regresji w sciezkach niepolarnych.
2. PRZYJMUJE i naprawiam dowodem. Powtorzony bieg Pangea 1001 po poprawce (bieg B): 0 miast AI na polarnym, polar-null w tych samych turach (25,26,27,29,30,31). Miasta AI T31: 56 (bieg A: 60, bez poprawki: 59). Rozrzut 56..60 miedzy biegami tej samej konfiguracji przewyzsza roznice PRE/POST, wiec "regresja 59->60" nie jest sygnalem. Wybor `null` zamiast rozszerzenia opiera sie na diagnozie (zasieg nie jest za waski: 234 heksow w zasiegu, wszystkie ponizej progu, max -5,76).
3. ODRZUCAM jako zarzut do zmiany, ale uzupelniam. Dowod zywy z patchowanego bundla jest ograniczeniem wynikajacym z zakazu `npm run build` w `gra/`. Patche sa w runie (`live-diag-patch.py.txt`, `live-post-patch.py.txt`). Niezalezna weryfikacja bez bundla: nowy test jednostkowy z mutacja (stary `ai.ts` = 3 FAIL, nowy 0 FAIL) wywoluje realne `planCityFounding` ze zrodla.
4. PRZYJMUJE. Usunieto martwe aliasy OPTS2, `Number(10)`, MIN_HI i nieuzywane importy w `gra/tools/ai-polar-fallback-test.cjs`. Test 8/8. Zastrzezenie: `ai-avoid-polar-sim-test` (founded=0) nie cwiczy sciezki ekspansji. Sciezke pokrywaja F1, F2, F4, F5 nowego testu. Tamtego testu nie zmieniam (zmiana niepotrzebna).

TESTY: `gate-tsc-r2.txt` tsc --noEmit EXIT=0 bez bledow; `gate-polar-fb-test-r2.txt` 8/8; `ai-avoid-polar-pick-test` 16/16.
BLOKADY: brak
RUNDY: 2/5
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
