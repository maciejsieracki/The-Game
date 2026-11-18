STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko testy i hooki civTest; logika gry bez zmian)
TEMAT: R-WEB-DIPLO-FORCED-PEACE-D2-HOOKS-Q1
GOAL: pomiar na zywo D2 / S / A (pokoj wymuszony), testy straznicy z mutantami, hooki tylko civTest.
ZMIANY-COMMIT: kandydat 7146283a9057efe3e452578ebd227f8ef2cba958 (potomek bazy f2d3d48aa, merge-base --is-ancestor OK). Diff vs baza: main.ts (+hak setPairWarAgeForTest, komentarze; logika bez zmian), diplo-forced-peace-d2-guard-test.cjs (G5c/G5d), diplo-forced-peace-d2-live-test.cjs, raporty 10/30. Wszystko w allowliscie. Uwaga: origin/main poszedl dalej (80c4e3625); integracja wymaga merge z aktualnym main (konflikt w main.ts nie sprawdzany).
TESTY (surowe, wlasne): tsc --noEmit EXIT 0; logic-test 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; d2-guard 9/9; forced-peace-pending 40/0; truce-impl 94 PASS/0; window-declutter 16/0. Live Chromium (build Vite poza repo, civSeed=4242): D2 PASS, S PASS, A PASS, EXIT 0, zero pageerror. Mutant S (main.ts:50633 Array.isArray(savedPendingPeace) -> false && ...): live EXIT 1, "po wczytaniu pending wraca" {"n":0} - mutant S czerwony, ZMIERZONO (plik przywrocony kopia, git status czysty). Mutant laczony A: tylko z raportu Obrony, nie powtarzany przeze mnie.
ZARZUTY: Z1 ODDAL (zmierzone przez Obrone, potwierdzone przeze mnie). Z2 ODDAL (Obrona zmierzyla mutant laczony). Z3 DO DECYZJI ORKIESTRATORA (poza zakresem). Zaden NAPRAW.
BLOKADY: brak
RUNDY: FC 1/5
NASTEPNY KROK: integracja orkiestratora kandydata 7146283a9 (merge z aktualnym main, ponowic guard + tsc).
DEPLOY-PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: mutant S2 (setTimeout showNextPendingForcedPeace) przezywa, sciezka redundantna; ekran powitalny (z-index 9650) zaslania okno pokoju; do sprzatniecia /tmp/claude-0/fcb, gra/node_modules w worktree.
