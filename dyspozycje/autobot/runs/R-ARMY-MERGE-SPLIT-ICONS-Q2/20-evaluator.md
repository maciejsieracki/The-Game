# Independent evaluator — merge/split action icons

**Candidate:** `002a75815b067cf2cdbcae7eed5c488f8634ea34` (`autobot/army-merge-split-icons-fix-q2`)
**Verdict:** `PASS`

## Production path and behavior

The production context card in `gra/src/ui/hexContextTooltip.ts` calls `buildUnitActionBarHtml(u.actions)`. `gra/src/main.ts` supplies `split` and `merge` action IDs in the army-stack state and routes them through `handleSelectedUnitHudAction`: `split` calls `openSplitPanelForSelected()` and `merge` calls `openMergePanelForSelected()`. The side-panel delegates the button's `data-act` ID to `onContextAction`; the merge/split handler is unchanged by this candidate.

The commit changes only SVG path geometry in `gra/src/ui/unitActionBarHtml.ts` within product code. The action keys `split` and `merge`, button `data-act` values, labels from action data, ordering, disabled state, and action callback wiring are unchanged. Exact direction check: split's left arrow runs from center x=12 to x=4 and points outward; split's right arrow runs from x=12 to x=20 and points outward. Merge's left arrow runs from x=4 to center x=10 and points inward; merge's right arrow runs from x=20 to x=14 and points inward. The middle vertical path is retained as the stack marker.

I inspected `01-merge-split-icons.png`: two distinct symbols render side by side; the left split glyph points away from its center marker and the right merge glyph points toward its marker. No clipping or malformed paths are visible at the rendered size.

## Independent checks

- `node tools/army-merge-split-direction-icons-test.cjs`: **PASS**; bundles and invokes the production renderer and verifies both arrow directions and distinct path sets.
- `node tools/unit-action-bar-completeness-test.cjs`: **31/31 passed**.
- `node tools/unfortify-all-action-bar-test.cjs`: **16/16 passed**.
- `./node_modules/.bin/tsc --noEmit`: **passed**.
- `git diff --check`: **passed**.

The candidate diff confirms the only `gra/src` file changed is `gra/src/ui/unitActionBarHtml.ts`; no behavior handlers or action IDs changed. No product edits were made by the evaluator, and no integration, push, or deployment was performed.
