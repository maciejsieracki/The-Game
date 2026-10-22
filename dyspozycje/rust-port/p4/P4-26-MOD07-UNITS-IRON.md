# P4.26 — MOD-07: modele jednostek epoki Żelaza w Rust (CPU), 1:1 z webem

**TEMAT:** `R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1` · **DOMAIN:** GAME · **Rola:** Operator, runda 1
**Baza:** odłączony `origin/rust-port/parity-v2` @ `d405b0d7` · **Web referencyjny:** `edb8fb56` (`git archive`)
**Crate:** `rust-port/renderer` (bez GPU, `forbid(unsafe_code)`, bez nowych zależności, `Cargo.lock` bez zmian)

## 0. Streszczenie

- Paczka MOD-07 jest przeniesiona w całości: 8 plików web (`hastati-opus5`, `hastati-falangita`, `jednostki-p6-super`, `jednostki-z1/z2/z3`, `zelazo-jezdziec-oszczepami-opus5`, `zelazo-konnica-asyryjska-opus5`) oraz 3 funkcje z geometrią w `units.ts` (`buildGaesatae`, `buildSoldurii`, `buildCatapult`). To **25 `Base` MOD-07**: 24 rekordy `units.json` Żelazo (25 minus Rydwan celtycki z MOD-04) plus `HastatiOld` (`buildHastati`, eksport bez rekordu i bez reguły nazwy — przeniesiony, żeby nie został stub; Z5).
- Drzewo to wyłącznie `unit_core::model::UnitModel`. Wszystkie stuby `NotYetPorted` w `unit_core` są zastąpione: rejestr (`registry::build_base`) deleguje MOD-07 do `units_zelazo::build`, a `build_category_model(Falanga)` (`case 'falanga'`, ostatni stub kategorii) buduje `buildFalangita`. **`pending()` jest puste; żaden `Base` ani żadna kategoria nie zwraca `NotYetPorted`** (test `no_unit_builder_is_a_stub_any_more`). Publiczne sygnatury bez zmian.
- **Parytet z uruchomionym webem:** 121 przypadków (`fn:` 44, `unit:` PL 25, `unitB:` PL owner B 25, `unitEn:` 25, `cat:falanga` 2). Sprawdzono **272 333 wartości bitowo, 0 rozbieżności** (liczby mesh/trójkątów/wierzchołków, pozycje, kwaterniony, skale, macierze świata, bbox, kolory sRGB i liniowe, materiały, typy i hash geometrii, nazwy, rodzice, sygnatura).
- **Trygonometria:** wyłącznie `crate::jsmath` (`js_sin/js_cos/js_atan2/js_hypot_n`, a `js_asin` przez `euler_from_quat` przy `setFromUnitVectors` z późniejszym `rotation.y = …`). Skaner `jsmath_wiring` zielony.
- **Mutacje:** 31/31 wykrytych (w tym 4 mutacje funkcji platformowych, które wyłapuje tylko `jsmath_wiring`, uruchamiany w skrypcie; §4).
- **Bramki:** fmt, clippy, clippy `--features gpu`, `cargo test --all-targets` — EXIT=0 (§6).

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
| Z11 | D-MOD-9 | Ścieżka EN porównana 1:1 (legacy): „Iron Khopesh Warrior” → brązowy `KhopeshWarrior` (znany rozjazd P4-4 §2.1c) — `unitEn:Wojownik z żelaznym khopesh` jest w fixture jako osobny rekord i jest zgodny bitowo. |

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
2. Determinizm: dwa uruchomienia do osobnych katalogów → identyczny SHA-256 `cc657f0f…1c28c76`.

### 3.2 Testy `tests/units_zelazo_web_parity.rs` (4)

| Test | Co sprawdza | Wynik |
|---|---|---|
| `every_web_case_is_reproduced_bit_for_bit` | 121 drzew: `fn:` 22 buildery × 2 kolory przez `registry::build_base`; `unit:`/`unitB:` przez `model_for(PL)` → `build_model` (z asercją `model_for == legacy_route(kat, PL)`); `unitEn:` przez `legacy_route(kat, EN)`; `cat:falanga` przez `build_category_model(Falanga)` (z asercją równości z `build_model(legacy_route("falanga", None))`). Dla `fn:` także `perTokenGeos = 0`. | **272 333 wartości, 0 rozbieżności** |
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

## 5. Fixture i skrypty (`rust-port/renderer/tests/fixtures/units_zelazo/`, 2,20 MB < 8 MB)

| Plik | SHA-256 |
|---|---|
| `units_zelazo.json` | `cc657f0fecb34e3d96eabf4a3c12e170cb5673aa8a8156cff60ee2df71c28c76` (także `units_zelazo.json.sha256`) |
| `gen.ts` | `582d59514a1f8dcaee999e7dd87b0f23708a1749a7c0c447fdb20d0052795b97` |
| `build.mjs` | `36c2c19b3e36cb568b4b2e882cf918c79b6c7e1e0b9c0c9f069ed1ac917149c6` |

Regeneracja: `README.md` tamże. Redukcja rozmiaru: 68/121 przypadków jako `{call, sameAs}` (Rust i tak buduje własny model i porównuje w całości). Nic nie pominięto.

## 6. Bramki (surowe logi: `dyspozycje/autobot/runs/R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1/logi/`, skrypt `gates.sh`)

| Bramka | Log | Wynik |
|---|---|---|
| `cargo fmt --all -- --check` | `fmt.txt` | `EXIT=0` |
| `cargo clippy --locked --all-targets -- -D warnings` | `clippy.txt` | `EXIT=0` |
| `cargo clippy --locked --all-targets --features gpu -- -D warnings` | `clippy-gpu.txt` | `EXIT=0` |
| `cargo test --locked --all-targets` | `test.txt` | `EXIT=0`; 25 celów, 154 passed, 0 failed, 0 ignored |
| `cargo test --locked --all-targets -- --nocapture` | `test-nocapture.txt` | `EXIT=0`; `units_zelazo parity: 121 cases (…; 68 via sameAs), 272333 values bit-exact checked, 0 mismatches` |
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
