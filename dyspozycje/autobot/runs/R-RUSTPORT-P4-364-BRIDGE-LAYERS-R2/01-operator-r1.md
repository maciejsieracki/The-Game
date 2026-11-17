# R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2 — Operator r1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2
GOAL: addytywna komenda mostu JSON `GetRenderLayers`, która woła producentów warstw DTO-BRIDGE (`build_fog_layers` + `build_territory_layers`) na stanie sesji i zwraca je frontowi/rendererowi po `invoke`.
BAZA: `origin/rust-port/parity-v2` = `1508eda34d0262ac5a3f75b3bc419f2fa8211988` (zgodna z dispatchem).
GAŁĄŹ: `rust-port-wip/p4-364-bridge-layers-r2`

## ZMIANY/COMMIT

Commit kodu i raportu: patrz sekcja „SHA” na końcu (uzupełniane po commicie).

Allowlista:
- `rust-port/engine/src/bridge.rs`:
  - `EngineCommand::GetRenderLayers { seat: Option<u64> }` (`#[serde(default, skip_serializing_if = "Option::is_none")]`; JSON `{"kind":"get_render_layers"}` / `{"kind":"get_render_layers","seat":2}`);
  - `BridgeResult::RenderLayers { layers: RenderLayersPayload }` (JSON `kind: "render_layers"`);
  - `EnginePort::render_layers(&mut self, seat) -> Result<RenderLayersPayload, BridgeError>` z domyślną implementacją `BridgeError::engine_rejected` (używa jej `MockEngineAdapter`);
  - `EngineBridge::handle`: `GetRenderLayers` obsłużone przed `execute`, odpowiedź `RenderLayers`, `events` puste (brak `StateChanged`);
  - `CivEngineAdapter::render_layers` -> `dto_bridge::session_render_layers`, błędy -> `engine_rejected`; gałąź `GetRenderLayers` w obu `execute` (wyczerpujący `match`); `CivEngineAdapter::fog_session()` (odczyt stanu mgły sesji);
  - `#[allow(clippy::large_enum_variant)]` na `BridgeResult` (nowy mały wariant obok dużego `State`; boxowanie `State` zmieniłoby wzorzec `BridgeResult::State { state }` u konsumentów — ta sama motywacja co istniejące `allow` na `EngineCommand`);
  - `CONTRACT_VERSION` = 1 bez zmian.
- `rust-port/engine/src/domain/dto_bridge.rs`: `RenderLayersPayload { fog, fogActive, reveal, territory }` (camelCase, `Serialize/Deserialize`, `From<DtoBridgeLayers>`), `fog_inputs_of`, `session_render_layers(game, seat)`, wariant `DtoBridgeError::UnknownSeat`.
- `rust-port/engine/src/domain/playable.rs` (tylko stan mgły sesji): `PlayableFogSession` (pole prywatne `fog` w `PlayableGame`, inicjalizacja w `new`/`from_state`, akcesory `fog_session()` i `fog_session_parts()`); w teście modułu `PlayableGame { ... }` dopisane `fog: game.fog.clone()` (mechanicznie, literał struktury).
- `rust-port/engine/tests/p4_364_bridge_layers.rs` (nowy, 12 testów).

Pliki spoza allowlisty: brak zmian. Uwaga: `tests/bridge_contract.rs` (root) ma `match result { BridgeResult::State { state } => state }` — po dodaniu wariantu nie skompilowałby się, ale żaden `Cargo.toml` go nie kompiluje (brak root `Cargo.toml`, `src-tauri/Cargo.toml` bez `[[test]]`), więc nie był zmieniany. `src-tauri/src/lib.rs` nie matchuje `BridgeResult`/`EngineCommand` (tylko `EngineBridge::handle`).

## Decyzje techniczne (do REJESTR-RUST przez orkiestratora)

- **D-364-R2-1 (miejsce stanu mgły):** `PlayableFogSession` żyje w `PlayableGame` (pole prywatne), NIE w `PlayableState` — nie wchodzi do DTO stanu, `save_load`, snapshotu ani replay. `CreateSession` tworzy nową `PlayableGame`, więc mgła sesji jest świeża (web `seedStartingFog`, `main.ts:12868-12873`).
- **D-364-R2-2 (wartości startowe wg pinu `07d2fbd72`):** `fog_on = true` (`main.ts:12801`, `:12870`), `reveal_all_land = false` (`:12803`, `:12871`) — przełączniki F/M są dev-UI, nie parametry kreatora, więc `StartGameParams` NIE dostał pól (kształt JSON bez zmian); `explored_by_human = {fotel główny: ∅}` (`:13759`, `explored.clear()` `:12872`); `active_seat` = `HUMAN_PLAYER_ID` (web `ME()` = `humanSeats.activeHumanOwnerId`, bez hot-seatu = `HUMAN_OWNER_PRIMARY`, `:13729-13731`); `start_reveal_radius` = `startRevealRadiusForDifficulty(diffMap[params.difficulty] ?? 'normal')` (`:44370-44381`, `startScoring.ts:17-23`: 10/8/5) przez istniejący port `cluster_mass::start_reveal_radius_for_difficulty`; nieznana etykieta -> `normal` jak w webie (nie błąd).
- **D-364-R2-3 (heks startu):** `player_start_hex_by_owner` = {fotel główny: pozycja stolicy fotela głównego}. Pionowy wycinek zakłada stolicę przy starcie (web zakłada ją na heksie `startPlacements.playerStart`); ten sam wybór co `cluster_compute` (`player_start_hex: cap_pos`). Przy stolicy od startu `isAwaitingFirstPlayerCity` = false, więc `riverRevealKeys` = `None` — zgodnie z pinem.
- **D-364-R2-4 (fotel w zapytaniu):** `seat: None` -> `active_seat` sesji; `seat: Some(id)` musi być graczem z `state.players` (inaczej `UnknownSeat` -> `engine_rejected`); flaga `is_human` nie jest wymagana, bo most nie modeluje jeszcze foteli hot-seat (jedyna droga dodania gracza to `AddPlayer`, tworzy AI). Brak wpisu eksploracji -> pusty zbiór przed `refreshFog` (web `switchActiveHuman` KROK 0, `main.ts:13902`). Wybór fotela dotyczy tylko zapytania — `active_seat` sesji się nie zmienia.
- **D-364-R2-5 (kumulacja):** każde `GetRenderLayers` (i `execute(GetRenderLayers)` w `CivEngineAdapter`) wykonuje `refresh_fog` jak web `refreshFog()` (`main.ts:13475-13513`, `addExplored(exploredByHuman.get(ME())!, vis)`), więc MUTUJE `explored_by_human` w sesji; `EngineState` się nie zmienia, zdarzeń brak. Opisane w doc-komentarzu `EngineCommand::GetRenderLayers` i `session_render_layers`.
- **D-364-R2-6:** `playerEverOwnedCityByOwner` = `PlayableState::player_ever_owned_city_by_owner()` (AWAITING-SEAT).

## TESTY

Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (poza repo), `--offline`. Dysk przed pełną bramką: 16 GB wolne.

- `cargo fmt --check` (engine): EXIT 0.
- `cargo clippy --offline --all-targets -- -D warnings` (engine): EXIT 0.
- `cargo test --offline --test p4_364_bridge_layers`: 12 passed, 0 failed (EXIT 0).
  - (a) `komenda_zwraca_warstwy_zgodne_z_dto_bridge` — wynik mostu == `build_view_layers` na tym samym stanie i eksploracji;
  - (b) `fotel_2_daje_inna_mgle_niz_domyslny` (inna mgła i inne terytorium, `active_seat` bez zmian), `nieznany_fotel_jest_odrzucony_bez_zmiany_stanu`;
  - (c) `dwa_wywolania_daja_ten_sam_wynik_i_nie_zmieniaja_stanu_gry`, `zapytanie_kumuluje_eksploracje_w_sesji` (eksploracja = widoczne heksy po 1. zapytaniu, po ruchu jednostki tylko rośnie, odkryte heksy nie wracają do `Unexplored`, druga odpowiedź = `dto_bridge` na eksploracji z pierwszej);
  - (d) `stare_zadania_get_state_i_move_unit_bez_zmian` (stary JSON `get_state`/`move_unit` deserializuje się i serializuje identycznie; `GetState` bez zdarzeń, `MoveUnit` z `StateChanged`; `CONTRACT_VERSION == 1`), `get_render_layers_wymaga_wersji_1`;
  - (e) `komenda_i_odpowiedz_serializuja_sie_camel_case` (`kind: "render_layers"`, klucze `fog/fogActive/reveal/territory`, `revealAllLand/riverRevealKeys`, `byOwner`, round-trip);
  - dodatkowe: `stan_mgly_sesji_wg_pinu_po_nowej_grze`, `promien_startu_z_trudnosci_wg_pinu`, `mock_adapter_odrzuca_zapytanie_warstw`.
- Mutacje (skrypt na kopii, pliki przywrócone, `cmp` = identyczne):
  - (a) komenda ignoruje `seat` -> FAIL (`fotel_2_daje_inna_mgle_niz_domyslny`);
  - (b) komenda emituje `StateChanged` -> FAIL (4 testy);
  - (c) zapytanie nie kumuluje eksploracji (klon zamiast zapisu) -> FAIL (`zapytanie_kumuluje_eksploracje_w_sesji`, `fotel_2_...`);
  - (d) `CONTRACT_VERSION = 2` -> FAIL (3 testy).
- `cargo test --offline --all-targets --no-fail-fast` (engine, w tle, `setsid nohup`, log z `EXIT=`): **EXIT=0**; 526 linii `test result` w logu, suma 3927 passed, 0 failed, 1 ignored; 0 linii `FAILED`.
- Po bramkach `CARGO_TARGET_DIR` (scratchpad) usunięty; `Cargo.lock` nie commitowany.
- Powłoka Tauri (`src-tauri`, `cargo check --offline`): NIE_ZMIERZONO — offline brak crate `tauri` w indeksie (`no matching package named tauri`, EXIT 101). `src-tauri/src/lib.rs` używa tylko `EngineBridge::handle`, bez matchy na zmienionych enumach.

## BLOKADY

Brak. Ryzyko latentne: root `tests/bridge_contract.rs` (niekompilowany) ma niewyczerpujący już `match` na `BridgeResult`.

## RUNDY

1/5

## NASTĘPNY KROK

Evaluator r1.

## DEPLOY/PUSH

NIE WYKONANO (commit tylko na gałęzi roboczej, bez push i bez integracji).
