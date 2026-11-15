STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-CITY-VIEW-CHIPS-READABLE-MIN-12PX-Q1
GOAL: zetony widoku miasta min. 12 px; przy 1280-1366 px zawijanie do max 2 linii zamiast kurczenia; 1920 bez regresji.
ZMIANY/COMMIT: kandydat bc8b7fafe38685b85a82326e177d84243a0154c7 (kod a73149109 cityUxFrame.ts, test 52274ce01 city-view-layout-test.cjs, raporty). Wszystko w allowliscie. Potomek b97287c88 (tak); 8df0bc275 z dispatchu NIE jest przodkiem (zarzut 4, informacyjny). merge-tree z origin/main 392aa14c1 czysty (tree 98281b91d).
TESTY (surowe, ta runda): city-view-layout-test PASS=168 FAIL=0 (zetony 1920/2000: 25.0 px; 1600: 23.5/13.7; 1366: 16.2/16.2; 1280: 15.0/13.7 - wszystkie >= 12); --mutant PASS=164 FAIL=4; --mutant-min PASS=165 FAIL=3; tsc --noEmit exit 0; git diff --check czysty; left-banner-overflow-narrow-test PASS=74 FAIL=0; left-banner-chip-grid-clip, hud-topbar-one-row/layout-a/no-labels/grid-gross-net exit 0. hud-topbar-bigger-numbers-real-render-test exit 2 z powodu braku pliku bazowego hud.__base.ts (problem setupu, nie regresja). Zrzut 1366x768/big obejrzany: zetony zawiniete do 2 linii, brak nachodzenia na panele i pasek miasta. Chromium przez esbuild-fixture, nie pelny Vite i nie pelna gra w turze.
ZARZUTY: Z1 DO DECYZJI CZLOWIEKA (niska, interpretacyjna: normal 1280/1366 jedna linia, nic nie schodzi pod 12 px - spelnia kryterium). Z2 ODDAL (obrona dodala asercje wymagajaca zawiniecia przy big; limit 92 px uzasadniony zmierzonym top 84/76). Z3 ODDAL (dodany --mutant-min, czerwony). Z4 ODDAL (informacyjny). Zadnego NAPRAW.
BLOKADY: brak. Dlug bazowy poza zakresem: build-panel-ulepszenia-scroll-real-render-test G2b.
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora SHA bc8b7fafe38685b85a82326e177d84243a0154c7 (merge z origin/main czysty).
UWAGI-DLA-ORKIESTRATORA: symlink gra/node_modules w wf_49b458b2-768-3 do sprzatniecia; w -4 uzylem symlinku na node_modules z -2 (nieskomitowany). Decyzja wlasciciela otwarta: czy zawijac tez przy normal 1280/1366.
DEPLOY/PUSH: NIE WYKONANO
