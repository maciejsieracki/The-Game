# P6.M09 - klastry: minimalny wycinek rywali (odblokowuje P6.1C RUNDA-2)

Temat: `R-RUSTPORT-P6-M09-KLASTRY-RYWALE-MIN-Q1` · DOMAIN: GAME · RUNDA 1/5 (Operator)
Baza: `origin/rust-port/parity-v2` (`1570419b`). Pin web: `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do `mktemp -d` poza repo).
Zakres: pliki `cluster-spawn.ts` i `clusters.ts`, zakresy linii z dispatchu (16 zakresow, 24 deklaracje). Szczegoly zakresu: `P6-25-MAPA-GAP.md` §4 (wiersze M09), §6, §6a, §7, §9.

## 0. Status (uczciwie)

- **24/24** deklaracji z zakresow M09 ma status (tabela §3): **PORTOWANY 23** (kod + test + wektor z uruchomionego weba), **DANE-JUZ-W-RUST 1** (`landHexesFromMap`: logika w `start_position::land_hexes_from_terrain` z P6.1C; adapter na `GeneratedMap` porownany z webem), **NIE-DOTYCZY 0**, **RUNDA-2 0** (zero symboli z zakresu odlozonych; "RUNDA-2" P6.1C = `buildClusterSpawnPlan`/`computeClusters`, poza zakresem M09).
- Pelne zasilenie `build_cluster_start_plan` wynikiem Rust nadal wymaga M10 -> M11 -> M12 (jak w P6-25 §6): M09 odblokowuje **tylko** `buildSameTypeRivalSlots`, `buildSameTypeRivalCandidateHexes`, `groupForeignTypeClusters`.
- Wektory z uruchomionego weba: **3641 przypadkow** (17 kategorii) w `tests/p6_m09_vectors/web-vectors.json` (1,2 MB), 0 rozbieznosci Rust vs web (bitowo dla f64).
- Niezalezny weryfikator Python: **20560 sprawdzen, 0 rozbieznosci** (`verify-m09-r2.log`, `EXIT=0`); test negatywny weryfikatora (2 zmutowane wartosci) => `rozbieznosci: 2`, `EXIT=1` (`verify-m09-negative-r2.log`).
- Testy: **22 nowe** (`p6_m09_rivals` 19, `p6_m09_tables` 3). `cargo test --no-fail-fast`: **616 passed, 1 failed** (`gate-test-r2.log`, `EXIT=101`); z proponowanym poluzowaniem `p6_m00_skeleton` (§8, patch NIE commitowany): **617 passed, 0 failed, `EXIT=0`** (`gate-test-patched-r2.log`). 617 = 595 (baza) + 22.
- **BLOKADA BRAMKI (jedna, systemowa, nie zalezna od jakosci M09)**: `tests/p6_m00_skeleton.rs::files_exist_and_are_empty_doc_only` wymaga, by KAZDY plik `mapgen/*.rs` (poza `mod.rs`) mial wylacznie linie `//!` - wypelnienie pliku przez jakikolwiek temat M01..M18 lamie ten test z definicji. Plik testu jest poza allowlista M09, wiec go NIE zmieniam; dostarczam patch (§8) do zastosowania przez orkiestratora przy integracji (dotyczy wszystkich rownoleglych tematow M*, nie tylko M09).
- fmt i clippy `--all-targets -D warnings`: `EXIT=0` (`gate-fmt-r2.log`, `gate-clippy-r2.log`). Zero zmian istniejacych testow (nic nie oslabiono).

## 1. Metoda wektorow (ANTY-HALUCYNACJA)

- Generator `gen-m09-vectors.mjs` (w runie), uruchomienie (Node v22.22.0):
  `node --experimental-transform-types --no-warnings --import ./m09-loader-register.mjs ./gen-m09-vectors.mjs <WEB_ROOT> <OUT_JSON> <STUB_DIR>` -> `OK {"consts":1,"clusterPackRadius":160,...}` (`gen-m09-r1.log`).
- **Import PRAWDZIWYCH modulow weba bez zmian i bez stubow**: `map/cluster-spawn.ts` i `map/clusters.ts` (graf importow laduje sie w calosci; loader `m09-loader-hooks.mjs` tylko dopisuje `.ts`/`/index.ts` i traktuje `.json` jako modul). Eksportowane symbole (`buildSameTypeRivalSlots`, `buildSameTypeRivalCandidateHexes`, `groupForeignTypeClusters`, `clusterPackRadius`, `passesForeignClusterBufferGate`, `computeSameTypeRivalHalfPlaneAxis`, `isInSameTypeRivalHalfPlane`, `packCityStatesHubChain`, `packCityStatesAroundCapital`, `packRivalCitiesAroundCore`, 6 stalych) wywolywane sa z prawdziwych modulow.
- **Funkcje prywatne WYCIETE WERBATIM** (nie przepisane): `shuffleInPlace` (:168-175), `landPoolNearCore` (:1771-1800), `hexesAtDistance` (:1848-1867), `packNearestLegalLand` (:1975-2030) z `clusters.ts` oraz `landHexesFromMap` (:71-79), `mapCenterFromGameMap` (:81-86) z `cluster-spawn.ts`. Generator weryfikuje kotwice (poczatek pierwszej linii i dokladna tresc ostatniej linii zakresu; drift => blad) i zapisuje stuby do `<STUB_DIR>` (`export` dopisane przed deklaracja).
- Mapy: PRAWDZIWY `generateMap` (5 specyfikacji identycznych jak P6.1C: k42, k7, p123, k3small, w5). Tozsamosc potwierdza odcisk FNV-1a64 listy `q,r,teren` w wektorach; test Rust (`vectors_identify_the_same_maps_as_p6_1c`) liczy go z `tests/p6_1c_vectors/maps.json` - jedna kopia map w repo.
- Pule ladu (15 fixture'ow, jawne listy `[q,r]`): puste, jeden hex, 5 rozproszonych, dyski r=3/6/9, dysk o wspolrzednych ujemnych, dyski z dziurami 20%/45%, dysk w losowej kolejnosci, waski pas, pierscien, dwie wyspy, rzadkie 30%, gestkie 85%. Cel: wymuszenie sciezek `landPoolNearCore` z rozszerzaniem promienia, `packNearestLegalLand` (uzupelnianie), powtorzen ziaren, opcji `anchor`/`excludeHex`/`foreignBuffers`/`halfPlaneAxis`/`growthReserve`/`ringDistances`.
- Liczby `f64` (os polplaszczyzny, srodek mapy, promien bufora, margines) sa w wektorach TEKSTEM (`String(x)`, `-0` jawnie), bo `serde_json` bez `float_roundtrip` myli ostatni bit (pulapka z P6.1 r2); testy porownuja `f64::to_bits`.
- Kategorie i liczby przypadkow: `consts` 1 (6 stalych), `clusterPackRadius` 160, `shuffle` 75, `bufferGate` 160, `hexesAt` 33, `axis` 280, `halfPlane` 260, `landPool` 135, `hubChain` 300, `nearest` 210, `aroundCapital` 360, `rivalCore` 180, `mapHelpers` 5, `slots` 960 (m.in. 3 cywilizacje, z pulami i bez, 2 wartosci `firstOwnerId`), `candidates` 420, `group` 60, `seedIndependence` 42. Pokrycie: 720/960 slotow niepustych, 360/420 kandydatow niepustych, 91/360 wynikow `packCityStatesAroundCapital` krotszych niz zadano (sciezka uzupelniania), 156/360 z `growthSlot`.
- **Niezalezny weryfikator** `verify-m09-vectors.py <WEB_ROOT> <VECTORS> <MAPS> <TABELA>`: reimplementuje logike w Pythonie z KODU TS jako specyfikacji (bez wykonywania TS, bez generatora, bez Rust), porownuje z wektorami; dodatkowo wyciaga regexem z TS (po numerach linii pinu) literaly i stale (`42/47/54/58`, aliasy `:49`/`:56`, `2`, `1.35`, `minDist * 2`, `minDist * 6`, `maxMiast * 3`, `* 2`, `0.25`, `-0.01`, maska `0x9e3779b9`, trzy przesuniecia ziaren) i porownuje je z `data/derived/mapgen-cluster-rivals.json`. Dla slotow na prawdziwych mapach weryfikuje pozycje, `ownerId = firstOwnerId + idx`, flagi i unikalnosc nazw; **same nazwy miast** (P6.1D) nie sa re-implementowane w Pythonie - ich zgodnosc z webem pilnuje test Rust (960 slotow).
- Test negatywny kodu (`mutations.sh`, `mutations-r2.log`): 13 mutacji kodu/tabeli; **11 WYKRYTYCH** (testy FAILED: ceil->floor 7, `<=`->`<` w puli 6, odwrocona preferencja polplaszczyzny 5, margines -0,01->0,5 8, promien min 5->4 4, brak zajecia nazwy stolicy 2, brak deduplikacji `hexesAtDistance` 2, odwrocony filtr rywali 2, tasowanie `i+1`->`i` 2, prog 0,25->0 2, `seed % 6`->`% 5` 2) oraz **2 mutacje ROWNOWAZNE** (patrz §5.2): zmiana maski `0x9e3779b9` i pominiecie przesuniecia `0x85ebca6b` nie zmieniaja wyniku, bo ziarno lancucha hubow jest funkcjonalnie nieobserwowalne (web potwierdzony w generatorze: wynik identyczny dla 7 ziaren w 42 konfiguracjach, `seedIndependence`).
- Sprawdzenie brzegu na webie: `check-empty-land.mjs` -> `[]` (mapa bez ladu daje pusta liste kandydatow; `check-empty-land.out.txt`), odwzorowane w `rival_slots_degenerate_inputs_do_not_panic`.

## 2. Tabela było / jest

| plik web | było (P6-25 §4) | jest (P6.M09 r1) |
|---|---|---|
| `cluster-spawn.ts:71-165,194-208` (5 deklaracji) | BRAK (slot rywali i kandydaci rywali: `start_position.rs` przyjmowal gotowy plan; `groupForeignTypeClusters` tylko struktura wyniku `sp_group`) | **PORTOWANE 4 + DANE-JUZ-W-RUST 1**: `domain/mapgen/cluster_rivals.rs` (`build_same_type_rival_slots`, `build_same_type_rival_candidate_hexes`, `group_foreign_type_clusters`, `map_center_from_game_map`; `landHexesFromMap` = `start_position::land_hexes_from_terrain`) |
| `clusters.ts:38-58` (6 stalych) | BRAK | **PORTOWANE 6**: `data/derived/mapgen-cluster-rivals.json` + accessory w `cluster_rivals.rs` (aliasy `:49`, `:56` jako metody tego samego pola) |
| `clusters.ts:168-175,1346-1350,1538-1552,1770-2165` (13 deklaracji) | BRAK | **PORTOWANE 13** w `cluster_rivals.rs` |
| `data/derived.rs` | brak sekcji | dopisek NA KONCU pliku: `MapgenClusterRivalsFile` + parser + `mapgen_cluster_rivals()` (addytywny, konflikty rozwiaze orkiestrator) |
| testy | 595 | 617 (+22: `p6_m09_rivals` 19, `p6_m09_tables` 3); zero zmian istniejacych |

Lista zmian testow: **zadnego istniejacego testu nie zmieniono, nie usunieto, nie oslabiono.** Jedyny test czerwony po M09 to `p6_m00_skeleton::files_exist_and_are_empty_doc_only` (§0, §8) - czerwony z konstrukcji dla kazdego wypelnionego pliku szkieletu.

## 3. Symbole - status per deklaracja (24 wiersze)

Test = plik w `rust-port/engine/tests/`; wszystkie wektory = `p6_m09_vectors/web-vectors.json`.

| # | web | symbol | status | Rust | dowod |
|---|---|---|---|---|---|
| 1 | `cluster-spawn.ts:71` | `landHexesFromMap` | DANE-JUZ-W-RUST | `start_position::land_hexes_from_terrain` (P6.1C, `p6_1c_start_cluster.rs`) + adapter `land_hexes_from_game_map` | `map_helpers_match_web`: liczba i FNV listy ladu zgodne z webem dla 5 map (wyciete werbatim) |
| 2 | `cluster-spawn.ts:81` | `mapCenterFromGameMap` | PORTOWANY | `map_center_from_game_map` | `map_helpers_match_web` (bity f64, mapy 36x28, 24x18, 40x30) |
| 3 | `cluster-spawn.ts:91` | `buildSameTypeRivalSlots` | PORTOWANY | `build_same_type_rival_slots` | `rival_slots_match_web_on_real_maps` (960 przypadkow, nazwy z P6.1D) |
| 4 | `cluster-spawn.ts:140` | `buildSameTypeRivalCandidateHexes` | PORTOWANY | `build_same_type_rival_candidate_hexes` | `rival_candidate_hexes_match_web_on_real_maps` (420) |
| 5 | `cluster-spawn.ts:195` | `groupForeignTypeClusters` | PORTOWANY | `group_foreign_type_clusters` | `group_foreign_type_clusters_matches_web` (60) |
| 6 | `clusters.ts:42` | `CLUSTER_CITY_STATE_MIN_HEX` | PORTOWANY | tabela `promien_miasta_panstwa_min_hex`, `cluster_city_state_min_hex()` | `constants_match_web_and_aliases_are_not_separate_numbers` |
| 7 | `clusters.ts:47` | `CLUSTER_CITY_STATE_MAX_HEX` | PORTOWANY | tabela, `cluster_city_state_max_hex()` | j.w. |
| 8 | `clusters.ts:49` | `MIN_DIST_START_CITY_STATE` | PORTOWANY (alias :42) | `min_dist_start_city_state()` = `cluster_city_state_min_hex()` | j.w.; UWAGA: =5, to NIE `min_city_distance_start_city_state` (=3, `cities.ts:1122`); `start_city_state_distance_is_not_the_cities_ts_constant` |
| 9 | `clusters.ts:54` | `MIN_DIST_FOREIGN_FROM_PLAYER` | PORTOWANY | tabela `min_dystans_obce_od_gracza` | j.w. (nieuzywana w wycinku rywali; w zakresie linii :38-58) |
| 10 | `clusters.ts:56` | `MIN_DIST_FOREIGN_IN_CLUSTER` | PORTOWANY (alias :49) | `min_dist_foreign_in_cluster()` | j.w. |
| 11 | `clusters.ts:58` | `CLUSTER_GROWTH_RESERVE` | PORTOWANY | tabela `rezerwa_wzrostu_klastra` | j.w. + domyslna rezerwa w `aroundCapital` |
| 12 | `clusters.ts:168` | `shuffleInPlace` | PORTOWANY | `shuffle_in_place` | `shuffle_in_place_matches_web` (75, wyciete werbatim) |
| 13 | `clusters.ts:1347` | `clusterPackRadius` | PORTOWANY | `cluster_pack_radius` | `cluster_pack_radius_matches_web` (160) |
| 14 | `clusters.ts:1538` | `ForeignClusterBuffer` | PORTOWANY (typ) | `ForeignClusterBuffer` | uzywany w `foreign_buffer_gate_matches_web` i opcjach pakowania |
| 15 | `clusters.ts:1544` | `passesForeignClusterBufferGate` | PORTOWANY | `passes_foreign_cluster_buffer_gate` | `foreign_buffer_gate_matches_web` (160, radius calkowity i ulamkowy) |
| 16 | `clusters.ts:1771` | `landPoolNearCore` | PORTOWANY | `land_pool_near_core` | `land_pool_near_core_matches_web` (135, z/bez `maxRadius`, sciezka rozszerzania) |
| 17 | `clusters.ts:1848` | `hexesAtDistance` | PORTOWANY | `hexes_at_distance` | `hexes_at_distance_matches_web` (33; zachowanie "dysk, nie pierscien" - §5.1) |
| 18 | `clusters.ts:1870` | `SameTypeRivalHalfPlaneAxis` | PORTOWANY (typ) | `SameTypeRivalHalfPlaneAxis` | `half_plane_axis_matches_web_bitwise` |
| 19 | `clusters.ts:1879` | `computeSameTypeRivalHalfPlaneAxis` | PORTOWANY | `compute_same_type_rival_half_plane_axis` | j.w. (280, w tym galaz ziarna przy stolicy w centrum, bity) |
| 20 | `clusters.ts:1895` | `isInSameTypeRivalHalfPlane` | PORTOWANY | `is_in_same_type_rival_half_plane` | `is_in_half_plane_matches_web` (260, margines domyslny i jawny) |
| 21 | `clusters.ts:1911` | `packCityStatesHubChain` | PORTOWANY | `pack_city_states_hub_chain` | `hub_chain_matches_web` (300) + `hub_chain_result_does_not_depend_on_seed_as_in_web` (42) |
| 22 | `clusters.ts:1975` | `packNearestLegalLand` | PORTOWANY | `pack_nearest_legal_land` | `nearest_legal_land_matches_web` (210, wyciete werbatim) |
| 23 | `clusters.ts:2036` | `packCityStatesAroundCapital` | PORTOWANY | `pack_city_states_around_capital` | `pack_around_capital_matches_web` (360) |
| 24 | `clusters.ts:2144` | `packRivalCitiesAroundCore` | PORTOWANY | `pack_rival_cities_around_core` | `pack_rival_cities_matches_web` (180) |

Poza zakresem M09 (jawnie, bez portu): `mulberry32`, `HEX_DIRECTIONS`, `hexDistanceAxial` (`gen-helpers.ts`; w Rust `rng::Mulberry32` - `p6_1_rng_mulberry.rs`, `hex::HexCoord::neighbors`/`distance`; ich zgodnosc z webem jest dowodzona posrednio wszystkimi 3641 wektorami); typy `ClusterSpawnSlot`, `ForeignTypeClusterGroup` (P6.1C, `start_position.rs`); `poissonPickCities` (:1802-1846, w kolejnosci M10, bo uzywa `MIN_DIST_START_CITY_STATE`, ale nie jest w domknieciu rywali).

## 4. Dane vs kod - brak literalow danych/mnoznikow

- Balans w `data/derived/mapgen-cluster-rivals.json` (edytowalny; kazda wartosc z `zrodlo_web` plik:linia): `promien_miasta_panstwa_min_hex` 5, `promien_miasta_panstwa_max_hex` 5, `min_dystans_obce_od_gracza` 12, `rezerwa_wzrostu_klastra` 1, `pakowanie.{min_pierscieni 2, wspolczynnik_pierscieni 1,35, min_promien_w_odstepach 2, rozszerzenie_max_krokow_w_odstepach 6, pula_max_mnoznik 3, rozszerzony_promien_mnoznik 2}`, `polplaszczyzna.{margines -0,01, prog_dlugosci_kw 0,25}`. Parser: `data/derived.rs` (dopisek na koncu, `deny_unknown_fields`).
- Stale ALGORYTMICZNE (tozsamosc generatora, nie balans) jako nazwane `const` z odnosnikiem `plik:linia`: `HUB_CHAIN_SEED_XOR = 0x9e3779b9` (`clusters.ts:1927`), `RETRY_SEED_ADDS = [0x517cc1b7, 0x85ebca6b, 0xc2b2ae35]` (`clusters.ts:2076-2078`). Zadnych innych literalow w kodzie poza strukturalnymi: `Math.max(1, ...)` w `clusterPackRadius`, `i + 1` w tasowaniu, `(szerokosc - 1) / 2` srodka mapy, `idx + 1` numeru rywala, `0` jako rezerwa wzrostu rywali (`growthReserve: 0` w `packRivalCitiesAroundCore` i `buildSameTypeRivalCandidateHexes`), `% 6` = liczba kierunkow heksa (`dirs.len()`).
- Testy ksztaltu tabeli (`p6_m09_tables.rs`) NIE pinuja wartosci: parsowanie z `deny_unknown_fields` (nieznane pole na kazdym poziomie odrzucone), kazda wartosc ma `zrodlo_web` z `clusters.ts:`, wartosci o poprawnym ksztalcie (>= 1, skonczone). **Uwaga:** testy wektorowe (`p6_m09_rivals.rs`) sa testami PARYTETU z webem, wiec zmiana liczby balansu (np. 5 -> 4) celowo je lamie (mutacja "promien min hex 5->4" jest wykrywana, 4 testy) - to zamierzone; zmiana balansu wymaga swiadomego przegenerowania wektorow.

## 5. Zalozenia i zachowania weba odtworzone 1:1 (luki rozstrzygniete ZALOZENIEM)

1. **`hexesAtDistance` to dysk, nie pierscien.** Frontier po `dist` krokach deduplikowany tylko w obrebie kroku obejmuje takze hexy blizsze niz `dist` (graf heksagonalny ma cykle 3). Port odtwarza to (test + mutacja "bez dedupe" wykrywana); wynik `packCityStatesHubChain` jest poprawny, bo `validCandidate` filtruje `distance == ringDist`.
2. **Ziarno lancucha hubow jest nieobserwowalne w wyniku.** `shuffleInPlace(cands, rand)` poprzedza PELNE sortowanie `(q, r)` kandydatow, wiec `rand` (a tym samym maska `0x9e3779b9` i trzy ponowienia ziaren) nie wplywa na wynik; ponowienia w `packCityStatesAroundCapital` powtarzaja identyczne obliczenia. Port zachowuje wszystko 1:1 (te same wywolania `rand`), a rownowaznosc potwierdza web (`seedIndependence`, generator rzuca blad przy roznicy). Ziarno ma znaczenie tylko w `computeSameTypeRivalHalfPlaneAxis` (`seed % 6`, wykrywane).
3. **Domena ziarna `seed` = `u32` (0..2^32-1).** Web uzywa `>>> 0`, `^` i `% 6` na nieujemnych liczbach; ujemne ziarno w webie dawaloby `HEX_DIRECTIONS[-k]` (`undefined`, blad). Ziarna >= 2^32 / ulamkowe: NIE_ZMIERZONO (gra uzywa u32).
4. **Domena liczb:** `count`, `minDist`, `ringDist`, `maxRadius` calkowite (`i64`); `minDist <= 0` w `landPoolNearCore` ma w webie nieskonczona petle (`expanded += minDist`), port zachowuje semantyke (wejscie spoza domeny gry); NIE_ZMIERZONO.
5. **Os polplaszczyzny i srodek mapy to `f64`** (srodek mapy polowkowy); porownanie `vq * dq + vr * dr >= margin` w `f64` w tej samej kolejnosci dzialan (bez FMA), wektory porownywane bitowo.
6. **`landHexesFromMap` pomija wode, gory i teren polarny**, w przeciwienstwie do `ladowe` w `computeClusters` (:3439-3445), ktore NIE pomija polarnego (M10-M12; uwaga dla tamtych tematow).
7. **`isClusterCapital` nie jest ustawiane** w slotach rywali (klucz nieobecny w webie => `None`); test sprawdza klucz po stronie weba (`hasIsClusterCapital: false`).
8. **Kolejnosc kafli mapy ma znaczenie** tylko dla stabilnego sortowania remisow; wszystkie sortowania w wycinku maja pelny porzadek `(.., q, r)`, a `Vec::sort_by` i `Array.sort` sa stabilne; mapy w testach zachowuja kolejnosc `Object.values(map.hexes)` (wiersz po wierszu).
9. **`ownerId`**: `firstOwnerId + indeks` (web: `ownerId++`); `PlayerId` to `u64`.
10. **Nazwy miast**: `used_names` zaczyna od nazwy stolicy gracza (`player_start_city_name` z pustym zbiorem), potem kolejne `cluster_rival_city_name` (numer 1-based); P6.1D (`civ_names.rs`) jest uzyty bez zmian.

## 6. Bramki (surowe logi w runie, kazdy z `EXIT=`)

Srodowisko: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/<worktree> CARGO_PROFILE_DEV_DEBUG=0`, cargo w `rust-port/engine`; podkatalog usuniety po zakonczeniu; `Cargo.lock` nie commitowany.

| bramka | log | wynik |
|---|---|---|
| `cargo fmt -- --check` | `gate-fmt-r2.log` | `EXIT=0` |
| `cargo clippy --all-targets -- -D warnings` | `gate-clippy-r2.log` | `EXIT=0` |
| `cargo test --no-fail-fast` (kod bez zmian testow M00) | `gate-test-r2.log` | 616 passed, **1 failed** (`p6_m00_skeleton::files_exist_and_are_empty_doc_only`), `EXIT=101` |
| `cargo test --no-fail-fast` z patchem poluzenia `p6_m00_skeleton` (tymczasowo, przywrocone: `gate-restore-r2.log`) | `gate-test-patched-r2.log` | **617 passed, 0 failed, `EXIT=0`** |
| weryfikator Python | `verify-m09-r2.log` | 20560 sprawdzen, 0 rozbieznosci, `EXIT=0` |
| weryfikator Python - test negatywny | `verify-m09-negative-r2.log` | 2 rozbieznosci, `EXIT=1` (oczekiwane) |
| mutacje kodu/tabeli | `mutations-r2.log` | 11 wykrytych + 2 rownowazne (§5.2), pliki przywrocone (`src-ok json-ok`) |

Skrypty: `run-gates.sh`, `run-mutations-and-verify.sh`, `mutations.sh`.

## 7. Zmiany (allowlista)

- `rust-port/engine/src/domain/mapgen/cluster_rivals.rs` (wypelniony; naglowek `Temat wlasciciel:` zachowany),
- `rust-port/engine/tests/p6_m09_rivals.rs`, `rust-port/engine/tests/p6_m09_tables.rs`, `rust-port/engine/tests/p6_m09_vectors/web-vectors.json`,
- `rust-port/engine/data/derived/mapgen-cluster-rivals.json` (NOWY, `data/derived/*.json` z dispatchu), `rust-port/engine/src/data/derived.rs` (dopisek NA KONCU pliku - wyjatek jawnie dopuszczony w dispatchu),
- `dyspozycje/rust-port/p6/P6-M09-KLASTRY-RYWALE-MIN.md` (ten dokument), `dyspozycje/autobot/runs/R-RUSTPORT-P6-M09-KLASTRY-RYWALE-MIN-Q1/**` (generator, loader, weryfikator, skrypty, logi, patch).
- Zero zmian w `domain/mod.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, ani w istniejacych testach.

## 8. Ryzyka / do Evaluatora i orkiestratora

1. **`p6_m00_skeleton` (BLOKADA bramki, systemowa).** Test `files_exist_and_are_empty_doc_only` zaklada, ze pliki `mapgen/*.rs` pozostana puste do konca portu, co jest sprzeczne z przeznaczeniem szkieletu (tematy M01..M18 je wypelniaja). Plik testu jest poza allowlista M09. Proponowany patch (nie commitowany, **sprawdzony**: 617/0): `proposed-p6_m00_skeleton-relax.patch` - plik zawierajacy kod (`use`/`pub`) jest zwolniony z wymogu "same `//!`", ale nadal musi miec temat wlasciciela; drugi test szkieletu (`skeleton_headers_name_full_owner_ids_from_table`) przechodzi (naglowek zachowany). Wniosek dla orkiestratora: zastosowac patch raz przy integracji pierwszego wypelnionego tematu M*.
2. **Konflikty addytywne**: `data/derived.rs` (dopisek na koncu) - przy rownoleglych M* mozliwy konflikt w ostatnich liniach pliku; rozwiazanie: zachowac obie sekcje.
3. **Odczyt zrodel (liczby linii):** `cluster-spawn.ts` 516 linii (przeczytany w calosci), `clusters.ts` 4250 linii (przeczytany w calosci), `gen-helpers.ts` (przeczytane deklaracje :57-65, :125-140 uzywane przez wycinek; plik ma 12561 linii - nie czytany w calosci, poza zakresem M09). Uwaga: P6-25 §3 podaje 486 i 3958 (LOC niepuste), `wc -l` daje 516 i 4250; zakresy linii z dispatchu zgadzaja sie z pinem (kotwice w generatorze).
4. NIE_ZMIERZONO: ziarna poza `u32`, `minDist <= 0`, wspolrzedne poza `i32`, mapy inne niz 5 z P6.1C (pule syntetyczne pokrywaja sciezki, ale nie inne rozmiary map), zgodnosc nazw miast dla cywilizacji innych niz rzymianie/chinczycy/grecy.
5. Pelne zasilenie `build_cluster_start_plan` wynikiem Rust: M10 -> M11 -> M12 (poza M09).
