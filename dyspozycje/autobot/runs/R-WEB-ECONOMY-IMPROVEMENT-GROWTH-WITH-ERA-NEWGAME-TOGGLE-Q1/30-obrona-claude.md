STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-IMPROVEMENT-GROWTH-WITH-ERA-NEWGAME-TOGGLE-Q1
GOAL: ustawienie nowej gry „Wzrost surowców z epoką" (WYŁ. domyślnie = stałe wartości z Kamienia; WŁ. = dawny wzrost). Obrona kandydata f3d6919c9 (baza 3e978f882).
ZMIANY/COMMIT: gra/src/main.ts (import dwóch funkcji plonów + getter; parametr testowego hooka startNewGame; hook probeWzrostYields), gra/tools/improvement-growth-toggle-test.cjs (sekcja G8: piny okablowania), gra/tools/improvement-growth-live-test.cjs (NOWY: dowód żywego Chromium). Commit: SHA w polu sha orkiestratora.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ (dowód dostarczony). Żywy Chromium: gra/tools/improvement-growth-live-test.cjs, dwa realne starty przez __cityStateStartUnitsTestDebug.startNewGame -> doStartGame -> applyMenuParams.
   Surowy wynik: WYŁ. flaga=false farma 3/3/3, tartak 50/50/50; WŁ. flaga=true farma 3/4/5, tartak 50/75/113. WYNIK: 8 OK, 0 FAIL, exit 0.
   Zakres: odczyt przez probeWzrostYields() (te same funkcje co silnik, era jawna 1/2/3) w żywym bundlu z flagą z realnego startu. NIE ZMIERZONO: wartości na kafelku/HUD i w karcie widocznej dla gracza (nie czytano DOM).
2. PRZYJMUJĘ (częściowo pokryte). Start (applyMenuParams) jest pokryty żywym testem. migrateAdvanced i restoreGameFromSave NIE są wykonywane żywo (hook omija kreator i wczytanie zapisu). Dodano piny źródłowe G8 w improvement-growth-toggle-test.cjs: linia migrateAdvanced, linia applyMenuParams, linia odczytu z zapisu w restoreGameFromSave i wywołanie setWzrostSurowcowZEpoka w restore. Usunięcie każdej z nich czerwieni bramkę. NIE ZMIERZONO: żywego wczytania zapisu z polem WŁ.
   Uwaga procesowa: main.ts jest w allowliście tylko do przekazania ustawienia; dodany parametr hooka testowego i probe są w tym samym pliku, bez zmiany zachowania gry (hook dev, bez zmian w ścieżce startu).
3. PRZYJMUJĘ jako uwagę, bez zmiany kodu. Brak wpisu EN i pozycji w podsumowaniu kreatora — zgodnie z resztą ustawień (wiersz „Trafienia" też ich nie ma). Do decyzji właściciela, nie blokuje.

TESTY (surowe wyniki na tym commicie, cwd = worktree):
- tsc --noEmit: exit 0
- improvement-growth-toggle-test: 41 ok, 0 FAIL; mutanty M1-M4 czerwone
- improvement-growth-live-test (Chromium /usr/bin/google-chrome): 8 OK, 0 FAIL, exit 0
- logic-test: LOGIC OK (213/213), exit 0
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: 21 [OK], 0 FAIL; pozostałe unit-replace-*-test: exit 0
- combat-test: exit 0 (sanity checks passed)
- improvement-era-scaling-test: 144 PASS, 0 FAIL
- econ-era-rebalance-test: 38 ok, 0 FAIL
- era-improvement-cost-upkeep-test: 124 pass, 0 fail
- improvement-cost-owner-era-test: 49 pass, 0 fail
- NIE ZMIERZONO: fishing-boats-666 (znany czerwony na bazie, TEST-DEBT #37; nie uruchamiany w tej rundzie).

BLOKADY: brak. Zakaz zachowany: bez npm run build/dev (bundle vite poza repo, katalog tymczasowy usunięty), bez spawn/create/schedule, bez push, bez git add -A.
ZAŁOŻENIA: próbka jednostek w rekrutacji (po jednej z Kamień/Brąz/Żelazo) zgodnie z decyzją właściciela „tylko jednostki w rekrutacji"; przełącznik działa tylko przy rebalansie ON (jak w dispatchu).
RUNDY: 2/5 (obrona r1 po Evaluator r1)
NASTĘPNY KROK: Final Control: przegląd commita obrony (main.ts: parametr hooka i probe) oraz decyzja o wpisie EN (zarzut 3).
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: node_modules w gra/ zainstalowane przez npm ci --ignore-scripts (ignorowane przez git, nie commitowane); usunąć przy sprzątaniu worktree.
