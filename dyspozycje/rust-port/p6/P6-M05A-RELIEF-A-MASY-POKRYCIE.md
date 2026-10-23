# P6.M05A - relief A: masy ladu, partycje, rozmieszczanie gor/wzgorz i pokrycie siatki fair play (port `gen-helpers.ts`:1408-2365 do Rust)

Temat: `R-RUSTPORT-P6-M05A-RELIEF-A-MASY-POKRYCIE-Q1` · DOMAIN: GAME · RUNDA 1/5 (Operator, Sonnet 5.5 medium)
Baza: `origin/rust-port/parity-v2` @ `827ba69b` (silnik: 1009 testow). Pin web: `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do `mktemp -d` poza repo).
Zakres (dispatch): `gra/src/map/gen-helpers.ts`:1408-2365. Zaleznosci zintegrowane: M01 (`prims.rs`), M02 (`params.rs`), M03 (`masks.rs`+`v8math`), M04 (`terrain_class.rs`), M09-M11. Wzorce: `P6-M03-MASKI-CENTRA-UZUPELNIENIE.md`, `P6-M04-TEREN-KLASYFIKACJA-GRANICE.md`.
Artefakty runu: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M05A-RELIEF-A-MASY-POKRYCIE-Q1/`.

## 0. Status (uczciwie)

- **Wszystkie 62 deklaracje najwyzszego poziomu zakresu** (`symbols-m05a.txt`, §3) maja status: **PORTOWANY** (kod + test + wektor z uruchomionego weba, 0 rozbieznosci) dla 62/62; **DANE-JUZ-W-RUST**: `mapGenReliefOverflowCapFrac` (poza zakresem, `map-gen-params-loader.ts:154`; wartosci z `data/map-gen-params.json`, parser istnial, M05A dodaje tylko czytnik i rozstrzygniecie fallbacku, §4); **NIE-DOTYCZY**: 0; **RUNDA-2 / M05B**: `ensureReliefGridCoverage` (`gen-helpers.ts`:2371) i dalej (docblock zaczyna sie w :2363, ale deklaracja i cialo sa po :2365 - nalezy do M05B; zakres M05A konczy sie dokladnie po `ensureMassCopperGridCoverage` :2362).
- Wektory z URUCHOMIONEGO weba (`tests/p6_m05a_vectors/web-vectors.json`, 7 255 936 B, SHA-256 `238ebe04ccff97d89160b1ed57395b687426039abbdf59487d77e6875916838c`, powtarzalny: drugi przebieg generatora na tym samym web-rootcie daje ten sam skrot, `gen-m05a-r1.log` + `cmp`): **15354 rekordow w 25 kategoriach** na 56 mapach z puli (40 losowych + 16 BRZEGOWYCH; 65 448 heksow), 10 626 punktow odleglosci do kwadratu centrum, 9 684 wartosci capow (`vector-counts.txt`). f64 porownywane **bitowo** (`to_bits`; wszystkie `NaN` sprowadzone do jednego, bo w JS jest jeden `NaN`).
- Niezalezny weryfikator Python (`verify-m05a-vectors.py`, `python3 -I`, bez Node/TS/Rust): **88941 sprawdzen, 0 rozbieznosci** (`verify-m05a-r1.log`, `EXIT=0`); test negatywny (runda 2: **25** zmienionych wartosci, po jednej w KAZDEJ z 25 kategorii wektorow; runda 1 obejmowala 13) => rozbieznosci wykryte we wszystkich 25, `EXIT=1` (`verify-m05a-negative-r2.log`; r1: `verify-m05a-negative-r1.log`).
- Testy: **27 nowych** (`p6_m05a_tables` 10, `p6_m05a_masses` 8, `p6_m05a_relief` 3, `p6_m05a_cover` 6). `cargo test --offline --no-fail-fast`: **1036 passed, 0 failed, `EXIT=0`** (`gate-test-r1.log`); 1036 = 1009 (baza) + 27 (+ ewentualne testy dodane do bazy przez rebase - brak). fmt i clippy `--all-targets -D warnings`: `EXIT=0`. Zero zmian istniejacych testow (zadnej asercji nie usunieto ani nie oslabiono; `p6_m00_skeleton` zielony - naglowek `relief.rs` ma oba ID wlascicieli w jednej linii `Temat wlasciciel:`, bo test szkieletu parsuje te linie).
- Mutacje (`mut-runner-m05a.py`, wlasny `CARGO_TARGET_DIR`, jedna kompilacja naraz, po KAZDEJ mutacji `git checkout --` + kontrola czystosci drzewa + SHA-256 bajtow plikow): **132 mutacje WYKRYTE** (celowany test czerwony) **+ 10 mutacji, ktore przezyly testy i sa udowodnionymi ROWNOWAZNOSCIAMI** (przeniesione do `EQUIVALENT`, §6a; razem 142 wpisy; to NIE jest "132 z 132"). 0 bledow kompilacji/timeoutow w stanie koncowym, 0 NIE URUCHOMIONO. W trakcie rundy przezylo 13 wpisow: 3 rozstrzygnieto jako WYKRYTE po poprawce/nowych wektorach, 10 jako rownowaznosci (§6a/§6b). Szczegoly i uzasadnienia: §6a, §6b.
- **Brak literalow danych/mnoznikow w nowym kodzie:** 35 wartosci balansu (50 lisci tabeli) w `data/derived/mapgen-relief-a.json`, kazda z `zrodlo_web` (plik+linia z zakresu); weryfikator wyciaga je regexem z TS po numerach linii i porownuje z tabela: `50/50`; audyt literalow TS zakresu: 41 literalow poza {0,1,2}, WSZYSTKIE w liniach zrodel tabeli; audyt literalow `relief.rs` (`grep-literals-relief.txt`): 59 literalow, 0 nieznanych (tylko 0/1/2, `1e21` (prog zapisu wykladniczego `Number->String`) i `0.5` w `js_round`).

## 1. Metoda wektorow (ANTY-HALUCYNACJA)

- Generator `gen-m05a-vectors.mjs` (w runie), uruchomienie (Node v22.22.0):
  `node --experimental-transform-types --no-warnings --import ./m05a-loader-register.mjs ./gen-m05a-vectors.mjs <WEB_ROOT> <OUT_JSON>` -> `OK {...}` (`gen-m05a-r1.log`, `EXIT=0`).
- **PRAWDZIWY kod weba, bez przepisywania logiki**: `gen-helpers.ts` (12 561 linii) laduje sie jako kopia pliku z dopisanym NA KONCU jednym wierszem `export { ...37 prywatnych deklaracji... };`. Generator sprawdza, ze kopia bez dopisku jest bajt w bajt rowna oryginalowi (SHA-256 i liczba linii oryginalu w `meta` wektorow, sprawdzane przez weryfikator i test `vectors_come_from_the_pinned_web_run`). Loader `m05a-loader-hooks.mjs` tylko dopisuje `.ts` / `/index.ts` i traktuje `.json` jako modul - **ZERO stubow logiki**.
- `mapGenReliefOverflowCapFrac` z USZKODZONYM `map-gen-params.json`: generator robi 11 kopii drzewa `gra/` w scratch (poza repo) ze zmienionym JSON (brak sekcji, brak `gestosc`, wartosc 0, ujemna, tekst, brak wiersza, brak pola, `null`, wartosci inne, mieszane) i uruchamia TE SAMA funkcje TS z kazdej kopii (`cases.overflowVariants`, 33 wiersze = 11 wariantow x 3 tiery). Dzieki temu galaz fallbacku jest zmierzona na webie, nie tylko przeczytana. Kopie usuniete po generacji.
- Wejscia: 40 map z puli (`maps`, zapisane RAZ; przypadki wskazuja `map` i maja stan wejsciowy z puli): mapy z `fbm`/`buildPermTable` weba (ksztalt lad/morze), udzialy Gor/Wzgorz od 0 do 60% (wyzwalaja zarowno wymuszanie minimow, jak i sufit przepelnienia), zloza 0-30% heksow (ochrona zloza), szum gor w czterech trybach (`fbm`, skwantyzowany z REMISAMI, mieszany z brakami wpisow `scratch` -> `?? 0`, staly), kolejnosc wstawiania wierszami albo losowa, marginesy ujemnych wspolrzednych, "dziury" w ladzie, mapy do 100x66 (Ogromny). Strumien losowy `mulberry32(20261023)` z weba.
- Wynik operacji na mapie = lista ZMIAN wzgledem stanu wejsciowego (`[indeks, teren, nakladka, zloze]`) + FNV-1a-64 calego stanu; dla operacji losujacych: **liczba wywolan `rand` i NASTEPNA wartosc strumienia** (dowod, ze Rust zuzywa `rand` identycznie). Komorki sa wskazywane jako `{map, massIdx, size, cellIdx, len, cellHash}` i liczone przez Rust (`group_land_mass_keys` + `land_hexes_by_coverage_cell`, obie ZWERYFIKOWANE osobno na wektorach `masses`/`landCells`), z kontrola dlugosci i skrotu FNV-1a-64 listy `[q,r]` z weba.
- **Kategorie i liczby przypadkow** (`vector-counts.txt`, §11.12): `consts` 1, `overflowVariants` 33, `caps` 2421, `minLand` 325, `landCells` 80, `pickSpread` 400, `masses` 56, `center` 353 (10 626 punktow odleglosci), `nullSquareDist` 1, `partition` 672, `forestEligible` 8, `riverLand` 8, `cellCounts` 842, `canHostEdge` 2526, `ratios` 306, `pickForce` 890, `pickForceWater` 80, `forceType` 2105, `capCell` 2105, `depositProtected` 3, `capSpread` 219, `ensureMass` 876, `applyKeys` 336, `applyRank` 672, `applyRankDefault` 36.
- **Mapy brzegowe i przezyta mutacja (uczciwie).** Pierwszy zestaw wektorow (40 map losowych) NIE wykryl mutacji `cap-spread-min-land-lt-to-le` (`< min_iron_land` -> `<=` w `cap_iron_cell_relief_spread`): wymaga komorki z DOKLADNIE `min_land` = 8 heksami ladu i nadmiarem gor, a losowe mapy rzadko trafiaja w ten prog (inne mutacje progu - `ensure-eligible-ge-to-gt`, `coverage-min-land-lt-to-le` - trafily przypadkiem). Dodano 16 map BRZEGOWYCH (`addBoundaryMap`: blob dokladnie N = 7, 8, 9, 10 heksow w jednej komorce dla rozmiarow siatki 12/15/21; teren wszystkie Gory / wszystkie Wzgorza / sama Laka / szachownica Gory-Wzgorza; zloza i rzeki losowo) i kategorie `canHostEdge` (`minLand` = dokladna liczba kwalifikujacych sie heksow -1/0/+1). Nowe przypadki wchodza w TE SAME kategorie (mapy brzegowe maja id 40-55) i uzywaja OSOBNEGO strumienia losowego `rng2`, wiec wszystkie wczesniejsze przypadki sa bez zmian: `cmp-vectors-r1-r2.py` potwierdza, ze kazda kategoria starej wersji jest PREFIKSEM nowej (23/23, pula map 40 -> 56; `cmp-vectors-r1-r2.log`). Dzieki temu wyniki mutacji wykrytych na starym zestawie pozostaja wazne (mutacja wykryta przez podzbior przypadkow jest wykrywana tez przez nadzbior).
- **Woda w liscie `land` (druga przezyta mutacja, uczciwie).** `force-water-allowed` (usuniecie filtra `isWaterTerrain` w `pickReliefForceHex`) PRZEZYLA na pierwszych wektorach: wolajacy weba podaja do tej funkcji wylacznie lad, wiec filtr wody jest wykonywany tylko na poziomie funkcji. Dodano kategorie `pickForceWater` (80 przypadkow, strumien `rng2` DOPISANY NA KONCU, wiec wszystkie wczesniejsze kategorie sa prefiksem poprzednich: `cmp-vectors-r1-r3.log`): do komorki dokleja sie 1-3 heksy `Morze`/`PlytkieMorze` i uruchamia sie ten sam web; wynik, liczba losowan i nastepna wartosc musza byc identyczne (woda NIE moze byc kandydatem ani zuzywac `rand`). Test Rust `pick_relief_force_hex_filters_water_cells_like_web` + sekcja 3.11b weryfikatora; mutacja jest teraz WYKRYTA (`mutations-r1-f.log`).
- **Pokrycie wymuszone asercjami w testach** (progi sprawdzane w kazdym tescie): `applyRank` - wszystkie 4 typy swiata, >100 przypadkow z `continentOf` (sciezka Voronoi 135 w `partition`), >20 000 zmian lacznie; `applyKeys` - 3 rodzaje (zelazo/miedz/oba), 3 specyfikacje zbioru (caly lad / masa z duplikatem / jawna lista w losowej kolejnosci), przypadki "bez zmian" >20; `forceType` i `capCell`: kazdy z 5 rodzajow >100 razy zmienil i >100 (cap: >50) razy nie zmienil stanu; `pickForce`: 82 wyniki `null`; `pickForceWater`: 80 przypadkow z 1-3 heksami wody doklejonymi do `land` (wszystko wykluczone), >200 przypadkow z flagami ochrony; `ensureMass`: kazda z 4 kombinacji (zelazo/miedz x skipCap) >50 razy naprawila i >30 razy nie; `ratios`: wskaznik pelny i czastkowy >100 razy, `assertReliefGridCoverage` prawda/falsz >40 razy; `cellCounts`: pakiet zelaza/miedzi tak/nie >200 razy, `canHost` tak/nie >100; `caps`: 2421 wierszy, >500 z sufitem rozproszenia powyzej minimum; `minLand`: >10 na podlodze 8 i >100 skalowanych.
- **Niezalezny weryfikator** `verify-m05a-vectors.py <WEB_ROOT> <WEKTORY> <TABELA>`: reimplementuje CALA logike w Pythonie z KODU TS jako specyfikacji (zero Rust, zero uruchomienia TS), razem z WLASNYM TimSortem V8 (skopiowany z weryfikatora P6.M04), WLASNYM `mulberry32` (imul/ToInt32 w liczbach calkowitych), `Math.round` (przez `Fraction`), `Math.min/max` (NaN, -0). Dodatkowo: (a) wyciaga regexem z TS (po numerach linii pinu) KAZDA z 50 wartosci tabeli i porownuje z `data/derived/mapgen-relief-a.json` (zbior sprawdzonych == zbior lisci tabeli, `50/50`), (b) audyt literalow zakresu TS (kazdy literal inny niz 0/1/2 musi lezec w linii zrodla tabeli), (c) licza NIEZALEZNIE masy ladu, komorki siatki i odwolania do komorek, (d) sprawdza SHA-256 i liczbe linii `gen-helpers.ts` z pinu (12 561).

## 2. Tabela bylo / jest

| | przed (`827ba69b`) | po |
|---|---|---|
| `mapgen/relief.rs` | 3 linie (naglowek `//!` szkieletu) | 1545 linii: pelny port zakresu :1408-2365 (62 deklaracje) + lokalne kopie 5 prywatnych pomocnikow weba z innych zakresow (§4) |
| `data/derived/mapgen-relief-a.json` | - | nowy; 10 sekcji, 50 wartosci z `zrodlo_web` |
| `src/data/derived.rs` | - | dopisek NA KONCU (10 struktur `deny_unknown_fields`, `mapgen_relief_a()`) |
| liczba testow `cargo test` | 1009 | 1036 |
| nowe pliki testow | - | `p6_m05a_tables.rs` (10), `p6_m05a_masses.rs` (8), `p6_m05a_relief.rs` (3), `p6_m05a_cover.rs` (6) = 27; `tests/p6_m05a_vectors/{common.rs,web-vectors.json}` |
| zmienione testy istniejace | - | **0** (zadnego nie edytowano ani nie oslabiono; `p6_m00_skeleton` zielony) |
| `domain/mod.rs`, `bridge.rs`, `Cargo.toml`, `p6_m00_skeleton.rs` | - | nietkniete |

Lista testow (nazwy):
- `p6_m05a_tables`: `table_parses_with_deny_unknown_fields`, `every_value_has_a_web_source_with_file_and_line`, `values_have_sane_shape`, `floats_are_parsed_exactly_from_the_raw_json_text`, `consts_and_tier_tables_match_web`, `caps_match_web`, `min_land_hexes_match_web`, `overflow_cap_frac_with_damaged_json_matches_web`, `forest_eligible_and_deposit_protection_match_web`, `vectors_come_from_the_pinned_web_run`.
- `p6_m05a_masses`: `land_hexes_by_coverage_cell_matches_web`, `group_land_mass_keys_matches_web`, `centroid_center_square_and_distance_match_web`, `land_partition_keys_for_distribution_matches_web`, `cell_counters_and_packages_match_web`, `cell_can_host_deposit_package_at_the_min_land_boundary_matches_web`, `grid_coverage_ratios_match_web`, `pick_spread_relief_keys_matches_web`.
- `p6_m05a_relief`: `apply_relief_to_land_keys_matches_web`, `apply_relief_by_noise_rank_matches_web`, `apply_relief_by_noise_rank_default_arguments_match_web`.
- `p6_m05a_cover`: `pick_relief_force_hex_matches_web`, `force_relief_type_in_cell_matches_web`, `cap_overflow_in_cell_matches_web`, `cap_iron_cell_relief_spread_matches_web`, `ensure_mass_grid_coverage_matches_web`.

Zmiany testow (jawnie): **brak zmian istniejacych testow**; dodano 27. Testy ksztaltu tabeli (`p6_m05a_tables.rs`) NIE pinuja wartosci balansu (zmiana liczby w JSON wymaga przegenerowania wektorow, ktore swiadomie lamia testy PARYTETU - to zamierzona detekcja driftu, jak w M04).

## 3. Symbole - status per deklaracja

Legenda: PORTOWANY = kod + test + wektor z uruchomionego weba, 0 rozbieznosci. Lista deklaracji najwyzszego poziomu w zakresie: `symbols-m05a.txt` (62 wiersze, `awk` po pinie):

```text
1411	export	function	groupLandMassKeys
1440	export	function	computeLandMassCentroid
1460	export	const	CONTINENT_CENTER_SQUARE_SIZE
1462	export	type	ContinentCenterSquare
1472	export	function	continentCenterSquare
1540	export	function	hexDistanceToCenterSquare
1555	private	function	isForestEligibleTerrain
1565	export	function	landPartitionKeysForDistribution
1590	private	const	FOREST_SHARE_OF_DRY_LAND
1605	private	const	FOREST_OVERLAY_CAP_FRAC
1607	private	function	applyReliefToLandKeys
1620	private	function	reliefBonusCapMountain
1625	private	function	reliefBonusCapHighland
1636	private	function	reliefSpreadCapMountain
1641	private	function	reliefSpreadCapHighland
1646	private	function	applyIronMountainsToLandKeys
1685	private	function	applyCopperHighlandsToLandKeys
1724	private	function	pickSpreadReliefKeys
1750	export	function	applyReliefByNoiseRank
1777	export	const	MIN_RIVER_SOURCES_PER_WATER_CELL
1779	private	const	RELIEF_MIN_MOUNTAINS
1780	private	const	RELIEF_MIN_HIGHLANDS
1782	export	function	minMountainsIronCell
1786	export	function	minHighlandsCopperCell
1791	export	const	MIN_MOUNTAINS_IRON_CELL
1793	export	const	MIN_HIGHLANDS_COPPER_CELL
1799	export	function	waterCoverageCellSize
1809	export	function	ironCoverageCellSize
1819	export	function	copperCoverageCellSize
1828	export	function	reliefCoverageCellSize
1833	export	function	fairPlayResourceCellSize
1838	export	function	forestCoverageCellSize
1844	export	function	minLandHexesForFairPlayCell
1848	export	function	minLandHexesForReliefCell
1852	private	function	countMountainsInCell
1863	private	function	countHighlandsInCell
1874	private	function	cellHasMountain
1881	private	function	cellHasHighland
1889	export	function	cellHasIronPackage
1898	export	function	cellHasCopperPackage
1907	export	function	cellHasReliefPackage
1920	private	function	eligibleReliefLandCount
1930	private	function	eligibleDepositLandCount
1938	private	function	cellCanHostDepositPackage
1950	private	function	eligibleForestLandCount
1962	export	function	ironGridCoverageRatio
1980	export	function	copperGridCoverageRatio
1999	export	function	reliefGridCoverageRatio
2011	export	function	assertReliefGridCoverage
2024	private	function	pickReliefForceHex
2066	private	function	forceReliefTypeInCell
2122	private	function	forceIronMountainsInCell
2136	private	function	forceCopperHighlandsInCell
2151	private	function	forceReliefInCell
2181	private	const	RELIEF_OVERFLOW_CAP_MULT
2192	private	function	isDepositProtectedFromOverflowCap
2196	private	function	capMountainOverflowInCell
2233	private	function	capHighlandOverflowInCell
2270	private	function	capIronCellReliefSpread
2286	private	function	capReliefOverflowInCell
2296	private	function	ensureMassIronGridCoverage
2331	private	function	ensureMassCopperGridCoverage
```

| web (`gen-helpers.ts:linia`) | Rust (`relief.rs`) | status | test (wektor z weba) |
|---|---|---|---|
| `groupLandMassKeys` :1411 | `group_land_mass_keys` | PORTOWANY | `masses::group_land_mass_keys_matches_web` (40 map, 160 mas, kolejnosc DFS ze stosem) |
| `computeLandMassCentroid` :1440 | `compute_land_mass_centroid` | PORTOWANY | `masses::centroid_center_square_and_distance_match_web` (273 zbiory, 50 `null`) |
| `CONTINENT_CENTER_SQUARE_SIZE` :1460 | `continent_center_square_size()` (tabela `kwadrat_centrum`) | PORTOWANY (dane) | `tables::consts_and_tier_tables_match_web` |
| `ContinentCenterSquare` :1462 (typ) | `ContinentCenterSquare`, `CenterBBox` | PORTOWANY | jw. |
| `continentCenterSquare` :1472 | `continent_center_square` | PORTOWANY | jw. (669 kwadratow, rozmiary 0, ujemny, ulamkowy, 1-25) |
| `hexDistanceToCenterSquare` :1540 | `hex_distance_to_center_square` | PORTOWANY | jw. (9 366 punktow, w tym `NaN`, ulamkowe, bez kwadratu) |
| `isForestEligibleTerrain` :1555 | `is_forest_eligible_terrain` | PORTOWANY | `tables::forest_eligible_and_deposit_protection_match_web` (8 terenow) |
| `landPartitionKeysForDistribution` :1565 | `land_partition_keys_for_distribution` | PORTOWANY | `masses::land_partition_keys_for_distribution_matches_web` (480; 4 typy swiata x brak/`continentOf`/poza zakresem/`n=0`) |
| `FOREST_SHARE_OF_DRY_LAND` :1590 | `forest_share_of_dry_land(tier)` (tabela `las`) | PORTOWANY (dane) | `tables::consts_and_tier_tables_match_web` |
| `FOREST_OVERLAY_CAP_FRAC` :1605 | `forest_overlay_cap_frac()` | PORTOWANY (dane) | jw. |
| `applyReliefToLandKeys` :1607 | `apply_relief_to_land_keys` | PORTOWANY | `relief::apply_relief_to_land_keys_matches_web` (240) |
| `reliefBonusCapMountain` / `Highland` :1620, :1625 | `relief_bonus_cap_mountain` / `_highland` | PORTOWANY | `tables::caps_match_web` (2421 x 4 wartosci) |
| `reliefSpreadCapMountain` / `Highland` :1636, :1641 | `relief_spread_cap_mountain` / `_highland` | PORTOWANY | jw. |
| `applyIronMountainsToLandKeys` :1646 | `apply_iron_mountains_to_land_keys` | PORTOWANY | `relief::apply_relief_to_land_keys_matches_web` |
| `applyCopperHighlandsToLandKeys` :1685 | `apply_copper_highlands_to_land_keys` | PORTOWANY | jw. |
| `pickSpreadReliefKeys` :1724 | `pick_spread_relief_keys` | PORTOWANY | `masses::pick_spread_relief_keys_matches_web` (400, w tym duplikaty, `count`/`minDist` = `NaN`, ujemne, ulamkowe) |
| `applyReliefByNoiseRank` :1750 | `apply_relief_by_noise_rank` | PORTOWANY | `relief::apply_relief_by_noise_rank_matches_web` (480) + `..._default_arguments_match_web` (36; web domyslne `typ='pangea'`, `continentOf=null`, `n=0`) |
| `MIN_RIVER_SOURCES_PER_WATER_CELL` :1777 | `min_river_sources_per_water_cell()` | PORTOWANY (dane) | `tables::consts_and_tier_tables_match_web` |
| `RELIEF_MIN_MOUNTAINS`, `RELIEF_MIN_HIGHLANDS` :1779, :1780 | tabela `minima_komorki` | PORTOWANY (dane) | jw. |
| `minMountainsIronCell`, `minHighlandsCopperCell` :1782, :1786 | `min_mountains_iron_cell`, `min_highlands_copper_cell` | PORTOWANY | jw. |
| `MIN_MOUNTAINS_IRON_CELL`, `MIN_HIGHLANDS_COPPER_CELL` :1791, :1793 (deprecated) | `deprecated_min_mountains_iron_cell()`, `deprecated_min_highlands_copper_cell()` | PORTOWANY | jw. |
| `waterCoverageCellSize` :1799 | `water_coverage_cell_size` | PORTOWANY | jw. |
| `ironCoverageCellSize` :1809, `copperCoverageCellSize` :1819 | `iron_coverage_cell_size`, `copper_coverage_cell_size` | PORTOWANY | jw. |
| `reliefCoverageCellSize` :1828 (deprecated), `fairPlayResourceCellSize` :1833, `forestCoverageCellSize` :1838 | `relief_coverage_cell_size`, `fair_play_resource_cell_size`, `forest_coverage_cell_size` | PORTOWANY | jw. |
| `minLandHexesForFairPlayCell` :1844, `minLandHexesForReliefCell` :1848 | `min_land_hexes_for_fair_play_cell`, `min_land_hexes_for_relief_cell` | PORTOWANY | `tables::min_land_hexes_match_web` (325 rozmiarow, w tym `NaN`, `Infinity`, `-0`, ujemne) |
| `countMountainsInCell` :1852, `countHighlandsInCell` :1863, `cellHasMountain` :1874, `cellHasHighland` :1881 | `count_mountains_in_cell`, `count_highlands_in_cell`, `cell_has_mountain`, `cell_has_highland` | PORTOWANY | `masses::cell_counters_and_packages_match_web` (794 komorki, czesc ze wspolrzednymi poza mapa) |
| `cellHasIronPackage` :1889, `cellHasCopperPackage` :1898, `cellHasReliefPackage` :1907 (deprecated) | `cell_has_iron_package`, `cell_has_copper_package`, `cell_has_relief_package` | PORTOWANY | jw. (tier jawny i domyslny `medium`) |
| `eligibleReliefLandCount` :1920, `eligibleDepositLandCount` :1930, `cellCanHostDepositPackage` :1938, `eligibleForestLandCount` :1950 | `eligible_relief_land_count`, `eligible_deposit_land_count`, `cell_can_host_deposit_package`, `eligible_forest_land_count` | PORTOWANY | jw. |
| `ironGridCoverageRatio` :1962, `copperGridCoverageRatio` :1980, `reliefGridCoverageRatio` :1999 (deprecated), `assertReliefGridCoverage` :2011 | `iron_grid_coverage_ratio`, `copper_grid_coverage_ratio`, `relief_grid_coverage_ratio`, `assert_relief_grid_coverage` | PORTOWANY | `masses::grid_coverage_ratios_match_web` (258 przypadkow, 2 580 wartosci) |
| `pickReliefForceHex` :2024 | `pick_relief_force_hex` | PORTOWANY | `cover::pick_relief_force_hex_matches_web` (794; wynik, liczba losowan `rand`, nastepna wartosc strumienia) |
| `forceReliefTypeInCell` :2066, `forceIronMountainsInCell` :2122, `forceCopperHighlandsInCell` :2136, `forceReliefInCell` :2151 (deprecated) | `force_relief_type_in_cell`, `force_iron_mountains_in_cell`, `force_copper_highlands_in_cell`, `force_relief_in_cell` | PORTOWANY | `cover::force_relief_type_in_cell_matches_web` (1925; lista zmian, skrot stanu, losowania) |
| `RELIEF_OVERFLOW_CAP_MULT` :2181 | `relief_overflow_cap_mult()` (tabela `sufit_przepelnienia.mnoznik`) | PORTOWANY (dane) | `tables::consts_and_tier_tables_match_web` |
| `isDepositProtectedFromOverflowCap` :2192 | `is_deposit_protected_from_overflow_cap` | PORTOWANY | `tables::forest_eligible_and_deposit_protection_match_web` + `cover::cap_overflow_in_cell_matches_web` |
| `capMountainOverflowInCell` :2196, `capHighlandOverflowInCell` :2233, `capReliefOverflowInCell` :2286 (deprecated) | `cap_mountain_overflow_in_cell`, `cap_highland_overflow_in_cell`, `cap_relief_overflow_in_cell` | PORTOWANY | `cover::cap_overflow_in_cell_matches_web` (1925; `spreadOnly` oba, skracanie `||`) |
| `capIronCellReliefSpread` :2270 | `cap_iron_cell_relief_spread` | PORTOWANY | `cover::cap_iron_cell_relief_spread_matches_web` (183) |
| `ensureMassIronGridCoverage` :2296, `ensureMassCopperGridCoverage` :2331 | `ensure_mass_iron_grid_coverage`, `ensure_mass_copper_grid_coverage` (wspolna `ensure_mass_grid_coverage`) | PORTOWANY | `cover::ensure_mass_grid_coverage_matches_web` (732; `skipCap` oba) |

**Zaleznosci spoza zakresu uzywane przez port** (sprawdzone wektorami, patrz §4): `landHexesByCoverageCell` :8360 (`land_hexes_by_coverage_cell`, wektory `landCells` 80), `hexAxialDistance` :5194 i `hexDistanceAxial` :135 (lokalne kopie f64), `isRiverLandTerrain` :6854 (`riverLand` 8), `parseHexKey` :3202 / `hexBorderDistance` :1334 / `isReliefCandidateHex` :1344 / `reliefLandFractions` :1172 (M04, `terrain_class.rs`, nie kopiowane), `mapGenReliefOverflowCapFrac` (`map-gen-params-loader.ts`:154, §4).

### 3a. Odstepstwa sygnatur od weba (kompletna lista; logika 1:1)

- `Map<string, TerrainScratch>` -> `&HashMap<String, TerrainScratch>` (tylko `mtn_noise` czytany); `Record<string, Hex>` -> `HexRecord` (M04, kolejnosc wstawiania = `Object.keys`).
- `Set<string>` argumentow (`massSet`) -> `&[String]` w kolejnosci wstawiania; duplikaty zwijane lokalnie (`unique_in_order`) tak jak `new Set(keys)`. `Array<[number, number]>` -> `&[(i64, i64)]` (klucze kanoniczne, §6 zal. 1).
- `rand: () => number` -> `Rand<'_> = &mut dyn FnMut() -> f64`.
- Parametry domyslne weba (`tier = 'medium'`, `size = CONTINENT_CENTER_SQUARE_SIZE`, `typ = 'pangea'`, `continentOf = null`, `nContinents = 0`, `spreadOnly = false`, `skipCap = false`, `copperCellSize?`) -> jawne argumenty (`Option<f64>` tam, gdzie `undefined` zmienia zachowanie: `continent_center_square(size)`, `relief_grid_coverage_ratio(copper_cell_size)`); testy sprawdzaja zarowno wartosc jawna, jak i domyslna (`ironDef`, `copperDef`, `applyRankDefault`).
- `want: 'mountain' | 'highland'` -> `enum ReliefWant`.
- Funkcje liczbowe zwracaja `f64` tam, gdzie web zwraca `number` o potencjalnie nieskonczonej/NaN wartosci (limity, capy, rozmiary komorek); liczniki komorek - `f64` jak w webie (porownania z `minCount`/`minLand` sa na liczbach).
- `mapGenReliefOverflowCapFrac(tier)` -> `map_gen_relief_overflow_cap_frac(tier) -> (mountain, highland)` + czysta `resolve_overflow_cap_frac(Option<f64>, Option<f64>, tier)` (rozstrzygniecie `typeof === 'number' && > 0` albo fallback), testowana na 33 wierszach z uszkodzonym JSON.
- `ContinentCenterSquare.keys: Set<string>` -> `keys()` (lista w kolejnosci wstawiania bez duplikatow) + `has(&str)`; `bbox`, `centroid` jako `f64`.
- Prywatne funkcje weba sa `pub` w Rust, zeby testy mogly je wolac bezposrednio (web eksportuje je w kopii generatora dopiskiem `export { ... }`).

## 4. Zaleznosci spoza zakresu: lokalne kopie i wstrzykniecia

Zakres M05A jest "wyspa" miedzy M04 (:825-1407) a M05B (:2366+); korzysta z deklaracji innych tematow:

| Deklaracja web | Gdzie | Rozwiazanie |
|---|---|---|
| `parseHexKey` :3202, `hexBorderDistance` :1334, `isReliefCandidateHex` :1344, `reliefLandFractions` :1172, `HexRecord`, `TerrainHex`, `TerrainScratch`, `Nakladka`, `ReliefDensityTier` | M04 `terrain_class.rs` | UZYTE (import), nie kopiowane |
| `groupLandMassKeys` :1411 (potrzebne M04 `ForestOverlayHooks`) | ten zakres | portowane; M04 `ForestOverlayHooks` ma 8 metod, M05A dostarcza teraz **7 z 8** jako wolne funkcje (`forest_share_of_dry_land`, `forest_overlay_cap_frac`, `forest_coverage_cell_size`, `min_land_hexes_for_fair_play_cell`, `is_forest_eligible_terrain`, `land_partition_keys_for_distribution`, `land_hexes_by_coverage_cell`); pozostaje `build_sea_distance_field` (:5614, inny temat). Struktury implementujacej trait NIE tworzono (wymagalaby 8. metody) - to zadanie integracji (M18/M06), kontrakt zamrozony wektorami. |
| `landHexesByCoverageCell` :8360 | inny zakres | LOKALNA KOPIA `pub fn land_hexes_by_coverage_cell` (wynik `Map` w kolejnosci wstawiania; klucz komorki `"floor(q/c),floor(r/c)"`); wektory `landCells` (80, ujemne wspolrzedne, rozmiary ulamkowe 0,5 i 7,5) |
| `hexAxialDistance` :5194, `hexDistanceAxial` :135 | inne zakresy | LOKALNE KOPIE f64 (`hex_axial_distance`, `hex_distance_axial_f64`); wersje `prims::hex_distance_axial` (i64) NIE uzyte, bo web ma DWIE roznie zapisane formuly (`(|dq|+|dr|+|dq+dr|)/2` oraz `max(|dq|,|dr|,|ds|)`) i wejscia moga byc ulamkowe/NaN (`hexDistanceToCenterSquare(2.5, 3.5, ...)`) |
| `isRiverLandTerrain` :6854 | inny zakres | LOKALNA KOPIA (`riverLand` 8) |
| `mapGenReliefOverflowCapFrac` (`map-gen-params-loader.ts`:154) | loader weba | czytnik `map_gen_relief_overflow_cap_frac` na istniejacym parserze `data::terrain_map::parse_map_gen_params` (cache `OnceLock`); fallback (`FALLBACK_RELIEF_OVERFLOW_CAP`, loader :36-40) w tabeli `sufit_przepelnienia.fallback_*`; **DANE-JUZ-W-RUST** (JSON `gestosc.relief_overflow_cap_frac` byl parsowany od P3) |
| `js_array_sort_by` (`cluster_mass.rs`) | M10 | UZYTE (TimSort V8) we wszystkich 7 sortowaniach zakresu, mimo ze wszystkie komparatory sa przechodnie - zgodnosc z V8 niezalezna od typu komparatora |

### 4a. `Math.sin/cos/pow/atan2/hypot` i jadra `k_sin/k_cos/rem_pio2` (wymog dispatchu)

**W zakresie :1408-2365 web NIE wola `Math.sin`, `Math.cos`, `Math.pow`, `Math.atan2` ani `Math.hypot`** (ani `sqrt`, `exp`, `log`, `trunc`, `sign`, `abs`). Dowod: `audit-math-literals.py` -> `grep-math-m05a.txt` (pelne wyjscie ponizej; liczba wywolan `Math.*` w zakresie: `ceil=4, floor=2, max=10, min=7, round=5`). Jedyne wywolania `Math.*`, ktore zakres ma, to wiec `min/max/round/floor/ceil` - dokladne w IEEE, odtwarzane lokalnymi `js_min`/`js_max` (NaN, `-0`) i `js_round` (polowa w gore, `-0`), `f64::floor/ceil`; **zadna z nich nie uzywa `masks::v8math` ani `prims::js_cos`**, a jadra `k_sin/k_cos/rem_pio2` w `prims.rs` i `masks::v8math` NIE zostaly ruszone (zakres M05A ich nie potrzebuje). Pozostale miejsca w `gen-helpers.ts` wolajace `Math.sin/cos/pow/atan2/hypot` (poza zakresem, dla kolejnych tematow): linie 84, 290, 357, 380, 435, 450, 476, 483, 486, 487, 618, 619, 642, 643, 646, 647, 679, 680, 784, 785, 788, 789 (M01/M03: `cosLerp`, maski, centra), 1309 (M04), 3586, 3587, 4496, 4618, 7058 (M06+); w Rust implementuja je `prims::js_cos` (:84) i `masks::v8math` (reszta). Zaleznosci tego zakresu spoza niego uzywaja tylko `Math.abs/min/max/floor` (:135-138, :1334, :5194, :8360).

```text
# Wywolania Math.* w gen-helpers.ts:1408-2365 (pin edb8fb56), tylko kod (bez komentarzy //, /* */)
# linia	funkcja	tekst
1494	min	qMin = Math.min(qMin, q);
1495	max	qMax = Math.max(qMax, q);
1496	min	rMin = Math.min(rMin, r);
1497	max	rMax = Math.max(rMax, r);
1512	round	const cq = Math.round(centroid.q);
1513	round	const cr = Math.round(centroid.r);
1514	floor	const half = Math.floor(size / 2);
1550	min	minD = Math.min(minD, hexAxialDistance(q, r, cq, cr));
1576	min	const ci = Math.min(nContinents - 1, Math.max(0, continentOf.get(key) ?? 0));
1576	max	const ci = Math.min(nContinents - 1, Math.max(0, continentOf.get(key) ?? 0));
1622	max	return Math.max(0, Math.ceil(landCount * frac));
1622	ceil	return Math.max(0, Math.ceil(landCount * frac));
1627	max	return Math.max(0, Math.ceil(landCount * frac));
1627	ceil	return Math.max(0, Math.ceil(landCount * frac));
1638	max	return Math.max(minMountainsIronCell(tier), Math.ceil(landCount * frac));
1638	ceil	return Math.max(minMountainsIronCell(tier), Math.ceil(landCount * frac));
1643	max	return Math.max(minHighlandsCopperCell(tier), Math.ceil(landCount * frac));
1643	ceil	return Math.max(minHighlandsCopperCell(tier), Math.ceil(landCount * frac));
1674	round	const bonus = Math.round(candidates.length * fr.mountain);
1675	min	const nMtn = Math.min(bonus, reliefBonusCapMountain(tier, candidates.length));
1713	round	const bonus = Math.round(candidates.length * fr.highland);
1714	min	const nHi = Math.min(bonus, reliefBonusCapHighland(tier, candidates.length));
1849	max	return Math.max(8, Math.floor(cellSize * 0.32));
1849	floor	return Math.max(8, Math.floor(cellSize * 0.32));
2005	round	const copperSize = copperCellSize ?? Math.round(ironCellSize * 0.6);
2056	min	score += Math.min(8, hexBorderDistance(q, r, width, height)) * 0.04;
2206	max	: Math.max(minMtn, reliefBonusCapMountain(tier, land.length) + minMtn);
2243	max	: Math.max(minHi, reliefBonusCapHighland(tier, land.length) + minHi);

# LICZBA wywolan wg funkcji: ceil=4, floor=2, max=10, min=7, round=5
# sin/cos/pow/atan2/hypot/sqrt/exp/log/trunc/sign/abs w zakresie: {'sin': 0, 'cos': 0, 'pow': 0, 'atan2': 0, 'hypot': 0, 'sqrt': 0, 'exp': 0, 'log': 0, 'trunc': 0, 'sign': 0, 'abs': 0}
```

## 5. Dane vs kod - brak literalow danych/mnoznikow

- Tabela `rust-port/engine/data/derived/mapgen-relief-a.json` (edytowalna; parser `data/derived.rs` dopisany na KONCU pliku, `deny_unknown_fields`, `mapgen_relief_a()`): 50 lisci `{wartosc, zrodlo_web}` w 10 sekcjach: `kwadrat_centrum` (5), `las` (udzialy lasu na tier, sufit nakladki), `limit_bonusu_reliefu` (frakcje Gor/Wzgorz na tier), `rozrzut_reliefu` (minimalny odstep 4/3), `minima_komorki` (2/4/5 na tier), `rozmiary_komorek` (woda/zelazo/miedz/las na tier), `min_ladu_w_komorce` (podloga 8, ulamek 0,32), `pokrycie` (zrodla rzek, mnoznik miedzi 0,6, prog 0,999), `wymuszanie` (0,9; 8; 0,04; 0,15; 0,1; straznik +8; 14 przebiegow), `sufit_przepelnienia` (mnoznik 1 i fallback).
- Zasady: wartosc balansu = JSON (+ `zrodlo_web` plik:linia z zakresu); strukturalne literaly zostaja w kodzie (`0`, `1` jako licznik/brak/jeden, `2` jako polowa, `unwrap_or(0.0)` dla `?? 0`, porownania `> 0`), a takze stale JS (`1e21` prog zapisu wykladniczego `Number->String`, `0.5` w `js_round`). Audyt: `grep-literals-relief.txt` (59 literalow `relief.rs`, 0 nieznanych) i audyt literalow TS w weryfikatorze (41 literalow poza {0,1,2}, wszystkie w liniach zrodel tabeli).
- Wartosci tabeli czytane z tekstu pliku `str::parse` == wartosci po `serde` (test `floats_are_parsed_exactly_from_the_raw_json_text`, 33 + 17 wartosci), bo `serde_json` bez `float_roundtrip` moze przeklamac ulp.
- Sufit przepelnienia komorki (`gestosc.relief_overflow_cap_frac` w `data/map-gen-params.json`) NIE jest kopiowany do tabeli: czytany z istniejacego pliku (zrodlo prawdy weba); w tabeli jest wylacznie fallback z kodu loadera.
- Udzialy reliefu na tier (`reliefLandFractions`) pochodza z tabeli M04 (`relief_po_dopasowaniu_ladu`), nie z M05A.

## 6. Zalozenia i zachowania weba odtworzone 1:1 (luki rozstrzygniete ZALOZENIEM)

1. **Klucze heksow kanoniczne**: napisy `"q,r"` z calkowitych `q`, `r` (tak buduje je generator i `hexKey`). Wspolrzedne komorek siatki (`land_hexes_by_coverage_cell`) sa `i64` (rzutowanie z `Number(parts[i])`); dla kluczy niekanonicznych (np. `"1.5,2"`, `"x,y"`) web zachowywalby sie inaczej niz Rust (NaN-owy klucz komorki). `NIE_ZMIERZONO` - nieosiagalne w grze. `js_num_str` odtwarza `String(number)` dla liczb calkowitych, `NaN`, `Infinity`, `-0` (-> `"0"`); dla ulamkow uzywa najkrotszej reprezentacji Rust, ktora rozni sie od JS tylko zapisem wykladniczym (>= 1e21, < 1e-6) - nieosiagalne w kluczach.
2. **Wejscia calkowite w partycjach**: `continentOf` (indeksy) i `nContinents` sa calkowite (tak je daje generator); dla wartosci ulamkowych web rzuca `TypeError` (`zones[ci]` jest `undefined`), Rust obcina indeks. Wartosci poza zakresem (ujemne, `>= n`) sa obcinane jak w webie (`Math.min(n-1, Math.max(0, v))`); wektory `partition` zawieraja takie przypadki (`-3`, `n`, `n+5`) i `n = 0`.
3. **Kolejnosc `Object.keys` / `Map` / `Set`**: `HexRecord` zachowuje kolejnosc wstawiania; `Set` argumentow = lista bez duplikatow w kolejnosci pierwszego wystapienia. Klucze zawieraja przecinek, wiec nie sa "indeksami calkowitymi" JS i nie sa przestawiane.
4. **Sortowania**: wszystkie 7 `Array.prototype.sort` w zakresie (kandydaci malejaco wg szumu, ranking wymuszania, szum rosnaco w capach, komorki wg obecnosci pakietu) maja komparatory przechodnie, ale uzyto `js_array_sort_by` (TimSort V8) - stabilnosc i kolejnosc przy remisach zgodne z V8 niezaleznie od danych. Wektory zawieraja mapy z duzym odsetkiem REMISOW szumu (tryb `quant`: 12 poziomow).
5. **`reliefGridCoverageRatio` bez tieru** (:1999-2006): web wola `ironGridCoverageRatio(keys, hexes, size)` bez tieru, wiec liczy pakiety dla `medium` nawet gdy rozmiary komorek pochodza z innego tieru (`assertReliefGridCoverage`); odtworzone 1:1 (`DensityTier::Medium`), wektory `ratios` ze wszystkimi trzema tierami to dowodza.
6. **`ensureMass*` liczy `eligibleCells` JEDEN raz** (przed ciecieniem sufitu), a kolejnosc komorek sortuje przed kazdym przebiegiem wg biezacej obecnosci pakietu - odtworzone (rozne wyniki, gdyby filtr liczyc po capie).
7. **`capReliefOverflowInCell` i `forceReliefInCell`** (deprecated, prywatne, martwy kod weba): pierwsza uzywa `||` (SKRACA: wzgorza tylko, gdy gory nic nie zmienily), druga WOLA OBA (zmiana `a || b` na `a` jest wykrywana, §6b). Obie zportowane i zmierzone wektorami.
8. **`forceReliefTypeInCell`, trzecia galaz (`ranked` wg szumu po dwoch `null` z `pickReliefForceHex`)** jest **nieosiagalna**: drugie wywolanie `pick` ma te same filtry co trzecia galaz, wiec `null` oznacza pusty `ranked` i petla konczy sie `break`. Port zachowuje te galaz 1:1; mutacje w niej sa rownowazne (§6a).
9. **Straznik petli** `guard++ < land.length + 8` nigdy nie wygasza petli przed `break` (kazda iteracja zuzywa inny heks przez `placed`, a komorka ma `land.length` heksow) - port odtwarza go 1:1 (post-inkrementacja: `guard` rosnie tylko przy prawdziwym pierwszym warunku), wartosc `+8` w tabeli.
10. **Ochrona zloza** (`isDepositProtectedFromOverflowCap`): heks z `zloze` nie jest przycinany; `forceReliefTypeInCell` i capy ZERUJA `zloze` (`delete`), co Rust odtwarza przez `has_deposit = false`. Oba kierunki sa w wektorach (zloza 0-30% heksow).
11. **`mapGenReliefOverflowCapFrac`**: `typeof row.mountain === 'number' && row.mountain > 0` - `0`, ujemne, `NaN`, tekst, `null` i brak pola daja fallback. `resolve_overflow_cap_frac(Option<f64>, ...)` z `filter(|v| *v > 0.0)` (`NaN > 0` falsz) odtwarza to; zmierzone na webie dla 11 wariantow JSON.
12. **Rust `as usize` na `f64` saturuje** (ujemne -> 0): w `land_partition_keys_for_distribution` dolny clamp `js_max(0.0, raw)` jest wiec obserwowalnie nadmiarowy w Rust, ale zostaje (web go ma; mutacja jego usuniecia jest rownowazna, §6a). Gorny clamp `js_min(n-1, ...)` jest istotny (wykrywany: indeks poza zakresem).
13. **Wejscia `NaN`** w capach/`minLand` sa zmierzone (`caps`: `NaN`, `Infinity`, ujemne, ulamkowe; `minLand`: `NaN`, `+-Infinity`, `-0`, 1e300).

## 6a. Mutacje rownowazne (nie do wykrycia testem - uzasadnienie z KODU, potwierdzone empirycznie)

Lista `EQUIVALENT` w `mut-runner-m05a.py` (uruchamiana `--equiv`; oczekiwane: WSZYSTKIE testy zielone = mutacja PRZEZYLA):

1. `eq-dist-inside-square-zero` (usuniecie `if square.has(...) { return 0.0 }` w `hex_distance_to_center_square`): gdy klucz jest w kwadracie, petla `min` po kluczach i tak zwroci odleglosc 0 do samego siebie (`hexAxialDistance(q,r,q,r) = 0`). Skrot jest tylko optymalizacja.
2. `eq-dist-empty-keys-zero`: `ContinentCenterSquare.keys` nigdy nie jest pusty (fallback na `landKeys`, a `landKeys` niepuste); galaz `size == 0` w `hexDistanceToCenterSquare` jest nieosiagalna dla wartosci zwroconych przez `continentCenterSquare`.
3. `eq-partition-lower-clamp`: patrz §6 pkt 12 (Rust `as usize` saturuje ujemne do 0).
4. `eq-apply-nonpositive-count-lt` (`n_mtn <= 0.0` -> `< 0.0`): dla `n_mtn == 0` `pick_spread_relief_keys` zwraca pusta liste (`count <= 0`), czyli petla zmian nie robi nic - wynik identyczny.
5. `eq-apply-empty-keys-guard`: dla pustych `keys` `land_hexes_by_coverage_cell` zwraca zero komorek, wiec obie funkcje nic nie robia.
6. `eq-pick-spread-count-le-to-lt` (`count <= 0.0` -> `< 0.0`): dla `count == 0` pierwsza petla konczy sie natychmiast (`len >= 0`), druga tez - lista pusta jak w oryginale.
7. `eq-force-guard-ge-to-gt` / `eq-tbl-guard-extra` (straznik petli, §6 pkt 9): nieosiagalny, bo `placed` ogranicza liczbe iteracji do `land.len()`.
8. `eq-force-third-branch-sort` (§6 pkt 8): trzecia galaz jest nieosiagalna.
9. `eq-cap-min-guard-dropped` (`total > min` w petli przycinania): `max >= min` zawsze (`js_max(min, ...)`) przy mnozniku >= 1, wiec `total > max` implikuje `total > min`. Przy zmianie mnoznika w tabeli na < 1 mutacja staje sie istotna (to samo mowi `values_have_sane_shape`: mnoznik > 0).
10. `eq-ensure-never-breaks-early` (`inner == 0` -> `inner < 0`): po zbieznosci kolejne przebiegi nic nie zmieniaja (komorki maja pakiety, `force` zwraca `false` bez losowania) - wynik i zuzycie `rand` identyczne, rozni sie tylko czas.
11. `eq-assert-coverage-ge-to-gt` (`>= 0.999` -> `> 0.999`): wskaznik to `hit/need` z `need <= 1000`; wartosc dokladnie `0,999` wymagalaby 999/1000 (lub wielokrotnosci), co nie wystepuje w wektorach. Mutacja zmienia wynik tylko dla `need = 1000k`; na mapach gry (<= ~100 komorek) nieosiagalne.

12. `ensure-copper-uses-iron-size`, `apply-iron-uses-copper-cell`: tabele rozmiarow komorek zelaza i miedzi sa w webie IDENTYCZNE (`gen-helpers.ts`:1809-1822), wiec zamiana jednej funkcji na druga nie zmienia wartosci. Mutacja stalaby sie istotna dopiero po rozjechaniu tabel w danych (wtedy `consts_and_tier_tables_match_web` jest czerwony).
13. `force-shallow-penalty-sign`, `tbl-shallow-penalty`: kara za `PlytkieMorze` w `pickReliefForceHex` jest KODEM MARTWYM takze w webie - `PlytkieMorze` jest woda i odpada we wczesniejszym filtrze `isWaterTerrain`; galaz nigdy sie nie wykonuje (potwierdzone wektorami `pickForceWater`, ktore zawieraja `PlytkieMorze`).
14. `ensure-sort-reversed`: komorki sa rozlaczne, petla dziala tylko na komorkach bez pakietu i kazde `force_*` dotyka tylko wlasnej komorki; kolejnosc (stabilny TimSort po fladze pakietu) nie zmienia wyniku, a `rand` zuzywane jest przez kazda komorke z osobna w tej samej kolejnosci wzglednej (komorki z pakietem sa pomijane).
15. `force-initial-ge-to-gt` (`count >= min` -> `count > min` w pierwszym wyjsciu `force_relief_type_in_cell`): przy rownosci petla wymuszania sama sprawdza licznik przed pierwsza iteracja i nic nie dodaje.
16. `force-placed-not-recorded` (brak `placed.insert(k)`): wymuszony heks ma juz docelowy teren, a filtr `pickReliefForceHex` odrzuca heksy docelowego terenu, wiec zbior `placed` jest redundantny.
17. `ensure-pass-not-incremented-twice`, `tbl-passes` (`max_przebiegow_domykania_komorek` 14 -> 1): `force_*_in_cell` jest idempotentne (petla do minimum albo wyczerpania kandydatow), wiec drugi przebieg daje 0 napraw; liczba przebiegow wiecej niz 1 nie zmienia wyniku ani zuzycia `rand`.
18. `cap-clears-deposit-removed` (`has_deposit = false` przy przycinaniu): przycinany heks nie jest chroniony, a chroniony == ma zloze, wiec przycinany heks nigdy nie ma zloza - zerowanie flagi jest redundantne.

19. `eq-tbl-guard-extra` jest jedyna z 22, ktora NIE przezyla pelnego zestawu: wykryl ja `values_have_sane_shape` (test ksztaltu tabeli wymaga `dodatek_do_straznika_petli >= 1`), a nie test wektorowy - zgodnie z oczekiwaniem (zachowanie programu jest rownowazne, ale tabela z wartoscia 0 jest odrzucana jako niepoprawna).

Wynik empiryczny (`mutations-r1-equiv.log`, §11.11): 21 z 22 mutacji rownowaznych przezylo wszystkie testy (oczekiwane: wszystkie); wykryte: ['eq-tbl-guard-extra'].

## 6b. Mutacje - wyniki

**132 mutacje WYKRYTE** (celowany test czerwony) **+ 10 mutacji, ktore przezyly testy i sa udowodnionymi ROWNOWAZNOSCIAMI** (przeniesione do `EQUIVALENT`, §6a; razem 142 wpisy; to NIE jest "132 z 132"). 0 bledow kompilacji/timeoutow w stanie koncowym, 0 NIE URUCHOMIONO. W trakcie rundy przezylo 13 wpisow: 3 rozstrzygnieto jako WYKRYTE po poprawce/nowych wektorach, 10 jako rownowaznosci (§6a/§6b).

Wykryte (132): group-bfs-queue, group-neighbor-water-ignored, group-start-water-ignored, river-land-polar-removed, partition-upper-clamp-removed, cells-floor-to-trunc, forest-eligible-desert, bonus-cap-mountain-ceil-to-floor, overflow-resolve-mountain-ge, min-land-floor-to-ceil, deprecated-min-mountains-tier, iron-package-ge-to-gt, coverage-empty-ratio-zero, apply-sort-ascending, rank-ignores-candidate-filter, pick-spread-dist-ge-to-gt, force-no-rand-call, force-protect-highland-le-to-lt, deposit-protection-off, cap-spread-skips-highland, ensure-skip-cap-ignored, centroid-count-doubled, partition-islands-to-pangea, cells-r-floor-to-trunc, bonus-cap-highland-ceil-to-floor, overflow-resolve-highland-nan-only, min-land-max-to-min, tier-value-low-reads-medium, copper-package-ge-to-gt, coverage-min-land-lt-to-le, apply-iron-skips-hills, rank-ignores-world-type, pick-spread-second-pass-off, force-rank-ascending, force-protect-mountain-le-to-lt, cap-protected-not-skipped, ensure-eligible-ge-to-gt, center-span-le-to-lt, cap-spread-min-land-lt-to-le, partition-keeps-empty-zones, spread-cap-mountain-max-to-min, tbl-fallback-mountain-medium, tbl-min-land-floor, forest-cap-reads-share, has-mountain-always, relief-ratio-sum-not-averaged, apply-copper-skips-mountains, pick-spread-axial-drops-s, force-highland-mult-dropped, force-clears-deposit-removed, cap-total-gt-to-ge, cap-spread-not-spread, center-round-to-floor, partition-missing-entry-default, spread-cap-highland-ceil-to-floor, tbl-fallback-highland-low, tbl-min-land-fraction, center-size-plus-one, relief-package-and-to-or, relief-ratio-default-tier, apply-iron-bonus-floor, pick-spread-count-ge-to-gt, force-clears-overlay-removed, cap-mountain-drops-to-plains, center-round-r-to-floor, partition-needs-positive-n, spread-frac-mountain-uses-highland, fair-play-size-uses-forest, eligible-relief-counts-water, apply-copper-bonus-floor, pick-spread-axial-ds-sign, force-border-dist-unclamped, cap-highland-drops-to-grass, ensure-fixed-counts-double, center-half-floor-to-ceil, tbl-bonus-mountain-medium, river-sources-plus-one, host-min-land-lt-to-le, assert-coverage-lt, apply-iron-min-to-max, force-avoid-ignored, force-loop-ge-to-gt, cap-sort-descending, ensure-copper-checks-iron-package, center-qmax-le-to-lt, tbl-bonus-highland-high, tbl-center-size, host-river-negated, tbl-copper-multiplier, apply-copper-min-to-max, force-protect-highland-ignored, cap-mountain-bonus-without-min, ensure-cap-copper-caps-mountains, center-rmin-ge-to-gt, tbl-forest-share-medium, eligible-forest-uses-water-test, tbl-coverage-threshold, apply-iron-keeps-overlay, force-protect-mountain-ignored, force-second-pick-keeps-protect, cap-highland-bonus-without-min, center-fallback-disabled, tbl-forest-cap, apply-copper-keeps-overlay, force-wrapper-iron-uses-highland, cap-mountain-spread-flag-ignored, ensure-iron-wrapper-want, dist-axial-divisor, tbl-min-mountains-medium, apply-iron-min-land-lt-to-le, tbl-highland-multiplier, force-deprecated-short-circuits, cap-highland-spread-flag-inverted, tbl-min-highlands-high, apply-copper-min-land-lt-to-le, tbl-border-cap, force-deprecated-uses-low-tier, tbl-water-cell-low, tbl-border-weight, cap-clears-overlay-removed, tbl-forest-cell-medium, apply-mass-set-not-deduped, cap-relief-no-short-circuit, tbl-river-sources, tbl-spread-mountain-dist, tbl-rand-weight, tbl-overflow-multiplier, tbl-spread-highland-dist, tbl-iron-cell-medium, tbl-copper-cell-high, relief-ratio-copper-size-unrounded, force-water-allowed.

Przezyly OSTATECZNIE na liscie `MUTATIONS` (10): ensure-copper-uses-iron-size, force-shallow-penalty-sign, ensure-sort-reversed, force-initial-ge-to-gt, force-placed-not-recorded, ensure-pass-not-incremented-twice, tbl-passes, cap-clears-deposit-removed, apply-iron-uses-copper-cell, tbl-shallow-penalty.

Przezyly w trakcie rundy (13, historia w logach a-e): cap-spread-min-land-lt-to-le, ensure-copper-uses-iron-size, force-shallow-penalty-sign, ensure-sort-reversed, force-initial-ge-to-gt, force-placed-not-recorded, ensure-pass-not-incremented-twice, force-water-allowed, tbl-passes, cap-clears-deposit-removed, apply-iron-uses-copper-cell, tbl-shallow-penalty, relief-ratio-copper-size-unrounded (pierwotnie zapisany z bledem jako `relief-ratio-copper-size-unrounded:`). Rozstrzygniecie: `cap-spread-min-land-lt-to-le` i `force-water-allowed` zostaly WYKRYTE po dodaniu wektorow (mapy brzegowe, `pickForceWater`), `relief-ratio-copper-size-unrounded` mial blad kompilacji w pierwszej postaci i po poprawce (`f64::floor(`) jest WYKRYTY (`mutations-r1-f.log`); pozostale 10 sa udowodnionymi ROWNOWAZNOSCIAMI i zostaly przeniesione do listy `EQUIVALENT` (§6a pkt 12-18; potwierdzone `--equiv`).

Blad kompilacji/timeout w stanie koncowym: 0. (Wpis `relief-ratio-copper-size-unrounded` - w historii logu z bledna nazwa ze znakiem `:` na koncu - mial blad kompilacji w pierwszej postaci; po poprawce na `f64::floor(` jest WYKRYTY i figuruje na liscie 132.)

NIE URUCHOMIONO (0): brak.

Przywracanie: po KAZDEJ mutacji `git checkout -- <plik>`, kontrola `git status --porcelain --untracked-files=no` (puste) i SHA-256 BAJTOW z dysku (`PRZYWROCONO ... =OK` w kazdym wierszu logu); skroty poczatkowe i koncowe w logach. Jedna kompilacja naraz (na tym samym `CARGO_TARGET_DIR`). Logi: `mutations-r1-a.log` ... `-e.log` (przebiegi przerywane z zewnatrz i wznawiane z `--skip`: proces tla znikal po kilku minutach bez sladu w logu - na wspoldzielonej maszynie dzialaja inne sesje, a pierwszy przebieg wywolywal nazwe `run-mutations.py`, wspolna z innymi tematami; skrypt przemianowano na `mut-runner-m05a.py` i dodano powtarzanie przy sygnale/ENOSPC; zadna przerwa nie zostawila zmutowanego pliku - kontrola `git status` + SHA po kazdej mutacji i na starcie kazdego przebiegu), `mutations-r1-equiv.log`.

## 6c. Runda 1 - odpowiedzi na zarzuty Evaluatora (obrona)

Kod Rust, tabela JSON i wektory NIE zmienione w obronie (bramki fmt/clippy/test z r1 pozostaja wazne; zmiana dotyczy wylacznie dokumentu i skryptu `tamper-vectors.py`).

1. PRZYJETY - sformulowanie §0/§6b: 132 wykryte + 10 rownowaznosci (142 wpisy), nie "132 z 132"; nazwa `relief-ratio-copper-size-unrounded:` wyjasniona jako historyczny blad zapisu (poprawiono w §0 i §6b).
2. PRZYJETY - `tamper-vectors.py` zmienia teraz po jednej wartosci w KAZDEJ z 25 kategorii; `verify-m05a-negative-r2.log`: `checks=88941 rozbieznosci=25`, `EXIT=1`; wektory nietkniete: `verify-m05a-r2.log` `rozbieznosci=0`, `EXIT=0`.
3. ODRZUCONY (zachowanie): `max_przebiegow_domykania_komorek` jest strzezony regexem weryfikatora wzgledem TS (`50/50`) i testem ksztaltu tabeli; wektor nie moze go odroznic, bo wynik nie zalezy od wartosci (dowod: mutacja `tbl-passes`, §6a). Sztuczny wektor wymagalby zmiany semantyki weba.
4. ODRZUCONY (zachowanie weba): `kara_plytkie_morze` jest martwa takze w webie (plytkie morze odpada wczesniej jako woda); port odtwarza to 1:1, wartosc zachowana w JSON ze `zrodlo_web` (§6a, mutacja `tbl-shallow-penalty`).
5. ODRZUCONY: `ensure-sort-reversed` - komorki sa rozlaczne, wiec kolejnosc przetwarzania nie zmienia ani stanu, ani sekwencji `rand` (wynik wektorow `ensureMass` zgodny bitowo, w tym `calls`/`next`); potwierdzenie empiryczne = przezycie mutacji we wszystkich testach (§6a).
6. ODLOZONY do M05B (uwaga, nie wada): wspolne `js_max/js_min/js_round` i jeden `OnceLock` na `MapGenParamsFile` zostana wyniesione, gdy M05B dotknie `relief.rs`; zmiana teraz wykraczalaby poza allowliste (`params.rs`, `prims.rs`) i ryzykowalaby 1036 testow bez zysku funkcjonalnego.
7. ODRZUCONY (niespojnosc dispatchu, nie kodu): obowiazuje allowlista `p6_m05a_*` i baza >= 1009 (silnik: 1036 passed); `p6_1_*`/865 to pozostalosc starej wersji kryterium.

## 7. Bramki (surowe, PELNE logi w runie, kazdy z `EXIT=`)

Budowanie: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_3c3a998e-4cb-1 CARGO_PROFILE_DEV_DEBUG=0`, `--offline`, w `rust-port/engine`. Po pracy katalog targetu usuniety.

- `gate-fmt-r1.log`: `cargo fmt -- --check` -> `EXIT=0`.
- `gate-clippy-r1.log`: `cargo clippy --offline --all-targets -- -D warnings` -> `EXIT=0`.
- `gate-test-r1.log`: `cargo test --offline --no-fail-fast` -> `EXIT=0`, 1036 passed, 0 failed.
- `gate-diffcheck-r1.log`: `git diff --check` / `git diff --cached --check` -> `EXIT=0`.
- `gen-m05a-r1.log`: generator wektorow -> `EXIT=0`; powtorzenie daje ten sam SHA-256.
- `verify-m05a-r1.log`: weryfikator -> `EXIT=0`, 0 rozbieznosci; `verify-m05a-negative-r1.log`: test negatywny -> `EXIT=1`, 12 rozbieznosci.

## 8. Zmiany (allowlista)

Dokument: `dyspozycje/rust-port/p6/P6-M05A-RELIEF-A-MASY-POKRYCIE.md` (nowy), `dyspozycje/autobot/runs/R-RUSTPORT-P6-M05A-RELIEF-A-MASY-POKRYCIE-Q1/**`. Kod: `rust-port/engine/src/domain/mapgen/relief.rs`, `rust-port/engine/src/data/derived.rs` (dopisek na koncu), `rust-port/engine/data/derived/mapgen-relief-a.json` (nowy), `rust-port/engine/tests/p6_m05a_{tables,masses,relief,cover}.rs`, `rust-port/engine/tests/p6_m05a_vectors/**`. **Zero zmian** w `bridge.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `domain/mod.rs`, `tests/p6_m00_skeleton.rs`. `Cargo.lock` (nieskledzony, wygenerowany przez cargo) NIE jest commitowany.

## 9. Odczyt zrodel (liczby linii) i dokumenty

- Web (pin `edb8fb56`, `wc -l`): `gen-helpers.ts` **12 561** linii. **Zakres M05A (:1408-2365, 958 linii) przeczytany w CALOSCI** (odczyt `sed -n` w blokach 1408-2442, czyli z nadmiarem do ciala `ensureReliefGridCoverage`). Doczytane zaleznosci: `:1-80` (naglowek, importy, PRNG), `:120-170` (geometria, `isWaterTerrainLocal`, `hexKey`), `:840-860` (`TerrainScratch`), `:1160-1185` (`reliefLandFractions`), `:1325-1375` (`hexBorderDistance`, `isReliefCandidateHex`), `:3195-3215` (`parseHexKey`), `:5190-5200` (`hexAxialDistance`), `:6850-6862` (`isRiverLandTerrain`), `:8350-8400` (`landHexesByCoverageCell`); `map-gen-params-loader.ts` `:1-10`, `:36-40`, `:85-87`, `:150-170`; `data/map-gen-params.json` `:40-80`; `types/hex.ts` `:12-39`. **Reszta pliku (:81-119, :171-839, :861-1159, :1186-1324, :1376-1407, :2443-3194, ...) NIE przeczytana w calosci - NIE_ZMIERZONO** (zakresy innych tematow; weryfikator liczy jednak `gen-helpers.ts` jako CALOSC przez SHA-256 i uruchomiony kod).
- Rust: `relief.rs` (szkielet), `terrain_class.rs` (naglowek `:1-130`, `:250-520`, `:885-920`, `:1176-1200` - sygnatury i `ForestOverlayHooks`), `prims.rs` (sygnatury), `params.rs` (`DensityTier`), `cluster_mass.rs` (`js_array_sort_by`), `data/terrain_map.rs` (`MapGenParamsFile`, `ReliefOverflowCapFrac`), `data/derived.rs` (`StartValue`, `TierTriple`, koncowka), `tests/p6_m00_skeleton.rs` (calosc), `tests/p6_m04_*.rs`, `tests/p6_m04_vectors/common.rs` (wzorzec).
- Dokumenty (z `claude/sprawdzenie-funkcjonalnosci-ek4ra0` przez `git show origin/...:<sciezka>` do scratch poza repo, potem `Read`): `00-dispatch.md` w calosci; `P6-M04-TEREN-KLASYFIKACJA-GRANICE.md` (struktura, §00-§11 naglowki + §0-§3, §9a), skrypty M04 (`gen-m04-vectors.mjs`, `verify-m04-vectors.py` (TimSort, helpery), `mut-runner-m05a.py`, `tamper-vectors.py`, `m04-loader-*.mjs`) z repo.

### 9a. Dokumenty obowiazkowe z dispatchu - dowod odczytu i skutki dla portu

| Dokument | Linie | Przeczytane (zakresy) | NIEPRZECZYTANE (jawnie) | Wniosek wazny dla M05A |
|---|---|---|---|---|
| `p6/P6-0-GAP-ANALYSIS.md` | 435 | 1-150 (§0, §1, §1a, §2, poczatek §3 wiersze 1-51), 284-435 (§4, §5, §6b, §6b-i, §6a, §7, §8, §9) | 151-283 (wiersze 52-183 tabeli §3, wszystkie dotycza `gra/src/game/**`; wiersze P6.1 znalezione `grep -nE 'P6\.1 '` i przeczytane osobno) | §3 dotyczy WYLACZNIE `gra/src/game/**`; `gen-helpers.ts` lezy w `gra/src/map/` (zakres P6-25), wiec M05A nie ma wiersza w §3. §0: PORTOWANE-1:1 = 0 do czasu wektorow z weba - M05A przyznaje PORTOWANY wylacznie z wektorem i testem. §5b: `domain/rng.rs` vs `mulberry32` w `gen-helpers.ts` wymaga wektorow - M05A nie uzywa PRNG poza `rand` wstrzyknietym (test ma wlasny `mulberry32` z `prims::mulberry32_step`, zweryfikowany M01). §6b-i: wspolna sciezka `data/derived.rs` (dopisek na koncu) dopuszczona; allowlisty M05A rozlaczne z M05B (wspolny `relief.rs`, SEKWENCYJNIE). |
| `p3/P3-22-FLATTEN-STAGE2.md` | 441 | 1-441 (calosc) | - | Wzorzec: stale/mnozniki -> tabele `data/derived/*.json` + parser; testy BEZ pinow wartosci (§12.0 pkt 5: porownanie tabeli z literalem w tescie = pin - dlatego `p6_m05a_tables.rs` pilnuje ksztaltu, a parytet - wektory); status per wiersz z plik:linia; generator URUCHAMIA kod weba; weryfikator niezalezny z testem negatywnym; zakaz etykiet ogolnych. **Pozycja 35j (`RELIEF_OVERFLOW_CAP_MULT`, `gen-helpers.ts:2181`) lezy W ZAKRESIE M05A** - rozwinieta do tabeli `sufit_przepelnienia.mnoznik` (zgodnie z P3-23: "spłaszczenie staje się KRYTERIUM AKCEPTACJI tematu P6", LEDGER wiersz 164); `MOUNTAIN_RANGE_REGROW_TARGET_MULT` (:2480) nalezy do M05B. |
| skrypty `R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/` | `gen-loader-hooks.mjs` 28, `gen-loader-register.mjs` 3, `gen-diplomacy-web.mjs` 67, `gen-combat-web.mjs` 73, `gen-trade-web.py` 43, `verify-combat-web.py` 174, `verify-diplomacy-web.py` 176, `verify-trade-web.py` 66 | wzorzec loadera (`gen-loader-*.mjs` == `m04-loader-*.mjs` == `m05a-loader-*.mjs`) i struktura generatorow/weryfikatorow przeczytane przez pliki M04, ktore je kopiuja; skrypty P3-22 przeczytane tylko pod katem wzorca (nie linia po linii) | `gen-combat-web.mjs`, `gen-trade-web.py`, `verify-*.py` P3-22 (kopiowane i rozszerzone w M04; ich logika nie dotyczy relief) | `node --experimental-transform-types` jest wymagany dla enumow TS (jak w P3-22/M04). |
| `p2/P2-3-ENTITY-IDS.md` | 380 | 1-380 (calosc) | - | D-ID-6 (kanon pozycji `HexCoord{q:i32,r:i32}`): M05A liczy `q`/`r` jako `i64` (siatka mapgen, jak M04) i `f64` (funkcje liczbowe); NIE wprowadza nowego typu pozycji w `GameState`; klucze heksow `"q,r"` to NIE identyfikatory bytow (D-ID-1..3 ich nie dotycza). `grep` po symbolach relief (`relief`, `gen-helpers`, `groupLandMass`, `mapgen`) w dokumencie = 0. |
| `p2/P2-5-COMMANDS.md` | 668 | 1-110 (naglowek, §0, §1, §2.1-§2.2); reszta przeszukana `grep -nEi 'generat\|relief\|gen-helpers\|mapgen\|new_game\|seed\|start_game\|Z5'` | 111-668 (§2.3-§2.13, §3-§9: tabele akcji dyplomacji, handlu, badan, jednostek, zapisu; mutator-review) | Funkcje M05A to czysta logika generatora mapy, nie komendy gracza; jedyny zwiazek: Z5 "Nowa gra" (`create_session`, `bridge.rs:263-266`) - poza M05A. Zadne trafienie na relief/gen-helpers/mapgen w nieprzeczytanej czesci. |
| `PLAN-PORT-RUST-TAURI-20261020.md` | 305 | 1-305 (calosc, §P6 = 197-222) | - | P6.1 (stan poczatkowy/seed/inicjalizacja) i P6.3 (teren) jako ramy; zasady: web = referencja read-only, zakaz "drugiej uproszczonej gry", test stanu przed/po, przypadki negatywne - M05A spelnia. Limit 5 rund, jeden pisarz na worktree, brak `git add -A`. |
| `LEDGER.md` | 207 | 1-30 (naglowek, scheduled task, rundy PROJECT-INIT/P0), 150-207 (calosc: P4.17 ... P6-M04, P5-6), z 31-149 wiersze z `grep -nE 'mapgen\|M05\|relief\|gen-helpers\|P6\|M04\|M03'` (obciete do 500 znakow) | pozostale wiersze 31-149 (historia P1-P4, nie dotyczaca relief) | **Wiersz 164 (P3-23):** spłaszczenie `MAPA 35j-k` ma byc KRYTERIUM AKCEPTACJI tematow P6 (tabela edytowalna + generator z weba + weryfikator, bez literalow) - M05A to spelnia dla `RELIEF_OVERFLOW_CAP_MULT`. **Wiersz 201 (M03)** i **206 (M04):** `data/derived/mapgen-*.json` + parser w `derived.rs` poza allowlista dispatchu = "dziura w dispatchu, nie defekt" (ratyfikacja orkiestratora); w M05A dispatch wymienia `derived/*.json` i `derived.rs` WPROST (brak sprzecznosci). Wiersz 201: duplikacja jader `k_sin/k_cos/rem_pio2` (`prims.rs`/`masks::v8math`) - NIE ruszane (dispatch). Wiersze 183/188: test szkieletu M00 (`skeleton_headers_name_full_owner_ids_from_table` parsuje linie `Temat wlasciciel:` - naglowek `relief.rs` musi miec OBA ID M05A/M05B w jednej linii; pierwsza wersja miala je w dwoch liniach i test padl - poprawione, `gate-test-r1.log`). Wiersz 206: odkrycie `map_generator::hash_int3` - nie dotyczy M05A. |

## 10. Ryzyka / do Evaluatora i orkiestratora

1. **`ensureReliefGridCoverage` i dalej (:2371+)** nie naleza do M05A - M05B musi dopisac je w TYM SAMYM pliku `relief.rs` (sekwencyjnie) i moze uzyc `ensure_mass_iron_grid_coverage` / `ensure_mass_copper_grid_coverage` / `cap_iron_cell_relief_spread` / `group_land_mass_keys` / `land_hexes_by_coverage_cell` / `iron_coverage_cell_size` itd. (wszystkie `pub`). Pole `pub type Rand<'a>` jest wspolne.
2. **Struktura implementujaca `ForestOverlayHooks`** (M04) nie zostala utworzona (wymaga `build_sea_distance_field` :5614, inny temat) - przy integracji (M18) mozna zlozyc ja z wolnych funkcji M05A + M06.
3. **Zdublowane pomocniki**: `hex_distance_axial_f64`, `hex_axial_distance`, `is_river_land_terrain`, `land_hexes_by_coverage_cell`, `js_max/js_min/js_round/js_num_str` sa lokalne w `relief.rs` (jak w M04: `terrain_class.rs` ma prywatne `js_max/js_min/js_round`); po portach zakresow wlascicieli nalezy zdeduplikowac (funkcje sa `pub`/lokalne, kontrakt zamrozony wektorami).
4. **Martwy kod weba zportowany** (`forceReliefInCell`, `capReliefOverflowInCell`, deprecated stale/funkcje): zachowuje pelnosc zakresu; mozna usunac razem z odpowiednikami web.
5. **Czas testow**: `p6_m05a_cover` ~35 s, `p6_m05a_masses` ~50 s, `p6_m05a_relief` ~35 s (profil `dev`, przy obciazeniu maszyny); testy zbiorcze `cargo test` rosna o ok. 2 minuty (rownolegle binarki).
6. **Cargo.lock**: `cargo` utworzyl lokalny `Cargo.lock` (nieobecny w repo) - NIE commitowany, zgodnie z dispatchem.
7. **Niezmierzone**: zachowanie V8 w innych wersjach niz Node v22.22.0 (sortowanie stabilne od V8 7.0; `Math.round` zgodne z ES), inne silniki JS, klucze heksow niekanoniczne (§6 pkt 1), wartosci ulamkowe `continentOf` (web rzuca).
8. **Mutacje niewykonane**: patrz §6b - jesli lista "NIE URUCHOMIONO" jest niepusta, to wyłacznie z powodu czasu (kompilacja ~90 s na mutacje przy obciazeniu maszyny 20+); kazda ma gotowy fragment `old`/`new` pasujacy do kodu (`--dry`: 132 + 22 OK).

## 11. Surowe, PELNE wyjscia bramek (kopie plikow runu, bez wyciagow; kazde z `EXIT=`)

### 11.1 cargo fmt -- --check (gate-fmt-r1.log)

```text
EXIT=0
```

### 11.2 cargo clippy --offline --all-targets -- -D warnings (gate-clippy-r1.log)

```text
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_3c3a998e-4cb-1/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 2m 55s
EXIT=0
```

### 11.3 cargo test --offline --no-fail-fast (gate-test-r1.log)

```text
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_3c3a998e-4cb-1/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 3m 10s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 13 tests
test ai_turn_default_city_parameters_match_ai_params_json ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test command_wire_shape_is_stable_for_engine_integration ... ok
test hex_city_score_enemy_penalty_follows_threat_range_option ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test wounded_units_retreat_before_attacking ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test counts_per_extension_match_p1_11 ... ok
test byte_sums_per_category_match_p1_11 ... ok
test manifest_dest_paths_are_unique ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_size ... ok
test negative_validator_rejects_wrong_sha ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test sha1_matches_known_vectors ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.56s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test effective_work_cost_is_raw_work_web_one_to_one ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_id.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/city_id-693b1037fdbc4b08)

running 6 tests
test barbarian_city_garrison_json_keeps_numeric_city_id ... ok
test city_id_map_keys_stay_numeric_in_json ... ok
test city_id_conversions_round_trip ... ok
test barbarian_cleared_cities_round_trip_as_numbers ... ok
test city_id_ordering_matches_raw_value ... ok
test city_id_serializes_as_bare_number ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/combat-7737db4785daf590)

running 7 tests
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test resolver_is_order_independent_and_preserves_ids ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat_ai_multipliers.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/combat_ai_multipliers-52898acb951a9ad0)

running 5 tests
test las_row_is_class_a_and_marked_read_by_domain ... ok
test city_structure_bonuses_are_positive_and_mur_is_the_largest_single_bonus ... ok
test accessors_return_the_table_value_not_a_constant ... ok
test table_has_each_row_once_with_known_class_and_status ... ok
test veteran_levels_are_complete_and_non_decreasing ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/counter_multipliers.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/counter_multipliers-c944a65d0a384717)

running 5 tests
test explicit_unit_bonus_overrides_table ... ok
test table_type_keys_are_canonical ... ok
test table_lists_each_type_pair_once_with_finite_positive_multiplier ... ok
test domain_reads_table_and_unknown_types_give_no_bonus ... ok
test table_is_readable_for_every_pair_and_misses_are_none ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test buildings_json_parses ... ok
test wonders_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_ai_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test civs_count_and_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test collection_id_sets_match_web_pin ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test rt_ai_params ... ok
test rt_citizen_resource_upkeep ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_auto_battle_params ... ok
test rt_civ_ai ... ok
test rt_civ_params ... ok
test rt_city_names_pools ... ok
test rt_buildings ... ok
test rt_combat_params ... ok
test rt_civs ... ok
test rt_counters ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_e_start_params ... ok
test rt_civ_matrix ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_miasto_params ... ok
test rt_map_gen_params ... ok
test rt_power_params ... ok
test rt_diplomacy ... ok
test rt_resources ... ok
test rt_econ_params ... ok
test rt_terrain_combat ... ok
test rt_tech ... ok
test rt_terrain_movement ... ok
test rt_terrain_improvements ... ok
test rt_society_params ... ok
test rt_terrain_yields ... ok
test rt_ui_params ... ok
test rt_wonders ... ok
test web_pin_constants_are_internally_consistent ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_units ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_missing_file_is_file_missing ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_unreadable_file_is_io ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.36s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test counters_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test auto_battle_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/derived_values.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/derived_values-7eb2b3615468dd51)

running 25 tests
test basket_and_treaty_duration_read_diplomacy_table ... ok
test building_table_has_exactly_the_42_canonical_ids_once_each ... ok
test building_table_key_shape_is_known_resources_and_mirrors_the_base_keys ... ok
test building_gold_upkeep_has_one_row_per_building_level ... ok
test building_table_palac_has_no_stock_cost_and_others_do ... ok
test difficulty_is_one_type_across_domain_modules ... ok
test diplomacy_multipliers_cover_each_constant_once_with_web_values ... ok
test domain_building_costs_read_the_building_table_values_without_recomputing_them ... ok
test domain_recruitment_reads_the_gold_table_without_recomputation ... ok
test gold_table_has_exactly_the_75_units_once_each_and_known_eras ... ok
test improvement_and_wonder_tables_cover_every_entry_once ... ok
test racje_cover_every_half_step_from_zero_to_six_once ... ok
test storage_caps_cover_each_era_and_difficulty_once ... ok
test domain_recruitment_reads_the_unit_table_values_without_recomputing_them ... ok
test building_work_states_cover_each_building_level_and_axis_combination_exactly_once ... ok
test trade_multipliers_cover_each_constant_once_with_values ... ok
test research_costs_cover_each_tech_tempo_and_axis_once ... ok
test unit_table_epoch_field_matches_units_json ... ok
test unit_food_has_twelve_states_per_unit_and_integer_hundredths ... ok
test unit_table_has_one_row_per_units_json_record_and_no_extra_rows ... ok
test unit_gold_states_cover_each_unit_and_axis_combination_exactly_once ... ok
test work_table_is_read_by_the_domain_without_recomputation ... ok
test work_table_has_exactly_the_42_buildings_once_each_and_positive_values ... ok
test unit_table_keeps_the_units_json_base_as_provenance ... ok
test unit_table_key_shape_and_positive_integer_values ... ok

test result: ok. 25 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/diplomacy-d94c0845f92f376e)

running 32 tests
test annexation_requires_vassal_economy_orientation ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test production_diplomacy_api_is_public ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test peace_price_is_independent_of_treaty_duration ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test war_currency_gate_allows_only_peace_settlements ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test diplomacy_unit_prices_match_units_json_for_every_row ... ok

test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/events-987aa8790b10a253)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test coordinates_round_trip_through_the_canonical_map_key ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok
test terrain_movement_costs_are_explicit ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_can_coexist_with_non_food_layers ... ok
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test tile_and_production_are_json_round_trip_safe ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test map_dimensions_and_seed_are_stable ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test river_markers_are_land_and_reach_water ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/owner_ref.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/owner_ref-92f476c7f4239a8a)

running 10 tests
test camp_id_is_a_transparent_newtype ... ok
test owner_and_camp_fields_are_plain_numbers_in_struct_json ... ok
test owner_ref_accessors_and_player_conversion ... ok
test owner_ref_hash_agrees_with_equality ... ok
test owner_ref_refuses_player_ids_that_do_not_fit_the_legacy_number ... ok
test owner_ref_rejects_unknown_negative_numbers ... ok
test owner_ref_serializes_every_variant_as_the_legacy_number ... ok
test player_keyed_maps_keep_numeric_string_keys ... ok
test owner_ref_legacy_conversions_match_the_sentinels ... ok
test owner_ref_ordering_matches_the_legacy_i64_order ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1_civ_entry_epoch.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_1_civ_entry_epoch-c29112b12d237024)

running 8 tests
test civ_availability_matches_web_vectors_for_every_game_epoch ... ok
test civ_entry_epoch_matches_web_vectors ... ok
test game_epoch_hud_label_matches_web_vectors ... ok
test civ_ids_available_match_web_roster_vectors ... ok
test civ_entry_label_matches_web_vectors ... ok
test game_epoch_index_matches_web_for_every_probe ... ok
test game_epoch_order_matches_web ... ok
test strict_epoch_ids_reject_non_canonical_spellings ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1_first_player_city.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_1_first_player_city-e31375affc71b1c0)

running 5 tests
test awaiting_first_city_matches_web_for_owner_zero ... ok
test awaiting_first_city_matches_web_for_explicit_owner_one ... ok
test validate_placement_matches_web_vectors ... ok
test hex_in_start_reveal_matches_web_vectors ... ok
test denied_message_matches_web_constant ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1_owner_seats.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_1_owner_seats-1a3aae5c483a1e2f)

running 6 tests
test hot_seat_cycles_and_skips_unknown_active ... ok
test human_owner_primary_matches_web ... ok
test human_seats_match_web_vectors ... ok
test major_ai_owner_matches_web_vectors ... ok
test stub_constants_are_the_web_sentinels ... ok
test web_owner_minus_five_is_out_of_domain_and_not_representable ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1_rng_mulberry.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_1_rng_mulberry-617bdab005dd8b1f)

running 2 tests
test mulberry32_is_not_the_lcg_stream ... ok
test mulberry32_matches_web_make_rng_vectors_bit_for_bit ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1b_playerstate.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_1b_playerstate-7e0df28b40755091)

running 19 tests
test parity_cheapest_tie_break_uses_utf16_order ... ok
test parity_constants_and_defaults_match_web ... ok
test error_research_step_is_atomic_on_missing_cost ... ok
test hot_seat_two_human_owners_have_independent_player_states ... ok
test error_missing_cost_for_unknown_tempo_and_mode ... ok
test parity_gates_available_and_cheapest ... ok
test parity_per_row_functions ... ok
test parity_research_costs_equal_web_scaled_research_cost ... ok
test parity_vectors_use_the_engine_tech_data ... ok
test serde_missing_research_queue_defaults_to_empty ... ok
test table_constants_are_read_from_data_not_literals ... ok
test parity_scenarios_from_web ... ok
test table_edit_of_research_cost_changes_the_step ... ok
test table_every_engine_tech_has_a_research_cost_for_every_axis ... ok
test table_player_state_params_shape ... ok
test table_epoch_map_and_sentinels_come_from_data ... ok
test table_research_cost_rows_agree_with_tech_json ... ok
test parity_epoch_number ... ok
test parity_parse_prereqs_and_prereqs_met ... ok

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.17s

     Running tests/p6_1c_braz_access.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_1c_braz_access-043839ba2b428854)

running 7 tests
test city_has_piec_hutniczy_matches_web ... ok
test empire_has_kopalnia_miedzi_matches_web ... ok
test normalize_improvement_key_known_keys_equal_data_keys ... ok
test normalize_improvement_key_matches_web ... ok
test prototype_keys_are_out_of_domain_and_do_not_change_braz_outcome ... ok
test has_braz_access_matches_web ... ok
test bootstrap_table_values_equal_web_constants ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s

     Running tests/p6_1c_llama_seed.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_1c_llama_seed-e56bbca479ca6477)

running 3 tests
test hex_keys_within_radius_matches_web_loop_order ... ok
test hash_pos_matches_web_hash_pos_verbatim ... ok
test seed_inca_llama_deposits_matches_web_for_all_cases ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.15s

     Running tests/p6_1c_start_cluster.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_1c_start_cluster-584791c0a8e00ea4)

running 8 tests
test land_hexes_filter_matches_web_rule ... ok
test build_cluster_start_plan_matches_web_for_all_cases ... ok
test pick_second_human_start_hex_matches_web ... ok
test second_human_without_legal_hex_yields_no_second_seat_derived_from_code ... ok
test vectors_cover_the_branches_of_build_cluster_start_plan ... ok
test display_label_for_slot_matches_web ... ok
test constants_and_start_relations_match_web ... ok
test second_human_civ_equal_to_player_civ_is_rejected_like_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.46s

     Running tests/p6_1c_tables.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_1c_tables-2a37790854995833)

running 4 tests
test cluster_table_has_sane_shape ... ok
test braz_table_has_sane_shape_and_consistent_references ... ok
test llama_table_has_sane_shape ... ok
test start_tables_parse_with_deny_unknown_fields ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1d_city_names.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_1d_city_names-4bfda12150196ed9)

running 13 tests
test collect_used_city_names_matches_web ... ok
test city_name_with_suffix_matches_web ... ok
test nazwa_klastra_at_matches_web ... ok
test pick_next_city_name_from_names_matches_web_for_synthetic_queues ... ok
test embedded_pool_data_is_byte_identical_to_data_used_for_vectors ... ok
test pool_length_constants_match_web ... ok
test rival_pool_index_matches_web ... ok
test pick_capital_foreign_regular_match_web_for_real_pools ... ok
test resolve_state_city_name_matches_web ... ok
test cluster_rival_from_pool_matches_web ... ok
test validate_city_names_pools_matches_web ... ok
test suggest_and_ai_founding_names_match_web ... ok
test state_city_name_at_matches_web ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s

     Running tests/p6_1d_civ_bonuses.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_1d_civ_bonuses-30f5c7450cfc6997)

running 14 tests
test building_cost_discount_matches_web ... ok
test apply_multiplier_matches_web ... ok
test empty_bonus_list_gives_zero_multipliers ... ok
test embedded_data_is_byte_identical_to_data_used_for_vectors ... ok
test is_combat_modifier_bonus_matches_web ... ok
test matrix_bonusy_match_web_for_every_civ_key_variant ... ok
test real_civs_bonuses_convert_without_loss ... ok
test movement_range_siege_wall_multipliers_match_web ... ok
test terrain_forest_detection_matches_web ... ok
test unit_combat_category_matches_web_for_every_unit ... ok
test unit_matches_cel_matches_web_for_every_unit_and_cel ... ok
test strip_diacritics_matches_web_function_cut_verbatim ... ok
test bonus_applies_per_entry_matches_web_for_multi_entry_lists ... ok
test bonus_applies_and_stat_multipliers_match_web ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 12.75s

     Running tests/p6_1d_tables.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_1d_tables-7c67743f1f351b01)

running 4 tests
test city_name_constants_have_consistent_shape ... ok
test matrix_specs_have_consistent_shape_and_known_param_ids ... ok
test rules_have_known_stats_and_param_ids ... ok
test diacritics_table_maps_single_chars_outside_ascii ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_1e_civ_matrix.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_1e_civ_matrix-d0b7dd9cf60d4be3)

running 21 tests
test ai_params_and_diplomacy_rows_match_web ... ok
test ai_fallback_branches_are_actually_exercised ... ok
test apply_civ_matrix_param_matches_web ... ok
test civ_matrix_param_def_matches_web ... ok
test civ_matrix_param_at_difficulty_matches_web ... ok
test civ_matrix_params_at_difficulty_matches_web_order_and_values ... ok
test civ_matrix_param_matches_web ... ok
test consumer_status_polarity_band_baseline_match_web_per_parameter ... ok
test data_files_are_byte_identical_to_web_pin ... ok
test every_matrix_cell_parses_exactly_like_js ... ok
test median_matches_web ... ok
test param_order_and_rows_match_web_for_every_scenario ... ok
test proc_sum_and_apply_proc_match_web ... ok
test ai_by_typ_resolvers_match_web ... ok
test scale_parameters_are_clamped_and_shifted_only_for_skala ... ok
test every_status_for_every_parameter_matches_web_texts ... ok
test status_visibility_is_true_only_for_real_gameplay ... ok
test synthetic_cell_grid_matches_web ... ok
test ai_profiles_and_norms_match_web ... ok
test profile_by_key_resolution_matches_web ... ok
test snapshot_and_profiles_match_web ... ok

test result: ok. 21 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.98s

     Running tests/p6_1e_civ_names.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_1e_civ_names-80674a5ae9a4508e)

running 11 tests
test assign_invariants_hold_on_real_roster ... ok
test constants_match_web ... ok
test find_klastra_display_validate_match_web ... ok
test civ_ids_from_roster_matches_web ... ok
test make_rng_streams_match_web_for_every_seed ... ok
test assign_ai_civ_types_matches_web ... ok
test reexports_behave_like_web ... ok
test rotate_preferred_matches_web ... ok
test pool_views_ai_founded_and_validation_match_web ... ok
test pick_active_civ_pool_matches_web ... ok
test start_foreign_rival_state_names_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.35s

     Running tests/p6_1e_js_compat.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_1e_js_compat-08e1cb152706a259)

running 8 tests
test intensity_label_matches_web ... ok
test is_integer_and_min_max_clamp_follow_js ... ok
test math_round_matches_js_bit_for_bit ... ok
test parameter_label_matches_web ... ok
test number_to_string_matches_js_for_every_vector ... ok
test trim_matches_js_string_trim ... ok
test formatted_value_matches_web ... ok
test to_fixed_matches_js_for_every_digit_count ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.33s

     Running tests/p6_1e_tables.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_1e_tables-9dc9ef20c17d92b2)

running 7 tests
test parameter_label_dictionary_has_nonempty_entries_and_suffix_rule ... ok
test params_table_is_consistent_with_matrix_and_civs ... ok
test semantic_table_has_text_for_every_status_and_placeholder ... ok
test semantic_neutral_band_rules_cover_every_parameter_definition ... ok
test tables_parse_and_are_cached ... ok
test modules_contain_no_balance_or_data_literals ... ok
test semantic_table_sets_reference_existing_parameters_and_are_disjoint ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_23_fort.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_23_fort-324dd86b69e58eeb)

running 5 tests
test fort_rules_table_references_known_improvements ... ok
test fort_node_conversion_and_reservation_match_web ... ok
test territory_dependencies_match_web ... ok
test takeover_on_city_founded_matches_web ... ok
test evacuation_hex_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.50s

     Running tests/p6_23_hexmove.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_23_hexmove-a546770c25695422)

running 4 tests
test foreign_city_blocks_feed_pathfinding_and_roads_use_p3_23_divisors ... ok
test city_at_hex_and_occupancy_match_web ... ok
test foreign_city_blocks_match_web ... ok
test ai_entry_into_empty_enemy_city_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s

     Running tests/p6_23_improvements.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_23_improvements-2f6107250ed9d0bf)

running 10 tests
test applying_bonuses_matches_web ... ok
test constants_match_web ... ok
test era_and_cost_scaling_match_web ... ok
test normalize_and_lookup_functions_match_web ... ok
test migration_functions_match_web ... ok
test rules_tables_have_consistent_shape ... ok
test hex_layer_functions_match_web ... ok
test catalog_key_order_equals_json_file_order_including_meta_rows ... ok
test prototype_keys_pass_normalize_like_in_web ... ok
test territory_and_ore_yields_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.72s

     Running tests/p6_23_order.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_23_order-b99acb8ea5803b82)

running 11 tests
test engine_society_params_match_web_subset_used_by_vectors ... ok
test fallback_params_equal_web_constant ... ok
test compute_order_matches_web ... ok
test evaluate_order_matches_web ... ok
test load_order_params_matches_web ... ok
test order_shape_invariants_hold_for_any_table_values ... ok
test happiness_breakdown_matches_web ... ok
test pick_revolt_migration_target_matches_web ... ok
test order_effects_matches_web ... ok
test order_tier_matches_web ... ok
test order_effects_to_yield_mults_matches_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.72s

     Running tests/p6_23_tables.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_23_tables-6de635983c184b19)

running 3 tests
test teren_ruch_reguly_table_has_nonempty_lists ... ok
test porzadek_params_table_is_complete_and_finite ... ok
test ulepszenia_reguly_table_references_existing_improvements_only ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_4_core.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_4_core-1b564fea4bb5288e)

running 10 tests
test constants_read_from_running_web_match_tables ... ok
test hex_distance_matches_web ... ok
test road_modifier_matches_web_including_floor_and_special_costs ... ok
test path_cost_matches_web ... ok
test stack_group_id_matches_web ... ok
test compute_path_matches_web_including_ties_and_edge_destinations ... ok
test compute_reachable_matches_web_order_and_min_move ... ok
test terrain_and_embark_costs_match_web_on_maps ... ok
test terrain_cost_combinations_match_web ... ok
test visibility_helpers_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.90s

     Running tests/p6_4_embark.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_4_embark-1585566f17a207b0)

running 4 tests
test can_unit_embark_matches_web ... ok
test apply_embark_state_after_move_matches_web ... ok
test water_hex_queries_match_web ... ok
test move_cost_fn_for_matches_web_on_every_map_hex ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.71s

     Running tests/p6_4_march.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_4_march-bae7bfc63cf555d2)

running 6 tests
test save_validation_and_round_trip_match_web ... ok
test fog_frontier_and_fog_plan_match_web ... ok
test truncate_path_to_budget_matches_web_including_min_move ... ok
test plan_path_turns_matches_web ... ok
test execute_march_step_matches_web ... ok
test should_stop_at_obstacle_matches_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.98s

     Running tests/p6_4_rally.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_4_rally-4bbcd32c03f67cc3)

running 3 tests
test launch_leaders_one_per_stack_match_web ... ok
test set_clear_and_save_sequences_match_web ... ok
test load_from_save_and_number_parsing_match_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_4_scout.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_4_scout-573fb211c9224499)

running 5 tests
test explore_scores_match_web ... ok
test run_scouts_auto_explore_matches_web ... ok
test scout_flags_match_web ... ok
test pick_scout_explore_target_matches_web_including_rng_use ... ok
test advance_scout_auto_explore_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 29.27s

     Running tests/p6_4_tables.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_4_tables-d82f71a9bfb2cdbc)

running 4 tests
test numeric_rows_have_sane_shape_without_pinning_values ... ok
test table_parses_and_every_row_names_its_web_source ... ok
test text_rows_are_nonempty_and_distinct ... ok
test neighbour_table_is_six_distinct_adjacent_offsets ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_5a_cost.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_5a_cost-a4777603b2625768)

running 4 tests
test js_round_matches_half_up_semantics ... ok
test replace_context_keeps_every_field_and_the_required_stock ... ok
test table_constants_equal_the_running_web_object ... ok
test unit_cost_pace_matches_web_bitwise ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/p6_5a_display.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_5a_display-f61d69c84dc8b548)

running 7 tests
test field_power_passes_roster_in_web_order_and_returns_sum ... ok
test compute_stack_display_matches_web_order_and_vitals ... ok
test hp_pool_matches_web_including_nonfinite_and_overfull_hp ... ok
test badge_and_veteran_maxima_match_web ... ok
test representative_matches_web_including_utf16_id_order_and_nan_attack ... ok
test stack_vitals_matches_web ... ok
test unit_at_representative_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.77s

     Running tests/p6_5a_ruch.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_5a_ruch-0e062d5664866c50)

running 8 tests
test hud_actions_match_web ... ok
test bounce_hex_assignment_matches_web_including_duplicates_and_blocking ... ok
test adjacent_empty_and_split_destinations_match_web ... ok
test bounce_from_origin_and_separate_return_hex_match_web ... ok
test ruch_pools_match_web_bitwise ... ok
test separate_return_matches_web_bitwise ... ok
test sync_and_deduct_match_web ... ok
test unit_with_pooled_ruch_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.50s

     Running tests/p6_5a_stack.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_5a_stack-32bcaffc556db8d5)

running 10 tests
test fresh_and_shared_stack_group_ids_match_web_sequence ... ok
test garrison_and_field_fortify_transitions_match_web ... ok
test adjacent_army_hexes_and_active_stack_match_web ... ok
test all_defenders_and_wake_stack_match_web ... ok
test law_garrison_counts_match_web ... ok
test same_stack_group_and_stack_key_match_web ... ok
test stack_group_id_agrees_with_p64_port_on_the_same_unit ... ok
test stack_group_id_and_render_key_match_web ... ok
test transition_chains_match_web_including_both_fortifications_at_once ... ok
test visible_colocated_and_garrison_queries_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.32s

     Running tests/p6_5a_tables.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_5a_tables-c73c4ca1005ab433)

running 2 tests
test army_params_parse_and_have_sane_shape ... ok
test tempo_table_parses_and_has_distinct_keys_with_positive_multipliers ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_5b_bonuses.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_5b_bonuses-02e0bfe8577aeac4)

running 8 tests
test building_roles_and_real_game_data_match_web ... ok
test chain_depth_limit_matches_web ... ok
test gain_hint_text_matches_web_for_arbitrary_gains ... ok
test stat_multiplier_merge_is_generic_over_any_structural_type ... ok
test stat_multiplier_merge_matches_web ... ok
test unit_progress_badges_and_fractions_match_web ... ok
test city_visit_gain_progress_and_hint_match_web ... ok
test city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 6.38s

     Running tests/p6_5b_format.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_5b_format-8864aed56360906f)

running 5 tests
test citizen_label_matches_web ... ok
test locale_compare_table_is_the_measured_primary_order ... ok
test number_to_string_matches_web ... ok
test population_formats_match_web ... ok
test locale_compare_matches_web_for_ascii ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.90s

     Running tests/p6_5b_manpower.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_5b_manpower-0a099d61a31307ee)

running 13 tests
test besieged_location_sort_key_sync_and_civilian_match_web ... ok
test empire_deduct_refund_and_spawn_mutate_like_web ... ok
test city_pool_functions_match_web ... ok
test civ_bonus_multipliers_match_web ... ok
test game_default_params_equal_the_running_web_defaults ... ok
test opt_helpers_are_consistent ... ok
test pool_and_cost_scalars_match_web ... ok
test era_table_and_citizen_scalars_match_web ... ok
test empire_totals_match_web ... ok
test heal_cost_and_cap_match_web ... ok
test regen_gain_matches_web_including_default_params ... ok
test spawn_and_refund_functions_match_web ... ok
test raw_param_loaders_match_web ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 7.99s

     Running tests/p6_5b_replenish.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_5b_replenish-11d5c4ac4b77306b)

running 1 test
test replenishment_matches_web_state_results_and_closure_protocol ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.86s

     Running tests/p6_5b_tables.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_5b_tables-4f918dda2f6680dd)

running 6 tests
test civilian_set_is_resolved_from_the_table ... ok
test era_table_rows_are_contiguous_and_cover_the_clamp_range ... ok
test tables_are_loaded_from_the_embedded_json_files ... ok
test tables_parse_and_have_the_expected_shape ... ok
test p65a_badge_closures_are_closed_by_the_real_path_badge_port ... ok
test table_constants_equal_the_running_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.18s

     Running tests/p6_6a_conquest.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_6a_conquest-230020c5d317bb55)

running 6 tests
test clear_city_culture_mix_removes_both_fields ... ok
test building_flags_match_web ... ok
test revolt_multiplier_and_deprecated_penalties_match_web ... ok
test on_city_captured_culture_matches_web_with_injected_circle ... ok
test thresholds_match_web ... ok
test tick_city_culture_religion_matches_web_with_injected_conversions ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.22s

     Running tests/p6_6a_founding.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_6a_founding-99bc07a6ebb0028d)

running 10 tests
test costs_follow_injected_params ... ok
test can_afford_found_city_matches_web ... ok
test first_city_is_free_for_any_params ... ok
test cost_constants_match_running_web ... ok
test cost_labels_match_web ... ok
test production_params_come_from_data_tables ... ok
test read_param_accepts_only_finite_numbers ... ok
test evaluate_found_city_affordance_matches_web ... ok
test pick_source_city_matches_web_including_rand_protocol ... ok
test is_subsequent_found_city_matches_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.22s

     Running tests/p6_6a_hexclear.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_6a_hexclear-98167207530960b3)

running 4 tests
test clearing_follows_the_editable_table_but_forest_and_mountain_rules_are_fixed ... ok
test keep_set_and_predicate_match_web ... ok
test clear_hex_for_city_center_matches_web ... ok
test apply_city_founding_to_hex_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s

     Running tests/p6_6a_tables.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_6a_tables-49f7fae6dbfdf022)

running 6 tests
test default_sight_comes_from_map_gen_params_when_positive ... ok
test hex_clear_table_is_well_formed ... ok
test conquest_table_is_well_formed ... ok
test founding_costs_are_present_in_miasto_params ... ok
test founding_table_is_well_formed ... ok
test visibility_table_is_well_formed ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_6a_visibility.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_6a_visibility-0615129695460042)

running 11 tests
test city_sight_radius_reexport_matches_web ... ok
test compute_visible_along_path_matches_web ... ok
test add_explored_and_render_sets_match_web ... ok
test compute_player_visibility_matches_web ... ok
test default_sight_uses_the_data_value_only_when_positive ... ok
test compute_visible_at_matches_web ... ok
test compute_visible_fixed_sight_matches_web ... ok
test constants_match_running_web ... ok
test key_listings_and_terrain_predicates_match_web ... ok
test units_visible_on_map_matches_web ... ok
test unit_sight_resolver_and_compute_visible_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.80s

     Running tests/p6_m00_skeleton.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m00_skeleton-1864ffd75187226a)

running 5 tests
test mapgen_mod_declares_exactly_doc_modules ... ok
test files_exist_and_start_with_owner_doc_header ... ok
test doc_row_lists_expected_counts ... ok
test domain_mod_declares_top_level_skeleton_modules ... ok
test skeleton_headers_name_full_owner_ids_from_table ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m01_climate.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m01_climate-fc8a7dd62f5452ac)

running 7 tests
test forest_threshold_matches_web_bit_for_bit ... ok
test desert_assignment_predicate_matches_web ... ok
test water_terrain_predicate_matches_web_for_every_terrain ... ok
test climate_band_default_arguments_and_ignored_q_match_web ... ok
test polar_predicate_matches_web ... ok
test world_type_and_climate_band_serde_literals_match_web ... ok
test climate_band_sweep_matches_web_for_every_height_and_row ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.18s

     Running tests/p6_m01_earth_mask.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m01_earth_mask-1779c36a54b4d8e3)

running 10 tests
test derived_mask_file_is_the_single_source_of_mask_data ... ok
test bit_at_clamps_out_of_range_coordinates_like_web ... ok
test hex_to_norm_edges_match_web ... ok
test named_constants_match_web_exports ... ok
test mask_dimensions_and_bbox_match_web_bit_for_bit ... ok
test all_288000_mask_bits_match_the_web_rows ... ok
test sample_template_land_matches_web_on_thousands_of_points ... ok
test sample_template_land_nan_is_sea ... ok
test polar_rows_inner_dimensions_and_buffers_match_web_for_heights_0_to_600 ... ok
test hex_to_template_norm_template_land_subsample_and_threshold_match_web_for_all_dims ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.71s

     Running tests/p6_m01_params_shape.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m01_params_shape-188a388bb5a09197)

running 9 tests
test climate_is_polar_outside_the_map ... ok
test climate_bands_are_ordered_north_to_south_and_cover_the_playable_rows ... ok
test ocean_buffers_never_shrink_with_height_and_respect_their_lower_bound ... ok
test params_floats_are_parsed_exactly_from_the_raw_json_text ... ok
test params_files_parse_and_have_the_expected_shape ... ok
test template_sampling_is_zero_outside_the_unit_square ... ok
test mask_file_is_well_formed ... ok
test subsample_and_threshold_tiers_never_decrease_resolution_for_bigger_maps ... ok
test template_land_respects_border_and_polar_buffers_and_yields_binary_values ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.34s

     Running tests/p6_m01_prims.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m01_prims-963d8aed92ec098f)

running 14 tests
test cos_lerp_matches_web_bit_for_bit ... ok
test hex_directions_match_web_in_every_implementation ... ok
test all_three_mulberry32_implementations_match_web_for_every_seed_and_step ... ok
test hex_key_matches_web_format ... ok
test hex_distance_matches_web_on_the_full_grid_in_every_implementation ... ok
test fbm_matches_web_bit_for_bit_for_all_octave_counts ... ok
test js_cos_outside_the_medium_range_stays_within_one_ulp_and_keeps_special_values ... ok
test hex_distance_matches_web_for_large_coordinates ... ok
test js_cos_matches_v8_math_cos_bit_for_bit_in_the_supported_range ... ok
test mulberry32_state_is_the_seed_until_first_draw ... ok
test vectors_come_from_the_pinned_web_run ... ok
test js_to_int32_follows_ecmascript_to_int32 ... ok
test perm_table_matches_web_for_all_256_entries ... ok
test value_noise_matches_web_bit_for_bit_including_huge_and_negative_coordinates ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.21s

     Running tests/p6_m02_deposit_river.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m02_deposit_river-aa1b079e2438a847)

running 7 tests
test parse_helpers_cover_all_tokens ... ok
test ensure_meta_and_hidden_count_match_web ... ok
test metal_deposit_min_era_table_matches_web ... ok
test deposit_visibility_matches_web ... ok
test river_switch_matches_web ... ok
test river_switch_keys_match_names_the_web_queried ... ok
test river_switch_without_environment_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.13s

     Running tests/p6_m02_float_parse.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m02_float_parse-bdfe4c125f45e686)

running 1 test
test table_floats_are_read_without_rounding_error ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m02_generator.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m02_generator-aad7149729b35309)

running 4 tests
test size_dims_and_order_match_web ... ok
test normalization_matches_web ... ok
test menu_labels_match_web ... ok
test size_from_menu_label_and_label_to_dims_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m02_new_game.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m02_new_game-fb7bd264e697cc8f)

running 11 tests
test density_to_label_round_trips_where_web_does ... ok
test constants_match_web ... ok
test clamp_miasta_panstwa_count_matches_web ... ok
test civ_menus_with_rosters_match_web ... ok
test land_fraction_functions_match_web ... ok
test map_size_label_from_dims_matches_web ... ok
test river_map_params_match_web_bitwise ... ok
test resolve_world_gen_numbers_matches_web ... ok
test tier_functions_match_web ... ok
test per_label_functions_match_web ... ok
test world_generation_presets_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.73s

     Running tests/p6_m02_quality.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m02_quality-07b289bbbb867c75)

running 4 tests
test tier_to_label_and_preset_match_web ... ok
test per_label_functions_match_web ... ok
test web_quirk_ignores_z_with_dot ... ok
test constants_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m02_tables.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m02_tables-abfdd889c351ab6b)

running 7 tests
test map_label_thresholds_are_ascending_and_known ... ok
test land_and_toggle_tables_are_consistent ... ok
test every_section_names_its_web_source ... ok
test per_size_menus_cover_every_size ... ok
test size_tables_are_consistent ... ok
test river_rules_have_sane_ranges ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m03_centers.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m03_centers-e9e6c6c080ae746d)

running 15 tests
test default_shape_params_match_web_and_consume_six_draws ... ok
test build_continent_centers_matches_web_including_rng_consumption ... ok
test assign_island_grid_indices_keeps_web_map_insertion_order ... ok
test five_zone_centers_match_web_including_rng_consumption ... ok
test continent_center_count_matches_web_for_all_world_types ... ok
test isotropic_helpers_match_web ... ok
test named_constants_match_web_exports ... ok
test pangea_blob_centers_match_web_including_rng_consumption ... ok
test pangea_land_t_matches_web_including_clamps_and_non_finite ... ok
test pangea_layout_params_match_web_for_every_field ... ok
test perm_tables_from_seed_match_web ... ok
test elliptical_mask_matches_web_inside_and_outside_the_map ... ok
test island_centers_match_web_including_rng_consumption ... ok
test island_grid_cell_index_matches_web_including_out_of_range_cells ... ok
test voronoi_zone_index_and_second_distance_match_web_with_ties ... ok

test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.15s

     Running tests/p6_m03_earth.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m03_earth-527455072c339731)

running 5 tests
test heights_polar_rows_and_land_rows_match_web_for_every_height ... ok
test constants_match_web ... ok
test widths_inner_width_matches_web_for_every_width ... ok
test subsample_grid_and_land_fraction_threshold_match_web_for_all_tier_edges ... ok
test bit_at_matches_web_including_clamped_out_of_range_coordinates ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/p6_m03_edges.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m03_edges-2ed31862d88dc14c)

running 3 tests
test exact_threshold_arguments_exist_in_the_vectors ... ok
test edge_rect_floor_matches_web_for_maps_wider_than_2000_hexes ... ok
test pangea_layout_matches_web_at_exact_threshold_neighbourhoods ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_m03_jsmath.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m03_jsmath-2eef5b60b0adbce2)

running 9 tests
test pow_follows_ecmascript_special_cases ... ok
test max_min_follow_javascript_nan_and_signed_zero_rules ... ok
test atan2_matches_web_bit_for_bit ... ok
test sin_beyond_reconstructed_domain_panics_in_debug_builds - should panic ... ok
test hypot_matches_web_bit_for_bit ... ok
test sin_inside_domain_does_not_hit_the_fallback ... ok
test sin_matches_web_bit_for_bit ... ok
test pow_matches_web_bit_for_bit ... ok
test vectors_distinguish_v8_from_system_libm ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.31s

     Running tests/p6_m03_masks.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m03_masks-92f5032984be63fd)

running 5 tests
test border_dependencies_match_web ... ok
test pangea_blob_score_matches_web_on_fixed_centers ... ok
test masks_are_bounded_and_zero_in_the_hard_ocean_border ... ok
test land_masks_match_web_for_every_type_size_and_seed ... ok
test full_seed_pipeline_reproduces_the_web_land_masks ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 15.98s

     Running tests/p6_m03_strait.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m03_strait-37e3722b9d7677a3)

running 1 test
test strait_vectors_match_web_at_exact_threshold_and_one_ulp_around_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m03_tables.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m03_tables-50e93f9f6b59c4b2)

running 6 tests
test accessors_are_driven_by_the_table_not_by_literals ... ok
test every_table_float_is_parsed_exactly_from_the_raw_text ... ok
test border_fade_clamp_is_unreachable_while_table_invariant_holds ... ok
test table_has_no_unknown_or_missing_keys ... ok
test table_invariants_hold ... ok
test table_parses_and_is_cached ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m04_border.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m04_border-6bff5e3eb79596bf)

running 12 tests
test border_consts_match_web ... ok
test erosion_hook_matches_web ... ok
test is_in_map_border_with_buffer_matches_web ... ok
test lat_buffer_matches_web ... ok
test margin_cap_matches_web ... ok
test margin_scatter_score_matches_web ... ok
test parse_hex_key_edge_keys_match_web ... ok
test parse_hex_key_matches_js_number_for_hexkey_strings ... ok
test set_hex_to_morze_and_laka_match_web ... ok
test border_grid_tools_match_web ... ok
test fades_and_distances_match_web ... ok
test apply_marginal_land_zone_caps_matches_web ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.07s

     Running tests/p6_m04_classify.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m04_classify-421508a5d4a5c685)

running 7 tests
test consts_match_web ... ok
test classify_terrain_flat_matches_web ... ok
test relief_elev_gates_match_web ... ok
test classify_terrain_matches_web ... ok
test terrain_cell_bias_matches_web ... ok
test rown_laka_jitter_matches_web ... ok
test hash_int3_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.65s

     Running tests/p6_m04_reapply.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m04_reapply-8accc2cf3c58125d)

running 4 tests
test reapply_land_terrain_matches_web ... ok
test forest_replay_hooks_reject_wrong_arguments ... ok
test reapply_forest_overlay_targeted_inland_cases_match_web ... ok
test reapply_forest_overlay_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.44s

     Running tests/p6_m04_tables.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m04_tables-4d2b90ef46470e0e)

running 4 tests
test every_value_has_a_web_source_with_file_and_line ... ok
test floats_are_parsed_exactly_from_the_raw_json_text ... ok
test values_have_sane_shape ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m05a_cover.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m05a_cover-fb437b784be2d773)

running 6 tests
test cap_iron_cell_relief_spread_matches_web ... ok
test pick_relief_force_hex_filters_water_cells_like_web ... ok
test pick_relief_force_hex_matches_web ... ok
test cap_overflow_in_cell_matches_web ... ok
test ensure_mass_grid_coverage_matches_web ... ok
test force_relief_type_in_cell_matches_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 31.71s

     Running tests/p6_m05a_masses.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m05a_masses-988e2660e7aea269)

running 8 tests
test centroid_center_square_and_distance_match_web ... ok
test cell_counters_and_packages_match_web ... ok
test land_hexes_by_coverage_cell_matches_web ... ok
test group_land_mass_keys_matches_web ... ok
test pick_spread_relief_keys_matches_web ... ok
test cell_can_host_deposit_package_at_the_min_land_boundary_matches_web ... ok
test land_partition_keys_for_distribution_matches_web ... ok
test grid_coverage_ratios_match_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 31.08s

     Running tests/p6_m05a_relief.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m05a_relief-7df3bf92cd6057d8)

running 3 tests
test apply_relief_by_noise_rank_default_arguments_match_web ... ok
test apply_relief_to_land_keys_matches_web ... ok
test apply_relief_by_noise_rank_matches_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 18.22s

     Running tests/p6_m05a_tables.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m05a_tables-9a7d784a74f422cb)

running 10 tests
test floats_are_parsed_exactly_from_the_raw_json_text ... ok
test every_value_has_a_web_source_with_file_and_line ... ok
test caps_match_web ... ok
test consts_and_tier_tables_match_web ... ok
test forest_eligible_and_deposit_protection_match_web ... ok
test min_land_hexes_match_web ... ok
test overflow_cap_frac_with_damaged_json_matches_web ... ok
test values_have_sane_shape ... ok
test vectors_come_from_the_pinned_web_run ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.83s

     Running tests/p6_m09_rivals.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m09_rivals-3d2871a7b9753cde)

running 19 tests
test constants_match_web_and_aliases_are_not_separate_numbers ... ok
test group_foreign_type_clusters_matches_web ... ok
test cluster_pack_radius_matches_web ... ok
test foreign_buffer_gate_matches_web ... ok
test half_plane_axis_matches_web_bitwise ... ok
test is_in_half_plane_matches_web ... ok
test land_pool_near_core_matches_web ... ok
test hexes_at_distance_matches_web ... ok
test map_helpers_match_web ... ok
test nearest_legal_land_matches_web ... ok
test hub_chain_matches_web ... ok
test hub_chain_result_does_not_depend_on_seed_as_in_web ... ok
test rival_slots_degenerate_inputs_do_not_panic ... ok
test pack_rival_cities_matches_web ... ok
test shuffle_in_place_matches_web ... ok
test vectors_identify_the_same_maps_as_p6_1c ... ok
test pack_around_capital_matches_web ... ok
test rival_slots_match_web_on_real_maps ... ok
test rival_candidate_hexes_match_web_on_real_maps ... ok

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 14.44s

     Running tests/p6_m09_tables.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m09_tables-0380ed37b51ae447)

running 3 tests
test every_value_has_web_source_and_sane_shape ... ok
test start_city_state_distance_is_not_the_cities_ts_constant ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m10_masses.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m10_masses-1406512a25778485)

running 16 tests
test alias_constants_are_not_separate_numbers ... ok
test constants_match_web ... ok
test local_land_fraction_and_gate_match_web ... ok
test map_size_label_matches_web_and_params_table ... ok
test mass_qualifies_and_indices_match_web ... ok
test player_mass_gate_over_whole_maps_matches_web ... ok
test allocate_typy_to_masses_matches_web ... ok
test reorder_roster_by_preference_matches_web ... ok
test roster_for_start_epoch_matches_web ... ok
test spawn_habitable_terrain_matches_web ... ok
test thresholds_and_caps_match_web ... ok
test types_have_web_shape ... ok
test vectors_identify_the_maps_used ... ok
test group_habitable_masses_and_cache_match_web ... ok
test region_mass_dominance_matches_web ... ok
test development_space_and_mass_gates_match_web ... ok

test result: ok. 16 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 10.88s

     Running tests/p6_m10_placement.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m10_placement-0ff78516c0b93780)

running 14 tests
test hooks_match_web ... ok
test pick_center_in_mass_matches_web ... ok
test balance_and_enforce_match_web ... ok
test pick_best_local_land_spawn_matches_web ... ok
test pick_center_in_mass_spread_matches_web ... ok
test pick_tied_spawn_land_candidate_matches_web ... ok
test pick_center_on_land_pool_spread_matches_web ... ok
test pick_center_in_mass_with_land_gate_matches_web ... ok
test sort_spawn_candidates_with_spread_bias_matches_web ... ok
test sort_spawn_land_candidates_matches_web ... ok
test voronoi_and_centroid_match_web ... ok
test place_cluster_centers_across_landmasses_matches_web ... ok
test pick_player_cluster_center_matches_web ... ok
test player_start_candidates_match_web ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 18.00s

     Running tests/p6_m10_start_scoring.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m10_start_scoring-a1f4519e6663b8a9)

running 4 tests
test reveal_radius_matches_web ... ok
test score_city_start_hex_over_whole_maps_matches_web ... ok
test score_city_start_hex_matches_web ... ok
test find_best_player_start_hex_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.96s

     Running tests/p6_m10_tables.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m10_tables-07a2652eafb05f75)

running 3 tests
test tables_parse_with_deny_unknown_fields ... ok
test values_have_sane_shape ... ok
test every_value_has_a_web_source_with_file_and_line ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m10_v8sort.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m10_v8sort-d4cb86648b856051)

running 2 tests
test js_array_sort_is_stable_for_equal_keys ... ok
test js_array_sort_matches_v8_including_comparator_call_counts ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.42s

     Running tests/p6_m11_gates.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m11_gates-70911875d6c88b8e)

running 11 tests
test for_map_matches_web ... ok
test by_label_matches_web ... ok
test hub_reach_and_body_buffer_match_web ... ok
test capital_separation_gate_and_distance_match_web ... ok
test preferred_quadrants_match_web ... ok
test band_penalty_matches_web ... ok
test quadrant_helpers_match_web ... ok
test rescue_ladder_matches_web ... ok
test sea_gates_match_web ... ok
test hooks_impl_matches_web ... ok
test pick_spawn_hex_matches_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.55s

     Running tests/p6_m11_integration.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m11_integration-9de8c89dfd74ed60)

running 4 tests
test m11_hooks_match_m10_web_hook_vectors ... ok
test m11_hooks_reproduce_m10_candidate_sorting ... ok
test m11_and_m10_vector_maps_are_identical ... ok
test m11_hooks_reproduce_m10_center_placement ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 4.50s

     Running tests/p6_m11_layout.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m11_layout-cc4df252415db121)

running 10 tests
test centroid_and_far_enough_match_web ... ok
test capital_pos_matches_web ... ok
test assign_types_matches_web ... ok
test build_cluster_cities_matches_web ... ok
test cities_with_land_gate_match_web ... ok
test poisson_pick_cities_matches_web ... ok
test pick_capital_hex_in_region_matches_web ... ok
test layout_with_edge_capital_matches_web ... ok
test simple_fallback_matches_web ... ok
test enforce_local_land_dominance_matches_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 10.58s

     Running tests/p6_m11_repair.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m11_repair-2ea5f9383c7a3744)

running 7 tests
test cluster_helpers_match_web ... ok
test fixtures_have_web_shape_and_variety ... ok
test quarter_spread_matches_web ... ok
test hard_capital_separation_matches_web ... ok
test repack_one_matches_web ... ok
test body_separation_matches_web ... ok
test repack_all_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 14.64s

     Running tests/p6_m11_tables.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m11_tables-c893deff57812197)

running 4 tests
test derived_constants_are_aliases_of_table_fields ... ok
test every_value_has_a_web_source_with_file_and_line ... ok
test table_parses_with_deny_unknown_fields ... ok
test values_have_sane_shape ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m14_range.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m14_range-11a976a1d8c0add9)

running 3 tests
test territory_keys_by_owner_match_web ... ok
test culture_range_matches_web ... ok
test religion_range_matches_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.16s

     Running tests/p6_m14_territory.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m14_territory-ba89cbcff9a8795a)

running 8 tests
test axial_distance_matches_web_and_integer_variant ... ok
test is_in_territory_matches_web ... ok
test city_territory_radius_matches_web ... ok
test city_sight_radius_matches_web ... ok
test owner_tie_goes_to_first_node ... ok
test is_player_territory_hex_matches_web ... ok
test territory_owner_at_matches_web ... ok
test city_range_for_population_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.21s

     Running tests/p6_m14_wonder.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m14_wonder-96491650d658ea23)

running 4 tests
test list_for_owner_matches_web ... ok
test pick_matches_web ... ok
test list_for_city_matches_web ... ok
test shape_candidates_are_sorted_land_and_exclude_center ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.30s

     Running tests/p6_m14_work.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m14_work-1ce45b3a771ecceb)

running 8 tests
test reconcile_all_matches_web ... ok
test is_territory_hex_owned_by_matches_web ... ok
test reconcile_without_reczne_is_noop ... ok
test city_center_keys_match_web ... ok
test build_territory_nodes_matches_web ... ok
test reconcile_for_owner_matches_web ... ok
test workable_filter_matches_web ... ok
test reczne_key_legal_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.01s

     Running tests/p6_m15_roads.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m15_roads-00c1796d2d44aacd)

running 8 tests
test constants_match_web ... ok
test has_road_matches_web ... ok
test collect_road_keys_matches_web_order ... ok
test is_road_key_matches_web ... ok
test road_table_shape_and_key_names ... ok
test roads_source_has_no_numeric_data_literals ... ok
test p64_ruch_modifier_agrees_with_roads_module ... ok
test apply_modifier_matches_web_bitwise ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.44s

     Running tests/p6_m16_divergence.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m16_divergence-36f41f9340105fdf)

running 1 test
test web_allows_farm_irrigation_terraces_on_deposit_hexes ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.37s

     Running tests/p6_m16_doc.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m16_doc-a783ecb95132fc08)

running 1 test
test document_has_a_status_row_for_every_web_symbol ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m16_gallery.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m16_gallery-40cbda6184b177cf)

running 2 tests
test gallery_combo_eligible_and_show_model_match_web ... ok
test gallery_terrain_eligible_matches_web ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.23s

     Running tests/p6_m16_qualifier.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m16_qualifier-54c27efc7f24500a)

running 4 tests
test forest_build_block_reason_matches_web ... ok
test api_hex_click_and_on_select_match_web ... ok
test api_qualifying_hexes_and_work_cost_match_web ... ok
test qualifier_bits_match_web_for_every_key_and_hex ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 11.20s

     Running tests/p6_m16_rules.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m16_rules-33e7267e34428bc9)

running 15 tests
test deposit_rules_match_web ... ok
test forest_blocking_and_hints_match_web ... ok
test can_add_food_layer_matches_web ... ok
test farm_and_owce_base_terrain_match_web ... ok
test hex_has_road_matches_web ... ok
test format_impact_list_matches_web ... ok
test hex_keys_within_radius_matches_web ... ok
test improvement_meta_and_tech_gate_match_web ... ok
test livestock_dependency_matches_web ... ok
test legacy_farm_layer_and_strip_match_web ... ok
test mine_keys_tarasy_civ_and_food_keys_match_web ... ok
test plan_and_remove_legacy_farms_match_web ... ok
test replaced_by_build_and_impact_match_web ... ok
test strip_improvements_when_forest_removed_matches_web ... ok
test work_cost_scale_matches_web ... ok

test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 5.54s

     Running tests/p6_m16_tables.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m16_tables-fd1582fd8a835964)

running 5 tests
test food_and_sector_tables_are_consistent ... ok
test improvement_build_has_no_balance_number_literals ... ok
test terrain_codes_in_tables_are_valid ... ok
test livestock_and_tech_tables_are_consistent ... ok
test rule_keys_are_known_improvements ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m17_rebuild.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m17_rebuild-60f4b8705aae281a)

running 5 tests
test js_keyed_map_orders_array_index_keys_first ... ok
test rebuild_error_class_matches_web_failure_class ... ok
test rebuild_errors_name_the_failing_field ... ok
test serialize_rebuild_serialize_is_stable_without_duplicate_coords ... ok
test rebuild_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.29s

     Running tests/p6_m17_serialize.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m17_serialize-bc527bf55aa676f5)

running 5 tests
test js_num_writes_integers_without_fraction_and_non_finite_as_null ... ok
test serialize_vectors_touch_every_branch ... ok
test serialize_text_is_byte_identical_to_web_json_stringify ... ok
test serialize_matches_web_structurally ... ok
test snapshot_shape_invariants_hold_for_every_vector ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.26s

     Running tests/p6_m17_validate.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/p6_m17_validate-f52da1b0e7422d55)

running 2 tests
test is_valid_matches_web_for_all_vectors ... ok
test every_serialize_vector_snapshot_has_a_web_validity_vector ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.37s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test canonical_state_dto_vector_round_trips_through_json ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test public_engine_wire_aliases_are_stable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/recruitment-10fa19ca5709d7f0)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok
test multiple_layers_stack_additively_per_resource ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test copied_state_and_forks_reproduce_independent_streams ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/road_movement_multipliers.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/road_movement_multipliers-10cca6a7ed28e576)

running 3 tests
test road_movement_table_covers_each_constant_once ... ok
test road_divisors_are_integers_read_from_the_table ... ok
test road_floor_row_is_readable_and_positive ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test canonical_state_round_trips_through_serde ... ok
test city_rejects_empty_names_and_zero_population ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test unavailable_mock_rejects_every_steam_operation ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/structure_defense_max.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/structure_defense_max-97cd066d284c179b)

running 3 tests
test combined_structures_equal_the_strongest_single_structure ... ok
test no_structure_gives_neutral_multiplier ... ok
test structures_are_ignored_outside_siege ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_crosses_desert_field ... ok
test trade_routes_do_not_cross_tundra ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test diff_and_serialization_preserve_route_contract ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test settlement_credits_income_before_paying_expenses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_3c3a998e-4cb-1/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 6 tests
test current_and_previous_epochs_are_available ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test scout_is_available_in_every_epoch ... ok
test p6_1_civ_entry_api_is_exercised ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

### 11.4 git diff --check (gate-diffcheck-r1.log)

```text
$ git diff --check
EXIT=0
$ git diff --cached --check
EXIT=0
```

### 11.5 generator wektorow (gen-m05a-r1.log)

```text
OK {
 "maps": 56,
 "stats": {
  "pickSpread.nonempty": 287,
  "pickSpread.empty": 113,
  "masses.total": 176,
  "center.some": 759,
  "centerDist.points": 10626,
  "centroid.some": 253,
  "center.null": 300,
  "centroid.null": 100,
  "partition.kontynenty.nocont": 56,
  "partition.kontynenty.cont": 112,
  "partition.voronoiPath": 190,
  "partition.pangea.nocont": 56,
  "partition.pangea.cont": 112,
  "partition.wyspy.nocont": 56,
  "partition.wyspy.cont": 112,
  "partition.ziemia.nocont": 56,
  "partition.ziemia.cont": 112,
  "cellCounts.cases": 842,
  "cellCounts.ironNo": 439,
  "cellCounts.copperNo": 451,
  "cellCounts.hostYes": 573,
  "canHostEdge.yes": 1438,
  "canHostEdge.no": 1088,
  "cellCounts.hostNo": 269,
  "cellCounts.ironYes": 403,
  "cellCounts.copperYes": 391,
  "ratios.assertNo": 205,
  "ratios.ironPartial": 155,
  "ratios.copperPartial": 159,
  "ratios.copperFull": 147,
  "ratios.assertYes": 101,
  "ratios.ironFull": 151,
  "pickForce.some": 808,
  "forceType.type-mountain.changed": 240,
  "forceType.type-highland.changed": 225,
  "forceType.iron.changed": 201,
  "forceType.copper.changed": 186,
  "forceType.both.changed": 280,
  "capCell.mtn.same": 291,
  "capCell.hi.same": 317,
  "capCell.mtn-spread.same": 270,
  "capCell.hi-spread.same": 302,
  "capCell.relief.same": 233,
  "forceType.type-mountain.same": 181,
  "forceType.type-highland.same": 196,
  "forceType.iron.same": 220,
  "forceType.copper.same": 235,
  "forceType.both.same": 141,
  "capCell.mtn.changed": 130,
  "capCell.hi.changed": 104,
  "capCell.mtn-spread.changed": 151,
  "capCell.relief.changed": 188,
  "capCell.hi-spread.changed": 119,
  "pickForce.null": 82,
  "capSpread.cases": 219,
  "ensureMass.iron.cap.fixed": 134,
  "ensureMass.iron.skip.fixed": 134,
  "ensureMass.copper.cap.fixed": 132,
  "ensureMass.copper.skip.fixed": 132,
  "ensureMass.copper.cap.none": 87,
  "ensureMass.copper.skip.none": 87,
  "capSpread.changed": 123,
  "ensureMass.iron.cap.none": 85,
  "ensureMass.iron.skip.none": 85,
  "applyKeys.copper.changed": 76,
  "applyKeys.spec.mass": 106,
  "applyKeys.iron.changed": 58,
  "applyRank.kontynenty.changed": 128,
  "applyRank.pangea.changed": 155,
  "applyRank.wyspy.changed": 128,
  "applyRank.ziemia.changed": 155,
  "applyKeys.spec.allLand": 107,
  "applyKeys.both.changed": 66,
  "applyKeys.spec.explicit": 123,
  "applyKeys.iron.same": 40,
  "applyKeys.both.same": 48,
  "applyKeys.copper.same": 48,
  "applyRank.kontynenty.same": 40,
  "applyRank.pangea.same": 13,
  "applyRank.wyspy.same": 40,
  "applyRank.ziemia.same": 13,
  "pickForceWater.some": 80
 }
}
REPRODUKCJA: drugi przebieg generatora na tym samym web-rootcie, SHA-256 identyczny z web-vectors.json: 238ebe04ccff97d89160b1ed57395b687426039abbdf59487d77e6875916838c
```

### 11.6 weryfikator niezalezny (verify-m05a-r1.log)

```text
wartosci tabeli sprawdzone wzgledem TS: 50/50
audyt literalow: 41 literalow poza {0,1,2}, wszystkie w liniach zrodel tabeli
checks=88941 rozbieznosci=0
EXIT=0
```

### 11.7 weryfikator - test negatywny (verify-m05a-negative-r1.log)

```text
wartosci tabeli sprawdzone wzgledem TS: 50/50
audyt literalow: 41 literalow poza {0,1,2}, wszystkie w liniach zrodel tabeli
ROZBIEZNOSC: spreadCapMountain low 1391
ROZBIEZNOSC: minLand 124.37099218484946
ROZBIEZNOSC: landCells komorka 0,0
ROZBIEZNOSC: pickSpread 0.5 0
ROZBIEZNOSC: masy mapa 2
ROZBIEZNOSC: kwadrat bbox mapa 0
ROZBIEZNOSC: partycje skroty mapa 4 kontynenty
ROZBIEZNOSC: cellCounts mapa 5 high liczniki
ROZBIEZNOSC: ratios mapa 4 high iron 12
ROZBIEZNOSC: pickForceWater mapa 4 highland liczba losowan
ROZBIEZNOSC: forceType mapa 0 iron low: zmiany stanu
ROZBIEZNOSC: ensureMass mapa 2 iron medium skip=1 liczba losowan
ROZBIEZNOSC: applyRank mapa 0 wyspy high: skrot stanu
checks=88941 rozbieznosci=13
EXIT=1
```

### 11.8 mutacje (mutations-r1-a.log)

```text
SHA256 poczatkowe: src/domain/mapgen/relief.rs=4c23993d004feed6202ceecf5f653fb360916f4975af75dc548bad595a4d75d3 data/derived/mapgen-relief-a.json=25aba4016ef7a2b1437820f08a369a1329893536d66a07ec7a2040520bd7e753
DRZEWO CZYSTE przed przebiegiem (git status --porcelain --untracked-files=no puste)
   group-bfs-queue: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   group-bfs-queue [celowany] (97 s): 1 testow FAILED: group_land_mass_keys_matches_web
   group-neighbor-water-ignored: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   group-neighbor-water-ignored [celowany] (94 s): 1 testow FAILED: group_land_mass_keys_matches_web
   group-start-water-ignored: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   group-start-water-ignored [celowany] (90 s): 1 testow FAILED: group_land_mass_keys_matches_web
   river-land-polar-removed: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   river-land-polar-removed [celowany] (95 s): 1 testow FAILED: centroid_center_square_and_distance_match_web
```

### 11.9 mutacje (mutations-r1-b.log)

```text
SHA256 poczatkowe: src/domain/mapgen/relief.rs=4c23993d004feed6202ceecf5f653fb360916f4975af75dc548bad595a4d75d3 data/derived/mapgen-relief-a.json=25aba4016ef7a2b1437820f08a369a1329893536d66a07ec7a2040520bd7e753
DRZEWO CZYSTE przed przebiegiem (git status --porcelain --untracked-files=no puste)
   partition-upper-clamp-removed: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   partition-upper-clamp-removed [celowany] (94 s): 1 testow FAILED: land_partition_keys_for_distribution_matches_web
   cells-floor-to-trunc: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   cells-floor-to-trunc [celowany] (85 s): 1 testow FAILED: land_hexes_by_coverage_cell_matches_web
```

### 11.10 mutacje (mutations-r1-c.log)

```text
SHA256 poczatkowe: src/domain/mapgen/relief.rs=4c23993d004feed6202ceecf5f653fb360916f4975af75dc548bad595a4d75d3 data/derived/mapgen-relief-a.json=25aba4016ef7a2b1437820f08a369a1329893536d66a07ec7a2040520bd7e753
DRZEWO CZYSTE przed przebiegiem (git status --porcelain --untracked-files=no puste)
   forest-eligible-desert: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   forest-eligible-desert [celowany] (83 s): 1 testow FAILED: forest_eligible_and_deposit_protection_match_web
   bonus-cap-mountain-ceil-to-floor: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   bonus-cap-mountain-ceil-to-floor [celowany] (71 s): 1 testow FAILED: caps_match_web
   overflow-resolve-mountain-ge: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   overflow-resolve-mountain-ge [celowany] (110 s): 1 testow FAILED: overflow_cap_frac_with_damaged_json_matches_web
   min-land-floor-to-ceil: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   min-land-floor-to-ceil [celowany] (109 s): 1 testow FAILED: min_land_hexes_match_web
   deprecated-min-mountains-tier: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   deprecated-min-mountains-tier [celowany] (93 s): 1 testow FAILED: consts_and_tier_tables_match_web
   iron-package-ge-to-gt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   iron-package-ge-to-gt [celowany] (85 s): 1 testow FAILED: cell_counters_and_packages_match_web
   coverage-empty-ratio-zero: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   coverage-empty-ratio-zero [celowany] (84 s): 1 testow FAILED: grid_coverage_ratios_match_web
```

### 11.10b mutacje (mutations-r1-d.log)

```text
SHA256 poczatkowe: src/domain/mapgen/relief.rs=4c23993d004feed6202ceecf5f653fb360916f4975af75dc548bad595a4d75d3 data/derived/mapgen-relief-a.json=25aba4016ef7a2b1437820f08a369a1329893536d66a07ec7a2040520bd7e753
DRZEWO CZYSTE przed przebiegiem (git status --porcelain --untracked-files=no puste)
   apply-sort-ascending: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   apply-sort-ascending [celowany] (82 s): 1 testow FAILED: apply_relief_to_land_keys_matches_web
   rank-ignores-candidate-filter: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   rank-ignores-candidate-filter [celowany] (89 s): 2 testow FAILED: apply_relief_by_noise_rank_default_arguments_match_web, apply_relief_by_noise_rank_matches_web
   pick-spread-dist-ge-to-gt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   pick-spread-dist-ge-to-gt [celowany] (95 s): 1 testow FAILED: pick_spread_relief_keys_matches_web
   force-no-rand-call: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-no-rand-call [celowany] (100 s): 1 testow FAILED: pick_relief_force_hex_matches_web
   force-protect-highland-le-to-lt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-protect-highland-le-to-lt [celowany] (119 s): 1 testow FAILED: force_relief_type_in_cell_matches_web
   deposit-protection-off: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   deposit-protection-off [celowany] (110 s): 1 testow FAILED: cap_overflow_in_cell_matches_web
   cap-spread-skips-highland: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   cap-spread-skips-highland [celowany] (97 s): 1 testow FAILED: cap_iron_cell_relief_spread_matches_web
   ensure-skip-cap-ignored: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   ensure-skip-cap-ignored [celowany] (125 s): 1 testow FAILED: ensure_mass_grid_coverage_matches_web
   centroid-count-doubled: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   centroid-count-doubled [celowany] (90 s): 1 testow FAILED: centroid_center_square_and_distance_match_web
   partition-islands-to-pangea: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   partition-islands-to-pangea [celowany] (109 s): 1 testow FAILED: land_partition_keys_for_distribution_matches_web
   cells-r-floor-to-trunc: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   cells-r-floor-to-trunc [celowany] (120 s): 1 testow FAILED: land_hexes_by_coverage_cell_matches_web
   bonus-cap-highland-ceil-to-floor: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   bonus-cap-highland-ceil-to-floor [celowany] (123 s): 1 testow FAILED: caps_match_web
   overflow-resolve-highland-nan-only: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   overflow-resolve-highland-nan-only [celowany] (104 s): 1 testow FAILED: overflow_cap_frac_with_damaged_json_matches_web
   min-land-max-to-min: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   min-land-max-to-min [celowany] (87 s): 1 testow FAILED: min_land_hexes_match_web
   tier-value-low-reads-medium: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tier-value-low-reads-medium [celowany] (98 s): 1 testow FAILED: consts_and_tier_tables_match_web
   copper-package-ge-to-gt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   copper-package-ge-to-gt [celowany] (131 s): 1 testow FAILED: cell_counters_and_packages_match_web
   coverage-min-land-lt-to-le: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   coverage-min-land-lt-to-le [celowany] (109 s): 1 testow FAILED: grid_coverage_ratios_match_web
INFRA     apply-iron-skips-hills: brak miejsca / proces ubity -> powtorzenie 1/8 po 60 s
   apply-iron-skips-hills: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   apply-iron-skips-hills [celowany] (269 s): 1 testow FAILED: apply_relief_to_land_keys_matches_web
   rank-ignores-world-type: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   rank-ignores-world-type [celowany] (109 s): 1 testow FAILED: apply_relief_by_noise_rank_matches_web
   pick-spread-second-pass-off: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   pick-spread-second-pass-off [celowany] (117 s): 1 testow FAILED: pick_spread_relief_keys_matches_web
   force-rank-ascending: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-rank-ascending [celowany] (136 s): 1 testow FAILED: pick_relief_force_hex_matches_web
   force-protect-mountain-le-to-lt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-protect-mountain-le-to-lt [celowany] (88 s): 1 testow FAILED: force_relief_type_in_cell_matches_web
   cap-protected-not-skipped: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   cap-protected-not-skipped [celowany] (87 s): 1 testow FAILED: cap_overflow_in_cell_matches_web
   cap-spread-min-land-lt-to-le: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  cap-spread-min-land-lt-to-le (251 s): wszystkie testy zielone
   ensure-eligible-ge-to-gt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   ensure-eligible-ge-to-gt [celowany] (107 s): 1 testow FAILED: ensure_mass_grid_coverage_matches_web
   center-span-le-to-lt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   center-span-le-to-lt [celowany] (75 s): 1 testow FAILED: centroid_center_square_and_distance_match_web
   partition-keeps-empty-zones: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=4c23993d004feed6..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo BRUDNE:M dyspozycje/autobot/runs/R-RUSTPORT-P6-M05A-RELIEF-A-MASY-POKRYCIE-Q1/gen-m05a-vectors.mjs
BLAD KRYTYCZNY: po mutacji partition-keeps-empty-zones drzewo nie jest czyste / plik rozni sie od oryginalu
```

### 11.10c mutacje (mutations-r1-e.log)

```text
SHA256 poczatkowe: src/domain/mapgen/relief.rs=81b64994923ceb3f77340d765bb39e50e1655f792d83d034a99ac4a75a1d355d data/derived/mapgen-relief-a.json=25aba4016ef7a2b1437820f08a369a1329893536d66a07ec7a2040520bd7e753
DRZEWO CZYSTE przed przebiegiem (git status --porcelain --untracked-files=no puste)
   cap-spread-min-land-lt-to-le: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   cap-spread-min-land-lt-to-le [celowany] (39 s): 1 testow FAILED: cap_iron_cell_relief_spread_matches_web
   partition-keeps-empty-zones: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   partition-keeps-empty-zones [celowany] (37 s): 1 testow FAILED: land_partition_keys_for_distribution_matches_web
   spread-cap-mountain-max-to-min: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   spread-cap-mountain-max-to-min [celowany] (37 s): 1 testow FAILED: caps_match_web
   tbl-fallback-mountain-medium: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-fallback-mountain-medium [celowany] (37 s): 1 testow FAILED: overflow_cap_frac_with_damaged_json_matches_web
   tbl-min-land-floor: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-min-land-floor [celowany] (45 s): 1 testow FAILED: min_land_hexes_match_web
   forest-cap-reads-share: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   forest-cap-reads-share [celowany] (58 s): 1 testow FAILED: consts_and_tier_tables_match_web
   has-mountain-always: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   has-mountain-always [celowany] (37 s): 1 testow FAILED: cell_counters_and_packages_match_web
   relief-ratio-sum-not-averaged: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   relief-ratio-sum-not-averaged [celowany] (37 s): 1 testow FAILED: grid_coverage_ratios_match_web
   apply-copper-skips-mountains: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   apply-copper-skips-mountains [celowany] (27 s): 1 testow FAILED: apply_relief_to_land_keys_matches_web
   pick-spread-axial-drops-s: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   pick-spread-axial-drops-s [celowany] (30 s): 1 testow FAILED: pick_spread_relief_keys_matches_web
   force-highland-mult-dropped: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-highland-mult-dropped [celowany] (35 s): 1 testow FAILED: pick_relief_force_hex_matches_web
   force-clears-deposit-removed: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-clears-deposit-removed [celowany] (34 s): 1 testow FAILED: force_relief_type_in_cell_matches_web
   cap-total-gt-to-ge: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   cap-total-gt-to-ge [celowany] (40 s): 1 testow FAILED: cap_overflow_in_cell_matches_web
   cap-spread-not-spread: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   cap-spread-not-spread [celowany] (39 s): 1 testow FAILED: cap_iron_cell_relief_spread_matches_web
   ensure-copper-uses-iron-size: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  ensure-copper-uses-iron-size (67 s): wszystkie testy zielone
   center-round-to-floor: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   center-round-to-floor [celowany] (35 s): 1 testow FAILED: centroid_center_square_and_distance_match_web
   partition-missing-entry-default: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   partition-missing-entry-default [celowany] (37 s): 1 testow FAILED: land_partition_keys_for_distribution_matches_web
   spread-cap-highland-ceil-to-floor: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   spread-cap-highland-ceil-to-floor [celowany] (32 s): 1 testow FAILED: caps_match_web
   tbl-fallback-highland-low: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-fallback-highland-low [celowany] (34 s): 1 testow FAILED: overflow_cap_frac_with_damaged_json_matches_web
   tbl-min-land-fraction: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-min-land-fraction [celowany] (38 s): 1 testow FAILED: min_land_hexes_match_web
   center-size-plus-one: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   center-size-plus-one [celowany] (36 s): 1 testow FAILED: consts_and_tier_tables_match_web
   relief-package-and-to-or: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   relief-package-and-to-or [celowany] (37 s): 1 testow FAILED: cell_counters_and_packages_match_web
   relief-ratio-default-tier: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   relief-ratio-default-tier [celowany] (45 s): 1 testow FAILED: grid_coverage_ratios_match_web
   apply-iron-bonus-floor: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   apply-iron-bonus-floor [celowany] (36 s): 1 testow FAILED: apply_relief_to_land_keys_matches_web
   pick-spread-count-ge-to-gt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   pick-spread-count-ge-to-gt [celowany] (39 s): 1 testow FAILED: pick_spread_relief_keys_matches_web
   force-shallow-penalty-sign: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  force-shallow-penalty-sign (96 s): wszystkie testy zielone
   force-clears-overlay-removed: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-clears-overlay-removed [celowany] (33 s): 1 testow FAILED: force_relief_type_in_cell_matches_web
   cap-mountain-drops-to-plains: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   cap-mountain-drops-to-plains [celowany] (42 s): 1 testow FAILED: cap_overflow_in_cell_matches_web
   ensure-sort-reversed: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  ensure-sort-reversed (105 s): wszystkie testy zielone
   center-round-r-to-floor: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   center-round-r-to-floor [celowany] (47 s): 1 testow FAILED: centroid_center_square_and_distance_match_web
   partition-needs-positive-n: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   partition-needs-positive-n [celowany] (34 s): 1 testow FAILED: land_partition_keys_for_distribution_matches_web
   spread-frac-mountain-uses-highland: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   spread-frac-mountain-uses-highland [celowany] (32 s): 1 testow FAILED: caps_match_web
   fair-play-size-uses-forest: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   fair-play-size-uses-forest [celowany] (32 s): 1 testow FAILED: consts_and_tier_tables_match_web
   eligible-relief-counts-water: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   eligible-relief-counts-water [celowany] (32 s): 1 testow FAILED: cell_counters_and_packages_match_web
   relief-ratio-copper-size-unrounded: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
BLAD-KOMPILACJI relief-ratio-copper-size-unrounded: error[E0308]: mismatched types | For more information about this error, try `rustc --explain E0308`. | error: could not compile `civ-engine` (lib) due to 1 previous error
   apply-copper-bonus-floor: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   apply-copper-bonus-floor [celowany] (43 s): 1 testow FAILED: apply_relief_to_land_keys_matches_web
   pick-spread-axial-ds-sign: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   pick-spread-axial-ds-sign [celowany] (39 s): 1 testow FAILED: pick_spread_relief_keys_matches_web
   force-border-dist-unclamped: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-border-dist-unclamped [celowany] (40 s): 1 testow FAILED: pick_relief_force_hex_matches_web
   force-initial-ge-to-gt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  force-initial-ge-to-gt (116 s): wszystkie testy zielone
   cap-highland-drops-to-grass: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   cap-highland-drops-to-grass [celowany] (35 s): 1 testow FAILED: cap_overflow_in_cell_matches_web
   ensure-fixed-counts-double: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   ensure-fixed-counts-double [celowany] (35 s): 1 testow FAILED: ensure_mass_grid_coverage_matches_web
   center-half-floor-to-ceil: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   center-half-floor-to-ceil [celowany] (47 s): 1 testow FAILED: centroid_center_square_and_distance_match_web
   tbl-bonus-mountain-medium: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-bonus-mountain-medium [celowany] (47 s): 1 testow FAILED: caps_match_web
   river-sources-plus-one: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   river-sources-plus-one [celowany] (40 s): 1 testow FAILED: consts_and_tier_tables_match_web
   host-min-land-lt-to-le: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   host-min-land-lt-to-le [celowany] (57 s): 1 testow FAILED: cell_counters_and_packages_match_web
   assert-coverage-lt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   assert-coverage-lt [celowany] (55 s): 1 testow FAILED: grid_coverage_ratios_match_web
   apply-iron-min-to-max: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   apply-iron-min-to-max [celowany] (52 s): 1 testow FAILED: apply_relief_to_land_keys_matches_web
   force-avoid-ignored: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-avoid-ignored [celowany] (44 s): 1 testow FAILED: pick_relief_force_hex_matches_web
   force-loop-ge-to-gt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-loop-ge-to-gt [celowany] (49 s): 1 testow FAILED: force_relief_type_in_cell_matches_web
   cap-sort-descending: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   cap-sort-descending [celowany] (47 s): 1 testow FAILED: cap_overflow_in_cell_matches_web
   ensure-copper-checks-iron-package: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   ensure-copper-checks-iron-package [celowany] (52 s): 1 testow FAILED: ensure_mass_grid_coverage_matches_web
   center-qmax-le-to-lt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   center-qmax-le-to-lt [celowany] (53 s): 1 testow FAILED: centroid_center_square_and_distance_match_web
   tbl-bonus-highland-high: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-bonus-highland-high [celowany] (56 s): 1 testow FAILED: caps_match_web
   tbl-center-size: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-center-size [celowany] (60 s): 1 testow FAILED: consts_and_tier_tables_match_web
   host-river-negated: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   host-river-negated [celowany] (50 s): 1 testow FAILED: cell_counters_and_packages_match_web
   tbl-copper-multiplier: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-copper-multiplier [celowany] (46 s): 1 testow FAILED: grid_coverage_ratios_match_web
   apply-copper-min-to-max: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   apply-copper-min-to-max [celowany] (48 s): 1 testow FAILED: apply_relief_to_land_keys_matches_web
   force-protect-highland-ignored: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-protect-highland-ignored [celowany] (56 s): 1 testow FAILED: pick_relief_force_hex_matches_web
   force-placed-not-recorded: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  force-placed-not-recorded (111 s): wszystkie testy zielone
   cap-mountain-bonus-without-min: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   cap-mountain-bonus-without-min [celowany] (37 s): 1 testow FAILED: cap_overflow_in_cell_matches_web
   ensure-cap-copper-caps-mountains: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   ensure-cap-copper-caps-mountains [celowany] (44 s): 1 testow FAILED: ensure_mass_grid_coverage_matches_web
   center-rmin-ge-to-gt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   center-rmin-ge-to-gt [celowany] (45 s): 1 testow FAILED: centroid_center_square_and_distance_match_web
   tbl-forest-share-medium: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-forest-share-medium [celowany] (45 s): 1 testow FAILED: consts_and_tier_tables_match_web
   eligible-forest-uses-water-test: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   eligible-forest-uses-water-test [celowany] (46 s): 1 testow FAILED: cell_counters_and_packages_match_web
   tbl-coverage-threshold: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-coverage-threshold [celowany] (50 s): 1 testow FAILED: grid_coverage_ratios_match_web
   apply-iron-keeps-overlay: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   apply-iron-keeps-overlay [celowany] (45 s): 1 testow FAILED: apply_relief_to_land_keys_matches_web
   force-protect-mountain-ignored: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-protect-mountain-ignored [celowany] (55 s): 1 testow FAILED: pick_relief_force_hex_matches_web
   force-second-pick-keeps-protect: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-second-pick-keeps-protect [celowany] (58 s): 1 testow FAILED: force_relief_type_in_cell_matches_web
   cap-highland-bonus-without-min: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   cap-highland-bonus-without-min [celowany] (59 s): 1 testow FAILED: cap_overflow_in_cell_matches_web
   ensure-pass-not-incremented-twice: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  ensure-pass-not-incremented-twice (138 s): wszystkie testy zielone
   center-fallback-disabled: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   center-fallback-disabled [celowany] (58 s): 1 testow FAILED: centroid_center_square_and_distance_match_web
   tbl-forest-cap: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-forest-cap [celowany] (58 s): 1 testow FAILED: consts_and_tier_tables_match_web
   apply-copper-keeps-overlay: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   apply-copper-keeps-overlay [celowany] (54 s): 1 testow FAILED: apply_relief_to_land_keys_matches_web
   force-water-allowed: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  force-water-allowed (118 s): wszystkie testy zielone
   force-wrapper-iron-uses-highland: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-wrapper-iron-uses-highland [celowany] (52 s): 1 testow FAILED: force_relief_type_in_cell_matches_web
   cap-mountain-spread-flag-ignored: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   cap-mountain-spread-flag-ignored [celowany] (45 s): 1 testow FAILED: cap_overflow_in_cell_matches_web
   ensure-iron-wrapper-want: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   ensure-iron-wrapper-want [celowany] (49 s): 1 testow FAILED: ensure_mass_grid_coverage_matches_web
   dist-axial-divisor: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   dist-axial-divisor [celowany] (51 s): 1 testow FAILED: centroid_center_square_and_distance_match_web
   tbl-min-mountains-medium: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-min-mountains-medium [celowany] (52 s): 1 testow FAILED: consts_and_tier_tables_match_web
   apply-iron-min-land-lt-to-le: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   apply-iron-min-land-lt-to-le [celowany] (46 s): 1 testow FAILED: apply_relief_to_land_keys_matches_web
   tbl-highland-multiplier: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-highland-multiplier [celowany] (46 s): 1 testow FAILED: pick_relief_force_hex_matches_web
   force-deprecated-short-circuits: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-deprecated-short-circuits [celowany] (48 s): 1 testow FAILED: force_relief_type_in_cell_matches_web
   cap-highland-spread-flag-inverted: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   cap-highland-spread-flag-inverted [celowany] (55 s): 1 testow FAILED: cap_overflow_in_cell_matches_web
   tbl-passes: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  tbl-passes (110 s): wszystkie testy zielone
   tbl-min-highlands-high: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-min-highlands-high [celowany] (41 s): 1 testow FAILED: consts_and_tier_tables_match_web
   apply-copper-min-land-lt-to-le: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   apply-copper-min-land-lt-to-le [celowany] (40 s): 1 testow FAILED: apply_relief_to_land_keys_matches_web
   tbl-border-cap: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-border-cap [celowany] (44 s): 1 testow FAILED: pick_relief_force_hex_matches_web
   force-deprecated-uses-low-tier: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-deprecated-uses-low-tier [celowany] (41 s): 1 testow FAILED: force_relief_type_in_cell_matches_web
   cap-clears-deposit-removed: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  cap-clears-deposit-removed (114 s): wszystkie testy zielone
   tbl-water-cell-low: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-water-cell-low [celowany] (42 s): 1 testow FAILED: consts_and_tier_tables_match_web
   apply-iron-uses-copper-cell: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  apply-iron-uses-copper-cell (104 s): wszystkie testy zielone
   tbl-border-weight: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-border-weight [celowany] (41 s): 1 testow FAILED: pick_relief_force_hex_matches_web
   cap-clears-overlay-removed: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   cap-clears-overlay-removed [celowany] (46 s): 1 testow FAILED: cap_overflow_in_cell_matches_web
   tbl-forest-cell-medium: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-forest-cell-medium [celowany] (48 s): 1 testow FAILED: consts_and_tier_tables_match_web
   apply-mass-set-not-deduped: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   apply-mass-set-not-deduped [celowany] (50 s): 1 testow FAILED: apply_relief_to_land_keys_matches_web
   tbl-shallow-penalty: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  tbl-shallow-penalty (117 s): wszystkie testy zielone
   cap-relief-no-short-circuit: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   cap-relief-no-short-circuit [celowany] (37 s): 1 testow FAILED: cap_overflow_in_cell_matches_web
   tbl-river-sources: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-river-sources [celowany] (43 s): 1 testow FAILED: consts_and_tier_tables_match_web
   tbl-spread-mountain-dist: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-spread-mountain-dist [celowany] (38 s): 1 testow FAILED: apply_relief_to_land_keys_matches_web
   tbl-rand-weight: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-rand-weight [celowany] (43 s): 1 testow FAILED: pick_relief_force_hex_matches_web
   tbl-overflow-multiplier: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-overflow-multiplier [celowany] (44 s): 1 testow FAILED: cap_overflow_in_cell_matches_web
   tbl-spread-highland-dist: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-spread-highland-dist [celowany] (43 s): 1 testow FAILED: apply_relief_to_land_keys_matches_web
   tbl-iron-cell-medium: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-iron-cell-medium [celowany] (44 s): 1 testow FAILED: apply_relief_to_land_keys_matches_web
   tbl-copper-cell-high: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   tbl-copper-cell-high [celowany] (39 s): 1 testow FAILED: apply_relief_to_land_keys_matches_web
SHA256 koncowe:    src/domain/mapgen/relief.rs=81b64994923ceb3f77340d765bb39e50e1655f792d83d034a99ac4a75a1d355d data/derived/mapgen-relief-a.json=25aba4016ef7a2b1437820f08a369a1329893536d66a07ec7a2040520bd7e753
DRZEWO na koncu: CZYSTE
WYKRYTE PRZEZ INNY TEST NIZ CELOWANY: []
POWTORZENIA Z POWODU INFRA: []
TIMEOUTY: []
PODSUMOWANIE [MUTACJE (oczekiwane: wszystkie wykryte)]: wykryte 92/104, przezyly: ['ensure-copper-uses-iron-size', 'force-shallow-penalty-sign', 'ensure-sort-reversed', 'relief-ratio-copper-size-unrounded (blad kompilacji)', 'force-initial-ge-to-gt', 'force-placed-not-recorded', 'ensure-pass-not-incremented-twice', 'force-water-allowed', 'tbl-passes', 'cap-clears-deposit-removed', 'apply-iron-uses-copper-cell', 'tbl-shallow-penalty'], pliki przywrocone bajt w bajt: True
```

### 11.10d mutacje (mutations-r1-f.log)

```text
SHA256 poczatkowe: src/domain/mapgen/relief.rs=81b64994923ceb3f77340d765bb39e50e1655f792d83d034a99ac4a75a1d355d data/derived/mapgen-relief-a.json=25aba4016ef7a2b1437820f08a369a1329893536d66a07ec7a2040520bd7e753
DRZEWO CZYSTE przed przebiegiem (git status --porcelain --untracked-files=no puste)
   relief-ratio-copper-size-unrounded: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   relief-ratio-copper-size-unrounded [celowany] (51 s): 1 testow FAILED: grid_coverage_ratios_match_web
   force-water-allowed: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   force-water-allowed [celowany] (43 s): 1 testow FAILED: pick_relief_force_hex_filters_water_cells_like_web
SHA256 koncowe:    src/domain/mapgen/relief.rs=81b64994923ceb3f77340d765bb39e50e1655f792d83d034a99ac4a75a1d355d data/derived/mapgen-relief-a.json=25aba4016ef7a2b1437820f08a369a1329893536d66a07ec7a2040520bd7e753
DRZEWO na koncu: CZYSTE
WYKRYTE PRZEZ INNY TEST NIZ CELOWANY: []
POWTORZENIA Z POWODU INFRA: []
TIMEOUTY: []
PODSUMOWANIE [MUTACJE (oczekiwane: wszystkie wykryte)]: wykryte 2/2, przezyly: [], pliki przywrocone bajt w bajt: True
```

### 11.11 mutacje rownowazne (mutations-r1-equiv.log)

```text
SHA256 poczatkowe: src/domain/mapgen/relief.rs=81b64994923ceb3f77340d765bb39e50e1655f792d83d034a99ac4a75a1d355d data/derived/mapgen-relief-a.json=25aba4016ef7a2b1437820f08a369a1329893536d66a07ec7a2040520bd7e753
DRZEWO CZYSTE przed przebiegiem (git status --porcelain --untracked-files=no puste)
   eq-dist-inside-square-zero: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  eq-dist-inside-square-zero (135 s): wszystkie testy zielone
   eq-dist-empty-keys-zero: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  eq-dist-empty-keys-zero (129 s): wszystkie testy zielone
   eq-partition-lower-clamp: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  eq-partition-lower-clamp (145 s): wszystkie testy zielone
   eq-apply-nonpositive-count-lt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  eq-apply-nonpositive-count-lt (137 s): wszystkie testy zielone
   eq-apply-empty-keys-guard: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  eq-apply-empty-keys-guard (130 s): wszystkie testy zielone
   eq-pick-spread-count-le-to-lt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  eq-pick-spread-count-le-to-lt (129 s): wszystkie testy zielone
   eq-force-guard-ge-to-gt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  eq-force-guard-ge-to-gt (134 s): wszystkie testy zielone
   eq-force-third-branch-sort: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  eq-force-third-branch-sort (147 s): wszystkie testy zielone
   eq-cap-min-guard-dropped: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  eq-cap-min-guard-dropped (138 s): wszystkie testy zielone
   eq-ensure-never-breaks-early: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  eq-ensure-never-breaks-early (144 s): wszystkie testy zielone
   eq-assert-coverage-ge-to-gt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  eq-assert-coverage-ge-to-gt (156 s): wszystkie testy zielone
   eq-tbl-guard-extra: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
WYKRYTA   eq-tbl-guard-extra [INNY TEST (celowany zielony)] (177 s): 1 testow FAILED: values_have_sane_shape
   apply-iron-uses-copper-cell: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  apply-iron-uses-copper-cell (166 s): wszystkie testy zielone
   force-shallow-penalty-sign: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  force-shallow-penalty-sign (170 s): wszystkie testy zielone
   force-initial-ge-to-gt: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  force-initial-ge-to-gt (183 s): wszystkie testy zielone
   force-placed-not-recorded: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  force-placed-not-recorded (165 s): wszystkie testy zielone
   cap-clears-deposit-removed: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  cap-clears-deposit-removed (157 s): wszystkie testy zielone
   ensure-copper-uses-iron-size: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  ensure-copper-uses-iron-size (200 s): wszystkie testy zielone
   ensure-sort-reversed: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  ensure-sort-reversed (214 s): wszystkie testy zielone
   ensure-pass-not-incremented-twice: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  ensure-pass-not-incremented-twice (211 s): wszystkie testy zielone
   tbl-shallow-penalty: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  tbl-shallow-penalty (205 s): wszystkie testy zielone
   tbl-passes: PRZYWROCONO git checkout OK; src/domain/mapgen/relief.rs:sha256=81b64994923ceb3f..=OK data/derived/mapgen-relief-a.json:sha256=25aba4016ef7a2b1..=OK; drzewo CZYSTE
PRZEZYLA  tbl-passes (203 s): wszystkie testy zielone
SHA256 koncowe:    src/domain/mapgen/relief.rs=81b64994923ceb3f77340d765bb39e50e1655f792d83d034a99ac4a75a1d355d data/derived/mapgen-relief-a.json=25aba4016ef7a2b1437820f08a369a1329893536d66a07ec7a2040520bd7e753
DRZEWO na koncu: CZYSTE
WYKRYTE PRZEZ INNY TEST NIZ CELOWANY: ['eq-tbl-guard-extra']
POWTORZENIA Z POWODU INFRA: []
TIMEOUTY: []
PODSUMOWANIE [ROWNOWAZNE (oczekiwane: przezyly)]: wykryte 1/22, przezyly: ['eq-dist-inside-square-zero', 'eq-dist-empty-keys-zero', 'eq-partition-lower-clamp', 'eq-apply-nonpositive-count-lt', 'eq-apply-empty-keys-guard', 'eq-pick-spread-count-le-to-lt', 'eq-force-guard-ge-to-gt', 'eq-force-third-branch-sort', 'eq-cap-min-guard-dropped', 'eq-ensure-never-breaks-early', 'eq-assert-coverage-ge-to-gt', 'apply-iron-uses-copper-cell', 'force-shallow-penalty-sign', 'force-initial-ge-to-gt', 'force-placed-not-recorded', 'cap-clears-deposit-removed', 'ensure-copper-uses-iron-size', 'ensure-sort-reversed', 'ensure-pass-not-incremented-twice', 'tbl-shallow-penalty', 'tbl-passes'], pliki przywrocone bajt w bajt: True
```

### 11.12 liczby przypadkow wektorow (vector-counts.txt)

```text
consts 1
overflowVariants 33
caps 2421
minLand 325
landCells 80
pickSpread 400
masses 56
center 353
nullSquareDist 1
partition 672
forestEligible 8
riverLand 8
cellCounts 842
canHostEdge 2526
ratios 306
pickForce 890
forceType 2105
capCell 2105
depositProtected 3
capSpread 219
ensureMass 876
applyKeys 336
applyRank 672
applyRankDefault 36
pickForceWater 80
RAZEM 15354 map 56
{"applyKeys.both.changed": 66, "applyKeys.both.same": 48, "applyKeys.copper.changed": 76, "applyKeys.copper.same": 48, "applyKeys.iron.changed": 58, "applyKeys.iron.same": 40, "applyKeys.spec.allLand": 107, "applyKeys.spec.explicit": 123, "applyKeys.spec.mass": 106, "applyRank.kontynenty.changed": 128, "applyRank.kontynenty.same": 40, "applyRank.pangea.changed": 155, "applyRank.pangea.same": 13, "applyRank.wyspy.changed": 128, "applyRank.wyspy.same": 40, "applyRank.ziemia.changed": 155, "applyRank.ziemia.same": 13, "canHostEdge.no": 1088, "canHostEdge.yes": 1438, "capCell.hi-spread.changed": 119, "capCell.hi-spread.same": 302, "capCell.hi.changed": 104, "capCell.hi.same": 317, "capCell.mtn-spread.changed": 151, "capCell.mtn-spread.same": 270, "capCell.mtn.changed": 130, "capCell.mtn.same": 291, "capCell.relief.changed": 188, "capCell.relief.same": 233, "capSpread.cases": 219, "capSpread.changed": 123, "cellCounts.cases": 842, "cellCounts.copperNo": 451, "cellCounts.copperYes": 391, "cellCounts.hostNo": 269, "cellCounts.hostYes": 573, "cellCounts.ironNo": 439, "cellCounts.ironYes": 403, "center.null": 300, "center.some": 759, "centerDist.points": 10626, "centroid.null": 100, "centroid.some": 253, "ensureMass.copper.cap.fixed": 132, "ensureMass.copper.cap.none": 87, "ensureMass.copper.skip.fixed": 132, "ensureMass.copper.skip.none": 87, "ensureMass.iron.cap.fixed": 134, "ensureMass.iron.cap.none": 85, "ensureMass.iron.skip.fixed": 134, "ensureMass.iron.skip.none": 85, "forceType.both.changed": 280, "forceType.both.same": 141, "forceType.copper.changed": 186, "forceType.copper.same": 235, "forceType.iron.changed": 201, "forceType.iron.same": 220, "forceType.type-highland.changed": 225, "forceType.type-highland.same": 196, "forceType.type-mountain.changed": 240, "forceType.type-mountain.same": 181, "masses.total": 176, "partition.kontynenty.cont": 112, "partition.kontynenty.nocont": 56, "partition.pangea.cont": 112, "partition.pangea.nocont": 56, "partition.voronoiPath": 190, "partition.wyspy.cont": 112, "partition.wyspy.nocont": 56, "partition.ziemia.cont": 112, "partition.ziemia.nocont": 56, "pickForce.null": 82, "pickForce.some": 808, "pickForceWater.some": 80, "pickSpread.empty": 113, "pickSpread.nonempty": 287, "ratios.assertNo": 205, "ratios.assertYes": 101, "ratios.copperFull": 147, "ratios.copperPartial": 159, "ratios.ironFull": 151, "ratios.ironPartial": 155}
{'center_dist_points': 10626, 'ratios_values': 3060, 'caps_values': 9684, 'hexes_total_pool': 65448}
```

### 11.13 porownanie wektorow stary/nowy zestaw (cmp-vectors-r1-r2.log)

```text
ce84f3864b5c9ba70e72394cbda71b9ec06466494ea47d266d1afe24ac84c3a4  /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/m05a-repeat.json
ROWNE consts
PREFIKS-OK overflowVariants: stare 11 -> nowe 11 (+0)
PREFIKS-OK caps: stare 2421 -> nowe 2421 (+0)
PREFIKS-OK minLand: stare 325 -> nowe 325 (+0)
PREFIKS-OK landCells: stare 80 -> nowe 80 (+0)
PREFIKS-OK pickSpread: stare 400 -> nowe 400 (+0)
PREFIKS-OK masses: stare 40 -> nowe 56 (+16)
PREFIKS-OK center: stare 273 -> nowe 353 (+80)
PREFIKS-OK nullSquareDist: stare 1 -> nowe 1 (+0)
PREFIKS-OK partition: stare 480 -> nowe 672 (+192)
PREFIKS-OK forestEligible: stare 8 -> nowe 8 (+0)
PREFIKS-OK riverLand: stare 8 -> nowe 8 (+0)
PREFIKS-OK cellCounts: stare 794 -> nowe 842 (+48)
PREFIKS-OK ratios: stare 258 -> nowe 306 (+48)
PREFIKS-OK pickForce: stare 794 -> nowe 890 (+96)
PREFIKS-OK forceType: stare 1925 -> nowe 2105 (+180)
PREFIKS-OK capCell: stare 1925 -> nowe 2105 (+180)
PREFIKS-OK depositProtected: stare 3 -> nowe 3 (+0)
PREFIKS-OK capSpread: stare 183 -> nowe 219 (+36)
PREFIKS-OK ensureMass: stare 732 -> nowe 876 (+144)
PREFIKS-OK applyKeys: stare 240 -> nowe 336 (+96)
PREFIKS-OK applyRank: stare 480 -> nowe 672 (+192)
PREFIKS-OK applyRankDefault: stare 36 -> nowe 36 (+0)
NOWA-KATEGORIA canHostEdge: 2526
PREFIKS-OK pula map: 40 -> 56
kategorie zgodne: 23, roznice: 0
EXIT=0
```

### 11.14 porownanie wektorow przed/po dodaniu `pickForceWater` (cmp-vectors-r1-r3.log)

```text
ROWNE consts
PREFIKS-OK overflowVariants: stare 11 -> nowe 11 (+0)
PREFIKS-OK caps: stare 2421 -> nowe 2421 (+0)
PREFIKS-OK minLand: stare 325 -> nowe 325 (+0)
PREFIKS-OK landCells: stare 80 -> nowe 80 (+0)
PREFIKS-OK pickSpread: stare 400 -> nowe 400 (+0)
PREFIKS-OK masses: stare 56 -> nowe 56 (+0)
PREFIKS-OK center: stare 353 -> nowe 353 (+0)
PREFIKS-OK nullSquareDist: stare 1 -> nowe 1 (+0)
PREFIKS-OK partition: stare 672 -> nowe 672 (+0)
PREFIKS-OK forestEligible: stare 8 -> nowe 8 (+0)
PREFIKS-OK riverLand: stare 8 -> nowe 8 (+0)
PREFIKS-OK cellCounts: stare 842 -> nowe 842 (+0)
PREFIKS-OK canHostEdge: stare 2526 -> nowe 2526 (+0)
PREFIKS-OK ratios: stare 306 -> nowe 306 (+0)
PREFIKS-OK pickForce: stare 890 -> nowe 890 (+0)
PREFIKS-OK forceType: stare 2105 -> nowe 2105 (+0)
PREFIKS-OK capCell: stare 2105 -> nowe 2105 (+0)
PREFIKS-OK depositProtected: stare 3 -> nowe 3 (+0)
PREFIKS-OK capSpread: stare 219 -> nowe 219 (+0)
PREFIKS-OK ensureMass: stare 876 -> nowe 876 (+0)
PREFIKS-OK applyKeys: stare 336 -> nowe 336 (+0)
PREFIKS-OK applyRank: stare 672 -> nowe 672 (+0)
PREFIKS-OK applyRankDefault: stare 36 -> nowe 36 (+0)
NOWA-KATEGORIA pickForceWater: 80
PREFIKS-OK pula map: 56 -> 56
kategorie zgodne: 24, roznice: 0
```
