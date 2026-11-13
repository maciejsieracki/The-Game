# Operator R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1 — bounded live run

**Outcome: PARTIAL, no product defect reproduced. Stage 8/11 remains incomplete.**

## Run

- Test: `gra/tools/battle-manual-control-multicycle-live-test.cjs`
- Isolated worktree: `/workspace/manual-control-multicycle-operator`, HEAD `6abc4ed3`
- Vite build passed: 70,045,201 bytes, SHA-256 `89714f1a5fc354e17367fc03add6a7edbc50a1a0045abc1c6cc928b9de78a39b`
- Production Chromium run opened an actual **28v28 mixed roster**: 30 ranged and 16 mounted overall; player roster had 20 ranged and 8 mounted.
- Map took about 77 seconds to finish generation. No page errors, console errors, or request failures were recorded.

## Passed observations

1. No-commander manual-control gate correctly blocked switching from Auto to Manual.
2. Production pointer orders were assigned to the exact clicked enemy and empty ground before the first activation. The full 28-unit player roster was selected.
3. The first 28-unit activation queue completed: round 1, `turnIdx=28`, all 28 units acted, queued IDs went from 28 to 0, and 8 units changed coordinates.
4. A second real production pointer order was accepted in round 2 and moved its formation group. The selected card was `atk27`; production `_collectOrderUnitIds()` applied the order to group `atk20`–`atk27`, so this was a subset of the army, specifically an eight-unit group. All eight got formation-offset destinations; the trace recorded several actual coordinate changes.
5. Tempo controls reached 16× and returned to 1× using production keyboard/buttons.

## Unverified / harness precondition failure

The additional attack-damage scenario did not execute. After the group move, the harness searched for an **upcoming, visible player unit** with a **visible enemy currently in legal strike range**. None satisfied all three conditions, so the harness stopped with:

`No visible upcoming player unit had an exact visible enemy in legal strike range after the two pointer-command cycles`

This is a test-fixture selection failure, not evidence of an in-game attack defect. It occurred before issuing that attack command; therefore the run has **no HP delta proof**, and did not reach attack-march. No product sources were modified.

## Artifacts and cleanup

Full timestamped log: `live-multicycle-406380-0p83sc/execution-trace.json`.
Screenshots and JSON samples (map ready, battle open, failure): same run directory.
The harness removed its own `/tmp/battle-manual-control-multicycle-406380-0p83sc` build, closed its browser and HTTP server. It did not touch any other process/profile. No commit, integration, deploy, or push.

## Next step

To finish stage 8, adjust only the harness fixture: select a targetable unit pair before the tested subset command or wait/advance until a legal strike pair exists, then exercise actual exact-target HP loss and attack-march threat-followed-by-waypoint movement. A new Chromium slot and bounded run are needed; do not infer PASS from this partial run.
