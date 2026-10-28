# Operator validation: battle cleanup and army merge panel

Validation date: 2026-10-28 UTC
Candidate: `/workspace/all-topics-candidate`
Base HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`
Scoped diff SHA-256 (binary working-tree diff for `gra/src/battle/battleScene.ts` and `gra/src/ui/armyMergePanel.ts`): `e8b96c017a15aec3f25c0e45be7d8cabfed9ef7ca8911adc14714eaa6723ec8e`

Current source SHA-256:

- `gra/src/battle/battleScene.ts`: `497ad925642aa7ff7c3c6a58d035ce9a8b9a5b21eff7409f48369d7aa2119e95`
- `gra/src/ui/armyMergePanel.ts`: `9deab30da44906eafa0411509773f705f041f6df5c2c44a8391dfff192e23ccb`
- Live battle harness `gra/tools/battle-large-return-live-test.cjs`: `36c2925badbc4f754b06ad66eead94c16efe0580b8f3aa4c13b7976e283cbd36`
- Real-render panel test `gra/tools/army-merge-panel-scroll-real-render-test.cjs`: `58b0cb4e6323b79a5a378e5c9fc8ef9cd7c7c55826f6095b9ff9f08771c8ff628`

## Scope

The battle scene now calls `forceContextLoss()` after disposing its Three.js renderer, so closing a map battle explicitly releases that battle-only WebGL context while leaving the world-map renderer alive. The merge panel is wider, lays out existing units in three columns on desktop, and puts its result and action controls in fixed panel slots while the unit list scrolls.

## Checks

All commands ran from `gra/` and passed:

- `node tools/battle-large-return-live-test.cjs` — production Vite bundle built and a headless Chromium run completed a 28v28 preset battle, skipped to the result, and returned to the map. All six checks passed: both canvases existed during battle; only the battle context was lost on disposal; the world-map render loop continued; wheel input changed the map camera; the map canvas remained connected; and the browser reported no page or console errors. Observed render frame advanced from 56 to 60 after return and to 70 after wheel input; the battle context reported lost and map context remained available.
- `node tools/army-merge-panel-scroll-real-render-test.cjs` — 21 passed, 0 failed in Chromium. It measured 1141x1451 and 900x620 layouts with 16 and 40 existing units, verified the three-column layout, reachable final row and visible fixed controls, checked merge/separate mouse actions, and confirmed the prior-layout negative control fails the viewport/scroll contract.
- `npm run typecheck` — passed (`tsc --noEmit`).

## Evidence and limits

The 28v28 browser run is direct runtime evidence for the production battle scene construction, the player's return action, context-loss state, and continued map rendering/input. The harness adds temporary test-only probes through a Vite transform; it does not change product sources. Chromium used SwiftShader, so this validates browser lifecycle and rendering behavior in software WebGL, not GPU-specific driver behavior or memory reclamation measurements.

The panel test measures actual Chromium layout and click behavior at the stated viewport sizes. It covers the tested desktop and narrow layouts and roster sizes; it does not establish behavior for every possible viewport or unit count. `npm run typecheck` validates TypeScript consistency across the current working tree. No deploy or push was performed.
