# AutoBot Evaluator — icons and army merge panel

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ARMY-STACK-ICONS-MERGE-PANEL-Q1
GOAL: Make Split and Merge icons unmistakably opposite and keep the merge panel scrollable, within viewport margins, and operable at 150% scale.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Independent review

Reviewed the candidate checkout `/workspace/all-topics-candidate`, branch `integration/robocza-all-topics-20261027`, base `32d27454be213e0e9342435b81c0271999e99513`. The Operator report's scope matches the current diff in `armyMergePanel.ts`, `armyStackHud.ts`, and the two named tests. I made no product or test-source edits.

The Split SVG branches outward from a shared center and has arrowheads at the two outer ends. The Merge SVG points both branches into one center, then continues as a single downward stem. The two actions therefore differ by both direction and silhouette.

The panel overlay has 24px padding, hides overflow outside the overlay, and constrains the dialog to `100vh` and `100dvh` minus 48px. The dialog is a flex column with its body as the scroll region and header/result/actions outside that region. At the tested narrow width, the existing and arriving sections stack vertically; the test separately proves the last existing row is reachable and that the end row is visible at maximum scroll.

## Reproduced checks

- `node tools/army-merge-panel-scroll-real-render-test.cjs` — **26/26 PASS** in Chromium. Includes 40 existing units, 24px viewport gaps, DPR 1.5 with 600×413 CSS viewport, last-row reachability, visible/clickable Merge and Separate actions, no horizontal overflow, and a negative control against the previous layout.
- `node tools/army-split-ruch-icons-test.cjs` — **7/7 PASS**.
- `git diff --check` on the four scoped files — **PASS**.

SHA-256:

- `gra/src/ui/armyMergePanel.ts`: `ca0ecdfbb212ca6a691360c4c2a44d517b2f7ec5d71ae323f5dd3399eef4b2a4`
- `gra/src/ui/armyStackHud.ts`: `e44b897b3441e06b09682b6484e27ce4ac4eb6803c0a87b973206c8be7b256f9`
- `gra/tools/army-merge-panel-scroll-real-render-test.cjs`: `253e82810f4f35b40d8ba3b662a0ed48d10483d4e8150aeae937af1b5a79be89`
- `gra/tools/army-split-ruch-icons-test.cjs`: `c5f5b41b120cacae712a85744644054093a38cedc94584dd7df47dddabf752db`

## Notes and next step

The 150% case models the effective CSS viewport using Chromium `deviceScaleFactor: 1.5`; it does not manipulate the browser's zoom menu. It directly verifies the viewport geometry and pointer activation at the resulting dimensions, which is a useful layout regression gate but does not cover every browser/OS zoom implementation.

No blocking objection found for this narrow scope. This result does not approve the remaining dirty candidate diff. Orchestrator should perform allowlist-only integration after the other overlapping work is separated, then Final Control should assess the integrated state. No commit, merge, push, or deploy was performed here.
