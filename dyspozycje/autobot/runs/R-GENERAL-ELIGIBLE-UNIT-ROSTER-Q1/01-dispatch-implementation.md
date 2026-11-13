# AutoBot dispatch — leader model roster by civilization and era

TEMAT: R-GENERAL-ELIGIBLE-UNIT-ROSTER-Q1
RUNDA: 1/5 (implementation dispatch after owner decisions)
DATA: 2026-10-28
MODEL + EFFORT: Operator GPT-6 Luna Medium / Evaluator GPT-6 Luna Medium / Final Control GPT-6 Luna Medium

## GOAL
Select the Wódz/Generał model from owner-approved unit categories and current purchase availability, rather than arbitrary highest power. Preserve the shared unit stats/cost/maintenance of the selected production unit.

## OWNER-APPROVED RULES
- Stone before Wheel: Warrior; after Wheel: Ox Chariot. The existing `stoneGeneralUnitId()` behavior is retained.
- Bronze: use the civilization's advanced Bronze chariot where one exists (including Mycenaean, Shang, Egyptian, Sumerian, and Hittite Kapadokian variants); otherwise generic horse chariot.
- Iron: use that civilization's best available cavalry/mounted equivalent.
- Exclude production classes `Dystans` and `Oblężnicza`; keep chariots and cavalry even when their unit data has `missileAttack > 0` (owner answer `R-GENERAL-ELIGIBLE-UNIT-ROSTER-Q2=A`).
- Bronze fallback before the approved chariot is recruitable (owner answer `R-GENERAL-ELIGIBLE-UNIT-ROSTER-Q3=B`): choose the strongest currently available eligible infantry/cavalry; switch the leader model to the approved chariot once it becomes available.
- Bronze before the approved chariot is actually purchasable: fall back to the best currently available infantry/cavalry; once unlocked, switch to the approved chariot model (owner answer `R-GENERAL-ELIGIBLE-UNIT-ROSTER-Q3=B`).
- Preserve current/prior-era availability, technology, building and capital recruitment gates. Wódz/Generał display title remains independent from the selected model's catalog name.

## ACCEPTANCE
- Production selector chooses the correct model across all 15 civs and all eras under the agreed category rule.
- Regression tests cover Stone Wheel switch, Bronze national chariots/fallback, Iron cavalry and exclusions, plus unavailable unit fallback/no offer.
- Existing commander purchase/order tests, TypeScript and scoped diff check pass.

## ALLOWLIST
- `gra/src/main.ts` only the `bestGeneralUnitForOwner()` selector hunk
- `gra/tools/general-capital-recruitment-order-test.cjs`
- one focused new roster test under `gra/tools/`
- this run directory and the matching request-register entry

No edits to combat stats, unit data, unrelated `main.ts` hunks, AI planner, recruitment UI, commit, push or deploy. Preserve all concurrent worktree changes. Operator must inspect unit metadata and provide a per-civilization result table in the report.

## FLOW
Operator → independent Evaluator → Final Control → narrow orchestrator integration → READY_FOR_DEPLOY → separate owner deploy gate.
