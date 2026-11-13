# Independent final control — empire recruitment affordability

Status: **BLOCK — one focused affordability-preview defect remains**

Reviewed `1e48b8282..0b6107782` in `/tmp/recruit-affordability`. No product files were changed.

## Confirmed

- Re-ran `node tools/empire-recruit-affordability-test.cjs`: **11/11 pass**. Shared resource aggregation, queued-versus-selected counts, manual input, plus-button updates, stale-balance ordering, and partial-acceptance remainder all pass.
- The evaluator's actual-game live result remains **20/23**, with the same three late fixture failures on the untouched base; its direct callback checks L6–L14 pass. This is baseline-red evidence, not a regression attributable to this change.
- The backend path recalculates affordability at order time and `purchaseRecruitmentUnit` checks current resources and city gates before enqueueing. The preview issue below does not permit an unpaid order or prevent a valid affordable order from being submitted.

## Blocking finding: ineligible drafts distort the live affordability basket

`empireRecruitRows()` deliberately retains queued-only types and sets `capableCities` to zero when no current city can recruit them (`gra/src/main.ts`, `empireRecruitRows`). The row's order button is disabled, but its quantity input remains editable. `syncAffordability()` sends every row's draft to `summarizeEmpireRecruitBasket()` without considering `capableCities` (`gra/src/ui/empireRecruitPanel.ts`, `syncAffordability`). For these queued-only rows the current gold price can be zero because no purchasable catalogue item supplied `koszt`, while manpower and stock are still modeled from the unit definition. The global basket can therefore show selected units and a resource shortfall for an order that has no capable city and will be refused by the real order path.

This is bounded to the preview: queued totals remain distinct, backend orders remain guarded, and the defect cannot cause overspending. It still conflicts with the registered goal's live affordability across city eligibility and actual cost feasibility. A user can get a red/shortfall basket from an impossible line, and the displayed cost may omit gold for that line; calling that basket the planned recruit budget is materially misleading even though it does not affect execution.

Before approval, exclude rows with `capableCities <= 0` from the affordability/cost calculation while retaining their draft count as visibly selected, or present an explicit ineligible count and keep those lines out of the orderable-basket cost and shortfall. Add a focused DOM assertion for a queue-only, zero-capable row with typed quantity alongside an affordable capable row: the ineligible line must not create an affordability shortfall or alter the orderable basket cost, and it must remain clearly marked as unable to recruit.

## Other validation limits

The evaluator's 20/23 live result reproduces on base and should not be treated as a candidate regression. The queue-only live rendering case was source-audited but not exercised end to end; the focused DOM test uses rows with capable cities only. No merge or implementation changes were made.
