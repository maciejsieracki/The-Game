# P3-4C — pozostałe newtypy ID w `rust-port/engine/src/domain/**`

TEMAT: R-RUSTPORT-P3-4C-IDS-REMAINING-Q1 (runda 2/5, poprawka po zarzutach Evaluatora z rundy 1)
BAZA: `origin/rust-port/parity-v2` = `914eec6b` (P3-4B, zweryfikowane `git merge-base --is-ancestor`)
RUNDA 1: commit `0fc84fe1` (Operator, runda 1).
RUNDA 2: commit poprawki następujący po `0fc84fe1` (SHA w `02-operator-r2.md` i w raporcie Operatora).
WORKTREE: detached HEAD, bez push.

## 0. Odpowiedzi na zarzuty Evaluatora (runda 2)

| Nr | Zarzut | Odpowiedź | Dowód |
|---|---|---|---|
| 1 | Brak decyzji dla `owner_id` (`AiCity`, `AiUnit`, `PlayableCity`, `PlayableUnit`) | PRZYJMUJĘ — decyzja jawna: grupa OWNER w §1b, POZOSTAWIONE `u64`. Konwersja odłożona, bo owner-pola są porównywane z `player_id`/`MapTile.owner_id` w ~12 miejscach `ai_turn.rs`/`playable.rs`, a `diplomacy.rs`/`trade.rs` są poza allowlistą. | §1b grupa OWNER; `git grep -n 'owner_id' -- rust-port/engine/src/domain/ai_turn.rs` |
| 2 | Brak decyzji dla `BarbCityGarrison.city_id` i `BarbCityGarrisonSpawn.city_id` | PRZYJMUJĘ — decyzja jawna: grupa CITY, POZOSTAWIONE `u64`. | Literał `city_id: 4` w teście `barbarian_city_garrison_spawns_units_without_a_building_queue` (`tests/barbarians.rs`) |
| 3 | Brak decyzji dla `BarbUnit.cleared_city_ids: BTreeSet<u64>` | PRZYJMUJĘ — decyzja jawna: grupa CITY, POZOSTAWIONE `u64`. | Literał `insert(11)` w teście `state_round_trip_preserves_camp_identity_and_visit_memory` (`tests/barbarians.rs`) |
| 4 | `CitySnapshot.id` pozostawione `u64` poza listą | PRZYJMUJĘ — ZMIENIONE na `CityId`. `CitySnapshot::new(u64, ..)` owija wartość w `CityId::new`; użycia w `barbarians.rs` przez `.get()` (linie 805, 822, 832, 841, 845, 870). Testy używają wyłącznie `CitySnapshot::new` — literałów pól brak, testy bez zmian. | `git grep -n 'CitySnapshot {' -- rust-port/engine` nie zwraca literału; wynik testów w §4 |
| 5 | Lista pominięć niekompletna („np.”) | PRZYJMUJĘ — §1b zawiera pełną listę wszystkich 129 trafień `git grep` (wzorzec w §1b), każde z decyzją; zdanie z „np.” usunięte. | §1b |
| 6 | Decyzja dla `BarbCommand.unit_id`/`target_unit_id` jest tylko w §5 | ODRZUCAM — wiersz `BarbCommand::{Move,Attack}` jest w tabeli §1 tego dokumentu (w `0fc84fe1` w linii 17); §5 pkt 4 jest dodatkowym odniesieniem. Decyzja w §1 i §1b (grupa UNIT-CMD). | `git show 0fc84fe1:dyspozycje/rust-port/p3/P3-4C-IDS-REMAINING.md \| grep -n BarbCommand` |
| 7 | Format raportu: „SHA w logu gita po commicie” zamiast SHA | PRZYJMUJĘ — `02-operator-r2.md` podaje SHA rodzica (`0fc84fe1`); SHA commita poprawki jest w raporcie Operatora (commit nie może zawierać własnego SHA). `01-operator.md` pozostaje historyczny. | `dyspozycje/autobot/runs/R-RUSTPORT-P3-4C-IDS-REMAINING-Q1/02-operator-r2.md` |

## 1. Zakres i decyzje per pole

Zmienione w tym temacie (cztery pola, wszystkie z listy dispatchu lub jawnie zgłoszone w zarzucie 4):

| Pole | Plik | Decyzja | Uzasadnienie |
|---|---|---|---|
| `AiCity.id` | `ai_turn.rs:391` | ZMIENIONE na `CityId` (runda 1) | konstruktor `AiCity::new(u64, ..)` zachowany, `CityId::new` wewnątrz |
| `PlayableCity.id` | `playable.rs:294` | ZMIENIONE na `CityId` (runda 1) | `CAPITAL_ID` owinięte w `CityId::new` |
| `PlayableUnit.id` | `playable.rs:309` | ZMIENIONE na `UnitId` (runda 1) | porównania przez `.get()`; sygnatury metod `u64` zachowane |
| `CitySnapshot.id` | `barbarians.rs:136` | ZMIENIONE na `CityId` (runda 2) | `CitySnapshot::new` zachowany, `.get()` w miejscach użycia |
| `BarbCamp.id` | `barbarians.rs:160` | POMINIĘTE (`u64`) | patrz grupa CAMP w §1b |
| `UnitCombatResult.id` | `combat.rs:149` | POMINIĘTE (`u64`) | patrz grupa UNIT-RESULT w §1b |
| `AiCommand` / `BarbCommand` `unit_id`/`target_unit_id`/`city_id` | `ai_turn.rs:650-675`, `barbarians.rs:252-253` | POZOSTAWIONE (`u64`) | patrz grupy UNIT-CMD i CITY w §1b |
| `bridge.rs` `AddPlayer`/`SelectUnit`/`MoveUnit` | `bridge.rs:29-34` | BEZ ZMIAN | komendy wejściowe z JSON; konwersja w `playable.rs` |
| `OwnerRef` zamiast ujemnego `owner_id` | `barbarians.rs:143` (`owner_id: i64`) i pokrewne | NIE ZROBIONE — przyszła praca | patrz §5 pkt 2 |

## 1b. Pełna lista pozostałych `u64` w `domain/**` i `bridge.rs`

Komenda (`git grep`, wynik po zmianie, bez `parse::<u64>` i `impl From<u64>`):
`git grep -nE '\b[A-Za-z_]*(_id|_ids|id|owner[A-Za-z_]*|_by_[a-z_]+|first|second|camp[A-Za-z_]*|seed|weights|sequence)\s*:\s*[^,)=]*\bu64\b|BTreeMap<u64|BTreeSet<u64|Vec<u64>|Option<u64>|\(u64, String\)' -- src/domain src/bridge.rs`

Wynik: 129 trafień; każdy ma przypisaną grupę i decyzję (uzupełnienie: `seed`, `weights`, `sequence` to nie ID). Grupa OWNER obejmuje wszystkie pola z `owner`, `player_id`, `proposer_id`/`responder_id`, `first`/`second` (pary właścicieli w `diplomacy.rs`) i klucze `ledger` w `trade.rs`.

| Grupa | Decyzja | Uzasadnienie | Miejsca (`plik:linia`, stan po zmianie) |
|---|---|---|---|
| CITY (7) | POZOSTAWIONE `u64` (decyzja jawna) | ID miasta w: `AiOptions.city_buildings` (klucz mapy JSON, kontrakt serde nieweryfikowany dla newtype jako klucza), `AiCommand::Build.city_id` (literał `city_id: 1` w `tests/ai_turn.rs:177`), `choose_city_production`/`choose_production` (publiczne sygnatury, porównanie `.get()`), `BarbUnit.cleared_city_ids` (literał `insert(11)` w teście `state_round_trip_preserves_camp_identity_and_visit_memory`), `BarbCityGarrison.city_id` / `BarbCityGarrisonSpawn.city_id` (literał `city_id: 4` w teście `barbarian_city_garrison_spawns_units_without_a_building_queue`). Zmiana każdego z nich wymaga edycji literałów w `tests/**`, a dispatch dopuszcza w testach tylko importy. | `ai_turn.rs:544`, `ai_turn.rs:675`, `ai_turn.rs:817`, `ai_turn.rs:822`, `barbarians.rs:201`, `barbarians.rs:923`, `barbarians.rs:931` |
| CAMP (7) | POMINIĘTE `u64` (decyzja jawna) | `BarbCamp.id`, `BarbUnit.camp_id`, `BarbSpawn.camp_id`, `with_camp`, `destroy_camp_at`, grupowanie po obozie. `ids.rs` zawiera wyłącznie `PlayerId`/`CityId`/`UnitId`; `CampId` wymaga dopisania do `ids.rs`, którego nie ma w allowlist. Testy `tests/barbarians.rs` konstruują `BarbCamp::new(1, ..)` i literały `BarbCamp { .. }`. Przyszła praca: §5 pkt 1. | `barbarians.rs:160`, `barbarians.rs:169`, `barbarians.rs:195`, `barbarians.rs:227`, `barbarians.rs:241`, `barbarians.rs:528`, `barbarians.rs:652` |
| OWNER (91) | POZOSTAWIONE `u64` (odłożone; decyzja jawna) | Pola `owner_id`/`player_id` i parametry właściciela. Są porównywane z `AiTurnInput.player_id` i `MapTile.owner_id: Option<u64>` w `ai_turn.rs` (wiele miejsc: 779, 834, 839, 848, 1002, 1021, 1056, 1062, 1069, 1236) oraz w `playable.rs` (498, 532). Częściowa konwersja dałaby mieszane porównania `PlayerId`/`u64`. `diplomacy.rs` i `trade.rs` są poza allowlistą tematu. Typowanie właścicieli to `PlayerId`/`OwnerRef` z P2.3 §9 — patrz §5 pkt 2. `barbarians.rs:143` używa `owner_id: i64` (ujemny sentinel) — §5 pkt 2. | `ai_turn.rs:135`, `ai_turn.rs:176`, `ai_turn.rs:335`, `ai_turn.rs:355`, `ai_turn.rs:392`, `ai_turn.rs:412`, `ai_turn.rs:616`, `ai_turn.rs:627`, `barbarians.rs:143`, `diplomacy.rs:160`, `diplomacy.rs:161`, `diplomacy.rs:185`, `diplomacy.rs:189`, `diplomacy.rs:1402`, `diplomacy.rs:1404`, `diplomacy.rs:1424`, `diplomacy.rs:1426`, `diplomacy.rs:1471`, `diplomacy.rs:1472`, `diplomacy.rs:1532`, `diplomacy.rs:1622`, `diplomacy.rs:1631`, `diplomacy.rs:1637`, `diplomacy.rs:1651`, `diplomacy.rs:1652`, `diplomacy.rs:1677`, `diplomacy.rs:2034`, `diplomacy.rs:2035`, `diplomacy.rs:2192`, `diplomacy.rs:2194`, `diplomacy.rs:2204`, `diplomacy.rs:2275`, `diplomacy.rs:2356`, `diplomacy.rs:2365`, `diplomacy.rs:2366`, `diplomacy.rs:2418`, `diplomacy.rs:2419`, `diplomacy.rs:2428`, `diplomacy.rs:2429`, `diplomacy.rs:2442`, `diplomacy.rs:2443`, `diplomacy.rs:2453`, `diplomacy.rs:2459`, `diplomacy.rs:2467`, `diplomacy.rs:2514`, `diplomacy.rs:2515`, `diplomacy.rs:2618`, `diplomacy.rs:2619`, `diplomacy.rs:2634`, `diplomacy.rs:2635`, `diplomacy.rs:2827`, `diplomacy.rs:2867`, `diplomacy.rs:2869`, `diplomacy.rs:2876`, `diplomacy.rs:2877`, `diplomacy.rs:2913`, `diplomacy.rs:3898`, `diplomacy.rs:3915`, `diplomacy.rs:4041`, `playable.rs:295`, `playable.rs:310`, `trade.rs:239`, `trade.rs:247`, `trade.rs:266`, `trade.rs:273`, `trade.rs:399`, `trade.rs:401`, `trade.rs:416`, `trade.rs:417`, `trade.rs:548`, `trade.rs:564`, `trade.rs:565`, `trade.rs:986`, `trade.rs:990`, `trade.rs:1239`, `trade.rs:1240`, `trade.rs:1265`, `trade.rs:1266`, `trade.rs:1586`, `trade.rs:1590`, `trade.rs:1599`, `trade.rs:1601`, `trade.rs:1669`, `trade.rs:1679`, `trade.rs:1714`, `trade.rs:1716`, `trade.rs:1724`, `trade.rs:1725`, `trade.rs:1762`, `trade.rs:1805`, `trade.rs:1806` |
| UNIT-CMD (6) | POZOSTAWIONE `u64` (decyzja jawna) | `AiCommand::{Move,FoundCity,Attack,Build}` (`unit_id`, `target_unit_id`) i `BarbCommand::{Move,Attack}` (`unit_id`, `target_unit_id`). Literały w testach: `tests/ai_turn.rs:78, 114, 146` (`unit_id: 4`), `tests/barbarians.rs:171` (`BarbCommand::Move { unit_id: 3, .. }` w `matches!`). Kontrakt wyjścia planera (serde `unitId`/`targetUnitId`) pozostaje bez zmian; konwersja `.get()` na granicy. | `ai_turn.rs:650`, `ai_turn.rs:659`, `ai_turn.rs:668`, `ai_turn.rs:670`, `barbarians.rs:252`, `barbarians.rs:253` |
| UNIT-RESULT (1) | POMINIĘTE `u64` (decyzja jawna) | `UnitCombatResult.id`. `tests/combat.rs:121-130` porównuje `.map(|outcome| outcome.id).collect::<Vec<_>>()` z literałem `vec![7, 8]`. Zmiana na `UnitId` wymaga zmiany asercji testu — poza zakresem „tylko importy”. | `combat.rs:149` |
| SURVIVORS (2) | POZOSTAWIONE `u64` (sprzężone z `UnitCombatResult.id`) | `survivors_attacker`/`survivors_defender` są listą `UnitCombatResult.id`; zmiana jednego bez drugiego wymagałaby konwersji na granicy. | `combat.rs:166`, `combat.rs:168` |
| UNIT-BOUNDARY (6) | POZOSTAWIONE `u64` (granica wejścia/API) | Parametry i pola wejściowe `PlayableGame::select_unit`/`move_unit`, `PlayableState.selected_unit_id`, komendy `bridge.rs` (`SelectUnit`, `MoveUnit`), prywatna `occupied_without(excluded_id)`. `bridge.rs` wywołuje metody bezpośrednio z wartości JSON; konwersja `.get()`/`UnitId::new` w `playable.rs`. Sygnatury publiczne bez zmian. | `bridge.rs:31`, `bridge.rs:34`, `ai_turn.rs:1267`, `playable.rs:329`, `playable.rs:491`, `playable.rs:511` |
| PLAYER-INPUT (2) | POZOSTAWIONE `u64` (granica wejścia) | `bridge.rs:29` `AddPlayer { id }` i `PlayableGame::add_player(id: u64)` (`playable.rs:472`); wewnątrz tworzony jest `PlayerId::new(id)` (`playable.rs:482`). Sygnatura bez zmian. | `bridge.rs:29`, `playable.rs:472` |
| CTOR-WRAP (2) | POZOSTAWIONE `u64` w parametrze konstruktora (owijany w newtyp wewnątrz) | Konstruktory `BarbUnit::new`, `CombatUnit::new` i pokrewne przyjmują `u64` i wywołują `UnitId::new`/`CityId::new` wewnątrz. Zmiana sygnatur łamałaby testy. | `barbarians.rs:207`, `combat.rs:46` |
| NOT-ID (5) | NIE JEST ID ENCJI (poza zakresem) | Ziarno RNG, wagi losowania, licznik sekwencji jednostek, wartości zasobów. | `combat.rs:110`, `combat.rs:131`, `combat.rs:382`, `diplomacy.rs:3919`, `turn_economy.rs:379` |

## 2. Dowód `git grep` przed/po

PRZED (`914eec6b`), pola ze wskazanej listy: `ai_turn.rs:391` `AiCity.id: u64`, `playable.rs:294` `PlayableCity.id: u64`, `playable.rs:309` `PlayableUnit.id: u64`, `barbarians.rs:155` `BarbCamp.id: u64` (POMINIĘTE), `combat.rs:149` `UnitCombatResult.id: u64` (POMINIĘTE), `barbarians.rs:136` `CitySnapshot.id: u64` (ZMIENIONE w rundzie 2).

PO (`git grep -nE '\b(pub )?id: (UnitId|CityId|PlayerId)\b' -- src/domain`):
```
src/domain/ai_turn.rs:334:    pub id: UnitId,
src/domain/ai_turn.rs:391:    pub id: CityId,
src/domain/barbarians.rs:136:    pub id: CityId,
src/domain/barbarians.rs:189:    pub id: UnitId,
src/domain/combat.rs:28:    pub id: UnitId,
src/domain/playable.rs:285:    pub id: PlayerId,
src/domain/playable.rs:294:    pub id: CityId,
src/domain/playable.rs:309:    pub id: UnitId,
```

## 3. Diff

Zmienione pliki (allowlista): `rust-port/engine/src/domain/ai_turn.rs`, `rust-port/engine/src/domain/playable.rs` (runda 1, `0fc84fe1`), `rust-port/engine/src/domain/barbarians.rs` (runda 2: `CitySnapshot.id` -> `CityId`, import `use super::{CityId, UnitId}`, `.get()` w 6 miejscach). Dokumenty: `dyspozycje/rust-port/p3/P3-4C-IDS-REMAINING.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P3-4C-IDS-REMAINING-Q1/*`. Brak zmian w `bridge.rs`, `combat.rs`, `tests/**`, `src/data/**`, `lib.rs`, `Cargo.toml`, `Cargo.lock` (nieśledzony, nie commitowany), `gra/**`.

## 4. Weryfikacja (runda 2)

- `rustfmt --check --edition 2021 src/domain/barbarians.rs src/domain/ai_turn.rs src/domain/playable.rs` — EXIT 0.
- `cargo check --offline --all-targets` — 0 ostrzeżeń, 0 błędów.
- Baseline przed zmianą (`914eec6b`): 256 passed.
- Surowy log `cargo test --offline` po rundzie 2 (wygenerowany przez `CARGO_TARGET_DIR=/home/user/cargo-target-shared CARGO_PROFILE_DEV_DEBUG=0 cargo test --offline > log 2>&1; echo "EXIT=$?" >> log`), wklejony dosłownie:

```
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_f9a5930d-e4e-3/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 25.60s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/debug/deps/civ_engine-156fa2cbdb245699)

running 6 tests
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/debug/deps/ai_turn-460bd39386ba4492)

running 11 tests
test civilian_units_do_not_receive_combat_orders ... ok
test command_wire_shape_is_stable_for_engine_integration ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/debug/deps/barbarians-7b24174c71ef0810)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/debug/deps/bridge_add_player-ce1fd490dcb6a6f7)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/debug/deps/building_costs-4e7b3f7f250c8e49)

running 10 tests
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/debug/deps/city_growth-87094e53345404d1)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/debug/deps/combat-8773259014f09ec4)

running 7 tests
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test resolver_is_order_independent_and_preserves_ids ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/debug/deps/data_buildings_tech-1eb960ab77463cfc)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/debug/deps/data_civilizations-300ddd088ca4bc5c)

running 7 tests
test civ_params_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/debug/deps/data_economy_society-b9e1ae6c4bdc55fe)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/debug/deps/data_terrain_map-6d38082c499fa4b3)

running 4 tests
test terrain_yields_parses_and_spot_checks ... ok
test map_gen_params_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/debug/deps/data_units_combat-b54740944ce06b47)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/debug/deps/diplomacy-a46955b4c2b0a9d5)

running 31 tests
test alliance_uses_configured_hegemon_threshold ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test annexation_requires_vassal_economy_orientation ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test production_diplomacy_api_is_public ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test war_currency_gate_allows_only_peace_settlements ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/events.rs (/home/user/cargo-target-shared/debug/deps/events-535ca09a3b1ee21b)

running 8 tests
test canonical_turn_phases_are_explicit_and_stable ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test built_in_events_map_to_their_responsible_phases ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/debug/deps/hex_terrain-85cee3c09d9848a8)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/debug/deps/improvements-497489be4706b2cf)

running 13 tests
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test tile_and_production_are_json_round_trip_safe ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/debug/deps/map_generator-2a385a5d9ea63973)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/debug/deps/parity_suite-a408f056a5bffc47)

running 11 tests
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test public_engine_wire_aliases_are_stable ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/debug/deps/pathfinding-09cc5ba754d92fd8)

running 8 tests
test impassable_destination_is_allowed_as_the_final_step ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test unreachable_and_missing_fields_are_rejected ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/debug/deps/playable_slice-6681ee9c12cdedff)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/debug/deps/recruitment-5c88a67799e710fe)

running 7 tests
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/replay.rs (/home/user/cargo-target-shared/debug/deps/replay-84c09d3c9b07abea)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/debug/deps/resource_production-e15db088bc4423ba)

running 5 tests
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test multiple_layers_stack_additively_per_resource ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/debug/deps/rng-076a121dccbd1840)

running 4 tests
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test copied_state_and_forks_reproduce_independent_streams ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/debug/deps/save_load-c4f6a0697b26bba2)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/debug/deps/smoke-9d4e55401cce65c1)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/debug/deps/state_dto-c23b7ef4d84127e0)

running 10 tests
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test city_rejects_empty_names_and_zero_population ... ok
test canonical_state_round_trips_through_serde ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/debug/deps/steam_adapter-80ddf19e002e6c87)

running 5 tests
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test unavailable_mock_rejects_every_steam_operation ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/debug/deps/terrain_movement_fix-64f077198837c9ca)

running 9 tests
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test land_route_bfs_crosses_desert_field ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/debug/deps/trade-81c7127e60dee23e)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test diff_and_serialization_preserve_route_contract ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/debug/deps/turn_economy-761cb7e9305a13f4)

running 7 tests
test resource_costs_are_paid_independently_and_never_underflow ... ok
test flow_helpers_are_deterministic_and_saturating ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test settlement_credits_income_before_paying_expenses ... ok
test settlement_and_balances_round_trip_through_serde ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/debug/deps/unit_epoch-72c883f5b31d50a1)

running 5 tests
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test scout_is_available_in_every_epoch ... ok
test current_and_previous_epochs_are_available ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

Suma `passed` ze wszystkich binarek: 256, `failed`: 0. Kontrakt JSON: `CityId`/`UnitId` mają `#[serde(transparent)]` (`ids.rs`); testy save/DTO/parity przechodzą w tym logu.

## 5. Przyszła praca (poza tym tematem)

1. `CampId` (newtype w `ids.rs`) dla `BarbCamp.id`, `BarbUnit.camp_id`, `BarbSpawn.camp_id`, `with_camp`, `destroy_camp_at` — wymaga zmiany allowlisty (`ids.rs`) i literałów `BarbCamp { .. }` w testach.
2. `OwnerRef` / `PlayerId` dla grupy OWNER (w tym `diplomacy.rs` i `trade.rs`, poza allowlistą tego tematu) oraz `CitySnapshot.owner_id: i64` z `BARBARIAN_OWNER_ID = -1` — przebudowa logiki właścicieli (P2.3 §9).
3. `UnitCombatResult.id` -> `UnitId` wraz z `survivors_*` — wymaga zmiany asercji w `tests/combat.rs`.
4. `AiCommand`/`BarbCommand` `unit_id`/`target_unit_id` i pola `city_id` (`AiCommand::Build`, `BarbCityGarrison`, `cleared_city_ids`, `city_buildings`) -> newtypy — wymaga zmiany literałów w `tests/ai_turn.rs` i `tests/barbarians.rs`.
5. Granice `bridge.rs`/`playable.rs` (`select_unit`, `move_unit`, `add_player`) — po zmianie 4 można typować parametry newtypami, zmiana API bridge.
