# Independent Evaluator Report

STATUS: PASS WITH NOTES — NARROW UNIT-OVERLAY ALLOCATION CHURN SCOPE
TASK: R-PERF-UNIT-ICON-SYNC-CHURN-Q1
BASE: `a1d8621290d107adc3ece82978d64aa6b7c4c0dc`
REVIEWED BRANCH: `autobot/R-PERF-UNIT-ICON-SYNC-CHURN-Q1`

## Review

Reviewed the `UnitRenderer._applyStackDisplay()` diff, overlay creators and maps, token model replacement/removal path, focused regression, and existing memory lifecycle test.

The semantic cache keys are appropriate for these static CanvasTexture icons: stack badges are reused only when representative token, count, visibility, and parent are unchanged; suffering icons are reused only when the cause remains present and the paired/single layout is unchanged. A count change replaces only the stack badge. Adding/removing a second cause replaces the affected icons so scale and positions update. Hidden or removed representatives release the overlay, and a rebuilt token with the same unit id causes old sprites to be detached from the old model and rebuilt on the current token. Each icon creator constructs its own `CanvasTexture` and `SpriteMaterial`, so `_disposeOverlaySprite()` can dispose the map and material without crossing shared-asset ownership.

No behavior or rendering change is apparent while semantic state remains unchanged. The new logic reduces redundant allocations and uploads; it is not a heap/GPU leak fix by itself.

## Independent validation

- `node gra/tools/unit-renderer-overlay-sync-test.cjs` — **17 passed, 0 failed**.
- `node gra/tools/web-memory-leaks-test.cjs` — **55 passed, 0 failed**.
- `npm run typecheck --prefix gra` — PASS.
- `npm run build --prefix gra` — PASS; Vite transformed 915 modules.
- `git diff --check a1d86212` — PASS.

The focused test verifies sprite identity and Canvas creation counts for unchanged state, badge count changes, cause pairing changes, hide/show, and token replacement. It does not instrument calls to `CanvasTexture.dispose()`/`SpriteMaterial.dispose()` directly, so lifecycle cleanup is verified from the implementation path rather than a disposal spy. It also directly swaps the token map for its model-replacement scenario rather than invoking the full `sync()` model rebuild branch.

## Limits and process note

These results support reduced CanvasTexture allocation churn in `UnitRenderer` and correct state refresh in the tested cases. No 100-turn test, RSS/VRAM measurement, or browser interaction latency sample was run for this candidate. This does not attribute or resolve the reported 100 MB→2 GB growth.

The run directory contained `01-operator.md` but no `00-dispatch.md` at evaluation time; review scope was therefore taken from the operator report and source diff. No implementation edits, integration, push, or deploy were performed by the evaluator.
