# R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2 — komenda mostu `GetRenderLayers` (DTO-BRIDGE, część 2)

STATUS: dispatch orkiestratora. Opus (3D). Operator/Obrona/Evaluator/FC Opus. Decyzje techniczne podejmuje orkiestrator (reguła 8); właściciel zlecił autonomiczne domknięcie prac 3D (2026-11-17).
ZALEŻNOŚĆ: Q6-2, AWAITING-SEAT i L1/L2-FOGOFF zintegrowane na parity-v2 (merge `1508eda34`). Jeśli parity != `1508eda34`, użyj aktualnego `origin/rust-port/parity-v2` i zapisz SHA w raporcie.
BAZA: `origin/rust-port/parity-v2` = `1508eda34d0262ac5a3f75b3bc419f2fa8211988` (DODATEK r1, 2026-11-17). Przed startem: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.

## GOAL
DTO-BRIDGE r1 dostarczył producentów warstw w engine (`engine/src/domain/dto_bridge.rs`: `build_fog_layers`, `build_territory_layers`, `build_view_layers`), ale nic ich nie woła z mostu. Dodać do mostu JSON ADDYTYWNĄ komendę zapytania o warstwy renderera, tak aby front/renderer mogły je pobrać po `invoke`.

Decyzje orkiestratora (D-364-2):
- Nowa komenda: `EngineCommand::GetRenderLayers { seat: Option<u64> }` (brak `seat` = aktywny fotel człowieka, web `ME()`). Zapytanie jest tylko-do-odczytu: nie emituje `StateChanged`.
- Nowy wariant wyniku: `BridgeResult::RenderLayers { layers: RenderLayersPayload }`, gdzie `RenderLayersPayload` = `{ fog: FogViewDto, fogActive: bool, reveal: FogRevealDto, territory: TerritoryRangesDto }` (typy z `civ-view-model`; nazwy pól camelCase zgodnie z istniejącą konwencją).
- `CONTRACT_VERSION` zostaje 1 (zmiana addytywna: istniejące kształty JSON się nie zmieniają). Jeśli któryś test kontraktu mostu wymusza inaczej — STOP, zapisz BLOCK z uzasadnieniem, nie zmieniaj wersji sam.
- Stan mgły sesji (`ExploredByHuman`, `fog_on`, `reveal_all_land`, `player_start_hex_by_owner`, `start_reveal_radius`) żyje w `PlayableGame`/`PlayableState` i jest inicjalizowany przy `CreateSession`. Wartości domyślne i źródło każdego pola ustal z pinu (`main.ts:12801-12804`, `3022-3029`, `startRevealRadiusForDifficulty`); jeśli `StartGameParams` nie ma pola, dodaj je z `#[serde(default)]` bez zmiany istniejących kształtów.
- Eksploracja jest kumulowana: każde wywołanie `GetRenderLayers` wykonuje `refresh_fog` jak web `refreshFog()` (`main.ts:13475-13513`), więc zapytanie MUTUJE `ExploredByHuman` wewnątrz sesji. Mutacja nie zmienia `EngineState` ani nie emituje zdarzeń; to jawnie opisz w komentarzu komendy i w raporcie.
- Zapytanie nie może rozjechać replay/determinizmu: `ExploredByHuman` nie wchodzi do `EngineState` ani do zapisu/snapshotu.

## PIN (pin = `07d2fbd72`)
- `gra/src/main.ts:12801-12804`, `13475-13513`, `13074-13080`, `15593-15601`, `3022-3029`.
- Rust: `engine/src/bridge.rs` (`EngineCommand`, `BridgeResult`, `EnginePort`, `CivEngineAdapter::execute`, `MockEngineAdapter`), `engine/src/domain/dto_bridge.rs`, `engine/src/domain/playable.rs`.

## ZAKRES
1. Rozszerz `EnginePort` o metodę zapytania (np. `render_layers(&mut self, seat: Option<u64>) -> Result<RenderLayersPayload, BridgeError>`), z domyślną implementacją zwracającą `BridgeError::engine_rejected` dla adapterów, które jej nie wspierają (np. `MockEngineAdapter`, jeśli nie ma sensu ją implementować).
2. Dodaj `EngineCommand::GetRenderLayers` i `BridgeResult::RenderLayers`; dyspozytor (`EngineBridge::handle`) obsługuje je bez zdarzenia `StateChanged`.
3. `CivEngineAdapter`: zaimplementuj zapytanie przez istniejące `dto_bridge::build_fog_layers` + `build_territory_layers` na stanie sesji; błędy mapuj na `BridgeError::engine_rejected`.
4. Test `rust-port/engine/tests/p4_364_bridge_layers.rs`: (a) komenda zwraca warstwy zgodne z `dto_bridge` na tym samym stanie; (b) fotel `seat: Some(2)` daje inną mgłę niż domyślny; (c) dwukrotne wywołanie jest idempotentne co do wyniku (eksploracja nie cofa się); (d) istniejące kształty JSON `GetState`/`MoveUnit` bez zmian (test deserializacji starego żądania); (e) odpowiedź serializuje się z `kind: "render_layers"` i camelCase.
5. Mutacje FAIL: (a) komenda ignoruje `seat`; (b) komenda emituje `StateChanged`; (c) zapytanie nie kumuluje eksploracji; (d) zmieniony `CONTRACT_VERSION`.

## ALLOWLISTA
`rust-port/engine/src/bridge.rs`, `rust-port/engine/src/domain/dto_bridge.rs`, `rust-port/engine/src/domain/playable.rs` (tylko pola/inicjalizacja stanu mgły sesji), `rust-port/engine/tests/p4_364_bridge_layers.rs` (nowy). Pliki spoza listy, które MUSZĄ się zmienić tylko po to, by kompilacja przeszła (np. wyczerpujące `match` na `BridgeResult` lub `EngineCommand` w testach lub w powłoce Tauri): wolno zmieniać wyłącznie mechanicznie (dodać gałąź), wypisz je w raporcie w sekcji „Pliki spoza allowlisty”. Renderer i view-model: NIE.

## BRAMKI (EXIT 0)
`cargo fmt --check`, `cargo clippy --all-targets -- -D warnings` (engine), `cargo test --test p4_364_bridge_layers`, `cargo test --all-targets --no-fail-fast` (engine; >10 min: w tle z zapisem EXIT do logu). Jeśli w workspace istnieje crate powłoki Tauri zależny od `civ-engine`, zbuduj go `cargo check` (jeśli możliwe offline) i zapisz wynik.
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie orkiestratora (poza repo), usunąć po bramkach. Nie commitować `Cargo.lock`. Przed pełną bramką sprawdź dysk ≥ 8 GB; mniej → BLOCK INFRA z liczbą GB.

## KRYTERIA KOŃCA
Zielone bramki, mutacje (a)–(d) dają FAIL. Commit jawnym `git add` z allowlisty. Bez linii `Co-Authored-By` z nazwą modelu (#289). Raport `01-operator-r1.md`: STATUS, DOMAIN, TEMAT, GOAL, ZMIANY/COMMIT, TESTY, BLOKADY, RUNDY, NASTĘPNY KROK, DEPLOY/PUSH: NIE WYKONANO. Nie pushować do parity, nie integrować.
