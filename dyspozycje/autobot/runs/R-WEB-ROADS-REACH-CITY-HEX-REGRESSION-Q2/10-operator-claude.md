STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ROADS-REACH-CITY-HEX-REGRESSION-Q2
GOAL: droga miedzy miastami (auto-ulepszenia, AI, gracz) dochodzi do heksu miasta; rysowanie bez luki przy miescie.

ZMIANY/COMMIT: baza 4ac6654472fa97a046b4da9ffaf8ac5df90d75b9 (origin/main; ancestor potwierdzony przez git merge-base --is-ancestor). Commit z kodem i raportem: patrz pole sha.
- gra/src/game/auto-improvements.ts (roadPlanHexes): miasto, ktore ma krawedz w planie (plan.edges), dostaje swoj heks do planu drog. Przed poprawka plan.hexes nie zawieral heksow miast, wiec droga konczyla sie na heksie sasiednim i maska ramion renderera (computeRoadMask) nie rysowala ramienia do centrum.
- gra/tools/roads-reach-city-hex-test.cjs (NOWY): odtworzenie na realnych funkcjach (decideAITurn, pickAutoImprovements, planRoadNetwork, computeRoadMask), 100 tur, 6 przypadkow (ai i zrownowazone x 3 mapy). Asercje: (A) miasto z krawedzia ma droge na swoim heksie; (B) droga przy miescie ma ramie do centrum miasta; (C) ciaglosc przez heksy drog bez traktowania miast jako wezlow.
- gra/tools/roads-city-links-only-test.cjs (korekta asercji, bez zmiany wyniku planu): (1) test slepych koncow pomija heksy miast (koniec sieci przy miescie nie jest slepym koncem); (2) asercja liczby drog liczy heksy poza miastami (roadHexesNoCity <= planSize).
- planRoadNetwork (road-network-plan.ts), koszty, limity, ruch po drogach (map-road-movement) — BEZ ZMIAN.

TESTY (wyniki z surowego wyjscia):
- Reprodukcja PRZED poprawka (roads-reach-city-hex-test.cjs, wersja z B liczacym maske samego miasta): 12 OK / 12 FAIL. A i C czerwone w 6/6 przypadkow ("bez drogi: c0,c1,c2,c3,c4"); B bylo zielone, bo test B byl zbyt slaby i zostal zmieniony na ramie sasiada (patrz RUNDY). Pomiar koncowej wersji testu przed poprawka: NIE ZMIERZONO (mutacja ponizej mierzy te sama koncowa wersje).
- Po poprawce: roads-reach-city-hex-test.cjs 24 OK / 0 FAIL.
- Mutacja (kopia gra/src z cofnieta poprawka, RRC_SRC_DIR): 3 OK / 9 FAIL, czerwony zgodnie z wymaganiem.
- roads-city-links-only-test.cjs: po poprawce, przed korekta asercji: 45 OK / 12 FAIL (slepe konce 2-3; liczba drog 21>16 i 22>17 — skutek dolozenia heksow miast do drog). Po korekcie: 57 OK / 0 FAIL.
- tsc --noEmit -p gra: exit 0.
- Bramki referencyjne: logic-test 213/213 OK (rc 0); tech-tree-test rc 0; research-test PASSED 33 / FAILED 0; unit-replace-test rc 0 (wszystkie [OK]); combat-test rc 0 ("All sanity checks passed").
- load-game-regression-test: 34 PASS / 0 FAIL.
- map-road-movement-test: rc 0 (skrypt nie drukuje liczby).
- road-connectivity-test: 99 passed, 0 failed.
- road-build-player-parity-test: 17 OK, 0 FAIL.
- road-hook-mainguard-test: 19 passed, 0 failed.
- NIE ZMIERZONO: (d) zywy Chromium i zrzut 1280x720 — nie wykonano w tej rundzie. (f) rust-port — nie sprawdzano.

BLOKADY: brak. Punkt (d) trzeba wykonac w kolejnej rundzie albo po deployu ROBOCZA.

ROOT CAUSE (regres):
- Zrodlo: commit e5bb46741 (R-WEB-AI-ROADS-CITY-LINKS-ONLY-Q1). planRoadNetwork swiadomie pomija heksy miast ("miasto jest wezlem, nie droga"), a test (U) to utrwala. Kolejne commity nie zmieniaja tej zasady.
- Dlaczego istniejace testy nie zlapaly: roads-city-links-only-test.cjs (BFS po drogach i miastach) traktuje miasta jako wezly z gory polaczone, wiec luka "heks sasiedni -> miasto" nie jest widoczna. road-connectivity-test i road-build-player-parity-test nie sprawdzaja heksu miasta w planie automatu.
- Gracz (reczna budowa) dziala, bo roadAdjacencyOk / isRoadQualified dopuszcza heks miasta jako kandydata (sasiedztwo drogi lub miasta). Sciezka reczna nie korzysta z planu.
- Renderer: computeRoadMask liczy ramie tylko do sasiada z droga; heks miasta bez drogi nie ma ramienia, wiec pas wyglada na urwany. Renderer nie jest zrodlem bledu (reczna droga na heksie miasta rysuje sie poprawnie).
- Rozstrzygniecie: luka w danych automatu (brak drogi na heksie miasta), renderer bez zmian.

RUNDY: 1/5 (Operator R1). Asercja (B) zostala zmieniona po pierwszym przebiegu testu: maska samego miasta byla zawsze niezerowa przez sasiadow, wiec nie wykrywala objawu. Nowa (B) sprawdza ramie sasiada w strone miasta.

NASTEPNY KROK: Evaluator (SONNET) i Final Control. W FC: (1) uruchomic roads-reach-city-hex-test.cjs i roads-city-links-only-test.cjs; (2) ocenic korekte asercji w roads-city-links-only-test.cjs (uzasadniona czy osłabienie); (3) zywy Chromium (d), a jesli niewykonalne, NIE ZMIERZONO z uzasadnieniem; (4) lista testow deployu: roads-reach-city-hex-test.cjs, roads-city-links-only-test.cjs, road-connectivity-test.cjs, road-build-player-parity-test.cjs, road-hook-mainguard-test.cjs, map-road-movement-test.cjs, load-game-regression-test.cjs oraz 5 bramek referencyjnych.

UWAGI-DLA-ORKIESTRATORA:
- Dispatch 00-dispatch.md nie istnieje w origin/main (sciezka tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0); czytany z tej gałęzi.
- Znalezisko poza zakresem: roads-city-links-only-test.cjs jest slepy na luke "heks miasta bez drogi" (miasta jako wezly w BFS). Warto to uwzglednic przy kolejnych zmianach sieci drog.

DEPLOY/PUSH: NIE WYKONANO
