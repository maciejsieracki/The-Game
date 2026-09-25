STATUS: PASS
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-ALL-113-WEALTH-R2
GOAL: Podlaczyc wealth_cap_proc i wealth_mnoznik_proc do realnej sciezki player/AI/city-state bez zmiany danych macierzy.
ZMIANY/COMMIT: gra/src/game/wealth.ts; gra/src/game/turn-economy.ts; gra/src/ui/cityPanel.ts; gra/tools/wealth-civ-matrix-wiring-test.cjs; brak commitu
TESTY: npm run typecheck PASS; node tools/wealth-civ-matrix-wiring-test.cjs PASS (15 cywilizacji, unknown/neutral, +/-10%, live/preview/UI parity); node tools/wealth-test.cjs PASS (36/36); node tools/population-civ-matrix-wiring-test.cjs PASS (122/122); node tools/wire-ekonomia-test.cjs PASS (37/37); git diff --check PASS
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Evaluator readback na tym samym worktree; bez push/merge/deploy.
DEPLOY/PUSH: NIE WYKONANO
