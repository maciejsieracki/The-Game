# 03-dispatch — R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1 — Final Control

STATUS: DISPATCHED
DOMAIN: HANDOFF / INFRA
TEMAT: R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1
ROLE: Final Control
ROUND: 1/5 recovery 1
PARENT: `t_21c15f87` / run833 — independent Evaluator PASS-WITH-NOTES, zero objections
OPERATOR: `t_b5deca1e` / run832 — bounded recovery PASS-WITH-NOTES
ORIGINAL_TIMEOUT: `t_7465f4b4` / run831 — TIMEOUT/GAVE_UP, preserved
BOARD: `the-game-real24`
PROFILE: `default`
PROJECT: `p_9ae9ac64`
TENANT: `the-game`
WORKSPACE: `/home/ubuntu/projects/The-Game-web-1to1-port-handoff-20260920`
BRANCH: `hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920`
BASE/HEAD: `78d494c7a4c6cdbd4dd4db0a663fca0b5d4e3b1e`
IDEMPOTENCY: `R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1:final-control:r1:20260920`

## Goal

Independently close the handoff package for another agent rebuilding the
Rust/Tauri application 1:1 from the original web frontend. Confirm the full
Operator→Evaluator chain, exact repository boundary, manifest/checksum evidence,
process files and push readiness. This Final Control does not implement,
commit, push, merge, package, install or deploy.

## Required checks

1. Confirm the terminal chain:
   `t_7465f4b4/run831 TIMEOUT/GAVE_UP → t_b5deca1e/run832 PASS-WITH-NOTES
   → t_21c15f87/run833 PASS-WITH-NOTES → this Final Control`.
   There are no numbered Evaluator objections, so no Defense is created.
2. Verify the eight handoff documents, three Operator files and their contents;
   manifest totals are `2045` entries / `2034` tracked, category counts match,
   all 2034 listed tracked SHA-256 values match, and `07-CHECKSUMS-SHA256.txt`
   has `2044/2044` verified entries with its own checksum intentionally excluded.
3. Verify phase evidence paths: `00-dispatch.md`, Operator 01 files,
   Evaluator `02-dispatch.md` and 02 files, and this `03-dispatch.md` before
   Final Control writes its three 03 files. Do not count phase dispatches as
   unexpected Operator outputs.
4. Read the plan and acceptance criteria. Confirm the package explicitly says:
   - original web frontend/render/map is `reference_read_only`;
   - current manual Tauri UI/map is `REPLACE_OR_REWIRE`;
   - initial flow requires nine civilizations from canonical data;
   - flat HTML test grid, three hard-coded civs, Unicode placeholders and prior
     playable-slice acceptance are not 1:1 proof;
   - packaging must wait until parity is actually demonstrated.
5. Verify exact base/head/branch and remote refs. Confirm `origin/main` remains
   `f4c89d0081c622c16b207d338b49c8bacafc4553`, staging remains
   `78d494c7a4c6cdbd4dd4db0a663fca0b5d4e3b1e`, and the handoff worktree has no
   product changes, staged paths, generated Cargo.lock, target, logs or other
   unexpected artifacts.
6. Confirm final scope: commit/push is authorized by the owner request but is a
   separate Orchestrator effect after this gate. The handoff branch must not be
   pushed to `main`; target is the dedicated handoff branch only.

## Verdict contract

Return `PASS-WITH-NOTES` with `READY_FOR_HANDOFF_PUSH` only if all checks pass
and no numbered objections exist. Notes must state that this package is a plan,
manifest and handoff for future 1:1 work, not product parity, playable-game
acceptance or deployment. Return `FAIL` with numbered evidence for any mismatch.

Final Control writes only:

- `dyspozycje/autobot/runs/R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1/03-final-control.md`
- `.../03-evidence.json`
- `.../03-transition-receipt.md`

Report `PRODUCT_CHANGE: false`, `COMMIT: false`, `PUSH: false`, `MERGE: false`,
`DEPLOY: false`. Finish with native `kanban_complete` or `kanban_block`.
