# AutoBot Evaluator R2 — leader roster selector

**Verdict: PASS for the R2 correction and the scoped roster acceptance.** The Bronze fallback now honors Q3=B when an otherwise legal prior-era Ox Chariot is stronger than the currently available infantry/cavalry. The roster test, purchase path, typecheck, and whitespace check pass independently.

## Contract and scope

I compared `04-operator-r2.md` against `01-dispatch-implementation.md` and the recorded owner decisions Q2=A / Q3=B. The selector retains missile-capable cavalry and chariots as eligible when they are in the allowed mounted/combat category, excludes `Dystans` and `Oblężnicza`, prefers the approved chariot when available, and excludes all chariot models from the Bronze fallback. This matches both decisions.

The R2 product correction is confined to the Bronze fallback inside `bestGeneralUnitForOwner()` in `gra/src/main.ts`: it filters `rydwan|chariot` before ranking the fallback. The current `main.ts` worktree also has unrelated concurrent changes (imports, Army recruitment, naval AI, and leader title); those are outside this verdict and must not be attributed to this roster run. The focused test is `gra/tools/general-eligible-unit-roster-test.cjs`.

## Independent verification

- `node gra/tools/general-eligible-unit-roster-test.cjs` — **PASS, 137 total checks**. This executes the production selector extracted from current `main.ts` against the unit dataset.
- `node gra/tools/general-capital-recruitment-order-test.cjs` — **PASS, 0 failures**. The real browser card click reaches the production purchase handler; checks cover capital-only preflight, era limit, payment, manpower, resource stock, and queue mutation.
- `cd gra && npm run typecheck` — **PASS** (`tsc --noEmit`).
- Scoped `git diff --check` — **PASS**.

## R1 regression boundary

The test fixture includes `Rydwan (woły)` in German Bronze before Jeździectwo, where it is a legal prior-era Mount with `fieldPower: 104`; the expected fallback is `Włócznik`, a legal Bronze Spearman with `fieldPower: 44`. Thus the test proves the selector does not choose the stronger Ox Chariot as a fallback. It also keeps positive controls for the approved chariot once available, the Stone pre/post-Wheel model, and the Celtic generic Bronze chariot replacement exception.

The narrow leader-only replacement path checks the selected definition's current/prior era, required technology, and local Barracks (or its building upgrade) before constructing the item. It is only called by the commander selector for a base model suppressed by a national replacement; it does not add that model to ordinary production. Purchase remains subject to the commander preflight and the existing production purchase checks for treasury, manpower, stock resources, and queue insertion. The purchase test independently exercises these common purchase checks; its fixture is a Stone Warrior, while Celtic chariot tech/Barracks boundaries are verified by selector checks in the roster suite.

No remaining R2 contract objection found. This is a scoped evaluator PASS only; unrelated worktree changes remain unreviewed. No product source was edited, and no integration, commit, push, or deploy was performed.
