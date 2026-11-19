STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy; bez zmian w gra/src ani gra/data)
TEMAT: R-WEB-TEST-DEBT-Q9
GOAL: zdiagnozować trzy czerwone testy na main (unit-epoch-cost 56/1, citizen-resource-upkeep 122/2, unit-replace-full-cost 39/1) i naprawić asercje/anchory bez osłabiania intencji testów.
ZMIANY-COMMIT: baza b031f054e; allowlista: gra/tools/unit-epoch-cost-test.cjs, gra/tools/citizen-resource-upkeep-test.cjs, gra/tools/unit-replace-full-cost-test.cjs, ten raport. Commit: patrz SHA w odpowiedzi orkiestratora.

Tabela (przed -> po):
| test | asercja | przyczyna | działanie |
|---|---|---|---|
| unit-epoch-cost-test | 215: unitStockCost(Konnica) = {braz:50,kon:50} (faktycznie {braz:100,kon:100}) | (a) stara wartość zakładała epokę Brązu (x2); units.json: Konnica Epoka „Żelazo”, Surowiec Brąz 25 -> braz 25x4, dopłata Koni 25x4 raz | oczekiwanie zaktualizowane na 25*4 / MOUNT_UNIT_HORSE_STOCK_COST*4; zachowana intencja „skaluje się raz” |
| citizen-resource-upkeep-test | F1: kotwica „const ordPctRaw = evaluateOrderFromBreakdown(” (nieobecna) + F1 mutant 1 | (b) refaktor main.ts:44221: wywołanie nazwane `ordPctEvaluated` | kotwica -> „const ordPctEvaluated = evaluateOrderFromBreakdown(”; okno 1200 zn. obejmuje linię citizenResourceHappinessDelta |
| unit-replace-full-cost-test | D: regex `deductBuildingStockCostAcrossCities(cities, ownerId, cost)` | (a) main/unit-replace-execute: dopisany 4. argument pendingLedgerSink(...) | regex: `...cost,` (nadal wymusza pobór z puli państwa) |

Wyniki po zmianach (surowe liczby z wyjścia):
- unit-epoch-cost-test: 57 passed, 0 failed (przed 56/1)
- citizen-resource-upkeep-test: 124 passed, 0 failed (przed 122/2)
- unit-replace-full-cost-test: 40 passed, 0 failed (przed 39/1)
- Mutacje (kopia źródła, przywrócone cp): mut1 podwojenie dopłaty Koni -> exit 1, 2x FAIL; mut2 `unitReplaceExecuteDeps(u.ownerId, true)` -> false -> exit 1, 1x FAIL; mut3 usunięcie `citizenResourceHappinessDelta: citizenUpkeep.happinessDelta,` -> exit 1, FAIL F1.
- Bramki: tsc --noEmit exit 0 (0 linii wyjścia); logic-test 213 PASS (0 FAIL); tech-tree 20 pass / 0 fail; research 33/0; unit-replace-test 21/21; combat 6 PASS.

BLOKADY: brak. Realnego błędu gry nie stwierdzono (przypadek c nie wystąpił).

NOTA (do decyzji orkiestratora): Konnica w gra/data/units.json ma Epoka „Żelazo”, a katalog rust-port P4-4 opisuje ją jako jednostkę Brązu (model buildKonnicaBrazOpus5). Nie ustaliłem z dostępnej historii (worktree płytki, git log --follow pokazuje tylko 4 commity) kiedy era została zmieniona. Test przyjmuje dane z units.json jako obowiązujące. Jeśli kanon to Brąz, należy to poprawić w danych (osobny temat, właściciel), a asercję wrócić do x2.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator weryfikuje zmiany w trzech plikach allowlisty i mutacje; Final Control decyduje o zamknięciu. Pytanie o epokę Konnicy (Żelazo vs Brąz) do właściciela.
DEPLOY/PUSH: NIE WYKONANO
