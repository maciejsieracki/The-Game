STATUS: PASS
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-ALL-113-EKONOMIA-R2
GOAL: Podpięcie 10 parametrów ekonomii macierzy cywilizacji do wspólnego obliczenia plonów oraz zgodność preview/end-turn/player path.
ZMIANY/COMMIT: gra/src/game/economy.ts; gra/src/game/turn-economy.ts; gra/src/ui/cityPanel.ts; gra/tools/civ-matrix-economy-wiring-test.cjs. Korekta: cityPanel przekazuje civKey do CityYieldContext, a mergeCityYieldContextForOwner utrzymuje owner key mimo opcjonalnych flag. Bez zmiany civ-matrix.json, ai_*, save schema. Commit/push/merge/deploy: NIE WYKONANO.
TESTY: PASS — node --check + node tools/civ-matrix-economy-wiring-test.cjs (15 cywilizacji × 10 parametrów, izolacja, unknown/neutral, +/-10%, owner parity, wykonywalny wynik city-panel z owner civKey, preview/end-turn/panel wiring); PASS — npm run typecheck -- --ignoreDeprecations 5.0; PASS — civ-matrix-greece-test.cjs (390/390); PASS — civ-matrix-semantic-labels-test.cjs (325/325); PASS — civ-matrix-difficulty-test.cjs (16/16); PASS — python3 -m json.tool gra/data/civ-matrix.json; PASS — git diff --check.
BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator / niezależny readback aktualnego worktree; po akceptacji osobna bramka integracji.
DEPLOY/PUSH: NIE WYKONANO
