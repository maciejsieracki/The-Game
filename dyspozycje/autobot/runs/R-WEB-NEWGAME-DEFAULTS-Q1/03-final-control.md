STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NEWGAME-DEFAULTS-Q1
GOAL: Nowe domyślne kreatora (tabela właściciela, CZĘŚĆ 2) z testami zgodnymi z nowymi wartościami; bramki zmierzone i zacommitowane.
ZMIANY/COMMIT: Oceniany ba19560b8 (kod 9c3d921db, testy b07859a16, raporty 49f2365e0/ba19560b8). Diff do 5ab3d58e2 mieści się w allowliście (newGameFlow.ts, newGameMapDefaults.ts, gra/tools, run); ui-params.json, main.ts, gra-robocza, WERSJE.md, rust-port bez zmian. Ten raport = osobny commit FC na ba19560b8.
WERDYKTY ZARZUTÓW (Evaluator):
1 battle-mode-choice-labels l.53-66: ODDAL (naprawione b07859a16; własny run PASS).
2 layout-reposition l.134-136: ODDAL (naprawione; expected wynika z selectedBattleMode l.106; PASS).
3 bramki/logi: ODDAL (gate-*.txt, po jednej linii EXIT=; nav 270/0, adv-tooltip 31/0, diplo 148, war-era 82, truce 30, barbarians 213/0, miasta-panstwa-wylaczone 55/0).
4 słaby test domyślnych: ODDAL (60 pass/0 fail; DOM siatki i Zaawansowane, brak suwaka Ziemi, window.__params, prefs, reset).
5 baseline ruch-swiata: ODDAL (poprawione 33/2; 2 FAIL = regex main.ts, pre-existing).
6 main.ts poza allowlistą: ODDAL jako ZAŁOŻENIE (main.ts ~:26059/:26747 battleAlwaysManual false i fallbacki krotki/niski/wysoki; kreator przekazuje advanced przez onStart; ścieżka startNewGame poza kreatorem, ewentualny osobny temat).
TESTY (własny pomiar FC na ba19560b8): tsc --noEmit EXIT=0; newgame-defaults 60/0; battle-mode-choice-labels PASS; newgame-settings-layout-reposition PASS; newgame-bottom-navigation 270/0; newgame-adv-tooltip 31/0; ruch-swiata-tempo 33/2 (pre-existing). git diff --check: tylko trailing whitespace w logu gate-ruch-swiata-tempo.txt (cytat wyjścia testu, kosmetyka).
NOTATKI: land-sea-ratio EXIT=124 (NIE_ZMIERZONO; test używa defaultLandFractionForTyp, niezmienionego dla Ziemi); sett-grid 6/8 pre-existing; gate-infra-vite-oom.txt to historia R1. Zrzuty evidence/ obecne w runie. gra/node_modules usunięty po etapie.
BLOKADY: brak
RUNDY: FC po R2/5
NASTĘPNY KROK: integracja orkiestratora. Temat webowy (gra/), rozłączny ścieżkowo z origin/rust-port/parity-v2 (44a3e9cc), kolejność względem parity-v2 dowolna; integrować do main (baza 5ab3d58e2 = origin/main). Uwaga na równoległe edycje newGameFlow.ts (MENU-REORDER, ADV-APPLY-BTN): merge, nie nadpisywanie.
DEPLOY/PUSH: NIE WYKONANO
