# Evaluator follow-up — siege engines built only during siege

STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-ENGINES-BUILT-ONLY-DURING-SIEGE-Q1
GOAL: Confirm the legacy unpaid-queue correction preserves completed legacy machines while preventing pending free builds.
SCOPE: Independent follow-up on candidate `e30755aced93c1444f0c35743a4248e631a0b70f`; no source edits.

## Independent verification

- `node tools/siege-engines-built-during-siege-test.cjs`: **27 passed, 0 failed**. The pending queue and ready/runtime legacy scenarios call the production `serializeGame()` and `deserializeGame()` exports.
- `npm run typecheck -- --pretty false`: passed.
- `git diff --check 6218f2ab1..HEAD`: passed.
- Search of `src` found `advanceSiegeMachineBuild()` and `queueSiegeMachine()` only at their helper definitions. There is no remaining call site that advances or enqueues the unpaid legacy queue. The active-siege tick calls `cancelUnpaidLegacySiegeMachineQueue()`, which clears pending entries and fractional progress while retaining `ready` entries. The paid AI build path remains wired through `buildAiSiegeEngine()`.
- Correction diff is limited to `siegeMachines.ts`, `main.ts`, the focused test, and operator/defense records. The quota parameter, paid build API, costs, and tech gates have no changes in this follow-up.

## Browser evidence and limit

The earlier operator record reports 57/57 assertions for `siege-blockade-no-recruit-reinforce-test.cjs` in Chromium served over HTTP, after the stock `file://` attempt was blocked. That is prior-run evidence for the siege blockade/no-recruit UI flow; it is not a browser rerun of this corrected candidate. This correction changes legacy queue handling and adds no UI changes. In this worktree `/usr/bin/chromium` exists, while the available live helper expects `/opt/pw-browsers/chromium`, which is absent; record this as a helper executable-path issue, not as Chromium being unavailable. No additional live browser result is claimed.

DEPLOY/PUSH: NOT PERFORMED
