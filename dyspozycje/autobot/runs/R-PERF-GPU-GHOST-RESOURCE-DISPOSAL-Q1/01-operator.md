# Operator Report

STATUS: IMPLEMENTED — READY FOR INDEPENDENT REVIEW
TASK: R-PERF-GPU-GHOST-RESOURCE-DISPOSAL-Q1
BASE: `54214e3a32b48ec934de6aa04cbc4cb14a63d509`
BRANCH: `autobot/R-PERF-GPU-GHOST-RESOURCE-DISPOSAL-Q1`

## What changed

- Added `disposeTransientObject3D()` to collect and dispose owned geometries/materials once per removed group. It preserves geometry/material cache entries explicitly marked as shared.
- Build-preview groups now call this helper on removal. Preview materials are cloned through `cloneTransientMaterial()` so disposing a ghost releases the clone without affecting its cached source.
- Clearing markers now dispose their owned meshes when replaced, synchronized from state, or globally cleared.
- Marked city wall-ring caches in both Roblox city builders and geometry/material caches in tin/gold mine builders as shared. These builders can be used by both previews and live map objects.
- Added lifecycle regression assertions to `web-memory-leaks-test.cjs` and a Chromium/WebGL counter smoke to `transient-webgl-resource-smoke.cjs`.

## Verification

- `node gra/tools/web-memory-leaks-test.cjs` — **50 passed, 0 failed**. Checks transient geometry/material disposal, deduplication, fresh clearing-marker cleanup, preservation of cached city wall and mine resources, and the main.ts removal call sites.
- `node gra/tools/transient-webgl-resource-smoke.cjs` — **passed in system Chromium with SwiftShader**. Renderer geometry count stayed at 1 (one intentionally live cached mesh) before and after 120 transient create/render/remove/dispose cycles; the cached geometry remained usable.
- `npm run typecheck --prefix gra` — passed.
- `npm run build --prefix gra` — passed.
- `git diff --check` — passed.

The WebGL smoke exercises the disposal helper with synthetic objects, not the full game map or a 100-turn session. It confirms that this lifecycle does not accumulate renderer geometries across repeated transient-object replacement. It does **not** establish that this defect explains the reported browser process growth from roughly 100 MB to 2 GB, nor does it measure JS heap, textures, city opening, camera responsiveness, or long-run game behavior. Further profiling is still required to attribute the full slowdown.

Kanban remained unavailable in this Codex host; no Hermes card was created or claimed. No deploy, push, or integration was performed.

## Evaluator follow-up — material source replacement

Independent review found that `applyGhostMaterial()` replaced builder-owned materials with clones but left the originals undisposed. Fixed this by routing replacement through `cloneObject3DMaterialsForTransient()`: it deduplicates and disposes replaced owned source materials after reassignment, keeps cache-marked source materials alive, and leaves ghost-owned clones for normal preview removal. The disposal helper releases those clones with the ghost.

Follow-up verification: `web-memory-leaks-test.cjs` now reports **55 passed, 0 failed**, including fresh wyrab source materials disposed on replacement, clones disposed when the preview is removed, and cached mine materials preserved while their clones are released. Chromium/WebGL remains stable at one intentionally cached geometry after 120 transient cycles. Typecheck, production build, and `git diff --check` pass.
