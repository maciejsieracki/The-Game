STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-UNIT-UPKEEP-ERA-SCALE-Q1
GOAL: utrzymanie jednostek (Pieniądz, surowce, żywność) x1/x2/x4 wg epoki jednostki (Kamień/Brąz/Żelazo)
ZMIANY/COMMIT: allowlista: gra/src/game/econ-era-rebalance.ts, gra/src/game/economy-upkeep.ts, gra/data/econ-era-rebalance-params.json, gra/tools/econ-era-rebalance-test.cjs, gra/tools/unit-upkeep-era-scale-test.cjs (nowy), ten raport. SHA: patrz pole sha w wyniku.
TESTY: tsc --noEmit exit 0; logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; econ-era-rebalance-test 36 ok/0 FAIL (M6 wycofany); unit-upkeep-era-scale-test 15 ok/0 FAIL (mutanty M1-M3 czerwone); unit-epoch-cost, citizen-consumption-era-mult, glod-wojska-karencja (40/0), unit-resource-upkeep (7/0), upkeep, recruitment-cost-50-wood, ai-era-unit-promotion, battle-loot, army-hunger-combat, unit-cost-tempo, ai-upkeep-runway, recruitment-no-upkeep-gate, upkeep-difficulty-per-owner, garrison-upkeep-tooltip-explain, era-improvement-cost-upkeep, citizen-resource-upkeep, ai-upkeep-wiring, ai-recruit-upkeep-gate: exit 0. building-upkeep-resources-test: 47/1 FAIL (D10, buildingAdapter.ts; niezmieniany przeze mnie, błąd przed zmianą).
BLOKADY: pomiar dymny 60 tur (seed 4242) NIE ZMIERZONO. treasury-unit-cost-model.cjs NIE zaktualizowany (poza allowlistą) i jego założenie „brak skali epoki na utrzymaniu” jest nieaktualne.
RUNDY: 1/5 (ostatni werdykt: brak)
NASTĘPNY KROK: Evaluator; decyzja właściciela, czy zostawić wynik o ×1/×2/×4 jak w kodzie.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Przesłanka dispatchu była błędna dla utrzymania: units.json Epoka już skaluje utrzymanie (buildUnitUpkeepTable, unitResourceUpkeep, buildUnitFoodTable przez scaleCostByEpoch = epochCostMultiplier: 1/2/4). Żywność wojska przy fladze ON była x3/epokę (4/12/36) i to jedyna realna zmiana: teraz ON = 4/8/16 jak legacy. Mnożnik czytany z units.json Epoka jednostki (ta sama podstawa co istniejący rebalans).
2. Pin zmieniony: E1 (parametr), E3/E4/E8 (żywność ON 4/12/36 → 4/8/16), M5 (mutant na nowym miejscu), M6 wycofany jako równoważny.
3. Zostawiony legacy: unitFoodCardValue przy OFF zwraca surową wartość (bez ×4), pinowane przez E8 OFF; rozjazd karta-silnik przy OFF.
4. Koszt rekrutacji (building-stock-cost.ts) bez zmian.

Helper: gra/src/game/econ-era-rebalance.ts → unitUpkeepScaleByEpoch(value, epoch).
