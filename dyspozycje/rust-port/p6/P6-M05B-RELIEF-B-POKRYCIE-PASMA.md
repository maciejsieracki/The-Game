# P6.M05B - relief B: pokrycie siatki reliefu, bezpiecznik skupisk, pasma gorskie (port `gen-helpers.ts`:2363-3185 do Rust)

Temat: `R-RUSTPORT-P6-M05B-RELIEF-B-POKRYCIE-PASMA-Q1` · DOMAIN: GAME · RUNDA 2/5 (Operator-impl, Haiku 5.5 medium)
Baza: `origin/rust-port/parity-v2` @ `2c2f58f8` (silnik przed zmianami: 1203 testy, z M05A). Pin web: `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do scratch poza repo).
Artefakty runu: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M05B-RELIEF-B-POKRYCIE-PASMA-Q1/`.

## 0. Status

- Zakres web (2371-3185) zportowany: 3 funkcje publiczne + 9 prywatnych pomocnikow + 6 stalych (w tym 5 jako JSON). **Wszystkie symbole PORTOWANE** (kod + test + wektor z uruchomionego weba, 0 rozbieznosci bitowych). **RUNDA-2: brak** (nic nie odlozone).
- Testy nowe: **11** (`p6_m05b_grow` 3, `p6_m05b_helpers` 3, `p6_m05b_tables` 5). `cargo test --offline --no-fail-fast`: **1214 passed, 0 failed** (= 1203 baza + 11). Zero zmian istniejacych testow.
- Wektory z URUCHOMIONEGO weba: `tests/p6_m05b_vectors/web-vectors.json` (7 205 052 B, SHA-256 `4072347ab48f17c46c5f79d00baf580ce6c247f01fd637981e4920481bd106d9`), generator `gen-m05b-vectors.mjs` (kopia w runie). **Przypadki:** `ensure` 40 (27 z naprawa), `grow` 40 (36 z dolozeniem/zmiana), `safety` 16, `regrow` 24 (20 z odzyskiem), `helpers` 60 (10 na kazda z 6 funkcji), `params` 18 (3 realne + 15 z 5 wariantow uszkodzonego JSON).
- Wejscie mapy jest w wektorze (nie regenerowane w Rust); strumien `rand` = `mulberry32(seed)`; kazdy przypadek sprawdza stan calej mapy (kolejnosc wstawiania), zwrot i NASTEPNA wartosc `rand()`.
- Bramki: fmt `EXIT=0`, `clippy --all-targets -D warnings` `EXIT=0`, test `EXIT=0`, `git diff --check` `EXIT=0` (logi w runie).
- Mutacje i niezalezny weryfikator Python: **NIE WYKONANO** (dispatch: to Operator-pomiary, drugie wywolanie).

## 1. Symbole zakresu - status

| Symbol web (gen-helpers.ts) | Rust (`mapgen/relief.rs`) | Status | Wektor / test |
|---|---|---|---|
| `ensureReliefGridCoverage` :2371 | `ensure_relief_grid_coverage` | PORTOWANY | `ensure` / `ensure_relief_grid_coverage_matches_web` |
| `MOUNTAIN_RANGE_LAND_SHARE_CAP` :2446 | JSON `pasma.udzial_gor_wzgorz_w_ladzie_sufit` | DANE (JSON) | `grow` (sufit) |
| `MAX_MOUNTAIN_RANGE_CLUSTER_SIZE` :2457 | JSON `pasma.maks_skupisko_gor_wzgorz` | DANE (JSON) | `safety`, `grow` |
| `MOUNTAIN_RANGE_REGROW_MIN_GAP` :2470 | JSON `pasma.regrow_odstep_od_reliefu` | DANE (JSON) | `regrow` |
| `MOUNTAIN_RANGE_REGROW_TARGET_MULT` :2480 | JSON `pasma.regrow_mnoznik_celu` | DANE (JSON) | `grow` |
| `MOUNTAIN_RANGE_REGROW_LEN_MIN/MAX` :2484-2485 | JSON `pasma.regrow_dlugosc_min/max` | DANE (JSON) | `regrow` |
| `findSameTerrainClusters` :2492 | `find_same_terrain_clusters` | PORTOWANY | `helpers` (`clusters`) |
| `connectedComponentsWithin` :2522 | `connected_components_within` | PORTOWANY | `helpers` (`clusters`, skladowe) |
| `capMountainRangeClusterSize` :2562 | `cap_mountain_range_cluster_size` | PORTOWANY | `helpers` (`capCluster`), `safety`, `grow` |
| `capReliefClusterSizeSafetyNet` :2618 | `cap_relief_cluster_size_safety_net` | PORTOWANY | `safety` |
| `mountainRangeSeedCandidates` :2631 | `mountain_range_seed_candidates` | PORTOWANY | `helpers` (`seeds`) |
| `walkMountainRange` :2657 | `walk_mountain_range` | PORTOWANY | `helpers` (`walk`) |
| `bfsExpandExclusion` :2699 | `bfs_expand_exclusion` | PORTOWANY | `helpers` (`bfs`) |
| `isExcludedForRegrow` :2738 | `is_excluded_for_regrow` | PORTOWANY | `regrow`, `helpers` (`walkAvoid`) + test strefy |
| `walkMountainRangeAvoiding` :2757 | `walk_mountain_range_avoiding` | PORTOWANY | `helpers` (`walkAvoid`) |
| `regrowLostMountainClusters` :2830 | `regrow_lost_mountain_clusters` | PORTOWANY | `regrow` |
| `growMountainRanges` :2965 | `grow_mountain_ranges` | PORTOWANY | `grow` |
| `countLandSeaHexes` :3268 (poza zakresem, uzyty w 2965) | `count_land_hexes` (lokalna kopia) | PORTOWANY (kopia) | `grow` |
| `mapGenMountainRangeParams` (loader :167) | `map_gen_mountain_range_params`, `resolve_mountain_range_params` | PORTOWANY | `params` (real + 5 wariantow) |
| `FALLBACK_MOUNTAIN_RANGE` (loader :62-66) | JSON `pasma_fallback` | DANE (JSON) | `params` (wariant `brak-wiersza`, `brak-sekcji`, ...) |

Uzyte z M05A bez zmian (juz PORTOWANE): `ensureMassIronGridCoverage`, `ensureMassCopperGridCoverage`, `capIronCellReliefSpread`, `forceIronMountainsInCell`, `forceCopperHighlandsInCell`, `cellHasIronPackage`, `cellHasCopperPackage`, `eligibleReliefLandCount`, `landHexesByCoverageCell`, `groupLandMassKeys`, `pickSpreadReliefKeys`, `minMountainsIronCell`, `minHighlandsCopperCell`, `minLandHexesForReliefCell`, `ironCoverageCellSize`, `copperCoverageCellSize`, `isDepositProtectedFromOverflowCap`, `js_array_sort_by` (TimSort V8).

## 2. Odstepstwa sygnatur od weba (logika 1:1)

- `ensureReliefGridCoverage(hexes, scratch, tier, width, height, _typ, _continentOf, _nContinents, rand)` -> `ensure_relief_grid_coverage(hexes, scratch, tier, width, height, rand)`: trzy argumenty z `_` w webie nie sa czytane w ciele funkcji, wiec nie sa przenoszone.
- `Map<string,TerrainScratch>` -> `&HashMap<String,TerrainScratch>`; `Set<string>` -> `&[String]` (kolejnosc wstawiania, duplikaty zwijane) lub `HashSet<String>` tam, gdzie web uzywa Set jako zbioru wykluczen; `Array<{k,n}>` -> `Vec<(String,f64)>`.
- `steps` (dlugosc spaceru) -> `usize`; `rand: () => number` -> `Rand<'_>` (`&mut dyn FnMut() -> f64`).
- `Math.floor/min/max/round` -> `f64::floor`, `js_min`, `js_max`, `js_round` (lokalne, z NaN/-0). Brak `sin/cos/pow/atan2/hypot` w zakresie (wykaz: `floor` 5, `round` 2, `min` 1, `max` 1; 3 wystapienia `Math.random` to WYLACZNIE komentarze w webie - nie ma wywolan).
- Sortowania: `js_array_sort_by` (TimSort V8, stabilny) we wszystkich sortowaniach zakresu.

## 3. Dane vs kod

- Nowa tabela `data/derived/mapgen-relief-b.json` (13 liczb balansu w `pasma`, 5 w `siatka_domykanie`, 18 w `pasma_fallback`), kazda z `zrodlo_web` (`gra/...:linia`). Test `relief_b_table_has_web_source_for_every_leaf` sprawdza to dla kazdego liscia.
- Parser `data/derived.rs` (dopisek na koncu, `deny_unknown_fields`, `mapgen_relief_b()`).
- W kodzie `relief.rs` nie ma literalow balansu. Jedyne stale: `0`, `1`, `-1` (komparatory, liczniki), `0.0/1.0` jako f64. Audyt: literaly `10`, `0.15`, `0.3`, `0.4`, `8`, `150`, `40`, `200` wystepuja tylko w tabeli JSON i komentarzach.
- Progi szumu gor/wzgorz: `params::mountain_noise_threshold_from_tier` / `highland_noise_threshold_from_tier` (M02; ten sam plik JSON co loader web).

## 4. Dryf po pinie (zakres 2371-3185)

- `git diff --stat edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 24 wstawienia, 16 usuniec (40 linii), **0 hunkow w zakresie 2371-3185**. Hunki: 5995, 8469, 10355, 10395, 10544, 10696, 10779, 10807 (`queue.shift()` -> indeks glowy; poza zakresem). Lokalny ref `origin/main` = `91dc998a`.
- Wektory sa z PINU `edb8fb56` (zgodnie z dispatchem); odswiezenie przy osobnym temacie R-RUSTPORT-REPIN-DELTA-Q1.

## 5. Zalozenia (luki rozstrzygniete ZALOZENIEM)

1. Klucze heksow kanoniczne `"q,r"` z calkowitych wspolrzednych (jak M05A). Wspolrzedne sa `i64`.
2. Wektory pokrywaja: `Gory`, `Wzgorza`, `Laka`, `Rownina`, `Pustynia`, `Morze`, `PlytkieMorze`; nakladki `brak`/`las`; zloze jako flaga (web: `zloze?: string`, tylko obecnosc ma znaczenie w czytanym kodzie). `Polarny` (w Rust `PolarNorth/PolarSouth`) NIE jest w wektorach - traktowany jako ląd w obu wersjach (`is_water` = false).
3. Progi szumu przy USZKODZONYM JSON (fallback `FALLBACK_MOUNTAIN`/`FALLBACK_HIGHLAND` loadera): **NIE_ZMIERZONO** w M05B (poza zakresem; M02 czyta ten sam JSON). Fallback pasm (`FALLBACK_MOUNTAIN_RANGE`) jest zmierzony na 5 wariantach.
4. Mapy testowe: losowe prostokaty z blobami lądu (nie pula fbm z M05A). Pokrycie galezi NIE zmierzone (brak instrumentacji w webie); widoczne tylko zwroty w `stats`: `growChanged` 36/40, `regrowRecovered` 20/24, `ensureFixed` 27/40. Czulosc na pojedyncze galezie (kroki 1/2 sufitu, regrow) - do Operator-pomiary (mutacje).
5. Ziarno `seed >>> 0` (JS `^` moze dac wartosc ujemna); Rust bierze 32 bity.

## 6. Ryzyka / do Evaluatora

- Wektor 7.2 MB w repo (jak M05A 7.2 MB); rozmiar akceptowalny, ale rosnie przy kolejnych zakresach.
- Mutacje i niezalezny weryfikator Python (`verify-*.py`) NIE wykonane - wymagane w Operator-pomiary.
- `cargo fmt` zmienil tylko nowe pliki (baza fmt-clean; sprawdzone `git status`).
