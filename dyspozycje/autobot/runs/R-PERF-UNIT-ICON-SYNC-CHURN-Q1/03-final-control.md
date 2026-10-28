# AutoBot Final Control — unit overlay allocation churn

STATUS: PASS WITH NOTES — NARROW UNIT-OVERLAY CHURN SCOPE
TASK: R-PERF-UNIT-ICON-SYNC-CHURN-Q1
BASE: `a1d8621290d107adc3ece82978d64aa6b7c4c0dc`
REVIEWED BRANCH: `autobot/R-PERF-UNIT-ICON-SYNC-CHURN-Q1`

## Control review

Reviewed the operator/evaluator reports, `UnitRenderer._applyStackDisplay()` diff, overlay creator/ownership paths, and regression coverage. The candidate retains stack-count and suffering-icon sprites only when the representative token, visible state, parent model, semantic value, and paired/single cause layout remain unchanged. When state changes or the representative is hidden/rebuilt, the old overlay is detached and its per-icon CanvasTexture and SpriteMaterial are disposed before replacement/removal. The creators allocate their own textures/materials; no shared asset is disposed by this change.

The implementation stays within `gra/src/render/units.ts` plus its focused test. No gameplay rules or unrelated render resources changed. The focused test validates unchanged-state identity and allocation counts, count/cause/layout changes, hide/show, and overlay reattachment after token replacement.

## Validation

- Independent Evaluator: **PASS WITH NOTES**; reviewed cache keys and ownership paths.
- `unit-renderer-overlay-sync-test.cjs`: **17/17 PASS** (rerun during Final Control).
- `web-memory-leaks-test.cjs`: **55/55 PASS** (rerun).
- TypeScript typecheck: PASS (rerun).
- `git diff --check a1d86212`: PASS (rerun).
- Evaluator independently reports Vite build with 915 modules PASS.

## Notes and limits

The evaluator noted two limits in the focused regression: it does not spy on `CanvasTexture.dispose()` or `SpriteMaterial.dispose()` directly, and its token-replacement case swaps the token map instead of exercising the complete `sync()` model-rebuild branch. The implementation path was reviewed, and the existing test covers visible sprite replacement/reattachment, but an end-to-end renderer lifecycle test would strengthen those checks.

No 100-turn or long-session RSS/VRAM/interaction measurement was run. This reduces redundant CanvasTexture allocation/upload work; it does not prove a heap or GPU leak, attribute the reported 100 MB→2 GB growth, or establish that late-game stalls are resolved.

## AutoBot dispatch record

At the time of the initial Final Control, the run directory had no `00-dispatch.md`; I documented that gap and did not create or reconstruct a dispatch. The Operator has since added `00-dispatch.md`. Its base, isolated-candidate constraint, narrow UnitRenderer overlay scope, required checks, and no-deploy boundary match the candidate and the scope reviewed here. The current artifact set now includes `00-dispatch.md`, `01-operator.md`, `02-evaluator.md`, and this Final Control.

### Addendum after dispatch was added

The previously noted missing-dispatch process gap is resolved by the added original-scope dispatch. This addendum updates the artifact status only; no implementation files changed and no tests were rerun.

No implementation edits, commit, integration, push, or deploy were performed by Final Control.
