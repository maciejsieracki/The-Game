# Operator validation: forced wars, peace lock, AI capture

Validation date: 2026-10-28 UTC
Candidate: `/workspace/all-topics-candidate`
Base HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`
Scoped diff SHA-256 (binary diff of forced-war, peace-lock, save/main, AI capture sources and the two focused test files): `bd5cf217b49af2562fcc0d8e9914aa19dc2b2cb92d8fb069465c03821270901f`

## Scope reviewed

Reviewed the working-tree changes in `forced-war-common.ts`, all three era forced-war modules, `diplomacy-peace-lock.ts`, `main.ts`, `save.ts`, `ai-city-capture-executor.ts`, `ai.ts`, and focused forced-war/capture tests. The changes include 20-turn forced-war duration limits for Stone/Bronze/Iron, per-pair peace lock until the declaring attacker advances era, save/restore for that lock, a current-war recheck at AI empty-city capture execution, and peace-time AI army consolidation behavior.

## Checks

All commands ran from `gra/` and passed:

- `node tools/forced-war-reguly-multi-turn-simulation-test.cjs` — 50 passed. Exercises sequential multi-turn war selection/ending logic using real exported decision functions; checks auto-peace after 20 turns, city threshold precedence, missing `startTurn` compatibility, Iron duration wiring, and forced-era peace-lock serialize/restore and era expiry.
- `node tools/forced-war-stone-test.cjs` — 38 passed.
- `node tools/forced-war-bronze-test.cjs` — 56 passed.
- `node tools/forced-war-iron-test.cjs` — 58 passed.
- `node tools/forced-war-stone-main-guard-test.cjs` — 19 passed.
- `node tools/forced-war-bronze-main-guard-test.cjs` — 28 passed.
- `node tools/forced-war-iron-main-guard-test.cjs` — 37 passed.
- `node tools/forced-war-iron-era-enter-turn-save-load-test.cjs` — 20 passed.
- `node tools/ai-city-capture-integration-test.cjs` — 21 passed, including rejecting capture if peace begins after command planning and checking the production callback path.
- `node tools/load-game-blockers-exec-test.cjs` — 15 passed.
- `npm run typecheck` — passed (`tsc --noEmit`).

No product files were edited by this validation. The focused tests generated temporary bundles/entries, which are ignored; `git status` reports none of those generated paths as modified/untracked.

## Findings and limits

The capture execution guard checks the target city's owner against the live diplomacy state at execution time, closing the plan-then-peace race in the tested real executor path. The production-path coverage also checks that the shared empty-city capture path refuses capture during peace.

Forced-war duration and lock behavior passed targeted unit/harness and source-guard checks. The lock is written by the shared peace finalizer when an active forced-war pair exists, is persisted in `meta.forcedEraPeaceUntilNextEraByPairKey`, restored through validation, and consulted along with the ordinary 10-turn treaty lock. Forced-era lock tests establish it remains active at the recorded era and expires after the declaring owner's era increases.

The multi-turn test is a harness that reproduces the turn-loop ordering around real exported rules; it does not boot the full game runtime for a 20-turn live simulation. Main wiring checks are mostly source-pattern guards. Save/load coverage exercises forced-war state in a focused Iron runtime test and pure lock serialization plus main snapshot/restore wiring, but does not perform a full UI-driven save/reload of an actual active forced-war peace lock.

Unresolved behavior: the per-pair era lock deliberately remains active when the declaring owner stays in the same era; this includes Iron-era peace because no later era is currently defined. Behavior if the declaring civilization is eliminated or its owner ID/era data is otherwise rewritten while such a lock remains was not exercised. No live browser/runtime scenario was run for the new lock or forced-war auto-peace. These are coverage limits, not observed test failures.
