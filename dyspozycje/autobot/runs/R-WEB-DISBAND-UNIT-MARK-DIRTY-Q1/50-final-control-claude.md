STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DISBAND-UNIT-MARK-DIRTY-Q1
GOAL: po disbandPlayerUnit prognoza ekonomii (tooltip + bramka "Zakończ turę") przeliczana natychmiast (markCityStateDirty po units.splice, przed refreshD1bHud).
ZMIANY/COMMIT: kandydat 1698a9213 (potomek bazy 6e72c3c17, merge-base --is-ancestor OK). Diff vs baza: gra/src/main.ts +4 (3 linie komentarza PL/EN + markCityStateDirty() w disbandPlayerUnit po splice, przed refreshD1bHud/showHint), gra/tools/disband-unit-mark-dirty-test.cjs (nowy), runs/<ID>/10-operator, 30-obrona. Allowlista zachowana. integration_sha = 1698a9213 (plus ten raport w osobnym commicie raportowym).
ROZSTRZYGNIECIE ZARZUTOW:
- Z1 (test statyczny): ODDAL. disbandPlayerUnit żyje w zamknięciu boot() (DOM, brak eksportu/haka); scenariusz wykonawczy w Node niemożliwy bez zmiany architektury/zakazanego builda. Fałszywa zieleń przy zakomentowaniu naprawiona (test usuwa komentarze //). Zmierzone przeze mnie: zakomentowanie linii -> 3 passed/3 failed; usunięcie linii -> 3/3 failed; stan kandydata 6/0 EXIT 0. Dowód mutacyjny spełniony. Uwaga: brak testu wykonawczego = ograniczenie, do ewentualnego osobnego tematu (hak selekcji + runner live).
- Z2 (duplikat komentarza): zamknięty przez Obronę; diff main.ts to 4 linie, brak duplikatu.
- Z3 (live Chromium): NIE_ZMIERZONO (brak haka selekcji jednostki, zakaz build/dev w gra/); dispatch dopuszcza to ("jeśli możliwe"). Pokrycie: test statyczny + analiza ścieżki (nnsGateForPlayer -> dirty-gated refreshLiveEmpireRates).
Zero zarzutów NAPRAW.
TESTY (surowe wyjścia, worktree na 1698a9213, npm ci --ignore-scripts): tsc --noEmit EXIT 0; disband-unit-mark-dirty-test 6 passed, 0 failed; logic-test LOGIC OK (213/213); tech-tree-test 20 pass, 0 fail; research-test PASSED 33 / FAILED 0; unit-replace-test 21/21 zielone; combat-test 6/6 pass; git diff --check vs baza czysty. Wszystkie 5 bramek zielone, brak czerwonych wymagających porównania z bazą.
BLOKADY: brak. Znane: Z1/Z3 jako ograniczenia.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora 1698a9213 -> READY_FOR_DEPLOY (kod gry w main.ts -> deploy ROBOCZA po integracji).
UWAGI-DLA-ORKIESTRATORA: (1) inne usunięcia jednostek gracza poza disbandPlayerUnit (kapitulacja miasta main.ts ~18432, głód/zniszczenia w pętli tury ~40166/40383/40701) nie weryfikowane pod kątem dirty — poza zakresem, leżą w ścieżkach tury/miasta (prawdopodobnie dirty gdzie indziej); możliwy osobny audyt. (2) Test wykonawczy wymagałby haka selekcji/disband w window.__test.
DEPLOY/PUSH: NIE WYKONANO
