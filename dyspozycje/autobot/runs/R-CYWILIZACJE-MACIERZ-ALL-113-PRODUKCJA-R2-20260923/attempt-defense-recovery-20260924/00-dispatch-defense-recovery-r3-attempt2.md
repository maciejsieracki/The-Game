# Conditional Defense recovery — Production r3 — attempt 2

- Program: `R-CYWILIZACJE-MACIERZ-ALL-113-Q1-20260923`
- Topic: Production / live AI wiring
- Recovery of: `t_c6df85cf` / run `1210`
- Parent evidence: `t_a48da8d3` / run `1203` (`FAIL`)
- Worktree: `/home/ubuntu/projects/The-Game/.worktrees/civ-matrix-all-produkcja-r2-20260923`
- Date: `2026-09-24`

## Why this recovery exists

The first Conditional Defense attempt reached a technical timeout after an incomplete live-run harness attempt. The available readback shows no completed defense receipt and no verified terminal result. The recovery is bounded and must either produce the missing live-chain evidence or report a precise blocker. It must not convert a timeout into `PASS`.

## Required live proof

Prove, using the real runtime path and not a substitute:

```text
real game entry / main.ts
  → real AI turn execution
  → runAiPhase
  → the actual availableProduction callback/provider
  → an observed production decision/result
```

The proof must show the seam was executed, not merely that the symbols exist or that a helper can be called directly. The evidence must include:

1. the real entrypoint used;
2. the real AI callback/provider invocation;
3. the observed arguments and returned/consumed result;
4. the production effect or decision that demonstrates the callback was on the live path;
5. enough civilization/parameter coverage to connect the existing Production evidence to the live seam;
6. exact commands, exit codes, and artifact paths.

## Recovery constraints

- Read the prior defense body and dispatch before acting.
- Inspect the current worktree before editing; preserve all existing changes exactly.
- Never run `git reset`, `git clean`, `git stash`, `git checkout`, `git restore`, `git pull`, merge, push, or deploy.
- Do not modify production source code, matrix data, semantic source-of-truth, or unrelated files.
- If a test harness is required, edits are limited to the existing run-local live-test harness and evidence files under this run directory. Keep the harness disposable and explain every edit.
- No `probeOwner`, fixture-only substitution, direct helper-only proof, static token search, or comments as evidence.
- Do not use credentials, cookies, or external account data.
- Treat missing tools/dependencies as an explicit `INFRA-MISSING` blocker; do not silently fall back to a weaker proof.
- If the real path cannot be reached in the timebox, finish with `FAIL` or `INFRA-MISSING`, the exact blocker, and the next bounded recovery requirement.

## Existing partial state

The first attempt left an untracked run-local harness at:

```text
gra/tools/civ-matrix-production-runtime-live-test.cjs
```

It may be inspected and either completed or replaced in place, but it must not be deleted blindly and no unrelated dirty change may be touched. The previous attempt reported a possible turn-2/runtime hang; diagnose that seam directly and time-box it.

## Acceptance gate

Only a terminal `PASS` is acceptable if the live chain above is evidenced with real execution. Otherwise return a terminal `FAIL`/`INFRA-MISSING` receipt. The task must remain blocked after completion until the owner-facing Final Control is run on a verified Defense result.
