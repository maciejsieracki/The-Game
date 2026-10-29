# R-BITWA-MANUAL-MELEE-ATTACK-STUCK-Q1 — operator findings

Status: production-path cause identified and patched; focused regression and bounded production Chromium A/B pass. Candidate remains uncommitted and is ready for independent evaluation.

## Baseline and cause

The 42-per-side production-method matrix was run before the patch with paired `steady`/Atak and `aggressive`/Szturm doctrine fixtures. With engaged positions (distance 1), one attack priority, and 12 activations:

- Atak: 14/14 infantry idle, zero infantry moves and zero melee attacks; the same scenario had 96 archer shots and 10 chariot melee actions.
- Szturm: 168 infantry melee attacks and no idle infantry; ranged and mounted controls also acted.

The Atak-only dead end was in `_advanceStep`: when `_canAttackFrom` returned true at the unit's current tile, the function called `done()` and returned. Szturm had a separate adjacent-target dispatch, so it did not enter this dead end. The formation-step filter was not the cause: the follow-up 24v24 controlled trace shows legal forward candidates at columns 11 and 12 accepted, and the first warrior advances from column 10 to 12 before reaching adjacency.

The fix dispatches `_pickAdjacentTargetByPriority` and `_doAttack` when the line-advance path finds a legal attack position. If there is no adjacent living target, it still ends the activation without fabricating an attack.

## Verification completed

`node gra/tools/battle-melee-attack-doctrine-test.cjs` passes after the fix:

- Same 24 attacker and 24 defender warrior IDs and starting positions, Atak/Szturm paired from distance 3.
- Each side advances into adjacency; next tick attacks. Atak and Szturm each produce 72 legal melee events total (24 attacker-side hits plus both sides' follow-up blows) and 720 HP loss in the focused adapter.
- Empty-target control produces no attack.

Full event and line-candidate evidence: `02-focused-production-method-regression.json`. Pre-fix matrix evidence, including the baseline trace and controls: `01-baseline-doctrine-matrix.json`.

## Chromium run — completed

The full-game 28v28 browser attempt rendered the world-map plus battle canvases but saturated the Chromium GPU process and did not return usable input/trace within the test window; its diagnostic artifacts are retained under `evidence-chromium/`. The bounded follow-up opens the actual production `BattleScene` in Chromium and keeps a 28v28 roster/occupancy. Because the stock preset's Hastati have two pila and the Greek front line is Falanga, the entry fixture replaces the first ten front-line slots per side with `units.json`'s real plain Stone Age Wojownik row. Runtime flags are derived normally by `BattleScene`; the browser harness does not override `rangedBase`, `phalanx`, or other role flags. It probes one real infantry, archer, and cavalry unit per side. A dynamically selected clear production lane starts the infantry probe three tiles from its target. Both Atak/Szturm runs use deterministic positions and combat RNG.

Result: **PASS**. In Atak the production Warrior advanced two hexes from distance 3 to adjacency, then attacked on its next activation; the scenario recorded three melee strikes and two actual HP-loss events. Szturm recorded two melee strikes and one HP-loss event. Archer safety checks recorded four shots in Atak and one in Szturm; mounted units performed 14 actions in Atak. The 28v28 roster contained 20 Warriors, 20 ranged units and 16 mounted units. There were zero page/console errors, and the post-battle scene screenshot was saved. Raw evidence: `evidence-chromium/paired-attack-charge-trace.json`; screenshot: `evidence-chromium/battle-scene-after.png`.

The browser run directly covers both line advancement and the adjacency-to-attack transition for ordinary production infantry. It is a bounded probe in the full production scene, not an all-56-unit activation soak; archer/mounted checks are regression controls, not exhaustive behavior validation.

## Reverification

- `node gra/tools/battle-melee-attack-doctrine-test.cjs` — PASS; 24v24, Atak and Szturm each 72 melee events overall and 720 HP loss in the controlled adapter; empty-target control remains a no-op.
- `node gra/tools/battle-manual-melee-browser-test.cjs` — PASS; production Chromium scene, 28 units per side, melee/ranged/mounted probes, Atak and Szturm HP-loss evidence, zero browser errors.
- `node gra/node_modules/typescript/bin/tsc -p gra/tsconfig.json --noEmit` — PASS.
- `git diff --check` — PASS.
