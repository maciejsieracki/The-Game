# R-WEB-TEST-HOOK-PLAYTEST-MAPA-DIRTY-FORECAST-Q1 — Final Control (runda 2/5)

STATUS: PASS
DOMAIN: GAME (ścieżka testowa presetu `?playtest=mapa`; produkcja bez zmian)
TEMAT: R-WEB-TEST-HOOK-PLAYTEST-MAPA-DIRTY-FORECAST-Q1
GOAL: po starcie presetu `?playtest=mapa` prognoza bramki „Zakończ turę” jest dostępna w t1 tak jak w normalnej grze; tylko ścieżka presetu.
ZMIANY/COMMIT: kandydat f3bf2cc6775578883a6f972a12005057725ec9b2 (potomek bazy ff6d3a86634be6d7368bb79f77634e7121f1edcd: `git merge-base --is-ancestor` = tak). Diff vs baza: gra/src/main.ts +3 linie (komentarz + `markCityStateDirty();` w `doStartPlaytestMapaSwiata`, po pętli `cities.push(c)`, linia 49270), gra/tools/playtest-mapa-dirty-forecast-test.cjs, raport 10-operator-claude.md. Allowlista zachowana; brak zmian w gra-robocza, WERSJE.md, innych plikach src. `git diff --check` czysto. Uwaga: origin/main poszedł dalej (cc3c80b17, FALA 802); integracja = merge-tree f3bf2cc67 z aktualnym main (zmiana main.ts jest lokalna, ~49270, konflikt mało prawdopodobny).
ZARZUTY EVALUATORA/OBRONA: brak (lista pusta) — nic do NAPRAW / ODDAL / DO DECYZJI.
WERYFIKACJA WŁASNA (surowe wyniki):
  - Poprawna funkcja: `?playtest=mapa` -> `doStartPlaytestMapaSwiata` (main.ts 50957); wywołanie jest po `cities.push(c)` i przed `reapplyCityHexDecorHides()`/dalszym bootem. Wywołanie w `doStartPlaytestMiastoEkonomia` (49031, preset `?playtest=miasto`) zostaje — osobny preset, nieszkodliwe (wyłącznie flagi dirty).
  - tsc --noEmit: EXIT=0.
  - playtest-mapa-dirty-forecast-test: 10 pass / 0 fail. Mutant A (bez wywołania w Mapa): 7 pass / 3 fail (czerwone wyłącznie [doStartPlaytestMapaSwiata]). Mutant B (bez wywołania w Miasto): 7/3 (czerwone wyłącznie [doStartPlaytestMiastoEkonomia]). Mutacje na kopiach pliku.
  - Bramki referencyjne na kandydacie: logic-test 213/213; tech-tree-test 20/0; research-test 33/33 ALL GREEN; unit-replace-test 21/21; combat-test 6/6. Wszystkie EXIT=0, brak czerwonych (bazy nie trzeba porównywać).
  - DOWÓD LIVE (Chromium + xvfb, build poza repo przez vite, `?playtest=mapa&civTest=1`, odczyt `__nnsMeasureDebug.gateInfo()` w t1, próbkowanie po ~26 s od startu): kandydat — `forecast = {turn:1, skarbiecObecny:5000, skarbiecPo:4907, spichlerzObecny:0, spichlerzPo:-48}` (2 z 2 przebiegów); wariant bez poprawki (usunięta linia 49270, ten sam build) — `forecast = null` (2 z 2 przebiegów). Różnica odtwarzalna i zgodna z GOAL.
BLOKADY: brak.
UWAGI-DLA-ORKIESTRATORA:
  - Dowód live jest próbkowaniem czasowym (forecast pojawia się u kandydata po kilkunastu sekundach, u mutanta nie w tym oknie); nie mierzono, czy w mutancie prognoza pojawia się dopiero po pierwszej interakcji/odświeżeniu HUD. Wystarczy do GOAL.
  - K2 (kolejność zerowania empireEconDirty) poza zakresem, nieruszone.
  - `canEnd` w t1 u kandydata = false (bramka NNS blokuje przy spichlerzPo=-48 w tym presecie), u mutanta true (brak prognozy = brak blokady). To spodziewany skutek posiadania prognozy w t1 i zgodny z normalną grą; do wiadomości przy weryfikacji presetu w harnessach używających `playtest=mapa` (mogą wymagać dźwigni/obejścia bramki NNS).
RUNDY: 2/5 (r1 FC FAIL: poprawka w złej funkcji; r2 PASS)
NASTĘPNY KROK: integracja orkiestratora (merge f3bf2cc6775578883a6f972a12005057725ec9b2 do aktualnego main, bramki), bez deployu (zmiana tylko ścieżki testowej).
DEPLOY/PUSH: NIE WYKONANO
