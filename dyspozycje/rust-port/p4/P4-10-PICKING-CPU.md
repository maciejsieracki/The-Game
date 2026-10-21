# P4.10 — Picking CPU w Rust (RR-T3): piksel → heks / jednostka, 1:1 z webem

STATUS dokumentu: Operator r1 (do oceny Evaluatora)
TEMAT: R-RUSTPORT-P4-10-PICKING-CPU-Q1 · DOMAIN: GAME · baza kodu: `origin/rust-port/parity-v2` @ `0a496f67`
Web źródłowy: `edb8fb56` (wyłącznie `git show` / `git archive`, bez `npm run build/dev`, bez zmian w `gra/**`).
Decyzja D-RR-3 (domyślna orkiestratora, do rewizji przez właściciela): dziwactwa weba odtworzone 1:1.

## 0. Streszczenie

- Moduł `rust-port/renderer/src/pick/` (zamiana `pick.rs` → `pick/mod.rs` bez zmiany `lib.rs`):
  `three.rs` (bitowe repliki matematyki Three.js r169), `hex.rs` (axial↔świat, oba `worldToAxial`, `Math.round`, NDC),
  `camera.rs` (kamera pickingu i promień z piksela), `raycast.rs` (`Mesh`/`InstancedMesh.raycast` + stabilne sortowanie),
  `terrain.rs` (scena pickingu terenu: pryzmy + bryły gór/wzgórz, `topYAt`), `mod.rs` (`pixelToHex`, `pickUnitIdAt`, `pickMapTarget`).
- Metoda: zamiast „analitycznego przybliżenia” Rust powtarza **tę samą sekwencję operacji IEEE 754**, co Three.js
  (raycast po trójkątach tej samej geometrii, te same macierze Float32 instancji, ten sam porządek trafień).
  Dzięki temu porównanie z webem ma tolerancję **zero** nie tylko dla wyniku (heks), ale i dla wartości pośrednich:
  macierze kamery, promienie, wierzchołki pryzmów i macierze instancji są równe **bit w bit** (testy niżej).
- Dane referencyjne: 20 174 punkty ekranowe w 55 scenariuszach (5 map × 4–5 kamer × 3 viewporty), 1 233 wektory
  `worldToAxial`, 23 wartości `Math.round`, 6 przypadków `clientRectToNdc` — wygenerowane przez **kod weba**
  (moduły z `edb8fb56` importowane bez zmian + kopie logiki fragmentów `scene.ts`/`units.ts`/`main.ts` z jawnie wypisanymi
  adaptacjami (§7.1) + jeden model mgły/miast/LOD (§7.1), three@0.169.0).
- Wynik: **20 174 / 20 174 zgodnych (100%)**, wszystkie bramki `EXIT=0` (§8). Test mutacyjny: każda z 9 celowo
  wprowadzonych rozbieżności (§6) jest wykrywana przez zestaw złoty.
- Zero nowych zależności (`Cargo.toml`/`Cargo.lock` bez zmian; parser JSON testu napisany w pliku testu).

## 1. Łańcuch wywołań weba odtworzony w Rust

| Web (`edb8fb56`) | Rust |
|---|---|
| `main.ts:1894-1901` `pickMapTarget`: najpierw `unitRenderer.pickUnitIdAt`, trafienie → heks jednostki `(u.q,u.r)` | `pick::pick_map_target` → `MapPick::Unit { index, hex }` |
| `units.ts:5867-5893` `pickUnitIdAt`: `intersectObjects(roots widoczne, recursive=true)`, pierwsze trafienie z `userData.unitId` w łańcuchu rodziców | `pick::ray_to_unit` (wszystkie meshe tokenów, sortowanie po odległości, pierwsze trafienie) |
| `main.ts:1885-1891` `pickHexAt` → `picker.ts:175-250` `pixelToHex(..., HEX_R, terrainPickMeshes, resolveTerrainPick, topYAt)` | `pick::pixel_to_hex` / `pick::ray_to_hex` |
| `picker.ts:87-98` `clientRectToNdc` | `pick::hex::client_rect_to_ndc` |
| `picker.ts:192-193` `Raycaster.setFromCamera` | `pick::camera::CameraMatrices::ray_from_ndc` |
| `picker.ts:196` `intersectObjects(terrainPickMeshes, false)` | `pick::raycast::intersect_objects` |
| `picker.ts:49-81` `worldToAxial` (klik) / `hexutil.ts:53-71` (galeria) | `pick::hex::world_to_axial_picker` / `world_to_axial_hexutil` |
| `scene.ts:3684` `terrainPickMeshes = [...instancedMeshes, ...goraInst, ...wzgorzeInst]`, `scene.ts:3088-3098` `resolveTerrainPick` | `pick::terrain::build_terrain_pick_scene` → `TerrainPickScene { meshes, kinds }` (heks każdej instancji) |
| `units.ts:6409-6412` `topYAt` → `units.ts:214-217` `terrainTopY` | `TerrainPickScene::top_y_at` / `Terrain::top_y` |

## 2. Wyprowadzenie matematyki (plik:linia)

### 2.1 Kamera
- `scene.ts:3078-3083`: `new PerspectiveCamera(50, camAspect, 0.5, farClip)`; `scene.ts:3075-3077` `farClip = max(1200, maxZoomDist·5, mapMaxDim·R·6)`;
  `scene.ts:2997-2999` `maxZoomDist = max(320, max(W,H)·R·1,85·1,2)` → `camera::far_clip_roblox`, `camera::max_zoom_dist`.
- `scene.ts:3104-3106` `onResize`: `camera.aspect = w/h; updateProjectionMatrix()`.
- `camera.ts:130-144` `_syncCamera`: `elevation = degToRad(52)`, `azimut = yaw = 0` (`camera.ts:123`),
  `position = (tx + d·cosEl·sin0, 0 + d·sinEl, tz + d·cosEl·cos0)`, `camera.lookAt(target)`; cel ma `y = 0` (`camera.ts:106`).
  `minDist = 8/3` (`main.ts:1906`, stała `camera::MIN_DIST`).
- Three r169 `Object3D.lookAt` (`core/Object3D.js:271-311`): dla kamery `_m1.lookAt(position, target, up)` → `quaternion.setFromRotationMatrix`;
  `updateMatrixWorld` → `matrix.compose(position, quaternion, scale)`. Rust: `Mat4::look_at` → `Quat::from_rotation_matrix` → `Mat4::compose`.
- `PerspectiveCamera.updateProjectionMatrix` (`cameras/PerspectiveCamera.js:214-242`): `top = near·tan(DEG2RAD·0,5·fov)/zoom`,
  `height = 2·top`, `width = aspect·height`, `left = −0,5·width`, `makePerspective(left, left+width, top, top−height, near, far)`,
  `projectionMatrixInverse = projectionMatrix.invert()` (`math/Matrix4.js:491-534`, `:777-811`). Rust: `PickCamera::matrices`.
- Baza kamery (P4-3 §3.2) wynika z tego automatycznie: `z_c = (0, sin52°, cos52°)`, `x_c = (1,0,0)`, `y_c = (0, cos52°, −sin52°)`.

### 2.2 Promień z piksela
- NDC: `nx = ((cx − left)/width)·2 − 1`, `ny = −((cy − top)/height)·2 + 1`; pusty rect → `null` (`picker.ts:87-98`).
- `Raycaster.setFromCamera` (`core/Raycaster.js:37-44`): `origin = matrixWorld.position`,
  `dir = normalize((nx, ny, 0,5).applyMatrix4(projectionMatrixInverse).applyMatrix4(matrixWorld) − origin)`.
  `normalize = multiplyScalar(1/(len || 1))` (`math/Vector3.js:443-447`, `:311-315`) — Rust powtarza mnożenie przez odwrotność, nie dzielenie.

### 2.3 Raycast terenu (co trafia web)
- Lista celów: `scene.ts:3684`. Pryzmy: `hexPrismNoBottomGeo(1,008·R, vis.height)` (`scene.ts:1563-1576`, `:1774-1776`) =
  `CylinderGeometry(r, r, h, 6, 1)` bez dolnej pokrywy (`geometries/CylinderGeometry.js`: torso → górna pokrywa → dolna; indeks dolnej usunięty).
  Rust: `terrain::hex_prism_no_bottom` (wierzchołki Float32 identyczne bitowo, test `prism_geometry_is_bitwise_three_cylinder`).
- Kolejność meshy pryzmów: `Object.values(TerenBazowy)` = Łąka, Równina, Wzgórza, Góry, PłytkieMorze, Morze, Pustynia, Polarny
  (`types/hex.ts:12-24`, `scene.ts:1768-1769`), tylko typy obecne na mapie. Kolejność instancji = `Object.values(map.hexes)` (`scene.ts:2213`).
- Wysokości (`mapRenderStyle.ts:163-195, 211-243`, styl `roblox` `mapRenderStyle.ts:40`): `yOffset = TERRAIN_SURFACE_Y[t] − height`;
  `surfaceTopY = height + yOffset − coastalDrop`; środek pryzmu `y = surfaceTopY − height/2`, a dla wody (oba `Morze` i `PlytkieMorze`)
  `y = seaSurfaceY − height/2` z `seaSurfaceY = 0,30 + (0,18 − 0,30)` (`scene.ts:2088-2089`, `:2246-2262`).
  `coastalDrop = R·0,045` gdy suchy ląd ma sąsiada `PlytkieMorze` (`scene.ts:2252-2255`, `mapRenderStyle.ts:1257-1263`).
  Rust: `Terrain::{visual, surface_y, top_y}` (te same dodawania od lewej, np. `0,18 + 0,28 + 0,18`).
- Bryły: góra `goraGeometria(v)` w `(x, height+yOffset, z)` (bez `coastalDrop`!), wzgórze `wzgorzeGeometria(v)` analogicznie, chyba że heks ma
  ulepszenie `tarasy` (`scene.ts:2414-2430`, `:2462-2480`); `v = wariantDlaHeksa(q,r,5,seed)`, obrót `rotacjaDlaHeksa` = wielokrotność 60°
  (`teren-gory-wzgorza.ts:100-126`, `Math.imul`/`>>>` → arytmetyka `u32` z zawijaniem w `terrain::hash_heksa`).
  Geometrie brył (98–144 trójkątów) Rust dostaje z zewnątrz (`TerrainSolids`; docelowo z RR-T4/RR-T7, w testach z fixture).
- Macierz instancji: `dummy.position/rotation(0,θ,0)/scale(1,1,1).updateMatrix()` → `compose` z `Quaternion.setFromEuler` (XYZ),
  zapis `setMatrixAt` do **Float32Array** (`InstancedMesh.instanceMatrix`). Rust: `terrain::instance_matrix` → `Mat4::to_f32`
  (test bitowy `terrain_scene_instances_are_bitwise_web`, 380 macierzy).
- Mgła / miasto: `setFog` i `hideInstancedOnHex` wpisują `ZERO_MATRIX = makeScale(0,0,0)` (`scene.ts:3139`); jej odwrotność jest zerowa
  (`det = 0`, `Matrix4.invert`) → promień NaN → brak trafienia. Rust powtarza ten sam mechanizm (`terrain::zero_matrix`).
  LOD: `goraInst/wzgorzeInst.visible = zoomFlags.styledDecor` (`scene.ts:3371-3373`) → `TerrainSceneOptions::solids_visible`.
- `InstancedMesh.raycast` (`objects/InstancedMesh.js:154-204`, macierze w `Float32Array` (`:27`)): dla każdej instancji `world = matrixWorld(=I)·local`, potem `Mesh.raycast`
  (`objects/Mesh.js:142-185`): sfera otaczająca geometrii w świecie (odsiew), `ray_local = ray.applyMatrix4(world⁻¹)`,
  `intersectTriangle(a,b,c, backfaceCulling = side==Front)` (`math/Ray.js:395-…`; `BackSide` odwraca kolejność, `DoubleSide` bez odsiewu),
  punkt → świat, `distance = origin.distanceTo(punkt)` (`Mesh.js:325-354`), `face.normal = Triangle.getNormal(vA,vB,vC)` w przestrzeni lokalnej
  (`Mesh.js:356-410`, `math/Triangle.js:30-45`). Na końcu `intersects.sort((a,b) => a.distance − b.distance)` — sort **stabilny** (V8 TimSort,
  Rust `sort_by`), więc przy równych odległościach decyduje kolejność: mesh → instancja → trójkąt. Rust: `raycast::intersect_objects`.

### 2.4 Reguły decyzji `pixelToHex` (`picker.ts:195-249`)
1. pomiń trafienia w obiekt `visible === false` (`:203`);
2. trafienie w instancję z kluczem: `worldUpNormal(h) = normal.transformDirection(mesh.matrixWorld = I).y > 0,5` → heks instancji (`:211-212`) — `PickVia::TopFace`;
3. inaczej `worldToAxial(punkt) == heks instancji` → heks (`:215-216`) — `SideMatch`; w przeciwnym razie zapamiętaj pierwszy jako `sideResolvedFallback` (`:217-218`);
4. trafienie bez klucza i `n.y > 0,5` → `worldToAxial(punkt)` (`:221-223`) — `UnresolvedTopFace` (nieosiągalne dla sceny weba: każda instancja ma klucz);
5. po pętli `sideResolvedFallback` (`:225`) — `SideFallback`; potem pierwsze widoczne trafienie → `worldToAxial` (`:226-229`) — `FirstVisibleHit` (nieosiągalne, bo pkt 3 zawsze ustawia fallback);
6. brak trafień: płaszczyzna `y=0` → `coarse`; `topY = topYAt(coarse)`; gdy `> 0` płaszczyzna `y = topY` → wynik (`:232-248`) — `PlaneRefined`, inaczej `coarse` — `PlaneCoarse`.
   `Ray.distanceToPlane` (`math/Ray.js:256-…`): `t = −(origin·n + constant)/(n·dir)`, `t ≥ 0`.

### 2.5 `worldToAxial` i `Math.round`
- `rf = z/(1,5R)`, `qf = x/(√3R) − rf·0,5`; sześcienne zaokrąglenie przez `Math.round` (`picker.ts:51-80`, `hexutil.ts:55-70`).
- Remis: `picker.ts` poprawia `q` tylko przy `dq` ściśle największym, potem `s` przy `ds > dr`, **w pozostałych (także `ds == dr`) `r`**;
  `hexutil.ts` przy `dr == ds` poprawia `s`. W zestawie `math.json` warianty różnią się na 100 z 1 233 punktów (rogi heksów i konstruowane remisy) — oba zgodne z webem w 100%.
- `Math.round` = `floor(x)` + (1 gdy `x − floor(x) ≥ 0,5`) — recepta z P4-3 §3.4, potwierdzona teraz w Rust na 23 wartościach brzegowych
  (`±0,5`, `±1,5`, `±2,5`, `0,49999999999999994`, `±4503599627370497`, `2^52+0,5`, `±1e−300`…) i w teście explicite pokazującym,
  że `f64::round(−0,5) = −1` oraz `(0,49999999999999994 + 0,5).floor() = 1` byłyby błędne.

### 2.6 Jednostki pierwsze
- `units.ts:5880-5891`: korzenie tokenów filtrowane po `visible`, potem `intersectObjects(roots, true)` — Three **nie** sprawdza `visible`
  dzieci (ukryte dzieci widocznego tokenu też łapią klik). Rust: `UnitPickModel { id, hex, meshes: Vec<PickMesh> }` w kolejności `traverse`,
  każdy `PickMesh` ma `matrixWorld` (f64, jak `Object3D`) i `side`; wywołujący podaje tylko widoczne tokeny.

## 3. Tabela dziwactw

| # | Dziwactwo weba | Źródło | Rust | Dowód |
|---|---|---|---|---|
| 1 | Boki pryzmów trafiane; reguła `n.y > 0,5` / `fromPoint == instancja` / `sideResolvedFallback` | `picker.ts:211-225` | **odtworzone** | mutacja M7 → 475 rozbieżności; `SideMatch` 557, `SideFallback` 985 punktów |
| 2 | Bryły gór/wzgórz ponad wierzchem (klik w szczyt nad sąsiadem → heks bryły) | `scene.ts:2414-2480, 2717-2727` | **odtworzone** (geometria wejściowa) | punkty `solid`/`solid-peak` (555) zgodne; mutacja M9 → 4 904 |
| 3 | Pierwszeństwo jednostek (model wystający nad sąsiada → heks jednostki) | `main.ts:1894-1901` | **odtworzone** | 339 punktów wygrywa jednostka, 79 z nich różni się od `pickHexAt`; mutacja M5 → 79 |
| 4 | Nakładanie pryzmów `1,008R` i kolejność trafień przy równych odległościach | `scene.ts:1774`, stabilny sort | **odtworzone** (bitowo te same odległości) | mutacja M1 → 1 734, M8 (odwrócony porządek remisów) → 1 284 |
| 5 | `coastalDrop` 0,045 tylko w pryzmie (bryły i `topYAt` bez niego) | `scene.ts:2252-2256, 2416, 2463`, `units.ts:214-217` | **odtworzone** | mutacja M2 → 906 |
| 6 | `PlytkieMorze`: pryzm na 0,18, a `topYAt` = 0,22 | `scene.ts:2257-2261`, `mapRenderStyle.ts:187, 231-235` | **odtworzone** | mapa E (mgła) + punkty `fog`; mutacja M6 → 401 |
| 7 | Dwa warianty `worldToAxial`, remis `dr == ds` | `picker.ts:71-77`, `hexutil.ts:65-69` | **odtworzone oba**; klik używa `picker.ts` | 1 233 wektory; mutacja M3 → 14 punktów złotych |
| 8 | `Math.round` (połówka do +∞) | `picker.ts:61-63` | **odtworzone** (`hex::js_round`) | 23 wartości; mutacja M4 → 10 punktów złotych |
| 9 | Macierze instancji Float32 | Three `InstancedMesh.instanceMatrix` | **odtworzone** (`[f32;16]`) | 380 macierzy bitowo |
| 10 | Mgła: `ZERO_MATRIX` → heks nietrafialny → ścieżka awaryjna | `scene.ts:3139`, `picker.ts:232-248` | **odtworzone** (ten sam mechanizm NaN) | `PlaneRefined` 3 805 punktów |
| 11 | LOD: bryły `visible=false` ignorowane w całości | `picker.ts:197-203`, `scene.ts:3371-3373` | **odtworzone** | mapa C (`solidsVisible=false`) |
| 12 | Ukryte dzieci widocznego tokenu łapią klik | Three `Raycaster.intersect` | **odtworzone** (wszystkie meshe tokenu) | semantyka API; brak wektora z realnym ukrytym dzieckiem → `NIE_ZMIERZONO` |
| 13 | Odsiew sferą całego `InstancedMesh` (`refreshInstancedPickBounds`) i opcjonalny odsiew `boundingBox` | `picker.ts:146-150`, `Mesh.js:176-180` | **pominięte** — zachowawcze (nie usuwają realnego trafienia poza ocieraniem o sferę/pudło, miara zero); odsiew sferą pojedynczej instancji **jest** odtworzony | brak rozbieżności na 20 174 punktach |
| 14 | `pixelToHex` zwraca `null`, gdy promień nie trafia płaszczyzny | `picker.ts:234-236` | **odtworzone** (`None`) | nieosiągalne przy 52° (0 przypadków `null` w danych) |
| 15 | Próg klik/drag 6 px, prawy klik, panel UI | `main.ts:26337-26369` | **poza zakresem** (warstwa wejścia RR-T12/UI) | — |
| 16 | Hover (gwiazdki weterana, pigułki miast) | `units.ts`, `main.ts:26230-26253` | **poza zakresem** (RR-T13); API `raycast::intersect_objects` + `PickObject` gotowe do rozszerzenia | — |

## 4. Wektory testowe

| Zestaw | Liczba | Co sprawdza |
|---|---|---|
| `golden_pick.json` | 55 scenariuszy, **20 174 punkty** | `pickHexAt` i `pickMapTarget` w punkcie ekranu; `PickVia`: TopFace 12 018, PlaneRefined 3 805, PlaneCoarse 2 809, SideFallback 985, SideMatch 557; rodzaje: grid 5 720, corner 1 498, edge/edge-in/edge-out/overlap po 1 494, side 1 500, side-low 1 518, fog 1 780, unit 720, int 660, solid 514, solid-peak 41, center 247 |
| — mapy | A (9×7 ręczna: morze, wybrzeże, plaże, wzgórza/góry przy sobie i przy nizinach, 4 jednostki), B (12×9 pseudolosowa, ziarno −42, mgła 14 heksów, miasto na górze, tarasy, dziury w siatce, kolejność kluczy odwrócona, 2 jednostki), C (= A przesunięta do ujemnych `q/r`, bryły niewidoczne), D (płaska Łąka/Równina 7×7 — czyste nakładanie 1,008R), E (8×6 prawie cała pod mgłą: ścieżka awaryjna, 0,22 vs 0,18) | |
| — kamery | `d ∈ {8/3 (min), 6,5, 11 (przesunięty cel), 24, 320 (max)}`, viewporty 1280×720 @ (0,0), 800×600 @ (37,5; 12), 375×812 @ (0; 56) | skrajne zoomy i krawędzie kadru (`nx, ny = ±1`) |
| `camera_*` | 55 × 3 macierze + **275 promieni** | bitowa równość z Three |
| `scenes.json` | **380 macierzy instancji**, 6 geometrii pryzmów | bitowa równość budowy sceny |
| `math.json` | 1 233 `worldToAxial` × 2 warianty, 23 `Math.round`, 6 `clientRectToNdc` | czysta matematyka, remisy i połówki |

## 5. `NIE_ZMIERZONO` i lista do weryfikacji na realnym webie (właściciel)

Zgodność 100% dotyczy wektorów z funkcji weba w harnessie node (moduły weba + three@0.169.0). Nie zmierzono:

1. **Realna scena gry** (`buildScene` z prawdziwą mapą, regułą „ocean-hide” A5 w `setFog`, miastami): harness odtwarza tylko część
   `buildScene` istotną dla pickingu (kopie logiki z adaptacjami i model mgły — §7.1). Do sprawdzenia przez właściciela: nagrać w przeglądarce `pickMapTarget` dla siatki
   punktów na jednej zapisanej grze (np. 64×36 + punkty z P4-3 §3.7) i porównać z Rust (P4-3 §3.8, wymaga zgody na harness Playwright).
2. **Prawdziwe modele jednostek** (buildery P4-4, `_tokenPlacement`, przesunięcie na mieście `units.ts:5930-5935`, relief na wzgórzu/górze
   `units.ts:219-224`, łodzie `units.ts:6055-6056`, ewentualne `Sprite`/`Line` w tokenach — `Sprite.raycast` ma inną semantykę). Tu modele syntetyczne.
3. **Ukryte dziecko widocznego tokenu** (dziwactwo 12) — brak wektora.
4. **Inne platformy**: równość bitowa `sin/cos/tan` Rust (glibc, Linux) z V8 zmierzona tylko tu (kamera, pryzmy, obroty brył — 0 różnic).
   Windows (msvcrt/UCRT libm) i macOS — `NIE_ZMIERZONO`; ewentualna różnica 1 ulp zmieniłaby wynik tylko w remisach miary zero.
5. **Aspekt**: założono `camera.aspect = rect.width/rect.height` (`canvasCssW/H` vs `getBoundingClientRect` — przy zoomie UI/`transform` mogą się różnić).
6. **Wydajność na dużych mapach** (do 320 tys. heksów): Rust sprawdza sferę każdej instancji liniowo, jak Three; czas na klik — `NIE_ZMIERZONO`.
7. Gałęzie `UnresolvedTopFace` i `FirstVisibleHit` — zaimplementowane, ale **nieosiągalne** dla sceny weba (brak wektora).
8. Wartości `solid_hidden` / `prism_hidden` / `solids_visible` dostarcza warstwa widoku (mgła RR-T5, LOD); ich wyliczanie nie jest częścią tego tematu.

## 6. Test mutacyjny (czy zestaw złoty wykrywa rozjazdy)

Skrypt `mutate.py` (scratch, poza repo): każda mutacja nakładana na kopię pliku, uruchomienie
`cargo test --locked --test pick_golden golden_picks_match_web_100_percent`, przywrócenie oryginału.

```text
M1 overlap 1.008R -> 1.0R: exit=101 1734 / 20174 mismatches
M2 coastalDrop 0.045 -> 0: exit=101 906 / 20174 mismatches
M3 hexutil tie rule in picker: exit=101 14 / 20174 mismatches
M4 f64::round instead of Math.round: exit=101 10 / 20174 mismatches
M5 units not first: exit=101 79 / 20174 mismatches
M6 topYAt PlytkieMorze 0.18 (no 0.22 quirk): exit=101 401 / 20174 mismatches
M7 no side-face rule (any hit = instance hex): exit=101 475 / 20174 mismatches
M8 equal-distance hits in reverse order: exit=101 1284 / 20174 mismatches
M9 plane-only picking (no meshes): exit=101 4904 / 20174 mismatches
```

## 7. Pochodzenie danych referencyjnych

- Środowisko: node v22.22.0; `three@0.169.0` (integrity identyczne z `gra/package-lock.json` `edb8fb56`: `sha512-Ed906MA3dR4TS5riErd4QBsRGPcx+HBDX2O5yYE5GqJeFQTPU+M56Va/f/Oph9X7uZo3W3o4l2ZhBZ6f6qUv0w==`),
  `esbuild@0.24.0` (tylko bundlowanie i usuwanie typów TS); instalacja `npm install --ignore-scripts` w osobnym katalogu scratch, skrypty
  uruchamiane z innego katalogu (`refscript/`), kod weba z `git archive edb8fb56 gra/src gra/data` rozpakowany do `websrc/`.
- Komendy (pełne):

```bash
S=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad
mkdir -p $S/ref $S/websrc $S/refscript
cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0
cd /home/user/The-Game/.claude/worktrees/wf_7fb21ca5-e1d-1 && git archive --format=tar -o $S/websrc.tar edb8fb56 gra/src && tar -xf $S/websrc.tar -C $S/websrc
cd /home/user/The-Game/.claude/worktrees/wf_7fb21ca5-e1d-1 && git archive --format=tar -o $S/webdata.tar edb8fb56 gra/data && tar -xf $S/webdata.tar -C $S/websrc
cd $S/refscript && NODE_PATH=$S/ref/node_modules $S/ref/node_modules/.bin/esbuild gen.ts --bundle --platform=node --format=esm --outfile=gen.mjs --log-level=warning
cd $S/refscript && node gen.mjs $S/out
# stdout: scenarios=55 points=20174 w2a=1233 round=23 ndc=6
cp $S/out/*.json /home/user/The-Game/.claude/worktrees/wf_7fb21ca5-e1d-1/rust-port/renderer/tests/fixtures/pick/
```

- Determinizm: dwa niezależne uruchomienia dają identyczne pliki; SHA-256 plików w repo:

```text
171872afdb32e2be32d3216cf1e9f7231379f04727bd2fffb25f95d351e97a21  rust-port/renderer/tests/fixtures/pick/README.md
d681dd606827ba89f2a2a8b0c12ae69de1de5f4841b449edfd54570d594d47c2  rust-port/renderer/tests/fixtures/pick/gen.ts
a99269a102e960878b8792cf86d9e4167fd6ad9bac77e735c72fd4c39c476ce4  rust-port/renderer/tests/fixtures/pick/geometry.json
cefe210fa76730defec94cafe23ae1645b4e4bef96bd6bd9948d540d294247ca  rust-port/renderer/tests/fixtures/pick/golden_pick.json
5f1815ee9366e95deef77bba5cab5f33c8d3efd9b5483874b021b46ae07435e8  rust-port/renderer/tests/fixtures/pick/math.json
e0c1031452dfee80fdeebfb6c7f6f31d623885dcf35bb661f9fa5b68c346f714  rust-port/renderer/tests/fixtures/pick/scenes.json
```

- Pełny skrypt generatora (`rust-port/renderer/tests/fixtures/pick/gen.ts`, identyczny z uruchomionym):

```ts
// R-RUSTPORT-P4-10-PICKING-CPU-Q1 — generator wektorów referencyjnych pickingu.
//
// Uruchamiany WYŁĄCZNIE poza repo (katalog scratch). Bundel esbuild łączy:
//  - three@0.169.0 (npm, wersja z gra/package.json),
//  - DOSŁOWNE moduły weba z `git archive edb8fb56 gra/src gra/data`
//    (picker.ts, camera.ts, hexutil.ts, mapRenderStyle.ts, teren-gory-wzgorza.ts,
//     terrain-improvements.ts, types/hex.ts) — importowane, nie przepisywane,
//  - kopie fragmentów, których nie da się zaimportować bez DOM/WebGL
//    (scene.ts: hexPrismNoBottomGeo, isDryLandTeren, terrainVis, pętla rozmieszczenia
//     pryzmów i brył, resolveTerrainPick, ZERO_MATRIX; units.ts: terrainTopY,
//     unitTerrainRelief, pickUnitIdAt; main.ts: pickHexAt, pickMapTarget) — każda
//     oznaczona `// LITERAL <plik>:<linie>`. „LITERAL” = ta sama logika i arytmetyka
//     w tej samej kolejności, NIE kopia znak po znaku: typy → `any`, komentarze usunięte,
//     ustalony styl roblox (gałęzie `renderStyle`/`styledTerrain=true`/`B_NO_BOTTOM=true`),
//     martwe dla roblox pola civ (`TERRAIN_VISUALS[t]`, `CIV_TERRAIN_TOP`) → `{height:0,yOffset:0}`,
//     usunięte materiały/kolory/`castShadow`/`scene.add`/`performance`/`*OrigMatrix`.
//     Pełna lista: README.md §Adaptations i P4-10 §7.1. Fragmenty oznaczone `MODEL`
//     (mgła) NIE są kopią — odtwarzają skutek kilku funkcji weba (opis przy nich).
// Wyjście: JSON-y w katalogu podanym jako argv[2].

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TerenBazowy } from '../websrc/gra/src/types/hex';
import {
  terrainVisualForStyle, landCoastSandNeeded, GAME_MAP_RENDER_STYLE,
} from '../websrc/gra/src/render/mapRenderStyle';
import {
  pixelToHex, worldToAxial, clientRectToNdc, refreshInstancedPickBounds,
} from '../websrc/gra/src/input/picker';
import {
  axialToWorld, worldToAxial as worldToAxialHexutil, HEX_R, mapCenter,
} from '../websrc/gra/src/render/hexutil';
import { CameraController } from '../websrc/gra/src/render/camera';
import {
  goraGeometria, wzgorzeGeometria, wariantDlaHeksa, rotacjaDlaHeksa,
  TEREN_MATERIAL, LICZBA_WARIANTOW_TERENU,
} from '../websrc/gra/src/render/teren-gory-wzgorza';
import { improvementKeysForHex } from '../websrc/gra/src/game/terrain-improvements';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node gen.mjs <outdir>');
fs.mkdirSync(OUT, { recursive: true });

// Stuby DOM wymagane przez konstruktor CameraController (_bind dodaje nasłuchiwacze).
(globalThis as any).window = { addEventListener() {}, removeEventListener() {} };
(globalThis as any).document = { addEventListener() {}, removeEventListener() {} };

// ---------------------------------------------------------------------------
// LITERAL scene.ts:578-580
function isDryLandTeren(tb: TerenBazowy): boolean {
  return tb !== TerenBazowy.Morze && tb !== TerenBazowy.PlytkieMorze;
}
// LITERAL scene.ts:166-170 (civ-spec nieużywany w stylu roblox — mapRenderStyle.ts:231)
function terrainVis(t: TerenBazowy, renderStyle: any) {
  const civ = { height: 0, yOffset: 0 };
  const spec = terrainVisualForStyle(t, renderStyle, civ);
  return { height: spec.height, yOffset: spec.yOffset };
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
// LITERAL scene.ts:3139
const ZERO_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

// LITERAL units.ts:214-224 (CIV_TERRAIN_TOP nieużywany w stylu roblox)
function terrainTopY(hex: any): number {
  const spec = terrainVisualForStyle(hex.terenBazowy, GAME_MAP_RENDER_STYLE, { height: 0, yOffset: 0 });
  return spec.height + spec.yOffset;
}
function unitTerrainRelief(t: TerenBazowy): number {
  if (t === TerenBazowy.Wzgorza) return HEX_R * 0.22;
  if (t === TerenBazowy.Gory)    return HEX_R * 0.34;
  return 0;
}

// ---------------------------------------------------------------------------
// Scena pickingu (scene.ts buildScene — tylko to, co trafia do terrainPickMeshes)
interface MapSpec {
  name: string; seed: number; W: number; H: number;
  hexes: Array<{ q: number; r: number; t: TerenBazowy; hidden?: boolean; solidHidden?: boolean; tarasy?: boolean }>;
  solidsVisible: boolean;
}

function buildPickScene(spec: MapSpec) {
  const R = HEX_R;
  const renderStyle = 'roblox';
  const map: any = { seed: spec.seed, szerokoscQ: spec.W, wysokoscR: spec.H, hexes: {} as Record<string, any> };
  for (const h of spec.hexes) {
    map.hexes[`${h.q},${h.r}`] = {
      coords: { q: h.q, r: h.r }, terenBazowy: h.t,
      ulepszenia: h.tarasy ? ['tarasy'] : undefined,
    };
  }
  // LITERAL scene.ts:1702-1703, 1723-1745 (tylko liczniki terenu / gór / wzgórz)
  const NW = LICZBA_WARIANTOW_TERENU;
  const styledTerrain = true; // useStyledDecor && renderStyle === 'roblox'
  const countByTerrain: Partial<Record<TerenBazowy, number>> = {};
  const goraVarCount: number[] = new Array(NW).fill(0);
  const wzgorzeVarCount: number[] = new Array(NW).fill(0);
  for (const hex of Object.values(map.hexes) as any[]) {
    const t = hex.terenBazowy;
    countByTerrain[t as TerenBazowy] = (countByTerrain[t as TerenBazowy] ?? 0) + 1;
    if (t === TerenBazowy.Gory) {
      if (styledTerrain) goraVarCount[wariantDlaHeksa(hex.coords.q, hex.coords.r, NW, map.seed)]!++;
    }
    if (t === TerenBazowy.Wzgorza) {
      if (styledTerrain) wzgorzeVarCount[wariantDlaHeksa(hex.coords.q, hex.coords.r, NW, map.seed)]!++;
    }
  }
  // LITERAL scene.ts:1760-1790 (bez materiałów kolorów — nie wpływają na raycast)
  const instancedMeshes: THREE.InstancedMesh[] = [];
  const terrainPickKeys = new Map<THREE.InstancedMesh, string[]>();
  const terrainIndex: Partial<Record<TerenBazowy, number>> = {};
  const terrainTypes = Object.values(TerenBazowy);
  for (const t of terrainTypes) {
    const cnt = countByTerrain[t] ?? 0;
    if (cnt === 0) continue;
    const vis = terrainVis(t, renderStyle);
    const hexR = renderStyle === 'roblox' ? R * 1.008 : R * 0.998;
    const geo = hexPrismNoBottomGeo(hexR, vis.height);
    const mat = new THREE.MeshLambertMaterial({});
    const mesh = new THREE.InstancedMesh(geo, mat, cnt);
    mesh.frustumCulled = false;
    instancedMeshes.push(mesh);
    terrainIndex[t] = instancedMeshes.length - 1;
  }
  const terrainInstanceIdx: Partial<Record<TerenBazowy, number>> = {};
  for (const t of terrainTypes) terrainInstanceIdx[t] = 0;
  // LITERAL scene.ts:1852-1872
  const goraInst: THREE.InstancedMesh[] = [];
  const wzgorzeInst: THREE.InstancedMesh[] = [];
  const goraHexKey: string[][] = [];
  const goraIdx: number[] = [];
  const wzgorzeHexKey: string[][] = [];
  const wzgorzeIdx: number[] = [];
  if (styledTerrain) {
    for (let v = 0; v < NW; v++) {
      const gm = new THREE.InstancedMesh(goraGeometria(v), TEREN_MATERIAL, Math.max(1, goraVarCount[v]!));
      gm.frustumCulled = false; gm.count = 0;
      goraInst.push(gm); goraHexKey.push([]); goraIdx.push(0);
      const wm = new THREE.InstancedMesh(wzgorzeGeometria(v), TEREN_MATERIAL, Math.max(1, wzgorzeVarCount[v]!));
      wm.frustumCulled = false; wm.count = 0;
      wzgorzeInst.push(wm); wzgorzeHexKey.push([]); wzgorzeIdx.push(0);
    }
  }
  const dummy = new THREE.Object3D();
  // LITERAL scene.ts:2088-2089
  const seaVisEarly = terrainVis(TerenBazowy.Morze, renderStyle);
  const seaSurfaceY = seaVisEarly.height + seaVisEarly.yOffset;
  const hexInstance = new Map<string, { mesh: THREE.InstancedMesh; index: number }>();
  const goraOrig: Array<{ v: number; i: number; key: string }> = [];
  const wzgOrig: Array<{ v: number; i: number; key: string }> = [];
  // LITERAL scene.ts:2213, 2246-2262, 2290-2309, 2414-2430, 2462-2480
  const c3Hexes = Object.values(map.hexes) as any[];
  for (let c3i = 0; c3i < c3Hexes.length; c3i++) {
    const hex = c3Hexes[c3i]!;
    const t   = hex.terenBazowy;
    const vis = terrainVis(t, renderStyle);
    const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, R);
    const coastalDrop = (
      renderStyle === 'roblox'
      && landCoastSandNeeded(map, hex.coords.q, hex.coords.r, t)
    ) ? R * 0.045 : 0;
    const surfaceTopY = vis.height + vis.yOffset - coastalDrop;
    let y = surfaceTopY - vis.height / 2;
    let scaleY = 1;
    if (renderStyle === 'roblox' && !isDryLandTeren(t)) {
      y = seaSurfaceY - vis.height / 2;
    }
    const hexKey = `${hex.coords.q},${hex.coords.r}`;
    const meshIdx = terrainIndex[t as TerenBazowy];
    const iIdx    = terrainInstanceIdx[t as TerenBazowy] ?? 0;
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
      hexInstance.set(hexKey, { mesh, index: iIdx });
      terrainInstanceIdx[t as TerenBazowy] = iIdx + 1;
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
        goraOrig.push({ v, i: gi, key: hexKey });
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
        wzgOrig.push({ v, i: wi, key: hexKey });
        wzgorzeIdx[v] = wi + 1;
      }
    }
  }
  // LITERAL scene.ts:2721-2727
  for (let v = 0; v < goraInst.length; v++) {
    goraInst[v]!.count = goraIdx[v]!;
    terrainPickKeys.set(goraInst[v]!, goraHexKey[v]!);
    wzgorzeInst[v]!.count = wzgorzeIdx[v]!;
    terrainPickKeys.set(wzgorzeInst[v]!, wzgorzeHexKey[v]!);
  }
  // LITERAL scene.ts:3684, 3691
  const terrainPickMeshes: THREE.InstancedMesh[] = [...instancedMeshes, ...goraInst, ...wzgorzeInst];
  refreshInstancedPickBounds(terrainPickMeshes);
  // MODEL (NIE LITERAL) — skutek mgły/miast/LOD na meshach pickingu, nie kopia kodu:
  //  - pryzm heksa ukrytego (sig === 2) → ZERO_MATRIX: scene.ts:3591-3592 (setFog);
  //  - bryły gór/wzgórz ukrytego heksa (bri <= 0) lub pod miastem (decorHiddenHexKeys)
  //    → ZERO_MATRIX: scene.ts:3281-3302 (applyTerrainFog) oraz 3145-3158 (hideInstancedOnHex)
  //    wołane z 3168-3184 (hideDecorAtHex);
  //  - LOD: visible = zoomFlags.styledDecor (scene.ts:3370-3375);
  //  - reguła ocean-hide (scene.ts:3629-3637) NIE jest modelowana (P4-10 §5 NIE_ZMIERZONO).
  for (const h of spec.hexes) {
    const key = `${h.q},${h.r}`;
    if (h.hidden) {
      const e = hexInstance.get(key)!;
      e.mesh.setMatrixAt(e.index, ZERO_MATRIX);
    }
    if (h.hidden || h.solidHidden) {
      for (const o of goraOrig) if (o.key === key) goraInst[o.v]!.setMatrixAt(o.i, ZERO_MATRIX);
      for (const o of wzgOrig) if (o.key === key) wzgorzeInst[o.v]!.setMatrixAt(o.i, ZERO_MATRIX);
    }
  }
  for (let v = 0; v < goraInst.length; v++) {
    goraInst[v]!.visible = spec.solidsVisible;
    wzgorzeInst[v]!.visible = spec.solidsVisible;
  }
  // LITERAL scene.ts:3088-3098
  function resolveTerrainPick(mesh: THREE.InstancedMesh, instanceId: number): { q: number; r: number } | null {
    const keys = terrainPickKeys.get(mesh);
    const key = keys?.[instanceId];
    if (!key) return null;
    const comma = key.indexOf(',');
    if (comma < 0) return null;
    const q = Number(key.slice(0, comma));
    const r = Number(key.slice(comma + 1));
    if (!Number.isFinite(q) || !Number.isFinite(r)) return null;
    return { q, r };
  }
  // unitRenderer.topYAt (units.ts:6409-6412): hexGrid = wszystkie heksy mapy
  const topYAt = (q: number, r: number) => {
    const hex = map.hexes[`${q},${r}`];
    return hex ? terrainTopY(hex) : 0;
  };
  // eksport macierzy instancji (Float32) — do porównania z budową sceny w Rust
  const instances: any[] = [];
  terrainPickMeshes.forEach((m, mi) => {
    const keys = terrainPickKeys.get(m) ?? [];
    for (let i = 0; i < m.count; i++) {
      instances.push({ mesh: mi, i, key: keys[i] ?? null, m: Array.from(m.instanceMatrix.array.slice(i * 16, i * 16 + 16)) });
    }
  });
  return { map, terrainPickMeshes, resolveTerrainPick, topYAt, instances };
}

// ---------------------------------------------------------------------------
// Jednostki (syntetyczne modele; reguła wyboru = LITERAL units.ts:5867-5893 + main.ts:1894-1901)
interface UnitSpec { id: string; q: number; r: number; kind: 'box' | 'tall' | 'flag'; yaw: number; dx?: number; dz?: number }
function buildUnitToken(u: UnitSpec, topYAt: (q: number, r: number) => number, terrain: (q: number, r: number) => TerenBazowy | undefined) {
  const g = new THREE.Group();
  g.userData['unitId'] = u.id;
  const { x, z } = axialToWorld(u.q, u.r, HEX_R);
  const t = terrain(u.q, u.r);
  const y = topYAt(u.q, u.r) + (t ? unitTerrainRelief(t) : 0);
  g.position.set(x + (u.dx ?? 0), y, z + (u.dz ?? 0));
  g.rotation.set(0, u.yaw, 0);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 12), new THREE.MeshStandardMaterial());
  base.position.set(0, 0.04, 0);
  g.add(base);
  if (u.kind === 'box' || u.kind === 'flag') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.16), new THREE.MeshStandardMaterial());
    body.position.set(0, 0.29, 0);
    g.add(body);
  }
  if (u.kind === 'tall') {
    const spear = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 0.05), new THREE.MeshStandardMaterial());
    spear.position.set(0.15, 0.6, -0.55);
    spear.rotation.set(0.9, 0, 0.15);
    g.add(spear);
  }
  if (u.kind === 'flag') {
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }));
    flag.position.set(0.0, 0.75, -0.3);
    flag.rotation.set(-0.4, 0.3, 0);
    g.add(flag);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshStandardMaterial({ side: THREE.BackSide }));
    back.position.set(0.3, 0.55, 0.1);
    back.rotation.set(0.2, 2.6, 0);
    g.add(back);
  }
  g.updateMatrixWorld(true);
  return g;
}
function exportTokenMeshes(g: THREE.Group) {
  const out: any[] = [];
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const geo = m.geometry;
    const side = (m.material as THREE.Material).side;
    out.push({
      pos: Array.from(geo.attributes.position!.array as Float32Array),
      index: geo.index ? Array.from(geo.index.array as Uint16Array) : null,
      world: Array.from(m.matrixWorld.elements),
      side: side === THREE.FrontSide ? 'front' : side === THREE.BackSide ? 'back' : 'double',
    });
  });
  return out;
}

// ---------------------------------------------------------------------------
// Kamera: PerspectiveCamera z scene.ts:3075-3085 + CameraController (camera.ts) z
// nadpisanym target/dist i _syncCamera (camera.ts:130-144).
function makeCamera(spec: MapSpec, vpW: number, vpH: number, tx: number, tz: number, dist: number) {
  const R = HEX_R;
  const center = mapCenter(spec.W, spec.H, R);
  // LITERAL scene.ts:2997-2999, 3074-3085
  const mapMaxDim = Math.max(spec.W, spec.H);
  const mapSpanForCam = mapMaxDim * R * 1.85;
  const maxZoomDist = Math.max(320, mapSpanForCam * 1.2);
  const farClip = Math.max(1200, maxZoomDist * 5, mapMaxDim * R * 6);
  const camAspect = vpW / vpH;
  const camera = new THREE.PerspectiveCamera(50, camAspect, 0.5, farClip);
  const camDist = Math.max(spec.W, spec.H) * R * 1.65;
  camera.position.set(center.x, camDist * 0.9, center.z + camDist * 0.7);
  camera.lookAt(center.x, 0, center.z);
  const canvasStub: any = { addEventListener() {}, removeEventListener() {} };
  const ctrl: any = new CameraController(camera, canvasStub, { x: center.x, z: center.z }, { minDist: 8 / 3, maxDist: maxZoomDist });
  ctrl.target.x = tx; ctrl.target.z = tz; ctrl.dist = dist;
  ctrl._syncCamera();
  // scene.ts:3105-3106 onResize
  camera.aspect = vpW / vpH;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return { camera, farClip, maxZoomDist };
}

function projectToClient(p: THREE.Vector3, camera: THREE.Camera, rect: any) {
  const v = p.clone().project(camera);
  return { x: rect.left + (v.x * 0.5 + 0.5) * rect.width, y: rect.top + (-v.y * 0.5 + 0.5) * rect.height };
}

// ---------------------------------------------------------------------------
// Mapy testowe
function lcg(seed: number) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

function mapA(): MapSpec {
  // 9x7, ręcznie: rząd morza, wybrzeże, ląd z plażą, wzgórza/góry przy sobie i przy niskim terenie.
  const rows = [
    'MMMMMMMMM',
    'MPPPPPPMM',
    'PLRDLWGPM',
    'PLWGGWLRP',
    'PDRWGLOLP',
    'MPLRWDLPM',
    'MMPPPPPMM',
  ];
  const T: Record<string, TerenBazowy> = {
    M: TerenBazowy.Morze, P: TerenBazowy.PlytkieMorze, L: TerenBazowy.Laka, R: TerenBazowy.Rownina,
    D: TerenBazowy.Pustynia, W: TerenBazowy.Wzgorza, G: TerenBazowy.Gory, O: TerenBazowy.Polarny,
  };
  const hexes: MapSpec['hexes'] = [];
  for (let r = 0; r < rows.length; r++) for (let q = 0; q < rows[r]!.length; q++) {
    hexes.push({ q, r, t: T[rows[r]![q]!]! });
  }
  return { name: 'A', seed: 12345, W: 9, H: 7, hexes, solidsVisible: true };
}
function mapB(): MapSpec {
  // 12x9 pseudolosowa, z mgłą, bryłą ukrytą (miasto), tarasami i dziurami w siatce.
  const rnd = lcg(777);
  const all = Object.values(TerenBazowy);
  const hexes: MapSpec['hexes'] = [];
  for (let r = 0; r < 9; r++) for (let q = 0; q < 12; q++) {
    if ((q === 5 && r === 4) || (q === 0 && r === 8)) continue; // dziury
    const t = all[Math.floor(rnd() * all.length)]!;
    const hidden = (q >= 9 && r <= 2) || (q <= 1 && r >= 6);
    const solidHidden = q === 3 && r === 3;
    const tarasy = t === TerenBazowy.Wzgorza && q === 7;
    hexes.push({ q, r, t, hidden, solidHidden, tarasy });
  }
  // kolejność wstawiania kluczy nie po wierszach (Object.values zachowuje kolejność wstawiania)
  hexes.reverse();
  return { name: 'B', seed: -42, W: 12, H: 9, hexes, solidsVisible: true };
}
function mapC(): MapSpec {
  // jak A, ale bryły niewidoczne (LOD: zoomFlags.styledDecor=false) — ujemne q/r w kadrze.
  const a = mapA();
  return { ...a, name: 'C', hexes: a.hexes.map(h => ({ ...h, q: h.q - 4, r: h.r - 3 })), solidsVisible: false };
}
function mapE(): MapSpec {
  // 8x6 prawie cała pod mgłą (ścieżka awaryjna y=0 → y=topYAt): Wybrzeże (0,22 vs 0,18),
  // ląd z plażą (topYAt bez coastalDrop), wzgórza, góry; jedno okno odsłonięte.
  const rows = ['MPPLLWGG', 'PPLRWWGO', 'MPDLRLPP', 'PPPPLDRP', 'MMPPPPMM', 'MMMPPMMM'];
  const T: Record<string, TerenBazowy> = {
    M: TerenBazowy.Morze, P: TerenBazowy.PlytkieMorze, L: TerenBazowy.Laka, R: TerenBazowy.Rownina,
    D: TerenBazowy.Pustynia, W: TerenBazowy.Wzgorza, G: TerenBazowy.Gory, O: TerenBazowy.Polarny,
  };
  const hexes: MapSpec['hexes'] = [];
  for (let r = 0; r < rows.length; r++) for (let q = 0; q < rows[r]!.length; q++) {
    hexes.push({ q, r, t: T[rows[r]![q]!]!, hidden: !(q >= 3 && q <= 4 && r >= 2 && r <= 3) });
  }
  return { name: 'E', seed: 2026, W: 8, H: 6, hexes, solidsVisible: true };
}
function mapD(): MapSpec {
  // płaska Łąka 7x7 (wszystkie wierzchy na 0,46) — pas nakładania 1,008R bez schodków.
  const hexes: MapSpec['hexes'] = [];
  for (let r = 0; r < 7; r++) for (let q = 0; q < 7; q++) hexes.push({ q, r, t: (q + r) % 3 === 0 ? TerenBazowy.Rownina : TerenBazowy.Laka });
  return { name: 'D', seed: 1, W: 7, H: 7, hexes, solidsVisible: true };
}

// ---------------------------------------------------------------------------
const golden: any = { generator: 'refscript/gen.ts', three: THREE.REVISION, scenarios: [] };
const sceneDump: any = { maps: {} };
const solidsDump: any = { gora: [], wzgorze: [] };
for (let v = 0; v < LICZBA_WARIANTOW_TERENU; v++) {
  solidsDump.gora.push(Array.from(goraGeometria(v).attributes.position!.array as Float32Array));
  solidsDump.wzgorze.push(Array.from(wzgorzeGeometria(v).attributes.position!.array as Float32Array));
}
const prismDump: any = {};

const maps = [mapA(), mapB(), mapC(), mapD(), mapE()];
const viewports = [
  { left: 0, top: 0, width: 1280, height: 720 },
  { left: 37.5, top: 12, width: 800, height: 600 },
  { left: 0, top: 56, width: 375, height: 812 },
];

const unitsFor: Record<string, UnitSpec[]> = {
  A: [
    { id: 'u-gora', q: 4, r: 3, kind: 'tall', yaw: 0.3 },
    { id: 'u-laka', q: 1, r: 2, kind: 'flag', yaw: 1.1 },
    { id: 'u-miasto', q: 3, r: 4, kind: 'box', yaw: 0, dx: 0.42, dz: 0.38 }, // offset jak na mieście → wystaje nad sąsiada
    { id: 'u-woda', q: 2, r: 1, kind: 'box', yaw: 2.0 },
  ],
  B: [
    { id: 'b1', q: 6, r: 4, kind: 'tall', yaw: -0.7 },
    { id: 'b2', q: 2, r: 2, kind: 'flag', yaw: 0.5 },
  ],
  C: [], D: [], E: [],
};

for (const spec of maps) {
  const built = buildPickScene(spec);
  sceneDump.maps[spec.name] = {
    seed: spec.seed, W: spec.W, H: spec.H, solidsVisible: spec.solidsVisible,
    hexes: spec.hexes.map(h => ({ q: h.q, r: h.r, t: h.t, hidden: !!h.hidden, solidHidden: !!h.solidHidden, tarasy: !!h.tarasy })),
    instances: built.instances,
    units: (unitsFor[spec.name] ?? []).map((u) => { const g = buildUnitToken(u, built.topYAt, (q, r) => built.map.hexes[`${q},${r}`]?.terenBazowy); return { id: u.id, q: u.q, r: u.r, meshes: exportTokenMeshes(g) }; }),
    meshKinds: built.terrainPickMeshes.map((m) => m.geometry.type === 'CylinderGeometry' ? 'prism' : m.geometry.name),
  };
  for (const m of built.terrainPickMeshes) {
    if (m.geometry.type === 'CylinderGeometry') {
      const p = (m.geometry as THREE.CylinderGeometry).parameters;
      prismDump[String(p.height)] = { radius: p.radiusTop, height: p.height, pos: Array.from(m.geometry.attributes.position!.array as Float32Array), index: Array.from(m.geometry.index!.array as Uint16Array) };
    }
  }
  const terrainOf = (q: number, r: number) => built.map.hexes[`${q},${r}`]?.terenBazowy as TerenBazowy | undefined;
  const tokens = (unitsFor[spec.name] ?? []).map(u => ({ u, g: buildUnitToken(u, built.topYAt, terrainOf) }));
  const center = mapCenter(spec.W, spec.H, HEX_R);
  const cams = [
    { tx: center.x, tz: center.z, dist: 8 / 3 },
    { tx: center.x, tz: center.z, dist: 6.5 },
    { tx: center.x - 2.3, tz: center.z + 1.7, dist: 11 },
    { tx: center.x, tz: center.z, dist: 24 },
  ];
  if (spec.name === 'A') cams.push({ tx: center.x, tz: center.z, dist: 320 });
  for (let ci = 0; ci < cams.length; ci++) for (let vi = 0; vi < viewports.length; vi++) {
    const cam = cams[ci]!;
    const rect = viewports[vi]!;
    if (spec.name !== 'A' && vi === 2 && ci > 1) continue;
    const { camera, farClip } = makeCamera(spec, rect.width, rect.height, cam.tx, cam.tz, cam.dist);
    const canvas: any = { getBoundingClientRect: () => rect };
    // LITERAL units.ts:5867-5893 (this.tokens → tokens)
    function pickUnitIdAt(clientX: number, clientY: number, canvas: any, camera: THREE.Camera): string | null {
      const rect = canvas.getBoundingClientRect();
      const ndc = clientRectToNdc(clientX, clientY, rect);
      if (!ndc) return null;
      camera.updateMatrixWorld(true);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), camera);
      const roots = tokens.map(t => t.g).filter((o) => o.visible);
      if (roots.length === 0) return null;
      const hits = raycaster.intersectObjects(roots, true);
      for (const h of hits) {
        let obj: THREE.Object3D | null = h.object;
        while (obj) {
          const uid = obj.userData['unitId'];
          if (typeof uid === 'string' && uid.length > 0) return uid;
          obj = obj.parent;
        }
      }
      return null;
    }
    // LITERAL main.ts:1885-1901
    function pickHexAt(clientX: number, clientY: number): { q: number; r: number } | null {
      return pixelToHex(
        clientX, clientY, canvas, camera, HEX_R,
        built.terrainPickMeshes, built.resolveTerrainPick,
        (q, r) => built.topYAt(q, r),
      );
    }
    function pickMapTarget(clientX: number, clientY: number): { q: number; r: number } | null {
      const unitId = pickUnitIdAt(clientX, clientY, canvas, camera);
      if (unitId) {
        const u = tokens.map(t => t.u).find((x) => x.id === unitId);
        if (u) return { q: u.q, r: u.r };
      }
      return pickHexAt(clientX, clientY);
    }
    // --- punkty
    const pts: Array<{ x: number; y: number; tag: string }> = [];
    const GX = 12, GY = 7;
    for (let j = 0; j <= GY; j++) for (let i = 0; i <= GX; i++) {
      pts.push({ x: rect.left + (i / GX) * rect.width, y: rect.top + (j / GY) * rect.height, tag: 'grid' });
    }
    // punkty celowane (rzut punktów świata): środki, rogi, krawędzie, pas 1,008R, boki pryzmów, bryły
    const vis = (t: TerenBazowy) => terrainVis(t, 'roblox');
    for (const h of spec.hexes) {
      if (!h.hidden && (h.q * 7 + h.r * 3 + ci + vi) % 7 !== 0) continue;
      if (h.hidden && (h.q * 5 + h.r * 3 + ci + vi) % 5 !== 0) continue;
      const { x, z } = axialToWorld(h.q, h.r, HEX_R);
      const top = vis(h.t).height + vis(h.t).yOffset;
      const add = (wx: number, wy: number, wz: number, tag: string) => {
        const c = projectToClient(new THREE.Vector3(wx, wy, wz), camera, rect);
        if (c.x >= rect.left - 2 && c.x <= rect.left + rect.width + 2 && c.y >= rect.top - 2 && c.y <= rect.top + rect.height + 2) pts.push({ x: c.x, y: c.y, tag });
      };
      add(x, top, z, 'center');
      for (let k = 0; k < 6; k++) {
        const a = Math.PI / 2 + k * Math.PI / 3;
        const a2 = Math.PI / 2 + (k + 1) * Math.PI / 3;
        add(x + Math.cos(a), top, z + Math.sin(a), 'corner');
        const mx = (Math.cos(a) + Math.cos(a2)) / 2, mz = (Math.sin(a) + Math.sin(a2)) / 2;
        add(x + mx, top, z + mz, 'edge');
        add(x + mx * 1.004, top, z + mz * 1.004, 'overlap');
        add(x + mx * 0.999, top, z + mz * 0.999, 'edge-in');
        add(x + mx * 1.001, top, z + mz * 1.001, 'edge-out');
        add(x + mx * 1.008, top - 0.06, z + mz * 1.008, 'side');
        add(x + mx * 1.008, top - 0.15, z + mz * 1.008, 'side-low');
      }
      if (h.hidden) {
        // ścieżka awaryjna: punkty na płaszczyznach pomiędzy/na topYAt, przy krawędziach
        for (let k = 0; k < 6; k++) {
          const a = Math.PI / 2 + k * Math.PI / 3, a2 = Math.PI / 2 + (k + 1) * Math.PI / 3;
          const mx = (Math.cos(a) + Math.cos(a2)) / 2, mz = (Math.sin(a) + Math.sin(a2)) / 2;
          for (const f of [0.97, 1.0, 1.03]) for (const yy of [0.2, top]) add(x + mx * f, yy, z + mz * f, 'fog');
        }
      }
      if (h.t === TerenBazowy.Gory || h.t === TerenBazowy.Wzgorza) {
        for (const hh of [0.15, 0.3, 0.5, 0.7]) for (const rr of [0, 0.3, 0.6]) add(x + rr * 0.7, top + hh, z + rr * 0.7, 'solid');
        add(x, top + 0.9, z - 0.2, 'solid-peak');
      }
    }
    for (const { g } of tokens) {
      const bb = new THREE.Box3().setFromObject(g);
      for (let k = 0; k < 9; k++) {
        const p = new THREE.Vector3(
          bb.min.x + (bb.max.x - bb.min.x) * ((k % 3) / 2),
          bb.min.y + (bb.max.y - bb.min.y) * (0.3 + 0.2 * Math.floor(k / 3)),
          bb.min.z + (bb.max.z - bb.min.z) * ((k * 5 % 3) / 2),
        );
        const c = projectToClient(p, camera, rect);
        pts.push({ x: c.x, y: c.y, tag: 'unit' });
      }
    }
    // punkty dokładnie na pikselach całkowitych w pobliżu środka (typowe zdarzenia myszy)
    for (let k = 0; k < 12; k++) pts.push({ x: Math.round(rect.left + rect.width * (0.3 + 0.035 * k)), y: Math.round(rect.top + rect.height * (0.62 - 0.02 * k)), tag: 'int' });
    const results = pts.map((p) => {
      const tgt = pickMapTarget(p.x, p.y);
      const hexOnly = pickHexAt(p.x, p.y);
      const o: any = { x: p.x, y: p.y, k: p.tag, h: hexOnly ? [hexOnly.q, hexOnly.r] : null };
      if (JSON.stringify(tgt) !== JSON.stringify(hexOnly)) o.t = tgt ? [tgt.q, tgt.r] : null;
      return o;
    });
    // kontrola matematyki kamery: promień Three dla kilku NDC
    const rays = [[0, 0], [-1, 1], [1, -1], [0.37, -0.81], [-0.999, 0.5]].map(([nx, ny]) => {
      const rc = new THREE.Raycaster();
      rc.setFromCamera(new THREE.Vector2(nx!, ny!), camera);
      return { ndc: [nx, ny], o: rc.ray.origin.toArray(), d: rc.ray.direction.toArray() };
    });
    golden.scenarios.push({
      map: spec.name, rect, camera: { tx: cam.tx, tz: cam.tz, dist: cam.dist, far: farClip },
      cameraMatrixWorld: Array.from(camera.matrixWorld.elements),
      projection: Array.from(camera.projectionMatrix.elements),
      projectionInverse: Array.from(camera.projectionMatrixInverse.elements),
      rays,
      points: results,
    });
  }
}

// ---------------------------------------------------------------------------
// worldToAxial (oba warianty) i Math.round — wektory czystych funkcji
const w2a: any[] = [];
const addW = (x: number, z: number, tag: string) => {
  const a = worldToAxial(x, z, HEX_R);
  const b = worldToAxialHexutil(x, z, HEX_R);
  w2a.push({ x, z, tag, picker: [a.q, a.r], hexutil: [b.q, b.r] });
};
const SQ3 = Math.sqrt(3);
for (let r = -3; r <= 3; r++) for (let q = -3; q <= 3; q++) {
  const c = axialToWorld(q, r, HEX_R);
  addW(c.x, c.z, 'center');
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 2 + k * Math.PI / 3;
    addW(c.x + Math.cos(a), c.z + Math.sin(a), 'corner');
    const a2 = Math.PI / 2 + (k + 1) * Math.PI / 3;
    addW(c.x + (Math.cos(a) + Math.cos(a2)) / 2, c.z + (Math.sin(a) + Math.sin(a2)) / 2, 'edge-mid');
  }
}
// konstruowane remisy: frakcyjne aksjalne z resztami 0,5 / równymi resztami
const fr = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5, -1.25, 0.25, 1.75, -0.75, 1 / 3, -1 / 3, 2 / 3, -2 / 3];
for (const qf of fr) for (const rf of fr) {
  addW(SQ3 * (qf + rf / 2), 1.5 * rf, 'frac');
}
const rnd = lcg(99);
for (let i = 0; i < 400; i++) addW((rnd() - 0.5) * 60, (rnd() - 0.5) * 60, 'random');
const roundVals = [0.5, -0.5, 1.5, -1.5, 2.5, -2.5, 0.49999999999999994, -0.49999999999999994, 4503599627370497, -4503599627370497, 4503599627370496.5, -0, 0, -1e-300, 1e-300, 1.4999999999999998, -1.5000000000000002, 123456.5, -123456.5, -7.5, 7.5, 2 ** 52 + 0.5, -(2 ** 52) - 0.5];
const roundDump = roundVals.map(v => ({ v, round: Math.round(v) }));
const ndcDump = [
  [100, 200, { left: 0, top: 0, width: 1280, height: 720 }],
  [37.5, 12, { left: 37.5, top: 12, width: 800, height: 600 }],
  [837.5, 612, { left: 37.5, top: 12, width: 800, height: 600 }],
  [5, 5, { left: 0, top: 0, width: 0, height: 10 }],
  [5, 5, { left: 0, top: 0, width: 10, height: -1 }],
  [333.3, 444.4, { left: 0.5, top: 56, width: 375, height: 812 }],
].map(([x, y, rect]) => ({ x, y, rect, ndc: clientRectToNdc(x as number, y as number, rect as any) }));

fs.writeFileSync(path.join(OUT, 'golden_pick.json'), JSON.stringify(golden));
fs.writeFileSync(path.join(OUT, 'scenes.json'), JSON.stringify(sceneDump));
fs.writeFileSync(path.join(OUT, 'geometry.json'), JSON.stringify({ solids: solidsDump, prisms: prismDump }));
fs.writeFileSync(path.join(OUT, 'math.json'), JSON.stringify({ worldToAxial: w2a, mathRound: roundDump, clientRectToNdc: ndcDump }));
let total = 0;
for (const s of golden.scenarios) total += s.points.length;
console.log(`scenarios=${golden.scenarios.length} points=${total} w2a=${w2a.length} round=${roundDump.length} ndc=${ndcDump.length}`);
```

### 7.1 Adaptacje względem tekstu źródła weba (obrona r1, zarzuty Evaluatora 1–2)

Etykieta `// LITERAL <plik>:<linie>` w `gen.ts` oznacza **tę samą logikę i arytmetykę w tej samej kolejności**, a nie kopię znak po znaku.
Wcześniejsze sformułowanie „dosłowne kopie” było nieprecyzyjne. Pełna lista adaptacji (żadna nie zmienia wartości trafiających do raycastu):

| Fragment | Adaptacja | Dlaczego neutralna dla pickingu |
|---|---|---|
| wszystkie `LITERAL` | typy TS → `any` / usunięte; komentarze źródła usunięte | wymazanie typów |
| `terrainVis` (`scene.ts:166-170`) | `TERRAIN_VISUALS[t]` → `{ height: 0, yOffset: 0 }`, bez `color` | dla stylu `roblox` `terrainVisualForStyle` ignoruje spec civ (`mapRenderStyle.ts:231`) |
| `terrainTopY` (`units.ts:214-224`) | `CIV_TERRAIN_TOP[...]` → `{ height: 0, yOffset: 0 }` | jak wyżej |
| pętla rozmieszczenia (`scene.ts:1702-2727`) | `styledTerrain = true`; z ternarów `renderStyle` tylko gałąź `roblox`; `B_NO_BOTTOM` ustalone na `true` | portowany jest wyłącznie styl `roblox` (decyzja właściciela) |
| pętla rozmieszczenia | usunięte materiały/kolory, `castShadow`, `scene.add`, `performance.*`, `*OrigMatrix` | bez wpływu na geometrię, macierze instancji i kolejność trafień |
| `pickUnitIdAt` (`units.ts:5867-5893`) | `this.tokens` → lokalne `tokens` (syntetyczne modele) | reguła wyboru bez zmian |

**MODEL, nie kopia — mgła / miasta / LOD** (blok bezpośrednio po `LITERAL scene.ts:3684, 3691`, teraz oznaczony `// MODEL (NIE LITERAL)`):
- pryzm heksa ukrytego (`sig === 2`) → `ZERO_MATRIX`, jak `setFog` `scene.ts:3591-3592`;
- bryły gór/wzgórz heksa ukrytego (`bri <= 0`) lub pod miastem → `ZERO_MATRIX`, jak `applyTerrainFog` `scene.ts:3281-3302`
  oraz `hideInstancedOnHex` `scene.ts:3145-3158` wołane z `hideDecorAtHex` `scene.ts:3168-3184`;
- LOD: `visible = zoomFlags.styledDecor` (`scene.ts:3370-3375`);
- reguła **ocean-hide** roblox (`scene.ts:3629-3637`) **nie** jest modelowana — `NIE_ZMIERZONO` (§5.1).

Dowód neutralności poprawki: zmiana `gen.ts` dotyczy wyłącznie komentarzy; regeneracja świeżym `git archive edb8fb56` +
three@0.169.0 + esbuild@0.24.0 (node v22.22.0) dała `scenarios=55 points=20174 w2a=1233 round=23 ndc=6` i SHA-256 czterech JSON-ów
identyczne z powyższymi (bit w bit z fixtures w repo).

Uwaga do zarzutu 3 (odrzucony): `main.ts:1885-1901` jest poprawne — `git show edb8fb56:gra/src/main.ts | grep -n` daje
`1885: function pickHexAt`, `1894: function pickMapTarget`, a zamykające `}` `pickMapTarget` jest w linii 1901 (1884 jest pusta, 1900 to
`return pickHexAt(clientX, clientY);`).

## 8. Bramki — pełne surowe logi

Środowisko: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_7fb21ca5-e1d-1 CARGO_PROFILE_DEV_DEBUG=0`, katalog `rust-port/renderer`, rustc 1.97.0, cargo 1.97.0.

### 8.1 `cargo fmt --all -- --check; echo "EXIT=$?"`

```text
EXIT=0
```

### 8.2 `cargo clippy --locked --all-targets -- -D warnings; echo "EXIT=$?"`

```text
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_7fb21ca5-e1d-1/rust-port/renderer)
    Finished `dev` profile [unoptimized] target(s) in 0.64s
EXIT=0
```

### 8.3 `cargo test --locked --all-targets; echo "EXIT=$?"`

```text
    Finished `test` profile [unoptimized] target(s) in 0.15s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_7fb21ca5-e1d-1/debug/deps/civ_renderer-d95024f3ec20cfd9)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/cpu_sanity.rs (/home/user/cargo-target-shared/wf_7fb21ca5-e1d-1/debug/deps/cpu_sanity-7ee07d9f2002230a)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/gpu_probe.rs (/home/user/cargo-target-shared/wf_7fb21ca5-e1d-1/debug/deps/gpu_probe-08e2d2a6c2a7bdae)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pick_golden.rs (/home/user/cargo-target-shared/wf_7fb21ca5-e1d-1/debug/deps/pick_golden-b6b94fb9d9c318d1)

running 7 tests
test js_round_matches_math_round ... ok
test client_rect_to_ndc_matches_web ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test world_to_axial_both_variants_match_web ... ok
test terrain_scene_instances_are_bitwise_web ... ok
test camera_matrices_and_rays_are_bitwise_three ... ok
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.96s

EXIT=0
```

### 8.4 Dodatkowo: `cargo test --locked --test pick_golden -- --nocapture --test-threads=1; echo "EXIT=$?"` (statystyki pokrycia)

```text
    Finished `test` profile [unoptimized] target(s) in 0.07s
     Running tests/pick_golden.rs (/home/user/cargo-target-shared/wf_7fb21ca5-e1d-1/debug/deps/pick_golden-b6b94fb9d9c318d1)

running 7 tests
test camera_matrices_and_rays_are_bitwise_three ... camera rays compared bitwise: 275
ok
test client_rect_to_ndc_matches_web ... ok
test golden_picks_match_web_100_percent ... golden points: 20174, units-first wins: 339
by rule: {"PlaneCoarse": 2809, "PlaneRefined": 3805, "SideFallback": 985, "SideMatch": 557, "TopFace": 12018}
by point kind: {"center": 247, "corner": 1498, "edge": 1494, "edge-in": 1494, "edge-out": 1494, "fog": 1780, "grid": 5720, "int": 660, "overlap": 1494, "side": 1500, "side-low": 1518, "solid": 514, "solid-peak": 41, "unit": 720}
ok
test js_round_matches_math_round ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test terrain_scene_instances_are_bitwise_web ... instance matrices compared bitwise: 380
ok
test world_to_axial_both_variants_match_web ... worldToAxial vectors: 1233 (variants differ on 100)
ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.79s

EXIT=0
```

### 8.5 Dodatkowo (krok CI): `cargo clippy --locked --all-targets --features gpu -- -D warnings; echo "EXIT=$?"`

```text
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_7fb21ca5-e1d-1/rust-port/renderer)
    Finished `dev` profile [unoptimized] target(s) in 0.80s
EXIT=0
```

## 9. Allowlista i granice

- Zmienione: `rust-port/renderer/src/pick.rs` → `src/pick/mod.rs` + `src/pick/{three,hex,camera,raycast,terrain}.rs`,
  `rust-port/renderer/tests/pick_golden.rs`, `rust-port/renderer/tests/fixtures/pick/**`, ten dokument, `dyspozycje/autobot/runs/R-RUSTPORT-P4-10-PICKING-CPU-Q1/**`.
- Bez zmian: `lib.rs`, `Cargo.toml`, `Cargo.lock`, moduły innych tematów (`geom`, `camera`, `assets`, …), `rust-port/engine/**`, `src-tauri/**`, `gra/**`, `.github/**`.
- Uwaga dla RR-T2 (`camera`): `pick::camera` to samodzielna kopia matematyki kamery tylko do pickingu; po wejściu RR-T2 jego macierze
  muszą przejść ten sam test bitowy (`camera_matrices_and_rays_are_bitwise_three`).
- Uwaga dla RR-T4 (`geom`): `terrain::hex_prism_no_bottom` to lokalny odpowiednik `CylinderGeometry(r,r,h,6,1)`; może zostać zastąpiony
  builderem z `geom`, o ile test `prism_geometry_is_bitwise_three_cylinder` pozostanie zielony.
