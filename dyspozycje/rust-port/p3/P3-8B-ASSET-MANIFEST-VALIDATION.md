# P3.8B — Trwała walidacja manifestu assetów (`rust-port/assets/MANIFEST.tsv`)

**Temat:** R-RUSTPORT-P3-8B-ASSET-MANIFEST-VALIDATION-Q1 · **Domena:** GAME · **Runda:** 2/5 (Operator, poprawka po FAIL Evaluatora z tym samym ID)
**Baza:** `origin/rust-port/parity-v2` @ `1d53dcdb` (P3.8), detached HEAD; baza zawiera `rust-port/assets/MANIFEST.tsv` (429 linii = nagłówek + 428).
**Cel (GOAL):** bramka P3 „manifest assetów przechodzi walidację wobec web”. Jednorazowa weryfikacja P3.8 (428/428, blob-hash) zostaje zamieniona w trwały, powtarzalny test `rust-port/engine/tests/assets_manifest.rs`.

## Zakres

- Nowy plik: `rust-port/engine/tests/assets_manifest.rs` (13 testów).
- Nowy dokument: `dyspozycje/rust-port/p3/P3-8B-ASSET-MANIFEST-VALIDATION.md` (ten plik).
- Raport etapu: `dyspozycje/autobot/runs/R-RUSTPORT-P3-8B-ASSET-MANIFEST-VALIDATION-Q1/01-operator.md`.
- Zero zmian w `src/**`, `Cargo.toml`, `rust-port/assets/**`, `gra/**`. Bez nowych zależności (SHA-1 zaimplementowane ręcznie, walk przez `std::fs`).
- `Cargo.lock` i `target/` nie są commitowane.

## Odpowiedź na zarzuty Evaluatora (runda 2)

| # | Zarzut | Decyzja | Poprawka / dowód |
|---|---|---|---|
| 1 | Brak pełnego surowego logu `cargo test --offline` w dokumencie | PRZYJMUJĘ | Pełne logi (baseline, test docelowy, pełny przebieg po zmianie) wklejone dosłownie w sekcji „Surowe logi” poniżej, z `EXIT=` z `echo`. |
| 2 | Baseline bez surowego logu | PRZYJMUJĘ | Baseline przebiegnięty ponownie na `1d53dcdb` (`cargo test --offline`), log w sekcji „Surowe logi”: 256 passed, EXIT=0. |
| 3 | Fałszywe zdanie o kontroli pozytywnej w testach 9–13 | PRZYJMUJĘ | Dodano asercję kontrolną (prawdziwe wpisy przechodzą) w testach 10 (`negative_validator_rejects_missing_file`), 11 (`negative_validator_rejects_duplicate_dest`) i 13 (`negative_parser_rejects_bad_header_and_columns`, prawdziwy manifest parsuje się). Test 9 i 12 miały kontrolę już wcześniej. Zdanie w sekcji „Co sprawdzają testy” jest teraz prawdziwe. |
| 4 | Komentarz parsera nie zgadza się z kodem (`continue` pomijał każdą pustą linię) | PRZYJMUJĘ | Kod poprawiony: parser zdejmuje jeden końcowy `\n` (`strip_suffix`), a każda pusta linia w środku daje błąd `pusta linia`. Dodano asercję w teście 13 (`blank_mid`). Komentarz zgadza się z kodem. |
| 5 | Opis cache `debug/incremental` jako „własny” jest nieprawdziwy | PRZYJMUJĘ | Katalog `/home/user/cargo-target-shared` jest współdzielony z innymi tematami (dispatch). Usunięcie `debug/incremental` w rundzie 1 nie było usunięciem wyłącznie własnego cache'u. Nie wykonano żadnego dalszego usuwania w rundzie 2. Wpływu na równoległe przebiegi nie zbadano; najwyżej mogły one przebudować cache inkrementalny. Zob. „Ograniczenia i uczciwość”. |
| 6 | Blokada dyskowa bez dowodu (`/` 99–100%, 376 MB) | PRZYJMUJĘ | Twierdzenie o 99–100% i o 376 MB usunięto jako niepotwierdzone. Podano `df -h /` z chwil przebiegów rundy 2 (zob. „Dysk”). Blokada w rundzie 2 nie wystąpiła (3 przebiegi EXIT=0). |
| 7 | Weryfikacja Python `hashlib` opisana bez skryptu i wyniku | PRZYJMUJĘ | Skrypt i wynik w sekcji „Niezależna weryfikacja Python” poniżej (uruchomiony `python3 -I`). |

## Co sprawdzają testy

| # | Test | Co weryfikuje |
|---|---|---|
| 1 | `manifest_has_header_and_428_data_rows` | nagłówek `blob_sha_edb8fb56 size_bytes source_web_path dest_rust_port_path`; 428 wierszy danych |
| 2 | `manifest_dest_paths_are_unique` | unikalność ścieżek docelowych, prefiks `rust-port/assets/` |
| 3 | `every_manifest_entry_exists_with_declared_size` | każda ścieżka istnieje, rozmiar w bajtach == kolumna rozmiaru |
| 4 | `every_entry_blob_sha1_matches_manifest_column` | `sha1("blob <len>\0" + bajty)` == kolumna SHA (428/428) |
| 5 | `no_files_outside_manifest_in_assets_dir` | rekurencyjny spacer: na dysku dokładnie 428 plików + `MANIFEST.tsv` |
| 6 | `counts_per_extension_match_p1_11` | svg 307, json 8, css 4, jpg 45, png 2, mp3 62 |
| 7 | `byte_sums_per_category_match_p1_11` | kategorie i sumy bajtów zgodne z P1.11 §2 (patrz niżej) |
| 8 | `sha1_matches_known_vectors` | samotest implementacji SHA-1 (wektory FIPS 180-4, `git blob` pustego pliku) |
| 9 | `negative_validator_rejects_wrong_size` | mutacja: zły rozmiar → dokładnie 1 błąd (kontrola: prawdziwe wpisy przechodzą) |
| 10 | `negative_validator_rejects_missing_file` | mutacja: brakujący plik → dokładnie 1 błąd (kontrola: prawdziwe wpisy przechodzą) |
| 11 | `negative_validator_rejects_duplicate_dest` | mutacja: duplikat ścieżki → dokładnie 1 błąd (kontrola: prawdziwe wpisy przechodzą) |
| 12 | `negative_validator_rejects_wrong_sha` | mutacja: zły SHA → dokładnie 1 błąd (kontrola: prawdziwe SHA przechodzą) |
| 13 | `negative_parser_rejects_bad_header_and_columns` | kontrola: prawdziwy manifest parsuje się; odrzucane: zły nagłówek, wiersz z 3 kolumnami, pusta linia w środku |

Testy negatywne 9–13 mają kontrolę pozytywną w tym samym teście: najpierw asercja, że prawdziwe dane przechodzą, dopiero potem mutacja i asercja odrzucenia (dokładnie 1 błąd w testach 9–12, odrzucenie w teście 13). Walidator nie jest więc „zawsze zielony” ani „zawsze czerwony”.

Parser (`parse_manifest`) jest ścisły: dopuszcza wyłącznie jeden końcowy `\n`; każda pusta linia w innym miejscu jest błędem.

## Źródła liczb (weryfikacja, nie przepisywanie)

Liczby w teście pochodzą z `dyspozycje/rust-port/p1/P1-11-ASSET-CATALOG.md` (katalog na gałęzi dokumentacyjnej `claude/sprawdzenie-funkcjonalnosci-ek4ra0`), §2 „Kategorie — pliki, liczba, rozmiar” — tabela w wierszach 26–32 pliku (`grep -n '^| '`: wiersz 26 = ikony SVG, 27 = JSON/CSS, 28 = portrety JPG, 29 = hero PNG, 31 = muzyka aktywna, 32 = muzyka wykluczona):

| Kategoria w teście | Wiersz §2 | Pliki | Bajty |
|---|---|---:|---:|
| icons (SVG 307 + JSON 8 + CSS 4) | wiersz 26 (SVG 108 231 B) + wiersz 27 (JSON/CSS 27 945 B) | 319 | 136 176 |
| portraits (JPG) | wiersz 28 | 45 | 445 951 |
| hero (PNG) | wiersz 29 | 2 | 4 214 674 |
| music (MP3 aktywne 59 + wykluczone 3) | wiersz 31 (42 350 853 B) + wiersz 32 (2 233 830 B) | 62 | 44 584 683 |

Suma 428 = 307 + 12 + 45 + 2 + 62; §2 podaje 441 plików, z czego 10 `.ts` i 3 `README.md` nie są assetami runtime (poza zakresem manifestu). Cztery kategorie są wyczerpujące: fonty, modele 3D i SFX jako pliki mają 0 wpisów (P1.11 §5), co test 7 sprawdza przez `sums.len() == 4`.

Niezależna weryfikacja (skrypt Python `hashlib`, poza repo; pełny skrypt i wynik w sekcji „Niezależna weryfikacja Python”): 428/428 SHA zgodne, 428/428 rozmiary zgodne, ścieżki unikalne, 0 plików dodatkowych, 0 brakujących. Dodatkowo `git hash-object rust-port/assets/icons/brand/units/unit-worker.svg` = `5437e0d4…` = `git rev-parse 1d53dcdb:rust-port/assets/icons/brand/units/unit-worker.svg` (runda 1).

## Wynik

- Rozbieżności manifestu wobec katalogu: **brak**. Test 7 nie wykrył odchyleń; nic w `rust-port/assets/**` nie zostało zmienione.
- Baseline (przed zmianą, `origin/rust-port/parity-v2` @ `1d53dcdb`): **256 passed**, 0 failed, EXIT=0 (33 wyniki binariów testowych).
- Test docelowy `--test assets_manifest`: **13 passed**, 0 failed, EXIT=0.
- Po zmianie, pełny `cargo test --offline`: **269 passed** (256 + 13), 0 failed, EXIT=0 (34 wyniki binariów testowych, +1 = `assets_manifest`).
- Liczba przypadków: 256 (baseline) + 13 (nowy plik) = 269; liczba wyników binariów testowych wzrosła z 33 do 34. Żaden istniejący test nie został usunięty (zmieniono tylko `src` testu nowego pliku; pliki testów z baseline nie są modyfikowane, co potwierdza allowlista commita).

## Surowe logi

Wszystkie logi poniżej są dosłownym wyjściem terminala (`... ; echo "EXIT=$?"`), bez skracania. Komendy uruchamiane z katalogu `rust-port/engine` w worktree.

### Log 1 — baseline przed zmianą (`1d53dcdb`, bez pliku testu)

Komenda: `CARGO_TARGET_DIR=/home/user/cargo-target-shared CARGO_PROFILE_DEV_DEBUG=0 cargo test --offline; echo "EXIT=$?"`

```text
     Locking 17 packages to latest compatible versions
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_046df4f4-30a-3/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 31.67s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/debug/deps/civ_engine-156fa2cbdb245699)

running 6 tests
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/debug/deps/ai_turn-460bd39386ba4492)

running 11 tests
test civilian_units_do_not_receive_combat_orders ... ok
test command_wire_shape_is_stable_for_engine_integration ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/debug/deps/barbarians-7b24174c71ef0810)

running 10 tests
test camp_destruction_removes_only_the_entered_camp ... ok
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/debug/deps/bridge_add_player-ce1fd490dcb6a6f7)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/debug/deps/building_costs-4e7b3f7f250c8e49)

running 10 tests
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/debug/deps/city_growth-87094e53345404d1)

running 10 tests
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/debug/deps/combat-8773259014f09ec4)

running 7 tests
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test resolver_is_order_independent_and_preserves_ids ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/debug/deps/data_buildings_tech-1eb960ab77463cfc)

running 3 tests
test wonders_json_parses ... ok
test tech_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/debug/deps/data_civilizations-300ddd088ca4bc5c)

running 7 tests
test city_names_pools_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/debug/deps/data_economy_society-b9e1ae6c4bdc55fe)

running 9 tests
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/debug/deps/data_terrain_map-6d38082c499fa4b3)

running 4 tests
test terrain_improvements_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok
test map_gen_params_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/debug/deps/data_units_combat-b54740944ce06b47)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/debug/deps/diplomacy-a46955b4c2b0a9d5)

running 31 tests
test alliance_uses_configured_hegemon_threshold ... ok
test annexation_requires_vassal_economy_orientation ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test war_currency_gate_allows_only_peace_settlements ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/events.rs (/home/user/cargo-target-shared/debug/deps/events-535ca09a3b1ee21b)

running 8 tests
test canonical_turn_phases_are_explicit_and_stable ... ok
test built_in_events_map_to_their_responsible_phases ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/debug/deps/hex_terrain-85cee3c09d9848a8)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test root_reexports_are_the_same_production_api_types ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/debug/deps/improvements-497489be4706b2cf)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
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
test canonical_state_dto_vector_round_trips_through_json ... ok
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test public_engine_wire_aliases_are_stable ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/debug/deps/pathfinding-09cc5ba754d92fd8)

running 8 tests
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test unreachable_and_missing_fields_are_rejected ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/debug/deps/playable_slice-6681ee9c12cdedff)

running 7 tests
test create_session_is_deterministic_and_contains_playable_entities ... ok
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/debug/deps/recruitment-5c88a67799e710fe)

running 7 tests
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/replay.rs (/home/user/cargo-target-shared/debug/deps/replay-84c09d3c9b07abea)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/debug/deps/resource_production-e15db088bc4423ba)

running 5 tests
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test multiple_layers_stack_additively_per_resource ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/debug/deps/rng-076a121dccbd1840)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/debug/deps/save_load-c4f6a0697b26bba2)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/debug/deps/smoke-9d4e55401cce65c1)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/debug/deps/state_dto-c23b7ef4d84127e0)

running 10 tests
test city_rejects_empty_names_and_zero_population ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test canonical_state_round_trips_through_serde ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_unknown_unit_reference ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/debug/deps/steam_adapter-80ddf19e002e6c87)

running 5 tests
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test unavailable_mock_rejects_every_steam_operation ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/debug/deps/terrain_movement_fix-64f077198837c9ca)

running 9 tests
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test land_route_bfs_crosses_desert_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/debug/deps/trade-81c7127e60dee23e)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test diff_and_serialization_preserve_route_contract ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/debug/deps/turn_economy-761cb7e9305a13f4)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test settlement_credits_income_before_paying_expenses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/debug/deps/unit_epoch-72c883f5b31d50a1)

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


### Log 2 — test docelowy po zmianie (`0aec339d` + poprawka rundy 2)

Komenda: `CARGO_TARGET_DIR=/home/user/cargo-target-shared CARGO_PROFILE_DEV_DEBUG=0 cargo test --offline --test assets_manifest; echo "EXIT=$?"`

```text
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_046df4f4-30a-3/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 0.60s
     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/debug/deps/assets_manifest-547aecae805379df)

running 13 tests
test counts_per_extension_match_p1_11 ... ok
test byte_sums_per_category_match_p1_11 ... ok
test manifest_has_header_and_428_data_rows ... ok
test manifest_dest_paths_are_unique ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_sha ... ok
test negative_validator_rejects_wrong_size ... ok
test sha1_matches_known_vectors ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.61s

EXIT=0
```


### Log 3 — pełny `cargo test --offline` po zmianie (bez skracania)

Komenda: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared CARGO_PROFILE_DEV_DEBUG=0 cargo test --offline; echo "EXIT=$?"`

Podsumowanie z logu: 269 passed, 0 failed, 34 wyniki binariów, `EXIT=0`.

```text
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_046df4f4-30a-3/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 26.31s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 11 tests
test command_wire_shape_is_stable_for_engine_integration ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test counts_per_extension_match_p1_11 ... ok
test byte_sums_per_category_match_p1_11 ... ok
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

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.65s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test camp_destruction_removes_only_the_entered_camp ... ok
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/debug/deps/combat-7737db4785daf590)

running 7 tests
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_params_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test terrain_movement_parses_and_spot_checks ... ok
test map_gen_params_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/debug/deps/diplomacy-d94c0845f92f376e)

running 31 tests
test alliance_sweetener_ease_is_measured_in_points ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test annexation_requires_vassal_economy_orientation ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test war_currency_gate_allows_only_peace_settlements ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/events.rs (/home/user/cargo-target-shared/debug/deps/events-987aa8790b10a253)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
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
test non_food_upgrade_dependencies_are_preserved ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test tile_and_production_are_json_round_trip_safe ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok

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
test canonical_state_dto_vector_round_trips_through_json ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test public_engine_wire_aliases_are_stable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/debug/deps/pathfinding-9421af37f99a3ae3)

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
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/replay.rs (/home/user/cargo-target-shared/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test multiple_layers_stack_additively_per_resource ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test city_rejects_empty_names_and_zero_population ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test canonical_state_round_trips_through_serde ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_unit_reference ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test unavailable_mock_rejects_every_steam_operation ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test land_route_bfs_crosses_desert_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test diff_and_serialization_preserve_route_contract ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test settlement_credits_income_before_paying_expenses ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test settlement_and_balances_round_trip_through_serde ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 5 tests
test current_and_previous_epochs_are_available ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test scout_is_available_in_every_epoch ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```


## Dysk

Runda 1 podawała, że dysk `/` był 99–100% zajęty i że pierwszy przebieg zakończył się EXIT=101 (`No space left on device`). Tego twierdzenia nie da się potwierdzić z zachowanego logu ani z `df` z tamtej chwili, więc go nie podtrzymuję. Pomiary z rundy 2 (`df -h /` po każdym przebiegu, komenda `df -h / | tail -1`):

- po logu 1 (baseline): `/dev/vda 252G 23G 17G 57% /` — wynik zapisany w `df` po przebiegu,
- po logu 3 (pełny przebieg po zmianie): `/dev/vda 252G 24G 16G 62% /`,
- w chwili zapisu dokumentu: `/dev/vda 252G 25G 15G 63% /`.

Wszystkie trzy przebiegi w rundzie 2 zakończyły się EXIT=0. Blokady dyskowej w rundzie 2 nie zaobserwowano.

## Niezależna weryfikacja Python (hashlib)

Skrypt napisany poza repo (w katalogu scratchpad orkiestracji), uruchomiony przez `python3 -I /…/verify_manifest.py <korzeń-worktree>`. Sprawdza: nagłówek, liczbę wierszy, puste linie w środku, SHA-1 git-blob (`hashlib.sha1(b"blob %d\x00" % len + data)`), rozmiary, unikalność ścieżek i zbiór plików na dysku względem manifestu. Skrypt i wynik poniżej.

```python
import hashlib, os, sys
root = sys.argv[1]  # korzen worktree
man = os.path.join(root, "rust-port", "assets", "MANIFEST.tsv")
assets = os.path.join(root, "rust-port", "assets")
raw = open(man, "rb").read()
lines = raw.decode("utf-8").split("\n")
header = lines[0]
print("header:", header)
print("trailing_newline:", raw.endswith(b"\n"), "total_lines_split:", len(lines))
rows = [l for l in lines[1:] if l != ""]
print("data_rows:", len(rows), "empty_lines_inside:", sum(1 for l in lines[1:-1] if l == ""))
ok_sha = ok_size = 0
dests = []
bad = []
for l in rows:
    sha, size, src, dst = l.split("\t")
    dests.append(dst)
    p = os.path.join(root, dst)
    data = open(p, "rb").read()
    h = hashlib.sha1(b"blob %d\x00" % len(data) + data).hexdigest()
    if h == sha: ok_sha += 1
    else: bad.append(("sha", dst))
    if len(data) == int(size): ok_size += 1
    else: bad.append(("size", dst))
print("sha_ok:", ok_sha, "size_ok:", ok_size, "unique_dest:", len(set(dests)) == len(dests))
disk = set()
for d, _, fs in os.walk(assets):
    for f in fs:
        rel = os.path.relpath(os.path.join(d, f), root).replace(os.sep, "/")
        disk.add(rel)
disk.discard("rust-port/assets/MANIFEST.tsv")
exp = set(dests)
print("disk_files:", len(disk), "extra_on_disk:", len(disk - exp), "missing_on_disk:", len(exp - disk))
print("mismatches:", bad)
```

```text
header: blob_sha_edb8fb56	size_bytes	source_web_path	dest_rust_port_path
trailing_newline: True total_lines_split: 430
data_rows: 428 empty_lines_inside: 0
sha_ok: 428 size_ok: 428 unique_dest: True
disk_files: 428 extra_on_disk: 0 missing_on_disk: 0
mismatches: []
```


## Ograniczenia i uczciwość

- Hash-weryfikacja jest w teście (SHA-1 ręczny, opcja 5 dispatchu), więc nie trzeba polegać na `git hash-object` w CI. Zewnętrznie potwierdzona przez skrypt Python (sekcja wyżej).
- Test 4 czyta 49 MB plików; w buildzie debug trwa ok. 1,6 s.
- Ścieżki w teście są względne do `CARGO_MANIFEST_DIR` (`../assets`, `../..`), więc test działa tylko z układem repo rust-port/engine + rust-port/assets.
- Pliki wykluczone z gry (`_wykluczone/`) są w manifeście i w liczbach 62 MP3, zgodnie z P3-8 i P1.11 §2 wiersz 32.
- **Korekta cache (zarzut 5):** w rundzie 1 usunięto katalog `/home/user/cargo-target-shared/debug/incremental` (58 MB) i opisano go jako „własny cache”. Był to błąd opisu: katalog jest współdzielony z równoległymi tematami tego samego procesu. Usunięto wyłącznie cache inkrementalny (katalog budowania, nie źródła ani wyniki). Skutkiem mogło być przebudowanie cache'u przez inne przebiegi; wpływu na nie nie zbadano. W rundzie 2 nie usunięto niczego, a pełny przebieg używa `CARGO_INCREMENTAL=0`.
- Ten dokument nie zawiera żadnego wyniku bez logu lub skryptu, na którym się opiera.
