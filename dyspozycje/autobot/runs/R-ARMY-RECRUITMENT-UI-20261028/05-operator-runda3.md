# Operator report — R-ARMY-RECRUITMENT-UI-20261028 — runda 3

Status: **round-2 evaluator objection addressed; ready for independent evaluation**. The mass recruitment test now asserts the exact production `main.ts` boot callback: `capitalCityIdForOwner(ME())` is passed to `mountGeneralRecruitmentCardForArmy(capitalId, host)`. Its Chromium harness still supplies a callback to mount the renderer, so boot wiring is explicitly a source-level assertion; the full game boot was not run in Chromium. The browser test renders the production Army panel, commander renderer, and city renderers. No commit, push, merge, or deploy was made.

## Regression coverage

`gra/tools/empire-mass-recruitment-test.cjs` asserts the production boot-wiring source and renders 24 city rows plus production city recruitment renderers in Chromium. It verifies exactly one commander card above the city lists, no duplicate commander in the capital city row, and one purchase button. Clicking that production card's DOM button invokes the configured purchase callback exactly once. The DOM `.click()` call is used because a city detail control overlaps the button when Playwright attempts a pointer click in the 24-row layout.

The production transaction path remains covered by `gra/tools/general-capital-recruitment-order-test.cjs`, including exactly one queue entry and single deductions of gold, manpower, and stock after a card click.

## Verification

From `gra/`:

- `node tools/general-capital-recruitment-order-test.cjs` — **19 passed, 0 failed**.
- `node tools/empire-mass-recruitment-test.cjs` — **30 passed, 0 failed** in Chromium.
- `npm run typecheck` — **passed** with no diagnostics.
- Scoped `git diff --check` across the allowed source and test files — **passed**.

Pre-existing unrelated changes in `main.ts` and other working-tree files were preserved. No production source changes were made for round 3; only the allowlisted test and this report were added/updated.
