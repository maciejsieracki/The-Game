STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-11-CAMERA-TERRAIN-CPU-Q1
GOAL: RR-T2a — kamera (`camera.ts` → maszyna stanów zgodna z `pick::camera`) i siatki terenu roblox na CPU jako bufory gotowe na GPU, zgodność bitowa z uruchomionym kodem weba.
ZMIANY/COMMIT: Final Control nie zmienił kodu ani wektorów; dodaje wyłącznie ten raport (commit na `f3267f02`). Badany łańcuch: `7aab83f5` (= `origin/rust-port/parity-v2`) → `eb30eefc` (kod) → `7de81e7c` (dok.) → `f3267f02` (obrona: wektory kamery + dok.). Kolejność integracji: eb30eefc, 7de81e7c, f3267f02, ten commit (fast-forward na parity-v2; pliki `dyspozycje/**` dodatkowo na gałąź dokumentacyjną).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Weryfikacja samodzielna

- Allowlista: `git diff --name-status 7aab83f5 f3267f02` — 24 ścieżki, wszystkie w allowliście (camera.rs M, lib.rs M jedna linia, terrain/** A, tests/{camera,terrain}_web_parity.rs, fixtures/{camera,terrain}/**, P4-11, runs/**). `git diff --check 7aab83f5 f3267f02` pusty. Obrona (`7de81e7c..f3267f02`) dotyka tylko fixtures/camera/{gen.ts,camera.json,README.md}, P4-11 i 03-operator-obrona-r1.md.
- Bramki w czystym targecie `/home/user/cargo-target-shared/wf_5eb5677d-3de-4-fc` (`rm -rf` przed startem, `CARGO_INCREMENTAL=0`, `--locked`, HEAD `f3267f02` — zatwierdzony commit, nie drzewo robocze): fmt / clippy `--features gpu` / clippy / test — EXIT=0 każda. Parytet: kamera `scenarios=34 steps=6524 scalars=47892 mismatches=0`; teren build `maps=7 instances=11605 scalars=271747 exact=271747 bad=0`; mgła `calls=16 scalars=80332 exact=80332`; kolory `scalars=15360 exact=15360`. Target usunięty.
- Wektory odtworzone niezależnie (scratch `/home/user/scratch-fc-p411` poza repo, usunięty): `three@0.169.0`, `esbuild@0.24.0`, `git archive edb8fb56 gra/src gra/data`, node v22.22.0; generator importuje prawdziwy `CameraController` z `websrc/gra/src/render/camera`. Wynik: `camera scenarios=34 steps=6524`, `terrain maps=7 instances=11605 fogCalls=16 colorCases=5120 pow=6144 hypot=2048`; SHA-256 wszystkich 9 JSON = repo (np. `camera.json 4df88095…a1cf`, `map_E.json 7adf6811…3a3e`).
- Mutacja niezależna: `camera.rs:405` `mx < zone` → `mx <= zone`: `mismatches=216`, EXIT=101 (wykryta; zgodne z liczbą obrony). Przywrócone `git checkout`.
- Web: `camera.ts:117` `edgePanZonePx ?? 32` (0 zostaje), `camera.ts:266-270` ścisłe `<`/`>`; `scene.ts:1774` `R * 1.008` dla roblox.

## Orzeczenia

| Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|
| E1 (Evaluator): mutant `mx<zone`→`mx<=zone` przeżył, „równoważny” | ODDAL | Teza o równoważności była błędna (strefa 0 → 0/0 = NaN), ale luka dotyczyła siły wektorów, nie kodu. Obrona dodała scenariusz `edge-zone-zero` z uruchomionego weba; FC potwierdza: mutant wykrywany (216 rozbieżności), wektor odtworzony bitowo. Kod Rust bez zmian i zgodny. |
| E2: rozbieżność liczby mutacji 6/7 vs 19/19 | ODDAL | Różne zbiory mutacji, nie sprzeczność; jedyny ocalały mutant jest teraz zabijany. |
| E3: odchylenie Q2 przy FPS ≠ 60 | ODDAL | Rozstrzygnięcie orkiestratora w dispatchu (dt×60 z limitem), wdrożone i opisane w P4-11 §1/§7; ewentualna rewizja to sprawa właściciela przez orkiestratora, nie wada pracy. |
| E4 / blokada obrony: ucięty tekst zarzutów | ODDAL | W przekazie FC tekst Evaluatora też urywa się, ale wewnątrz surowego logu `cargo test` (po sekcji TESTY z mutacjami); wszystkie merytoryczne uwagi poprzedzają logi. Raportu `02-evaluator` brak na gałęzi dok. — orkiestrator powinien go zapisać przy integracji. |
| Obrona: logi §11.1 z drzewa roboczego (`7de81e7c` + zmiany), nie z `f3267f02` | ODDAL | FC uruchomił bramki na zatwierdzonym `f3267f02` — EXIT=0, liczby identyczne. |

Agregat: 0×NAPRAW, 0×DO DECYZJI → PASS. Decyzje Q1–Q3 pozostają tymczasowymi rozstrzygnięciami orkiestratora do rewizji przez właściciela (nie blokują).

NASTĘPNY KROK: integracja orkiestratora (fast-forward `rust-port/parity-v2` do tego commitu; `dyspozycje/**` na `claude/sprawdzenie-funkcjonalnosci-ek4ra0`), potem READY_FOR_DEPLOY. Push wymaga osobnej autoryzacji.

## Surowy log bramek (pełny, `echo "EXIT=$?"`)

```text
### HEAD
f3267f027558c78e4a1a47c37c128d8dd70fffcf
### fmt
EXIT=0
### clippy --locked --all-targets --features gpu -- -D warnings
   Compiling proc-macro2 v1.0.107
   Compiling quote v1.0.47
   Compiling unicode-ident v1.0.27
    Checking cfg-if v1.0.5
   Compiling cfg_aliases v0.2.2
    Checking foldhash v0.2.0
   Compiling libm v0.2.16
   Compiling thiserror v2.0.21
   Compiling autocfg v1.5.1
    Checking equivalent v1.0.3
    Checking hashbrown v0.17.1
   Compiling num-traits v0.2.19
   Compiling syn v3.0.9
   Compiling syn v2.0.119
    Checking libloading v0.8.9
   Compiling libc v0.2.191
    Checking log v0.4.34
   Compiling zerocopy v0.8.63
    Checking indexmap v2.14.2
    Checking bitflags v2.13.2
    Checking rustc-hash v1.1.0
   Compiling naga v30.0.1
    Checking unicode-width v0.2.2
   Compiling parking_lot_core v0.9.12
   Compiling ash v0.38.0+1.3.281
    Checking once_cell v1.21.4
   Compiling pkg-config v0.3.34
    Checking bit-vec v0.9.1
    Checking bit-set v0.10.0
    Checking codespan-reporting v0.13.1
   Compiling wayland-sys v0.31.11
    Checking spirv v0.4.0+sdk-1.4.341.0
   Compiling thiserror-impl v2.0.21
   Compiling bytemuck_derive v1.12.1
    Checking allocator-api2 v0.2.21
    Checking naga-types v30.0.1
    Checking bytemuck v1.25.2
   Compiling zerocopy-derive v0.8.63
   Compiling khronos-egl v6.0.0
    Checking arrayvec v0.7.8
    Checking static_assertions v1.1.0
    Checking smallvec v1.16.3
    Checking raw-window-handle v0.6.2
    Checking scopeguard v1.2.0
    Checking lock_api v0.4.14
    Checking wgpu-types v30.0.1
    Checking hashbrown v0.16.1
    Checking dlib v0.5.3
   Compiling wgpu-hal v30.0.1
    Checking presser v0.3.1
    Checking parking_lot v0.12.5
    Checking ordered-float v5.4.0
    Checking renderdoc-sys v1.1.0
    Checking glow v0.17.0
    Checking profiling v1.0.18
   Compiling wgpu-core v30.0.1
   Compiling litrs v1.0.1
   Compiling wgpu v30.0.1
   Compiling document-features v0.2.12
    Checking pollster v0.4.0
    Checking half v2.7.1
    Checking gpu-allocator v0.28.0
    Checking wgpu-naga-bridge v30.0.1
    Checking wgpu-core-deps-windows-linux-android v30.0.1
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_5eb5677d-3de-4/rust-port/renderer)
    Finished `dev` profile [unoptimized] target(s) in 22.39s
EXIT=0
### clippy --locked --all-targets -- -D warnings
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_5eb5677d-3de-4/rust-port/renderer)
    Finished `dev` profile [unoptimized] target(s) in 1.19s
EXIT=0
### cargo test --locked --all-targets
   Compiling pollster v0.4.0
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_5eb5677d-3de-4/rust-port/renderer)
    Finished `test` profile [unoptimized] target(s) in 1.80s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-4-fc/debug/deps/civ_renderer-d95024f3ec20cfd9)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_nturns.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-4-fc/debug/deps/assets_nturns-7ff94d6b0438d2d1)

running 6 tests
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
test new_game_frees_everything_and_restarts_identically ... ok
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
[Fixed large 96x60] turn= 50 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=2337 destroyed=2134
[LeakM2 small 40x25] turn= 50 buffer=36 texture=306 pipeline=3 bind_group=9 live_bytes=9458944 subscriptions=1 created=712 destroyed=358
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
test leak_m3_also_retains_battle_scene_resources ... ok
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM2 small 40x25] turn=200 buffer=36 texture=1206 pipeline=3 bind_group=9 live_bytes=24204544 subscriptions=1 created=2760 destroyed=1506
[LeakM2 small 40x25] turn 50 violations: live texture: baseline=67 current=306 allowed=67; live bytes: baseline=5543168 current=9458944 allowed=5543168
[LeakM2 small 40x25] turn 200 violations: live texture: baseline=67 current=1206 allowed=67; live bytes: baseline=5543168 current=24204544 allowed=5543168
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM3 small 40x25] turn 50 violations: live buffer: baseline=68 current=196 allowed=68; live texture: baseline=9 current=17 allowed=9; live bind_group: baseline=11 current=19 allowed=11; live bytes: baseline=6722816 current=15373568 allowed=6722816; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 small 40x25] turn 200 violations: live buffer: baseline=68 current=676 allowed=68; live texture: baseline=9 current=47 allowed=9; live bind_group: baseline=11 current=49 allowed=11; live bytes: baseline=6722816 current=47813888 allowed=6722816; subscriptions: baseline=5 current=81 allowed=5
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 large 96x60] turn= 10 buffer=714 texture=25 pipeline=3 bind_group=106 live_bytes=7547008 subscriptions=1 created=1126 destroyed=278
[Fixed large 96x60] turn=200 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=8826 destroyed=8623
[Fixed large 96x60] budget OK at turns [50, 200]
test fixed_registry_stays_within_budget_after_10_50_200_turns ... ok
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
test simulation_is_deterministic ... ok
[rebuild 1000 cycles] start: turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55 destroyed=0
[rebuild 1000 cycles] end:   turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55055 destroyed=55000
test rebuild_in_place_1000_cycles_returns_to_initial_state ... ok
[LeakM1 large 96x60] turn=200 buffer=9552 texture=25 pipeline=3 bind_group=1579 live_bytes=33000448 subscriptions=1 created=16718 destroyed=5559
[LeakM1 large 96x60] turn 50 violations: live buffer: baseline=714 current=2502 allowed=714; live bind_group: baseline=106 current=404 allowed=106; live bytes: baseline=7547008 current=12696448 allowed=7547008
[LeakM1 large 96x60] turn 200 violations: live buffer: baseline=714 current=9552 allowed=714; live bind_group: baseline=106 current=1579 allowed=106; live bytes: baseline=7547008 current=33000448 allowed=7547008
[LeakM2 large 96x60] turn= 10 buffer=148 texture=265 pipeline=3 bind_group=27 live_bytes=9737216 subscriptions=1 created=637 destroyed=194
[LeakM2 large 96x60] turn= 50 buffer=148 texture=1224 pipeline=3 bind_group=27 live_bytes=25449472 subscriptions=1 created=2336 destroyed=934
[LeakM2 large 96x60] turn=200 buffer=148 texture=4815 pipeline=3 bind_group=27 live_bytes=84284416 subscriptions=1 created=8817 destroyed=3824
[LeakM2 large 96x60] turn 50 violations: live texture: baseline=265 current=1224 allowed=265; live bytes: baseline=9737216 current=25449472 allowed=9737216
[LeakM2 large 96x60] turn 200 violations: live texture: baseline=265 current=4815 allowed=265; live bytes: baseline=9737216 current=84284416 allowed=9737216
[LeakM3 large 96x60] turn= 10 buffer=180 texture=27 pipeline=3 bind_group=29 live_bytes=7967744 subscriptions=5 created=637 destroyed=398
[LeakM3 large 96x60] turn= 50 buffer=308 texture=35 pipeline=3 bind_group=37 live_bytes=16618496 subscriptions=21 created=2337 destroyed=1954
[LeakM3 large 96x60] turn=200 buffer=788 texture=65 pipeline=3 bind_group=67 live_bytes=49058816 subscriptions=81 created=8826 destroyed=7903
[LeakM3 large 96x60] turn 50 violations: live buffer: baseline=180 current=308 allowed=180; live texture: baseline=27 current=35 allowed=27; live bind_group: baseline=29 current=37 allowed=29; live bytes: baseline=7967744 current=16618496 allowed=7967744; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 large 96x60] turn 200 violations: live buffer: baseline=180 current=788 allowed=180; live texture: baseline=27 current=65 allowed=27; live bind_group: baseline=29 current=67 allowed=29; live bytes: baseline=7967744 current=49058816 allowed=7967744; subscriptions: baseline=5 current=81 allowed=5
test each_leak_pattern_breaks_the_budget ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s

     Running tests/assets_registry.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-4-fc/debug/deps/assets_registry-ee54812c049c2745)

running 14 tests
test budget_thresholds_are_configurable ... ok
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test cache_lru_by_entries_and_bytes ... ok
test live_report_lists_labels ... ok
test handle_from_another_registry_is_rejected ... ok
test owned_guards_count_references ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test reference_counting_frees_on_last_release ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test scope_releases_everything_it_created_on_drop ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok
test subscriptions_unregister_on_drop ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/camera_web_parity.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-4-fc/debug/deps/camera_web_parity-96e1465f8bdd64b3)

running 5 tests
test drag_and_wheel_do_not_depend_on_dt ... ok
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok
test fixture_covers_every_branch ... ok
test camera_controller_matches_web_100_percent ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/cpu_sanity.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-4-fc/debug/deps/cpu_sanity-7ee07d9f2002230a)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/geom_three_parity.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-4-fc/debug/deps/geom_three_parity-ab6f7952892f0505)

running 17 tests
test index_buffer_covers_non_indexed_meshes ... ok
test merge_rejects_mixed_indexing ... ok
test parity_circle ... ok
test parity_curve ... ok
test parity_cone ... ok
test parity_box ... ok
test parity_plane ... ok
test parity_cylinder ... ok
test parity_extrude ... ok
test parity_ring ... ok
test parity_ops ... ok
test parity_shape ... ok
test parity_torus ... ok
test trs_matches_manual_composition ... ok
test parity_tube ... ok
test parity_polyhedron ... ok
test parity_sphere ... ok

test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/gpu_probe.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-4-fc/debug/deps/gpu_probe-08e2d2a6c2a7bdae)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pick_golden.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-4-fc/debug/deps/pick_golden-b6b94fb9d9c318d1)

running 7 tests
test client_rect_to_ndc_matches_web ... ok
test js_round_matches_math_round ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test world_to_axial_both_variants_match_web ... ok
test terrain_scene_instances_are_bitwise_web ... ok
test camera_matrices_and_rays_are_bitwise_three ... ok
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.40s

     Running tests/terrain_web_parity.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-4-fc/debug/deps/terrain_web_parity-5b12acf27f4f9ccd)

running 5 tests
test js_pow_special_cases_follow_v8 ... ok
test fog_hides_unknown_and_dims_explored ... ok
test color_math_matches_three ... ok
test terrain_build_matches_web ... ok
test terrain_fog_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.19s

EXIT=0
### parity nocapture
    Finished `test` profile [unoptimized] target(s) in 0.03s
     Running tests/camera_web_parity.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-4-fc/debug/deps/camera_web_parity-96e1465f8bdd64b3)

running 5 tests
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test drag_and_wheel_do_not_depend_on_dt ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok
test fixture_covers_every_branch ... ok
camera parity: scenarios=34 steps=6524 scalars=47892 mismatches=0
test camera_controller_matches_web_100_percent ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/terrain_web_parity.rs (/home/user/cargo-target-shared/wf_5eb5677d-3de-4-fc/debug/deps/terrain_web_parity-5b12acf27f4f9ccd)

running 5 tests
test js_pow_special_cases_follow_v8 ... ok
test fog_hides_unknown_and_dims_explored ... ok
map A fog (8 calls): scalars=9576 exact=9576 within1e-6=0 bad=0
map A build (instances 159): scalars=7888 exact=7888 within1e-6=0 bad=0
map A-lite build (instances 126): scalars=6871 exact=6871 within1e-6=0 bad=0
map B fog (4 calls): scalars=8056 exact=8056 within1e-6=0 bad=0
map B build (instances 186): scalars=7955 exact=7955 within1e-6=0 bad=0
color: getHex cases=2048 mismatches=0; Math.pow cases=6144 mismatches=0; Math.hypot cases=2048 mismatches=0; preset cases=24 mismatches=0: scalars=15360 exact=15360 within1e-6=0 bad=0
test color_math_matches_three ... ok
map C build (instances 1802): scalars=42162 exact=42162 within1e-6=0 bad=0
map C fog (2 calls): scalars=45600 exact=45600 within1e-6=0 bad=0
map D build (instances 3783): scalars=82699 exact=82699 within1e-6=0 bad=0
map E build (instances 4817): scalars=105234 exact=105234 within1e-6=0 bad=0
map F build (instances 732): scalars=18938 exact=18938 within1e-6=0 bad=0
TOTAL build: maps=7 instances=11605 scalars=271747 exact=271747 within1e-6=0 bad=0
test terrain_build_matches_web ... ok
map F fog (2 calls): scalars=17100 exact=17100 within1e-6=0 bad=0
TOTAL fog: calls=16 scalars=80332 exact=80332 within1e-6=0 bad=0
test terrain_fog_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.19s

EXIT=0
```
