# Operator report — R-AI-FOOD-IMPROVEMENT-PRIORITY-Q1

Date: 2026-10-29

Branch: `autobot/R-AI-FOOD-IMPROVEMENT-PRIORITY-Q1`

## Status

Operator implementation and stage 5 verification are complete in this branch. Not merged, deployed, or pushed. Independent evaluator and Final Control remain pending.

## Baseline reconnaissance

The shared picker in `gra/src/game/auto-improvements.ts` originally iterated improvement types within each hex, allowing farms/livestock/irrigation to interleave city by city. AI civilization and player auto-building already shared this picker, but the player path also had per-city policy/deficit inputs. The older `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` run was already partially integrated and at its round limit; it was not modified.

Known baseline results recorded before implementation:

- `ai4-popyt-obywatele-test.cjs`: 46 passed / 4 failed (tartak/Z1a, Z1d, Z1g, and Q2o wiring).
- `ai2-heks-po-heksie-test.cjs`: 32 passed / 3 failed (old per-hex ordering/tartak and forest-minimum cases).
- `ai-improvements-test.cjs`: 53 passed / 0 failed.
- `auto-improvements-test.cjs`: 45 passed / 0 failed.

## Change

`pickAutoImprovements` now gates selected food-mode cities through empire-wide stages: river-forest preparation, farms, livestock (`bydlo`, `owce`, `lama` only), irrigation/terraces, then remaining hunting/fishing/salt improvements. Farms and livestock therefore finish their eligible worked-field phase across those cities before later phases are selected. An earlier phase with an eligible target that is blocked by technology or Work budget holds the sequence; a mutation probe verifies this gate is meaningful. Stage-0 forestry is limited to river fields and overrides the general forest-cut toggle only for that preparation step. If no food-stage target exists, the picker falls back to the ordinary food-profile ordering, preserving the existing general forestry path.

AI civilization planning opts into the shared stages. Player auto-building opts in only when the city's effective focus is Food, or Balanced with no non-food resource deficit; other player profiles keep their prior route. Existing city/turn throttles, worked-citizen filter, deposits, and shared Work-budget envelope are retained.

## Verification

- `ai-food-improvement-priority-stages-test.cjs`: **11 passed / 0 failed**, including stage ordering, persistence across turns, locked-stage blocking, a salt-work candidate that remains while irrigation is selected, no-worked-fields negative, live `decideAITurn` river-cut-before-farm trace, player/AI route wiring, and a mutation that disables stage selection and makes the behavior gate fail.
- `tsc --noEmit`: PASS.
- Production Vite build to an external temporary output directory: PASS (`917` modules; single-file bundle about `69.9 MB`). Temporary output was removed.
- Regression suite, run serially to avoid test-bundle filename collisions:
  - `ai-improvements-test.cjs`: **53/0** (baseline unchanged).
  - `auto-improvements-test.cjs`: **45/0** (baseline unchanged).
  - `farma-nie-w-lesie-test.cjs`: **138/0**.
  - `hodowla-las-test.cjs`: **113/0**.
  - `map-improvement-qualify-test.cjs`: **133/0**.
  - `ai4-popyt-obywatele-test.cjs`: **46/4**, same baseline failures (tartak/Z1a, Z1d, Z1g, Q2o).
  - `ai2-heks-po-heksie-test.cjs`: **32/3**, same baseline failure set (tartak/resource-priority and forest-minimum expectations). The newer river-first instruction changes the targeted ordering path; the baseline test still expects the prior behavior.

One initial parallel validation attempt exhausted `/tmp` space because several unrelated large test artifacts already occupied the shared temporary filesystem. The owned build/test artifacts were cleaned, and final target/regression runs were rerun serially; no test result above relies on that failed attempt.

## Next AutoBot stages

Evaluator: pending. Defense: conditional on evaluator findings. Final Control: pending. Merge/deploy/push: orchestrator only after review.
