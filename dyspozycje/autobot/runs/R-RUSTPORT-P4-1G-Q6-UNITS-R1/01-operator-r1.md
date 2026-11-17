# R-RUSTPORT-P4-1G-Q6-UNITS-R1 — Operator r1

STATUS: BLOCK (INFRA — bramka pełna renderera nieuruchomiona: dysk 4,1–7,2 GB < 12 GB; kod i bramki celowane zielone)
DOMAIN: GAME=nie (DTO → renderer; gameplay bez zmian)
TEMAT: R-RUSTPORT-P4-1G-Q6-UNITS-R1 (PRIO-3D-2, #270 / #328)
GOAL: podpiąć adapter jednostek/stosów, `reachable`, `path_route` (z `turn_stops`), `build_highlight` (4 tryby) i `selection` do renderera; producent nakładek woła `reachable_overlay` i `path_route_overlay`.

## BAZA
Dodatek r2 dispatchu: `origin/rust-port/parity-v2` = `2760b4f0c` (zweryfikowane `git rev-parse`). Gałąź robocza: `rust-port-wip/P4-1G-Q6-UNITS-r1` (lokalna, nie pushowana).

## ZMIANY/COMMIT
Kod: **`92a91bcc3b95255b3343de47cc1782f3341e6e99`** (jawny `git add`, bez `Cargo.lock`, trailer bez nazwy modelu).

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/overlays_view.rs` | `UnitOverlaysInput`, `UnitOverlaysView` (+`write_into(&mut OverlaysViewDto)`), `unit_overlays_view` — JEDYNY wołający `reachable_overlay`, `path_route_overlay`, `selection`, `build_highlight`; moduł testów `q6_unit_overlays_tests` (3). Kształt typów DTO bez zmian. |
| `rust-port/renderer/src/view/units.rs` (nowy) | `unit_highlight`, `selection_input`, `path_route_input`, `UnitOverlayInputs{from_overlays, with_siege_map_panel_open, apply}`, `sync_units` → `MapUnitRenderer` (R1). |
| `rust-port/renderer/src/view/overlays.rs` | `OverlayLayers.units: UnitOverlayInputs` wypełniane w `overlay_layers` (ta sama ścieżka co Q5). |
| `rust-port/renderer/src/view.rs` | `pub mod units;` + reeksport. |
| `rust-port/renderer/tests/overlays_units_q6.rs` (nowy) | 6 testów integracyjnych. |

Nie ruszano: `cities/mod.rs`, `revolt`, `gra/`, `Cargo.toml`, `Cargo.lock` (zmiana lokowa `renderer/Cargo.lock` po buildzie cofnięta `git checkout`).

## ODSTĘPSTWA OD LITERY DISPATCHU (do oceny Evaluatora)
1. **Ścieżka pliku producenta.** Dispatch: `view-model/src/overlays_view.rs` — plik nie istnieje. Producent z numerami linii z dispatchu (`build_highlight` ~:223, `path_route_overlay` ~:449) to `rust-port/engine/src/domain/overlays_view.rs`; tam dodano wyłącznie wywołanie (agregator) + testy w tym samym pliku. Kształt DTO bez zmian.
2. **Pkt 1 „wołać `reachable_overlay` w `view/overlays.rs`”** jest niewykonalny dosłownie: renderer nie zależy od silnika (D-DTO-1 = A, `renderer/Cargo.toml` — tylko `civ-view-model`; Cargo.toml poza allowlistą). Podział: silnik liczy pola (`unit_overlays_view`), renderer je konsumuje (`overlay_layers` → `OverlayLayers.units` → `MapUnitRenderer`).
3. **Pkt 4 „PlayableState → DTO → overlay_layers w jednym teście `renderer/tests`”** — z tego samego powodu łańcuch rozbity na dwa ogniwa na tych samych wektorach: silnik (`q6_agregator_wola_zasieg_trase_zaznaczenie_i_budowe`: PlayableState → reachable [(2,0),(3,0),(1,0)], trasa 0..5, `turnStops` [(3,0) t1, (5,0) t2], zaznaczenie (0,0) gracz 1) i renderer (`overlays_units_q6.rs`: ten sam DTO → `overlay_layers` → `MapUnitRenderer`). Brak automatycznego spięcia (fixture JSON) — do decyzji, czy wymagane.

## DECYZJE TECHNICZNE (do wpisu w REJESTR-RUST)
- **Q6-1 (jedno źródło `selectedId`)**: `unit_overlays_view` buduje `selection` z `state.selected_unit_id` (to samo pole czytają `reachable_overlay` i `path_route_overlay`; web ma jedną zmienną `selectedId`, `main.ts:7116`). Dług: F6 przewidywał `SelectionUi` od wołającego (D-CMD-12) — przy wprowadzeniu stanu UI poza `PlayableState` zmienić w jednym miejscu.
- **Q6-2 (jedna warstwa `setHighlight`)** — rozstrzygnięcie pozycji NIE_ZMIERZONO z `P4-1G-ADAPTER-ROZPOZNANIE.md` §3.7: w pinie ostatnie wywołanie wygrywa; w snapshotcie niepusty `build_highlight` (tryb modalny, `refreshBuildHighlight`) ma pierwszeństwo przed `reachable`; `FoundCity`/`Wonder` → krycie domyślne (`:16359`, `:16366`), `Improvement` → `IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY` (`:16391-16394`), `Mine` → `clearHighlight()` + warstwa kopalni Q5 (`:16386-16390`); puste `hexes` = brak warstwy (kontrakt §3.7) → `reachable`.
- **Q6-3 (panel oblężenia)**: `isSiegeMapPanelOpen()` nie wchodzi do `MapUiState` (dodanie pola łamie literały w `tests/view_adapter_overlays.rs`, poza allowlistą); osobne `UnitOverlayInputs::with_siege_map_panel_open` czyści tylko zasięg (`main.ts:7120-7122`), warstwy budowy nie.
- `path_route` → `setPathRoute(hexes, { turnStops })`, `turnLabel = None` (pin nie ustawia go w `:31175-31178`, `:31204-31207`); `None` → `clearPathRoute()`. Kolejność `apply` = `syncPlayerUnitSelectionOnMap` (ring → highlight → trasa).
- `sync_units`: `setForceVisibleUnitId(MapUiState.force_visible_unit_id)` przed `sync(units, Some(stacks))`.

## TESTY (CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR w scratchpadzie, usunięty)
- renderer `cargo fmt --check`: EXIT 0.
- renderer `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- renderer `cargo test --test overlays_units_q6`: **6 passed, 0 failed**.
- renderer regresja celowana: `--lib` 111 passed; `view_adapter_overlays` 24 passed; `map_units_tokens` 17 passed; 0 FAILED.
- engine `cargo fmt --check`: EXIT 0; `cargo clippy --lib --tests`: 0 ostrzeżeń; `cargo test --lib q6_`: 3 passed; `cargo test --test view_overlays_reach_path`: 14 passed.
- **renderer `cargo test --all-targets --no-fail-fast`: NIE URUCHOMIONO** — reguła bramki renderera wymaga ≥ 12 GB; zmierzone `df -h /`: 8,9 GB na starcie, 7,2 GB przed bramką, 4,1 GB po sprzątnięciu targetów (równoległe buildy innych workerów). NIE_ZMIERZONO.

## MUTACJE (wszystkie FAIL, pliki przywrócone — `cmp` OK)
| Mutacja | Wynik |
|---|---|
| (a) silnik: `reachable` bez `reachable_overlay` | FAIL `q6_agregator_wola_zasieg_trase_zaznaczenie_i_budowe` |
| (a') renderer: `reachable` pominięty w `unit_highlight` | FAIL 3/6 (`carry_reachable…`, `apply_matches_pin_calls…`, `empty_unit_fields…`) |
| (b) renderer: `path_route` bez `turn_stops` | FAIL 2/6 (`carry_reachable…`, `apply_matches_pin_calls…`) |
| (b') silnik: trasa bez `path_route_overlay` | FAIL `q6_agregator…` |
| (c) `Improvement` z kryciem domyślnym | FAIL `q6_build_highlight_four_kinds` |
| (c') `Mine` jako zwykły `setHighlight` | FAIL `q6_build_highlight_four_kinds` |
Skrypty: `mut_r.sh`, `mut_e.sh` (scratchpad sesji, poza repo).

## BLOKADY
- INFRA: pełna bramka `cargo test --all-targets --no-fail-fast` renderera wymaga ≥ 12 GB wolnego i braku równoległych buildów renderera; jest 4,1 GB. Do wykonania przez Evaluatora/FC po zwolnieniu dysku.
- Produkcyjny wołający `unit_overlays_view` po stronie mostu (droga DTO engine → renderer, audyt L6 / #308) nadal nie istnieje — poza zakresem i allowlistą.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator — ocena odstępstw 1–3 i decyzji Q6-1..Q6-3; pełna bramka renderera przy ≥ 12 GB.
DEPLOY/PUSH: NIE WYKONANO
