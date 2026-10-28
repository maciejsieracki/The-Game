# AutoBot Operator — warfare and AI General campaign closeout

**Result: focused implementation and integration checks PASS; no product defect found.** This round made no product changes and performed no commit, merge, push, or deploy.

## Scope

Inspected the current uncommitted implementation for AI General-led war campaigns, five complete gather turns followed by attack on owner turn six, leader-death restart, cancellation on peace, forced-era war duration and peace lock, and refusal to capture empty enemy cities during peace. The working tree is shared with other operators; the recorded hashes identify the exact reviewed source bytes.

## Validation on current tree

- `node tools/ai-general-war-campaign-test.cjs` — **24 passed, 0 failed**. Covers deterministic target choice, General recruiting/gathering/attacking states, turns 1–5 then attack on turn 6, target stability, leader death and replacement, peace cancellation, and campaign save/restore validation.
- `node tools/generals-purchase-runtime-test.cjs` — **9 passed, 0 failed** in Chromium against the production Vite bundle. Covers capital-only purchase, no mutation on rejected non-capital purchase, resource deductions, era cap, live queue spawn, and the real post-spawn hook assigning the new recruit to the General's live position. No browser page errors.
- `node tools/forced-war-reguly-multi-turn-simulation-test.cjs` — **50 passed, 0 failed**; includes 20-turn forced-war auto-peace and the era peace lock.
- `node tools/ai-city-capture-integration-test.cjs` — **21 passed, 0 failed**; includes peace beginning after plan creation and live execution-time war checks.
- `node tools/forced-war-stone-test.cjs` — **38 passed, 0 failed**.
- `node tools/forced-war-bronze-test.cjs` — **56 passed, 0 failed**.
- `node tools/forced-war-iron-test.cjs` — **58 passed, 0 failed**.
- `npm run typecheck -- --pretty false` — **PASS**.
- `git diff --check` for the inspected warfare source/tests — **PASS**.

## Inspected source identities

- `gra/src/game/ai-general-war-campaign.ts`: `438fc9030a6cdd9bbfb62b2188508fd2357e029e91928731f394d1f856341734`
- `gra/src/game/ai.ts`: `f66803293fa327b3955abc19edd5451f437f560de33b9d987bd92137369d71f6`
- `gra/src/game/diplomacy-peace-lock.ts`: `b48e27e65156e2f764578cb5643d8901277c03be7b50057792253290cbf94a68`
- `gra/src/game/forced-war-common.ts`: `90e4a0b59586564c7994789a4c55a5bdba09339afa13d914e4043b2e7a734c56`
- `gra/src/game/forced-war-stone.ts`: `0dc15eb3f031931692a276137839cf47cccb3bd1c1c8e854b9ed700b306398a8`
- `gra/src/game/forced-war-bronze.ts`: `12a79c4fe7864f78d72d880e1ff9513284a1de2bf105df314ecfd3a3d0d8d6a5`
- `gra/src/game/forced-war-iron.ts`: `e9694d9545ef3a4b31b4ac68f7f65ca84a5658babd94dac9c6fcf555af8946c4`
- `gra/src/game/ai-city-capture-executor.ts`: `5562453987a265ea7b60bd538ed50b7e81b6f635530244b7c548e5c008ff7dcc`
- `gra/tools/ai-general-war-campaign-test.cjs`: `f51dead68ab6d658188ea6eed1e9d4881f59dafdb678973b5dd108705fe9f3d1`
- `gra/tools/forced-war-reguly-multi-turn-simulation-test.cjs`: `cc287e4feac46358bca824ffe136ac6bb1ac495cb8caaf8aaffd82da09e9eb41`

## Remaining evidence limit

The AI war planner/lifecycle and actual General purchase-and-spawn path pass independently, but they have not been combined into one browser replay that starts with a newly declared AI war, completes purchase/spawn, advances the five gather turns, attacks, and saves/reloads that active campaign. Current evidence is strong and no behavior defect is demonstrated; this is the one remaining end-to-end validation item if “100%” requires that complete integrated replay.
