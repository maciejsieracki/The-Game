STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1
GOAL: Domknięcie zakresu K05A bez DOM (26 jednostek) w `src-tauri/frontend-v2/src/ui/cityPanel/k05a-fundament.ts`, pin `edb8fb56`. Baza `0895e651`.
ZMIANY-COMMIT:
- `d9136432` partia 1 (8): buildingLocationRequirementMet, recruitManpowerCost, empireRekruciTotal, empireRekruciAffordable, maxAffordableRecruitQuantity, unitStockCostChipsHtml, unitResourceUpkeepChipsHtml, missingTechSteps; infrastruktura K05A-Z4/Z5; DTO `CityPanelK05ADto` (dopisek w `viewmodel/types.ts`).
- `b64589c0` partia 2 (8): buildingCanBuildNow, sortProductionItemsByBuildability, buildingConverterProductionDisplay, productionCtxForCity, formatBuildingCatalogLockHint, formatBuildingPreviewHint, collectEraPreviewEntries (kopie) + buildingRequirementChips (ADAPTER, sygnatura pinu, wynik z DTO).
- `c81abcc3` partia 3 (2): recruitUnit, improvementsInCityRange (kopie).
- Commit dokumentacji (`P5-8-K05A.md` §9, `PORTING-QUEUE.md`, ten raport): SHA w `git log -1` tej gałęzi detached.
- Allowlista: zero zmian w `gra/**`, `package.json`, `WERSJE.md`, `controller/`. Push: nie.
TESTY:
- `verify-k05a-copies --pin-dir <PIN>`: blocks=28, wybrane=26, OK.
- `run-k05a-units --pin-dir <PIN>`: porównań 4304, różnic 0, EXIT 0.
- `mutate-k05a-units --pin-dir <PIN>`: 72 mutacje, 71 zabitych, 1 równoważna (`okolica-reczne-finite`, dowód w kodzie), 0 przeżytych.
- `npm run typecheck`: EXIT 0. `npm run check`: EXIT 0 (174 pliki, 0 trafień; verify-pin-copies 435, 0 niezgodnych). `git diff --check`: czysto.
- Pin: `git archive edb8fb56 gra/src gra/data` w scratchpadzie poza repo.
TABELA BYŁO/JEST: jednostki bez DOM 8/26 → 26/26; LOC 78/525 → 525/525; DOM 19 → K05B (bez zmian).
LISTA ZMIAN API: nowe eksporty `setK05aCfg`, `setK05aRules`, typy `City`, `UnitDef`, `ProductionItem`, `GameData`, `BuildingDef`, `BuildingCatalogEntry`, `AvailabilityContext`, `BuildingReqChip(Kind)`, `CivBonusLite`, `RawConverterParamsJson`, `HexLike`, `GameMap`, interfejsy `K05aCfg*`/`K05aRules*`; delegatory reguł o nazwach pinu; `CityPanelInputsDto.k05a?`.
BLOKADY: brak technicznych.
NIE_ZMIERZONO / NOTATKI:
- wiring kontrolera do `panelInputs.k05a` (brak producenta DTO) — poza zakresem K05A; wymaga osobnego kroku,
- równoważność adaptera `buildingRequirementChips` z pinem zależy od silnika (w harnessie tylko kontrakt),
- harness testuje delegatory wobec fixture, nie wobec silnika Rust.
RUNDY: 3/5 (zużycie tej rundy: Operator-impl). Po limicie: nie.
NASTĘPNY KROK: Evaluator r3, potem Final Control r3 (ten sam ID); integracja orkiestratora po FC.
DEPLOY/PUSH: NIE WYKONANO
