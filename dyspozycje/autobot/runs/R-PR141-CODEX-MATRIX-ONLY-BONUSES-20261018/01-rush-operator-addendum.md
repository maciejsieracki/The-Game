# 01 addendum — rush owner-route source execution

TEMAT: `R-PR141-CODEX-MATRIX-ONLY-BONUSES-20261018`  
SCOPE: testing-only extension requested by root after the initial rush operator report. No application or source-data edits.

Extended `gra/tools/pr141-f04-rush-activation-test.cjs` to parse and execute the actual TypeScript declarations and callback expressions from `cityPanel.ts` and `main.ts` in bounded VM contexts, using the exported production `rushCost` implementation. The UI quote path executes the source `rushCost(prod, rushCostModifierForCity(city))` initializer and its actual `rushCostModifierForCity` function with mocked owner-key and matrix dependencies. The payment test executes each of the two actual `onRushBuy` callbacks with a mocked owner matrix resolver and isolated city/treasury state.

The injected raw values prove the owner-specific consumers are non-vacuous despite all source cells currently being zero:

- owner 0: `+0.20`, base 61 -> UI quote and actual debit 74;
- owner 7: `-0.20`, base 61 -> quote/debit 49;
- owner 42: `0`, base 61 -> quote/debit 61;
- AI owner 99: `+0.50`, base 61 -> quote/debit 92;
- unknown owner 101: neutral fallback, base 61 -> quote 61.

For each actual main callback, the test verifies that the owner's treasury loses exactly the displayed amount once. It also passes a stale quote for owner 0 and confirms both callbacks reject it without treasury debit or queue mutation and emit the existing warning. No game loop, DOM, world state, save, or runtime boot is involved; test data exists only inside the VM harness.

Verification from `/workspace/The-Game/gra`: `node tools/pr141-f04-rush-activation-test.cjs` — **72 passed, 0 failed**; `git diff --check -- gra/tools/pr141-f04-rush-activation-test.cjs` — clean. All production and UI source remained frozen. This adds source-execution evidence for quote/payment owner routing; it is not browser/runtime acceptance.
