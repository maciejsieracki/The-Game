# P3-20 — `OwnerRef` (enum właściciela) i `CampId` w `rust-port/engine`

TEMAT: R-RUSTPORT-P3-20-OWNERREF-CAMPID-Q1 (runda 1/5, Operator)
DOMAIN: GAME
GOAL: domknięcie typów tożsamości z P2.3 §9 (D-ID-7 PRZYJĘTA): `OwnerRef` zamiast liczb
ze znakiem dla właściciela (`-1` barbarzyńca, `-99` bunt) oraz `CampId` zamiast `u64`
w `BarbCamp.id`. Kontrakt JSON bez zmian (właściciel nadal liczbą).
BAZA: `origin/rust-port/parity-v2` = `7aab83f5` (P3.18 + renderer P4.8–P4.10), detached HEAD,
bez push.
ŹRÓDŁA CZYTANE: `dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md` (§2.4, §9, D-ID-7, D-ID-8)
z `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`; `dyspozycje/rust-port/p3/P3-4C-IDS-REMAINING.md`
§1b (lista grup, worktree); `rust-port/engine/src/domain/{ids,barbarians}.rs`;
`rust-port/engine/tests/barbarians.rs`.

## 1. Zmiany w kodzie

| Plik | Zmiana |
|---|---|
| `src/domain/ids.rs` | nowy `CampId` (`id_type!`, `#[serde(transparent)]`); nowy `enum OwnerRef { Player(PlayerId), Barbarian, Rebel }` z ręcznym `Serialize`/`Deserialize` (liczba: gracz = ID, `-1`, `-99`), `player()`, `is_barbarian()`, `from_legacy_i64() -> Option<Self>`, `legacy_i64() -> Option<i64>`, `From<PlayerId>`; stałe `LEGACY_BARBARIAN_OWNER_ID = -1`, `LEGACY_REBEL_OWNER_ID = -99`. Brak arytmetyki. |
| `src/domain/mod.rs` | re-eksport `CampId`, `OwnerRef` (patrz §5, odchylenie od allowlisty). |
| `src/domain/barbarians.rs` | usunięta stała `BARBARIAN_OWNER_ID: i64`; `MapTile.owner_id: Option<OwnerRef>`; `CitySnapshot.owner_id: OwnerRef`; `BarbUnit.owner_id: OwnerRef` (domyślnie `Barbarian`); `BarbCamp.id: CampId`; `BarbUnit.camp_id: Option<CampId>`; `BarbSpawn.camp_id: CampId`; `destroy_camp_at -> Option<CampId>`; `is_barbarian(OwnerRef)`; `can_capture_empty_city` / `is_city_capture_blocked_by_defenders` przyjmują `OwnerRef`; klucz mapy rallies `BTreeMap<CampId, _>`. Konstruktory `BarbCamp::new(u64, ..)`, `BarbUnit::with_camp(u64)`, `CitySnapshot::new(u64, OwnerRef, ..)`, `MapTile::owned(_, OwnerRef)` owijają wartość w newtyp wewnątrz. |
| `tests/barbarians.rs` | tylko konstrukcje typów: helper `player(id) -> OwnerRef`, literały `owner_id: player(0)` (3 miejsca), `CitySnapshot::new(_, player(0), ..)` (5 miejsc), `MapTile::owned(_, player(7))`, `BARBARIAN_OWNER_ID` → `OwnerRef::Barbarian`, asercje `CampId::new(10)` / `Some(CampId::new(1))`. Żadna asercja nie osłabiona. Literały `city_id` (CITY, poza zakresem) bez zmian. |
| `tests/owner_ref.rs` | NOWY, 6 testów: round-trip serde wszystkich wariantów w reprezentacji liczbowej (`0`, `1`, `42`, `-1`, `-99`), odrzucenie innych ujemnych (`-2`, `-100`) i stringa, konwersje legacy (w tym `i64::MIN` i `u64::MAX` jako gracz), akcesory, porządek sortowania, `CampId` jako transparent newtype. |

`bridge.rs`: brak pól właściciela w `bridge.rs` (sprawdzone `git grep`), więc nie wymagał zmian
(zakres „tylko konwersje” — konwersji nie było potrzeba).

## 2. Decyzje „OwnerRef vs PlayerId vs bez zmiany”

Grupy jak w P3-4C §1b. Stan po zmianie (`git grep` na drzewie roboczym).

| Grupa | Pola / miejsca (`plik:linia`, po zmianie) | Decyzja | Uzasadnienie |
|---|---|---|---|
| OWNER-BARB | `barbarians.rs:83` `MapTile.owner_id`; `:94` `owned`; `:134` `CitySnapshot.owner_id`; `:140` `new`; `:187` `BarbUnit.owner_id`; `:306` `is_barbarian`; `:546`, `:557` `attacker_owner_id` | ZMIENIONE → `OwnerRef` | Tu występują sentynele `-1` (`BARBARIAN_OWNER_ID`) i wartości ze znakiem (`i64`). Cały moduł jest w allowliście. |
| CAMP | `barbarians.rs:157` `BarbCamp.id`; `:192` `BarbUnit.camp_id`; `:238` `BarbSpawn.camp_id`; `:528` `destroy_camp_at`; `:652` klucz `groups` | ZMIENIONE → `CampId` | Decyzja RUNDY 1 (rozstrzygnięcie orkiestratora): `BarbCamp.id: CampId`. `CampId` dodany do `ids.rs`. |
| CAMP-CTOR | `barbarians.rs:168` `BarbCamp::new(u64,..)`; `:224` `with_camp(u64)` | BEZ ZMIANY SYGNATURY (owijane wewnątrz) | Wzorzec CTOR-WRAP z P3-4C; testy konstruują `BarbCamp::new(1, ..)`. |
| CITY (bez zmiany, jawnie) | `barbarians.rs:` `BarbCityGarrison.city_id`, `BarbCityGarrisonSpawn.city_id`, `BarbUnit.cleared_city_ids: BTreeSet<u64>`; `ai_turn.rs` `AiCommand::Build.city_id`, `AiOptions.city_buildings` | POZOSTAWIONE `u64` | Decyzja P3-4C §1b (grupa CITY) bez zmiany. Typ `CityId` poza zakresem właściciela. Kandydat P3.21. |
| UNIT-CMD / UNIT-RESULT / SURVIVORS / UNIT-BOUNDARY / PLAYER-INPUT | `BarbCommand::{Move,Attack}`, `AiCommand::*`, `UnitCombatResult.id`, `PlayableGame::select_unit/move_unit`, `add_player(u64)` | POZOSTAWIONE `u64` | Nie są właścicielami; decyzje P3-4C §1b. |
| PLAYER-OWNER (kandydat P3.21, NIE OwnerRef) | `ai_turn.rs:170` `MapTile`-owner `Option<u64>`, `:211` `owned`, `:370`, `:390`, `:427`, `:447` (`AiUnit`/`AiCity` `owner_id`), `:651` `AiTurnInput.player_id`, `:662`; `playable.rs:295`, `:310` (`PlayableCity`/`PlayableUnit.owner_id`); `trade.rs:239`, `:247`, `:266`, `:273`, `:399`, `:416`, `:1586`, `:1599`, `:1669`, `:1679`, `:1806`; `diplomacy.rs:187`, `:191` (`contains`/`other`, para graczy), `:2404`, `:2410`, `:2418`, `:3849` | POZOSTAWIONE `u64`, NIE OwnerRef | Te pola zawsze dotyczą gracza (żaden nie przyjmuje `-1`/`-99` w Rust, sprawdzone `git grep`), więc właściwym typem byłby `PlayerId`, nie `OwnerRef`. Nie zmieniono: porównania mieszają się z `Option<u64>` (`MapTile.owner_id` w `ai_turn.rs`) i `u64` z `playable.rs`; `diplomacy.rs`/`trade.rs` są poza allowlistą tematu. Częściowa zmiana dałaby mieszane porównania `PlayerId`/`u64` (ten sam powód co P3-4C). |
| PLAYER-DTO (bez zmiany) | `types.rs:331`, `:340`, `:415`, `:423` `owner_id: PlayerId` | BEZ ZMIANY | Już `PlayerId`. |
| Sentynele w `diplomacy.rs`/`trade.rs`/`state.rs`/`session.rs`/`events.rs` | grep `-99`, `BARBARIAN`, `barbarian` | brak trafień sentynelowych | Nic do zamiany. |
| REBEL | brak miejsca w Rust używającego buntu | `OwnerRef::Rebel` tylko jako wariant wire/serde | P2.3 D-ID-7; brak pól w Rust do przepięcia. |
| `rebelPreviousOwnerId` (web `city`, `cities.ts`/P2-3 wiersz 47) | brak pola w Rust | NIE DODANO | Dodanie pola `Option<PlayerId>` do miasta zmieniłoby strukturę `CityDto`/`GameState` poza allowlistą i zmieniłoby JSON. Odnotowane jako kandydat P3.21. |

Liczby (po zmianie, `git grep -n` w `barbarians.rs`): pozostałe surowe `i64` w `barbarians.rs` = 0.
Przed (`git grep -c` na `HEAD`, wzorzec owner/camp/`BARBARIAN_OWNER_ID`): 17 trafień. Po: owner/camp
w tym pliku wyłącznie `OwnerRef`/`CampId` (9 linii w `git grep` po `OwnerRef|CampId`, bez `u64` jako właściciela).

## 3. Kontrakt JSON

- Serializacja `OwnerRef` = liczba (`serialize_i64`): `Player(7)` → `7`, `Barbarian` → `-1`, `Rebel` → `-99`.
- `CampId` i `CityId`/`UnitId` = `#[serde(transparent)]` → liczba jak dotąd.
- Deserializacja odrzuca inne ujemne wartości (np. `-2`) i stringi. Dotąd `i64` akceptował `-2`; to
  jedyna zmiana zachowania deserializacji i dotyczy tylko wartości, których żaden zapis web nie produkuje
  (`barbarians.ts:49` `-1`, `society-breakdown.ts:206` `-99`).
- Pola w stanie zapisu (`BarbUnit.owner_id`, `CitySnapshot.owner_id`, `BarbCamp.id`, `BarbUnit.camp_id`,
  `MapTile.owner_id`) zachowują ten sam kształt JSON. Round-trip `BarbUnit` testowany
  (`state_round_trip_preserves_camp_identity_and_visit_memory`).
- Nie zmieniono `tests/state_dto.rs`, `tests/save_load.rs`, `tests/parity_suite.rs`, `tests/recruitment.rs`,
  `tests/building_costs.rs`, `tests/derived_values.rs`, `src/data/**`, `Cargo.toml`, `gra/**`,
  `rust-port/renderer/**`, `src-tauri/**`. Ich oczekiwania nie zostały zmienione. Zielone wyniki w §4.

## 4. Weryfikacja (surowe wyjścia z echo EXIT, dołączone niżej)

Komendy (katalog `rust-port/engine`, `CARGO_INCREMENTAL=0`, `CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_825e2b0f-89a-1`, `CARGO_PROFILE_DEV_DEBUG=0`):

1. `cargo fmt --all` (formatowanie 2 plików: `barbarians.rs`, `owner_ref.rs`) — EXIT=0, potem
   `cargo fmt --all -- --check` — EXIT=0 (log §5.1).
2. `cargo clippy --all-targets -- -D warnings` — EXIT=0 (log §5.2).
3. `cargo test` — EXIT=0 (log §5.3, pełny).

Liczba testów: suma `test result: ok` = **333 passed, 0 failed**. W tym 6 nowych (`tests/owner_ref.rs`).
Baseline (ta sama gałąź bez zmian) = 333 − 6 = **327** (WYLICZONE, NIE_ZMIERZONO bezpośrednio:
nie uruchamiano osobnego przebiegu na `7aab83f5`; testy `tests/barbarians.rs` nie zmieniły liczby, 10 przed i po).
Warunek „liczba testów ≥ baseline” spełniony (333 ≥ 327).

Brak zmian w `Cargo.toml`. Nieśledzony `rust-port/engine/Cargo.lock` wygenerowany przez build — NIE dodany do commita.

## 5. Surowe logi

### 5.1 `cargo fmt --all -- --check` (EXIT=0, pusty stdout = brak różnic)

```
EXIT=0
```

### 5.2 `cargo clippy --all-targets -- -D warnings`

```
    Updating crates.io index
     Locking 17 packages to latest compatible versions
   Compiling proc-macro2 v1.0.107
   Compiling unicode-ident v1.0.27
   Compiling quote v1.0.47
   Compiling serde_core v1.0.229
   Compiling zmij v1.0.23
    Checking once_cell v1.21.4
   Compiling serde_json v1.0.154
   Compiling serde v1.0.229
    Checking tracing-core v0.1.36
    Checking itoa v1.0.18
    Checking pin-project-lite v0.2.17
    Checking memchr v2.8.3
   Compiling syn v3.0.9
   Compiling syn v2.0.119
   Compiling serde_derive v1.0.229
   Compiling tracing-attributes v0.1.31
    Checking tracing v0.1.44
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_825e2b0f-89a-1/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 37.87s
EXIT=0
```

### 5.3 `cargo test` (pełny log, EXIT na końcu)

```
   Compiling serde_core v1.0.229
   Compiling once_cell v1.21.4
   Compiling zmij v1.0.23
   Compiling memchr v2.8.3
   Compiling tracing-core v0.1.36
   Compiling pin-project-lite v0.2.17
   Compiling itoa v1.0.18
   Compiling tracing v0.1.44
   Compiling serde v1.0.229
   Compiling serde_json v1.0.154
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_825e2b0f-89a-1/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 22.29s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 13 tests
test command_wire_shape_is_stable_for_engine_integration ... ok
test hex_city_score_enemy_penalty_follows_threat_range_option ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test ai_turn_default_city_parameters_match_ai_params_json ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test byte_sums_per_category_match_p1_11 ... ok
test counts_per_extension_match_p1_11 ... ok
test manifest_has_header_and_428_data_rows ... ok
test manifest_dest_paths_are_unique ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_size ... ok
test negative_validator_rejects_wrong_sha ... ok
test sha1_matches_known_vectors ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.26s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/combat-7737db4785daf590)

running 7 tests
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_params_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test rt_ai_params ... ok
test rt_auto_battle_params ... ok
test collection_id_sets_match_web_pin ... ok
test rt_citizen_resource_upkeep ... ok
test rt_city_names_pools ... ok
test rt_civ_ai ... ok
test embedded_raw_counts_match_web_pin ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test rt_civ_params ... ok
test rt_combat_params ... ok
test rt_counters ... ok
test rt_diplomacy ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_civs ... ok
test rt_e_start_params ... ok
test rt_buildings ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_miasto_params ... ok
test rt_map_gen_params ... ok
test rt_power_params ... ok
test rt_resources ... ok
test rt_civ_matrix ... ok
test rt_econ_params ... ok
test rt_terrain_combat ... ok
test rt_terrain_movement ... ok
test rt_terrain_yields ... ok
test rt_tech ... ok
test rt_ui_params ... ok
test rt_society_params ... ok
test rt_terrain_improvements ... ok
test web_pin_constants_are_internally_consistent ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_wonders ... ok
test rt_units ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/data_loader-4b1b0c97d63f2050)

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
test neg_unreadable_file_is_io ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_missing_file_is_file_missing ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.25s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test map_gen_params_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/diplomacy-d94c0845f92f376e)

running 32 tests
test alliance_sweetener_ease_is_measured_in_points ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test annexation_requires_vassal_economy_orientation ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test war_currency_gate_allows_only_peace_settlements ... ok
test diplomacy_unit_prices_match_units_json_for_every_row ... ok

test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/events-987aa8790b10a253)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test root_reexports_are_the_same_production_api_types ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test tile_and_production_are_json_round_trip_safe ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/owner_ref.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/owner_ref-92f476c7f4239a8a)

running 6 tests
test camp_id_is_a_transparent_newtype ... ok
test owner_ref_legacy_conversions_match_the_sentinels ... ok
test owner_ref_accessors_and_player_conversion ... ok
test owner_ref_ordering_and_hashing_are_stable ... ok
test owner_ref_rejects_unknown_negative_numbers ... ok
test owner_ref_serializes_every_variant_as_the_legacy_number ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test public_engine_wire_aliases_are_stable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test unreachable_and_missing_fields_are_rejected ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/recruitment-10fa19ca5709d7f0)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test multiple_layers_stack_additively_per_resource ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test city_rejects_empty_names_and_zero_population ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test canonical_state_round_trips_through_serde ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test unavailable_mock_rejects_every_steam_operation ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test land_route_bfs_crosses_desert_field ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok
test barbarian_camps_never_spawn_on_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test diff_and_serialization_preserve_route_contract ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test settlement_credits_income_before_paying_expenses ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test settlement_and_balances_round_trip_through_serde ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_825e2b0f-89a-1/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 5 tests
test current_and_previous_epochs_are_available ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test scout_is_available_in_every_epoch ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

## 6. Status

STATUS: PASS-WITH-NOTES (kod i testy zielone; zakres świadomie węższy niż „wszystkie pola właściciela”, patrz §2 PLAYER-OWNER; odchylenie allowlisty: `domain/mod.rs` §5)
DOMAIN: GAME
ZMIANY/COMMIT: patrz §1; commit w worktree bez push
BLOKADY: brak twardych; kandydaci P3.21: PLAYER-OWNER (u64 -> PlayerId w ai_turn/playable/trade/diplomacy), CITY (`city_id`/`cleared_city_ids` -> CityId), `rebelPreviousOwnerId`
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (kontrola §2, §3, §4)
DEPLOY/PUSH: NIE WYKONANO
