# R-RUSTPORT-P5-8-CITYPANEL-K02-Q1 — Operator, runda 3/5 (impl)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K02-Q1
GOAL: Port pozostałych 18 jednostek K02 (`gra/src/ui/cityPanel.ts` @ edb8fb56) do `src-tauri/frontend-v2/src/ui/cityPanel/`, z harnessem DOM i mutacjami; 23/23 jednostek K02 ma port.

ZMIANY/COMMIT:
- Baza rundy: `be36960c` (detach). Partie:
  - 1/3 `37c62064`: fillIconElement, makeMiniThumb, createScrollList, appendTabIndicators, appendSurowceGrid (Z1: brandIconHtml jako arg), appendIndywidualneToggle (Z2: rerender jako arg).
  - 2/3 `336228cf`: appendW4PctMetricBlock, appendCitizenUpkeepBlock (Z5), makeBuildingThumb, appendBuildingInlineIcon, appendProductionPicon, productionQueueIconSpan (Z4: iconHtml jako arg).
  - 3/3 `08bf28ac`: renderBilans (Z6), appendDisabledBuildActionButtons (Z7), appendBuildingRequirementChipSections (Z8/Z9), techIconHintSpan (import techIconSvg z `../techIcons`), techHintLinkDelegationBound + bindTechHintLinkDelegation (Z10: openPreview jako arg).
- Pliki: `src/ui/cityPanel/k02-units.ts` (nowy), `src/ui/cityPanel/types.ts` (+TabIndicatorChip, BuildingReqChip, BuildingReqChipKind), `tools/dom-harness/run-k02-units.mjs` (nowy), `tools/dom-harness/mutate-k02-units.mjs` (nowy), `dyspozycje/rust-port/p5/P5-8-K02.md`, `src-tauri/frontend-v2/PORTING-QUEUE.md`.
- Commit raportu: SHA w historii gałęzi po tym pliku (raport nie może zawierać własnego SHA).

TESTY:
- `npm ci` (frontend-v2): EXIT 0.
- `npm run typecheck`: EXIT 0.
- `npm run check`: EXIT 0 (check-no-logic-imports 150 plików, 0 trafień; verify-pin-copies 435, 0 niezgodnych).
- `node tools/dom-harness/run-k02-units.mjs --pin-dir <PIN>`: asercji=49, różnic=0, jsdomErrors=0 (pin wycinany po nazwie funkcji; delegacja zdarzeń w świeżych instancjach modułu).
- `node tools/dom-harness/mutate-k02-units.mjs --pin-dir <PIN>`: 28/28 wykryte, przywrócenie bajtowe OK.
- `run-k02-breakdown` (r2) ponownie: 12/0 przed partiami.
- `gra/**`: 0 zmian. `npm run build|dev` w `gra/`: NIE WYKONANO. Gates Rust: NIE DOTYCZY.
- `git diff --check`: EXIT 0 przy każdym commicie.

BLOKADY:
- Zależności w górę rozwiązane argumentami/callbackami (ZAŁOŻENIA P5.8-K02-R3-Z1..Z10, szczegóły w `P5-8-K02.md` §Runda 3). Wywołujący (K01/K03+) musi je dostarczyć; tego nie weryfikuje harness.
- R1 (otwarte): stałe układu i `BreakdownLine` nadal zduplikowane względem K01; scalenie przy integracji.
- Lokalne kopie `statChip`, `LIST_ROW_HEIGHT_EM`, `applyBuildButtonVisualState`, `BUILDING_REQ_SECTION_LABELS` (Z3, Z7, Z8) — kandydaci do usunięcia po scaleniu z K01.
- NIE_ZMIERZONO: zachowanie w przeglądarce (brak testu wizualnego); pokrycie harnessu to przypadki wybrane przez Operatora, nie pełna macierz wejść; parzystość dla wejść z emoji w `el(…, html)` nie badana (teksty literalne bez emoji).
- Dryf po pinie (`P5-8 §7`): nie stwierdzono w zakresie partii 3.
- Stare wiersze tabeli „Stan r2” w `P5-8-K02.md` (§Zakres) są zastąpione tabelą partii.

RUNDY: 3/5 (r1, r2: FAIL; r3: impl gotowa, czeka na Evaluatora i Final Control).

NASTĘPNY KROK: Evaluator (Sonnet 5.5) na commitach `37c62064`, `336228cf`, `08bf28ac` + ten raport; następnie Final Control. Integracja i READY_FOR_DEPLOY wyłącznie przez orkiestrator.

DEPLOY/PUSH: NIE WYKONANO
