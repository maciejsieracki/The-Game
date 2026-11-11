STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-IRON-STUD-ADJACENCY-Q1
GOAL: Naturalna stadnina na złożu konia bez zmian. Poza złożem (epoka Żelaza = 3+, odblokowany Koń: trasa LUB magazyn kon >= 50) stadnina tylko na BEZPOŚREDNIM sąsiedzie (6 kierunków) już ZBUDOWANEJ stadniny w terytorium gracza. Dystans 2 odrzucony, brak sąsiada odrzucony, kolejka tury nie liczy się jako istniejąca, obca stadnina nie wlicza się, stare zapisy zostają, tooltip/podświetlenie/AI zgodne z silnikiem.
ZMIANY/COMMIT: baza 261e736de (origin/main). Commit z kodem i raportem (SHA w polu sha orkiestratora). Allowlista:
  - gra/src/map/improvement-build.ts: nowe eksporty builtStudHexKeys(), hasBuiltOwnStudNeighbor(); createQualifier: migawka zbudowanych stadnin w chwili tworzenia kwalifikatora (AI: przed pętlą wyboru, więc własne kolejki automatu nie liczą się); 'stadnina' przekazuje sąsiedztwo; tekst powodu w getStadninaBuildBlockReason wspomina sąsiada.
  - gra/src/game/livestock-unlock.ts: isLivestockUnlockedForPlacement dostaje szósty argument adjacentBuiltStudOwn (domyślnie false); poza złożem bez sąsiada -> false.
  - gra/src/ui/hexContextTooltip.ts: nowe pole wejścia hasBuiltOwnStudNeighbor; bramka stadniny poza złożem wymaga sąsiada (ta sama reguła co silnik).
  - gra/src/main.ts: tooltip dostaje hasBuiltOwnStudNeighbor dla hexDetailHex; w commitBuildRequest po bramce kosztu 50 koni druga bramka sąsiedztwa (komunikat koni pierwszy).
  - gra/tools/stadnina-iron-adjacency-test.cjs (NOWY): 34 asercje, sześć kierunków, dystans 2, brak sąsiada, era/magazyn/trasa, kolejka tury, obca stadnina, złoże bez zmian, predykat, tooltip, stare zapisy.
  - gra/tools/* (legacy, zaktualizowane oczekiwania do nowej reguły; każda zmieniona asercja ma prefiks [R-WEB-IRON-STUD-ADJACENCY-Q1]): stadnina-early-eras-deposit-only-test, stadnina-early-eras-ai-picker-test, stadnina-hex-candidates-test, stadnina-kon-koszt-test, stadnina-kon-koszt-live-test (sekcje C/D: bez sąsiada NIE), stadnina-las-test, stadnina-konie-stare-zapisy-test, hex-tooltip-stadnina-kopalnia-cyny-test, hex-tooltip-mozliwe-ulepszenia-zloze-test (regex sygnatury + nowy parametr).
  Nie dotknięto: WERSJE.md, gra-robocza/**, dyspozycje/ poza tym raportem, gra/ poza wymienionymi plikami. Brak git add -A.
TESTY (liczby z surowego wyjścia):
  - tsc --noEmit (node ./node_modules/typescript/bin/tsc): exit 0 (przed i po przenosinie kontroli).
  - tools/stadnina-iron-adjacency-test.cjs: "=== stadnina-iron-adjacency: 34 OK, 0 FAIL ===", exit 0.
  - tools/stadnina-early-eras-deposit-only-test.cjs: exit 0 (po flipie oczekiwań).
  - tools/stadnina-early-eras-ai-picker-test.cjs: exit 0 (AI bez sąsiada: 0 stadnin poza złożem, era 3 i 4).
  - tools/stadnina-hex-candidates-test.cjs: exit 0.
  - tools/stadnina-kon-koszt-test.cjs: exit 0.
  - tools/stadnina-las-test.cjs: exit 0.
  - tools/stadnina-konie-stare-zapisy-test.cjs: exit 0.
  - tools/hex-tooltip-stadnina-kopalnia-cyny-test.cjs: exit 0.
  - tools/hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs: exit 0 (po poprawce regex sygnatury).
  - tools/hex-tooltip-improvement-production-text-test.cjs: exit 0.
  - tools/hex-tooltip-resources-line-dedup-test.cjs: exit 0.
  - tools/terrain-improve-farm-availability-test.cjs: exit 0.
  - tools/food-hodowla-test.cjs: "24 OK, 0 FAIL", exit 0.
  - tools/stadnina-kon-koszt-live-test.cjs (vite build + Chromium, lokalny build do dist-*): build OK; wszystkie asercje OK (w tym "PO próbie C bez sąsiedniej stadniny: NIE postawiona mimo magazynu 50", "PO próbie E: POSTAWIONA na złożu mimo magazynu 0"), "zero console.error / pageerror", exit 0.
  - tools/hex-tooltip-unlock-label-dedup-test.cjs: "27 passed, 1 failed" (Kamieniołom: brak "odblok."). Nie dotyka etykiet kamieniołomu; NIE_ZMIERZONO na bazie 261e736de (nie sprawdzono, czy padał przed zmianą).
  - git diff --check: exit 0 (po usunięciu białych znaków w jednej linii testu).
  - NIE_ZMIERZONO: pełny zestaw tools/*.cjs; tools/ai-stadnina-fort-realmap-sim.cjs; realne odjęcie 50 koni w przeglądarce PRZY sąsiedztwie (live test sprawdza tylko odmowę bez sąsiada); wizualne podświetlenie na mapie (nie uruchamiano przeglądarki z ręcznym ustawieniem sąsiada).
BLOKADY: brak blokad technicznych. Luki rozstrzygnięte ZAŁOŻENIEM (patrz niżej).
ZAŁOŻENIA (luki w dispatchu):
  Z1. Własność sąsiada = ten sam kanon co budowa gracza: isHexInPlayerTerritoryForState(sąsiad) (stadnina obca/wroga w terytorium innego właściciela nie wlicza się). Test (5) to potwierdza.
  Z2. Kolejka tury: gracz wyklucza heksy z pendingUndoKeys (`hex:stadnina`); AI używa migawki zbudowanych stadnin z chwili tworzenia kwalifikatora (przed własnymi wyborami tej tury), więc nie liczy własnych kolejek jako sąsiada.
  Z3. Stare zapisy: stadnina już postawiona poza złożem zostaje; kwalifikator jej nie usuwa i nie buduje dubla (test 9).
  Z4. Koszt 50 koni bez zmian; bramka sąsiedztwa jest po bramce kosztu, więc komunikat "Za mało koni" pojawia się pierwszy.
  Z5. Legacy testy z oczekiwaniem "poza złożem dozwolone przy magazynie 50" zmienione na "NIE bez sąsiada" (zmiana zachowania celowa, nie regresja). Dodatni przypadek (sąsiad obecny -> TAK) pokryty w nowym teście, także w sekcji C live testu nie mierzony w przeglądarce.
  Z6. Podświetlenie (highlight) idzie przez buildImprovementQualifier, więc jest spójne z silnikiem bez osobnej zmiany; tooltip dostaje flagę z main.ts dla hexDetailHex.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) na gałęzi/SHA operatora: weryfikacja allowlisty, przegląd logiki sąsiedztwa i własności (Z1, Z2), uruchomienie stadnina-iron-adjacency-test i stadnina-kon-koszt-live-test; decyzja o hex-tooltip-unlock-label-dedup (baza vs zmiana). Następnie Final Control i integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
