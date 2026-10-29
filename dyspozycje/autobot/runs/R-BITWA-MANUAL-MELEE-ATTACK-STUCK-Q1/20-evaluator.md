# Independent Evaluator — R-BITWA-MANUAL-MELEE-ATTACK-STUCK-Q1

Verdict: **PASS-WITH-NOTES** (stage 6/11). I reviewed the operator's uncommitted product diff and independently reran the focused logic and browser checks. No product files were edited by the evaluator.

## Findings

- Before the change, steady/Atak ended `_advanceStep` immediately when `_canAttackFrom` became true, without dispatching an adjacent target. The patched branch now selects an adjacent living target by priority and calls `_doAttack`; an empty-target control still ends without an attack.
- `TMPDIR=/workspace/tmp-melee-eval node gra/tools/battle-melee-attack-doctrine-test.cjs` — **PASS**. Same 24v24 warrior IDs and initial positions; both Atak and Szturm advance from distance 3, reach adjacency and produce 72 legal melee events and 720 HP loss in the controlled method adapter. Empty target remains a no-op.
- `TMPDIR=/workspace/tmp-melee-eval-browser node gra/tools/battle-manual-melee-browser-test.cjs` — **PASS** in the real production `BattleScene` renderer with 28 units on each side. Browser evidence shows six melee strikes under each doctrine, actual infantry HP-loss events (2 Atak, 1 Szturm), zero browser errors, and 14 mounted actions.
- `npm --prefix gra run typecheck` — **PASS**.
- `git diff --check` — **PASS**.

## Notes for Defense / Final Control

- The browser scene's preset has ranged/phalanx classification on the selected Hastati/Phalanx pair; the harness neutralizes those two role flags to test an unambiguous melee pair. Other production methods, stats, occupancy, rendering and combat dispatch remain active. Final Control should decide whether the browser probe is sufficiently representative alongside the 24v24 production-method regression.
- The Chromium check starts adjacent and demonstrates adjacency→attack. Movement from distance 3 to adjacency is proven by the 24v24 method test, not by this browser run. A free-running full-world 28v28 test previously saturated Chromium and did not yield usable evidence.
- The browser trace has no archer shots in its selected probe window; it should not be taken as evidence about ranged behavior. This ticket is specifically the Atak melee dead-end.

No merge, deployment or push was performed.
