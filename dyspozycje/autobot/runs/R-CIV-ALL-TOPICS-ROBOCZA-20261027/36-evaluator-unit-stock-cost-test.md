# Independent evaluator: unit stock and epoch cost tests

Date: 2026-10-28 UTC

## Verdict

**PASS.** The revised assertions exercise the live epoch scaling helper through unit stock costs and validate the changed Bronze/Iron expectations against the current data. They cover Stone ×1 (Wojownik and Ox Chariot), Bronze ×2, Iron ×4, Mount horse stock scaling, and the Ox Chariot's wood-only cost with no horse supplement. The discount fixture now supplies the production matrix marker (`prod_koszt_jednostki_proc`) that `unitMoneyCost` actually reads, and the layered cost expectations pass through the live purchase/card paths.

## Reproduced checks

- `cd gra && node tools/unit-stock-cost-test.cjs` — **58 passed, 0 failed**.
- `cd gra && node tools/unit-epoch-cost-test.cjs` — **57 passed, 0 failed**. This includes live Stone/Bronze/Iron stock assertions, the Bronze discount through purchase and production-card paths, save/load behavior, and a mutation check that makes the test fail when unit epoch scaling is removed. The test restored the temporarily mutated source after the mutation run.
- `cd gra && npm run typecheck -- --pretty false` — passed (`tsc --noEmit`).

## Coverage notes

`unit-stock-cost-test.cjs` uses live `units.json` Bronze and Iron rows for material scaling; its Mount loop checks all current non-Ox Mount rows against their era multiplier. `unit-epoch-cost-test.cjs` independently checks named Stone, Bronze, Iron and Mount rows and an Iron Mount fixture, covering both material and horse supplements. The discount fixture uses the correct marker identity and the expected result is asserted for player purchase, AI purchase, and production card paths.

Two failure messages in the affordability block still say “5 horses, has 4” and “5 horses + bronze” although the revised fixture now tests 50 versus 49/50. The assertions are correct, but those labels should be updated for accurate diagnostics. This is a non-blocking clarity issue.

## Source identity and limits

- Repository: `/workspace/all-topics-candidate`
- Base `HEAD`: `99bb834c6fe158d3bc59eb741f8fde9637b77027`
- Working tree remains dirty from prior work. Verdict applies to current bytes, not a commit. No source or test files were edited by this evaluator.
- SHA-256:
  - `gra/tools/unit-stock-cost-test.cjs`: `3a49a6b60aef9b6ce630d3c9e4dc70ae1d28056bab8911d95fbd3497029c12a7`
  - `gra/tools/unit-epoch-cost-test.cjs`: `3d19c5cdf4970582706c3f4677d0eb748437206d0acfda9456c78f638da02197`
  - `gra/src/game/building-stock-cost.ts`: `e52f96dbe2fe44eb242930d92df7eb39a95720730e80e5aad85c657adf3888f7`
  - `gra/src/game/production.ts`: `efef983f108b36b180488308a3573eb73c1c3afec493fd7ccf603c854a2b57de`
  - `gra/data/units.json`: `0e031b60af2b7db4ad135629c8472f7119e26abd01ba56713c248e51ea7d3c56`

No deploy or push performed.
