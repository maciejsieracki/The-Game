# Evaluator: unit stock affordability diagnostics

Date: 2026-10-28 UTC

**PASS.** The two revised messages match the fixture and live `unitStockCost` result: Bronze Konnica costs 50 bronze and 50 horses; the test checks 50/49 as unaffordable, then 50/50 as affordable. `cd gra && node tools/unit-stock-cost-test.cjs` passes: **58 passed, 0 failed**.

Current test SHA-256: `883225bfbc861a945adbdb34f1d0ea0ad8f507b80d7b2c3d4bdb9d1e1838cf26` (`gra/tools/unit-stock-cost-test.cjs`). Base HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`; evaluation applies to the dirty working tree.
