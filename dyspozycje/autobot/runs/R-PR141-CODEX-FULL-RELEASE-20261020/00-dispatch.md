STATUS: OPERATOR
DOMAIN: GAME
TEMAT: R-PR141-CODEX-FULL-RELEASE-20261020
GOAL: Inventory all pre-existing pending accepted local product/source/documentation/test changes, isolate a reviewable release candidate from the exact current HEAD, and prepare an evidence-backed integration/deployment plan without losing or silently including unrelated work. Only independently accepted eligible work may enter the candidate; undecided F-04 values and incomplete PR141 gameplay claims remain excluded.
RUNDY: 1/5

## Authorization and scope

Owner instruction relayed by root: “zrob deploy wszystkiego co masz do wykonania i gitpush”. Root assigned this operator an inventory and integration-preparation role; root retains final review and explicit GO for candidate integration, commit, push, and deploy. The previously published branch `codex/pr141-recruitment-diplomacy-rivers-20261020` at commit `c799325c77bc11c24684c1b35077ae80913d6f8d` already contains the three new topic files, which must not be duplicated.

This first phase is read-only against product files and the Git index. The candidate publication tree will be assembled externally from a known parent plus explicit, reviewed per-file/per-hunk deltas. No `git add -A`, reset, stash, branch checkout, or working-tree cleanup is allowed. Source, tests, bundle, deployment targets, WERSJE, and tracked registry/handoff files are not changed by this Operator before root approval. This run’s review artifacts live under this run directory and do not enter the publication candidate unless root separately approves metadata inclusion.

## Reconciled starting state

Repository `/workspace/The-Game`, branch `work`, HEAD `edb8fb56115e9dec0a58614dfb23ca6173d60c9a`. Before this dispatch, porcelain status recorded 52 tracked modifications and 637 untracked files (689 status entries total); exact NUL-status SHA-256 `d17958c4988d88445ffe873a462cb8733bc779401c85a1f982c31cef12f4691d`. The real index `.git/index` SHA-256 was `6c1c6d6113153dda6786157f140513d888baffc36429dbe47bb91c484bc4a13e`. Exact per-path status, HEAD blob and worktree hash manifest: `/workspace/pr141-publish-20261020/release-r1-baseline-manifest.json`, SHA-256 `0a2e781fa11a95dfb02de8d4db0ff3f9c01a2b8ce0cb3cdd4e9c687e7b26fdc3`.

The baseline manifest predates creation of this dispatch/run directory. Later inventory records must call out these run metadata additions rather than confuse them with owner work.

## Inventory and gates

Inventory every status entry, classify tracked source/data/docs/tests by originating accepted run and independent evaluator/Final Control, and classify generated run evidence, temporary outputs, unknown/unaccepted code, and unrelated dirty work separately. Cite report paths and exact file hashes; do not infer acceptance from file naming or green tests alone. Resolve source dependencies against the exact current base and already-pushed three-file branch. Produce an external clean release snapshot containing only accepted allowlisted deltas, then a complete candidate file/hash list and exclusion list for independent review. No build/deploy/publish occurs in this phase unless root explicitly directs it after scope review.

Do not claim all PR141/93×15 gameplay acceptance. Preserve pending holds and unresolved decisions, especially unapproved F-04 values, F-05/G11, unresolved runtime/gameplay coverage, and any evaluator/Final Control gaps. Tests must remain authentic and unchanged; do not weaken tests or alter user data to green them. Report exact current-state build/test results only after a clean candidate exists.

NEXT: complete inventory and deliver the release candidate manifest and per-file disposition to root and independent evaluator. No commit/push/deploy until a fresh root GO after review.
