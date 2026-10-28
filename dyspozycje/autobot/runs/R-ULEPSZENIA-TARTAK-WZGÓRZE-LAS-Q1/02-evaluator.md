# AutoBot independent evaluation — sawmill on wooded hill

STATUS: PASS WITH NOTES.

## Positive evidence

- Source regressions: `node gra/tools/sawmill-hill-relief-test.cjs` passed 8/8; `node gra/tools/relief-preserving-mine-prefix-test.cjs` passed 24/24. Typecheck and Vite build passed in the integrated worktree.
- Real render: a temporary, untracked adaptation of `oboz-lowiecki-las-znika-render-test.cjs` placed a sawmill on a visible wooded hill at q=41, r=28. Before placement: terrain `wzgorza`, overlay `las`, 3 decor instances. After placement: layers `["tartak"]`, overlay still `las`, 3 decor instances. The sawmill model is visible against the left slope in the after screenshot; the mound and trees remain.
- Before/after images: `/tmp/sawmill-forested-hill-visual-review-20261028/po-3-wzgorze-las-przed-tartakiem.png` and `/tmp/sawmill-forested-hill-visual-review-20261028/po-4-wzgorze-las-po-tartaku.png`.

## Notes on the reused legacy harness

The complete adapted legacy harness ended 26 PASS / 4 FAIL. Those failures do not invalidate the sawmill assertions above, but they show that the old oboz scenario is not a reliable overall gate in this checkout:

- It measures the oboz's visible decor count as 3→1 in both “before” and “after” variants, so its mutation assertion does not distinguish them.
- Its old `TERRAIN_ALLOW` assertion expects `Wybrzeze`, while the current allowed set is `PlytkieMorze, Morze`.
- It records two HTTP 404 resource requests in the page console.

The adapted harness and temporary config were removed; tracked source files were not altered by this evaluator. No commit/deploy was made.
