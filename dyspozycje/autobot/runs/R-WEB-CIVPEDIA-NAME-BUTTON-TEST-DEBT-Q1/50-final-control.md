# Final control — R-WEB-CIVPEDIA-NAME-BUTTON-TEST-DEBT-Q1

STATUS: PASSWITHNOTES
STAGE: 8 — independent final control
SCOPE: fixture-component test debt only; no campaign notes or product changes.

Reviewed the exact test diff and confirmed it changes only `gra/tools/civpedia-karty-nazwa-przyciskiem-test.cjs`. The Stolarnia expectation changes from zero cross-links to one, and its comment now documents the `Obróbka drewna` link. Product data gives Stolarnia that `techUnlock`; `buildingAdapter` resolves it to a technology `linkTo` when available. This matches the test's fixture and observed link.

The expected-count assertion remains explicit for Stolarnia and the other card fixtures, and the combined style/hit-area assertion still requires the count to match before checking every link. Existing unit and improvement expectations remain one. The test retains the native name-button, mouse hit-test, and exact `building/stolarnia` mouse target checks; the added Enter case focuses the native Stolarnia button and checks the same exact target. Existing frame, no-underline, hover, hit-area, and console checks remain. No assertion was removed or weakened.

Validation: `git diff --check` and `node --check gra/tools/civpedia-karty-nazwa-przyciskiem-test.cjs` pass. I did not rerun Chromium because the evaluator report already records the corrected real-Chromium run at **28 pass / 0 fail**, including the new Enter case, and the parent owns the browser lock. That proof is sufficient for this control. No source edits or commit were made.
