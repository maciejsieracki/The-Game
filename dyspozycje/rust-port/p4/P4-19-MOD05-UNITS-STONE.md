# P4.19 — MOD-05: modele jednostek epoki Kamienia w Rust (CPU), 1:1 z webem

STATUS dokumentu: Operator r1
TEMAT: R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1 · DOMAIN: GAME · baza kodu: `origin/rust-port/parity-v2` @ `bf59164b`
Web źródłowy: `edb8fb56` (wyłącznie `git archive edb8fb56 gra/src gra/data` do katalogu scratch poza repo; bez `npm run build/dev`; zero zmian w `gra/**`).
Wejście: `P4-4-MODEL-CATALOG.md` (§4.2 paczka 5, D-MOD-1..9), `P4-13-MOD04-UNIT-CORE.md` (§7 rejestr stubów), `P4-3`, `P4-6`, `P4-8` + `src/geom/**`, `P4-11` (wzorzec weryfikacji), `P4-16` (`jsmath`).

## 0. Streszczenie

- **Nowy moduł** `rust-port/renderer/src/models/units_kamien/` (7 plików, ok. 4,5 tys. linii): port 1:1 czterech plików web
  `kamien-bazowe-opus5.ts` (4 buildery), `kamien-inka-opus5.ts` (2), `kamien-lucznicy-opus5.ts` (2), `kamien-zulu-taran-opus5.ts` (2) —
  **10 builderów = 10 rekordów `units.json` epoki Kamień (10/10)**. Model = drzewo `models::unit_core::model::UnitModel`
  (bez nowego typu drzewa), materiały jako dane, bez GPU.
- **Stuby `NotYetPorted` zastąpione** dla całej paczki MOD-05 (lista P4-13 §7: WojownikOpus5, OszczepnikOpus5, LucznikOpus5,
  ZwiadowcaOpus5, MaceWarrior, InkaJavelineer, ZuluJavelineer, BatteringRam, EgyptianArcher, SumerianArcher) — w `registry::build_base`
  i w `buildCategoryModel` (`lucznik`, `oszczepnik`, `zwiadowca`, `obleznicza`, `domyslny`/nieznana). Publiczne sygnatury `unit_core` bez zmian.
- **Weryfikacja bitowa vs uruchomiony web** (three 0.169.0, node v22.22.0, `to_bits()`, zero tolerancji): **40 przypadków / 153 056 wartości:
  0 rozbieżności** (10 builderów × 2 kolory właściciela, 10 rekordów przez `buildUnitModel` z nazwą PL i 10 z nazwą EN).
  Dodatkowo, bez zmiany fixture P4.13: 6 przypadków kategorii z `unit_core.json`, które były stubami (`cat:lucznik|oszczepnik|zwiadowca|obleznicza|domyslny|nieznana-kategoria`),
  porównane pełnym drzewem — **0 rozbieżności** (P4.13: 67/68 porównanych, 133 311 wartości); sygnatury `records[].sigPl/sigEn` 10 rekordów Kamienia z fixture P4.13 — zgodne.
- **Nowy port V8 `Math.asin`** (fdlibm `e_asin.c`) do odwzorowania `quaternion.copy(q); rotation.y += π/4` (Euler.setFromQuaternion): **5 027 próbek V8, 0 rozbieżności**.
- Mutacje: **18/18 wykrytych** (§6). Bramki: fmt / clippy / clippy+gpu / test — **EXIT=0** (§8). Zero nowych zależności, `Cargo.toml`/`Cargo.lock` bez zmian, `forbid(unsafe_code)` zachowane.

## 1. Zakres, decyzje i ZAŁOŻENIA

| # | Pozycja | Rozstrzygnięcie |
|---|---|---|
| Z1 | Dispatch: „`lib.rs`: dopisz TYLKO jedną linię `pub mod <twój_moduł>;`” vs allowlista „jedna linia modułu w `src/models.rs`” | **ZAŁOŻENIE:** moduł jest podmodułem `models` (jak `unit_core`, `wonders`), więc jedyna linia trafia do `src/models.rs` (`pub mod units_kamien;`). `lib.rs` bez zmian (ma już `pub mod models;`). |
| Z2 | Geometrie spoza `Prim` (`makeTaperGeo` ×3 profile, `kzShellGeo`, `kzFaceGeo`, `CircleGeometry`) | Typ `KamienGeo` (Copy) **we własnym module** (`units_kamien/geo.rs`). Drzewo `UnitModel` przechowuje geometrię jako zamknięty enum `Prim` — bez punktu zaczepienia nie da się go użyć bez nowego typu drzewa (zakazane). **Minimalna zmiana w `unit_core/model.rs` (5 linii):** wariant `Prim::Kamien(KamienGeo)` + gałąź `build()`. Hash/bbox/sygnatura działają bez zmian. |
| Z3 | Lista zmian w `src/models/unit_core/**` (allowlista: „wyłącznie tam, gdzie stub kieruje do tej paczki”) | (a) `registry.rs`: `build_base` deleguje `Package::Mod05Stone` do `units_kamien::build`; `pending()` liczy pakiety 6–7 (nowa `const fn is_ported`); (b) `category.rs`: gałęzie `lucznik/oszczepnik/zwiadowca/obleznicza/domyslny` → `units_kamien::build(cat.base())` (`falanga` dalej stub MOD-07); (c) `model.rs`: hak `Prim::Kamien` (Z2). Nic więcej. |
| Z4 | Testy P4.13 kodujące status stubów (`tests/unit_core_*.rs` — poza allowlistą, której wzorzec to `tests/units_kamien_*.rs`) | **ODCHYLENIE wymuszone celem:** dwa asserty liczą stuby i po ich zastąpieniu muszą się zmienić — `unit_core_web_parity.rs` (`expected_pending`: tylko `falanga`; liczniki 7→1 stub, 61→67 porównań) i `unit_core_model_rule.rs` (`compared_records` 12→32 = +10 rekordów PL +10 EN). Logika porównań bez zmian; nowe liczby oznaczają **więcej** porównanych bitowo przypadków. Bez tej zmiany bramka `cargo test` jest czerwona. |
| Z5 | Rekordy bazowe Oszczepnik/Łucznik/Zwiadowca | Routing (P4.13) bez zmian: `UNIT_MODEL_TABLE` → `Base::*Opus5`; tu dostarczona tylko geometria (`kamien-bazowe`). Wojownik idzie regułą nazwy (`units.ts:1603`). |
| Z6 | Trygonometria | `Math.sin/cos/atan2/pow` → `crate::jsmath` (P4.16); obrót Euler→kwaternion → `unit_core::model::quat_from_euler` (V8). `Math.asin` nie ma w `jsmath` (poza allowlistą) → port fdlibm w `units_kamien/kit.rs::js_asin` z własnym testem V8 (Z7). |
| Z7 | `Math.asin` | Tylko w `copy_quat_then_add_rot_y` (grot oszczepu i 3 groty zapasowe Zulu). Rekomendacja dla orkiestratora: przenieść do `jsmath` w osobnym temacie (jedna implementacja). |
| Z8 | Singletony `kbGeos` (`getG(key, make)`, pierwsze utworzenie wygrywa) | Sprawdzone skryptem: 113 kluczy `gBox/gCyl/gCone` w `kamien-bazowe-opus5.ts` — każdy zawsze z tymi samymi argumentami (0 konfliktów), więc kolejność budowania nie wpływa na geometrię; w pozostałych plikach gettery `getK*` mają stałe argumenty. `perTokenGeos` = `[]` we wszystkich 10 (sprawdzane). |
| Z9 | Styl | tylko `roblox` (D-MOD-1). Modele Kamienia nie mają gałęzi stylu. |

## 2. Architektura modułu (`rust-port/renderer/src/models/units_kamien/`)

| Plik | Zawartość | Źródło web (`edb8fb56`) |
|---|---|---|
| `mod.rs` | `build(Base, owner) -> Option<UnitModel>` (10 builderów) | — |
| `geo.rs` | `KamienGeo` (`Taper{Celt,LeafPoint,BarbedPoint}`, `NguniShell`, `NguniFace`, `Circle`), `TaperProfile` | `kamien-bazowe-opus5.ts:189-237`, `kamien-zulu-taran-opus5.ts:223-274, 365` |
| `kit.rs` | `dir_down`, `seg`, `span`, `seg_dir`, `orient_y_to`, `arm_ik` (+`ArmIkKit`), `quat_mul`, `quat_from_axis_angle`, `rotate_on_axis`, `euler_from_quat`, `copy_quat_then_add_rot_y`, `js_sign`, `js_asin` | `kbSeg/kbSpan` `:243-273`; `klSegDir/klArmIK` `kamien-lucznicy-opus5.ts:348-430`; `kzSegDir/kzArmIK` `kamien-zulu-taran-opus5.ts:391-433`; three r169 `Object3D.rotateOnAxis`, `Quaternion.setFromAxisAngle/multiply`, `Euler.setFromRotationMatrix`; V8 `base::ieee754::asin` |
| `bazowe.rs` | `build_wojownik_opus5`, `build_oszczepnik_opus5`, `build_lucznik_opus5`, `build_zwiadowca_opus5` + `kbBoot/kbBareFoot/kbBuildLeg/kbBuildArm/kbShoulder/kbBuildTorso/kbBuildHead/kbOwnerSash/kbSkirtBelt/kbFurCap/kbLashing` | `kamien-bazowe-opus5.ts:279-480, 491-1190` |
| `inka.rs` | `build_mace_warrior_opus5`, `build_inka_javelineer_opus5` + `kiBuildLeg/Arm/Torso/Head/SkirtSet/Chuspa/Spondylus/Macana` | `kamien-inka-opus5.ts:235-522, 534-894` |
| `lucznicy.rs` | `build_egyptian_archer_opus5`, `build_sumerian_archer_opus5` + `klStretch/BuildLeg/BuildCore/AddBowLimbs/AddString/AddArrow/AddQuiver/ArcherLegs/ArcherArms` | `kamien-lucznicy-opus5.ts:269-643, 653-958` |
| `zulu_taran.rs` | `build_zulu_javelineer_opus5`, `build_battering_ram_opus5` + `kzBuildLeg/kzAmashoba/ktLashing` | `kamien-zulu-taran-opus5.ts:327-371, 436-764, 817-1091` |

Uwagi wierności: kolejność tworzenia materiałów (= `userData['mats']`) i `add()` dosłownie jak w źródle; podgrupy (`sh` tarcz, `wg` maczugi/atlatla, `bow` łuku)
tworzone „odłączone” i doczepiane w tym samym miejscu co w webie; `quaternion.setFromUnitVectors` przez `unit_core::model::quat_from_unit_vectors`
(z `normalize()`); `Math.min/max` przez `pick::three::js_min/js_max`; `Matrix4.makeRotationY` + `applyMatrix4` (z dzieleniem przez `w`) przez `geom`.
Delegacje web: `buildMaceWarrior` `units.ts:1782-1785`, `buildZuluJavelineer` `:2163-2168`, `buildSumerianArcher` `:2185-2190`, `buildEgyptianArcher` `:2400-2405`,
`buildInkaJavelineer` `:2484-2487`, `buildBatteringRam` `:3237-3240`, `case 'lucznik'` `:3931-3934`, `case 'oszczepnik'` `:3943-3946`, `case 'zwiadowca'` `:4685-4688`,
`case 'obleznicza'` `:4755-4759`, `default` `:4762-4766` — wszystkie zwracają wynik buildera Opus 5 bez modyfikacji.

## 3. Weryfikacja (wzorzec P4.11 / P4.13)

### 3.1 Metoda
`tests/fixtures/units_kamien/gen.ts` (+ `build.mjs`) uruchamia **niezmienione** moduły `edb8fb56` — w odróżnieniu od P4.13 **bez żadnej adaptacji**
(wszystkie potrzebne symbole są eksportowane). Format rekordu identyczny z `unit_core` (bity binary64, FNV-1a 32). Fixture deterministyczny
(dwa przebiegi → ten sam SHA-256).

### 3.2 Przypadki (`tests/units_kamien_web_parity.rs`, 5 testów)

| Test | Co sprawdza | Wynik |
|---|---|---|
| `every_web_case_is_reproduced_bit_for_bit` | 40 drzew: `fn:` 20 (10 builderów × OWNER_A/OWNER_B przez `registry::build_base`), `unit:` 10 (`model_for(UnitTypeId(PL))` → `build_model`, + równość z `legacy_route`), `unitEn:` 10 (`legacy_route(kat, EN)`). Na węzeł: rodzaj, nazwa, rodzic, `p`, `q`, `s`, `matrixWorld`; na siatkę: wierzchołki, trójkąty, hash geometrii, materiał (hex, liniowy, metalness, roughness, transparent, opacity, flatShading), indeks w `mats`; na model: `mats`, bbox, liczba siatek/trójkątów, sygnatura, `perTokenGeos`. | **153 056 wartości, 0 rozbieżności** |
| `the_ten_records_cover_every_mod05_builder_and_counts_match_the_web` | 10 rekordów Kamień ↔ 10 różnych `Base` MOD-05 (D-MOD-9 = A); liczby siatek/trójkątów | zgodne (tabela §3.3) |
| `routing_no_longer_returns_not_yet_ported_for_the_stone_package` | `build_base` Ok dla 10 `Base` MOD-05, `pending()` bez MOD-05, `build_category_model` Ok dla 6 etykiet (= builder `cat.base()`), `falanga` dalej stub MOD-07, `build_model` Ok dla 10 rekordów | ok |
| `unit_core_record_signatures_of_the_stone_records_match` | niezależnie: `records[].sigPl/sigEn` z fixture P4.13 dla 10 rekordów Kamień | 20/20 zgodne |
| `asin_matches_v8` | `js_asin` vs V8 `Math.asin`, 5 027 próbek (siatka [-1,1] co 0,001, 3 000 pseudolosowych, wartości graniczne 2⁻²⁷, 0,5, 0,975, ±1, ±0) | 0 rozbieżności |

### 3.3 Liczby (web = Rust, OWNER_A)

| Builder (`units.json`) | siatki | trójkąty | wierzchołki | materiały |
|---|---|---|---|---|
| `buildWojownikOpus5` (Wojownik) | 87 | 1198 | 2329 | 17 |
| `buildOszczepnikOpus5` (Oszczepnik) | 71 | 1016 | 2073 | 16 |
| `buildLucznikOpus5` (Łucznik) | 84 | 1138 | 2242 | 15 |
| `buildZwiadowcaOpus5` (Zwiadowca) | 81 | 1092 | 2157 | 16 |
| `buildMaceWarriorOpus5` (Wojownik z maczugą (Chaska)) | 100 | 1308 | 2550 | 19 |
| `buildInkaJavelineerOpus5` (Oszczepnik (Estólica)) | 85 | 1112 | 2164 | 18 |
| `buildZuluJavelineerOpus5` (Oszczepnik Zulu (Izijula)) | 86 | 1342 | 2532 | 16 |
| `buildBatteringRamOpus5` (Taran) | 85 | 1244 | 2084 | 14 |
| `buildEgyptianArcherOpus5` (Łucznik egipski) | 86 | 1032 | 2064 | 20 |
| `buildSumerianArcherOpus5` (Łucznik sumeryjski) | 95 | 1136 | 2275 | 18 |

Sygnatury (FNV-1a) OWNER_A: 3961081612, 478284037, 2704862752, 1416415603, 333188090, 3164999933, 1112673657, 143645855, 3603742605, 1056541089 —
równe `records[].sigPl` = `sigEn` w fixture P4.13 (ścieżka EN daje ten sam model dla wszystkich 10 rekordów).

### 3.4 Wpływ na testy P4.13 (ODCHYLENIE Z4)
`unit_core_web_parity`: `68 cases, 67 compared (133311 values bit-exact checked), 1 pending stubs: ["cat:falanga"]` (było 61/7).
`unit_core_model_rule`: `175 calls, 39 ported signatures compared` (było 19), w tym 32 wywołania rekordów (było 12). Wszystkie zgodne.

## 4. Reguła „jedna jednostka = jeden model” (D-MOD-9 = A)
Bez zmian w tabeli P4.13: 10 wierszy `UNIT_MODEL_TABLE` (`routing.rs:708-756`) wskazuje 10 różnych `Base` MOD-05, które teraz budują model.
Test `unit:` sprawdza `model_for(PL)` = `legacy_route(kat, PL)` i `Package::Mod05Stone`.

## 5. Odkrycia
1. **`quaternion.copy(q); rotation.y += π/4`** (`kamien-zulu-taran-opus5.ts:622-623, 749-750`): Three przelicza najpierw Euler z kwaternionu (`setFromQuaternion` →
   `setFromRotationMatrix`, `Math.asin` + `Math.atan2`), potem kwaternion z Eulera. Prosty „obrót o π/4 wokół Y” dałby inny wynik — odwzorowane dosłownie
   (`kit::copy_quat_then_add_rot_y`), mutacja M01 wykrywana.
2. `Object3D.rotateY/rotateZ` (`kamien-bazowe-opus5.ts:985`, `kamien-lucznicy-opus5.ts:575`) = mnożenie kwaternionu z prawej (M02 wykrywa zamianę kolejności).
3. Taper/łuska Nguni: pozycje liczone w f64, zapis f32, `computeVertexNormals` bez indeksu — zgodne bitowo (hashe geometrii).

## 6. Test mutacyjny (`dyspozycje/autobot/runs/R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1/mutate.py`, log `logi/mutate.txt`)
**18/18 wykrytych, 0 błędów budowania**, `EXIT=0` (`--no-fail-fast`, plik przywracany bajt w bajt): pominięte `+= π/4` (Euler), kolejność `rotateOnAxis`,
profil celtu, wykładnik Nguni, segmenty łaty, clamp IK, ugięcie łuku, libm zamiast V8 w kolcach maczugi, `KL_GRIP`, skala tarczy, obrót klina tarana,
MOD-05 pozostawione jako `NotYetPorted`, brak dna tapera, roughness materiału właściciela, `pio2_lo` w `js_asin`, `klStretch` bez głębokości,
`domyslny` → zły builder, pusty hak `Prim::Kamien`. Każdą (poza `js_asin` → `asin_matches_v8`) wykrywa `every_web_case_is_reproduced_bit_for_bit`.

## 7. Fixture i skrypty (`rust-port/renderer/tests/fixtures/units_kamien/`, 3,0 MB < 8 MB, nic nie pominięto)

| Plik | SHA-256 |
|---|---|
| `units_kamien.json` | `29c9793a2a395b7ca7a4989c14282c76dda339dfa597630a0fa723137f11569a` |
| `gen.ts` | `d1b33c5bae497c808e763ae0c0873fbb3d44814a406f671dfa40bef7712db163` |
| `build.mjs` | `99e42632d2f931249ee741f6a4b422f2f015be841aa40e71c28916c31028449f` |

Odtworzenie: `README.md` w katalogu. Wyjście generatora: `units_kamien cases=40 records=10 asin=5027`. Katalog scratch usunięty po pracy.

## 8. Bramki (pełne surowe logi: `dyspozycje/autobot/runs/R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1/logi/`, skrypt `gates.sh`)

```text
$ cargo fmt --all -- --check; echo "EXIT=$?"                                   EXIT=0   (logi/fmt.txt)
$ cargo clippy --locked --all-targets -- -D warnings; echo "EXIT=$?"            EXIT=0   (logi/clippy.txt)
$ cargo clippy --locked --all-targets --features gpu -- -D warnings; echo ...   EXIT=0   (logi/clippy-gpu.txt)
$ cargo test --locked --all-targets; echo "EXIT=$?"                             EXIT=0   (logi/test.txt)
  unittests 7 · assets_nturns 6 · assets_registry 14 · camera_web_parity 5 · core_web_parity 8 · cpu_sanity 1 · geom_three_parity 17 · gpu_probe 0
  jsmath_v8_parity 13 · jsmath_wiring 4 · pick_golden 7 · terrain_web_parity 5 · unit_core_json 0 · unit_core_model_rule 7 · unit_core_trig 2
  unit_core_web_parity 3 · units_kamien_web_parity 5 · wonders_web_parity 4 — wszystkie ok, 0 failed
$ cargo test --locked --all-targets -- --nocapture; echo "EXIT=$?"              EXIT=0   (logi/test-nocapture.txt)
```
`git diff --check` czysty; `Cargo.toml`/`Cargo.lock` bez zmian; `jsmath_wiring` (skaner użycia libm) zielony.

## 9. NIE_ZMIERZONO i lista „co ocenić wzrokiem po RR-T5”

NIE_ZMIERZONO:
1. **Wygląd 1:1** (wymaga GPU i shaderów RR-T5) — geometria/transformacje/parametry materiału zgodne bitowo, piksele nie były renderowane.
2. `js_asin` na platformach innych niż Linux x86-64 (operacje fdlibm są przenośne, ale nie uruchomiono testu na Windows/macOS).
3. Wydajność budowy modeli i instancjonowanie siatek na GPU (RR-T5/RR-T7).

Co ocenić wzrokiem po RR-T5 (zrzut web vs Rust, ta sama kamera gry 52°, kolor `0xd03030` i `0x2a6fdb`):
Wojownik (topór krzemienny w mufie z poroża, tarcza ośmioboczna z wyplotem), Oszczepnik (atlatl z hakiem, oszczep na miotaczu, 2 zapasowe),
Łucznik (długi łuk Holmegaard z cięciwą w V, strzała z 3 lotkami, kołczan w kolorze gracza), Zwiadowca (płaszcz z trawy, plecak na ramie, kij z rozwidleniem),
Chaska (maczuga gwiaździsta, hełm chuku, tarcza wallqanqa), Estólica (atlatl w zamachu, oszczep pod kątem, pęk na plecach),
Łucznik egipski (łuk dwuwypukły, grot poprzeczny, kołnierz z paciorków), Łucznik sumeryjski (kaunakes 4 poziomy, narzuta), Izijula (tarcza Nguni z łatami,
plecionka, groty kościane obrócone o π/4), Taran (płozy, kozioł, kłoda z klinem, daszek ze skór, proporzec).

## 10. Pliki (allowlista)

- `rust-port/renderer/src/models.rs` (+1 linia `pub mod units_kamien;`), `rust-port/renderer/src/models/units_kamien/*.rs` (7 plików, nowe)
- `rust-port/renderer/src/models/unit_core/{model,registry,category}.rs` — wyłącznie miejsca stubów MOD-05 + hak `Prim::Kamien` (Z2, Z3)
- `rust-port/renderer/tests/units_kamien_web_parity.rs`, `rust-port/renderer/tests/fixtures/units_kamien/**`
- `rust-port/renderer/tests/unit_core_web_parity.rs`, `tests/unit_core_model_rule.rs` — wyłącznie liczniki stubów (ODCHYLENIE Z4)
- `dyspozycje/rust-port/p4/P4-19-MOD05-UNITS-STONE.md` (ten dokument), `dyspozycje/autobot/runs/R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1/**` (raport, logi, `mutate.py`, `gates.sh`)
- Bez zmian: `gra/**`, `src-tauri/**`, `rust-port/engine/**`, `rust-port/renderer/src/{geom,pick,assets,camera,terrain,jsmath}/**`, `lib.rs`, `jstrig.rs`, `Cargo.toml`, `Cargo.lock`.

## 11. Obrona Operatora r1 (po Evaluatorze)

Szczegóły: `dyspozycje/autobot/runs/R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1/02-obrona-operator-r1.md`.
Zmiany: `is_ported` w `unit_core/registry.rs` prywatna (zero nowych publicznych funkcji w `unit_core`);
test parytetu porównuje też `geometry.type` (156 496 wartości, 0 rozbieżności; mutant → 24 rozbieżności);
osobny plik `tests/fixtures/units_kamien/units_kamien.json.sha256`. Odchylenia 1 (testy P4.13) i 2
(`Prim::Kamien`) podtrzymane jako wymuszone — do akceptacji orkiestratora; `js_asin` → `jsmath` = osobny temat.
