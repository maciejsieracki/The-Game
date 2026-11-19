# Final Control — R-WEB-MEASURE-HARDER-RUNNER-LONG-RUN-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzędzia pomiarowe; zero zmian gra/src)
TEMAT: R-WEB-MEASURE-HARDER-RUNNER-LONG-RUN-Q1
GOAL: runner pomiaru dyplomacji ma autopilota gracza (--player-ai, domyślnie 1), akceptację pokoju wymuszonego i zamykanie blokad z jednego źródła; test wiązania runnera czerwienieje na mutacji.
ZMIANY/COMMIT: kandydat 4bafbc2344d3ad44d66a40fd6b2a04ff8346e0fb, baza de14a49a949a50fa2ae92f7a96a50bcef01c62bf. `git merge-base --is-ancestor` baza -> kandydat: OK. `git diff --name-only`: diplomacy-harder-measure-{run,analyze,hook-test}.cjs + 10-operator-claude.md + 30-obrona-claude.md, wszystko w allowliście, zero gra/src, zero WERSJE/manifest/gra-robocza.
TESTY (własne, na kandydacie; node_modules przez symlink do /home/user/meas/gra/node_modules):
- tsc --noEmit: 0 błędów (exit 0)
- logic-test 213/213; tech-tree 20/20; research 33/33; unit-replace 21/21; combat 6/6 (wszystkie exit 0)
- diplomacy-harder-measure-hook-test (--dist nieistniejący): A1–A8 + C1–C6 zielone, 14/0, exit 0; część B (przeglądarka) SKIP
- diplomacy-harder-measure-analyze --selftest 11/0; measure-forced-peace-test 13/13; measure-close-modals --selftest 5/5
- Własne mutanty runnerWired (poza C4–C6): `if (!PLAYER_AI)`, `!== '1'`, `if (false) await acceptForcedPeace` -> wszystkie wykryte (false); oryginał true.
Ocena zarzutów: (1) test C grep-owy — po poprawce strażnik jest strukturalny, mutanty `=== '0'`, `if (false)`, zakomentowany pokój wymuszony wykryte; zarzut ODDALONY jako rozwiązany. Pozostała granica: to nadal analiza tekstu, nie wykonanie — nieblokujące. (2) forcedPeaceAccepted=0 w biegach żywych — informacyjne, ścieżka pokryta modułem 13/13; wymaga długiego biegu.
NIE ZMIERZONO: część B hook-testu (bundle) i bieg żywy na kandydacie w tej rundzie; ostatni zmierzony wynik B 18/0 (r1 Evaluator) sprzed zmiany dotyczącej tylko sekcji C testu.
BLOKADY: brak
RUNDY: FC po rundzie 2/5
NASTĘPNY KROK: integracja orkiestratora (merge-tree, FF), następnie długi bieg 150 tur wg polecenia z 10-operator-claude.md; w nim sprawdzić forcedPeaceAccepted > 0.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: worktree FC nie ma gra/node_modules — użyto symlinku do /home/user/meas/gra/node_modules (nieśledzony).
