# R-WEB-VETERANS-TEST-DEBT-Q1

**Operator:** LunaHigh (`nextslotafterbattleloot11`)
**Base:** `43c5487f69ab052820672dfbcddbfed0ab0bb5dc` (`/workspace/main-integration-20261029`)
**Model:** LunaHigh (handover)

## Scope

Resolve the known `gra/tools/weterani-test.cjs` failure by checking its exact assertion against current unit data, the deployed consumer, and the approved power-display decision. Change only stale test expectations when current behavior is proven. Do not alter game rules, weaken assertions, or touch shared task/register files. No build or Chromium.

## Handover failure and reproduction

Handover: test debt `weterani-test`, 1 failure. Baseline command: `cd gra && node tools/weterani-test.cjs`. Baseline: **78 PASS, 1 FAIL** at section 10, `stackFieldPowerM(... defOf=nominalny) == 49`, actual `98`.

## Applicable current design

`docs/decyzje/R-MOC-TABLICZKA-VS-CIVPOWER-Q1.md` says the map token badge uses full effective power and civilization power uses natural unit values plus veteran bonus. `gra/src/game/armyMerge.ts::stackFieldPowerM` sums `sumRosterFieldM` over the injected definitions; `main.ts` injects `combatPowerFullDisplayDefFor` for the badge. The armyMerge source comment explicitly says pre-battle remains nominal and is not in this function's scope.

The checked-in `gra/data/units.json` Konnica row has `fieldPower: 98`. Its power calculation in `gra/src/game/unit-power.ts` yields 98, matching `stackFieldPowerM` for a raw definition. A separate wiki inventory reports 49 vs 98 for Konnica, but does not override the current unit data or the current consumer's result.

## Allowed change

Only section 10 of `gra/tools/weterani-test.cjs`: compare nominal stack power with the existing `mRekrut`/`armyFieldPower` baseline instead of pinning the stale 49, refresh the effective-power labels to use computed `expectedMWeteran`, and correct comments that incorrectly included pre-battle or named superseded decisions. No product code changed.
