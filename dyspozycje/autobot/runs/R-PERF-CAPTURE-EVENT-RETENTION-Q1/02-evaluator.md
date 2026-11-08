# Independent Evaluator Report

STATUS: PASS — NARROW RETAINED-EVENT PAYLOAD SCOPE
TASK: R-PERF-CAPTURE-EVENT-RETENTION-Q1
BASE: `a1d8621290d107adc3ece82978d64aa6b7c4c0dc`
REVIEWED BRANCH: `autobot/R-PERF-CAPTURE-EVENT-RETENTION-Q1`

## Review

Reviewed the dispatch, operator diff, new helper and regression, all `warEventLog` insertion/eviction/reset/dismiss paths, and event-detail map consumers.

The newest-first `warEventLog` has seven production insertion sites (`warEventLog.unshift`), and all seven now call `trimWarEventLog()` after insertion. There are no remaining direct `warEventLog.length > 8` cap truncations. The shared helper removes entries after index 7 and deletes detail-map entries only when an evicted id has the matching prefix (`capture-` or `elim-cs-`). Surviving cards retain their detail payloads. Explicit dismiss paths still splice the card and delete its corresponding detail; full journal reset paths clear both maps. The side-panel clear-all action dispatches through the same per-id dismiss handler.

The additional hotseat/test-seeding reset clears both detail maps together with the war event journal. I found no change to capture or elimination gameplay behavior. The change remains within the declared allowlist.

## Independent validation

- `node gra/tools/capture-event-retention-test.cjs` — **20 assertions PASS**.
- `node gra/tools/miasto-zdobycie-raport-test.cjs` — **117 passed, 0 failed**.
- `node gra/tools/elimination-toast-merge-test.cjs` — **56 passed, 0 failed**.
- `node gra/tools/sidepanel-events-toolbar-test.cjs` — **19 passed, 0 failed**.
- `npm run typecheck --prefix gra` — PASS.
- `npm run build --prefix gra` — PASS; Vite transformed 916 modules.
- `git diff --check a1d86212` — PASS.

The new regression exercises ten capture payloads through the eight-card cap, eviction caused by an unrelated event, retained payload resolution, and the parallel elimination-detail lifecycle. Its static wiring assertion is a lower bound (`>=6` helper calls); independent enumeration confirmed seven production insertions, each paired with a trim call, plus the intentionally untrimmed test-seeding hook.

## Limits

This proves that full event-detail payloads do not remain reachable after their cards leave the capped journal. It does not quantify their contribution to the reported 2 GB browser growth or prove that late-game interaction latency is resolved; payload scale per report appears modest, and long-session RSS/interaction measurement is still needed.

No implementation edits, integration, push, or deployment were performed by the evaluator.
