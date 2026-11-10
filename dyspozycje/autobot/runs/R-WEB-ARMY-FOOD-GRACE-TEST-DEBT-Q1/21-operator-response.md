# Operator response — factual comment correction

Applied the FC note with a comment-only change in `gra/tools/glod-wojska-karencja-test.cjs`. The first-turn fixture has 20 units; each has base upkeep 1, and the approved FALA1×FALA2 multiplier is 4, so its army cost is 80 per turn.

Exact diff:

```diff
-  // 20 jednostek x 1 zywnosc/ture, brutto=0 (100% do rozwoju) -> doPanstwa=0,
-  // kosztArmii=20 -> netto -20/ture -> zapasy monotonicznie maleją.
+  // 20 jednostek x 1 bazowej żywności/turę, koszt armii ×4 (FALA1+FALA2)
+  // daje kosztArmii=80; brutto=0 -> deficyt 80/turę przy rezerwie 0.
```

No assertion, fixture, product source, or test behavior changed. The prior 40/40 test result remains the regression evidence; no rerun was needed for this comment-only correction. No browser, build, or commit operation was used.
