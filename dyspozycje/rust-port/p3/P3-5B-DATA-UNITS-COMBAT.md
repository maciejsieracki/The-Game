# P3-5B — Dane jednostek i walki 1:1 (R-RUSTPORT-P3-5B-DATA-UNITS-COMBAT-Q1)

STATUS: wynik Operatora, runda 1/5.
BAZA: `9e33fc77` (dispatch). Korekta po rundzie 1: poprzedni commit `99209403` byl ulozony na `e72c74f7` (P3-5D); przeniesiono wylacznie 8 plikow P3-5B na `9e33fc77` (commit `aa54a414`).
PIN DANYCH: `gra/data/*.json` czytane na `edb8fb56`, zgodnie z dispatchem. Na HEAD zdalnym `units.json` i `civs.json` różnią się od pinu, więc kopie w tym temacie pochodzą wyłącznie z `edb8fb56`.
GŁÓWNE NIE-DOTYKANE: `rust-port/engine/src/lib.rs`, `src/domain/mod.rs`, `src/domain/recruitment.rs`, `Cargo.toml`, wszystkie istniejące `.rs`, `gra/**`.

## 1. Zakres (allowlista z dispatchu)

| Ścieżka | Status | Opis |
|---|---|---|
| `rust-port/engine/data/units.json` | NOWY | kopia 1:1 z `edb8fb56:gra/data/units.json` |
| `rust-port/engine/data/combat-params.json` | NOWY | kopia 1:1 |
| `rust-port/engine/data/terrain-combat.json` | NOWY | kopia 1:1 |
| `rust-port/engine/data/counters.json` | NOWY | kopia 1:1 |
| `rust-port/engine/data/auto-battle-params.json` | NOWY | kopia 1:1 |
| `rust-port/engine/data/power-params.json` | NOWY | kopia 1:1 |
| `rust-port/engine/src/data/units_combat.rs` | NOWY | struktury `#[derive(Deserialize)]` + `include_str!` + funkcje `parse_*` |
| `rust-port/engine/tests/data_units_combat.rs` | NOWY | 6 testów, ładowanie przez `#[path]` |
| `dyspozycje/rust-port/p3/P3-5B-DATA-UNITS-COMBAT.md` | NOWY | ten dokument |
| `dyspozycje/autobot/runs/R-RUSTPORT-P3-5B-DATA-UNITS-COMBAT-Q1/01-operator.md` | NOWY | raport etapu |

Istniejące pliki `.rs`, `Cargo.toml`, `lib.rs`, `domain/*` pozostały nietknięte. `Cargo.lock` powstał lokalnie przy buildzie (plik nie jest w repo i nie jest w allowliście), więc nie został dodany do commita.

## 2. Weryfikacja kopii 1:1

Skróty SHA-256 kopii w worktree zgadzają się z `dyspozycje/rust-port/manifest-gra-edb8fb56.sha256.tsv` dla wszystkich sześciu plików:

```text
d2f9916011c2adc151dd1df818631b4426d3df1ae9b5ca2d7c3c8f99c9a625fe  units.json            (manifest: zgodny)
5495e41eac2189045e7115e862d41a87a5190846bad90532ba81b3c1613d08c1  combat-params.json    (manifest: zgodny)
b5f0f9c5c25a65273bc674d1ae1121ab09d93141085eb0c1a9b1bc911798f9bf  terrain-combat.json   (manifest: zgodny)
e15e1d8b0e72018851fd981cb7d7c0f140e20b8b78914f788610ef4e672060e8  counters.json         (manifest: zgodny)
feedc4799f6add78106de7699434b030f2314946dbbbb67d59c357ba9f2c5eb5  auto-battle-params.json (manifest: zgodny)
158f920c2ea39afb52834ee33768d063d2f46c9829110e1f429c96cab1e7af1c  power-params.json     (manifest: zgodny)
```

## 3. Kształt danych (odczytany z faktycznej zawartości, nie z pamięci)

- `units.json`: tablica 75 rekordów, 61 unikalnych kluczy. Klucze nie są jednolite: `piercing`, `armor`, `chargeBonus` mają 50 rekordów, `wallAttack` i `siegePower` po 4. Pola `Ruch w bitwie (heksy)`, `Zasięg ataku (hex)`, `Ilość pocisków`, `Kara obrony z flanki (%)` i `Kara obrony z tyłu (%)` mieszają liczby z `"—"`, więc mają typ `IntOrText` (untagged). `Kultura`, `Surowiec`, `Uwagi`, `Utrzymanie surowiec` mogą być `null`, więc są `Option<String>`. `fieldPower` bywa `17.5`, więc jest `f64`. Każdy rekord ma `Top3` z 3 obiektami `{tytul, tekst}`.
- `combat-params.json`: 12 sekcji, zagnieżdżone obiekty z kluczami `_opis` i polem `oblężenie` (z `ę`).
- `terrain-combat.json`: tablica 7 rekordów, klucze tekstowe (w tym `Δ Zasięg (dystansowi)`).
- `counters.json`: tablica 17 reguł, 5 pól tekstowych.
- `auto-battle-params.json`: `_maciej_kroki` to lista 3 stringów, `straty` ma klucze `L_MAX` i `L_MIN` (w strukturze mapowane przez `rename`).
- `power-params.json`: 8 sekcji najwyższego poziomu. `mnoznikEpoki` ma klucze `"1".."10"` (mapowane na `ep1..ep10`). `opcje.*.wartosc` mieszają bool i string (`BoolOrText`).

Każda struktura ma `deny_unknown_fields`. Brakujący lub nieodwzorowany klucz powoduje błąd parsowania, więc test wykrywa rozjazd.

## 4. Liczby kontrolne liczone niezależnie

Test liczy rekordy z surowego `serde_json::Value` i porównuje z długością wektora po deserializacji. Nie przepisuje liczb z P2.9.

- `units`: 75 rekordów (raw = typed), 75 unikalnych nazw. Epoki: Kamień 10, Brąz 40, Żelazo 25.
- `counters`: 17 reguł (raw = typed).
- `terrain-combat`: 7 rekordów (raw = typed).

## 5. Spot-checki (wartości z plików na pinie)

| Plik | Pole | Wartość |
|---|---|---|
| units | Wojownik `Pieniądz (koszt)` / `Surowiec (ilość)` / `Surowiec` | 5 / 13 / Drewno |
| units | Wojownik `Atak` / `fieldPower` / `health` | 6 / 27 / 22 |
| units | Taran `siegePower` / `wallAttack` | 85 / 14 |
| combat-params | `macierz_v2.hit_base` / `counter_multiplier` | 35 / 1.5 |
| combat-params | `oblężenie.hill_defense_mult` / `mountain_defense_mult` | 1.5 / 1.75 |
| terrain-combat | Góry `Bonus Obrona` | +75% |
| counters | reguła [0] | Spearman → Mount, +50%, Atak, potwierdzone |
| auto-battle-params | `straty.L_MAX` / `kalibracja` | 0.42 / v2b-2026-06-30 |
| power-params | `skladniki.jednostka_wojskowa.pkt` / `kalibracja.powerOczekiwany` | 2.5 / 4655 |

Uwaga: wartość Wojownika `Pieniądz (koszt)` = 5 zgadza się z pinem `edb8fb56`. Rozjazd z `recruitment.rs` (Rust gold_cost = 10) jest znany z P2-9, nie został naprawiony i nie jest częścią tego tematu.

## 6. Surowe logi `cargo test` (wklejone z wyjscia, bez edycji)

Komenda 6a: `cargo test --test data_units_combat -- --nocapture` (w `rust-port/engine/`, CARGO_TARGET_DIR poza repo), exit 0.

```text
    Updating crates.io index
     Locking 11 packages to latest compatible versions
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.19s
     Running tests/data_units_combat.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/data_units_combat-dcacf87d73a2499c)

running 6 tests
SPOT auto-battle kalibracja=v2b-2026-06-30 L_MAX=0.42 p_atk=1.2 kroki=3
SPOT combat macierz_v2.hit_base=35 counter_multiplier=1.5 oblezenie.hill_defense_mult=1.5
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
SPOT counters rules=17 [0]=Spearman->Mount +50% Atak potwierdzone
SPOT power jednostka_wojskowa.pkt=2.5 powerOczekiwany=4655 tech_zbadane.pkt=80 mnoznik.ep10=1
test counters_parses_and_spot_checks ... ok
SPOT terrain-combat rows=7 gory.bonus_obrona=+75% gory.kawaleria=NIEDOSTĘPNE dla kawalerii/rydwanów
test power_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
SPOT units count=75 epoki Kamien=10 Braz=40 Zelazo=25
SPOT units[0]=Wojownik koszt=5 surowiec=Some("Drewno") ilosc=13 atak=6 fieldPower=27 health=22
SPOT Taran siege_power=Some(85) wall_attack=Some(14)
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
```

Komenda 6b: `cargo test` (pelna regresja w `rust-port/engine/`), exit 0.

```text
    Updating crates.io index
     Locking 11 packages to latest compatible versions
   Compiling proc-macro2 v1.0.107
   Compiling quote v1.0.47
   Compiling unicode-ident v1.0.27
   Compiling serde_core v1.0.229
   Compiling serde v1.0.229
   Compiling zmij v1.0.23
   Compiling serde_json v1.0.154
   Compiling itoa v1.0.18
   Compiling memchr v2.8.3
   Compiling syn v3.0.9
   Compiling serde_derive v1.0.229
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_9c66e929-2a9-3/rust-port/engine)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 20.48s
     Running unittests src/lib.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/civ_engine-de89a0b561326326)

running 6 tests
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/ai_turn.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/ai_turn-c4ba3e92de2c614c)

running 11 tests
test command_wire_shape_is_stable_for_engine_integration ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/barbarians.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/barbarians-0166d498ef101ab9)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/building_costs-dc6adc0776550f82)

running 10 tests
test expenditure_requires_both_work_and_all_resources ... ok
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/city_growth-5b812caebcb8c44b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/combat-7450beb1d96b43b5)

running 7 tests
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test resolver_is_order_independent_and_preserves_ids ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/data_units_combat-dcacf87d73a2499c)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/diplomacy.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/diplomacy-db342142fcf54c79)

running 31 tests
test alliance_sweetener_ease_is_measured_in_points ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test annexation_requires_vassal_economy_orientation ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test war_currency_gate_allows_only_peace_settlements ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/events.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/events-d051ed4c73f01115)

running 6 tests
test built_in_events_map_to_their_responsible_phases ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/hex_terrain-ac25b11cd43ad50b)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test root_reexports_are_the_same_production_api_types ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/improvements-feef2a310e7f5743)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test tile_and_production_are_json_round_trip_safe ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/map_generator-d97b0d52e929f315)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/parity_suite.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/parity_suite-3f23dcd0798ba1b3)

running 11 tests
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test public_engine_wire_aliases_are_stable ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pathfinding.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/pathfinding-20255fc7d54a8bf0)

running 8 tests
test impassable_destination_is_allowed_as_the_final_step ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/playable_slice-decc2bffb16b96ce)

running 7 tests
test create_session_is_deterministic_and_contains_playable_entities ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/recruitment-ed6fc64b394f5f7a)

running 7 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/replay.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/replay-37791583bfa35343)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/resource_production-2a207b4cee285b3a)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test multiple_layers_stack_additively_per_resource ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/rng-07ae606b76889ad1)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/save_load-8fdd689a416ebb26)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/smoke-a000a36cd0edff05)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/state_dto-d873854f878490a2)

running 10 tests
test city_rejects_empty_names_and_zero_population ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test canonical_state_round_trips_through_serde ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_unknown_unit_reference ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/steam_adapter-cd34f5f388a80d04)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test unavailable_mock_rejects_every_steam_operation ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/terrain_movement_fix-5bb409984226ee38)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_crosses_desert_field ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test trade_routes_do_not_cross_tundra ... ok
test owners_land_border_ignores_tundra_neighbour ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/trade-1fb3ec9a06e93b19)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test diff_and_serialization_preserve_route_contract ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/turn_economy-324dccea5c53b9b5)

running 7 tests
test resource_costs_are_paid_independently_and_never_underflow ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test flow_helpers_are_deterministic_and_saturating ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test settlement_credits_income_before_paying_expenses ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test settlement_and_balances_round_trip_through_serde ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target-5b/debug/deps/unit_epoch-2be4375d2ce96ed5)

running 5 tests
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test scout_is_available_in_every_epoch ... ok
test current_and_previous_epochs_are_available ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

## 7. Blokady i uwagi

- Brak blokad na wykonaniu zadania.
- Baza zgodna z dispatchem: `9e33fc77`. Galaz operatora `op-R-RUSTPORT-P3-5B-DATA-UNITS-COMBAT-Q1` (commit `99209403`) zastapiona commitem `aa54a414` na bazie `9e33fc77`.
- Źródłowe pliki P2-9 i P3-1-2 istnieją w głównym checkoutcie, ale nie są śledzone na `parity-v2`. Użyto ich jako kontekstu tylko do odczytu.
- `Cargo.toml` nie zmieniano. `serde_json` jest dev-dependency, a parsery są ładowane wyłącznie przez `#[path]` w teście, tak jak w P3-5D.
- Rozjazd `units.json` ↔ `recruitment.rs` (P2-9) pozostaje nierozwiązany, zgodnie z zakazem w dispatchu.

## 8. Dodatkowe ryzyka do konsolidacji (poza tym tematem)

- `units.json` na HEAD zdalnym różni się od pinu `edb8fb56` (wartości jednostek w `civs.json` i `units.json` zmieniły się). Konsolidacja musi wskazać, który pin obowiązuje.
- Struktury mają `IntOrText` i `Option` tam, gdzie dane są niejednorodne. Późniejsze użycie w domenie powinno je zawęzić, a nie zmieniać kopie JSON.
