# 05-orchestrator-integration — bounded civilization matrix release

STATUS: ORCHESTRATOR INTEGRATION CANDIDATE — PRODUCT COMMIT CREATED
DATE: 2026-09-21
OWNER AUTHORIZATION: owner explicitly ordered both civilization-matrix topics to be finished urgently and everything possible to be introduced into ROBOCZA.
BOARD: the-game-real24
PROFILE: default
PROJECT: p_9ae9ac64
BASE: origin/main=f4c89d0081c622c16b207d338b49c8bacafc4553
WORKTREE: /home/ubuntu/projects/The-Game-civ-matrix-bounded-integration-20260921
BRANCH: hermes/integration/R-CYWILIZACJE-MACIERZ-BOUNDED-Q1-20260921
PRODUCT COMMIT: 1f242606 ([verified] integrate bounded civilization matrix UI)

## Integrated scope

1. `R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1`
   - source gate: `t_72362f60/run894`, Final Control `PASS-WITH-NOTES`;
   - Normal median semantic classifier and 113-row civilization profile UI;
   - 113 parameters × 15 civilizations = 1695 cells;
   - 11 REAL_GAMEPLAY rows, 5 UI_ONLY rows, 97 D_REQUIRED/UNWIRED rows;
   - labels are derived presentation only, not persisted and not gameplay bonuses.

2. `R-CYWILIZACJE-MACIERZ-14-POZOSTALE-Q1`
   - source gate: `t_a1766119/run871`, Operator package `t_89eb5708/run856`;
   - additive artifact package for 14 non-Greece civilizations;
   - 14 × 113 = 1582 coverage cells;
   - workbook, TSV, audit JSON, decision document and process evidence included;
   - no product-code wiring is claimed by the specification package.

## Verification on the clean candidate

- semantic focused test: `PASS 41 / FAIL 0`;
- Greece regression: `PASS 390 / FAIL 0`;
- difficulty regression: `16 passed / 0 failed`;
- TypeScript `tsc --noEmit`: exit 0;
- direct Vite production build: `891` modules, exit 0;
- real Chromium/Playwright flow: main menu → new game → epoch → civilization;
  default profile had 113 rows, 11 active, 102 inactive in one closed details;
  expansion 102; search `meta_epoka` visible 3; negative filter visible 11 and
  all negative; switching to `chinczycy` kept 113 rows; page/console errors 0;
- 14-matrix artifact readback: 1582 rows, 1582 unique civ/parameter pairs,
  14 civilizations, 113 parameters, 10 workbook sheets, all
  `copied_from_greece=false`;
- `node --check` for the semantic test and matrix generator: PASS;
- `git diff --check`: PASS;
- staged allowlist before commit: `27/27` exact;
- product allowlist in commit `1f242606`: 6/6 exact;
- independent pre-commit review: `PASS`, zero security concerns, zero logic
  errors. Non-blocking suggestions were recorded: make neutral-band metadata
  semantics explicit, avoid hard-coded test counts where practical, and retain
  DOM-level coverage. The DOM-level coverage was executed separately on the
  clean candidate with real Chromium and is recorded above.

## Explicit non-claims and holds

- The 97 semantic rows remain `D_REQUIRED/UNWIRED`; no actor, condition,
  formula, precedence or behavior contract was invented.
- The 14-matrix artifact reports `DEAD_UNWIRED=686`, `UNWIRED=672`,
  `REAL_GAMEPLAY=154`, `UI_ONLY=70`; these are evidence classifications, not
  a claim that every matrix value is consumed by runtime.
- Open matrix decisions remain visible: `HIST-14-RESERVE`, `DIFF-TRADE`,
  `DIFF-TRUST`, `WIRE-113`, `ALLOC-14`, and `SOURCE-XLSX`.
- Natural War, Rust/Tauri, server-side Web and unrelated gameplay candidates
  are excluded.
- Existing process-only gates `t_caa67f62` and `t_4e33e15c` remain
  `blocked`, `assignee=null`, without worker/run. They are not dispatched.
- Expected `AUTOBOT-KANBAN.md` is absent (`INFRA`); the declared project
  equivalents and Kanban skills were used and this gap is preserved here.

## Delivery boundary

Product commit `1f242606` exists locally and is one commit ahead of
`origin/main`. No push, merge to `main`, remote publication or ROBOCZA overwrite
has occurred at the time of this receipt. Process evidence and the integration
receipt are intentionally held for a separate explicit receipt commit.

The next legal Orchestrator action is to commit the named process/evidence
paths separately, run the final release build from this exact HEAD, publish the
bounded scope to ROBOCZA, and read back remote `main`, the manifest, hashes,
verifier and HTTP/runtime result. No promotion to KANON or FINALNA is included.
