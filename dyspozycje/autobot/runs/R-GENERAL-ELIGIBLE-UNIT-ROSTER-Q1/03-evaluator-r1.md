# AutoBot Evaluator — leader roster R1

**Verdict: OBJECTION — one Bronze fallback violates owner decision Q3=B.** The current focused suite, recruitment purchase test, typecheck, and scoped whitespace checks pass on the recorded worktree, but a boundary case shows that the implementation and its test both permit the Stone Ox Chariot as the fallback when no approved Bronze chariot is purchasable. Q3=B specifies the best currently available **infantry/cavalry** until that chariot unlocks; the fallback must not select another chariot.

## Independently rerun checks

- `node gra/tools/general-eligible-unit-roster-test.cjs` — **137/137 PASS** on the supplied fixture.
- `node gra/tools/general-capital-recruitment-order-test.cjs` — **PASS, 0 failures**; capital, payment/resources, queue and gates remain covered.
- `cd gra && npm run typecheck` — **PASS**.
- `git diff --check -- gra/src/main.ts gra/tools/general-capital-recruitment-order-test.cjs` — **PASS**.

## Blocking reproduction

I executed the production selector extracted by the existing focused test with one additional legal previous-era candidate, `Rydwan (woły)`, while keeping the approved Bronze chariot locked. The test then failed its existing fallback assertion with:

```text
FAIL Bronze before Jeździectwo falls back to best currently available infantry: selected=Rydwan (woły)
```

The implementation builds `eligibleCombatCandidates` from `Mount`, `Offensive`, `Swordsman`, `Spearman`, and `Falangite`, then uses that same set for the Bronze fallback. It removes ranged and siege roles but does not remove chariots from the fallback. The current test's per-civilization fallback calculation also includes `Rydwan (woły)`, so it reproduces the implementation's broader rule instead of the owner-approved Q3 wording. The target chariot remains correct when it is actually purchasable; the problem is only the pre-unlock fallback.

## Required R2

- Keep all eligible non-chariot infantry and cavalry/mounted units, including missile-capable cavalry allowed by Q2=A.
- For the Bronze fallback only, exclude chariot models (including the prior-era Ox Chariot); choose the strongest remaining legal infantry/cavalry candidate. Return no offer only when no such candidate exists.
- Update the fixture so the locked-chariot case includes `Rydwan (woły)` and still expects the strongest legal infantry/cavalry. Keep positive controls for the approved horse/national chariot after all ordinary gates pass.
- Re-run the 137-check roster suite, purchase-path test, typecheck, and scoped diff checks; then send the same ID to Operator R2.

## Scope and identity

The roster-specific source hunk is `bestGeneralUnitForOwner()` in `gra/src/main.ts`. The shared worktree contains unrelated hunks in the same file from recruitment and naval-AI tasks; this evaluation does not attribute or approve those hunks. The Stone helper in `gra/src/game/generals.ts` is a separate already-dispatched commander-marker dependency and must remain separately allowlisted at integration.

- `gra/src/main.ts` SHA-256: `6df9511d539ec24285008c7cc2eec1ddb9101be4564141053a3888c5eb663c4f`
- `gra/src/game/generals.ts` SHA-256: `401ea4782a57817f01d4a19d87e758ccbd2817bfe4d3ea57eeec6e8eeafb6673`
- `gra/tools/general-eligible-unit-roster-test.cjs` SHA-256: `7cfc5567a032f557cc486a5fcdedba919f4d2aa25bbe682ebd2a91f1ba39ba52`
- `gra/tools/general-capital-recruitment-order-test.cjs` SHA-256: `626e50713a725d1b837fa9da4ee3ab0873df1144cc39073081f71e1716088ecd`

No source files were changed by this evaluation. No integration, commit, push, or deploy was performed.
