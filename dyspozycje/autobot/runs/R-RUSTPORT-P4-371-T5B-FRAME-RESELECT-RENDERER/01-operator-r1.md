# R-RUSTPORT-P4-371-T5B-FRAME-RESELECT-RENDERER — Operator r1

```text
STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-371-T5B-FRAME-RESELECT-RENDERER
GOAL: D-371-5b w rendererze (wybór warstwy setHighlight wg ostatniego zapisującego) i w kliencie
      (select_unit / set_build_mode / set_active_improvement_key / set_highlight_last_writer)
ZMIANY/COMMIT: gałąź rust-port-wip/371-t5b-renderer-op-r1, SHA w sekcji 7 (commit z tym raportem)
TESTY: bramki renderera i klienta EXIT 0; 6/6 mutantów wykrytych (sekcja 5)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (02-evaluator.md)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza i izolacja

- BAZA: `origin/rust-port/parity-v2` = `aad01dc1d7e0c7f1b160ca696fa7ecf6482c2545` (zgodne z dispatchem; zawiera T5a
  `unit_selected_after_build_open`, T2 klient, T1 frame).
- Worktree sparse (`rust-port`, `dyspozycje`, `src-tauri`), gałąź `rust-port-wip/371-t5b-renderer-op-r1`.
- `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
  tematu (`…/scratchpad/t5brender/target`, wspólny dla renderera i klienta) — usunięty po bramkach.
- Dysk przy starcie: 14 GB wolnego (>= 12 GB); równolegle działał jeden cudzy `cargo test` silnika (2 buildy łącznie).

## 2. Web najpierw (pin `07d2fbd72`, `gra/src/main.ts`)

| Wywołanie pinu | Linie | Co robi z warstwą `setHighlight` / zaznaczeniem |
|---|---|---|
| `selectPlayerUnit` | `:7233-7269` | `selectedId`; przy otwartym panelu oblężenia `clearHighlight()` (`:7253-7255`), inaczej `setHighlight(reachable)` (`:7256-7261`); pierścień `setSelectionHex` (`:7262`); NIE zamyka trybu budowy |
| `syncPlayerUnitSelectionOnMap` | `:7115-7135` | jak wyżej (`:7119-7125`) |
| `clearPlayerUnitSelection(StateOnly)` | `:7090-7106` | `selectedId = null`, `clearHighlight`, `clearPathRoute`, `clearSelectionHex` |
| `onOpenBuild` | `:26702-26722` | najpierw `clearPlayerUnitSelection()` (`:26703`), potem otwarcie albo `exitBuildMode()` |
| `onSelectType(key)` | `:26733-26740` | `foundCityMode=false`, `activeWonderId=null`, klucz, `refreshBuildHighlight()`; zaznaczenia NIE czyści |
| `onSelectFoundCity` / `onSelectWonder` | `:26758-26793` | przełączniki trybu + `refreshBuildHighlight()`; zaznaczenia NIE czyści |
| `exitBuildMode` | `:16526-16541` | zeruje przełączniki i klucz, `refreshBuildHighlight()` |
| `refreshBuildHighlight` | `:16351-16396` | zapisuje warstwę (`setHighlight`/`clearHighlight`), nie rusza `selectedId` ani pierścienia |
| handler ruchu myszy | `:32273-32278` | w trybie z kluczem/miastem/cudem czyści trasę (`clearPathRoute`) |

Pin ma JEDNĄ warstwę `setHighlight` — „ostatni zapis wygrywa”. Pierścień i trasa to osobne wywołania.

## 3. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/renderer/src/view/units.rs` | `HighlightPriority { Build (domyślny), Reachable }`; `unit_highlight(overlays, siege_map_panel_open, priority)` (nowy argument wg dispatchu); `reachable_call` (gałąź `selectPlayerUnit`: puste → brak, panel oblężenia → `Clear`); `UnitOverlayInputs::from_overlays_with_priority`; `from_overlays` = priorytet `Build` (Q6-2 bajt w bajt); nagłówek modułu: opis D-371-5b |
| `rust-port/renderer/src/view/frame.rs` | tylko przeprowadzenie argumentu: `FrameInputs::from_dto_with_priority(…, priority)`; `from_dto` deleguje z `Build`; `overlays.units` liczone przez `from_overlays_with_priority` + istniejąca bramka panelu oblężenia |
| `rust-port/client/src/lib.rs` | `ClientUiState::highlight_last_writer`; `BuildMode`; `in_build_mode` (= gałąź silnika `build_mode_open \|\| build_highlight_mode_active`); `RenderClient::select_unit`, `set_build_mode`, `set_active_improvement_key`, `set_highlight_last_writer`, prywatne `update_ui`; `present_ref` używa `from_dto_with_priority`; `set_ui` przenosi nowe pole; re-eksport `HighlightPriority` |
| `rust-port/renderer/tests/overlays_units_q6.rs` | +7 testów `t5b_*` (istniejące bez zmian) |
| `rust-port/renderer/tests/view_frame.rs` | +2 testy `t5b_*` (istniejące bez zmian) |
| `rust-port/client/tests/engine_bridge_renderer.rs` | +3 testy `t5b_*` (e2e silnik↔most↔klient↔renderer); import `BuildMode`, `HighlightPriority` |

Nie ruszano: `engine/`, `view-model/`, `src-tauri/`, `gra/**`, `Cargo.toml`, `renderer/Cargo.lock` (zmieniony
lokalnie przez `cargo test` bez `--locked` — cofnięty `git checkout` przed commitem, DŁUG-T1-LOCK), `REJESTR-RUST.md`,
`renderer/src/view.rs` (nowy typ dostępny przez publiczny moduł `civ_renderer::view::units`).

### Reguły klienta (D-371-5b)

- `select_unit(Some(id))` w trybie budowy: `selected_unit_id = id`, flaga `true`, pisarz `Reachable`.
  Poza trybem: flaga `false`, pisarz `Reachable` (warstwy budowy wtedy brak). `select_unit(None)`: `selected_unit_id
  = None`; poza trybem flaga `false`; pisarz bez zmian.
- `set_active_improvement_key`: pisarz `Build`; flaga i `selected_unit_id` NIE zerowane.
- `set_build_mode(BuildMode)`: przy zmianie przełączników flaga `false`, pisarz `Build`; zmiana `build_mode_open`
  (`onOpenBuild`) dodatkowo czyści `selected_unit_id` (`clearPlayerUnitSelection`, `:26703`), a zamknięcie panelu
  czyści klucz (`exitBuildMode`, `:16535`).
- `set_highlight_last_writer`: bez wywołania silnika (D-371-4), ponowna kompozycja z cache. Każda metoda: zmiana
  `RenderUiParams` → `GetRenderFrame`; sama zmiana pisarza → kompozycja z cache; wartość równa → nic.

## 4. Testy (bramki, EXIT 0)

`rust-port/renderer` (bez `--features gpu`):
- `cargo fmt --all -- --check` → EXIT 0
- `cargo clippy --all-targets -- -D warnings` → EXIT 0
- `cargo test --all-targets` → EXIT 0; łącznie 717 passed, 0 failed, 0 ignored (81 binarek);
  `view_frame` 23 (21 + 2), `overlays_units_q6` 13 (6 + 7).

`rust-port/client`:
- `cargo fmt --all -- --check` → EXIT 0
- `cargo clippy --locked --all-targets -- -D warnings` → EXIT 0
- `cargo test --locked --all-targets` → EXIT 0; `engine_bridge_renderer` 11 passed (8 + 3).

Wektor scenariusza webu:
- renderer na ręcznych DTO: `t5b_web_scenario_on_hand_dtos` (onOpenBuild → reselect → klucz → reselect, jeden renderer);
- e2e: `t5b_web_scenario_build_mode_reselect_end_to_end` — `set_build_mode(open)` → ramka bez zaznaczenia →
  `select_unit` (flaga `true`, `selection` + `reachable`, widoczny zasięg) → `set_active_improvement_key("farma")`
  (ramka z `selection` + `reachable` + niepustym `buildHighlight`, widoczna warstwa budowy, pierścień zostaje,
  flaga zostaje) → `set_highlight_last_writer` bez `GetRenderFrame` → ponowny `select_unit` bez `GetRenderFrame`
  (te same `RenderUiParams`) → zamknięcie panelu (flaga `false`, zaznaczenie i klucz wyczyszczone) → zwykłe
  zaznaczenie poza trybem (flaga `false`). Ramki porównywane z bezpośrednim `GetRenderFrame` fotela aktywnego.
- `t5b_mode_switch_zeroes_the_flag_and_key_change_keeps_it`, `t5b_setters_before_session_only_store`.

## 5. Mutanty (skrypt `scratchpad/t5brender/mutants.sh`, pliki przywrócone, `cmp` OK)

| Mutant | Wykryty przez |
|---|---|
| (a) stały priorytet Build | `t5b_reachable_writer_shows_the_range`, `t5b_reachable_writer_with_siege_map_panel_clears`, `t5b_web_scenario_on_hand_dtos`, e2e `t5b_web_scenario_…` |
| (b) stały priorytet Reachable | `q6_build_highlight_four_kinds`, `q6_siege_map_panel_clears_reachable_only`, `t5b_build_writer_shows_the_build_layer`, `t5b_ring_and_route_…`, `t5b_web_scenario_on_hand_dtos`, e2e |
| (c) flaga zerowana przy zmianie klucza | e2e `t5b_web_scenario_…`, `t5b_mode_switch_…` |
| (d) `select_unit` poza trybem budowy ustawia flagę | e2e `t5b_web_scenario_…` (krok 6) |
| (e) zmiana pisarza woła `GetRenderFrame` | e2e `t5b_web_scenario_…` (licznik wywołań) |
| (f) pierścień/`pathRoute` znika, gdy wygrywa Build | `t5b_ring_and_route_do_not_depend_on_the_writer`, `t5b_web_scenario_on_hand_dtos`, e2e |

## 6. Uwagi dla orkiestratora (rozbieżności D-371-5b względem pinu — techniczne, nie gameplay)

- **U-OP-1 (fallback przy pustym `reachable`):** dispatch: przy `Reachable` „zasięg pierwszy, jeśli niepusty, inaczej
  build”. Pin: `selectPlayerUnit` dla jednostki bez ruchu wywołuje `setHighlight(new Set())` (`:7256-7261`), więc
  krążków NIE ma (także budowy). Wdrożono wg dispatchu (test
  `t5b_reachable_writer_falls_back_to_build_when_range_is_empty`). Wierne pinowi byłoby `Clear`. Do decyzji
  orkiestratora w `REJESTR-RUST.md` (zmiana jednej linii w `unit_highlight`).
- **U-OP-2 (`onSelectFoundCity` / `onSelectWonder` przy otwartym panelu):** dispatch zeruje flagę przy zmianie
  `found_city_mode`/`wonder_active`; pin w tych handlerach (`:26758-26793`) nie czyści zaznaczenia, więc pierścień
  i zasięg zostają do następnego `refreshBuildHighlight` (który nadpisuje tylko warstwę). W Rust po zerowaniu flagi
  silnik (D-OP-3) ukrywa `selection`/`reachable`. Wdrożono wg dispatchu; `selected_unit_id` zachowane (czyści je
  tylko przełączenie panelu), test `t5b_mode_switch_…`. Wierne pinowi: zerować flagę tylko przy zmianie
  `build_mode_open`.
- **U-OP-3 (`exitBuildMode` przez Escape/PPM):** pin nie czyści zaznaczenia (`:16526-16541`), czyści tylko
  `onOpenBuild`. `set_build_mode` modeluje `onOpenBuild` (zmiana `build_mode_open` czyści zaznaczenie); ścieżka
  Escape bez czyszczenia nie ma osobnej metody (wołający może użyć `set_frame_ui`).
- **U-OP-4 (`select_unit(None)` w trybie budowy):** pin `clearHighlight()` czyści też warstwę budowy do następnego
  `refreshBuildHighlight`; Rust po `None` pokazuje warstwę budowy (flaga nieistotna bez `selected_unit_id`).

## 7. Długi

- **DŁUG-371-T5B-PLAN-PREVIEW** — `refreshPlannedMarchPreview` (`:7265-7267`) przy `selectPlayerUnit` nie odwzorowany
  (trasa planu marszu przy ponownym zaznaczeniu w trybie budowy).
- **DŁUG-D-OP-4-ISME-SIEGE** — brak `isMe` dla `selection` (`:7235`) i gałęzi panelu oblężenia (`:7250-7252`
  w numeracji dispatchu; faktycznie `:7253-7255`) po stronie silnika.
- **T3b** — typ TS `unitSelectedAfterBuildOpen` (strona TS/Tauri).
- **DŁUG-T1-LOCK** — `renderer/Cargo.lock` niekompletny dla `--locked` (bramka renderera bez `--locked`; plik cofnięty).
- U-OP-1…U-OP-4 powyżej (decyzje orkiestratora).

## 8. Commit

Gałąź `rust-port-wip/371-t5b-renderer-op-r1`, jeden commit (kod + ten raport); SHA podany w odpowiedzi
StructuredOutput Operatora i odczytywalny `git log -1 rust-port-wip/371-t5b-renderer-op-r1`.
