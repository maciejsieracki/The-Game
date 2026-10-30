# Operator report — mixed large-army combat and manual orders

**Branch:** `autobot/R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1`
**Base:** `origin/main` at `9f6f7771`
**Scope:** large mixed armies across Attack / Defense / Charge, ranged and mounted behavior, manual target and movement orders, commander gate. No merge, deploy, or push was performed.

## Confirmed defect and patch

Manual attack orders used a direct greedy step and only a couple of fallback directions. When those cells were blocked by an allied screen or terrain, the actor could stop even though an alternate path to its selected target existed. The same branch considered any unit with nominal range as able to strike at that distance, even after a primary shooter ran out of ammunition; `_doAttack` then treated it as melee, producing an illegal distant melee attempt.

`battleScene.ts` now checks `_canStrikeTargetFrom` for the currently selected target and routes out-of-range orders with `_firstStepAlongPathToAttack` (BFS), applying compact-line, no-immediate-backtrack, and blockade constraints. The BFS accepts an optional exact target so movement preserves the clicked target instead of switching to any nearby enemy. See `gra/src/battle/battleScene.ts:7935` and `gra/src/battle/battleScene.ts:17480`.

## Evidence and coverage

- `node tools/battle-manual-orders-routing-test.cjs` — pass. Executes production `BattleScene` methods headlessly with movement/attack adapters. Reproduces/retests melee, ranged, and mounted attack orders around an allied blocker and impassable tile; verifies a 42-member group gets the selected target, no move enters an occupied/blocked cell, loaded ranged attackers fire only within legal range, dry ranged units close to adjacency, and enemy-click versus empty-ground-click maps to attack versus move. An order retains its exact target while moving. When that explicitly selected target dies, the stale order is cleared; it does **not** auto-retarget. This test simulates raycast results and does not perform real browser clicks.
- `node tools/battle-manual-choice-contract-test.cjs` — 9/9 source-contract assertions pass. Verifies the pre-battle manual/automatic choice is not commander-gated and field-level individual control is gated. This is source inspection, not a live UI click test.
- `node tools/battle-ranged-mounted-doctrine-test.cjs` — 9/9 headless production-method assertions pass: defensive ranged fire/hold, steady ranged attack and advance, cavalry/chariot routing, and aggressive mounted maneuvers.
- `BTF_LINES=2 BTF_TURNS=12 node tools/battle-large-mixed-doctrine-matrix-test.cjs` — pass, 12/12 cases, 42 units per side, 12 activations. Crosses Attack/Defense/Charge (production doctrine labels: `steady`/`defensive`/`aggressive`), two target-priority sets, and engaged/corridor terrain. No illegal attacks or red conditions. This is headless: production activation, target selection, movement/formation planners execute, while `_doMove`/`_doAttack` are fixture adapters; no animation, damage, renderer, or visual collision is exercised.
- `BTF_ROSTER_SCALE=2 BTF_LINES=2 BTF_TURNS=6 node tools/battle-large-mixed-doctrine-matrix-test.cjs` — stress-only failure, 12 scenarios at 84 units per side, 6 activations. Seven ranged archers in steady/engaged cases remained 4–6 tiles away and made no progress. The fixture freezes enemy positions and applies no damage, so it can create permanent lines that a real battle would clear; do not treat this as a confirmed product defect. Trace is saved in `02-stress-84-per-side.json`; the passing representative roster summary is `01-max-42-per-side.json`.
- Current production battle constant is `MAX_PER_SIDE=120` in `battleScene.ts:688`. The gameplay matrix's 42-unit-per-side roster is a representative legal large-army scenario, not the code cap. 84/side is within the code cap but remains synthetic stress-only because this fixture has static occupancy/no damage.
- `npm run typecheck` — pass.

## Chromium live evidence

`battle-doctrine-live-r4-test.cjs` was run with `TMPDIR=/workspace/tmp-battle-operator`. The unmodified production battle opened at 28v28 with 30 ranged and 16 mounted units total. The test then isolated three real production archers against a production defender, started the battle through the real battle UI, and recorded production target selection and projectile attacks in round 1. All script checks passed; no page or console errors. Evidence is under `/workspace/tmp-battle-operator/battle-doctrine-r4-evidence-300511-zppp4c/`.

This is a real Chromium/WebGL production-scene and attack-animation test, but the deterministic probe changes the scene roster/positions and exercises AI attack, not a player's actual pointer-driven manual attack order. No broad browser UI test of manual orders has been completed.

The first strict 1-HP assertion incorrectly required `dead/fadingOut/removed` flags in the terminal one-defender case; the battle had already ended and cleanup invalidated those flags, so this was a harness flaw, not a product defect. The final live test keeps another defender active and checks HP plus occupancy instead. `battle-manual-orders-live-open-tile-deterministic-test.cjs` passed in Chromium: a production ranged hit changed target HP `1→0`, removed its occupied tile while the opposing army remained active, and produced no page/console errors. It is an instrumented production battle with controlled actors/positions and deterministic random rolls, not a full-size mouse-issued manual order test. Evidence: `/workspace/tmp-battle-operator/battle-manual-orders-live-open-tile-deterministic-evidence-307460-yhbsl3/;` the first strict terminal probe is intentionally not treated as a product failure.

## Manual-control assessment

Enemy-unit click issues an exact-target attack order; empty battlefield click issues a destination move order. Attack orders path to a legal target-specific firing or melee tile and remain attached to that target while moving. Losing that target clears the order. There is no separate ground-tile “attack-move” order that advances and autonomously engages units encountered en route; whether to add that Total War-style command is a product decision, distinct from the confirmed pathfinding bug.

## Status

The pathfinding and empty-ammunition defects are fixed in this isolated worktree and pass targeted headless production-method regression. Stage 10 operator evidence is complete; independent evaluation/final control and later integration remain for the parent workflow. Deployment and push were intentionally not run.

## R3 — Chromium multi-cycle manual-control acceptance

**Operator result: PASS-WITH-NOTES.** The production-source Chromium harness is preserved as `gra/tools/battle-manual-control-multicycle-live-test.cjs`; its run evidence is in `evidence/live-multicycle-r3/`. The harness was corrected after R2 so attack-march assertions start from the combat trace length at command issue, explicitly record routed/dead/removed state, verify eligibility immediately before the pointer command, and wait for an ordinary later-round activation without directly calling `_activateUnit` or resetting `acted`.

Live production run on Chromium: mixed 28v28 roster (20 ranged and 8 mounted per side); all 28 player units processed through the queued-order activation and the queue drained; eight changed position. A second-cycle subset pointer move dispatched and moved. Pointer exact-target attack reduced defender HP 80→62. Attack-march on `atk27` was issued while genuinely eligible (round 3, `turnIdx=26`, order index 27, `acted=false`). A new post-command event records `atk27→def0`; HP remained 1 because the defender routed (`routed=true`, `dead=false`, `removed=false`, `fadingOut=false`) and ceased to be an active route threat. On its ordinary round-4 activation, `atk27` retained `attackMove`, moved `(24,60)→(25,60)`, and reduced Manhattan distance to the waypoint from 4 to 3. All 20 live assertions passed; browser/page errors: 0. Test-scoped deterministic combat RNG was restored before normal round combat.

Additional checks on the integrated `main` source: `battle-manual-orders-routing-test.cjs` PASS; `battle-manual-choice-contract-test.cjs` 12/12; `battle-ranged-mounted-doctrine-test.cjs` 10/10; `npm run typecheck` PASS; `verify-robocza-bundle.cjs` and `smoke.cjs` PASS. R3 did not identify a product-source defect, so it introduces a regression harness and evidence only. A separate exact-target probe uses a controlled fixture and resets `acted`; this limitation does not apply to the attack-march path, which was naturally eligible.

Production bundle used for R3: SHA-256 `89714f1a5fc354e17367fc03add6a7edbc50a1a0045abc1c6cc928b9de78a39b`, 70,045,201 bytes. See `evidence/live-multicycle-r3/execution-trace.json` and `evidence/live-multicycle-r3/queued-order-lifecycle-two-cycles.json`.
