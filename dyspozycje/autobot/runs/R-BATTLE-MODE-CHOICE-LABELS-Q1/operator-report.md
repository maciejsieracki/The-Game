# Operator report — R-BATTLE-MODE-CHOICE-LABELS-Q1

STATUS: UI wording implementation and scoped verification complete; hold integration pending owner/Final Control disposition of the existing unwired setting.

## Changes

- The setting now reads `Bitwa automatyczna` and `Bitwa ręczna i automatyczna`.
- Help text describes map-only auto resolution versus choosing manual scene or auto resolution before each battle.
- The start-generation summary uses the same two labels.
- The longer value was checked in the real Chromium wizard for horizontal overflow.

## Verification

- `node tools/battle-mode-choice-labels-test.cjs` — PASS in real Chromium/Vite bundle: default label, toggle to both-mode label, toggle back, help copy, summary mapping, and no horizontal overflow.
- `node ./node_modules/typescript/bin/tsc --noEmit` — PASS.
- Vite production bundle is built by the browser test — PASS.
- `git diff --check` — PASS.
- The test output is built under this worktree and removed by `finally`; `/tmp` was already full at test start, so no other worktree/temp output was deleted.

## Semantics note (blocking for claiming gameplay mode is wired)

Source audit found `NewGameAdvancedOptions.battleAlwaysManual` is read by the settings UI and generation summary, copied into `_menuAdvanced`, but has no runtime consumer for resolving battles. All three map pre-battle entry points still use `defaultAction: 'manual'` and expose the manual/auto choice. Therefore this change only corrects labels/help/summary; selecting `Bitwa automatyczna` does not currently force auto resolution. That pre-existing wiring defect was not changed in this label-only ticket, to avoid silently changing battle flow. Root should register/dispatch a separate behavior fix or explicitly include it in this ticket before integration.

No merge, deployment, or push performed.
