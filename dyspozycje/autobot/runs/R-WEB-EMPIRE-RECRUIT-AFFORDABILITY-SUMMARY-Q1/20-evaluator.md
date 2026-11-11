# Independent evaluator — empire recruitment affordability

Status: **PASS**

Evaluated `1e48b8282..0b6107782` in `/tmp/recruit-affordability` against the registered dispatch. No implementation edits made.

## Evidence

- Independently ran `node tools/empire-recruit-affordability-test.cjs`: **11/11 pass**. This exercises per-type and aggregate queued/selected counts, shared-stock aggregation across types, quantity multiplicity, manual entry and plus-button refresh, changed balances before ordering, accepted-count remainder, and UI errors.
- Ran the actual Vite/Chromium live harness through the existing temporary HTTP/Chromium adapter: **20/23 pass**. L16–L18 fail because the fixture expects all 5 units after a preceding real purchase reduced the feasible count to 4. The operator report records the same 20/23 result on untouched base `1e48b8282`; direct actual-path checks L6–L14 pass, including zero-gold rejection with no queue mutation. The candidate still passes L19–L23.
- Audited `orderEmpireRecruitment` and `purchaseRecruitmentUnit`: the preview is advisory; the order path rebuilds the affordability result at click time, while each city purchase checks current treasury, manpower, owner-wide stock, siege, and city stack capacity before mutating or enqueueing. A stale preview therefore cannot produce an unpaid or free recruit through this panel.
- Audited gold cost construction: `productionCtxForCity` uses owner-wide civ bonuses, epoch, pace, owner, and difficulty; the unit gold formula has no city-specific price factor. Choosing the first eligible city's current catalogue cost for the basket is consistent with per-city purchase costs. Resource stock and manpower are owner-wide pools and are deducted across owner cities, so the basket sums each resource once rather than reusing each row's full balance.
- Queue-only rows are appended for display, with `queued` kept separate from draft quantities. Since drafts default to zero, legacy/unknown queued counts do not consume the selected basket budget. Known catalogue costs are resolved from current unit data; unknown definitions have no inferred stock cost. The existing save/restore hooks clear draft UI state.

## Scope note

The focused test does not construct an unknown queue-only unit through the actual live game hook, so that exact rendering case was source-audited rather than exercised end to end. A user can type a draft on a row with zero capable cities; the preview includes that draft's modeled costs while the row order button stays disabled and bulk ordering receives the normal backend refusal. This only overstates the displayed basket shortfall for an intentionally unorderable selection; it does not reject or block an affordable order for a capable row. I found no requirement-breaking defect in the requested affordability behavior.
