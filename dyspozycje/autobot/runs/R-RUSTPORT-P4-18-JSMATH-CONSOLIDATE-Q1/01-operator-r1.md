STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-18-JSMATH-CONSOLIDATE-Q1
GOAL: Jedna implementacja Math.* V8 (`crate::jsmath`) w całym `rust-port/renderer`: `jstrig.rs` = re-eksport, `pick/**` i `core/**` przepięte, skaner `jsmath_wiring` obejmuje pick/core/models/camera.rs, dowód grep; fixtury bez zmian, publiczne sygnatury bez zmian.
ZMIANY/COMMIT: `rust-port/renderer/src/{models/unit_core/jstrig.rs, pick/three.rs, pick/terrain.rs, pick/camera.rs, core/hex_shape.rs}`, `rust-port/renderer/tests/jsmath_wiring.rs`, `dyspozycje/rust-port/p4/P4-18-JSMATH-CONSOLIDATE.md`, ten plik. Baza `bf59164b`. Commit lokalny w worktree Operatora, bez push.
TESTY: fmt EXIT=0; clippy EXIT=0; clippy --features gpu EXIT=0; test --all-targets EXIT=0 (103 ok, 0 failed); `pick_golden` 7/7, wszystkie fixtury bez zmian; mutacje skanera 4/4 wykryte.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium)
DEPLOY/PUSH: NIE WYKONANO

Szczegóły, dowód grep, ZAŁOŻENIA (sprzeczność dispatchu co do `pick/**`): `dyspozycje/rust-port/p4/P4-18-JSMATH-CONSOLIDATE.md`.

## Surowe logi bramek (katalog `rust-port/renderer`, ścieżki absolutne skrócone do `<worktree>/`)

### cargo fmt --all -- --check
```
EXIT=0
```

### cargo clippy --locked --all-targets -- -D warnings
```
    Checking pollster v0.4.0
    Checking civ-renderer v0.1.0 (<worktree>/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 3.17s
EXIT=0
```

### cargo clippy --locked --all-targets --features gpu -- -D warnings
```
   Compiling proc-macro2 v1.0.107
   Compiling unicode-ident v1.0.27
   Compiling quote v1.0.47
    Checking cfg-if v1.0.5
   Compiling cfg_aliases v0.2.2
    Checking foldhash v0.2.0
    Checking equivalent v1.0.3
   Compiling autocfg v1.5.1
   Compiling libm v0.2.16
   Compiling thiserror v2.0.21
   Compiling num-traits v0.2.19
    Checking hashbrown v0.17.1
    Checking libloading v0.8.9
   Compiling libc v0.2.191
   Compiling syn v3.0.9
   Compiling syn v2.0.119
    Checking log v0.4.34
   Compiling zerocopy v0.8.63
    Checking indexmap v2.14.2
    Checking bitflags v2.13.2
    Checking rustc-hash v1.1.0
   Compiling naga v30.0.1
   Compiling parking_lot_core v0.9.12
    Checking unicode-width v0.2.2
   Compiling ash v0.38.0+1.3.281
    Checking once_cell v1.21.4
    Checking bit-vec v0.9.1
   Compiling pkg-config v0.3.34
    Checking bit-set v0.10.0
    Checking codespan-reporting v0.13.1
   Compiling thiserror-impl v2.0.21
   Compiling bytemuck_derive v1.12.1
   Compiling wayland-sys v0.31.11
    Checking spirv v0.4.0+sdk-1.4.341.0
    Checking bytemuck v1.25.2
    Checking smallvec v1.16.3
    Checking naga-types v30.0.1
   Compiling zerocopy-derive v0.8.63
   Compiling khronos-egl v6.0.0
    Checking arrayvec v0.7.8
    Checking scopeguard v1.2.0
    Checking allocator-api2 v0.2.21
    Checking raw-window-handle v0.6.2
    Checking static_assertions v1.1.0
    Checking lock_api v0.4.14
    Checking wgpu-types v30.0.1
    Checking hashbrown v0.16.1
    Checking dlib v0.5.3
   Compiling wgpu-hal v30.0.1
    Checking presser v0.3.1
    Checking parking_lot v0.12.5
    Checking ordered-float v5.4.0
    Checking glow v0.17.0
    Checking renderdoc-sys v1.1.0
    Checking profiling v1.0.18
   Compiling wgpu-core v30.0.1
   Compiling litrs v1.0.1
   Compiling wgpu v30.0.1
   Compiling document-features v0.2.12
    Checking half v2.7.1
    Checking gpu-allocator v0.28.0
    Checking wgpu-naga-bridge v30.0.1
    Checking wgpu-core-deps-windows-linux-android v30.0.1
    Checking civ-renderer v0.1.0 (<worktree>/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 31.47s
EXIT=0
```

### cargo test --locked --all-targets
```
   Compiling civ-renderer v0.1.0 (<worktree>/rust-port/renderer)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 5.79s
     Running unittests src/lib.rs (target/debug/deps/civ_renderer-3390857ab33a1fe3)

running 7 tests
test core::jsnum::tests::to_fixed3_matches_node ... ok
test core::jsnum::tests::to_uint32_matches_ecmascript ... ok
test jsmath::words::tests::scalbn_is_exact_power_of_two_scaling ... ok
test jsmath::words::tests::words_round_trip ... ok
test models::wonders::builders::tests::grey_matches_hand_computation ... ok
test models::wonders::renderer::tests::default_owner_color_follows_js_remainder ... ok
test models::wonders::builders::tests::registry_covers_the_19_ids_and_defaults_the_rest ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_nturns.rs (target/debug/deps/assets_nturns-8f7d0ea4505dd8a8)

running 6 tests
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
[LeakM2 small 40x25] turn= 50 buffer=36 texture=306 pipeline=3 bind_group=9 live_bytes=9458944 subscriptions=1 created=712 destroyed=358
test new_game_frees_everything_and_restarts_identically ... ok
[LeakM2 small 40x25] turn=200 buffer=36 texture=1206 pipeline=3 bind_group=9 live_bytes=24204544 subscriptions=1 created=2760 destroyed=1506
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM2 small 40x25] turn 50 violations: live texture: baseline=67 current=306 allowed=67; live bytes: baseline=5543168 current=9458944 allowed=5543168
[LeakM2 small 40x25] turn 200 violations: live texture: baseline=67 current=1206 allowed=67; live bytes: baseline=5543168 current=24204544 allowed=5543168
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM3 small 40x25] turn 50 violations: live buffer: baseline=68 current=196 allowed=68; live texture: baseline=9 current=17 allowed=9; live bind_group: baseline=11 current=19 allowed=11; live bytes: baseline=6722816 current=15373568 allowed=6722816; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 small 40x25] turn 200 violations: live buffer: baseline=68 current=676 allowed=68; live texture: baseline=9 current=47 allowed=9; live bind_group: baseline=11 current=49 allowed=11; live bytes: baseline=6722816 current=47813888 allowed=6722816; subscriptions: baseline=5 current=81 allowed=5
[Fixed large 96x60] turn= 50 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=2337 destroyed=2134
[LeakM1 large 96x60] turn= 10 buffer=714 texture=25 pipeline=3 bind_group=106 live_bytes=7547008 subscriptions=1 created=1126 destroyed=278
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
test leak_m3_also_retains_battle_scene_resources ... ok
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed large 96x60] turn=200 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=8826 destroyed=8623
[Fixed large 96x60] budget OK at turns [50, 200]
test fixed_registry_stays_within_budget_after_10_50_200_turns ... ok
[LeakM1 large 96x60] turn=200 buffer=9552 texture=25 pipeline=3 bind_group=1579 live_bytes=33000448 subscriptions=1 created=16718 destroyed=5559
[LeakM1 large 96x60] turn 50 violations: live buffer: baseline=714 current=2502 allowed=714; live bind_group: baseline=106 current=404 allowed=106; live bytes: baseline=7547008 current=12696448 allowed=7547008
[LeakM1 large 96x60] turn 200 violations: live buffer: baseline=714 current=9552 allowed=714; live bind_group: baseline=106 current=1579 allowed=106; live bytes: baseline=7547008 current=33000448 allowed=7547008
[LeakM2 large 96x60] turn= 10 buffer=148 texture=265 pipeline=3 bind_group=27 live_bytes=9737216 subscriptions=1 created=637 destroyed=194
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM2 large 96x60] turn= 50 buffer=148 texture=1224 pipeline=3 bind_group=27 live_bytes=25449472 subscriptions=1 created=2336 destroyed=934
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM2 large 96x60] turn=200 buffer=148 texture=4815 pipeline=3 bind_group=27 live_bytes=84284416 subscriptions=1 created=8817 destroyed=3824
[rebuild 1000 cycles] start: turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55 destroyed=0
[rebuild 1000 cycles] end:   turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55055 destroyed=55000
[LeakM2 large 96x60] turn 50 violations: live texture: baseline=265 current=1224 allowed=265; live bytes: baseline=9737216 current=25449472 allowed=9737216
[LeakM2 large 96x60] turn 200 violations: live texture: baseline=265 current=4815 allowed=265; live bytes: baseline=9737216 current=84284416 allowed=9737216
test rebuild_in_place_1000_cycles_returns_to_initial_state ... ok
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM3 large 96x60] turn= 10 buffer=180 texture=27 pipeline=3 bind_group=29 live_bytes=7967744 subscriptions=5 created=637 destroyed=398
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM3 large 96x60] turn= 50 buffer=308 texture=35 pipeline=3 bind_group=37 live_bytes=16618496 subscriptions=21 created=2337 destroyed=1954
test simulation_is_deterministic ... ok
[LeakM3 large 96x60] turn=200 buffer=788 texture=65 pipeline=3 bind_group=67 live_bytes=49058816 subscriptions=81 created=8826 destroyed=7903
[LeakM3 large 96x60] turn 50 violations: live buffer: baseline=180 current=308 allowed=180; live texture: baseline=27 current=35 allowed=27; live bind_group: baseline=29 current=37 allowed=29; live bytes: baseline=7967744 current=16618496 allowed=7967744; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 large 96x60] turn 200 violations: live buffer: baseline=180 current=788 allowed=180; live texture: baseline=27 current=65 allowed=27; live bind_group: baseline=29 current=67 allowed=29; live bytes: baseline=7967744 current=49058816 allowed=7967744; subscriptions: baseline=5 current=81 allowed=5
test each_leak_pattern_breaks_the_budget ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s

     Running tests/assets_registry.rs (target/debug/deps/assets_registry-c3f9969dbcf4ae07)

running 14 tests
test cache_lru_by_entries_and_bytes ... ok
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok
test live_report_lists_labels ... ok
test budget_thresholds_are_configurable ... ok
test owned_guards_count_references ... ok
test handle_from_another_registry_is_rejected ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test reference_counting_frees_on_last_release ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test scope_releases_everything_it_created_on_drop ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test subscriptions_unregister_on_drop ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/camera_web_parity.rs (target/debug/deps/camera_web_parity-ed19813f9fcbbf13)

running 5 tests
test drag_and_wheel_do_not_depend_on_dt ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test camera_controller_matches_web_100_percent ... ok
test fixture_covers_every_branch ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/core_web_parity.rs (target/debug/deps/core_web_parity-27c98cd457a8290f)

running 8 tests
test fog_dim_matches_web ... ok
test bronze_city_types_match_web ... ok
test map_style_matches_web ... ok
test hex_shape_matches_web ... ok
test merge_decor_matches_web ... ok
test vitals_match_web ... ok
test zoom_lod_matches_web ... ok
test hexutil_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/cpu_sanity.rs (target/debug/deps/cpu_sanity-0295d7bf5a63866f)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/geom_three_parity.rs (target/debug/deps/geom_three_parity-0f596b3cbdb71744)

running 17 tests
test index_buffer_covers_non_indexed_meshes ... ok
test parity_circle ... ok
test merge_rejects_mixed_indexing ... ok
test parity_cone ... ok
test parity_box ... ok
test parity_curve ... ok
test parity_plane ... ok
test parity_cylinder ... ok
test parity_extrude ... ok
test parity_ops ... ok
test parity_ring ... ok
test parity_shape ... ok
test parity_polyhedron ... ok
test trs_matches_manual_composition ... ok
test parity_torus ... ok
test parity_tube ... ok
test parity_sphere ... ok

test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/gpu_probe.rs (target/debug/deps/gpu_probe-b90f27ad8c898393)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/jsmath_v8_parity.rs (target/debug/deps/jsmath_v8_parity-fee50190cb35806f)

running 13 tests
test compatibility_paths_are_the_same_functions ... ok
test atan_matches_v8 ... ok
test acos_matches_v8 ... ok
test exp_matches_v8 ... ok
test cos_matches_v8 ... ok
test hypot_three_arguments_matches_v8 ... ok
test atan2_matches_v8 ... ok
test hypot_matches_v8 ... ok
test log_matches_v8 ... ok
test whole_domain_without_platform_fallback ... ok
test sin_matches_v8 ... ok
test tan_matches_v8 ... ok
test pow_matches_v8 ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/jsmath_wiring.rs (target/debug/deps/jsmath_wiring-b0f96cca402d817c)

running 4 tests
test geom_rotation_and_euler_use_v8_trig ... ok
test scanner_catches_known_bypass_forms ... ok
test terrain_rotation_uses_v8_trig ... ok
test no_platform_transcendentals_in_js_mirroring_modules ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.15s

     Running tests/pick_golden.rs (target/debug/deps/pick_golden-5edd88b94adda948)

running 7 tests
test client_rect_to_ndc_matches_web ... ok
test js_round_matches_math_round ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test world_to_axial_both_variants_match_web ... ok
test terrain_scene_instances_are_bitwise_web ... ok
test camera_matrices_and_rays_are_bitwise_three ... ok
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.40s

     Running tests/terrain_web_parity.rs (target/debug/deps/terrain_web_parity-7ed099e492a012e9)

running 5 tests
test js_pow_special_cases_follow_v8 ... ok
test fog_hides_unknown_and_dims_explored ... ok
test color_math_matches_three ... ok
test terrain_build_matches_web ... ok
test terrain_fog_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.22s

     Running tests/unit_core_json.rs (target/debug/deps/unit_core_json-b55ab56d4e2236c3)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_core_model_rule.rs (target/debug/deps/unit_core_model_rule-2f5305891471a8dc)

running 7 tests
test pending_registry_is_explicit ... ok
test legacy_en_path_reproduces_exactly_the_three_web_divergences ... ok
test unknown_type_falls_back_to_category_with_a_warning ... ok
test rule_table_covers_exactly_the_77_unit_types ... ok
test table_equals_the_legacy_pl_route_and_names_never_matter ... ok
test norm_name_and_culture_match_the_web ... ok
test web_signature_classes_equal_rust_model_id_classes ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.26s

     Running tests/unit_core_trig.rs (target/debug/deps/unit_core_trig-30b01be29ad89d90)

running 2 tests
test quat_from_euler_honours_every_order ... ok
test js_trig_matches_v8_bit_for_bit_and_libm_does_not ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/unit_core_web_parity.rs (target/debug/deps/unit_core_web_parity-eb9ca6d0cfd9b82c)

running 3 tests
test signature_is_sensitive_to_owner_colour_and_pose ... ok
test part_catalogues_match_the_web_singletons ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.30s

     Running tests/wonders_web_parity.rs (target/debug/deps/wonders_web_parity-d8d9a630ca3a6684)

running 4 tests
test renderer_scenario_is_bit_identical_to_web ... ok
test js_trig_is_bit_identical_to_v8 ... ok
test registry_matches_web_ids ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.17s

EXIT=0
```
