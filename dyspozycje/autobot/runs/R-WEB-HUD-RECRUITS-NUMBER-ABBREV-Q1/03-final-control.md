STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — HUD, prezentacja liczb
TEMAT: R-WEB-HUD-RECRUITS-NUMBER-ABBREV-Q1
GOAL: Etykieta „Rekruci" w HUD używa wspólnego skracania k/M (formatCompactNumber).
ZMIANY/COMMIT: weryfikowany 9ad5c8515 (baza f54fb5c18 = origin/main). Diff do allowlisty czysty: gra/src/ui/hud.ts, gra/tools/hud-recruits-abbrev-test.cjs, runs/<ID>/*. git diff --check OK. Brak zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, ai.ts, battle.
TESTY (samodzielnie, npm ci --ignore-scripts): tsc --noEmit EXIT=0; hud-recruits-abbrev-test OK EXIT=0 (999, 1k, 12,3k, 1,2M; tooltip Manpower z pełną wartością; tooltip Armia bez tys./mln); hud-number-abbrev-test OK. Mutacja (cofnięcie poprawki tooltipu Armia) -> FAIL, test wykrywa. node_modules usunięty.
ROZSTRZYGNIĘCIE ZARZUTÓW:
1. Tooltip Armia tys./mln: NAPRAWIONE w r2 (ODDAL jako zamknięte).
2. Znaczniki mapy/karty armii: ODDAL — liczby to małe całkowite (units.ts:6411, armyListHud.ts:137, armyStackHud.ts:351), brak formatManpower; nic do skracania.
3. test-red.txt z innej wersji testu: ODDAL — odtwarzalny RED to test-red-r2.txt.
4. Sześć testów HUD FAIL/timeout PRZED i PO: ODDAL — brak regresji, osobny dług (kandydat na osobny temat; NIE_ZMIERZONO przyczyny, regresji r2 nie powtarzano, zmiana to tylko tekst tooltipu).
Uwaga: pozostałe formatManpower (cityPanel, unitRecruitCard, empireDetailPanel, rekruciMaxLabel) poza allowlistą — osobny temat, jeśli właściciel chce spójności.
BLOKADY: brak
RUNDY: 2/5 (Final Control)
NASTĘPNY KROK: integracja orkiestratora; SHA do integracji 9ad5c8515 (kod) + commit tego raportu. Baza = origin/main f54fb5c18; względem origin/rust-port/parity-v2 (b520768b0) zmiana dotyczy wyłącznie gra/ (web), bez kolizji z plikami Rusta; integrować po obecnej kolejce webowej, parity-v2 nie wymaga zmian (REPIN HUD jeśli grafika Rust odwzorowuje chip Rekruci).
DEPLOY/PUSH: NIE WYKONANO
