STATUS: PASS
DOMAIN: GAME (WEB)
TEMAT: R-WEB-TEST-DEBT-REGRESSION-A-CODE-Q1
GOAL: Rozstrzygnac, czy czerwone testy klasy A to regresja kodu czy nieaktualny test, i naprawic wlasciwa strone.

ZMIANY/COMMIT: Operator d4340b0487cab325bb5f65cfbda6c72134ebeaeb (baza origin/main 16c0509f6, 1 commit). Allowlista potwierdzona: 4x gra/tools/*-test.cjs + 01-operator-r1.md; zero zmian w gra/src, gra-robocza, WERSJE.md, rust-port. git diff --check czysty.
ZARZUTY: brak (Evaluator: PASS, zarzuty=[]). Obrona: null.

WERYFIKACJA WLASNA (d4340b048, npm ci, 1 przebieg):
- web-memory-leaks: 69 passed, 0 failed (asercje zastapione regula anty-wyciekowa a-d, nieoslabione)
- merge-decor-no-regress: 49 pass, 0 fail (scene.ts:1628 setOpaqueSort -> no-op w atrapie)
- mgla-odkrycie-wzdluz-sciezki: 17 pass, 0 fail
- fort-outpost-hard-territory: 80 passed, 0 failed (main.ts:41235 sweepFortCaptures nadal bezwarunkowo po flushAiCityRenderBatch)
- tsc --noEmit: EXIT 0. logic-test/ai-test: nie powtarzane (zmieniono wylacznie testy; wynik Operatora 213/213 i 274/20 przyjety).
Werdykt: TEST-NIEAKTUALNY w 4/4 przypadkach, brak regresji kodu.

BLOKADY: brak. node_modules usuniete, drzewo czyste.
RUNDY: 1/5
KOLEJNOSC INTEGRACJI: d4340b048 jest bezposrednim potomkiem origin/main 16c0509f6 -> fast-forward na main. Wzgledem origin/rust-port/parity-v2 (783c6b766, osobna linia): niezalezne; integrowac najpierw na main. Uwaga: parity-v2 zmienia tez fort-outpost-hard-territory-test.cjs i web-memory-leaks-test.cjs, wiec przy przyszlym scalaniu main->parity-v2 mozliwy konflikt w tych 2 plikach.
NASTEPNY KROK: integracja orkiestratora (ff na main), potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
