# P4.17 — MOD-03: dekoracje terenu w Rust 1:1 z webem (R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1)

STATUS dokumentu: Operator (obrona), runda 2/5. Baza kodu: `rust-port/parity-v2` @ `bf59164b` (zawiera P4.16 `jsmath`; runda 1 stała na `d925acb3`). Pin weba: `edb8fb56`. Odpowiedzi na zarzuty Evaluatora r1: §10.

## 0. Skrót

- Nowy moduł `civ_renderer::decor` (`rust-port/renderer/src/decor/**`, 12 plików, ~5 000 LOC), podpięty jedną linią `pub mod decor;` w `src/lib.rs`.
- Port 1:1 ośmiu plików weba (§1). **34 współdzielone geometrie** (5 lasów + 5 dżungli + 5 wzgórz + 5 gór + 4 łąki + 4 równiny + 4 pustynie + 2 tarasy = 3 344 trójkąty), oaza, 15 builderów `mapRenderStyle` (styl roblox), `powierzchniaReliefuY`, `riverLod`.
- **Zgodność z uruchomionym kodem weba: bitowa, 0 rozbieżności na 571 623 porównanych skalarach** (8 testów, `tests/decor_web_parity.rs`, w tym 2 strażniki źródła): pozycje/normalne/kolory `Float32` wszystkich 34 wariantów, transformacje i `matrixWorld` węzłów 939 + 500 + 301 obiektów, bounding boxy, kolory materiałów, 98 010 próbek funkcji hasza per heks (54 ziarna × 121 heksów × 15 funkcji; **każdy wynik każdej funkcji występuje dla ≥ 50 RÓŻNYCH ziaren** — asercja w teście), `buildStyleMountainPeak`/`buildStyleHillBump` i `reliefSurfaceSampler` z ≥ 50 różnymi ziarnami na wariant sylwetki (asercje), 29 468 wysokości reliefu, indeksy/sygnatury mgły rzek.
- Matematyka: wszystkie `Math.sin/cos/pow/hypot/atan2` przez `crate::jsmath` (P4.16); macierz lokalna z `core::scene::SceneNode::local_matrix`; stałe/funkcje z `core::map_style` i `pick::terrain` reużyte, nie skopiowane (strażniki źródła w teście).
- Test mutacyjny (runda 2): **36 mutantów, 33 zabite**, 3 przeżyły — uzasadnione jako równoważne (§5); M07/M14 opisane jako luka pokrycia numerycznego, zamknięta strażnikiem źródła i `jsmath_v8_parity`.
- Bramki: `fmt` EXIT=0, `clippy` (bez i z `--features gpu`) EXIT=0, `cargo test --locked --all-targets` EXIT=0 (§8, surowe logi).
- Ocena wzrokowa 1:1: **NIE_ZMIERZONO** (brak GPU) — lista do oceny po RR-T5 w §7.

## 1. Zakres: było / zrobione tu

| plik weba (`gra/src/render/`) | było przed tematem | zrobione tu (moduł `decor::…`) |
|---|---|---|
| `lasy-modele.ts` (440) | nic | `forest`: `wariantLasuDlaHeksa`, `rotacjaLasuDlaHeksa`, emitery `ringN/pien/blob/cone/pieniek/kloda`, `drzewoLisciaste`, `swierk`, `kepka`, `czesciLasu(0..4)`, `lasGeometria` (cache), `LAS_MATERIAL`, `buildLas`, `trojkatyLasu`, stałe |
| `djungla-modele.ts` (218) | nic | `jungle`: warianty/rotacje (sole 1319/1321), `palma`, `parasol`, `drzewoTrop`, `czesciDjungli(0..4)`, `djunglaGeometria`, `DJUNGLA_MATERIAL` |
| `teren-gory-wzgorza.ts` (509) | `hashHeksa`, `wariantDlaHeksa` (sól 911), `rotacjaDlaHeksa`, `LICZBA_WARIANTOW_TERENU` (= `TERRAIN_SOLID_VARIANTS`) w `pick::terrain` (P4.10); `WZGORZE_SZCZYT_Y`, `GORA_APEX_Y` w `core::map_style` (P4.12) | `relief`: reużyte powyższe (r1 miała kopie trzech stałych — usunięte w r2, §10) + `wariant_dla_heksa_salt` (parametr `salt` sygnatury weba), palety, `ring6/frustum/cone/rock/rampaSegm`, `czesciWzgorza/Gory(0..4)`, `wzgorzeGeometria`, `goraGeometria`, `TEREN_MATERIAL`, `buildWzgorze`, `buildGora`, **`powierzchniaReliefuY`** (raycast przez `pick::raycast`, P4.10), `trojkatyWariantu`, stałe |
| `dekor-laki-rowniny.ts` (463) | nic | `meadow`: `dekorDlaHeksa`, `rotacjaDekoru`, `rot2/ostrze/kepka/kamyk/okta/kwiatek/krzaczek/ciernisko/klos`, 4+4 kompozycje, geometrie, `DEKOR_MATERIAL`, buildery, `trojkatyDekoru` |
| `oaza-pustynia.ts` (578) | nic | `desert`: **`buildOaza()`** (Group: 3 tafle w podgrupie, 3 palmy, 4 krzaki, 2 głazy) + mikrodekor pustyni (`wydmka/slupek4/slupek3/czaszka`, 4 kompozycje, `dekorPustyniDlaHeksa`, `rotacjaDekoruPustyni`, `rotacjaOazy`, geometria, materiał, builder, `trojkatyDekoruPustyni`) |
| `tarasy-model.ts` (403) | nic | `terraces`: `tarasyWariantDlaHeksa` (sól 737), `punktLuku/stacjeLuku/polka/schodekRampy/przelaz/rzadekX`, `czesciTarasyW0/W3`, `tarasyGeometria`, `TARASY_MATERIAL`, `buildTarasy`, `trojkatyTarasow` |
| `mapRenderStyle.ts` (1996) — buildery | palety/wysokości/presety/`styleHillBumpSurfaceY`/`styleMountainPeakSurfaceY`/`galleryDecorSurfaceY`/`elevatedTerrainEdgeSurfaceY`/`styleTerrainColor` (`core::map_style`, P4.12); kolektory instancji brzegu, `computeRiverDeltaHexKeys`, `computeRiverMouthEdgeKeys`, `getCoastSharedGeometries`, `landCoastSandNeeded` (`terrain::coast`, P4.11) | `style` (styl roblox): `buildStyleForestCluster` (+ `addRobloxTree/Palm/JungleUmbrella`, `TREE_VARIANTS`, `isWarmJungleForestHex`; `decorVariant5` i `forest/jungleForestTreeCountForHex` reużyte z `core::map_style` — w r1 kopie, usunięte w r2, §10 + `climateZoneAt` z `map/gen-helpers.ts`), `buildStyleMountainPeak`, `buildStyleHillBump`, `buildStyleTarasyTerrace` (`addSteppedTerraceHill` 'cultivated'), `reliefSurfaceSampler` (`ReliefSampler`), `buildGalleryBuildingPad`, `buildGalleryFortMount`, `buildStyleBeachRing`, `buildStyleCoastSandTopCap`, `buildStyleLandCoastSandCap`, `buildStyleCoastSandEdges`, `buildStyleCoastWaterCap`, `buildStyleDune`, `buildStyleOasis` |
| `riverLod.ts` (413) | nic | `river_lod`: kubełki (`createRiverBucket`, `queueRiverGeo`, `flushRiverBucket`, `mergeRiverBuckets` + `mergeGeometries` z atrybutem `color`), LOD (`riversVisibleAtLod`, `applyRiverLodVisibility`, `applyRiverVisibility`), mgła per heks (`computeRiverFogSig`, `buildRiverRibbonFull/FogIndex`, `needsRiverRibbonIndexUpdate`, `buildMergedRiverFull/FogIndex`, `computeMergedRiverFogSig`, `mergedRiverVisibleInFog`), stałe, `disposeRiverBuckets` |

Liczba wariantów zgodna z katalogiem P4.4 §4.2 (paczka 3): 5+5+2×5+2×4+4 = 32 + tarasy 2 = **34** (`geometries.json` → 34 rekordy, asercja w teście) + oaza + wybrzeże/rzeki.

Trójkąty na wariant (zmierzone z weba, `geometries.json`): las 144/176/164/150/158; dżungla 152/186/152/158/158; wzgórza 96/108/112/108/82; góry 98/120/126/144/88; łąka 18/31/28/20; równina 18/23/21/32; pustynia 23/35/33/28; tarasy W0 164, W3 190. Uwaga (informacyjnie, bez wpływu na port): komentarze w kodzie weba podają inaczej dla 2 wariantów — `dekor-laki-rowniny.ts:361` „(30 tri)” vs zmierzone 28, `oaza-pustynia.ts:513` „(38 tri)” vs zmierzone 35; port idzie za kodem, nie za komentarzem.

### Nie przeniesione (jawnie)

- `robloxCliffUnder` (`mapRenderStyle.ts:486-495`): funkcja prywatna bez wywołań (`grep -n robloxCliffUnder gra/src/render` → tylko definicja).
- Gałęzie `'minecraft'` i wczesne `return` dla `'civ'` wszystkich builderów, `addMinecraftSpruce`, `HILL_VARIANTS_MINECRAFT`, `MINECRAFT_MOUNTAIN_VARIANTS`, tryb `'natural'` `addSteppedTerraceHill` (używa go tylko gałąź minecraft `buildStyleHillBump`, `mapRenderStyle.ts:1023-1024`) — decyzja właściciela D-RR-8 = A (tylko styl roblox; `src/lib.rs` nagłówek).
- Kolektory instancji brzegu (`collectRobloxCoastWaterInst`, `collectRobloxLandCoastSandInst`) — już w `terrain::coast` (P4.11), nie duplikowane.

## 2. ZAŁOŻENIA (luki dispatchu rozstrzygnięte domyślnie)

- **Z1. Tylko styl roblox.** Buildery `style::*` nie mają parametru `style`; odpowiadają wywołaniu `('roblox', …)`. Podstawa: D-RR-8 = A (LEDGER 2026-10-21, cytowane w `rust-port/renderer/src/lib.rs`), `GAME_MAP_RENDER_STYLE = 'roblox'` (`mapRenderStyle.ts:40`).
- **Z2 (r1, NIEAKTUALNE od r2).** W r1 przyjęto, że `jsmath` nie jest na `parity-v2`; założenie było błędne (P4.16 `bf59164b` był na `parity-v2` przed commitem r1 — zarzut 2 Evaluatora). W r2 baza = `bf59164b`, `decor::js` re-eksportuje `crate::jsmath::{js_sin, js_cos, js_pow, js_hypot, js_atan2}`.
- **Z3. `mouthEdges` jawnie.** Web liczy `computeRiverMouthEdgeKeys(map)`, gdy wołający nie poda (`mapRenderStyle.ts:1767,1825`); w Rust parametr jest obowiązkowy (wołający liczy go raz przez `terrain::coast::river_mouth_edges` — jak zaleca komentarz weba `:1713-1714`). Test sprawdza, że zbiory krawędzi ujść i delt z P4.11 są identyczne z webem na mapie testowej.
- **Z4. `scene.add` w `flushRiverBucket`.** Renderer Rust nie ma jeszcze obiektu sceny; `flush_river_bucket` zwraca `RiverBucketMesh` (z polem `visible`), który wstawia wołający. `dispose()` geometrii = zwolnienie `Arc` (CPU).
- **Z5. Poziom LOD jako `f64`** (`riversVisibleAtLod(level: number)` porównuje liczby JS).
- **Z6. Klucze heksów w `riverLod` jako `String` `"q,r"`** + `KeySet` z kolejnością wstawiania (jak JS `Set`).
- **Z7. `Raycaster.far = 5` nie stosowane** w `powierzchnia_reliefu_y`: geometrie mają `y ∈ [-0.05, 1.25]`, promień startuje z `y = 4` w dół, więc każde trafienie ma odległość ≤ 4.05 < 5 (komentarz w `relief.rs`); zgodność potwierdzona na 25 968 próbkach.

## 3. Architektura: drzewo sceny (bez trzeciego typu)

- Model = `core::scene::SceneNode` (P4.12): `Mesh { geometry: Arc<Geometry>, materials, material_array }` / `Group`; `Geometry` = `geom::Mesh` + atrybut `color`. Materiał jako dane (`Material`: rodzaj Lambert, kolor liniowy, `vertexColors`, `flatShading`).
- `SceneNode` nie ma pól `name` ani `renderOrder`, które buildery weba ustawiają (`las-l0`, `renderOrder = 2/3/1`). Bez zmiany `core/**` (poza allowlistą) dodano opakowanie `decor::DecorObject { root: SceneNode, meta: Vec<NodeMeta> }` — metadane w kolejności `traverse`. Drzewo pozostaje czystym `SceneNode`, więc działa z `core::fog_dim` i `core::merge_decor`.
- Różnica względem `models::wonders::model` (P4.14): cuda mają własne `Node`/`Primitive`/`LambertMaterial` z indeksem slotu materiału (lista materiałów na model, `userData.mats`); dekor nie współdzieli materiałów między meshami poza singletonami vertex-colour, a geometrie są współdzielone przez `Arc` (cache `OnceLock`, 1 instancja na wariant = odpowiednik cache modułu weba). Dekor nie wymienia danych z cudami, więc konwersja/trait nie była potrzebna; ujednolicenie obu typów to osobny temat (rekomendacja).
- `matrixWorld`, bbox: `decor::js::{world_matrices, bounding_box}` — tylko przejście `updateMatrixWorld(true)` i `Box3.setFromObject(…, true)`, których `core::scene` nie ma. Macierz lokalna = `SceneNode::local_matrix` (od P4.16 `geom::Quat::from_euler` liczy przez `jsmath`); własne `quat_from_euler`/`local_matrix` z r1 usunięte (§10).

## 4. Numeryka

- Wszystkie emitery liczą w f64 z zachowaniem kolejności operacji JS (np. `i * Math.PI / 3` vs `i * (Math.PI * 2 / n)` — oba warianty występują w różnych plikach weba i są odwzorowane osobno), zaokrąglenie do f32 raz (`Float32BufferAttribute`), normalne z `geom::Mesh::compute_vertex_normals` (P4.8).
- **Pomiar wpływu trygonometrii platformy (r2):** mutant M01 (platformowe `sin/cos` zamiast `jsmath` w `decor`) → 40 rozbieżności bitowych w builderach (+ strażnik źródła), 0 w samych geometriach `Float32`. (W r1 było 900, bo wtedy także kwaternion `decor` szedł przez te funkcje; od r2 kwaternion liczy `geom` przez `jsmath`.) Wniosek: V8-dokładne `sin/cos` są konieczne dla zgodności bitowej.
- `Math.atan2` — od r2 `crate::jsmath::js_atan2` (V8 fdlibm, P4.16) w obu miejscach (`style.rs` `edge_dir` i język delty); ryzyko platformowe z r1 zamknięte. Na 6 jednostkowych kierunkach osiowych platformowe `atan2` daje te same bity (M31/M32 zabija tylko strażnik źródła).
- Strażnik `decor_uses_jsmath_not_platform_libm`: skan `src/decor/*.rs` (bez komentarzy) zabrania `.sin(`/`.cos(`/`.atan2(`/`.powf(`/`.hypot(`/… i form `f64::sin(` oraz pośrednich `from_euler_xyz(`/`hex_prism_no_bottom(`; `.sqrt()` dozwolone (IEEE 754, poprawnie zaokrąglane).
- `geom::cylinder/cone_geometry` — od P4.16 przez `jsmath` (poza zakresem tego tematu); hashe geometrii zgodne (6 233 meshe builderów + 333 wybrzeża).

## 5. Weryfikacja

Metoda jak P4.11/P4.14: wektory z **uruchomionego kodu weba** (`git archive edb8fb56 gra/src gra/data` do scratch poza repo, `three@0.169.0`, `esbuild@0.24.0`, node v22.22.0; moduły importowane bez zmian; generator `tests/fixtures/decor/gen.ts`, opis `README.md`). Porównanie `to_bits` każdej liczby.

| test | zakres | skalary | rozbieżności |
|---|---|---:|---:|
| `shared_geometries_are_bit_identical_to_web` | 34 geometrie (pos/nor/col bit po bicie + hash), wrap wariantu `w ∈ [-11,12]` (tożsamość instancji), `trojkaty*`, 6 materiałów, stałe | 90 917 | 0 |
| `hex_hash_functions_match_web` | 15 funkcji × 54 ziarna × 121 heksów; `isWarmJungleForestHex` (7 wysokości mapy); asercja: każdy wynik każdej funkcji dla ≥ 50 RÓŻNYCH ziaren (r2; r1 liczyło próbki) i ≥ 2 wyniki na funkcję | 98 543 | 0 |
| `builders_are_bit_identical_to_web` | 939 obiektów + 500 z `relief_builders.json` (r2: MountainPeak/HillBump, asercja ≥ 50 różnych ziaren na każdy z 5 wariantów sylwetki), 6 233 meshe: węzły (typ, rodzic, name, renderOrder, pos/rot/scale, cienie, `matrixWorld`), materiały, geometrie (liczności + FNV-1a), `Box3.setFromObject(…, true)`, `surfaceY` | 324 838 | 0 |
| `coast_builders_are_bit_identical_to_web` | mapa 127 heksów + 4 rzeki: krawędzie ujść/delty (P4.11) = web; 301 buildów wody/piasku | 27 027 | 0 |
| `relief_surface_height_matches_web` | `powierzchniaReliefuY` 112 kombinacji × (81 siatki + 150 losowych) punktów; 24 samplery + 500 samplerów r2 (asercja ≥ 50 różnych ziaren na (typ, wariant)) | 29 468 | 0 |
| `river_lod_matches_web` | 6 scenariuszy kubełków (w tym `null` przy niezgodnych atrybutach), `mergeRiverBuckets`, LOD, 60 przypadków mgły | 830 | 0 |
| `decor_uses_jsmath_not_platform_libm`, `decor_reuses_core_instead_of_copies` | strażniki źródła (r2) | — | — |
| **razem** | | **571 623** | **0** |

### Test mutacyjny (r2: 36 mutantów, `dyspozycje/autobot/runs/R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1/mutacje/`)

Odtwarzanie z repo (r2, zarzut 4): `bash dyspozycje/autobot/runs/R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1/mutacje/run_all.sh` z dowolnego katalogu checkoutu. `run.sh` znajduje repo przez `git rev-parse --show-toplevel` względem własnej lokalizacji, a `run_all.sh` czyta `mutants.txt` z tego samego katalogu. Backup trafia do `mktemp` i plik jest przywracany w `trap EXIT`. Katalog targetu to `$MUT_TARGET_DIR` (domyślnie `${TMPDIR:-/tmp}/decor-mut-target`), a werdykt to kod wyjścia `cargo test`. Wynik: `mutacje/final.txt`.

Zabite (33):
- **Rozbieżności bitowe (liczba w nawiasie):** M01 platformowe sin/cos (40, do tego strażnik), M02 `pushTri` `<`→`<=` (24 geom.), M03 `rgb` /256 (10 066), M04 `BLOB_JIT` (1 505), M06 pochylenie kępki (427), M08 `punktLuku` floor→ceil (1 850), M09 sól palety drzew (43 233), M10 renderOrder piasku (76), M11 mnożnik sygnatury mgły (84), M13 kolejność mnożenia macierzy świata (3 186 + 25), M15 próg klimatu (4), M16 `STAW_R` (3), M17 liście palmy dżungli (1 601), M19 faza rządków tarasów (290), M20 próg wydmy (2), M21 zawijanie wariantu (64 227), M22 separator segmentów (60), M23 pusty reveal = null (32), M24 kierunek klucza ujścia (28), M25 nawinięcie tafli oazy (3), M26 próg palmy w dżungli (685), M27 wariant reliefu (1 882), M28 kolor krzewu tarasu (8), M29 język delty (74), M30 start promienia reliefu (8 114).
  - M06: w r1 wzorzec sed nie pasował do pliku po `rustfmt`. Pierwszy przebieg r2 dał NOCHANGE, wzorzec poprawiono i powtórzono.
  - M13 zastępuje „platformowy kwaternion” z r1. Po P4.16 tamten mutant jest tożsamy z kodem.
- **Nowe w r2:**
  - M07 `js_pow`→`powf`, M14 `js_hypot`→`hypot` oraz M31/M32 platformowe `atan2`: zabija je tylko strażnik źródła (patrz niżej).
  - M33 przywrócona kopia `GORA_APEX_Y`: zabija strażnik reużycia.
  - M34/M35/M36: strażniki ziaren hasza, builderów i samplera zredukowane do jednego ziarna. Asercje zgłaszają „only 1 distinct seeds”.

**Luka pokrycia numerycznego, a nie równoważność (r2, korekta opisu z r1).** M07 i M14 dają 0 rozbieżności bitowych w wektorach dekoru. Wejścia tych wywołań wyznacza kod weba: `js_pow(t, 1.4)` dla `t ∈ {0, 0.5, 1}` w palmie oazy oraz `hypot` w kępce na kilku stałych wektorach. Na tych wejściach glibc i V8 dają te same bity. To NIE jest równoważność, bo dla innych wejść `powf`/`hypot` z glibc różnią się od V8 (wektory `tests/fixtures/jsmath/`, P4.16). W testach dekoru nie da się dodać wejść rozróżniających bez zmiany kodu weba, bo wejścia są stałymi builderów. Lukę zamykają więc:
- (a) strażnik `decor_uses_jsmath_not_platform_libm`, który zabija M07, M14, M31 i M32;
- (b) `jsmath_v8_parity` (P4.16): bitowa zgodność `js_pow`, `js_hypot` i `js_atan2` z V8 na wektorach rozróżniających.

Przeżyły (3), wszystkie równoważne:
- M05 `i * PI / 3` → `i * (PI / 3)` w `ring6`: różnica 1 ulp f64 tylko dla `i = 5`. Znika po zaokrągleniu pozycji do f32, a wyjściem jest `Float32`, więc wynik jest ten sam.
- M12 `Side::Front` → `Double` w raycaście reliefu: pionowy promień z góry zawsze najpierw trafia ścianę skierowaną w górę (bryły nie mają den, ściany boczne patrzą na zewnątrz). Dla promieni w dół na tych geometriach wynik jest ten sam (29 468 próbek).
- M18 strażnik `if (rx || ry || rz)` bez `rz` w `B()` oazy: domyślna rotacja to 0, więc pominięcie ustawienia nie zmienia wyniku. Mutant jest semantycznie równoważny.

## 6. Wektory referencyjne i SHA-256

Katalog `rust-port/renderer/tests/fixtures/decor/` (r2: 6,3 MB JSON łącznie, 6 plików, każdy < 4 MB; nic nie pominięto). R2: `gen.ts` dopisuje `samplersSeeds` (w `relief.json`) i nowy `relief_builders.json`; pozostałe 4 JSON-y z regeneracji r2 są bajtowo identyczne z r1 (te same SHA):

```text
e65b2403723b23c08b1205113e039527ec0cf28fe9a6afc6b99a040f230d8f1c  gen.ts
36cb314f382beefe03b627f2f1d05685ead9d05d6c4187e6090289adc5ed4161  builders.json
6a98799ffc4389282cc053e751d805509d79bbac9c0684a1cabbac21e2ee71b7  geometries.json
c0a7fc8c938e9f23bf6cf0d6f994a15c82cc872910be35d6061b959a90cc5618  hashes.json
e366164d2f4862a7de12daccfa39155452e4478cc78c4332b1a61ee3f7a23c6d  relief.json
563c136f21a9fe2b7a17e3f6e310d4b9ebca0a889f1b6a357b5e7e4aed03ef1a  relief_builders.json
a1433275bbfc69dabf88097cb54e86008880c912383556e751408d58697a0efd  riverlod.json
```

Generator (r2) wypisuje: `decor geometries=34 builders=939 reliefBuilders=500 coast=301 relief=112 samplersSeeds=500 hashfns=15 rlcases=60`. Środowisko: node v22.22.0, three 0.169.0, esbuild 0.24.0, rustc 1.97.0, cargo 1.97.0. Scratch usunięty po pracy.

## 7. NIE_ZMIERZONO i lista do oceny wzrokiem po RR-T5

NIE_ZMIERZONO:
1. Ocena wizualna 1:1 (wymaga GPU i pipeline'u renderu, RR-T5).
2. Cieniowanie Lambert `flatShading` + `vertexColors` w wgpu (shader nie istnieje).
3. (r2: zamknięte — `atan2` przez `jsmath`, `geom` przepięty w P4.16.)
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

## 8. Bramki — surowe logi (runda 2)

Komendy uruchomiono z `rust-port/renderer/`, w czystym `CARGO_TARGET_DIR`, na `bf59164b` z poprawkami r2. Pełne logi są w `dyspozycje/autobot/runs/R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1/logs/`: `fmt.txt`, `clippy.txt`, `clippy_gpu.txt`, `test.txt`, `decor_nocapture.txt`. Każdy log kończy się `echo "EXIT=$?"`.

| komenda | wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT=0 |
| `cargo clippy --locked --all-targets -- -D warnings` | EXIT=0, 0 ostrzeżeń |
| `cargo clippy --locked --all-targets --features gpu -- -D warnings` | EXIT=0, 0 ostrzeżeń |
| `cargo test --locked --all-targets` | EXIT=0, 19 binarek zielonych |

Szczegóły `cargo test --locked --all-targets`:
- `decor_web_parity`: 8/8;
- `jsmath_v8_parity`: 13/13;
- `jsmath_wiring`: 4/4;
- pozostałe binarki: zielone.

`cargo test --locked --test decor_web_parity -- --nocapture --test-threads=1`:
```text
builders: scalars=324838 bit_diff=0
coast: scalars=27027 bit_diff=0
hashes: 98010 samples, 54 seeds
hashes: scalars=98543 bit_diff=0
relief: scalars=29468 bit_diff=0
riverlod: scalars=830 bit_diff=0
geometries: scalars=90917 bit_diff=0
test result: ok. 8 passed; 0 failed
EXIT=0
```

`git diff --cached --check` po jawnym `git add`: patrz raport Operatora r2.

## 9. Rekomendacje (poza zakresem)

- Ujednolicić drzewa `core::scene` i `models::wonders::model` (osobny temat) oraz dodać `name`/`renderOrder` do `SceneNode` (wtedy `DecorObject.meta` zniknie).

## 10. Runda 2: odpowiedzi na zarzuty Evaluatora r1

Stan r2 odtworzono tak: commit Operatora r1 `0e48c7e4` przeniesiono przez `cherry-pick` (bez konfliktów) na `origin/rust-port/parity-v2` @ `bf59164b`, na którym są już P4.16 `jsmath`, P4.13 i P5.1. Poprawki r2 są w osobnym commicie nad nim.

**Z1. Duplikaty `core`/`pick::terrain`: PRZYJMUJĘ.**
- Usunięte kopie:
  - `relief.rs`: `LICZBA_WARIANTOW_TERENU`, `WZGORZE_SZCZYT_Y`, `GORA_APEX_Y`;
  - `style.rs`: `decor_variant5`, `forest_tree_count_for_hex`, `jungle_forest_tree_count_for_hex`.
- Co jest teraz używane zamiast nich:
  - `core::map_style::{decor_variant5, forest_tree_count_for_hex, jungle_forest_tree_count_for_hex, WZGORZE_SZCZYT_Y, GORA_APEX_Y}`;
  - `pick::terrain::TERRAIN_SOLID_VARIANTS`.
  - Dwie funkcje liczności drzew są re-eksportowane w `decor::style` przez `pub use`, więc API się nie zmienia.
- Test porównuje stałe weba bezpośrednio ze stałymi `core`/`pick`. Dowodzi to, że reużyte wartości są równe webowi.
- Strażnik `decor_reuses_core_instead_of_copies` blokuje ponowne skopiowanie tych 8 pozycji. Mutant M33 (przywrócona kopia) jest zabity.
- Korekta raportu r1: twierdzenie „bez duplikacji” było nieprawdziwe.

**Z2. `jsmath` był na `parity-v2`, a nie został użyty: PRZYJMUJĘ.**
- Baza r2 to `bf59164b`.
- `decor/js.rs` re-eksportuje `crate::jsmath::{js_sin, js_cos, js_pow, js_hypot, js_atan2}`.
- Oba wywołania `nx.atan2(nz)` w `style.rs` zastąpiono przez `js_atan2(nx, nz)`.
- Usunięte duplikaty: `decor::js::quat_from_euler` i `local_matrix`.
  - `world_matrices` i `world_matrix` używają teraz `SceneNode::local_matrix()`.
  - `relief.rs` używa `geom::Quat::from_euler`, który od P4.16 liczy przez `jsmath`.
- Komentarz modułu `js.rs` zaktualizowano.
- Zostały tylko `world_matrices` (`updateMatrixWorld(true)`) i `bounding_box` (`Box3.setFromObject(…, true)`), bo `core::scene` ich nie ma.
- Strażnik `decor_uses_jsmath_not_platform_libm` pilnuje, że w `decor` nie ma platformowych funkcji przestępnych.
- Wynik: 0 rozbieżności bitowych na wszystkich wektorach (§5, §8).

**Z3. Asercja „≥50” liczyła próbki, a nie ziarna: PRZYJMUJĘ.**
- `hex_hash_functions_match_web` liczy teraz `HashSet` różnych ziaren na każdy wynik i wymaga ≥ 50, a dodatkowo ≥ 2 wyniki na funkcję.
- Mutant M34 sprowadza wszystko do jednego ziarna i jest zabity komunikatem „outcome 0 occurs for only 1 distinct seeds”.
- Buildery MountainPeak/HillBump i sampler: regeneracja wektorów z uruchomionego kodu weba (`gen.ts` r2, node v22.22.0, three 0.169.0, esbuild 0.24.0, `git archive edb8fb56`):
  - `relief_builders.json`: 2 × 250 buildów, dokładnie 50 różnych ziaren na każdy z 5 wariantów sylwetki;
  - `relief.json`/`samplersSeeds`: 500 samplerów, po 50 różnych ziaren na każdą parę (wzgórza/góry, wariant).
  - Webowa `wariantDlaHeksa` służy w generatorze wyłącznie do wyboru kandydatów z deterministycznej enumeracji.
- Asercje w `builders_are_bit_identical_to_web` i `relief_surface_height_matches_web` zabijają mutanty M35/M36.
- Pozostałe 4 JSON-y z regeneracji r2 są bajtowo identyczne z r1 (SHA w §6), co dodatkowo potwierdza odtwarzalność.

**Z4. Mutacje nieodtwarzalne, opis M07/M14: PRZYJMUJĘ.**
- `run.sh` i `run_all.sh` nie mają już ścieżek na sztywno. Szczegóły są w §5.
- `mutants.txt` zaktualizowano do kodu r2:
  - M01 dotyczy teraz re-eksportu `jsmath`;
  - M13 to teraz kolejność mnożenia macierzy świata;
  - M06 ma poprawiony wzorzec;
  - doszły M31–M36.
- M07 i M14 opisano w §5 jako lukę pokrycia numerycznego, a nie mutanty równoważne. Lukę zamykają strażnik źródła i `jsmath_v8_parity`.
- Wynik: 36 mutantów, 33 zabite, 3 równoważne (M05, M12, M18).

ZAŁOŻENIE r2-Z8: nowy plik fixtur `relief_builders.json` mieści się w allowliście `tests/fixtures/decor/**`. Rozdzielenie plików trzyma `builders.json` poniżej 4 MB. Łącznie fixtury mają 6,3 MB, poniżej limitu 8 MB z dispatchu.
