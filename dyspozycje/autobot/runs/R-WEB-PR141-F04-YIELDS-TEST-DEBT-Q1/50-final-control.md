# R-WEB-PR141-F04-YIELDS-TEST-DEBT-Q1 — Final Control

STATUS: PASSWITHNOTES
DOMAIN: INFORMATIONAL
TEMAT: R-WEB-PR141-F04-YIELDS-TEST-DEBT-Q1

## Control result

The fixture-only correction is valid for the `cityYieldPerTurn` boundary. That helper consumes local terrain, buildings, and tax inputs; route proceeds are settled afterward by `routeCashForCity` in the end-turn and preview flows. The changed cases now provide local tax/building cash while retaining the 15-owner × 9-field matrix checks and the unrelated synthetic, owner-key, legacy-mask, happiness, and capture assertions.

Rerun from `gra/` passed:

```text
node tools/pr141-f04-yields-activation-test.cjs
PASS: F04 yields: 135 owner/field checks, exact raw readback, route conservation/provenance, isolated synthetic +/-/0 stages, happiness recomposition, and post-capture Law preservation
EXIT=0
```

The assertion inventory decreases from 36 to 35 calls (`assert.equal` from 31 to 30). This is acknowledged and expected: the removed expectations supplied route proceeds to `cityYieldPerTurn`, so they did not test the helper's current input contract. The replacement Port case still covers the Port-building coefficient; local tax/building cases continue to exercise the relevant named city-yield stages. The test retains its route breakdown contract for total conservation, typed maritime provenance, land exclusion, and disconnected-route exclusion.

## Coverage note

There is no runtime assertion here for Port-coefficient settlement of maritime route cash. Read-only inspection confirms `routeCashForCity(total, maritime, civKey)` applies `eko_pieniadz_port_proc` to the typed maritime share and preserves land proceeds, and both end-turn and preview callers pass total, maritime, and owner-key values. This focused test does not execute that settlement helper or prove the call-site behavior. The report therefore makes no claim of route-settlement coverage; this is a test coverage gap, not evidence of a product defect. No new runtime Port-route test was added within this test-fixture-only control.

`git diff --check -- gra/tools/pr141-f04-yields-activation-test.cjs` passed. No source or data edits were made by final control.
