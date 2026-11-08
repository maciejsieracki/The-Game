# Final Control — new-game settings repositioning on main integration

Date: 2026-10-30 UTC
Worktree: `/workspace/main-integration-20261029`
Base/current HEAD: `e84d4328fb30ca42ae837f4dadd1bf0aa604a58f`
Decision: **PASS-WITH-NOTES — stage 8/11**

## Scope and candidate diff

The product change is limited to `gra/src/ui/newGameFlow.ts`: **6 insertions and 2 deletions (8 changed lines)**. The advanced settings add the epoch-war toggle while retaining city-state difficulty; the diplomacy end-turn gate occupies the former city-state-difficulty slot in the main settings grid; land share stays in the final grid slot. Duplicate advanced rows are filtered.

The existing battle-mode choices remain exactly `Bitwa automatyczna` and `Bitwa ręczna i automatyczna`. The setting test verifies the selected mode is retained in preferences and passed through `battleAlwaysManual` at game start.

Tests changed in this candidate:

| File | SHA-256 |
|---|---|
| `gra/src/ui/newGameFlow.ts` | `b2b3ba1afa8254392dd4d5778ee191a50cff08865018bd58486b19ab2ec81616` |
| `gra/tools/newgame-adv-tooltip-test.cjs` | `125079c8f7dec83932cf1560e3d852fd7af75598d042e8d0ae17f8209a943dfe` |
| `gra/tools/newgame-settings-layout-reposition-test.cjs` | `6d18170adf5c14712040f61f6d3a810dbc55b6e2c02282fe8b2246b0c3cf8894` |

## Verification

Executed from `/workspace/main-integration-20261029/gra`:

- `npm run typecheck` — PASS.
- `node --check tools/newgame-adv-tooltip-test.cjs` — PASS.
- `node --check tools/newgame-settings-layout-reposition-test.cjs` — PASS.
- `node tools/newgame-settings-layout-reposition-test.cjs` — PASS in Chromium. Confirms the diplomacy gate at slot index 5, land share at index 7, settings changes and persistence after closing/reopening the wizard, and game-start parameters for land fraction, diplomacy gate, epoch-war participation, city-state difficulty, and battle mode.
- `node tools/newgame-adv-tooltip-test.cjs` — **31 pass, 0 fail** in Chromium. Confirms city-state difficulty appears in Advanced, the diplomacy gate is not duplicated there, all eight tested tooltip rows work, and no console/page errors occur.
- `git diff --check e84d4328` — PASS.

## Verdict and release boundary

**PASS-WITH-NOTES.** The candidate is safe to proceed to integration/release review for this UI-setting relocation. The browser gates exercise the wizard and game-start parameter handoff; they do not test a complete game after start. At report creation, the candidate had not been merged, deployed to Robocza, or pushed. No product files were changed by Final Control.
