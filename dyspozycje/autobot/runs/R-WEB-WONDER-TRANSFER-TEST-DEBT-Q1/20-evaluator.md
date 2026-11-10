# Evaluator receipt — Wonder transfer test debt

STATUS: PASS — both structural assertions now match the production flows and retain meaningful ordering/scope constraints  
DOMAIN: GAME  
ID: R-WEB-WONDER-TRANSFER-TEST-DEBT-Q1  
EVALUATOR: Codex, `gpt-6-luna` / high  
BASE: `2b0f49da4c6101a86652e7919f12cd4454d18fdb`  
CANDIDATE: `14c74a9b6359965da8271c479cae17266ac0817a`

## Independent checks

- Read the dispatch, operator receipt, and applicable repository/process instructions. The candidate changes only the two named structural regexes in `gra/tools/wonder-transfer-on-conquest-test.cjs`; no production code changed.
- Independently ran the candidate test against `gra/src/main.ts`: **43 passed, 0 failed**. `git diff --check` passed.
- Ran the baseline test source from the base commit against the same production tree without replacing the candidate file: **41 passed, 2 failed**. The only failures are the annexation and cession structural assertions fixed by this candidate.
- Read `annexCityStateToOwner` and `transferCityByTreaty`. Annexation starts `wonderWatchAnnex`, loops over `csCities`, assigns each `city.ownerId = annexerId` inside that loop, closes the loop, and settles that same watch. Cession starts `wonderWatchCession`, stamps the founder, assigns `city.ownerId = toOwnerId`, and settles that same watch. Each watch name appears only at its declaration and matching settlement in `main.ts`.
- The new annexation pattern requires the watch declaration, the `csCities` loop, the ownership assignment inside the loop, the loop close, and settlement of the same named watch in that order. The cession pattern requires its named watch, the matching new owner assignment, then settlement of that same watch. The bounded spans accommodate the actual founder/default/production work without allowing the check to pass on only an assignment or an unrelated settle call. Neither pattern drops to a generic watch or settle match.
- The diff leaves all behavioral assertions intact, including wonder owner and city-yield checks through captures, annexation and fort capture, and the unchanged other ownership pathways. The complete candidate run confirms these existing checks still pass.
- Read save/restore source: save stores `placedWorldWonders.slice()` and restore assigns a sliced `saved.meta.placedWorldWonders` array, preserving each wonder object's `ownerId` under the shallow copies. No runtime save/load cycle is covered or was run; this test-only correction does not add a new save/load behavior assertion.

## Limits and verdict

The structural assertions inspect source text with bounded regular expressions, not a TypeScript parser or runtime invocation of `main.ts`. Their same-watch/order checks are meaningful for the current named production flows, but they are not a general proof that every future refactoring preserves lexical scope. Current evidence supports **stale structural test assumptions**, not a product defect. No evaluator objection; candidate is ready for the next process stage.
