# P6.4 - Jednostki: ruch (embarkacja, zaplanowany marsz, punkt zbiorki, auto-zwiad) (R-RUSTPORT-P6-4-JEDNOSTKI-RUCH-Q1)

**Status:** runda 2/5, rola Operator (obrona; poprawki dokumentu wg zarzutow Evaluatora r1, kod i wektory bez zmian). **DOMAIN:** GAME. **Pin web:** `edb8fb56`. **Baza Rust:** `origin/rust-port/parity-v2` @ `e239fd81` (baseline 511 testow, po zmianie 543).
**Artefakty biegu:** `dyspozycje/autobot/runs/R-RUSTPORT-P6-4-JEDNOSTKI-RUCH-Q1/` (generator wektorow `gen-p64-vectors.mjs` + loader `p64-loader-*.mjs`, niezalezny weryfikator `verify-p64-vectors.py`, skrypt mutacji `mutate-p64.py`, logi bramek `gate-*-r1.log`, `dowody/`).

## 0. ZALOZENIA (luki rozstrzygniete bez pytan do wlasciciela)

1. **Dlugosc plikow na pinie.** Dispatch podaje ok. 877 LOC; faktyczne, PELNE odczytane pliki na pinie `edb8fb56`: `embarkation.ts` **133**, `planned-march.ts` **479**, `rally-point.ts` **85**, `scout-auto-explore.ts` **280** = **977** linii (`wc -l` na `git archive edb8fb56 gra/src`). Wszystkie przeczytane w calosci (Read bez limitu).
2. **Model liczbowy weba, nie stalo-przecinkowy P3.** Istniejacy `find_path`/`reachable` w `pathfinding.rs` (P3) uzywa kosztow stalo-przecinkowych (`COST_SCALE = 15`) i rozstrzyga remisy leksykograficznie po sciezce. Web (`setup.ts` `computePath`/`computeReachable`) liczy na `number` (f64) i rozstrzyga remisy KOLEJNOSCIA KOPCA BINARNEGO, a `Set` JS zachowuje kolejnosc wstawiania - te dwie rzeczy decyduja o wyniku `pickBestExploreStep` (losowanie z puli kandydatow). Port 1:1 wymaga wiec osobnej, wiernej implementacji: `pub mod ruch_jednostek` WEWNATRZ `domain/pathfinding.rs` (allowlista nie dopuszcza nowego pliku w `domain/`; zgodnie z dispatchem uzyto `pub mod` w istniejacym module). Stary pathfinder P3 zostaje bez zmian. **RYZYKO/DECYZJA DLA ORKIESTRATORA:** przy wpinaniu ruchu do petli gry (P7) trzeba wybrac jeden pathfinder; dla parytetu z webem (kolejnosc remisow) wlasciwy jest `ruch_jednostek`.
3. **Zaleznosci spoza czterech plikow, ktore trzeba bylo przeniesc, zeby port byl wykonywalny** (status ZALEZNOSC-PORTOWANA, z wektorami z uruchomionego weba; ich wlasciciel w pozniejszych tematach moze je przejac bez zmiany zachowania): z `units/setup.ts` - `keyOf`, `hexDistance`, `terrainMoveCost` (+ `configureTerrainMovement` jako tabela startowa), `isWaterTerrain`, `EMBARKED_WATER_MOVE_COST`, `embarkMoveCost`, `computeReachable`, `computePath`, `pathCost`; z `map/road-movement.ts` - `applyRoadMovementModifier`; z `game/visibility.ts` - `computeVisibleAt`, `addExplored`; z `game/armyMerge.ts` - `stackGroupIdOf`. `civMovementMultiplier` (`civ-bonuses.ts`) jest JUZ w Rust (`civ_bonuses::civ_movement_multiplier`, P6.1D, wektory `p6_1d`) - reuzyty (DANE-JUZ-W-RUST).
4. **Koszty terenu i stale.** Koszty terenu czytane z `data/terrain-movement.json` (te same, ktorymi gra konfiguruje ruch: `main.ts:1675`), dzielniki drog z `road-movement-multipliers.json` (P3-23). Reszta stalych/tekstow w nowej tabeli `data/derived/ruch-jednostek-params.json` (`EMBARK_TECH`, `EMBARK_DEFENSE_MULT`, koszt wody, koszt rzeki, prog nieprzejezdnosci, kolejnosc sasiadow, promien wyszukiwania, teksty powodow zatrzymania, parametry zwiadu, separator stosu). Kod nie zawiera tych literalow (zob. `dowody/grep-literals-r1.txt`).

   **Co NIE jest w tabeli JSON (jawnie):** (i) identyfikatory powodow zatrzymania marszu w `MarchStopReason::web_value()` (`"obstacle"`, `"no_path"`, `"no_movement"`, `"blocked_city"`, `"fog"`) oraz (ii) klucze terenu w `TerenBazowy::web_value()` (`"laka"`, `"rownina"`, `"wzgorza"`, `"gory"`, `"plytkie_morze"`, `"morze"`, `"pustynia"`, `"polarny"`) sa literalami w kodzie Rust. Sa to klucze STRUKTURALNE (dyskryminatory unii/enum `MarchStopReason` z `planned-march.ts:31` i wartosci enum `Terrain` z `types/hex.ts`), a nie dane balansowe ani teksty dla gracza: zmiana ktorejkolwiek zmienia kontrakt typu, nie balans. Ten sam wzorzec ma istniejacy kod silnika (`domain/terrain.rs:10,18`: `#[serde(rename = "laka")]`, `"plytkie_morze"`). W tabeli JSON sa wylacznie TEKSTY DETALI dla gracza (`marsz.teksty`: `brak_ruchu`, `brak_trasy`, `zablokowany_heks`, `obce_miasto`, `mgla`) oraz stale liczbowe. Sformulowanie "wszystkie teksty/stale w tabeli" w sekcjach 0.4 i 4 nalezy czytac z tym zastrzezeniem.
5. **Domyslny `rng = Math.random`** (`advanceScoutAutoExplore`, `runScoutsAutoExplore`) jest nieodtwarzalny - w Rust parametr `rng` jest WYMAGANY (wywolujacy poda generator deterministyczny, np. Mulberry32). Wektory uzywaja zapisanej sekwencji i porownuja LICZBE wywolan `rng()`.
6. **Model danych wejsciowych.** `RuchHex`/`RuchMapa`/`RuchJednostka` to podzbior web `Hex`/`GameMap`/`RuntimeUnit` czytany przez te 4 pliki. `hex.coords` = klucz `"q,r"` (niezmiennik mapy weba); `wlasciciel !== null` = flaga `ma_wlasciciela`; pole `Record<string, X>` z zapisu (`plannedMarches`, `rallyPoints`) odwzorowane jako wektor par w KOLEJNOSCI `Object.entries` (klucze calkowite rosnaco, potem wstawienie) - wektory dostarczaja te kolejnosc z uruchomionego weba.
7. **Wiring:** zero zmian w `bridge.rs`/`playable.rs` (P7); `recruitment.rs` bez zmian (zob. sekcja 1, `NIE-DOTYCZY`).
8. **serde_json bez `float_roundtrip`** czyta niecalkowite f64 z bledem 1 ulp (wykryte w tym biegu: suma `pathCost` 3.8666666666666667 czytana jako ...63). Wektory zapisuja KAZDA niecalkowita liczbe jako `{"$f": "<String(x)>"}` i testy czytaja ja przez `str::parse::<f64>()` (poprawne zaokraglenie). `Cargo.toml` nie jest zmieniany (poza allowlista).

## 1. Zakres i wynik binarny

Statusy: **PORT** = port 1:1 + test + wektor z uruchomionego weba, 0 rozbieznosci; **DANE** = DANE-JUZ-W-RUST; **N/D** = NIE-DOTYCZY; **R2** = RUNDA-2.

### 1.1 `embarkation.ts` (133 linie, 10 eksportowanych nazw: 7 definicji + 3 re-eksporty z linii 133)

| Symbol (web) | Status | Rust | Test / dowod |
|---|---|---|---|
| `EMBARK_TECH` | PORT (tabela) | `embark_tech()` <- `ruch-jednostek-params.json` `embarkacja.technologia` | `p6_4_core::constants_read_from_running_web_match_tables` (wartosc z uruchomionego weba) |
| `EMBARK_DEFENSE_MULT` | PORT (tabela) | `embark_defense_mult()` | j.w. (uzycie w walce = P6.13: `effectiveDefenderM` w `main.ts`, poza tymi 4 plikami) |
| `canUnitEmbark` | PORT | `can_unit_embark` | `p6_4_embark::can_unit_embark_matches_web` (36 wektorow) |
| `moveCostFnFor` | PORT | `move_cost_fn_for` (closure `BoxedCostFn`) | `p6_4_embark::move_cost_fn_for_matches_web_on_every_map_hex` (130 wektorow x wszystkie heksy mapy; mnoznik plytkiego morza) |
| `isWaterHexAt` | PORT | `is_water_hex_at` | `p6_4_embark::water_hex_queries_match_web` (200) |
| `applyEmbarkStateAfterMove` | PORT | `apply_embark_state_after_move` | `p6_4_embark::apply_embark_state_after_move_matches_web` (60) |
| `nearestFreeWaterHex` | PORT | `nearest_free_water_hex` | `p6_4_embark::water_hex_queries_match_web` (300) |
| re-eksport `isWaterTerrain` (linia 133) | PORT (alias) | `is_water_terrain` (`pub`) | `p6_4_embark::water_hex_queries_match_web` (`isWaterHexAt` 200 + `nearestFreeWaterHex` 300; oba wolaja `is_water_terrain`) oraz `p6_4_core::terrain_and_embark_costs_match_web_on_maps` (`embark_move_cost`, `terrain_move_cost` wolaja `is_water_terrain`, linie 1002/1029 `pathfinding.rs`); brak osobnego testu jednostkowego samej funkcji - pokrycie posrednie wektorami z weba |
| re-eksport `embarkMoveCost` (linia 133) | PORT (alias) | `embark_move_cost` (`pub`) | `p6_4_core::terrain_and_embark_costs_match_web_on_maps` (`embarkMoveCost`: 10 map) |
| re-eksport `terrainMoveCost` (linia 133) | PORT (alias) | `terrain_move_cost` (`pub`) | `p6_4_core::terrain_and_embark_costs_match_web_on_maps` (`terrainMoveCost`: 10 map) i `terrain_cost_combinations_match_web` (`terrainCombos`: 384) |

### 1.2 `planned-march.ts` (479 linii, 18 eksportow + 2 prywatne funkcje)

| Symbol (web) | Status | Rust | Test / dowod |
|---|---|---|---|
| `MarchCostFn` (typ) | PORT | `CostFn` | uzywany we wszystkich testach marszu |
| `PlannedMarchDest`, `AutoMarchSave`, `PlannedMarchesSave` (typy) | PORT | `PlannedMarchDest`, `AutoMarchSave`, `PlannedMarchSaved`, `Vec<(String, ...)>` | `p6_4_march::save_validation_and_round_trip_match_web` |
| `MarchStopReason` | PORT | `MarchStopReason` (`web_value()`) | testy marszu |
| `MarchFogContext` | PORT | `MarchFogContext` (pole `keyOf` pominiete: klucze calkowite - N/D) | `p6_4_march::fog_frontier_and_fog_plan_match_web` |
| `truncatePathAtFogFrontier` | PORT | `truncate_path_at_fog_frontier` | j.w. (60) |
| `applyFogToPathPlan` | PORT | `apply_fog_to_path_plan` (od C-RUCH-Q1=B zwraca plan bez zmian) | j.w. (116) |
| `isMarchAttackDest` (prywatna, linia 150) | PORT (prywatna) | `is_march_attack_dest` | przez `should_stop_at_obstacle_*` i `execute_march_step_*` (wektory 587/580) |
| `_applyFogToPathPlanBlind` (nieeksportowana, martwa) | N/D | brak (nigdy nie wolana; komentarz weba `[DEPRECATED wariant slepy]`) | grep wywolan w pinie: 0 |
| `PathTurnStop`, `PathTurnPlan`, `ExecuteMarchResult` | PORT | struktury o tych samych polach | `plan_path_turns_matches_web`, `execute_march_step_matches_web` |
| `truncatePathToBudget` | PORT | `truncate_path_to_budget` (MIN-MOVE) | `truncate_path_to_budget_matches_web_including_min_move` (587) |
| `planPathTurns` | PORT | `plan_path_turns` | `plan_path_turns_matches_web` (587; trasy wieloturowe) |
| `shouldStopAtObstacle` | PORT | `should_stop_at_obstacle` | `should_stop_at_obstacle_matches_web` (587) |
| `executeMarchStep` | PORT | `execute_march_step` | `execute_march_step_matches_web` (580: `no_path`, `no_movement`, `blocked_city`, przybycie) |
| `validateAutoMarchFromSave` | PORT | `validate_auto_march_from_save` | `save_validation_and_round_trip_match_web` (161) |
| `plannedMarchesFromSave` | PORT | `planned_marches_from_save` | j.w. (160) |
| `plannedMarchesToSave` | PORT | `planned_marches_to_save` | j.w. (60) |

**Galezie nieosiagalne w webie (przeniesione 1:1, bez wektora z uruchomionego weba - NIE_ZMIERZONO):** (a) powod `obstacle` w `shouldStopAtObstacle`. **Dowod z kodu weba (pin `edb8fb56`):** `shouldStopAtObstacle` (`planned-march.ts:293`) sam liczy trase `computePath(unit, map, dest.destQ, dest.destR, occupied, costFn)` z TYM SAMYM zbiorem `occupied`, ktory potem testuje w liniach 313 i 333 (`occupied.has(...) && !isMarchAttackDest(...)`). W `computePath` (`units/setup.ts:884-1010`) kazdy heks nie-docelowy jest pomijany, gdy zajety (`setup.ts:1008`: `if (occupied.has(nKey)) continue;`), a heks docelowy omija to sprawdzenie (`setup.ts:992-1005`, wejscie bez testu `occupied`). Zatem kazdy heks trasy poza ostatnim jest NIEzajety, a ostatni to `dest`, dla ktorego `isMarchAttackDest` (`planned-march.ts:150-152`, `q === destQ && r === destR`) jest prawda i warunek `!isMarchAttackDest` jest falszywy. Oba odgalezienia zwracajace `obstacle` (linie 314 i 334) sa wiec nieosiagalne. Potwierdzenie empiryczne z wektorow: 0 trafien `obstacle` w 587 przypadkach `shouldStopAtObstacle` i 580 `executeMarchStep`, przy czym ok. polowa przypadkow miala przeszkode wstawiona na wolnej trasie; skutek: odgalezienie `seg_cost >= budzet` jest redundantne - mutacja M19 rownowazna, zob. sekcja 3); (b) powod `fog` w `executeMarchStep` - `planPathTurns` nie ustawia `fogLimited`, `applyFogToPathPlan` zwraca plan bez zmian.

### 1.3 `rally-point.ts` (85 linii, 7 symboli)

| Symbol (web) | Status | Rust | Test |
|---|---|---|---|
| `RallyPoint`, `RallyPointsSave` (typy) | PORT | `RallyPoint`, `BTreeMap<String, RallyPoint>` | `p6_4_rally` |
| `setRallyPoint` | PORT | `set_rally_point` (wlasciciel jako liczba weba) | `set_clear_and_save_sequences_match_web` (80 sekwencji) |
| `clearRallyPoint` | PORT | `clear_rally_point` | j.w. |
| `rallyLaunchLeaderIds` | PORT | `rally_launch_leader_ids` (+ zaleznosc `stack_group_id_of`) | `launch_leaders_one_per_stack_match_web` |
| `rallyPointsToSave` | PORT | `rally_points_to_save` | j.w. + `toSave` (20) |
| `rallyPointsFromSave` | PORT | `rally_points_from_save` (+ `js_number_from_str` = `Number(string)`) | `load_from_save_and_number_parsing_match_web` (63 + 19 kluczy) |

### 1.4 `scout-auto-explore.ts` (280 linii, 7 eksportow + 6 prywatnych: `HEX_NEIGHBORS`, `SCOUT_TYPE_ID`, `occupiedExcept`, `deductStepCost`, `pickKnownVillageTarget`, `pickBestExploreStep`)

| Symbol (web) | Status | Rust | Test |
|---|---|---|---|
| `isScoutUnit` | PORT | `is_scout_unit` | `scout_flags_match_web` (16) |
| `clearScoutAutoExplore` | PORT | `clear_scout_auto_explore` | j.w. (9) |
| `scoreMarginalReveal` | PORT | `score_marginal_reveal` | `explore_scores_match_web` (120) |
| `scoreHexForExplore` | PORT | `score_hex_for_explore` | j.w. (120) |
| `pickScoutExploreTarget` | PORT | `pick_scout_explore_target` (+ prywatne `pick_known_village_target`, `pick_best_explore_step`) | `pick_scout_explore_target_matches_web_including_rng_use` (174, w tym liczba wywolan `rng`) |
| `advanceScoutAutoExplore` | PORT | `advance_scout_auto_explore` | `advance_scout_auto_explore_matches_web` (174; limit 96 krokow) |
| `runScoutsAutoExplore` | PORT | `run_scouts_auto_explore` | `run_scouts_auto_explore_matches_web` (70) |
| `HEX_NEIGHBORS`, `SCOUT_TYPE_ID` (prywatne stale) | PORT (tabela) | `ruch-jednostek-params.json` | `p6_4_tables`, weryfikator Python (regex po TS) |
| `occupiedExcept`, `deductStepCost` (prywatne) | PORT | `occupied_except`, `deduct_step_cost` | przez `advance_*` |

### 1.5 Zaleznosci przeniesione (ZALEZNOSC-PORTOWANA)

`key_of`, `hex_distance`, `terrain_move_cost`, `apply_road_movement_modifier`, `is_water_terrain`, `embark_move_cost`, `compute_reachable`, `compute_path`, `path_cost`, `compute_visible_at`, `add_explored`, `stack_group_id_of` - `p6_4_core.rs` (10 testow; wektory: koszty terenu 384 kombinacje + 10 map, `computePath` 480, `computeReachable` 400, `pathCost` 250, widocznosc 180 + 30, droga/bruk 120, stos 7).

### 1.6 Podsumowanie

Liczby rozdzielone wedlug kryterium: **eksporty** (kazda nazwa eksportowana z modulu, takze re-eksport i typ) oraz **symbole prywatne** (nieeksportowane stale/funkcje). Zrodlo liczb: `grep -nE '^export |^(async )?function |^const |^type |^interface '` po 4 plikach na pinie `edb8fb56`.

| Plik web | LOC (pin) | Eksporty | PORT | DANE | N/D | R2 | Prywatne (PORT / N/D) |
|---|---|---|---|---|---|---|---|
| `embarkation.ts` | 133 | 10 (7 + 3 re-eksporty) | 10 | 0 | 0 | 0 | 0 |
| `planned-march.ts` | 479 | 18 (6 typow + 12 pozostalych) | 18 | 0 | 0 | 0 | 2 (1 PORT: `isMarchAttackDest` / 1 N/D: martwa `_applyFogToPathPlanBlind`) |
| `rally-point.ts` | 85 | 7 | 7 | 0 | 0 | 0 | 0 |
| `scout-auto-explore.ts` | 280 | 7 | 7 | 0 | 0 | 0 | 6 (6 PORT) |
| **Razem** | **977** | **42** | **42** | **0** | **0** | **0** | **8 (7 PORT / 1 N/D)** |

Lacznie 50 symboli: 49 PORT + 1 N/D. Poziom pola: `MarchFogContext.keyOf` pominiete (N/D: w Rust klucze wyliczane z calkowitych `q,r`).

`domain/recruitment.rs` - **NIE-DOTYCZY**: zaden z 4 plikow nie importuje rekrutacji (`dowody/imports-r1.txt` = `grep -n "^import"` po 4 plikach; `grep -c "recruit\|rekrut"` = 0 w kazdym; zaleznosci: `types/map`, `types/hex`, `units/setup`, `game/civ-bonuses`, `game/armyMerge`, `game/visibility`), a pozycja `rally_moves_multiple_units_toward_their_shared_camp` z P6-0 to test weba, nie symbol logiki. Pliki `types.rs`, `session.rs`, `terrain.rs`, `improvements.rs`: bez zmian.

## 2. Co zrobiono (kod)

| Plik | Zmiana |
|---|---|
| `src/domain/pathfinding.rs` | `pub mod ruch_jednostek` (dopisany na koncu): model `RuchHex`/`RuchMapa`/`RuchJednostka`/`OrderedHexSet`, port 4 plikow + zaleznosci (sekcje 1.1-1.5) |
| `src/data/derived.rs` | (dopisek na koncu) `RUCH_JEDNOSTEK_PARAMS_JSON`, struktury, `parse_ruch_jednostek_params`, `ruch_jednostek_params` |
| `data/derived/ruch-jednostek-params.json` | NOWA tabela (stale i teksty z zrodlami w TS) |
| `tests/p6_4_core.rs`, `p6_4_embark.rs`, `p6_4_march.rs`, `p6_4_rally.rs`, `p6_4_scout.rs`, `p6_4_tables.rs` | NOWE testy |
| `tests/p6_4_vectors/{common.rs,maps.json,core.json,embark.json,march.json,rally.json,scout.json}` | NOWE wektory z uruchomionego weba |

Zero zmian w: `bridge.rs`, `Cargo.toml`, `Cargo.lock` (niecommitowany), `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `domain/mod.rs` (modul jest `pub mod` w `pathfinding.rs`, wiec zadna deklaracja nie jest potrzebna).

## 3. Dowody zgodnosci z webem

- **Generator** `gen-p64-vectors.mjs` uruchamia PRAWDZIWY kod TS z `git archive edb8fb56` (Node 22, `--experimental-transform-types`, loader dopisuje tylko `.ts` i traktuje `.json` jako modul; bez stubow). Konfiguracja ruchu jak w grze: `configureTerrainMovement(terrain-movement.json)`. Wejscia z LCG (mapy plaskie dla remisow, mieszane, wodne, drogowe; ok. 7000 przypadkow).
- **Niezalezny weryfikator** `verify-p64-vectors.py <WEB_ROOT> <ENGINE_DIR>`: osobna implementacja w Pythonie (kopiec binarny, `Set` w kolejnosci wstawiania, `Number(string)` bez wspolnego kodu z Rust ani z Node), czytana ze zrodel TS; liczy kazdy przypadek wektorow i porownuje z wynikiem weba; dodatkowo sprawdza REGEXEM po tekscie TS wszystkie stale tabeli Rust. Wynik: patrz `dowody/verify-p64-r1.log` (**0 rozbieznosci**).
- **Mutacje** (`mutate-p64.py`; `dowody/mutation-evidence-r1.txt` = pierwszy przebieg, `dowody/mutation-evidence-r1b.txt` = powtorka M05/M07/M11/M19 po poprawkach): 19 mutacji, **18 WYKRYTYCH** (kopiec/remis, kolejnosc sasiadow, podloga bruku, MIN-MOVE, `arrived`, galera, tolerancja remisu, limit krokow, sufiks garnizonu, `trunc`->`round`, dolna granica mnoznika morza, koszt wody w tabeli, widocznosc `<`, calkowitosc wlasciciela, bufor promienia, prog nieprzejezdnosci, powod `no_movement`, priorytet wioski). W pierwszym przebiegu M05 (`seg_cost >= budzet`) i M07 (tolerancja remisu) byly NIEWYKRYTE: M07 wymagal wektora z roznica score dokladnie rowna tolerancji (sekwencje `rng` 0 / 0.5 na puli zerowych zyskow) - dodany do generatora, teraz wykrywany; M05 okazal sie mutacja ROWNOWAZNA (obie galezie koncza sie `go()`, bo `obstacle` jest nieosiagalny - sekcja 1.2), wiec zastapiony wykrywalna mutacja M05 (`arrived`), a rownowazna zachowana jako M19 (oczekiwane NIEWYKRYTA). Skrypt przywraca pliki po kazdej mutacji (porownanie bajt w bajt po przebiegu: zgodne).
- **Testy ksztaltu bez pinow wartosci:** `p6_4_tables.rs`.

## 4. Bramki (surowe, PELNE logi z `EXIT`; katalog `dyspozycje/autobot/runs/R-RUSTPORT-P6-4-JEDNOSTKI-RUCH-Q1/`)

Srodowisko: `rust-port/engine`, `CARGO_INCREMENTAL=0`, `CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_9ed3ca33-8bb-1`, `CARGO_PROFILE_DEV_DEBUG=0`.

| Bramka | Polecenie | Log | Wynik |
|---|---|---|---|
| fmt | `cargo fmt --check` | `gate-fmt-r1.log` | `EXIT=0` |
| clippy | `cargo clippy --all-targets -- -D warnings` | `gate-clippy-r1.log` | `EXIT=0` (0 ostrzezen) |
| test | `cargo test` | `gate-test-r1.log` | `EXIT=0`, **543 passed / 0 failed** |
| niezalezny weryfikator | `python3 -I verify-p64-vectors.py <WEB_ROOT> <ENGINE_DIR>` | `dowody/verify-p64-r1.log` | **7180 sprawdzen, 0 rozbieznosci**, `EXIT=0` |
| mutacje | `python3 mutate-p64.py <ENGINE> <TARGET> all` | `dowody/mutation-evidence-r1.txt`, `dowody/mutation-evidence-r1b.txt` | 18/19 wykrytych, 1 rownowazna (M19), patrz sekcja 3 |
| literaly | `awk` + `grep` po module `ruch_jednostek` | `dowody/grep-literals-r1.txt` | tylko literaly strukturalne (`0`, `1`, indeksy kopca `2*i+1`, podstawy 2/8/16 gramatyki `Number()` z ECMAScript); stale gry, mnozniki i teksty - w tabeli |
| kontrola bialych znakow | `git diff --check` w worktree przed commitem | - | czysty |

## 5. Tabela bylo/jest i zmiany testow

| Miara | Bylo (`e239fd81`) | Jest |
|---|---|---|
| Testy silnika (`cargo test`, suma `passed`) | 511 | **543** (+32) |
| `p6_4_core.rs` (setup/visibility/armyMerge/road) | - | 10 |
| `p6_4_embark.rs` (`embarkation.ts`) | - | 4 |
| `p6_4_march.rs` (`planned-march.ts`) | - | 6 |
| `p6_4_rally.rs` (`rally-point.ts`) | - | 3 |
| `p6_4_scout.rs` (`scout-auto-explore.ts`) | - | 5 |
| `p6_4_tables.rs` (ksztalt tabeli, bez pinow) | - | 4 |
| Przypadki wektorow z uruchomionego weba | - | 6443 (core 1938, embark 726, march 2902, rally 194, scout 683); metoda: suma dlugosci tablic `cases.*` + liczba kluczy skalarnych/obiektow `constants` (core: 7) i `stopReasonCounts` (march: 4); same tablice przypadkow: 6432 (core 1931, march 2898); weryfikator Python liczy 7180 sprawdzen (czesc przypadkow sprawdzana wielokrotnie, plus stale tabeli porownane regexem z tekstem TS) |
| Tabela `data/derived/ruch-jednostek-params.json` | - | NOWA |

**Zmiany istniejacych testow: ZERO** (zaden istniejacy plik `tests/*.rs` nie zostal zmieniony; brak oslabien).

## 6. Co NIE zostalo zrobione / ryzyka (jawnie)

1. **Dwa pathfindery** (P3 stalo-przecinkowy `find_path` oraz web-wierny `ruch_jednostek::compute_path`) - decyzja o wyborze przy wpinaniu do petli gry (P7) nalezy do orkiestratora (ZALOZENIE 2).
2. **Uzycie `EMBARK_DEFENSE_MULT`/`EMBARK_TECH`** w walce i badaniach to P6.13 / P6.x (poza tymi 4 plikami); tabela i akcesory gotowe.
3. **Reszta `units/setup.ts`** (poza zaleznosciami z sekcji 1.5) - osobny temat; ten temat nie deklaruje jej portu.
4. **Galezie nieosiagalne** `obstacle` i `fog` (sekcja 1.2) - przeniesione, bez wektora weba.
5. **Lista "RUNDA-2 P6.2 komendy/mutatory"** (17 plikow web) - zgodnie z dispatchem poza tym tematem.
6. `Cargo.lock` powstaje lokalnie przy budowie i nie jest commitowany.

## 7. Runda 2 - odpowiedz na zarzuty Evaluatora r1 (commit 8517675b)

Kod, testy i wektory bez zmian (Evaluator: PASS). Zmieniony wylacznie ten dokument oraz dodane logi bramek r2.

| # | Zarzut | Decyzja | Dowod / poprawka |
|---|---|---|---|
| 1 | Liczby symboli w 1.1 i 1.6 niezgodne z eksportami (10 w `embarkation.ts`) | PRZYJMUJE | Sekcje 1.1, 1.2, 1.6 przepisane: 42 eksporty (10 + 18 + 7 + 7) = 42 PORT, 0 DANE, 0 N/D, 0 R2; osobno 8 symboli prywatnych (7 PORT: 6 w scout + `isMarchAttackDest`; 1 N/D: martwa `_applyFogToPathPlanBlind`); razem 50 = 49 PORT + 1 N/D. Zrodlo: `grep -nE '^export |^(async )?function |^const |^type |^interface '` po 4 plikach na pinie. |
| 2 | Re-eksporty `isWaterTerrain`, `embarkMoveCost`, `terrainMoveCost` oznaczone N/D | PRZYJMUJE | Status PORT (alias), kazdy z odnosnikiem do testu (sekcja 1.1). Dla `isWaterTerrain` brak osobnego testu jednostkowego - pokrycie posrednie przez `isWaterHexAt`/`nearestFreeWaterHex`/koszty (jawnie zapisane). |
| 3 | Zle liczby wektorow w sekcji 5 | PRZYJMUJE | Zweryfikowane `python3 -I` po dlugosciach tablic `cases.*` w `tests/p6_4_vectors/*.json`: core 1931 tablic + 7 kluczy `constants` = 1938; march 2898 + 4 klucze `stopReasonCounts` = 2902; embark 726; rally 194; scout 683; razem 6443 (same tablice: 6432). Sekcja 5 podaje teraz metode liczenia. Przy okazji poprawiono 124 -> 174 dla `pickScoutExploreTarget` i `advanceScoutAutoExplore` (sekcja 1.4; suma scout 683 byla poprawna). |
| 4 | Identyfikatory powodow zatrzymania i klucze terenu sa literalami, a dokument twierdzi, ze wszystko jest w tabeli | PRZYJMUJE (doprecyzowanie, kod bez zmian) | Dopisek w ZALOZENIU 4: te literaly to klucze strukturalne (dyskryminatory unii `planned-march.ts:31`, wartosci enum `types/hex.ts`); ten sam wzorzec w `terrain.rs:10,18`; w tabeli JSON sa teksty detali i stale liczbowe. |
| 5 | Konflikt dispatchu: kryterium binarne `tests/p6_1_*.rs` vs tresc/allowlista `tests/p6_4_*.rs` | ODRZUCAM jako zarzut wobec operatora; decyzja potwierdzona jako ZALOZENIE | Allowlista i GOAL dispatchu (`00-dispatch.md`) jawnie wymieniaja `tests/p6_4_*.rs` i `tests/p6_4_vectors/**`; `p6_1_*` w kryterium binarnym to oczywista pozostalosc po szablonie P6.1 (to samo kryterium mowi tez o "plikach P6.1", a temat to P6.4). Pliki `p6_1_*` nalezalyby do innego tematu i lezalyby poza allowlista. Orkiestrator moze zmienic decyzje; kod nie wymaga zmian nazw poza `git mv`. |

Dodatkowe zadanie z NASTEPNEGO KROKU Evaluatora - dowod, ze galaz `obstacle` jest nieosiagalna z `setup.ts` - zapisane w sekcji 1.2 (linie `planned-march.ts:293, 313, 333, 150-152`; `setup.ts:992-1008`).

### Bramki r2 (surowe, PELNE logi z `EXIT`; `rust-port/engine`, `CARGO_INCREMENTAL=0`, `CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_9ed3ca33-8bb-3`)

| Bramka | Log | Wynik |
|---|---|---|
| `cargo fmt --check` | `gate-fmt-r2.log` | `EXIT=0` |
| `cargo clippy --all-targets -- -D warnings` | `gate-clippy-r2.log` | `EXIT=0` |
| `cargo test` | `gate-test-r2.log` | `EXIT=0`, 543 passed / 0 failed |
| `git diff --check` | - | czysty |
