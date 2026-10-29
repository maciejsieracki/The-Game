STATUS: FAIL (zakres niepełny: 17/36 jednostek K03; powrót do Operatora r2 z tym samym ID)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K03-Q1
GOAL: Port K03 (Model miasta, 36 jednostek, pin `edb8fb56:gra/src/ui/cityPanel.ts`) do `src-tauri/frontend-v2/src/ui/cityPanel/k03-*.ts`; reguły zastąpione DTO (`CityPanelDto`), bez lokalnego przeliczenia porządku.
ZMIANY/COMMIT: allowlista — nowe: `src/ui/cityPanel/k03-model.ts`, `src/ui/cityPanel/k03-detail.ts`, `tools/dom-harness/run-k03.mjs`, `dyspozycje/rust-port/p5/P5-8-K03.md`; dopisek: `src-tauri/frontend-v2/PORTING-QUEUE.md`; run: `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K03-Q1/`. Brak zmian w `gra/**`, rust-port, `WERSJE.md`. Commit kodu: `abab2d96` (git add jawny, bez push).
TESTY:
- `npm run typecheck` — exit 0.
- `npm run check` — self-test 33/15 OK; check-no-logic-imports 159 plików, 0 trafień; verify-pin-copies pin edb8fb56 435 plików, 0 niezgodności.
- `node tools/dom-harness/run-k03.mjs` — asercji 24, różnic 0 (R1 porządek z DTO + mutacja; R2 wzrost/popCaps + mutacja; R3 podział; R4 flagi/trade + mutacja; R5 cache kolejki; D1 prymitywy DOM).
- NIE_ZMIERZONO: porównanie DOM z pinem (identyczność punktów wejścia), `mutate-k03.mjs`, pokrycie 36/36, przeglądarka.
BLOKADY: brak techniczny. Zakres: NIE PORTOWANE 19 jednostek (`playerFacingNote`, `unitExtraField`, `techPrereqChain`, `buildGrowthProgressTooltipCard`, `buildZdrowieDetailCard`, `buildSurowceDetailCard`, `appendCompositionBlock`, `buildWealthCompactTooltipCard`, `appendWealthCompactStrip`, `buildTopBarRekruciDetailCard`, `configureCityPanel`, `gameData`, `readOwnerDefaultPodzialHandlu`, `territoryNodesForPanel`, `ownerHasMennica`, `cityFoodSplit`, `buildingHappinessSum`, `buildHandelDetailCard`, `bindRecruitQueueDragReorder`). Założenia K03-Z1..Z8 w `dyspozycje/rust-port/p5/P5-8-K03.md`.
Uwaga procesowa: `git show <pin-sha>:path > plik` było blokowane przez guard worktree; pin czytano przez `git show edb8fb56…:path | wc` (bez przekierowania). Plik `ui-params` z pina nie został pobrany — harness używa `MOCK_STATIC_CATALOG` z v2 (`src/controller/mockCatalog.ts`).
RUNDY: 1/5 (ostatni werdykt: brak — Operator-impl)
NASTĘPNY KROK: Operator r2 — dokończyć 19 jednostek K03 wg listy, dopisać porównanie z pinem i `mutate-k03.mjs`; potem Evaluator/Final Control.
DEPLOY/PUSH: NIE WYKONANO
