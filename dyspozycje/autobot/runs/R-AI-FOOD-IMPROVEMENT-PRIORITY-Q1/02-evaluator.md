# Independent Evaluator — R-AI-FOOD-IMPROVEMENT-PRIORITY-Q1

Date: 2026-10-29
Candidate: `6f9085fe6ca23b9e0635eb7390cdffa88d4e87ed`
Verdict: **FAIL — return to Operator for one acceptance-scope correction**

## Independent checks

- Reviewed the commit diff in `auto-improvements.ts`, `ai.ts`, and `main.ts`, plus the operator report and staged-picker behavior test.
- `TMPDIR=/workspace/tmp-food-eval node tools/ai-food-improvement-priority-stages-test.cjs` — **11/11 PASS**.
- `node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` — **PASS**.
- Initial test attempt using default `/tmp` failed because `/tmp` is full (ENOSPC); rerun with a workspace-local temporary directory passed. This is environment pressure, not a product failure.

## Findings

1. River-forest preparation is isolated to river forests in the staged path and blocks farms until eligible stage-0 cuts are exhausted. Tests cover the cut-before-farm ordering, multi-turn continuation under the per-city order cap, and the general woodcut toggle override.
2. Farm picks precede later food picks across the staged cities. The test checks cross-city ordering and that AI and player auto-building callers opt into the shared planner.
3. A blocked earlier stage prevents a later stage from running; the mutation probe shows the behavior test fails if staged selection is disabled.
4. **Acceptance gap:** the second stage is named/required as livestock (“trzoda”), but the implementation puts `oboz_lowiecki`, `lodzie_rybackie`, and `warzelnia_soli` into that same blocking stage alongside `bydlo`, `owce`, and `lama`. Those are hunting, fishing, and salt improvements, not livestock. Consequently they can delay the explicitly requested final `irygacja`/`tarasy` stage, even after all eligible livestock fields have been built. The current test also treats this enlarged key list as the livestock stage, so it does not catch the mismatch.

## Required correction

Keep only the intended livestock improvements in the `trzoda` stage (at minimum `bydlo`, `owce`, `lama`). Place hunting/fishing/salt improvements according to the owner-approved ordering without letting them block irrigation/terraces after livestock is complete. Add a regression where all livestock candidates are exhausted but a fishing/hunting/salt candidate remains, and assert the agreed stage behavior explicitly. Re-run focused tests and typecheck, then request a fresh independent evaluation.

No product files were edited by this evaluator. No merge, deployment, or push was performed.
