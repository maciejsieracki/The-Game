# Operator round 2: unit stock epoch costs

Date: 2026-10-28 UTC

## Source identity

- Repository: `/workspace/all-topics-candidate`
- Base `HEAD`: `99bb834c6fe158d3bc59eb741f8fde9637b77027`
- The working tree contained prior product/data changes before this round. This round changed only the two test harness files listed below.
- SHA-256 of current validation sources:
  - `gra/tools/unit-stock-cost-test.cjs`: `3a49a6b60aef9b6ce630d3c9e4dc70ae1d28056bab8911d95fbd3497029c12a7`
  - `gra/tools/unit-epoch-cost-test.cjs`: `3d19c5cdf4970582706c3f4677d0eb748437206d0acfda9456c78f638da02197`
  - `gra/src/game/building-stock-cost.ts`: `e52f96dbe2fe44eb242930d92df7eb39a95720730e80e5aad85c657adf3888f7`
  - `gra/src/game/production.ts`: `efef983f108b36b180488308a3573eb73c1c3afec493fd7ccf603c854a2b57de`
  - `gra/data/units.json`: `0e031b60af2b7db4ad135629c8472f7119e26abd01ba56713c248e51ea7d3c56`

## Findings and test updates

The 18 `unit-stock-cost-test.cjs` failures were stale expectations against current data and the existing epoch scaling rule. `scaleCostByEpoch` applies Stone x1, Bronze x2, Iron+ x4 to unit stock; horse stock uses that same multiplier. Current data gives the Bronze Konnica a base stock requirement of 25 bronze, and the horse supplement base is 25, so its live cost is `{ braz: 50, kon: 50 }`. The Stone Ox Chariot costs `{ drewno: 25 }` and remains exempt from horse stock. Stone Wojownik costs `{ drewno: 13 }`.

Updated those expectations, the real Bronze/Iron row assertions, and the horse affordability fixture. Also corrected the related epoch test fixture to mark its 10% recruitment discount as `prod_koszt_jednostki_proc`; its previous bonus marker was ignored by the production formula, causing three unrelated stale 56-versus-64 failures. No product data or logic was edited in this round.

## Checks

- `cd gra && node tools/unit-stock-cost-test.cjs` — 58 passed, 0 failed.
- `cd gra && node tools/unit-epoch-cost-test.cjs` — 57 passed, 0 failed.
- `cd gra && node tools/building-epoch-cost-implementation-test.cjs` — 20 passed, 0 failed.
- `cd gra && npm run typecheck -- --pretty false` — passed (`tsc --noEmit`).

No deploy or push performed.
