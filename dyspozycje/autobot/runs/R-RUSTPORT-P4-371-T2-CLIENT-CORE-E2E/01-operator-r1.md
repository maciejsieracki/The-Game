# R-RUSTPORT-P4-371-T2-CLIENT-CORE-E2E — Operator r1

```text
STATUS: PASS
DOMAIN: GAME (port Rust, klient renderera; bez zmian gameplay)
TEMAT: R-RUSTPORT-P4-371-T2-CLIENT-CORE-E2E (#371, T2)
GOAL: crate rust-port/client (civ-client, bez Tauri, bez gpu): właściciel stanu UI i reguły odświeżania,
      woła GetRenderMap/GetRenderFrame przez RenderSource i zasila MapScene; test e2e engine → most → adapter → renderer CPU
ZMIANY/COMMIT: nowe pliki wyłącznie z allowlisty (lista niżej); commit na gałęzi rust-port-wip/R-RUSTPORT-P4-371-T2-CLIENT-CORE-E2E (SHA w odpowiedzi Operatora / `git log -1`)
TESTY: generate-lockfile EXIT 0 (lock stabilny przy powtórzeniu); fmt --check EXIT 0; clippy --locked --all-targets -D warnings EXIT 0;
       test --locked --all-targets EXIT 0 (5 passed: 4 testy klienta + 1 test jednostkowy z dołączonego bridge.rs); mutanty a–e: 5/5 wykryte
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus)
DEPLOY/PUSH: NIE WYKONANO
```

## Baza

`origin/rust-port/parity-v2` = `e4ffbc342b2e51ddb009786247adf78d67c32964` (zgodna z dispatchem; zawiera T1 `view::frame`).
Gałąź robocza: `rust-port-wip/R-RUSTPORT-P4-371-T2-CLIENT-CORE-E2E` (`git checkout -B … origin/rust-port/parity-v2`),
worktree sparse `--cone rust-port dyspozycje src-tauri`. Pin webu `07d2fbd72` czytany przez `git show` (bez zmian w `gra/`).

## Pliki (wszystkie nowe, wszystkie z allowlisty)

| Plik | Zawartość |
|---|---|
| `rust-port/client/Cargo.toml` | `civ-client`, `publish = false`, `rust-version = "1.87"`, bez workspace; zależności path: `civ-engine`, `civ-renderer` (domyślne cechy = bez `gpu`), `civ-view-model`; dev: `serde` (derive), `serde_json` (dla `bridge.rs` i porównań JSON) |
| `rust-port/client/Cargo.lock` | z `cargo generate-lockfile` (68 pakietów, „latest Rust 1.87 compatible”) |
| `rust-port/client/.cargo/config.toml` | kopia z renderera: `[resolver] incompatible-rust-versions = "fallback"` |
| `rust-port/client/.gitignore` | `/target` |
| `rust-port/client/src/lib.rs` | `ClientUiState`, `RenderSource`, `ClientError`, `RenderClient`, `VIEWER_SEAT` |
| `rust-port/client/tests/engine_bridge_renderer.rs` | test e2e + 3 testy pomocnicze |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-371-T2-CLIENT-CORE-E2E/01-operator-r1.md` | ten raport |

Nie ruszone: `engine/`, `renderer/` (w tym `renderer/Cargo.lock`), `view-model/`, `src-tauri/`, `gra/**`, `.github/**`, `REJESTR-RUST.md`.

## Web najpierw (pin `07d2fbd72`, `gra/src/main.ts`)

- `syncPlayerUnitSelectionOnMap` `:7115-7135`: pierścień zaznaczenia z `selectedId`; przy `isSiegeMapPanelOpen()` (`:7120-7122`) `clearHighlight()`, pierścień zostaje — sprawdzone w teście na stanie renderera.
- Pełne odświeżenie po wczytaniu `:46138-46156` (`syncWonderRender`, `syncUnitsRender`, `cityRenderer.sync`, `refreshTradeRoutesOverlay`, `refreshSiegeMarkers`, `refreshFog`, `refreshMapOverlayToggles`) — kolejność realizuje T1 `MapScene::apply`; klient tylko je wywołuje.
- Przełączniki nakładek nie dotykają stanu gry: `toggleTradeRoutesOverlayOnMap` `:15411-15416` → `refreshTradeRoutesOverlay`; `toggleWorkerOverlayOnMap` `:15465-15469` → `refreshWorkerFieldOverlay`; `refreshMapOverlayToggles` `:15459-15463`. Podstawa D-371-4: zmiana `MapUiState` składa ramkę ponownie z cache, bez silnika.

## Projekt (decyzje D-371-1/3/4/7 zastosowane; decyzje techniczne Operatora niżej)

- `ClientUiState { frame_ui: RenderUiParams, map_ui: MapUiState, siege_map_panel_open: bool }`; `web_initial()` = `Default` = `RenderUiParams::default()` + `MapUiState::WEB_INITIAL` + `false` (D-371-3).
- `trait RenderSource { type Error; fn render_map(&mut self) -> Result<RenderMapPayload, Self::Error>; fn render_frame(&mut self, seat: Option<u64>, ui: Option<RenderUiParams>) -> Result<RenderFramePayload, Self::Error>; }` — typy ładunków z `civ_engine::domain::render_frame` (re-eksport), bez duplikatów; implementacja nad `EngineBridge` po stronie wołającego (D-371-1).
- `RenderClient<S>`:
  - `on_session_created()` → `GetRenderMap` + `MapStatic::from_dto`; czyści cache ramki, wejścia i scenę poprzedniej sesji;
  - `on_state_changed()` → `GetRenderFrame(VIEWER_SEAT, Some(frame_ui))` + `FrameInputs::from_dto` + (`MapScene::new` przy pierwszej ramce sesji) + `MapScene::apply`; cache DTO ostatniej ramki; przed sesją `Err(ClientError::NoSession)` bez wywołania silnika;
  - `set_frame_ui(..)` → przy zmianie `GetRenderFrame`; równa wartość nic nie robi;
  - `set_map_ui(..)`, `set_siege_map_panel_open(..)` → nigdy silnik; ponowne złożenie z cache (D-371-4);
  - `set_ui(..)` → rozdziela oba przypadki;
  - gettery: `last_frame()`, `frame_inputs()`, `scene()`, `scene_mut()`, `map()`, `ui()`, `source()/source_mut()`.
- `ClientError<E> { NoSession, Source(E), Frame(FrameError) }` z `Display` i `Error`.
- Brak duplikatu stanu gry: klient trzyma wyłącznie stan UI, `MapStatic`, DTO ostatniej ramki, `FrameInputs` i `MapScene`.

Decyzje techniczne Operatora (do wpisu orkiestratora w REJESTR-RUST):
- **T2-1:** `VIEWER_SEAT = None` (aktywny fotel, web `ME()`); klient nie ma ustawienia fotela — inne fotele to osobny temat, jeśli web ich wymaga.
- **T2-2:** `frame_ui` wysyłane zawsze jako `Some(..)` (także wartość domyślna); semantyka = `None` (`unwrap_or_default` w adapterze).
- **T2-3:** UI ustawione przed sesją jest zachowywane i użyte w pierwszej ramce; `on_session_created` NIE zeruje UI (web nie rozstrzyga tego w zakresie T2; reset przy nowej grze = decyzja wołającego / T3).
- **T2-4:** przy błędzie adaptera/źródła cache trzyma poprzednią ramkę; `MapScene` może być częściowo zaktualizowana (zachowanie T1 `apply`, opisane w jego dokumentacji).
- **T2-5:** `MapDetailQuality` podawane w `RenderClient::new` (teren budowany raz na sesję z pierwszej ramki, jak `MapScene::new`).

## Test e2e (`tests/engine_bridge_renderer.rs`)

`#[path = "../../engine/src/bridge.rs"] mod bridge;`, `EngineBridge<CivEngineAdapter>` opakowany w `BridgeSource` (licznik `map_calls` / `frame_calls`; `match` na `BridgeResult` wyczerpujący, bez `_ =>`).

Scenariusz `engine_bridge_adapter_renderer_end_to_end`:
1. ramka przed sesją → `ClientError::NoSession`, liczniki (0,0), brak cache/sceny;
2. `CreateSession` → `on_session_created` (GetRenderMap ×1); `AddPlayer` AI (drugi fotel dla mutanta b);
3. `GetRenderFrame` (UI startowe): renderer = DTO (tokeny jednostek = `units.len()` i heksy, grupy miast = `cities.len()`, `overlays` = wejścia, viewer/turn/UI), ramka = bezpośrednia ramka aktywnego fotela, `viewer.owner_id` = fotel 1, brak zaznaczenia;
4. idempotencja: drugi `on_state_changed` bez zmian → identyczne DTO (struktura i JSON);
5. `SelectUnit` (StateChanged → ramka; `selection` nadal `None`, bo `selectedId` z UI) → `set_frame_ui(selected)` → 1 wywołanie; DTO `selection`/`reachable` niepuste; renderer: pierścień na heksie zaznaczenia, podświetlenie o liczbie heksów = `reachable`; równe UI ponownie → 0 wywołań;
6. `set_map_ui` (3 przełączniki wyłączone) i `set_siege_map_panel_open(true)` → 0 wywołań silnika, cache bez zmian, renderer przeskładany; panel oblężenia: pierścień zostaje, podświetlenie znika (`main.ts:7119-7122`); `set_ui` z powrotem bez zmiany `frame_ui` → 0 wywołań;
7. `build_mode_open` → DTO bez `selection`/`reachable`/`pathRoute`, renderer bez pierścienia i podświetlenia zasięgu; `set_ui` z innym `frame_ui` → 1 wywołanie;
8. `MoveUnit` na osiągalny heks → jednostka na celu w DTO i w rendererze, eksploracja nie maleje;
9. `AdvanceTurn` → `turn + 1`, renderer = DTO, ramka aktywnego fotela, zaznaczenie narysowane, eksploracja nie maleje; idempotencja ponownie; `GetRenderMap` dokładnie raz.

Testy pomocnicze: UI przed sesją użyte w pierwszej ramce; nowa sesja czyści cache/scenę i `set_map_ui` bez ramki nie woła silnika; błąd źródła (fotel 99) → `ClientError::Source`, cache pusty, oraz asercja, że klient pyta o `VIEWER_SEAT`.

## Mutanty (fizycznie wykonane skryptem, plik przywrócony i porównany `cmp` = identyczny)

| Mutant | Zmiana w `src/lib.rs` | Wynik |
|---|---|---|
| (a) brak kontroli sesji | usunięta kontrola `map.is_none()` w `on_state_changed` | WYKRYTY: e2e pada (`calls == (0,0)`, l. 258) |
| (b) inny fotel | `VIEWER_SEAT = Some(2)` | WYKRYTY: 3 testy padają (asercja fotela viewer, l. 218) |
| (c) zgubienie `selected_unit_id` | `set_frame_ui` zapisuje `selected_unit_id: None` | WYKRYTY: 2 testy (asercja `selection`, l. 226/307) |
| (d) `MapUiState` woła silnik | `set_map_ui` → `on_state_changed()` | WYKRYTY: 3 testy (licznik wywołań, l. 325/452/489) |
| (e) brak cache | `present` nie zapisuje ramki | WYKRYTY: 3 testy (`last_frame` / idempotencja) |

## Bramki (w `rust-port/client`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie `t2client/target`)

| Bramka | Wynik |
|---|---|
| `cargo generate-lockfile` | EXIT 0; powtórzone → `Cargo.lock` bajtowo identyczny |
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --locked --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --locked --all-targets` (w tle `setsid nohup`, EXIT w logu) | EXIT 0; 5 passed, 0 failed, 0 ignored |

Dysk przed buildem 14 GB wolnego; równolegle trwał jeden build engine (T1 SIEGE-DEF) — razem 2 buildy. Target usunięty po bramkach (`df` po: 14 GB). Brak `#[ignore]`.

## Długi

- **DŁUG-T1-NOT-SYNCED** (z T1): `MapScene` nie synchronizuje plakietek StatChip, lasu pod jednostkami, obozów/wiosek/ulepszeń, ukryć dekoru cudów — klient ich nie dodał (allowlista bez renderera); `MapUiState::hover_stat_chip_city_id` i `city_panel_view_city_id` nie mają czytelnika. Osobny temat renderera.
- **DŁUG-T1-RESOLVERS** (z T1): resolvery `wireUnitRendererRingStance` (`main.ts:10344-10384`) nie ustawione; klient udostępnia `scene_mut()` → `units_mut()`, wpięcie w T3 lub osobnym temacie.
- **DŁUG-T2-CITIES-E2E:** scenariusz domyślny nie ma miast (most nie ma komendy założenia miasta), więc asercja „grupy miast = `cities.len()`” jest w e2e sprawdzana na 0 wpisów; pokrycie miast na niepustych danych istnieje tylko w testach T1 na ręcznych DTO.
- **DŁUG-T2-FRAME-TIME (R5):** czas ramki / koszt `GetRenderFrame` przy hoverze — NIE_ZMIERZONO (build debug bez debuginfo nie jest miarodajny).
- **R6 (eksploracja wzdłuż ścieżki):** sprawdzone tylko „eksploracja nie maleje” po ruchu o jeden segment; odkrywanie heksów pośrednich marszu wieloheksowego — NIE_ZMIERZONO (sprawa silnika).
- **DŁUG-T1-LOCK:** `renderer/Cargo.lock` nietknięty (osobny temat).
- CI dla `rust-port/client` (`.github/workflows/rust-client.yml`) — poza allowlistą; bez CI crate nie jest bramkowany automatycznie.
- Reset `ClientUiState` przy nowej grze (T2-3) — do rozstrzygnięcia w T3 wg webu.
