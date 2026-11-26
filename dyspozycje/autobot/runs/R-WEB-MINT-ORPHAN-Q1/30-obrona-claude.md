STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MINT-ORPHAN-Q1 (MINTORPHAN #162, odp. 17) — obrona Operatora, runda 2/5
GOAL: Osierocona Mennica poza stolicą nieaktywna i nie znika; po ukończeniu nowej w stolicy stare znikają; powrót stolicy reaktywuje nie wyburzoną; Mennica tylko w stolicy. Wyburzenie: patrz zarzut 1 (zakres).
BAZA: 981009eda38e7d74ce0e655a64ab153e1be1c95b (kandydat z rundy 1), poprawki w tej rundzie w commicie na gałęzi detached.

ZMIANY/COMMIT:
- gra/src/game/mennica-orphan.ts: nowa funkcja applyMennicaCompletedInCapital (guard: ukończony budynek = mennica i ukończone miasto = stolica właściciela; usuwa Mennice z pozostałych miast tego właściciela; mutuje mapę budynków; zwraca listę usuniętych miast). Hook z main.ts i test używają tej samej funkcji.
- gra/src/main.ts: hook w applyProductionCompleted zredukowany do wywołania applyMennicaCompletedInCapital(cities, cityBuilt, city.ownerId, completed.id, cityId, capitalCityIdForOwner(city.ownerId)) + komunikat showHintMessage i updateHud dla zwróconej listy. Usunięty lokalny import mennicaCityIdsReplacedByCapital/builtWithoutMennica.
- gra/tools/mint-orphan-test.cjs: applyCompletion w teście wywołuje TEN SAM helper (nie własną kopię logiki); dodane przypadki (6) i (6b) dla guardu stolicy w helperze; okablowanie main.ts sprawdzane regexem na wywołanie helpera z capitalCityIdForOwner.
- Commit: patrz SHA w polu sha wyniku (commit z tym raportem).

ODPOWIEDZI NA ZARZUTY EVALUATORA:
1. (Wyburzenie) PRZYJMUJĘ. Potwierdzam: w grze nie ma akcji wyburzenia budynku (brak przycisku, brak funkcji usuwania z city.built). Tej rundy NIE dodaję UI wyburzenia: wymaga decyzji właściciela o zwrocie surowców i o tym, gdzie przycisk się pojawia (panel miasta), a to jest nowy feature z wpływem na grę. Pozostaje czysty helper demolishBuildingIds (testowany). PROPOZYCJA ZAKRESU dla orkiestratora: wyburzenie wydzielić jako osobny temat z pytaniem ABC do właściciela (zwrot: brak/częściowy) — nie zamykam kryterium (2) w tej rundzie.
2. (Hook niewykonywany przez test) PRZYJMUJĘ i naprawiam: logika hooka przeniesiona do czystej funkcji applyMennicaCompletedInCapital, którą wywołuje main.ts i którą testuje mint-orphan-test.cjs. Usunięta własna kopia logiki w teście. Dowód: test 28 PASS / 0 FAIL. Mutacja guardu w helperze (capitalCityId === null zamiast pełnego warunku) -> FAIL (6) i (6b) (wynik surowy w tej rundzie: "26 PASS / 2 FAIL"), po przywróceniu 28/0. Sam wiring w main.ts nadal sprawdzany regexem + tsc (brak uruchomienia gry) — NIE ZMIERZONO live.
3. (Scenariusz na symulacji) PRZYJMUJĘ w części: scenariusze 3–5 używają teraz prawdziwej funkcji usuwania (helper z mennica-orphan.ts) i prawdziwego ownersWithMennica z turn-economy.ts. Dalej to test w Node, nie w grze w przeglądarce.
4. (Komunikat "Ważne") CZĘŚCIOWO: komunikat po polsku jest (showHintMessage: "Mennica w <miasto> została zastąpiona nową w stolicy.") i log konsoli. Wpis do warEventLog ("Ważne") NIE dodany w tej rundzie: wymaga potwierdzenia typu SidePanelEvent (pole kind) i trimWarEventLog — zostawiam do osobnej rundy/decyzji orkiestratora, nie zgaduję typu.

TESTY (surowe wyniki, w gra/ w tym worktree po npm install --ignore-scripts; bez build/dev):
- npx tsc --noEmit: exit 0 (bez wyjścia)
- node tools/mint-orphan-test.cjs: "mint-orphan-test: 28 PASS / 0 FAIL"
- mutacja (guard stolicy usunięty w helperze) -> "26 PASS / 2 FAIL", przywrócone -> 28/0
- node tools/logic-test.cjs: "LOGIC OK (213/213)"
- node tools/ai-test.cjs: "ai-test: 297 passed, 0 failed"
- node tools/combat-test.cjs: "All sanity checks passed."
- node tools/mint-capital-only-test.cjs: "mint-capital-only-test: 8 PASS / 0 FAIL"
- node tools/waluta-mennica-test.cjs: "waluta-mennica-test: 61 passed, 0 failed"
- node tools/trade-routes-income-test.cjs: "trade-routes-income-test: 135 passed, 0 failed"
- node tools/war-rules-multiwar-main-guard-test.cjs: "21 PASS / 0 FAIL"
- NIE ZMIERZONO w tej rundzie: tech-tree-test, research-test, unit-replace-test (nie uruchamiane — zmiana dotyka tylko mennica-orphan.ts i jednego hooka w main.ts).
- NIE ZMIERZONO: uruchomienie gry w przeglądarce (ukończenie Mennicy w stolicy na żywo).

BLOKADY: brak twardych blokad technicznych. Wyburzenie w grze — zakres do decyzji orkiestratora/właściciela (patrz zarzut 1).

RUNDY: 2/5 (poprzednia: 1/5 PASS-WITH-NOTES, ocena Evaluatora FAIL)
NASTĘPNY KROK: Evaluator r2: weryfikacja nowego helpera i testu; FC: decyzja o zakresie wyburzenia (osobny temat + ABC) i wpis "Ważne".
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Znalezisko poza zakresem (już w rejestrze jako #165 MINTDEBT): heurystyka „pierwsze miasto” w pozostałych efektach stolicy.
- Pliki tylko w allowliście: gra/src/game/mennica-orphan.ts, gra/src/main.ts (hook), gra/tools/mint-orphan-test.cjs, dyspozycje/autobot/runs/R-WEB-MINT-ORPHAN-Q1/**. package-lock.json nie został zmieniony (npm install --ignore-scripts nie zmienił pliku w git status).
- node_modules w worktree zostawiam do momentu sprzątania po bramkach (zgodnie z dispatchem).
