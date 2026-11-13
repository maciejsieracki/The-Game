# Runtime follow-up: forced-GC city-panel cycles

- Checkout: detached worktree at `a1d8621290d107adc3ece82978d64aa6b7c4c0dc` (deployed base).
- Scenario: real generated game, six rivals, seed `1412026`; 20 repetitions of the measurement hook that calls the production `openCityPanelForPlayer` path and `closeCityPanelIfOpen`.
- Sampling: baseline after `HeapProfiler.collectGarbage`; on every cycle, sample after open + two animation frames + forced GC, then close + two frames + forced GC. Each sample uses CDP `Memory.getDOMCounters`, `Runtime.getHeapUsage`, and checks for remaining `.civ-ux-frame` / dim elements.
- Raw per-cycle data: `city-panel-dom-gc-series.json`.

## Results

| Counter | Baseline after GC | Post-close range (20 cycles) | Cycle 20 | Interpretation |
|---|---:|---:|---:|---|
| DOM nodes | 1,738 | 1,734–1,736 | 1,736 | No monotonic panel-node growth; late cycles settle at baseline −2 |
| JS event listeners | 247 | 245–250 | 249 | Small ±3 fluctuation; no accumulating per-open listener count |
| V8 heap used (CDP) | 91.44 MB | 92.28–93.83 MB | 93.14 MB | +1.70 MB at final sample; non-monotonic (fell ~1 MB at cycle 17), so not evidence of a linear leak by itself |
| `performance.memory.usedJSHeapSize` | 181.17 MB | 181.93–184.12 MB | 184.02 MB | +2.85 MB final; same non-monotonic shape |
| `.civ-ux-frame` and dim nodes after close | 0 / 0 | 0 / 0 | 0 / 0 | Panel root and dim overlay are removed every time |

Open and close synchronous medians were 115.9 ms and 44.7 ms respectively in headless Chromium/SwiftShader; maxima were 157.4 ms and 60 ms. These include this environment's renderer scheduling and should not be treated as player-device latency.

There was a one-time shift by cycle 6 (+2 nodes / +2 listeners relative to the earliest closed sample), followed by stable node counts and listener counts fluctuating between 248–250. This is consistent with deferred UI initialization or a small shared/global listener setup; it does not resemble per-open DOM/listener accumulation across these 20 cycles. Two console errors were only requests for absent `/favicon.ico` (HTTP 404); no page errors were recorded.

## Limits / next discriminating test

CDP `Memory.getDOMCounters` counts renderer DOM nodes globally and does not label them as attached versus detached. The selectors confirm the city panel root is absent after close, but this run did not take/parse a heap snapshot to identify arbitrary detached nodes and their retainers. Forced-GC global counts provide a useful repeated-cycle retention check, not a complete detached-node census. The remaining ~1.7 MB V8 delta is small and non-monotonic over 20 cycles; to attribute it, compare a heap snapshot after the first stable close with one after cycle 20 and inspect retaining paths, or run a longer same-page alternating no-op/open-close control. The separate active 100-turn run was not read, modified, or interrupted.
