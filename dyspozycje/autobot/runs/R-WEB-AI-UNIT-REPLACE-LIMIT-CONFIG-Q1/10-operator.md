# Operator receipt — R-WEB-AI-UNIT-REPLACE-LIMIT-CONFIG-Q1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-AI-UNIT-REPLACE-LIMIT-CONFIG-Q1
GOAL: Przenieść istniejący limit zamian wojsk AI wynoszący 10% armii na turę do `ai-params.json`, zachowując wartość i zachowanie.
MODEL/EFFORT: gpt-6-luna / high
BAZA: `origin/main` = `d0ccc260edb35c952e6cd9eb5477cff02a4e2b3f`; `HEAD` przed zmianami = ten sam SHA. `git fetch origin main` potwierdził zgodność.
ZMIANY/COMMIT: Bez commita (Operator). Allowlista: `gra/data/ai-params.json` (nowy wpis 0.1), `gra/src/game/ai-unit-replace-plan.ts` (loader parametru z fallbackiem 0.1), `gra/src/main.ts` (podanie załadowanego udziału do istniejącego capu), `gra/tools/ai-unit-replace-same-rules-test.cjs` (regresje konfiguracji/fallbacku/wiringu), ten receipt.
TESTY: `cd gra && node tools/ai-unit-replace-same-rules-test.cjs` — EXIT 0, 44 passed / 0 failed. Assercje obejmują wartość JSON 0.1 i dotychczasowy cap, zastosowanie innej skonfigurowanej wartości oraz fallback 0.1 dla brakującej/niepoprawnej wartości.
BLOKADY: Brak. Bez zmian w `ai.ts`; bez wyboru nowego progu. Wcześniejsza stała 0.1 pozostaje wartością awaryjną dla brakującej lub niepoprawnej konfiguracji.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO
