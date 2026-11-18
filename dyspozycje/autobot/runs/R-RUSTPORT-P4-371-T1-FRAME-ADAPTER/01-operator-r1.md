# R-RUSTPORT-P4-371-T1-FRAME-ADAPTER — Operator r1

```text
STATUS: PASS (pełna bramka: patrz TESTY)
DOMAIN: GAME (renderer CPU, bez reguł gry)
TEMAT: R-RUSTPORT-P4-371-T1-FRAME-ADAPTER (#371, T1)
GOAL: view::frame — z (&MapViewDto, &RenderLayersDto, &MapUiState, siege_map_panel_open) komplet wejść
      adapterów view::* i synchronizacja stanu CPU renderera (MapScene) w kolejności odświeżeń webu
ZMIANY/COMMIT: gałąź rust-port-wip/r-rustport-p4-371-t1-frame-adapter, SHA w odpowiedzi Operatora
      (commit kodu + raportu; raport nie może zawierać własnego SHA)
TESTY: fmt EXIT 0; clippy --locked --all-targets -D warnings EXIT 0; cargo test --locked --all-targets EXIT 0
      (705 passed / 0 failed, w tym view_frame 18/18); mutanty 7/7 wykryte (§4)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
```

BAZA: `origin/rust-port/parity-v2` = `51f36370d3a52cdc668140d345aaa3e4114796a4` (zgodnie z dispatchem).
Pin webu: `07d2fbd72` (`gra/src/main.ts`, `gra/src/render/scene.ts`), czytany przez `git show`.

## 1. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/renderer/src/view/frame.rs` | NOWY: `FrameError`, `MapStatic`, `FrameInputs`, `MapScene` (461 linii, w tym dokumentacja kolejności z cytatami pinu) |
| `rust-port/renderer/src/view.rs` | WYŁĄCZNIE `pub mod frame;` + `pub use frame::{FrameError, FrameInputs, MapScene, MapStatic};` (+2 linie) |
| `rust-port/renderer/tests/view_frame.rs` | NOWY: 18 testów na ręcznych DTO |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-371-T1-FRAME-ADAPTER/01-operator-r1.md` | ten raport |

Nietknięte: istniejące adaptery (`view/{cities,overlays,units,terrain,fog,convert,battle}.rs`), `engine/`,
`view-model/`, `src-tauri/`, moduł `gpu`, `Cargo.toml`. `Cargo.lock` NIE commitowany (patrz §5 D-T1-6).
Brak `#[ignore]`.

## 2. API

- `MapStatic::from_dto(&MapViewDto) -> Result<_, FrameError>` — waliduje mapę (`validate_map`, warunek wstępny
  adapterów kluczujących po współrzędnej), trzyma mapę i `overlay_map`; konstruktory `city_renderer()`,
  `wonder_renderer()`, `unit_renderer()` (`new CityRenderer/WonderRenderer/UnitRenderer(scene, map)`).
- `FrameInputs::from_dto(&MapStatic, &RenderLayersDto, &MapUiState, siege_map_panel_open) -> Result<_, FrameError>`:
  najpierw `contract_version == CONTRACT_VERSION` (jawny `FrameError::ContractVersion{expected, actual}`), potem
  `terrain_data(map, hex_state)`, `FogSets::from_dto(map, fog, viewer.fog_active)`, `okolica_map`,
  `CityInputs::from_dto`, `WonderInputs::from_dto`, `overlay_layers(...)` i
  `overlays.units.with_siege_map_panel_open(...)`; dodatkowo `city_hexes` (`setCityHexKeys`, `main.ts:14551`).
  Błędy adapterów przekazywane bez zmian (`View`/`City`/`Overlay`), bez panik.
- `MapScene::new(&MapStatic, &FrameInputs, MapDetailQuality)` — `buildScene` raz; `MapScene::apply(&FrameInputs)`.
  Akcesory tylko do odczytu + `units_mut()` (resolvery, patrz Długi).

## 3. Kolejność `MapScene::apply` (pin `07d2fbd72`)

Sekwencja wzorcowa = pełne odświeżenie mapy po wczytaniu gry `main.ts:46138-46156`
(`syncWonderRender` → `syncUnitsRender` → `cityRenderer.sync` → `refreshTradeRoutesOverlay` →
`refreshSiegeMarkers` → `refreshFog` → … → `refreshMapOverlayToggles`); ten sam wzór w nowej grze/playteście
`:45440-45456`, `:45710-45726`, `:45228-45230` i w aneksji `:35288-35290` (`cityRenderer.sync` → `syncUnitsRender` → `refreshFog`).

1. `syncWonderRender` (`:46139`, ciało `:4315-4318`) → `WonderInputs::sync`;
2. `syncUnitsRender` (`:46142`; `setForceVisibleUnitId`, `setCityHexKeys`, `unitRenderer.sync` `:14550-14553`,
   `render/units.ts:6095-6263`) → `set_city_hex_keys` + `view::sync_units`;
3. `cityRenderer.sync(cities, _cityRenderOpts())` (`:46143`) z buntem → `CityInputs::sync_with_revolt`;
4. `refreshTradeRoutesOverlay` (`:46150`, ciało `:15379-15397`) → grupa w `OverlayLayers`;
5. `refreshSiegeMarkers` (`:46151`, ciało `:17492-17530`) → `SiegeMarkerRenderer::sync` z
   `getTopY = unitRenderer.topYAt(q, r)` (`:17522`);
6. `refreshFog` (`:46152`, ciało `:13475-13520`): `setFog` (`:13489`/`:13506`) → `apply_terrain_fog`;
   `syncWorkerFieldOverlayFog` (`:13497`/`:13510`) już w `worker_field_overlay`; ponowne
   `syncUnitsRender(visibleUnitsList(vis))` (`:13501`/`:13511`) z tą samą listą — pominięte (idempotentne);
   `cityRenderer.applyFogVisibility` (`:13503`/`:13512`) → `apply_city_fog`; `wonderRenderer.applyFogVisibility`
   (`:13504`/`:13513`) → `apply_wonder_fog`; `refreshTerritoryBorderOverlay` (`:13517`) → grupa;
7. `refreshMapOverlayToggles` (`:46156`, `:15459-15463`): terytorium (`:15582-15616`), pola robotników
   (`:15432-15448`); zasięgi `:15626-15647`, okolica `:6644-6666`, warstwa kopalni `:15555-15568` — grupy danych;
8. `syncPlayerUnitSelectionOnMap` (`:7115-7135`, wołane na końcu tury `:43792`) i `refreshBuildHighlight`
   (`:16351-16396`) → `UnitOverlayInputs::apply` (pierścień, jedna warstwa podświetlenia Q6-2, trasa).

Zależności kolejności zmieniające stan: `applyFogVisibility` PO `sync` swojego renderera (sync ustawia
`group.visible` z `isVisible`/buduje nowe modele widoczne; mgła nadpisuje — `render/cities.ts:740-763`,
`wonderRenderer.ts:114-123`); `_visCache` w `isVisible` (`main.ts:2975`, `:13082-13086`) może być nieaktualny,
dlatego web woła mgłę po sync. Wywołania pierścienia/podświetlenia po sync jednostek.

## 4. TESTY

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR` = scratchpad `t1frame/target` (poza repo, usunięty po bramkach). Bez `--features gpu`.
Wolne na `/` przy starcie: 13 GB; w trakcie spadło do 8,4 GB przez inne workery (mój target ~0,2 GB po clippy);
brak równoległego buildu `civ_renderer` (sprawdzone `pgrep`).

| Bramka (w `rust-port/renderer`) | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --locked --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --locked --test view_frame` | 18 passed, 0 failed |
| `cargo test --locked --all-targets` (pełny, `setsid nohup`, log z `EXIT=`) | EXIT 0 (16:06:00–16:08:52 UTC); 81 binarek testowych `test result: ok`, suma 705 passed, 0 failed |

Testy `tests/view_frame.rs` (kryteria końca):
- komplet wejść: `frame_inputs_hold_every_adapter_input` (miasto, jednostka, oblężenie, mgła, terytorium, cud);
- błędy: `wrong_hex_state_length_is_an_error`, `wrong_fog_state_length_is_an_error`,
  `contract_version_other_than_2_is_an_error` (0, 1, 3, u16::MAX odrzucone; 2 przyjęte; `CONTRACT_VERSION == 2`),
  `contract_version_is_checked_first`, `invalid_static_map_is_an_error`, `adapter_errors_are_passed_on`;
- kolejność: `apply_matches_the_web_call_sequence` (stan po `apply` == ręczna sekwencja adapterów w kolejności
  pinu, dla panelu oblężenia zamkniętego i otwartego; porównanie: teren, ocean, scena miast, bunt, cuda, żetony,
  pierścienie generałów, podświetlenie, zaznaczenie, trasa, znaczniki oblężenia, grupy nakładek),
  `city_fog_comes_after_city_sync`, `wonder_fog_comes_after_wonder_sync`, `revolt_sprite_follows_city_sync`,
  `siege_marker_of_the_besieged_city`, `siege_map_panel_gate_is_applied`, `unit_tokens_are_synced`,
  `city_hex_keys_reach_the_unit_renderer`, `terrain_fog_is_applied`;
- idempotencja: `apply_is_idempotent` (3× `apply` tej samej ramki = ten sam stan), `next_frame_updates_the_state`.

Mutanty (skrypt `t1frame/mut/run.sh` + `mutate.py`, przywrócenie sprawdzone `cmp` → RESTORED):

| Mutant | Wynik | Testy, które padły |
|---|---|---|
| M1 mgła (teren/miasta/cuda) przed sync miast i cudów | WYKRYTY | city_fog_comes_after_city_sync, wonder_fog_comes_after_wonder_sync, apply_matches_the_web_call_sequence, next_frame_updates_the_state |
| M2 pominięcie `apply_city_fog` | WYKRYTY | city_fog_comes_after_city_sync, apply_matches…, next_frame… |
| M3 pominięcie `with_siege_map_panel_open` | WYKRYTY | siege_map_panel_gate_is_applied, apply_matches… |
| M4 zły próg wersji (`<` zamiast `!=`) | WYKRYTY | contract_version_other_than_2_is_an_error |
| M5 pominięcie `apply_wonder_fog` | WYKRYTY | wonder_fog_comes_after_wonder_sync, apply_matches… |
| M6 zły próg wersji (`!= 1`) | WYKRYTY | wszystkie 16 korzystających z ramki |
| M7 pominięcie `set_city_hex_keys` | WYKRYTY (po dodaniu testu; w pierwszym przebiegu przeżył) | city_hex_keys_reach_the_unit_renderer |

## 5. Decyzje techniczne (do REJESTR-RUST.md przez orkiestratora)

- **D-T1-1 (MapStatic vs dispatch):** `okolica_map` i dane terenu czytają `hex_state` (`covering_improvement`,
  `terraces`) — to warstwa dynamiczna, więc liczone są w `FrameInputs`, nie w `MapStatic`. `MapStatic` trzyma
  zwalidowaną mapę, `overlay_map` i konstruktory rendererów.
- **D-T1-2 (scena terenu raz na grę):** `TerrainScene` budowana raz w `MapScene::new` z pierwszej ramki — pin buduje
  scenę raz (`main.ts:2173`, `:44769`), a `tarasy` czyta tylko przy budowie (`scene.ts:2465-2470`; późniejsze
  tarasy to osobny model ulepszenia, `main.ts:17073-17086`). Kolejne ramki tylko `setFog`.
- **D-T1-3 (`getTopY` oblężeń):** wg pinu `unitRenderer.topYAt` (`main.ts:17522`) = `MapUnitRenderer::top_y_at`
  zamiast `TerrainPickScene` z `SiegeInputs::sync` (scena pickingu wymagałaby budowy geometrii co ramkę; wartość
  ta sama — wysokość terenu heksa). Wywołanie `SiegeMarkerRenderer::sync` z publicznych pól `SiegeInputs`, bez
  zmiany adaptera.
- **D-T1-4 (`landReveal`):** `RenderLayersDto` nie niesie `FogRevealDto` (L1/L2), więc `land_reveal = false` =
  stan startowy pinu `revealAllLand = false` (`main.ts:12803`; to przełącznik deweloperski `:13594`).
- **D-T1-5 (drugie `syncUnitsRender` w `refreshFog`):** pominięte — lista jednostek DTO jest już przefiltrowana mgłą
  przez producenta, a `sync` z tą samą listą jest idempotentny (test idempotencji).
- **D-T1-6 (`Cargo.lock`):** śledzony `renderer/Cargo.lock` na bazie nie zawiera `civ-view-model` (+itoa,
  serde_json, zmij) — `--locked` na czystej bazie kończy się błędem „cannot update the lock file”. Jak w
  poprzednich tematach renderera (Q6, 1H-MOVE-Q6): lokalnie uzupełniony przez `cargo check` bez `--locked`,
  bramki uruchomione z `--locked`, zmiana NIE commitowana (cofnięta `git checkout`). Dług poza allowlistą.
- **D-T1-7 (walidacja warstw):** `FrameInputs` sprawdza jawnie wersję kontraktu i polega na adapterach dla długości;
  pełnego `RenderLayersDto::validate` (skończoność liczb itp.) nie woła co ramkę — to kontrakt producenta.

## 6. Długi

- **DŁUG-T1-RESOLVERS:** `MapScene` nie ustawia resolverów `wireUnitRendererRingStance` (`main.ts:10344-10384`:
  postawa pierścienia, `civColorFn`, emblemat właściciela) — mapowanie relacji → postawa to logika webu, nie
  adapter; zostają domyślne. Dostęp przez `MapScene::units_mut()`; temat T2 (klient) albo osobny adapter.
- **DŁUG-T1-LOCK:** śledzony `rust-port/renderer/Cargo.lock` nieaktualny (brak `civ-view-model`); CI z `--locked`
  na tej bazie powinno padać — NIE_ZMIERZONO w CI. Do osobnego mikrotematu (allowlista z `Cargo.lock`).
- Luki wejściowe poza tematem (bez zmian): `revealAllLand`/`riverRevealKeys` (L1/L2), `wonderBuildSites` (L5),
  `cityPanelViewCityId` w `isVisible` (L4), `RENDER_FRAME_GAPS` (workerFields, starving/goldDeficit), `battle = None`
  (bitwa nie jest częścią `MapScene`), DŁUG-FRAME-RESELECT (T5a/T5b).
- Notatka FC spoza tematu: `MAX_PER_SIDE=120` w `battle/field.rs` — NIE ten temat, nie ruszane.
- **DŁUG-T1-NOT-SYNCED (dopisek obrony, zarzut Evaluatora Z4):** `MapScene` NIE wykonuje wywołań pinu, których
  renderery nie należą do `MapScene`, choć mają porty CPU: `cityRenderer.syncStatChips` (`main.ts:14563`;
  `cities/sync/stat_chips.rs:201`), `syncForestForUnits` (`main.ts:14562`; `decor/placement/mod.rs:244`),
  w `refreshFog` `syncCampMeshes`/`syncVillageMeshes` (`:13488-13489`) oraz
  `syncResourceOverlayFog`/`syncImprovementMeshFog`/`syncSettlementMeshFog` (`:13495-13497`, `:13507-13509`;
  `improvements/sync/mod.rs`, `MapObjectsLayer`), `reapplyWonderHexDecorHides` (`:4317`;
  `decor/placement/mod.rs:237`). Pola `MapUiState::hover_stat_chip_city_id` i `city_panel_view_city_id` nie mają
  odbiorcy w `MapScene`; `is_city_panel_open` ma tylko bramkę granic terytorium (`main.ts:15583`), nie
  `hideStatChips`. Lista także w nagłówku `view/frame.rs` („Not synced by MapScene”). Do tematu klienta (T2) albo
  rozszerzenia `MapScene` (osobny dispatch).
