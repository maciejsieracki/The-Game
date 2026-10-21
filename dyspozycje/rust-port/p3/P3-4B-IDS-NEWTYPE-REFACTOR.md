# P3-4B — newtypy ID w PlayablePlayer / CombatUnit / AiUnit / BarbUnit

TEMAT: R-RUSTPORT-P3-4B-IDS-NEWTYPE-REFACTOR-Q1 (runda 2)
BAZA: `origin/rust-port/parity-v2` = `1d53dcdb` (zawiera `df8d8592`, zweryfikowane przez `git merge-base --is-ancestor`)
WORKTREE: detached HEAD, bez push.

## 1. Zakres zmian (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/barbarians.rs` | `BarbUnit.id: u64` -> `UnitId`; `BarbUnit::new` konwertuje `UnitId::new(id)`; użycia `unit.id`/`enemy.id` w `BarbCommand` i `rallied_ids` przez `.get()` |
| `rust-port/engine/src/domain/ai_turn.rs` | `AiUnit.id: u64` -> `UnitId`; `AiUnit::new` -> `UnitId::new(id)`; `use civ_engine::domain::UnitId;`; konwersje `.get()` na granicy z komendami `AiCommand` (pola `u64`) i `occupied_without` |
| `rust-port/engine/src/domain/playable.rs` | `PlayablePlayer.id: u64` -> `PlayerId`; `PlayerId::new(...)` przy konstrukcji; `player.id.get() == id` w `add_player` |
| `rust-port/engine/src/domain/combat.rs` | `CombatUnit.id: u64` -> `UnitId`; `use super::UnitId;`; `CombatUnit::new` -> `UnitId::new(id)`; `UnitCombatResult.id` (u64) konwersja `unit.id.get()` |
| `rust-port/engine/src/bridge.rs` | WYŁĄCZNIE konwersje ID przy `PlayablePlayer.id`: porównania `.get()` i konstrukcja `civ_engine::domain::PlayerId::new(id)` (3 miejsca: ~335, ~348, ~412) |
| `rust-port/engine/tests/combat.rs` | WYŁĄCZNIE import `use civ_engine::domain::UnitId;` (zero zmian logiki/testów) |

Zero zmian w `src/data/**`, `lib.rs`, `gra/**`. `tests/ai_turn.rs` i `tests/barbarians.rs` NIE wymagały zmian (`ai_turn.rs` importuje `UnitId` sam, patrz niżej).

Diff stat: 6 plików, 41 insertions, 34 deletions (bez `Cargo.lock`/`target/`, które są nieśledzone i NIE są w commicie).

### Uwaga o ścieżkach importu (świadome odstępstwo od dispatchu)

Dispatch przewidywał zmiany importów w `tests/ai_turn.rs`. Faktycznie `src/domain/ai_turn.rs` NIE jest modułem biblioteki (brak deklaracji w `domain/mod.rs`) — jest ładowany wyłącznie przez `#[path]` w `tests/ai_turn.rs` i `tests/terrain_movement_fix.rs`. Dlatego `use super::UnitId;` nie działa w obu harnessach. Rozwiązanie: `use civ_engine::domain::UnitId;` bezpośrednio w `ai_turn.rs` — działa w obu harnessach bez dotykania `tests/terrain_movement_fix.rs` (poza allowlistą). `tests/ai_turn.rs` pozostał nietknięty. Analogicznie `bridge.rs` (ładowany przez `#[path]` w `tests/bridge_add_player.rs`) używa `civ_engine::domain::PlayerId`.

## 2. Dowód `git grep` przed/po (pola `pub id:`)

PRZED (`1d53dcdb`):
```
ai_turn.rs:333  pub id: u64            (AiUnit)
ai_turn.rs:390  pub id: u64            (AiCity - poza zakresem)
barbarians.rs:135 pub id: u64          (BarbCamp - poza zakresem)
barbarians.rs:154 pub id: u64          (BarbCamp/inne - poza zakresem)
barbarians.rs:183 pub id: u64          (BarbUnit)
combat.rs:26    pub id: u64            (CombatUnit)
combat.rs:147   pub id: u64            (UnitCombatResult - poza zakresem)
playable.rs:285 pub id: u64            (PlayablePlayer)
playable.rs:294 pub id: u64            (PlayableCity - poza zakresem)
playable.rs:309 pub id: u64            (PlayableUnit - poza zakresem)
```

PO:
```
ai_turn.rs:334  pub id: UnitId         (AiUnit)            OK
ai_turn.rs:391  pub id: u64            (AiCity - poza zakresem)
barbarians.rs:136 pub id: u64          (poza zakresem)
barbarians.rs:155 pub id: u64          (poza zakresem)
barbarians.rs:184 pub id: UnitId       (BarbUnit)          OK
combat.rs:28    pub id: UnitId         (CombatUnit)        OK
combat.rs:149   pub id: u64            (UnitCombatResult - poza zakresem)
playable.rs:285 pub id: PlayerId       (PlayablePlayer)    OK
playable.rs:294 pub id: u64            (PlayableCity - poza zakresem)
playable.rs:309 pub id: u64            (PlayableUnit - poza zakresem)
```

## 3. Jawnie POMINIĘTE (poza zakresem dispatchu, zgodnie z regułą "nie rób połowicznie")

- `AiCity.id`, `PlayableCity.id`, `PlayableUnit.id`, `BarbCamp.id` (oba), `UnitCombatResult.id` — zachowują `u64`; nie są wymienione w binarnym kryterium (`PlayablePlayer.id`, `CombatUnit.id`) ani w zakresie `AiUnit`/`BarbUnit`.
- Komendy `AiCommand::*` i `BarbCommand::*` (`unit_id: u64`, `target_unit_id: u64`) — celowo nadal `u64` (kontrakt wyjścia planera); konwersja `.get()` na granicy.
- `OwnerRef` zamiast ujemnych `owner_id` (`BARBARIAN_OWNER_ID = -1`) — NIE zrobione: wymaga przebudowy logiki właścicieli wykraczającej poza allowlistę. Zakres przyszłej pracy.
- Brak zmiany JSON/Tauri: `UnitId`/`PlayerId` mają `#[serde(transparent)]` (`ids.rs`), więc `PlayablePlayer.id` nadal serializuje się jako liczba.

## 4. Weryfikacja

Komendy uruchomione w `rust-port/engine`:
- `cargo check --all-targets` -> 0 błędów, 0 ostrzeżeń (po ostatniej zmianie).
- `cargo test` -> wynik poniżej, kod wyjścia `EXIT=0`.

Suma `passed` ze wszystkich binariów: **256 passed, 0 failed**, zgodnie z baseline rundy 1 (256/256 przed i po). Pełny surowy log (wklejony dosłownie, z `EXIT=` z `cargo test`) poniżej.

`git diff --check`: OK (brak błędów whitespace).

## 5. Surowy log `cargo test`

```
   Compiling serde_core v1.0.229
   Compiling once_cell v1.21.4
   Compiling zmij v1.0.23
   Compiling itoa v1.0.18
   Compiling tracing-core v0.1.36
   Compiling memchr v2.8.3
   Compiling pin-project-lite v0.2.17
   Compiling tracing v0.1.44
   Compiling serde_json v1.0.154
   Compiling serde v1.0.229
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_2afc14cc-fa4-1/rust-port/engine)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 32.59s
     Running unittests src/lib.rs (target/debug/deps/civ_engine-51f74fbbb260e756)

running 6 tests
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (target/debug/deps/ai_turn-db017e6be7fe53ad)

running 11 tests
test command_wire_shape_is_stable_for_engine_integration ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/barbarians.rs (target/debug/deps/barbarians-8680d9621f033e3b)

running 10 tests
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (target/debug/deps/bridge_add_player-26e57f4f4dd2ad90)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (target/debug/deps/building_costs-77aa2ae7751914ce)

running 10 tests
test expenditure_requires_both_work_and_all_resources ... ok
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (target/debug/deps/city_growth-84dd6fe7dbd3ee97)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (target/debug/deps/combat-142da56814c62dd2)

running 7 tests
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (target/debug/deps/data_buildings_tech-353100b4e4f49bb8)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (target/debug/deps/data_civilizations-7953f8174df195c4)

running 7 tests
test civ_params_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_economy_society.rs (target/debug/deps/data_economy_society-477c63d2dae29259)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_terrain_map.rs (target/debug/deps/data_terrain_map-04dc01006b59fc78)

running 4 tests
test terrain_yields_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (target/debug/deps/data_units_combat-0313e763e428a42c)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/diplomacy.rs (target/debug/deps/diplomacy-404df144085bf375)

running 31 tests
test alliance_sweetener_ease_is_measured_in_points ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test annexation_requires_vassal_economy_orientation ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test war_currency_gate_allows_only_peace_settlements ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/events.rs (target/debug/deps/events-25a9dfe5cea709af)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (target/debug/deps/hex_terrain-67e84c733660db12)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (target/debug/deps/improvements-fe2e4fedfcd2146c)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test tile_and_production_are_json_round_trip_safe ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (target/debug/deps/map_generator-9682f2b51bf79f7d)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/parity_suite.rs (target/debug/deps/parity_suite-15533d8265bf000d)

running 11 tests
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test public_engine_wire_aliases_are_stable ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pathfinding.rs (target/debug/deps/pathfinding-7a7d43a4925c72d5)

running 8 tests
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (target/debug/deps/playable_slice-e427f078393cc877)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (target/debug/deps/recruitment-e325e184d0a3c033)

running 7 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/replay.rs (target/debug/deps/replay-877d749c73dfadea)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (target/debug/deps/resource_production-4606784593f0c310)

running 5 tests
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test multiple_layers_stack_additively_per_resource ... ok
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (target/debug/deps/rng-495fe0bf5baf8974)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (target/debug/deps/save_load-63a46e335d3a4887)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (target/debug/deps/smoke-00f117cdc1319548)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (target/debug/deps/state_dto-92f2119ef448874c)

running 10 tests
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test city_rejects_empty_names_and_zero_population ... ok
test canonical_state_round_trips_through_serde ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_unit_reference ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (target/debug/deps/steam_adapter-b54340b61f789515)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test unavailable_mock_rejects_every_steam_operation ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (target/debug/deps/terrain_movement_fix-2b008ff11fbcb912)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_crosses_desert_field ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test trade_routes_do_not_cross_tundra ... ok
test owners_land_border_ignores_tundra_neighbour ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (target/debug/deps/trade-2d5c7b3e6df41780)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test diff_and_serialization_preserve_route_contract ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (target/debug/deps/turn_economy-25b6603e37a8dcee)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test settlement_credits_income_before_paying_expenses ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test settlement_and_balances_round_trip_through_serde ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (target/debug/deps/unit_epoch-b465306a643894df)

running 5 tests
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test current_and_previous_epochs_are_available ... ok
test scout_is_available_in_every_epoch ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```
