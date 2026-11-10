# 30 — evaluator correction defense

## Finding and closure

Evaluator 20 identified that `main.ts::tickSiegeMachinesForCity` still called `advanceSiegeMachineBuild` during active sieges. That legacy helper progressed `City.siegeMachines.queue` at `1 + floor(besiegerCount / 10)` and moved queued Taran/Wieża entries into `ready` without passing through the paid build API. A queue entry from an older save therefore bypassed current research, treasury, stock, and per-turn quota checks.

The active-siege tick now calls `cancelUnpaidLegacySiegeMachineQueue`. It empties only the pending queue and resets its unpaid fractional progress. It does not alter `ready`, and it leaves runtime units unchanged. The old advance helper remains available for legacy compatibility but is no longer called by the active-siege turn path. Newly built machines continue through the existing paid, technology-gated and quota-gated build API. No balance, price, or quota value changed.

## Save/load evidence

The focused test now builds fixtures with the production `serializeGame()` and `deserializeGame()` functions:

- A saved active siege containing `{ queue: ['taran'], ready: [], buildProgress: 0.99 }` is deserialized, passed through the same queue-cancellation helper used by the active turn path, and remains with an empty queue, empty `ready`, and zero progress. The `main.ts` guard asserts that the active-siege tick calls this helper and no longer calls `advanceSiegeMachineBuild`.
- A separate save containing an already-ready Wieża and a runtime Taran is round-tripped. `peekReadyMachines()` still returns the Wieża and the saved runtime unit retains its id, type, category, and coordinates.

## Verification

- `node tools/siege-engines-built-during-siege-test.cjs`: 27 passed, 0 failed. This includes the existing quota, cost, tech, resource, recruitment, and AI checks plus the two real save/load scenarios and the tick-path guard.
- `npm run typecheck -- --pretty false`: passed.
- Siege AI, map siege, nearby-lock/join, defenders, starvation, starvation duration, last stand, empire recruitment planner, empire recruit-all, production overflow, super-unit-limit, and siege-requires-war tests passed.
- `empire-recruit-panel-no-inner-scroll-test.cjs` could not launch because this worktree has no Chromium executable at `/opt/pw-browsers/chromium`; this browser-only check did not exercise the changed path.
- Evaluator 20 remains unmodified as the original FAIL record. Its specified defect is addressed by this correction; the correction evidence is recorded here and in the focused test.
