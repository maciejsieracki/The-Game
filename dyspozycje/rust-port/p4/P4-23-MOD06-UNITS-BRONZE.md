# P4.23 — MOD-06: modele jednostek epoki Brązu w Rust (CPU), 1:1 z webem

**TEMAT:** `R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1` · **DOMAIN:** GAME · **Rola:** Operator, runda 1
**Baza:** odłączony `origin/rust-port/parity-v2` @ `dbddb6be` · **Web referencyjny:** `edb8fb56` (`git archive`)
**Crate:** `rust-port/renderer` (bez GPU, `forbid(unsafe_code)`, bez nowych zależności, `Cargo.lock` bez zmian)

## 0. Streszczenie

- Paczka MOD-06 jest przeniesiona w całości. Obejmuje 9 plików `braz-*-opus5.ts`, eksporty osiągalne z `units.ts` w 6 plikach `jednostki-p2/p3/p4/p57/p8a/p8b` oraz 8 builderów żyjących w `units.ts`. Razem to **38 `Base` MOD-06**: 37 rekordów `units.json` Brąz (40 minus Galera, Rydwan mykeński i Rydwan Shang, które należą do MOD-04) plus `LegionRzymski`. Ten ostatni nie ma rekordu i jest osiągalny tylko regułą nazwy `units.ts:1676`.
- Drzewo to wyłącznie `unit_core::model::UnitModel`. Stuby `NotYetPorted` MOD-06 są zastąpione (`registry::build_base`), a sygnatury publiczne się nie zmieniły.
- **Parytet z uruchomionym webem:** 180 przypadków (`fn:` 60, `unit:` PL 40, `unitB:` PL owner B 40, `unitEn:` 40). Sprawdzono **478 906 wartości bitowo, 0 rozbieżności**.
- **Konsolidacja `js_asin`:** funkcja przeniesiona do `src/jsmath/inverse.rs` (port fdlibm `e_asin`). `units_kamien::kit` re-eksportuje ją jedną linią. Nowy wektor V8 `asin.bin` ma 20 021 argumentów, a test bitowy daje 0 rozbieżności. `jsmath_wiring` jest zielony.
- **Mutacje:** 20/20 wykrytych; po obronie rundy 1 23/23 (z `jsmath_wiring`, §4).
- **Bramki:** fmt, clippy, clippy `--features gpu` i `cargo test --all-targets` kończą się EXIT=0 (20 celów, 123 testy, 0 failed).

## 1. Zakres, decyzje i ZAŁOŻENIA

| # | Pozycja | Rozstrzygnięcie |
|---|---|---|
| Z1 | Lokalizacja dispatchu | `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:…` nie zawierał pliku. **ZAŁOŻENIE:** obowiązuje `dyspozycje/autobot/runs/R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1/00-dispatch.md` z katalogu roboczego głównego repo (niezacommitowany). Kopia leży w katalogu runu. |
| Z2 | Linia modułu | Jedna linia `pub mod units_braz;` w `src/models.rs`, tak jak w P4.19 Z1. `lib.rs` bez zmian. |
| Z3 | Geometrie spoza `Prim`: `OctahedronGeometry` (`braz-procarz-opus5.ts:236,253`), profilowane ostrza `BufferGeometry` (LeafHead, Rapier), owalna skorupa i lico scutum / fig-8 (`jednostki-p8b-rozni.ts:227-269`, `-p8a-…`, `-p4-…`) | Typ `BrazGeo` (Copy) w `units_braz/geo.rs`. **Hak w `unit_core/model.rs` (5 linii):** wariant `Prim::Braz(BrazGeo)` i gałąź `build()`, czyli dokładnie „wariant geometrii” z allowlisty. Hash, bbox i sygnatura działają bez zmian. |
| Z4 | Zmiany w `unit_core/**` (allowlista: tylko miejsca stubów i wariant geometrii) | (a) `registry.rs`: `is_ported` obejmuje `Mod06Bronze`, a `build_base` deleguje `Package::Mod06Bronze` do `units_braz::build(base, owner)` (`.ok_or(NotYetPorted)`); `pending()` zwraca wyłącznie MOD-07; dokumentacja „packages 6–7” zmieniona na „package 7”. (b) `model.rs`: hak Z3. `category.rs` **bez zmian**, bo żadna kategoria nie kieruje do MOD-06. |
| Z5 | Martwe eksporty (D-MOD-3) | `units.ts:132-152` importuje z p2 tylko `buildAxeWarriorInka`/`buildInkaSlinger`, z p3 `buildAkkadianArcher`/`buildAssyrianArcher`, a z p57 `Impi`/`SumerianSpearman`/`SiegeTower` (grep `gra/src`: brak innych importerów). **ZAŁOŻENIE:** `buildMaceWarrior`, `buildInkaJavelineer` (p2), `buildZuluJavelineer`, `buildEgyptianArcher`, `buildSumerianArcher` (p3) oraz `buildBatteringRam` (p57) **nie są portowane**, bo żaden rekord ani reguła ich nie osiąga (odpowiedniki Kamienia to P4.19). W razie potrzeby można je dodać jako temat galerii. |
| Z6 | 8 builderów `units.ts` | Nie są eksportowane, więc fixture sięga do nich prawdziwym wejściem `buildUnitModel(categoryOf, owner, nazwa)`. Rust używa helperów P4.13 (`build_base_avatar`, `add_belt/boots/hands/greaves/pteruges/tunic_hem/super_banner`, `build_horse`, `build_category_model(Rydwan/Konnica)`, `UnitPart`) w jednej implementacji. |
| Z7 | `perTokenGeos` | Liczba jest porównywana (=0) dla wszystkich 60 przypadków `fn:`. Dla 8 builderów `units.ts` web trzyma geometrie per-token wyłącznie do zwalniania GPU. W Rust to wartości `Prim`, więc **liczba nie jest porównywana**, a sama geometria (hash, wierzchołki, trójkąty) jest porównywana bitowo jak każda inna. |
| Z8 | Rozmiar fixture | Przypadki z identycznym pełnym rekordem są zapisywane jako `{call, sameAs}` (96/180). Rust i tak buduje własny model dla każdego wywołania i porównuje go w całości. Plik ma 4,06 MB, czyli poniżej 8 MB. |
| Z9 | Trygonometria | `Math.sin/cos/atan2/asin` idą przez `crate::jsmath` (V8). `rotation.*` liczy kwaternion z pełnego Eulera (`quat_from_euler`). `setFromUnitVectors` z późniejszym `rotation.y = v` przechodzi przez `quat_units_synced` (Euler z kwaternionu, czyli `js_asin`), tak jak `onChange` w three r169. |
| Z10 | Styl | Tylko `roblox` (D-MOD-1), bo modele Brązu nie mają gałęzi stylu. |

## 2. Architektura modułu (`rust-port/renderer/src/models/units_braz/`, 10 867 linii)

| Plik | Buildery | Źródło web (`edb8fb56`, `gra/src/render/`) |
|---|---|---|
| `mod.rs` | `build(Base, owner) -> Option<UnitModel>` (38 gałęzi; poza MOD-06 `debug_assert_ne!` i `None`) | — |
| `geo.rs` | `BrazGeo {Octahedron, Blade{LeafHead,Rapier}, OvalShell, OvalFace}` | `braz-procarz-opus5.ts:236,253`; owal `jednostki-p8b-rozni.ts:227-269` (identyczny w p4/p8a) |
| `kit.rs` | `bx/cy/cy_open/cn/sph/torus/ico/octa/blade/oval_*`, `rot3`, `stretch`, `quat_units_synced`, `apply_quat`, `apply_axis_angle`, `add_scaled` + re-eksport z `units_kamien::kit` | three r169 `Vector3.applyQuaternion/applyAxisAngle`, `Euler.set` |
| `taran.rs`, `procarz.rs`, `wlocznik.rs`, `miecznik.rs`, `lucznik_nubijski.rs`, `rydwan_woly.rs`, `konnica.rs`, `rydwan_konny.rs`, `rydwan_kapadokijski.rs` | 9 × `build*Opus5` | `braz-taran:256`, `-procarz:689`, `-wlocznik:483`, `-miecznik:506`, `-lucznik-nubijski:616`, `-rydwan-woly:398`, `-konnica:532`, `-rydwan-konny:599`, `-rydwan-kapadokijski:563` |
| `p2_inka.rs` | `AxeWarriorInka`, `InkaSlinger` | `jednostki-p2-inka.ts:499, 600` |
| `p3_dystans.rs` | `AkkadianArcher`, `AssyrianArcher` | `jednostki-p3-dystans.ts:760, 819` |
| `p4_melee.rs` | `Sherden`, `Tyrrhenian`, `Shekelesh`, `MycenaeanWarrior`, `ShangHalberdier`, `KhopeshWarrior` | `jednostki-p4-melee.ts:382, 468, 544, 616, 707, 796` |
| `p57.rs` | `Impi`, `SumerianSpearman`, `SiegeTower` | `jednostki-p57-wlocznie-machiny.ts:319, 455, 714` |
| `p8a.rs` | `PiechotaHetycka`, `GwardiaIshtar`, `WojownikBabilonski`, `WojownikFenicki` | `jednostki-p8a-bliskiwschod.ts:380, 468, 543, 628` |
| `p8b.rs` | `StraznikHarappy`, `PiechotaInduska`, `LegionRzymski`, `GwardzistaChampi` | `jednostki-p8b-rozni.ts:358, 465, 573, 686` |
| `units_ts.rs` | `Medjay`, `SumerianChariot`, `EgyptianChariot`, `ChineseCavalry`, `SumerianRoyalGuard`, `HuBenWei`, `UThulwana`, `InkaRoyalGuard` | `units.ts:1928, 2197, 2421, 2504, 4859, 5004, 5156, 5343` |

**jsmath:**
- `src/jsmath/inverse.rs` dostał `pub fn js_asin` (port fdlibm `e_asin.c`, przeniesiony z `units_kamien::kit`).
- `src/jsmath/mod.rs` re-eksportuje `js_asin`.
- `units_kamien/kit.rs` zawiera teraz `pub use crate::jsmath::js_asin;`, więc ścieżka kompatybilności zostaje, a implementacja jest jedna.

## 3. Weryfikacja

### 3.1 Metoda

1. Generator `tests/fixtures/units_braz/gen.ts` uruchamia **niezmieniony** web `edb8fb56` (three@0.169.0, esbuild@0.24.0, node v22.22.0, bez WebGL) i zapisuje pełne drzewo każdego przypadku.
2. Format jest ten sam co w P4.13/P4.19:
   - na węzeł: `p`, `q`, `s`, `matrixWorld`;
   - na siatkę: hash FNV-1a geometrii, `vtx`, `tri` i materiał;
   - na model: `mats`, bbox, liczby siatek/trójkątów/wierzchołków, sygnatura;
   - liczby zmiennoprzecinkowe jako bity f64.
3. Determinizm: dwa uruchomienia dają ten sam SHA-256 (`1cdbab21…7f42`).

### 3.2 Testy `tests/units_braz_web_parity.rs` (4) i `tests/jsmath_v8_parity.rs`

| Test | Co sprawdza | Wynik |
|---|---|---|
| `every_web_case_is_reproduced_bit_for_bit` | 180 drzew: `fn:` 30 builderów × 2 kolory przez `registry::build_base`, `unit:`/`unitB:` przez `model_for(PL)` → `build_model`, `unitEn:` przez `legacy_route(kat, EN)`. Porównuje wszystkie pola z §3.1, a dla `fn:` także `perTokenGeos` = 0. | **478 906 wartości, 0 rozbieżności** |
| `the_records_cover_every_mod06_builder_and_counts_match_the_web` | 37 rekordów MOD-06 ↔ 37 różnych `Base` (+ `LegionRzymski` bez rekordu = 38); liczby siatek i trójkątów | zgodne (§3.3) |
| `routing_no_longer_returns_not_yet_ported_for_the_bronze_package` | `build_base` zwraca Ok dla 38 `Base` MOD-06; `pending()` zawiera tylko MOD-07 | ok |
| `unit_core_record_signatures_of_the_bronze_records_match` | niezależnie: `sigPl`/`sigEn` z fixture P4.13 dla 40 rekordów Brąz | zgodne |
| `asin_matches_v8` (+ kotwice `asin(1)=π/2`, `asin(-0)=-0`, `asin(1.5)=NaN`, `compatibility_paths_are_the_same_functions`) | `jsmath::js_asin` vs V8 `Math.asin`, 20 021 wierszy (661 NaN). Gałęzie fdlibm: 2⁻²⁷, 0,5, 0,975 (`0x3fef3333`), ±1, poza zakresem. | 0 rozbieżności |

### 3.3 Liczby (web = Rust, OWNER_A, `unit:<PL>`)

| Rekord (kategoria) | siatki | trójkąty | wierzchołki | materiały |
|---|---|---|---|---|
| Procarz (procarz) | 100 | 1120 | 2432 | 17 |
| Włócznik (wlocznik) | 77 | 1228 | 2228 | 17 |
| Wojownik z mieczem i tarczą (miecznik) | 81 | 1204 | 2271 | 17 |
| Rydwan (woły) (rydwan) | 108 | 1496 | 2746 | 18 |
| Konnica (konnica) | 104 | 1572 | 2816 | 17 |
| Jeździec chiński (konnica) | 53 | 764 | 1466 | 16 |
| Hu Ben Wei (super) | 43 | 544 | 1072 | 15 |
| Impi (wlocznik) | 36 | 458 | 955 | 12 |
| uThulwana (super) | 38 | 568 | 1015 | 15 |
| Wojownik z toporem (topor) | 35 | 420 | 840 | 10 |
| Procarz (Huaracoc) (procarz) | 33 | 396 | 792 | 12 |
| Królewska Gwardia (super) | 62 | 788 | 1552 | 17 |
| Rydwan konny (rydwan) | 145 | 1936 | 3657 | 19 |
| Rydwan egipski (rydwan) | 101 | 1376 | 2632 | 17 |
| Wojownik z khopesh (miecznik) | 28 | 396 | 732 | 9 |
| Medżaj (super) | 40 | 580 | 1104 | 17 |
| Łucznik nubijski (lucznik) | 84 | 1052 | 2079 | 22 |
| Rydwan sumeryjski (rydwan) | 88 | 1304 | 2436 | 12 |
| Włócznik sumeryjski (wlocznik) | 36 | 448 | 887 | 11 |
| Gwardia Królewska Sumeru (super) | 42 | 524 | 1036 | 14 |
| Wojownik mykeński (miecznik) | 29 | 416 | 845 | 9 |
| Wojownik Sherden (miecznik) | 34 | 460 | 877 | 9 |
| Halabardnik Shang (miecznik) | 33 | 412 | 815 | 9 |
| Łucznik akadyjski (lucznik) | 36 | 448 | 887 | 10 |
| Taran okuty (obleznicza) | 102 | 1600 | 2624 | 12 |
| Wieża oblężnicza (obleznicza) | 46 | 656 | 1248 | 7 |
| Wojownik tyrreński (topor) | 33 | 452 | 858 | 10 |
| Wojownik szekelesz (wlocznik) | 33 | 452 | 847 | 10 |
| Łucznik asyryjski (lucznik) | 37 | 460 | 911 | 12 |
| Strażnik bram Harappy (wlocznik) | 34 | 424 | 839 | 12 |
| Piechota induska (wlocznik) | 29 | 384 | 747 | 13 |
| Rydwan Kapadokijski (rydwan) | 149 | 2096 | 3831 | 16 |
| Piechota hetycka (wlocznik) | 31 | 420 | 911 | 10 |
| Gwardia Ishtar (miecznik) | 35 | 460 | 885 | 10 |
| Wojownik babiloński (miecznik) | 31 | 416 | 794 | 10 |
| Wojownik fenicki (miecznik) | 32 | 458 | 815 | 11 |
| Gwardzista z champi (maczuga) | 38 | 456 | 912 | 12 |

Poza MOD-06, ale także porównane, bo należą do epoki Brąz: Galera, Rydwan mykeński i Rydwan Shang (MOD-04, P4.13).

### 3.4 Wpływ na testy P4.13/P4.19 (ODCHYLENIA)

- **O1** `tests/unit_core_model_rule.rs`: licznik `compared_records` wzrósł z 32 do **105**, czyli o 73 wywołania rekordów PL/EN, które trafiają do buildera MOD-06 i których sygnatura jest teraz porównywana bitowo. Z log `model rule`: 175 wywołań, 152 rekordy PL+EN, 121 porównanych sygnatur. Logika testu się nie zmieniła; to plik z allowlisty „wyłącznie liczniki stubów”.
- **O2** `tests/units_kamien_web_parity.rs` (**poza allowlistą, wymuszone**): wyczerpujący `match` funkcji `three_type(&Prim)` przestał się kompilować po dodaniu wariantu `Prim::Braz`. Dodana jest jedna gałąź `Prim::Braz(b) => b.three_type()` z komentarzem i bez zmiany asercji. Bez niej `cargo test --all-targets` nie przechodzi.
- `tests/unit_core_web_parity.rs`: bez zmian (zielony).

## 4. Test mutacyjny (`dyspozycje/autobot/runs/R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1/mutate.py`, log `logi/mutate.txt`)

**Wynik: 20/20 DETECTED, 0 build errors, EXIT=0.** Mutacje obejmują:
- `js_asin` (M01);
- owal: kąt startowy (M02) i znak misy (M03);
- profil ostrza (M04);
- detail oktaedru (M05);
- re-synchronizację Eulera po `setFromUnitVectors` (M06);
- `applyAxisAngle(-yaw)` (M07);
- skale i stałe (M08–M11);
- obrót włóczni p8b (M12);
- kolejność kolorów (M13);
- `sin`↔`cos` w promieniach Inki (M14);
- obrót korzenia rydwanu sumeryjskiego (M15);
- roughness materiału (M16);
- stub w rejestrze (M17);
- hak `Prim::Braz` (M18);
- usuniętą gałąź routingu (M19);
- re-route `js_asin` w `units_kamien` (M20).

Uwagi:
- M20 ma w etykiecie „libm”, a faktyczna mutacja to `js_asin(x)·(1+ε)`.
- Pierwsza wersja M07 (zmiana kolejności sumowania w `apply_quat`) **PRZEŻYŁA** (log `logi/mutate-v1-M07-survived.txt`). Jedyny wywołujący obraca wokół `Y_UP` (qx = qz = 0), więc na wszystkich wejściach webu to mutant równoważny. Zastąpiono go obserwowalną mutacją znaku kąta.

**Obrona rundy 1 (uwaga 2 Evaluatora, E10–E12):** podmiana `js_cos`/`js_sin`/`js_atan2` na funkcje systemowe daje na danych webu te same bity (glibc), więc testy parytetu jej nie widzą; łapie ją wyłącznie skaner `jsmath_wiring`. `mutate.py` uruchamia teraz także `--test jsmath_wiring` i ma mutacje M21 (`geo.rs` `js_cos`→`.cos()`), M22 (`geo.rs` `js_sin`→`.sin()`), M23 (`procarz.rs` `js_atan2`→`.atan2()`). **Wynik: 23/23 DETECTED, 0 build errors, EXIT=0** (log `logi/mutate-obrona.txt`; M21–M23 przez `no_platform_transcendentals_anywhere_in_src`). Log `logi/mutate.txt` (20/20) zostaje jako zapis pierwotnego przebiegu.

## 5. Fixture i skrypty (`rust-port/renderer/tests/fixtures/units_braz/`, 4,06 MB < 8 MB)

| Plik | SHA-256 |
|---|---|
| `units_braz.json` | `1cdbab211063c4cf18db090cd06c25ae0453e8a548782d05616e4e7182749f42` (także `units_braz.json.sha256`) |
| `gen.ts` | `61e97cdd1fa575a0a98446f0e659352ae2ff28823ef9d78dbeb34bc2d2d95bbe` |
| `build.mjs` | `bf7f781997c4395427c007ca311e44972090561566f3b0b92def2be94f9ba6da` |
| `../jsmath/asin.bin` | `10f847394bd950681c74f3c5dbfb2e47806c429256545e5fda3312c25f13f36d` |
| `../jsmath/gen.mjs` | `64ef2920cc594dbbeddd9c392c4ecdfce0b5b49a6b6fddb64f53b371d87ee801` |

- Regeneracja jest opisana w `README.md`.
- `asin` jest dopisany do `gen.mjs` jako ostatni, więc wszystkie wcześniejsze `.bin` są bajtowo identyczne z P4.16.
- `asin.bin` jest identyczny w trybach domyślnym, `--jitless` i `--always-turbofan`.

## 6. Bramki (surowe logi: `dyspozycje/autobot/runs/R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1/logi/`, skrypt `gates.sh`)

| Bramka | Log | Wynik |
|---|---|---|
| `cargo fmt --all -- --check` | `fmt.txt` | EXIT=0 |
| `cargo clippy --locked --all-targets -- -D warnings` | `clippy.txt` | EXIT=0 |
| `cargo clippy --locked --all-targets --features gpu -- -D warnings` | `clippy-gpu.txt` | EXIT=0 |
| `cargo test --locked --all-targets` | `test.txt` | EXIT=0 (20 celów, 123 passed, 0 failed) |
| `cargo test … -- --nocapture` | `test-nocapture.txt` | EXIT=0 |
| `python3 mutate.py` (runda 1) | `mutate.txt` | 20/20, EXIT=0 |
| `python3 mutate.py` (obrona, + `jsmath_wiring`, M21–M23) | `mutate-obrona.txt` | 23/23, EXIT=0 |

Pozostałe kontrole:
- `git diff --check` jest czysty. Jedyna obróbka surowych logów: w `logi/test-nocapture.txt` usunięto końcowe spacje z 3 linii wypisywanych przez test P4.13 (`renderer:`/`trig:`/`models: … within_1e-12=0`); treść się nie zmieniła.
- `Cargo.lock` i `Cargo.toml` są bez zmian.
- Nie uruchamiano `npm run build`/`dev`.
- Nie zmieniono `gra/**`.

Jedno lokalne `#[allow(clippy::approx_constant)]` (`taran.rs`, literał webu `0.318`, który nie jest 1/π).

## 7. NIE_ZMIERZONO i „co ocenić wzrokiem po RR-T5”

**NIE_ZMIERZONO:** wygląd 1:1 na GPU (oświetlenie, cienie, kolory sRGB w rendererze, z-fighting), bo w tym temacie nie ma renderera. Zgodność dotyczy drzewa obiektów, geometrii i materiałów.

**Do oceny wzrokiem po RR-T5:**
1. Rydwany: koła i szprychy, dyszel, konie (woły, konny, Kapadokijski, sumeryjski z obrotem korzenia π, egipski).
2. Owalne tarcze (scutum Legionu, fig-8 Hetytów i p4): kierunek misy i z-fighting lica z rantem (`+0.013..0.016`).
3. Konnica Brązu: odchylenie korzenia 1.02 rad, obrót kopii (Euler po `setFromUnitVectors`).
4. Procarz: oktaedry kamieni i ich rozrzut skali.
5. Taran okuty i Wieża oblężnicza: skala względem heksu.
6. Super-jednostki `units.ts` (Medżaj, Hu Ben Wei, uThulwana, Królewska Gwardia, Gwardia Sumeru): czytelność głowy i hełmu pod kątem 52° (komentarze NAPRAWA 2026-08-06 w webie).
7. Kolor gracza (owner B) na tarczach i pasach wszystkich 37 rekordów.

## 8. Pliki (allowlista)

**Nowe:**
- `rust-port/renderer/src/models/units_braz/**` (19 plików);
- `rust-port/renderer/tests/units_braz_web_parity.rs`;
- `rust-port/renderer/tests/fixtures/units_braz/{units_braz.json, units_braz.json.sha256, gen.ts, build.mjs, README.md}`;
- `rust-port/renderer/tests/fixtures/jsmath/asin.bin`;
- ten dokument;
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1/{00-dispatch.md, 01-operator-r1.md, 02-operator-obrona-r1.md, gates.sh, mutate.py, logi/}`.

**Zmienione:**
- `src/models.rs` (+1 linia);
- `src/models/unit_core/{model.rs (hak Prim::Braz), registry.rs (is_ported, build_base, dokumentacja)}`;
- `src/models/units_kamien/kit.rs` (tylko re-route `js_asin`);
- `src/jsmath/{inverse.rs, mod.rs}`;
- `tests/jsmath_v8_parity.rs`;
- `tests/fixtures/jsmath/{gen.mjs, manifest.json, README.md}`;
- `tests/unit_core_model_rule.rs` (licznik, O1);
- `tests/units_kamien_web_parity.rs` (O2, poza allowlistą, wymuszone).

**Nietknięte:**
- `gra/**`, `src-tauri/**`, `rust-port/engine/**`;
- `src/{geom,pick,assets,camera,terrain}/**`;
- `category.rs`;
- tematy równoległe P4.20/21/22, P3.22, P5.2.

**Integracja:** spodziewany konflikt jednej linii w `src/models.rs`, a w `jsmath/mod.rs`/`registry.rs` także z równoległymi tematami.

**Scratch:** katalog `p423/` w scratchpadzie sesji, usunięty po zakończeniu. Podczas pracy wykonano jednorazowo `npm install` (te same wersje) w `scratchpad/ref` (katalog utworzony przez tego Operatora 2026-10-22 13:48 UTC, ok. 39 MB). W obronie (uwaga 4 Evaluatora) sprawdzono, że żaden skrypt w scratchpadzie ani żaden proces go nie używa, i **usunięto go** (`rm -rf …/scratchpad/ref`). Dwa pliki skopiowane przez pomyłkę do współdzielonego `refscript/` zostały usunięte.
