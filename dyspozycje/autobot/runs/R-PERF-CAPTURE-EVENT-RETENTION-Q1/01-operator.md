# AutoBot Operator Report

STATUS: IMPLEMENTED — READY FOR INDEPENDENT REVIEW
TASK: R-PERF-CAPTURE-EVENT-RETENTION-Q1
BASE: `a1d8621290d107adc3ece82978d64aa6b7c4c0dc`
BRANCH: `autobot/R-PERF-CAPTURE-EVENT-RETENTION-Q1`

## Finding

`warEventLog` keeps at most eight cards, but each `recordCityCaptureEvent()` also stored all report rows in `cityCaptureEventDetails`. Truncating the journal only changed the array length, leaving the evicted detail rows strongly reachable until that card was explicitly dismissed or the game/reset path cleared the whole map. The same cap/cleanup gap existed for `civElimEventDetails` entries under `elim-cs-*`.

This is unbounded with respect to player-involved capture/elimination events during a session. A report is modest in size, so this is a real retention defect, not evidence that it explains the reported 2 GB browser memory.

## Change

- Added `trimSidePanelEventLog()` to trim a newest-first event array and delete details only for rows evicted past the cap.
- Replaced the seven direct `warEventLog` truncation sites with `trimWarEventLog()`, which cleans both `capture-*` and `elim-cs-*` detail maps.
- Kept surviving event detail rows available for the click-to-open modal. Existing explicit dismiss deletes remain unchanged.
- Added detail-map clearing when the hotseat event journal is reset and when the side-panel test hook seeds a new event list; new-game/load resets already cleared both maps.
- Added a regression test for more than eight capture events, eviction by an unrelated event, retained-card resolution, and the matching elimination detail lifecycle.

## Verification

- `node gra/tools/capture-event-retention-test.cjs` — PASS, 20 assertions.
- `node gra/tools/miasto-zdobycie-raport-test.cjs` — PASS, 56/56.
- `node gra/tools/elimination-toast-merge-test.cjs` — PASS, 56/56.
- `node gra/tools/sidepanel-events-toolbar-test.cjs` — PASS, 19/19.
- `npm run typecheck --prefix gra` — PASS.
- `npm run build --prefix gra` — PASS, Vite transformed 916 modules.
- `git diff --check` — PASS.

No product source outside the declared allowlist was modified. No commit, push, or deploy was performed.

## Limits

This bounds detail retention to visible journal rows for the two card families. It does not measure late-game browser RSS, GPU/VRAM, or interaction latency and does not attribute the user's 100 MB→2 GB increase. The full large-empire interaction/memory test remains necessary.
