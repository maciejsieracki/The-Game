STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ERA-WAR-DELAYS-Q1
GOAL: Odpowiedź Operatora na zarzuty Evaluatora/FC (PASS-WITH-NOTES, baza kodu 2e37619e5, raport 6d29edf33).
ZMIANY/COMMIT: poprawka wyłącznie komentarzy: gra/src/game/forced-war-bronze.ts, gra/src/game/forced-war-iron.ts. Zero zmian logiki i wartości stałych. Commit: patrz SHA w raporcie orkiestratora (bez push).

ODPOWIEDZI NA ZARZUTY:
1. Stare komentarze „25 tur" (forced-war-bronze.ts ~82-83, forced-war-iron.ts ~29, 117, 126) — PRZYJMUJĘ. Poprawka: komentarze podają aktualną wartość 20 (z JSON); „25" zostaje wyłącznie jako cytat historyczny z decyzji z 2026-09. Dowód: git diff 6d29edf33..HEAD -- gra/src/game/forced-war-*.ts (tylko linie komentarzy).
2. Headless flow F1/F2 w era-war-delays-test.cjs używa lokalnej reimplementacji filterPoolBeforeR1, a nie main.ts; regex statyczny nie pokrywa realnej pętli main.ts — PRZYJMUJĘ jako znaną lukę. Nie naprawiam w tej rundzie: wymagałoby eksportu logiki z main.ts, poza allowlistą tego tematu. Dowód w grze: NIE_ZMIERZONO. Do decyzji orkiestratora: dług testowy na pętlę main.ts albo wydzielenie filtra do modułu testowalnego.
3. warAllInContextFor (main.ts 33409-33418) blokuje marsz AI przed turą 40 przy flagach ON — PRZYJMUJĘ jako potwierdzone. Sprawdzone: linie 33417-33418 zwracają undefined dla cywilizacji AI, gdy !isInterCivWarOpenAtTurn(turn), niezależnie od tagu epoki. Nie zmieniam: poza allowlistą (zarzut FC) i wymaga decyzji właściciela, czy marsz wojny epoki Brązu/Żelaza przed turą 40 ma być odblokowany. Wojna wybucha; marsz startuje od tury 40. Rekomendacja: osobny temat po decyzji właściciela.

TESTY (po poprawce; node_modules przez npm ci):
- tsc --noEmit: 0 błędów (exit 0)
- era-war-delays-test.cjs: 41 OK / 0 FAIL
- forced-war-bronze-test.cjs: ALL GREEN
- forced-war-iron-test.cjs: 55/55 PASSED
- forced-war-reguly-multi-turn-simulation-test.cjs: ALL GREEN
- war-rules-multiwar-main-guard-test.cjs: 21 PASS / 0 FAIL
- logic-test.cjs: LOGIC OK (213/213)
- ai-test.cjs: 274 passed / 20 failed (= baza origin/main a8823b16b)
- Dowód w grze (pełna pętla main.ts, Chromium): NIE_ZMIERZONO

BLOKADY: brak blokad kodu. Otwarte do decyzji orkiestratora: punkt 2 (dowód pętli main.ts) i punkt 3 (marsz przed turą 40).
RUNDY: 2/5 (odpowiedź na zarzuty r1)
NASTĘPNY KROK: Evaluator (Sonnet) i Final Control (Sonnet) na commicie poprawkowym; decyzja właściciela w punkcie 3.
DEPLOY/PUSH: NIE WYKONANO
