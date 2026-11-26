STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1
GOAL: trzy poziomy rzek wyraźnie różne i grubsze (main>medium>tributary), dowód wizualny PRZED/PO 2x/4x/8x i pomiar pikseli.
ZMIANY/COMMIT: kandydat 9c5ca3437 (potomek 690947a2a: merge-base --is-ancestor = tak). diff --stat vs baza: 5 plików, +97/-10 (scene.ts, river-render-levels-test.cjs, MAPA-RZEKI-SPEC.md, 10-operator, 30-obrona). Allowlista zachowana; gra/src/map, gra/data, WERSJE.md nietknięte.
Kod: medium = 0,7 x main, tributary/short = 0,45; hierarchia i medium >= tributary+0,1 (min medium 0,595).
TESTY (własne, na 9c5ca3437, surowe wyniki): tsc exit 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-test 297/0; river-fog-visibility 31/0; river-render-levels 19 OK/0 FAIL. Mutacja (tributary=0,7*0,45 w scene.ts): 18 OK/1 FAIL, scene.ts przywrócony.
OCENA ZARZUTÓW: 1 (brak dowodu wizualnego) — SŁUSZNY, nienaprawiony; R-PROC-AUTOBOT §9 pkt 6: temat wizualny bez zrzutu z żywego Chromium = FAIL; dyspozycja wymaga też pomiaru pikseli i FPS; dyspozycje/analizy/rzeki-render-r3a/ nie istnieje. 2 (spec 50%) — naprawione w 9c5ca3437. 3 (nazwa asercji) — naprawione.
BLOKADY: brak zrzutów PRZED/PO 2x/4x/8x, pomiaru pikseli per poziom, FPS 5x20 s, oceny czytelności (czy rzeki nie zasłaniają miast) — NIE ZMIERZONO. Chromium dostępny w /opt/pw-browsers.
RUNDY: 2/5 zużyte (FC po obronie r2). Werdykt: FAIL.
NASTĘPNY KROK: runda 3 do tego samego ID: zbudować rivers-live-measure.cjs (build poza repo, baza 690947a2a vs 9c5ca3437), zrzuty + piksele + FPS + pageErrors; potem Evaluator/FC. Kod i testy nie wymagają zmian. DECISION_REQUIRED tylko gdy zrzuty pokażą zasłanianie miast.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: bramki kodowe zielone; jedyny brak to dowód wizualny.
