# P6.M12 - klastry: compute i plan spawnu (`computeClusters`, `buildClusterSpawnPlan`, typy planu)

Temat: `R-RUSTPORT-P6-M12-KLASTRY-COMPUTE-SPAWN-PLAN-Q1` · DOMAIN: GAME · RUNDA 1/5 (Operator; Sonnet 5.5 medium - decyzja orkiestratora 2026-10-22)
Baza: `origin/rust-port/parity-v2` (`bbe3a6f3`, silnik 982 testy przed zmianami). Pin web: `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do `mktemp -d`/katalogu poza repo).
Zakres (dispatch): `cluster-spawn.ts`:54-69, :166-188, :210-445; `clusters.ts`:127-144, :3362-4250. Zaleznosci: M11, M07E2 (mapy - spelnione fixturami + `generateMap`, decyzja orkiestratora), P6.1D. Wzorzec: `P6-M11-KLASTRY-UKLAD-STOLIC.md`, `P6-M10-KLASTRY-MASY-BRAMKI.md`, `P6-M09-KLASTRY-RYWALE-MIN.md`.

## 0. Status (uczciwie)

- **Wszystkie** deklaracje zakresu maja status (tabela §3): **PORTOWANY** (kod + test + wektor z uruchomionego weba, 0 rozbieznosci) dla `computeClusters`, `buildClusterSpawnPlan`, typow `ClusterPlacement` / `ClusterSpawnPlan` / `BuildClusterSpawnInput`; **PORTOWANY-LOKALNIE** dla zaleznosci spoza zakresow M09-M12, ktorej nikt jeszcze nie dostarczyl: `buildSeaDistanceField` (`gen-helpers.ts:5614`, wektor + test); **DANE-JUZ-W-RUST** dla `HumanDistanceMode` (`cluster-spawn.ts:440-445`, P6.1C), `groupForeignTypeClusters` (M09), `capitalOf` (`cluster_capital_hex`, M11); **NIE-DOTYCZY** dla linii pustych/komentarzy i dla kodu bez efektu (`seaDistEarly` `clusters.ts:3420-3422`, `maxSeaDist` `:3466`, `console.warn`); **RUNDA-2** dla pelnego zasilenia `build_cluster_start_plan` (§10).
- Wektory z URUCHOMIONEGO weba: **654 wywolan `computeClusters`** + **372 wywolan `buildClusterSpawnPlan`** + 46 pol morza na **46 mapach** (7 z prawdziwego `generateMap`, w tym 2 duze o krotszym boku >= 80; reszta syntetyczna i brzegowa) (`tests/p6_m12_vectors/web-vectors.json`, 2,79 MB, SHA-256 `83c7b6ffffe48dc8f38bc110fba442abc801b6bbf4a042b4f9fb4c52bf2037fc`). **0 rozbieznosci Rust vs web** (wyniki to liczby calkowite i napisy - porownanie dokladne; sygnatura `spawnCache`: pula `ladowe`, masy ladu, pole morza). Dodatkowo 35 unikalnych wejsc spawnu z P6.1C (`p6_1c_vectors/cluster-start.json`, prawdziwy `buildClusterStartPlan` weba) odtworzonych przez port.
- **BLAD WEBA ZNALEZIONY I ODTWORZONY 1:1**: `computeClusters` konczy sie dziennikiem diagnostycznym (`clusters.ts:4225-4235`), ktorego napis czyta `regiony[ci]!.length`. Gdy klaster o indeksie `ci` ma mniej niz `rywaleNaKlaster + 1` miast, a `ci >= regiony.length` (klastry dopelnione po Voronoi - FALA 193 - maja indeksy poza regionami), `regiony[ci]` jest `undefined` i web **rzuca `TypeError`** ("Cannot read properties of undefined (reading 'length')"). W nagraniach: **21 z 654** wywolan `computeClusters` i 3 z 372 `buildClusterSpawnPlan` (m.in. prawdziwe mapy `k7`, `p123`, `k3small`) - sa to wejscia o malej liczbie miast w klastrach dopelnionych, glownie male mapy; na mapach >= 1100 hexow nie wystapilo. Port zwraca `Err(ClusterComputeError::DiagnosticRegionMissing { cluster_index, placement })` - **wynik, ktory web zdazyl zbudowac przed rzuceniem, jest dolaczony do bledu** i porownany z wektorami "bez dziennika" (kopia `clusters.ts` z JEDNYM tokenem logu zmienionym `regiony[ci]!.length` -> `regiony[ci]?.length`; neutralnosc zmiany sprawdzona na 117 niethrowing wywolaniach: wynik kopii == wynik oryginalu). **Decyzja o zachowaniu (naprawa weba czy parytet) nalezy do orkiestratora/wlasciciela** - port nie zmienia semantyki.
- Niezalezny weryfikator Python: **55109 sprawdzen (1115 M12 + zaleznosci M11/M10/M09), 0 rozbieznosci** (`verify-m12-vectors.py`, `EXIT=0`); test negatywny weryfikatora (3 zmutowane wartosci) => `rozbieznosci: 3`, `EXIT=1`.
- Testy: **28 nowych** (`p6_m12_compute` 12, `p6_m12_spawn` 8, `p6_m12_tables` 5, `p6_m12_integration` 3). `cargo test --no-fail-fast`: **1010 passed, 0 failed, `EXIT=0`** (982 baza + 28). fmt i clippy `--all-targets -D warnings`: `EXIT=0`. Zero zmian istniejacych testow.
- Testy negatywne (mutacje kodu/tabeli, `run-mutations.py`): **64 mutacji, 45 wykrytych**, 2 przezylo OCZEKIWANIE (uzasadnione w §7), 17 (patrz §7) przezylo nieoczekiwanie.
- Pokrycie galezi weba (V8, `coverage-report.mjs` na przebiegu generatora): `computeClusters` 699 z 776 linii z licznikiem (90,1%); 77 niepokrytych - §6; `buildClusterSpawnPlan` 182 z 204 linii (89,2%); 22 niepokryte - §6; niepokryte galezie: §6.

## 1. Metoda wektorow (ANTY-HALUCYNACJA)

- Generator `gen-m12-vectors.mjs` (w runie), uruchomienie (Node v22.22.0):
  `node --experimental-transform-types --no-warnings --import ./m12-loader-register.mjs ./gen-m12-vectors.mjs <WEB_ROOT> <OUT_JSON>` -> `OK {...}` (`gen-m12-r1.log`). Wynik deterministyczny (drugi przebieg: ten sam SHA-256, §7).
- **PRAWDZIWY kod weba, bez przepisywania logiki i bez kopii z `export`** (jak M10/M11 byly potrzebne tylko dla prywatnych deklaracji): `computeClusters` i `buildClusterSpawnPlan` sa eksportowane, wiec `clusters.ts`, `cluster-spawn.ts`, `gen-helpers.ts`, `generator.ts` laduja sie loaderem `m12-loader-hooks.mjs` (tylko dopisuje `.ts`/`/index.ts`, `.json` jako modul). Dane: PRAWDZIWE `gra/data/civs.json` i `gra/data/city-names-pools.json` z pinu (SHA-256 identyczne z plikami silnika: `72a5027e...` / `876ed2c9...`). Jedyny wyjatek od "zero zmian kodu weba": wariant "bez dziennika" (patrz §0), uzywany WYLACZNIE do odczytu wyniku przed rzuceniem i sprawdzany na 117 wywolaniach.
- Mapy (46): `generateMap` (`k42`, `k7`, `p123`, `k3small`, `w5` jak w P6.1C/M09-M11; **`r_s100` 100x80 i `r_d150` 150x100** - krotszy bok >= 80, wiec `capital*ForMap`/`cluster*ForMap` != 0, sciezka niebadana w M10/M11), syntetyczne (12 jak w M10/M11 + `s_mirror`; 5 srednich `m_*` 48x36..70x50; 7 duzych `b_*` 90x80..200x150; 13 brzegowych `e_*`: pusta, sam ocean, plytkie morze, gory, jeden hex ladu, wysepka 3 hexow, caly lad, pas ladu, dwie wyspy, duze warianty). Test `shared_maps_are_identical_to_m11_and_sea_field_matches_m11_web_field`: mapy o wspolnych id sa bajt w bajt te same co w M11, a pole morza zapisane z weba w M11 == `build_sea_distance_field`.
- Wywolania `computeClusters`: wejscie domyslne (bez opts) na kazdej mapie + losowe opts (ziarno 14 wartosci wlacznie z `0` i `2^32-1`, `rywaleNaKlaster` 0..12, `aktywneTypy` 1..20, `playerTyp` z rosteru + nieznany, `minDystans`, `minDystansKlastrow`, `startEpochId` kamien/braz/zelazo/nieznany z `civRoster` i bez, `preferredCivIds` z duplikatami i nieznanymi) + zakres liczby typow 2/5/8/10 na malych i srednich mapach.
- Wywolania `buildClusterSpawnPlan`: losowe `seed`, `playerTyp`, `rywaleNaKlaster` 0..9, `aktywneTypy`, `startEpochId`, `preferredCivIds`, z pulami nazw miast (`cityNamesPools`) i bez; pelny plan (sloty z nazwami, `foreignTypeClusters`, rezerwacje `ownerId`, `placement`).
- **Pokrycie weba mierzone, nie zgadywane**: przebieg generatora pod `NODE_V8_COVERAGE`, `coverage-report.mjs` (odtwarza tekst po transformacji typow i mape zrodel, raportuje linie ORYGINALU z licznikiem 0). `hunt-rare-branches.mjs`: 680 dodatkowych wywolan `buildClusterSpawnPlan` z precyzyjnym pokryciem V8 (inspector) sprawdzanym po kazdym wywolaniu - zero trafien w galezie niepokryte (§6), kontrola dzialania narzedzia: 100% trafien w linie kontrolna.
- **Niezalezny weryfikator** `verify-m12-vectors.py`: reimplementuje w Pythonie z KODU TS jako specyfikacji `buildSeaDistanceField`, `computeClusters` (cala funkcja), `buildClusterSpawnPlan` (cala funkcja) oraz wybor nazw (`civ-names.ts`, `city-names-pool.ts`), bez wykonywania TS, bez generatora, bez Rust; wyciaga regexem z TS (numery linii pinu) literaly (`?? 9`, `?? 42`, `Math.max(4, ...)`, `/ 15`, `Math.max(2, ...)`, `/ 3`, `Math.max(8, ...)`, `/ 2`, maski `0xca041a01/02`, `0x9e3779b1`, `MIN_DIST_FOREIGN_FROM_PLAYER = 12`) i porownuje je z `data/derived/mapgen-cluster-compute.json`. Zalezne funkcje M09-M11 (pakowanie, bramki, wybory, TimSort V8, naprawy) bierze z ICH niezaleznych weryfikatorow uruchamianych BEZ ZMIAN (`dep-verify-m11-vectors.py` -> `dep-verify-m10-vectors.py`, `dep-verify-m09-vectors.py`) - ich wlasne sprawdzenia licza sie do wyniku.

## 2. Tabela bylo / jest

| plik web | bylo (P6-25 §4) | jest (P6.M12 r1) |
|---|---|---|
| `clusters.ts:127-144` (`ClusterPlacement`) | BRAK | **PORTOWANE**: `domain/mapgen/cluster_compute.rs::ClusterPlacement` (+ `ClusterSpawnCache`, `TypeCluster`, `ClusterCity` z M10) |
| `clusters.ts:3362-4250` (`computeClusters`) | BRAK | **PORTOWANE**: `compute_clusters` + `ComputeClustersOpts` + `ClusterComputeError`; zaleznosc `build_sea_distance_field` (`gen-helpers.ts:5614`) |
| `cluster-spawn.ts:54-69` (`ClusterSpawnPlan`) | BRAK (`start_position::ClusterSpawnPlan` bez `placement`) | **PORTOWANE**: `cluster_compute::ClusterSpawnPlan` Z `placement` + `to_start_plan()` -> `start_position::ClusterSpawnPlan` |
| `cluster-spawn.ts:166-188` (`BuildClusterSpawnInput`) | BRAK | **PORTOWANE**: `BuildClusterSpawnInput` |
| `cluster-spawn.ts:210-445` (`buildClusterSpawnPlan`, `HumanDistanceMode`) | BRAK | **PORTOWANE**: `build_cluster_spawn_plan`; `HumanDistanceMode` DANE-JUZ-W-RUST (`start_position`) |
| `data/derived.rs` | sekcja M11 | dopisek NA KONCU pliku: `MapgenClusterComputeFile` + podstruktury + `parse_mapgen_cluster_compute` + `mapgen_cluster_compute()` (addytywny) |
| `data/derived/mapgen-cluster-compute.json` | BRAK | NOWY: domyslne i progi balansu `computeClusters` (z `zrodlo_web`) |
| testy | 982 | + 28 (`p6_m12_compute` 12, `p6_m12_spawn` 8, `p6_m12_tables` 5, `p6_m12_integration` 3); zero zmian istniejacych |

Lista zmian testow: **zadnego istniejacego testu nie zmieniono, nie usunieto, nie oslabiono.** Kod: `cluster_compute.rs` z 3 linii szkieletu do pliku z logika (naglowek `Temat wlasciciel:` zachowany - `p6_m00_skeleton` zielony). `cluster_layout.rs` (M11), `cluster_mass.rs` (M10), `cluster_rivals.rs` (M09), `start_position.rs` NIE zmienione.

## 3. Symbole - status per deklaracja

Test = plik w `rust-port/engine/tests/`; wektory = `p6_m12_vectors/web-vectors.json`.

| web | symbol | status | Rust | dowod |
|---|---|---|---|---|
| `cluster-spawn.ts:54-69` | `interface ClusterSpawnPlan` | PORTOWANY (typ) | `cluster_compute::ClusterSpawnPlan` (+ `to_start_plan`) | `build_cluster_spawn_plan_matches_web_*`, `rust_spawn_plan_reproduces_p6_1c_web_spawn_plans`, `to_start_plan_keeps_every_field_and_drops_only_placement` |
| `:70` | (linia pusta) | NIE-DOTYCZY | - | odczyt |
| `:166-187` | `interface BuildClusterSpawnInput` | PORTOWANY (typ) | `BuildClusterSpawnInput` (`civs: &CivsFile` = `CivsData`; `civRoster: civs.cywilizacje` budowany wewnatrz) | j.w. |
| `:188` | (linia pusta) | NIE-DOTYCZY | - | odczyt |
| `:210-215` | komentarz `buildClusterSpawnPlan` | NIE-DOTYCZY | - | odczyt |
| `:216-231` | wejscie + `computeClusters(...)` | PORTOWANY | `build_cluster_spawn_plan` (rozpakowanie wejscia, `compute_clusters`) | `..._matches_web_*` |
| `:232-246` | brak klastra gracza / puste miasta - plan awaryjny | PORTOWANY | wczesny `return` z `(0,0)`, nazwa gracza bez `usedNames`, `pendingSameTypeRivals = rywale`, puste listy | `spawn_plan_without_land_falls_back_to_origin_and_player_name`, wektory (mapy bez ladu, `e_*`) |
| `:248-270` | `capPosRaw`, `landCache`, `seaDist`, `minSeaDist`, `minCapitalSep` z `map.szerokoscQ/wysokoscR`, `plannedForeignCapitals` | PORTOWANY | j.w. (`map.width/height`, nie wymiary tiles; `cluster_capital_hex` = `capitalOf` `:189`) | wektory |
| `:271-326` | wybor hexu gracza `mulberry32(seed ^ 0xca041a01/02)` (`preferred`, retry) | PORTOWANY (galaz retry `:314-325` bez nagrania - §6) | `player_pick` + stale `PLAYER_CAP_SEED_XOR`, `PLAYER_CAP_RETRY_SEED_XOR` | wektory (galaz "preferred"), mutacje `player-cap-xor-*`, `plan-xor-no-preferred` |
| `:328-331` | `validateForeignCapital` (closure -> `passesLocalLandGate`) | PORTOWANY | `passes_local_land_gate(map, ...)` | wektory (odrzucone typy przez bramke lokalnego ladu) |
| `:332-338` | `slots`, `nextOwnerId`, `placedCapitals`, `pendingSameTypeRival*` | PORTOWANY | zmienne planu; `pending_same_type_rival_hexes` = `pendingStateSlots?.slice() ?? []` | wektory |
| `:340-372` | sloty obcych typow (stolica + rywale), bramka sep | PORTOWANY (galaz sep-skip `:346-357` bez nagrania - §6) | petla po `placement.klastry` | wektory |
| `:374-378` | rezerwacja `ownerId` rywali tego samego typu PO slotach | PORTOWANY | `pending_same_type_rival_owner_ids` | `assert_owner_invariants`, wektory |
| `:380-406` | HARD final gate apply (drop typu przy stolicach < `minCapitalSep`) | PORTOWANY (galaz drop `:390-398` bez nagrania - §6) | `hard_placed_capitals`, `dropped_foreign_typs` | wektory (galaz "przepuszcza"), mutacje `plan-dropped-typ-not-skipped`, `plan-hard-gate-le` |
| `:407-425` | nazwy: `foreignCapitalCityName` / `clusterRivalCityName` z `usedNamesByCiv`, `rivalIndexByCiv` | PORTOWANY | `foreign_capital_city_name` / `cluster_rival_city_name` (P6.1D) | wektory (z pulami i bez), mutacje `plan-rival-index-0`, `plan-capital-name-swap`, `plan-used-names-not-updated` |
| `:427-438` | zwrot planu (`groupForeignTypeClusters`, `playerStartCityName`) | PORTOWANY | `group_foreign_type_clusters` (M09, DANE-JUZ-W-RUST), `player_start_city_name` (P6.1D) | wektory |
| `:439` | (linia pusta) | NIE-DOTYCZY | - | odczyt |
| `:440-445` | komentarz + `type HumanDistanceMode` | DANE-JUZ-W-RUST | `start_position::HumanDistanceMode` (P6.1C) | `tests/p6_1c_start_cluster.rs` |
| `clusters.ts:127-144` | `interface ClusterPlacement` | PORTOWANY (typ) | `ClusterPlacement` (`requestedTypy?` zawsze ustawione => `i64`; `spawnCache?` => `Option`) | wektory (`placement_diff`) |
| `:3358-3361` | komentarz sekcji + linia pusta | NIE-DOTYCZY | - | odczyt |
| `:3362-3372` | komentarz `computeClusters` (opts) | NIE-DOTYCZY | `ComputeClustersOpts` (pola 1:1) | - |
| `:3373-3395` | sygnatura + opcje | PORTOWANY (typ) | `compute_clusters(map, &ComputeClustersOpts)` | wektory |
| `:3396-3401` | `seed ?? 42`, `playerTyp ?? ROSTER[0]`, `rywaleNaKlaster ?? 9`, `minDystans ?? MIN_DIST_START_CITY_STATE`, `mulberry32(seed)` | PORTOWANY | `DEFAULT_SEED` (stala algorytmiczna), tabela `domyslne.rywale_na_klaster`, `roster_klucze()[0]`, `min_dist_start_city_state()`, `Mulberry32` | wektory (wejscie domyslne na kazdej mapie), mutacje `default-seed-43`, `table-default-rivals-8` |
| `:3403-3434` | wymiary mapy, `mapSizeLabel`, `requestedTypy`, roster epoki, `nTypy`, `minDystKlastrow`, `minDystObcyOdGracza` | PORTOWANY | `compute_clusters` (pusta mapa: W=H=-Infinity => etykieta `super`, ForMap 0 - port: W=H=-1) | wektory (mapy `e_empty`, wszystkie rozmiary), mutacje `empty-map-label-mala`, `n-typy-no-cap`, `min-dyst-*`, `obcy-no-max`, `table-center-dist-*` |
| `:3420-3422` | `seaDistEarly = buildSeaDistanceField(...)` | NIE-DOTYCZY (wartosc nieuzywana, brak efektow) | - | `grep -n seaDistEarly clusters.ts` = 1 wystapienie (deklaracja) |
| `:3436-3456` | pula `ladowe`; brak lądu => pusta struktura (bez `spawnCache`) | PORTOWANY | `land_pool`, wczesny `return` | `no_land_returns_empty_structure_without_cache`, wektory |
| `:3458-3460` | `shuffledLad` (wynik nieuzywany, ZUZYWA strumien `rand`) | PORTOWANY | `cluster_rivals::shuffle_in_place` (M09; M11 `shuffle_in_place_with` NIE uzywany - patrz §9.3) | mutacja `shuffle-removed` |
| `:3462-3478` | `mapCenter`, `marginBrzeg`, `seaDist`, `minSeaDist`, `maxSeaDist`, `minCapitalSep`, `sCluster`, `bodyBufferRadius`, `landCache`, `landBBox`, `spreadGateOpts` | PORTOWANY (`maxSeaDist` `:3466` NIE-DOTYCZY: nieuzywane) | zmienne `compute_clusters` + `build_sea_distance_field` | wektory, `sea_distance_field_matches_web` |
| `:3480-3521` | srodki klastrow (`placeClusterCentersAcrossLandmasses` + dopelnienie FALA 188) | PORTOWANY | `place_cluster_centers_across_landmasses` (M10) + petla | wektory, mutacje `fill-centers-*` |
| `:3523-3529` | `rosterSource`, `playerKlucz`, Voronoi | PORTOWANY | `assign_voronoi_regions` (M10) | wektory, mutacja `player-in-epoch-true` |
| `:3531-3549` | `enforceLocalLandDominance` | PORTOWANY | `enforce_local_land_dominance` (M11) | wektory |
| `:3551-3573` | `rosterBezGracza`, `assignTypesToClusterCenters`, uzupelnienie `typ${n}` | PORTOWANY (`:3565-3567` i `:3625-3627` - martwy kod, §6) | `reorder_roster_by_preference` (M10), `assign_types_to_cluster_centers` (M11) | wektory (`preferredCivIds`), mutacja `foreign-slice-plus-one` |
| `:3575-3628` | dopelnienie srodkow po dropie dominance (FALA 193), ponowne przypisanie typow | PORTOWANY | petla + `reassign` | wektory, mutacje `topup-centers-*`, `reassign-never` |
| `:3630-3830` | klaster gracza: `buildClusterCitiesWithLandGate`, `pickPlayerClusterCenter`, `resolvePlayerCapitalPos`, bramki masy / morza / sep, pre-plan panstw, repack | PORTOWANY (galezie `:3669-3674`, `:3739-3781`, `:3787-3789` bez nagrania - §6) | `build_cluster_cities_with_land_gate`, `pick_player_cluster_center`, `resolve_player_capital_pos` (closure) | wektory, mutacje `player-*` |
| `:3832-3840` | `klastry.push` klastra gracza | PORTOWANY | `TypeCluster` (`pending_state_slots = Some(playerStateSlots)`, `growth_slot = Some(layout.growthSlot)`) | wektory, mutacja `player-pending-from-layout` |
| `:3842-3997` | klastry obce: land gate, retry/last cap, sea floor, sep, `packCityStatesAroundCapital`, `klastry.push` | PORTOWANY (`:3921-3928`, `:3938-3946`, `:3947-3959` bez nagrania - §6) | petla `ci` | wektory, mutacje `foreign-*` |
| `:3999-4078` | dopelnienie brakujacych typow (FALA 193) | PORTOWANY | blok top-up | wektory, mutacje `topup-*` |
| `:4080-4108` | repack MP gracza z buforami obcych (FALA 185) | PORTOWANY | blok repack | mutacje `repack-final-*` |
| `:4110-4146` | `enforceHardCapitalSeparationOnKlastry`, `enforceClusterBodySeparationOnKlastry` | PORTOWANY | M11 | mutacje `enforce-hard-removed`, `enforce-body-removed` |
| `:4148-4188` | dopelnienie po HARD sep | PORTOWANY | blok fill-up | mutacje `fillup-*` |
| `:4190-4222` | `enforceQuarterSpreadOnKlastry`, `repackAllSparseClusterStateCities` | PORTOWANY | M11 | mutacje `enforce-quarter-removed`, `repack-all-removed` |
| `:4224-4235` | dziennik diagnostyczny (`console.warn` z `regiony[ci]!.length`) | PORTOWANY - **ODTWORZONY BLAD WEBA** (§0) | `ClusterComputeError::DiagnosticRegionMissing` | `web_diagnostic_log_type_error_is_reproduced_on_every_thrown_vector`, wektory `noDiagResult`, mutacje `diag-*` |
| `:4237-4250` | `placedTypy`, zwrot `ClusterPlacement` (`spawnCache`) | PORTOWANY | koncowka `compute_clusters` | wektory |
| `gen-helpers.ts:5613-5637` | `buildSeaDistanceField` (zaleznosc) | PORTOWANY-LOKALNIE | `cluster_compute::build_sea_distance_field` | `sea_distance_field_matches_web` (46 map), `shared_maps_are_identical_to_m11_and_sea_field_matches_m11_web_field` (pole morza z weba w M11), mutacje `sea-field-*` |

Poza zakresem M12 (jawnie, bez portu): `pickSecondHumanStartHex` (`cluster-spawn.ts:477`) i `displayLabelForSlot` (`:511`) - P6.1C (`start_position`); `buildSameTypeRival*`, `groupForeignTypeClusters` (`:91-208`) - M09.

## 4. Zaleznosci: wszystko z M09-M11 uzywane BEZ kopii

`compute_clusters` wola w kolejnosci weba: M10 (`create_mass_land_cache`, `place_cluster_centers_across_landmasses`, `assign_voronoi_regions`, `pick_player_cluster_center`, `passes_player_start_mass_gate`, `passes_local_land_gate`, `roster_klucze*`, `reorder_roster_by_preference`, `map_size_label`, `aktywne_typy_from_size`), M11 (`pick_spawn_hex_with_capital_gates` z `HOOKS`, `enforce_local_land_dominance`, `assign_types_to_cluster_centers`, `build_cluster_cities_with_land_gate`, `enforce_hard_capital_separation_on_klastry`, `enforce_cluster_body_separation_on_klastry`, `enforce_quarter_spread_on_klastry`, `repack_all_sparse_cluster_state_cities`, `foreign_buffers_for_cluster`, `capital_*_for_map`, `cluster_*_for_map`, `sea_dist_rescue_ladder`), M09 (`pack_city_states_around_capital`, `pack_rival_cities_around_core`, `compute_same_type_rival_half_plane_axis`, `shuffle_in_place`, `land_hexes_from_game_map`, `map_center_from_game_map`, `group_foreign_type_clusters`). Zadna funkcja M09-M11 nie zostala zmieniona. Strumien `rand` (`mulberry32(seed)`) jest JEDEN i wedruje przez wszystkie wywolania (`&mut dyn FnMut() -> f64`); jedyny konsument przed domknieciem to tasowanie `shuffledLad`.

## 5. Dane vs kod - brak literalow danych/mnoznikow

- Balans w `data/derived/mapgen-cluster-compute.json` (edytowalny; kazda wartosc z `zrodlo_web` plik:linia, zakres 3362-4250): domyslna liczba miast-panstw (9, `:3398`), miekki zapas odleglosci srodkow klastrow (4 i dzielnik 15, `:3433`), margines od krawedzi (2 i dzielnik 3, `:3463`), promien regionu klastra dopelnionego (8 i dzielnik 2, `:4054`, `:4069`). Parser: `data/derived.rs` (dopisek na koncu, `deny_unknown_fields`).
- Stale z zakresow M09-M11 (`MIN_DIST_FOREIGN_FROM_PLAYER`, `CLUSTER_CITY_STATE_MAX_HEX`, `MIN_DIST_START_CITY_STATE`, `MIN_DIST_FOREIGN_IN_CLUSTER`, `CLUSTER_GROWTH_RESERVE`, tabele ukladu stolic, tabela rosteru) czyta kod z ich funkcji/tabel - bez kopii liczb.
- Stale ALGORYTMICZNE (tozsamosc generatora, nie balans) to nazwane `const` w `cluster_compute.rs` z odnosnikami do linii weba: `DEFAULT_SEED = 42` (`clusters.ts:3396`), `KI_SEED_MUL = 0x9e3779b1` (`:3972`), `PLAYER_CAP_SEED_XOR = 0xca041a01` (`cluster-spawn.ts:283`), `PLAYER_CAP_RETRY_SEED_XOR = 0xca041a02` (`cluster-spawn.ts:304`). Poza tym w kodzie tylko literaly strukturalne: `0`, `1`, `2` (polowa `/ 2.0` w srodku mapy; `n_typy - 1`; `state_city_count + 1`; indeks `[0]`; `W=H=-1` dla pustej mapy), kolejnosc argumentow.
- Testy ksztaltu tabeli (`p6_m12_tables.rs`) NIE pinuja wartosci: parsowanie z `deny_unknown_fields`, kazda wartosc ma `zrodlo_web` z plikiem i numerem linii w zakresie 3362-4250 oraz opis uzycia, dzielniki > 0, a zachowanie kodu WYNIKA z pol tabeli (domyslna liczba miast, zapas odleglosci srodkow). **Uwaga:** testy wektorowe (`p6_m12_*`) to testy PARYTETU z webem, wiec zmiana liczby balansu celowo je lamie - zmiana balansu wymaga swiadomego przegenerowania wektorow.

## 6. Zalozenia, zachowania weba odtworzone 1:1 i galezie bez nagrania

1. **Regiony klastrow sa wspoldzielonymi tablicami.** `playerRegion = regiony[0]` jest ta sama tablica co `clusterRegions[0]`; `pickCapitalHexInRegion` sortuje `seaPool` W MIEJSCU (M11 §6.1), wiec kolejnosc regionu zmienia sie dla pozniejszych wywolan. Port przenosi region (`std::mem::take`) z `regiony` do `cluster_regions`, nigdy go nie kopiuje; `regiony.len()` pozostaje rowne liczbie srodkow Voronoi (do dziennika diagnostycznego).
2. **Dziennik diagnostyczny rzuca** (§0). Warunek: `miasta.length < rywaleNaKlaster + 1 && ci >= regiony.length`, sprawdzany po `repackAllSparseClusterStateCities`; `ci` = indeks w `klastry`.
3. **Pusta mapa** (`Object.values({})`): `minQ=Infinity` => `W = H = -Infinity` => `area = Infinity` => etykieta `super`; `Math.min(W, H) < 80` => wszystkie `*ForMap` = 0; `Math.max(4, floor(-Infinity/15))` = 4; wczesny zwrot "brak lądu". Port: `W = H = -1` (te same wartosci); wektor `e_empty` potwierdza.
4. **`spawnCache` tylko przy niepustym ladzie** (`ladowe.length === 0` => zwrot bez cache); `buildClusterSpawnPlan` w tym przypadku wchodzi w plan awaryjny (`klastry` puste).
5. **`minCapitalSep`/`minSeaDist` w planie spawnu** liczone z `map.szerokoscQ/wysokoscR` (nie z wymiarow `hexes`); w Rust `GeneratedMap::width/height`.
6. **`capitalOf`** (`cluster-spawn.ts:189`) = `cluster_capital_hex` (M11): stolica albo pierwsze miasto.
7. **Liczby**: wspolrzedne `i32`; `seed` `u32` (`seed ^ 0xca041a01` na `u32` == `int32` XOR + `>>> 0` w `mulberry32`; `(seed + ci * 0x9e3779b1) >>> 0` == `wrapping_add/mul`); `rywaleNaKlaster`, `minDystans`, `minDystansKlastrow`, `aktywneTypy` `i64` (calkowite); `minSeaDist`, `minCapitalSep` `f64` (jak M10/M11). Ujemne/nieskonczone ziarno i niecalkowite odstepy: NIE_ZMIERZONO.
8. **`console.warn`** (poza dziennikiem z pkt 2) nie ma efektu na wynik - nie portowane.
9. **Galezie bez nagrania** (pokrycie V8 = 0 w calym przebiegu generatora i w 680 dodatkowych wywolaniach `hunt-rare-branches.mjs`); wszystkie PORTOWANE 1:1 w kodzie, ale BEZ wektora tej galezi:

| web | galaz | rodzaj | uzasadnienie |
|---|---|---|---|
| `clusters.ts:3565-3567`, `:3625-3627` | uzupelnienie `activeKlucze.push('typ${n}')` | martwy kod | `assignTypesToClusterCenters` zwraca tablice dlugosci `max(centrumy.length, 1)` (`new Array(centrumy.length)`), wiec `activeKlucze.length < activeCentrumy.length` nigdy nie zachodzi |
| `:3669-3674` | `forced = pickPlayerClusterCenter(...)` gdy `buildClusterCitiesWithLandGate` zwroci `null` | NIE_ZMIERZONO (nieosiagnieta) | wymaga, by wybor stolicy w regionie gracza zawiodl, a globalny `pickPlayerClusterCenter` - nie; srodek gracza w fazie 0 pochodzi z tej samej funkcji z tymi samymi bramkami |
| `:3739-3781` | blok `fixed` (relokacja stolicy gracza po bramce morza) | NIE_ZMIERZONO (nieosiagnieta) | bramka morza `!passesMinSeaDistGate` jest prawdziwa tylko gdy gracz ma stolice z miękkiego stopnia drabinki, a wtedy `pickSpawnHexWithCapitalGates` (te same twarde bramki) tez zwraca `null` |
| `:3787-3789` | `resolvePlayerCapitalPos()` po sprawdzeniu sep stolic | martwy kod | `placedCapitals` jest w tym miejscu PUSTE (gracz jest pierwszy), wiec `passesMinCapitalSeparationGate` jest zawsze prawdziwe |
| `:3921-3928` | pominiecie typu gdy brak hexu startowego | NIE_ZMIERZONO (nieosiagnieta) | wymaga, by dwa kolejne `pickSpawnHexWithCapitalGates` (preferred = srodek) zwrocily `null`; 680 prob na mapach z waskim ladem i 15 typami - 0 trafien |
| `:3938-3946` | pominiecie typu: stolica za blisko morza | martwy kod | `softSeaFloor` = ostatni element `seaDistRescueLadder` = `0` (ostatni stopien drabinki), wiec `softSeaFloor > 0` nigdy |
| `:3947-3959` | pominiecie typu: stolica za blisko innej | martwy kod | separacja jest gwarantowana przez `buildClusterCitiesWithLandGate` (sprawdza `sepOk`) i `pickSpawnHexWithCapitalGates` (twarda `minCapitalSep`) |
| `cluster-spawn.ts:314-325` | retry wyboru stolicy gracza / HARD-warn | NIE_ZMIERZONO (nieosiagnieta) | `preferred` (stolica z `computeClusters`) zawsze przechodzi te same bramki; `null` zwracane tylko przy braku jakiegokolwiek kandydata, wtedy retry tez zwraca `null` |
| `:346-357`, `:386-398` | odrzucenie typu przez sep stolic w planie spawnu (dwa miejsca) | NIE_ZMIERZONO (nieosiagnieta) | separacja jest juz wymuszona w `computeClusters`; wymagalaby wejscia, w ktorym `capital*ForMap` z `szerokoscQ/wysokoscR` rozni sie od wartosci liczonej z wymiarow `hexes` (w Rust `width/height` indeksuja kafle, wiec takiej mapy nie da sie zbudowac) |

   Mutacje w galeziach NIEPOKRYTYCH (np. `player-cap-xor-retry`, `plan-dropped-typ-not-skipped`) PRZEZYWAJA - opisane w §7 (uwaga: `player-sea-gate-negated`, `foreign-cap-skip-sep`, `plan-hard-gate-le` zostaly WYKRYTE, bo ich skutki widac na duzych mapach/P6.1C mimo braku bezposredniego pokrycia linii); ryzyko dla rozgrywki: brak, bo galezie sa nieosiagalne dla wejsc generowanych przez gre (sprawdzono 680 +  wywolan).

## 7. Testy negatywne (mutacje) i ich wyniki

Skrypt `run-mutations.py`: 64 mutacji (kod `cluster_compute.rs` i tabela `mapgen-cluster-compute.json`), trzy etapy (S1 compute grupy <= 500 hexow; S2 spawn + tabele + integracja + P6.1C; S3 wszystkie testy compute i spawn z duzymi mapami; mutacja jest wykryta przy pierwszym czerwonym etapie), plik przywracany po kazdej mutacji i weryfikowany bajt w bajt na koncu. Wynik: `mutations-r1.log`.

Wynik (`mutations-r1.log` + `mutations-r1c.log`, 64 mutacje): **45 WYKRYTYCH**, 2 przezyly OCZEKIWANIE, **17 przezylo NIEOCZEKIWANIE**.

- Wykryte: m.in. stale i ziarna (`default-seed-43`), bramki masy/morza gracza (`player-mass-gate-negated`, `player-sea-gate-negated`), sloty i drabinki obcych (`foreign-*`), repack i bramki twarde (`repack-all-removed`, `enforce-body-removed`), dziennik (`diag-le`), plan spawnu (`plan-fallback-hex`, `plan-xor-no-preferred`, `plan-hard-gate-le`, `to-start-plan-*`) i tabela (`table-default-rivals-8`, `table-center-dist-*`, `table-margin-*`). Etap pierwszego czerwonego testu jest w logu.
- Przezyly OCZEKIWANIE (uzasadnione): `ki-seed-mul` (mnoznik ziarna per klaster zasila lancuch hubow, ktory tasuje kandydatow i sortuje po (q, r) - porzadek calkowity, wynik nie zalezy od ziarna; jak `seed-mul-ki` w M11) oraz `diag-missing-always-ok` (mutant rownowazny: dodane ramie `_ if false` jest nieosiagalne).
- **Przezyly NIEOCZEKIWANIE (17) - jawna luka wektorow, do oceny Evaluatora.** Nie sa to bledy portu (0 rozbieznosci z webem na 654 + 372 nagraniach, 0 rozbieznosci niezaleznego weryfikatora), lecz zmiany, ktorych nagrany korpus nie odroznia od oryginalu. Przyczyny rozdzielone uczciwie:
  - (a) galaz NIEPOKRYTA w webie (§6): `player-cap-xor-1` (`cluster-spawn.ts:283` - ziarno wyboru ma znaczenie tylko gdy `preferred` jest niewazny; pierwsza proba zwraca `preferred`), `player-cap-xor-retry` (`cluster-spawn.ts:314-325`, retry nieosiagniete), `plan-dropped-typ-not-skipped` (`cluster-spawn.ts:386-398`, odrzucenie slotu nieosiagniete).
  - (b) linia POKRYTA, ale zmiana nie zmienia wyniku na zadnym z 654 + 372 nagran; przyczyna **nie zbadana osobno dla kazdej** (NIE_ZMIERZONO): `min-dyst-order-sep`, `fill-centers-player-gate`, `topup-centers-local-land`, `player-growth-reserve-0-initial`, `player-pending-from-layout`, `foreign-growth-no-or`, `topup-dedupe-removed`, `topup-player-dist-le`, `topup-region-lt`, `repack-final-and`, `enforce-hard-removed`, `plan-capital-name-swap`, `table-topup-min-9`, `table-topup-div-3`. Wspolna hipoteza (niesprawdzona): sciezka dopelniania centrow (`topUp`) i twarde wymuszanie separacji dzialaja na nagranych mapach rzadko lub bez efektu koncowego; do ustalenia przez dodatkowe wektory (np. `hunt-rare-branches.mjs` z szerszym zestawem map).
  - Skutek: wartosci tabeli `mapgen-cluster-compute.json` `default-rivals`, `center-dist-*`, `margin-*` sa pinowane przez wektory (mutacje wykryte); wpisy top-up (`table-topup-min-9`, `table-topup-div-3`) NIE - chroni je tylko `p6_m12_tables` (ksztalt, bez wartosci) i przeglad zrodla `clusters.ts:4054`.
- Poprawka w trakcie rundy: `shuffle-removed` mial bledna definicje (zly fragment) - naprawiona i przebieg powtorzony (`mutations-r1c.log`: WYKRYTA); `player-cap-xor-*`, `diag-missing-always-ok` dopisane do `EXPECTED_SURVIVORS` po triazu (log `mutations-r1.log` ma jeszcze stare znaczniki `PRZEZYLA`).

## 8. Bramki (surowe logi w runie, kazdy z `EXIT=`)

Srodowisko: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_40eda632-8b0-1 CARGO_PROFILE_DEV_DEBUG=0`, cargo w `rust-port/engine`; podkatalog usuniety po zakonczeniu; `Cargo.lock` nie commitowany.

| bramka | log | wynik |
|---|---|---|
| `cargo fmt -- --check` | `gate-fmt-r1.log` | `EXIT=0` |
| `cargo clippy --all-targets -- -D warnings` | `gate-clippy-r1.log` | `EXIT=0` |
| `cargo test --no-fail-fast` | `gate-test-r1.log` | `EXIT=0`, 1010 passed, 0 failed |
| generator wektorow | `gen-m12-r1.log` | `EXIT=0` (46 map, 654 compute, 372 spawn, 117 no-diag) |
| weryfikator Python | `verify-m12-r1.log` | `EXIT=0`, 55109 sprawdzen, 0 rozbieznosci |
| weryfikator - test negatywny | `verify-m12-negative-r1.log` | `EXIT=1` (oczekiwane), 3 rozbieznosci |
| pokrycie V8 | `coverage-m12-r1.log` | `EXIT=0` (699/776 i 182/204 linii) |
| polowanie na rzadkie galezie | `hunt-m12-r1.log`, `hunt-m12-r2.log` | 0 trafien w galezie niepokryte (680 wywolan) |
| mutacje kodu/tabeli | `mutations-r1.log` | `EXIT=0`: 45 wykrytych, 2 oczekiwane, 17 nieoczekiwanych (§7); `mutations-r1c.log` (powtorka `shuffle-removed`, `diag-missing-always-ok`) |

Skrypty: `gen-m12-vectors.mjs` (+ `m12-loader-register.mjs`, `m12-loader-hooks.mjs`), `verify-m12-vectors.py` (+ zaleznosci `dep-verify-m11-vectors.py`, `dep-verify-m10-vectors.py`, `dep-verify-m09-vectors.py` - kopie bez zmian), `mutate-vectors.py`, `run-mutations.py`, `coverage-report.mjs`, `hunt-rare-branches.mjs`.

## 9. Zmiany (allowlista) i ryzyka

### 9.1 Zmiany
- `rust-port/engine/src/domain/mapgen/cluster_compute.rs` (wypelniony; naglowek `Temat wlasciciel:` zachowany),
- `rust-port/engine/tests/p6_m12_compute.rs`, `p6_m12_spawn.rs`, `p6_m12_tables.rs`, `p6_m12_integration.rs`, `rust-port/engine/tests/p6_m12_vectors/web-vectors.json`, `rust-port/engine/tests/p6_m12_vectors/common.rs`,
- `rust-port/engine/data/derived/mapgen-cluster-compute.json` (NOWY, `data/derived/*.json` z dispatchu), `rust-port/engine/src/data/derived.rs` (dopisek NA KONCU pliku),
- `dyspozycje/rust-port/p6/P6-M12-KLASTRY-COMPUTE-SPAWN-PLAN.md` (ten dokument), `dyspozycje/autobot/runs/R-RUSTPORT-P6-M12-KLASTRY-COMPUTE-SPAWN-PLAN-Q1/**` (generator, loader, weryfikatory, skrypty, logi, raport).
- Zero zmian w `domain/mod.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `tests/p6_m00_skeleton.rs`, `start_position.rs`, `cluster_layout.rs`, `cluster_mass.rs`, `cluster_rivals.rs`, ani w istniejacych testach.

### 9.2 Ryzyka / do Evaluatora i orkiestratora
1. **Konflikty addytywne**: `data/derived.rs` (dopisek na koncu) - przy rownoleglych M03/M04/P6.6A/P4.33/P5.6 mozliwy konflikt w ostatnich liniach; rozwiazanie: zachowac obie sekcje.
2. **Odczyt zrodel (liczby linii):** `clusters.ts` **4250 linii** (`wc -l` na wyciagu pinu `edb8fb56`; generator liczy 4251 przez ostatni pusty element `split`), **przeczytany w calosci** narzedziem `Read` w porcjach 1-260, 260-960, 960-1760, 1760-2560, 2560-3360, 3340-3900, 3899-4251; `cluster-spawn.ts` **516 linii** (`wc -l`; 517 wg `split`), przeczytany w calosci jednym `Read` 1-517; `gen-helpers.ts:5595-5660` (`buildSeaDistanceField`), `civ-names.ts` (195 linii) i `city-names-pool.ts:1-295` przeczytane w calosci.
3. **Duplikat `shuffleInPlace`**: M09 `cluster_rivals::shuffle_in_place(&mut Mulberry32)` i M11 `cluster_layout::shuffle_in_place_with(RandRef)` sa dwiema kopiami tej samej funkcji. W plikach M12 uzyto WYLACZNIE wariantu M09 (tasowanie `shuffledLad` jest pierwszym konsumentem strumienia, wiec domkniecie `rand` powstaje po nim) - **nie dodano trzeciej kopii i nie uzyto wariantu M11**. Usuniecie duplikatu w `cluster_layout.rs` (M11 uzywa go w `assign_types_to_cluster_centers` i `poisson_pick_cities` na wstrzyknietym `rand`, ktorego typ nie jest `Mulberry32`) wymaga zmiany plikow poza allowlista M12 - do ujednolicenia przy integracji (np. `impl FnMut() -> f64` w M09).
4. **Weryfikator Python bierze funkcje M09-M11 z ich weryfikatorow** (napisanych z tego samego opisu algorytmu co port - niezaleznosc dotyczy kodu, nie zrodla wiedzy); arbitrem sa wektory z Node.
5. NIE_ZMIERZONO: mapy wieksze niz 200x150 i inne typy swiata niz 5 z `generateMap`; wersje V8 inne niz Node v22.22.0; ujemne/nieskonczone ziarno; niecalkowite `minDystansKlastrow`/`minDystans`; liczba typow > 15; galezie z §6 pkt 9; `console.warn` poza dziennikiem.
6. **Rozbieznosc procesowa do rozstrzygniecia przez orkiestratora**: blad weba z §0 oznacza, ze `buildClusterSpawnPlan` weba rzuca dla czesci wejsc (male mapy, duzo miast w klastrach) - port jest wierny (zwraca `Err`); jesli parytet ma obejmowac NAPRAWIONE zachowanie, trzeba zmienic web (`regiony[ci]?.length`) i przegenerowac wektory (`gen-m12-vectors.mjs` ma juz wariant "bez dziennika").

## 10. Nastepny krok (RUNDA-2 z P6.1C §10 pkt 1): pelne zasilenie `build_cluster_start_plan` wynikiem Rust

`start_position::build_cluster_start_plan(input, spawn_plan, land_hexes, name_picker)` czyta wynik `buildClusterSpawnPlan` bez pola `placement`. Teraz mozna go zasilic wynikiem Rust, bez zmiany `start_position.rs`:

```rust
let plan = cluster_compute::build_cluster_spawn_plan(&BuildClusterSpawnInput { map: &map, civs: &civs, seed, player_typ, rywale_na_klaster, aktywne_typy, start_epoch_id, city_names_pools, preferred_civ_ids })?;
let start = start_position::build_cluster_start_plan(&input, &plan.to_start_plan(), &land_hexes_from_game_map(&map), name_picker)?;
```

Dowod gotowosci: test `rust_spawn_plan_reproduces_p6_1c_web_spawn_plans` pokazuje, ze `plan.to_start_plan()` jest rowny `spawnPlan` zapisanemu w wektorach P6.1C przez prawdziwy `buildClusterStartPlan` weba dla 35 unikalnych wejsc (5 map, 2 cywilizacje gracza, 0/3/6 rywali, z pulami nazw i bez). Pozostaje (poza M12): (a) w `bridge`/silniku wywolac te sciezke zamiast wektorow P6.1C, (b) zdecydowac o bledzie weba z §0 (parytet czy naprawa), (c) dla `new_game` wyznaczyc `CityNamePicker` (P6.1B), (d) ujednolicic duplikat `shuffle_in_place` (§9.2 pkt 3).
