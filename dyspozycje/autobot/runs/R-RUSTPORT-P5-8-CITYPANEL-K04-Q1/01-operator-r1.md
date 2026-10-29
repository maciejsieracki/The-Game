STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K04-Q1
GOAL: Port K04 (karty szczegółów, 32 jednostki, 1388 LOC, pin edb8fb56 linie 794–6756) do `src-tauri/frontend-v2/src/ui/cityPanel/k04-*.ts`, z harnessem zgodności z pinem i mutacjami.
ZMIANY/COMMIT: commit `91f6282d` (kod batch 1: `src-tauri/frontend-v2/src/ui/cityPanel/k04-stock.ts` nowy, `src-tauri/frontend-v2/src/viewmodel/types.ts` +pole `CityPanelInputsDto.stockPool`). Dokumenty w tym samym commicie raportu (SHA w odpowiedzi orkiestratora): `dyspozycje/rust-port/p5/P5-8-K04.md` (nowy), `src-tauri/frontend-v2/PORTING-QUEUE.md` (dopisek), ten raport. Zakres batch 1: 7 z 32 jednostek (`buildingStockCostForItem`, `unitStockCostForItem`, `stockCostForQueueItem`, `cancelQueueItem` → komenda `dequeue_build`, `ownerSurowcePoolFor`, `formatResourceUpkeepSummary`, `buildingStockCostChipsHtml`). Baza: `origin/rust-port/parity-v2` = `84e48879`. Pin wyekstrahowany przez `git archive edb8fb56` do katalogu w scratchpad (poza repo).
TESTY:
- `npm ci` (frontend-v2): OK, 51 pakietów.
- `npm run typecheck`: exit 0, bez błędów.
- `npm run check`: self-test 33/15 bez błędów; `check-no-logic-imports` trafień=0 (plików 160); `verify-pin-copies` niezgodnych=0 (plików 435).
- Harness DOM z pinem (`--pin-dir`): NIE_ZMIERZONO (nie napisany w r1).
- `mutate-k04-units.mjs`: NIE_ZMIERZONO (nie napisany w r1).
- Pomiar dryfu: NIE_ZMIERZONO w r1.
BLOKADY: brak blokad technicznych. Niekompletny zakres: 25 jednostek K04 nie portowanych w r1 (lista w `P5-8-K04.md`, sekcja „Pozostało”). Brak harnessu i mutacji. Zgodność wartości DTO z silnikiem Rust nie zweryfikowana (K04-Z1, K04-Z2).
ZAŁOŻENIA (w dokumencie): K04-Z1 koszt wpisu kolejki = `ProductionItemDto.stockCost`, pula państwa = `CityPanelInputsDto.stockPool`; K04-Z2 anulowanie = komenda `dequeue_build`, zwrot surowców po stronie Rust.
RUNDY: 1/5 (po werdykcie FAIL kolejna runda 2/5 z tym samym ID).
NASTĘPNY KROK: Operator r2 — batch 2 (8 jednostek: `appendCityResourceStockStrip`, `appendRecruitMilitaryResourceStrip`, `addItem`, `appendBuildActionButtons`, `bindBuildQueueDragReorder`, `renderSurowce`, `buildingUiDisplayLevel`, `buildingOwnedLevel`), potem batch 3 (karty `buildTopBar*`, `buildKulturaDetailCard`, `buildPorzadekDetailCard`, `buildWealthDetailCard`, `buildRacjeWzrostDetailCard`), batch 4 (`cityPracaSplit`, `readPodzialPracy`, `ownerHasSpichlerz`, `religiaSzPunkty`, `resolveCityHealth`, `resolveEmpireSnap`, `sumOwnedBuildingsUpkeep`, `__cityPanelOrderStateLocalForTest`). Następnie harness `run-k04-units.mjs` i `mutate-k04-units.mjs`, tabela było/jest i wpis końcowy w `PORTING-QUEUE.md`.
DEPLOY/PUSH: NIE WYKONANO
