# R-WEB-UI-HUD-NET-SPICHLERZ-DRAIN-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (kod i testy czyste; dowód w żywej grze NIE ZMIERZONO)
DOMAIN: GAME (UI/raportowanie HUD, bez zmiany ekonomii)
TEMAT: R-WEB-UI-HUD-NET-SPICHLERZ-DRAIN-Q1
GOAL: HUD netto surowca odejmuje drenaż Spichlerza (Ceramika: HUD netto 77 → 67, zgodnie z Δstanu).
BAZA: d425dd0a3 (origin/main). Gałąź detached; SHA commita z kodem podany w odpowiedzi.

ZNALEZIONY DRENAŻ (pkt 1), plik:linia:
- Spichlerz I/II: Ceramika `budynek_spichlerz_zuzywa_ceramika` (10) / `budynek_spichlerz_ii_zuzywa_ceramika` (20), Sól II `budynek_spichlerz_ii_zuzywa_sol` (25): gra/src/game/building-resource-gate.ts:336-338; `paySpichlerzDrainForCity` :417; wywołanie silnika gra/src/game/turn-economy.ts:2067.
- Inne drenaże poza konwerterami, utrzymaniem jednostek i ulepszeń: NIE ZNALEZIONO (grep `zuzywa` w gra/src).

ZMIANY (allowlista):
- gra/src/game/resource-gross-net.ts: pole `rateBuildingDrainPerTurn`, pole `drenaz` w wyniku; netto = produkcja − zużycie − wejścia − drenaż; funkcja `resourceDrenazTooltipText`.
- gra/src/main.ts: `empireSpichlerzDrainRatesForOwner` (dryRun tej samej logiki co silnik, parametry z loadSpichlerzDrainParams); wiersz HUD dostaje `rateBuildingDrainPerTurn`; `surowceDrenaz` w stanie HUD.
- gra/src/ui/hud.ts: wiersz tooltipu „Drenaż budynków (Spichlerz): −N” tylko gdy N>0.
- gra/tools/hud-net-building-drain-test.cjs (nowy).
- Bez zmian: economy-upkeep.ts, gra/data/**, balans.

ZAŁOŻENIE: drenaż liczony dryRun per miasto na puli ownera (bez kumulacji), jak panel miasta. Przy wielu Spichlerzach i małej puli może zawyżyć o jedną wypłatę.

TESTY:
- tsc --noEmit: exit 0.
- hud-net-building-drain-test (nowy): 25 ok, 0 FAIL.
- Czerwony przed poprawką: NIE ZMIERZONO (nie uruchomiono na bazie).
- hud-shortage-alert-converter 17/0; resource-gross-net-converter-inputs 18/0; hud-resource-card-state 7/0; hud-resource-deficit-red 41/0; hud-gross-net-rest 820/0; spichlerz-hud-params-parity 66/0.
- logic-test 213/213; tech-tree 20/0; research ALL GREEN; unit-replace-test 21/21; unit-replace-multitype-walk 25/0; unit-replace-archer-slinger 51/0; unit-replace-promotion-table PASS; combat-test OK; ai-economy-measure-hook 23/23.
- unit-replace-full-cost 39/1: FAIL statycznego regexu (`deductBuildingStockCostAcrossCities(cities, ownerId, cost)` w unit-replace-execute) — ten sam wynik na bazie d425dd0a3 (sprawdzone), czyli problem istniejący przed zmianą.
- unit-replace-army-multi-select: NIE_ZMIERZONO (Chromium/live).

BLOKADY:
- Dowód na żywo (bieg dymny seed 4242, bundle poza repo, Δstanu vs HUD netto ≥3 tury po Spichlerzu): NIE ZMIERZONO w tej rundzie.

RUNDY: 1/5
NASTĘPNY KROK: bieg live (jeden Chromium), seed 4242, weryfikacja Ceramiki po zbudowaniu Spichlerza; FC: sprawdzić allowlistę i pre-existing FAIL w unit-replace-full-cost.
DEPLOY/PUSH: NIE WYKONANO
