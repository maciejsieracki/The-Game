# 01 — Operator r1 — R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME (grafika / DTO renderera)
TEMAT: R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES
GOAL: adapter miast, cudów, herbów i odznak: cities[]/owners[]/wonders[]/CityBadgeDto (DTO) → wejścia renderera (City, CityRenderOptions, PlacedWonder, WonderRenderOptions, OwnerEmblemContext, CityMapBadgeInput) + mgła miast i cudów z FogSets (Q1)
ZMIANY/COMMIT: kod + raport w 232ab2c5006ac6e6e00128e4f11bce854b8d7ea5 (gałąź wip/R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES-r1, rodzic 601ff304c); ten wpis SHA w commicie następnym (tylko raport)
TESTY: view_adapter_cities 16/16; fmt EXIT 0; clippy -D warnings EXIT 0; cargo test --all-targets --no-fail-fast EXIT 0 (65 binarek, 518 passed / 0 failed / 0 ignored); mutacje 5/5 FAIL
BLOKADY: brak (luki L1, L5 i brak integratora R5 = NIE_ZMIERZONO, niżej)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## Baza

- Dispatch: `origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES/00-dispatch.md`.
- Baza: `origin/rust-port/parity-v2` = `601ff304c571a08557b5b3cab62b7bfdb9975e51` (zgodna z dispatchem; `git rev-parse` po `git fetch`). Worktree detached, potem gałąź robocza `wip/R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES-r1`.
- Pin `07d2fbd72` tylko do odczytu (`git show`).
- Specyfikacja: `dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` (z `origin/claude/rust-sivvrn`; na bazie parity-v2 pliku nie ma — B-DOC) §3.4, §3.6, §4, §5, §7.

## Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/renderer/src/view/cities.rs` | NOWY |
| `rust-port/renderer/src/view.rs` | tylko `pub mod cities;` + `pub use cities::{…}` |
| `rust-port/renderer/tests/view_adapter_cities.rs` | NOWY |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES/01-operator-r1.md` | ten raport |

`Cargo.lock` zmieniony przez cargo lokalnie — NIE commitowany. `view/terrain.rs` (Q2) nietknięty. Zero zmian w `gra/`.

## Co robi `view/cities.rs`

Użyte z Q1 bez duplikatu: `owner_i32` (błąd `OwnerOutOfI32`), `city_id_string`, `city_wall_kind`, `map_outline_kind`, `pick_hex`, `terrain`, `FogSets`.

1. **`CityInputs::from_dto(owners, cities)`** → `cities: Vec<City>` (kolejność `cities[]`) + tabele per właściciel / per miasto. `with_render_options(|opts| …)` pożycza `CityRenderOptions` (renderer bierze domknięcia przez `&dyn Fn`, więc dane trzyma `CityInputs`) wg `_cityRenderOpts` (`main.ts:2939-3005`):
   - `get_era` ← `owners[].era` (`:2949`), `get_civ` ← `BronzeCiv::from_web_id(owners[].bronze_civ)` (`:2955`; producent już stosuje `ikonaIdToBronzeCiv`), `get_level` ← `cities[].level` (`:2956-2959`), `get_wall_kind` ← `cities[].wall_kind` (`:2961-2966`), `is_visible` ← `cities[].fog_visible` (`:2973-2976`, część mgłowa), `get_map_outline_kind` ← `owners[].map_outline_kind` (`:2972`), `owner_color_fn` ← `owners[].color` (`:2978`);
   - `get_walls = None`: przy podanym `get_wall_kind` renderer go nie czyta (`renderer.rs:498-506`).
   - `sync` / `sync_map_outlines` wołają `CityRenderer` z tymi opcjami.
2. **`WonderInputs::from_dto(owners, wonders)`** → `Vec<PlacedWonder>`; `sync` = `wonderRenderer.sync(placedWonderSnapshot(), { ownerColorFn: civColorFn })` (`main.ts:4316`, bez `isVisible`). `placed_wonder` dla pojedynczego DTO.
3. **`owner_emblem_context`** (`units/overlay/emblem.rs:28`) i **`atlas_owner_emblem_context`** (`raster/atlas/keys.rs:264`) wg `setOwnerEmblemResolver` (`main.ts:10373-10384`): `civ_id = None` dla barbarzyńców niezależnie od `civ_icon_id`, `Some(civ_icon_id)` dla pozostałych; `ring_hex = None` dla barbarzyńców i miast-państw (`:10381-10383`).
4. **`city_badge_input(dto, hover_expanded, lod_level)`** → `CityMapBadgeInput` (17 pól DTO wg `_buildBadgeInput`, `render/cities.ts:905-929`; `prod_kind` enum → `"budynek"/"jednostka"`, `owner_color`/`era` → `Some`). `hoverExpanded` (`:888`) i `lodLevel` (`:928`) to stan renderera/UI — jawne parametry, bez domyślnych.
5. **Mgła:** `apply_city_fog(renderer, fog, viewer)` = `applyFogVisibility(vis, fogOn, ME())` (`main.ts:13503`, `:13512`; `ME()` = `viewer.owner_id` przez `owner_i32` → błąd przy przepełnieniu); `apply_wonder_fog(renderer, fog)` = `applyFogVisibility(vis, fogOn)` (`:13504`, `:13513`; cuda bez wyjątku dla własnych — jak w pinie).
6. `city_renderer(map)` / `wonder_renderer(map)` = `new CityRenderer/WonderRenderer(scene, map)` z `map.hexes`.

### Decyzje techniczne (do rejestru, bez gameplay)

- **Nieznany `bronze_civ` → błąd `UnknownBronzeCiv`** (zamyka NIE_ZMIERZONO §8 pkt 2 dokumentu po stronie adaptera): producent (`engine/src/domain/city_view.rs:201`, `:449`) wysyła już klucz `BronzeCiv`, więc nieznany klucz to złamanie kontraktu, nie przypadek fallbacku.
- **Właściciel miasta/cudu bez wpisu w `owners[]` → błąd `MissingOwner`**; zduplikowany właściciel / id miasta → `DuplicateOwner` / `DuplicateCity`. Nowy typ `CityAdapterError` w `cities.rs` (opakowuje `ViewAdapterError` z Q1; allowlista nie pozwala dopisywać wariantów do `ViewAdapterError` w `view.rs`).
- Fallbacki domknięć dla argumentów spoza tabel (nieosiągalne dla `CityInputs::cities` / `WonderInputs::placed` — sprawdzone w `from_dto`): domyślne renderera/pinu (era 1, `default_civ`, poziom 1 `main.ts:2958`, mur `none`, widoczne `?? true`, brak obrysu); kolor: domyślny `ownerColor`/`default_owner_color`, `0` gdy ten jest `undefined` (tylko by spełnić typ `u32`; nieosiągalne).
- Typ `OwnerEmblemContext`: dostarczone oba (emblem + atlas), z jednej funkcji — wybór/scalenie duplikatu typów poza zakresem (NIE_ZMIERZONO §8 pkt 10 dokumentu pozostaje).

## Testy (`rust-port/renderer/tests/view_adapter_cities.rs`, 16)

Fixture: mapa 4×3 (łąka), właściciele: barbarzyńca (`-1`, z celowo podanym `civ_icon_id` i `ring_hex`), gracz 0 (widz, `rzym`, era 2), gracz 3 (`egipt`, era 3); miasta: własne `10` @(1,1) palisada, obce `11` @(3,0) mur, niewidoczne, barbarzyńskie `12` @(0,2); cud `piramidy` gracza 3 @(2,2). Mgła: widoczne (1,1),(0,2); odkryte (3,0),(2,2). Każda wartość oczekiwana z linią pinu w komentarzu testu.

| Test | Sprawdza |
|---|---|
| `cities_become_renderer_cities_in_dto_order` | `City{id,owner_id,q,r,population}`, kolejność, `-1` dla barbarzyńcy |
| `render_options_follow_city_render_opts` | wszystkie 8 pól `CityRenderOptions` (`main.ts:2949-2978`) |
| `city_renderer_sync_uses_the_options` | `visual_key` `roblox|2|rzym|3|palisada` itd., `visible`, klucze obrysów |
| `city_fog_hides_foreign_cities_outside_visible` | fog on: obce poza `visible` ukryte, własne i widoczne pokazane; fog off: widoczne |
| `own_city_outside_visible_stays_visible` | własne miasto na nieodkrytym heksie widoczne |
| `wonder_fog_hides_wonder_outside_visible` | cud poza `visible` przy fog on ukryty, przy fog off widoczny |
| `viewer_owner_overflow_is_an_error` | `ME() > i32::MAX` → `OwnerOutOfI32` |
| `wonders_become_placed_wonders_with_civ_color` | `PlacedWonder`, klucze, model = `build_wonder_model` z kolorem z `owners[]` |
| `barbarian_emblem_has_no_civ_id` | barbarzyńca → `civ_id = None`, `ring_hex = None` (oba typy) |
| `player_emblem_has_civ_id` | gracz → `Some(id)`, `ring_hex` zachowany |
| `city_state_emblem_has_no_ring` | miasto-państwo → `ring_hex = None` |
| `badge_maps_every_dto_field` | pełne `CityMapBadgeInput` + `production_kind` |
| `badge_each_field_reaches_the_input` | każde z 17 pól DTO zmienia wejście |
| `city_owner_overflow_is_an_error` | przepełnienie w `owners[]`, `cities[]`, `wonders[]` → błąd, nie saturacja |
| `contract_violations_are_errors` | `UnknownBronzeCiv`, `DuplicateOwner`, `DuplicateCity`, `MissingOwner` (miasto rebelianta `-99`, cud gracza 7) |
| `renderers_take_the_static_map` | `city_renderer(map)` bierze teren z mapy (różne `y`) |

### Mutacje (skrypt sed na kopii `cities.rs`, przywrócenie sprawdzone `cmp` → RESTORED)

| Mutacja | Wynik |
|---|---|
| M1 `civ_id` barbarzyńcy = `Some(civ_icon_id)` | FAIL: `barbarian_emblem_has_no_civ_id` (15 passed / 1 failed) |
| M2 pominięty filtr mgły cudu (`apply_wonder_fog` nic nie robi) | FAIL: `wonder_fog_hides_wonder_outside_visible` (15/1) |
| M3 `CityBadgeDto` bez pola (`prod_item_name: None`) | FAIL: `badge_maps_every_dto_field`, `badge_each_field_reaches_the_input` (14/2) |
| M4 (dodatkowa) pominięty filtr mgły miast | FAIL: `city_fog_hides_foreign_cities_outside_visible` (15/1) |
| M5 (dodatkowa) `ring_hex` bez filtra barbarzyńca/miasto-państwo | FAIL: `barbarian_emblem_has_no_civ_id`, `city_state_emblem_has_no_ring` (14/2) |

### Bramki (`rust-port/renderer`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo)

- `cargo fmt --check` → EXIT 0
- `cargo clippy --all-targets -- -D warnings` → EXIT 0
- `cargo test --all-targets --no-fail-fast` → EXIT 0; 65 wyników `test result: ok`, suma 518 passed, 0 failed, 0 ignored
- `git diff --check` → czysto; brak `#[ignore]`; brak osłabionych asercji.

## NIE_ZMIERZONO

1. **L1 `revealAllLand`** — pola nie ma w DTO (`ViewerDto` ma tylko `owner_id`, `fog_active`); pin rysuje mgłę przy `fogOn || revealAllLand` (`main.ts:13485`). Adapter używa wyłącznie `fog_active` przez `FogSets`; nie wymyślono pola.
2. **L5 `wonderBuildSites`** (place budowy cudów, `main.ts:5264`) — nie ma w DTO; nie obsłużone, nie wymyślone. Czy place są renderowane — NIE_ZMIERZONO.
3. **Brak integratora R5** (`CityRenderer.syncStatChips`, `main.ts:14563`) — `city_badge_input` buduje tylko wejście; rysowanie plakietek na mapie z DTO nie istnieje.
4. Część UI `isVisible` (`cityPanelViewCityId`, luka L4) i `hideStatChips` — poza DTO, poza zakresem.
5. `getRevolt` / `getUnitCountOnHex` — brak konsumenta w rendererze (R6), pola DTO nieużyte.
6. `civColorFn` / `empireEpochForOwner` dla właściciela spoza `owners[]` — w adapterze nieosiągalne (błąd `MissingOwner`); zachowanie pinu dla takiego id nie mierzone.

## Uwagi środowiskowe

- `CARGO_TARGET_DIR` ustawiony w katalogu scratchpad sesji (`…/scratchpad/tgt`); ten sam katalog używa równoległy Operator Q2 (widoczny jego skrypt w scratchpadzie), więc NIE usunąłem go po bramkach, by nie przerwać jego kompilacji — do usunięcia przez orkiestratora po zakończeniu obu rund.
