# Follow-up: route creation toast income

The route-created toast and event log previously displayed only the base distance income, even though the city settlement adds Wonder and endpoint-specific Targowisko bonuses. Because the toast explicitly stated `+N złota/turę`, players could reasonably read it as the amount their city would receive; that amount was misleading when either bonus applied.

Updated `reportTradeRouteEvents` to use the same settlement helpers for the newly added route and display the marginal credited amount for the player's endpoint. This covers Wonder and endpoint-specific Targowisko adjustments plus the sea-route bonus (+1 for each maritime route beyond the first at a city). For multiple simultaneous route additions, the event list applies the additions sequentially against the prior route set so the second maritime connection receives its marginal sea bonus. The HUD regression varies endpoint Market ownership, asserts market/no-market amounts, verifies the player-side amount on internal routes, and checks a second sea route against before/after full settlement totals. Existing direction-reversal coverage confirms player city selection when the player is the `to` endpoint.

Checks:

- `node tools/trade-routes-hud-filter-test.cjs`: 63 passed, 0 failed.
- `npm run typecheck`: passed.
- `git diff --check -- src/main.ts tools/trade-routes-hud-filter-test.cjs`: passed.

Hashes at report time:

```
src/main.ts                            77dac8a0ec23518888d64e239897545781ea6b0cf37c7c005fd3c79f944548ba
tools/trade-routes-hud-filter-test.cjs a9213f3d3662ea5518e20c0e70bdb168610c28a2c6b34274d940658dcebee9f4
```

No commit, push, or deploy was performed.
