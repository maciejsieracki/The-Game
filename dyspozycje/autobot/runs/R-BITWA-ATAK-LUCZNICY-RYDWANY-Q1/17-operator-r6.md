# Operator R6 — next Archer activation at the natural R5 range boundary

**Result: PASS for the specific near-range Archer selection and firing path; no product defect was reproduced.** The R5 `null` pick was measured before movement, at distance 4. That activation then moved the Archer to range 3 and ended; the following production Archer activation selected the target and launched a real projectile. The hit roll dealt zero HP damage, but ammunition decreased. This closes the R5 horizon question, not the broader report about all large-army formation behavior.

## Procedure

Command from `gra/`: `node tools/battle-natural-near-range-r6-test.cjs`.

The test opened the production battle through the ordinary deployment UI, used the same test-only pre-constructor 8v8 mixed roster filter as R5, and started the battle with **START WALKI**. To avoid replaying four slow rounds, the test paused the normal turn driver, hydrated the exact end-of-round-4 runtime coordinates, ranks, HP, and ammunition saved in `natural-formation-r5.json`, then called the production `_activateUnit` method for `atk60`. It left `_executeGroupDoctrineStep`, `_pickRangedTargetByPriority`, `_doAttack`, `_doRangedAttack`, and damage calculation real; wrappers only recorded their inputs and outputs. The battle was not allowed to advance into a full next round.

## Trace and diagnosis

The hydrated active unit was `atk60`, Archer / `Łucznik`, at `(31,75)`, rank 3, `formationOffset={dc:-2, dr:-1}`, Attack doctrine `steady`, range 3, and 12 arrows. Its nearest target `def0` was Phalanx at `(34,75)`, distance 3, alive at 38 HP. A friendly Javelineer `atk40` occupied `(32,75)` directly forward; Hastati `atk0` occupied `(33,75)`. Thus the front line did block the direct movement tile, but it did **not** prevent a ranged target selection.

The production picker selected `def0` at distance 3, then production `_doAttack` called `_doRangedAttack` and completed the projectile. Ammunition changed from 12 to 11. Target HP stayed at 38, so this shot missed its damage roll; the report does not count it as HP loss. Browser errors: zero.

The four neighboring candidates were also recorded. `(32,75)` was passable but occupied by `atk40`; `(31,76)` and `(31,74)` were passable, unoccupied, and accepted by `_compactAttackAllowsStep`; `(30,75)` was occupied and rejected by the compact gate. The previous-rank reference was `atk40` at `(32,75)`, and the attack rally point was `(34,76)`. `_rangedFiringStepStaysBehindMelee` returned false for the free candidates, but source inspection shows this helper has no product callsite, so its result did not control this activation. Since `atk60` was already in range, the normal doctrine step correctly selected a shot before any movement or compact-line gate was considered.

The earlier R5 round-4 record needs this coordinate correction: the actual end position of `atk60` was `(31,75)` (not `(31,76)` as summarized there). At the start of its round-4 activation it was `(31,76)`, distance 4 from `def0`; the picker returning `null` was correct then. The same activation moved it to `(31,75)`, distance 3, after the sole picker call. Units take one activation per turn, so the first legal picker call occurred on its next activation, which this one-action production replay confirmed.

## Conclusion and limits

The alleged friendly-line / compact-gate deadlock is not present in this near-range case: the front Javelineer occupies the forward tile, but the Archer has a legal range-3 target and fires on its next activation. The picker does not apply line-of-sight obstruction checks, and a friendly unit on the straight lane did not suppress the projectile path. Therefore no production patch is warranted from this evidence.

This is a production `_activateUnit` replay against an exact captured natural R5 state, with the production start control used before replay. It does not prove the ordinary round scheduler reaches this activation in real time, nor that every terrain/roster has a clear, timely route to range. The broader user concern that ranged units wander on some large battlefields remains open for a separate reproduced case. The R5 chariot result remains valid: real chariot movement and a production Charge melee action, with Horseman HP 56→32, were recorded there.

## Evidence and checks

- `natural-near-range-r6.json` — exact hydrated state, enemy distances, adjacent candidate passability/occupancy/compact-gate results, picker selection, production attack/projectile trace, and final ammo/HP.
- `gra/tools/battle-natural-near-range-r6-test.cjs` — one-activation test-only harness; filters to 8v8 before constructing `BattleScene`.
- `15-operator-r5.md`, `natural-formation-r5.json`, and R5 screenshots retain the natural formation and prior chariot evidence.

`node --check gra/tools/battle-natural-near-range-r6-test.cjs` passes. `git diff --check`, `git diff --cached --check`, and a no-index whitespace check for the R6 report pass. No production code changed; no commit, merge, integration, push, or deployment was performed.
