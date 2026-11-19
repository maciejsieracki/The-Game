# R-WEB-AI-CITY-GARRISON-TESTS-REPLACE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS
DOMAIN: GAME (testy; zero zmian gra/src, gra/data)
TEMAT: R-WEB-AI-CITY-GARRISON-TESTS-REPLACE-Q1
GOAL: zastąpić 4 czerwone oryginalne asercje po FALI 857 (garnizon min. 1) nowymi scenariuszami z garnizonem.
ZMIANY/COMMIT: baza d425dd0a3. Zmienione: gra/tools/ai-home-defense-vs-barbarians-test.cjs (czerwone (b) z l.245 i l.333 zakomentowane; nowe bloki T2-NOWY, T4-NOWY), gra/tools/army-concentration-test.cjs (czerwone `< 10` l.382 i `<= 6` l.387 zastąpione asercjami garnizonów). Gra/src nietknięte. SHA: pole sha.
TESTY (liczby z surowego wyjścia):
- Baza, przed zmianą: ai-home-defense-vs-barbarians 50 passed / 2 failed (FAIL T2(b) l.245, FAIL T4(b) l.333: `jednostka dostaje jakąś komendę`). Przyczyna: jedyna jednostka miasta to garnizon, nie maszeruje; wcześniej asercja zakładała pustą wieżę.
- Baza army-concentration: 56 passed / 2 failed (FAIL scenario 4 `< 10`, FAIL scenario 4 ORYGINAL `<= 6`; klastrów=10 = 5 garnizonów + 5 obrońców domu osobno).
- Po zmianie: ai-home-defense-vs-barbarians 64 passed / 0 failed; army-concentration 58 passed / 0 failed.
- Mutacja A (garnizon usunięty z miasta w setupie): home-defense 48/4 (czerwone T2-NOWY(b), T4-NOWY(b), T2(b), T4(b)); army 57/1 (czerwone `kazde z 4 miast ... 3/4`).
- Mutacja B (src: getCityGarrisonUnitIds zwraca pusty zbiór, garnizon wchodzi do armii; kopia poza repo): home-defense 62/2 (czerwone T2-NOWY(c), T4-NOWY(c)); army 56/2 (czerwone `garnizon nie dostaje ruchu ... 37` i `1/4 stoi na heksie`).
- Gate: tsc --noEmit EXIT 0; logic-test PASS [213]; tech-tree 20/0; research 33/0; unit-replace-test 21/21; ai-unit-replace-same-rules 45/0; combat-test OK; ai-home-defense-civilian-filter 8/0; ai-war-city-garrison 21 PASS/0 FAIL; militia-garrison-contract 17 ok/0 fail; militia-garrison-router-siege 8 ok/0 fail.
BLOKADY: brak.
RUNDY: 1/5. Ostatni werdykt: n/d (Operator).
NASTĘPNY KROK: Evaluator (Sonnet) + Final Control; kontrola zamiany asercji (ORYGINAL(a) pozostaje zielone).
UWAGI-DLA-ORKIESTRATORA: (1) Scenariusz 4 nie mierzy scalania wolnych jednostek (wszystkie jednostki są garnizonem albo obrońcą); scalanie pokrywa scenariusz 1. (2) T2-ORYGINAL(a) i T4-ORYGINAL(a) zostały zielone i nie zmienione.
DEPLOY/PUSH: NIE WYKONANO
