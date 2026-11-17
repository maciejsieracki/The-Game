# R-RUSTPORT-P4-364-DTO-BRIDGE-R1 — producenci warstw mgły, odkrycia rzek i zasięgów terytorium z PlayableState (DTO-BRIDGE, #364, część 1)

STATUS: dispatch orkiestratora. Opus (3D). Operator/Obrona/Evaluator/FC Opus (temat grafiki: pozwolenie właściciela z dzisiaj).
ZALEŻNOŚĆ: spełniona. FOG-VIEW (`e2a2c4e2f` na parity), L1/L2 REVEAL (`e385625`), F2 TERRITORY-RANGES (`1db08c170`) zintegrowane. Ten temat domyka część wołającego produkcyjnego dla tych producentów w ENGINE; nie zmienia kontraktu mostu JSON.
BAZA: `origin/rust-port/parity-v2` = `e2a2c4e2f` (DODATEK r1, 2026-11-17). Przed startem: `git fetch origin && git checkout -B <gałąź> e2a2c4e2f`.

## GOAL
Dotąd trzy producenty istnieją tylko jako API i testy:
- `engine/src/domain/state.rs` `refresh_fog` / `fog_view_dto` (FOG-VIEW) — brak wołającego poza modułem.
- `FogRevealDto` (L1/L2) — producenta w engine brak; adapter `renderer/src/view/fog.rs` przyjmuje DTO tylko z testów.
- `view-model/src/territory_ranges_view.rs` `territory_ranges_dto` (F2) — dostaje wejścia jawnie, brak wołającego z `PlayableState`.

Cel r1: w `engine` dodać jedną warstwę produkcyjną `dto_bridge`, która z `PlayableState` + wejść fotela wylicza:
(a) `FogViewDto` i `ViewerDto.fog_active` (przez istniejący `refresh_fog`),
(b) `FogRevealDto { reveal_all_land, river_reveal_keys }` zgodnie z pinem,
(c) `TerritoryRangesDto` (przez `territory_ranges_dto`) z tymi samymi danymi, co mgła aktywnego fotela ME().
Każdy wynik ma wektory z pinu i test równoważności z istniejącymi portami engine (`territory_owner_at`, `collect_territory_hex_keys_by_owner`), tak by trzecia kopia z view-model nie mogła się rozjechać bez wykrycia.

NIE w zakresie r1: zmiana `EngineCommand`/`BridgeResult` (kontrakt JSON — decyzja orkiestratora w r2), dodanie pól do `RenderLayersDto`/`RenderViewDto` w view-model (osobny temat po r2), zmiany w rendererze.

## PIN (przeczytaj przed zmianą; pin = `07d2fbd72`)
- `gra/src/main.ts:12801-12804` (`fogOn`, `revealAllLand`), `12980-13015` (`currentVisible`), `13059-13075` (`currentVisibleForOwner`), `13074-13080` (`startRevealKeysForRiverFog`), `13475-13513` (`refreshFog`), `13506` (`setFog(ALL_KEYS, ALL_KEYS)`), `15593-15601` (filtr mgły zasięgu terytorium dla ME()).
- `gra/src/game/visibility.ts:244-250` (`exploredSetForRender`), `:304` (`if (s.radius <= 0) continue;`).
- `gra/src/map/territory.ts:75-93` (`cityTerritoryRadius`).
- Istniejące producenty do użycia, NIE do przepisania: `engine/src/domain/state.rs` (~1028-1034 `explored_set_for_render`, ~1414 `fog_view_dto`, ~1441 `refresh_fog`), `engine/src/domain/territory.rs:229,469`, `view-model/src/map.rs:210-250` (`FogViewDto`, `FogRevealDto`), `view-model/src/territory_ranges_view.rs:249`.
- Rozbieżność znana z L1/L2: `riverRevealKeys` pochodzi z `startRevealKeysForRiverFog()` (`main.ts:13074-13080`), NIE z `rzeka_krawedzie` (`scene.ts:1263-1264` to tylko JSDoc logiki gry). Trzymać się pinu.

## ZAKRES (kroki w kolejności)
1. Nowy moduł `rust-port/engine/src/domain/dto_bridge.rs`, zarejestrowany w `domain/mod.rs` (jedna linia `pub mod dto_bridge;`).
2. Funkcja `build_fog_layers(state: &PlayableState, inputs: &FogViewInputs<'_>, explored: &mut ExploredByHuman) -> Result<FogLayers, DtoBridgeError>`, która zwraca `FogViewDto`, `fog_active`, `FogRevealDto` (klucze z `startRevealKeysForRiverFog` przez `compute_visible_at`, gdy `isAwaitingFirstPlayerCity` wg pinu; `None`/pusty zbiór przy mgle wyłączonej, jak w pinie). Wywołuje istniejący `refresh_fog`, nie kopiuje jego logiki.
3. Funkcja `build_territory_layers(state: &PlayableState, active_seat: PlayerId, explored_for_render: &BTreeSet<Klucz>, fog_active: bool) -> TerritoryRangesDto`, mapująca `PlayableState` na jawne wejścia `territory_ranges_dto` (właściciel per heks, miasta, forty, placówki, kolejność wstawiania wg pinu). Brak kopiowania `territory_owner_at`; użycie portu z `engine/src/domain/territory.rs`.
4. Błąd `DtoBridgeError` (enum, `thiserror` NIE — zgodnie z konwencją modułu: ręczny `Display`), obejmuje co najmniej `MissingExploredSeat` i `MissingStartHex`.
5. Test `rust-port/engine/tests/p4_364_dto_bridge.rs`:
   - wektory z pinu dla: mgła wyłączona; mgła ON; `revealAllLand` true; `riverRevealKeys` z `startRevealKeysForRiverFog` dla dwóch fotelów; zasięg terytorium dla ME()=0 i ME()=1 (użyj istniejących wektorów z `renderer/tests/territory_ranges_f2_vectors/vectors.json` i `renderer/tests/reveal_l12_vectors/vectors.json` — NIE generuj nowych, jeśli odpowiedni przypadek już tam jest; jeśli nie — dodaj generator w `rust-port/engine/tests/p4_364_dto_bridge_gen.mjs` i jego wynik `p4_364_dto_bridge_vectors/vectors.json`);
   - test równoważności: dla każdego przypadku `build_territory_layers` == `territory_ranges_dto` na wejściach zbudowanych ręcznie, i kolejność właścicieli == kolejność `collect_territory_hex_keys_by_owner`;
   - mutacje FAIL (zrób je i przywróć kod): (a) `river_reveal_keys` z `rzeka_krawedzie` zamiast pinu; (b) mgła ME() zastąpiona fotelem 0; (c) `reveal_all_land` ignorowane.
6. Brak zmian w `EngineCommand`, `BridgeResult` i `bridge.rs`. Brak zmian w rendererze i w view-model.

## ALLOWLISTA
`rust-port/engine/src/domain/dto_bridge.rs` (nowy), `rust-port/engine/src/domain/mod.rs` (jedna linia), `rust-port/engine/tests/p4_364_dto_bridge.rs` (nowy), opcjonalnie `rust-port/engine/tests/p4_364_dto_bridge_gen.mjs` i `p4_364_dto_bridge_vectors/vectors.json`, katalog `dyspozycje/autobot/runs/R-RUSTPORT-P4-364-DTO-BRIDGE-R1/`. Każdy inny plik → zaraportować w BLOKADACH, nie edytować.

## BRAMKI (EXIT 0)
`cargo fmt --check`, `cargo clippy --all-targets -- -D warnings` (engine), `cargo test --test p4_364_dto_bridge`, `cargo test --all-targets --no-fail-fast` (engine; pełny test trwa >10 min → uruchamiać w tle z zapisem EXIT do logu).
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie orkiestratora (poza repo), usunąć po bramkach. Nie uruchamiać bramki renderera (renderer nie jest zmieniany). Nie commitować `Cargo.lock`.

## KRYTERIA KOŃCA
- Zielone bramki, mutacje (a)(b)(c) dają FAIL.
- Commit jawnym `git add` z listy allowlisty. Trailer bez nazwy modelu (#289): NIE dodawać linii `Co-Authored-By` z nazwą modelu.
- Raport `01-operator-r1.md` w katalogu runs: STATUS, DOMAIN, TEMAT, GOAL, ZMIANY/COMMIT, TESTY, BLOKADY, RUNDY, NASTĘPNY KROK, DEPLOY/PUSH: NIE WYKONANO.
- Nie pushować do parity. Nie integrować.

## DECYZJE DLA ORKIESTRATORA (do zapisania w REJESTR-RUST.md przy integracji)
- D-364-1: producenci żyją w engine (`dto_bridge`), view-model zostaje zależny tylko od serde (D-DTO-1).
- D-364-2: kontrakt mostu JSON (nowe `EngineCommand`/`BridgeResult` dla warstw) = osobna decyzja r2, po zgodzie właściciela.
- D-364-3: `RenderLayersDto` nie dostaje nowych pól w r1.
