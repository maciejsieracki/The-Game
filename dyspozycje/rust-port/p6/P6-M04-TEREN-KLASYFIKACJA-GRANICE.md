# P6.M04 - klasyfikacja terenu i granice mapy (port `gen-helpers.ts`:233-236 i :825-1407 do Rust)

Temat: `R-RUSTPORT-P6-M04-TEREN-KLASYFIKACJA-GRANICE-Q1` · DOMAIN: GAME · RUNDA 1/5 (Operator)
Baza: `origin/rust-port/parity-v2` @ `95b91471` (silnik: 865 testow). Pin web: `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do `mktemp -d` poza repo).
Zakres (dispatch): `gen-helpers.ts`:233-236, `gen-helpers.ts`:825-1407. Zaleznosci: M01, M02 (obie na bazie: `prims.rs`, `params.rs`). Wzorce: `P6-5B-JEDNOSTKI-ZYCIE-B.md`, `P6-M10-KLASTRY-MASY-BRAMKI.md`, `P6-M14-TERYTORIUM-ZASIEG-CUDA.md`.
Artefakty runu: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M04-TEREN-KLASYFIKACJA-GRANICE-Q1/`.

## 0. Status (uczciwie)

- **Wszystkie** deklaracje zakresu maja status (tabela §3): **PORTOWANY** (kod + test + wektor z uruchomionego weba, 0 rozbieznosci) dla logiki klasyfikacji, hasza komorek, relifu po dopasowaniu, granicy mapy i fade'ow; **PORTOWANY-Z-WSTRZYKNIETYMI** dla `reapplyForestOverlay` (8 domkniec) i `applyMarginalLandZoneCaps` (1 domkniecie, §4); **DANE-JUZ-W-RUST** dla `ReliefDensityTier`; **NIE-DOTYCZY** dla komentarzy i martwego pola `forest` (§3); **RUNDA-2: 0**.
- Wektory z URUCHOMIONEGO weba (`tests/p6_m04_vectors/web-vectors.json`, 9,1 MB, SHA-256 `c4a09a0367c9eb20cd28ba1c4202aa876b482dd9a48870025098724d6d24e97d`, powtarzalny: dwa przebiegi generatora daja ten sam skrot): 44187 przypadkow w 19 kategoriach; f64 porownywane **bitowo** (`to_bits`; wszystkie `NaN` sprowadzone do jednego, bo w JS jest jeden `NaN` bez obserwowalnego ladunku).
- Niezalezny weryfikator Python (`verify-m04-vectors.py`, `python3 -I`, bez Node/TS/Rust): **157597 sprawdzen, 0 rozbieznosci** (`verify-m04-r1.log`, `EXIT=0`); test negatywny (6 zmienionych wartosci) => 6 rozbieznosci, `EXIT=1` (`verify-m04-negative-r1.log`).
- Testy: **25 nowych** (`p6_m04_classify` 7, `p6_m04_reapply` 3, `p6_m04_border` 11, `p6_m04_tables` 4). `cargo test --no-fail-fast`: **890 passed, 0 failed, `EXIT=0`** (`gate-test-r1.log`); 890 = 865 (baza) + 25. fmt i clippy `--all-targets -D warnings`: `EXIT=0`. Zero zmian istniejacych testow.
- Mutacje (`run-mutations.py`, wlasny `CARGO_TARGET_DIR`): **77/77 wykrytych** (pelny przebieg `mutations-r1.log`: 76/77 wykrytych; jedyna `BLAD-KOMPILACJI` to `scatter-mask` z przyczyna INFRA `No space left on device` na wspoldzielonym dysku, NIE blad mutacji; powtorzona osobno w `mutations-r1b.log`: wykryta, `EXIT=0`), 3 mutacje rownowazne wylaczone jawnie (§6a), pliki po kazdej mutacji przywracane i weryfikowane bajt w bajt (`mutations-r1.log`). Pierwszy przebieg (`mutations-r1-pass1.log`, 80 mutacji) wykryl 74; 6 przezylo i dalo trzy poprawki: (a) 2 nowe zestawy wektorow (wartosci SASIEDNIE WOKOL progow `classifyTerrain`/`Flat` oraz mapy lasu z RZADKIM i GESTYM terenem kwalifikujacym sie - `classify-plains-gt-to-ge`, `forest-pangea-min`, `table-min-sufitu`), (b) 3 mutacje uznane za ROWNOWAZNE (§6a) i wylaczone z listy jawnie, (c) mutacja `table-min-sufitu` (2->3) byla rownowazna, wiec zastapiona wartoscia 100, ktora zmienia wynik.
- **Odkrycie (poza allowlista, do orkiestratora):** STARY `map_generator::hash_int3` (`src/domain/map_generator.rs:909-914`, `u32::wrapping_mul`) NIE jest zgodny z webem dla pelnego zakresu ziaren `u32`: web mnozy w `f64` (iloczyn > 2^53 traci mlodsze bity przed `ToInt32`). Pomiar `legacy-hash-divergence.log`: ziarno <= 4 000 000 => 0/200000 rozbieznosci, **ziarno z calego u32 => 198908/200000 (99,5%)**. Nowa `terrain_class::hash_int3` jest zgodna z webem bitowo (4076 wektorow). Starego kodu NIE ruszano; konsumenci (`generate_map`) powinni przejsc na `terrain_class` (§10).

## 1. Metoda wektorow (ANTY-HALUCYNACJA)

- Generator `gen-m04-vectors.mjs` (w runie), uruchomienie (Node v22.22.0):
  `node --experimental-transform-types --no-warnings --import ./m04-loader-register.mjs ./gen-m04-vectors.mjs <WEB_ROOT> <OUT_JSON>` -> `OK {...}` (`gen-m04-r1.log`, `EXIT=0`).
- **PRAWDZIWY kod weba, bez przepisywania logiki**: `gen-helpers.ts` (12 561 linii) laduje sie jako kopia pliku z dopisanym NA KONCU jednym wierszem `export { ...20 prywatnych deklaracji... };`. Generator sprawdza, ze kopia bez dopisku jest bajt w bajt rowna oryginalowi (SHA-256 oryginalu zapisany w wektorach i sprawdzany przez weryfikator). Kopia lezy obok oryginalu w scratch (poza repo), wiec importy wzgledne (`./newGameMapDefaults`, `./earth-land-mask`, `../types/hex`) dzialaja bez zmian. Loader `m04-loader-hooks.mjs` tylko dopisuje `.ts` / `/index.ts` i traktuje `.json` jako modul - **ZERO stubow logiki** (caly graf importow ladowal sie bez wycinania).
- Deterministyczne wejscia: `mulberry32(20261023)` z weba; mapy z `fbm`/`buildPermTable` weba (ksztalt lad/morze), plus mapy syntetyczne (rzadki i gesty teren pod las, losowa kolejnosc wstawiania heksow, remisy przez kwantyzacje szumu).
- **Kategorie i liczby przypadkow** (`gen-m04-r1.log`): `latBuffer` 10252, `hashInt3` 4076, `cellBias` 5012, `jitter` 3000, `elevGates` 514, `classify` 6219, `classifyFlat` 6219 (w tym 219 wartosci SASIEDNICH wokol progow), `reapplyLand` 45 map, `reapplyForest` 64 mapy, `forestEligible` 8, `erosionSort` 42, `marginZone` 42, `setHex` 48, `marginCap` 77, `fades` 4512 (7 funkcji na wiersz), `inBorderBuf` 1500, `borderGrid` 56 map (liczniki, `findLandInMapBorder`, `enforceMapBorderOcean`, `keysAtBorderDistance` d=0..12 i 0,5, `countLandNeighborsInSet` i `isReliefCandidateHex` po wszystkich heksach), `scatter` 2500, `consts` 1.
- **Pokrycie wymuszone asercjami w testach**: kazdy teren wynikowy `classifyTerrain` >= 100 razy (Morze, Laka, Rownina, Pustynia, Wzgorza, Gory), `classifyTerrainFlat` nigdy Morze/Gory/Wzgorza; wszystkie trzy wiersze `reliefElevGates`; `reapplyLand`: >= 25 map z reliefem po przebiegu, wszystkie 3 tiery >= 10 razy, `mapHeight` = brak/0/>0; `reapplyForest`: wszystkie 4 typy swiata i 3 tiery, `continentOf` brak/obecny, `mapHeight` brak/0/>0, >500 heksow lasu lacznie, liczba heksow `Las` po wywolaniu == `assigned`, teren nietkniety; `applyMarginalLandZoneCaps`: obie galezie (lad->morze i morze->lad) w >= 15 mapach, >1000 zmian; `erosionSort`: >= 20 zbiorow > 20 kluczy; `fades`: fade = 0, = 1 i posredni po >200 razy.
- **Niezalezny weryfikator** `verify-m04-vectors.py <WEB_ROOT> <WEKTORY> <TABELA>`: reimplementuje CALA logike w Pythonie z KODU TS jako specyfikacji, razem z WLASNYM TimSortem V8 (skopiowany z `verify-m10-vectors.py`, bo komparatory marginesu brzegu i erozji sa NIEprzechodnie) i WLASNYM `ToInt32`/`Math.round` (przez `Fraction`)/`Math.min`/`Math.max` (NaN, -0). Dodatkowo: (a) wyciaga regexem z TS (po numerach linii pinu) KAZDA z 51 wartosci tabeli i porownuje z `data/derived/mapgen-terrain-class.json` (zbior sprawdzonych == zbior lisci tabeli, `51/51`), (b) sprawdza kotwice tekstowe stalych algorytmicznych (hasze, maska `0xffff`, struktura wyrazen) w liniach zrodla, (c) **liczy NIEZALEZNIE zaleznosci lasu** (odleglosc od morza BFS, partycje `groupLandMassKeys`/Voronoi, komorki pokrycia) i porownuje je z wartosciami zapisanymi z weba, (d) sprawdza SHA-256 i liczbe linii `gen-helpers.ts` z pinu (12 561).
- Hook testowy `ErosionHook` (`tests/p6_m04_border.rs`) = `sortLandKeysForErosion` (poza zakresem, `gen-helpers.ts`:3207) przepisany z TS i sprawdzony BEZPOSREDNIO na 42 wektorach `erosionSort` (`erosion_hook_matches_web`), wiec blad hooka nie zaslania bledu M04. Zaleznosci lasu sa ODTWARZANE z wartosci policzonych przez prawdziwy kod weba i kazda metoda sprawdza argumenty (tier, rozmiar komorki, typ swiata, `nContinents`, `continentOf`, zbior masy przez skrot FNV-1a), wiec zle przekazanie = panika (kontrola negatywna: `forest_replay_hooks_reject_wrong_arguments`).

## 2. Tabela bylo / jest

| | przed (`95b91471`) | po |
|---|---|---|
| `mapgen/terrain_class.rs` | 3 linie (naglowek `//!`) | 1132 linii: pelny port, naglowek z ID wlasciciela zachowany |
| liczba testow `cargo test` | 865 | 890 |
| nowe pliki testow | - | `p6_m04_classify.rs` (7), `p6_m04_reapply.rs` (3), `p6_m04_border.rs` (11), `p6_m04_tables.rs` (4) = 25 |
| zmienione testy istniejace | - | **0** (zadnego nie edytowano ani nie oslabiono; `p6_m00_skeleton` zielony) |
| `data/derived/` | - | `mapgen-terrain-class.json` (nowy, 7 sekcji, 51 wartosci z `zrodlo_web`) |
| `src/data/derived.rs` | - | dopisek NA KONCU (parser `mapgen_terrain_class()`, `deny_unknown_fields`) |

Lista testow (nazwy):
- `p6_m04_classify`: `consts_match_web`, `hash_int3_matches_web`, `terrain_cell_bias_matches_web`, `rown_laka_jitter_matches_web`, `relief_elev_gates_match_web`, `classify_terrain_matches_web`, `classify_terrain_flat_matches_web`.
- `p6_m04_reapply`: `reapply_land_terrain_matches_web`, `reapply_forest_overlay_matches_web`, `forest_replay_hooks_reject_wrong_arguments`.
- `p6_m04_border`: `lat_buffer_matches_web`, `border_consts_match_web`, `margin_cap_matches_web`, `fades_and_distances_match_web`, `is_in_map_border_with_buffer_matches_web`, `margin_scatter_score_matches_web`, `parse_hex_key_matches_js_number_for_hexkey_strings`, `set_hex_to_morze_and_laka_match_web`, `border_grid_tools_match_web`, `erosion_hook_matches_web`, `apply_marginal_land_zone_caps_matches_web`.
- `p6_m04_tables`: `table_parses_with_deny_unknown_fields`, `every_value_has_a_web_source_with_file_and_line`, `values_have_sane_shape`, `floats_are_parsed_exactly_from_the_raw_json_text`.

## 3. Symbole - status per deklaracja

Legenda: PORTOWANY = kod + test + wektor z uruchomionego weba, 0 rozbieznosci. Lista deklaracji najwyzszego poziomu w zakresie: `symbols-m04.txt` (awk po pinie).

| web (`gen-helpers.ts`:linia) | symbol | status | Rust (`terrain_class.rs`) | test |
|---|---|---|---|---|
| :233 | `isInLatitudinalOceanBuffer` | PORTOWANY | `is_in_latitudinal_ocean_buffer` | `lat_buffer_matches_web` (10252; h=0..90 pelny przemiatan r, 100..600 probki, oba tryby) |
| :826 | `TerrainResult` | PORTOWANY (typ) | `TerrainResult` | wszystkie testy klasyfikacji |
| :832 | `TerrainClassifyThresholds` | PORTOWANY (typ; `?? ` = `Option`) | `TerrainClassifyThresholds` (pole `forest` `@deprecated`, nieuzywane jak w webie) | `classify_*` (19 zestawow progow, w tym `null`/`NaN`) |
| :843 | `TerrainScratch` | PORTOWANY (typ) | `TerrainScratch` | `reapply_*` |
| :861 | `reliefElevGates` (prywatna) | PORTOWANY | `relief_elev_gates` | `relief_elev_gates_match_web` (514; granice 0,55 i 0,75 +-1 ulp, NaN, +-Inf) |
| :881-882 | `TERRAIN_GLOBAL_MIX_AMP`, `TERRAIN_CELL_JITTER_AMP` | DANE (tabela) | `przeplot_rownina_laka.amplituda_*` | `consts_match_web` (stale z weba == tabela przez wynik `rown_laka_jitter`) |
| :889 | `terenCoverageCellSize` | PORTOWANY | `teren_coverage_cell_size` (z tabeli) | `consts_match_web` |
| :899 | `hashInt3` (prywatna) | PORTOWANY | `hash_int3` | `hash_int3_matches_web` (4076; ziarna do 2^32+, 2^53, NaN, +-Inf) |
| :911 | `terrainCellBias` | PORTOWANY | `terrain_cell_bias` (`Option` = argument domyslny) | `terrain_cell_bias_matches_web` (5012; cellSize 0, ujemny, NaN, ulamkowy) |
| :917 | `terrainRownLakaJitter` (prywatna) | PORTOWANY | `terrain_rown_laka_jitter` | `rown_laka_jitter_matches_web` (3000) |
| :923 | `classifyTerrain` | PORTOWANY | `classify_terrain` | `classify_terrain_matches_web` (6219) |
| :973 | `classifyTerrainFlat` | PORTOWANY | `classify_terrain_flat` | `classify_terrain_flat_matches_web` (6219) |
| :1012 | `reapplyForestOverlay` | PORTOWANY-Z-WSTRZYKNIETYMI (8 domkniec, §4) | `reapply_forest_overlay` + `ForestOverlayHooks` | `reapply_forest_overlay_matches_web` (64 mapy) |
| :1103 | `REAPPLY_RELIEF_BUDGET_FRAC` | DANE (tabela) | `relief_po_dopasowaniu_ladu.budzet_ulamek_ladu` | `reapply_land_terrain_matches_web` + `consts` |
| :1109 | `reapplyLandTerrain` | PORTOWANY | `reapply_land_terrain` | `reapply_land_terrain_matches_web` (45 map) |
| :1163 | `ReliefDensityTier` | DANE-JUZ-W-RUST | alias `ReliefDensityTier = params::DensityTier` (te same klucze `low/medium/high`) | `tier_from_web` w testach |
| :1165 | `FALLBACK_RELIEF_FRAC` | DANE (tabela) | `docelowy_udzial_gor/wzgorz` | `consts_match_web` |
| :1172 | `reliefLandFractions` | PORTOWANY | `relief_land_fractions` | `consts_match_web` (3 tiery) |
| :1177 | `MAP_BORDER_OCEAN_HEXES` | DANE (tabela) | `map_border_ocean_hexes()` | `border_consts_match_web` |
| :1180 | `MAP_MARGIN_LAND_ZONE_HEXES` | DANE (tabela) | `map_margin_land_zone_hexes()` | `border_consts_match_web` |
| :1183 | `mapBorderWidth` | PORTOWANY | `map_border_width` | `consts_match_web` (6 wejsc) |
| :1191 | `marginLandCapForBorderDistance` | PORTOWANY | `margin_land_cap_for_border_distance` (`None` = `null`) | `margin_cap_matches_web` (77; polowki, granice +-1 ulp, NaN) |
| :1198 | `marginScatterScore` (prywatna) | PORTOWANY | `margin_scatter_score` | `margin_scatter_score_matches_web` (2500; q,r do 1e5) |
| :1204 | `countLandNeighborsInSet` (prywatna) | PORTOWANY | `count_land_neighbors_in_set` | `border_grid_tools_match_web` (kazdy heks 56 map) |
| :1213 | `keysAtBorderDistance` (prywatna) | PORTOWANY (parametr `hexes` weba nieuzywany - zachowany `_hexes`) | `keys_at_border_distance` | `border_grid_tools_match_web` (d=0..12 i 0,5) |
| :1233 | `applyMarginalLandZoneCaps` | PORTOWANY-Z-WSTRZYKNIETYM (1 domkniecie, §4) | `apply_marginal_land_zone_caps` + `MarginZoneHooks` | `apply_marginal_land_zone_caps_matches_web` (42 mapy, V8 TimSort) |
| :1287 | `isInMapMarginZone` | PORTOWANY | `is_in_map_margin_zone` | `fades_and_distances_match_web` |
| :1294 | `landMaskBorderFade` | PORTOWANY | `land_mask_border_fade` | j.w. (4512) |
| :1303 | `mapCenterRadialBias` | PORTOWANY | `map_center_radial_bias` | j.w. |
| :1313 | `mapEdgeRectFade` | PORTOWANY | `map_edge_rect_fade` | j.w. |
| :1326 | `mapCenterDistanceNorm` (prywatna) | PORTOWANY | `map_center_distance_norm` | j.w. |
| :1334 | `hexBorderDistance` | PORTOWANY | `hex_border_distance` | j.w. |
| :1338 | `isInMapBorder` | PORTOWANY | `is_in_map_border` (`Option` = `buffer?`) | `fades_and_distances_match_web`, `is_in_map_border_with_buffer_matches_web` (1500) |
| :1344 | `isReliefCandidateHex` (prywatna) | PORTOWANY | `is_relief_candidate_hex` | `border_grid_tools_match_web` |
| :1357 | `countMapBorderHexes` | PORTOWANY | `count_map_border_hexes` | `border_grid_tools_match_web` (10 buforow x 56 map) |
| :1369 | `findLandInMapBorder` | PORTOWANY | `find_land_in_map_border` | j.w. |
| :1388 | `enforceMapBorderOcean` | PORTOWANY | `enforce_map_border_ocean` | j.w. (stan wszystkich heksow po wywolaniu) |
| :3202 (poza zakresem) | `parseHexKey` | PORTOWANY (lokalna kopia, potrzebna zakresowi) | `parse_hex_key` | `parse_hex_key_matches_js_number_for_hexkey_strings` + posrednio wszystkie |
| :3325, :3332 (poza zakresem) | `setHexToMorze`, `setHexToLaka` | PORTOWANY (lokalne kopie) | `set_hex_to_morze`, `set_hex_to_laka` | `set_hex_to_morze_and_laka_match_web` (48 stanow: rzeka, zloze, nakladka) |
| (miedzy deklaracjami) | komentarze blokowe/JSDoc i puste linie | NIE-DOTYCZY (brak logiki) | - | - |

Podsumowanie: **38 deklaracji najwyzszego poziomu** w zakresie (26 eksportow + 12 prywatnych; 28 funkcji, 6 stalych, 4 typy/aliasy): 28 funkcji PORTOWANYCH (w tym 2 Z-WSTRZYKNIETYMI), 6 stalych jako DANE (tabela), 3 typy PORTOWANE (`TerrainResult`, `TerrainClassifyThresholds`, `TerrainScratch`), 1 alias DANE-JUZ-W-RUST (`ReliefDensityTier`); **RUNDA-2: brak elementow z zakresu M04.** Lokalne kopie z innych zakresow (`parseHexKey`, `setHexToMorze`, `setHexToLaka`) sa wlasnoscia innego tematu (`gen-helpers.ts`:3200-3340); po jego porcie nalezy je zdeduplikowac (§10).

### 3a. Odstepstwa sygnatur od weba (kompletna lista; logika 1:1)

| Web | Rust | Powod |
|---|---|---|
| `hexes: Record<string, Hex>` | `HexRecord` (wektor par + indeks, kolejnosc wstawiania jak `Object.entries`) | `Hex` weba ma 9 pol; `TerrainHex` ma tylko czytane/zapisywane w zakresie (`coords`, `terenBazowy`, `nakladka`, `rzeka.obecna`, `rzeka.krawedzie`, obecnosc `zloze`); model `MapHex` jest przypisany M01 (`types.rs`), ktorego allowlista go nie obejmuje |
| `scratch: Map<string, TerrainScratch>` | `HashMap<String, TerrainScratch>` | kolejnosc nie jest czytana (tylko `get`) |
| `thresholds?: TerrainClassifyThresholds` | `Option<&TerrainClassifyThresholds>`; pola `Option<f64>` | `??` traktuje `undefined` i `null` jednakowo |
| `climateBand?: ClimateBand` | `Option<ClimateBand>` | `undefined` |
| `cellBias = 0` | jawny `f64` (wywolujacy daje 0.0) | brak domyslnych argumentow w Rust; wektory maja wiersze z domyslnym (null -> 0) |
| `terrainCellBias(.., cellSize = terenCoverageCellSize())` | `cell_size: Option<f64>` | argument domyslny |
| `mapHeight?: number` | `Option<u32>`; `Some(0)` == falsz | `mapHeight &&` / `mapHeight ?` w JS |
| `continentOf: Map<string, number> \| null` | `Option<&HashMap<String, f64>>` | tylko `get` |
| `isInMapBorder/countMapBorderHexes/enforceMapBorderOcean(.., buffer?)` | `Option<f64>` | `buffer ?? mapBorderWidth()` |
| wspolrzedne `q`,`r`,`width`,`height` | `f64` w funkcjach czysto liczbowych, `i64` w funkcjach iterujacych po siatce i kluczach | JS `number`; klucz `"q,r"` buduje `i64` (inaczej `-0` dalby `"-0"`, a JS daje `"0"`) |
| `Math.min/max/round/pow` | `js_min`, `js_max`, `js_round`, `js_pow` (NaN propaguje, `-0`, polowka w gore, `pow(x,2) = x*x`) | `f64::max/min` ignoruja `NaN`; `f64::round` zaokragla polowke od zera |
| `Array.prototype.sort` | `cluster_mass::js_array_sort_by` (TimSort V8) | komparator marginesu NIEprzechodni (`> 0.02`) |

## 4. Domkniecia wstrzykniete (PORTOWANY-Z-WSTRZYKNIETYMI)

M04 nie moze zalezec od kodu innych tematow (rownolegle allowlisty), a ponizsze deklaracje leza w `gen-helpers.ts` POZA zakresem M04:

| metoda cechy | web | uzywana przez |
|---|---|---|
| `ForestOverlayHooks::forest_share_of_dry_land` | `FOREST_SHARE_OF_DRY_LAND[tier]` `:1590` | `reapply_forest_overlay` |
| `forest_overlay_cap_frac` | `FOREST_OVERLAY_CAP_FRAC` `:1605` | j.w. |
| `forest_coverage_cell_size` | `forestCoverageCellSize` `:1838` | j.w. |
| `min_land_hexes_for_fair_play_cell` | `minLandHexesForFairPlayCell` `:1844` | j.w. |
| `is_forest_eligible_terrain` | `isForestEligibleTerrain` `:1555` | j.w. |
| `build_sea_distance_field` | `buildSeaDistanceField` `:5614` | j.w. |
| `land_partition_keys_for_distribution` | `landPartitionKeysForDistribution` `:1565` (wola `groupLandMassKeys` `:1411`) | j.w. |
| `land_hexes_by_coverage_cell` | `landHexesByCoverageCell` `:8360` | j.w. |
| `MarginZoneHooks::sort_land_keys_for_erosion` | `sortLandKeysForErosion` `:3207` (+ `countMorseNeighbors` `:3294`, `erodeTerrainRank` `:3288`) | `apply_marginal_land_zone_caps` |

Po porcie tych tematow wystarczy `impl` cechy na ich funkcjach (bez zmian w `terrain_class.rs`). W testach: zaleznosci lasu to wartosci z prawdziwego weba (odtwarzane, §1), a `ErosionHook` to przepisany TS sprawdzony na wlasnych wektorach.

## 5. Dane vs kod - brak literalow danych/mnoznikow

- Balans w `data/derived/mapgen-terrain-class.json` (edytowalny; **kazda wartosc ma `zrodlo_web` z numerem linii**): progi klasyfikacji (0,63 / 0,75 / 0,60 / 0,14 / 0,22 / 0,18 / 0,45 / 0,35), bramki wysokosci reliefu (3 wiersze x 4 + progi 0,55 / 0,75), przeplot Rownina/Laka (0,12 / 0,65 / komorka 4), budzety i udzialy reliefu per tier, parametry lasu (0,14 / 1,35 / 1,0 / min. 0 i 1 / sufit 2), brzeg mapy (2 / 10 / 0,05 / 0,45 / 0,38 / 0,02 / 5 / 0,001), bias radialny (0,12 / 0,94 / 2,0). Parser: `data/derived.rs` (dopisek na koncu, `deny_unknown_fields`, `OnceLock`).
- Stale ALGORYTMICZNE (tozsamosc algorytmu, nie balans), zostaja w kodzie: mnozniki hasza `374761393`, `668265263`, `2246822519`, `1274126177` i przesuniecia `13`/`16` (weryfikator Pythona sprawdza ich obecnosc w liniach `gen-helpers.ts`:900-903), `73856093`, `19349663`, maska `0xffff` (:1200-1201), `4294967296` (dzielnik hasza). Literaly strukturalne: `0`, `1`, `2` (indeksy, polowa bbox `/ 2.0`), srodek szumu `0.5` (`:918`, `:914`), polowa piksela `+ 0.5` w normalizacji srodka mapy (`:1306`), `d - 1` w pierscieniu, `maxSeaInPart = 1`, `ring.len * cap`. Audyt: `grep-literals-terrain-class.txt` (wszystkie trafienia sklasyfikowane powyzej; zadnej liczby balansowej).
- Testy ksztaltu tabeli (`p6_m04_tables.rs`) NIE pinuja wartosci: parsowanie z `deny_unknown_fields` (nieznane pole na kazdym poziomie, w tym w wierszach bramek), kazda wartosc ma `zrodlo_web` z plikiem i numerem linii z zakresu M04 (825..1407), ksztalt (progi w `[0,1]`, rosnace tiery, `cell >= 1`, dzielniki > 0), dokladnosc parsowania floatow wzgledem tekstu pliku (`serde_json` bez `float_roundtrip` moze przeklamac ulp). **Uwaga:** testy wektorowe (`p6_m04_*`) to testy PARYTETU z webem, wiec zmiana liczby balansu celowo je lamie (mutacje tabeli sa wykrywane) - zmiana balansu wymaga swiadomego przegenerowania wektorow.
- Stare stale `TERRAIN_GLOBAL_MIX_AMP`/`TERRAIN_CELL_JITTER_AMP` w `map_generator.rs:16-17` (literaly) zostaja - plik poza allowlista (§10).

## 6. Zalozenia i zachowania weba odtworzone 1:1 (luki rozstrzygniete ZALOZENIEM)

1. **Hasz komorek**: `(a * 374761393) ^ (b * 668265263) ^ (c * 2246822519)` liczy iloczyny w `f64` (dla ziaren > ~4e6 iloczyn przekracza 2^53 i traci mlodsze bity), dopiero potem `ToInt32` operatora `^`. Port: `js_to_int32(a * 374761393.0)` itd. + `wrapping_mul` dla `Math.imul`. Wektory: ziarna do 2^32+7, 2^53, NaN, +-Inf (`hash_int3_matches_web`).
2. **Komparator marginesu brzegu jest NIEprzechodni** (`Math.abs(sb - sa) > 0.02`), a komparator `sortLandKeysForErosion` ma prog `0.015`: wynik zalezy od algorytmu sortowania; uzyty TimSort V8 (`js_array_sort_by`), potwierdzony na 42 wektorach erozji i 42 mapach strefy brzegowej oraz niezaleznie WLASNYM TimSortem w Pythonie.
3. **`findLandInMapBorder` omija tylko `Morze`** (`terenBazowy === Morze`), wiec `PlytkieMorze` w buforze jest zglaszane jako "lad"; **`enforceMapBorderOcean`** konwertuje `PlytkieMorze` na `Morze` i liczy je w `converted`. Zachowane 1:1 (mutacje `find-land-skips-shallow`, `enforce-skips-shallow` wykrywane).
4. **`mapHeight &&` / `mapHeight ?`**: `0` jest falszem (`Some(0)` => brak pasa klimatycznego; `cellBand = temperate_north`).
5. **Zbior masy lasu** to `new Set(part.filter(k => !hexes[k] || !woda))`: klucz bez heksa liczy sie jako lad (zachowane; unikalnosc i kolejnosc wstawiania jak w `Set`).
6. **`Math.round`** w lesie i strefie brzegu: polowka w kierunku `+inf` (`js_round`, wynik dokladny); `Math.max/min` propaguja `NaN` i rozrozniaja `-0` (`js_max`, `js_min`) - `f64::max/min` Rusta ignoruja `NaN`.
7. **`Math.pow(x, 2.0)`** w `mapCenterRadialBias`: V8 (fdlibm) zwraca `x * x`; pomiar 200 000 losowych `x` w Node v22.22.0: 0 roznic (`stats.powSquareDiffs` w wektorach); port `js_pow` robi `x * x` dla wykladnika 2, inaczej `powf` (NIE_ZMIERZONO wzgledem V8 - web wola tylko `y == 2`).
8. **`reapplyLandTerrain` czyta `hex.coords`**, a `scratch` po KLUCZU (`"q,r"`); w grze klucz == coords (generator wektorow to sprawdza i rzuca przy rozjezdzie). Rozjazd klucza i `coords`: NIE_ZMIERZONO.
9. **`hexes[k]!` na brakujacym heksie** (pierscien brzegu zawsze budowany z siatki) rzuca `TypeError` w webie; port panikuje z komunikatem `web: hexes[k] undefined (TypeError)`. Wszystkie wektory maja pelne siatki.
10. **Nieuzywane parametry weba zachowane** (zgodnosc sygnatur): `keysAtBorderDistance(hexes, ..)` (`_hexes`), `classifyTerrainFlat(.., landMask, _mtnNoise, ..)`, `reapplyForestOverlay(.., thresholds, ..)` (`_thresholds`), `TerrainClassifyThresholds.forest` (`@deprecated`).
11. **Dwa sortowania spojne** (`b.n - a.n`) tez przez `js_array_sort_by` - identyczne z V8 takze dla remisow i `NaN`.
12. **Brak efektow ubocznych poza `hexes`**: `reapplyForestOverlay` czysci `Las` i zapisuje tylko `nakladka`; `reapplyLandTerrain` zapisuje `terenBazowy` i `nakladka`; `setHexToMorze` zeruje `rzeka` i `zloze`, `setHexToLaka` zeruje tylko `zloze` (rzeka zostaje) - wszystko w wektorach `setHex` i `borderGrid`.

## 6a. Mutacje rownowazne (nie do wykrycia testem - uzasadnienie)

Te same uzasadnienia sa w `run-mutations.py` (slownik `EQUIVALENT`, drukowany w podsumowaniu).

1. `forest-inland-gt-to-ge` (`maxSeaInPart > 1` -> `>= 1`): gdy `maxSeaInPart == 1`, kazdy heks ladu partycji ma `sd == 1` (lad => `sd >= 1`, a maksimum wynosi 1; heks poza polem odleglosci nie istnieje, bo BFS od wody pokrywa cala spojna siatke), wiec bonus `0,14` dostaja WSZYSTKIE kwalifikowane heksy jednakowo, a `n` jest czytane wylacznie przez sortowanie.
2. `land-restore-keeps-overlay` (usuniecie `hex.nakladka = Brak` po przywroceniu reliefu): ten sam heks dostal `flatNak` (= `Brak`; `classifyTerrainFlat` zawsze zwraca `Brak`) w pierwszej petli, wiec przypisanie jest redundantne.
3. `fade-cap-le-to-lt` (`cap <= 0` -> `cap < 0` w `landMaskBorderFade`): dla `cap == 0` galaz `min(1, cap / 0.45)` tez daje 0, a `cap < 0` jest nieosiagalne (`marginLandCapForBorderDistance` zwraca >= 0).
4. (przebieg 1) `table-min-sufitu` 2 -> 3: `loop = min(cap, len)` i `ceil(len * 0.95) <= len` ograniczaja wynik niezaleznie od 2 vs 3 - zastapiona wartoscia 100, ktora zmienia wynik (gesty las wysokiego tieru) i jest wykrywana.

## 7. Bramki (surowe, PELNE logi w runie, kazdy z `EXIT=`)

Srodowisko: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_5dbe3591-4a2-1 CARGO_PROFILE_DEV_DEBUG=0`, cargo w `rust-port/engine`; podkatalog celu usuniety po zakonczeniu; `Cargo.lock` nie commitowany.

| bramka | log | wynik |
|---|---|---|
| `cargo fmt -- --check` | `gate-fmt-r1.log` | `EXIT=0` |
| `cargo clippy --all-targets -- -D warnings` | `gate-clippy-r1.log` | `EXIT=0` |
| `cargo test --no-fail-fast` | `gate-test-r1.log` | **890 passed, 0 failed**, `EXIT=0` |
| `git diff --check` (po `git add`) | `gate-diffcheck.log` | `EXIT=0` |
| generator wektorow | `gen-m04-r1.log` | `EXIT=0`, skrot powtarzalny (`vectors-sha256.txt`) |
| weryfikator Python | `verify-m04-r1.log` | 157597 sprawdzen, 0 rozbieznosci, `EXIT=0` |
| weryfikator - test negatywny | `verify-m04-negative-r1.log` | 6 rozbieznosci, `EXIT=1` (oczekiwane) |
| mutacje kodu/tabeli | `mutations-r1.log` | **77/77 wykrytych** (pelny przebieg `mutations-r1.log`: 76/77 wykrytych; jedyna `BLAD-KOMPILACJI` to `scatter-mask` z przyczyna INFRA `No space left on device` na wspoldzielonym dysku, NIE blad mutacji; powtorzona osobno w `mutations-r1b.log`: wykryta, `EXIT=0`), 3 mutacje rownowazne wylaczone jawnie (§6a), pliki po kazdej mutacji przywracane i weryfikowane bajt w bajt |
| pomiar starego hasza | `legacy-hash-divergence.log` | patrz §0 |

Skrypty: `gen-m04-vectors.mjs` (+ `m04-loader-register.mjs`, `m04-loader-hooks.mjs`), `verify-m04-vectors.py`, `tamper-vectors.py`, `run-mutations.py`, `legacy-hash-divergence.py`.

## 8. Zmiany (allowlista)

- `rust-port/engine/src/domain/mapgen/terrain_class.rs` (wypelniony; naglowek z `Temat wlasciciel:` zachowany),
- `rust-port/engine/tests/p6_m04_classify.rs`, `p6_m04_reapply.rs`, `p6_m04_border.rs`, `p6_m04_tables.rs`, `rust-port/engine/tests/p6_m04_vectors/web-vectors.json`, `rust-port/engine/tests/p6_m04_vectors/common.rs`,
- `rust-port/engine/data/derived/mapgen-terrain-class.json` (NOWY) i `rust-port/engine/src/data/derived.rs` (dopisek NA KONCU pliku - wyjatek jawnie dopuszczony w dispatchu; **plik JSON nie jest wymieniony w liscie "Kod" dispatchu, ale kryterium binarne wymaga "stale balansowe -> edytowalne tabele `data/derived/*.json` + parser w `data/derived.rs`"** - to rozszerzenie allowlisty wynika wprost z kryterium i jest zgodne z precedensem M01/M10),
- `dyspozycje/rust-port/p6/P6-M04-TEREN-KLASYFIKACJA-GRANICE.md` (ten dokument), `dyspozycje/autobot/runs/R-RUSTPORT-P6-M04-TEREN-KLASYFIKACJA-GRANICE-Q1/**` (dispatch, generator, loader, weryfikator, skrypty, logi, raport).
- Zero zmian w `domain/mod.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `tests/p6_m00_skeleton.rs`, `map_generator.rs`, `cluster_mass.rs`, ani w istniejacych testach.

## 9. Odczyt zrodel (liczby linii) i dokumenty

- Web (pin `edb8fb56`, `wc -l`): `gen-helpers.ts` **12 561** linii. **Zakres M04 (:233-236 i :825-1407) przeczytany w CALOSCI**, razem z sasiedztwem `:1408-1437` (`groupLandMassKeys`). Doczytane zaleznosci: `:1-60` (naglowek, importy), `:220-245`, `:1550-1620` (`isForestEligibleTerrain`, `landPartitionKeysForDistribution`, `FOREST_*`), `:1830-1860` (`forestCoverageCellSize`, `minLandHexesFor*`), `:3195-3345` (`parseHexKey`, `sortLandKeysForErosion`, `countMorseNeighbors`, `setHexTo*`), `:5605-5640` (`buildSeaDistanceField`), `:8350-8390` (`landHexesByCoverageCell`). **Reszta pliku (`:61-219`, `:246-824`, `:1438-1549`, ... ) NIE przeczytana w calosci - NIE_ZMIERZONO**; nalezy do M01-M03, M05-M08, M13 (tabela P6-25 §6). `earth-land-mask.ts` (170 linii) `:17-58` (zaleznosc `earthPolarOceanRows` dla weryfikatora), `types/hex.ts` (140 linii) w calosci.
- Rust: `terrain_class.rs`, `prims.rs` (sygnatury), `params.rs` (`DensityTier`), `cluster_mass.rs` `:1-110` (`js_array_sort_by`), `map_generator.rs` `:15-175` i `:890-915` (stare duplikaty), `data/derived.rs` (naglowek, `StartValue`, `TierTriple`, koncowka), `tests/p6_m00_skeleton.rs` `:60-100`, `tests/p6_m10_tables.rs`, `tests/p6_m10_vectors/common.rs`.
- Dokumenty (z `claude/sprawdzenie-funkcjonalnosci-ek4ra0`): `00-dispatch.md` w calosci; `P6-0-GAP-ANALYSIS.md` §0, §5, §6b (435 linii; reszta nieczytana); `P6-M14-TERYTORIUM-ZASIEG-CUDA.md` (147 linii, w calosci); z repo: `P6-M10-KLASTRY-MASY-BRAMKI.md` §0, §1, §4-§9, `P6-M01-RDZEN-WERYFIKACJA.md` §0-§6, skrypty `run-mutations.py`/`verify-m10-vectors.py` (TimSort). **NIE czytane** (NIE_ZMIERZONO, czy zawieraja dodatkowe ograniczenia): `P3-22-FLATTEN-STAGE2.md` i skrypty `R-RUSTPORT-P3-22-*`, `P2-3-ENTITY-IDS.md`, `P2-5-COMMANDS.md`, `PLAN-PORT-RUST-TAURI-20261020.md` §P6, `LEDGER.md`, `P6-5B-JEDNOSTKI-ZYCIE-B.md` (wzorzec; zastapiony czytaniem M10/M14/M01, ktore stosuja ten sam schemat).

## 10. Ryzyka / do Evaluatora i orkiestratora

1. **Hasz w starym generatorze** (§0): `map_generator::hash_int3` (u32) rozni sie od weba dla ziaren > ~4e6 (99,5% prob. z pelnego u32). Dopoki `generate_map` go uzywa, mapy z duzych ziaren nie sa zgodne z webem. Naprawa wymaga edycji `map_generator.rs` (poza allowlista M04): przejscie na `terrain_class::hash_int3`/`terrain_cell_bias`. Do osobnego tematu (np. integracja M18).
2. **Stare duplikaty** w `map_generator.rs` (`classify_terrain` uproszczona, `terrain_cell_bias`, `land_mask_border_fade`, `edge_rect_fade`, `border_distance`, stale `TERRAIN_*`) - nieporuszane; po integracji generatora nalezy je usunac.
3. **Lokalne kopie** `parse_hex_key`, `set_hex_to_morze`, `set_hex_to_laka` (wlasnosc innego tematu, `gen-helpers.ts`:3200-3340) - zdeduplikowac po jego porcie; funkcje sa `pub`, wiec konsument moze sie przelaczyc bez zmian zachowania (kontrakt zamrozony wektorami `setHex`).
4. **Model heksa**: `TerrainHex`/`HexRecord` to wycinek `Hex` weba; docelowy `MapHex` (M01, `types.rs`) powinien dostarczyc konwersje albo zastapic wycinek; kontrakt kolejnosci (`Object.entries`) jest istotny dla remisow sortowan.
5. **Cargo.lock**: `cargo` utworzyl lokalny `Cargo.lock` (nieobecny w repo) - NIE commitowany, zgodnie z dispatchem.
6. **Niezmierzone**: zachowanie V8 w innych wersjach niz Node v22.22.0 (algorytm sortowania stabilny od V8 7.0; `Math.pow` dla wykladnikow != 2); inne silniki JS.
