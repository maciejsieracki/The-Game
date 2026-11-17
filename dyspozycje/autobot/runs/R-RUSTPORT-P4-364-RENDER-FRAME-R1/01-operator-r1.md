# R-RUSTPORT-P4-364-RENDER-FRAME-R1 — Operator, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-RENDER-FRAME-R1
GOAL: składacz pełnej ramki renderera (`RenderLayersDto`) i mapy statycznej (`MapViewDto`) z `PlayableState` + sesji mgły, wystawiony przez most komendami `GetRenderMap` / `GetRenderFrame` (D-R3-1..6).
ZMIANY/COMMIT: gałąź `rust-port-wip/R-RUSTPORT-P4-364-RENDER-FRAME-R1`, SHA w sekcji „Commit” (kod + raport w jednym commicie).
TESTY: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0; `cargo test --test p4_364_render_frame` 16/16 EXIT 0; pełne `cargo test --all-targets --no-fail-fast` (engine) EXIT 0 (3944 passed, 0 failed). Mutacje (a)–(e): 6/6 FAIL (oczekiwane).
BLOKADY: brak blokad infrastruktury. Pięć jawnych luk ramki (tabela „Luki”), do rundy r2 tego samego ID.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO

## Baza

`origin/rust-port/parity-v2` = `0f77c9da3741da76df7cd8a99a56371e1ab75129` (zgodna z linią BAZA dispatchu). Gałąź: `git checkout -B rust-port-wip/R-RUSTPORT-P4-364-RENDER-FRAME-R1 origin/rust-port/parity-v2`. Pin webu `07d2fbd72` tylko do odczytu (`git show`).

## Zmiany

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/render_frame.rs` (NOWY) | `RenderUiParams` (camelCase, `#[serde(default)]`, `deny_unknown_fields`; pola `selectedUnitId`, `hover`, `foundCityMode`, `wonderActive`, `buildModeOpen`, `activeImprovementKey` = nazwy z `SelectionUi`/`BuildHighlightUi`/`UnitOverlaysInput`); `RenderMapPayload` / `RenderFramePayload` (`#[serde(transparent)]`); `RenderFrameError`; `snapshot_map_of`, `render_map`, `build_render_frame`, `session_render_frame`; `RENDER_FRAME_GAPS`. |
| `rust-port/engine/src/domain/mod.rs` | tylko `pub mod render_frame;` |
| `rust-port/engine/src/bridge.rs` | `EngineCommand::GetRenderMap`, `EngineCommand::GetRenderFrame { seat, ui }`; `BridgeResult::RenderMap { map }`, `BridgeResult::RenderFrame { frame }`; `EnginePort::render_map` / `render_frame` z domyślnym `engine_rejected`; implementacja w `CivEngineAdapter`; dyspozytor: obie komendy bez `StateChanged`; `MockEngineAdapter` — tylko gałęzie `match` (domyślne odrzucenie). `CONTRACT_VERSION` = 1 bez zmian. |
| `rust-port/engine/tests/p4_364_render_frame.rs` (NOWY) | testy (a)–(h). |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-364-RENDER-FRAME-R1/` | raport, `mutate-r1.py`, logi bramek. |

`playable.rs`, `dto_bridge.rs`, `map_view.rs`, `city_view.rs`, `overlays_view.rs`, `recruitment.rs`: **bez zmian** (żadne `pub` nie było potrzebne). View-model i renderer: bez zmian.

### Pliki spoza allowlisty (mechanicznie, wyczerpujący `match`)

- `rust-port/engine/tests/p4_364_bridge_layers.rs:57` — ramię `BridgeResult::State { .. } => panic!(…)` zamienione na `_ => panic!(…)` (nowe warianty `BridgeResult`); treść komunikatu bez zmian.
- Uwaga (bez zmian, poza zakresem): root `tests/bridge_contract.rs:16-18` ma `match` z jednym ramieniem `State` — był niewyczerpujący już od r2 (`RenderLayers`); nie należy do bramki engine.

## Decyzje techniczne operatora

- **D-OP-1**: `build_render_frame` bierze `&mut PlayableFogSession` (dispatch D-R3-4 pisze `&`). Jedyna mutacja = kumulacja eksploracji fotela, identyczna jak `GetRenderLayers` z r2 (`refreshFog` → `addExplored`, `main.ts:13475-13513`). `PlayableState` nie jest zmieniany (test f).
- **D-OP-2**: mapa statyczna z `PlayableState` przez `snapshot_map_of` (teren jak `playable_movement::teren_of`: `Plains→rownina`, `Hills→wzgorza`, `Forest→rownina+las`, `Water→morze`; ulepszenia z `map.improvements`; brak rzek/wiosek/złóż — stan ich nie niesie). D-R3-6 spełnione bez nowego pola sesji.
- **D-OP-3** (Q6-2, D-R3-3): aktywny tryb budowy (`build_highlight_mode_active`) = web `onOpenBuild` → `clearPlayerUnitSelection()` (`main.ts:26702-26703`, `:7090-7106`): `selection = None`, `reachable = []`, `pathRoute = None`.
- **D-OP-4**: `RenderUiParams.selectedUnitId` zasila `selection`, `reachable` i `pathRoute` (w webie jedna zmienna `selectedId`, `main.ts:7116`); `PlayableState.selected_unit_id` nie jest czytany przez ramkę (gdy się różni, producenci F5 dostają kopię stanu z polem z UI).
- **D-OP-5**: `BridgeResult` derywuje `Eq`, a DTO view-model mają tylko `PartialEq` (f64) — opakowania `RenderMapPayload`/`RenderFramePayload` z `#[serde(transparent)]` i ręcznym `impl Eq` (wzorzec `MovementPoints`). JSON = `{"kind":"render_frame","frame":{…RenderLayersDto…}}` 1:1.
- **D-OP-6**: `areEnemyOwners` dla `siege_views` = `a != b && (barbarzyńca || relacja == wojna)` (`main.ts:13129-13133`) na `state.war.diplomacy`.

## Tabela pól ramki (pole | źródło | web | uwagi)

| Pole | Źródło | Web (pin 07d2fbd72) | Uwagi |
|---|---|---|---|
| `contractVersion` | `civ_view_model::CONTRACT_VERSION` (= 2) | — | most: `CONTRACT_VERSION` = 1 (test g) |
| `viewer.ownerId` | fotel zapytania | `ME()` | test d |
| `viewer.fogActive` | `build_view_layers` (`useFogRender`) | `main.ts:13485` | jak r2 |
| `turn` | `state.turn` | — | |
| `hexState` | `map_view::build_hex_dyn(snapshot_map_of, pozycje miast)` | `main.ts:17083`, `:3366-3368` | kolejność `build_map_view` (test b) |
| `fog` | `dto_bridge::build_view_layers` | `refreshFog` `:13475-13513` | kumuluje eksplorację w sesji |
| `owners` | `city_view::owner_views` | `_cityRenderOpts` `:2939-3004` | fakty spoza stanu: brak kolejki, buntu, wzrostu na żywo, miast-państw |
| `cities` | `city_view::city_views` | j.w. | `besieged` = `state.oblegane` |
| `units` | NOWY minimalny producent `unit_view` | `syncUnitsRender` `:14450-14465`, `unitsVisibleOnMap` (`visibility.ts:327-336`) | filtr mgły przy `fogOn`; `hp` brak = `def.health` (`unitHealth`, `:33093-33095`; Wojownik = 22); `veteranStars` = `veteranStarCount(battlesSurvived)`; odznaki = `armor/softPathBadgeLevel(undefined)`; `embarked/inGarnizon/isGeneral/dimmed` = web undefined/false (brak w stanie) |
| `stacks.visibleIds`, `badgeByRepId` | `recruitment::army_merge::compute_stack_display` | `main.ts:14476`, `armyMerge.ts:584-646`, `unitAttackScore` = `meleeAttack` (`:14436-14438`) | test h (stos ×2, remis → mniejsze id) |
| `stacks.vitalsByRepId`, `starvingRepIds`, `goldDeficitRepIds` | — | `:14476-14546` | LUKA (tabela niżej) |
| `sieges` | `overlays_view::siege_views` | `refreshSiegeMarkers` `:17492-17530` | `areEnemyOwners` D-OP-6 |
| `wonders` | `overlays_view::wonder_views` | `placedWonderSnapshot` `:4205-4210` | |
| `territory` | NOWY: `territory::collect_territory_hex_keys_by_owner` + `dto_bridge::engine_territory_nodes` | `refreshTerritoryBorderOverlay` `:15582-15601` | filtr `isMe ∨ !fogOn ∨ vis ∨ explored`; kolejność `Map`/`Set` odtworzona przejściem `Object.keys(map.hexes)` (`hex_order`); `territoryBorderVisible` = domyślne `true` (`:15338`) |
| `overlays.cultureRange` / `religionRange` | `None` | `cultureRangeVisible = religionRangeVisible = false` (`:15335-15336`) | web daje brak warstwy w tym stanie UI |
| `overlays.tradeRoutes` | `overlays_view::trade_routes_view(&[], …)` | `:15379-15397` | stan nie ma `tradeRoutes` (`:3454`) → `[]` jak web bez tras |
| `overlays.okolica` | `None` | `syncOkolicaOverlay` `:6645` | panel miasta zamknięty (brak pola UI) |
| `overlays.workerFields` | `[]` | `:15432-15448` | LUKA |
| `overlays.reachable` / `selection` / `pathRoute` | `overlays_view::unit_overlays_view` | `:7115-7134`, `:31146-31211` | D-OP-3, D-OP-4 (test c) |
| `overlays.buildHighlight` | `overlays_view::build_highlight` | `:16351-16395` | `kind` z trybu; `hexes` LUKA |
| `battle` | `None` | — | stan nie ma otwartej bitwy |

## Luki (jawne, `RENDER_FRAME_GAPS` + test `h_jawne_luki_ramki`) — do r2

| Pole | Teraz | Powód |
|---|---|---|
| `overlays.workerFields` | `[]` | web liczy pola robotników wszystkich miast (`showWorkerOverlay = true`); `worker_fields_view` wymaga modelu miast ekonomii (`okolicaFocus/Tryb/Reczne`) i `BuildMap`, których `PlayableState` nie niesie (EKONOMIA-STAN #310) |
| `overlays.buildHighlight.hexes` | `[]` (kind poprawny) | brak adapterów `PlayableState` → `canFoundCity`, `qualifyingWonderHexesForPlayer`, `buildApi.getQualifyingHexes` |
| `stacks.vitalsByRepId` | `[]` | `StackVitalsDeps` (`hpMaxEffective`, `combatPowerFullDisplayDefFor`, `sumRosterFieldM`) nieportowane |
| `stacks.starvingRepIds` / `goldDeficitRepIds` | `[]` | `isArmyHungry` / `isGoldDeficit` — magazyn żywności i skarbiec per właściciel poza stanem (#310) |
| `units[].hp` (brak hp w stanie) / `hpMax` | `health` z `units.json` / `economy.units[id].hpMax` | `hpMaxEffective` z bonusami trwałymi nieportowany |

## Testy (`tests/p4_364_render_frame.rs`, 16)

(a) `GetRenderMap` == `build_map_view(snapshot_map_of(stan))` + `validate_map`; (b) `hexState`/`fog` równoległe do `map.hexes`; (c) Q6-2 trzy tryby budowy czyszczą selekcję/zasięg/trasę, bez trybu `reachable` == `reachable_overlay`, `buildModeOpen` bez klucza nie czyści, kopalnia → `kind = mine`, brak UI = brak selekcji; (d) fotel 2: inny `viewer`, mgła, brak cudzych jednostek; nieznany fotel → `EngineRejected`; (e) trzy wywołania → identyczny JSON; (f) `EngineState` bez zmian, brak zdarzeń, eksploracja tylko w sesji; mock odrzuca; (g) JSON komend/odpowiedzi (`kind`, camelCase, `ui` z `deny_unknown_fields`, stary JSON `GetState`/`GetRenderLayers`/`MoveUnit`), `CONTRACT_VERSION` = 1; (h) wektory pól scenariusza startowego, stosy i filtr mgły jednostek, odrzucenie fotela przez składacz, lista luk.

## Mutacje (`mutate-r1.py`, log `mutate-r1.log`)

| Mutacja | Wynik |
|---|---|
| a1 składacz pomija `cities` | FAIL: `h_pola_ramki_scenariusza_startowego` |
| a2 składacz pomija `units` | FAIL: `d_fotel_2…`, `h_stosy…`, `h_pola_ramki…` |
| b ignoruje `seat` | FAIL: `d_nieznany_fotel_odrzucony`, `d_fotel_2…` |
| c ignoruje `ui.buildMode` | FAIL: `c_tryb_budowy_czysci_zaznaczenie_zasieg_i_trase` |
| d komenda emituje `StateChanged` | FAIL: 8 testów |
| e `CONTRACT_VERSION` = 2 | FAIL: `g_json_komend_i_odpowiedzi` |

## Bramki

Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (poza repo, usunięty po bramkach). Dysk przed pełną bramką: 11 GB wolne.

- `cargo fmt --check` — EXIT 0 (`gate-fmt-r1.log`)
- `cargo clippy --all-targets -- -D warnings` — EXIT 0 (`gate-clippy-r1.log`)
- `cargo test --test p4_364_render_frame` — 16 passed, EXIT 0 (`gate-test-r1.log`)
- `cargo test --all-targets --no-fail-fast` (engine) — EXIT 0: 527 bloków `test result: ok`, 3944 passed, 0 failed (w tle `setsid nohup`, EXIT zapisany w logu) (`gate-full-test-r1.log`)

`Cargo.lock` nie commitowany.

## Commit

Kod i raport w jednym commicie na `rust-port-wip/R-RUSTPORT-P4-364-RENDER-FRAME-R1` (SHA = `git rev-parse rust-port-wip/R-RUSTPORT-P4-364-RENDER-FRAME-R1`, podany w wyniku workflow; raport nie może zawierać własnego SHA).
