STATUS: PASS (merge rundy 2/5, bez zmian merytorycznych)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ALLIANCE-SURCHARGE-D-SOFTEN-MEASURE-Q1
GOAL: Integracja z aktualnym origin/main (053406cec04d9fdce4d8ed612f62929d37ef7ba9) po konflikcie w gra/src/main.ts; zachowane obie zmiany (ALLIANCELIMIT i SURCHARGE).
ZMIANY/COMMIT: merge origin/main w bazie fae3b4561; konflikt w gra/src/main.ts rozwiązany ręcznie w 2 importach (zachowane: tick z aiAiMaxSojuszyNaCywilizacje, import ai-ai-alliance-limit, import setAiAiDopłataMnoznikForTest). Względem origin/main różnica to wyłącznie import i blok haku civTest dla mnożnika D. Commit: SHA w polu sha raportu zwrotnym.
TESTY: tsc --noEmit exit 0; logic-test LOGIC OK 213/213; tech-tree 20 pass 0 fail; research 33/0; unit-replace-archer-slinger 51 OK 0 FAIL (dispatch podawał 21; zmierzono 51); combat 6/6; ai-ai-alliance-tick 19/19 + mutanty 8/8; ai-ai-alliance-limit SUMMARY OK, mutanty 4/4 + wiring 4/4; ai-ai-alliance-surcharge ALL GREEN; ai-ai-treaty-evaluate 21 pass / 0 fail; diplomacy-zero-trust-unit 43/0.
BLOKADY: brak. Pomiarów nie ponawiano (zgodnie z dispatchem). NIE ZMIERZONO: wynik gry po merge (brak biegu runtime).
RUNDY: 2/5
NASTĘPNY KROK: Final Control rundy 2 na SHA merge.
DEPLOY/PUSH: NIE WYKONANO
