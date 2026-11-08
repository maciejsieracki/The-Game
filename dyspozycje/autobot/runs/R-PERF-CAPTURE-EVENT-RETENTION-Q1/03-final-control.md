# AutoBot Final Control — retained capture/elimination event details

STATUS: PASS — NARROW EVENT-PAYLOAD RETENTION SCOPE
TASK: R-PERF-CAPTURE-EVENT-RETENTION-Q1
BASE: `a1d8621290d107adc3ece82978d64aa6b7c4c0dc`
REVIEWED BRANCH: `autobot/R-PERF-CAPTURE-EVENT-RETENTION-Q1`

## Control review

Reviewed the dispatch, operator report, independent Evaluator PASS, final diff, and all production `warEventLog` insertion, eviction, reset, and dismissal paths. The change stays within the declared event-detail ownership scope: seven production insertion paths now call `trimWarEventLog()`, which keeps the existing eight-card cap and removes detail payloads only for evicted `capture-*` and `elim-cs-*` entries. The visible entries retain their payloads for click-to-open modals. Explicit dismissal still removes the matching payload; game/session reset and test/hotseat journal reset clear both detail maps alongside the journal.

No capture, elimination, diplomacy, or war behavior changes were found. The test-seeding hook is intentionally not treated as a production insertion path and resets both maps before seeding. No unrelated cache or performance changes are included.

## Evidence and checks

- Independent Evaluator: PASS; reviewed all seven production insertion paths and confirmed there are no remaining direct `warEventLog.length > 8` truncations.
- Regression `capture-event-retention-test.cjs`: 20 assertions PASS.
- `miasto-zdobycie-raport-test.cjs`: 117/117 PASS (independently rerun during Final Control).
- `elimination-toast-merge-test.cjs`: 56/56 PASS (independently rerun).
- `sidepanel-events-toolbar-test.cjs`: 19/19 PASS (independently rerun).
- TypeScript typecheck PASS (independently rerun).
- `git diff --check a1d86212` PASS.
- Evaluator independently reports a Vite build with 916 modules PASS.

## Limits and disposition

This bounds retained modal payloads to the corresponding cards still in the event journal and fixes a concrete session-lifetime retention defect. The per-report payloads are modest; neither this review nor the tests establish that this defect explains the reported 100 MB→2 GB growth or late-game interaction stalls. Long-session RSS, GPU, and interaction measurements remain necessary.

No integration, commit, push, or deploy was performed by Final Control.
