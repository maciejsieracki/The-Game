# AutoBot Operator Dispatch

STATUS: OPERATOR
DOMAIN: GAME / MEMORY RETENTION
TEMAT: R-PERF-CAPTURE-EVENT-RETENTION-Q1
GOAL: Remove full city-capture report payloads when their corresponding event cards are evicted from the bounded war event log.

## Baseline and scope

- Base: `a1d8621290d107adc3ece82978d64aa6b7c4c0dc` (ROBOCZA GPU cleanup, `origin/main`).
- Confirmed paths: `recordCityCaptureEvent()` adds `capture-*` rows and truncates `warEventLog` to 8; consumers resolve details by event id; manual dismiss and game resets already delete/clear them.
- Same-ownership check: `civElimEventDetails` (`elim-cs-*`) is another map owned by cards in the same capped log, so the same eviction cleanup should apply.

## Allowlist

- `gra/src/main.ts`
- `gra/src/game/retained-side-panel-events.ts`
- `gra/tools/capture-event-retention-test.cjs`
- Minimal adjustment in `gra/tools/miasto-zdobycie-raport-test.cjs` so it accepts additional intentional reset cleanup sites.
- This run's dispatch, operator report, and evidence only.

No changes to capture economics, event text, diplomacy/war behavior, or unrelated caches. No integration, push, or deploy.

## Acceptance

1. War event log remains capped at eight entries.
2. Evicting `capture-*` and `elim-cs-*` cards deletes only those evicted cards' detail payloads; retained cards remain resolvable.
3. Existing dismiss, game reset, and seat-switch cleanup stays intact.
4. Regression test exercises >8 captures and interleaved unrelated event insertion.
5. Related capture/elimination tests, typecheck, build, and diff check pass.
