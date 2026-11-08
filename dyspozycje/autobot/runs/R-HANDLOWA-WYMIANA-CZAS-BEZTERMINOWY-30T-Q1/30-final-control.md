# Final Control — R-HANDLOWA-WYMIANA-CZAS-BEZTERMINOWY-30T-Q1

**Verdict: PASS-WITH-NOTES**
**Candidate:** `427f2d76dee9db15e4d5024c0f27b87bf0241904`
**Base:** `9f6f77711260d9c76abfce8578a49e2f8b4e98af`

The candidate satisfies the registered scope after the correction in `427f2d76`. The initial `c960a16` made the shared duration component expose max 30 and an indefinite choice on resource-access forms as well; the correction adds explicit duration-control options and confines max 30/`Bezterminowo` to per-turn quantitative-resource exchanges. Resource-access duration stays capped at 20 and retains its prior `+100` stepper, with no indefinite control. Validation applies the same split.

The product diff against the declared base is limited to `gra/src/game/diplomacy-proposals.ts`, `gra/src/main.ts`, `gra/src/ui/diplomacyNegotiationModal.ts`, and `gra/src/ui/diplomacyTradeBasket.ts`. The other changed files are the registered run/registry artifacts and focused test updates. The branch is two commits ahead and four behind `origin/main` because of unrelated accepted work; it was reviewed against its declared base and was not rebased.

The exchange expiry model is distinct from valuation and treaty duration: `exchangeDurationTurns` is absent for legacy fallback, numeric for 1–30 turns, and `null` for indefinite; `turns` remains finite for valuation. Both player proposal evaluation and AI-pending acceptance resolve these cases. `main.ts` carries the field through negotiation and counteroffer payloads, including prefill. Existing `ActiveDeal.wygasaTura` numeric expiries remain unchanged; indefinite deals use the existing nullable field. JSON roundtrip tests preserve null, and the existing `hydrateActiveDeals` copies deal fields before normalization, preserving both null and numeric expiry. Treaty duration still uses the separate 1–20 `clampDealTurns` path.

## Independent verification

- `npm run typecheck` — **PASS** (`tsc --noEmit`).
- `node tools/diplomacy-resource-cyclic-trade-test.cjs` — **53/53 PASS**, including finite 30, indefinite expiry, absent-field fallback, AI acceptance, JSON roundtrip, and treaty cap 20.
- `node tools/diplomacy-cyclic-trade-duration-ui-test.cjs` — **12/12 PASS**, including cyclic-only max-30/indefinite controls, access max 20/no indefinite option, explicit payload values, and counteroffer prefill/change.
- `git diff --check 9f6f7771..HEAD` — **PASS**.
- `node tools/diplomacy-proposal-test.cjs` — **186/188**. The two failing round-4 peace-during-war assertions are documented by the independent evaluator as identical at base `9f6f77711260d9c76abfce8578a49e2f8b4e98af`; they do not involve changed trade-duration paths.

**Disposition:** accept this scoped change with the two baseline proposal-test failures recorded. No merge, rebase, push, or deployment was performed. The branch remains not integrated.
