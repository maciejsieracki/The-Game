STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI/raportowanie, bez zmiany zasad ekonomii)
TEMAT: R-WEB-UI-HUD-SHORTAGE-ALERT-TOOLTIP-Q1
GOAL: alert niedoboru i tooltip „Brutto · netto” jako jedno źródło z netto HUD (z wejściami konwerterów); diagnoza Ceramika netto 77 vs Δstanu 67.
ZMIANY-COMMIT: ac1885068844b0f8a3548dbac20bd6bb25ff3528 (baza 6b3458f6e). Pliki: gra/src/game/resource-gross-net.ts (resourceIsShortage, resourceWejsciaTooltipText), gra/src/main.ts (alert, etykiety, chip, surowceWejscia), gra/src/ui/hud.ts (pole HudState, wiersz tooltipu), gra/tools/hud-shortage-alert-converter-test.cjs (nowy).
TESTY:
- tsc --noEmit: exit 0, 0 linii wyjścia (przed i po).
- nowy hud-shortage-alert-converter-test.cjs: przed poprawką RESULT 5 ok, 12 FAIL; po poprawce RESULT 17 ok, 0 FAIL.
- resource-gross-net-converter-inputs-test: RESULT 18 ok, 0 FAIL.
- hud-resource-deficit-red-test: 41 pass, 0 fail; hud-gross-net-rest-test: 820 ok, 0 fail; hud-topbar-grid-gross-net-test: 1150 ok, 0 fail.
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass, 0 fail; research-test: 33/0; combat-test: 6/6; ai-economy-measure-hook-test: PODSUMOWANIE 23/23.
- unit-replace: 5 z 6 plików exit 0; unit-replace-full-cost-test: 39 passed, 1 failed (asercja „performUnitReplace (gracz): … deductBuildingStockCostAcrossCities” ). To NIE jest regresja: ta sama asercja na HEAD (6b3458f6e) daje ten sam wynik.
- Nie uruchomiono bundla vite ani testu w przeglądarce (poza zakresem tej rundy).
BLOKADY: brak.
DIAGNOZA CERAMIKI (+10/t): przyczyna = realny odpływ poza modelem HUD, NIE błąd raportowania; kodu nie zmieniano.
Dowody: (1) data/econ-params.json „budynek_spichlerz_zuzywa_ceramika” normal=10 (Spichlerz I, jedna wypłata na miasto); (2) turn-economy.ts ~2067 wywołuje paySpichlerzDrainForCity(…, dryRun=false), a building-resource-gate.ts ~432–437 odejmuje 10 Ceramiki z magazynu państwa; (3) HUD „usage” pochodzi z totalBuildingResourceUpkeep (economy-upkeep.ts ~803, tylko koszt_surowce budynków), więc drain Spichlerza w nim nie występuje. NIE ZMIERZONO: bieg dymny seed 4242 nie został wykonany; 10/t to wynik kodu i zgodności liczby z danymi, nie pomiar.
RUNDY: 1/5
NASTĘPNY KROK: decyzja właściciela (ABC): czy drain Spichlerza ma być w HUD netto jako osobna pozycja „Spichlerz (zużycie)”. To zmiana prezentacji, nie ekonomii. Do tego czasu HUD netto nie zawiera tego odpływu.
UWAGI-DLA-ORKIESTRATORA:
- Zachowanie zmienia się celowo: niedobór (alert, etykiety, chip) = netto HUD, czyli także zużycie (usage), a nie tylko produkcja minus wejścia. Surowiec, którego zużycie przewyższa produkcję, teraz daje alert. Wcześniej nie dawał. Dispatch wymagał „tego samego netto co wiersze HUD”, więc przyjęto tę interpretację.
- Pozostaje: diagnoza Ceramiki bez pomiaru na żywo (NIE ZMIERZONO).
DEPLOY/PUSH: NIE WYKONANO
