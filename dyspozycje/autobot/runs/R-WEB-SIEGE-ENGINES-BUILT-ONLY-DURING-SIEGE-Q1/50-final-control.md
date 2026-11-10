# 50 — independent final control

STATUS: PASS (independent non-browser control)
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-ENGINES-BUILT-ONLY-DURING-SIEGE-Q1
CANDIDATE: `e30755aced93c1444f0c35743a4248e631a0b70f`
RUN: 2026-11-10, in `/tmp/codex-siege-engines`; no source edits, staging, commit, push, or deploy.

## Independent verification

- `node tools/siege-engines-built-during-siege-test.cjs`: **27 passed, 0 failed**. The cases cover the configured quota at 9/10/19/50/100/250, no fixed cap, same-turn accounting and reset, all four unit cards and research gates, money/resource affordability, city and replacement exclusion, AI/human policy parity, and production `serializeGame()`/`deserializeGame()` cases for pending, ready, and runtime legacy machines.
- Independently reran the relevant non-browser regressions; every command exited 0: `siege-ai-test.cjs`, `map-siege-test.cjs`, `siege-nearby-lock-join-test.cjs`, `battle-siege-nearby-units-join-test.cjs`, `siege-defenders-test.cjs`, `siege-starvation-test.cjs`, `siege-starvation-duration-test.cjs`, `siege-last-stand-sortie-test.cjs`, `empire-recruit-plan-test.cjs`, `empire-recruit-all-test.cjs`, `production-overflow-test.cjs`, `super-unit-limit-one-test.cjs`, and `ai-siege-requires-war-test.cjs`.
- `npm run typecheck -- --pretty false`: passed.
- `git diff --check 6218f2ab1..HEAD`: passed.

## Scope and lifecycle control

The candidate implements a shared paid-build policy using `data/siege-engine-params.json` (`unitsPerSiegeEngine: 10`), the unit-card stock cost and money cost, active wartime siege context, unlocked research, and a per-city current-turn counter. Qualifying army size excludes siege engines; the quota is `floor(N/10)` and the implementation has no fixed maximum. The UI and AI call into the paid build path, and recruitment/replacement paths filter or reject siege types. New runtime engines join the besieging stack with the canonical siege model category.

The 20 evaluator's unpaid legacy queue defect is closed in the active-siege tick: it cancels unpaid queued work and fractional progress while retaining `ready` machines. The independent focus test exercises actual save-module serialization/deserialization for a canceled pending queue, a preserved ready machine, and an unchanged legacy runtime Taran. Inspection confirms `advanceSiegeMachineBuild()` and `queueSiegeMachine()` remain helper definitions with no active turn-path call; AI purchases remain wired through `buildAiSiegeEngine()`.

The reviewed implementation changes are confined to the siege-engine policy/data, recruitment filters, main turn/build integration, siege panel, focused test, and run evidence. No unrelated source scope appeared in the candidate diff. Worktree status also contains pre-existing untracked evaluator records and two temporary recruitment bundles; I left them untouched.

## Browser evidence and limits

I did not repeat a browser run because this correction only closes the legacy unpaid queue lifecycle and adds no UI changes. The operator's prior HTTP-served Chromium run recorded 57/57 assertions for the siege blockade/no-recruit flow; that is prior evidence, not a browser rerun of this candidate. `/usr/bin/chromium` exists in this environment, while the live helper's configured `/opt/pw-browsers/chromium` executable is absent. This is a helper executable-path mismatch, not evidence that Chromium is unavailable.

DEPLOY/PUSH: NOT PERFORMED
