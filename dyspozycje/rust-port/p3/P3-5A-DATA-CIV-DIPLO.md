# P3-5A — Dane cywilizacji i dyplomacji: JSON -> struktury Rust (R-RUSTPORT-P3-5A-DATA-CIV-DIPLO-Q1)

STATUS: Operator, runda 1/5 — wykonane, czeka na Evaluatora.
DOMAIN: GAME
BAZA: `origin/rust-port/parity-v2` @ `e72c74f7948938003f3811826ce48951879d1f26` (najnowszy HEAD w chwili pracy; dispatch
podawal `9e33fc77` jako przykladowy HEAD — `9e33fc77` jest przodkiem `e72c74f7`, wiec baza jest zgodna z dispatchem i nowsza).
PIN DANYCH: `gra/data/*.json` odczytane na `edb8fb56` (`git show edb8fb56:gra/data/<plik>`). Skopiowane 1:1; blob hash kopii
równy blob hash z pinu dla wszystkich 7 plików (patrz §3).

## 1. Zakres i allowlista

| Sciezka | Status | Uwagi |
|---|---|---|
| `rust-port/engine/data/civs.json` | NOWY (kopia 1:1) | blob `86fd13944ef63c6e22d390517d67a36dbf07c0ae` = pin |
| `rust-port/engine/data/civ-matrix.json` | NOWY (kopia 1:1) | blob `fc94205d99bb39339dbc2cd59072b00479f9defc` = pin |
| `rust-port/engine/data/civ-params.json` | NOWY (kopia 1:1) | blob `0ac5838b56e71a77191e4c44b2ff1c9eeedcd493` = pin |
| `rust-port/engine/data/civ-ai.json` | NOWY (kopia 1:1) | blob `2e9cff80b39fdd38ce4e95ca4f64c5660e0e5adf` = pin |
| `rust-port/engine/data/diplomacy.json` | NOWY (kopia 1:1) | blob `056c0ef91a5ae3a9a6c49d3027301b716a1540b4` = pin |
| `rust-port/engine/data/diplomacy-acceptance-points.json` | NOWY (kopia 1:1) | blob `19a43485fac5a64661a3b5d3645631c6fd0d588b` = pin |
| `rust-port/engine/data/city-names-pools.json` | NOWY (kopia 1:1) | blob `7ce011d1e6d34bdff73fd36fa475f52bd2a7fdc7` = pin |
| `rust-port/engine/src/data/civilizations.rs` | NOWY | 77 struktur `#[derive(Deserialize, Serialize)]`, enumy untagged, `include_str!` + `parse_*()` |
| `rust-port/engine/tests/data_civilizations.rs` | NOWY | 7 testow (po jednym na plik): parse + spot-checki + round-trip |
| `dyspozycje/rust-port/p3/P3-5A-DATA-CIV-DIPLO.md` | NOWY | ten dokument |
| `dyspozycje/autobot/runs/R-RUSTPORT-P3-5A-DATA-CIV-DIPLO-Q1/` | NOWY | `01-operator.md`, `gen-civilizations.py` (generator), logi `cargo-test-*.log` (w `.gitignore` jako `*.log`, lezy na dysku worktree) |

Nietkniete: `rust-port/engine/src/lib.rs`, `src/domain/mod.rs`, wszystkie istniejace pliki `.rs`, `gra/**`, `WERSJE.md`.
**`Cargo.toml` NIE zmieniony** — `serde` (feature `derive`) jest zwykla zaleznoscia, `serde_json` dev-dependency wystarcza
dla testow integracyjnych (modul `civilizations.rs` uzywa `serde_json::from_str` tylko w funkcjach `parse_*`, ktore sa wywolywane
wylacznie z testow). **Zastrzezenie:** ta wystarczalnosc dotyczy WYLACZNIE obecnego stanu (modul ladowany przez `#[path]` w tescie).
Podpiecie modulu do `lib.rs` (P3.9) wymaga przeniesienia `serde_json` do `[dependencies]` — wtedy zmiana `Cargo.toml` bedzie
czescia tamtego tematu, nie tego. `Cargo.lock` wygenerowany przez build zostal usuniety z drzewa roboczego (nie w allowliscie, nie commitowany).

Modul nie jest podpiety do `lib.rs` (zakaz w dispatchu); test laduje go przez `#[path = "../src/data/civilizations.rs"]`.
`include_str!` w module uzywa `../../data/<plik>.json` (wzgledem `src/data/`), tak jak w P3-5D.

Odstepstwo od tresci dispatchu (zgodne z jego allowlista): dispatch pkt 4 mowi o `#[cfg(test)] mod tests` w tym samym pliku,
a pkt 5 i allowlista wskazuja `rust-port/engine/tests/data_civilizations.rs` jako wlasciwe miejsce testow. Wybrano wariant
z `tests/` (jak P3-5D), zeby nie dotykac `civilizations.rs` poza jego wlasnym kodem; `civilizations.rs` nie zawiera testow.

## 2. Jak powstaly struktury (1:1 z ksztaltem JSON, nie z pamieci)

Struktury NIE sa pisane recznie. Skrypt `gen-civilizations.py` (w katalogu runu) czyta FAKTYCZNY ksztalt kazdego pliku
z pinu (suma kluczy i typow wartosci po wszystkich rekordach danej sciezki) i generuje Rust:

- kazdy obiekt JSON -> `struct` z `#[serde(deny_unknown_fields)]`; kazdy klucz -> pole z `#[serde(rename = "<klucz JSON>")]`
  (rename zawsze, gdy identyfikator Rust rozni sie od klucza: polskie znaki, spacje, `_meta`, `Cywilizacja`, camelCase);
- typy liczb zachowane z JSON: calkowite -> `i64`, dziesietne -> `f64`, a gdy ten sam klucz ma w roznych rekordach obie formy
  -> enum `Num { Int(i64), Float(f64) }` (untagged). Przyklad: `civ-matrix.defaults.meta_mnoznik_waluta` = int `2`,
  ale `cywilizacje[0].params.meta_mnoznik_waluta` = float `2.3` -> `Num::Int(2)` / `Num::Float(2.3)`;
- pole, ktore w JSON bywa `null` -> `Option<T>` bez `skip_serializing_if` (round-trip zachowuje `null`);
- pole, ktore w roznych rekordach ma rozny typ (`bonusy[].wartosc`: liczba albo lista napisow; `zmiany_parametrów[].Zmiana`:
  napis albo liczba) -> enum `untagged` z wariantami per typ;
- slowniki o dynamicznych kluczach (`paramDefs`, `defaults`, `params` per cywilizacja, `pn_per_szt`, `przyklady`, `cena_baza`,
  pule nazw miast) -> `BTreeMap<String, T>`;
- wszystkie pola obecne we wszystkich rekordach danego obiektu (generator nie wykryl brakujacych kluczy ani mieszanki `null`/brak),
  wiec `default`/`skip_serializing_if` nie sa potrzebne.

Liczba typow (77 `pub struct`, 4 `pub enum` untagged: `Num` oraz 3 enumy zmiennych typow) jest wynikiem generatora; `diplomacy.params` ma 132 pola
(zgodnie z `jq`/Python: 132 klucze).

Dlaczego generator, a nie recznie: `params` ma 132 pola, `paramDefs` 93 wpisy, `cywilizacje[].params` 93 pola x 15 cywilizacji.
Recznie to stalo by sie zrodlem literowek; round-trip w testach (§4) dowodzi, ze wygenerowane typy nie gubia zadnego pola.

## 3. Kopie 1:1 — dowod

```text
$ git hash-object rust-port/engine/data/{civs,civ-matrix,civ-params,civ-ai,diplomacy,diplomacy-acceptance-points,city-names-pools}.json
86fd13944ef63c6e22d390517d67a36dbf07c0ae
fc94205d99bb39339dbc2cd59072b00479f9defc
0ac5838b56e71a77191e4c44b2ff1c9eeedcd493
2e9cff80b39fdd38ce4e95ca4f64c5660e0e5adf
056c0ef91a5ae3a9a6c49d3027301b716a1540b4
19a43485fac5a64661a3b5d3645631c6fd0d588b
7ce011d1e6d34bdff73fd36fa475f52bd2a7fdc7
$ git rev-parse edb8fb56:gra/data/{civs,civ-matrix,civ-params,civ-ai,diplomacy,diplomacy-acceptance-points,city-names-pools}.json
86fd13944ef63c6e22d390517d67a36dbf07c0ae
fc94205d99bb39339dbc2cd59072b00479f9defc
0ac5838b56e71a77191e4c44b2ff1c9eeedcd493
2e9cff80b39fdd38ce4e95ca4f64c5660e0e5adf
056c0ef91a5ae3a9a6c49d3027301b716a1540b4
19a43485fac5a64661a3b5d3645631c6fd0d588b
7ce011d1e6d34bdff73fd36fa475f52bd2a7fdc7
```

Rozmiary (bajty): civs 63037, civ-matrix 70801, civ-params 3547, civ-ai 5009, diplomacy 35194,
diplomacy-acceptance-points 3105, city-names-pools 30514 (razem 211207).

## 4. Spot-checki (liczone niezaleznie w Pythonie na pinie `edb8fb56`, wpisane jako stale w tescie)

| Plik | Pole | Wartosc z pliku (Python, pin) | Wartosc w tescie Rust |
|---|---|---|---|
| civs.json | liczba `cywilizacje` / `start_gry` | 15 / 11 | 15 / 11 |
| civs.json | `bonusy` lacznie / rekordy z lista w `wartosc` | 48 / 15 | 48 / 15 |
| civs.json | `cywilizacje[0].nazwyMiast` | 110 | 110 |
| civs.json | `cywilizacje[0].mnoznikHandelPieniadz` | 2.3 | 2.3 |
| civ-matrix.json | `paramDefs` / `defaults` / `cywilizacje` | 93 / 93 / 15 | 93 / 93 / 15 |
| civ-matrix.json | `cywilizacje[12]` (Babilonia) `tier` | 2 | 2 |
| civ-matrix.json | `defaults.meta_mnoznik_waluta` (int) / `cywilizacje[0].params.meta_mnoznik_waluta` (float) | 2 / 2.3 | `Int(2)` / `Float(2.3)` |
| civ-params.json | `cywilizacje[0].modWzrostu` / `modEkonomii` | 1 (int) / 1.02 (float) | `Int(1)` / `Float(1.02)` |
| civ-ai.json | `cywilizacje[0].agresywnosc` / `profilMapy` | 4 / kopia_typu_obronna | 4 / kopia_typu_obronna |
| diplomacy.json | `params.progSojuszRelacja` / `akcje_dyplomatyczne` / `perNacja` / `zmiany_parametrów` | 151 / 15 / 15 / 24 | 151 / 15 / 15 / 24 |
| diplomacy.json | `handel_zloze.cena_baza` (liczba kluczy) / `miedz` | 6 / 120 | 6 / 120 |
| diplomacy-acceptance-points.json | `traktaty.pokoj.punkty` | 500 | 500 |
| diplomacy-acceptance-points.json | `koszyk_pn.surowiec_ilosc.pn_per_szt` (kluczy) / `drewno` | 14 / 1 | 14 / 1 |
| city-names-pools.json | liczba pul / wpisow w kazdej / `grecy[0]` | 15 / 110 / Ateny | 15 / 110 / Ateny |

Test round-trip (`serde_json::to_value(&typed) == serde_json::from_str::<Value>(raw)`) dla kazdego z 7 plikow: OK.

## 5. Surowe logi `cargo test`

Srodowisko: `rustc 1.97.0`, `cargo 1.97.0`. Build w `rust-port/engine/` (domyslny `target/` w worktree), commit `388385af`
(P3-5A). Logi ponizej sa DOSLOWNA zawartoscia plikow z dysku (przechwycone przez `> plik 2>&1; echo "EXIT=$?" >> plik`),
bez przestawiania linii. Pliki `*.log` sa w `.gitignore`, dlatego ich tresc jest wklejona tutaj.

### 5.1 Test celowany `cargo test --test data_civilizations`, exit 0

Plik: `dyspozycje/autobot/runs/R-RUSTPORT-P3-5A-DATA-CIV-DIPLO-Q1/cargo-test-data-civilizations.log`
Komenda: `cd rust-port/engine && cargo test --test data_civilizations > <log> 2>&1; echo "EXIT=$?" >> <log>`

```text
    Updating crates.io index
     Locking 17 packages to latest compatible versions
   Compiling proc-macro2 v1.0.107
   Compiling quote v1.0.47
   Compiling unicode-ident v1.0.27
   Compiling serde_core v1.0.229
   Compiling serde v1.0.229
   Compiling zmij v1.0.23
   Compiling once_cell v1.21.4
   Compiling pin-project-lite v0.2.17
   Compiling serde_json v1.0.154
   Compiling tracing-core v0.1.36
   Compiling memchr v2.8.3
   Compiling syn v3.0.9
   Compiling syn v2.0.119
   Compiling itoa v1.0.18
   Compiling serde_derive v1.0.229
   Compiling tracing-attributes v0.1.31
   Compiling tracing v0.1.44
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_8533bc3c-8ff-3/rust-port/engine)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 30.78s
     Running tests/data_civilizations.rs (target/debug/deps/data_civilizations-146c5ad23b4be479)

running 7 tests
test civ_ai_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

EXIT=0
```

### 5.2 Pelny `cargo test --no-fail-fast` w `rust-port/engine/` (wszystkie cele), exit 0

Plik: `dyspozycje/autobot/runs/R-RUSTPORT-P3-5A-DATA-CIV-DIPLO-Q1/cargo-test-full.log`
Komenda: `cd rust-port/engine && cargo test --no-fail-fast > <log> 2>&1; echo "EXIT=$?" >> <log>`
Wynik: `EXIT=0` (ostatnia linia logu); 0 wierszy `test result` z `failed` > 0.
Wiersz `0 passed` to doctest/lib bez testow.

```text
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_8533bc3c-8ff-3/rust-port/engine)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 19.61s
     Running unittests src/lib.rs (target/debug/deps/civ_engine-51f74fbbb260e756)

running 6 tests
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/ai_turn.rs (target/debug/deps/ai_turn-24c0657fad6df4da)

running 11 tests
test command_wire_shape_is_stable_for_engine_integration ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test wounded_units_retreat_before_attacking ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/barbarians.rs (target/debug/deps/barbarians-344d7fe820812ee3)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/bridge_add_player.rs (target/debug/deps/bridge_add_player-0625413d20c9ed97)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (target/debug/deps/building_costs-fbbf6dba914f1336)

running 10 tests
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (target/debug/deps/city_growth-21b45f459f01e166)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (target/debug/deps/combat-e0f311a5801d1383)

running 7 tests
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (target/debug/deps/data_civilizations-146c5ad23b4be479)

running 7 tests
test civ_params_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_terrain_map.rs (target/debug/deps/data_terrain_map-40730dada4e672fa)

running 4 tests
test terrain_movement_parses_and_spot_checks ... ok
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/diplomacy.rs (target/debug/deps/diplomacy-5531b8307a57ec7a)

running 31 tests
test alliance_sweetener_ease_is_measured_in_points ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test annexation_requires_vassal_economy_orientation ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
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
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/events.rs (target/debug/deps/events-10f9fe571552f942)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (target/debug/deps/hex_terrain-b47c2f141e637a22)

running 10 tests
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test axial_coordinates_keep_the_cube_invariant ... ok
test terrain_movement_costs_are_explicit ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (target/debug/deps/improvements-04d0a2ab37458f20)

running 13 tests
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test tile_and_production_are_json_round_trip_safe ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (target/debug/deps/map_generator-3e20d28b0cbac99a)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test map_dimensions_and_seed_are_stable ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test river_markers_are_land_and_reach_water ... ok
test world_types_and_default_seed_match_typescript_contract ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/parity_suite.rs (target/debug/deps/parity_suite-443a43671343fb99)

running 11 tests
test canonical_state_dto_vector_round_trips_through_json ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test public_engine_wire_aliases_are_stable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/pathfinding.rs (target/debug/deps/pathfinding-2d9a1e25af033429)

running 8 tests
test impassable_destination_is_allowed_as_the_final_step ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test unreachable_and_missing_fields_are_rejected ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/playable_slice.rs (target/debug/deps/playable_slice-7a33418be92abaae)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (target/debug/deps/recruitment-1a36825f43d5457b)

running 7 tests
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/replay.rs (target/debug/deps/replay-e4d076bdd9950fb9)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (target/debug/deps/resource_production-ef4f0c1d1b8d6709)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok
test multiple_layers_stack_additively_per_resource ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (target/debug/deps/rng-c2b150bfbb9ff1b3)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (target/debug/deps/save_load-a2934c1d8180c62b)

running 6 tests
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (target/debug/deps/smoke-cfccbbd7a2143bd6)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (target/debug/deps/state_dto-099b61d75e6073d6)

running 10 tests
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test canonical_state_round_trips_through_serde ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test city_rejects_empty_names_and_zero_population ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_unit_reference ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/steam_adapter.rs (target/debug/deps/steam_adapter-3ec93791b1c4d6ef)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test unavailable_mock_rejects_every_steam_operation ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (target/debug/deps/terrain_movement_fix-d481b48ba1efd133)

running 9 tests
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_crosses_desert_field ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (target/debug/deps/trade-e38c46e82a75ccdc)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test diff_and_serialization_preserve_route_contract ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (target/debug/deps/turn_economy-055eed92062bbcb2)

running 7 tests
test pure_preview_does_not_mutate_input_balances ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test settlement_credits_income_before_paying_expenses ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test flow_helpers_are_deterministic_and_saturating ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (target/debug/deps/unit_epoch-187bc69739413ce4)

running 5 tests
test current_and_previous_epochs_are_available ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test scout_is_available_in_every_epoch ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```


## 6. Ograniczenia i uwagi

- Modul nie jest w `lib.rs`: dane sa parsowane i testowane, ale nie sa czescia API crate'a. Podpiecie = osobny temat konsolidacyjny (zgodnie z dispatchem).
- `loader/walidator` w runtime = P3.9 (poza zakresem). `parse_*()` sluzy tylko testom.
- Wartosci danych NIE sa korygowane (zakaz). Rozjazdy zaobserwowane przy okazji, do rozstrzygniecia przez wlasciciela danych, nie Operatora:
  - `civ-matrix.defaults.meta_mnoznik_waluta` = 2 (int) przy wartosci per-cywilizacja 2.3 — to celowe nadpisanie, nie blad parsowania; zachowane jako `Num`.
  - `civs.json` `Uwagi` jest `null` dla 3 cywilizacji (Rzymianie, Inkowie, Zulusi) — zachowane jako `Option<String>`.
- `Cargo.lock` nie jest w repo i nie jest commitowany (poza allowlista).
- Generator `gen-civilizations.py` zapisany w katalogu runu; uruchomienie: `python3 -I gen-civilizations.py <sciezka_wyjscia.rs>` (wymaga kopii pinu w katalogu `scratchpad/p3-5a/`, odtwarzalne przez `git show edb8fb56:gra/data/<plik>`).
- PUSH: NIE WYKONANO. Zero zmian w `gra/**`.

DEPLOY/PUSH: NIE WYKONANO
