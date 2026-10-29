# Operator R3 closeout — R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1

**Status: BLOCK / PASS-WITH-NOTES for diagnosis; no product change.** The earlier four matrix REDs are fixture-horizon false positives. Correctly configured live Attack and Defense were observed in Chromium, but the requested extended steady-only runtime reached round 6 and then the page-wait timed out before it could emit a final action snapshot. Therefore this does not claim that Attack ranged firing is fully verified at the point units enter range, and is not a full pass for the combat behavior ticket.

## Baseline and scope

- Worktree: `/tmp/autobot-battle-closeout`; branch `autobot/R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1-r2`; base remains `9faffe32e29b3d1da8aa4238ed764d093d2fec9a`.
- No product source was changed. Changes are limited to the allowlisted matrix harness, live test harness, and evidence/report artifacts. No commit, integration, push, or deployment was performed.

## Four REDs and fixture lifecycle

`node gra/tools/battle-large-mixed-doctrine-matrix-test.cjs` produced **36 scenarios, 42 active units per scenario, 5 activations, no harness errors** after adding detailed traces. The four previous REDs occurred at a horizon boundary: at the start of the last activation no legal ranged target existed; production selection returned no target. The activation moved the unit toward its target, but the engine does not shoot again after a move within that activation. The sampled unit then finished one hex outside its firing range. Thus the assertion “it ended in range / near range, therefore it should have fired this turn” was invalid.

The fixture reset per-turn activity (`acted`, move allowance, player order) once per unit while preserving positions, occupancy and ammunition. It did not restore units to starting positions between turns. It does use a test action recorder for this matrix, so it is useful for movement/selection timing, not proof of production damage or projectile rendering.

A focused seven-activation run, `BTF_TURNS=7 BTF_DOCTRINES=steady BTF_LINES=2,3 BTF_TERRAIN=engaged node gra/tools/battle-large-mixed-doctrine-matrix-test.cjs`, produced **4 scenarios, no harness errors**. The former units then selected legal targets and spent ammo on a later activation: lines=2 archer and slinger fired on activation 6; lines=3 slinger on activations 5 and 7. This supports a horizon explanation for those four REDs, but does not substitute for live damage evidence.

## Production Chromium observations

Corrected live run: `/tmp/battle-doctrine-r3-evidence-285646-xgekzl/active-doctrine-r3.json` (copied to `chromium-correct-doctrines-r3.json`), using a 28v28 production BattleScene with 30 ranged and 16 mounted units. Crucially, the harness waited for `START WALKI` and configured doctrines after initialization using production `_setGroupDoctrine`: attacker `steady` (Atak), defender `defensive` (Obrona). This is the valid run; it fixes the prior pre-init setup that was reset by scene initialization.

At round 4 the captured production actions were:

- `shot-start`: defensive 14, aggressive 11, steady 0.
- Completed shots: defensive 14 (4 caused observed HP loss), aggressive 3 (2 caused HP loss), steady 0.
- Actual mounted moves: steady 97, aggressive 77.
- Browser page/console errors: 0.

The previous run `/tmp/battle-doctrine-r3-evidence-284343-j6va78` recorded 7 steady HP-loss shots, but is **invalid for doctrine attribution**: it assigned doctrine before the battle initializer, which reset it. The “steady” events cannot establish that Attack fired; the correctly configured run confirms it was the defender’s actual Defense setting that shot. Do not count the earlier seven as Attack evidence.

The corrected round-4 setup began with opposing lines 6–8 hexes apart; ranged reach in this battle was 2. At round 2 the attacker’s ranged formation had not entered legal range; at round 4 some were still at distance 3. No steady target pick is therefore consistent with no legal target through the measured horizon, not evidence that `_executeGroupDoctrineStep` ignored a legal shot. `_executeGroupDoctrineStep` checks `_pickRangedTargetByPriority` before advancing in `steady` mode, so the next decisive observation is whether a steady unit fires after a subsequent activation makes a target legal.

I attempted that exact follow-up with Attack held steady and Defense held defensive through round 8. The actual Chromium page progressed to **round 6** (screenshot `chromium-extended-attack-timeout-round6-r3.png`) but the 120-second Playwright wait timed out before returning an in-page state snapshot. The run produced no final per-doctrine shot counts; it is explicitly incomplete, not a pass or failure. The actionable blocker is a faster deterministic live setup or a bounded per-round state probe once a ranged unit becomes legally in range. No production heuristic was changed without a reproduced defect.

## Commands and validation

- `node gra/tools/battle-large-mixed-doctrine-matrix-test.cjs` — 36 scenarios, 0 harness errors (five activations; fixture action recorder caveat above).
- `BTF_TURNS=7 BTF_DOCTRINES=steady BTF_LINES=2,3 BTF_TERRAIN=engaged node gra/tools/battle-large-mixed-doctrine-matrix-test.cjs` — 4 focused scenarios, 0 harness errors; former REDs fire after later legal activations.
- `node tools/battle-doctrine-live-r3-test.cjs` from `gra/` — corrected live 4-round run: actual production shots, HP changes, mounted movement and zero browser errors; runner’s original overstrict assertion requiring Attack hits in that short horizon failed (the captured evidence records the actual doctrine counts). The 8-round steady-only follow-up timed out at round 6 as described above.
- `git diff --check` — must be run again after this report is written; no product source diff exists.

## Handoff

Keep the ticket open. The next operator should instrument each production ranged unit’s current enemy distance/range and ranged picker result per activation in the correctly initialized Chromium scene, then wait only until one Attack unit is in legal range and verify `_doRangedAttack`, ammo decrement and target HP loss. If it is legal and no shot is selected, capture the blocking predicate and repair only that proven root cause. Preserve a separately configured Defense group in the same run or use a second actual UI/model-configured run. Do not reuse the pre-init run as evidence for Attack.
