# Evidence notes

- Base checked: `a1d8621290d107adc3ece82978d64aa6b7c4c0dc`.
- City panel measurement hook: `gra/src/main.ts:25964-25976` calls `openCityPanelForPlayer()` and `closeCityPanelIfOpen()`.
- Open cleanup and UI state: `gra/src/main.ts:6396-6429`; `gra/src/ui/cityPanel.ts:12121-12149`.
- Frame create/remove and global key cleanup: `gra/src/ui/cityUxFrame.ts:127-153`, `219-296`.
- Hover dock timer/reference cleanup: `gra/src/ui/cityPanel.ts:10546-10553`; `gra/src/ui/hoverDetailDock.ts:395-410`.
- Static delegated technology event listeners are bound once under a module-level boolean: `gra/src/ui/cityPanel.ts:7328-7351`.
- T1 aggregate runtime result supplied by the parent run: five open/close cycles; CDP DOM nodes 6,764→16,138, listeners 420→1,413; no explicit GC before after-sample. `canvasPointerMoves` was 0.

Interpretation: the counter increase warrants a post-GC repeated-cycle check, but no per-open global handler leak is visible in the inspected source. The retained DOM/listener count has not yet been shown to grow after collection.

## Runtime forced-GC follow-up

A 20-cycle isolated Chromium check at deployed base `a1d86212` sampled DOM/listener counters after forced GC on every close. Counts settled at 1,736 DOM nodes and ~248–250 JS listeners, with zero city panel root/dim nodes after close. Post-close V8 heap was +1.70 MB relative to baseline but non-monotonic. Full series and limits are in [`02-runtime-gc-followup.md`](02-runtime-gc-followup.md) and [`city-panel-dom-gc-series.json`](city-panel-dom-gc-series.json). This does not demonstrate a per-open DOM/listener leak; exact detached-node retainers still need heap snapshots if attribution of the small heap delta is needed.
