# Final Control — Wonder transfer test debt

STATUS: PASS — stage 8 complete; ready for integration review
DOMAIN: GAME
ID: R-WEB-WONDER-TRANSFER-TEST-DEBT-Q1
FINAL CONTROL: Codex, `gpt-6-luna` / high (independent)
BASE: `2b0f49da4c6101a86652e7919f12cd4454d18fdb`
CANDIDATE: `14c74a9b6359965da8271c479cae17266ac0817a`

## Scope and process

- The dispatch GOAL remains unchanged: repair the wonder-transfer test debt and distinguish stale structural assumptions from a product defect. The changed production behavior was not expanded.
- The candidate diff changes only two structural regexes in `gra/tools/wonder-transfer-on-conquest-test.cjs`. The operator and evaluator receipts are run records; no production source or game data is changed.
- No evaluator objections are recorded, so an Operator response and defense were not required. The evaluator receipt explicitly says there is no objection and that the candidate is ready for the next process stage.
- The candidate commit is the expected isolated HEAD. The only worktree additions at control time were the evaluator receipt and this report. `git diff --check` passed; the temporary baseline test copy was removed and the candidate file was confirmed restored to HEAD.

## Direct verification

- Ran `cd gra && node tools/wonder-transfer-on-conquest-test.cjs` on the candidate: **43 passed, 0 failed**.
- Independently ran the test source from the base commit as a temporary sibling test file against the same production source, then removed the temporary file: **41 passed, 2 failed**. The failures were only the city-state annexation and peace cession structural assertions.
- Read both live production paths in `gra/src/main.ts`. Annexation starts `wonderWatchAnnex`, assigns each captured city's owner inside the `csCities` loop, closes that loop, then settles `wonderWatchAnnex`. Cession starts `wonderWatchCession`, assigns `city.ownerId = toOwnerId`, then settles `wonderWatchCession`.
- Reviewed the candidate patterns against those paths. They retain named-watch, assignment, loop (for annexation), and matching-settlement ordering requirements, while allowing the intervening founder/default/production work present in the source. No assertion was removed, made optional, or relaxed to a generic watch/settle match. Behavioral assertions and the other structural checks are unchanged.
- `git diff --check 2b0f49da4c6101a86652e7919f12cd4454d18fdb..14c74a9b6359965da8271c479cae17266ac0817a` passed.

## Evidence limits and verdict

The repeated baseline failures and direct source read support **stale structural test assumptions**, not a product defect. The revised checks are bounded source-text regexes, not a TypeScript parser or runtime test of `main.ts`; they constrain the current named flows but do not prove lexical scope under every future refactor.

The evaluator and operator read the save/restore code and report that the save snapshot copies `placedWorldWonders` with `.slice()` and restore similarly slices the saved array, preserving each wonder object's `ownerId` through the shallow copy. I confirmed those source lines. **I did not run a runtime save/load cycle**, and this test-only candidate does not add save/load behavior coverage. This is a disclosed coverage limit, not a blocker for the narrowly dispatched test-pattern correction.

No per-complaint rulings are needed because the evaluator recorded no objections. Aggregate verdict: **PASS**. Stage 8 is complete; the candidate is ready for the orchestrator's integration review. **Deploy stage: N/A — test-only change; no shipped runtime behavior changes.** Integration, deploy readback, push, and cleanup remain outside this Final Control and are not claimed complete.
