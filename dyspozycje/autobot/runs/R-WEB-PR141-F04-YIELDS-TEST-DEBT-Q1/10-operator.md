# R-WEB-PR141-F04-YIELDS-TEST-DEBT-Q1 — Operator

STATUS: PASS
DOMAIN: INFORMATIONAL
TEMAT: R-WEB-PR141-F04-YIELDS-TEST-DEBT-Q1
GOAL: Reproduce and diagnose the queued F04 yields test failure, then correct only stale test fixtures/expectations.
ZMIANY/COMMIT: Modified only `gra/tools/pr141-f04-yields-activation-test.cjs` and this run directory. No commit, push, merge, or deploy.
TESTY: Baseline failed at `grecy/eko_pieniadz_proc` (actual `0`, expected `114`; exit 1). After correction, `node tools/pr141-f04-yields-activation-test.cjs` passes: 135 owner/field checks plus the route, synthetic-value, happiness, and post-capture checks. `git diff --check -- gra/tools/pr141-f04-yields-activation-test.cjs` passes.
BLOKADY: None for this bounded test correction. Route-port settlement is outside this helper-level target and remains unproven by this test.
RUNDY: 1/5
NASTĘPNY KROK: Independent Evaluator review of the test-only diff and baseline diagnosis.
DEPLOY/PUSH: NIE WYKONANO

## Evidence and diagnosis

Base HEAD at operator start: `ab7507706d712f1ae675e6fef57459083399191b`. The exact target baseline reproduced the existing regression log's first failure:

```text
AssertionError: grecy/eko_pieniadz_proc: actual city-yield consumer applies exact source value once
0 !== 114
EXIT=1
```

This is stale test setup, not evidence of a product regression. The test supplied `dochodTrasHandlowych` to `cityYieldPerTurn` as if route proceeds were part of that helper's tax base. Current `gra/src/game/turn-economy.ts` settles route proceeds separately through `routeCashForCity` after `cityYieldPerTurn` in both the end-turn and preview flows. Current `gra/src/game/economy.ts` applies the nine named matrix stages to local city yields. The accepted F04 source approval remains the 360 approved cells; no data values or product helpers were changed.

The same stale fixture assumption appeared in money, gross trade, luxury, corruption, Port composition, owner-key, legacy-mask, and stacked Port/gross assertions. Those checks now use deterministic local building cash at the `cityYieldPerTurn` boundary. The Port assertion is explicitly limited to Port-building cash. Existing independent route checks still verify total-map conservation, typed maritime provenance, and exclusion of disconnected routes. No claim is made here that this helper-level test verifies maritime route cash settlement through the full turn flow.

## Test changes and result

The correction preserves the assertion that all nine approved fields are exercised for all 15 source owners (135 checks), synthetic positive/negative/zero cases, source-zero masking, owner-key isolation, route breakdown, happiness recomposition, percentage bounds, Law preservation, and post-capture Law override. It replaces only inputs that belonged to a later route-settlement stage with inputs consumed by the helper under test.

Final command from `gra/`:

```text
node tools/pr141-f04-yields-activation-test.cjs
PASS: F04 yields: 135 owner/field checks, exact raw readback, route conservation/provenance, isolated synthetic +/-/0 stages, happiness recomposition, and post-capture Law preservation
EXIT=0
```

Changed paths in this operator scope:

- `gra/tools/pr141-f04-yields-activation-test.cjs`
- `dyspozycje/autobot/runs/R-WEB-PR141-F04-YIELDS-TEST-DEBT-Q1/00-dispatch.md`
- `dyspozycje/autobot/runs/R-WEB-PR141-F04-YIELDS-TEST-DEBT-Q1/10-operator.md`

Read-only product files included `gra/src/game/economy.ts`, `gra/src/game/turn-economy.ts`, and `gra/data/civ-matrix.json`; they have no changes from this operator. Shared-tree work from other tasks remains outside this report.
