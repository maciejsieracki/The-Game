# Evaluator — default battle deployment

STATUS: FAIL — concrete objection requires another Operator round.
DOMAIN: GAME
TEMAT: R-BITWA-DEFAULT-ROZMIESZCZENIE-Q1
GOAL: Start and deploy reset place infantry forward, then javelins, archers, slingers, cavalry/chariots on the outer wings, siege behind ranged bands, and commander last, with unique planned slots for large rosters.

## Independent checkout and source identity

- Checkout: `/workspace/all-topics-candidate`.
- Branch: `integration/robocza-all-topics-20261027`.
- HEAD at evaluation: `f5a32c4e5f01bb6a3eb7276bcd614bc39c264ca3` (candidate includes the earlier scoped merge-panel integration commit).
- Candidate source hashes match the Operator report:
  - `gra/src/battle/formationRules.ts`: `69686cf53e28e6afd2a43129dbe2f559938451bad590ea30de0ce9df210b8b33`
  - `gra/src/battle/battleScene.ts`: `62948aa71ebe0cb6da123f4f6e4cb11ef79f6af1a14d89566be274847fc6e511`
  - `gra/tools/battle-formation-rules-test.cjs`: `3ef20e380c0e19017742b3377e1ceaa0169d194c34e0446f3c53967ea721d17d`

## Verified

- `node gra/tools/battle-formation-rules-test.cjs`: PASS. It checks the requested band order, 45 infantry overflow, 500 mounted planned slots, uniqueness by planned rank/row, and both production Scene call sites. Existing Attack pacing, Charge, and opening ranged-shot assertions also pass.
- `node ./node_modules/typescript/bin/tsc --noEmit` from `gra/`: PASS.
- Direct Vite build to `/tmp/battle-formation-evaluator-dist`: PASS, 916 modules.
- `git diff --check` on the three allowlisted code/test files: PASS.
- The candidate diff in `battleScene.ts` uses the shared slot planner for both initial setup and deploy reset. The changed hunks do not modify the Attack/Defense/Charge doctrine implementation.
- Cavalry fallback bounds are restricted to the same outer wing bands in both placement paths.

## Concrete objection

`battleScene.ts::initialBattleRoleOf()` is the production classifier used by the two Scene paths, but the test constructs every fixture object with a preassigned `role` and passes `unit => unit.role` to `initialBattleFormation()`. Therefore the test never exercises the production classifier. In addition, `formationRules.ts::classifyInitialBattleRole()` duplicates the classification logic but is not called by `battleScene.ts`. A wrong production mapping of a real `BattleUnit.kategoria` or unit name (for example an Oszczepnik classified as generic melee) could still pass the entire new formation test.

**Required correction:** establish one production classification function used by both Scene paths and call that exact function in the test with representative production-like categories/names for infantry, Oszczepnik, Łucznik, Procarz, mounted units, siege, and commander. Then rerun the focused test, typecheck, direct build, and diff-check. Do not relax the row/slot assertions.

This is one bounded issue in the current allowlist; no other blocking code defect was found in the reviewed slot layout.

## Limitations

The test exercises planner slot coordinates and static Scene wiring, not a rendered Chromium battle. It does not confirm visual spacing or terrain fallback in a production map. Preserve this as a note for Final Control/playtest; do not report a real-render check as completed.

DEPLOY/PUSH: NOT EXECUTED — outside the Evaluator role; Final Control and integration remain pending.
NEXT STEP: return this concrete objection to the Operator for round 2 under the same topic and allowlist.
