# R-RUSTPORT-P4-371-T1-FRAME-ADAPTER — jeden punkt wejścia renderera: DTO ramki → komplet wejść → MapScene (#371, T1)

STATUS: dispatch orkiestratora. Opus (3D/renderer/DTO), wszystkie etapy Opus. Podstawa: `dyspozycje/autobot/runs/R-RUSTPORT-P4-371-CLIENT-ROZP-Q1/00-rozpoznanie.md` §3 (T1), §4 (D-371-*), §5. Czytaj je PIERWSZE. Kod webu (pin `07d2fbd72`, `gra/src/**`) czytaj przez `git show 07d2fbd72:<ścieżka>` / `git grep` — NAJPIERW web, potem Rust (zasada 11). Nie zmieniaj `gra/`.
BAZA: `origin/rust-port/parity-v2` w chwili startu (SHA = `51f36370d` w dniu dispatchu; wpisz faktyczny SHA w raporcie). Przed startem: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.

## GOAL
Nowy moduł `rust-port/renderer/src/view/frame.rs`: z (`&MapViewDto`, `&RenderLayersDto`, `&MapUiState`, `siege_map_panel_open`) składa komplet wejść istniejących adapterów `view::*` i synchronizuje stan CPU renderera (`MapScene`) w kolejności odświeżeń webu. Bez reguł gry — wyłącznie przekierowanie do istniejących adapterów.
- `MapStatic::from_dto(&MapViewDto)` — części stałe na grę (`overlay_map`, `okolica_map`, `city_renderer`, `wonder_renderer`, scena terenu).
- `FrameInputs::from_dto(&MapStatic, &RenderLayersDto, &MapUiState, siege_map_panel_open)` — `terrain_data(map, hex_state)`, `FogSets::from_dto(map, fog, viewer.fog_active)`, `CityInputs::from_dto`, `WonderInputs::from_dto`, `overlay_layers(...)`, `UnitOverlayInputs::from_overlays(...).with_siege_map_panel_open(...)`; walidacja `contract_version == civ_view_model::CONTRACT_VERSION` (=2) z jawnym błędem (nie panika).
- `MapScene::apply(&FrameInputs)` — `sync`/`apply_*_fog`/`sync_units` w kolejności webu. Dokładną kolejność ustal z pinu i cytuj linie: `refreshFog` `main.ts:13475-13513`; miasta/cuda/bunt; `refreshTradeRoutesOverlay` `:15379-15397`; `refreshWorkerFieldOverlay` `:15432-15448`; terytorium/zasięgi `:15582-15647`; `refreshSiegeMarkers` `:17492-17530`; `unitRenderer.sync` `render/units.ts:6095-6263`; `syncPlayerUnitSelectionOnMap` `main.ts:7115-7135` (koniec funkcji = 7135, nie 7134); `refreshBuildHighlight` `:16351-16396`.

## ALLOWLISTA
`rust-port/renderer/src/view.rs` (WYŁĄCZNIE `pub mod frame;` + re-eksporty), `rust-port/renderer/src/view/frame.rs` (nowy), `rust-port/renderer/tests/view_frame.rs` (nowy), raporty runu w `dyspozycje/autobot/runs/R-RUSTPORT-P4-371-T1-FRAME-ADAPTER/`. Zakaz zmian w istniejących adapterach poza re-eksportem: jeśli adapter wymaga zmiany — STOP, zapisz BLOCK z uzasadnieniem (DODATEK orkiestratora). Zakaz zmian w `engine/`, `view-model/`, `src-tauri/`, `gpu/` (moduł `gpu` nietknięty), `Cargo.toml`/`Cargo.lock`.

## KRYTERIA KOŃCA
- Test na ręcznych DTO (wzorem `view_adapter_*`): komplet wejść dla ramki z miastem, jednostką, oblężeniem i mgłą.
- Błąd (nie panika) przy złej długości `hex_state` / `fog.state` oraz przy `contract_version != 2`.
- Test KOLEJNOŚCI (rejestrator wywołań albo porównanie stanu po `apply` z ręczną sekwencją adapterów w kolejności webu).
- Mutanty, każdy wykryty testem: zamiana kolejności mgła/miasta; pominięcie `apply_city_fog`; pominięcie `with_siege_map_panel_open`; zły próg `contract_version`.
- Idempotencja: dwa `apply` tej samej ramki dają ten sam stan (web woła `refreshFog()` ~69 razy).

## BRAMKI (EXIT 0), w `rust-port/renderer`, BEZ `--features gpu`
`cargo fmt --all -- --check`; `cargo clippy --locked --all-targets -- -D warnings`; `cargo test --locked --all-targets` (pełny, w tle `setsid nohup`, EXIT w logu). Wymaga >= 12 GB wolnego na starcie i braku innego buildu renderera (sprawdź `df -h /` i `pgrep -fa rustc`). Unikalny podkatalog scratchpadu `t1frame/…`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie tematu, target usuń po bramkach. Worktree sparse (`rust-port`, `dyspozycje`; pamiętaj o `src-tauri`, jeśli jakiś test czyta `src-tauri/src/lib.rs`; w trybie cone używaj `git sparse-checkout set --cone ...`, `init -q` nie istnieje).

## ZAKAZY
Brak `#[ignore]`, brak push/deploy/integracji (robi orkiestrator), brak `git add -A`, brak linii Co-Authored-By z nazwą modelu w commitach (dozwolona tylko `Claude-Session:`). Decyzje techniczne wpisz do raportu (orkiestrator przeniesie do `REJESTR-RUST.md`); gameplay poza webem → STOP.
Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; po FC integruje orkiestrator. Nazwy luk i długi z notatek FC (np. MAX_PER_SIDE=120 w `battle/field.rs` — NIE ten temat) opisz w sekcji „Długi”.
