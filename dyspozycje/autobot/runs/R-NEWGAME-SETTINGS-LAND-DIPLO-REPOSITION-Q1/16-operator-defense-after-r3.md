# Operator defense after R3 — selective integration guidance

**Stage: 8/11 (operator defense after independent evaluation).** The evaluator returned PASS-WITH-NOTES. I reviewed the isolated candidate against the current `main` ref `e84d4328fb30ca42ae837f4dadd1bf0aa604a58f`; no source edits were made in this defense and root `main` was not modified.

## Selective source hunks to carry forward

Apply only these three behavior hunks from `gra/src/ui/newGameFlow.ts` to current `main`:

1. In `advancedSettingRows()`, add `advRowFromSett('player_epoch_war', ...)` to keep the previously available epoch-war toggle in Advanced settings.
2. In `showAdvancedModal()`, filter out `landFraction` and `deals_end_turn_gate`, while retaining `cityStateDifficulty` in Advanced.
3. In `renderSettStep()`, replace the main-grid `cityStateDifficulty` key with `deals_end_turn_gate`, retaining `landFraction` in the final former era-war slot.

The custom setting-row renderer and the `world_type` refresh behavior already exist on current `main`; do not replace those sections wholesale. Current main already has the desired battle-mode labels and summary text. Preserve them: `Bitwa automatyczna` / `Bitwa ręczna i automatyczna` in Advanced, and the matching labels in the settings summary.

Do not transplant the whole isolated `newGameFlow.ts`: its base is `2a2180bb2d29acdf0768c370e1c3e8edfbbca044`, and the net file diff against current main includes stale battle labels (`Automatyczne` / `Ręczna`) that would regress the separately accepted wording.

## Test files

Carry forward the focused `gra/tools/newgame-settings-layout-reposition-test.cjs` contract test only if the current main version does not already contain its stronger assertions. It verifies the exact main-grid positions, city-state difficulty and epoch-war controls in Advanced, persistence after closing/reopening, and start parameters. Preserve the corrected `gra/tools/newgame-adv-tooltip-test.cjs` R3 changes if that test is also brought over: it now checks city-state difficulty in Advanced, checks that the trade gate is absent there, and uses loopback HTTP instead of blocked `file://` navigation.

## Defense conclusion

I see no further product-code change required by the evaluator's notes. The accepted layout behavior and targeted tests passed (R3 evidence: 31/31 tooltip, baseline negative control failed on the intended grid assertion, candidate layout positive control passed; typecheck and diff-check passed). The remaining integration task is a selective hunk transplant onto current main followed by its normal final-control checks. No merge, deployment, or push was performed by this operator.
