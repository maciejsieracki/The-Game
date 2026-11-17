# R-WEB-TEST-HOOK-PLAYTEST-MAPA-DIRTY-FORECAST-Q1 — raport Operatora (runda 2/5 wg dispatchu, baza ff6d3a866)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME/test (preset testowy playtest=mapa)
TEMAT: R-WEB-TEST-HOOK-PLAYTEST-MAPA-DIRTY-FORECAST-Q1
GOAL: po starcie presetu `?playtest=mapa` prognoza bramki „Zakończ turę” jest dostępna w t1; tylko ścieżka presetu, produkcja bez zmian.
ZMIANY-COMMIT: SHA kodu/raportu: patrz sekcja „Commit” niżej (commit tworzony po tym raporcie).
  - gra/src/main.ts: +3 linie — `markCityStateDirty();` w `doStartPlaytestMapaSwiata` (boot, ~l.49268) PO pętli `cities.push(c)`, PRZED `reapplyCityHexDecorHides()`. Wywołanie w `doStartPlaytestMiastoEkonomia` (K1 z r1) ZOSTAJE — ten sam wzorzec, osobny preset testowy (zgodnie z zaleceniem FC r1, założenie).
  - gra/tools/playtest-mapa-dirty-forecast-test.cjs: test przepisany — sprawdza OBIE funkcje osobno (push → markCityStateDirty po nim, dokładnie jedno wywołanie w ciele, przed startRenderLoop jeśli występuje).
  - dyspozycje/autobot/runs/R-WEB-TEST-HOOK-PLAYTEST-MAPA-DIRTY-FORECAST-Q1/10-operator-claude.md (ten plik).
  Allowlista zachowana. `git diff --check` czysto. Brak zmian w gra-robocza, WERSJE.md.
TESTY (zmierzone w tej rundzie, surowe wyjście):
  - `node tools/playtest-mapa-dirty-forecast-test.cjs` (na kodzie po poprawce): 10 pass, 0 fail, EXIT=0.
  - Mutant A (usunięte markCityStateDirty w doStartPlaytestMapaSwiata): 7 pass, 3 fail, EXIT=1; czerwone: `[doStartPlaytestMapaSwiata] markCityStateDirty() po cities.push`, `... przed startRenderLoop()`, `... dokładnie jedno ... liczba=0`; wynik dla miasto bez zmian (PASS).
  - Mutant B (usunięte w doStartPlaytestMiastoEkonomia): 7 pass, 3 fail, EXIT=1; czerwone wyłącznie w funkcji miasto.
  - `npm ci --ignore-scripts` (gra/): exit 0 (ostrzeżenia audytu npm, bez wpływu).
  - `node ./node_modules/typescript/bin/tsc --noEmit`: EXIT=0.
  - logic-test: `LOGIC OK (213/213)`, EXIT=0.
  - tech-tree-test: `tech-tree-test: 20 pass, 0 fail`, EXIT=0.
  - research-test: `ALL GREEN`, EXIT=0.
  - unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`, EXIT=0.
  - combat-test: `All sanity checks passed.`, EXIT=0.
  - Dowód live (Chromium/xvfb, t1 prognoza PRZED/PO): NIE ZMIERZONO — nie zbudowano wersji poza repo i nie uruchomiono przeglądarki w tej rundzie (wymagałoby osobnego buildu vite + Chromium; pominięte, dowód statyczny i mutacyjny jak wyżej). Skutek: brak potwierdzenia runtime, że prognoza pojawia się w t1.
BLOKADY: brak blokad procesowych. Dowód live nie wykonany (patrz wyżej).
RUNDY: 2/5 (runda Operatora zgodnie z dispatchem; poprawki FC r1 wykonane pod tym samym ID)
ZAŁOŻENIA:
  - Zostawiono markCityStateDirty w doStartPlaytestMiastoEkonomia (rekomendacja FC r1).
  - Pozycja w doStartPlaytestMapaSwiata: po pętli dokładania miast, przed przeliczeniem prognozy w t1 (zgodnie z dispatchem).
UWAGI-DLA-ORKIESTRATORA:
  - Dispatch wskazywał w gałęzi `origin/main` brak pliku 00-dispatch.md w tej ścieżce; dispatch odczytano z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (zgodnie z DODATKIEM).
  - Plik 10-operator-claude.md utworzono w katalogu runu (w bazie były 30-obrona-claude.md i 50-final-control-claude.md).
  - Nie wykonano dowodu live; rekomendacja: przy FC uruchomić `?playtest=mapa` w Chromium albo zaakceptować NIE ZMIERZONO.
NASTĘPNY KROK: Evaluator (bramki statyczne i diff), potem Final Control. Integracja wyłącznie po FC przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
