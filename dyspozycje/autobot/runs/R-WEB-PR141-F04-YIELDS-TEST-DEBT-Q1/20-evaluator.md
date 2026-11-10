# Independent Evaluator

STATUS: PASS
DOMAIN: INFORMATIONAL
TEMAT: R-WEB-PR141-F04-YIELDS-TEST-DEBT-Q1

## Finding

The fixture correction matches the tested helper boundary. `cityYieldPerTurn` computes local building/tax yields; route income is passed separately to `routeCashForCity` after the yield call in both `advanceCityEconomy` and preview flow. The operator's local building fixtures therefore fix the stale test setup rather than hiding a defect in `cityYieldPerTurn`. The current settlement helper applies `eko_pieniadz_port_proc` only to the typed maritime portion and leaves land proceeds unchanged (`gra/src/game/turn-economy.ts:231-235`); the two call sites pass the route total, maritime total, and owner key (`:2129-2133`, `:2742-2746`). The local Port-building cash coefficient remains exercised by this target (`gra/src/game/economy.ts:890-896`).

The nine fields still run against all 15 approved owners (135 owner/field assertions). The route breakdown checks remain: total-map conservation, typed sea income, land exclusion, disconnected-route exclusion, and sea-as-subset. Happiness coverage remains intact, including zero-owner neutrality, positive/negative/zero coefficients, unchanged Law, recomputed Order, over-denominator behavior, negative-net cases, and post-capture Law override.

Assertion inventory changed from 36 to 35 `assert.*` calls (31 to 30 `assert.equal` calls); the three raw-value loops are unchanged. The removed expectations treated route proceeds as inputs to `cityYieldPerTurn`; they could not verify current settlement behavior. The focused test passes when rerun from `gra/`:

```text
PASS: F04 yields: 135 owner/field checks, exact raw readback, route conservation/provenance, isolated synthetic +/-/0 stages, happiness recomposition, and post-capture Law preservation
EXIT=0
```

## Note

This target no longer directly behavior-tests `eko_pieniadz_port_proc` on settled maritime route cash. Its remaining route assertions cover typed route calculation/provenance, while its Port coefficient case covers building cash. The production settlement helper appears correct on inspection, so this is not evidence of a product defect; it is a boundary of this focused test and should not be described as route-settlement coverage.

OBRONA: POMINIĘTA — no rebuttal or disputed evidence was supplied for evaluator response.
