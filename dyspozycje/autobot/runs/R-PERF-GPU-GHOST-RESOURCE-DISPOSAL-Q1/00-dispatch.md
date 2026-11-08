# AutoBot Operator Dispatch

STATUS: OPERATOR
DOMAIN: GAME
TEMAT: R-PERF-GPU-GHOST-RESOURCE-DISPOSAL-Q1
GOAL: Stop GPU geometry/material allocations from accumulating when transient world-map build ghosts and forest-clearing markers are removed or replaced; retain only resources still owned by live scene objects.

## Scope and baseline

- Base: `main`/candidate commit `54214e3a32b48ec934de6aa04cbc4cb14a63d509`.
- Worktree: `/workspace/gpu-resource-disposal`, branch `autobot/R-PERF-GPU-GHOST-RESOURCE-DISPOSAL-Q1`.
- Kanban: unavailable in this Codex host. The owner previously stated Codex does not have the Hermes Kanban; no card is claimed or fabricated.
- Confirmed source paths under review: `gra/src/main.ts` transient preview lifecycle (`disposeGhostObject3D`, `removeBuildGhosts`, `removeGhostImprovement`, `removeGhostCity`) and forest clearing lifecycle (`spawnClearingMesh`, `removeClearingMesh`, `syncClearingMeshesFromState`, `clearAllHexClearing`). Related builders: `buildImprovementVisual` and `buildSettlementModel`.

## Allowlist

- `gra/src/main.ts`
- `gra/src/render/transientObjectResources.ts`
- `gra/src/render/stoneCityRoblox.ts`, `gra/src/render/bronzeCityRoblox.ts`
- `gra/src/render/kopalnia-cyny-opus5.ts`, `gra/src/render/kopalnia-zlota-opus5.ts` (mark cached shared geometry/material; no model behavior changes)
- `gra/tools/web-memory-leaks-test.cjs` and `gra/tools/transient-webgl-resource-smoke.cjs`
- This run's `00-dispatch.md`, `01-operator.md`, and evidence files only.

No economy logic, mouse-move/city-panel performance optimization, trade-route cache, event-detail history, other GPU resources, release bundle, deploy, or push.

## Acceptance criteria

1. Replacing/removing build ghosts disposes every transient GPU geometry and cloned material exactly once, while shared/live geometry and materials remain usable.
2. Replacing, expiring, clearing, or resetting forest-clearing markers disposes each marker's owned geometry/materials exactly once.
3. Regression test reproduces disposal events and includes a negative assertion proving a shared live resource is not disposed; where practical, a live Chromium/WebGL test confirms renderer geometry counts return to the baseline after repeated ghost/marker lifecycles.
4. `tsc --noEmit`, focused test(s), `git diff --check`, and relevant existing memory/resource lifecycle tests pass.
5. Report describes limits honestly: this fix addresses confirmed resource-lifecycle defects but does not by itself prove they account for the user's full ~2 GB process-memory growth.

## Required boundaries

- Audit actual ownership before adding geometry disposal; do not call `dispose()` on shared singleton assets.
- Do not change gameplay behavior or render appearance.
- Do not modify unrelated resource lifecycle paths or optimize the interaction loop under this topic.
- No integration, deploy, or push.

## Plan and gates

Recon ownership/callers → add the narrow disposal helper/use only for transient resources → regression test and live memory-count check if feasible → typecheck/focused validation → write `01-operator.md` with exact results and remaining limitations. Independent Evaluator and Final Control are successor gates, not part of this dispatch.
