# P4.27 — jeden typ drzewa sceny w `rust-port/renderer` (`scene::Scene`)

**TEMAT:** `R-RUSTPORT-P4-27-SCENE-UNIFY-Q1` · **DOMAIN:** GAME · **Rola:** Operator, runda 1
**Baza:** odłączony `origin/rust-port/parity-v2` @ `9ec9c9d8` · **Crate:** `rust-port/renderer` (bez GPU, `forbid(unsafe_code)`, bez nowych zależności, `Cargo.lock` bez zmian, `geom/**`, `pick/**`, `terrain/**`, `assets/**`, `camera.rs`, `jsmath/**` nietknięte)

## 0. Streszczenie

- Przed tematem w crate były **trzy reprezentacje** drzewa modelu: rekurencyjny `core::scene::SceneNode` (P4.12; `decor`, `core::fog_dim`, `core::merge_decor`, z tabelą boczną `decor::NodeMeta`), rekurencyjny `models::wonders::model::Node` (P4.14) i arena `unit_core::model::UnitModel` (P4.13) z obejściami `Prim::Kamien/Braz/Zelazo` oraz tabelami bocznymi `MiscModel{mats,info}`, `ImprovementModel{mat_ext,node_ext}`, `CityModel{drawables,materials,user_data}`.
- Teraz jest **jeden typ**: `crate::scene::Scene` (`src/scene/`, nowy) — arena `Node` (transformacja `position/rotation/quaternion/scale`, ładunek `NodeKind::{Group, Object3D, Mesh, LineLoop, Sprite}`, `name`, `castShadow/receiveShadow`, `renderOrder`, `matrixAutoUpdate`, `userData`) + współdzielone `Material` (dane: klasa, kolor liniowy, emissive, metalness/roughness, transparent/opacity, flatShading, vertexColors, depthWrite/Test, side, polygonOffset, map, fogBaseColor) + geometria jako dane `Geo::{Prim(Prim), Body(Arc<dyn GeoBody>), Buffer(Arc<Geometry>)}`.
- **Zmigrowane wszystkie moduły**: `decor` (+ `core::fog_dim`, `core::merge_decor`), `wonders`, `unit_core`, `units_kamien`, `units_braz`, `units_zelazo`, `improvements`, `misc`, `cities`. **Zlikwidowane**: warianty `Prim::Kamien/Braz/Zelazo` (oraz `Prim::HexRing/LeafBlade`, `Geo::Part/Horse`), tabela `drawables`, wrappery `MiscModel`/`ImprovementModel`/`CityModel`/`DecorObject`/`WonderModel` jako typy (zostały wyłącznie **aliasy** `pub type X = Scene` dla zachowania ścieżek publicznych), tabele boczne `NodeInfo`, `NodeExt`, `MatExt`, `NodeMeta`, `MiscMaterial`-mirror.
- **Widok eksportu do GPU (czysty CPU):** `Scene::export_gpu(root_parent) -> Vec<GpuMesh>` (`src/scene/export.rs`): na każdy mesh/line w kolejności `traverse` bufory `f32` pozycji/normalnych/UV/kolorów, indeksy `u32` (lub `0..n`), topologia (`Triangles`/`LineLoop`), materiał jako dane, kolor bazowy `f32`, macierz świata `[f32;16]` (column-major), cienie, `renderOrder`, klucz współdzielenia geometrii (`Prim` = parametry, `Buffer` = wskaźnik).
- **Parytet:** wszystkie testy zgodności z webem zielone, **fixtury bitowo bez zmian** (`git diff --stat --exit-code 9ec9c9d8 -- tests/fixtures` → EXIT=0, `logi/fixtures-unchanged.txt`). Zmiany testów wyłącznie wymuszone typem (§3), liczba asercji nie zmalała (+2 nowe).
- **Mutacje:** 22/22 wykrytych, każda przez test zgodności z webem (§4).
- **Bramki:** fmt, clippy, clippy `--features gpu`, `cargo test --locked --all-targets` — EXIT=0 (§5, Załącznik A).

## 1. Decyzje i ZAŁOŻENIA

| # | Pozycja | Rozstrzygnięcie |
|---|---|---|
| Z1 | Arena czy drzewo rekurencyjne | **Arena** (`Vec<Node>` + `NodeId`). Uzasadnienie liczbowe: buildery jednostek/miast/ulepszeń (≈ 50 k linii) adresują węzły po id i mutują je po dodaniu (`m.node(id).rot_y(..)`, `attach` grup tworzonych wcześniej) — przepisanie ich na drzewo wartości byłoby nie-mechaniczne; `decor` + `wonders` (rekurencyjne) to ok. 60 + 100 miejsc i dało się je przenieść mechanicznie (pod-drzewa jako osobne `Scene` + `Scene::graft`, liście jako `decor::object::Leaf`). |
| Z2 | Allowlista `core/**` | Dispatch wymienia `core/scene.rs`; konsumenci tego typu — `core/fog_dim.rs` (funkcja `apply_fog_dim`) i `core/merge_decor.rs` — **musieli** zostać przepisani na `Scene` (dispatch: „zachowaj publiczne ścieżki … albo zaktualizuj użycia jawnie”). Zmiana jawna, tylko w tych dwóch plikach; publiczne nazwy funkcji bez zmian, argument `&SceneNode` → `&Scene` (`SceneNode` jest aliasem `Scene` w `core::scene`). `lib.rs`: dokładnie jedna linia `pub mod scene;`. |
| Z3 | Kolor materiału | Przechowywany **liniowo** (`Option<Color>`, jak `material.color` w three r169, wymagane przez `fogDim` i miasta); hex sRGB odzyskiwany `Material::hex()` = `getHex()`. Dowód zgodności dla builderów podających hex: `from_hex → to_hex` jest identycznością dla wszystkich 2^24 wartości (test jednostkowy `scene::material::tests::hex_round_trip…` — kanały są niezależne, 3×256 + szarości; jednorazowo przebieg wyczerpujący 2^24 w release: 0 rozjazdów). Retint (`units.ts:1410-1417`) porównuje i zapisuje przez hex. |
| Z4 | Kwaternion | Jeden wzór: `geom::Quat::from_euler` (V8 trig przez `jsmath`, wszystkie 6 kolejności). Dawne kopie (`unit_core::model::quat_from_euler`, `wonders::model::quat_from_euler_js`) miały identyczne formuły i ten sam `jsmath` (P4.18) — `quat_from_euler` zostaje jako wrapper ścieżki publicznej. Settery Eulera (`rot_x/y/z`, `set_rot`, `set_rotation`) synchronizują kwaternion; `decor` zapisuje pola `rotation` liścia bezpośrednio, a `add_leaf` wylicza kwaternion przy dodaniu (= `onRotationChange`). |
| Z5 | `mergeDecor` | Kolejność mnożenia macierzy łańcucha (`premultiply` od mesha do korzenia) zachowana dosłownie (nie użyto `world_matrices`, bo łączność mnożenia zmiennoprzecinkowego różni się). Usunięte dzieci po `collapse` zostają w arenie jako nieosiągalne (jak obiekty usunięte z grupy w webie, przed `dispose`). Flaga `civMergedDecor` = `userData` (`UserValue::Bool`). |
| Z6 | Moduły ciał geometrii | `KamienGeo`, `BrazGeo`, `ZelazoGeo` (bez zmian algorytmów) implementują `scene::GeoBody`; nowe ciała: `unit_core::model::{HexRing, LeafBlade}`, `improvements::model::TwistedCone`, `cities::model::{HexWallRing, HexLoop}`. Parametryczne prymitywy Three w jednym `scene::Prim` (`Box, Cylinder, Cone, Sphere, Torus, Icosahedron, Dodecahedron, Circle, Ring`) — dawne `wonders::Primitive`, `misc::MiscGeo::{Circle,Ring}`, `improvements::ExtraGeo::Dodecahedron`, `cities::CityGeo::{Box,Cylinder,Cone,Circle}` to te same wywołania `geom::*_geometry`. |
| Z7 | `Geo` nie jest `Copy` | (`Arc<dyn GeoBody>`). W 20 miejscach builderów jednostek dodano mechanicznie `.clone()` (skrypt wg diagnostyk rustc E0382/E0507/E0508; lista w commicie etapu 2); w `ArmIkKit`/`IkArmKit` usunięto `Copy`. Brak zmian wartości. |
| Z8 | Widoki zamiast przechowywania | Zachowane nazwy publiczne jako **widoki**, nie drugie drzewo: `cities::{CityGeo, CityMaterial}` (argumenty konstruktora `Into<Geo>/Into<Material>` + odczyt `::of`), `cities::{Drawable, DrawKind, drawable(m,id)}`, `cities::{CityUserData, city_user_data, set_city_user_data}`, `improvements::{UserData, user_data, set_user_data}`, `unit_core::{CelticRetint, celtic_retint, set_celtic_retint}`, `wonders::{user_data_material_count, banner_material}`. |
| Z9 | Sygnatury parytetu | Strumień generatora `unit_core/gen.ts` → `scene::hash::signature` (+ metoda `Scene::signature()`, ten sam kształt wywołań co w P4.13); strumień `misc/gen.ts` (inny zestaw pól) → `misc::model::signature`. |
| Z10 | Wygody builderów | `improvements::model::ImprovementExt` (trait na `Scene`: `lambert`, `standard`, `geometry`, `box_from_object`, `box_precise`, `totals`) — 236 wywołań `m.lambert(c)` bez zmian; `cities/kit.rs` dalej ma `impl CityModel { pub(crate) fn klocek/b/br/cyl/cone/plac/put/add_box/add_cyl }` (inherent na aliasie = na `Scene`, widoczne tylko w crate). Miasta: `lambert(hex, flat)` → `lambert_mat(hex, flat)` (konflikt nazw z `ImprovementExt::lambert`). |
| Z11 | `UnitPart::prim()` | Zwraca teraz `Geo` (dodane `geo()`; `prim()` zostaje aliasem — wywołania `p.prim().build()` w testach bez zmian), bo `SelectionHexRing/OwnerHexRing` to ciało `HexRing`, nie `Prim`. |
| Z12 | Singletony decor | Geometrie decor zostają `Geo::Buffer(Arc<Geometry>)` (tożsamość wskaźnika sprawdza `decor_web_parity` — `sameGeo` kubełków rzek); nie zamieniano ich na `Prim`, choć części (box/cyl/cone) dałoby się (to byłaby zmiana poza „mechaniczną”). |
| Z13 | Wzorzec weryfikacji P4.11 (generator web) | **Nie zastosowano nowych wektorów**: temat nie dodaje zachowania widocznego w webie, a dispatch wymaga, by istniejące fixtury pozostały bitowo bez zmian — one są wzorcem. Widok eksportu GPU nie ma odpowiednika w webie (three robi to wewnątrz `WebGLRenderer`) → zweryfikowany testem spójności z `world_meshes` i geometrią (unit test), porównanie z GPU: NIE_ZMIERZONO. Katalog scratch nie był potrzebny (pomocnicze skrypty migracji w scratchpad sesji, poza repo). |
| Z14 | Model / wiadomości właściciela | Wg dispatchu: Opus 5.5 medium, bez pytań ABC; brak luk wymagających decyzji. |

## 2. Architektura `src/scene/` (2 222 linii z testami)

| Plik | Zawartość |
|---|---|
| `mod.rs` | dokumentacja, re-eksporty |
| `node.rs` | `Node`, `NodeKind`, `MeshData{geo, materials, material_array}`, `NodeId/MatId/ROOT`, `UserData`/`UserValue` (klucze w kolejności wstawiania), settery transformacji, `quat_from_unit_vectors` |
| `graph.rs` | `Scene`: materiały (`add_material`, `mat` = fabryka jednostek ze śledzeniem `userData.mats`, `lambert_mat`, `lambert_color`, `retint`, `tracked`), węzły (`add_mesh`, `add_mesh_multi`, `add_line_loop`, `sprite`, `add_group`, `detached_group`, `attach`, `graft`, `graft_children`, `truncate`), skróty transformacji, `traverse`/`traverse_from`/`traverse_with_parent`, `meshes`/`drawables`, `world_matrices(root_parent)`, `subtree`, `world_meshes`, `bounding_box` (`Box3.setFromObject(root,true)`, `Math.min/max`), liczniki |
| `geometry.rs` | `Prim`, `GeoBody` (+ `DynEq` dla równości obiektów cech), `Geo`, `Geometry` (mesh + atrybut `color`) |
| `material.rs` | `MaterialKind` (9 klas), `Side`, `GlyphTexture`/`Texture`, `Material` |
| `hash.rs` | `Fnv`, `geo_hash`, `Signature`/`signature` (strumień `unit_core/gen.ts`) |
| `export.rs` | `GpuMesh`, `Topology`, `GeometryKey`, `Scene::export_gpu`, `mat4_to_f32` |
| `tests.rs` | 8 testów jednostkowych (downcast ciał przez `Arc` — regresja błędu znalezionego w etapie 2, synchronizacja kwaternionu, macierze świata i węzły odłączone, `graft` z przesunięciem slotów, `retint`/`tracked`, `UserData`, eksport GPU dla cudu/obrysu miasta/lasu, `mesh_root`) |

Etapy (każdy z pełnymi testami, osobny commit w worktree): **1** `6a97696b` typ + `decor` + `core::{fog_dim,merge_decor}` + `wonders`; **2** `348893d0` jednostki (`unit_core`, `units_kamien/braz/zelazo`, minimalne dopasowania `misc`/`improvements`); **3** `4b5f9ea7` `improvements`, `misc`, `cities`; **4** (ten commit) testy jednostkowe `scene`, dokument, run.

## 3. Testy: zmiany wymuszone typem (asercje bez osłabienia)

Liczba wywołań asercji (`c.eq/f/f32/f64/fs/bits/bits32`, `assert*!`) baza → teraz: cities 66→66, core 172→173, decor 140→140, improvements 70→70, misc 104→104, unit_core 44→44, units_braz 50→50, units_kamien 48→48, units_zelazo 52→52, wonders 68→69 (skrypt w §6).

| Plik | Dopasowania |
|---|---|
| `tests/core_web_parity.rs` | budowa specyfikacji do areny (`build(scene, parent, spec, shared)`; „shared” = jeden slot materiału jak jeden obiekt three), `check_colors` po `traverse`, dzieci/flagi korzenia przez `nodes[ROOT]` i `userData`; +1 asercja `array || mats.len()==1` |
| `tests/decor_web_parity.rs` | spacer po `traverse_with_parent` zamiast rekurencji; `name/renderOrder` z węzła; materiał przez slot; geometria z `Geo::Buffer`; kubełek rzeki: korzeń sceny-mesha; `mat.clone()` → `mat` (`Copy`) |
| `tests/wonders_web_parity.rs` | pola `Prim` (`w/h/d`, `rt/rb/h/radial/open`, `r/h/radial`), `hex()` zamiast pola `color`, arena + `world_matrices`; +1 asercja `open == false` |
| `tests/unit_core_web_parity.rs`, `tests/units_{kamien,braz,zelazo}_web_parity.rs` | `mesh()`/`material()`/`tracked()` (akcesory), `celtic_retint(m)`, `hex()`/`linear_color()`, `world_matrices(None)`; funkcja testowa `three_type` mapuje `Geo` (prymitywy + ciała przez `body_as`, to samo odwzorowanie co wcześniej) |
| `tests/improvements_web_parity.rs` | `nodes`/`materials` sceny, `user_data(m,id)`, klasa i emissive z materiału, `Prim::Dodecahedron` / `TwistedCone` |
| `tests/misc_web_parity.rs` | pola węzła zamiast `NodeInfo`, `NodeKind` z ładunkiem, `Prim::Circle/Ring`, `hex()`, `misc_signature(m)` |
| `tests/cities_web_parity.rs` | `nodes`, `drawable(m,id)`, `CityMaterial::of`, `city_user_data(m)` |

`tests/unit_core_model_rule.rs` — bez zmian (wywołanie `m.signature()` działa na `Scene`).

## 4. Test mutacyjny (`dyspozycje/autobot/runs/R-RUSTPORT-P4-27-SCENE-UNIFY-Q1/mutate.py`, log `logi/mutate.txt`)

Każda mutacja: jedna dokładna podmiana (liczba wystąpień = 1), `cargo test --locked --all-targets --no-fail-fast`, przywrócenie pliku bajt w bajt; WYKRYTA = co najmniej jeden FAILED (błąd kompilacji się nie liczy). Raport podaje binaria z porażkami (kolumna „parity” = czy złapał test zgodności z webem).

| # | Mutacja | Wynik |
|---|---|---|
| M01 | Node::local_matrix ignores the quaternion | DETECTED (21 failed tests; binaries: --test cities_web_parity, --test core_web_parity, --test decor_web_parity, --test improvements_web_parity, --test misc_web_parity, --test unit_core_model_rule, --test unit_core_web_parity, --test units_braz_web_parity, --test units_kamien_web_parity, --test units_zelazo_web_parity, --test wonders_web_parity; parity: YES) |
| M02 | rot_y does not re-sync the quaternion | DETECTED (17 failed tests; binaries: --test cities_web_parity, --test improvements_web_parity, --test misc_web_parity, --test unit_core_model_rule, --test unit_core_web_parity, --test units_braz_web_parity, --test units_kamien_web_parity, --test units_zelazo_web_parity, --test wonders_web_parity; parity: YES) |
| M03 | world matrix | local * parent instead of parent * local: DETECTED (18 failed tests; binaries: --lib, --test cities_web_parity, --test decor_web_parity, --test misc_web_parity, --test unit_core_model_rule, --test unit_core_web_parity, --test units_braz_web_parity, --test units_kamien_web_parity, --test units_zelazo_web_parity, --test wonders_web_parity; parity: YES) |
| M04 | bounding box min.x uses Math.max | DETECTED (10 failed tests; binaries: --test cities_web_parity, --test misc_web_parity, --test unit_core_web_parity, --test units_braz_web_parity, --test units_kamien_web_parity, --test units_zelazo_web_parity, --test wonders_web_parity; parity: YES) |
| M05 | retint compares with != (re-tints the wrong materials) | DETECTED (5 failed tests; binaries: --lib, --test unit_core_model_rule, --test unit_core_web_parity, --test units_zelazo_web_parity; parity: YES) |
| M06 | graft | mesh material slots not shifted: DETECTED (2 failed tests; binaries: --lib, --test core_web_parity; parity: YES) |
| M07 | Material::standard drops roughness | DETECTED (13 failed tests; binaries: --lib, --test improvements_web_parity, --test unit_core_model_rule, --test unit_core_web_parity, --test units_braz_web_parity, --test units_kamien_web_parity, --test units_zelazo_web_parity; parity: YES) |
| M08 | Prim::Circle builds one segment more | DETECTED (4 failed tests; binaries: --test cities_web_parity, --test misc_web_parity; parity: YES) |
| M09 | Prim::Ring with 2 phi segments | DETECTED (1 failed tests; binaries: --test misc_web_parity; parity: YES) |
| M10 | unit signature skips roughness | DETECTED (11 failed tests; binaries: --test unit_core_model_rule, --test unit_core_web_parity, --test units_braz_web_parity, --test units_kamien_web_parity, --test units_zelazo_web_parity; parity: YES) |
| M11 | decor leaf | quaternion not derived from rotation: DETECTED (2 failed tests; binaries: --test decor_web_parity; parity: YES) |
| M12 | decor leaf | renderOrder dropped: DETECTED (1 failed tests; binaries: --test decor_web_parity; parity: YES) |
| M13 | mergeDecor | group not flagged after collapse: DETECTED (1 failed tests; binaries: --test core_web_parity; parity: YES) |
| M14 | fogDim | every class dimmed (Physical/Toon too): DETECTED (1 failed tests; binaries: --test core_web_parity; parity: YES) |
| M15 | unit HexRing body | outer/inner swapped: DETECTED (1 failed tests; binaries: --test unit_core_web_parity; parity: YES) |
| M16 | improvements TwistedCone | twist sign: DETECTED (1 failed tests; binaries: --test improvements_web_parity; parity: YES) |
| M17 | improvements userData perTokenGeos length +1 | DETECTED (1 failed tests; binaries: --test improvements_web_parity; parity: YES) |
| M18 | cities HexWallRing | no rotateX(-PI/2): DETECTED (1 failed tests; binaries: --test cities_web_parity; parity: YES) |
| M19 | cities LineBasic | depthWrite inverted when stored: DETECTED (2 failed tests; binaries: --test cities_web_parity; parity: YES) |
| M20 | cities userData rozmiar key misspelt | DETECTED (1 failed tests; binaries: --test cities_web_parity; parity: YES) |
| M21 | misc signature skips opacity | DETECTED (1 failed tests; binaries: --test misc_web_parity; parity: YES) |
| M22 | wonders banner material not greyed for ruins | DETECTED (2 failed tests; binaries: --test wonders_web_parity; parity: YES) |

**Wynik: 22/22 wykrytych (EXIT=0); każda złapana przez co najmniej jeden test zgodności z webem (`*_web_parity` / `unit_core_model_rule`).** M06 (`graft` bez przesunięcia slotów) łapie `core_web_parity` (scalanie `mergeDecor` grafuje scenę-mesh) i test jednostkowy.


## 5. Bramki

Skrypt `gates.sh` (surowe logi `logi/*.txt`, każdy kończy `EXIT=`):

| Bramka | Komenda | Wynik |
|---|---|---|
| fmt | `cargo fmt --all -- --check` | EXIT=0 |
| clippy | `cargo clippy --locked --all-targets -- -D warnings` | EXIT=0 |
| clippy gpu | `cargo clippy --locked --all-targets --features gpu -- -D warnings` | EXIT=0 |
| test | `cargo test --locked --all-targets` | EXIT=0, 25 celów, 164 passed, 0 failed (baza 154 + 10 nowych testów jednostkowych `scene`) |
| fixtury | `git diff --stat --exit-code 9ec9c9d8 -- tests/fixtures` | EXIT=0 (brak zmian) |

Podsumowania parytetu z `logi/test-nocapture.txt` (wszystkie 0 rozjazdów):

```text
camera parity: scenarios=34 steps=6524 scalars=47892 mismatches=0
city outlines: compared 616 values, 0 mismatches
layout: compared 57 values, 0 mismatches
legacy: compared 992 values, 0 mismatches
city renderer: compared 27035 values, 0 mismatches
city models: compared 192347 values, 0 mismatches
fogDim: 951 values compared bit for bit, 0 mismatches
hexShape: 761 values compared bit for bit, 0 mismatches
bronzeCity: 4219 values compared bit for bit, 0 mismatches
unitVitalsPalette: 12 values compared bit for bit, 0 mismatches
zoomLod: 1258 values compared bit for bit, 0 mismatches
mapRenderStyle: 4895 values compared bit for bit, 0 mismatches
mergeDecor: 6616 values compared bit for bit, 0 mismatches
hexutil: 8660 values compared bit for bit, 0 mismatches
hashes: scalars=98543 bit_diff=0
riverlod: scalars=830 bit_diff=0
coast: scalars=27027 bit_diff=0
geometries: scalars=90917 bit_diff=0
relief: scalars=29468 bit_diff=0
builders: scalars=324838 bit_diff=0
proto keys: threw=10 empty=2: scalars=52 bit_diff=0 within_1e-12=0 struct_diff=0
data: scalars=35 bit_diff=0 within_1e-12=0 struct_diff=0
models: cases=457: scalars=192046 bit_diff=0 within_1e-12=0 struct_diff=0
acos: cases=20021 port_mismatches=0 libm_mismatches=1016
asin: cases=20021 port_mismatches=0 libm_mismatches=963
atan2: cases=20441 port_mismatches=0 libm_mismatches=2704
atan: cases=20021 port_mismatches=0 libm_mismatches=393
hypot3: cases=3004 port_mismatches=0 libm_mismatches=728
hypot: cases=20441 port_mismatches=0 libm_mismatches=3340
log: cases=20021 port_mismatches=0 libm_mismatches=99
exp: cases=20021 port_mismatches=0 libm_mismatches=1559
cos: cases=20021 port_mismatches=0 libm_mismatches=698
sin: cases=20021 port_mismatches=0 libm_mismatches=687
tan: cases=20021 port_mismatches=0 libm_mismatches=559
pow: cases=21024 port_mismatches=0 libm_mismatches=1342
quadratic bezier: scalars 2088 (bit-equal), checks 0
models: scalars 50440 (bit-equal), checks 27510
siege marker: scalars 9424 (bit-equal), checks 5010
siege sync: scalars 4 (bit-equal), checks 18
relief sampler (real): scalars 16560 (bit-equal), checks 424
territory border: scalars 288 (bit-equal), checks 470
territory loops: scalars 952 (bit-equal), checks 18
trade routes: scalars 84 (bit-equal), checks 132
range overlay: scalars 61344 (bit-equal), checks 13831
range overlay (real relief): scalars 80704 (bit-equal), checks 16506
map A build (instances 159): scalars=7888 exact=7888 within1e-6=0 bad=0
map A fog (8 calls): scalars=9576 exact=9576 within1e-6=0 bad=0
map A-lite build (instances 126): scalars=6871 exact=6871 within1e-6=0 bad=0
color: getHex cases=2048 mismatches=0; Math.pow cases=6144 mismatches=0; Math.hypot cases=2048 mismatches=0; preset cases=24 mismatches=0: scalars=15360 exact=15360 within1e-6=0 bad=0
map B build (instances 186): scalars=7955 exact=7955 within1e-6=0 bad=0
map B fog (4 calls): scalars=8056 exact=8056 within1e-6=0 bad=0
map C build (instances 1802): scalars=42162 exact=42162 within1e-6=0 bad=0
map C fog (2 calls): scalars=45600 exact=45600 within1e-6=0 bad=0
map D build (instances 3783): scalars=82699 exact=82699 within1e-6=0 bad=0
map E build (instances 4817): scalars=105234 exact=105234 within1e-6=0 bad=0
map F build (instances 732): scalars=18938 exact=18938 within1e-6=0 bad=0
TOTAL build: maps=7 instances=11605 scalars=271747 exact=271747 within1e-6=0 bad=0
map F fog (2 calls): scalars=17100 exact=17100 within1e-6=0 bad=0
TOTAL fog: calls=16 scalars=80332 exact=80332 within1e-6=0 bad=0
trig: n=11226 port_mismatch=0 libm_mismatch=792
unit_core parity: 68 cases, 68 compared (134622 values bit-exact checked), 0 pending stubs: []
units_braz parity: 180 cases (fn 60 / unit PL 40 / unit PL owner B 40 / unit EN 40; 96 via sameAs), 478906 values bit-exact checked, 0 mismatches
asin: n=5027 mismatches=0
units_kamien parity: 40 cases (fn 20 / unit PL 10 / unit EN 10), 156496 values bit-exact checked, 0 mismatches
units_zelazo parity: 146 cases (fn 44 / unit PL 25 / unit PL owner B 25 / unit EN 25 / unit EN owner B 25 / cat 2; 92 via sameAs), 329382 values bit-exact checked, 0 mismatches
trig: scalars=8954 bit_diff=0 within_1e-12=0
renderer: scalars=3080 bit_diff=0 within_1e-12=0
models: scalars=103073 bit_diff=0 within_1e-12=0
```


## 6. Pomiar asercji (komenda)

`git archive 9ec9c9d8 rust-port/renderer/tests` do scratch, potem regex `\b(?:c|ck)\.(?:eq|f|f32|f64|fs|bits|bits32)\(|assert(?:_eq|_ne)?!\(` liczony w każdym `*_web_parity.rs` bazy i bieżącym (wynik §3).

## 7. NIE_ZMIERZONO i „co ocenić wzrokiem po RR-T5”

Ocena wizualna 1:1 wymaga GPU — **NIE_ZMIERZONO**. Po RR-T5 (materiały/shadery) sprawdzić wzrokiem, renderując z `Scene::export_gpu`:
1. Jednostki (MOD-04..07): pierścienie wyboru/właściciela (`HexRing`), ostrza `LeafBlade`, tarcze owalne (`BrazGeo`), obręcze (`ZelazoGeo`) — kształt i orientacja.
2. Miasta: pierścień muru (`HexWallRing`, obrót −π/2) i obrysy `LineLoop` (zamknięcie pętli przez warstwę GPU, `depthWrite=false`, `renderOrder=12`).
3. Decor: kolory wierzchołków scalonej grupy (`mergeDecor`) i ściemnienie mgłą (`fogBaseColor × brightness`) na materiałach współdzielonych slotem.
4. Ulepszenia: ucho świni (`TwistedCone`), głazy (`Dodecahedron`), emisja kopalni (`emissive`).
5. Cuda: sztandar właściciela (wariant ruiny) i cienie (`castShadow`/`receiveShadow`).
6. Sprite oblężenia (`Texture::Glyph`) i przezroczystości nakładek MOD-13.

## 8. Pliki (allowlista)

- **Nowe:** `rust-port/renderer/src/scene/{mod,node,graph,geometry,material,hash,export,tests}.rs`.
- **Zmienione:** `src/lib.rs` (+1 linia), `src/core/scene.rs` (re-eksport + alias), `src/core/{fog_dim,merge_decor}.rs` (Z2), `src/decor/**`, `src/models/**` (wonders, unit_core, units_kamien, units_braz, units_zelazo, improvements, misc, cities), `tests/*_web_parity.rs` (§3).
- **Bez zmian:** `tests/fixtures/**`, `geom/**`, `pick/**`, `assets/**`, `camera.rs`, `terrain/**`, `jsmath/**`, `Cargo.toml`, `Cargo.lock`, `gra/**`, `src-tauri/**`, `rust-port/engine/**`.
- **Dokumentacja/run:** ten plik; `dyspozycje/autobot/runs/R-RUSTPORT-P4-27-SCENE-UNIFY-Q1/{00-dispatch.md, 01-operator-r1.md, gates.sh, mutate.py, logi/}`.

## Załącznik A — surowe logi

### A.fmt.txt (`logi/fmt.txt`)

```text
$ cargo fmt --all -- --check; echo "EXIT=$?"
EXIT=0
```

### A.clippy.txt (`logi/clippy.txt`)

```text
$ cargo clippy --locked --all-targets -- -D warnings; echo "EXIT=$?"
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_f2947d22-ac9-1/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 11.68s
EXIT=0
```

### A.clippy-gpu.txt (`logi/clippy-gpu.txt`)

```text
$ cargo clippy --locked --all-targets --features gpu -- -D warnings; echo "EXIT=$?"
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_f2947d22-ac9-1/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 5.69s
EXIT=0
```

### A.fixtures-unchanged.txt (`logi/fixtures-unchanged.txt`)

```text
$ git diff --stat --exit-code 9ec9c9d8 -- tests/fixtures; echo "EXIT=$?"
EXIT=0
```

### A.test.txt (`logi/test.txt`)

```text
$ cargo test --locked --all-targets; echo "EXIT=$?"
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_f2947d22-ac9-1/rust-port/renderer)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 6.12s
     Running unittests src/lib.rs (target/debug/deps/civ_renderer-3390857ab33a1fe3)

running 22 tests
test core::jsnum::tests::to_uint32_matches_ecmascript ... ok
test jsmath::words::tests::words_round_trip ... ok
test jsmath::words::tests::scalbn_is_exact_power_of_two_scaling ... ok
test core::jsnum::tests::to_fixed3_matches_node ... ok
test models::cities::renderer::tests::owner_color_and_civ_follow_js_remainder ... ok
test models::cities::renderer::tests::terrain_top_y_matches_inline_formula_bitwise ... ok
test models::misc::overlay::tests::to_fixed5_matches_node ... ok
test models::wonders::builders::tests::registry_covers_the_19_ids_and_defaults_the_rest ... ok
test models::cities::model::tests::number_to_string_follows_ecma ... ok
test models::wonders::builders::tests::grey_matches_hand_computation ... ok
test models::wonders::renderer::tests::default_owner_color_follows_js_remainder ... ok
test scene::tests::euler_setters_keep_the_quaternion_in_sync ... ok
test scene::material::tests::defaults_follow_three ... ok
test scene::tests::graft_moves_nodes_and_materials_with_shifted_ids ... ok
test models::misc::overlay::tests::to_fixed_d3_equals_core_to_fixed3 ... ok
test scene::material::tests::hex_round_trip_is_exact_for_every_24_bit_colour ... ok
test scene::tests::tracked_materials_and_retint_follow_the_unit_factory ... ok
test scene::tests::user_data_keeps_insertion_order_and_types ... ok
test scene::tests::mesh_root_and_named_build_a_one_node_scene ... ok
test scene::tests::world_matrices_compose_parent_first_and_skip_detached_nodes ... ok
test scene::tests::gpu_export_lists_every_drawable_with_buffers_and_transforms ... ok
test scene::tests::module_bodies_downcast_through_the_arc_and_compare_by_value ... ok

test result: ok. 22 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/assets_nturns.rs (target/debug/deps/assets_nturns-8f7d0ea4505dd8a8)

running 6 tests
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
[LeakM2 small 40x25] turn= 50 buffer=36 texture=306 pipeline=3 bind_group=9 live_bytes=9458944 subscriptions=1 created=712 destroyed=358
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[LeakM2 small 40x25] turn=200 buffer=36 texture=1206 pipeline=3 bind_group=9 live_bytes=24204544 subscriptions=1 created=2760 destroyed=1506
[LeakM2 small 40x25] turn 50 violations: live texture: baseline=67 current=306 allowed=67; live bytes: baseline=5543168 current=9458944 allowed=5543168
[LeakM2 small 40x25] turn 200 violations: live texture: baseline=67 current=1206 allowed=67; live bytes: baseline=5543168 current=24204544 allowed=5543168
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
test new_game_frees_everything_and_restarts_identically ... ok
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
test leak_m3_also_retains_battle_scene_resources ... ok
[Fixed large 96x60] turn= 50 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=2337 destroyed=2134
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM3 small 40x25] turn 50 violations: live buffer: baseline=68 current=196 allowed=68; live texture: baseline=9 current=17 allowed=9; live bind_group: baseline=11 current=19 allowed=11; live bytes: baseline=6722816 current=15373568 allowed=6722816; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 small 40x25] turn 200 violations: live buffer: baseline=68 current=676 allowed=68; live texture: baseline=9 current=47 allowed=9; live bind_group: baseline=11 current=49 allowed=11; live bytes: baseline=6722816 current=47813888 allowed=6722816; subscriptions: baseline=5 current=81 allowed=5
[LeakM1 large 96x60] turn= 10 buffer=714 texture=25 pipeline=3 bind_group=106 live_bytes=7547008 subscriptions=1 created=1126 destroyed=278
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
[Fixed large 96x60] turn=200 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=8826 destroyed=8623
[Fixed large 96x60] budget OK at turns [50, 200]
test fixed_registry_stays_within_budget_after_10_50_200_turns ... ok
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
test simulation_is_deterministic ... ok
[LeakM1 large 96x60] turn=200 buffer=9552 texture=25 pipeline=3 bind_group=1579 live_bytes=33000448 subscriptions=1 created=16718 destroyed=5559
[LeakM1 large 96x60] turn 50 violations: live buffer: baseline=714 current=2502 allowed=714; live bind_group: baseline=106 current=404 allowed=106; live bytes: baseline=7547008 current=12696448 allowed=7547008
[LeakM1 large 96x60] turn 200 violations: live buffer: baseline=714 current=9552 allowed=714; live bind_group: baseline=106 current=1579 allowed=106; live bytes: baseline=7547008 current=33000448 allowed=7547008
[LeakM2 large 96x60] turn= 10 buffer=148 texture=265 pipeline=3 bind_group=27 live_bytes=9737216 subscriptions=1 created=637 destroyed=194
[LeakM2 large 96x60] turn= 50 buffer=148 texture=1224 pipeline=3 bind_group=27 live_bytes=25449472 subscriptions=1 created=2336 destroyed=934
[LeakM2 large 96x60] turn=200 buffer=148 texture=4815 pipeline=3 bind_group=27 live_bytes=84284416 subscriptions=1 created=8817 destroyed=3824
[LeakM2 large 96x60] turn 50 violations: live texture: baseline=265 current=1224 allowed=265; live bytes: baseline=9737216 current=25449472 allowed=9737216
[LeakM2 large 96x60] turn 200 violations: live texture: baseline=265 current=4815 allowed=265; live bytes: baseline=9737216 current=84284416 allowed=9737216
[LeakM3 large 96x60] turn= 10 buffer=180 texture=27 pipeline=3 bind_group=29 live_bytes=7967744 subscriptions=5 created=637 destroyed=398
[LeakM3 large 96x60] turn= 50 buffer=308 texture=35 pipeline=3 bind_group=37 live_bytes=16618496 subscriptions=21 created=2337 destroyed=1954
[rebuild 1000 cycles] start: turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55 destroyed=0
[rebuild 1000 cycles] end:   turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55055 destroyed=55000
test rebuild_in_place_1000_cycles_returns_to_initial_state ... ok
[LeakM3 large 96x60] turn=200 buffer=788 texture=65 pipeline=3 bind_group=67 live_bytes=49058816 subscriptions=81 created=8826 destroyed=7903
[LeakM3 large 96x60] turn 50 violations: live buffer: baseline=180 current=308 allowed=180; live texture: baseline=27 current=35 allowed=27; live bind_group: baseline=29 current=37 allowed=29; live bytes: baseline=7967744 current=16618496 allowed=7967744; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 large 96x60] turn 200 violations: live buffer: baseline=180 current=788 allowed=180; live texture: baseline=27 current=65 allowed=27; live bind_group: baseline=29 current=67 allowed=29; live bytes: baseline=7967744 current=49058816 allowed=7967744; subscriptions: baseline=5 current=81 allowed=5
test each_leak_pattern_breaks_the_budget ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.16s

     Running tests/assets_registry.rs (target/debug/deps/assets_registry-c3f9969dbcf4ae07)

running 14 tests
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok
test handle_from_another_registry_is_rejected ... ok
test budget_thresholds_are_configurable ... ok
test live_report_lists_labels ... ok
test cache_lru_by_entries_and_bytes ... ok
test owned_guards_count_references ... ok
test reference_counting_frees_on_last_release ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test scope_releases_everything_it_created_on_drop ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test subscriptions_unregister_on_drop ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/camera_web_parity.rs (target/debug/deps/camera_web_parity-ed19813f9fcbbf13)

running 5 tests
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test drag_and_wheel_do_not_depend_on_dt ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok
test camera_controller_matches_web_100_percent ... ok
test fixture_covers_every_branch ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s

     Running tests/cities_web_parity.rs (target/debug/deps/cities_web_parity-b32fe1be50768412)

running 5 tests
test city_map_outlines_match_web ... ok
test legacy_city_model_matches_web ... ok
test layout_constants_and_types_match_web ... ok
test city_renderer_matches_web ... ok
test city_models_match_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.01s

     Running tests/core_web_parity.rs (target/debug/deps/core_web_parity-27c98cd457a8290f)

running 8 tests
test hex_shape_matches_web ... ok
test map_style_matches_web ... ok
test merge_decor_matches_web ... ok
test vitals_match_web ... ok
test zoom_lod_matches_web ... ok
test fog_dim_matches_web ... ok
test hexutil_matches_web ... ok
test bronze_city_types_match_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/cpu_sanity.rs (target/debug/deps/cpu_sanity-0295d7bf5a63866f)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/decor_web_parity.rs (target/debug/deps/decor_web_parity-faad5ae118a41e5c)

running 8 tests
test decor_reuses_core_instead_of_copies ... ok
test decor_uses_jsmath_not_platform_libm ... ok
test hex_hash_functions_match_web ... ok
test river_lod_matches_web ... ok
test shared_geometries_are_bit_identical_to_web ... ok
test coast_builders_are_bit_identical_to_web ... ok
test relief_surface_height_matches_web ... ok
test builders_are_bit_identical_to_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.75s

     Running tests/geom_three_parity.rs (target/debug/deps/geom_three_parity-0f596b3cbdb71744)

running 17 tests
test merge_rejects_mixed_indexing ... ok
test parity_box ... ok
test parity_curve ... ok
test parity_circle ... ok
test index_buffer_covers_non_indexed_meshes ... ok
test parity_cone ... ok
test parity_plane ... ok
test parity_extrude ... ok
test parity_ring ... ok
test parity_shape ... ok
test parity_ops ... ok
test parity_polyhedron ... ok
test parity_cylinder ... ok
test parity_torus ... ok
test parity_tube ... ok
test trs_matches_manual_composition ... ok
test parity_sphere ... ok

test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/gpu_probe.rs (target/debug/deps/gpu_probe-b90f27ad8c898393)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements_web_parity.rs (target/debug/deps/improvements_web_parity-7642b2e4c63525aa)

running 3 tests
test prototype_keys_documented_deviation ... ok
test data_tables_match_web ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.74s

     Running tests/jsmath_v8_parity.rs (target/debug/deps/jsmath_v8_parity-fee50190cb35806f)

running 14 tests
test acos_matches_v8 ... ok
test compatibility_paths_are_the_same_functions ... ok
test atan_matches_v8 ... ok
test atan2_matches_v8 ... ok
test asin_matches_v8 ... ok
test exp_matches_v8 ... ok
test hypot_three_arguments_matches_v8 ... ok
test cos_matches_v8 ... ok
test log_matches_v8 ... ok
test pow_matches_v8 ... ok
test hypot_matches_v8 ... ok
test whole_domain_without_platform_fallback ... ok
test sin_matches_v8 ... ok
test tan_matches_v8 ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.06s

     Running tests/jsmath_wiring.rs (target/debug/deps/jsmath_wiring-b0f96cca402d817c)

running 6 tests
test geom_rotation_and_euler_use_v8_trig ... ok
test pick_hex_prism_vertices_use_v8_trig ... ok
test pick_quat_from_euler_xyz_uses_v8_trig ... ok
test terrain_rotation_uses_v8_trig ... ok
test scanner_catches_known_bypass_forms ... ok
test no_platform_transcendentals_anywhere_in_src ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.31s

     Running tests/jsnum_to_fixed_v8.rs (target/debug/deps/jsnum_to_fixed_v8-f655627a428aa1de)

running 3 tests
test to_fixed_entry_points_are_one_function ... ok
test to_fixed_matches_v8 ... ok
test to_fixed_rejects_digits_above_100 - should panic ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.13s

     Running tests/misc_web_parity.rs (target/debug/deps/misc_web_parity-f6fc6b6b2b7c3c19)

running 11 tests
test quadratic_bezier_matches_three ... ok
test models_match_web ... ok
test siege_marker_matches_web ... ok
test siege_sync_matches_web ... ok
test territory_border_matches_web ... ok
test territory_loops_match_web ... ok
test to_fixed_on_hex_corners_is_sign_stable ... ok
test trade_routes_match_web ... ok
test relief_sampler_matches_web ... ok
test range_overlay_matches_web ... ok
test range_overlay_real_relief_matches_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.95s

     Running tests/pick_golden.rs (target/debug/deps/pick_golden-5edd88b94adda948)

running 7 tests
test js_round_matches_math_round ... ok
test client_rect_to_ndc_matches_web ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test terrain_scene_instances_are_bitwise_web ... ok
test world_to_axial_both_variants_match_web ... ok
test camera_matrices_and_rays_are_bitwise_three ... ok
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.47s

     Running tests/terrain_web_parity.rs (target/debug/deps/terrain_web_parity-7ed099e492a012e9)

running 5 tests
test js_pow_special_cases_follow_v8 ... ok
test fog_hides_unknown_and_dims_explored ... ok
test color_math_matches_three ... ok
test terrain_fog_matches_web ... ok
test terrain_build_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.51s

     Running tests/unit_core_json.rs (target/debug/deps/unit_core_json-b55ab56d4e2236c3)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_core_model_rule.rs (target/debug/deps/unit_core_model_rule-2f5305891471a8dc)

running 7 tests
test pending_registry_is_explicit ... ok
test legacy_en_path_reproduces_exactly_the_three_web_divergences ... ok
test unknown_type_falls_back_to_category_with_a_warning ... ok
test table_equals_the_legacy_pl_route_and_names_never_matter ... ok
test rule_table_covers_exactly_the_77_unit_types ... ok
test norm_name_and_culture_match_the_web ... ok
test web_signature_classes_equal_rust_model_id_classes ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.94s

     Running tests/unit_core_trig.rs (target/debug/deps/unit_core_trig-30b01be29ad89d90)

running 2 tests
test quat_from_euler_honours_every_order ... ok
test js_trig_matches_v8_bit_for_bit_and_libm_does_not ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/unit_core_web_parity.rs (target/debug/deps/unit_core_web_parity-eb9ca6d0cfd9b82c)

running 3 tests
test signature_is_sensitive_to_owner_colour_and_pose ... ok
test part_catalogues_match_the_web_singletons ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.65s

     Running tests/units_braz_web_parity.rs (target/debug/deps/units_braz_web_parity-658717995623588c)

running 4 tests
test unit_core_record_signatures_of_the_bronze_records_match ... ok
test routing_no_longer_returns_not_yet_ported_for_the_bronze_package ... ok
test the_records_cover_every_mod06_builder_and_counts_match_the_web ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.53s

     Running tests/units_kamien_web_parity.rs (target/debug/deps/units_kamien_web_parity-94e8e4a61ab4daac)

running 5 tests
test asin_matches_v8 ... ok
test the_ten_records_cover_every_mod05_builder_and_counts_match_the_web ... ok
test routing_no_longer_returns_not_yet_ported_for_the_stone_package ... ok
test unit_core_record_signatures_of_the_stone_records_match ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.12s

     Running tests/units_zelazo_web_parity.rs (target/debug/deps/units_zelazo_web_parity-dfa457e997b98fee)

running 4 tests
test the_records_cover_every_mod07_builder_and_counts_match_the_web ... ok
test no_unit_builder_is_a_stub_any_more ... ok
test unit_core_record_signatures_of_the_iron_records_match ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.99s

     Running tests/wonders_web_parity.rs (target/debug/deps/wonders_web_parity-d8d9a630ca3a6684)

running 4 tests
test renderer_scenario_is_bit_identical_to_web ... ok
test js_trig_is_bit_identical_to_v8 ... ok
test registry_matches_web_ids ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.27s

EXIT=0
```

### A.mutate.txt (`logi/mutate.txt`)

```text
$ python3 dyspozycje/autobot/runs/R-RUSTPORT-P4-27-SCENE-UNIFY-Q1/mutate.py; echo "EXIT=$?"   (cwd: rust-port/renderer)
M01 Node::local_matrix ignores the quaternion: DETECTED (21 failed tests; binaries: --test cities_web_parity, --test core_web_parity, --test decor_web_parity, --test improvements_web_parity, --test misc_web_parity, --test unit_core_model_rule, --test unit_core_web_parity, --test units_braz_web_parity, --test units_kamien_web_parity, --test units_zelazo_web_parity, --test wonders_web_parity; parity: YES)
M02 rot_y does not re-sync the quaternion: DETECTED (17 failed tests; binaries: --test cities_web_parity, --test improvements_web_parity, --test misc_web_parity, --test unit_core_model_rule, --test unit_core_web_parity, --test units_braz_web_parity, --test units_kamien_web_parity, --test units_zelazo_web_parity, --test wonders_web_parity; parity: YES)
M03 world matrix: local * parent instead of parent * local: DETECTED (18 failed tests; binaries: --lib, --test cities_web_parity, --test decor_web_parity, --test misc_web_parity, --test unit_core_model_rule, --test unit_core_web_parity, --test units_braz_web_parity, --test units_kamien_web_parity, --test units_zelazo_web_parity, --test wonders_web_parity; parity: YES)
M04 bounding box min.x uses Math.max: DETECTED (10 failed tests; binaries: --test cities_web_parity, --test misc_web_parity, --test unit_core_web_parity, --test units_braz_web_parity, --test units_kamien_web_parity, --test units_zelazo_web_parity, --test wonders_web_parity; parity: YES)
M05 retint compares with != (re-tints the wrong materials): DETECTED (5 failed tests; binaries: --lib, --test unit_core_model_rule, --test unit_core_web_parity, --test units_zelazo_web_parity; parity: YES)
M06 graft: mesh material slots not shifted: DETECTED (2 failed tests; binaries: --lib, --test core_web_parity; parity: YES)
M07 Material::standard drops roughness: DETECTED (13 failed tests; binaries: --lib, --test improvements_web_parity, --test unit_core_model_rule, --test unit_core_web_parity, --test units_braz_web_parity, --test units_kamien_web_parity, --test units_zelazo_web_parity; parity: YES)
M08 Prim::Circle builds one segment more: DETECTED (4 failed tests; binaries: --test cities_web_parity, --test misc_web_parity; parity: YES)
M09 Prim::Ring with 2 phi segments: DETECTED (1 failed tests; binaries: --test misc_web_parity; parity: YES)
M10 unit signature skips roughness: DETECTED (11 failed tests; binaries: --test unit_core_model_rule, --test unit_core_web_parity, --test units_braz_web_parity, --test units_kamien_web_parity, --test units_zelazo_web_parity; parity: YES)
M11 decor leaf: quaternion not derived from rotation: DETECTED (2 failed tests; binaries: --test decor_web_parity; parity: YES)
M12 decor leaf: renderOrder dropped: DETECTED (1 failed tests; binaries: --test decor_web_parity; parity: YES)
M13 mergeDecor: group not flagged after collapse: DETECTED (1 failed tests; binaries: --test core_web_parity; parity: YES)
M14 fogDim: every class dimmed (Physical/Toon too): DETECTED (1 failed tests; binaries: --test core_web_parity; parity: YES)
M15 unit HexRing body: outer/inner swapped: DETECTED (1 failed tests; binaries: --test unit_core_web_parity; parity: YES)
M16 improvements TwistedCone: twist sign: DETECTED (1 failed tests; binaries: --test improvements_web_parity; parity: YES)
M17 improvements userData perTokenGeos length +1: DETECTED (1 failed tests; binaries: --test improvements_web_parity; parity: YES)
M18 cities HexWallRing: no rotateX(-PI/2): DETECTED (1 failed tests; binaries: --test cities_web_parity; parity: YES)
M19 cities LineBasic: depthWrite inverted when stored: DETECTED (2 failed tests; binaries: --test cities_web_parity; parity: YES)
M20 cities userData rozmiar key misspelt: DETECTED (1 failed tests; binaries: --test cities_web_parity; parity: YES)
M21 misc signature skips opacity: DETECTED (1 failed tests; binaries: --test misc_web_parity; parity: YES)
M22 wonders banner material not greyed for ruins: DETECTED (2 failed tests; binaries: --test wonders_web_parity; parity: YES)
detected 22/22
EXIT=0
```

`logi/test-nocapture.txt` (651 linii, ten sam przebieg z `--nocapture`, EXIT=0) — w katalogu runu.
