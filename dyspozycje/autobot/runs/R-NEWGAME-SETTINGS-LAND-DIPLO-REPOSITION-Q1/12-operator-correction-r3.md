# Operator correction R3 — settings relocation and tooltip coverage

**Status: implementation/test correction complete; level 6/11, awaiting independent evaluator.** No commit, integration, deployment, or push was performed.

## Correction from evaluator R2

The Advanced tooltip regression had an obsolete settings list: it expected the trade-offer review gate in Advanced after that option was moved to the main grid. It also opened the built bundle through `file://`, which Chromium blocked before reaching the UI. The test now checks `Trudność miast-państw` in Advanced and asserts that the trade-offer gate is not duplicated there. It serves the built single-file app over loopback HTTP and shuts down Chromium and the HTTP server in `finally`.

## Verification

- Baseline: clean worktree at `6abc4ed3ed42e70ef8d81a9ab28a012ca72fea5e`.
- Operator branch HEAD: `96ea946cd607f6668b49e060916045dee83df202`; merge-base with baseline: `2a2180bb2d29acdf0768c370e1c3e8edfbbca044`.
- Negative control: ran the layout Chromium test against the clean 6abc baseline. It reached the UI and failed as expected on `diplomacy review occupies the former city-state difficulty slot in the main grid` (exit 1). Raw output: `14-r3-layout-negative-6abc.log`.
- Corrected candidate layout test: Chromium PASS (exit 0), covering main-grid slot order, Advanced retention, change/persist behavior, and game-start parameters. Raw output: `15-r3-layout-positive.log`.
- Corrected tooltip test: real Vite single-file build served over HTTP; Chromium PASS, **31 pass / 0 fail**. It checks city-state difficulty tooltip and confirms the relocated trade gate is absent from Advanced; no console errors. Raw output: `13-r3-tooltip-http.log`.
- `node --check` on both changed CommonJS tests: PASS.
- `npm run typecheck`: PASS (`tsc --noEmit`).
- `git diff --check`: PASS.
- Build output was removed after the run; the loopback server and browser were closed.

## Files and evidence hashes

- Product: `gra/src/ui/newGameFlow.ts` — SHA-256 `4a5efa17451bef17d1705f5b9b93527ad9bd28cef947b5a98f76960c7d3665d9`.
- Tooltip test: `gra/tools/newgame-adv-tooltip-test.cjs` — SHA-256 `125079c8f7dec83932cf1560e3d852fd7af75598d042e8d0ae17f8209a943dfe`.
- Layout regression: `gra/tools/newgame-settings-layout-reposition-test.cjs` — SHA-256 `6d18170adf5c14712040f61f6d3a810dbc55b6e2c02282fe8b2246b0c3cf8894`.
- Combined current worktree diff for those three files: SHA-256 `adb6e8691eac5fa54b62112a742c3673e8a44363c0e002621df6a83b47e493ab`.

The only tracked product delta relative to baseline 6abc is in `newGameFlow.ts` (3 insertions/3 deletions); test corrections are local uncommitted changes. Evaluator R2 rejection and the earlier R2 reports remain preserved as historical evidence, not treated as R3 sign-off.
