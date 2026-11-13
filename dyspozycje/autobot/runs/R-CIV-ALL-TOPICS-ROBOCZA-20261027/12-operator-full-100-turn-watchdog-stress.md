# AutoBot operator — full large-empire stress after EOT watchdog guard

Date: 2026-10-28 UTC
Candidate: `integration/robocza-all-topics-20261027`, HEAD `99bb834c6fe158d3bc59eb741f8fde9637b77027`
Scope: one full 100-turn live stress attempt, no retry, no product changes, no merge/deploy/push.

## Guard and build evidence

Static inspection of `gra/src/main.ts` confirmed `activeWorldEndTurnPipeline = true` is set before the asynchronous world EOT pipeline starts, and the `finally` block resets it to false before clearing transition state. In `healStaleEndTurnBlockers()`, all three passive stale-clear branches are conditional on `!activeWorldEndTurnPipeline`; the force-clear branch remains available only when the pipeline is not active.

A fresh Vite single-file build completed (911 modules). The compiled file is `/tmp/large-empire-stress-37176-efzk9u/index.html` (70,007,165 bytes; SHA-256 `70c9e1ebdc7fed017a2e4c9a1b13007fc54bc46677f6bc934d45e5f53caa722e`). Minification renamed the guard to `R1`. The compiled watchdog logic around `[EndTurn] Force-clearing stuck transition (>8s)` contains `!R1` on every passive stale-clear branch, including the `k>8e3` force-clear branch. Thus this exact guard was in the bundle exercised by the test.

## Workload and outcome

The one run seeded 137 cities: player 0 had 40; six major AI owners `[1,3,5,7,9,11]` had 15 each; seven city-state owners had 1 each. It seeded 180 improvements and five buildings per city: stolarnia, spichlerz, targowisko, koszary, biblioteka. Initial state: turn 1, 21 units, 396 render calls / 1,387,068 triangles, JS heap 441,804,917 bytes.

The scenario advanced through 38 completed EOTs and stopped on the first configured 60-second breach while attempting turn 39→40. The timeout sample reports 77,678 ms wall time (the timeout path includes post-wait state collection), world turn 40, 142 cities, 70 units, `endTurnInProgress=true`, gate/filter true, `canEnd=false`, zero pending offers and no visible modal. The visible UI text was Civpedia content. The final console summary says 38/100 completed and stop reason `EOT timeout or blocker`; process exit code 2. This is a stress failure at turn 40, not a completed 100-turn run.

At the failing transition, the final warning tail included repeated `[EndTurn] blocked: endTurnInProgress` and `[EndTurn] triggerPlayerEndTurn: DONE tura 40`; there were no force-clear messages. Across the whole run there were **0** `[EndTurn] Force-clearing stuck transition (>8s)` warnings, **0** stale-clear/orphan-transition clear warnings, **0** captured JS/page errors, and **0** yield-budget failures. The guard removed the previous 317 force-clear warning storm, but did not allow this scenario to pass the 60-second EOT gate.

Checkpoint telemetry:

| Completed EOTs | World turn | Cities | Units | Heap | Render calls / triangles / lines | Batch wall | Avg EOT | Max EOT |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 10 | 11 | 137 | 31 | 425.8 MB | 643 / 1,403,104 / 1,032 | 256.223 s | 24.181 s | 34.947 s |
| 20 | 21 | 137 | 77 | 564.6 MB | 675 / 1,406,628 / 1,032 | 298.298 s | 28.403 s | 33.722 s |
| 30 | 31 | 137 | 68 | 469.2 MB | 755 / 1,415,374 / 1,032 | 326.530 s | 31.206 s | 38.851 s |

For the 39 recorded EOT phase profiles, cumulative phase summaries show major costs: `runWorldEndTurn_total` 928.885 s total, 23.818 s average, 69.796 s max; `runAiPhase` 466.500 s total, 11.962 s average, 37.545 s max; asynchronous autosave 353.221 s total, 9.057 s average, 22.487 s max; city economy 174.903 s total, 4.485 s average, 12.963 s max; `scanAutoSiegesAfterAiTurn` 134.792 s total, 3.456 s average, 30.734 s max; AI preplanner 248.653 s total over 417 calls, 596 ms average, 5.846 s max; trade-route recompute 81.131 s total, 2.080 s average, 4.251 s max. These timers overlap by design and must not be summed as exclusive wall-time components.

## Ownership changes

The prior player city count decrease and AI gains recurred. By world turn 11, player owner 0 had 39 (down from 40) and AI owner 1 had 16 (up from 15). At turn 21 the same split remained. By turn 31, player 0 remained at 39; AI owners 1/3/5/9/11 had 17/16/16/16/16, respectively. At world turn 39 (last completed EOT), the owner counts were player 0:39; AI 1:17, 3:18, 5:16, 7:15, 9:17, 11:16; city-state owners 8 and 13:1 each. Total was 140. At timeout snapshot world turn 40 total was 142. The run records the city ownership state, but does not establish whether every change represents a legitimate conquest or an ownership bug; this needs separate gameplay triage.

## Artifacts and limits

- Summary JSON: `/tmp/large-empire-stress-summary-37176-efzk9u.json`
- Timeout screenshot: `/tmp/large-empire-stress-timeout-37176-efzk9u.png`
- Built candidate: `/tmp/large-empire-stress-37176-efzk9u/index.html` (the temporary build directory is removed by harness cleanup; hash/size are in the JSON)
- Harness: `gra/tools/perf-large-empire-stress-live-test.cjs`, invoked once as `STRESS_COMPACT=1 node tools/perf-large-empire-stress-live-test.cjs 100`.

No source changes were made by this operator. This run confirms the specific watchdog clear loop no longer appears, but the large-empire workload still breaches the 60-second EOT criterion at turn 39→40 and leaves the transition busy. The phase profile identifies AI, autosave, city economy, and siege scanning as significant measured areas; this evidence does not authorize changing autosave cadence or establish which phase alone caused the terminal transition state. The exact t40 behavior (world turn advanced, `DONE` logged, busy flag remains true) and ownership shifts warrant separate narrow investigation before another runtime attempt.
