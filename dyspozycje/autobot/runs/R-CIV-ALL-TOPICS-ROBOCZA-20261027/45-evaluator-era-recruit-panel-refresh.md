# Evaluator report: refresh recruitment panel on era advance

## Verdict: PASS-WITH-NOTES

The refresh fix is correctly wired for an actual player era advance. `notifyPlayerEraChangeIfAdvanced()` returns unless the era genuinely advanced, then calls `refreshCityPanelIfOpen()`. The city panel's `productionCtxForCity()` reads `cfg.getEpoch(city.ownerId)` each time it builds availability. Both main.ts city-panel configurations provide `getEpoch: ownerId => empireEpochForOwner(ownerId)`, which reads the live owner era. Thus the refresh rebuild observes the newly advanced era rather than a cached era value.

On the Stone-to-Bronze transition, the production availability rule keeps Stone units because they are exactly one era below Bronze, and the Barracks gate applies only to units with era ordinal 2 or higher. The focused tests confirm a Stone unit remains visible without Barracks and a Bronze unit stays gated without Barracks.

## Reproduction

From `gra/`:

- `node tools/era-recruit-panel-refresh-test.cjs` — **PASS, 4/4**.
- `node tools/koszary-gate-test.cjs` — **PASS, 26/26**.
- `node tools/epoka-merge-recruit-test.cjs` — **PASS, 13/13**.
- `node tools/unit-epoch-cost-test.cjs` — **PASS, 57/57**.

## Notes and limits

The new panel-refresh test extracts the notifier from main.ts and runs it with a stub `refreshCityPanelIfOpen` callback. That callback reconstructs the recruitment list through the real `purchasableUnits()` implementation using the live `player.era`. This verifies the notifier guard/call and production behavior together, but does not instantiate the actual city panel DOM or browser rendering. The separate source trace verifies the production context getter is dynamic and configured to `empireEpochForOwner`; a live browser test of an already-open panel crossing the era boundary was not run.

The source and test files include unrelated worktree changes. Hashes below identify the full current files. No product code was changed during this evaluation.

## Identity

Worktree HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`.

SHA-256:

- `gra/src/main.ts`: `9b8f1d1f16545b27890cf84f9ba92a80e6334d8d31ca645a9f7115782895ae01`
- `gra/tools/era-recruit-panel-refresh-test.cjs`: `5ec1142393438290c070eb3ffe7d73123aa30d32fadd93165e3014a448507f3a`
- `gra/tools/koszary-gate-test.cjs`: `7c3a671167062ca7690fe2ad70d7387bc5734c357b704eb72cce3a5efa22b314`
- `gra/tools/epoka-merge-recruit-test.cjs`: `59d2c7ef3a024d988cb842120a15163169fec7cd7a0cc8768c5dc3be3a86625a`
- `gra/src/game/production.ts`: `f382de35b3262c301b51ac0319540e96f8f65bf2908c9a4e29626ea24a9a2361`
