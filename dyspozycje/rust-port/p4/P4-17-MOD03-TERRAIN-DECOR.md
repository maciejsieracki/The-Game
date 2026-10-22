# P4.17 — MOD-03: dekoracje terenu w Rust 1:1 z webem (R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1)

STATUS dokumentu: Operator, runda 1/5. Baza kodu: `rust-port/parity-v2` @ `d925acb3`. Pin weba: `edb8fb56`.

## 0. Skrót

- Nowy moduł `civ_renderer::decor` (`rust-port/renderer/src/decor/**`, 12 plików, ~5 000 LOC), podpięty jedną linią `pub mod decor;` w `src/lib.rs`.
- Port 1:1 ośmiu plików weba (§1). **34 współdzielone geometrie** (5 lasów + 5 dżungli + 5 wzgórz + 5 gór + 4 łąki + 4 równiny + 4 pustynie + 2 tarasy = 3 344 trójkąty), oaza, 15 builderów `mapRenderStyle` (styl roblox), `powierzchniaReliefuY`, `riverLod`.
- **Zgodność z uruchomionym kodem weba: bitowa, 0 rozbieżności na 525 623 porównanych skalarach** (6 testów, `tests/decor_web_parity.rs`): pozycje/normalne/kolory `Float32` wszystkich 34 wariantów, transformacje i `matrixWorld` 6 957 węzłów (939 + 301 obiektów), bounding boxy, kolory materiałów, 98 010 próbek funkcji hasza per heks (54 ziarna × 121 heksów × 15 funkcji; każdy wynik/wariant ≥ 50 próbek — asercja w teście), 25 968 wysokości reliefu, indeksy/sygnatury mgły rzek.
- Test mutacyjny: **30 mutantów, 25 zabitych**, 5 przeżyło — wszystkie 5 uzasadnione jako równoważne na zbiorze wejść (§5).
- Bramki: `fmt` EXIT=0, `clippy` (bez i z `--features gpu`) EXIT=0, `cargo test --locked --all-targets` EXIT=0 (§8, surowe logi).
- Ocena wzrokowa 1:1: **NIE_ZMIERZONO** (brak GPU) — lista do oceny po RR-T5 w §7.

## 1. Zakres: było / zrobione tu

| plik weba (`gra/src/render/`) | było przed tematem | zrobione tu (moduł `decor::…`) |
|---|---|---|
| `lasy-modele.ts` (440) | nic | `forest`: `wariantLasuDlaHeksa`, `rotacjaLasuDlaHeksa`, emitery `ringN/pien/blob/cone/pieniek/kloda`, `drzewoLisciaste`, `swierk`, `kepka`, `czesciLasu(0..4)`, `lasGeometria` (cache), `LAS_MATERIAL`, `buildLas`, `trojkatyLasu`, stałe |
| `djungla-modele.ts` (218) | nic | `jungle`: warianty/rotacje (sole 1319/1321), `palma`, `parasol`, `drzewoTrop`, `czesciDjungli(0..4)`, `djunglaGeometria`, `DJUNGLA_MATERIAL` |
| `teren-gory-wzgorza.ts` (509) | `hashHeksa`, `wariantDlaHeksa` (sól 911), `rotacjaDlaHeksa` w `pick::terrain` (P4.10) | `relief`: reużyte powyższe + `wariant_dla_heksa_salt` (parametr `salt` sygnatury weba), palety, `ring6/frustum/cone/rock/rampaSegm`, `czesciWzgorza/Gory(0..4)`, `wzgorzeGeometria`, `goraGeometria`, `TEREN_MATERIAL`, `buildWzgorze`, `buildGora`, **`powierzchniaReliefuY`** (raycast przez `pick::raycast`, P4.10), `trojkatyWariantu`, stałe |
| `dekor-laki-rowniny.ts` (463) | nic | `meadow`: `dekorDlaHeksa`, `rotacjaDekoru`, `rot2/ostrze/kepka/kamyk/okta/kwiatek/krzaczek/ciernisko/klos`, 4+4 kompozycje, geometrie, `DEKOR_MATERIAL`, buildery, `trojkatyDekoru` |
| `oaza-pustynia.ts` (578) | nic | `desert`: **`buildOaza()`** (Group: 3 tafle w podgrupie, 3 palmy, 4 krzaki, 2 głazy) + mikrodekor pustyni (`wydmka/slupek4/slupek3/czaszka`, 4 kompozycje, `dekorPustyniDlaHeksa`, `rotacjaDekoruPustyni`, `rotacjaOazy`, geometria, materiał, builder, `trojkatyDekoruPustyni`) |
| `tarasy-model.ts` (403) | nic | `terraces`: `tarasyWariantDlaHeksa` (sól 737), `punktLuku/stacjeLuku/polka/schodekRampy/przelaz/rzadekX`, `czesciTarasyW0/W3`, `tarasyGeometria`, `TARASY_MATERIAL`, `buildTarasy`, `trojkatyTarasow` |
| `mapRenderStyle.ts` (1996) — buildery | palety/wysokości/presety/`styleHillBumpSurfaceY`/`styleMountainPeakSurfaceY`/`galleryDecorSurfaceY`/`elevatedTerrainEdgeSurfaceY`/`styleTerrainColor` (`core::map_style`, P4.12); kolektory instancji brzegu, `computeRiverDeltaHexKeys`, `computeRiverMouthEdgeKeys`, `getCoastSharedGeometries`, `landCoastSandNeeded` (`terrain::coast`, P4.11) | `style` (styl roblox): `buildStyleForestCluster` (+ `addRobloxTree/Palm/JungleUmbrella`, `TREE_VARIANTS`, `forest/jungleForestTreeCountForHex`, `isWarmJungleForestHex` + `climateZoneAt` z `map/gen-helpers.ts`), `buildStyleMountainPeak`, `buildStyleHillBump`, `buildStyleTarasyTerrace` (`addSteppedTerraceHill` 'cultivated'), `reliefSurfaceSampler` (`ReliefSampler`), `buildGalleryBuildingPad`, `buildGalleryFortMount`, `buildStyleBeachRing`, `buildStyleCoastSandTopCap`, `buildStyleLandCoastSandCap`, `buildStyleCoastSandEdges`, `buildStyleCoastWaterCap`, `buildStyleDune`, `buildStyleOasis` |
| `riverLod.ts` (413) | nic | `river_lod`: kubełki (`createRiverBucket`, `queueRiverGeo`, `flushRiverBucket`, `mergeRiverBuckets` + `mergeGeometries` z atrybutem `color`), LOD (`riversVisibleAtLod`, `applyRiverLodVisibility`, `applyRiverVisibility`), mgła per heks (`computeRiverFogSig`, `buildRiverRibbonFull/FogIndex`, `needsRiverRibbonIndexUpdate`, `buildMergedRiverFull/FogIndex`, `computeMergedRiverFogSig`, `mergedRiverVisibleInFog`), stałe, `disposeRiverBuckets` |

Liczba wariantów zgodna z katalogiem P4.4 §4.2 (paczka 3): 5+5+2×5+2×4+4 = 32 + tarasy 2 = **34** (`geometries.json` → 34 rekordy, asercja w teście) + oaza + wybrzeże/rzeki.

Trójkąty na wariant (zmierzone z weba, `geometries.json`): las 144/176/164/150/158; dżungla 152/186/152/158/158; wzgórza 96/108/112/108/82; góry 98/120/126/144/88; łąka 18/31/28/20; równina 18/23/21/32; pustynia 23/35/33/28; tarasy W0 164, W3 190. Uwaga (informacyjnie, bez wpływu na port): komentarze w kodzie weba podają inaczej dla 2 wariantów — `dekor-laki-rowniny.ts:361` „(30 tri)” vs zmierzone 28, `oaza-pustynia.ts:513` „(38 tri)” vs zmierzone 35; port idzie za kodem, nie za komentarzem.

### Nie przeniesione (jawnie)

- `robloxCliffUnder` (`mapRenderStyle.ts:486-495`): funkcja prywatna bez wywołań (`grep -n robloxCliffUnder gra/src/render` → tylko definicja).
- Gałęzie `'minecraft'` i wczesne `return` dla `'civ'` wszystkich builderów, `addMinecraftSpruce`, `HILL_VARIANTS_MINECRAFT`, `MINECRAFT_MOUNTAIN_VARIANTS`, tryb `'natural'` `addSteppedTerraceHill` (używa go tylko gałąź minecraft `buildStyleHillBump`, `mapRenderStyle.ts:1023-1024`) — decyzja właściciela D-RR-8 = A (tylko styl roblox; `src/lib.rs` nagłówek).
- Kolektory instancji brzegu (`collectRobloxCoastWaterInst`, `collectRobloxLandCoastSandInst`) — już w `terrain::coast` (P4.11), nie duplikowane.

## 2. ZAŁOŻENIA (luki dispatchu rozstrzygnięte domyślnie)

- **Z1. Tylko styl roblox.** Buildery `style::*` nie mają parametru `style`; odpowiadają wywołaniu `('roblox', …)`. Podstawa: D-RR-8 = A (LEDGER 2026-10-21, cytowane w `rust-port/renderer/src/lib.rs`), `GAME_MAP_RENDER_STYLE = 'roblox'` (`mapRenderStyle.ts:40`).
- **Z2. `jsmath` P4.16 niedostępny.** Na `parity-v2` @ `d925acb3` brak `src/jsmath/**` (`ls rust-port/renderer/src` → brak). Użyto istniejących portów V8: `js_sin/js_cos` (`models::wonders::js_trig`, P4.14), `js_pow` (`terrain::jsmath`, P4.11), `js_hypot` (`terrain::coast`, P4.11), re-eksport w `decor::js`. Przy przepięciu P4.16 wystarczy zmienić 4 linie `pub use` w `decor/js.rs`.
- **Z3. `mouthEdges` jawnie.** Web liczy `computeRiverMouthEdgeKeys(map)`, gdy wołający nie poda (`mapRenderStyle.ts:1767,1825`); w Rust parametr jest obowiązkowy (wołający liczy go raz przez `terrain::coast::river_mouth_edges` — jak zaleca komentarz weba `:1713-1714`). Test sprawdza, że zbiory krawędzi ujść i delt z P4.11 są identyczne z webem na mapie testowej.
- **Z4. `scene.add` w `flushRiverBucket`.** Renderer Rust nie ma jeszcze obiektu sceny; `flush_river_bucket` zwraca `RiverBucketMesh` (z polem `visible`), który wstawia wołający. `dispose()` geometrii = zwolnienie `Arc` (CPU).
- **Z5. Poziom LOD jako `f64`** (`riversVisibleAtLod(level: number)` porównuje liczby JS).
- **Z6. Klucze heksów w `riverLod` jako `String` `"q,r"`** + `KeySet` z kolejnością wstawiania (jak JS `Set`).
- **Z7. `Raycaster.far = 5` nie stosowane** w `powierzchnia_reliefu_y`: geometrie mają `y ∈ [-0.05, 1.25]`, promień startuje z `y = 4` w dół, więc każde trafienie ma odległość ≤ 4.05 < 5 (komentarz w `relief.rs`); zgodność potwierdzona na 25 968 próbkach.

## 3. Architektura: drzewo sceny (bez trzeciego typu)

- Model = `core::scene::SceneNode` (P4.12): `Mesh { geometry: Arc<Geometry>, materials, material_array }` / `Group`; `Geometry` = `geom::Mesh` + atrybut `color`. Materiał jako dane (`Material`: rodzaj Lambert, kolor liniowy, `vertexColors`, `flatShading`).
- `SceneNode` nie ma pól `name` ani `renderOrder`, które buildery weba ustawiają (`las-l0`, `renderOrder = 2/3/1`). Bez zmiany `core/**` (poza allowlistą) dodano opakowanie `decor::DecorObject { root: SceneNode, meta: Vec<NodeMeta> }` — metadane w kolejności `traverse`. Drzewo pozostaje czystym `SceneNode`, więc działa z `core::fog_dim` i `core::merge_decor`.
- Różnica względem `models::wonders::model` (P4.14): cuda mają własne `Node`/`Primitive`/`LambertMaterial` z indeksem slotu materiału (lista materiałów na model, `userData.mats`); dekor nie współdzieli materiałów między meshami poza singletonami vertex-colour, a geometrie są współdzielone przez `Arc` (cache `OnceLock`, 1 instancja na wariant = odpowiednik cache modułu weba). Dekor nie wymienia danych z cudami, więc konwersja/trait nie była potrzebna; ujednolicenie obu typów to osobny temat (rekomendacja).
- `matrixWorld`, bbox: `decor::js::{world_matrices, bounding_box}` (kwaternion `setFromEuler` z `js_sin/js_cos`, bo `geom::Quat::from_euler` i `SceneNode::local_matrix` używają platformowego `sin/cos`, a `geom/**`, `core/**` są poza allowlistą).

## 4. Numeryka

- Wszystkie emitery liczą w f64 z zachowaniem kolejności operacji JS (np. `i * Math.PI / 3` vs `i * (Math.PI * 2 / n)` — oba warianty występują w różnych plikach weba i są odwzorowane osobno), zaokrąglenie do f32 raz (`Float32BufferAttribute`), normalne z `geom::Mesh::compute_vertex_normals` (P4.8).
- **Pomiar wpływu trygonometrii platformy:** mutant M01 (platformowe `sin/cos` zamiast V8) → 900 rozbieżności bitowych w builderach (pozycje/macierze świata), 0 w samych geometriach `Float32` (różnice ostatniego bitu f64 znikają po zaokrągleniu do f32). M13 (platformowy kwaternion) → 860 rozbieżności. Wniosek: port V8 `sin/cos` jest konieczny dla zgodności bitowej macierzy.
- `Math.atan2` — platformowe `f64::atan2` (jak P4.11): wywoływane tylko na 6 jednostkowych kierunkach osiowych; zgodne bitowo na 301 buildach wybrzeża (27 027 skalarów). Ryzyko szczątkowe dla innych libm (Windows/macOS): NIE_ZMIERZONO.
- `geom::cylinder/cone_geometry` używają platformowego `sin/cos` (znane ryzyko P4.14 §3): dla segmentów 4/5/6/8/16 użytych tutaj hashe geometrii są zgodne (5 733 meshe builderów + 333 wybrzeża), ale nie jest to dowód dla dowolnej liczby segmentów.

## 5. Weryfikacja

Metoda jak P4.11/P4.14: wektory z **uruchomionego kodu weba** (`git archive edb8fb56 gra/src gra/data` do scratch poza repo, `three@0.169.0`, `esbuild@0.24.0`, node v22.22.0; moduły importowane bez zmian; generator `tests/fixtures/decor/gen.ts`, opis `README.md`). Porównanie `to_bits` każdej liczby.

| test | zakres | skalary | rozbieżności |
|---|---|---:|---:|
| `shared_geometries_are_bit_identical_to_web` | 34 geometrie (pos/nor/col bit po bicie + hash), wrap wariantu `w ∈ [-11,12]` (tożsamość instancji), `trojkaty*`, 6 materiałów, stałe | 90 917 | 0 |
| `hex_hash_functions_match_web` | 15 funkcji × 54 ziarna × 121 heksów; `isWarmJungleForestHex` (7 wysokości mapy); asercja ≥ 50 próbek na każdy wynik | 98 543 | 0 |
| `builders_are_bit_identical_to_web` | 939 obiektów, 5 733 meshy: węzły (typ, rodzic, name, renderOrder, pos/rot/scale, cienie, `matrixWorld`), materiały, geometrie (liczności + FNV-1a), `Box3.setFromObject(…, true)`, `surfaceY` | 282 338 | 0 |
| `coast_builders_are_bit_identical_to_web` | mapa 127 heksów + 4 rzeki: krawędzie ujść/delty (P4.11) = web; 301 buildów wody/piasku | 27 027 | 0 |
| `relief_surface_height_matches_web` | `powierzchniaReliefuY` 112 kombinacji × (81 siatki + 150 losowych) punktów; 24 samplery | 25 968 | 0 |
| `river_lod_matches_web` | 6 scenariuszy kubełków (w tym `null` przy niezgodnych atrybutach), `mergeRiverBuckets`, LOD, 60 przypadków mgły | 830 | 0 |
| **razem** | | **525 623** | **0** |

### Test mutacyjny (30 mutantów, skrypt w `dyspozycje/autobot/runs/R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1/mutacje/`)

Zabite (25): M01 platformowe sin/cos (900), M02 warunek zamiany w `pushTri` `<`→`<=` (24 geom.), M03 `rgb` /256 (10 066), M04 `BLOB_JIT` (1 505), M06 pochylenie kępki (469), M08 `punktLuku` floor→ceil (1 850), M09 sól palety drzew (43 233), M10 renderOrder piasku (76), M11 mnożnik sygnatury mgły (84), M13 platformowy kwaternion (860), M15 próg klimatu (4), M16 `STAW_R` (3), M17 liście palmy dżungli (1 601), M19 faza koloru rządków tarasów (290), M20 próg wydmy (2), M21 zawijanie wariantu (64 227), M22 separator segmentów (60), M23 pusty reveal = null (32), M24 kierunek klucza ujścia (28), M25 nawinięcie tafli oazy (3), M26 próg palmy w dżungli (685), M27 wariant reliefu (316), M28 kolor krzewu tarasu (8), M29 język delty (74), M30 start promienia reliefu (6 896).

Przeżyły (5) — uzasadnienie:
- M05 `i * PI / 3` → `i * (PI / 3)` w `ring6`: różni się 1 ulp f64 tylko dla `i = 5` (`node -e` → `5 false`), różnica znika po zaokrągleniu pozycji do f32 (wyjściem jest `Float32`); równoważny na wyjściu.
- M07 `js_pow` → `powf` w palmie oazy: wejścia `t ∈ {0, 0.5, 1}` — wyniki identyczne; równoważny na tych wejściach (dla innych wejść `js_pow` jest wymagany, P4.11 §3).
- M12 `Side::Front` → `Double` w raycaście reliefu: promień pionowy z góry zawsze trafia najpierw ścianę skierowaną w górę (bryły bez den, ściany boczne skierowane na zewnątrz); równoważny dla promieni w dół na tych geometriach (25 968 próbek).
- M14 `js_hypot` → platformowe `hypot` w kępce: na tych wejściach identyczne; równoważny na wejściach.
- M18 strażnik `if (rx || ry || rz)` bez `rz` w `B()` oazy: domyślna rotacja to 0, więc pominięcie ustawienia nie zmienia wyniku; semantycznie równoważny.

## 6. Wektory referencyjne i SHA-256

Katalog `rust-port/renderer/tests/fixtures/decor/` (5,6 MB JSON łącznie, każdy plik < 4 MB; nic nie pominięto):

```text
cbb6d911ff6ca0a9fde71e1b8164a520d1bf30db2ed17866ae9474a38ca41215  gen.ts
36cb314f382beefe03b627f2f1d05685ead9d05d6c4187e6090289adc5ed4161  builders.json
6a98799ffc4389282cc053e751d805509d79bbac9c0684a1cabbac21e2ee71b7  geometries.json
c0a7fc8c938e9f23bf6cf0d6f994a15c82cc872910be35d6061b959a90cc5618  hashes.json
b175d081b21983613fa116adedba6eda244b6278c4257dd40fc61b000ddea529  relief.json
a1433275bbfc69dabf88097cb54e86008880c912383556e751408d58697a0efd  riverlod.json
```

Generator wypisuje: `decor geometries=34 builders=939 coast=301 relief=112 hashfns=15 rlcases=60`. Środowisko: node v22.22.0, three 0.169.0, esbuild 0.24.0, rustc 1.97.0, cargo 1.97.0. Scratch usunięty po pracy.

## 7. NIE_ZMIERZONO i lista do oceny wzrokiem po RR-T5

NIE_ZMIERZONO:
1. Ocena wizualna 1:1 (wymaga GPU i pipeline'u renderu, RR-T5).
2. Cieniowanie Lambert `flatShading` + `vertexColors` w wgpu (shader nie istnieje).
3. Platformy inne niż Linux/glibc dla `atan2` i walców/stożków `geom` (§4).
4. Integracja z warstwą instancjonowania (InstancedMesh map: lasy 5, dżungla 5, teren 10, dekor 8+4 draw calli) — renderer tej warstwy nie ma.

Do oceny wzrokiem po RR-T5 (zrzuty web vs Rust, jednakowa kamera, metoda P4.4 §5):
- 5 kęp lasu (rotacje 0°/60°), szczególnie L4 (pieńki z jasnym przekrojem, kłoda);
- 5 kęp dżungli (palmy 4 liście, parasole);
- 5 wzgórz + 5 gór (śnieżne czapy G0/G1/G4, iglice G2/G3, rampa W0, półka W3);
- tarasy W0/W3 nałożone na wzgórza W0/W3 przy tej samej rotacji (czy łuki trafiają w stok);
- mikrodekor łąk/równin/pustyni (kontrast z wierzchem pryzmu 0x94bf78 / 0xb0ca7e / 0xe0c88e);
- oaza (tafle wody, pochylone palmy) i stara oaza `buildStyleOasis`;
- wybrzeże: paski wody od strony Morza, piasek przy lądzie, delta (laguna + język), piasek na lądzie;
- stare kępy `buildStyleForestCluster` (las/dżungla), wydmy, pady galerii;
- mgła na dekorze (`core::fog_dim`) i scalanie (`core::merge_decor`) na tych modelach.

## 8. Bramki — surowe logi

Komendy z `rust-port/renderer/` (każda z `; echo "EXIT=$?"`):

`cargo fmt --all -- --check`
```text
EXIT=0
```

`cargo clippy --locked --all-targets -- -D warnings`
```text
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.04s
EXIT=0
```

`cargo clippy --locked --all-targets --features gpu -- -D warnings` (pełny log: `dyspozycje/autobot/runs/R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1/logs/clippy_gpu.txt`, 66 linii; ostatnie):
```text
    Checking wgpu-naga-bridge v30.0.1
    Checking wgpu-core-deps-windows-linux-android v30.0.1
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_b84d99df-bfb-1/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 35.95s
EXIT=0
```

`cargo test --locked --all-targets` (pełny log 212 linii: `…/logs/test.txt`; podsumowania wszystkich binarek testowych):
```text
     Running unittests src/lib.rs (target/debug/deps/civ_renderer-3390857ab33a1fe3)
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/assets_nturns.rs (target/debug/deps/assets_nturns-8f7d0ea4505dd8a8)
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.19s
     Running tests/assets_registry.rs (target/debug/deps/assets_registry-c3f9969dbcf4ae07)
test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
     Running tests/camera_web_parity.rs (target/debug/deps/camera_web_parity-ed19813f9fcbbf13)
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s
     Running tests/core_web_parity.rs (target/debug/deps/core_web_parity-27c98cd457a8290f)
test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
     Running tests/cpu_sanity.rs (target/debug/deps/cpu_sanity-0295d7bf5a63866f)
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/decor_web_parity.rs (target/debug/deps/decor_web_parity-faad5ae118a41e5c)
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.68s
     Running tests/geom_three_parity.rs (target/debug/deps/geom_three_parity-0f596b3cbdb71744)
test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s
     Running tests/gpu_probe.rs (target/debug/deps/gpu_probe-b90f27ad8c898393)
test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/pick_golden.rs (target/debug/deps/pick_golden-5edd88b94adda948)
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.51s
     Running tests/terrain_web_parity.rs (target/debug/deps/terrain_web_parity-7ed099e492a012e9)
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.35s
     Running tests/wonders_web_parity.rs (target/debug/deps/wonders_web_parity-d8d9a630ca3a6684)
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.23s
EXIT=0
```

`cargo test --locked --test decor_web_parity -- --nocapture --test-threads=1` (liczby porównań):
```text
test builders_are_bit_identical_to_web ... builders: [("buildDekorLaka", 9), ("buildDekorPustynia", 9), ("buildDekorRownina", 9), ("buildGalleryBuildingPad", 16), ("buildGalleryFortMount", 3), ("buildGora", 9), ("buildLas", 9), ("buildOaza", 1), ("buildStyleBeachRing", 2), ("buildStyleCoastSandTopCap", 2), ("buildStyleDune", 460), ("buildStyleForestCluster", 270), ("buildStyleHillBump", 60), ("buildStyleMountainPeak", 60), ("buildStyleOasis", 5), ("buildStyleTarasyTerrace", 4), ("buildTarasy", 2), ("buildWzgorze", 9)] meshes=5733
builders: scalars=282338 bit_diff=0
ok
test coast_builders_are_bit_identical_to_web ... coast: 301 builds, 333 meshes
coast: scalars=27027 bit_diff=0
ok
test hex_hash_functions_match_web ... hashes: 98010 samples, 54 seeds
hashes: scalars=98543 bit_diff=0
ok
test relief_surface_height_matches_web ... relief: 9197 positive heights
relief: scalars=25968 bit_diff=0
ok
test river_lod_matches_web ... riverlod: scalars=830 bit_diff=0
ok
test shared_geometries_are_bit_identical_to_web ... geometries: 34 variants, 3344 triangles
geometries: scalars=90917 bit_diff=0
ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.83s

EXIT=0
```

`git diff --check` (przed commitem, pliki śledzone) → bez wyjścia; `git diff --cached --check` po `git add` → patrz raport Operatora.

## 9. Rekomendacje (poza zakresem)

- Przepiąć `decor::js` na `jsmath` po scaleniu P4.16 (4 linie `pub use`).
- Ujednolicić drzewa `core::scene` i `models::wonders::model` (osobny temat) oraz dodać `name`/`renderOrder` do `SceneNode` (wtedy `DecorObject.meta` zniknie).
- `geom` na `js_sin/js_cos` (ryzyko walców/stożków, P4.14 §3).
