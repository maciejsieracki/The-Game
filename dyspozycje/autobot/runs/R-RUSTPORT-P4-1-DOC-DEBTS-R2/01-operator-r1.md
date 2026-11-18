# R-RUSTPORT-P4-1-DOC-DEBTS-R2 — Operator r1

STATUS: PASS
DOMAIN: INFORMATIONAL (komentarze w kodzie Rust, zero zmian zachowania)
TEMAT: R-RUSTPORT-P4-1-DOC-DEBTS-R2
GOAL: poprawić cytaty numerów linii pinu `07d2fbd72` w komentarzach (`refreshBuildHighlight`, `applyFogVisibility`).
BAZA: `origin/rust-port/parity-v2` = `acf238f599059e71b3394ca1a164759491463889` (zgodna z dispatchem w chwili startu).
GAŁĄŹ: `rust-port-wip/p4-1-doc-debts-r2` (worktree wf_7054f6c4-478-1). SHA commitu: patrz `git log` gałęzi (raport w tym samym commicie co zmiany).

## Weryfikacja numerów na pinie (nie tabela, tylko `git show 07d2fbd72:...`)

`gra/src/main.ts` @ `07d2fbd72`:
- 16351 `function refreshBuildHighlight(): void {` … 16396 `}` (zamknięcie funkcji) → zakres `16351-16396` (było `16351-16395`, ucięte o klamrę).
- 16360 `unitRenderer.setHighlight(qual);` (gałąź zakładania miasta, zbiór może być pusty) → `:16360` (było `:16359` = `if (canFoundPlayerCityAt…)`).
- 16366 `setHighlight(new Set(hexes.map…))` (cud) — bez zmian, poprawne.
- 16387 `unitRenderer.clearHighlight();` (kopalnia złoża) — bez zmian, poprawne.
- 16392-16395 `unitRenderer.setHighlight(new Set(...), IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY,);` → `:16392-16395` (było `:16391-16395` / `:16391-16394`; 16391 = `clearMineEligibleOverlay();`).

`gra/src/render/cities.ts` @ `07d2fbd72`:
- 740 `applyFogVisibility(vis, fogOn, playerOwnerId = HUMAN_OWNER_PRIMARY): void {` … 763 `}` → `cities.ts:740-763` (było `657-680`).

Uwaga (bez zmiany): komentarz w `overlays_view.rs:223` i `p4_1q6_2_build_highlight.rs:247` opisuje kod pinu jako `setHighlight(new Set())`; w pinie linia 16360 to `setHighlight(qual)` z `qual` potencjalnie pustym — opis semantycznie poprawny (pusty zbiór), poprawiony został wyłącznie numer.

## ZMIANY (20 linii komentarzy, 9 plików — dokładnie tabela dispatchu)
- rust-port/engine/src/domain/overlays_view.rs (l. 3, 223, 234, 238, 1159)
- rust-port/engine/tests/p4_1q6_2_build_highlight.rs (l. 247)
- rust-port/engine/tests/view_overlays_build.rs (l. 3, 75)
- rust-port/renderer/src/models/cities/renderer.rs (l. 591)
- rust-port/renderer/tests/overlays_units_q6.rs (l. 19, 258-260)
- rust-port/renderer/tests/view_adapter_cities.rs (l. 439)
- rust-port/view-model/src/overlays.rs (l. 156, 161)
- rust-port/view-model/tests/overlay_types_f1.rs (l. 224, 226)
- rust-port/view-model/tests/pin_vectors.rs (l. 554, 556)

## Grep kontrolny
`git grep -nE '16359|16391|16351-16395|657-680' -- 'rust-port/**/*.rs'` po zmianie: **0 trafień**.
Pełne `git grep … -- rust-port` trafia nadal w 44 pliki danych `*.json`/`*.txt` (wektory i fixtures: `engine/tests/p6_*_vectors/*.json`, `renderer/tests/fixtures/**`) — to ciągi cyfr w liczbach zmiennoprzecinkowych danych testowych, NIE cytaty pinu ani komentarze. Zgodnie z ZAKRESEM (nie ruszać wektorów/literałów) — nietknięte. Brak cytatów w literałach stringów używanych przez testy.

## TESTY (env: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR unikalny w scratchpadzie, usuwany po każdym crate)
- Skrypt „tylko komentarze”: `git diff -U0 | grep -E '^[+-][^+-]' | grep -vcE '^[+-]\s*(//|\*)'` = **0**.
- `cargo fmt --check`: engine 0, renderer 0, view-model 0.
- view-model: clippy `--all-targets -D warnings` EXIT 0; `cargo test --all-targets` EXIT 0 (109 passed / 0 failed).
- engine (w tle, setsid nohup, EXIT w logu): CLIPPY_EXIT=0; TEST_EXIT=0 — 3982 passed / 0 failed / 1 ignored (530 binarek testowych).
- renderer (dysk 14 GB przed startem, bez równoległych buildów renderera): CLIPPY_EXIT=0; TEST_EXIT=0 — 687 passed / 0 failed / 0 ignored.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO
