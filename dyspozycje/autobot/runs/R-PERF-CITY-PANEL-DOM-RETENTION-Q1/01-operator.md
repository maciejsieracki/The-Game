# Operator Report — City panel DOM/listener retention

STATUS: PARTIAL — static lifecycle audit complete; runtime retention not yet confirmed.
TASK: R-PERF-CITY-PANEL-DOM-RETENTION-Q1
BASE: `a1d8621290d107adc3ece82978d64aa6b7c4c0dc`

## Finding
The T1 probe reported CDP counters rising from 6,764 to 16,138 DOM nodes and 420 to 1,413 JS listeners across five real city-panel open/close cycles. That is a material signal, but it is not yet proof of a leak: the probe read `Memory.getDOMCounters` before forcing garbage collection, and it samples only before the first and after the fifth cycle. The measurement also runs in headless Chromium/SwiftShader on a 137-city, 1.39M-triangle scene, where the renderer is already heavily loaded.

Static source inspection did not find an obvious per-open global-listener leak:

- `showCityUxFrame()` first tears down an existing frame, builds a new subtree and attaches it to `document.body` (`gra/src/ui/cityUxFrame.ts:219-273`). `hideCityUxFrame()` unbinds the document keyboard handler, pops the Escape overlay, clears city-panel state, removes the frame and dim element, and nulls the mount/frame references (`cityUxFrame.ts:284-296`).
- City navigation uses one stored document `keydown` callback; every bind first removes the prior callback and teardown removes it again (`cityUxFrame.ts:127-153`).
- `clearCityPanelUxMode()` nulls `uxSectionRefresh`, `activeCity`, and `activeMap`, and calls `disposeHoverDetailDock()` (`cityPanel.ts:10546-10553`). The dock cleanup cancels timers, clears content, removes its mount references and resets its side state (`hoverDetailDock.ts:395-410`).
- The Escape overlay stack uses one shared document listener and removes it when the stack becomes empty (`escapeOverlayStack.ts:70-100`). The two `cityPanel.ts` document click/keydown listeners for technology hint links are module-level, guarded by `techHintLinkDelegationBound`, not installed per panel open (`cityPanel.ts:7328-7351`).
- `paintCityPanelSections()` empties/rebuilds the panel mounts when painting, and tabs/buttons receive node-local listeners (`cityPanel.ts:11935-12026`, `12028-12118`). Those nodes are expected to become collectible after the containing frame is removed; DOM listener counters can remain elevated before GC if detached nodes have not yet been reclaimed.
- `openCityPanelForPlayer()` calls the same `showCityPanel()` path as gameplay and applies the city overlays (`main.ts:6396-6429`). The debug measurement hook calls this real function and `closeCityPanelIfOpen()` (`main.ts:25964-25976`).

The code keeps `activeOnClose` as one latest callback even after closing (`cityPanel.ts:10340`, `11942`, `12121-12133`, `12143-12149`). It is overwritten on the next open and is not an unbounded collection; static inspection alone does not show that it retains each prior panel tree. It is worth confirming with a heap snapshot if DOM counters remain high after forced GC.

## Required follow-up experiment
Run the same first-player-city probe for at least 20 open/close cycles. At baseline and after each close:

1. Wait two animation frames, then invoke CDP `HeapProfiler.collectGarbage` before sampling `Memory.getDOMCounters` and V8 heap usage.
2. Sample `.civ-ux-frame` count, its descendant count, `.civ-ux-dim-full` count, `style#civ-okolica-ux-frame-css-w3` count, and CDP `documents/nodes/jsEventListeners`.
3. Record counters once while the panel is open and again after close + GC. This separates expected live-panel nodes from retained detached nodes.
4. If post-GC counts grow monotonically, take a heap snapshot and inspect retaining paths for detached `.civ-ux-frame` nodes/listeners and the retained `activeOnClose` closure. If they return to the same baseline after each GC, the T1 increase was deferred collection or one-time UI initialization rather than a per-cycle leak.

The current long-empire harness should also collect garbage at the before/after probe boundaries and report whether pointer movement actually lands on the map canvas. In its T1 sample, `canvasPointerMoves` was 0, so `pointerPanWall` (about 15.7 s for five two-way drag trials) is only whole-operation latency under software rendering, not a direct pointer-event latency metric. City-open measurements remain distinct (about 0.86 s synchronous on that test platform).

## Evidence and limits
The current measurement is a single five-cycle aggregate at T1; it does not sample after each close, force GC, or prove detached nodes are retained. It cannot attribute the observed process-tree RSS rise to the city panel. The test platform uses headless Chromium/SwiftShader, and the reported 1.55 GiB process-tree RSS after the probe includes browser subprocesses and is not equivalent to Windows GPU memory.

No code or product source was changed. No runtime reproduction beyond the parent task's T1 probe was run in this audit. `git diff --check` passes.
