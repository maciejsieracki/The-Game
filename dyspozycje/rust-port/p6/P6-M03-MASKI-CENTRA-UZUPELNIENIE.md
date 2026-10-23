# P6.M03 - Maski centrum (uzupelnienie): centra kontynentow i maski ladu czterech typow swiata

Temat: `R-RUSTPORT-P6-M03-MASKI-CENTRA-UZUPELNIENIE-Q1` (DOMAIN: GAME). Runda 1/5, rola Operator.
Baza: `origin/rust-port/parity-v2` @ `95b91471` (silnik: 865+ testow). Pin weba: `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do `/home/user/scratch-m03`, poza repo).
Artefakty: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M03-MASKI-CENTRA-UZUPELNIENIE-Q1/`.

## 0. Zakres i PELNE odczytanie zrodel

| plik web (pin) | linii | odczyt |
|---|---|---|
| `gra/src/map/earth-land-mask.ts` | 170 | calosc (1-170), w tym zakresy dispatchu :1-20, :27, :32, :37-50, :53-78, :97, :128-146 |
| `gra/src/map/gen-helpers.ts` | 12 561 | zakres tematu :252-824 w calosci; naglowek :1-250 (M01); zaleznosci :1170-1340 (granice mapy, `landMaskBorderFade`, `mapEdgeRectFade`, `hexBorderDistance`); pozostale linie pliku nalezą do innych tematow M* (P6-25 §6) - nie czytane, tylko `grep` konsumentow |
| `gra/src/map/generator.ts` | 848 | tylko wiersze konsumentow (21-31, 53, 90, 172-230, 446, 847) przez `grep -nw` |
| `gra/src/map/earth-land-mask.generated.ts` | 417 | dane maski (M01) |

Konsumenci eksportow (`grep -rlw` w `gra/src`): wszystkie funkcje masek/centrow sa uzywane wylacznie przez `generator.ts` (`generateMap`, :172-230, :446). Poza tym:
- `landMaskAt` - tylko import + re-eksport (`generator.ts`:22, :847), generator go nie wywoluje (maska eliptyczna "oryginalna", martwa logika; port zachowany 1:1);
- `ZIEMIA_LAND_CENTERS`, `KONTYNENTY_ZONE_COUNT` (uzywane wewnetrznie), `ISLAND_GRID_DIVISIONS` (wewn.), `nearestContinentZoneIndex`, `mapIsotropicFromCenter` - brak konsumenta poza `gen-helpers.ts`; `ZIEMIA_LAND_CENTERS` jest w ogole nieuzywane (martwy eksport) - przeniesione jako tabela danych;
- `buildContinentCenters` jest w generatorze zywe tylko dla `ziemia` (`generator.ts`:197): wynik nie wchodzi do `landMaskZiemia`, ale ZUZYWA strumien `rand()` - stad wektory zuzycia rand dla wszystkich buduowniczych centrow.

## 1. Co zrobiono

1. `src/domain/mapgen/masks.rs` (szkielet M00 wypelniony; naglowek `//!` z ID wlasciciela zachowany): port 1:1 `gen-helpers.ts`:252-824 + lokalne kopie zaleznosci (§4) + podmodul `v8math`.
2. `data/derived/mapgen-masks.json` + parser w `src/data/derived.rs` (dopisek na koncu pliku): wszystkie stale kalibracyjne masek (skale szumow, wykladniki, progi, wspolczynniki ukladu Pangei, siatka wysp, centra Ziemi, ...).
3. Testy: `tests/p6_m03_jsmath.rs`, `p6_m03_centers.rs`, `p6_m03_masks.rs`, `p6_m03_earth.rs`, `p6_m03_tables.rs`; wektory `tests/p6_m03_vectors/{jsmath,core,masks,earth}.json` (+ `common.rs` dolaczany przez `#[path]`).
4. Zadnych zmian w `bridge.rs`, `Cargo.toml`, `domain/mod.rs`, `gra/**`, `renderer`, `src-tauri`, `tests/p6_m00_skeleton.rs`.

## 2. Odkrycie wiodace: `Math.*` V8 != libm (blokujace dla bitowej zgodnosci)

Maski uzywaja `Math.pow`, `Math.atan2`, `Math.sin`, `Math.hypot`. Rozklady argumentow masek, V8 (Node 22.22.0 / V8 12.4.254.21) vs glibc (= Rust `std`): `pow` 892/12 000, `atan2` 1 059/6 000, `sin` 203/6 000, `hypot` 2 070/6 000 roznic (`probe.json`, sonda wstepna). Stary kod `map_generator.rs` uzywal `.hypot()/.atan2()/.powf()` (stad "ostatnia cyfra 1e-16" z P6-25). Port: `masks::v8math` = fdlibm z `src/base/ieee754.cc` V8 12.4.254 (`pow`, `atan`, `atan2`, `sin` + jadra `k_sin/k_cos/rem_pio2`) i algorytm Kahana `Math.hypot` z `builtins-math`. Roznice wzgledem klasycznego fdlibm 5.3 wykryte wektorami i usuniete: mianownik `pow` `(t1-two)-(w+z*w)` (V8) zamiast `(z*t1)/(t1-two)-(w+z*w)`; `atan2` z `m &= 1` dla `|y/x| > 2^60`; prog `atan` `2^-27`. Zakres: `sin` dla `|x| <= 2^19*pi/2` (powyzej wraca do `f64::sin` - poza uzyciem generatora: kat z `atan2` w `[-pi, pi]`). `js_max/js_min` odtwarzaja NaN i znak zera `Math.max/min`.

Jadra `k_sin/k_cos/rem_pio2` sa zduplikowane z prywatnych funkcji `prims.rs` (M01, poza allowlista) - RUNDA-2: dedup po udostepnieniu ich jako `pub`.

## 3. Status kazdego eksportu

### A. `gen-helpers.ts`:252-824

| linia | symbol | status | Rust / dowod |
|---|---|---|---|
| :253 | `ShapeParams` | PORTOWANY | `masks::ShapeParams`; `default_shape_params_match_web_and_consume_six_draws` |
| :268 | `defaultShapeParams` | PORTOWANY | `masks::default_shape_params`; 8 ziaren x 10 pol + zuzycie 6 rand() (kolejnosc offsetow); stale `0.13/0.22/0.19/0.17/500` w tabeli `ksztalt` |
| :284 | `landMaskAt` | PORTOWANY (martwy w web) | `masks::land_mask_at`; 7 rozmiarow, wszystkie heksy + ramka -1..w |
| :297 | `ContinentCenter` | PORTOWANY | `masks::ContinentCenter` |
| :303 | `ContinentCenterOpts` | PORTOWANY | `masks::ContinentCenterOpts` (`Option` = `undefined`) |
| :318 | `KONTYNENTY_ZONE_COUNT` | PORTOWANY | tabela `kontynenty.liczba_stref`, `kontynenty_zone_count()`; `named_constants_match_web_exports` |
| :324 | `continentCenterCount` | PORTOWANY | `masks::continent_center_count`; 11 rozmiarow x 4 typy (progi obszaru 2000/6000) |
| :334 | `buildContinentCenters` | PORTOWANY | `masks::build_continent_centers`; 44 przypadki (n=0,1,2,4,5,6; opts: promienie, minCenterDist, anchorCenter, pierscien, wymiary 1x1..168x120; sciezka awaryjna po 40 probach) + zuzycie rand() |
| :399 | `buildFiveZoneContinentCenters` | PORTOWANY | `masks::build_five_zone_continent_centers`; 96 przypadkow (8 ziaren x 6 wymiarow x 2 pary promieni) + zuzycie rand() |
| :426 | `nearestContinentZoneIndex` | PORTOWANY | `masks::nearest_continent_zone_index`; 5 zestawow centrow (z remisami, puste) x ~3600 punktow |
| :441 | `secondNearestContinentDist` (prywatna) | PORTOWANY | `masks::second_nearest_continent_dist` (te same punkty) |
| :460 | `landMaskKontynenty` | PORTOWANY | `masks::land_mask_kontynenty`; 14 rozmiarow (1x1..500x400) |
| :499 | `mapIsotropicFromCenter` | PORTOWANY | `masks::map_isotropic_from_center`; `isotropic_helpers_match_web` |
| :512 | `normToIsotropic` (prywatna) | PORTOWANY | `masks::norm_to_isotropic` |
| :527 | `PangeaLandLayoutParams` | PORTOWANY | `masks::PangeaLandLayoutParams` |
| :542 | `pangeaLandT` (prywatna) | PORTOWANY | `masks::pangea_land_t`; `landFraction` -0.5..1.5 + NaN/+-Inf |
| :553 | `pangeaLandLayoutParams` | PORTOWANY | `masks::pangea_land_layout_params`; 8 rozmiarow x 49 wartosci `landFraction`, wszystkie 12 pol; wspolczynniki w tabeli `pangea` |
| :584 | `buildPangeaBlobCenters` | PORTOWANY | `masks::build_pangea_blob_centers`; 100 przypadkow + zuzycie rand() |
| :629 | `pangeaBlobScore` (prywatna) | PORTOWANY | `masks::pangea_blob_score`; 400 punktow + wewnatrz masek Pangei |
| :656 | `landMaskPangea` | PORTOWANY | `masks::land_mask_pangea`; 5 wartosci `landFraction` x rozmiary |
| :688 | `ISLAND_GRID_DIVISIONS` | PORTOWANY | tabela `wyspy.siatka`, `island_grid_divisions()` |
| :693 | `buildSixteenGridIslandCenters` | PORTOWANY | `masks::build_sixteen_grid_island_centers`; 24 przypadki + zuzycie rand() |
| :727 | `islandGridCellIndex` | PORTOWANY | `masks::island_grid_cell_index`; 6 rozmiarow z komorkami poza mapa (-2..w+1) |
| :735 | `assignIslandGridIndices` | PORTOWANY | `masks::assign_island_grid_indices` (`Vec` w kolejnosci wstawiania `Map`); 6 rozmiarow w tym 0x5 |
| :753 | `landMaskWyspy` | PORTOWANY | `masks::land_mask_wyspy`; 14 rozmiarow |
| :799 | `ZIEMIA_LAND_CENTERS` | PORTOWANY (martwy w web) | tabela `ziemia.centra`, `masks::ziemia_land_centers`; bity f64 = web |
| :812 | `landMaskZiemia` | PORTOWANY | `masks::land_mask_ziemia` (+ `prims::earth_template_land_at` z M01); 14 rozmiarow |
| :11-31 | importy, `TypSwiata` | NIE-DOTYCZY / DANE-JUZ-W-RUST | `map_generator::WorldType` (M01) |

### B. `earth-land-mask.ts` (zakresy dispatchu; implementacja w `prims.rs` z M01 - ten temat dodaje bezposrednie wektory)

| linie | symbol | status | dowod |
|---|---|---|---|
| :1-10, :11-16 | komentarz, import | NIE-DOTYCZY | brak logiki |
| :19 | `EARTH_PLAYABLE_BORDER` | PORTOWANY (M01) | `prims::earth_playable_border`, `mapgen-core-params.json:earth.granica_grywalna`; `p6_m03_earth::constants_match_web` |
| :27, :32, :97 | puste wiersze | NIE-DOTYCZY | - |
| :37-50 | `earthPolarOceanRows` (+ `earthNorthOceanRows`, `earthSouthOceanRows`) | PORTOWANY (M01) | `prims::earth_polar_ocean_rows/north/south`; wektory M03 dla h=0..700 |
| :53-62 | `earthPlayableInnerHeight`, `earthPlayableInnerWidth` | PORTOWANY (M01) | `p6_m03_earth::heights_...`, `widths_...` |
| :64-69 | `earthLandMapRows` | PORTOWANY (M01) | j.w. |
| :71-77 | `bitAt` | PORTOWANY (M01) | 9 500+ pozycji (w tym poza zakresem, przycinanie) |
| :128-145 | `earthSubsampleGrid`, `earthLandFractionThreshold` | PORTOWANY (M01) | 2 601 par (w,h) na krawedziach progow |

Wszystko, co dotyczy dalszej czesci `earth-land-mask.ts` (`sampleEarthTemplateLand`, `earthHexToTemplateNorm`, `earthTemplateLandAt`), zostalo zweryfikowane w M01; M03 dodatkowo ćwiczy je przez `landMaskZiemia` (14 rozmiarow, bity f64).

## 4. Zaleznosci spoza zakresu (wlasciciel M04), lokalne kopie 1:1

`MAP_BORDER_OCEAN_HEXES` (:1177), `MAP_MARGIN_LAND_ZONE_HEXES` (:1180), `mapBorderWidth` (:1183), `marginLandCapForBorderDistance` (:1191), `landMaskBorderFade` (:1294), `mapEdgeRectFade` (:1313), `hexBorderDistance` (:1334). Wartosci w tabeli `brzeg`; wektory: `p6_m03_masks::border_dependencies_match_web` (8 rozmiarow z ramka, 150 argumentow `marginLandCap`). Po scaleniu M04 zastapic wywolaniami z jego modulu (RUNDA-2 / integracja).

## 5. Wektory z URUCHOMIONEGO weba, weryfikator, kontrole negatywne

- `gen-m03-web.mjs` laduje caly `gen-helpers.ts` przez loader (`gen-loader-hooks.mjs`) BEZ stubow logiki; jedyny dopisek to `export {...}` dla czterech funkcji prywatnych w KOPII pliku poza repo. `gen-m03-earth.mjs` analogicznie dla `earth-land-mask.ts`. Uruchomienie: `node --experimental-transform-types --import ./gen-loader-register.mjs ./gen-m03-web.mjs <KORZEN> <wyjscie>` (Node v22.22.0). Liczby zapisane jako tekst `String(x)` (rownosc bitowa po `parse::<f64>`).
- Wektory: `jsmath.json` (2,3 MB), `core.json` (1,3 MB), `masks.json` (0,7 MB: 100 przypadkow masek, >1 000 000 heksow; male mapy z kazda wartoscia, duze z FNV-1a-64 po bitach wszystkich heksow + probki), `earth.json` (0,18 MB), `edges.json` (przypadki brzegowe progow i map > 2000 heksow).
- Weryfikator `verify-m03-web.py` (czysty Python, bez Rust/Node; fdlibm z dziesietnych stalych V8, pozostale funkcje z TEKSTU TS): wynik w `verify-m03-web.log`. Tabela Rusta jest porownana z transkrypcja i z literalami TS (kazda liczba tabeli wystepuje w tekscie TS zakresu). Duze mapy (>25 000 heksow): w Pythonie probki co 97. heks, pelny FNV sprawdza test Rust.
- Kontrole negatywne weryfikatora: `negctl.log`.

## 6. Audyt literalow (brak danych/mnoznikow w nowym kodzie)

`grep-literals-masks.txt` (`audit-literals.py masks.rs 743`, czesc poza `v8math`): pozostale literaly liczbowe to wylacznie `0`, `0.0`, `1`, `1.0`, `2.0`, `5`, `10` - indeksy i poczatki petli (`0..n`), `1 - x`, `x / 2.0` (srodek mapy), `2.0 * PI` (kat), `[..; 5]` (liczba kotwic tablicy piecio-strefowej = ksztalt literalu tablicy weba), `.min(1.0)`. Stala geometryczna `HALF = 0.5` (srodek znormalizowanej mapy `[0,1]`). Wszystkie wartosci balansowe (skale, progi, wykladniki, wspolczynniki, przesuniecia szumu, siatka, centra Ziemi) leza w `mapgen-masks.json`; weryfikator Python sprawdza, ze kazda liczba tabeli jest literalem w tekscie TS. W `v8math`: stale fdlibm jako bity IEEE (`bits(0x...)`, zgodnosc hex <-> dziesietne sprawdza `constcheck.py`) i progi slow wykladnika - algorytm V8, nie balans.

## 7. Mutacje

`mutate.py` / `mutate2.py` (logi: `mutacje-przebieg1.log`, `mutacje-przebieg2.log`): 63 mutacji w przebiegu 1 (41 kodu `masks.rs`, 15 danych `mapgen-masks.json`, 7 danych M01 dla zakresow `earth-land-mask.ts`), po kazdej testy `p6_m03_*` (fail-fast); plik zawsze przywracany (`diff` z kopia czysta).
- Wykryte: 57; bledy wzorca regexu: 2 (M31, M40) - powtorzone w przebiegu 2 (R31, R40) i wykryte; niewykryte: 4 (M15, M21, M36, M37).
- M37 (`mapEdgeRectFade` bez podlogi `0.001`) byla PRAWDZIWA luka: podloga dziala dopiero dla map szerszych niz 2000 heksow; dodano `edges.json` + `tests/p6_m03_edges.rs` (mapy 2000..5000) -> w przebiegu 2 wykryta (R37).
- M21 (`t < prog_male` -> `<=`) w zakresie `prog_srednie`: dodano wektory z `landFraction` rownym progowi co do bitu (+-40 ulp) -> wykryta (R21).
- Uznane za ROWNOWAZNE (z dowodem): M21/`prog_male` - dla zadnego `landFraction` w +-40 ulp od `0.15 + 0.7 * 0.28` wynik `pangeaLandT` nie jest rowny `0.28` co do bitu (`edges.json:t_equal.male` puste), wiec `<` i `<=` nie sa rozroznialne; M36 (`min(1, cap/0.45)` bez `min`) - dla `d = 3..10` iloraz `0.05*(d-1)/0.45` jest w web rowny co najwyzej `1` (`node -p`: `[1, 1]`), wiec `min` jest nieosiagalny; M15 (`dist2 - distC < 0.018` -> `<=`) - roznica odleglosci rowna dokladnie `0.018` co do bitu nie wystepuje w wektorach ani nie daje sie skonstruowac (dwa pierwiastki z `hypot`).
- Wykryte m.in.: libm zamiast V8 (hypot, pow, atan2, sin), klasyczny mianownik fdlibm `pow`, brak `m &= 1` w `atan2`, kolejnosc `rand()` (offsety ksztaltu, jittery pieciostrefowe, petle wysp, kolejnosc wstawiania mapy wysp), znaki i skladniki masek, wspolczynniki ukladu Pangei, 15 zmian danych (po jednej liczbie), 7 zmian danych zakresu Ziemi (`mapgen-core-params.json`).
- Kontrole negatywne weryfikatora Python (`negctl.log`): zmiana jednej komorki wektora -> 1 rozbieznosc; `pow`/`hypot`/`sin` z libm -> 2 217 / 10 974 / 261 rozbieznosci.

## 8. Tabela bylo/jest i zmiany testow

| miara | bylo (95b91471) | jest |
|---|---|---|
| testy `cargo test` | 865 | 905 (+40 nowych, 0 usunietych, 0 oslabionych) |
| `masks.rs` | 3 linie (szkielet) | ~1 500 linii (w tym ~740 `v8math`) |
| `Math.pow/atan2/sin/hypot` | glibc (stary `map_generator.rs`), 7-35% wartosci rozne o 1 ulp | V8 (fdlibm / Kahan), 0 rozbieznosci |
| wektory z weba dla masek | 3-7 punktow na typ (P6-25) | >1 000 000 heksow (100 przypadkow) + ~60 000 wartosci pomocniczych, bity f64 |
| weryfikator Python | brak | 163 633 sprawdzen, 0 rozbieznosci |

Zmiany w istniejacych testach: BRAK (`tests/p6_m00_skeleton.rs` bez zmian; naglowek `masks.rs` zawiera linie `Temat wlasciciel: R-RUSTPORT-P6-M03-MASKI-CENTRA-UZUPELNIENIE-Q1.`, czego test szkieletu wymaga). Nowe pliki: `p6_m03_jsmath.rs` 7 testow, `p6_m03_centers.rs` 15, `p6_m03_masks.rs` 5, `p6_m03_earth.rs` 5, `p6_m03_tables.rs` 5, `p6_m03_edges.rs` 3.

## 9. RUNDA-2 / poza zakresem (jawna lista)

1. Dedup jader `k_sin/k_cos/rem_pio2` z `prims.rs` (wymaga edycji M01).
2. Zastapienie lokalnych kopii zaleznosci brzegowych wywolaniami z modulu M04 po scaleniu.
3. Stary kod `map_generator.rs` (potok uproszczony) nadal uzywa `.hypot()/.atan2()/.powf()` - poza allowlista; przepiecie na `masks` nalezy do tematu integrujacego generator (M18).
4. `Math.sin` dla `|x| > 2^19*pi/2` korzysta z `f64::sin` (poza domena generatora).

## 10. Bramki

Surowe logi w runie: `gate-fmt.log`, `gate-clippy.log` (`cargo clippy --all-targets -- -D warnings`), `gate-test.log` (`cargo test`), `gate-diffcheck.log`; wszystkie z `EXIT=`. Build: `CARGO_INCREMENTAL=0`, wlasny `CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_1cdaadde-d5c-1`, `CARGO_PROFILE_DEV_DEBUG=0`; katalog usuniety po zakonczeniu. Nie commitowano `Cargo.lock` ani `target`.

## 11. Odstepstwa od allowlisty

Nowe pliki danych i parser, wymagane przez dispatch (`tabele data/derived/*.json + parser w data/derived.rs`): `data/derived/mapgen-masks.json`, dopisek na koncu `src/data/derived.rs`. `tests/p6_m03_vectors/common.rs` (wspolny kod testow) lezy w dozwolonym `tests/p6_m03_vectors/**`.
