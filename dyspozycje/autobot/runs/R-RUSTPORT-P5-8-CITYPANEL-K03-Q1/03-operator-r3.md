STATUS: PASS-WITH-NOTES (Operator r3: zarzuty odpowiedziane; decyzja końcowa należy do Evaluatora)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K03-Q1
GOAL: Port K03 (pin edb8fb56, gra/src/ui/cityPanel.ts) do src-tauri/frontend-v2/src/ui/cityPanel/k03-*.ts; reguły zastąpione polami CityPanelDto (panelInputs), bez lokalnego przeliczenia porządku.
ZMIANY/COMMIT: kod `ff037c23` (baza: fe4400b3 = Operator r2, d123d988 = origin/rust-port/parity-v2). Allowlista: k03-cards.ts (NOWY), k03-model.ts (adaptery), viewmodel/types.ts (tylko dopisek CityPanelInputsDto), tools/dom-harness/{build.mjs (opcja extraPlugins, domyślnie []), run-k03-units.mjs, mutate-k03-units.mjs}, PORTING-QUEUE.md, dyspozycje/rust-port/p5/P5-8-K03.md. Brak zmian w gra/**, rust-port, WERSJE.md. Brak push.

ODPOWIEDZI NA ZARZUTY
1. Zakres 20/36 — PRZYJMUJĘ. Dokończone 16 jednostek: 13 przeniesionych 1:1 z porównaniem DOM z pinem, 1 adapter (buildingHappinessSum, pin-równość NIE_ZMIERZONO), 2 usunięte ZAŁOŻENIEM K03-Z4 (configureCityPanel, gameData: hook cfg i lokalne ładowanie danych nie mają odpowiednika w v2). Razem 36/36 rozstrzygniętych. Dowód: ff037c23, k03-cards.ts, P5-8-K03.md §Runda 3.
2. 16 nieportowanych (techPrereqChain, karty, bindRecruitQueueDragReorder…) — PRZYJMUJĘ. Każda z 13 jednostek ma port w k03-cards.ts, a luki DTO rozstrzygnięte ZAŁOŻENIAMI K03-Z9/Z10 (pola panelInputs). Dwie jednostki (configureCityPanel, gameData) traktuję jako usunięte ZAŁOŻENIEM K03-Z4 — to jest jawna decyzja do oceny Evaluatora, nie ukryty brak.
3. Brak mutate-k03 — PRZYJMUJĘ. tools/dom-harness/mutate-k03-units.mjs: 16/16 mutacji wykrytych (w tym pola DTO: mennica.spiZBrakuZlota, handel.aktywneTrasy, wealth.szBonus, sliders.handelDefault, territoryNodes, ownerHasMennica).
4. Brak harnessu z pinem — PRZYJMUJĘ. tools/dom-harness/run-k03-units.mjs --pin-dir: 34 asercje, 0 różnic, 0 wyjątków (funkcje pinu wyciągane po nazwie z edb8fb56).
5. Brak pokrycia §4 (order z silnika, computeView/cityGrowthLive/resolveOrderState) — PRZYJMUJĘ. Asercja statyczna: w kodzie K03 (bez komentarzy) brak computeOrderStateLocal/computeView/cityGrowthLive/resolveOrderState; R1/R2 z run-k03.mjs (mutacje dto.order, growth.pctPerTurn).
6. Brak przeglądarki, tabeli było/jest i listy zmian API — tabela i API: PRZYJMUJĘ (P5-8-K03.md, runda 3). Przeglądarka: NIE_ZMIERZONO (weryfikacja tylko jsdom).

TESTY (na ff037c23, po npm ci):
- npm run typecheck (tsc --noEmit): EXIT 0
- npm run check: EXIT 0 (self-test 33/15; check-no-logic-imports 160 plików, 0 trafień; verify-pin-copies edb8fb56 435 plików, 0 niezgodności)
- node tools/dom-harness/run-k03-units.mjs --pin-dir: asercji=34 roznic=0 THROW=0, EXIT 0
- node tools/dom-harness/mutate-k03-units.mjs --pin-dir: mutacji=16 wykrytych=16, EXIT 0
- node tools/dom-harness/run-k03.mjs: asercji=31 roznic=0, EXIT 0
- node tools/dom-harness/run-k02-units.mjs: asercji=50 roznic=0, EXIT 0
- node tools/dom-harness/run-k01a.mjs / run-k01b.mjs: EXIT 0 (regresja po zmianie build.mjs)

BLOKADY: brak technicznej. NIE_ZMIERZONO: przeglądarka; pin-równość buildingHappinessSum (reguła w game/buildings); zgodność pól panelInputs z silnikiem Rust (brak kontraktu po stronie silnika); wpięcie panelInputs w controller/ (pole opcjonalne, karty K03 nie są podłączone do cityPanel.ts v2).

RUNDY: 3/5 (Operator r3). Ten sam temat, bez nowego ID.
NASTĘPNY KROK: Evaluator (ten sam ID) ocenia ff037c23 wraz z decyzją K03-Z4 (usunięcie configureCityPanel/gameData); potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
