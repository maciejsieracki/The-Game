# Independent Evaluator Report

STATUS: PASS — NARROW RESOURCE-LIFECYCLE SCOPE
TASK: R-PERF-GPU-GHOST-RESOURCE-DISPOSAL-Q1
BASE: `54214e3a32b48ec934de6aa04cbc4cb14a63d509`
REVIEWED BRANCH: `autobot/R-PERF-GPU-GHOST-RESOURCE-DISPOSAL-Q1`

## Review scope

Reviewed the operator diff, dispatch boundaries, resource ownership markers, preview/clearing removal paths, lifecycle tests, and WebGL counter smoke. No implementation edits were made by the evaluator.

## Findings and correction

The first review found a material ownership gap: `applyGhostMaterial()` cloned and replaced all source materials without disposing unmarked, owned originals. Ordinary improvement builders create fresh unmarked materials, so this could retain WebGL resources. The candidate was held pending correction.

The operator corrected this with `cloneObject3DMaterialsForTransient()`, which clones and reassigns preview materials, deduplicates and disposes unmarked originals, and preserves explicitly shared cache materials. The regression now covers both owned source disposal and cache-source preservation, as well as disposal of the resulting preview clones.

The resulting `disposeTransientObject3D()` also deduplicates and disposes owned geometry/materials for removed transient groups while preserving explicitly marked shared geometry/material resources. Clearing-marker replacement, state rebuild, and reset paths all call the disposer. Review found no remaining missed path in the declared allowlist.

## Independent validation

Using the dependency tree from `/workspace/all-topics-candidate/gra/node_modules` temporarily linked into this isolated worktree:

- `node gra/tools/web-memory-leaks-test.cjs` — **55 passed, 0 failed**.
- `node gra/tools/transient-webgl-resource-smoke.cjs` — passed; geometry counters were `{ liveBaseline: 1, afterTransientCycles: 1, afterLiveRemoval: 1 }` and the shared geometry remained usable through 120 transient cycles.
- `npm run typecheck --prefix gra` — passed.
- `git diff --check` — passed.
- Operator additionally reports `npm run build --prefix gra` passed after the correction.

This validates the narrow preview/clearing resource lifecycle and shared-cache ownership behavior. No gameplay or visual behavior change was found in the reviewed diff.

## Limits

This focused helper test does not measure the whole game's JS heap, textures, city-open or pointer latency, or browser process RSS. The 120-cycle synthetic WebGL smoke is not a long session with the full map. Therefore this pass does not prove that this defect accounts for the reported browser memory increase from about 100 MB to 2 GB or resolves all late-game interaction stalls; those require a long-session runtime profile.

## Decision

PASS for the operator's narrowly declared GPU resource-lifecycle scope, with the above runtime-attribution limits. No integration, push, or deploy was performed by the evaluator.
