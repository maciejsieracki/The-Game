# 20 — Independent evaluator

**Verdict: PASS.** The correction in `427f2d76` closes the scope leak from the first review. The 30-turn and indefinite options now apply only to cyclic quantitative-resource exchanges; resource-access duration retains its 20-turn cap and has no indefinite option. No product files were edited during this evaluation.

## Independent review

Reviewed `00-dispatch.md`, `01-operator.md`, the initial FAIL report in this file, and `21-operator-correction.md`, then inspected the candidate at `427f2d76dee9db15e4d5024c0f27b87bf0241904` relative to base `9f6f7771`.

- The basket selects max 30 plus `Bezterminowo` only when there is no resource-access item and the exchange is per-turn quantity exchange (or that mode is being preselected). The access path retains max 20 and the legacy `+100` stepper; it does not render `Bezterminowo`. Validation independently caps access at 20 and cyclic exchange at 30.
- Numeric cyclic duration is submitted as `exchangeDurationTurns`; indefinite is explicitly `null`. `turns` remains the finite valuation horizon. Both proposal evaluation and AI-pending acceptance resolve `null` to `wygasaTura: null`, clamp a supplied number to 1–30 and add it to the current turn, and retain the legacy finite `turns` fallback when the new field is absent (legacy clamp 1–20). Thus absent is not conflated with null.
- Proposal routing in `main.ts` carries the field through negotiation and counteroffer payloads. Basket prefill restores the indefinite selection, and choosing a finite duration (including 30) changes the counteroffer payload back to a number.
- The domain test covers finite 30 and indefinite active deals. JSON serialization preserves `wygasaTura: null`; `hydrateActiveDeals` spreads saved deal fields before normalizing kind/parties, so null survives hydration. Existing finite numeric expiry remains unchanged.
- Treaty timing remains separate: `clampDealTurns` and treaty-duration behavior retain the 1–20 limit; the focused cyclic trade test explicitly asserts treaty max 20.

## Verification

- `npm run typecheck` — **PASS**.
- `node tools/diplomacy-resource-cyclic-trade-test.cjs` — **53/53 PASS**, including finite 30, indefinite null, absent-field legacy fallback, AI acceptance, JSON roundtrip, and treaty cap 20.
- `node tools/diplomacy-cyclic-trade-duration-ui-test.cjs` — **12/12 PASS**, including rendered scope checks for cyclic max 30/indefinite and access max 20/no indefinite, payloads, and counteroffer prefill/change.
- `node tools/diplomacy-proposal-test.cjs` — **186/188** on candidate. I independently ran the same test at baseline `9f6f77711260d9c76abfce8578a49e2f8b4e98af`; it produces the same two round-4 peace-acceptance-in-war failures (low relation during war and neutral prewar relation under `WAR_RELATION_SCORE_CAP`). These assertions therefore match baseline and are unrelated to this change.
- `git diff --check` — **PASS**.

No integration, push, or deployment was performed.
