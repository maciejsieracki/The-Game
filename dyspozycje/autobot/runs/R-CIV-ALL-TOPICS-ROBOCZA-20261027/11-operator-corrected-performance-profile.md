# R-CIV-ALL-TOPICS-ROBOCZA-20261027 — Operator: corrected bounded EOT profile

**STATUS: DIAGNOSTIC COMPLETE — LATE-GAME GATE STILL OPEN**
**ROLE:** AutoBot Operator, one corrected single-EOT profile.
**BASE:** `integration/robocza-all-topics-20261027`, source `99bb834c6fe158d3bc59eb741f8fde9637b77027`.
**SCOPE:** Test harness timer scope only; no product logic changes, no autosave cadence change, no full late-game rerun.

## Harness fix and validation

The prior profile injected `const __profilePostFoodStart` inside the nested food `try`, but read it after the sibling siege `try/catch`; the lexical binding ended with the food `try`. The harness now declares `let __profilePostFoodStart = 0` in the enclosing economy scope and assigns it at the post-food start anchor. A transform assertion verifies one declaration, one assignment, and one read in source order.

Validation before the live attempt:

- `node --check tools/perf-large-empire-stress-live-test.cjs` — PASS.
- `STRESS_BUILD_ONLY=1 node tools/perf-large-empire-stress-live-test.cjs 1` — PASS; all 911 modules transformed and the single-file build completed. The browser workload was not launched by build-only mode.
- `git diff --check` — PASS.

## One corrected live attempt

Ran exactly one corrected profile: `STRESS_COMPACT=1 node tools/perf-large-empire-stress-live-test.cjs 1`. It seeded 40 player cities, six major AI owners with 15 cities each, seven single-city states, 137 cities total, 180 improvements, five buildings per city, and 21 initial units. It completed the only requested EOT, advancing turn 1 to turn 2. No retry or additional EOT was run.

- Harness wall time for the EOT: **19.496 s**; phase-injected `runWorldEndTurn_total`: **13.250 s** (difference includes outer UI/browser timing).
- JS/page errors: **0**; yield-budget failures: **0**.
- Result JSON: `/tmp/large-empire-stress-summary-36637-pplzzy.json`.
- Map setup generated 1,387,068 terrain triangles; sampled JS heap was 303 MB before and 328 MB after the EOT. This single sample is not a leak test.

## Complete phase measurements for this early turn

| Phase | Time |
|---|---:|
| `runAiPhase` | 7.118 s |
| └ owner preplanner segments (includes diplomacy and yields) | 6.672 s |
| └ UI progress yields (5) | 3.425 s |
| └ AI diplomacy subphase (13 owners) | 3.204 s |
| └ planner | 219 ms |
| └ command execution | 188 ms |
| `city_economy_phase` | 1.662 s |
| └ `recomputeTradeRoutesNow` | 565 ms |
| └ `advanceCityEconomy` | 113 ms |
| └ auto-ration + `advanceEmpireFood` | 18 ms |
| └ post-food HP/resource/siege loops | 510 ms |
| └ economy `cityRenderer.sync` | 455 ms |
| `final_refreshFog` | 750 ms |
| `final_cityRenderer_sync` | 485 ms |
| autosave snapshot construction (synchronous) | 17 ms |
| autosave JSON serialization (synchronous) | 29 ms |
| asynchronous autosave completion (overlaps EOT) | 5.248 s |
| AI-AI trade agreement formation | 5 ms |
| forced-war pairing / sister alliances / auto-siege scan | under 1 ms each |

The timer-scope failure is fixed: `postFood_hp_resource_siege_loops` recorded **510 ms**, and the single turn completed with zero errors. Synchronous autosave snapshot and serialization total about 46 ms in this sample; the asynchronous completion duration must not be counted as main-thread blocking.

## Limitations and next step

This is a corrected early-game EOT over the requested large city/building/improvement shape. It is not a late-game turn-40/100 profile: there were only 21 units and the game had just reached turn 2. It cannot explain or clear the prior confirmed failure at turn 40 (**81.235 s wall / 76.059 s measured**, exceeding the 60-second gate). No measured product optimization is justified by this run; no product source was changed.

Keep the late-game performance gate open. A useful next measurement requires starting from a preserved turn-40 save/state and profiling that single EOT; another fresh world plus 40-turn replay is outside this run and was not attempted.

**Merge, deploy, push:** not performed.
