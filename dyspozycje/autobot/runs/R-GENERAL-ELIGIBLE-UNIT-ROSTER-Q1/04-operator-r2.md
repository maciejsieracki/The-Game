# AutoBot Operator — leader roster R2

STATUS: **IMPLEMENTED — READY FOR EVALUATION R2**. This revision resolves the R1 evaluator objection for the Bronze pre-unlock fallback. The change remains limited to the `bestGeneralUnitForOwner()` selector and the focused roster test.

## Correction

Q3=B requires the strongest currently available infantry/cavalry before the approved Bronze chariot can be recruited. The Bronze fallback now filters out every chariot model by unit name, including the otherwise legal Stone Ox Chariot. It continues to retain eligible non-chariot mounted cavalry, including missile-capable cavalry allowed by Q2=A, and eligible melee infantry. The approved civilization-specific or generic Bronze chariot still wins immediately when it is legally offered. Stone-after-Wheel selection remains Ox Chariot.

## Boundary regression

The focused fixture for Bronze before Jeździectwo now includes the legal prior-era `Rydwan (woły)` alongside Warrior and Spearman. The Spearman is the expected fallback even if the Ox Chariot has higher power. Per-civilization Bronze expected-fallback calculation also explicitly excludes all chariot names. Existing positive checks continue to confirm the approved chariot once unlocked and the Stone pre/post-Wheel models.

## Verification

- `node gra/tools/general-eligible-unit-roster-test.cjs` — PASS, 137 checks.
- `node gra/tools/general-capital-recruitment-order-test.cjs` — PASS, 0 failures.
- `cd gra && npm run typecheck` — PASS (`tsc --noEmit`).
- Scoped `git diff --check` — PASS.

No AI tests, unit data, ordinary recruitment rules, unrelated source hunks, commit, push, integration, or deployment were changed/performed.
