# P4.11 — Kamera i teren CPU w Rust (RR-T2a): kontroler kamery + siatki terenu, 1:1 z webem

STATUS dokumentu: Operator r1 (do oceny Evaluatora)
TEMAT: R-RUSTPORT-P4-11-CAMERA-TERRAIN-CPU-Q1 · DOMAIN: GAME · baza kodu: `origin/rust-port/parity-v2` @ `7aab83f5` · commit kodu: `eb30eefc`
Web źródłowy: `edb8fb56` (wyłącznie `git archive` do katalogu scratch, bez `npm run build/dev`, bez zmian w `gra/**`).
Rozstrzygnięcia orkiestratora (dispatch, runda 1): Q1 = kamera bez obrotu, Q2 = przesuw ciągły × `dt·60` z limitem długiej klatki, Q3 = mgła w siatce terenu (ukrycie + przyciemnienie); mgła/LOD brył gór/wzgórz/lasów poza zakresem.

## 0. Streszczenie

- **Kamera** (`rust-port/renderer/src/camera.rs`, był pusty szkielet): `CameraController` jako czysta maszyna stanów
  zdarzenie → `(target.x, target.z, dist)`; kamera = istniejący `pick::camera::PickCamera` (elewacja 52°, yaw 0, `lookAt`),
  więc macierze pochodzą z tego samego kodu, który P4.10 zweryfikował bitowo — **zero duplikacji matematyki, zero zmian w `pick`**.
  Obsłużone: drag z martwą strefą `DRAG_THRESHOLD_PX = 6`, kółko (krok ×(1±0,12), `deltaY == 0` = przybliżenie jak w webie),
  WASD/strzałki, edge-pan (strefa 32 px, liniowa rampa), `blockPointerAt`/`blockWheelAt` (domyślnie = `blockPointerAt`)/`edgePanActive`
  przez trait `InputGate`, granice zoomu (`clamp` = `Math.max(min, Math.min(max, v))`), `focusAt`, `blur`/`mouseleave`, prostokąt canvasu.
- **Teren** (`rust-port/renderer/src/terrain/{mod,color,coast,jsmath}.rs`, nowy moduł; jedyna zmiana `lib.rs`: `pub mod terrain;`):
  bufory gotowe do GPU — pryzmy `hexPrismNoBottomGeo(1,008·R, h)` (pozycje, normalne, UV, indeksy z `geom`), macierze instancji `Float32`,
  kolory instancji `Float32` (THREE.Color r169 z zarządzaniem kolorem), kolory materiałów; macierze brył gór/wzgórz (5+5 wariantów);
  plaże = 5 warstw instancji brzegu (FALA 141) z deltami i ujściami rzek; tło oceanu + ramka świata; mgła `setFog`
  (`ZERO_MATRIX`, ×`FOG_EXPLORED_BRIGHTNESS = 0,175`, reguła „ocean-hide”, pamięć podręczna A5).
- **Wynik:** kamera — 33 scenariusze / **6 504 zdarzenia / 47 430 skalarów: 0 rozbieżności (bitowo)**; teren — 7 map / 11 605 instancji /
  **271 747 skalarów budowy + 80 332 skalarów po 16 wywołaniach mgły: 100% bitowo** (0 wartości nawet „w 1e-6”);
  matematyka koloru 15 360 skalarów + 2 048 `getHex` + 6 144 `Math.pow` + 2 048 `Math.hypot` + 24 presety: 0 rozbieżności.
  Wszystkie wektory z **uruchomionego kodu weba** (moduły `edb8fb56` importowane bez zmian + oznaczone kopie fragmentów `scene.ts`/`main.ts`), three@0.169.0, node v22.22.0.
- Odkrycie numeryczne: `Math.pow` V8 ≠ `f64::powf` (glibc) w ostatnim bicie (10% losowych wejść, 1 692 skalary terenu) — przeniesiono
  `base::ieee754::pow` z V8 12.4.254.21 (pochodna fdlibm z jedną odchyłką V8 w kroku `2**z`) → 0/200 000 rozbieżności w osobnym teście scratch, 0/6 144 w fixture.
- Bramki renderera (§9, pełne logi): `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets --features gpu -- -D warnings` EXIT=0;
  `cargo clippy --locked --all-targets -- -D warnings` EXIT=0; `cargo test --locked --all-targets` EXIT=0.
- Test mutacyjny (§6): **19/19** mutacji wykrytych. Zero nowych zależności, `Cargo.toml`/`Cargo.lock` bez zmian, brak `unsafe` (`#![forbid(unsafe_code)]` w crate).

## 1. Zakres i rozstrzygnięcia

| Pozycja | Decyzja | Skutek w kodzie |
|---|---|---|
| Q1 obrót kamery | wierna kopia weba **bez obrotu** | web nie ma obrotu (`camera.ts:66` „nie zmieniamy”, `:123` `yaw = 0`); „orbit” z GOAL wykreślony — nie ma czego portować |
| Q2 czas | przesuw klawiszami/edge-pan × `min(dt, 0,1)·60` | `CameraController::update(dt, gate)`; przy `dt = 1/60` współczynnik to dokładnie `1.0` (test `frame_at_60_fps_is_exactly_one_web_frame`), więc wektory weba porównywane przy `dt = 1/60` są bitowo równe. **Odchylenie od weba:** web przesuwa o stały krok na klatkę (`camera.ts:275-289`), niezależnie od FPS — przy 30 FPS web jest 2× wolniejszy, Rust nie. Limit 0,1 s = limit pętli weba (`main.ts:36248-36251`). `dt ≤ 0`/NaN → brak ruchu. Drag i kółko nie zależą od czasu (jak w webie) |
| Q3 mgła | ukrycie (`ZERO_MATRIX`) + przyciemnienie odkrytych ×0,175, z funkcji weba | `TerrainScene::set_fog` = część pryzmowa `setFog` (`scene.ts:3522-3637`) z regułą ocean-hide i cache A5; mgła/LOD brył, brzegu, lasów (`applyZoomLodDecor`, `scene.ts:3248-3407`) → `NIE_ZMIERZONO`/kolejny temat |
| Styl | tylko `roblox` (D-RR-8 = A) | gałęzie `civ`/`minecraft` pominięte |

## 2. Kamera — wyprowadzenie (plik:linia, web `edb8fb56`)

| Web | Rust (`src/camera.rs`) |
|---|---|
| `camera.ts:25` `DRAG_THRESHOLD_PX = 6` | `DRAG_THRESHOLD_PX` |
| `camera.ts:27-59` opcje; domyślne `:107-118` (`minDist 5`, `maxDist 200`, `keyPanSpeed 0,25`, `mousePanFactor 0,002`, `zoomFactor 0,12`, `edgePanZonePx 32`, `edgePanSpeed = keyPanSpeed`) | `CameraOptions` + `Default` |
| `main.ts:1903-1909` (`minDist 8/3`, `maxDist = max(320, max(W,H)·R·1,85·1,2)`, `keyPanSpeed 0,3`) | `CameraOptions::world_map` (używa `pick::camera::{MIN_DIST, max_zoom_dist}`) |
| `main.ts:1911-1929` predykaty; `camera.ts:115` `blockWheelAt ?? blockPointerAt`; `:252` brak `edgePanActive` = wyłączony | trait `InputGate` (metoda domyślna `block_wheel_at` woła `block_pointer_at`), `NoGate` |
| `camera.ts:98-127` konstruktor: `dist = |camera.position − target|` (`Vector3.length`, **bez clamp**), `target.y = 0` | `CameraController::new`; `for_world_map` = `scene.ts:3084-3085` (pozycja `(cx, d·0,9, cz + d·0,7)`, `d = max(W,H)·R·1,65`) + `mapCenter` `scene.ts:3065` |
| `camera.ts:130-144` `_syncCamera` | `position()` / `pick_camera(far)` → `PickCamera` (P4.10) |
| `camera.ts:147-151` `_pan`, `:154-161` `_zoom` (`clamp(dist·(1 + delta·zoomFactor))`) | `pan`, `zoom`, `clamp_dist` (`js_max(min, js_min(max, v))`, NaN przechodzi jak w JS) |
| `camera.ts:164-173` `mousedown`: tylko `button 0`, `blockPointerAt` | `mouse_down(button, x, y, gate)` |
| `camera.ts:175-206` `mousemove`: pozycja kursora zawsze; martwa strefa `px²+py² < 36`; start od punktu przekroczenia; `speed = dist·mousePanFactor`, `pan(−ddx·speed, −ddy·speed)` | `mouse_move` |
| `camera.ts:208` `mouseup` (dowolny przycisk), `:212-213` `blur`/`mouseleave` | `mouse_up`, `blur`, `mouse_leave` |
| `camera.ts:215-220` `wheel`: `blockWheelAt`; `dir = deltaY > 0 ? 1 : −1` | `wheel(...) -> bool` (`true` = `preventDefault`) |
| `camera.ts:222-223` klawisze `key.toLowerCase()` w `Set` | `key_down`/`key_up` (`to_lowercase`, zbiór w kolejności wstawiania) |
| `camera.ts:251-272` edge-pan (aktywny, kursor znany, bez dragu, bez bloku, wewnątrz rect, `speed = edgePanSpeed·dist/30`, rampa `(zone − m)/zone`) | `edge_pan_delta(gate, factor)` |
| `camera.ts:275-289` `update()` WASD/strzałki + edge-pan, `speed = keyPanSpeed·dist/30` | `update(dt, gate)` (× `frame_factor(dt)`, Q2) |
| `camera.ts:292-298` `focusAt` (clamp tylko gdy podano `dist`), `:301-308` `getFocusState`/`getDistLimits` | `focus_at`, `focus_state`, `dist_limits` |

Jednostki: współrzędne klienta w px CSS (`MouseEvent.clientX/Y`, `getBoundingClientRect`), `target`/`dist` w jednostkach świata (`HEX_R = 1`), `dt` w sekundach.
Kolejność operacji IEEE 754 jak w TS (np. `speed = keyPanSpeed·(dist/30)`, potem `·factor`; `factor = 1.0` nie zmienia bitów).

## 3. Teren — wyprowadzenie (plik:linia, web `edb8fb56`)

### 3.1 Pryzmy
- Warstwy: jedna `InstancedMesh` na typ terenu obecny na mapie, w kolejności `Object.values(TerenBazowy)` (`scene.ts:1768-1791`); geometria
  `hexPrismNoBottomGeo(R·1,008, vis.height)` (`scene.ts:1563-1576`, `:1774-1776`) = `CylinderGeometry(r, r, h, 6, 1)` z indeksem obciętym do początku
  grupy 2 (dolna pokrywa) i wyczyszczonymi grupami → `terrain::hex_prism_no_bottom_mesh` na `geom::cylinder_geometry` (P4.8; pozycje, normalne, UV).
  Materiał `MeshLambertMaterial({ color: styleTerrainColor(t, 'roblox'), flatShading: true })` (`scene.ts:1779-1782`, `mapRenderStyle.ts:512-522, 535-539, 555-568`).
- Wysokości: `terrainVis` (`scene.ts:166-170`) → `terrainVisualForStyle` (`mapRenderStyle.ts:226-242`, `ROBLOX_TERRAIN_VIS` `:212-223`, `TERRAIN_SURFACE_Y` `:185-194`)
  → reużyte `pick::terrain::Terrain::visual()` (P4.10). `coastalDrop = R·0,045`, gdy `landCoastSandNeeded` (`scene.ts:2252-2255`, `mapRenderStyle.ts:1257-1263`);
  `surfaceTopY = h + yOffset − coastalDrop`; środek `y = surfaceTopY − h/2`, a dla wody (`Morze`, `PlytkieMorze`) `y = seaSurfaceY − h/2`,
  `seaSurfaceY = 0,30 + (0,18 − 0,30)` (`scene.ts:2088-2089`, `:2256-2262`).
- Macierz instancji: `dummy.position(x,y,z)`, `rotation(0,0,0)`, `scale(1,1,1)`, `updateMatrix` → `setMatrixAt` do `Float32Array` (`scene.ts:2299-2303`)
  → `terrain::instance_matrix` (`Quat::from_euler_xyz` + `Mat4::compose` z `pick::three`, rzutowanie f32).
- Kolor instancji (`scene.ts:2315-2333`): `PlytkieMorze` → `new Color(0x82c8e0)`; `Laka`/`Rownina` → `LAKA_SHADES`/`ROWNINA_SHADES[floor(hash2D(q,r,seed,4242)·5) % 5]`
  (`scene.ts:206-207`, `hash2D` `:188-196`); pozostałe → `jitteredTerrainColor(blendedTerrainHex(...))` (`scene.ts:209-232`, `:484-519`).
  `THREE.Color` r169 (`math/Color.js`, `ColorManagement.js`): `setHex` = sRGB→linear, `getHSL`/`setHSL` w przestrzeni roboczej (linear, bez konwersji),
  `getHex` = linear→sRGB + `Math.round(clamp(·255))`, `lerp`, `add`, `multiplyScalar` → `terrain::color::Color`. `setColorAt` → `Float32`.

### 3.2 Bryły gór/wzgórz
- `scene.ts:2414-2430` (góra) i `:2461-2478` (wzgórze, pominięte przy `tarasy`, `improvementKeysForHex`): wariant `wariantDlaHeksa(q,r,5,seed)`, obrót
  `rotacjaDlaHeksa` (reużyte z `pick::terrain`, P4.10), pozycja `(x, h + yOffset, z)` — **bez** `coastalDrop`. Rust oddaje macierze i heksy per wariant
  (`TerrainScene::{gora, wzgorze}`); geometrie brył (`goraGeometria`/`wzgorzeGeometria`) należą do tematów modeli (RR-T4/RR-T7).

### 3.3 Plaże (brzeg roblox, FALA 141)
- Delta: `computeRiverDeltaHexKeys` (`mapRenderStyle.ts:1357-1410`; `pathReachesOpenSea` `:1335-1350`, `findRiverMouthWybrzeze` `:1283-1329`,
  `hasMorzeNeighbor` `:1275-1280`; tylko trasy `main`, brak `riverPathKinds` = `main`; scalanie ujść bliżej niż 3; stabilne sortowanie `b.score − a.score`).
  Krawędzie ujść: `computeRiverMouthEdgeKeys` (`:1716-1748`). Rust: `coast::{river_delta_hexes, river_mouth_edges}`.
- `PlytkieMorze` → `collectRobloxCoastWaterInst` (`:1520-1609`): tafla `waterPool` (poza deltą), paski `waterEdge` do każdego sąsiada `Morze`
  poza krawędzią ujścia (tylko pełny detal), `waterLagoon` + `waterTongue` na delcie. Suchy ląd przy `PlytkieMorze` → `collectRobloxLandCoastSandInst`
  (`:1612-1651`, pasy `landSand`). Pętla: `scene.ts:2520-2534`; flush 5 warstw z białym `instanceColor` i `renderOrder` 0/1/1/1/3: `scene.ts:2749-2786`;
  geometrie `getCoastSharedGeometries(lite)` (`mapRenderStyle.ts:1486-1514`) na `geom::{cylinder_geometry, box_geometry}`; materiały
  `coastWaterMaterial`/`coastSandMaterial` (`:1447-1453`, `COAST_SAND_ROBLOX` `:509`).
- `robloxLite` (`resolveRenderPreset`, `mapRenderStyle.ts:114-127`; progi `:50`, `:52`; użycie `scene.ts:1600, 2216`) → `terrain::roblox_lite`.
- `Math.hypot` (kierunek do sąsiada) = V8 `src/builtins/math.tq:398-441` (skalowanie maksimum + suma Kahana) → `coast::js_hypot`; `Math.atan2` → `f64::atan2`.

### 3.4 Tło oceanu i ramka
- `scene.ts:2997-3062`: AABB środków heksów, `OCEAN_BED_Y = 0,18 − min(28, max(14, span·0,012))`, `PlaneGeometry(Δx + 2·padO, Δz + 2·padO)` obrócona
  `x = −π/2` w `(cXb, OCEAN_BED_Y, cZb)`, `padO = max(7R, maxZoomDist·3,2, span·0,85)`; 4 listwy `BoxGeometry` na `seaTop + 0,12R`; kolory `palette.deepOcean`/`frame`
  → `TerrainScene::backdrop` (`matrixWorld` w f64 jak `Object3D`). Widoczność = wynik `set_fog` (`showOceanBackdrop`, `scene.ts:3640-3644`).

### 3.5 Mgła (`setFog`, część pryzmowa)
- `scene.ts:3522-3637`: `anyHidden` (`!visible && !explored`), `showOceanBackdrop = !anyHidden || landReveal`; zmiana kontekstu → czyszczenie cache i pełny
  przebieg; inaczej skan tylko heksów, które zmieniły przynależność do `visible` (różnica symetryczna); `sig` 0/1/2 → kolor `baseColor` / `baseColor·0,175`
  (`game/visibility.ts:31`) / `FOG_HIDDEN_COLOR = Color(0x0b0d12)` (`scene.ts:164`), macierz oryginalna lub `ZERO_MATRIX = makeScale(0,0,0)` (`scene.ts:3139`);
  pominięcie, gdy `sig` bez zmian. Na końcu ocean-hide: przy `showOceanBackdrop` **wszystkie** pryzmy wody dostają `ZERO_MATRIX` (`scene.ts:3629-3637`).
  Rust: `TerrainScene::set_fog(&visible, &explored, land_reveal) -> bool`, ten sam stan (`last_visible`, `last_sig`, `last_show_ocean`).
  Dziwactwo odtworzone: przy niezmienionym kontekście zmiana samego `explored` (bez zmiany `visible`) nie przelicza heksa (mutacja T6 pokazuje, że wektory to łapią).

### 3.6 Numeryka JS (bitowa zgodność)
- `Math.pow`: V8 12.4.254.21 (node v22.22.0) liczy `base::ieee754::pow` (`src/base/ieee754.cc:2645-2906`, SHA-256 pliku `da01a549…433a67fc`) — port fdlibm 5.3
  z odchyłką `r = (z·t1) / ((t1 − 2) − (w + z·w))` (fdlibm: `(z·t1)/(t1 − 2) − (w + z·w)`). `f64::powf` (glibc) różni się od V8 na 19 915/200 000 losowych
  wejść, czysty fdlibm na 8 866/200 000, port V8 (`terrain::jsmath::js_pow`) na **0/200 000** (skrypt scratch `powchk`, §8) i 0/6 144 w fixture.
  Bez tego 1 692 skalary terenu różniłyby się o 1 ulp f64 (mutacja T3: wszystkie „w 1e-6”, test bitowy je odrzuca).
- `Math.hypot`: V8 builtin (wyżej), 0/2 048. `Math.round`: `pick::hex::js_round` (P4.10). `Math.min/max`: `pick::three::js_min/js_max`.
- `sin/cos/atan2` (kwaterniony, cylinder): glibc vs V8 — 0 rozbieżności na tych danych (jak w P4.10); inne platformy `NIE_ZMIERZONO` (§7).

## 4. Tabela: odtworzone / pominięte

| # | Element weba | Źródło | Status | Dowód / powód |
|---|---|---|---|---|
| 1 | Drag z martwą strefą 6 px, start od progu | `camera.ts:175-206` | **odtworzone** | scen. `drag-threshold`; mutacje C2, C3 |
| 2 | Kółko, `deltaY == 0` = przybliżenie, clamp | `camera.ts:154-161, 215-220` | **odtworzone** | `wheel-clamp-blocks`; C1, C7 |
| 3 | `blockWheelAt` osobno / domyślnie `blockPointerAt` | `camera.ts:115`, `main.ts:1924` | **odtworzone** | dwa warianty scenariusza; C4 |
| 4 | WASD/strzałki, wielkość liter, przeciwne klawisze | `camera.ts:222-223, 275-289` | **odtworzone** | `keys`; C8 |
| 5 | Edge-pan: strefy, rogi, rampa, rect canvasu, blokady, drag, blur/mouseleave | `camera.ts:251-272, 212-213` | **odtworzone** | `edge-pan`, `edge-pan-offset-rect`; C5, C6 |
| 6 | `focusAt` z/bez dystansu | `camera.ts:292-298` | **odtworzone** | `focus`; C7 |
| 7 | Opcje domyślne i własne | `camera.ts:107-118` | **odtworzone** | `defaults`, `custom` |
| 8 | Krok na klatkę niezależny od FPS | `camera.ts:275-289` | **zmienione (Q2)** | `× min(dt,0,1)·60`; przy 60 FPS bitowo jak web |
| 9 | Obrót/orbit | brak w webie (`camera.ts:123`) | **brak (Q1)** | nie istnieje w źródle |
| 10 | Pryzmy 1,008R, wysokości roblox, woda na 0,18, `coastalDrop` | `scene.ts:1760-1791, 2246-2303` | **odtworzone** | 7 map bitowo; T1, T2, T10 |
| 11 | Kolory: shades, `PlytkieMorze`, blend + jitter HSL, Color r169 | `scene.ts:188-232, 484-519, 2315-2333` | **odtworzone** | base f64 + instancje f32 bitowo; T3, T7 |
| 12 | Bryły gór/wzgórz (macierze, warianty, `tarasy`) | `scene.ts:2414-2478` | **odtworzone (macierze)** | T8; geometrie brył → RR-T4/RR-T7 |
| 13 | Plaże: 5 warstw brzegu, delta, ujścia, lite | `mapRenderStyle.ts:1357-1748`, `scene.ts:2520-2534, 2749-2786` | **odtworzone** | T4, T9; mapy `*-lite`/`low`/`medium` |
| 14 | Tło oceanu + ramka | `scene.ts:2997-3062` | **odtworzone** | geometria i `matrixWorld` bitowo |
| 15 | Mgła pryzm: `ZERO_MATRIX`, ×0,175, `FOG_HIDDEN_COLOR`, ocean-hide, cache A5 | `scene.ts:3139, 3522-3637` | **odtworzone** | 16 wywołań bitowo; T5, T6, T11 |
| 16 | Mgła/LOD brył, brzegu, lasów (`applyZoomLodDecor`, `applyTerrainFog`) | `scene.ts:3248-3407` | **pominięte (Q3)** | poza zakresem → kolejny temat; `NIE_ZMIERZONO` |
| 17 | `hideDecorAtHex` (miasto: przywraca pryzm, chowa dekor) | `scene.ts:3168-3214` | **pominięte** | warstwa miast/ulepszeń; kolejny temat |
| 18 | Lasy, dżungla, oazy, wydmy, rzeki (wstęgi), dekor (`DEKOR_ENABLED=false`) | `scene.ts:1873-1930, 2343-2412, 2565-2663, 1266-1439` | **pominięte** | poza GOAL RR-T2a |
| 19 | Mgła odległości `THREE.Fog`, światła, cienie, shadery | `scene.ts:1654-1693, 3067-3074` | **pominięte** | GPU (RR-T5) |
| 20 | Ścieżka `?nobottom=0` (pełny pryzm) | `scene.ts:1595-1598, 1777` | **pominięte** | przełącznik pomiarowy, w grze zawsze `B_NO_BOTTOM` |
| 21 | Porcjowanie C3 (`c3NextFrame`) | `scene.ts:2667-2683` | **pominięte** | czas, nie dane (kolejność heksów zachowana) |

## 4a. Interfejs dla kolejnego tematu (wysyłka na GPU)

- `camera::CameraController` — zdarzenia `mouse_down/move/up`, `wheel`, `key_down/up`, `blur`, `mouse_leave`, `set_canvas_rect`, `update(dt, &gate)`, `focus_at`;
  odczyt `focus_state()`, `dist_limits()`, `pick_camera(far)` → `PickCamera::matrices(w, h)` (macierze widoku/projekcji Three, P4.10).
- `terrain::build_terrain(&TerrainInput { seed, width, height, hexes, rivers, detail })` → `TerrainScene`:
  `prisms: Vec<(Terrain, InstanceLayer)>`, `coast: Vec<(CoastLayerKind, InstanceLayer)>` (`InstanceLayer` = `geom::Mesh` + `material_color` + `flat_shading` + `render_order`
  + `matrices: Vec<[f32;16]>` + `colors: Vec<[f32;3]>` + `hexes`; `matrices_flat()`/`colors_flat()` gotowe do `queue.write_buffer`), `gora`/`wzgorze: Vec<SolidLayer>`
  (macierze per wariant), `backdrop: Option<Backdrop>` (ocean + 4 listwy, `matrixWorld` f64).
- `TerrainScene::set_fog(&visible, &explored, land_reveal) -> bool` modyfikuje w miejscu macierze i kolory pryzm (do ponownego wysłania) i zwraca widoczność tła oceanu/ramki.

## 5. Wektory testowe (wszystkie z uruchomionego kodu weba)

| Zestaw | Liczba | Wynik | Co sprawdza |
|---|---|---|---|
| `camera/camera.json` | 33 scenariusze, **6 504 zdarzenia**, 47 430 skalarów (`target.x/z`, `dist`, `camera.position` po każdym zdarzeniu; `matrixWorld` w 9 scenariuszach ręcznych) | **0 rozbieżności, bitowo** | 9 ręcznych: `drag-threshold`, `wheel-clamp-blocks` ×2 (osobny / domyślny `blockWheelAt`), `keys`, `edge-pan`, `edge-pan-offset-rect` (rect 800×600 @ (37,5; 12) i zmiana na 375×812), `focus`, `defaults`, `custom`; 24 fuzz LCG × 250 zdarzeń na mapach 9×7, 40×30, 128×80, 240×168 |
| `terrain/map_{A,A-lite,B,C,D,E,F}.json` | 7 map, **11 605 instancji** (pryzmy + bryły + brzeg), **271 747 skalarów** (geometrie, kolory materiałów, macierze i kolory instancji, kolor bazowy f64 każdego heksa, tło/ramka) + klucze, indeksy, grupy, delty, krawędzie ujść, `robloxLite` | **100% bitowo** | wszystkie 8 typów terenu, wybrzeże/morze, `tarasy`, dziury w siatce, odwrócona kolejność kluczy, ujemne `q/r`, ziarna 12345 / −42 / 2026 / 123456789 / −2147483648 / 7, detal `high`/`medium`/`low`, mapa 3 500 heksów (lite z progu 3 000), rzeki `main/medium/short/tributary` i bez `riverPathKinds` |
| — mgła | **16 wywołań `setFog`** (A: 8, B: 4, C: 2, F: 2), **80 332 skalarów** (macierze + kolory wszystkich pryzm po każdym wywołaniu) + flaga `showOceanBackdrop` | **100% bitowo** | ścieżka różnicowa, ponowne wywołanie bez zmian, zmiana kontekstu (ocean-hide ↔ brak), `landReveal`, wszystko ukryte, wszystko widoczne |
| `terrain/color.json` | 1 024 `setHex` + 2 048 `getHSL`/`setHSL` (15 360 skalarów), 2 048 `getHex`, 6 144 `Math.pow`, 2 048 `Math.hypot`, 24 presety `robloxLite` | **0 rozbieżności** | prymitywy numeryczne użyte przez kolory i brzeg |

Testy (`rust-port/renderer/tests/`): `camera_web_parity.rs` (5 testów: parytet 100%, pokrycie rodzajów zdarzeń, 3 testy Q2 — 60 FPS = jedna klatka weba, skalowanie i limit `dt`, niezależność dragu/kółka od `dt`), `terrain_web_parity.rs` (5 testów: budowa, mgła, matematyka koloru, semantyka mgły, wartości specjalne `Math.pow`). Test bitowy: każda wartość różna choćby o 1 ulp → FAIL (raport osobno liczy „w 1e-6”).

## 6. Test mutacyjny

Skrypt `mutate.py` (scratch, poza repo; wklejony w §10.3): każda mutacja na kopii pliku, `cargo test --locked --test <camera|terrain>_web_parity`, przywrócenie oryginału.

```text
C1 wheel deltaY==0 zooms out: exit=101 | test result: FAILED. 3 passed; 2 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.13s
C2 drag dead zone <= instead of <: exit=101 | test result: FAILED. 3 passed; 2 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.16s
C3 drag starts from press point (jump): exit=101 | test result: FAILED. 4 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.16s
C4 wheel ignores blockWheelAt: exit=101 | test result: FAILED. 4 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.13s
C5 edge-pan while dragging: exit=101 | test result: FAILED. 4 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.14s
C6 edge zone ramp (zone - mx) / zone -> 1: exit=101 | test result: FAILED. 4 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.16s
C7 focusAt without clamp: exit=101 | test result: FAILED. 4 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.16s
C8 keys not lower-cased: exit=101 | test result: FAILED. 4 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.13s
T1 coastalDrop 0.045 -> 0: exit=101 | TOTAL build: maps=7 instances=11605 scalars=271747 exact=269287 within1e-6=0 bad=2460 | TOTAL fog: calls=16 scalars=80332 exact=79929 within1e-6=0 bad=403 | test result: FAILED. 3 passed; 2 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.51s
T2 water prisms on own surface (no seaSurfaceY): exit=101 | TOTAL build: maps=7 instances=11605 scalars=271747 exact=270879 within1e-6=0 bad=868 | TOTAL fog: calls=16 scalars=80332 exact=80239 within1e-6=0 bad=93 | test result: FAILED. 3 passed; 2 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.55s
T3 powf instead of V8 pow: exit=101 | TOTAL build: maps=7 instances=11605 scalars=271747 exact=270055 within1e-6=1692 bad=0 | TOTAL fog: calls=16 scalars=80332 exact=80332 within1e-6=0 bad=0 | test result: FAILED. 3 passed; 2 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.41s
T4 libm hypot instead of V8 Math.hypot: exit=101 | TOTAL build: maps=7 instances=11605 scalars=271747 exact=271747 within1e-6=0 bad=0 | TOTAL fog: calls=16 scalars=80332 exact=80332 within1e-6=0 bad=0 | test result: FAILED. 4 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.57s
T5 no ocean-hide: exit=101 | TOTAL build: maps=7 instances=11605 scalars=271747 exact=271747 within1e-6=0 bad=0 | TOTAL fog: calls=16 scalars=80332 exact=76175 within1e-6=0 bad=4157 | test result: FAILED. 3 passed; 2 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.49s
T6 fog without dirty-set cache (always full pass): exit=101 | TOTAL build: maps=7 instances=11605 scalars=271747 exact=271747 within1e-6=0 bad=0 | TOTAL fog: calls=16 scalars=80332 exact=80044 within1e-6=0 bad=288 | test result: FAILED. 4 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.53s
T7 blend weight 0.18 -> 0.2: exit=101 | TOTAL build: maps=7 instances=11605 scalars=271747 exact=267009 within1e-6=4 bad=6003 | TOTAL fog: calls=16 scalars=80332 exact=78935 within1e-6=1 bad=1396 | test result: FAILED. 3 passed; 2 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.47s
T8 hill solid also on tarasy: exit=101 | TOTAL build: maps=7 instances=11717 scalars=265443 exact=265443 within1e-6=0 bad=69 | TOTAL fog: calls=16 scalars=80332 exact=80332 within1e-6=0 bad=0 | test result: FAILED. 4 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.44s
T9 delta only for main (tributary as main): exit=101 | TOTAL build: maps=7 instances=11611 scalars=256775 exact=256757 within1e-6=0 bad=66 | TOTAL fog: calls=16 scalars=80332 exact=80332 within1e-6=0 bad=0 | test result: FAILED. 4 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.53s
T10 prism radius 1.008R -> 1.0R: exit=101 | TOTAL build: maps=7 instances=11605 scalars=271747 exact=268835 within1e-6=448 bad=2464 | TOTAL fog: calls=16 scalars=80332 exact=80332 within1e-6=0 bad=0 | test result: FAILED. 4 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.50s
T11 explored brightness 0.175 -> 0.2: exit=101 | TOTAL build: maps=7 instances=11605 scalars=271747 exact=271747 within1e-6=0 bad=0 | TOTAL fog: calls=16 scalars=80332 exact=78868 within1e-6=0 bad=1464 | test result: FAILED. 3 passed; 2 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.47s
```

19/19 wykrytych. T3 i T4 przechodzą tolerancję 1e-6, ale nie test bitowy — to uzasadnia porty `Math.pow`/`Math.hypot`. Wcześniejsza wersja C7 (zamiana kolejności `max/min` w clamp) była **mutantem równoważnym** (dla `min ≤ max` i nie-NaN wynik identyczny) — zastąpiona mutacją „`focusAt` bez clamp”.

## 7. `NIE_ZMIERZONO`

1. **Wszystko, co wymaga GPU lub obrazu**: wysłanie buforów do wgpu, shadery Lambert/flatShading, `instanceColor` × kolor materiału w shaderze, mgła odległości `THREE.Fog` (`scene.ts:1654-1663, 3067-3070`), światła, cienie PCF, `renderOrder`/`polygonOffset`, przezroczystość, porównanie obrazu z webem (RR-T5/RR-T11). Ten temat oddaje tylko bufory CPU.
2. **Mgła/LOD brył gór/wzgórz, brzegu i lasów** (`applyZoomLodDecor`/`applyTerrainFog`, `scene.ts:3248-3407`; `zoomLodFlags`) — poza zakresem (Q3); w `TerrainScene` warstwy brył i brzegu mają macierze „oryginalne”. Kolejny temat.
3. **`hideDecorAtHex`** (miasto: przywraca pryzm nawet pod mgłą, chowa dekor; `scene.ts:3168-3214`) i `syncForestForUnits` — warstwa miast/ulepszeń.
4. **Geometrie brył** (`goraGeometria`/`wzgorzeGeometria`, `teren-gory-wzgorza.ts`) — nie zbudowane (RR-T4/RR-T7); w P4.10 dostępne jako fixture pickingu.
5. **Realna scena gry** (mapa z generatora, zapis gry): harness = moduły weba + oznaczone kopie fragmentów `scene.ts` (README §Adaptations); mapy testowe są syntetyczne. Weryfikacja na prawdziwym `buildScene` w przeglądarce wymaga zgody na harness Playwright.
6. **Pełna pętla klatek i kanał wejścia** (`requestAnimationFrame`, koalescencja `mousemove`, opóźnienie IPC, D-RR-10/RR-T12) — tu tylko maszyna stanów; `update(dt)` wywołuje przyszła pętla Rust.
7. **Zmiana zachowania Q2 w grze** (prędkość przesuwu przy FPS ≠ 60 różna od weba) — decyzja orkiestratora, do rewizji przez właściciela; nie mierzono odczucia.
8. **Inne platformy**: równość bitowa `sin/cos/atan2/sqrt` Rust (glibc, Linux) z V8 zmierzona tylko tutaj (0 różnic na tych danych). Windows/macOS libm — niezmierzone; `Math.pow`/`Math.hypot` są przenośne (czysty Rust).
9. **Wydajność** budowy terenu i `set_fog` na mapach 40k–320k heksów (web porcjuje budowę C3) — niezmierzona.
10. **Wejścia spoza zakresu typów**: ziarno spoza `i32` (web: `seed | 0` w hashach, `>>> 0` w LCG oaz — oazy pominięte), duplikaty heksów, `deltaY`/współrzędne NaN w zdarzeniach — nie testowane wektorami.

## 8. Pochodzenie danych referencyjnych

- Środowisko: node v22.22.0 (V8 12.4.254.21-node.33), `three@0.169.0` (integrity `sha512-Ed906MA3dR4TS5riErd4QBsRGPcx+HBDX2O5yYE5GqJeFQTPU+M56Va/f/Oph9X7uZo3W3o4l2ZhBZ6f6qUv0w==`, identyczne z `gra/package-lock.json` `edb8fb56`),
  `esbuild@0.24.0` (bundlowanie, usuwanie typów); instalacja `npm install --ignore-scripts` w osobnym katalogu scratch, skrypty uruchamiane z innego katalogu (`refscript/`),
  kod weba z `git archive edb8fb56 gra/src gra/data`. Źródła V8 do portów: `raw.githubusercontent.com/v8/v8/12.4.254.21/src/base/ieee754.cc` (SHA-256 `da01a54955911cfc550117988de91516c6f1aac343af28142dce619b433a67fc`) i `.../src/builtins/math.tq` (SHA-256 `569ff61e5bc48f6121fa57dcdaa8ba56428231a8d1091d2c5193332e4fbf18ff`).
- Komendy (pełne, `S=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p411op`):

```bash
mkdir -p $S/ref $S/websrc $S/refscript $S/out
cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0
cd /home/user/The-Game/.claude/worktrees/wf_5eb5677d-3de-1 && git archive --format=tar -o $S/websrc.tar edb8fb56 gra/src gra/data
cd $S && tar -xf websrc.tar -C websrc
bash $S/run_gen.sh camera    # stdout: camera scenarios=33 steps=6504
bash $S/run_gen.sh terrain   # stdout: terrain maps=7 instances=11605 fogCalls=16 colorCases=5120 pow=6144 hypot=2048
cp $S/out/camera/*.json  rust-port/renderer/tests/fixtures/camera/
cp $S/out/terrain/*.json rust-port/renderer/tests/fixtures/terrain/
# Math.pow: 200 000 losowych par (powchk/gen.js) vs port V8 i f64::powf
node $S/powchk/gen.js $S/powchk/pow.txt   # v8 12.4.254.21-node.33
cd $S/powchk && CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_5eb5677d-3de-1-powchk cargo run --release -- $S/powchk/pow.txt
# stdout: n=200000 port_mismatch=0 libm_mismatch=19915   (czysty fdlibm przed poprawką V8: port_mismatch=8866)
```

- Determinizm: dwa niezależne uruchomienia obu generatorów dają identyczne pliki; SHA-256 plików w repo (commit `eb30eefc`):

```text
04acf9b1ea1cbb9ee9825958fc7a34eadbaf114acf1bda8f6e9a910720a323da  rust-port/renderer/tests/fixtures/camera/README.md
0f43ae5c53904f2d52ff9ddc7e2266fd4eb2de76fa22ba414edb471003b3d1bd  rust-port/renderer/tests/fixtures/camera/camera.json
baf4b6cfbdc8008f1dcc1f5752be6374d4b64bcf2e0ae7c9750b47c7f0f1a207  rust-port/renderer/tests/fixtures/camera/gen.ts
9d625d60073b955a53685d0dcc5ef4e63efe750439f52ec885dc172bf6ffdcd4  rust-port/renderer/tests/fixtures/terrain/README.md
e1425d294f8a7711dca32a5fff8ec282e2ada658dcda06eb40f91594b45b7af6  rust-port/renderer/tests/fixtures/terrain/color.json
214fe929e8c2480c3a08be31608d4e5a053fd66d95933a0d5feba7baa8f4056e  rust-port/renderer/tests/fixtures/terrain/gen.ts
c79c2f686ed7868a6908c8af1d5f890b9c4e52e776aad4b1e2329b7ffe290e4e  rust-port/renderer/tests/fixtures/terrain/map_A-lite.json
0bf24c5a0f5b00807b2f6e931f1bae68fd56707bbbc3c379e6ee060601cd239e  rust-port/renderer/tests/fixtures/terrain/map_A.json
2606c5c0c9dfb200952a91a932b64cbfd60df0c608c81ed8a7e363f528c2c666  rust-port/renderer/tests/fixtures/terrain/map_B.json
b0259c292e6268c596daa8b07dbd3e9704f04cc6b25528d87dbdadf1a59b1053  rust-port/renderer/tests/fixtures/terrain/map_C.json
5776010028d312cb5bef433d1ebc2f8a2bccc6bbad66e25ef4005b97812492b5  rust-port/renderer/tests/fixtures/terrain/map_D.json
7adf68117517dcafb3f3a4512a435dc6ae57a4d8d4b2d00468752c09a46c3a3e  rust-port/renderer/tests/fixtures/terrain/map_E.json
dac2b8afbb8913630dfa4ba44c0a1b008c98dfe1116076533325e7785efb8663  rust-port/renderer/tests/fixtures/terrain/map_F.json
```

## 9. Surowe logi bramek (commit `eb30eefc`, `cd rust-port/renderer`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_5eb5677d-3de-1`)

Pełne wyjście skryptu `gates.sh` (§10.4), bez skrótów:

```text
$ git rev-parse HEAD
eb30eefce4807e48fdeb0b8b0d285b5fee8a1764
$ cargo fmt --all -- --check
EXIT=0
$ cargo clippy --locked --all-targets --features gpu -- -D warnings
    Finished `dev` profile [unoptimized] target(s) in 0.11s
EXIT=0
$ cargo clippy --locked --all-targets -- -D warnings
    Finished `dev` profile [unoptimized] target(s) in 0.04s
EXIT=0
$ cargo test --locked --all-targets
    Finished `test` profile [unoptimized] target(s) in 0.07s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-1/debug/deps/civ_renderer-d95024f3ec20cfd9)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_nturns.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-1/debug/deps/assets_nturns-7ff94d6b0438d2d1)

running 6 tests
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
test new_game_frees_everything_and_restarts_identically ... ok
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
[LeakM2 small 40x25] turn= 50 buffer=36 texture=306 pipeline=3 bind_group=9 live_bytes=9458944 subscriptions=1 created=712 destroyed=358
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
test leak_m3_also_retains_battle_scene_resources ... ok
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM2 small 40x25] turn=200 buffer=36 texture=1206 pipeline=3 bind_group=9 live_bytes=24204544 subscriptions=1 created=2760 destroyed=1506
[LeakM2 small 40x25] turn 50 violations: live texture: baseline=67 current=306 allowed=67; live bytes: baseline=5543168 current=9458944 allowed=5543168
[LeakM2 small 40x25] turn 200 violations: live texture: baseline=67 current=1206 allowed=67; live bytes: baseline=5543168 current=24204544 allowed=5543168
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[Fixed large 96x60] turn= 50 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=2337 destroyed=2134
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM3 small 40x25] turn 50 violations: live buffer: baseline=68 current=196 allowed=68; live texture: baseline=9 current=17 allowed=9; live bind_group: baseline=11 current=19 allowed=11; live bytes: baseline=6722816 current=15373568 allowed=6722816; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 small 40x25] turn 200 violations: live buffer: baseline=68 current=676 allowed=68; live texture: baseline=9 current=47 allowed=9; live bind_group: baseline=11 current=49 allowed=11; live bytes: baseline=6722816 current=47813888 allowed=6722816; subscriptions: baseline=5 current=81 allowed=5
[LeakM1 large 96x60] turn= 10 buffer=714 texture=25 pipeline=3 bind_group=106 live_bytes=7547008 subscriptions=1 created=1126 destroyed=278
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[Fixed large 96x60] turn=200 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=8826 destroyed=8623
[Fixed large 96x60] budget OK at turns [50, 200]
test fixed_registry_stays_within_budget_after_10_50_200_turns ... ok
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
test simulation_is_deterministic ... ok
[LeakM1 large 96x60] turn=200 buffer=9552 texture=25 pipeline=3 bind_group=1579 live_bytes=33000448 subscriptions=1 created=16718 destroyed=5559
[LeakM1 large 96x60] turn 50 violations: live buffer: baseline=714 current=2502 allowed=714; live bind_group: baseline=106 current=404 allowed=106; live bytes: baseline=7547008 current=12696448 allowed=7547008
[LeakM1 large 96x60] turn 200 violations: live buffer: baseline=714 current=9552 allowed=714; live bind_group: baseline=106 current=1579 allowed=106; live bytes: baseline=7547008 current=33000448 allowed=7547008
[LeakM2 large 96x60] turn= 10 buffer=148 texture=265 pipeline=3 bind_group=27 live_bytes=9737216 subscriptions=1 created=637 destroyed=194
[LeakM2 large 96x60] turn= 50 buffer=148 texture=1224 pipeline=3 bind_group=27 live_bytes=25449472 subscriptions=1 created=2336 destroyed=934
[rebuild 1000 cycles] start: turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55 destroyed=0
[rebuild 1000 cycles] end:   turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55055 destroyed=55000
test rebuild_in_place_1000_cycles_returns_to_initial_state ... ok
[LeakM2 large 96x60] turn=200 buffer=148 texture=4815 pipeline=3 bind_group=27 live_bytes=84284416 subscriptions=1 created=8817 destroyed=3824
[LeakM2 large 96x60] turn 50 violations: live texture: baseline=265 current=1224 allowed=265; live bytes: baseline=9737216 current=25449472 allowed=9737216
[LeakM2 large 96x60] turn 200 violations: live texture: baseline=265 current=4815 allowed=265; live bytes: baseline=9737216 current=84284416 allowed=9737216
[LeakM3 large 96x60] turn= 10 buffer=180 texture=27 pipeline=3 bind_group=29 live_bytes=7967744 subscriptions=5 created=637 destroyed=398
[LeakM3 large 96x60] turn= 50 buffer=308 texture=35 pipeline=3 bind_group=37 live_bytes=16618496 subscriptions=21 created=2337 destroyed=1954
[LeakM3 large 96x60] turn=200 buffer=788 texture=65 pipeline=3 bind_group=67 live_bytes=49058816 subscriptions=81 created=8826 destroyed=7903
[LeakM3 large 96x60] turn 50 violations: live buffer: baseline=180 current=308 allowed=180; live texture: baseline=27 current=35 allowed=27; live bind_group: baseline=29 current=37 allowed=29; live bytes: baseline=7967744 current=16618496 allowed=7967744; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 large 96x60] turn 200 violations: live buffer: baseline=180 current=788 allowed=180; live texture: baseline=27 current=65 allowed=27; live bind_group: baseline=29 current=67 allowed=29; live bytes: baseline=7967744 current=49058816 allowed=7967744; subscriptions: baseline=5 current=81 allowed=5
test each_leak_pattern_breaks_the_budget ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.06s

     Running tests/assets_registry.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-1/debug/deps/assets_registry-ee54812c049c2745)

running 14 tests
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok
test cache_lru_by_entries_and_bytes ... ok
test handle_from_another_registry_is_rejected ... ok
test budget_thresholds_are_configurable ... ok
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test live_report_lists_labels ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test reference_counting_frees_on_last_release ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test owned_guards_count_references ... ok
test scope_releases_everything_it_created_on_drop ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test subscriptions_unregister_on_drop ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/camera_web_parity.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-1/debug/deps/camera_web_parity-96e1465f8bdd64b3)

running 5 tests
test drag_and_wheel_do_not_depend_on_dt ... ok
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok
test fixture_covers_every_branch ... ok
test camera_controller_matches_web_100_percent ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/cpu_sanity.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-1/debug/deps/cpu_sanity-7ee07d9f2002230a)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/geom_three_parity.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-1/debug/deps/geom_three_parity-ab6f7952892f0505)

running 17 tests
test merge_rejects_mixed_indexing ... ok
test index_buffer_covers_non_indexed_meshes ... ok
test parity_circle ... ok
test parity_cone ... ok
test parity_curve ... ok
test parity_cylinder ... ok
test parity_box ... ok
test parity_plane ... ok
test parity_ring ... ok
test parity_ops ... ok
test parity_extrude ... ok
test parity_shape ... ok
test parity_torus ... ok
test parity_polyhedron ... ok
test trs_matches_manual_composition ... ok
test parity_tube ... ok
test parity_sphere ... ok

test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/gpu_probe.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-1/debug/deps/gpu_probe-08e2d2a6c2a7bdae)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pick_golden.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-1/debug/deps/pick_golden-b6b94fb9d9c318d1)

running 7 tests
test client_rect_to_ndc_matches_web ... ok
test js_round_matches_math_round ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test world_to_axial_both_variants_match_web ... ok
test terrain_scene_instances_are_bitwise_web ... ok
test camera_matrices_and_rays_are_bitwise_three ... ok
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.51s

     Running tests/terrain_web_parity.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-1/debug/deps/terrain_web_parity-5b12acf27f4f9ccd)

running 5 tests
test js_pow_special_cases_follow_v8 ... ok
test fog_hides_unknown_and_dims_explored ... ok
test color_math_matches_three ... ok
test terrain_build_matches_web ... ok
test terrain_fog_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.19s

EXIT=0
$ cargo test --locked --test camera_web_parity --test terrain_web_parity -- --nocapture --test-threads=1
    Finished `test` profile [unoptimized] target(s) in 0.03s
     Running tests/camera_web_parity.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-1/debug/deps/camera_web_parity-96e1465f8bdd64b3)

running 5 tests
test camera_controller_matches_web_100_percent ... camera parity: scenarios=33 steps=6504 scalars=47430 mismatches=0
ok
test drag_and_wheel_do_not_depend_on_dt ... ok
test fixture_covers_every_branch ... ok
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s

     Running tests/terrain_web_parity.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-1/debug/deps/terrain_web_parity-5b12acf27f4f9ccd)

running 5 tests
test color_math_matches_three ... color: getHex cases=2048 mismatches=0; Math.pow cases=6144 mismatches=0; Math.hypot cases=2048 mismatches=0; preset cases=24 mismatches=0: scalars=15360 exact=15360 within1e-6=0 bad=0
ok
test fog_hides_unknown_and_dims_explored ... ok
test js_pow_special_cases_follow_v8 ... ok
test terrain_build_matches_web ... map A build (instances 159): scalars=7888 exact=7888 within1e-6=0 bad=0
map A-lite build (instances 126): scalars=6871 exact=6871 within1e-6=0 bad=0
map B build (instances 186): scalars=7955 exact=7955 within1e-6=0 bad=0
map C build (instances 1802): scalars=42162 exact=42162 within1e-6=0 bad=0
map D build (instances 3783): scalars=82699 exact=82699 within1e-6=0 bad=0
map E build (instances 4817): scalars=105234 exact=105234 within1e-6=0 bad=0
map F build (instances 732): scalars=18938 exact=18938 within1e-6=0 bad=0
TOTAL build: maps=7 instances=11605 scalars=271747 exact=271747 within1e-6=0 bad=0
ok
test terrain_fog_matches_web ... map A fog (8 calls): scalars=9576 exact=9576 within1e-6=0 bad=0
map B fog (4 calls): scalars=8056 exact=8056 within1e-6=0 bad=0
map C fog (2 calls): scalars=45600 exact=45600 within1e-6=0 bad=0
map F fog (2 calls): scalars=17100 exact=17100 within1e-6=0 bad=0
TOTAL fog: calls=16 scalars=80332 exact=80332 within1e-6=0 bad=0
ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.48s

EXIT=0
```

## 10. Skrypty referencyjne (identyczne z uruchomionymi)

### 10.1 Generator kamery

`rust-port/renderer/tests/fixtures/camera/gen.ts`

```ts
// R-RUSTPORT-P4-11-CAMERA-TERRAIN-CPU-Q1 — generator of camera-controller reference vectors.
//
// Run ONLY outside the repository (scratch dir), see README.md. The esbuild bundle links:
//  - three@0.169.0 (npm, version pinned by gra/package-lock.json),
//  - the web module `render/camera.ts` (CameraController, DRAG_THRESHOLD_PX) and
//    `render/hexutil.ts` (HEX_R, mapCenter) from `git archive edb8fb56 gra/src`,
//    IMPORTED UNCHANGED (not rewritten),
//  - copies of two fragments that cannot be imported without DOM/WebGL, marked
//    `// LITERAL <file>:<lines>` (same logic and arithmetic, TS types removed):
//    main.ts:1903-1909 (cameraControllerOpts: minDist/maxDist/keyPanSpeed) and
//    scene.ts:3084-3085 (initial camera position before the controller).
// The DOM is replaced by stubs that only REGISTER the listeners camera.ts adds in
// `_bind()` (camera.ts:225-234); the script then calls exactly those listeners with
// synthetic events, i.e. the real handlers run.
// Output: camera.json in the directory given as argv[2].

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CameraController, DRAG_THRESHOLD_PX } from '../websrc/gra/src/render/camera';
import { HEX_R, mapCenter } from '../websrc/gra/src/render/hexutil';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node gen.mjs <outdir>');
fs.mkdirSync(OUT, { recursive: true });

type Handler = (e: any) => void;
function makeTarget() {
  const map = new Map<string, Handler>();
  return {
    map,
    addEventListener(type: string, h: Handler) { map.set(type, h); },
    removeEventListener(type: string) { map.delete(type); },
  };
}

interface Rect { left: number; top: number; width: number; height: number }
interface Gate { block: Rect | null; wheelBlock: Rect | null | undefined; edge: boolean }
const inRect = (r: Rect | null | undefined, x: number, y: number) =>
  !!r && x >= r.left && y >= r.top && x < r.left + r.width && y < r.top + r.height;

interface Scenario {
  name: string;
  W: number; H: number;
  /** 'game' = main.ts options; 'default' = constructor defaults; 'custom' = explicit options */
  opts: 'game' | 'default' | 'custom';
  custom?: any;
  rect: Rect;
  /** true: blockWheelAt given separately (main.ts); false: defaults to blockPointerAt */
  separateWheel: boolean;
  steps: any[];
}

function run(sc: Scenario) {
  const win = makeTarget();
  const doc = makeTarget();
  const canvas: any = makeTarget();
  let rect = { ...sc.rect };
  canvas.getBoundingClientRect = () => ({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top });
  (globalThis as any).window = win;
  (globalThis as any).document = doc;

  const R = HEX_R;
  const center = mapCenter(sc.W, sc.H, R);
  // LITERAL scene.ts:3078-3085 (roblox branch of camDist; fov/aspect do not influence the controller)
  const camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.5, 5000);
  const camDist = Math.max(sc.W, sc.H) * R * 1.65;
  camera.position.set(center.x, camDist * 0.9, center.z + camDist * 0.7);
  camera.lookAt(center.x, 0, center.z);

  const gate: Gate = { block: null, wheelBlock: undefined, edge: false };
  const blockPointerAt = (x: number, y: number) => inRect(gate.block, x, y);
  const blockWheelAt = (x: number, y: number) => inRect(gate.wheelBlock ?? null, x, y);
  let opts: any;
  if (sc.opts === 'game') {
    // LITERAL main.ts:1903-1909 + 1911-1929 (predicates replaced by the scripted gate)
    const mapSpan = Math.max(sc.W, sc.H) * HEX_R * 1.85;
    const maxDist = Math.max(320, mapSpan * 1.2);
    opts = {
      minDist: 8 / 3,
      maxDist,
      keyPanSpeed: 0.3,
      blockPointerAt,
      edgePanActive: () => gate.edge,
    };
    if (sc.separateWheel) opts.blockWheelAt = blockWheelAt;
  } else if (sc.opts === 'default') {
    opts = { blockPointerAt, edgePanActive: () => gate.edge };
    if (sc.separateWheel) opts.blockWheelAt = blockWheelAt;
  } else {
    opts = { ...sc.custom, blockPointerAt, edgePanActive: () => gate.edge };
    if (sc.separateWheel) opts.blockWheelAt = blockWheelAt;
  }
  const ctrl: any = new CameraController(camera, canvas, center, opts);
  // matrixWorld is recorded for the hand-written scenarios only (fuzz: target, dist and
  // position; the matrices are a pure function of them, proven bit-exact in P4-10).
  const withWorld = !sc.name.startsWith('fuzz');
  const snap = () => {
    camera.updateMatrixWorld(true);
    const st = ctrl.getFocusState();
    const o: any = {
      tx: st.x, tz: st.z, d: st.dist,
      p: [camera.position.x, camera.position.y, camera.position.z],
    };
    if (withWorld) o.w = Array.from(camera.matrixWorld.elements);
    return o;
  };
  const out: any = {
    name: sc.name, W: sc.W, H: sc.H, opts: sc.opts, custom: sc.custom ?? null,
    separateWheel: sc.separateWheel, rect: sc.rect,
    center: [center.x, center.z], initPos: [camera.position.x, camera.position.y, camera.position.z],
    limits: ctrl.getDistLimits(),
    init: snap(),
    steps: [] as any[],
  };
  // the constructor already moved the camera; initPos above is AFTER _syncCamera, so
  // also record the pre-controller position (scene.ts:3085) for the Rust constructor:
  out.scenePos = [center.x, camDist * 0.9, center.z + camDist * 0.7];
  for (const s of sc.steps) {
    const ev = (o: any) => ({ preventDefault() {}, ...o });
    switch (s.k) {
      case 'down': canvas.map.get('mousedown')!(ev({ button: s.b ?? 0, clientX: s.x, clientY: s.y })); break;
      case 'move': win.map.get('mousemove')!(ev({ clientX: s.x, clientY: s.y })); break;
      case 'up': win.map.get('mouseup')!(ev({ button: s.b ?? 0, clientX: s.x ?? 0, clientY: s.y ?? 0 })); break;
      case 'wheel': canvas.map.get('wheel')!(ev({ clientX: s.x, clientY: s.y, deltaY: s.dy })); break;
      case 'kd': win.map.get('keydown')!(ev({ key: s.key })); break;
      case 'ku': win.map.get('keyup')!(ev({ key: s.key })); break;
      case 'blur': win.map.get('blur')!(ev({})); break;
      case 'leave': doc.map.get('mouseleave')!(ev({})); break;
      case 'frame': ctrl.update(); break;
      case 'focus': if (s.d === undefined) ctrl.focusAt(s.x, s.z); else ctrl.focusAt(s.x, s.z, s.d); break;
      case 'edge': gate.edge = s.on; break;
      case 'block': gate.block = s.r; break;
      case 'wblock': gate.wheelBlock = s.r; break;
      case 'rect': rect = { ...s.r }; break;
      default: throw new Error('bad step ' + s.k);
    }
    out.steps.push({ s, st: snap() });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Scenarios: hand-written edge cases + LCG fuzz.
function lcg(seed: number) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const VP: Rect = { left: 0, top: 0, width: 1280, height: 720 };
const VP2: Rect = { left: 37.5, top: 12, width: 800, height: 600 };
const scenarios: Scenario[] = [];

// 1. Drag dead zone: 5.9 px no pan, 6 px arms without jump, then pan.
scenarios.push({ name: 'drag-threshold', W: 40, H: 30, opts: 'game', rect: VP, separateWheel: true, steps: [
  { k: 'down', x: 600, y: 300 }, { k: 'move', x: 605.9, y: 300 }, { k: 'move', x: 600, y: 305.9 },
  { k: 'move', x: 604.2, y: 304.2 }, { k: 'move', x: 606, y: 300 }, { k: 'move', x: 640, y: 330 },
  { k: 'move', x: 500, y: 100 }, { k: 'up' }, { k: 'move', x: 400, y: 100 },
  { k: 'down', x: 100, y: 100 }, { k: 'move', x: 103.6, y: 104.8 }, { k: 'move', x: 50, y: 60 }, { k: 'up' },
  { k: 'down', x: 10, y: 10, b: 2 }, { k: 'move', x: 300, y: 300 }, { k: 'up', b: 2 },
  { k: 'down', x: 10, y: 10, b: 1 }, { k: 'move', x: 30, y: 300 },
  { k: 'down', x: 200, y: 200 }, { k: 'move', x: 200, y: 194 }, { k: 'move', x: 220, y: 150 }, { k: 'up', b: 2 },
  { k: 'move', x: 300, y: 150 },
] });
// 2. Wheel: zoom in/out, deltaY 0 = zoom in, clamp at min and max, blocks.
{
  const steps: any[] = [];
  for (let i = 0; i < 40; i++) steps.push({ k: 'wheel', x: 640, y: 360, dy: -100 });
  steps.push({ k: 'wheel', x: 640, y: 360, dy: 0 });
  for (let i = 0; i < 80; i++) steps.push({ k: 'wheel', x: 640, y: 360, dy: 53 });
  steps.push({ k: 'wheel', x: 640, y: 360, dy: -0.0001 });
  steps.push({ k: 'block', r: { left: 0, top: 0, width: 300, height: 720 } });
  steps.push({ k: 'wheel', x: 100, y: 360, dy: -100 });
  steps.push({ k: 'wheel', x: 400, y: 360, dy: -100 });
  steps.push({ k: 'wblock', r: { left: 1000, top: 0, width: 280, height: 720 } });
  steps.push({ k: 'wheel', x: 100, y: 360, dy: -100 });
  steps.push({ k: 'wheel', x: 1100, y: 360, dy: -100 });
  steps.push({ k: 'down', x: 100, y: 100 });
  steps.push({ k: 'move', x: 200, y: 200 });
  steps.push({ k: 'down', x: 500, y: 100 });
  steps.push({ k: 'move', x: 520, y: 100 });
  steps.push({ k: 'move', x: 560, y: 120 });
  steps.push({ k: 'up' });
  scenarios.push({ name: 'wheel-clamp-blocks', W: 12, H: 9, opts: 'game', rect: VP, separateWheel: true, steps });
  scenarios.push({ name: 'wheel-default-gate', W: 12, H: 9, opts: 'game', rect: VP, separateWheel: false, steps });
}
// 3. Keys: WASD / arrows / upper case / opposite keys / key-up.
scenarios.push({ name: 'keys', W: 64, H: 36, opts: 'game', rect: VP, separateWheel: true, steps: [
  { k: 'frame' }, { k: 'kd', key: 'w' }, { k: 'frame' }, { k: 'frame' }, { k: 'kd', key: 'D' }, { k: 'frame' },
  { k: 'kd', key: 'ArrowDown' }, { k: 'frame' }, { k: 'ku', key: 'W' }, { k: 'frame' }, { k: 'ku', key: 'arrowdown' },
  { k: 'frame' }, { k: 'kd', key: 'ArrowLeft' }, { k: 'frame' }, { k: 'kd', key: 'a' }, { k: 'frame' }, { k: 'ku', key: 'd' },
  { k: 'frame' }, { k: 'ku', key: 'ArrowLeft' }, { k: 'frame' }, { k: 'ku', key: 'a' }, { k: 'frame' },
  { k: 'kd', key: 'ArrowUp' }, { k: 'kd', key: 's' }, { k: 'frame' }, { k: 'kd', key: 'x' }, { k: 'frame' },
  { k: 'wheel', x: 10, y: 10, dy: 1 }, { k: 'frame' }, { k: 'ku', key: 's' }, { k: 'frame' }, { k: 'blur' }, { k: 'frame' },
  { k: 'ku', key: 'ArrowUp' }, { k: 'frame' },
] });
// 4. Edge pan: zones, corners, linear ramp, inactive, outside rect, blocked, dragging, blur/leave.
{
  const steps: any[] = [{ k: 'move', x: 5, y: 360 }, { k: 'frame' }, { k: 'edge', on: true }];
  const pts = [[5, 360], [0, 360], [31.999, 360], [32, 360], [16, 16], [1279, 719], [1280, 720], [1280.5, 360], [-0.5, 360],
    [640, 0], [640, 719.5], [1250, 360], [1248, 3], [640, 360], [20.25, 700.75]];
  for (const [x, y] of pts) { steps.push({ k: 'move', x, y }); steps.push({ k: 'frame' }); steps.push({ k: 'frame' }); }
  steps.push({ k: 'move', x: 5, y: 5 }, { k: 'blur' }, { k: 'frame' }, { k: 'move', x: 6, y: 6 }, { k: 'frame' });
  steps.push({ k: 'leave' }, { k: 'frame' }, { k: 'move', x: 1275, y: 700 }, { k: 'frame' });
  steps.push({ k: 'block', r: { left: 1200, top: 600, width: 80, height: 120 } }, { k: 'frame' }, { k: 'block', r: null }, { k: 'frame' });
  steps.push({ k: 'down', x: 1275, y: 700 }, { k: 'frame' }, { k: 'move', x: 1270, y: 690 }, { k: 'frame' }, { k: 'up' }, { k: 'frame' });
  steps.push({ k: 'kd', key: 'a' }, { k: 'frame' }, { k: 'ku', key: 'a' }, { k: 'edge', on: false }, { k: 'frame' });
  scenarios.push({ name: 'edge-pan', W: 40, H: 30, opts: 'game', rect: VP, separateWheel: true, steps });
  scenarios.push({ name: 'edge-pan-offset-rect', W: 40, H: 30, opts: 'game', rect: VP2, separateWheel: true,
    steps: steps.map((s) => (s.k === 'move' ? { ...s, x: s.x * 0.625 + 37.5, y: s.y * 0.833 + 12 } : s))
      .concat([{ k: 'edge', on: true }, { k: 'rect', r: { left: 0, top: 0, width: 375, height: 812 } }, { k: 'move', x: 370, y: 400 }, { k: 'frame' }]) });
}
// 5. focusAt with/without dist, clamp.
scenarios.push({ name: 'focus', W: 9, H: 7, opts: 'game', rect: VP, separateWheel: true, steps: [
  { k: 'focus', x: 3.5, z: -2.25 }, { k: 'focus', x: 10, z: 10, d: 22 }, { k: 'focus', x: 0, z: 0, d: 0.5 },
  { k: 'focus', x: -7.125, z: 100.75, d: 99999 }, { k: 'focus', x: 1e-9, z: -1e-9, d: 8 }, { k: 'wheel', x: 1, y: 1, dy: -1 },
] });
// 6. Constructor defaults and custom options.
scenarios.push({ name: 'defaults', W: 20, H: 15, opts: 'default', rect: VP, separateWheel: false, steps: [
  { k: 'wheel', x: 1, y: 1, dy: 1 }, { k: 'kd', key: 'd' }, { k: 'frame' }, { k: 'edge', on: true }, { k: 'move', x: 1279, y: 1 },
  { k: 'frame' }, { k: 'down', x: 600, y: 600 }, { k: 'move', x: 700, y: 650 }, { k: 'move', x: 720, y: 640 }, { k: 'up' },
  { k: 'ku', key: 'd' }, { k: 'frame' },
] });
scenarios.push({ name: 'custom', W: 20, H: 15, opts: 'custom', rect: VP2, separateWheel: true,
  custom: { minDist: 3, maxDist: 50, keyPanSpeed: 0.7, mousePanFactor: 0.0035, zoomFactor: 0.2, edgePanZonePx: 48, edgePanSpeed: 1.3 },
  steps: [{ k: 'edge', on: true }, { k: 'move', x: 40, y: 20 }, { k: 'frame' }, { k: 'kd', key: 'w' }, { k: 'frame' },
    { k: 'wheel', x: 300, y: 300, dy: -3 }, { k: 'frame' }, { k: 'down', x: 300, y: 300 }, { k: 'move', x: 330, y: 280 },
    { k: 'move', x: 380, y: 260 }, { k: 'up' }, { k: 'frame' }] });
// 7. LCG fuzz: random event streams on several maps / viewports.
const KEYS = ['w', 'a', 's', 'd', 'W', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'q', 'Shift'];
const fuzzMaps: Array<[number, number, Rect]> = [[9, 7, VP], [40, 30, VP2], [128, 80, VP], [240, 168, { left: 0, top: 56, width: 375, height: 812 }]];
for (let fi = 0; fi < 24; fi++) {
  const rnd = lcg(1000 + fi * 7919);
  const [W, H, rect] = fuzzMaps[fi % fuzzMaps.length]!;
  const steps: any[] = [];
  const rx = () => rect.left - 20 + rnd() * (rect.width + 40);
  const ry = () => rect.top - 20 + rnd() * (rect.height + 40);
  for (let i = 0; i < 250; i++) {
    const p = rnd();
    if (p < 0.30) steps.push({ k: 'move', x: rnd() < 0.3 ? Math.round(rx()) : rx(), y: rnd() < 0.3 ? Math.round(ry()) : ry() });
    else if (p < 0.38) steps.push({ k: 'down', x: rx(), y: ry(), b: rnd() < 0.85 ? 0 : 2 });
    else if (p < 0.44) steps.push({ k: 'up' });
    else if (p < 0.54) steps.push({ k: 'wheel', x: rx(), y: ry(), dy: rnd() < 0.5 ? -100 * rnd() : 100 * rnd() });
    else if (p < 0.62) steps.push({ k: 'kd', key: KEYS[Math.floor(rnd() * KEYS.length)]! });
    else if (p < 0.70) steps.push({ k: 'ku', key: KEYS[Math.floor(rnd() * KEYS.length)]! });
    else if (p < 0.92) steps.push({ k: 'frame' });
    else if (p < 0.94) steps.push({ k: 'edge', on: rnd() < 0.7 });
    else if (p < 0.955) steps.push({ k: 'block', r: rnd() < 0.5 ? null : { left: rect.left, top: rect.top, width: rect.width * 0.3, height: rect.height } });
    else if (p < 0.97) steps.push({ k: 'wblock', r: rnd() < 0.5 ? null : { left: rect.left + rect.width * 0.7, top: rect.top, width: rect.width * 0.3, height: rect.height } });
    else if (p < 0.98) steps.push({ k: rnd() < 0.5 ? 'blur' : 'leave' });
    else steps.push({ k: 'focus', x: rnd() * W * 1.7, z: rnd() * H * 1.5, d: rnd() < 0.5 ? undefined : rnd() * 400 });
  }
  scenarios.push({ name: `fuzz-${fi}`, W, H, opts: 'game', rect, separateWheel: fi % 3 !== 0, steps });
}

const results = scenarios.map(run);
let nSteps = 0;
for (const r of results) nSteps += r.steps.length;
fs.writeFileSync(path.join(OUT, 'camera.json'), JSON.stringify({
  generator: 'tests/fixtures/camera/gen.ts', three: THREE.REVISION, dragThresholdPx: DRAG_THRESHOLD_PX, scenarios: results,
}));
console.log(`camera scenarios=${results.length} steps=${nSteps}`);
```

### 10.2 Generator terenu

`rust-port/renderer/tests/fixtures/terrain/gen.ts`

```ts
// R-RUSTPORT-P4-11-CAMERA-TERRAIN-CPU-Q1 — generator of terrain-mesh reference vectors.
//
// Run ONLY outside the repository (scratch dir), see README.md. The esbuild bundle links:
//  - three@0.169.0 (npm, version pinned by gra/package-lock.json),
//  - web modules from `git archive edb8fb56 gra/src gra/data`, IMPORTED UNCHANGED:
//    render/mapRenderStyle.ts (styleTerrainColor, terrainVisualForStyle, landCoastSandNeeded,
//    findLandCoastSandCandidates, coast instance collectors and shared geometries,
//    computeRiverDeltaHexKeys, computeRiverMouthEdgeKeys, resolveRenderPreset,
//    normalizeMapRenderOptions, styleScenePalette), render/teren-gory-wzgorza.ts
//    (wariantDlaHeksa, rotacjaDlaHeksa, LICZBA_WARIANTOW_TERENU), render/hexutil.ts,
//    game/terrain-improvements.ts (improvementKeysForHex), game/visibility.ts
//    (FOG_EXPLORED_BRIGHTNESS), types/hex.ts;
//  - copies of buildScene fragments that cannot be imported (scene.ts needs DOM/WebGL),
//    each marked `// LITERAL scene.ts:<lines>`. LITERAL = same logic and arithmetic in the
//    same order, NOT a character copy: TS types removed, comments removed, only the
//    `roblox` branch of every `renderStyle`/`useStyledDecor`/`styledTerrain` test kept
//    (styledTerrain = true, B_NO_BOTTOM = true), DEKOR_ENABLED=false branch dropped
//    (it is `false` in the web), forests/rivers/oases/dunes/decor and every
//    material/shadow/scene.add/performance/progress statement removed.
//    Full list: README.md §Adaptations.
// Output: JSON files in the directory given as argv[2].

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TerenBazowy } from '../websrc/gra/src/types/hex';
import {
  styleTerrainColor, terrainVisualForStyle, landCoastSandNeeded, findLandCoastSandCandidates,
  createCoastInstBuffers, getCoastSharedGeometries, collectRobloxCoastWaterInst,
  collectRobloxLandCoastSandInst, computeRiverDeltaHexKeys, computeRiverMouthEdgeKeys,
  coastWaterMaterial, coastSandMaterial, resolveRenderPreset, normalizeMapRenderOptions,
  styleScenePalette,
} from '../websrc/gra/src/render/mapRenderStyle';
import { axialToWorld, HEX_R } from '../websrc/gra/src/render/hexutil';
import { wariantDlaHeksa, rotacjaDlaHeksa, LICZBA_WARIANTOW_TERENU } from '../websrc/gra/src/render/teren-gory-wzgorza';
import { improvementKeysForHex } from '../websrc/gra/src/game/terrain-improvements';
import { FOG_EXPLORED_BRIGHTNESS } from '../websrc/gra/src/game/visibility';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node gen.mjs <outdir>');
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// LITERAL scene.ts:138-147 (only to keep terrainVis literal; the civ spec is ignored by
// terrainVisualForStyle in the roblox style, mapRenderStyle.ts:231)
const TERRAIN_VISUALS: any = {
  [TerenBazowy.Morze]: { color: 0x1f5a86, height: 0.30, yOffset: 0.00 },
  [TerenBazowy.PlytkieMorze]: { color: 0x46a3d6, height: 0.35, yOffset: 0.05 },
  [TerenBazowy.Laka]: { color: 0x6aa53f, height: 0.40, yOffset: 0.05 },
  [TerenBazowy.Rownina]: { color: 0xa9b257, height: 0.45, yOffset: 0.08 },
  [TerenBazowy.Pustynia]: { color: 0xd9c179, height: 0.42, yOffset: 0.08 },
  [TerenBazowy.Wzgorza]: { color: 0x4f7d34, height: 0.55, yOffset: 0.10 },
  [TerenBazowy.Gory]: { color: 0x9aa1a9, height: 0.60, yOffset: 0.20 },
  [TerenBazowy.Polarny]: { color: 0xe8eef5, height: 0.38, yOffset: 0.06 },
};
// LITERAL scene.ts:164
const FOG_HIDDEN_COLOR = new THREE.Color(0x0b0d12);
// LITERAL scene.ts:166-170
function terrainVis(t: any, renderStyle: any) {
  const civ = TERRAIN_VISUALS[t];
  const spec = terrainVisualForStyle(t, renderStyle, civ);
  return { color: civ.color, height: spec.height, yOffset: spec.yOffset };
}
// LITERAL scene.ts:188-196
function hash2D(q: number, r: number, seed: number, salt: number): number {
  let h = (Math.imul(q | 0, 0x27d4eb2d) ^ Math.imul(r | 0, 0x165667b1) ^ Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(salt | 0, 0x85ebca6b)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39) >>> 0;
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
// LITERAL scene.ts:206-207
const LAKA_SHADES = [0x54923a, 0x5f9e42, 0x6cab4f, 0x79b85c, 0x86c469] as const;
const ROWNINA_SHADES = [0x9ac968, 0xa6d074, 0xb4dc84, 0xc0e693, 0xcaec9f] as const;
// LITERAL scene.ts:209-232
function jitteredTerrainColor(baseHex: number, q: number, r: number, seed: number, isWater: boolean): THREE.Color {
  const c = new THREE.Color(baseHex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  const nH = hash2D(q, r, seed, 101) - 0.5;
  const nS = hash2D(q, r, seed, 202) - 0.5;
  const nL = hash2D(q, r, seed, 303) - 0.5;
  const hueAmt = isWater ? 0.010 : 0.022;
  const satAmt = isWater ? 0.05 : 0.10;
  const litAmt = isWater ? 0.030 : 0.060;
  let h = hsl.h + nH * hueAmt;
  h = h - Math.floor(h);
  const s = Math.max(0, Math.min(1, hsl.s + nS * satAmt));
  const l = Math.max(0, Math.min(1, hsl.l + nL * litAmt));
  c.setHSL(h, s, l);
  return c;
}
// LITERAL scene.ts:476-478
const HEX_NEIGHBORS: ReadonlyArray<readonly [number, number]> = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
// LITERAL scene.ts:484-519 (renderStyle fixed to 'roblox' by the caller)
function blendedTerrainHex(map: any, q: number, r: number, baseHex: number, isWater: boolean, renderStyle: any = 'civ', selfTeren?: any): number {
  const base = new THREE.Color(baseHex);
  const acc = new THREE.Color(0, 0, 0);
  let n = 0;
  for (const [dq, dr] of HEX_NEIGHBORS) {
    const nb = map.hexes[`${q + dq},${r + dr}`];
    if (!nb) continue;
    if (selfTeren && isDryLandTeren(selfTeren) && !isDryLandTeren(nb.terenBazowy)) continue;
    if (selfTeren === TerenBazowy.PlytkieMorze && isDryLandTeren(nb.terenBazowy)) continue;
    const nbHex = renderStyle === 'civ' ? TERRAIN_VISUALS[nb.terenBazowy].color : styleTerrainColor(nb.terenBazowy, renderStyle);
    acc.add(new THREE.Color(nbHex));
    n++;
  }
  if (n === 0) return baseHex;
  acc.multiplyScalar(1 / n);
  base.lerp(acc, isWater ? 0.07 : 0.18);
  return base.getHex();
}
// LITERAL scene.ts:578-580
function isDryLandTeren(tb: any): boolean {
  return tb !== TerenBazowy.Morze && tb !== TerenBazowy.PlytkieMorze;
}
// LITERAL scene.ts:1563-1576
function hexPrismNoBottomGeo(radius: number, height: number, radial = 6): THREE.CylinderGeometry {
  const g = new THREE.CylinderGeometry(radius, radius, height, radial, 1);
  const idx = g.getIndex();
  if (idx) {
    const bottom = g.groups.find((gr) => gr.materialIndex === 2);
    if (bottom) {
      const arr = idx.array as Uint16Array | Uint32Array;
      const kept = arr.slice(0, bottom.start);
      g.setIndex(new THREE.BufferAttribute(kept, 1));
      g.clearGroups();
    }
  }
  return g;
}

const geoDump = (g: THREE.BufferGeometry) => ({
  pos: Array.from(g.attributes.position!.array as Float32Array),
  nor: Array.from(g.attributes.normal!.array as Float32Array),
  uv: Array.from(g.attributes.uv!.array as Float32Array),
  idx: g.index ? Array.from(g.index.array as any) : null,
  groups: g.groups.map((gr) => [gr.start, gr.count, gr.materialIndex ?? 0]),
});
const colorDump = (c: THREE.Color) => [c.r, c.g, c.b];

// ---------------------------------------------------------------------------
interface HexSpec { q: number; r: number; t: any; tarasy?: boolean }
interface MapSpec {
  name: string; seed: number; W: number; H: number; hexes: HexSpec[];
  rivers: Array<{ path: Array<[number, number]>; kind?: string }>;
  kindsGiven: boolean;
  mapDetailQuality: 'low' | 'medium' | 'high';
  fog: Array<{ visible: string[] | 'ALL'; explored: string[] | 'ALL'; landReveal?: boolean }>;
}

function buildTerrain(spec: MapSpec) {
  const map: any = { seed: spec.seed, szerokoscQ: spec.W, wysokoscR: spec.H, hexes: {} as Record<string, any> };
  for (const h of spec.hexes) {
    map.hexes[`${h.q},${h.r}`] = { coords: { q: h.q, r: h.r }, terenBazowy: h.t, ulepszenia: h.tarasy ? ['tarasy'] : undefined };
  }
  map.riverPaths = spec.rivers.map((p) => p.path.map(([q, r]) => ({ q, r })));
  if (spec.kindsGiven) map.riverPathKinds = spec.rivers.map((p) => p.kind ?? 'main');
  // LITERAL scene.ts:1590-1611 (only what the terrain uses)
  const renderOptions = normalizeMapRenderOptions({ style: 'roblox', mapDetailQuality: spec.mapDetailQuality } as any);
  const renderStyle = renderOptions.style;
  const hexCount = Object.keys(map.hexes).length;
  const preset = resolveRenderPreset(renderOptions, hexCount);
  const robloxLite = preset.robloxLite;
  const palette = styleScenePalette(renderStyle);
  const useStyledDecor = renderStyle !== 'civ';
  const R = HEX_R;
  // LITERAL scene.ts:1702-1754 (terrain / mountain / hill counters only)
  const NW = LICZBA_WARIANTOW_TERENU;
  const styledTerrain = useStyledDecor && renderStyle === 'roblox';
  const countByTerrain: any = {};
  const goraVarCount: number[] = new Array(NW).fill(0);
  const wzgorzeVarCount: number[] = new Array(NW).fill(0);
  for (const hex of Object.values(map.hexes) as any[]) {
    const t = hex.terenBazowy;
    countByTerrain[t] = (countByTerrain[t] ?? 0) + 1;
    if (t === TerenBazowy.Gory) { if (styledTerrain) goraVarCount[wariantDlaHeksa(hex.coords.q, hex.coords.r, NW, map.seed)]!++; }
    if (t === TerenBazowy.Wzgorza) { if (styledTerrain) wzgorzeVarCount[wariantDlaHeksa(hex.coords.q, hex.coords.r, NW, map.seed)]!++; }
  }
  // LITERAL scene.ts:1760-1794
  const instancedMeshes: THREE.InstancedMesh[] = [];
  const terrainPickKeys = new Map<THREE.InstancedMesh, string[]>();
  const terrainMaterials: any = {};
  const terrainIndex: any = {};
  const terrainTypes = Object.values(TerenBazowy);
  for (const t of terrainTypes) {
    const cnt = countByTerrain[t] ?? 0;
    if (cnt === 0) continue;
    const vis = terrainVis(t, renderStyle);
    const hexR = renderStyle === 'roblox' ? R * 1.008 : R * 0.998;
    const geo = hexPrismNoBottomGeo(hexR, vis.height);
    const mat = new THREE.MeshLambertMaterial({ color: styleTerrainColor(t, renderStyle), flatShading: palette.flatShading });
    terrainMaterials[t] = mat;
    const mesh = new THREE.InstancedMesh(geo, mat, cnt);
    mesh.frustumCulled = false;
    instancedMeshes.push(mesh);
    terrainIndex[t] = instancedMeshes.length - 1;
  }
  const terrainInstanceIdx: any = {};
  for (const t of terrainTypes) terrainInstanceIdx[t] = 0;
  // LITERAL scene.ts:1852-1871 (solid geometries replaced by a 1-vertex stub: only the
  // instance matrices are exported; the solid geometries belong to the model topics)
  const goraInst: THREE.InstancedMesh[] = [];
  const wzgorzeInst: THREE.InstancedMesh[] = [];
  const goraHexKey: string[][] = [];
  const goraOrigMatrix: THREE.Matrix4[][] = [];
  const goraIdx: number[] = [];
  const wzgorzeHexKey: string[][] = [];
  const wzgorzeOrigMatrix: THREE.Matrix4[][] = [];
  const wzgorzeIdx: number[] = [];
  const stubGeo = new THREE.BufferGeometry();
  if (styledTerrain) {
    for (let v = 0; v < NW; v++) {
      const gm = new THREE.InstancedMesh(stubGeo, undefined as any, Math.max(1, goraVarCount[v]!));
      gm.count = 0;
      goraInst.push(gm); goraHexKey.push([]); goraOrigMatrix.push([]); goraIdx.push(0);
      const wm = new THREE.InstancedMesh(stubGeo, undefined as any, Math.max(1, wzgorzeVarCount[v]!));
      wm.count = 0;
      wzgorzeInst.push(wm); wzgorzeHexKey.push([]); wzgorzeOrigMatrix.push([]); wzgorzeIdx.push(0);
    }
  }
  // LITERAL scene.ts:2047-2049, 2078, 2088-2101
  const hexInstance = new Map<string, { mesh: THREE.InstancedMesh; index: number; baseColor: THREE.Color }>();
  const hexOrigMatrix = new Map<string, THREE.Matrix4>();
  const hexTeren = new Map<string, any>();
  const dummy = new THREE.Object3D();
  const seaVisEarly = terrainVis(TerenBazowy.Morze, renderStyle);
  const seaSurfaceY = seaVisEarly.height + seaVisEarly.yOffset;
  const deltaHexKeys = renderStyle === 'roblox' ? computeRiverDeltaHexKeys(map) : new Set<string>();
  const cachedMouthEdges = renderStyle === 'roblox' ? computeRiverMouthEdgeKeys(map) : undefined;
  const landCoastSandKeys = (useStyledDecor && renderStyle === 'roblox') ? new Set(findLandCoastSandCandidates(map)) : null;
  const coastInstBuf: any = useStyledDecor && renderStyle === 'roblox' ? createCoastInstBuffers() : null;
  const coastInstMeshes: THREE.InstancedMesh[] = [];
  const coastInstHexKey: string[][] = [];
  const coastInstOrig: THREE.Matrix4[][] = [];
  const blendedDump: any[] = [];
  // LITERAL scene.ts:2213-2216, 2246-2263, 2294-2339, 2414-2430, 2461-2478, 2520-2534
  const c3Hexes = Object.values(map.hexes) as any[];
  const c3Total = c3Hexes.length;
  const coastCollectLite = robloxLite;
  for (let c3i = 0; c3i < c3Total; c3i++) {
    const hex = c3Hexes[c3i]!;
    const t = hex.terenBazowy;
    const vis = terrainVis(t, renderStyle);
    const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, R);
    const coastalDrop = (renderStyle === 'roblox' && landCoastSandNeeded(map, hex.coords.q, hex.coords.r, t)) ? R * 0.045 : 0;
    const surfaceTopY = vis.height + vis.yOffset - coastalDrop;
    let y = surfaceTopY - vis.height / 2;
    let scaleY = 1;
    if (renderStyle === 'roblox' && !isDryLandTeren(t)) {
      y = seaSurfaceY - vis.height / 2;
    }
    const hexKey = `${hex.coords.q},${hex.coords.r}`;
    const meshIdx = terrainIndex[t];
    const iIdx = terrainInstanceIdx[t] ?? 0;
    if (meshIdx !== undefined) {
      const mesh = instancedMeshes[meshIdx]!;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, scaleY, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(iIdx, dummy.matrix);
      let pickKeys = terrainPickKeys.get(mesh);
      if (!pickKeys) { pickKeys = []; terrainPickKeys.set(mesh, pickKeys); }
      pickKeys[iIdx] = hexKey;
      hexOrigMatrix.set(hexKey, dummy.matrix.clone());
      hexTeren.set(hexKey, t);
      const isCoastRoblox = t === TerenBazowy.PlytkieMorze && renderStyle === 'roblox';
      const isWater = !isDryLandTeren(t);
      const baseTerrainHex = styleTerrainColor(t, renderStyle);
      const blendedHex = isCoastRoblox ? baseTerrainHex : blendedTerrainHex(map, hex.coords.q, hex.coords.r, baseTerrainHex, isWater, renderStyle, t);
      const shades = styledTerrain ? (t === TerenBazowy.Laka ? LAKA_SHADES : t === TerenBazowy.Rownina ? ROWNINA_SHADES : null) : null;
      const baseColor = isCoastRoblox
        ? new THREE.Color(baseTerrainHex)
        : shades !== null
          ? new THREE.Color(shades[Math.floor(hash2D(hex.coords.q, hex.coords.r, map.seed, 4242) * shades.length) % shades.length]!)
          : jitteredTerrainColor(blendedHex, hex.coords.q, hex.coords.r, map.seed, isWater);
      mesh.setColorAt(iIdx, baseColor);
      hexInstance.set(hexKey, { mesh, index: iIdx, baseColor });
      blendedDump.push({ key: hexKey, blended: blendedHex, base: colorDump(baseColor) });
      terrainInstanceIdx[t] = iIdx + 1;
    }
    if (t === TerenBazowy.Gory) {
      const topY = vis.height + vis.yOffset;
      const q = hex.coords.q, r = hex.coords.r;
      if (styledTerrain) {
        const v = wariantDlaHeksa(q, r, NW, map.seed);
        dummy.position.set(x, topY, z);
        dummy.rotation.set(0, rotacjaDlaHeksa(q, r, map.seed), 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        const gm = goraInst[v]!;
        const gi = goraIdx[v]!;
        gm.setMatrixAt(gi, dummy.matrix);
        goraHexKey[v]![gi] = hexKey;
        goraOrigMatrix[v]![gi] = dummy.matrix.clone();
        goraIdx[v] = gi + 1;
      }
    }
    if (t === TerenBazowy.Wzgorza) {
      const baseY = vis.height + vis.yOffset;
      const q = hex.coords.q, r = hex.coords.r;
      const hillLayers = improvementKeysForHex(hex);
      if (styledTerrain && !hillLayers.includes('tarasy')) {
        const v = wariantDlaHeksa(q, r, NW, map.seed);
        dummy.position.set(x, baseY, z);
        dummy.rotation.set(0, rotacjaDlaHeksa(q, r, map.seed), 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        const wm = wzgorzeInst[v]!;
        const wi = wzgorzeIdx[v]!;
        wm.setMatrixAt(wi, dummy.matrix);
        wzgorzeHexKey[v]![wi] = hexKey;
        wzgorzeOrigMatrix[v]![wi] = dummy.matrix.clone();
        wzgorzeIdx[v] = wi + 1;
      }
    }
    if (useStyledDecor && renderStyle === 'roblox' && t === TerenBazowy.PlytkieMorze && coastInstBuf) {
      const hexQ = hex.coords.q;
      const hexR = hex.coords.r;
      const isDelta = deltaHexKeys.has(hexKey);
      collectRobloxCoastWaterInst(coastInstBuf, map, hexQ, hexR, x, z, seaSurfaceY, R, hexKey,
        { lite: coastCollectLite, isDelta, mouthEdges: cachedMouthEdges }, dummy);
    } else if (useStyledDecor && renderStyle === 'roblox' && landCoastSandKeys?.has(hexKey) && coastInstBuf) {
      collectRobloxLandCoastSandInst(coastInstBuf, map, hex.coords.q, hex.coords.r, x, z, surfaceTopY, R, hexKey, robloxLite, dummy);
    }
  }
  // LITERAL scene.ts:2693-2703, 2721-2728
  for (const t of terrainTypes) {
    const meshIdx = terrainIndex[t];
    const used = terrainInstanceIdx[t] ?? 0;
    if (meshIdx === undefined || used === 0) continue;
    instancedMeshes[meshIdx]!.count = used;
  }
  for (let v = 0; v < goraInst.length; v++) {
    goraInst[v]!.count = goraIdx[v]!;
    terrainPickKeys.set(goraInst[v]!, goraHexKey[v]!);
    wzgorzeInst[v]!.count = wzgorzeIdx[v]!;
    terrainPickKeys.set(wzgorzeInst[v]!, wzgorzeHexKey[v]!);
  }
  // LITERAL scene.ts:2749-2786
  const coastLayersDump: any[] = [];
  if (coastInstBuf) {
    const coastGeo = getCoastSharedGeometries(robloxLite);
    const waterMat = coastWaterMaterial();
    const sandMat = coastSandMaterial();
    const _coastWhite = new THREE.Color(1, 1, 1);
    const flushCoastLayer = (name: string, slots: any[], geo: THREE.BufferGeometry, mat: THREE.MeshLambertMaterial, renderOrder: number): void => {
      if (slots.length === 0) return;
      const mesh = new THREE.InstancedMesh(geo, mat, slots.length);
      mesh.frustumCulled = false;
      mesh.renderOrder = renderOrder;
      const keys: string[] = [];
      const orig: THREE.Matrix4[] = [];
      for (let i = 0; i < slots.length; i++) {
        mesh.setMatrixAt(i, slots[i]!.matrix);
        keys[i] = slots[i]!.hexKey;
        orig[i] = slots[i]!.matrix;
      }
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(slots.length * 3), 3);
      for (let i = 0; i < slots.length; i++) mesh.setColorAt(i, _coastWhite);
      coastInstMeshes.push(mesh);
      coastInstHexKey.push(keys);
      coastInstOrig.push(orig);
      coastLayersDump.push({
        layer: name, renderOrder, count: mesh.count, geo: geoDump(geo), mat: colorDump(mat.color), flat: mat.flatShading,
        m: Array.from(mesh.instanceMatrix.array), c: Array.from(mesh.instanceColor!.array), keys,
      });
    };
    flushCoastLayer('waterPool', coastInstBuf.waterPool, coastGeo.pool, waterMat, 0);
    flushCoastLayer('waterEdge', coastInstBuf.waterEdge, coastGeo.waterEdge, waterMat, 1);
    flushCoastLayer('waterLagoon', coastInstBuf.waterLagoon, coastGeo.lagoon, waterMat, 1);
    flushCoastLayer('waterTongue', coastInstBuf.waterTongue, coastGeo.tongue, waterMat, 1);
    flushCoastLayer('landSand', coastInstBuf.landSand, coastGeo.landSand, sandMat, 3);
  }
  // LITERAL scene.ts:2997-3054 (ocean backdrop + frame; materials reduced to their colour)
  const mapMaxDim = Math.max(map.szerokoscQ, map.wysokoscR);
  const mapSpanForCam = mapMaxDim * R * 1.85;
  const maxZoomDist = Math.max(320, mapSpanForCam * 1.2);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const hex of Object.values(map.hexes) as any[]) {
    const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, R);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const seaVis = terrainVis(TerenBazowy.Morze, renderStyle);
  const seaTop = seaVis.height + seaVis.yOffset;
  const mapSpanBounds = Math.max(maxX - minX, maxZ - minZ);
  const OCEAN_BACKDROP_DEPTH = Math.min(28, Math.max(14, mapSpanBounds * 0.012));
  const OCEAN_BED_Y = seaTop - OCEAN_BACKDROP_DEPTH;
  const padO = Math.max(R * 7, maxZoomDist * 3.2, mapSpanBounds * 0.85);
  const padF = R * 1.4;
  const cXb = (minX + maxX) / 2, cZb = (minZ + maxZ) / 2;
  const oceanGeo = new THREE.PlaneGeometry((maxX - minX) + padO * 2, (maxZ - minZ) + padO * 2);
  const oceanMat = new THREE.MeshLambertMaterial({ color: palette.deepOcean, depthWrite: true, fog: false });
  const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
  oceanMesh.rotation.x = -Math.PI / 2;
  oceanMesh.renderOrder = -10;
  oceanMesh.position.set(cXb, OCEAN_BED_Y, cZb);
  const frameMat = new THREE.MeshLambertMaterial({ color: palette.frame, fog: false });
  const frameMeshes: THREE.Mesh[] = [];
  const fx0 = minX - padF, fx1 = maxX + padF, fz0 = minZ - padF, fz1 = maxZ + padF;
  const frameBarH = R * 0.6, frameBarT = R * 0.7, frameY = seaTop + R * 0.12;
  const addBar = (w: number, d: number, px: number, pz: number) => {
    const g = new THREE.BoxGeometry(w, frameBarH, d);
    const m = new THREE.Mesh(g, frameMat);
    m.position.set(px, frameY, pz);
    frameMeshes.push(m);
  };
  const spanX = (fx1 - fx0) + frameBarT * 2;
  addBar(spanX, frameBarT, (fx0 + fx1) / 2, fz0 - frameBarT / 2);
  addBar(spanX, frameBarT, (fx0 + fx1) / 2, fz1 + frameBarT / 2);
  addBar(frameBarT, (fz1 - fz0), fx0 - frameBarT / 2, (fz0 + fz1) / 2);
  addBar(frameBarT, (fz1 - fz0), fx1 + frameBarT / 2, (fz0 + fz1) / 2);
  oceanMesh.updateMatrixWorld(true);
  for (const m of frameMeshes) m.updateMatrixWorld(true);

  // dump of the build result
  const prismDump = instancedMeshes.map((m) => {
    const t = terrainTypes.find((tt) => terrainIndex[tt] !== undefined && instancedMeshes[terrainIndex[tt]] === m)!;
    return {
      t, count: m.count, geo: geoDump(m.geometry), mat: colorDump((m.material as THREE.MeshLambertMaterial).color),
      flat: (m.material as THREE.MeshLambertMaterial).flatShading,
      m: Array.from(m.instanceMatrix.array.slice(0, m.count * 16)), c: Array.from(m.instanceColor!.array.slice(0, m.count * 3)),
      keys: terrainPickKeys.get(m)!.slice(0, m.count),
    };
  });
  const solidDump = (arr: THREE.InstancedMesh[], keys: string[][]) => arr.map((m, v) => ({
    v, count: m.count, m: Array.from(m.instanceMatrix.array.slice(0, m.count * 16)), keys: keys[v]!.slice(0, m.count),
  }));
  const build = {
    robloxLite, hexCount,
    deltaKeys: [...deltaHexKeys].sort(), mouthEdges: [...(cachedMouthEdges ?? [])].sort(),
    sandKeys: [...(landCoastSandKeys ?? [])],
    prisms: prismDump, blended: blendedDump,
    gora: solidDump(goraInst, goraHexKey), wzgorze: solidDump(wzgorzeInst, wzgorzeHexKey),
    coast: coastLayersDump,
    backdrop: {
      bedY: OCEAN_BED_Y, ocean: { geo: geoDump(oceanGeo), world: Array.from(oceanMesh.matrixWorld.elements), mat: colorDump(oceanMat.color) },
      frame: frameMeshes.map((m) => ({ geo: geoDump(m.geometry), world: Array.from(m.matrixWorld.elements) })), frameMat: colorDump(frameMat.color),
    },
  };

  // ---------------------------------------------------------------------------
  // LITERAL scene.ts:3139, 3221-3235, 3522-3637 (prism part of setFog: colours, matrices,
  // dirty-set cache, ocean-hide). Dropped: decor (dekorRefByHex is empty: DEKOR_ENABLED=false),
  // ocean/frame visibility (exported as the `show` flag), scene.background/fog,
  // applyZoomLodDecor (solids/coast fog — out of scope, NIE_ZMIERZONO), shadow flags, timing.
  const ZERO_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);
  let lastFogVisible: Set<string> | null = null;
  let lastFogExplored: Set<string> | null = null;
  const lastFogSig = new Map<string, number>();
  let lastFogShowOceanBackdrop: boolean | null = null;
  function setFog(visible: Set<string>, explored: Set<string>, opts?: { landReveal?: boolean }): boolean {
    const prevVisible = lastFogVisible;
    lastFogVisible = visible;
    lastFogExplored = explored;
    const landReveal = opts?.landReveal ?? false;
    const isHidden = (k: string) => !visible.has(k) && !explored.has(k);
    const touchedMeshes = new Set<THREE.InstancedMesh>();
    let anyHidden = false;
    for (const [key] of hexInstance) {
      if (isHidden(key)) { anyHidden = true; break; }
    }
    const showOceanBackdropNow = !anyHidden || landReveal;
    const contextChanged = showOceanBackdropNow !== lastFogShowOceanBackdrop;
    if (contextChanged) {
      lastFogSig.clear();
      lastFogShowOceanBackdrop = showOceanBackdropNow;
    }
    let keysToScan: Iterable<string>;
    if (contextChanged || prevVisible === null) {
      keysToScan = hexInstance.keys();
    } else {
      const changed = new Set<string>();
      for (const k of visible) if (!prevVisible.has(k)) changed.add(k);
      for (const k of prevVisible) if (!visible.has(k)) changed.add(k);
      keysToScan = changed;
    }
    for (const key of keysToScan) {
      const entry = hexInstance.get(key);
      if (entry === undefined) continue;
      const sig = visible.has(key) ? 0 : explored.has(key) ? 1 : 2;
      if (lastFogSig.get(key) === sig) continue;
      const { mesh, index, baseColor } = entry;
      let color: THREE.Color;
      if (sig === 0) color = baseColor.clone();
      else if (sig === 1) color = baseColor.clone().multiplyScalar(FOG_EXPLORED_BRIGHTNESS);
      else color = FOG_HIDDEN_COLOR.clone();
      mesh.setColorAt(index, color);
      if (sig === 2) mesh.setMatrixAt(index, ZERO_MATRIX);
      else { const orig = hexOrigMatrix.get(key); if (orig) mesh.setMatrixAt(index, orig); }
      lastFogSig.set(key, sig);
      touchedMeshes.add(mesh);
    }
    const showOceanBackdrop = showOceanBackdropNow;
    if (renderStyle === 'roblox' && showOceanBackdrop) {
      for (const [key, entry] of hexInstance) {
        const teren = hexTeren.get(key);
        if (teren === undefined || isDryLandTeren(teren)) continue;
        entry.mesh.setMatrixAt(entry.index, ZERO_MATRIX);
        touchedMeshes.add(entry.mesh);
      }
    }
    return showOceanBackdrop;
  }
  const allKeys = Object.keys(map.hexes);
  const fogDump: any[] = [];
  for (const call of spec.fog) {
    const vis = new Set(call.visible === 'ALL' ? allKeys : call.visible);
    const exp = new Set(call.explored === 'ALL' ? allKeys : call.explored);
    const show = setFog(vis, exp, { landReveal: call.landReveal ?? false });
    fogDump.push({
      call: { visible: [...vis], explored: [...exp], landReveal: call.landReveal ?? false }, show,
      prisms: instancedMeshes.map((m) => ({ m: Array.from(m.instanceMatrix.array.slice(0, m.count * 16)), c: Array.from(m.instanceColor!.array.slice(0, m.count * 3)) })),
    });
  }
  return {
    name: spec.name, seed: spec.seed, W: spec.W, H: spec.H, mapDetailQuality: spec.mapDetailQuality,
    hexes: spec.hexes.map((h) => [h.q, h.r, h.t, h.tarasy ? 1 : 0]),
    rivers: spec.rivers.map((p) => ({ path: p.path, kind: spec.kindsGiven ? (p.kind ?? 'main') : null })),
    build, fog: fogDump,
  };
}

// ---------------------------------------------------------------------------
// Test maps
function lcg(seed: number) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const T: Record<string, any> = {
  M: TerenBazowy.Morze, P: TerenBazowy.PlytkieMorze, L: TerenBazowy.Laka, R: TerenBazowy.Rownina,
  D: TerenBazowy.Pustynia, W: TerenBazowy.Wzgorza, G: TerenBazowy.Gory, O: TerenBazowy.Polarny,
};
function fromRows(rows: string[], dq = 0, dr = 0): HexSpec[] {
  const out: HexSpec[] = [];
  for (let r = 0; r < rows.length; r++) for (let q = 0; q < rows[r]!.length; q++) {
    const ch = rows[r]![q]!;
    if (ch === '.') continue;
    out.push({ q: q + dq, r: r + dr, t: T[ch.toUpperCase()]!, tarasy: ch === 'w' });
  }
  return out;
}
const keysOf = (hs: HexSpec[], pred: (h: HexSpec) => boolean) => hs.filter(pred).map((h) => `${h.q},${h.r}`);

// noise-like random map: elevation from summed sines (deterministic), terrain by thresholds
function randomMap(name: string, seed: number, W: number, H: number, rseed: number, q0 = 0, r0 = 0) {
  const rnd = lcg(rseed);
  const ph = [rnd() * 6.283, rnd() * 6.283, rnd() * 6.283, rnd() * 6.283];
  const fr = [0.11 + rnd() * 0.1, 0.07 + rnd() * 0.1, 0.23 + rnd() * 0.1];
  const hexes: HexSpec[] = [];
  const elev = new Map<string, number>();
  for (let r = 0; r < H; r++) for (let q = 0; q < W; q++) {
    const e = 0.5 * Math.sin(q * fr[0]! + ph[0]!) + 0.4 * Math.cos(r * fr[1]! + ph[1]!) + 0.3 * Math.sin((q + r) * fr[2]! + ph[2]!) + (rnd() - 0.5) * 0.25;
    const m = Math.sin(q * 0.31 + r * 0.17 + ph[3]!);
    let t: any;
    if (e < -0.35) t = TerenBazowy.Morze;
    else if (e < -0.18) t = TerenBazowy.PlytkieMorze;
    else if (e > 0.72) t = TerenBazowy.Gory;
    else if (e > 0.5) t = TerenBazowy.Wzgorza;
    else if (r < 2 || r >= H - 2) t = TerenBazowy.Polarny;
    else t = m > 0.4 ? TerenBazowy.Pustynia : m > -0.2 ? TerenBazowy.Rownina : TerenBazowy.Laka;
    const qq = q + q0, rr = r + r0;
    elev.set(`${qq},${rr}`, e);
    hexes.push({ q: qq, r: rr, t, tarasy: t === TerenBazowy.Wzgorza && rnd() < 0.2 });
  }
  // rivers: downhill walks from high land until water
  const rivers: Array<{ path: Array<[number, number]>; kind?: string }> = [];
  const kinds = ['main', 'main', 'medium', 'short', 'tributary'];
  const byKey = new Map(hexes.map((h) => [`${h.q},${h.r}`, h]));
  for (let i = 0; i < Math.max(3, Math.floor(W * H / 120)); i++) {
    const start = hexes[Math.floor(rnd() * hexes.length)]!;
    if (!isDryLandTeren(start.t)) continue;
    const path: Array<[number, number]> = [[start.q, start.r]];
    let cur = start;
    for (let s = 0; s < 40; s++) {
      let best: HexSpec | null = null; let be = Infinity;
      for (const [dq, dr] of HEX_NEIGHBORS) {
        const nb = byKey.get(`${cur.q + dq},${cur.r + dr}`);
        if (!nb || path.some(([a, b]) => a === nb.q && b === nb.r)) continue;
        const e = elev.get(`${nb.q},${nb.r}`)! + rnd() * 0.05;
        if (e < be) { be = e; best = nb; }
      }
      if (!best) break;
      path.push([best.q, best.r]);
      cur = best;
      if (!isDryLandTeren(cur.t)) break;
    }
    rivers.push({ path, kind: kinds[Math.floor(rnd() * kinds.length)] });
  }
  return { name, seed, W, H, hexes, rivers };
}

const maps: MapSpec[] = [];
{
  // A: 9x7 hand-made, all 8 terrains, coast + sea, two rivers to the sea (delta / mouth edges)
  const hexes = fromRows([
    'MMMMMMMMM',
    'MPPPPPPMM',
    'PLRDLWGPM',
    'PLwGGWLRP',
    'PDRWGLOLP',
    'MPLRWDLPM',
    'MMPPPPPMM',
  ]);
  const rivers = [
    { path: [[5, 4], [5, 5], [5, 6]] as Array<[number, number]>, kind: 'main' },
    { path: [[3, 3], [2, 4], [1, 4], [0, 4]] as Array<[number, number]>, kind: 'main' },
    { path: [[6, 2], [7, 2]] as Array<[number, number]>, kind: 'tributary' },
    { path: [[2, 2], [2, 1]] as Array<[number, number]>, kind: 'main' },
  ];
  const vis = keysOf(hexes, (h) => h.q >= 2 && h.q <= 5 && h.r >= 1 && h.r <= 4);
  const vis2 = keysOf(hexes, (h) => h.q >= 4 && h.r >= 3);
  const ex2 = [...new Set([...vis, ...vis2])];
  maps.push({ name: 'A', seed: 12345, W: 9, H: 7, hexes, rivers, kindsGiven: true, mapDetailQuality: 'high', fog: [
    { visible: vis, explored: vis },
    { visible: vis2, explored: ex2 },
    { visible: vis2, explored: ex2 },
    { visible: 'ALL', explored: 'ALL' },
    { visible: vis, explored: ex2 },
    { visible: vis, explored: ex2, landReveal: true },
    { visible: [], explored: ex2 },
    { visible: [], explored: [] },
  ] });
  // A-lite: same map, low detail (robloxLite) and no riverPathKinds (all 'main')
  maps.push({ name: 'A-lite', seed: 12345, W: 9, H: 7, hexes, rivers, kindsGiven: false, mapDetailQuality: 'low', fog: [] });
}
{
  // B: 12x9 pseudo-random (as P4-10), negative seed, holes, reversed key order, terraces
  const rnd = lcg(777);
  const all = Object.values(TerenBazowy);
  const hexes: HexSpec[] = [];
  for (let r = 0; r < 9; r++) for (let q = 0; q < 12; q++) {
    if ((q === 5 && r === 4) || (q === 0 && r === 8)) continue;
    const t = all[Math.floor(rnd() * all.length)]!;
    hexes.push({ q, r, t, tarasy: t === TerenBazowy.Wzgorza && q === 7 });
  }
  hexes.reverse();
  const vis = keysOf(hexes, (h) => (h.q + h.r) % 3 !== 0);
  maps.push({ name: 'B', seed: -42, W: 12, H: 9, hexes, rivers: [{ path: [[3, 3], [3, 4], [3, 5], [2, 6]] }], kindsGiven: false,
    mapDetailQuality: 'high', fog: [
      { visible: vis, explored: vis }, { visible: 'ALL', explored: 'ALL' }, { visible: vis.slice(0, 20), explored: vis },
      { visible: vis.slice(10, 40), explored: vis, landReveal: true }] });
}
{
  const c = randomMap('C', 2026, 40, 30, 4242);
  const vis = keysOf(c.hexes, (h) => (h.q - 20) ** 2 + (h.r - 15) ** 2 < 70);
  const ex = keysOf(c.hexes, (h) => (h.q - 18) ** 2 + (h.r - 14) ** 2 < 160);
  maps.push({ ...c, kindsGiven: true, mapDetailQuality: 'high', fog: [{ visible: vis, explored: [...new Set([...vis, ...ex])] }, { visible: 'ALL', explored: 'ALL' }] });
  const d = randomMap('D', 123456789, 64, 36, 99, -10, -5);
  maps.push({ ...d, kindsGiven: true, mapDetailQuality: 'medium', fog: [] });
  const e = randomMap('E', -2147483648, 70, 50, 31337);
  maps.push({ ...e, kindsGiven: true, mapDetailQuality: 'medium', fog: [] }); // 3500 hexes > 3000 → lite
  const f = randomMap('F', 7, 25, 18, 5);
  maps.push({ ...f, kindsGiven: false, mapDetailQuality: 'low', fog: [{ visible: [], explored: [] }, { visible: 'ALL', explored: 'ALL' }] });
}

const results = maps.map(buildTerrain);
let nInst = 0;
for (const r of results) {
  for (const p of r.build.prisms) nInst += p.count;
  for (const g of [...r.build.gora, ...r.build.wzgorze]) nInst += g.count;
  for (const c of r.build.coast) nInst += c.count;
}
for (const r of results) {
  fs.writeFileSync(path.join(OUT, `map_${r.name}.json`), JSON.stringify({ generator: 'tests/fixtures/terrain/gen.ts', three: THREE.REVISION, ...r }));
}

// ---------------------------------------------------------------------------
// Colour math micro-vectors (THREE.Color r169 with ColorManagement on).
const crnd = lcg(2468);
const color: any = { setHex: [], getHex: [], hsl: [], pow: [], hypot: [], preset: [] };
for (let i = 0; i < 1024; i++) {
  const hex = i < 256 ? i * 0x010101 : Math.floor(crnd() * 0x1000000);
  const c = new THREE.Color(hex);
  color.setHex.push([hex, c.r, c.g, c.b]);
}
for (let i = 0; i < 2048; i++) {
  const c = new THREE.Color().setRGB(crnd() * 1.1 - 0.05, crnd(), i % 7 === 0 ? 0.0031308 : crnd());
  color.getHex.push([c.r, c.g, c.b, c.getHex()]);
}
for (let i = 0; i < 2048; i++) {
  const c = new THREE.Color(Math.floor(crnd() * 0x1000000));
  if (i % 11 === 0) c.setScalar(crnd());
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  const h2 = crnd() * 2.4 - 0.7, s2 = crnd() * 1.3 - 0.15, l2 = crnd() * 1.3 - 0.15;
  const d = new THREE.Color().setHSL(h2, i % 13 === 0 ? 0 : s2, l2);
  color.hsl.push([c.r, c.g, c.b, hsl.h, hsl.s, hsl.l, h2, i % 13 === 0 ? 0 : s2, l2, d.r, d.g, d.b]);
}
// Math.pow (V8 base::ieee754::pow) on the transfer-function exponents and random ones.
for (let i = 0; i < 6144; i++) {
  const x = i % 4 === 0 ? crnd() : i % 4 === 1 ? crnd() * 1.1 + 0.04 : i % 4 === 2 ? crnd() * 1e3 : (crnd() - 0.5) * 20;
  const y = i % 5 === 0 ? 2.4 : i % 5 === 1 ? 0.41666 : i % 5 === 2 ? (crnd() - 0.5) * 12 : i % 5 === 3 ? Math.round((crnd() - 0.5) * 12) : crnd() * 700 - 350;
  const p = Math.pow(x, y);
  if (Number.isFinite(p) || p === 0) color.pow.push([x, y, Number.isNaN(p) ? null : p]);
  else color.pow.push([x, y, Number.isNaN(p) ? null : p > 0 ? 'inf' : '-inf']);
}
// Math.hypot (V8 builtin, 2 arguments) on random and neighbour-direction inputs.
for (let i = 0; i < 2048; i++) {
  const a = i % 3 === 0 ? (crnd() - 0.5) * 4 : i % 3 === 1 ? (crnd() - 0.5) * 1e-3 : (crnd() - 0.5) * 1e6;
  const b = i % 7 === 0 ? 0 : i % 3 === 2 ? (crnd() - 0.5) * 4 : (crnd() - 0.5) * 100;
  color.hypot.push([a, b, Math.hypot(a, b)]);
}
for (const d of ['low', 'medium', 'high']) for (const n of [0, 2999, 3000, 3001, 7999, 8000, 8001, 40000]) {
  color.preset.push([d, n, resolveRenderPreset(normalizeMapRenderOptions({ style: 'roblox', mapDetailQuality: d } as any), n).robloxLite]);
}
fs.writeFileSync(path.join(OUT, 'color.json'), JSON.stringify({ generator: 'tests/fixtures/terrain/gen.ts', three: THREE.REVISION, fogExplored: FOG_EXPLORED_BRIGHTNESS, ...color }));
console.log(`terrain maps=${results.length} instances=${nInst} fogCalls=${results.reduce((a, r) => a + r.fog.length, 0)} colorCases=${color.setHex.length + color.getHex.length + color.hsl.length} pow=${color.pow.length} hypot=${color.hypot.length}`);
```

### 10.3 Test mutacyjny (scratch)

`/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p411op/mutate.py`

```python
#!/usr/bin/env python3
# P4-11 mutation check: each mutation is applied to a copy of one source file,
# the relevant parity test is run, the original is restored.
import os, subprocess, sys

R = '/home/user/The-Game/.claude/worktrees/wf_5eb5677d-3de-1/rust-port/renderer'
ENV = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0',
           CARGO_TARGET_DIR='/home/user/cargo-target-shared/wf_5eb5677d-3de-1')
MUT = [
    ('C1 wheel deltaY==0 zooms out', 'src/camera.rs', 'let dir = if delta_y > 0.0 { 1.0 } else { -1.0 };', 'let dir = if delta_y >= 0.0 { 1.0 } else { -1.0 };', 'camera_web_parity'),
    ('C2 drag dead zone <= instead of <', 'src/camera.rs', 'if px * px + py * py < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX {', 'if px * px + py * py <= DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX {', 'camera_web_parity'),
    ('C3 drag starts from press point (jump)', 'src/camera.rs', '            self.drag_armed = true;\n            self.last_mouse_x = client_x;\n            self.last_mouse_y = client_y;\n            return;', '            self.drag_armed = true;\n            return;', 'camera_web_parity'),
    ('C4 wheel ignores blockWheelAt', 'src/camera.rs', 'if gate.block_wheel_at(client_x, client_y) {', 'if false && gate.block_wheel_at(client_x, client_y) {', 'camera_web_parity'),
    ('C5 edge-pan while dragging', 'src/camera.rs', '        if self.is_dragging {\n            return None;\n        }', '', 'camera_web_parity'),
    ('C6 edge zone ramp (zone - mx) / zone -> 1', 'src/camera.rs', 'dx -= speed * ((zone - mx) / zone);', 'dx -= speed;', 'camera_web_parity'),
    ('C7 focusAt without clamp', 'src/camera.rs', 'self.dist = self.clamp_dist(d);', 'self.dist = d;', 'camera_web_parity'),
    ('C8 keys not lower-cased', 'src/camera.rs', '        let k = key.to_lowercase();\n        if !self.keys.contains(&k) {', '        let k = key.to_string();\n        if !self.keys.contains(&k) {', 'camera_web_parity'),
    ('T1 coastalDrop 0.045 -> 0', 'src/terrain/mod.rs', 'let coastal_drop = if sand { r * COASTAL_DROP_FACTOR } else { 0.0 };', 'let coastal_drop = 0.0;', 'terrain_web_parity'),
    ('T2 water prisms on own surface (no seaSurfaceY)', 'src/terrain/mod.rs', '            y = sea_surface_y - height / 2.0;', '            y = surface_top_y - height / 2.0;', 'terrain_web_parity'),
    ('T3 powf instead of V8 pow', 'src/terrain/color.rs', 'js_pow(c * 0.947_867_298_6 + 0.052_132_701_4, 2.4)', '(c * 0.947_867_298_6 + 0.052_132_701_4).powf(2.4)', 'terrain_web_parity'),
    ('T4 libm hypot instead of V8 Math.hypot', 'src/terrain/coast.rs', '    sum.sqrt() * max\n}', '    let _ = sum;\n    a.hypot(b)\n}', 'terrain_web_parity'),
    ('T5 no ocean-hide', 'src/terrain/mod.rs', '        if show_now {\n            for key in &self.order {', '        if false {\n            for key in &self.order {', 'terrain_web_parity'),
    ('T6 fog without dirty-set cache (always full pass)', 'src/terrain/mod.rs', '            Some(prev) if !context_changed => {', '            Some(prev) if false && !context_changed => {', 'terrain_web_parity'),
    ('T7 blend weight 0.18 -> 0.2', 'src/terrain/mod.rs', 'base.lerp(acc, if is_water { 0.07 } else { 0.18 }).to_hex()', 'base.lerp(acc, if is_water { 0.07 } else { 0.2 }).to_hex()', 'terrain_web_parity'),
    ('T8 hill solid also on tarasy', 'src/terrain/mod.rs', '            Terrain::Wzgorza if !h.terraces => Some(&mut wzgorze),', '            Terrain::Wzgorza => Some(&mut wzgorze),', 'terrain_web_parity'),
    ('T9 delta only for main (tributary as main)', 'src/terrain/coast.rs', '        if river.kind.unwrap_or(RiverKind::Main) != RiverKind::Main {', '        if river.kind.unwrap_or(RiverKind::Main) == RiverKind::Short {', 'terrain_web_parity'),
    ('T10 prism radius 1.008R -> 1.0R', 'src/terrain/mod.rs', 'geometry: hex_prism_no_bottom_mesh(r * ROBLOX_PRISM_RADIUS_FACTOR, height),', 'geometry: hex_prism_no_bottom_mesh(r, height),', 'terrain_web_parity'),
    ('T11 explored brightness 0.175 -> 0.2', 'src/terrain/mod.rs', '1 => e.base_color.scale(FOG_EXPLORED_BRIGHTNESS),', '1 => e.base_color.scale(0.2),', 'terrain_web_parity'),
]

for name, f, old, new, test in MUT:
    p = os.path.join(R, f)
    src = open(p).read()
    assert src.count(old) == 1, (name, src.count(old))
    open(p, 'w').write(src.replace(old, new))
    try:
        r = subprocess.run(['cargo', 'test', '--locked', '--test', test, '--', '--nocapture', '--test-threads=1'],
                           cwd=R, env=ENV, capture_output=True, text=True, timeout=900)
        out = r.stdout + r.stderr
        summary = [l.strip() for l in out.splitlines() if l.startswith('TOTAL') or l.startswith('camera parity') or l.startswith('test result')]
        print(f'{name}: exit={r.returncode} | ' + ' | '.join(summary))
    finally:
        open(p, 'w').write(src)
    sys.stdout.flush()
```

### 10.4 Bramki (scratch)

`/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p411op/gates.sh`

```bash
#!/bin/bash
# P4-11 gates: full raw output of each command followed by EXIT=<code>.
S=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p411op
cd /home/user/The-Game/.claude/worktrees/wf_5eb5677d-3de-1/rust-port/renderer || exit 1
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_5eb5677d-3de-1
{
echo '$ git rev-parse HEAD'; git rev-parse HEAD
echo '$ cargo fmt --all -- --check'; cargo fmt --all -- --check; echo "EXIT=$?"
echo '$ cargo clippy --locked --all-targets --features gpu -- -D warnings'; cargo clippy --locked --all-targets --features gpu -- -D warnings; echo "EXIT=$?"
echo '$ cargo clippy --locked --all-targets -- -D warnings'; cargo clippy --locked --all-targets -- -D warnings; echo "EXIT=$?"
echo '$ cargo test --locked --all-targets'; cargo test --locked --all-targets; echo "EXIT=$?"
echo '$ cargo test --locked --test camera_web_parity --test terrain_web_parity -- --nocapture --test-threads=1'; cargo test --locked --test camera_web_parity --test terrain_web_parity -- --nocapture --test-threads=1; echo "EXIT=$?"
} > $S/gates.log 2>&1
grep -n "EXIT=" $S/gates.log
```

### 10.5 Uruchomienie generatorów (scratch)

`/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p411op/run_gen.sh`

```bash
#!/bin/bash
# usage: run_gen.sh <name>   (camera | terrain)
set -e
S=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p411op
WT=/home/user/The-Game/.claude/worktrees/wf_5eb5677d-3de-1
N=$1
cp $WT/rust-port/renderer/tests/fixtures/$N/gen.ts $S/refscript/${N}_gen.ts
cd $S/refscript
export NODE_PATH=$S/ref/node_modules
$S/ref/node_modules/.bin/esbuild ${N}_gen.ts --bundle --platform=node --format=esm --outfile=${N}_gen.mjs --log-level=warning
mkdir -p $S/out/$N
node ${N}_gen.mjs $S/out/$N
ls -la $S/out/$N
sha256sum $S/out/$N/*.json
```

### 10.6 `Math.pow`: generator par (scratch)

`/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p411op/powchk/gen.js`

```js
let s = 12345;
const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
const out = [];
const f64 = new Float64Array(1), u = new BigUint64Array(f64.buffer);
const bits = (x) => { f64[0] = x; return u[0].toString(); };
for (let i = 0; i < 200000; i++) {
  const x = i % 3 === 0 ? rnd() : i % 3 === 1 ? rnd() * 1.1 + 0.05 : rnd() * 100;
  const y = i % 4 === 0 ? 2.4 : i % 4 === 1 ? 0.41666 : i % 4 === 2 ? rnd() * 10 - 5 : 1 / 2.4;
  out.push(`${bits(x)} ${bits(y)} ${bits(Math.pow(x, y))}`);
}
require('fs').writeFileSync(process.argv[2], out.join('\n'));
console.log('v8', process.versions.v8);
```

### 10.7 `Math.pow`: porównanie (scratch)

`/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p411op/powchk/src/main.rs`

```rust
use civ_renderer::terrain::jsmath::js_pow;
fn main() {
    let path = std::env::args().nth(1).unwrap();
    let t = std::fs::read_to_string(path).unwrap();
    let (mut n, mut bad_port, mut bad_libm) = (0, 0, 0);
    for l in t.lines() {
        let v: Vec<u64> = l.split(' ').map(|x| x.parse().unwrap()).collect();
        let (x, y, w) = (f64::from_bits(v[0]), f64::from_bits(v[1]), v[2]);
        n += 1;
        if js_pow(x, y).to_bits() != w {
            bad_port += 1;
            if bad_port < 8 {
                println!("port x={x:e} y={y:e} got {:e} want {:e}", js_pow(x, y), f64::from_bits(w));
            }
        }
        if x.powf(y).to_bits() != w {
            bad_libm += 1;
        }
    }
    println!("n={n} port_mismatch={bad_port} libm_mismatch={bad_libm}");
}
```
