# Operator R5 — natural formation trace for Archers and chariots

**Result: BLOCKED for closing natural Attack Archer behavior.** Real Chromium evidence confirms the normal formation deploys the selected single Archer row and the Archers advance from their starting positions, but the bounded run ended before any attacking Archer received a legal target from the production picker or fired. A real War Chariot moved under Attack and moved/attacked under Charge. No product source change was justified by this trace.

## Run and setup

I ran `node tools/battle-natural-chariot-r5-test.cjs` from `gra/` on the R5 branch. The harness launched Chromium against a Vite build of the production game and opened the battle through the normal **START WALKI** UI. It selected an 8v8 mixed roster before constructing `BattleScene`, so all unit positions came from the ordinary formation placer. No unit coordinates were changed after scene placement. The test-only setup selected one Archer line through the real deployment UI control; the captured model value was `_deployArcherLines = 1`.

The attacker roster contained two Hastati, one Javelineer, three Archers (`atk60`–`atk62`), one Horseman, and one War Chariot (`atk82`, `Rydwan konny`). The defender had the corresponding 8-unit mixed roster. At deployment each attacking Archer had `rangedBase=true`, `canShoot=true`, range 3, 12 arrows, and rank 2; the three Archers occupied a single line at `(27,76)`, `(27,77)`, and `(27,78)`. The screenshot records this natural deployment. The trace records the normal scene setup and each subsequent activation, picker result, action, movement, and relevant ammo/HP state.

The runtime map is a small standard preset map with this pre-constructor roster filter. This makes the case deterministic and quick, but it does not reproduce every terrain/layout from a large campaign battle.

## Observations

The live watchdog captured 438 events through round 4; the battle had not finished and the harness reported zero browser errors. Each attacking Archer received four activations and four calls to `_pickRangedTargetByPriority`. Every picker result was `null`; all three still had 12 arrows at the end and no attacker-Archer `shot-complete` or HP-loss event occurred. Their recorded destinations show they moved from the initial line: final positions were `atk60 (31,76)`, `atk61 (28,76)`, and `atk62 (30,78)`. Thus this trace rules out the Archers simply standing still, but does not demonstrate that they reach legal firing range promptly. Since the picker never found a legal target, it does not show a failure to execute a selected legal shot.

The attacking group's recorded doctrine was `steady` (the game's Attack doctrine) for every activation. The harness configured the group after battle start through `_setGroupDoctrine`. The intended defender doctrine did not survive into activation traces: defender activations also reported `steady`. Therefore this run does **not** verify Defense behavior and should not be cited as a valid Attack-versus-Defense comparison. The same mismatch needs to be resolved in the test setup before using this harness for that comparison.

The real attacking War Chariot `atk82` moved from `(29,74)` to `(31,74)` while under `steady`/Attack. The test then changed its group to `aggressive`/Charge through `_setGroupDoctrine`; it moved onward to `(34,74)` and invoked the production melee path against defender Horseman `def80` at distance 1. The observed Horseman HP changed from 56 to 32. This is real chariot movement and a real melee result, not an inferred Horseman action.

## Verdict and next step

The user-reported ranged behavior remains open. Natural movement is present, but the bounded sample did not place an attacking Archer in legal range. No bug in the picker or firing path is established by a `null` target, and the earlier R4 manual-position test already shows that the production picker and projectile path work when an Attack Archer has a legal target. Do not claim that natural approach, Defense, or the full mixed-army doctrine matrix is closed based on R5.

The next useful step is a focused production trace that keeps the natural formation but creates a naturally reachable range-3 engagement on a clear route. It must verify the doctrine setters after scene initialization for each side, then record every Archer movement candidate and the first legal picker result. If the Archer reaches range and the picker still returns null, that provides a product-level reproduction; if it never reaches range, the movement candidate/occupancy trace will localize the blocker. No production change was made in this round because that root cause was not proven.

## Evidence

- `chromium-natural-formation-r5.png` — Chromium screenshot after selecting one Archer line in the deployment UI.
- `chromium-natural-final-r5.png` — Chromium screenshot at the end of the bounded live run.
- `natural-formation-r5.json` — initial roster/positions, one-line setting, final state and full event trace.
- `natural-formation-r5-watchdog.json` — latest periodic runtime snapshot; preserves the last observed state.
- `gra/tools/battle-natural-chariot-r5-test.cjs` — test-only live harness.
- Prior r3/r4 reports and artifacts remain unchanged.

`git diff --check` and `git diff --cached --check` both pass. No product code was changed. No commit, merge, integration, push, or deployment was performed.
