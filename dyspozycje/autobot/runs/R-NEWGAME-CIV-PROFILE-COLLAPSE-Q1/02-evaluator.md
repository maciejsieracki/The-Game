# AutoBot independent evaluation — new-game civilization profile collapse

STATUS: PASS (UI/browser verification reported 200/0 after the navigation assertion was narrowed to the requested behavior).

- Scope: civilization profile can be collapsed/reopened; selection remains; the “Dalej” footer remains visible at 1770×970, 1365×768, and the 1180×647 viewport used to approximate 150% zoom.
- The evaluator's initial browser run was 196 pass / 14 fail because the old settings-step check required the final “Rozpocznij grę” button to be in view at the same time as the persistent footer. That is outside the request about the civilization step. The assertion was changed to check the fixed footer and that Start is reachable by scrolling the inner content. Root reports the rerun at 200/0.
- The test is a browser/layout check; it does not certify any game-generation behavior.

No source changes or commit by the evaluator.
