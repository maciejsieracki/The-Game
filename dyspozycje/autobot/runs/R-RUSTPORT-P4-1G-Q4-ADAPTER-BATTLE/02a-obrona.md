# 02a — Obrona Operatora — R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (renderer DTO adapter, battle map)
TEMAT: R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE
GOAL: `BattleSetupDto` → `BattleUnitsOpts` + `FortDto` per pin `07d2fbd72`, with no default values in place of missing data.
ZMIANY/COMMIT: the defense commit on top of the Operator's `04283b653` (base `origin/rust-port/parity-v2` = `b90894920`), branch `obrona/R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE`, worktree `.claude/worktrees/wf_304cdf8e-350-3`. Files, all on the allowlist: `rust-port/renderer/src/view/battle.rs`, `rust-port/renderer/tests/view_adapter_battle.rs` and this report. `view.rs`, view-model and `gra/` were not touched. `Cargo.lock` is not committed.
TESTY: see §Bramki.
BLOKADY: none for this topic. The dependencies for the orchestrator are in charges 2 and 5.
RUNDY: 1/5 (Operator defense after Evaluator r1)
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NOT DONE (no push, no integration)

Pin: `07d2fbd72`, `gra/src/battle/battleScene.ts` (below `BS`) and `gra/src/game/city-towers.ts` (`CT`).

## Responses to the charges

### 1. The `siege: true` mutation survives (no non-siege vector). PRZYJMUJĘ

Fix:
- New test `field_battle_maps_to_web_inputs`. It sets `siege=false`, `deploy=None`, `player_side=Atk`, `desert_palette=false` and fort `None` (`FortKind::None`, `tower_material: None`, `tower_rows: []`). It then checks the result with a **full** `assert_eq!` against the input built as the web builds it (`FortDto::none()`, `siege: false`, `deploy: None`). It also checks that the scene has no wall (`a.wall.is_none()`). Pin citations: BS:3479 (`if (opts.siege)`), BS:3484-3485 (`_deployMode = opts.deploy === true`, `deployPlayerSide ?? 'atk'`), BS:4160-4161 (`towerMaterialFor('none') === null`).
- `siege_without_civ_is_an_error` now checks the value of `opts.field.siege == false` and `siege_civ == ""`, not just `is_ok()`.

Proof (mutation run with `mut.sh`, in the scratchpad):
- `siege: s.siege` → `siege: true`: **FAIL** (2 tests: `siege_without_civ_is_an_error`, `field_battle_maps_to_web_inputs`). Before the fix this mutation passed 11/11.
- `siege: s.siege` → `siege: false`: FAIL (3 tests).
- In addition, `desert_palette: true` → FAIL (`field_battle_maps_to_web_inputs`). Before the fix the fixture had only `true`.

### 2. No production caller of `battle_inputs` / `battle_view_inputs`. PRZYJMUJĘ as a note for the orchestrator (no code change, which would be outside the allowlist)

Facts (grep on the working base):
- `BattleSetupDto` appears only in `view-model/src/{lib,battle}.rs`, `view-model/tests/*` and the adapter with its test. **The engine has no producer of `BattleSetupDto`**, so there is no production input for the adapter.
- The Q3 adapter (`city_renderer`, `owner_emblem_context`, …) also has no caller outside `src/view/` and `tests/`. The plan `P4-1G-ADAPTER-ROZPOZNANIE.md` §7 says plainly that wiring is outside the adapter ("Poza adapterem (do rozpisania przez orkiestratora): R1–R6 … jako tematy renderera"). §6 names B-1I (D-DTO-7 + P4-1I, #218) as the unresolved battle dependency.
- The topic that will wire it in: **none exists**. The orchestrator should register two dependencies: (a) a `BattleSetupDto` producer in the engine (army/terrain/fort at battle start; it fits under P4-1I or as a separate topic like P4-1B…F); (b) a battle-scene integrator that calls `view::battle_inputs` → `build_battle_scene_with_units_fort` (an R-type renderer topic or W8). Until then the adapter is covered by tests only, the same way as Q2/Q3.

### 3. The fixture is hand-built and `tower_rows` was not computed with the pin's `towerRows`. PRZYJMUJĘ (for values the pin computes) / ODRZUCAM (for values the pin only carries)

Fix (accepted part):
- `tower_rows` in the fixture is now the constant `TOWER_ROWS` = the output of a **run of the literal pin text** `CT:47-57` (`towerRows`) in Node (`node --experimental-strip-types`) for the call `BS:4169-4173` with the pin inputs: `rLo = 0`, `rHi = BF_ROWS - 1 = 155` (BS:4036-4039, BS:662), `siegeGateRow = PLAY_MID_ROW = 77` (BS:4042-4046, BS:666-672), `gateRowLo/Hi = 76/77`, `spacing = 4` (BS:4162, `gra/data/miasto-params.json:104-105`, `CT:29`). Result: 39 rows `[2, 6, 10, …, 74, 78, …, 154]`, with gate rows 76-77 skipped. The old values `[66,70,80,84]` were not a pin result: 80 and 84 are not on the 4-row grid from 2.
- The scene test now expects `TOWER_ROWS.len()` (39) towers instead of 4.
- `Legionista` `ammo=2` comes from the pin comment BS:1436-1441 (`Ilość pocisków = 2`), and `None`/Infinity comes from BS:1444-1446. These were already cited.

Rejected part, with evidence: `col`/`row`/`facing`/`hp`/`max_hp`/`morale`/`morale_max`/`owner_color` in `BattleUnitSpawnDto` are **not computed by the pin at the adapter level**. They come from the army taken from the game state (the producer's input; BS:4512-4560 copies them into `RuntimeBattleUnit`). No number from the pin can be the "expected" value for this function. The only correct expectation is a 1:1 copy, and the fixture checks that with distinct values, so a field swap is visible (`hp 87.5 ≠ max_hp 100`, `morale 60 ≠ morale_max 100`, the three units have different `col`/`row`). The comment at the top of the test file now states this split (computed values from a pin run, carried values 1:1).

### 4. No check that `deploy` and `player_side` agree. PRZYJMUJĘ

Fix:
- New variant `BattleAdapterError::DeploySideMismatch { deploy, player_side }`. `battle_inputs` returns it when `deploy == Some(d)` and `d != player_side`. Pin: one field `_deployPlayerSideOpt = opts.deployPlayerSide ?? 'atk'` (BS:3485) is both the deploy side and `_playerControlSide()` (BS:12396-12397), so the web cannot produce this pair. With `deploy == None` any `player_side` is valid (`?? 'atk'`, deploy off).
- Test `deploy_side_other_than_player_side_is_an_error`: (Atk, Def) and (Def, Atk) → error; `deploy=None` → OK.
- Mutation `if d != s.player_side` → `if false && …`: **FAIL** (1 test).

### 5. Dispatch erratum (§ZAKRES item 2, "FortDto None → INFINITY"). PRZYJMUJĘ as a note for the orchestrator (no code change; the implementation already follows the pin)

Evidence: `INFINITY` applies only to unit `ammoLeft`/`ammoMax`: `ammoCount` → `return Infinity` (BS:1444-1446), `ammoLeft: ammo0, ammoMax: ammo0` (BS:4512, :4553-4554), DTO `Option<f64>` (`view-model/src/battle.rs:76-80`). The fort has no numeric field that could be `Infinity`. `tower_material: None` = `towerMaterialFor('none') === null` → `return` before towers are placed (BS:4160-4161), so it stays `None`. The orchestrator should fix §ZAKRES item 2 in the Q4 dispatch and in the register, so Q5, Q6 and P4-1I do not repeat it. Suggested wording: "`ammo_left/ammo_max: None` → `f64::INFINITY` (BS:1444-1446); fort `tower_material: None` → `None` (BS:4160-4161)".

## Gates (in `rust-port/renderer`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` in the scratchpad outside the repo)

- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --all-targets --no-fail-fast`: EXIT 0. 67 suites, **550 passed**, 0 failed, 0 ignored (r1: 548; +2 new tests).
- `view_adapter_battle`: 13 passed, 0 failed, 0 ignored.
- `git diff --check`: clean. No `#[ignore]`, no weakened assertions: the old `is_ok()` was strengthened and the tower assertion now uses the pin value.

## Mutations (each must FAIL; the file was restored afterwards and 13/13 is green)

| Mutation | Result | Failed tests |
|---|---|---|
| `siege: s.siege` → `true` (charge 1) | FAIL | 2 |
| `siege: s.siege` → `false` | FAIL | 3 |
| `DeploySideMismatch` check disabled (charge 4) | FAIL | 1 |
| ammo `None` → `0.0` | FAIL | 6 |
| fort `tower_rows` dropped | FAIL | 4 |
| fort `tower_material` dropped | FAIL | 4 |
| `player_side` swapped | FAIL | 5 |
| `desert_palette` → `true` | FAIL | 1 |
| `deploy` → `None` | FAIL | 4 |
