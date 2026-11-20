STATUS: BLOCK (częściowo: hak wykonany, testy live i dokument nie ukończone)
DOMAIN: GAME
TEMAT: R-WEB-VERIFY-LIVE-B2-CIVTEST-HOOK-AND-WIZARD-Q1
GOAL: hak civTest __settingsLive do startu gry przez realny doStartGame i odczytów ustawień; testy live przez kreator; uzupełnienie dokumentu WERYFIKACJA-NA-ZYWO.
ZMIANY-COMMIT: gra/src/main.ts (hak __settingsLive w bloku ?civTest=1 + importy); dyspozycje/analizy/WERYFIKACJA-NA-ZYWO-USTAWIENIA-2026-11-20.md (sekcja 6, same NIE ZMIERZONO); ten raport. Baza: d42ec85605bc26a8cba70adfc1696504acab6f48.
TESTY: node ./node_modules/typescript/bin/tsc --noEmit -> exit 0. Pozostałe bramki (logic 213, tech-tree 20, research 33, unit-replace 21, combat 6, testy verify-live, mutacje, test pinujący haki) NIE URUCHOMIONE w tej rundzie.
BLOKADY: (1) rozszerzenie 5 testów gra/tools/verify-live-*-test.cjs o scenariusz przez __settingsLive NIE wykonane; (2) brak uruchomienia Chromium na zbudowanej grze, więc brak surowych liczb; (3) utrzymanie Pieniądz bez odczytu na żywo (economy-upkeep.ts, funkcja nieeksportowana); (4) improvementWorkCost przyjmuje bazę z argumentu, nie mapuje terrain-improvements.json; (5) ryzyko pinów main-guard (TESTDEBTQ13) nie sprawdzone.
RUNDY: 1/5 (ostatni werdykt: brak; decyzja: kolejna runda Operatora na pozostałe punkty)
UWAGI-DLA-ORKIESTRATORA: pełny start kreatora z parametrem advanced.kosztJednostekPace wymaga NewGameParams (po starcie nie ma osobnego settera tempa); hak przyjmuje pełny NewGameParams.
NASTĘPNY KROK: runda 2 Operatora: build vite poza repo, scenariusz 5 testów przez __settingsLive, komplet bramek.
DEPLOY/PUSH: NIE WYKONANO
