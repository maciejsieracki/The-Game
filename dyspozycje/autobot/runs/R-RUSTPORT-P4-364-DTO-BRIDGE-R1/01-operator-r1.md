# 01-operator-r1 — R-RUSTPORT-P4-364-DTO-BRIDGE-R1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-DTO-BRIDGE-R1
GOAL: warstwa engine `domain::dto_bridge`, która z PlayableState i wejść fotela liczy FogViewDto/fog_active, FogRevealDto i TerritoryRangesDto aktywnego fotela ME(), z wektorami pinu 07d2fbd72 i testem równoważności portów.
ZMIANY/COMMIT: baza e2a2c4e2f, gałąź rust-port-wip/364-dto-bridge-r1, kod 13ed6c88045a39d4be13677670fe208ef4656024.
  - rust-port/engine/src/domain/dto_bridge.rs (nowy): build_fog_layers, build_territory_layers, build_view_layers, start_reveal_keys_for_river_fog, is_awaiting_first_city, engine_territory_nodes, territory_node_inputs, DtoBridgeError (MissingExploredSeat, MissingStartHex, IdOutOfRange; ręczny Display).
  - rust-port/engine/src/domain/mod.rs: jedna linia `pub mod dto_bridge;`.
  - rust-port/engine/tests/p4_364_dto_bridge.rs (nowy), p4_364_dto_bridge_gen.mjs (nowy; wykonuje pin przez git archive, strażnik SHA-256 fragmentów main.ts), p4_364_dto_bridge_vectors/vectors.json (11 przypadków).
  - Brak zmian w EngineCommand, BridgeResult, bridge.rs, rendererze i view-model. Cargo.lock nie jest commitowany.
TESTY:
  - cargo fmt --check: EXIT 0.
  - cargo clippy --all-targets -- -D warnings (engine): EXIT 0.
  - cargo test --test p4_364_dto_bridge: 5/5 ok. Testy obejmują: wektory pinu (11 przypadków), strażnika pokrycia, błąd przy braku wpisu fotela, F2 przez PlayableState (7 scenariuszy, ME()=0 i ME()=1) oraz wyłączoną mgłę.
  - node p4_364_dto_bridge_gen.mjs --check: OK, 11 przypadków.
  - Mutacje wykonane i cofnięte (cmp z oryginałem OK):
    - (a) river_reveal_keys z rzeka_krawedzie (PlayableState nie ma krawędzi rzek, więc wynik to Some([])): FAIL.
    - (b) mgła ME() zastąpiona fotelem 0: FAIL (2 testy).
    - (c) reveal_all_land ignorowane: FAIL.
    - (d, dodatkowa) filtr terytorium na fog_active zamiast fogOn: FAIL.
  - cargo test --all-targets --no-fail-fast (engine): NIE_ZMIERZONO w chwili zapisu raportu. Przebieg ruszył w tle (log w scratchpadzie full364.log) i był jeszcze w fazie kompilacji. Evaluator musi go powtórzyć.
BLOKADY / DECYZJE TECHNICZNE (do REJESTR-RUST):
  - D-BR-1: zbioru playerEverOwnedCityByOwner (main.ts:3042, osobno dla każdego fotela) nie ma w PlayableState, który ma tylko flagę bool gracz_kiedys_mial_miasto. Dlatego dodałem parametr `player_ever_owned_city_by_owner: &BTreeSet<PlayerId>`, co odbiega od sygnatury z dispatchu. Uwaga: overlays_view::awaiting_first_city używa tej flagi bool, więc działa poprawnie tylko dla fotela 0. Ten plik jest poza allowlistą, nie zmieniałem go.
  - D-BR-2: filtr terytorium czyta fogOn (main.ts:15597), a nie useFogRender. Dlatego build_territory_layers przyjmuje `fog_on`, a nie `fog_active`. Sygnatura z dispatchu dałaby wynik niezgodny z pinem przy fogOn=false i revealAllLand=true, co potwierdza mutacja (d).
  - D-BR-3: build_territory_layers przyjmuje też `visible` (currentVisible()), bo wymaga tego filtr pinu.
  - D-BR-4: wariant MissingStartHex jest w enumie (wymóg dispatchu), ale producent go nie zwraca. Gdy fotel nie ma heksu startu, pin daje undefined, czyli tu None.
  - D-BR-5: przy !useFogRender river_reveal_keys = None, bo pin wywołuje setFog(ALL_KEYS, ALL_KEYS) bez opcji (zgodnie z dispatchem). Wektor L1/L2 fog_off_no_reveal_awaiting podaje w tym przypadku klucze, ale adapter renderera i tak je ignoruje przy fog_on=false.
  - Pominąłem 3 scenariusze F2 z właścicielami -1/-99, bo PlayableState nie przechowuje miast ani fortów barbarzyńców i rebeliantów. W pozostałych przesunąłem współrzędne, bo PositionDto jest typu u16. Wektory reveal_l12 nie mają wejść stanu (heks startu, jednostki), dlatego dodałem nowy generator.
  - Kolejność właścicieli: engine collect_territory_hex_keys_by_owner zwraca BTreeMap (posortowaną), więc test porównuje zbiory. Kolejność wstawiania sprawdzają wektory pinu.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1, w tym pełny cargo test --all-targets dla engine.
DEPLOY/PUSH: NIE WYKONANO
