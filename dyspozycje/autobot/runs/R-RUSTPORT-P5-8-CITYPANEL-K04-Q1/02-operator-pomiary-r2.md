STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K04-Q1
GOAL: Port K04 (karty szczegółów, 32 jednostki, pin edb8fb56 linie 794–6756) do `src-tauri/frontend-v2/src/ui/cityPanel/k04-*.ts` z harnessem zgodności z pinem i mutacjami. Ta runda (Operator-pomiary r2): niezależna weryfikacja batch 1 (commit `91f6282d`), harness z pinem, mutacje, gate'y, aktualizacja dokumentu tematu.
ZMIANY/COMMIT: Baza `ab74d4b6` (checkout detached; kod batch 1 `91f6282d`). Nowe pliki: `src-tauri/frontend-v2/tools/dom-harness/run-k04-units.mjs` (harness z pinem, 22 przypadki), `src-tauri/frontend-v2/tools/dom-harness/mutate-k04-units.mjs` (15 mutacji). Zmienione: `dyspozycje/rust-port/p5/P5-8-K04.md` (sekcje weryfikacji, znane różnice, status po pomiarach), ten raport. Zmiany w `src/ui/cityPanel/**` brak (kod batch 1 bez zmian). Zero zmian w `gra/**`, rust-port, `WERSJE.md`. SHA commita: wpisany przez orkiestratora po `git log` (commit z tym raportem).
TESTY:
- `npm ci` (src-tauri/frontend-v2): exit 0.
- `npm run typecheck`: exit 0.
- `npm run check`: exit 0; self-test 33 pozytywnych / 15 negatywnych, błędów 0; `check-no-logic-imports` cele=src,index.html,vite.config.ts plików=160 trafień=0; `verify-pin-copies` pin=edb8fb56 plików=435 niezgodnych=0.
- `node tools/dom-harness/run-k04-units.mjs --pin-dir <PIN_DIR>` (PIN_DIR = `git archive edb8fb56 gra/src gra/data` w katalogu poza repo): exit 0; przypadków=22, OK=21, ROZNICA=0, ROZNICA_ZALOZONA=1 (anulowanie: pin zwrot+dequeue+rerender vs v2 komenda `dequeue_build`, ZAŁOŻENIE K04-Z2).
- `node tools/dom-harness/mutate-k04-units.mjs --pin-dir <PIN_DIR>`: exit 0; mutacji=15, wykrytych=15, niewykrytych=0.
- `cargo fmt/clippy/test`: NIE_DOTYCZY — zmiany commita dotyczą wyłącznie TypeScript w `src-tauri/frontend-v2` (brak plików `.rs` w diffie `91f6282d..ab74d4b6` i w tej rundzie).
- NIE_ZMIERZONO: zgodność wartości DTO z silnikiem Rust (`stockCost`, `stockPool`, `stockResourceLabels`) — K04-Z1; zwrot surowca i postępu przy anulowaniu — K04-Z2; 25 jednostek K04 nie portowanych.
BLOKADY: brak blokad technicznych. Zakres niekompletny: 25 z 32 jednostek (batch 2–4) — lista w `P5-8-K04.md` §„Pozostało w K04”.
RUNDY: 2/5 (runda 1: Operator-impl FAIL; runda 2: Operator-pomiary FAIL, ten sam ID).
NASTĘPNY KROK: Operator r3 — batch 2 (8 jednostek: `appendCityResourceStockStrip`, `appendRecruitMilitaryResourceStrip`, `addItem`, `appendBuildActionButtons`, `bindBuildQueueDragReorder`, `renderSurowce`, `buildingUiDisplayLevel`, `buildingOwnedLevel`), batch 3 (karty `buildTopBar*`, `buildKulturaDetailCard`, `buildPorzadekDetailCard`, `buildWealthDetailCard`, `buildRacjeWzrostDetailCard`), batch 4 (reszta), z rozszerzeniem `run-k04-units.mjs` i `mutate-k04-units.mjs` o każdą nową jednostkę; potem pomiar Operatora-pomiary.
DEPLOY/PUSH: NIE WYKONANO
