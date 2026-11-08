# 06 — Root integration decision: bounded PR141 release candidate

RUN: `R-PR141-CODEX-FULL-RELEASE-20261020`, round 1/5.
STATUS: `APPROVED_FOR_BOUNDED_PUBLICATION`; final commit/push/deployment not yet performed.
DECISION SOURCE: root's 2026-10-20 integration instruction after reading Final Control `05-final-control.md` (SHA-256 `fd2c759332e11135f89a6fb83218910b7be14984534d14aaeb9a993bce4895e`) and the full source delta, manifest, and browser reports.
ROLE: This file records the actual root decision; it does not grant new authorization or imply a completed push.

## Accepted scope and pins

Root accepts the exact candidate over base `c799325c77bc11c24684c1b35077ae80913d6f8d`: 51 modified and 49 added paths in the actual Git delta, plus the prepared ROBOCZA bundle, manifest, START hub, WERSJE/KANAL handoff, release records, and exact source-referenced provenance files. `gra/src/map/gen-helpers.ts` is the one unchanged overlay path already present in the base. The source candidate manifest is SHA-256 `683a5f903cd2b8c5f3bbb19bc733f83dc18cf6ea72b1916cfc186b9965178371`; its deterministic path/content digest is `8d1224714d326b395f0086e4c7eec40729aace78124000c4db46405f45f21d2c` across 6,222 files. The digest is not a Git tree ID.

The ROBOCZA bundle is byte-pinned at SHA-256 `234dff75036b22e423b33f9d6134428c559b612922b866399346f0e94ebfca4a`, MD5 `3b6610b74fd6586c5507908fe7665369`, 69,943,587 bytes. The assembled manifest pins the bundle, source snapshot, verification evidence, both browser failures, and Final Control. The canonical verifier reports `VERIFY OK` with matching manifest/bundle hashes; the known Linux stamp self-MD5 warning remains disclosed.

## Verification reviewed

Final Control is `PASS-WITH-NOTES` for bounded source/artifact publication. TypeScript noEmit, direct Vite build (893 modules), and focused source suites passed. Same-round fixes changed only two test files: the stale rush status expectation now matches owner-approved bounded activation (52/52), and the population fixture supplies the missing current import contract without removing assertions (24/24). Earlier test failures remain preserved with corrected reruns.

Both authorized browser attempts remain **FAIL** for the complete predeploy flow. They verified exact local served bundle bytes and first-city founding, then failed to complete first-contact dismissal. Attempt 02's screenshot visibly shows the audience and enabled `Wróć` control; its JSON zeros are completed action counts, not visibility. Root accepts the bounded source publication despite this harness interaction limitation, following Final Control's finding that it is not evidence of a production-source defect. The failures are not reclassified as PASS, and no full smoke acceptance is claimed.

## Limits and remaining publication facts

This release does not establish full 93×15 gameplay acceptance, full runtime or save/load parity, F-05 legal battle observation, terrain/runtime closure, or any external production-host deployment. Only ROBOCZA is in scope; KANON and FINALNA are excluded. Actual commit, push, deployment status, public route, and remote byte readback remain pending and must be recorded only after those actions occur.

Root retains the already-authorized commit/push/deploy action. The operator has prepared an isolated publication index and will not mutate the real HEAD/index or publish until root completes the final exact-tree review and gives the corresponding execution GO. The local worktree and excluded historical/scratch files remain preserved.
