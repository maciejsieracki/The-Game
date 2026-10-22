# P6.M10 - klastry: masy ladu, bramki startu, rozmieszczenie srodkow i punktacja startu

Temat: `R-RUSTPORT-P6-M10-KLASTRY-MASY-BRAMKI-Q1` · DOMAIN: GAME · RUNDA 1/5 (Operator)
Baza: `origin/rust-port/parity-v2` (`50b49360`, silnik 745 testow). Pin web: `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do `mktemp -d` poza repo).
Zakres (dispatch): `clusters.ts`:59-126, `clusters.ts`:145-167, `clusters.ts`:176-1345, `startScoring.ts`:1-142. Zaleznosci: M00, M01, M09 (stale/typy). Wzorzec: `P6-M09-KLASTRY-RYWALE-MIN.md`, `P6-M14-TERYTORIUM-ZASIEG-CUDA.md`.

## 0. Status (uczciwie)

- **Wszystkie** deklaracje zakresu maja status (tabela §3): **PORTOWANY** (kod + test + wektor z uruchomionego weba, 0 rozbieznosci) dla logiki masy/bramek/wyboru/rozmieszczenia/punktacji; **PORTOWANY-Z-WSTRZYKNIETYMI** dla funkcji zalezacych od M11 (9 domkniec, §4); **NIE-DOTYCZY** dla importow (`:59-64`) i drobnych prywatnych pomocnikow startScoring zastapionych istniejacymi odpowiednikami (§3); **RUNDA-2 0**.
- Wektory z URUCHOMIONEGO weba: **14100 przypadkow** w 40 kategoriach (`tests/p6_m10_vectors/web-vectors.json`, 4,0 MB, SHA-256 `24af936e...`), 18 map (5 z prawdziwego `generateMap` + 12 syntetycznych 12x10..80x60 + `s_mirror` 41x21 symetryczna wzgledem srodka: dwa identyczne bloki ladu dajace remisy punktacji i odleglosci). 0 rozbieznosci Rust vs web (f64 bitowo, `to_bits`; liczniki wywolan `rand()` rowne).
- Niezalezny weryfikator Python: **16400 sprawdzen, 0 rozbieznosci** (`verify-m10-r1.log`, `EXIT=0`); test negatywny weryfikatora (3 zmutowane wartosci) => `rozbieznosci: 3`, `EXIT=1` (`verify-m10-negative-r1.log`).
- Testy: **39 nowych** (`p6_m10_masses` 16, `p6_m10_placement` 14, `p6_m10_start_scoring` 4, `p6_m10_v8sort` 2, `p6_m10_tables` 3). `cargo test --no-fail-fast`: **784 passed, 0 failed, `EXIT=0`** (`gate-test-r1.log`); 784 = 745 (baza) + 39. fmt i clippy `--all-targets -D warnings`: `EXIT=0`. Zero zmian istniejacych testow.
- Testy negatywne (mutacje kodu/tabel, `run-mutations.py`): **28 mutacji, 28 wykrytych** (25 w pelnym przebiegu `mutations-r1.log`; 3 pozostale - `timsort-invariant-ge`, `score-near-boundary`, `best-start-tie-le` - w `mutations-r1b.log` po dodaniu wektorow granicznych: biegi V8 o dlugosciach `a == b + c`, mapa symetryczna `s_mirror`; w pelnym przebiegu pierwsze zostalo wtedy zywe, dwa pozostale zakonczyly sie w pelnym przebiegu `BLAD-KOMPILACJI` z nieustalonej przyczyny - te same mutacje skompilowaly sie i zostaly wykryte w przebiegu poprzednim oraz w `r1b`; podejrzenie: kolizja z rownoleglymi buildami innych sesji na wspolnej maszynie). Pierwszy przebieg na wektorach v1 (`mutations-r0-wektory-v1.log`) ujawnil 3 zywe mutacje, ktore doprowadzily do dodania wektorow: `roster-empty-id-allowed` (roster z pustym kluczem), `timsort-invariant-ge`, `best-start-tie-le`. **3 mutacje ROWNOWAZNE** (analiza, §6a) nie sa w liscie. Pliki po kazdej mutacji przywracane, na koncu weryfikowane bajt w bajt (`pliki przywrocone: True`).
- **Kluczowe ryzyko zamkniete wektorami**: `pickCenterInMassSpread` (clusters.ts:971) uzywa komparatora, ktory WOLA `rand()`. Wynik zalezy od dokladnej sekwencji porownan sortowania V8 (TimSort). Port `js_array_sort_by` odtwarza V8 (scalanie, galopowanie, `minGallop = 7`) i jest dowodzony na 850 wektorach sortowania z uruchomionego Node v22.22.0 (porownanie KOLEJNOSCI, liczby wywolan komparatora i liczby wywolan `rand()`), a potem na rozmieszczeniu (`place`: 113 przypadkow, liczniki `rand()` rowne).

## 1. Metoda wektorow (ANTY-HALUCYNACJA)

- Generator `gen-m10-vectors.mjs` (w runie), uruchomienie (Node v22.22.0):
  `node --experimental-transform-types --no-warnings --import ./m10-loader-register.mjs ./gen-m10-vectors.mjs <WEB_ROOT> <OUT_JSON>` -> `OK {...}` (`gen-m10-r1.log`). Wynik deterministyczny (dwa przebiegi: ten sam SHA-256 `24af936e...`).
- **PRAWDZIWY kod weba, bez przepisywania logiki**: `clusters.ts` laduje sie jako kopia pliku z dopisanym `export ` przed 53 prywatnymi deklaracjami najwyzszego poziomu (`function`/`const`/`type`/`interface`). Generator WERYFIKUJE, ze po wycieciu wstawionych `export ` kopia jest bajt w bajt rowna oryginalowi (drift => blad). Kopia lezy obok oryginalu w scratch (`<WEB_ROOT>/gra/src/map/clusters.m10-exports.ts`, poza repo), wiec importy wzgledne (`./gen-helpers`, `../game/civ-entry-epoch`) dzialaja bez zmian. `startScoring.ts` to prawdziwy modul (importuje prawdziwe `clusters.ts`, `units/setup.ts`). Loader `m10-loader-hooks.mjs` tylko dopisuje `.ts`/`/index.ts` i traktuje `.json` jako modul.
- Mapy: 5 z PRAWDZIWEGO `generateMap` (`k42`, `k7`, `p123`, `k3small`, `w5` - te same specyfikacje co P6.1C/M09, odcisk FNV-1a64 `hexesFnv`; w wektorach teren + flaga rzeki + `buildSeaDistanceField`) oraz 12 syntetycznych z jawnym ziarnem (wiele mas, archipelagi, dziury, gory, polarny, plytkie morze, rzeki). Kolejnosc hexow = `Object.values(map.hexes)` (wiersz po wierszu), sprawdzana przez generator.
- `rand`: `mulberry32(ziarno)` z licznikiem wywolan po obu stronach; wektory zawieraja `randCalls`.
- f64 (ulamki, wyniki punktacji, srodki mapy) sa w wektorach TEKSTEM (`String(x)`, `Infinity`, `-Infinity`), testy porownuja `to_bits`.
- Kategorie i liczby przypadkow: `consts` 15, `rosterKluczeForStartEpoch` 252, `reorderRosterByPreference` 200, `mapSizeLabel` 126, `aktywneTypyFromSize` 5, `thresholds` 701, `massQualifies` 779, `allocate` 1710, `qualifyingIndices` 171, `isSpawnHabitable` 10, `groupMasses` 58, `massCache` 58, `regionDominance` 216, `localLand` 720, `localGate` 720, `devSpace` 900, `massSizeAt` 900, `playerMassGate` 900 (+3 mapy po wszystkich hexach), `hooks` 1221, `sortSpawn` 160, `sortSpread` 100, `pickTied` 120, `playerCands` 144, `pickPlayer` 144, `pickBestLocal` 200, `voronoi` 80, `centroid` 80, `pickCenterInMass` 160, `pickCenterGate` 160, `pickCenterSpread` 320, `pickCenterPool` 160, `balance` 90, `enforce` 90, `place` 113, `reveal` 4, `scoreStart` 1440 (+2 mapy po wszystkich hexach), `bestStart` 18, `v8sort` 850 (w tym 10 przypadkow `eqinv`: biegi o dlugosciach a == b + c).
- Pokrycie wymuszone asercjami w testach: niepuste wyniki (`> 40` w kazdej kategorii wyboru), >40 przypadkow `pickCenterInMassSpread` z losowym komparatorem (`rand()` wolane >1 raz), >100 duzych (n >= 128) losowych sortowan V8, `place`: >20 pelnych i >5 niepelnych rozmieszczen (sciezki awaryjne faz 2/5/5b), `balance` i `enforce` faktycznie przesuwaja srodki, `scoreStart`: >50 wynikow `-Infinity` i >300 skonczonych.
- Pokrycie faz `placeClusterCentersAcrossLandmasses` w 113 przypadkach `place` (licznik w weryfikatorze, `verify-m10-r1.log`): faza 1 postawiono 108 / brak postepu 36; faza 2 wejscie 50 (postawiono 64); faza 3 wejscie 57 (przesunieto 35); faza 4 wejscie 22 (przesunieto 1; `enforce` ma dodatkowo 90 wlasnych wektorow); faza 5 wejscie 54 (postawiono 41); faza 5b wejscie 50 (postawiono 75). Kazda faza jest wykonana i wynik zgadza sie z webem.
- **Niezalezny weryfikator** `verify-m10-vectors.py <WEB_ROOT> <VECTORS> <TABELA_MAS> <TABELA_STARTU>`: reimplementuje logike w Pythonie z KODU TS jako specyfikacji (bez wykonywania TS, bez generatora, bez Rust) razem z WLASNYM TimSortem V8 i WLASNYM `mulberry32`; porownuje z wektorami (16400 sprawdzen). Dodatkowo wyciaga regexem z TS (po numerach linii pinu) 40+ literalow i stalych (progi mas, frakcje, tolerancje, wagi, mnozniki straznikow, punktacje startu, ROSTER_KLUCZE, progi rozmiaru mapy) i porownuje z `data/derived/mapgen-cluster-mass.json` i `data/derived/start-scoring.json`. Hooki M11 (`seaDistAt`, `capitalSeaBandPenalty`, ...) ma wlasna implementacje w Pythonie i wlasne wektory (kategoria `hooks`, 1221).
- Testowa implementacja hookow w Rust (`tests/p6_m10_vectors/common.rs::WebHooks`) jest przepisana z TS i sprawdzona na tych samych wektorach (`hooks_match_web`), wiec blad hooka nie zaslania bledu M10.

## 2. Tabela bylo / jest

| plik web | bylo (P6-25 §4) | jest (P6.M10 r1) |
|---|---|---|
| `clusters.ts:59-126` (roster, typy) | BRAK | **PORTOWANE**: `domain/mapgen/cluster_mass.rs` (`roster_klucze`, `roster_klucze_for_start_epoch`, `reorder_roster_by_preference`, `ClusterCity`, `TypeCluster`, `ClusterSpawnCache`); lista rosteru w `data/derived/mapgen-cluster-mass.json` |
| `clusters.ts:145-167` (rozmiar mapy) | BRAK (progi tez w `params.rs` z M02) | **PORTOWANE**: `map_size_label`, `aktywne_typy_from_size`; progi w tabeli; test dowodzi rownosci z `params::map_size_label_from_dims` |
| `clusters.ts:176-583` (masy, bramki, przydzial typow) | BRAK | **PORTOWANE**: 13 stalych (tabela), `foreign_spawn_mass_threshold`, `mass_qualifies_for_foreign_spawn`, `MassLandCache`, `region_mass_dominance`, `local_land_fraction`, `passes_local_land_gate`, `development_space_score`, `mass_type_cap`, `allocate_typy_to_masses`, `qualifying_mass_indices_for_spawn`, `mass_size_at_hex`, `passes_player_start_mass_gate` |
| `clusters.ts:584-1345` (kandydaci, wybor, wyrownanie, rozmieszczenie) | BRAK | **PORTOWANE-Z-WSTRZYKNIETYMI**: `sort_spawn_*`, `pick_tied_*`, `pick_player_cluster_center`, `pick_best_local_land_spawn`, `assign_voronoi_regions`, `group_habitable_masses`, `mass_centroid`, `pick_center_*`, `balance_cluster_spread`, `enforce_quarter_spread_on_centers`, `place_cluster_centers_across_landmasses` + `js_array_sort_by` (TimSort V8) |
| `startScoring.ts:1-142` | BRAK (Rust `is_hex_in_start_reveal` przyjmuje promien jako parametr) | **PORTOWANE**: `start_reveal_radius`, `start_reveal_radius_for_difficulty`, `score_city_start_hex`, `find_best_player_start_hex`; punktacja w `data/derived/start-scoring.json` |
| `data/derived.rs` | brak sekcji | dopisek NA KONCU pliku: `MapgenClusterMassFile` + `StartScoringFile` + parsery + akcesory (addytywny) |
| testy | 745 | 784 (+39: `p6_m10_masses` 16, `p6_m10_placement` 14, `p6_m10_start_scoring` 4, `p6_m10_v8sort` 2, `p6_m10_tables` 3); zero zmian istniejacych |

Lista zmian testow: **zadnego istniejacego testu nie zmieniono, nie usunieto, nie oslabiono.** Kod: `cluster_mass.rs` z 3 linii szkieletu do pliku z logika (naglowek `Temat wlasciciel:` zachowany - `p6_m00_skeleton` zielony).

## 3. Symbole - status per deklaracja

Test = plik w `rust-port/engine/tests/`; wszystkie wektory = `p6_m10_vectors/web-vectors.json`. "Z-WSTRZYKNIETYMI" = zalezy od hookow M11 z §4.

| web | symbol | status | Rust | dowod |
|---|---|---|---|---|
| `clusters.ts:59-64` | importy (`GameMap`, `TerenBazowy`, `civ-entry-epoch`) | NIE-DOTYCZY | `GeneratedMap`, `Terrain`, `unit_epoch::civ_ids_available_at_game_epoch` (istnieja) | uzycie w `roster_klucze_for_start_epoch` |
| `:69` | `ROSTER_KLUCZE` | PORTOWANY (dane) | tabela `roster_klucze`, `roster_klucze()` | `constants_match_web`; weryfikator: regex po `:70-84` == tabela |
| `:88` | `rosterKluczeForStartEpoch` | PORTOWANY | `roster_klucze_for_start_epoch` | `roster_for_start_epoch_matches_web` (252) |
| `:102` | `ClusterCity` | PORTOWANY (typ) | `ClusterCity` | `types_have_web_shape` |
| `:109` | `TypeCluster` | PORTOWANY (typ) | `TypeCluster` (`growth_slot`: brak / `null` / hex) | `types_have_web_shape` |
| `:121` | `ClusterSpawnCache` | PORTOWANY (typ) | `ClusterSpawnCache` | `types_have_web_shape` |
| `:152` | `mapSizeLabel` | PORTOWANY | `map_size_label` (progi z tabeli M10; te same liczby co M02) | `map_size_label_matches_web_and_params_table` (126 + rownosc z `params`) |
| `:161` | `aktywneTypyFromSize` | PORTOWANY | `aktywne_typy_from_size` | j.w. (5) |
| `:192` | `reorderRosterByPreference` | PORTOWANY | `reorder_roster_by_preference` | `reorder_roster_by_preference_matches_web` (200) |
| `:212` | `MIN_MASS_HEXES_FOR_CENTER` | PORTOWANY | `min_mass_hexes_for_center()` | `constants_match_web` |
| `:217` | `MIN_MASS_HEXES_FOR_SPAWN` | PORTOWANY | `min_mass_hexes_for_spawn()` | j.w. |
| `:222` | `MIN_DEVELOPMENT_HEX_PER_CIV` | PORTOWANY | `min_development_hex_per_civ()` | j.w. |
| `:224` | `SMALL_MASS_CAP_THRESHOLD` | PORTOWANY (pochodna) | `small_mass_cap_threshold()` = mnoznik (tabela) * `:222` | j.w.; `alias_constants_are_not_separate_numbers` |
| `:226` | `DEVELOPMENT_SPACE_RADIUS` | PORTOWANY | `development_space_radius()` | j.w. |
| `:228` | `ISLAND_FALLBACK_MASS_FRAC` | PORTOWANY | `island_fallback_mass_frac()` | j.w. |
| `:233` | `FOREIGN_MASS_MIN_ABSOLUTE` | PORTOWANY | `foreign_mass_min_absolute()` | j.w. |
| `:235` | `FOREIGN_MASS_FRAC_OF_LARGEST` | PORTOWANY | `foreign_mass_frac_of_largest()` | j.w. |
| `:240` | `LOCAL_LAND_DOMINANCE_FRAC` | PORTOWANY | `local_land_dominance_frac()` | j.w. |
| `:242` | `REGION_MASS_DOMINANCE_FRAC` | PORTOWANY (alias `:240`) | `region_mass_dominance_frac()` = `local_land_dominance_frac()` | `alias_constants_are_not_separate_numbers` |
| `:244` | `LOCAL_LAND_DOMINANCE_RADIUS` | PORTOWANY | `local_land_dominance_radius()` | `constants_match_web` |
| `:246` | `PLAYER_START_MIN_MASS_HEXES` | PORTOWANY | `player_start_min_mass_hexes()` | j.w. |
| `:248` | `PLAYER_START_MASS_MIN_ABSOLUTE` | PORTOWANY | `player_start_mass_min_absolute()` | j.w. |
| `:250` | `qualifyingMassThreshold` (prywatna) | PORTOWANY | `qualifying_mass_threshold` | `thresholds_and_caps_match_web` (701) |
| `:258` | `foreignSpawnMassThreshold` | PORTOWANY | `foreign_spawn_mass_threshold` | j.w. |
| `:266` | `massQualifiesForForeignSpawn` | PORTOWANY | `mass_qualifies_for_foreign_spawn` | `mass_qualifies_and_indices_match_web` (779) |
| `:276` | `buildMassHexIndex` (prywatna) | PORTOWANY | `build_mass_hex_index` | `group_habitable_masses_and_cache_match_web` (FNV zawartosci indeksu, 55) |
| `:293` | `MassLandCache` | PORTOWANY (typ) | `MassLandCache` | j.w. |
| `:299` | `createMassLandCache` | PORTOWANY | `create_mass_land_cache` | j.w. |
| `:306` | `massLandCacheFromMasses` | PORTOWANY | `mass_land_cache_from_masses` | j.w. |
| `:316` | `MassesOrCache` | PORTOWANY (typ) | `enum MassesOrCache` | testy `devSpace`/`massSizeAt`/`playerMassGate` w obu formach |
| `:318` | `resolveMassLandCache` (prywatna) | PORTOWANY | `resolve_mass_land_cache` (`Cow`) | j.w. |
| `:324` | `massContainingHex` (prywatna) | PORTOWANY | `mass_containing_hex` | `massSizeAt`, `devSpace` |
| `:337` | `regionMassDominance` | PORTOWANY | `region_mass_dominance` | `region_mass_dominance_matches_web` (204; iteracja `Map` w kolejnosci wstawienia) |
| `:363` | `isSpawnHabitableTerrain` | PORTOWANY | `is_spawn_habitable_terrain` | `spawn_habitable_terrain_matches_web` (8 terenow gry; teksty spoza gry - NIE-DOTYCZY w Rust, teren to enum) |
| `:373` | `localLandFraction` | PORTOWANY | `local_land_fraction` | `local_land_fraction_and_gate_match_web` (680) |
| `:395` | `passesLocalLandGate` | PORTOWANY | `passes_local_land_gate` | j.w. (680) |
| `:409` | `developmentSpaceScore` | PORTOWANY | `development_space_score` | `development_space_and_mass_gates_match_web` (850) |
| `:436` | `massTypeCap` | PORTOWANY | `mass_type_cap` | `thresholds_and_caps_match_web` |
| `:448` | `allocateTypyToMasses` | PORTOWANY | `allocate_typy_to_masses` | `allocate_typy_to_masses_matches_web` (1710) |
| `:540` | `qualifyingMassIndicesForSpawn` | PORTOWANY | `qualifying_mass_indices_for_spawn` | `mass_qualifies_and_indices_match_web` (171) |
| `:552` | `massSizeAtHex` | PORTOWANY | `mass_size_at_hex` | `development_space_and_mass_gates_match_web` (850) |
| `:566` | `passesPlayerStartMassGate` | PORTOWANY | `passes_player_start_mass_gate` | j.w. (850) + `player_mass_gate_over_whole_maps_matches_web` (3 mapy po wszystkich hexach) |
| `:584` | `SpawnLandCandidate` | PORTOWANY (typ) | `SpawnLandCandidate` | uzywany w testach sortowan |
| `:591` | `sortSpawnLandCandidates` | PORTOWANY-Z-WSTRZYKNIETYMI (`capitalSeaBandPenalty`) | `sort_spawn_land_candidates` | `sort_spawn_land_candidates_matches_web` (160) |
| `:616` | `sortSpawnCandidatesWithSpreadBias` | PORTOWANY-Z-WSTRZYKNIETYMI (`countCentersPerQuadrant`, `preferredQuadrantsForSpread`, `landQuadrantIndex`, `capitalSeaBandPenalty`) | `sort_spawn_candidates_with_spread_bias` | `sort_spawn_candidates_with_spread_bias_matches_web` (100) |
| `:670` | `pickTiedSpawnLandCandidate` | PORTOWANY | `pick_tied_spawn_land_candidate` | `pick_tied_spawn_land_candidate_matches_web` (120, liczniki `rand()`) |
| `:685` | `playerStartCandidatesOnMasses` | PORTOWANY-Z-WSTRZYKNIETYMI (`seaDistAt`, `passesMinSeaDistGate`) | `player_start_candidates_on_masses` | `player_start_candidates_match_web` (136, FNV listy) |
| `:717` | `pickPlayerClusterCenter` | PORTOWANY-Z-WSTRZYKNIETYMI | `pick_player_cluster_center` | `pick_player_cluster_center_matches_web` (136) |
| `:748` | `pickBestLocalLandSpawn` | PORTOWANY-Z-WSTRZYKNIETYMI | `pick_best_local_land_spawn` | `pick_best_local_land_spawn_matches_web` (200) |
| `:787` | `assignVoronoiRegions` | PORTOWANY | `assign_voronoi_regions` (`None` = web rzuca `TypeError`) | `voronoi_and_centroid_match_web` (80) |
| `:811` | `groupHabitableMasses` | PORTOWANY | `group_habitable_masses` | `group_habitable_masses_and_cache_match_web` (55, kolejnosc hexow w masach) |
| `:841` | `massCentroid` | PORTOWANY | `mass_centroid` | `voronoi_and_centroid_match_web` (80, bity) |
| `:849` | `pickCenterInMass` | PORTOWANY | `pick_center_in_mass` | `pick_center_in_mass_matches_web` (160) |
| `:869` | `pickCenterInMassWithLandGate` | PORTOWANY-Z-WSTRZYKNIETYMI | `pick_center_in_mass_with_land_gate` | `pick_center_in_mass_with_land_gate_matches_web` (160) |
| `:916` | `pickCenterInMassSpread` | PORTOWANY-Z-WSTRZYKNIETYMI + TimSort V8 | `pick_center_in_mass_spread` | `pick_center_in_mass_spread_matches_web` (320) |
| `:989` | `pickCenterOnLandPoolSpread` | PORTOWANY-Z-WSTRZYKNIETYMI | `pick_center_on_land_pool_spread` | `pick_center_on_land_pool_spread_matches_web` (160) |
| `:1009` | `balanceClusterSpread` | PORTOWANY-Z-WSTRZYKNIETYMI | `balance_cluster_spread` | `balance_and_enforce_match_web` (90) |
| `:1087` | `enforceQuarterSpreadOnCenters` | PORTOWANY-Z-WSTRZYKNIETYMI | `enforce_quarter_spread_on_centers` | j.w. (90) |
| `:1146` | `placeClusterCentersAcrossLandmasses` | PORTOWANY-Z-WSTRZYKNIETYMI | `place_cluster_centers_across_landmasses` | `place_cluster_centers_across_landmasses_matches_web` (113) |
| `startScoring.ts:8-11` | importy | NIE-DOTYCZY | `GeneratedMap`, `Terrain`, `cluster_mass::*` | - |
| `:14` | `START_REVEAL_RADIUS` | PORTOWANY | `start_reveal_radius()` (tabela `start-scoring.json`) | `reveal_radius_matches_web` |
| `:17` | `startRevealRadiusForDifficulty` | PORTOWANY | `start_reveal_radius_for_difficulty(StartDifficulty)` | j.w. (4) |
| `:25` | `NEIGHBORS` (prywatna) | NIE-DOTYCZY | `HexCoord::neighbors` (ten sam zbior 6 kierunkow; porzadek nieistotny - tylko "czy ktorykolwiek sasiad ma rzeke") | `score_city_start_hex_matches_web` |
| `:29,:33,:37,:41` | `hexAt`, `hasRiver`, `isArable`, `canFoundOnTerrain` (prywatne) | PORTOWANY | `hex_tile`, `has_river`, `is_arable`, `can_found_on_terrain` | `score_city_start_hex_matches_web` (1360 + 2 mapy po wszystkich hexach) |
| `:51` | `scoreCityStartHex` | PORTOWANY | `score_city_start_hex` | j.w. |
| `:102` | `findBestPlayerStartHex` | PORTOWANY | `find_best_player_start_hex` | `find_best_player_start_hex_matches_web` (18 map) |

Poza zakresem M10 (jawnie, bez portu): `ClusterPlacement` (`:128`, M12), `shuffleInPlace` (`:168`, M09), `clusterPackRadius` (`:1347`, M09), cala logika `clusters.ts:1346-3361` oprocz tego co M09 (M11/M12). `ClusterSpreadOpts` (`:1586`, typ M11) i bbox ladu sa w M10 zdefiniowane lokalnie (`ClusterSpreadOpts`, `LandBBox`) jako minimum potrzebne do sygnatur - M11 moze je zastapic aliasem.

Wywolujacy poza zakresem (grep po pinie): `pickPlayerClusterCenter` `:2486,:2562,:3667`, `placeClusterCentersAcrossLandmasses` `:3481`, `allocateTypyToMasses` `:2417`, `pickCenterInMassSpread` `:2493,:2644`, `pickBestLocalLandSpawn` `:2488,:2638`, `sortSpawnLandCandidates` `:1763`, `sortSpawnCandidatesWithSpreadBias` `:1759`, `assignVoronoiRegions` `:2506,:2565,:2575,:3529,:3617`, `passesPlayerStartMassGate` `:1728,:2478,:2561,:3713`, `passesLocalLandGate` `:1727,:2214,:2479,:2514,:2560,:2632`, `developmentSpaceScore` `:1746`, `localLandFraction` `:1745`, `createMassLandCache` `:3470`, `mapSizeLabel` `:3415`, `aktywneTypyFromSize` `:3416`, `rosterKluczeForStartEpoch` `:3417`, `reorderRosterByPreference` `:3553-3554`. To sa miejsca dla M11 (`:1727-1763`, `:2214-2644`) i M12 (`:3389-3713`).

## 4. Domkniecia wstrzykniete (PORTOWANY-Z-WSTRZYKNIETYMI)

M10 nie moze zalezec od kodu M11 (rownolegle allowlisty), a `clusters.ts:1351-1769` jest poza zakresem. Funkcje zalezne dostaja cechy `ClusterLayoutHooks` (9 metod); po porcie M11 wystarczy `impl ClusterLayoutHooks` na jego funkcjach, bez zmian w `cluster_mass.rs`:

| metoda cechy | web | uzywana przez |
|---|---|---|
| `sea_dist_at` | `seaDistAt` `:1420` | `player_start_candidates_on_masses`, `pick_*`, `place` (faza 5b) |
| `passes_min_sea_dist_gate` | `passesMinSeaDistGate` `:1428` | j.w., `balance_cluster_spread` |
| `capital_sea_band_penalty` | `capitalSeaBandPenalty` `:1452` | `sort_spawn_land_candidates`, `sort_spawn_candidates_with_spread_bias` |
| `land_quadrant_index` | `landQuadrantIndex` `:1555` | `pick_center_in_mass_spread`, `enforce_*`, `sort_spawn_candidates_with_spread_bias` |
| `count_centers_per_quadrant` | `countCentersPerQuadrant` `:1566` (prywatna) | j.w. |
| `preferred_quadrants_for_spread` | `preferredQuadrantsForSpread` `:1589` (prywatna) | `pick_center_in_mass_spread`, `sort_spawn_candidates_with_spread_bias` |
| `minimum_spread_quarters_required` | `minimumSpreadQuartersRequired` `:1579` | `enforce_quarter_spread_on_centers` |
| `cluster_center_quadrant_spread` | `clusterCenterQuadrantSpread` `:1603` | `balance_cluster_spread`, `enforce_*` |
| `min_capital_separation_distance` | `minCapitalSeparationDistance` `:1643` | `balance_cluster_spread` |

W testach implementacja cechy to `WebHooks` (`tests/p6_m10_vectors/common.rs`), sprawdzona na 1221 wektorach kategorii `hooks` (zgodnie z `clusters.ts:1420-1654`). `seaDist` (`buildSeaDistanceField`, `gen-helpers.ts`, poza zakresem) jest WEJSCIEM (`SeaDist = HashMap<(q,r), f64>`); w wektorach jest zapisany z weba.

## 5. Dane vs kod - brak literalow danych/mnoznikow

- Balans w `data/derived/mapgen-cluster-mass.json` (edytowalny; kazda wartosc z `zrodlo_web` plik:linia): roster, progi rozmiaru mapy i liczba aktywnych typow, progi mas (12/60/90/mnoznik 2/promien 6/0,25/90/0,09), bramki startu gracza (0,70/promien 3/25/30/0,08), tolerancje i wagi wyboru hexu (1/0,001/1/0,05/0,01/999/4/1/1/5), parametry rozmieszczenia (0,75/2/1,25/10/3/1/2/6/2/2/6/12/16/1). Punktacja startu i promienie oswietlenia: `data/derived/start-scoring.json`. Parser: `data/derived.rs` (dopisek na koncu, `deny_unknown_fields`).
- Stale ALGORYTMICZNE (tozsamosc algorytmu sortowania V8, nie balans): `MIN_GALLOP_WINS = 7` i `MIN_RUN_THRESHOLD = 64` w `cluster_mass.rs` (odnosniki do `third_party/v8/builtins/array-sort.tq`). Poza tym w kodzie tylko literaly strukturalne: `0`, `1`, `2` (polowa bbox `/ 2.0`, indeksy, krok petli), liczba cwiartek `4` (typ `[usize; 4]`).
- Testy ksztaltu tabel (`p6_m10_tables.rs`) NIE pinuja wartosci: parsowanie z `deny_unknown_fields` (nieznane pole na kazdym poziomie odrzucone), kazda wartosc ma `zrodlo_web` z plikiem i numerem linii, wartosci o poprawnym ksztalcie (ulamki w `[0,1]`, dzielniki >= 1, progi rosnace, etykiety znane). **Uwaga:** testy wektorowe (`p6_m10_*`) to testy PARYTETU z webem, wiec zmiana liczby balansu celowo je lamie (mutacje tabeli sa wykrywane) - zmiana balansu wymaga swiadomego przegenerowania wektorow.

## 6. Zalozenia i zachowania weba odtworzone 1:1 (luki rozstrzygniete ZALOZENIEM)

1. **Komparator z `rand()`.** `pickCenterInMassSpread` sortuje `(rand() * 2 - 1) || a.q - b.q`. Port odtwarza V8 TimSort (`js_array_sort_by`): kolejnosc argumentow komparatora, wyszukiwanie biegow, wstawianie binarne, scalanie z galopowaniem. Dowod: 850 wektorow (n do 2000, komparatory `num`/`randSign`/`randTern`/`numNaN`) + liczba wywolan komparatora i `rand()` rowna sie z Node v22.22.0. Inne wersje V8: NIE_ZMIERZONO (algorytm w V8 jest stabilny od 7.0).
2. **`rand`** to `&mut dyn FnMut() -> f64` (strumien `mulberry32`); opcjonalny `rand?` to `Option`. Zuzycie strumienia jest czescia kontraktu (testy porownuja `randCalls`).
3. **Mapa**: `GeneratedMap` (wiersz po wierszu) jak w M09; `rzeka.obecna` = `HexTile::river`. Hexy poza mapa (`q`/`r` ujemne lub >= rozmiar) to `undefined` w webie => `None`.
4. **Liczby**: wspolrzedne `i32`; `minDist`, `margin`, `minSeaDist`, odleglosci od morza i srodek mapy to `f64` (JS `number`); `nNeeded` `i64`; `dev` (przestrzen rozwoju) liczba calkowita przechowywana jako `f64` w kandydacie (arytmetyka `dev - 1`).
5. **JS `||`**: `a || b` zwraca `b` dla `0`, `-0`, `NaN` (`or0`); `NaN` z komparatora liczy sie jako `0` (V8).
6. **`Math.round`** w `findBestPlayerStartHex` dla `x >= 0`: `floor(x + 0.5)` (rozmiary map >= 1).
7. **`console.warn`** (`allocateTypyToMasses`, `placeClusterCentersAcrossLandmasses`) nie ma efektu na wynik - nie portowane.
8. **`assignVoronoiRegions`** bez srodkow przy niepustym ladzie: web rzuca `TypeError` (`regiony[0]!.push`); port zwraca `None`.
9. **`placeClusterCentersAcrossLandmasses`**: `centers.slice(0, nNeeded)` dla ujemnego `nNeeded` obcina elementy od konca (odtworzone, test `place` ma `nNeeded` -2 i -1). `landBBox` pustego `ladowe` = `Infinity`/`-Infinity` (`LandBBox::from_hexes`).
10. **`pickCenterInMassSpread`** przyjmuje `landCache`, ale go nie czyta (web `:921`); port zachowuje parametr (`_land_cache`).
11. **`ladowe`** w rozmieszczeniu = hexy bez morza, gor i plytkiego morza (wlacznie z polarnym - tak buduje je `computeClusters` `:3439-3445`); `startScoring` uzywa INNEJ puli (`canFoundOnTerrain`: bez wody, gor i polarnego).
12. **`pickTiedSpawnLandCandidate`** nie woła `rand()` dla jednego kandydata (zachowane); `pickCenterInMass*` woła `rand()` w mapie kandydatow PRZED sortowaniem (kolejnosc zachowana).
13. **Kolejnosc kafli mapy** ma znaczenie dla `findBestPlayerStartHex` (stabilne sortowanie "najpierw najwieksza masa") i pul `ladowe`.

## 6a. Mutacje rownowazne (nie do wykrycia testem - uzasadnienie)

1. `player-gate-ge-to-gt` (`mass_size >= scaled_min` -> `>`): `scaled_min >= PLAYER_START_MASS_MIN_ABSOLUTE` (30) > `PLAYER_START_MIN_MASS_HEXES` (25), wiec dla `mass_size == scaled_min` druga galaz `mass_size >= 25` i tak zwraca `true`. Wynik funkcji identyczny dla kazdego wejscia przy wartosciach z tabeli.
2. `enforce-drop-moving-to-empty` (usuniecie `|| moving_to_empty`): relokowany srodek pochodzi z cwiartki o obciazeniu >= 2 (`maxQuadLoad <= 1` => `break`), wiec po jego usunieciu jego cwiartka pozostaje zajeta, a przeniesienie do pustej cwiartki ZAWSZE zwieksza liczbe zajetych cwiartek - warunek `> spread` juz go obejmuje.
3. `table-sentinel-10` (sentinel `999` -> `10`): uzywany tylko gdy nie ma jeszcze zadnego srodka; wtedy `minExist` jest rowne dla wszystkich kandydatow, wiec nie wplywa na porzadek ani na pasmo wyboru.

## 7. Bramki (surowe logi w runie, kazdy z `EXIT=`)

Srodowisko: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/<worktree> CARGO_PROFILE_DEV_DEBUG=0`, cargo w `rust-port/engine`; podkatalog usuniety po zakonczeniu; `Cargo.lock` nie commitowany.

| bramka | log | wynik |
|---|---|---|
| `cargo fmt -- --check` | `gate-fmt-r1.log` | `EXIT=0` |
| `cargo clippy --all-targets -- -D warnings` | `gate-clippy-r1.log` | `EXIT=0` |
| `cargo test --no-fail-fast` | `gate-test-r1.log` | **784 passed, 0 failed**, `EXIT=0` |
| generator wektorow | `gen-m10-r1.log` | `EXIT=0`, SHA-256 wektorow powtarzalny |
| weryfikator Python | `verify-m10-r1.log` | 16400 sprawdzen, 0 rozbieznosci, `EXIT=0` |
| weryfikator - test negatywny | `verify-m10-negative-r1.log` | 3 rozbieznosci, `EXIT=1` (oczekiwane) |
| mutacje kodu/tabel | `mutations-r1.log` (25 w pelnym przebiegu) + `mutations-r1b.log` (3) | 28/28 wykrytych, pliki przywrocone |

Skrypty: `gen-m10-vectors.mjs` (+ `m10-loader-register.mjs`, `m10-loader-hooks.mjs`), `verify-m10-vectors.py`, `mutate-vectors.py`, `run-mutations.py`.

## 8. Zmiany (allowlista)

- `rust-port/engine/src/domain/mapgen/cluster_mass.rs` (wypelniony; naglowek `Temat wlasciciel:` zachowany),
- `rust-port/engine/tests/p6_m10_masses.rs`, `p6_m10_placement.rs`, `p6_m10_start_scoring.rs`, `p6_m10_v8sort.rs`, `p6_m10_tables.rs`, `rust-port/engine/tests/p6_m10_vectors/web-vectors.json`, `rust-port/engine/tests/p6_m10_vectors/common.rs`,
- `rust-port/engine/data/derived/mapgen-cluster-mass.json`, `rust-port/engine/data/derived/start-scoring.json` (NOWE, `data/derived/*.json` z dispatchu), `rust-port/engine/src/data/derived.rs` (dopisek NA KONCU pliku - wyjatek jawnie dopuszczony w dispatchu),
- `dyspozycje/rust-port/p6/P6-M10-KLASTRY-MASY-BRAMKI.md` (ten dokument), `dyspozycje/autobot/runs/R-RUSTPORT-P6-M10-KLASTRY-MASY-BRAMKI-Q1/**` (generator, loader, weryfikator, skrypty, logi, raport).
- Zero zmian w `domain/mod.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `tests/p6_m00_skeleton.rs`, ani w istniejacych testach.

## 9. Ryzyka / do Evaluatora i orkiestratora

1. **Konflikty addytywne**: `data/derived.rs` (dopisek na koncu) - przy rownoleglych M15/M16/M17/P4.30/P6.5B mozliwy konflikt w ostatnich liniach; rozwiazanie: zachowac obie sekcje.
2. **Odczyt zrodel (liczby linii):** `startScoring.ts` 142 linie (przeczytany w calosci), `clusters.ts` 4250 linii: przeczytane **1-1675 w calosci** (zakres M10 `59-126, 145-167, 176-1345` + `1346-1675` jako domkniecie M11 dla hookow), linie `1676-4250` (M09/M11/M12) NIE czytane w calosci - uzycia symboli M10 tam znaleziono `grep -nw` (§3). Uwaga: P6-25 §3 podaje 3958 (LOC niepuste), `wc -l` daje 4250.
3. **Podwojne definicje typow**: `ClusterSpreadOpts`/`LandBBox` (M10) vs M11 - do zlaczenia aliasem przy integracji M11.
4. **Wspolny TimSort**: `js_array_sort_by` jest `pub` i powinien byc uzywany w M11/M12 wszedzie tam, gdzie web sortuje komparatorem z `rand()` albo niespojnym porzadkiem (inaczej kolejnosc remisow moze sie rozjechac).
5. **Niezalezny weryfikator ma wlasna kopie TimSortu napisana z tego samego opisu algorytmu** co port Rust - niezaleznosc dotyczy kodu, nie zrodla wiedzy; arbitrem sa wektory z Node (850 + rozmieszczenie).
6. NIE_ZMIERZONO: mapy wieksze niz 80x60 i inne typy swiata niz 5 z `generateMap`; wersje V8 inne niz Node v22.22.0; `NaN`/`Infinity` jako `minDist`/`margin`; `nNeeded` > 10; `ladowe` z duplikatami w `placeClusterCentersAcrossLandmasses`; wspolrzedne poza `i32`; teksty terenu spoza 8 wartosci gry.
7. Pelne zasilenie `build_cluster_start_plan` wynikiem Rust: M11 -> M12 (poza M10).
