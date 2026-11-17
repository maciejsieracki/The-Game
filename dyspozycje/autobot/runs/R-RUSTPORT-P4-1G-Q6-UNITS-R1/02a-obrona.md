# R-RUSTPORT-P4-1G-Q6-UNITS-R1: obrona Operatora, runda 1

STATUS: BLOCK (INFRA). Kod poprawiony, bramki celowane zielone. Pełna bramka renderera nadal nieuruchomiona, bo wolne jest 11 GB, a reguła wymaga co najmniej 12 GB.
DOMAIN: GAME=nie (DTO → renderer)
TEMAT: R-RUSTPORT-P4-1G-Q6-UNITS-R1
GOAL: adapter jednostek, zasięgu, trasy, podświetlenia budowy i zaznaczenia (DTO → `MapUnitRenderer`)
ZMIANY/COMMIT: kod obrony `7932b4891` (rodzic `dc4eb3423` → kod Operatora `92a91bcc3` → baza r2 `2760b4f0c`). Gałąź lokalna `rust-port-wip/P4-1G-Q6-UNITS-r1-obrona`, niewypchnięta. Pliki: `rust-port/engine/src/domain/overlays_view.rs`, `rust-port/renderer/src/view/units.rs`, `rust-port/renderer/tests/overlays_units_q6.rs`. Bez `Cargo.lock`, bez `#[ignore]`, trailer bez nazwy modelu.
RUNDY: 1/5 (obrona)
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 1. [INFRA] Bramki kompilacyjne i pełna bramka renderera: PRZYJMUJĘ częściowo
Bramki celowane odtworzyłem na kodzie obrony `7932b4891`. Działał tylko ten worktree (`ps`: 0 procesów cargo/rustc), wolne było 8,6–11 GB, a `CARGO_TARGET_DIR` w scratchpadzie usunąłem po bramkach.
- Silnik: `cargo fmt --check` EXIT 0. `cargo clippy --lib --tests` EXIT 0, 0 ostrzeżeń. `cargo test --lib q6_`: 4 passed, 0 failed. `cargo test --test view_overlays_reach_path`: 14 passed.
- Renderer: `cargo fmt --check` EXIT 0. `cargo clippy --all-targets -- -D warnings` EXIT 0. `cargo test --test overlays_units_q6`: 6 passed. `--lib`: 111 passed. `view_adapter_overlays`: 24 passed. `map_units_tokens`: 17 passed.
- Mutacje nowych asercji dały FAIL. Plik przywróciłem i sprawdziłem `cmp`:
  - `selection` ze `state.selected_unit_id` zamiast z wejścia → FAIL `q6_selection_z_wejscia_ui_nie_ze_stanu`;
  - `is_mine_improvement_key` wyłączone (`false &&`) → FAIL `q6_tryby_budowy_przez_agregator`.
- Mutacje (a)(b)(c) z rundy Operatora: ich nie powtarzałem. Odtworzenie zostaje dla FC.

ODRZUCAM w części dotyczącej pełnej bramki `cargo test --all-targets --no-fail-fast`. Operator nie może jej usunąć: wolne jest 11 GB (`df -h /` po bramkach), a dispatch wymaga co najmniej 12 GB. Zgodnie z dispatchem jest to BLOCK INFRA. Bramkę musi uruchomić FC albo orkiestrator, gdy będzie co najmniej 12 GB wolnego i nie będą trwały równoległe buildy renderera.

### 2. [GOAL] Brak wołającego w produkcji: PRZYJMUJĘ (status)
Potwierdzam: `unit_overlays_view`, `UnitOverlayInputs::apply` i `sync_units` są wołane tylko z testów. Produkcyjny most DTO z silnika do renderera to #308 (audyt L6). Renderer nie zależy od silnika (D-DTO-1 = A), a `Cargo.toml` jest poza allowlistą. Proponowany wpis w REJESTR-RUST (wpisuje orkiestrator, plik poza allowlistą):
> Q6 ADAPTER-UNITS: **adapter gotowy, niewołany w produkcji do #308** (nie ZINTEGROWANE w sensie wpięcia; por. #309).

### 3. [PARYTET] Q6-2 przy aktywnym trybie budowy i pustej liście heksów: PRZYJMUJĘ jako jawną rozbieżność (bez zmiany kontraktu)
Potwierdzam na pinie: `main.ts:16359`, `:16366` (`setHighlight(pusty Set)`), `:16387` (`clearHighlight`) i `:16391-16394` (pusty `setHighlight`). Rust w tym przypadku pokazuje `reachable`. DTO nie odróżnia sytuacji „tryb aktywny, brak heksów” od „brak trybu”, bo `no_layer()` daje `kind = Improvement` i puste `hexes`. Naprawa wymaga zmiany kontraktu, np. `Option<BuildHighlightDto>`, a nie zmiany w adapterze.
- Rozbieżność opisałem jawnie w nagłówku `rust-port/renderer/src/view/units.rs` (sekcja „KNOWN DIVERGENCE of Q6-2”), commit `7932b4891`.
- Proponowany wpis do REJESTR-RUST (wpisuje orkiestrator): „Znana rozbieżność Q6-2: aktywny tryb budowy z pustym zbiorem heksów → web czyści zasięg, Rust pokazuje `reachable`. Osobny temat: zmiana kontraktu `build_highlight` na `Option<BuildHighlightDto>` (view-model + producent + adapter).”
- Nie zmieniałem semantyki `reachable` w producencie, czyli nie zerowałem go w trybie budowy. Zmieniłoby to znaczenie pola DTO („Reachable hexes of the selected unit”). To decyzja kontraktowa orkiestratora.

### 4. [KONTRAKT] Q6-1 a dokumentacja SelectionUi (D-CMD-12): PRZYJMUJĘ (poprawka)
Wycofałem decyzję Q6-1. `UnitOverlaysInput` ma nowe pole `selection_ui: SelectionUi`, które podaje wołający. `unit_overlays_view` woła `selection(&input.selection_ui, &state.units)`, więc kontrakt D-CMD-12 i komentarz `SelectionUi` („`PlayableState.selected_unit_id` nie jest czytany”) znów są zgodne. Dokumentacja funkcji zapisuje dług: `reachable_overlay` i `path_route_overlay` (kontrakt F5) czytają `state.selected_unit_id`, więc most #308 musi podać tę samą wartość. Ujednolicenie źródła należy do orkiestratora.
Dowód: nowy test `q6_selection_z_wejscia_ui_nie_ze_stanu` sprawdza, że zaznaczenie idzie za wejściem UI, a nie za stanem. Mutacja daje FAIL (pkt 1).

### 5. [TESTY] Wektory ręczne, test apply częściowo tautologiczny: PRZYJMUJĘ częściowo
- PRZYJMUJĘ: do `q6_apply_matches_pin_calls_on_the_unit_renderer` dodałem asercje bezwzględne, niezależne od wywołań referencyjnych. `highlight().hexes == [(2,0),(3,0),(1,0)]` i `opacity == HIGHLIGHT_OPACITY` uzupełniają istniejące `disc_count == 3` i etykiety trasy `["1","2"]`.
- ODRZUCAM w tej rundzie automatyczne spięcie silnika z rendererem przez fixture JSON. Wymaga pliku poza allowlistą i ścieżki odczytu fixture'u między crate'ami albo dev-dependency w `Cargo.toml`, czyli zmiany D-DTO-1. Zgodnie z zarzutem decyzję podejmuje orkiestrator. Propozycja: dołączyć to do #308, bo most i tak połączy oba crate'y.

### 6. [POKRYCIE] Tryb Mine przez agregator: PRZYJMUJĘ (poprawka)
W `q6_tryby_budowy_przez_agregator` dodałem przypadek `kopalnia_miedzi` (`kopalnie` w `ulepszenia-budowa.json:72`): `kind == Mine`, `hexes == [(1,0),(2,0)]`. Mutacja daje FAIL (pkt 1).

### 7. [ALLOWLISTA] engine/src/domain/overlays_view.rs i renderer/src/view.rs: ODRZUCAM jako naruszenie (odstępstwo uzasadnione, do akceptacji orkiestratora)
Plik `view-model/src/overlays_view.rs` nie istnieje na bazie `2760b4f0c`. Numery linii z dispatchu (`build_highlight` ~:223, `path_route_overlay` ~:449) wskazują `engine/src/domain/overlays_view.rs`: na bazie `build_highlight` jest w :223, a `path_route_overlay` w :449. Zmiana jest addytywna (agregator i testy), bez zmiany kształtu DTO, czyli dokładnie w zakresie „tylko wywołanie”. `renderer/src/view.rs` ma tylko `pub mod units;` i re-eksport, a to jest wiring wymagany przez nowy moduł w `renderer/src/view/`. Obrona nie dotknęła innych plików poza tymi z rundy Operatora.

### 8. [DROBNY] with_siege_map_panel_open nie jest stosowane w overlay_layers: ODRZUCAM zmianę w tej rundzie (dokumentacja zostaje)
Żeby `overlay_layers` stosowało panel oblężenia, trzeba dodać pole do `MapUiState`. Literały `MapUiState { … }` bez `..` są w `renderer/tests/view_adapter_overlays.rs` (np. `ui_all_off`, :318), który leży poza allowlistą, więc taka zmiana zepsułaby kompilację testów. Wymóg jest opisany w docu `OverlayLayers::units` i `UnitOverlayInputs::from_overlays`. Proponuję wpisać go jako kryterium akceptacji dispatchu #308 („most woła `with_siege_map_panel_open(isSiegeMapPanelOpen)`”) albo dołączyć do #324/#333 (ujednolicenie `MapUiState`).

## TESTY
Jak w pkt 1. Pełna bramka renderera `cargo test --all-targets --no-fail-fast`: NIE URUCHOMIONO, NIE_ZMIERZONO (11 GB wolnego, wymagane co najmniej 12 GB).

## BLOKADY
1. INFRA: pełna bramka renderera (co najmniej 12 GB, bez równoległych buildów renderera).
2. Decyzje orkiestratora: wpis „adapter gotowy, niewołany do #308”, wpis rozbieżności Q6-2 albo temat `Option<BuildHighlightDto>`, akceptacja odstępstw z pkt 7, fixture z pkt 5, ujednolicenie źródła zaznaczenia z pkt 4, panel oblężenia w #308 lub #324 z pkt 8.

## NASTĘPNY KROK
Final Control: pełna bramka renderera na `7932b4891` (lub HEAD tej gałęzi), gdy będzie co najmniej 12 GB wolnego.
