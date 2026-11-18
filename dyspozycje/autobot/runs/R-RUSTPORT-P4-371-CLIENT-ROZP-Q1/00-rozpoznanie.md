# R-RUSTPORT-P4-371-CLIENT-ROZP-Q1 — rozpoznanie: klient jako produkcyjny wołający GetRenderMap / GetRenderFrame

```text
STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-RUSTPORT-P4-371-CLIENT-ROZP-Q1 (#371, [3D-7/4])
GOAL: rozpoznanie tylko do odczytu: stan, luki, podział na tematy Workflow, decyzje techniczne i ryzyka
      dla produkcyjnego wołającego EngineCommand::GetRenderMap / GetRenderFrame (most -> adapter -> renderer)
ZMIANY/COMMIT: brak commitu; jedyny plik = ten raport (niecommitowany, w bieżącym checkoucie claude/rust-sivvrn)
TESTY: pominięte (temat tylko do odczytu; zakaz cargo build/test w dispatchu)
BLOKADY: brak dla rozpoznania; dla tematu T3 (src-tauri) ryzyko BLOCK-INFRA: crate tauri offline (rejestr, wpis RENDER-FRAME r1)
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator: wpisać decyzje D-371-1..7 do REJESTR-RUST.md, napisać dispatch T0 i T1
DEPLOY/PUSH: NIE WYKONANO
```

Baza odczytu: `origin/rust-port/parity-v2` = `38f5939e2c74f553c5f1c3928ee7a66cf1f0df5a` (2026-11-18 10:57 UTC).
Pin webu: `07d2fbd72` (`gra/src/main.ts`). Wolne miejsce na `/` w chwili odczytu: 13 GB.
Wszystkie numery linii poniżej podaję dla tej bazy (`git show origin/rust-port/parity-v2:<plik>`).

---

## 1. STAN — co istnieje dziś na parity-v2

### 1.1 Silnik i most (producent)

| Element | Plik:linie | Stan |
|---|---|---|
| Wariant `EngineCommand::GetRenderMap` | `rust-port/engine/src/bridge.rs:70-72` | jest; odpowiedź `BridgeResult::RenderMap { map }` (`:137-140`), bez zdarzenia `StateChanged` |
| Wariant `EngineCommand::GetRenderFrame { seat, ui }` | `bridge.rs:73-84` | jest; `seat: None` = aktywny fotel (`ME()`), `ui: None` = brak zaznaczenia i trybu budowy |
| Obsługa w dyspozytorze `EngineBridge::handle` | `bridge.rs:304-361` (gałęzie `:321-344`) | zapytania tylko do odczytu, zwracane przed `execute`, `events = []` |
| `EnginePort::render_map` / `render_frame` (domyślnie odrzucają) | `bridge.rs:256-276` | adaptery bez sesji (`MockEngineAdapter`) odrzucają |
| `CivEngineAdapter::render_map` / `render_frame` | `bridge.rs:449-463` | woła `render_frame::render_map(state)` i `session_render_frame(&mut game, seat, &ui)` |
| `RenderUiParams` (stan UI klienta) | `rust-port/engine/src/domain/render_frame.rs:125-156` | pola: `selected_unit_id`, `hover`, `found_city_mode`, `wonder_active`, `build_mode_open`, `active_improvement_key`; `#[serde(default, rename_all = "camelCase", deny_unknown_fields)]` |
| `RenderMapPayload(MapViewDto)` / `RenderFramePayload(RenderLayersDto)` | `render_frame.rs:157-171` | `#[serde(transparent)]`, opakowanie tylko dla `Eq` |
| Składacz ramki `build_render_frame` | `render_frame.rs:906-1121` | mgła jak `refreshFog` (kumuluje `explored_by_human` w sesji), wszystkie pola `RenderLayersDto`; przy `build_mode_open` lub aktywnym trybie podświetlenia zwraca ramkę bez `selection`/`reachable`/`pathRoute` (`:1089-1093`, D-OP-3) |
| `session_render_frame` | `render_frame.rs:1494-1502` | `seat` domyślnie `fog.active_seat` |
| Jawne luki ramki `RENDER_FRAME_GAPS` | `render_frame.rs:271-293` | `overlays.workerFields = []`, `stacks.starvingRepIds/goldDeficitRepIds = []` (zależność #310/#304 EKONOMIA) |
| Wartości domyślne ze stałych `RENDER_FRAME_STATE_DEFAULTS` | `render_frame.rs:295-348` | m.in. `battle = None`, `tradeRoutes = []`, brak kolejki/buntu miast |
| `GetRenderLayers` (starsze zapytanie, tylko mgła i terytorium) | `bridge.rs:61-69`, `engine/src/domain/dto_bridge.rs:322` (`build_view_layers`) | jest; ramka pełna używa tego samego `build_view_layers` |
| Testy mostu | `rust-port/engine/tests/p4_364_render_frame.rs`, `p4_364_bridge_layers.rs`, `p4_364_dto_bridge.rs`, `bridge_add_player.rs` | każdy włącza `bridge.rs` przez `#[path = "../src/bridge.rs"] mod bridge;` |

Uwaga strukturalna: `bridge.rs` NIE jest modułem biblioteki `civ-engine` (brak `mod bridge` w `engine/src/lib.rs`).
Każdy konsument dołącza go własną kopią przez `#[path]` (`src-tauri/src/lib.rs:8-9`, testy engine, root
`tests/bridge_contract.rs:3-4`). Typy `EngineBridge`, `BridgeResult` itd. mają więc osobną tożsamość w każdym crate.
Typy ładunków (`RenderMapPayload`, `RenderFramePayload`, `RenderUiParams`) są natomiast w bibliotece
(`civ_engine::domain::render_frame`) i mają jedną tożsamość.

### 1.2 Powłoka Tauri (`src-tauri`)

| Element | Plik:linie | Stan |
|---|---|---|
| Zależności | `src-tauri/Cargo.toml` | `civ-engine` (path), `tauri =2.11.5`, `serde`; **brak** `civ-renderer` i `civ-view-model`; `rust-version = "1.77.2"` (renderer wymaga 1.87) |
| Most | `src-tauri/src/lib.rs:8-9` | `#[path = "../../rust-port/engine/src/bridge.rs"] pub mod bridge;` |
| Stan silnika | `lib.rs:16-23` | `EngineStateHandle(Mutex<EngineBridge<CivEngineAdapter>>)` |
| Jedyna komenda | `lib.rs:28-48` (`engine_command`) | przekazuje dowolny `BridgeRequest` do `handle`, emituje zdarzenia, zwraca odpowiedź; nie woła sam `GetRenderMap`/`GetRenderFrame` i nie ma renderera |
| Konfiguracja okna | `src-tauri/tauri.conf.json` | `frontendDist: "frontend"` (stary `src-tauri/frontend/main.js`), nie `frontend-v2`; brak powierzchni wgpu |
| Osadzenie wgpu pod webview | `rust-port/spike-gpu-embed/` (D-RR-2 = A, `src/app/mod.rs:1-12`) | tylko spike; nie ma go w `src-tauri` |

Wniosek: dziś **żaden kod produkcyjny** nie wysyła `GetRenderMap` ani `GetRenderFrame`; wołają je wyłącznie testy engine.

### 1.3 Frontend-v2 (webview)

| Element | Plik:linie | Stan |
|---|---|---|
| Typy komend | `src-tauri/frontend-v2/src/controller/commands.ts:30-36` | unia `EngineCommand` ma tylko `create_session`, `add_player`, `select_unit`, `move_unit` (bez `attack_unit_id`), `advance_turn`, `get_state`; **brak** `cancel_planned_march`, `declare_war`, `get_render_layers`, `get_render_map`, `get_render_frame` |
| Typ odpowiedzi | `commands.ts:72-77` (`result` w linii 76) | `result: { kind: 'state'; state: S }` — brak `render_layers`/`render_map`/`render_frame` |
| Transport | `controller/transport.ts:1-48` | adapter Tauri przez `window.__TAURI__`; komentarz `:6-7`: domyślnie MOCK, przełączenie = osobny temat |
| Rysowanie mapy | `frontend-v2/src/main.ts` | brak rysowania mapy (grep `three|canvas|webgl|renderer` bez trafień w `main.ts`); panele HUD na DTO z atrapy |

### 1.4 Renderer (konsument) — adaptery `view`

`rust-port/renderer/Cargo.toml`: zależy od `civ-view-model` (nie od engine); feature `gpu` domyślnie **wyłączony**
(`[features] default = []`, `gpu = ["dep:wgpu"]`), moduł `gpu` tylko pod `#[cfg(feature = "gpu")]`
(`renderer/src/lib.rs:50-51`). Wszystkie adaptery `view` i synchronizacje są CPU — budują się i testują bez GPU
(CI `rust-renderer.yml`: `cargo test --locked --all-targets` bez `--features gpu` jest osobnym krokiem).

| Wejście renderera | Adapter (plik:linie) | Z którego pola DTO |
|---|---|---|
| teren | `view/terrain.rs:123` `terrain_data(map, hex_state)`, `:159` `terrain_scene_options`, `:226` `overlay_map`, `:245` `okolica_map`, `:289` `apply_terrain_fog` | `MapViewDto` + `RenderLayersDto.hex_state` |
| mgła | `view/fog.rs:66` `FogSets::from_dto(map, fog, fog_active)`, `:186` `FogReveal::from_dto` | `fog`, `viewer.fog_active` |
| miasta, cuda, bunt | `view/cities.rs:113` `city_renderer(map)`, `:253` `CityInputs::from_dto(owners, cities)`, `:356` `sync`, `:378` `sync_with_revolt`, `:397` `apply_city_fog`, `:439` `WonderInputs::from_dto`, `:485` `apply_wonder_fog` | `owners`, `cities`, `wonders` |
| plakietki StatChip | `cities/sync/stat_chips.rs:56-63`, `:205`, `:241`, `:293` | `cities` + `MapUiState` (już zunifikowane: `StatChipUiState` nie istnieje, chipy biorą `&MapUiState`; zadania #324/#333 są w praktyce wykonane — do potwierdzenia w rejestrze) |
| nakładki (jeden punkt wejścia) | `view/overlays.rs:897-915` `OverlayLayersInput`, `:951-974` `overlay_layers(input, ui)` -> `OverlayLayers` (`:917-945`) | `territory`, `overlays`, `sieges`, `owners`, `viewer` + `FogSets` |
| stan UI mapy | `view/overlays.rs:183-221` `MapUiState` (+ `WEB_INITIAL`) | stan klienta, nie DTO |
| jednostki i stosy | `view/units.rs:228-236` `sync_units(renderer, units, stacks, ui)`; `:164-221` `UnitOverlayInputs` (reachable, buildHighlight nie-kopalnia, selection, pathRoute; `with_siege_map_panel_open`) | `units`, `stacks`, `overlays` |
| bitwa | `view/battle.rs:188` `battle_inputs`, `:222` `battle_view_inputs` | `battle` (dziś zawsze `None`) |

**Czego brakuje po stronie renderera:** w `renderer/src` nie ma ani jednego użycia `RenderLayersDto`
(grep: trafienia tylko `MapViewDto` w adapterach). Każdy adapter bierze kawałek DTO; nie istnieje funkcja ani
struktura, która z pary (`MapViewDto`, `RenderLayersDto`, stan UI) składa komplet wejść i woła synchronizacje
w kolejności webu. Testy adapterów (`renderer/tests/view_adapter_{core,terrain,cities,overlays,battle}.rs`,
`overlays_units_q6.rs`) używają ręcznie zbudowanych DTO, nie wyjścia engine.

### 1.5 Testy kontraktu w katalogu głównym

`tests/bridge_contract.rs` (249 linii): `#[path = "../rust-port/engine/src/bridge.rs"] mod bridge;` (`:3-4`),
`include_str!("../src-tauri/src/lib.rs")` (`:13`), funkcja `state_from` z `match result { BridgeResult::State { state } => state }`
(`:15-19`) — **niewyczerpująca** od czasu dodania `RenderLayers`/`RenderMap`/`RenderFrame`; test powłoki
`:239-249` sprawdza napisy w `lib.rs` (`#[tauri::command]`, `fn engine_command`, `generate_handler![engine_command]`,
`event.channel()`, `app.emit(`, nazwy komendy i zdarzenia). W repo nie ma `Cargo.toml` w katalogu głównym, a żaden
workflow CI (`rust-engine.yml`, `rust-renderer.yml`, `tauri-windows.yml`) nie kompiluje `tests/`; plik jest martwy
(dług PORZĄDEK-BRIDGE-CONTRACT-ROOT, #374). Obok leżą `tests/bridge_contract.cjs` i `tests/frontend_contract.cjs`
— czy cokolwiek je dziś uruchamia: NIE_ZMIERZONO (ostatni ślad: `runs/R-RUSTREAL-PLAYABLE-SLICE-Q1/04-evidence.json`).

---

## 2. LUKI do produkcyjnego wołającego

| ID | Luka | Gdzie | Skutek |
|---|---|---|---|
| L1 | Brak wołającego produkcyjnego `GetRenderMap`/`GetRenderFrame` | `src-tauri/src/lib.rs` (tylko przekaźnik `engine_command`) | ramki powstają tylko w testach |
| L2 | Brak składania `RenderLayersDto` w komplet wejść renderera (jeden punkt wejścia + kolejność synchronizacji wg webu) | `renderer/src/view*` | każdy wołający musiałby powtórzyć ~15 wywołań adapterów; ryzyko złej kolejności (np. mgła po miastach) |
| L3 | Dwa rozłączne stany UI: `RenderUiParams` (engine: zaznaczenie, hover, tryby budowy) i `MapUiState` (renderer: przełączniki, panel miasta, `forceVisibleUnitId`, hover chipa) + `siege_map_panel_open` (`UnitOverlayInputs::with_siege_map_panel_open`) | `render_frame.rs:125-140`, `view/overlays.rs:183-202`, `view/units.rs:175-190` | brak jednego właściciela stanu UI po stronie klienta |
| L4 | Brak stanu klienta: cache `MapViewDto` (raz na grę), ostatnia ramka, reguła odświeżania (po której komendzie i którym zdarzeniu UI) | — | nie wiadomo, kiedy wołać ramkę |
| L5 | DŁUG-FRAME-RESELECT: ramka jest bezstanowa; przy `build_mode_open = true` zawsze czyści `selection`/`reachable`/`pathRoute` (`render_frame.rs:1089-1093`), a renderer Q6-2 (`view/units.rs:25-30`) daje pierwszeństwo podświetleniu budowy nad `reachable` | engine + renderer | web: `onOpenBuild` czyści zaznaczenie (`main.ts:26702-26703`), ale `selectPlayerUnit` (`main.ts:7233-7260`) przy otwartym panelu NIE zamyka trybu i woła `unitRenderer.setHighlight(reachable)` + `setSelectionHex` — ostatnie wywołanie wygrywa (jedna warstwa `setHighlight`), aż kolejne `refreshBuildHighlight()` (18 miejsc, m.in. `:16416`, `:16539`, `:26718-26793`, `:32497`) nadpisze je z powrotem. Rust nie potrafi tego wyrazić |
| L6 | Typy TS mostu nieaktualne (brak 5 wariantów komend i 3 wariantów wyniku) | `frontend-v2/src/controller/commands.ts:30-36`, `:76` | webview nie może poprawnie zadeklarować kontraktu |
| L7 | Root `tests/bridge_contract.rs` martwy i niewyczerpujący | `tests/bridge_contract.rs:15-19` | fałszywe poczucie pokrycia kontraktu powłoki |
| L8 | Brak testu „engine -> most -> adapter -> renderer CPU” | — | nikt nie sprawdza, że wyjście składacza przechodzi walidacje adapterów (długości równoległe do `map.hexes`, właściciele w `owners[]`, `NotYetPorted` z `MapUnitRenderer::sync`, `map_units/mod.rs:290-296`) |
| L9 | `src-tauri` nie ma renderera, a jego MSRV 1.77.2 < 1.87 renderera; build Tauri offline niemożliwy w kontenerze (rejestr: „`src-tauri cargo check` NIE_ZMIERZONO (brak crate `tauri` offline)”) | `src-tauri/Cargo.toml` | wpięcie bezpośrednio w `src-tauri` nie da się zbramkować w kontenerze |
| L10 | Brak powierzchni wgpu w `src-tauri` (osadzenie istnieje tylko w spike) | `rust-port/spike-gpu-embed` | „produkcyjny wołający” w tym temacie może zasilić tylko stan CPU renderera; rysowanie na ekranie = osobny temat GPU-EMBED (poza #371) |

Luki wejściowe, które NIE są przedmiotem #371 (produkuje je engine, klient tylko przenosi): `RENDER_FRAME_GAPS`
(workerFields, starving/goldDeficit; #310/#304), `battle = None` (I5 #370, K5LOOP-WIRING #369).

---

## 3. PODZIAŁ na tematy Workflow

Zasada wiodąca: **cała logika klienta poza Tauri**, w nowym, lekkim crate bez `tauri` i bez `gpu`; `src-tauri` dostaje
tylko cienki klej. Dzięki temu test integracyjny „engine -> most -> adapter -> renderer CPU” buduje się w kontenerze
(engine + view-model + renderer CPU), bez ciężkiego i offline-niedostępnego buildu Tauri.

**Jeden build renderera naraz:** T1, T2 i T5b kompilują renderer — idą ściśle sekwencyjnie. T0 i T5a kompilują tylko
engine — mogą iść równolegle do jednego tematu renderera. T3 to klej + TS; build Tauri tylko w CI Windows.
Modele: wszystkie tematy to 3D/renderer/DTO -> Opus (polecenie właściciela „tylko 3D na Opus”); T0 i T3b mogłyby być
Haiku, ale zostawiam decyzję orkiestratorowi wg reguł sesji.

### T0 — `R-RUSTPORT-P4-371-T0-BRIDGE-CONTRACT-ROOT` (= #374)

- **GOAL:** kontrakt powłoki i mostu z root `tests/bridge_contract.rs` kompilowany i uruchamiany przez CI engine; `match` wyczerpujący.
- **Allowlista:** `tests/bridge_contract.rs` (usunięcie), `rust-port/engine/tests/bridge_contract.rs` (nowy; ścieżki `#[path = "../src/bridge.rs"]` i `include_str!("../../../src-tauri/src/lib.rs")`), raporty runu.
- **Kryteria końca:** `state_from` z jawnymi gałęziami dla `RenderLayers`/`RenderMap`/`RenderFrame` (panic z nazwą wariantu, bez `_ =>`); wszystkie dotychczasowe asercje zachowane 1:1; nowy test, że `GetRenderMap`/`GetRenderFrame` przez `EngineBridge<CivEngineAdapter>` dają `events.is_empty()` i odpowiedni wariant; mutant „usuń gałąź RenderFrame” = błąd kompilacji (non-exhaustive).
- **Bramki:** w `rust-port/engine`: `cargo fmt --all -- --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test bridge_contract`, pełny `cargo test --all-targets` przed FC.
- **Kolejność:** przed T3 (T3 zmienia `src-tauri/src/lib.rs`, a test sprawdza jego napisy). Może iść równolegle z T1.
- **Dysk/build:** tylko engine (~6–7 GB targetu wg poprzednich bramek), bez renderera. Wymaga >= 8 GB.
- Odchylenie od kolejności w rejestrze (#374 „po #371”): proponuję zrobić PRZED klejem T3 — inaczej T3 zmienia plik, którego kontrakt jest dziś martwy.

### T1 — `R-RUSTPORT-P4-371-T1-FRAME-ADAPTER` (renderer)

- **GOAL:** jeden punkt wejścia w rendererze: z (`&MapViewDto`, `&RenderLayersDto`, `&MapUiState`, `siege_map_panel_open`) składa komplet wejść i synchronizuje stan CPU renderera w kolejności odświeżeń webu.
- **Allowlista:** `rust-port/renderer/src/view.rs` (tylko `pub mod frame;` + re-eksporty), `rust-port/renderer/src/view/frame.rs` (nowy), `rust-port/renderer/tests/view_frame.rs` (nowy), raporty runu. Zakaz zmian w istniejących adapterach poza dodaniem re-eksportu (jeśli adapter wymaga zmiany — STOP i DODATEK).
- **Zawartość (do weryfikacji przez Operatora z pinem):**
  - `MapStatic::from_dto(&MapViewDto)` — części stałe na grę: `overlay_map`, `okolica_map`, `city_renderer`, `wonder_renderer`, scena terenu;
  - `FrameInputs::from_dto(&MapStatic, &RenderLayersDto, &MapUiState, siege_map_panel_open)` — `terrain_data(map, hex_state)`, `FogSets::from_dto(map, fog, viewer.fog_active)`, `CityInputs::from_dto`, `WonderInputs::from_dto`, `overlay_layers(...)`, `UnitOverlayInputs::from_overlays(...).with_siege_map_panel_open(...)`; walidacja `contract_version == civ_view_model::CONTRACT_VERSION` (=2) z jawnym błędem;
  - `MapScene::apply(&FrameInputs)` — wywołania `sync`/`apply_*_fog`/`sync_units` w kolejności webu: najpierw `refreshFog` (`main.ts:13475-13513`), potem miasta/cuda/bunt, nakładki (`refreshTradeRoutesOverlay` `:15379-15397`, `refreshWorkerFieldOverlay` `:15432-15448`, terytorium/zasięgi `:15582-15647`, `refreshSiegeMarkers` `:17492-17530`), jednostki (`unitRenderer.sync`, `render/units.ts:6095-6263`) i podświetlenia (`syncPlayerUnitSelectionOnMap` `:7114-7135`, `refreshBuildHighlight` `:16351-16396`). Dokładną kolejność Operator ustala z pinu i cytuje linie.
  - Bez reguł gry; jedynie przekierowanie do istniejących adapterów.
- **Kryteria końca:** test na ręcznych DTO (wzorem `view_adapter_*`): komplet wejść dla ramki z miastem, jednostką, oblężeniem, mgłą; błąd przy złej długości `hex_state`/`fog.state`; błąd przy `contract_version != 2`; test kolejności (np. rejestrator wywołań albo porównanie stanu po `apply` z ręczną sekwencją adapterów); mutanty: zamiana kolejności mgła/miasta, pominięcie `apply_city_fog`, pominięcie `with_siege_map_panel_open` — każdy wykryty.
- **Bramki:** w `rust-port/renderer`: `cargo fmt --all -- --check`, `cargo clippy --locked --all-targets -- -D warnings`, `cargo test --locked --all-targets` (bez `gpu`). `--features gpu` NIE jest wymagany (moduł `gpu` nietknięty) — do potwierdzenia przez FC na podstawie diffu.
- **Kolejność:** pierwszy temat renderera; równolegle wolno puścić T0 (engine).
- **Dysk/build:** build renderera; wymaga >= 12 GB wolnego i braku innego buildu renderera (w chwili odczytu trwa DOC-DEBTS-R2 `wf_7054f6c4-478` — T1 startuje po jego zakończeniu).

### T2 — `R-RUSTPORT-P4-371-T2-CLIENT-CORE-E2E` (nowy crate + test end-to-end)

- **GOAL:** crate klienta bez Tauri i bez GPU, który jest właścicielem stanu UI i reguły odświeżania, woła `GetRenderMap`/`GetRenderFrame` przez interfejs mostu i zasila `MapScene` z T1; test „engine -> most -> adapter -> renderer CPU”.
- **Allowlista:** `rust-port/client/Cargo.toml`, `rust-port/client/Cargo.lock`, `rust-port/client/.cargo/config.toml` (jak w rendererze, jeśli potrzebny), `rust-port/client/.gitignore`, `rust-port/client/src/**`, `rust-port/client/tests/**`, raporty runu. Nazwa crate: `civ-client` (decyzja D-371-1). Bez zmian w `engine/`, `renderer/`, `view-model/`.
- **Zawartość:**
  - `ClientUiState { frame_ui: RenderUiParams, map_ui: MapUiState, siege_map_panel_open: bool }` (D-371-3), start = `RenderUiParams::default()` + `MapUiState::WEB_INITIAL` + `false`;
  - trait `RenderSource { fn render_map(&mut self) -> Result<RenderMapPayload, E>; fn render_frame(&mut self, seat: Option<u64>, ui: Option<RenderUiParams>) -> Result<RenderFramePayload, E>; }` — implementację nad `EngineBridge` daje wołający (src-tauri, test), bo `bridge.rs` jest dołączany przez `#[path]` (D-371-1);
  - `RenderClient`: `on_session_created()` -> `GetRenderMap` + `MapStatic`; `on_state_changed()` i `set_ui(...)` -> `GetRenderFrame` + `MapScene::apply`; cache ostatniej ramki;
  - test e2e w `rust-port/client/tests/engine_bridge_renderer.rs`: `#[path = "../../engine/src/bridge.rs"] mod bridge;`, `EngineBridge<CivEngineAdapter>`; scenariusz: `CreateSession` -> `GetRenderMap` -> `GetRenderFrame` (bez UI) -> `SelectUnit`/ui z `selected_unit_id` -> `MoveUnit` -> `GetRenderFrame` -> `AdvanceTurn` -> `GetRenderFrame`; asercje: wszystkie adaptery przyjmują wyjście składacza bez błędu, liczba wpisów miast/jednostek w stanie renderera = liczba w DTO, `selection`/`reachable` niepuste po zaznaczeniu, puste przy `build_mode_open`, eksploracja nie maleje, idempotencja: dwa `GetRenderFrame` bez zmiany stanu dają identyczne DTO (web woła `refreshFog()` 69 razy w `main.ts` — klient musi móc wołać ramkę wielokrotnie).
- **Kryteria końca:** test e2e zielony; mutanty: (a) pominięcie `on_session_created` przed ramką -> jawny błąd, nie panika; (b) podanie `seat` innego niż aktywny -> ramka innego fotela wykryta asercją; (c) zgubienie `selected_unit_id` w `ClientUiState` -> asercja `selection`.
- **Bramki:** w `rust-port/client`: `cargo generate-lockfile` (z `[resolver] incompatible-rust-versions = "fallback"` i `rust-version = "1.87"`), `cargo fmt --all -- --check`, `cargo clippy --locked --all-targets -- -D warnings`, `cargo test --locked --all-targets`. CI dla nowego crate (`.github/workflows/rust-client.yml`) — opcjonalnie w tym temacie, jeśli orkiestrator dopisze plik do allowlisty.
- **Kolejność:** po integracji T1 (zależy od `view::frame`).
- **Dysk/build:** kompiluje engine (lib) + renderer (lib) + view-model: liczy się jako build renderera; >= 12 GB, nic innego z rendererem w tym czasie. `CARGO_TARGET_DIR` w worktree, usuwany po bramce.

### T3 — `R-RUSTPORT-P4-371-T3-TAURI-GLUE` (klej powłoki) + T3b typy TS

- **GOAL:** `src-tauri` jako produkcyjny wołający: implementuje `RenderSource` nad swoim `EngineBridge` (wysyła `BridgeRequest` z `GetRenderMap`/`GetRenderFrame` przez `handle`), trzyma `RenderClient` obok silnika, po każdej mutującej komendzie z `StateChanged` odświeża ramkę; nowa komenda Tauri do zmiany stanu UI mapy (`set_map_ui`).
- **Allowlista T3:** `src-tauri/Cargo.toml` (dodać `civ-client` path; `rust-version` -> `1.87`), `src-tauri/Cargo.lock`, `src-tauri/src/lib.rs`, `rust-port/engine/tests/bridge_contract.rs` (aktualizacja asercji napisów, jeśli T0 już przeniósł plik), raporty.
- **Allowlista T3b (osobny, mały temat, bez Rust):** `src-tauri/frontend-v2/src/controller/commands.ts` — dopisać warianty `cancel_planned_march`, `declare_war`, `get_render_layers`, `get_render_map`, `get_render_frame` (z `RenderUiParams` w camelCase: `selectedUnitId`, `hover`, `foundCityMode`, `wonderActive`, `buildModeOpen`, `activeImprovementKey`), `attack_unit_id?` w `move_unit`, warianty wyniku `render_layers`/`render_map`/`render_frame`, typ `set_map_ui`. Bramki: `npm run typecheck`, `npm run check` w `frontend-v2` (bez `vite build` w `gra/`).
- **Kryteria końca T3:** `engine_command` bez zmiany sygnatury (asercje kontraktu powłoki z T0 zielone); ramka liczona w powłoce, nie w webview (D-371-2); brak duplikatu stanu gry w kliencie (tylko stan UI i cache DTO).
- **Bramki T3:** `cargo fmt --check` w `src-tauri`; `cargo check` w kontenerze = NIE_ZMIERZONO, jeśli brak crate `tauri` offline (raport musi to jawnie zapisać jako BLOCK-INFRA albo PASS-WITH-NOTES z dowodem z CI `tauri-windows.yml` na gałęzi wip uruchomionym przez orkiestratora); test engine `bridge_contract` zielony.
- **Kolejność:** po T0 i T2. T3b może iść w dowolnym momencie (bez cargo).
- **Dysk/build:** jeśli `cargo check` w `src-tauri` w ogóle ruszy — kompiluje tauri + renderer; traktować jak build renderera (>= 12 GB, jeden naraz).
- Poza zakresem: osadzenie powierzchni wgpu w `src-tauri` i przełączenie `frontendDist` na `frontend-v2` (osobne tematy; dziś okno serwuje stary `frontend`).

### T5 — DŁUG-FRAME-RESELECT (dwa tematy, sekwencyjnie)

- **T5a `R-RUSTPORT-P4-371-T5A-FRAME-RESELECT-ENGINE`** (engine): addytywne pole w `RenderUiParams` (np. `unit_selected_after_build_open: bool`, `#[serde(default)]`), które przy otwartym trybie budowy przywraca `selection`/`reachable`/`pathRoute` z `selected_unit_id` i zachowuje `buildHighlight` (warstwa kopalni dalej rysowana — web nie czyści jej w `selectPlayerUnit`). Allowlista: `engine/src/domain/render_frame.rs`, `engine/tests/p4_364_render_frame.rs` (lub nowy plik testu), raporty. Bramki engine pełne. Build: engine; może iść równolegle z T1/T2.
- **T5b `R-RUSTPORT-P4-371-T5B-FRAME-RESELECT-RENDERER`** (renderer + client): w rendererze wybór warstwy podświetlenia z flagi stanu UI zamiast stałego pierwszeństwa Q6-2 (`view/units.rs` `unit_highlight`, `:115-129`); w kliencie `ClientUiState` ustawia flagę przy `select_unit` w trybie budowy i zeruje ją przy każdej zmianie trybu budowy (odpowiednik `refreshBuildHighlight()`). Allowlista: `renderer/src/view/units.rs`, `renderer/tests/overlays_units_q6.rs`, `client/src/**`, `client/tests/**`. Build renderera — po T2.
- Kryteria końca obu: wektor scenariusza webu: `onOpenBuild` (zaznaczenie wyczyszczone) -> `selectPlayerUnit` (reachable + pierścień widoczne, panel budowy otwarty) -> zmiana klucza ulepszenia (`refreshBuildHighlight`, podświetlenie budowy wraca); mutant „stałe pierwszeństwo budowy” wykryty.

### Kolejność zbiorcza i sloty

| Krok | Temat | Build | Równolegle wolno |
|---|---|---|---|
| 1 | T0 BRIDGE-CONTRACT-ROOT | engine | T1 (po DOC-DEBTS-R2) |
| 1 | T1 FRAME-ADAPTER | renderer | T0, T5a |
| 2 | T5a FRAME-RESELECT-ENGINE | engine | T1 lub T2 |
| 3 | T2 CLIENT-CORE-E2E | renderer (+engine lib) | T0/T5a jeśli jeszcze trwają |
| 4 | T5b FRAME-RESELECT-RENDERER | renderer | T3b |
| 5 | T3 TAURI-GLUE | tauri (CI Windows) | T3b |
| dowolnie | T3b TS-TYPES | node (bez cargo) | wszystko |

---

## 4. DECYZJE techniczne (do REJESTR-RUST.md) i pytania

Wszystkie poniżej są techniczne (jak przenieść dane), web rozstrzyga zachowanie — **bez pytań ABC do właściciela**.

- **D-371-1 (granica crate):** logika klienta w nowym crate `rust-port/client` (`civ-client`, `publish = false`, osobny `[workspace]`, `rust-version = "1.87"`), zależności: `civ-engine`, `civ-view-model`, `civ-renderer` (bez `gpu`). Interfejs do mostu przez trait na typach ładunków z biblioteki (`RenderMapPayload`, `RenderFramePayload`, `RenderUiParams`), nie przez `BridgeResult`, bo `bridge.rs` jest dołączany przez `#[path]` i każdy crate ma własną kopię typów (`src-tauri/src/lib.rs:8-9`). Uzasadnienie: test e2e bez Tauri (L9), jedna tożsamość typów ładunków, brak zmian w `engine/src/lib.rs`. Odrzucone: (a) renderer z dev-dependency na engine — dokłada kompilację engine do każdego CI renderera i miesza konsumenta z producentem; (b) logika w `src-tauri` — niebudowalna w kontenerze.
- **D-371-2 (kto woła ramkę):** produkcyjnym wołającym jest strona Rust powłoki (w procesie), nie webview. Uzasadnienie: D-RR-2 = A (wgpu pod przezroczystym webview w tym samym oknie, `spike-gpu-embed/src/app/mod.rs:3-6`) — renderer żyje w procesie Rust, więc przesyłanie `RenderLayersDto` przez IPC do JS i z powrotem jest zbędne. Webview wysyła tylko zdarzenia UI (`set_map_ui`) i komendy gry. Warianty `get_render_*` w TS (T3b) są dla kompletności kontraktu/diagnostyki.
- **D-371-3 (jeden stan UI w kliencie):** `ClientUiState` = `RenderUiParams` (to, co web trzyma w `selectedId`, `hoverKey`, `foundCityMode`, `activeWonderId`, `buildModeOpen`, `activeImprovementKey`; `render_frame.rs:127-140`) + `MapUiState` (`territoryBorderVisible`, `showTradeRoutesOverlay`, `showWorkerOverlay`, `isCityPanelOpen`, `cityPanelViewCityId`, `forceVisibleUnitId`, `statChipHoverCityId`; `view/overlays.rs:183-202`) + `isSiegeMapPanelOpen` (`main.ts:7120`). Silnik nie dostaje `MapUiState` (to czysto rysunkowe bramki), renderer nie dostaje `RenderUiParams` (wchodzi do ramki). Start: `RenderUiParams::default()` i `MapUiState::WEB_INITIAL`.
- **D-371-4 (kiedy odświeżać):** `GetRenderMap` raz po udanym `CreateSession` (później także po `Load`, #375); `GetRenderFrame` po każdej odpowiedzi ze zdarzeniem `StateChanged` oraz po każdej zmianie `RenderUiParams`; zmiana samego `MapUiState` nie woła silnika (tylko ponowne `MapScene::apply` na ostatniej ramce). Uzasadnienie: web odświeża warstwy po mutacjach i zmianach UI (`refreshFog` 69 wywołań, `refreshBuildHighlight` 18 miejsc); ramka Rust kumuluje eksplorację tylko w sesji i jest idempotentna przy niezmienionym stanie (do potwierdzenia testem T2).
- **D-371-5 (DŁUG-FRAME-RESELECT):** odwzorować wg webu („ostatni zapis do jednej warstwy `setHighlight` wygrywa”): flaga w `RenderUiParams` ustawiana przez klienta przy `selectPlayerUnit` w trybie budowy (`main.ts:7233-7260`, `setHighlight(reachable)` + `setSelectionHex`), zerowana przy każdym `refreshBuildHighlight()` (wszystkie miejsca `main.ts:16416…32497`). Ramka przy fladze liczy zarówno `buildHighlight` (warstwa kopalni zostaje), jak i `selection`/`reachable`/`pathRoute`; renderer wybiera warstwę podświetlenia wg flagi. Uzasadnienie: bezstanowa ramka (D-R3-3) nie zna kolejności zdarzeń; kolejność zna tylko klient. Odrzucone: stan „ostatniego pisarza” w `PlayableState` (to UI, nie gra; łamałoby zapis/odczyt).
- **D-371-6 (root `tests/bridge_contract.rs`):** przenieść do `rust-port/engine/tests/bridge_contract.rs` (kompilowany przez `rust-engine.yml`: `cargo test --all-targets`), `match` wyczerpujący bez `_ =>`. Uzasadnienie: plik dziś nie jest kompilowany przez żaden manifest i ma niewyczerpujący `match` (`:15-19`); kasowanie zgubiłoby jedyne asercje kontraktu powłoki (`:239-249`). `tests/*.cjs` — bez zmian w tym temacie (NIE_ZMIERZONO, czy coś je uruchamia).
- **D-371-7 (bez GPU w bramkach #371):** wszystkie bramki #371 na `civ-renderer` bez `--features gpu`; `gpu` dotyczy dopiero tematu osadzenia powierzchni (poza #371). Uzasadnienie: adaptery i synchronizacje są CPU (`renderer/Cargo.toml` `[features]`, `lib.rs:50-51`).

**Pytania gameplay/ABC:** brak. Web rozstrzyga każde zachowanie potrzebne w #371. Jedyna sprawa produktowa w pobliżu — przełączenie
okna z `frontend` na `frontend-v2` i rysowanie mapy na ekranie (GPU-EMBED) — jest poza zakresem #371 i nie wymaga pytania teraz.

---

## 5. RYZYKA

| ID | Ryzyko | Skutek | Środek zaradczy |
|---|---|---|---|
| R1 | Build Tauri offline niedostępny w kontenerze (rejestr, wpis RENDER-FRAME r1) | T3 kończy się BLOCK-INFRA albo bez dowodu kompilacji | cała logika w `civ-client` (T2); T3 = klej kilkudziesięciu linii; dowód z CI `tauri-windows.yml` na gałęzi wip |
| R2 | MSRV `src-tauri` 1.77.2 < 1.87 (renderer, wgpu) | błąd rozwiązywania zależności po dodaniu `civ-client` | podnieść `rust-version` w T3; `tauri-windows.yml` używa toolchaina z CI (sprawdzić wersję w T3) |
| R3 | Kopie typów `bridge.rs` przez `#[path]` w wielu crate | niekompatybilne typy `BridgeResult` między `civ-client` a `src-tauri` | D-371-1: interfejs na typach ładunków z biblioteki engine |
| R4 | `MapUnitRenderer::sync` zwraca `NotYetPorted` dla brakującego modelu (`map_units/mod.rs:290-296`) | ramka z nietypową jednostką przerywa apply | test e2e T2 na scenariuszu domyślnym + jawne mapowanie błędu w `MapScene::apply` (bez cichego pominięcia) |
| R5 | Koszt `GetRenderFrame` przy hoverze (składacz klonuje stan, gdy `selected_unit_id` różni się od stanu, `render_frame.rs:1097-1103`; liczy pełne warstwy) | spadek płynności przy ruchu myszy | NIE_ZMIERZONO; w T2 zmierzyć czas ramki na mapie domyślnej; ewentualne ograniczenie częstotliwości hovera to osobny temat (nie zmienia zasad) |
| R6 | Eksploracja wzdłuż ścieżki marszu: web odkrywa heksy krok po kroku (`revealAlongPathForStack`, `main.ts:~43690`, komentarz P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1), a ramka Rust liczy mgłę z pozycji w chwili wywołania | klient wołający ramkę raz po `MoveUnit` może nie odkryć heksów środkowych, jeśli `move_unit` sam ich nie zapisuje | NIE_ZMIERZONO, czy `PlayableGame::move_unit_with_attack` odkrywa po drodze; to sprawa silnika, nie klienta — sprawdzić w T2 asercją i ewentualnie zgłosić osobny temat engine |
| R7 | Q6-2 w rendererze (pierwszeństwo podświetlenia budowy) sprzeczny z webem w scenariuszu ponownego zaznaczenia | widoczna różnica: brak zasięgu jednostki przy otwartym panelu budowy | T5a/T5b (D-371-5) |
| R8 | `deny_unknown_fields` na `RenderUiParams` | starszy webview z nowym polem albo odwrotnie dostaje błąd parsowania | pola tylko addytywne z `#[serde(default)]`; klient i powłoka w jednym wydaniu |
| R9 | Równoległe buildy renderera (DOC-DEBTS-R2 trwa) i dysk 13 GB | OOM dysku, padnięte workflow | T1 dopiero po DOC-DEBTS-R2; >= 12 GB przed każdym tematem renderera; target w worktree usuwany po bramce |
| R10 | Zmiana `src-tauri/src/lib.rs` w T3 łamie asercje napisów kontraktu powłoki (`bridge_contract.rs:241-248`) | czerwony test po T3 | T0 przed T3; T3 ma plik testu w allowliście |
| R11 | `RENDER_FRAME_GAPS` (workerFields, starving/goldDeficit) i `battle = None` | renderer pokazuje puste warstwy, mimo że klient działa | poza #371 (zależności #310/#304, #369/#370); test e2e nie może asertywać niepustych `workerFields` |
| R12 | `frontend-v2` nie jest serwowany (`tauri.conf.json` -> `frontend`) i działa na atrapie MOCK | T3b nie ma efektu w uruchomionej aplikacji | świadomie: T3b to tylko kontrakt typów; przełączenie = osobny temat |

---

## Podsumowanie

Na parity-v2 (`38f5939e2`) silnik ma kompletne zapytania `GetRenderMap`/`GetRenderFrame` (`bridge.rs:70-84`, `:321-344`,
składacz `render_frame.rs:906-1121`), a renderer ma CPU-adaptery dla każdego pola DTO (`renderer/src/view/*`), budowane
bez GPU. Brakuje: (1) jednego punktu wejścia w rendererze, który z `MapViewDto` + `RenderLayersDto` + stanu UI składa
komplet wejść i synchronizuje je w kolejności webu (T1), (2) właściciela stanu UI i reguły odświeżania po stronie klienta
oraz testu „engine -> most -> adapter -> renderer CPU” (T2, nowy crate `civ-client` bez Tauri), (3) cienkiego kleju
w `src-tauri` (T3; build Tauri offline niedostępny — dowód tylko z CI), (4) odwzorowania ponownego zaznaczenia jednostki
w trybie budowy (DŁUG-FRAME-RESELECT, T5a engine + T5b renderer), (5) naprawy martwego root `tests/bridge_contract.rs`
(T0 = #374, przenieść do testów engine, przed T3). Jeden build renderera naraz: T1 -> T2 -> T5b sekwencyjnie; T0 i T5a
(engine) równolegle. Pytań ABC brak — web rozstrzyga; siedem decyzji technicznych D-371-1..7 do wpisania w rejestr.
