# AutoBot Operator — remove duplicate unit projection after city capture

**Result:** narrowly scoped redundant-render cleanup implemented and verified. No commit, merge, push, deploy, or long stress run.

## Evidence and reason for change

The confirmed late-game outlier remains the historical turn 39→40: 77.678 s harness wall / 69.796 s measured world EOT. The measured `scanAutoSiegesAfterAiTurn` phase reached 30.734 s. Direct 8-capture profiles attributed 18.265–18.270 s of scan time to the capture/siege storm paths. The mixed fixture measured an explicit `syncUnitsRender` within `refreshMapAfterCityCapture` at approximately 0.39–0.43 s per call.

In the current source, `refreshMapAfterCityCapture()` called `syncUnitsRender()` immediately before `refreshFog()`. `refreshFog()` itself calls `syncUnitsRender(visibleUnitsList(...))` in both fog-render branches. This makes the first full unit projection redundant during normal play. `refreshFog()` returns early when `galleryOn`, so the explicit sync is retained for that mode.

The change does not skip, delay, or alter `refreshFog()` and its discovery, exploration, notices, fog, overlay, and renderer side effects. It does not remove the later `requestAnimationFrame` sync used for force-visible cleanup. Expected benefit is one fewer unit projection (historically around 0.4 s) per capture through this function; that is a confirmed local saving, but by itself it does not establish that turn 40 now clears the 60-second gate.

## Change and focused test

`gra/src/main.ts`: guard the pre-fog sync with `if (galleryOn)`. Normal capture now relies on the unit sync already performed by `refreshFog`; gallery behavior keeps its explicit sync because refreshFog is suppressed there.

Added `gra/tools/capture-render-sync-test.cjs`. It extracts and executes the actual `refreshMapAfterCityCapture` function body with instrumented dependencies. It checks that normal capture has one unit sync via the fog refresh, gallery capture still has one explicit sync, ordering remains intact, selection/force-visible bookkeeping is preserved, RAF cleanup remains scheduled, and the real `refreshFog` source retains a unit sync in both branches. Result: **9 passed, 0 failed**.

## Validation

- `node tools/capture-render-sync-test.cjs`: **9 passed, 0 failed**.
- `node tools/map-siege-test.cjs`: **6 passed, 0 failed**.
- `node tools/flaga-mp-nie-gasnie-test.cjs`: **32 passed, 0 failed**.
- `node tools/miasto-zdobycie-raport-test.cjs`: **117 passed, 0 failed**.
- `npm run typecheck`: **passed**.
- `git diff --check`: **passed**.
- No ≤3 EOT replay was run. This source-path test directly verifies the duplicate call removal and preserves all fog/state work; a live replay is still needed to measure real late-game impact. No 100-turn test was run.

## Identity at report time

HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`.

- Current shared `gra/src/main.ts` SHA-256: `7be9ab7860ff929623ef6ed3f823d323b96a265bbe99d5c809cf70e69eee25fc`.
- Current `gra/tools/capture-render-sync-test.cjs` SHA-256: `f021de4a7c6c0e357a4a02b40fe1d85bef8141c7aed52b4427a0f801f65831b7`.
- Current `gra/tools/perf-large-empire-stress-live-test.cjs` SHA-256: `e7f26ac5b2277bebbf3b2c67bb832c2031c3eb9a39ed6db32a9c3ee4ab3fcfec`.
- Shared `gra/src/main.ts` binary diff against HEAD SHA-256: `b851dd95230f7ede23a2e5fca37925e311d78a93eb52abc4af6bc7b394b5e591`.

`main.ts` and the harness contain other operators' shared changes; the reported whole-file/diff identities are exact for this shared worktree and do not imply ownership of those other hunks.
