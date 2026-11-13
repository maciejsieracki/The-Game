# Evaluator — large-empire performance hotspots

**Run:** `R-CIV-ALL-TOPICS-ROBOCZA-20261027`
**Role:** independent evidence review / bounded profiler attempt
**Date:** 2026-10-28
**Product changes:** none
**Deploy status:** performance validation remains open; no deployment recommendation.

## Existing large-workload evidence

Read `/tmp/large-empire-stress-summary-31617-jj0zwn.json` (100-turn request; same workload: 40 player cities, six major AI owners with 15 cities each, seven city-state capitals; 137 cities initially, 180 improvements, five buildings per city). It completed 39 end-turns. The next completed end-turn advanced from turn 39 to 40 but took **81.235 s wall time / 76.059 s measured** and tripped the harness's 60-second stop gate. No JS errors or yield-budget failures were recorded in the completed portion. This is a confirmed large-workload performance failure at turn 40, not a 100-turn pass.

The top-level measurements below overlap only where explicitly noted:

| Rank | Measured phase | Mean / max | Interpretation |
|---|---|---:|---|
| 1 | `runAiPhase` | 13.369 s / 44.624 s per turn | Largest aggregate AI phase; turn 40 accounts for 44.624 s. Owner UI yields, diplomacy, planning and command execution are the main profiled subsegments. |
| 2 | `city_economy_phase` | 4.536 s / 13.173 s per turn | `advanceCityEconomy` itself averaged 176 ms (max 267 ms), so most economy-phase time is outside that function. Trade, ration, post-food, overlay and city-sync components need isolated timings. |
| 3 | `autosave_async` | 8.937 s / 20.941 s observed elapsed | This timer measures async completion latency and overlaps the turn; it is **not** 8.9 seconds of established main-thread blocking. Do not change autosave frequency on this evidence. |
| 4 | `final_refreshFog` | 1.133 s / 1.763 s | Material final render/update cost; requires confirmation after the pending AI-city render batching patch. |
| 5 | `barbarian_tick` | 1.438 s / 2.653 s | Nontrivial recurring phase, but not isolated to one safe optimization yet. |
| 6 | `final_cityRenderer_sync` | 707 ms / 1.137 s | Large repeated sync at turn end; the new dirty city-render batching patch changes founding-time syncs, but not necessarily this final sync. |

Across all 39 turns, recorded per-owner UI yields consumed 122.6 s total (175 yields, 701 ms average); AI diplomacy 115.8 s (415 owner records, 279 ms average, 4.911 s max); owner pre-planner segment 243.4 s (586.6 ms average); and command execution 72.7 s (175 ms average). These per-owner groups can overlap and must not be summed as disjoint wall time. Command-type timers attribute 32.4 s to moves, 14.5 s to builds, 12.3 s to attacks and 5.4 s to `foundCityAt` across the run. In turn 40, several owner command segments exceeded one second and two `foundCityAt` calls took about 1.10 s and 1.02 s each. These figures predate/are not a verification of the current `dirtyRenderSync` batching patch.

At turn 40 the measured top-level phase sum was 61.105 s against 76.059 s total, leaving **14.954 s unaccounted** by the harness's top-level phase attribution. The `autosave_async` completion row overlaps and must not be added to fill this gap. A focused breakdown is needed before assigning that remainder to a subsystem.

A separate controlled short A/B of owner-progress yielding reported all-yields mean 20.447 s versus coalesced mean 17.431 s (four turns per mode; 14.8% reduction, 3.016 s average). The evidence supports keeping coalesced rendering but does not resolve the late-game >60 s turn.

## Bounded attempt with the newer test-only probes

`node --check tools/perf-large-empire-stress-live-test.cjs` passed. I ran `STRESS_COMPACT=1 node tools/perf-large-empire-stress-live-test.cjs 4`; Vite transformed 911 modules and produced the temporary test build. The browser created the seeded workload (137 cities, 21 units, 180 improvements), and printed the pre-turn renderer/heap sample. Setup/world generation took approximately four minutes in this run. I interrupted the run before any end-turn action to honor the bounded-profile instruction; therefore the newly added AI subphase, trade/ration, synchronous autosave-snapshot and serialization probes produced **no turn rows**. This attempt is not a gameplay test result and was not retried.

The test harness has instrumentation anchors for AI pre-owner/forced-war/sister-alliance/AI-trade/auto-siege phases, city-economy trade/ration/post-food/overlay/sync phases, snapshot build and JSON serialization. These are test-only transforms, not product changes. Results are needed before selecting optimizations in those areas.

## Recommendation

Keep the large-empire performance gate open. A next Operator task should first obtain a sampled or resumable profile without replaying the expensive world generation; if that is not available, reduce harness setup cost through a test fixture/saved deterministic world (test-only) and then measure the unresolved turn-40 AI and economy subphases. The currently confirmed narrow opportunity is end-of-turn/AI render coalescing already under implementation; its late-game effect remains unverified. Avoid changing autosave cadence or broad AI/economy semantics absent synchronous phase evidence.
