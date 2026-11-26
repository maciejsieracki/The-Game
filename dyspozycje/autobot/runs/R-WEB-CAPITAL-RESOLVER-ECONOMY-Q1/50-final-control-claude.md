# R-WEB-CAPITAL-RESOLVER-ECONOMY-Q1 — Final Control (Claude)

STATUS: PASS
DOMAIN: GAME (spójność wyboru stolicy, bez zmiany wartości balansu)
TEMAT: R-WEB-CAPITAL-RESOLVER-ECONOMY-Q1 (MINTDEBT #165)
GOAL: efekty stolicy w ekonomii tury (previewCityEconomy, advanceCityEconomy, pre-pass D2, Mennica) używają jednego źródła stolicy (resolver main.ts), nie "pierwszego miasta w tablicy".
ZMIANY-COMMIT: kandydat d1370aa15bf5a2316d69f5c394f73b39b3a18742, baza 4afe2c609. merge-base --is-ancestor: OK. diff --stat: 3 pliki, +314/-28 (turn-economy.ts, nowy capital-resolver-economy-test.cjs, raport operatora). Allowlista zachowana (brak gra-robocza, WERSJE.md, main.ts, rust-port). Diff przejrzany: nowy helper capitalCityIdByOwnerForTick; bez resolvera lub gdy resolver wskazuje miasto spoza ownera -> fallback pierwsze miasto (zgodność testów); isCapital i capitalCoordsByOwner z helpera; wzory i kolejność obliczeń bez zmian.
TESTY (własny przebieg, surowe wyjście):
- tsc --noEmit: exit 0
- logic: 213/213; tech-tree: 20 pass 0 fail; research: 33/0; unit-replace: 21/21; combat: 6/6
- ai-test: 297 passed 0 failed; war-rules-multiwar-main-guard: 21 PASS / 0 FAIL
- capital-resolver-economy: 10 passed 0 failed
- mint-capital-only 8/0; mint-orphan 28/0; waluta-mennica 61/0; trade-routes-income 135/0; citizen-resource-upkeep 124/0
- Mutacja niezależna (resolver wyłączony w helperze): 3 passed, 7 failed (czerwone); po przywróceniu 10/0.
ZARZUTY: Evaluator [] | obrona: brak. Własnych zarzutów NAPRAW: brak.
UWAGI (ODDAL): zmiana wartości korupcji/Mennicy występuje tylko w imperiach z przeniesioną stolicą (zamierzona poprawka); brak pomiaru live w przeglądarce (temat nie zmienia UI). Dług: duplikacja bloku stolicy w preview/advance.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora, READY_FOR_DEPLOY po merge (zmiana dotyka gra/src).
DEPLOY-PUSH: NIE WYKONANO
