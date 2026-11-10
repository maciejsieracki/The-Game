# 50-final-control — R-WEB-ARMY-SPLIT-GRAPHICAL-HEX-PICKER-Q1

**STAGE 8: PASS WITH NOTES.** Final control found no blocking issue in the authorized scope. This is component and integration-boundary evidence; it does not claim a full campaign or full-game end-to-end pass.

## Reviewed implementation

I reviewed the actual diff in `gra/src/ui/armySplitPanel.ts` and `gra/src/main.ts`, the focused Chromium test, and both corrected screenshots. The panel renders a center ARMIA cell and six direction cells with terrain, accessible direction labels, selectable styling, and disabled state/reason. Graphical mode omits coordinate text. The source-city destination is represented by the center button when the existing destination list includes the city choice. The existing `onSplit(ids, q, r)` callback remains intact, and the adapter only supplies neighbor descriptions; it does not change split, movement, or stack validation rules.

The adapter's six directions map to axial deltas E `(+1,0)`, NE `(+1,-1)`, NW `(0,-1)`, W `(-1,0)`, SW `(-1,+1)`, SE `(0,+1)`. These agree with the positions from `hexNeighborCoords` and `axialToWorld` in the pointy-top orientation. The focused test log reports all six callback coordinate mappings and the source-city callback passing.

The corrected 1280×800 and 853×533 CSS-pixel (150%-equivalent) captures visibly fit the panel and show the six-cell arrangement. Their SHA-256 values match the independent evaluator readback: `065117e78d347ecc51e6a3151909fd8e392d11d4d19552b07837b3e2fab0dec2` and `ac272207de98102593a08e810d9533f56c45e2a0b727cfb0252b2d47a4dd9888`.

## Validation evidence

The independent evaluator recorded:

- Focused Chromium graphical picker: **14 PASS / 0 FAIL**, including coordinate-free visible labels, six axial callbacks, source-city choice, disabled terrain reason, keyboard focus, and 150%-equivalent/narrow viewport fit.
- Legacy panel path without `neighbors`: **15 PASS / 0 FAIL** in the existing scroll-grid test, including callback and invalid split behavior.
- Split movement regression: **4 PASS / 0 FAIL**.
- Typecheck: exit 0; `git diff --check`: PASS.

I inspected the final screenshots directly and recomputed their hashes. I did not rerun browser suites because the independent evaluator evidence covers the requested cases and the browser is now reserved by the concurrent Civpedia task. No full campaign was run or evaluated.

## Scope and limits

The reviewed product changes are limited to the graphical panel, the minimal six-neighbor data adapter at its existing call site, and the focused panel fixture. Existing legacy callers remain compatible when `neighbors` is omitted. Validation demonstrates the panel fixture and adapter contract, not a full live campaign flow across every map, terrain, fog state, or unit combination. No source changes were made during this final control.
