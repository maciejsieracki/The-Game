# P3-15 — round-trip 1:1 danych (29/29 plików) — R-RUSTPORT-P3-15-DATA-ROUNDTRIP-Q1

**Status:** wykonanie Operatora, runda 1/5. Nie jest to werdykt Evaluatora ani integracja.
**Baza:** `origin/rust-port/parity-v2` = `aa7b225b` (P3.14), potwierdzone przez `git merge-base --is-ancestor`.
**Worktree:** detached HEAD, bez push. Commit: patrz `01-operator-report.md` w katalogu runu.

## 1. Cel i luka z P3.11

P3.11 (`P3-11-DATA-COMPLIANCE.md` §6) zostawił lukę: test „sparsowane struktury -> `serde_json::Value` == surowy JSON”
działał tylko dla 7 plików cywilizacji, bo jedynie `civilizations.rs` miał `Serialize`. Ten temat:

1. dodaje `Serialize` do struktur w `buildings_tech.rs`, `economy_society.rs`, `economy_society_part2.rs`, `terrain_map.rs`, `units_combat.rs`
   (zmiana tylko w derive/`use`; nazwy pól, typy i atrybuty `rename` bez zmian);
2. dopisuje round-trip dla WSZYSTKICH 29 plików `rust-port/engine/data/*.json` (`tests/data_compliance.rs`, makro `roundtrip_cases!`
   + test `roundtrip_covers_all_29_data_files`, który wymusza równość zbioru z `DATA_FILES` loadera P3.12);
3. wykrywa pola gubione cicho (porównanie rekurencyjne: klucz obecny w surowym JSON, a nieobecny po round-tripie = BŁĄD);
4. dodaje `#[serde(deny_unknown_fields)]` do 80 struktur w trzech modułach, które go nie miały (`buildings_tech`, `economy_society`,
   `economy_society_part2`). Podstawa bezpieczeństwa: round-trip nie wykazał ANI JEDNEGO pola obecnego w pliku, a nieobsłużonego
   przez struktury (zerowe „GUBIONE” w 29 plikach), więc deny nie odrzuca żadnego z plików produkcyjnych.

## 2. Wynik — binarne kryterium

| Kryterium | Wynik |
|---|---|
| Round-trip 29/29 bez `#[ignore]` | TAK — 29/29 zielonych, 0 błędów (patrz §4) |
| `cargo test --offline` EXIT=0 | TAK — `EXIT=0` (log §6.2) |
| Liczba testów > baseline | TAK — 292 → 322 passed (+30 = 29 round-trip + 1 test pokrycia) |
| Żaden istniejący test nie zniknął | TAK — porównanie list nazw testów baseline vs final: 0 brakujących |
| `rustfmt --check` czysty na zmienionych plikach | TAK — exit 0 (po sformatowaniu `tests/data_compliance.rs`, patrz §5) |
| Surowy log w tym dokumencie | TAK — §6 (pełne wyjścia, nie wyciągi) |

## 3. Zmiany (allowlista)

- `rust-port/engine/src/data/buildings_tech.rs` — `Serialize` + `deny_unknown_fields` (25 struktur).
- `rust-port/engine/src/data/economy_society.rs` — `Serialize` + `deny_unknown_fields` (33 struktury).
- `rust-port/engine/src/data/economy_society_part2.rs` — `Serialize` + `deny_unknown_fields` (22 struktury).
- `rust-port/engine/src/data/terrain_map.rs` — `Serialize` (struktury już miały `deny_unknown_fields`).
- `rust-port/engine/src/data/units_combat.rs` — `Serialize` (struktury już miały `deny_unknown_fields`).
- `rust-port/engine/tests/data_compliance.rs` — tylko dopisane testy round-trip + reformat (patrz §5).
- `dyspozycje/rust-port/p3/P3-15-DATA-ROUNDTRIP.md` (ten dokument).
- `dyspozycje/autobot/runs/R-RUSTPORT-P3-15-DATA-ROUNDTRIP-Q1/01-operator-report.md`.

Poza allowlistą nie zmieniano: `domain/**`, `bridge.rs`, `loader.rs`, `mod.rs`, `Cargo.toml`, `lib.rs`, `gra/**`.
`Cargo.lock` powstał lokalnie przy budowie i NIE jest dodany do commita.

## 4. Round-trip — dowody per plik

Porównanie: `load_file::<T>(data/, plik)` (loader P3.12, te same typy co `data::*`) → `serde_json::to_value` → porównanie
z `serde_json::Value` surowego pliku. Źródło liczb: `evidence-roundtrip` (§6.3), uruchomienie `--nocapture`, z własnego przebiegu.

Normalizacje, jawnie liczone (żadna nie maskuje utraty danych):

- **N1** — klucz BRAK w surowym JSON, a `null` po round-tripie. Zgodnie z doc-komentarzem `buildings_tech.rs` (brak klucza albo `null` → `None`)
  to ta sama wartość `None`. Serializacja `Option` bez `skip_serializing_if` emituje `null`. Nie usunięto: surowe pliki
  zawierają `null` jawnie (tech, units, terrain-improvements, civs, diplomacy, terrain-yields), więc globalne `skip_serializing_if`
  zmieniłoby wynik dla tych kluczy; poprawka wymagałaby osobnej decyzji per pole.
- **N2** — ta sama wartość liczbowa, inna reprezentacja: JSON `5` vs `5.0` (pole `f64`). Nie zmieniano typów pól (zakaz zmiany typów).

Bledy (GUBIONE / DODANE niebędące `null` / różna wartość / różna długość tablicy) = **0 we wszystkich 29 plikach**.

| Plik | Test | Błędy | N1 (null za brakiem) | N2 (int vs float) |
|---|---|---|---|---|
| ai-params.json | rt_ai_params | 0 | 0 | 0 |
| auto-battle-params.json | rt_auto_battle_params | 0 | 0 | 0 |
| buildings.json | rt_buildings | 0 | 277 | 0 |
| citizen-resource-upkeep.json | rt_citizen_resource_upkeep | 0 | 0 | 0 |
| city-names-pools.json | rt_city_names_pools | 0 | 0 | 0 |
| civ-ai.json | rt_civ_ai | 0 | 0 | 0 |
| civ-matrix.json | rt_civ_matrix | 0 | 0 | 0 |
| civ-params.json | rt_civ_params | 0 | 0 | 0 |
| civs.json | rt_civs | 0 | 0 | 0 |
| combat-params.json | rt_combat_params | 0 | 0 | 0 |
| counters.json | rt_counters | 0 | 0 | 0 |
| diplomacy-acceptance-points.json | rt_diplomacy_acceptance_points | 0 | 0 | 0 |
| diplomacy.json | rt_diplomacy | 0 | 0 | 0 |
| e-start-params.json | rt_e_start_params | 0 | 0 | 0 |
| econ-params.json | rt_econ_params | 0 | 0 | 0 |
| epoka-ludnosc-manpower.json | rt_epoka_ludnosc_manpower | 0 | 0 | 0 |
| map-gen-params.json | rt_map_gen_params | 0 | 4 | 1 |
| miasto-params.json | rt_miasto_params | 0 | 0 | 0 |
| power-params.json | rt_power_params | 0 | 9 | 8 |
| resources.json | rt_resources | 0 | 0 | 0 |
| society-params.json | rt_society_params | 0 | 0 | 0 |
| tech.json | rt_tech | 0 | 61 | 0 |
| terrain-combat.json | rt_terrain_combat | 0 | 0 | 0 |
| terrain-improvements.json | rt_terrain_improvements | 0 | 375 | 21 |
| terrain-movement.json | rt_terrain_movement | 0 | 0 | 0 |
| terrain-yields.json | rt_terrain_yields | 0 | 0 | 0 |
| ui-params.json | rt_ui_params | 0 | 0 | 0 |
| units.json | rt_units | 0 | 217 | 52 |
| wonders.json | rt_wonders | 0 | 247 | 38 |

Pokrycie: `roundtrip_covers_all_29_data_files` — zbiór nazw testów == `DATA_FILES` (29), bez duplikatów. Zero `#[ignore]`.

## 5. Uwagi do zakresu

- **Formatowanie `tests/data_compliance.rs`.** Plik nie był czysty względem `rustfmt` już przed tematem (P3.14 poprawił tylko `src/data`).
  Kryterium „rustfmt --check czysty na zmienionych plikach” wymagało sformatowania całego pliku. Efekt: +609 / −45 linii;
  usunięte linie to przeformatowania istniejących wierszy (łamanie długich list i asercji), bez zmiany tokenów ani nazw testów.
  Potwierdzenie: lista nazw testów baseline ⊆ final (0 brakujących), wszystkie testy zielone. To ustalenie do oceny przez Evaluatora.
- **Istniejące testy** nie zostały osłabione ani usunięte; nie dodano `#[ignore]`.
- **Współdzielony `CARGO_TARGET_DIR`.** Przy budowie w `/home/user/cargo-target-shared` (wspólny katalog) kompilacja `civ-engine`
  z tego worktree dawała błąd „brak `Serialize`” mimo poprawnego źródła: artefakty innej sesji były świeże wg mtime.
  Z tego powodu pomiary wykonano w podkatalogu `/home/user/cargo-target-shared/wf_74ebccc7-56b-1` (ten sam dysk, izolacja artefaktów).
  Baseline (292) zmierzono przed zmianami w katalogu głównym `cargo-target-shared`.
- **Poza zakresem (nie ruszano):** P3.16 (`tests/data_{buildings_tech,civilizations,economy_society,units_combat}.rs`, `loader.rs`-fmt, `bridge.rs`).

## 6. Surowe logi (pełne wyjścia, bez skracania)

### 6.1 Baseline — cargo test --offline przed zmianami (aa7b225b)

```text
     Locking 17 packages to latest compatible versions
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_74ebccc7-56b-1/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 24.05s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 11 tests
test civilian_units_do_not_receive_combat_orders ... ok
test command_wire_shape_is_stable_for_engine_integration ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test wounded_units_retreat_before_attacking ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test byte_sums_per_category_match_p1_11 ... ok
test counts_per_extension_match_p1_11 ... ok
test manifest_dest_paths_are_unique ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_size ... ok
test negative_validator_rejects_wrong_sha ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test sha1_matches_known_vectors ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.58s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test camp_destruction_removes_only_the_entered_camp ... ok
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/debug/deps/combat-7737db4785daf590)

running 7 tests
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_ai_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/debug/deps/data_compliance-bce92961776df717)

running 9 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test embedded_raw_counts_match_web_pin ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok
test collection_id_sets_match_web_pin ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test collection_counts_match_web_pin ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_ai_params_parses_and_spot_checks ... ok
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_missing_file_is_file_missing ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_unreadable_file_is_io ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.41s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test map_gen_params_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/debug/deps/diplomacy-d94c0845f92f376e)

running 31 tests
test alliance_sweetener_ease_is_measured_in_points ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test annexation_requires_vassal_economy_orientation ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test war_currency_gate_allows_only_peace_settlements ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/events.rs (/home/user/cargo-target-shared/debug/deps/events-987aa8790b10a253)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test tile_and_production_are_json_round_trip_safe ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test non_food_upgrade_dependencies_are_preserved ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test public_engine_wire_aliases_are_stable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/debug/deps/recruitment-10fa19ca5709d7f0)

running 7 tests
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/replay.rs (/home/user/cargo-target-shared/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok
test multiple_layers_stack_additively_per_resource ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test canonical_state_round_trips_through_serde ... ok
test city_rejects_empty_names_and_zero_population ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test unavailable_mock_rejects_every_steam_operation ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_crosses_desert_field ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test diff_and_serialization_preserve_route_contract ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test settlement_credits_income_before_paying_expenses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/debug/deps/unit_epoch-c52a04b91f6d1f56)

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

### 6.2 Final — cargo test --offline po zmianach (cały pakiet)

```text
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_74ebccc7-56b-1/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 11.83s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 11 tests
test civilian_units_do_not_receive_combat_orders ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test command_wire_shape_is_stable_for_engine_integration ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test byte_sums_per_category_match_p1_11 ... ok
test counts_per_extension_match_p1_11 ... ok
test manifest_dest_paths_are_unique ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_size ... ok
test negative_validator_rejects_wrong_sha ... ok
test sha1_matches_known_vectors ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.64s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test camp_destruction_removes_only_the_entered_camp ... ok
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/combat-7737db4785daf590)

running 7 tests
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test resolver_is_order_independent_and_preserves_ids ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_ai_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/data_compliance-bce92961776df717)

running 39 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test collection_id_sets_match_web_pin ... ok
test rt_auto_battle_params ... ok
test rt_ai_params ... ok
test rt_citizen_resource_upkeep ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_civ_ai ... ok
test rt_city_names_pools ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test rt_civ_params ... ok
test rt_combat_params ... ok
test rt_counters ... ok
test rt_buildings ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_civs ... ok
test rt_civ_matrix ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_e_start_params ... ok
test rt_map_gen_params ... ok
test rt_miasto_params ... ok
test rt_diplomacy ... ok
test rt_power_params ... ok
test rt_resources ... ok
test rt_terrain_combat ... ok
test rt_econ_params ... ok
test rt_terrain_movement ... ok
test rt_tech ... ok
test rt_terrain_yields ... ok
test rt_ui_params ... ok
test rt_society_params ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test rt_terrain_improvements ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_wonders ... ok
test rt_units ... ok

test result: ok. 39 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/data_loader-4b1b0c97d63f2050)

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

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.31s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test terrain_yields_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/diplomacy-d94c0845f92f376e)

running 31 tests
test alliance_sweetener_ease_is_measured_in_points ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test annexation_requires_vassal_economy_orientation ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test war_currency_gate_allows_only_peace_settlements ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/events-987aa8790b10a253)

running 8 tests
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test built_in_events_map_to_their_responsible_phases ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_can_coexist_with_non_food_layers ... ok
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test tile_and_production_are_json_round_trip_safe ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test river_markers_are_land_and_reach_water ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test public_engine_wire_aliases_are_stable ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test impassable_destination_is_allowed_as_the_final_step ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/recruitment-10fa19ca5709d7f0)

running 7 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test multiple_layers_stack_additively_per_resource ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test city_rejects_empty_names_and_zero_population ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test canonical_state_round_trips_through_serde ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test unavailable_mock_rejects_every_steam_operation ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_crosses_desert_field ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test diff_and_serialization_preserve_route_contract ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test settlement_credits_income_before_paying_expenses ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 5 tests
test current_and_previous_epochs_are_available ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok
test scout_is_available_in_every_epoch ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

### 6.3 Dowody per plik — cargo test --test data_compliance -- --nocapture --test-threads=1

```text
    Finished `test` profile [unoptimized] target(s) in 0.02s
     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_74ebccc7-56b-1/debug/deps/data_compliance-bce92961776df717)

running 39 tests
test all_29_data_files_parse_with_rust_modules ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test civs_count_and_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test collection_id_sets_match_web_pin ... ok
test embedded_raw_counts_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test rt_ai_params ... P3-15 ai-params.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_auto_battle_params ... P3-15 auto-battle-params.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_buildings ... P3-15 buildings.json: bledy=0 N1(null-za-brakiem)=277 N2(int-vs-float)=0
ok
test rt_citizen_resource_upkeep ... P3-15 citizen-resource-upkeep.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_city_names_pools ... P3-15 city-names-pools.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_civ_ai ... P3-15 civ-ai.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_civ_matrix ... P3-15 civ-matrix.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_civ_params ... P3-15 civ-params.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_civs ... P3-15 civs.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_combat_params ... P3-15 combat-params.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_counters ... P3-15 counters.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_diplomacy ... P3-15 diplomacy.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_diplomacy_acceptance_points ... P3-15 diplomacy-acceptance-points.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_e_start_params ... P3-15 e-start-params.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_econ_params ... P3-15 econ-params.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_epoka_ludnosc_manpower ... P3-15 epoka-ludnosc-manpower.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_map_gen_params ... P3-15 map-gen-params.json: bledy=0 N1(null-za-brakiem)=4 N2(int-vs-float)=1
ok
test rt_miasto_params ... P3-15 miasto-params.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_power_params ... P3-15 power-params.json: bledy=0 N1(null-za-brakiem)=9 N2(int-vs-float)=8
ok
test rt_resources ... P3-15 resources.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_society_params ... P3-15 society-params.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_tech ... P3-15 tech.json: bledy=0 N1(null-za-brakiem)=61 N2(int-vs-float)=0
ok
test rt_terrain_combat ... P3-15 terrain-combat.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_terrain_improvements ... P3-15 terrain-improvements.json: bledy=0 N1(null-za-brakiem)=375 N2(int-vs-float)=21
ok
test rt_terrain_movement ... P3-15 terrain-movement.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_terrain_yields ... P3-15 terrain-yields.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_ui_params ... P3-15 ui-params.json: bledy=0 N1(null-za-brakiem)=0 N2(int-vs-float)=0
ok
test rt_units ... P3-15 units.json: bledy=0 N1(null-za-brakiem)=217 N2(int-vs-float)=52
ok
test rt_wonders ... P3-15 wonders.json: bledy=0 N1(null-za-brakiem)=247 N2(int-vs-float)=38
ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok

test result: ok. 39 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.11s

EXIT=0
```
