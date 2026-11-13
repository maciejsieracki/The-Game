# Evaluator — large-empire stress harness

**STATUS: PASS-WITH-NOTES for workload setup and instrumentation; performance release gate remains open.**
**ROLE:** read-only independent review; no browser run or product edits.
**SOURCE:** branch `integration/robocza-all-topics-20261027`, base HEAD `99bb834c6fe158d3bc59eb741f8fde9637b77027`.

## Scenario coverage

`gra/tools/perf-large-empire-stress-live-test.cjs` builds the standard-map variant, starts six major AI rivals (`rivals: '6'`, `civTypes: 7`, fixed seed `1412026`), then uses the existing test hook to seed 40 player cities and 15 cities for each of the six majors. The recorded fixture has 137 total cities, including seven one-city minor owners, and 180 placed improvements. Each city added by the seeder is assigned the five building IDs `stolarnia`, `spichlerz`, `targowisko`, `koszary`, and `biblioteka`. The initial cities are not explicitly assigned these buildings by the seeder, and the fixture records only the building-ID list, not a count verified against every city's built state; thus it demonstrates expanded cities with buildings but does not prove all 137 cities have all five.

Improvement placement covers tin mines, copper mines, roads, and farms; it does not deliberately cover every improvement type (for example, iron mines). The city totals meet the user's minimum major-civilization shape. Seven one-city minors are additional workload, not part of the six major rivals.

The test uses the existing internal end-turn hook, which enters the same seat/end-turn pipeline, but moves player units home before every turn and resolves AI offers by clicking the real diplomacy UI's Reject action. It is a controlled engine-load test, not a normal-play acceptance test with combat and player movement.

## Instrumentation and results reviewed

The corrected post-food timer has one declaration in the enclosing economy `try`, one assignment after food advance, and one read after siege processing. The Vite transform explicitly asserts those three anchors occur once and in order. The operator report records successful `node --check`, build-only validation (911 modules), and one corrected turn 1→2 with zero page/JS errors and zero yield-budget failures. Exact test artifact: 70,007,165 bytes, SHA-256 `70c9e1ebdc7fed017a2e4c9a1b13007fc54bc46677f6bc934d45e5f53caa722e`; results are in `/tmp/large-empire-stress-summary-36637-pplzzy.json` and summarized in `11-operator-corrected-performance-profile.md`.

That one early EOT took 19.496 s wall / 13.250 s instrumented. Snapshot+JSON serialization took about 46 ms synchronously; async autosave completion is overlapping latency, not main-thread time. AI took 7.118 s, including 3.425 s for progress yields and 3.204 s for diplomacy. This validates the corrected timer and provides an early-turn profile only.

The earlier 100-turn-request run completed 39 EOTs and then took 81.235 s wall / 76.059 s instrumented to advance turn 39→40, tripping the 60-second slow-turn gate. It logged 317 warnings, including repeated `Force-clearing stuck transition (>8s)` during live EOTs. That run predates the independently verified active-EOT watchdog guard and is not evidence about the corrected candidate. Its JSON (`/tmp/large-empire-stress-summary-31617-jj0zwn.json`) recorded player city count dropping from 39 to 31 while two AI owners gained cities on turn 40; without the underlying event log this count shift alone cannot establish whether captures were lawful.

## Evidence limits and next gate

`build.identity.gitHead` records the committed base only, while product code was modified in the working tree. The artifact SHA/byte count identify the built HTML, but the run does not record a hash of the source diff; future stress receipts should pin both the artifact hash and `git diff --binary HEAD` hash (or the integrated source commit).

At evaluation time, a new full 100-turn run against the watchdog-fixed candidate was in progress and had not produced a result. The prior 100-turn result is a failure and the corrected one-turn result is not a substitute for late-game evidence. Therefore this evaluator **does not clear the large-empire performance gate and does not recommend deployment on performance grounds**. Review the updated full run's exact artifact, EOT timings, watchdog warnings, city ownership counts, errors, heap, and rendering metrics before deciding the next step.
