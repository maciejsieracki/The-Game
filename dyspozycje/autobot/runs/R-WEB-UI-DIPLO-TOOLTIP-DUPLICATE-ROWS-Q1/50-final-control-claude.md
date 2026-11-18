STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-UI-DIPLO-TOOLTIP-DUPLICATE-ROWS-Q1
GOAL: tooltip bilansu okna traktatu zawiera wiersz D i podzial PW co najwyzej raz.
ZMIANY/COMMIT: kandydat 0d27ffcd9dc5c88b9f359345fade8875fe9abcb0 (baza db29c24d1a1070411035fd21139312a381fd7c43 jest przodkiem: merge-base --is-ancestor OK). git diff --stat: 3 pliki, +160/-4: gra/src/ui/diplomacyTipText.ts (+9/-4, plainTextWithTitles pomija title zawarty w tekscie elementu i deduplikuje tytuly), gra/tools/diplo-tooltip-duplicate-rows-test.cjs (nowy, 126 linii, bez unlink/rmSync), raport Operatora w runs/<ID>/. Allowlista zachowana (brak zmian treaty-payment, ai*, main, JSON, WERSJE.md). git diff --check czysty.
TESTY (wlasne uruchomienie na 0d27ffcd9, npm ci --ignore-scripts w gra/): tsc --noEmit exit 0; logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; diplo-forced-peace-window-declutter-test PASS=16 FAIL=0; diplo-deal-boards-declutter-tooltips-test 13 pass 0 fail; nowy diplo-tooltip-duplicate-rows-test 6 PASS / 0 FAIL (T1 D==1, T2 podzial==1, U1-U3 jednostkowe, M mutacja starej funkcji -> D==2 i podzial==2, czyli test czerwieje na regresji). Zywy Chromium (opcjonalny): NIE ZMIERZONO.
Zarzuty Evaluatora: brak. Obrona: brak. Ocena zmiany: poprawka minimalna, w przyczynie zmierzonej (plainTextWithTitles); tytul innej tresci zostaje (U1), wiec nie ginie informacja. Ryzyko uboczne: .includes() na tekscie dla bardzo krotkich tytulow moze pominac tytul bedacy podciagiem tekstu - uwaga, nie wada blokujaca.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora (kod 3206b38ec, build poza repo, deploy na ROBOCZA po osobnej autoryzacji).
UWAGI-DLA-ORKIESTRATORA: brak poza ww. uwaga o podciagu.
DEPLOY/PUSH: NIE WYKONANO
