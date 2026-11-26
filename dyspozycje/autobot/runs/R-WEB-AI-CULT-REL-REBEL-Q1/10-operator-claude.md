STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-AI-CULT-REL-REBEL-Q1 (tag AICULTREBEL)
GOAL: wyjaśnić liczbami i kodem, dlaczego przy „Kultura i religia: trudny” miasta AI poniżej 14 % nie dostają rebelii; ZAMIERZONE / BŁĄD / NIE ROZSTRZYGNIĘTE. Tylko diagnoza, zero zmian reguł.
ZMIANY/COMMIT: hak odczytu w gra/src/main.ts (`cityStateTurn`, za ?civTest=1, bez zapisu do stanu gry) + dyspozycje/analizy/AI-KULTURA-RELIGIA-REBELIA-2026-11-26.md + ten raport. Baza 0e4790cd14dc0f83adc3da30aa641b8333a349b4 (origin/main). Commit: SHA w polu sha odpowiedzi.
TESTY:
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED: 33 / FAILED: 0 / TOTAL: 33
- combat-test: COMBAT TEST: 6/6 pass
- ai-test: ai-test: 297 passed, 0 failed
- society-breakdown-test: 56 OK, 0 FAIL
- ai-city-order-need-wiring-test: 231 passed, 0 failed (of 231)
- ai-unit-replace-same-rules: 45 passed, 0 failed
- Pomiar (poziom maksymalny, 60 tur, seed 4242 i 7): tabela w analizie. Rozbieżność: s4242 t60 149 miast AI (AICULTDIAG: 153); s7 zgadza się (149/75).
BLOKADY:
- Garnizon względem potrzebnego garnizonu: NIE ZMIERZONO (brak potrzeby w rekordzie tury; wymaga haka).
- Rebelia gracza w buncie skrajnym: NIE ROZSTRZYGNIĘTE (w obu biegach brak niezwolnionego miasta gracza w strefie krytycznej).
- Przyczyna rozjazdu s4242 po turze 50 względem AICULTDIAG: NIE ZBADANO.
- Wynik rozstrzygnięcia: kod działa zgodnie z zamierzeniem (bramka isHuman w main.ts:45137 i immunitet osiedla w main.ts:45118). Brak błędu w liczeniu łaski. Decyzja o rebelii dla AI wymaga właściciela, więc nie wdrażam poprawki.
RUNDY: 1/5; ostatni werdykt: brak (Operator); decyzja wymagana: TAK (czy miasta AI mają się buntować przy wyczerpanej łasce).
NASTĘPNY KROK: pytanie ABC do właściciela wg dyspozycji (A: zostawić / B: zezwolić na rebelię AI, z pomiarem na poziomie maksymalnym przed decyzją). Osobno, bez decyzji właściciela: opis „Bunt skrajny” w pasmach Porządku dla miast w immunitecie osiedla (rozjazd prezentacji).
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA:
- Dispatch podaje łaskę „po 3 turach”; dla hard obowiązuje 2 tury (society-params.json, porzadek_grace_tur_bunt.hard = 2). Próg hard = 14 %.
- Immunitet osiedla (populacja ≤ 4) zeruje łaskę dla 49/57 (s4242) i 55/75 (s7) krytycznych miast AI w t60; to główna przyczyna braku ostrzeżeń, nie bramka isHuman.
- Garnizon jest w tabeli rozkładu (65/149 i 59/149 miast AI ma 0 jednostek w t60), ale bez potrzeby w rekordzie nie da się go porównać.
