# 02-dispatch — R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1 — independent Evaluator

STATUS: DISPATCHED
DOMAIN: HANDOFF / INFRA
TEMAT: R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1
ROLE: Evaluator
ROUND: 1/5 recovery 1
PARENT: `t_b5deca1e` / run832 — Operator recovery PASS-WITH-NOTES
ORIGINAL_OPERATOR: `t_7465f4b4` / run831 — TIMEOUT/GAVE_UP, preserved
BOARD: `the-game-real24`
PROFILE: `default`
PROJECT: `p_9ae9ac64`
TENANT: `the-game`
WORKSPACE: `/home/ubuntu/projects/The-Game-web-1to1-port-handoff-20260920`
BRANCH: `hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920`
BASE/HEAD: `78d494c7a4c6cdbd4dd4db0a663fca0b5d4e3b1e`
IDEMPOTENCY: `R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1:evaluator:r1:20260920`

## Goal

Independently decide whether the bounded Operator produced a complete,
fetchable handoff package for a new agent rebuilding the Rust/Tauri frontend
1:1 from the original web game. This is read-only evidence review. It does not
implement, commit, push, merge, package or deploy.

## Required checks

1. Read the original timeout `t_7465f4b4/run831` and recovery `t_b5deca1e/run832`;
   preserve both in the report. Confirm recovery is the same topic and exact
   branch/base, not a silent replacement.
2. Confirm exactly the 11 requested Operator output files exist, plus the explicit
   phase dispatch `00-dispatch.md` and this Evaluator dispatch; no unexpected
   Operator output path was written. Validate all three report/evidence/receipt
   JSON/Markdown files and the eight handoff documents.
3. Parse `handoff/.../02-MANIFEST-PLIKOW.json`. Validate each category's declared
   count against its file list, inventory totals, tracked/untracked policy,
   exact source/head/base/ref values, `reference_read_only` web lane,
   `REPLACE_OR_REWIRE` Tauri lane and nine-civilization requirement.
4. For every listed file with a SHA-256, verify existence and digest against the
   current worktree. Verify every line in `07-CHECKSUMS-SHA256.txt`, including
   paths with spaces. Confirm the 2034 tracked entries and 2045 total entries
   claimed by the Operator.
5. Read the plan, handoff, acceptance criteria, bad-artifact register,
   decisions/risks and download instructions. Check that they explicitly reject
   the current flat HTML map, hard-coded three-civ UI, placeholder/Unicode icons,
   and prior playable-slice acceptance as proof of 1:1 parity.
6. Read the current product source read-only and confirm the handoff's facts:
   current `src-tauri/frontend/main.js` contains the simplified tile renderer
   and limited civ list; reference web contains the data-driven UI and world
   renderer. Do not alter either lane.
7. Check `git status --short`, `git diff --check`, staged paths (none expected),
   primary/remote refs and absence of product changes. Do not run cargo, npm,
   Vite, Tauri, browser or package-manager commands.

## Verdict

- `PASS-WITH-NOTES` only with zero numbered objections and complete digest/path
  evidence; note that this is a handoff package, not product parity or deploy.
- `FAIL` with numbered path/count/hash/content/scope objections otherwise.
- `INFRA` only if the read-only evidence cannot be executed; do not downgrade a
  content mismatch to INFRA.

Evaluator writes only:

- `dyspozycje/autobot/runs/R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1/02-evaluator.md`
- `.../02-evidence.json`
- `.../02-transition-receipt.md`

Finish with native `kanban_complete` or `kanban_block`, reporting
`PRODUCT_CHANGE: false`, `COMMIT: false`, `PUSH: false`, `DEPLOY: false`, and
`NEXT: independent Final Control` when passing.
