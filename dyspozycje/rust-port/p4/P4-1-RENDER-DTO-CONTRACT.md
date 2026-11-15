# P4.1 — Kontrakt modelu widoku (DTO): silnik Rust `civ-engine` → renderer Rust `civ-renderer`, oraz komendy zwrotne z mapy

**Temat:** `R-RUSTPORT-P4-1-RENDER-DTO-CONTRACT-Q1` · **Domena:** GAME · **Rola:** Operator (runda 1/5, wznowienie wg DODATKU r2 dispatchu) + poprawki Obrony po zarzutach Evaluatora r1 (`dyspozycje/autobot/runs/R-RUSTPORT-P4-1-RENDER-DTO-CONTRACT-Q1/02a-obrona.md`)
**Charakter:** temat projektowy. Zero kodu Rust/TS, zero `cargo`, zero buildu. Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/**`.
**Piny (wyłącznie odczyt):**
- Rust: `origin/rust-port/parity-v2` = `f2bb1197` (`git archive` do scratchpadu, potem `grep`/`sed`; ścieżki bez prefiksu `rust-port/` poniżej: `engine/src/…` = `rust-port/engine/src/…`, `renderer/src/…` = `rust-port/renderer/src/…`);
- web (tylko jako źródło „jakie pola czyta renderer”; ścieżki `render/…`, `main.ts` itd. = `gra/src/…`): **pin danych parytetu = `07d2fbd72`** (CLAUDE.md zasada 9; `main.ts` 47 448 linii). Dispatch r1 wskazał `edb8fb56` (`main.ts` 39 350 linii) — z niego przeniesiono `civ-renderer` (`grep -rhoiE "pin[a-z ]{0,10}\`?[0-9a-f]{8,9}\`?" renderer/src` na `f2bb1197` → 31 × `edb8fb56`, 0 × `07d2fbd72`). Piny nie mają wspólnego przodka (`git merge-base edb8fb56 07d2fbd72` → exit 1). Konwencja: każde `main.ts` ma jawny pin `main.ts@07:N` (z odpowiednikiem `@edb:M`); `render/*.ts:N` bez znacznika = `@edb` (te linie cytują komentarze renderera Rust), a ich przesunięcia i **wszystkie różnice pól** `edb8fb56 → 07d2fbd72` są w §1.5;
- baza dokumentu: `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` = `8f2f43a8`; wejście P4-0 z `origin/claude/rust-sivvrn` (`28d7e18f`; plik identyczny z bazą — `diff` pusty).

**Legenda:** `plik:linia` = odczyt z pinu; **NIE_ZMIERZONO** = nie sprawdzono, nie wnioskuję; **BRAK** = sprawdzono `grep`, w Rust nie ma; **D-DTO-n** = punkt decyzji (§7); `@07` = `07d2fbd72`, `@edb` = `edb8fb56`.

---

## 0. Zakres po zmianie decyzji — dlaczego „DTO dla Three.js” stało się „DTO dla renderera Rust”

1. Dispatch r1 opisywał kontrakt dla Three.js w webview (D-REND-1 = „zostaje Three.js”, D-REND-2 = A). Właściciel **zmienił** decyzję: renderer i modele 3D w Rust (wgpu), picking w Rust; „D-REND-2 (DTO dla Three.js) przestaje obowiązywać dla renderera (UI w webview nadal potrzebuje kontraktu)” — `dyspozycje/rust-port/LEDGER.md:117`. Dalsze decyzje: D-RR-1 = A (wgpu), D-RR-10 (Rust właścicielem pętli klatek, kamery, hover-pickingu) — `LEDGER.md:123`.
2. DODATEK r2 dispatchu: „Zakres: temat renderera Rust (grafika/3D mapy, jednostek, bitwy)”. Prośba użytkownika przekazana przez harness: „nie mówimy o webowych tematach, mówimy tylko o RUST”.
3. **Zatem ten dokument definiuje:** (a) model widoku, który `civ-engine` oddaje rendererowi `civ-renderer` (wywołanie w procesie, Rust↔Rust); (b) które jego części idą też do webview z UI (JSON, ten sam snapshot — P4-5B Z12, `P4-5B-MAP-UI-SEAM.md` §8); (c) komendy z mapy do silnika. Pliki webu służą **tylko** jako dowód, jakie pola renderer czyta (parytet 1:1, CLAUDE.md zasada 9).
4. **Czego nie dubluję:** fizyczna droga zdarzeń wejścia, `HitRegions`, `UiState`, `MapClick`/`HoverChanged`/`MapContextMenu` — to kontrakt granicy mapa↔UI z `P4-5B-MAP-UI-SEAM.md` §3–§11. Tu dokładam tylko to, czego P4-5B nie rozstrzyga: co każde zdarzenie mapy znaczy dla **silnika** (§5) i jaki stan silnik musi oddać (§3–§4).

---

## 1. Stan faktyczny po stronie Rust (zmierzone)

### 1.1 Granica silnik ↔ powłoka dziś

| Fakt | Dowód |
|---|---|
| Jedna komenda Tauri `engine_command`, jeden event `engine_state_changed` | `engine/src/bridge.rs:12-17` |
| 6 wariantów komend: `CreateSession`, `AddPlayer`, `SelectUnit{unit_id:u64}`, `MoveUnit{unit_id, destination: PositionDto}`, `AdvanceTurn`, `GetState` | `bridge.rs:24-45` |
| Każda udana komenda zwraca i emituje **pełny** `PlayableState` (alias `EngineState`) | `bridge.rs:78-79`, `:84-87`, `:101-108`; adapter `:255-293` |
| `bridge.rs` jest wkompilowany w powłokę przez `#[path]`; powłoka zależy tylko od `civ-engine` | `src-tauri/src/lib.rs:8-9`; `src-tauri/Cargo.toml:16` |
| `civ-renderer` to osobny crate **bez** zależności od `civ-engine` | `renderer/Cargo.toml:1-56` (zależności: `wgpu` opcjonalnie, `tiny-skia`, `ab_glyph`, `rustybuzz`, `resvg`, `zune-jpeg`) |
| Moduł modelu widoku w rendererze jest pusty („Empty until RR-T13 lands”) | `renderer/src/view.rs:1-5`; temat RR-T13 w `P4-3-RUST-RENDERER-ARCH.md:409` |

### 1.2 `PlayableState` — co silnik oddaje dziś

`engine/src/domain/playable.rs:493-531` (`PlayableState`; komentarz typu `:490`): `map`, `players`, `cities`, `units`, `selected_unit_id: Option<u64>` (`:501`), `turn`, `phase`, `war`, `stores`, `economy`, `forts`. **Brak planów marszu w stanie gry:** `grep -rln planned_march engine/src` → wyłącznie `domain/save_load.rs` (`:130` `planned_marches: Vec<SavedPlannedMarch>` — format zapisu), `domain/pathfinding.rs`, `domain/general_quick_follow.rs` (funkcje); `march_attack` występuje tylko w funkcji pomocniczej `pathfinding.rs:1976-2034`. Dla renderera to **za mało**:

| Pole | Stan | Dowód | Skutek dla renderera |
|---|---|---|---|
| Teren | 4 warianty `Plains/Hills/Forest/Water` | `playable.rs:246-252` | renderer ma 8 terenów bazowych webu (`renderer/src/pick/terrain.rs:24-41`) + nakładki; brak mapowania 1:1 |
| Heks | `position`, `terrain`, `passable` | `playable.rs:260-266` | brak `nakladka`, `wioska`, `rzeka`, `zloze`, `widocznosc` |
| Ulepszenia | `improvements: Vec<{position, ulepszenie?, ulepszenia?}>` | `playable.rs:270-291` | jest (P6-STAN-ULEPSZENIA) |
| Miasto | `id: CityId`, `owner_id: PlayerId`, `name`, `position`, `is_capital`, `population`, `culture` | `playable.rs:352-369` | brak mur/epoka/produkcja/bunt/oblężenie |
| Jednostka | `id: UnitId`, `owner_id`, `kind` (tylko `Warrior`), `position`, `movement`, `movement_max`, `selected` | `playable.rs:378-393` | brak `typeId`, `category`, `hp`, weterana, stosu, `embarked` i flagi wodza (`isGeneral` jest tylko w formacie zapisu `UnitDto.is_general`, `domain/types.rs:418-422`) |
| Właściciel | `PlayerId` (u64); barbarzyńcy/rebelianci przez `OwnerRef` tylko w innych modułach | `domain/ids.rs:36-62` | renderer czyta właściciela jako liczbę (`-1`, `-99`) — zgodne z `OwnerRef` JSON (`ids.rs:105-121`) |

**Silnik ma jednak równoległe, pełniejsze modele i funkcje czyste** (nie podpięte do `PlayableState`):

| Potrzeba renderera | Funkcja/typ w `civ-engine` | Dowód |
|---|---|---|
| pełny heks webu (teren, nakładka, ulepszenie, właściciel, wioska, widoczność, rzeka, złoże, `ulepszenia`, `improvementKey`) | `SnapshotHex` (pola tekstowe) | `engine/src/domain/map_snapshot.rs:148-163` |
| `TerenBazowy` (8) | lokalny enum w `pathfinding` | `pathfinding.rs:722-733` |
| `Nakladka` | enum w generatorze | `mapgen/terrain_class.rs:245` |
| właściciel modelu `MapHex` | **szkielet pusty** (temat M01) | `mapgen/types.rs:1-3` |
| widoczność gracza | `compute_player_visibility` | `state.rs:1067`, `:1080` |
| stała mgły `FOG_EXPLORED_BRIGHTNESS` | — | `state.rs:856` |
| gwiazdki weterana | `veteran_star_count(battles_survived)` | `unit_health.rs:171` |
| poziomy odznak ulepszeń | `armor_path_badge_level`, `soft_path_badge_level` | `combat.rs:778`, `:783` |
| stosy armii (`StackDisplayInfo`, `StackVitals`) | `compute_stack_display` (id jako `String`, kolejność zachowana) | `recruitment.rs:727-738`, `:763-771`, `:774` |
| wódz / dowódca stosu (`@07`) | flaga `UnitDto.is_general` + moduły `generals.rs`, `army_leadership.rs`; **BRAK** `has_commander` w `StackVitals` (pola `ruch_left`…`veteran_stars`) | `types.rs:418-422`; `grep -rln "is_general\|has_commander" engine/src/domain` → 10 plików (m.in. `generals.rs`, `army_leadership.rs`, `general_quick_follow.rs`); `recruitment.rs:726-738` |
| rodzaj obwarowania miasta (`wallKind`, `@07`) | `city_fortification_kind(built)` | `siege_city_fortification.rs:35` |
| warstwy ulepszeń heksa / ulepszenie kryjące | `improvement_keys_for_hex`, `hex_has_covering_terrain_improvement` | `improvements.rs:1021`, `:1049` |
| etykieta miasta na mapie | `format_city_map_label` | `state.rs:1306` |
| front kolejki produkcji | `front_item` | `production_queue.rs:28` |
| ostrzeżenie o zasobach | `can_afford_building_stock` | `building_costs.rs:582` |
| trasy rzek do renderu (ląd, średnia) | `land_river_render_path`, `medium_river_render_path` | `mapgen/rivers_a.rs:397`, `:436` |
| kategoria modelu jednostki | `category_of(name, role, is_super, typ)` | `unit_replace_defs.rs:42` |
| fotel ludzki | `HUMAN_OWNER_PRIMARY` (dwie definicje: `PlayerId` i `i64`) | `player.rs:16`; `turn_economy_inputs_civ.rs:10` |

### 1.3 Wejścia renderera już zdefiniowane w `civ-renderer` (port 1:1 z webu)

Renderer ma już typy wejściowe odwzorowujące kształt danych webu. Kontrakt DTO **musi je zasilić**, a nie wymyślać od nowa:

| Wejście | Typ w `civ-renderer` | Dowód | Kształt ID/właściciela |
|---|---|---|---|
| teren + rzeki | `TerrainHex{coord, terrain, terraces}`, `RiverPath{hexes, kind}`, `TerrainInput{seed:i32, width, height, hexes, rivers, detail}` | `renderer/src/terrain/mod.rs:184-200`, `:230-243` | `HexCoord{q:i32,r:i32}` (`pick/hex.rs:12-17`) |
| mgła terenu | `set_fog(visible: &HashSet<HexCoord>, explored: &HashSet<HexCoord>, …)` | `terrain/mod.rs:704-711` | `HexCoord` |
| mgła miast | `apply_fog_visibility(vis: &HashSet<String>, fog_on, player_owner_id: i32)` | `models/cities/renderer.rs:592-597` | klucz `"q,r"` jako `String` |
| picking terenu | `MapHex{coord, terrain, prism_hidden, solid_hidden, terraces}` | `pick/terrain.rs:244-259` | `HexCoord` |
| picking jednostek | `UnitPickModel{id: String, hex, meshes}` | `pick/mod.rs:181-189` | id `String` |
| miasta | `City{id: String, owner_id: i32, q, r, population: f64}` + `CityRenderOptions` (8 callbacków) | `models/cities/renderer.rs:116-159` | id `String`, owner `i32` |
| plakietka miasta | `CityMapBadgeInput` (19 pól) | `raster/atlas/keys.rs:125-175` | — |
| okolica miasta | `OkolicaMap{map, covering_improvement}`, `CityOkolicaOverlayParams{city_q, city_r, range, worked_keys, yield_of, show_yields, owner_id}` | `cities/overlay/okolica.rs:354-377` | owner `Option<f64>` |
| tabliczka jednostki | `StatPlateVitals{ruch_left, ruch_max, hp, hp_max, field_power_m, owner_color}` | `units/overlay/stat_plate.rs:309-322` | — |
| emblemat właściciela | `OwnerEmblemContext{civ_id, era, is_city_state, is_barbarian, ring_hex}` | `units/overlay/emblem.rs:28-42` | — |
| gwiazdki / odznaki | `build_veteran_badge(star_count)`, `build_commander_star()`, `pack_row_state(armor, soft, stars)` | `units/overlay/veteran_badges.rs:129`, `:169`; `upgrade_badges.rs:109` | — |
| oblężenia | `SiegeMarkerSyncOptions{camp_hexes_by_city, machines_by_camp_hex, owner_color_by_id, camp_owner_by_hex}`, `CampUnit{q,r,owner_id:i64}`; funkcje `ready_machines_for_city`, `machines_by_camp_hex`, `camp_owner_by_hex` | `models/misc/siege.rs:364-372`, `:424-435`, `:277`, `:285`, `:377` | id miasta `String`, owner `i64` |
| granice/zasięgi | `build_territory_border_group(map, by_owner: &[(i64, HexKeySet)], color_fn, params, relation_color_fn)` | `models/misc/range.rs:722-730` | owner `i64`, kolejność = kolejność `Map` |
| szlaki handlowe | `TradeRouteOverlayInput{from_q, from_r, to_q, to_r, medium}` | `models/misc/trade.rs:20-32` | — |
| podświetlenie budowy | `BuildHighlightHex{q: f64, r: f64}` | `models/misc/build_highlight.rs:21-28` | — |
| mapa nakładek | `OverlayMap{hexes: HashMap<HexKey, Terrain>, seed: Option<f64>}`, `HexKeySet` (kolejność wstawiania) | `models/misc/overlay.rs:16-60` | `HexKey = (i32,i32)` |
| bitwa 3D | `UnitSpawn` (id `String`, strona, kategoria, nazwa modelu, kolor, kolumna/wiersz, facing, hp, morale, amunicja), `FortDto`, `TerrainGrid`, `BattleUnitsOpts` | `battle/units.rs:505-543`, `:720-747`, `:840-853`; `battle/field.rs:353-361` | id `String` |

**Wniosek 1.3:** renderer został przeniesiony „kształtem webu” (id `String`, właściciel `i32`/`i64`/`f64`, kolejność `Map`/`Set`, callbacki `&dyn Fn`). Silnik ma newtypy `u64` i `OwnerRef`. Między nimi potrzebny jest **adapter** (D-DTO-2).

### 1.4 `PositionDto(x, y)` ↔ osiowe `(q, r)` — zamknięte statycznie

`P4-3-RUST-RENDERER-ARCH.md:289` i `P5-0`/`types.ts:30` zostawiły to mapowanie jako NIE_ZMIERZONO. Z kodu:

- web: generator przechodzi `for r in 0..height { for q in 0..width }` i zapisuje klucz `` `${q},${r}` `` (`map/generator.ts:216-219`) — mapa to równoległobok w przestrzeni osiowej, `q ∈ [0, szerokoscQ)`, `r ∈ [0, wysokoscR)`;
- Rust: odległość w `PlayableState` liczona jako sześcienna z `x` = `q`, `y` = `r` (`playable.rs:1381-1387`: `dq=|x1-x2|`, `dr=|y1-y2|`, `ds=|(x1+y1)-(x2+y2)|`), indeks kafelka `y * width + x` (`playable.rs:321-326`).

**Wynik:** `PositionDto(x, y) ≡ HexCoord(q = x, r = y)`. Kolejność `tiles` (`y`-major) = kolejność `Object.values(map.hexes)` webu (wstawianie `r`-major; klucze `"q,r"` nie są indeksami tablicy, więc JS zachowuje kolejność wstawiania). Zastrzeżenie: `PositionDto` ma `u16` (`domain/types.rs:118-122`), `HexCoord` `i32` (`domain/hex.rs:8-12`) — ujemne `q`/`r` nie występują w mapie webu (pętla od 0). Test w czasie działania: kandydat P4-1B (§8).

### 1.5 Pin danych webu: różnice `edb8fb56` → `07d2fbd72` w tym, co czyta renderer

**Pomiar zakresu.** `git diff --stat edb8fb56 07d2fbd72 -- gra/src/render` → 26 plików, +1812/−105 (nowe: `generalHexRing.ts`, `buildHighlight.ts`, `geometryContentPool.ts`, `materialContentPool.ts`, `smallPartLod.ts`, `transientObjectResources.ts`, `unitStaticMerge.ts`, `memDebug.ts`). Dla 8 plików spoza `render/**` (§2.2) zmieniły się 4: `battle/battleScene.ts`, `battle/manualBattle.ts` (+1 import tekstów HUD), `battle/siegeWall.ts`, `main.ts`; `input/picker.ts`, `ui/perfTestPanel.ts`, `ui/unitMiniPreview.ts`, `wonderpreview/main.ts` — bez zmian. Importy logiki w `render/**` (§2.1): na obu pinach 31 linii / 17 plików i ten sam zestaw symboli (`diff` list `grep -n -E "from ['\"]\.\./(game|map|units)/" render/*.ts` po usunięciu numerów linii — pusty); osiem nowych plików importuje wyłącznie `three` i moduły `render/` (`grep -E "^import"`).

#### 1.5.1 Różnice pól (tylko to, co renderer czyta)

| # | Zmiana na `@07` | Dowód (`@07`) | Skutek dla kontraktu |
|---|---|---|---|
| Δ1 | `RuntimeUnit.isGeneral?: boolean` (wódz) | `units/setup.ts:45-46`; na `@edb` brak (`grep -rn "isGeneral\|hasCommander\|CommanderStar" render/ units/setup.ts` → 0) | `UnitViewDto.isGeneral` (§3.5) |
| Δ2 | `StackVitals.hasCommander: boolean` = `stack.some(u => u.isGeneral === true)` | `game/armyMerge.ts:1124-1125`, `:1153` | `StackVitalsDto.hasCommander` (§3.5); w Rust **BRAK** (`recruitment.rs:726-738`) |
| Δ3 | gwiazda dowódcy: `hasCmd = vitals ? vitals.hasCommander : unit.isGeneral === true` → `applyUnitCommanderStar(tokenObj, hasCmd)` | `render/units.ts:6208-6210`; `render/unitVeteranBadges.ts:275-301` | zamyka §9 pkt 3 (źródło = Δ1/Δ2); renderer Rust ma `build_commander_star`, `commander_star_update` (`units/overlay/veteran_badges.rs:169`, `:215`) |
| Δ4 | obwódka 7 heksów wokół wodza: `_syncGeneralRing(unit, hasCmd)` — heks = `unit.q/r`, kolor = `_ringColorForOwner(unit.ownerId)` = `_resolveOwnerColor`, wysokość z terenu 7 heksów (`topYAt` po `GENERAL_RING_HEX_OFFSETS`), widoczność = widoczność żetonu; szerokość z kamery (`applyGeneralRingLod`) | `render/units.ts:6210`, `:6915-6931`, `:6260-6262`, `:5906-5907`, `:5787-5791`; `render/generalHexRing.ts:19`, `:138`, `:204`, `:221` | **bez osobnego pola DTO**: wszystkie wejścia są już w `units[]` (`hex`, `ownerId`, `isGeneral`), `stacks` (`hasCommander`), `owners[].color`, `map` → geometria w rendererze (R-czysta). W `civ-renderer` **BRAK** (`grep -rn "general_ring\|GeneralHexRing" renderer/src` → 0) → kandydat P4-1D/RR-T13 |
| Δ5 | `wallKind`: `cityFortificationKind(built)` (`'mur'` → `'stone'`) zamiast `includes('mury')…`; `wallKindFromBuilt` uznaje też `mury_kamienne` | `main.ts@07:2961-2965`; `render/cityMapStatChip.ts:373` | `CityViewDto.wallKind` ← silnik `city_fortification_kind` (`siege_city_fortification.rs:35`) |
| Δ6 | emblemat: `ringHex` = `'#' + civColorFn(ownerId)` (6 cyfr hex), `null` dla barbarzyńców i miast-państw | `main.ts@07:10373-10384`, `:4080-4082`; `render/unitOwnerEmblem.ts:106` (`ringHex?: string \| null`) | `OwnerViewDto.ringHex` (§3.4) — źródło zamknięte; pole jest już w rendererze Rust (`units/overlay/emblem.rs:37-41`, REPIN-3D B2) |
| Δ7 | podświetlenie budowy: heksy filtrowane `filterBuildHighlightHexes(key, hexes, pendingUndoKeys)`; krycie `IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY`; kopalnie złóż jako osobna warstwa zamiast ogólnego krążka | `render/buildHighlight.ts:1-28`; `main.ts@07:16374-16395` | `overlays.buildHighlight` z polem `kind` (`generic`/`mine`) i heksami już przefiltrowanymi przez producenta (§3.7) |
| Δ8 | bitwa: `BattleUnit.isArmyCommander`, `armyLeaderMoraleBonusFrac`, `BattleOpts.manualControlAllowed`; nowe importy logiki (`game/army-leadership`, `game/city-fortification`, `game/city-towers`, `./formationRules`, `./battle-unit-context`, `rangedDamageMultFor`) | `battle/battleScene.ts@07:414-417`, `:584-585`, `:3571`, `:9803-9806` | logika → silnik (§2.2 #18, D-DTO-7); wieże murów są już w rendererze bitwy (`renderer/src/battle/mod.rs:15`, REPIN-3D A2) |
| Δ9 | granice: ten sam filtr mgły, liczony raz na odświeżenie, plus podpis zawartości (bez przebudowy przy braku zmian) | `main.ts@07:15582-15616` | §3.6 |
| Δ10 | `clearPlannedMarch` kasuje dodatkowo `marchStopNotified`, `marchStopDetail` | `main.ts@07:31050-31074` (na `@edb:25155-25173` tylko `plannedMarches`, `marchAttackTargets`) | §5.2 |
| Δ11 | wyłącznie zasoby GPU/LOD i skale modeli (`RESOURCE_MODEL_SCALE`, `FORT_OUTPOST_MODEL_SCALE`, `PLATE_OWNER_ICON_SIZE`, pule geometrii/materiałów, `SmallPartLod`, scalanie statyczne) | `render/resources.ts:18`, `render/improvements.ts:398-399`, `render/unitStatPlate.ts:154`; nowe pliki z importem tylko `three` | poza DTO (stałe/geometria renderera) |

#### 1.5.2 Przesunięcia numerów linii `render/*.ts` cytowanych w §2–§3 (`@edb` → `@07`)

- `render/cities.ts`: `:24-26` → `:27-29`; `:39-43` → `:42-46`; callbacki `:282-362` → `:313-393` (+31); `:459` → `:502`; `:561` → `:644`; `:635` → `:718`; `:657` → `:740`; `:784-852` → `:867-935` (+83; m.in. `:804` → `:887`, `:813` → `:896`, `:821` → `:904`, `:826` → `:909`).
- `render/units.ts`: `:29` → `:31`; `:36-37` → `:42-43`; `:5799` → `:5851`; `:6038-6041` → `:6095-6098`; `:6052-6056` → `:6109-6113`; `:6113` → `:6177`; `:6143` → `:6208`; `:6162-6167` → `:6230-6235`; `:6188` → `:6266`; `:6233` → `:6319`; `:6465` → `:6571`.
- `render/unitVeteranBadges.ts:280` → `:316`; `render/improvements.ts:471` → `:477`; `render/mapRenderStyle.ts:773` → `:777`; `render/rangeOverlay.ts:578-758` → `:579-759`, `:810-816` → `:811-817`; `render/scene.ts:335-350` → `:336-351`, `:1313-1317` → `:1314-1318`, `:2465` → `:2469`, `:3585` → `:3589`, `:3608` → `:3612`; `units/setup.ts:41-71` → `:42-74`; `game/armyMerge.ts:902-922` → `:1103-1125` (`StackDisplayInfo` `:20` → `:21`, treść bez zmian).
- Bez zmian (pliki poza `git diff --stat` albo zmiany bez przesunięcia cytowanych linii): `cityMapStatChip.ts:7-641`, `improvements.ts:14`, `:346-347`, `mapRenderStyle.ts:8`, `:50`, `:52`, `scene.ts:74-122`, `cityOkolicaOverlay.ts`, `countSceneOverlayCandidates.ts`, `droga-6-ramion.ts`, `fogDim.ts`, `robloxImprovements.ts`, `siegeCamp*.ts`, `siegeMarker.ts`, `unitUpgradeBadges.ts`, `wonderRenderer.ts`, `workerFieldOverlay.ts`, `tradeRoutesOverlay.ts`, `types/hex.ts`, `types/map.ts`, `input/picker.ts`.

Metoda mapowania: skrypt w scratchpadzie porównuje treść linii `@edb:N` z liniami `@07` i wybiera kandydata o największej zgodności kontekstu ±3 linie; każdy wynik z niejednoznacznym kandydatem sprawdzony ręcznie `sed -n`.

---

## 2. Tabela: 17 plików `render/**` importujących logikę + 8 plików Three.js poza `render/`

Kolumna „Zastąpienie w Rust”: **DTO** = pole modelu widoku (§3) liczone przez silnik; **R-czysta** = funkcja czysta (geometria/stała), która żyje w rendererze — z informacją, czy już jest w `civ-renderer`; **silnik** = zapytanie do `civ-engine`.

### 2.1 Pliki `render/**` (lista z `P4-0-RENDERER-ARCHITECTURE.md` §3.3; komenda `grep -n -E "from ['\"]\.\./(game|map|units)/" render/*.ts` → 31 linii w 17 plikach; na `@07` ten sam zestaw — §1.5; numery linii w tabeli = `@edb`, odpowiedniki `@07` w §1.5.2)

| # | Plik web | Import (linia) → użycie (linia) | Charakter | Zastąpienie w Rust (dowód) |
|---|---|---|---|---|
| 1 | `render/cities.ts` | `type City` (`:24`) → `sync`/`syncStatChips`/`syncMapOutlines` (`:459`, `:561`, `:635`); `HUMAN_OWNER_PRIMARY` (`:25`) → `:657`, `:785`, `:804`; `formatCityMapLabel` (`:26`) → `:784`; `type CityProduction, ProductionItem` (`:39`) → `:333`, `:339`; `frontItem` (`:40`) → `:802`; `canAffordBuildingStock` (`:41-43`) → `:813` | typ; stała fotela; **reguła** (etykieta: stolica obcego → nazwa cywilizacji); **reguła** (front kolejki); **reguła** (stan zasobów vs koszt) | DTO `CityViewDto` (§3.4); `viewer.ownerId`; `badge.cityName` ← silnik `format_city_map_label` (`state.rs:1306`); `badge.prodKind/prodId/prodItemName/prodActive/prodPaused/prodCategoryLabel` ← silnik `front_item` (`production_queue.rs:28`); `badge.resourceWarning` ← silnik `can_afford_building_stock` (`building_costs.rs:582`). Odbiorcy w Rust już są: `City` (`models/cities/renderer.rs:116-129`), `CityMapBadgeInput` (`raster/atlas/keys.rs:132-175`) |
| 2 | `render/cityMapStatChip.ts` | `type ProductionKind` (`:7`) → `:27`, `:311`, `:353`, `:631`, `:641` | typ (`'budynek'` / `'jednostka'`) | DTO `badge.prodKind` (enum serializowany jako `"budynek"`/`"jednostka"`); w Rust `CityMapBadgeInput.prod_kind: Option<String>` (`keys.rs:145-146`) |
| 3 | `render/cityOkolicaOverlay.ts` | `hexKeysWithinRadius`, `type TileYield` (`:13`) → `:241`, `:53`, `:70`; `hexHasCoveringTerrainImprovement` (`:14`) → `:292`; `HUMAN_OWNER_PRIMARY` (`:15`) → `:299`; `hexDistance` (`:16`) → `:246` | geometria (promień, odległość); **reguła** (ulepszenie kryjące); **reguła** (plon heksa przez callback `yieldOf`) | R-czysta: `hex_keys_within_radius`, `hex_distance` **już w rendererze** (`cities/overlay/okolica.rs:379-404`); DTO: `okolica.yields` (plon liczy silnik — `TileYieldDto` istnieje w UI `frontend-v2/src/viewmodel/types.ts:345-355`), `map.hexes[].coveringImprovement` ← silnik `hex_has_covering_terrain_improvement` (`improvements.rs:1049`); w Rust wejście `OkolicaMap.covering_improvement` (`okolica.rs:354-359`) |
| 4 | `render/countSceneOverlayCandidates.ts` | `improvementKeysForHex` (`:8`) → `:101`; `isWaterTerrain` (`:9`) → `:88` | narzędzie deweloperskie (P4-4: „tylko narzędzia”, `LEDGER.md:127`) | poza kontraktem gry; w `civ-renderer` brak portu (`grep -rln` dla `count_scene_overlay` i `countSceneOverlay` w `renderer/src` → 0). Jeśli kiedyś potrzebne: czyta `MapViewDto` |
| 5 | `render/droga-6-ramion.ts` | `ROAD_ARM_WIDTH_RATIO`, `ROAD_NODE_RADIUS_RATIO`, `roadArmLength`, `roadMaskArms`, `roadMaskHasNode`, `roadMaskIsLonePatch`, `roadPortRotationY` (`:40-47`) | geometria drogi z maski | R-czysta **już w rendererze**: `road_mask_arms`, `road_mask_has_node`, `road_mask_is_lone_patch` (`models/improvements/droga.rs:47`, `:55`, `:61`), `road_arm_length`, `road_port_rotation_y` (ten sam plik — `grep` trafienia). Wejście: DTO `hexes[].roadMask` (§3.2, D-DTO-4) |
| 6 | `render/fogDim.ts` | `FOG_EXPLORED_BRIGHTNESS` (`:7`) → `:24` | stała | R-czysta **już w rendererze** (`core/fog_dim.rs:15-33`, `terrain/mod.rs` — `grep` trafienia); wejście: DTO `fog` (§3.3) |
| 7 | `render/improvements.ts` | `ROAD_MASK_FULL` (`:14`) → `:346-347`, `:471` | stała | **już w rendererze** (`models/improvements/registry.rs`, `droga.rs`, `roblox.rs` — `grep` trafienia); wejście: DTO `hexes[].ulepszenia`, `roadMask` |
| 8 | `render/mapRenderStyle.ts` | `climateZoneAt` (`:8`) → `:773` | funkcja czysta `(r, wysokośćMapy)` | R-czysta **już w rendererze** `climate_zone_at` (`decor/style.rs:305`); wejście: DTO `map.height` |
| 9 | `render/rangeOverlay.ts` | `computeTerritoryBorderLoops`, `type BorderLoopPoint` (`:9-12`) → `:578-758` | geometria pętli granicy | R-czysta **już w rendererze** (`models/misc/territory.rs`, `range.rs:722-730`); wejście: DTO `territory.byOwner`, `ranges` (§3.6) |
| 10 | `render/robloxImprovements.ts` | `ROAD_MASK_FULL` (`:25`) → `:393-394` | stała | jak #7 |
| 11 | `render/scene.ts` | `improvementKeysForHex` (`:74`) → `:2465`; `FOG_EXPLORED_BRIGHTNESS` (`:75`) → `:3585`, `:3608`; `landRiverRenderPath`, `mediumRiverRenderPath`, `trimMediumRenderPathAtMain` (`:118-122`) → `:1313-1317` | **reguła** (warstwy ulepszeń → `tarasy` blokuje bryłę wzgórza); stała; przekształcenia tras rzek po terenie | DTO `hexes[].terraces` (w Rust wejście `TerrainHex.terraces`, `terrain/mod.rs:193-200`) ← silnik `improvement_keys_for_hex` (`improvements.rs:1021`); trasy rzek: w rendererze **BRAK** (`grep -rn "render_path" renderer/src` → 0), w silniku `land_`/`medium_river_render_path` są (`rivers_a.rs:397`, `:436`), `trimMediumRenderPathAtMain` **BRAK** w obu (`grep` → 0) → D-DTO-4 |
| 12 | `render/siegeCampModels.ts` | `type SiegeMachineKind` (`:6`) | typ (`'taran'` / `'wieza'`, `game/siegeMachines.ts:6`) | w rendererze enum `SiegeMachineKind` (`models/misc/siege.rs:18-26`); w silniku listy gotowych maszyn **BRAK**: `grep -rn` dla `SiegeMachine`, `machines_by_camp`, `camp_hexes` w `engine/src` → 4 trafienia, wszystkie w komentarzach (`siege_turn.rs:8`, `turn_economy_attrition.rs:12`, `:21`, `:126`); jedyny stan to flaga `SiegeCityState.has_siege_machines: bool` (`turn_economy_attrition.rs:118-130`), bez rodzajów maszyn; `tickSiegeMachinesForCity` nieprzeniesione (`turn_economy_attrition.rs:12`) |
| 13 | `render/siegeCampSync.ts` | `type SiegeMachineKind` (`:4`); plik sam definiuje `readyMachinesForCity` (`:7-11`), `machinesByCampHex` (`:14-27`), `campOwnerByHex` (`:30-47`) | typ + rozdział maszyn round-robin (prezentacja) + właściciel obozu (pierwsza obca jednostka) | R-czysta **już w rendererze** (`siege.rs:277`, `:285`, `:377`); wejścia: DTO `sieges[]` (§3.5). Uwaga: **obozy** (`campHexesByCity`) web liczy w `main.ts@07:17492-17511` (`@edb:14512-14530`) — „obca jednostka w odległości 1 od oblężonego miasta” to reguła → silnik |
| 14 | `render/siegeMarker.ts` | `type SiegeMachineKind` (`:8`) | typ | `SiegeMarkerRenderer::sync` (`siege.rs:543`), opcje `SiegeMarkerSyncOptions` (`:424-435`); DTO `sieges[]` |
| 15 | `render/unitUpgradeBadges.ts` | `armorPathBadgeLevel`, `softPathBadgeLevel`, `type UnitBuildingProgress, UnitPathBadgeLevel` (`:90-95`) → `:445`; `veteranStarCount`, `type VeteranProgress` (`:96`) → `:444` | **reguła** (progi pp → poziom 0–3; liczba wygranych → gwiazdki) | DTO `units[].armorBadgeLevel`, `softBadgeLevel`, `veteranStars` ← silnik `combat.rs:778`, `:783`, `unit_health.rs:171`; renderer przyjmuje gotowe liczby (`upgrade_badges.rs:109`, `veteran_badges.rs:129`) |
| 16 | `render/unitVeteranBadges.ts` | `veteranStarCount`, `type VeteranProgress` (`:104`) → `:280` | **reguła** | jak #15 (`veteranStars`) |
| 17 | `render/units.ts` | `HUMAN_OWNER_PRIMARY` (`:29`) → `:5799` (pierścień `own`/`hostile`), `:6465` (domyślny właściciel podświetlenia); `type RuntimeUnit` (`:36`) → `sync` `:6039`; `type StackDisplayInfo` (`:37`) → `:6040`, `:6143-6167`, `:6188`, `:6233` | typy + stała fotela; wartości stosu (suma ruchu/HP/mocy, odznaki) liczone w `armyMerge` | DTO `units[]` + `stacks` (§3.5) ← silnik `compute_stack_display` (`recruitment.rs:774`, kolejność zachowana `:761`); `viewer.ownerId` zamiast stałej. W rendererze klasa `UnitRenderer.sync` **nie jest jeszcze przeniesiona** (`renderer/src/units/mod.rs:1-4` — tylko `overlay`). Na `@07` `sync` czyta dodatkowo `unit.isGeneral` i `vitals.hasCommander` (gwiazda dowódcy, obwódka wodza — §1.5.1 Δ1–Δ4), bez nowego importu logiki |

**Dodatkowo (poza listą P4-0, ale to główne źródło danych):** 13 plików `render/**` importuje typy mapy `types/map` (`GameMap`) i `types/hex` (`Hex`, `TerenBazowy`, `Nakladka`) — komenda `grep -n "from '\.\./types" render/*.ts` → m.in. `cities.ts:27-29`, `scene.ts:33-34`, `units.ts:30-32`, `wonderRenderer.ts:5-7`, `workerFieldOverlay.ts:6-7`, `tradeRoutesOverlay.ts:12-13`, `rangeOverlay.ts:5-6`, `cityOkolicaOverlay.ts:8-9`, `siegeMarker.ts:7`, `mapRenderStyle.ts:6-7`, `resources.ts:7`, `styleResources.ts:6`, `countSceneOverlayCandidates.ts:5-6`. To są **typy danych**, nie reguły — pokrywa je `MapViewDto` (§3.2).

### 2.2 Osiem plików Three.js poza `render/**` (lista z `P4-0` §1.4)

| # | Plik web | Import logiki/stanu (linia) | Charakter | Zastąpienie w Rust |
|---|---|---|---|---|
| 18 | `battle/battleScene.ts` (19 493 linii) | `game/combat` (`:53-66`, `:71-77`), `units/battleRoster` (`:67-68`), `game/unit-power` (`:78`), `game/civ-bonuses` (`:83-90`), `game/unit-building-bonuses` (`:91`), `game/veteran` (`:92-96`), `game/army-starvation` (`:97`), `game/gold-deficit` (`:98`), `game/city-defense` (`:99-103`), `render/units` `buildUnitModel` (`:104`), `input/picker` (`:105`), dane `combat-params.json`, `miasto-params.json` (`:114-115`), `type BronzeCiv` (`:117`) | **cała symulacja bitwy taktycznej w pliku sceny** | podział już przyjęty w porcie: logika = silnik `siege_tactics_*` (`SiegeLoop` `siege_tactics_loop.rs:451`, `ProdBody` `:832`, `BlowRecord` `:817`), scena = renderer `battle/*` („the scene takes a battle-state DTO”, `renderer/src/battle/mod.rs:22-24`). DTO startu bitwy **już istnieje po stronie renderera** (`UnitSpawn`, `FortDto`, `TerrainGrid`, `BattleUnitsOpts`). Strumienia zdarzeń bitwy z silnika **BRAK** (`grep -rln` dla `BattleEvent`, `BattleAnim` w `engine/src` → 0) → §3.8, D-DTO-7 |
| 19 | `battle/manualBattle.ts` | `game/combat`, `game/veteran`, `game/army-starvation`, `game/gold-deficit`, `game/civ-bonuses` (`:28-34`), `render/hexutil`, `render/units` (`:35-36`) | martwy kod (0 importerów: `LEDGER.md:127`, `P4-5B` F6) | brak kontraktu |
| 20 | `battle/siegeWall.ts` | `type BronzeCiv` (`:17`) | typ (klucz cywilizacji muru) | przeniesione: `battle/siege_wall.rs`; wejście: klucz cywilizacji (`siege_wall_civ`, `battle/units.rs:749-753`) + `FortDto` (`:726-733`) → DTO `battle.setup.wallCiv`, `fort` |
| 21 | `input/picker.ts` | `type RuntimeUnit` (`:21`) → `unitAt` (`:271-278`: pierwsza jednostka na heksie w kolejności tablicy) | wyszukanie po kolejności | picking w Rust (D-RR-3; `renderer/src/pick/**`); wymaga **kolejności** `units[]` jak w webie (D-DTO-5). `unit_at` w rendererze: `grep -rn "fn unit_at" renderer/src` → 0 (do RR-T13) |
| 22 | `main.ts` (`@07`: 47 448 linii; `@edb`: 39 350) | integrator: buduje wszystkie callbacki renderera — `_cityRenderOpts` (`main.ts@07:2939-3005` / `@edb:2585-2649`; 22 pola wg `P4-5B` §8), `refreshSiegeMarkers` (`@07:17492-17526` / `@edb:14512-14545`), `unitRenderer.sync` (`@07:14553` / `@edb:11915`), `setHighlight` (`@07:7125`, `:7260`, `:14857`, `:16360`, `:16366`, `:16392`, `:17960` / `@edb:6202`, `:6337`, `:12142`, `:13429`, `:13435`, `:13457`, `:14903`), `setSelectionHex` (`@07:7119`, `:7262`, `:14854` / `@edb:6196`, `:6339`, `:12139`), `setPathRoute` (`@07:31175` / `@edb:25274`), `computeRoadMask` (`@07:15836`, `:17083` / `@edb:13005`, `:14118`) | składanie widoku ze stanu + reguły rozproszone | to jest **producent modelu widoku** w webie; w Rust jego rolę przejmuje producent DTO w silniku (§3) + adapter w rendererze (§6) |
| 23 | `ui/perfTestPanel.ts` | `map/mapGenAsync` (`:21`), `perf/hardwareProfile` (`:22-34`) | sonda WebGL + profil sprzętu, bez stanu gry | sonda GPU po stronie Rust (D-RR-5; `renderer/Cargo.toml` — test `gpu_probe` za cechą `gpu`); poza DTO gry |
| 24 | `ui/unitMiniPreview.ts` | `categoryOf` (`:6`) → `:87` (z rekordu `units.json`: nazwa, `Rola (linia)`, `Super-jednostka`, `Typ`); `buildUnitModel` (`:5`) | **reguła** routingu kategorii | kategoria ← silnik `category_of` (`unit_replace_defs.rs:42`) w katalogu statycznym (`UnitDefDto`, `frontend-v2/src/viewmodel/types.ts:177`); obraz miniatury renderuje Rust (D-UI-3, `LEDGER.md:158`) |
| 25 | `wonderpreview/main.ts` | `render/hexutil` (`:9`), `render/wonderModels` (`:10`) | strona deweloperska, bez stanu gry | modele cudów w `renderer/src/models/wonders/**`; DTO gry: tylko `wonders[]` na mapie (`PlacedWonder`, `render/wonderRenderer.ts:12-19`) |

---

## 3. Schemat modelu widoku `RenderViewDto` (propozycja)

Zasady nazewnictwa: struktury Rust z `#[serde(rename_all = "camelCase")]` (jak `PlayableState`, `playable.rs:491-492`), więc nazwy pól poniżej to klucze JSON dla webview. ID silnika: `CityId`, `UnitId`, `PlayerId`, `CampId` = `#[serde(transparent)] u64` (`domain/ids.rs:4-39`); właściciel = `OwnerRef`, JSON jako liczba (`-99`, `-1` albo `≥0`) (`ids.rs:105-121`). Współrzędne = `HexCoord{q,r}` (`domain/hex.rs:8-12`). Wszystkie kolekcje to `Vec` w kolejności określonej w kolumnie „Kolejność” (D-DTO-5).

### 3.1 Korzeń

| Pole | Typ | Źródło web (co renderer czyta) | Producent Rust |
|---|---|---|---|
| `contractVersion` | `u16` | — (wzór: `bridge.rs:12-13`) | stała |
| `viewer` | `{ ownerId: OwnerRef, fogActive: bool }` | `HUMAN_OWNER_PRIMARY` w 3 plikach (§2.1 #1, #3, #17), `playerOwnerId` (`main.ts`, `P4-5B` §8 klasa b), `fogOn` (`cities.ts:657`; filtr granic `main.ts@07:15597`) | sesja (fotel aktywny, hot-seat) |
| `turn` | `u32` | — | `PlayableState.turn` |
| `map` | `MapViewDto` (§3.2) — **statyczna część** | `GameMap` | D-DTO-6 |
| `hexState` | `Vec<HexDynDto>` (§3.2) | pola zmienne heksa | silnik |
| `fog` | `FogViewDto` (§3.3) | `visible`/`explored` (`scene.ts:335-350`) | `compute_player_visibility` (`state.rs:1067`) |
| `owners` | `Vec<OwnerViewDto>` (§3.4) | callbacki `getEra/getCiv/ownerColorFn/getCivIconId/isCityStateOwner/getCivDisplayName/getMapOutlineKind/getCapitalCityId` (`cities.ts:282-362`), `OwnerEmblemContext` | silnik |
| `cities` | `Vec<CityViewDto>` (§3.4) | `City` + `CityRenderOptions` | silnik |
| `units` | `Vec<UnitViewDto>` (§3.5) | `RuntimeUnit` + `StackDisplayInfo` | silnik |
| `sieges` | `Vec<SiegeViewDto>` (§3.5) | `refreshSiegeMarkers` (`main.ts@07:17492-17526` / `@edb:14512-14545`) | silnik |
| `wonders` | `Vec<PlacedWonderDto>` | `PlacedWonder{wonderId, q, r, ownerId, ruin?}` (`wonderRenderer.ts:12-19`) | silnik |
| `territory` | `TerritoryViewDto` (§3.6) | `buildTerritoryBorderGroup(map, hexKeysByOwner, …)` (`rangeOverlay.ts:810-816`) | `domain/territory.rs` |
| `overlays` | `OverlaysViewDto` (§3.7) | zasięgi, szlaki, okolica, pola robotników, podświetlenia, trasa | silnik + stan UI (`P4-5B` `UiState`) |
| `battle` | `Option<BattleViewDto>` (§3.8) | `new BattleScene(opts)` | `siege_tactics_*` |

### 3.2 Mapa: `MapViewDto` (statyczna) i `HexDynDto` (zmienna)

`MapViewDto`:

| Pole JSON | Typ | Web | Uwagi |
|---|---|---|---|
| `width` | `u32` | `szerokoscQ` (`types/map.ts:18`) | `TerrainInput.width` |
| `height` | `u32` | `wysokoscR` (`:23`) | także `climate_zone_at` |
| `seed` | `f64` (liczba JS) | `seed` (`:35`) | renderer robi `ToInt32` sam (`TerrainInput.seed: i32`, `terrain/mod.rs:233`); `OverlayMap.seed: Option<f64>` |
| `hexes` | `Vec<HexStaticDto>` | `Object.values(map.hexes)` | **kolejność `r`-major, `q`-minor** (§1.4) |
| `rivers` | `Vec<RiverPathDto{ hexes: Vec<HexCoord>, kind: Option<RiverKind> }>` | `riverPaths` + `riverPathKinds` (`types/map.ts:43-49`) | `RiverPath` (`terrain/mod.rs:184-190`) |
| `riverRenderPaths` | `Vec<Vec<HexCoord>>` | wynik `land/medium/trim…RenderPath` (`scene.ts:1313-1317`) | D-DTO-4 (gdzie liczone) |

`HexStaticDto` (teren nie zmienia się w trakcie gry): `coord: HexCoord`, `terenBazowy: Terrain` (8 wariantów, `types/hex.ts:12-24`; serializacja jak web: `"laka"`…`"polarny"`), `rzekaKrawedzie: Vec<u8>` (`RzekaInfo.krawedzie`, `types/hex.ts:93-100`). Czy `terenBazowy` może się zmienić w trakcie gry (np. tarasy, wycinka) — **NIE_ZMIERZONO**; jeśli tak, pole przechodzi do `HexDynDto`.

`HexDynDto` (zmienne; ta sama kolejność co `hexes`):

| Pole JSON | Typ | Web | Producent / uwagi |
|---|---|---|---|
| `nakladka` | enum (8: `brak`, `las`, `zloze_*`, `types/hex.ts:30-39`) | `Hex.nakladka` | las rysuje dekoracja |
| `ulepszenie` | enum (8, `types/hex.ts:45-54`) | `Hex.ulepszenie` | |
| `ulepszenia` | `Option<Vec<String>>` | `HexExt.ulepszenia` | istnieje w `PlayableHexImprovement` (`playable.rs:283-291`) |
| `improvementKey` | `Option<String>` | `HexExt.improvementKey` | `SnapshotHex.improvement_key` (`map_snapshot.rs:162`) |
| `zloze` | `Option<String>` | `HexExt.zloze` | `SnapshotHex.zloze` (`:159`) |
| `villagePresent` | `bool` | jedyny odczyt wioski przez warstwę renderu: `hex.wioska.istnieje` (`main.ts@07:3353`, `:3366` / `@edb:2978`, `:2991`); heks z miastem nie rysuje wioski (`main.ts@07:3368`) | producent: `wioska.istnieje && brak miasta na heksie` (reguła „miasto zastępuje wioskę” w silniku, §4 pkt 1) |
| `terraces` | `bool` | `improvementKeysForHex(hex)` zawiera `tarasy` (`scene.ts:2465`) | silnik `improvement_keys_for_hex` |
| `coveringImprovement` | `bool` | `hexHasCoveringTerrainImprovement` (`cityOkolicaOverlay.ts:292`) | silnik `improvements.rs:1049` |
| `roadMask` | `u8` (6 bitów) | `computeRoadMask(q, r, hexHasRoadAt)` (`main.ts@07:15836`, `:17083` / `@edb:13005`, `:14118`; def. `map/road-network.ts:75`) | D-DTO-4 |

`widocznosc` z heksa webu (`Record<ownerId, Widocznosc>`, `types/hex.ts:136`) **nie** wchodzi do heksa — renderer dostaje ją już przeliczoną dla `viewer` (§3.3). Pól `Hex.wlasciciel` i `wioska.ludnosc` **nie ma** w DTO: renderer ani integrator ich nie czytają (`grep -n "\.wlasciciel\b" render/*.ts` → 0 i `grep -c "\.wlasciciel\b" main.ts` → 0 na obu pinach; `grep -rn "wioska\??\.ludnosc" render/ main.ts` → 0); terytorium idzie przez `collectTerritoryHexKeysByOwner` (§3.6).

### 3.3 Mgła: `FogViewDto`

| Pole | Typ | Web | Odbiorca w Rust |
|---|---|---|---|
| `state` | `Vec<u8>` równoległy do `map.hexes`; kodowanie **nowe, ustalane przez kontrakt** (D-DTO-10): `0` nieodkryty, `1` odkryty, `2` widoczny — odpowiada tekstowemu enumowi webu `Widocznosc = 'nieodkryty' \| 'odkryty' \| 'widoczny'` (`types/hex.ts:60-64`), który liczb nie ma | `visible`/`explored: Set<"q,r">` (`scene.ts:335-350`) | adapter buduje `HashSet<HexCoord>` dla `TerrainScene::set_fog` (`terrain/mod.rs:704-707`) i `HashSet<String>` `"q,r"` dla `CityRenderer::apply_fog_visibility` (`models/cities/renderer.rs:592-597`) |

Kolumna zamiast dwóch zbiorów: rozmiar stały (1 B/heks), deterministyczny, bez sortowania. Alternatywy (dwie listy `HexCoord`; enum tekstowy jak web) — D-DTO-10.

### 3.4 Właściciele i miasta

`OwnerViewDto` (kolejność: rosnąco po `OwnerRef`, `ids.rs:53-62` — kolejność wartości `-99 < -1 < 0 < …`):

| Pole | Typ | Web (dowód) |
|---|---|---|
| `ownerId` | `OwnerRef` | — |
| `color` | `u32` (0xRRGGBB) | `ownerColorFn` (`cities.ts:324`), `civColorFn` (`main.ts@07:17498` / `@edb:14518`); też kolor obwódki wodza (`render/units.ts@07:5906-5907`) |
| `civIconId` | `String` | `getCivIconId` (`cities.ts:330`), `OwnerEmblemContext.civ_id` (`emblem.rs:29-30`) |
| `bronzeCiv` | `String` (klucz modelu miasta) | `getCiv` → `ikonaIdToBronzeCiv(civTypeForOwner)` (`main.ts@07:2955` / `@edb:2599`) |
| `era` | `f64` (1 kamień, 2 brąz, 3 żelazo) | `getEra` (`cities.ts:282`), `emblem.rs:31-32` |
| `isCityState`, `isBarbarian` | `bool` | `isCityStateOwner` (`cities.ts:348`), `emblem.rs:33-36` |
| `ringHex` | `Option<String>` | `emblem.rs:37-41`; źródło `main.ts@07:10381-10383`: `'#' + civColorFn(ownerId)` (`civRingHexFn`, `:4080-4082`), `null` dla barbarzyńców i miast-państw (§1.5.1 Δ6) |
| `displayName` | `Option<String>` | `getCivDisplayName` (`cities.ts:362`) |
| `mapOutlineKind` | `Option<enum>` | `getMapOutlineKind` (`cities.ts:318`) |
| `capitalCityId` | `Option<CityId>` | `getCapitalCityId` (`cities.ts:356`) |
| `relationToViewer` | `enum { self, wojna, pokoj, sojusz, neutralni }` | `relationColorFn` (`rangeOverlay.ts:816`; def. `main.ts@07:4065-4068` / `@edb:3632-3635`): własny właściciel (`isMe`) → `civColorFn(ME())`, inaczej `relationBorderColor(getDiploRelation(ME(), ownerId).status)`; statusy `RelationBorderStatus = 'wojna' \| 'pokoj' \| 'sojusz' \| 'neutralni'` (`game/civ-visual.ts:89`), kolory `wojna` 0xff5252, `sojusz` 0x4fc3f7, reszta 0xffd700 (`:84-86`, `:100-104`). Producent: silnik (`getDiploRelation`, `main.ts@07:10312`); mapowanie status → kolor = stała prezentacji w adapterze (w `civ-renderer` **BRAK**: `grep -rn RELATION_BORDER renderer/src` → 0; renderer przyjmuje `relation_color_fn: Option<&dyn Fn(i64) -> u32>`, `range.rs:730`) |

`CityViewDto` (kolejność: kolejność tablicy `cities` w silniku — D-DTO-5):

| Pole | Typ | Web (dowód) |
|---|---|---|
| `id` | `CityId` | `City.id` |
| `ownerId` | `OwnerRef` | `City.ownerId` |
| `hex` | `HexCoord` | `City.q/r` |
| `population` | `f64` | `City.population` (`cities.ts:826`: `city.population ?? 1`) |
| `level` | `f64` | `getLevel` (`cities.ts:294`; domyślnie `max(1, min(10, population))` — `models/cities/renderer.rs:140-141`) |
| `wallKind` | enum `none/palisada/stone` | `getWallKind` (`cities.ts:306`), `wallKindFromBuilt` (`:799-800`); na `@07` `cityFortificationKind(built)` (`main.ts@07:2961-2965`) → silnik `city_fortification_kind` (`siege_city_fortification.rs:35`), §1.5.1 Δ5 |
| `revolt` | `bool` | `getRevolt` (`cities.ts:309`) |
| `besieged` | `bool` | `c.oblegane` (`main.ts@07:17493` / `@edb:14513`); etykieta R5 (`P4-5B` §7) |
| `fogVisible` | `bool` | część mgłowa `isVisible` (`P4-5B` §8, wiersz mieszany); filtr panelu miasta przychodzi z `UiState` |
| `unitCountOnHex` | `u32` | `getUnitCountOnHex` (`cities.ts:315`) |
| `badge` | `CityBadgeDto` = `CityMapBadgeInput` **bez** pól stanu UI/renderera (`hoverExpanded` ← `UiState`/hover Rust; `lodLevel` ← renderer) | `cities.ts:796-852`; Rust `keys.rs:132-175` |

`CityBadgeDto`: `cityName` (etykieta z `format_city_map_label`), `population`, `defenseTier` (0/1/2), `civIconId`, `ownerColor`, `prodActive`, `prodKind`, `prodId`, `prodItemName`, `prodCategoryLabel`, `prodPaused`, `growthPercent: Option<f64>` (tylko miasta `viewer`, `cities.ts:821`), `growthStarving`, `resourceWarning`, `isCityState`, `era`, `isCapital`. Ten sam `growthPercent` pokazuje panel miasta (`P4-5B` §8, D-UI-9) — jedno pole, jeden producent.

### 3.5 Jednostki, stosy, oblężenia

`UnitViewDto` (kolejność: kolejność tablicy `units` w silniku = kolejność `sync`, `units.ts:6038-6041`, i `unitAt`, `picker.ts:271-278`):

| Pole | Typ | Web (dowód) | Producent |
|---|---|---|---|
| `id` | `UnitId` | `RuntimeUnit.id` (`units/setup.ts:41`) | |
| `ownerId` | `OwnerRef` | `:42` | |
| `typeId` | `String` (klucz `units.json`) | `:43`; `units.ts:6053` | P2-3: `kind` = klucz katalogu |
| `category` | `String` | `:45`; `units.ts:6052` (`?? 'domyslny'`) | silnik `category_of` |
| `hex` | `HexCoord` | `:46-47` | |
| `ruchMax`, `ruchLeft` | `f64` | `:48-49`; `units.ts:6162-6163` | |
| `hp`, `hpMax` | `f64`, `Option<f64>` | `:58-60` | |
| `embarked` | `bool` | `:71`; `units.ts:6056` | |
| `inGarnizon` | `bool` | `:51` | |
| `isGeneral` | `bool` | `RuntimeUnit.isGeneral` (`units/setup.ts@07:45-46`); czyta `render/units.ts@07:6209` (gdy brak wpisu `vitals`) | stan jednostki (w Rust dziś tylko zapis `UnitDto.is_general`, `types.rs:418-422`) |
| `veteranStars` | `u8` (0–3) | `unitVeteranBadges.ts:280` | `unit_health.rs:171` |
| `armorBadgeLevel`, `softBadgeLevel` | `u8` (0–3) | `unitUpgradeBadges.ts:445` | `combat.rs:778`, `:783` |
| `dimmed` | `bool` | `dimmedUnitIds` / `deferredPlayerUnitRevealIds` (`main.ts@07:14553` / `@edb:11915`, `units.ts:6113`) | silnik (odroczone odsłonięcie) |

Gwiazda dowódcy i obwódka wodza nie mają osobnego pola: renderer liczy `hasCmd = vitals ? vitals.hasCommander : unit.isGeneral` (`render/units.ts@07:6209`) i z tego rysuje gwiazdę oraz obwódkę 7 heksów w kolorze `owners[ownerId].color` na heksie `hex` (§1.5.1 Δ3–Δ4). To geometria z pól już obecnych w DTO, więc zostaje w rendererze (R-czysta, w `civ-renderer` BRAK).

`StackViewDto` (lustro `StackDisplayInfo`, `game/armyMerge.ts:20-42`; w Rust `recruitment.rs:763-771`): `visibleIds: Vec<UnitId>`, `badgeByRepId: Vec<(UnitId, u32)>`, `starvingRepIds: Vec<UnitId>`, `goldDeficitRepIds: Vec<UnitId>`, `vitalsByRepId: Vec<(UnitId, StackVitalsDto)>`; `StackVitalsDto` = `ruchLeft, ruchMax, hp, hpMax, fieldPowerM, count, armorBadgeLevel, softBadgeLevel, veteranLevel, veteranStars, hasCommander` (web `game/armyMerge.ts@07:1103-1125`; Rust `recruitment.rs:726-738` — bez `has_commander`, do dopisania w P4-1D; użycie `units.ts:6143-6167` / `@07:6208-6235`). Kolejność wpisów = kolejność `Map`/`Set` webu (zachowana w `compute_stack_display`, `recruitment.rs:761`).

`SiegeViewDto` (jeden wpis na oblężone miasto, kolejność jak `cities`): `cityId`, `cityHex`, `campHexes: Vec<HexCoord>` (reguła z `main.ts@07:17499-17510` / `@edb:14519-14529` — w silniku), `readyMachines: Vec<SiegeMachineKind>` (`city.siegeMachines.ready`, `siegeCampSync.ts:7-11`; w silniku tylko flaga `has_siege_machines`, rodzajów **BRAK** — §2.1 #12). Rozdział maszyn na obozy i właściciel obozu liczy renderer (§2.1 #13). Kolory obozów z `owners[].color`.

### 3.6 Terytorium i zasięgi

`TerritoryViewDto`: `byOwner: Vec<{ ownerId: OwnerRef, hexes: Vec<HexCoord> }>` w kolejności wstawiania `Map` webu (odbiorca `build_territory_border_group(by_owner: &[(i64, HexKeySet)])`, `range.rs:722-730`).

**Reguła mgły — obowiązek producenta** (`refreshTerritoryBorderOverlay`, `main.ts@07:15582-15616` / `@edb:12757-12778`): heks właściciela trafia do `byOwner`, gdy `isMe(ownerId)` **albo** `!fogOn` **albo** heks należy do `currentVisible()` lub `fogExploredForRender()` dla `viewer` (`main.ts@07:15595-15601` / `@edb:12761-12767`). Silnik filtruje przed wysłaniem; renderer nie dostaje heksów obcych granic ukrytych we mgle. Pusty wynik → brak warstwy (`@07:15602`).

**Warunek pokazania** to stan UI, nie pole DTO: `territoryBorderVisible || isCityPanelOpen()` (`main.ts@07:15583` / `@edb:12759`). `territoryBorderVisible` to trwały wybór użytkownika (`main.ts@07:7152-7154` komentarz / `@edb:6229-6231`), `isCityPanelOpen()` — stan panelu. Oba przychodzą z `UiState` (`P4-5B`), więc kontroler decyduje, czy renderer rysuje `territory`. Kolor: `civColorFn` → `owners[].color`, kolor relacji → `owners[].relationToViewer` (§3.4).

### 3.7 Nakładki: `OverlaysViewDto`

| Pole | Typ | Web | Kto liczy | Odbiorca Rust |
|---|---|---|---|---|
| `cultureRange`, `religionRange` | `Option<Vec<{ownerId, hexes}>>` | `refreshRangeOverlays` (`main.ts@07:7157-7160` / `@edb:6235-6238`) | silnik (gdy `UiState` je włącza) | `build_range_overlay_group(_game)` (`range.rs:783`, `:794`) |
| `tradeRoutes` | `Vec<{from: HexCoord, to: HexCoord, medium: "lad" / "morze"}>` | `TradeRouteOverlayInput` (`tradeRoutesOverlay.ts:18-24`) | silnik | `trade.rs:20-32`, `:102` |
| `okolica` | `Option<{cityId, cityHex, range: f64, workedHexes: Vec<HexCoord>, yields: Vec<(HexCoord, TileYieldDto)>, showYields: Option<bool>, ownerId}>` | `CityOkolicaOverlayParams` (`cityOkolicaOverlay.ts:47-60`) | silnik (plon, robotnicy) | `okolica.rs:361-377` (`yield_of` z tablicy) |
| `workerFields` | `Vec<{hex, ownerId}>` (kolejność `Map`) | `buildWorkerFieldOverlayGroup(map, workedByOwner, playerOwnerId)` (`workerFieldOverlay.ts:130-138`) | silnik | `build_worker_field_overlay` (`cities/overlay/worker_field.rs:169`) |
| `reachable` | `Vec<HexCoord>` | `setHighlight(reachable)` (`main.ts@07:7125`, `:7260` / `@edb:6202`, `:6337`) | silnik (pathfinding) | renderer jednostek (RR-T13) |
| `buildHighlight` | `{ kind: generic \| mine \| foundCity, hexes: Vec<HexCoord> }` | `setHighlight(qual)` (`main.ts@07:16360-16395` / `@edb:13429-13457`); na `@07` heksy przefiltrowane `filterBuildHighlightHexes(key, hexes, pendingUndoKeys)` (`@07:16374-16377`), kopalnie złóż jako osobna warstwa (`@07:16385-16389`) | silnik (legalność budowy + odjęcie heksów z cofaniem w tej turze) | `build_highlight.rs:21-28` |
| `selection` | `Option<{hex, ownerId}>` | `setSelectionHex` (`main.ts@07:7119` / `@edb:6196`) | **stan UI** (`UiState.selectedUnitId`, D-CMD-12 rozstrzygnięte w `P2-5-COMMANDS.md:661`: zaznaczenie = efemeryczny stan UI); producent DTO dokłada tylko `hex`/`ownerId` zaznaczonej jednostki z `units[]`. `PlayableState.selected_unit_id` (`playable.rs:501`) renderer nie czyta | RR-T13 |
| `pathRoute` | `Option<Vec<HexCoord>>` | `setPathRoute` (`main.ts@07:31175` / `@edb:25274`) | silnik (plan marszu zaznaczonej jednostki — wymaga stanu planów, §5.2) / zapytanie `preview_path` (hover) | RR-T13 |

### 3.8 Bitwa: `BattleViewDto`

- **Start:** `setup = BattleUnitsOpts` — już zdefiniowany w rendererze (`battle/units.rs:840-853`): teren (`TerrainGrid`, `field.rs:353-361`), klucz muru (`siege_wall_civ`), strona gracza, `Vec<UnitSpawn>` w kolejności spawnu webu; `FortDto` (`units.rs:720-747`). Silnik musi te struktury **wyprodukować** z `SiegeLoop`/`ProdBody` (`siege_tactics_loop.rs:451`, `:832`). Model jednostki: decyzja właściciela D-MOD-9 = A („jedna jednostka = jeden model wszędzie”, `LEDGER.md:128`) → `UnitSpawn.model_name`/`category` z tego samego `typeId`/`category_of`, co na mapie.
- **Przebieg:** renderer ma funkcje animacji odpowiadające akcjom logiki (`MoveAnim`, `MeleeLunge`, `launch_projectile`, `RamAnim`, `Boulder`, `breach_wall_tile(_fort)`, `breach_gate`, `rout_facing`, `set_facing`, `kill_unit` — `renderer/src/battle/dynamics.rs:9-27`, `:322-605`). Po stronie silnika istnieje tylko `BlowRecord` (obserwacja ciosu dla testów, `siege_tactics_loop.rs:815-829`). Strumień zdarzeń bitwy — **BRAK** → D-DTO-7.

---

## 4. Zasady kontraktu

1. **Zero symulacji w rendererze i w JS.** `PLAN-PORT-RUST-TAURI-20261020.md` §1 pkt 4 i §4 P5.13 (cytowane w `P4-0` §3.4). W tym projekcie oznacza to: każda kolumna oznaczona w §2 jako **reguła** jest liczona w silniku i przychodzi gotowa w DTO; w rendererze zostają wyłącznie funkcje oznaczone **R-czysta** (geometria, stałe, rozkład prezentacyjny). Lista podziału: §2.1 kolumna „Charakter”.
2. **DTO niezależne od GPU/wgpu.** Typy DTO nie zawierają `wgpu`, siatek ani macierzy; renderer kompiluje DTO bez cechy `gpu` (zgodnie z warstwami `renderer/Cargo.toml:9-17`).
3. **Determinizm.** Wszystkie kolekcje to `Vec` w kolejności opisanej przy polu. Renderer już zależy od kolejności: `HexKeySet` (kolejność wstawiania, `overlay.rs:46-60`), `SiegeMarkerRenderer.markers` (kolejność `Map`, `siege.rs:463-468`), `by_owner` (`range.rs:722-724`), `sync` jednostek i `unitAt` (§3.5). Silnik używa miejscami `BTreeMap<u64, …>` (np. `playable.rs:436-448`) — kolejność po id, nie wstawiania → D-DTO-5. Liczby: `f64` tam, gdzie web liczy na `number` i renderer czyta `f64` (populacja, ruch, HP, era) — bez zaokrąglania na granicy.
4. **JSON-bezpieczeństwo (dla części idącej do webview).** Newtypy `u64` serializują się jako liczba (`ids.rs:9-10`); JS traci dokładność powyżej `2^53 − 1`. Liczniki ID są monotoniczne od małych wartości (P2-3, `LEDGER.md:80`) — kontrakt dodaje niezmiennik „ID ≤ 2^53 − 1” sprawdzany w producencie (D-DTO-2). `OwnerRef` → `i64` (`ids.rs:105-111`).
5. **Jeden snapshot dla renderera i UI** (`P4-5B` Z12, §8): pola wspólne (np. `growthPercent`, produkcja, kolory, ikony) mają jednego producenta; UI czyta je z tego samego snapshotu.

### 4.1 Rozmiar i aktualizacja (opcje z kosztami — bez rozstrzygnięcia)

Skala: web przełącza „lite” przy > 3000 i > 8000 heksów (`render/mapRenderStyle.ts:50`, `:52`) — rząd wielkości mapy 10³–10⁴ heksów. Liczba jednostek/miast na późnej mapie — **NIE_ZMIERZONO**.

Szacunek (arytmetyka z §3.2, nie pomiar): `HexStaticDto` ≈ 8 B współrzędne + 1 B teren + ≤ 6 B krawędzi rzeki; `HexDynDto` stała część ≈ 1+1+1+1+1+9 B (enumy, flagi, maska, wioska) + rzadkie stringi; mgła 1 B. Dla 8 000 heksów: ~0,1–0,2 MB w pamięci bez stringów. W JSON (klucze camelCase) — rząd 50–100 B/heks, czyli ~0,4–0,8 MB na pełny snapshot. **Pomiar = NIE_ZMIERZONO** (kandydat P4-1A).

| Wariant | Opis | Koszt | Ryzyko |
|---|---|---|---|
| **A** pełny snapshot na każdą zmianę | jak dziś `engine_state_changed` z całym `PlayableState` (`bridge.rs:101-108`) | najprostszy; renderer (w procesie) nie serializuje, ale przebudowuje wszystkie warstwy; UI dostaje ~0,4–0,8 MB JSON na zmianę (szacunek) | koszt przy ruchu każdej jednostki AI w turze — NIE_ZMIERZONO |
| **B** statyczna mapa raz + pełne warstwy dynamiczne | `MapViewDto` przy starcie/wczytaniu; potem `hexState`, `fog`, `cities`, `units`, … pełne, ale małe | średni; podział na „statyczne/dynamiczne” wymaga listy pól niezmiennych (§3.2 — `terenBazowy` NIE_ZMIERZONO) | niski |
| **C** delty per encja z wersją | zdarzenia `UnitMoved`, `HexChanged`, … z numerem wersji | najwyższy (kolejność, odtwarzanie po utracie, testy) | wysokie; zysk tylko przy bardzo dużych mapach |

---

## 5. Kontrakt wsteczny: mapa → silnik (komendy) i silnik → renderer/UI (zdarzenia)

### 5.1 Zdarzenia mapy (granica `P4-5B` §5.3, §11) → komendy silnika

| Zdarzenie mapy (`P4-5B`) | Zachowanie webu (dowód) | Komenda silnika (wiersz `P2-5-COMMANDS.md`) | Stan w `bridge.rs` |
|---|---|---|---|
| `MapClick` LPM na własną jednostkę | zaznaczenie (`handleSelectedUnitHudAction` i klik, `P2-5:159` U1) | `select_unit { unit_id }` (U1) | **jest** `SelectUnit{unit_id: u64}` (`bridge.rs:35`) |
| `MapClick` LPM na heks przy zaznaczeniu | `beginMoveSelectedUnitTo(destQ, destR)` (`main.ts@07:32037` / `@edb:26036`; U2) — marsz wieloheksowy z planem | `move_unit { unit_id, destination }` (U2) | **częściowo**: `MoveUnit` akceptuje tylko heks sąsiedni (`playable.rs:874-884`: `distance != 1` → błąd) |
| `MapClick` na wrogą jednostkę/miasto | atak / oblężenie / wybór ataku (W1, W9 — `P2-5:176`, `:182`) | `siege_besiege`, `battle_*` (W1–W9) | **BRAK** |
| klawisz B nad ostatnim heksem (`HoverChanged.last_b_hex`) | `tryFoundPlayerCityAt` (B11, `P2-5:104`) | `found_city` (B11 → B6) | **BRAK** |
| `MapDoubleClick { hex }` | `showHexContextPanel(q, r)` (`main.ts@07:32721-32732` / `@edb:26714-26725`) — wyłącznie UI | brak komendy (UI czyta `HexTooltipViewDto`, `types.ts:1232`) | — |
| **`MapContextMenu` / `MapRightUp` (PPM)** | patrz §5.2 | odznaczenie = `UiState` (D-CMD-12, `P2-5-COMMANDS.md:661`); do silnika tylko **`cancel_planned_march { unit_id, force: false }`** (nowa) | **BRAK** (`grep -rn -i "cancel_planned\|clear_planned\|deselect" engine/src` → 0); warunek wstępny: stan planów marszu w `PlayableState` (§5.2) |
| hover heksu przy zaznaczonej jednostce | podgląd trasy, „jedno liczenie ścieżki na przejście heksu” (`main.ts@07:32233-32238` / `@edb:26224-26229`), `setPathRoute` (`@07:31175` / `@edb:25274`) | zapytanie tylko do odczytu `preview_path { unit_id, dest } → Option<Vec<HexCoord>>` (bez eventu) | **BRAK**; przy D-RR-10 to wywołanie w procesie (renderer/kontroler Rust → silnik), bez IPC |
| bitwa: klik heksu = ruch/atak, pomiń, wycofaj | `battleScene.ts:3947-3948`, `:3250` (W10, `P2-5:183`) | `battle_manual_action` (W10) | **BRAK** |

### 5.2 Prawy klik — `NIE_ZMIERZONO` z `P4-0` §3.2 zamknięte

Web ma **dwa** słuchacze PPM na canvasie (logika ta sama na obu pinach; różnica w `clearPlannedMarch` — §1.5.1 Δ10):

1. `contextmenu` (`main.ts@07:32218-32230` / `@edb:26209-26221`): `preventDefault`; wyjście, gdy `galleryOn || isAnimating || isPostBattleSummaryOpen()` (`@07:32220`) albo kursor nad ramką panelu miasta (`@07:32221`); jeśli tryb budowy — `exitBuildMode()` i koniec (`@07:32223-32226`); inaczej `dismissPlayerUnitSelectionIfAny()` (`@07:32227`) i `hideHexContextPanel()` (`@07:32229`).
2. `mouseup` z `button === 2` (`main.ts@07:32352-32358` / `@edb:26337-26343`): jeśli tryb budowy — `exitBuildMode()`; inaczej `dismissPlayerUnitSelectionIfAny()`.

Skutki:

- `exitBuildMode()` (`main.ts@07:16526-16541` / `@edb:13588-13603`) — stan UI (tryb budowy, `activeImprovementKey`, `activeWonderId`), z wyjątkiem: nie działa, dopóki gracz nie ma pierwszego miasta (`isAwaitingFirstPlayerCity`, `@07:16532` / `@edb:13594`);
- `hideHexContextPanel()` (`main.ts@07:13700-13706` / `@edb:11107-11113`) — stan UI;
- `dismissPlayerUnitSelectionIfAny()` (`main.ts@07:7138-7143` / `@edb:6215-6220`) ma **bramkę** `if (selectedId === null || !isWorldMapUnitMode()) return false;` (`@07:7139` / `@edb:6216`). `isWorldMapUnitMode()` (`main.ts@07:6733-6750` / `@edb:5833-5850`, treść identyczna — `diff` pusty) zwraca `false`, gdy otwarty jest panel miasta, okno pre-bitwy, scena bitwy, podsumowanie bitwy, panel łączenia armii, wybór łączenia, panel podziału armii, panel oblężenia albo wybór jednostki w mieście — wszystko to stany UI. Gdy bramka przepuszcza: `clearPlayerUnitSelection(force = false)` (`@07:7090-7093` / `@edb:6167-6170`) → `clearPlannedMarch(selectedId, false)`, potem `clearPlayerUnitSelectionStateOnly()` (samo zaznaczenie) i `refreshD1bHud()`;
- **`clearPlannedMarch(unitId, force = false)` zmienia stan gry** (`main.ts@07:31050-31074` / `@edb:25155-25173`): jeśli plan jednostki ma `attackUnitId`, nic nie robi (`@07:31052` / `@edb:25157`); inaczej usuwa wpis jednostki z `plannedMarches` (zapisywane: `plannedMarchesToSave(plannedMarches)`, `@07:37184` / `@edb:30428`; w Rust format zapisu `save_load.rs:130`, `:320-326`), z `marchAttackTargets` (`@07:31054` / `@edb:25159`; mapa `@07:31016`, czytana w turze `@07:25782`, `:25795`), a na `@07` także z `marchStopNotified` i `marchStopDetail` (`@07:31055-31056`; mapy `:31007`, `:31009`). Na koniec, gdy dotyczy zaznaczonej jednostki, `unitRenderer.clearPathRoute()` (`@07:31071-31073`) — stan widoku.

**Kontrakt (poprawiony po zarzutach 2 i 3 Evaluatora r1):**

1. **Zaznaczenie zostaje stanem UI** — zgodnie z rozstrzygniętym D-CMD-12 (`P2-5-COMMANDS.md:661`). Silnik nie dostaje komendy odznaczenia; `overlays.selection` pochodzi z `UiState` (§3.7).
2. **Skutek dla gry = osobna komenda** `cancel_planned_march { unit_id: UnitId, force: bool }`, semantyka 1:1 z gałęzią `unitId !== undefined` funkcji `clearPlannedMarch` (`main.ts@07:31051-31056`): przy `force = false` i planie z `attackUnitId` — brak zmian (wynik bez zmian, nie błąd); inaczej usuń wpisy jednostki z `plannedMarches`, `marchAttackTargets`, `marchStopNotified`, `marchStopDetail`. PPM i Esc wysyłają `force: false`; `force: true` ma inny wywołujący (rozwiązanie jednostki — `disbandPlayerUnit`, komentarz `@07:7084`, `:7088`).
3. **Kontroler (P5) wykonuje kolejno:** (a) bramki `contextmenu` (`galleryOn`, animacja, podsumowanie bitwy, ramka panelu miasta) i tryb budowy; (b) bramkę `selectedId !== null && isWorldMapUnitMode()` — oba warunki z `UiState`; (c) gdy przepuszcza: `cancel_planned_march { unit_id: selectedId, force: false }` do silnika, potem czyszczenie zaznaczenia w `UiState` i trasy w rendererze; (d) w `contextmenu` — `hideHexContextPanel()`. Esc (`main.ts@07:43910-43937` / `@edb:36108-36135`) woła tę samą `dismissPlayerUnitSelectionIfAny()` (`@07:43925`), więc tę samą ścieżkę.
4. **Idempotencja:** `mouseup` i `contextmenu` uruchamiają ścieżkę dwa razy; drugie wywołanie trafia na `selectedId === null` i kończy się w bramce (`@07:7139`), więc do silnika idzie najwyżej jedna komenda. `cancel_planned_march` dla jednostki bez planu też nic nie zmienia — wymagany test w P4-1H. Kolejność zdarzeń na platformach — `P4-5B` Z15, §9 pkt 7.
5. **Warunek wstępny w silniku:** `PlayableState` nie przechowuje planów marszu ani `marchAttackTargets`/`marchStopNotified`/`marchStopDetail` (§1.2). Komenda wymaga najpierw tego stanu → kandydat `R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE` (§8), zależność P4-1H. Do tego czasu „semantyka 1:1” nie jest wykonalna.

### 5.3 Zdarzenia silnik → renderer/UI

| Zdarzenie | Treść | Odbiorca | Stan |
|---|---|---|---|
| `engine_state_changed` | dziś pełny `PlayableState` (`bridge.rs:101-108`); w kontrakcie: `RenderViewDto` (cały albo warstwy — D-DTO-3) | renderer (w procesie) + UI (JSON) | jest (inna treść) |
| zdarzenia domenowe dla animacji mapy (ruch jednostki po ścieżce, walka na mapie, zdobycie miasta) | `E-31 battle_result`, `E-35 march_progress`, `E-20 city_captured`, `E-30 siege_state` (`P2-6-EVENTS.md:164`, `:174-175`, `:179`) | renderer (animacja przejścia — D-RR-10: „Rust renderer … sam animuje przejścia”, `P4-3` §3.9 pkt 5) + UI (komunikaty) | **BRAK** w silniku (`P2-6` §9.1) |
| zdarzenia bitwy (ruch, cios wręcz, strzał, taran, kamień katapulty, wyłom, ucieczka, śmierć, zwrot) | odpowiedniki funkcji `renderer/src/battle/dynamics.rs:9-27` | renderer bitwy | **BRAK** (D-DTO-7) |

---

## 6. Adapter po stronie renderera (`renderer/src/view.rs`, temat RR-T13)

Ponieważ moduły renderera mają już przetestowane wejścia „w kształcie webu” (§1.3), adapter tłumaczy DTO na te wejścia **bez reguł gry**:

- `HexCoord` (silnik) → `pick::hex::HexCoord` / `HexKey (i32,i32)` / klucz `"q,r"` (`String`) — trzy postacie, bo trzy moduły (`terrain/mod.rs:704-707`, `overlay.rs:16`, `models/cities/renderer.rs:594`);
- `CityId`/`UnitId` → `String` przez `Display` (`ids.rs:28-32`) dla `City.id`, `UnitPickModel.id`, `UnitSpawn.id`; `OwnerRef` → `legacy_i64()` (`ids.rs:90-96`) dla pól `i32`/`i64`/`f64`;
- `owners[]`/`cities[]` → domknięcia `CityRenderOptions` (`get_era`, `get_civ`, `get_level`, `get_walls`, `get_wall_kind`, `is_visible`, `get_map_outline_kind`, `owner_color_fn`, `models/cities/renderer.rs:133-159`) czytające z tablic DTO;
- `fog.state` → dwa `HashSet` (§3.3).

Ryzyko: czy którykolwiek moduł renderera zależy od **postaci tekstowej** identyfikatora webu (np. sortuje po `String` id albo parsuje prefiks) — **NIE_ZMIERZONO** (do sprawdzenia `grep` w P4-1G; `city_map_badge_key` używa nazwy miasta, nie id — `keys.rs:181`).

---

## 7. Punkty decyzji `D-DTO-n` (nie rozstrzygam)

Klasyfikacja wg CLAUDE.md zasada 9: **żaden** z poniższych punktów nie jest odstępstwem od zachowania webu — to wybory techniczne portu. Wg tej zasady rozstrzyga je orkiestrator i zapisuje w `dyspozycje/rust-port/REJESTR-RUST.md`; podaję rekomendacje z uzasadnieniem. Jeżeli orkiestrator uzna któryś za produktowy, ma gotowy materiał do pytania ABC.

- **D-DTO-1 — Gdzie żyją typy DTO.** A: mały crate `rust-port/view-model` (tylko typy + serde), zależny od niego silnik (producent) i renderer (konsument). B: typy w `renderer/src/view.rs`, mapowanie silnik→DTO w `src-tauri` (jedyne miejsce, które widzi oba crate'y). C: renderer zależy wprost od `civ-engine`. Za A: renderer zostaje lekki i testowalny bez silnika (`renderer/Cargo.toml:5-17`), jeden typ dla renderera i JSON dla UI; przeciw A: nowy crate i ścieżki zależności. Za B: zero nowych crate'ów; przeciw B: logika składania widoku w powłoce Tauri, poza testami silnika. Za C: najmniej kodu; przeciw C: renderer kompiluje cały silnik (~250 plików `domain/`), testy CPU renderera wolniejsze. **Rekomendacja: A.**
- **D-DTO-2 — Identyfikatory na granicy.** A: renderer przechodzi na newtypy `u64`/`OwnerRef`. B: DTO z newtypami, adapter `view.rs` zamienia na istniejące `String`/`i32`/`i64` (§6). C: DTO ze stringami jak web. Za B: zero zmian w przetestowanych modułach i golden (`tests/fixtures/**`), jawne miejsce konwersji; przeciw B: alokacje `String` przy każdym snapshotcie. **Rekomendacja: B** + niezmiennik „ID ≤ 2^53 − 1” w producencie (§4 pkt 4).
- **D-DTO-3 — Aktualizacja: pełny snapshot / statyka + warstwy / delty** (§4.1). **Rekomendacja: B** (statyczna mapa raz, warstwy dynamiczne pełne); pomiar rozmiaru i czasu w P4-1A, rewizja po pomiarze.
- **D-DTO-4 — Granica „reguła vs geometria” dla pól pochodnych:** `roadMask`, trasy rzek do renderu (`land/medium/trim…`), `terraces`, `coveringImprovement`, obozy oblężnicze. A: wszystkie liczy silnik (producent widoku). B: silnik liczy reguły (`terraces`, `coveringImprovement`, obozy, `roadMask` — zależy od reguły „heks ma drogę”), renderer liczy geometrię tras rzek (czysta funkcja kształtu, w webie w `map/gen-helpers`). C: wszystkie w rendererze. **Rekomendacja: A** dla wszystkich pięciu — w silniku są już `land_`/`medium_river_render_path` (`rivers_a.rs:397`, `:436`), a trasy zależą od terenu heksów; renderer dostaje gotowe ścieżki. `trimMediumRenderPathAtMain` trzeba przenieść (BRAK w obu crate'ach).
- **D-DTO-5 — Kolejność kolekcji.** A: DTO w kolejności wstawiania webu (silnik utrzymuje kolejność tam, gdzie web ją ujawnia: heksy, jednostki, miasta, terytorium, obozy, stosy). B: wszędzie kolejność po id + osobne testy zgodności obrazu. C: renderer sortuje sam. **Rekomendacja: A** — renderer już zależy od kolejności (§4 pkt 3), a `compute_stack_display` już ją zachowuje (`recruitment.rs:761`).
- **D-DTO-6 — Producent pełnej mapy.** `PlayableMap` ma 4 tereny (`playable.rs:246-252`), model `MapHex` jest pustym szkieletem (`mapgen/types.rs:1-3`), pełne pola ma tylko `SnapshotHex` (`map_snapshot.rs:148-163`). A: rozszerzyć `PlayableMap`/`PlayableTile` do pól §3.2. B: dokończyć model `MapHex` (temat M01) i trzymać go w stanie gry; producent widoku czyta `MapHex`. C: producent widoku czyta `SnapshotHex`. **Rekomendacja: B** (jeden właściciel modelu heksa; C wiąże widok z formatem zapisu). Zależność dla P4-1B.
- **D-DTO-7 — Bitwa: zdarzenia czy stan na krok.** A: silnik emituje `BattleEvent` (ruch, cios, strzał, taran, kamień, wyłom, ucieczka, śmierć, zwrot) z czasem wirtualnym; renderer odtwarza je funkcjami `dynamics.rs`. B: renderer dostaje stan po każdym kroku i sam wylicza różnice. C: renderer steruje zegarem i woła krok silnika. **Rekomendacja: A** — API animacji renderera już jest pocięte per akcja (`dynamics.rs:9-27`), D-RR-10 daje pętlę klatek Rustowi, a B wymagałby odtwarzania „co się stało” z różnic stanu (reguła w rendererze).
- **D-DTO-8 — Komendy mapy brakujące w `bridge.rs`.** `cancel_planned_march` z semantyką §5.2 (zaznaczenie zostaje w `UiState` wg D-CMD-12, `P2-5-COMMANDS.md:661` — bez rewizji tej decyzji), `move_unit` wieloheksowy (plan marszu), `preview_path` (zapytanie), `found_city`, akcje wojny. A: dopisać do `EngineCommand` w kolejności potrzeb renderera (najpierw stan planów marszu — P4-1J, potem `cancel_planned_march`, `preview_path`, `move_unit` wieloheksowy). B: czekać na pełny katalog P2-5. **Rekomendacja: A** (blokują pierwszą grywalną mapę). Uwaga dla rejestru: uzasadnienie D-CMD-12 („nic nie wymaga roundtrip”) nie obejmuje skutku ubocznego odznaczenia — skasowania planu marszu (§5.2). Wniosek nie zmienia decyzji (zaznaczenie = UI), ale dokłada komendę gry; do odnotowania przy U1 w `P2-5`.
- **D-DTO-9 — Wspólny snapshot dla UI.** Czy `RenderViewDto` (lub jego część) jest tym samym obiektem JSON, który dostaje webview (`P4-5B` Z12), czy UI ma osobne DTO z P5-0 (`frontend-v2/src/viewmodel/types.ts`, 1918 linii). A: jeden snapshot, UI czyta pola wspólne. B: dwa DTO, wspólny producent pól wspólnych w silniku. **Rekomendacja: B** — UI ma już 92+ typów DTO z harnessami (`LEDGER.md:146`); wspólny ma być **producent** (jedna funkcja w silniku), nie obiekt.
- **D-DTO-10 — Kodowanie mgły w DTO.** Web nie ma liczb: `Widocznosc` to enum tekstowy `'nieodkryty' | 'odkryty' | 'widoczny'` (`types/hex.ts:60-64`), a renderer dostaje dwa zbiory kluczy (`scene.ts:335-350`). A: `Vec<u8>` równoległy do `map.hexes` z kodowaniem `0`/`1`/`2` (nowe, ustalone tym kontraktem). B: dwie listy `HexCoord` (`visible`, `explored`) jak wejście webu. C: `Vec<enum>` serializowany tekstem jak web. Za A: 1 B/heks, stały rozmiar, brak sortowania; przeciw A: nowe kodowanie, trzeba je przetestować. Za B: najbliżej webu; przeciw B: rozmiar zależny od odkrycia mapy i obowiązek ustalenia kolejności list. Za C: czytelny JSON; przeciw C: ok. 8–10 B/heks w JSON. **Rekomendacja: A** (adapter i tak buduje oba `HashSet`, §6).

---

## 8. Tematy-kandydaci (P4.2+ w części „model widoku”, = rozbicie RR-T13)

| ID kandydata | Zakres | Allowlista | Zależności |
|---|---|---|---|
| `R-RUSTPORT-P4-1A-VIEW-TYPES` | typy §3 (serde camelCase), testy JSON (round-trip, nazwy kluczy, niezmiennik ID), pomiar rozmiaru snapshotu dla map 3000/8000 heksów | wg D-DTO-1 (A: `rust-port/view-model/**`; B: `rust-port/renderer/src/view.rs` + `tests/view_*.rs`) | D-DTO-1, -2, -3 |
| `R-RUSTPORT-P4-1B-MAP-VIEW-PRODUCER` | `MapViewDto` + `HexDynDto` z modelu mapy; test `PositionDto ≡ (q,r)` i kolejności `r`-major (§1.4); `terraces`, `coveringImprovement`, `roadMask`, trasy rzek z `trimMediumRenderPathAtMain` | `rust-port/engine/src/domain/<moduł widoku mapy>.rs`, `rust-port/engine/tests/view_map_*.rs` | D-DTO-4, -6; temat M01 (model `MapHex`) |
| `R-RUSTPORT-P4-1C-FOG-VIEW` | `FogViewDto` z `compute_player_visibility` dla `viewer` (hot-seat) | moduł widoku mgły w silniku + testy | P4-1A, P4-1B |
| `R-RUSTPORT-P4-1D-UNIT-VIEW` | `UnitViewDto` + `StackViewDto` (`compute_stack_display`, gwiazdki, odznaki, `category_of`, `isGeneral`, `StackVitals.hasCommander`) | moduł widoku jednostek w silniku + testy | P4-1A; rozszerzenie `PlayableUnit` poza `Warrior` (`playable.rs:378-393`) i o flagę wodza (`UnitDto.is_general`, `types.rs:418-422`); `has_commander` w `StackVitals` (`recruitment.rs:726-738`). Gwiazda dowódcy i obwódka wodza po stronie renderera — RR-T13 (§1.5.1 Δ3–Δ4) |
| `R-RUSTPORT-P4-1E-CITY-VIEW` | `OwnerViewDto`, `CityViewDto`, `CityBadgeDto` (`format_city_map_label`, `front_item`, `can_afford_building_stock`, `growthPercent`) | moduł widoku miast w silniku + testy | P4-1A; produkcja i wzrost w stanie gry |
| `R-RUSTPORT-P4-1F-OVERLAYS-VIEW` | terytorium, zasięgi, szlaki, okolica, pola robotników, oblężenia (obozy, gotowe maszyny), cuda, podświetlenia, zaznaczenie, trasa | moduły widoku nakładek w silniku + testy | P4-1A; stan maszyn oblężniczych w silniku (BRAK, §2.1 #12) |
| `R-RUSTPORT-P4-1G-VIEW-ADAPTER` | `renderer/src/view.rs`: DTO → wejścia renderera (§6), w tym `grep` zależności od postaci tekstowej id | `rust-port/renderer/src/view.rs`, `rust-port/renderer/tests/view_adapter_*.rs` | P4-1A; RR-T13 |
| `R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE` | stan planów marszu w `PlayableState`: `plannedMarches` (z `attackUnitId`), `marchAttackTargets`, `marchStopNotified`, `marchStopDetail`; zapis/odczyt przez istniejący `SavedPlannedMarch` (`save_load.rs:130`, `:320-326`) | `rust-port/engine/src/domain/playable.rs`, `rust-port/engine/src/domain/save_load.rs`, testy | wzorzec pól z `#[serde(default, skip_serializing_if)]` (`playable.rs:507-518`); zgodność golden zapisu |
| `R-RUSTPORT-P4-1H-MAP-COMMANDS` | `cancel_planned_march { unit_id, force }` (§5.2: test planu z `attackUnitId` przy `force=false`, test braku planu = bez zmian, test podwójnego wywołania), `preview_path`, `move_unit` wieloheksowy. Bez komendy odznaczenia (D-CMD-12) | `rust-port/engine/src/bridge.rs`, `rust-port/engine/src/domain/playable.rs`, testy | D-DTO-8; **P4-1J**; P2-5 U1, U2, U11 |
| `R-RUSTPORT-P4-1I-BATTLE-EVENTS` | `BattleEvent` z `SiegeLoop`/`ProdBody` + producent `BattleUnitsOpts`; konsument w `renderer/src/battle/**` | `rust-port/engine/src/domain/siege_tactics_*.rs` (nowy moduł zdarzeń), `rust-port/renderer/src/battle/**` (konsument) | D-DTO-7; pętla K5 (`LEDGER`) |

Kolejność: P4-1A → (P4-1B ∥ P4-1J → P4-1H) → (P4-1C ∥ P4-1D ∥ P4-1E) → P4-1F → P4-1G; P4-1I równolegle po D-DTO-7.

---

## 9. `NIE_ZMIERZONO`

1. Czy `terenBazowy` heksa zmienia się w trakcie gry (podział statyka/dynamika, §3.2).
2. ~~Znaczenie `Hex.wlasciciel`~~ — usunięte: pole nie jest czytane przez renderer (§3.2).
3. ~~Pole źródłowe gwiazdy dowódcy~~ — zamknięte: `vitals.hasCommander` / `unit.isGeneral` na `@07` (§1.5.1 Δ1–Δ3).
4. ~~Wartości relacji dla `relationColorFn`~~ — zamknięte: `getDiploRelation(ME(), ownerId).status` (§3.4).
5. Rozmiar i czas budowy snapshotu (szacunek w §4.1 to arytmetyka, nie pomiar); liczba jednostek/miast na późnej mapie.
6. Czy którykolwiek moduł renderera zależy od postaci tekstowej id webu (§6).
7. Kolejność `mouseup`/`contextmenu` na platformach docelowych (obsługa `P4-5B` Z15; skutek dla silnika idempotentny — §5.2).
8. Test w czasie działania mapowania `PositionDto ≡ (q,r)` (zamknięte statycznie w §1.4; test w P4-1B).

---

## 10. Metoda (komendy)

- `git fetch origin claude/rust-sivvrn claude/sprawdzenie-funkcjonalnosci-ek4ra0 rust-port/parity-v2` → `rust-port/parity-v2` = `f2bb11970`, baza = `8f2f43a83`, dispatch = `28d7e18f9`.
- `git archive -o …/rp.tar origin/rust-port/parity-v2 rust-port/renderer/src rust-port/engine/src rust-port/engine/Cargo.toml src-tauri/src src-tauri/Cargo.toml` i `git archive -o …/web.tar edb8fb56 gra/src/render gra/src/input gra/src/battle gra/src/wonderpreview gra/src/ui/unitMiniPreview.ts gra/src/ui/perfTestPanel.ts gra/src/units/setup.ts gra/src/game/{visibility,veteran,human-owners,siegeMachines,okolica,unit-building-bonuses,armyMerge,display-names,production,building-stock-cost,terrain-improvements,cities}.ts gra/src/map/{road-network,gen-helpers,territory-border}.ts`; `git show edb8fb56:gra/src/main.ts` (39 350 linii, zgodne z `P4-0` §1.4); rozpakowane do scratchpadu, potem `grep`/`sed`.
- Importy logiki: `grep -n -E "from ['\"]\.\./(game|map|units)/" render/*.ts` → 31 linii / 17 plików; importy typów mapy: `grep -n "from '\.\./types" render/*.ts`.
- Obecność funkcji w Rust: pętla `grep -rln "\b<nazwa>\b" renderer/src` i `engine/src` dla 26 symboli (wynik w §1.2, §2.1).
- Prawy klik: `sed -n 26195,26240p main.ts`, `grep -n "function dismissPlayerUnitSelectionIfAny\|function clearPlayerUnitSelection\|function clearPlannedMarch\|function exitBuildMode\|function hideHexContextPanel" main.ts`, `grep -n plannedMarches main.ts`, `sed -n 26336,26346p main.ts`.
- `PositionDto ↔ (q,r)`: `git show edb8fb56:gra/src/map/generator.ts | sed -n 212,226p`; `grep -n "fn axial_distance" -A12 engine/src/domain/playable.rs`.
- Obrona r1 (pin `@07`): `git archive 07d2fbd72 gra/src` i `git archive edb8fb56 gra/src` do scratchpadu; `git diff --stat edb8fb56 07d2fbd72 -- gra/src/render` (26 plików, +1812/−105) i `-- <8 plików §2.2>` (4 zmienione); `git diff edb8fb56 07d2fbd72 -- gra/src/render/<plik>` dla każdego zmienionego pliku czytanego przez renderer; `grep -n "hasCommander\|isGeneral\|_syncGeneralRing" render/units.ts game/armyMerge.ts units/setup.ts`; `sed -n 15582,15616p main.ts` (granice), `sed -n 31046,31076p main.ts` (`clearPlannedMarch`), `sed -n '/function isWorldMapUnitMode/,/^    }/p'` na obu pinach + `diff`; mapowanie linii `@edb → @07` skryptem porównującym treść i kontekst ±3 linie (§1.5.2), wątpliwe trafienia sprawdzone `sed -n`.
- Zero `cargo`, zero `npm`, zero buildu.
