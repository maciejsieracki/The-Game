# P4.12 — MOD-01 `core` w Rust: fundament rendera 1:1 z webem (hex, mgła, LOD, scalanie dekoru, palety/wysokości/jakość, typy miast brązu)

TEMAT: `R-RUSTPORT-P4-12-MOD01-CORE-Q1` · DOMAIN: GAME · runda 1/5 · Operator (Opus 5.5 medium)
Baza: `rust-port/parity-v2` @ `69f432ba` · kod: commit `169c608c` (worktree, bez push) · web: pin `edb8fb56`
Paczka: `P4-4-MODEL-CATALOG.md` §5 wiersz 1 (`R-RUSTPORT-P4-MOD-01-CORE`).

## 0. Streszczenie

- Nowy moduł `rust-port/renderer/src/core/**` (10 plików) + jedna linia `pub mod core;` w `src/lib.rs`.
- Pokrycie paczki MOD-01: `hexutil`, `hexShape`, `fogDim`, `zoomLod`, `mergeDecor`, `unitVitalsPalette`,
  `mapRenderStyle` (bez builderów), `bronzeCity` (typy + `rnd`; builder poza zakresem — D-MOD-1).
- **Bez duplikacji**: wszystko, co już było w P4.8/P4.10/P4.11, jest re-eksportowane / wywoływane
  (tabela §2). Nowy kod tylko tam, gdzie w crate nic nie było.
- Weryfikacja: 8 testów `tests/core_web_parity.rs`, **26 960 wartości porównanych bit w bit**
  (`to_bits`) z wektorami wygenerowanymi przez **uruchomiony kod weba** (`three@0.169.0`) —
  **0 rozbieżności**. Test mutacyjny: 32 mutanty, 29 zabitych, 3 przeżyłe są równoważne (§6).
- Bramki na commicie `169c608c`, świeży `CARGO_TARGET_DIR`: `fmt` EXIT=0, `clippy` EXIT=0,
  `clippy --features gpu` EXIT=0, `test --all-targets` EXIT=0 (§9). Dodatkowo MSRV 1.87:
  `core_web_parity` + testy jednostkowe EXIT=0.
- Bez nowych zależności, `Cargo.toml`/`Cargo.lock` bez zmian, `#![forbid(unsafe_code)]` bez zmian.
- Ocena wizualna 1:1: **NIE_ZMIERZONO** (brak GPU) — lista do oceny wzrokiem po RR-T5 w §8.

## 1. Zakres i ZAŁOŻENIA (luki dispatchu rozstrzygnięte domyślnie)

| # | ZAŁOŻENIE | Uzasadnienie |
|---|---|---|
| Z1 | „palety/wysokości/jakość z `mapRenderStyle` (bez builderów)” = wszystkie eksporty niebędące `build*`/kolektorami instancji, plus prywatne dane, od których zależą (`CIV_TERRAIN_VIS`, `TERRAIN_CIV/MINECRAFT`, `hash2D`, `decorVariant5`) | Katalog §4.3 (`P4-4` wiersz `mapRenderStyle.ts`): „stała stylu, progi jakości, wysokości powierzchni, palety, 14 builderów”. Buildery idą do MOD-03 (`P4-4` §5 wiersz 3) |
| Z2 | Wysokości dekoru zależne tylko od stałych (`styleHillBumpSurfaceY`, `styleMountainPeakSurfaceY`, `galleryDecorSurfaceY`, `elevatedTerrainEdgeSurfaceY`) — w zakresie; `reliefSurfaceSampler` — poza (wymaga `powierzchniaReliefuY`, geometrii reliefu MOD-03) | „wysokości” w GOAL; `reliefSurfaceSampler` → `teren-gory-wzgorza.ts` (geometria modeli) |
| Z3 | `GORA_APEX_Y`, `WZGORZE_SZCZYT_Y` (`teren-gory-wzgorza.ts:87,90`) zdefiniowane w `core::map_style` z adnotacją „MOD-03 ma reużyć” | Potrzebne przez Z2; w crate ich nie było (`git grep` §2) |
| Z4 | `isWarmJungleForestHex` poza zakresem (MOD-03) | Wymaga `map/gen-helpers.climateZoneAt` (logika mapy, nie render) |
| Z5 | Wszystkie 3 style (`civ`/`roblox`/`minecraft`) w funkcjach palet/wysokości, mimo D-RR-8 = A | Funkcje są totalne po typie w webie; koszt zerowy; gra używa wyłącznie `roblox` (`mapRenderStyle.ts:40`) |
| Z6 | `MapRenderOptions.sharedRenderer` pominięty | Uchwyt WebGL; w Rust urządzenie GPU należy do warstwy `gpu` |
| Z7 | `effectivePixelRatio` przyjmuje `device_pixel_ratio: Option<f64>` (`None` = brak `window` = 1) | Web czyta `window.devicePixelRatio` (`zoomLod.ts:118`); w Rust brak globalnego okna |
| Z8 | `disposeMergedDecor` zwraca liczby `(geometrie, materiały)` do zwolnienia; drzewa nie zmienia | Brak zasobów GPU po stronie CPU; web też nie usuwa dzieci (`mergeDecor.ts:154-175`) |
| Z9 | Model sceny = minimalny typ `core::scene` (`SceneNode`, `Material`, `Geometry` = `geom::Mesh` + atrybut `color`) | Dispatch: „dodaj MINIMALNY typ we własnym module (nie zmieniaj `geom/**`)”; `geom::Mesh` nie ma atrybutu koloru, w crate nie ma drzewa węzłów |
| Z10 | Nazwa modułu `core` (wg allowlisty) | Nie koliduje z crate `core`: makra std używają ścieżek `::core::…`; build/clippy/test zielone |

## 2. Tabela „było / zrobione tu”

Komendy wyszukiwania (na `69f432ba`, `cd rust-port/renderer`):
`git grep -n "pub fn \|pub const \|pub struct \|pub enum " -- src/pick src/terrain src/geom src/camera.rs`,
`grep -rn "APEX\|SZCZYT\|zoom_lod\|ZoomLod\|fog_brightness\|vitals\|BronzeCiv\|bronze\|merge_decor\|collapse" src`
(jedyne trafienie: komentarz `src/terrain/mod.rs:28` „fog / LOD of solids … (`applyZoomLodDecor`)” — czyli LOD/mgła dekoru nie istniały).

| Web (`edb8fb56`) | Było przed tematem | Zrobione tu (`src/core/…`) |
|---|---|---|
| `hexutil.ts:24` `HEX_R`, `:26` `SQRT3`, `:32-36` `axialToWorld`, `:41-45` `mapCenter`, `:53-71` `worldToAxial` | **całość**: `pick/hex.rs` (`HEX_R`, `sqrt3`, `axial_to_world(_f)`, `map_center`, `world_to_axial_hexutil`) — P4.10 | `hexutil.rs`: tylko re-eksport + `hex_key` (`"q,r"`); dodatkowo nowe wektory weba (§5) potwierdzają starą implementację |
| `hexShape.ts:7-14` `hexRingPointsXZ`, `:17-32` `appendPointyTopHex` | `geom::Path2` (`moveTo`/`lineTo`/`closePath`, P4.8); samych funkcji brak | `hex_shape.rs`: obie funkcje na `geom::Path2` / `geom::Vec3` |
| `fogDim.ts:16-26` `fogBrightnessForHex`, `:29-44` `applyFogDimToObject3D`, `game/visibility.ts:31` `FOG_EXPLORED_BRIGHTNESS` | stała `terrain::FOG_EXPLORED_BRIGHTNESS`; mgła **pryzm** `TerrainScene::set_fog` (P4.11); mgły dekoru brak | `fog_dim.rs`: obie funkcje; stała re-eksportowana |
| `zoomLod.ts` (całość: `normalizedZoomT`, `resolveZoomLodLevel`, `zoomLodFlags`, `effectivePixelRatio`, `cityBadgeLodLevelForDist`, `cityBadgeLodTextureScale`, `zoomLodForCamera`, stałe) | brak | `zoom_lod.rs`: całość |
| `mergeDecor.ts` (całość: `MERGED_DECOR_FLAG`, `isAlreadyMergedDecor`, `countMeshesInGroup`, `buildMergedMesh`, `collapseToMergedMesh`, `disposeMergedDecor`) | `geom::Mat4::compose/mul`, `Vec3::apply_mat4`, `Quat::from_euler` (P4.8); `geom::merge_geometries` to inna funkcja (`BufferGeometryUtils`) | `merge_decor.rs` + model drzewa `scene.rs` |
| `unitVitalsPalette.ts` (11 eksportów) | brak | `vitals.rs` |
| `mapRenderStyle.ts:16-160` style, opcje, presety, progi | `terrain::MapDetailQuality`, `roblox_lite` (= gałąź `robloxLite` stylu roblox), `MAP_DETAIL_MEDIUM_HEX_THRESHOLD`, `LARGE_MAP_LITE_HEX_THRESHOLD` (P4.11) | `map_style.rs`: `MapRenderStyle`, `QualityTier` (= re-eksport `MapDetailQuality`), `MapRenderOptions`, `DEFAULT_MAP_RENDER_OPTIONS`, `normalizeMapRenderOptions`, `resolveRenderPreset` (woła `roblox_lite`), `SCENE_BUILD_FAST_HEX_THRESHOLD`, `isSceneBuildFastPath`, `isRiverRenderFast`, `isSceneBuildAggressive`, `isDenseLandmassMap` |
| `mapRenderStyle.ts:163-343` wysokości | `pick::terrain`: `SEA_SURFACE_TOP_Y`, `WYBRZEZE_SURFACE_TOP_Y`, `LAND_MIN_CLEARANCE_ABOVE_SEA`, `Terrain::surface_y` (= `TERRAIN_SURFACE_Y`), `Terrain::roblox_height`, `Terrain::visual` (= `terrainVisualForStyle` dla roblox); `terrain::coast::LAND_COAST_SAND_FRAC` | re-eksport powyższych + `RIVER_LIFT_ABOVE_TERRAIN_FRAC`, `riverSurfaceLiftY`, `FLAT_LAND_SURFACE_Y`, 3 stałe `@deprecated`, `ROBLOX_TERRAIN_VIS` (tabela), `CIV_TERRAIN_VIS`, `terrainVisualForStyle` (civ/minecraft; roblox → `Terrain::visual`), `terrainSurfaceTopY`, `COAST_WATER_CAP_THICKNESS`, `coastWaterCapTopY`, `terrainHeightAudit` |
| `mapRenderStyle.ts:497-595` kolory, paleta sceny | `terrain::roblox_terrain_hex` (= `TERRAIN_ROBLOX`), `PALETTE_DEEP_OCEAN`, `PALETTE_FRAME`, `terrain::coast::COAST_SAND_ROBLOX` | `TERRAIN_CIV`, `TERRAIN_MINECRAFT`, `styleTerrainColor` (roblox → `roblox_terrain_hex`), `StyleScenePalette`, `styleScenePalette` (roblox `deepOcean`/`frame` → stałe P4.11) |
| `mapRenderStyle.ts:345-351` `hash2D`, `:358-360` `decorVariant5`, `:767-778` liczby drzew | `pick::terrain::hash_heksa` — **ta sama funkcja** (`teren-gory-wzgorza.ts:101-110` vs `mapRenderStyle.ts:345-351`, identyczne operacje) | `decor_variant5`, `forest_tree_count_for_hex`, `jungle_forest_tree_count_for_hex` na `hash_heksa` |
| `mapRenderStyle.ts:1029-1097` wysokości dekoru | `pick::terrain::wariant_dla_heksa`, `TERRAIN_SOLID_VARIANTS` | `styleHillBumpSurfaceY`, `styleMountainPeakSurfaceY`, `galleryDecorSurfaceY`, `elevatedTerrainEdgeSurfaceY`, `GORA_APEX_Y`, `WZGORZE_SZCZYT_Y` (Z2, Z3) |
| `bronzeCity.ts:19-20` `BronzeCiv`, `BRONZE_CIVS`, `:23-40` `ikonaIdToBronzeCiv`, `:42-46` `rnd` | brak | `bronze.rs` |
| — (numeryka JS) | `pick::three::js_min/js_max` (bez NaN), `pick::hex::js_round`, `terrain::color::Color` (`setHex`, `multiplyScalar`) | `jsnum.rs`: `js_min_nan`/`js_max_nan` (owijki z propagacją NaN), `js_to_uint32` (`ToInt32` dla dowolnego double), `js_to_fixed3` (`toFixed(3)` z regułą remisu JS) |

Poza zakresem (z katalogu, celowo): builder `buildBronzeCity` (D-MOD-1), 14 builderów `mapRenderStyle` i kolektory wybrzeża (MOD-03 / już P4.11), `reliefSurfaceSampler`, `isWarmJungleForestHex` (Z2, Z4).

## 3. Wyprowadzenie (plik:linia, web `edb8fb56`)

- **hexShape**: kąt narożnika `Math.PI / 2 + (i * Math.PI) / 3` (`hexShape.ts:10`, `:25`) — w Rust ta sama kolejność
  działań (`(i·π)/3`, nie `i·(π/3)`; mutant z tą zmianą jest zabijany, §6). `reverse` = kolejność 5→0
  (`hexShape.ts:22`), `closePath` dokłada odcinek do punktu startu (`geom::Path2::close_path`, P4.8).
- **fogDim**: `DIM_MAT_TYPES` to zbiór **konstruktorów** (`fogDim.ts:9-14`), więc podklasy
  (`MeshPhysicalMaterial`, `MeshToonMaterial` nie jest w zbiorze) nie są przyciemniane — `MaterialKind` odwzorowuje
  klasę dokładnie. `brightness <= 0` → return (`fogDim.ts:30`); `NaN` przechodzi i propaguje (sprawdzone wektorem).
  Kolor bazowy `fogBaseColor` przechwytywany raz (`:38-39`), wynik `base × b` (`:41`). Materiały współdzielone w three
  → w Rust kopie per mesh; wynik identyczny, bo operacja jest idempotentna (wektor sceny `shared`).
- **zoomLod**: progi `t < 0.20/0.40/0.60/0.80` (`zoomLod.ts:43-46`), flagi 5 poziomów (`:50-115`),
  `effectivePixelRatio = min(cap, max(0.75, baseMax·mul))` (`:117-120`), plakietka `5.5`/`11` (`:161-163`,
  `:176-183`), skala `level === 1 || 2` (`:186-189`). `Math.min/max` z semantyką NaN (`jsnum`).
- **mergeDecor**: traversal pre-order (`group.traverse`, `mergeDecor.ts:51`) z korzeniem włącznie (scena `meshRoot`:
  korzeń-Mesh trafia do scalenia z macierzą jednostkową); macierz `out = I; out = M_mesh·out; out = M_parent·out …`
  do korzenia wyłącznie (`meshMatrixInGroupSpace`, `:34-42`, `premultiply`) — kolejność mnożeń zachowana (mutant z
  odwróconą kolejnością zabity); pozycje `fromBufferAttribute` (f32→f64) `.applyMatrix4` z dzieleniem przez `w`,
  zapis Float32 (`:67`, `:80-81`); kolor `mat0?.color ?? WHITE`, gdzie `WHITE = new Color(1,1,1)` bez konwersji
  sRGB (`:15`, `:62`), albo atrybut `color` geometrii (`:65`, `:69`); indeksowane przez `index.getX(i)`, inaczej
  `0..count` (`:72-76`). Wynik: nieindeksowany, atrybuty tylko `position`+`color`, `MeshLambertMaterial
  ({vertexColors, flatShading})` biały, `castShadow`/`receiveShadow` true, `matrixAutoUpdate` false
  (`:79-90`). `collapse`: puste dzieci / już scalone / 0 wierzchołków → bez zmian i bez flag (`:106-111`); inaczej
  usuwa **wszystkie** dzieci (także sprite'y) i wstawia scalony mesh, flaga na grupie i dziecku (`:118-123`).
  `isAlreadyMergedDecor`: flaga albo jedyne dziecko-mesh z `vertexColors` (`:20-27`).
- **mapRenderStyle**: `terrainVisualForStyle` (`:226-242`): roblox → `ROBLOX_TERRAIN_VIS[t].height` +
  `yOffset = TERRAIN_SURFACE_Y − height`; civ/minecraft → argument `civ`, woda bez zmian, ląd z liftem 0.05 tylko dla
  `civ`. `terrainSurfaceTopY` (`:336-343`) = `h + yOffset + extra`. `terrainHeightAudit` (`:273-321`) — komunikaty
  odtworzone co do znaku (polskie litery, `toFixed(3)`; JS rozstrzyga remis dziesiętny w górę, Rust `format!` do
  parzystej — obsłużone w `js_to_fixed3`, sprawdzone z `node`). `resolveRenderPreset` (`:114-160`): `robloxLite`
  tylko dla `roblox` (= `roblox_lite`, P4.11), 3 presety jakości (`low`/`high`/`default`) — „liczba presetów
  jakości: NIE_ZMIERZONO” z `P4-4` §4.4 jest teraz **zmierzona: 3**. `isDenseLandmassMap` (`:75-86`): ≥120 ścieżek
  → true, <80 → false, inaczej udział lądu `> 0.50`.
- **bronzeCity**: `rnd` (`bronzeCity.ts:42-46`): pierwszy argument `Math.imul` to **double**
  `(n+1)·2654435761 + salt·40503` (przekracza 2⁵³ dla dużych `n`), redukowany `ToInt32` — w Rust liczony w f64 tą
  samą kolejnością i redukowany `js_to_uint32` (dokładny `fmod`); dalej arytmetyka `u32` z zawijaniem.
  `ikonaIdToBronzeCiv` (`:38-40`): tabela 23 kluczy (`:23-36`), domyślnie `grecja`.
- **Świadome odchylenie (1)**: `IKONA_TO_BRONZE[ikonaId]` to zwykły obiekt JS, więc nazwy z `Object.prototype`
  (`toString`, `constructor`, `__proto__`, `hasOwnProperty`, `valueOf`) zwracają w webie funkcję/obiekt zamiast
  stylu (wektor: `"__non_string__:function"`). W Rust → `Grecja`. Żaden `ikonaId` danych gry nie jest taką nazwą
  (`grep -rhoE '"ikonaId"\s*:\s*"[^"]*"' gra/data | sort -u` na `edb8fb56` → 15 wartości: asyria, babilonia,
  celtowie, chinczycy, egipt, fenicjanie, germanie, grecy, harappa, hetyci, inkowie, rzymianie, slowianie, sumer,
  zulusi — wszystkie są kluczami tabeli); test sprawdza jawnie wszystkie 5 przypadków quirka.

## 4. Interfejs dla kolejnych tematów

- MOD-02..MOD-13: modele budują `core::scene::SceneNode` (grupy/meshe z `geom::*_geometry` + `Material` jako dane),
  mgłę dekoru nakładają `core::fog_dim::apply_fog_dim`, scalanie per heks `core::merge_decor::collapse_to_merged_mesh`.
- Warstwa GPU (RR-T5): `Geometry.mesh.positions` + `Geometry.colors` (Float32, nieindeksowane) to gotowy bufor;
  `Material.color × vertex color` = wzór cieniowania Lambert z `vertexColors`; flaga `flat_shading` → normalne z pochodnych.
- `core::zoom_lod::zoom_lod_for_camera` przyjmuje `dist` z `CameraController::focus_state()` (P4.11).

## 5. Wektory testowe (wszystkie z uruchomionego kodu weba)

Pliki i liczności: `rust-port/renderer/tests/fixtures/core/README.md` (liczności zmierzone skryptem `node`
na plikach JSON). Wynik testu (§9, `core-nocapture.log`):

| Test | Wartości porównane bitowo | Rozbieżności |
|---|---:|---:|
| `hexutil_matches_web` | 8 660 | 0 |
| `hex_shape_matches_web` | 761 | 0 |
| `fog_dim_matches_web` | 951 | 0 |
| `zoom_lod_matches_web` | 1 258 | 0 |
| `merge_decor_matches_web` | 6 204 | 0 |
| `vitals_match_web` | 12 | 0 |
| `map_style_matches_web` | 4 895 | 0 |
| `bronze_city_types_match_web` | 4 219 | 0 |
| **razem** | **26 960** | **0** |

Rozmiar fixtur: 684 KB (`du -sh tests/fixtures/core`), daleko poniżej limitu 8 MB; nic nie pominięto.
Regeneracja daje pliki bajtowo identyczne (sprawdzone: drugi przebieg generatora z poprawionym nagłówkiem → `diff`
sum SHA-256 pusty).

SHA-256 (commit `169c608c`):

```text
0bead79eb2001c0fd80ec9e00d3e232d14855ef9afa5a9cfc2f24aeca54344fd  bronze.json
74a776f1fc55dbf1b3f078faeb7deb3b395b14b8a903fd4ea6393a657c4dff49  fogdim.json
351260b758ad77e42f120acfe10f085d752dd716efb23c248905357e0766073c  hexshape.json
d9122c64710c6589bf0ddd2083f41a2d714a37c2e4666b50f5cc921cd2445af1  hexutil.json
1f868e57bed175d6593b44234bc05e10f66c37a3970076b5bf0d96e26e3a8586  mapstyle.json
f6507270e71833e21b9a36a6f41993dc3a70dd3847177c48b3579f3dc7bb932e  mergedecor.json
195228d261cedb143196fd06b69ada34ff749170e18d8d42ee27d18d9f8dbc52  vitals.json
ad97dca6cb723d6b8026d17de2b271ef3389c08de204b840f485c0f468ce97ca  zoomlod.json
b88b82a64ed62ab89c60a8efe090d19629137d35ea9b62a287475b0e977cffd4  gen.ts
```

## 6. Test mutacyjny

Skrypt §10.2 (scratch): każdy mutant wstawiany w kopię pliku `src/core/*`, uruchamiany `cargo test --test
core_web_parity`, plik przywracany (po przebiegu `git status` czysty). Wynik: **32 mutanty, 29 zabitych**.
Przeżyły 3 — wszystkie **równoważne** (nie zmieniają wyniku dla żadnego wejścia albo dla żadnego wejścia
osiągalnego):

1. `normalized_zoom_t`: `js_min_nan/js_max_nan` → `js_min/js_max` — NaN wchodzi tu zawsze jako **drugi** argument
   (`(dist−min)/span`), a `pick::three::js_min/js_max` dla NaN w drugiej pozycji też zwracają NaN; równoważny dla tej
   kolejności argumentów (zachowano wersję z NaN dla czytelności i odporności).
2. `elevated_terrain_edge_surface_y`: `a·b` → `b·a + 0.0` — mnożenie IEEE jest przemienne, `+0.0` neutralne dla
   wyniku ≠ −0.
3. format `LAND_MIN_CLEARANCE_ABOVE_SEA` `{}` → `{:.2}` — dla 0.28 oba dają `0.28`.

## 7. `NIE_ZMIERZONO`

- Wygląd na ekranie (cokolwiek wymagające GPU/obrazu) — patrz §8.
- `sin`/`cos`/`Math.pow` libm innych platform (Windows/macOS): bitowa zgodność zmierzona tylko na Linux x86_64
  (glibc) dla użytych kątów (`hexShape`, kwaterniony Eulera scen testowych). Inne kąty niż w wektorach: NIE_ZMIERZONO.
- Wydajność `collapse_to_merged_mesh` na realnych scenach gry (setki heksów) — nie mierzono.
- Zachowanie na realnych modelach dekoru gry (las, góry, ulepszenia) — modele to MOD-02..MOD-13; tu sceny syntetyczne.
- `normalizeMapRenderOptions('')` (pusty string jest w JS fałszywy → domyślne opcje) — nieodwzorowywalne typem
  `MapRenderStyle`; nieosiągalne w grze (styl to stała `'roblox'`).

## 8. Co ocenić wzrokiem po RR-T5 (dla właściciela)

1. Mgła dekoru: drzewa/góry/ulepszenia na heksie „odkrytym, niewidocznym” mają tę samą jasność co płaski teren
   (×0.175), bez efektu „lądu zalanego oceanem” (`fogDim.ts:1-4`).
2. Dekor po scaleniu (`collapse_to_merged_mesh`) wygląda identycznie jak przed (kolory per wierzchołek, flat shading),
   także po mgle.
3. Przełączanie LOD przy oddalaniu: poziomy 0→4 (znikanie dekoru, pni, brzegów; rzeki dopiero na poziomie 4;
   pixel ratio 1.0/0.85/0.65/0.5/0.35).
4. Ostrość plakietki miasta przy zbliżaniu (progi 5.5 i 11 j.św.) — tekstura ×3/×2.
5. Kolory pasków HP (zieleń/bursztyn/czerwień przy 60%/30%) i ruchu (błękit) na tabliczce jednostki.
6. Kontur heksa (granice miast, `cityMapOutline`) domknięty i bez szczelin.

## 8a. Pochodzenie danych referencyjnych

`tests/fixtures/core/README.md` (wersje, polecenia, adaptacje: 3 funkcje prywatne skopiowane `LITERAL`, reszta
importowana bez zmian). Środowisko: node v22.22.0, `three@0.169.0` (integrity
`sha512-Ed906MA3dR4TS5riErd4QBsRGPcx+HBDX2O5yYE5GqJeFQTPU+M56Va/f/Oph9X7uZo3W3o4l2ZhBZ6f6qUv0w==`, identyczna
z `gra/package-lock.json` @ `edb8fb56`), `esbuild@0.24.0`, rustc 1.97.0 / cargo 1.97.0 (+ 1.87.0 dla MSRV).
Katalog scratch poza repo: `…/scratchpad/p412core/` (usunięty po pracy). **Uwaga porządkowa**: pierwsze
rozpakowanie `git archive edb8fb56` trafiło omyłkowo do współdzielonego `…/scratchpad/web/` (nadpisanie plików
`gra/src`/`gra/data` tymi samymi z pinu `edb8fb56`; nie dotyczy repo); wszystkie wektory powstały z osobnego
`…/scratchpad/p412core/websrc`.

## 9. Surowe logi bramek (commit `169c608c`, `cd rust-port/renderer`, świeży `CARGO_TARGET_DIR=…/scratchpad/p412core/target`, skrypt §10.1; jedyna obróbka: usunięte końcowe spacje linii, wymóg `git diff --check`)

### 9.1 `cargo fmt --all -- --check`

```text
$ cargo fmt --all -- --check
EXIT=0
```

### 9.2 `cargo clippy --locked --all-targets -- -D warnings`

```text
$ cargo clippy --locked --all-targets -- -D warnings
    Checking pollster v0.4.0
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_911d780b-448-1/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.91s
EXIT=0
```

### 9.3 `cargo clippy --locked --all-targets --features gpu -- -D warnings`

```text
$ cargo clippy --locked --all-targets --features gpu -- -D warnings
   Compiling proc-macro2 v1.0.107
   Compiling quote v1.0.47
   Compiling unicode-ident v1.0.27
    Checking cfg-if v1.0.5
   Compiling cfg_aliases v0.2.2
    Checking foldhash v0.2.0
    Checking equivalent v1.0.3
   Compiling autocfg v1.5.1
   Compiling libm v0.2.16
   Compiling thiserror v2.0.21
   Compiling num-traits v0.2.19
    Checking hashbrown v0.17.1
    Checking libloading v0.8.9
   Compiling syn v3.0.9
   Compiling syn v2.0.119
   Compiling libc v0.2.191
    Checking log v0.4.34
   Compiling zerocopy v0.8.63
    Checking indexmap v2.14.2
    Checking bitflags v2.13.2
    Checking rustc-hash v1.1.0
   Compiling naga v30.0.1
    Checking unicode-width v0.2.2
   Compiling pkg-config v0.3.34
   Compiling ash v0.38.0+1.3.281
   Compiling thiserror-impl v2.0.21
   Compiling bytemuck_derive v1.12.1
    Checking once_cell v1.21.4
    Checking bit-vec v0.9.1
   Compiling parking_lot_core v0.9.12
    Checking bit-set v0.10.0
   Compiling wayland-sys v0.31.11
    Checking codespan-reporting v0.13.1
    Checking spirv v0.4.0+sdk-1.4.341.0
    Checking naga-types v30.0.1
    Checking raw-window-handle v0.6.2
    Checking bytemuck v1.25.2
    Checking smallvec v1.16.3
    Checking scopeguard v1.2.0
    Checking allocator-api2 v0.2.21
   Compiling khronos-egl v6.0.0
    Checking static_assertions v1.1.0
    Checking arrayvec v0.7.8
    Checking wgpu-types v30.0.1
    Checking hashbrown v0.16.1
    Checking lock_api v0.4.14
   Compiling zerocopy-derive v0.8.63
    Checking dlib v0.5.3
   Compiling wgpu-hal v30.0.1
    Checking presser v0.3.1
    Checking parking_lot v0.12.5
    Checking ordered-float v5.4.0
    Checking glow v0.17.0
    Checking profiling v1.0.18
    Checking renderdoc-sys v1.1.0
   Compiling wgpu-core v30.0.1
   Compiling litrs v1.0.1
   Compiling wgpu v30.0.1
   Compiling document-features v0.2.12
    Checking half v2.7.1
    Checking gpu-allocator v0.28.0
    Checking wgpu-naga-bridge v30.0.1
    Checking wgpu-core-deps-windows-linux-android v30.0.1
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_911d780b-448-1/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 32.62s
EXIT=0
```

### 9.4 `cargo test --locked --all-targets`

```text
$ cargo test --locked --all-targets
   Compiling pollster v0.4.0
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_911d780b-448-1/rust-port/renderer)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 4.19s
     Running unittests src/lib.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p412core/target/debug/deps/civ_renderer-3390857ab33a1fe3)

running 2 tests
test core::jsnum::tests::to_fixed3_matches_node ... ok
test core::jsnum::tests::to_uint32_matches_ecmascript ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_nturns.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p412core/target/debug/deps/assets_nturns-8f7d0ea4505dd8a8)

running 6 tests
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
test new_game_frees_everything_and_restarts_identically ... ok
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[LeakM2 small 40x25] turn= 50 buffer=36 texture=306 pipeline=3 bind_group=9 live_bytes=9458944 subscriptions=1 created=712 destroyed=358
[Fixed large 96x60] turn= 50 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=2337 destroyed=2134
[LeakM2 small 40x25] turn=200 buffer=36 texture=1206 pipeline=3 bind_group=9 live_bytes=24204544 subscriptions=1 created=2760 destroyed=1506
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM2 small 40x25] turn 50 violations: live texture: baseline=67 current=306 allowed=67; live bytes: baseline=5543168 current=9458944 allowed=5543168
[LeakM2 small 40x25] turn 200 violations: live texture: baseline=67 current=1206 allowed=67; live bytes: baseline=5543168 current=24204544 allowed=5543168
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
test leak_m3_also_retains_battle_scene_resources ... ok
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM3 small 40x25] turn 50 violations: live buffer: baseline=68 current=196 allowed=68; live texture: baseline=9 current=17 allowed=9; live bind_group: baseline=11 current=19 allowed=11; live bytes: baseline=6722816 current=15373568 allowed=6722816; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 small 40x25] turn 200 violations: live buffer: baseline=68 current=676 allowed=68; live texture: baseline=9 current=47 allowed=9; live bind_group: baseline=11 current=49 allowed=11; live bytes: baseline=6722816 current=47813888 allowed=6722816; subscriptions: baseline=5 current=81 allowed=5
[LeakM1 large 96x60] turn= 10 buffer=714 texture=25 pipeline=3 bind_group=106 live_bytes=7547008 subscriptions=1 created=1126 destroyed=278
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[Fixed large 96x60] turn=200 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=8826 destroyed=8623
[Fixed large 96x60] budget OK at turns [50, 200]
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
test fixed_registry_stays_within_budget_after_10_50_200_turns ... ok
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
test simulation_is_deterministic ... ok
[rebuild 1000 cycles] start: turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55 destroyed=0
[rebuild 1000 cycles] end:   turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55055 destroyed=55000
[LeakM1 large 96x60] turn=200 buffer=9552 texture=25 pipeline=3 bind_group=1579 live_bytes=33000448 subscriptions=1 created=16718 destroyed=5559
[LeakM1 large 96x60] turn 50 violations: live buffer: baseline=714 current=2502 allowed=714; live bind_group: baseline=106 current=404 allowed=106; live bytes: baseline=7547008 current=12696448 allowed=7547008
[LeakM1 large 96x60] turn 200 violations: live buffer: baseline=714 current=9552 allowed=714; live bind_group: baseline=106 current=1579 allowed=106; live bytes: baseline=7547008 current=33000448 allowed=7547008test rebuild_in_place_1000_cycles_returns_to_initial_state ...
ok
[LeakM2 large 96x60] turn= 10 buffer=148 texture=265 pipeline=3 bind_group=27 live_bytes=9737216 subscriptions=1 created=637 destroyed=194
[LeakM2 large 96x60] turn= 50 buffer=148 texture=1224 pipeline=3 bind_group=27 live_bytes=25449472 subscriptions=1 created=2336 destroyed=934
[LeakM2 large 96x60] turn=200 buffer=148 texture=4815 pipeline=3 bind_group=27 live_bytes=84284416 subscriptions=1 created=8817 destroyed=3824
[LeakM2 large 96x60] turn 50 violations: live texture: baseline=265 current=1224 allowed=265; live bytes: baseline=9737216 current=25449472 allowed=9737216
[LeakM2 large 96x60] turn 200 violations: live texture: baseline=265 current=4815 allowed=265; live bytes: baseline=9737216 current=84284416 allowed=9737216
[LeakM3 large 96x60] turn= 10 buffer=180 texture=27 pipeline=3 bind_group=29 live_bytes=7967744 subscriptions=5 created=637 destroyed=398
[LeakM3 large 96x60] turn= 50 buffer=308 texture=35 pipeline=3 bind_group=37 live_bytes=16618496 subscriptions=21 created=2337 destroyed=1954
[LeakM3 large 96x60] turn=200 buffer=788 texture=65 pipeline=3 bind_group=67 live_bytes=49058816 subscriptions=81 created=8826 destroyed=7903
[LeakM3 large 96x60] turn 50 violations: live buffer: baseline=180 current=308 allowed=180; live texture: baseline=27 current=35 allowed=27; live bind_group: baseline=29 current=37 allowed=29; live bytes: baseline=7967744 current=16618496 allowed=7967744; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 large 96x60] turn 200 violations: live buffer: baseline=180 current=788 allowed=180; live texture: baseline=27 current=65 allowed=27; live bind_group: baseline=29 current=67 allowed=29; live bytes: baseline=7967744 current=49058816 allowed=7967744; subscriptions: baseline=5 current=81 allowed=5
test each_leak_pattern_breaks_the_budget ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s

     Running tests/assets_registry.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p412core/target/debug/deps/assets_registry-c3f9969dbcf4ae07)

running 14 tests
test budget_thresholds_are_configurable ... ok
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok
test cache_lru_by_entries_and_bytes ... ok
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test handle_from_another_registry_is_rejected ... ok
test owned_guards_count_references ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test reference_counting_frees_on_last_release ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test scope_releases_everything_it_created_on_drop ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test live_report_lists_labels ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok
test subscriptions_unregister_on_drop ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/camera_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p412core/target/debug/deps/camera_web_parity-ed19813f9fcbbf13)

running 5 tests
test drag_and_wheel_do_not_depend_on_dt ... ok
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok
test fixture_covers_every_branch ... ok
test camera_controller_matches_web_100_percent ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/core_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p412core/target/debug/deps/core_web_parity-27c98cd457a8290f)

running 8 tests
test hex_shape_matches_web ... ok
test fog_dim_matches_web ... ok
test map_style_matches_web ... ok
test merge_decor_matches_web ... ok
test vitals_match_web ... ok
test bronze_city_types_match_web ... ok
test hexutil_matches_web ... ok
test zoom_lod_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/cpu_sanity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p412core/target/debug/deps/cpu_sanity-0295d7bf5a63866f)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/geom_three_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p412core/target/debug/deps/geom_three_parity-0f596b3cbdb71744)

running 17 tests
test index_buffer_covers_non_indexed_meshes ... ok
test merge_rejects_mixed_indexing ... ok
test parity_circle ... ok
test parity_cone ... ok
test parity_curve ... ok
test parity_box ... ok
test parity_cylinder ... ok
test parity_plane ... ok
test parity_ring ... ok
test parity_shape ... ok
test parity_ops ... ok
test parity_extrude ... ok
test parity_torus ... ok
test trs_matches_manual_composition ... ok
test parity_polyhedron ... ok
test parity_tube ... ok
test parity_sphere ... ok

test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/gpu_probe.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p412core/target/debug/deps/gpu_probe-b90f27ad8c898393)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pick_golden.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p412core/target/debug/deps/pick_golden-5edd88b94adda948)

running 7 tests
test client_rect_to_ndc_matches_web ... ok
test js_round_matches_math_round ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test world_to_axial_both_variants_match_web ... ok
test terrain_scene_instances_are_bitwise_web ... ok
test camera_matrices_and_rays_are_bitwise_three ... ok
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.44s

     Running tests/terrain_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p412core/target/debug/deps/terrain_web_parity-7ed099e492a012e9)

running 5 tests
test js_pow_special_cases_follow_v8 ... ok
test fog_hides_unknown_and_dims_explored ... ok
test color_math_matches_three ... ok
test terrain_build_matches_web ... ok
test terrain_fog_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.18s

EXIT=0
```

### 9.5 `cargo test --locked --test core_web_parity -- --nocapture` (liczniki §5)

```text
$ cargo test --locked --test core_web_parity -- --nocapture
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.03s
     Running tests/core_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p412core/target/debug/deps/core_web_parity-27c98cd457a8290f)

running 8 tests
test bronze_city_types_match_web ... bronzeCity: 4219 values compared bit for bit, 0 mismatches
ok
test fog_dim_matches_web ... fogDim: 951 values compared bit for bit, 0 mismatches
ok
test hex_shape_matches_web ... hexShape: 761 values compared bit for bit, 0 mismatches
ok
test hexutil_matches_web ... hexutil: 8660 values compared bit for bit, 0 mismatches
ok
test map_style_matches_web ... mapRenderStyle: 4895 values compared bit for bit, 0 mismatches
ok
test merge_decor_matches_web ... mergeDecor: 6204 values compared bit for bit, 0 mismatches
ok
test vitals_match_web ... unitVitalsPalette: 12 values compared bit for bit, 0 mismatches
ok
test zoom_lod_matches_web ... zoomLod: 1258 values compared bit for bit, 0 mismatches
ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

EXIT=0
```

### 9.6 MSRV 1.87 (`rust-version` crate'u), osobny `CARGO_TARGET_DIR`

```text
$ cargo +1.87.0 test --locked --test core_web_parity --lib
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_911d780b-448-1/rust-port/renderer)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.94s
     Running unittests src/lib.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p412core/target187/debug/deps/civ_renderer-c8f3f8232199192d)

running 2 tests
test core::jsnum::tests::to_fixed3_matches_node ... ok
test core::jsnum::tests::to_uint32_matches_ecmascript ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/core_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p412core/target187/debug/deps/core_web_parity-67c5c4f6aa962c91)

running 8 tests
test hex_shape_matches_web ... ok
test map_style_matches_web ... ok
test bronze_city_types_match_web ... ok
test vitals_match_web ... ok
test fog_dim_matches_web ... ok
test merge_decor_matches_web ... ok
test hexutil_matches_web ... ok
test zoom_lod_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

EXIT=0
```

### 9.7 Test mutacyjny (§6, skrypt §10.2)

```text
KILLED: bronze.rs: 'x ^= x >> 13;' -> 'x ^= x >> 12;' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s
KILLED: bronze.rs: '(n + 1.0) * 2_654_435_761.0 + salt * 40503.0' -> '(n + 1.0) * 2_654_435_761.0 + salt * 40504.0' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s
KILLED: bronze.rs: '"slowianie" => BronzeCiv::Germanie' -> '"slowianie" => BronzeCiv::Grecja' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s
KILLED: fog_dim.rs: 'MaterialKind::Basic | MaterialKind::Phong' -> 'MaterialKind::Basic | MaterialKind::Phong | MaterialKind::Physical' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s
KILLED: fog_dim.rs: 'if brightness <= 0.0 {' -> 'if brightness < 0.0 {' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s
KILLED: fog_dim.rs: 'let base = *m.fog_base_color.get_or_insert(color);' -> 'let base = color;' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s
KILLED: merge_decor.rs: 'for m in chain.iter().rev()' -> 'for m in chain.iter()' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s
KILLED: merge_decor.rs: '.unwrap_or(Color::rgb(1.0, 1.0, 1.0))' -> '.unwrap_or(Color::rgb(1.0, 1.0, 0.999))' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s
KILLED: merge_decor.rs: 'if group.merged_decor {' -> 'if false {' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s
KILLED: merge_decor.rs: 'materials.first().is_some_and(|m| m.vertex_colors)' -> 'false' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.11s
KILLED: merge_decor.rs: 'if let Some(ca) = colors {' -> 'if let Some(ca) = colors.filter(|_| false) {' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.11s
SURVIVED: zoom_lod.rs: 'js_min_nan(1.0, js_max_nan(0.0' -> 'crate::pick::three::js_min(1.0, crate::pick::three::js_max(0.0' | test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s
KILLED: zoom_lod.rs: 'if t < 0.40 {' -> 'if t <= 0.40 {' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.13s
KILLED: zoom_lod.rs: 'pixel_ratio_mul: 0.65,' -> 'pixel_ratio_mul: 0.66,' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s
KILLED: zoom_lod.rs: 'if !dist.is_finite() {' -> 'if dist.is_nan() {' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s
KILLED: zoom_lod.rs: 'let cap = device_pixel_ratio.unwrap_or(1.0);' -> 'let cap = device_pixel_ratio.unwrap_or(2.0);' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s
KILLED: map_style.rs: '0.048 + if i == 0 { 0.012 }' -> '0.048 + if i == 0 { 0.0121 }' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s
KILLED: map_style.rs: 'hex_count >= SCENE_BUILD_FAST_HEX_THRESHOLD' -> 'hex_count > SCENE_BUILD_FAST_HEX_THRESHOLD' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s
KILLED: map_style.rs: 'as f64 > 0.50' -> 'as f64 >= 0.50' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.32s
KILLED: map_style.rs: 'if river_paths < 80 {' -> 'if river_paths <= 80 {' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.24s
KILLED: map_style.rs: 'LAND_HEX_Y_LIFT' -> '0.0' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s
KILLED: map_style.rs: 'Terrain::Wzgorza => spec(0.70, 0.15)' -> 'Terrain::Wzgorza => spec(0.70, 0.16)' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s
KILLED: map_style.rs: 'fog_far_mul: 0.72,' -> 'fog_far_mul: 0.7200001,' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s
KILLED: map_style.rs: '&& roblox_lite(options.map_detail_quality, hex_count)' -> '|| roblox_lite(options.map_detail_quality, hex_count)' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s
KILLED: map_style.rs: 'hash_heksa(q, r, seed, 889)' -> 'hash_heksa(q, r, seed, 888)' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s
KILLED: map_style.rs: '!improvement_keys.iter().any(|k| k.as_ref() == "tarasy")' -> 'true' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s
SURVIVED: map_style.rs: 'return hex_top_y + WZGORZE_SZCZYT_Y * WZGORZE_EDGE_RELIEF_FRAC;' -> 'return hex_top_y + WZGORZE_EDGE_RELIEF_FRAC * WZGORZE_SZCZYT_Y + 0.0;' | test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
SURVIVED: map_style.rs: '"{id}: luka {} < min {LAND_MIN_CLEARANCE_ABOVE_SEA}"' -> '"{id}: luka {} < min {LAND_MIN_CLEARANCE_ABOVE_SEA:.2}"' | test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s
KILLED: map_style.rs: 'o.style.unwrap_or(GAME_MAP_RENDER_STYLE)' -> 'o.style.unwrap_or(MapRenderStyle::Civ)' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.14s
KILLED: hex_shape.rs: 'PI / 2.0 + (f64::from(i) * PI) / 3.0' -> 'PI / 2.0 + f64::from(i) * (PI / 3.0)' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.12s
KILLED: hex_shape.rs: 'const BACKWARD: [u32; 6] = [5, 4, 3, 2, 1, 0];' -> 'const BACKWARD: [u32; 6] = [0, 5, 4, 3, 2, 1];' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.11s
KILLED: scene.rs: 'Mat4::compose(self.position, Quat::from_euler(self.rotation), self.scale)' -> 'Mat4::compose(self.position, Quat::from_euler(Euler { order: crate::geom::EulerOrder::Xyz, ..self.rotation }), self.scale)' | test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s
mutants 32 killed 29
```

## 10. Skrypty (identyczne z uruchomionymi; scratch, poza repo)

Generator wektorów: `rust-port/renderer/tests/fixtures/core/gen.ts` (w repo, SHA-256 §5).

### 10.1 Bramki (`gates.sh <crate> <logdir>`)

```bash
#!/usr/bin/env bash
# Gates of R-RUSTPORT-P4-12-MOD01-CORE-Q1 (raw logs with EXIT codes).
cd "$1" || exit 2
L="$2"
mkdir -p "$L"
{
  echo '$ cargo fmt --all -- --check'
  cargo fmt --all -- --check 2>&1
  echo "EXIT=$?"
} > "$L/fmt.log"
{
  echo '$ cargo clippy --locked --all-targets -- -D warnings'
  cargo clippy --locked --all-targets -- -D warnings 2>&1
  echo "EXIT=$?"
} > "$L/clippy.log"
{
  echo '$ cargo clippy --locked --all-targets --features gpu -- -D warnings'
  cargo clippy --locked --all-targets --features gpu -- -D warnings 2>&1
  echo "EXIT=$?"
} > "$L/clippy-gpu.log"
{
  echo '$ cargo test --locked --all-targets'
  cargo test --locked --all-targets 2>&1
  echo "EXIT=$?"
} > "$L/test.log"
{
  echo '$ cargo test --locked --test core_web_parity -- --nocapture'
  cargo test --locked --test core_web_parity -- --nocapture --test-threads=1 2>&1
  echo "EXIT=$?"
} > "$L/core-nocapture.log"
grep -h "EXIT=" "$L"/*.log
```

### 10.2 Test mutacyjny (`mutate.py <crate>`)

```python
#!/usr/bin/env python3
"""Mutation probe for R-RUSTPORT-P4-12 core tests: each mutant must make
tests/core_web_parity.rs fail. Restores every file afterwards."""
import subprocess
import sys

CRATE = sys.argv[1]
MUTANTS = [
    ("bronze.rs", "x ^= x >> 13;", "x ^= x >> 12;"),
    ("bronze.rs", "(n + 1.0) * 2_654_435_761.0 + salt * 40503.0", "(n + 1.0) * 2_654_435_761.0 + salt * 40504.0"),
    ("bronze.rs", "\"slowianie\" => BronzeCiv::Germanie", "\"slowianie\" => BronzeCiv::Grecja"),
    ("fog_dim.rs", "MaterialKind::Basic | MaterialKind::Phong", "MaterialKind::Basic | MaterialKind::Phong | MaterialKind::Physical"),
    ("fog_dim.rs", "if brightness <= 0.0 {", "if brightness < 0.0 {"),
    ("fog_dim.rs", "let base = *m.fog_base_color.get_or_insert(color);", "let base = color;"),
    ("merge_decor.rs", "for m in chain.iter().rev()", "for m in chain.iter()"),
    ("merge_decor.rs", ".unwrap_or(Color::rgb(1.0, 1.0, 1.0))", ".unwrap_or(Color::rgb(1.0, 1.0, 0.999))"),
    ("merge_decor.rs", "if group.merged_decor {\n        return true;", "if false {\n        return true;"),
    ("merge_decor.rs", "materials.first().is_some_and(|m| m.vertex_colors)", "false"),
    ("merge_decor.rs", "if let Some(ca) = colors {", "if let Some(ca) = colors.filter(|_| false) {"),
    ("zoom_lod.rs", "js_min_nan(1.0, js_max_nan(0.0", "crate::pick::three::js_min(1.0, crate::pick::three::js_max(0.0"),
    ("zoom_lod.rs", "if t < 0.40 {", "if t <= 0.40 {"),
    ("zoom_lod.rs", "pixel_ratio_mul: 0.65,", "pixel_ratio_mul: 0.66,"),
    ("zoom_lod.rs", "if !dist.is_finite() {\n        return CityBadgeLodLevel::L0;", "if dist.is_nan() {\n        return CityBadgeLodLevel::L0;"),
    ("zoom_lod.rs", "let cap = device_pixel_ratio.unwrap_or(1.0);", "let cap = device_pixel_ratio.unwrap_or(2.0);"),
    ("map_style.rs", "0.048 + if i == 0 { 0.012 }", "0.048 + if i == 0 { 0.0121 }"),
    ("map_style.rs", "hex_count >= SCENE_BUILD_FAST_HEX_THRESHOLD", "hex_count > SCENE_BUILD_FAST_HEX_THRESHOLD"),
    ("map_style.rs", "as f64 > 0.50", "as f64 >= 0.50"),
    ("map_style.rs", "if river_paths < 80 {", "if river_paths <= 80 {"),
    ("map_style.rs", "LAND_HEX_Y_LIFT\n    } else {", "0.0\n    } else {"),
    ("map_style.rs", "Terrain::Wzgorza => spec(0.70, 0.15)", "Terrain::Wzgorza => spec(0.70, 0.16)"),
    ("map_style.rs", "fog_far_mul: 0.72,", "fog_far_mul: 0.7200001,"),
    ("map_style.rs", "&& roblox_lite(options.map_detail_quality, hex_count)", "|| roblox_lite(options.map_detail_quality, hex_count)"),
    ("map_style.rs", "hash_heksa(q, r, seed, 889)", "hash_heksa(q, r, seed, 888)"),
    ("map_style.rs", "!improvement_keys.iter().any(|k| k.as_ref() == \"tarasy\")", "true"),
    ("map_style.rs", "return hex_top_y + WZGORZE_SZCZYT_Y * WZGORZE_EDGE_RELIEF_FRAC;", "return hex_top_y + WZGORZE_EDGE_RELIEF_FRAC * WZGORZE_SZCZYT_Y + 0.0;"),
    ("map_style.rs", "\"{id}: luka {} < min {LAND_MIN_CLEARANCE_ABOVE_SEA}\"", "\"{id}: luka {} < min {LAND_MIN_CLEARANCE_ABOVE_SEA:.2}\""),
    ("map_style.rs", "o.style.unwrap_or(GAME_MAP_RENDER_STYLE)", "o.style.unwrap_or(MapRenderStyle::Civ)"),
    ("hex_shape.rs", "PI / 2.0 + (f64::from(i) * PI) / 3.0", "PI / 2.0 + f64::from(i) * (PI / 3.0)"),
    ("hex_shape.rs", "const BACKWARD: [u32; 6] = [5, 4, 3, 2, 1, 0];", "const BACKWARD: [u32; 6] = [0, 5, 4, 3, 2, 1];"),
    ("scene.rs", "Mat4::compose(self.position, Quat::from_euler(self.rotation), self.scale)", "Mat4::compose(self.position, Quat::from_euler(Euler { order: crate::geom::EulerOrder::Xyz, ..self.rotation }), self.scale)"),
]

def run_tests():
    r = subprocess.run(["cargo", "test", "--locked", "--test", "core_web_parity"], cwd=CRATE,
                       capture_output=True, text=True)
    out = r.stdout + r.stderr
    for line in out.splitlines():
        if line.startswith("test result") or line.startswith("error"):
            return r.returncode, line
    return r.returncode, "?"

killed = 0
for f, old, new in MUTANTS:
    p = f"{CRATE}/src/core/{f}"
    src = open(p, encoding="utf-8").read()
    assert src.count(old) == 1, (f, old, src.count(old))
    open(p, "w", encoding="utf-8").write(src.replace(old, new))
    try:
        code, line = run_tests()
    finally:
        open(p, "w", encoding="utf-8").write(src)
    status = "KILLED" if code != 0 else "SURVIVED"
    killed += code != 0
    print(f"{status}: {f}: {old.splitlines()[0]!r} -> {new.splitlines()[0]!r} | {line}")
print(f"mutants {len(MUTANTS)} killed {killed}")
```

### 10.3 MSRV (`msrv.sh <crate> <logdir> <target>`)

```bash
#!/usr/bin/env bash
# MSRV (rust-version = 1.87) check of the new tests.
cd "$1" || exit 2
{
  echo '$ cargo +1.87.0 test --locked --test core_web_parity --lib'
  CARGO_TARGET_DIR="$3" cargo +1.87.0 test --locked --test core_web_parity --lib 2>&1
  echo "EXIT=$?"
} > "$2/msrv.log"
tail -3 "$2/msrv.log"
```
