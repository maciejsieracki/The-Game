STATUS: PASS
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-JEDNOSTKA-SPEC-REMOVE-Q1-20260924
GOAL: Całkowicie usunąć 18 pól spec_* z civ-matrix.json oraz ich konsumentów klasyfikacji, bez zmiany pozostałych danych.
ZMIANY/COMMIT: Allowlista: gra/data/civ-matrix.json, gra/src/game/civ-matrix-semantic.ts, gra/tools/civ-matrix-greece-test.cjs, gra/tools/civ-matrix-semantic-labels-test.cjs, ten raport i 01-evidence.json. Commit NIE WYKONANO; push/merge/deploy NIE WYKONANO.

WYKONANO:
- civ-matrix.json: paramDefs/defaults/params 15 cywilizacji zmienione z 109 do 91; usunięto dokładnie 18 wskazanych pól.
- Usunięto 270 komórek (18 pól × 15 cywilizacji); _meta.kolumny = 91.
- Wartości definicji, defaults i wszystkich pozostałych 91 parametrów dla wszystkich 15 cywilizacji są identyczne względem HEAD bdb439e3.
- civ-matrix-semantic.ts: usunięto BLOCKED_SPECIAL_UNIT_STAT, jego referencje i osobną listę HARMFUL zawierającą cztery z usuniętych pól. Zachowano BLOCKED_COMBAT_MULTIPLIER.
- Usunięto testową asercję spec_Obrona; zaktualizowano kontrakt 91 parametrów / 1365 komórek i pomiary statusów.

POMIAR KLASYFIKATORA:
- przed: 109 × 15 = 1635; REAL_GAMEPLAY 210, UI_ONLY 75, DECISION_REQUIRED 30, BLOCKED 525, DEAD_UNWIRED 375, UNWIRED 420.
- po: 91 × 15 = 1365; REAL_GAMEPLAY 210, UI_ONLY 75, DECISION_REQUIRED 30, BLOCKED 255, DEAD_UNWIRED 375, UNWIRED 420.

TESTY:
- node tools/civ-matrix-semantic-labels-test.cjs: PASS 233/233, FAIL 0.
- node tools/civ-matrix-greece-test.cjs: PASS 323/323, FAIL 0.
- node tools/civ-matrix-meta-roster-wiring-test.cjs: PASS 63/63, FAIL 0.
- npx tsc --noEmit: PASS, 0 błędów; TypeScript 5.9.3.
- git diff --check: CLEAN.
- aktywne odwołania do 18 ID i BLOCKED_SPECIAL_UNIT_STAT w gra/src oraz aktywnych gra/tools (*.ts/*.cjs), z wyłączeniem wskazanych starych bundle: 0.

BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: niezależny Evaluator, następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO
