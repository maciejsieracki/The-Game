STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-HUD-NET-SPICHLERZ-DRAIN-Q1
GOAL: HUD netto surowca odejmuje drenaż Spichlerza (Ceramika 77 -> 67), bez zmiany ekonomii.
ZMIANY/COMMIT: kandydat 8c105eccc35768d23bc6ac84ad2b82c21836ce07; merge-base --is-ancestor d425dd0a3 -> TAK. Diff vs baza: resource-gross-net.ts, main.ts, ui/hud.ts, tools/hud-net-building-drain-test.cjs, runs/<ID>/10 i 30 (6 plików, +414/-6). Wszystko w allowliście; brak gra/data, gra-robocza, WERSJE.md, rust-port.
TESTY (własny bieg w czystym worktree, npm ci --ignore-scripts): tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; hud-net-building-drain 36 ok/0 FAIL; resource-cards-gross-net 24/0 (M2 trafia); hud-shortage-alert-converter 17/0; resource-gross-net-converter-inputs 18/0; hud-resource-card-state 7/0; hud-resource-deficit-red 41/0; hud-gross-net-rest 820/0; hud-topbar-grid-gross-net 1150/0 (sekcja B pominięta, brak --dist: NIE ZMIERZONO); gross-net-numbers-only-unify 35/0; resource-card-numbers-only 14/0; ai-unit-replace-same-rules 45/0; ai-economy-measure-hook 23/23. Własna mutacja helpera (return rates -> return {}) => 31 ok/5 FAIL (wykryta).
OCENA ZARZUTÓW: 1 (regresja M2) ODDANY — literał netto przywrócony, test 24/0. 2 (brak testu behawioralnego main.ts) ODDANY w części: logika w helperze, mutacja helpera czerwona; sam main.ts to cienka delegacja (testy statyczne S) — UWAGA. 3 (tautologia H) ODDANY — H to prawdziwa mutacja kopii. 4 (brak biegu live) OTWARTE — NIE ZMIERZONO; dispatch dopuszcza dowód testem czystym, więc UWAGA, nie FAIL. 5 (kumulacja dryRun) ODDANY — helper kumuluje pulę (I.2, mutant I.M2).
BLOKADY: brak blokujących. Nie zmierzono: bieg dymny seed 4242 (Δstanu vs HUD netto), czerwony przed poprawką.
RUNDY: 2/5 (FC).
UWAGI-DLA-ORKIESTRATORA: dowód live Ceramiki do wykonania po deployu/na ROBOCZEJ; unit-replace-full-cost pre-existing FAIL nieuruchamiany (poza tematem; unit-replace-test 21/21 zielony).
NASTĘPNY KROK: integracja orkiestratora (merge, bramki), deploy na ROBOCZĄ po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
