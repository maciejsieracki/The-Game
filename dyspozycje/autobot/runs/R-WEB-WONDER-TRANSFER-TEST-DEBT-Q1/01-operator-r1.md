# Operator receipt — Wonder transfer test debt

STATUS: PASS — test-only correction; no product defect found
DOMAIN: GAME
ID: R-WEB-WONDER-TRANSFER-TEST-DEBT-Q1
OPERATOR: Codex, `gpt-6-luna` / high (assigned route)
BASE: `2b0f49da4c6101a86652e7919f12cd4454d18fdb` (`codex/wonder-transfer-609`, isolated worktree)

## Evidence

- Read `README.md`, `docs/decyzje/R-PROC-AUTOBOT.md` §1 and this run's dispatch.
- Unmodified baseline: `cd gra && node tools/wonder-transfer-on-conquest-test.cjs` exited 1 with **41 passed, 2 failed**. The failures were solely the structural assertions for city-state annexation and peace cession.
- The annexation path in `gra/src/main.ts` starts `wonderWatchAnnex`, stamps the city's founder, assigns `city.ownerId = annexerId` inside the `csCities` loop, then settles that same watch (`annexCityStateToOwner`). The cession path starts `wonderWatchCession`, stamps the founder, assigns `city.ownerId = toOwnerId`, then settles that same watch (`transferCityByTreaty`). The assertions expected the assignment immediately after the watch/loop and therefore rejected valid intervening calls.
- Corrected only those two patterns in `gra/tools/wonder-transfer-on-conquest-test.cjs`. They still require the named watch, matching ownership assignment, and matching settle call in order; annexation also requires the assignment inside the loop. No assertions were deleted or weakened, and no product helper was changed.
- Corrected run: **43 passed, 0 failed**. `git diff --check` passed.
- The existing scenarios cover player-to-AI and AI-to-player captures, annexation, cession structural wiring, rebellion/barbarian ownership rules, founding and fort capture, ownership, and bonus transfer. Their behavior assertions all passed.
- Save/load source readback: the save snapshot stores `placedWorldWonders.slice()` and restore reads `saved.meta.placedWorldWonders` back into `placedWorldWonders`; each object's `ownerId` is preserved by these shallow array copies. No runtime save/load cycle was run because product code was unchanged and this is test-pattern debt.

## Result

Classification: **stale structural test assumptions**, not a current product defect. The only candidate change is the owned test file plus this receipt. No build, browser, global registry, push, merge, or deploy was performed.
