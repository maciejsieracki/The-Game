# P4-1G — rozpoznanie adaptera `renderer/src/view.rs` (DTO widoku → wejścia renderera)

**Temat:** `R-RUSTPORT-P4-1G-ADAPTER-ROZP-Q1` (zadanie #216, rozpoznanie przed `R-RUSTPORT-P4-1G-VIEW-ADAPTER`).
**Rola:** Operator r1. **Charakter:** wyłącznie odczyt, zero zmian kodu, zero `cargo`.
**Baza:** `origin/rust-port/parity-v2` = `2f9a12786d4056dc499037667edbcf8cb5041fb8` (stan w chwili startu).
**Pin webu:** `07d2fbd72` (`gra/src/**`, czytany przez `git show` / `git grep`).
**Kontrakt:** `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` (na gałęzi `origin/claude/rust-sivvrn`; na `parity-v2` tego pliku nie ma — patrz §6, B-DOC).

Statusy w tabelach:

- **ZGODNE** — wejście renderera istnieje, odpowiednik w pinie istnieje, adapter to czyste tłumaczenie typów (bez reguł gry);
- **ROZBIEŻNE** — wejście istnieje, ale kształt DTO, kształt wejścia albo wywołanie w pinie różnią się tak, że adapter musi coś dołożyć, rozstrzygnąć albo czegoś brakuje w DTO;
- **BRAK** — po stronie renderera Rust nie ma wejścia (integratora sceny), które przyjęłoby te dane; adapter nie ma czego zasilić;
- **NIE_ZMIERZONO** — nie sprawdziłem w tym rozpoznaniu, podaję, co trzeba sprawdzić.

---

## 1. Stan wyjściowy (zmierzony na `2f9a12786`)

| Element | Stan | Dowód |
|---|---|---|
| `renderer/src/view.rs` | pusty moduł (sam komentarz „Empty until RR-T13 lands”). **Uwaga r2 (zarzut 5):** komentarz modułu (`view.rs:1-3`: „read-only view model (DTO) computed from the engine `GameState` … including the `PositionDto(x, y)` ↔ axial `(q, r)` mapping”) jest sprzeczny z D-DTO-1 = A — DTO leżą w crate `view-model`, liczy je producent w silniku, a `view.rs` jest tylko adapterem tłumaczącym DTO na wejścia renderera (bez `PositionDto`, bo DTO niesie `HexCoord{q,r}`, `ids.rs:184`). Q1 przepisuje ten komentarz (§7) | `rust-port/renderer/src/view.rs:1-5` |
| zależność renderera od `civ-view-model` | **brak** — `renderer/Cargo.toml` nie ma `civ-view-model` w `[dependencies]` | `rust-port/renderer/Cargo.toml:18-55`; `grep -rn civ_view_model renderer/src` → 0 |
| typy DTO | gotowe (P4-1A): `RenderViewDto` / `RenderLayersDto` / `MapViewDto` … | `rust-port/view-model/src/root.rs:25`, `:62`; `map.rs:116`, `:138`, `:210`; `units.rs:12`, `:52`, `:82`; `owners.rs:71`, `:82`, `:125`, `:166`; `overlays.rs:22-170`; `battle.rs:54-141` |
| producent w silniku | tylko P4-1E (`owner_views`, `city_views`) | `rust-port/engine/src/domain/city_view.rs:489`, `:578`; `grep -rln civ_view_model engine/src` → tylko `city_view.rs` |
| klocki P4-1B w silniku | `computeRoadMask` (`domain/road_network.rs`), `trimMediumRenderPathAtMain` (`domain/mapgen/rivers_a/render_trim.rs`) — bez producenta `MapViewDto`/`HexDynDto` | `grep -rln "fn compute_road_mask\|fn trim_medium" engine/src` |
| producenci P4-1B (mapa), P4-1C (mgła), P4-1D (jednostki), P4-1F (nakładki) | **nie ma** na `parity-v2` | jw. |
| zdarzenia bitwy (`BattleEventsDto`, wymienione w dispatchu) | **nie istnieje** jako typ — D-DTO-7 nierozstrzygnięta; `view-model` celowo nie ma typu „Przebieg” | `rust-port/view-model/src/battle.rs:9-11` |

**Wniosek 1.** Adapter nie ma dziś ani zależności, ani (poza miastami) producenta danych do testów end-to-end. Testy adaptera muszą na razie budować DTO ręcznie (fixture'y), a nie z silnika.

---

## 2. Trzy wzorce konwersji wspólne dla całego adaptera

| Konwersja | Postać w DTO | Postacie wymagane przez renderer | Gdzie |
|---|---|---|---|
| współrzędna | `view_model::HexCoord{q:i32,r:i32}` (`ids.rs:184`) | (a) `pick::hex::HexCoord` (`pick/hex.rs:12`); (b) `HexKey = (i32,i32)` (`models/misc/overlay.rs:16`); (c) klucz `"q,r"` jako `String` (`models/cities/renderer.rs:592-597`, `models/wonders/renderer.rs:193`, `models/misc/siege.rs:426-435`); (d) `f64` w `BuildHighlightHex{q,r}` (`models/misc/build_highlight.rs:23`) i `CampUnit{q,r}` (`siege.rs:364`) | cztery postacie, nie trzy jak w kontrakcie §6 (kontrakt pominął `f64`) |
| identyfikator | `CityId`/`UnitId` (newtyp `u64`, `ids.rs:49-78`, `Display`) | `String` (`City.id`, `UnitPickModel.id`, `UnitSpawn.id`, klucze `camp_hexes_by_city`) | `Display` → `String` (D-DTO-2 = B) |
| właściciel | `OwnerRef` (`ids.rs:120`), `legacy_i64()` (`ids.rs:132`) | `i32` (`City.owner_id`, `PlacedWonder.owner_id`, `CityRenderOptions::*` `Fn(i32)`, `apply_fog_visibility(player_owner_id: i32)`), `i64` (`build_territory_border_group`, `SiegeMarkerSyncOptions`, `CampUnit`), `f64` (`CityOkolicaOverlayParams.owner_id: Option<f64>`), `Option<f64>` (`sync_worker_field_overlay(…, player_owner_id: Option<f64>)`, `worker_field.rs:198-202` — wejście adaptera; `build_worker_field_overlay(…, f64)` z `:169` to funkcja wewnętrzna, wołana przez `sync`) | `legacy_i64()`, potem `as i32` / `as f64` |

Pułapki techniczne (decyzje techniczne P4-1G, nie gameplay):

- **`i64` → `i32`:** `legacy_i64()` daje do `2^53 − 1`; zwykłe `as i32` obcina. Adapter musi odrzucić (błąd) `ownerId > i32::MAX`, a nie obciąć. Zakres realnych id graczy w silniku — NIE_ZMIERZONO (§7).
- **`seed: f64` → `TerrainInput.seed: i32`** wymaga `ToInt32` (`seed | 0`, `terrain/mod.rs:231-232`; DTO `map.rs:121-122`). Rust `as i32` saturuje zamiast liczyć modulo `2^32`. **Poprawka r2 (zarzut Evaluatora 1):** pomocnik już istnieje — prywatne `fn to_int32(x: f64) -> i32` w `rust-port/renderer/src/geom/earcut.rs:791-801` (JS `ToInt32`: `trunc`, `rem_euclid(2^32)`, NaN/±Inf → 0); `grep -rn to_int32 renderer/src` → **3 trafienia** (`earcut.rs:793`, `:804`, `:805`), nie 0. Q1 **wynosi** tę funkcję do modułu wspólnego (np. `renderer/src/geom/js_num.rs` jako `pub(crate)`) i używa jej w `earcut.rs` oraz w adapterze — bez duplikatu.
- **Mgła — cztery postacie zbiorów:** `HashSet<HexCoord>` (`TerrainScene::set_fog`, `terrain/mod.rs:704-709`), `HashSet<String>` (`CityRenderer::apply_fog_visibility`, `WonderRenderer::apply_fog_visibility`), `HashSet<HexKey>` (`sync_worker_field_overlay_fog`, `cities/overlay/worker_field.rs:215-220`) oraz `pick::terrain::MapHex.prism_hidden` per heks (`pick/terrain.rs:246-259`).
- **Postać tekstowa id** (ryzyko z kontraktu §6): `grep -rn "sort" renderer/src | grep -i id` → 0 trafień; `parse` występuje tylko dla klucza heksu `"q,r"` (`models/misc/siege.rs:324-349`) i numeru grupy bitwy `_groupDisplayNum` (`battle/dynamics.rs:929-955`, poza zakresem DTO mapy — dotyczy D-DTO-7). Klucze widoku miast i cudów składane są z `wonder_id`/`q,r`, nie z id (`models/wonders/renderer.rs:141-145`). **Wniosek:** renderer mapy nie zależy od postaci tekstowej `CityId`/`UnitId` — w zakresie zmierzonym grepem.

---

## 3. Tabela: DTO → wejście renderera → odpowiednik pinu → status

### 3.1 Mapa statyczna `MapViewDto` (`view-model/src/map.rs:116`)

| Pole DTO | Wejście renderera (plik:linia) | Odpowiednik pinu `07d2fbd72` | Status |
|---|---|---|---|
| `width`, `height` | `TerrainInput.width/height` (`terrain/mod.rs:230-237`) | `buildScene(map, …)` (`render/scene.ts:1580`), `map.szerokoscQ/wysokoscR` | ZGODNE |
| `seed` | `TerrainInput.seed: i32` (`terrain/mod.rs:231-232`); `OverlayMap.seed: Option<f64>` (`models/misc/overlay.rs:26`) | `map.seed` (`scene.ts`, `seed | 0`) | ROZBIEŻNE (technicznie): brak `ToInt32` w rendererze (§2) |
| `hexes[].coord`, `.teren_bazowy` | `TerrainHex{coord, terrain, terraces}` (`terrain/mod.rs:193-200`); `pick::terrain::MapHex` (`pick/terrain.rs:246`); `CityRenderer::new(hexes)` (`models/cities/renderer.rs:444`); `WonderRenderer::new` (`models/wonders/renderer.rs:116`); `OverlayMap.hexes` (`overlay.rs:22-26`) | `Object.values(map.hexes)` w `buildScene` (`scene.ts:1580+`); `new CityRenderer(scene, map)` | ZGODNE — `view_model::Terrain` (`map.rs:12`) i `pick::terrain::Terrain` (`pick/terrain.rs:24`) mają te same 8 wariantów w tej samej kolejności; potrzebny jawny `match` |
| `hexes[].rzeka_krawedzie` | **BRAK** konsumenta w rendererze (`grep -rn rzeka renderer/src` nie daje wejścia sceny) | pin NIE czyta `rzeka.krawedzie` w renderze: `render/scene.ts:1263-1264` (komentarz: „hex.rzeka.krawedzie zostaje dla logiki gry; render idzie po pełnej ścieżce”); wstęgi budowane z `map.riverPaths` (`scene.ts:800`, `:2873`) | BRAK |
| `rivers[]` (`RiverPathDto`) | `TerrainInput.rivers: &[RiverPath]` (`terrain/mod.rs:240`, `:184-190`) — używane tylko do delt i ujść wybrzeża (`terrain/mod.rs:498-499`, `terrain/coast.rs:136`, `:208`) | `map.riverPaths` + `riverPathKinds` (`scene.ts:2873`) | ZGODNE dla wybrzeża; `RiverKind` 1:1 (`map.rs:78` ↔ `terrain/mod.rs:156`) |
| `river_render_paths` | **BRAK** — w rendererze nie ma budowy wstęgi rzeki (są tylko LOD/mgła/scalanie gotowych geometrii: `decor/river_lod.rs:103-377`) | `landRiverRenderPath`/`mediumRiverRenderPath`/`trimMediumRenderPathAtMain` w `scene.ts:1263-1318` | BRAK |

### 3.2 Pola zmienne heksu `HexDynDto` (`map.rs:138`, równoległe do `map.hexes`)

| Pole | Wejście renderera | Pin | Status |
|---|---|---|---|
| `terraces` | `TerrainHex.terraces` (`terrain/mod.rs:198-199`), `MapHex.terraces` (`pick/terrain.rs:257-258`) | `improvementKeysForHex(hex)` w `scene.ts:2469`; `hideDecorAtHex` przy `tarasy` (`main.ts:16883-16885`) | ZGODNE |
| `nakladka` (las) | modele lasu/dżungli są (`decor/forest.rs:29-474`, `decor/jungle.rs`), ale **brak** rozmieszczenia na mapie | `hex.nakladka === Nakladka.Las` → las (`scene.ts:1730`, `:2347-2348`); `syncForestForUnits` (`scene.ts:3164`, `main.ts:14562`) | BRAK |
| `ulepszenia`, `improvement_key`, `road_mask` | budowniczy modelu jest: `build_improvement_sectored(keys, owner_col, hex_r, relief, road_mask)` (`models/improvements/registry.rs:290-297`); **brak** synchronizacji per heks | `buildImprovementVisual` → `buildImprovementSectored(…, roadMask)` (`main.ts:3162-3173`), `computeRoadMask` (`main.ts:15836`, `:17083`) | BRAK (integrator) |
| `zloze` | modele zasobów (`models/improvements/zasoby.rs`, `zwierzeta.rs`); **brak** synchronizacji | `syncResourceOverlayAtHex` / `rebuildResourceOverlays` (`main.ts:3199`, `:3233`) | BRAK |
| `village_present` | model `build_wioska()` (`models/misc/wioska.rs:141`), **brak** synchronizacji | `syncVillageMeshes` (`main.ts:3360`), wołane z `refreshFog` (`main.ts:13489`) | BRAK |
| `covering_improvement` | `OkolicaMap.covering_improvement: HashSet<HexKey>` (`cities/overlay/okolica.rs:354-359`) | `hexHasCoveringTerrainImprovement` w okolicy | ZGODNE |
| `ulepszenie` (enum) | brak bezpośredniego konsumenta | — | NIE_ZMIERZONO, czy jakikolwiek integrator go potrzebuje poza `ulepszenia` |

### 3.3 Mgła `FogViewDto` (`map.rs:210`) + `ViewerDto` (`owners.rs:71`)

| Pole | Wejście renderera | Pin | Status |
|---|---|---|---|
| `fog.state[i]` (0/1/2) | `TerrainScene::set_fog(visible, explored, land_reveal)` (`terrain/mod.rs:704-709`); `CityRenderer::apply_fog_visibility(vis, fog_on, player_owner_id)` (`models/cities/renderer.rs:592-597`); `WonderRenderer::apply_fog_visibility(vis, fog_on)` (`models/wonders/renderer.rs:193`); `sync_worker_field_overlay_fog` (`worker_field.rs:215`); `MapHex.prism_hidden` (`pick/terrain.rs:251-252`) | `refreshFog` (`main.ts:13475-13520`): `setFog(vis, exploredForRender, {landReveal, riverRevealKeys})` (`:13491-13494`), `cityRenderer.applyFogVisibility(vis, true, ME())` (`:13503`), `wonderRenderer.applyFogVisibility(vis, true)` (`:13504`); gałąź bez mgły: `ALL_KEYS` (`:13506-13513`) | ZGODNE w kształcie; `visible` = stan 2, `explored` = stan ≥ 1 (pin dokłada widoczne do odkrytych: `addExplored(…, vis)`, `main.ts:13483`) |
| `viewer.fog_active` | `fog_on` w `apply_fog_visibility` | `fogOn` | ROZBIEŻNE: pin rysuje mgłę przy `fogOn || revealAllLand` (`main.ts:13485`) i przekazuje `landReveal: revealAllLand` (`:13492`); DTO nie ma `revealAllLand` (luka L1) |
| — | `set_fog(…, land_reveal)` | `riverRevealKeys: startRevealKeysForRiverFog()` (`main.ts:13493`, `:13074-13080`) | ROZBIEŻNE: Rust `set_fog` nie ma `riverRevealKeys` (rzek i tak brak, §3.1), DTO też nie (luka L2) |
| `viewer.owner_id` | `apply_fog_visibility(…, player_owner_id: i32)`, `sync_worker_field_overlay(…, player_owner_id: Option<f64>)` (`worker_field.rs:198-202`; pin: `syncWorkerFieldOverlay(scene, null, map, workedByOwner, ME())`, `main.ts:15441`) → adapter podaje `Some(owner as f64)` | `ME()` | ZGODNE |

### 3.4 Właściciele i miasta (`OwnerViewDto` `owners.rs:82`, `CityViewDto` `owners.rs:166`, `CityBadgeDto` `owners.rs:125`)

| Pole DTO | Wejście renderera | Pin | Status |
|---|---|---|---|
| `cities[].id/owner_id/hex/population` | `City{id:String, owner_id:i32, q, r, population}` (`models/cities/renderer.rs:118-129`) → `CityRenderer::sync` (`:485`), `sync_map_outlines` (`:573`) | `cityRenderer.sync(cities, _cityRenderOpts())` (`main.ts:3007` i in.), `syncMapOutlines` (`main.ts:11437`) | ZGODNE |
| `owners[].era` | `CityRenderOptions.get_era: Fn(i32)->f64` (`renderer.rs:137`) | `getEra: empireEpochForOwner` (`main.ts:2949`) | ZGODNE |
| `owners[].bronze_civ` (`String`) | `get_civ: Fn(i32)->BronzeCiv` (`renderer.rs:139`), parsowanie `BronzeCiv::from_web_id` (`core/bronze.rs:72`) | `getCiv: ikonaIdToBronzeCiv(civTypeForOwner(…))` (`main.ts:2955`) | ZGODNE; nieznany klucz → NIE_ZMIERZONO, co zrobić (`None` = domyślna cywilizacja `default_civ`?) |
| `cities[].level` | `get_level: Fn(&str)->f64` (`renderer.rs:141`) | `getLevel` (`main.ts:2956`) | ZGODNE |
| `cities[].wall_kind` | `get_wall_kind: Fn(&str)->CityWallKind` (`renderer.rs:145`); enum 1:1 (`owners.rs:49` ↔ `renderer.rs:95`) | `getWallKind` (`main.ts:2961-2966`) | ZGODNE (`get_walls` zbędne, gdy podany `get_wall_kind`: `renderer.rs:498-506`) |
| `cities[].fog_visible` | `is_visible: Fn(&City)->bool` (`renderer.rs:147`) | `isVisible`: `cityPanelViewCityId !== null ? city.id === cityPanelViewCityId : cityFogVisible(…)` (`main.ts:2973-2976`) | ROZBIEŻNE: część „panel miasta otwarty” to stan UI spoza DTO (luka L4 — wejście UI adaptera) |
| `owners[].map_outline_kind` | `get_map_outline_kind: Fn(i32)->Option<CityMapOutlineKind>` (`renderer.rs:149`); enum 1:1 (`owners.rs:11` ↔ `models/cities/outline.rs:24`) | `cityMapOutlineKindForOwner` (`main.ts:2972`) | ZGODNE |
| `owners[].color` | `owner_color_fn: Fn(i32)->u32` (`renderer.rs:151`) | `ownerColorFn: civColorFn` (`main.ts:2978`) | ZGODNE |
| `cities[].revolt` | **BRAK** — sprite buntu nieportowany (`models/cities/renderer.rs:13`, `models/cities/mod.rs:20`) | `getRevolt` (`main.ts:2967-2970`) | BRAK |
| `cities[].unit_count_on_hex` | **BRAK** konsumenta | `getUnitCountOnHex` (`main.ts:2971`) | BRAK |
| `cities[].besieged` | pośrednio `SiegeMarkerRenderer::sync(ids, …)` (§3.6) | `oblegane = cities.filter(c => c.oblegane)` (`main.ts:17493`) | ZGODNE |
| `cities[].badge` (17 pól) | `CityMapBadgeInput` (19 pól, `raster/atlas/keys.rs:132-175`) — rysowanie i klucz atlasu są (`cities/overlay/stat_chip.rs`), **brak** `sync_stat_chips` w `CityRenderer` (`grep "pub fn" models/cities/renderer.rs`) | `cityRenderer.syncStatChips(cities, _cityRenderOpts(sharedVis))` (`main.ts:14563`, `:32265`) | ROZBIEŻNE w typach (`prod_kind` enum → `Option<String>`, `owner_color: u32` → `Option<u32>`, `era: f64` → `Option<f64>`; `hover_expanded`/`lod_level` = stan renderera) + BRAK integratora |
| `owners[].civ_icon_id/era/is_city_state/is_barbarian/ring_hex` | `OwnerEmblemContext` — **dwa identyczne typy**: `units/overlay/emblem.rs:28` i `raster/atlas/keys.rs:264` | `setOwnerEmblemResolver` (`main.ts:10373-10384`): `civId: isBarbarian ? null : civTypeForOwner` | ROZBIEŻNE: adapter musi wymusić `civ_id = None` dla barbarzyńców (już opisane w `owners.rs:92-98`) i wybrać jeden z dwóch typów (duplikat do uporządkowania) |
| `owners[].relation_to_viewer` | `build_territory_border_group(…, relation_color_fn: Option<&dyn Fn(i64)->u32>)` (`models/misc/range.rs:725-731`) | `relationColorFn` (`main.ts:4065-4068`), kolory `RELATION_BORDER_COLOR_*` (`game/civ-visual.ts:84-104`: wojna `0xff5252`, sojusz `0x4fc3f7`, reszta `0xffd700`) | ROZBIEŻNE: stałych kolorów relacji w rendererze brak (`grep RELATION_BORDER renderer/src` → 0) — adapter albo renderer musi je dodać (stała prezentacji, nie reguła) |
| `owners[].relation_to_viewer` + `is_barbarian` | „ring stance” żetonu jednostki | `unitRingStanceForPlayer` (`main.ts:10337-10342`): `own` / `hostile` (barbarzyńca albo wojna) / `neutral` | BRAK (brak renderera żetonów, §4) — dane wystarczą |
| `owners[].display_name`, `capital_city_id` | brak bezpośredniego wejścia mapy (używane przez plakietkę/etykiety) | `getCapitalCityId`, `getCivDisplayName` (`main.ts:2995-2996`) | NIE_ZMIERZONO, który moduł `labels/` je przyjmie |

### 3.5 Jednostki i stosy (`UnitViewDto` `units.rs:12`, `StackViewDto` `units.rs:82`, `StackVitalsDto` `units.rs:52`)

| Pole DTO | Wejście renderera | Pin | Status |
|---|---|---|---|
| `units[]` (żetony mapy: `type_id`, `category`, `hex`, `owner_id`, `embarked`, `dimmed`) | **BRAK** odpowiednika `UnitRenderer.sync` — `renderer/src/units/mod.rs` zawiera wyłącznie nakładki (`pub mod overlay`); routing modelu jest (`models/unit_core/routing.rs:610-671`: `super_unit`, `category_route`, `legacy_route`, `build_model`) | `unitRenderer.sync(src, display, deferredPlayerUnitRevealIds)` (`main.ts:14553`; def. `render/units.ts:6095-6099`), `buildUnitModel(cat, color, typeId)` (`units.ts:6139`, `:6157`) | BRAK |
| filtr widoczności jednostek | — | `syncUnitsRender(visibleUnitsList(vis))` → `unitsVisibleOnMap(units, vis, ME())` (`main.ts:13430-13431`, `:13502`) | ROZBIEŻNE: kontrakt nie mówi, czy producent filtruje `units[]` mgłą (luka L3) |
| `stacks.visible_ids`, `badge_by_rep_id`, `starving_rep_ids`, `gold_deficit_rep_ids` | **BRAK** (j.w.) | `computeStackDisplay(…)` (`main.ts:14480`), `display` → `unitRenderer.sync` | BRAK |
| `stacks.vitals_by_rep_id[]` | `StatPlateVitals{ruch_left, ruch_max, hp, hp_max, field_power_m, owner_color}` (`units/overlay/stat_plate.rs:309-322`), `build_stat_plate` (`:503`) | tabliczka w `units.ts` | ZGODNE w typach (`owner_color` z `owners[].color`); integrator BRAK |
| `veteran_stars`, `armor_badge_level`, `soft_badge_level` | `build_veteran_badge(star_count)` (`veteran_badges.rs:129`), `pack_row_state(armor, soft, stars)` (`upgrade_badges.rs:109`) | `units.ts` (odznaki) | ZGODNE w typach; integrator BRAK |
| `StackVitalsDto.has_commander` | `build_commander_star()` (`veteran_badges.rs:169`), `commander_star_update(present, has_commander)` (`:215`) | `units.ts` (gwiazda dowódcy) | ZGODNE w typach; integrator BRAK |
| `is_general` | **BRAK** — obwódki wodza nie ma (`grep -rn "general_ring\|is_general" renderer/src` → 0) | `applyGeneralRingLod` (`units.ts:5787`), `_syncGeneralRing` | BRAK |
| `units[].id`, `hex` (picking) | `UnitPickModel{id:String, hex, meshes}` (`pick/mod.rs:181-189`) | `pickUnitIdAt` (`units.ts:5919`) | ROZBIEŻNE (tylko dane): port `pickUnitIdAt` **istnieje** — `ray_to_unit(ray, &[UnitPickModel])` (`pick/mod.rs:190-193`; poprawka r2, zarzut 3); brakuje wyłącznie źródła `UnitPickModel.meshes` (siatek żetonów, R1) |
| `units[]` na hekse miast | — | `setCityHexKeys(new Set(cities.map(…)))` (`main.ts:14551`) | do wyliczenia w adapterze z `cities[]` (czysta geometria) |
| — | — | `setForceVisibleUnitId(forceVisibleUnitId)` (`main.ts:14550`) | ROZBIEŻNE: stan UI spoza DTO (luka L4) |

### 3.6 Oblężenia i cuda (`SiegeViewDto` `overlays.rs:22`, `PlacedWonderDto` `overlays.rs:38`)

| Pole DTO | Wejście renderera | Pin | Status |
|---|---|---|---|
| `sieges[].city_id`, `city_hex` | `SiegeMarkerRenderer::sync(ids: &[String], positions: &[(String,(f64,f64))], top_y, options)` (`models/misc/siege.rs:543-549`) | `siegeMarkerRenderer.sync(oblegane, positions, {...})` (`main.ts:17521-17527`) | ZGODNE |
| `sieges[].camp_hexes` | `SiegeMarkerSyncOptions.camp_hexes_by_city: Vec<(String, Vec<String>)>` (`siege.rs:426-435`) | `campHexesByCity` (`main.ts:17495-17510`) | ZGODNE (klucze `"q,r"`) |
| `sieges[].ready_machines` | `machines_by_camp_hex(camp_hexes, ready)` (`siege.rs:285`), wynik scalany per heks | `machinesByCampHex(camps, ready)` + scalanie `allMachinesByCamp` (`main.ts:17511-17514`) | ZGODNE (adapter powtarza scalanie — kolejność wstawiania `Map`) |
| właściciel obozu | `camp_owner_by_hex(camp_hexes, units: &[CampUnit], city_owner_id)` (`siege.rs:377`) z `units[]` | `campOwnerByHex(camps, units, keyOf, c.ownerId)` (`main.ts:17516-17519`) | ZGODNE — dane z `units[]` i `cities[].owner_id`; pin bierze **wszystkie** `units` (bez mgły) |
| kolory obozów | `owner_color_by_id: Vec<(i64,u32)>` | `ownerColorById` z `civColorFn` (`main.ts:17498`, `:17507`, `:17517`) | ZGODNE (`owners[].color`); kolejność wpisów `Map` — NIE_ZMIERZONO, czy renderer od niej zależy |
| `top_y` | `&dyn Fn(f64,f64)->f64` | `unitRenderer.topYAt(q, r)` (`main.ts:17522`) = `terrainTopY(hex)` = `height + yOffset` (`units.ts:222-225`, `:6515-6518`) | ZGODNE (poprawka r2, zarzut 2): port już jest — `TerrainPickScene::top_y_at(HexCoord) -> f64` (`pick/terrain.rs:303-308`, mapa `top_y` wypełniana `height + y_offset` w `build_terrain_pick_scene`, `:332`, `:395-410`); adapter podaje domknięcie `\|q, r\| scene.top_y_at(HexCoord{q: q as i32, r: r as i32})`; **bez zależności od R1**. Uwaga poboczna: komentarz w `terrain.rs:304` cytuje `units.ts:6409-6412`, w pinie `topYAt` jest w `:6515-6518` — nieaktualny numer linii (do poprawy przy okazji Q2, poza tym tematem) |
| `wonders[]` | `PlacedWonder{wonder_id, q, r, owner_id:i32, ruin}` (`models/wonders/renderer.rs:36-47`) → `WonderRenderer::sync(placed, WonderRenderOptions{is_visible, owner_color_fn})` (`:62-67`, `:141`) | `wonderRenderer.sync(placedWonderSnapshot(), {ownerColorFn: civColorFn})` (`main.ts:4316`) | ZGODNE |
| ukrycie dekoru pod cudem/miastem | `MapHex.solid_hidden` (`pick/terrain.rs:253-255`) | `hideDecorAtHex` dla cudów (`main.ts:4312`), miast (`:16211`), placów budowy cudu (`:5264`), wycinki lasu (`:16801`, `:17014`, `:42967`) | ROZBIEŻNE: adapter może wyliczyć z `cities[]`, `wonders[]`, `HexDynDto.nakladka`; **place budowy cudu (`wonderBuildSites`) nie ma w DTO** (luka L5) |

### 3.7 Terytorium i nakładki (`TerritoryViewDto` `overlays.rs:63`, `OverlaysViewDto` `overlays.rs:170`)

| Pole DTO | Wejście renderera | Pin | Status |
|---|---|---|---|
| `territory.by_owner[]` | `build_territory_border_group(map: &OverlayMap, by_owner: &[(i64, HexKeySet)], color_fn, params, relation_color_fn)` (`models/misc/range.rs:725-731`) | `buildTerritoryBorderGroup(map, byOwner, civColorFn, …, relationColorFn)` (`main.ts:15607-15614`) | ZGODNE w danych (filtr mgły robi producent, kontrakt §3.6); ROZBIEŻNE w bramce: pin rysuje tylko przy `territoryBorderVisible || isCityPanelOpen()` (`main.ts:15583`) — przełącznik UI spoza DTO (luka L4); sygnatura `territoryBorderSignature` (`:15603-15604`) = cache, nie reguła |
| `overlays.culture_range` | `build_range_overlay_group_game(map, keys: &HexKeySet, &CULTURE_RANGE_STYLE)` (`range.rs:56`, `:783`) | `collectCultureRangeHexKeys(map, rangeCityInputs(), 0)` → **jeden** zbiór, `buildRangeOverlayGroup(map, keys, CULTURE_RANGE_STYLE)` (`main.ts:15631-15634`) | ROZBIEŻNE: DTO ma `Vec<OwnerHexesDto>` per właściciel, renderer i pin — jeden `HexKeySet` (pin liczy tylko dla `ownerId 0`); adapter spłaszcza w kolejności wstawiania. Bramka `isCityPanelOpen()` (`:15629`) — UI |
| `overlays.religion_range` | j.w. z `RELIGION_RANGE_STYLE` (`range.rs:67`) | `collectReligionRangeHexKeys(…)` (`main.ts:15638-15645`) | ROZBIEŻNE (j.w.) |
| `overlays.trade_routes[]` | `TradeRouteOverlayInput{from_q, from_r, to_q, to_r, medium}` (`models/misc/trade.rs:22-33`), `build_trade_routes_overlay_group(map, routes)` (`:102`); `TradeMedium` 1:1 (`overlays.rs:71` ↔ `trade.rs:13`) | `refreshTradeRoutesOverlay` (`main.ts:15379-15397`): tylko `status === 'polaczony'` i trasy z udziałem gracza 0 | ZGODNE (filtr = producent); bramki `showTradeRoutesOverlay` / `isCityPanelOpen()` (`:15381-15382`) — UI (luka L4) |
| `overlays.okolica` | `OkolicaMap{map, covering_improvement}` + `CityOkolicaOverlayParams{city_q, city_r, range, worked_keys, yield_of, show_yields, owner_id}` (`cities/overlay/okolica.rs:354-377`), `build_city_okolica_overlay` (`:491`); `TileYieldDto` ↔ `TileYield` 1:1 (`overlays.rs:93` ↔ `okolica.rs:114`) | `syncCityOkolicaOverlay(scene, …, map, {cityQ, cityR, range, workedKeys, yieldOf, showYields: true, ownerId: city.ownerId})` (`main.ts:6655-6667`) | ZGODNE; `yield_of` = wyszukiwanie w tabeli `yields` — zachowanie dla heksu spoza tabeli NIE_ZMIERZONO |
| `overlays.worker_fields[]` | `sync_worker_field_overlay(map, worked_by_owner: &[(HexKey, f64)], player_owner_id: Option<f64>)` (`worker_field.rs:198-202`) + mgła (`:215`) | `syncWorkerFieldOverlay(scene, null, map, workedByOwner, ME())` (`main.ts:15441`), `syncWorkerFieldOverlayFog(…)` (`:13498`, `:15442-15445`) | ZGODNE; bramka `showWorkerOverlay` (`:15434`) — UI |
| `overlays.reachable` | **BRAK** `set_highlight` (`grep -rn "set_highlight" renderer/src` → 0) | `unitRenderer.setHighlight(reachable)` (`main.ts:7125`, `:7260`, `:14857`, `:17960`, `:44173`; def. `units.ts:6524`) | BRAK |
| `overlays.build_highlight` `Generic` | **BRAK** `set_highlight`; jest tylko `filter_build_highlight_hexes` (`build_highlight.rs:60`) i stała `IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY` (`:15`) | `refreshBuildHighlight` (`main.ts:16351-16395`): ulepszenie → `setHighlight(…, IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY)` (`:16392-16395`); **cud** → `setHighlight(…)` z krytością domyślną (`:16363-16367`) | BRAK + ROZBIEŻNE: `Generic` nie rozróżnia cudu (krycie `HIGHLIGHT_OPACITY`) od ulepszenia (krycie `IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY`) — luka L6 |
| `overlays.build_highlight` `Mine` | `build_range_overlay_group_game(map, keys, &MINE_ELIGIBLE_STYLE)` (`range.rs:84`, `:783`) | `refreshMineEligibleOverlay(hexes)` → `buildRangeOverlayGroup(map, keys, {…})` (`main.ts:15559`, `:16388-16390`) | ZGODNE |
| `overlays.build_highlight` `FoundCity` | **BRAK** `set_highlight` | `foundCityMode` → `setHighlight(qual)` (`main.ts:16352-16360`) | BRAK |
| `overlays.selection` | **BRAK** `set_selection_hex` | `unitRenderer.setSelectionHex(q, r, ownerId)` (`main.ts:7119`, `:14854`, `:31423`; def. `units.ts:6571`) | BRAK |
| `overlays.path_route` | **BRAK** `set_path_route` | `unitRenderer.setPathRoute([start, ...plan.fullPath], {turnStops: plan.turnStops})` (`main.ts:31175-31178`, `:31204-31207`; def. `units.ts:6608-6611`) | BRAK + ROZBIEŻNE: DTO nie ma `turnStops` ani `turnLabel` (luka L7) |
| `reachable` vs `build_highlight` | — | oba idą do **jednej** warstwy `setHighlight` (ostatni wygrywa) | NIE_ZMIERZONO: pierwszeństwo przy obu niepustych w jednym snapshotcie |

### 3.8 Bitwa (`BattleViewDto` `battle.rs:141`)

| Pole DTO | Wejście renderera | Pin | Status |
|---|---|---|---|
| `setup.grid` | `TerrainGrid{cols, rows, tiles}` (`battle/field.rs:353-361`) | `generateBattleTerrain` + rzeźbienie (`battleScene.ts:2686-2703`, wg `field.rs:1980-1982`) | ZGODNE |
| `setup.desert_palette`, `siege`, `deploy` | `BattleSceneOpts{grid, desert_palette, siege, deploy: Option<DeploySide>}` (`field.rs:1978-1989`); `BattleSide` → `DeploySide` (`field.rs:1819`) | `new BattleScene(opts)` | ZGODNE |
| `setup.siege_civ`, `player_side`, `units[]` | `BattleUnitsOpts{field, siege_civ, player_side, units}` (`battle/units.rs:842-853`), `UnitSpawn` (`:510-541`) | `_placeUnits` / `_placeSiegeDefenders` | ZGODNE; `id: UnitId` → `String`; `ammo_left/ammo_max: None` → `f64::INFINITY` (`battle.rs:76-80`) |
| `setup.fort` | `FortDto{kind, tower_material, tower_rows}` (`units.rs:726-733`) → `build_battle_scene_with_units_fort(opts, &fort)` (`units.rs:891`) | `fortKind`, `towerMaterialFor`, `towerRows` | ZGODNE; enumy 1:1 (`FortKind` `battle.rs:32` ↔ `units.rs:699`; `TowerMaterial` `battle.rs:44` ↔ `battle/siege_towers.rs:56`) |
| przebieg bitwy (zdarzenia) | funkcje animacji `battle/dynamics.rs:9-27` | `battleScene.ts` | BRAK w DTO (D-DTO-7, temat P4-1I) |

---

## 4. Wejścia renderera, których brakuje (BRAK po stronie konsumenta)

Moduły renderera to w dużej części **budowniczowie modeli** przeniesieni 1:1 z webu. Brakuje warstwy, która w webie siedzi w `UnitRenderer` (`render/units.ts`), w części `buildScene` (`render/scene.ts`) i w funkcjach `main.ts` synchronizujących siatki per heks. Bez niej adapter nie ma czego zasilić dla:

| ID | Brakujący integrator (odpowiednik pinu) | Pola DTO bez konsumenta |
|---|---|---|
| R1 | renderer żetonów jednostek: `UnitRenderer.sync`, `setHighlight`, `clearHighlight`, `setSelectionHex`, `setPathRoute`, obwódka wodza (`units.ts:5787-6747`); **bez** `topYAt` (jest: `TerrainPickScene::top_y_at`, `pick/terrain.rs:303-308`) i **bez** logiki `pickUnitIdAt` (jest: `ray_to_unit`, `pick/mod.rs:190-193`) — R1 dostarcza tylko siatki żetonów dla `UnitPickModel.meshes` (poprawka r2, zarzuty 2–3) | `units[]`, `stacks.*`, `is_general`, `overlays.reachable`, `build_highlight` (`Generic`, `FoundCity`), `selection`, `path_route`; `UnitPickModel.meshes` |
| R2 | rozmieszczenie dekoru terenu na mapie: las/dżungla per heks, `syncForestForUnits`, `hideDecorAtHex` (`scene.ts:1730`, `:2347-2348`, `:3164`, `:3172`) | `HexDynDto.nakladka`; ukrycie bryły/lasu |
| R3 | wstęgi rzek na mapie (`scene.ts:800`, `:1263-1318`, `:2860+`) | `river_render_paths` (wejście z `rivers[]`/`RiverPathDto`); `rzeka_krawedzie` NIE jest wejściem renderera: pin nie czyta go w renderze (`scene.ts:1263-1264`) |
| R4 | ulepszenia, zasoby, wioski/obozy per heks: `buildImprovementVisual`, `syncResourceOverlayAtHex`, `syncVillageMeshes`, `syncCampMeshes`, `syncImprovementMeshFog`, `syncResourceOverlayFog` (`main.ts:3162-3401`, `:13495-13496`, `:13488-13489`) | `ulepszenia`, `improvement_key`, `road_mask`, `zloze`, `village_present` |
| R5 | plakietki miast na mapie: `CityRenderer.syncStatChips` | `cities[].badge` |
| R6 | sprite buntu (`_syncRevolt`) i licznik jednostek na heksie miasta | `cities[].revolt`, `unit_count_on_hex` |

R1–R6 to tematy renderera (RR-T…/MOD-…), nie adaptera. Kontrakt §8 nie ma ich w rozbiciu P4-1 — trzeba je dopisać do planu P4 (decyzja orkiestratora o numeracji).

---

## 5. Luki kontraktu DTO (pin czyta coś, czego DTO nie niesie)

| ID | Luka | Pin | Propozycja (techniczna, do rejestru) |
|---|---|---|---|
| L1 | `revealAllLand` (odsłonięcie lądu) | `main.ts:13485`, `:13492`, `:12864-12866` | pole `ViewerDto.reveal_all_land: bool` albo jawny zapis, że producent wlicza je do `fog.state` **i** podaje `land_reveal` — tryb ma też wpływ na tło oceanu (`terrain/mod.rs:704-716`), więc samo `state` nie wystarczy |
| L2 | `riverRevealKeys` | `main.ts:13493`, `:13074-13080` | dopisać razem z R3 (dziś bez konsumenta) |
| L3 | filtr widoczności jednostek `unitsVisibleOnMap(units, vis, ME())` | `main.ts:13430-13431` | zapisać w kontrakcie §3.5: producent filtruje `units[]`/`stacks` mgłą (jak terytorium w §3.6); oblężenia biorą wszystkie jednostki (`main.ts:17502`) — producent liczy obozy przed filtrem |
| L4 | stan UI: `cityPanelViewCityId`, `isCityPanelOpen()`, `territoryBorderVisible`, `showTradeRoutesOverlay`, `showWorkerOverlay`, `forceVisibleUnitId`, `hideStatChips` | `main.ts:2973-2977`, `:15583`, `:15381-15382`, `:15434`, `:14550` | osobny parametr adaptera `MapUiState` (nie DTO silnika — D-CMD-12: zaznaczenie i przełączniki to UI); adapter nie może tych reguł zgadywać |
| L5 | place budowy cudów (`wonderBuildSites`) — ukrycie dekoru | `main.ts:5264` | NIE_ZMIERZONO, czy place są renderowane (duch budowy) — do sprawdzenia przy R2 |
| L6 | krycie podświetlenia cudu ≠ ulepszenia | `main.ts:16363-16367` vs `:16392-16395` | nowy wariant `BuildHighlightKind::Wonder` w `view-model` (zmiana kontraktu → `CONTRACT_VERSION` +1) |
| L7 | `turnStops` / `turnLabel` trasy | `main.ts:31175-31178`; `units.ts:6608-6611` | `path_route` → struktura `{hexes, turn_stops: Vec<(HexCoord, u32)>}` (zmiana kontraktu) |

---

## 6. Blokady (co musi być gotowe przed którym kawałkiem adaptera)

| ID | Blokada | Blokuje | Stan |
|---|---|---|---|
| B-DEP | `renderer/Cargo.toml` → `civ-view-model = { path = "../view-model" }` (D-DTO-1 = A to przewiduje); allowlista kandydata P4-1G w kontrakcie §8 **nie zawiera** `renderer/Cargo.toml` | cały adapter | do dopisania w dispatchu P4-1G-Q1 |
| B-DOC | `P4-1-RENDER-DTO-CONTRACT.md` jest na `origin/claude/rust-sivvrn`, nie na `parity-v2` | odwołania w kodzie adaptera | integracja dokumentu przez orkiestratora (poza tym tematem) |
| B-1B | producent `MapViewDto`/`HexDynDto` (P4-1B-Q3, #211) | testy end-to-end teren/mgła/okolica | brak; adapter może startować na fixture'ach |
| B-1C | producent `FogViewDto` (P4-1C, #212) + luka L1 | mgła end-to-end | brak |
| B-1D | producent `UnitViewDto`/`StackViewDto` (P4-1D, #213, w toku) + luka L3 | obozy oblężnicze (`CampUnit`), tabliczki | w toku |
| B-1E | producent miast (P4-1E) | — | **gotowy** (`engine/src/domain/city_view.rs`) |
| B-1F | producent nakładek (P4-1F, #215, w toku) + luki L6, L7 | terytorium, zasięgi, szlaki, okolica, pola robotników, oblężenia, cuda | w toku |
| B-1I | D-DTO-7 + P4-1I (#218) | zdarzenia bitwy | nierozstrzygnięte |
| B-R1…R6 | integratory renderera (§4) | żetony, podświetlenia, zaznaczenie, trasa, dekor, rzeki, ulepszenia, plakietki, bunt | brak tematów |

---

## 7. Propozycja podziału na wdrożenia (NIE wdrażam)

Kolejność: Q1 → (Q2 ∥ Q3 ∥ Q4) → Q5; Q6 dopiero po R1. **Q5 (w tym oblężenia) nie zależy od R1** (poprawka r2, zarzut 2): `top_y` oblężeń zasila `TerrainPickScene::top_y_at` budowane w Q2 (`build_terrain_pick_scene`, `pick/terrain.rs:332`). Każde wdrożenie: testy na ręcznie zbudowanych DTO (fixture'y w `tests/`), porównanie z wejściem zbudowanym „jak web” (np. te same `City`/`PlacedWonder`, co w istniejących testach parytetu), zero reguł gry w adapterze.

| ID kandydata | Zakres | Allowlista | Zależności |
|---|---|---|---|
| `R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE` | zależność `civ-view-model`; konwersje §2 (`HexCoord` w 4 postaciach, id → `String`, `OwnerRef` → `i32` z błędem przy przepełnieniu, `ToInt32` dla `seed`, enumy `Terrain`/`RiverKind`/`WallKind`/`MapOutlineKind`/`TradeMedium`/`SiegeMachineKind`/`BattleSide`/`FortKind`/`TowerMaterial`); `FogViewDto` → 3 zbiory + `prism_hidden`; **wyniesienie istniejącego `to_int32` z `geom/earcut.rs:791-801` do modułu wspólnego** (bez duplikatu; `earcut.rs` woła wspólną funkcję, zachowanie bez zmian — istniejące testy earcut zielone); **przepisanie komentarza modułu `view.rs:1-5`** zgodnie z D-DTO-1 (adapter DTO → wejścia renderera, bez „computed from GameState” i `PositionDto`) | `rust-port/renderer/Cargo.toml`, `rust-port/renderer/src/view.rs`, `rust-port/renderer/src/view/**` (nowe podmoduły), `rust-port/renderer/src/geom/earcut.rs` (tylko usunięcie lokalnego `to_int32` i import), `rust-port/renderer/src/geom/js_num.rs` (NOWY, `pub(crate) fn to_int32`) + `rust-port/renderer/src/geom/mod.rs` (deklaracja modułu), `rust-port/renderer/src/lib.rs` (tylko komentarz modułu `view`), `rust-port/renderer/tests/view_adapter_core.rs` | B-DEP |
| `R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN` | `MapViewDto` + `HexDynDto.terraces` → `TerrainInput`, `pick::terrain::MapHex` (z `solid_hidden` z `cities[]`/`wonders[]`), `OverlayMap`, `OkolicaMap` | `rust-port/renderer/src/view/terrain.rs`, `rust-port/renderer/tests/view_adapter_terrain.rs` | Q1 |
| `R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES` | `cities[]` + `owners[]` → `City` + `CityRenderOptions` (domknięcia), `PlacedWonder` + `WonderRenderOptions`, `OwnerEmblemContext` (z `civ_id = None` dla barbarzyńców), `CityBadgeDto` → `CityMapBadgeInput` (bez integratora R5) | `rust-port/renderer/src/view/cities.rs`, `rust-port/renderer/tests/view_adapter_cities.rs` | Q1; B-1E (gotowy) |
| `R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE` | `BattleSetupDto` → `BattleUnitsOpts` + `FortDto` (w tym `None` → `INFINITY`) | `rust-port/renderer/src/view/battle.rs`, `rust-port/renderer/tests/view_adapter_battle.rs` | Q1 |
| `R-RUSTPORT-P4-1G-Q5-ADAPTER-OVERLAYS` | terytorium (`relation_color_fn` + stałe `RELATION_BORDER_COLOR_*` z `game/civ-visual.ts:84-86`), zasięgi (spłaszczenie per właściciel → jeden `HexKeySet`), szlaki, okolica, pola robotników, `Mine`, oblężenia (`SiegeMarkerSyncOptions` + `camp_owner_by_hex` z `units[]`), parametr `MapUiState` (luka L4) | `rust-port/renderer/src/view/overlays.rs`, `rust-port/renderer/tests/view_adapter_overlays.rs`; zmiany kontraktu L6/L7 — **osobny** temat w `rust-port/view-model/**` | Q1, Q2; B-1F; decyzja techniczna L4 |
| `R-RUSTPORT-P4-1G-Q6-ADAPTER-UNITS` | `units[]`/`stacks` → wejście renderera żetonów; `reachable`, `build_highlight` (`Generic`/`FoundCity`/`Wonder`), `selection`, `path_route` | `rust-port/renderer/src/view/units.rs`, `rust-port/renderer/tests/view_adapter_units.rs` | **R1** (temat renderera — nie istnieje), B-1D, L3, L6, L7 |

Poza adapterem (do rozpisania przez orkiestratora): R1–R6 (§4) jako tematy renderera; zmiany kontraktu L1, L2, L3, L6, L7 jako temat `view-model` + producenta (bump `CONTRACT_VERSION`, `view-model/src/root.rs:15`).

---

## 8. NIE_ZMIERZONO

1. Zakres realnych id graczy w silniku (czy kiedykolwiek `> i32::MAX`); potrzebny do decyzji: błąd czy `debug_assert` przy `OwnerRef` → `i32`.
2. Zachowanie `BronzeCiv::from_web_id` dla nieznanego `bronze_civ` (fallback czy błąd) — `core/bronze.rs:72`.
3. Czy `ulepszenie` (enum) z `HexDynDto` ma jakiegokolwiek konsumenta poza `ulepszenia`/`improvement_key`.
4. Który moduł `labels/` przyjmuje `display_name`/`capital_city_id`.
5. ~~`top_y` obozów oblężniczych~~ — **zmierzone w r2** (zarzut 2): `unitRenderer.topYAt` = `terrainTopY` z `units.ts:222-225` (`height + yOffset`), port = `TerrainPickScene::top_y_at` (`pick/terrain.rs:303-308`, `:410`). Pozostaje NIE_ZMIERZONO tylko, czy `CityRenderer`/`OverlayMap::hex_top_y` (inne `terrainTopY` w `cities.ts:85`, `wonderRenderer.ts:45`, z parametrem stylu) dają tę samą liczbę — dla oblężeń nieistotne.
6. Czy `SiegeMarkerRenderer` zależy od kolejności `owner_color_by_id`.
7. Zachowanie `yield_of` dla heksów spoza tabeli `OkolicaViewDto.yields` (które heksy odpytuje `build_city_okolica_overlay`).
8. Pierwszeństwo `reachable` vs `build_highlight` w jednym snapshotcie (w pinie: kolejność wywołań, jedna warstwa).
9. Czy place budowy cudów są renderowane (luka L5).
10. Wybór jednego z dwóch typów `OwnerEmblemContext` (`units/overlay/emblem.rs:28`, `raster/atlas/keys.rs:264`) — czy różnią się zachowaniem (pola identyczne wg odczytu, kod użyć nie porównywany).
11. Pełna lista miejsc `hideDecorAtHex` w pinie poza 11 trafieniami `git grep` w `main.ts` (`:4312`, `:5264`, `:16158`, `:16201`, `:16211`, `:16801`, `:16884`, `:16891`, `:16944`, `:17014`, `:42967`) — reguły, które z nich są stanem (DTO), a które zdarzeniem.

---

## 9. Metoda (komendy)

- Baza: `git fetch origin rust-port/parity-v2`; `git rev-parse origin/rust-port/parity-v2` → `2f9a12786…`; `git checkout -B wip/R-RUSTPORT-P4-1G-ADAPTER-ROZP-Q1 origin/rust-port/parity-v2`.
- Kontrakt: `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` (§1.3, §3, §6, §7, §8).
- Rust: `cat view-model/src/*.rs`, `cat renderer/src/view.rs renderer/src/lib.rs renderer/Cargo.toml`; `grep -rn "pub struct …\|pub fn …"` dla każdego wejścia z kontraktu §1.3; `grep -rln <symbol> src tests` dla integratorów (`CityRenderer`, `WonderRenderer`, `SiegeMarkerRenderer`, `build_improvement_sectored`, `build_wioska`, `wariant_lasu_dla_heksa`, `queue_river_geo`, `UnitPickModel`, …); `grep -rln "set_highlight\|set_selection\|path_route\|hide_decor\|general_ring\|is_general\|RELATION_BORDER" renderer/src` → 0 trafień. **Korekta r2:** w r1 do tej listy omyłkowo dopisano `to_int32` — `grep -rn to_int32 renderer/src` → 3 trafienia (`geom/earcut.rs:793`, `:804`, `:805`).
- Postać tekstowa id: `grep -rn sort renderer/src | grep -i id`; `grep -rn "parse::<\|\.parse()" renderer/src`.
- Pin: `git grep -n "setFog\|setOverlay\|renderMap\|applyView" 07d2fbd72 -- gra/src/render gra/src/main.ts` (dispatch; `setOverlay`/`renderMap`/`applyView` → 0 trafień); `git grep -n "unitRenderer\.sync\|cityRenderer\.sync\|wonderRenderer\.sync\|siegeMarkerRenderer\.sync\|buildTerritoryBorderGroup(\|buildRangeOverlayGroup(\|buildTradeRoutesOverlayGroup(\|setHighlight(\|setSelectionHex(\|setPathRoute(\|applyFogVisibility(\|hideDecorAtHex(" 07d2fbd72 -- gra/src/main.ts`; `git show 07d2fbd72:gra/src/main.ts | sed -n` dla `refreshFog` (13475-13520), `syncUnitsRender` (14540-14565), `refreshSiegeMarkers` (17492-17530), `refreshTerritoryBorderOverlay` + `refreshRangeOverlays` (15582-15650), `refreshTradeRoutesOverlay` (15379-15397), `refreshWorkerFieldOverlay` (15432-15445), okolica (6645-6667), `refreshBuildHighlight` (16351-16395), `_cityRenderOpts` (2939-3005), `unitRingStanceForPlayer` + emblemat (10337-10386), `setPathRoute` (31170-31212); `render/units.ts` (`sync` 6095, `setHighlight` 6524, `setSelectionHex` 6571, `setPathRoute` 6608); `render/scene.ts` (`buildScene` 1580, las 1730/2347, rzeki 1263-1318/2860, `syncForestForUnits` 3164, `hideDecorAtHex` 3172, `setFog` 3526); `game/civ-visual.ts:80-106`.
- Zero `cargo`, zero `npm`, zero zmian kodu.
