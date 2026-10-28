# Evaluator validation: battle cleanup and army merge panel

Verdict: **PASS**
Validation date: 2026-10-28 UTC
Candidate: `/workspace/all-topics-candidate`

## Code identity

The scoped product files and harnesses match the SHA-256 identities recorded in `24-operator-battle-ui.md`:

- `gra/src/battle/battleScene.ts`: `497ad925642aa7ff7c3c6a58d035ce9a8b9a5b21eff7409f48369d7aa2119e95`
- `gra/src/ui/armyMergePanel.ts`: `9deab30da44906eafa0411509773f705f041f6df5c2c44a8391dfff192e23ccb`
- `gra/tools/battle-large-return-live-test.cjs`: `36c2925badbc4f754b06ad66eead94c16efe0580b8f3aa4c13b7976e283cbd36`
- `gra/tools/army-merge-panel-scroll-real-render-test.cjs`: `58b0cb4e6323b79a5a378e5c9fc8ef9cd7c7c55826f6095b9ff9f08771c8ff628`

The working tree also contains the separately scoped `gra/src/main.ts` render-sync optimization. It was excluded from this battle UI verdict.

## Independent checks

Both targeted commands were rerun from `gra/` and passed:

- `node tools/battle-large-return-live-test.cjs` — 28v28 battle completed and all six checks passed: the battle context was lost on disposal while the map context stayed available; world-map rendering advanced; wheel input changed the camera; the world-map canvas stayed connected; and Chromium reported no page or console errors. Diagnostics showed map frame 56 before input and 67 after wheel input, with the battle context lost and map context intact.
- `node tools/army-merge-panel-scroll-real-render-test.cjs` — 21 passed, 0 failed. Chromium verified the 16- and 40-unit layouts, responsive columns, reachable final row, fixed visible controls, both mouse actions, and the negative control for the prior layout.

The battle test used the harness's software-WebGL Chromium configuration, so these checks establish browser lifecycle and interaction behavior in that environment, not GPU-driver-specific memory reclamation. The operator report additionally records a successful `npm run typecheck`; I did not rerun the broad typecheck because this evaluation is scoped to the two targeted behaviors.
