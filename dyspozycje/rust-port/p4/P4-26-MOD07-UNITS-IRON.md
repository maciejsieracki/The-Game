# P4.26 — MOD-07: modele jednostek epoki Żelaza w Rust (CPU), 1:1 z webem

**TEMAT:** `R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1` · **DOMAIN:** GAME · **Rola:** Operator, runda 1 (+ obrona r1, §9)
**Baza:** odłączony `origin/rust-port/parity-v2` @ `d405b0d7` · **Web referencyjny:** `edb8fb56` (`git archive`)
**Crate:** `rust-port/renderer` (bez GPU, `forbid(unsafe_code)`, bez nowych zależności, `Cargo.lock` bez zmian)

## 0. Streszczenie

- Paczka MOD-07 jest przeniesiona w całości: 8 plików web (`hastati-opus5`, `hastati-falangita`, `jednostki-p6-super`, `jednostki-z1/z2/z3`, `zelazo-jezdziec-oszczepami-opus5`, `zelazo-konnica-asyryjska-opus5`) oraz 3 funkcje z geometrią w `units.ts` (`buildGaesatae`, `buildSoldurii`, `buildCatapult`). To **25 `Base` MOD-07**: 24 rekordy `units.json` Żelazo (25 minus Rydwan celtycki z MOD-04) plus `HastatiOld` (`buildHastati`, eksport bez rekordu i bez reguły nazwy — przeniesiony, żeby nie został stub; Z5).
- Drzewo to wyłącznie `unit_core::model::UnitModel`. Wszystkie stuby `NotYetPorted` w `unit_core` są zastąpione: rejestr (`registry::build_base`) deleguje MOD-07 do `units_zelazo::build`, a `build_category_model(Falanga)` (`case 'falanga'`, ostatni stub kategorii) buduje `buildFalangita`. **`pending()` jest puste; żaden `Base` ani żadna kategoria nie zwraca `NotYetPorted`** (test `no_unit_builder_is_a_stub_any_more`). Publiczne sygnatury bez zmian.
- **Parytet z uruchomionym webem:** 146 przypadków (`fn:` 44, `unit:` PL 25, `unitB:` PL owner B 25, `unitEn:` 25, `unitEnB:` EN owner B 25, `cat:falanga` 2). Sprawdzono **329 382 wartości bitowo, 0 rozbieżności** (liczby mesh/trójkątów/wierzchołków, pozycje, kwaterniony, skale, macierze świata, bbox, kolory sRGB i liniowe, materiały, typy i hash geometrii, nazwy, rodzice, sygnatura).
- **Trygonometria:** wyłącznie `crate::jsmath` (`js_sin/js_cos/js_atan2/js_hypot_n`, a `js_asin` przez `euler_from_quat` przy `setFromUnitVectors` z późniejszym `rotation.y = …`). Skaner `jsmath_wiring` zielony.
- **Mutacje:** 31/31 wykrytych (w tym 4 mutacje funkcji platformowych, które wyłapuje tylko `jsmath_wiring`, uruchamiany w skrypcie; §4).
- **Bramki:** fmt, clippy, clippy `--features gpu`, `cargo test --all-targets` — EXIT=0 (§6; pełne surowe logi w Załączniku A).

## 1. Zakres, decyzje i ZAŁOŻENIA

| # | Pozycja | Rozstrzygnięcie |
|---|---|---|
| Z1 | Dispatch | `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1/00-dispatch.md` — kopia w katalogu runu. Dokumenty P4.3/P4.4/P4.6/P4.8/P4.11 czytane z tej samej gałęzi (P4.4 §4.2 wiersz 7: „24 rekordy (Żelazo 25 − Rydwan celtycki z paczki 4)”). |
| Z2 | Linia modułu | Jedna linia `pub mod units_zelazo;` w `src/models.rs` (jak P4.19 Z1 / P4.23 Z2); `lib.rs` bez zmian, bo `models` już jest modułem. |
| Z3 | Geometrie spoza `Prim`/`BrazGeo` | Nowy typ `ZelazoGeo` (Copy) w `units_zelazo/geo.rs`: `Ring` (`RingGeometry`, `hastati-falangita.ts:229`, `jednostki-p6-super.ts:269`), `OvalRim` (`makeOvalRimGeo`, `hastati-opus5.ts:326-349`, z `RimArc::{Top,Bottom}` = `HO_RIM_TOP/BOT` `:352-353`), `JavelinHead` (`sjMakeLeafHeadGeo`, `zelazo-jezdziec-oszczepami-opus5.ts:527-551`, własna tabela sekcji). **Hak w `unit_core/model.rs` (5 linii):** wariant `Prim::Zelazo(ZelazoGeo)` + gałąź `build()` — to „analogiczny wariant jak `Prim::Kamien`/`Prim::Braz`” z dispatchu. `geom/**` nietknięte (`ring_geometry` już w `geom`). |
| Z4 | Reużycie (jedna implementacja) | Owalna skorupa/lico (`makeOvalShellGeo`/`z1MakeShell`/`z2OvalShellGeo`/`s6OvalShellGeo`/`trOvalShell` … — tekstowo ta sama funkcja co w MOD-06) = istniejące `BrazGeo::OvalShell/OvalFace`; grot lancy `acMakeLeafHeadGeo` (`zelazo-konnica-asyryjska-opus5.ts:448-473`) ma tabelę sekcji identyczną z `knMakeLeafHeadGeo` = `BrazGeo::Blade{LeafHead}`; łańcuch kończyn (`niSeg`/`z1Seg` = `units_kamien::kit::seg`), `rot3`, `quat_units_synced`, `apply_quat`, `rotate_on_axis` z `units_braz/kit` i `units_kamien/kit`. Celtyckie `buildGaesatae`/`buildSoldurii` używają helperów MOD-04 (`build_base_avatar`, `add_torc`, `add_tall_oval_shield`, `add_spear_right`, `add_long_sword_right`, `add_mustache`, `add_long_hair`, `add_boots`, `add_hands`, `add_belt`, `add_tunic_hem`). |
| Z5 | `buildHastati` (`hastati-falangita.ts:327`) | Eksportowany, ale nieosiągalny: `units.ts:1665` kieruje „hastati” do `buildHastatiOpus5`, a wrapper `units.ts:2143 buildHastati` nie ma wywołujących (`grep -n "buildHastati(" gra/src/render/units.ts` → tylko definicja). Ma jednak `Base::HastatiOld` w rejestrze, więc **ZAŁOŻENIE:** przeniesiony (fixture `fn:buildHastati`), żeby GOAL „brak stubów” był spełniony bez wyjątku. Inne martwe eksporty MOD-07: brak (wszystkie 21 pozostałych eksportów ma rekord). |
| Z6 | `units.ts`-buildery | Nieeksportowane → fixture woła `buildUnitModel(categoryOf(...), owner, PL)`; Rust: `registry::build_base` (test porównuje także sygnaturę `build_base` z `unit:<PL>`). |
| Z7 | Klucze cache `z1` | `jednostki-z1-mezopotamia.ts:201-209` cache'uje po kluczu (`gBox(key, w, h, d)` → `BoxGeometry(w·HEX_R, …)`); sprawdzono, że każdy klucz występuje z jednym zestawem argumentów (`grep -o "gBox('…'" | sort | uniq -c`), więc klucz = wartość geometrii. Iloczyny w kolejności webu (`0.028 * 1.6` przed `* HEX_R`). |
| Z8 | `perTokenGeos` | Liczba porównywana (=0) dla 44 przypadków `fn:`; dla 3 builderów `units.ts` web trzyma geometrie per-token wyłącznie do zwalniania GPU — w Rust to wartości `Prim`, porównywane bitowo jak każda geometria (jak P4.23 Z7). |
| Z9 | Kolejność operacji Three.js | `rotation.x = a; rotation.y = b` → dwa `rot_*` (kwaternion z pełnego Eulera po każdym); `quaternion.setFromUnitVectors` + późniejsze `rotation.y` → `quat_units_synced` (Euler z kwaternionu, `js_asin`) — pysk konia `sjAlong`/`acAlong`; `rotateX/rotateZ` → `rotate_on_axis` (mnożenie kwaternionu); `quaternion.copy` → kopia wartości; `bow.updateMatrix()` + `applyMatrix4` → `local_matrix` + `apply_mat4`; `Math.hypot` → `js_hypot_n` (V8 Torque, Kahan); `span` katapulty dzieli przez `len` (nie `normalize()`). |
| Z10 | Styl | Tylko `roblox` (D-MOD-1); modele Żelaza nie mają gałęzi stylu. |
| Z11 | D-MOD-9 | Ścieżka EN porównana 1:1 (legacy): „Iron Khopesh Warrior” → brązowy `KhopeshWarrior` (znany rozjazd P4-4 §2.1c) — `unitEn:Wojownik z żelaznym khopesh` i `unitEnB:Wojownik z żelaznym khopesh` są w fixture jako osobne rekordy (oba kolory) i są zgodne bitowo. |

## 2. Architektura modułu (`rust-port/renderer/src/models/units_zelazo/`, 8 821 linii)

| Plik | Buildery | Źródło web (`edb8fb56`, `gra/src/render/`) |
|---|---|---|
| `mod.rs` | `build(Base, owner) -> Option<UnitModel>` (25 gałęzi; poza MOD-07 `debug_assert_ne!` i `None`) | — |
| `geo.rs` | `ZelazoGeo {Ring, OvalRim, JavelinHead}`, `RimArc` | Z3 |
| `kit.rs` | re-eksporty `units_braz/kit` + `units_kamien/kit`; `ring`, `oval_rim`, `javelin_head`, `torus_arc`; kinematyka konna: `up_dir`, `seg_down`, `seg_up`, `along`, `along_len`, `strap_unit`, `ik_arm` (`IkArmKit`, `IkArm`) | `sjSegDown/acSegDown`, `sjSegUp`, `sjAlong`, `sjAlongLen`, `sjStrap`, `sjArmIK/acArmIK` |
| `hastati_falangita.rs` | `build_hastati`, `build_falangita` | `hastati-falangita.ts:327, 527` |
| `hastati_opus5.rs` | `build_hastati_opus5` | `hastati-opus5.ts:535` |
| `p6_super.rs` | `build_super_greece`, `build_super_rome` | `jednostki-p6-super.ts:512, 768` |
| `z1.rs` | `GwardiaHetycka`, `PiechotaNeobabilonska`, `MurTarcz`, `GarnizonHarappy` | `jednostki-z1-mezopotamia.ts:453, 674, 906, 1183` |
| `z2.rs` | `TyrskiMiecznik`, `GwardiaTyrenska`, `ZelaznyKhopesh`, `Thorakites`, `Triari` | `jednostki-z2-srodziemne.ts:651, 806, 1002, 1199, 1400` |
| `z3.rs` | `Druzynnik`, `IButho`, `Berserker` (Z3), `GermanSuper`, `MiecznikGalijski` | `jednostki-z3-plemiona.ts:614, 932, 1169, 1330, 1774` |
| `jezdziec.rs` | `build_zelazo_jezdziec_oszczepami` | `zelazo-jezdziec-oszczepami-opus5.ts:1119` |
| `konnica_asyr.rs` | `…_lancowa_…`, `…_lucznicza_…` | `zelazo-konnica-asyryjska-opus5.ts:924, 1009` |
| `units_ts.rs` | `build_gaesatae`, `build_soldurii`, `build_catapult` | `units.ts:2825, 2947, 3348` |

**Zmiany w `unit_core/**` (allowlista: wyłącznie miejsca stubów i wariant geometrii):**
- `model.rs`: wariant `Prim::Zelazo` + gałąź `build()` (Z3).
- `registry.rs`: `is_ported` obejmuje `Mod07Iron`; `build_base` deleguje `Package::Mod07Iron` do `units_zelazo::build(...).ok_or(NotYetPorted)`; dokumentacja stubów zaktualizowana (pakiety 5–7 → „pusto od MOD-07”). Gałąź `other => Err(NotYetPorted::of(other))` zostaje jako wymagana przez wyczerpujący `match` (osiągalna dla żadnego `Base`).
- `category.rs`: `UnitCategory::Falanga` → `units_zelazo::build(cat.base(), owner).ok_or(...)` + dokumentacja modułu/funkcji o stubach.

**Lista stubów pozostałych po paczce: brak.** Uzasadnione pozostałości mechanizmu (nie stuby): typ `NotYetPorted` i funkcja `pending()` (część publicznych sygnatur — dispatch: „bez zmiany publicznych sygnatur”), nieosiągalna gałąź `other =>` w `build_base`. **Nieaktualny komentarz poza allowlistą:** `unit_core/mod.rs:17` („packages 5–7 are `NotYetPorted` stubs”) — nie zmieniony, bo plik nie jest na liście; do korekty przy integracji/temacie porządkowym.

## 3. Weryfikacja

### 3.1 Metoda

1. Generator `tests/fixtures/units_zelazo/gen.ts` uruchamia **niezmieniony** web `edb8fb56` (three@0.169.0, esbuild@0.24.0, node v22.22.0, bez WebGL) i zapisuje pełne drzewo każdego przypadku (format P4.13/P4.19/P4.23: na węzeł `kind`, `name`, `parent`, `p`, `q`, `s`, `matrixWorld`; na siatkę typ, `vtx`, `tri`, hash FNV-1a geometrii, materiał, indeks w `userData['mats']`; na model `mats`, bbox, liczby, sygnatura; liczby zmiennoprzecinkowe jako bity f64).
2. Determinizm: dwa uruchomienia do osobnych katalogów → identyczny SHA-256 `f5fa5268…f97805` (r1: `cc657f0f…1c28c76`, 121 przypadków; obrona r1 dodała `unitEnB:`, §9).

### 3.2 Testy `tests/units_zelazo_web_parity.rs` (4)

| Test | Co sprawdza | Wynik |
|---|---|---|
| `every_web_case_is_reproduced_bit_for_bit` | 146 drzew: `fn:` 22 buildery × 2 kolory przez `registry::build_base`; `unit:`/`unitB:` przez `model_for(PL)` → `build_model` (z asercją `model_for == legacy_route(kat, PL)`); `unitEn:`/`unitEnB:` przez `legacy_route(kat, EN)` z OWNER_A/OWNER_B; `cat:falanga` przez `build_category_model(Falanga)` (z asercją równości z `build_model(legacy_route("falanga", None))`). Dla `fn:` także `perTokenGeos = 0`. | **329 382 wartości, 0 rozbieżności** |
| `the_records_cover_every_mod07_builder_and_counts_match_the_web` | 25 rekordów Żelazo → 24 różne `Base` MOD-07 (+ `HastatiOld` = 25); liczby siatek/trójkątów 22 eksportów; liczby i sygnatura 3 builderów `units.ts` przez `build_base` | zgodne |
| `no_unit_builder_is_a_stub_any_more` | `pending()` puste; **każdy** `Base::ALL` buduje się przez `build_base`; każda `UnitCategory::ALL` przez `build_category_model`; `units_zelazo::build` = `None` dla innych pakietów; każdy rekord Żelazo z tabeli reguł buduje się | ok |
| `unit_core_record_signatures_of_the_iron_records_match` | niezależnie: `sigPl` z fixture P4.13 dla 25 rekordów Żelazo | zgodne |

### 3.3 Liczby (web = Rust, OWNER_A, `unit:<PL>`)

| Rekord (kategoria) | siatki | trójkąty | wierzchołki | materiały |
|---|---|---|---|---|
| Falanga (falanga) | 27 | 404 | 733 | 12 |
| Hieros Lochos (Święty Zastęp) (super) | 40 | 552 | 1033 | 12 |
| Hastati (legionista) | 92 | 1378 | 2747 | 15 |
| Triari (super) | 37 | 486 | 1013 | 12 |
| Gaesatae (miecznik) | 29 | 824 | 991 | 14 |
| Soldurii (miecznik) | 32 | 694 | 982 | 15 |
| Wojownik germański (super) | 37 | 492 | 935 | 13 |
| Berserker germański (miecznik) | 30 | 360 | 720 | 10 |
| Katapulta (obleznicza) | 48 | 1560 | 2249 | 8 |
| Konnica lancowa asyryjska (konnica) | 101 | 1618 | 2801 | 23 |
| Konnica łucznicza asyryjska (konnica) | 107 | 1430 | 2677 | 21 |
| Drużynnik (miecznik) | 32 | 424 | 816 | 10 |
| Jeździec z oszczepami (konnica) | 117 | 2074 | 3609 | 20 |
| Garnizon Harappy (miecznik) | 37 | 464 | 916 | 12 |
| Gwardia hetycka (miecznik) | 34 | 456 | 983 | 10 |
| Piechota neobabilońska (miecznik) | 37 | 460 | 911 | 11 |
| Tyrski miecznik (miecznik) | 30 | 416 | 775 | 8 |
| Gwardia Tyreńska (miecznik) | 33 | 452 | 847 | 7 |
| Thorakites (wlocznik) | 32 | 430 | 887 | 12 |
| Evocati (super) | 39 | 514 | 1055 | 11 |
| iButho z iklwa (wlocznik) | 39 | 482 | 1012 | 13 |
| Wojownik z żelaznym khopesh (miecznik) | 31 | 396 | 766 | 9 |
| Mur tarcz (Sargonid) (wlocznik) | 35 | 436 | 863 | 10 |
| Miecznik galijski (miecznik) | 44 | 570 | 1177 | 14 |

Poza MOD-07, ale także porównany (należy do epoki Żelazo): Rydwan celtycki (MOD-04, P4.13) — 101 / 1612 / 2838 / 17. `buildHastati` (bez rekordu): 35 / 462 / 965 / 10.

### 3.4 Wpływ na testy P4.13/P4.19/P4.23 (ODCHYLENIA, wszystkie wymuszone)

- **O1** `tests/unit_core_model_rule.rs` (allowlista: liczniki stubów): `compared_records` 105 → **152**, tj. +47 wywołań rekordów PL/EN trafiających do buildera MOD-07 (25×2 − Rydwan celtycki PL/EN − EN „Iron Khopesh Warrior” → brąz) — teraz porównywane są **wszystkie** wywołania rekordów. Logika testu bez zmian.
- **O2** `tests/unit_core_web_parity.rs` (allowlista: liczniki stubów): `expected_pending` nie zwraca już `falanga`; `pending.len()` 1 → **0**, `ported` 67 → **68** (`cat:falanga` porównywany bitowo jak reszta).
- **O3** `tests/units_kamien_web_parity.rs` i `tests/units_braz_web_parity.rs` (allowlista: tylko wymuszone `match`): wyczerpujący `match three_type(&Prim)` nie kompiluje się po dodaniu `Prim::Zelazo` → jedna gałąź `Prim::Zelazo(z) => z.three_type()` z komentarzem, bez zmiany asercji.
- **O4** `tests/units_kamien_web_parity.rs` — **poza dosłownym brzmieniem allowlisty (tylko `match`), wymuszone przez GOAL**: test `routing_no_longer_returns_not_yet_ported_for_the_stone_package` asertował, że `build_category_model(Falanga)` jest stubem MOD-07 (`unwrap_err().base == Falangita`). Usunięcie tego stubu jest celem tematu, więc asercja odwrócona: `falanga` buduje się i ma sygnaturę `build_base(Falangita)` (7 linii, z komentarzem). Do akceptacji przez Evaluatora.

## 4. Test mutacyjny (`dyspozycje/autobot/runs/R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1/mutate.py`, log `logi/mutate.txt`)

`CMD`: `cargo test --locked --no-fail-fast --test units_zelazo_web_parity --test unit_core_web_parity --test unit_core_model_rule --test units_kamien_web_parity --test units_braz_web_parity --test jsmath_wiring` (zgodnie z dispatchem: **`jsmath_wiring` w skrypcie**). Mutacja liczona tylko gdy test FAILED (błąd kompilacji nie liczy się); plik przywracany bajt w bajt (asercja).

**Wynik: `detected 31/31, build errors 0`, `EXIT=0`** (`logi/mutate.txt`). Przebieg v1 (`logi/mutate-v1-M12-survived.txt`): 30/31 — M12 v1 (`trBuildLeg` `thighCtr` 0.5 → 0.51) PRZEŻYŁA jako mutant równoważny (czytane jest tylko `thigh_ctr.x`, a `dir_down(..).x == 0`); zastąpiona obserwowalną M12 (pas braccae na udzie Miecznika galijskiego `TR_THIGH_L * 0.74` → `0.75`), wykryta. Pokrycie:
- geometrie `geo.rs`: Ring (M01), skala obręczy `k` (M02), profil grotu oszczepu (M03), łuk dolny okucia (M04);
- buildery każdego pliku web: Falangita (M05), Hastati opus5 (M06), p6 (M07), z1 (M08, nazwy M09), z2 (M10, M11), z3 (M12, M13), `units.ts` (M21–M23);
- kinematyka konna `kit.rs`: brak `normalize` w `along` (M14), brak re-synchronizacji Eulera po `setFromUnitVectors` (M15), zamiana `w↔t` paska (M16), zasięg IK (M17), obręcz tarczy `rotateX` (M18), macierz łuku (M19), argumenty `atan2` (M20);
- haki: rejestr MOD-07 (M24), stub `falanga` (M25), `Prim::Zelazo` (M26), gałąź `HastatiOld` (M27);
- funkcje platformowe zamiast `jsmath` (M28 `cos`, M29 `sin`, M30 `atan2`, M31 `hypot`) — dają te same bity co V8 na tych danych (glibc), więc wykrywa je wyłącznie `jsmath_wiring` (`no_platform_transcendentals_anywhere_in_src`), lekcja P4.23 E10–E12.

## 5. Fixture i skrypty (`rust-port/renderer/tests/fixtures/units_zelazo/`, 2,23 MB < 8 MB)

| Plik | SHA-256 |
|---|---|
| `units_zelazo.json` | `f5fa526842b935db0775fb57ded112b7f6ca689c5712eba15133283a26f97805` (także `units_zelazo.json.sha256`) |
| `gen.ts` | `9735824f3645aab13f10a3933e17cbbcb2842edac69a7ae30bb3793747249e7c` |
| `build.mjs` | `36c2c19b3e36cb568b4b2e882cf918c79b6c7e1e0b9c0c9f069ed1ac917149c6` |

Regeneracja: `README.md` tamże. Redukcja rozmiaru: 92/146 przypadków jako `{call, sameAs}` (Rust i tak buduje własny model i porównuje w całości). Nic nie pominięto.

## 6. Bramki (surowe logi w całości: Załącznik A; pliki `dyspozycje/autobot/runs/R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1/logi/`, skrypt `gates.sh`; przebieg z obrony r1)

| Bramka | Log | Wynik |
|---|---|---|
| `cargo fmt --all -- --check` | `fmt.txt` | `EXIT=0` |
| `cargo clippy --locked --all-targets -- -D warnings` | `clippy.txt` | `EXIT=0` |
| `cargo clippy --locked --all-targets --features gpu -- -D warnings` | `clippy-gpu.txt` | `EXIT=0` |
| `cargo test --locked --all-targets` | `test.txt` | `EXIT=0`; 25 celów, 154 passed, 0 failed, 0 ignored |
| `cargo test --locked --all-targets -- --nocapture` | `test-nocapture.txt` | `EXIT=0`; `units_zelazo parity: 146 cases (…; 92 via sameAs), 329382 values bit-exact checked, 0 mismatches` |
| `mutate.py` (przez `gates.sh mutate`) | `mutate.txt` | `detected 31/31`, `EXIT=0` |

Pozostałe kontrole: `git diff --check` czysty; `Cargo.lock`/`Cargo.toml` bez zmian; nie uruchamiano `npm run build`/`dev`; `gra/**`, `src-tauri/**`, `rust-port/engine/**`, `src/{geom,pick,assets,camera,terrain}/**` bez zmian.

## 7. NIE_ZMIERZONO i „co ocenić wzrokiem po RR-T5”

**NIE_ZMIERZONO:** wygląd 1:1 na GPU (oświetlenie, cienie, sRGB w rendererze, z-fighting) — w tym temacie nie ma renderera; zgodność dotyczy drzewa obiektów, geometrii i materiałów jako danych.

**Do oceny wzrokiem po RR-T5:**
1. Konnica (Jeździec z oszczepami, Konnica lancowa i łucznicza asyryjska): obrót 3/4 korzenia (yaw 1.02), IK rąk (dłoń na drzewcu), strzemiona i puślisko, łuk w naciągu z przechyłem 0.75 rad i cięciwą do dłoni, tarcza z obręczą (orientacja torusa).
2. Owalne scutum Hastati z żelaznym okuciem tylko góra/dół (`OvalRim`), wrzecionowate umbo.
3. Pierścienie `RingGeometry` (episema Falangity, pas aspidy Hieros Lochos) — dwustronność / z-fighting z polem tarczy (`+0.021..0.022`).
4. Katapulta (onager): proporcje względem heksu, liny `span` (koniec do końca), kamień w procy.
5. Triari w klęku, Berserker (topór za barkiem), Miecznik galijski (pasy kraty braccae na nogach).
6. Kolor gracza (owner B) na polach tarcz, derkach, szarfach i barwniku Berserkera — wszystkie 24 rekordy.

## 8. Pliki (allowlista)

**Nowe:**
- `rust-port/renderer/src/models/units_zelazo/**` (12 plików);
- `rust-port/renderer/tests/units_zelazo_web_parity.rs`;
- `rust-port/renderer/tests/fixtures/units_zelazo/{units_zelazo.json, units_zelazo.json.sha256, gen.ts, build.mjs, README.md}`;
- ten dokument;
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1/{00-dispatch.md, 01-operator-r1.md, gates.sh, mutate.py, logi/}`.

**Zmienione:**
- `src/models.rs` (+1 linia);
- `src/models/unit_core/{model.rs (hak Prim::Zelazo), registry.rs (is_ported, build_base, dokumentacja), category.rs (stub falanga, dokumentacja)}`;
- `tests/unit_core_model_rule.rs` (O1), `tests/unit_core_web_parity.rs` (O2), `tests/units_braz_web_parity.rs` (O3), `tests/units_kamien_web_parity.rs` (O3 + O4).

**Integracja:** spodziewany konflikt jednej linii w `src/models.rs` (równoległe P4.27) oraz możliwy w `unit_core/model.rs`/`registry.rs`, jeśli P4.27 je zmienia.

**Scratch:** katalog `p426/` w scratchpadzie sesji (web `git archive`, `npm install` three/esbuild, wyjścia generatora) — usunięty po zakończeniu.

## 9. Obrona r1 (odpowiedź na uwagi Evaluatora N1–N5, werdykt r1 PASS-WITH-NOTES)

Stan odtworzony z commita Operatora `2b5d3d0d` (odłączony, worktree obrony), poprawki w commicie obrony.

| Uwaga | Odpowiedź | Dowód |
|---|---|---|
| N1 (O4: odwrócona asercja `falanga` w `units_kamien_web_parity.rs`) | **ODRZUCAM jako błąd** (zmiana wymuszona celem tematu, bez cofania) | GOAL dispatchu: „zastąp pozostałe stuby `NotYetPorted` … w tym `falanga`”; stara asercja `unwrap_err()` na `falanga` musiałaby czerwienić bramkę `cargo test` po spełnieniu GOAL. Zmiana dotyczy tylko tej asercji (7 linii); Evaluator sam ją przyjął. Do decyzji Final Control: zaakceptować rozszerzenie wykładni „tylko wymuszone dopasowania”. |
| N2 (ścieżka EN tylko dla OWNER_A; Khopesh EN × OWNER_B niepokryty) | **PRZYJMUJĘ** | `gen.ts` dodaje `unitEnB:<PL>` = `buildUnitModel(cat, OWNER_B, EN)` dla 25 rekordów; test mapuje `unitEnB:` przez `legacy_route(kat, EN)` z `OWNER_B`; asercje `cases.len() == 146`, `per_kind == [44, 25, 25, 25, 25, 2]`. Regeneracja z `edb8fb56` (three@0.169.0, esbuild@0.24.0, node v22.22.0): `units_zelazo cases=146 stored=54 sameAs=92 records=25`, dwa przebiegi → identyczny SHA-256 `f5fa5268…f97805`. Wszystkie 121 dawnych przypadków i `records` identyczne z poprzednią fixturą (głęboka równość JSON w Pythonie: `cases` 121/121, `records`, `owner` → `True True True`); nowy przechowany (nie `sameAs`) jest dokładnie jeden: `unitEnB:Wojownik z żelaznym khopesh` (brązowy `KhopeshWarrior`, OWNER_B) — pozostałe 24 to `sameAs`. Wynik: `146 cases (… unit EN owner B 25 …; 92 via sameAs), 329382 values bit-exact checked, 0 mismatches`. |
| N3 (nieaktualny komentarz `unit_core/mod.rs:17` „packages 5–7 are `NotYetPorted` stubs”) | **ODRZUCAM poprawkę w tym temacie** (poza allowlistą) | Allowlista dispatchu obejmuje w `unit_core` wyłącznie `{registry,category,model}.rs`; `mod.rs` nie jest na niej, a zmiana poza allowlistą = FAIL (R-PROC-AUTOBOT §9). Rekomendacja dla orkiestratora: przy integracji albo w temacie porządkowym zmienić linie 16–17 `src/models/unit_core/mod.rs` na „every builder ([`registry::Base`]) with its owning package; all packages are ported”. Komentarz dokumentacyjny, bez wpływu na kod i bramki. |
| N4 (surowe logi tylko linkowane) | **PRZYJMUJĘ** | Pełne surowe logi bramek i mutacji z obrony r1 (z `echo "EXIT=$?"`) wklejone w Załączniku A poniżej; pliki w `logi/` są tymi samymi logami (końcowe spacje usunięte jak w r1 — wyłącznie białe znaki). |
| N5 (konflikt z P4.27 w `models.rs`, `unit_core/{model,registry}.rs`) | **PRZYJMUJĘ jako informację dla integracji** (brak zmiany kodu) | Zakres dotknięty w `unit_core`: `model.rs` — wariant `Prim::Zelazo` + gałąź `build()`; `registry.rs` — `is_ported`/`build_base`/dok.; `category.rs` — stub `falanga`. Rozwiązanie konfliktu należy do orkiestratora (dispatch). |

Bramki po obronie (pełne logi: Załącznik A): fmt `EXIT=0`; clippy `EXIT=0`; clippy `--features gpu` `EXIT=0`; `cargo test --locked --all-targets` `EXIT=0` (25 celów, 154 passed, 0 failed); `mutate.py` `detected 31/31, build errors 0`, `EXIT=0`. Kod `src/**` bez zmian w obronie — zmienione: `tests/units_zelazo_web_parity.rs`, `tests/fixtures/units_zelazo/{gen.ts, units_zelazo.json, units_zelazo.json.sha256, README.md}`, ten dokument, `logi/*` i raport obrony w katalogu runu.

## Załącznik A — surowe logi (obrona r1)

### A.fmt.txt (`logi/fmt.txt`)

```text
$ cargo fmt --all -- --check; echo "EXIT=$?"
EXIT=0
```

### A.clippy.txt (`logi/clippy.txt`)

```text
$ cargo clippy --locked --all-targets -- -D warnings; echo "EXIT=$?"
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_91ec5ced-915-3/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 7.37s
EXIT=0
```

### A.clippy-gpu.txt (`logi/clippy-gpu.txt`)

```text
$ cargo clippy --locked --all-targets --features gpu -- -D warnings; echo "EXIT=$?"
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_91ec5ced-915-3/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 8.02s
EXIT=0
```

### A.test.txt (`logi/test.txt`)

```text
$ cargo test --locked --all-targets; echo "EXIT=$?"
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_91ec5ced-915-3/rust-port/renderer)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 14.86s
     Running unittests src/lib.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/civ_renderer-3390857ab33a1fe3)

running 12 tests
test core::jsnum::tests::to_uint32_matches_ecmascript ... ok
test jsmath::words::tests::words_round_trip ... ok
test core::jsnum::tests::to_fixed3_matches_node ... ok
test jsmath::words::tests::scalbn_is_exact_power_of_two_scaling ... ok
test models::cities::model::tests::number_to_string_follows_ecma ... ok
test models::cities::renderer::tests::owner_color_and_civ_follow_js_remainder ... ok
test models::cities::renderer::tests::terrain_top_y_matches_inline_formula_bitwise ... ok
test models::misc::overlay::tests::to_fixed5_matches_node ... ok
test models::wonders::builders::tests::grey_matches_hand_computation ... ok
test models::wonders::builders::tests::registry_covers_the_19_ids_and_defaults_the_rest ... ok
test models::wonders::renderer::tests::default_owner_color_follows_js_remainder ... ok
test models::misc::overlay::tests::to_fixed_d3_equals_core_to_fixed3 ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_nturns.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/assets_nturns-8f7d0ea4505dd8a8)

running 6 tests
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
test new_game_frees_everything_and_restarts_identically ... ok
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
[LeakM2 small 40x25] turn= 50 buffer=36 texture=306 pipeline=3 bind_group=9 live_bytes=9458944 subscriptions=1 created=712 destroyed=358
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
test leak_m3_also_retains_battle_scene_resources ... ok
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed large 96x60] turn= 50 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=2337 destroyed=2134
[LeakM2 small 40x25] turn=200 buffer=36 texture=1206 pipeline=3 bind_group=9 live_bytes=24204544 subscriptions=1 created=2760 destroyed=1506
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM2 small 40x25] turn 50 violations: live texture: baseline=67 current=306 allowed=67; live bytes: baseline=5543168 current=9458944 allowed=5543168
[LeakM2 small 40x25] turn 200 violations: live texture: baseline=67 current=1206 allowed=67; live bytes: baseline=5543168 current=24204544 allowed=5543168
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM3 small 40x25] turn 50 violations: live buffer: baseline=68 current=196 allowed=68; live texture: baseline=9 current=17 allowed=9; live bind_group: baseline=11 current=19 allowed=11; live bytes: baseline=6722816 current=15373568 allowed=6722816; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 small 40x25] turn 200 violations: live buffer: baseline=68 current=676 allowed=68; live texture: baseline=9 current=47 allowed=9; live bind_group: baseline=11 current=49 allowed=11; live bytes: baseline=6722816 current=47813888 allowed=6722816; subscriptions: baseline=5 current=81 allowed=5
[LeakM1 large 96x60] turn= 10 buffer=714 texture=25 pipeline=3 bind_group=106 live_bytes=7547008 subscriptions=1 created=1126 destroyed=278
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
test simulation_is_deterministic ... ok
[Fixed large 96x60] turn=200 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=8826 destroyed=8623
[Fixed large 96x60] budget OK at turns [50, 200]
test fixed_registry_stays_within_budget_after_10_50_200_turns ... ok
[rebuild 1000 cycles] start: turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55 destroyed=0
[rebuild 1000 cycles] end:   turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55055 destroyed=55000
test rebuild_in_place_1000_cycles_returns_to_initial_state ... ok
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
[LeakM3 large 96x60] turn=200 buffer=788 texture=65 pipeline=3 bind_group=67 live_bytes=49058816 subscriptions=81 created=8826 destroyed=7903
[LeakM3 large 96x60] turn 50 violations: live buffer: baseline=180 current=308 allowed=180; live texture: baseline=27 current=35 allowed=27; live bind_group: baseline=29 current=37 allowed=29; live bytes: baseline=7967744 current=16618496 allowed=7967744; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 large 96x60] turn 200 violations: live buffer: baseline=180 current=788 allowed=180; live texture: baseline=27 current=65 allowed=27; live bind_group: baseline=29 current=67 allowed=29; live bytes: baseline=7967744 current=49058816 allowed=7967744; subscriptions: baseline=5 current=81 allowed=5
test each_leak_pattern_breaks_the_budget ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s

     Running tests/assets_registry.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/assets_registry-c3f9969dbcf4ae07)

running 14 tests
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok
test cache_lru_by_entries_and_bytes ... ok
test budget_thresholds_are_configurable ... ok
test handle_from_another_registry_is_rejected ... ok
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test live_report_lists_labels ... ok
test owned_guards_count_references ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test scope_releases_everything_it_created_on_drop ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok
test subscriptions_unregister_on_drop ... ok
test reference_counting_frees_on_last_release ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/camera_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/camera_web_parity-ed19813f9fcbbf13)

running 5 tests
test drag_and_wheel_do_not_depend_on_dt ... ok
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok
test fixture_covers_every_branch ... ok
test camera_controller_matches_web_100_percent ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/cities_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/cities_web_parity-b32fe1be50768412)

running 5 tests
test layout_constants_and_types_match_web ... ok
test legacy_city_model_matches_web ... ok
test city_map_outlines_match_web ... ok
test city_renderer_matches_web ... ok
test city_models_match_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.66s

     Running tests/core_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/core_web_parity-27c98cd457a8290f)

running 8 tests
test hex_shape_matches_web ... ok
test fog_dim_matches_web ... ok
test bronze_city_types_match_web ... ok
test vitals_match_web ... ok
test zoom_lod_matches_web ... ok
test map_style_matches_web ... ok
test merge_decor_matches_web ... ok
test hexutil_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/cpu_sanity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/cpu_sanity-0295d7bf5a63866f)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/decor_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/decor_web_parity-faad5ae118a41e5c)

running 8 tests
test decor_reuses_core_instead_of_copies ... ok
test decor_uses_jsmath_not_platform_libm ... ok
test hex_hash_functions_match_web ... ok
test coast_builders_are_bit_identical_to_web ... ok
test river_lod_matches_web ... ok
test shared_geometries_are_bit_identical_to_web ... ok
test relief_surface_height_matches_web ... ok
test builders_are_bit_identical_to_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.54s

     Running tests/geom_three_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/geom_three_parity-0f596b3cbdb71744)

running 17 tests
test index_buffer_covers_non_indexed_meshes ... ok
test merge_rejects_mixed_indexing ... ok
test parity_circle ... ok
test parity_curve ... ok
test parity_cone ... ok
test parity_cylinder ... ok
test parity_box ... ok
test parity_plane ... ok
test parity_extrude ... ok
test parity_ops ... ok
test parity_ring ... ok
test parity_shape ... ok
test parity_torus ... ok
test trs_matches_manual_composition ... ok
test parity_polyhedron ... ok
test parity_tube ... ok
test parity_sphere ... ok

test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/gpu_probe.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/gpu_probe-b90f27ad8c898393)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/improvements_web_parity-7642b2e4c63525aa)

running 3 tests
test prototype_keys_documented_deviation ... ok
test data_tables_match_web ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.81s

     Running tests/jsmath_v8_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/jsmath_v8_parity-fee50190cb35806f)

running 14 tests
test acos_matches_v8 ... ok
test asin_matches_v8 ... ok
test atan_matches_v8 ... ok
test compatibility_paths_are_the_same_functions ... ok
test atan2_matches_v8 ... ok
test exp_matches_v8 ... ok
test hypot_three_arguments_matches_v8 ... ok
test cos_matches_v8 ... ok
test hypot_matches_v8 ... ok
test log_matches_v8 ... ok
test whole_domain_without_platform_fallback ... ok
test pow_matches_v8 ... ok
test sin_matches_v8 ... ok
test tan_matches_v8 ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/jsmath_wiring.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/jsmath_wiring-b0f96cca402d817c)

running 6 tests
test pick_hex_prism_vertices_use_v8_trig ... ok
test scanner_catches_known_bypass_forms ... ok
test geom_rotation_and_euler_use_v8_trig ... ok
test terrain_rotation_uses_v8_trig ... ok
test pick_quat_from_euler_xyz_uses_v8_trig ... ok
test no_platform_transcendentals_anywhere_in_src ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.30s

     Running tests/jsnum_to_fixed_v8.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/jsnum_to_fixed_v8-f655627a428aa1de)

running 3 tests
test to_fixed_entry_points_are_one_function ... ok
test to_fixed_matches_v8 ... ok
test to_fixed_rejects_digits_above_100 - should panic ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s

     Running tests/misc_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/misc_web_parity-f6fc6b6b2b7c3c19)

running 11 tests
test quadratic_bezier_matches_three ... ok
test models_match_web ... ok
test relief_sampler_matches_web ... ok
test siege_sync_matches_web ... ok
test siege_marker_matches_web ... ok
test territory_border_matches_web ... ok
test territory_loops_match_web ... ok
test to_fixed_on_hex_corners_is_sign_stable ... ok
test trade_routes_match_web ... ok
test range_overlay_matches_web ... ok
test range_overlay_real_relief_matches_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.95s

     Running tests/pick_golden.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/pick_golden-5edd88b94adda948)

running 7 tests
test client_rect_to_ndc_matches_web ... ok
test js_round_matches_math_round ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test world_to_axial_both_variants_match_web ... ok
test terrain_scene_instances_are_bitwise_web ... ok
test camera_matrices_and_rays_are_bitwise_three ... ok
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.68s

     Running tests/terrain_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/terrain_web_parity-7ed099e492a012e9)

running 5 tests
test js_pow_special_cases_follow_v8 ... ok
test fog_hides_unknown_and_dims_explored ... ok
test color_math_matches_three ... ok
test terrain_build_matches_web ... ok
test terrain_fog_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.20s

     Running tests/unit_core_json.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/unit_core_json-b55ab56d4e2236c3)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_core_model_rule.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/unit_core_model_rule-2f5305891471a8dc)

running 7 tests
test pending_registry_is_explicit ... ok
test rule_table_covers_exactly_the_77_unit_types ... ok
test unknown_type_falls_back_to_category_with_a_warning ... ok
test table_equals_the_legacy_pl_route_and_names_never_matter ... ok
test legacy_en_path_reproduces_exactly_the_three_web_divergences ... ok
test norm_name_and_culture_match_the_web ... ok
test web_signature_classes_equal_rust_model_id_classes ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.40s

     Running tests/unit_core_trig.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/unit_core_trig-30b01be29ad89d90)

running 2 tests
test quat_from_euler_honours_every_order ... ok
test js_trig_matches_v8_bit_for_bit_and_libm_does_not ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/unit_core_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/unit_core_web_parity-eb9ca6d0cfd9b82c)

running 3 tests
test signature_is_sensitive_to_owner_colour_and_pose ... ok
test part_catalogues_match_the_web_singletons ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.33s

     Running tests/units_braz_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/units_braz_web_parity-658717995623588c)

running 4 tests
test routing_no_longer_returns_not_yet_ported_for_the_bronze_package ... ok
test the_records_cover_every_mod06_builder_and_counts_match_the_web ... ok
test unit_core_record_signatures_of_the_bronze_records_match ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.88s

     Running tests/units_kamien_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/units_kamien_web_parity-94e8e4a61ab4daac)

running 5 tests
test asin_matches_v8 ... ok
test the_ten_records_cover_every_mod05_builder_and_counts_match_the_web ... ok
test routing_no_longer_returns_not_yet_ported_for_the_stone_package ... ok
test unit_core_record_signatures_of_the_stone_records_match ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.39s

     Running tests/units_zelazo_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/units_zelazo_web_parity-dfa457e997b98fee)

running 4 tests
test no_unit_builder_is_a_stub_any_more ... ok
test the_records_cover_every_mod07_builder_and_counts_match_the_web ... ok
test unit_core_record_signatures_of_the_iron_records_match ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.58s

     Running tests/wonders_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/wonders_web_parity-d8d9a630ca3a6684)

running 4 tests
test renderer_scenario_is_bit_identical_to_web ... ok
test js_trig_is_bit_identical_to_v8 ... ok
test registry_matches_web_ids ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.18s

EXIT=0
```

### A.test-nocapture.txt (`logi/test-nocapture.txt`)

```text
$ cargo test --locked --all-targets -- --nocapture; echo "EXIT=$?"
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.04s
     Running unittests src/lib.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/civ_renderer-3390857ab33a1fe3)

running 12 tests
test jsmath::words::tests::words_round_trip ... ok
test jsmath::words::tests::scalbn_is_exact_power_of_two_scaling ... ok
test core::jsnum::tests::to_uint32_matches_ecmascript ... ok
test core::jsnum::tests::to_fixed3_matches_node ... ok
test models::cities::model::tests::number_to_string_follows_ecma ... ok
test models::cities::renderer::tests::owner_color_and_civ_follow_js_remainder ... ok
test models::cities::renderer::tests::terrain_top_y_matches_inline_formula_bitwise ... ok
test models::wonders::builders::tests::grey_matches_hand_computation ... ok
test models::misc::overlay::tests::to_fixed5_matches_node ... ok
test models::wonders::builders::tests::registry_covers_the_19_ids_and_defaults_the_rest ... ok
test models::wonders::renderer::tests::default_owner_color_follows_js_remainder ... ok
test models::misc::overlay::tests::to_fixed_d3_equals_core_to_fixed3 ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_nturns.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/assets_nturns-8f7d0ea4505dd8a8)

running 6 tests
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
test new_game_frees_everything_and_restarts_identically ... ok
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
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
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
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
[rebuild 1000 cycles] start: turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55 destroyed=0
[rebuild 1000 cycles] end:   turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55055 destroyed=55000
test rebuild_in_place_1000_cycles_returns_to_initial_state ... ok
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

     Running tests/assets_registry.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/assets_registry-c3f9969dbcf4ae07)

running 14 tests
test budget_thresholds_are_configurable ... ok
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test live_report_lists_labels ... ok
test handle_from_another_registry_is_rejected ... ok
test cache_lru_by_entries_and_bytes ... ok
test owned_guards_count_references ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test reference_counting_frees_on_last_release ... ok
test scope_releases_everything_it_created_on_drop ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok
test subscriptions_unregister_on_drop ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/camera_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/camera_web_parity-ed19813f9fcbbf13)

running 5 tests
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test drag_and_wheel_do_not_depend_on_dt ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok
test fixture_covers_every_branch ... ok
camera parity: scenarios=34 steps=6524 scalars=47892 mismatches=0
test camera_controller_matches_web_100_percent ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/cities_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/cities_web_parity-b32fe1be50768412)

running 5 tests
layout: compared 57 values, 0 mismatches
city outlines: compared 616 values, 0 mismatches
test city_map_outlines_match_web ... ok
legacy: compared 992 values, 0 mismatches
test legacy_city_model_matches_web ... ok
test layout_constants_and_types_match_web ... ok
city renderer: compared 27035 values, 0 mismatches
test city_renderer_matches_web ... ok
families: {"braz": 220, "braz_grecja": 3, "braz_grecja_default": 1, "braz_rzym": 3, "braz_rzym_default": 1, "ghost_braz": 287, "ghost_braz_default_walls": 1, "ghost_kamien": 286, "ghost_kamien_default_walls": 1, "ghost_kamien_uni": 24, "ghost_kamien_uni_default_walls": 1, "kamien": 72, "kamien_default": 1, "palisada": 3, "settlement": 144}
city models: compared 192347 values, 0 mismatches
test city_models_match_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.62s

     Running tests/core_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/core_web_parity-27c98cd457a8290f)

running 8 tests
hexShape: 761 values compared bit for bit, 0 mismatches
test hex_shape_matches_web ... ok
fogDim: 951 values compared bit for bit, 0 mismatches
mapRenderStyle: 4895 values compared bit for bit, 0 mismatches
test fog_dim_matches_web ... ok
test map_style_matches_web ... ok
unitVitalsPalette: 12 values compared bit for bit, 0 mismatches
test vitals_match_web ... ok
zoomLod: 1258 values compared bit for bit, 0 mismatches
test zoom_lod_matches_web ... ok
bronzeCity: 4219 values compared bit for bit, 0 mismatches
test bronze_city_types_match_web ... ok
mergeDecor: 6616 values compared bit for bit, 0 mismatches
test merge_decor_matches_web ... ok
hexutil: 8660 values compared bit for bit, 0 mismatches
test hexutil_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/cpu_sanity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/cpu_sanity-0295d7bf5a63866f)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/decor_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/decor_web_parity-faad5ae118a41e5c)

running 8 tests
test decor_reuses_core_instead_of_copies ... ok
hashes: 98010 samples, 54 seeds
hashes: scalars=98543 bit_diff=0
test hex_hash_functions_match_web ... ok
test decor_uses_jsmath_not_platform_libm ... ok
riverlod: scalars=830 bit_diff=0
test river_lod_matches_web ... ok
coast: 301 builds, 333 meshes
coast: scalars=27027 bit_diff=0
test coast_builders_are_bit_identical_to_web ... ok
geometries: 34 variants, 3344 triangles
geometries: scalars=90917 bit_diff=0
test shared_geometries_are_bit_identical_to_web ... ok
relief: 9197 positive heights
relief: scalars=29468 bit_diff=0
test relief_surface_height_matches_web ... ok
builders: [("buildDekorLaka", 9), ("buildDekorPustynia", 9), ("buildDekorRownina", 9), ("buildGalleryBuildingPad", 16), ("buildGalleryFortMount", 3), ("buildGora", 9), ("buildLas", 9), ("buildOaza", 1), ("buildStyleBeachRing", 2), ("buildStyleCoastSandTopCap", 2), ("buildStyleDune", 460), ("buildStyleForestCluster", 270), ("buildStyleHillBump", 310), ("buildStyleMountainPeak", 310), ("buildStyleOasis", 5), ("buildStyleTarasyTerrace", 4), ("buildTarasy", 2), ("buildWzgorze", 9)] meshes=6233
builders: scalars=324838 bit_diff=0
test builders_are_bit_identical_to_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.44s

     Running tests/geom_three_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/geom_three_parity-0f596b3cbdb71744)

running 17 tests
test index_buffer_covers_non_indexed_meshes ... ok
test merge_rejects_mixed_indexing ... ok
circle.json:default: verts=34 tris=32 max|d| pos=0e0 nor=0e0 uv=0e0
circle.json:hex: verts=8 tris=6 max|d| pos=0e0 nor=0e0 uv=0e0
circle.json:below_min_clamped: verts=5 tris=3 max|d| pos=0e0 nor=0e0 uv=0e0
circle.json:partial: verts=10 tris=8 max|d| pos=0e0 nor=0e0 uv=0e0
circle.json:zero_radius: verts=8 tris=6 max|d| pos=0e0 nor=0e0 uv=0e0
test parity_circle ... ok
cone.json:default: verts=131 tris=64 max|d| pos=0e0 nor=0e0 uv=0e0
cone.json:typical: verts=27 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
curve.json:estuary_catmullrom_05: samples=81 max|d| point=0e0 tangent=0e0
cone.json:min_segments: verts=15 tris=6 max|d| pos=0e0 nor=0e0 uv=0e0
curve.json:two_points_catmullrom_05: samples=33 max|d| point=0e0 tangent=0e0
cone.json:open_hseg: verts=36 tris=24 max|d| pos=0e0 nor=0e0 uv=0e0
cone.json:pyramid: verts=19 tris=8 max|d| pos=0e0 nor=0e0 uv=0e0
test parity_cone ... ok
curve.json:estuary_centripetal: samples=33 max|d| point=0e0 tangent=0e0
curve.json:closed_catmullrom_05: samples=25 max|d| point=0e0 tangent=0e0
test parity_curve ... ok
box.json:unit: verts=24 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
box.json:typical_small: verts=24 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
box.json:segmented: verts=94 tris=104 max|d| pos=0e0 nor=0e0 uv=0e0
box.json:zero_height: verts=24 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
box.json:negative_depth: verts=24 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:box_rotateX_translate: verts=24 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:cylinder_rotYZ_scale: verts=40 tris=24 max|d| pos=0e0 nor=0e0 uv=0e0
extrude.json:hex_wall_ring: verts=144 tris=48 max|d| pos=0e0 nor=0e0 uv=0e0
extrude.json:veteran_star: verts=108 tris=36 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:extrude_hex_rotateX: verts=144 tris=48 max|d| pos=0e0 nor=0e0 uv=0e0
extrude.json:square_steps3: verts=84 tris=28 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:default: verts=196 tris=128 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:typical: verts=52 tris=32 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:sphere_trs_xyz: verts=63 tris=80 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:min_segments: verts=22 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:box_trs_yxz_negscale: verts=24 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
extrude.json:square_default_bevel: verts=180 tris=60 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:cone_trs_zyx: verts=23 tris=10 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:frustum_hseg: verts=54 tris=48 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:open_ended: verts=21 tris=24 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:partial_theta: verts=34 tris=20 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:sphere_recompute_normals: verts=63 tris=80 max|d| pos=0e0 nor=0e0 uv=0e0
box.json:large_segments: verts=726 tris=1200 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:zero_top: verts=27 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:zero_bottom: verts=27 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:cylinder_recompute_normals: verts=47 tris=36 max|d| pos=0e0 nor=0e0 uv=0e0
cylinder.json:hexagonal_prism: verts=40 tris=24 max|d| pos=0e0 nor=0e0 uv=0e0
extrude.json:hex_ring_bevel_custom: verts=504 tris=168 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:merge_indexed_groups: verts=99 tris=72 max|d| pos=0e0 nor=0e0 uv=0e0
extrude.json:two_shapes: verts=60 tris=20 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:merge_indexed_nogroups: verts=33 tris=20 max|d| pos=0e0 nor=0e0 uv=0e0
test parity_box ... ok
test parity_extrude ... ok
plane.json:unit: verts=4 tris=2 max|d| pos=0e0 nor=0e0 uv=0e0
ops.json:merge_nonindexed_groups: verts=204 tris=68 max|d| pos=0e0 nor=0e0 uv=0e0
plane.json:segmented: verts=20 tris=24 max|d| pos=0e0 nor=0e0 uv=0e0
plane.json:zero_size: verts=4 tris=2 max|d| pos=0e0 nor=0e0 uv=0e0
test parity_ops ... ok
test parity_plane ... ok
cylinder.json:large: verts=583 tris=640 max|d| pos=0e0 nor=0e0 uv=0e0
shape.json:triangle_default: verts=3 tris=1 max|d| pos=0e0 nor=0e0 uv=0e0
shape.json:selection_hex_ring: verts=12 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
shape.json:owner_hex_ring: verts=12 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
ring.json:default: verts=66 tris=64 max|d| pos=0e0 nor=0e0 uv=0e0
test parity_cylinder ... ok
shape.json:ccw_hole_not_reversed: verts=12 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
shape.json:star: verts=10 tris=8 max|d| pos=0e0 nor=0e0 uv=0e0
ring.json:typical: verts=50 tris=48 max|d| pos=0e0 nor=0e0 uv=0e0
shape.json:concave_two_holes: verts=12 tris=14 max|d| pos=0e0 nor=0e0 uv=0e0
ring.json:below_min_clamped: verts=8 tris=6 max|d| pos=0e0 nor=0e0 uv=0e0
shape.json:open_outline_not_closed: verts=4 tris=2 max|d| pos=0e0 nor=0e0 uv=0e0
ring.json:phi_segments: verts=28 tris=36 max|d| pos=0e0 nor=0e0 uv=0e0
ring.json:partial: verts=27 tris=32 max|d| pos=0e0 nor=0e0 uv=0e0
shape.json:many_points_hashed: verts=102 tris=102 max|d| pos=0e0 nor=0e0 uv=0e0
test parity_ring ... ok
shape.json:multi_two_shapes: verts=15 tris=13 max|d| pos=0e0 nor=0e0 uv=0e0
test parity_shape ... ok
polyhedron.json:icosahedron_d0: verts=60 tris=20 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:icosahedron_d1: verts=240 tris=80 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:icosahedron_d2: verts=540 tris=180 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:dodecahedron_d0: verts=108 tris=36 max|d| pos=0e0 nor=0e0 uv=0e0
tube.json:trade_route: verts=585 tris=1024 max|d| pos=0e0 nor=0e0 uv=0e0
tube.json:two_points: verts=20 tris=24 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:dodecahedron_d1: verts=432 tris=144 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:octahedron_d0: verts=24 tris=8 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:octahedron_d1: verts=96 tris=32 max|d| pos=0e0 nor=0e0 uv=0e0
tube.json:chordal: verts=78 tris=120 max|d| pos=0e0 nor=0e0 uv=0e0
tube.json:catmullrom_tension: verts=78 tris=120 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:octahedron_d3: verts=384 tris=128 max|d| pos=0e0 nor=0e0 uv=0e0
torus.json:default: verts=637 tris=1152 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:tetrahedron_d0: verts=12 tris=4 max|d| pos=0e0 nor=0e0 uv=0e0
tube.json:closed_loop: verts=119 tris=192 max|d| pos=0e0 nor=0e0 uv=0e0
polyhedron.json:tetrahedron_d2: verts=108 tris=36 max|d| pos=0e0 nor=0e0 uv=0e0
tube.json:straight_axis: verts=20 tris=24 max|d| pos=0e0 nor=0e0 uv=0e0
torus.json:typical: verts=119 tris=192 max|d| pos=0e0 nor=0e0 uv=0e0
torus.json:min: verts=12 tris=12 max|d| pos=0e0 nor=0e0 uv=0e0
test parity_tube ... ok
test parity_polyhedron ... ok
torus.json:half_arc: verts=117 tris=192 max|d| pos=0e0 nor=0e0 uv=0e0
test trs_matches_manual_composition ... ok
torus.json:zero_tube: verts=35 tris=48 max|d| pos=0e0 nor=0e0 uv=0e0
test parity_torus ... ok
sphere.json:default: verts=561 tris=960 max|d| pos=0e0 nor=0e0 uv=0e0
sphere.json:typical: verts=63 tris=80 max|d| pos=0e0 nor=0e0 uv=0e0
sphere.json:min_segments: verts=12 tris=6 max|d| pos=0e0 nor=0e0 uv=0e0
sphere.json:below_min_clamped: verts=12 tris=6 max|d| pos=0e0 nor=0e0 uv=0e0
sphere.json:hemisphere: verts=91 tris=132 max|d| pos=0e0 nor=0e0 uv=0e0
sphere.json:lower_cap: verts=91 tris=132 max|d| pos=0e0 nor=0e0 uv=0e0
sphere.json:partial_phi: verts=66 tris=100 max|d| pos=0e0 nor=0e0 uv=0e0
sphere.json:zero_radius: verts=35 tris=36 max|d| pos=0e0 nor=0e0 uv=0e0
sphere.json:large: verts=1225 tris=2208 max|d| pos=0e0 nor=0e0 uv=0e0
test parity_sphere ... ok

test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/gpu_probe.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/gpu_probe-b90f27ad8c898393)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/improvements_web_parity-7642b2e4c63525aa)

running 3 tests
data: scalars=35 bit_diff=0 within_1e-12=0 struct_diff=0
proto keys: threw=10 empty=2: scalars=52 bit_diff=0 within_1e-12=0 struct_diff=0
test prototype_keys_documented_deviation ... ok
test data_tables_match_web ... ok
models: cases=457: scalars=192046 bit_diff=0 within_1e-12=0 struct_diff=0
test models_are_bit_identical_to_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.63s

     Running tests/jsmath_v8_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/jsmath_v8_parity-fee50190cb35806f)

running 14 tests
asin: cases=20021 port_mismatches=0 libm_mismatches=963
atan: cases=20021 port_mismatches=0 libm_mismatches=393
test asin_matches_v8 ... ok
test atan_matches_v8 ... ok
test compatibility_paths_are_the_same_functions ... ok
acos: cases=20021 port_mismatches=0 libm_mismatches=1016
test acos_matches_v8 ... ok
atan2: cases=20441 port_mismatches=0 libm_mismatches=2704
test atan2_matches_v8 ... ok
hypot3: cases=3004 port_mismatches=0 libm_mismatches=728
test hypot_three_arguments_matches_v8 ... ok
exp: cases=20021 port_mismatches=0 libm_mismatches=1559
test exp_matches_v8 ... ok
cos: cases=20021 port_mismatches=0 libm_mismatches=698
test cos_matches_v8 ... ok
log: cases=20021 port_mismatches=0 libm_mismatches=99
test log_matches_v8 ... ok
hypot: cases=20441 port_mismatches=0 libm_mismatches=3340
test hypot_matches_v8 ... ok
test whole_domain_without_platform_fallback ... ok
pow: cases=21024 port_mismatches=0 libm_mismatches=1342
test pow_matches_v8 ... ok
sin: cases=20021 port_mismatches=0 libm_mismatches=687
tan: cases=20021 port_mismatches=0 libm_mismatches=559
test tan_matches_v8 ... ok
test sin_matches_v8 ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/jsmath_wiring.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/jsmath_wiring-b0f96cca402d817c)

running 6 tests
test pick_hex_prism_vertices_use_v8_trig ... ok
test scanner_catches_known_bypass_forms ... ok
instance_matrix: 2 angles where platform libm and V8 differ after f32 storage
test terrain_rotation_uses_v8_trig ... ok
test pick_quat_from_euler_xyz_uses_v8_trig ... ok
test geom_rotation_and_euler_use_v8_trig ... ok
test no_platform_transcendentals_anywhere_in_src ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.26s

     Running tests/jsnum_to_fixed_v8.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/jsnum_to_fixed_v8-f655627a428aa1de)

running 3 tests

thread 'to_fixed_rejects_digits_above_100' (1475) panicked at src/core/jsnum.rs:73:5:
toFixed() digits argument must be between 0 and 100
stack backtrace:
   0: __rustc::rust_begin_unwind
             at /rustc/2d8144b7880597b6e6d3dfd63a9a9efae3f533d3/library/std/src/panicking.rs:689:5
   1: core::panicking::panic_fmt
             at /rustc/2d8144b7880597b6e6d3dfd63a9a9efae3f533d3/library/core/src/panicking.rs:80:14
   2: civ_renderer::core::jsnum::js_to_fixed
             at ./src/core/jsnum.rs:73:5
   3: jsnum_to_fixed_v8::to_fixed_rejects_digits_above_100
             at ./tests/jsnum_to_fixed_v8.rs:116:13
   4: jsnum_to_fixed_v8::to_fixed_rejects_digits_above_100::{closure#0}
             at ./tests/jsnum_to_fixed_v8.rs:115:39
   5: <jsnum_to_fixed_v8::to_fixed_rejects_digits_above_100::{closure#0} as core::ops::function::FnOnce<()>>::call_once
             at /rustc/2d8144b7880597b6e6d3dfd63a9a9efae3f533d3/library/core/src/ops/function.rs:250:5
   6: <fn() -> core::result::Result<(), alloc::string::String> as core::ops::function::FnOnce<()>>::call_once
             at /rustc/2d8144b7880597b6e6d3dfd63a9a9efae3f533d3/library/core/src/ops/function.rs:250:5
test to_fixed_entry_points_are_one_function ... ok
toFixed vs V8: 27808 cases identical (negative 12503, |x|>=1e21 2536, NaN/Inf 303, exact ties 4810, digits>20 7804)
test to_fixed_matches_v8 ... ok
note: Some details are omitted, run with `RUST_BACKTRACE=full` for a verbose backtrace.
test to_fixed_rejects_digits_above_100 - should panic ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s

     Running tests/misc_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/misc_web_parity-f6fc6b6b2b7c3c19)

running 11 tests
quadratic bezier: scalars 2088 (bit-equal), checks 0
test quadratic_bezier_matches_three ... ok
models: scalars 50440 (bit-equal), checks 27510
test models_match_web ... ok
siege marker: scalars 9424 (bit-equal), checks 5010
test siege_marker_matches_web ... ok
siege sync: scalars 4 (bit-equal), checks 18
test siege_sync_matches_web ... ok
territory border: scalars 288 (bit-equal), checks 470
test territory_border_matches_web ... ok
relief sampler (real): scalars 16560 (bit-equal), checks 424
test relief_sampler_matches_web ... ok
test to_fixed_on_hex_corners_is_sign_stable ... ok
territory loops: scalars 952 (bit-equal), checks 18
test territory_loops_match_web ... ok
trade routes: scalars 84 (bit-equal), checks 132
test trade_routes_match_web ... ok
range overlay: scalars 61344 (bit-equal), checks 13831
test range_overlay_matches_web ... ok
range overlay (real relief): scalars 80704 (bit-equal), checks 16506
test range_overlay_real_relief_matches_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.64s

     Running tests/pick_golden.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/pick_golden-5edd88b94adda948)

running 7 tests
test js_round_matches_math_round ... ok
test client_rect_to_ndc_matches_web ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
worldToAxial vectors: 1233 (variants differ on 100)
test world_to_axial_both_variants_match_web ... ok
instance matrices compared bitwise: 380
test terrain_scene_instances_are_bitwise_web ... ok
camera rays compared bitwise: 275
test camera_matrices_and_rays_are_bitwise_three ... ok
golden points: 20174, units-first wins: 339
by rule: {"PlaneCoarse": 2809, "PlaneRefined": 3805, "SideFallback": 985, "SideMatch": 557, "TopFace": 12018}
by point kind: {"center": 247, "corner": 1498, "edge": 1494, "edge-in": 1494, "edge-out": 1494, "fog": 1780, "grid": 5720, "int": 660, "overlap": 1494, "side": 1500, "side-low": 1518, "solid": 514, "solid-peak": 41, "unit": 720}
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.49s

     Running tests/terrain_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/terrain_web_parity-7ed099e492a012e9)

running 5 tests
test js_pow_special_cases_follow_v8 ... ok
test fog_hides_unknown_and_dims_explored ... ok
map A fog (8 calls): scalars=9576 exact=9576 within1e-6=0 bad=0
map A build (instances 159): scalars=7888 exact=7888 within1e-6=0 bad=0
map A-lite build (instances 126): scalars=6871 exact=6871 within1e-6=0 bad=0
map B fog (4 calls): scalars=8056 exact=8056 within1e-6=0 bad=0
color: getHex cases=2048 mismatches=0; Math.pow cases=6144 mismatches=0; Math.hypot cases=2048 mismatches=0; preset cases=24 mismatches=0: scalars=15360 exact=15360 within1e-6=0 bad=0
map B build (instances 186): scalars=7955 exact=7955 within1e-6=0 bad=0
test color_math_matches_three ... ok
map C build (instances 1802): scalars=42162 exact=42162 within1e-6=0 bad=0
map C fog (2 calls): scalars=45600 exact=45600 within1e-6=0 bad=0
map D build (instances 3783): scalars=82699 exact=82699 within1e-6=0 bad=0
map E build (instances 4817): scalars=105234 exact=105234 within1e-6=0 bad=0
map F build (instances 732): scalars=18938 exact=18938 within1e-6=0 bad=0
TOTAL build: maps=7 instances=11605 scalars=271747 exact=271747 within1e-6=0 bad=0
test terrain_build_matches_web ... ok
map F fog (2 calls): scalars=17100 exact=17100 within1e-6=0 bad=0
TOTAL fog: calls=16 scalars=80332 exact=80332 within1e-6=0 bad=0
test terrain_fog_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.21s

     Running tests/unit_core_json.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/unit_core_json-b55ab56d4e2236c3)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_core_model_rule.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/unit_core_model_rule-2f5305891471a8dc)

running 7 tests
pending builders: 0
test pending_registry_is_explicit ... ok
test table_equals_the_legacy_pl_route_and_names_never_matter ... ok
test unknown_type_falls_back_to_category_with_a_warning ... ok
test legacy_en_path_reproduces_exactly_the_three_web_divergences ... ok
test rule_table_covers_exactly_the_77_unit_types ... ok
names: 403 web values checked
test norm_name_and_culture_match_the_web ... ok
model rule: 175 calls (152 records PL+EN), 175 ported signatures compared
test web_signature_classes_equal_rust_model_id_classes ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.46s

     Running tests/unit_core_trig.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/unit_core_trig-30b01be29ad89d90)

running 2 tests
quat_from_euler orders: 5 angle triples x 6 orders checked
test quat_from_euler_honours_every_order ... ok
trig: n=11226 port_mismatch=0 libm_mismatch=792
test js_trig_matches_v8_bit_for_bit_and_libm_does_not ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/unit_core_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/unit_core_web_parity-eb9ca6d0cfd9b82c)

running 3 tests
test signature_is_sensitive_to_owner_colour_and_pose ... ok
test part_catalogues_match_the_web_singletons ... ok
unit_core parity: 68 cases, 68 compared (134622 values bit-exact checked), 0 pending stubs: []
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.31s

     Running tests/units_braz_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/units_braz_web_parity-658717995623588c)

running 4 tests
buildProcarzBrazOpus5: meshes 100 tris 1120 (web 100 / 1120)
buildWlocznikBrazOpus5: meshes 77 tris 1228 (web 77 / 1228)
buildMiecznikBrazOpus5: meshes 81 tris 1204 (web 81 / 1204)
buildRydwanWolyBrazOpus5: meshes 108 tris 1496 (web 108 / 1496)
buildKonnicaBrazOpus5: meshes 104 tris 1572 (web 104 / 1572)
buildRydwanKonnyBrazOpus5: meshes 145 tris 1936 (web 145 / 1936)
buildRydwanKapadokijskiOpus5: meshes 149 tris 2096 (web 149 / 2096)
buildNubianArcherOpus5: meshes 84 tris 1052 (web 84 / 1052)
buildTaranOkutyOpus5: meshes 102 tris 1600 (web 102 / 1600)
test routing_no_longer_returns_not_yet_ported_for_the_bronze_package ... ok
buildAxeWarriorInka: meshes 35 tris 420 (web 35 / 420)
buildInkaSlinger: meshes 33 tris 396 (web 33 / 396)
buildAkkadianArcher: meshes 36 tris 448 (web 36 / 448)
buildAssyrianArcher: meshes 37 tris 460 (web 37 / 460)
buildSherden: meshes 34 tris 460 (web 34 / 460)
buildTyrrhenian: meshes 33 tris 452 (web 33 / 452)
buildShekelesh: meshes 33 tris 452 (web 33 / 452)
buildMycenaeanWarrior: meshes 29 tris 416 (web 29 / 416)
buildShangHalberdier: meshes 33 tris 412 (web 33 / 412)
buildKhopeshWarrior: meshes 28 tris 396 (web 28 / 396)
buildImpi: meshes 36 tris 458 (web 36 / 458)
buildSumerianSpearman: meshes 36 tris 448 (web 36 / 448)
buildSiegeTower: meshes 46 tris 656 (web 46 / 656)
test unit_core_record_signatures_of_the_bronze_records_match ... ok
buildPiechotaHetycka: meshes 31 tris 420 (web 31 / 420)
buildGwardiaIshtar: meshes 35 tris 460 (web 35 / 460)
buildWojownikBabilonski: meshes 31 tris 416 (web 31 / 416)
buildWojownikFenicki: meshes 32 tris 458 (web 32 / 458)
buildStraznikHarappy: meshes 34 tris 424 (web 34 / 424)
buildPiechotaInduska: meshes 29 tris 384 (web 29 / 384)
buildLegionRzymski: meshes 31 tris 414 (web 31 / 414)
buildGwardzistaChampi: meshes 38 tris 456 (web 38 / 456)
buildChineseCavalry (Jeździec chiński): meshes 53 tris 764 (web 53 / 764)
buildHuBenWei (Hu Ben Wei (Gwardia Tygrysa)): meshes 43 tris 544 (web 43 / 544)
buildUThulwana (uThulwana (Białe Tarcze)): meshes 38 tris 568 (web 38 / 568)
buildInkaRoyalGuard (Królewska Gwardia): meshes 62 tris 788 (web 62 / 788)
buildEgyptianChariot (Rydwan egipski): meshes 101 tris 1376 (web 101 / 1376)
buildMedjay (Medżaj (Gwardia Faraona)): meshes 40 tris 580 (web 40 / 580)
buildSumerianChariot (Rydwan sumeryjski): meshes 88 tris 1304 (web 88 / 1304)
buildSumerianRoyalGuard (Gwardia Królewska Sumeru): meshes 42 tris 524 (web 42 / 524)
test the_records_cover_every_mod06_builder_and_counts_match_the_web ... ok
units_braz parity: 180 cases (fn 60 / unit PL 40 / unit PL owner B 40 / unit EN 40; 96 via sameAs), 478906 values bit-exact checked, 0 mismatches
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.92s

     Running tests/units_kamien_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/units_kamien_web_parity-94e8e4a61ab4daac)

running 5 tests
asin: n=5027 mismatches=0
buildWojownikOpus5: meshes 87 tris 1198 vertices 2329 (web 87 / 1198)
buildOszczepnikOpus5: meshes 71 tris 1016 vertices 2073 (web 71 / 1016)
buildLucznikOpus5: meshes 84 tris 1138 vertices 2242 (web 84 / 1138)
buildZwiadowcaOpus5: meshes 81 tris 1092 vertices 2157 (web 81 / 1092)
buildMaceWarriorOpus5: meshes 100 tris 1308 vertices 2550 (web 100 / 1308)
buildInkaJavelineerOpus5: meshes 85 tris 1112 vertices 2164 (web 85 / 1112)
buildZuluJavelineerOpus5: meshes 86 tris 1342 vertices 2532 (web 86 / 1342)
test asin_matches_v8 ... ok
buildBatteringRamOpus5: meshes 85 tris 1244 vertices 2084 (web 85 / 1244)
buildEgyptianArcherOpus5: meshes 86 tris 1032 vertices 2064 (web 86 / 1032)
buildSumerianArcherOpus5: meshes 95 tris 1136 vertices 2275 (web 95 / 1136)
test the_ten_records_cover_every_mod05_builder_and_counts_match_the_web ... ok
test routing_no_longer_returns_not_yet_ported_for_the_stone_package ... ok
test unit_core_record_signatures_of_the_stone_records_match ... ok
units_kamien parity: 40 cases (fn 20 / unit PL 10 / unit EN 10), 156496 values bit-exact checked, 0 mismatches
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.32s

     Running tests/units_zelazo_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/units_zelazo_web_parity-dfa457e997b98fee)

running 4 tests
buildHastatiOpus5: meshes 92 tris 1378 (web 92 / 1378)
buildHastati: meshes 35 tris 462 (web 35 / 462)
buildFalangita: meshes 27 tris 404 (web 27 / 404)
buildSuperGreece: meshes 40 tris 552 (web 40 / 552)
buildSuperRome: meshes 39 tris 514 (web 39 / 514)
buildGwardiaHetycka: meshes 34 tris 456 (web 34 / 456)
buildPiechotaNeobabilonska: meshes 37 tris 460 (web 37 / 460)
buildMurTarcz: meshes 35 tris 436 (web 35 / 436)
buildGarnizonHarappy: meshes 37 tris 464 (web 37 / 464)
buildTyrskiMiecznik: meshes 30 tris 416 (web 30 / 416)
buildGwardiaTyrenska: meshes 33 tris 452 (web 33 / 452)
buildZelaznyKhopesh: meshes 31 tris 396 (web 31 / 396)
buildThorakites: meshes 32 tris 430 (web 32 / 430)
buildTriari: meshes 37 tris 486 (web 37 / 486)
buildDruzynnik: meshes 32 tris 424 (web 32 / 424)
buildIButho: meshes 39 tris 482 (web 39 / 482)
buildBerserker: meshes 30 tris 360 (web 30 / 360)
buildGermanSuper: meshes 37 tris 492 (web 37 / 492)
buildMiecznikGalijski: meshes 44 tris 570 (web 44 / 570)
buildZelazoJezdziecOszczepami: meshes 117 tris 2074 (web 117 / 2074)
test no_unit_builder_is_a_stub_any_more ... ok
buildZelazoKonnicaLancowaAsyryjska: meshes 101 tris 1618 (web 101 / 1618)
buildZelazoKonnicaLuczniczaAsyryjska: meshes 107 tris 1430 (web 107 / 1430)
buildGaesatae (Gaesatae): meshes 29 tris 824 (web 29 / 824)
buildSoldurii (Soldurii): meshes 32 tris 694 (web 32 / 694)
buildCatapult (Katapulta): meshes 48 tris 1560 (web 48 / 1560)
test the_records_cover_every_mod07_builder_and_counts_match_the_web ... ok
test unit_core_record_signatures_of_the_iron_records_match ... ok
units_zelazo parity: 146 cases (fn 44 / unit PL 25 / unit PL owner B 25 / unit EN 25 / unit EN owner B 25 / cat 2; 92 via sameAs), 329382 values bit-exact checked, 0 mismatches
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.70s

     Running tests/wonders_web_parity.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt/debug/deps/wonders_web_parity-d8d9a630ca3a6684)

running 4 tests
renderer: steps=9 wonder-states=140
renderer: scalars=3080 bit_diff=0 within_1e-12=0
test renderer_scenario_is_bit_identical_to_web ... ok
trig: angles=4477 platform sin/cos differ from V8 at 272 angles
trig: scalars=8954 bit_diff=0 within_1e-12=0
test js_trig_is_bit_identical_to_v8 ... ok
test registry_matches_web_ids ... ok
models=157 meshes=2850
models: scalars=103073 bit_diff=0 within_1e-12=0
test models_are_bit_identical_to_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.16s

EXIT=0
```

### A.mutate.txt (`logi/mutate.txt`)

```text
$ python3 /home/user/The-Game/.claude/worktrees/wf_91ec5ced-915-3/dyspozycje/autobot/runs/R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1/mutate.py; echo "EXIT=$?"
M01 RingGeometry: full circle -> half (thetaLength PI): DETECTED by every_web_case_is_reproduced_bit_for_bit, norm_name_and_culture_match_the_web, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M02 oval rim: outer ring not scaled by k: DETECTED by every_web_case_is_reproduced_bit_for_bit, norm_name_and_culture_match_the_web, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M03 javelin head profile 0.78 -> 0.79: DETECTED by every_web_case_is_reproduced_bit_for_bit, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M04 rim arc bottom: last segment n/2+1 -> n/2+2: DETECTED by every_web_case_is_reproduced_bit_for_bit, norm_name_and_culture_match_the_web, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M05 falangita dory tilt 0.20 -> 0.21: DETECTED by every_web_case_is_reproduced_bit_for_bit, norm_name_and_culture_match_the_web, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M06 hastati opus5 pilum: sin(-TH_Z) -> sin(TH_Z): DETECTED by every_web_case_is_reproduced_bit_for_bit, norm_name_and_culture_match_the_web, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M07 p6 Hieros Lochos club: sin -> cos: DETECTED by every_web_case_is_reproduced_bit_for_bit, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M08 z1 beard row step 0.026 -> 0.027: DETECTED by every_web_case_is_reproduced_bit_for_bit, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M09 z1 tag prefix het- -> hett-: DETECTED by every_web_case_is_reproduced_bit_for_bit
M10 z2 khopesh roll -1.15 -> -1.16: DETECTED by every_web_case_is_reproduced_bit_for_bit, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M11 z2 Triari knee cos(0.30) -> cos(0.31): DETECTED by every_web_case_is_reproduced_bit_for_bit, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M12 z3 Galijski braccae thigh band 0.74 -> 0.75: DETECTED by every_web_case_is_reproduced_bit_for_bit, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M13 z3 Berserker axe head x offset 0.030 -> 0.031: DETECTED by every_web_case_is_reproduced_bit_for_bit, norm_name_and_culture_match_the_web, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M14 sjAlong/acAlong: D not normalised: DETECTED by every_web_case_is_reproduced_bit_for_bit, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M15 sjAlong/acAlong: Euler not re-synced after setFromUnitVectors: DETECTED by every_web_case_is_reproduced_bit_for_bit, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M16 strap: scale w <-> t swapped: DETECTED by every_web_case_is_reproduced_bit_for_bit, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M17 arm IK: reach clamp 0.999 -> 0.998: DETECTED by every_web_case_is_reproduced_bit_for_bit, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M18 konnica lancowa: rim rotateX(+PI/2) -> -PI/2: DETECTED by every_web_case_is_reproduced_bit_for_bit, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M19 konnica lucznicza: bottom bow tip mirrored: DETECTED by every_web_case_is_reproduced_bit_for_bit, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M20 konnica lucznicza: atan2 arguments swapped: DETECTED by every_web_case_is_reproduced_bit_for_bit, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M21 catapult arm angle 24 -> 25 deg: DETECTED by every_web_case_is_reproduced_bit_for_bit, the_records_cover_every_mod07_builder_and_counts_match_the_web, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M22 Gaesatae armlet torus tubular 12 -> 13: DETECTED by every_web_case_is_reproduced_bit_for_bit, the_records_cover_every_mod07_builder_and_counts_match_the_web, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M23 Soldurii dome thetaLength PI*0.5 -> PI*0.6: DETECTED by every_web_case_is_reproduced_bit_for_bit, the_records_cover_every_mod07_builder_and_counts_match_the_web, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M24 registry: MOD-07 stays NotYetPorted: DETECTED by every_web_case_is_reproduced_bit_for_bit, no_unit_builder_is_a_stub_any_more, routing_no_longer_returns_not_yet_ported_for_the_stone_package, the_records_cover_every_mod07_builder_and_counts_match_the_web, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M25 category: `falanga` stays a stub: DETECTED by every_web_case_is_reproduced_bit_for_bit, no_unit_builder_is_a_stub_any_more, routing_no_longer_returns_not_yet_ported_for_the_stone_package
M26 Prim::Zelazo hook builds a unit box: DETECTED by every_web_case_is_reproduced_bit_for_bit, norm_name_and_culture_match_the_web, the_records_cover_every_mod07_builder_and_counts_match_the_web, unit_core_record_signatures_of_the_iron_records_match, web_signature_classes_equal_rust_model_id_classes
M27 routing: buildHastati arm removed: DETECTED by every_web_case_is_reproduced_bit_for_bit, no_unit_builder_is_a_stub_any_more, the_records_cover_every_mod07_builder_and_counts_match_the_web
M28 oval rim ring: js_cos -> platform f64::cos: DETECTED by no_platform_transcendentals_anywhere_in_src
M29 up_dir: js_sin -> platform f64::sin: DETECTED by no_platform_transcendentals_anywhere_in_src
M30 konnica lucznicza: js_atan2 -> platform f64::atan2: DETECTED by no_platform_transcendentals_anywhere_in_src
M31 catapult span: js_hypot_n -> platform f64::hypot: DETECTED by no_platform_transcendentals_anywhere_in_src
detected 31/31, build errors 0
EXIT=0
```
