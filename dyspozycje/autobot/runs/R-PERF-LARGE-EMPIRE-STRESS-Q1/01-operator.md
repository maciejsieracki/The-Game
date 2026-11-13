# AutoBot operator report — large empire baseline

STATUS: INCOMPLETE — run stopped after 38 of 100 turns by the harness slow-turn guard.

## Scenario and identity

- Scenario: seed `1412026`; player 40 cities; six major AI civilizations with 15 cities each; 137 cities and 180 improvements at setup; developed cities include sawmill, granary, marketplace, barracks, and library.
- Source: `a1d8621290d107adc3ece82978d64aa6b7c4c0dc` (same source commit as deployed ROBOCZA).
- Harness: `gra/tools/perf-large-empire-stress-live-test.cjs` in isolated diagnostic checkout; no production-source diff.
- Renderer: headless Chromium using SwiftShader. Results are useful for trend diagnosis, not a direct GPU-performance comparison with the user's Windows machine.

## Results

- The harness completed turns 1–38. Turn 39 took 70,205 ms and exceeded the 60,000 ms guard; it then stopped normally with `stopReason: completed EOT exceeded 60000ms`.
- Checkpoints: turn 11 heap 413.7 MB, mean turn 27,968 ms; turn 21 heap 512.5 MB, mean turn 34,158 ms; turn 31 heap 413.0 MB, mean turn 36,552 ms. Heap values fluctuate, so these checkpoints do not show a monotonic JS-heap leak.
- At the turn-39 idle sample, Chromium process-tree RSS was 1,990.4 MiB. During the 30-second idle window it stayed near 2,044 MiB; CDP `JSHeapUsedSize` sampled from 235.8 MB to 246.9 MB and later 239.5 MB. The separate app instrumentation heap reading was 489.5 MB; keep these measures distinct.
- Idle interaction was severely blocked in this headless run: 35 frames in about 38 seconds, mean frame interval 1,196.6 ms, p95 2,016.5 ms, and all 35 frames exceeded 50 ms. A corrected pan probe was attempted separately but Chromium closed before the probe completed; there is no valid camera-delta result.
- T1's earlier interaction sample also did not validate map panning (`canvasPointerMoves: 0`); its wall-time numbers must not be treated as pan latency.

## Interpretation and limits

The run reproduces severe renderer unresponsiveness and process RSS near 2 GB under the large scenario, but it did not complete 100 turns. JS heap snapshots fluctuate and are much smaller than process RSS, so this does not isolate the full memory increase to retained JavaScript objects. SwiftShader and concurrent diagnostic browser startup may inflate wall-clock latency; do not infer user's hardware timings from this result. Continue with a serial run after sandbox cleanup, then test the new Robocza fixes separately.
