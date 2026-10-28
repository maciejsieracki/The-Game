# R-CIV-ALL-TOPICS-ROBOCZA-20261027 — Operator: bounded performance profiling

**STATUS: PARTIAL DIAGNOSTIC — NO PRODUCT CHANGE**
**ROLE:** Operator, focused follow-up for the late-game performance gate.
**BASE:** `integration/robocza-all-topics-20261027`, source HEAD `99bb834c6fe158d3bc59eb741f8fde9637b77027`.
**GOAL:** Get one phase-level EOT profile on the requested 137-city workload; do not rerun the 100-turn stress test or change autosave cadence.

## Workload and single live attempt

Ran exactly one end-turn with `STRESS_COMPACT=1 node tools/perf-large-empire-stress-live-test.cjs 1`. The test built 911 Vite modules into a temporary single-file bundle (69,912.79 kB), generated and seeded the requested shape (40 player cities, six major AI owners × 15 cities, seven single-city states; 137 total cities, 180 improvements, five buildings per city, 21 initial units), then completed one end-turn. No retry was run.

The checkpoint advanced from turn 1 to turn 2. Harness wall time was 16.143 s; EOT timer reported 14.541 s, while the injected phase timer reported 10.779 s. The result JSON is `/tmp/large-empire-stress-summary-35904-72lvgn.json`.

## Measurements available before harness instrumentation failure

- `recomputeTradeRoutesNow`: **575.5 ms**.
- Trade stock flow: **0.6 ms**; trade income aggregation: **0.4 ms**.
- `advanceCityEconomy`: **127.5 ms**.
- Auto-ration plus `advanceEmpireFood`: **18.7 ms**.
- City renderer sync inside the economy phase: **447.3 ms**.
- `city_economy_phase` before the profiling error: **1,250 ms**.
- Autosave snapshot construction: **16.4 ms**; synchronous JSON serialization: **25.5 ms**. The later autosave completion took 4.359 s asynchronously, so that duration is not synchronous turn blocking.
- AI phase: **5,129.8 ms**; owner preplanner segments summed to 4,755.3 ms (including AI diplomacy and UI yields), planner totaled 131.2 ms, command execution 205.8 ms. UI yields totaled 2,128.2 ms. Forced-war pairing was 0.5 ms, sister alliances 0.2 ms, AI-AI trade agreement generation 6.5 ms, and auto-siege scan 0.2 ms.
- Final city renderer sync: **483.2 ms**; fog refresh: **777.9 ms**.

This is an early-turn sample, not a measurement of turn 40. It does show that route refresh, autosave snapshot/stringify, and auto-ration were not multi-second operations on this seeded 137-city state. It cannot explain the documented turn-40 slowdown on its own.

## Instrumentation failure and limits

The harness recorded one console error: `ReferenceError: __profilePostFoodStart is not defined`. This is in the test-only source instrumentation around the post-food section, after the auto-ration/food phase. The economy wrapper caught it; therefore the measured EOT completed but skipped work after that point. The profile’s `city_economy_phase` and 10.779 s injected EOT duration are incomplete and must not be treated as a gameplay pass or as a complete turn-time result. The harness’s post-food counters are unavailable. There were no yield-budget failures. This was the only live attempt as requested.

## Bounded clamp microbenchmark (discarded implementation)

I briefly tested an owner-scoped input view for the player ration clamp and reverted the product/test edits after measuring the absolute benefit. On an in-memory 137-city fixture and 40 player-city queries, the current full-input calculation took **27.73 ms** and iterated 290,440 food rows; the equivalent owner-only views took **8.22 ms** and iterated 84,800 rows, with identical answers. That saves approximately **19.5 ms per turn**, far too little to address the 76.059 s turn-40 measurement. This micro-optimization is not in the current product diff.

The existing standalone trade-route benchmark (`node tools/trade-routes-limit-test.cjs`) passed **76/76** and measured 120 cities/15 owners at **1,282.52 ms cold / 381.33 ms warm**. Together with the single-EOT route measurement, this is not a sufficient explanation for a 76-second late-game turn.

## Recommendation

Do not claim the large-empire performance gate is resolved. The earlier full stress run still stopped at the turn-40 60-second gate (81.235 s wall / 76.059 s measured). Avoid speculative product changes to save frequency, diplomacy, or economy rules. The next profiling task should repair the test-only `__profilePostFoodStart` transform and obtain a resumable turn-40 snapshot or otherwise a one-EOT fixture that starts directly from a late-game save; replaying world generation and 40 turns is materially costly. The performance Evaluator’s report remains correct that the late-game failure blocks a complete release claim.

## Validation

- `node tools/autowyzywienie-rowny-wzrost-test.cjs`: **60/60** after reverting the temporary microbenchmark test block; before revert the temporary parity benchmark itself passed as part of **65/65**.
- `node tools/trade-routes-limit-test.cjs`: **76/76**, live 120-city route benchmark above.
- `npm run typecheck`: **PASS**.
- `git diff --check`: **PASS**.
- Product changes made by this Operator: **none** (the measured 19.5 ms optimization was reverted).
- Merge, deploy, push: **not performed**.
