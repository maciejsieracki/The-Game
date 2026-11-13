# AutoBot Operator — current direct AI siege scan

**Scope:** record one instrumented direct scan. No EOT, product edits, commit, push, or deploy.

## Run identity and fixture

- Bundle SHA-256 from the raw run result: `14b702de15f171b161f5a9cd085e72d3bbb3a1eb66c22e43f27e93543fc45a36`.
- Raw JSON: `/tmp/large-empire-direct-siege-75199-phhgnu.json`, SHA-256 `40294446fda5ca22a3c770e117bb7148d6978fbf1b5151c3e7f9881986cf8702`.
- Fixture: 137 cities, 57 units; eight staged targets, four empty and four with one defender; four attackers adjacent to each; AI owner 1 against player owner 0.
- This was a direct call to `scanAutoSiegesAfterAiTurn()` without a world EOT.

## Measurements and outcome

The instrumented scan took **12,412 ms**, of which eight `executeSilentSiegeStorm` calls accounted for **12,408.6 ms**. Validation was 0.1 ms, detection 0.2 ms, and stance decisions 0.7 ms total. All eight stances were assault; no siege-start calls occurred. The four empty captures took 1,584.8–1,705.5 ms each; four defended captures took 1,408.4–1,566.0 ms each. The profiler recorded 0.0–0.4 ms for per-battle strength resolution and negligible roster/defender calculations.

Renderer/state phase rows sum to roughly 9.0 s across captures: `cityRenderer.sync` 3,059.8 ms, `refreshFog` 5,350.3 ms, `applyCityCaptureToMap` 666 ms, and `applyMapBattleOutcome` 668.9 ms. These nested rows overlap the per-storm and `afterSiegeUi` timers; they must not be added as exclusive totals. The live scan changed all eight staged city owners 0→1; each capture callback observed `relation.status='wojna'` and `peaceLocked=false`. Capture events were recorded for all eight; units decreased 57→53; `errors` was empty.

## Comparison and limits

The older direct fixtures in reports 13/20 recorded about 18.27 s for eight captures, and report 31 recorded 15.445 s for a closely related mixed fixture after the successful-siege first-sync omission. This current 12.412 s result is lower, but the fixtures/runtimes are not controlled A/B runs and environment variance is possible. In addition, the direct scan timer surrounds the synchronous scan call and excludes deferred RAF callbacks. The current source coalesces the eight synchronous captures' pending cleanup callbacks into one, as verified by the extracted-function test in report 56; this run does not measure the time saved by that coalescing. Do not attribute the observed scan-time difference causally to either recent optimization.

The evidence continues to localize the bulk of this synthetic scan to capture projection/fog work rather than pure siege calculation. `refreshFog` and its discovery/state effects were not skipped or batched. This direct scan is not a late-game EOT and does not clear the 100-turn or 60-second gate.

## Source identity at report time

The raw result contains the bundle digest and scan data, but not a pre-build source-tree digest. Current shared source hashes at report time:

- `gra/src/main.ts`: `39d9198daab6436a7a988f62f4e2d8cd3b6e8faaa8f188a730cea897023ef365`.
- `gra/tools/perf-large-empire-stress-live-test.cjs`: `e5bbf93c29cc0d67b014565944256a7ed1c82d394e675651be42d7e5c5e340a4`.
- `gra/tools/capture-render-sync-test.cjs`: `e72b697f0fcd0f17270d670b8e547087fc61e93f17fd3b47a3f80cb3b040d3dd`.
- HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`.

These current-source hashes identify the worktree at report time; they are not asserted as the exact source hashes used to produce the bundle.
