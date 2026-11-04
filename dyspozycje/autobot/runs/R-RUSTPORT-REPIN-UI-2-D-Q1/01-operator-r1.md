STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-D-Q1
GOAL: REPIN UI partia UI-2-D (`P5-REPIN-UI-2.md` §1/§1a/§4): #15 `hexContextTooltip`, #16 `preBattle`, #17 `buildModeHud`, #24 `entityCards/buildingAdapter`, #25 `entityCards/improvementAdapter` — port do `origin/main` `86d510c66`.

ZMIANY/COMMIT (branch `ui2d-q1-r1` od `rust-port/parity-v2` `2198eaf7e`; `git log 86d510c66..origin/main -- gra/src/ui` = pusto):
- `e0eef2b84` kod: porty DOM 5 plików `src-tauri/frontend-v2/src/ui/**` (wszystkie klasy PD/AD — żaden nie był w `pin-manifest.json`, nic nie usunięto); `viewmodel/types.ts` addytywnie (`StaticCatalogDto.terrainImprovementWorkCost?`, `BuildingCardStateDto.civBonusy?`, komentarz epoki w `HexTooltipViewDto`); `tools/repin-ui2-manifest.json` (nowa sekcja `overlayPortsUI2D` na końcu), `tools/repin-ui2-overlay.mjs` i `tools/verify-repin-ui2-copies.mjs` (dopisane bloki, istniejące linie nietknięte), `tools/dom-harness/run-cycles.mjs` (DTO heksa z epoką, gdy odniesienie = main), NOWE `run-repin-ui2d.mjs`, `mutate-repin-ui2d.mjs`, `fixtures/repin_ui2d-web-vectors.json`; `package.json` (+2 skrypty na końcu).
- `701b4aecf` dokument: `P5-REPIN-UI-2.md` — status wierszy #15–17, #24–25 (§1, §1a) + nowa §6 (hunki plik:linia, założenia, wycena).
- Ten raport: commit poniżej (SHA w `git log`).
ZAŁOŻENIA: UI2D-Z1 epoka gracza w `HexTooltipViewDto` liczy Rust; UI2D-Z2 chipy bitwy (`effectiveCombatBonusChipTexts`, skład/teren) w `bonusChips` z Rust; UI2D-Z3 brak `terrainImprovementWorkCost` → surowe `koszt_praca`.

TESTY (`src-tauri/frontend-v2`, `npm ci`, potem `node_modules` usunięty):
- `tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (verify-pin-copies 433/0; verify-repin-ui2-copies 4/0 + overlayPorts* 3/3).
- `run-repin-ui2d` (web main vs port, Chromium 141 headless): 797 przypadków / 8 grup, 0 różnic; PNG 3 sceny × {1280×720, 360×640} = 6/6 bajtowo równe; znaczniki nowych hunków 16/16; usunięte teksty 0; asercje UI2D-Z3 2/2; `pageerror`/`console.error` = 0; EXIT=0.
- Niezależny weryfikator: 2 osobne `git archive 86d510c66` → `webVectorsSha256=4f79e00e366205f1a859edb3d59edca1be9a3e11607e6b941e67f74a23b81d50` w obu; plik fixtury sha256 `6b6fa408…158a51` w obu.
- `mutate-repin-ui2d`: 32/32 wykryte (3 wywołania `--range`, na zacommitowanym harnessie); mutacja B5 przeżyła w pierwszej wersji → harness uzupełniony (hook ustępuje po „Wyłącz filtr”), potem wykryta.
- Regresja na nakładce (`repin-ui2-overlay` + `overlayPortsUI2D`): L0 3861/0, L1A 3618/0, L2 1784/0 (jsdomErrors 354 / consoleErrors 150 = baza), C4 1649/0 (75/0 = baza), cycles 6401/0, hud 927/0, newgame 1194/0, cityux 164/0, k05b 384/0 — wszystkie EXIT=0.
- `git diff --check` czysty. Cargo: nie dotyczy (Rust nie ruszany).

BLOKADY: brak.
NIE_ZMIERZONO: GPU/natywne okno Tauri; producent Rust nowych pól DTO (`src-tauri/src/**` poza allowlistą → P6); `mutate-cycles`/`mutate-c4`/`mutate-level2` po zmianie `run-cycles` (nieuruchomione).
UWAGI: `preBattle` i `improvementAdapter` poza nakładką (main importuje reguły nieobecne na pinie / wymaga pola DTO) — pokrywa je wyłącznie `run-repin-ui2d`. Wołający (kontroler v2) jeszcze nie podaje `getUnspentBudgetWarning`/`automaticOnly`/`manualControlAllowed`/`civBonusy` — wartości domyślne = zachowanie pinu. Pliki wspólne edytowane wyłącznie addytywnie (dopisane sekcje/bloki) pod scalenie z B/C/E.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator R-RUSTPORT-REPIN-UI-2-D-Q1 r1 (komendy: `P5-REPIN-UI-2.md` §5 + `run-repin-ui2d.mjs --web-dir`, `mutate-repin-ui2d.mjs --web-dir --range`).
DEPLOY/PUSH: NIE WYKONANO
